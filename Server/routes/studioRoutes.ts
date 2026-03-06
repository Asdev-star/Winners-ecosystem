// Server/routes/studioRoutes.ts — Winners Community Studio API
// Phase 2 Extension — Video Rooms, Broadcast Streams, Events Calendar
// NOVA Intelligence integration for live transcription and skill detection

import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO ROOMS
// ─────────────────────────────────────────────────────────────────────────────

// GET /studio/rooms — List all video rooms
router.get("/rooms", authMiddleware, async (req, res) => {
  try {
    const { status, type } = req.query;
    const where: any = { tenantId: req.user!.tenantId };
    if (status) where.status = status;
    if (type) where.roomType = type;

    const rooms = await db.videoRoom.findMany({
      where,
      include: {
        host: { select: { id: true, name: true, trustScore: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching video rooms:", error);
    res.status(500).json({ error: "Failed to fetch video rooms" });
  }
});

// GET /studio/rooms/live — Get currently live rooms
router.get("/rooms/live", authMiddleware, async (req, res) => {
  try {
    const rooms = await db.videoRoom.findMany({
      where: { 
        tenantId: req.user!.tenantId,
        status: "LIVE"
      },
      include: {
        host: { select: { id: true, name: true, trustScore: true } },
        _count: { select: { participants: true } },
      },
    });
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching live rooms:", error);
    res.status(500).json({ error: "Failed to fetch live rooms" });
  }
});

// GET /studio/rooms/:id — Get single video room
router.get("/rooms/:id", authMiddleware, async (req, res) => {
  try {
    const roomId = String(req.params.id);
    const room = await db.videoRoom.findFirst({
      where: { id: roomId, tenantId: req.user!.tenantId },
      include: {
        host: { select: { id: true, name: true, trustScore: true, avatar: true } },
        participants: {
          include: { user: { select: { id: true, name: true, trustScore: true, avatar: true } } }
        },
        breakouts: true,
        qaQuestions: {
          orderBy: { upvotes: "desc" },
          take: 20
        },
        transcript: true,
      },
    });
    if (!room) {
      res.status(404).json({ error: "Video room not found" });
      return;
    }
    res.json(room);
  } catch (error) {
    console.error("Error fetching video room:", error);
    res.status(500).json({ error: "Failed to fetch video room" });
  }
});

// POST /studio/rooms — Create a new video room
router.post("/rooms", authMiddleware, async (req, res) => {
  try {
    const { title, description, roomType, scheduledAt, maxParticipants, isPrivate, password, courseId } = req.body;
    
    const room = await db.videoRoom.create({
      data: {
        tenantId: req.user!.tenantId,
        hostId: req.user!.userId,
        title,
        description,
        roomType: roomType || "WORKSHOP",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        maxParticipants: maxParticipants || 50,
        isPrivate: isPrivate || false,
        password,
        courseId,
      },
      include: {
        host: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(room);
  } catch (error) {
    console.error("Error creating video room:", error);
    res.status(500).json({ error: "Failed to create video room" });
  }
});

// PUT /studio/rooms/:id/start — Host starts the session
router.put("/rooms/:id/start", authMiddleware, async (req, res) => {
  try {
    const roomId = String(req.params.id);
    const room = await db.videoRoom.findFirst({
      where: { id: roomId, hostId: req.user!.userId },
    });
    if (!room) {
      res.status(404).json({ error: "Room not found or not authorized" });
      return;
    }

    const updated = await db.videoRoom.update({
      where: { id: roomId },
      data: { status: "LIVE", startedAt: new Date() },
    });
    res.json(updated);
  } catch (error) {
    console.error("Error starting video room:", error);
    res.status(500).json({ error: "Failed to start video room" });
  }
});

// PUT /studio/rooms/:id/end — Host ends the session
router.put("/rooms/:id/end", authMiddleware, async (req, res) => {
  try {
    const roomId = String(req.params.id);
    const room = await db.videoRoom.findFirst({
      where: { id: roomId, hostId: req.user!.userId },
    });
    if (!room) {
      res.status(404).json({ error: "Room not found or not authorized" });
      return;
    }

    const updated = await db.videoRoom.update({
      where: { id: roomId },
      data: { status: "ENDED", endedAt: new Date() },
      include: {
        participants: true,
        qaQuestions: true,
      },
    });

    // Create transcript record (NOVA will process async)
    await db.sessionTranscript.create({
      data: {
        sessionType: "video_room",
        sessionId: roomId,
        durationSecs: room.startedAt ? Math.floor((Date.now() - room.startedAt.getTime()) / 1000) : 0,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error ending video room:", error);
    res.status(500).json({ error: "Failed to end video room" });
  }
});

// POST /studio/rooms/:id/join — Join a video room
router.post("/rooms/:id/join", authMiddleware, async (req, res) => {
  try {
    const roomId = String(req.params.id);
    const room = await db.videoRoom.findFirst({
      where: { id: roomId, tenantId: req.user!.tenantId },
    });
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    if (room.isPrivate && room.password !== req.body.password) {
      res.status(403).json({ error: "Invalid password" });
      return;
    }

    const participant = await db.videoRoomParticipant.upsert({
      where: { roomId_userId: { roomId, userId: req.user!.userId } },
      update: { leftAt: null, joinedAt: new Date() },
      create: {
        roomId,
        userId: req.user!.userId,
        role: room.hostId === req.user!.userId ? "host" : "participant",
      },
      include: { user: { select: { id: true, name: true, trustScore: true } } },
    });

    // Generate LiveKit token (placeholder - integrate with LiveKit server)
    const livekitToken = `lk-token-placeholder-${Date.now()}`;
    
    res.json({ participant, livekitToken });
  } catch (error) {
    console.error("Error joining video room:", error);
    res.status(500).json({ error: "Failed to join video room" });
  }
});

// POST /studio/rooms/:id/breakout — Create breakout rooms
router.post("/rooms/:id/breakout", authMiddleware, async (req, res) => {
  try {
    const roomId = String(req.params.id);
    const { name, maxMembers } = req.body;
    
    const room = await db.videoRoom.findFirst({
      where: { id: roomId, hostId: req.user!.userId },
    });
    if (!room) {
      res.status(404).json({ error: "Room not found or not authorized" });
      return;
    }

    const breakout = await db.breakoutRoom.create({
      data: {
        parentRoomId: roomId,
        name,
        maxMembers: maxMembers || 6,
      },
    });
    res.status(201).json(breakout);
  } catch (error) {
    console.error("Error creating breakout room:", error);
    res.status(500).json({ error: "Failed to create breakout room" });
  }
});

// POST /studio/rooms/:id/questions — Submit Q&A question
router.post("/rooms/:id/questions", authMiddleware, async (req, res) => {
  try {
    const roomId = String(req.params.id);
    const { question } = req.body;

    const q = await db.qAQuestion.create({
      data: {
        sessionId: roomId,
        sessionType: "video_room",
        userId: req.user!.userId,
        question,
      },
    });
    res.status(201).json(q);
  } catch (error) {
    console.error("Error submitting question:", error);
    res.status(500).json({ error: "Failed to submit question" });
  }
});

// PUT /studio/rooms/:id/questions/:qid/upvote — Upvote Q&A question
router.put("/rooms/:id/questions/:qid/upvote", authMiddleware, async (req, res) => {
  try {
    const { qid } = req.params;
    const question = await db.qAQuestion.update({
      where: { id: qid },
      data: { upvotes: { increment: 1 } },
    });
    res.json(question);
  } catch (error) {
    console.error("Error upvoting question:", error);
    res.status(500).json({ error: "Failed to upvote question" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// BROADCAST STREAMS
// ─────────────────────────────────────────────────────────────────────────────

// GET /studio/streams — List all broadcast streams
router.get("/streams", authMiddleware, async (req, res) => {
  try {
    const { status, category } = req.query;
    const where: any = { tenantId: req.user!.tenantId };
    if (status) where.status = status;
    if (category) where.category = category;

    const streams = await db.broadcastStream.findMany({
      where,
      include: {
        host: { select: { id: true, name: true, trustScore: true } },
        _count: { select: { viewers: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(streams);
  } catch (error) {
    console.error("Error fetching streams:", error);
    res.status(500).json({ error: "Failed to fetch streams" });
  }
});

// GET /studio/streams/live — Get currently live streams
router.get("/streams/live", authMiddleware, async (req, res) => {
  try {
    const streams = await db.broadcastStream.findMany({
      where: { 
        tenantId: req.user!.tenantId,
        status: "LIVE"
      },
      include: {
        host: { select: { id: true, name: true, trustScore: true } },
        _count: { select: { viewers: true } },
      },
    });
    res.json(streams);
  } catch (error) {
    console.error("Error fetching live streams:", error);
    res.status(500).json({ error: "Failed to fetch live streams" });
  }
});

// GET /studio/streams/:id — Get single broadcast stream
router.get("/streams/:id", authMiddleware, async (req, res) => {
  try {
    const streamId = String(req.params.id);
    const stream = await db.broadcastStream.findFirst({
      where: { id: streamId, tenantId: req.user!.tenantId },
      include: {
        host: { select: { id: true, name: true, trustScore: true, avatar: true } },
        viewers: { take: 50 },
        superChats: { 
          where: { pinnedUntil: { gt: new Date() } },
          orderBy: { amount: "desc" },
          take: 10
        },
        transcript: true,
      },
    });
    if (!stream) {
      res.status(404).json({ error: "Stream not found" });
      return;
    }
    res.json(stream);
  } catch (error) {
    console.error("Error fetching stream:", error);
    res.status(500).json({ error: "Failed to fetch stream" });
  }
});

// POST /studio/streams — Create a new broadcast stream
router.post("/streams", authMiddleware, async (req, res) => {
  try {
    const { title, description, thumbnail, category, scheduledAt, isPPV, ppvPrice, superChatEnabled } = req.body;
    
    const stream = await db.broadcastStream.create({
      data: {
        tenantId: req.user!.tenantId,
        hostId: req.user!.userId,
        title,
        description,
        thumbnail,
        category,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        isPPV: isPPV || false,
        ppvPrice: ppvPrice || 0,
        superChatEnabled: superChatEnabled !== false,
      },
      include: {
        host: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(stream);
  } catch (error) {
    console.error("Error creating stream:", error);
    res.status(500).json({ error: "Failed to create stream" });
  }
});

// PUT /studio/streams/:id/start — Go live
router.put("/streams/:id/start", authMiddleware, async (req, res) => {
  try {
    const streamId = String(req.params.id);
    const stream = await db.broadcastStream.findFirst({
      where: { id: streamId, hostId: req.user!.userId },
    });
    if (!stream) {
      res.status(404).json({ error: "Stream not found or not authorized" });
      return;
    }

    // In production, create Mux stream here
    const muxStreamId = `mux-${Date.now()}`;
    
    const updated = await db.broadcastStream.update({
      where: { id: streamId },
      data: { 
        status: "LIVE", 
        startedAt: new Date(),
        muxStreamId,
        muxPlaybackId: `playback-${Date.now()}`
      },
    });
    res.json(updated);
  } catch (error) {
    console.error("Error starting stream:", error);
    res.status(500).json({ error: "Failed to start stream" });
  }
});

// PUT /studio/streams/:id/end — End stream
router.put("/streams/:id/end", authMiddleware, async (req, res) => {
  try {
    const streamId = String(req.params.id);
    const stream = await db.broadcastStream.findFirst({
      where: { id: streamId, hostId: req.user!.userId },
    });
    if (!stream) {
      res.status(404).json({ error: "Stream not found or not authorized" });
      return;
    }

    const updated = await db.broadcastStream.update({
      where: { id: streamId },
      data: { status: "ENDED", endedAt: new Date() },
    });

    // Create transcript record
    await db.sessionTranscript.create({
      data: {
        sessionType: "broadcast",
        sessionId: streamId,
        durationSecs: stream.startedAt ? Math.floor((Date.now() - stream.startedAt.getTime()) / 1000) : 0,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error ending stream:", error);
    res.status(500).json({ error: "Failed to end stream" });
  }
});

// POST /studio/streams/:id/view — Join stream as viewer
router.post("/streams/:id/view", authMiddleware, async (req, res) => {
  try {
    const streamId = String(req.params.id);
    const stream = await db.broadcastStream.findFirst({
      where: { id: streamId, tenantId: req.user!.tenantId },
    });
    if (!stream) {
      res.status(404).json({ error: "Stream not found" });
      return;
    }

    // Check PPV access
    if (stream.isPPV) {
      const ppvAccess = await db.pPVAccess.findUnique({
        where: { streamId_userId: { streamId, userId: req.user!.userId } },
      });
      if (!ppvAccess) {
        res.status(403).json({ error: "PPV purchase required", ppvPrice: stream.ppvPrice });
        return;
      }
    }

    const viewer = await db.streamViewer.upsert({
      where: { streamId_userId: { streamId, userId: req.user!.userId } },
      update: { leftAt: null, joinedAt: new Date() },
      create: { streamId, userId: req.user!.userId },
    });

    // Update peak viewers
    await db.broadcastStream.update({
      where: { id: streamId },
      data: { peakViewers: { increment: 1 }, totalViewers: { increment: 1 } },
    });

    res.json({ viewer, stream });
  } catch (error) {
    console.error("Error joining stream:", error);
    res.status(500).json({ error: "Failed to join stream" });
  }
});

// POST /studio/streams/:id/superchat — Send Super Chat
router.post("/streams/:id/superchat", authMiddleware, async (req, res) => {
  try {
    const streamId = String(req.params.id);
    const { message, amount, currency } = req.body;
    
    const stream = await db.broadcastStream.findFirst({
      where: { id: streamId, tenantId: req.user!.tenantId },
    });
    if (!stream) {
      res.status(404).json({ error: "Stream not found" });
      return;
    }

    // In production, process payment via Stripe here
    const stripeId = `sc-${Date.now()}`;
    
    // Calculate platform cut (20%)
    const platformCut = amount * 0.20;
    
    const superChat = await db.superChat.create({
      data: {
        streamId,
        userId: req.user!.userId,
        message,
        amount,
        currency: currency || "USD",
        stripeId,
        pinnedUntil: new Date(Date.now() + (amount >= 20 ? 300000 : amount >= 5 ? 120000 : 30000)),
      },
    });

    // Update stream revenue
    await db.broadcastStream.update({
      where: { id: streamId },
      data: { totalRevenue: { increment: amount - platformCut } },
    });

    res.status(201).json(superChat);
  } catch (error) {
    console.error("Error sending superchat:", error);
    res.status(500).json({ error: "Failed to send superchat" });
  }
});

// POST /studio/streams/:id/ppv — Purchase PPV access
router.post("/streams/:id/ppv", authMiddleware, async (req, res) => {
  try {
    const streamId = String(req.params.id);
    const stream = await db.broadcastStream.findFirst({
      where: { id: streamId, tenantId: req.user!.tenantId },
    });
    if (!stream || !stream.isPPV) {
      res.status(404).json({ error: "Stream not found or not PPV" });
      return;
    }

    // In production, process payment via Stripe here
    const stripeId = `ppv-${Date.now()}`;
    
    const ppvAccess = await db.pPVAccess.create({
      data: {
        streamId,
        userId: req.user!.userId,
        amount: stream.ppvPrice,
        stripeId,
      },
    });

    res.status(201).json(ppvAccess);
  } catch (error) {
    console.error("Error purchasing PPV:", error);
    res.status(500).json({ error: "Failed to purchase PPV" });
  }
});

// GET /studio/streams/:id/analytics — Get stream analytics
router.get("/streams/:id/analytics", authMiddleware, async (req, res) => {
  try {
    const streamId = String(req.params.id);
    const stream = await db.broadcastStream.findFirst({
      where: { id: streamId, hostId: req.user!.userId },
    });
    if (!stream) {
      res.status(404).json({ error: "Stream not found or not authorized" });
      return;
    }

    const viewers = await db.streamViewer.findMany({
      where: { streamId },
      select: { watchSecs: true, joinedAt: true },
    });

    const superChats = await db.superChat.aggregate({
      where: { streamId },
      _sum: { amount: true },
      _count: true,
    });

    res.json({
      peakViewers: stream.peakViewers,
      totalViewers: stream.totalViewers,
      totalRevenue: stream.totalRevenue,
      totalSuperChats: superChats._count,
      superChatRevenue: superChats._sum.amount || 0,
      avgWatchTime: viewers.length ? Math.floor(viewers.reduce((a, b) => a + b.watchSecs, 0) / viewers.length) : 0,
    });
  } catch (error) {
    console.error("Error fetching stream analytics:", error);
    res.status(500).json({ error: "Failed to fetch stream analytics" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STUDIO EVENTS CALENDAR
// ─────────────────────────────────────────────────────────────────────────────

// GET /studio/events — List all studio events
router.get("/events", authMiddleware, async (req, res) => {
  try {
    const { month, year } = req.query;
    const where: any = { tenantId: req.user!.tenantId };
    
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);
      where.scheduledAt = { gte: startDate, lte: endDate };
    }

    const events = await db.studioEvent.findMany({
      where,
      include: {
        host: { select: { id: true, name: true, trustScore: true } },
        _count: { select: { rsvps: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET /studio/events/upcoming — Get upcoming events
router.get("/events/upcoming", authMiddleware, async (req, res) => {
  try {
    const events = await db.studioEvent.findMany({
      where: { 
        tenantId: req.user!.tenantId,
        scheduledAt: { gte: new Date() },
      },
      include: {
        host: { select: { id: true, name: true, trustScore: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    });
    res.json(events);
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({ error: "Failed to fetch upcoming events" });
  }
});

// POST /studio/events — Create a studio event
router.post("/events", authMiddleware, async (req, res) => {
  try {
    const { title, description, sessionType, sessionId, scheduledAt, durationMins, isPublic, thumbnail, tags } = req.body;
    
    const event = await db.studioEvent.create({
      data: {
        tenantId: req.user!.tenantId,
        hostId: req.user!.userId,
        title,
        description,
        sessionType,
        sessionId,
        scheduledAt: new Date(scheduledAt),
        durationMins: durationMins || 60,
        isPublic: isPublic !== false,
        thumbnail,
        tags: tags || [],
      },
      include: {
        host: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// POST /studio/events/:id/rsvp — RSVP to event
router.post("/events/:id/rsvp", authMiddleware, async (req, res) => {
  try {
    const eventId = String(req.params.id);
    
    const rsvp = await db.studioRsvp.upsert({
      where: { eventId_userId: { eventId, userId: req.user!.userId } },
      update: {},
      create: { eventId, userId: req.user!.userId },
    });

    await db.studioEvent.update({
      where: { id: eventId },
      data: { rsvpCount: { increment: 1 } },
    });

    res.status(201).json(rsvp);
  } catch (error) {
    console.error("Error RSVPing:", error);
    res.status(500).json({ error: "Failed to RSVP" });
  }
});

// DELETE /studio/events/:id/rsvp — Cancel RSVP
router.delete("/events/:id/rsvp", authMiddleware, async (req, res) => {
  try {
    const eventId = String(req.params.id);
    
    await db.studioRsvp.deleteMany({
      where: { eventId, userId: req.user!.userId },
    });

    await db.studioEvent.update({
      where: { id: eventId },
      data: { rsvpCount: { decrement: 1 } },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error canceling RSVP:", error);
    res.status(500).json({ error: "Failed to cancel RSVP" });
  }
});

// GET /studio/events/:id — Get single event with RSVPs
router.get("/events/:id", authMiddleware, async (req, res) => {
  try {
    const eventId = String(req.params.id);
    const event = await db.studioEvent.findFirst({
      where: { id: eventId, tenantId: req.user!.tenantId },
      include: {
        host: { select: { id: true, name: true, trustScore: true, avatar: true } },
        rsvps: {
          include: { user: { select: { id: true, name: true, trustScore: true } } },
          take: 50,
        },
      },
    });
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// NOVA INTELLIGENCE
// ─────────────────────────────────────────────────────────────────────────────

// POST /studio/nova/prep — NOVA session prep tool
router.post("/nova/prep", authMiddleware, async (req, res) => {
  try {
    const { topic, audienceSize, duration } = req.body;
    
    // In production, call Claude API here to generate session structure
    const novaSuggestions = {
      sessionStructure: [
        { time: "00:00-05:00", title: "Welcome + context setting" },
        { time: "05:00-20:00", title: "Core concept explanation" },
        { time: "20:00-35:00", title: "Live demonstration" },
        { time: "35:00-45:00", title: "Guided practice (breakout rooms)" },
        { time: "45:00-55:00", title: "Q&A (NOVA will moderate)" },
        { time: "55:00-60:00", title: "Next steps + resources" },
      ],
      titleSuggestions: [
        `${topic} — A Practical Workshop for African Builders`,
        `The ${topic} Masterclass: From Zero to Production`,
      ],
      skillsToHighlight: ["Topic Expertise", "Practical Application", "Industry Relevance"],
    };
    
    res.json(novaSuggestions);
  } catch (error) {
    console.error("Error generating NOVA prep:", error);
    res.status(500).json({ error: "Failed to generate NOVA prep" });
  }
});

// GET /studio/nova/debrief/:sessionId — Get personal skill debrief after session
router.get("/nova/debrief/:sessionId", authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const transcript = await db.sessionTranscript.findUnique({
      where: { sessionId },
    });
    
    if (!transcript) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // In production, call Claude API to generate debrief from transcript
    const debrief = {
      skillsDetected: transcript.novaSkills || [],
      impactMetrics: {
        participants: 23,
        newSkillsLearners: 8,
        recommendedPaths: 4,
      },
      circuitSignal: "4 open contracts match the skills you taught today.",
    };
    
    res.json(debrief);
  } catch (error) {
    console.error("Error generating NOVA debrief:", error);
    res.status(500).json({ error: "Failed to generate NOVA debrief" });
  }
});

// GET /studio/transcripts/:sessionId — Get session transcript
router.get("/transcripts/:sessionId", authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const transcript = await db.sessionTranscript.findUnique({
      where: { sessionId },
    });
    
    if (!transcript) {
      res.status(404).json({ error: "Transcript not found" });
      return;
    }
    
    res.json(transcript);
  } catch (error) {
    console.error("Error fetching transcript:", error);
    res.status(500).json({ error: "Failed to fetch transcript" });
  }
});

// GET /studio/my-studio — Get user's studio (hosted rooms, events, RSVPs)
router.get("/my-studio", authMiddleware, async (req, res) => {
  try {
    const hostedRooms = await db.videoRoom.findMany({
      where: { hostId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    
    const hostedStreams = await db.broadcastStream.findMany({
      where: { hostId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    
    const myEvents = await db.studioEvent.findMany({
      where: { hostId: req.user!.userId },
      orderBy: { scheduledAt: "desc" },
      take: 10,
    });
    
    const myRsvps = await db.studioRsvp.findMany({
      where: { userId: req.user!.userId },
      include: { event: true },
      take: 20,
    });
    
    res.json({
      hostedRooms,
      hostedStreams,
      myEvents,
      myRsvps,
    });
  } catch (error) {
    console.error("Error fetching my studio:", error);
    res.status(500).json({ error: "Failed to fetch my studio" });
  }
});

export default router;
