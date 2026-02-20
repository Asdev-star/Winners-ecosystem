// Server/routes/stripeRoutes.ts

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";
import {
  syncStripeRevenue,
  getStripeStats,
  createCheckoutSession,
  createPortalSession,
  handleWebhookEvent,
} from "../services/stripeService.js";

const router = Router();

// ─── Webhook (no auth — Stripe calls this directly) ───────────────────────────

router.post("/webhook",
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    try {
      const result = await handleWebhookEvent(req.body, sig);
      return res.json(result);
    } catch (err: any) {
      console.error("Stripe webhook error:", err.message);
      return res.status(400).json({ message: err.message });
    }
  }
);

// ─── Protected routes ─────────────────────────────────────────────────────────

router.use(authMiddleware);
router.use(enforceTenant);

// GET /stripe/stats — Stripe dashboard stats
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = await getStripeStats();
    return res.json(stats);
  } catch (err: any) {
    console.error("Stripe stats error:", err.message);
    return res.status(500).json({ message: err.message });
  }
});

// POST /stripe/sync — Sync Stripe charges to revenue table
router.post("/sync", async (req: Request, res: Response) => {
  try {
    const result = await syncStripeRevenue(req.user!.tenantId);
    return res.json({ message: "Stripe revenue synced", ...result });
  } catch (err: any) {
    console.error("Stripe sync error:", err.message);
    return res.status(500).json({ message: err.message });
  }
});

// POST /stripe/checkout — Create checkout session
router.post("/checkout", async (req: Request, res: Response) => {
  try {
    const { plan } = req.body;
    if (!["PRO", "ENTERPRISE"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const appUrl = process.env.APP_URL ?? "http://localhost:5173";
    const session = await createCheckoutSession({
      plan,
      tenantId:   req.user!.tenantId,
      userId:     req.user!.id,
      email:      req.user!.email,
      successUrl: `${appUrl}/billing?success=true`,
      cancelUrl:  `${appUrl}/billing?cancelled=true`,
    });

    return res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err.message);
    return res.status(500).json({ message: err.message });
  }
});

// POST /stripe/portal — Create billing portal session
router.post("/portal", async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ message: "No customer ID" });

    const appUrl  = process.env.APP_URL ?? "http://localhost:5173";
    const session = await createPortalSession(customerId, `${appUrl}/billing`);
    return res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe portal error:", err.message);
    return res.status(500).json({ message: err.message });
  }
});

// GET /stripe/status — Check if Stripe is configured
router.get("/status", (_req: Request, res: Response) => {
  const configured = !!(process.env.STRIPE_SECRET_KEY);
  return res.json({
    configured,
    mode:    process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "live" : "test",
    message: configured ? "Stripe connected" : "STRIPE_SECRET_KEY not set",
  });
});

export default router;