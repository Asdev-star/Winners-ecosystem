// Phase 5 — Winners Intelligence — aiCreditsMiddleware.ts
// Check AI credit balance before allowing AI calls + deduct after

import { Request, Response, NextFunction } from "express";
import db from "../db.js";

declare module "express-serve-static-core" {
  interface Request {
    aiCreditBalance?: number;
    aiCreditTier?: string;
  }
}

// Credit cost table - determines cost per action + provider
const CREDIT_COSTS: Record<string, number> = {
  'text_ollama':     0,   // FREE — local
  'text_claude':     2,   // 2 credits per call
  'text_gpt4o':      3,
  'image_claude':    1,
  'image_gpt4o':     3,
  'pdf_claude':      2,
  'audio_whisper':   0,   // FREE — local
  'audio_gpt4o':     3,
  'video_gemini':    5,
  'image_gen_comfy': 0,   // FREE — local GPU
  'image_gen_dalle': 4,
  'code_deepseek':   0,   // FREE — local
  'code_claude':     2,
  'multimodal':      1,   // Base cost — final cost decided by FORGE
};

const FREE_CREDITS = 200;
const CREDIT_COST_PER_MESSAGE = 2;

async function getOrCreateBalance(userId: string, tenantId: string) {
  let balance = await db.userCreditBalance.findUnique({ where: { userId } });
  if (!balance) {
    balance = await db.userCreditBalance.create({
      data: { userId, tenantId, balance: FREE_CREDITS, tier: "free" },
    });
    await db.aICredit.create({
      data: {
        userId,
        tenantId,
        action: "earned",
        amount: FREE_CREDITS,
        balance: FREE_CREDITS,
        description: "Welcome credits — free tier",
      },
    });
  }
  return balance;
}

export async function checkAICredits(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const balance = await getOrCreateBalance(userId, tenantId);

    if (balance.balance < CREDIT_COST_PER_MESSAGE) {
      return res.status(402).json({
        error: "Insufficient AI credits",
        balance: balance.balance,
        required: CREDIT_COST_PER_MESSAGE,
        tier: balance.tier,
        upgradeUrl: "/intelligence/credits",
        message: `You need at least ${CREDIT_COST_PER_MESSAGE} credits for an AI response. You have ${balance.balance} remaining. Upgrade to Pro for 2,000 credits/month.`,
      });
    }

    req.aiCreditBalance = balance.balance;
    req.aiCreditTier = balance.tier;
    next();
  } catch (err) {
    console.error("[aiCreditsMiddleware]", err);
    next();
  }
}

// Credit meter middleware - determines cost based on action + provider
export function creditMeterMiddleware(actionType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId   = req.user.userId;
      const tenantId = req.user.tenantId;
      const provider = req.body.provider || 'ollama';

      const creditKey = `${actionType}_${provider}`;
      const cost = CREDIT_COSTS[creditKey] ?? CREDIT_COSTS[actionType] ?? 1;

      if (cost > 0) {
        // Check balance
        const balance = await db.userCreditBalance.findUnique({ where: { userId } });
        const currentBalance = balance?.balance ?? 0;

        if (currentBalance < cost) {
          return res.status(402).json({
            error:   'Insufficient AI credits',
            balance: currentBalance,
            needed:  cost,
            action:  'top_up',
            link:    '/intelligence/credits'
          });
        }

        // Deduct (optimistic — refund on error)
        await db.userCreditBalance.upsert({
          where:  { userId },
          update: { balance: { decrement: cost } },
          create: { userId, tenantId, balance: FREE_CREDITS - cost, tier: 'free' }
        });

        // Log usage
        await db.aICredit.create({
          data: { 
            userId, 
            tenantId, 
            action: 'spent', 
            amount: -cost,
            balance: currentBalance - cost,
            description: `${actionType} via ${provider}` 
          }
        });

        // Inject cost info for HERALD reporting
        res.locals.creditCost    = cost;
        res.locals.creditBalance = currentBalance - cost;
      }

      next();
    } catch (err) {
      console.error("[creditMeterMiddleware]", err);
      next();
    }
  };
}

export async function deductAICredits(
  userId: string,
  tenantId: string,
  assistant: string,
  cost: number = CREDIT_COST_PER_MESSAGE
): Promise<void> {
  try {
    const balance = await db.userCreditBalance.findUnique({ where: { userId } });
    if (!balance) return;

    const newBalance = Math.max(0, balance.balance - cost);

    await db.userCreditBalance.update({
      where: { userId },
      data: { balance: newBalance },
    });

    await db.aICredit.create({
      data: {
        userId,
        tenantId,
        action: "spent",
        amount: -cost,
        balance: newBalance,
        description: `${cost} credit${cost !== 1 ? "s" : ""} used — ${assistant.toUpperCase()} chat`,
      },
    });
  } catch (err) {
    console.error("[aiCreditsMiddleware/deduct]", err);
  }
}
