export type OnboardingPlanTier = "free" | "pro" | "enterprise";

export interface OnboardingPlanRow {
  feature: string;
  free: string;
  pro: string;
  enterprise: string;
}

export interface OnboardingPlanSection {
  title: string;
  subtitle?: string;
  rows: OnboardingPlanRow[];
}

export type OnboardingPlanProfileType =
  | "The Creator"
  | "The Freelancer"
  | "The Entrepreneur"
  | "The Learner"
  | "The Vendor"
  | "The Developer"
  | "The Marketer"
  | "The Explorer";

export interface OnboardingPlanPresentationItem {
  text: string;
  included: boolean;
}

export interface OnboardingPlanPresentation {
  profileType: OnboardingPlanProfileType | "default";
  label: string;
  intro: string;
  freeItems: OnboardingPlanPresentationItem[];
  proItems: string[];
}

export const DEFAULT_ONBOARDING_PLAN: OnboardingPlanTier = "free";

export const ONBOARDING_PLAN_SECTIONS: OnboardingPlanSection[] = [
  {
    title: "Core Engine",
    subtitle: "Free default for every user",
    rows: [
      { feature: "Workspaces", free: "1", pro: "3", enterprise: "Unlimited" },
      { feature: "Team members", free: "1 (solo only)", pro: "10", enterprise: "Unlimited" },
      { feature: "Analytics history", free: "7 days", pro: "90 days", enterprise: "365 days" },
      { feature: "CSV export", free: "5/month", pro: "100/month", enterprise: "Unlimited" },
      { feature: "PDF export", free: "No", pro: "Yes", enterprise: "Yes" },
      { feature: "Email reports", free: "No", pro: "Weekly", enterprise: "Daily + custom" },
      { feature: "API access", free: "No", pro: "1 key / 1,000 calls", enterprise: "10 keys / unlimited" },
      { feature: "Admin panel", free: "Admin only", pro: "Admin only", enterprise: "Admin only" },
      { feature: "2FA", free: "Yes", pro: "Yes", enterprise: "Yes" },
      { feature: "Google OAuth", free: "Yes", pro: "Yes", enterprise: "Yes" },
    ],
  },
  {
    title: "Community",
    rows: [
      { feature: "Posts per month", free: "10", pro: "Unlimited", enterprise: "Unlimited" },
      { feature: "Comments", free: "Unlimited", pro: "Unlimited", enterprise: "Unlimited" },
      { feature: "Follow other users", free: "Yes", pro: "Yes", enterprise: "Yes" },
      { feature: "Groups (join)", free: "3 groups", pro: "20 groups", enterprise: "Unlimited" },
      { feature: "Groups (create)", free: "No", pro: "5 groups", enterprise: "Unlimited" },
      { feature: "Direct Messages", free: "No", pro: "Yes", enterprise: "Yes" },
      { feature: "Creator analytics", free: "No", pro: "Yes", enterprise: "Yes" },
      { feature: "NOVA AI (skill detection)", free: "Passive", pro: "Passive + active coaching", enterprise: "Passive + autonomous" },
      { feature: "NOVA chat", free: "5/month", pro: "Unlimited", enterprise: "Unlimited" },
      { feature: "Creator subscriptions", free: "No", pro: "Yes (10% cut)", enterprise: "Yes (8% cut)" },
      { feature: "Tipping", free: "No", pro: "Yes", enterprise: "Yes" },
      { feature: "Post scheduling", free: "No", pro: "Yes", enterprise: "Yes" },
    ],
  },
  {
    title: "Academy",
    rows: [
      { feature: "Free courses", free: "All", pro: "All", enterprise: "All" },
      { feature: "Paid course enrollment", free: "No", pro: "Yes", enterprise: "Yes" },
      { feature: "SAGE AI tutor", free: "20 queries/month", pro: "Unlimited", enterprise: "Unlimited" },
      { feature: "Quiz attempts", free: "3 per quiz", pro: "Unlimited", enterprise: "Unlimited" },
      { feature: "Certificate issuance", free: "Free courses only", pro: "All", enterprise: "All" },
      { feature: "PDF certificate", free: "No", pro: "Yes", enterprise: "Yes" },
      { feature: "Certificate sharing", free: "Link only", pro: "PDF + LinkedIn", enterprise: "PDF + LinkedIn" },
      { feature: "Learning paths", free: "OMEGA-generated (view only)", pro: "Editable", enterprise: "Custom + team" },
      { feature: "Flashcards", free: "No", pro: "Yes", enterprise: "Yes" },
      { feature: "Offline access", free: "No", pro: "5 lessons", enterprise: "Unlimited" },
      { feature: "Create courses (instructor)", free: "No", pro: "Yes (30% platform cut)", enterprise: "Yes (25% cut)" },
    ],
  },
  {
    title: "Market",
    rows: [
      { feature: "Browse products", free: "Yes", pro: "Yes", enterprise: "Yes" },
      { feature: "Purchase products", free: "Yes", pro: "Yes", enterprise: "Yes" },
      { feature: "Vendor application", free: "Pending review", pro: "Fast-tracked", enterprise: "Instant" },
      { feature: "Products listed (vendor)", free: "5", pro: "100", enterprise: "Unlimited" },
      { feature: "Dropshipping stores", free: "1 store", pro: "5 stores", enterprise: "Unlimited" },
      { feature: "ATLAS AI research", free: "3 queries/month", pro: "50/month", enterprise: "Unlimited" },
      { feature: "ATLAS ad copy generator", free: "1 piece/month", pro: "Unlimited", enterprise: "Unlimited" },
      { feature: "Business Launcher tools", free: "1 plan/month", pro: "10 plans/month", enterprise: "Unlimited" },
      { feature: "CV/career tools", free: "1 export/month", pro: "20 exports/month", enterprise: "Unlimited" },
      { feature: "Winners Stream (watch)", free: "Yes", pro: "Yes", enterprise: "Yes" },
      { feature: "Winners Stream (broadcast)", free: "No", pro: "Yes", enterprise: "Yes" },
      { feature: "Stripe Connect (vendor payouts)", free: "No", pro: "Yes", enterprise: "Yes" },
      { feature: "M-Pesa / Flutterwave payouts", free: "No", pro: "Yes", enterprise: "Yes" },
    ],
  },
  {
    title: "Intelligence / AI",
    rows: [
      { feature: "OMEGA daily briefing", free: "Weekly", pro: "Daily", enterprise: "Daily + custom time" },
      { feature: "Aria AI chat", free: "10/month", pro: "Unlimited", enterprise: "Unlimited" },
      { feature: "Supervisor chats (NOVA, SAGE, etc.)", free: "5/month each", pro: "Unlimited", enterprise: "Unlimited" },
      { feature: "AI credits (cloud models)", free: "100/month", pro: "2,500/month", enterprise: "10,000/month" },
      { feature: "Local AI (Ollama)", free: "Unlimited", pro: "Unlimited", enterprise: "Unlimited" },
      { feature: "Agentic Loop tracking", free: "View only", pro: "Full", enterprise: "Full + custom loops" },
      { feature: "OMEGA autonomous actions", free: "No", pro: "Pre-approved only", enterprise: "Full autonomous" },
      { feature: "Voice input (Whisper)", free: "5 min/month", pro: "120 min/month", enterprise: "Unlimited" },
      { feature: "Image generation (ComfyUI)", free: "No", pro: "50/month", enterprise: "Unlimited" },
      { feature: "PDF analysis", free: "3/month", pro: "50/month", enterprise: "Unlimited" },
      { feature: "Weekly intelligence report", free: "No", pro: "Yes", enterprise: "Yes + custom" },
    ],
  },
  {
    title: "Work",
    rows: [
      { feature: "Job board browsing", free: "Yes", pro: "Yes", enterprise: "Yes" },
      { feature: "Job applications", free: "3/month", pro: "Unlimited", enterprise: "Unlimited" },
      { feature: "Freelancer profile", free: "Basic", pro: "Full + featured", enterprise: "Full + featured" },
      { feature: "Portfolio items", free: "3", pro: "30", enterprise: "Unlimited" },
      { feature: "CIRCUIT match score", free: "View score", pro: "Score + proposals", enterprise: "Autonomous" },
      { feature: "CIRCUIT chat", free: "5/month", pro: "Unlimited", enterprise: "Unlimited" },
      { feature: "Escrow access", free: "Client only", pro: "Client + freelancer", enterprise: "Client + freelancer" },
      { feature: "Contract creation", free: "1 active", pro: "10 active", enterprise: "Unlimited" },
      { feature: "Time tracking", free: "No", pro: "Yes", enterprise: "Yes" },
      { feature: "Multi-currency payouts", free: "No", pro: "Yes", enterprise: "Yes" },
    ],
  },
  {
    title: "Cloud",
    subtitle: "Free developer access",
    rows: [
      { feature: "API keys", free: "0 (request access)", pro: "1 key", enterprise: "10 keys" },
      { feature: "Monthly API calls", free: "0", pro: "1,000", enterprise: "50,000" },
      { feature: "Webhooks", free: "No", pro: "5 subscriptions", enterprise: "Unlimited" },
      { feature: "Connector access", free: "No", pro: "5 connectors", enterprise: "30+ connectors" },
      { feature: "@winners/sdk", free: "Read docs", pro: "Full access", enterprise: "Full access + private SDK" },
      { feature: "NEXUS AI chat", free: "No", pro: "20/month", enterprise: "Unlimited" },
    ],
  },
];

const PLAN_PRESENTATIONS: Record<OnboardingPlanProfileType | "default", OnboardingPlanPresentation> = {
  "The Creator": {
    profileType: "The Creator",
    label: "Creator sees",
    intro: "Same pricing, different framing. OMEGA presents the upgrade path around audience growth, monetisation, and creator momentum.",
    freeItems: [
      { included: true, text: "10 posts/month" },
      { included: true, text: "Community access" },
      { included: true, text: "NOVA skill detection" },
      { included: false, text: "Monetisation tools" },
      { included: false, text: "Direct Messages" },
    ],
    proItems: [
      "Unlimited posts",
      "Creator subscriptions - get paid for your audience",
      "Creator analytics - see who is following your work",
      "Post scheduling - post at peak times",
      "Direct Messages - talk to your audience directly",
      "NOVA unlimited coaching",
    ],
  },
  "The Freelancer": {
    profileType: "The Freelancer",
    label: "Freelancer sees",
    intro: "Same pricing, different framing. OMEGA shifts the message toward winning more work, converting more bids, and getting paid safely.",
    freeItems: [
      { included: true, text: "Browse all jobs" },
      { included: true, text: "3 applications/month" },
      { included: true, text: "View match scores" },
      { included: true, text: "Basic profile" },
      { included: false, text: "Escrow as freelancer" },
    ],
    proItems: [
      "Unlimited applications",
      "CIRCUIT proposal generator - win more bids",
      "Full CIRCUIT coaching",
      "Featured freelancer placement",
      "Escrow access - get paid securely",
      "Multi-currency payouts (KES, NGN, USD, GBP)",
    ],
  },
  "The Entrepreneur": {
    profileType: "The Entrepreneur",
    label: "Entrepreneur sees",
    intro: "Same pricing, different framing. OMEGA makes the upgrade story about catalog scale, research depth, and payout infrastructure.",
    freeItems: [
      { included: true, text: "5 products listed" },
      { included: true, text: "1 dropshipping store" },
      { included: true, text: "3 ATLAS queries/month" },
      { included: true, text: "Business plan (1/month)" },
      { included: false, text: "Vendor payouts" },
    ],
    proItems: [
      "100 products + unlimited stores",
      "5 stores + ATLAS unlimited research",
      "ATLAS ad copy unlimited",
      "10 business plans/month",
      "Stripe Connect + M-Pesa + Flutterwave payouts",
      "OMEGA revenue intelligence daily",
    ],
  },
  "The Learner": {
    profileType: "The Learner",
    label: "Learner sees",
    intro: "Same pricing, different framing. OMEGA frames the upgrade around faster learning loops, paid-course access, and stronger certification surfaces.",
    freeItems: [
      { included: true, text: "All free courses" },
      { included: true, text: "SAGE (20/month)" },
      { included: true, text: "3 quiz attempts" },
      { included: true, text: "Free cert issuance" },
      { included: false, text: "Paid courses" },
    ],
    proItems: [
      "All paid courses",
      "SAGE unlimited - ask anything, any time",
      "Unlimited quiz attempts",
      "PDF certificates + LinkedIn sharing",
      "Offline lesson access (5 lessons)",
      "SAGE learning path - custom-built for your goal",
    ],
  },
  "The Vendor": {
    profileType: "The Vendor",
    label: "Vendor sees",
    intro: "Same pricing, different framing. OMEGA speaks to sellers in terms of catalog size, store expansion, and payout readiness.",
    freeItems: [
      { included: true, text: "5 products listed" },
      { included: true, text: "1 dropshipping store" },
      { included: true, text: "3 ATLAS queries/month" },
      { included: true, text: "Business plan (1/month)" },
      { included: false, text: "Vendor payouts" },
    ],
    proItems: [
      "100 products + 5 stores",
      "ATLAS research expands to 50/month",
      "ATLAS ad copy unlimited",
      "10 business plans/month",
      "Stripe Connect + M-Pesa + Flutterwave payouts",
      "Vendor operations scale without manual bottlenecks",
    ],
  },
  "The Developer": {
    profileType: "The Developer",
    label: "Developer sees",
    intro: "Same pricing, different framing. OMEGA explains the upgrade around live API access, webhooks, connectors, and faster build velocity with NEXUS.",
    freeItems: [
      { included: true, text: "Read SDK docs" },
      { included: true, text: "Request API access" },
      { included: true, text: "Local AI usage stays unlimited" },
      { included: false, text: "Live API keys" },
      { included: false, text: "Webhooks and connectors" },
    ],
    proItems: [
      "1 live API key",
      "1,000 monthly API calls",
      "5 webhook subscriptions",
      "5 connector slots",
      "Full SDK access",
      "NEXUS AI chat (20/month)",
    ],
  },
  "The Marketer": {
    profileType: "The Marketer",
    label: "Marketer sees",
    intro: "Same pricing, different framing. OMEGA positions the upgrade around content velocity, audience insight, and stronger campaign tooling.",
    freeItems: [
      { included: true, text: "10 posts/month" },
      { included: true, text: "Community access" },
      { included: true, text: "ATLAS ad copy (1/month)" },
      { included: true, text: "Business plan (1/month)" },
      { included: false, text: "Scheduling and Direct Messages" },
    ],
    proItems: [
      "Unlimited posts",
      "Post scheduling + Direct Messages",
      "Creator analytics",
      "NOVA unlimited coaching",
      "ATLAS ad copy unlimited",
      "10 business plans/month",
    ],
  },
  "The Explorer": {
    profileType: "The Explorer",
    label: "Explorer sees",
    intro: "Same pricing, different framing. OMEGA keeps the story gentle: start broad on Free, then unlock deeper surfaces once your direction becomes obvious.",
    freeItems: [
      { included: true, text: "Community access" },
      { included: true, text: "All free courses" },
      { included: true, text: "Weekly OMEGA briefing" },
      { included: true, text: "Basic work and market exploration" },
      { included: false, text: "Paid-course and monetisation tools" },
    ],
    proItems: [
      "Daily OMEGA briefings",
      "Paid course access",
      "Direct Messages + scheduling",
      "More AI coaching across supervisors",
      "Stronger work and market execution tools",
      "A clearer route once your usage signals harden",
    ],
  },
  default: {
    profileType: "default",
    label: "OMEGA framing",
    intro: "Same pricing, different framing. OMEGA adjusts the story to match how you are most likely to use the ecosystem first.",
    freeItems: [
      { included: true, text: "Your core starting surface" },
      { included: true, text: "A limited but usable launch path" },
      { included: true, text: "Weekly OMEGA guidance" },
      { included: false, text: "Advanced monetisation and automation tools" },
    ],
    proItems: [
      "Higher limits on the surfaces you use most",
      "More AI coaching",
      "More monetisation and payout tools",
      "A faster route once your signals are clearer",
    ],
  },
};

export function getOnboardingPlanPresentation(profileType: string | null | undefined): OnboardingPlanPresentation {
  if (!profileType) return PLAN_PRESENTATIONS.default;
  return PLAN_PRESENTATIONS[(profileType as OnboardingPlanProfileType)] ?? PLAN_PRESENTATIONS.default;
}
