// server/routes/authRoutes.ts

import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import type { JwtPayload } from "../middleware/authMiddleware.js";

const router = Router();

const JWT_SECRET          = process.env.JWT_SECRET          ?? "winners_dev_secret_change_in_prod";
const JWT_EXPIRES_IN      = process.env.JWT_EXPIRES_IN      ?? "8h";
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES ?? "7d";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function signToken(payload: Omit<JwtPayload, "iat" | "exp">, expiresIn: string) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

function buildPayload(user: { id: string; email: string; role: string; tenantId: string; tenant: { name: string } }) {
  return {
    userId:     user.id,
    email:      user.email,
    tenantId:   user.tenantId,
    tenantName: user.tenant.name,
    role:       user.role.toLowerCase() as JwtPayload["role"],
  };
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await db.user.findFirst({
      where:   { email: email.toLowerCase().trim(), deletedAt: null },
      include: { tenant: true },
    });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const payload      = buildPayload(user);
    const token        = signToken(payload, JWT_EXPIRES_IN);
    const refreshToken = signToken(payload, JWT_REFRESH_EXPIRES);

    return res.json({
      token,
      refreshToken,
      user: {
        id:         user.id,
        email:      user.email,
        name:       user.name,
        role:       user.role.toLowerCase(),
        tenantId:   user.tenantId,
        tenantName: user.tenant.name,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────

router.post("/refresh", (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

  try {
    const decoded  = jwt.verify(refreshToken, JWT_SECRET) as JwtPayload;
    const payload  = {
      userId:     decoded.userId,
      email:      decoded.email,
      tenantId:   decoded.tenantId,
      tenantName: decoded.tenantName,
      role:       decoded.role,
    };
    const newToken = signToken(payload, JWT_EXPIRES_IN);
    return res.json({ token: newToken });
  } catch {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await db.user.findFirst({
      where:   { id: req.user!.userId, deletedAt: null },
      include: { tenant: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      id:         user.id,
      email:      user.email,
      name:       user.name,
      role:       user.role.toLowerCase(),
      tenantId:   user.tenantId,
      tenantName: user.tenant.name,
    });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /auth/accept-invite ─────────────────────────────────────────────────

router.post("/accept-invite", async (req: Request, res: Response) => {
  const { token, name, password } = req.body;

  if (!token || !name || !password) {
    return res.status(400).json({ message: "token, name and password are required" });
  }

  try {
    const invite = await db.invite.findUnique({ where: { token }, include: { tenant: true } });

    if (!invite)                       return res.status(404).json({ message: "Invite not found" });
    if (invite.status !== "PENDING")   return res.status(400).json({ message: "Invite already used" });
    if (new Date() > invite.expiresAt) return res.status(400).json({ message: "Invite expired" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        tenantId: invite.tenantId,
        email:    invite.email,
        name,
        password: hashed,
        role:     invite.role,
      },
      include: { tenant: true },
    });

    await db.invite.update({ where: { id: invite.id }, data: { status: "ACCEPTED" } });

    const payload      = buildPayload(user);
    const jwtToken     = signToken(payload, JWT_EXPIRES_IN);
    const refreshToken = signToken(payload, JWT_REFRESH_EXPIRES);

    return res.status(201).json({
      token:        jwtToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role.toLowerCase(), tenantId: user.tenantId, tenantName: user.tenant.name },
    });
  } catch (err) {
    console.error("Accept invite error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;