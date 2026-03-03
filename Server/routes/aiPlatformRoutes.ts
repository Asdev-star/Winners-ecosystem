// Server/routes/aiPlatformRoutes.ts
// Express proxy to FastAPI multimodal AI service
// Routes: /api/v1/ai-platform/* -> http://ai-platform:8001/api/v1/*

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// FastAPI service URL
const AI_PLATFORM_URL = process.env.AI_PLATFORM_URL || "http://localhost:8001";

// Type for AI Platform responses
interface AIPlatformResponse {
  response?: string;
  provider?: string;
  tokens_used?: number;
  latency_ms?: number;
  assistant?: string;
  error?: string;
  [key: string]: unknown;
}

// Helper to forward requests to FastAPI
async function forwardToAIPlatform(endpoint: string, method: string, body?: unknown): Promise<AIPlatformResponse> {
  try {
    const response = await fetch(`${AI_PLATFORM_URL}${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return await response.json() as AIPlatformResponse;
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
      details: error instanceof Error ? error.message : "Unknown error"
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

// Main chat endpoint
router.post("/chat", authMiddleware, async (req: Request, res: Response) => {
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

    const data = await forwardToAIPlatform("/api/v1/chat", "POST", requestBody);
    res.json(data);
  } catch (error) {
    console.error("[aiPlatformRoutes] Chat error:", error);
    res.status(500).json({ 
      error: "AI request failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Multimodal chat with file upload
router.post(
  "/multimodal",
  authMiddleware,
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

      const data = await response.json() as AIPlatformResponse;
      res.json(data);
    } catch (error) {
      console.error("[aiPlatformRoutes] Multimodal error:", error);
      res.status(500).json({ 
        error: "Multimodal AI request failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

// Chat with specific assistant
router.post("/assistants/:assistantName/chat", authMiddleware, async (req: Request, res: Response) => {
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
      requestBody
    );

    res.json(data);
  } catch (error) {
    console.error("[aiPlatformRoutes] Assistant chat error:", error);
    res.status(500).json({ 
      error: "Assistant request failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
