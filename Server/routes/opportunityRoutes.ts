// Server/routes/opportunityRoutes.ts — Winners Community Opportunity Board API
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// GET /opportunities — List all opportunities
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { type, status, category } = req.query;
    const where: Record<string, unknown> = { tenantId: req.user!.tenantId };
    
    if (type) where.type = String(type);
    if (status) where.status = String(status);
    if (category) where.category = String(category);
    
    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(opportunities);
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    res.status(500).json({ error: "Failed to fetch opportunities" });
  }
});

// GET /opportunities/:id — Get single opportunity
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const oppId = String(req.params.id);
    const opportunity = await prisma.opportunity.findFirst({
      where: { id: oppId, tenantId: req.user!.tenantId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
    if (!opportunity) {
      res.status(404).json({ error: "Opportunity not found" });
      return;
    }
    res.json(opportunity);
  } catch (error) {
    console.error("Error fetching opportunity:", error);
    res.status(500).json({ error: "Failed to fetch opportunity" });
  }
});

// POST /opportunities — Create a new opportunity
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, type, budget, category, skills, location, expiresAt } = req.body;
    const opportunity = await prisma.opportunity.create({
      data: {
        title,
        description,
        type,
        budget,
        category,
        skills: skills ?? [],
        location,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId: req.user!.userId,
        tenantId: req.user!.tenantId,
        status: "ACTIVE",
      },
    });
    res.status(201).json(opportunity);
  } catch (error) {
    console.error("Error creating opportunity:", error);
    res.status(500).json({ error: "Failed to create opportunity" });
  }
});

// PATCH /opportunities/:id — Update opportunity
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const oppId = String(req.params.id);
    const { title, description, status, budget, skills, location, expiresAt } = req.body;
    const opportunity = await prisma.opportunity.updateMany({
      where: { id: oppId, userId: req.user!.userId },
      data: { 
        title, 
        description, 
        status, 
        budget, 
        skills, 
        location,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });
    if (opportunity.count === 0) {
      res.status(404).json({ error: "Opportunity not found or unauthorized" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating opportunity:", error);
    res.status(500).json({ error: "Failed to update opportunity" });
  }
});

// DELETE /opportunities/:id — Delete opportunity
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const oppId = String(req.params.id);
    await prisma.opportunity.deleteMany({
      where: { id: oppId, userId: req.user!.userId },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting opportunity:", error);
    res.status(500).json({ error: "Failed to delete opportunity" });
  }
});

export default router;
