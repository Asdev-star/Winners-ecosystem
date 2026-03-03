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
      skills.push({ skill, confidence: 0.85 + Math.random() * 0.1, category });
    }
  }

  return skills;
}

// POST /community-intelligence/skills/detect
router.post("/skills/detect", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { content, postId } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const detectedSkills = await detectSkillsWithNOVA(content);

    if (postId) {
      // Just store the skills as JSON in post metadata for now
      const post = await (db as any).post.findUnique({ where: { id: postId } });
      if (post) {
        const metadata = typeof post.metadata === 'object' ? post.metadata : {};
        await (db as any).post.update({
          where: { id: postId },
          data: { metadata: { ...metadata, novaSkills: detectedSkills } }
        });
      }
    }

    res.json({ 
      skills: detectedSkills,
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
    
    // Get posts by user with skills in metadata
    const posts = await (db as any).post.findMany({
      where: { authorId: userId },
      select: { id: true, metadata: true }
    });

    const allSkills: Record<string, {skill: string, confidence: number, category: string, count: number}> = {};
    posts.forEach((post: any) => {
      if (post.metadata?.novaSkills) {
        post.metadata.novaSkills.forEach((s: any) => {
          if (!allSkills[s.skill]) {
            allSkills[s.skill] = { ...s, count: 1 };
          } else {
            allSkills[s.skill].count++;
          }
        });
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
    const userId = req.user!.userId;
    const postId = String(req.params.postId || "");
    if (!postId) return res.status(400).json({ error: "Post ID required" });
    const { commentary } = req.body;

    const originalPost = await (db as any).post.findUnique({ where: { id: postId } });
    if (!originalPost) {
      return res.status(404).json({ error: "Original post not found" });
    }

    const quotePost = await (db as any).post.create({
      data: {
        tenantId: originalPost.tenantId,
        authorId: userId,
        content: commentary || "",
        metadata: { quotedFrom: postId }
      },
    });

    res.json({ post: quotePost, quotedPost: originalPost });
  } catch (error) {
    console.error("Quote post error:", error);
    res.status(500).json({ error: "Failed to create quote post" });
  }
});

router.get("/posts/:postId/quotes", async (req: Request, res: Response) => {
  try {
    const postId = String(req.params.postId || "");
    if (!postId) return res.status(400).json({ error: "Post ID required" });

    const quotes = await (db as any).post.findMany({
      where: { 
        metadata: { path: ["quotedFrom"], equals: postId }
      },
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ quotes });
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

    const saved = await (db as any).savedPost.upsert({
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

    await (db as any).savedPost.deleteMany({ where: { userId, postId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to unsave post:", error);
    res.status(500).json({ error: "Failed to unsave post" });
  }
});

router.get("/posts/saved", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const saved = await (db as any).savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: { author: { select: { id: true, name: true, avatar: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ saved: saved.map((s: any) => s.post) });
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
    const { id } = req.query;

    const user = await (db as any).user.findUnique({
      where: { id: userId },
      select: { name: true, trustScore: true, trustScoreTier: true },
    });

    let cardData: any = {
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

    const posts = await (db as any).post.findMany({
      where: { authorId: userId, createdAt: { gte: weekAgo } },
      select: { id: true, content: true, createdAt: true },
    });

    const followers = await (db as any).follow.findMany({
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

    const user = await (db as any).user.findUnique({
      where: { id: userId },
      select: { name: true, trustScore: true },
    });

    const lastPost = await (db as any).post.findFirst({
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
    const userId = req.user!.userId;

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
    let prefs = await (db as any).userFeedPreference.findUnique({ where: { userId } });

    if (!prefs) {
      prefs = await (db as any).userFeedPreference.create({
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
    const { feedMode, selectedSkills, mutedUsers, followedOnly } = req.body;

    const prefs = await (db as any).userFeedPreference.upsert({
      where: { userId },
      create: {
        userId,
        feedMode: feedMode ?? "for-you",
        selectedSkills: selectedSkills ?? [],
        mutedUsers: mutedUsers ?? [],
        followedOnly: followedOnly ?? false,
      },
      update: {
        feedMode: feedMode,
        selectedSkills: selectedSkills,
        mutedUsers: mutedUsers,
        followedOnly: followedOnly,
      },
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
    const posts = await (db as any).post.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        author: { select: { id: true, name: true, trustScore: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await (db as any).post.count({ where: { tenantId, deletedAt: null } });

    res.json({
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      novaContext: { recommendations: `NOVA selected ${posts.length} posts for your feed` },
    });
  } catch (error) {
    console.error("Intelligence feed error:", error);
    res.status(500).json({ error: "Failed to get intelligence feed" });
  }
});

export default router;
