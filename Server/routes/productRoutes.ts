// Server/routes/productRoutes.ts — Product Management
// Phase 4: Winners Market - Product CRUD operations

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

// Helper to extract string param
const getParam = (p: string | string[] | undefined): string => 
  Array.isArray(p) ? p[0] : (p || "");

// GET /products - List products (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, search, vendorId, page = "1", limit = "20" } = req.query;
    
    const where: any = { isActive: true };
    
    if (category) where.category = String(category);
    if (vendorId) where.vendorId = String(vendorId);
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          vendor: {
            select: { storeName: true, trustScore: true, verified: true }
          },
          images: { orderBy: { position: "asc" }, take: 1 },
          variants: { where: { isActive: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit)
      }),
      db.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("[productRoutes] Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /products/:id - Get single product
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);

    const product = await db.product.findUnique({
      where: { id },
      include: {
        vendor: {
          select: { 
            id: true, storeName: true, storeSlug: true, 
            trustScore: true, verified: true, totalSales: true 
          }
        },
        images: { orderBy: { position: "asc" } },
        variants: { where: { isActive: true } },
        reviews: {
          where: { isApproved: true },
          include: {
            user: { select: { name: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 10
        },
        _count: { select: { reviews: true } }
      }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Increment view count
    await db.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    res.json(product);
  } catch (error) {
    console.error("[productRoutes] Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// POST /products - Create product (vendor only)
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { 
      name, slug, description, price, comparePrice, costPrice, sku,
      category, subcategory, tags, brand, weight, weightUnit,
      isDigital, stockQuantity, lowStockAlert, allowBackorder,
      shippingType, freeShipping, shippingPrice, taxRate,
      metaTitle, metaDescription
    } = req.body;

    // Get user's vendor
    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId, status: "APPROVED" }
    });

    if (!vendor) {
      return res.status(403).json({ error: "Approved vendor required to create products" });
    }

    // Check slug uniqueness
    const existing = await db.product.findUnique({
      where: { tenantId_slug: { tenantId, slug } }
    });

    if (existing) {
      return res.status(400).json({ error: "Product slug already exists" });
    }

    const product = await db.product.create({
      data: {
        tenantId,
        vendorId: vendor.id,
        name, slug, description, price, comparePrice, costPrice, sku,
        category, subcategory, tags: tags || [], brand, weight, weightUnit,
        isDigital: isDigital || false, stockQuantity: stockQuantity || 0,
        lowStockAlert: lowStockAlert || 10, allowBackorder: allowBackorder || false,
        shippingType, freeShipping: freeShipping || false, shippingPrice, taxRate,
        metaTitle, metaDescription
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("[productRoutes] Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// PUT /products/:id - Update product
router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const updateData = req.body;

    // Get user's vendor
    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId }
    });

    if (!vendor) {
      return res.status(403).json({ error: "Vendor not found" });
    }

    // Verify ownership
    const product = await db.product.findFirst({
      where: { id, vendorId: vendor.id }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found or unauthorized" });
    }

    const updated = await db.product.update({
      where: { id },
      data: updateData
    });

    res.json(updated);
  } catch (error) {
    console.error("[productRoutes] Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE /products/:id - Delete product
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId }
    });

    if (!vendor) {
      return res.status(403).json({ error: "Vendor not found" });
    }

    const product = await db.product.findFirst({
      where: { id, vendorId: vendor.id }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found or unauthorized" });
    }

    await db.product.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("[productRoutes] Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// POST /products/:id/images - Add product images
router.post("/:id/images", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const { images } = req.body; // Array of { url, alt, position, isPrimary }

    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId }
    });

    if (!vendor) {
      return res.status(403).json({ error: "Vendor not found" });
    }

    const product = await db.product.findFirst({
      where: { id, vendorId: vendor.id }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const createdImages = await db.productImage.createMany({
      data: images.map((img: any, idx: number) => ({
        productId: id,
        url: img.url,
        alt: img.alt,
        position: img.position ?? idx,
        isPrimary: img.isPrimary ?? idx === 0
      }))
    });

    res.status(201).json(createdImages);
  } catch (error) {
    console.error("[productRoutes] Error adding images:", error);
    res.status(500).json({ error: "Failed to add images" });
  }
});

export default router;
