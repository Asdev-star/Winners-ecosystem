// Server/routes/trustScoreRoutes.ts
// ─── User Trust Score & Reputation System ──────────────────────────────────
// Calculates and serves real-time trust scores based on cross-layer user activity
// Used by: useTrustScore hook, Community profiles, Work layer hiring, Market vendor ratings

import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();

router.use(authMiddleware);
router.use(enforceTenant);

interface TrustScoreBreakdown {
  academy: number; // Up to 30 points - certificates, courses completed
  work: number; // Up to 25 points - contracts completed, ratings
  community: number; // Up to 20 points - posts, engagement, followers
  identity: number; // Up to 15 points - profile completion, KYC
  payments: number; // Up to 10 points - payment history, disputes
}

interface TrustScoreResponse {
  userId: string;
  score: number;
  tier: "new" | "building" | "established" | "trusted" | "elite";
  breakdown: TrustScoreBreakdown;
  lastUpdated: string;
}

function calculateTrustScore(breakdown: TrustScoreBreakdown): number {
  return Object.values(breakdown).reduce((sum, val) => sum + val, 0);
}

function getTier(
  score: number,
): "new" | "building" | "established" | "trusted" | "elite" {
  if (score >= 90) return "elite";
  if (score >= 80) return "trusted";
  if (score >= 60) return "established";
  if (score >= 40) return "building";
  return "new";
}

async function calculateBreakdown(
  tenantId: string,
  userId: string,
): Promise<TrustScoreBreakdown> {
  try {
    // ─── Academy Points (up to 30) ──────────────────────────────────────────
    const certificates = await db.certificate.count({
      where: { userId, tenantId },
    });
    const enrollments = await db.enrollment.count({
      where: { userId, tenantId },
    });
    const academyPoints = Math.min(30, certificates * 8 + enrollments * 2);

    // ─── Work Points (up to 25) ─────────────────────────────────────────────
    const completedContracts = await db.contract.count({
      where: {
        tenantId,
        OR: [
          { freelancerId: userId, status: "COMPLETED" },
          { clientId: userId, status: "COMPLETED" },
        ],
      },
    });
    const workPoints = Math.min(25, completedContracts * 5);

    // ─── Community Points (up to 20) ────────────────────────────────────────
    const posts = await db.post.count({
      where: { authorId: userId, tenantId, deletedAt: null },
    });
    const followers = await db.follow.count({
      where: { followingId: userId, tenantId },
    });
    const communityPoints = Math.min(
      20,
      posts * 1 + Math.floor(followers / 10),
    );

    // ─── Identity Points (up to 15) ─────────────────────────────────────────
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        bio: true,
        profileViews: true,
        onboardingDone: true,
      },
    });
    let identityPoints = 0;
    if (user?.bio && user.bio.length > 50) identityPoints += 5;
    if (user?.profileViews && user.profileViews > 10) identityPoints += 5;
    if (user?.onboardingDone) identityPoints += 5;
    identityPoints = Math.min(15, identityPoints);

    // ─── Payments Points (up to 10) ─────────────────────────────────────────
    // Count successful contracts as payment history proxy
    const successfulContracts = await db.contract.count({
      where: {
        tenantId,
        clientId: userId,
        status: "COMPLETED",
      },
    });
    const paymentPoints = Math.min(10, successfulContracts * 2);

    return {
      academy: academyPoints,
      work: workPoints,
      community: communityPoints,
      identity: identityPoints,
      payments: paymentPoints,
    };
  } catch (error) {
    console.error("[Trust Score] Error calculating breakdown:", error);
    return { academy: 0, work: 0, community: 0, identity: 0, payments: 0 };
  }
}

// ─── GET /trust-score — Get current user's trust score ──────────────────────

router.get("/", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;

  try {
    const breakdown = await calculateBreakdown(tenantId, userId);
    const score = calculateTrustScore(breakdown);
    const tier = getTier(score);

    return res.json({
      userId,
      score: Math.round(score),
      tier,
      breakdown: {
        academy: Math.round(breakdown.academy),
        work: Math.round(breakdown.work),
        community: Math.round(breakdown.community),
        identity: Math.round(breakdown.identity),
        payments: Math.round(breakdown.payments),
      },
      lastUpdated: new Date().toISOString(),
    } as TrustScoreResponse);
  } catch (error) {
    console.error("[Trust Score] Error calculating trust score:", error);
    return res.status(500).json({ error: "Failed to calculate trust score" });
  }
});

// ─── GET /trust-score/:userId — Get specific user's trust score (public) ────────

router.get("/:userId", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const targetUserId = String(req.params.userId);

  try {
    // Verify user exists in tenant
    const user = await db.user.findFirst({
      where: { id: targetUserId, tenantId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const breakdown = await calculateBreakdown(tenantId, targetUserId);
    const score = calculateTrustScore(breakdown);
    const tier = getTier(score);

    return res.json({
      userId: targetUserId,
      score: Math.round(score),
      tier,
      breakdown: {
        academy: Math.round(breakdown.academy),
        work: Math.round(breakdown.work),
        community: Math.round(breakdown.community),
        identity: Math.round(breakdown.identity),
        payments: Math.round(breakdown.payments),
      },
      lastUpdated: new Date().toISOString(),
    } as TrustScoreResponse);
  } catch (error) {
    console.error("[Trust Score] Error fetching trust score:", error);
    return res.status(500).json({ error: "Failed to fetch trust score" });
  }
});

export default router;
