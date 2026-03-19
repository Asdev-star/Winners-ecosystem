import type { NextFunction, Request, Response } from "express";

export type TelemetryRouteCategory = "auth" | "api" | "admin" | "ai" | "stripe" | "other";

export interface TelemetryErrorLogEntry {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  category: TelemetryRouteCategory;
  label: string;
  latencyMs: number;
  createdAt: string;
}

type DailyRateLimitCounts = Record<"auth" | "api" | "admin" | "ai", number>;

const MAX_ERROR_LOGS = 50;
const RECENT_LATENCY_LIMIT = 120;

const recentLatencies: number[] = [];
const errorLogs: TelemetryErrorLogEntry[] = [];
let rateLimitDayKey = todayKey();
let rateLimitCounts: DailyRateLimitCounts = {
  auth: 0,
  api: 0,
  admin: 0,
  ai: 0,
};

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${now.getDate()}`.padStart(2, "0")}`;
}

function refreshDailyCounters() {
  const nextKey = todayKey();
  if (nextKey === rateLimitDayKey) return;

  rateLimitDayKey = nextKey;
  rateLimitCounts = {
    auth: 0,
    api: 0,
    admin: 0,
    ai: 0,
  };
}

function toCategory(path: string): TelemetryRouteCategory {
  const normalized = path.toLowerCase();
  if (normalized.includes("/auth")) return "auth";
  if (normalized.includes("/admin")) return "admin";
  if (
    normalized.includes("/ai") ||
    normalized.includes("/chat") ||
    normalized.includes("/supervisors") ||
    normalized.includes("/omega") ||
    normalized.includes("/forge")
  ) {
    return "ai";
  }
  if (normalized.includes("/stripe") || normalized.includes("/billing")) return "stripe";
  if (normalized.startsWith("/api/")) return "api";
  return "other";
}

function pushLatency(latencyMs: number) {
  recentLatencies.push(latencyMs);
  if (recentLatencies.length > RECENT_LATENCY_LIMIT) {
    recentLatencies.shift();
  }
}

function pushErrorLog(entry: TelemetryErrorLogEntry) {
  errorLogs.unshift(entry);
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs.length = MAX_ERROR_LOGS;
  }
}

function buildLabel(statusCode: number, path: string, category: TelemetryRouteCategory) {
  if (statusCode === 429) return "Rate limited";
  if (category === "ai") return "AI request error";
  if (category === "stripe") return "Stripe request error";
  if (statusCode >= 500) return "Server error";
  if (statusCode >= 400) return "Client error";
  return "Request completed";
}

export function telemetryRequestMiddleware(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();

  res.on("finish", () => {
    refreshDailyCounters();

    const latencyMs = Date.now() - startedAt;
    const path = req.originalUrl || req.path || "/";
    const category = toCategory(path);

    pushLatency(latencyMs);

    if (res.statusCode === 429) {
      if (category === "auth" || category === "api" || category === "admin" || category === "ai") {
        rateLimitCounts[category] += 1;
      } else {
        rateLimitCounts.api += 1;
      }
    }

    if (res.statusCode >= 400) {
      pushErrorLog({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        method: req.method,
        path,
        statusCode: res.statusCode,
        category,
        label: buildLabel(res.statusCode, path, category),
        latencyMs,
        createdAt: new Date().toISOString(),
      });
    }
  });

  next();
}

export function getTelemetrySnapshot() {
  refreshDailyCounters();

  const averageLatencyMs =
    recentLatencies.length > 0
      ? Math.round(recentLatencies.reduce((sum, value) => sum + value, 0) / recentLatencies.length)
      : 0;

  return {
    averageLatencyMs,
    recentRequestCount: recentLatencies.length,
    rateLimitCounts: { ...rateLimitCounts },
    errorLogs: [...errorLogs],
  };
}
