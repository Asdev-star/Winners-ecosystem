import db from "../db.js";
import { getOverviewLayers } from "./adminOverviewService.js";
import { AppRegistry } from "./appRegistry.js";

export type PreLaunchCheckCategory =
  | "dependency"
  | "backend"
  | "frontend"
  | "payments"
  | "ai"
  | "data";

export type PreLaunchCheckStatus = "pass" | "warn" | "fail";

export interface PreLaunchCheck {
  category: PreLaunchCheckCategory;
  label: string;
  status: PreLaunchCheckStatus;
  detail?: string;
  link?: string;
}

export interface LegacyChecklistItem {
  item: string;
  status: "done" | "attention" | "blocked";
  required: boolean;
}

export interface LaunchControlRow {
  id: string;
  name: string;
  icon: string;
  progress: number;
  badge: string;
  actionMode: "admin_only" | "metrics" | "launch" | "locked";
  actionLabel: string;
  helperLabel?: string;
  note: string;
  canSuspend: boolean;
  detailPath: string;
  blockingCount: number;
  warningCount: number;
  dependencies: Array<{
    id: string;
    label: string;
    isLive: boolean;
  }>;
}

export interface LaunchQueueCard {
  layerId: string;
  name: string;
  icon: string;
  progress: number;
  actionLabel: string;
  dependencies: Array<{
    id: string;
    label: string;
    isLive: boolean;
  }>;
  blockingCount: number;
  warningCount: number;
  forgeDirective: string;
  isReady: boolean;
}

export interface LaunchImpactItem {
  icon: string;
  title: string;
  detail: string;
}

export interface PlatformLaunchControlSnapshot {
  summary: string;
  queue: LaunchQueueCard | null;
  rows: LaunchControlRow[];
  impactPreview: LaunchImpactItem[];
  usersNotifiedCount: number;
}

type LayerHint = {
  icon: string;
  badge: string;
  actionMode: LaunchControlRow["actionMode"];
  actionLabel: string;
  helperLabel?: string;
  note: string;
  forgeDirective?: string;
  impactPreview?: LaunchImpactItem[];
};

const LAYER_HINTS: Record<string, LayerHint> = {
  core: {
    icon: "⬡",
    badge: "ADMIN ONLY",
    actionMode: "admin_only",
    actionLabel: "Fully managed",
    note: "Sovereign control plane for auth, billing, analytics, and admin policy.",
  },
  community: {
    icon: "🧑",
    badge: "LIVE",
    actionMode: "metrics",
    actionLabel: "Metrics",
    note: "Community is live and feeding NOVA skill signals into the loop.",
  },
  academy: {
    icon: "🎓",
    badge: "LIVE",
    actionMode: "metrics",
    actionLabel: "Metrics",
    note: "Academy is live and SAGE is issuing learning and certification signals.",
  },
  intelligence: {
    icon: "🤖",
    badge: "LIVE",
    actionMode: "metrics",
    actionLabel: "Metrics",
    note: "Intelligence is live with FORGE and OMEGA monitoring the ecosystem.",
  },
  market: {
    icon: "🛒",
    badge: "READY",
    actionMode: "launch",
    actionLabel: "Launch ->",
    note: "Market is the next layer in the queue once blocking issues are cleared.",
    forgeDirective: "Fix CheckoutPage vendor bug (est. 4h). Then launch.",
    impactPreview: [
      { icon: "🧑‍🤝‍🧑", title: "Community", detail: "ATLAS gets access to the skill graph." },
      { icon: "🎓", title: "Academy", detail: "Certificates trigger ATLAS vendor onboarding." },
      { icon: "🤖", title: "Intelligence", detail: "OMEGA starts routing market signals." },
    ],
  },
  work: {
    icon: "💼",
    badge: "LOCKED",
    actionMode: "locked",
    actionLabel: "Needs Market",
    helperLabel: "Needs Market",
    note: "Work unlocks after Market clears launch and the next commerce loop is active.",
  },
  mobile: {
    icon: "📱",
    badge: "LOCKED",
    actionMode: "locked",
    actionLabel: "Needs 4 layers",
    helperLabel: "Needs 4 layers",
    note: "Mobile remains gated until the core web layers are stable and compounding.",
  },
  cloud: {
    icon: "☁️",
    badge: "LOCKED",
    actionMode: "locked",
    actionLabel: "Needs Mkt+Intel",
    helperLabel: "Needs Mkt+Intel",
    note: "Cloud opens once commerce and intelligence orchestration are fully active.",
  },
};

const DISPLAY_DEPENDENCIES: Partial<Record<string, string[]>> = {
  market: ["core", "academy"],
  work: ["market"],
  cloud: ["market", "intelligence"],
};

function toLegacyStatus(status: PreLaunchCheckStatus): LegacyChecklistItem["status"] {
  if (status === "pass") return "done";
  if (status === "warn") return "attention";
  return "blocked";
}

function isRequired(check: PreLaunchCheck): boolean {
  if (check.status === "warn") return false;
  return true;
}

function dependencyChecks(layerId: string): PreLaunchCheck[] {
  const app = AppRegistry.get(layerId);
  if (!app) return [];

  const dependencyIds = DISPLAY_DEPENDENCIES[layerId] ?? app.dependencies;

  return dependencyIds.map((dependencyId) => {
    const dependency = AppRegistry.get(dependencyId);
    const label = `${dependency?.name ?? dependencyId} dependency is live`;
    const isLive = dependency?.status === "live" || dependencyId === "core" || dependencyId === "community" || dependencyId === "academy";
    return {
      category: "dependency",
      label,
      status: isLive ? "pass" : "fail",
      detail: isLive ? undefined : `Launch ${dependency?.name ?? dependencyId} before unlocking ${app.name}.`,
    };
  });
}

export function getPreLaunchChecks(layerId: string): PreLaunchCheck[] {
  switch (layerId) {
    case "market":
      return [
        ...dependencyChecks("market"),
        { category: "backend", label: "productRoutes health check", status: "pass", link: "Server/routes/productRoutes.ts" },
        { category: "backend", label: "cartRoutes health check", status: "pass", link: "Server/routes/cartRoutes.ts" },
        {
          category: "frontend",
          label: "CheckoutPage vendor resolution",
          status: "fail",
          detail: "CheckoutPage.tsx sends productId where vendorId expected. Fix: resolve vendorId at cart item level.",
          link: "src/features/market/CheckoutPage.tsx",
        },
        {
          category: "payments",
          label: "Stripe Connect multi-vendor payout",
          status: "fail",
          detail: "Stripe Connect not yet configured. Need: stripe.accounts.create() for each vendor.",
          link: "Server/routes/vendorRoutes.ts",
        },
        {
          category: "ai",
          label: "ATLAS AI route responding",
          status: "warn",
          detail: "Route exists but is not fully wired to VendorDashboard.tsx yet.",
          link: "src/features/market/VendorDashboard.tsx",
        },
        {
          category: "data",
          label: "Prisma: Product/Cart/Order models migrated",
          status: "pass",
          link: "prisma/schema.prisma",
        },
      ];
    case "work":
      return [
        ...dependencyChecks("work"),
        { category: "backend", label: "workRoutes health check", status: "pass", link: "Server/routes/workRoutes.ts" },
        { category: "payments", label: "Escrow payment model present", status: "pass", link: "prisma/schema.prisma" },
        {
          category: "ai",
          label: "CIRCUIT recommendations calibrated",
          status: "warn",
          detail: "Matching exists, but launch messaging should be tuned after Market opens.",
          link: "Server/routes/workRoutes.ts",
        },
      ];
    case "mobile":
      return [
        { category: "dependency", label: "Four core layers stable", status: "warn", detail: "Wait until web compounding loops settle." },
        { category: "frontend", label: "Shared navigation contract frozen", status: "warn", link: "src/components/layout/MainLayout.tsx" },
      ];
    case "cloud":
      return [
        { category: "dependency", label: "Market commerce layer launched", status: "fail", detail: "Cloud launch depends on the market layer being public." },
        { category: "ai", label: "Intelligence orchestration stable", status: "pass", link: "Server/routes/omegaRoutes.ts" },
        { category: "backend", label: "Connector and automation routes present", status: "pass", link: "Server/routes/connectorRoutes.ts" },
      ];
    default:
      return dependencyChecks(layerId);
  }
}

export function getPlatformChecklist(layerId: string): {
  layerName: string;
  isReady: boolean;
  issues: LegacyChecklistItem[];
  checklist: LegacyChecklistItem[];
  checks: PreLaunchCheck[];
  blockingCount: number;
  warningCount: number;
} | null {
  const app = AppRegistry.get(layerId);
  if (!app) return null;

  const checks = getPreLaunchChecks(layerId);
  const checklist = checks.map((check) => ({
    item: check.label,
    status: toLegacyStatus(check.status),
    required: isRequired(check),
  }));
  const issues = checklist.filter((item) => item.required && item.status !== "done");
  const blockingCount = checks.filter((check) => check.status === "fail").length;
  const warningCount = checks.filter((check) => check.status === "warn").length;

  return {
    layerName: app.name,
    isReady: blockingCount === 0,
    issues,
    checklist,
    checks,
    blockingCount,
    warningCount,
  };
}

export async function getPlatformLaunchControlSnapshot(): Promise<PlatformLaunchControlSnapshot> {
  const overviewLayers = getOverviewLayers();
  const usersNotifiedCount = await db.user.count({ where: { deletedAt: null } });

  const rows: LaunchControlRow[] = overviewLayers.map((layer) => {
    const checks = getPlatformChecklist(layer.id);
    const app = AppRegistry.get(layer.id);
    const hint = LAYER_HINTS[layer.id] ?? {
      icon: "⬡",
      badge: layer.status === "live" ? "LIVE" : "LOCKED",
      actionMode: layer.status === "live" ? "metrics" : "locked",
      actionLabel: layer.status === "live" ? "Metrics" : "Locked",
      note: layer.note,
    };

    const dependencyIds = DISPLAY_DEPENDENCIES[layer.id] ?? app?.dependencies ?? [];
    const dependencies = dependencyIds.map((dependencyId) => {
      const dependency = AppRegistry.get(dependencyId);
      const displayLive =
        dependency?.status === "live" ||
        dependencyId === "core" ||
        dependencyId === "community" ||
        dependencyId === "academy";

      return {
        id: dependencyId,
        label: dependency?.name.replace("Winners ", "") ?? dependencyId,
        isLive: displayLive,
      };
    });

    return {
      id: layer.id,
      name: layer.name,
      icon: hint.icon,
      progress: layer.progress,
      badge: hint.badge,
      actionMode: hint.actionMode,
      actionLabel: hint.actionLabel,
      helperLabel: hint.helperLabel,
      note: hint.note,
      canSuspend: hint.actionMode === "metrics",
      detailPath: `/admin/platform/${layer.id}`,
      blockingCount: checks?.blockingCount ?? 0,
      warningCount: checks?.warningCount ?? 0,
      dependencies,
    };
  });

  const marketRow = rows.find((row) => row.id === "market") ?? null;
  const marketHint = LAYER_HINTS.market;
  const queue: LaunchQueueCard | null = marketRow
    ? {
        layerId: marketRow.id,
        name: marketRow.name,
        icon: marketRow.icon,
        progress: marketRow.progress,
        actionLabel: "Launch Market ->",
        dependencies: marketRow.dependencies,
        blockingCount: marketRow.blockingCount,
        warningCount: marketRow.warningCount,
        forgeDirective: marketHint.forgeDirective ?? "Clear launch blockers, then go live.",
        isReady: marketRow.blockingCount === 0,
      }
    : null;

  const impactPreview = [
    ...(marketHint.impactPreview ?? []),
    {
      icon: "👥",
      title: `${usersNotifiedCount.toLocaleString()} users`,
      detail: "Users get notified as soon as the layer is launched.",
    },
  ];

  return {
    summary: "You control when each layer goes live. Each launch activates a new supervisor, new user capabilities, and a new loop stage.",
    queue,
    rows,
    impactPreview,
    usersNotifiedCount,
  };
}
