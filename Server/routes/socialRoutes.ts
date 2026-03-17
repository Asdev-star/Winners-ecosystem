// Server/routes/socialRoutes.ts
// Phase 2 — Community Layer: Social Media Integrations
// NOVA-Powered Cross-Platform Intelligence

import type { Prisma } from "@prisma/client";
import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Account Management
// ─────────────────────────────────────────────────────────────────────────────

// GET /social/accounts — List all connected social accounts
router.get("/accounts", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const accounts = await db.socialAccount.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: "desc" },
    });
    
    // Don't expose access tokens
    const safeAccounts = accounts.map(acc => ({
      id: acc.id,
      platform: acc.platform,
      platformId: acc.platformId,
      username: acc.username,
      displayName: acc.displayName,
      profileImage: acc.profileImage,
      pageId: acc.pageId,
      pageName: acc.pageName,
      scopes: acc.scopes,
      lastSynced: acc.lastSynced,
      createdAt: acc.createdAt,
    }));
    
    res.json(safeAccounts);
  } catch (error) {
    console.error("Error fetching social accounts:", error);
    res.status(500).json({ error: "Failed to fetch social accounts" });
  }
});

// POST /social/accounts/connect — Initiate OAuth for a platform
router.post("/accounts/connect", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { platform } = req.body;
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    
    if (!platform) {
      return res.status(400).json({ error: "Platform is required" });
    }
    
    // OAuth configuration for each platform
    const oauthConfigs: Record<string, { authUrl: string; tokenUrl: string; scope: string }> = {
      facebook: {
        authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
        scope: "pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish",
      },
      instagram: {
        authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
        scope: "instagram_basic,instagram_content_publish,pages_read_engagement",
      },
      twitter: {
        authUrl: "https://twitter.com/i/oauth2/authorize",
        tokenUrl: "https://api.twitter.com/2/oauth2/token",
        scope: "tweet.read tweet.write users.read offline.access",
      },
      linkedin: {
        authUrl: "https://www.linkedin.com/oauth/v2/authorization",
        tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
        scope: "r_liteprofile r_emailaddress w_member_social",
      },
    };
    
    const config = oauthConfigs[platform.toLowerCase()];
    if (!config) {
      return res.status(400).json({ error: `Platform ${platform} OAuth not configured` });
    }
    
    // For now, return a mock OAuth URL — in production, this would generate real OAuth URLs
    const redirectUri = `${process.env.APP_URL || "http://localhost:5173"}/community/settings/social-callback`;
    const state = Buffer.from(JSON.stringify({ userId, platform })).toString("base64");
    
    const authUrl = `${config.authUrl}?client_id=${process.env[`${platform.toUpperCase()}_CLIENT_ID`] || "demo"}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(config.scope)}&state=${state}&response_type=code`;
    
    res.json({ 
      authUrl,
      platform,
      message: "In production, this would redirect to platform OAuth. Using demo mode." 
    });
  } catch (error) {
    console.error("Error initiating OAuth:", error);
    res.status(500).json({ error: "Failed to initiate OAuth" });
  }
});

// POST /social/accounts/connect/demo — Demo mode: connect a mock account
router.post("/accounts/connect/demo", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { platform, username } = req.body;
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    
    if (!platform || !username) {
      return res.status(400).json({ error: "Platform and username are required" });
    }
    
    // Create a demo social account
    const account = await db.socialAccount.create({
      data: {
        userId,
        tenantId,
        platform: platform.toLowerCase(),
        platformId: `demo_${Date.now()}`,
        username,
        displayName: username,
        accessToken: "demo_token_" + Date.now(),
        refreshToken: "demo_refresh_" + Date.now(),
        tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        scopes: ["read", "write"],
        active: true,
      },
    });
    
    res.json({
      id: account.id,
      platform: account.platform,
      username: account.username,
      displayName: account.displayName,
      message: `Demo ${platform} account connected successfully`,
    });
  } catch (error) {
    console.error("Error connecting demo account:", error);
    res.status(500).json({ error: "Failed to connect demo account" });
  }
});

// DELETE /social/accounts/:id — Disconnect a platform
router.delete("/accounts/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.userId;
    
    const account = await db.socialAccount.findFirst({
      where: { id, userId },
    });
    
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    
    // Soft delete — mark as inactive
    await db.socialAccount.update({
      where: { id },
      data: { active: false },
    });
    
    res.json({ message: "Account disconnected successfully" });
  } catch (error) {
    console.error("Error disconnecting account:", error);
    res.status(500).json({ error: "Failed to disconnect account" });
  }
});

// POST /social/accounts/:id/sync — Force re-sync analytics
router.post("/accounts/:id/sync", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.userId;
    
    const account = await db.socialAccount.findFirst({
      where: { id, userId },
    });
    
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    
    // In production, this would call the platform's API to fetch fresh data
    // For demo, just update the lastSynced timestamp
    await db.socialAccount.update({
      where: { id },
      data: { lastSynced: new Date() },
    });
    
    res.json({ message: "Account synced successfully", lastSynced: new Date() });
  } catch (error) {
    console.error("Error syncing account:", error);
    res.status(500).json({ error: "Failed to sync account" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-posting
// ─────────────────────────────────────────────────────────────────────────────

// POST /social/publish — Publish post to selected platforms
router.post("/publish", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { content, mediaUrls, communityPostId, platforms } = req.body;
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    
    if (!content || !platforms || platforms.length === 0) {
      return res.status(400).json({ error: "Content and at least one platform are required" });
    }
    
    const results = [];
    
    for (const platform of platforms) {
      // Find the user's connected account for this platform
      const account = await db.socialAccount.findFirst({
        where: { userId, platform: platform.toLowerCase(), active: true },
      });
      
      if (!account) {
        results.push({ platform, status: "failed", error: "Account not connected" });
        continue;
      }
      
      // In production, this would call the platform's API to publish
      // For demo, create a cross-post record with "published" status
      const crossPost = await db.socialCrossPost.create({
        data: {
          tenantId,
          userId,
          communityPostId,
          socialAccountId: account.id,
          platformPostId: `demo_post_${Date.now()}`,
          status: "published",
          publishedAt: new Date(),
        },
      });
      
      results.push({ 
        platform, 
        status: "published", 
        postId: crossPost.id,
        message: `Posted to ${platform} (demo mode)` 
      });
    }
    
    res.json({ results });
  } catch (error) {
    console.error("Error publishing post:", error);
    res.status(500).json({ error: "Failed to publish post" });
  }
});

// POST /social/schedule — Schedule a future cross-post
router.post("/schedule", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { content, mediaUrls, communityPostId, platform, scheduledFor } = req.body;
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    
    if (!content || !platform || !scheduledFor) {
      return res.status(400).json({ error: "Content, platform, and scheduled time are required" });
    }
    
    const account = await db.socialAccount.findFirst({
      where: { userId, platform: platform.toLowerCase(), active: true },
    });
    
    if (!account) {
      return res.status(400).json({ error: "No connected account for this platform" });
    }
    
    const scheduledPost = await db.socialScheduledPost.create({
      data: {
        tenantId,
        userId,
        socialAccountId: account.id,
        communityPostId,
        content,
        mediaUrls: mediaUrls || [],
        platform: platform.toLowerCase(),
        scheduledFor: new Date(scheduledFor),
        status: "scheduled",
      },
    });
    
    res.json({ 
      id: scheduledPost.id,
      platform,
      scheduledFor: scheduledPost.scheduledFor,
      message: "Post scheduled successfully" 
    });
  } catch (error) {
    console.error("Error scheduling post:", error);
    res.status(500).json({ error: "Failed to schedule post" });
  }
});

// GET /social/scheduled — List scheduled posts
router.get("/scheduled", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { status } = req.query;
    
    const where: Prisma.SocialScheduledPostWhereInput = { userId };
    if (typeof status === "string" && status.length > 0) {
      where.status = status;
    }
    
    const posts = await db.socialScheduledPost.findMany({
      where,
      include: {
        socialAccount: {
          select: { platform: true, username: true },
        },
      },
      orderBy: { scheduledFor: "asc" },
    });
    
    res.json(posts);
  } catch (error) {
    console.error("Error fetching scheduled posts:", error);
    res.status(500).json({ error: "Failed to fetch scheduled posts" });
  }
});

// DELETE /social/scheduled/:id — Cancel a scheduled post
router.delete("/scheduled/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.userId;
    
    const post = await db.socialScheduledPost.findFirst({
      where: { id, userId },
    });
    
    if (!post) {
      return res.status(404).json({ error: "Scheduled post not found" });
    }
    
    await db.socialScheduledPost.update({
      where: { id },
      data: { status: "cancelled" },
    });
    
    res.json({ message: "Scheduled post cancelled" });
  } catch (error) {
    console.error("Error cancelling scheduled post:", error);
    res.status(500).json({ error: "Failed to cancel scheduled post" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────────

// GET /social/analytics/overview — Combined reach/engagement summary
router.get("/analytics/overview", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { days = "7" } = req.query;
    const daysNum = parseInt(days as string);
    
    const accounts = await db.socialAccount.findMany({
      where: { userId, active: true },
      include: {
        metrics: {
          where: {
            snapshotDate: {
              gte: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { snapshotDate: "desc" },
        },
      },
    });
    
    // Calculate totals
    let totalReach = 0;
    let totalEngagements = 0;
    let totalFollowers = 0;
    let totalFollowersGrowth = 0;
    const platformData: Record<
      string,
      {
        followers: number;
        followersGrowth: number;
        reach: number;
        engagements: number;
        engagementRate: number;
      }
    > = {};
    
    for (const account of accounts) {
      const latestMetrics = account.metrics[0];
      if (latestMetrics) {
        totalReach += latestMetrics.reach;
        totalEngagements += latestMetrics.engagements;
        totalFollowers += latestMetrics.followers;
        totalFollowersGrowth += latestMetrics.followersGrowth;
        
        platformData[account.platform] = {
          followers: latestMetrics.followers,
          followersGrowth: latestMetrics.followersGrowth,
          reach: latestMetrics.reach,
          engagements: latestMetrics.engagements,
          engagementRate: latestMetrics.engagementRate,
        };
      }
    }
    
    const avgEngagementRate = totalReach > 0 ? (totalEngagements / totalReach) * 100 : 0;
    
    res.json({
      totalReach,
      totalEngagements,
      totalFollowers,
      totalFollowersGrowth,
      avgEngagementRate: avgEngagementRate.toFixed(1),
      platforms: platformData,
      period: daysNum,
    });
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    res.status(500).json({ error: "Failed to fetch analytics overview" });
  }
});

// GET /social/analytics/platform/:platform — Single platform breakdown
router.get("/analytics/platform/:platform", authMiddleware, async (req: Request, res: Response) => {
  try {
    const platform = String(req.params.platform);
    const userId = req.user!.userId;
    const { days = "30" } = req.query;
    const daysNum = parseInt(days as string);
    
    const accounts = await db.socialAccount.findMany({
      where: { userId, platform: platform.toLowerCase(), active: true },
      include: {
        metrics: {
          where: {
            snapshotDate: {
              gte: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { snapshotDate: "desc" },
        },
      },
    });
    
    const metrics = accounts.flatMap(acc => acc.metrics);
    const chartData = metrics.map(m => ({
      date: m.snapshotDate,
      followers: m.followers,
      followersGrowth: m.followersGrowth,
      reach: m.reach,
      engagements: m.engagements,
      engagementRate: m.engagementRate,
    }));
    
    // Calculate averages
    const avgEngagementRate = metrics.reduce((sum, m) => sum + m.engagementRate, 0) / (metrics.length || 1);
    const avgReach = metrics.reduce((sum, m) => sum + m.reach, 0) / (metrics.length || 1);
    const avgEngagements = metrics.reduce((sum, m) => sum + m.engagements, 0) / (metrics.length || 1);
    
    res.json({
      platform,
      chartData,
      summary: {
        avgEngagementRate: avgEngagementRate.toFixed(1),
        avgReach: Math.round(avgReach),
        avgEngagements: Math.round(avgEngagements),
        totalPosts: metrics.reduce((sum, m) => sum + m.posts, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching platform analytics:", error);
    res.status(500).json({ error: "Failed to fetch platform analytics" });
  }
});

// GET /social/analytics/posts — Top posts across all platforms
router.get("/analytics/posts", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { limit = "10" } = req.query;
    
    const crossPosts = await db.socialCrossPost.findMany({
      where: { 
        userId, 
        status: "published",
        publishedAt: { not: null },
      },
      include: {
        socialAccount: {
          select: { platform: true, username: true },
        },
      },
      orderBy: { publishedAt: "desc" },
      take: parseInt(limit as string),
    });
    
    // In production, this would fetch real engagement data from the platforms
    // For demo, generate mock engagement data
    const postsWithEngagement = crossPosts.map((post, idx) => ({
      id: post.id,
      platform: post.socialAccount.platform,
      username: post.socialAccount.username,
      content: "Sample post content", // Would come from communityPost in production
      reach: Math.floor(Math.random() * 10000) + 1000,
      engagements: Math.floor(Math.random() * 1000) + 100,
      engagementRate: ((Math.random() * 10) + 2).toFixed(1),
      publishedAt: post.publishedAt,
    }));
    
    res.json(postsWithEngagement);
  } catch (error) {
    console.error("Error fetching top posts:", error);
    res.status(500).json({ error: "Failed to fetch top posts" });
  }
});

// GET /social/analytics/growth — Follower growth chart data
router.get("/analytics/growth", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { days = "90" } = req.query;
    const daysNum = parseInt(days as string);
    
    const accounts = await db.socialAccount.findMany({
      where: { userId, active: true },
      include: {
        metrics: {
          where: {
            snapshotDate: {
              gte: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { snapshotDate: "asc" },
        },
      },
    });
    
    // Group metrics by date
    const dailyData: Record<string, { followers: number; growth: number }> = {};
    
    for (const account of accounts) {
      for (const metric of account.metrics) {
        const dateKey = metric.snapshotDate.toISOString().split("T")[0];
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { followers: 0, growth: 0 };
        }
        dailyData[dateKey].followers += metric.followers;
        dailyData[dateKey].growth += metric.followersGrowth;
      }
    }
    
    const chartData = Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    res.json(chartData);
  } catch (error) {
    console.error("Error fetching growth data:", error);
    res.status(500).json({ error: "Failed to fetch growth data" });
  }
});

// GET /social/analytics/best-times — Optimal posting time heatmap
router.get("/analytics/best-times", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // In production, this would analyze historical engagement data
    // For demo, return a mock heatmap based on general best practices
    const heatmap = {
      // 0-23 hour, days 0-6 (Sun-Sat)
      // Values are engagement scores (0-100)
      data: [
        [20, 25, 30, 35, 40, 45, 50], // 00:00
        [15, 20, 25, 30, 35, 40, 45], // 03:00
        [10, 15, 20, 25, 30, 35, 40], // 06:00
        [25, 35, 45, 55, 60, 65, 55], // 09:00
        [40, 50, 60, 70, 75, 80, 65], // 12:00
        [45, 55, 65, 75, 80, 85, 70], // 15:00
        [55, 65, 75, 85, 90, 95, 80], // 18:00 — peak
        [50, 60, 70, 80, 85, 90, 75], // 21:00
      ],
      peakSlots: [
        { day: "Wednesday", hour: 18, score: 95 },
        { day: "Thursday", hour: 18, score: 90 },
        { day: "Friday", hour: 18, score: 85 },
      ],
      recommendation: "Post between 3–9pm WAT on Tuesdays, Wednesdays, or Thursdays for maximum engagement",
    };
    
    res.json(heatmap);
  } catch (error) {
    console.error("Error fetching best times:", error);
    res.status(500).json({ error: "Failed to fetch best times" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// NOVA Intelligence
// ─────────────────────────────────────────────────────────────────────────────

// GET /social/nova/insights — NOVA's weekly social intelligence
router.get("/nova/insights", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Get skill signals from the last 7 days
    const skillSignals = await db.socialSkillSignal.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { confidence: "desc" },
    });
    
    // Group by skill
    const skillsByCategory: Record<string, { skill: string; confidence: number; count: number }> = {};
    for (const signal of skillSignals) {
      if (!skillsByCategory[signal.skill]) {
        skillsByCategory[signal.skill] = { skill: signal.skill, confidence: 0, count: 0 };
      }
      skillsByCategory[signal.skill].confidence += signal.confidence;
      skillsByCategory[signal.skill].count += 1;
    }
    
    // Average confidence
    const topSkills = Object.values(skillsByCategory).map(s => ({
      ...s,
      confidence: (s.confidence / s.count).toFixed(0) + "%",
    }));
    
    // Get recent cross-posts for activity summary
    const recentPosts = await db.socialCrossPost.count({
      where: {
        userId,
        publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        status: "published",
      },
    });
    
    const insight = {
      skillsDetected: topSkills.length,
      topSkills: topSkills.slice(0, 5),
      postsThisWeek: recentPosts,
      novaMessage: topSkills.length > 0 
        ? `NOVA detected ${topSkills.length} skill signals from your social platforms this week.`
        : "Connect social accounts and post to activate NOVA skill detection.",
      actionItems: topSkills.slice(0, 3).map((skill, idx) => ({
        priority: idx + 1,
        skill: skill.skill,
        action: `SAGE recommends a ${skill.skill} certification path based on your social activity.`,
      })),
    };
    
    res.json(insight);
  } catch (error) {
    console.error("Error fetching NOVA insights:", error);
    res.status(500).json({ error: "Failed to fetch NOVA insights" });
  }
});

// GET /social/nova/prediction — Predict performance before posting
router.post("/nova/prediction", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { content, platforms } = req.body;
    const userId = req.user!.userId;
    
    if (!content || !platforms || platforms.length === 0) {
      return res.status(400).json({ error: "Content and platforms are required" });
    }
    
    // In production, this would use ML model trained on user's historical data
    // For demo, generate predictions based on content analysis
    const predictions = platforms.map(platform => {
      const baseScore = Math.floor(Math.random() * 4) + 6; // 6-9
      
      let recommendation = "Post as-is";
      if (content.length > 280 && platform === "twitter") {
        recommendation = "Convert to thread - content exceeds 280 characters";
      } else if (platform === "instagram" && !content.includes("#")) {
        recommendation = "Add 3-5 relevant hashtags for better reach";
      } else if (platform === "linkedin" && content.length < 100) {
        recommendation = "Add more context for professional audience";
      }
      
      return {
        platform,
        score: baseScore,
        prediction: `${baseScore}/10 - Expected ${platform} performance`,
        recommendation,
      };
    });
    
    res.json({ predictions });
  } catch (error) {
    console.error("Error generating prediction:", error);
    res.status(500).json({ error: "Failed to generate prediction" });
  }
});

// GET /social/nova/roi-report — Platform ROI attribution report
router.get("/nova/roi-report", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { days = "30" } = req.query;
    const daysNum = parseInt(days as string);
    
    // Get all connected accounts with their metrics
    const accounts = await db.socialAccount.findMany({
      where: { userId, active: true },
      include: {
        metrics: {
          where: {
            snapshotDate: { gte: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000) },
          },
        },
      },
    });
    
    // Build ROI report
    const report = {
      period: daysNum,
      platforms: accounts.map(account => ({
        platform: account.platform,
        username: account.username,
        followers: account.metrics[0]?.followers || 0,
        totalReach: account.metrics.reduce((sum, m) => sum + m.reach, 0),
        totalEngagements: account.metrics.reduce((sum, m) => sum + m.engagements, 0),
        // Mock attribution data
        communityJoins: Math.floor(Math.random() * 20),
        academyEnrollments: Math.floor(Math.random() * 10),
        workContracts: Math.floor(Math.random() * 5),
        estimatedValue: `$${Math.floor(Math.random() * 500)}`,
      })),
      novaAnalysis: {
        highestROI: "twitter",
        recommendation: "X (Twitter) is generating the highest ROI for contract wins despite lower reach. Consider increasing posting frequency from 2x to 4x per week.",
      },
    };
    
    res.json(report);
  } catch (error) {
    console.error("Error generating ROI report:", error);
    res.status(500).json({ error: "Failed to generate ROI report" });
  }
});

// GET /social/nova/weekly-briefing — Full weekly intelligence report
router.get("/nova/weekly-briefing", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Get overview stats
    const accounts = await db.socialAccount.count({ where: { userId, active: true } });
    const postsThisWeek = await db.socialCrossPost.count({
      where: {
        userId,
        publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        status: "published",
      },
    });
    
    // Mock weekly briefing
    const briefing = {
      week: `${new Date().toLocaleDateString()} - ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
      connectedPlatforms: accounts,
      postsPublished: postsThisWeek,
      highlights: [
        {
          platform: "Instagram",
          metric: "Reach",
          value: "+12%",
          note: "Your Reel on packaging design was your top performer",
        },
      ],
      opportunities: [
        {
          platform: "X",
          metric: "Engagement",
          value: "0 cross-posts this week",
          note: "Your X audience didn't see your best content. Cross-post to reach them.",
        },
      ],
      skillSignals: [
        { skill: "Digital Marketing", confidence: "89%", sources: ["X", "Instagram"] },
        { skill: "React Development", confidence: "94%", sources: ["Winners", "X"] },
      ],
      nextWeekRecommendation: "Convert your best Instagram Reel to a Winners Community video post. Your Instagram audience and Winners audience overlap by only 34% — 66% of your Winners followers have never seen your best content.",
    };
    
    res.json(briefing);
  } catch (error) {
    console.error("Error generating weekly briefing:", error);
    res.status(500).json({ error: "Failed to generate weekly briefing" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Social Graph — User Connections & Suggestions
// ─────────────────────────────────────────────────────────────────────────────

// GET /social/connections — list current user's followers as connections
router.get("/connections", authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const following = await db.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true, name: true, bio: true, skills: true,
            _count: { select: { followers: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const connections = following.map((f) => ({
      id: f.id,
      userId,
      connectedUserId: f.followingId,
      connectedUserName: f.following.name,
      connectedUserSkills: f.following.skills ?? [],
      connectedUserTrustScore: 0,
      mutualConnections: 0,
      connectedAt: f.createdAt.toISOString(),
    }));

    res.json({ connections });
  } catch (error) {
    console.error("Connections error:", error);
    res.status(500).json({ error: "Failed to fetch connections" });
  }
});

// DELETE /social/connections/:id — unfollow (remove connection)
router.delete("/connections/:id", authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params as Record<string, string>;
  try {
    const follow = await db.follow.findFirst({ where: { id, followerId: userId } });
    if (!follow) return res.status(404).json({ error: "Connection not found" });

    await db.follow.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Disconnect error:", error);
    res.status(500).json({ error: "Failed to remove connection" });
  }
});

// POST /social/connect — follow a user (create connection)
router.post("/connect", authMiddleware, async (req: Request, res: Response) => {
  const followerId = req.user!.userId;
  const { userId: followingId } = req.body as { userId?: string };
  if (!followingId) return res.status(400).json({ error: "userId is required" });
  if (followingId === followerId) return res.status(400).json({ error: "Cannot connect with yourself" });

  try {
    const existing = await db.follow.findFirst({ where: { followerId, followingId } });
    if (existing) return res.status(409).json({ error: "Already connected" });

    const follow = await db.follow.create({
      data: { followerId, followingId, tenantId: req.user!.tenantId },
      include: { following: { select: { id: true, name: true, skills: true } } },
    });

    res.status(201).json({
      connection: {
        id: follow.id,
        userId: followerId,
        connectedUserId: followingId,
        connectedUserName: follow.following.name,
        connectedUserSkills: follow.following.skills ?? [],
        connectedUserTrustScore: 0,
        mutualConnections: 0,
        connectedAt: follow.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Connect error:", error);
    res.status(500).json({ error: "Failed to connect" });
  }
});

// GET /social/suggestions — users you follow who others also follow (simplified graph)
router.get("/suggestions", authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const alreadyFollowing = await db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = alreadyFollowing.map((f) => f.followingId);
    const excludeIds = [...followingIds, userId];

    const secondDegree = await db.follow.findMany({
      where: { followerId: { in: followingIds }, followingId: { notIn: excludeIds } },
      select: { followingId: true },
      take: 50,
    });

    const candidateIds = [...new Set(secondDegree.map((f) => f.followingId))].slice(0, 10);

    if (candidateIds.length === 0) {
      const fresh = await db.user.findMany({
        where: { id: { notIn: excludeIds }, deletedAt: null },
        select: { id: true, name: true, skills: true, bio: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      return res.json({
        suggestions: fresh.map((u) => ({
          id: u.id, userId: u.id, userName: u.name,
          skills: u.skills ?? [], matchReason: "New member", overlapScore: 0, trustScore: 0,
        })),
      });
    }

    const candidates = await db.user.findMany({
      where: { id: { in: candidateIds } },
      select: { id: true, name: true, skills: true },
    });

    const me = await db.user.findFirst({ where: { id: userId }, select: { skills: true } });
    const mySkills = new Set(me?.skills ?? []);

    const suggestions = candidates.map((u) => {
      const theirSkills = u.skills ?? [];
      const overlap = theirSkills.filter((s) => mySkills.has(s)).length;
      const overlapScore = mySkills.size > 0 ? Math.round((overlap / mySkills.size) * 100) : 0;
      return {
        id: u.id, userId: u.id, userName: u.name,
        skills: theirSkills, matchReason: overlap > 0 ? "Shared skills" : "People you may know",
        overlapScore, trustScore: 0,
      };
    }).sort((a, b) => b.overlapScore - a.overlapScore);

    res.json({ suggestions });
  } catch (error) {
    console.error("Suggestions error:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

// PATCH /social/collab/:id — respond to collaboration opportunity (stub)
router.patch("/collab/:id", authMiddleware, async (_req: Request, res: Response) => {
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export default router;
