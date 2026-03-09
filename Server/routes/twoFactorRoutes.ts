// Server/routes/twoFactorRoutes.ts

import crypto from "crypto";
import { Router, type Request, type Response } from "express";
import * as OTPAuth from "otpauth";
import qrcode from "qrcode";
import { Resend } from "resend";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);
const APP_NAME = "Winners Ecosystem";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Internal server error";
}

router.post("/totp/setup", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: APP_NAME,
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    });

    const otpauthUrl = totp.toString();
    const qrCode = await qrcode.toDataURL(otpauthUrl);

    await db.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret.base32, twoFactorMethod: "totp" },
    });

    return res.json({ secret: secret.base32, qrCode, otpauthUrl });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/totp/verify", authMiddleware, async (req: Request, res: Response) => {
  const code = typeof req.body?.code === "string" ? req.body.code : "";
  if (!code) return res.status(400).json({ message: "Code required" });

  try {
    const user = await db.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.twoFactorSecret) return res.status(400).json({ message: "Setup TOTP first" });

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token: code.replace(/\s/g, ""), window: 1 });
    if (delta === null) return res.status(400).json({ message: "Invalid code. Try again." });

    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString("hex"));
    await db.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true, twoFactorMethod: "totp", twoFactorBackup: backupCodes },
    });

    return res.json({ message: "TOTP enabled", backupCodes });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/email/setup", authMiddleware, async (req: Request, res: Response) => {
  try {
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString("hex"));
    await db.user.update({
      where: { id: req.user!.userId },
      data: { twoFactorEnabled: true, twoFactorMethod: "email", twoFactorBackup: backupCodes },
    });
    return res.json({ message: "Email 2FA enabled", backupCodes });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/email/send", async (req: Request, res: Response) => {
  const userId = typeof req.body?.userId === "string" ? req.body.userId : "";
  if (!userId) return res.status(400).json({ message: "userId required" });

  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.twoFactorOTP.create({ data: { userId, code, expiresAt } });

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Winners Ecosystem <onboarding@resend.dev>",
      to: user.email,
      subject: `${code} - Your Winners Ecosystem login code`,
      html: `<div style="font-family:Arial,sans-serif;background:#080B10;color:#E8EDF2;padding:24px;max-width:480px;margin:0 auto;border-radius:8px;">
        <div style="font-family:monospace;font-size:10px;letter-spacing:3px;color:#C9A84C;margin-bottom:18px;">WINNERS ECOSYSTEM</div>
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;">Your login code</h2>
        <p style="color:#5A6878;font-size:13px;margin-bottom:18px;">Use this code to complete sign-in. It expires in 10 minutes.</p>
        <div style="font-size:42px;font-weight:700;letter-spacing:10px;color:#C9A84C;font-family:monospace;margin-bottom:18px;">${code}</div>
        <p style="color:#5A6878;font-size:11px;font-family:monospace;">If you did not request this, ignore this email.</p>
      </div>`,
    });

    return res.json({ message: "Code sent" });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/email/verify", async (req: Request, res: Response) => {
  const userId = typeof req.body?.userId === "string" ? req.body.userId : "";
  const code = typeof req.body?.code === "string" ? req.body.code : "";
  if (!userId || !code) return res.status(400).json({ message: "userId and code required" });

  try {
    const otp = await db.twoFactorOTP.findFirst({
      where: { userId, code, used: false, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) return res.status(400).json({ message: "Invalid or expired code" });

    await db.twoFactorOTP.update({ where: { id: otp.id }, data: { used: true } });
    return res.json({ message: "Verified" });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/totp/validate", async (req: Request, res: Response) => {
  const userId = typeof req.body?.userId === "string" ? req.body.userId : "";
  const code = typeof req.body?.code === "string" ? req.body.code : "";
  if (!userId || !code) return res.status(400).json({ message: "userId and code required" });

  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) return res.status(400).json({ message: "TOTP not set up" });

    if (user.twoFactorBackup.includes(code)) {
      const remaining = user.twoFactorBackup.filter((backupCode) => backupCode !== code);
      await db.user.update({ where: { id: userId }, data: { twoFactorBackup: remaining } });
      return res.json({ message: "Verified via backup code", backupUsed: true });
    }

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token: code.replace(/\s/g, ""), window: 1 });
    if (delta === null) return res.status(400).json({ message: "Invalid code" });

    return res.json({ message: "Verified" });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/status", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user!.userId },
      select: { twoFactorEnabled: true, twoFactorMethod: true, twoFactorBackup: true },
    });
    return res.json({
      enabled: user?.twoFactorEnabled ?? false,
      method: user?.twoFactorMethod ?? null,
      backupCodesRemaining: user?.twoFactorBackup?.length ?? 0,
    });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/disable", authMiddleware, async (req: Request, res: Response) => {
  try {
    await db.user.update({
      where: { id: req.user!.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorMethod: null,
        twoFactorBackup: [],
      },
    });
    return res.json({ message: "2FA disabled" });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

export default router;
