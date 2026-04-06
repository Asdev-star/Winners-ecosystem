// src/features/settings/sections/PlatformBehaviorSettings.ts

const TIMEZONE_LIST = [
  "UTC",
  "Africa/Nairobi",
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Johannesburg",
  "Europe/London",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Dubai",
];

export const PLATFORM_SETTINGS = {
  layerGating: {
    label: "Layer Gating Mode",
    description: "How users see locked layers",
    options: ["hidden", "visible-locked", "visible-locked-with-upgrade"],
    current: "visible-locked-with-upgrade",
    forgeNote: "visible-locked-with-upgrade converts 23% more users to paid plans",
  },
  loopEnabled: {
    label: "Agentic Loop",
    description: "Allow OMEGA to trigger cross-layer recommendations",
    type: "toggle",
    current: true,
    warning: "Disabling the loop significantly reduces platform engagement",
  },
  trustScoreEnabled: {
    label: "Trust Score System",
    type: "toggle",
    current: true,
  },
  omegaOnboardingEnabled: {
    label: "OMEGA Intelligent Onboarding",
    description: "7-question onboarding that personalises the ecosystem",
    type: "toggle",
    current: true,
  },
  referralEnabled: {
    label: "Referral Program",
    description: "20% recurring commission on referred PRO subscriptions",
    type: "toggle",
    current: true,
  },
  defaultPlan: {
    label: "Default plan for new users",
    options: ["FREE", "PRO_TRIAL_7", "PRO_TRIAL_14"],
    current: "FREE",
    forgeNote: "14-day PRO trial converts 34% of trial users to paid",
  },
};

export const COMMUNITY_SETTINGS = {
  feedAlgorithm: {
    label: "Feed Algorithm",
    description: "How your feed is ranked",
    options: [
      { value: "nova_smart", label: "NOVA Smart Feed", desc: "AI-ranked by relevance, skill signals, and your goals" },
      { value: "chronological", label: "Chronological", desc: "Newest posts first - no AI ranking" },
      { value: "trending", label: "Trending", desc: "Most engaged posts in your network" },
    ],
    current: "nova_smart",
    plan: "FREE",
  },
  novaSkillDetection: {
    label: "NOVA Skill Detection",
    description: "Allow NOVA to detect skills from your posts and trigger Academy recommendations",
    type: "toggle",
    current: true,
    plan: "FREE",
  },
  whoCanDm: {
    label: "Direct messages from",
    options: ["Everyone", "People I follow", "Nobody"],
    current: "People I follow",
  },
  whoCanSeeActivity: {
    label: "Activity visible to",
    options: ["Everyone", "Followers only", "Nobody"],
    current: "Followers only",
  },
  notifyNewFollower: { label: "New follower", type: "toggle", current: true },
  notifyPostLike: { label: "Post likes", type: "toggle", current: false },
  notifyPostComment: { label: "Post comments", type: "toggle", current: true },
  notifyGroupActivity: { label: "Group activity", type: "toggle", current: true },
  notifyMentions: { label: "Mentions", type: "toggle", current: true },
};

export const ACADEMY_SETTINGS = {
  sageTutorStyle: {
    label: "SAGE Teaching Style",
    options: [
      { value: "socratic", label: "Socratic", desc: "SAGE asks questions to guide understanding" },
      { value: "direct", label: "Direct", desc: "SAGE explains directly and concisely" },
      { value: "detailed", label: "Detailed", desc: "SAGE gives comprehensive explanations with examples" },
    ],
    current: "direct",
  },
  studyRemindersEnabled: { label: "Daily study reminders", type: "toggle", current: true },
  studyReminderTime: { label: "Reminder time", type: "time", current: "09:00" },
  studyGoalMinutes: { label: "Daily learning goal (minutes)", type: "number", current: 30, min: 5, max: 240 },
  autoDownloadEnabled: {
    label: "Auto-download enrolled courses",
    description: "Download lessons when on WiFi for offline access",
    type: "toggle",
    current: false,
    plan: "PRO",
  },
  offlineStorageLimit: {
    label: "Offline storage limit",
    options: ["500MB", "1GB", "2GB", "5GB", "Unlimited"],
    current: "1GB",
    plan: "PRO",
  },
  notifyCertificate: { label: "Certificate earned notifications", type: "toggle", current: true },
  autoCvUpdate: {
    label: "Auto-update CV on certificate",
    description: "Automatically add new certificates to your Winners CV",
    type: "toggle",
    current: true,
    plan: "PRO",
  },
};

export const MARKET_SETTINGS = {
  atlasProductSuggestions: {
    label: "ATLAS Product Suggestions",
    description: "ATLAS analyses your profile and suggests products to sell",
    type: "toggle",
    current: true,
    plan: "PRO",
  },
  atlasPricingAlerts: {
    label: "ATLAS Pricing Alerts",
    description: "ATLAS notifies you when your products are priced outside market range",
    type: "toggle",
    current: true,
    plan: "PRO",
  },
  vendorPublicProfile: { label: "Public vendor profile", type: "toggle", current: true },
  showSalesCount: { label: "Show sales count on products", type: "toggle", current: true },
  autoFulfillDigital: { label: "Auto-deliver digital products", type: "toggle", current: true },
  preferredPayoutMethod: {
    label: "Preferred payout method",
    options: ["Stripe", "M-Pesa", "Bank Transfer", "MTN MoMo"],
    current: "Stripe",
    plan: "PRO",
  },
  payoutSchedule: {
    label: "Automatic payout schedule",
    options: ["Manual", "Weekly", "Monthly"],
    current: "Weekly",
    plan: "PRO",
  },
  notifyNewOrder: { label: "New order received", type: "toggle", current: true },
  notifyLowInventory: { label: "Low inventory warnings", type: "toggle", current: true },
  notifyPriceAlert: { label: "ATLAS pricing alerts", type: "toggle", current: true },
  notifyReview: { label: "New product review", type: "toggle", current: true },
};

export const WORK_SETTINGS = {
  availabilityStatus: {
    label: "Availability",
    options: [
      { value: "available", label: "Available for work" },
      { value: "busy", label: "Busy - limited availability" },
      { value: "unavailable", label: "Not available" },
    ],
    current: "available",
  },
  circuitJobMatching: {
    label: "CIRCUIT Auto-Matching",
    description: "CIRCUIT automatically matches you to relevant jobs and drafts proposals",
    type: "toggle",
    current: true,
    plan: "PRO",
  },
  circuitProposalStyle: {
    label: "CIRCUIT Proposal Style",
    options: ["Professional", "Conversational", "Brief", "Detailed"],
    current: "Professional",
    plan: "PRO",
  },
  circuitMatchThreshold: {
    label: "Minimum match score for notifications",
    type: "slider",
    min: 50,
    max: 95,
    step: 5,
    current: 70,
    description: "Only notify me of jobs with this match score or higher",
  },
  showRateOnProfile: { label: "Show hourly rate publicly", type: "toggle", current: false },
  showEarningsTotal: { label: "Show total earnings on profile", type: "toggle", current: false },
  acceptDirectContracts: { label: "Accept direct contract requests", type: "toggle", current: true },
  notifyJobMatch: { label: "New job matches from CIRCUIT", type: "toggle", current: true },
  notifyContractUpdate: { label: "Contract status updates", type: "toggle", current: true },
  notifyEscrowEvent: { label: "Escrow payment events", type: "toggle", current: true },
};

export const INTELLIGENCE_SETTINGS = {
  omegaBriefingEnabled: {
    label: "Daily OMEGA Briefing",
    description: "OMEGA delivers your personalised ecosystem intelligence at a scheduled time",
    type: "toggle",
    current: true,
  },
  omegaBriefingTime: {
    label: "Briefing time",
    type: "time",
    current: "08:00",
    description: "In your local timezone",
  },
  omegaBriefingDepth: {
    label: "Briefing depth",
    options: [
      { value: "summary", label: "Summary", desc: "3-5 key points, 60 seconds to read" },
      { value: "balanced", label: "Balanced", desc: "Detailed but concise insights" },
      { value: "deep", label: "Deep Dive", desc: "Comprehensive analysis and context" },
    ],
    current: "balanced",
  },
  ariaPersonality: {
    label: "ARIA interaction style",
    options: [
      { value: "friendly", label: "Friendly", desc: "Warm, encouraging, conversational" },
      { value: "professional", label: "Professional", desc: "Clear, concise, business-like" },
      { value: "coach", label: "Coach", desc: "Supportive and action-oriented" },
    ],
    current: "friendly",
  },
  ariaContextMemory: { label: "ARIA context memory", type: "toggle", current: true },
  creditAlertThreshold: { label: "Credit alert threshold", type: "number", current: 500, min: 0, max: 100000 },
  showCreditUsage: { label: "Show credit usage in dashboard", type: "toggle", current: true },
};

export const ACCOUNT_SETTINGS = {
  displayName: { label: "Display name", type: "text", current: "Winners User" },
  bio: { label: "Bio", type: "textarea", current: "" },
  location: { label: "Location", type: "text", current: "" },
  website: { label: "Website", type: "url", current: "" },
  timezone: { label: "Timezone", type: "select", current: "Africa/Nairobi", options: TIMEZONE_LIST },
  currency: { label: "Default currency", type: "select", current: "USD", options: ["USD", "KES", "NGN", "EUR", "GBP"] },
  globalPushNotifications: { label: "Push notifications", type: "toggle", current: true },
  emailDigest: { label: "Email digest", type: "toggle", current: true },
  omegaBriefings: { label: "OMEGA briefings", type: "toggle", current: true },
  theme: { label: "Theme", type: "select", current: "system", options: ["system", "light", "dark"] },
  exportData: { label: "Export account data", type: "action" },
  deleteAccount: { label: "Delete account", type: "destructive-action" },
};

export default PLATFORM_SETTINGS;
