import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/authMiddleware.js";

const prisma = new PrismaClient();

const router = Router();

// Validation schemas
const createSignalSchema = z.object({
  symbol: z.string().min(1).max(20),
  type: z.enum(["BUY", "SELL", "HOLD"]),
  confidence: z.number().min(0).max(100),
  price: z.number().positive(),
  targetPrice: z.number().positive(),
  stopLoss: z.number().positive(),
  timeframe: z.string().min(1),
  analysis: z.string().min(1),
});

const updatePortfolioSchema = z.object({
  symbol: z.string().min(1).max(20),
  quantity: z.number().positive(),
  avgPrice: z.number().positive(),
  currentPrice: z.number().positive(),
});

// GET /api/trading/signals - Get all trading signals
router.get("/signals", authenticateToken, async (req, res) => {
  try {
    const signals = await prisma.tradingSignal.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });

    res.json({ signals });
  } catch (error) {
    console.error("Error fetching trading signals:", error);
    res.status(500).json({ error: "Failed to fetch trading signals" });
  }
});

// POST /api/trading/signals - Create a new trading signal
router.post("/signals", authenticateToken, async (req, res) => {
  try {
    const validatedData = createSignalSchema.parse(req.body);

    const signal = await prisma.tradingSignal.create({
      data: {
        ...validatedData,
        userId: req.user!.id,
        status: "active",
      },
    });

    res.status(201).json({ signal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid input", details: error.errors });
    }
    console.error("Error creating trading signal:", error);
    res.status(500).json({ error: "Failed to create trading signal" });
  }
});

// GET /api/trading/signals/:id - Get a specific trading signal
router.get("/signals/:id", authenticateToken, async (req, res) => {
  try {
    const signal = await prisma.tradingSignal.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
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

// PUT /api/trading/signals/:id - Update a trading signal
router.put("/signals/:id", authenticateToken, async (req, res) => {
  try {
    const existingSignal = await prisma.tradingSignal.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!existingSignal) {
      return res.status(404).json({ error: "Trading signal not found" });
    }

    const validatedData = createSignalSchema.partial().parse(req.body);

    const signal = await prisma.tradingSignal.update({
      where: { id: req.params.id },
      data: validatedData,
    });

    res.json({ signal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid input", details: error.errors });
    }
    console.error("Error updating trading signal:", error);
    res.status(500).json({ error: "Failed to update trading signal" });
  }
});

// DELETE /api/trading/signals/:id - Delete a trading signal
router.delete("/signals/:id", authenticateToken, async (req, res) => {
  try {
    const existingSignal = await prisma.tradingSignal.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!existingSignal) {
      return res.status(404).json({ error: "Trading signal not found" });
    }

    await prisma.tradingSignal.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Trading signal deleted successfully" });
  } catch (error) {
    console.error("Error deleting trading signal:", error);
    res.status(500).json({ error: "Failed to delete trading signal" });
  }
});

// POST /api/trading/signals/:id/subscribe - Subscribe to a trading signal
router.post("/signals/:id/subscribe", authenticateToken, async (req, res) => {
  try {
    const signal = await prisma.tradingSignal.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!signal) {
      return res.status(404).json({ error: "Trading signal not found" });
    }

    const subscription = await prisma.signalSubscription.upsert({
      where: {
        userId_signalId: {
          userId: req.user!.id,
          signalId: req.params.id,
        },
      },
      update: { active: true },
      create: {
        userId: req.user!.id,
        signalId: req.params.id,
        active: true,
      },
    });

    res.json({ subscription });
  } catch (error) {
    console.error("Error subscribing to signal:", error);
    res.status(500).json({ error: "Failed to subscribe to signal" });
  }
});

// POST /api/trading/signals/:id/unsubscribe - Unsubscribe from a trading signal
router.post("/signals/:id/unsubscribe", authenticateToken, async (req, res) => {
  try {
    const subscription = await prisma.signalSubscription.findFirst({
      where: {
        userId: req.user!.id,
        signalId: req.params.id,
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    await prisma.signalSubscription.update({
      where: { id: subscription.id },
      data: { active: false },
    });

    res.json({ message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Error unsubscribing from signal:", error);
    res.status(500).json({ error: "Failed to unsubscribe from signal" });
  }
});

// GET /api/trading/portfolio - Get user's portfolio
router.get("/portfolio", authenticateToken, async (req, res) => {
  try {
    const portfolio = await prisma.portfolioItem.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });

    res.json({ portfolio });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});

// POST /api/trading/portfolio - Add or update portfolio item
router.post("/portfolio", authenticateToken, async (req, res) => {
  try {
    const validatedData = updatePortfolioSchema.parse(req.body);

    const portfolioItem = await prisma.portfolioItem.upsert({
      where: {
        userId_symbol: {
          userId: req.user!.id,
          symbol: validatedData.symbol,
        },
      },
      update: {
        quantity: validatedData.quantity,
        avgPrice: validatedData.avgPrice,
        currentPrice: validatedData.currentPrice,
        pnl:
          (validatedData.currentPrice - validatedData.avgPrice) *
          validatedData.quantity,
        pnlPercent:
          ((validatedData.currentPrice - validatedData.avgPrice) /
            validatedData.avgPrice) *
          100,
      },
      create: {
        ...validatedData,
        userId: req.user!.id,
        pnl:
          (validatedData.currentPrice - validatedData.avgPrice) *
          validatedData.quantity,
        pnlPercent:
          ((validatedData.currentPrice - validatedData.avgPrice) /
            validatedData.avgPrice) *
          100,
      },
    });

    res.json({ portfolioItem });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid input", details: error.errors });
    }
    console.error("Error updating portfolio:", error);
    res.status(500).json({ error: "Failed to update portfolio" });
  }
});

// DELETE /api/trading/portfolio/:id - Remove portfolio item
router.delete("/portfolio/:id", authenticateToken, async (req, res) => {
  try {
    const portfolioItem = await prisma.portfolioItem.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!portfolioItem) {
      return res.status(404).json({ error: "Portfolio item not found" });
    }

    await prisma.portfolioItem.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Portfolio item deleted successfully" });
  } catch (error) {
    console.error("Error deleting portfolio item:", error);
    res.status(500).json({ error: "Failed to delete portfolio item" });
  }
});

// GET /api/trading/analyses - Get market analyses
router.get("/analyses", authenticateToken, async (req, res) => {
  try {
    const analyses = await prisma.marketAnalysis.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.json({ analyses });
  } catch (error) {
    console.error("Error fetching market analyses:", error);
    res.status(500).json({ error: "Failed to fetch market analyses" });
  }
});

// POST /api/trading/analyses - Create a market analysis (admin only)
router.post("/analyses", authenticateToken, async (req, res) => {
  try {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { title, summary, sentiment, confidence, assets } = req.body;

    const analysis = await prisma.marketAnalysis.create({
      data: {
        title,
        summary,
        sentiment,
        confidence,
        assets,
      },
    });

    res.status(201).json({ analysis });
  } catch (error) {
    console.error("Error creating market analysis:", error);
    res.status(500).json({ error: "Failed to create market analysis" });
  }
});

export default router;
