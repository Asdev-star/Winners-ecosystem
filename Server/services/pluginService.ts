// Phase 8 — Winners Cloud — Plugin Marketplace Service
// Plugin submission, review, approval, and revenue sharing logic

import { PrismaClient, PluginStatus, Prisma } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

// ─── Plugin Submission ─────────────────────────────────────────────────────────

interface PluginSubmissionData {
  name: string;
  description: string;
  version: string;
  category: string;
  pricing: "free" | "paid" | "freemium";
  price?: number;
  developerId: string;
  tenantId: string;
  manifestUrl: string;
  documentationUrl?: string;
  repositoryUrl?: string;
  screenshots?: string[];
  tags?: string[];
}

export async function submitPlugin(data: PluginSubmissionData) {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check for duplicate slug
  const existing = await prisma.plugin.findUnique({ where: { slug } });
  if (existing) {
    throw new Error(`Plugin with slug "${slug}" already exists`);
  }

  const plugin = await prisma.plugin.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      version: data.version,
      category: data.category,
      pricing: data.pricing,
      price: data.price || 0,
      developerId: data.developerId,
      tenantId: data.tenantId,
      manifestUrl: data.manifestUrl,
      documentationUrl: data.documentationUrl,
      repositoryUrl: data.repositoryUrl,
      screenshots: data.screenshots || [],
      tags: data.tags || [],
      status: PluginStatus.PENDING_REVIEW,
      reviewNotes: null,
      publishedAt: null,
    },
    include: {
      developer: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return plugin;
}

// ─── Plugin Review (Admin) ─────────────────────────────────────────────────────

interface PluginReviewData {
  pluginId: string;
  reviewerId: string;
  approved: boolean;
  reviewNotes?: string;
}

export async function reviewPlugin(data: PluginReviewData) {
  const plugin = await prisma.plugin.findUnique({
    where: { id: data.pluginId },
  });

  if (!plugin) {
    throw new Error("Plugin not found");
  }

  if (plugin.status !== PluginStatus.PENDING_REVIEW) {
    throw new Error("Plugin is not pending review");
  }

  const updatedPlugin = await prisma.plugin.update({
    where: { id: data.pluginId },
    data: {
      status: data.approved ? PluginStatus.APPROVED : PluginStatus.REJECTED,
      reviewNotes: data.reviewNotes,
      reviewedAt: new Date(),
      reviewedBy: data.reviewerId,
      publishedAt: data.approved ? new Date() : null,
    },
    include: {
      developer: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedPlugin;
}

// ─── Plugin Installation ───────────────────────────────────────────────────────

interface PluginInstallData {
  pluginId: string;
  userId: string;
  tenantId: string;
}

export async function installPlugin(data: PluginInstallData) {
  const plugin = await prisma.plugin.findUnique({
    where: { id: data.pluginId },
  });

  if (!plugin) {
    throw new Error("Plugin not found");
  }

  if (plugin.status !== PluginStatus.APPROVED) {
    throw new Error("Plugin is not approved for installation");
  }

  // Check if already installed
  const existingInstall = await prisma.pluginInstall.findUnique({
    where: {
      pluginId_userId_tenantId: {
        pluginId: data.pluginId,
        userId: data.userId,
        tenantId: data.tenantId,
      },
    },
  });

  if (existingInstall) {
    throw new Error("Plugin already installed");
  }

  // If paid plugin, check payment
  if (plugin.pricing === "paid" && plugin.price && plugin.price > 0) {
    // Payment verification would go here
    // For now, we'll assume payment is handled externally
  }

  const install = await prisma.pluginInstall.create({
    data: {
      pluginId: data.pluginId,
      userId: data.userId,
      tenantId: data.tenantId,
      installedAt: new Date(),
    },
    include: {
      plugin: true,
    },
  });

  // Increment install count
  await prisma.plugin.update({
    where: { id: data.pluginId },
    data: {
      installCount: { increment: 1 },
    },
  });

  return install;
}

export async function uninstallPlugin(
  pluginId: string,
  userId: string,
  tenantId: string,
) {
  const install = await prisma.pluginInstall.findUnique({
    where: {
      pluginId_userId_tenantId: {
        pluginId,
        userId,
        tenantId,
      },
    },
  });

  if (!install) {
    throw new Error("Plugin not installed");
  }

  await prisma.pluginInstall.delete({
    where: {
      pluginId_userId_tenantId: {
        pluginId,
        userId,
        tenantId,
      },
    },
  });

  // Decrement install count
  await prisma.plugin.update({
    where: { id: pluginId },
    data: {
      installCount: { decrement: 1 },
    },
  });

  return { success: true };
}

// ─── Plugin Reviews & Ratings ──────────────────────────────────────────────────

interface PluginReviewInput {
  pluginId: string;
  userId: string;
  tenantId: string;
  rating: number;
  comment?: string;
}

export async function submitPluginReview(data: PluginReviewInput) {
  if (data.rating < 1 || data.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Check if user has installed the plugin
  const install = await prisma.pluginInstall.findUnique({
    where: {
      pluginId_userId_tenantId: {
        pluginId: data.pluginId,
        userId: data.userId,
        tenantId: data.tenantId,
      },
    },
  });

  if (!install) {
    throw new Error("You must install a plugin before reviewing it");
  }

  // Check if already reviewed
  const existingReview = await prisma.pluginReview.findUnique({
    where: {
      pluginId_userId: {
        pluginId: data.pluginId,
        userId: data.userId,
      },
    },
  });

  if (existingReview) {
    // Update existing review
    const updatedReview = await prisma.pluginReview.update({
      where: { id: existingReview.id },
      data: {
        rating: data.rating,
        comment: data.comment,
        updatedAt: new Date(),
      },
    });

    // Recalculate average rating
    await recalculatePluginRating(data.pluginId);

    return updatedReview;
  }

  // Create new review
  const review = await prisma.pluginReview.create({
    data: {
      pluginId: data.pluginId,
      userId: data.userId,
      tenantId: data.tenantId,
      rating: data.rating,
      comment: data.comment,
    },
  });

  // Recalculate average rating
  await recalculatePluginRating(data.pluginId);

  return review;
}

async function recalculatePluginRating(pluginId: string) {
  const reviews = await prisma.pluginReview.findMany({
    where: { pluginId },
    select: { rating: true },
  });

  if (reviews.length === 0) {
    await prisma.plugin.update({
      where: { id: pluginId },
      data: {
        averageRating: 0,
        reviewCount: 0,
      },
    });
    return;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  await prisma.plugin.update({
    where: { id: pluginId },
    data: {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      reviewCount: reviews.length,
    },
  });
}

// ─── Revenue Sharing ───────────────────────────────────────────────────────────

interface RevenueShareData {
  pluginId: string;
  amount: number;
  currency?: string;
  transactionId: string;
  buyerId: string;
  buyerTenantId: string;
}

export async function processRevenueShare(data: RevenueShareData) {
  const plugin = await prisma.plugin.findUnique({
    where: { id: data.pluginId },
    select: {
      id: true,
      developerId: true,
      tenantId: true,
      pricing: true,
      price: true,
    },
  });

  if (!plugin) {
    throw new Error("Plugin not found");
  }

  if (plugin.pricing !== "paid" || !plugin.price || plugin.price <= 0) {
    throw new Error("Plugin is not a paid plugin");
  }

  // Revenue split: 70% developer, 30% platform
  const developerShare = Math.round(data.amount * 0.7 * 100) / 100;
  const platformShare = Math.round(data.amount * 0.3 * 100) / 100;

  // Create revenue record
  const revenueRecord = await prisma.pluginRevenue.create({
    data: {
      pluginId: data.pluginId,
      developerId: plugin.developerId,
      amount: data.amount,
      developerShare,
      platformShare,
      currency: data.currency || "USD",
      transactionId: data.transactionId,
      buyerId: data.buyerId,
      buyerTenantId: data.buyerTenantId,
      status: "pending",
    },
  });

  // Update developer earnings
  await prisma.user.update({
    where: { id: plugin.developerId },
    data: {
      pluginEarnings: { increment: developerShare },
    },
  });

  return revenueRecord;
}

export async function getDeveloperRevenue(developerId: string) {
  const revenueRecords = await prisma.pluginRevenue.findMany({
    where: { developerId },
    include: {
      plugin: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalEarnings = revenueRecords.reduce(
    (sum, record) => sum + record.developerShare,
    0,
  );

  const pendingEarnings = revenueRecords
    .filter((record) => record.status === "pending")
    .reduce((sum, record) => sum + record.developerShare, 0);

  const paidEarnings = revenueRecords
    .filter((record) => record.status === "paid")
    .reduce((sum, record) => sum + record.developerShare, 0);

  return {
    records: revenueRecords,
    totalEarnings,
    pendingEarnings,
    paidEarnings,
  };
}

export async function payoutDeveloper(developerId: string, amount: number) {
  // This would integrate with Stripe Connect or similar
  // For now, we'll just mark records as paid

  const pendingRecords = await prisma.pluginRevenue.findMany({
    where: {
      developerId,
      status: "pending",
    },
    orderBy: { createdAt: "asc" },
  });

  let remainingAmount = amount;
  const paidRecords: string[] = [];

  for (const record of pendingRecords) {
    if (remainingAmount <= 0) break;

    if (record.developerShare <= remainingAmount) {
      await prisma.pluginRevenue.update({
        where: { id: record.id },
        data: { status: "paid" },
      });
      paidRecords.push(record.id);
      remainingAmount -= record.developerShare;
    }
  }

  return {
    paidRecords,
    remainingAmount,
  };
}

// ─── Plugin Discovery ──────────────────────────────────────────────────────────

export async function getPlugins(options: {
  category?: string;
  search?: string;
  pricing?: "free" | "paid" | "freemium";
  sortBy?: "popular" | "newest" | "rating" | "price";
  page?: number;
  limit?: number;
}) {
  const {
    category,
    search,
    pricing,
    sortBy = "popular",
    page = 1,
    limit = 20,
  } = options;

  const where: Prisma.PluginWhereInput = {
    status: PluginStatus.APPROVED,
  };

  if (category) {
    where.category = category;
  }

  if (pricing) {
    where.pricing = pricing;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { hasSome: [search.toLowerCase()] } },
    ];
  }

  let orderBy: Prisma.PluginOrderByWithRelationInput = {};
  switch (sortBy) {
    case "popular":
      orderBy = { installCount: "desc" };
      break;
    case "newest":
      orderBy = { publishedAt: "desc" };
      break;
    case "rating":
      orderBy = { averageRating: "desc" };
      break;
    case "price":
      orderBy = { price: "asc" };
      break;
  }

  const [plugins, total] = await Promise.all([
    prisma.plugin.findMany({
      where,
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            installs: true,
            reviews: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.plugin.count({ where }),
  ]);

  return {
    plugins,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getPluginBySlug(slug: string) {
  const plugin = await prisma.plugin.findUnique({
    where: { slug },
    include: {
      developer: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          installs: true,
          reviews: true,
        },
      },
    },
  });

  return plugin;
}

export async function getInstalledPlugins(userId: string, tenantId: string) {
  const installs = await prisma.pluginInstall.findMany({
    where: {
      userId,
      tenantId,
    },
    include: {
      plugin: {
        include: {
          developer: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: { installedAt: "desc" },
  });

  return installs;
}

// ─── Admin Functions ───────────────────────────────────────────────────────────

export async function getPendingPlugins() {
  const plugins = await prisma.plugin.findMany({
    where: { status: PluginStatus.PENDING_REVIEW },
    include: {
      developer: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return plugins;
}

export async function getPluginStats() {
  const [
    totalPlugins,
    approvedPlugins,
    pendingPlugins,
    totalInstalls,
    totalRevenue,
  ] = await Promise.all([
    prisma.plugin.count(),
    prisma.plugin.count({ where: { status: PluginStatus.APPROVED } }),
    prisma.plugin.count({ where: { status: PluginStatus.PENDING_REVIEW } }),
    prisma.pluginInstall.count(),
    prisma.pluginRevenue.aggregate({
      _sum: { amount: true },
    }),
  ]);

  return {
    totalPlugins,
    approvedPlugins,
    pendingPlugins,
    totalInstalls,
    totalRevenue: totalRevenue._sum.amount || 0,
  };
}
