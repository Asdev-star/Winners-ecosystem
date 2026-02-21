// Server/routes/adminRoutes.ts

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

function requireSuperAdmin(req: Request, res: Response, next: Function) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  if (!req.user || !adminEmails.includes(req.user.email.toLowerCase())) {
    return res.status(403).json({ message: "Superadmin access required" });
  }
  next();
}

router.get("/stats", authMiddleware, requireSuperAdmin, async (_req: Request, res: Response) => {
  try {
    const [tenants, users, revenue, plans] = await Promise.all([
      db.tenant.findMany({ where: { deletedAt: null }, include: { users: { where: { deletedAt: null } }, revenueRecords: true } }),
      db.user.count({ where: { deletedAt: null } }),
      db.revenueRecord.aggregate({ _sum: { amount: true } }),
      db.tenant.groupBy({ by: ["plan"], _count: { id: true } }),
    ]);
    const now   = new Date();
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const day7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    const revenueByPlan: Record<string, number> = {};
    for (const t of tenants) {
      const total = t.revenueRecords.reduce((s, r) => s + r.amount, 0);
      revenueByPlan[t.plan] = (revenueByPlan[t.plan] ?? 0) + total;
    }
    const recentRevenue = await db.revenueRecord.findMany({ where: { date: { gte: day30 } }, orderBy: { date: "asc" } });
    const revenueByDay: Record<string, number> = {};
    recentRevenue.forEach((r) => {
      const day = new Date(r.date).toISOString().split("T")[0];
      revenueByDay[day] = (revenueByDay[day] ?? 0) + r.amount;
    });
    return res.json({
      totals: { tenants: tenants.length, users, revenue: revenue._sum.amount ?? 0, newThisMonth: tenants.filter((t) => new Date(t.createdAt) >= day30).length, newThisWeek: tenants.filter((t) => new Date(t.createdAt) >= day7).length },
      planDistribution: plans.map((p) => ({ plan: p.plan, count: p._count.id })),
      revenueByDay: Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount })),
      revenueByPlan,
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.get("/tenants", authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const page  = parseInt(String(req.query.page  ?? "1"));
    const limit = parseInt(String(req.query.limit ?? "20"));
    const q     = String(req.query.q ?? "").trim();
    const skip  = (page - 1) * limit;
    const where = q ? { name: { contains: q, mode: "insensitive" as const }, deletedAt: null } : { deletedAt: null };
    const [tenants, total] = await Promise.all([
      db.tenant.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { users: { where: { deletedAt: null }, select: { id: true, name: true, email: true, role: true } }, revenueRecords: { orderBy: { date: "desc" }, take: 1 }, _count: { select: { users: true, revenueRecords: true } } } }),
      db.tenant.count({ where }),
    ]);
    const enriched = await Promise.all(tenants.map(async (t) => {
      const rev = await db.revenueRecord.aggregate({ where: { tenantId: t.id }, _sum: { amount: true } });
      return { ...t, totalRevenue: rev._sum.amount ?? 0 };
    }));
    res.json({ tenants: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.get("/users", authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const page  = parseInt(String(req.query.page  ?? "1"));
    const limit = parseInt(String(req.query.limit ?? "20"));
    const q     = String(req.query.q ?? "").trim();
    const skip  = (page - 1) * limit;
    const where = q ? { deletedAt: null, OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] } : { deletedAt: null };
    const [users, total] = await Promise.all([
      db.user.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { tenant: { select: { name: true, plan: true } } } }),
      db.user.count({ where }),
    ]);
    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.patch("/tenants/:id/plan", authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  const plan = String(req.body.plan ?? "");
  if (!["FREE", "PRO", "ENTERPRISE"].includes(plan)) return res.status(400).json({ message: "Invalid plan" });
  try {
    const id = String(req.params.id);
const tenant = await db.tenant.update({ where: { id }, data: { plan: plan as "FREE" | "PRO" | "ENTERPRISE" } });
    res.json({ tenant });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.delete("/tenants/:id", authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await db.tenant.update({ where: { id }, data: { deletedAt: new Date() } });
    res.json({ message: "Tenant deleted" });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

export default router;