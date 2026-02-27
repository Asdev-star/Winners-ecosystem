// Server/routes/ssoRoutes.ts
// Phase 1 - Core Engine
// SSO Preparation Layer: cross-subdomain token handoff bootstrap.

import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET ?? "winners_dev_secret_change_in_prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";
const SSO_SHARED_DOMAIN = process.env.SSO_SHARED_DOMAIN ?? ".winnersempire.io";
const SSO_TOKEN_TTL_SECONDS = Number(process.env.SSO_TOKEN_TTL_SECONDS ?? 90);

type SsoPayload = {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  aud: string;
  typ: "sso_handoff";
};

type AppTokenPayload = {
  userId: string;
  tenantId: string;
  tenantName: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
};

router.get("/config", (_req: Request, res: Response) => {
  res.json({
    enabled: true,
    sharedDomain: SSO_SHARED_DOMAIN,
    tokenTtlSeconds: SSO_TOKEN_TTL_SECONDS,
    note: "Preparation mode: use this config for cross-subdomain session bootstrap.",
  });
});

router.post("/token", authMiddleware, (req: Request, res: Response) => {
  const { audience } = req.body as { audience?: string };
  if (!audience) {
    return res.status(400).json({ message: "audience is required" });
  }

  const payload: SsoPayload = {
    userId: req.user!.userId,
    tenantId: req.user!.tenantId,
    email: req.user!.email,
    role: req.user!.role,
    aud: audience,
    typ: "sso_handoff",
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${SSO_TOKEN_TTL_SECONDS}s` });

  res.json({
    token,
    expiresIn: SSO_TOKEN_TTL_SECONDS,
    audience,
    sharedDomain: SSO_SHARED_DOMAIN,
  });
});

router.post("/exchange", async (req: Request, res: Response) => {
  const body = typeof req.body === "object" && req.body !== null
    ? (req.body as { handoffToken?: string; audience?: string })
    : {};
  const { handoffToken, audience } = body;
  if (!handoffToken) {
    return res.status(400).json({ message: "handoffToken is required" });
  }

  let decoded: SsoPayload;
  try {
    decoded = jwt.verify(handoffToken, JWT_SECRET) as SsoPayload;
  } catch {
    return res.status(401).json({ message: "Invalid or expired handoff token" });
  }

  if (decoded.typ !== "sso_handoff") {
    return res.status(400).json({ message: "Invalid handoff token type" });
  }

  if (audience && decoded.aud !== audience) {
    return res.status(403).json({ message: "Audience mismatch" });
  }

  try {
    const user = await db.user.findFirst({
      where: { id: decoded.userId, deletedAt: null },
      include: { tenant: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.tenantId !== decoded.tenantId) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }

    const role = user.role.toLowerCase() as AppTokenPayload["role"];
    const payload: AppTokenPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      email: user.email,
      role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
      },
    });
  } catch (error) {
    console.error("SSO exchange error:", error);
    return res.status(500).json({ message: "Failed to exchange SSO token" });
  }
});

export default router;
