// Phase 5 - Intelligence Layer
// Routes: omegaRoutes
// OMEGA AI Supervisor routes - analysis, briefing, health, forecast

import { Router, Request, Response } from "express";
import db from "../db.js";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();
const prisma = db;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Middleware to require authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// GET /omega/analyze - Get comprehensive user analysis
router.get("/analyze", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;

    // Gather user data from all layers
    const [
      user,
      skills,
      certificates,
      enrollments,
      posts,
      followers,
      following,
      loopProgress
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.novaSkillDetection.findMany({
        where: { userId },
        orderBy: { confidence: "desc" },
        take: 10
      }),
      prisma.certificate.findMany({ where: { userId } }),
      prisma.enrollment.findMany({
        where: { userId },
        include: { course: true }
      }),
      prisma.post.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.agenticLoopProgress.findUnique({ where: { userId } })
    ]);

    // Calculate trust score components
    const trustScoreComponents = {
      profileCompleteness: user?.name && user?.email ? 80 : 40,
      skillsDetected: Math.min(skills.length * 10, 30),
      certificatesEarned: certificates.length * 15,
      communityEngagement: Math.min(posts.length * 2, 20),
      networkSize: Math.min(followers * 0.5, 20)
    };

    const trustScore = Object.values(trustScoreComponents).reduce((a, b) => a + b, 0);

    // Determine current loop stage
    let currentStage = "community";
    if (enrollments.some(e => e.completedAt)) currentStage = "academy";
    if (loopProgress?.currentStage) currentStage = loopProgress.currentStage;

    // Generate AI insights using Claude
    const prompt = `You are OMEGA, the Winners Ecosystem Master Orchestrator.

Analyze this user's ecosystem profile and provide strategic insights:

USER PROFILE:
- Trust Score: ${trustScore}/100
- Skills Detected: ${skills.map(s => s.skill).join(", ") || "none"}
- Certificates: ${certificates.length}
- Courses Enrolled: ${enrollments.length}
- Posts: ${posts.length}
- Followers: ${followers}
- Following: ${following}
- Current Stage: ${currentStage}

Provide a JSON response with:
{
  "strengths": ["top 3 strengths based on their data"],
  "opportunities": ["top 3 growth opportunities"],
  "nextBestAction": "one specific action they should take",
  "predictedOutcome": "what happens if they take that action",
  "ecosystemHealth": "excellent|good|needs_attention"
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }]
    });

    let insights;
    try {
      const text = message.content[0].type === "text" ? message.content[0].text : "{}";
      insights = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      insights = {
        strengths: ["Active community member"],
        opportunities: ["Complete more courses"],
        nextBestAction: "Post more content to get skills detected",
        predictedOutcome: "Higher trust score",
        ecosystemHealth: "good"
      };
    }

    res.json({
      userId,
      trustScore,
      trustScoreComponents,
      currentStage,
      skills,
      certificates: certificates.length,
      enrollments: enrollments.length,
      posts: posts.length,
      followers,
      following,
      insights,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Omega analyze error:", error);
    res.status(500).json({ error: "Failed to generate analysis" });
  }
});

// GET /omega/briefing - Get personalized daily briefing
router.get("/briefing", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Get recent activity
    const [
      recentPosts,
      recentEnrollments,
      newFollowers,
      skills
    ] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { likes: true, comments: true } } }
      }),
      prisma.enrollment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { course: true }
      }),
      prisma.follow.findMany({
        where: { followingId: userId },
        orderBy: { createdAt: "desc" },
        take: 5
      }),
      prisma.novaSkillDetection.findMany({
        where: { userId },
        orderBy: { confidence: "desc" },
        take: 5
      })
    ]);

    // Calculate metrics
    const engagementThisWeek = recentPosts.reduce((sum, p) => sum + p._count.likes + p._count.comments, 0);
    const daysSinceLastPost = recentPosts[0]
      ? Math.floor((Date.now() - new Date(recentPosts[0].createdAt).getTime()) / 86400000)
      : 99;

    // Generate personalized briefing
    const prompt = `You are OMEGA, the Winners Ecosystem Master Orchestrator.

Generate a personalized daily briefing for this user. Be warm, direct, and actionable.

CURRENT STATUS:
- Posts this week: ${recentPosts.length}
- Total engagement: ${engagementThisWeek} interactions
- Days since last post: ${daysSinceLastPost}
- Top skills: ${skills.map(s => s.skill).join(", ") || "none"}
- Active courses: ${recentEnrollments.length}
- New followers: ${newFollowers.length}

Generate a JSON response:
{
  "greeting": "personalized greeting based on their activity",
  "highlights": ["3 key things to know today"],
  "actionItems": ["3 specific actions to take today"],
  "motivation": "one sentence of encouragement"
}`;

    // Stream the response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }]
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ token: chunk.delta.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Omega briefing error:", error);
    res.status(500).json({ error: "Failed to generate briefing" });
  }
});

// GET /omega/health - Get ecosystem health metrics
router.get("/health", requireAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    // Get community health metrics
    const [
      totalUsers,
      activeUsers,
      totalPosts,
      totalSkills,
      avgTrustScore
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.user.count({
        where: {
          tenantId,
          updatedAt: { gte: new Date(Date.now() - 7 * 86400000) }
        }
      }),
      prisma.post.count(),
      prisma.novaSkillDetection.count(),
      prisma.user.aggregate({
        where: { tenantId },
        _avg: { trustScore: true }
      })
    ]);

    // Calculate health indicators
    const health = {
      community: {
        totalUsers,
        activeUsers,
        activeRatio: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
        status: activeUsers > 10 ? "healthy" : "growing"
      },
      engagement: {
        totalPosts,
        postsPerUser: totalUsers > 0 ? totalPosts / totalUsers : 0,
        status: totalPosts > 100 ? "healthy" : "needs_boost"
      },
      intelligence: {
        skillsDetected: totalSkills,
        avgTrustScore: avgTrustScore._avg.trustScore || 0,
        status: totalSkills > 50 ? "healthy" : "early"
      },
      overall: activeUsers > 10 && totalPosts > 50 ? "excellent" : 
               activeUsers > 5 && totalPosts > 20 ? "good" : "developing"
    };

    res.json(health);
  } catch (error) {
    console.error("Omega health error:", error);
    res.status(500).json({ error: "Failed to get health metrics" });
  }
});

// GET /omega/forecast - Get revenue/growth predictions
router.get("/forecast", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get user's business metrics
    const [
      skills,
      certificates,
      completedEnrollments,
      loopProgress
    ] = await Promise.all([
      prisma.novaSkillDetection.findMany({
        where: { userId, confidence: { gte: 0.75 } },
        select: { skill: true }
      }),
      prisma.certificate.count({ where: { userId } }),
      prisma.enrollment.count({ where: { userId, completedAt: { not: null } } }),
      prisma.agenticLoopProgress.findUnique({ where: { userId } })
    ]);

    // Simple prediction model
    const skillCount = skills.length;
    const certCount = certificates;
    const courseCount = completedEnrollments;

    // Predict based on loop completion
    let stage = "starter";
    if (loopProgress?.currentStage === "academy") stage = "learner";
    if (loopProgress?.currentStage === "work") stage = "earner";
    if (loopProgress?.currentStage === "market") stage = "seller";

    const predictions = {
      currentStage: stage,
      trustScoreProjection: Math.min(100, 30 + skillCount * 8 + certCount * 12),
      skillGrowthRate: skillCount > 0 ? "high" : skillCount > 3 ? "medium" : "building",
      revenuePotential: certCount > 2 ? "high" : certCount > 0 ? "medium" : "developing",
      timeline: {
        toIntermediate: courseCount >= 1 ? "achieved" : "2-4 weeks",
        toAdvanced: certCount >= 2 ? "achieved" : "1-3 months",
        toExpert: certCount >= 5 ? "achieved" : "3-6 months"
      },
      recommendations: [
        certCount === 0 ? "Complete your first course to unlock work opportunities" : null,
        skillCount < 3 ? "Post more to let NOVA detect your skills" : null,
        !loopProgress ? "Start your Agentic Loop to accelerate growth" : null
      ].filter(Boolean)
    };

    res.json(predictions);
  } catch (error) {
    console.error("Omega forecast error:", error);
    res.status(500).json({ error: "Failed to generate forecast" });
  }
});

export default router;
