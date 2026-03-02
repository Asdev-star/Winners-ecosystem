// Server/middleware/rateLimitMiddleware.ts
// Phase 1 — Core Engine Hardening
// Rate limiting + security headers
// Install: npm install express-rate-limit helmet
// Register in Server/index.ts BEFORE all routes

import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

// Helper to get IP safely for rate limiting (handles IPv6)
function getClientIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

// ─── Security Headers (helmet) ────────────────────────────────────────────────
// app.use(helmetConfig) — add to Server/index.ts

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'"],   // relax for Vite dev
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "https:"],
      connectSrc:  ["'self'", "wss:", "ws:", "https:"],
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // allow embedding in Railway iframe
});

// ─── Global API Rate Limit ────────────────────────────────────────────────────
// 200 requests per 15 minutes per IP

export const globalLimiter = rateLimit({
  windowMs:          15 * 60 * 1000, // 15 minutes
  max:               200,
  standardHeaders:   true,
  legacyHeaders:     false,
  skipSuccessfulRequests: false,
  message: {
    error:   "Too many requests",
    message: "Rate limit exceeded. Please wait before trying again.",
    retryAfter: "15 minutes",
  },
});

// ─── Auth Route Limiter (strict) ──────────────────────────────────────────────
// 10 attempts per 15 minutes — prevents brute force

export const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true,  // don't count successful logins
  message: {
    error:   "Too many authentication attempts",
    message: "Account temporarily locked. Please wait 15 minutes.",
    retryAfter: "15 minutes",
  },
  keyGenerator: (req: Request) => {
    // Rate limit per IP + email combo
    const ip = getClientIp(req);
    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    return `${ip}:${email}`;
  },
});

// ─── Invite / Signup Limiter ──────────────────────────────────────────────────
// 5 invites per hour per user

export const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    error:   "Invite limit reached",
    message: "You can send up to 5 invites per hour.",
  },
});

// ─── Post Creation Limiter ────────────────────────────────────────────────────
// 30 posts per hour per user (Community)

export const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      30,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    error:   "Post limit reached",
    message: "You've posted too frequently. Try again in an hour.",
  },
  keyGenerator: (req: Request) => {
    // Per user ID if authenticated, otherwise IP
    const userId = (req as any).user?.userId;
    return userId ?? getClientIp(req);
  },
});

// ─── AI / Claude API Limiter ──────────────────────────────────────────────────
// 20 AI requests per hour per user (expensive)

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    error:   "AI limit reached",
    message: "You've used your AI recommendation quota for this hour.",
  },
  keyGenerator: (req: Request) => (req as any).user?.userId ?? req.ip,
});

// ─── XSS / Injection Sanitizer ───────────────────────────────────────────────
// Strips common XSS patterns from req.body string fields

export function xssSanitizer(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");
  }
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === "object" && obj !== null) {
    const sanitized: any = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

// ─── Request Logger ───────────────────────────────────────────────────────────
// Simple structured request log for debugging

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on("finish", () => {
    const ms    = Date.now() - start;
    const color = res.statusCode >= 500 ? "\x1b[31m" :
                  res.statusCode >= 400 ? "\x1b[33m" :
                  res.statusCode >= 200 ? "\x1b[32m" : "\x1b[0m";
    console.log(`${color}${req.method} ${req.path} ${res.statusCode} ${ms}ms\x1b[0m`);
  });
  next();
}