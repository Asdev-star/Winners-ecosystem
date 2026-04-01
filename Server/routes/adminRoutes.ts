// Server/routes/adminRoutes.ts
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
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
  type BroadcastScheduleMode,
  type BroadcastType,
} from "../services/adminBroadcastService.js";
import { getAdminSecuritySnapshot } from "../services/adminSecurityService.js";
import {
  buildAdminCoreSettingsAskResponse,
  getAdminCoreSettingsAutoMode,
  getAdminCoreSettingsRecommendation,
  getAdminCoreSettingsSnapshot,
} from "../services/adminCoreSettingsService.js";
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
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";
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

const TRUST_TIER_LABELS = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
} as const;

const deriveTrustTier = (score: number) => {
  if (score <= 30) return "bronze" as const;
  if (score <= 60) return "silver" as const;
  if (score <= 85) return "gold" as const;
  return "platinum" as const;
};

const deriveLoopStage = (signals: {
  enrollments: number;
  certificates: number;
  orders: number;
  jobApplications: number;
  aiInteractions: number;
}) => {
  if (signals.orders > 0 || signals.jobApplications > 0) return "Monetizing";
  if (signals.certificates > 0) return "Certified";
  if (signals.enrollments > 0) return "Learning";
  if (signals.aiInteractions > 0) return "Guided";
  return "Orientation";
};

const deriveLayerCount = (signals: {
  posts: number;
  enrollments: number;
  certificates: number;
  orders: number;
  jobApplications: number;
  aiInteractions: number;
  socialAccounts: number;
}) =>
  [
    signals.posts > 0,
    signals.enrollments > 0 || signals.certificates > 0,
    signals.orders > 0,
    signals.jobApplications > 0,
    signals.aiInteractions > 0,
    signals.socialAccounts > 0,
  ].filter(Boolean).length;

const toTimelineLayer = (category: string) => {
  const normalized = category.toLowerCase();
  if (normalized.includes("academy")) return "Academy";
  if (normalized.includes("market") || normalized.includes("order")) return "Market";
  if (normalized.includes("work") || normalized.includes("job")) return "Work";
  if (normalized.includes("community") || normalized.includes("social")) return "Community";
  if (normalized.includes("security") || normalized.includes("auth")) return "Security";
  if (normalized.includes("ai") || normalized.includes("intelligence")) return "Intelligence";
  return "Core";
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

const handleForgeChat = async (req: Request, res: Response) => {
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
};

const handleTenantImpersonation = async (req: Request, res: Response, tenantId: string) => {
  const { reason } = req.body ?? {};
  const owner = await db.user.findFirst({
    where: { tenantId, role: "OWNER", deletedAt: null },
    include: {
      tenant: {
        select: {
          name: true,
        },
      },
    },
  });
  if (!owner) return res.status(404).json({ message: "No owner found" });
  const token = jwt.sign(
    {
      userId: owner.id,
      tenantId: owner.tenantId,
      email: owner.email,
      role: owner.role.toLowerCase(),
      isImpersonation: true,
      adminId: req.user!.userId,
    },
    JWT_SECRET,
    { expiresIn: "30m" },
  );
  await recordAdminAction({
    actor: getAdminActor(req),
    action: "ADMIN_TENANT_IMPERSONATED",
    summary: `Impersonated tenant ${tenantId} as ${owner.email}`,
    metadata: { tenantId, targetUserId: owner.id, reason: typeof reason === "string" ? reason.trim() : "" },
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
};

const handleBroadcastCreate = async (req: Request, res: Response) => {
  const { channels, message, body, title, ctaLabel, ctaUrl, audienceKind, plan, layerId, segment, broadcastType, scheduleMode, scheduleAt } = req.body;
  const result = await sendAdminBroadcast({
    actorTenantId: req.user!.tenantId,
    audience:
      audienceKind === "plan"
        ? { kind: "plan", plan }
        : audienceKind === "layer"
          ? { kind: "layer", layerId }
          : audienceKind === "segment"
            ? { kind: "segment", segment }
            : { kind: "all" },
    channels: channels || ["in_app"],
    title,
    body: body || message,
    ctaLabel,
    ctaUrl,
    broadcastType: broadcastType as BroadcastType | undefined,
    scheduleMode: scheduleMode as BroadcastScheduleMode | undefined,
    scheduleAt,
  });
  await recordAdminAction({
    actor: getAdminActor(req),
    action: "ADMIN_BROADCAST_SENT",
    summary: `Broadcast sent to ${result.recipients} users`,
    metadata: { ...result, audienceKind, plan, layerId, segment, title, ctaLabel, ctaUrl, broadcastType, scheduleMode, scheduleAt, message: body || message },
  });
  return res.json(result);
};

// --- MIDDLEWARE ---
router.use(concealedSuperAdminMiddleware);

router.get("/access", (_req, res) => {
  return res.json({ ok: true, realm: "admin" });
});

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

router.get("/stats", async (_req, res) => {
  try {
    const snapshot = await getAdminOverviewSnapshot();
    return res.json(snapshot.kpis);
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
    return await handleForgeChat(req, res);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/forge/ask", async (req, res) => {
  try {
    return await handleForgeChat(req, res);
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

// --- CORE SETTINGS (EXPERIMENTAL) ---
router.get("/settings/core", async (_req, res) => {
  try {
    const snapshot = await getAdminCoreSettingsSnapshot();
    return res.json(snapshot);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/settings/core/recommendations/:id/apply", async (req, res) => {
  try {
    const recommendation = getAdminCoreSettingsRecommendation(req.params.id);
    if (!recommendation) return res.status(404).json({ message: "Recommendation not found" });

    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_FORGE_SETTINGS_RECOMMENDATION_APPLIED",
      summary: `Applied FORGE recommendation: ${recommendation.title}`,
      metadata: { recommendationId: recommendation.id, category: recommendation.category },
    });

    return res.json({ ok: true, recommendation });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/settings/core/recommendations/:id/dismiss", async (req, res) => {
  try {
    const recommendation = getAdminCoreSettingsRecommendation(req.params.id);
    if (!recommendation) return res.status(404).json({ message: "Recommendation not found" });

    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_FORGE_SETTINGS_RECOMMENDATION_DISMISSED",
      summary: `Dismissed FORGE recommendation: ${recommendation.title}`,
      metadata: { recommendationId: recommendation.id, category: recommendation.category },
    });

    return res.json({ ok: true, recommendation });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/settings/core/auto", async (req, res) => {
  try {
    const { modeKey, enabled } = req.body ?? {};
    if (typeof modeKey !== "string" || typeof enabled !== "boolean") {
      return res.status(400).json({ message: "modeKey and enabled are required" });
    }
    const mode = getAdminCoreSettingsAutoMode(modeKey);
    if (!mode) return res.status(404).json({ message: "Auto mode not found" });

    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_FORGE_SETTINGS_AUTO_MODE_SET",
      summary: `Set auto-mode ${modeKey} to ${enabled ? "ON" : "OFF"}`,
      metadata: { modeKey, enabled },
    });

    return res.json({ ok: true, modeKey, enabled });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/settings/core/ask", async (req, res) => {
  try {
    const question = String(req.body?.question ?? "").trim();
    if (!question) return res.status(400).json({ message: "question is required" });
    const answer = await buildAdminCoreSettingsAskResponse(question);
    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_FORGE_SETTINGS_ASKED",
      summary: "Asked FORGE about core settings",
      metadata: { question },
    });
    return res.json({ question, answer });
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
    return await handleTenantImpersonation(req, res, req.params.id);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/impersonate/:tenantId", async (req, res) => {
  try {
    return await handleTenantImpersonation(req, res, req.params.tenantId);
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
    const filter = String(req.query.filter || "all").trim().toLowerCase();
    const skip = (page - 1) * limit;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const where: any = { deletedAt: null };
    if (q) {
      where.OR = [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }];
    }
    if (filter === "active7d") where.updatedAt = { gte: sevenDaysAgo };
    if (filter === "new30d") where.createdAt = { gte: thirtyDaysAgo };
    if (filter === "lowtrust") where.trustScore = { lte: 30 };
    if (filter === "admins") where.role = { in: ["ADMIN", "OWNER"] };

    const flaggedUsers = await db.activityLog.groupBy({
      by: ["userId"],
      where: {
        userId: { not: null },
        OR: [
          { category: { contains: "moderation", mode: "insensitive" } },
          { action: { contains: "FLAG", mode: "insensitive" } },
        ],
      },
      _count: { userId: true },
    });

    const flaggedUserIds = flaggedUsers.map((entry) => entry.userId).filter((value): value is string => Boolean(value));
    if (filter === "flagged") {
      where.id = flaggedUserIds.length ? { in: flaggedUserIds } : "__none__";
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ trustScore: "desc" }, { updatedAt: "desc" }],
        include: {
          tenant: { select: { id: true, name: true, plan: true, createdAt: true } },
          _count: {
            select: {
              posts: true,
              courseEnrollments: true,
              courseCertificates: true,
              orders: true,
              socialAccounts: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    const userIds = users.map((user) => user.id);
    const [completedLoops, aiInteractionCounts] = await Promise.all([
      userIds.length
        ? db.agenticLoop.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds }, status: { in: ["completed", "COMPLETED"] } },
            _count: { userId: true },
          })
        : Promise.resolve([]),
      userIds.length
        ? db.aIInteraction.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
            _count: { userId: true },
          })
        : Promise.resolve([]),
    ]);

    const completedLoopIds = new Set(completedLoops.map((entry) => entry.userId));
    const aiInteractionMap = new Map(aiInteractionCounts.map((entry) => [entry.userId, entry._count.userId]));
    const flaggedSet = new Set(flaggedUserIds);

    const enrichedUsers = users.map((user) => {
      const signals = {
        posts: user._count.posts,
        enrollments: user._count.courseEnrollments,
        certificates: user._count.courseCertificates,
        orders: user._count.orders,
        jobApplications: 0,
        aiInteractions: aiInteractionMap.get(user.id) ?? 0,
        socialAccounts: user._count.socialAccounts,
      };
      const trustTier = deriveTrustTier(user.trustScore);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        trustScore: user.trustScore,
        trustScoreTier: TRUST_TIER_LABELS[trustTier],
        plan: user.tenant.plan,
        layersActive: deriveLayerCount(signals),
        lastSeen: user.updatedAt,
        isSuspended: Boolean(user.deletedAt),
        active7d: user.updatedAt >= sevenDaysAgo,
        isFlagged: flaggedSet.has(user.id),
        completedFirstLoop: completedLoopIds.has(user.id),
        twoFactorEnabled: user.twoFactorEnabled,
        tenant: user.tenant,
      };
    });

    const [allUsersCount, active7dCount, new30dCount, lowTrustCount, adminCount, completedLoopUsers, totalUsers] = await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.user.count({ where: { deletedAt: null, updatedAt: { gte: sevenDaysAgo } } }),
      db.user.count({ where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } } }),
      db.user.count({ where: { deletedAt: null, trustScore: { lte: 30 } } }),
      db.user.count({ where: { deletedAt: null, role: { in: ["ADMIN", "OWNER"] } } }),
      db.agenticLoop.groupBy({
        by: ["userId"],
        where: { status: { in: ["completed", "COMPLETED"] } },
        _count: { userId: true },
      }),
      db.user.count({ where: { deletedAt: null } }),
    ]);

    return res.json({
      users: enrichedUsers,
      total,
      page,
      pages: Math.ceil(total / limit),
      summary: {
        active7dCount,
        flaggedPostsCount: flaggedUserIds.length,
        firstLoopCompletionCount: completedLoopUsers.length,
        lowTrustPercentage: totalUsers ? Math.round((lowTrustCount / totalUsers) * 100) : 0,
        quickCounts: {
          all: allUsersCount,
          active7d: active7dCount,
          new30d: new30dCount,
          lowtrust: lowTrustCount,
          flagged: flaggedUserIds.length,
          admins: adminCount,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const user = await db.user.findUnique({
      where: { id: req.params.id },
      include: {
        tenant: { select: { id: true, name: true, plan: true, createdAt: true } },
        _count: {
          select: {
            posts: true,
            courseCertificates: true,
            courseEnrollments: true,
            orders: true,
          },
        },
      },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const [latestPost, loops, aiUsageRows, timelineRows, aiCredits, recentPosts, activeLoops, completedLoops, moderationRows, jobApplicationsCount] = await Promise.all([
      db.post.findFirst({
        where: { authorId: user.id, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      db.agenticLoop.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        take: 24,
      }),
      db.aIInteraction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { agentType: true, tokens: true, cost: true },
        take: 200,
      }),
      db.activityLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      db.aICredit.aggregate({
        where: { userId: user.id },
        _sum: { amount: true },
      }),
      db.post.count({
        where: { authorId: user.id, createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
      }),
      db.agenticLoop.count({ where: { userId: user.id, status: { notIn: ["completed", "COMPLETED", "failed", "FAILED"] } } }),
      db.agenticLoop.count({ where: { userId: user.id, status: { in: ["completed", "COMPLETED"] } } }),
      db.activityLog.findMany({
        where: {
          userId: user.id,
          OR: [
            { category: { contains: "moderation", mode: "insensitive" } },
            { action: { contains: "FLAG", mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      db.jobApplication.count({ where: { freelancer: { userId: user.id } } }),
    ]);

    const aiUsageMap = aiUsageRows.reduce(
      (acc, row) => {
        const current = acc.get(row.agentType) ?? { agentType: row.agentType, interactions: 0, tokens: 0, cost: 0 };
        current.interactions += 1;
        current.tokens += row.tokens ?? 0;
        current.cost += row.cost ?? 0;
        acc.set(row.agentType, current);
        return acc;
      },
      new Map<string, { agentType: string; interactions: number; tokens: number; cost: number }>(),
    );

    const signals = {
      enrollments: user._count.courseEnrollments,
      certificates: user._count.courseCertificates,
      orders: user._count.orders,
      jobApplications: jobApplicationsCount,
      aiInteractions: aiUsageRows.length,
    };

    const loopStage = deriveLoopStage(signals);
    const trustTier = deriveTrustTier(user.trustScore);
    const aiCreditsUsed = Math.abs(aiCredits._sum.amount ?? 0);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        deletedAt: user.deletedAt,
        twoFactorEnabled: user.twoFactorEnabled,
        country: user.country,
        city: user.city,
        bio: user.bio,
        skills: user.skills,
        industry: user.industry,
        isPublicProfile: user.isPublicProfile,
        profileViews: user.profileViews,
        trustScore: user.trustScore,
        trustScoreTier: TRUST_TIER_LABELS[trustTier],
        trustScoreUpdatedAt: user.trustScoreUpdatedAt,
        plan: user.tenant.plan,
        lastPostAt: latestPost?.createdAt?.toISOString() ?? null,
        loopStage,
        forgeProfile: `${user.name} is currently in the ${TRUST_TIER_LABELS[trustTier]} trust tier with ${deriveLayerCount({
          posts: user._count.posts,
          enrollments: user._count.courseEnrollments,
          certificates: user._count.courseCertificates,
          orders: user._count.orders,
          jobApplications: jobApplicationsCount,
          aiInteractions: aiUsageRows.length,
          socialAccounts: 0,
        })} active ecosystem layer${deriveLayerCount({
          posts: user._count.posts,
          enrollments: user._count.courseEnrollments,
          certificates: user._count.courseCertificates,
          orders: user._count.orders,
          jobApplications: jobApplicationsCount,
          aiInteractions: aiUsageRows.length,
          socialAccounts: 0,
        }) === 1 ? "" : "s"}. Recommend ${user.trustScore <= 30 ? "recovery outreach and guided Academy progression" : user.trustScore >= 85 ? "advocate activation and referral capture" : "steady progression toward higher-value loops"}.`,
        tenant: user.tenant,
        stats: {
          activeLoops,
          completedLoops,
          aiCreditsUsed,
          recentCommunityPosts: recentPosts,
          aiInteractions: aiUsageRows.length,
          certificates: user._count.courseCertificates,
          enrollments: user._count.courseEnrollments,
          jobApplications: jobApplicationsCount,
          flaggedPosts: moderationRows.length,
          last7dActive: user.updatedAt >= sevenDaysAgo,
        },
        moderation: {
          flaggedPosts: moderationRows.length,
          items: moderationRows.map((entry) => ({
            id: entry.id,
            description: entry.action,
            status: entry.category,
            targetId: null,
            createdAt: entry.createdAt.toISOString(),
          })),
        },
        loops: loops.map((loop) => ({
          ...loop,
          loopStage: loop.status.toLowerCase() === "completed" ? "Completed" : `Step ${loop.currentStep}`,
        })),
        aiUsage: [...aiUsageMap.values()].sort((left, right) => right.interactions - left.interactions),
        timeline: timelineRows.map((entry) => ({
          id: entry.id,
          timestamp: entry.createdAt.toISOString(),
          layer: toTimelineLayer(entry.category),
          type: entry.category,
          title: entry.action.replace(/_/g, " "),
          description: entry.userEmail ? `${entry.action} recorded for ${entry.userEmail}.` : `${entry.action} recorded in ${entry.category}.`,
        })),
      },
    });
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

router.patch("/users/:id/plan", async (req, res) => {
  try {
    const { plan } = req.body;
    if (!VALID_TENANT_PLANS.has(plan)) return res.status(400).json({ message: "Invalid plan" });
    const user = await db.user.findUnique({ where: { id: req.params.id }, include: { tenant: true } });
    if (!user) return res.status(404).json({ message: "User not found" });
    const tenant = await db.tenant.update({ where: { id: user.tenantId }, data: { plan } });
    await recordAdminAction({ actor: getAdminActor(req), action: "ADMIN_USER_PLAN_CHANGED", summary: `Changed ${user.email} workspace plan to ${plan}`, metadata: { targetUserId: user.id, tenantId: tenant.id, plan } });
    return res.json({ message: "Plan updated", plan: tenant.plan });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.patch("/users/:id/status", async (req, res) => {
  try {
    const status = String(req.body.status || "").toUpperCase();
    if (!VALID_TENANT_STATUSES.has(status)) return res.status(400).json({ message: "Invalid status" });
    const user = await db.user.update({
      where: { id: req.params.id },
      data: { deletedAt: status === "SUSPENDED" ? new Date() : null },
    });
    await recordAdminAction({
      actor: getAdminActor(req),
      action: status === "SUSPENDED" ? "ADMIN_USER_SUSPENDED" : "ADMIN_USER_RESTORED",
      summary: `${status === "SUSPENDED" ? "Suspended" : "Restored"} user: ${user.email}`,
      metadata: { targetUserId: user.id, status },
    });
    return res.json({ message: status === "SUSPENDED" ? "User suspended" : "User restored", status: status.toLowerCase() });
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

router.post("/users/:id/forge-message", async (req, res) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: "User not found" });
    const message = String(req.body.message || "").trim();
    if (!message) return res.status(400).json({ message: "Message required" });

    await db.activityLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        action: "ADMIN_FORGE_MESSAGE_SENT",
        category: "admin_support",
        metadata: { message, sentBy: req.user?.email ?? "admin" },
      },
    });
    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_FORGE_MESSAGE_SENT",
      summary: `Sent FORGE message to ${user.email}`,
      metadata: { targetUserId: user.id, preview: message.slice(0, 180) },
    });
    return res.json({ message: "FORGE message queued", preview: `Queued message for ${user.email}: ${message}` });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/users/:id/reset-password", async (req, res) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    await db.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_USER_PASSWORD_RESET_ISSUED",
      summary: `Issued password reset for ${user.email}`,
      metadata: { targetUserId: user.id, expiresAt: expiresAt.toISOString() },
    });
    return res.json({ message: "Password reset issued", resetUrl, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/users/:id/revoke-sessions", async (req, res) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const [passwordResetTokens, otpCodes] = await Promise.all([
      db.passwordResetToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      }),
      db.twoFactorOTP.deleteMany({ where: { userId: user.id } }),
    ]);

    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_USER_SESSIONS_REVOKED",
      summary: `Revoked pending sessions for ${user.email}`,
      metadata: {
        targetUserId: user.id,
        passwordResetTokens: passwordResetTokens.count,
        otpCodes: otpCodes.count,
      },
    });

    return res.json({
      message: `Revoked ${passwordResetTokens.count} reset token(s) and ${otpCodes.count} OTP challenge(s).`,
      revokedArtifacts: {
        passwordResetTokens: passwordResetTokens.count,
        otpCodes: otpCodes.count,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/users/:id/reset-2fa", async (req, res) => {
  try {
    const user = await db.user.update({
      where: { id: req.params.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorMethod: null,
        twoFactorBackup: [],
      },
    });
    await db.twoFactorOTP.deleteMany({ where: { userId: user.id } });
    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_USER_2FA_RESET",
      summary: `Reset 2FA for ${user.email}`,
      metadata: { targetUserId: user.id },
    });
    return res.json({ message: "2FA reset", twoFactorEnabled: false });
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

router.get("/revenue/breakdown", async (_req, res) => {
  try {
    const [snapshot, tenants, users] = await Promise.all([
      getAdminRevenueSnapshot(),
      db.tenant.findMany({ where: { deletedAt: null }, select: { plan: true } }),
      db.user.findMany({ where: { deletedAt: null }, select: { country: true } }),
    ]);

    const planCounts = ["FREE", "PRO", "ENTERPRISE"].map((plan) => ({
      plan,
      tenantCount: tenants.filter((tenant) => tenant.plan === plan).length,
    }));

    const geoCounts = Array.from(
      users.reduce((map, user) => {
        const key = (user.country ?? "Unknown").trim() || "Unknown";
        map.set(key, (map.get(key) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
    )
      .map(([country, usersCount]) => ({ country, users: usersCount }))
      .sort((left, right) => right.users - left.users)
      .slice(0, 10);

    return res.json({
      kpis: snapshot.kpis,
      chart: snapshot.chart,
      layers: snapshot.layers,
      byPlan: planCounts,
      byGeo: geoCounts,
      note: "Layer revenue is live. Plan and geography breakdowns currently reflect tenant and user distribution.",
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
router.get("/broadcast/panel", async (_req, res) => {
  try {
    const snapshot = await getAdminBroadcastSnapshot();
    return res.json(snapshot);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/broadcast/send", async (req, res) => {
  try {
    return await handleBroadcastCreate(req, res);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/broadcast/schedule", async (req, res) => {
  try {
    const { audienceKind, plan, layerId, segment, channels, title, body, message, ctaLabel, ctaUrl, broadcastType, scheduleMode, scheduleAt } = req.body;
    const normalizedScheduleAt =
      scheduleMode === "next_omega"
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : scheduleAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_BROADCAST_SCHEDULED",
      summary: `Broadcast scheduled for ${normalizedScheduleAt}`,
      metadata: {
        title: title || "OMEGA Broadcast",
        message: body || message,
        ctaLabel,
        ctaUrl,
        channels: channels || ["in_app"],
        audienceKind: audienceKind || "all",
        audienceLabel:
          audienceKind === "plan"
            ? `${plan} Users`
            : audienceKind === "layer"
              ? `${layerId} Layer`
              : audienceKind === "segment"
                ? segment
                : "All Users",
        recipients: 0,
        openRate: null,
        clickRate: null,
        scheduleAt: normalizedScheduleAt,
        scheduleMode: scheduleMode || "specific_time",
        broadcastType: broadcastType || "platform_news",
        status: "scheduled",
      },
    });

    return res.json({ message: "Broadcast scheduled", scheduleAt: normalizedScheduleAt });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/broadcast/draft", async (req, res) => {
  try {
    const { audienceKind, plan, layerId, segment } = req.body;
    const draft = await buildAdminBroadcastDraft(
      audienceKind === "plan"
        ? { kind: "plan", plan }
        : audienceKind === "layer"
          ? { kind: "layer", layerId }
          : audienceKind === "segment"
            ? { kind: "segment", segment }
            : { kind: "all" }
    );
    return res.json({ message: draft });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

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
    return await handleBroadcastCreate(req, res);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/broadcast", async (req, res) => {
  try {
    return await handleBroadcastCreate(req, res);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/broadcasts/draft", async (req, res) => {
  try {
    const { audienceKind, plan, layerId, segment } = req.body;
    const draft = await buildAdminBroadcastDraft(
      audienceKind === "plan"
        ? { kind: "plan", plan }
        : audienceKind === "layer"
          ? { kind: "layer", layerId }
          : audienceKind === "segment"
            ? { kind: "segment", segment }
            : { kind: "all" }
    );
    return res.json({ message: draft });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

// --- SECURITY ---
router.get("/security/panel", async (_req, res) => {
  try {
    const snapshot = await getAdminSecuritySnapshot();
    return res.json(snapshot);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

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

router.post("/health/verify-rls", async (req, res) => {
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

router.get("/actions", async (_req, res) => {
  try {
    const logs = await db.activityLog.findMany({ where: { category: "admin" }, orderBy: { createdAt: "desc" }, take: 100 });
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/security/audit", async (_req, res) => {
  try {
    const snapshot = await getAdminSecuritySnapshot();
    return res.json(snapshot);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/security/sessions", async (_req, res) => {
  try {
    const snapshot = await getAdminSecuritySnapshot();
    return res.json(snapshot.sessions);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.post("/security/sessions/:id/revoke", async (req, res) => {
  try {
    const session = await db.deviceToken.update({
      where: { id: req.params.id },
      data: { isActive: false },
      select: { id: true, userId: true, token: true, user: { select: { email: true } } },
    });
    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_SESSION_REVOKED",
      summary: `Revoked active session for ${session.user.email}`,
      metadata: { sessionId: session.id, targetUserId: session.userId, token: session.token },
    });
    return res.json({ message: "Session revoked", sessionId: session.id });
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/security/audit/export", async (_req, res) => {
  try {
    const snapshot = await getAdminSecuritySnapshot();
    const lines = [
      ["createdAt", "actorEmail", "action", "summary"].join(","),
      ...snapshot.auditLog.map((entry) =>
        [entry.createdAt, entry.actorEmail, entry.action, entry.summary]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    const csv = `${lines.join("\n")}\n`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="admin-audit-log-${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.status(200).send(csv);
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

router.get("/errors", async (_req, res) => {
  try {
    const errors = await db.activityLog.findMany({ where: { category: "error" }, orderBy: { createdAt: "desc" }, take: 50 });
    return res.json(errors);
  } catch (err) {
    return res.status(500).json({ message: errorMessage(err) });
  }
});

export default router;
