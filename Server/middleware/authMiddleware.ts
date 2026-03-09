// server/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId:     string;
  tenantId:   string;
  tenantName: string;
  email:      string;
  role:       "owner" | "admin" | "member" | "viewer";
  iat?:       number;
  exp?:       number;
}

// Extend Express Request so downstream handlers have access to req.user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET ?? "winners_dev_secret_change_in_prod";

// ─── JWT Middleware ───────────────────────────────────────────────────────────
// Verifies the Bearer token and attaches decoded payload to req.user.
// Also injects tenant context so every downstream handler is tenant-scoped.

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
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
