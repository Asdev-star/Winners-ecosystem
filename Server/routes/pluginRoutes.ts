// Phase 8 - Winners Cloud - Plugin Marketplace API

import { Router, type Request, type Response } from "express";
import type { Prisma } from "@prisma/client";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();

router.use(authMiddleware);
router.use(enforceTenant);

const pluginListInclude = {
  developer: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.PluginInclude;

const pluginDetailInclude = {
  developer: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  reviews: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.PluginInclude;

function pluginSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function recalculatePluginRating(pluginId: string) {
  const aggregate = await db.pluginReview.aggregate({
    where: { pluginId },
    _avg: { rating: true },
    _count: { id: true },
  });

  return db.plugin.update({
    where: { id: pluginId },
    data: {
      averageRating: aggregate._avg.rating ?? 0,
    },
  });
}

router.get("/installed", async (req: Request, res: Response) => {
  try {
    const installs = await db.pluginInstall.findMany({
      where: { tenantId: req.user!.tenantId, active: true },
      include: {
        plugin: {
          include: pluginListInclude,
        },
      },
      orderBy: { installedAt: "desc" },
    });

    res.json({ installs });
  } catch (err) {
    console.error("[pluginRoutes] Error fetching installed plugins:", err);
    res.status(500).json({ error: "Failed to fetch installed plugins" });
  }
});

router.get("/developer/dashboard", async (req: Request, res: Response) => {
  const developerId = req.user!.userId;

  try {
    const [plugins, revenue] = await Promise.all([
      db.plugin.findMany({
        where: { developerId },
        include: pluginListInclude,
        orderBy: { createdAt: "desc" },
      }),
      db.pluginRevenue.aggregate({
        where: { developerId },
        _sum: {
          amount: true,
          developerAmount: true,
          platformAmount: true,
        },
        _count: { id: true },
      }),
    ]);

    res.json({
      plugins,
      totals: {
        plugins: plugins.length,
        installs: plugins.reduce((sum, plugin) => sum + plugin.installCount, 0),
        revenue: revenue._sum.amount ?? 0,
        developerEarnings: revenue._sum.developerAmount ?? 0,
        platformShare: revenue._sum.platformAmount ?? 0,
        transactions: revenue._count.id ?? 0,
      },
    });
  } catch (err) {
    console.error("[pluginRoutes] Error fetching developer dashboard:", err);
    res.status(500).json({ error: "Failed to fetch developer dashboard" });
  }
});

router.get("/admin/pending", async (_req: Request, res: Response) => {
  try {
    const plugins = await db.plugin.findMany({
      where: { status: "PENDING_REVIEW" },
      include: pluginListInclude,
      orderBy: { createdAt: "asc" },
    });

    res.json({ plugins });
  } catch (err) {
    console.error("[pluginRoutes] Error fetching pending plugins:", err);
    res.status(500).json({ error: "Failed to fetch pending plugins" });
  }
});

router.post("/admin/:id/approve", async (req: Request, res: Response) => {
  if (!["owner", "admin"].includes(req.user!.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const plugin = await db.plugin.update({
      where: { id: String(req.params.id) },
      data: {
        status: "PUBLISHED",
        reviewedBy: req.user!.userId,
        reviewedAt: new Date(),
        publishedAt: new Date(),
      },
    });

    res.json({ plugin, success: true });
  } catch (err) {
    console.error("[pluginRoutes] Error approving plugin:", err);
    res.status(500).json({ error: "Failed to approve plugin" });
  }
});

router.post("/admin/:id/reject", async (req: Request, res: Response) => {
  if (!["owner", "admin"].includes(req.user!.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const plugin = await db.plugin.update({
      where: { id: String(req.params.id) },
      data: {
        status: "REJECTED",
        reviewedBy: req.user!.userId,
        reviewedAt: new Date(),
        reviewNotes:
          typeof req.body?.reviewNotes === "string" ? req.body.reviewNotes.trim() : null,
      },
    });

    res.json({ plugin, success: true });
  } catch (err) {
    console.error("[pluginRoutes] Error rejecting plugin:", err);
    res.status(500).json({ error: "Failed to reject plugin" });
  }
});

router.get("/developer/revenue", async (req: Request, res: Response) => {
  const developerId = req.user!.userId;

  try {
    const [plugins, earnings] = await Promise.all([
      db.plugin.findMany({
        where: { developerId },
        include: {
          revenues: true,
        },
      }),
      db.developerEarnings.findUnique({
        where: { developerId },
      }),
    ]);

    const breakdown = plugins.map((plugin) => {
      const totalRevenue = plugin.revenues.reduce((sum, item) => sum + item.amount, 0);
      const developerEarnings = plugin.revenues.reduce((sum, item) => sum + item.developerAmount, 0);

      return {
        pluginId: plugin.id,
        pluginName: plugin.name,
        installs: plugin.installCount,
        totalRevenue,
        developerEarnings,
        revenueSharePercent: plugin.revenueShare,
      };
    });

    res.json({
      summary: {
        totalPlugins: plugins.length,
        totalInstalls: plugins.reduce((sum, plugin) => sum + plugin.installCount, 0),
        totalRevenue: breakdown.reduce((sum, item) => sum + item.totalRevenue, 0),
        developerEarnings: earnings?.totalEarned ?? 0,
        availableForPayout: earnings?.pendingBalance ?? 0,
      },
      breakdown,
    });
  } catch (err) {
    console.error("[pluginRoutes] Revenue fetch error:", err);
    res.status(500).json({ error: "Failed to fetch revenue summary" });
  }
});

router.get("/developer/payouts", async (req: Request, res: Response) => {
  try {
    const payouts = await db.developerPayout.findMany({
      where: { developerId: req.user!.userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ payouts });
  } catch (err) {
    console.error("[pluginRoutes] Payout fetch error:", err);
    res.status(500).json({ error: "Failed to fetch payout history" });
  }
});

router.post("/developer/payout/request", async (req: Request, res: Response) => {
  const developerId = req.user!.userId;
  const amount = Number(req.body?.amount ?? 0);
  const payoutMethod =
    typeof req.body?.payoutMethod === "string" && req.body.payoutMethod.trim()
      ? req.body.payoutMethod.trim()
      : "manual";
  const payoutDetails =
    req.body?.payoutDetails && typeof req.body.payoutDetails === "object"
      ? req.body.payoutDetails
      : {};

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Valid payout amount is required" });
  }

  try {
    const earnings = await db.developerEarnings.findUnique({ where: { developerId } });
    if (!earnings || earnings.pendingBalance < amount) {
      return res.status(400).json({ error: "Insufficient available balance" });
    }

    const [payout] = await db.$transaction([
      db.developerPayout.create({
        data: {
          developerId,
          amount,
          currency: "USD",
          payoutMethod,
          payoutDetails,
          status: "PENDING",
        },
      }),
      db.developerEarnings.update({
        where: { developerId },
        data: {
          pendingBalance: { decrement: amount },
          totalPaidOut: { increment: amount },
        },
      }),
    ]);

    res.status(201).json({ payout, success: true });
  } catch (err) {
    console.error("[pluginRoutes] Payout request error:", err);
    res.status(500).json({ error: "Failed to request payout" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const sort = typeof req.query.sort === "string" ? req.query.sort : "popular";

  try {
    const where: Prisma.PluginWhereInput = { status: "PUBLISHED" };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    let orderBy: Prisma.PluginOrderByWithRelationInput = { installCount: "desc" };
    if (sort === "newest") orderBy = { publishedAt: "desc" };
    if (sort === "rating") orderBy = { averageRating: "desc" };
    if (sort === "price") orderBy = { price: "asc" };

    const plugins = await db.plugin.findMany({
      where,
      include: pluginListInclude,
      orderBy,
    });

    res.json({ plugins });
  } catch (err) {
    console.error("[pluginRoutes] Error fetching plugins:", err);
    res.status(500).json({ error: "Failed to fetch plugins" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const developerId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const {
    name,
    description,
    version,
    category,
    pricing = "free",
    price = 0,
    currency = "USD",
    revenueShare = 70,
    manifestUrl,
    documentationUrl,
    repositoryUrl,
    screenshots = [],
    tags = [],
  } = req.body ?? {};

  if (!name || !description || !version || !category || !manifestUrl) {
    return res.status(400).json({ error: "name, description, version, category, and manifestUrl are required" });
  }

  try {
    const plugin = await db.plugin.create({
      data: {
        tenantId,
        developerId,
        name: String(name).trim(),
        slug: pluginSlug(String(name)),
        description: String(description).trim(),
        version: String(version).trim(),
        category: String(category).trim(),
        pricing,
        price: Number(price) || 0,
        currency: String(currency).trim() || "USD",
        revenueShare: Number(revenueShare) || 70,
        manifestUrl: String(manifestUrl).trim(),
        documentationUrl: documentationUrl ? String(documentationUrl).trim() : null,
        repositoryUrl: repositoryUrl ? String(repositoryUrl).trim() : null,
        screenshots: Array.isArray(screenshots) ? screenshots.map(String) : [],
        tags: Array.isArray(tags) ? tags.map(String) : [],
        status: "PENDING_REVIEW",
      },
      include: pluginListInclude,
    });

    res.status(201).json(plugin);
  } catch (err) {
    console.error("[pluginRoutes] Error creating plugin:", err);
    res.status(500).json({ error: "Failed to create plugin" });
  }
});

router.get("/:id/reviews", async (req: Request, res: Response) => {
  const pluginId = String(req.params.id);

  try {
    const [reviews, total] = await Promise.all([
      db.pluginReview.findMany({
        where: { pluginId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.pluginReview.count({ where: { pluginId } }),
    ]);

    const averageRating =
      reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

    res.json({ reviews, averageRating, total });
  } catch (err) {
    console.error("[pluginRoutes] Error fetching reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const pluginId = String(req.params.id);

  try {
    const plugin = await db.plugin.findUnique({
      where: { id: pluginId },
      include: pluginDetailInclude,
    });

    if (!plugin) {
      return res.status(404).json({ error: "Plugin not found" });
    }

    res.json(plugin);
  } catch (err) {
    console.error("[pluginRoutes] Error fetching plugin:", err);
    res.status(500).json({ error: "Failed to fetch plugin" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const pluginId = String(req.params.id);

  try {
    const plugin = await db.plugin.findFirst({
      where: { id: pluginId, developerId: req.user!.userId },
    });

    if (!plugin) {
      return res.status(404).json({ error: "Plugin not found" });
    }

    const updated = await db.plugin.update({
      where: { id: pluginId },
      data: {
        name: req.body?.name ? String(req.body.name).trim() : undefined,
        description: req.body?.description ? String(req.body.description).trim() : undefined,
        version: req.body?.version ? String(req.body.version).trim() : undefined,
        category: req.body?.category ? String(req.body.category).trim() : undefined,
        pricing: req.body?.pricing,
        price: req.body?.price !== undefined ? Number(req.body.price) || 0 : undefined,
        currency: req.body?.currency ? String(req.body.currency).trim() : undefined,
        revenueShare: req.body?.revenueShare !== undefined ? Number(req.body.revenueShare) || 70 : undefined,
        manifestUrl: req.body?.manifestUrl ? String(req.body.manifestUrl).trim() : undefined,
        documentationUrl: req.body?.documentationUrl !== undefined ? req.body.documentationUrl : undefined,
        repositoryUrl: req.body?.repositoryUrl !== undefined ? req.body.repositoryUrl : undefined,
        screenshots: Array.isArray(req.body?.screenshots) ? req.body.screenshots.map(String) : undefined,
        tags: Array.isArray(req.body?.tags) ? req.body.tags.map(String) : undefined,
      },
      include: pluginListInclude,
    });

    res.json(updated);
  } catch (err) {
    console.error("[pluginRoutes] Error updating plugin:", err);
    res.status(500).json({ error: "Failed to update plugin" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const pluginId = String(req.params.id);

  try {
    const plugin = await db.plugin.findFirst({
      where: { id: pluginId, developerId: req.user!.userId },
    });

    if (!plugin) {
      return res.status(404).json({ error: "Plugin not found" });
    }

    await db.plugin.update({
      where: { id: pluginId },
      data: { status: "ARCHIVED" },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("[pluginRoutes] Error deleting plugin:", err);
    res.status(500).json({ error: "Failed to delete plugin" });
  }
});

router.post("/:id/install", async (req: Request, res: Response) => {
  const pluginId = String(req.params.id);
  const tenantId = req.user!.tenantId;
  const userId = req.user!.userId;

  try {
    const plugin = await db.plugin.findFirst({
      where: { id: pluginId, status: "PUBLISHED" },
    });

    if (!plugin) {
      return res.status(404).json({ error: "Plugin not found or not published" });
    }

    const existing = await db.pluginInstall.findUnique({
      where: { pluginId_tenantId: { pluginId, tenantId } },
    });

    const install = existing
      ? await db.pluginInstall.update({
          where: { pluginId_tenantId: { pluginId, tenantId } },
          data: { active: true, version: plugin.version, lastUsedAt: new Date() },
        })
      : await db.pluginInstall.create({
          data: {
            pluginId,
            tenantId,
            userId,
            version: plugin.version,
          },
        });

    if (!existing) {
      await db.plugin.update({
        where: { id: pluginId },
        data: { installCount: { increment: 1 } },
      });
    }

    if (plugin.price > 0) {
      const developerAmount = Math.round(plugin.price * (plugin.revenueShare / 100) * 100) / 100;
      const platformAmount = Math.round(plugin.price * 100 - developerAmount * 100) / 100;

      await db.$transaction([
        db.pluginRevenue.create({
          data: {
            pluginId,
            tenantId,
            developerId: plugin.developerId,
            buyerId: userId,
            amount: plugin.price,
            developerAmount,
            platformAmount,
            currency: plugin.currency,
            status: "earned",
          },
        }),
        db.developerEarnings.upsert({
          where: { developerId: plugin.developerId },
          create: {
            developerId: plugin.developerId,
            pendingBalance: developerAmount,
            totalEarned: developerAmount,
          },
          update: {
            pendingBalance: { increment: developerAmount },
            totalEarned: { increment: developerAmount },
          },
        }),
      ]);
    }

    res.status(201).json({ install, success: true });
  } catch (err) {
    console.error("[pluginRoutes] Error installing plugin:", err);
    res.status(500).json({ error: "Failed to install plugin" });
  }
});

router.delete("/:id/uninstall", async (req: Request, res: Response) => {
  const pluginId = String(req.params.id);
  const tenantId = req.user!.tenantId;

  try {
    const install = await db.pluginInstall.findUnique({
      where: { pluginId_tenantId: { pluginId, tenantId } },
    });

    if (!install) {
      return res.status(404).json({ error: "Plugin install not found" });
    }

    await db.pluginInstall.update({
      where: { pluginId_tenantId: { pluginId, tenantId } },
      data: { active: false },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("[pluginRoutes] Error uninstalling plugin:", err);
    res.status(500).json({ error: "Failed to uninstall plugin" });
  }
});

router.post("/:id/reviews", async (req: Request, res: Response) => {
  const pluginId = String(req.params.id);
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const rating = Number(req.body?.rating ?? 0);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be an integer between 1 and 5" });
  }

  try {
    const install = await db.pluginInstall.findFirst({
      where: { pluginId, userId, tenantId, active: true },
    });

    if (!install) {
      return res.status(400).json({ error: "Install the plugin before leaving a review" });
    }

    const existing = await db.pluginReview.findUnique({
      where: { pluginId_userId: { pluginId, userId } },
    });

    if (existing) {
      return res.status(400).json({ error: "You have already reviewed this plugin" });
    }

    const review = await db.pluginReview.create({
      data: {
        pluginId,
        userId,
        tenantId,
        rating,
        title: typeof req.body?.title === "string" ? req.body.title.trim() : null,
        content: typeof req.body?.content === "string" ? req.body.content.trim() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await recalculatePluginRating(pluginId);
    res.status(201).json(review);
  } catch (err) {
    console.error("[pluginRoutes] Error creating review:", err);
    res.status(500).json({ error: "Failed to create review" });
  }
});

export default router;
