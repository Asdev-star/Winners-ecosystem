// Server/routes/ssoRoutes.ts
// Phase 1 - Core Engine
// SSO Preparation Layer: cross-subdomain token handoff bootstrap.

import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { randomBytes, randomUUID } from "crypto";
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
  jti: string;
  state?: string;
  nonce?: string;
};

type AppTokenPayload = {
  userId: string;
  tenantId: string;
  tenantName: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
};

const consumedHandoffJtis = new Map<string, number>();
const MAX_CHALLENGE_LENGTH = 256;

function normalizeAudience(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const candidate = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
  try {
    return new URL(candidate).host.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeChallenge(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_CHALLENGE_LENGTH) return null;
  if (!/^[A-Za-z0-9._~-]+$/.test(trimmed)) return null;
  return trimmed;
}

function createChallengeToken(): string {
  return randomBytes(16).toString("base64url");
}

function pruneConsumedJtis(now = Date.now()): void {
  for (const [jti, expiresAt] of consumedHandoffJtis.entries()) {
    if (expiresAt <= now) {
      consumedHandoffJtis.delete(jti);
    }
  }
}

function markHandoffJtiConsumed(jti: string): void {
  const now = Date.now();
  pruneConsumedJtis(now);
  consumedHandoffJtis.set(jti, now + SSO_TOKEN_TTL_SECONDS * 1000);
}

function isHandoffJtiConsumed(jti: string): boolean {
  pruneConsumedJtis();
  return consumedHandoffJtis.has(jti);
}

router.get("/config", (_req: Request, res: Response) => {
  res.json({
    enabled: true,
    sharedDomain: SSO_SHARED_DOMAIN,
    tokenTtlSeconds: SSO_TOKEN_TTL_SECONDS,
    note: "Preparation mode: use this config for cross-subdomain session bootstrap.",
  });
});

router.post("/token", authMiddleware, (req: Request, res: Response) => {
  const body = typeof req.body === "object" && req.body !== null
    ? (req.body as { audience?: string; state?: string; nonce?: string })
    : {};
  const audience = normalizeAudience(body.audience);
  if (!audience) {
    return res.status(400).json({ message: "audience is required and must be a valid host" });
  }

  const state = normalizeChallenge(body.state) ?? createChallengeToken();
  const nonce = normalizeChallenge(body.nonce) ?? createChallengeToken();

  const payload: SsoPayload = {
    userId: req.user!.userId,
    tenantId: req.user!.tenantId,
    email: req.user!.email,
    role: req.user!.role,
    aud: audience,
    typ: "sso_handoff",
    jti: randomUUID(),
    state,
    nonce,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${SSO_TOKEN_TTL_SECONDS}s` });

  res.json({
    token,
    expiresIn: SSO_TOKEN_TTL_SECONDS,
    audience,
    state,
    nonce,
    sharedDomain: SSO_SHARED_DOMAIN,
  });
});

router.post("/exchange", async (req: Request, res: Response) => {
  const body = typeof req.body === "object" && req.body !== null
    ? (req.body as { handoffToken?: string; audience?: string; state?: string; nonce?: string })
    : {};
  const { handoffToken } = body;
  const audience = typeof body.audience === "undefined" ? undefined : normalizeAudience(body.audience);
  const state = typeof body.state === "undefined" ? undefined : normalizeChallenge(body.state);
  const nonce = typeof body.nonce === "undefined" ? undefined : normalizeChallenge(body.nonce);

  if (!handoffToken) {
    return res.status(400).json({ message: "handoffToken is required" });
  }
  if (typeof body.audience !== "undefined" && !audience) {
    return res.status(400).json({ message: "audience must be a valid host" });
  }
  if (typeof body.state !== "undefined" && !state) {
    return res.status(400).json({ message: "state is invalid" });
  }
  if (typeof body.nonce !== "undefined" && !nonce) {
    return res.status(400).json({ message: "nonce is invalid" });
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
  if (!decoded.jti) {
    return res.status(400).json({ message: "Invalid handoff token id" });
  }

  if (audience && decoded.aud !== audience) {
    return res.status(403).json({ message: "Audience mismatch" });
  }
  if (decoded.state && decoded.state !== state) {
    return res.status(403).json({ message: "State mismatch" });
  }
  if (decoded.nonce && decoded.nonce !== nonce) {
    return res.status(403).json({ message: "Nonce mismatch" });
  }
  if (isHandoffJtiConsumed(decoded.jti)) {
    return res.status(409).json({ message: "Handoff token already exchanged" });
  }
  markHandoffJtiConsumed(decoded.jti);

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
