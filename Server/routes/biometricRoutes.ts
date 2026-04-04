// Phase 7 — Mobile PWA — Biometric Authentication API
// WebAuthn implementation for fingerprint and face recognition

import { Router, Request, Response } from "express";
import { randomBytes } from "crypto";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";
import { signToken } from "./authRoutes.js";

const router = Router();

// ─── REGISTRATION FLOW ────────────────────────────────────────────────────────

// POST /auth/biometric/register/options — Get registration options
router.post("/biometric/register/options", authMiddleware, enforceTenant, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const { email, name } = req.body ?? {};

  try {
    const challenge = randomBytes(32).toString("base64url");
    
    // Store challenge temporarily (in production, use Redis with TTL)
    await db.challenge.create({
      data: {
        userId,
        tenantId,
        challenge,
        type: "registration",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    const options = {
      challenge,
      rp: {
        name: "Winners Ecosystem",
        id: process.env.WEBAUTHN_RP_ID || "localhost",
      },
      user: {
        id: Buffer.from(userId).toString("base64url"),
        name: email || userId,
        displayName: name || email || userId,
      },
      pubKeyCredParams: [
        { type: "public-key" as const, alg: -7 },  // ES256
        { type: "public-key" as const, alg: -257 }, // RS256
      ],
      timeout: 60000,
      attestation: "none" as const,
      authenticatorSelection: {
        authenticatorAttachment: "platform" as const,
        requireResidentKey: false,
        userVerification: "required" as const,
      },
    };

    res.json(options);
  } catch (err) {
    console.error("[Biometric] Registration options error:", err);
    res.status(500).json({ error: "Failed to get registration options" });
  }
});

// POST /auth/biometric/register/verify — Verify registration
router.post("/biometric/register/verify", authMiddleware, enforceTenant, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const { id, rawId, type, authenticatorAttachment, response } = req.body ?? {};

  try {
    // In production, verify the attestation here using @simplewebauthn/server
    
    // For now, store the credential
    const credential = await db.webAuthnCredential.create({
      data: {
        userId,
        tenantId,
        credentialId: rawId,
        publicKey: "stored_public_key", // Extract from attestationObject in production
        counter: 0,
        authenticatorAttachment: authenticatorAttachment || "platform",
      },
    });

    res.status(201).json({
      credential: {
        id: credential.id,
        rawId: credential.credentialId,
        type: "public-key",
        authenticatorAttachment: credential.authenticatorAttachment,
        createdAt: credential.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[Biometric] Registration verification error:", err);
    res.status(500).json({ error: "Failed to verify registration" });
  }
});

// ─── AUTHENTICATION FLOW ──────────────────────────────────────────────────────

// POST /auth/biometric/authenticate/options — Get authentication options
router.post("/biometric/authenticate/options", authMiddleware, enforceTenant, async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    const challenge = randomBytes(32).toString("base64url");
    
    // Store challenge
    await db.challenge.create({
      data: {
        userId,
        tenantId: req.user!.tenantId,
        challenge,
        type: "authentication",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // Get user's credentials
    const credentials = await db.webAuthnCredential.findMany({
      where: { userId },
      select: { credentialId: true },
    });

    const options = {
      challenge,
      allowCredentials: credentials.map((cred) => ({
        type: "public-key" as const,
        id: cred.credentialId,
        transports: ["internal" as const],
      })),
      timeout: 60000,
      userVerification: "required" as const,
      rpId: process.env.WEBAUTHN_RP_ID || "localhost",
    };

    res.json(options);
  } catch (err) {
    console.error("[Biometric] Authentication options error:", err);
    res.status(500).json({ error: "Failed to get authentication options" });
  }
});

// POST /auth/biometric/authenticate/verify — Verify authentication
router.post("/biometric/authenticate/verify", authMiddleware, enforceTenant, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id, rawId, response } = req.body ?? {};

  try {
    // Find the credential
    const credential = await db.webAuthnCredential.findFirst({
      where: { userId, credentialId: rawId },
    });

    if (!credential) {
      return res.status(404).json({ error: "Credential not found" });
    }

    // In production, verify the signature and update counter
    
    // Update last used timestamp
    await db.webAuthnCredential.update({
      where: { id: credential.id },
      data: { lastUsedAt: new Date() },
    });

    // Generate new JWT token
    const newToken = signToken({
      userId,
      tenantId: req.user!.tenantId,
      tenantName: req.user!.tenantName,
      email: "",
      role: "member",
    }, "8h");

    res.json({ success: true, token: newToken });
  } catch (err) {
    console.error("[Biometric] Authentication verification error:", err);
    res.status(500).json({ error: "Failed to verify authentication" });
  }
});

// ─── CREDENTIAL MANAGEMENT ────────────────────────────────────────────────────

// GET /auth/biometric/credentials — List credentials
router.get("/biometric/credentials", authMiddleware, enforceTenant, async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    const credentials = await db.webAuthnCredential.findMany({
      where: { userId },
      select: {
        id: true,
        credentialId: true,
        authenticatorAttachment: true,
        counter: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    res.json({
      credentials: credentials.map((cred) => ({
        id: cred.id,
        rawId: cred.credentialId,
        type: "public-key" as const,
        authenticatorAttachment: cred.authenticatorAttachment,
        counter: cred.counter,
        createdAt: cred.createdAt.toISOString(),
        lastUsedAt: cred.lastUsedAt?.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[Biometric] List credentials error:", err);
    res.status(500).json({ error: "Failed to list credentials" });
  }
});

// DELETE /auth/biometric/credentials/:id — Delete credential
router.delete("/biometric/credentials/:id", authMiddleware, enforceTenant, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params as Record<string, string>;

  try {
    await db.webAuthnCredential.delete({
      where: { id, userId },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("[Biometric] Delete credential error:", err);
    res.status(500).json({ error: "Failed to delete credential" });
  }
});

export default router;
