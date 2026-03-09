// Server/routes/slackRoutes.ts

import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { notifyDailySummary, notifyWeeklyReport } from "../services/slackService.js";
import db from "../db.js";

const router = Router();

type SlackChannel = "revenue" | "team" | "billing" | "reports" | "all";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function parseChannel(value: unknown): SlackChannel {
  if (typeof value !== "string") return "all";
  const normalized = value.toLowerCase();
  if (["revenue", "team", "billing", "reports", "all"].includes(normalized)) {
    return normalized as SlackChannel;
  }
  return "all";
}

// GET /slack/status - check which webhooks are configured
router.get("/status", authMiddleware, (_req: Request, res: Response) => {
  return res.json({
    revenue: Boolean(process.env.SLACK_WEBHOOK_REVENUE),
    team: Boolean(process.env.SLACK_WEBHOOK_TEAM),
    billing: Boolean(process.env.SLACK_WEBHOOK_BILLING),
    reports: Boolean(process.env.SLACK_WEBHOOK_REPORTS),
  });
});

// POST /slack/test - send a test message to configured channels
router.post("/test", authMiddleware, async (req: Request, res: Response) => {
  const channel = parseChannel(req.body?.channel);
  const tenantName = req.user!.tenantName ?? "Winners Ecosystem";

  try {
    if (channel === "revenue" || channel === "all") {
      const { notifyNewRevenue } = await import("../services/slackService.js");
      await notifyNewRevenue({ amount: 299, currency: "USD", customer: "Test Customer", source: "Stripe", tenantName });
    }

    if (channel === "team" || channel === "all") {
      const { notifyNewMember } = await import("../services/slackService.js");
      await notifyNewMember({
        name: "Test User",
        email: "test@example.com",
        role: "member",
        invitedBy: "Admin",
        tenantName,
      });
    }

    if (channel === "billing" || channel === "all") {
      const { notifyPlanUpgraded } = await import("../services/slackService.js");
      await notifyPlanUpgraded({ fromPlan: "FREE", toPlan: "PRO", upgradedBy: "Admin", tenantName });
    }

    if (channel === "reports" || channel === "all") {
      await notifyDailySummary({
        tenantName,
        todayRevenue: 1250,
        currency: "USD",
        txCount: 8,
        growthPct: 12.5,
        topSource: "Stripe",
      });
    }

    return res.json({ message: "Test notification sent" });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

// POST /slack/daily - manually trigger daily summary
router.post("/daily", authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const tenantName = req.user!.tenantName ?? "Winners Ecosystem";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [todayRecords, yesterdayRecords] = await Promise.all([
      db.revenueRecord.findMany({ where: { tenantId, recordedAt: { gte: today } } }),
      db.revenueRecord.findMany({ where: { tenantId, recordedAt: { gte: yesterday, lt: today } } }),
    ]);

    const todayRevenue = todayRecords.reduce((sum, row) => sum + row.amount, 0);
    const yesterdayRevenue = yesterdayRecords.reduce((sum, row) => sum + row.amount, 0);
    const growthPct = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

    await notifyDailySummary({
      tenantName,
      todayRevenue,
      currency: "USD",
      txCount: todayRecords.length,
      growthPct,
      topSource: todayRecords[0]?.source,
    });

    return res.json({ message: "Daily summary sent" });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

// POST /slack/weekly - manually trigger weekly report
router.post("/weekly", authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const tenantName = req.user!.tenantName ?? "Winners Ecosystem";

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const [thisWeek, lastWeek] = await Promise.all([
      db.revenueRecord.findMany({ where: { tenantId, recordedAt: { gte: weekStart } } }),
      db.revenueRecord.findMany({ where: { tenantId, recordedAt: { gte: lastWeekStart, lt: weekStart } } }),
    ]);

    const weekRevenue = thisWeek.reduce((sum, row) => sum + row.amount, 0);
    const lastWeekRevenue = lastWeek.reduce((sum, row) => sum + row.amount, 0);
    const growthPct = lastWeekRevenue > 0 ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;
    const avgDailyRevenue = weekRevenue / 7;

    const byDay: Record<string, number> = {};
    thisWeek.forEach((row) => {
      const day = new Date(row.recordedAt).toLocaleDateString();
      byDay[day] = (byDay[day] ?? 0) + row.amount;
    });

    const bestDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
    const bestDayRevenue = byDay[bestDay] ?? 0;

    await notifyWeeklyReport({
      tenantName,
      weekRevenue,
      currency: "USD",
      txCount: thisWeek.length,
      growthPct,
      avgDailyRevenue,
      bestDay,
      bestDayRevenue,
    });

    return res.json({ message: "Weekly report sent" });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

export default router;

