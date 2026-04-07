import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware";
import { muxService } from "../services/muxService";

const router = Router();
const prisma = new PrismaClient();

// Get all streams (live, scheduled, VOD)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, creatorId, limit = "20", offset = "0" } = req.query;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (creatorId) where.creatorId = creatorId;

    const streams = await prisma.stream.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            tips: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json(streams);
  } catch (error) {
    console.error("Error fetching streams:", error);
    res.status(500).json({ error: "Failed to fetch streams" });
  }
});

// Get live streams only
router.get("/live", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const streams = await prisma.stream.findMany({
      where: {
        tenantId,
        status: "live",
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            tips: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { viewCount: "desc" },
    });

    res.json(streams);
  } catch (error) {
    console.error("Error fetching live streams:", error);
    res.status(500).json({ error: "Failed to fetch live streams" });
  }
});

// Get single stream
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const stream = await prisma.stream.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
          },
        },
        tips: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        subscriptions: {
          where: { status: "active" },
          select: { id: true, amount: true, userId: true },
        },
        _count: {
          select: {
            tips: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!stream || stream.tenantId !== tenantId) {
      return res.status(404).json({ error: "Stream not found" });
    }

    res.json(stream);
  } catch (error) {
    console.error("Error fetching stream:", error);
    res.status(500).json({ error: "Failed to fetch stream" });
  }
});

// Create new stream (creators only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const { title, isPayPerView, ppvPrice } = req.body;

    // Check if user has Pro or Enterprise plan for streaming
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (
      !user ||
      (user.tenant.plan !== "PRO" && user.tenant.plan !== "ENTERPRISE")
    ) {
      return res.status(403).json({
        error: "Streaming requires Pro or Enterprise plan",
      });
    }

    // Create Mux live stream
    const muxData = await muxService.createLiveStream(title);

    const stream = await prisma.stream.create({
      data: {
        tenantId,
        creatorId: userId,
        title,
        muxStreamId: muxData.muxStreamId,
        muxPlaybackId: muxData.muxPlaybackId,
        streamKey: muxData.streamKey,
        isPayPerView: isPayPerView || false,
        ppvPrice: ppvPrice || null,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      ...stream,
      rtmpUrl: muxData.rtmpUrl,
      streamKey: muxData.streamKey,
    });
  } catch (error) {
    console.error("Error creating stream:", error);
    res.status(500).json({ error: "Failed to create stream" });
  }
});

// Update stream
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const streamId = Array.isArray(id) ? id[0] : id;
    const userId = req.user.userId;
    const { title, isPayPerView, ppvPrice } = req.body;

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream || stream.creatorId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this stream" });
    }

    const updatedStream = await prisma.stream.update({
      where: { id: streamId },
      data: {
        title,
        isPayPerView,
        ppvPrice,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(updatedStream);
  } catch (error) {
    console.error("Error updating stream:", error);
    res.status(500).json({ error: "Failed to update stream" });
  }
});

// Start stream
router.post("/:id/start", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const streamId = Array.isArray(id) ? id[0] : id;
    const userId = req.user.userId;

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream || stream.creatorId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to start this stream" });
    }

    if (!stream.muxStreamId) {
      return res.status(400).json({ error: "Stream not properly configured" });
    }

    await muxService.startLiveStream(stream.muxStreamId);

    const updatedStream = await prisma.stream.update({
      where: { id },
      data: { status: "live" },
    });

    res.json(updatedStream);
  } catch (error) {
    console.error("Error starting stream:", error);
    res.status(500).json({ error: "Failed to start stream" });
  }
});

// End stream
router.post("/:id/end", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const streamId = Array.isArray(id) ? id[0] : id;
    const userId = req.user.userId;

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream || stream.creatorId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to end this stream" });
    }

    if (stream.muxStreamId) {
      await muxService.stopLiveStream(stream.muxStreamId);
    }

    const updatedStream = await prisma.stream.update({
      where: { id },
      data: { status: "ended" },
    });

    res.json(updatedStream);
  } catch (error) {
    console.error("Error ending stream:", error);
    res.status(500).json({ error: "Failed to end stream" });
  }
});

// Delete stream
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const streamId = Array.isArray(id) ? id[0] : id;
    const userId = req.user.userId;

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream || stream.creatorId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this stream" });
    }

    // Delete from Mux if it exists
    if (stream.muxStreamId) {
      await muxService.deleteLiveStream(stream.muxStreamId);
    }

    await prisma.stream.delete({
      where: { id: streamId },
    });

    res.json({ message: "Stream deleted successfully" });
  } catch (error) {
    console.error("Error deleting stream:", error);
    res.status(500).json({ error: "Failed to delete stream" });
  }
});

// Send tip to stream
router.post("/:id/tip", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;    const streamId = Array.isArray(id) ? id[0] : id;    const userId = req.user.userId;
    const { amount, message } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid tip amount" });
    }

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      return res.status(404).json({ error: "Stream not found" });
    }

    // Here you would integrate with payment processor (Stripe, etc.)
    // For now, we'll create the tip record directly

    const tip = await prisma.streamTip.create({
      data: {
        streamId: streamId,
        userId,
        amount,
        message,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json(tip);
  } catch (error) {
    console.error("Error sending tip:", error);
    res.status(500).json({ error: "Failed to send tip" });
  }
});

// Subscribe to stream
router.post("/:id/subscribe", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;    const streamId = Array.isArray(id) ? id[0] : id;    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid subscription amount" });
    }

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      return res.status(404).json({ error: "Stream not found" });
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.streamSubscription.findUnique({
      where: {
        streamId_userId: {
          streamId: streamId,
          userId,
        },
      },
    });

    if (existingSubscription && existingSubscription.status === "active") {
      return res
        .status(400)
        .json({ error: "Already subscribed to this stream" });
    }

    // Here you would integrate with payment processor
    // For now, we'll create the subscription record

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

    const subscription = await prisma.streamSubscription.create({
      data: {
        streamId: streamId,
        userId,
        amount,
        expiresAt,
      },
    });

    res.status(201).json(subscription);
  } catch (error) {
    console.error("Error subscribing to stream:", error);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// Get creator's streams
router.get("/creator/:creatorId", authMiddleware, async (req, res) => {
  try {
    const { creatorId } = req.params;
    const tenantId = req.user.tenantId;

    const streams = await prisma.stream.findMany({
      where: {
        creatorId,
        tenantId,
      },
      include: {
        _count: {
          select: {
            tips: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(streams);
  } catch (error) {
    console.error("Error fetching creator streams:", error);
    res.status(500).json({ error: "Failed to fetch creator streams" });
  }
});

// Mux webhook handler
router.post("/webhook/mux", async (req, res) => {
  try {
    const event = req.body;

    // Verify webhook signature here (in production)

    const processedEvent = muxService.handleWebhookEvent(event);

    // Handle different event types
    switch (processedEvent.type) {
      case "stream_started":
        await prisma.stream.updateMany({
          where: { muxStreamId: processedEvent.streamId },
          data: { status: "live" },
        });
        break;

      case "stream_ended":
        await prisma.stream.updateMany({
          where: { muxStreamId: processedEvent.streamId },
          data: { status: "ended" },
        });
        break;

      case "vod_ready":
        // Handle VOD asset ready
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing Mux webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
