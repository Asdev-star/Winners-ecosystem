// Server/routes/adminRoutes.ts

import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { superAdminMiddleware } from "../middleware/superAdminMiddleware.js";
import db from "../db.js";

const router = Router();

type PlanTier = "FREE" | "PRO" | "ENTERPRISE";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

// All admin routes use superAdminMiddleware which returns 404 instead of 403
// This prevents revealing that admin functionality exists to unauthorized users

router.get("/access", authMiddleware, superAdminMiddleware, async (_req: Request, res: Response) => {
  return res.json({ ok: true });
});

router.get("/stats", authMiddleware, superAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const [tenants, users, revenue, plans] = await Promise.all([
      db.tenant.findMany({
        where: { deletedAt: null },
        include: { users: { where: { deletedAt: null } }, revenueRecords: true },
      }),
      db.user.count({ where: { deletedAt: null } }),
      db.revenueRecord.aggregate({ _sum: { amount: true } }),
      db.tenant.groupBy({ by: ["plan"], _count: { id: true } }),
    ]);

    const now = new Date();
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const revenueByPlan: Record<string, number> = {};
    for (const tenant of tenants) {
      const total = tenant.revenueRecords.reduce((sum, row) => sum + row.amount, 0);
      revenueByPlan[tenant.plan] = (revenueByPlan[tenant.plan] ?? 0) + total;
    }

    const recentRevenue = await db.revenueRecord.findMany({
      where: { recordedAt: { gte: day30 } },
      orderBy: { recordedAt: "asc" },
    });

    const revenueByDay: Record<string, number> = {};
    recentRevenue.forEach((row) => {
      const day = new Date(row.recordedAt).toISOString().split("T")[0];
      revenueByDay[day] = (revenueByDay[day] ?? 0) + row.amount;
    });

    return res.json({
      totals: {
        tenants: tenants.length,
        users,
        revenue: revenue._sum.amount ?? 0,
        newThisMonth: tenants.filter((tenant) => new Date(tenant.createdAt) >= day30).length,
        newThisWeek: tenants.filter((tenant) => new Date(tenant.createdAt) >= day7).length,
      },
      planDistribution: plans.map((plan) => ({ plan: plan.plan, count: plan._count.id })),
      revenueByDay: Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount })),
      revenueByPlan,
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/tenants", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const page = Number.parseInt(String(req.query.page ?? "1"), 10);
    const limit = Number.parseInt(String(req.query.limit ?? "20"), 10);
    const q = String(req.query.q ?? "").trim();
    const skip = (page - 1) * limit;

    const where = q
      ? { name: { contains: q, mode: "insensitive" as const }, deletedAt: null }
      : { deletedAt: null };

    const [tenants, total] = await Promise.all([
      db.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          users: { where: { deletedAt: null }, select: { id: true, name: true, email: true, role: true } },
          revenueRecords: { orderBy: { recordedAt: "desc" }, take: 1 },
          _count: { select: { users: true, revenueRecords: true } },
        },
      }),
      db.tenant.count({ where }),
    ]);

    const enriched = await Promise.all(
      tenants.map(async (tenant) => {
        const rev = await db.revenueRecord.aggregate({ where: { tenantId: tenant.id }, _sum: { amount: true } });
        return { ...tenant, totalRevenue: rev._sum.amount ?? 0 };
      })
    );

    return res.json({ tenants: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/tenants/:id", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const tenant = await db.tenant.findFirst({
      where: { id, deletedAt: null },
      include: {
        users: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            twoFactorEnabled: true,
          },
        },
        revenueRecords: {
          orderBy: { recordedAt: "desc" },
          take: 12,
        },
        _count: {
          select: {
            users: true,
            revenueRecords: true,
            posts: true,
            groups: true,
            orders: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const now = new Date();
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [lifetimeRevenue, last30Revenue] = await Promise.all([
      db.revenueRecord.aggregate({
        where: { tenantId: tenant.id },
        _sum: { amount: true },
      }),
      db.revenueRecord.aggregate({
        where: { tenantId: tenant.id, recordedAt: { gte: day30 } },
        _sum: { amount: true },
      }),
    ]);

    return res.json({
      tenant: {
        ...tenant,
        totalRevenue: lifetimeRevenue._sum.amount ?? 0,
        last30Revenue: last30Revenue._sum.amount ?? 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/users", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const page = Number.parseInt(String(req.query.page ?? "1"), 10);
    const limit = Number.parseInt(String(req.query.limit ?? "20"), 10);
    const q = String(req.query.q ?? "").trim();
    const skip = (page - 1) * limit;

    const where = q
      ? {
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : { deletedAt: null };

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { tenant: { select: { name: true, plan: true } } },
      }),
      db.user.count({ where }),
    ]);

    return res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/users/:id", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = await db.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            plan: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            posts: true,
            messages: true,
            groupMemberships: true,
            courseEnrollments: true,
            hostedBroadcasts: true,
            hostedLiveSessions: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.patch("/tenants/:id/plan", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  const plan = String(req.body.plan ?? "");
  if (!["FREE", "PRO", "ENTERPRISE"].includes(plan)) {
    return res.status(400).json({ message: "Invalid plan" });
  }

  try {
    const id = String(req.params.id);
    const tenant = await db.tenant.update({
      where: { id },
      data: { plan: plan as PlanTier },
    });
    return res.json({ tenant });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.delete("/tenants/:id", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await db.tenant.update({ where: { id }, data: { deletedAt: new Date() } });
    return res.json({ message: "Tenant deleted" });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

export default router;
