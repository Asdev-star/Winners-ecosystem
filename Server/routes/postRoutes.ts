// Server/routes/postRoutes.ts
// FIXED: isPinned is the correct field name (schema uses isPinned)
// FIXED: all req.params cast with String()
// Phase 2 V1.1: Added real-time presence API + Voice Posts

import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";
import { getOnlineUsers } from "../services/wsService.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

function isMissingTableError(err: any) {
  return err?.code === "P2021" || String(err?.message ?? "").toLowerCase().includes("does not exist");
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
    const where: any = { tenantId, deletedAt: null };
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
  } catch (err: any) {
    console.error("Get posts error:", err);
    if (isMissingTableError(err)) {
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

    return res.status(201).json({
      ...post,
      likeCount:    post._count.likes,
      commentCount: post._count.comments,
      liked:        false,
      tags:         post.tags.map((t) => t.tag.name),
    });
  } catch (err: any) {
    console.error("Create post error:", err);
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
  } catch (err: any) {
    console.error("Create voice post error:", err);
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
          where:   { deletedAt: null, parentId: null },
          orderBy: { createdAt: "asc" },
          include: {
            author:   { select: { id: true, name: true, email: true } },
            _count:   { select: { likes: true, replies: true } },
            likes:    { where: { userId }, select: { id: true } },
            replies: {
              where:   { deletedAt: null },
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
  } catch (err: any) {
    console.error("Get post error:", err);
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
      where: { id: postId },
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
  } catch (err: any) {
    console.error("Edit post error:", err);
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
      where: { id: postId },
      data:  { deletedAt: new Date() },
    });

    return res.json({ message: "Post deleted" });
  } catch (err: any) {
    console.error("Delete post error:", err);
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
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await db.like.delete({ where: { userId_postId: { userId, postId } } });
      const count = await db.like.count({ where: { postId } });
      return res.json({ liked: false, likeCount: count });
    } else {
      await db.like.create({ data: { userId, postId } });
      const count = await db.like.count({ where: { postId } });
      return res.json({ liked: true, likeCount: count });
    }
  } catch (err: any) {
    console.error("Like post error:", err);
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
      where:   { postId, parentId: null, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        author:   { select: { id: true, name: true, email: true } },
        _count:   { select: { likes: true, replies: true } },
        likes:    { where: { userId }, select: { id: true } },
        replies: {
          where:   { deletedAt: null },
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
  } catch (err: any) {
    console.error("Get comments error:", err);
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
  } catch (err: any) {
    console.error("Add comment error:", err);
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
      where: { id: commentId, postId, deletedAt: null },
    });
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const canDelete = comment.authorId === userId || ["owner", "admin"].includes(role);
    if (!canDelete) return res.status(403).json({ message: "Cannot delete this comment" });

    await db.comment.update({
      where: { id: commentId },
      data:  { deletedAt: new Date() },
    });

    return res.json({ message: "Comment deleted" });
  } catch (err: any) {
    console.error("Delete comment error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /posts/:id/comments/:commentId/like ─────────────────────────────────

router.post("/:id/comments/:commentId/like", async (req: Request, res: Response) => {
  const userId    = req.user!.userId;
  const commentId = String(req.params.commentId);

  try {
    const existing = await db.like.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      await db.like.delete({ where: { userId_commentId: { userId, commentId } } });
      const count = await db.like.count({ where: { commentId } });
      return res.json({ liked: false, likeCount: count });
    } else {
      await db.like.create({ data: { userId, commentId } });
      const count = await db.like.count({ where: { commentId } });
      return res.json({ liked: true, likeCount: count });
    }
  } catch (err: any) {
    console.error("Like comment error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
