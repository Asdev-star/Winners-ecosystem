// Phase 4: Dropshipping Routes
// Phase 6: Plan-gated - dropshipping requires PRO
import { Router, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requirePro } from "../middleware/marketPlanGate.js";
import type { AuthRequest } from "../types/index.js";
import db from "../db.js";
import {
  autoFulfillDropOrder,
  syncSupplierCatalog,
} from "../services/supplierService.js";
import {
  importPrintfulProductForTenant,
  syncPrintfulCatalogForTenant,
} from "../services/dropshipping/printfulService.js";
import { syncGelatoCatalogForTenant } from "../services/dropshipping/gelatoService.js";

const router = Router();

type SupportedSupplier = "printful" | "gelato" | "cj";

function isSupportedSupplier(value: string): value is SupportedSupplier {
  return ["printful", "gelato", "cj"].includes(value);
}

// GET /api/v1/dropship/catalog - Requires PRO plan
router.get(
  "/catalog",
  authMiddleware,
  requirePro("Dropshipping"),
  async (req, res) => {
    try {
      const {
        category,
        search,
        page = 1,
        limit = 24,
        sortBy = "atlasScore",
      } = req.query;
      const tenantId = req.user.tenantId;

      const where: Record<string, unknown> = { tenantId, isActive: true };
      if (category) where.category = String(category);
      if (search)
        where.title = { contains: String(search), mode: "insensitive" };

      const orderBy: Record<string, string> =
        sortBy === "atlasScore"
          ? { atlasScore: "desc" }
          : sortBy === "price_asc"
            ? { costPrice: "asc" }
            : sortBy === "price_desc"
              ? { costPrice: "desc" }
              : { createdAt: "desc" };

      const [products, total] = await Promise.all([
        db.supplierProduct.findMany({
          where,
          orderBy,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          include: {
            supplier: { select: { name: true, rating: true, origin: true } },
          },
        }),
        db.supplierProduct.count({ where }),
      ]);

      res.json({
        products,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      });
    } catch (error) {
      console.error("[dropshipRoutes] Error fetching catalog:", error);
      res.status(500).json({ error: "Failed to fetch catalog" });
    }
  },
);

// POST /api/v1/dropship/import
router.post("/import", authMiddleware, async (req, res) => {
  try {
    const { supplierProductId, retailPrice, title, description } = req.body;
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    const vendor = await db.vendor.findFirst({ where: { userId, tenantId } });
    if (!vendor)
      return res
        .status(403)
        .json({ error: "Vendor profile required", code: "NOT_A_VENDOR" });

    const supplierProduct = await db.supplierProduct.findUnique({
      where: { id: supplierProductId },
    });
    if (!supplierProduct)
      return res.status(404).json({ error: "Supplier product not found" });

    const existing = await db.product.findFirst({
      where: {
        vendorId: vendor.id,
        sourceSupplierProductId: supplierProductId,
      },
    });
    if (existing)
      return res
        .status(409)
        .json({ error: "Already imported", productId: existing.id });

    const product = await db.product.create({
      data: {
        vendorId: vendor.id,
        tenantId,
        name: title || supplierProduct.title,
        slug: (title || supplierProduct.title)
          .toLowerCase()
          .replace(/\s+/g, "-"),
        description: description || supplierProduct.description,
        price: retailPrice || supplierProduct.suggestedRetail,
        costPrice: supplierProduct.costPrice,
        category: supplierProduct.category,
        tags: supplierProduct.tags,
        fulfillmentType: "dropship",
        sourceSupplierProductId: supplierProductId,
        supplierId: supplierProduct.supplierId,
      },
    });

    res.json({
      product,
      message: "Product imported — review and publish when ready",
    });
  } catch (error) {
    console.error("[dropshipRoutes] Error importing:", error);
    res.status(500).json({ error: "Failed to import product" });
  }
});

// POST /api/v1/dropship/suppliers/:supplier/sync
router.post(
  "/suppliers/:supplier/sync",
  authMiddleware,
  requirePro("Dropshipping"),
  async (req, res) => {
    try {
      const supplier = Array.isArray(req.params.supplier)
        ? req.params.supplier[0]
        : req.params.supplier;
      if (!isSupportedSupplier(String(supplier))) {
        return res.status(400).json({
          error: "Unsupported supplier",
          supported: ["printful", "gelato", "cj"],
        });
      }

      const tenantId = req.user.tenantId;
      const limit = Number(req.body?.limit ?? req.query.limit ?? 24);
      const result = await syncSupplierCatalog({
        tenantId,
        supplier: supplier as SupportedSupplier,
        limit,
      });

      res.json({
        message: `${result.supplier} catalog synced`,
        supplier: result.supplier,
        syncedCount: result.syncedCount,
        products: result.products,
      });
    } catch (error) {
      console.error("[dropshipRoutes] Error syncing supplier catalog:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync supplier catalog",
      });
    }
  },
);

// GET /api/v1/dropship/suppliers/printful/catalog
router.get(
  "/suppliers/printful/catalog",
  authMiddleware,
  requirePro("Dropshipping"),
  async (req, res) => {
    try {
      const tenantId = req.user.tenantId;
      const limit = Number(req.query.limit ?? 12);
      const result = await syncPrintfulCatalogForTenant(tenantId, limit);
      res.json({
        supplier: result.supplier,
        products: result.products,
        syncedCount: result.syncedCount,
      });
    } catch (error) {
      console.error("[dropshipRoutes] Error fetching Printful catalog:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch Printful catalog",
      });
    }
  },
);

// GET /api/v1/dropship/suppliers/gelato/catalog
router.get(
  "/suppliers/gelato/catalog",
  authMiddleware,
  requirePro("Dropshipping"),
  async (req, res) => {
    try {
      const tenantId = req.user.tenantId;
      const limit = Number(req.query.limit ?? 12);
      const result = await syncGelatoCatalogForTenant(tenantId, limit);
      res.json({
        supplier: result.supplier,
        products: result.products,
        syncedCount: result.syncedCount,
      });
    } catch (error) {
      console.error("[dropshipRoutes] Error fetching Gelato catalog:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch Gelato catalog",
      });
    }
  },
);

// POST /api/v1/dropship/suppliers/printful/import/:productId
router.post(
  "/suppliers/printful/import/:productId",
  authMiddleware,
  requirePro("Dropshipping"),
  async (req, res) => {
    try {
      const tenantId = req.user.tenantId;
      const productId = Array.isArray(req.params.productId)
        ? req.params.productId[0]
        : req.params.productId;
      const product = await importPrintfulProductForTenant(
        String(productId),
        tenantId,
      );
      res.json({
        message: "Printful product imported into supplier catalog",
        product,
      });
    } catch (error) {
      console.error(
        "[dropshipRoutes] Error importing Printful product:",
        error,
      );
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to import Printful product",
      });
    }
  },
);

// GET /api/v1/dropship/orders — fulfillment queue
router.get("/orders", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId },
      select: { id: true },
    });
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    const orders = await db.orderItem.findMany({
      where: { product: { vendorId: vendor.id, fulfillmentType: "dropship" } },
      include: {
        order: { include: { user: { select: { name: true, email: true } } } },
        product: {
          include: {
            supplierProduct: {
              include: {
                supplier: { select: { name: true, contactEmail: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(orders);
  } catch (error) {
    console.error("[dropshipRoutes] Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// POST /api/v1/dropship/orders/:id/fulfill
router.post("/orders/:id/fulfill", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const orderItemId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const result = await autoFulfillDropOrder({
      orderItemId,
      tenantId,
    });

    res.json({ message: "Order sent to supplier", result });
  } catch (error) {
    console.error("[dropshipRoutes] Error fulfilling:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to record fulfillment",
    });
  }
});

// GET /api/v1/dropship/orders/:id/track
router.get("/orders/:id/track", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const orderItemId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const orderItem = await db.orderItem.findFirst({
      where: { id: orderItemId, tenantId },
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
            shippingName: true,
          },
        },
        product: {
          select: {
            name: true,
            supplierProduct: {
              include: {
                supplier: {
                  select: { name: true, contactEmail: true, website: true },
                },
              },
            },
          },
        },
      },
    });

    if (!orderItem) {
      return res.status(404).json({ error: "Dropship order item not found" });
    }

    res.json({
      id: orderItem.id,
      fulfillmentStatus: orderItem.fulfillmentStatus ?? "pending",
      trackingNumber: orderItem.trackingNumber,
      fulfilledAt: orderItem.fulfilledAt,
      order: orderItem.order,
      product: orderItem.product,
      supplier: orderItem.product.supplierProduct?.supplier ?? null,
    });
  } catch (error) {
    console.error("[dropshipRoutes] Error tracking order:", error);
    res.status(500).json({ error: "Failed to track order" });
  }
});

// POST /api/v1/dropship/calculate - Profit Calculator
router.post(
  "/calculate",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const {
      productCost,
      sellingPrice,
      shippingToCharge,
      supplierShipping,
      monthlySales,
      planCommission = 0.1, // 10% platform fee default
    } = req.body;

    // Apply plan-based commission rate
    const commissionRates = { FREE: 0.15, PRO: 0.1, ENTERPRISE: 0.08 };
    const commission =
      commissionRates[req.user.plan as keyof typeof commissionRates] || 0.1;

    const platformFee = sellingPrice * commission;
    const grossMargin = sellingPrice - productCost - supplierShipping;
    const netProfitPerSale = grossMargin - platformFee + shippingToCharge;
    const monthlyRevenue = sellingPrice * monthlySales;
    const monthlyProfit = netProfitPerSale * monthlySales;
    const marginPercent = (netProfitPerSale / sellingPrice) * 100;

    res.json({
      perSale: {
        revenue: sellingPrice,
        productCost,
        supplierShipping,
        platformFee: Math.round(platformFee * 100) / 100,
        grossMargin: Math.round(grossMargin * 100) / 100,
        netProfit: Math.round(netProfitPerSale * 100) / 100,
        marginPercent: Math.round(marginPercent * 10) / 10,
      },
      monthly: {
        revenue: Math.round(monthlyRevenue * 100) / 100,
        profit: Math.round(monthlyProfit * 100) / 100,
        units: monthlySales,
      },
      breakdown: {
        productCostPct: Math.round((productCost / sellingPrice) * 100),
        shippingPct: Math.round((supplierShipping / sellingPrice) * 100),
        platformFeePct: Math.round((platformFee / sellingPrice) * 100),
        yourProfitPct: Math.round((netProfitPerSale / sellingPrice) * 100),
      },
      commissionRate: commission,
      planAdvantage:
        req.user.plan === "FREE"
          ? `Upgrade to Pro: save ${((0.15 - 0.1) * sellingPrice * monthlySales).toFixed(2)}/month in platform fees`
          : null,
    });
  },
);

export default router;
