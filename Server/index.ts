// Server/index.ts — Core Infrastructure V1.1 (Hardened)
// ─── Block 1 Complete: Security + API Gateway + Health + GDPR + Registry ──────

import "dotenv/config";
import express                from "express";
import cors                   from "cors";
import path                   from "path";
import { fileURLToPath }      from "url";

// ── Core Infrastructure: Security Layer (Block 1 — Item 1) ─────────────────────
import {
  helmetMiddleware,
  globalRateLimiter,
  xssSanitizer,
  requestSizeGuard,
} from "./middleware/securityMiddleware.js";

// ── Core Infrastructure: App Registry (Block 1 — Item 2) ──────────────────────
import "./services/appRegistry.js"; // Self-registers all platform modules at startup

// ── Core Infrastructure: Versioned API Gateway (Block 1 — Item 5) ─────────────
import v1Router from "./routes/apiRouter.js";

// ── Scheduler ─────────────────────────────────────────────────────────────────
import { startEmailScheduler } from "./services/emailScheduler.js";

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app    = express();
const PORT   = process.env.PORT ?? 3001;
const isProd = process.env.NODE_ENV === "production";

type ErrorWithMeta = Error & {
  status?: number;
  statusCode?: number;
  code?: string;
  requestId?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE STACK (Order is critical — security layers must be first)
// ─────────────────────────────────────────────────────────────────────────────

// 1. HTTP Security Headers — XSS, clickjacking, MIME sniffing
app.use(helmetMiddleware);

// 2. Request Size Guard — reject oversized payloads early
app.use(requestSizeGuard);

// 3. CORS — scoped to known origins only
app.use(cors({
  origin: isProd
    ? [process.env.APP_URL ?? "", /\.railway\.app$/, /\.winnersempire\.io$/]
    : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods:     ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-Tenant-ID"],
  exposedHeaders: ["X-Request-ID", "X-API-Version", "X-RateLimit-Remaining"],
}));

// 4. Body Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 5. XSS Sanitization — strip dangerous patterns from all string inputs
app.use(xssSanitizer);

// ─────────────────────────────────────────────────────────────────────────────
// LIVENESS PROBE — Must be outside the rate limiter and auth for container health
// (Block 1 — Item 8: Service health monitoring)
// ─────────────────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status:    "ok",
    version:   "1.1.0",
    env:       process.env.NODE_ENV ?? "development",
    timestamp: new Date().toISOString(),
    uptime:    Math.round(process.uptime()),
  });
});

// 6. Global Rate Limiting — 500 req/15min per IP
app.use(globalRateLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// VERSIONED API GATEWAY — All routes under /api/v1/*
// (Block 1 — Item 5: Internal API Gateway)
// ─────────────────────────────────────────────────────────────────────────────

app.use("/api/v1", v1Router);

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY ROUTE COMPATIBILITY — Redirect old unversioned routes to v1
// Allows frontend to migrate gradually without breaking changes
// ─────────────────────────────────────────────────────────────────────────────

const LEGACY_ROUTES = [
  "/auth", "/tenants", "/users", "/analytics", "/export", "/billing",
  "/ai", "/profile", "/email", "/notifications", "/stripe", "/search",
  "/activity", "/referral", "/admin", "/changelog", "/2fa", "/posts", "/groups",
  "/gdpr", "/registry", "/slack", "/sso",
];

for (const route of LEGACY_ROUTES) {
  app.use(route, (req, res) => {
    res.redirect(307, `/api/v1${route}${req.url === "/" ? "" : req.url}`);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// REACT FRONTEND (Production)
// ─────────────────────────────────────────────────────────────────────────────

if (isProd) {
  const distPath = path.join(__dirname, "../../dist");
  app.use(express.static(distPath));

  // Express v5 compatible wildcard — serve SPA for all non-API routes
  app.get("/{*path}", (req, res) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ error: "API endpoint not found", path: req.path });
      return;
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────────────────────────────────────

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  void next;
  const normalized: ErrorWithMeta =
    err instanceof Error ? (err as ErrorWithMeta) : new Error("Unknown error");
  const status = normalized.status ?? normalized.statusCode ?? 500;
  const message = isProd && status === 500 ? "Internal server error" : normalized.message;

  console.error(`[ERROR] ${status} — ${normalized.message}`, {
    stack: normalized.stack,
    code: normalized.code,
  });

  res.status(status).json({
    error:     message,
    code:      normalized.code ?? "INTERNAL_ERROR",
    requestId: normalized.requestId,
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SERVER STARTUP
// ─────────────────────────────────────────────────────────────────────────────

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`\n✅ Winners Ecosystem API — v1.1.0`);
  console.log(`   Port:        ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV ?? "development"}`);
  console.log(`   API Gateway: http://localhost:${PORT}/api/v1`);
  console.log(`   Health:      http://localhost:${PORT}/health`);
  console.log(`   Ready:       http://localhost:${PORT}/api/v1/health/ready\n`);

  if (isProd) startEmailScheduler();
});

export default app;
