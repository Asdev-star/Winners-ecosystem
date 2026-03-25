// Server/routes/opportunityRoutes.ts — Winners Community Opportunity Board API
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

// GET /opportunities — List all opportunities
router.get("/", authMiddleware, async (req, res) => {
  try {
    const opportunities = await db.opportunity.findMany({
      where: { tenantId: req.user!.tenantId },
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
    const opportunityId = String(req.params.id);
    const opportunity = await db.opportunity.findFirst({
      where: { id: opportunityId, tenantId: req.user!.tenantId },
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
    const { title, description, type, category, budget, location, skills } = req.body;
    const opportunity = await db.opportunity.create({
      data: {
        title,
        description,
        type,
        category,
        budget,
        location,
        skills: skills || [],
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
    const opportunityId = String(req.params.id);
    const { title, description, status, budget } = req.body;
    const opportunity = await db.opportunity.updateMany({
      where: { id: opportunityId, userId: req.user!.userId },
      data: { title, description, status, budget },
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
    const opportunityId = String(req.params.id);
    await db.opportunity.deleteMany({
      where: { id: opportunityId, userId: req.user!.userId },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting opportunity:", error);
    res.status(500).json({ error: "Failed to delete opportunity" });
  }
});

export default router;
