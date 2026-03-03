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
    detections.forEach((d) => {
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
// NOVA SKILL DETECTION - Claude API Integration
// ============================================

// Detect skills in post content using Claude API
router.post("/skills/detect", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { postId, content } = req.body;

    if (!content || content.trim().length < 20) {
      return res.json({ skills: [], summary: "" });
    }

    // Get user's existing skills for context
    const existingSkills = await db.novaSkillDetection.findMany({
      where: { userId },
      select: { skill: true },
      distinct: ["skill"],
      orderBy: { confidence: "desc" },
      take: 10,
    });

    const existingSkillNames = existingSkills.map((s) => s.skill).join(", ");

    // Build the prompt for NOVA
    const prompt = `You are NOVA, the Winners Ecosystem Community Intelligence Supervisor.

Analyse this post and identify professional skills demonstrated or discussed.
Return ONLY valid JSON — no preamble, no markdown, just the JSON object.

{
  "skills": [
    { "name": "string", "confidence": 0.0-1.0, "category": "technical|creative|business|soft|language" }
  ],
  "summary": "one sentence describing what skill area this person is developing"
}

Rules:
- Only include skills with confidence above 0.65
- Maximum 5 skills per post
- Be specific: "React" not "programming", "Copywriting" not "writing"
- Do not hallucinate skills not evidenced in the text
- Existing skills for context: ${existingSkillNames || "none yet"}

Post content: "${content.replace(/"/g, '\\"').slice(0, 2000)}"`;

    // Call Claude API for skill detection
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      console.warn("ANTHROPIC_API_KEY not set, using mock detection");
      // Fallback to mock detection if no API key
      const mockSkills = extractMockSkills(content);
      return res.json({
        skills: mockSkills,
        summary: mockSkills[0]?.category || "technical",
      });
    }

    const anthropicResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6-20250514",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        }),
      },
    );

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Claude API error:", errorText);
      // Fallback to mock detection
      const mockSkills = extractMockSkills(content);
      return res.json({
        skills: mockSkills,
        summary: mockSkills[0]?.category || "technical",
      });
    }

    const anthropicData = await anthropicResponse.json();
    const rawText = anthropicData.content?.[0]?.text || "{}";

    let parsed;
    try {
      // Extract JSON from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { skills: [], summary: "" };
    } catch {
      console.error("Failed to parse Claude response:", rawText);
      parsed = { skills: [], summary: "" };
    }

    // Store detections above threshold
    const skills = (parsed.skills || [])
      .filter((s: any) => s.confidence >= 0.75)
      .slice(0, 5);

    const detections = await Promise.all(
      skills.map((s: any) =>
        db.novaSkillDetection.upsert({
          where: { userId_skill: { userId, skill: s.name } },
          create: {
            userId,
            postId,
            skill: s.name,
            confidence: s.confidence,
            category: s.category || "technical",
          },
          update: {
            confidence: Math.max(s.confidence, 0),
            postId,
            updatedAt: new Date(),
          },
        }),
      ),
    );

    // Fire cross-layer event if high-confidence skills detected
    if (detections.length > 0) {
      // Update Agentic Loop progress
      await db.agenticLoopProgress.upsert({
        where: { userId },
        create: { userId, currentStage: "academy", lastActivity: new Date() },
        update: { currentStage: "academy", lastActivity: new Date() },
      });

      // Create community insight
      await db.communityInsight.create({
        data: {
          userId,
          type: "skill_detected",
          title: "New Skill Detected",
          content: `NOVA detected ${skills.length} skill(s) in your recent post: ${skills.map((s: any) => s.name).join(", ")}`,
          metadata: JSON.stringify({ skills }),
        },
      });
    }

    res.json({
      skills: detections.map((d: any) => ({
        skillName: d.skill,
        confidence: d.confidence,
        category: d.category,
      })),
      summary: parsed.summary || "",
    });
  } catch (error) {
    console.error("Failed to detect skills:", error);
    res.status(500).json({ error: "Failed to detect skills" });
  }
});

// Helper function for mock skill extraction when Claude API is unavailable
function extractMockSkills(
  content: string,
): Array<{ skillName: string; confidence: number; category: string }> {
  const skillPatterns = [
    { pattern: /react\b/gi, skill: "React", category: "technical" },
    { pattern: /node\.js|nodejs/gi, skill: "Node.js", category: "technical" },
    {
      pattern: /typescript|ts\b/gi,
      skill: "TypeScript",
      category: "technical",
    },
    { pattern: /python/gi, skill: "Python", category: "technical" },
    {
      pattern: /javascript|js\b/gi,
      skill: "JavaScript",
      category: "technical",
    },
    { pattern: /next\.?js|nextjs/gi, skill: "Next.js", category: "technical" },
    { pattern: /tailwind/gi, skill: "Tailwind CSS", category: "technical" },
    { pattern: /figma/gi, skill: "Figma", category: "creative" },
    { pattern: /docker/gi, skill: "Docker", category: "technical" },
    { pattern: /aws|amazon web/gi, skill: "AWS", category: "technical" },
    { pattern: /marketing/gi, skill: "Marketing", category: "business" },
    { pattern: /seo|search engine/gi, skill: "SEO", category: "business" },
    { pattern: /copywriting/gi, skill: "Copywriting", category: "creative" },
    { pattern: /design\b/gi, skill: "Design", category: "creative" },
    { pattern: /leadership/gi, skill: "Leadership", category: "soft" },
    { pattern: /communication/gi, skill: "Communication", category: "soft" },
  ];

  const detected: Array<{
    skillName: string;
    confidence: number;
    category: string;
  }> = [];

  for (const { pattern, skill, category } of skillPatterns) {
    if (pattern.test(content)) {
      detected.push({
        skillName: skill,
        confidence: 0.75 + Math.random() * 0.2,
        category,
      });
    }
  }

  return detected.slice(0, 5);
}

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
router.get(
  "/skills/endorsements/:userId",
  async (req: Request, res: Response) => {
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
      const bySkill = endorsements.reduce(
        (acc, e) => {
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
        },
        {} as Record<string, any>,
      );

      res.json({ endorsements, bySkill: Object.values(bySkill) });
    } catch (error) {
      console.error("Failed to get endorsements:", error);
      res.status(500).json({ error: "Failed to get endorsements" });
    }
  },
);

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
    const { stage, postsCount, skillsDetected, coursesTaken, contractsWon } =
      req.body;

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
    const skillNames = userSkills.map((s) => s.skill);

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
    Math.round((user?.trustScore || 50) * 0.7 + endorsementScore * 2),
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

// ============================================
// QUOTE-SHARE (X-INSPIRED)
// ============================================

// Create a quote-post (share with commentary)
router.post("/posts/:postId/quote", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { postId } = req.params;
    const { commentary } = req.body;

    // Verify the original post exists
    const originalPost = await db.post.findUnique({
      where: { id: postId },
    });

    if (!originalPost) {
      return res.status(404).json({ error: "Original post not found" });
    }

    // Create the quote post
    const quotePost = await db.post.create({
      data: {
        tenantId: originalPost.tenantId,
        authorId: userId,
        content: commentary || "",
        // Link to original via QuotePost relation
      },
    });

    // Create the quote relation
    await db.quotePost.create({
      data: {
        quotingPostId: quotePost.id,
        quotedPostId: postId,
      },
    });

    res.json({ post: quotePost, originalPost });
  } catch (error) {
    console.error("Failed to create quote post:", error);
    res.status(500).json({ error: "Failed to create quote post" });
  }
});

// Get quote posts for a post
router.get("/posts/:postId/quotes", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const quotes = await db.quotePost.findMany({
      where: { quotedPostId: postId },
      include: {
        quotingPost: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                trustScore: true,
                trustScoreTier: true,
              },
            },
          },
        },
      },
    });

    res.json({ quotes });
  } catch (error) {
    console.error("Failed to get quotes:", error);
    res.status(500).json({ error: "Failed to get quotes" });
  }
});

// ============================================
// SIX-REACTION SYSTEM (NOVA WEIGHTED)
// ============================================

// Reaction types with NOVA weight multipliers
const REACTION_WEIGHTS: Record<string, number> = {
  like: 1.0,
  fire: 1.5, // High engagement - trending
  celebrate: 2.0, // Achievement/ milestone
  insight: 2.5, // Valuable content - triggers skill detection
  helpful: 2.0,
  clap: 1.2,
};

// Add reaction to post
router.post("/posts/:postId/react", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { postId } = req.params;
    const { reactionType } = req.body;

    if (!REACTION_WEIGHTS[reactionType]) {
      return res.status(400).json({ error: "Invalid reaction type" });
    }

    // Check if user already reacted
    const existingReaction = await db.like.findFirst({
      where: { userId, postId },
    });

    if (existingReaction) {
      // Update existing like to include reaction type
      // For now, just return success - would need Like model update for full implementation
      return res.json({ success: true, message: "Already reacted" });
    }

    // Create new reaction
    await db.like.create({
      data: {
        userId,
        postId,
      },
    });

    // Calculate NOVA-weighted engagement score
    const weight = REACTION_WEIGHTS[reactionType];

    // Update post engagement score (would need field added to Post model)
    // For now, just return success

    // If "insight" reaction, trigger skill detection for author
    if (reactionType === "insight") {
      const post = await db.post.findUnique({
        where: { id: postId },
        select: { authorId: true, content: true },
      });

      if (post) {
        // Queue skill detection for the original post
        // This would be handled by a background job in production
      }
    }

    res.json({ success: true, reactionType, weight });
  } catch (error) {
    console.error("Failed to react:", error);
    res.status(500).json({ error: "Failed to react" });
  }
});

// Get reaction counts for a post
router.get("/posts/:postId/reactions", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    // For now, return mock data - full implementation would track reaction types
    const reactions = {
      like: 0,
      fire: 0,
      celebrate: 0,
      insight: 0,
      helpful: 0,
      clap: 0,
      total: 0,
    };

    // Get actual like count
    const likeCount = await db.like.count({
      where: { postId },
    });

    reactions.like = likeCount;
    reactions.total = likeCount;

    res.json({ reactions });
  } catch (error) {
    console.error("Failed to get reactions:", error);
    res.status(500).json({ error: "Failed to get reactions" });
  }
});

// ============================================
// ACHIEVEMENT SHARE CARDS
// ============================================

// Generate achievement share card data
router.get(
  "/achievements/:type/share-card",
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { type } = req.params;
      const { id } = req.query; // Optional ID for specific achievement

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { name: true, trustScore: true, trustScoreTier: true },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let cardData: any = {
        user: {
          name: user.name,
          trustScore: user.trustScore,
          tier: user.trustScoreTier,
        },
        achievement: {},
        shareUrl: `${process.env.APP_URL || "https://winnersempire.io"}/profile/${userId}`,
        generatedAt: new Date().toISOString(),
      };

      switch (type) {
        case "certificate":
          // Get certificate details
          const certificate = id
            ? await db.certificate.findUnique({ where: { id: id as string } })
            : await db.certificate.findFirst({
                where: { recipientId: userId },
                orderBy: { issuedAt: "desc" },
              });

          if (certificate) {
            cardData.achievement = {
              type: "certificate",
              title: certificate.title || "Winners Academy Certificate",
              issuedAt: certificate.issuedAt,
              credentialId: certificate.id,
            };
          }
          break;

        case "trust-upgrade":
          cardData.achievement = {
            type: "trust_upgrade",
            title: `Reached ${user.trustScoreTier} Trust Level`,
            score: user.trustScore,
          };
          break;

        case "contract":
          // Would fetch from Work contracts
          cardData.achievement = {
            type: "contract",
            title: "Completed First Contract",
          };
          break;

        case "loop-complete":
          cardData.achievement = {
            type: "loop_complete",
            title: "Completed First Agentic Loop",
          };
          break;

        default:
          return res.status(400).json({ error: "Invalid achievement type" });
      }

      res.json({ card: cardData });
    } catch (error) {
      console.error("Failed to generate share card:", error);
      res.status(500).json({ error: "Failed to generate share card" });
    }
  },
);

// ============================================
// NOVA WEEKLY INTELLIGENCE REPORT
// ============================================

router.get("/weekly-report", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get user's posts from last week
    const weeklyPosts = await db.post.findMany({
      where: {
        authorId: userId,
        createdAt: { gte: weekAgo },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        likes: { select: { id: true } },
        comments: { select: { id: true } },
      },
    });

    // Calculate reach metrics
    const totalImpressions = weeklyPosts.reduce(
      (sum, post) => sum + post.likes.length + post.comments.length,
      0,
    );

    // Get skills detected this week
    const weeklySkills = await db.novaSkillDetection.findMany({
      where: {
        userId,
        createdAt: { gte: weekAgo },
      },
      select: { skill: true },
      distinct: ["skill"],
    });

    // Get profile views this week (would need tracking)
    const profileViews = 0; // Placeholder

    // Get missed opportunities (jobs that matched user's skills)
    const missedOpportunities = []; // Placeholder - would integrate with Work

    // Get loop progress
    const loopProgress = await db.agenticLoopProgress.findUnique({
      where: { userId },
    });

    // Generate NOVA's recommendation
    let novaRecommendation = "";
    if (weeklyPosts.length === 0) {
      novaRecommendation =
        "You haven't posted this week. Start with a quick insight about what you're building.";
    } else if (totalImpressions > 50) {
      novaRecommendation =
        "Great engagement this week! Your content is resonating. Consider posting about your learning journey.";
    } else {
      novaRecommendation =
        "Try posting during peak hours (9AM-11AM WAT) to increase your reach.";
    }

    const report = {
      period: {
        start: weekAgo.toISOString(),
        end: now.toISOString(),
      },
      metrics: {
        postsCount: weeklyPosts.length,
        totalImpressions,
        profileViews,
        newSkillsDetected: weeklySkills.length,
      },
      skills: weeklySkills.map((s) => s.skill),
      missedOpportunities,
      loopProgress,
      novaRecommendation,
      generatedAt: now.toISOString(),
    };

    res.json({ report });
  } catch (error) {
    console.error("Failed to generate weekly report:", error);
    res.status(500).json({ error: "Failed to generate weekly report" });
  }
});

// ============================================
// OPEN TO OPPORTUNITIES STATUS
// ============================================

// Get user's opportunity status
router.get("/opportunity-status", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        openToOpportunities: true,
        opportunityStatus: true,
        opportunityBio: true,
      },
    });

    res.json({
      openToOpportunities: user?.openToOpportunities || false,
      status: user?.opportunityStatus || null,
      bio: user?.opportunityBio || null,
    });
  } catch (error) {
    console.error("Failed to get opportunity status:", error);
    res.status(500).json({ error: "Failed to get opportunity status" });
  }
});

// Update opportunity status
router.patch("/opportunity-status", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { openToOpportunities, status, bio } = req.body;

    const user = await db.user.update({
      where: { id: userId },
      data: {
        openToOpportunities: openToOpportunities ?? true,
        opportunityStatus: status || null,
        opportunityBio: bio || null,
      },
      select: {
        openToOpportunities: true,
        opportunityStatus: true,
        opportunityBio: true,
      },
    });

    res.json({
      success: true,
      openToOpportunities: user.openToOpportunities,
      status: user.opportunityStatus,
      bio: user.opportunityBio,
    });
  } catch (error) {
    console.error("Failed to update opportunity status:", error);
    res.status(500).json({ error: "Failed to update opportunity status" });
  }
});

// ============================================
// GROUP LEARNING TRACKS
// ============================================

// Get learning tracks for a group
router.get(
  "/groups/:groupId/learning-tracks",
  async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;

      const tracks = await db.groupLearningTrack.findMany({
        where: { groupId },
        include: {
          creator: {
            select: { id: true, name: true },
          },
        },
        orderBy: { startDate: "desc" },
      });

      res.json({ tracks });
    } catch (error) {
      console.error("Failed to get learning tracks:", error);
      res.status(500).json({ error: "Failed to get learning tracks" });
    }
  },
);

// Create a learning track (group owner/admin only)
router.post(
  "/groups/:groupId/learning-tracks",
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { groupId } = req.params;
      const { title, description, totalWeeks, startDate, endDate, courseId } =
        req.body;

      // Verify user is group owner/admin
      const membership = await db.groupMember.findFirst({
        where: {
          groupId,
          userId,
          role: { in: ["OWNER", "ADMIN"] },
        },
      });

      if (!membership) {
        return res
          .status(403)
          .json({ error: "Only group admins can create learning tracks" });
      }

      const track = await db.groupLearningTrack.create({
        data: {
          groupId,
          title,
          description,
          totalWeeks: totalWeeks || 4,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          courseId,
          createdById: userId,
        },
      });

      res.json({ track });
    } catch (error) {
      console.error("Failed to create learning track:", error);
      res.status(500).json({ error: "Failed to create learning track" });
    }
  },
);

// ============================================
// COMMUNITY HEALTH MONITOR (ADMIN ONLY)
// ============================================

router.get("/health-metrics", async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const userId = req.user!.userId;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Calculate health metrics
    const [totalPosts, postsToday, postsThisHour] = await Promise.all([
      db.post.count(),
      db.post.count({ where: { createdAt: { gte: dayAgo } } }),
      db.post.count({ where: { createdAt: { gte: hourAgo } } }),
    ]);

    const [totalUsers, activeUsers] = await Promise.all([
      db.user.count(),
      db.post.findMany({
        where: { createdAt: { gte: dayAgo } },
        select: { authorId: true },
        distinct: ["authorId"],
      }),
    ]);

    const [totalGroups, activeGroups] = await Promise.all([
      db.group.count(),
      db.group.findMany({
        where: {
          members: {
            some: {
              joinedAt: { gte: dayAgo },
            },
          },
        },
        select: { id: true },
      }),
    ]);

    // Calculate engagement rate
    const engagementRate =
      totalPosts > 0
        ? ((activeUsers.length / totalUsers) * 100).toFixed(1)
        : "0";

    // Get trending skills
    const trendingSkills = await db.novaSkillDetection.groupBy({
      by: ["skill"],
      _count: { skill: true },
      orderBy: { _count: { skill: "desc" } },
      take: 10,
    });

    const metrics = {
      posts: {
        total: totalPosts,
        today: postsToday,
        thisHour: postsThisHour,
      },
      users: {
        total: totalUsers,
        active: activeUsers.length,
        engagementRate: parseFloat(engagementRate),
      },
      groups: {
        total: totalGroups,
        active: activeGroups.length,
      },
      trendingSkills: trendingSkills.map((s) => ({
        skill: s.skill,
        count: s._count.skill,
      })),
      calculatedAt: now.toISOString(),
    };

    res.json({ metrics });
  } catch (error) {
    console.error("Failed to get health metrics:", error);
    res.status(500).json({ error: "Failed to get health metrics" });
  }
});

export default router;
