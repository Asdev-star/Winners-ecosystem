// Phase 5 - Intelligence Layer
// Routes: supervisorRoutes
// Individual supervisor endpoints with context injection

import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();
const prisma = db;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const AI_PLATFORM_URL = process.env.AI_PLATFORM_URL || 'http://localhost:8001';
const VALID_SUPERVISORS = new Set([
  "NOVA",
  "SAGE",
  "ATLAS",
  "CIRCUIT",
  "ARIA",
  "FORGE",
  "NEXUS",
  "HERALD",
  "OMEGA",
]);

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

function calibrationInstructions(supervisor: string, experienceLevel: string | null) {
  if (experienceLevel === "Just starting out - less than 1 year") {
    return [
      "Explain steps more explicitly and celebrate small wins.",
      "Prefer guided, confidence-building recommendations over dense jargon.",
      "If the user is pushing toward Work or Market without fundamentals, recommend Academy-first sequencing before harder execution.",
    ].join(" ");
  }

  if (experienceLevel === "Expert - 7+ years or professional-level") {
    if (supervisor === "CIRCUIT") {
      return "Assume strong context, skip basics, and quote market-rate salary or contract-rate benchmarks directly when relevant.";
    }
    if (supervisor === "ATLAS") {
      return "Assume strong context, skip basics, and go straight to margin analysis, unit economics, pricing leverage, and execution tradeoffs.";
    }
    return "Assume strong context, skip basics, and keep the guidance concise, direct, and strategically advanced.";
  }

  if (experienceLevel === "Established - 3 to 7 years") {
    return "Assume solid foundations, stay practical, and focus on leverage more than hand-holding.";
  }

  if (experienceLevel === "Some experience - 1 to 3 years") {
    return "Balance speed with explanation. Give practical guidance without over-explaining basics.";
  }

  return "Use your default supervisor tone and adapt naturally to the user's signals.";
}

function buildSuggestPayload(supervisorName: string, context?: unknown) {
  const lowerSupervisor = supervisorName.toLowerCase();
  const contextString = typeof context === "string" ? context.toLowerCase() : JSON.stringify(context ?? {}).toLowerCase();

  const byAssistant: Record<string, string[]> = {
    nova: [
      "What skills did NOVA detect in my recent posts?",
      "Which Academy courses match my community activity?",
      "How do I grow my creator following?",
      "What content performs best this week?",
    ],
    sage: [
      "Summarise the key concepts in this course",
      "Create a quiz to test my understanding",
      "What does this certificate unlock in the Work layer?",
      "Build me a 7-day study plan to finish this course",
    ],
    atlas: [
      "What are the top-selling products this week?",
      "Analyse the margin potential for Afroprint hoodies",
      "Which supplier is best for Kenya-based dropshipping?",
      "Suggest 5 winning products for the diaspora market",
    ],
    circuit: [
      "Find jobs matching my skill set",
      "Write a proposal for the React job I just found",
      "What is the market rate for TypeScript freelancers?",
      "Review my freelancer profile for improvements",
    ],
    omega: [
      "Show me my Agentic Loop progress",
      "What is the highest-value action I can take today?",
      "How are my activities across all 9 layers connected?",
      "What revenue opportunities am I missing?",
    ],
    forge: [
      "Which AI model should I use for document analysis?",
      "How can I reduce my AI credit usage?",
      "Compare Llama 3.1 vs Claude for my use case",
      "Set up Ollama for offline AI access",
    ],
    nexus: [
      "Show me the Winners AI Assistant API",
      "How do I set up a webhook for certificate events?",
      "Authenticate with the Trust Score API",
      "What events does the Agentic Loop API emit?",
    ],
    herald: [
      "How do I install Llama 3.1 locally?",
      "Benchmark DeepSeek Coder vs GPT-4o on code tasks",
      "Set up ComfyUI for image generation",
      "Configure faster-whisper for African accent support",
    ],
  };

  const bySurface: Record<string, string[]> = {
    dashboard: [
      "Summarise my workspace performance this month",
      "What should I focus on to grow revenue?",
      "How do I invite team members?",
      "Explain the Winners Ecosystem platforms",
    ],
    analytics: [
      "What does my revenue trend mean?",
      "How can I improve my activity metrics?",
      "Explain the forecast methodology",
      "What are the top growth opportunities?",
    ],
    community: byAssistant.nova,
    academy: byAssistant.sage,
    billing: [
      "What is included in Winners Pro?",
      "How do I upgrade my plan?",
      "Explain the referral commission structure",
      "How does the AI credits system work?",
    ],
    intelligence: [
      "What can each of the 9 AI supervisors do?",
      "Tell me about the Agentic Loop",
      "How does multimodal AI work here?",
      "What is OMEGA and what does it do?",
    ],
    work: byAssistant.circuit,
    market: byAssistant.atlas,
  };

  const assistantSuggestions = byAssistant[lowerSupervisor] ?? byAssistant.omega;
  const surfaceKey = Object.keys(bySurface).find((key) => contextString.includes(key)) ?? "dashboard";
  const suggestions = assistantSuggestions ?? bySurface[surfaceKey] ?? bySurface.dashboard;
  return suggestions.slice(0, 4);
}

type DropshippingToolKey =
  | "product-research"
  | "competitor-analysis"
  | "product-description"
  | "brand-identity";

function getAccountPlan(user: { plan?: string | null } | undefined) {
  const plan = String(user?.plan ?? "FREE").toUpperCase();
  return plan === "PRO" || plan === "ENTERPRISE" ? plan : "FREE";
}

async function getMonthlyDropshippingUsage(userId: string, tenantId: string, tool: DropshippingToolKey) {
  return prisma.dropshippingResearch.count({
    where: {
      userId,
      tenantId,
      tool,
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });
}

async function saveDropshippingResearch(params: {
  userId: string;
  tenantId: string;
  tool: DropshippingToolKey;
  input: unknown;
  output: string;
}) {
  const { userId, tenantId, tool, input, output } = params;
  await prisma.dropshippingResearch.create({
    data: {
      tenantId,
      userId,
      tool,
      input: input as Prisma.InputJsonValue,
      output: { text: output } as Prisma.InputJsonValue,
    },
  });
}

async function streamAtlasDropshippingTool(params: {
  req: Request;
  res: Response;
  tool: DropshippingToolKey;
  systemPrompt: string;
  userPrompt: string;
  input: unknown;
}) {
  const { req, res, tool, systemPrompt, userPrompt, input } = params;
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const plan = getAccountPlan(req.user);

  if (plan === "FREE") {
    const monthlyCount = await getMonthlyDropshippingUsage(userId, tenantId, tool);
    if (monthlyCount >= 3) {
      return res.status(402).json({
        error: "Free dropshipping tool limit reached",
        upgrade: "PRO",
        limit: 3,
      });
    }
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let output = "";

  try {
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: `${systemPrompt}\n\nUser context: ${JSON.stringify({ userId, tenantId, plan })}`,
      messages: [{ role: "user", content: userPrompt }],
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        const text = chunk.delta.text;
        output += text;
        res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
      }
    }

    await saveDropshippingResearch({ userId, tenantId, tool, input, output });
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("[supervisors] dropshipping tool error:", error);
    if (!res.headersSent) {
      res.status(500);
    }
    res.write(`data: ${JSON.stringify({ error: "Dropshipping AI failed" })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
}

// Get context for a specific supervisor
const getSupervisorContext = async (supervisor: string, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { metadata: true },
  });
  const onboardingSignals = readOnboardingSignals(user?.metadata);
  const baseContext = {
    userId,
    timestamp: new Date().toISOString(),
    onboardingSignals,
    calibrationInstructions: calibrationInstructions(supervisor, onboardingSignals.experienceLevel),
  };

  switch (supervisor) {
    case "NOVA": {
      const [posts, skills, followers] = await Promise.all([
        prisma.post.findMany({
          where: { authorId: userId },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { _count: { select: { likes: true, comments: true } } },
        }),
        prisma.novaSkillDetection.findMany({
          where: { userId },
          orderBy: { confidence: "desc" },
          take: 10,
        }),
        prisma.follow.count({ where: { followingId: userId } }),
      ]);
      return { ...baseContext, posts, skills, followers, feedMode: "for-you" };
    }

    case "SAGE": {
      const [enrollments, certificates, skills] = await Promise.all([
        prisma.enrollment.findMany({
          where: { userId },
          include: { course: true },
        }),
        prisma.certificate.findMany({ where: { userId } }),
        prisma.novaSkillDetection.findMany({
          where: { userId },
          orderBy: { confidence: "desc" },
          take: 5,
        }),
      ]);
      return {
        ...baseContext,
        enrollments,
        certificates: certificates.length,
        detectedSkills: Array.from(new Set([...skills.map((s) => s.skill), ...baseContext.onboardingSignals.topSkills])).slice(0, 8),
        learningGoals: [],
      };
    }

    case "ATLAS": {
      const [skills, certificates] = await Promise.all([
        prisma.novaSkillDetection.findMany({
          where: { userId, confidence: { gte: 0.75 } },
          distinct: ["skill"],
          select: { skill: true },
        }),
        prisma.certificate.findMany({ where: { userId } }),
      ]);
      return {
        ...baseContext,
        userSkills: Array.from(new Set([...skills.map((s) => s.skill), ...baseContext.onboardingSignals.topSkills])).slice(0, 8),
        certifications: certificates.length,
        vendorMode: false,
        productNiche: null,
      };
    }

    case "CIRCUIT": {
      const [skills, certificates, enrollments] = await Promise.all([
        prisma.novaSkillDetection.findMany({
          where: { userId, confidence: { gte: 0.75 } },
          distinct: ["skill"],
          select: { skill: true },
        }),
        prisma.certificate.findMany({ where: { userId } }),
        prisma.enrollment.count({
          where: { userId, completedAt: { not: null } },
        }),
      ]);
      return {
        ...baseContext,
        userSkills: Array.from(new Set([...skills.map((s) => s.skill), ...baseContext.onboardingSignals.topSkills])).slice(0, 8),
        certifications: certificates.length,
        completedCourses: enrollments,
        currentJob: null,
        proposals: [],
      };
    }

    default:
      return baseContext;
  }
};

// POST /supervisors/:name/chat - Chat with a specific supervisor
router.post("/:name/chat", authMiddleware, async (req: Request, res: Response) => {
  try {
    const supervisorName = (req.params.name as string).toUpperCase();
    const { message, context, provider = 'claude', history } = req.body;
    const userId = req.user!.userId;

    // Validate supervisor
    if (!VALID_SUPERVISORS.has(supervisorName)) {
      return res.status(400).json({ error: "Invalid supervisor" });
    }

    // Get supervisor context
    const supervisorContext = await getSupervisorContext(
      supervisorName,
      userId,
    );

    // Merge provided context with supervisor context
    const mergedContext = { ...supervisorContext, ...context };

    // Build system prompt based on supervisor
    const systemPrompts: Record<string, string> = {
      NOVA: `You are NOVA, the Winners Ecosystem Community Intelligence Supervisor.
You are warm, trend-aware, and focused on creator growth.
Your role is to help users grow their presence, detect skills from their content, and connect with opportunities.
Supervisor calibration: ${calibrationInstructions(supervisorName, mergedContext.onboardingSignals?.experienceLevel ?? null)}
Use onboarding income target and market signals when making community, currency, group, and growth recommendations.
Use onboarding top skills to pre-seed opportunity spotting before live posting history is strong.
Current context: ${JSON.stringify(mergedContext)}`,

      SAGE: `You are SAGE, the Winners Ecosystem Academy Tutor.
You are patient, knowledgeable, and encouraging.
Your role is to help users learn, understand concepts, and progress through courses.
Supervisor calibration: ${calibrationInstructions(supervisorName, mergedContext.onboardingSignals?.experienceLevel ?? null)}
Use onboarding income target and market signals when sequencing learning paths or commercialization routes.
Use onboarding top skills to map likely courses immediately.
Current context: ${JSON.stringify(mergedContext)}`,

      ATLAS: `You are ATLAS, the Winners Ecosystem Market Intelligence.
You are analytical, commercial, and data-driven.
Your role is to help users with product research, pricing strategies, and vendor opportunities.
Supervisor calibration: ${calibrationInstructions(supervisorName, mergedContext.onboardingSignals?.experienceLevel ?? null)}
Use onboarding income target, currencies, payment recommendations, and regional market signals directly when relevant.
Use onboarding top skills to shape product, pricing, and niche recommendations.
Current context: ${JSON.stringify(mergedContext)}`,

      CIRCUIT: `You are CIRCUIT, the Winners Ecosystem Work Matchmaker.
You are professional, tactical, and results-oriented.
Your role is to help users find jobs, write proposals, and advance their careers.
Supervisor calibration: ${calibrationInstructions(supervisorName, mergedContext.onboardingSignals?.experienceLevel ?? null)}
Use onboarding income target, job matching pool, and regional signals directly when relevant.
Use onboarding top skills to shape role matching and proposal advice immediately.
Current context: ${JSON.stringify(mergedContext)}`,

      ARIA: `You are ARIA, the Winners Ecosystem Core Engine Assistant.
You are calm, precise, and organized.
Your role is to help users with dashboard insights, billing, and workspace management.
Supervisor calibration: ${calibrationInstructions(supervisorName, mergedContext.onboardingSignals?.experienceLevel ?? null)}
Use onboarding income target and market signals when discussing billing, reporting, or workspace setup.
Current context: ${JSON.stringify(mergedContext)}`,

      FORGE: `You are FORGE, the Winners Ecosystem Intelligence Platform.
You are technical, precise, and performance-focused.
Your role is to help users with AI model routing, multimodal tasks, and performance optimization.
Supervisor calibration: ${calibrationInstructions(supervisorName, mergedContext.onboardingSignals?.experienceLevel ?? null)}
Use onboarding income target and market signals when framing automation or intelligence priorities.
Current context: ${JSON.stringify(mergedContext)}`,

      NEXUS: `You are NEXUS, the Winners Ecosystem Cloud Developer Advocate.
You are developer-focused and documentation-expert.
Your role is to help users with API guidance, SDK support, and integration troubleshooting.
Supervisor calibration: ${calibrationInstructions(supervisorName, mergedContext.onboardingSignals?.experienceLevel ?? null)}
Use onboarding payment recommendations and market signals when advising on integrations.
Current context: ${JSON.stringify(mergedContext)}`,

      HERALD: `You are HERALD, the Winners AI Platform Infrastructure Supervisor.
You are technical and infrastructure-focused.
Your role is to help users with Ollama management, GPU routing, and model benchmarking.
Supervisor calibration: ${calibrationInstructions(supervisorName, mergedContext.onboardingSignals?.experienceLevel ?? null)}
Use onboarding income target and market signals only when they change infrastructure or deployment priorities.
Current context: ${JSON.stringify(mergedContext)}`,
    };

    // Stream response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (provider === 'ollama' || provider === 'deepseek' || provider === 'llama') {
      const ollamaModel = provider === 'deepseek' ? 'deepseek-coder' : 'llama3.1';
      try {
        const ollamaRes = await fetch(`${AI_PLATFORM_URL}/chat/ollama`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            system: systemPrompts[supervisorName] || systemPrompts.ARIA,
            messages: [
              ...(history || []).slice(-10),
              { role: 'user', content: message },
            ],
            stream: true,
          }),
        });
        if (ollamaRes.ok && ollamaRes.body) {
          const reader = (ollamaRes.body as any).getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            for (const line of text.split('\n').filter((l: string) => l.startsWith('data: '))) {
              res.write(line + '\n\n');
            }
          }
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }
      } catch (ollamaErr) {
        console.warn('[supervisor] Ollama unavailable, falling back to Claude');
      }
    }
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: systemPrompts[supervisorName] || systemPrompts.ARIA,
      messages: [{ role: "user", content: message }],
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
    console.error("Supervisor chat error:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

router.post(
  "/:name/suggest",
  authMiddleware,
  async (req: Request, res: Response) => {
    const supervisorName = (req.params.name as string).toUpperCase();
    if (!VALID_SUPERVISORS.has(supervisorName)) {
      return res.status(400).json({ error: "Invalid supervisor" });
    }

    const suggestions = buildSuggestPayload(supervisorName, req.body?.context ?? req.body?.page ?? "dashboard");
    return res.json({ suggestions });
  },
);

// GET /supervisors/:name/nav-action - Market smart action summary for the sub-nav
router.get(
  "/:name/nav-action",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const supervisorName = (req.params.name as string).toUpperCase();
      if (supervisorName !== "ATLAS") {
        return res.status(400).json({ error: "Invalid supervisor" });
      }

      const userId = req.user!.userId;
      const tenantId = req.user!.tenantId;

      const vendor = await prisma.vendor.findFirst({
        where: { userId, tenantId },
        select: { id: true, storeName: true, status: true },
      });

      if (!vendor) {
        return res.json({
          action: {
            supervisor: "ATLAS",
            title: "Complete vendor onboarding",
            hint: "Unlock products, orders, and payouts from your Market store.",
            to: "/market/vendor",
          },
        });
      }

      const [productCount, recentOrderCount] = await Promise.all([
        prisma.product.count({
          where: { tenantId, vendorId: vendor.id },
        }),
        prisma.order.count({
          where: {
            tenantId,
            vendorId: vendor.id,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      if (productCount === 0) {
        return res.json({
          action: {
            supervisor: "ATLAS",
            title: "Your store has 0 products - add the first one",
            hint: "ATLAS is pointing you to the fastest launch move.",
            to: "/market/vendor/products/new",
          },
        });
      }

      if (recentOrderCount === 0) {
        return res.json({
          action: {
            supervisor: "ATLAS",
            title: "Your store has 0 sales - fix this",
            hint: "Check pricing, listings, and conversion friction before the next campaign.",
            to: "/market/vendor",
          },
        });
      }

      if (productCount < 3) {
        return res.json({
          action: {
            supervisor: "ATLAS",
            title: "3 new niches for African market",
            hint: "Expand into the next demand pocket before your competitors do.",
            to: "/market/dropshipping?tab=niches",
          },
        });
      }

      return res.json({
        action: {
          supervisor: "ATLAS",
          title: "React phone cases trending in Lagos",
          hint: "Use the live supplier lane to launch a fast-moving product test.",
          to: "/market/dropshipping?supplier=printful&tab=suppliers",
        },
      });
    } catch (error) {
      console.error("[supervisors] nav action error:", error);
      return res.status(500).json({ error: "Failed to build nav action" });
    }
  },
);

router.post(
  "/atlas/dropshipping-product-research",
  authMiddleware,
  async (req: Request, res: Response) => {
    return streamAtlasDropshippingTool({
      req,
      res,
      tool: "product-research",
      input: req.body ?? {},
      systemPrompt: `You are ATLAS, the Winners Ecosystem dropshipping intelligence supervisor.
Return:
- 5 winning products
- estimated margin
- supplier recommendation
- target audience
- African market fit score
- competition level
- trend direction
- best supplier rationale
- pricing strategy
- demand forecast for 30/60/90 days
- concise conclusion paragraph
Prioritize African and diaspora markets. Be concrete and commercial.`,
      userPrompt: `Research winning dropshipping products for:
Niche: ${req.body?.niche ?? "African fashion"}
Market: ${req.body?.market ?? "Kenya"}
Budget: ${req.body?.budget ?? "$300"}
Audience: ${req.body?.audience ?? "African buyers"}
Preferred supplier: ${req.body?.supplier ?? "any"}`,
    });
  },
);

router.post(
  "/atlas/dropshipping-competitor-analysis",
  authMiddleware,
  async (req: Request, res: Response) => {
    return streamAtlasDropshippingTool({
      req,
      res,
      tool: "competitor-analysis",
      input: req.body ?? {},
      systemPrompt: `You are ATLAS, the Winners Ecosystem market intelligence supervisor.
Analyze competitors and return:
- current Winners Market competitors count and average price
- top 5 external stores
- price positioning map
- differentiation opportunities
- exact recommendation with entry price and quality signal strategy
Keep it practical and specific.`,
      userPrompt: `Analyze competitors for:
Product or category: ${req.body?.product ?? "Phone accessories"}
Market: ${req.body?.market ?? "Kenya"}`,
    });
  },
);

router.post(
  "/atlas/dropshipping-product-description",
  authMiddleware,
  async (req: Request, res: Response) => {
    return streamAtlasDropshippingTool({
      req,
      res,
      tool: "product-description",
      input: req.body ?? {},
      systemPrompt: `You are ATLAS, the Winners Ecosystem product copy supervisor.
Generate:
- SEO title under 60 characters
- 5 benefit bullets
- 150-300 word full description
- meta description under 160 characters
- 5 tags
Write in a premium, conversion-friendly style.`,
      userPrompt: `Write a product listing for:
Product: ${req.body?.product ?? "Phone case"}
Supplier: ${req.body?.supplier ?? "Printful"}
Target audience: ${req.body?.audience ?? "African buyers"}`,
    });
  },
);

router.post(
  "/atlas/dropshipping-brand-identity",
  authMiddleware,
  async (req: Request, res: Response) => {
    return streamAtlasDropshippingTool({
      req,
      res,
      tool: "brand-identity",
      input: req.body ?? {},
      systemPrompt: `You are ATLAS, the Winners Ecosystem brand strategist.
Return:
- 5 store name options
- brand voice description
- 3-color palette suggestion with hex values
- 3 tagline options
- a short brand story opening paragraph
Keep it commercially useful and memorable.`,
      userPrompt: `Create brand identity options for:
Niche: ${req.body?.niche ?? "African fashion accessories"}
Target market: ${req.body?.market ?? "Kenya"}
Personality: ${req.body?.personality ?? "premium bold minimal"}`,
    });
  },
);

// GET /supervisors/:name/context - Get current context for a supervisor
router.get(
  "/:name/context",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const supervisorName = (req.params.name as string).toUpperCase();
      const userId = req.user!.userId;

      const validSupervisors = [
        "NOVA",
        "SAGE",
        "ATLAS",
        "CIRCUIT",
        "ARIA",
        "FORGE",
        "NEXUS",
        "HERALD",
      ];
      if (!validSupervisors.includes(supervisorName)) {
        return res.status(400).json({ error: "Invalid supervisor" });
      }

      const context = await getSupervisorContext(supervisorName, userId);
      res.json({ supervisor: supervisorName, context });
    } catch (error) {
      console.error("Get context error:", error);
      res.status(500).json({ error: "Failed to get context" });
    }
  },
);

// GET /supervisors - List all available supervisors
router.get("/", (req: Request, res: Response) => {
  res.json({
    supervisors: [
      {
        name: "OMEGA",
        emoji: "🧠",
        color: "#C9A84C",
        description: "Master Orchestrator",
        status: "live",
      },
      {
        name: "ARIA",
        emoji: "⬡",
        color: "#2B5F8E",
        description: "Core Engine Assistant",
        status: "live",
      },
      {
        name: "NOVA",
        emoji: "👥",
        color: "#89C4E1",
        description: "Community Intelligence",
        status: "live",
      },
      {
        name: "SAGE",
        emoji: "🎓",
        color: "#2DD4A0",
        description: "Academy Tutor",
        status: "live",
      },
      {
        name: "ATLAS",
        emoji: "🛒",
        color: "#E05A4E",
        description: "Market Intelligence",
        status: "live",
      },
      {
        name: "FORGE",
        emoji: "🤖",
        color: "#9B6FFF",
        description: "AI Platform",
        status: "live",
      },
      {
        name: "CIRCUIT",
        emoji: "💼",
        color: "#C9A84C",
        description: "Work Matchmaker",
        status: "live",
      },
      {
        name: "NEXUS",
        emoji: "☁️",
        color: "#89C4E1",
        description: "Cloud Developer",
        status: "live",
      },
      {
        name: "HERALD",
        emoji: "🧬",
        color: "#9B6FFF",
        description: "AI Infrastructure",
        status: "live",
      },
    ],
  });
});

export default router;
