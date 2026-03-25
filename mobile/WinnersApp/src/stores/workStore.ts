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

export const useWorkStore = create<WorkState>((set) => ({
  currentFreelancerId: "freelancer-amina-okafor",
  jobs: JOBS,
  contracts: CONTRACTS,
  freelancers: FREELANCERS,
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
