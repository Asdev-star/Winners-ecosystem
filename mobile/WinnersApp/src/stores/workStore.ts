import { create } from "zustand";

export type WorkJob = {
  id: string;
  title: string;
  company: string;
  companyTagline: string;
  mode: string;
  location: string;
  compensation: string;
  postedLabel: string;
  postedAt: string;
  applicants: number;
  tags: string[];
  summary: string;
  responsibilities: string[];
  requirements: string[];
  circuitFitScore: number;
  circuitAnalysis: string;
  circuitSignals: string[];
  profileMatchUserId: string;
  saved: boolean;
  applied: boolean;
};

export type WorkMilestone = {
  id: string;
  label: string;
  amount: string;
  status: "Released" | "Pending" | "Locked";
  dueLabel: string;
};

export type WorkContract = {
  id: string;
  jobId: string;
  projectName: string;
  client: string;
  statusLabel: string;
  escrowAmount: string;
  userRole: "client" | "freelancer";
  scopeSummary: string;
  messageThreadLabel: string;
  milestones: WorkMilestone[];
};

export type WorkFreelancerProfile = {
  id: string;
  name: string;
  title: string;
  location: string;
  availability: string;
  trustScore: number;
  completionRate: string;
  hourlyRate: string;
  responseTime: string;
  bio: string;
  skills: string[];
  focusAreas: string[];
  highlights: Array<{ id: string; label: string; value: string }>;
  featuredContractIds: string[];
};

export type WorkIntelligenceTool = {
  id: string;
  name: string;
  headline: string;
  summary: string;
  actionLabel: string;
  impactLabel: string;
};

export type WorkService = {
  id: string;
  title: string;
  provider: string;
  serviceType: "Offer service" | "Get service";
  pricing: string;
  deliveryWindow: string;
  fitScore: number;
  summary: string;
  tags: string[];
  linkedProfileId?: string;
  linkedJobId?: string;
};

export type WorkPlatformIntegration = {
  id: string;
  name: string;
  category: "Find jobs" | "Hire talent" | "Offer services" | "Get services";
  syncStatus: string;
  bestFor: string;
  workflow: string;
  strengths: string[];
};

type WorkApplicationPayload = {
  jobId: string;
  proposal: string;
  rate: string;
  deliveryWindow: string;
};

type WorkState = {
  currentFreelancerId: string;
  jobs: WorkJob[];
  contracts: WorkContract[];
  freelancers: WorkFreelancerProfile[];
  intelligenceTools: WorkIntelligenceTool[];
  services: WorkService[];
  platformIntegrations: WorkPlatformIntegration[];
  savedJobIds: string[];
  appliedJobIds: string[];
  toggleSavedJob: (jobId: string) => void;
  submitApplication: (payload: WorkApplicationPayload) => void;
};

const JOBS: WorkJob[] = [
  {
    id: "job-react-native-growth-dashboard",
    title: "React Native growth dashboard",
    company: "TechBridge Africa",
    companyTagline: "Scaling operator intelligence across market, academy, and community.",
    mode: "Remote",
    location: "Lagos / Remote",
    compensation: "$2,000-$5,000",
    postedLabel: "2 hours ago",
    postedAt: "2026-03-23T08:30:00.000Z",
    applicants: 14,
    tags: ["React", "Mobile", "Analytics"],
    summary:
      "Build a mobile-first performance cockpit that helps founders monitor revenue, audience health, and execution rhythm across the Winners ecosystem.",
    responsibilities: [
      "Ship dashboards and drill-down flows in Expo SDK 51 with strong offline behavior.",
      "Partner with product to translate analytics questions into fast mobile UI patterns.",
      "Integrate charting, caching, and accessible touch targets without sacrificing frame rate.",
    ],
    requirements: [
      "3+ shipped React Native products with production analytics surfaces.",
      "Comfort with Zustand, typed navigation, and Expo-native modules.",
      "Ability to work async with founders across Africa and diaspora markets.",
    ],
    circuitFitScore: 92,
    circuitAnalysis:
      "CIRCUIT sees a high fit because your current mobile delivery work, state management patterns, and design-system discipline line up directly with the scope.",
    circuitSignals: [
      "Strong overlap with your Expo SDK 51 and Zustand stack history.",
      "Your recent delivery speed matches the team cadence for a 4-week sprint.",
      "The role rewards systems thinking more than one-off visual polish.",
    ],
    profileMatchUserId: "freelancer-amina-okafor",
    saved: true,
    applied: false,
  },
  {
    id: "job-community-launch-systems",
    title: "Community launch systems designer",
    company: "Diaspora Ventures",
    companyTagline: "Designing launch rituals that turn attention into action.",
    mode: "Remote",
    location: "Accra / Remote",
    compensation: "$800-$1,600",
    postedLabel: "5 hours ago",
    postedAt: "2026-03-23T05:15:00.000Z",
    applicants: 9,
    tags: ["Community", "Strategy", "Design"],
    summary:
      "Design weekly programming, launch rituals, and accountability loops that keep founders active before, during, and after their release windows.",
    responsibilities: [
      "Map the launch journey from teaser content to post-launch retention rituals.",
      "Produce modular prompts that can be reused across groups, posts, and live sessions.",
      "Instrument simple reporting so founders can see what content actually moved behavior.",
    ],
    requirements: [
      "Experience designing community programming or creator education rhythms.",
      "Clear writing and strong taste for participation mechanics.",
      "Confidence working with moderators, hosts, and operator teams.",
    ],
    circuitFitScore: 81,
    circuitAnalysis:
      "CIRCUIT sees a strong strategic match if you want more community-systems work, though the role leans more editorial than product-heavy.",
    circuitSignals: [
      "High overlap with your community and launch-planning instincts.",
      "Faster time-to-value than a deep engineering contract.",
      "Lower technical depth than your strongest product-build roles.",
    ],
    profileMatchUserId: "freelancer-amina-okafor",
    saved: false,
    applied: false,
  },
  {
    id: "job-fractional-product-ops",
    title: "Fractional product operations lead",
    company: "Winners Commerce Studio",
    companyTagline: "Bringing clarity to multi-surface launches and fulfillment loops.",
    mode: "Hybrid",
    location: "Nairobi / Remote",
    compensation: "$3,500-$6,500",
    postedLabel: "1 day ago",
    postedAt: "2026-03-22T11:00:00.000Z",
    applicants: 6,
    tags: ["Operations", "AI Systems", "Strategy"],
    summary:
      "Own launch readiness, assistant routing, and weekly delivery rituals across Academy, Market, and AI surfaces for a fast-moving product team.",
    responsibilities: [
      "Run planning and execution rituals that surface blockers before they slow delivery.",
      "Translate strategy into dashboards, SOPs, and operating cadences the team can sustain.",
      "Coordinate AI assistants, fulfillment owners, and learning content with clear handoffs.",
    ],
    requirements: [
      "Experience leading product or operations systems for a lean team.",
      "Strong communication and appetite for messy cross-functional work.",
      "Comfort designing repeatable processes across content, product, and commerce.",
    ],
    circuitFitScore: 88,
    circuitAnalysis:
      "CIRCUIT ranks this role highly if you want more ownership and systems design. It is slightly less hands-on technically, but the leverage is excellent.",
    circuitSignals: [
      "High leadership leverage with direct visibility into ecosystem growth.",
      "Excellent fit for someone already building cross-surface workflows.",
      "Requires comfort making decisions with incomplete information.",
    ],
    profileMatchUserId: "freelancer-amina-okafor",
    saved: false,
    applied: true,
  },
];

const CONTRACTS: WorkContract[] = [
  {
    id: "contract-1234",
    jobId: "job-react-native-growth-dashboard",
    projectName: "React Native growth dashboard",
    client: "TechBridge Africa",
    statusLabel: "In Progress",
    escrowAmount: "$2,500",
    userRole: "freelancer",
    scopeSummary: "Mobile analytics cockpit, insight cards, and milestone-based reporting for leadership.",
    messageThreadLabel: "Client replied 18 minutes ago",
    milestones: [
      { id: "m1", label: "Milestone 1", amount: "$500", status: "Released", dueLabel: "Completed Mar 14" },
      { id: "m2", label: "Milestone 2", amount: "$1,000", status: "Pending", dueLabel: "Due Mar 27" },
      { id: "m3", label: "Milestone 3", amount: "$1,000", status: "Locked", dueLabel: "Starts Apr 2" },
    ],
  },
  {
    id: "contract-2231",
    jobId: "job-community-launch-systems",
    projectName: "Community launch systems designer",
    client: "Diaspora Ventures",
    statusLabel: "Review",
    escrowAmount: "$1,200",
    userRole: "client",
    scopeSummary: "Launch calendar, moderation rituals, and reporting templates for a founder cohort.",
    messageThreadLabel: "Awaiting freelancer revision",
    milestones: [
      { id: "m1", label: "Milestone 1", amount: "$400", status: "Released", dueLabel: "Completed Mar 11" },
      { id: "m2", label: "Milestone 2", amount: "$400", status: "Pending", dueLabel: "Needs approval" },
      { id: "m3", label: "Milestone 3", amount: "$400", status: "Locked", dueLabel: "Begins after sign-off" },
    ],
  },
];

const FREELANCERS: WorkFreelancerProfile[] = [
  {
    id: "freelancer-amina-okafor",
    name: "Amina Okafor",
    title: "Mobile systems strategist",
    location: "Nairobi, Kenya",
    availability: "Available in 1 week",
    trustScore: 94,
    completionRate: "98% completion rate",
    hourlyRate: "$70/hour",
    responseTime: "Replies in under 2 hours",
    bio:
      "Amina helps lean teams ship clear, high-trust mobile experiences across product, community, and commerce. Her sweet spot is translating messy strategy into shippable systems.",
    skills: ["React Native", "Expo", "Product Ops", "Analytics", "Community Systems"],
    focusAreas: ["Growth surfaces", "Cross-platform UX", "Assistant-driven workflows"],
    highlights: [
      { id: "h1", label: "Projects shipped", value: "27" },
      { id: "h2", label: "Average rating", value: "4.9 / 5" },
      { id: "h3", label: "Repeat clients", value: "73%" },
    ],
    featuredContractIds: ["contract-1234", "contract-2231"],
  },
];

const INTELLIGENCE_TOOLS: WorkIntelligenceTool[] = [
  {
    id: "tool-circuit-match",
    name: "CIRCUIT Match",
    headline: "Ranks the best roles, clients, and service opportunities by timing, skill fit, and trust.",
    summary: "Use it when you need fast signal on what to apply for, who to hire, or which service offer to publish first.",
    actionLabel: "Review strongest matches",
    impactLabel: "Cuts low-quality outreach before it starts",
  },
  {
    id: "tool-proposal-studio",
    name: "Proposal Studio",
    headline: "Builds tailored proposals, scope notes, and client-ready answers from one brief.",
    summary: "Great for freelancers packaging services and for teams responding to hiring briefs without starting from a blank page.",
    actionLabel: "Draft winning proposals",
    impactLabel: "Speeds up proposal and scope creation",
  },
  {
    id: "tool-trust-risk",
    name: "Trust and Risk Scan",
    headline: "Highlights payment friction, vague briefs, unrealistic deadlines, and weak marketplace signals.",
    summary: "Use it before accepting work, hiring a contractor, or buying a service package from a new provider.",
    actionLabel: "Check delivery risk",
    impactLabel: "Reduces bad-fit contracts and unreliable buyers",
  },
  {
    id: "tool-brief-builder",
    name: "AI Brief Builder",
    headline: "Turns a rough hiring need or service request into a clear scope, milestones, and shortlist criteria.",
    summary: "Helpful for clients who know the outcome they need but want clearer requirements before they hire or buy a service.",
    actionLabel: "Build a sharper brief",
    impactLabel: "Improves role clarity before hiring",
  },
  {
    id: "tool-gig-packager",
    name: "Gig Packager",
    headline: "Shapes repeatable freelancer work into a productized offer with pricing, delivery windows, and proof points.",
    summary: "Great for users who want to stop rewriting the same offer and start selling services more consistently across platforms.",
    actionLabel: "Package a service offer",
    impactLabel: "Makes services easier to sell",
  },
];

const SERVICES: WorkService[] = [
  {
    id: "service-mobile-product-sprint",
    title: "Mobile product sprint",
    provider: "Amina Okafor",
    serviceType: "Offer service",
    pricing: "$1,500 fixed sprint",
    deliveryWindow: "10 business days",
    fitScore: 95,
    summary: "A focused sprint for product teams that need a mobile feature shipped, tightened, and ready for release.",
    tags: ["React Native", "Product Delivery", "QA"],
    linkedProfileId: "freelancer-amina-okafor",
  },
  {
    id: "service-launch-ops-pack",
    title: "Launch ops system setup",
    provider: "Diaspora Ventures",
    serviceType: "Get service",
    pricing: "$900 setup",
    deliveryWindow: "1 week",
    fitScore: 84,
    summary: "Ideal for founders who need launch rituals, checklists, and reporting templates without building the system from scratch.",
    tags: ["Operations", "Community", "Templates"],
    linkedJobId: "job-community-launch-systems",
  },
  {
    id: "service-ai-client-brief",
    title: "AI client brief and hiring pack",
    provider: "Winners Work Layer",
    serviceType: "Get service",
    pricing: "$120 per brief",
    deliveryWindow: "Same day",
    fitScore: 89,
    summary: "Turns a rough idea into a scope doc, role outline, interview rubric, and delivery milestones for faster hiring.",
    tags: ["AI", "Hiring", "Scoping"],
  },
];

const PLATFORM_INTEGRATIONS: WorkPlatformIntegration[] = [
  {
    id: "platform-linkedin",
    name: "LinkedIn",
    category: "Find jobs",
    syncStatus: "Profile sync ready",
    bestFor: "Professional roles, recruiter discovery, long-term hiring",
    workflow: "Push your profile summary and use CIRCUIT to decide which openings deserve a tailored application.",
    strengths: ["Recruiter visibility", "Brand credibility", "High-signal hiring teams"],
  },
  {
    id: "platform-indeed",
    name: "Indeed",
    category: "Find jobs",
    syncStatus: "Search feed ready",
    bestFor: "Broad job discovery across remote and local markets",
    workflow: "Pull role themes into the Work layer, then shortlist by compensation, location, and fit score.",
    strengths: ["Large volume", "Fast search coverage", "Easy salary comparison"],
  },
  {
    id: "platform-wellfound",
    name: "Wellfound",
    category: "Find jobs",
    syncStatus: "Startup pipeline ready",
    bestFor: "Startup jobs, operator roles, and early-stage product teams",
    workflow: "Pull startup opportunities into Winners Work, then prioritize the teams with clearer ownership and faster decisions.",
    strengths: ["Startup access", "Direct teams", "Operator roles"],
  },
  {
    id: "platform-upwork",
    name: "Upwork",
    category: "Offer services",
    syncStatus: "Proposal workflow mapped",
    bestFor: "Freelance proposals, short contracts, scoped delivery work",
    workflow: "Package services, compare buyer signals, and route the best-fit briefs into Proposal Studio.",
    strengths: ["Freelance demand", "Escrow support", "Short-cycle contracts"],
  },
  {
    id: "platform-fiverr",
    name: "Fiverr",
    category: "Offer services",
    syncStatus: "Gig packaging ready",
    bestFor: "Productized service offers and fast turnaround gigs",
    workflow: "Turn repeatable delivery into clear offers with pricing, timeline, and outcome framing.",
    strengths: ["Service packaging", "Repeatable offers", "Fast buyer intent"],
  },
  {
    id: "platform-contra",
    name: "Contra",
    category: "Offer services",
    syncStatus: "Portfolio flow ready",
    bestFor: "Independent creatives, builders, and portfolio-first service selling",
    workflow: "Refine your positioning in Winners Work, then publish a stronger portfolio-led offer in Contra.",
    strengths: ["Portfolio first", "Independent brand", "Creative work"],
  },
  {
    id: "platform-toptal",
    name: "Toptal",
    category: "Hire talent",
    syncStatus: "Talent sourcing mapped",
    bestFor: "Premium specialist hiring and vetted freelance talent",
    workflow: "Use the Work layer to compare trust signals, scope clarity, and specialist fit before outreach.",
    strengths: ["Vetted experts", "Senior talent", "Fast shortlist quality"],
  },
  {
    id: "platform-freelancer",
    name: "Freelancer.com",
    category: "Hire talent",
    syncStatus: "Bid comparison ready",
    bestFor: "Budget-sensitive hiring with many proposals to compare",
    workflow: "Collect bid volume there, then use Winners Work trust signals to filter weak proposals and delivery risk.",
    strengths: ["Proposal volume", "Global reach", "Flexible budgets"],
  },
  {
    id: "platform-catalant",
    name: "Catalant",
    category: "Get services",
    syncStatus: "Service buying mapped",
    bestFor: "Consulting, strategy, and fractional operator engagements",
    workflow: "Convert your need into a buying brief, then compare service providers on outcome, budget, and speed.",
    strengths: ["Fractional operators", "Consulting scope", "Enterprise-style matching"],
  },
  {
    id: "platform-malt",
    name: "Malt",
    category: "Get services",
    syncStatus: "Service sourcing ready",
    bestFor: "European freelance sourcing and specialist service buying",
    workflow: "Use Winners Work to shape the brief, then compare specialists by trust, timing, and service fit.",
    strengths: ["European market", "Specialist sourcing", "Service comparisons"],
  },
];

export const useWorkStore = create<WorkState>((set) => ({
  currentFreelancerId: "freelancer-amina-okafor",
  jobs: JOBS,
  contracts: CONTRACTS,
  freelancers: FREELANCERS,
  intelligenceTools: INTELLIGENCE_TOOLS,
  services: SERVICES,
  platformIntegrations: PLATFORM_INTEGRATIONS,
  savedJobIds: JOBS.filter((job) => job.saved).map((job) => job.id),
  appliedJobIds: JOBS.filter((job) => job.applied).map((job) => job.id),

  toggleSavedJob: (jobId) => {
    set((state) => {
      const shouldSave = !state.savedJobIds.includes(jobId);

      return {
        jobs: state.jobs.map((job) =>
          job.id === jobId
            ? {
                ...job,
                saved: shouldSave,
              }
            : job,
        ),
        savedJobIds: shouldSave ? [...state.savedJobIds, jobId] : state.savedJobIds.filter((id) => id !== jobId),
      };
    });
  },

  submitApplication: ({ jobId }) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              applied: true,
              applicants: job.applicants + (state.appliedJobIds.includes(jobId) ? 0 : 1),
            }
          : job,
      ),
      appliedJobIds: state.appliedJobIds.includes(jobId) ? state.appliedJobIds : [...state.appliedJobIds, jobId],
    }));
  },
}));

export function getWorkJob(jobId: string) {
  return useWorkStore.getState().jobs.find((job) => job.id === jobId);
}

export function getWorkContract(contractId: string) {
  return useWorkStore.getState().contracts.find((contract) => contract.id === contractId);
}

export function getWorkFreelancer(userId: string) {
  return useWorkStore.getState().freelancers.find((profile) => profile.id === userId);
}
