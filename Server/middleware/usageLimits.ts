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
        return res.status(403).json({
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
        return res.status(403).json({
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
        return res.status(403).json({
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