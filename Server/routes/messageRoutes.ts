// Server/routes/messageRoutes.ts
// Phase 2 V1.3: Direct Messaging API

import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

// ─── GET /messages — list conversations ───────────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.userId;

  try {
    const conversations = await db.conversation.findMany({
      where: {
        tenantId,
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          where: { userId: { not: userId } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                AND: [
                  { deletedAt: null },
                  {
                    NOT: {
                      reads: { some: { userId } },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      isGroup: conv.isGroup,
      participants: conv.participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        role: p.role,
      })),
      lastMessage: conv.messages[0]
        ? {
            id: conv.messages[0].id,
            content: conv.messages[0].content,
            sender: conv.messages[0].sender.name,
            createdAt: conv.messages[0].createdAt,
          }
        : null,
      unreadCount: conv._count.messages,
      updatedAt: conv.updatedAt,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("[messages] Error listing conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// ─── POST /messages — create new conversation ─────────────────────────────────

router.post("/", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.userId;
  const { participantIds, title, isGroup } = req.body;

  try {
    const conversation = await db.conversation.create({
      data: {
        tenantId,
        createdById: userId,
        title: isGroup ? title : null,
        isGroup: isGroup || false,
        participants: {
          create: [
            { userId, role: "OWNER" },
            ...participantIds.map((id: string) => ({
              userId: id,
              role: "MEMBER",
            })),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error("[messages] Error creating conversation:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// ─── GET /messages/:conversationId — get conversation messages ────────────────

router.get("/:conversationId", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.userId;
  const { conversationId } = req.params;
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "50"));

  try {
    // Verify user is participant
    const participant = await db.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      res.status(403).json({ error: "Not a participant in this conversation" });
      return;
    }

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where: {
          conversationId,
          deletedAt: null,
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true },
          },
          reads: {
            where: { userId },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.message.count({
        where: { conversationId, deletedAt: null },
      }),
    ]);

    // Mark messages as read
    const unreadMessages = messages.filter((m) => m.reads.length === 0);
    if (unreadMessages.length > 0) {
      await db.messageRead.createMany({
        data: unreadMessages.map((m) => ({
          messageId: m.id,
          userId,
        })),
      });
    }

    res.json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[messages] Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ─── POST /messages/:conversationId — send a message ─────────────────────────

router.post("/:conversationId", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.userId;
  const { conversationId } = req.params;
  const { content, type = "TEXT", metadata } = req.body;

  try {
    // Verify user is participant
    const participant = await db.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      res.status(403).json({ error: "Not a participant in this conversation" });
      return;
    }

    const message = await db.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
        type,
        metadata,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // TODO: Emit WebSocket event for real-time delivery

    res.status(201).json(message);
  } catch (error) {
    console.error("[messages] Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ─── DELETE /messages/:conversationId/:messageId — delete message ────────────

router.delete(
  "/:conversationId/:messageId",
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { conversationId, messageId } = req.params;

    try {
      const message = await db.message.findFirst({
        where: {
          id: messageId,
          conversationId,
          senderId: userId,
        },
      });

      if (!message) {
        res.status(403).json({ error: "Cannot delete this message" });
        return;
      }

      await db.message.update({
        where: { id: messageId },
        data: { deletedAt: new Date() },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[messages] Error deleting message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  }
);

// ─── POST /messages/:conversationId/leave — leave conversation ────────────────

router.post("/:conversationId/leave", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { conversationId } = req.params;

  try {
    await db.conversationParticipant.delete({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[messages] Error leaving conversation:", error);
    res.status(500).json({ error: "Failed to leave conversation" });
  }
});

// ─── GET /messages/:conversationId/participants — get participants ───────────

router.get(
  "/:conversationId/participants",
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { conversationId } = req.params;

    try {
      const participants = await db.conversationParticipant.findMany({
        where: { conversationId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      res.json(participants);
    } catch (error) {
      console.error("[messages] Error fetching participants:", error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  }
);

export default router;
