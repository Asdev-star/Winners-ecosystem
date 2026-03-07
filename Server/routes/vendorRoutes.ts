// Server/routes/vendorRoutes.ts — Vendor Management
// Phase 4: Winners Market - Vendor onboarding and management

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

// GET /vendors - List all vendors (public marketplace)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const vendors = await db.vendor.findMany({
      where: { status: "APPROVED" },
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
      where: { id: vendor.id },
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
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : (idParam || "");

    const vendor = await db.vendor.findUnique({
      where: { id },
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

export default router;
