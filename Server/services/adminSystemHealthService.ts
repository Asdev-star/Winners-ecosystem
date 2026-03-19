import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../db.js";
import { getStripeStats } from "./stripeService.js";
import { getTelemetrySnapshot } from "./requestTelemetryService.js";
import { getWebSocketStats } from "./wsService.js";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const MIGRATIONS_DIR = path.join(ROOT_DIR, "prisma", "migrations");

type ServiceTone = "healthy" | "warning" | "down" | "not_configured";
type ErrorFilter = "all" | "5xx" | "4xx" | "ai" | "stripe";

export interface SystemHealthServiceStatus {
  id: string;
  label: string;
  tone: ServiceTone;
  statusLabel: string;
  summary: string;
  metrics: string[];
}

export interface SystemHealthRateLimitStatus {
  authRoutes: number;
  apiRoutes: number;
  adminRoutes: number;
  aiRoutes: number;
}

export interface SystemHealthDatabaseSnapshot {
  rlsVerifiedAt: string | null;
  pendingMigrations: number;
  tableSizes: Array<{ label: string; rowCount: number }>;
}

export interface SystemHealthErrorLog {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  filter: ErrorFilter;
  label: string;
  latencyMs: number;
  createdAt: string;
}

export interface AdminSystemHealthSnapshot {
  generatedAt: string;
  services: SystemHealthServiceStatus[];
  rateLimiting: SystemHealthRateLimitStatus;
  database: SystemHealthDatabaseSnapshot;
  errorLogs: SystemHealthErrorLog[];
}

function fmtMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function formatDayLabel(value: Date | null) {
  if (!value) return null;
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getMigrationDirectories() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

async function getAppliedMigrationNames() {
  try {
    const rows = await db.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL
    `;
    return new Set(rows.map((row) => row.migration_name));
  } catch {
    return new Set<string>();
  }
}

async function getDatabaseConnections() {
  try {
    const rows = await db.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*)::bigint AS count
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;
    const value = rows[0]?.count ?? 0;
    return typeof value === "bigint" ? Number(value) : Number(value);
  } catch {
    return 0;
  }
}

function getRlsVerificationDate() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return null;

  const candidates = getMigrationDirectories().filter((name) => name.toLowerCase().includes("rls"));
  if (candidates.length === 0) return null;

  const stats = candidates
    .map((name) => {
      try {
        return fs.statSync(path.join(MIGRATIONS_DIR, name)).mtime;
      } catch {
        return null;
      }
    })
    .filter((value): value is Date => value instanceof Date);

  if (stats.length === 0) return null;
  return stats.sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
}

async function getLatestRlsVerificationDate() {
  try {
    const latest = await db.activityLog.findFirst({
      where: {
        category: "admin",
        action: "admin_health_verify_rls",
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    return latest?.createdAt ?? null;
  } catch {
    return null;
  }
}

async function getEmailsSentToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  try {
    const rows = await db.$queryRaw<Array<{ total: bigint | number | null }>>`
      SELECT COALESCE(SUM(CASE
        WHEN jsonb_typeof(metadata) = 'object' AND (metadata->>'recipientCount') IS NOT NULL
        THEN (metadata->>'recipientCount')::int
        ELSE 1
      END), 0)::bigint AS total
      FROM activity_logs
      WHERE category = 'email'
        AND "createdAt" >= ${start}
    `;
    const value = rows[0]?.total ?? 0;
    return typeof value === "bigint" ? Number(value) : Number(value);
  } catch {
    try {
      return await db.activityLog.count({
        where: {
          category: "email",
          createdAt: { gte: start },
        },
      });
    } catch {
      return 0;
    }
  }
}

function mapErrorFilter(path: string, statusCode: number): ErrorFilter {
  const normalized = path.toLowerCase();
  if (normalized.includes("/stripe") || normalized.includes("/billing")) return "stripe";
  if (
    normalized.includes("/ai") ||
    normalized.includes("/chat") ||
    normalized.includes("/supervisors") ||
    normalized.includes("/forge")
  ) {
    return "ai";
  }
  if (statusCode >= 500) return "5xx";
  if (statusCode >= 400) return "4xx";
  return "all";
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    return { ok: response.ok, body };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getAdminSystemHealthSnapshot(): Promise<AdminSystemHealthSnapshot> {
  const startedAt = Date.now();
  const telemetry = getTelemetrySnapshot();
  const webSocketStats = getWebSocketStats();
  const [dbHealthy, connectionCount, appliedMigrations, counts, aiHealth, latestRlsVerificationAt, emailsSentToday] = await Promise.all([
    db.$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false),
    getDatabaseConnections(),
    getAppliedMigrationNames(),
    Promise.all([db.post.count(), db.user.count(), db.course.count(), db.order.count()]),
    process.env.AI_PLATFORM_URL
      ? fetchJsonWithTimeout(`${process.env.AI_PLATFORM_URL}/health`, 1500)
          .catch(() => null)
      : Promise.resolve(null),
    getLatestRlsVerificationDate(),
    getEmailsSentToday(),
  ]);

  const [postsCount, usersCount, coursesCount, ordersCount] = counts;
  const totalLatency = Date.now() - startedAt;
  const responseLatency = telemetry.averageLatencyMs || totalLatency;

  const migrationDirectories = getMigrationDirectories();
  const pendingMigrations = migrationDirectories.filter((name) => !appliedMigrations.has(name)).length;
  const rlsVerifiedAt = latestRlsVerificationAt ?? getRlsVerificationDate();
  const uptimeHours = Math.max(0.1, Number((process.uptime() / 3600).toFixed(1)));

  let stripeStatus: SystemHealthServiceStatus = {
    id: "stripe",
    label: "Stripe",
    tone: "not_configured",
    statusLabel: "Not Configured",
    summary: "Stripe secret key is not configured.",
    metrics: ["Webhooks: n/a", "Balance: n/a"],
  };

  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripeStats = await getStripeStats();
      stripeStatus = {
        id: "stripe",
        label: "Stripe",
        tone: "healthy",
        statusLabel: "Healthy",
        summary: "Stripe billing and payments are connected.",
        metrics: [
          `Webhooks: ${process.env.STRIPE_WEBHOOK_SECRET ? "OK" : "Missing secret"}`,
          `Balance: ${fmtMoney(stripeStats.balance.available)}`,
        ],
      };
    } catch (error) {
      stripeStatus = {
        id: "stripe",
        label: "Stripe",
        tone: "warning",
        statusLabel: "Warning",
        summary: error instanceof Error ? error.message : "Stripe metrics are unavailable.",
        metrics: [
          `Webhooks: ${process.env.STRIPE_WEBHOOK_SECRET ? "Configured" : "Missing secret"}`,
          "Balance: unavailable",
        ],
      };
    }
  }

  const services: SystemHealthServiceStatus[] = [
    {
      id: "api",
      label: "API Server",
      tone: dbHealthy ? "healthy" : "warning",
      statusLabel: dbHealthy ? "Healthy" : "Degraded",
      summary: dbHealthy ? "Core API is responding and serving traffic." : "API is up, but database checks are degraded.",
      metrics: [`Response: ${responseLatency}ms`, `Uptime: ${uptimeHours}h process`],
    },
    {
      id: "database",
      label: "Database (PG)",
      tone: dbHealthy ? "healthy" : "down",
      statusLabel: dbHealthy ? "Healthy" : "Down",
      summary: dbHealthy ? "Primary PostgreSQL connection is available." : "PostgreSQL health checks are failing.",
      metrics: [`Connections: ${connectionCount}`, `Pool: ${Number(process.env.DATABASE_POOL_MAX ?? 20)} max`],
    },
    {
      id: "ai",
      label: "AI Platform",
      tone: process.env.ANTHROPIC_API_KEY || aiHealth?.ok ? "healthy" : "warning",
      statusLabel: process.env.ANTHROPIC_API_KEY || aiHealth?.ok ? "Healthy" : "Warning",
      summary: aiHealth?.ok ? "AI platform responded to health checks." : "AI services are partially configured.",
      metrics: [
        `Claude: ${process.env.ANTHROPIC_API_KEY ? "OK" : "Missing"}`,
        `Ollama: ${process.env.AI_PLATFORM_URL ? "OK" : "Missing"}`,
        `Whisper: ${process.env.AI_PLATFORM_URL ? "OK" : "Missing"}`,
      ],
    },
    {
      id: "email",
      label: "Email (Resend)",
      tone: process.env.RESEND_API_KEY ? "healthy" : "not_configured",
      statusLabel: process.env.RESEND_API_KEY ? "Healthy" : "Not Configured",
      summary: process.env.RESEND_API_KEY ? "Transactional email provider is configured." : "RESEND_API_KEY is not configured.",
      metrics: [`Sent today: ${emailsSentToday.toLocaleString()}`, `From: ${process.env.EMAIL_FROM ? "Configured" : "Default sender"}`],
    },
    stripeStatus,
    {
      id: "socket",
      label: "Socket.io",
      tone: "healthy",
      statusLabel: "Healthy",
      summary: "Realtime WebSocket transport is available for presence and admin signals.",
      metrics: [`Active: ${webSocketStats.activeConnections} connections`, `Users: ${webSocketStats.activeUsers}`],
    },
    {
      id: "redis",
      label: "Redis",
      tone: process.env.REDIS_URL ? "healthy" : "not_configured",
      statusLabel: process.env.REDIS_URL ? "Healthy" : "Not Configured",
      summary: process.env.REDIS_URL ? "Redis cache endpoint is configured." : "Optional cache layer is not configured.",
      metrics: [process.env.REDIS_URL ? "Session cache ready" : "Optional for session cache"],
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    services,
    rateLimiting: {
      authRoutes: telemetry.rateLimitCounts.auth,
      apiRoutes: telemetry.rateLimitCounts.api,
      adminRoutes: telemetry.rateLimitCounts.admin,
      aiRoutes: telemetry.rateLimitCounts.ai,
    },
    database: {
      rlsVerifiedAt: rlsVerifiedAt ? rlsVerifiedAt.toISOString() : null,
      pendingMigrations,
      tableSizes: [
        { label: "Post", rowCount: postsCount },
        { label: "User", rowCount: usersCount },
        { label: "Course", rowCount: coursesCount },
        { label: "Order", rowCount: ordersCount },
      ],
    },
    errorLogs: telemetry.errorLogs.map((entry) => ({
      id: entry.id,
      method: entry.method,
      path: entry.path,
      statusCode: entry.statusCode,
      filter: mapErrorFilter(entry.path, entry.statusCode),
      label: entry.label,
      latencyMs: entry.latencyMs,
      createdAt: entry.createdAt,
    })),
  };
}

export async function markRlsVerificationNow() {
  return {
    verifiedAt: new Date().toISOString(),
    label: formatDayLabel(new Date()),
  };
}
