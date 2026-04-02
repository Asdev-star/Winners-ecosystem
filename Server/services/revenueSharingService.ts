// Phase 8 — Winners Cloud — Revenue Sharing Service
// Handles plugin revenue distribution, developer payouts, and platform fees

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Revenue split configuration
const REVENUE_CONFIG = {
  developerShare: 0.7, // 70% to developer
  platformShare: 0.3, // 30% to platform
  minimumPayout: 50, // Minimum $50 for payout
  payoutSchedule: "monthly", // monthly, weekly, or on-demand
  currency: "USD",
};

// ─── Revenue Calculation ───────────────────────────────────────────────────────

interface RevenueCalculation {
  totalAmount: number;
  developerAmount: number;
  platformAmount: number;
  currency: string;
}

export function calculateRevenueSplit(amount: number): RevenueCalculation {
  const developerAmount =
    Math.round(amount * REVENUE_CONFIG.developerShare * 100) / 100;
  const platformAmount =
    Math.round(amount * REVENUE_CONFIG.platformShare * 100) / 100;

  return {
    totalAmount: amount,
    developerAmount,
    platformAmount,
    currency: REVENUE_CONFIG.currency,
  };
}

// ─── Transaction Recording ─────────────────────────────────────────────────────

interface RecordTransactionData {
  pluginId: string;
  developerId: string;
  buyerId: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  paymentId: string;
  metadata?: Record<string, unknown>;
}

export async function recordTransaction(data: RecordTransactionData) {
  const split = calculateRevenueSplit(data.amount);

  const transaction = await prisma.pluginTransaction.create({
    data: {
      pluginId: data.pluginId,
      developerId: data.developerId,
      buyerId: data.buyerId,
      amount: split.totalAmount,
      developerAmount: split.developerAmount,
      platformAmount: split.platformAmount,
      currency: data.currency || REVENUE_CONFIG.currency,
      paymentMethod: data.paymentMethod,
      paymentId: data.paymentId,
      status: "completed",
      metadata: data.metadata || {},
    },
    include: {
      plugin: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      developer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Update developer's pending balance
  await prisma.developerEarnings.upsert({
    where: { developerId: data.developerId },
    create: {
      developerId: data.developerId,
      pendingBalance: split.developerAmount,
      totalEarned: split.developerAmount,
      totalPaidOut: 0,
    },
    update: {
      pendingBalance: { increment: split.developerAmount },
      totalEarned: { increment: split.developerAmount },
    },
  });

  return transaction;
}

// ─── Developer Earnings ────────────────────────────────────────────────────────

export async function getDeveloperEarnings(developerId: string) {
  const earnings = await prisma.developerEarnings.findUnique({
    where: { developerId },
  });

  if (!earnings) {
    return {
      pendingBalance: 0,
      totalEarned: 0,
      totalPaidOut: 0,
      availableForPayout: 0,
    };
  }

  const availableForPayout = Math.max(
    0,
    earnings.pendingBalance - REVENUE_CONFIG.minimumPayout,
  );

  return {
    ...earnings,
    availableForPayout,
    minimumPayout: REVENUE_CONFIG.minimumPayout,
  };
}

export async function getDeveloperTransactions(
  developerId: string,
  options: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  } = {},
) {
  const { page = 1, limit = 20, status, startDate, endDate } = options;

  const where: Record<string, unknown> = { developerId };

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [transactions, total] = await Promise.all([
    prisma.pluginTransaction.findMany({
      where,
      include: {
        plugin: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.pluginTransaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

// ─── Payout Processing ─────────────────────────────────────────────────────────

interface ProcessPayoutData {
  developerId: string;
  amount: number;
  payoutMethod: string;
  payoutDetails: Record<string, unknown>;
}

export async function processPayout(data: ProcessPayoutData) {
  const earnings = await prisma.developerEarnings.findUnique({
    where: { developerId: data.developerId },
  });

  if (!earnings) {
    throw new Error("Developer earnings record not found");
  }

  if (data.amount > earnings.pendingBalance) {
    throw new Error("Insufficient balance for payout");
  }

  if (data.amount < REVENUE_CONFIG.minimumPayout) {
    throw new Error(
      `Minimum payout amount is $${REVENUE_CONFIG.minimumPayout}`,
    );
  }

  // Create payout record
  const payout = await prisma.developerPayout.create({
    data: {
      developerId: data.developerId,
      amount: data.amount,
      currency: REVENUE_CONFIG.currency,
      payoutMethod: data.payoutMethod,
      payoutDetails: data.payoutDetails,
      status: "processing",
    },
  });

  // Update developer earnings
  await prisma.developerEarnings.update({
    where: { developerId: data.developerId },
    data: {
      pendingBalance: { decrement: data.amount },
      totalPaidOut: { increment: data.amount },
    },
  });

  // Mark related transactions as paid out
  const transactions = await prisma.pluginTransaction.findMany({
    where: {
      developerId: data.developerId,
      status: "completed",
    },
    orderBy: { createdAt: "asc" },
  });

  let remainingAmount = data.amount;
  const transactionIds: string[] = [];

  for (const transaction of transactions) {
    if (remainingAmount <= 0) break;

    if (transaction.developerAmount <= remainingAmount) {
      transactionIds.push(transaction.id);
      remainingAmount -= transaction.developerAmount;
    }
  }

  if (transactionIds.length > 0) {
    await prisma.pluginTransaction.updateMany({
      where: { id: { in: transactionIds } },
      data: { status: "paid_out" },
    });
  }

  return payout;
}

export async function getPayouts(developerId: string) {
  const payouts = await prisma.developerPayout.findMany({
    where: { developerId },
    orderBy: { createdAt: "desc" },
  });

  return payouts;
}

// ─── Platform Revenue Analytics ────────────────────────────────────────────────

export async function getPlatformRevenueStats() {
  const [totalRevenue, totalPayouts, activePlugins, totalTransactions] =
    await Promise.all([
      prisma.pluginTransaction.aggregate({
        _sum: { platformAmount: true },
        where: { status: "completed" },
      }),
      prisma.developerPayout.aggregate({
        _sum: { amount: true },
        where: { status: "completed" },
      }),
      prisma.plugin.count({
        where: { status: "approved" },
      }),
      prisma.pluginTransaction.count({
        where: { status: "completed" },
      }),
    ]);

  return {
    totalPlatformRevenue: totalRevenue._sum.platformAmount || 0,
    totalDeveloperPayouts: totalPayouts._sum.amount || 0,
    activePlugins,
    totalTransactions,
    revenueSplit: REVENUE_CONFIG,
  };
}

export async function getRevenueByPlugin(pluginId: string) {
  const transactions = await prisma.pluginTransaction.findMany({
    where: { pluginId, status: "completed" },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const developerRevenue = transactions.reduce(
    (sum, t) => sum + t.developerAmount,
    0,
  );
  const platformRevenue = transactions.reduce(
    (sum, t) => sum + t.platformAmount,
    0,
  );

  return {
    transactions,
    totalRevenue,
    developerRevenue,
    platformRevenue,
    transactionCount: transactions.length,
  };
}

// ─── Revenue Reports ───────────────────────────────────────────────────────────

export async function generateRevenueReport(startDate: Date, endDate: Date) {
  const transactions = await prisma.pluginTransaction.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: "completed",
    },
    include: {
      plugin: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
      developer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const developerRevenue = transactions.reduce(
    (sum, t) => sum + t.developerAmount,
    0,
  );
  const platformRevenue = transactions.reduce(
    (sum, t) => sum + t.platformAmount,
    0,
  );

  // Group by plugin
  const byPlugin = transactions.reduce(
    (acc, t) => {
      const key = t.pluginId;
      if (!acc[key]) {
        acc[key] = {
          plugin: t.plugin,
          totalRevenue: 0,
          transactionCount: 0,
        };
      }
      acc[key].totalRevenue += t.amount;
      acc[key].transactionCount += 1;
      return acc;
    },
    {} as Record<
      string,
      {
        plugin: { id: string; name: string; category: string };
        totalRevenue: number;
        transactionCount: number;
      }
    >,
  );

  // Group by developer
  const byDeveloper = transactions.reduce(
    (acc, t) => {
      const key = t.developerId;
      if (!acc[key]) {
        acc[key] = {
          developer: t.developer,
          totalRevenue: 0,
          transactionCount: 0,
        };
      }
      acc[key].totalRevenue += t.amount;
      acc[key].transactionCount += 1;
      return acc;
    },
    {} as Record<
      string,
      {
        developer: { id: string; name: string };
        totalRevenue: number;
        transactionCount: number;
      }
    >,
  );

  return {
    period: { startDate, endDate },
    summary: {
      totalRevenue,
      developerRevenue,
      platformRevenue,
      transactionCount: transactions.length,
    },
    byPlugin: Object.values(byPlugin).sort(
      (a, b) => b.totalRevenue - a.totalRevenue,
    ),
    byDeveloper: Object.values(byDeveloper).sort(
      (a, b) => b.totalRevenue - a.totalRevenue,
    ),
    transactions,
  };
}
