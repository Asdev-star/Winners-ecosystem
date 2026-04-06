// Level V - Named Supervisor Deployment
// Hook: useLoopTracking
// Tracks Agentic Loop progression, revenue impact, and stage analytics
// Used by: LoopStageIndicator, AgenticLoopWidget, OmegaDashboard

import { useCallback, useMemo, useState } from "react";
import { useAgenticLoopStore, type LoopStage } from "../stores/agenticLoopStore";
import { useAuthStore } from "../features/auth/authStore";

export interface LoopTrackingStats {
  currentStage: LoopStage;
  stageProgress: number;
  completedStages: LoopStage[];
  remainingStages: LoopStage[];
  totalLoops: number;
  totalRevenueImpact: number;
  averageLoopDuration: number;
  loopVelocity: "fast" | "normal" | "slow" | "stalled";
  daysSinceStart: number | null;
  estimatedCompletion: string | null;
}

export interface StageStatus {
  stage: LoopStage;
  label: string;
  layer: string;
  status: "completed" | "active" | "pending";
  completedAt?: string;
}

const STAGE_ORDER: LoopStage[] = [
  "community",
  "academy",
  "work",
  "market",
  "intelligence",
];

const STAGE_META: Record<string, { label: string; layer: string }> = {
  community:    { label: "Build Network",     layer: "Community" },
  academy:      { label: "Certify Skills",    layer: "Academy" },
  work:         { label: "Win Contracts",     layer: "Work" },
  market:       { label: "Generate Revenue",  layer: "Market" },
  intelligence: { label: "Optimise & Scale",  layer: "Intelligence" },
};

function msToReadableDuration(ms: number): string {
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days < 1) return "< 1 day";
  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "1 week" : `${weeks} weeks`;
}

export function useLoopTracking() {
  const {
    currentLoop,
    currentStage,
    stageProgress,
    loopHistory,
    celebrations,
    startLoop,
    advanceStage,
    completeStep,
    completeLoop,
    addCelebration,
    dismissCelebration,
    clearPendingCelebration,
    pendingCelebration,
  } = useAgenticLoopStore();

  const userId = useAuthStore((s) => s.user?.id);

  const currentStageIndex = STAGE_ORDER.indexOf(currentStage as LoopStage);

  const completedStages: LoopStage[] = useMemo(
    () =>
      STAGE_ORDER.filter((_, i) =>
        currentStageIndex >= 0 ? i < currentStageIndex : false
      ),
    [currentStageIndex]
  );

  const remainingStages: LoopStage[] = useMemo(
    () =>
      STAGE_ORDER.filter((_, i) =>
        currentStageIndex >= 0 ? i > currentStageIndex : true
      ),
    [currentStageIndex]
  );

  const totalRevenueImpact = useMemo(
    () => loopHistory.reduce((sum, l) => sum + (l.revenueImpact ?? 0), 0),
    [loopHistory]
  );

  const averageLoopDuration = useMemo(() => {
    const finished = loopHistory.filter((l) => l.completedAt);
    if (!finished.length) return 0;
    const total = finished.reduce((sum, l) => {
      const start = new Date(l.startedAt).getTime();
      const end = new Date(l.completedAt!).getTime();
      return sum + (end - start);
    }, 0);
    return Math.round(total / finished.length);
  }, [loopHistory]);

  const [now] = useState(() => Date.now());

  const loopVelocity: LoopTrackingStats["loopVelocity"] = useMemo(() => {
    if (!currentLoop) return "stalled";
    const started = new Date(currentLoop.startedAt).getTime();
    const daysSinceStart = (now - started) / (1000 * 60 * 60 * 24);
    const stagesCompleted = completedStages.length;
    if (stagesCompleted === 0 && daysSinceStart > 7) return "stalled";
    const stagesPerDay = stagesCompleted / Math.max(daysSinceStart, 1);
    if (stagesPerDay >= 0.5) return "fast";
    if (stagesPerDay >= 0.2) return "normal";
    return "slow";
  }, [currentLoop, completedStages, now]);

  const daysSinceStart = useMemo(() => {
    if (!currentLoop) return null;
    const started = new Date(currentLoop.startedAt).getTime();
    return Math.floor((now - started) / (1000 * 60 * 60 * 24));
  }, [currentLoop, now]);

  const estimatedCompletion = useMemo(() => {
    if (!currentLoop || remainingStages.length === 0) return null;
    if (loopVelocity === "stalled") return "Needs action";
    const velocityDaysPerStage: Record<string, number> = {
      fast: 2,
      normal: 5,
      slow: 10,
    };
    const daysPerStage = velocityDaysPerStage[loopVelocity] ?? 5;
    const target = new Date(
      now + remainingStages.length * daysPerStage * 24 * 60 * 60 * 1000
    );
    return target.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  }, [currentLoop, remainingStages, loopVelocity, now]);

  const allStageStatuses: StageStatus[] = useMemo(
    () =>
      STAGE_ORDER.map((stage, i) => {
        const meta = STAGE_META[stage as string];
        let status: StageStatus["status"] = "pending";
        if (i < currentStageIndex) status = "completed";
        else if (i === currentStageIndex) status = "active";
        const historyStep = currentLoop?.steps.find(
          (s) => s.layer.toLowerCase() === meta.layer.toLowerCase()
        );
        return {
          stage,
          label: meta.label,
          layer: meta.layer,
          status,
          completedAt: historyStep?.completedAt,
        };
      }),
    [currentStageIndex, currentLoop]
  );

  const advanceToNextStage = useCallback(() => {
    if (currentStageIndex < STAGE_ORDER.length - 1) {
      advanceStage(STAGE_ORDER[currentStageIndex + 1]);
    } else {
      completeLoop("All stages completed", undefined);
    }
  }, [currentStageIndex, advanceStage, completeLoop]);

  const initLoop = useCallback(
    (trigger: string = "manual") => startLoop(trigger),
    [startLoop]
  );

  const markStepDone = useCallback(
    (stepId: string) => completeStep(stepId),
    [completeStep]
  );

  const stats: LoopTrackingStats = {
    currentStage,
    stageProgress,
    completedStages,
    remainingStages,
    totalLoops: loopHistory.length,
    totalRevenueImpact,
    averageLoopDuration,
    loopVelocity,
    daysSinceStart,
    estimatedCompletion,
  };

  return {
    currentLoop,
    stats,
    allStageStatuses,
    pendingCelebration,
    celebrations,
    userId,
    stageOrder: STAGE_ORDER,
    stageMeta: STAGE_META,
    averageLoopDurationReadable: msToReadableDuration(averageLoopDuration),
    initLoop,
    advanceToNextStage,
    advanceStage,
    markStepDone,
    addCelebration,
    dismissCelebration,
    clearPendingCelebration,
  };
}
