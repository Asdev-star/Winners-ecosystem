// Server/routes/ssoRoutes.ts
// Phase 1 - Core Engine
// SSO Preparation Layer: cross-subdomain token handoff bootstrap.

import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET ?? "winners_dev_secret_change_in_prod";
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

export default router;
