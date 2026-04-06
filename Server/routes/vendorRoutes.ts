// Server/routes/vendorRoutes.ts — Vendor Management
// Phase 4: Winners Market - Vendor onboarding and management

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";
import Stripe from 'stripe';
import { recordAdminSignal } from "../services/adminSignalService.js";
function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!); }

const router = Router();

function slugifyStoreName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function createVendorOnboardingLink(accountId: string) {
  const stripe = getStripe();
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: (process.env.APP_URL || '') + '/market/vendor',
    return_url: (process.env.APP_URL || '') + '/market/vendor',
    type: 'account_onboarding',
  });
}

type VendorOnboardingStatus = {
  status: "not_started" | "pending" | "complete" | "restricted";
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  stripeAccountId: string | null;
  onboardingUrl: string | null;
};

async function buildVendorOnboardingStatus(stripeAccountId: string | null): Promise<VendorOnboardingStatus> {
  if (!stripeAccountId) {
    return {
      status: "not_started",
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      stripeAccountId: null,
      onboardingUrl: null,
    };
  }

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(stripeAccountId);
  const detailsSubmitted = !!account.details_submitted;
  const chargesEnabled = !!account.charges_enabled;
  const payoutsEnabled = !!account.payouts_enabled;
  const status = !detailsSubmitted ? "pending" : chargesEnabled && payoutsEnabled ? "complete" : "restricted";
  const onboardingUrl = status === "complete" ? null : (await createVendorOnboardingLink(stripeAccountId)).url;

  return {
    status,
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    stripeAccountId,
    onboardingUrl,
  };
}

async function upsertVendorConnectAccount(params: {
  userId: string;
  tenantId: string;
  email?: string;
  businessName?: string;
  businessType?: string;
  country?: string;
}) {
  const { userId, tenantId, email, businessName, businessType, country } = params;
  const existingVendor = await db.vendor.findFirst({
    where: { userId, tenantId },
  });

  const vendorName = businessName?.trim() || existingVendor?.storeName || "Vendor Store";
  const baseSlug = slugifyStoreName(vendorName);
  let storeSlug = existingVendor?.storeSlug || baseSlug || `vendor-${userId.slice(0, 8)}`;
  let suffix = 1;

  while (true) {
    const conflicting = await db.vendor.findFirst({ where: { storeSlug } });
    if (!conflicting || conflicting.id === existingVendor?.id) {
      break;
    }
    suffix += 1;
    storeSlug = `${baseSlug || `vendor-${userId.slice(0, 8)}`}-${suffix}`;
  }

  const stripe = getStripe();
  const normalizedBusinessType =
    businessType === "individual" || businessType === "company" ? businessType : undefined;
  const account = existingVendor?.stripeAccountId
    ? await stripe.accounts.retrieve(existingVendor.stripeAccountId)
    : await stripe.accounts.create({
        type: "express",
        country: country || "KE",
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: normalizedBusinessType,
        metadata: {
          userId,
          tenantId,
        },
      });

  const vendor = existingVendor
    ? await db.vendor.update({
        where: { id: existingVendor.id, tenantId },
        data: {
          storeName: vendorName,
          storeSlug,
          stripeAccountId: account.id,
          status: "PENDING",
          payoutMethod: "stripe_connect",
        },
      })
    : await db.vendor.create({
        data: {
          userId,
          tenantId,
          storeName: vendorName,
          storeSlug,
          stripeAccountId: account.id,
          status: "PENDING",
          payoutMethod: "stripe_connect",
        },
      });

  const onboarding = await buildVendorOnboardingStatus(account.id);

  return { vendor, onboarding, stripeAccountId: account.id };
}

// GET /vendors - List all vendors (public marketplace)
router.get("/", async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string || req.user?.tenantId;
    const vendors = await db.vendor.findMany({
      where: { status: "APPROVED", tenantId },
      include: {
        owner: {
          select: { id: true, name: true }
        },
        _count: {
          select: { products: true, orders: true }
        }
      },
      orderBy: { trustScore: "desc" }
    });
    res.json(vendors);
  } catch (error) {
    console.error("[vendorRoutes] Error fetching vendors:", error);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// GET /vendors/me - Get current user's vendor profile
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;

    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId },
      include: {
        _count: {
          select: { products: true, orders: true }
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json(vendor);
  } catch (error) {
    console.error("[vendorRoutes] Error fetching vendor:", error);
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

// POST /vendors - Create new vendor store
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { storeName, storeSlug, description } = req.body;

    // Check if slug is taken
    const existing = await db.vendor.findUnique({
      where: { storeSlug }
    });

    if (existing) {
      return res.status(400).json({ error: "Store slug already taken" });
    }

    const vendor = await db.vendor.create({
      data: {
        tenantId,
        userId,
        storeName,
        storeSlug,
        description,
        status: "PENDING"
      }
    });

    res.status(201).json(vendor);

    const owner = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    recordAdminSignal({
      kind: "atlas:vendor_applied",
      supervisor: "ATLAS",
      supervisorEmoji: "ATLAS -> OMEGA",
      layerId: "market",
      layerName: "Market",
      adminPath: "/admin/platform/market",
      title: `${vendor.storeName} applied for Market launch`,
      message: `${owner?.name ?? owner?.email ?? "A vendor"} submitted ${vendor.storeName}. Awaiting Market launch clearance.`,
      metadata: {
        vendorId: vendor.id,
        storeName: vendor.storeName,
        storeSlug: vendor.storeSlug,
      },
    });
  } catch (error) {
    console.error("[vendorRoutes] Error creating vendor:", error);
    res.status(500).json({ error: "Failed to create vendor" });
  }
});

router.post('/apply', authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const email = req.user!.email;
  const { businessName, businessType, country } = req.body;

  if (!businessName?.trim()) {
    return res.status(400).json({ error: 'Business name is required' });
  }

  try {
    const { vendor, onboarding, stripeAccountId } = await upsertVendorConnectAccount({
      userId,
      tenantId,
      email,
      businessName,
      businessType,
      country,
    });

    recordAdminSignal({
      kind: "atlas:vendor_applied",
      supervisor: "ATLAS",
      supervisorEmoji: "ATLAS -> OMEGA",
      layerId: "market",
      layerName: "Market",
      adminPath: "/admin/platform/market",
      title: `${vendor.storeName} started vendor onboarding`,
      message: `${businessName.trim()} opened Stripe Connect onboarding and is awaiting market approval.`,
      metadata: {
        vendorId: vendor.id,
        storeName: vendor.storeName,
        storeSlug: vendor.storeSlug,
        stripeAccountId,
      },
    });

    return res.json({
      vendor,
      onboardingUrl: onboarding.onboardingUrl,
      onboardingStatus: onboarding,
      stripeAccountId,
    });
  } catch (error) {
    console.error('[vendor] Apply error:', error);
    return res.status(500).json({ error: 'Failed to start vendor onboarding' });
  }
});

// PUT /vendors/me - Update vendor profile
router.put("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { storeName, description, logo, banner } = req.body;

    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId }
    });

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const updated = await db.vendor.update({
      where: { id: vendor.id, tenantId },
      data: {
        storeName: storeName ?? vendor.storeName,
        description: description ?? vendor.description,
        logo: logo ?? vendor.logo,
        banner: banner ?? vendor.banner
      }
    });

    res.json(updated);
  } catch (error) {
    console.error("[vendorRoutes] Error updating vendor:", error);
    res.status(500).json({ error: "Failed to update vendor" });
  }
});

// GET /vendors/me/analytics - Get vendor analytics
router.get("/me/analytics", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;

    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId },
      select: { id: true, storeName: true, tenantId: true, stripeAccountId: true },
    });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const orderItemWhere = {
      tenantId,
      order: { vendorId: vendor.id, tenantId },
    };

    const [totalOrders, recentOrders, products, totalOrderItems, recentOrderItems, revenueResult] = await Promise.all([
      db.order.count({ where: { vendorId: vendor.id, tenantId } }),
      db.order.count({ where: { vendorId: vendor.id, tenantId, createdAt: { gte: thirtyDaysAgo } } }),
      db.product.count({ where: { vendorId: vendor.id, tenantId, isActive: true } }),
      db.orderItem.count({ where: orderItemWhere }),
      db.orderItem.count({ where: { ...orderItemWhere, createdAt: { gte: thirtyDaysAgo } } }),
      db.orderItem.aggregate({
        where: orderItemWhere,
        _sum: { total: true },
        _count: { id: true },
      })
    ]);

    const dailyRevenue = await db.orderItem.groupBy({
      by: ["createdAt"],
      where: { ...orderItemWhere, createdAt: { gte: thirtyDaysAgo } },
      _sum: { total: true },
      _count: { id: true }
    });

    res.json({
      vendorId: vendor.id,
      vendorName: vendor.storeName,
      totalOrders,
      recentOrders,
      activeProducts: products,
      totalOrderItems,
      recentOrderItems,
      totalRevenue: revenueResult._sum.total || 0,
      totalRevenueItems: revenueResult._count.id || 0,
      dailyRevenue: dailyRevenue.map(d => ({
        date: d.createdAt,
        revenue: d._sum.total || 0,
        orders: d._count.id
      }))
    });
  } catch (error) {
    console.error("[vendorRoutes] Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

router.get("/me/payouts", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;

    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId },
      select: { id: true, payoutBalance: true },
    });

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const payouts = await db.vendorPayout.findMany({
      where: { tenantId, vendorId: vendor.id },
      include: {
        vendor: { select: { storeName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const summary = payouts.reduce(
      (acc, payout) => {
        acc.total += payout.amount;
        if (payout.status === "paid") {
          acc.paid += payout.amount;
        } else {
          acc.pending += payout.amount;
        }
        return acc;
      },
      { total: 0, paid: 0, pending: 0 },
    );

    return res.json({
      balance: vendor.payoutBalance,
      payouts,
      summary,
    });
  } catch (error) {
    console.error("[vendorRoutes] Error fetching vendor payouts:", error);
    return res.status(500).json({ error: "Failed to fetch vendor payouts" });
  }
});

const MINIMUM_PAYOUT = 50;

router.post("/me/payout/request", authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const amount = Number(req.body?.amount ?? 0);
  const payoutMethod = typeof req.body?.payoutMethod === "string" ? req.body.payoutMethod.trim() : "stripe_connect";

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Valid payout amount is required" });
  }

  if (amount < MINIMUM_PAYOUT) {
    return res.status(400).json({ error: `Minimum payout amount is $${MINIMUM_PAYOUT}` });
  }

  try {
    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId },
      select: { id: true, payoutBalance: true, stripeAccountId: true, storeName: true },
    });

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const stripeAccountId = vendor.stripeAccountId;
    if (!stripeAccountId) {
      const onboarding = await buildVendorOnboardingStatus(null);
      return res.status(409).json({
        error: "Stripe account not connected. Please complete onboarding first.",
        code: "ONBOARDING_REQUIRED",
        onboarding,
      });
    }

    if (vendor.payoutBalance < amount) {
      return res.status(400).json({ error: "Insufficient available balance" });
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(stripeAccountId);
    if (!account.payouts_enabled) {
      const onboarding = await buildVendorOnboardingStatus(stripeAccountId);
      return res.status(409).json({
        error: "Payouts not enabled on your Stripe account. Please complete Stripe onboarding.",
        code: "PAYOUTS_NOT_ENABLED",
        onboarding,
      });
    }

    let stripeTransferId: string | null = null;
    
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        destination: stripeAccountId,
        description: `Vendor payout for ${vendor.storeName}`,
      });
      stripeTransferId = transfer.id;
    } catch (stripeError: unknown) {
      console.error("[vendorRoutes] Stripe transfer error:", stripeError);
      return res.status(500).json({ error: `Stripe transfer failed: ${stripeError instanceof Error ? stripeError.message : "Unknown Stripe error"}` });
    }

    const pendingPayouts = await db.vendorPayout.findMany({
      where: { vendorId: vendor.id, status: "pending" },
      orderBy: { createdAt: "asc" },
    });

    let payoutAmountRemaining = amount;
    const payoutIds: string[] = [];

    for (const payout of pendingPayouts) {
      if (payoutAmountRemaining <= 0) break;
      const deductAmount = Math.min(payout.amount, payoutAmountRemaining);
      payoutIds.push(payout.id);
      payoutAmountRemaining -= deductAmount;
    }

    await db.$transaction([
      db.vendor.update({
        where: { id: vendor.id, tenantId },
        data: { payoutBalance: { decrement: amount } },
      }),
      db.vendorPayout.updateMany({
        where: { id: { in: payoutIds } },
        data: { status: "paid", paidAt: new Date(), stripeTransferId },
      }),
      db.vendorPayout.create({
        data: {
          tenantId,
          vendorId: vendor.id,
          orderId: "PAYOUT-" + Date.now(),
          amount: -amount,
          commission: 0,
          stripeTransferId,
          status: "paid",
          paidAt: new Date(),
        },
      }),
    ]);

    await recordAdminSignal({
      kind: "atlas:vendor_applied",
      supervisor: "ATLAS",
      supervisorEmoji: "🛒",
      layerId: vendor.id,
      layerName: vendor.storeName,
      adminPath: "/admin/vendors",
      title: "Vendor Payout Processed",
      message: `Vendor ${vendor.storeName} payout of $${amount} processed`,
      metadata: { vendorId: vendor.id, amount, stripeTransferId },
    });

    return res.status(201).json({
      success: true,
      payout: {
        amount,
        method: payoutMethod,
        status: "paid",
        stripeTransferId,
      },
    });
  } catch (error) {
    console.error("[vendorRoutes] Payout request error:", error);
    return res.status(500).json({ error: "Failed to process payout request" });
  }
});

// GET /vendors/:id - Get vendor by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string || req.user?.tenantId;
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : (idParam || "");

    const vendor = await db.vendor.findFirst({
      where: { id, tenantId },
      include: {
        owner: {
          select: { id: true, name: true }
        },
        products: {
          where: { isActive: true },
          take: 20
        },
        _count: {
          select: { products: true, orders: true }
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json(vendor);
  } catch (error) {
    console.error("[vendorRoutes] Error fetching vendor:", error);
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

router.post('/onboard', authMiddleware, async (req: Request, res: Response) => {
  const { businessName, businessType, country } = req.body;
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  try {
    const { vendor, onboarding, stripeAccountId } = await upsertVendorConnectAccount({
      userId,
      tenantId,
      businessName,
      businessType,
      country,
    });
    return res.json({ vendor, onboardingUrl: onboarding.onboardingUrl, onboardingStatus: onboarding, stripeAccountId });
  } catch (error) {
    console.error('[vendor] Onboard error:', error);
    return res.status(500).json({ error: 'Failed to create Stripe account' });
  }
});

router.get('/onboard/status', authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  try {
    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId },
      select: { id: true, stripeAccountId: true },
    });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    const onboarding = await buildVendorOnboardingStatus(vendor.stripeAccountId);
    return res.json(onboarding);
  } catch (error) {
    console.error('[vendor] Status error:', error);
    return res.status(500).json({ error: 'Failed to get onboarding status' });
  }
});

router.get('/me/onboarding', authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  try {
    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId },
      select: { id: true, stripeAccountId: true, storeName: true },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found', code: 'NOT_SETUP' });
    }

    const onboarding = await buildVendorOnboardingStatus(vendor.stripeAccountId);

    return res.json({
      vendorId: vendor.id,
      storeName: vendor.storeName,
      ...onboarding,
    });
  } catch (error) {
    console.error('[vendor] Onboarding status error:', error);
    return res.status(500).json({ error: 'Failed to get vendor onboarding status' });
  }
});

export default router;
