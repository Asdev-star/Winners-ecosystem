// Phase 5 - Intelligence Layer
// Routes: omegaRoutes
// OMEGA AI Supervisor routes - analysis, briefing, health, forecast

import { Request, Response, Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";
import Anthropic from "@anthropic-ai/sdk";
import { callAnthropicAndParseJson } from "../services/aiService.js";

const router = Router();
const prisma = db;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function metadataObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeStringArray(value: unknown, limit = 3): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, limit);
}

function deriveMarketSignals(markets: string[]) {
  const has = (value: string) => markets.includes(value);
  const currencies = new Set<string>();
  const payments = new Set<string>();
  const languages = new Set<string>(["English"]);
  const seasonalSignals = new Set<string>();
  const communitySuggestions = new Set<string>();

  if (has("Nigeria specifically")) {
    currencies.add("NGN");
    payments.add("Flutterwave");
    payments.add("Paystack");
    payments.add("OPay");
    languages.add("Pidgin");
    seasonalSignals.add("Eid");
    seasonalSignals.add("year-end demand");
    communitySuggestions.add("Nigeria Builders");
  }
  if (has("Kenya specifically")) {
    currencies.add("KES");
    payments.add("M-Pesa (Safaricom)");
    payments.add("Flutterwave");
    languages.add("Swahili");
    seasonalSignals.add("KCSE season");
    communitySuggestions.add("Nairobi Builders");
  }
  if (has("Ghana specifically")) {
    currencies.add("GHS");
    payments.add("MTN MoMo");
    payments.add("Flutterwave");
    seasonalSignals.add("WASSCE season");
    communitySuggestions.add("Accra Builders");
  }
  if (has("South Africa specifically")) {
    currencies.add("ZAR");
    payments.add("Ozow");
    payments.add("Flutterwave");
    payments.add("Stripe");
    seasonalSignals.add("year-end demand");
    communitySuggestions.add("Johannesburg Operators");
  }
  if (has("Tanzania specifically")) {
    currencies.add("TZS");
    payments.add("Flutterwave");
    languages.add("Swahili");
    communitySuggestions.add("Dar Builders");
  }
  if (has("Uganda specifically")) {
    currencies.add("UGX");
    payments.add("Flutterwave");
    communitySuggestions.add("Kampala Builders");
  }
  if (has("UK - diaspora")) {
    currencies.add("GBP");
    payments.add("Stripe");
    payments.add("Wise transfer");
    communitySuggestions.add("London Diaspora Builders");
  }
  if (has("USA - diaspora")) {
    currencies.add("USD");
    payments.add("Stripe");
    payments.add("Flutterwave");
    communitySuggestions.add("US Diaspora Operators");
  }
  if (has("Canada - diaspora")) {
    currencies.add("CAD");
    payments.add("Stripe");
    payments.add("Wise transfer");
    communitySuggestions.add("Canada Diaspora Builders");
  }
  if (has("Africa") || has("West Africa broadly") || has("East Africa broadly") || has("African + global markets")) {
    payments.add("Flutterwave");
    seasonalSignals.add("Eid");
    seasonalSignals.add("year-end demand");
  }
  if (has("West Africa broadly")) {
    currencies.add("NGN");
    currencies.add("GHS");
    communitySuggestions.add("West Africa Operators");
  }
  if (has("East Africa broadly")) {
    currencies.add("KES");
    currencies.add("TZS");
    languages.add("Swahili");
    communitySuggestions.add("East Africa Builders");
  }
  if (has("African + global markets") || has("Global only")) {
    currencies.add("USD");
    payments.add("Stripe");
    payments.add("Wise transfer");
  }

  if (currencies.size === 0) currencies.add("USD");
  if (payments.size === 0) payments.add("Stripe");

  return {
    currencies: Array.from(currencies).slice(0, 4),
    primaryCurrency: Array.from(currencies)[0] ?? "USD",
    paymentRecommendations: Array.from(payments).slice(0, 4),
    jobMatchingPool:
      has("UK - diaspora") || has("USA - diaspora") || has("Canada - diaspora") || has("Global only")
        ? "diaspora and global clients"
        : has("Nigeria specifically") || has("Kenya specifically") || has("Ghana specifically") || has("South Africa specifically") || has("Tanzania specifically") || has("Uganda specifically") || has("West Africa broadly") || has("East Africa broadly") || has("Africa")
          ? "African remote clients and regional operators"
          : "African and global mixed clients",
    communitySuggestions: Array.from(communitySuggestions).slice(0, 3),
    languageOptions: Array.from(languages).slice(0, 4),
    seasonalSignals: Array.from(seasonalSignals).slice(0, 4),
  };
}

function readOnboardingSignals(metadata: unknown) {
  const root = metadataObject(metadata);
  const onboarding = metadataObject(root.onboarding);
  const omegaRouting = metadataObject(root.omegaRouting);
  const routingMarketFocus = normalizeStringArray(omegaRouting.marketFocus);
  const onboardingMarketFocus = normalizeStringArray(onboarding.marketFocus);
  const marketFocus = routingMarketFocus.length ? routingMarketFocus : onboardingMarketFocus;
  const routingTopSkills = normalizeStringArray(omegaRouting.topSkills, 5);
  const onboardingTopSkills = normalizeStringArray(onboarding.topSkills, 5);
  const topSkills = routingTopSkills.length ? routingTopSkills : onboardingTopSkills;

  return {
    experienceLevel:
      normalizeString(omegaRouting.experienceLevel) ??
      normalizeString(onboarding.experienceLevel),
    incomeTarget:
      normalizeString(omegaRouting.incomeTarget) ??
      normalizeString(onboarding.incomeTarget),
    primaryLayer:
      normalizeString(omegaRouting.primaryLayer) ??
      normalizeString(onboarding.primaryLayer),
    profileType:
      normalizeString(omegaRouting.profileType) ??
      normalizeString(onboarding.profileType),
    buildingFocus:
      normalizeString(omegaRouting.buildingFocus) ??
      normalizeString(onboarding.buildingFocus),
    marketFocus,
    topSkills,
    marketSignals: deriveMarketSignals(marketFocus),
  };
}

function omegaCalibration(experienceLevel: string | null, incomeTarget: string | null, markets: string[]) {
  let experienceLine = "Use your default OMEGA tone.";
  if (experienceLevel === "Just starting out - less than 1 year") {
    experienceLine = "Explain more, keep the action plan confidence-building, and recommend Academy-first sequencing before harder Work or Market execution when needed.";
  }
  if (experienceLevel === "Expert - 7+ years or professional-level") {
    experienceLine = "Assume context, skip basics, and keep the recommendations concise, commercial, and strategically direct.";
  }
  if (experienceLevel === "Established - 3 to 7 years") {
    experienceLine = "Assume solid foundations and prioritize leverage over hand-holding.";
  }
  if (experienceLevel === "Some experience - 1 to 3 years") {
    experienceLine = "Balance speed with explanation and keep the guidance practical.";
  }
  const revenueLine = incomeTarget && incomeTarget !== "Not focused on income right now"
    ? `Use ${incomeTarget} as the revenue baseline for forecasts and progress framing.`
    : "Do not force revenue pressure if income is not the current priority.";
  const marketLine = markets.length
    ? `Use the selected markets ${markets.join(", ")} to shape currencies, payments, job pools, community suggestions, and seasonal signals.`
    : "Use broad African and global assumptions for currencies, payments, and market signals.";
  return `${experienceLine} ${revenueLine} ${marketLine}`;
}

// GET /omega/analyze - Get comprehensive user analysis
router.get(
  "/analyze",
  authMiddleware,
  async (req: Request, res: Response) => {
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
        loopProgress,
      ] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.novaSkillDetection.findMany({
          where: { userId },
          orderBy: { confidence: "desc" },
          take: 10,
        }),
        prisma.certificate.findMany({ where: { userId } }),
        prisma.enrollment.findMany({
          where: { userId },
          include: { course: true },
        }),
        prisma.post.findMany({
          where: { authorId: userId },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.follow.count({ where: { followingId: userId } }),
        prisma.follow.count({ where: { followerId: userId } }),
        prisma.agenticLoopProgress.findUnique({ where: { userId } }),
      ]);

      // Calculate trust score components
      const trustScoreComponents = {
        profileCompleteness: user?.name && user?.email ? 80 : 40,
        skillsDetected: Math.min(skills.length * 10, 30),
        certificatesEarned: certificates.length * 15,
        communityEngagement: Math.min(posts.length * 2, 20),
        networkSize: Math.min(followers * 0.5, 20),
      };

      const trustScore = Object.values(trustScoreComponents).reduce(
        (a, b) => a + b,
        0,
      );
      const onboardingSignals = readOnboardingSignals(user?.metadata);

      // Determine current loop stage
      let currentStage = "community";
      if (enrollments.some((e) => e.completedAt)) currentStage = "academy";
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
- Onboarding Experience Level: ${onboardingSignals.experienceLevel ?? "unknown"}
- Onboarding Income Target: ${onboardingSignals.incomeTarget ?? "unknown"}
- Onboarding Primary Layer: ${onboardingSignals.primaryLayer ?? "unknown"}
- Onboarding Profile Type: ${onboardingSignals.profileType ?? "unknown"}
- Building Focus: ${onboardingSignals.buildingFocus ?? "unknown"}
- Market Focus: ${onboardingSignals.marketFocus.join(", ") || "unknown"}
- Onboarding Top Skills: ${onboardingSignals.topSkills.join(", ") || "unknown"}
- Market Currencies: ${onboardingSignals.marketSignals.currencies.join(", ")}
- Payment Recommendations: ${onboardingSignals.marketSignals.paymentRecommendations.join(", ")}
- Job Matching Pool: ${onboardingSignals.marketSignals.jobMatchingPool}
- Community Suggestions: ${onboardingSignals.marketSignals.communitySuggestions.join(", ") || "none"}
- Language Options: ${onboardingSignals.marketSignals.languageOptions.join(", ")}
- Seasonal Signals: ${onboardingSignals.marketSignals.seasonalSignals.join(", ") || "none"}

CALIBRATION:
${omegaCalibration(onboardingSignals.experienceLevel, onboardingSignals.incomeTarget, onboardingSignals.marketFocus)}

Provide a JSON response with:
{
  "strengths": ["top 3 strengths based on their data"],
  "opportunities": ["top 3 growth opportunities"],
  "nextBestAction": "one specific action they should take",
  "predictedOutcome": "what happens if they take that action",
  "ecosystemHealth": "excellent|good|needs_attention"
}`;
      const fallbackInsights = {
        strengths: ["Active community member"],
        opportunities: ["Complete more courses"],
        nextBestAction: "Post more content to get skills detected",
        predictedOutcome: "Higher trust score",
        ecosystemHealth: "good",
      };

      const insights = await callAnthropicAndParseJson(
        prompt,
        { model: "claude-sonnet-4-6", max_tokens: 800 },
        fallbackInsights,
      );

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
        onboardingSignals,
        insights,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Omega analyze error:", error);
      res.status(500).json({ error: "Failed to generate analysis" });
    }
  },
);

// GET /omega/briefing - Get personalized daily briefing
router.get(
  "/briefing",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;

      // Get recent activity
      const [user, recentPosts, recentEnrollments, newFollowers, skills] =
        await Promise.all([
          prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } }),
          prisma.post.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { _count: { select: { likes: true, comments: true } } },
          }),
          prisma.enrollment.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 3,
            include: { course: true },
          }),
          prisma.follow.findMany({
            where: { followingId: userId },
            orderBy: { createdAt: "desc" },
            take: 5,
          }),
          prisma.novaSkillDetection.findMany({
            where: { userId },
            orderBy: { confidence: "desc" },
            take: 5,
          }),
        ]);

      // Calculate metrics
      const engagementThisWeek = recentPosts.reduce(
        (sum, p) => sum + p._count.likes + p._count.comments,
        0,
      );
      const daysSinceLastPost = recentPosts[0]
        ? Math.floor(
            (Date.now() - new Date(recentPosts[0].createdAt).getTime()) /
              86400000,
          )
        : 99;
      const onboardingSignals = readOnboardingSignals(user?.metadata);

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
- Onboarding Experience Level: ${onboardingSignals.experienceLevel ?? "unknown"}
- Onboarding Income Target: ${onboardingSignals.incomeTarget ?? "unknown"}
- Onboarding Primary Layer: ${onboardingSignals.primaryLayer ?? "unknown"}
- Onboarding Profile Type: ${onboardingSignals.profileType ?? "unknown"}
- Building Focus: ${onboardingSignals.buildingFocus ?? "unknown"}
- Market Focus: ${onboardingSignals.marketFocus.join(", ") || "unknown"}
- Onboarding Top Skills: ${onboardingSignals.topSkills.join(", ") || "unknown"}
- Market Currencies: ${onboardingSignals.marketSignals.currencies.join(", ")}
- Payment Recommendations: ${onboardingSignals.marketSignals.paymentRecommendations.join(", ")}
- Job Matching Pool: ${onboardingSignals.marketSignals.jobMatchingPool}
- Community Suggestions: ${onboardingSignals.marketSignals.communitySuggestions.join(", ") || "none"}
- Language Options: ${onboardingSignals.marketSignals.languageOptions.join(", ")}
- Seasonal Signals: ${onboardingSignals.marketSignals.seasonalSignals.join(", ") || "none"}

CALIBRATION:
${omegaCalibration(onboardingSignals.experienceLevel, onboardingSignals.incomeTarget, onboardingSignals.marketFocus)}

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
        messages: [{ role: "user", content: prompt }],
      });

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          res.write(`data: ${JSON.stringify({ token: chunk.delta.text })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Omega briefing error:", error);
      res.status(500).json({ error: "Failed to generate briefing" });
    }
  },
);

// GET /omega/health - Get ecosystem health metrics
router.get(
  "/health",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;

      // Get community health metrics
      const [totalUsers, activeUsers, totalPosts, totalSkills, avgTrustScore] =
        await Promise.all([
          prisma.user.count({ where: { tenantId } }),
          prisma.user.count({
            where: {
              tenantId,
              updatedAt: { gte: new Date(Date.now() - 7 * 86400000) },
            },
          }),
          prisma.post.count(),
          prisma.novaSkillDetection.count(),
          prisma.user.aggregate({
            where: { tenantId },
            _avg: { trustScore: true },
          }),
        ]);

      // Calculate health indicators
      const health = {
        community: {
          totalUsers,
          activeUsers,
          activeRatio: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
          status: activeUsers > 10 ? "healthy" : "growing",
        },
        engagement: {
          totalPosts,
          postsPerUser: totalUsers > 0 ? totalPosts / totalUsers : 0,
          status: totalPosts > 100 ? "healthy" : "needs_boost",
        },
        intelligence: {
          skillsDetected: totalSkills,
          avgTrustScore: avgTrustScore._avg.trustScore || 0,
          status: totalSkills > 50 ? "healthy" : "early",
        },
        overall:
          activeUsers > 10 && totalPosts > 50
            ? "excellent"
            : activeUsers > 5 && totalPosts > 20
              ? "good"
              : "developing",
      };

      res.json(health);
    } catch (error) {
      console.error("Omega health error:", error);
      res.status(500).json({ error: "Failed to get health metrics" });
    }
  },
);

// GET /omega/forecast - Get revenue/growth predictions
router.get(
  "/forecast",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;

      // Get user's business metrics
      const [skills, certificates, completedEnrollments, loopProgress] =
        await Promise.all([
          prisma.novaSkillDetection.findMany({
            where: { userId, confidence: { gte: 0.75 } },
            select: { skill: true },
          }),
          prisma.certificate.count({ where: { userId } }),
          prisma.enrollment.count({
            where: { userId, completedAt: { not: null } },
          }),
          prisma.agenticLoopProgress.findUnique({ where: { userId } }),
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
        trustScoreProjection: Math.min(
          100,
          30 + skillCount * 8 + certCount * 12,
        ),
        skillGrowthRate:
          skillCount > 0 ? "high" : skillCount > 3 ? "medium" : "building",
        revenuePotential:
          certCount > 2 ? "high" : certCount > 0 ? "medium" : "developing",
        timeline: {
          toIntermediate: courseCount >= 1 ? "achieved" : "2-4 weeks",
          toAdvanced: certCount >= 2 ? "achieved" : "1-3 months",
          toExpert: certCount >= 5 ? "achieved" : "3-6 months",
        },
        recommendations: [
          certCount === 0
            ? "Complete your first course to unlock work opportunities"
            : null,
          skillCount < 3 ? "Post more to let NOVA detect your skills" : null,
          !loopProgress ? "Start your Agentic Loop to accelerate growth" : null,
        ].filter(Boolean),
      };

      res.json(predictions);
    } catch (error) {
      console.error("Omega forecast error:", error);
      res.status(500).json({ error: "Failed to generate forecast" });
    }
  },
);

export default router;
