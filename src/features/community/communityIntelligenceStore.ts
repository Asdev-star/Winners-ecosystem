// ─── Phase 2 V2.0: Winners Community — NOVA Intelligence Store ───────────────────────
// communityIntelligenceStore.ts - NOVA AI-powered features for Community layer

import { create } from 'zustand';
import { useAuthStore } from '../auth/authStore';

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
      const response = await fetch(`${API_BASE}/skills/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content, postId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to detect skills');
      }
      
      const data = await response.json();
      const skills: Skill[] = data.skills.map((s: any) => ({
        name: s.name,
        confidence: s.confidence,
        category: s.category,
      }));
      
      set({ detectedSkills: skills, isLoadingSkills: false });
      return skills;
    } catch (error: any) {
      set({ skillDetectionError: error.message, isLoadingSkills: false });
      return [];
    }
  },
  
  // Fetch user's detected skills
  fetchDetectedSkills: async () => {
    set({ isLoadingSkills: true, skillDetectionError: null });
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/skills/detected`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch skills');
      }
      
      const data = await response.json();
      set({ detectedSkills: data.skills || [], isLoadingSkills: false });
    } catch (error: any) {
      set({ skillDetectionError: error.message, isLoadingSkills: false });
    }
  },
  
  // Fetch NOVA insight banner
  fetchInsightBanner: async () => {
    set({ isLoadingInsights: true, insightsError: null });
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/insights/banner`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch insight');
      }
      
      const data = await response.json();
      set({ insightBanner: data, isLoadingInsights: false });
    } catch (error: any) {
      set({ insightsError: error.message, isLoadingInsights: false });
    }
  },
  
  // Fetch weekly intelligence report
  fetchWeeklyReport: async () => {
    set({ isLoadingInsights: true, insightsError: null });
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/insights/weekly`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch weekly report');
      }
      
      const data = await response.json();
      set({ weeklyReport: data.report, isLoadingInsights: false });
    } catch (error: any) {
      set({ insightsError: error.message, isLoadingInsights: false });
    }
  },
  
  // Fetch cross-layer opportunities
  fetchOpportunities: async () => {
    set({ isLoadingOpportunities: true, opportunitiesError: null });
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/opportunities`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch opportunities');
      }
      
      const data = await response.json();
      set({ opportunities: data.opportunities, isLoadingOpportunities: false });
    } catch (error: any) {
      set({ opportunitiesError: error.message, isLoadingOpportunities: false });
    }
  },
  
  // Fetch Agentic Loop status
  fetchLoopStatus: async () => {
    set({ isLoadingLoop: true, loopError: null });
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/loop-status`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch loop status');
      }
      
      const data = await response.json();
      set({ loopStatus: data.loop, isLoadingLoop: false });
    } catch (error: any) {
      set({ loopError: error.message, isLoadingLoop: false });
    }
  },
  
  // Fetch user's opportunity status
  fetchOpportunityStatus: async () => {
    set({ isLoadingOpportunityStatus: true, opportunityStatusError: null });
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/opportunity-status`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch opportunity status');
      }
      
      const data = await response.json();
      set({ opportunityStatus: data, isLoadingOpportunityStatus: false });
    } catch (error: any) {
      set({ opportunityStatusError: error.message, isLoadingOpportunityStatus: false });
    }
  },
  
  // Update user's opportunity status
  updateOpportunityStatus: async (status: string, bio?: string) => {
    set({ isLoadingOpportunityStatus: true, opportunityStatusError: null });
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/opportunity-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isEnabled: true, status, bio }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update opportunity status');
      }
      
      const data = await response.json();
      set({ opportunityStatus: data, isLoadingOpportunityStatus: false });
    } catch (error: any) {
      set({ opportunityStatusError: error.message, isLoadingOpportunityStatus: false });
    }
  },
}));
