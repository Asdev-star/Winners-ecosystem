// Phase 2 Layer 2 - Community Backend Extras
// Saved posts, feed preferences, conversations

import type { Prisma } from "@prisma/client";
import { Router, type Request, type Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; message?: unknown };
  const message = String(candidate.message ?? "").toLowerCase();
  return (
    candidate.code === "P2021" ||
    candidate.code === "P2022" ||
    message.includes("does not exist")
  );
}

function metadataObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function boolOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

router.get("/posts/saved", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const savedPosts = await db.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: { likes: true, comments: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(savedPosts.map((savedPost) => savedPost.post));
  } catch (error) {
    if (isMissingTable(error)) return res.json([]);
    console.error("Error fetching saved posts:", error);
    return res.status(500).json({ error: "Failed to fetch saved posts" });
  }
});

router.post("/posts/:postId/save", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const postId = String(req.params.postId);

    const existing = await db.savedPost.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existing) {
      await db.savedPost.delete({ where: { id: existing.id } });
      return res.json({ saved: false });
    }

    await db.savedPost.create({ data: { userId, postId } });
    return res.json({ saved: true });
  } catch (error) {
    if (isMissingTable(error)) return res.json({ saved: false, error: "Table not ready" });
    console.error("Error toggling save:", error);
    return res.status(500).json({ error: "Failed to toggle save" });
  }
});

router.get("/feed-preferences", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const preference = await db.userFeedPreference.findUnique({
      where: { userId },
    });

    if (preference) {
      return res.json({
        feedMode: preference.feedMode,
        novaIntelligence: preference.novaIntelligence,
        quickPostEnabled: preference.quickPostEnabled,
      });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });

    const metadata = metadataObject(user?.metadata);
    return res.json({
      feedMode: stringOrDefault(metadata.feedMode, "foryou"),
      novaIntelligence: boolOrDefault(metadata.novaIntelligence, true),
      quickPostEnabled: boolOrDefault(metadata.quickPostEnabled, true),
    });
  } catch (error) {
    if (isMissingTable(error)) {
      return res.json({ feedMode: "foryou", novaIntelligence: true, quickPostEnabled: true });
    }
    console.error("Error fetching feed preferences:", error);
    return res.status(500).json({ error: "Failed to fetch feed preferences" });
  }
});

router.put("/feed-preferences", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const body: {
      feedMode?: unknown;
      novaIntelligence?: unknown;
      quickPostEnabled?: unknown;
    } = req.body && typeof req.body === "object" ? req.body : {};

    const feedMode = stringOrDefault(body.feedMode, "foryou");
    const novaIntelligence = boolOrDefault(body.novaIntelligence, true);
    const quickPostEnabled = boolOrDefault(body.quickPostEnabled, true);

    try {
      const preference = await db.userFeedPreference.upsert({
        where: { userId },
        update: { feedMode, novaIntelligence, quickPostEnabled },
        create: { userId, feedMode, novaIntelligence, quickPostEnabled },
      });
      return res.json(preference);
    } catch {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { metadata: true },
      });

      const metadata = metadataObject(user?.metadata);
      const updatedMetadata: Record<string, unknown> = {
        ...metadata,
        feedMode,
        novaIntelligence,
        quickPostEnabled,
      };

      await db.user.update({
        where: { id: userId },
        data: { metadata: updatedMetadata as Prisma.InputJsonValue },
      });

      return res.json({ feedMode, novaIntelligence, quickPostEnabled });
    }
  } catch (error) {
    if (isMissingTable(error)) {
      return res.json({ feedMode: "foryou", novaIntelligence: true, quickPostEnabled: true });
    }
    console.error("Error saving feed preferences:", error);
    return res.status(500).json({ error: "Failed to save feed preferences" });
  }
});

router.get("/conversations", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const participations = await db.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
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
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
    });

    const conversations = participations.map((participation) => ({
      id: participation.conversation.id,
      participants: participation.conversation.participants.map((conversationParticipant) => conversationParticipant.user),
      lastMessage: participation.conversation.messages[0] ?? null,
      updatedAt: participation.conversation.updatedAt,
    }));

    return res.json(conversations);
  } catch (error) {
    if (isMissingTable(error)) return res.json([]);
    console.error("Error fetching conversations:", error);
    return res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.get("/conversations/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const conversationId = String(req.params.id);

    const participation = await db.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participation) return res.status(403).json({ error: "Not a participant" });

    const messages = await db.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.json(messages);
  } catch (error) {
    if (isMissingTable(error)) return res.json([]);
    console.error("Error fetching messages:", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/conversations", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const body: { participantIds?: unknown; initialMessage?: unknown } =
      req.body && typeof req.body === "object" ? req.body : {};

    const participantIds = Array.isArray(body.participantIds)
      ? body.participantIds.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];
    const initialMessage =
      typeof body.initialMessage === "string" && body.initialMessage.trim().length > 0
        ? body.initialMessage.trim()
        : "";

    const uniqueIds = new Set<string>([userId, ...participantIds]);
    const participantCreates = [...uniqueIds].map((id) => ({ userId: id }));

    const conversation = await db.conversation.create({
      data: {
        tenantId,
        createdById: userId,
        participants: {
          create: participantCreates,
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (initialMessage) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          content: initialMessage,
        },
      });
    }

    return res.json(conversation);
  } catch (error) {
    if (isMissingTable(error)) return res.status(503).json({ error: "Conversations not ready" });
    console.error("Error creating conversation:", error);
    return res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.post("/conversations/:id/messages", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const conversationId = String(req.params.id);
    const content =
      typeof req.body?.content === "string" ? req.body.content.trim() : "";

    if (!content) return res.status(400).json({ error: "Message content is required" });

    const participation = await db.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participation) return res.status(403).json({ error: "Not a participant" });

    const message = await db.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return res.json(message);
  } catch (error) {
    if (isMissingTable(error)) return res.status(503).json({ error: "Messages not ready" });
    console.error("Error sending message:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
