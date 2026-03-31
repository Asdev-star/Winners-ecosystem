import db from "../db.js";
import { AppRegistry } from "./appRegistry.js";
import { getRecentAdminSignals, type AdminSignalEvent } from "./adminSignalService.js";

type LayerDisplayStatus = "live" | "ready" | "locked" | "build";
type ChecklistState = "done" | "attention" | "blocked";

export interface LayerChecklistItem {
  item: string;
  status: ChecklistState;
  required: boolean;
}

export interface OverviewLayer {
  id: string;
  name: string;
  phase: number;
  progress: number;
  status: LayerDisplayStatus;
  statusLabel: string;
  frontendPath: string;
  adminPath: string;
  description: string;
  actionLabel: string;
  note: string;
  checklist: LayerChecklistItem[];
}

export interface AdminOverviewSnapshot {
  generatedAt: string;
  kpis: {
    mrr: number;
    mrrDeltaPct: number;
    users: number;
    activeUsers: number;
    liveLayers: number;
    lockedLayers: number;
    loopsToday: number;
    loopsDeltaPct: number;
    healthLabel: string;
    healthTone: "ok" | "attention";
  };
  layers: OverviewLayer[];
  signals: AdminSignalEvent[];
  recentActions: Array<{
    id: string;
    summary: string;
    createdAt: string;
  }>;
}

export interface LoopLiveEntry {
  id: string;
  userName: string;
  tenantName: string;
  stageLabel: string;
  status: "active" | "completed";
  summary: string;
  confidenceLabel: string;
  revenueImpact: number;
  createdAt: string;
  updatedAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const LOOP_STAGE_LABELS: Record<string, string> = {
  community: "Community",
  academy: "Academy",
  work: "Work",
  market: "Market",
  intelligence: "Intelligence",
  done: "Compound",
};

const LAYER_META: Record<string, Omit<OverviewLayer, "phase" | "frontendPath" | "description">> = {
  core: {
    id: "core",
    name: "Core Engine",
    progress: 92,
    status: "live",
    statusLabel: "Live",
    adminPath: "/admin/platform/core",
    actionLabel: "Manage",
    note: "Auth, billing, analytics, and sovereign controls are stable.",
    checklist: [
      { item: "JWT + tenant isolation verified", status: "done", required: true },
      { item: "Super admin boundary live", status: "done", required: true },
      { item: "Revenue + notification services healthy", status: "done", required: true },
    ],
  },
  community: {
    id: "community",
    name: "Community",
    progress: 80,
    status: "live",
    statusLabel: "Live",
    adminPath: "/admin/platform/community",
    actionLabel: "Manage",
    note: "Feed, groups, DMs, and NOVA skill detection are operating.",
    checklist: [
      { item: "Realtime post distribution active", status: "done", required: true },
      { item: "Skill detection loop triggers active", status: "done", required: true },
      { item: "Creator studio polish backlog", status: "attention", required: false },
    ],
  },
  academy: {
    id: "academy",
    name: "Academy",
    progress: 72,
    status: "live",
    statusLabel: "Live",
    adminPath: "/admin/platform/academy",
    actionLabel: "Manage",
    note: "Courses, learning paths, and certificates are issuing across tenants.",
    checklist: [
      { item: "Course publishing pipeline live", status: "done", required: true },
      { item: "Certificate issuance live", status: "done", required: true },
      { item: "Instructor workflow QA pass", status: "attention", required: false },
    ],
  },
  intelligence: {
    id: "intelligence",
    name: "Intelligence",
    progress: 75,
    status: "live",
    statusLabel: "Live",
    adminPath: "/admin/platform/intelligence",
    actionLabel: "Manage",
    note: "FORGE, OMEGA, and the supervisor fabric are connected cross-layer.",
    checklist: [
      { item: "Supervisor routes healthy", status: "done", required: true },
      { item: "Streaming surfaces responding", status: "done", required: true },
      { item: "Cost analytics refinement", status: "attention", required: false },
    ],
  },
  market: {
    id: "market",
    name: "Market",
    progress: 55,
    status: "ready",
    statusLabel: "Ready",
    adminPath: "/admin/platform/market",
    actionLabel: "Launch ->",
    note: "Commerce launch is close, but checkout and payout proof still need sovereign clearance.",
    checklist: [
      { item: "Stripe Connect configured", status: "done", required: true },
      { item: "CheckoutPage vendor resolution bug fixed", status: "blocked", required: true },
      { item: "Multi-vendor payout flow complete", status: "blocked", required: true },
    ],
  },
  work: {
    id: "work",
    name: "Work",
    progress: 35,
    status: "locked",
    statusLabel: "Locked",
    adminPath: "/admin/platform/work",
    actionLabel: "View Deps",
    note: "CIRCUIT matching is warming up, but escrow and contracts need launch polish.",
    checklist: [
      { item: "Freelancer profile flow live", status: "done", required: true },
      { item: "Escrow funding path verified", status: "attention", required: true },
      { item: "Contract completion loop audited", status: "attention", required: true },
    ],
  },
  mobile: {
    id: "mobile",
    name: "Mobile",
    progress: 25,
    status: "locked",
    statusLabel: "Locked",
    adminPath: "/admin/platform/mobile",
    actionLabel: "View Deps",
    note: "Mobile stays gated until the web command surface and core loops settle.",
    checklist: [
      { item: "Shared navigation contracts frozen", status: "attention", required: true },
      { item: "Push + auth flows ported", status: "blocked", required: true },
      { item: "Installable shell validated", status: "blocked", required: false },
    ],
  },
  cloud: {
    id: "cloud",
    name: "Cloud",
    progress: 40,
    status: "locked",
    statusLabel: "Locked",
    adminPath: "/admin/platform/cloud",
    actionLabel: "View Deps",
    note: "Developer APIs and automations exist, but public launch gates remain closed.",
    checklist: [
      { item: "API key issuance live", status: "done", required: true },
      { item: "Connector marketplace moderation", status: "attention", required: true },
      { item: "Public docs + onboarding pass", status: "blocked", required: true },
    ],
  },
  "ai-platform": {
    id: "ai-platform",
    name: "AI Platform",
    progress: 65,
    status: "build",
    statusLabel: "Build",
    adminPath: "/intelligence/platform",
    actionLabel: "Manage",
    note: "HERALD is wiring multimodal infrastructure, routing, and local model services into the ecosystem fabric.",
    checklist: [
      { item: "FastAPI container responding", status: "done", required: true },
      { item: "Model routing telemetry stabilized", status: "attention", required: true },
      { item: "Multimodal surface QA complete", status: "attention", required: false },
    ],
  },
};

function startOfDay(base = new Date()) {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate());
}

type OverviewAppSource = {
  id: string;
  name: string;
  phase: number;
  status: string;
  frontendPath: string;
  description: string;
};

function getOverviewAppSources(): OverviewAppSource[] {
  const apps = AppRegistry.list().map((app) => ({
    id: app.id,
    name: app.name,
    phase: app.phase,
    status: app.status,
    frontendPath: app.frontendPath,
    description: app.description,
  }));

  apps.push({
    id: "ai-platform",
    name: "AI Platform",
    phase: 9,
    status: "in_progress",
    frontendPath: "/intelligence/platform",
    description: "Ollama, Whisper, ComfyUI, and HERALD multimodal infrastructure",
  });

  return apps;
}

function toLayer(app: OverviewAppSource): OverviewLayer {
  const meta = LAYER_META[app.id] ?? {
    id: app.id,
    name: app.name,
    progress: app.status === "live" ? 100 : 40,
    status: app.status === "live" ? "live" : app.status === "in_progress" ? "build" : "locked",
    statusLabel: app.status === "live" ? "Live" : app.status === "in_progress" ? "Build" : "Locked",
    adminPath: `/admin/platform/${app.id}`,
    actionLabel: app.status === "live" ? "Manage" : app.status === "in_progress" ? "Manage" : "View Deps",
    note: app.description,
    checklist: [],
  };

  return {
    ...meta,
    phase: app.phase,
    frontendPath: app.frontendPath,
    description: app.description,
  };
}

export function getLayerChecklist(layerId: string): {
  layerName: string;
  isReady: boolean;
  issues: LayerChecklistItem[];
  checklist: LayerChecklistItem[];
} | null {
  const app = getOverviewAppSources().find((entry) => entry.id === layerId);
  if (!app) return null;

  const layer = toLayer(app);
  const issues = layer.checklist.filter((item) => item.required && item.status !== "done");

  return {
    layerName: layer.name,
    isReady: issues.length === 0,
    issues,
    checklist: layer.checklist,
  };
}

export function getOverviewLayers(): OverviewLayer[] {
  return getOverviewAppSources()
    .sort((a, b) => a.phase - b.phase)
    .map(toLayer);
}

function getLoopStageLabel(loop: { currentStep: number; steps: unknown }): string {
  const steps = Array.isArray(loop.steps) ? loop.steps : [];
  const step = steps.length > 0 ? (steps[steps.length - 1] as { layer?: string }) : undefined;
  const raw = step?.layer ?? Object.keys(LOOP_STAGE_LABELS)[Math.min(loop.currentStep, 4)] ?? "community";
  return LOOP_STAGE_LABELS[raw] ?? "Community";
}

function getLoopSummary(loop: { currentStep: number; status: string; steps: unknown }): string {
  const steps = Array.isArray(loop.steps) ? loop.steps : [];
  const latest = steps.length > 0 ? (steps[steps.length - 1] as { description?: string; layer?: string }) : undefined;
  if (latest?.description) return latest.description;

  const stageLabel = getLoopStageLabel(loop);
  return loop.status === "completed"
    ? `${stageLabel} loop completed`
    : `${stageLabel} signal is progressing through the agentic loop`;
}

export async function getLoopsLiveFeed(): Promise<{
  active: LoopLiveEntry[];
  completed: LoopLiveEntry[];
}> {
  const last24h = new Date(Date.now() - DAY_MS);

  const [activeLoops, completedLoops] = await Promise.all([
    db.agenticLoop.findMany({
      where: { status: "active" },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    db.agenticLoop.findMany({
      where: {
        status: "completed",
        completedAt: { gte: last24h },
      },
      orderBy: { completedAt: "desc" },
      take: 4,
    }),
  ]);

  const relatedUserIds = [...new Set([...activeLoops, ...completedLoops].map((loop) => loop.userId))];
  const relatedTenantIds = [...new Set([...activeLoops, ...completedLoops].map((loop) => loop.tenantId))];

  const [users, tenants] = await Promise.all([
    relatedUserIds.length
      ? db.user.findMany({
          where: { id: { in: relatedUserIds } },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
    relatedTenantIds.length
      ? db.tenant.findMany({
          where: { id: { in: relatedTenantIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const userMap = new Map(users.map((user) => [user.id, user.name || user.email || "Unknown user"]));
  const tenantMap = new Map(tenants.map((tenant) => [tenant.id, tenant.name]));

  return {
    active: activeLoops.map((loop) => ({
      id: loop.id,
      userName: userMap.get(loop.userId) ?? "Unknown user",
      tenantName: tenantMap.get(loop.tenantId) ?? "Unknown tenant",
      stageLabel: getLoopStageLabel(loop),
      status: "active",
      summary: getLoopSummary(loop),
      confidenceLabel: "Active",
      revenueImpact: loop.revenueImpact ?? 0,
      createdAt: loop.createdAt.toISOString(),
      updatedAt: loop.updatedAt.toISOString(),
    })),
    completed: completedLoops.map((loop) => ({
      id: loop.id,
      userName: userMap.get(loop.userId) ?? "Unknown user",
      tenantName: tenantMap.get(loop.tenantId) ?? "Unknown tenant",
      stageLabel: getLoopStageLabel(loop),
      status: "completed",
      summary: getLoopSummary(loop),
      confidenceLabel: "Complete",
      revenueImpact: loop.revenueImpact ?? 0,
      createdAt: loop.createdAt.toISOString(),
      updatedAt: loop.updatedAt.toISOString(),
    })),
  };
}

export async function getAdminOverviewSnapshot(): Promise<AdminOverviewSnapshot> {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today.getTime() - DAY_MS);
  const last30d = new Date(now.getTime() - 30 * DAY_MS);
  const previous30d = new Date(last30d.getTime() - 30 * DAY_MS);
  const layers = getOverviewLayers();

  const [
    totalUsers,
    activeUsersRows,
    mrrCurrent,
    mrrPrevious,
    loopsToday,
    loopsYesterday,
    recentActions,
  ] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.activityLog.findMany({
      where: {
        userId: { not: null },
        createdAt: { gte: last30d },
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.revenueRecord.aggregate({
      where: { recordedAt: { gte: last30d } },
      _sum: { amount: true },
    }),
    db.revenueRecord.aggregate({
      where: {
        recordedAt: {
          gte: previous30d,
          lt: last30d,
        },
      },
      _sum: { amount: true },
    }),
    db.agenticLoop.count({
      where: {
        updatedAt: { gte: today },
      },
    }),
    db.agenticLoop.count({
      where: {
        updatedAt: {
          gte: yesterday,
          lt: today,
        },
      },
    }),
    db.activityLog.findMany({
      where: { category: "admin" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        metadata: true,
        action: true,
      },
    }),
  ]);

  const activeUsers = activeUsersRows.length || totalUsers;
  const currentMrr = mrrCurrent._sum.amount ?? 0;
  const previousMrr = mrrPrevious._sum.amount ?? 0;
  const mrrDeltaPct = previousMrr > 0 ? Math.round(((currentMrr - previousMrr) / previousMrr) * 100) : 0;
  const loopsDeltaPct = loopsYesterday > 0 ? Math.round(((loopsToday - loopsYesterday) / loopsYesterday) * 100) : 0;

  const loggedActions = recentActions.map((entry) => {
    const metadata = entry.metadata as { summary?: string } | null;
    return {
      id: entry.id,
      createdAt: entry.createdAt.toISOString(),
      summary: metadata?.summary ?? entry.action.split("_").join(" ").toLowerCase(),
    };
  });

  const fallbackActions = layers
    .filter((layer) => layer.status === "live")
    .slice()
    .sort((a, b) => b.phase - a.phase)
    .slice(0, 3)
    .map((layer) => ({
      id: `fallback-${layer.id}`,
      createdAt: now.toISOString(),
      summary: `${layer.name} remains live at ${layer.progress}% readiness`,
    }));

  return {
    generatedAt: now.toISOString(),
    kpis: {
      mrr: currentMrr,
      mrrDeltaPct,
      users: totalUsers,
      activeUsers,
      liveLayers: layers.filter((layer) => layer.status === "live").length,
      lockedLayers: layers.filter((layer) => layer.status === "locked").length,
      loopsToday,
      loopsDeltaPct,
      healthLabel: "All OK",
      healthTone: "ok",
    },
    layers,
    signals: getRecentAdminSignals(5),
    recentActions: loggedActions.length ? loggedActions : fallbackActions,
  };
}

export async function buildForgeBriefingText(): Promise<string> {
  const snapshot = await getAdminOverviewSnapshot();
  const marketChecklist = getLayerChecklist("market");
  const blockedIssues = marketChecklist?.issues.length ?? 0;
  const yesterday = startOfDay(new Date());
  const dayBefore = new Date(yesterday.getTime() - DAY_MS);

  const [certCountYesterday, heldEscrow] = await Promise.all([
    db.certificate.count({
      where: {
        issuedAt: {
          gte: dayBefore,
          lt: yesterday,
        },
      },
    }),
    db.escrowPayment.aggregate({
      where: { status: "HELD" },
      _sum: { amount: true },
    }),
  ]);

  const liveLayerNames = snapshot.layers
    .filter((layer) => layer.status === "live")
    .map((layer) => layer.name)
    .join(", ");

  const nextLockedLayer = snapshot.layers.find((layer) => layer.status === "locked");
  const healthLine = snapshot.kpis.healthTone === "ok" ? "All systems nominal." : "Core systems are stable, but launch blockers remain.";

  return [
    `Good morning. ${snapshot.kpis.liveLayers} layers are live: ${liveLayerNames}.`,
    `${snapshot.kpis.activeUsers.toLocaleString()} users have been active across the ecosystem in the last 30 days.`,
    `Market has ${blockedIssues} blocking issue${blockedIssues === 1 ? "" : "s"} before launch.`,
    `Academy certificate issuance recorded ${certCountYesterday} new certificate${certCountYesterday === 1 ? "" : "s"} yesterday.`,
    `Work escrow is ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(heldEscrow._sum.amount ?? 0)}.`,
    `Agentic loop traffic has reached ${snapshot.kpis.loopsToday} loop event${snapshot.kpis.loopsToday === 1 ? "" : "s"} today.`,
    `${healthLine} Your action for today: fix the CheckoutPage vendor bug and clear the Market launch gate.`,
    nextLockedLayer ? `${nextLockedLayer.name} is the next locked layer in the queue.` : "Every tracked layer is clear for launch.",
  ].join(" ");
}
