// Server/routes/authRoutes.ts

import { Router, type Request, type Response } from "express";
import type { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import passport from "passport";
import passportFacebook from "passport-facebook";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import type { JwtPayload } from "../middleware/authMiddleware.js";
import { logActivity, ACTIONS } from "../services/activityService.js";
import { emitAdminEvent } from "../services/adminEventService.js";
import { buildReturningOmegaBriefing, extractOnboardingState } from "../services/returningOmegaBriefingService.js";

const router = Router();
const FacebookStrategy = passportFacebook.Strategy;

const JWT_SECRET           = process.env.JWT_SECRET           ?? "winners_dev_secret_change_in_prod";
const JWT_EXPIRES_IN       = process.env.JWT_EXPIRES_IN       ?? "8h";
const JWT_REFRESH_EXPIRES  = process.env.JWT_REFRESH_EXPIRES  ?? "7d";
const GOOGLE_CLIENT_ID      = process.env.GOOGLE_CLIENT_ID      ?? "";
const GOOGLE_CLIENT_SECRET  = process.env.GOOGLE_CLIENT_SECRET  ?? "";
const FACEBOOK_APP_ID       = process.env.FACEBOOK_APP_ID       ?? "";
const FACEBOOK_APP_SECRET   = process.env.FACEBOOK_APP_SECRET   ?? "";
const APP_URL               = process.env.APP_URL               ?? "http://localhost:5173";
const SERVER_URL            = process.env.SERVER_URL            ?? "http://localhost:3001";

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

async function handleReferral(refCode: string | undefined, userId: string, email: string, name: string) {
  if (!refCode) return;
  try {
    const { processReferral } = await import("../services/referralService.js");
    await processReferral(refCode, userId, email, name);
  } catch {
    /* silent - referral failure should never block signup */
  }
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Internal server error";
}

function emitSignupAdminEvent(user: { id: string; name: string; email: string; tenant: { name: string } }) {
  emitAdminEvent({
    type: "user_signup",
    urgency: "info",
    message: `${user.name} signed up in ${user.tenant.name}.`,
    link: `/admin/users/${user.id}`,
  });
}

const authUserSelect = {
  id: true,
  email: true,
  name: true,
  password: true,
  role: true,
  tenantId: true,
  metadata: true,
  onboardingDone: true,
  profileType: true,
  firstPlatform: true,
  omegaMission: true,
  primarySkills: true,
  skills: true,
  tenant: {
    select: {
      name: true,
    },
  },
} as const;

type AuthUser = Prisma.UserGetPayload<{ select: typeof authUserSelect }>;

function buildLoginRedirectUrl(user: AuthUser, token: string, refreshToken: string, omegaWelcome?: unknown) {
  const userJson = encodeURIComponent(JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.toLowerCase(),
    tenantId: user.tenantId,
    tenantName: user.tenant.name,
    ...extractOnboardingState(user),
  }));
  const omegaWelcomeJson = omegaWelcome ? encodeURIComponent(JSON.stringify(omegaWelcome)) : "";
  return `${APP_URL}/login?token=${token}&refreshToken=${refreshToken}&user=${userJson}${omegaWelcomeJson ? `&omegaWelcome=${omegaWelcomeJson}` : ""}`;
}

async function findOrCreateFacebookUser(profile: { id?: string; email?: string; name?: string }) {
  const email = profile.email?.toLowerCase().trim();
  if (!email) throw new Error("No email from Facebook");

  let user = await db.user.findFirst({
    where: { email, deletedAt: null },
    select: authUserSelect,
  });

  const isNewUser = !user;
  if (!user) {
    const displayName = profile.name?.trim() || email.split("@")[0];
    const tenant = await db.tenant.create({ data: { name: `${displayName}'s Workspace` } });
    user = await db.user.create({
      data: {
        tenantId: tenant.id,
        email,
        name: displayName,
        password: await bcrypt.hash(profile.id ?? email, 10),
        role: "OWNER",
      },
      include: { tenant: true },
    });
    emitSignupAdminEvent(user);
  }

  return { user, isNewUser };
}

if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: `${SERVER_URL}/auth/facebook/callback`,
        profileFields: ["id", "emails", "name", "picture.type(large)"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const fallbackName = [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(" ").trim();
          const { user } = await findOrCreateFacebookUser({
            id: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName || fallbackName,
          });
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );
}

// ─── POST /auth/register ──────────────────────────────────────────────────────

router.post("/register", async (req: Request, res: Response) => {
  const { email, password, name, refCode } = req.body;
  if (!email || !password || !name) return res.status(400).json({ message: "Email, password and name are required" });

  try {
    const existing = await db.user.findFirst({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const tenant = await db.tenant.create({ data: { name: `${name}'s Workspace` } });
    const hashed = await bcrypt.hash(password, 10);
    const user   = await db.user.create({
      data:    { tenantId: tenant.id, email: email.toLowerCase().trim(), name, password: hashed, role: "OWNER" },
      include: { tenant: true },
    });

    // Process referral if code present
    await handleReferral(refCode, user.id, user.email, user.name);

    await logActivity({
      tenantId: user.tenantId, userId: user.id, userEmail: user.email,
      userName: user.name, action: "Account registered", category: "auth", ip: req.ip,
    });
    emitSignupAdminEvent(user);

    const payload      = buildPayload(user);
    const token        = signToken(payload, JWT_EXPIRES_IN);
    const refreshToken = signToken(payload, JWT_REFRESH_EXPIRES);

    return res.status(201).json({
      token, refreshToken, isNewUser: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(),
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        ...extractOnboardingState(user),
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

  try {
    const user = await db.user.findFirst({
      where:   { email: email.toLowerCase().trim(), deletedAt: null },
      select: authUserSelect,
    });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const payload      = buildPayload(user);
    const token        = signToken(payload, JWT_EXPIRES_IN);
    const refreshToken = signToken(payload, JWT_REFRESH_EXPIRES);
    const onboardingState = extractOnboardingState(user);
    const omegaWelcome = await buildReturningOmegaBriefing(user);

    await logActivity({
      tenantId: user.tenantId, userId: user.id, userEmail: user.email,
      userName: user.name, action: ACTIONS.LOGIN, category: "auth", ip: req.ip,
    });

    return res.json({
      token, refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(),
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        ...onboardingState,
      },
      omegaWelcome,
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
      userId: decoded.userId,
      email: decoded.email,
      tenantId: decoded.tenantId,
      tenantName: decoded.tenantName,
      role: decoded.role,
      ...(decoded.isImpersonation ? { isImpersonation: true, adminId: decoded.adminId } : {}),
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
      where: { id: req.user!.userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        metadata: true,
        onboardingDone: true,
        profileType: true,
        firstPlatform: true,
        omegaMission: true,
        primarySkills: true,
        skills: true,
        tenant: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toLowerCase(),
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      ...extractOnboardingState(user),
      isImpersonation: Boolean(req.user?.isImpersonation),
      impersonatedByAdminId: req.user?.adminId,
    });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /auth/accept-invite ─────────────────────────────────────────────────

router.post("/accept-invite", async (req: Request, res: Response) => {
  const { token, name, password, refCode } = req.body;
  if (!token || !name || !password) return res.status(400).json({ message: "token, name and password are required" });

  try {
    const invite = await db.invite.findUnique({ where: { token }, include: { tenant: true } });
    if (!invite)                       return res.status(404).json({ message: "Invite not found" });
    if (invite.accepted)               return res.status(400).json({ message: "Invite already used" });
    if (new Date() > invite.expiresAt) return res.status(400).json({ message: "Invite expired" });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await db.user.create({
      data:    { tenantId: invite.tenantId, email: invite.email, name, password: hashed, role: invite.role },
      include: { tenant: true },
    });

    await db.invite.update({ where: { id: invite.id }, data: { accepted: true } });

    // Process referral if code present
    await handleReferral(refCode, user.id, user.email, user.name);

    await logActivity({
      tenantId: invite.tenantId, userId: user.id, userEmail: user.email,
      userName: user.name, action: ACTIONS.MEMBER_INVITED, category: "team",
      metadata: { role: invite.role }, ip: req.ip,
    });
    emitSignupAdminEvent(user);

    const payload      = buildPayload(user);
    const jwtToken     = signToken(payload, JWT_EXPIRES_IN);
    const refreshToken = signToken(payload, JWT_REFRESH_EXPIRES);

    return res.status(201).json({
      token: jwtToken, refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(),
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        ...extractOnboardingState(user),
      },
    });
  } catch (err) {
    console.error("Accept invite error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────

router.get("/google", (_req: Request, res: Response) => {
  const redirectUri = `${SERVER_URL}/auth/google/callback`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id",     GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri",  redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope",         "openid email profile");
  url.searchParams.set("access_type",   "offline");
  url.searchParams.set("prompt",        "select_account");
  return res.redirect(url.toString());
});

router.post("/google/exchange", async (req: Request, res: Response) => {
  const { code, redirectUri, refCode } = req.body;
  try {
    const client     = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
    const { tokens } = await client.getToken(code);
    const ticket     = await client.verifyIdToken({ idToken: tokens.id_token!, audience: GOOGLE_CLIENT_ID });
    const payload    = ticket.getPayload();
    if (!payload?.email) return res.status(400).json({ message: "No email from Google" });

    const { email, name, sub: googleId } = payload;
    let user = await db.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      select: authUserSelect,
    });

    const isNewUser = !user;
    if (!user) {
      const tenant = await db.tenant.create({ data: { name: name ? `${name}'s Workspace` : "My Workspace" } });
      user = await db.user.create({
        data:    { tenantId: tenant.id, email: email.toLowerCase(), name: name ?? email.split("@")[0], password: await bcrypt.hash(googleId, 10), role: "OWNER" },
        include: { tenant: true },
      });

      // Process referral for new Google users
      await handleReferral(refCode, user.id, user.email, user.name);
      emitSignupAdminEvent(user);
    }

    const onboardingState = extractOnboardingState(user);
    const omegaWelcome = isNewUser ? null : await buildReturningOmegaBriefing(user);
    await logActivity({
      tenantId: user.tenantId, userId: user.id, userEmail: user.email,
      userName: user.name, action: isNewUser ? "New account created via Google" : ACTIONS.GOOGLE_LOGIN,
      category: "auth", ip: req.ip,
    });

    const jwtPayload = buildPayload(user);
    const token      = signToken(jwtPayload, JWT_EXPIRES_IN);
    return res.json({
      token, isNewUser,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(),
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        ...onboardingState,
      },
      omegaWelcome,
    });
  } catch (err) {
    console.error("Google exchange error:", err);
    return res.status(500).json({ message: errorMessage(err) });
  }
});

router.get("/google/callback", async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code) return res.redirect(`${APP_URL}/login?error=no_code`);

  try {
    const cbRedirectUri = `${SERVER_URL}/auth/google/callback`;
    const client        = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, cbRedirectUri);
    const { tokens }    = await client.getToken(code as string);
    client.setCredentials(tokens);

    const ticket        = await client.verifyIdToken({ idToken: tokens.id_token!, audience: GOOGLE_CLIENT_ID });
    const googlePayload = ticket.getPayload();
    if (!googlePayload?.email) return res.redirect(`${APP_URL}/login?error=no_email`);

    const { email, name, sub: googleId } = googlePayload;
    let user = await db.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      select: authUserSelect,
    });

    if (!user) {
      const tenant = await db.tenant.create({ data: { name: name ? `${name}'s Workspace` : "My Workspace" } });
      user = await db.user.create({
        data:    { tenantId: tenant.id, email: email.toLowerCase(), name: name ?? email.split("@")[0], password: await bcrypt.hash(googleId, 10), role: "OWNER" },
        include: { tenant: true },
      });
      emitSignupAdminEvent(user);
    }

    const onboardingState = extractOnboardingState(user);
    const omegaWelcome = await buildReturningOmegaBriefing(user);
    await logActivity({
      tenantId: user.tenantId, userId: user.id, userEmail: user.email,
      userName: user.name, action: ACTIONS.GOOGLE_LOGIN, category: "auth", ip: req.ip,
    });

    const jwtPayload   = buildPayload(user);
    const token        = signToken(jwtPayload, JWT_EXPIRES_IN);
    const refreshToken = signToken(jwtPayload, JWT_REFRESH_EXPIRES);
    return res.redirect(buildLoginRedirectUrl(user, token, refreshToken, omegaWelcome));
  } catch (err) {
    console.error("Google OAuth error:", err);
    return res.redirect(`${APP_URL}/login?error=oauth_failed`);
  }
});

// ─── Facebook OAuth ───────────────────────────────────────────────────────────

router.get("/facebook", (req: Request, res: Response, next) => {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    return res.status(503).json({ message: "Facebook OAuth not configured" });
  }

  return passport.authenticate("facebook", { scope: ["email"], session: false })(req, res, next);
});

router.get(
  "/facebook/callback",
  (req: Request, res: Response, next) => {
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return res.redirect(`${APP_URL}/login?error=facebook_not_configured`);
    }

    return passport.authenticate("facebook", {
      session: false,
      failureRedirect: `${APP_URL}/login?error=oauth_failed`,
    })(req, res, next);
  },
  async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthUser | undefined;
      if (!user) return res.redirect(`${APP_URL}/login?error=oauth_failed`);

      const omegaWelcome = await buildReturningOmegaBriefing(user);
      await logActivity({
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        action: "Login via Facebook",
        category: "auth",
        ip: req.ip,
      });

      const jwtPayload = buildPayload(user);
      const token = signToken(jwtPayload, JWT_EXPIRES_IN);
      const refreshToken = signToken(jwtPayload, JWT_REFRESH_EXPIRES);
      return res.redirect(buildLoginRedirectUrl(user, token, refreshToken, omegaWelcome));
    } catch (err) {
      console.error("Facebook OAuth callback error:", err);
      return res.redirect(`${APP_URL}/login?error=oauth_failed`);
    }
  },
);

router.post("/facebook/exchange", async (req: Request, res: Response) => {
  const { code, redirectUri } = req.body as { code?: string; redirectUri?: string };
  if (!code || !redirectUri) return res.status(400).json({ message: "code and redirectUri are required" });
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) return res.status(503).json({ message: "Facebook OAuth not configured" });

  try {
    const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id",     FACEBOOK_APP_ID);
    tokenUrl.searchParams.set("client_secret", FACEBOOK_APP_SECRET);
    tokenUrl.searchParams.set("redirect_uri",  redirectUri);
    tokenUrl.searchParams.set("code",          code);

    const tokenRes  = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json() as { access_token?: string; error?: { message: string } };

    if (!tokenRes.ok || !tokenData.access_token) {
      return res.status(400).json({ message: tokenData.error?.message ?? "Facebook token exchange failed" });
    }

    const profileUrl = new URL("https://graph.facebook.com/me");
    profileUrl.searchParams.set("fields",       "id,name,email");
    profileUrl.searchParams.set("access_token", tokenData.access_token);

    const profileRes  = await fetch(profileUrl.toString());
    const profile     = await profileRes.json() as { id?: string; name?: string; email?: string; error?: { message: string } };

    if (!profile.email) {
      return res.status(400).json({ message: "Facebook account has no email address. Please ensure your Facebook account has a verified email." });
    }

    const { user, isNewUser } = await findOrCreateFacebookUser({
      id: profile.id,
      email: profile.email,
      name: profile.name,
    });

    const onboardingState = extractOnboardingState(user);
    const omegaWelcome = isNewUser ? null : await buildReturningOmegaBriefing(user);
    await logActivity({
      tenantId: user.tenantId, userId: user.id, userEmail: user.email,
      userName: user.name, action: isNewUser ? "New account created via Facebook" : "Login via Facebook",
      category: "auth", ip: req.ip,
    });

    const jwtPayload = buildPayload(user);
    const token      = signToken(jwtPayload, JWT_EXPIRES_IN);

    return res.json({
      token, isNewUser,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(),
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        ...onboardingState,
      },
      omegaWelcome,
    });
  } catch (err) {
    console.error("Facebook exchange error:", err);
    return res.status(500).json({ message: errorMessage(err) });
  }
});

export default router;
