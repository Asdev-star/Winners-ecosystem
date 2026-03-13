// Phase 5 — Winners Intelligence — agenticLoopService.ts
// Shared fire-and-forget trigger utility for cross-layer Agentic Loop events

interface AgenticTriggerPayload {
  userId: string;
  tenantId: string;
  triggerType:
    | "community_post"
    | "skill_detected"
    | "lesson_completed"
    | "certificate_earned"
    | "job_applied"
    | "contract_won"
    | "product_sold"
    | "course_enrolled";
  layer: "community" | "academy" | "market" | "work" | "intelligence";
  data: Record<string, unknown>;
}

export async function triggerAgenticLoop(payload: AgenticTriggerPayload): Promise<void> {
  setImmediate(async () => {
    try {
      const baseUrl = process.env.SERVER_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;
      await fetch(`${baseUrl}/api/v1/agentic/trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": process.env.INTERNAL_API_KEY ?? "internal",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("[AgenticLoop trigger failed]", err);
    }
  });
}

export async function triggerSkillEvent(payload: {
  userId: string;
  tenantId: string;
  skill: string;
  confidence: number;
  sourceLayer: string;
  sourceId: string;
}): Promise<void> {
  return triggerAgenticLoop({
    userId: payload.userId,
    tenantId: payload.tenantId,
    triggerType: "skill_detected",
    layer: payload.sourceLayer as AgenticTriggerPayload["layer"],
    data: {
      skill: payload.skill,
      confidence: payload.confidence,
      sourceId: payload.sourceId,
    },
  });
}

export default { triggerAgenticLoop, triggerSkillEvent };
