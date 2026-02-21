// Server/routes/slackRoutes.ts

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { notifyDailySummary, notifyWeeklyReport } from "../services/slackService.js";
import db from "../db.js";

const router = Router();

// GET /slack/status — check which webhooks are configured
router.get("/status", authMiddleware, (_req: Request, res: Response) => {
  res.json({
    revenue: !!process.env.SLACK_WEBHOOK_REVENUE,
    team:    !!process.env.SLACK_WEBHOOK_TEAM,
    billing: !!process.env.SLACK_WEBHOOK_BILLING,
    reports: !!process.env.SLACK_WEBHOOK_REPORTS,
  });
});

// POST /slack/test — send a test message to all configured channels
router.post("/test", authMiddleware, async (req: Request, res: Response) => {
  const { channel } = req.body;
  const tenantName  = req.user!.tenantName ?? "Winners Ecosystem";

  try {
    if (channel === "revenue" || channel === "all") {
      const { notifyNewRevenue } = await import("../services/slackService.js");
      await notifyNewRevenue({ amount: 299, currency: "USD", customer: "Test Customer", source: "Stripe", tenantName });
    }
    if (channel === "team" || channel === "all") {
      const { notifyNewMember } = await import("../services/slackService.js");
      await notifyNewMember({ name: "Test User", email: "test@example.com", role: "member", invitedBy: "Admin", tenantName });
    }
    if (channel === "billing" || channel === "all") {
      const { notifyPlanUpgraded } = await import("../services/slackService.js");
      await notifyPlanUpgraded({ fromPlan: "FREE", toPlan: "PRO", upgradedBy: "Admin", tenantName });
    }
    if (channel === "reports" || channel === "all") {
      await notifyDailySummary({ tenantName, todayRevenue: 1250, currency: "USD", txCount: 8, growthPct: 12.5, topSource: "Stripe" });
    }
    res.json({ message: "Test notification sent" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /slack/daily — manually trigger daily summary
router.post("/daily", authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId   = req.user!.tenantId;
    const tenantName = req.user!.tenantName ?? "Winners Ecosystem";
    const today      = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday  = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

    const [todayRecords, yesterdayRecords] = await Promise.all([
      db.revenueRecord.findMany({ where: { tenantId, date: { gte: today } } }),
      db.revenueRecord.findMany({ where: { tenantId, date: { gte: yesterday, lt: today } } }),
    ]);

    const todayRevenue     = todayRecords.reduce((s, r) => s + r.amount, 0);
    const yesterdayRevenue = yesterdayRecords.reduce((s, r) => s + r.amount, 0);
    const growthPct        = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

    await notifyDailySummary({
      tenantName, todayRevenue, currency: "USD",
      txCount: todayRecords.length, growthPct,
      topSource: todayRecords[0]?.source ?? undefined,
    });

    res.json({ message: "Daily summary sent" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /slack/weekly — manually trigger weekly report
router.post("/weekly", authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId   = req.user!.tenantId;
    const tenantName = req.user!.tenantName ?? "Winners Ecosystem";
    const weekStart  = new Date(); weekStart.setDate(weekStart.getDate() - 7); weekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const [thisWeek, lastWeek] = await Promise.all([
      db.revenueRecord.findMany({ where: { tenantId, date: { gte: weekStart } } }),
      db.revenueRecord.findMany({ where: { tenantId, date: { gte: lastWeekStart, lt: weekStart } } }),
    ]);

    const weekRevenue     = thisWeek.reduce((s, r) => s + r.amount, 0);
    const lastWeekRevenue = lastWeek.reduce((s, r) => s + r.amount, 0);
    const growthPct       = lastWeekRevenue > 0 ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;
    const avgDailyRevenue = weekRevenue / 7;

    // Find best day
    const byDay: Record<string, number> = {};
    thisWeek.forEach((r) => {
      const day = new Date(r.date).toLocaleDateString();
      byDay[day] = (byDay[day] ?? 0) + r.amount;
    });
    const bestDay        = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const bestDayRevenue = byDay[bestDay] ?? 0;

    await notifyWeeklyReport({
      tenantName, weekRevenue, currency: "USD",
      txCount: thisWeek.length, growthPct, avgDailyRevenue, bestDay, bestDayRevenue,
    });

    res.json({ message: "Weekly report sent" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;