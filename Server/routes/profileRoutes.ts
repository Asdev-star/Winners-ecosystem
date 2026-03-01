// server/routes/profileRoutes.ts

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

// ─── PATCH /profile — update name, email, and diaspora fields ────────────────────────

router.patch("/", async (req: Request, res: Response) => {
  const { name, email, country, city, bio, skills, industry, isPublicProfile } = req.body;

  if (!name && !email && !country && !city && !bio && !skills && !industry && isPublicProfile === undefined) {
    return res.status(400).json({ message: "At least one field is required" });
  }

  try {
    // Check email uniqueness if changing
    if (email) {
      const existing = await db.user.findFirst({
        where: { email: email.toLowerCase(), tenantId: req.user!.tenantId, deletedAt: null, NOT: { id: req.user!.userId } },
      });
      if (existing) return res.status(409).json({ message: "Email already in use" });
    }

    const updated = await db.user.update({
      where: { id: req.user!.userId },
      data:  {
        ...(name  && { name }),
        ...(email && { email: email.toLowerCase() }),
        ...(country !== undefined && { country }),
        ...(city !== undefined && { city }),
        ...(bio !== undefined && { bio }),
        ...(skills && { skills }),
        ...(industry !== undefined && { industry }),
        ...(isPublicProfile !== undefined && { isPublicProfile }),
      },
    });

    return res.json({
      message: "Profile updated",
      user: { 
        id: updated.id, 
        name: updated.name, 
        email: updated.email, 
        role: updated.role.toLowerCase(),
        country: updated.country,
        city: updated.city,
        bio: updated.bio,
        skills: updated.skills,
        industry: updated.industry,
        isPublicProfile: updated.isPublicProfile,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── PATCH /profile/password — change password ────────────────────────────────

router.patch("/password", async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  try {
    const user = await db.user.findFirst({
      where: { id: req.user!.userId, deletedAt: null },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.user.update({ where: { id: req.user!.userId }, data: { password: hashed } });

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── DELETE /profile — soft delete account ────────────────────────────────────

router.delete("/", async (req: Request, res: Response) => {
  try {
    const user = await db.user.findFirst({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "OWNER") return res.status(403).json({ message: "Owners cannot delete their account. Transfer ownership first." });

    await db.user.update({ where: { id: req.user!.userId }, data: { deletedAt: new Date() } });

    return res.json({ message: "Account deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;