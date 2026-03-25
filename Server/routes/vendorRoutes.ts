// Server/routes/vendorRoutes.ts — Vendor Management
// Phase 4: Winners Market - Vendor onboarding and management

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";
import Stripe from 'stripe';
import { recordAdminSignal } from "../services/adminSignalService.js";
function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!); }

const router = Router();

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
  const { businessName, country } = req.body;
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  try {
    const stripe = getStripe();
    const account = await stripe.accounts.create({
      type: 'express',
      country: country || 'KE',
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    });
    await db.vendor.updateMany({ where: { userId, tenantId }, data: { stripeAccountId: account.id } as any });
    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: (process.env.APP_URL || '') + '/market/vendor/onboard',
      return_url: (process.env.APP_URL || '') + '/market/vendor/dashboard',
      type: 'account_onboarding',
    });
    return res.json({ onboardingUrl: link.url });
  } catch (error) {
    console.error('[vendor] Onboard error:', error);
    return res.status(500).json({ error: 'Failed to create Stripe account' });
  }
});

router.get('/onboard/status', authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  try {
    const vendor = await db.vendor.findFirst({ where: { userId, tenantId } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    const stripeAccountId = (vendor as any).stripeAccountId;
    if (!stripeAccountId) return res.json({ status: 'not_started' });
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(stripeAccountId);
    return res.json({ status: account.details_submitted ? 'complete' : 'pending', chargesEnabled: account.charges_enabled, payoutsEnabled: account.payouts_enabled });
  } catch (error) {
    console.error('[vendor] Status error:', error);
    return res.status(500).json({ error: 'Failed to get onboarding status' });
  }
});

export default router;
