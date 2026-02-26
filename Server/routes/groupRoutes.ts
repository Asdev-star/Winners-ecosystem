// @ts-nocheck
// Server/routes/groupRoutes.ts
// Phase 2 — Community Layer V1.2: Groups
// Register in Server/index.ts: app.use("/groups", groupRoutes)

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";
import { broadcastToTenant, WS_EVENTS } from "../services/wsService.js";

const router = Router();
router.use(authMiddleware);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ─── GET /groups — list all groups in tenant ─────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any;

    const groups = await db.group.findMany({
      where: { tenantId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, posts: true } },
        members: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = groups.map((g) => ({
      ...g,
      memberCount: g._count.members,
      postCount:   g._count.posts,
      isMember:    g.members.length > 0,
      myRole:      g.members[0]?.role ?? null,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// ─── POST /groups — create group ─────────────────────────────────────────────

router.post("/", async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any;
    const { name, description, isPrivate = false } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: "Name required" });

    // Ensure unique slug within tenant
    let slug     = slugify(name);
    const existing = await db.group.findFirst({ where: { tenantId, slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const group = await db.group.create({
      data: {
        tenantId,
        name:        name.trim(),
        slug,
        description: description?.trim(),
        isPrivate,
        createdById: userId,
        members: {
          create: { userId, role: "OWNER" },
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count:    { select: { members: true, posts: true } },
      },
    });

    // Notify tenant of new group
    broadcastToTenant(tenantId, {
      type:    WS_EVENTS.NEW_POST,
      subtype: "NEW_GROUP",
      group:   { id: group.id, name: group.name, slug: group.slug },
    });

    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// ─── GET /groups/:slug — get group detail ────────────────────────────────────

router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any;
    const { slug } = req.params;

    const group = await db.group.findFirst({
      where: { tenantId, slug },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count:    { select: { members: true, posts: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { joinedAt: "asc" },
          take: 20,
        },
      },
    });

    if (!group) return res.status(404).json({ error: "Group not found" });

    const myMembership = group.members.find((m) => m.userId === userId);

    if (group.isPrivate && !myMembership) {
      return res.status(403).json({ error: "Private group — join to view" });
    }

    res.json({
      ...group,
      isMember: !!myMembership,
      myRole:   myMembership?.role ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch group" });
  }
});

// ─── POST /groups/:slug/join — join group ────────────────────────────────────

router.post("/:slug/join", async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any;
    const { slug } = req.params;

    const group = await db.group.findFirst({ where: { tenantId, slug } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    const existing = await db.groupMember.findFirst({
      where: { groupId: group.id, userId },
    });
    if (existing) return res.status(400).json({ error: "Already a member" });

    await db.groupMember.create({
      data: { groupId: group.id, userId, role: "MEMBER" },
    });

    res.json({ success: true, groupId: group.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to join group" });
  }
});

// ─── POST /groups/:slug/leave — leave group ──────────────────────────────────

router.post("/:slug/leave", async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any;
    const { slug } = req.params;

    const group = await db.group.findFirst({ where: { tenantId, slug } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    // Owner can't leave — they must transfer or delete
    const membership = await db.groupMember.findFirst({
      where: { groupId: group.id, userId },
    });
    if (!membership) return res.status(400).json({ error: "Not a member" });
    if (membership.role === "OWNER") {
      return res.status(400).json({ error: "Owner cannot leave — delete group or transfer ownership" });
    }

    await db.groupMember.delete({ where: { id: membership.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to leave group" });
  }
});

// ─── GET /groups/:slug/posts — group feed ────────────────────────────────────

router.get("/:slug/posts", async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any;
    const { slug } = req.params;
    const page  = parseInt(req.query.page as string) || 1;
    const limit = 20;

    const group = await db.group.findFirst({ where: { tenantId, slug } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    // Private group — members only
    if (group.isPrivate) {
      const membership = await db.groupMember.findFirst({
        where: { groupId: group.id, userId },
      });
      if (!membership) return res.status(403).json({ error: "Join group to view posts" });
    }

    const posts = await db.post.findMany({
      where:   { tenantId, groupId: group.id },
      include: {
        author:   { select: { id: true, name: true, email: true } },
        _count:   { select: { likes: true, comments: true } },
        tags:     { include: { tag: true } },
        likes:    { where: { userId }, select: { id: true } },
        comments: {
          take:    3,
          orderBy: { createdAt: "desc" },
          include: { author: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip:    (page - 1) * limit,
      take:    limit,
    });

    const total = await db.post.count({ where: { tenantId, groupId: group.id } });

    res.json({
      posts: posts.map((p) => ({
        ...p,
        likeCount:    p._count.likes,
        commentCount: p._count.comments,
        likedByMe:    p.likes.length > 0,
        tags:         p.tags.map((t) => t.tag.name),
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch group posts" });
  }
});

// ─── PATCH /groups/:slug — update group (admin/owner only) ───────────────────

router.patch("/:slug", async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any;
    const { slug } = req.params;
    const { name, description, isPrivate } = req.body;

    const group = await db.group.findFirst({ where: { tenantId, slug } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    const membership = await db.groupMember.findFirst({
      where: { groupId: group.id, userId },
    });
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const updated = await db.group.update({
      where: { id: group.id },
      data: {
        ...(name        !== undefined && { name:        name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(isPrivate   !== undefined && { isPrivate }),
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update group" });
  }
});

// ─── DELETE /groups/:slug — delete group (owner only) ────────────────────────

router.delete("/:slug", async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any;
    const { slug } = req.params;

    const group = await db.group.findFirst({ where: { tenantId, slug } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    const membership = await db.groupMember.findFirst({
      where: { groupId: group.id, userId },
    });
    if (!membership || membership.role !== "OWNER") {
      return res.status(403).json({ error: "Only owner can delete group" });
    }

    // Cascade handled by Prisma schema (onDelete: Cascade on GroupMember)
    // Unlink posts from group but don't delete them
    await db.post.updateMany({
      where: { groupId: group.id },
      data:  { groupId: null },
    });

    await db.group.delete({ where: { id: group.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete group" });
  }
});

// ─── PATCH /groups/:slug/members/:userId — change member role ────────────────

router.patch("/:slug/members/:memberId/role", async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any;
    const { slug, memberId } = req.params;
    const { role } = req.body;

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({ error: "Role must be ADMIN or MEMBER" });
    }

    const group = await db.group.findFirst({ where: { tenantId, slug } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    const myMembership = await db.groupMember.findFirst({
      where: { groupId: group.id, userId },
    });
    if (!myMembership || !["OWNER", "ADMIN"].includes(myMembership.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const target = await db.groupMember.findFirst({
      where: { groupId: group.id, userId: memberId },
    });
    if (!target) return res.status(404).json({ error: "Member not found" });
    if (target.role === "OWNER") return res.status(400).json({ error: "Cannot change owner role" });

    const updated = await db.groupMember.update({
      where: { id: target.id },
      data:  { role },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update member role" });
  }
});

export default router;

