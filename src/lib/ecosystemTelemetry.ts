import { API_BASE } from "./api";

export type TelemetryEventPayload = {
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  event: string;
  activity: string;
  page?: string;
  metadata?: Record<string, unknown>;
  country?: string;
  city?: string;
  duration?: number;
  issueType?: string;
  issueData?: Record<string, unknown>;
};

export type AppDownloadPayload = {
  userId?: string;
  tenantId?: string;
  platform: string;
  platformVersion?: string;
  appVersion?: string;
  country?: string;
  city?: string;
  deviceModel?: string;
  osVersion?: string;
  language?: string;
  isFirstDownload?: boolean;
};

function getBrowserCountry() {
  const language = typeof navigator !== "undefined" ? navigator.language : "";
  const region = language.includes("-") ? language.split("-")[1] : "";
  return region.toUpperCase();
}

function postJson(path: string, body: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const url = `${API_BASE}${path}`;
  const payload = JSON.stringify(body);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon(url, blob)) return;
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}

export function trackTelemetryEvent(payload: TelemetryEventPayload) {
  postJson("/public/analytics/track", {
    ...payload,
    country: payload.country ?? getBrowserCountry(),
  });
}

export function trackAppDownload(payload: AppDownloadPayload) {
  postJson("/public/analytics/app-download", {
    ...payload,
    country: payload.country ?? getBrowserCountry(),
    language: payload.language ?? (typeof navigator !== "undefined" ? navigator.language : undefined),
  });
}
