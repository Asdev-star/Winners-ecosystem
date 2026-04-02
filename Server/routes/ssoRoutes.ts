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

// ============================================
// ENTERPRISE SSO - SAML 2.0, Okta, Azure AD
// ============================================

// GET /sso/saml/metadata - Get SAML SP metadata
router.get("/saml/metadata", (_req: Request, res: Response) => {
  const entityId = `${process.env.APP_URL}/api/v1/sso/saml`;
  const acsUrl = `${process.env.APP_URL}/api/v1/sso/saml/acs`;
  const sloUrl = `${process.env.APP_URL}/api/v1/sso/saml/slo`;

  res.type("application/xml").send(`
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}">
  <SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acsUrl}" index="0" isDefault="true"/>
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${sloUrl}"/>
  </SPSSODescriptor>
</EntityDescriptor>`.trim());
});

// POST /sso/saml/acs - SAML Assertion Consumer Service
router.post("/saml/acs", async (req: Request, res: Response) => {
  try {
    // In production, parse SAML response and validate signature
    // For now, return placeholder for IdP integration
    const { SAMLResponse, RelayState } = req.body;

    if (!SAMLResponse) {
      return res.status(400).json({ message: "SAMLResponse is required" });
    }

    // TODO: Decode and validate SAML response
    // const decoded = decodeSamlResponse(SAMLResponse);
    // const user = await findOrCreateUserFromSAML(decoded);

    res.json({
      message: "SAML ACS endpoint ready for IdP configuration",
      note: "Configure your IdP with SP metadata from /sso/saml/metadata",
      relayState: RelayState,
    });
  } catch (error) {
    console.error("SAML ACS error:", error);
    res.status(500).json({ message: "SAML authentication failed" });
  }
});

// POST /sso/okta - Okta OAuth/OIDC integration
router.post("/okta", async (req: Request, res: Response) => {
  try {
    const { code, redirectUri, tenantId } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Authorization code required" });
    }

    const oktaDomain = process.env.OKTA_DOMAIN;
    const clientId = process.env.OKTA_CLIENT_ID;
    const clientSecret = process.env.OKTA_CLIENT_SECRET;

    if (!oktaDomain || !clientId || !clientSecret) {
      return res.status(400).json({ error: "Okta not configured" });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(`https://${oktaDomain}/oauth2/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      return res.status(400).json({ message: "Failed to exchange Okta token", error: err });
    }

    const tokens = await tokenResponse.json();

    // Get user info from Okta
    const userInfoResponse = await fetch(`https://${oktaDomain}/oauth2/v1/userinfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const userInfo = await userInfoResponse.json();

    // TODO: Find or create user from Okta profile
    // const user = await findOrCreateUserFromOkta(userInfo);

    res.json({
      message: "Okta integration ready",
      user: userInfo,
    });
  } catch (error) {
    console.error("Okta SSO error:", error);
    res.status(500).json({ message: "Okta authentication failed" });
  }
});

// GET /sso/okta/config - Get Okta config for frontend
router.get("/okta/config", (_req: Request, res: Response) => {
  const oktaDomain = process.env.OKTA_DOMAIN;
  const clientId = process.env.OKTA_CLIENT_ID;
  const redirectUri = process.env.OKTA_REDIRECT_URI;

  if (!oktaDomain || !clientId) {
    return res.json({ enabled: false, message: "Okta not configured" });
  }

  const authUrl = `https://${oktaDomain}/oauth2/v1/authorize`;
  const scope = encodeURIComponent("openid profile email");
  const redirect = encodeURIComponent(redirectUri || "");

  res.json({
    enabled: true,
    authUrl: `${authUrl}?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${redirect}`,
  });
});

// POST /sso/azure - Microsoft Azure AD integration
router.post("/azure", async (req: Request, res: Response) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Authorization code required" });
    }

    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      return res.status(400).json({ error: "Azure AD not configured" });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        scope: "openid profile email User.Read",
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      return res.status(400).json({ message: "Failed to exchange Azure token", error: err });
    }

    const tokens = await tokenResponse.json();

    // Get user info from Microsoft Graph
    const userInfoResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const userInfo = await userInfoResponse.json();

    res.json({
      message: "Azure AD integration ready",
      user: userInfo,
    });
  } catch (error) {
    console.error("Azure AD SSO error:", error);
    res.status(500).json({ message: "Azure authentication failed" });
  }
});

// GET /sso/azure/config - Get Azure AD config for frontend
router.get("/azure/config", (_req: Request, res: Response) => {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const redirectUri = process.env.AZURE_REDIRECT_URI;

  if (!tenantId || !clientId) {
    return res.json({ enabled: false, message: "Azure AD not configured" });
  }

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;
  const scope = encodeURIComponent("openid profile email User.Read");
  const redirect = encodeURIComponent(redirectUri || "");

  res.json({
    enabled: true,
    authUrl: `${authUrl}?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${redirect}`,
  });
});

// POST /sso/saml - Configure SAML IdP
router.post("/saml", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { idpEntityId, idpSsoUrl, idpCertificate, attributeMapping, spEntityId } = req.body;

    if (!idpEntityId || !idpSsoUrl || !idpCertificate) {
      return res.status(400).json({ message: "idpEntityId, idpSsoUrl, and idpCertificate are required" });
    }

    const tenantId = req.user!.tenantId;

    await db.sSOConfig.upsert({
      where: { tenantId },
      update: {
        provider: "saml",
        entityId: idpEntityId,
        ssoUrl: idpSsoUrl,
        certificate: idpCertificate,
        clientId: spEntityId || null,
        active: true,
      },
      create: {
        tenantId,
        provider: "saml",
        entityId: idpEntityId,
        ssoUrl: idpSsoUrl,
        certificate: idpCertificate,
        clientId: spEntityId || null,
        active: true,
      },
    });

    res.json({
      message: "SAML IdP configuration saved",
      tenantId,
      status: "active",
    });
  } catch (error) {
    console.error("SAML config error:", error);
    res.status(500).json({ message: "Failed to save SAML configuration" });
  }
});

// GET /sso/saml/metadata - Get SP metadata for SAML IdP
router.get("/saml/metadata", (_req: Request, res: Response) => {
  const entityId = process.env.SAML_SP_ENTITY_ID || "winners-ecosystem-sp";
  const acsUrl = process.env.SAML_ACS_URL || "https://api.winnersempire.io/api/v1/sso/saml/acs";
  
  const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor entityID="${entityId}" xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata">
  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acsUrl}" index="0" isDefault="true"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;

  res.type("application/xml").send(metadata);
});

// POST /sso/saml/acs - SAML Assertion Consumer Service
router.post("/saml/acs", async (req: Request, res: Response) => {
  try {
    const { SAMLResponse, RelayState } = req.body;

    if (!SAMLResponse) {
      return res.status(400).json({ message: "SAMLResponse is required" });
    }

    // In production, parse and validate SAML response
    // For now, return placeholder for demo
    res.json({
      message: "SAML ACS endpoint ready",
      note: "SAML response parsing requires additional implementation",
    });
  } catch (error) {
    console.error("SAML ACS error:", error);
    res.status(500).json({ message: "Failed to process SAML response" });
  }
});

// GET /sso/saml/status - Get SAML configuration status
router.get("/saml/status", authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const config = await db.sSOConfig.findFirst({
      where: { tenantId, provider: "saml" },
    });

    if (!config) {
      return res.json({ configured: false, message: "No SAML configuration found" });
    }

    res.json({
      configured: true,
      entityId: config.entityId,
      ssoUrl: config.ssoUrl,
      active: config.active,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error("SAML status error:", error);
    res.status(500).json({ message: "Failed to get SAML status" });
  }
});

// DELETE /sso/saml - Remove SAML configuration
router.delete("/saml", authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    await db.sSOConfig.deleteMany({
      where: { tenantId, provider: "saml" },
    });

    res.json({ message: "SAML configuration removed" });
  } catch (error) {
    console.error("SAML delete error:", error);
    res.status(500).json({ message: "Failed to remove SAML configuration" });
  }
});

// GET /sso/okta/config - Check Okta configuration
router.get("/okta/config", (_req: Request, res: Response) => {
  const domain = process.env.OKTA_DOMAIN;
  const clientId = process.env.OKTA_CLIENT_ID;
  const redirectUri = process.env.OKTA_REDIRECT_URI;

  if (!domain || !clientId) {
    return res.json({ enabled: false, message: "Okta not configured" });
  }

  const authUrl = `https://${domain}/oauth2/v1/authorize`;
  const scope = encodeURIComponent("openid profile email");
  const redirect = encodeURIComponent(redirectUri || "");

  res.json({
    enabled: true,
    authUrl: `${authUrl}?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${redirect}`,
  });
});

// POST /sso/okta/callback - Okta OAuth callback
router.post("/okta/callback", async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;
    const domain = process.env.OKTA_DOMAIN;
    const clientId = process.env.OKTA_CLIENT_ID;
    const clientSecret = process.env.OKTA_CLIENT_SECRET;
    const redirectUri = process.env.OKTA_REDIRECT_URI;

    if (!code) {
      return res.status(400).json({ message: "Authorization code required" });
    }

    if (!domain || !clientId || !clientSecret) {
      return res.status(500).json({ message: "Okta not configured" });
    }

    const tokenRes = await fetch(`https://${domain}/oauth2/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret!,
        redirect_uri: redirectUri || "",
      }),
    });

    if (!tokenRes.ok) {
      throw new Error("Failed to exchange authorization code");
    }

    const tokens = await tokenRes.json();

    const userInfoRes = await fetch(`https://${domain}/oauth2/v1/userinfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const userInfo = await userInfoRes.json();

    res.json({
      success: true,
      user: {
        email: userInfo.email,
        name: userInfo.name,
        subject: userInfo.sub,
      },
    });
  } catch (error) {
    console.error("Okta callback error:", error);
    res.status(500).json({ message: "Failed to process Okta callback" });
  }
});

// GET /sso/azuread/config - Check Azure AD configuration
router.get("/azuread/config", (_req: Request, res: Response) => {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const redirectUri = process.env.AZURE_REDIRECT_URI;

  if (!tenantId || !clientId) {
    return res.json({ enabled: false, message: "Azure AD not configured" });
  }

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;
  const scope = encodeURIComponent("openid profile email User.Read");
  const redirect = encodeURIComponent(redirectUri || "");

  res.json({
    enabled: true,
    authUrl: `${authUrl}?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${redirect}`,
  });
});

// POST /sso/azuread/callback - Azure AD OAuth callback
router.post("/azuread/callback", async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const redirectUri = process.env.AZURE_REDIRECT_URI;

    if (!code) {
      return res.status(400).json({ message: "Authorization code required" });
    }

    if (!tenantId || !clientId || !clientSecret) {
      return res.status(500).json({ message: "Azure AD not configured" });
    }

    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret!,
        redirect_uri: redirectUri || "",
        scope: "openid profile email User.Read",
      }),
    });

    if (!tokenRes.ok) {
      throw new Error("Failed to exchange authorization code");
    }

    const tokens = await tokenRes.json();

    const graphRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const userInfo = await graphRes.json();

    res.json({
      success: true,
      user: {
        email: userInfo.mail || userInfo.userPrincipalName,
        name: userInfo.displayName,
        subject: userInfo.id,
      },
    });
  } catch (error) {
    console.error("Azure AD callback error:", error);
    res.status(500).json({ message: "Failed to process Azure AD callback" });
  }
});

export default router;
