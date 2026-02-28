// Server/routes/chatRoutes.ts
// Phase 5 - Winners Intelligence Layer
// Aria chatbot: /chat/message (streaming SSE) + /chat/suggest (quick prompts)

import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();
router.use(authMiddleware);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.warn("[chatRoutes] ANTHROPIC_API_KEY not configured - AI chat will fail");
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY ?? "" });

// ARIA system prompt

const ARIA_SYSTEM = `You are ARIA, the AI assistant for the Winners Ecosystem - a premium digital platform built for African and diaspora entrepreneurs, creators, and professionals.

Your personality: Calm, precise, organised, and deeply knowledgeable about the Winners Ecosystem.

The Winners Ecosystem has 8 platforms:
1. Core Engine - workspace management, billing, analytics
2. Winners Community - social feed, groups, creator tools
3. Winners Academy - courses, certificates, AI tutoring
4. Winners Market - e-commerce, dropshipping, 10 verticals
5. Winners Intelligence - AI assistants, multimodal AI
6. Winners Work - freelance marketplace, escrow contracts
7. Mobile App - iOS/Android, offline-first
8. Winners Cloud - developer API, SDK, infrastructure

The 9 AI Assistants:
- OMEGA: Master Orchestrator (cross-platform intelligence)
- ARIA: Core Engine (you - dashboard, billing, workspace)
- NOVA: Community (content moderation, creator growth)
- SAGE: Academy (course tutoring, PDF analysis)
- ATLAS: Market (product research, vendor intelligence)
- FORGE: Intelligence (model routing, AI cost management)
- CIRCUIT: Work (job matching, proposal writing)
- NEXUS: Cloud (API guidance, SDK support)
- HERALD: AI Platform (Ollama management, GPU routing)

Your role: Help users navigate the platform, understand their analytics, manage their workspace, and get the most from the ecosystem. Be concise, actionable, and data-aware.

When users ask about features not yet built (Market, Work, Cloud), acknowledge they are coming soon and explain what they will do.

Always respond in clear, professional English. Use bullet points for lists. Keep responses focused and under 300 words unless the user asks for detail.`;

// POST /chat/message - streaming SSE

router.post("/message", async (req: Request, res: Response) => {
  const { message, history = [] } = req.body as {
    message: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  if (message.trim().length > 4000) {
    res.status(400).json({ error: "Message too long (max 4000 characters)" });
    return;
  }

  const recentHistory = history.slice(-10);
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...recentHistory,
    { role: "user", content: message.trim() },
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const stream = await anthropic.messages.create({
      model:      "claude-opus-4-6",
      max_tokens: 1024,
      system:     ARIA_SYSTEM,
      stream:     true,
      messages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: unknown) {
    console.error("[chatRoutes] stream error:", err);
    const fallback = "I am ARIA, your Winners Ecosystem assistant. I am having trouble connecting to my AI core right now. Please check that your ANTHROPIC_API_KEY is configured, or try again in a moment.";
    res.write(`data: ${JSON.stringify({ type: "text", text: fallback })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

// POST /chat/suggest - quick prompt suggestions

router.post("/suggest", (_req: Request, res: Response) => {
  const { context = "dashboard" } = _req.body as { context?: string };

  const suggestions: Record<string, string[]> = {
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
    community: [
      "How do I grow my community following?",
      "What content performs best on the platform?",
      "How do I create a group?",
      "Tell me about NOVA AI moderation",
    ],
    academy: [
      "What courses should I take first?",
      "How do I earn a certificate?",
      "Tell me about SAGE AI tutoring",
      "How do I become an instructor?",
    ],
    billing: [
      "What is included in Winners Pro?",
      "How do I upgrade my plan?",
      "Explain the referral commission structure",
      "How does the AI credits system work?",
    ],
    intelligence: [
      "What can ARIA help me with?",
      "Tell me about the 9 AI assistants",
      "How does the multimodal AI work?",
      "What is OMEGA and what does it do?",
    ],
  };

  const contextKey = Object.keys(suggestions).find((k) => context.toLowerCase().includes(k)) ?? "dashboard";
  res.json({ suggestions: suggestions[contextKey] });
});

// GET /chat/assistants - list all 9 assistants

router.get("/assistants", (_req: Request, res: Response) => {
  res.json({
    assistants: [
      { id: "omega",   name: "OMEGA",   layer: "Orchestrator",  status: "active",  description: "Master orchestrator - cross-platform intelligence and Agentic Loop driver" },
      { id: "aria",    name: "ARIA",    layer: "Core Engine",   status: "active",  description: "Dashboard insights, billing help, workspace management" },
      { id: "nova",    name: "NOVA",    layer: "Community",     status: "soon",    description: "Content moderation, creator growth, talent detection" },
      { id: "sage",    name: "SAGE",    layer: "Academy",       status: "soon",    description: "Course tutoring, PDF analysis, lecture notes, skill guidance" },
      { id: "atlas",   name: "ATLAS",   layer: "Market",        status: "planned", description: "Product research, pricing strategy, vendor intelligence" },
      { id: "forge",   name: "FORGE",   layer: "Intelligence",  status: "planned", description: "Model routing, AI cost management, multimodal orchestration" },
      { id: "circuit", name: "CIRCUIT", layer: "Work",          status: "planned", description: "Job matching, proposal writing, contract review, code review" },
      { id: "nexus",   name: "NEXUS",   layer: "Cloud",         status: "planned", description: "API guidance, SDK support, integration troubleshooting" },
      { id: "herald",  name: "HERALD",  layer: "AI Platform",   status: "planned", description: "Ollama management, GPU routing, model benchmarking" },
    ],
  });
});

export default router;
