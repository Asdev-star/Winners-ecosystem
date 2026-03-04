// Phase 5 - Intelligence Layer
// Store: assistantStore
// Manages AI assistant state across all 9 supervisors

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Supervisor types
export type SupervisorName = "OMEGA" | "ARIA" | "NOVA" | "SAGE" | "ATLAS" | "FORGE" | "CIRCUIT" | "NEXUS" | "HERALD";

// Supervisor configurations
export const SUPERVISOR_CONFIG: Record<SupervisorName, {
  name: string;
  emoji: string;
  color: string;
  description: string;
  layer: string;
  personality: string;
}> = {
  OMEGA: {
    name: "OMEGA",
    emoji: "🧠",
    color: "#C9A84C",
    description: "Master Orchestrator — Cross-layer intelligence",
    layer: "Orchestrator",
    personality: "Strategic, visionary, sees all patterns"
  },
  ARIA: {
    name: "ARIA",
    emoji: "⬡",
    color: "#2B5F8E",
    description: "Core Engine — Dashboard insights & billing",
    layer: "Core Engine",
    personality: "Calm, precise, organised"
  },
  NOVA: {
    name: "NOVA",
    emoji: "👥",
    color: "#89C4E1",
    description: "Community — Content & creator intelligence",
    layer: "Community",
    personality: "Warm, trend-aware, creative"
  },
  SAGE: {
    name: "SAGE",
    emoji: "🎓",
    color: "#2DD4A0",
    description: "Academy — Course tutoring & skill guidance",
    layer: "Academy",
    personality: "Patient, knowledgeable, encouraging"
  },
  ATLAS: {
    name: "ATLAS",
    emoji: "🛒",
    color: "#E05A4E",
    description: "Market — Product research & vendor intelligence",
    layer: "Market",
    personality: "Analytical, commercial, data-driven"
  },
  FORGE: {
    name: "FORGE",
    emoji: "🤖",
    color: "#9B6FFF",
    description: "Intelligence — Model routing & AI orchestration",
    layer: "Intelligence",
    personality: "Technical, precise, performance-focused"
  },
  CIRCUIT: {
    name: "CIRCUIT",
    emoji: "💼",
    color: "#C9A84C",
    description: "Work — Job matching & proposal assistance",
    layer: "Work",
    personality: "Professional, tactical, results-oriented"
  },
  NEXUS: {
    name: "NEXUS",
    emoji: "☁️",
    color: "#89C4E1",
    description: "Cloud — API guidance & integration support",
    layer: "Cloud",
    personality: "Developer-focused, documentation-expert"
  },
  HERALD: {
    name: "HERALD",
    emoji: "🧬",
    color: "#9B6FFF",
    description: "AI Platform — Ollama management & benchmarking",
    layer: "AI Platform",
    personality: "Technical, infrastructure-focused"
  }
};

// Conversation message
export interface AssistantMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  provider?: string;
  model?: string;
  tokensUsed?: number;
  files?: Array<{
    name: string;
    type: string;
    url?: string;
  }>;
}

// Assistant memory item
export interface AssistantMemory {
  id: string;
  type: "preference" | "fact" | "skill" | "goal";
  content: string;
  confidence: number;
  createdAt: string;
}

interface AssistantStore {
  // Current supervisor
  currentSupervisor: SupervisorName;
  setSupervisor: (supervisor: SupervisorName) => void;

  // Conversation state
  messages: AssistantMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  addMessage: (message: Omit<AssistantMessage, "id" | "timestamp">) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;

  // Memory
  memories: AssistantMemory[];
  setMemories: (memories: AssistantMemory[]) => void;
  addMemory: (memory: AssistantMemory) => void;

  // Context
  context: Record<string, unknown>;
  setContext: (context: Record<string, unknown>) => void;
  updateContext: (updates: Record<string, unknown>) => void;

  // Settings
  model: string;
  setModel: (model: string) => void;
  temperature: number;
  setTemperature: (temperature: number) => void;
}

// Default context for each supervisor
const getDefaultContext = (supervisor: SupervisorName): Record<string, unknown> => {
  const baseContext = {
    userId: null,
    tenantId: null,
    timestamp: new Date().toISOString()
  };

  switch (supervisor) {
    case "NOVA":
      return { ...baseContext, feedMode: "for-you", detectedSkills: [], trendingTopics: [] };
    case "SAGE":
      return { ...baseContext, currentCourse: null, learningGoals: [], completedLessons: [] };
    case "ATLAS":
      return { ...baseContext, vendorMode: false, productNiche: null, competitors: [] };
    case "CIRCUIT":
      return { ...baseContext, currentJob: null, proposals: [], skills: [] };
    default:
      return baseContext;
  }
};

export const useAssistantStore = create<AssistantStore>()(
  persist(
    (set, get) => ({
      // Current supervisor
      currentSupervisor: "ARIA",
      setSupervisor: (supervisor) => set({ 
        currentSupervisor: supervisor,
        context: getDefaultContext(supervisor)
      }),

      // Conversation state
      messages: [],
      isLoading: false,
      isStreaming: false,
      addMessage: (message) => set((state) => ({
        messages: [
          ...state.messages,
          {
            ...message,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString()
          }
        ]
      })),
      clearMessages: () => set({ messages: [] }),
      setLoading: (loading) => set({ isLoading: loading }),
      setStreaming: (streaming) => set({ isStreaming: streaming }),

      // Memory
      memories: [],
      setMemories: (memories) => set({ memories }),
      addMemory: (memory) => set((state) => ({ 
        memories: [...state.memories, memory] 
      })),

      // Context
      context: getDefaultContext("ARIA"),
      setContext: (context) => set({ context }),
      updateContext: (updates) => set((state) => ({
        context: { ...state.context, ...updates }
      })),

      // Settings
      model: "claude",
      setModel: (model) => set({ model }),
      temperature: 0.7,
      setTemperature: (temperature) => set({ temperature })
    }),
    {
      name: "winners-assistant-store",
      partialize: (state) => ({
        currentSupervisor: state.currentSupervisor,
        model: state.model,
        temperature: state.temperature
      })
    }
  )
);

// Hook to get supervisor config
export function useSupervisorConfig(supervisor?: SupervisorName) {
  const current = useAssistantStore((s) => s.currentSupervisor);
  return SUPERVISOR_CONFIG[supervisor || current];
}

// Hook for conversation streaming
export function useAssistantStream() {
  const { addMessage, setLoading, setStreaming } = useAssistantStore();

  const sendMessage = async (
    content: string,
    options?: {
      supervisor?: SupervisorName;
      files?: File[];
      context?: Record<string, unknown>;
    }
  ) => {
    // Add user message
    addMessage({ role: "user", content, files: options?.files?.map(f => ({ name: f.name, type: f.type })) });
    setLoading(true);
    setStreaming(true);

    try {
      const response = await fetch("/api/v1/ai/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          supervisor: options?.supervisor,
          context: options?.context,
          stream: true
        })
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      let assistantMessage = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                assistantMessage += parsed.token;
                // Update the last message incrementally
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Add final assistant message
      addMessage({ 
        role: "assistant", 
        content: assistantMessage,
        provider: "anthropic",
        model: "claude-sonnet-4-6"
      });
    } catch (error) {
      addMessage({ 
        role: "assistant", 
        content: "I apologize, but I encountered an error. Please try again.",
        provider: "error"
      });
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  return { sendMessage };
}
