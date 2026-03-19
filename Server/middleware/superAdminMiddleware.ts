// Server/middleware/superAdminMiddleware.ts
// Admin Sovereign Territory - Security through obscurity
// Returns 404 instead of 401/403 to not reveal admin exists

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "./authMiddleware.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "winners_dev_secret_change_in_prod";

export function getSuperAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdminEmail(email: string | undefined | null) {
  if (!email) return false;
  return getSuperAdminEmails().includes(email.trim().toLowerCase());
}

function concealedNotFound(res: Response) {
  return res.status(404).json({ error: "Not found" });
}

export function concealedSuperAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return concealedNotFound(res);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;

    if (!isSuperAdminEmail(decoded.email)) {
      return concealedNotFound(res);
    }

    next();
  } catch {
    return concealedNotFound(res);
  }
}

export function superAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return concealedNotFound(res);
  }

  // Never reveal the admin exists — return a plain 404
  if (!isSuperAdminEmail(req.user.email)) {
    return concealedNotFound(res);
  }

  next();
}
