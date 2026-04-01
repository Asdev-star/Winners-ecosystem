import db from "../db.js";

type RecommendationCategory = "RATE LIMIT" | "EMAIL" | "AI CREDITS";

export interface AdminCoreSettingsRecommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  current: string;
  recommended: string;
  why: string;
  secondaryAction: string;
}

export interface AdminCoreSettingsAutoMode {
  key: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface AdminCoreSettingsSnapshot {
  generatedAt: string;
  activeSettings: number;
  recommendations: AdminCoreSettingsRecommendation[];
  autoModes: AdminCoreSettingsAutoMode[];
  askPlaceholder: string;
  recommendationCount: number;
}

const BASE_RECOMMENDATIONS: AdminCoreSettingsRecommendation[] = [
  {
    id: "rate-limit",
    category: "RATE LIMIT",
    title: "/api/v1/ai/chat is hitting limits 340 times/day",
    current: "20 req/min per user",
    recommended: "35 req/min for PRO users (they use it 2.4x more)",
    why:
      "FORGE sees sustained friction among higher-value users. Raising the PRO ceiling reduces unnecessary retries without weakening abuse protection for FREE traffic.",
    secondaryAction: "Ask FORGE why",
  },
  {
    id: "email",
    category: "EMAIL",
    title: "Welcome email open rate dropped to 34% (was 58%)",
    current: 'Subject: "Welcome to Winners Ecosystem"',
    recommended: "Personalise by OMEGA profile type (8 variants)",
    why:
      "The current subject line is too generic. FORGE recommends profile-aware subject variants to recover intent and improve first-week activation.",
    secondaryAction: "View Variants",
  },
  {
    id: "credits",
    category: "AI CREDITS",
    title: "Free plan users exhaust credits in 4.2 days avg",
    current: "100 credits/month FREE",
    recommended: "150 credits/month FREE (conversion rate up 18% in A/B)",
    why:
      "Early exhaustion suppresses onboarding momentum. A moderate free-plan increase appears to improve retained exploration and later conversion.",
    secondaryAction: "View A/B Data",
  },
];

const BASE_AUTO_MODES: Omit<AdminCoreSettingsAutoMode, "enabled">[] = [
  {
    key: "rateLimits",
    title: "Auto-manage rate limits",
    description: "Let FORGE tune low-risk threshold changes when usage patterns materially shift.",
  },
  {
    key: "cacheTtls",
    title: "Auto-manage cache TTLs",
    description: "Allow FORGE to optimize cache lifetimes for stable performance improvements.",
  },
  {
    key: "emailTiming",
    title: "Auto-manage email timing",
    description: "Let FORGE shift send windows when engagement data suggests a better cadence.",
  },
  {
    key: "aiCredits",
    title: "Auto-manage AI credit limits",
    description: "Allow FORGE to adjust credit ceilings based on plan performance and churn signals.",
  },
];

const DEFAULT_AUTO_MODE_STATE: Record<string, boolean> = {
  rateLimits: false,
  cacheTtls: true,
  emailTiming: false,
  aiCredits: false,
};

function metadataValue(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;
  return (metadata as Record<string, unknown>)[key];
}

export async function getAdminCoreSettingsSnapshot(): Promise<AdminCoreSettingsSnapshot> {
  const recentActions = await db.activityLog.findMany({
    where: {
      category: "admin",
      action: {
        in: [
          "ADMIN_FORGE_SETTINGS_RECOMMENDATION_APPLIED",
          "ADMIN_FORGE_SETTINGS_RECOMMENDATION_DISMISSED",
          "ADMIN_FORGE_SETTINGS_AUTO_MODE_SET",
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      action: true,
      metadata: true,
      createdAt: true,
    },
  });

  const handledRecommendationIds = new Set<string>();
  const autoModeState = { ...DEFAULT_AUTO_MODE_STATE };

  for (const entry of recentActions) {
    if (
      entry.action === "ADMIN_FORGE_SETTINGS_RECOMMENDATION_APPLIED" ||
      entry.action === "ADMIN_FORGE_SETTINGS_RECOMMENDATION_DISMISSED"
    ) {
      const recommendationId = metadataValue(entry.metadata, "recommendationId");
      if (typeof recommendationId === "string" && recommendationId.trim()) {
        handledRecommendationIds.add(recommendationId);
      }
    }

    if (entry.action === "ADMIN_FORGE_SETTINGS_AUTO_MODE_SET") {
      const modeKey = metadataValue(entry.metadata, "modeKey");
      const enabled = metadataValue(entry.metadata, "enabled");
      if (typeof modeKey === "string" && typeof enabled === "boolean" && modeKey in autoModeState) {
        autoModeState[modeKey] = enabled;
      }
    }
  }

  const recommendations = BASE_RECOMMENDATIONS.filter(
    (recommendation) => !handledRecommendationIds.has(recommendation.id),
  );

  const autoModes: AdminCoreSettingsAutoMode[] = BASE_AUTO_MODES.map((mode) => ({
    ...mode,
    enabled: autoModeState[mode.key] ?? false,
  }));

  return {
    generatedAt: new Date().toISOString(),
    activeSettings: 847,
    recommendations,
    autoModes,
    askPlaceholder: "Ask FORGE about any setting",
    recommendationCount: recommendations.length,
  };
}

export function getAdminCoreSettingsRecommendation(id: string) {
  return BASE_RECOMMENDATIONS.find((recommendation) => recommendation.id === id) ?? null;
}

export function getAdminCoreSettingsAutoMode(key: string) {
  return BASE_AUTO_MODES.find((mode) => mode.key === key) ?? null;
}

export async function buildAdminCoreSettingsAskResponse(question: string) {
  const snapshot = await getAdminCoreSettingsSnapshot();
  const normalized = question.toLowerCase();

  if (normalized.includes("rate")) {
    return `FORGE assessment: rate-limit pressure is currently concentrated around /api/v1/ai/chat. The next best action is to review the PRO-user recommendation first, because it reduces friction without broadening anonymous traffic exposure.`;
  }

  if (normalized.includes("email")) {
    return `FORGE assessment: welcome-email performance is under baseline. The next best action is to trial profile-aware variants before changing cadence, so you isolate messaging impact from delivery timing.`;
  }

  if (normalized.includes("credit")) {
    return `FORGE assessment: AI credit exhaustion is happening too early in the free-plan journey. The next best action is to test the proposed increase while monitoring retained usage and conversion quality, not just raw spend.`;
  }

  return `FORGE assessment: "${question}" intersects with ${snapshot.recommendationCount} active recommendation areas and ${snapshot.autoModes.filter((mode) => mode.enabled).length} live auto-management modes. The next best action is to compare the current baseline against the proposed change, then keep auto-management limited to low-risk surfaces with clear rollback paths.`;
}
