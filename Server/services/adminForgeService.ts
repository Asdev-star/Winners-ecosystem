import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../db.js";
import { getAdminOverviewSnapshot } from "./adminOverviewService.js";
import { getAdminRevenueSnapshot } from "./adminRevenueService.js";
import { AppRegistry } from "./appRegistry.js";
import { getMobileHealthReport } from "./heraldMobileMonitor.js";
import { getPlatformChecklist, getPlatformLaunchControlSnapshot } from "./platformLaunchControlService.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export type ForgeTask = {
  id: string;
  label: string;
  eta: string;
  detail: string;
};

export type ForgeAlert = {
  id: string;
  tone: "critical" | "attention" | "positive";
  layer: string;
  title: string;
  detail: string;
};

export type ForgeSnapshot = {
  generatedAt: string;
  supervisor: string;
  description: string;
  opener: string;
  vitals: {
    layersLive: number;
    totalLayers: number;
    activeLoops: number;
    trustAvg: number;
    mrr: number;
    systemLabel: string;
    systemTone: "ok" | "attention";
  };
  tasks: ForgeTask[];
  alerts: ForgeAlert[];
  quickCommands: string[];
};

type ForgeChatContext = {
  snapshot: ForgeSnapshot;
  currentFocus: string;
  tenantCount: number;
  userCount: number;
  launchQueue: Awaited<ReturnType<typeof getPlatformLaunchControlSnapshot>>["queue"];
  riskyTenants: Array<{
    name: string;
    plan: string;
    currentRevenue: number;
    previousRevenue: number;
    revenueDeltaPct: number;
    recentActivity: number;
    riskScore: number;
  }>;
  topUsers: Array<{
    name: string;
    email: string;
    trustScore: number;
    completedLoops: number;
    activeLoops: number;
    tenantName: string;
    valueScore: number;
  }>;
  health: {
    label: string;
    tone: "ok" | "attention";
    database: "ok" | "down";
    ai: "ok" | "attention";
    email: "ok" | "attention";
  };
  mobileHealth: Awaited<ReturnType<typeof getMobileHealthReport>>;
};

function exists(relativePath: string) {
  return fs.existsSync(path.join(ROOT_DIR, relativePath));
}

function fmtMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function fmtPct(value: number) {
  return `${value >= 0 ? "+" : ""}${Math.round(value)}%`;
}

function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export async function getAdminForgeSnapshot(): Promise<ForgeSnapshot> {
  const [overview, revenue, launchControl, trustAverage, activeLoops, dbHealthy, mobileHealth] = await Promise.all([
    getAdminOverviewSnapshot(),
    getAdminRevenueSnapshot(),
    getPlatformLaunchControlSnapshot(),
    db.user.aggregate({ _avg: { trustScore: true } }),
    db.agenticLoop.count({ where: { status: "active" } }),
    db.$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false),
    getMobileHealthReport(),
  ]);

  const marketChecklist = await getPlatformChecklist("market");
  const communityLayer = overview.layers.find((layer) => layer.id === "community");
  const omegaCronExists = exists("Server/services/omegaReports.ts");
  const rlsMigrationExists = exists("prisma/migrations/20260223210000_phase1_rls_policies/migration.sql");
  const assistantPanelExists = exists("src/components/ui/AssistantPanel.tsx");
  const academyCertificateRouteExists = exists("Server/services/certificateService.ts");

  const systemTone: ForgeSnapshot["vitals"]["systemTone"] =
    dbHealthy && process.env.ANTHROPIC_API_KEY ? "ok" : "attention";
  const systemLabel =
    systemTone === "ok" ? "All OK" : !dbHealthy ? "Database attention" : "AI service attention";

  const tasks: ForgeTask[] = [
    {
      id: "market-checkout",
      label: "Fix CheckoutPage bug",
      eta: "4h est",
      detail: "Market launch is still blocked by vendor resolution in CheckoutPage.",
    },
    {
      id: "omega-cron",
      label: "Wire OMEGA cron",
      eta: "2h est",
      detail: omegaCronExists
        ? "Daily OMEGA briefing job exists and just needs verification."
        : "Daily OMEGA briefing cron file is still missing from the server surface.",
    },
    {
      id: "rls-verify",
      label: "Verify RLS policies",
      eta: "3h est",
      detail: rlsMigrationExists
        ? "Migration exists; application-layer enforcement still needs operator verification."
        : "RLS migration has not been detected in the repository.",
    },
    {
      id: "assistant-panel",
      label: assistantPanelExists ? "AssistantPanel hardening" : "AssistantPanel build",
      eta: assistantPanelExists ? "1d est" : "3d est",
      detail: assistantPanelExists
        ? "Shared panel exists; FORGE admin UX still needs a command-grade shell."
        : "Shared assistant shell is not in place yet for cross-layer deployment.",
    },
    {
      id: "mobile-intelligence",
      label: "Tighten mobile signal reporting",
      eta: "6h est",
      detail:
        mobileHealth.expiredTokenCount > 0
          ? `${mobileHealth.expiredTokenCount} expired mobile token${mobileHealth.expiredTokenCount === 1 ? "" : "s"} need cleanup, and offline queue telemetry still needs a client feed into HERALD.`
          : `PWA install rate is ${mobileHealth.successMetrics.pwaInstallRate.current ?? 0}% against a 15% Month 1 target, and push opt-in is ${mobileHealth.successMetrics.pushOptInRate.current ?? 0}% against a 40% target.`,
    },
  ];

  const alerts: ForgeAlert[] = [
    {
      id: "market-blockers",
      tone: (marketChecklist?.blockingCount ?? 0) > 0 ? "critical" : "positive",
      layer: "Market",
      title: `${marketChecklist?.blockingCount ?? 0} blocking issue${marketChecklist?.blockingCount === 1 ? "" : "s"}`,
      detail:
        (marketChecklist?.blockingCount ?? 0) > 0
          ? "Checkout vendor resolution and Stripe Connect payout flow are still gating launch."
          : "Market launch path is clear.",
    },
    {
      id: "academy-certificate",
      tone: academyCertificateRouteExists ? "attention" : "critical",
      layer: "Academy",
      title: academyCertificateRouteExists ? "cert PDF path needs QA" : "cert PDF not wired",
      detail: academyCertificateRouteExists
        ? "Certificate generation exists, but FORGE still wants operator QA on the final PDF flow."
        : "Certificate PDF generation is not wired into the Academy completion path.",
    },
    {
      id: "tenant-boundary",
      tone: rlsMigrationExists ? "attention" : "critical",
      layer: "Core",
      title: rlsMigrationExists ? "tenant boundary audit pending" : "tenantId scoping gap",
      detail: rlsMigrationExists
        ? "RLS migration is present; validate edit/delete surfaces against application-layer assumptions."
        : "Tenant boundary controls are missing migration coverage.",
    },
    {
      id: "community-status",
      tone: "positive",
      layer: "Community",
      title: `${communityLayer?.progress ?? 80}% — ready`,
      detail: communityLayer?.note ?? "Community is stable and feeding signals into the wider ecosystem.",
    },
  ];

  alerts.push({
    id: "mobile-health",
    tone:
      mobileHealth.expiredTokenCount > 0 || mobileHealth.successMetrics.fcmDeliveryRate.status === "off_track"
        ? "attention"
        : "positive",
    layer: "Mobile",
    title:
      mobileHealth.expiredTokenCount > 0
        ? `${mobileHealth.expiredTokenCount} stale push token${mobileHealth.expiredTokenCount === 1 ? "" : "s"} detected`
        : `${mobileHealth.pushPermissions} active push permission${mobileHealth.pushPermissions === 1 ? "" : "s"}`,
    detail:
      mobileHealth.expiredTokenCount > 0
        ? `FCM delivery health is ${mobileHealth.fcmDeliveryRate}% and HERALD is waiting on client queue/session telemetry to complete the mobile picture.`
        : `PWA install rate is ${mobileHealth.successMetrics.pwaInstallRate.current ?? 0}% versus a 15% Month 1 target, push opt-in is ${mobileHealth.successMetrics.pushOptInRate.current ?? 0}% versus 40%, and the next monetization lane is ${mobileHealth.monetization.find((lane) => lane.status === "building")?.label ?? "native monetization planning"}.`,
  });

  const currentFocus =
    alerts.find((alert) => alert.tone === "critical")?.layer ??
    alerts.find((alert) => alert.tone === "attention")?.layer ??
    "Community";

  return {
    generatedAt: new Date().toISOString(),
    supervisor: "FORGE",
    description:
      "Your personal ecosystem supervisor. FORGE sees what OMEGA sees, but synthesises it specifically for you as operator.",
    opener: `Operator briefing ready. ${currentFocus} needs the most attention right now, and the single most important move is ${tasks[0].label.toLowerCase()}.`,
    vitals: {
      layersLive: overview.kpis.liveLayers,
      totalLayers: AppRegistry.summary().totalApps,
      activeLoops,
      trustAvg: Math.round(trustAverage._avg.trustScore ?? 0),
      mrr: revenue.kpis.mrr,
      systemLabel,
      systemTone,
    },
    tasks,
    alerts,
    quickCommands: [
      "What should I prioritise this week?",
      "Why did MRR drop on Tuesday?",
      "Which users are most likely to churn?",
      "What's blocking Market launch?",
      "Generate tenant health report",
      "Generate a status report for this week",
      "Who are my top 10 most valuable users?",
      "What would double MRR in 90 days?",
      "Run a health check on all platform services",
      "Show me mobile health and push delivery",
      "Show me mobile monetization plan",
      "Which users have completed the most agentic loops?",
      "Write a broadcast message for all PRO users",
    ],
  };
}

export async function getAdminForgeChatContext(): Promise<ForgeChatContext> {
  const [snapshot, launchControl, userCount, recentActivity, tenants, loops, mobileHealth] =
    await Promise.all([
      getAdminForgeSnapshot(),
      getPlatformLaunchControlSnapshot(),
      db.user.count({ where: { deletedAt: null } }),
      db.activityLog.groupBy({
        by: ["tenantId"],
        where: { createdAt: { gte: new Date(Date.now() - 30 * DAY_MS) } },
        _count: { id: true },
      }),
      db.tenant.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          plan: true,
          revenueRecords: {
            where: { recordedAt: { gte: new Date(Date.now() - 60 * DAY_MS) } },
            select: { amount: true, recordedAt: true },
          },
        },
      }),
      db.agenticLoop.findMany({
        select: {
          userId: true,
          status: true,
        },
      }),
      getMobileHealthReport(),
    ]);

  const dbHealthy = await db.$queryRaw`SELECT 1`
    .then(() => true)
    .catch(() => false);

  const activityByTenant = new Map(recentActivity.map((row) => [row.tenantId, row._count.id]));
  const riskyTenants = tenants
    .map((tenant) => {
      const currentRevenue = tenant.revenueRecords
        .filter((record) => record.recordedAt >= new Date(Date.now() - 30 * DAY_MS))
        .reduce((total, record) => total + record.amount, 0);
      const previousRevenue = tenant.revenueRecords
        .filter(
          (record) =>
            record.recordedAt >= new Date(Date.now() - 60 * DAY_MS) &&
            record.recordedAt < new Date(Date.now() - 30 * DAY_MS)
        )
        .reduce((total, record) => total + record.amount, 0);
      const revenueDeltaPct =
        previousRevenue > 0 ? round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : 0;
      const recentTenantActivity = activityByTenant.get(tenant.id) ?? 0;
      const riskScore =
        (currentRevenue <= 0 ? 32 : 0) +
        (revenueDeltaPct < -15 ? 28 : revenueDeltaPct < 0 ? 12 : 0) +
        (recentTenantActivity < 10 ? 22 : recentTenantActivity < 25 ? 10 : 0) +
        (tenant.plan === "FREE" ? 10 : 0);

      return {
        name: tenant.name,
        plan: tenant.plan,
        currentRevenue: round(currentRevenue),
        previousRevenue: round(previousRevenue),
        revenueDeltaPct,
        recentActivity: recentTenantActivity,
        riskScore,
      };
    })
    .sort((left, right) => right.riskScore - left.riskScore)
    .slice(0, 5);

  const loopCounts = new Map<string, { completed: number; active: number }>();
  loops.forEach((loop) => {
    const current = loopCounts.get(loop.userId) ?? { completed: 0, active: 0 };
    if (loop.status === "completed") current.completed += 1;
    if (loop.status === "active") current.active += 1;
    loopCounts.set(loop.userId, current);
  });

  const users = await db.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      trustScore: true,
      tenant: { select: { name: true } },
    },
    take: 120,
    orderBy: { trustScore: "desc" },
  });

  const topUsers = users
    .map((user) => {
      const counts = loopCounts.get(user.id) ?? { completed: 0, active: 0 };
      const valueScore = user.trustScore + counts.completed * 6 + counts.active * 3;
      return {
        name: user.name,
        email: user.email,
        trustScore: user.trustScore,
        completedLoops: counts.completed,
        activeLoops: counts.active,
        tenantName: user.tenant.name,
        valueScore,
      };
    })
    .sort((left, right) => right.valueScore - left.valueScore)
    .slice(0, 10);

  return {
    snapshot,
    currentFocus: snapshot.alerts.find((alert) => alert.tone !== "positive")?.layer ?? "Community",
    tenantCount: tenants.length,
    userCount,
    launchQueue: launchControl.queue,
    riskyTenants,
    topUsers,
    health: {
      label: snapshot.vitals.systemLabel,
      tone: snapshot.vitals.systemTone,
      database: dbHealthy ? "ok" : "down",
      ai: process.env.ANTHROPIC_API_KEY ? "ok" : "attention",
      email: process.env.RESEND_API_KEY ? "ok" : "attention",
    },
    mobileHealth,
  };
}

export function buildAdminForgeSystemPrompt(context: ForgeChatContext, adminEmail: string) {
  return `You are FORGE, the Core Engine supervisor and personal AI advisor to the ecosystem administrator.
You are not a chatbot. You are a strategic intelligence that supervises the entire Winners Ecosystem on behalf of its sole administrator.

You have complete operational visibility:
- Platform layers: ${JSON.stringify(AppRegistry.summary().apps.map((app) => ({ id: app.id, name: app.name, phase: app.phase, status: app.status })))}
- Total tenants: ${context.tenantCount}
- Total users: ${context.userCount}
- Monthly revenue: ${fmtMoney(context.snapshot.vitals.mrr)}
- Active loops right now: ${context.snapshot.vitals.activeLoops}
- System health: ${JSON.stringify(context.health)}
- Mobile health: ${JSON.stringify(context.mobileHealth)}
- FORGE operator snapshot: ${JSON.stringify(context.snapshot)}
- Launch queue: ${JSON.stringify(context.launchQueue)}
- Highest-risk tenants: ${JSON.stringify(context.riskyTenants)}
- Highest-value users: ${JSON.stringify(context.topUsers)}
- Ecosystem overview KPI block: ${JSON.stringify({
    layersLive: context.snapshot.vitals.layersLive,
    totalLayers: context.snapshot.vitals.totalLayers,
    trustAvg: context.snapshot.vitals.trustAvg,
    currentFocus: context.currentFocus,
  })}

Your tone: strategic, precise, never verbose. You give direct recommendations.
You always tell the admin the single most important thing to do right now.
You never hedge. You always reference specific data. You speak as a COO who has read every system log, every user event, and every revenue signal.

When the admin asks for a report, return a concise operator briefing with sections only if needed.
When the admin asks about blockers, name the blocker count and the blocking item names.
When the admin asks who is most at risk, prioritise risk score, revenue drop, and low activity.
When the admin asks who is most valuable, prioritise trust score and completed loops.

Current date and time: ${new Date().toISOString()}
Admin email: ${adminEmail}`;
}

export async function buildAdminForgeFallbackResponse(context: ForgeChatContext, message: string) {
  const normalized = message.toLowerCase();
  const focusAlert =
    context.snapshot.alerts.find((alert) => alert.tone === "critical") ??
    context.snapshot.alerts.find((alert) => alert.tone === "attention") ??
    context.snapshot.alerts[0];
  const topRiskTenant = context.riskyTenants[0];
  const topUser = context.topUsers[0];

  if (normalized.includes("market blocker")) {
    const marketChecklist = await getPlatformChecklist("market");
    const blockers = marketChecklist?.checks.filter((check) => check.status === "fail") ?? [];
    const blockerLine = blockers.length
      ? blockers.map((blocker) => blocker.label).join("; ")
      : "No blocking items are currently registered.";
    return `Market has ${blockers.length} blocking issue${blockers.length === 1 ? "" : "s"}. ${blockerLine} The single most important move right now is to fix CheckoutPage vendor resolution so launch can proceed.`;
  }

  if (normalized.includes("which layer") || normalized.includes("most attention")) {
    return `${focusAlert.layer} needs the most attention right now. ${focusAlert.title}. ${focusAlert.detail} The single most important move is ${context.snapshot.tasks[0].label.toLowerCase()}.`;
  }

  if (normalized.includes("tenant health")) {
    const tenants = context.riskyTenants
      .slice(0, 3)
      .map(
        (tenant, index) =>
          `${index + 1}. ${tenant.name}: ${fmtMoney(tenant.currentRevenue)} current revenue, ${fmtPct(tenant.revenueDeltaPct)} vs prior month, ${tenant.recentActivity} recent activity events.`
      )
      .join(" ");
    return `Tenant health report: ${tenants || "No tenant risk data is available."} The single most important move is to stabilise the top-risk tenant before churn compounds.`;
  }

  if (normalized.includes("churning") || normalized.includes("risk of churn") || normalized.includes("most at risk")) {
    if (!topRiskTenant) {
      return "No tenant risk data is available yet. The single most important move is to instrument tenant revenue and activity scoring before churn compounds.";
    }
    return `${topRiskTenant.name} is the tenant most at risk of churning right now. It is on the ${topRiskTenant.plan} plan, generated ${fmtMoney(topRiskTenant.currentRevenue)} in the current 30-day window, is ${fmtPct(topRiskTenant.revenueDeltaPct)} versus the prior month, and logged ${topRiskTenant.recentActivity} recent activity events. The single most important move is to intervene on this tenant before revenue decay spreads.`;
  }

  if (normalized.includes("status report") || normalized.includes("this week")) {
    const criticalAlerts = context.snapshot.alerts.filter((alert) => alert.tone === "critical").length;
    const attentionAlerts = context.snapshot.alerts.filter((alert) => alert.tone === "attention").length;
    return `Weekly status report: ${context.snapshot.vitals.layersLive} of ${context.snapshot.vitals.totalLayers} layers are live, MRR is ${fmtMoney(context.snapshot.vitals.mrr)}, average trust is ${context.snapshot.vitals.trustAvg}, and ${context.snapshot.vitals.activeLoops} loops are active right now. FORGE is tracking ${criticalAlerts} critical alert${criticalAlerts === 1 ? "" : "s"} and ${attentionAlerts} attention item${attentionAlerts === 1 ? "" : "s"}. The single most important move is ${context.snapshot.tasks[0].label.toLowerCase()}.`;
  }

  if (normalized.includes("valuable users") || normalized.includes("top 10")) {
    const users = context.topUsers
      .slice(0, 5)
      .map(
        (user, index) =>
          `${index + 1}. ${user.name} (${user.tenantName}) — trust ${user.trustScore}, completed loops ${user.completedLoops}, active loops ${user.activeLoops}.`
      )
      .join(" ");
    return `Your highest-value users right now are led by ${topUser?.name ?? "no ranked user"}. ${users} The single most important move is to keep these users in motion across more than one live layer.`;
  }

  if (normalized.includes("completed the most agentic loops") || normalized.includes("most agentic loops")) {
    const loopLeaders = [...context.topUsers]
      .sort((left, right) => right.completedLoops - left.completedLoops || right.activeLoops - left.activeLoops)
      .slice(0, 5)
      .map(
        (user, index) =>
          `${index + 1}. ${user.name} (${user.tenantName}) — completed loops ${user.completedLoops}, active loops ${user.activeLoops}, trust ${user.trustScore}.`
      )
      .join(" ");
    return `Users with the strongest completed loop volume: ${loopLeaders || "No loop leaderboard is available yet."} The single most important move is to route these users into the next live layer before momentum decays.`;
  }

  if (normalized.includes("double mrr") || normalized.includes("90 days")) {
    return `To double MRR in 90 days, clear the Market blockers first, because commerce is the only near-term layer with meaningful incremental revenue headroom. Then push vendor onboarding and PRO retention in parallel. The single most important move is to launch Market after CheckoutPage vendor resolution is fixed.`;
  }

  if (normalized.includes("health check")) {
    return `System health is ${context.health.label}. Database is ${context.health.database}. AI is ${context.health.ai}. Email is ${context.health.email}. The single most important move is to keep infrastructure stable while you clear Market launch blockers.`;
  }

  if (
    normalized.includes("mobile health") ||
    normalized.includes("push delivery") ||
    normalized.includes("pwa install")
  ) {
    return `Mobile health report: PWA install rate is ${context.mobileHealth.successMetrics.pwaInstallRate.current ?? 0}% against a 15% Month 1 target and ${context.mobileHealth.successMetrics.pwaInstallRate.month3Target}% Month 3 target. Push opt-in is ${context.mobileHealth.successMetrics.pushOptInRate.current ?? 0}% against a 40% Month 1 target. Push open rate proxy is ${context.mobileHealth.successMetrics.pushOpenRate.current ?? 0}%, and FCM delivery health is ${context.mobileHealth.fcmDeliveryRate}%. Platform mix is web ${context.mobileHealth.platformBreakdown.web}, iOS ${context.mobileHealth.platformBreakdown.ios}, Android ${context.mobileHealth.platformBreakdown.android}. The single most important move is to wire offline queue depth and session duration telemetry into HERALD so FORGE can see the full mobile picture.`;
  }

  if (
    normalized.includes("mobile monetization") ||
    normalized.includes("m-pesa") ||
    normalized.includes("flutterwave") ||
    normalized.includes("app store")
  ) {
    const lanes = context.mobileHealth.monetization
      .map((lane) => `${lane.label} (${lane.status}) via ${lane.platform} — ${lane.notes}`)
      .join(" ");
    return `Mobile monetization plan: ${lanes} The single most important move is to finish the native checkout lane, because Stripe-backed in-app purchases unlock courses and AI credits before the later M-Pesa and vendor-sponsored push streams come online.`;
  }

  if (normalized.includes("broadcast message") || normalized.includes("pro users")) {
    return `Broadcast draft for PRO users: "FORGE operator update: the ecosystem is expanding, Market launch is approaching, and your PRO workspace is first in line for the next wave of automation, revenue tools, and cross-layer intelligence. Stay active this week so your account is ready when the next release goes live." The single most important move is to send this only after you confirm the current launch timeline.`;
  }

  return `FORGE operator briefing: ${context.snapshot.vitals.layersLive} of ${context.snapshot.vitals.totalLayers} layers are live, MRR is ${fmtMoney(
    context.snapshot.vitals.mrr
  )}, average trust is ${context.snapshot.vitals.trustAvg}, and ${context.snapshot.vitals.activeLoops} loops are active right now. ${
    topRiskTenant
      ? `${topRiskTenant.name} is the highest-risk tenant with ${fmtPct(topRiskTenant.revenueDeltaPct)} revenue change and ${topRiskTenant.recentActivity} recent activity events. `
      : ""
  }The single most important move is ${context.snapshot.tasks[0].label.toLowerCase()}.`;
}
