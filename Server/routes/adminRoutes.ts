// Server/routes/adminRoutes.ts
import Anthropic from "@anthropic-ai/sdk";
import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { concealedSuperAdminMiddleware } from "../middleware/superAdminMiddleware.js";
import {
  getAdminOverviewSnapshot,
  getLoopsLiveFeed,
  buildForgeBriefingText,
} from "../services/adminOverviewService.js";
import {
  getPlatformLaunchControlSnapshot,
  getPlatformChecklist,
  getLayerConfirmationText,
  getLayerLaunchSummary,
  getLayerLaunchEffects,
} from "../services/platformLaunchControlService.js";
import {
  getAdminForgeSnapshot,
  getAdminForgeChatContext,
  buildAdminForgeSystemPrompt,
  buildAdminForgeFallbackResponse,
} from "../services/adminForgeService.js";
import { buildAdminForgeInsight } from "../services/adminForgeInsightService.js";
import {
  getAdminRevenueSnapshot,
  sendAdminRevenueReport,
} from "../services/adminRevenueService.js";
import {
  getAdminBroadcastSnapshot,
  sendAdminBroadcast,
  buildAdminBroadcastDraft,
} from "../services/adminBroadcastService.js";
import { getAdminSecuritySnapshot } from "../services/adminSecurityService.js";
import {
  getAdminSystemHealthSnapshot,
  markRlsVerificationNow,
} from "../services/adminSystemHealthService.js";
import { getAdminSubNavSnapshot } from "../services/adminSubNavService.js";
import { recordAdminAction } from "../services/adminAuditService.js";
import { AppRegistry } from "../services/appRegistry.js";
import { recordPlatformLayerStatus } from "../services/platformLayerStatusService.js";

const router = Router();
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const JWT_SECRET = process.env.JWT_SECRET ?? "winners_dev_secret_change_in_prod";
const VALID_TENANT_PLANS = new Set(["FREE", "PRO", "ENTERPRISE"]);
const VALID_TENANT_STATUSES = new Set(["ACTIVE", "SUSPENDED"]);

// --- UTILS ---
const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Unknown error");

const getAdminActor = (req: Request) => ({
  userId: req.user!.userId,
  tenantId: req.user!.tenantId,
  email: req.user!.email,
});

const beginSse = (res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
};

const toAuthRole = (role: string) => {
  const normalized = role.toLowerCase();
  if (normalized === "owner" || normalized === "admin" || normalized === "member" || normalized === "viewer") {
    return normalized as "owner" | "admin" | "member" | "viewer";
  }
  return "member" as const;
};

const serializeImpersonationUser = (
  user:
    | {
        id: string;
        email: string;
        name: string;
        role: string;
        tenantId: string;
        tenant: { name: string };
        twoFactorEnabled: boolean;
        country: string | null;
        city: string | null;
        bio: string | null;
        skills: string[];
        industry: string | null;
        isPublicProfile: boolean;
        profileViews: number;
      }
    | null,
  adminId: string,
) => {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: toAuthRole(user.role),
    tenantId: user.tenantId,
    tenantName: user.tenant.name,
    isImpersonation: true,
    impersonatedByAdminId: adminId,
    twoFactorEnabled: user.twoFactorEnabled,
    country: user.country,
    city: user.city,
    bio: user.bio,
    skills: user.skills,
    industry: user.industry,
    isPublicProfile: user.isPublicProfile,
    profileViews: user.profileViews,
  };
};

const buildTenantWhere = (query: Request["query"]) => {
  const q = String(query.q ?? "").trim();
  const plan = String(query.plan ?? "ALL").toUpperCase();
  const status = String(query.status ?? "ALL").toUpperCase();

  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      {
        users: {
          some: {
            deletedAt: null,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  if (VALID_TENANT_PLANS.has(plan)) {
    where.plan = plan;
  }

  if (status === "ACTIVE") {
    where.deletedAt = null;
  } else if (status === "SUSPENDED") {
    where.deletedAt = { not: null };
  }

  return where;
};

const streamTextAsSse = (res: Response, text: string) => {
  beginSse(res);
  const tokens = text.split(/(\s+)/).filter(Boolean);
  let index = 0;
  const timer = setInterval(() => {
    if (index >= tokens.length) {
      res.write("data: [DONE]\n\n");
      clearInterval(timer);
      res.end();
      return;
    }
    res.write(`data: ${JSON.stringify({ token: tokens[index] })}\n\n`);
    index++;
  }, 26);
  res.on("close", () => clearInterval(timer));
};

// --- MIDDLEWARE ---
router.use(concealedSuperAdminMiddleware);

router.get("/subnav", async (_req, res) => {
  try {
    const snapshot = await getAdminSubNavSnapshot();
    return res.json(snapshot);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

// --- OVERVIEW ---
router.get("/overview", async (_req, res) => {
  try {
    const snapshot = await getAdminOverviewSnapshot();
    return res.json(snapshot);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/loops/live", async (_req, res) => {
  try {
    const loops = await getLoopsLiveFeed();
    return res.json(loops);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

// --- PLATFORM LAUNCH ---
router.get("/platform/status", async (_req, res) => {
  try {
    const control = await getPlatformLaunchControlSnapshot();
    return res.json(control);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/platform/:id/launch", async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmationText } = req.body;
    const layer = AppRegistry.get(id);
    if (!layer) return res.status(404).json({ error: "Layer not found" });

    const checklist = await getPlatformChecklist(id);
    if (!checklist) return res.status(404).json({ error: "Layer not found" });
    if (!checklist.isReady) {
      return res.status(409).json({
        error: `${layer.name} still has ${checklist.blockingCount} blocking checklist issue${checklist.blockingCount === 1 ? "" : "s"}.`,
        checklist,
      });
    }

    const expected = getLayerConfirmationText(id);
    if ((confirmationText ?? "").trim().toUpperCase() !== expected) {
      return res.status(400).json({ error: `Type "${expected}" to confirm activation.` });
    }

    AppRegistry.update(id, { status: "live" });
    await recordPlatformLayerStatus({
      layerId: id,
      layerName: layer.name,
      status: "live",
      actorUserId: req.user!.userId,
      actorEmail: req.user!.email,
      confirmationText: expected,
      summary: getLayerLaunchSummary(id),
      metadata: { launchEffects: getLayerLaunchEffects(id) },
    });

    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_LAYER_LAUNCHED",
      summary: `Activated platform layer for users: ${layer.name}`,
      metadata: { layerId: id },
    });

    return res.json({
      success: true,
      layer: AppRegistry.get(id),
      launchSummary: getLayerLaunchSummary(id),
      launchEffects: getLayerLaunchEffects(id),
    });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/platform/:id/suspend", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const layer = AppRegistry.get(id);
    if (!layer) return res.status(404).json({ error: "Layer not found" });

    AppRegistry.update(id, { status: "suspended" });
    await recordPlatformLayerStatus({
      layerId: id,
      layerName: layer.name,
      status: "suspended",
      actorUserId: req.user!.userId,
      actorEmail: req.user!.email,
      summary: reason || `Suspended ${layer.name}`,
      metadata: { reason },
    });

    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_LAYER_SUSPENDED",
      summary: `Suspended platform layer: ${layer.name}`,
      metadata: { layerId: id, reason },
    });

    return res.json({ success: true, layer: AppRegistry.get(id) });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/platform/:id/checklist", async (req, res) => {
  try {
    const checklist = await getPlatformChecklist(req.params.id);
    if (!checklist) return res.status(404).json({ error: "Layer not found" });
    return res.json(checklist);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/platform/:id/metrics", async (req, res) => {
  try {
    const { id } = req.params;
    const [interactions, errors] = await Promise.all([
      db.aIInteraction.count({ where: { layer: id } }),
      db.activityLog.count({ where: { category: "error", action: { contains: id } } }),
    ]);
    return res.json({ layerId: id, interactions, errors, uptime: "99.9%" });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

// --- FORGE ---
router.get("/forge/panel", async (_req, res) => {
  try {
    const snapshot = await getAdminForgeSnapshot();
    return res.json(snapshot);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/forge/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ message: "message is required" });

    const context = await getAdminForgeChatContext();
    const safeHistory: Array<{ role: "user" | "assistant"; content: string }> = Array.isArray(history)
      ? history.flatMap((entry) => {
          if (!entry || typeof entry !== "object") return [];
          const messageEntry = entry as { role?: unknown; content?: unknown };
          const role: "user" | "assistant" | null =
            messageEntry.role === "assistant" ? "assistant" : messageEntry.role === "user" ? "user" : null;
          const content = typeof messageEntry.content === "string" ? messageEntry.content.trim() : "";
          return role && content ? [{ role, content }] : [];
        })
      : [];

    if (!anthropic) {
      const fallback = await buildAdminForgeFallbackResponse(context, message);
      return streamTextAsSse(res, fallback);
    }

    const system = buildAdminForgeSystemPrompt(context, req.user!.email);
    beginSse(res);

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1400,
      system,
      messages: [...safeHistory, { role: "user", content: message }],
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ token: chunk.delta.text })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/forge/briefing", async (_req, res) => {
  try {
    const briefing = await buildForgeBriefingText();
    streamTextAsSse(res, briefing);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/forge/insight", async (req, res) => {
  try {
    const exclude = Array.isArray(req.query.exclude)
      ? req.query.exclude.filter((value): value is string => typeof value === "string")
      : typeof req.query.exclude === "string"
        ? [req.query.exclude]
        : [];
    const insight = await buildAdminForgeInsight({
      path: typeof req.query.path === "string" ? req.query.path : "/admin/overview",
      seed: typeof req.query.seed === "string" ? req.query.seed : "",
      exclude,
    });
    return res.json(insight);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/forge/page-insight", async (req, res) => {
  try {
    const { path, seed, exclude = [] } = req.body;
    const insight = await buildAdminForgeInsight({ path: path || "/admin/overview", seed: seed || "", exclude });
    return res.json(insight);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/forge/alerts", async (_req, res) => {
  try {
    const snapshot = await getAdminForgeSnapshot();
    return res.json({ alerts: snapshot.alerts, tasks: snapshot.tasks });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

// --- TENANTS ---
router.get("/tenants", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const activeWindowStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const upgradeSignalStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const where = buildTenantWhere(req.query);

    const [matchedTenants, pageTenants] = await Promise.all([
      db.tenant.findMany({
        where,
        select: {
          id: true,
          name: true,
          plan: true,
          deletedAt: true,
        },
      }),
      db.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ deletedAt: "asc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          name: true,
          plan: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          users: {
            where: { role: "OWNER", deletedAt: null },
            select: { id: true, name: true, email: true },
            take: 1,
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
      }),
    ]);

    const matchedTenantIds = matchedTenants.map((tenant) => tenant.id);
    const [
      monthRevenueRows,
      totalRevenueRows,
      recentActivityRows,
      upgradeSignalRows,
    ] = matchedTenantIds.length
      ? await Promise.all([
          db.revenueRecord.groupBy({
            by: ["tenantId"],
            where: {
              tenantId: { in: matchedTenantIds },
              recordedAt: { gte: monthStart },
            },
            _sum: { amount: true },
          }),
          db.revenueRecord.groupBy({
            by: ["tenantId"],
            where: {
              tenantId: { in: matchedTenantIds },
            },
            _sum: { amount: true },
          }),
          db.activityLog.groupBy({
            by: ["tenantId"],
            where: {
              tenantId: { in: matchedTenantIds },
            },
            _max: { createdAt: true },
          }),
          db.activityLog.findMany({
            where: {
              tenantId: { in: matchedTenantIds },
              category: "billing",
              action: { in: ["Checkout started", "Plan upgraded"] },
              createdAt: { gte: upgradeSignalStart },
            },
            select: { tenantId: true },
            distinct: ["tenantId"],
          }),
        ])
      : [[], [], [], []];

    const monthlyRevenueByTenant = new Map(monthRevenueRows.map((row) => [row.tenantId, row._sum.amount ?? 0]));
    const totalRevenueByTenant = new Map(totalRevenueRows.map((row) => [row.tenantId, row._sum.amount ?? 0]));
    const lastActivityByTenant = new Map(
      recentActivityRows
        .filter((row) => typeof row.tenantId === "string")
        .map((row) => [row.tenantId as string, row._max.createdAt?.toISOString() ?? null]),
    );

    const summary = {
      planCounts: {
        FREE: matchedTenants.filter((tenant) => tenant.plan === "FREE").length,
        PRO: matchedTenants.filter((tenant) => tenant.plan === "PRO").length,
        ENTERPRISE: matchedTenants.filter((tenant) => tenant.plan === "ENTERPRISE").length,
      },
      statusCounts: {
        active: matchedTenants.filter((tenant) => !tenant.deletedAt).length,
        suspended: matchedTenants.filter((tenant) => Boolean(tenant.deletedAt)).length,
      },
      staleFreeCount: matchedTenants.filter((tenant) => {
        if (tenant.plan !== "FREE" || tenant.deletedAt) return false;
        const lastActivityIso = lastActivityByTenant.get(tenant.id);
        return !lastActivityIso || new Date(lastActivityIso) < activeWindowStart;
      }).length,
      topTenant: matchedTenants
        .map((tenant) => ({
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          monthlyRevenue: monthlyRevenueByTenant.get(tenant.id) ?? 0,
        }))
        .sort((left, right) => right.monthlyRevenue - left.monthlyRevenue)[0] ?? null,
      upgradeSignalsThisWeek: upgradeSignalRows.length,
    };

    const tenants = pageTenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      plan: tenant.plan,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      deletedAt: tenant.deletedAt,
      status: tenant.deletedAt ? "suspended" : "active",
      statusLabel: tenant.deletedAt ? "Suspended" : "Active",
      totalRevenue: totalRevenueByTenant.get(tenant.id) ?? 0,
      monthlyRevenue: monthlyRevenueByTenant.get(tenant.id) ?? 0,
      lastActivityAt: lastActivityByTenant.get(tenant.id) ?? null,
      owner: tenant.users[0]
        ? {
            name: tenant.users[0].name,
            email: tenant.users[0].email,
          }
        : null,
      userCount: tenant._count.users,
      _count: {
        users: tenant._count.users,
      },
    }));

    const total = matchedTenants.length;
    const pages = Math.max(1, Math.ceil(total / limit));

    return res.json({
      tenants,
      total,
      page,
      pages,
      summary,
    });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/tenants/:id", async (req, res) => {
  try {
    const tenant = await db.tenant.findUnique({ where: { id: req.params.id }, include: { _count: true } });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    return res.json(tenant);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.patch("/tenants/:id/plan", async (req, res) => {
  try {
    const { plan } = req.body;
    if (!["FREE", "PRO", "ENTERPRISE"].includes(plan)) return res.status(400).json({ message: "Invalid plan" });
    const tenant = await db.tenant.update({ where: { id: req.params.id }, data: { plan } });
    await recordAdminAction({ actor: getAdminActor(req), action: "ADMIN_TENANT_PLAN_CHANGED", summary: `Changed ${tenant.name} plan to ${plan}`, metadata: { tenantId: tenant.id, plan } });
    return res.json(tenant);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/tenants/:id/impersonate", async (req, res) => {
  try {
    const { reason } = req.body ?? {};
    const owner = await db.user.findFirst({
      where: { tenantId: req.params.id, role: "OWNER", deletedAt: null },
      include: {
        tenant: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!owner) return res.status(404).json({ message: "No owner found" });
    const token = jwt.sign({ userId: owner.id, tenantId: owner.tenantId, email: owner.email, role: owner.role.toLowerCase(), isImpersonation: true, adminId: req.user!.userId }, JWT_SECRET, { expiresIn: "30m" });
    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_TENANT_IMPERSONATED",
      summary: `Impersonated tenant ${req.params.id} as ${owner.email}`,
      metadata: { tenantId: req.params.id, targetUserId: owner.id, reason: typeof reason === "string" ? reason.trim() : "" },
    });
    const impersonationUser = serializeImpersonationUser(owner, req.user!.userId);
    if (!impersonationUser) {
      return res.status(500).json({ message: "Failed to serialize impersonation user" });
    }
    return res.json({
      token,
      impersonationToken: token,
      expiresIn: 30 * 60,
      user: impersonationUser,
    });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.patch("/tenants/:id/status", async (req, res) => {
  try {
    const status = String(req.body?.status ?? "").toUpperCase();
    if (!VALID_TENANT_STATUSES.has(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const tenant = await db.tenant.update({
      where: { id: req.params.id },
      data: {
        deletedAt: status === "SUSPENDED" ? new Date() : null,
      },
    });

    await recordAdminAction({
      actor: getAdminActor(req),
      action: status === "SUSPENDED" ? "ADMIN_TENANT_SUSPENDED" : "ADMIN_TENANT_RESTORED",
      summary: `${status === "SUSPENDED" ? "Suspended" : "Restored"} tenant: ${tenant.name}`,
      metadata: { tenantId: tenant.id, status },
    });

    return res.json({
      message: status === "SUSPENDED" ? "Tenant suspended" : "Tenant restored",
      tenant,
      status: status === "SUSPENDED" ? "suspended" : "active",
    });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/tenants/:id/suspend", async (req, res) => {
  try {
    const tenant = await db.tenant.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    await recordAdminAction({ actor: getAdminActor(req), action: "ADMIN_TENANT_SUSPENDED", summary: `Suspended tenant: ${tenant.name}`, metadata: { tenantId: tenant.id } });
    return res.json({ message: "Tenant suspended", tenant });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.delete("/tenants/:id", async (req, res) => {
  try {
    const tenant = await db.tenant.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    await recordAdminAction({ actor: getAdminActor(req), action: "ADMIN_TENANT_DELETED", summary: `Soft deleted tenant: ${tenant.name} (GDPR)`, metadata: { tenantId: tenant.id } });
    return res.json({ message: "Tenant soft deleted" });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/tenants/:id/users", async (req, res) => {
  try {
    const users = await db.user.findMany({ where: { tenantId: req.params.id, deletedAt: null }, orderBy: { createdAt: "desc" } });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/tenants/:id/loops", async (req, res) => {
  try {
    const loops = await db.agenticLoop.findMany({ where: { tenantId: req.params.id }, orderBy: { updatedAt: "desc" } });
    return res.json(loops);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

// --- USERS ---
router.get("/users", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const q = String(req.query.q || "").trim();
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (q) {
      where.OR = [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({ where, skip, take: limit, orderBy: { trustScore: "desc" }, include: { tenant: { select: { name: true } } } }),
      db.user.count({ where }),
    ]);

    return res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.params.id }, include: { tenant: true, _count: true } });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["MEMBER", "ADMIN", "OWNER"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    const user = await db.user.update({ where: { id: req.params.id }, data: { role } });
    await recordAdminAction({ actor: getAdminActor(req), action: "ADMIN_USER_ROLE_CHANGED", summary: `Changed ${user.email} role to ${role}`, metadata: { targetUserId: user.id, role } });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/users/:id/suspend", async (req, res) => {
  try {
    const user = await db.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    await recordAdminAction({ actor: getAdminActor(req), action: "ADMIN_USER_SUSPENDED", summary: `Suspended user: ${user.email}`, metadata: { targetUserId: user.id } });
    return res.json({ message: "User suspended", user });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const user = await db.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    await recordAdminAction({ actor: getAdminActor(req), action: "ADMIN_USER_DELETED", summary: `GDPR delete for user: ${user.email}`, metadata: { targetUserId: user.id } });
    return res.json({ message: "User soft deleted (GDPR)" });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/users/:id/timeline", async (req, res) => {
  try {
    const activity = await db.activityLog.findMany({ where: { userId: req.params.id }, orderBy: { createdAt: "desc" }, take: 50 });
    return res.json(activity);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/users/:id/loops", async (req, res) => {
  try {
    const loops = await db.agenticLoop.findMany({ where: { userId: req.params.id }, orderBy: { updatedAt: "desc" } });
    return res.json(loops);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

// --- REVENUE ---
router.get("/revenue/summary", async (_req, res) => {
  try {
    const snapshot = await getAdminRevenueSnapshot();
    return res.json({
      mrr: snapshot.kpis.mrr,
      arr: snapshot.kpis.arr,
      growthPct: snapshot.kpis.growthPct,
      layers: snapshot.layers,
    });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/revenue/chart", async (_req, res) => {
  try {
    const snapshot = await getAdminRevenueSnapshot();
    return res.json(snapshot.chart.series);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/revenue/forecast", async (_req, res) => {
  try {
    const snapshot = await getAdminRevenueSnapshot();
    return res.json({ forecast90d: snapshot.kpis.marketForecast90d });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/revenue/report", async (req, res) => {
  try {
    const snapshot = await getAdminRevenueSnapshot();
    const recipients = req.body.to || snapshot.exports.adminRecipients;
    await sendAdminRevenueReport(snapshot, recipients);
    await recordAdminAction({ actor: getAdminActor(req), action: "ADMIN_REVENUE_REPORT_SENT", summary: `Revenue report sent to ${recipients.join(", ")}`, metadata: { recipients } });
    return res.json({ message: "Report sent" });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

// --- BROADCAST ---
router.get("/broadcasts", async (_req, res) => {
  try {
    const snapshot = await getAdminBroadcastSnapshot();
    return res.json(snapshot.recentBroadcasts);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/broadcasts", async (req, res) => {
  try {
    const { channels, message, audienceKind, plan, layerId } = req.body;
    const result = await sendAdminBroadcast({
      actorTenantId: req.user!.tenantId,
      audience: { kind: audienceKind || "all", plan, layerId },
      channels: channels || ["in_app"],
      message,
    });
    await recordAdminAction({ actor: getAdminActor(req), action: "ADMIN_BROADCAST_SENT", summary: `Broadcast sent to ${result.recipients} users`, metadata: { result } });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/broadcasts/draft", async (req, res) => {
  try {
    const { audienceKind, plan, layerId } = req.body;
    const draft = await buildAdminBroadcastDraft({ kind: audienceKind || "all", plan, layerId });
    return res.json({ message: draft });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

// --- SECURITY ---
router.get("/security/status", async (_req, res) => {
  try {
    const snapshot = await getAdminSecuritySnapshot();
    return res.json(snapshot);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/security/rls/verify", async (req, res) => {
  try {
    const verification = await markRlsVerificationNow();
    await recordAdminAction({ actor: getAdminActor(req), action: "ADMIN_RLS_VERIFIED", summary: "Triggered RLS verification", metadata: { verifiedAt: verification.verifiedAt } });
    return res.json(verification);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/audit-log", async (_req, res) => {
  try {
    const logs = await db.activityLog.findMany({ where: { category: "admin" }, orderBy: { createdAt: "desc" }, take: 100 });
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

// --- HEALTH ---
router.get("/health", async (_req, res) => {
  try {
    const snapshot = await getAdminSystemHealthSnapshot();
    return res.json(snapshot);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/health/errors", async (_req, res) => {
  try {
    const errors = await db.activityLog.findMany({ where: { category: "error" }, orderBy: { createdAt: "desc" }, take: 50 });
    return res.json(errors);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

export default router;
