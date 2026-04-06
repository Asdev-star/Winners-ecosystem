// server/middleware/authMiddleware.ts

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { extractAuthTokenFromRequest } from "../services/authCookieService.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId:     string;
  tenantId:   string;
  tenantName: string;
  email:      string;
  role:       "owner" | "admin" | "member" | "viewer";
  isImpersonation?: boolean;
  adminId?: string;
  iat?:       number;
  exp?:       number;
}

export type AccountPlan = "FREE" | "PRO" | "ENTERPRISE";

export interface AuthenticatedUser extends JwtPayload {
  plan?: AccountPlan;
}

export type AuthRequest = Request & {
  user: AuthenticatedUser;
  imageLimit?: number;
};

// Extend Express.User so req.user resolves cleanly across middleware and passport types.
declare global {
  namespace Express {
    interface User extends AuthenticatedUser {
      __authBrand?: never;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET ?? "winners_dev_secret_change_in_prod";

// ─── JWT Middleware ───────────────────────────────────────────────────────────
// Verifies the Bearer token and attaches decoded payload to req.user.
// Also injects tenant context so every downstream handler is tenant-scoped.

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = extractAuthTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ─── Role Guard ───────────────────────────────────────────────────────────────
// Usage: router.delete("/tenant", authMiddleware, requireRole("owner"), handler)

const ROLE_HIERARCHY = { owner: 4, admin: 3, member: 2, viewer: 1 };

export function requireRole(...roles: JwtPayload["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export function requireMinRole(minRole: JwtPayload["role"]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minRole]) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

// ─── Tenant Scope Guard ───────────────────────────────────────────────────────
// Ensures that route params / body tenant IDs match the token's tenant.
// Prevents cross-tenant data access.

export function enforceTenantScope(req: Request, res: Response, next: NextFunction) {
  const tokenTenantId  = req.user?.tenantId;
  const paramTenantId  = req.params.tenantId ?? req.body?.tenantId;

  if (paramTenantId && paramTenantId !== tokenTenantId) {
    return res.status(403).json({ message: "Cross-tenant access denied" });
  }

  next();
}
