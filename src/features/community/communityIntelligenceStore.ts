// ─── Phase 2 V2.0: Winners Community — NOVA Intelligence Store ───────────────────────
// communityIntelligenceStore.ts - NOVA AI-powered features for Community layer

import { create } from 'zustand';
import { useAuthStore } from '../auth/authStore';
import { typedFetch } from '../../lib/typedFetch';

const API_BASE = '/community-intelligence';

interface Skill {
  name: string;
  confidence: number;
  category: string;
  count?: number;
}

interface LoopProgress {
  stage: number;
  stageName: string;
  currentStage: string;
  postsCount?: number;
  skillsDetected?: number;
  coursesTaken?: number;
  contractsWon?: number;
  lastActivity?: string;
}

interface Certificate {
  id: string;
  courseName: string;
  issuedAt: string;
}

interface Opportunity {
  type: string;
  label: string;
  supervisor: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  items?: Array<{
    title: string;
    budget?: string;
    link: string;
  }>;
}

interface InsightBanner {
  insight: string;
  user: {
    name?: string;
    trustScore?: number;
    trustScoreTier?: string;
  };
  skills: Array<{ skill: string; confidence: number; category: string }>;
  loopStage: string;
  generatedAt: string;
}

interface WeeklyReport {
  period: { from: string; to: string };
  metrics: {
    postsPublished: number;
    totalEngagement: number;
    followersGained: number;
    skillsDetected: number;
    bestPostEngagement: number;
  };
  stage: string;
  opportunitiesCount: number;
  recommendation: string;
}

interface OpportunityStatus {
  isEnabled: boolean;
  status: string;
  bio: string | null;
}

interface SkillDetectionResponse {
  skills: Array<{
    name: string;
    confidence: number;
    category: string;
  }>;
}

interface SkillsResponse {
  skills: Skill[];
}

type InsightBannerResponse = InsightBanner;

interface WeeklyReportResponse {
  report: WeeklyReport;
}

interface OpportunitiesResponse {
  opportunities: CommunityIntelligenceState["opportunities"];
}

interface LoopStatusResponse {
  loop: LoopProgress;
}

interface CommunityIntelligenceState {
  // Skills
  detectedSkills: Skill[];
  isLoadingSkills: boolean;
  skillDetectionError: string | null;
  
  // Insights
  insightBanner: InsightBanner | null;
  weeklyReport: WeeklyReport | null;
  isLoadingInsights: boolean;
  insightsError: string | null;
  
  // Opportunities
  opportunities: {
    skillMatch: Opportunity | null;
    learningGap: Opportunity | null;
    marketOpening: Opportunity | null;
  } | null;
  isLoadingOpportunities: boolean;
  opportunitiesError: string | null;
  
  // Loop Status
  loopStatus: LoopProgress | null;
  isLoadingLoop: boolean;
  loopError: string | null;
  
  // Opportunity Status
  opportunityStatus: OpportunityStatus | null;
  isLoadingOpportunityStatus: boolean;
  opportunityStatusError: string | null;
  
  // Actions
  detectSkills: (content: string, postId?: string) => Promise<Skill[]>;
  fetchDetectedSkills: () => Promise<void>;
  fetchInsightBanner: () => Promise<void>;
  fetchWeeklyReport: () => Promise<void>;
  fetchOpportunities: () => Promise<void>;
  fetchLoopStatus: () => Promise<void>;
  fetchOpportunityStatus: () => Promise<void>;
  updateOpportunityStatus: (status: string, bio?: string) => Promise<void>;
}

export const communityIntelligenceStore = create<CommunityIntelligenceState>((set, get) => ({
  // Initial state
  detectedSkills: [],
  isLoadingSkills: false,
  skillDetectionError: null,
  
  insightBanner: null,
  weeklyReport: null,
  isLoadingInsights: false,
  insightsError: null,
  
  opportunities: null,
  isLoadingOpportunities: false,
  opportunitiesError: null,
  
  loopStatus: null,
  isLoadingLoop: false,
  loopError: null,
  
  opportunityStatus: null,
  isLoadingOpportunityStatus: false,
  opportunityStatusError: null,
  
  // Detect skills in post content using NOVA
  detectSkills: async (content: string, postId?: string) => {
    set({ isLoadingSkills: true, skillDetectionError: null });
    try {
      const token = useAuthStore.getState().token;
      const data = await typedFetch<SkillDetectionResponse>(`${API_BASE}/skills/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content, postId }),
      });

      const skills: Skill[] = data.skills.map((s) => ({
        name: s.name,
        confidence: s.confidence,
        category: s.category,
      }));
      
      set({ detectedSkills: skills, isLoadingSkills: false });
      return skills;
    } catch (error: unknown) {
      set({ skillDetectionError: error instanceof Error ? error.message : 'Failed to detect skills', isLoadingSkills: false });
      return [];
    }
  },
  
  // Fetch user's detected skills
  fetchDetectedSkills: async () => {
    set({ isLoadingSkills: true, skillDetectionError: null });
    try {
      const token = useAuthStore.getState().token;
      const data = await typedFetch<SkillsResponse>(`${API_BASE}/skills/detected`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      set({ detectedSkills: data.skills || [], isLoadingSkills: false });
    } catch (error: unknown) {
      set({ skillDetectionError: error instanceof Error ? error.message : 'Failed to fetch skills', isLoadingSkills: false });
    }
  },
  
  // Fetch NOVA insight banner
  fetchInsightBanner: async () => {
    set({ isLoadingInsights: true, insightsError: null });
    try {
      const token = useAuthStore.getState().token;
      const data = await typedFetch<InsightBannerResponse>(`${API_BASE}/insights/banner`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      set({ insightBanner: data, isLoadingInsights: false });
    } catch (error: unknown) {
      set({ insightsError: error instanceof Error ? error.message : 'Failed to fetch insight', isLoadingInsights: false });
    }
  },
  
  // Fetch weekly intelligence report
  fetchWeeklyReport: async () => {
    set({ isLoadingInsights: true, insightsError: null });
    try {
      const token = useAuthStore.getState().token;
      const data = await typedFetch<WeeklyReportResponse>(`${API_BASE}/insights/weekly`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      set({ weeklyReport: data.report, isLoadingInsights: false });
    } catch (error: unknown) {
      set({ insightsError: error instanceof Error ? error.message : 'Failed to fetch weekly report', isLoadingInsights: false });
    }
  },
  
  // Fetch cross-layer opportunities
  fetchOpportunities: async () => {
    set({ isLoadingOpportunities: true, opportunitiesError: null });
    try {
      const token = useAuthStore.getState().token;
      const data = await typedFetch<OpportunitiesResponse>(`${API_BASE}/opportunities`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      set({ opportunities: data.opportunities, isLoadingOpportunities: false });
    } catch (error: unknown) {
      set({ opportunitiesError: error instanceof Error ? error.message : 'Failed to fetch opportunities', isLoadingOpportunities: false });
    }
  },
  
  // Fetch Agentic Loop status
  fetchLoopStatus: async () => {
    set({ isLoadingLoop: true, loopError: null });
    try {
      const token = useAuthStore.getState().token;
      const data = await typedFetch<LoopStatusResponse>(`${API_BASE}/loop-status`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      set({ loopStatus: data.loop, isLoadingLoop: false });
    } catch (error: unknown) {
      set({ loopError: error instanceof Error ? error.message : 'Failed to fetch loop status', isLoadingLoop: false });
    }
  },
  
  // Fetch user's opportunity status
  fetchOpportunityStatus: async () => {
    set({ isLoadingOpportunityStatus: true, opportunityStatusError: null });
    try {
      const token = useAuthStore.getState().token;
      const data = await typedFetch<OpportunityStatus>(`${API_BASE}/opportunity-status`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      set({ opportunityStatus: data, isLoadingOpportunityStatus: false });
    } catch (error: unknown) {
      set({ opportunityStatusError: error instanceof Error ? error.message : 'Failed to fetch opportunity status', isLoadingOpportunityStatus: false });
    }
  },
  
  // Update user's opportunity status
  updateOpportunityStatus: async (status: string, bio?: string) => {
    set({ isLoadingOpportunityStatus: true, opportunityStatusError: null });
    try {
      const token = useAuthStore.getState().token;
      const data = await typedFetch<OpportunityStatus>(`${API_BASE}/opportunity-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isEnabled: true, status, bio }),
      });
      set({ opportunityStatus: data, isLoadingOpportunityStatus: false });
    } catch (error: unknown) {
      set({ opportunityStatusError: error instanceof Error ? error.message : 'Failed to update opportunity status', isLoadingOpportunityStatus: false });
    }
  },
}));
