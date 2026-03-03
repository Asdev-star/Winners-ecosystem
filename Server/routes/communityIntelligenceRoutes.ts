// Server/routes/communityIntelligenceRoutes.ts
// Phase 2 V2.0: Community Intelligence Routes
// Implements: NOVA skill detection, insights, endorsements, feed preferences

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { db } from "../db.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================
// NOVA SKILL DETECTION
// ============================================

// Get skill detections for current user's posts
router.get("/skills/detections", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const detections = await db.novaSkillDetection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ detections });
  } catch (error) {
    console.error("Failed to fetch skill detections:", error);
    res.status(500).json({ error: "Failed to fetch skill detections" });
  }
});

// Get aggregate skills for a user (for profile)
router.get("/skills/aggregate", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || req.user!.userId;
    
    const detections = await db.novaSkillDetection.findMany({
      where: { userId },
      select: { skill: true, confidence: true },
    });

    // Aggregate by skill with weighted confidence
    const skillMap = new Map<string, { total: number; count: number }>();
    detections.forEach(d => {
      const existing = skillMap.get(d.skill) || { total: 0, count: 0 };
      skillMap.set(d.skill, {
        total: existing.total + d.confidence,
        count: existing.count + 1,
      });
    });

    const skills = Array.from(skillMap.entries()).map(([skill, data]) => ({
      skill,
      avgConfidence: Math.round(data.total / data.count),
      detectionCount: data.count,
    }));

    res.json({ skills });
  } catch (error) {
    console.error("Failed to aggregate skills:", error);
    res.status(500).json({ error: "Failed to aggregate skills" });
  }
});

// ============================================
// COMMUNITY INSIGHTS (NOVA CHANNELS)
// ============================================

// Get insights for current user
router.get("/insights", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { type, unreadOnly } = req.query;

    const where: any = { userId };
    if (unreadOnly === "true") where.isRead = false;
    if (type) where.type = type as string;

    const insights = await db.communityInsight.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const unreadCount = await db.communityInsight.count({
      where: { userId, isRead: false },
    });

    res.json({ insights, unreadCount });
  } catch (error) {
    console.error("Failed to fetch insights:", error);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

// Mark insight as read
router.patch("/insights/:id/read", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.communityInsight.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to mark insight as read:", error);
    res.status(500).json({ error: "Failed to mark insight as read" });
  }
});

// Mark all insights as read
router.patch("/insights/read-all", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    await db.communityInsight.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to mark all insights as read:", error);
    res.status(500).json({ error: "Failed to mark all insights as read" });
  }
});

// ============================================
// SKILL ENDORSEMENTS (LINKEDIN-INSPIRED)
// ============================================

// Endorse a user's skill
router.post("/skills/endorse", async (req: Request, res: Response) => {
  try {
    const endorserId = req.user!.userId;
    const { userId, skill } = req.body;

    if (!userId || !skill) {
      return res.status(400).json({ error: "userId and skill required" });
    }

    if (endorserId === userId) {
      return res.status(400).json({ error: "Cannot endorse yourself" });
    }

    // Get endorser's trust score for weight calculation
    const endorser = await db.user.findUnique({
      where: { id: endorserId },
      select: { trustScore: true },
    });

    const weight = endorser?.trustScore 
      ? Math.max(0.5, Math.min(2.0, endorser.trustScore / 50))
      : 1.0;

    const endorsement = await db.skillEndorsement.upsert({
      where: { endorserId_userId_skill: { endorserId, userId, skill } },
      create: { endorserId, userId, skill, weight },
      update: { weight },
    });

    // Recalculate user's trust score based on endorsements
    await recalculateTrustScore(userId);

    res.json({ endorsement });
  } catch (error) {
    console.error("Failed to endorse skill:", error);
    res.status(500).json({ error: "Failed to endorse skill" });
  }
});

// Get endorsements received by a user
router.get("/skills/endorsements/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const endorsements = await db.skillEndorsement.findMany({
      where: { userId },
      include: {
        endorser: { select: { id: true, name: true, trustScore: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by skill
    const bySkill = endorsements.reduce((acc, e) => {
      if (!acc[e.skill]) {
        acc[e.skill] = { skill: e.skill, endorsers: [], totalWeight: 0 };
      }
      acc[e.skill].endorsers.push({
        id: e.endorser.id,
        name: e.endorser.name,
        trustScore: e.endorser.trustScore,
        weight: e.weight,
      });
      acc[e.skill].totalWeight += e.weight;
      return acc;
    }, {} as Record<string, any>);

    res.json({ endorsements, bySkill: Object.values(bySkill) });
  } catch (error) {
    console.error("Failed to get endorsements:", error);
    res.status(500).json({ error: "Failed to get endorsements" });
  }
});

// ============================================
// FEED PREFERENCES
// ============================================

// Get feed preferences
router.get("/feed-preferences", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    let prefs = await db.userFeedPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await db.userFeedPreference.create({
        data: { userId },
      });
    }

    res.json({ preferences: prefs });
  } catch (error) {
    console.error("Failed to get feed preferences:", error);
    res.status(500).json({ error: "Failed to get feed preferences" });
  }
});

// Update feed preferences
router.patch("/feed-preferences", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { feedMode, novaIntelligence, quickPostEnabled } = req.body;

    const prefs = await db.userFeedPreference.upsert({
      where: { userId },
      create: { userId, feedMode, novaIntelligence, quickPostEnabled },
      update: {
        ...(feedMode && { feedMode }),
        ...(typeof novaIntelligence === "boolean" && { novaIntelligence }),
        ...(typeof quickPostEnabled === "boolean" && { quickPostEnabled }),
      },
    });

    res.json({ preferences: prefs });
  } catch (error) {
    console.error("Failed to update feed preferences:", error);
    res.status(500).json({ error: "Failed to update feed preferences" });
  }
});

// ============================================
// AGENTIC LOOP PROGRESS
// ============================================

// Get user's agentic loop progress
router.get("/loop-progress", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    let progress = await db.agenticLoopProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      progress = await db.agenticLoopProgress.create({
        data: { userId, stageName: "skill_detection" },
      });
    }

    res.json({ progress });
  } catch (error) {
    console.error("Failed to get loop progress:", error);
    res.status(500).json({ error: "Failed to get loop progress" });
  }
});

// Update agentic loop progress
router.patch("/loop-progress", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { stage, postsCount, skillsDetected, coursesTaken, contractsWon } = req.body;

    const progress = await db.agenticLoopProgress.upsert({
      where: { userId },
      create: {
        userId,
        stage: stage || 1,
        stageName: getStageName(stage || 1),
        postsCount: postsCount || 0,
        skillsDetected: skillsDetected || 0,
        coursesTaken: coursesTaken || 0,
        contractsWon: contractsWon || 0,
      },
      update: {
        ...(stage && { stage, stageName: getStageName(stage) }),
        ...(typeof postsCount === "number" && { postsCount }),
        ...(typeof skillsDetected === "number" && { skillsDetected }),
        ...(typeof coursesTaken === "number" && { coursesTaken }),
        ...(typeof contractsWon === "number" && { contractsWon }),
      },
    });

    res.json({ progress });
  } catch (error) {
    console.error("Failed to update loop progress:", error);
    res.status(500).json({ error: "Failed to update loop progress" });
  }
});

// ============================================
// SAVED POSTS (BOOKMARKS)
// ============================================

// Save a post
router.post("/posts/:postId/save", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { postId } = req.params;
    const { isPublic } = req.body;

    const saved = await db.savedPost.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId, isPublic: isPublic || false },
      update: { isPublic: isPublic || false },
    });

    res.json({ saved });
  } catch (error) {
    console.error("Failed to save post:", error);
    res.status(500).json({ error: "Failed to save post" });
  }
});

// Unsave a post
router.delete("/posts/:postId/save", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { postId } = req.params;

    await db.savedPost.deleteMany({
      where: { userId, postId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to unsave post:", error);
    res.status(500).json({ error: "Failed to unsave post" });
  }
});

// Get saved posts
router.get("/saved-posts", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { includePublic } = req.query;

    const where: any = { userId };
    if (includePublic === "true") {
      // Include posts saved by others that are public
      delete where.userId;
    }

    const saved = await db.savedPost.findMany({
      where,
      include: {
        post: {
          include: {
            author: { select: { id: true, name: true } },
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ savedPosts: saved });
  } catch (error) {
    console.error("Failed to get saved posts:", error);
    res.status(500).json({ error: "Failed to get saved posts" });
  }
});

// ============================================
// INTELLIGENCE FEED (NOVA CURATED)
// ============================================

// Get NOVA-curated feed
router.get("/feed/intelligence", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get user's detected skills
    const userSkills = await db.novaSkillDetection.findMany({
      where: { userId },
      select: { skill: true },
      distinct: ["skill"],
    });
    const skillNames = userSkills.map(s => s.skill);

    // Get posts from users with related skills
    const posts = await db.post.findMany({
      where: {
        OR: [
          // Posts by users with skills user is learning
          {
            author: {
              novaSkillDetections: {
                some: { skill: { in: skillNames } },
              },
            },
          },
          // Posts with high engagement (popular)
          {
            likes: { _count: { gte: 5 } },
          },
        ],
      },
      include: {
        author: { select: { id: true, name: true, trustScore: true } },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await db.post.count();

    res.json({
      posts,
      hasMore: page * limit < total,
      total,
    });
  } catch (error) {
    console.error("Failed to get intelligence feed:", error);
    res.status(500).json({ error: "Failed to get intelligence feed" });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function recalculateTrustScore(userId: string) {
  // Get all endorsements with weights
  const endorsements = await db.skillEndorsement.findMany({
    where: { userId },
    select: { weight: true },
  });

  const endorsementScore = endorsements.reduce((sum, e) => sum + e.weight, 0);
  
  // Get user's own trust score components
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { trustScore: true },
  });

  // Blend existing score with endorsement score (weighted)
  const newScore = Math.min(
    100,
    Math.round((user?.trustScore || 50) * 0.7 + endorsementScore * 2)
  );

  await db.user.update({
    where: { id: userId },
    data: { 
      trustScore: newScore,
      trustScoreTier: getTrustTier(newScore),
      trustScoreUpdatedAt: new Date(),
    },
  });
}

function getTrustTier(score: number): string {
  if (score >= 85) return "PLATINUM";
  if (score >= 65) return "GOLD";
  if (score >= 40) return "SILVER";
  return "BRONZE";
}

function getStageName(stage: number): string {
  const stages = [
    "skill_detection",
    "learning",
    "certification",
    "work_match",
    "contract",
    "vendor",
    "compound",
  ];
  return stages[Math.min(stage - 1, stages.length - 1)] || "skill_detection";
}

export default router;
