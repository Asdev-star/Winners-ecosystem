// Server/routes/productRoutes.ts — Product Management
// Phase 4: Winners Market - Product CRUD operations
// Phase 5: Cloudinary image uploads

import { Router, Request, Response } from "express";
import multer from "multer";
import { callAnthropicAndParseJson } from "../services/aiService.js";
import { uploadImage } from "../services/cloudinaryService.js";
import type { Prisma } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { productLimitMiddleware, imageLimitMiddleware } from "../middleware/marketPlanGate.js";
import db from "../db.js";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

const router = Router();

// Helper to extract string param
const getParam = (p: string | string[] | undefined): string => 
  Array.isArray(p) ? p[0] : (p || "");

interface ProductImageInput {
  url: string;
  alt?: string;
  position?: number;
  isPrimary?: boolean;
}

// GET /products - List products (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string || req.user?.tenantId;
    const { category, search, vendorId, page = "1", limit = "20" } = req.query;
    
    const where: Prisma.ProductWhereInput = { isActive: true, tenantId };
    
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
    const tenantId = req.headers["x-tenant-id"] as string || req.user?.tenantId;
    const id = getParam(req.params.id);

    const product = await db.product.findFirst({
      where: { id, tenantId },
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
      where: { id, tenantId },
      data: { viewCount: { increment: 1 } }
    });

    res.json(product);
  } catch (error) {
    console.error("[productRoutes] Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// POST /products - Create product (vendor only)
router.post("/", authMiddleware, productLimitMiddleware(), async (req: Request, res: Response) => {
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
    const productId = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0] || '';
    const product = await db.product.findFirst({
      where: { id: productId, vendorId: vendor.id, tenantId }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found or unauthorized" });
    }

    const updated = await db.product.update({
      where: { id: productId, tenantId },
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
    const id = req.params.id as string;

    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId }
    });

    if (!vendor) {
      return res.status(403).json({ error: "Vendor not found" });
    }

    const product = await db.product.findFirst({
      where: { id, vendorId: vendor.id, tenantId }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found or unauthorized" });
    }

    await db.product.update({
      where: { id, tenantId },
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
    const id = getParam(req.params.id);
    const images: ProductImageInput[] = Array.isArray(req.body)
      ? req.body
          .filter(
            (entry): entry is ProductImageInput =>
              typeof entry === "object" &&
              entry !== null &&
              typeof (entry as { url?: unknown }).url === "string"
          )
      : [];

    // Update product images // Array of { url, alt, position, isPrimary }

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
      data: images.map((img, idx: number) => ({
        tenantId,
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

// POST /products/:id/reviews - Submit a product review
router.post("/:id/reviews", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const productId = getParam(req.params.id);
    const { rating, title, content } = req.body;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const existing = await db.productReview.findFirst({
      where: { productId, userId }
    });

    if (existing) {
      return res.status(400).json({ error: "You have already reviewed this product" });
    }

    const product = await db.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const review = await db.productReview.create({
      data: {
        tenantId,
        productId,
        userId,
        rating: Number(rating),
        title: title || "",
        content: content || "",
        isApproved: true
      },
      include: {
        user: { select: { name: true } }
      }
    });

    res.status(201).json(review);
  } catch (error) {
    console.error("[productRoutes] Error creating review:", error);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// GET /products/:id/reviews - Get product reviews
router.get("/:id/reviews", async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string || req.user?.tenantId;
    const productId = getParam(req.params.id);
    const page = parseInt(getParam(req.query.page as string)) || 1;
    const limit = parseInt(getParam(req.query.limit as string)) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      db.productReview.findMany({
        where: { productId, tenantId, isApproved: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.productReview.count({ where: { productId, tenantId, isApproved: true } })
    ]);

    res.json({ reviews, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("[productRoutes] Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /products/generate-description - AI-powered product description generator (ATLAS)
router.post("/generate-description", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, category, keywords } = req.body;

    if (!name || !keywords) {
      return res.status(400).json({ error: "Product name and keywords are required" });
    }

    const prompt = `You are ATLAS, the Market Analyst for Winners Ecosystem. Your task is to generate a compelling product description for an e-commerce marketplace.

The target audience is ambitious professionals, entrepreneurs, and creators in African and diaspora markets. The tone should be aspirational, clear, and benefit-oriented.

PRODUCT DETAILS:
- Name: ${name}
- Category: ${category || 'General'}
- Keywords/Features: ${Array.isArray(keywords) ? keywords.join(', ') : keywords}

Generate a JSON response with the following structure. Do not include any preamble or markdown fences.
{
  "description": "A full, engaging product description (2-3 paragraphs). Use markdown for formatting (bolding, bullet points).",
  "metaTitle": "A concise, SEO-friendly title for the product page (50-60 characters).",
  "metaDescription": "A compelling summary for search engine results (150-160 characters)."
}`;

    const result = await callAnthropicAndParseJson(
      prompt,
      { model: "claude-sonnet-4-6", max_tokens: 1024 },
      {
        description: `## ${name}\n\nExplore the features of ${name}. A great choice for those interested in ${category}.`,
        metaTitle: name,
        metaDescription: `Discover ${name}, a top product in the ${category} category.`,
      }
    );

    res.json(result);
  } catch (error) {
    console.error("[productRoutes] Error generating description:", error);
    res.status(500).json({ error: "Failed to generate product description" });
  }
});

// POST /products/:id/images - Upload product images
router.post('/:id/images', authMiddleware, imageLimitMiddleware(), upload.array('images', 5), async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const files = req.files as Express.Multer.File[];
    
    if (!files?.length) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const { userId, tenantId } = req.user;

    // Verify vendor owns this product
    const product = await db.product.findFirst({
      where: { id: productId, tenantId },
      include: { vendor: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.vendor?.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }

    // Upload images to Cloudinary
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const result = await uploadImage(
          file.buffer,
          `market/products/${productId}`,
          { width: 1200 }
        );
        return {
          url: result.url,
          publicId: result.publicId
        };
      })
    );

    // Save to database
    const images = await db.productImage.createMany({
      data: uploaded.map((img, index) => ({
        productId,
        url: img.url,
        publicId: img.publicId,
        position: index,
        isPrimary: index === 0,
        tenantId
      }))
    });

    res.json({ 
      success: true, 
      count: images.count,
      images: uploaded.map(img => img.url) 
    });
  } catch (error) {
    console.error('[productRoutes] Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

export default router;
