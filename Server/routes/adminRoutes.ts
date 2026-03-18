// Server/routes/adminRoutes.ts

import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { superAdminMiddleware } from "../middleware/superAdminMiddleware.js";
import db from "../db.js";
import { buildForgeBriefingText, getAdminOverviewSnapshot, getLoopsLiveFeed } from "../services/adminOverviewService.js";
import { getRecentAdminSignals } from "../services/adminSignalService.js";
import { recordAdminAction } from "../services/adminAuditService.js";

const router = Router();

type PlanTier = "FREE" | "PRO" | "ENTERPRISE";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function streamTextAsSse(res: Response, text: string) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const tokens = text.split(/(\s+)/).filter(Boolean);
  let index = 0;

  const timer = setInterval(() => {
    const token = tokens[index];
    if (!token) {
      res.write("data: [DONE]\n\n");
      clearInterval(timer);
      res.end();
      return;
    }

    res.write(`data: ${JSON.stringify({ token })}\n\n`);
    index += 1;
  }, 26);

  res.on("close", () => {
    clearInterval(timer);
  });
}

// All admin routes use superAdminMiddleware which returns 404 instead of 403
// This prevents revealing that admin functionality exists to unauthorized users

router.get("/access", authMiddleware, superAdminMiddleware, async (_req: Request, res: Response) => {
  return res.json({ ok: true });
});

router.get("/overview", authMiddleware, superAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const snapshot = await getAdminOverviewSnapshot();
    return res.json(snapshot);
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/signals", authMiddleware, superAdminMiddleware, async (_req: Request, res: Response) => {
  return res.json({ signals: getRecentAdminSignals(5) });
});

router.get("/loops/live", authMiddleware, superAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const loops = await getLoopsLiveFeed();
    return res.json(loops);
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/forge/briefing", authMiddleware, superAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const briefing = await buildForgeBriefingText();
    streamTextAsSse(res, briefing);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: errorMessage(error) });
    }
  }
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
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? "20"), 10) || 20));
    const q = String(req.query.q ?? "").trim();
    const plan = String(req.query.plan ?? "ALL").trim().toUpperCase();
    const status = String(req.query.status ?? "ALL").trim().toUpperCase();
    const skip = (page - 1) * limit;
    const validPlans: PlanTier[] = ["FREE", "PRO", "ENTERPRISE"];

    const where: {
      plan?: PlanTier;
      deletedAt?: null | { not: null };
      OR?: Array<Record<string, unknown>>;
    } = {};

    if (validPlans.includes(plan as PlanTier)) {
      where.plan = plan as PlanTier;
    }

    if (status === "ACTIVE") {
      where.deletedAt = null;
    } else if (status === "SUSPENDED") {
      where.deletedAt = { not: null };
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" as const } },
        {
          users: {
            some: {
              deletedAt: null,
              OR: [
                { email: { contains: q, mode: "insensitive" as const } },
                { name: { contains: q, mode: "insensitive" as const } },
              ],
            },
          },
        },
      ];
    }

    const now = new Date();
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const day14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [tenants, total, allTenants, lastActivityGroups, lifetimeRevenueGroups, monthlyRevenueGroups, billingActivitySignals] = await Promise.all([
      db.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ deletedAt: "asc" }, { updatedAt: "desc" }],
        include: {
          users: { where: { deletedAt: null }, select: { id: true, name: true, email: true, role: true } },
        },
      }),
      db.tenant.count({ where }),
      db.tenant.findMany({
        select: { id: true, name: true, plan: true, deletedAt: true, updatedAt: true },
      }),
      db.activityLog.groupBy({
        by: ["tenantId"],
        _max: { createdAt: true },
      }),
      db.revenueRecord.groupBy({
        by: ["tenantId"],
        _sum: { amount: true },
      }),
      db.revenueRecord.groupBy({
        by: ["tenantId"],
        where: { recordedAt: { gte: day30 } },
        _sum: { amount: true },
      }),
      db.activityLog.findMany({
        where: {
          category: "billing",
          action: { in: ["Checkout started", "Plan upgraded"] },
          createdAt: { gte: day7 },
        },
        select: { tenantId: true },
      }),
    ]);

    const roleRank: Record<string, number> = { OWNER: 0, ADMIN: 1, MEMBER: 2, VIEWER: 3 };
    const lastActivityByTenant = new Map(lastActivityGroups.map((entry) => [entry.tenantId, entry._max.createdAt?.toISOString() ?? null]));
    const lifetimeRevenueByTenant = new Map(lifetimeRevenueGroups.map((entry) => [entry.tenantId, entry._sum.amount ?? 0]));
    const monthlyRevenueByTenant = new Map(monthlyRevenueGroups.map((entry) => [entry.tenantId, entry._sum.amount ?? 0]));

    const enriched = tenants.map((tenant) => {
      const owner = [...tenant.users].sort((a, b) => (roleRank[a.role] ?? 99) - (roleRank[b.role] ?? 99))[0] ?? null;
      const lastActivityAt = lastActivityByTenant.get(tenant.id) ?? tenant.updatedAt.toISOString();
      const isSuspended = tenant.deletedAt !== null;

      return {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        deletedAt: tenant.deletedAt,
        status: isSuspended ? "suspended" : "active",
        statusLabel: isSuspended ? "Suspended" : "Active",
        owner: owner ? { name: owner.name, email: owner.email } : null,
        totalRevenue: lifetimeRevenueByTenant.get(tenant.id) ?? 0,
        monthlyRevenue: monthlyRevenueByTenant.get(tenant.id) ?? 0,
        lastActivityAt,
        userCount: tenant.users.length,
        _count: { users: tenant.users.length },
      };
    });

    const planCounts = { FREE: 0, PRO: 0, ENTERPRISE: 0 };
    const statusCounts = { active: 0, suspended: 0 };

    let staleFreeCount = 0;
    let topTenant:
      | {
          id: string;
          name: string;
          plan: PlanTier;
          monthlyRevenue: number;
        }
      | null = null;

    for (const tenant of allTenants) {
      planCounts[tenant.plan] += 1;
      if (tenant.deletedAt) {
        statusCounts.suspended += 1;
      } else {
        statusCounts.active += 1;
      }

      const lastActivity = lastActivityByTenant.get(tenant.id);
      if (!tenant.deletedAt && tenant.plan === "FREE" && (!lastActivity || new Date(lastActivity) <= day14)) {
        staleFreeCount += 1;
      }

      const monthlyRevenue = monthlyRevenueByTenant.get(tenant.id) ?? 0;
      if (!tenant.deletedAt && monthlyRevenue > (topTenant?.monthlyRevenue ?? 0)) {
        topTenant = {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          monthlyRevenue,
        };
      }
    }

    const upgradeSignalsThisWeek = new Set(billingActivitySignals.map((entry) => entry.tenantId)).size
      || allTenants.filter((tenant) => !tenant.deletedAt && tenant.plan !== "FREE" && tenant.updatedAt >= day7).length;

    return res.json({
      tenants: enriched,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      summary: {
        planCounts,
        statusCounts,
        staleFreeCount,
        topTenant,
        upgradeSignalsThisWeek,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/tenants/:id", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const tenant = await db.tenant.findFirst({
      where: { id },
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

router.patch("/tenants/:id/status", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  const rawStatus = String(req.body.status ?? "").trim().toUpperCase();
  if (!["ACTIVE", "SUSPENDED"].includes(rawStatus)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const id = String(req.params.id);
    const tenant = await db.tenant.update({
      where: { id },
      data: { deletedAt: rawStatus === "SUSPENDED" ? new Date() : null },
    });

    await recordAdminAction({
      actor: {
        userId: req.user!.userId,
        tenantId: req.user!.tenantId,
        email: req.user!.email,
      },
      action: rawStatus === "SUSPENDED" ? "ADMIN_TENANT_SUSPENDED" : "ADMIN_TENANT_RESTORED",
      summary: rawStatus === "SUSPENDED" ? `Suspended tenant ${tenant.name}` : `Restored tenant ${tenant.name}`,
      metadata: {
        tenantId: tenant.id,
        status: rawStatus.toLowerCase(),
      },
    });

    return res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        deletedAt: tenant.deletedAt,
        status: tenant.deletedAt ? "suspended" : "active",
      },
    });
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

    await recordAdminAction({
      actor: {
        userId: req.user!.userId,
        tenantId: req.user!.tenantId,
        email: req.user!.email,
      },
      action: "ADMIN_PLAN_CHANGED",
      summary: `Changed ${tenant.name} to the ${tenant.plan} plan`,
      metadata: {
        tenantId: tenant.id,
        plan: tenant.plan,
      },
    });

    return res.json({ tenant });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.delete("/tenants/:id", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const tenant = await db.tenant.update({ where: { id }, data: { deletedAt: new Date() } });

    await recordAdminAction({
      actor: {
        userId: req.user!.userId,
        tenantId: req.user!.tenantId,
        email: req.user!.email,
      },
      action: "ADMIN_TENANT_ARCHIVED",
      summary: `Archived tenant ${tenant.name}`,
      metadata: {
        tenantId: tenant.id,
      },
    });

    return res.json({ message: "Tenant deleted" });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

export default router;
