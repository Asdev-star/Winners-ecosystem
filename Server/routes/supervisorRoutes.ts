// Phase 5 - Intelligence Layer
// Routes: supervisorRoutes
// Individual supervisor endpoints with context injection

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();
const prisma = db;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const AI_PLATFORM_URL = process.env.AI_PLATFORM_URL || 'http://localhost:8001';

// Get context for a specific supervisor
const getSupervisorContext = async (supervisor: string, userId: string) => {
  const baseContext = {
    userId,
    timestamp: new Date().toISOString(),
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
        detectedSkills: skills.map((s) => s.skill),
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
        userSkills: skills.map((s) => s.skill),
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
        userSkills: skills.map((s) => s.skill),
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
Current context: ${JSON.stringify(mergedContext)}`,

      SAGE: `You are SAGE, the Winners Ecosystem Academy Tutor.
You are patient, knowledgeable, and encouraging.
Your role is to help users learn, understand concepts, and progress through courses.
Current context: ${JSON.stringify(mergedContext)}`,

      ATLAS: `You are ATLAS, the Winners Ecosystem Market Intelligence.
You are analytical, commercial, and data-driven.
Your role is to help users with product research, pricing strategies, and vendor opportunities.
Current context: ${JSON.stringify(mergedContext)}`,

      CIRCUIT: `You are CIRCUIT, the Winners Ecosystem Work Matchmaker.
You are professional, tactical, and results-oriented.
Your role is to help users find jobs, write proposals, and advance their careers.
Current context: ${JSON.stringify(mergedContext)}`,

      ARIA: `You are ARIA, the Winners Ecosystem Core Engine Assistant.
You are calm, precise, and organized.
Your role is to help users with dashboard insights, billing, and workspace management.
Current context: ${JSON.stringify(mergedContext)}`,

      FORGE: `You are FORGE, the Winners Ecosystem Intelligence Platform.
You are technical, precise, and performance-focused.
Your role is to help users with AI model routing, multimodal tasks, and performance optimization.
Current context: ${JSON.stringify(mergedContext)}`,

      NEXUS: `You are NEXUS, the Winners Ecosystem Cloud Developer Advocate.
You are developer-focused and documentation-expert.
Your role is to help users with API guidance, SDK support, and integration troubleshooting.
Current context: ${JSON.stringify(mergedContext)}`,

      HERALD: `You are HERALD, the Winners AI Platform Infrastructure Supervisor.
You are technical and infrastructure-focused.
Your role is to help users with Ollama management, GPU routing, and model benchmarking.
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
