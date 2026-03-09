// Server/routes/stripeRoutes.ts

import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";
import {
  createCheckoutSession,
  createPortalSession,
  getStripeStats,
  handleWebhookEvent,
  syncStripeRevenue,
} from "../services/stripeService.js";

const router = Router();

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Internal server error";
}

router.post("/webhook", async (req: Request, res: Response) => {
  const signature = typeof req.headers["stripe-signature"] === "string"
    ? req.headers["stripe-signature"]
    : "";

  try {
    const payloadBuffer = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body ?? {}));
    const result = await handleWebhookEvent(payloadBuffer, signature);
    return res.json(result);
  } catch (error) {
    console.error("Stripe webhook error:", errorMessage(error));
    return res.status(400).json({ message: errorMessage(error) });
  }
});

router.use(authMiddleware);
router.use(enforceTenant);

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getStripeStats();
    return res.json(stats);
  } catch (error) {
    console.error("Stripe stats error:", errorMessage(error));
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/sync", async (req: Request, res: Response) => {
  try {
    const result = await syncStripeRevenue(req.user!.tenantId);
    return res.json({ message: "Stripe revenue synced", ...result });
  } catch (error) {
    console.error("Stripe sync error:", errorMessage(error));
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/checkout", async (req: Request, res: Response) => {
  const plan = typeof req.body?.plan === "string" ? req.body.plan : "";
  if (plan !== "PRO" && plan !== "ENTERPRISE") {
    return res.status(400).json({ message: "Invalid plan" });
  }

  try {
    const appUrl = process.env.APP_URL ?? "https://winners-empire-eco.up.railway.app";
    const session = await createCheckoutSession({
      plan,
      tenantId: req.user!.tenantId,
      userId: req.user!.userId,
      email: req.user!.email,
      successUrl: `${appUrl}/billing?success=true`,
      cancelUrl: `${appUrl}/billing?cancelled=true`,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", errorMessage(error));
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/portal", async (req: Request, res: Response) => {
  const customerId = typeof req.body?.customerId === "string" ? req.body.customerId : "";
  if (!customerId) return res.status(400).json({ message: "No customer ID" });

  try {
    const appUrl = process.env.APP_URL ?? "http://localhost:5173";
    const session = await createPortalSession(customerId, `${appUrl}/billing`);
    return res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error:", errorMessage(error));
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/status", (_req: Request, res: Response) => {
  const configured = Boolean(process.env.STRIPE_SECRET_KEY);
  return res.json({
    configured,
    mode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "live" : "test",
    message: configured ? "Stripe connected" : "STRIPE_SECRET_KEY not set",
  });
});

export default router;
