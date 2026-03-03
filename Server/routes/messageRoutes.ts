// Server/routes/messageRoutes.ts
// Phase 2 V1.3 - Direct Messaging
// Handles real-time messaging between users

import { Router, Request, Response } from "express";
import { db } from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// Get all conversations for user - frontend calls GET /messages
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const participants = await db.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, email: true } }
              }
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                sender: { select: { id: true, name: true } }
              }
            }
          }
        }
      },
      orderBy: { conversation: { updatedAt: "desc" } }
    });

    const conversations = participants.map((p) => {
      const conv = p.conversation;
      const otherParticipant = conv.participants.find(
        (part: { userId: string }) => part.userId !== userId
      );
      
      return {
        id: conv.id,
        isGroup: conv.isGroup,
        title: conv.title,
        otherUser: otherParticipant ? {
          id: otherParticipant.user.id,
          name: otherParticipant.user.name,
          email: otherParticipant.user.email
        } : null,
        lastMessage: conv.messages[0] || null,
        unreadCount: 0,
        updatedAt: conv.updatedAt
      };
    });

    res.json(conversations);
  } catch (error) {
    console.error("[messageRoutes] Get conversations error:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Create new conversation with user - frontend calls POST /messages
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ error: "participantId is required" });
    }

    if (participantId === userId) {
      return res.status(400).json({ error: "Cannot create conversation with yourself" });
    }

    const existingParticipants = await db.conversationParticipant.findMany({
      where: { userId: { in: [userId, participantId] } },
      include: { conversation: { include: { participants: true } } }
    });

    let existingConversation = null;
    for (const ep of existingParticipants) {
      if (!ep.conversation.isGroup) {
        const hasBoth = ep.conversation.participants.some(
          (p: { userId: string }) => p.userId === participantId
        );
        if (hasBoth) { existingConversation = ep.conversation; break; }
      }
    }

    let conversation;
    if (!existingConversation) {
      conversation = await db.conversation.create({
        data: {
          tenantId,
          createdById: userId,
          isGroup: false,
          participants: { create: [{ userId, role: "MEMBER" }, { userId: participantId, role: "MEMBER" }] }
        },
        include: {
          participants: { include: { user: { select: { id: true, name: true, email: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 50, include: { sender: { select: { id: true, name: true } } } }
        }
      });
    } else {
      conversation = await db.conversation.findUnique({
        where: { id: existingConversation.id },
        include: {
          participants: { include: { user: { select: { id: true, name: true, email: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 50, include: { sender: { select: { id: true, name: true } } } }
        }
      });
    }

    res.json(conversation);
  } catch (error) {
    console.error("[messageRoutes] Create conversation error:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// Get messages in conversation - frontend calls GET /messages/:conversationId
router.get("/:conversationId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const convId = String(req.params.conversationId);
    const { before, limit = 50 } = req.query;

    const participant = await db.conversationParticipant.findFirst({
      where: { conversationId: convId, userId }
    });

    if (!participant) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const messages = await db.message.findMany({
      where: {
        conversationId: convId,
        deletedAt: null,
        ...(before ? { createdAt: { lt: new Date(String(before)) } } : {})
      },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: Number(limit)
    });

    await db.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() }
    });

    // Return in format frontend expects: { messages: [...] }
    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error("[messageRoutes] Get messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send message - frontend calls POST /messages/:conversationId
router.post("/:conversationId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const convId = String(req.params.conversationId);
    const { content, type = "TEXT", metadata } = req.body;

    if (!content) return res.status(400).json({ error: "Message content required" });

    const participant = await db.conversationParticipant.findFirst({
      where: { conversationId: convId, userId }
    });

    if (!participant) return res.status(403).json({ error: "Not authorized" });

    const message = await db.message.create({
      data: {
        conversationId: convId,
        senderId: userId,
        content,
        type: (type as "TEXT") || "TEXT",
        metadata: metadata || {}
      },
      include: { sender: { select: { id: true, name: true } } }
    });

    await db.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });
    await db.conversationParticipant.update({ where: { id: participant.id }, data: { lastReadAt: new Date() } });

    // WebSocket emit
    try {
      const io = (req.app as unknown as { get?: (key: string) => unknown }).get?.("io");
      if (io) {
        const others = await db.conversationParticipant.findMany({
          where: { conversationId: convId, userId: { not: userId } }
        });
        const ioObj = io as { to: (room: string) => { emit: (e: string, d: unknown) => void } };
        for (const p of others) {
          ioObj.to(`user:${p.userId}`).emit("new_message", { conversationId: convId, message });
        }
      }
    } catch {}

    res.status(201).json(message);
  } catch (error) {
    console.error("[messageRoutes] Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Mark as read - frontend calls POST /messages/:conversationId/read
router.post("/:conversationId/read", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const convId = String(req.params.conversationId);

    await db.conversationParticipant.updateMany({
      where: { conversationId: convId, userId },
      data: { lastReadAt: new Date() }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[messageRoutes] Mark read error:", error);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// Leave conversation - frontend calls DELETE /messages/:conversationId
router.delete("/:conversationId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const convId = String(req.params.conversationId);

    const participant = await db.conversationParticipant.findFirst({
      where: { conversationId: convId, userId }
    });

    if (!participant) return res.status(403).json({ error: "Not authorized" });

    const conversation = await db.conversation.findUnique({ where: { id: convId } });

    if (conversation?.isGroup) {
      await db.conversationParticipant.delete({ where: { id: participant.id } });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[messageRoutes] Delete error:", error);
    res.status(500).json({ error: "Failed to leave conversation" });
  }
});

export default router;
