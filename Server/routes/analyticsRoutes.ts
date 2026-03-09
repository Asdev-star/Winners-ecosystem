// server/routes/analyticsRoutes.ts

import { Router, type Request, type Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireMinRole, requirePermission, enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();

router.use(authMiddleware);
router.use(requireMinRole("member"));
router.use(enforceTenant);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcGrowth(current: number, previous: number) {
  if (previous === 0) return 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(1));
}

function periodDays(period: string) {
  return period === "7d" ? 7 : period === "90d" ? 90 : 30;
}

function dateFrom(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isMissingTableError(err: unknown) {
  if (!err || typeof err !== "object") return false;
  const candidate = err as { code?: unknown; message?: unknown };
  return candidate.code === "P2021" || String(candidate.message ?? "").toLowerCase().includes("does not exist");
}

function buildZeroSeries(days: number) {
  const data = [];
  const previous = [];
  for (let i = days - 1; i >= 0; i--) {
    const cur  = new Date(); cur.setDate(cur.getDate() - i);
    const prev = new Date(); prev.setDate(prev.getDate() - i - days);
    data.push({ date: formatDate(cur), revenue: 0, activity: 0 });
    previous.push({ date: formatDate(prev), revenue: 0, activity: 0 });
  }
  return { data, previous };
}

// ─── GET /analytics/revenue?period=30d ───────────────────────────────────────

router.get("/revenue", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const days     = periodDays((req.query.period as string) ?? "30d");
  const period   = req.query.period as string ?? "30d";

  try {
    const [currentRevenue, currentActivity, previousRevenue, previousActivity] = await Promise.all([
      // Current period revenue
      db.revenueRecord.findMany({
        where:   { tenantId, recordedAt: { gte: dateFrom(days) } },
        orderBy: { recordedAt: "asc" },
      }),
      // Current period activity
      db.analyticsEvent.findMany({
        where:   { tenantId, createdAt: { gte: dateFrom(days) } },
        orderBy: { createdAt: "asc" },
      }),
      // Previous period revenue
      db.revenueRecord.findMany({
        where:   { tenantId, recordedAt: { gte: dateFrom(days * 2), lt: dateFrom(days) } },
        orderBy: { recordedAt: "asc" },
      }),
      // Previous period activity
      db.analyticsEvent.findMany({
        where:   { tenantId, createdAt: { gte: dateFrom(days * 2), lt: dateFrom(days) } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Merge revenue + activity by date
    const revenueMap = new Map(currentRevenue.map((r) => [r.recordedAt.toDateString(), r.amount]));
    const prevRevMap = new Map(previousRevenue.map((r) => [r.recordedAt.toDateString(), r.amount]));

    // Analytics events are event-level rows in current schema, so aggregate counts by day.
    const activityMap = currentActivity.reduce((map, e) => {
      const key = e.createdAt.toDateString();
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>());

    const prevActMap = previousActivity.reduce((map, e) => {
      const key = e.createdAt.toDateString();
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>());

    // Build data array aligned to days
    const data     = [];
    const previous = [];

    for (let i = days - 1; i >= 0; i--) {
      const cur  = new Date(); cur.setDate(cur.getDate() - i);  cur.setHours(0,0,0,0);
      const prev = new Date(); prev.setDate(prev.getDate() - i - days); prev.setHours(0,0,0,0);

      data.push({
        date:     formatDate(cur),
        revenue:  revenueMap.get(cur.toDateString())   ?? 0,
        activity: activityMap.get(cur.toDateString())  ?? 0,
      });

      previous.push({
        date:     formatDate(prev),
        revenue:  prevRevMap.get(prev.toDateString())  ?? 0,
        activity: prevActMap.get(prev.toDateString())  ?? 0,
      });
    }

    const curRevTotal  = data.reduce((s, d) => s + d.revenue, 0);
    const prevRevTotal = previous.reduce((s, d) => s + d.revenue, 0);
    const curActTotal  = data.reduce((s, d) => s + d.activity, 0);
    const prevActTotal = previous.reduce((s, d) => s + d.activity, 0);

    return res.json({
      tenantId, period, data, previous,
      summary: {
        totalRevenue:   curRevTotal,
        revenueGrowth:  calcGrowth(curRevTotal, prevRevTotal),
        totalActivity:  curActTotal,
        activityGrowth: calcGrowth(curActTotal, prevActTotal),
      },
    });
  } catch (err) {
    console.error("Analytics revenue error:", err);
    if (isMissingTableError(err)) {
      const fallback = buildZeroSeries(days);
      return res.json({
        tenantId,
        period,
        data: fallback.data,
        previous: fallback.previous,
        summary: {
          totalRevenue: 0,
          revenueGrowth: 0,
          totalActivity: 0,
          activityGrowth: 0,
        },
      });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /analytics/forecast?period=30d ──────────────────────────────────────

router.get("/forecast", requirePermission("viewForecasts"), async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const days     = periodDays((req.query.period as string) ?? "30d");
  const period   = req.query.period as string ?? "30d";

  try {
    const records = await db.revenueRecord.findMany({
      where:   { tenantId, recordedAt: { gte: dateFrom(days) } },
      orderBy: { recordedAt: "asc" },
    });

    const ys = records.map((r) => r.amount);
    const n  = ys.length;

    if (n < 3) return res.json({ tenantId, period, forecast: [] });

    // Linear regression
    const xs    = ys.map((_, i) => i);
    const sumX  = xs.reduce((a, b) => a + b, 0);
    const sumY  = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
    const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const residuals = ys.map((y, i) => y - (slope * i + intercept));
    const stdDev = Math.sqrt(residuals.map((r) => r * r).reduce((a, b) => a + b, 0) / n);

    const forecast = Array.from({ length: 7 }, (_, f) => {
      const xi              = n + f;
      const forecastRevenue = Math.round(slope * xi + intercept);
      const band            = stdDev * 1.2 * (1 + f * 0.08);
      const d               = new Date();
      d.setDate(d.getDate() + f + 1);
      return {
        date:            formatDate(d),
        forecastRevenue,
        upperBound:      Math.round(forecastRevenue + band),
        lowerBound:      Math.round(Math.max(0, forecastRevenue - band)),
      };
    });

    return res.json({ tenantId, period, forecast });
  } catch (err) {
    console.error("Forecast error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /analytics/summary ───────────────────────────────────────────────────

router.get("/summary", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;

  try {
    const [current, previous] = await Promise.all([
      db.revenueRecord.aggregate({ where: { tenantId, recordedAt: { gte: dateFrom(30) } }, _sum: { amount: true } }),
      db.revenueRecord.aggregate({ where: { tenantId, recordedAt: { gte: dateFrom(60), lt: dateFrom(30) } }, _sum: { amount: true } }),
    ]);

    const curRev  = current._sum.amount  ?? 0;
    const prevRev = previous._sum.amount ?? 0;
    const growth  = calcGrowth(curRev, prevRev);

    return res.json({
      tenantId,
      trend:         growth > 2 ? "up" : growth < -2 ? "down" : "flat",
      revenueGrowth: growth,
      topInsight:
        growth > 2
          ? `Revenue is up ${growth}% vs last month — strong momentum.`
          : growth < -2
          ? `Revenue dipped ${Math.abs(growth)}% vs last month — monitor closely.`
          : "Revenue is stable — consistent performance.",
    });
  } catch (err) {
    console.error("Summary error:", err);
    if (isMissingTableError(err)) {
      return res.json({
        tenantId,
        trend: "flat",
        revenueGrowth: 0,
        topInsight: "Revenue analytics will appear after initial data sync.",
      });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
