// Phase 3 — Winners Academy — liveSessionRoutes.ts
// Live session routes for Academy live cohorts

import { Router, Request, Response } from "express";
import { prisma } from "../db.js";

const router = Router();

// GET /live-sessions - List all live sessions (for learners)
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await prisma.liveSession.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: new Date() },
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
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
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
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
    const { id } = req.params;
    const userId = req.user!.userId;

    const session = await prisma.liveSession.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
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
                avatar: true,
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
    const isInstructor = session.instructorId === userId;

    res.json({ session, isAttending, isInstructor });
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
    const { title, description, courseId, scheduledAt, duration, maxAttendees, isPaid, price } = req.body;

    // Validate required fields
    if (!title || !scheduledAt || !duration) {
      res.status(400).json({ error: "Title, scheduledAt, and duration are required" });
      return;
    }

    // Check if user is an instructor for this course
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
        instructorId: userId,
        scheduledAt: new Date(scheduledAt),
        duration,
        maxAttendees: maxAttendees || 100,
        status: "SCHEDULED",
        isPaid: isPaid || false,
        price: price || 0,
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
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

// PUT /live-sessions/:id - Update session (instructor only)
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { title, description, scheduledAt, duration, maxAttendees, status } = req.body;

    const existing = await prisma.liveSession.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (existing.instructorId !== userId) {
      res.status(403).json({ error: "Not authorized to update this session" });
      return;
    }

    const session = await prisma.liveSession.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(duration && { duration }),
        ...(maxAttendees && { maxAttendees }),
        ...(status && { status }),
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
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
    const { id } = req.params;
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

    if (session.status !== "SCHEDULED" && session.status !== "LIVE") {
      res.status(400).json({ error: "Session is not available for joining" });
      return;
    }

    if (session.maxAttendees && session._count.attendees >= session.maxAttendees) {
      res.status(400).json({ error: "Session is full" });
      return;
    }

    // Check if already attending
    const existing = await prisma.liveSessionAttendee.findFirst({
      where: {
        sessionId: id,
        userId,
      },
    });

    if (existing) {
      res.status(400).json({ error: "Already attending this session" });
      return;
    }

    // Create attendance record
    await prisma.liveSessionAttendee.create({
      data: {
        sessionId: id,
        userId,
        tenantId,
        joinedAt: new Date(),
      },
    });

    // Update session status to LIVE if it was scheduled
    if (session.status === "SCHEDULED") {
      await prisma.liveSession.update({
        where: { id },
        data: { status: "LIVE" },
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
    const { id } = req.params;
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

// DELETE /live-sessions/:id - Delete session (instructor only)
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const existing = await prisma.liveSession.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (existing.instructorId !== userId) {
      res.status(403).json({ error: "Not authorized to delete this session" });
      return;
    }

    // Delete all attendees first
    await prisma.liveSessionAttendee.deleteMany({
      where: { sessionId: id },
    });

    // Delete the session
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