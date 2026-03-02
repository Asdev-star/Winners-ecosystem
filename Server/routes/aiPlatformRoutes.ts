// server/routes/aiPlatformRoutes.ts
// LEVEL VI - Multimodal Intelligence
// Handles: images, PDFs, audio, video uploads and processing

import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "/tmp/ai-uploads");
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      // Images
      "image/jpeg", "image/png", "image/gif", "image/webp",
      // PDF
      "application/pdf",
      // Audio
      "audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg", "audio/m4a",
      // Video
      "video/mp4", "video/webm", "video/quicktime",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  },
});

// ─── Types ──────────────────────────────────────────────────────────────────

interface FileMeta {
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
}

interface MultimodalRequest extends Request {
  files?: FileMeta[];
}

// ─── Routes ────────────────────────────────────────────────────────────────

// POST /api/v1/ai-platform/multimodal - Main multimodal chat endpoint
router.post(
  "/multimodal",
  upload.array("files", 10),
  async (req: MultimodalRequest, res: Response) => {
    try {
      const { message, model, assistant } = req.body;
      const files = req.files as FileMeta[];

      // Determine file types
      const hasImages = files?.some((f) => f.mimeType.startsWith("image/"));
      const hasPDF = files?.some((f) => f.mimeType === "application/pdf");
      const hasAudio = files?.some((f) => f.mimeType.startsWith("audio/"));
      const hasVideo = files?.some((f) => f.mimeType.startsWith("video/"));

      // Route to appropriate provider based on file types
      let provider = model || "claude";
      
      if (hasVideo && !model) {
        provider = "gemini"; // Best for video
      } else if (hasAudio && !model) {
        provider = "gpt4o"; // Best for audio/whisper
      } else if (hasPDF && !model) {
        provider = "claude"; // Best for PDFs
      } else if (hasImages && !model) {
        provider = "claude"; // Best for image reasoning
      }

      // Build response (simplified - actual implementation would call AI APIs)
      const response = {
        success: true,
        provider,
        message,
        files: files?.map((f) => ({
          name: f.originalName,
          type: f.mimeType,
          size: f.size,
        })),
        // In production, this would be the actual AI response
        response: `[${provider.toUpperCase()} would process: ${files?.length || 0} file(s)]`,
        tokens: Math.floor((message?.length || 0) / 4),
        latencyMs: 1500,
      };

      res.json(response);
    } catch (error) {
      console.error("Multimodal error:", error);
      res.status(500).json({ error: "Failed to process multimodal request" });
    }
  }
);

// POST /api/v1/ai-platform/assistants/:name/chat - Named assistant chat
router.post(
  "/assistants/:name/chat",
  upload.array("files", 5),
  async (req: MultimodalRequest, res: Response) => {
    try {
      const { name } = req.params;
      const { message, context } = req.body;
      const files = req.files as FileMeta[];

      // Validate assistant name
      const validAssistants = [
        "aria", "nova", "sage", "atlas", "forge", 
        "circuit", "nexus", "herald", "omega"
      ];
      
      if (!validAssistants.includes(name.toLowerCase())) {
        return res.status(400).json({ error: `Invalid assistant: ${name}` });
      }

      // Build system prompt based on assistant
      const systemPrompts: Record<string, string> = {
        aria: "You are ARIA, Core Engine Intelligence. Calm, precise, organized. Help with dashboard insights, billing, workspace management.",
        nova: "You are NOVA, Community Intelligence. Warm, trend-aware, creative. Help with content moderation, creator growth, talent detection.",
        sage: "You are SAGE, Academy Intelligence. Patient, knowledgeable, encouraging. Help with course tutoring, PDF analysis, skill guidance.",
        atlas: "You are ATLAS, Market Intelligence. Analytical, commercial, data-driven. Help with product research, pricing strategy.",
        forge: "You are FORGE, Intelligence Platform. Technical, precise, performance-focused. Help with model routing, AI cost management.",
        circuit: "You are CIRCUIT, Work Intelligence. Professional, tactical, results-oriented. Help with job matching, proposal writing, contract review.",
        nexus: "You are NEXUS, Cloud Intelligence. Developer-focused, documentation-expert. Help with API guidance, SDK support, troubleshooting.",
        herald: "You are HERALD, AI Platform. Technical, infrastructure-focused. Help with Ollama management, GPU routing, model benchmarking.",
        omega: "You are OMEGA, Master Orchestrator. Strategic, visionary. Supervise all layers and drive the Agentic Loop.",
      };

      const response = {
        success: true,
        assistant: name,
        systemPrompt: systemPrompts[name.toLowerCase()],
        message,
        context: context || {},
        files: files?.map((f) => ({
          name: f.originalName,
          type: f.mimeType,
        })),
        response: `[${name.toUpperCase()} response to: "${message}"]`,
        tokens: Math.floor((message?.length || 0) / 4),
        memoryLoaded: true,
      };

      res.json(response);
    } catch (error) {
      console.error("Assistant chat error:", error);
      res.status(500).json({ error: "Failed to process assistant request" });
    }
  }
);

// GET /api/v1/ai-platform/models - List available models
router.get("/models", (_req, res) => {
  res.json({
    models: [
      { id: "claude", name: "Claude 3.5 Sonnet", bestFor: "Reasoning, PDFs, Images", color: "#D97706" },
      { id: "gpt4o", name: "GPT-4o", bestFor: "Vision, Audio, Code", color: "#10B981" },
      { id: "gemini", name: "Gemini 1.5 Pro", bestFor: "Video, Long context", color: "#8B5CF6" },
      { id: "ollama", name: "Ollama (Local)", bestFor: "Offline, Free, Privacy", color: "#06B6D4" },
    ],
    default: "claude",
  });
});

// GET /api/v1/ai-platform/assistants - List assistants
router.get("/assistants", (_req, res) => {
  res.json({
    assistants: [
      { id: "aria", name: "ARIA", layer: "Core Engine", emoji: "⬡" },
      { id: "nova", name: "NOVA", layer: "Community", emoji: "👥" },
      { id: "sage", name: "SAGE", layer: "Academy", emoji: "🎓" },
      { id: "atlas", name: "ATLAS", layer: "Market", emoji: "🛒" },
      { id: "forge", name: "FORGE", layer: "Intelligence", emoji: "🤖" },
      { id: "circuit", name: "CIRCUIT", layer: "Work", emoji: "💼" },
      { id: "nexus", name: "NEXUS", layer: "Cloud", emoji: "☁️" },
      { id: "herald", name: "HERALD", layer: "AI Platform", emoji: "🧬" },
      { id: "omega", name: "OMEGA", layer: "Orchestrator", emoji: "🧠" },
    ],
  });
});

// POST /api/v1/ai-platform/credits/check - Check user credits
router.get("/credits/check", async (req, res) => {
  try {
    const userId = req.user?.userId;
    // In production, query database for user's credit balance
    res.json({
      userId,
      credits: 100, // Default from free tier
      plan: "free",
      used: 0,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to check credits" });
  }
});

export default router;
