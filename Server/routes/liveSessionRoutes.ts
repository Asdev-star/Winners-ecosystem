// Phase 3 — Winners Academy — liveSessionRoutes.ts
// Live session routes for Academy live cohorts

import { Router, Request, Response } from "express";
import db from "../db.js";
const prisma = db;

const router = Router();

// GET /live-sessions - List all live sessions (for learners)
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await prisma.liveSession.findMany({
      where: {
        status: "scheduled",
        scheduledAt: { gte: new Date() },
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        _count: {
          select: { attendees: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    res.json({ sessions });
  } catch (error) {
    console.error("Error fetching live sessions:", error);
    res.status(500).json({ error: "Failed to fetch live sessions" });
  }
});

// GET /live-sessions/my-sessions - Get user's enrolled sessions
router.get("/my-sessions", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;

    const sessions = await prisma.liveSession.findMany({
      where: {
        tenantId,
        attendees: {
          some: { userId },
        },
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        attendees: {
          where: { userId },
          select: { joinedAt: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    res.json({ sessions });
  } catch (error) {
    console.error("Error fetching user sessions:", error);
    res.status(500).json({ error: "Failed to fetch user sessions" });
  }
});

// GET /live-sessions/:id - Get single session details
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.userId;

    const session = await prisma.liveSession.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            bio: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
          },
        },
        attendees: {
          select: {
            userId: true,
            joinedAt: true,
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
          take: 50,
        },
        _count: {
          select: { attendees: true },
        },
      },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const isAttending = session.attendees.some((a) => a.userId === userId);
    const isHost = session.hostId === userId;

    res.json({ session, isAttending, isHost });
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// POST /live-sessions - Create a new live session (instructors only)
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { title, description, courseId, scheduledAt, durationMin, maxParticipants, sessionType } = req.body;

    if (!title || !scheduledAt || !durationMin) {
      res.status(400).json({ error: "Title, scheduledAt, and durationMin are required" });
      return;
    }

    if (courseId) {
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          instructorId: userId,
          tenantId,
        },
      });

      if (!course) {
        res.status(403).json({ error: "You are not the instructor for this course" });
        return;
      }
    }

    const session = await prisma.liveSession.create({
      data: {
        tenantId,
        title,
        description,
        courseId,
        hostId: userId,
        scheduledAt: new Date(scheduledAt),
        durationMin,
        maxParticipants: maxParticipants || 100,
        status: "scheduled",
        sessionType: sessionType || "workshop",
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    res.status(201).json({ session });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// PUT /live-sessions/:id - Update session (host only)
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.userId;
    const { title, description, scheduledAt, durationMin, maxParticipants, status } = req.body;

    const existing = await prisma.liveSession.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (existing.hostId !== userId) {
      res.status(403).json({ error: "Not authorized to update this session" });
      return;
    }

    const session = await prisma.liveSession.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(durationMin && { durationMin }),
        ...(maxParticipants && { maxParticipants }),
        ...(status && { status }),
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    res.json({ session });
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({ error: "Failed to update session" });
  }
});

// POST /live-sessions/:id/join - Join a live session
router.post("/:id/join", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;

    const session = await prisma.liveSession.findUnique({
      where: { id },
      include: {
        _count: { select: { attendees: true } },
      },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (session.status !== "scheduled" && session.status !== "live") {
      res.status(400).json({ error: "Session is not available for joining" });
      return;
    }

    if (session.maxParticipants && session._count.attendees >= session.maxParticipants) {
      res.status(400).json({ error: "Session is full" });
      return;
    }

    const existingAttendee = await prisma.liveSessionAttendee.findFirst({
      where: {
        sessionId: id,
        userId,
      },
    });

    if (existingAttendee) {
      res.status(400).json({ error: "Already attending this session" });
      return;
    }

    await prisma.liveSessionAttendee.create({
      data: {
        sessionId: id,
        userId,
        tenantId,
        joinedAt: new Date(),
      },
    });

    if (session.status === "scheduled") {
      await prisma.liveSession.update({
        where: { id },
        data: { status: "live" },
      });
    }

    res.json({ success: true, message: "Successfully joined session" });
  } catch (error) {
    console.error("Error joining session:", error);
    res.status(500).json({ error: "Failed to join session" });
  }
});

// POST /live-sessions/:id/leave - Leave a live session
router.post("/:id/leave", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.userId;

    const existing = await prisma.liveSessionAttendee.findFirst({
      where: {
        sessionId: id,
        userId,
      },
    });

    if (!existing) {
      res.status(400).json({ error: "Not attending this session" });
      return;
    }

    await prisma.liveSessionAttendee.delete({
      where: { id: existing.id },
    });

    res.json({ success: true, message: "Successfully left session" });
  } catch (error) {
    console.error("Error leaving session:", error);
    res.status(500).json({ error: "Failed to leave session" });
  }
});

// DELETE /live-sessions/:id - Delete session (host only)
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.userId;

    const existing = await prisma.liveSession.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (existing.hostId !== userId) {
      res.status(403).json({ error: "Not authorized to delete this session" });
      return;
    }

    await prisma.liveSessionAttendee.deleteMany({
      where: { sessionId: id },
    });

    await prisma.liveSession.delete({
      where: { id },
    });

    res.json({ success: true, message: "Session deleted" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

export default router;
