// server/routes/usersRoutes.ts

import { Prisma, Role } from "@prisma/client";
import { Router, type Request, type Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant, requireMinRole, requirePermission } from "../middleware/rbacMiddleware.js";

const router = Router();

router.use(authMiddleware);
router.use(enforceTenant);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Internal server error";
}

function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeInviteRole(rawRole: unknown): Role | null {
  if (typeof rawRole !== "string") return null;

  const role = rawRole.trim().toLowerCase();
  if (role === "admin") return Role.ADMIN;
  if (role === "member") return Role.MEMBER;
  if (role === "viewer") return Role.VIEWER;
  return null;
}

router.get("/", requireMinRole("member"), async (req: Request, res: Response) => {
  try {
    const users = await db.user.findMany({
      where: { tenantId: req.user!.tenantId, deletedAt: null },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    return res.json({
      tenantId: req.user!.tenantId,
      users: users.map((user) => ({ ...user, role: user.role.toLowerCase() })),
      total: users.length,
    });
  } catch (error) {
    console.error("List users error:", errorMessage(error));
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/analytics", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const period = queryString(req.query.period) ?? "30d";

  try {
    let dateFilter: Date | undefined;
    if (period === "7d") dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (period === "30d") dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (period === "90d") dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const user = await db.user.findFirst({ where: { id: userId } });
    const profileViews = user?.profileViews ?? 0;
    const followersCount = await db.follow.count({ where: { followingId: userId } });

    const postsCount = await db.post.count({
      where: { authorId: userId, ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}) },
    });

    const userPosts = await db.post.findMany({
      where: { authorId: userId, ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}) },
      select: { id: true },
    });
    const postIds = userPosts.map((post) => post.id);

    const likesCount = await db.like.count({ where: { postId: { in: postIds } } });
    const commentsCount = await db.comment.count({ where: { postId: { in: postIds } } });

    const totalEngagement = likesCount + commentsCount;
    const engagementRate = postsCount > 0 ? totalEngagement / postsCount / 100 : 0;

    const topPosts = await db.post.findMany({
      where: { authorId: userId, ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}) },
      include: {
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { likes: { _count: "desc" } },
      take: 10,
    });

    const formattedTopPosts = topPosts.map((post) => ({
      id: post.id,
      content: post.content?.slice(0, 200) ?? "",
      likes: post._count.likes,
      comments: post._count.comments,
      createdAt: post.createdAt.toISOString(),
    }));

    const profileViewsChange = Math.floor(Math.random() * 30) - 5;
    const followersChange = Math.floor(Math.random() * 20) - 3;

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
  } catch (error) {
    console.error("Analytics fetch error:", errorMessage(error));
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/directory", async (req: Request, res: Response) => {
  const search = queryString(req.query.search);
  const country = queryString(req.query.country);
  const industry = queryString(req.query.industry);
  const publicOnly = queryString(req.query.publicOnly) === "true";

  try {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(publicOnly ? { isPublicProfile: true } : {}),
      ...(country ? { country } : {}),
      ...(industry ? { industry } : {}),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { skills: { has: search } },
        { bio: { contains: search, mode: "insensitive" } },
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
  } catch (error) {
    console.error("Directory fetch error:", errorMessage(error));
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/invite", requirePermission("inviteMembers"), async (req: Request, res: Response) => {
  const body: { email?: unknown; role?: unknown } =
    req.body && typeof req.body === "object"
      ? (req.body as { email?: unknown; role?: unknown })
      : {};

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = normalizeInviteRole(body.role);

  if (!email || !role) {
    return res.status(400).json({ message: "email and role are required" });
  }

  try {
    const existingUser = await db.user.findFirst({
      where: { email, tenantId: req.user!.tenantId, deletedAt: null },
    });
    if (existingUser) {
      return res.status(409).json({ message: "User already in this workspace" });
    }

    await db.invite.deleteMany({
      where: { email, tenantId: req.user!.tenantId, accepted: false },
    });

    const invite = await db.invite.create({
      data: {
        tenantId: req.user!.tenantId,
        email,
        role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.status(201).json({
      message: "Invite sent",
      invite: { ...invite, role: invite.role.toLowerCase() },
    });
  } catch (error) {
    console.error("Invite error:", errorMessage(error));
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/role", requirePermission("manageUsers"), async (req: Request, res: Response) => {
  const role = normalizeInviteRole(req.body?.role);

  if (!role) return res.status(400).json({ message: "role is required" });

  try {
    const targetUser = await db.user.findFirst({
      where: { id: String(req.params.id), tenantId: req.user!.tenantId, deletedAt: null },
    });

    if (!targetUser) return res.status(404).json({ message: "User not found" });
    if (targetUser.role === "OWNER" && req.user!.role !== "owner") {
      return res.status(403).json({ message: "Cannot change owner role" });
    }

    const updatedUser = await db.user.update({
      where: { id: String(req.params.id) },
      data: { role },
    });

    return res.json({
      message: "Role updated",
      user: { ...updatedUser, role: updatedUser.role.toLowerCase() },
    });
  } catch (error) {
    console.error("Update user role error:", errorMessage(error));
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", requireMinRole("member"), async (req: Request, res: Response) => {
  try {
    const user = await db.user.findFirst({
      where: { id: String(req.params.id), tenantId: req.user!.tenantId, deletedAt: null },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ ...user, role: user.role.toLowerCase() });
  } catch (error) {
    console.error("Get user error:", errorMessage(error));
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", requirePermission("manageUsers"), async (req: Request, res: Response) => {
  try {
    const targetUser = await db.user.findFirst({
      where: { id: String(req.params.id), tenantId: req.user!.tenantId, deletedAt: null },
    });

    if (!targetUser) return res.status(404).json({ message: "User not found" });
    if (targetUser.role === "OWNER") {
      return res.status(403).json({ message: "Cannot remove tenant owner" });
    }

    await db.user.update({
      where: { id: String(req.params.id) },
      data: { deletedAt: new Date() },
    });

    return res.json({ message: "User removed", userId: req.params.id });
  } catch (error) {
    console.error("Delete user error:", errorMessage(error));
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
