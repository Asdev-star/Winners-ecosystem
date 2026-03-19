import crypto from "crypto";
import db from "../db.js";
import { getAdminOverviewSnapshot } from "./adminOverviewService.js";
import { getAdminRevenueSnapshot } from "./adminRevenueService.js";
import { getAdminBroadcastSnapshot } from "./adminBroadcastService.js";
import { getAdminSecuritySnapshot } from "./adminSecurityService.js";
import { getAdminSystemHealthSnapshot } from "./adminSystemHealthService.js";
import {
  getPlatformChecklist,
  getPlatformLaunchControlSnapshot,
} from "./platformLaunchControlService.js";

export interface AdminForgeInsightResult {
  generatedAt: string;
  path: string;
  insight: string;
  context: string;
}

interface BuildAdminForgeInsightInput {
  path?: string;
  seed?: string;
  exclude?: string[];
}

function cleanPath(input?: string) {
  const raw = String(input ?? "/admin/overview").trim();
  const [withoutQuery] = raw.split(/[?#]/);
  const normalized = withoutQuery.replace(/\/+$/, "") || "/admin/overview";
  if (normalized === "/ops") return "/admin/health";
  return normalized.startsWith("/admin") ? normalized : "/admin/overview";
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function verbForCount(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

function normalizeSentence(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function fmtMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function fmtSignedPct(value: number, digits = 0) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function daysSince(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

function scoreCandidate(seed: string, text: string) {
  return crypto.createHash("sha256").update(`${seed}:${text}`).digest("hex");
}

function chooseCandidate(candidates: string[], exclude: string[] = [], seed?: string) {
  const unique = Array.from(new Set(candidates.map(normalizeSentence).filter(Boolean)));
  if (unique.length === 0) {
    return "FORGE is calibrating this admin surface right now.";
  }

  const excluded = new Set(exclude.map(normalizeSentence));
  const selectionSeed = seed?.trim() || crypto.randomUUID();
  const ordered = [...unique].sort((left, right) =>
    scoreCandidate(selectionSeed, left).localeCompare(scoreCandidate(selectionSeed, right)),
  );

  const match = ordered.find((candidate) => !excluded.has(candidate));
  if (match) return match;

  const stamp = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${ordered[0].replace(/[.?!]+$/, "")}, refreshed at ${stamp}.`;
}

function estimateDevHours(blockingCount: number, warningCount: number) {
  return Math.max(1, blockingCount * 3 + warningCount);
}

function parseOpenRate(value: string) {
  const match = value.match(/(\d+(?:\.\d+)?)%/);
  return match ? Number.parseFloat(match[1]) : null;
}

function monthYearLabel(year: number, monthIndex: number) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(year, monthIndex, 1),
  );
}

async function buildOverviewCandidates() {
  const overview = await getAdminOverviewSnapshot();
  const loopDelta = Math.abs(overview.kpis.loopsDeltaPct);
  const loopDirection = overview.kpis.loopsDeltaPct >= 0 ? "above" : "below";

  return [
    `${overview.kpis.loopsToday} agentic ${pluralize(overview.kpis.loopsToday, "loop")} fired today, ${loopDelta}% ${loopDirection} yesterday's pace.`,
    `${overview.kpis.liveLayers} layers are live, ${overview.kpis.lockedLayers} remain gated, and system health is ${overview.kpis.healthLabel.toLowerCase()}.`,
    `${overview.kpis.activeUsers} recently active users are driving ${fmtMoney(overview.kpis.mrr)} in current MRR.`,
    `FORGE sees ${overview.signals.length} fresh admin ${pluralize(overview.signals.length, "signal")} and ${overview.recentActions.length} recent operator ${pluralize(overview.recentActions.length, "action")}.`,
  ];
}

async function buildPlatformCandidates() {
  const snapshot = await getPlatformLaunchControlSnapshot();
  const queue = snapshot.queue;
  const liveRows = snapshot.rows.filter((row) => row.actionMode === "metrics").length;

  if (!queue) {
    return [
      `${liveRows} platform layers are already live, and launch control is waiting for the next queued surface.`,
      `${snapshot.usersNotifiedCount.toLocaleString("en-US")} users will hear the next platform launch instantly.`,
      snapshot.summary,
    ];
  }

  const liveDependencies = queue.dependencies.filter((dependency) => dependency.isLive).length;
  return [
    `${queue.name} is ${queue.blockingCount} ${pluralize(queue.blockingCount, "bug-fix")} away from launch, with about ${estimateDevHours(queue.blockingCount, queue.warningCount)} dev hours left.`,
    `${queue.name} leads the launch queue with ${liveDependencies}/${queue.dependencies.length} dependencies already live.`,
    `${queue.name} is ${queue.progress}% complete, and ${snapshot.usersNotifiedCount.toLocaleString("en-US")} users are standing by for the next unlock.`,
    `${liveRows} layers are already live, and FORGE still wants the next command focused on ${queue.name}.`,
  ];
}

async function buildPlatformLayerCandidates(layerId: string) {
  const snapshot = await getPlatformLaunchControlSnapshot();
  const row = snapshot.rows.find((entry) => entry.id === layerId);
  const checklist = await getPlatformChecklist(layerId);

  if (!row || !checklist) {
    return buildPlatformCandidates();
  }

  const blockingCheck = checklist.checks.find((check) => check.status === "fail");
  const warningCheck = checklist.checks.find((check) => check.status === "warn");
  const liveDependencies = row.dependencies.filter((dependency) => dependency.isLive).length;

  return [
    checklist.blockingCount > 0
      ? `${row.name} still has ${checklist.blockingCount} blocking ${pluralize(checklist.blockingCount, "issue")}, led by ${blockingCheck?.label ?? "launch readiness"}.`
      : `${row.name} has cleared every required launch check and is ready for operator review.`,
    `${row.name} is ${row.progress}% complete, with ${liveDependencies}/${row.dependencies.length} dependencies currently live.`,
    `${row.name} carries ${checklist.warningCount} warning ${pluralize(checklist.warningCount, "signal")} and ${checklist.blockingCount} hard ${pluralize(checklist.blockingCount, "blocker")}.`,
    warningCheck
      ? `${row.name} is stable enough to inspect, but FORGE still wants a pass on ${warningCheck.label}.`
      : `${row.name} is holding steady under the ${row.badge.toLowerCase()} command state.`,
  ];
}

async function buildTenantsCandidates() {
  const now = new Date();
  const day30 = new Date(now.getTime() - 30 * 86_400_000);
  const day7 = new Date(now.getTime() - 7 * 86_400_000);

  const [activeTenants, enterpriseTenant, topRevenueGroup, upgradeSignals] = await Promise.all([
    db.tenant.count({ where: { deletedAt: null } }),
    db.tenant.findFirst({
      where: { deletedAt: null, plan: "ENTERPRISE" },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, createdAt: true },
    }),
    db.revenueRecord.groupBy({
      by: ["tenantId"],
      where: { recordedAt: { gte: day30 } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 1,
    }),
    db.tenant.count({
      where: {
        deletedAt: null,
        plan: { not: "FREE" },
        updatedAt: { gte: day7 },
      },
    }),
  ]);

  const topTenant = topRevenueGroup[0]
    ? await db.tenant.findFirst({
        where: { id: topRevenueGroup[0].tenantId },
        select: { name: true, plan: true },
      })
    : null;

  return [
    topTenant
      ? `${topTenant.name} is leading tenant revenue this month at ${fmtMoney(topRevenueGroup[0]._sum.amount ?? 0)}.`
      : "No tenant has posted paid revenue yet this month, so FORGE is watching upgrade momentum instead.",
    enterpriseTenant
      ? `${enterpriseTenant.name} has been on Enterprise for ${daysSince(enterpriseTenant.createdAt)} days and is still part of the active command surface.`
      : `FORGE sees ${activeTenants} active ${pluralize(activeTenants, "workspace")} and no current Enterprise tenant to highlight.`,
    `${upgradeSignals} tenant upgrade ${pluralize(upgradeSignals, "signal")} fired this week across ${activeTenants} active ${pluralize(activeTenants, "workspace")}.`,
  ];
}

async function buildTenantDetailCandidates(tenantId: string) {
  const tenant = await db.tenant.findFirst({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      plan: true,
      createdAt: true,
      users: {
        where: { deletedAt: null },
        select: { id: true },
      },
    },
  });

  if (!tenant) {
    return buildTenantsCandidates();
  }

  const now = new Date();
  const day30 = new Date(now.getTime() - 30 * 86_400_000);
  const day60 = new Date(now.getTime() - 60 * 86_400_000);
  const userIds = tenant.users.map((user) => user.id);

  const [last30Revenue, previous30Revenue, activeUserGroups, activeLoops] = await Promise.all([
    db.revenueRecord.aggregate({
      where: { tenantId: tenant.id, recordedAt: { gte: day30 } },
      _sum: { amount: true },
    }),
    db.revenueRecord.aggregate({
      where: { tenantId: tenant.id, recordedAt: { gte: day60, lt: day30 } },
      _sum: { amount: true },
    }),
    userIds.length
      ? db.activityLog.groupBy({
          by: ["userId"],
          where: {
            tenantId: tenant.id,
            userId: { in: userIds },
            createdAt: { gte: day30 },
          },
          _max: { createdAt: true },
        })
      : Promise.resolve([]),
    db.agenticLoop.count({
      where: { tenantId: tenant.id, status: "active" },
    }),
  ]);

  const currentRevenue = last30Revenue._sum.amount ?? 0;
  const previousRevenue = previous30Revenue._sum.amount ?? 0;
  const revenueDeltaPct =
    previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : currentRevenue > 0
        ? 100
        : 0;

  return [
    `${tenant.name} has been on ${tenant.plan} for ${daysSince(tenant.createdAt)} days, with ${activeUserGroups.length} active users in the last 30 days.`,
    `${tenant.name} is ${revenueDeltaPct >= 0 ? "up" : "down"} ${Math.abs(revenueDeltaPct)}% month over month and has ${activeLoops} active agentic ${pluralize(activeLoops, "loop")}.`,
    `${tenant.name} generated ${fmtMoney(currentRevenue)} in the last 30 days across ${tenant.users.length} total ${pluralize(tenant.users.length, "seat")}.`,
  ];
}

async function buildUsersCandidates() {
  const now = new Date();
  const day7 = new Date(now.getTime() - 7 * 86_400_000);
  const day30 = new Date(now.getTime() - 30 * 86_400_000);

  const [
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
      select: { targetId: true },
    }),
    db.agenticLoop.groupBy({
      by: ["userId"],
      where: { status: "completed", completedAt: { gte: day30 } },
      _count: { id: true },
    }),
    db.user.count({ where: { deletedAt: null } }),
    db.user.count({ where: { deletedAt: null, trustScore: { lt: 50 } } }),
  ]);

  const activeUserIds = new Set<string>([
    ...recentActivityUsers.map((row) => row.userId).filter(Boolean),
    ...recentAiUsers.map((row) => row.userId),
    ...recentPostAuthors.map((row) => row.authorId),
    ...recentMessageSenders.map((row) => row.senderId),
    ...recentEnrollmentUsers.map((row) => row.userId),
    ...recentJobUsers.map((row) => row.freelancer.userId),
  ] as string[]);
  const firstLoopCount = firstLoopGroups.filter((row) => row._count.id === 1).length;
  const lowTrustPercentage = totalUsers > 0 ? Math.round((lowTrustUsers / totalUsers) * 100) : 0;

  return [
    `${firstLoopCount} users completed their first full agentic ${pluralize(firstLoopCount, "loop")} in the last 30 days.`,
    `${activeUserIds.size} users were active in the last 7 days, while ${lowTrustPercentage}% still sit below a Trust Score of 50.`,
    `NOVA raised ${flaggedActions.length} moderation ${pluralize(flaggedActions.length, "flag")}, and FORGE still sees ${activeUserIds.size} recently engaged users.`,
  ];
}

async function buildUserDetailCandidates(userId: string) {
  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      createdAt: true,
      trustScore: true,
      trustScoreTier: true,
      tenant: {
        select: {
          name: true,
          plan: true,
        },
      },
    },
  });

  if (!user) {
    return buildUsersCandidates();
  }

  const [activeLoops, completedLoops, certificates] = await Promise.all([
    db.agenticLoop.count({ where: { userId, status: "active" } }),
    db.agenticLoop.count({ where: { userId, status: "completed" } }),
    db.certificate.count({ where: { userId } }),
  ]);

  return [
    `${user.name} holds a Trust Score of ${user.trustScore} as a ${user.trustScoreTier.toLowerCase()}, with ${completedLoops} completed agentic ${pluralize(completedLoops, "loop")}.`,
    `${user.name} has ${activeLoops} active ${pluralize(activeLoops, "loop")} and ${certificates} earned ${pluralize(certificates, "certificate")} inside ${user.tenant.name}.`,
    `${user.name} joined ${daysSince(user.createdAt)} days ago and is still operating inside ${user.tenant.name}'s ${user.tenant.plan} workspace.`,
  ];
}

async function buildRevenueCandidates() {
  const snapshot = await getAdminRevenueSnapshot();
  const now = new Date();
  const targetYear = now.getFullYear();
  const monthsUntilDecember = Math.max(0, 11 - now.getMonth());
  const monthlyGrowthFactor = Math.max(0, 1 + snapshot.kpis.growthPct / 100);
  const projectedDecemberMrr = snapshot.kpis.mrr * Math.pow(monthlyGrowthFactor, monthsUntilDecember);
  const projectedArr = projectedDecemberMrr * 12;

  return [
    `ARR projects to ${fmtMoney(projectedArr)} by ${monthYearLabel(targetYear, 11)} at the current ${fmtSignedPct(snapshot.kpis.growthPct, 1)} growth pace.`,
    `Current MRR is ${fmtMoney(snapshot.kpis.mrr)}, with ${snapshot.kpis.stripeConnectedTenants} Stripe-connected tenant ${pluralize(snapshot.kpis.stripeConnectedTenants, "account")} supporting it.`,
    `${snapshot.kpis.subscriptionSharePct}% of revenue is recurring subscription volume, and the 90-day market forecast adds ${fmtMoney(snapshot.kpis.marketForecast90d)} of upside.`,
  ];
}

async function buildHealthCandidates() {
  const snapshot = await getAdminSystemHealthSnapshot();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const incidentCountToday = snapshot.errorLogs.filter(
    (entry) =>
      entry.statusCode >= 500 && new Date(entry.createdAt).getTime() >= startOfToday.getTime(),
  ).length;
  const downCount = snapshot.services.filter((service) => service.tone === "down").length;
  const attentionCount = snapshot.services.filter(
    (service) => service.tone === "warning" || service.tone === "down",
  ).length;
  const rlsDays =
    snapshot.database.rlsVerifiedAt == null
      ? null
      : daysSince(snapshot.database.rlsVerifiedAt);

  return [
    `${downCount === 0 ? "All critical services are nominal" : `${downCount} critical ${pluralize(downCount, "service")} are degraded`}, and ${incidentCountToday} ${pluralize(incidentCountToday, "incident")} ${verbForCount(incidentCountToday, "has", "have")} been logged today.`,
    `FORGE sees ${attentionCount} ${pluralize(attentionCount, "service")} needing attention, while ${snapshot.database.pendingMigrations} migration ${pluralize(snapshot.database.pendingMigrations, "item")} ${verbForCount(snapshot.database.pendingMigrations, "remains", "remain")} pending.`,
    rlsDays == null
      ? "RLS has not been operator-verified yet, and FORGE wants that checkpoint recorded soon."
      : `RLS was verified ${rlsDays} ${pluralize(rlsDays, "day")} ago, and ${snapshot.errorLogs.length} recent error ${pluralize(snapshot.errorLogs.length, "log")} ${verbForCount(snapshot.errorLogs.length, "remains", "remain")} on the board.`,
  ];
}

async function buildBroadcastCandidates() {
  const snapshot = await getAdminBroadcastSnapshot();
  const bestOpenRate = snapshot.recentBroadcasts
    .map((entry) => ({
      title: entry.title,
      rate: parseOpenRate(entry.openRateLabel),
    }))
    .filter((entry): entry is { title: string; rate: number } => entry.rate != null)
    .sort((left, right) => right.rate - left.rate)[0];
  const largestLayer = [...snapshot.layers].sort((left, right) => right.count - left.count)[0];

  return [
    bestOpenRate
      ? `The highest broadcast open rate so far is ${bestOpenRate.rate}% on "${bestOpenRate.title}".`
      : "No tracked broadcast open rate is available yet, so FORGE is watching audience reach instead.",
    `${snapshot.audiences.allUsers.toLocaleString("en-US")} users are reachable right now, and ${snapshot.recentBroadcasts.length} recent broadcast ${pluralize(snapshot.recentBroadcasts.length, "record")} ${verbForCount(snapshot.recentBroadcasts.length, "is", "are")} on the board.`,
    largestLayer
      ? `${largestLayer.label} is the biggest live audience segment at ${largestLayer.count.toLocaleString("en-US")} users.`
      : "FORGE is waiting for the first layer-specific broadcast audience to register.",
  ];
}

async function buildSecurityCandidates() {
  const snapshot = await getAdminSecuritySnapshot();
  const attentionCount = snapshot.securityStatus.filter((item) => item.tone !== "healthy").length;
  const sourceFile = snapshot.finding.sourcePath.split("/").pop() ?? "the security surface";

  return [
    `${attentionCount} security ${pluralize(attentionCount, "gap")} ${verbForCount(attentionCount, "needs", "need")} attention, led by ${snapshot.finding.title}.`,
    `FORGE still wants operator review on ${sourceFile} because ${snapshot.finding.summary.toLowerCase()}`,
    `${snapshot.auditLog.length} admin security ${pluralize(snapshot.auditLog.length, "action")} ${verbForCount(snapshot.auditLog.length, "is", "are")} logged, and GDPR coverage currently reads ${snapshot.gdpr.privacyAcknowledgmentLabel}.`,
  ];
}

async function buildSettingsCandidates() {
  const [overview, security, tenantCount, userCount] = await Promise.all([
    getAdminOverviewSnapshot(),
    getAdminSecuritySnapshot(),
    db.tenant.count({ where: { deletedAt: null } }),
    db.user.count({ where: { deletedAt: null } }),
  ]);
  const attentionCount = security.securityStatus.filter((item) => item.tone !== "healthy").length;

  return [
    `These settings govern ${tenantCount} tenant ${pluralize(tenantCount, "workspace")}, ${userCount} users, and ${overview.kpis.liveLayers} live layers right now.`,
    `${attentionCount} admin control ${pluralize(attentionCount, "surface")} still ${verbForCount(attentionCount, "needs", "need")} review before the sovereign console goes quiet.`,
    `FORGE is guarding ${overview.kpis.lockedLayers} locked layers and ${overview.kpis.liveLayers} live layers from this settings surface.`,
  ];
}

async function buildCandidatesForPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const pageKey = segments[1] ?? "overview";

  if (pageKey === "overview") {
    return { context: "overview", candidates: await buildOverviewCandidates() };
  }

  if (pageKey === "platform") {
    const layerId = segments[2];
    return {
      context: layerId ? `platform:${layerId}` : "platform",
      candidates: layerId ? await buildPlatformLayerCandidates(layerId) : await buildPlatformCandidates(),
    };
  }

  if (pageKey === "tenants") {
    const tenantId = segments[2];
    return {
      context: tenantId ? `tenant:${tenantId}` : "tenants",
      candidates: tenantId ? await buildTenantDetailCandidates(tenantId) : await buildTenantsCandidates(),
    };
  }

  if (pageKey === "users") {
    const userId = segments[2];
    return {
      context: userId ? `user:${userId}` : "users",
      candidates: userId ? await buildUserDetailCandidates(userId) : await buildUsersCandidates(),
    };
  }

  if (pageKey === "revenue") {
    return { context: "revenue", candidates: await buildRevenueCandidates() };
  }

  if (pageKey === "health") {
    return { context: "health", candidates: await buildHealthCandidates() };
  }

  if (pageKey === "broadcast") {
    return { context: "broadcast", candidates: await buildBroadcastCandidates() };
  }

  if (pageKey === "security") {
    return { context: "security", candidates: await buildSecurityCandidates() };
  }

  if (pageKey === "settings") {
    return { context: "settings", candidates: await buildSettingsCandidates() };
  }

  return { context: "overview", candidates: await buildOverviewCandidates() };
}

export async function buildAdminForgeInsight(
  input: BuildAdminForgeInsightInput = {},
): Promise<AdminForgeInsightResult> {
  const path = cleanPath(input.path);
  const { context, candidates } = await buildCandidatesForPath(path);

  return {
    generatedAt: new Date().toISOString(),
    path,
    context,
    insight: chooseCandidate(candidates, input.exclude, input.seed),
  };
}
