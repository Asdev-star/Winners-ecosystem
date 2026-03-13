// Phase 5 — Winners Intelligence — creditRoutes.ts
// AI Credit management — balance, history, spend, top-up, award

import { NextFunction, Request, Response, Router } from "express";
import db from "../db.js";

const router = Router();
const prisma = db;

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const CREDIT_COSTS: Record<string, number> = {
  "omega_briefing": 0,
  "supervisor_chat": 2,
  "omega_analysis": 10,
  "skill_gap_analysis": 5,
  "path_generation": 5,
  "quiz_generation": 5,
  "autonomous_action": 3,
  "image_generation": 10,
  "voice_transcription": 1,
};

async function getOrCreateBalance(userId: string, tenantId: string) {
  let balance = await prisma.userCreditBalance.findUnique({ where: { userId } });
  if (!balance) {
    balance = await prisma.userCreditBalance.create({
      data: { userId, tenantId, balance: 200, tier: "free" },
    });
    await prisma.aICredit.create({
      data: {
        userId,
        tenantId,
        action: "earned",
        amount: 200,
        balance: 200,
        description: "Welcome credits — free tier",
      },
    });
  }
  return balance;
}

// GET /credits/balance — current balance + tier
router.get("/balance", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const balance = await getOrCreateBalance(userId, tenantId);
    res.json({
      balance: balance.balance,
      tier: balance.tier,
      costs: CREDIT_COSTS,
    });
  } catch (error) {
    console.error("[credits/balance]", error);
    res.status(500).json({ error: "Failed to get balance" });
  }
});

// GET /credits/history — transaction log
router.get("/history", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;

    const [transactions, total] = await Promise.all([
      prisma.aICredit.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aICredit.count({ where: { userId } }),
    ]);

    res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[credits/history]", error);
    res.status(500).json({ error: "Failed to get history" });
  }
});

// POST /credits/spend — deduct credits (internal use + supervisor calls)
router.post("/spend", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { actionType, refId } = req.body;

    const cost = CREDIT_COSTS[actionType] ?? 2;

    if (cost === 0) {
      return res.json({ success: true, cost: 0, message: "Free action" });
    }

    const balance = await getOrCreateBalance(userId, tenantId);

    if (balance.balance < cost) {
      return res.status(402).json({
        error: "Insufficient credits",
        balance: balance.balance,
        required: cost,
        upgradeUrl: "/intelligence/credits",
      });
    }

    const newBalance = balance.balance - cost;

    await prisma.userCreditBalance.update({
      where: { userId },
      data: { balance: newBalance },
    });

    await prisma.aICredit.create({
      data: {
        userId,
        tenantId,
        action: "spent",
        amount: -cost,
        balance: newBalance,
        description: `Used ${cost} credits for ${actionType}`,
        refId,
      },
    });

    res.json({ success: true, cost, newBalance });
  } catch (error) {
    console.error("[credits/spend]", error);
    res.status(500).json({ error: "Failed to spend credits" });
  }
});

// POST /credits/award — admin: award free credits
router.post("/award", requireAuth, async (req: Request, res: Response) => {
  try {
    const { targetUserId, amount, reason } = req.body;
    const tenantId = req.user!.tenantId;

    let balance = await prisma.userCreditBalance.findUnique({
      where: { userId: targetUserId },
    });

    const newBalance = (balance?.balance ?? 0) + amount;

    if (balance) {
      await prisma.userCreditBalance.update({
        where: { userId: targetUserId },
        data: { balance: newBalance },
      });
    } else {
      await prisma.userCreditBalance.create({
        data: { userId: targetUserId, tenantId, balance: newBalance, tier: "free" },
      });
    }

    await prisma.aICredit.create({
      data: {
        userId: targetUserId,
        tenantId,
        action: "awarded",
        amount,
        balance: newBalance,
        description: reason ?? "Admin award",
      },
    });

    res.json({ success: true, newBalance });
  } catch (error) {
    console.error("[credits/award]", error);
    res.status(500).json({ error: "Failed to award credits" });
  }
});

// GET /credits/costs — return cost table
router.get("/costs", (_req: Request, res: Response) => {
  res.json({ costs: CREDIT_COSTS });
});

export default router;
