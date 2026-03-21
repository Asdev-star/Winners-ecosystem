// Level IV - Reactive Ecosystem State
// Store: ecosystemStore
// THE central nervous system connecting all 8 layers

import { create } from "zustand";
import { getWinnersClient } from "../lib/api";

type LayerKey = "core" | "community" | "academy" | "market" | "intelligence" | "work" | "cloud" | "ai-platform";

interface LayerHealth {
  status: "live" | "active" | "building" | "planned";
  lastChecked: string;
  metrics?: {
    uptime: number;
    responseTime: number;
    activeUsers?: number;
  };
}

type LoopStage = "community" | "academy" | "work" | "market" | "intelligence" | null;

interface AgenticLoop {
  id: string;
  userId: string;
  trigger: string;
  steps: string[];
  outcome: string;
  revenueImpact?: number;
  createdAt: string;
}

interface OMEGAEvent {
  id: string;
  type: string;
  source: LayerKey;
  target?: LayerKey;
  description: string;
  timestamp: string;
  read: boolean;
}

interface EcosystemNotification {
  id: string;
  layer: LayerKey;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface EcosystemStore {
  // Layer health
  layerHealth: Record<LayerKey, LayerHealth>;
  isLoadingHealth: boolean;
  
  // Agentic Loop
  currentLoopStage: LoopStage;
  loopHistory: AgenticLoop[];
  loopCount: number;
  
  // OMEGA Events
  omegaEvents: OMEGAEvent[];
  latestBriefing: string | null;
  
  // Unified notifications
  notifications: EcosystemNotification[];
  unreadCount: number;
  
  // Actions
  refreshLayerHealth: () => Promise<void>;
  triggerLoop: (trigger: string) => void;
  advanceLoop: (stage: LoopStage) => void;
  dismissNotification: (id: string) => void;
  markEventRead: (id: string) => void;
  setBriefing: (briefing: string) => void;
}

// Default layer health
const defaultLayerHealth: Record<LayerKey, LayerHealth> = {
  core: { status: "live", lastChecked: new Date().toISOString(), metrics: { uptime: 99.9, responseTime: 120 } },
  community: { status: "active", lastChecked: new Date().toISOString(), metrics: { uptime: 99.5, responseTime: 180, activeUsers: 0 } },
  academy: { status: "active", lastChecked: new Date().toISOString(), metrics: { uptime: 99.5, responseTime: 150 } },
  market: { status: "planned", lastChecked: new Date().toISOString() },
  intelligence: { status: "active", lastChecked: new Date().toISOString(), metrics: { uptime: 99.8, responseTime: 200 } },
  work: { status: "planned", lastChecked: new Date().toISOString() },
  cloud: { status: "planned", lastChecked: new Date().toISOString() },
  "ai-platform": { status: "building", lastChecked: new Date().toISOString() },
};

export const useEcosystemStore = create<EcosystemStore>((set, get) => ({
  // Initial state
  layerHealth: defaultLayerHealth,
  isLoadingHealth: false,
  currentLoopStage: null,
  loopHistory: [],
  loopCount: 0,
  omegaEvents: [],
  latestBriefing: null,
  notifications: [],
  unreadCount: 0,
  
  // Actions
  refreshLayerHealth: async () => {
    set({ isLoadingHealth: true });
    
    try {
      const client = getWinnersClient();
      const { data: healthData } = await client.health();
      const { data: registryData } = await client.registry();
      
      const updatedHealth = { ...defaultLayerHealth };
      
      if (healthData) {
        // Map global health to core
        updatedHealth.core = {
          status: healthData.status === "ready" ? "live" : "active",
          lastChecked: new Date().toISOString(),
          metrics: { uptime: 99.9, responseTime: 120 }
        };
      }

      if (registryData) {
        // Use registry data to update counts or status
        // For now just refresh the timestamp
        Object.keys(updatedHealth).forEach(key => {
          updatedHealth[key as LayerKey].lastChecked = new Date().toISOString();
        });
      }
      
      set({ layerHealth: updatedHealth, isLoadingHealth: false });
    } catch (error) {
      console.error("Failed to refresh layer health:", error);
      set({ isLoadingHealth: false });
    }
  },
  
  triggerLoop: (trigger: string) => {
    const { currentLoopStage, loopCount } = get();
    
    const newLoop: AgenticLoop = {
      id: `loop_${Date.now()}`,
      userId: "", // Would be filled from auth
      trigger,
      steps: [currentLoopStage || "start", "community", "academy", "work", "market"],
      outcome: "in_progress",
      createdAt: new Date().toISOString(),
    };
    
    // Default first stage based on trigger
    let firstStage: LoopStage = "community";
    if (trigger.includes("skill")) firstStage = "academy";
    if (trigger.includes("certificate")) firstStage = "work";
    if (trigger.includes("contract")) firstStage = "market";
    
    set(state => ({
      loopHistory: [newLoop, ...state.loopHistory].slice(0, 10),
      currentLoopStage: firstStage,
      loopCount: loopCount + 1,
    }));
  },
  
  advanceLoop: (stage: LoopStage) => {
    set({ currentLoopStage: stage });
  },
  
  dismissNotification: (id: string) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },
  
  markEventRead: (id: string) => {
    set(state => ({
      omegaEvents: state.omegaEvents.map(e => 
        e.id === id ? { ...e, read: true } : e
      ),
    }));
  },
  
  setBriefing: (briefing: string) => {
    set({ latestBriefing: briefing });
  },
}));

// Helper hook to get the assistant for a given route
export function getAssistantForRoute(pathname: string): "aria" | "nova" | "sage" | "atlas" | "circuit" | "forge" | "nexus" | "herald" | "omega" {
  if (pathname.includes("/intelligence/omega")) return "omega";
  if (pathname.includes("/intelligence")) return "forge";
  if (pathname.includes("/community")) return "nova";
  if (pathname.includes("/academy")) return "sage";
  if (pathname.includes("/market")) return "atlas";
  if (pathname.includes("/work")) return "circuit";
  if (pathname.includes("/cloud")) return "nexus";
  if (pathname.includes("/ai-platform")) return "herald";
  return "aria"; // Default to ARIA for dashboard
}

// Helper hook to get the page name from route
export function getPageFromRoute(pathname: string): string {
  if (pathname.includes("/dashboard")) return "dashboard";
  if (pathname.includes("/community")) return "community";
  if (pathname.includes("/academy")) return "academy";
  if (pathname.includes("/market")) return "market";
  if (pathname.includes("/work")) return "work";
  if (pathname.includes("/intelligence")) return "intelligence";
  return "dashboard";
}
