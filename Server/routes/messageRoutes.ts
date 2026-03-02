// Server/routes/messageRoutes.ts
// Phase 2 - Winners Community Layer
// Direct Messages API: conversations, messages, read receipts

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

// GET /messages/conversations - list all conversations for current user
router.get("/conversations", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Get all conversations where user is either participant
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      },
      include: {
        participant1: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        participant2: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.participant1Id === userId ? conv.participant2 : conv.participant1;
        const unreadCount = await prisma.messageRead.count({
          where: {
            message: { conversationId: conv.id },
            userId: { not: userId },
            readAt: null
          }
        });
        
        return {
          id: conv.id,
          otherUser: {
            id: otherUser?.id,
            name: otherUser?.name,
            avatar: otherUser?.avatar
          },
          lastMessage: conv.messages[0] || null,
          unreadCount,
          updatedAt: conv.updatedAt
        };
      })
    );

    res.json(conversationsWithUnread);
  } catch (error) {
    console.error("[messageRoutes] Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// GET /messages/conversations/:conversationId - get a specific conversation
router.get("/conversations/:conversationId", async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.userId;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participant1: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        participant2: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Verify user is part of conversation
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      return res.status(403).json({ error: "Not authorized to view this conversation" });
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    // Mark messages as read
    await prisma.messageRead.updateMany({
      where: {
        message: { conversationId },
        userId: { not: userId }
      },
      data: { readAt: new Date() }
    });

    const otherUser = conversation.participant1Id === userId 
      ? conversation.participant2 
      : conversation.participant1;

    res.json({
      conversation: {
        id: conversation.id,
        otherUser: {
          id: otherUser?.id,
          name: otherUser?.name,
          avatar: otherUser?.avatar
        }
      },
      messages
    });
  } catch (error) {
    console.error("[messageRoutes] Error fetching conversation:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// POST /messages/conversations - start a new conversation
router.post("/conversations", async (req: Request, res: Response) => {
  try {
    const { recipientId } = req.body as { recipientId: string };
    const senderId = req.user!.userId;

    if (!recipientId) {
      return res.status(400).json({ error: "recipientId is required" });
    }

    // Check if conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: senderId, participant2Id: recipientId },
          { participant1Id: recipientId, participant2Id: senderId }
        ]
      }
    });

    if (existing) {
      return res.json(existing);
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participant1Id: senderId,
        participant2Id: recipientId
      }
    });

    res.json(conversation);
  } catch (error) {
    console.error("[messageRoutes] Error creating conversation:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// GET /messages/:conversationId - get messages for a conversation (legacy)
router.get("/:conversationId", async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const userId = req.user!.userId;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    // Mark as read
    await prisma.messageRead.updateMany({
      where: {
        message: { conversationId },
        userId: { not: userId }
      },
      data: { readAt: new Date() }
    });

    res.json(messages);
  } catch (error) {
    console.error("[messageRoutes] Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /messages/:conversationId - send a message
router.post("/:conversationId", async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { content } = req.body as { content: string };
  const senderId = req.user!.userId;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Message content is required" });
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (conversation.participant1Id !== senderId && conversation.participant2Id !== senderId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: content.trim()
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    // Create unread receipt for recipient
    const recipientId = conversation.participant1Id === senderId 
      ? conversation.participant2Id 
      : conversation.participant1Id;

    await prisma.messageRead.create({
      data: {
        messageId: message.id,
        userId: recipientId,
        readAt: null
      }
    });

    // Emit WebSocket event if wsService available
    try {
      const { io } = await import("../services/wsService.js");
      if (io) {
        io.to(`user:${recipientId}`).emit("new-message", {
          conversationId,
          message
        });
      }
    } catch (wsError) {
      console.warn("[messageRoutes] WebSocket not available:", wsError);
    }

    res.json(message);
  } catch (error) {
    console.error("[messageRoutes] Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// PUT /messages/:conversationId/read - mark messages as read
router.put("/:conversationId/read", async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const userId = req.user!.userId;

  try {
    // Mark all messages in conversation as read
    const result = await prisma.messageRead.updateMany({
      where: {
        message: { conversationId },
        userId,
        readAt: null
      },
      data: { readAt: new Date() }
    });

    res.json({ markedRead: result.count });
  } catch (error) {
    console.error("[messageRoutes] Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

export default router;
