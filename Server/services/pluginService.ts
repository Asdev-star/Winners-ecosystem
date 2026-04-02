// Phase 8 - Winners Cloud - Plugin Marketplace Service

import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

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
  currency?: string;
  revenueShare?: number;
}

interface PluginReviewData {
  pluginId: string;
  reviewerId: string;
  approved: boolean;
  reviewNotes?: string;
}

interface PluginInstallData {
  pluginId: string;
  userId: string;
  tenantId: string;
}

interface PluginUserReviewData {
  pluginId: string;
  userId: string;
  tenantId: string;
  rating: number;
  title?: string;
  content?: string;
}

function pluginSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function recalculatePluginRating(pluginId: string) {
  const aggregate = await prisma.pluginReview.aggregate({
    where: { pluginId },
    _avg: { rating: true },
  });

  await prisma.plugin.update({
    where: { id: pluginId },
    data: { averageRating: aggregate._avg.rating ?? 0 },
  });
}

export async function submitPlugin(data: PluginSubmissionData) {
  return prisma.plugin.create({
    data: {
      tenantId: data.tenantId,
      developerId: data.developerId,
      name: data.name.trim(),
      slug: pluginSlug(data.name),
      description: data.description.trim(),
      version: data.version.trim(),
      category: data.category.trim(),
      pricing: data.pricing,
      price: data.price ?? 0,
      currency: data.currency ?? "USD",
      revenueShare: data.revenueShare ?? 70,
      manifestUrl: data.manifestUrl.trim(),
      documentationUrl: data.documentationUrl?.trim(),
      repositoryUrl: data.repositoryUrl?.trim(),
      screenshots: data.screenshots ?? [],
      tags: data.tags ?? [],
      status: "PENDING_REVIEW",
    },
  });
}

export async function reviewPlugin(data: PluginReviewData) {
  return prisma.plugin.update({
    where: { id: data.pluginId },
    data: {
      status: data.approved ? "PUBLISHED" : "REJECTED",
      reviewedBy: data.reviewerId,
      reviewedAt: new Date(),
      publishedAt: data.approved ? new Date() : null,
      reviewNotes: data.reviewNotes?.trim() || null,
    },
  });
}

export async function installPlugin(data: PluginInstallData) {
  const plugin = await prisma.plugin.findUnique({ where: { id: data.pluginId } });
  if (!plugin || plugin.status !== "PUBLISHED") {
    throw new Error("Plugin not found or not published");
  }

  const existing = await prisma.pluginInstall.findUnique({
    where: { pluginId_tenantId: { pluginId: data.pluginId, tenantId: data.tenantId } },
  });

  if (existing) {
    return prisma.pluginInstall.update({
      where: { pluginId_tenantId: { pluginId: data.pluginId, tenantId: data.tenantId } },
      data: {
        active: true,
        version: plugin.version,
        lastUsedAt: new Date(),
      },
    });
  }

  const install = await prisma.pluginInstall.create({
    data: {
      pluginId: data.pluginId,
      userId: data.userId,
      tenantId: data.tenantId,
      version: plugin.version,
    },
  });

  await prisma.plugin.update({
    where: { id: data.pluginId },
    data: { installCount: { increment: 1 } },
  });

  return install;
}

export async function uninstallPlugin(pluginId: string, userId: string, tenantId: string) {
  const install = await prisma.pluginInstall.findFirst({
    where: { pluginId, userId, tenantId, active: true },
  });

  if (!install) {
    throw new Error("Plugin install not found");
  }

  return prisma.pluginInstall.update({
    where: { id: install.id },
    data: { active: false },
  });
}

export async function createOrUpdateReview(data: PluginUserReviewData) {
  const existing = await prisma.pluginReview.findUnique({
    where: { pluginId_userId: { pluginId: data.pluginId, userId: data.userId } },
  });

  const review = existing
    ? await prisma.pluginReview.update({
        where: { pluginId_userId: { pluginId: data.pluginId, userId: data.userId } },
        data: {
          rating: data.rating,
          title: data.title?.trim() || null,
          content: data.content?.trim() || null,
        },
      })
    : await prisma.pluginReview.create({
        data: {
          pluginId: data.pluginId,
          userId: data.userId,
          tenantId: data.tenantId,
          rating: data.rating,
          title: data.title?.trim() || null,
          content: data.content?.trim() || null,
        },
      });

  await recalculatePluginRating(data.pluginId);
  return review;
}

export async function getDeveloperRevenue(developerId: string) {
  const [records, totals] = await Promise.all([
    prisma.pluginRevenue.findMany({
      where: { developerId },
      include: { plugin: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pluginRevenue.aggregate({
      where: { developerId },
      _sum: {
        amount: true,
        developerAmount: true,
        platformAmount: true,
      },
    }),
  ]);

  return {
    records,
    totals: {
      totalRevenue: totals._sum.amount ?? 0,
      developerShare: totals._sum.developerAmount ?? 0,
      platformShare: totals._sum.platformAmount ?? 0,
    },
  };
}

export async function getPlugins(options: {
  category?: string;
  search?: string;
  pricing?: "free" | "paid" | "freemium";
  sortBy?: "popular" | "newest" | "rating" | "price";
  page?: number;
  limit?: number;
}) {
  const { category, search, pricing, sortBy = "popular", page = 1, limit = 20 } = options;

  const where: Prisma.PluginWhereInput = { status: "PUBLISHED" };
  if (category) where.category = category;
  if (pricing) where.pricing = pricing;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { has: search.toLowerCase() } },
    ];
  }

  let orderBy: Prisma.PluginOrderByWithRelationInput = { installCount: "desc" };
  if (sortBy === "newest") orderBy = { publishedAt: "desc" };
  if (sortBy === "rating") orderBy = { averageRating: "desc" };
  if (sortBy === "price") orderBy = { price: "asc" };

  const [plugins, total] = await Promise.all([
    prisma.plugin.findMany({
      where,
      include: {
        developer: {
          select: { id: true, name: true, email: true },
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

export async function getPluginById(pluginId: string) {
  return prisma.plugin.findUnique({
    where: { id: pluginId },
    include: {
      developer: {
        select: { id: true, name: true, email: true },
      },
      reviews: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getInstalledPlugins(userId: string, tenantId: string) {
  return prisma.pluginInstall.findMany({
    where: { userId, tenantId, active: true },
    include: {
      plugin: {
        include: {
          developer: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
    orderBy: { installedAt: "desc" },
  });
}

export async function getPendingPlugins() {
  return prisma.plugin.findMany({
    where: { status: "PENDING_REVIEW" },
    include: {
      developer: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getMarketplaceStats() {
  const [totalPlugins, approvedPlugins, pendingPlugins, totalInstalls, totalRevenue] = await Promise.all([
    prisma.plugin.count(),
    prisma.plugin.count({ where: { status: "PUBLISHED" } }),
    prisma.plugin.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.pluginInstall.count({ where: { active: true } }),
    prisma.pluginRevenue.aggregate({ _sum: { amount: true } }),
  ]);

  return {
    totalPlugins,
    approvedPlugins,
    pendingPlugins,
    totalInstalls,
    totalRevenue: totalRevenue._sum.amount ?? 0,
  };
}
