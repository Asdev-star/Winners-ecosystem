import { Router } from "express";
import { PrismaClient, type Prisma } from "@prisma/client";
import { z } from "zod";
import { authMiddleware } from "../middleware/authMiddleware.js";

const prisma = new PrismaClient();
const router = Router();

const createSignalSchema = z.object({
  symbol: z.string().trim().min(1).max(20),
  type: z.enum(["BUY", "SELL", "HOLD"]),
  confidence: z.number().min(0).max(100),
  price: z.number().positive(),
  targetPrice: z.number().positive(),
  stopLoss: z.number().positive(),
  timeframe: z.string().trim().min(1),
  analysis: z.string().trim().min(1).optional(),
});

router.use(authMiddleware);

router.get("/signals", async (req, res) => {
  try {
    const signals = await prisma.tradingSignal.findMany({
      where: {
        tenantId: req.user!.tenantId,
        userId: req.user!.userId,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ signals });
  } catch (error) {
    console.error("Error fetching trading signals:", error);
    res.status(500).json({ error: "Failed to fetch trading signals" });
  }
});

router.post("/signals", async (req, res) => {
  try {
    const validatedData = createSignalSchema.parse(req.body);
    const data: Prisma.TradingSignalUncheckedCreateInput = {
      tenantId: req.user!.tenantId,
      userId: req.user!.userId,
      status: "active",
      ...validatedData,
    };

    const signal = await prisma.tradingSignal.create({ data });
    res.status(201).json({ signal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.issues });
    }
    console.error("Error creating trading signal:", error);
    res.status(500).json({ error: "Failed to create trading signal" });
  }
});

router.get("/signals/:id", async (req, res) => {
  const signalId = String(req.params.id);

  try {
    const signal = await prisma.tradingSignal.findFirst({
      where: {
        id: signalId,
        tenantId: req.user!.tenantId,
        userId: req.user!.userId,
      },
    });

    if (!signal) {
      return res.status(404).json({ error: "Trading signal not found" });
    }

    res.json({ signal });
  } catch (error) {
    console.error("Error fetching trading signal:", error);
    res.status(500).json({ error: "Failed to fetch trading signal" });
  }
});

router.put("/signals/:id", async (req, res) => {
  const signalId = String(req.params.id);

  try {
    const existingSignal = await prisma.tradingSignal.findFirst({
      where: {
        id: signalId,
        tenantId: req.user!.tenantId,
        userId: req.user!.userId,
      },
    });

    if (!existingSignal) {
      return res.status(404).json({ error: "Trading signal not found" });
    }

    const validatedData = createSignalSchema.partial().parse(req.body);
    const signal = await prisma.tradingSignal.update({
      where: { id: signalId },
      data: validatedData,
    });

    res.json({ signal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.issues });
    }
    console.error("Error updating trading signal:", error);
    res.status(500).json({ error: "Failed to update trading signal" });
  }
});

router.delete("/signals/:id", async (req, res) => {
  const signalId = String(req.params.id);

  try {
    const existingSignal = await prisma.tradingSignal.findFirst({
      where: {
        id: signalId,
        tenantId: req.user!.tenantId,
        userId: req.user!.userId,
      },
    });

    if (!existingSignal) {
      return res.status(404).json({ error: "Trading signal not found" });
    }

    await prisma.tradingSignal.delete({ where: { id: signalId } });
    res.json({ message: "Trading signal deleted successfully" });
  } catch (error) {
    console.error("Error deleting trading signal:", error);
    res.status(500).json({ error: "Failed to delete trading signal" });
  }
});

router.post("/signals/:id/subscribe", async (_req, res) => {
  res.json({
    subscription: null,
    message: "Signal subscriptions are not available in the current schema.",
  });
});

router.post("/signals/:id/unsubscribe", async (_req, res) => {
  res.json({
    subscription: null,
    message: "Signal subscriptions are not available in the current schema.",
  });
});

router.get("/portfolio", async (_req, res) => {
  res.json({ portfolio: [] });
});

router.post("/portfolio", async (_req, res) => {
  res.status(501).json({
    error: "Trading portfolio persistence is not available in the current schema.",
  });
});

router.delete("/portfolio/:id", async (_req, res) => {
  res.status(501).json({
    error: "Trading portfolio persistence is not available in the current schema.",
  });
});

router.get("/analyses", async (_req, res) => {
  res.json({ analyses: [] });
});

router.post("/analyses", async (_req, res) => {
  res.status(501).json({
    error: "Market analyses are not available in the current schema.",
  });
});

export default router;
