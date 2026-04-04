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
  geoDetectionEnabled: boolean;
  detectionProvider: string;
  cacheTtlHours: number;
  anonymiseIps: boolean;
  allowUserOverride: boolean;
  autoLanguageDetection: boolean;
  currencyDisplayByCountry: boolean;
  paymentMethodReordering: boolean;
  supervisorLanguageAdaptation: boolean;
  atlasRegionalMarketSignals: boolean;
  novaRegionalSkillsTrending: boolean;
  dateTimeFormatByCountry: boolean;
  rtlLayoutForArabicCountries: boolean;
  mapZoom: string;
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

export type LanguageRoute = {
  id: string;
  countryCode: string;
  countryName: string;
  primaryLanguage: string;
  fallbackLanguage: string;
  supervisorLocale: string | null;
  paymentMethods: string[];
  currencyCode: string;
  currencySymbol: string;
};

export type TranslationOverride = {
  id: string;
  key: string;
  languageCode: string;
  value: string;
  context: string | null;
  updatedBy: string | null;
};

export type FeatureFlag = {
  id: string;
  key: string;
  category: string;
  description: string | null;
  isActive: boolean;
  rules: Record<string, unknown> | null;
};

export type CountryRule = {
  id: string;
  countryCode: string;
  config: Record<string, unknown> | null;
};

export type MobileAnalytics = {
  sessions: number;
  iosSessions: number;
  androidSessions: number;
  downloads: number;
  errorReports: number;
};

export type AdminSettingsSnapshot = {
  version: string;
  lastSyncedAt: string;
  theme: ThemeConfig;
  localization: LocalizationConfig;
  personalisation: PersonalisationConfig;
  mobile: MobileConfig;
  analytics: AnalyticsConfig;
  geo: GeoConfig;
  languageRoutes: LanguageRoute[];
  translationOverrides: TranslationOverride[];
  featureFlags: FeatureFlag[];
  countryRules: CountryRule[];
  mobileAnalytics: MobileAnalytics;
};
