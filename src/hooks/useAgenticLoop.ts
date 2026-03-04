// Level IV - Reactive Ecosystem State
// Hook: useAgenticLoop
// Surfaces the next recommended action for the user based on their position in the loop

import { useEffect, useMemo } from "react";
import { useAgenticLoopStore, type LoopStage } from "../stores/agenticLoopStore";

// Stage to action mapping
const STAGE_ACTIONS: Record<string, {
  label: string;
  description: string;
  urgency: "high" | "medium" | "low";
  actionUrl?: string;
}> = {
  community: {
    label: "Share your skills in the Community",
    description: "Post about what you're building to help NOVA detect your skills.",
    urgency: "high",
    actionUrl: "/community",
  },
  academy: {
    label: "Complete your learning path",
    description: "SAGE has personalized courses based on your community activity.",
    urgency: "high",
    actionUrl: "/academy",
  },
  work: {
    label: "Apply to matching jobs",
    description: "CIRCUIT found opportunities matching your Academy certificates.",
    urgency: "high",
    actionUrl: "/work",
  },
  market: {
    label: "Launch your first product",
    description: "Your Work success qualifies you for vendor onboarding.",
    urgency: "medium",
    actionUrl: "/market",
  },
  intelligence: {
    label: "Explore AI capabilities",
    description: "Your ecosystem activity unlocks new AI features.",
    urgency: "low",
    actionUrl: "/intelligence",
  },
  completed: {
    label: "Keep growing your ecosystem",
    description: "You're doing great! Continue engaging across all layers.",
    urgency: "low",
  },
};

interface UseAgenticLoopReturn {
  currentStage: LoopStage;
  nextAction: {
    label: string;
    description: string;
    urgency: "high" | "medium" | "low";
    actionUrl?: string;
  } | null;
  loopCount: number;
  stageProgress: number;
  isActive: boolean;
  currentLoop: unknown | null;
  steps: Array<{
    id: string;
    name: string;
    description: string;
    status: "pending" | "active" | "completed" | "skipped";
    layer: string;
  }>;
}

export function useAgenticLoop(): UseAgenticLoopReturn {
  const store = useAgenticLoopStore();

  // Get current stage from the store
  const currentStage = store.currentStage;
  
  // Get loop count from history
  const loopCount = store.loopHistory?.length || 0;
  
  // Get stage progress
  const stageProgress = store.stageProgress || 0;

  // Get current loop steps
  const steps = useMemo(() => {
    if (store.currentLoop?.steps) {
      return store.currentLoop.steps.map((step) => ({
        id: step.id,
        name: step.name,
        description: step.description,
        status: step.status,
        layer: step.layer,
      }));
    }
    return [];
  }, [store.currentLoop]);

  // Get next action based on current stage
  const nextAction = useMemo(() => {
    if (!currentStage) {
      // If no current stage, recommend starting with community
      return {
        label: "Start your journey",
        description: "Begin by connecting with the Winners Community.",
        urgency: "high" as const,
        actionUrl: "/community",
      };
    }

    const stageAction = STAGE_ACTIONS[currentStage];
    if (stageAction) {
      return stageAction;
    }

    return null;
  }, [currentStage]);

  // Check if there's an active loop
  const isActive = useMemo(() => {
    return store.currentLoop !== null && currentStage !== null && currentStage !== "completed";
  }, [store.currentLoop, currentStage]);

  return {
    currentStage,
    nextAction,
    loopCount,
    stageProgress,
    isActive,
    currentLoop: store.currentLoop,
    steps,
  };
}

// Hook specifically for checking if a user should see a cross-layer prompt
export function useCrossLayerPrompt(sourceLayer: string, targetLayer: string): {
  shouldShow: boolean;
  prompt: {
    title: string;
    description: string;
    actionLabel: string;
    actionUrl: string;
  } | null;
} {
  const store = useAgenticLoopStore();

  const shouldShow = useMemo(() => {
    // Check if current loop is at a relevant stage
    if (!store.currentLoop?.steps) return false;
    
    // Check if there are completed steps from the source layer
    const completedSteps = store.currentLoop.steps.filter(
      (s) => s.status === "completed" && s.layer.toLowerCase() === sourceLayer
    );
    
    // Check if target layer steps exist and are pending
    const targetSteps = store.currentLoop.steps.filter(
      (s) => s.layer.toLowerCase() === targetLayer && s.status === "pending"
    );
    
    return completedSteps.length > 0 && targetSteps.length > 0;
  }, [store.currentLoop, sourceLayer, targetLayer]);

  const prompt = useMemo(() => {
    if (!shouldShow) return null;

    const prompts: Record<string, { title: string; description: string; actionLabel: string; actionUrl: string }> = {
      "community-academy": {
        title: "Skills detected in Community",
        description: "NOVA identified skills that match Academy courses. SAGE has personalized recommendations.",
        actionLabel: "View Courses",
        actionUrl: "/academy",
      },
      "academy-work": {
        title: "Certificate earned!",
        description: "Your Academy certificate unlocks new Work opportunities. CIRCUIT has matching jobs.",
        actionLabel: "View Jobs",
        actionUrl: "/work",
      },
      "work-market": {
        title: "Ready for vendor onboarding",
        description: "Your Work success qualifies you to sell on the Market. ATLAS has product ideas.",
        actionLabel: "Start Selling",
        actionUrl: "/market",
      },
    };

    const key = `${sourceLayer}-${targetLayer}`;
    return prompts[key] || null;
  }, [shouldShow, sourceLayer, targetLayer]);

  return { shouldShow, prompt };
}
