// Phase 4: Dropshipping Routes
// Phase 6: Plan-gated - dropshipping requires PRO
import { Router, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requirePro } from "../middleware/marketPlanGate.js";
import db from "../db.js";

const router = Router();

// GET /api/v1/dropship/catalog - Requires PRO plan
router.get("/catalog", authMiddleware, requirePro('Dropshipping'), async (req, res) => {
  try {
    const { category, search, page = 1, limit = 24, sortBy = "atlasScore" } = req.query;
    const tenantId = req.user.tenantId;
    
    const where: Record<string, unknown> = { tenantId, isActive: true };
    if (category) where.category = String(category);
    if (search) where.title = { contains: String(search), mode: "insensitive" };

    const orderBy: Record<string, string> =
      sortBy === "atlasScore" ? { atlasScore: "desc" } :
      sortBy === "price_asc" ? { costPrice: "asc" } :
      sortBy === "price_desc" ? { costPrice: "desc" } :
      { createdAt: "desc" };

    const [products, total] = await Promise.all([
      db.supplierProduct.findMany({
        where,
        orderBy,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: { supplier: { select: { name: true, rating: true, origin: true } } }
      }),
      db.supplierProduct.count({ where })
    ]);

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error("[dropshipRoutes] Error fetching catalog:", error);
    res.status(500).json({ error: "Failed to fetch catalog" });
  }
});

// POST /api/v1/dropship/import
router.post("/import", authMiddleware, async (req, res) => {
  try {
    const { supplierProductId, retailPrice, title, description } = req.body;
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    const vendor = await db.vendor.findFirst({ where: { userId, tenantId } });
    if (!vendor) return res.status(403).json({ error: "Vendor profile required", code: "NOT_A_VENDOR" });

    const supplierProduct = await db.supplierProduct.findUnique({ where: { id: supplierProductId } });
    if (!supplierProduct) return res.status(404).json({ error: "Supplier product not found" });

    const existing = await db.product.findFirst({ where: { vendorId: vendor.id, sourceSupplierProductId: supplierProductId } });
    if (existing) return res.status(409).json({ error: "Already imported", productId: existing.id });

    const product = await db.product.create({
      data: {
        vendorId: vendor.id,
        tenantId,
        name: title || supplierProduct.title,
        slug: (title || supplierProduct.title).toLowerCase().replace(/\s+/g, "-"),
        description: description || supplierProduct.description,
        price: retailPrice || supplierProduct.suggestedRetail,
        costPrice: supplierProduct.costPrice,
        category: supplierProduct.category,
        tags: supplierProduct.tags,
        fulfillmentType: "dropship",
        sourceSupplierProductId: supplierProductId,
        supplierId: supplierProduct.supplierId
      }
    });

    res.json({ product, message: "Product imported — review and publish when ready" });
  } catch (error) {
    console.error("[dropshipRoutes] Error importing:", error);
    res.status(500).json({ error: "Failed to import product" });
  }
});

// GET /api/v1/dropship/orders — fulfillment queue
router.get("/orders", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    const vendor = await db.vendor.findFirst({ where: { userId, tenantId }, select: { id: true } });
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    const orders = await db.orderItem.findMany({
      where: { product: { vendorId: vendor.id, fulfillmentType: "dropship" } },
      include: {
        order: { include: { user: { select: { name: true, email: true } } } },
        product: { include: { supplierProduct: { include: { supplier: { select: { name: true, contactEmail: true } } } } } }
      },
      orderBy: { createdAt: "desc" }
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
    const { trackingNumber } = req.body;
    const tenantId = req.user.tenantId;
    const orderItemId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    await db.orderItem.update({
      where: { id_tenantId: { id: orderItemId, tenantId } },
      data: {
        fulfillmentStatus: "sent_to_supplier",
        trackingNumber: trackingNumber || null,
        fulfilledAt: new Date()
      }
    });

    res.json({ message: "Fulfillment recorded" });
  } catch (error) {
    console.error("[dropshipRoutes] Error fulfilling:", error);
    res.status(500).json({ error: "Failed to record fulfillment" });
  }
});

export default router;
