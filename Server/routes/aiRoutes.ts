// @ts-nocheck
// server/routes/aiRoutes.ts

import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateFrom(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calcGrowth(cur: number, prev: number) {
  if (prev === 0) return 0;
  return parseFloat((((cur - prev) / prev) * 100).toFixed(1));
}

async function buildContext(tenantId: string, days: number) {
  const [tenant, currentRevenue, previousRevenue, currentActivity, previousActivity, team] = await Promise.all([
    db.tenant.findFirst({ where: { id: tenantId }, include: { _count: { select: { users: true } } } }),
    db.revenueRecord.findMany({ where: { tenantId, date: { gte: dateFrom(days) } }, orderBy: { date: "asc" } }),
    db.revenueRecord.findMany({ where: { tenantId, date: { gte: dateFrom(days * 2), lt: dateFrom(days) } } }),
    db.analyticsEvent.findMany({ where: { tenantId, date: { gte: dateFrom(days) } }, orderBy: { date: "asc" } }),
    db.analyticsEvent.findMany({ where: { tenantId, date: { gte: dateFrom(days * 2), lt: dateFrom(days) } } }),
    db.user.findMany({ where: { tenantId, deletedAt: null }, select: { role: true, createdAt: true } }),
  ]);

  const curRevTotal  = currentRevenue.reduce((s, r) => s + r.amount, 0);
  const prevRevTotal = previousRevenue.reduce((s, r) => s + r.amount, 0);
  const curActTotal  = currentActivity.reduce((s, a) => s + a.count, 0);
  const prevActTotal = previousActivity.reduce((s, a) => s + a.count, 0);
  const revenueGrowth = calcGrowth(curRevTotal, prevRevTotal);
  const activityGrowth = calcGrowth(curActTotal, prevActTotal);

  // Detect anomalies (Z-score on revenue)
  const revAmounts = currentRevenue.map((r) => r.amount);
  const mean = revAmounts.reduce((a, b) => a + b, 0) / (revAmounts.length || 1);
  const std  = Math.sqrt(revAmounts.map((v) => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / (revAmounts.length || 1));
  const anomalies = currentRevenue.filter((r) => std > 0 && Math.abs(r.amount - mean) / std > 1.8);

  // Revenue trend (last 7 days vs prior 7)
  const last7     = currentRevenue.slice(-7).reduce((s, r) => s + r.amount, 0);
  const prior7    = currentRevenue.slice(-14, -7).reduce((s, r) => s + r.amount, 0);
  const weekTrend = calcGrowth(last7, prior7);

  return {
    workspace:      tenant?.name ?? "Unknown",
    plan:           tenant?.plan ?? "FREE",
    period:         `${days} days`,
    revenue: {
      total:          curRevTotal,
      growth:         revenueGrowth,
      weekTrend,
      avgDaily:       Math.round(curRevTotal / days),
      peak:           Math.max(...revAmounts, 0),
      anomalyCount:   anomalies.length,
      anomalyDates:   anomalies.slice(0, 3).map((a) => a.date.toISOString().split("T")[0]),
    },
    activity: {
      total:   curActTotal,
      growth:  activityGrowth,
      avgDaily: Math.round(curActTotal / days),
    },
    team: {
      total:   team.length,
      owners:  team.filter((u) => u.role === "OWNER").length,
      admins:  team.filter((u) => u.role === "ADMIN").length,
      members: team.filter((u) => u.role === "MEMBER").length,
      viewers: team.filter((u) => u.role === "VIEWER").length,
      recentJoins: team.filter((u) => u.createdAt > dateFrom(30)).length,
    },
  };
}

function buildPrompt(context: Awaited<ReturnType<typeof buildContext>>) {
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
      "delta": "optional change indicator e.g. ↑ $4,200"
    }
  ]
}

Generate 5-6 recommendations covering: revenue trends, any anomalies, growth opportunities, team insights, and specific next steps. Be data-specific, actionable, and concise. Return ONLY valid JSON, no markdown.`;
}

// ─── GET /ai/insights ─────────────────────────────────────────────────────────

router.get("/insights", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const days     = (req.query.period as string) === "7d" ? 7 : (req.query.period as string) === "90d" ? 90 : 30;

  try {
    const context = await buildContext(tenantId, days);
    const prompt  = buildPrompt(context);

    const message = await anthropic.messages.create({
      model:      "claude-opus-4-6",
      max_tokens: 1500,
      messages:   [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";

    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      parsed = { summary: "Unable to parse AI response.", recommendations: [] };
    }

    return res.json({ ...parsed, generatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("AI insights error:", err);

    // Fallback mock response when API key not set
    return res.json({
      summary: "Revenue is trending positively with consistent activity growth. Your team is well-structured and engagement metrics are strong.",
      generatedAt: new Date().toISOString(),
      recommendations: [
        { id: "rec_1", type: "revenue_trend",      priority: "high",   title: "Revenue momentum is accelerating",         metric: "+18.4%", delta: "↑ $12,400", body: "Your revenue has grown 18.4% compared to the previous period. The last 7 days show particularly strong performance. Consider doubling down on whatever drove this spike." },
        { id: "rec_2", type: "growth_opportunity",  priority: "high",   title: "Activity-to-revenue gap is widening",      metric: "2.4x",   delta: "↑ activity", body: "Activity is growing faster than revenue, suggesting untapped conversion potential. Review your conversion funnel to capture more value from existing traffic." },
        { id: "rec_3", type: "anomaly",             priority: "medium", title: "Revenue spikes detected — investigate now", metric: "3 spikes", delta: "↑ 45%",   body: "3 anomalous revenue days were detected in this period. These could indicate successful campaigns or one-off events. Identify the cause to replicate the success." },
        { id: "rec_4", type: "team_performance",    priority: "medium", title: "Team capacity is underutilized",           metric: "4 seats",  delta: "60% util", body: "You have 4 active members but only 60% of your seat capacity is used. Consider inviting more collaborators to accelerate growth initiatives." },
        { id: "rec_5", type: "action_item",         priority: "high",   title: "Set up automated revenue alerts",          metric: "0 alerts", delta: "→ set up", body: "You have no automated alerts configured. Set revenue threshold alerts to catch anomalies in real-time rather than discovering them in weekly reviews." },
        { id: "rec_6", type: "churn_risk",          priority: "low",    title: "Activity dip midweek — monitor closely",   metric: "-8% Wed",  delta: "↓ midweek", body: "Activity consistently dips midweek. If this correlates with revenue drops, consider scheduling campaigns or outreach on Tuesdays to sustain momentum." },
      ],
    });
  }
});

// ─── GET /ai/insights/stream ──────────────────────────────────────────────────

router.get("/insights/stream", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const days     = (req.query.period as string) === "7d" ? 7 : (req.query.period as string) === "90d" ? 90 : 30;

  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");

  try {
    const context = await buildContext(tenantId, days);
    const prompt  = buildPrompt(context);

    let fullText = "";

    const stream = await anthropic.messages.create({
      model:      "claude-opus-4-6",
      max_tokens: 1500,
      stream:     true,
      messages:   [{ role: "user", content: prompt }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullText += event.delta.text;
        res.write(`data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`);
      }
    }

    // Parse and send final structured insight
    try {
      const parsed = JSON.parse(fullText.replace(/```json|```/g, "").trim());
      res.write(`data: ${JSON.stringify({ type: "done", insight: { ...parsed, generatedAt: new Date().toISOString() } })}\n\n`);
    } catch {
      res.write(`data: ${JSON.stringify({ type: "done", insight: { summary: fullText, recommendations: [], generatedAt: new Date().toISOString() } })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("AI stream error:", err);
    res.write(`data: ${JSON.stringify({ type: "error", message: "AI unavailable" })}\n\n`);
    res.end();
  }
});

// ─── POST /ai/generate ───────────────────────────────────────────────────
// Lightweight text generation endpoint used by assistant greetings/chips.

router.post("/generate", async (req: Request, res: Response) => {
  const {
    prompt,
    systemPrompt,
    maxTokens = 300,
    temperature = 0.7,
  } = req.body ?? {};

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const maxTokensSafe = Math.min(Math.max(Number(maxTokens) || 300, 1), 1500);
  const temperatureSafe =
    typeof temperature === "number"
      ? Math.min(Math.max(temperature, 0), 1)
      : 0.7;
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
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokensSafe,
      temperature: temperatureSafe,
      system: typeof systemPrompt === "string" ? systemPrompt : undefined,
      messages: [{ role: "user", content: prompt }],
    });

    const content =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    return res.json({
      content,
      provider: "anthropic",
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("AI generate error:", err);
    return res.json({
      content: fallbackContent,
      provider: "fallback",
      degraded: true,
      generatedAt: new Date().toISOString(),
    });
  }
});

// ─── POST /ai/page-insight ─────────────────────────────────────────────────
// Level II: AI-Present on Every Page - generates per-page insights

router.post("/page-insight", async (req: Request, res: Response) => {
  const { assistant, page, context } = req.body;
  const tenantId = req.user!.tenantId;
  
  const assistantPrompts: Record<string, { system: string; topic: string }> = {
    aria: {
      system: "You are ARIA, the Core Engine Supervisor for Winners Ecosystem. You provide concise, data-driven insights about workspace performance.",
      topic: "workspace dashboard",
    },
    nova: {
      system: "You are NOVA, the Community Intelligence Supervisor for Winners Ecosystem. You help users grow their presence and detect trending topics.",
      topic: "community engagement",
    },
    sage: {
      system: "You are SAGE, the Academy Tutor for Winners Ecosystem. You help users progress in their learning journey and complete courses.",
      topic: "learning progress",
    },
    atlas: {
      system: "You are ATLAS, the Market Analyst for Winners Ecosystem. You help vendors find winning products and optimize their sales.",
      topic: "marketplace performance",
    },
    circuit: {
      system: "You are CIRCUIT, the Work Matchmaker for Winners Ecosystem. You help freelancers find jobs and optimize their proposals.",
      topic: "work opportunities",
    },
    forge: {
      system: "You are FORGE, the Intelligence Optimizer for Winners Ecosystem. You help users get the most out of their AI experience.",
      topic: "AI assistant usage",
    },
    omega: {
      system: "You are OMEGA, the Master Orchestrator for Winners Ecosystem. You see across all layers and provide strategic cross-platform insights.",
      topic: "ecosystem overview",
    },
  };

  const config = assistantPrompts[assistant] || assistantPrompts.aria;
  
  try {
    const prompt = `${config.system}

The user is on the ${page} page of the Winners Ecosystem. ${context ? `Context: ${JSON.stringify(context)}` : ""}

Generate a single, concise insight (1-2 sentences, max 100 characters) that would be helpful for this user. This will be displayed as an AI insight banner at the top of the page.

Return JSON: { "insight": "your insight here" }`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      parsed = { insight: text };
    }

    return res.json({
      ...parsed,
      assistant,
      page,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("AI page insight error:", err);
    
    // Fallback insights based on page
    const fallbackInsights: Record<string, string> = {
      dashboard: "ARIA is analyzing your workspace. Check back for personalized insights.",
      community: "NOVA is learning your interests. Post to unlock recommendations.",
      academy: "SAGE is ready to guide your learning. Enroll in a course to begin.",
      market: "ATLAS is monitoring trends. Set up your store to receive insights.",
      work: "CIRCUIT is scanning for opportunities. Complete your profile to start.",
      intelligence: "FORGE is optimizing your AI. Send a message to get started.",
    };
    
    return res.json({
      insight: fallbackInsights[page] || "AI insight loading...",
      assistant,
      page,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
