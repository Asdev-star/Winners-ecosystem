// Phase 8 — Winners Cloud — cloudRoutes.ts
// NEXUS Supervisor · cloud.winnersempire.io
// API Keys · Connectors · Webhooks · Automations · AI Agents · Usage Logs

import { Router, Request, Response } from "express";
import { randomBytes, createHash } from "crypto";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw    = `wn_live_${randomBytes(32).toString("hex")}`;
  const hash   = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 14);
  return { raw, hash, prefix };
}

// ─── API KEYS ─────────────────────────────────────────────────────────────────

// GET /cloud/keys — list API keys for tenant
router.get("/keys", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  try {
    const keys = await db.apiKey.findMany({
      where:   { tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id:           true,
        name:         true,
        prefix:       true,
        scopes:       true,
        rateLimitRpm: true,
        lastUsedAt:   true,
        expiresAt:    true,
        revoked:      true,
        createdAt:    true,
      },
    });
    res.json({ keys });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch API keys" });
  }
});

// POST /cloud/keys — create a new API key
router.post("/keys", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId   = req.user!.userId;
  const { name, scopes = [], rateLimitRpm = 60, expiresAt } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: "Name is required" });

  try {
    const { raw, hash, prefix } = generateApiKey();

    const key = await db.apiKey.create({
      data: {
        tenantId,
        userId,
        name:         name.trim(),
        keyHash:      hash,
        prefix,
        scopes:       Array.isArray(scopes) ? scopes : [],
        rateLimitRpm: Number(rateLimitRpm) || 60,
        expiresAt:    expiresAt ? new Date(expiresAt) : null,
      },
    });

    res.status(201).json({
      key: { ...key, rawKey: raw },
      message: "Store this key — it will never be shown again.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create API key" });
  }
});

// DELETE /cloud/keys/:keyId — revoke an API key
router.delete("/keys/:keyId", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { keyId } = req.params as Record<string, string>;
  try {
    await db.apiKey.update({
      where: { id: keyId, tenantId },
      data:  { revoked: true },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to revoke API key" });
  }
});

// ─── CONNECTORS ───────────────────────────────────────────────────────────────

// GET /cloud/connectors — list connector catalogue
router.get("/connectors", async (req: Request, res: Response) => {
  const { category, search } = req.query;
  try {
    const where: Record<string, unknown> = { published: true };
    if (category) where.category = String(category);
    if (search) {
      where.OR = [
        { name:        { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
      ];
    }
    const connectors = await db.connector.findMany({
      where:   where as never,
      orderBy: [{ verified: "desc" }, { installCount: "desc" }],
    });
    res.json({ connectors });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch connectors" });
  }
});

// GET /cloud/connectors/installed — list tenant's installed connectors
router.get("/connectors/installed", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  try {
    const installs = await db.connectorInstall.findMany({
      where:   { tenantId, active: true },
      include: { connector: true },
      orderBy: { installedAt: "desc" },
    });
    res.json({ installs: installs.map((i) => ({ ...i, credentials: undefined, credentialsIv: undefined })) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch installed connectors" });
  }
});

// POST /cloud/connectors/:connectorId/install — install a connector
router.post("/connectors/:connectorId/install", async (req: Request, res: Response) => {
  const tenantId    = req.user!.tenantId;
  const userId      = req.user!.userId;
  const { connectorId } = req.params as Record<string, string>;

  try {
    const connector = await db.connector.findUnique({ where: { id: connectorId } });
    if (!connector || !connector.published) return res.status(404).json({ error: "Connector not found" });

    const existing = await db.connectorInstall.findUnique({
      where: { connectorId_tenantId: { connectorId, tenantId } },
    });
    if (existing) return res.status(409).json({ error: "Already installed" });

    const iv          = randomBytes(16).toString("hex");
    const placeholder = Buffer.from(JSON.stringify({ status: "pending_oauth" }));

    const install = await db.connectorInstall.create({
      data: { connectorId, tenantId, userId, credentials: placeholder, credentialsIv: iv },
    });

    await db.connector.update({
      where: { id: connectorId },
      data:  { installCount: { increment: 1 } },
    });

    res.status(201).json({ install: { ...install, credentials: undefined, credentialsIv: undefined } });
  } catch (err) {
    res.status(500).json({ error: "Failed to install connector" });
  }
});

// DELETE /cloud/connectors/installed/:installId — uninstall a connector
router.delete("/connectors/installed/:installId", async (req: Request, res: Response) => {
  const tenantId     = req.user!.tenantId;
  const { installId } = req.params as Record<string, string>;
  try {
    await db.connectorInstall.update({
      where: { id: installId, tenantId },
      data:  { active: false },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to uninstall connector" });
  }
});

// ─── WEBHOOKS ─────────────────────────────────────────────────────────────────

// GET /cloud/webhooks — list webhook subscriptions
router.get("/webhooks", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  try {
    const webhooks = await db.webhookSubscription.findMany({
      where:   { tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id:        true,
        url:       true,
        events:    true,
        active:    true,
        failCount: true,
        createdAt: true,
      },
    });
    res.json({ webhooks });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch webhooks" });
  }
});

// POST /cloud/webhooks — create webhook subscription
router.post("/webhooks", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId   = req.user!.userId;
  const { url, events } = req.body;

  if (!url?.trim())              return res.status(400).json({ error: "URL is required" });
  if (!Array.isArray(events) || events.length === 0) return res.status(400).json({ error: "At least one event is required" });

  try {
    const secret = `whsec_${randomBytes(32).toString("hex")}`;
    const webhook = await db.webhookSubscription.create({
      data: { tenantId, userId, url: url.trim(), events, secret },
      select: { id: true, url: true, events: true, active: true, createdAt: true, secret: true },
    });
    res.status(201).json({ webhook });
  } catch (err) {
    res.status(500).json({ error: "Failed to create webhook" });
  }
});

// DELETE /cloud/webhooks/:webhookId — delete webhook
router.delete("/webhooks/:webhookId", async (req: Request, res: Response) => {
  const tenantId     = req.user!.tenantId;
  const { webhookId } = req.params as Record<string, string>;
  try {
    await db.webhookSubscription.delete({ where: { id: webhookId, tenantId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete webhook" });
  }
});

// GET /cloud/webhooks/:webhookId/deliveries — delivery history
router.get("/webhooks/:webhookId/deliveries", async (req: Request, res: Response) => {
  const tenantId     = req.user!.tenantId;
  const { webhookId } = req.params as Record<string, string>;
  try {
    const sub = await db.webhookSubscription.findUnique({ where: { id: webhookId, tenantId } });
    if (!sub) return res.status(404).json({ error: "Webhook not found" });

    const deliveries = await db.webhookDelivery.findMany({
      where:   { subscriptionId: webhookId },
      orderBy: { createdAt: "desc" },
      take:    50,
    });
    res.json({ deliveries });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch deliveries" });
  }
});

// ─── AUTOMATIONS ──────────────────────────────────────────────────────────────

// GET /cloud/automations — list automations
router.get("/automations", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  try {
    const automations = await db.automation.findMany({
      where:   { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { runs: true } },
      },
    });
    res.json({ automations });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch automations" });
  }
});

// POST /cloud/automations — create automation
router.post("/automations", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId   = req.user!.userId;
  const { name, description, trigger, steps } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
  if (!trigger)      return res.status(400).json({ error: "Trigger config is required" });
  if (!steps)        return res.status(400).json({ error: "Steps are required" });

  try {
    const automation = await db.automation.create({
      data: { tenantId, userId, name: name.trim(), description: description?.trim(), trigger, steps },
    });
    res.status(201).json({ automation });
  } catch (err) {
    res.status(500).json({ error: "Failed to create automation" });
  }
});

// PATCH /cloud/automations/:automationId — update automation
router.patch("/automations/:automationId", async (req: Request, res: Response) => {
  const tenantId         = req.user!.tenantId;
  const { automationId } = req.params as Record<string, string>;
  const { name, description, trigger, steps, active } = req.body;

  try {
    const data: Record<string, unknown> = {};
    if (name        !== undefined) data.name        = name.trim();
    if (description !== undefined) data.description = description?.trim();
    if (trigger     !== undefined) data.trigger     = trigger;
    if (steps       !== undefined) data.steps       = steps;
    if (active      !== undefined) data.active      = Boolean(active);

    const automation = await db.automation.update({
      where: { id: automationId, tenantId },
      data:  data as never,
    });
    res.json({ automation });
  } catch (err) {
    res.status(500).json({ error: "Failed to update automation" });
  }
});

// DELETE /cloud/automations/:automationId — delete automation
router.delete("/automations/:automationId", async (req: Request, res: Response) => {
  const tenantId         = req.user!.tenantId;
  const { automationId } = req.params as Record<string, string>;
  try {
    await db.automation.delete({ where: { id: automationId, tenantId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete automation" });
  }
});

// GET /cloud/automations/:automationId/runs — run history
router.get("/automations/:automationId/runs", async (req: Request, res: Response) => {
  const tenantId         = req.user!.tenantId;
  const { automationId } = req.params as Record<string, string>;
  try {
    const auto = await db.automation.findUnique({ where: { id: automationId, tenantId } });
    if (!auto) return res.status(404).json({ error: "Automation not found" });

    const runs = await db.automationRun.findMany({
      where:   { automationId },
      orderBy: { startedAt: "desc" },
      take:    20,
    });
    res.json({ runs });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch runs" });
  }
});

// ─── AI AGENTS ────────────────────────────────────────────────────────────────

// GET /cloud/agents — list AI agents
router.get("/agents", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  try {
    const agents = await db.aIAgent.findMany({
      where:   { tenantId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { runs: true } } },
    });
    res.json({ agents });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch agents" });
  }
});

// POST /cloud/agents — create AI agent
router.post("/agents", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId   = req.user!.userId;
  const {
    name, description, goal, baseAssistant = "omega",
    tools = [], schedule, triggerEvent,
    maxRuntime = 300, maxCreditsPerRun = 100,
    humanApprovalRequired = false,
  } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
  if (!goal?.trim()) return res.status(400).json({ error: "Goal is required" });

  try {
    const agent = await db.aIAgent.create({
      data: {
        tenantId,
        userId,
        name:                 name.trim(),
        description:          description?.trim() ?? "",
        goal:                 goal.trim(),
        baseAssistant,
        tools:                Array.isArray(tools) ? tools : [],
        schedule:             schedule?.trim() || null,
        triggerEvent:         triggerEvent?.trim() || null,
        maxRuntime:           Number(maxRuntime) || 300,
        maxCreditsPerRun:     Number(maxCreditsPerRun) || 100,
        humanApprovalRequired: Boolean(humanApprovalRequired),
      },
    });
    res.status(201).json({ agent });
  } catch (err) {
    res.status(500).json({ error: "Failed to create agent" });
  }
});

// PATCH /cloud/agents/:agentId — update agent
router.patch("/agents/:agentId", async (req: Request, res: Response) => {
  const tenantId    = req.user!.tenantId;
  const { agentId } = req.params as Record<string, string>;
  const { name, description, goal, tools, active, humanApprovalRequired, maxCreditsPerRun } = req.body;

  try {
    const data: Record<string, unknown> = {};
    if (name                  !== undefined) data.name                  = name.trim();
    if (description           !== undefined) data.description           = description?.trim();
    if (goal                  !== undefined) data.goal                  = goal.trim();
    if (tools                 !== undefined) data.tools                 = tools;
    if (active                !== undefined) data.active                = Boolean(active);
    if (humanApprovalRequired !== undefined) data.humanApprovalRequired = Boolean(humanApprovalRequired);
    if (maxCreditsPerRun      !== undefined) data.maxCreditsPerRun      = Number(maxCreditsPerRun);

    const agent = await db.aIAgent.update({
      where: { id: agentId, tenantId },
      data:  data as never,
    });
    res.json({ agent });
  } catch (err) {
    res.status(500).json({ error: "Failed to update agent" });
  }
});

// DELETE /cloud/agents/:agentId — delete agent
router.delete("/agents/:agentId", async (req: Request, res: Response) => {
  const tenantId    = req.user!.tenantId;
  const { agentId } = req.params as Record<string, string>;
  try {
    await db.aIAgent.delete({ where: { id: agentId, tenantId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete agent" });
  }
});

// GET /cloud/agents/:agentId/runs — agent run history
router.get("/agents/:agentId/runs", async (req: Request, res: Response) => {
  const tenantId    = req.user!.tenantId;
  const { agentId } = req.params as Record<string, string>;
  try {
    const agent = await db.aIAgent.findUnique({ where: { id: agentId, tenantId } });
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    const runs = await db.agentRun.findMany({
      where:   { agentId },
      orderBy: { startedAt: "desc" },
      take:    20,
    });
    res.json({ runs });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch agent runs" });
  }
});

// ─── USAGE / BILLING ─────────────────────────────────────────────────────────

// GET /cloud/usage — usage summary for tenant
router.get("/usage", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { period = "30d" } = req.query;

  const days  = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const [logs, total] = await Promise.all([
      db.usageLog.findMany({
        where:   { tenantId, billedAt: { gte: since } },
        orderBy: { billedAt: "desc" },
        take:    100,
      }),
      db.usageLog.aggregate({
        where: { tenantId, billedAt: { gte: since } },
        _sum:  { credits: true },
        _count: true,
      }),
    ]);

    res.json({
      logs,
      summary: {
        totalCredits: total._sum.credits ?? 0,
        totalCalls:   total._count,
        period:       `${days}d`,
        since:        since.toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch usage data" });
  }
});

// ─── SITES & DNS ─────────────────────────────────────────────────────────────

// GET /cloud/sites — list deployed sites
router.get("/sites", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  try {
    const sites = await db.siteDeploy.findMany({
      where:   { tenantId },
      orderBy: { deployedAt: "desc" },
    });
    res.json({ sites });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sites" });
  }
});

// GET /cloud/dns — list DNS zones
router.get("/dns", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  try {
    const zones = await db.dNSZone.findMany({
      where:   { tenantId },
      include: { records: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ zones });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch DNS zones" });
  }
});

// POST /cloud/dns — create DNS zone
router.post("/dns", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { domain } = req.body;
  if (!domain?.trim()) return res.status(400).json({ error: "Domain is required" });

  try {
    const zone = await db.dNSZone.create({
      data: { tenantId, domain: domain.trim().toLowerCase(), ns: ["ns1.winnersempire.io", "ns2.winnersempire.io"] },
    });
    res.status(201).json({ zone });
  } catch (err) {
    res.status(500).json({ error: "Failed to create DNS zone" });
  }
});

// POST /cloud/dns/:zoneId/records — add DNS record
router.post("/dns/:zoneId/records", async (req: Request, res: Response) => {
  const tenantId  = req.user!.tenantId;
  const { zoneId } = req.params as Record<string, string>;
  const { type, name, value, ttl = 3600, priority } = req.body;

  if (!type || !name || !value) return res.status(400).json({ error: "type, name, and value are required" });

  try {
    const zone = await db.dNSZone.findUnique({ where: { id: zoneId, tenantId } });
    if (!zone) return res.status(404).json({ error: "Zone not found" });

    const record = await db.dNSRecord.create({
      data: { zoneId, type: type.toUpperCase(), name, value, ttl: Number(ttl), priority: priority ? Number(priority) : null },
    });
    res.status(201).json({ record });
  } catch (err) {
    res.status(500).json({ error: "Failed to add DNS record" });
  }
});

// ─── CLOUD OVERVIEW ───────────────────────────────────────────────────────────

// GET /cloud/overview — developer portal summary
router.get("/overview", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  try {
    const [
      apiKeyCount,
      installedConnectors,
      automationCount,
      agentCount,
      usageSummary,
    ] = await Promise.all([
      db.apiKey.count({ where: { tenantId, revoked: false } }),
      db.connectorInstall.count({ where: { tenantId, active: true } }),
      db.automation.count({ where: { tenantId, active: true } }),
      db.aIAgent.count({ where: { tenantId, active: true } }),
      db.usageLog.aggregate({
        where: { tenantId, billedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        _sum:  { credits: true },
        _count: true,
      }),
    ]);

    res.json({
      overview: {
        apiKeys:             apiKeyCount,
        connectors:          installedConnectors,
        activeAutomations:   automationCount,
        activeAgents:        agentCount,
        creditsUsed30d:      usageSummary._sum.credits ?? 0,
        apiCalls30d:         usageSummary._count,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cloud overview" });
  }
});

export default router;
