// Phase 4G — Winners Market: Property Routes
// African property listings, investment guides, mortgage tools
// ATLAS AI supervisor integration

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireLayerAccess } from "../middleware/layerAccessMiddleware.js";
import { db } from "../db.js";

const router = Router();

// GET /properties - Get all property listings
router.get(
  "/",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const {
        type = "all", // buy, rent, invest, all
        location,
        minPrice,
        maxPrice,
        propertyType,
        bedrooms,
        limit = 20,
        offset = 0,
      } = req.query;

      const where: any = {
        tenantId: req.user!.tenantId,
        status: "active",
      };

      if (type !== "all") {
        if (type === "buy" || type === "invest") {
          where.listingType = "sale";
        } else if (type === "rent") {
          where.listingType = "rent";
        } else {
          where.listingType = type;
        }
      }
      if (location)
        where.location = { contains: location, mode: "insensitive" };
      if (minPrice) where.price = { ...where.price, gte: Number(minPrice) };
      if (maxPrice) where.price = { ...where.price, lte: Number(maxPrice) };
      if (propertyType) where.propertyType = propertyType;
      if (bedrooms) where.bedrooms = Number(bedrooms);

      const properties = await db.property.findMany({
        where,
        include: {
          agent: {
            select: { name: true, industry: true, bio: true, trustScore: true },
          },
          images: { orderBy: { position: "asc" } },
          _count: { select: { favorites: true, inquiries: true } },
        },
        orderBy: { createdAt: "desc" },
        take: Number(limit),
        skip: Number(offset),
      });

      res.json({ properties });
    } catch (error) {
      console.error("[propertyRoutes] Error fetching properties:", error);
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  },
);

// POST /properties - Create new property listing
router.post(
  "/",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const {
        title,
        description,
        price,
        listingType, // buy, rent, invest
        propertyType, // apartment, house, commercial, land
        location,
        bedrooms,
        bathrooms,
        squareFeet,
        features,
        images,
        virtualTourUrl,
        documents,
      } = req.body;

      const property = await db.property.create({
        data: {
          title,
          description,
          price: Number(price),
          listingType,
          propertyType,
          location,
          bedrooms: bedrooms ? Number(bedrooms) : null,
          bathrooms: bathrooms ? Number(bathrooms) : null,
          area: squareFeet ? Number(squareFeet) : null,
          areaUnit: squareFeet ? "sqft" : null,
          agentId: req.user!.userId,
          tenantId: req.user!.tenantId,
          status: "pending", // Requires admin approval
        },
        include: {
          agent: {
            select: { name: true, industry: true, bio: true, trustScore: true },
          },
        },
      });

      // Create property images
      if (images && images.length > 0) {
        await db.propertyImage.createMany({
          data: images.map((img: any, index: number) => ({
            propertyId: property.id,
            url: img.url,
            alt: img.alt || property.title,
            position: index,
            tenantId: req.user!.tenantId,
          })),
        });
      }

      res.status(201).json(property);
    } catch (error) {
      console.error("[propertyRoutes] Error creating property:", error);
      res.status(500).json({ error: "Failed to create property listing" });
    }
  },
);

// GET /properties/:id - Get property details
router.get(
  "/:id",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const propertyId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const property = await db.property.findFirst({
        where: { id: propertyId, tenantId: req.user!.tenantId },
        include: {
          agent: {
            select: {
              name: true,
              bio: true,
              industry: true,
              trustScore: true,
            },
          },
          images: { orderBy: { position: "asc" } },
          favorites: {
            where: { userId: req.user!.userId },
            select: { id: true },
          },
          _count: { select: { favorites: true, inquiries: true } },
        },
      });

      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      res.json(property);
    } catch (error) {
      console.error("[propertyRoutes] Error fetching property:", error);
      res.status(500).json({ error: "Failed to fetch property" });
    }
  },
);

// POST /properties/:id/favorite - Toggle favorite
router.post(
  "/:id/favorite",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const propertyId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const userId = req.user!.userId;

      const existing = await db.propertyFavorite.findFirst({
        where: { userId, propertyId },
      });

      if (existing) {
        await db.propertyFavorite.delete({
          where: { id: existing.id },
        });
        res.json({ favorited: false });
      } else {
        await db.propertyFavorite.create({
          data: {
            userId,
            propertyId,
            tenantId: req.user!.tenantId,
          },
        });
        res.json({ favorited: true });
      }
    } catch (error) {
      console.error("[propertyRoutes] Error toggling favorite:", error);
      res.status(500).json({ error: "Failed to update favorite" });
    }
  },
);

// POST /properties/:id/inquire - Submit inquiry
router.post(
  "/:id/inquire",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const { message, contactInfo } = req.body;

      const propertyId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const inquiry = await db.propertyInquiry.create({
        data: {
          propertyId,
          userId: req.user!.userId,
          message,
          contactInfo,
          tenantId: req.user!.tenantId,
        },
      });

      res.status(201).json(inquiry);
    } catch (error) {
      console.error("[propertyRoutes] Error creating inquiry:", error);
      res.status(500).json({ error: "Failed to submit inquiry" });
    }
  },
);

// GET /properties/:id/inquiries - Get property inquiries (agent/owner only)
router.get(
  "/:id/inquiries",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const propertyId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const property = await db.property.findFirst({
        where: { id: propertyId, tenantId: req.user!.tenantId },
        select: { agentId: true },
      });

      if (!property || property.agentId !== req.user!.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const inquiries = await db.propertyInquiry.findMany({
        where: { propertyId },
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ inquiries });
    } catch (error) {
      console.error("[propertyRoutes] Error fetching inquiries:", error);
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  },
);

// PUT /properties/:id - Update property (agent/owner only)
router.put(
  "/:id",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const propertyId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const property = await db.property.findFirst({
        where: { id: propertyId, tenantId: req.user!.tenantId },
        select: { agentId: true },
      });

      if (!property || property.agentId !== req.user!.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedProperty = await db.property.update({
        where: {
          id: Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
        },
        data: req.body,
        include: {
          agent: {
            select: { name: true, bio: true, industry: true, trustScore: true },
          },
          images: { orderBy: { position: "asc" } },
        },
      });

      res.json(updatedProperty);
    } catch (error) {
      console.error("[propertyRoutes] Error updating property:", error);
      res.status(500).json({ error: "Failed to update property" });
    }
  },
);

// DELETE /properties/:id - Delete property (agent/owner only)
router.delete(
  "/:id",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const propertyId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const property = await db.property.findFirst({
        where: { id: propertyId, tenantId: req.user!.tenantId },
        select: { agentId: true },
      });

      if (!property || property.agentId !== req.user!.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await db.property.delete({
        where: { id: propertyId },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[propertyRoutes] Error deleting property:", error);
      res.status(500).json({ error: "Failed to delete property" });
    }
  },
);

// GET /properties/agents - Get property agents
router.get(
  "/agents/list",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const agents = await db.user.findMany({
        where: {
          tenantId: req.user!.tenantId,
          propertiesListed: { some: { status: "active" } },
        },
        select: {
          id: true,
          name: true,
          bio: true,
          industry: true,
          trustScore: true,
          _count: {
            select: { propertiesListed: { where: { status: "active" } } },
          },
        },
      });

      res.json({ agents });
    } catch (error) {
      console.error("[propertyRoutes] Error fetching agents:", error);
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  },
);

export default router;
