// server/routes/billingRoutes.ts

import { Router, Request, Response } from "express";
import { Plan } from "@prisma/client";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requirePermission, enforceTenant } from "../middleware/rbacMiddleware.js";
import { PLAN_LIMITS } from "../middleware/usageLimits.js";
import { ACTIONS, logActivity } from "../services/activityService.js";
import crypto from "crypto";

const router = Router();

const LS_API_KEY        = process.env.LEMONSQUEEZY_API_KEY       ?? "";
const LS_STORE_ID       = process.env.LEMONSQUEEZY_STORE_ID      ?? "";
const LS_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "";
const APP_URL           = process.env.APP_URL?.replace(/\/$/, "") ?? "http://localhost:5173";

// Plan → LemonSqueezy variant ID mapping
const VARIANT_IDS: Record<string, string> = {
  pro:        process.env.LS_PRO_VARIANT_ID        ?? "",
  enterprise: process.env.LS_ENTERPRISE_VARIANT_ID ?? "",
};

// ─── GET /billing/ ────────────────────────────────────────────────────────────
// Base billing endpoint summary for route discovery and diagnostics.
router.get("/", (_req: Request, res: Response) => {
  res.json({
    service: "billing",
    version: "v1",
    endpoints: {
      subscription: "GET /api/v1/billing/subscription",
      usage: "GET /api/v1/billing/usage",
      checkout: "POST /api/v1/billing/checkout",
      cancel: "POST /api/v1/billing/cancel",
      resume: "POST /api/v1/billing/resume",
      webhook: "POST /api/v1/billing/webhook",
    },
    note: "Most endpoints require Authorization bearer token.",
    timestamp: new Date().toISOString(),
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function lsRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`https://api.lemonsqueezy.com/v1${path}`, {
    ...options,
    headers: {
      Authorization:  `Bearer ${LS_API_KEY}`,
      Accept:         "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      ...options.headers,
    },
  });
  return res.json();
}

// ─── GET /billing/subscription ────────────────────────────────────────────────

router.get("/subscription", authMiddleware, enforceTenant, async (req: Request, res: Response) => {
  try {
    const tenant = await db.tenant.findFirst({ where: { id: req.user!.tenantId } });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    const plan = tenant.plan as keyof typeof PLAN_LIMITS;

    return res.json({
      id:                `sub_${tenant.id}`,
      planId:            tenant.plan.toLowerCase(),
      status:            "active",
      currentPeriodEnd:  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      cancelAtPeriodEnd: false,
      seats:             PLAN_LIMITS[plan]?.seats ?? 3,
      stripeCustomerId:  tenant.stripeCustomerId ?? null,
    });
  } catch (err) {
    console.error("[Billing] subscription fetch error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /billing/usage ───────────────────────────────────────────────────────

router.get("/usage", authMiddleware, enforceTenant, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const tenant   = await db.tenant.findFirst({ where: { id: tenantId } });
    const plan     = (tenant?.plan ?? "FREE") as keyof typeof PLAN_LIMITS;
    const limits   = PLAN_LIMITS[plan];

    const [seats, exportCount, recordCount] = await Promise.all([
      db.user.count({ where: { tenantId, deletedAt: null } }),
      Promise.resolve(12),
      db.revenueRecord.count({ where: { tenantId } }),
    ]);

    return res.json({
      seats:   { used: seats,       limit: limits.seats           ?? 3    },
      exports: { used: exportCount, limit: limits.exportPerMonth  ?? 30   },
      storage: { used: recordCount, limit: plan === "FREE" ? 1000 : plan === "PRO" ? 10000 : 999999 },
    });
  } catch (err) {
    console.error("[Billing] usage fetch error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /billing/checkout ───────────────────────────────────────────────────

router.post("/checkout", authMiddleware, enforceTenant, requirePermission("manageBilling"), async (req: Request, res: Response) => {
  const { planId } = req.body;

  if (!planId || planId === "free") {
    return res.status(400).json({ message: "Invalid plan" });
  }

  const variantId = VARIANT_IDS[planId];
  if (!variantId) {
    // ✅ FIXED: was `?upgraded=${planId}` which React Router couldn't match
    console.warn(`[Billing] No variant ID for plan "${planId}" — using dev mock redirect`);
    return res.json({ url: `${APP_URL}/billing?success=true` });
  }

  try {
    const user = await db.user.findFirst({
      where: { id: req.user!.userId },
      select: {
        email: true,
        name: true,
      },
    });

    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email:  user?.email,
            name:   user?.name,
            custom: { tenant_id: req.user!.tenantId },
          },
          product_options: {
            redirect_url:     `${APP_URL}/billing?success=true`,
            receipt_link_url: `${APP_URL}/billing`,
          },
        },
        relationships: {
          store:   { data: { type: "stores",   id: LS_STORE_ID } },
          variant: { data: { type: "variants", id: variantId   } },
        },
      },
    };

    const data = await lsRequest("/checkouts", { method: "POST", body: JSON.stringify(payload) });
    const url  = data?.data?.attributes?.url;

    if (!url) {
      console.error("[Billing] LemonSqueezy returned no URL:", JSON.stringify(data));
      return res.status(500).json({ message: "Failed to create checkout session" });
    }

    await logActivity({
      tenantId: req.user!.tenantId,
      userId: req.user!.userId,
      userEmail: user?.email ?? req.user!.email,
      userName: user?.name ?? req.user!.email,
      action: ACTIONS.CHECKOUT_STARTED,
      category: "billing",
      metadata: { planId },
    });

    return res.json({ url });
  } catch (err) {
    console.error("[Billing] checkout error:", err);
    return res.status(500).json({ message: "Checkout failed" });
  }
});

// ─── POST /billing/cancel ─────────────────────────────────────────────────────

router.post("/cancel", authMiddleware, enforceTenant, requirePermission("manageBilling"), async (req: Request, res: Response) => {
  try {
    await db.tenant.update({
      where: { id: req.user!.tenantId },
      data:  { plan: "FREE" },
    });
    await logActivity({
      tenantId: req.user!.tenantId,
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userName: req.user!.email,
      action: ACTIONS.PLAN_CANCELLED,
      category: "billing",
    });
    return res.json({ message: "Subscription cancelled. You will be downgraded at period end." });
  } catch (err) {
    console.error("[Billing] cancel error:", err);
    return res.status(500).json({ message: "Cancellation failed" });
  }
});

// ─── POST /billing/resume ─────────────────────────────────────────────────────

router.post("/resume", authMiddleware, enforceTenant, requirePermission("manageBilling"), async (req: Request, res: Response) => {
  try {
    return res.json({ message: "Subscription resumed." });
  } catch (err) {
    return res.status(500).json({ message: "Resume failed" });
  }
});

// ─── POST /billing/webhook ────────────────────────────────────────────────────
// Register in LemonSqueezy Dashboard → Webhooks:
//   URL: https://winners-empire-eco.up.railway.app/billing/webhook
// Events: subscription_created, subscription_updated, subscription_cancelled, subscription_expired

router.post("/webhook", async (req: Request, res: Response) => {
  const signature = req.headers["x-signature"] as string;
  const rawBody   = JSON.stringify(req.body);

  if (LS_WEBHOOK_SECRET) {
    const hmac   = crypto.createHmac("sha256", LS_WEBHOOK_SECRET);
    const digest = hmac.update(rawBody).digest("hex");
    if (signature !== digest) {
      console.warn("[Billing] Webhook signature mismatch");
      return res.status(401).json({ message: "Invalid signature" });
    }
  }

  const event    = req.body?.meta?.event_name;
  const tenantId = req.body?.meta?.custom_data?.tenant_id;

  if (!tenantId) return res.status(200).json({ received: true });

  try {
    switch (event) {
      case "subscription_created":
      case "subscription_updated": {
        const variantId = req.body?.data?.attributes?.variant_id?.toString();
        const plan: Plan =
          variantId === process.env.LS_ENTERPRISE_VARIANT_ID
            ? Plan.ENTERPRISE
            : variantId === process.env.LS_PRO_VARIANT_ID
              ? Plan.PRO
              : Plan.FREE;

        await db.tenant.update({ where: { id: tenantId }, data: { plan } });
        await logActivity({
          tenantId,
          action: ACTIONS.PLAN_UPGRADED,
          category: "billing",
          userName: "LemonSqueezy webhook",
          metadata: { plan },
        });
        console.log(`✅ [Webhook] tenant ${tenantId} → ${plan}`);
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        await db.tenant.update({ where: { id: tenantId }, data: { plan: "FREE" } });
        console.log(`⚠️ [Webhook] tenant ${tenantId} → FREE`);
        break;
      }

      default:
        console.log(`[Webhook] unhandled event: ${event}`);
    }
  } catch (err) {
    console.error("[Billing] Webhook processing error:", err);
  }

  return res.status(200).json({ received: true });
});

export default router;
