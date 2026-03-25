// ─── Phase 2 V2.0: Winners Community — NOVA Intelligence Hook ─────────────────────────
// useCommunityIntelligence.ts - React hook for NOVA AI features

import { useEffect, useCallback } from 'react';
import { communityIntelligenceStore } from './communityIntelligenceStore';

export function useCommunityIntelligence() {
  const store = communityIntelligenceStore();
  
  // Auto-fetch on mount
  useEffect(() => {
    store.fetchDetectedSkills();
    store.fetchInsightBanner();
    store.fetchOpportunities();
    store.fetchLoopStatus();
    store.fetchOpportunityStatus();
  }, []);
  
  // Detect skills in content (call after posting)
  const detectSkills = useCallback(async (content: string, postId?: string) => {
    const skills = await store.detectSkills(content, postId);
    // Refresh opportunities after skill detection
    if (skills.length > 0) {
      store.fetchOpportunities();
      store.fetchLoopStatus();
    }
    return skills;
  }, [store]);
  
  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      store.fetchDetectedSkills(),
      store.fetchInsightBanner(),
      store.fetchWeeklyReport(),
      store.fetchOpportunities(),
      store.fetchLoopStatus(),
      store.fetchOpportunityStatus(),
    ]);
  }, [store]);
  
  return {
    // Skills
    skills: store.detectedSkills,
    isLoadingSkills: store.isLoadingSkills,
    detectSkills,
    
    // Insights
    insightBanner: store.insightBanner,
    weeklyReport: store.weeklyReport,
    isLoadingInsights: store.isLoadingInsights,
    fetchInsightBanner: store.fetchInsightBanner,
    fetchWeeklyReport: store.fetchWeeklyReport,
    
    // Opportunities
    opportunities: store.opportunities,
    isLoadingOpportunities: store.isLoadingOpportunities,
    fetchOpportunities: store.fetchOpportunities,
    
    // Loop Status
    loopStatus: store.loopStatus,
    isLoadingLoop: store.isLoadingLoop,
    fetchLoopStatus: store.fetchLoopStatus,
    
    // Opportunity Status (Open to Work/Collab)
    opportunityStatus: store.opportunityStatus,
    isLoadingOpportunityStatus: store.isLoadingOpportunityStatus,
    updateOpportunityStatus: store.updateOpportunityStatus,
    
    // Utility
    refresh,
  };
}

// Hook for Opportunity Status toggle (for profile)
export function useOpportunityStatus() {
  const store = communityIntelligenceStore();
  
  useEffect(() => {
    store.fetchOpportunityStatus();
  }, []);
  
  return {
    status: store.opportunityStatus,
    isLoading: store.isLoadingOpportunityStatus,
    update: store.updateOpportunityStatus,
  };
}

// Hook for NOVA insights display
export function useNOVAInsights() {
  const store = communityIntelligenceStore();
  
  useEffect(() => {
    store.fetchInsightBanner();
    store.fetchWeeklyReport();
  }, []);
  
  return {
    banner: store.insightBanner,
    weekly: store.weeklyReport,
    isLoading: store.isLoadingInsights,
    error: store.insightsError,
  };
}

// Hook for cross-layer opportunities
export function useOpportunities() {
  const store = communityIntelligenceStore();
  
  useEffect(() => {
    store.fetchOpportunities();
  }, []);
  
  return {
    opportunities: store.opportunities,
    isLoading: store.isLoadingOpportunities,
    error: store.opportunitiesError,
    refetch: store.fetchOpportunities,
  };
}
