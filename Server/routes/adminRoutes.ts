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
import { recordAdminAction } from "../services/adminAuditService.js";
import { AppRegistry } from "../services/appRegistry.js";
import { recordPlatformLayerStatus } from "../services/platformLayerStatusService.js";

const router = Router();
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const JWT_SECRET = process.env.JWT_SECRET ?? "winners_dev_secret_change_in_prod";

// --- UTILS ---
const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Unknown error");

const getAdminActor = (req: Request) => ({
  userId: req.user!.userId,
  tenantId: req.user!.tenantId,
  email: req.user!.email,
});

const streamTextAsSse = (res: Response, text: string) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
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

    return res.json({ success: true, layer: AppRegistry.get(id) });
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
router.post("/forge/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ message: "message is required" });

    const context = await getAdminForgeChatContext();
    if (!anthropic) {
      const fallback = await buildAdminForgeFallbackResponse(context, message);
      return streamTextAsSse(res, fallback);
    }

    const system = buildAdminForgeSystemPrompt(context, req.user!.email);
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1400,
      system,
      messages: [...history, { role: "user", content: message }],
    });

    res.setHeader("Content-Type", "text/event-stream");
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
    const q = String(req.query.q || "").trim();
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (q) {
      where.OR = [{ name: { contains: q, mode: "insensitive" } }];
    }

    const [tenants, total] = await Promise.all([
      db.tenant.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { _count: { select: { users: true } } } }),
      db.tenant.count({ where }),
    ]);

    return res.json({ tenants, total, page, pages: Math.ceil(total / limit) });
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
    const owner = await db.user.findFirst({ where: { tenantId: req.params.id, role: "OWNER", deletedAt: null } });
    if (!owner) return res.status(404).json({ message: "No owner found" });
    const token = jwt.sign({ userId: owner.id, tenantId: owner.tenantId, email: owner.email, role: owner.role.toLowerCase(), isImpersonation: true, adminId: req.user!.userId }, JWT_SECRET, { expiresIn: "30m" });
    await recordAdminAction({ actor: getAdminActor(req), action: "ADMIN_TENANT_IMPERSONATED", summary: `Impersonated tenant ${req.params.id} as ${owner.email}`, metadata: { tenantId: req.params.id, targetUserId: owner.id } });
    return res.json({ token, user: owner });
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
