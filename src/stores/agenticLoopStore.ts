// Phase 5 - Intelligence Layer
// Store: agenticLoopStore
// Manages the Agentic Loop state and celebration sequences

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { typedFetch } from "../lib/typedFetch";

// Loop stage types
export type LoopStage = 
  | "community" 
  | "academy" 
  | "work" 
  | "market" 
  | "intelligence" 
  | "completed"
  | null;

// Loop step
export interface LoopStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "active" | "completed" | "skipped";
  completedAt?: string;
  layer: string;
}

// Loop instance
export interface AgenticLoopInstance {
  id: string;
  userId: string;
  trigger: string;
  currentStage: LoopStage;
  steps: LoopStep[];
  outcome?: string;
  revenueImpact?: number;
  startedAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

// Celebration event
export interface CelebrationEvent {
  id: string;
  type: "stage_complete" | "loop_complete" | "milestone" | "achievement";
  title: string;
  message: string;
  layer: string;
  timestamp: string;
  dismissed: boolean;
}

// Default loop steps
const getDefaultSteps = (): LoopStep[] => [
  {
    id: "1",
    name: "Join Community",
    description: "Create your profile and introduce yourself",
    status: "pending",
    layer: "Community"
  },
  {
    id: "2",
    name: "Get Skill Detected",
    description: "Post content that showcases your skills",
    status: "pending",
    layer: "Community"
  },
  {
    id: "3",
    name: "Enroll in Academy",
    description: "Take a course to certify your skills",
    status: "pending",
    layer: "Academy"
  },
  {
    id: "4",
    name: "Complete Course",
    description: "Finish your first course and earn a certificate",
    status: "pending",
    layer: "Academy"
  },
  {
    id: "5",
    name: "Get Work Match",
    description: "Apply to jobs that match your certified skills",
    status: "pending",
    layer: "Work"
  },
  {
    id: "6",
    name: "Win Contract",
    description: "Secure your first paid contract",
    status: "pending",
    layer: "Work"
  },
  {
    id: "7",
    name: "Start Selling",
    description: "List your products or services in the Market",
    status: "pending",
    layer: "Market"
  },
  {
    id: "8",
    name: "Earn Revenue",
    description: "Make your first sale through the ecosystem",
    status: "pending",
    layer: "Market"
  }
];

export interface AgenticLoopStore {
  // Current loop
  currentLoop: AgenticLoopInstance | null;
  loopHistory: AgenticLoopInstance[];
  
  // Stage progress
  currentStage: LoopStage;
  stageProgress: number; // 0-100
  
  // Celebrations
  celebrations: CelebrationEvent[];
  pendingCelebration: CelebrationEvent | null;
  
  // Actions
  startLoop: (trigger: string) => void;
  advanceStage: (stage: LoopStage) => void;
  completeStep: (stepId: string) => void;
  completeLoop: (outcome: string, revenueImpact?: number) => void;
  
  // Celebration management
  addCelebration: (celebration: Omit<CelebrationEvent, "id" | "timestamp" | "dismissed">) => void;
  dismissCelebration: (id: string) => void;
  clearPendingCelebration: () => void;
  
  // History
  loadHistory: () => Promise<void>;
  reset: () => void;
}

interface AgenticLoopHistoryResponse {
  loops?: AgenticLoopInstance[];
}

export const useAgenticLoopStore = create<AgenticLoopStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentLoop: null,
      loopHistory: [],
      currentStage: null,
      stageProgress: 0,
      celebrations: [],
      pendingCelebration: null,

      // Start a new loop
      startLoop: (trigger) => {
        const newLoop: AgenticLoopInstance = {
          id: crypto.randomUUID(),
          userId: "", // Will be set from auth
          trigger,
          currentStage: "community",
          steps: getDefaultSteps().map((step, index) => ({
            ...step,
            status: index === 0 ? "active" : "pending"
          })),
          startedAt: new Date().toISOString()
        };

        set({
          currentLoop: newLoop,
          currentStage: "community",
          stageProgress: 12.5 // 100 / 8 steps
        });

        // Add celebration for starting
        get().addCelebration({
          type: "stage_complete",
          title: "Loop Started!",
          message: `Your journey begins. ${getDefaultSteps()[0].description}`,
          layer: "Community"
        });
      },

      // Advance to next stage
      advanceStage: (stage) => {
        const { currentLoop } = get();
        if (!currentLoop) return;

        const stageOrder: LoopStage[] = ["community", "academy", "work", "market", "intelligence", "completed"];
        const currentIndex = stageOrder.indexOf(currentLoop.currentStage);
        const newIndex = stageOrder.indexOf(stage);
        
        // Mark current step as completed
        if (currentLoop.steps[currentIndex]) {
          currentLoop.steps[currentIndex].status = "completed";
          currentLoop.steps[currentIndex].completedAt = new Date().toISOString();
        }

        // Set next step as active
        if (currentLoop.steps[newIndex]) {
          currentLoop.steps[newIndex].status = "active";
        }

        const newProgress = ((newIndex + 1) / stageOrder.length) * 100;

        set({
          currentLoop: {
            ...currentLoop,
            currentStage: stage,
            steps: currentLoop.steps
          },
          currentStage: stage,
          stageProgress: newProgress
        });

        // Add celebration
        const layerNames: Record<string, string> = {
          community: "Community",
          academy: "Academy",
          work: "Work",
          market: "Market",
          intelligence: "Intelligence"
        };

        if (stage) {
          get().addCelebration({
            type: "stage_complete",
            title: `${layerNames[stage]} Stage Unlocked!`,
            message: `You've advanced to the ${layerNames[stage]} layer.`,
            layer: layerNames[stage]
          });
        }
      },

      // Complete a specific step
      completeStep: (stepId) => {
        const { currentLoop } = get();
        if (!currentLoop) return;

        const steps = currentLoop.steps.map(step => {
          if (step.id === stepId) {
            return { ...step, status: "completed" as const, completedAt: new Date().toISOString() };
          }
          return step;
        });

        // Find next pending step and make it active
        const nextPending = steps.find(s => s.status === "pending");
        if (nextPending) {
          nextPending.status = "active";
        }

        set({
          currentLoop: { ...currentLoop, steps }
        });
      },

      // Complete the entire loop
      completeLoop: (outcome, revenueImpact) => {
        const { currentLoop } = get();
        if (!currentLoop) return;

        const completedLoop: AgenticLoopInstance = {
          ...currentLoop,
          currentStage: "completed",
          outcome,
          revenueImpact,
          completedAt: new Date().toISOString(),
          steps: currentLoop.steps.map(step => ({
            ...step,
            status: "completed" as const,
            completedAt: step.completedAt || new Date().toISOString()
          }))
        };

        set(state => ({
          currentLoop: null,
          loopHistory: [...state.loopHistory, completedLoop],
          currentStage: null,
          stageProgress: 0
        }));

        // Add celebration for completion
        get().addCelebration({
          type: "loop_complete",
          title: "Loop Complete! 🎉",
          message: outcome || "You've completed your first Agentic Loop!",
          layer: "All"
        });
      },

      // Add a celebration event
      addCelebration: (celebration) => {
        const newCelebration: CelebrationEvent = {
          ...celebration,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          dismissed: false
        };

        set(state => ({
          celebrations: [newCelebration, ...state.celebrations].slice(0, 50),
          pendingCelebration: newCelebration
        }));
      },

      // Dismiss a celebration
      dismissCelebration: (id) => {
        set(state => ({
          celebrations: state.celebrations.map(c => 
            c.id === id ? { ...c, dismissed: true } : c
          ),
          pendingCelebration: state.pendingCelebration?.id === id 
            ? null 
            : state.pendingCelebration
        }));
      },

      // Clear pending celebration (after viewing)
      clearPendingCelebration: () => {
        set({ pendingCelebration: null });
      },

      // Load loop history from server
      loadHistory: async () => {
        try {
          const data = await typedFetch<AgenticLoopHistoryResponse>("/api/v1/agentic-loop/history");
          set({ loopHistory: data.loops || [] });
        } catch (error: unknown) {
          console.error("Failed to load loop history:", error);
        }
      },

      // Reset store
      reset: () => {
        set({
          currentLoop: null,
          loopHistory: [],
          currentStage: null,
          stageProgress: 0,
          celebrations: [],
          pendingCelebration: null
        });
      }
    }),
    {
      name: "winners-agentic-loop",
      partialize: (state) => ({
        currentLoop: state.currentLoop,
        currentStage: state.currentStage,
        stageProgress: state.stageProgress
      })
    }
  )
);

// Hook for checking if a stage is completed
export function useStageComplete(stage: LoopStage): boolean {
  const currentStage = useAgenticLoopStore((s) => s.currentStage);
  const stageOrder = ["community", "academy", "work", "market", "intelligence"];
  const currentIndex = stageOrder.indexOf(currentStage || "");
  const targetIndex = stageOrder.indexOf(stage || "");
  return targetIndex < currentIndex;
}

// Hook for getting celebration count
export function useCelebrationCount(): number {
  return useAgenticLoopStore((s) => 
    s.celebrations.filter(c => !c.dismissed).length
  );
}
