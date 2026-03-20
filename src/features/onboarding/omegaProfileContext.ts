export type OmegaSupportedProfileType =
  | "The Creator"
  | "The Freelancer"
  | "The Entrepreneur"
  | "The Learner"
  | "The Vendor"
  | "The Developer"
  | "The Marketer"
  | "The Explorer";

export type OmegaLayerKey =
  | "core"
  | "community"
  | "academy"
  | "market"
  | "intelligence"
  | "work"
  | "cloud";

export interface OmegaTrustUnlock {
  min: number;
  max: number;
  label: string;
  description: string;
}

export interface OmegaProfileContext {
  profileType: OmegaSupportedProfileType;
  primaryLayer: OmegaLayerKey;
  primarySupervisor: string;
  secondarySupervisor?: string | null;
  primaryPlatformHost: string;
  entryPath: string;
  briefingFocus: string[];
  preActivatedFeatures: string[];
  firstAction: string;
  sidebarOrder: OmegaLayerKey[];
  trustUnlocks?: OmegaTrustUnlock[];
}

const PROFILE_CONTEXTS: Record<OmegaSupportedProfileType, OmegaProfileContext> = {
  "The Creator": {
    profileType: "The Creator",
    primaryLayer: "community",
    primarySupervisor: "NOVA",
    secondarySupervisor: "ATLAS",
    primaryPlatformHost: "community.winnersempire.io",
    entryPath: "/community/feed",
    briefingFocus: [
      "Audience growth signals from NOVA",
      "Creator monetisation tips from ATLAS",
      "Community engagement rate weekly",
    ],
    preActivatedFeatures: [
      "Community feed + up to 10 posts/month",
      "Follow graph + join up to 3 groups",
      "NOVA skill detection (passive on Free)",
    ],
    firstAction:
      "Your first post is the beginning of NOVA's skill map. Write about what you know. NOVA will find the right people for you.",
    sidebarOrder: ["community", "academy", "market", "intelligence", "work", "cloud"],
    trustUnlocks: [
      { min: 0, max: 30, label: "Post + like + comment only", description: "Early creator access is limited to core feed participation." },
      { min: 31, max: 60, label: "Creator analytics + audience growth tools", description: "Growth signals and creator analytics unlock once trust is established." },
      { min: 61, max: 80, label: "Monetisation (creator subscriptions, tips)", description: "NOVA can hand you into creator revenue surfaces once your trust is proven." },
      { min: 81, max: 100, label: "Featured creator status + ATLAS coaching", description: "Top-trust creators get visibility boosts and monetisation coaching." },
    ],
  },
  "The Freelancer": {
    profileType: "The Freelancer",
    primaryLayer: "work",
    primarySupervisor: "CIRCUIT",
    secondarySupervisor: "NOVA",
    primaryPlatformHost: "work.winnersempire.io",
    entryPath: "/work/jobs",
    briefingFocus: [
      "CIRCUIT job match scores daily",
      "Proposal win rate tracking",
      "Escrow and payment status",
    ],
    preActivatedFeatures: [
      "Job board browsing + 3 applications/month",
      "Basic freelancer profile + 3 portfolio items",
      "CIRCUIT match score visibility",
      "Escrow access as a client",
    ],
    firstAction:
      "Build your profile first - 3 minutes. Then CIRCUIT can match you accurately. Your first job application should happen within the hour.",
    sidebarOrder: ["work", "community", "academy", "intelligence", "market", "cloud"],
    trustUnlocks: [
      { min: 0, max: 30, label: "Browse + apply (3 applications/month limit on Free)", description: "New freelancers can explore Work and test demand before scaling up." },
      { min: 31, max: 60, label: "Unlimited applications + CIRCUIT proposals", description: "Stronger trust unlocks higher-volume job pursuit and AI proposal help." },
      { min: 61, max: 80, label: "Featured freelancer status + priority matching", description: "CIRCUIT begins favoring you in matching and visibility." },
      { min: 81, max: 100, label: "CIRCUIT autonomous applications (pre-approved jobs only)", description: "Top-tier freelancers can delegate approved application actions to CIRCUIT." },
    ],
  },
  "The Entrepreneur": {
    profileType: "The Entrepreneur",
    primaryLayer: "market",
    primarySupervisor: "ATLAS",
    secondarySupervisor: "OMEGA",
    primaryPlatformHost: "shop.winnersempire.io",
    entryPath: "/market/vendor",
    briefingFocus: [
      "Revenue per channel",
      "Vendor performance benchmarks vs ecosystem peers",
      "ATLAS product opportunity alerts",
    ],
    preActivatedFeatures: [
      "Browse products + vendor application (pending review)",
      "ATLAS product research (3 queries/month on Free)",
      "Business Launcher (1 plan/month) + 1 store",
    ],
    firstAction:
      "ATLAS has 3 product ideas calibrated to your market. Your first task: open Market -> Vendor Dashboard. Review them. Pick one. That is how it starts.",
    sidebarOrder: ["market", "intelligence", "community", "work", "academy", "cloud"],
    trustUnlocks: [
      { min: 0, max: 30, label: "Market browsing + vendor application", description: "Early entrepreneurs can explore the market and apply for vendor access." },
      { min: 31, max: 60, label: "Full vendor dashboard + ATLAS research (10/month)", description: "A stronger Trust Score unlocks the full dashboard and a larger ATLAS research allowance." },
      { min: 61, max: 80, label: "Dropshipping store + ATLAS unlimited + multi-product", description: "At this tier, ATLAS can support broader catalog building and unlimited research." },
      { min: 81, max: 100, label: "Featured vendor placement + OMEGA revenue optimisation", description: "Top-performing entrepreneurs receive ecosystem placement and strategic revenue optimisation." },
    ],
  },
  "The Learner": {
    profileType: "The Learner",
    primaryLayer: "academy",
    primarySupervisor: "SAGE",
    secondarySupervisor: null,
    primaryPlatformHost: "learn.winnersempire.io",
    entryPath: "/academy",
    briefingFocus: [
      "Course progress and streak",
      "SAGE-generated learning path",
      "\"Complete this -> unlock this\" - income projections per certificate",
    ],
    preActivatedFeatures: [
      "Academy catalog with all free courses",
      "SAGE AI tutor (20 queries/month on Free)",
      "Certificates for free courses only",
      "Community feed for peer learning",
    ],
    firstAction:
      "SAGE has built your first learning path based on your skills. It starts with a 47-minute course. Your potential income increases by $18/hour upon certification. Start now.",
    sidebarOrder: ["academy", "community", "work", "market", "intelligence", "cloud"],
    trustUnlocks: [
      { min: 0, max: 30, label: "3 free courses + SAGE limited chat", description: "New learners begin with a focused course allowance and limited tutoring." },
      { min: 31, max: 60, label: "10 courses + full SAGE tutoring + quizzes", description: "As trust builds, SAGE unlocks deeper guided learning and assessments." },
      { min: 61, max: 80, label: "All courses + certificate issuance + skill badges", description: "Certified learning and visible skill signals unlock in the established tier." },
      { min: 81, max: 100, label: "Become an instructor + SAGE-assisted course creation", description: "Elite learners can cross into teaching and use SAGE to help create courses." },
    ],
  },
  "The Vendor": {
    profileType: "The Vendor",
    primaryLayer: "market",
    primarySupervisor: "ATLAS",
    secondarySupervisor: "CIRCUIT",
    primaryPlatformHost: "shop.winnersempire.io",
    entryPath: "/market",
    briefingFocus: [
      "Sales data per product",
      "ATLAS pricing and competitor signals",
      "Inventory and order management alerts",
    ],
    preActivatedFeatures: [
      "Market browsing + purchasing",
      "Vendor application (pending review)",
      "1 store + 5 listed products on Free",
    ],
    firstAction:
      "Your store is ready to be built. ATLAS recommends starting with digital products - zero inventory, instant delivery. First product live in 15 minutes.",
    sidebarOrder: ["market", "community", "intelligence", "work", "academy", "cloud"],
    trustUnlocks: [
      { min: 0, max: 30, label: "1 store · 5 products · manual orders", description: "Vendors start lean with one storefront and manual fulfilment." },
      { min: 31, max: 60, label: "3 stores · 50 products · ATLAS pricing advisor", description: "Mid-tier vendors unlock multiple stores and pricing support from ATLAS." },
      { min: 61, max: 80, label: "Unlimited products · auto-fulfil · ATLAS ad copy", description: "Established vendors can scale catalog depth and automate fulfilment with ATLAS creative support." },
      { min: 81, max: 100, label: "Featured vendor · ATLAS autonomous pricing · Cross-platform promotion", description: "Top vendors get featured placement and intelligent pricing plus broader ecosystem promotion." },
    ],
  },
  "The Developer": {
    profileType: "The Developer",
    primaryLayer: "cloud",
    primarySupervisor: "NEXUS",
    secondarySupervisor: "HERALD",
    primaryPlatformHost: "cloud.winnersempire.io",
    entryPath: "/cloud",
    briefingFocus: [
      "API usage and credit consumption",
      "NEXUS integration guides for current project",
      "New ecosystem endpoints and webhooks relevant to their stack",
    ],
    preActivatedFeatures: [
      "API access by request only on Free",
      "@winners/sdk docs access",
      "Webhook catalogue preview",
      "NEXUS AI chat unlocks on Pro",
    ],
    firstAction:
      "Your API key is ready. NEXUS will walk you to your first successful API call in under 30 seconds. Ask NEXUS: 'What's the fastest integration for my use case?'",
    sidebarOrder: ["cloud", "intelligence", "work", "community", "academy", "market"],
    trustUnlocks: [
      { min: 0, max: 30, label: "1 API key · 1,000 calls/month · basic webhooks", description: "Early developer access focuses on one key, a starter quota, and core event subscriptions." },
      { min: 31, max: 60, label: "3 keys · 10,000 calls/month · connector access", description: "As trust grows, developers unlock more keys, more capacity, and connector surfaces." },
      { min: 61, max: 80, label: "10 keys · unlimited calls · full SDK access", description: "High-trust developers can operate at scale with the full SDK surface." },
      { min: 81, max: 100, label: "Publish connectors to marketplace · revenue share", description: "Top-tier developers can monetize integrations directly through the ecosystem." },
    ],
  },
  "The Marketer": {
    profileType: "The Marketer",
    primaryLayer: "market",
    primarySupervisor: "ATLAS",
    secondarySupervisor: "NOVA",
    primaryPlatformHost: "shop.winnersempire.io",
    entryPath: "/market/marketing",
    briefingFocus: [
      "Campaign performance per channel",
      "ATLAS audience signal reports",
      "Community engagement data from NOVA",
    ],
    preActivatedFeatures: [
      "Market launch tools (1 plan/month on Free)",
      "ATLAS ad copy generation (1 piece/month on Free)",
      "Community posting for organic reach",
    ],
    firstAction:
      "NOVA has identified 3 community groups where your target audience is active. ATLAS can write your first campaign copy in 60 seconds. Start with organic community reach before paid - it costs nothing.",
    sidebarOrder: ["market", "community", "intelligence", "work", "academy", "cloud"],
    trustUnlocks: [
      { min: 0, max: 30, label: "Marketing hub starter access", description: "Marketers begin with core planning, organic reach, and limited ATLAS copy generation." },
      { min: 31, max: 60, label: "Expanded campaign planning + more ATLAS copy", description: "Mid-tier access expands the Hub with richer campaign support." },
      { min: 61, max: 80, label: "Advanced campaign automation + deeper audience signals", description: "Established marketers unlock stronger AI support and richer performance context." },
      { min: 81, max: 100, label: "Featured growth operator + cross-platform campaign orchestration", description: "Top marketers can operate with ecosystem-wide promotion and orchestration visibility." },
    ],
  },
  "The Explorer": {
    profileType: "The Explorer",
    primaryLayer: "core",
    primarySupervisor: "OMEGA",
    secondarySupervisor: null,
    primaryPlatformHost: "winnersempire.io/dashboard",
    entryPath: "/dashboard",
    briefingFocus: [
      "Weekly \"here's what you could do next\" - three options, no pressure",
      "Platform discovery - rotating spotlight on different layers",
    ],
    preActivatedFeatures: [
      "Free launch state across every layer",
      "OMEGA weekly discovery briefing",
      "Community + Academy browsing to find your direction",
    ],
    firstAction:
      "You don't have to know where you're going. The Community is where most people find their direction. Start by reading. NOVA will tell me what catches your attention.",
    sidebarOrder: ["community", "academy", "market", "work", "intelligence", "cloud"],
    trustUnlocks: [],
  },
};

function normalizeLayerKey(path: string): OmegaLayerKey | null {
  const layer = path.replace(/^\//, "").split("/")[0]?.toLowerCase();
  if (!layer) return null;
  if (layer === "dashboard" || layer === "core") return "core";
  if (layer === "community") return "community";
  if (layer === "academy") return "academy";
  if (layer === "market") return "market";
  if (layer === "intelligence") return "intelligence";
  if (layer === "work") return "work";
  if (layer === "cloud") return "cloud";
  return null;
}

export function getOmegaProfileContext(profileType?: string | null): OmegaProfileContext | null {
  if (!profileType) return null;
  return PROFILE_CONTEXTS[profileType as OmegaSupportedProfileType] ?? null;
}

export function getOmegaProfileEntryPath(profileType?: string | null, fallbackPath?: string | null): string {
  return getOmegaProfileContext(profileType)?.entryPath ?? fallbackPath ?? "/dashboard";
}

export function getOmegaSidebarRank(profileType: string | null | undefined, platformPath: string): number {
  const context = getOmegaProfileContext(profileType);
  if (!context) return Number.MAX_SAFE_INTEGER;

  const layer = normalizeLayerKey(platformPath);
  if (!layer) return Number.MAX_SAFE_INTEGER;

  const index = context.sidebarOrder.indexOf(layer);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}
