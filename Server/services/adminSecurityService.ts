import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../db.js";
import { getAdminSystemHealthSnapshot } from "./adminSystemHealthService.js";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const INDEX_PATH = path.join(ROOT_DIR, "Server", "index.ts");
const API_ROUTER_PATH = path.join(ROOT_DIR, "Server", "routes", "apiRouter.ts");
const POST_ROUTES_PATH = path.join(ROOT_DIR, "Server", "routes", "postRoutes.ts");
const POST_SECURITY_TEST_PATH = path.join(ROOT_DIR, "Server", "routes", "postSecurity.test.ts");
const GDPR_ROUTES_PATH = path.join(ROOT_DIR, "Server", "routes", "gdprRoutes.ts");
const TWO_FACTOR_ROUTES_PATH = path.join(ROOT_DIR, "Server", "routes", "twoFactorRoutes.ts");

type SecurityTone = "healthy" | "warning" | "critical";

export interface AdminSecurityStatusItem {
  id: string;
  label: string;
  tone: SecurityTone;
  summary: string;
  actionLabel?: string;
}

export interface AdminSecurityAuditEntry {
  id: string;
  createdAt: string;
  actorEmail: string;
  summary: string;
  action: string;
}

export interface AdminSecurityFinding {
  tone: SecurityTone;
  title: string;
  summary: string;
  sourcePath: string;
  supportingPath: string | null;
}

export interface AdminSecuritySnapshot {
  generatedAt: string;
  securityStatus: AdminSecurityStatusItem[];
  jwt: {
    expiry: string;
    refresh: string;
    rotation: string;
  };
  sessionSummary: {
    activeSessions: number;
    activeUsers: number;
  };
  sessions: Array<{
    id: string;
    userId: string;
    userLabel: string;
    platform: string;
    lastSeen: string;
    createdAt: string;
  }>;
  twoFactor: {
    enabledUsers: number;
    adoptionRate: number;
  };
  rateLimits: Array<{
    route: string;
    scope: string;
    status: SecurityTone;
  }>;
  auditLog: AdminSecurityAuditEntry[];
  gdpr: {
    deletionRequestsPending: number;
    exportRequestsPending: number;
    privacyAcknowledgmentLabel: string;
    privacyAcknowledgmentTone: SecurityTone;
    note: string;
    consentLogs: Array<{
      id: string;
      userId: string;
      policyVersion: string;
      acknowledgedAt: string;
    }>;
  };
  sensitiveActions: AdminSecurityAuditEntry[];
  suspiciousActivity: Array<{
    id: string;
    title: string;
    detail: string;
    tone: SecurityTone;
    createdAt: string;
  }>;
  forgeAssistant: {
    summary: string;
    recommendedAction: string;
  };
  finding: AdminSecurityFinding;
}

function safeRead(filePath: string) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function daysSince(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  const diff = Date.now() - new Date(value).getTime();
  return diff / (24 * 60 * 60 * 1000);
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, `""`)}"`;
}

function metadataSummary(metadata: unknown, fallback: string) {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) return fallback;
  const summary = (metadata as Record<string, unknown>).summary;
  return typeof summary === "string" && summary.trim() ? summary : fallback;
}

function isJwtSecretCustom() {
  const current = process.env.JWT_SECRET ?? "";
  return current.length > 0 && current !== "winners_dev_secret_change_in_prod";
}

function hasHttpsConfig() {
  const appUrl = process.env.APP_URL ?? "";
  return appUrl.startsWith("https://") || process.env.NODE_ENV === "production";
}

function buildTenantScopingFinding() {
  const postRoutesSource = safeRead(POST_ROUTES_PATH);
  const postSecurityTestSource = safeRead(POST_SECURITY_TEST_PATH);
  const hasScopedPatch = postRoutesSource.includes("where: { id: postId, tenantId }");
  const hasScopedDelete = postRoutesSource.includes("where: { id: postId, tenantId, deletedAt: null }");
  const hasScopedCommentDelete = postRoutesSource.includes("where: { id: commentId, postId, tenantId");
  const hasSecurityContract =
    postSecurityTestSource.includes("PATCH /posts/:id enforces tenantId scoping") &&
    postSecurityTestSource.includes("DELETE /posts/:id enforces tenantId scoping");

  if (hasScopedPatch && hasScopedDelete && hasScopedCommentDelete && hasSecurityContract) {
    return {
      tone: "warning" as const,
      title: "tenantId scoping audit in postRoutes.ts",
      summary:
        "Application-layer tenant scoping is present and covered by route-contract tests, but it still deserves operator verification alongside RLS.",
      sourcePath: "/Server/routes/postRoutes.ts",
      supportingPath: "/Server/routes/postSecurity.test.ts",
    };
  }

  return {
    tone: "critical" as const,
    title: "tenantId scoping gap in postRoutes.ts",
    summary:
      "A tenant boundary guard is missing or no longer covered by the route-contract tests. Review the post edit and delete paths immediately.",
    sourcePath: "/Server/routes/postRoutes.ts",
    supportingPath: "/Server/routes/postSecurity.test.ts",
  };
}

export async function getAdminSecuritySnapshot(): Promise<AdminSecuritySnapshot> {
  const [health, recentAuditLog, privacyAcknowledgments, totalUsers, twoFactorEnabledUsers, deviceTokens, recentAuthActivity, recentConsentLogs, sensitiveActionRows] = await Promise.all([
    getAdminSystemHealthSnapshot(),
    db.activityLog.findMany({
      where: { category: "admin" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        userEmail: true,
        action: true,
        metadata: true,
      },
    }),
    db.privacyAcknowledgment.count().catch(() => 0),
    db.user.count({ where: { deletedAt: null } }).catch(() => 0),
    db.user.count({ where: { deletedAt: null, twoFactorEnabled: true } }).catch(() => 0),
    db.deviceToken.findMany({
      where: { isActive: true },
      select: { id: true, userId: true, lastSeen: true, createdAt: true, platform: true, user: { select: { email: true, name: true } } },
      orderBy: { lastSeen: "desc" },
      take: 200,
    }).catch(() => []),
    db.activityLog.findMany({
      where: { category: "auth" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, action: true, createdAt: true, ip: true, userEmail: true },
    }).catch(() => []),
    db.privacyAcknowledgment.findMany({
      orderBy: { acknowledgedAt: "desc" },
      take: 10,
      select: { id: true, userId: true, policyVersion: true, acknowledgedAt: true },
    }).catch(() => []),
    db.activityLog.findMany({
      where: {
        OR: [
          { category: "auth" },
          { category: "security" },
          { action: { contains: "PASSWORD", mode: "insensitive" } },
          { action: { contains: "DELETE", mode: "insensitive" } },
          { action: { contains: "SUSPEND", mode: "insensitive" } },
          { action: { contains: "2FA", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, createdAt: true, userEmail: true, action: true, metadata: true },
    }).catch(() => []),
  ]);

  const indexSource = safeRead(INDEX_PATH);
  const apiRouterSource = safeRead(API_ROUTER_PATH);
  const gdprRoutesSource = safeRead(GDPR_ROUTES_PATH);
  const rlsAgeDays = daysSince(health.database.rlsVerifiedAt);
  const finding = buildTenantScopingFinding();

  const securityStatus: AdminSecurityStatusItem[] = [
    {
      id: "jwt",
      label: "JWT secrets",
      tone: isJwtSecretCustom() ? "healthy" : "warning",
      summary: isJwtSecretCustom() ? "Configured outside the development default." : "Still using the repository default secret placeholder.",
    },
    {
      id: "twofactor",
      label: "2FA",
      tone: fs.existsSync(TWO_FACTOR_ROUTES_PATH) ? "healthy" : "warning",
      summary: fs.existsSync(TWO_FACTOR_ROUTES_PATH) ? "Available through the dedicated two-factor routes." : "Two-factor route surface is missing.",
    },
    {
      id: "https",
      label: "HTTPS",
      tone: hasHttpsConfig() ? "healthy" : "warning",
      summary: hasHttpsConfig() ? "Secure origin is configured for deployed traffic." : "HTTPS enforcement cannot be confirmed from APP_URL in this environment.",
    },
    {
      id: "helmet",
      label: "Helmet",
      tone: indexSource.includes("app.use(helmetMiddleware)") ? "healthy" : "critical",
      summary: indexSource.includes("app.use(helmetMiddleware)") ? "HTTP security headers are active in the main middleware stack." : "Helmet middleware is not mounted in Server/index.ts.",
    },
    {
      id: "ratelimit",
      label: "Rate limiting",
      tone:
        indexSource.includes("app.use(globalRateLimiter)") &&
        apiRouterSource.includes('router.use("/auth/login", authLimiter);') &&
        apiRouterSource.includes('router.use("/posts", postLimiter, postRoutes);')
          ? "healthy"
          : "warning",
      summary:
        indexSource.includes("app.use(globalRateLimiter)") &&
        apiRouterSource.includes('router.use("/auth/login", authLimiter);') &&
        apiRouterSource.includes('router.use("/posts", postLimiter, postRoutes);')
          ? "Global, auth, and post-specific throttles are mounted."
          : "One or more expected limiter mounts could not be confirmed.",
    },
    {
      id: "cors",
      label: "CORS",
      tone: indexSource.includes("cors({") ? "healthy" : "warning",
      summary: indexSource.includes("cors({") ? "Origin allowlist and credential rules are configured." : "CORS configuration could not be confirmed in Server/index.ts.",
    },
    {
      id: "rls",
      label: "RLS policies",
      tone: rlsAgeDays <= 7 ? "healthy" : "warning",
      summary:
        rlsAgeDays <= 7
          ? `Verified recently on ${new Date(health.database.rlsVerifiedAt ?? "").toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`
          : health.database.rlsVerifiedAt
            ? `Not verified since ${new Date(health.database.rlsVerifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`
            : "No operator verification checkpoint has been recorded yet.",
      actionLabel: "Verify Now",
    },
    {
      id: "scoping",
      label: finding.title,
      tone: finding.tone,
      summary: finding.summary,
      actionLabel: "View Fix",
    },
  ];

  const privacyCoverage = totalUsers > 0 ? Math.round((privacyAcknowledgments / totalUsers) * 100) : 0;
  const activeUsers = new Set(deviceTokens.map((entry) => entry.userId)).size;
  const suspiciousActivity = recentAuthActivity.slice(0, 8).map((entry) => ({
    id: entry.id,
    title: entry.action,
    detail: `${entry.userEmail ?? "unknown user"} from ${entry.ip ?? "unknown IP"}`,
    tone: entry.ip ? "warning" as const : "critical" as const,
    createdAt: entry.createdAt.toISOString(),
  }));

  return {
    generatedAt: new Date().toISOString(),
    securityStatus,
    jwt: {
      expiry: process.env.JWT_EXPIRES_IN ?? "7d",
      refresh: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "30d",
      rotation: "On login and refresh endpoint use",
    },
    sessionSummary: {
      activeSessions: deviceTokens.length,
      activeUsers,
    },
    sessions: deviceTokens.slice(0, 20).map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      userLabel: entry.user.name || entry.user.email || entry.userId,
      platform: entry.platform,
      lastSeen: entry.lastSeen.toISOString(),
      createdAt: entry.createdAt.toISOString(),
    })),
    twoFactor: {
      enabledUsers: twoFactorEnabledUsers,
      adoptionRate: totalUsers > 0 ? Math.round((twoFactorEnabledUsers / totalUsers) * 100) : 0,
    },
    rateLimits: [
      { route: "/auth/login", scope: "Auth limiter", status: "healthy" },
      { route: "/posts", scope: "Post limiter", status: "healthy" },
      { route: "/api/*", scope: "Global limiter", status: "healthy" },
      { route: "/admin/*", scope: "Admin limiter", status: "warning" },
    ],
    auditLog: recentAuditLog.map((entry) => ({
      id: entry.id,
      createdAt: entry.createdAt.toISOString(),
      actorEmail: entry.userEmail ?? "admin@",
      summary: metadataSummary(entry.metadata, entry.action),
      action: entry.action,
    })),
    gdpr: {
      deletionRequestsPending: 0,
      exportRequestsPending: 0,
      privacyAcknowledgmentLabel:
        gdprRoutesSource.includes('router.post("/privacy-ack"')
          ? `Route available · ${privacyCoverage}% acknowledged`
          : "Not wired",
      privacyAcknowledgmentTone:
        gdprRoutesSource.includes('router.post("/privacy-ack"') ? "healthy" : "warning",
      note:
        "A dedicated pending-request queue is not yet tracked in the repository, so export and deletion requests currently report only confirmed queue entries.",
      consentLogs: recentConsentLogs.map((entry) => ({
        id: entry.id,
        userId: entry.userId,
        policyVersion: entry.policyVersion,
        acknowledgedAt: entry.acknowledgedAt.toISOString(),
      })),
    },
    sensitiveActions: sensitiveActionRows.map((entry) => ({
      id: entry.id,
      createdAt: entry.createdAt.toISOString(),
      actorEmail: entry.userEmail ?? "system@",
      summary: metadataSummary(entry.metadata, entry.action),
      action: entry.action,
    })),
    suspiciousActivity,
    forgeAssistant: {
      summary: `FORGE sees ${deviceTokens.length} active session artifacts, ${twoFactorEnabledUsers} 2FA-enabled users, and ${health.errorLogs.filter((entry) => entry.statusCode >= 500).length} recent high-severity faults touching protected surfaces.`,
      recommendedAction: finding.tone === "critical" ? "Resolve tenant scoping gaps first, then verify recent auth anomalies and rotate secrets where needed." : "Verify RLS, raise 2FA adoption, and review suspicious auth events for unusual patterns.",
    },
    finding,
  };
}

export async function buildAdminAuditLogCsv() {
  const rows = await db.activityLog.findMany({
    where: { category: "admin" },
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: {
      createdAt: true,
      userEmail: true,
      action: true,
      metadata: true,
    },
  });

  const lines = [
    ["timestamp", "actor_email", "action", "summary"].map(csvEscape).join(","),
    ...rows.map((row) =>
      [
        row.createdAt.toISOString(),
        row.userEmail ?? "",
        row.action,
        metadataSummary(row.metadata, row.action),
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];

  return lines.join("\n");
}
