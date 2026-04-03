import { EventEmitter } from "node:events";

import { Prisma } from "@prisma/client";

import db from "../db.js";

export const ecosystemConfigEvents = new EventEmitter();

export type ThemeConfig = {
  brandColor: string;
  accentColor: string;
  palette: {
    gold: string;
    blue: string;
    ice: string;
    green: string;
    red: string;
    purple: string;
    bg: string;
    surface: string;
    surface2: string;
    border: string;
    text: string;
    textDim: string;
  };
  fontFamily: string;
  typography: {
    heading: string;
    display: string;
    mono: string;
    body: string;
    scale: number;
  };
  cardStyle: string;
  card: {
    borderRadius: number;
    topBorderWidth: number;
    topBorderStyle: "gradient" | "solid" | "none";
    shadowIntensity: "none" | "subtle" | "medium" | "strong";
  };
  darkMode: boolean;
  defaultTheme: "light" | "dark" | "auto";
  layerAccentOverrides: Array<{ layerId: string; accentColor: string }>;
  animation: {
    reducedMotion: boolean;
    speed: number;
  };
  density: "compact" | "comfortable" | "spacious";
};

export const THEME_DEFAULTS = {
  "theme.color.gold": "#C9A84C",
  "theme.color.blue": "#2B5F8E",
  "theme.color.ice": "#89C4E1",
  "theme.color.green": "#2DD4A0",
  "theme.color.red": "#E05A4E",
  "theme.color.purple": "#9B6FFF",
  "theme.color.bg": "#0D1520",
  "theme.color.surface": "#111D2E",
  "theme.color.surface2": "#172335",
  "theme.color.border": "#1E3248",
  "theme.color.text": "#E8EEF5",
  "theme.color.textDim": "#5A7A96",
  "theme.font.heading": "Cormorant Garamond",
  "theme.font.display": "Syne",
  "theme.font.mono": "Space Mono",
  "theme.font.body": "Syne",
  "theme.font.scale": "1.0",
  "theme.card.borderRadius": "6px",
  "theme.card.topBorderWidth": "2px",
  "theme.card.topBorderStyle": "gradient",
  "theme.layer.community.accent": "var(--ice)",
  "theme.layer.academy.accent": "var(--green)",
  "theme.layer.market.accent": "var(--gold)",
  "theme.layer.work.accent": "var(--blue)",
  "theme.layer.intelligence.accent": "var(--purple)",
  "theme.layer.cloud.accent": "var(--ice)",
  "theme.animation.reducedMotion": "false",
  "theme.animation.speed": "1.0",
  "theme.density": "comfortable",
} as const;

export type LocalizationConfig = {
  language: string;
  adaptiveLanguage: boolean;
  manualLanguageOverride: string;
  supportedLanguages: string[];
  countryLanguageMapping: Array<{ country: string; language: string }>;
  perLayerLanguages: Array<{ layerId: string; language: string }>;
  currencyDisplayMode: "localized" | "symbol-first" | "code-first";
  enableGeoLanguageDetection: boolean;
  detectionMethod: "ip" | "browser" | "manual";
  fallbackWhenDetectionFails: string;
  allowUserOverride: boolean;
  persistUserPreference: boolean;
  rtlAutoFlip: boolean;
};

export type PersonalisationConfig = {
  recommendedContent: boolean;
  learningPath: boolean;
  notifications: boolean;
  onboardingFlowEnabled: boolean;
  supervisorTone: string;
  recommendationAggressiveness: number;
  profileTypeWeights: Array<{ profileType: string; weight: number }>;
  supervisorPersonality: {
    activeSupervisor: string;
    verbosity: number;
    proactivity: number;
    dataOrientation: number;
    activeHours: string;
    timezone: string;
    maxResponsesPerUserPerDay: number;
    shortTermMemory: boolean;
    longTermMemory: boolean;
    memoryExpiryDays: string;
    criticalMemoryExpiryDays: string;
  };
  recommendationEngine: {
    briefingFrequency: "daily" | "every_login" | "weekly";
    briefingDepth: "summary" | "standard" | "deep";
    briefingGenerateAt: string;
    crossLayerNudges: boolean;
    nudgeFrequencyLimit: number;
    nudgeCooldownHours: number;
    sageProactiveStudyPrompts: boolean;
    sageStreakWarningDayThreshold: number;
    atlasAutoProductSuggestions: boolean;
    atlasVendorInsightSchedule: string;
    circuitAutoJobMatching: boolean;
    circuitMatchThresholdDefault: number;
    circuitProposalAutoGenerate: boolean;
    trustScoreWeightCerts: number;
    trustScoreWeightContracts: number;
    trustScoreWeightCommunity: number;
    trustScoreWeightIdentity: number;
  };
  questionsEnabled: boolean;
  questionsCount: 3 | 5 | 7;
  skipAllowed: boolean;
  roleSignalWeight: number;
  skillsSignalWeight: number;
  incomeGoalWeight: number;
  marketSignalWeight: number;
  defaultProfile: string;
  onboardingTone: "warm" | "direct" | "formal" | "energetic";
  defaultPlan: "FREE" | "PRO_TRIAL_7" | "PRO_TRIAL_14";
  trialConversionNudge: boolean;
};

export type MobileConfig = {
  mobileAppVersion: string;
  pushNotifications: boolean;
  pwaInstallPrompts: boolean;
  offlineCachePolicy: "aggressive" | "balanced" | "minimal";
  mobileBehaviors: {
    offlineMode: boolean;
    biometricLogin: boolean;
    pushNotifications: boolean;
    autoUpdate: boolean;
    analyticsTracking: boolean;
    crashReporting: boolean;
  };
  pushNotificationRules: {
    enabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    highPriorityOnly: boolean;
  };
  reactNativeBuildFlags: {
    enableHermes: boolean;
    enableNewArchitecture: boolean;
    enableOTAUpdates: boolean;
  };
  featureFlagsByPlatform: {
    web: boolean;
    ios: boolean;
    android: boolean;
  };
  mobileConfigKeys: {
    pwa: {
      installPromptEnabled: boolean;
      installPromptMinVisits: number;
      installPromptCooldownDays: number;
      installPromptPosition: "bottom" | "modal" | "banner";
    };
    push: {
      enabled: boolean;
      permissionAskDelay: "immediate" | "30s" | "auto" | "after_value";
      maxPerDay: number;
      quietHoursStart: string;
      quietHoursEnd: string;
      groupingEnabled: boolean;
      types: {
        jobMatch: boolean;
        certificate: boolean;
        escrowRelease: boolean;
        omegaBriefing: boolean;
        communityReply: boolean;
        newSale: boolean;
        marketingCampaigns: boolean;
      };
    };
    offline: {
      enabled: boolean;
      cacheAcademyLessons: boolean;
      cacheCommunityFeed: boolean;
      cacheJobListings: boolean;
      syncOnReconnect: boolean;
      maxCacheSizeMB: number;
    };
    native: {
      biometricLogin: boolean;
      deepLinks: boolean;
      voiceInput: boolean;
      cameraUpload: boolean;
      offlineVideo: boolean;
      hapticFeedback: boolean;
    };
    analytics: {
      sessionTracking: boolean;
      crashReporting: boolean;
      anonymizeIPs: boolean;
    };
  };
};

export type AnalyticsConfig = {
  downloads: boolean;
  sessions: boolean;
  activityHeatmaps: boolean;
  featureUsage: boolean;
  errorReporting: boolean;
  issueTracking: boolean;
  countryBreakdown: boolean;
};

export type GeoConfig = {
  countryLanguageRouting: boolean;
  paymentMethodSurfacing: Array<{ country: string; methods: string[] }>;
  supervisorOpeningLines: Array<{ country: string; line: string }>;
  countryRules: Array<{
    countryCode: string;
    countryName: string;
    primaryLanguage: string;
    fallbackLanguage: string;
    currencyCode: string;
    currencySymbol: string;
    paymentMethods: string[];
  }>;
};

export type FeatureFlagsConfig = Array<{
  key: string;
  category: string;
  description?: string | null;
  isActive: boolean;
  rules?: Record<string, unknown> | null;
}>;

export type EcosystemSnapshot = {
  version: string;
  lastSyncedAt: string;
  theme: ThemeConfig;
  localization: LocalizationConfig;
  personalisation: PersonalisationConfig;
  mobile: MobileConfig;
  analytics: AnalyticsConfig;
  geo: GeoConfig;
};

const DEFAULT_SNAPSHOT: EcosystemSnapshot = {
  version: "1.0.0",
  lastSyncedAt: new Date(0).toISOString(),
  theme: {
    brandColor: THEME_DEFAULTS["theme.color.gold"],
    accentColor: THEME_DEFAULTS["theme.color.ice"],
    palette: {
      gold: THEME_DEFAULTS["theme.color.gold"],
      blue: THEME_DEFAULTS["theme.color.blue"],
      ice: THEME_DEFAULTS["theme.color.ice"],
      green: THEME_DEFAULTS["theme.color.green"],
      red: THEME_DEFAULTS["theme.color.red"],
      purple: THEME_DEFAULTS["theme.color.purple"],
      bg: THEME_DEFAULTS["theme.color.bg"],
      surface: THEME_DEFAULTS["theme.color.surface"],
      surface2: THEME_DEFAULTS["theme.color.surface2"],
      border: THEME_DEFAULTS["theme.color.border"],
      text: THEME_DEFAULTS["theme.color.text"],
      textDim: THEME_DEFAULTS["theme.color.textDim"],
    },
    fontFamily: THEME_DEFAULTS["theme.font.display"],
    typography: {
      heading: THEME_DEFAULTS["theme.font.heading"],
      display: THEME_DEFAULTS["theme.font.display"],
      mono: THEME_DEFAULTS["theme.font.mono"],
      body: THEME_DEFAULTS["theme.font.body"],
      scale: 1,
    },
    cardStyle: "glass",
    card: {
      borderRadius: 6,
      topBorderWidth: 2,
      topBorderStyle: "gradient",
      shadowIntensity: "medium",
    },
    darkMode: false,
    defaultTheme: "light",
    layerAccentOverrides: [
      { layerId: "core", accentColor: THEME_DEFAULTS["theme.color.gold"] },
      { layerId: "community", accentColor: THEME_DEFAULTS["theme.color.ice"] },
    ],
    animation: {
      reducedMotion: false,
      speed: 1,
    },
    density: "comfortable",
  },
  localization: {
    language: "en",
    adaptiveLanguage: true,
    manualLanguageOverride: "",
    supportedLanguages: ["en", "fr", "ar", "sw", "pcm", "ha", "yo", "zu"],
    countryLanguageMapping: [
      { country: "US", language: "en" },
      { country: "GB", language: "en" },
      { country: "NG", language: "en" },
      { country: "KE", language: "sw" },
      { country: "GH", language: "en" },
      { country: "ZA", language: "en" },
      { country: "EG", language: "ar" },
      { country: "SA", language: "ar" },
      { country: "AE", language: "ar" },
      { country: "FR", language: "fr" },
      { country: "SN", language: "fr" },
      { country: "CI", language: "fr" },
      { country: "TZ", language: "sw" },
      { country: "UG", language: "sw" },
    ],
    perLayerLanguages: [
      { layerId: "landing", language: "en" },
      { layerId: "community", language: "fr" },
      { layerId: "work", language: "en" },
    ],
    currencyDisplayMode: "localized",
    enableGeoLanguageDetection: true,
    detectionMethod: "ip",
    fallbackWhenDetectionFails: "en",
    allowUserOverride: true,
    persistUserPreference: true,
    rtlAutoFlip: true,
  },
  personalisation: {
    recommendedContent: true,
    learningPath: true,
    notifications: true,
    onboardingFlowEnabled: true,
    supervisorTone: "measured",
    recommendationAggressiveness: 55,
    profileTypeWeights: [
      { profileType: "creator", weight: 1.2 },
      { profileType: "learner", weight: 1.0 },
      { profileType: "supervisor", weight: 0.8 },
    ],
    supervisorPersonality: {
      activeSupervisor: "OMEGA",
      verbosity: 50,
      proactivity: 65,
      dataOrientation: 75,
      activeHours: "all_day",
      timezone: "UTC",
      maxResponsesPerUserPerDay: 50,
      shortTermMemory: true,
      longTermMemory: true,
      memoryExpiryDays: "30",
      criticalMemoryExpiryDays: "never",
    },
    recommendationEngine: {
      briefingFrequency: "daily",
      briefingDepth: "standard",
      briefingGenerateAt: "0 6 * * *",
      crossLayerNudges: true,
      nudgeFrequencyLimit: 3,
      nudgeCooldownHours: 8,
      sageProactiveStudyPrompts: true,
      sageStreakWarningDayThreshold: 7,
      atlasAutoProductSuggestions: true,
      atlasVendorInsightSchedule: "0 8 * * 1",
      circuitAutoJobMatching: true,
      circuitMatchThresholdDefault: 70,
      circuitProposalAutoGenerate: true,
      trustScoreWeightCerts: 25,
      trustScoreWeightContracts: 25,
      trustScoreWeightCommunity: 25,
      trustScoreWeightIdentity: 25,
    },
    questionsEnabled: true,
    questionsCount: 7,
    skipAllowed: true,
    roleSignalWeight: 25,
    skillsSignalWeight: 35,
    incomeGoalWeight: 20,
    marketSignalWeight: 20,
    defaultProfile: "creator",
    onboardingTone: "warm",
    defaultPlan: "PRO_TRIAL_7",
    trialConversionNudge: true,
  },
  mobile: {
    mobileAppVersion: "1.0.0",
    pushNotifications: true,
    pwaInstallPrompts: true,
    offlineCachePolicy: "balanced",
    mobileBehaviors: {
      offlineMode: true,
      biometricLogin: true,
      pushNotifications: true,
      autoUpdate: true,
      analyticsTracking: true,
      crashReporting: true,
    },
    pushNotificationRules: {
      enabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      highPriorityOnly: false,
    },
    reactNativeBuildFlags: {
      enableHermes: true,
      enableNewArchitecture: false,
      enableOTAUpdates: true,
    },
    featureFlagsByPlatform: {
      web: true,
      ios: true,
      android: true,
    },
    mobileConfigKeys: {
      pwa: {
        installPromptEnabled: true,
        installPromptMinVisits: 3,
        installPromptCooldownDays: 30,
        installPromptPosition: "bottom",
      },
      push: {
        enabled: true,
        permissionAskDelay: "auto",
        maxPerDay: 5,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
        groupingEnabled: true,
        types: {
          jobMatch: true,
          certificate: true,
          escrowRelease: true,
          omegaBriefing: true,
          communityReply: true,
          newSale: true,
          marketingCampaigns: false,
        },
      },
      offline: {
        enabled: true,
        cacheAcademyLessons: true,
        cacheCommunityFeed: true,
        cacheJobListings: true,
        syncOnReconnect: true,
        maxCacheSizeMB: 200,
      },
      native: {
        biometricLogin: true,
        deepLinks: true,
        voiceInput: true,
        cameraUpload: true,
        offlineVideo: true,
        hapticFeedback: true,
      },
      analytics: {
        sessionTracking: true,
        crashReporting: true,
        anonymizeIPs: true,
      },
    },
  },
  analytics: {
    downloads: true,
    sessions: true,
    activityHeatmaps: true,
    featureUsage: true,
    errorReporting: true,
    issueTracking: true,
    countryBreakdown: true,
  },
  geo: {
    countryLanguageRouting: true,
    paymentMethodSurfacing: [
      { country: "NG", methods: ["paystack", "bank_transfer", "card"] },
      { country: "KE", methods: ["mpesa", "card", "bank_transfer"] },
      { country: "US", methods: ["card", "paypal", "bank_transfer"] },
    ],
    supervisorOpeningLines: [
      { country: "NG", line: "Welcome, let's tailor the experience for you." },
      { country: "FR", line: "Bienvenue, let's adapt the workspace for you." },
      { country: "SA", line: "أهلاً بك، سنضبط التجربة حسب منطقتك." },
    ],
    countryRules: [
      {
        countryCode: "KE",
        countryName: "Kenya",
        primaryLanguage: "sw",
        fallbackLanguage: "en",
        currencyCode: "KES",
        currencySymbol: "KSh",
        paymentMethods: ["mpesa", "flutterwave"],
      },
      {
        countryCode: "NG",
        countryName: "Nigeria",
        primaryLanguage: "en",
        fallbackLanguage: "en",
        currencyCode: "NGN",
        currencySymbol: "₦",
        paymentMethods: ["paystack", "flutterwave"],
      },
      {
        countryCode: "FR",
        countryName: "France",
        primaryLanguage: "fr",
        fallbackLanguage: "en",
        currencyCode: "EUR",
        currencySymbol: "€",
        paymentMethods: ["stripe", "paypal"],
      },
    ],
  },
};

const SECTION_KEYS = ["theme", "localization", "personalisation", "mobile", "analytics", "geo"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

let cache: EcosystemSnapshot | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 15_000;

function readJson<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value !== "string") {
    return value as T;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function extractSection<T>(section: SectionKey, records: Array<{ key: string; value: unknown }>, fallback: T): T {
  const stored = records.find((record) => record.key === section);
  if (!stored) return fallback;
  return readJson(stored.value, fallback);
}

function mergeThemeConfig(theme: Partial<ThemeConfig> | undefined): ThemeConfig {
  const stored = theme ?? {};
  return {
    ...DEFAULT_SNAPSHOT.theme,
    ...stored,
    palette: {
      ...DEFAULT_SNAPSHOT.theme.palette,
      ...(stored.palette ?? {}),
    },
    typography: {
      ...DEFAULT_SNAPSHOT.theme.typography,
      ...(stored.typography ?? {}),
    },
    card: {
      ...DEFAULT_SNAPSHOT.theme.card,
      ...(stored.card ?? {}),
    },
    layerAccentOverrides: stored.layerAccentOverrides ?? DEFAULT_SNAPSHOT.theme.layerAccentOverrides,
    animation: {
      ...DEFAULT_SNAPSHOT.theme.animation,
      ...(stored.animation ?? {}),
    },
  };
}

async function loadSnapshotFromDb(): Promise<EcosystemSnapshot> {
  const records = await db.ecosystemSettings.findMany({
    where: { key: { in: SECTION_KEYS as unknown as string[] } },
    orderBy: { updatedAt: "desc" },
  });

  const snapshot: EcosystemSnapshot = {
    version: "1.0.0",
    lastSyncedAt: new Date().toISOString(),
    theme: mergeThemeConfig(extractSection("theme", records, DEFAULT_SNAPSHOT.theme)),
    localization: extractSection("localization", records, DEFAULT_SNAPSHOT.localization),
    personalisation: extractSection("personalisation", records, DEFAULT_SNAPSHOT.personalisation),
    mobile: extractSection("mobile", records, DEFAULT_SNAPSHOT.mobile),
    analytics: extractSection("analytics", records, DEFAULT_SNAPSHOT.analytics),
    geo: extractSection("geo", records, DEFAULT_SNAPSHOT.geo),
  };

  const latestUpdatedAt = records.length > 0 ? new Date(Math.max(...records.map((record) => record.updatedAt.getTime()))).toISOString() : snapshot.lastSyncedAt;
  snapshot.lastSyncedAt = latestUpdatedAt;
  return snapshot;
}

export async function getEcosystemConfigSnapshot(forceRefresh = false): Promise<EcosystemSnapshot> {
  const now = Date.now();
  if (!forceRefresh && cache && now - cacheLoadedAt < CACHE_TTL_MS) {
    return cache;
  }

  cache = await loadSnapshotFromDb();
  cacheLoadedAt = now;
  return cache;
}

export async function getEcosystemSection<T extends SectionKey>(section: T): Promise<EcosystemSnapshot[T]> {
  const snapshot = await getEcosystemConfigSnapshot();
  return snapshot[section];
}

export async function updateEcosystemSection<T extends SectionKey>(
  section: T,
  value: EcosystemSnapshot[T],
  userId: string,
  description?: string,
): Promise<EcosystemSnapshot[T]> {
  await db.ecosystemSettings.upsert({
    where: { key: section },
    create: {
      key: section,
      value,
      updatedBy: userId,
    },
    update: {
      value,
      updatedBy: userId,
      updatedAt: new Date(),
    },
  });

  cache = {
    ...(cache ?? DEFAULT_SNAPSHOT),
    [section]: value,
    lastSyncedAt: new Date().toISOString(),
  };
  cacheLoadedAt = Date.now();
  ecosystemConfigEvents.emit("updated", {
    section,
    description,
    updatedAt: cache.lastSyncedAt,
  });
  return value;
}

export async function updateEcosystemPatch(
  patch: Partial<EcosystemSnapshot>,
  userId: string,
): Promise<EcosystemSnapshot> {
  const current = await getEcosystemConfigSnapshot(true);
  const next: EcosystemSnapshot = {
    ...current,
    ...patch,
    theme: mergeThemeConfig(patch.theme ? { ...current.theme, ...patch.theme } : current.theme),
    localization: { ...current.localization, ...(patch.localization ?? {}) },
    personalisation: { ...current.personalisation, ...(patch.personalisation ?? {}) },
    mobile: { ...current.mobile, ...(patch.mobile ?? {}) },
    analytics: { ...current.analytics, ...(patch.analytics ?? {}) },
    geo: { ...current.geo, ...(patch.geo ?? {}) },
  };

  await Promise.all(
    SECTION_KEYS.map((section) => updateEcosystemSection(section, next[section], userId)),
  );

  return next;
}

export async function getStoredConfigSections() {
  const snapshot = await getEcosystemConfigSnapshot();
  return {
    theme: snapshot.theme,
    localization: snapshot.localization,
    personalisation: snapshot.personalisation,
    mobile: snapshot.mobile,
    analytics: snapshot.analytics,
    geo: snapshot.geo,
  };
}

function sectionArray<T>(snapshot: EcosystemSnapshot, key: "localization" | "geo" | "theme" | "personalisation" | "mobile" | "analytics") {
  return snapshot[key] as T;
}

async function readSectionArray<T>(key: string, fallback: T): Promise<T> {
  const record = await db.ecosystemSettings.findUnique({ where: { key } });
  return readJson<T>(record?.value, fallback);
}

async function writeSectionArray<T>(key: string, value: T, userId: string): Promise<T> {
  const jsonValue = value as Prisma.InputJsonValue;
  await db.ecosystemSettings.upsert({
    where: { key },
    create: { key, value: jsonValue, updatedBy: userId },
    update: { value: jsonValue, updatedBy: userId, updatedAt: new Date() },
  });
  ecosystemConfigEvents.emit("updated", {
    section: key,
    updatedAt: new Date().toISOString(),
  });
  return value;
}

export async function getLanguageRoutes() {
  return readSectionArray("languageRoutes", [] as Array<{
    countryCode: string;
    countryName: string;
    primaryLanguage: string;
    fallbackLanguage: string;
    supervisorLocale?: string | null;
    paymentMethods: string[];
    currencyCode: string;
    currencySymbol: string;
  }>);
}

export async function upsertLanguageRoute(
  input: {
    countryCode: string;
    countryName: string;
    primaryLanguage: string;
    fallbackLanguage: string;
    supervisorLocale?: string | null;
    paymentMethods: string[];
    currencyCode: string;
    currencySymbol: string;
  },
  userId: string,
) {
  const routes = await getLanguageRoutes();
  const next = [...routes.filter((route) => route.countryCode !== input.countryCode), input];
  return writeSectionArray("languageRoutes", next, userId);
}

export async function setLanguageRoutes(
  routes: Array<{
    countryCode: string;
    countryName: string;
    primaryLanguage: string;
    fallbackLanguage: string;
    supervisorLocale?: string | null;
    paymentMethods: string[];
    currencyCode: string;
    currencySymbol: string;
  }>,
  userId: string,
) {
  return writeSectionArray("languageRoutes", routes, userId);
}

export async function getFeatureFlags() {
  return readSectionArray("featureFlags", [] as FeatureFlagsConfig);
}

export async function upsertFeatureFlags(flags: FeatureFlagsConfig, userId: string) {
  return writeSectionArray("featureFlags", flags, userId);
}

export async function getCountryRules() {
  return readSectionArray("countryRules", [] as Array<{
    id?: string;
    countryCode: string;
    config: Record<string, unknown> | null;
  }>);
}

export async function upsertCountryRules(
  rules: Array<{
    countryCode: string;
    countryName: string;
    primaryLanguage: string;
    fallbackLanguage: string;
    currencyCode: string;
    currencySymbol: string;
    paymentMethods: string[];
  }>,
  userId: string,
) {
  const formatted = rules.map((rule) => ({
    id: rule.countryCode,
    countryCode: rule.countryCode,
    config: {
      countryName: rule.countryName,
      primaryLanguage: rule.primaryLanguage,
      fallbackLanguage: rule.fallbackLanguage,
      currencyCode: rule.currencyCode,
      currencySymbol: rule.currencySymbol,
      paymentMethods: rule.paymentMethods,
    },
  }));
  return writeSectionArray("countryRules", formatted, userId);
}
