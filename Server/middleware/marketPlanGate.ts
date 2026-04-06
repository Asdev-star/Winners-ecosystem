// Phase 6 — Plan-Gated Features & Services
// Server/middleware/marketPlanGate.ts

import { type Response, type NextFunction } from 'express';
import { type AccountPlan, type AuthRequest } from './authMiddleware.js';
import db from '../db.js';

function normalizePlan(plan: unknown): AccountPlan {
  return plan === 'PRO' || plan === 'ENTERPRISE' ? plan : 'FREE';
}

async function resolvePlan(req: AuthRequest): Promise<AccountPlan> {
  if (req.user.plan) {
    return req.user.plan;
  }

  const tenant = await db.tenant.findUnique({
    where: { id: req.user.tenantId },
    select: { plan: true },
  });

  const plan = normalizePlan(tenant?.plan);
  req.user.plan = plan;
  return plan;
}

// Require Pro plan for a feature
export function requirePro(feature: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const plan = await resolvePlan(req);

    if (!['PRO', 'ENTERPRISE'].includes(plan)) {
      return res.status(403).json({
        error: 'plan_required',
        requiredPlan: 'PRO',
        feature,
        upgradeLink: '/billing',
        omegaSays: `${feature} requires Pro plan. Upgrade to unlock this and all market features.`
      });
    }
    next();
  };
}

// Require Enterprise plan for a feature
export function requireEnterprise(feature: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const plan = await resolvePlan(req);

    if (plan !== 'ENTERPRISE') {
      return res.status(403).json({
        error: 'plan_required',
        requiredPlan: 'ENTERPRISE',
        feature,
        upgradeLink: '/billing'
      });
    }
    next();
  };
}

// Product limit middleware - enforces plan-based product limits
export function productLimitMiddleware() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { userId, tenantId } = req.user;
    const plan = await resolvePlan(req);

    const limits: Record<string, number> = {
      FREE: 5,
      PRO: 100,
      ENTERPRISE: Infinity
    };

    const limit = limits[plan] ?? 5;

    if (limit === Infinity) return next();

    const count = await db.product.count({
      where: { vendor: { userId, tenantId }, tenantId }
    });

    if (count >= limit) {
      return res.status(403).json({
        error: 'product_limit_reached',
        current: count,
        limit,
        omegaSays: `You have ${count} products. Free plan allows 5. Upgrade to Pro for unlimited.`
      });
    }
    next();
  };
}

// Image upload limit middleware
export function imageLimitMiddleware() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const plan = await resolvePlan(req);

    const limits: Record<string, number> = {
      FREE: 3,
      PRO: 10,
      ENTERPRISE: Infinity
    };

    // This will be checked in the upload route
    req.imageLimit = limits[plan] ?? 3;
    next();
  };
}
