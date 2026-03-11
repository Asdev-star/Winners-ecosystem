// Phase 5 - Intelligence Layer
// Routes: autonomousRoutes
// Autonomous actions, weekly reports, proposal scoring, credit management

import { NextFunction, Request, Response, Router } from "express";
import db from "../db.js";
import { callAnthropicAndParseJson } from "../services/aiService.js";

const router = Router();
const prisma = db;

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

// Middleware to require authentication
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// GET /autonomous/weekly-report - Get or generate weekly intelligence report
router.get(
  "/weekly-report",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const tenantId = req.user!.tenantId;
      const forceRegenerate = req.query.force === "true";

      // Check for existing report from last 7 days
      if (!forceRegenerate) {
        const existing = await prisma.communityInsight.findFirst({
          where: {
            userId,
            type: "weekly_report",
            createdAt: { gte: new Date(Date.now() - SEVEN_DAYS_IN_MS) },
          },
          orderBy: { createdAt: "desc" },
        });

        if (existing) {
          return res.json({
            report: JSON.parse(existing.content),
            cached: true,
          });
        }
      }

      // Gather user data for report
      const [posts, skills, certificates, enrollments, followers, following] =
        await Promise.all([
          prisma.post.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: { _count: { select: { likes: true, comments: true } } },
          }),
          prisma.novaSkillDetection.findMany({
            where: { userId },
            orderBy: { confidence: "desc" },
            take: 5,
          }),
          prisma.certificate.count({ where: { userId } }),
          prisma.enrollment.count({
            where: { userId, completedAt: { not: null } },
          }),
          prisma.follow.count({ where: { followingId: userId } }),
          prisma.follow.count({ where: { followerId: userId } }),
        ]);

      const engagementThisWeek = posts.reduce(
        (sum, p) => sum + p._count.likes + p._count.comments,
        0,
      );
      const daysSinceLastPost = posts[0]
        ? Math.floor(
            (Date.now() - new Date(posts[0].createdAt).getTime()) /
              ONE_DAY_IN_MS,
          )
        : null;

      // Generate report using Claude
      const prompt = `You are NOVA, the Winners Ecosystem Community Intelligence Supervisor.

Generate a personalized weekly intelligence report for this user. Be warm, direct, and actionable.

USER WEEKLY DATA:
- Posts this week: ${posts.length}
- Total engagement: ${engagementThisWeek} interactions
- Days since last post: ${daysSinceLastPost === null ? "no recent posts" : daysSinceLastPost}
- Skills detected: ${skills.map((s) => s.skill).join(", ") || "none"}
- Certificates earned: ${certificates}
- Courses completed: ${enrollments}
- Followers: ${followers}
- Following: ${following}

Generate a JSON response:
{
  "greeting": "personalized greeting",
  "momentum": "summary of their week",
  "bestMove": "their best move this week",
  "skillsDetected": "skills NOVA detected this week",
  "whatYouMissed": "opportunities they may have missed",
  "nextPriority": "one priority action for next week",
  "callToAction": "specific link or action to take"
}`;

      const report = await callAnthropicAndParseJson(
        prompt,
        { model: "claude-sonnet-4-6", max_tokens: 1000 },
        { raw: "Failed to generate report content from AI." },
      );

      // Save to database
      await prisma.communityInsight.create({
        data: {
          tenantId,
          userId,
          type: "weekly_report",
          title: `Weekly Report - ${new Date().toISOString().split("T")[0]}`,
          content: JSON.stringify(report),
          metadata: {
            postsCount: posts.length,
            engagement: engagementThisWeek,
            skillsCount: skills.length,
          },
        },
      });

      res.json({ report, cached: false });
    } catch (error) {
      console.error("Weekly report error:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  },
);

// POST /circuit/proposal-score - Get win probability for a proposal
router.post(
  "/circuit/proposal-score",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { proposalText, jobDescription } = req.body;

      if (!proposalText || !jobDescription) {
        return res
          .status(400)
          .json({ error: "proposalText and jobDescription are required" });
      }

      // Get user credentials
      const [skills, certificates, posts] = await Promise.all([
        prisma.novaSkillDetection.findMany({
          where: { userId, confidence: { gte: 0.75 } },
          distinct: ["skill"],
          select: { skill: true },
        }),
        prisma.certificate.count({ where: { userId } }),
        prisma.post.count({ where: { authorId: userId } }),
      ]);

      const userSkills = skills.map((s) => s.skill);

      // Analyze proposal using Claude
      const prompt = `You are CIRCUIT, the Winners Ecosystem Work Matchmaker.

Analyze this job proposal and calculate a win probability score.

USER PROFILE:
- Skills: ${userSkills.join(", ") || "none"}
- Certificates: ${certificates}
- Community Posts: ${posts}

JOB DESCRIPTION:
${jobDescription}

PROPOSAL:
${proposalText}

Calculate a JSON response:
{
  "winProbability": 0-100,
  "strengths": ["what makes this proposal strong"],
  "weaknesses": ["areas for improvement"],
  "recommendations": ["specific improvements to increase win chance"],
  "skillMatch": "high|medium|low - how well user skills match job requirements"
}`;

      const analysis = await callAnthropicAndParseJson(
        prompt,
        { model: "claude-sonnet-4-6", max_tokens: 800 },
        { winProbability: null, error: "Could not parse analysis from AI." },
      );

      res.json(analysis);
    } catch (error) {
      console.error("Proposal score error:", error);
      res.status(500).json({ error: "Failed to score proposal" });
    }
  },
);

// GET /insights/trending - Get trending skills/topics in the ecosystem
router.get(
  "/insights/trending",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      // Get trending skills from recent posts
      const recentSkills = await prisma.novaSkillDetection.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - SEVEN_DAYS_IN_MS) },
        },
        select: { skill: true, confidence: true },
        orderBy: { createdAt: "desc" },
      });

      // Count skill occurrences
      const skillCounts = recentSkills.reduce<Record<string, number>>(
        (acc, s) => {
          acc[s.skill] = (acc[s.skill] || 0) + 1;
          return acc;
        },
        {},
      );

      const trending = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, count }));

      res.json({ trending });
    } catch (error) {
      console.error("Trending error:", error);
      res.status(500).json({ error: "Failed to get trending" });
    }
  },
);

// POST /insights/analyze-content - Analyze content for skill detection
router.post(
  "/insights/analyze-content",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: "content is required" });
      }

      const prompt = `You are NOVA, the Winners Ecosystem Community Intelligence Supervisor.

Analyze this content and identify professional skills demonstrated or discussed.

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

Content: "${content.substring(0, 2000)}"`;

      const analysis = await callAnthropicAndParseJson(
        prompt,
        { model: "claude-sonnet-4-6", max_tokens: 500 },
        { skills: [], summary: "Failed to analyze content." },
      );

      res.json(analysis);
    } catch (error) {
      console.error("Analyze content error:", error);
      res.status(500).json({ error: "Failed to analyze content" });
    }
  },
);

export default router;
