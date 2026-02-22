// Server/routes/twoFactorRoutes.ts

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";
import * as OTPAuth from "otpauth";
import { Resend } from "resend";
import crypto from "crypto";
import qrcode from "qrcode";

const router  = Router();
const resend  = new Resend(process.env.RESEND_API_KEY);
const APP_NAME = "Winners Ecosystem";

// ─── TOTP Setup ───────────────────────────────────────────────────────────────

// POST /2fa/totp/setup — generate secret + QR code
router.post("/totp/setup", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const secret = new OTPAuth.Secret({ size: 20 });
    const totp   = new OTPAuth.TOTP({
      issuer:    APP_NAME,
      label:     user.email,
      algorithm: "SHA1",
      digits:    6,
      period:    30,
      secret,
    });

    const otpauthUrl = totp.toString();
    const qrDataUrl  = await qrcode.toDataURL(otpauthUrl);

    // Save secret temporarily (not enabled yet until verified)
    await db.user.update({
      where: { id: user.id },
      data:  { twoFactorSecret: secret.base32, twoFactorMethod: "totp" },
    });

    res.json({ secret: secret.base32, qrCode: qrDataUrl, otpauthUrl });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /2fa/totp/verify — verify code and enable TOTP
router.post("/totp/verify", authMiddleware, async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: "Code required" });

  try {
    const user = await db.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.twoFactorSecret) return res.status(400).json({ message: "Setup TOTP first" });

    const totp  = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret), algorithm: "SHA1", digits: 6, period: 30 });
    const delta = totp.validate({ token: code.replace(/\s/g, ""), window: 1 });

    if (delta === null) return res.status(400).json({ message: "Invalid code. Try again." });

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString("hex"));

    await db.user.update({
      where: { id: user.id },
      data:  { twoFactorEnabled: true, twoFactorMethod: "totp", twoFactorBackup: backupCodes },
    });

    res.json({ message: "TOTP enabled", backupCodes });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Email OTP ────────────────────────────────────────────────────────────────

// POST /2fa/email/setup — enable email OTP
router.post("/email/setup", authMiddleware, async (req: Request, res: Response) => {
  try {
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString("hex"));
    await db.user.update({
      where: { id: req.user!.userId },
      data:  { twoFactorEnabled: true, twoFactorMethod: "email", twoFactorBackup: backupCodes },
    });
    res.json({ message: "Email 2FA enabled", backupCodes });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /2fa/email/send — send OTP email during login
router.post("/email/send", async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "userId required" });

  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const code      = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.twoFactorOTP.create({ data: { userId, code, expiresAt } });

    await resend.emails.send({
      from:    process.env.EMAIL_FROM ?? "Winners Ecosystem <onboarding@resend.dev>",
      to:      user.email,
      subject: `${code} — Your Winners Ecosystem login code`,
      html: `
        <div style="font-family: 'Syne', sans-serif; background: #080B10; color: #E8EDF2; padding: 40px; max-width: 480px; margin: 0 auto; border-radius: 8px;">
          <div style="font-family: monospace; font-size: 10px; letter-spacing: 3px; color: #F5C842; margin-bottom: 24px;">● WINNERS ECOSYSTEM</div>
          <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">Your login code</h2>
          <p style="color: #5A6878; font-size: 13px; margin-bottom: 24px;">Use this code to complete your sign-in. It expires in 10 minutes.</p>
          <div style="font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #F5C842; font-family: monospace; margin-bottom: 24px;">${code}</div>
          <p style="color: #5A6878; font-size: 11px; font-family: monospace;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: "Code sent" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /2fa/email/verify — verify email OTP during login
router.post("/email/verify", async (req: Request, res: Response) => {
  const { userId, code } = req.body;
  if (!userId || !code) return res.status(400).json({ message: "userId and code required" });

  try {
    const otp = await db.twoFactorOTP.findFirst({
      where: { userId, code, used: false, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) return res.status(400).json({ message: "Invalid or expired code" });

    await db.twoFactorOTP.update({ where: { id: otp.id }, data: { used: true } });
    res.json({ message: "Verified" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Shared ───────────────────────────────────────────────────────────────────

// POST /2fa/totp/validate — validate TOTP during login
router.post("/totp/validate", async (req: Request, res: Response) => {
  const { userId, code } = req.body;
  if (!userId || !code) return res.status(400).json({ message: "userId and code required" });

  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) return res.status(400).json({ message: "TOTP not set up" });

    // Check backup codes first
    if (user.twoFactorBackup.includes(code)) {
      const remaining = user.twoFactorBackup.filter((c) => c !== code);
      await db.user.update({ where: { id: userId }, data: { twoFactorBackup: remaining } });
      return res.json({ message: "Verified via backup code", backupUsed: true });
    }

    const totp  = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret), algorithm: "SHA1", digits: 6, period: 30 });
    const delta = totp.validate({ token: code.replace(/\s/g, ""), window: 1 });
    if (delta === null) return res.status(400).json({ message: "Invalid code" });

    res.json({ message: "Verified" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /2fa/status — get current 2FA status
router.get("/status", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.user!.userId }, select: { twoFactorEnabled: true, twoFactorMethod: true, twoFactorBackup: true } });
    res.json({ enabled: user?.twoFactorEnabled ?? false, method: user?.twoFactorMethod ?? null, backupCodesRemaining: user?.twoFactorBackup?.length ?? 0 });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /2fa/disable — disable 2FA
router.post("/disable", authMiddleware, async (req: Request, res: Response) => {
  try {
    await db.user.update({
      where: { id: req.user!.userId },
      data:  { twoFactorEnabled: false, twoFactorSecret: null, twoFactorMethod: null, twoFactorBackup: [] },
    });
    res.json({ message: "2FA disabled" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;