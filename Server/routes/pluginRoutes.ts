// Phase 8 — Winners Cloud — Plugin Marketplace API
// Plugin submission, review, installation, and revenue sharing
// NEXUS Supervisor · cloud.winnersempire.io

import { Router, Request, Response } from "express";
import { randomBytes } from "crypto";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

async function attachPluginCounts<T extends { id: string }>(plugins: T[]) {
  const pluginIds = plugins.map((plugin) => plugin.id);
  if (pluginIds.length === 0) {
    return plugins.map((plugin) => ({
      ...plugin,
      installCount: 0,
      reviewCount: 0,
    }));
  }

  const [installs, reviews] = await Promise.all([
    db.pluginInstall.groupBy({
      by: ["pluginId"],
      where: { pluginId: { in: pluginIds }, active: true },
      _count: { pluginId: true },
    }),
    db.pluginReview.groupBy({
      by: ["pluginId"],
      where: { pluginId: { in: pluginIds } },
      _count: { pluginId: true },
    }),
  ]);

  const installMap = new Map(installs.map((row) => [row.pluginId, row._count.pluginId]));
  const reviewMap = new Map(reviews.map((row) => [row.pluginId, row._count.pluginId]));

  return plugins.map((plugin) => ({
    ...plugin,
    installCount: installMap.get(plugin.id) ?? 0,
    reviewCount: reviewMap.get(plugin.id) ?? 0,
  }));
}

async function attachDevelopers<T extends { developerId: string }>(plugins: T[]) {
  const developerIds = Array.from(new Set(plugins.map((plugin) => plugin.developerId)));
  const developers = developerIds.length
    ? await db.user.findMany({
        where: { id: { in: developerIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const developerMap = new Map(developers.map((developer) => [developer.id, developer]));

  return plugins.map((plugin) => ({
    ...plugin,
    developer: developerMap.get(plugin.developerId) ?? null,
  }));
}

async function hydratePluginList<T extends { id: string; developerId: string }>(plugins: T[]) {
  const withDevelopers = await attachDevelopers(plugins);
  return attachPluginCounts(withDevelopers);
}

router.get("/installed-legacy", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;

  try {
    const installs = await db.pluginInstall.findMany({
      where: { tenantId, active: true },
      orderBy: { installedAt: "desc" },
    });
    const plugins = installs.length
      ? await db.plugin.findMany({
          where: { id: { in: installs.map((install) => install.pluginId) } },
        })
      : [];
    const hydratedPlugins = await hydratePluginList(plugins);
    const pluginMap = new Map(hydratedPlugins.map((plugin) => [plugin.id, plugin]));

    res.json({
      installs: installs.map((install) => ({
        ...install,
        plugin: pluginMap.get(install.pluginId) ?? null,
      })),
    });
  } catch (err) {
    console.error("[pluginRoutes] Error fetching installed plugins:", err);
    res.status(500).json({ error: "Failed to fetch installed plugins" });
  }
});

// ─── PLUGIN CATALOGUE ─────────────────────────────────────────────────────────

// GET /plugins — list published plugins
router.get("/", async (req: Request, res: Response) => {
  const { category, search, sort = "popular" } = req.query;
  try {
    const where: Record<string, unknown> = { status: "PUBLISHED" };
    if (category) where.category = String(category);
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
        { tags: { has: String(search) } },
      ];
    }

    let orderBy: Record<string, string> = { installCount: "desc" };
    if (sort === "newest") orderBy = { createdAt: "desc" };
    if (sort === "rating") orderBy = { averageRating: "desc" };
    if (sort === "price") orderBy = { price: "asc" };

    const plugins = await db.plugin.findMany({
      where: where as never,
      orderBy,
    });
    const hydratedPlugins = await hydratePluginList(plugins);

    res.json({
      plugins: hydratedPlugins,
    });
  } catch (err) {
    console.error("[pluginRoutes] Error fetching plugins:", err);
    res.status(500).json({ error: "Failed to fetch plugins" });
  }
});

// GET /plugins/:id — single plugin details
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;
  try {
    const plugin = await db.plugin.findUnique({ where: { id } });

    if (!plugin) {
      return res.status(404).json({ error: "Plugin not found" });
    }

    const [pluginWithDeveloper] = await attachDevelopers([plugin]);
    const [pluginWithCounts] = await attachPluginCounts([pluginWithDeveloper]);
    const reviews = await db.pluginReview.findMany({
      where: { pluginId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const reviewUsers = reviews.length
      ? await db.user.findMany({
          where: { id: { in: Array.from(new Set(reviews.map((review) => review.userId))) } },
          select: { id: true, name: true },
        })
      : [];
    const reviewUserMap = new Map(reviewUsers.map((user) => [user.id, user]));

    res.json({
      ...pluginWithCounts,
      reviews: reviews.map((review) => ({
        ...review,
        user: reviewUserMap.get(review.userId) ?? null,
      })),
    });
  } catch (err) {
    console.error("[pluginRoutes] Error fetching plugin:", err);
    res.status(500).json({ error: "Failed to fetch plugin" });
  }
});

// ─── PLUGIN SUBMISSION ─────────────────────────────────────────────────────────

// POST /plugins — submit a new plugin
router.post("/", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const {
    name,
    slug,
    description,
    category,
    tags,
    price,
    currency = "USD",
    version,
    manifestUrl,
    documentationUrl,
    sourceCodeUrl,
    screenshots,
  } = req.body;

  if (!name?.trim() || !slug?.trim() || !description?.trim()) {
    return res
      .status(400)
      .json({ error: "Name, slug, and description are required" });
  }

  try {
    // Check slug uniqueness
    const existing = await db.plugin.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ error: "Plugin slug already exists" });
    }

    const plugin = await db.plugin.create({
      data: {
        tenantId,
        developerId: userId,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        category: category || "UTILITY",
        tags: tags || [],
        price: price || 0,
        currency,
        version: version || "1.0.0",
        manifestUrl,
        documentationUrl,
        sourceCodeUrl,
        screenshots: screenshots || [],
        status: "PENDING_REVIEW",
      },
    });

    res.status(201).json(plugin);
  } catch (err) {
    console.error("[pluginRoutes] Error creating plugin:", err);
    res.status(500).json({ error: "Failed to create plugin" });
  }
});

// PUT /plugins/:id — update plugin
router.put("/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const { id } = req.params as Record<string, string>;
  const updateData = req.body;

  try {
    const plugin = await db.plugin.findFirst({
      where: { id, developerId: userId, tenantId },
    });

    if (!plugin) {
      return res
        .status(404)
        .json({ error: "Plugin not found or unauthorized" });
    }

    const updated = await db.plugin.update({
      where: { id },
      data: {
        ...updateData,
        status: "PENDING_REVIEW", // Reset to pending on update
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("[pluginRoutes] Error updating plugin:", err);
    res.status(500).json({ error: "Failed to update plugin" });
  }
});

// DELETE /plugins/:id — delete plugin
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const { id } = req.params as Record<string, string>;

  try {
    const plugin = await db.plugin.findFirst({
      where: { id, developerId: userId, tenantId },
    });

    if (!plugin) {
      return res
        .status(404)
        .json({ error: "Plugin not found or unauthorized" });
    }

    await db.plugin.update({
      where: { id },
      data: { status: "DELETED" },
    });

    res.json({ message: "Plugin deleted" });
  } catch (err) {
    console.error("[pluginRoutes] Error deleting plugin:", err);
    res.status(500).json({ error: "Failed to delete plugin" });
  }
});

// ─── PLUGIN INSTALLATION ─────────────────────────────────────────────────────

// POST /plugins/:id/install — install a plugin
router.post("/:id/install", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const { id } = req.params as Record<string, string>;

  try {
    const plugin = await db.plugin.findFirst({
      where: { id, status: "PUBLISHED" },
    });

    if (!plugin) {
      return res
        .status(404)
        .json({ error: "Plugin not found or not published" });
    }

    // Check if already installed
    const existing = await db.pluginInstall.findUnique({
      where: { pluginId_tenantId: { pluginId: id, tenantId } },
    });

    if (existing) {
      return res.status(400).json({ error: "Plugin already installed" });
    }

    // Create installation
    const install = await db.pluginInstall.create({
      data: {
        pluginId: id,
        tenantId,
        userId,
        version: plugin.version,
      },
    });

    // Update install count
    await db.plugin.update({
      where: { id },
      data: { installCount: { increment: 1 } },
    });

    // Process payment if paid plugin
    if (plugin.price > 0) {
      // Revenue sharing: 70% developer, 30% platform
      const developerShare = Math.round(plugin.price * 0.7 * 100);
      const platformShare = Math.round(plugin.price * 0.3 * 100);

      await db.pluginRevenue.create({
        data: {
          pluginId: id,
          developerId: plugin.developerId,
          tenantId,
          amount: plugin.price,
          developerShare,
          platformShare,
          currency: plugin.currency,
          status: "PENDING",
        },
      });
    }

    res.status(201).json(install);
  } catch (err) {
    console.error("[pluginRoutes] Error installing plugin:", err);
    res.status(500).json({ error: "Failed to install plugin" });
  }
});

// DELETE /plugins/:id/uninstall — uninstall a plugin
router.delete("/:id/uninstall", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params as Record<string, string>;

  try {
    const install = await db.pluginInstall.findUnique({
      where: { pluginId_tenantId: { pluginId: id, tenantId } },
    });

    if (!install) {
      return res.status(404).json({ error: "Plugin not installed" });
    }

    await db.pluginInstall.update({
      where: { id: install.id },
      data: { active: false },
    });

    res.json({ message: "Plugin uninstalled" });
  } catch (err) {
    console.error("[pluginRoutes] Error uninstalling plugin:", err);
    res.status(500).json({ error: "Failed to uninstall plugin" });
  }
});

// GET /plugins/installed — list installed plugins
router.get("/installed", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;

  try {
    const installs = await db.pluginInstall.findMany({
      where: { tenantId, active: true },
      orderBy: { installedAt: "desc" },
    });
    const plugins = installs.length
      ? await db.plugin.findMany({
          where: { id: { in: installs.map((install) => install.pluginId) } },
        })
      : [];
    const hydratedPlugins = await hydratePluginList(plugins);
    const pluginMap = new Map(hydratedPlugins.map((plugin) => [plugin.id, plugin]));

    res.json({
      installs: installs.map((install) => ({
        ...install,
        plugin: pluginMap.get(install.pluginId) ?? null,
      })),
    });
  } catch (err) {
    console.error("[pluginRoutes] Error fetching installed plugins:", err);
    res.status(500).json({ error: "Failed to fetch installed plugins" });
  }
});

// ─── PLUGIN REVIEWS ─────────────────────────────────────────────────────────

// POST /plugins/:id/reviews — submit a review
router.post("/:id/reviews", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const { id } = req.params as Record<string, string>;
  const { rating, title, content } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
    const plugin = await db.plugin.findFirst({
      where: { id, status: "PUBLISHED" },
    });

    if (!plugin) {
      return res.status(404).json({ error: "Plugin not found" });
    }

    // Check if already reviewed
    const existing = await db.pluginReview.findFirst({
      where: { pluginId: id, userId },
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: "You have already reviewed this plugin" });
    }

    const review = await db.pluginReview.create({
      data: {
        pluginId: id,
        userId,
        tenantId,
        rating,
        title: title || "",
        content: content || "",
      },
    });
    const reviewUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    // Update average rating
    const reviews = await db.pluginReview.findMany({
      where: { pluginId: id },
      select: { rating: true },
    });

    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await db.plugin.update({
      where: { id },
      data: { averageRating },
    });

    res.status(201).json({
      ...review,
      user: reviewUser,
    });
  } catch (err) {
    console.error("[pluginRoutes] Error creating review:", err);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// GET /plugins/:id/reviews — get plugin reviews
router.get("/:id/reviews", async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "10"));

  try {
    const [reviews, total] = await Promise.all([
      db.pluginReview.findMany({
        where: { pluginId: id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.pluginReview.count({ where: { pluginId: id } }),
    ]);
    const reviewUsers = reviews.length
      ? await db.user.findMany({
          where: { id: { in: Array.from(new Set(reviews.map((review) => review.userId))) } },
          select: { id: true, name: true },
        })
      : [];
    const reviewUserMap = new Map(reviewUsers.map((user) => [user.id, user]));

    res.json({
      reviews: reviews.map((review) => ({
        ...review,
        user: reviewUserMap.get(review.userId) ?? null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[pluginRoutes] Error fetching reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// ─── DEVELOPER DASHBOARD ─────────────────────────────────────────────────────

// GET /plugins/developer/dashboard — developer's plugin dashboard
router.get("/developer/dashboard", async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    const plugins = await db.plugin.findMany({
      where: { developerId: userId },
      orderBy: { createdAt: "desc" },
    });
    const hydratedPlugins = await attachPluginCounts(plugins);

    const totalInstalls = hydratedPlugins.reduce(
      (sum, p) => sum + p.installCount,
      0,
    );
    const totalReviews = hydratedPlugins.reduce((sum, p) => sum + p.reviewCount, 0);

    const revenue = await db.pluginRevenue.aggregate({
      where: { developerId: userId },
      _sum: { developerShare: true },
    });

    res.json({
      plugins: hydratedPlugins,
      stats: {
        totalPlugins: hydratedPlugins.length,
        totalInstalls,
        totalReviews,
        totalRevenue: revenue._sum.developerShare || 0,
      },
    });
  } catch (err) {
    console.error("[pluginRoutes] Error fetching developer dashboard:", err);
    res.status(500).json({ error: "Failed to fetch developer dashboard" });
  }
});

// ─── ADMIN REVIEW ─────────────────────────────────────────────────────────

// GET /plugins/admin/pending — list plugins pending review (admin only)
router.get("/admin/pending", async (req: Request, res: Response) => {
  const userRole = req.user!.role;

  if (!["owner", "admin"].includes(userRole)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const plugins = await db.plugin.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" },
    });
    const hydratedPlugins = await attachDevelopers(plugins);

    res.json({ plugins: hydratedPlugins });
  } catch (err) {
    console.error("[pluginRoutes] Error fetching pending plugins:", err);
    res.status(500).json({ error: "Failed to fetch pending plugins" });
  }
});

// POST /plugins/admin/:id/approve — approve a plugin (admin only)
router.post("/admin/:id/approve", async (req: Request, res: Response) => {
  const userRole = req.user!.role;
  const { id } = req.params as Record<string, string>;

  if (!["owner", "admin"].includes(userRole)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const plugin = await db.plugin.findUnique({ where: { id } });

    if (!plugin) {
      return res.status(404).json({ error: "Plugin not found" });
    }

    await db.plugin.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    res.json({ message: "Plugin approved and published" });
  } catch (err) {
    console.error("[pluginRoutes] Error approving plugin:", err);
    res.status(500).json({ error: "Failed to approve plugin" });
  }
});

// POST /plugins/admin/:id/reject — reject a plugin (admin only)
router.post("/admin/:id/reject", async (req: Request, res: Response) => {
  const userRole = req.user!.role;
  const { id } = req.params as Record<string, string>;
  const { reason } = req.body;

  if (!["owner", "admin"].includes(userRole)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const plugin = await db.plugin.findUnique({ where: { id } });

    if (!plugin) {
      return res.status(404).json({ error: "Plugin not found" });
    }

    await db.plugin.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: reason || "Does not meet marketplace guidelines",
      },
    });

    res.json({ message: "Plugin rejected" });
  } catch (err) {
    console.error("[pluginRoutes] Error rejecting plugin:", err);
    res.status(500).json({ error: "Failed to reject plugin" });
  }
});

// ─── REVENUE SHARING ──────────────────────────────────────────────────────────

// GET /plugins/developer/revenue — Get developer's revenue summary
router.get("/developer/revenue", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { period = "30d" } = req.query;

  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    // Get all plugins by this developer
    const plugins = await db.plugin.findMany({
      where: { developerId: userId },
      select: { id: true, name: true, price: true, revenueShare: true },
    });

    // Calculate revenue from installs
    const installs = await db.pluginInstall.findMany({
      where: {
        pluginId: { in: plugins.map((p) => p.id) },
        installedAt: { gte: since },
      },
      include: {
        plugin: {
          select: { price: true, revenueShare: true },
        },
      },
    });

    const revenueBreakdown = plugins.map((plugin) => {
      const pluginInstalls = installs.filter((i) => i.pluginId === plugin.id);
      const totalRevenue = plugin.price * pluginInstalls.length;
      const developerShare = totalRevenue * (plugin.revenueShare / 100);

      return {
        pluginId: plugin.id,
        pluginName: plugin.name,
        installs: pluginInstalls.length,
        totalRevenue,
        revenueSharePercent: plugin.revenueShare,
        developerEarnings: developerShare,
      };
    });

    const totalEarnings = revenueBreakdown.reduce(
      (sum, item) => sum + item.developerEarnings,
      0
    );

    res.json({
      period,
      since: since.toISOString(),
      totalPlugins: plugins.length,
      totalInstalls: installs.length,
      totalEarnings,
      breakdown: revenueBreakdown,
    });
  } catch (err) {
    console.error("[pluginRoutes] Revenue fetch error:", err);
    res.status(500).json({ error: "Failed to fetch revenue data" });
  }
});

// GET /plugins/developer/payouts — Get payout history
router.get("/developer/payouts", async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    const payouts = await db.vendorPayout.findMany({
      where: { vendorId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.json({ payouts });
  } catch (err) {
    console.error("[pluginRoutes] Payout fetch error:", err);
    res.status(500).json({ error: "Failed to fetch payouts" });
  }
});

// POST /plugins/developer/payout/request — Request payout
router.post("/developer/payout/request", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const { amount, method } = req.body ?? {};

  if (!amount || amount < 50) {
    return res.status(400).json({ error: "Minimum payout is $50" });
  }

  try {
    // Check available balance
    const revenueData = await fetch(`/plugins/developer/revenue?period=90d`, {
      headers: { Authorization: req.headers.authorization as string },
    }).then((r) => r.json());

    if (revenueData.totalEarnings < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const payout = await db.vendorPayout.create({
      data: {
        tenantId,
        vendorId: userId,
        orderId: `payout_${Date.now()}`,
        amount,
        method: method || "stripe",
        status: "pending",
      },
    });

    res.status(201).json({ payout, message: "Payout request submitted" });
  } catch (err) {
    console.error("[pluginRoutes] Payout request error:", err);
    res.status(500).json({ error: "Failed to request payout" });
  }
});

export default router;
