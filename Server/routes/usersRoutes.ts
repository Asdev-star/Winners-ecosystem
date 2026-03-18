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

    const user = await db.user.findFirst({
      where: { id: userId },
      select: { profileViews: true },
    });
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

// ─── GET /users/:id/trust-score ───────────────────────────────────────────────

router.get("/:id/trust-score", requireMinRole("member"), async (req: Request, res: Response) => {
  const userId = String(req.params.id);
  try {
    const [
      certificates,
      completedContracts,
      disputedContracts,
      followers,
      posts,
      quizAttempts,
      verifiedUser,
      escrowPayments,
    ] = await Promise.all([
      db.certificate.count({ where: { userId } }),
      db.contract.count({ where: { clientId: userId, status: "COMPLETED" } }),
      db.contract.count({ where: { clientId: userId, status: "DISPUTED" } }),
      db.follow.count({ where: { followingId: userId } }),
      db.post.findMany({
        where: { authorId: userId },
        select: { _count: { select: { likes: true, comments: true } } },
        take: 50,
      }),
      db.quizAttempt.findMany({ where: { userId }, select: { score: true, passed: true } }),
      db.user.findFirst({ where: { id: userId }, select: { twoFactorEnabled: true, country: true } }),
      db.escrowPayment.count({ where: { freelancerId: userId, status: "RELEASED" } }),
    ]);

    const quizPassed = quizAttempts.filter((a) => a.passed).length;
    const quizTotal = quizAttempts.length;
    const quizBonus = quizTotal > 0 ? Math.round((quizPassed / quizTotal) * 10) : 0;
    const academyScore = Math.min(30, certificates * 5 + quizBonus);

    const workRaw = completedContracts * 4 + escrowPayments * 2 - disputedContracts * 5;
    const workScore = Math.min(25, Math.max(0, workRaw));

    const totalEngagement = posts.reduce((s, p) => s + p._count.likes + p._count.comments, 0);
    const communityScore = Math.min(20, Math.round(followers * 0.5 + totalEngagement * 0.2));

    const identityScore = Math.min(15, (verifiedUser?.twoFactorEnabled ? 10 : 0) + (verifiedUser?.country ? 5 : 0));

    const paymentsScore = disputedContracts === 0
      ? Math.min(10, escrowPayments * 2)
      : Math.max(0, 5 - disputedContracts * 2);

    const score = academyScore + workScore + communityScore + identityScore + paymentsScore;

    return res.json({
      score,
      breakdown: { academy: academyScore, work: workScore, community: communityScore, identity: identityScore, payments: paymentsScore },
    });
  } catch (error) {
    console.error("Trust score error:", errorMessage(error));
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /users/:id/score — Winners Score Card ────────────────────────────────

router.get("/:id/score", requireMinRole("member"), async (req: Request, res: Response) => {
  const userId = String(req.params.id);
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [posts, followers, certificates, enrollments, lessonProgress, contracts, jobApplications, aiInteractions] =
      await Promise.all([
        db.post.findMany({
          where: { authorId: userId, createdAt: { gte: sevenDaysAgo } },
          select: { _count: { select: { likes: true, comments: true } } },
        }),
        db.follow.count({ where: { followingId: userId } }),
        db.certificate.count({ where: { userId } }),
        db.enrollment.count({ where: { userId } }),
        db.lessonProgress.count({ where: { userId, completed: true } }),
        db.contract.count({ where: { OR: [{ clientId: userId }, { freelancerId: userId }], status: "COMPLETED" } }),
        db.jobApplication.count({ where: { freelancer: { userId } } }),
        db.assistantAction.count({ where: { targetUserId: userId, createdAt: { gte: sevenDaysAgo } } }),
      ]);

    const totalEngagement = posts.reduce((s, p) => s + p._count.likes + p._count.comments, 0);
    const communityScore    = Math.min(100, Math.round(followers * 2 + totalEngagement * 3 + posts.length * 5));
    const academyScore      = Math.min(100, certificates * 20 + Math.min(40, enrollments * 5) + Math.min(20, lessonProgress));
    const workScore         = Math.min(100, contracts * 25 + jobApplications * 5);
    const marketScore       = 0;
    const intelligenceScore = Math.min(100, aiInteractions * 10);
    const engagementScore   = Math.min(100, Math.round((communityScore + academyScore + workScore + intelligenceScore) / 4));

    const score = Math.round(
      communityScore * 0.25 + academyScore * 0.25 + workScore * 0.20 +
      marketScore * 0.10 + intelligenceScore * 0.10 + engagementScore * 0.10,
    );

    return res.json({
      score,
      breakdown: {
        community:    { score: communityScore,    percentage: communityScore,    color: "var(--ice)" },
        academy:      { score: academyScore,      percentage: academyScore,      color: "var(--gold)" },
        market:       { score: marketScore,       percentage: marketScore,       color: "var(--green)" },
        work:         { score: workScore,         percentage: workScore,         color: "var(--purple)" },
        intelligence: { score: intelligenceScore, percentage: intelligenceScore, color: "var(--blue)" },
        engagement:   { score: engagementScore,   percentage: engagementScore,   color: "var(--red)" },
      },
      trend: null,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Winners score error:", errorMessage(error));
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /users/:id/score/generate — alias for initial score generation ──────

router.post("/:id/score/generate", requireMinRole("member"), async (req: Request, res: Response) => {
  return res.redirect(307, `/api/v1/users/${req.params.id}/score`);
});

export default router;
