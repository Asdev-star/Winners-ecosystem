// Server/routes/aiPlatformRoutes.ts
// Express proxy to FastAPI multimodal AI service
// Routes: /api/v1/ai-platform/* -> http://ai-platform:8001/api/v1/*

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  checkAICredits,
  deductAICredits,
} from "../middleware/aiCreditsMiddleware.js";
import multer from "multer";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// FastAPI service URL
const AI_PLATFORM_URL = process.env.AI_PLATFORM_URL || "http://localhost:8002";

// Type for AI Platform responses
interface AIPlatformResponse {
  response?: string;
  provider?: string;
  tokens_used?: number;
  latency_ms?: number;
  assistant?: string;
  error?: string;
  herald_uptime?: string;
  services?: Record<string, any>;
  routing_priority?: string;
  [key: string]: unknown;
}

// Helper to forward requests to FastAPI
async function forwardToAIPlatform(
  endpoint: string,
  method: string,
  body?: unknown,
): Promise<AIPlatformResponse> {
  try {
    const response = await fetch(`${AI_PLATFORM_URL}${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response
      .json()
      .catch(async () => ({ error: await response.text() }));
    if (!response.ok) {
      throw new Error(
        (payload as AIPlatformResponse).error ||
          `AI platform ${response.status}`,
      );
    }
    return payload as AIPlatformResponse;
  } catch (error) {
    console.error("[aiPlatformRoutes] Forward error:", error);
    throw error;
  }
}

// Health check - doesn't require auth
router.get("/health", async (_req: Request, res: Response) => {
  try {
    const data = await forwardToAIPlatform("/health", "GET");
    res.json(data);
  } catch (error) {
    res.status(503).json({
      error: "AI Platform unavailable",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// List available assistants
router.get("/assistants", async (_req: Request, res: Response) => {
  try {
    const data = await forwardToAIPlatform("/api/v1/assistants", "GET");
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assistants" });
  }
});

// List available models
router.get("/models", async (_req: Request, res: Response) => {
  try {
    const data = await forwardToAIPlatform("/api/v1/models", "GET");
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

// HERALD orchestration status
router.get(
  "/herald/status",
  authMiddleware,
  async (_req: Request, res: Response) => {
    try {
      const data = await forwardToAIPlatform("/health/herald", "GET");
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch HERALD status" });
    }
  },
);

// System monitoring
router.get("/monitor", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const data = await forwardToAIPlatform("/health/monitor", "GET");
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch monitor status" });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Image Generation (with credit metering)
// ─────────────────────────────────────────────────────────────────────────

router.post(
  "/images/generate",
  authMiddleware,
  checkAICredits,
  async (req: Request, res: Response) => {
    try {
      const data = await forwardToAIPlatform(
        "/api/v1/images/generate",
        "POST",
        req.body,
      );

      // Deduct credits for image generation (5 credits)
      if (req.user && data.response) {
        await deductAICredits(req.user.userId, req.user.tenantId, "forge", 5);
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Image generation failed" });
    }
  },
);

router.get("/images/status/:promptId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const promptId = String(req.params.promptId);
    const response = await fetch(`${AI_PLATFORM_URL}/api/v1/images/status/${encodeURIComponent(promptId)}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || "Failed to fetch image status" });
    }

    res.json(data);
  } catch (error) {
    console.error("[aiPlatformRoutes] Image status error:", error);
    res.status(500).json({ error: "Image status request failed" });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Speech to Text - Transcription
// ─────────────────────────────────────────────────────────────────────────

router.post(
  "/speech/transcribe",
  authMiddleware,
  upload.single("audio"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Audio file required" });
      }

      const formData = new FormData();
      const uint8Array = new Uint8Array(req.file.buffer);
      const blob = new Blob([uint8Array], { type: req.file.mimetype });
      formData.append("file", blob, req.file.originalname);
      if (req.body.model) formData.append("model", req.body.model);

      const response = await fetch(`${AI_PLATFORM_URL}/api/v1/speech/stt`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "STT request failed" });
    }
  },
);

// Legacy alias for speech/stt
router.post(
  "/speech/stt",
  authMiddleware,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Audio file required" });
      }

      const formData = new FormData();
      const uint8Array = new Uint8Array(req.file.buffer);
      const blob = new Blob([uint8Array], { type: req.file.mimetype });
      formData.append("file", blob, req.file.originalname);
      if (req.body.model) formData.append("model", req.body.model);

      const response = await fetch(`${AI_PLATFORM_URL}/api/v1/speech/stt`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "STT request failed" });
    }
  },
);

router.post(
  "/speech/tts",
  authMiddleware,
  checkAICredits,
  async (req: Request, res: Response) => {
    try {
      const { text, voice, provider } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const data = await forwardToAIPlatform("/api/v1/speech/tts", "POST", {
        text,
        voice,
        provider,
      });

      if (req.user && data && data.audio) {
        await deductAICredits(req.user.userId, req.user.tenantId, "forge", 2);
      }

      res.json(data);
    } catch (error) {
      console.error("[aiPlatformRoutes] TTS error:", error);
      res
        .status(500)
        .json({
          error: "TTS request failed",
          details: error instanceof Error ? error.message : "Unknown error",
        });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────
// SSE Streaming Chat (with credit metering)
// ─────────────────────────────────────────────────────────────────────────

router.post(
  "/chat/stream",
  authMiddleware,
  checkAICredits,
  async (req: Request, res: Response) => {
    try {
      const { message, model = "claude", assistant, history } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Set SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      // Forward to FastAPI streaming endpoint
      const upstream = await fetch(
        `${AI_PLATFORM_URL}/api/v1/chat/stream?message=${encodeURIComponent(message)}&model=${encodeURIComponent(model)}`,
        {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
          },
        },
      );

      if (!upstream.ok) {
        res
          .status(upstream.status)
          .json({ error: "Upstream streaming failed" });
        return;
      }

      // Pipe SSE stream directly to client
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        res.write(chunk);
      }

      res.end();

      // Deduct credits after successful response
      if (req.user) {
        await deductAICredits(
          req.user.userId,
          req.user.tenantId,
          assistant || "chat",
          2,
        );
      }
    } catch (error) {
      console.error("[aiPlatformRoutes] Streaming chat error:", error);
      res.status(500).json({
        error: "Streaming AI request failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────
// Main Chat (non-streaming with credit metering)
// ─────────────────────────────────────────────────────────────────────────

router.post(
  "/chat",
  authMiddleware,
  checkAICredits,
  async (req: Request, res: Response) => {
    try {
      const { message, model = "claude", assistant, history, files } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const requestBody = {
        message,
        model,
        assistant,
        history: history || [],
        files: files || [],
      };

      const data = await forwardToAIPlatform(
        "/api/v1/chat",
        "POST",
        requestBody,
      );

      // Deduct credits after successful response
      if (req.user && data.response) {
        await deductAICredits(
          req.user.userId,
          req.user.tenantId,
          assistant || "chat",
          2,
        );
      }

      res.json(data);
    } catch (error) {
      console.error("[aiPlatformRoutes] Chat error:", error);
      res.status(500).json({
        error: "AI request failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────
// Multimodal Chat with file upload (with credit metering)
// ─────────────────────────────────────────────────────────────────────────

router.post(
  "/multimodal",
  authMiddleware,
  checkAICredits,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const message = req.body.message || "";
      const model = req.body.model || "claude";
      const assistant = req.body.assistant || null;

      if (!message && !req.file) {
        return res.status(400).json({ error: "Message or file required" });
      }

      // Create FormData to send to FastAPI
      const formData = new FormData();
      formData.append("message", message);
      formData.append("model", model);
      if (assistant) formData.append("assistant", assistant);

      if (req.file) {
        // Convert buffer to Uint8Array for Blob compatibility
        const uint8Array = new Uint8Array(req.file.buffer);
        const blob = new Blob([uint8Array], { type: req.file.mimetype });
        formData.append("file", blob, req.file.originalname);
      }

      // Forward to FastAPI
      const response = await fetch(`${AI_PLATFORM_URL}/api/v1/multimodal`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as AIPlatformResponse;
      res.json(data);
    } catch (error) {
      console.error("[aiPlatformRoutes] Multimodal error:", error);
      res.status(500).json({
        error: "Multimodal AI request failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────
// Analyze Endpoint - Auto-route by file type via FORGE (with credit metering)
// This is different from /multimodal - it's specifically for file analysis
// ─────────────────────────────────────────────────────────────────────────

router.post(
  "/analyze",
  authMiddleware,
  checkAICredits,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { prompt, provider } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: "File required" });
      }

      // FORGE routes automatically based on file type
      const formData = new FormData();
      const uint8Array = new Uint8Array(req.file.buffer);
      const blob = new Blob([uint8Array], { type: req.file.mimetype });
      formData.append("file", blob, req.file.originalname);
      formData.append(
        "prompt",
        prompt || "Analyse this file and provide a structured summary.",
      );
      if (provider) formData.append("provider", provider);

      const response = await fetch(`${AI_PLATFORM_URL}/api/v1/multimodal`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as AIPlatformResponse;

      // Deduct credits based on file type
      if (req.user && data.response) {
        let creditCost = 5; // default for images
        const mimeType = req.file.mimetype;

        if (mimeType === "application/pdf") {
          creditCost = 6;
        } else if (mimeType.startsWith("audio/")) {
          creditCost = 4;
        } else if (mimeType.startsWith("video/")) {
          creditCost = 10;
        }

        await deductAICredits(
          req.user.userId,
          req.user.tenantId,
          "forge",
          creditCost,
        );
      }

      res.json(data);
    } catch (error) {
      console.error("[aiPlatformRoutes] Analyze error:", error);
      res.status(500).json({
        error: "File analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Chat with specific assistant
router.post(
  "/assistants/:assistantName/chat",
  authMiddleware,
  checkAICredits,
  async (req: Request, res: Response) => {
    try {
      const assistantName = String(req.params.assistantName);
      const { message, model, history, files } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const requestBody = {
        message,
        model: model || "claude",
        history: history || [],
        files: files || [],
      };

      const data = await forwardToAIPlatform(
        `/api/v1/assistants/${assistantName}/chat`,
        "POST",
        requestBody,
      );

      // Deduct credits
      if (req.user && data.response) {
        await deductAICredits(
          req.user.userId,
          req.user.tenantId,
          assistantName,
          2,
        );
      }

      res.json(data);
    } catch (error) {
      console.error("[aiPlatformRoutes] Assistant chat error:", error);
      res.status(500).json({
        error: "Assistant request failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
