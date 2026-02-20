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
      where:  { id: req.params.id, tenantId: req.user!.tenantId, deletedAt: null },
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
      where: { id: req.params.id, tenantId: req.user!.tenantId, deletedAt: null },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "OWNER" && req.user!.role !== "owner") {
      return res.status(403).json({ message: "Cannot change owner role" });
    }

    const updated = await db.user.update({
      where: { id: req.params.id },
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
      where: { id: req.params.id, tenantId: req.user!.tenantId, deletedAt: null },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "OWNER") return res.status(403).json({ message: "Cannot remove tenant owner" });

    // Soft delete
    await db.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });

    return res.json({ message: "User removed", userId: req.params.id });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;