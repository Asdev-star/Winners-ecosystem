import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Polygon.io API for real-time price data
const POLYGON_API_KEY = process.env.POLYGON_API_KEY || "";
const POLYGON_BASE_URL = "https://api.polygon.io";

export interface VirtualPosition {
  id: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
}

export interface VirtualPortfolio {
  id: string;
  cashBalance: number;
  totalValue: number;
  positions: VirtualPosition[];
}

/**
 * Initialize virtual portfolio for new user
 */
export const initializeVirtualPortfolio = async (
  userId: string,
  tenantId: string,
): Promise<VirtualPortfolio> => {
  const portfolio = await prisma.virtualPortfolio.create({
    data: {
      userId,
      tenantId,
      cashBalance: 10000, // $10K virtual
      totalValue: 10000,
    },
    include: {
      positions: true,
    },
  });

  return {
    id: portfolio.id,
    cashBalance: portfolio.cashBalance,
    totalValue: portfolio.totalValue,
    positions: portfolio.positions.map((pos) => ({
      id: pos.id,
      symbol: pos.symbol,
      quantity: pos.quantity,
      avgCost: pos.avgCost,
      currentPrice: pos.currentPrice,
      marketValue: pos.marketValue,
      unrealizedPnL: pos.unrealizedPnL,
    })),
  };
};

/**
 * Get virtual portfolio for user
 */
export const getVirtualPortfolio = async (
  userId: string,
): Promise<VirtualPortfolio | null> => {
  const portfolio = await prisma.virtualPortfolio.findUnique({
    where: { userId },
    include: {
      positions: true,
    },
  });

  if (!portfolio) return null;

  return {
    id: portfolio.id,
    cashBalance: portfolio.cashBalance,
    totalValue: portfolio.totalValue,
    positions: portfolio.positions.map((pos) => ({
      id: pos.id,
      symbol: pos.symbol,
      quantity: pos.quantity,
      avgCost: pos.avgCost,
      currentPrice: pos.currentPrice,
      marketValue: pos.marketValue,
      unrealizedPnL: pos.unrealizedPnL,
    })),
  };
};

/**
 * Get real-time price for a symbol using Polygon.io
 */
export const getRealTimePrice = async (symbol: string): Promise<number> => {
  try {
    const response = await fetch(
      `${POLYGON_BASE_URL}/v2/aggs/ticker/${symbol}/prev?apiKey=${POLYGON_API_KEY}`,
    );

    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error(`No price data available for ${symbol}`);
    }

    return data.results[0].c; // Close price
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    throw new Error(`Unable to fetch price for ${symbol}`);
  }
};

/**
 * Execute virtual buy order
 */
export const virtualBuy = async (
  userId: string,
  symbol: string,
  quantity: number,
  price?: number,
): Promise<VirtualPosition> => {
  const currentPrice = price || (await getRealTimePrice(symbol));
  const totalCost = quantity * currentPrice;

  const portfolio = await prisma.virtualPortfolio.findUnique({
    where: { userId },
    include: { positions: true },
  });

  if (!portfolio) {
    throw new Error("Virtual portfolio not found");
  }

  if (portfolio.cashBalance < totalCost) {
    throw new Error("Insufficient virtual funds");
  }

  // Check if position already exists
  const existingPosition = portfolio.positions.find(
    (pos) => pos.symbol === symbol,
  );

  let position: any;

  if (existingPosition) {
    // Update existing position
    const newQuantity = existingPosition.quantity + quantity;
    const newAvgCost =
      (existingPosition.avgCost * existingPosition.quantity +
        currentPrice * quantity) /
      newQuantity;

    position = await prisma.virtualPosition.update({
      where: { id: existingPosition.id },
      data: {
        quantity: newQuantity,
        avgCost: newAvgCost,
        currentPrice,
        marketValue: newQuantity * currentPrice,
        unrealizedPnL: (currentPrice - newAvgCost) * newQuantity,
      },
    });
  } else {
    // Create new position
    position = await prisma.virtualPosition.create({
      data: {
        portfolioId: portfolio.id,
        symbol,
        quantity,
        avgCost: currentPrice,
        currentPrice,
        marketValue: totalCost,
        unrealizedPnL: 0,
      },
    });
  }

  // Update portfolio cash balance and total value
  const newCashBalance = portfolio.cashBalance - totalCost;
  const totalPositionsValue =
    portfolio.positions
      .filter((pos) => pos.symbol !== symbol)
      .reduce((sum, pos) => sum + pos.marketValue, 0) + position.marketValue;

  await prisma.virtualPortfolio.update({
    where: { id: portfolio.id },
    data: {
      cashBalance: newCashBalance,
      totalValue: newCashBalance + totalPositionsValue,
    },
  });

  return {
    id: position.id,
    symbol: position.symbol,
    quantity: position.quantity,
    avgCost: position.avgCost,
    currentPrice: position.currentPrice,
    marketValue: position.marketValue,
    unrealizedPnL: position.unrealizedPnL,
  };
};

/**
 * Execute virtual sell order
 */
export const virtualSell = async (
  userId: string,
  symbol: string,
  quantity: number,
  price?: number,
): Promise<VirtualPosition> => {
  const currentPrice = price || (await getRealTimePrice(symbol));
  const totalValue = quantity * currentPrice;

  const portfolio = await prisma.virtualPortfolio.findUnique({
    where: { userId },
    include: { positions: true },
  });

  if (!portfolio) {
    throw new Error("Virtual portfolio not found");
  }

  const position = portfolio.positions.find((pos) => pos.symbol === symbol);

  if (!position) {
    throw new Error(`No position found for ${symbol}`);
  }

  if (position.quantity < quantity) {
    throw new Error("Insufficient shares to sell");
  }

  const newQuantity = position.quantity - quantity;
  let updatedPosition: any;

  if (newQuantity === 0) {
    // Close position
    await prisma.virtualPosition.delete({
      where: { id: position.id },
    });

    updatedPosition = {
      ...position,
      quantity: 0,
      marketValue: 0,
      unrealizedPnL: (currentPrice - position.avgCost) * position.quantity,
    };
  } else {
    // Update position
    updatedPosition = await prisma.virtualPosition.update({
      where: { id: position.id },
      data: {
        quantity: newQuantity,
        currentPrice,
        marketValue: newQuantity * currentPrice,
        unrealizedPnL: (currentPrice - position.avgCost) * newQuantity,
      },
    });
  }

  // Update portfolio cash balance and total value
  const newCashBalance = portfolio.cashBalance + totalValue;
  const totalPositionsValue =
    portfolio.positions
      .filter((pos) => pos.symbol !== symbol)
      .reduce((sum, pos) => sum + pos.marketValue, 0) +
    newQuantity * currentPrice;

  await prisma.virtualPortfolio.update({
    where: { id: portfolio.id },
    data: {
      cashBalance: newCashBalance,
      totalValue: newCashBalance + totalPositionsValue,
    },
  });

  return {
    id: updatedPosition.id,
    symbol: updatedPosition.symbol,
    quantity: updatedPosition.quantity,
    avgCost: updatedPosition.avgCost,
    currentPrice: updatedPosition.currentPrice,
    marketValue: updatedPosition.marketValue,
    unrealizedPnL: updatedPosition.unrealizedPnL,
  };
};

/**
 * Update all portfolio positions with current prices
 */
export const updatePortfolioPrices = async (
  userId: string,
): Promise<VirtualPortfolio> => {
  const portfolio = await prisma.virtualPortfolio.findUnique({
    where: { userId },
    include: { positions: true },
  });

  if (!portfolio) {
    throw new Error("Virtual portfolio not found");
  }

  let totalPositionsValue = 0;

  // Update each position with current price
  for (const position of portfolio.positions) {
    try {
      const currentPrice = await getRealTimePrice(position.symbol);

      const marketValue = position.quantity * currentPrice;
      const unrealizedPnL =
        (currentPrice - position.avgCost) * position.quantity;

      await prisma.virtualPosition.update({
        where: { id: position.id },
        data: {
          currentPrice,
          marketValue,
          unrealizedPnL,
        },
      });

      totalPositionsValue += marketValue;
    } catch (error) {
      console.error(`Error updating price for ${position.symbol}:`, error);
      // Keep existing values if price fetch fails
      totalPositionsValue += position.marketValue;
    }
  }

  // Update portfolio total value
  const newTotalValue = portfolio.cashBalance + totalPositionsValue;

  await prisma.virtualPortfolio.update({
    where: { id: portfolio.id },
    data: { totalValue: newTotalValue },
  });

  return (await getVirtualPortfolio(userId)) as VirtualPortfolio;
};

/**
 * Get trading signals based on user plan
 */
export const getTradingSignals = async (tenantId: string, userPlan: string) => {
  const now = new Date();

  // Base query
  let whereClause: any = {
    tenantId,
    expiresAt: { gt: now },
  };

  // Filter by plan access
  if (userPlan === "FREE") {
    whereClause.tier = "free";
  }
  // Pro and Enterprise can see all signals

  const signals = await prisma.tradingSignal.findMany({
    where: whereClause,
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return signals;
};

/**
 * Create a trading signal (for creators)
 */
export const createTradingSignal = async (
  tenantId: string,
  creatorId: string,
  signalData: {
    asset: string;
    direction: "buy" | "sell";
    entryPrice: number;
    targetPrice: number;
    stopLoss: number;
    confidence: number;
    tier?: string;
    expiresAt: Date;
  },
) => {
  const signal = await prisma.tradingSignal.create({
    data: {
      tenantId,
      creatorId,
      asset: signalData.asset,
      direction: signalData.direction,
      entryPrice: signalData.entryPrice,
      targetPrice: signalData.targetPrice,
      stopLoss: signalData.stopLoss,
      confidence: signalData.confidence,
      tier: signalData.tier || "free",
      expiresAt: signalData.expiresAt,
      result: "pending",
    },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
  });

  return signal;
};

/**
 * Update signal result when it hits target/stop loss
 */
export const updateSignalResult = async (
  signalId: string,
  result: "win" | "loss",
) => {
  await prisma.tradingSignal.update({
    where: { id: signalId },
    data: { result },
  });
};
