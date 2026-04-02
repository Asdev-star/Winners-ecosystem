// Phase 8 - Winners Cloud - Revenue Sharing Service

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const REVENUE_CONFIG = {
  developerShare: 0.7,
  platformShare: 0.3,
  minimumPayout: 50,
  payoutSchedule: "monthly",
  currency: "USD",
} as const;

interface RevenueCalculation {
  totalAmount: number;
  developerAmount: number;
  platformAmount: number;
  currency: string;
}

interface RecordTransactionData {
  pluginId: string;
  tenantId: string;
  developerId: string;
  buyerId: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  paymentId: string;
  metadata?: Record<string, unknown>;
}

interface ProcessPayoutData {
  developerId: string;
  amount: number;
  payoutMethod: string;
  payoutDetails: Record<string, unknown>;
}

export function calculateRevenueSplit(amount: number): RevenueCalculation {
  const developerAmount = Math.round(amount * REVENUE_CONFIG.developerShare * 100) / 100;
  const platformAmount = Math.round(amount * REVENUE_CONFIG.platformShare * 100) / 100;

  return {
    totalAmount: amount,
    developerAmount,
    platformAmount,
    currency: REVENUE_CONFIG.currency,
  };
}

export async function recordTransaction(data: RecordTransactionData) {
  const split = calculateRevenueSplit(data.amount);

  const transaction = await prisma.pluginTransaction.create({
    data: {
      pluginId: data.pluginId,
      tenantId: data.tenantId,
      developerId: data.developerId,
      buyerId: data.buyerId,
      amount: split.totalAmount,
      developerAmount: split.developerAmount,
      platformAmount: split.platformAmount,
      currency: data.currency ?? REVENUE_CONFIG.currency,
      paymentMethod: data.paymentMethod,
      paymentId: data.paymentId,
      status: "completed",
      metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
    },
    include: {
      plugin: true,
    },
  });

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

export async function getDeveloperEarnings(developerId: string) {
  const earnings = await prisma.developerEarnings.findUnique({ where: { developerId } });

  return {
    pendingBalance: earnings?.pendingBalance ?? 0,
    totalEarned: earnings?.totalEarned ?? 0,
    totalPaidOut: earnings?.totalPaidOut ?? 0,
    availableForPayout: earnings?.pendingBalance ?? 0,
    minimumPayout: REVENUE_CONFIG.minimumPayout,
  };
}

export async function getDeveloperTransactions(
  developerId: string,
  options: { page?: number; limit?: number; status?: string; startDate?: Date; endDate?: Date } = {},
) {
  const { page = 1, limit = 20, status, startDate, endDate } = options;
  const where: {
    developerId: string;
    status?: string;
    createdAt?: { gte?: Date; lte?: Date };
  } = { developerId };

  if (status) where.status = status;
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
          select: { id: true, name: true, slug: true, category: true },
        },
        buyer: {
          select: { id: true, name: true, email: true },
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

export async function processPayout(data: ProcessPayoutData) {
  const earnings = await prisma.developerEarnings.findUnique({
    where: { developerId: data.developerId },
  });

  if (!earnings || earnings.pendingBalance < data.amount) {
    throw new Error("Insufficient balance for payout");
  }

  if (data.amount < REVENUE_CONFIG.minimumPayout) {
    throw new Error(`Minimum payout amount is $${REVENUE_CONFIG.minimumPayout}`);
  }

  const [payout] = await prisma.$transaction([
    prisma.developerPayout.create({
      data: {
        developerId: data.developerId,
        amount: data.amount,
        currency: REVENUE_CONFIG.currency,
        payoutMethod: data.payoutMethod,
        payoutDetails: data.payoutDetails as Prisma.InputJsonValue,
        status: "PENDING",
      },
    }),
    prisma.developerEarnings.update({
      where: { developerId: data.developerId },
      data: {
        pendingBalance: { decrement: data.amount },
        totalPaidOut: { increment: data.amount },
      },
    }),
  ]);

  return payout;
}

export async function getPayouts(developerId: string) {
  return prisma.developerPayout.findMany({
    where: { developerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlatformRevenueStats() {
  const [transactions, payouts, activePlugins, totalTransactions] = await Promise.all([
    prisma.pluginTransaction.aggregate({
      where: { status: "completed" },
      _sum: { platformAmount: true },
    }),
    prisma.developerPayout.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.plugin.count({ where: { status: "PUBLISHED" } }),
    prisma.pluginTransaction.count({ where: { status: "completed" } }),
  ]);

  return {
    totalPlatformRevenue: transactions._sum.platformAmount ?? 0,
    totalDeveloperPayouts: payouts._sum.amount ?? 0,
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

  return {
    pluginId,
    transactionCount: transactions.length,
    totalRevenue: transactions.reduce((sum, item) => sum + item.amount, 0),
    developerRevenue: transactions.reduce((sum, item) => sum + item.developerAmount, 0),
    platformRevenue: transactions.reduce((sum, item) => sum + item.platformAmount, 0),
  };
}

export async function getTopPerformingPlugins(limit = 10) {
  const transactions = await prisma.pluginTransaction.findMany({
    where: { status: "completed" },
    include: {
      plugin: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const grouped = new Map<
    string,
    {
      plugin: { id: string; name: string; category: string };
      transactionCount: number;
      totalRevenue: number;
      developerRevenue: number;
      platformRevenue: number;
    }
  >();

  for (const transaction of transactions) {
    const current = grouped.get(transaction.pluginId) ?? {
      plugin: transaction.plugin,
      transactionCount: 0,
      totalRevenue: 0,
      developerRevenue: 0,
      platformRevenue: 0,
    };
    current.transactionCount += 1;
    current.totalRevenue += transaction.amount;
    current.developerRevenue += transaction.developerAmount;
    current.platformRevenue += transaction.platformAmount;
    grouped.set(transaction.pluginId, current);
  }

  return {
    plugins: [...grouped.values()]
      .sort((left, right) => right.totalRevenue - left.totalRevenue)
      .slice(0, limit),
    limit,
  };
}
