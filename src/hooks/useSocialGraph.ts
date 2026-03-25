// Level VIII - Social Intelligence Graph
// Hook: useSocialGraph
// Provides social graph state and actions

import { useEffect } from "react";
import { useSocialGraphStore } from "../stores/socialGraphStore";

export function useSocialGraph() {
  const {
    connections,
    suggestedConnections,
    collaborationOpportunities,
    networkStrength,
    isLoadingSuggestions,
    fetchConnections,
    fetchSuggestions,
    connect,
    disconnect,
    respondToCollab,
    dismissSuggestion,
  } = useSocialGraphStore();

  // Auto-fetch on mount
  useEffect(() => {
    fetchConnections();
    fetchSuggestions();
  }, [fetchConnections, fetchSuggestions]);

  return {
    // Connections
    connections,
    connectionCount: connections.length,
    
    // Suggestions
    suggestions: suggestedConnections,
    suggestionCount: suggestedConnections.length,
    isLoadingSuggestions,
    
    // Collaboration
    collabOpportunities: collaborationOpportunities,
    
    // Network metrics
    networkStrength,
    
    // Actions
    connect,
    disconnect,
    respondToCollab,
    dismissSuggestion,
    refresh: () => {
      fetchConnections();
      fetchSuggestions();
    },
  };
}

// Hook for connection suggestions based on skills
export function useSkillConnections(userSkills: string[]) {
  const { suggestedConnections, connect, dismissSuggestion } = useSocialGraphStore();
  
  const relevantSuggestions = suggestedConnections.filter(suggestion => {
    // Find overlap in skills
    const overlap = suggestion.skills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );
    return overlap.length > 0;
  });

  return {
    suggestions: relevantSuggestions,
    connect,
    dismissSuggestion,
  };
}

// Hook for people who viewed your profile
export function useProfileViewers() {
  // This would typically come from an API
  // For now, return empty array
  return {
    viewers: [],
    viewerCount: 0,
  };
}

// Hook for new followers
export function useNewFollowers() {
  const { connections } = useSocialGraphStore();
  
  // Get connections from last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const newFollowers = connections.filter(c => 
    new Date(c.connectedAt) > weekAgo
  );

  return {
    newFollowers,
    newFollowerCount: newFollowers.length,
  };
}
