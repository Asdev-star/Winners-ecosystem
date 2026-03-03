// Server/routes/communityIntelligenceRoutes.ts
// Phase 2 V2.0: Community Intelligence Upgrade
// Simplified version - avoids complex Prisma relations

import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

// ============================================
// NOVA SKILL DETECTION
// ============================================

async function detectSkillsWithNOVA(content: string): Promise<Array<{skill: string, confidence: number, category: string}>> {
  const skills: Array<{skill: string, confidence: number, category: string}> = [];
  
  const skillPatterns = [
    { pattern: /react|reactjs|react\.js/gi, skill: "React.js", category: "Frontend" },
    { pattern: /typescript|ts\b/gi, skill: "TypeScript", category: "Frontend" },
    { pattern: /node\.?js|express/gi, skill: "Node.js", category: "Backend" },
    { pattern: /python/gi, skill: "Python", category: "Backend" },
    { pattern: /next\.?js/gi, skill: "Next.js", category: "Frontend" },
    { pattern: /figma/gi, skill: "Figma", category: "Design" },
    { pattern: /docker|kubernetes|k8s/gi, skill: "DevOps", category: "Infrastructure" },
    { pattern: /aws|azure|gcp/gi, skill: "Cloud Computing", category: "Infrastructure" },
  ];

  for (const { pattern, skill, category } of skillPatterns) {
    if (pattern.test(content)) {
      // Stored confidence is 0-100 for analytics consistency.
      skills.push({ skill, confidence: 85 + Math.random() * 10, category });
    }
  }

  return skills;
}

// POST /community-intelligence/skills/detect
router.post("/skills/detect", async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const content = String(req.body?.content ?? "");
    const postId = req.body?.postId ? String(req.body.postId) : null;

    if (!content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }

    const detectedSkills = await detectSkillsWithNOVA(content);

    if (postId) {
      const post = await db.post.findFirst({
        where: { id: postId, tenantId, deletedAt: null },
        select: { id: true },
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      await Promise.all(
        detectedSkills.map((skill) =>
          db.novaSkillDetection.upsert({
            where: {
              userId_postId_skill: {
                userId,
                postId,
                skill: skill.skill,
              },
            },
            create: {
              userId,
              postId,
              skill: skill.skill,
              confidence: skill.confidence,
              category: skill.category.toLowerCase(),
              source: "post",
            },
            update: {
              confidence: skill.confidence,
              category: skill.category.toLowerCase(),
            },
          }),
        ),
      );
    }

    res.json({ 
      skills: detectedSkills.map((skill) => ({
        ...skill,
        confidence: Number((skill.confidence / 100).toFixed(2)),
      })),
      message: detectedSkills.length > 0 
        ? `NOVA detected ${detectedSkills.length} skill(s) in your post`
        : "No skills detected in this post"
    });
  } catch (error) {
    console.error("Skill detection error:", error);
    res.status(500).json({ error: "Failed to detect skills" });
  }
});

// GET /community-intelligence/skills/detected
router.get("/skills/detected", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const detections = await db.novaSkillDetection.findMany({
      where: { userId },
      select: { skill: true, confidence: true, category: true },
      orderBy: { createdAt: "desc" },
    });

    const allSkills: Record<string, {skill: string, confidence: number, category: string, count: number}> = {};
    detections.forEach((detection) => {
      const normalizedConfidence = Number((detection.confidence / 100).toFixed(2));
      if (!allSkills[detection.skill]) {
        allSkills[detection.skill] = {
          skill: detection.skill,
          confidence: normalizedConfidence,
          category: detection.category ?? "general",
          count: 1,
        };
      } else {
        allSkills[detection.skill].count += 1;
        allSkills[detection.skill].confidence = Math.max(
          allSkills[detection.skill].confidence,
          normalizedConfidence,
        );
      }
    });

    const skills = Object.values(allSkills);
    res.json({ skills });
  } catch (error) {
    console.error("Get skills error:", error);
    res.status(500).json({ error: "Failed to get skills" });
  }
});

// ============================================
// QUOTE-SHARE (X-inspired)
// ============================================

router.post("/posts/:postId/quote", async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const postId = String(req.params.postId || "");
    if (!postId) return res.status(400).json({ error: "Post ID required" });
    const commentary = String(req.body?.commentary ?? "").trim();

    const originalPost = await db.post.findFirst({
      where: { id: postId, tenantId, deletedAt: null },
      select: { id: true, tenantId: true, content: true, authorId: true, createdAt: true },
    });
    if (!originalPost) {
      return res.status(404).json({ error: "Original post not found" });
    }

    const quotePost = await db.$transaction(async (tx) => {
      const createdPost = await tx.post.create({
        data: {
          tenantId: originalPost.tenantId,
          authorId: userId,
          content: commentary || "Shared a quote post",
          quotedPostId: postId,
        },
        include: {
          author: { select: { id: true, name: true, email: true } },
          _count: { select: { likes: true, comments: true } },
          tags: { include: { tag: true } },
        },
      });

      await tx.quotePost.create({
        data: { postId: createdPost.id, quotedPostId: postId },
      });

      return createdPost;
    });

    res.status(201).json({
      post: {
        ...quotePost,
        likeCount: quotePost._count.likes,
        commentCount: quotePost._count.comments,
        liked: false,
        tags: quotePost.tags.map((t) => t.tag.name),
      },
      quotedPost: originalPost,
    });
  } catch (error) {
    console.error("Quote post error:", error);
    res.status(500).json({ error: "Failed to create quote post" });
  }
});

router.get("/posts/:postId/quotes", async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const postId = String(req.params.postId || "");
    if (!postId) return res.status(400).json({ error: "Post ID required" });

    const quotes = await db.quotePost.findMany({
      where: {
        quotedPostId: postId,
        post: { tenantId, deletedAt: null },
      },
      include: {
        post: {
          include: {
            author: { select: { id: true, name: true, email: true } },
            _count: { select: { likes: true, comments: true } },
            likes: { where: { userId }, select: { id: true } },
            tags: { include: { tag: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      quotes: quotes.map((quote) => ({
        ...quote.post,
        likeCount: quote.post._count.likes,
        commentCount: quote.post._count.comments,
        liked: quote.post.likes.length > 0,
        tags: quote.post.tags.map((t) => t.tag.name),
      })),
    });
  } catch (error) {
    console.error("Get quotes error:", error);
    res.status(500).json({ error: "Failed to get quotes" });
  }
});

// ============================================
// SAVED POSTS (Bookmarks)
// ============================================

router.post("/posts/:postId/save", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const postId = String(req.params.postId || "");
    if (!postId) return res.status(400).json({ error: "Post ID required" });
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

router.delete("/posts/:postId/save", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const postId = String(req.params.postId || "");
    if (!postId) return res.status(400).json({ error: "Post ID required" });

    await db.savedPost.deleteMany({ where: { userId, postId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to unsave post:", error);
    res.status(500).json({ error: "Failed to unsave post" });
  }
});

router.get("/posts/saved", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const saved = await db.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: { author: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ saved: saved.map((savedEntry) => savedEntry.post) });
  } catch (error) {
    console.error("Failed to get saved posts:", error);
    res.status(500).json({ error: "Failed to get saved posts" });
  }
});

// ============================================
// ACHIEVEMENT SHARE CARDS
// ============================================

router.get("/achievements/share/:type", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const type = String(req.params.type || "");
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, trustScore: true, trustScoreTier: true },
    });

    const cardData: Record<string, unknown> = {
      type,
      user,
    };

    switch (type) {
      case "trust-score":
        cardData.title = "⭐ Trust Score Upgraded";
        cardData.description = `Reached ${user?.trustScore || 50} points`;
        break;
      case "first-post":
        cardData.title = "📝 First Post Published";
        cardData.description = "Started building in public on Winners Community";
        break;
      default:
        cardData.title = "🎉 Achievement Unlocked";
    }

    cardData.shareUrl = `https://winnersempire.io/achievements/${type}`;
    cardData.brand = "⬡ Winners Community";
    cardData.tagline = "Post your skills. Unlock your future.";

    res.json({ card: cardData });
  } catch (error) {
    console.error("Achievement share error:", error);
    res.status(500).json({ error: "Failed to generate share card" });
  }
});

// ============================================
// WEEKLY INTELLIGENCE REPORT
// ============================================

router.get("/insights/weekly", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const posts = await db.post.findMany({
      where: { authorId: userId, createdAt: { gte: weekAgo } },
      select: { id: true, content: true, createdAt: true },
    });

    const followers = await db.follow.findMany({
      where: { followingId: userId, createdAt: { gte: weekAgo } },
    });

    const recommendation = posts.length === 0 
      ? "Post your first update this week to start building your presence."
      : "Keep building in public - your content is being noticed.";

    const report = {
      period: { from: weekAgo, to: new Date() },
      metrics: {
        postsPublished: posts.length,
        followersGained: followers.length,
      },
      recommendation,
    };

    res.json({ report });
  } catch (error) {
    console.error("Weekly report error:", error);
    res.status(500).json({ error: "Failed to generate weekly report" });
  }
});

// ============================================
// NOVA INSIGHT BANNER
// ============================================

router.get("/insights/banner", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, trustScore: true },
    });

    const lastPost = await db.post.findFirst({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
    });

    let insight = "";
    if (!lastPost) {
      insight = `Welcome to Winners Community, ${user?.name || 'Builder'}! Share what you're working on and NOVA will help connect your skills to opportunities.`;
    } else {
      insight = `Your last post is getting attention. Keep posting consistently to build your presence.`;
    }

    res.json({
      insight,
      user: { name: user?.name, trustScore: user?.trustScore },
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Insight banner error:", error);
    res.status(500).json({ error: "Failed to generate insight" });
  }
});

// ============================================
// OPPORTUNITY BOARD
// ============================================

router.get("/opportunities", async (req: Request, res: Response) => {
  try {
    const opportunities = [
      {
        type: "skill-match",
        title: "React Developer",
        budget: "$2,400 contract",
        description: "CIRCUIT matched this to your profile",
        link: "/work",
        priority: "medium",
      },
      {
        type: "learning-gap",
        title: "Advanced Node.js",
        budget: "SAGE recommends",
        description: "Completes your learning path",
        link: "/academy",
        priority: "medium",
      },
    ];

    res.json({ opportunities, lastUpdated: new Date() });
  } catch (error) {
    console.error("Opportunities error:", error);
    res.status(500).json({ error: "Failed to get opportunities" });
  }
});

// ============================================
// FEED PREFERENCES
// ============================================

router.get("/feed-preferences", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    let prefs = await db.userFeedPreference.findUnique({ where: { userId } });

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

router.put("/feed-preferences", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const feedModeRaw = String(req.body?.feedMode ?? "foryou");
    const allowedFeedModes = new Set(["foryou", "following", "intelligence"]);
    const feedMode = allowedFeedModes.has(feedModeRaw) ? feedModeRaw : "foryou";
    const novaIntelligence = req.body?.novaIntelligence;
    const quickPostEnabled = req.body?.quickPostEnabled;

    const createData: {
      userId: string;
      feedMode: string;
      novaIntelligence?: boolean;
      quickPostEnabled?: boolean;
    } = {
      userId,
      feedMode,
    };

    if (typeof novaIntelligence === "boolean") createData.novaIntelligence = novaIntelligence;
    if (typeof quickPostEnabled === "boolean") createData.quickPostEnabled = quickPostEnabled;

    const updateData: {
      feedMode: string;
      novaIntelligence?: boolean;
      quickPostEnabled?: boolean;
    } = {
      feedMode,
    };

    if (typeof novaIntelligence === "boolean") updateData.novaIntelligence = novaIntelligence;
    if (typeof quickPostEnabled === "boolean") updateData.quickPostEnabled = quickPostEnabled;

    const prefs = await db.userFeedPreference.upsert({
      where: { userId },
      create: createData,
      update: updateData,
    });

    res.json({ preferences: prefs });
  } catch (error) {
    console.error("Failed to update feed preferences:", error);
    res.status(500).json({ error: "Failed to update feed preferences" });
  }
});

// ============================================
// INTELLIGENCE FEED MODE
// ============================================

router.get("/feed/intelligence", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const page = parseInt(String(req.query.page ?? "1"));
    const limit = parseInt(String(req.query.limit ?? "15"));

    // Get posts with high engagement
    const posts = await db.post.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        author: { select: { id: true, name: true, trustScore: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId }, select: { id: true } },
        tags: { include: { tag: true } },
      },
      orderBy: [{ engagementScore: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await db.post.count({ where: { tenantId, deletedAt: null } });

    res.json({
      posts: posts.map((post) => ({
        ...post,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        liked: post.likes.length > 0,
        tags: post.tags.map((t) => t.tag.name),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      novaContext: { recommendations: `NOVA selected ${posts.length} posts for your feed` },
    });
  } catch (error) {
    console.error("Intelligence feed error:", error);
    res.status(500).json({ error: "Failed to get intelligence feed" });
  }
});

export default router;
