// Server/middleware/securityMiddleware.ts
// Version-agnostic fix: no ipKeyGenerator import needed
// Normalizes IPv6 manually — works with any express-rate-limit version

import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

// ─── IPv6-safe IP normalizer ──────────────────────────────────────────────────
// Converts ::ffff:1.2.3.4 (IPv4-mapped IPv6) to 1.2.3.4
// Prevents IPv6 users from bypassing limits that IPv4 users are subject to

function normalizeIp(req: Request): string {
  const ip = req.ip ?? req.socket?.remoteAddress ?? "unknown";
  // Strip IPv4-mapped IPv6 prefix
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  return ip;
}

// ─── Helmet ───────────────────────────────────────────────────────────────────

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      styleSrc:       ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:        ["'self'", "https://fonts.gstatic.com"],
      imgSrc:         ["'self'", "data:", "https:"],
      connectSrc:     ["'self'", "https://api.stripe.com", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      frameSrc:       ["https://js.stripe.com", "https://hooks.stripe.com"],
      objectSrc:      ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

// ─── Global Rate Limiter ───────────────────────────────────────────────────────
// No custom keyGenerator — express-rate-limit default is already IPv6-safe

export const globalRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             500,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: "Too many requests. Please try again later.", retryAfter: "15 minutes" },
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});

// ─── Auth Rate Limiter ────────────────────────────────────────────────────────

export const authRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: "Too many authentication attempts. Please wait 15 minutes.", code: "AUTH_RATE_LIMITED" },
  keyGenerator:    (req) => `${normalizeIp(req)}:auth`,
});

// ─── Password Reset Rate Limiter ───────────────────────────────────────────────

export const passwordResetRateLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: "Too many password reset attempts. Please wait 1 hour.", code: "RESET_RATE_LIMITED" },
  keyGenerator:    (req) => `${normalizeIp(req)}:password-reset`,
});

// ─── API Rate Limiter ─────────────────────────────────────────────────────────

export const apiRateLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             120,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: "API rate limit exceeded. Please slow down.", code: "API_RATE_LIMITED" },
  keyGenerator:    (req: Request) => {
    const userId = (req as any).user?.userId;
    return userId ? `user:${userId}` : `ip:${normalizeIp(req)}`;
  },
});

// ─── Export Rate Limiter ───────────────────────────────────────────────────────

export const exportRateLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             50,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: "Export rate limit exceeded. Maximum 50 exports per hour.", code: "EXPORT_RATE_LIMITED" },
  keyGenerator:    (req: Request) => {
    const userId = (req as any).user?.userId;
    return `export:${userId ?? normalizeIp(req)}`;
  },
});

// ─── XSS Sanitization ─────────────────────────────────────────────────────────

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /vbscript:/gi,
];

function sanitizeString(value: string): string {
  let s = value;
  for (const p of XSS_PATTERNS) s = s.replace(p, "");
  return s.trim();
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value))     return value.map(sanitizeValue);
  if (value && typeof value === "object") return sanitizeObject(value as Record<string, unknown>);
  return value;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) result[k] = sanitizeValue(v);
  return result;
}

export function xssSanitizer(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body as Record<string, unknown>);
  }
  next();
}

// ─── Request Size Guard ────────────────────────────────────────────────────────

export function requestSizeGuard(req: Request, res: Response, next: NextFunction): void {
  const contentLength = parseInt(req.headers["content-length"] ?? "0");
  const MAX_BYTES = 10 * 1024 * 1024;
  if (contentLength > MAX_BYTES) {
    res.status(413).json({ error: "Request payload too large. Maximum size is 10MB." });
    return;
  }
  next();
}