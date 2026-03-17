// Server/routes/passwordResetRoutes.ts

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";
import db from "../db.js";

const router  = Router();
const resend  = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

// POST /auth/forgot-password
router.post("/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  try {
    const user = await db.user.findFirst({
      where: { email: email.toLowerCase().trim(), deletedAt: null },
    });

    // Always return success to prevent email enumeration
    if (!user) return res.json({ message: "If that email exists, a reset link has been sent." });

    // Invalidate old tokens
    await db.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data:  { used: true },
    });

    // Create new token (expires in 1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    await db.passwordResetToken.create({
      data: {
        userId:    user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    // Send email (skip if Resend is not configured)
    if (resend) {
      await resend.emails.send({
        from:    process.env.EMAIL_FROM ?? "Winners Ecosystem <onboarding@resend.dev>",
        to:      user.email,
        subject: "Reset your Winners Ecosystem password",
        html: `
          <div style="font-family: 'Syne', sans-serif; background: #080B10; color: #E8EDF2; padding: 40px; max-width: 520px; margin: 0 auto; border-radius: 8px;">
            <div style="font-family: monospace; font-size: 10px; letter-spacing: 3px; color: #F5C842; margin-bottom: 24px;">● WINNERS ECOSYSTEM</div>
            <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">Reset Your <span style="color: #F5C842;">Password</span></h2>
            <p style="color: #5A6878; font-size: 13px; margin-bottom: 24px;">Click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display: inline-block; background: #F5C842; color: #080B10; padding: 13px 28px; border-radius: 4px; font-weight: 700; font-size: 14px; text-decoration: none; margin-bottom: 24px;">Reset Password →</a>
            <p style="color: #5A6878; font-size: 11px; font-family: monospace;">If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #5A6878; font-size: 11px; font-family: monospace; margin-top: 8px;">Or copy this link: ${resetUrl}</p>
          </div>
        `,
      });
    }

    return res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Failed to send reset email" });
  }
});

// POST /auth/reset-password
router.post("/reset-password", async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: "Token and password required" });
  if (password.length < 6)  return res.status(400).json({ message: "Password must be at least 6 characters" });

  try {
    const resetToken = await db.passwordResetToken.findUnique({
      where:   { token },
      include: { user: true },
    });

    if (!resetToken)                       return res.status(400).json({ message: "Invalid or expired reset link" });
    if (resetToken.used)                   return res.status(400).json({ message: "Reset link already used" });
    if (new Date() > resetToken.expiresAt) return res.status(400).json({ message: "Reset link expired" });

    const hashed = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { id: resetToken.userId },
      data:  { password: hashed },
    });

    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data:  { used: true },
    });

    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

// GET /auth/verify-reset-token
router.get("/verify-reset-token", async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ valid: false });

  try {
    const resetToken = await db.passwordResetToken.findUnique({ where: { token: token as string } });
    if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
      return res.json({ valid: false });
    }
    return res.json({ valid: true });
  } catch {
    return res.status(500).json({ valid: false });
  }
});

export default router;