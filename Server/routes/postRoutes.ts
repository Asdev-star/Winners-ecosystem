// Server/routes/postRoutes.ts

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

// ─── POSTS ────────────────────────────────────────────────────────────────────

// GET /posts — feed (paginated, tenant-scoped)
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const page     = parseInt(String(req.query.page  ?? "0"));
    const limit    = parseInt(String(req.query.limit ?? "10"));
    const skip     = page * limit;
    const tenantId = req.user!.tenantId;

    const posts = await db.post.findMany({
      where:   { tenantId, deletedAt: null },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip, take: limit,
      include: {
        author: { select: { id: true, name: true, email: true } },
        tags:   { include: { tag: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    const postIds   = posts.map((p) => p.id);
    const userLikes = await db.like.findMany({
      where:  { userId: req.user!.userId, postId: { in: postIds } },
      select: { postId: true },
    });
    const likedSet = new Set(userLikes.map((l) => l.postId));
    const total    = await db.post.count({ where: { tenantId, deletedAt: null } });

    res.json({
      posts:   posts.map((p) => ({ ...p, liked: likedSet.has(p.id) })),
      total, page,
      hasMore: skip + limit < total,
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// POST /posts — create post
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  const { content, mediaUrl, mediaType, linkUrl, linkTitle, tags } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: "Content required" });

  try {
    const post = await db.post.create({
      data: {
        tenantId:  req.user!.tenantId,
        authorId:  req.user!.userId,
        content:   content.trim(),
        mediaUrl,  mediaType, linkUrl, linkTitle,
        tags: tags?.length
          ? {
              create: await Promise.all(
                (tags as string[]).map(async (name: string) => {
                  const tag = await db.tag.upsert({
                    where:  { name: name.toLowerCase() },
                    update: {},
                    create: { name: name.toLowerCase() },
                  });
                  return { tagId: tag.id };
                })
              ),
            }
          : undefined,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        tags:   { include: { tag: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });
    res.status(201).json({ ...post, liked: false });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// GET /posts/:id — single post with comments
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const post = await db.post.findFirst({
      where: { id, tenantId: req.user!.tenantId, deletedAt: null },
      include: {
        author: { select: { id: true, name: true, email: true } },
        tags:   { include: { tag: true } },
        _count: { select: { comments: true, likes: true } },
        comments: {
          where:   { deletedAt: null, parentId: null },
          orderBy: { createdAt: "asc" },
          include: {
            author:  { select: { id: true, name: true, email: true } },
            replies: {
              where:   { deletedAt: null },
              orderBy: { createdAt: "asc" },
              include: { author: { select: { id: true, name: true, email: true } } },
            },
            _count: { select: { likes: true } },
          },
        },
      },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userLike = await db.like.findUnique({
      where: { userId_postId: { userId: req.user!.userId, postId: id } },
    });
    res.json({ ...post, liked: !!userLike });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// PATCH /posts/:id — edit post
router.patch("/:id", authMiddleware, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: "Content required" });
  try {
    const post = await db.post.findFirst({ where: { id, authorId: req.user!.userId, deletedAt: null } });
    if (!post) return res.status(404).json({ message: "Post not found or not yours" });

    const updated = await db.post.update({
      where:   { id },
      data:    { content: content.trim(), edited: true },
      include: { author: { select: { id: true, name: true, email: true } }, _count: { select: { comments: true, likes: true } } },
    });
    res.json(updated);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// DELETE /posts/:id — soft delete
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const post = await db.post.findFirst({ where: { id, authorId: req.user!.userId, deletedAt: null } });
    if (!post) return res.status(404).json({ message: "Post not found or not yours" });

    await db.post.update({ where: { id }, data: { deletedAt: new Date() } });
    res.json({ message: "Post deleted" });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ─── LIKES ────────────────────────────────────────────────────────────────────

router.post("/:id/like", authMiddleware, async (req: Request, res: Response) => {
  const postId = String(req.params.id);
  const userId = req.user!.userId;
  try {
    const existing = await db.like.findUnique({ where: { userId_postId: { userId, postId } } });
    if (existing) {
      await db.like.delete({ where: { id: existing.id } });
      const count = await db.like.count({ where: { postId } });
      return res.json({ liked: false, count });
    } else {
      await db.like.create({ data: { userId, postId } });
      const count = await db.like.count({ where: { postId } });
      return res.json({ liked: true, count });
    }
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ─── COMMENTS ─────────────────────────────────────────────────────────────────

router.post("/:id/comments", authMiddleware, async (req: Request, res: Response) => {
  const postId = String(req.params.id);
  const { content, parentId } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: "Content required" });
  try {
    const comment = await db.comment.create({
      data: { postId, authorId: req.user!.userId, content: content.trim(), parentId: parentId ?? null },
      include: {
        author:  { select: { id: true, name: true, email: true } },
        replies: { include: { author: { select: { id: true, name: true, email: true } } } },
        _count:  { select: { likes: true } },
      },
    });
    res.status(201).json(comment);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.delete("/:id/comments/:commentId", authMiddleware, async (req: Request, res: Response) => {
  const id        = String(req.params.commentId);
  const authorId  = req.user!.userId;
  try {
    const comment = await db.comment.findFirst({ where: { id, authorId, deletedAt: null } });
    if (!comment) return res.status(404).json({ message: "Comment not found or not yours" });

    await db.comment.update({ where: { id }, data: { deletedAt: new Date() } });
    res.json({ message: "Comment deleted" });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ─── FOLLOWS ──────────────────────────────────────────────────────────────────

router.post("/users/:id/follow", authMiddleware, async (req: Request, res: Response) => {
  const followingId = String(req.params.id);
  const followerId  = req.user!.userId;
  if (followerId === followingId) return res.status(400).json({ message: "Cannot follow yourself" });
  try {
    const existing = await db.follow.findUnique({ where: { followerId_followingId: { followerId, followingId } } });
    if (existing) {
      await db.follow.delete({ where: { id: existing.id } });
      return res.json({ following: false });
    } else {
      await db.follow.create({ data: { followerId, followingId } });
      return res.json({ following: true });
    }
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.get("/users/:id/profile", authMiddleware, async (req: Request, res: Response) => {
  const userId = String(req.params.id);
  try {
    const profile = await db.user.findUnique({
      where:  { id: userId },
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });
    if (!profile) return res.status(404).json({ message: "User not found" });

    const isFollowing = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: req.user!.userId, followingId: userId } },
    });

    const posts = await db.post.findMany({
      where:   { authorId: userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take:    20,
      include: { _count: { select: { comments: true, likes: true } } },
    });

    res.json({ ...profile, isFollowing: !!isFollowing, posts });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

export default router;