// Server/routes/liveSpaceRoutes.ts — Winners Community Live Spaces API
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

// GET /spaces — List all live spaces
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const where: any = { tenantId: req.user!.tenantId };
    if (status) where.status = status;
    
    const spaces = await db.liveSpace.findMany({
      where,
      include: {
        host: { select: { id: true, name: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(spaces);
  } catch (error) {
    console.error("Error fetching live spaces:", error);
    res.status(500).json({ error: "Failed to fetch live spaces" });
  }
});

// GET /spaces/:id — Get single live space
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const spaceId = String(req.params.id);
    const space = await db.liveSpace.findFirst({
      where: { id: spaceId, tenantId: req.user!.tenantId },
      include: {
        host: { select: { id: true, name: true } },
        participants: true,
        speakers: true,
      },
    });
    if (!space) {
      res.status(404).json({ error: "Live space not found" });
      return;
    }
    res.json(space);
  } catch (error) {
    console.error("Error fetching live space:", error);
    res.status(500).json({ error: "Failed to fetch live space" });
  }
});

// POST /spaces — Create a new live space
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, scheduledAt, maxSpeakers, maxListeners, isRecorded } = req.body;
    const space = await db.liveSpace.create({
      data: {
        title,
        description,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        maxSpeakers: maxSpeakers ?? 6,
        maxListeners: maxListeners ?? 500,
        isRecorded: isRecorded ?? false,
        hostId: req.user!.userId,
        tenantId: req.user!.tenantId,
        status: "SCHEDULED",
      },
    });
    res.status(201).json(space);
  } catch (error) {
    console.error("Error creating live space:", error);
    res.status(500).json({ error: "Failed to create live space" });
  }
});

// PATCH /spaces/:id — Update live space
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const spaceId = String(req.params.id);
    const { title, description, status, scheduledAt } = req.body;
    const space = await db.liveSpace.updateMany({
      where: { id: spaceId, hostId: req.user!.userId },
      data: { title, description, status, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined },
    });
    if (space.count === 0) {
      res.status(404).json({ error: "Live space not found or unauthorized" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating live space:", error);
    res.status(500).json({ error: "Failed to update live space" });
  }
});

// DELETE /spaces/:id — Delete live space
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const spaceId = String(req.params.id);
    await db.liveSpace.deleteMany({
      where: { id: spaceId, hostId: req.user!.userId },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting live space:", error);
    res.status(500).json({ error: "Failed to delete live space" });
  }
});

// POST /spaces/:id/join — Join a live space
router.post("/:id/join", authMiddleware, async (req, res) => {
  try {
    const spaceId = String(req.params.id);
    await db.liveSpaceParticipant.create({
      data: {
        spaceId,
        userId: req.user!.userId,
        role: "LISTENER",
      },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error joining live space:", error);
    res.status(500).json({ error: "Failed to join live space" });
  }
});

// POST /spaces/:id/leave — Leave a live space
router.post("/:id/leave", authMiddleware, async (req, res) => {
  try {
    const spaceId = String(req.params.id);
    await db.liveSpaceParticipant.deleteMany({
      where: { spaceId, userId: req.user!.userId },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error leaving live space:", error);
    res.status(500).json({ error: "Failed to leave live space" });
  }
});

export default router;
