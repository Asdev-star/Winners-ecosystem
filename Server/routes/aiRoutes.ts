// server/routes/aiRoutes.ts

import Anthropic from "@anthropic-ai/sdk";
import { Router, type Request, type Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";
import {
  callAnthropicAndGetText,
  callAnthropicAndParseJson,
} from "../services/aiService.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

type RecommendationType =
  | "revenue_trend"
  | "anomaly"
  | "growth_opportunity"
  | "team_performance"
  | "churn_risk"
  | "action_item";

type RecommendationPriority = "high" | "medium" | "low";

interface InsightRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  body: string;
  priority: RecommendationPriority;
  metric?: string;
  delta?: string;
}

interface InsightsResponse {
  summary: string;
  recommendations: InsightRecommendation[];
  generatedAt: string;
}

interface BuildContextResult {
  workspace: string;
  plan: string;
  period: string;
  revenue: {
    total: number;
    growth: number;
    weekTrend: number;
    avgDaily: number;
    peak: number;
    anomalyCount: number;
    anomalyDates: string[];
  };
  activity: {
    total: number;
    growth: number;
    avgDaily: number;
  };
  team: {
    total: number;
    owners: number;
    admins: number;
    members: number;
    viewers: number;
    recentJoins: number;
  };
}

function dateFrom(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calcGrowth(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Number.parseFloat((((current - previous) / previous) * 100).toFixed(1));
}

function parsePeriod(raw: unknown): number {
  const period = typeof raw === "string" ? raw : "30d";
  if (period === "7d") return 7;
  if (period === "90d") return 90;
  return 30;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function stripCodeFences(text: string): string {
  return text.replace(/```json|```/gi, "").trim();
}

function extractTextContent(content: Anthropic.Messages.Message["content"]): string {
  const firstText = content.find((block) => block.type === "text");
  return firstText?.type === "text" ? firstText.text : "";
}

async function buildContext(tenantId: string, days: number): Promise<BuildContextResult> {
  const [tenant, currentRevenue, previousRevenue, currentActivity, previousActivity, team] = await Promise.all([
    db.tenant.findFirst({
      where: { id: tenantId },
      include: { _count: { select: { users: true } } },
    }),
    db.revenueRecord.findMany({
      where: { tenantId, recordedAt: { gte: dateFrom(days) } },
      orderBy: { recordedAt: "asc" },
    }),
    db.revenueRecord.findMany({
      where: { tenantId, recordedAt: { gte: dateFrom(days * 2), lt: dateFrom(days) } },
      orderBy: { recordedAt: "asc" },
    }),
    db.analyticsEvent.findMany({
      where: { tenantId, createdAt: { gte: dateFrom(days) } },
      orderBy: { createdAt: "asc" },
    }),
    db.analyticsEvent.findMany({
      where: { tenantId, createdAt: { gte: dateFrom(days * 2), lt: dateFrom(days) } },
      orderBy: { createdAt: "asc" },
    }),
    db.user.findMany({
      where: { tenantId, deletedAt: null },
      select: { role: true, createdAt: true },
    }),
  ]);

  const currentRevenueTotal = currentRevenue.reduce((sum, row) => sum + row.amount, 0);
  const previousRevenueTotal = previousRevenue.reduce((sum, row) => sum + row.amount, 0);
  const currentActivityTotal = currentActivity.length;
  const previousActivityTotal = previousActivity.length;

  const revenueGrowth = calcGrowth(currentRevenueTotal, previousRevenueTotal);
  const activityGrowth = calcGrowth(currentActivityTotal, previousActivityTotal);

  const revenueAmounts = currentRevenue.map((row) => row.amount);
  const mean =
    revenueAmounts.reduce((sum, amount) => sum + amount, 0) / (revenueAmounts.length || 1);
  const stdDev = Math.sqrt(
    revenueAmounts
      .map((amount) => Math.pow(amount - mean, 2))
      .reduce((sum, amount) => sum + amount, 0) / (revenueAmounts.length || 1)
  );
  const anomalies = currentRevenue.filter(
    (row) => stdDev > 0 && Math.abs(row.amount - mean) / stdDev > 1.8
  );

  const last7 = currentRevenue.slice(-7).reduce((sum, row) => sum + row.amount, 0);
  const prior7 = currentRevenue.slice(-14, -7).reduce((sum, row) => sum + row.amount, 0);
  const weekTrend = calcGrowth(last7, prior7);

  return {
    workspace: tenant?.name ?? "Unknown",
    plan: tenant?.plan ?? "FREE",
    period: `${days} days`,
    revenue: {
      total: currentRevenueTotal,
      growth: revenueGrowth,
      weekTrend,
      avgDaily: Math.round(currentRevenueTotal / days),
      peak: Math.max(...revenueAmounts, 0),
      anomalyCount: anomalies.length,
      anomalyDates: anomalies.slice(0, 3).map((row) => row.recordedAt.toISOString().split("T")[0]),
    },
    activity: {
      total: currentActivityTotal,
      growth: activityGrowth,
      avgDaily: Math.round(currentActivityTotal / days),
    },
    team: {
      total: team.length,
      owners: team.filter((user) => user.role === "OWNER").length,
      admins: team.filter((user) => user.role === "ADMIN").length,
      members: team.filter((user) => user.role === "MEMBER").length,
      viewers: team.filter((user) => user.role === "VIEWER").length,
      recentJoins: team.filter((user) => user.createdAt > dateFrom(30)).length,
    },
  };
}

function buildPrompt(context: BuildContextResult): string {
  return `You are an AI analytics advisor for ${context.workspace}, a ${context.plan} plan workspace on the Winners Ecosystem platform.

Here is their performance data for the last ${context.period}:

REVENUE:
- Total: $${context.revenue.total.toLocaleString()}
- Growth vs previous period: ${context.revenue.growth > 0 ? "+" : ""}${context.revenue.growth}%
- Last 7-day trend: ${context.revenue.weekTrend > 0 ? "+" : ""}${context.revenue.weekTrend}%
- Average daily: $${context.revenue.avgDaily.toLocaleString()}
- Peak day: $${context.revenue.peak.toLocaleString()}
- Revenue anomalies detected: ${context.revenue.anomalyCount}${context.revenue.anomalyDates.length > 0 ? ` (on ${context.revenue.anomalyDates.join(", ")})` : ""}

ACTIVITY:
- Total events: ${context.activity.total.toLocaleString()}
- Growth vs previous period: ${context.activity.growth > 0 ? "+" : ""}${context.activity.growth}%
- Average daily: ${context.activity.avgDaily.toLocaleString()}

TEAM:
- Total members: ${context.team.total}
- Roles: ${context.team.owners} owner, ${context.team.admins} admin(s), ${context.team.members} member(s), ${context.team.viewers} viewer(s)
- New joins (last 30 days): ${context.team.recentJoins}

Based on this data, provide a JSON response with exactly this structure:
{
  "summary": "2-3 sentence executive summary of current performance",
  "recommendations": [
    {
      "id": "rec_1",
      "type": "revenue_trend|anomaly|growth_opportunity|team_performance|churn_risk|action_item",
      "title": "Short title (max 8 words)",
      "body": "2-3 sentence actionable recommendation with specific numbers",
      "priority": "high|medium|low",
      "metric": "optional key metric e.g. +12.4%",
      "delta": "optional change indicator e.g. up $4,200"
    }
  ]
}

Generate 5-6 recommendations covering: revenue trends, any anomalies, growth opportunities, team insights, and specific next steps. Be data-specific, actionable, and concise. Return ONLY valid JSON, no markdown.`;
}

function fallbackInsightsResponse(): InsightsResponse {
  return {
    summary:
      "Revenue is trending positively with consistent activity growth. Your team is well-structured and engagement metrics are strong.",
    generatedAt: new Date().toISOString(),
    recommendations: [
      {
        id: "rec_1",
        type: "revenue_trend",
        priority: "high",
        title: "Revenue momentum is accelerating",
        metric: "+18.4%",
        delta: "up $12,400",
        body: "Revenue grew 18.4% compared to the previous period. The last 7 days are stronger than the prior week. Double down on the campaign or channel driving this spike.",
      },
      {
        id: "rec_2",
        type: "growth_opportunity",
        priority: "high",
        title: "Conversion gap is widening",
        metric: "2.4x",
        delta: "up activity",
        body: "Activity is growing faster than revenue, which usually indicates conversion leakage. Review your funnel and tighten high-dropoff steps to convert existing traffic better.",
      },
      {
        id: "rec_3",
        type: "anomaly",
        priority: "medium",
        title: "Revenue spikes need review",
        metric: "3 spikes",
        delta: "up 45%",
        body: "Three anomalous revenue days were detected. Verify what changed in campaigns, promotions, or launches and document repeatable tactics for the next cycle.",
      },
      {
        id: "rec_4",
        type: "team_performance",
        priority: "medium",
        title: "Team capacity underused",
        metric: "4 seats",
        delta: "60% utilized",
        body: "Current team capacity appears underused. Assign owners to growth experiments and invite collaborators where role coverage is thin.",
      },
      {
        id: "rec_5",
        type: "action_item",
        priority: "high",
        title: "Enable automated alerts",
        metric: "0 alerts",
        delta: "set up now",
        body: "No revenue alert thresholds are configured. Add anomaly and floor alerts so issues are detected in real time instead of weekly review windows.",
      },
      {
        id: "rec_6",
        type: "churn_risk",
        priority: "low",
        title: "Midweek dip is recurring",
        metric: "-8% Wed",
        delta: "down midweek",
        body: "Activity dips midweek consistently. If this tracks revenue softness, queue campaigns or outreach on Tuesdays to smooth weekly performance.",
      },
    ],
  };
}

router.get("/insights", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const days = parsePeriod(req.query.period);

  try {
    const context = await buildContext(tenantId, days);
    const prompt = buildPrompt(context);

    const parsed = await callAnthropicAndParseJson<
      Omit<InsightsResponse, "generatedAt">
    >(
      prompt,
      { model: "claude-opus-4-6", max_tokens: 1500 },
      { summary: "Unable to parse AI response.", recommendations: [] },
    );

    return res.json({ ...parsed, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("AI insights error:", errorMessage(error));
    return res.json(fallbackInsightsResponse());
  }
});

router.get("/insights/stream", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const days = parsePeriod(req.query.period);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const context = await buildContext(tenantId, days);
    const prompt = buildPrompt(context);
    let fullText = "";

    const stream = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1500,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullText += event.delta.text;
        res.write(`data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`);
      }
    }

    try {
      const parsed = JSON.parse(stripCodeFences(fullText)) as Partial<InsightsResponse>;
      res.write(
        `data: ${JSON.stringify({
          type: "done",
          insight: {
            summary:
              typeof parsed.summary === "string" ? parsed.summary : "Unable to parse AI response.",
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
            generatedAt: new Date().toISOString(),
          },
        })}\n\n`
      );
    } catch {
      res.write(
        `data: ${JSON.stringify({
          type: "done",
          insight: {
            summary: fullText,
            recommendations: [],
            generatedAt: new Date().toISOString(),
          },
        })}\n\n`
      );
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("AI stream error:", errorMessage(error));
    res.write(`data: ${JSON.stringify({ type: "error", message: "AI unavailable" })}\n\n`);
    res.end();
  }
});

router.post("/generate", async (req: Request, res: Response) => {
  const body: {
    prompt?: unknown;
    systemPrompt?: unknown;
    maxTokens?: unknown;
    temperature?: unknown;
  } =
    req.body && typeof req.body === "object"
      ? (req.body as {
          prompt?: unknown;
          systemPrompt?: unknown;
          maxTokens?: unknown;
          temperature?: unknown;
        })
      : {};

  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  const systemPrompt = typeof body.systemPrompt === "string" ? body.systemPrompt : undefined;
  const maxTokens = typeof body.maxTokens === "number" ? body.maxTokens : 300;
  const temperature = typeof body.temperature === "number" ? body.temperature : 0.7;

  if (prompt.trim().length === 0) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const maxTokensSafe = Math.min(Math.max(Number(maxTokens) || 300, 1), 1500);
  const temperatureSafe = Math.min(Math.max(temperature, 0), 1);
  const promptLower = prompt.toLowerCase();

  const fallbackContent = (() => {
    if (
      promptLower.includes("json array") ||
      promptLower.includes("follow-up") ||
      promptLower.includes("follow up") ||
      promptLower.includes("chips")
    ) {
      return "[]";
    }
    if (promptLower.includes("greeting") || promptLower.includes("welcome")) {
      return "Hello! I'm your Winners assistant. How can I help you today?";
    }
    return "AI generation is temporarily unavailable. Please try again shortly.";
  })();

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({
      content: fallbackContent,
      provider: "fallback",
      degraded: true,
      generatedAt: new Date().toISOString(),
    });
  }

  try {
    const content = await callAnthropicAndGetText(
      prompt,
      systemPrompt,
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokensSafe,
        temperature: temperatureSafe,
      },
      fallbackContent,
    );
    return res.json({
      content,
      provider: "anthropic",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI generate error:", errorMessage(error));
    return res.json({
      content: fallbackContent,
      provider: "fallback",
      degraded: true,
      generatedAt: new Date().toISOString(),
    });
  }
});

router.post("/page-insight", async (req: Request, res: Response) => {
  const body: { assistant?: unknown; page?: unknown; context?: unknown } =
    req.body && typeof req.body === "object"
      ? (req.body as { assistant?: unknown; page?: unknown; context?: unknown })
      : {};

  const assistant =
    typeof body.assistant === "string" && body.assistant.length > 0 ? body.assistant : "aria";
  const page = typeof body.page === "string" && body.page.length > 0 ? body.page : "dashboard";
  const context = body.context;

  const assistantPrompts: Record<string, { system: string; topic: string }> = {
    aria: {
      system:
        "You are ARIA, the Core Engine Supervisor for Winners Ecosystem. You provide concise, data-driven insights about workspace performance.",
      topic: "workspace dashboard",
    },
    nova: {
      system:
        "You are NOVA, the Community Intelligence Supervisor for Winners Ecosystem. You help users grow their presence and detect trending topics.",
      topic: "community engagement",
    },
    sage: {
      system:
        "You are SAGE, the Academy Tutor for Winners Ecosystem. You help users progress in their learning journey and complete courses.",
      topic: "learning progress",
    },
    atlas: {
      system:
        "You are ATLAS, the Market Analyst for Winners Ecosystem. You help vendors find winning products and optimize their sales.",
      topic: "marketplace performance",
    },
    circuit: {
      system:
        "You are CIRCUIT, the Work Matchmaker for Winners Ecosystem. You help freelancers find jobs and optimize their proposals.",
      topic: "work opportunities",
    },
    forge: {
      system:
        "You are FORGE, the Intelligence Optimizer for Winners Ecosystem. You help users get the most out of their AI experience.",
      topic: "AI assistant usage",
    },
    omega: {
      system:
        "You are OMEGA, the Master Orchestrator for Winners Ecosystem. You see across all layers and provide strategic cross-platform insights.",
      topic: "ecosystem overview",
    },
  };

  const config = assistantPrompts[assistant] ?? assistantPrompts.aria;
  const contextText = context === undefined ? "" : `Context: ${JSON.stringify(context)}`;
  const prompt = `${config.system}

The user is on the ${page} page of Winners Ecosystem.
Focus area: ${config.topic}.
${contextText}

Generate a single concise insight for this user (1-2 sentences, maximum 100 characters).
Return valid JSON only: { "insight": "your insight here" }`;

  const fallbackInsight =
    "AI insight is currently being generated. Please check back shortly.";

  try {
    const parsed = await callAnthropicAndParseJson<{ insight?: string }>(
      prompt,
      { model: "claude-sonnet-4-20250514", max_tokens: 200 },
      { insight: fallbackInsight },
    );

    return res.json({
      insight: parsed.insight || fallbackInsight,
      assistant,
      page,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI page insight error:", errorMessage(error));

    const fallbackInsights: Record<string, string> = {
      dashboard: "ARIA is analyzing your workspace. Check back for personalized insights.",
      community: "NOVA is learning your interests. Post to unlock recommendations.",
      academy: "SAGE is ready to guide your learning. Enroll in a course to begin.",
      market: "ATLAS is monitoring trends. Set up your store to receive insights.",
      work: "CIRCUIT is scanning for opportunities. Complete your profile to start.",
      intelligence: "FORGE is optimizing your AI. Send a message to get started.",
    };

    return res.json({
      insight: fallbackInsights[page] ?? "AI insight loading...",
      assistant,
      page,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
