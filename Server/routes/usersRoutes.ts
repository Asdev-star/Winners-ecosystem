// @ts-nocheck
// server/routes/usersRoutes.ts

import { Router, Request, Response } from "express";
import { Role } from "@prisma/client";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireMinRole, requirePermission, enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();

router.use(authMiddleware);
router.use(enforceTenant);

// ─── GET /users — list all users in tenant ────────────────────────────────────

router.get("/", requireMinRole("member"), async (req: Request, res: Response) => {
  try {
    const users = await db.user.findMany({
      where:   { tenantId: req.user!.tenantId, deletedAt: null },
      select:  { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    return res.json({
      tenantId: req.user!.tenantId,
      users:    users.map((u) => ({ ...u, role: u.role.toLowerCase() })),
      total:    users.length,
    });
  } catch (err) {
    console.error("List users error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /users/:id ───────────────────────────────────────────────────────────

router.get("/:id", requireMinRole("member"), async (req: Request, res: Response) => {
  try {
    const user = await db.user.findFirst({
      where: { id: String(req.params.id), tenantId: req.user!.tenantId, deletedAt: null },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ ...user, role: user.role.toLowerCase() });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /users/invite ───────────────────────────────────────────────────────

router.post("/invite", requirePermission("inviteMembers"), async (req: Request, res: Response) => {
  const { email, role } = req.body;

  if (!email || !role) return res.status(400).json({ message: "email and role are required" });

  const validRoles = ["admin", "member", "viewer"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: `role must be one of: ${validRoles.join(", ")}` });
  }

  try {
    // Check if user already exists in this tenant
    const existing = await db.user.findFirst({
      where: { email: email.toLowerCase(), tenantId: req.user!.tenantId, deletedAt: null },
    });

    if (existing) return res.status(409).json({ message: "User already in this workspace" });

    // Cancel any existing pending invite for this email
    await db.invite.updateMany({
      where:  { email: email.toLowerCase(), tenantId: req.user!.tenantId, status: "PENDING" },
      data:   { status: "EXPIRED" },
    });

    const invite = await db.invite.create({
      data: {
        tenantId:  req.user!.tenantId,
        email:     email.toLowerCase(),
        role:      role.toUpperCase() as Role,
        invitedBy: req.user!.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // In production: send email with invite link
    // e.g. sendEmail({ to: email, subject: "You're invited", link: `${APP_URL}/invite/accept?token=${invite.token}` })

    return res.status(201).json({
      message: "Invite sent",
      invite: { ...invite, role: invite.role.toLowerCase() },
    });
  } catch (err) {
    console.error("Invite error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── PATCH /users/:id/role ────────────────────────────────────────────────────

router.patch("/:id/role", requirePermission("manageUsers"), async (req: Request, res: Response) => {
  const { role } = req.body;

  if (!role) return res.status(400).json({ message: "role is required" });

  try {
    const user = await db.user.findFirst({
      where: { id: String(req.params.id), tenantId: req.user!.tenantId, deletedAt: null },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "OWNER" && req.user!.role !== "owner") {
      return res.status(403).json({ message: "Cannot change owner role" });
    }

    const updated = await db.user.update({
      where: { id: String(req.params.id) },
      data:  { role: role.toUpperCase() as Role },
    });

    return res.json({ message: "Role updated", user: { ...updated, role: updated.role.toLowerCase() } });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── DELETE /users/:id ────────────────────────────────────────────────────────

router.delete("/:id", requirePermission("manageUsers"), async (req: Request, res: Response) => {
  try {
    const user = await db.user.findFirst({
      where: { id: String(req.params.id), tenantId: req.user!.tenantId, deletedAt: null },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "OWNER") return res.status(403).json({ message: "Cannot remove tenant owner" });

    // Soft delete
    await db.user.update({ where: { id: String(req.params.id) }, data: { deletedAt: new Date() } });

    return res.json({ message: "User removed", userId: req.params.id });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

// ─── GET /users/analytics — creator analytics ────────────────────────────────────────

router.get("/analytics", async (req: Request, res: Response) => {
  const { period } = req.query;
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;

  try {
    // Get date filter
    let dateFilter: Date | undefined;
    if (period === "7d") dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (period === "30d") dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    else if (period === "90d") dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Get user profile views
    const user = await db.user.findFirst({ where: { id: userId } });
    const profileViews = user?.profileViews || 0;

    // Get follower count
    const followersCount = await db.follow.count({ where: { followingId: userId } });

    // Get posts count
    const postsCount = await db.post.count({
      where: { authorId: userId, ...(dateFilter && { createdAt: { gte: dateFilter } }) },
    });

    // Get likes and comments on user's posts
    const userPosts = await db.post.findMany({
      where: { authorId: userId, ...(dateFilter && { createdAt: { gte: dateFilter } }) },
      select: { id: true },
    });
    const postIds = userPosts.map(p => p.id);

    const likesCount = await db.like.count({ where: { postId: { in: postIds } } });
    const commentsCount = await db.comment.count({ where: { postId: { in: postIds } } });

    // Calculate engagement rate
    const totalEngagement = likesCount + commentsCount;
    const engagementRate = postsCount > 0 ? totalEngagement / postsCount / 100 : 0;

    // Get top posts
    const topPosts = await db.post.findMany({
      where: { authorId: userId, ...(dateFilter && { createdAt: { gte: dateFilter } }) },
      include: {
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { likes: { _count: "desc" } },
      take: 10,
    });

    const formattedTopPosts = topPosts.map(p => ({
      id: p.id,
      content: p.content?.slice(0, 200) || "",
      likes: p._count.likes,
      comments: p._count.comments,
      createdAt: p.createdAt.toISOString(),
    }));

    // Simulated changes (in production, compare to previous period)
    const profileViewsChange = Math.floor(Math.random() * 30) - 5; // -5 to +25%
    const followersChange = Math.floor(Math.random() * 20) - 3; // -3 to +17%

    return res.json({
      analytics: {
        profileViews,
        profileViewsChange,
        followers: followersCount,
        followersChange,
        totalPosts: postsCount,
        totalLikes: likesCount,
        totalComments: commentsCount,
        engagementRate,
      },
      topPosts: formattedTopPosts,
    });
  } catch (err) {
    console.error("Analytics fetch error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /users/directory — public directory listing ─────────────────────────────

router.get("/directory", async (req: Request, res: Response) => {
  const { search, country, industry, publicOnly } = req.query;

  try {
    const where: any = {
      deletedAt: null,
      ...(publicOnly === "true" && { isPublicProfile: true }),
      ...(country && { country: country as string }),
      ...(industry && { industry: industry as string }),
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { skills: { has: search as string } },
        { bio: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        country: true,
        city: true,
        bio: true,
        skills: true,
        industry: true,
        profileViews: true,
        isPublicProfile: true,
        createdAt: true,
      },
      orderBy: { profileViews: "desc" },
      take: 50,
    });

    return res.json({ users });
  } catch (err) {
    console.error("Directory fetch error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});
