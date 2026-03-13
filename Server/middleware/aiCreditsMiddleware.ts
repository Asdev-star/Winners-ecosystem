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
