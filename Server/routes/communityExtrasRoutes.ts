// Phase 2 Layer 2 - Community Backend Extras
// Fixes missing routes: saved posts, feed preferences, conversations
import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

// Helper to handle missing table gracefully
const isMissingTable = (error: any): boolean => {
  return error?.message?.includes('does not exist') || error?.code === 'P2022';
};

// ============================================
// SAVED POSTS
// GET /api/v1/community/posts/saved - Get all saved/bookmarked posts
// POST /api/v1/community/posts/:id/save - Toggle bookmark on a post
// ============================================

router.get("/posts/saved", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const savedPosts = await db.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: {
              select: { id: true, name: true, email: true }
            },
            _count: {
              select: { likes: true, comments: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(savedPosts.map(sp => sp.post));
  } catch (error: any) {
    if (isMissingTable(error)) {
      return res.json([]);
    }
    console.error('Error fetching saved posts:', error);
    res.status(500).json({ error: "Failed to fetch saved posts" });
  }
});

router.post("/posts/:postId/save", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const postId = req.params.postId as string;
    
    // Check if already saved
    const existing = await db.savedPost.findUnique({
      where: {
        userId_postId: { userId, postId }
      }
    });
    
    if (existing) {
      // Unsave (delete)
      await db.savedPost.delete({
        where: { id: existing.id }
      });
      return res.json({ saved: false });
    } else {
      // Save (create)
      await db.savedPost.create({
        data: { userId, postId }
      });
      return res.json({ saved: true });
    }
  } catch (error: any) {
    if (isMissingTable(error)) {
      return res.json({ saved: false, error: "Table not ready" });
    }
    console.error('Error toggling save:', error);
    res.status(500).json({ error: "Failed to toggle save" });
  }
});

// ============================================
// FEED PREFERENCES
// GET /api/v1/community/feed-preferences - Get user's feed preference
// PUT /api/v1/community/feed-preferences - Save user's feed preference
// ============================================

router.get("/feed-preferences", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    // Try to find in UserFeedPreference first
    let preference = await db.userFeedPreference.findUnique({
      where: { userId }
    });
    
    if (!preference) {
      // Check user's metadata field as fallback
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { metadata: true }
      });
      
      const metadata = (user?.metadata as any) || {};
      return res.json({
        feedMode: metadata.feedMode || "foryou",
        novaIntelligence: true,
        quickPostEnabled: true
      });
    }
    
    res.json({
      feedMode: preference.feedMode,
      novaIntelligence: preference.novaIntelligence,
      quickPostEnabled: preference.quickPostEnabled
    });
  } catch (error: any) {
    if (isMissingTable(error)) {
      return res.json({ feedMode: "foryou", novaIntelligence: true, quickPostEnabled: true });
    }
    console.error('Error fetching feed preferences:', error);
    res.status(500).json({ error: "Failed to fetch feed preferences" });
  }
});

router.put("/feed-preferences", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { feedMode, novaIntelligence, quickPostEnabled } = req.body;
    
    // Try UserFeedPreference table first
    try {
      const preference = await db.userFeedPreference.upsert({
        where: { userId },
        update: { feedMode, novaIntelligence, quickPostEnabled },
        create: { 
          userId, 
          feedMode: feedMode || "foryou", 
          novaIntelligence: novaIntelligence ?? true, 
          quickPostEnabled: quickPostEnabled ?? true 
        }
      });
      return res.json(preference);
    } catch {
      // Fallback: save to user metadata
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { metadata: true }
      });
      
      const metadata = (user?.metadata as any) || {};
      metadata.feedMode = feedMode;
      metadata.novaIntelligence = novaIntelligence;
      metadata.quickPostEnabled = quickPostEnabled;
      
      await db.user.update({
        where: { id: userId },
        data: { metadata }
      });
      
      res.json({ feedMode, novaIntelligence, quickPostEnabled });
    }
  } catch (error: any) {
    if (isMissingTable(error)) {
      return res.json({ feedMode: "foryou", novaIntelligence: true, quickPostEnabled: true });
    }
    console.error('Error saving feed preferences:', error);
    res.status(500).json({ error: "Failed to save feed preferences" });
  }
});

// ============================================
// CONVERSATIONS (Basic DM System)
// GET /api/v1/community/conversations - List all conversations
// GET /api/v1/community/conversations/:id - Get messages in a conversation
// POST /api/v1/community/conversations - Start a new conversation
// POST /api/v1/community/conversations/:id/messages - Send a message
// ============================================

router.get("/conversations", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    // Get conversations where user is a participant
    const participations = await db.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      },
      orderBy: { conversation: { updatedAt: 'desc' } }
    });
    
    const conversations = participations.map(p => ({
      id: p.conversation.id,
      participants: p.conversation.participants.map((cp: any) => cp.user),
      lastMessage: p.conversation.messages[0] || null,
      updatedAt: p.conversation.updatedAt
    }));
    
    res.json(conversations);
  } catch (error: any) {
    if (isMissingTable(error)) {
      return res.json([]);
    }
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.get("/conversations/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const conversationId = req.params.id as string;
    
    // Verify user is participant
    const participation = await db.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId
      }
    });
    
    if (!participation) {
      return res.status(403).json({ error: "Not a participant" });
    }
    
    const messages = await db.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json(messages);
  } catch (error: any) {
    if (isMissingTable(error)) {
      return res.json([]);
    }
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/conversations", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const tenantId = (req as any).user.tenantId;
    const { participantIds, initialMessage } = req.body;
    
    // Create conversation using unchecked for simpler inserts
    const conversation = await db.conversation.create({
      data: {
        tenantId,
        createdBy: userId,
        participants: {
          create: [
            { userId },
            ...(participantIds || []).map((pid: string) => ({ userId: pid }))
          ]
        }
      } as any,
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    });
    
    // Send initial message if provided
    if (initialMessage) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          content: initialMessage
        }
      });
    }
    
    res.json(conversation);
  } catch (error: any) {
    if (isMissingTable(error)) {
      return res.status(503).json({ error: "Conversations not ready" });
    }
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.post("/conversations/:id/messages", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const conversationId = req.params.id as string;
    const { content } = req.body;
    
    // Verify user is participant
    const participation = await db.conversationParticipant.findFirst({
      where: { conversationId, userId }
    });
    
    if (!participation) {
      return res.status(403).json({ error: "Not a participant" });
    }
    
    const message = await db.message.create({
      data: {
        conversationId,
        senderId: userId,
        content
      },
      include: {
        sender: { select: { id: true, name: true } }
      }
    });
    
    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });
    
    res.json(message);
  } catch (error: any) {
    if (isMissingTable(error)) {
      return res.status(503).json({ error: "Messages not ready" });
    }
    console.error('Error sending message:', error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
