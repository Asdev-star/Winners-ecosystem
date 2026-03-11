// Server/routes/postRoutes.ts
// FIXED: isPinned is the correct field name (schema uses isPinned)
// FIXED: all req.params cast with String()
// Phase 2 V1.1: Added real-time presence API + Voice Posts

import { Router, Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";
import { getOnlineUsers, broadcastToTenant, WS_EVENTS } from "../services/wsService.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; message?: unknown };
  return (
    candidate.code === "P2021" ||
    String(candidate.message ?? "").toLowerCase().includes("does not exist")
  );
}

// ─── GET /posts/online — get online users ───────────────────────────────────────

router.get("/online", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  try {
    const onlineUsers = getOnlineUsers(tenantId);
    res.json({ onlineUsers, onlineCount: onlineUsers.length });
  } catch (error) {
    console.error("[presence] Error getting online users:", error);
    res.status(500).json({ error: "Failed to get online users" });
  }
});

// ─── GET /posts — feed ────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId   = req.user!.userId;
  const page     = parseInt(String(req.query.page  ?? "1"));
  const limit    = parseInt(String(req.query.limit ?? "20"));
  const tag      = String(req.query.tag ?? "").trim();

  try {
    const where: Prisma.PostWhereInput = { tenantId, deletedAt: null };
    if (tag) where.tags = { some: { tag: { name: tag } } };

    const [posts, total, pinned] = await Promise.all([
      db.post.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip:    (page - 1) * limit,
        take:    limit,
        include: {
          author:   { select: { id: true, name: true, email: true } },
          _count:   { select: { likes: true, comments: true } },
          likes:    { where: { userId }, select: { id: true } },
          tags:     { include: { tag: true } },
        },
      }),
      db.post.count({ where }),
      db.post.findMany({
        where:   { tenantId, isPinned: true, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
          _count: { select: { likes: true, comments: true } },
          likes:  { where: { userId }, select: { id: true } },
          tags:   { include: { tag: true } },
        },
      }),
    ]);

    return res.json({
      posts: posts.map((p) => ({
        ...p,
        likeCount:    p._count.likes,
        commentCount: p._count.comments,
        liked:        p.likes.length > 0,
        tags:         p.tags.map((t) => t.tag.name),
      })),
      pinned: pinned.map((p) => ({
        ...p,
        likeCount:    p._count.likes,
        commentCount: p._count.comments,
        liked:        p.likes.length > 0,
        tags:         p.tags.map((t) => t.tag.name),
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error("Get posts error:", error);
    if (isMissingTableError(error)) {
      return res.json({
        posts: [],
        pinned: [],
        total: 0,
        page,
        pages: 0,
        hasMore: false,
      });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /posts — create post ────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const authorId = req.user!.userId;
  const { content, mediaUrl, mediaType, linkUrl, linkTitle, tags, groupId } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ message: "Content is required" });
  }

  try {
    const tagRecords = await Promise.all(
      (tags ?? []).map((name: string) =>
        db.tag.upsert({
          where:  { name: name.toLowerCase().trim() },
          update: {},
          create: { name: name.toLowerCase().trim() },
        })
      )
    );

    const post = await db.post.create({
      data: {
        tenantId,
        authorId,
        content: content.trim(),
        mediaUrl:  mediaUrl  ?? null,
        mediaType: mediaType ?? null,
        linkUrl:   linkUrl   ?? null,
        linkTitle: linkTitle ?? null,
        groupId:   groupId   ?? null,
        tags: {
          create: tagRecords.map((tag) => ({ tagId: tag.id })),
        },
      },
      include: {
        author:   { select: { id: true, name: true, email: true } },
        _count:   { select: { likes: true, comments: true } },
        tags:     { include: { tag: true } },
      },
    });

    // Broadcast new post to all connected clients for live feed updates
    broadcastToTenant(tenantId, {
      type:    WS_EVENTS.NEW_POST,
      post:   { id: post.id, content: post.content, author: { id: authorId } },
      subtype: "FEED_POST",
    });

    return res.status(201).json({
      ...post,
      likeCount:    post._count.likes,
      commentCount: post._count.comments,
      liked:        false,
      tags:         post.tags.map((t) => t.tag.name),
    });
  } catch (error) {
    console.error("Create post error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /posts/voice — create voice post ─────────────────────────────────────

router.post("/voice", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const authorId = req.user!.userId;
  const { content, voiceData, tags } = req.body;

  if (!voiceData) {
    return res.status(400).json({ message: "Voice data is required" });
  }

  try {
    const tagRecords = await Promise.all(
      (tags ? JSON.parse(tags) : []).map((name: string) =>
        db.tag.upsert({
          where:  { name: name.toLowerCase().trim() },
          update: {},
          create: { name: name.toLowerCase().trim() },
        })
      )
    );

    const post = await db.post.create({
      data: {
        tenantId,
        authorId,
        content: content?.trim() || "🎤 Voice post",
        mediaUrl:  voiceData, // base64 data URL
        mediaType: "voice",
        tags: {
          create: tagRecords.map((tag) => ({ tagId: tag.id })),
        },
      },
      include: {
        author:   { select: { id: true, name: true, email: true } },
        _count:   { select: { likes: true, comments: true } },
        tags:     { include: { tag: true } },
      },
    });

    return res.status(201).json({
      ...post,
      likeCount:    post._count.likes,
      commentCount: post._count.comments,
      liked:        false,
      tags:         post.tags.map((t) => t.tag.name),
    });
  } catch (error) {
    console.error("Create voice post error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /posts/:id ───────────────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId   = req.user!.userId;
  const postId   = String(req.params.id);

  try {
    const post = await db.post.findFirst({
      where:   { id: postId, tenantId, deletedAt: null },
      include: {
        author:   { select: { id: true, name: true, email: true } },
        _count:   { select: { likes: true, comments: true } },
        likes:    { where: { userId }, select: { id: true } },
        tags:     { include: { tag: true } },
        comments: {
          where:   { deletedAt: null, parentId: null, tenantId },
          orderBy: { createdAt: "asc" },
          include: {
            author:   { select: { id: true, name: true, email: true } },
            _count:   { select: { likes: true, replies: true } },
            likes:    { where: { userId }, select: { id: true } },
            replies: {
              where:   { deletedAt: null, tenantId },
              orderBy: { createdAt: "asc" },
              include: {
                author: { select: { id: true, name: true, email: true } },
                _count: { select: { likes: true } },
                likes:  { where: { userId }, select: { id: true } },
              },
            },
          },
        },
      },
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    return res.json({
      ...post,
      likeCount:    post._count.likes,
      commentCount: post._count.comments,
      liked:        post.likes.length > 0,
      tags:         post.tags.map((t) => t.tag.name),
    });
  } catch (error) {
    console.error("Get post error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── PATCH /posts/:id — edit post ────────────────────────────────────────────

router.patch("/:id", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId   = req.user!.userId;
  const postId   = String(req.params.id);
  const { content } = req.body;

  if (!content?.trim()) return res.status(400).json({ message: "Content is required" });

  try {
    const post = await db.post.findFirst({
      where: { id: postId, tenantId, deletedAt: null },
    });

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.authorId !== userId) return res.status(403).json({ message: "Not your post" });

    const updated = await db.post.update({
      where: { id: postId, tenantId },
      data:  { content: content.trim(), edited: true },
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { likes: true, comments: true } },
        tags:   { include: { tag: true } },
      },
    });

    return res.json({
      ...updated,
      likeCount:    updated._count.likes,
      commentCount: updated._count.comments,
      tags:         updated.tags.map((t) => t.tag.name),
    });
  } catch (error) {
    console.error("Edit post error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── DELETE /posts/:id ────────────────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId   = req.user!.userId;
  const postId   = String(req.params.id);
  const role     = req.user!.role;

  try {
    const post = await db.post.findFirst({
      where: { id: postId, tenantId, deletedAt: null },
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    const canDelete = post.authorId === userId || ["owner", "admin"].includes(role);
    if (!canDelete) return res.status(403).json({ message: "Cannot delete this post" });

    await db.post.update({
      where: { id: postId, tenantId },
      data:  { deletedAt: new Date() },
    });

    return res.json({ message: "Post deleted" });
  } catch (error) {
    console.error("Delete post error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /posts/:id/like — toggle like ──────────────────────────────────────

router.post("/:id/like", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId   = req.user!.userId;
  const postId   = String(req.params.id);

  try {
    const post = await db.post.findFirst({
      where: { id: postId, tenantId, deletedAt: null },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const existing = await db.like.findUnique({
      where: { userId_postId_tenantId: { userId, postId, tenantId } },
    });

    if (existing) {
      await db.like.delete({ where: { userId_postId_tenantId: { userId, postId, tenantId } } });
      const count = await db.like.count({ where: { postId, tenantId } });
      return res.json({ liked: false, likeCount: count });
    } else {
      await db.like.create({ data: { userId, postId, tenantId } });
      const count = await db.like.count({ where: { postId, tenantId } });
      return res.json({ liked: true, likeCount: count });
    }
  } catch (error) {
    console.error("Like post error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /posts/:id/react — six-reaction system ─────────────────────────────────

const REACTION_TYPES = ["❤️", "🔥", "💡", "👏", "😂", "😱"];

router.post("/:id/react", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId   = req.user!.userId;
  const postId   = String(req.params.id);
  const reaction = String(req.body?.reaction || "");

  if (!REACTION_TYPES.includes(reaction)) {
    return res.status(400).json({ message: "Invalid reaction type" });
  }

  try {
    const post = await db.post.findFirst({
      where: { id: postId, tenantId, deletedAt: null },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check existing reaction of any type for this user on this post
    const existing = await db.postReaction.findFirst({
      where: { userId, postId, tenantId },
    });

    if (existing) {
      if (existing.reaction === reaction) {
        // Remove reaction if same
        await db.postReaction.delete({ 
          where: { userId_postId_reaction_tenantId: { userId, postId, reaction, tenantId } } 
        });
      } else {
        // Update to new reaction
        await db.postReaction.update({
          where: { id: existing.id, tenantId },
          data: { reaction },
        });
      }
    } else {
      // Create new reaction
      await db.postReaction.create({
        data: { userId, postId, reaction, tenantId },
      });
    }

    // Get all reactions for this post
    const reactions = await db.postReaction.findMany({
      where: { postId, tenantId },
      select: { reaction: true, userId: true },
    });

    const userReaction = reactions.find((r) => r.userId === userId)?.reaction || null;

    return res.json({ reactions, userReaction });
  } catch (error) {
    console.error("Reaction error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /posts/:id/comments ──────────────────────────────────────────────────

router.get("/:id/comments", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId   = req.user!.userId;
  const postId   = String(req.params.id);

  try {
    const post = await db.post.findFirst({
      where: { id: postId, tenantId, deletedAt: null },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comments = await db.comment.findMany({
      where:   { postId, parentId: null, deletedAt: null, tenantId },
      orderBy: { createdAt: "asc" },
      include: {
        author:   { select: { id: true, name: true, email: true } },
        _count:   { select: { likes: true, replies: true } },
        likes:    { where: { userId }, select: { id: true } },
        replies: {
          where:   { deletedAt: null, tenantId },
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, email: true } },
            _count: { select: { likes: true } },
            likes:  { where: { userId }, select: { id: true } },
          },
        },
      },
    });

    return res.json(
      comments.map((c) => ({
        ...c,
        likeCount:   c._count.likes,
        replyCount:  c._count.replies,
        liked:       c.likes.length > 0,
        replies:     c.replies.map((r) => ({
          ...r,
          likeCount: r._count.likes,
          liked:     r.likes.length > 0,
        })),
      }))
    );
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /posts/:id/comments — add comment ───────────────────────────────────

router.post("/:id/comments", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const authorId = req.user!.userId;
  const postId   = String(req.params.id);
  const { content, parentId } = req.body;

  if (!content?.trim()) return res.status(400).json({ message: "Content is required" });

  try {
    const post = await db.post.findFirst({
      where: { id: postId, tenantId, deletedAt: null },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await db.comment.create({
      data: {
        postId,
        authorId,
        tenantId,
        content:  content.trim(),
        parentId: parentId ?? null,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { likes: true, replies: true } },
      },
    });

    return res.status(201).json({
      ...comment,
      likeCount:  comment._count.likes,
      replyCount: comment._count.replies,
      liked:      false,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── DELETE /posts/:id/comments/:commentId ────────────────────────────────────

router.delete("/:id/comments/:commentId", async (req: Request, res: Response) => {
  const tenantId   = req.user!.tenantId;
  const userId     = req.user!.userId;
  const role       = req.user!.role;
  const postId     = String(req.params.id);
  const commentId  = String(req.params.commentId);

  try {
    const post = await db.post.findFirst({
      where: { id: postId, tenantId, deletedAt: null },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await db.comment.findFirst({
      where: { id: commentId, postId, tenantId, deletedAt: null },
    });
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const canDelete = comment.authorId === userId || ["owner", "admin"].includes(role);
    if (!canDelete) return res.status(403).json({ message: "Cannot delete this comment" });

    await db.comment.update({
      where: { id: commentId, tenantId },
      data:  { deletedAt: new Date() },
    });

    return res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /posts/:id/comments/:commentId/like ─────────────────────────────────

router.post("/:id/comments/:commentId/like", async (req: Request, res: Response) => {
  const tenantId  = req.user!.tenantId;
  const userId    = req.user!.userId;
  const commentId = String(req.params.commentId);

  try {
    const existing = await db.like.findFirst({
      where: { userId, commentId, tenantId },
    });

    if (existing) {
      await db.like.delete({ where: { id: existing.id } });
      const count = await db.like.count({ where: { commentId, tenantId } });
      return res.json({ liked: false, likeCount: count });
    } else {
      await db.like.create({ data: { userId, commentId, tenantId } });
      const count = await db.like.count({ where: { commentId, tenantId } });
      return res.json({ liked: true, likeCount: count });
    }
  } catch (error) {
    console.error("Like comment error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

