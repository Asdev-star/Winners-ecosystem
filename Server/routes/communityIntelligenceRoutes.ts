// Server/routes/communityIntelligenceRoutes.ts
// Phase 2 V2.0: Community Intelligence Upgrade
// NOVA AI-powered skill detection, insights, and cross-layer handoffs

import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";

// Claude API client for NOVA intelligence
let anthropic: any = null;
try {
  const Anthropic = require("@anthropic-ai/sdk");
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
} catch (e) {
  console.warn("[NOVA] Anthropic SDK not available - using fallback detection");
}

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

// ============================================
// NOVA SKILL DETECTION - Claude API Powered
// ============================================

async function detectSkillsWithNOVA(
  content: string,
  userId: string
): Promise<Array<{ skill: string; confidence: number; category: string }>> {
  // If Claude API is available, use it for intelligent detection
  if (anthropic) {
    try {
      // Get user's existing skills for context
      const existingSkills = await db.novaSkillDetection.findMany({
        where: { userId },
        select: { skill: true },
        distinct: ["skill"],
        orderBy: { confidence: "desc" },
        take: 10,
      });

      const existingSkillNames = existingSkills.map((s) => s.skill).join(", ");

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `You are NOVA, the Winners Ecosystem Community Intelligence Supervisor.

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

Post content: "${content.substring(0, 2000)}"`,
          },
        ],
      });

      const raw =
        message.content[0].type === "text" ? message.content[0].text : "{}";
      let parsed;
      try {
        parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      } catch {
        parsed = { skills: [], summary: "" };
      }

      if (parsed.skills && parsed.skills.length > 0) {
        return parsed.skills
          .filter((s: any) => s.confidence >= 0.65)
          .slice(0, 5)
          .map((s: any) => ({
            skill: s.name,
            confidence: Math.round(s.confidence * 100),
            category: s.category || "technical",
          }));
      }
    } catch (error) {
      console.error("[NOVA] Claude API error, falling back to pattern matching:", error);
    }
  }

  // Fallback: pattern-based detection
  const skills: Array<{ skill: string; confidence: number; category: string }> = [];

  const skillPatterns = [
    { pattern: /react|reactjs|react\.js/gi, skill: "React.js", category: "technical" },
    { pattern: /typescript|ts\b/gi, skill: "TypeScript", category: "technical" },
    { pattern: /node\.?js|express/gi, skill: "Node.js", category: "technical" },
    { pattern: /python/gi, skill: "Python", category: "technical" },
    { pattern: /next\.?js/gi, skill: "Next.js", category: "technical" },
    { pattern: /figma|ui\s*design/gi, skill: "UI/UX Design", category: "creative" },
    { pattern: /docker|kubernetes|k8s/gi, skill: "DevOps", category: "technical" },
    { pattern: /aws|azure|gcp/gi, skill: "Cloud Computing", category: "technical" },
    { pattern: /python|ml|machine\s*learning|ai|artificial\s*intelligence/gi, skill: "AI/ML", category: "technical" },
    { pattern: /javascript|js\b/gi, skill: "JavaScript", category: "technical" },
    { pattern: /postgresql|mongodb|mysql|sql/gi, skill: "Databases", category: "technical" },
    { pattern: /git|github|version\s*control/gi, skill: "Version Control", category: "technical" },
    { pattern: /api|rest|graphql/gi, skill: "API Development", category: "technical" },
    { pattern: /marketing|seo|advertising/gi, skill: "Digital Marketing", category: "business" },
    { pattern: /copywriting|content\s*writing|blogging/gi, skill: "Content Writing", category: "creative" },
    { pattern: /video\s*editing|animation|motion\s*graphics/gi, skill: "Video Editing", category: "creative" },
    { pattern: /photography|photo\s*editing/gi, skill: "Photography", category: "creative" },
    { pattern: /business\s*plan|startup|entrepreneurship/gi, skill: "Entrepreneurship", category: "business" },
    { pattern: /accounting|bookkeeping|finance/gi, skill: "Finance", category: "business" },
    { pattern: /public\s*speaking|presentation/gi, skill: "Public Speaking", category: "soft" },
    { pattern: /leadership|team\s*management/gi, skill: "Leadership", category: "soft" },
  ];

  for (const { pattern, skill, category } of skillPatterns) {
    if (pattern.test(content)) {
      // Stored confidence is 0-100 for analytics consistency
      skills.push({ skill, confidence: 75 + Math.random() * 20, category });
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

    const detectedSkills = await detectSkillsWithNOVA(content, userId);

    if (postId) {
      const post = await db.post.findFirst({
        where: { id: postId, tenantId, deletedAt: null },
        select: { id: true },
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Get io from app for WebSocket emission
      const io = req.app.get("io");

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
          })
        )
      );

      // Emit WebSocket event for real-time handoff card
      if (io && detectedSkills.length > 0) {
        io.to(`user:${userId}`).emit("nova:skill_detected", {
          skills: detectedSkills,
          postId,
          timestamp: new Date(),
        });

        // Update Agentic Loop progress
        await db.agenticLoopProgress.upsert({
          where: { userId },
          create: {
            userId,
            stage: 2,
            stageName: "skill_detection",
            currentStage: "academy",
            skillsDetected: 1,
            lastActivity: new Date(),
          },
          update: {
            currentStage: "academy",
            skillsDetected: { increment: 1 },
            lastActivity: new Date(),
          },
        });
      }
    }

    res.json({
      skills: detectedSkills.map((skill) => ({
        name: skill.skill,
        confidence: skill.confidence / 100,
        category: skill.category,
      })),
      message:
        detectedSkills.length > 0
          ? `NOVA detected ${detectedSkills.length} skill(s) in your post`
          : "No skills detected in this post",
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

    const allSkills: Record<
      string,
      { skill: string; confidence: number; category: string; count: number }
    > = {};
    detections.forEach((detection) => {
      const normalizedConfidence = detection.confidence / 100;
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
          normalizedConfidence
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
        cardData.description =
          "Started building in public on Winners Community";
        break;
      case "skill-detected":
        cardData.title = "🎯 First Skill Detected";
        cardData.description = "NOVA identified your first skill";
        break;
      case "certificate":
        cardData.title = "🎓 Course Completed";
        cardData.description = "Earned a certificate on Winners Academy";
        break;
      case "contract":
        cardData.title = "💼 First Contract Won";
        cardData.description = "Started earning on Winners Work";
        break;
      case "loop-complete":
        cardData.title = "🔄 Agentic Loop Complete";
        cardData.description = "Completed your first Winners Loop";
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
// NOVA WEEKLY INTELLIGENCE REPORT
// ============================================

router.get("/insights/weekly", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [posts, likes, comments, followers, skillsCount, loopProgress] =
      await Promise.all([
        db.post.findMany({
          where: { authorId: userId, createdAt: { gte: weekAgo } },
          select: { id: true, _count: { select: { likes: true, comments: true } } },
        }),
        db.like.count({ where: { post: { authorId: userId }, createdAt: { gte: weekAgo } } }),
        db.comment.count({ where: { post: { authorId: userId }, createdAt: { gte: weekAgo } } }),
        db.follow.count({ where: { followingId: userId, createdAt: { gte: weekAgo } } }),
        db.novaSkillDetection.count({ where: { userId, createdAt: { gte: weekAgo } } }),
        db.agenticLoopProgress.findUnique({ where: { userId } }),
      ]);

    const totalEngagement = likes + comments;
    
    // Find best post by engagement
    let bestPostEngagement = 0;
    for (const p of posts) {
      const engagement = p._count.likes + p._count.comments;
      if (engagement > bestPostEngagement) {
        bestPostEngagement = engagement;
      }
    }

    // Get job matches from Work layer (via opportunities)
    const opportunities = await db.opportunity.findMany({
      where: { status: "ACTIVE", expiresAt: { gte: new Date() } },
      take: 10,
    });

    let recommendation = "";
    if (posts.length === 0) {
      recommendation =
        "Post your first update this week to start building your presence.";
    } else if (totalEngagement < 5) {
      recommendation =
        "Your content is great but needs more visibility. Try adding more specific skill tags.";
    } else if (skillsCount > 0 && !loopProgress?.currentStage?.includes("academy")) {
      recommendation =
        "NOVA detected skills in your posts. Consider taking a related course to certify them.";
    } else {
      recommendation =
        "Keep building in public - your content is being noticed.";
    }

    const report = {
      period: { from: weekAgo, to: new Date() },
      metrics: {
        postsPublished: posts.length,
        totalEngagement,
        followersGained: followers,
        skillsDetected: skillsCount,
        bestPostEngagement,
      },
      stage: loopProgress?.currentStage || "community",
      opportunitiesCount: opportunities.length,
      recommendation,
    };

    res.json({ report });
  } catch (error) {
    console.error("Weekly report error:", error);
    res.status(500).json({ error: "Failed to generate weekly report" });
  }
});

// ============================================
// NOVA INSIGHT BANNER - Personalized Context
// ============================================

router.get("/insights/banner", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Gather user context (parallel queries)
    const [user, recentPosts, topSkills, loopProgress, recentFollowers] =
      await Promise.all([
        db.user.findUnique({
          where: { id: userId },
          select: { name: true, trustScore: true, trustScoreTier: true },
        }),
        db.post.findMany({
          where: { authorId: userId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { _count: { select: { likes: true, comments: true } } },
        }),
        db.novaSkillDetection.findMany({
          where: { userId },
          orderBy: { confidence: "desc" },
          take: 3,
        }),
        db.agenticLoopProgress.findUnique({ where: { userId } }),
        db.follow.count({
          where: {
            followingId: userId,
            createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
          },
        }),
      ]);

    const topPostLikes = Math.max(
      ...recentPosts.map((p) => p._count.likes),
      0
    );
    const daysSinceLastPost = recentPosts[0]
      ? Math.floor(
          (Date.now() - new Date(recentPosts[0].createdAt).getTime()) /
            86400000
        )
      : 99;

    // Generate personalized insight
    let insight = "";

    if (!recentPosts[0]) {
      insight = `Welcome to Winners Community, ${
        user?.name || "Builder"
      }! Share what you're working on and NOVA will help connect your skills to opportunities.`;
    } else if (daysSinceLastPost > 7) {
      insight = `You haven't posted in ${daysSinceLastPost} days. Your audience is waiting!`;
    } else if (topSkills.length > 0 && !loopProgress?.currentStage?.includes("academy")) {
      insight = `NOVA detected ${topSkills[0].skill} in your posts. Certify it with a SAGE course to unlock Work opportunities.`;
    } else if (recentFollowers > 5) {
      insight = `${recentFollowers} new followers this week! Your ${topSkills[0]?.skill || "content"} is resonating.`;
    } else if (topPostLikes > 20) {
      insight = `Your post got ${topPostLikes} likes — your best this month! Keep posting about ${topSkills[0]?.skill || "your expertise"}.`;
    } else {
      insight = `Your Trust Score is ${user?.trustScore || 50}. Post consistently to build your presence.`;
    }

    res.json({
      insight,
      user: {
        name: user?.name,
        trustScore: user?.trustScore,
        trustScoreTier: user?.trustScoreTier,
      },
      skills: topSkills,
      loopStage: loopProgress?.currentStage || "community",
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Insight banner error:", error);
    res.status(500).json({ error: "Failed to generate insight" });
  }
});

// ============================================
// OPPORTUNITY BOARD - Cross-Layer Handoffs
// ============================================

router.get("/opportunities", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get user's detected skills
    const userSkills = await db.novaSkillDetection.findMany({
      where: { userId, confidence: { gte: 75 } },
      select: { skill: true },
      distinct: ["skill"],
    });
    const skillNames = userSkills.map((s) => s.skill);

    // Get active opportunities from Work layer
    const workOpportunities = await db.opportunity.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { gte: new Date() },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    // Match opportunities to user skills
    const matchedOpportunities = workOpportunities
      .filter((opp) =>
        skillNames.some((skill) =>
          opp.title?.toLowerCase().includes(skill.toLowerCase()) ||
          opp.description?.toLowerCase().includes(skill.toLowerCase())
        )
      )
      .slice(0, 3);

    const opportunities = {
      skillMatch: {
        type: "WORK",
        label: "SKILL MATCH",
        supervisor: "CIRCUIT",
        title:
          skillNames.length > 0
            ? `${skillNames[0]} opportunities available`
            : "Complete your profile to see matches",
        description: `${skillNames.length} skills detected by NOVA`,
        ctaLabel: "View Jobs →",
        ctaHref: `/work?skills=${skillNames.join(",")}`,
        items: matchedOpportunities.map((opp) => ({
          title: opp.title,
          budget: opp.budget,
          link: `/work/opportunities/${opp.id}`,
        })),
      },
      learningGap: {
        type: "ACADEMY",
        label: "LEARNING GAP",
        supervisor: "SAGE",
        title: "Courses matching your detected skills",
        description: `${skillNames.length} skills ready to certify`,
        ctaLabel: "See Courses →",
        ctaHref: `/academy?skills=${skillNames.join(",")}`,
      },
      marketOpening: {
        type: "MARKET",
        label: "MARKET OPENING",
        supervisor: "ATLAS",
        title: "Products you could create from your skills",
        description: "Based on your community activity",
        ctaLabel: "Explore →",
        ctaHref: "/market",
      },
    };

    res.json({ opportunities, lastUpdated: new Date() });
  } catch (error) {
    console.error("Opportunities error:", error);
    res.status(500).json({ error: "Failed to get opportunities" });
  }
});

// ============================================
// USER OPPORTUNITY STATUS (Open to Opportunities)
// ============================================

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
      isEnabled: user?.openToOpportunities || false,
      status: user?.opportunityStatus || "EXPLORING",
      bio: user?.opportunityBio || null,
    });
  } catch (error) {
    console.error("Get opportunity status error:", error);
    res.status(500).json({ error: "Failed to get opportunity status" });
  }
});

router.put("/opportunity-status", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { isEnabled, status, bio } = req.body;

    const validStatuses = [
      "LOOKING_FOR_WORK",
      "OPEN_TO_COLLAB",
      "HIRING",
      "BUILDING",
      "EXPLORING",
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: {
        openToOpportunities: isEnabled ?? true,
        opportunityStatus: status,
        opportunityBio: bio,
      },
      select: {
        openToOpportunities: true,
        opportunityStatus: true,
        opportunityBio: true,
      },
    });

    res.json({
      success: true,
      ...user,
    });
  } catch (error) {
    console.error("Update opportunity status error:", error);
    res.status(500).json({ error: "Failed to update opportunity status" });
  }
});

// ============================================
// CROSS-LAYER HANDOFF EVENTS
// ============================================

router.get("/loop-status", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const loop = await db.agenticLoopProgress.findUnique({
      where: { userId },
    });

    const skills = await db.novaSkillDetection.findMany({
      where: { userId },
      select: { skill: true, confidence: true, category: true },
      orderBy: { confidence: "desc" },
      take: 5,
    });

    // Get certificates with course info
    const certs = await db.certificate.findMany({
      where: { userId },
      include: { course: { select: { title: true } } },
      orderBy: { issuedAt: "desc" },
      take: 3,
    });

    const certificatesWithTitle = certs.map((cert) => ({
      id: cert.id,
      courseName: cert.course.title,
      issuedAt: cert.issuedAt,
    }));

    res.json({
      loop: loop || {
        stage: 1,
        stageName: "community",
        currentStage: "community",
      },
      skills,
      certificates: certificatesWithTitle,
      nextAction: loop?.currentStage === "academy" ? "Take a course" : 
                   loop?.currentStage === "work" ? "Apply to jobs" :
                   "Post more to trigger skill detection",
    });
  } catch (err: unknown) {
    console.error("Get loop status error:", err);
    res.status(500).json({ error: "Failed to get loop status" });
  }
});

export default router;
