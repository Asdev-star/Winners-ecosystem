// Server/middleware/superAdminMiddleware.ts
// Admin Sovereign Territory - Security through obscurity
// Returns 404 instead of 403 to not reveal admin exists

import type { Request, Response, NextFunction } from "express";

export function getSuperAdminEmails() {
  return process.env.ADMIN_EMAILS?.split(",").map((email) => email.trim()).filter(Boolean) ?? [];
}

export function isSuperAdminEmail(email: string | undefined | null) {
  if (!email) return false;
  return getSuperAdminEmails().includes(email);
}

export function superAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Never reveal the admin exists — return a plain 404
  if (!isSuperAdminEmail(req.user.email)) {
    return res.status(404).json({ error: "Not found" });
  }

  next();
}
