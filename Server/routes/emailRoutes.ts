// server/routes/emailRoutes.ts

import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant, requirePermission } from "../middleware/rbacMiddleware.js";
import {
  sendWeeklyRevenueSummary,
  sendMonthlyFullReport,
  sendAnomalyAlert,
  sendTeamActivityDigest,
  sendBillingInvoiceEmail,
} from "../services/emailService.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);
router.use(requirePermission("exportReports"));

// ─── Helper: get all admin+ emails for tenant ─────────────────────────────────

async function getRecipients(tenantId: string, roles = ["OWNER", "ADMIN"]) {
  const users = await db.user.findMany({
    where:  { tenantId, deletedAt: null, role: { in: roles as any } },
    select: { email: true },
  });
  return users.map((u) => u.email);
}

// ─── POST /email/send/weekly ──────────────────────────────────────────────────

router.post("/send/weekly", async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const to       = req.body.to ?? await getRecipients(tenantId);
    if (!to.length) return res.status(400).json({ message: "No recipients found" });

    await sendWeeklyRevenueSummary(tenantId, to);
    return res.json({ message: "Weekly report sent", recipients: to.length });
  } catch (err: any) {
    console.error("Weekly email error:", err);
    return res.status(500).json({ message: err.message ?? "Failed to send email" });
  }
});

// ─── POST /email/send/monthly ─────────────────────────────────────────────────

router.post("/send/monthly", async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const to       = req.body.to ?? await getRecipients(tenantId);
    if (!to.length) return res.status(400).json({ message: "No recipients found" });

    await sendMonthlyFullReport(tenantId, to);
    return res.json({ message: "Monthly report sent", recipients: to.length });
  } catch (err: any) {
    console.error("Monthly email error:", err);
    return res.status(500).json({ message: err.message ?? "Failed to send email" });
  }
});

// ─── POST /email/send/anomaly ─────────────────────────────────────────────────

router.post("/send/anomaly", async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const to       = req.body.to ?? await getRecipients(tenantId);
    if (!to.length) return res.status(400).json({ message: "No recipients found" });

    const result = await sendAnomalyAlert(tenantId, to);
    if (!result) return res.json({ message: "No anomalies detected — no email sent", anomalies: 0 });

    return res.json({ message: "Anomaly alert sent", recipients: to.length });
  } catch (err: any) {
    console.error("Anomaly email error:", err);
    return res.status(500).json({ message: err.message ?? "Failed to send email" });
  }
});

// ─── POST /email/send/team ────────────────────────────────────────────────────

router.post("/send/team", async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const to       = req.body.to ?? await getRecipients(tenantId);
    if (!to.length) return res.status(400).json({ message: "No recipients found" });

    await sendTeamActivityDigest(tenantId, to);
    return res.json({ message: "Team digest sent", recipients: to.length });
  } catch (err: any) {
    console.error("Team email error:", err);
    return res.status(500).json({ message: err.message ?? "Failed to send email" });
  }
});

// ─── POST /email/send/invoice ─────────────────────────────────────────────────

router.post("/send/invoice", async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const to       = req.body.to ?? await getRecipients(tenantId, ["OWNER"]);
    if (!to.length) return res.status(400).json({ message: "No recipients found" });

    await sendBillingInvoiceEmail(tenantId, to, req.body.invoiceData);
    return res.json({ message: "Invoice sent", recipients: to.length });
  } catch (err: any) {
    console.error("Invoice email error:", err);
    return res.status(500).json({ message: err.message ?? "Failed to send email" });
  }
});

// ─── GET /email/preview ───────────────────────────────────────────────────────

router.get("/status", async (req: Request, res: Response) => {
  const hasKey = !!(process.env.RESEND_API_KEY);
  return res.json({
    configured: hasKey,
    provider:   "Resend",
    from:       process.env.EMAIL_FROM ?? "not set",
    message:    hasKey ? "Email service ready" : "RESEND_API_KEY not configured — emails will fail",
  });
});

export default router;