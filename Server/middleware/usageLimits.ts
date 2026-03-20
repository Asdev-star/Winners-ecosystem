// server/middleware/usageLimits.ts

import { Request, Response, NextFunction } from "express";
import db from "../db.js";

// ─── Plan Limits ──────────────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  FREE: {
    seats:          3,
    exportPerMonth: 10,
    analyticsDays:  30,
    forecasting:    false,
    aiInsights:     false,
  },
  PRO: {
    seats:          10,
    exportPerMonth: 100,
    analyticsDays:  90,
    forecasting:    true,
    aiInsights:     true,
  },
  ENTERPRISE: {
    seats:          999,
    exportPerMonth: 999999,
    analyticsDays:  365,
    forecasting:    true,
    aiInsights:     true,
  },
};

export type PlanKey = keyof typeof PLAN_LIMITS;

export const FREE_PLAN_LIMITS = {
  postsPerMonth: 10,
  novaChatPerMonth: 5,
  groupsJoined: 3,
  directMessages: false,
  sageChatPerMonth: 20,
  quizAttemptsPerQuiz: 3,
  paidCourses: false,
  offlineLessons: 0,
  vendorProducts: 5,
  dropshippingStores: 1,
  atlasQueriesPerMonth: 3,
  atlasAdCopyPerMonth: 1,
  businessPlansPerMonth: 1,
  cvExportsPerMonth: 1,
  vendorPayouts: false,
  omegaBriefing: "weekly",
  ariaChatPerMonth: 10,
  supervisorChatPerMonth: 5,
  aiCreditsPerMonth: 100,
  localAI: "unlimited",
  voiceMinutesPerMonth: 5,
  imageGenerations: 0,
  pdfAnalysisPerMonth: 3,
  jobApplicationsPerMonth: 3,
  portfolioItems: 3,
  activeContracts: 1,
  circuitChatPerMonth: 5,
  escrowAsFreelancer: false,
  apiKeys: 0,
  apiCallsPerMonth: 0,
  webhookSubscriptions: 0,
} as const;

const LIMIT_MESSAGES: Record<string, string> = {
  postsPerMonth: "You have reached the monthly Free post limit.",
  jobApplicationsPerMonth: "You have used all Free job applications for this month.",
  atlasQueriesPerMonth: "You have used all ATLAS research queries on the Free plan.",
  aiCreditsPerMonth: "You have used this month's Free AI credit allocation.",
  vendorPayouts: "Vendor payouts are not available on the Free plan.",
  sageChatPerMonth: "You have used all SAGE tutor messages on the Free plan.",
};

const OMEGA_UPGRADE_MESSAGES: Record<string, string> = {
  postsPerMonth: "You've reached your 10 posts for this month. Pro removes the limit entirely.",
  jobApplicationsPerMonth: "3 applications used. CIRCUIT has more matches waiting. Pro removes the limit.",
  atlasQueriesPerMonth: "ATLAS has more product ideas. 3 queries per month on Free, 50 on Pro.",
  aiCreditsPerMonth: "100 AI credits used this month. Local models like Ollama are still always free.",
  vendorPayouts: "Your first sale is ready to pay out. Pro enables vendor payouts.",
  sageChatPerMonth: "SAGE has more to tell you. Pro gives unlimited tutor access.",
};

export function limitHitResponse(feature: string, currentPlan: string) {
  return {
    error: "limit_reached",
    feature,
    currentPlan,
    message: LIMIT_MESSAGES[feature] || "This feature requires a Pro plan.",
    upgradeLink: "/billing",
    omegaSays: OMEGA_UPGRADE_MESSAGES[feature] || "Upgrade to Pro to continue.",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getTenantPlan(tenantId: string): Promise<PlanKey> {
  const tenant = await db.tenant.findFirst({ where: { id: tenantId } });
  return (tenant?.plan ?? "FREE") as PlanKey;
}

async function getSeatCount(tenantId: string): Promise<number> {
  return db.user.count({ where: { tenantId, deletedAt: null } });
}

// ─── Middleware Factories ─────────────────────────────────────────────────────

/** Block invite if seat limit reached */
export function enforceSeatLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const plan     = await getTenantPlan(tenantId);
      const seats    = await getSeatCount(tenantId);
      const limit    = PLAN_LIMITS[plan].seats;

      if (seats >= limit) {
        const payload = limitHitResponse("seats", plan);
        return res.status(403).json({
          ...payload,
          message:  `Seat limit reached (${seats}/${limit}) for ${plan} plan`,
          code:     "SEAT_LIMIT_REACHED",
          upgrade:  plan === "FREE" ? "pro" : "enterprise",
        });
      }
      next();
    } catch {
      next();
    }
  };
}

/** Block forecasting on FREE plan */
export function enforceForecastingAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await getTenantPlan(req.user!.tenantId);
      if (!PLAN_LIMITS[plan].forecasting) {
        const payload = limitHitResponse("forecasting", plan);
        return res.status(403).json({
          ...payload,
          message: "Forecasting is not available on the FREE plan",
          code:    "FEATURE_NOT_AVAILABLE",
          upgrade: "pro",
        });
      }
      next();
    } catch {
      next();
    }
  };
}

/** Limit analytics period based on plan */
export function enforceAnalyticsPeriod() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan    = await getTenantPlan(req.user!.tenantId);
      const maxDays = PLAN_LIMITS[plan].analyticsDays;
      const period  = (req.query.period as string) ?? "30d";
      const days    = period === "7d" ? 7 : period === "90d" ? 90 : 30;

      if (days > maxDays) {
        const payload = limitHitResponse("analyticsDays", plan);
        return res.status(403).json({
          ...payload,
          message: `${period} analytics not available on ${plan} plan (max ${maxDays} days)`,
          code:    "PERIOD_LIMIT_EXCEEDED",
          upgrade: plan === "FREE" ? "pro" : "enterprise",
        });
      }
      next();
    } catch {
      next();
    }
  };
}

/** Attach plan + limits to res.locals for use in route handlers */
export function attachPlanLimits() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan           = await getTenantPlan(req.user!.tenantId);
      res.locals.plan      = plan;
      res.locals.limits    = PLAN_LIMITS[plan];
      next();
    } catch {
      next();
    }
  };
}
