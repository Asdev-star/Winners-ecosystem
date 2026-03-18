// Server/middleware/superAdminMiddleware.ts
// Admin Sovereign Territory - Security through obscurity
// Returns 404 instead of 403 to not reveal admin exists

import type { Request, Response, NextFunction } from "express";

export function superAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) ?? [];

  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Never reveal the admin exists — return a plain 404
  if (!adminEmails.includes(req.user.email)) {
    return res.status(404).json({ error: "Not found" });
  }

  next();
}