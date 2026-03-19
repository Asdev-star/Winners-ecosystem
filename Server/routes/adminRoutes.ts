// Server/routes/adminRoutes.ts

import Anthropic from "@anthropic-ai/sdk";
import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { superAdminMiddleware } from "../middleware/superAdminMiddleware.js";
import db from "../db.js";
import { buildForgeBriefingText, getAdminOverviewSnapshot, getLoopsLiveFeed } from "../services/adminOverviewService.js";
import {
  buildAdminRevenueCsv,
  buildAdminRevenuePdf,
  buildAdminRevenueWorkbook,
  getAdminRevenueSnapshot,
  sendAdminRevenueReport,
} from "../services/adminRevenueService.js";
import { getRecentAdminSignals } from "../services/adminSignalService.js";
import { recordAdminAction } from "../services/adminAuditService.js";
import {
  buildAdminForgeFallbackResponse,
  buildAdminForgeSystemPrompt,
  getAdminForgeChatContext,
  getAdminForgeSnapshot,
} from "../services/adminForgeService.js";
import { buildAdminForgeInsight } from "../services/adminForgeInsightService.js";
import {
  buildAdminBroadcastDraft,
  getAdminBroadcastSnapshot,
  sendAdminBroadcast,
} from "../services/adminBroadcastService.js";
import { getAdminSubNavSnapshot } from "../services/adminSubNavService.js";
import {
  buildAdminAuditLogCsv,
  getAdminSecuritySnapshot,
} from "../services/adminSecurityService.js";
import {
  getAdminSystemHealthSnapshot,
  markRlsVerificationNow,
} from "../services/adminSystemHealthService.js";
import { logEmailDelivery } from "../services/emailTelemetryService.js";

const router = Router();
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

type PlanTier = "FREE" | "PRO" | "ENTERPRISE";
type InviteRole = "ADMIN" | "MEMBER" | "VIEWER";
type BroadcastAudienceKind = "all" | "plan" | "layer";
type BroadcastChannel = "in_app" | "push" | "email";
type BroadcastLayer = "community" | "academy" | "market" | "work" | "cloud" | "intelligence";

const JWT_SECRET = process.env.JWT_SECRET ?? "winners_dev_secret_change_in_prod";
const BROADCAST_CHANNELS = new Set<BroadcastChannel>(["in_app", "push", "email"]);
const BROADCAST_LAYERS = new Set<BroadcastLayer>(["community", "academy", "market", "work", "cloud", "intelligence"]);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function toIsoOrNull(value?: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function getLoopStage(loop?: { currentStep: number; status: string; steps: unknown }): string {
  if (!loop) return "No active loop";

  const steps = Array.isArray(loop.steps) ? loop.steps : [];
  const latestStep = steps.length ? (steps[steps.length - 1] as { layer?: string }) : null;

  if (loop.status === "completed") {
    return `Complete x${Math.max(1, steps.length)}`;
  }

  if (loop.status === "failed") {
    return "Loop failed";
  }

  if (latestStep?.layer) {
    return `${String(latestStep.layer)} live`;
  }

  return `Step ${loop.currentStep + 1}`;
}

function buildUserWhere(q: string) {
  if (!q) return { deletedAt: null };

  return {
    deletedAt: null,
    OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { email: { contains: q, mode: "insensitive" as const } },
    ],
  };
}

function getAdminActor(req: Request) {
  return {
    userId: req.user!.userId,
    tenantId: req.user!.tenantId,
    email: req.user!.email,
  };
}

function parseBroadcastAudience(body: unknown) {
  const input = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const kind = String(input.audienceKind ?? "all").trim().toLowerCase() as BroadcastAudienceKind;

  if (kind === "plan") {
    const plan = String(input.plan ?? "").trim().toUpperCase() as PlanTier;
    if (plan === "FREE" || plan === "PRO" || plan === "ENTERPRISE") {
      return { kind: "plan" as const, plan };
    }
  }

  if (kind === "layer") {
    const layerId = String(input.layerId ?? "").trim().toLowerCase() as BroadcastLayer;
    if (BROADCAST_LAYERS.has(layerId)) {
      return { kind: "layer" as const, layerId };
    }
  }

  return { kind: "all" as const };
}

function parseBroadcastChannels(value: unknown): BroadcastChannel[] {
  if (!Array.isArray(value)) return [];
  const channels = value.filter(
    (entry): entry is BroadcastChannel =>
      typeof entry === "string" && BROADCAST_CHANNELS.has(entry as BroadcastChannel)
  );
  return Array.from(new Set(channels));
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

router.get("/subnav", authMiddleware, superAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const snapshot = await getAdminSubNavSnapshot();
    return res.json(snapshot);
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
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

router.get("/forge/insight", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const excludeInput = req.query.exclude;
    const exclude = Array.isArray(excludeInput)
      ? excludeInput.map((entry) => String(entry))
      : typeof excludeInput === "string"
        ? [excludeInput]
        : [];
    const insight = await buildAdminForgeInsight({
      path: String(req.query.path ?? "/admin/overview"),
      seed: String(req.query.seed ?? ""),
      exclude,
    });
    return res.json(insight);
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/forge/panel", authMiddleware, superAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const snapshot = await getAdminForgeSnapshot();
    return res.json(snapshot);
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/forge/chat", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const message = String(req.body?.message ?? "").trim();
    const historyInput = Array.isArray(req.body?.history) ? req.body.history : [];
    if (!message) {
      return res.status(400).json({ message: "message is required" });
    }

    const context = await getAdminForgeChatContext();
    const history = historyInput
      .filter(
        (entry: unknown): entry is { role: "user" | "assistant"; content: string } =>
          typeof entry === "object" &&
          entry !== null &&
          "role" in entry &&
          "content" in entry &&
          (entry as { role?: unknown }).role !== undefined &&
          typeof (entry as { content?: unknown }).content === "string"
      )
      .map((entry) => ({
        role: entry.role === "assistant" ? "assistant" : "user",
        content: entry.content,
      }))
      .slice(-8);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    if (!anthropic) {
      const fallback = await buildAdminForgeFallbackResponse(context, message);
      streamTextAsSse(res, fallback);
      return;
    }

    const system = buildAdminForgeSystemPrompt(context, req.user!.email);
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1400,
      system,
      messages: [...history, { role: "user", content: message }],
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ token: chunk.delta.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ message: errorMessage(error) });
    }

    res.write(`data: ${JSON.stringify({ token: "FORGE could not complete the response. Review admin telemetry and try again." })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

router.get("/health/panel", authMiddleware, superAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const snapshot = await getAdminSystemHealthSnapshot();
    return res.json(snapshot);
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/health/verify-rls", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const verification = await markRlsVerificationNow();
    await recordAdminAction({
      actor: getAdminActor(req),
      action: "admin_health_verify_rls",
      summary: "Triggered RLS verification from System Health",
      metadata: { verifiedAt: verification.verifiedAt },
    });
    return res.json({
      message: "RLS verification checkpoint recorded",
      verifiedAt: verification.verifiedAt,
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/broadcast/panel", authMiddleware, superAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const snapshot = await getAdminBroadcastSnapshot();
    return res.json(snapshot);
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/broadcast/draft", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const audience = parseBroadcastAudience(req.body);
    const message = await buildAdminBroadcastDraft(audience);
    return res.json({ message });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/broadcast/send", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const channels = parseBroadcastChannels(req.body?.channels);
    const message = String(req.body?.message ?? "").trim();
    if (!message) {
      return res.status(400).json({ message: "message is required" });
    }
    if (channels.length === 0) {
      return res.status(400).json({ message: "At least one channel is required" });
    }

    const audience = parseBroadcastAudience(req.body);
    const result = await sendAdminBroadcast({
      actorTenantId: req.user!.tenantId,
      audience,
      channels,
      message,
    });

    await recordAdminAction({
      actor: getAdminActor(req),
      action: "admin_broadcast_sent",
      summary: `Sent OMEGA broadcast to ${result.recipients} recipients`,
      metadata: {
        title: result.title,
        message,
        recipients: result.recipients,
        channels: result.channels,
        audienceLabel: result.audienceLabel,
        emailDelivered: result.emailDelivered,
        emailSkipped: result.emailSkipped,
      },
    });

    return res.json({
      message: `OMEGA broadcast sent to ${result.recipients.toLocaleString("en-US")} recipients`,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/broadcast/schedule", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const channels = parseBroadcastChannels(req.body?.channels);
    const message = String(req.body?.message ?? "").trim();
    const scheduleAt = String(req.body?.scheduleAt ?? "").trim();
    if (!message) {
      return res.status(400).json({ message: "message is required" });
    }
    if (!scheduleAt) {
      return res.status(400).json({ message: "scheduleAt is required" });
    }
    if (Number.isNaN(Date.parse(scheduleAt))) {
      return res.status(400).json({ message: "scheduleAt must be a valid date" });
    }

    const audience = parseBroadcastAudience(req.body);
    const snapshot = await getAdminBroadcastSnapshot();
    const audienceLabel =
      audience.kind === "all"
        ? "All Users"
        : audience.kind === "plan"
          ? `${audience.plan === "PRO" ? "PRO" : audience.plan === "FREE" ? "Free" : "Enterprise"} Users`
          : `${snapshot.layers.find((layer) => layer.id === audience.layerId)?.label ?? audience.layerId} Layer`;
    const recipients =
      audience.kind === "all"
        ? snapshot.audiences.allUsers
        : audience.kind === "plan"
          ? audience.plan === "FREE"
            ? snapshot.audiences.free
            : audience.plan === "PRO"
              ? snapshot.audiences.pro
              : snapshot.audiences.enterprise
          : snapshot.layers.find((layer) => layer.id === audience.layerId)?.count ?? 0;

    await recordAdminAction({
      actor: getAdminActor(req),
      action: "admin_broadcast_scheduled",
      summary: `Scheduled OMEGA broadcast for ${scheduleAt}`,
      metadata: {
        title: message.split(/\r?\n/).find((line: string) => line.trim())?.trim() ?? "OMEGA Broadcast",
        message,
        recipients,
        channels,
        audienceLabel,
        scheduleAt,
      },
    });

    return res.json({
      message: `OMEGA broadcast scheduled for ${new Date(scheduleAt).toISOString()}`,
      recipients,
      audienceLabel,
      scheduleAt: new Date(scheduleAt).toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/security/panel", authMiddleware, superAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const snapshot = await getAdminSecuritySnapshot();
    return res.json(snapshot);
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/security/audit/export", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const csv = await buildAdminAuditLogCsv();
    const dateKey = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="admin-audit-log-${dateKey}.csv"`);
    await recordAdminAction({
      actor: getAdminActor(req),
      action: "admin_security_audit_export_csv",
      summary: "Exported admin audit log CSV",
      metadata: { format: "csv" },
    });
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
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

router.get("/revenue/command", authMiddleware, superAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const snapshot = await getAdminRevenueSnapshot();
    return res.json(snapshot);
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/revenue/export/:format", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const format = req.params.format as string;
    if (!["csv", "xlsx", "pdf"].includes(format)) {
      return res.status(400).json({ message: "Unsupported export format" });
    }

    const snapshot = await getAdminRevenueSnapshot();
    const dateKey = new Date().toISOString().slice(0, 10);

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="revenue-command-${dateKey}.csv"`);
      await recordAdminAction({
        actor: getAdminActor(req),
        action: "admin_revenue_export_csv",
        summary: "Exported Revenue Command CSV",
        metadata: { format: "csv" },
      });
      return res.send(buildAdminRevenueCsv(snapshot));
    }

    if (format === "xlsx") {
      const workbook = await buildAdminRevenueWorkbook(snapshot);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename="revenue-command-${dateKey}.xlsx"`);
      await recordAdminAction({
        actor: getAdminActor(req),
        action: "admin_revenue_export_xlsx",
        summary: "Exported Revenue Command workbook",
        metadata: { format: "xlsx" },
      });
      await workbook.xlsx.write(res);
      return res.end();
    }

    const pdf = await buildAdminRevenuePdf(snapshot);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="revenue-command-${dateKey}.pdf"`);
    await recordAdminAction({
      actor: getAdminActor(req),
      action: "admin_revenue_export_pdf",
      summary: "Exported Revenue Command PDF",
      metadata: { format: "pdf" },
    });
    return res.send(pdf);
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/revenue/report-email", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const snapshot = await getAdminRevenueSnapshot();
    const requestedRecipients = Array.isArray(req.body?.to)
      ? req.body.to.filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [];
    const recipients = requestedRecipients.length > 0 ? requestedRecipients : snapshot.exports.adminRecipients;

    const result = await sendAdminRevenueReport(snapshot, recipients);
    await logEmailDelivery({
      tenantId: req.user!.tenantId,
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userName: req.user!.email,
      action: "Admin revenue report sent",
      recipients,
      source: "admin_revenue_report",
      metadata: {
        monthLabel: snapshot.summary.monthLabel,
      },
    });
    await recordAdminAction({
      actor: getAdminActor(req),
      action: "admin_revenue_report_email",
      summary: `Sent Revenue Command report email to ${result.recipients} recipient(s)`,
      metadata: { recipients },
    });
    return res.json({
      message: "Revenue report sent",
      recipients: result.recipients,
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
    const filter = String(req.query.filter ?? "all").trim().toLowerCase();
    const skip = (page - 1) * limit;
    const now = new Date();
    const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const where = buildUserWhere(q);

    const [
      baseUsers,
      recentActivityUsers,
      recentAiUsers,
      recentPostAuthors,
      recentMessageSenders,
      recentEnrollmentUsers,
      recentJobUsers,
      flaggedActions,
      firstLoopGroups,
      totalUsers,
      lowTrustUsers,
    ] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          role: true,
          trustScore: true,
        },
      }),
      db.activityLog.findMany({
        where: { userId: { not: null }, createdAt: { gte: day7 } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      db.aIInteraction.findMany({
        where: { createdAt: { gte: day7 } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      db.post.findMany({
        where: { deletedAt: null, createdAt: { gte: day7 } },
        select: { authorId: true },
        distinct: ["authorId"],
      }),
      db.message.findMany({
        where: { createdAt: { gte: day7 } },
        select: { senderId: true },
        distinct: ["senderId"],
      }),
      db.enrollment.findMany({
        where: { createdAt: { gte: day7 } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      db.jobApplication.findMany({
        where: { createdAt: { gte: day7 } },
        select: { freelancer: { select: { userId: true } } },
      }),
      db.assistantAction.findMany({
        where: { assistant: "nova", actionType: "flag", targetLayer: "community" },
        select: { targetUserId: true, targetId: true },
      }),
      db.agenticLoop.groupBy({
        by: ["userId"],
        where: { status: "completed", completedAt: { gte: day30 } },
        _count: { id: true },
      }),
      db.user.count({ where: { deletedAt: null } }),
      db.user.count({ where: { deletedAt: null, trustScore: { lt: 50 } } }),
    ]);

    const activeUserIdSet = new Set<string>([
      ...recentActivityUsers.map((row) => row.userId).filter(Boolean),
      ...recentAiUsers.map((row) => row.userId),
      ...recentPostAuthors.map((row) => row.authorId),
      ...recentMessageSenders.map((row) => row.senderId),
      ...recentEnrollmentUsers.map((row) => row.userId),
      ...recentJobUsers.map((row) => row.freelancer.userId),
    ] as string[]);

    const flaggedUserIdSet = new Set<string>(flaggedActions.map((row) => row.targetUserId).filter(Boolean) as string[]);
    const firstLoopUserIdSet = new Set<string>(firstLoopGroups.filter((row) => row._count.id === 1).map((row) => row.userId));

    const filteredUserIds = baseUsers
      .filter((user) => {
        if (filter === "active7d") return activeUserIdSet.has(user.id);
        if (filter === "new30d") return user.createdAt >= day30;
        if (filter === "lowtrust") return user.trustScore < 50;
        if (filter === "flagged") return flaggedUserIdSet.has(user.id);
        if (filter === "admins") return user.role === "ADMIN" || user.role === "OWNER";
        return true;
      })
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((user) => user.id);

    const pageUserIds = filteredUserIds.slice(skip, skip + limit);

    const [users, loopRows, recentActivityByUser] = await Promise.all([
      pageUserIds.length
        ? db.user.findMany({
            where: { id: { in: pageUserIds } },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
              trustScore: true,
              trustScoreTier: true,
              tenant: {
                select: {
                  id: true,
                  name: true,
                  plan: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      pageUserIds.length
        ? db.agenticLoop.findMany({
            where: { userId: { in: pageUserIds } },
            orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
            select: {
              userId: true,
              currentStep: true,
              status: true,
              steps: true,
              revenueImpact: true,
              updatedAt: true,
            },
          })
        : Promise.resolve([]),
      pageUserIds.length
        ? db.activityLog.groupBy({
            by: ["userId"],
            where: { userId: { in: pageUserIds }, createdAt: { gte: day30 } },
            _max: { createdAt: true },
          })
        : Promise.resolve([]),
    ]);

    const usersById = new Map(users.map((user) => [user.id, user]));
    const latestLoopByUser = new Map<string, (typeof loopRows)[number]>();
    for (const loop of loopRows) {
      if (!latestLoopByUser.has(loop.userId)) {
        latestLoopByUser.set(loop.userId, loop);
      }
    }

    const lastActivityMap = new Map(
      recentActivityByUser.map((row) => [row.userId ?? "", toIsoOrNull(row._max.createdAt)]),
    );

    const orderedUsers = pageUserIds
      .map((userId) => usersById.get(userId))
      .filter(Boolean)
      .map((user) => {
        const loop = latestLoopByUser.get(user!.id);
        return {
          id: user!.id,
          name: user!.name,
          email: user!.email,
          role: user!.role.toLowerCase(),
          createdAt: user!.createdAt,
          trustScore: user!.trustScore,
          trustScoreTier: user!.trustScoreTier,
          plan: user!.tenant.plan,
          tenant: user!.tenant,
          lastActivityAt: lastActivityMap.get(user!.id) ?? null,
          active7d: activeUserIdSet.has(user!.id),
          isFlagged: flaggedUserIdSet.has(user!.id),
          loopStage: getLoopStage(loop),
          latestLoopRevenue: loop?.revenueImpact ?? 0,
          completedFirstLoop: firstLoopUserIdSet.has(user!.id),
        };
      });

    return res.json({
      users: orderedUsers,
      total: filteredUserIds.length,
      page,
      pages: Math.ceil(filteredUserIds.length / limit),
      summary: {
        active7dCount: activeUserIdSet.size,
        flaggedPostsCount: flaggedActions.length,
        firstLoopCompletionCount: firstLoopUserIdSet.size,
        lowTrustPercentage: totalUsers > 0 ? Math.round((lowTrustUsers / totalUsers) * 100) : 0,
        quickCounts: {
          all: baseUsers.length,
          active7d: baseUsers.filter((user) => activeUserIdSet.has(user.id)).length,
          new30d: baseUsers.filter((user) => user.createdAt >= day30).length,
          lowtrust: baseUsers.filter((user) => user.trustScore < 50).length,
          flagged: baseUsers.filter((user) => flaggedUserIdSet.has(user.id)).length,
          admins: baseUsers.filter((user) => user.role === "ADMIN" || user.role === "OWNER").length,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/users/:id", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const now = new Date();
    const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const user = await db.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        twoFactorEnabled: true,
        country: true,
        city: true,
        bio: true,
        skills: true,
        industry: true,
        isPublicProfile: true,
        profileViews: true,
        trustScore: true,
        trustScoreTier: true,
        trustScoreUpdatedAt: true,
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

    const [
      latestPost,
      recentCommunityPosts,
      activityLogs,
      loops,
      aiUsageGroups,
      aiCreditSpend,
      certificates,
      enrollments,
      jobApplications,
      orders,
      messages,
      flaggedActions,
      aiInteractions,
    ] = await Promise.all([
      db.post.findFirst({
        where: { authorId: user.id, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, content: true, createdAt: true },
      }),
      db.post.count({
        where: { authorId: user.id, deletedAt: null, createdAt: { gte: day7 } },
      }),
      db.activityLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 18,
        select: {
          id: true,
          action: true,
          category: true,
          metadata: true,
          createdAt: true,
        },
      }),
      db.agenticLoop.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          loopType: true,
          trigger: true,
          currentStep: true,
          steps: true,
          outcome: true,
          revenueImpact: true,
          status: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.aIInteraction.groupBy({
        by: ["agentType"],
        where: { userId: user.id },
        _count: { id: true },
        _sum: { tokens: true, cost: true },
      }),
      db.aICredit.aggregate({
        where: { userId: user.id, action: "spent" },
        _sum: { amount: true },
      }),
      db.certificate.findMany({
        where: { userId: user.id },
        orderBy: { issuedAt: "desc" },
        take: 8,
        select: { id: true, issuedAt: true, verifyToken: true, courseId: true },
      }),
      db.enrollment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          createdAt: true,
          status: true,
          courseId: true,
        },
      }),
      db.jobApplication.findMany({
        where: { freelancerId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          createdAt: true,
          status: true,
          jobId: true,
        },
      }),
      db.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          createdAt: true,
          status: true,
          total: true,
        },
      }),
      db.message.findMany({
        where: { senderId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          content: true,
          createdAt: true,
          conversationId: true,
        },
      }),
      db.assistantAction.findMany({
        where: { assistant: "nova", actionType: "flag", targetUserId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          description: true,
          status: true,
          targetId: true,
          createdAt: true,
        },
      }),
      db.aIInteraction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          layer: true,
          agentType: true,
          input: true,
          output: true,
          createdAt: true,
        },
      }),
    ]);

    const latestLoop = loops[0];
    const completedLoops = loops.filter((loop) => loop.status === "completed");
    const activeLoops = loops.filter((loop) => loop.status === "active");
    const lastPostAt = latestPost?.createdAt ?? null;
    const stalledInAcademy = enrollments.length > 0 && recentCommunityPosts === 0;
    const churnSignal = recentCommunityPosts === 0
      ? "no community engagement this week"
      : activeLoops.length === 0 && aiInteractions.length === 0
        ? "no active AI usage"
        : "reduced cross-layer momentum";
    const recommendation = stalledInAcademy
      ? "NOVA reaches out with a personalized post prompt via email."
      : user.trustScore < 50
        ? "prioritize onboarding and Academy completions to lift trust quickly."
        : "keep surfacing this user across community and work opportunities.";

    const forgeProfile = `This user's Trust Score is ${user.trustScore}. They are ${stalledInAcademy ? "stuck in the Academy layer" : "moving across the ecosystem"}.
Their last post was ${lastPostAt ? new Date(lastPostAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "not recorded"}.
Most likely churn signal: ${churnSignal}.
Recommended action: ${recommendation}`;

    const timeline = [
      ...activityLogs.map((entry) => ({
        id: `activity-${entry.id}`,
        timestamp: entry.createdAt,
        layer: entry.category,
        type: "activity",
        title: entry.action,
        description: typeof entry.metadata === "object" && entry.metadata && "summary" in entry.metadata
          ? String((entry.metadata as Record<string, unknown>).summary)
          : entry.category,
      })),
      ...certificates.map((entry) => ({
        id: `certificate-${entry.id}`,
        timestamp: entry.issuedAt,
        layer: "academy",
        type: "certificate",
        title: `Certificate issued: ${entry.courseId}`,
        description: entry.verifyToken,
      })),
      ...enrollments.map((entry) => ({
        id: `enrollment-${entry.id}`,
        timestamp: entry.createdAt,
        layer: "academy",
        type: "enrollment",
        title: `Enrolled in course ${entry.courseId}`,
        description: entry.status,
      })),
      ...jobApplications.map((entry) => ({
        id: `application-${entry.id}`,
        timestamp: entry.createdAt,
        layer: "work",
        type: "application",
        title: `Applied to job ${entry.jobId}`,
        description: entry.status,
      })),
      ...orders.map((entry) => ({
        id: `order-${entry.id}`,
        timestamp: entry.createdAt,
        layer: "market",
        type: "order",
        title: "Placed market order",
        description: `${entry.status} · $${entry.total.toFixed(2)}`,
      })),
      ...messages.map((entry) => ({
        id: `message-${entry.id}`,
        timestamp: entry.createdAt,
        layer: "community",
        type: "message",
        title: `Sent a message in conversation ${entry.conversationId}`,
        description: entry.content.slice(0, 120),
      })),
      ...aiInteractions.map((entry) => ({
        id: `ai-${entry.id}`,
        timestamp: entry.createdAt,
        layer: entry.layer,
        type: "ai",
        title: `${entry.agentType.toUpperCase()} interaction`,
        description: entry.input.slice(0, 120),
      })),
    ]
      .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime())
      .slice(0, 30);

    return res.json({
      user: {
        ...user,
        role: user.role.toLowerCase(),
        tenant: {
          ...user.tenant,
        },
        plan: user.tenant.plan,
        lastPostAt: toIsoOrNull(lastPostAt),
        loopStage: getLoopStage(latestLoop),
        forgeProfile,
        stats: {
          activeLoops: activeLoops.length,
          completedLoops: completedLoops.length,
          aiCreditsUsed: Math.abs(aiCreditSpend._sum.amount ?? 0),
          recentCommunityPosts,
          aiInteractions: aiUsageGroups.reduce((sum, entry) => sum + entry._count.id, 0),
          certificates: certificates.length,
          enrollments: enrollments.length,
          jobApplications: jobApplications.length,
          flaggedPosts: flaggedActions.length,
          last7dActive: recentCommunityPosts > 0 || aiInteractions.length > 0 || activityLogs.some((entry) => entry.createdAt >= day7),
        },
        moderation: {
          flaggedPosts: flaggedActions.length,
          items: flaggedActions.map((entry) => ({
            id: entry.id,
            description: entry.description,
            status: entry.status,
            targetId: entry.targetId,
            createdAt: entry.createdAt,
          })),
        },
        loops: loops.map((loop) => ({
          ...loop,
          loopStage: getLoopStage(loop),
        })),
        aiUsage: aiUsageGroups
          .map((group) => ({
            agentType: group.agentType,
            interactions: group._count.id,
            tokens: group._sum.tokens ?? 0,
            cost: group._sum.cost ?? 0,
          }))
          .sort((left, right) => right.interactions - left.interactions),
        timeline,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.patch("/users/:id/plan", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  const plan = String(req.body.plan ?? "").trim().toUpperCase();
  if (!["FREE", "PRO", "ENTERPRISE"].includes(plan)) {
    return res.status(400).json({ message: "Invalid plan" });
  }

  try {
    const user = await db.user.findFirst({
      where: { id: String(req.params.id), deletedAt: null },
      select: {
        id: true,
        email: true,
        tenant: {
          select: {
            id: true,
            name: true,
            plan: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const tenant = await db.tenant.update({
      where: { id: user.tenant.id },
      data: { plan: plan as PlanTier },
      select: { id: true, name: true, plan: true },
    });

    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_USER_TENANT_PLAN_CHANGED",
      summary: `Changed ${user.email}'s workspace to ${tenant.plan}`,
      metadata: {
        tenantId: tenant.id,
        targetUserId: user.id,
        plan: tenant.plan,
      },
    });

    return res.json({ tenant });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.patch("/users/:id/status", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  const rawStatus = String(req.body.status ?? "").trim().toUpperCase();
  if (!["ACTIVE", "SUSPENDED"].includes(rawStatus)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const user = await db.user.update({
      where: { id: String(req.params.id) },
      data: { deletedAt: rawStatus === "SUSPENDED" ? new Date() : null },
      select: {
        id: true,
        name: true,
        email: true,
        deletedAt: true,
        tenantId: true,
      },
    });

    await recordAdminAction({
      actor: getAdminActor(req),
      action: rawStatus === "SUSPENDED" ? "ADMIN_USER_SUSPENDED" : "ADMIN_USER_RESTORED",
      summary: `${rawStatus === "SUSPENDED" ? "Suspended" : "Restored"} ${user.email}`,
      metadata: {
        tenantId: user.tenantId,
        targetUserId: user.id,
        status: rawStatus.toLowerCase(),
      },
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        deletedAt: user.deletedAt,
        status: user.deletedAt ? "suspended" : "active",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/users/:id/forge-message", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  const message = String(req.body.message ?? "").trim();
  if (!message) {
    return res.status(400).json({ message: "message is required" });
  }

  try {
    const user = await db.user.findFirst({
      where: { id: String(req.params.id), deletedAt: null },
      select: { id: true, email: true, tenantId: true, tenant: { select: { name: true } } },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_USER_FORGE_MESSAGE_SENT",
      summary: `Sent FORGE message to ${user.email}`,
      metadata: {
        tenantId: user.tenantId,
        targetUserId: user.id,
        message,
      },
    });

    return res.json({
      message: "FORGE message queued",
      preview: `FORGE -> ${user.email}: ${message}`,
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/users/:id/reset-password", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await db.user.findFirst({
      where: { id: String(req.params.id), deletedAt: null },
      select: { id: true, email: true, tenantId: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await db.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const resetToken = await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
      select: {
        token: true,
        expiresAt: true,
      },
    });

    const appUrl = process.env.APP_URL ?? "http://localhost:5173";
    const resetUrl = `${appUrl}/reset-password?token=${resetToken.token}`;

    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_USER_PASSWORD_RESET_ISSUED",
      summary: `Issued password reset for ${user.email}`,
      metadata: {
        tenantId: user.tenantId,
        targetUserId: user.id,
      },
    });

    return res.json({
      message: "Password reset link created",
      resetUrl,
      expiresAt: resetToken.expiresAt,
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/users/:id/revoke-sessions", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await db.user.findFirst({
      where: { id: String(req.params.id), deletedAt: null },
      select: { id: true, email: true, tenantId: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [resetTokens, otpCodes] = await Promise.all([
      db.passwordResetToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      }),
      db.twoFactorOTP.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      }),
    ]);

    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_USER_SESSIONS_REVOKE_ATTEMPTED",
      summary: `Revoked pending session artifacts for ${user.email}`,
      metadata: {
        tenantId: user.tenantId,
        targetUserId: user.id,
        resetTokens: resetTokens.count,
        otpCodes: otpCodes.count,
      },
    });

    return res.json({
      message: "Pending password reset links and OTP challenges revoked. Existing JWT sessions will expire on their own until token versioning is added.",
      revokedArtifacts: {
        passwordResetTokens: resetTokens.count,
        otpCodes: otpCodes.count,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.delete("/users/:id", authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await db.user.update({
      where: { id: String(req.params.id) },
      data: { deletedAt: new Date() },
      select: { id: true, email: true, tenantId: true },
    });

    await recordAdminAction({
      actor: getAdminActor(req),
      action: "ADMIN_USER_ARCHIVED",
      summary: `Archived user ${user.email}`,
      metadata: {
        tenantId: user.tenantId,
        targetUserId: user.id,
      },
    });

    return res.json({ message: "User deleted" });
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
