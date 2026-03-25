// server/middleware/rbacMiddleware.ts

import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "./authMiddleware.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Role = "owner" | "admin" | "member" | "viewer";

export interface Permission {
  viewDashboard:  boolean;
  viewForecasts:  boolean;
  inviteMembers:  boolean;
  exportReports:  boolean;
  manageBilling:  boolean;
  deleteTenant:   boolean;
  manageUsers:    boolean;
  viewAnalytics:  boolean;
}

// ─── Role Hierarchy ───────────────────────────────────────────────────────────

const ROLE_RANK: Record<Role, number> = {
  owner:  4,
  admin:  3,
  member: 2,
  viewer: 1,
};

// ─── Permission Map ───────────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<Role, Permission> = {
  owner: {
    viewDashboard: true,
    viewForecasts: true,
    inviteMembers: true,
    exportReports: true,
    manageBilling: true,
    deleteTenant:  true,
    manageUsers:   true,
    viewAnalytics: true,
  },
  admin: {
    viewDashboard: true,
    viewForecasts: true,
    inviteMembers: true,
    exportReports: true,
    manageBilling: false,
    deleteTenant:  false,
    manageUsers:   true,
    viewAnalytics: true,
  },
  member: {
    viewDashboard: true,
    viewForecasts: true,
    inviteMembers: false,
    exportReports: true,
    manageBilling: false,
    deleteTenant:  false,
    manageUsers:   false,
    viewAnalytics: true,
  },
  viewer: {
    viewDashboard: true,
    viewForecasts: false,
    inviteMembers: false,
    exportReports: false,
    manageBilling: false,
    deleteTenant:  false,
    manageUsers:   false,
    viewAnalytics: false,
  },
};

// ─── Guards ───────────────────────────────────────────────────────────────────

/** Require exact role(s) */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as Role | undefined;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

/** Require at least a minimum role level */
export function requireMinRole(min: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as Role | undefined;
    if (!userRole || ROLE_RANK[userRole] < ROLE_RANK[min]) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

/** Require a specific permission from the permission map */
export function requirePermission(permission: keyof Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as Role | undefined;
    if (!userRole || !ROLE_PERMISSIONS[userRole][permission]) {
      return res.status(403).json({ message: `Missing permission: ${permission}` });
    }
    next();
  };
}

/** Enforce tenant isolation — blocks cross-tenant requests */
export function enforceTenant(req: Request, res: Response, next: NextFunction) {
  const tokenTenantId = req.user?.tenantId;
  const paramTenantId = req.params.tenantId ?? req.body?.tenantId;

  if (paramTenantId && paramTenantId !== tokenTenantId) {
    return res.status(403).json({ message: "Cross-tenant access denied" });
  }
  next();
}

/** Attach permissions object to res.locals for use in route handlers */
export function attachPermissions(req: Request, res: Response, next: NextFunction) {
  const role = req.user?.role as Role | undefined;
  res.locals.permissions = role ? ROLE_PERMISSIONS[role] : null;
  next();
}