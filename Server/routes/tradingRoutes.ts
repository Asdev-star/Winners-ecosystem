import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireMinRole } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";
import {
  initializeVirtualPortfolio,
  getVirtualPortfolio,
  virtualBuy,
  virtualSell,
  updatePortfolioPrices,
  getTradingSignals,
  createTradingSignal,
} from "../services/tradingService";

const router = Router();
const prisma = new PrismaClient();

// Get user's virtual portfolio
router.get("/portfolio", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    let portfolio = await getVirtualPortfolio(userId);

    if (!portfolio) {
      // Initialize portfolio if it doesn't exist
      portfolio = await initializeVirtualPortfolio(userId, req.user.tenantId);
    }

    res.json(portfolio);
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});

// Update portfolio prices
router.post("/portfolio/update-prices", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const portfolio = await updatePortfolioPrices(userId);
    res.json(portfolio);
  } catch (error) {
    console.error("Error updating portfolio prices:", error);
    res.status(500).json({ error: "Failed to update portfolio prices" });
  }
});

// Virtual buy order
router.post("/portfolio/buy", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { symbol, quantity, price } = req.body;

    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Invalid symbol or quantity" });
    }

    const position = await virtualBuy(
      userId,
      symbol.toUpperCase(),
      quantity,
      price,
    );
    res.json(position);
  } catch (error: any) {
    console.error("Error executing buy order:", error);
    res.status(400).json({ error: error.message });
  }
});

// Virtual sell order
router.post("/portfolio/sell", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { symbol, quantity, price } = req.body;

    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Invalid symbol or quantity" });
    }

    const position = await virtualSell(
      userId,
      symbol.toUpperCase(),
      quantity,
      price,
    );
    res.json(position);
  } catch (error: any) {
    console.error("Error executing sell order:", error);
    res.status(400).json({ error: error.message });
  }
});

// Get trading signals
router.get("/signals", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userPlan = req.user.plan || "FREE";

    const signals = await getTradingSignals(tenantId, userPlan);
    res.json(signals);
  } catch (error) {
    console.error("Error fetching trading signals:", error);
    res.status(500).json({ error: "Failed to fetch trading signals" });
  }
});

// Create trading signal (creators only)
router.post("/signals", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const creatorId = req.user.userId;
    const userPlan = req.user.plan || "FREE";

    // Check if user has permission to create signals
    if (userPlan === "FREE") {
      return res
        .status(403)
        .json({ error: "Pro or Enterprise plan required to create signals" });
    }

    const {
      asset,
      direction,
      entryPrice,
      targetPrice,
      stopLoss,
      confidence,
      tier,
      expiresAt,
    } = req.body;

    // Validate required fields
    if (
      !asset ||
      !direction ||
      !entryPrice ||
      !targetPrice ||
      !stopLoss ||
      !confidence ||
      !expiresAt
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["buy", "sell"].includes(direction)) {
      return res.status(400).json({ error: "Direction must be buy or sell" });
    }

    if (confidence < 1 || confidence > 100) {
      return res
        .status(400)
        .json({ error: "Confidence must be between 1 and 100" });
    }

    const expiresDate = new Date(expiresAt);
    if (expiresDate <= new Date()) {
      return res
        .status(400)
        .json({ error: "Expiration date must be in the future" });
    }

    const signal = await createTradingSignal(tenantId, creatorId, {
      asset: asset.toUpperCase(),
      direction,
      entryPrice: parseFloat(entryPrice),
      targetPrice: parseFloat(targetPrice),
      stopLoss: parseFloat(stopLoss),
      confidence: parseInt(confidence),
      tier: tier || "free",
      expiresAt: expiresDate,
    });

    res.status(201).json(signal);
  } catch (error) {
    console.error("Error creating trading signal:", error);
    res.status(500).json({ error: "Failed to create trading signal" });
  }
});

// Get user's created signals
router.get("/signals/my", authMiddleware, async (req, res) => {
  try {
    const creatorId = req.user.userId;
    const tenantId = req.user.tenantId;

    const signals = await prisma.tradingSignal.findMany({
      where: {
        creatorId,
        tenantId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(signals);
  } catch (error) {
    console.error("Error fetching user signals:", error);
    res.status(500).json({ error: "Failed to fetch user signals" });
  }
});

// Update signal result (admin/creator only)
router.put("/signals/:id/result", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { result } = req.body;

    if (!["win", "loss"].includes(result)) {
      return res.status(400).json({ error: "Result must be win or loss" });
    }

    // Check if user owns the signal or is admin
    const signal = await prisma.tradingSignal.findUnique({
      where: { id },
    });

    if (!signal) {
      return res.status(404).json({ error: "Signal not found" });
    }

    if (
      signal.creatorId !== userId &&
      req.user.role !== "admin" &&
      req.user.role !== "owner"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this signal" });
    }

    await prisma.tradingSignal.update({
      where: { id },
      data: { result },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating signal result:", error);
    res.status(500).json({ error: "Failed to update signal result" });
  }
});

// Get market data for a symbol
router.get("/market/:symbol", authMiddleware, async (req, res) => {
  try {
    const { symbol } = req.params;

    // This would integrate with Polygon.io or another market data provider
    // For now, return mock data
    const mockData = {
      symbol: symbol.toUpperCase(),
      price: Math.random() * 1000 + 100, // Mock price
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 1000000),
      marketCap: Math.random() * 1000000000,
    };

    res.json(mockData);
  } catch (error) {
    console.error("Error fetching market data:", error);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

// Get portfolio performance history
router.get("/portfolio/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // This would track portfolio value over time
    // For now, return mock historical data
    const history = [];
    const baseValue = 10000;
    let currentValue = baseValue;

    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      currentValue += (Math.random() - 0.5) * 200; // Random daily change
      currentValue = Math.max(0, currentValue); // Don't go negative

      history.push({
        date: date.toISOString().split("T")[0],
        value: Math.round(currentValue * 100) / 100,
      });
    }

    res.json(history);
  } catch (error) {
    console.error("Error fetching portfolio history:", error);
    res.status(500).json({ error: "Failed to fetch portfolio history" });
  }
});

// Get market analyses (Enterprise only)
router.get("/analyses", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userPlan = req.user.plan || "FREE";

    // Only Enterprise users can access ATLAS market analysis
    if (userPlan !== "ENTERPRISE") {
      return res
        .status(403)
        .json({ error: "Enterprise plan required for market analysis" });
    }

    const analyses = await prisma.marketAnalysis.findMany({
      where: {
        tenantId,
        tier: "enterprise",
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(analyses);
  } catch (error) {
    console.error("Error fetching market analyses:", error);
    res.status(500).json({ error: "Failed to fetch market analyses" });
  }
});

// Create market analysis (Enterprise creators only)
router.post("/analyses", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const creatorId = req.user.userId;
    const userPlan = req.user.plan || "FREE";

    // Only Enterprise users can create ATLAS market analysis
    if (userPlan !== "ENTERPRISE") {
      return res
        .status(403)
        .json({ error: "Enterprise plan required to create market analysis" });
    }

    const { asset, sentiment, confidence, analysis, indicators } = req.body;

    // Validate required fields
    if (!asset || !sentiment || !confidence || !analysis) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["bullish", "bearish", "neutral"].includes(sentiment)) {
      return res
        .status(400)
        .json({ error: "Sentiment must be bullish, bearish, or neutral" });
    }

    if (confidence < 1 || confidence > 100) {
      return res
        .status(400)
        .json({ error: "Confidence must be between 1 and 100" });
    }

    const marketAnalysis = await prisma.marketAnalysis.create({
      data: {
        tenantId,
        creatorId,
        asset: asset.toUpperCase(),
        sentiment,
        confidence: parseInt(confidence),
        analysis,
        indicators: indicators || {},
        tier: "enterprise",
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json(marketAnalysis);
  } catch (error) {
    console.error("Error creating market analysis:", error);
    res.status(500).json({ error: "Failed to create market analysis" });
  }
});

export default router;
