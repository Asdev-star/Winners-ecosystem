// server/routes/opportunityRoutes.ts

import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

// ─── GET /opportunities — list opportunities ────────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  const { type, category, skills, location, search } = req.query;
  const tenantId = req.user!.tenantId;

  try {
    const where: any = {
      tenantId,
      status: "ACTIVE",
    };

    if (type) where.type = type;
    if (category) where.category = category;
    if (location)
      where.location = { contains: location as string, mode: "insensitive" };

    if (skills) {
      const skillList = (skills as string).split(",").map((s) => s.trim());
      where.skills = { hasSome: skillList };
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const opportunities = await db.opportunity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            country: true,
            city: true,
            industry: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return res.json({ opportunities });
  } catch (err) {
    console.error("Opportunities fetch error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /opportunities/:id — get single opportunity ─────────────────────────────

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const opportunity = await db.opportunity.findFirst({
      where: { id, tenantId: req.user!.tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            country: true,
            city: true,
            industry: true,
            bio: true,
          },
        },
      },
    });

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    return res.json({ opportunity });
  } catch (err) {
    console.error("Opportunity fetch error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /opportunities — create opportunity ───────────────────────────────────

router.post("/", async (req: Request, res: Response) => {
  const {
    title,
    description,
    type,
    category,
    budget,
    skills,
    location,
    expiresAt,
  } = req.body;

  if (!title || !description || !type || !category) {
    return res
      .status(400)
      .json({ message: "title, description, type, and category are required" });
  }

  try {
    const opportunity = await db.opportunity.create({
      data: {
        tenantId: req.user!.tenantId,
        userId: req.user!.userId,
        title,
        description,
        type,
        category,
        budget,
        skills: skills || [],
        location,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return res.status(201).json({ opportunity });
  } catch (err) {
    console.error("Opportunity create error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── PATCH /opportunities/:id — update opportunity ─────────────────────────────

router.patch("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    title,
    description,
    type,
    category,
    budget,
    skills,
    location,
    status,
    expiresAt,
  } = req.body;

  try {
    const existing = await db.opportunity.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ message: "Opportunity not found or not authorized" });
    }

    const opportunity = await db.opportunity.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(type && { type }),
        ...(category && { category }),
        ...(budget !== undefined && { budget }),
        ...(skills && { skills }),
        ...(location !== undefined && { location }),
        ...(status && { status }),
        ...(expiresAt !== undefined && {
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        }),
      },
    });

    return res.json({ opportunity });
  } catch (err) {
    console.error("Opportunity update error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── DELETE /opportunities/:id — delete opportunity ─────────────────────────────

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existing = await db.opportunity.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ message: "Opportunity not found or not authorized" });
    }

    await db.opportunity.delete({ where: { id } });

    return res.json({ message: "Opportunity deleted" });
  } catch (err) {
    console.error("Opportunity delete error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /opportunities/my/list — user's own opportunities ─────────────────────────

router.get("/my/list", async (req: Request, res: Response) => {
  try {
    const opportunities = await db.opportunity.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ opportunities });
  } catch (err) {
    console.error("My opportunities fetch error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
