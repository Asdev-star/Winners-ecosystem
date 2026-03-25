// Server/routes/emailRoutes.ts

import { Role } from "@prisma/client";
import { Router, type Request, type Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant, requirePermission } from "../middleware/rbacMiddleware.js";
import {
  sendAnomalyAlert,
  sendBillingInvoiceEmail,
  sendMonthlyFullReport,
  sendTeamActivityDigest,
  sendWeeklyRevenueSummary,
} from "../services/emailService.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);
router.use(requirePermission("exportReports"));

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to send email";
}

function parseRecipients(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}

async function getRecipients(
  tenantId: string,
  roles: Role[] = [Role.OWNER, Role.ADMIN]
): Promise<string[]> {
  const users = await db.user.findMany({
    where: { tenantId, deletedAt: null, role: { in: roles } },
    select: { email: true },
  });
  return users.map((user) => user.email);
}

router.post("/send/weekly", async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const requested = parseRecipients(req.body?.to);
    const recipients = requested.length > 0 ? requested : await getRecipients(tenantId);
    if (!recipients.length) return res.status(400).json({ message: "No recipients found" });

    await sendWeeklyRevenueSummary(tenantId, recipients);
    return res.json({ message: "Weekly report sent", recipients: recipients.length });
  } catch (error) {
    console.error("Weekly email error:", error);
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/send/monthly", async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const requested = parseRecipients(req.body?.to);
    const recipients = requested.length > 0 ? requested : await getRecipients(tenantId);
    if (!recipients.length) return res.status(400).json({ message: "No recipients found" });

    await sendMonthlyFullReport(tenantId, recipients);
    return res.json({ message: "Monthly report sent", recipients: recipients.length });
  } catch (error) {
    console.error("Monthly email error:", error);
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/send/anomaly", async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const requested = parseRecipients(req.body?.to);
    const recipients = requested.length > 0 ? requested : await getRecipients(tenantId);
    if (!recipients.length) return res.status(400).json({ message: "No recipients found" });

    const result = await sendAnomalyAlert(tenantId, recipients);
    if (!result) return res.json({ message: "No anomalies detected - no email sent", anomalies: 0 });

    return res.json({ message: "Anomaly alert sent", recipients: recipients.length });
  } catch (error) {
    console.error("Anomaly email error:", error);
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/send/team", async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const requested = parseRecipients(req.body?.to);
    const recipients = requested.length > 0 ? requested : await getRecipients(tenantId);
    if (!recipients.length) return res.status(400).json({ message: "No recipients found" });

    await sendTeamActivityDigest(tenantId, recipients);
    return res.json({ message: "Team digest sent", recipients: recipients.length });
  } catch (error) {
    console.error("Team email error:", error);
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/send/invoice", async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const requested = parseRecipients(req.body?.to);
    const recipients =
      requested.length > 0 ? requested : await getRecipients(tenantId, [Role.OWNER]);
    if (!recipients.length) return res.status(400).json({ message: "No recipients found" });

    await sendBillingInvoiceEmail(tenantId, recipients, req.body?.invoiceData);
    return res.json({ message: "Invoice sent", recipients: recipients.length });
  } catch (error) {
    console.error("Invoice email error:", error);
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/status", async (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.RESEND_API_KEY);
  return res.json({
    configured: hasKey,
    provider: "Resend",
    from: process.env.EMAIL_FROM ?? "not set",
    message: hasKey ? "Email service ready" : "RESEND_API_KEY not configured - emails will fail",
  });
});

export default router;
