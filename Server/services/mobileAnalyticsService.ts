import type { Prisma } from "@prisma/client";
import db from "../db.js";

export type MobileSessionInput = {
  userId?: string | null;
  tenantId?: string | null;
  deviceId: string;
  os: string;
  osVersion: string;
  appVersion: string;
  metadata?: Prisma.InputJsonValue | null;
};

export type AnalyticsEventInput = {
  userId?: string | null;
  tenantId?: string | null;
  sessionId?: string | null;
  eventType: string;
  layer?: string | null;
  feature?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  platform?: string | null;
  countryCode?: string | null;
};

function sessionName(deviceId: string) {
  return `mobile-session:${deviceId}`;
}

function toDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function getActivityRows(days = 30) {
  return db.userActivity.findMany({
    where: {
      createdAt: { gte: toDate(days) },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getDownloadRows(days = 30) {
  return db.appDownload.findMany({
    where: {
      installedAt: { gte: toDate(days) },
    },
    orderBy: { installedAt: "desc" },
  });
}

async function getErrorRows(days = 30) {
  return db.userActivity.findMany({
    where: {
      createdAt: { gte: toDate(days) },
      OR: [
        { event: { contains: "error" } },
        { issueType: { not: null } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

function normalizeFilter(value?: string | null) {
  return value && value !== "all" ? value : null;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function trackMobileSession(input: MobileSessionInput) {
  const os = input.os.toLowerCase();
  return db.userActivity.create({
    data: {
      userId: input.userId ?? null,
      tenantId: input.tenantId ?? null,
      sessionId: sessionName(input.deviceId),
      event: `mobile_session_start:${os}`,
      activity: `mobile_session_start:${os}`,
      page: os,
      metadata: input.metadata ?? {
        deviceId: input.deviceId,
        os: input.os,
        osVersion: input.osVersion,
        appVersion: input.appVersion,
      },
      country: null,
      city: null,
      duration: null,
      issueType: null,
      issueData: null,
    },
  });
}

export async function endMobileSession(sessionId: string, duration?: number) {
  return db.userActivity.update({
    where: { id: sessionId },
    data: {
      event: "mobile_session_end",
      duration: duration ?? null,
    },
  });
}

export async function recordAppDownload(input: {
  userId?: string | null;
  tenantId?: string | null;
  platform: string;
  platformVersion?: string | null;
  appVersion: string;
  country?: string | null;
  city?: string | null;
  deviceModel?: string | null;
  osVersion?: string | null;
  language?: string | null;
  isFirstDownload?: boolean;
}) {
  return db.appDownload.create({
    data: {
      userId: input.userId ?? null,
      tenantId: input.tenantId ?? null,
      platform: input.platform,
      platformVersion: input.platformVersion ?? null,
      appVersion: input.appVersion,
      country: input.country ?? null,
      city: input.city ?? null,
      deviceModel: input.deviceModel ?? null,
      osVersion: input.osVersion ?? null,
      language: input.language ?? null,
      isFirstDownload: Boolean(input.isFirstDownload),
    },
  });
}

export async function recordErrorReport(input: {
  userId?: string | null;
  sessionId?: string | null;
  platform: string;
  layer?: string | null;
  feature?: string | null;
  errorCode?: string | null;
  errorMessage: string;
  stackTrace?: string | null;
  countryCode?: string | null;
  appVersion?: string | null;
  resolved?: boolean;
}) {
  return db.userActivity.create({
    data: {
      userId: input.userId ?? null,
      sessionId: input.sessionId ?? null,
      tenantId: null,
      event: "error",
      activity: "error",
      page: input.layer ?? input.feature ?? input.platform,
      metadata: {
        platform: input.platform,
        layer: input.layer ?? null,
        feature: input.feature ?? null,
        errorCode: input.errorCode ?? null,
        errorMessage: input.errorMessage,
        stackTrace: input.stackTrace ?? null,
        countryCode: input.countryCode ?? null,
        appVersion: input.appVersion ?? null,
        resolved: Boolean(input.resolved),
      },
      country: input.countryCode ?? null,
      city: null,
      duration: null,
      issueType: input.errorCode ?? "error",
      issueData: {
        errorMessage: input.errorMessage,
        stackTrace: input.stackTrace ?? null,
      },
    },
  });
}

export async function resolveAnalyticsError(id: string, resolvedBy?: string | null) {
  return db.userActivity.update({
    where: { id },
    data: {
      metadata: {
        resolved: true,
        resolvedBy: resolvedBy ?? null,
      },
      issueData: {
        resolved: true,
        resolvedBy: resolvedBy ?? null,
      },
    },
  });
}

export async function recordAnalyticsEvent(input: AnalyticsEventInput) {
  return db.userActivity.create({
    data: {
      userId: input.userId ?? null,
      tenantId: input.tenantId ?? null,
      sessionId: input.sessionId ?? null,
      event: input.eventType,
      activity: input.feature ?? input.eventType,
      page: input.layer ?? input.platform ?? null,
      metadata: input.metadata ?? {},
      country: input.countryCode ?? null,
      city: null,
      duration: null,
      issueType: null,
      issueData: null,
    },
  });
}

export async function getMobileAnalytics() {
  const [downloads, sessions, errors] = await Promise.all([
    db.appDownload.count(),
    db.userActivity.count(),
    db.userActivity.count({ where: { OR: [{ event: { contains: "error" } }, { issueType: { not: null } }] } }),
  ]);

  return {
    sessions,
    iosSessions: await db.userActivity.count({ where: { activity: { contains: "ios" } } }),
    androidSessions: await db.userActivity.count({ where: { activity: { contains: "android" } } }),
    downloads,
    errorReports: errors,
  };
}

export async function getMobileDownloads(periodDays = 30, platform?: string | null) {
  const rows = await getDownloadRows(periodDays);
  const platformFilter = normalizeFilter(platform);
  const byPlatform: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  const byDay = new Map<string, { date: string; total: number; platforms: Record<string, number> }>();
  const filteredRows = platformFilter ? rows.filter((row) => row.platform === platformFilter) : rows;

  for (const row of filteredRows) {
    byPlatform[row.platform] = (byPlatform[row.platform] ?? 0) + 1;
    if (row.country) {
      byCountry[row.country] = (byCountry[row.country] ?? 0) + 1;
    }
    const bucketKey = dayKey(row.installedAt);
    const bucket = byDay.get(bucketKey) ?? { date: bucketKey, total: 0, platforms: {} };
    bucket.total += 1;
    bucket.platforms[row.platform] = (bucket.platforms[row.platform] ?? 0) + 1;
    byDay.set(bucketKey, bucket);
  }

  return {
    total: filteredRows.length,
    byPlatform,
    byCountry: Object.entries(byCountry).map(([country, count]) => ({ country, count })),
    bySource: [],
    byDay: Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export async function getMobileSessions(periodDays = 7, platform = "all") {
  const rows = await getActivityRows(periodDays);
  const platformFilter = normalizeFilter(platform);
  const sessionEvents = rows.filter((row) => {
    const isSession = row.event.includes("session");
    if (!isSession) return false;
    if (!platformFilter) return true;
    const marker = row.event.toLowerCase();
    return marker.includes(platformFilter.toLowerCase()) || String(row.page ?? "").toLowerCase() === platformFilter.toLowerCase();
  });
  const totalSessions = new Set(sessionEvents.map((row) => row.sessionId).filter(Boolean)).size || sessionEvents.length;
  const durations = sessionEvents.map((row) => row.duration ?? 0).filter((duration): duration is number => duration > 0);
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0;
  const byPlatform: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  const byDay = new Map<string, { date: string; total: number; platforms: Record<string, number> }>();

  for (const row of sessionEvents) {
    const key = row.page ?? platform;
    byPlatform[key] = (byPlatform[key] ?? 0) + 1;
    if (row.country) byCountry[row.country] = (byCountry[row.country] ?? 0) + 1;
    const bucketKey = dayKey(row.createdAt);
    const bucket = byDay.get(bucketKey) ?? { date: bucketKey, total: 0, platforms: {} };
    bucket.total += 1;
    bucket.platforms[key] = (bucket.platforms[key] ?? 0) + 1;
    byDay.set(bucketKey, bucket);
  }

  return {
    activeSessions: Math.max(totalSessions - 1, 0),
    avgDuration,
    totalSessions,
    byPlatform,
    byCountry: Object.entries(byCountry).map(([country, count]) => ({ country, count })),
    byDay: Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export async function getMobileFeatures(periodDays = 30, layer?: string | null) {
  const rows = await getActivityRows(periodDays);
  const layerFilter = normalizeFilter(layer);
  const bucket = new Map<string, { layer: string; feature: string; count: number; uniqueUsers: Set<string>; totalDuration: number; durationSamples: number }>();

  for (const row of rows) {
    const layer = row.page ?? "unknown";
    if (layerFilter && layer !== layerFilter) {
      continue;
    }
    const feature = row.activity ?? row.event;
    const key = `${layer}:${feature}`;
    const entry = bucket.get(key) ?? {
      layer,
      feature,
      count: 0,
      uniqueUsers: new Set<string>(),
      totalDuration: 0,
      durationSamples: 0,
    };
    entry.count += 1;
    if (row.userId) entry.uniqueUsers.add(row.userId);
    if (typeof row.duration === "number" && row.duration > 0) {
      entry.totalDuration += row.duration;
      entry.durationSamples += 1;
    }
    bucket.set(key, entry);
  }

  return {
    events: Array.from(bucket.values()).map((entry) => ({
      layer: entry.layer,
      feature: entry.feature,
      count: entry.count,
      uniqueUsers: entry.uniqueUsers.size,
      avgTimeSpent: entry.durationSamples > 0 ? Math.round(entry.totalDuration / entry.durationSamples) : 0,
    })),
  };
}

export async function getMobileFunnel(steps: string[], layer?: string | null) {
  const rows = await getActivityRows(30);
  const layerFilter = normalizeFilter(layer);
  const counts = steps.map((step) => ({
    name: step,
    users: rows.filter((row) => {
      const layerName = row.page ?? "all";
      if (layerFilter && layerName !== layerFilter) return false;
      return row.event.includes(step) || row.activity.includes(step);
    }).length,
    dropoffPct: 0,
    avgTimeToNext: 0,
  }));

  return { steps: counts };
}

export async function getMobileErrors(periodDays = 7, layer?: string | null) {
  const rows = await getErrorRows(periodDays);
  const layerFilter = normalizeFilter(layer);
  const grouped = new Map<string, { layer: string | null; feature: string | null; errorCode: string | null; count: number; lastSeen: string; sample: string }>();

  for (const row of rows) {
    if (layerFilter && (row.page ?? "").toLowerCase() !== layerFilter.toLowerCase()) {
      continue;
    }
    const issueData = typeof row.issueData === "object" && row.issueData && !Array.isArray(row.issueData)
      ? row.issueData as Record<string, unknown>
      : {};
    const errorCode = typeof row.issueType === "string" ? row.issueType : "unknown";
    const key = `${row.page ?? "all"}:${row.activity ?? "all"}:${errorCode}`;
    const entry = grouped.get(key) ?? {
      layer: row.page ?? null,
      feature: row.activity ?? null,
      errorCode,
      count: 0,
      lastSeen: row.createdAt.toISOString(),
      sample: String(issueData.errorMessage ?? row.event),
    };
    entry.count += 1;
    if (row.createdAt.toISOString() > entry.lastSeen) {
      entry.lastSeen = row.createdAt.toISOString();
      entry.sample = String(issueData.errorMessage ?? row.event);
    }
    grouped.set(key, entry);
  }

  return { errors: Array.from(grouped.values()) };
}

export async function getMobileCountries(periodDays = 30, platform?: string | null) {
  const rows = await getDownloadRows(periodDays);
  const platformFilter = normalizeFilter(platform);
  const byCountry = new Map<string, number>();
  for (const row of rows) {
    if (platformFilter && row.platform !== platformFilter) continue;
    const key = row.country ?? "Unknown";
    byCountry.set(key, (byCountry.get(key) ?? 0) + 1);
  }

  return {
    countries: Array.from(byCountry.entries()).map(([code, users]) => ({
      code,
      name: code,
      users,
      sessions: users,
      avgDuration: 0,
      topFeature: "unknown",
    })),
  };
}

export async function getMobileCrashes(periodDays = 30, layer?: string | null) {
  const rows = await getErrorRows(periodDays);
  const layerFilter = normalizeFilter(layer);
  const filtered = layerFilter ? rows.filter((row) => (row.page ?? "").toLowerCase() === layerFilter.toLowerCase()) : rows;
  return {
    total: filtered.length,
    crashFreeRate: filtered.length === 0 ? 100 : Math.max(0, 100 - filtered.length * 2),
    crashes: filtered.slice(0, 20).map((row) => ({
      id: row.id,
      platform: row.page ?? "unknown",
      layer: row.page ?? null,
      message: String(
        typeof row.issueData === "object" && row.issueData && !Array.isArray(row.issueData)
          ? (row.issueData as Record<string, unknown>).errorMessage ?? row.event
          : row.event,
      ),
      count: 1,
    })),
  };
}

export async function getUserJourney(userKey: string) {
  const user = await db.user.findFirst({
    where: {
      OR: [
        { id: userKey },
        { email: userKey },
      ],
    },
    select: { id: true },
  });
  const userId = user?.id ?? userKey;

  const [events, downloads] = await Promise.all([
    db.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.appDownload.findMany({
      where: { userId },
      orderBy: { installedAt: "desc" },
    }),
  ]);

  return { events, sessions: downloads };
}
