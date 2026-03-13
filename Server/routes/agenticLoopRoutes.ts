// Phase 5 — Winners Intelligence — agenticLoopRoutes.ts
// Agentic Loop event trigger + status + history system

import { NextFunction, Request, Response, Router } from "express";
import db from "../db.js";
import { callAnthropicAndParseJson } from "../services/aiService.js";
import { notifyUser } from "../services/wsService.js";

const router = Router();
const prisma = db;

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const STAGE_ORDER = ["community", "academy", "work", "market", "intelligence"];

function getNextStage(current: string): string {
  const idx = STAGE_ORDER.indexOf(current);
  return STAGE_ORDER[idx + 1] ?? "done";
}

async function determineNextAction(
  userId: string,
  triggerType: string,
  layer: string,
  data: Record<string, unknown>
): Promise<{ action: string; supervisor: string; description: string }> {
  const prompt = `You are OMEGA, the Winners Ecosystem Agentic Loop engine.
A user just triggered: ${triggerType} in the ${layer} layer.
Data: ${JSON.stringify(data).substring(0, 300)}

Determine the single best next action across all layers to advance the user.
Return JSON only:
{
  "action": "recommend_course | match_job | open_vendor | send_briefing | award_certificate",
  "supervisor": "nova | sage | circuit | atlas | omega",
  "description": "one sentence explaining the next step"
}`;
  const fallback = {
    action: "send_briefing",
    supervisor: "omega",
    description: "OMEGA is reviewing your progress and will surface the next opportunity.",
  };
  return callAnthropicAndParseJson(prompt, { model: "claude-sonnet-4-6", max_tokens: 200 }, fallback);
}

// POST /agentic/trigger
// Called by any layer when a significant event occurs
router.post("/trigger", async (req: Request, res: Response) => {
  try {
    const { userId, tenantId, triggerType, layer, data } = req.body;
    if (!userId || !tenantId || !triggerType || !layer) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find or create active loop
    let loop = await prisma.agenticLoop.findFirst({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
    });

    const steps = (loop?.steps as unknown[]) ?? [];
    const currentStage = loop?.currentStep
      ? STAGE_ORDER[Math.min(loop.currentStep, STAGE_ORDER.length - 1)]
      : layer;

    // Determine next action via OMEGA
    const nextAction = await determineNextAction(userId, triggerType, layer, data ?? {});

    const newStep = {
      step: steps.length + 1,
      supervisor: nextAction.supervisor,
      action: nextAction.action,
      description: nextAction.description,
      layer,
      triggerType,
      timestamp: new Date().toISOString(),
    };

    if (loop) {
      const nextStageIndex = Math.min(
        (STAGE_ORDER.indexOf(layer) || 0) + 1,
        STAGE_ORDER.length - 1
      );
      loop = await prisma.agenticLoop.update({
        where: { id: loop.id },
        data: {
          steps: [...steps, newStep],
          currentStep: nextStageIndex,
          updatedAt: new Date(),
        },
      });
    } else {
      loop = await prisma.agenticLoop.create({
        data: {
          userId,
          tenantId,
          loopType: "skill_detection",
          trigger: triggerType,
          currentStep: 1,
          steps: [newStep],
          status: "active",
        },
      });
    }

    // Emit WebSocket event
    notifyUser(userId, {
      event: "loop:stage_advanced",
      stage: currentStage,
      nextStage: getNextStage(currentStage),
      nextAction,
      loopId: loop.id,
    });

    // Store in AssistantMemory for OMEGA
    await prisma.assistantMemory.upsert({
      where: { userId_assistant_memoryType: { userId, assistant: "omega", memoryType: "journey" } },
      update: {
        content: `Last loop event: ${triggerType} in ${layer}. Step ${steps.length + 1}. Next: ${nextAction.description}`,
        updatedAt: new Date(),
      },
      create: {
        userId,
        tenantId,
        assistant: "omega",
        memoryType: "journey",
        content: `Last loop event: ${triggerType} in ${layer}. Step ${steps.length + 1}. Next: ${nextAction.description}`,
      },
    });

    res.json({ success: true, loopId: loop.id, nextAction, currentStage });
  } catch (error) {
    console.error("[agenticLoop/trigger]", error);
    res.status(500).json({ error: "Failed to process trigger" });
  }
});

// GET /agentic/loop/:userId — current loop state
router.get("/loop/:userId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const loop = await prisma.agenticLoop.findFirst({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
    });

    if (!loop) {
      return res.json({
        active: false,
        stage: "community",
        stageIndex: 0,
        steps: [],
        loopCount: 0,
      });
    }

    const completedLoops = await prisma.agenticLoop.count({
      where: { userId, status: "completed" },
    });

    const stageIndex = Math.min(loop.currentStep, STAGE_ORDER.length - 1);
    const stage = STAGE_ORDER[stageIndex];
    const steps = (loop.steps as unknown[]) ?? [];
    const daysSinceStart = Math.floor(
      (Date.now() - new Date(loop.createdAt).getTime()) / 86400000
    );

    res.json({
      active: true,
      loopId: loop.id,
      stage,
      stageIndex,
      steps,
      loopCount: completedLoops,
      daysSinceStart,
      revenueImpact: loop.revenueImpact ?? 0,
      nextMilestone: getNextStage(stage),
    });
  } catch (error) {
    console.error("[agenticLoop/loop]", error);
    res.status(500).json({ error: "Failed to get loop state" });
  }
});

// GET /agentic/history/:userId — all loops, paginated
router.get("/history/:userId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;

    const [loops, total] = await Promise.all([
      prisma.agenticLoop.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.agenticLoop.count({ where: { userId } }),
    ]);

    res.json({
      loops: loops.map((l) => ({
        ...l,
        stepsCount: (l.steps as unknown[])?.length ?? 0,
        stageName: STAGE_ORDER[Math.min(l.currentStep, STAGE_ORDER.length - 1)],
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[agenticLoop/history]", error);
    res.status(500).json({ error: "Failed to get loop history" });
  }
});

// POST /agentic/loop/complete — mark active loop complete
router.post("/loop/complete", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { revenueImpact } = req.body;

    const loop = await prisma.agenticLoop.findFirst({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
    });

    if (!loop) return res.status(404).json({ error: "No active loop found" });

    await prisma.agenticLoop.update({
      where: { id: loop.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        revenueImpact: revenueImpact ?? 0,
      },
    });

    const loopCount = await prisma.agenticLoop.count({ where: { userId, status: "completed" } });

    notifyUser(userId, {
      event: "loop:completed",
      loopNumber: loopCount,
      revenueImpact: revenueImpact ?? 0,
    });

    res.json({ success: true, loopNumber: loopCount });
  } catch (error) {
    console.error("[agenticLoop/complete]", error);
    res.status(500).json({ error: "Failed to complete loop" });
  }
});

// GET /agentic/actions/:userId — pending autonomous actions
router.get("/actions/:userId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const tenantId = req.user!.tenantId;

    const actions = await prisma.assistantAction.findMany({
      where: { targetUserId: userId, tenantId, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    res.json({ actions });
  } catch (error) {
    console.error("[agenticLoop/actions]", error);
    res.status(500).json({ error: "Failed to get actions" });
  }
});

// PATCH /agentic/actions/:id/approve
router.patch("/actions/:id/approve", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const action = await prisma.assistantAction.update({
      where: { id },
      data: { status: "approved", approved: true, executedAt: new Date() },
    });
    res.json({ success: true, action });
  } catch (error) {
    console.error("[agenticLoop/approve]", error);
    res.status(500).json({ error: "Failed to approve action" });
  }
});

// PATCH /agentic/actions/:id/reject
router.patch("/actions/:id/reject", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const action = await prisma.assistantAction.update({
      where: { id },
      data: { status: "rejected" },
    });
    res.json({ success: true, action });
  } catch (error) {
    console.error("[agenticLoop/reject]", error);
    res.status(500).json({ error: "Failed to reject action" });
  }
});

// POST /agentic/propose — OMEGA proposes an autonomous action
router.post("/propose", requireAuth, async (req: Request, res: Response) => {
  try {
    const { targetUserId, actionType, description, payload, targetLayer } = req.body;
    const tenantId = req.user!.tenantId;

    const pendingCount = await prisma.assistantAction.count({
      where: { targetUserId, tenantId, status: "pending" },
    });

    if (pendingCount >= 3) {
      return res.status(429).json({ error: "Max 3 pending proposals per user" });
    }

    const action = await prisma.assistantAction.create({
      data: {
        tenantId,
        assistant: "omega",
        actionType: actionType ?? "recommend",
        targetUserId,
        targetLayer,
        description,
        payload,
        status: "pending",
      },
    });

    notifyUser(targetUserId, {
      event: "omega:action_proposed",
      actionId: action.id,
      description,
      actionType,
    });

    res.json({ success: true, action });
  } catch (error) {
    console.error("[agenticLoop/propose]", error);
    res.status(500).json({ error: "Failed to propose action" });
  }
});

export default router;
