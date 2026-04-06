// Level VIII - Social Intelligence Graph
// Store: socialGraphStore
// Tracks connections, suggestions, and collaboration opportunities

import { create } from "zustand";
import { typedFetch } from "../lib/typedFetch";

interface Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  connectedUserName: string;
  connectedUserAvatar?: string;
  connectedUserTrustScore: number;
  connectedUserSkills: string[];
  connectedAt: string;
  mutualConnections: number;
}

interface SuggestedConnection {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  trustScore: number;
  skills: string[];
  matchReason: string;
  overlapScore: number; // 0-100 how similar their skills are
}

interface CollabOpportunity {
  id: string;
  type: "skill互补" | "project" | "learning" | "business";
  title: string;
  description: string;
  participants: string[];
  suggestedAt: string;
  status: "pending" | "accepted" | "declined";
}

interface SocialGraphStore {
  // State
  connections: Connection[];
  suggestedConnections: SuggestedConnection[];
  collaborationOpportunities: CollabOpportunity[];
  networkStrength: number; // 0-100
  isLoadingSuggestions: boolean;
  
  // Actions
  fetchConnections: () => Promise<void>;
  fetchSuggestions: () => Promise<void>;
  connect: (userId: string) => Promise<void>;
  disconnect: (connectionId: string) => Promise<void>;
  respondToCollab: (opportunityId: string, accept: boolean) => Promise<void>;
  dismissSuggestion: (suggestionId: string) => void;
}

interface ConnectionsResponse {
  connections: Connection[];
}

interface SuggestionsResponse {
  suggestions: SuggestedConnection[];
}

export const useSocialGraphStore = create<SocialGraphStore>((set, get) => ({
  // Initial state
  connections: [],
  suggestedConnections: [],
  collaborationOpportunities: [],
  networkStrength: 0,
  isLoadingSuggestions: false,
  
  fetchConnections: async () => {
    try {
      const data = await typedFetch<ConnectionsResponse>("/api/v1/social/connections");
      set({ connections: data.connections });

      // Calculate network strength
      const connections = data.connections as Connection[];
      const strength = Math.min(100, Math.round(connections.length * 5 +
        connections.reduce((acc, c) => acc + c.mutualConnections, 0) * 2));
      set({ networkStrength: strength });
    } catch (error: unknown) {
      console.error("Failed to fetch connections:", error);
    }
  },
  
  fetchSuggestions: async () => {
    set({ isLoadingSuggestions: true });
    try {
      const data = await typedFetch<SuggestionsResponse>("/api/v1/social/suggestions");
      set({ suggestedConnections: data.suggestions });
    } catch (error: unknown) {
      console.error("Failed to fetch suggestions:", error);
    } finally {
      set({ isLoadingSuggestions: false });
    }
  },
  
  connect: async (userId: string) => {
    try {
      await typedFetch("/api/v1/social/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      // Remove from suggestions and add to connections
      const { suggestedConnections, connections } = get();
      const suggestion = suggestedConnections.find(s => s.userId === userId);

      if (suggestion) {
        set({
          suggestedConnections: suggestedConnections.filter(s => s.userId !== userId),
          connections: [
            ...connections,
            {
              id: `conn_${Date.now()}`,
              userId: "", // current user
              connectedUserId: userId,
              connectedUserName: suggestion.userName,
              connectedUserAvatar: suggestion.userAvatar,
              connectedUserTrustScore: suggestion.trustScore,
              connectedUserSkills: suggestion.skills,
              connectedAt: new Date().toISOString(),
              mutualConnections: 0,
            },
          ],
        });
      }
    } catch (error: unknown) {
      console.error("Failed to connect:", error);
    }
  },
  
  disconnect: async (connectionId: string) => {
    try {
      await typedFetch(`/api/v1/social/connections/${connectionId}`, {
        method: "DELETE",
      });
      
      set(state => ({
        connections: state.connections.filter(c => c.id !== connectionId),
      }));
    } catch (error: unknown) {
      console.error("Failed to disconnect:", error);
    }
  },
  
  respondToCollab: async (opportunityId: string, accept: boolean) => {
    try {
      await typedFetch(`/api/v1/social/collab/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: accept ? "accepted" : "declined" }),
      });
      
      set(state => ({
        collaborationOpportunities: state.collaborationOpportunities.map(o =>
          o.id === opportunityId 
            ? { ...o, status: accept ? "accepted" : "declined" }
            : o
        ),
      }));
    } catch (error: unknown) {
      console.error("Failed to respond to collab:", error);
    }
  },
  
  dismissSuggestion: (suggestionId: string) => {
    set(state => ({
      suggestedConnections: state.suggestedConnections.filter(s => s.id !== suggestionId),
    }));
  },
}));
