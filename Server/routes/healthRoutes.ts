// Server/routes/healthRoutes.ts
// ─── Core Infrastructure: Service Health Monitoring ───────────────────────────
// Provides: liveness probe, readiness probe, detailed dependency health checks
// Roadmap requirement: "Service health monitoring dashboard" (Block 1, Item 8)

import { Router, Request, Response } from "express";
import db from "../db.js";
import os from "os";

const router = Router();

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceCheck {
  status:   "ok" | "degraded" | "down";
  latency?: number;
  message?: string;
  detail?:  Record<string, unknown>;
}

interface HealthReport {
  status:     "ok" | "degraded" | "down";
  version:    string;
  env:        string;
  timestamp:  string;
  uptime:     number;
  services:   Record<string, ServiceCheck>;
  system:     Record<string, unknown>;
}

// ─── GET /health — Liveness Probe ─────────────────────────────────────────────
// Used by Railway/Docker for container health checks. Must be extremely fast.

router.get("/", (_req: Request, res: Response) => {
  res.json({
    status:    "ok",
    version:   process.env.npm_package_version ?? "1.0.0",
    env:       process.env.NODE_ENV ?? "development",
    timestamp: new Date().toISOString(),
    uptime:    Math.round(process.uptime()),
  });
});

// ─── GET /health/ready — Readiness Probe ──────────────────────────────────────
// Checks all dependencies before declaring the service ready to receive traffic

router.get("/ready", async (_req: Request, res: Response) => {
  const start = Date.now();
  const report: HealthReport = {
    status:    "ok",
    version:   process.env.npm_package_version ?? "1.0.0",
    env:       process.env.NODE_ENV ?? "development",
    timestamp: new Date().toISOString(),
    uptime:    Math.round(process.uptime()),
    services:  {},
    system:    {},
  };

  // ── Check: PostgreSQL via Prisma ─────────────────────────────────────────
  const dbStart = Date.now();
  try {
    await (db as any).$queryRaw`SELECT 1`;
    report.services.database = {
      status:  "ok",
      latency: Date.now() - dbStart,
      message: "PostgreSQL connected",
    };
  } catch (err: any) {
    report.services.database = {
      status:  "down",
      latency: Date.now() - dbStart,
      message: err.message,
    };
    report.status = "down";
  }

  // ── Check: Environment Variables ─────────────────────────────────────────
  const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];
  const missingEnvVars  = requiredEnvVars.filter((v) => !process.env[v]);

  report.services.environment = {
    status:  missingEnvVars.length === 0 ? "ok" : "degraded",
    message: missingEnvVars.length === 0
      ? "All required environment variables present"
      : `Missing: ${missingEnvVars.join(", ")}`,
    detail:  {
      stripe:   !!process.env.STRIPE_SECRET_KEY,
      resend:   !!process.env.RESEND_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
    },
  };

  if (missingEnvVars.length > 0 && report.status === "ok") {
    report.status = "degraded";
  }

  // ── Check: Memory Usage ───────────────────────────────────────────────────
  const memUsage    = process.memoryUsage();
  const heapUsedMB  = Math.round(memUsage.heapUsed  / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const heapPercent = Math.round((heapUsedMB / heapTotalMB) * 100);

  report.services.memory = {
    status:  heapPercent > 90 ? "degraded" : "ok",
    message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapPercent}%)`,
    detail:  {
      heapUsedMB,
      heapTotalMB,
      heapPercent,
      rssMB: Math.round(memUsage.rss / 1024 / 1024),
    },
  };

  // ── System Info ───────────────────────────────────────────────────────────
  const cpuLoad = os.loadavg();
  report.system = {
    platform:   process.platform,
    nodeVersion: process.version,
    cpuCount:   os.cpus().length,
    loadAvg:    { "1m": cpuLoad[0].toFixed(2), "5m": cpuLoad[1].toFixed(2), "15m": cpuLoad[2].toFixed(2) },
    totalMemGB: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
    freeMemGB:  (os.freemem()  / 1024 / 1024 / 1024).toFixed(2),
  };

  // ── Final Latency ─────────────────────────────────────────────────────────
  (report as any).totalLatency = Date.now() - start;

  const httpStatus = report.status === "ok" ? 200 : report.status === "degraded" ? 207 : 503;
  res.status(httpStatus).json(report);
});

// ─── GET /health/db — Database Specific Check ─────────────────────────────────

router.get("/db", async (_req: Request, res: Response) => {
  const start = Date.now();
  try {
    await (db as any).$queryRaw`SELECT 1`;

    // Count key tables for sanity
    const [tenants, users, posts] = await Promise.all([
      db.tenant.count(),
      db.user.count(),
      db.post.count(),
    ]);

    res.json({
      status:    "ok",
      latency:   Date.now() - start,
      timestamp: new Date().toISOString(),
      stats:     { tenants, users, posts },
    });
  } catch (err: any) {
    res.status(503).json({
      status:    "down",
      latency:   Date.now() - start,
      timestamp: new Date().toISOString(),
      error:     err.message,
    });
  }
});

export default router;
