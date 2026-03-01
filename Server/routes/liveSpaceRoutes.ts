// Server/routes/liveSpaceRoutes.ts
// Phase 2 V1.4: Live Spaces - Twitter Spaces-style audio rooms

import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

// ─── GET /spaces — list live spaces ─────────────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const status = req.query.status as string | undefined;
  
  try {
    const where: any = { tenantId };
    if (status) where.status = status;
    
    const spaces = await db.liveSpace.findMany({
      where,
      orderBy: [{ status: "asc" }, { scheduledAt: "asc" }],
      include: {
        host: { select: { id: true, name: true, email: true } },
        _count: { select: { participants: true, speakers: true } },
      },
    });
    
    res.json({ spaces });
  } catch (err: any) {
    console.error("Get spaces error:", err);
    res.status(500).json({ error: "Failed to get spaces" });
  }
});

// ─── GET /spaces/:id — get space details ───────────────────────────────────

router.get("/:id", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.userId;
  const spaceId = String(req.params.id);
  
  try {
    const space = await db.liveSpace.findFirst({
      where: { id: spaceId, tenantId },
      include: {
        host: { select: { id: true, name: true, email: true } },
        participants: {
          where: { leftAt: null },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        speakers: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    
    if (!space) {
      return res.status(404).json({ error: "Space not found" });
    }
    
    // Check if current user is participant
    const isParticipant = space.participants.some(p => p.userId === userId);
    const isSpeaker = space.speakers.some(s => s.userId === userId);
    const isHost = space.hostId === userId;
    
    res.json({ 
      space,
      participation: { isParticipant, isSpeaker, isHost }
    });
  } catch (err: any) {
    console.error("Get space error:", err);
    res.status(500).json({ error: "Failed to get space" });
  }
});

// ─── POST /spaces — create a new space ─────────────────────────────────────

router.post("/", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const hostId = req.user!.userId;
  const { title, description, scheduledAt, maxSpeakers, maxListeners, isRecorded } = req.body;
  
  if (!title?.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }
  
  try {
    const space = await db.liveSpace.create({
      data: {
        tenantId,
        hostId,
        title: title.trim(),
        description: description?.trim(),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        maxSpeakers: maxSpeakers || 6,
        maxListeners: maxListeners || 500,
        isRecorded: isRecorded || false,
        status: scheduledAt ? "SCHEDULED" : "LIVE",
      },
      include: {
        host: { select: { id: true, name: true, email: true } },
      },
    });
    
    // Auto-join host as participant
    await db.liveSpaceParticipant.create({
      data: {
        spaceId: space.id,
        userId: hostId,
        role: "HOST",
      },
    });
    
    // Add host as speaker
    await db.liveSpaceSpeaker.create({
      data: {
        spaceId: space.id,
        userId: hostId,
      },
    });
    
    res.status(201).json({ space });
  } catch (err: any) {
    console.error("Create space error:", err);
    res.status(500).json({ error: "Failed to create space" });
  }
});

// ─── POST /spaces/:id/start — start a live space ───────────────────────────

router.post("/:id/start", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.userId;
  const spaceId = String(req.params.id);
  
  try {
    const space = await db.liveSpace.findFirst({
      where: { id: spaceId, tenantId, hostId: userId },
    });
    
    if (!space) {
      return res.status(404).json({ error: "Space not found or unauthorized" });
    }
    
    if (space.status === "LIVE") {
      return res.status(400).json({ error: "Space is already live" });
    }
    
    const updatedSpace = await db.liveSpace.update({
      where: { id: spaceId },
      data: {
        status: "LIVE",
        startedAt: new Date(),
      },
    });
    
    res.json({ space: updatedSpace });
  } catch (err: any) {
    console.error("Start space error:", err);
    res.status(500).json({ error: "Failed to start space" });
  }
});

// ─── POST /spaces/:id/end — end a live space ───────────────────────────────

router.post("/:id/end", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.userId;
  const spaceId = String(req.params.id);
  
  try {
    const space = await db.liveSpace.findFirst({
      where: { id: spaceId, tenantId, hostId: userId },
    });
    
    if (!space) {
      return res.status(404).json({ error: "Space not found or unauthorized" });
    }
    
    const updatedSpace = await db.liveSpace.update({
      where: { id: spaceId },
      data: {
        status: "ENDED",
        endedAt: new Date(),
      },
    });
    
    // Mark all participants as left
    await db.liveSpaceParticipant.updateMany({
      where: { spaceId, leftAt: null },
      data: { leftAt: new Date() },
    });
    
    res.json({ space: updatedSpace });
  } catch (err: any) {
    console.error("End space error:", err);
    res.status(500).json({ error: "Failed to end space" });
  }
});

// ─── POST /spaces/:id/join — join a space ───────────────────────────────────

router.post("/:id/join", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.userId;
  const spaceId = String(req.params.id);
  const { role } = req.body; // "LISTENER" or "SPEAKER"
  
  try {
    const space = await db.liveSpace.findFirst({
      where: { id: spaceId, tenantId, status: "LIVE" },
      include: { _count: { select: { speakers: true, participants: true } } },
    });
    
    if (!space) {
      return res.status(404).json({ error: "Space not found or not live" });
    }
    
    // Check if already joined
    const existing = await db.liveSpaceParticipant.findUnique({
      where: { spaceId_userId: { spaceId, userId } },
    });
    
    if (existing && !existing.leftAt) {
      return res.status(400).json({ error: "Already in this space" });
    }
    
    // For speaker role, check capacity
    if (role === "SPEAKER" && space._count.speakers >= space.maxSpeakers) {
      return res.status(400).json({ error: "Speaker limit reached" });
    }
    
    // Check listener capacity
    if (space._count.participants >= space.maxListeners) {
      return res.status(400).json({ error: "Space is full" });
    }
    
    const participant = await db.liveSpaceParticipant.upsert({
      where: { spaceId_userId: { spaceId, userId } },
      create: {
        spaceId,
        userId,
        role: role === "SPEAKER" ? "SPEAKER" : "LISTENER",
      },
      update: {
        role: role === "SPEAKER" ? "SPEAKER" : "LISTENER",
        leftAt: null,
        joinedAt: new Date(),
      },
    });
    
    // If requesting speaker, add to speakers table
    if (role === "SPEAKER") {
      await db.liveSpaceSpeaker.upsert({
        where: { spaceId_userId: { spaceId, userId } },
        create: { spaceId, userId },
        update: {},
      });
    }
    
    res.json({ participant });
  } catch (err: any) {
    console.error("Join space error:", err);
    res.status(500).json({ error: "Failed to join space" });
  }
});

// ─── POST /spaces/:id/leave — leave a space ─────────────────────────────────

router.post("/:id/leave", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.userId;
  const spaceId = String(req.params.id);
  
  try {
    const space = await db.liveSpace.findFirst({
      where: { id: spaceId, tenantId },
    });
    
    if (!space) {
      return res.status(404).json({ error: "Space not found" });
    }
    
    // Host cannot leave
    if (space.hostId === userId) {
      return res.status(400).json({ error: "Host cannot leave. End the space instead." });
    }
    
    await db.liveSpaceParticipant.update({
      where: { spaceId_userId: { spaceId, userId } },
      data: { leftAt: new Date() },
    });
    
    await db.liveSpaceSpeaker.deleteMany({
      where: { spaceId, userId },
    });
    
    res.json({ success: true });
  } catch (err: any) {
    console.error("Leave space error:", err);
    res.status(500).json({ error: "Failed to leave space" });
  }
});

// ─── POST /spaces/:id/invite — invite a user to speak ───────────────────────

router.post("/:id/invite", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const hostId = req.user!.userId;
  const spaceId = String(req.params.id);
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
  
  try {
    const space = await db.liveSpace.findFirst({
      where: { id: spaceId, tenantId, hostId },
    });
    
    if (!space) {
      return res.status(404).json({ error: "Space not found or unauthorized" });
    }
    
    // Add to speakers with invited flag
    const speaker = await db.liveSpaceSpeaker.upsert({
      where: { spaceId_userId: { spaceId, userId } },
      create: { spaceId, userId, isInvited: true },
      update: { isInvited: true },
    });
    
    // Update participant role
    await db.liveSpaceParticipant.upsert({
      where: { spaceId_userId: { spaceId, userId } },
      create: { spaceId, userId, role: "SPEAKER" },
      update: { role: "SPEAKER" },
    });
    
    res.json({ speaker });
  } catch (err: any) {
    console.error("Invite speaker error:", err);
    res.status(500).json({ error: "Failed to invite speaker" });
  }
});

// ─── DELETE /spaces/:id — delete a space ─────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.userId;
  const spaceId = String(req.params.id);
  
  try {
    const space = await db.liveSpace.findFirst({
      where: { id: spaceId, tenantId, hostId: userId },
    });
    
    if (!space) {
      return res.status(404).json({ error: "Space not found or unauthorized" });
    }
    
    await db.liveSpace.delete({
      where: { id: spaceId },
    });
    
    res.json({ success: true });
  } catch (err: any) {
    console.error("Delete space error:", err);
    res.status(500).json({ error: "Failed to delete space" });
  }
});

export default router;
