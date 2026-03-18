// Server/routes/adminRoutes.ts

import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { superAdminMiddleware } from "../middleware/superAdminMiddleware.js";
import db from "../db.js";
import { buildForgeBriefingText, getAdminOverviewSnapshot, getLoopsLiveFeed } from "../services/adminOverviewService.js";
import { getRecentAdminSignals } from "../services/adminSignalService.js";
import { recordAdminAction } from "../services/adminAuditService.js";

const router = Router();

type PlanTier = "FREE" | "PRO" | "ENTERPRISE";
type InviteRole = "ADMIN" | "MEMBER" | "VIEWER";

const JWT_SECRET = process.env.JWT_SECRET ?? "winners_dev_secret_change_in_prod";

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
    const day60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const userIds = tenant.users.map((user) => user.id);
    const owner = [...tenant.users].sort((a, b) => (a.role === "OWNER" ? -1 : b.role === "OWNER" ? 1 : 0))[0] ?? null;

    const [
      lifetimeRevenue,
      last30Revenue,
      previous30Revenue,
      userActivityGroups,
      activeLoops,
      loops,
      postCountsByUser,
      enrollmentCountsByUser,
      aiCountsByUser,
      aiCreditsSpent,
      communityPosts,
      academyCertificates,
      intelligenceQueries,
      workApplications,
      topMonthlyTenant,
    ] = await Promise.all([
      db.revenueRecord.aggregate({
        where: { tenantId: tenant.id },
        _sum: { amount: true },
      }),
      db.revenueRecord.aggregate({
        where: { tenantId: tenant.id, recordedAt: { gte: day30 } },
        _sum: { amount: true },
      }),
      db.revenueRecord.aggregate({
        where: { tenantId: tenant.id, recordedAt: { gte: day60, lt: day30 } },
        _sum: { amount: true },
      }),
      db.activityLog.groupBy({
        by: ["userId"],
        where: { tenantId: tenant.id, userId: { not: null } },
        _max: { createdAt: true },
      }),
      db.agenticLoop.count({
        where: { tenantId: tenant.id, status: "active" },
      }),
      db.agenticLoop.findMany({
        where: { tenantId: tenant.id, userId: { in: userIds } },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        select: {
          userId: true,
          currentStep: true,
          status: true,
          steps: true,
          updatedAt: true,
        },
      }),
      db.post.groupBy({
        by: ["authorId"],
        where: { tenantId: tenant.id, deletedAt: null, authorId: { in: userIds } },
        _count: { id: true },
      }),
      db.enrollment.groupBy({
        by: ["userId"],
        where: { tenantId: tenant.id, userId: { in: userIds } },
        _count: { id: true },
      }),
      db.aIInteraction.groupBy({
        by: ["userId"],
        where: { tenantId: tenant.id, userId: { in: userIds } },
        _count: { id: true },
      }),
      db.aICredit.aggregate({
        where: { tenantId: tenant.id, action: "spent" },
        _sum: { amount: true },
      }),
      db.post.count({
        where: { tenantId: tenant.id, deletedAt: null },
      }),
      db.certificate.count({
        where: { tenantId: tenant.id },
      }),
      db.aIInteraction.count({
        where: { tenantId: tenant.id },
      }),
      db.jobApplication.count({
        where: { tenantId: tenant.id },
      }),
      db.revenueRecord.groupBy({
        by: ["tenantId"],
        where: { recordedAt: { gte: day30 } },
        _sum: { amount: true },
        orderBy: {
          _sum: {
            amount: "desc",
          },
        },
        take: 1,
      }),
    ]);

    const activityByUser = new Map(userActivityGroups.map((entry) => [entry.userId ?? "", entry._max.createdAt?.toISOString() ?? null]));
    const postCountMap = new Map(postCountsByUser.map((entry) => [entry.authorId, entry._count.id]));
    const academyCountMap = new Map(enrollmentCountsByUser.map((entry) => [entry.userId, entry._count.id]));
    const aiCountMap = new Map(aiCountsByUser.map((entry) => [entry.userId, entry._count.id]));

    const loopByUser = new Map<
      string,
      {
        currentStep: number;
        status: string;
        steps: unknown;
        updatedAt: Date;
      }
    >();

    for (const loop of loops) {
      if (!loopByUser.has(loop.userId)) {
        loopByUser.set(loop.userId, loop);
      }
    }

    const activeUserCount = tenant.users.filter((user) => {
      const lastActivity = activityByUser.get(user.id);
      return lastActivity ? new Date(lastActivity) >= day30 : false;
    }).length;

    const previous30Amount = previous30Revenue._sum.amount ?? 0;
    const current30Amount = last30Revenue._sum.amount ?? 0;
    const revenueDeltaPct = previous30Amount > 0
      ? Math.round(((current30Amount - previous30Amount) / previous30Amount) * 100)
      : current30Amount > 0
        ? 100
        : 0;

    const isTopTenant = topMonthlyTenant[0]?.tenantId === tenant.id;
    const aiCreditsUsed = Math.abs(aiCreditsSpent._sum.amount ?? 0);

    const usage = {
      community: { label: "posts", value: communityPosts, status: communityPosts > 0 ? "active" : "quiet" },
      academy: { label: "certs", value: academyCertificates, status: academyCertificates > 0 ? "active" : "quiet" },
      intelligence: { label: "queries", value: intelligenceQueries, status: intelligenceQueries > 0 ? "active" : "quiet" },
      work: { label: workApplications > 0 ? "applications" : "awaiting launch", value: workApplications, status: workApplications > 0 ? "active" : "awaiting_launch" },
    };

    const forgeProfile = `${tenant.name} is ${isTopTenant ? "currently your highest-revenue tenant" : activeUserCount >= 8 ? "one of your most engaged tenants" : "an active workspace"}.
${activeUserCount} active users in the last 30 days. Revenue trend is ${revenueDeltaPct >= 0 ? "up" : "down"} ${Math.abs(revenueDeltaPct)}% month-over-month.
${activeLoops} users are in active agentic loops.
Recommendation: ${current30Amount >= 1000 || intelligenceQueries >= 250 ? "offer a custom Enterprise+ tier and proactive success support." : "keep monitoring usage and nudge the workspace toward a higher-touch plan."}`;

    return res.json({
      tenant: {
        ...tenant,
        totalRevenue: lifetimeRevenue._sum.amount ?? 0,
        last30Revenue: last30Revenue._sum.amount ?? 0,
        previous30Revenue: previous30Amount,
        revenueDeltaPct,
        activeUserCount,
        activeLoopCount: activeLoops,
        aiCreditsUsed,
        owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
        forgeProfile,
        usage,
        users: tenant.users.map((user) => {
          const layersUsed = [
            postCountMap.get(user.id) ? "Community" : null,
            academyCountMap.get(user.id) ? "Academy" : null,
            aiCountMap.get(user.id) ? "Intelligence" : null,
          ].filter(Boolean) as string[];

          const loop = loopByUser.get(user.id);
          const steps = Array.isArray(loop?.steps) ? loop.steps : [];
          const latestStep = steps.length ? (steps[steps.length - 1] as { layer?: string; assistant?: string }) : null;
          const loopStage = loop
            ? loop.status === "active"
              ? latestStep?.layer ? `${String(latestStep.layer)} live` : `Step ${loop.currentStep + 1}`
              : "Completed"
            : "No active loop";

          return {
            ...user,
            lastActivityAt: activityByUser.get(user.id) ?? null,
            layersUsed,
            loopStage,
          };
        }),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/tenants/:id/invite", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const role = String(req.body.role ?? "MEMBER").trim().toUpperCase() as InviteRole;

  if (!email || !["ADMIN", "MEMBER", "VIEWER"].includes(role)) {
    return res.status(400).json({ message: "email and a valid role are required" });
  }

  try {
    const tenant = await db.tenant.findFirst({
      where: { id },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const existingUser = await db.user.findFirst({
      where: { email, tenantId: id, deletedAt: null },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists in this workspace" });
    }

    await db.invite.deleteMany({
      where: { email, tenantId: id, accepted: false },
    });

    const invite = await db.invite.create({
      data: {
        tenantId: id,
        email,
        role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await recordAdminAction({
      actor: {
        userId: req.user!.userId,
        tenantId: req.user!.tenantId,
        email: req.user!.email,
      },
      action: "ADMIN_TENANT_INVITE_CREATED",
      summary: `Invited ${email} to ${tenant.name} as ${role}`,
      metadata: {
        tenantId: tenant.id,
        inviteId: invite.id,
        inviteRole: role,
      },
    });

    return res.status(201).json({
      message: "Invite created",
      invite: { ...invite, role: invite.role.toLowerCase() },
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/tenants/:id/forge-message", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const message = String(req.body.message ?? "").trim();

  if (!message) {
    return res.status(400).json({ message: "message is required" });
  }

  try {
    const tenant = await db.tenant.findFirst({
      where: { id },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    await recordAdminAction({
      actor: {
        userId: req.user!.userId,
        tenantId: req.user!.tenantId,
        email: req.user!.email,
      },
      action: "ADMIN_FORGE_MESSAGE_SENT",
      summary: `Sent FORGE message to ${tenant.name}`,
      metadata: {
        tenantId: tenant.id,
        message,
      },
    });

    return res.json({
      message: "FORGE message queued",
      preview: `FORGE → ${tenant.name}: ${message}`,
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/tenants/:id/impersonate", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const reason = String(req.body.reason ?? "").trim();

  try {
    const tenant = await db.tenant.findFirst({
      where: { id },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const owner = await db.user.findFirst({
      where: { tenantId: id, deletedAt: null, role: "OWNER" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
      },
    });

    if (!owner) {
      return res.status(404).json({ message: "No owner account found for this tenant" });
    }

    const impersonationToken = jwt.sign(
      {
        userId: owner.id,
        tenantId: tenant.id,
        tenantName: tenant.name,
        email: owner.email,
        role: owner.role.toLowerCase(),
        isImpersonation: true,
        adminId: req.user!.userId,
      },
      JWT_SECRET,
      { expiresIn: "30m" },
    );

    await recordAdminAction({
      actor: {
        userId: req.user!.userId,
        tenantId: req.user!.tenantId,
        email: req.user!.email,
      },
      action: "ADMIN_TENANT_IMPERSONATED",
      summary: `Impersonated ${tenant.name} as ${owner.email}`,
      metadata: {
        tenantId: tenant.id,
        targetUserId: owner.id,
        reason,
      },
    });

    return res.json({
      impersonationToken,
      expiresIn: 1800,
      user: {
        id: owner.id,
        email: owner.email,
        name: owner.name,
        role: owner.role.toLowerCase(),
        tenantId: owner.tenantId,
        tenantName: tenant.name,
        isImpersonation: true,
        impersonatedByAdminId: req.user!.userId,
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
