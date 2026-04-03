import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import { trackTelemetryEvent } from "../../lib/ecosystemTelemetry";

function getSessionId() {
  if (typeof window === "undefined") return "";
  const key = "winners:session-id";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const next = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.sessionStorage.setItem(key, next);
  return next;
}

function getCountry() {
  const language = typeof navigator !== "undefined" ? navigator.language : "";
  const region = language.includes("-") ? language.split("-")[1] : "";
  return region.toUpperCase();
}

export default function EcosystemTelemetryBridge() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const lastTrackedKey = useRef("");

  useEffect(() => {
    if (isRestoring) return;

    const trackKey = `${location.pathname}|${location.search}|${location.hash}|${user?.id ?? "anon"}|${user?.tenantId ?? "anon"}`;
    if (lastTrackedKey.current === trackKey) return;
    lastTrackedKey.current = trackKey;

    trackTelemetryEvent({
      userId: user?.id,
      tenantId: user?.tenantId,
      sessionId: getSessionId(),
      event: "page_view",
      activity: `route:${location.pathname}`,
      page: location.pathname,
      metadata: {
        search: location.search,
        hash: location.hash,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      },
      country: getCountry(),
    });
  }, [isRestoring, location.hash, location.pathname, location.search, user?.id, user?.tenantId]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackTelemetryEvent({
        userId: user?.id,
        tenantId: user?.tenantId,
        sessionId: getSessionId(),
        event: "issue",
        activity: "runtime_error",
        page: location.pathname,
        country: getCountry(),
        issueType: "runtime_error",
        issueData: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? "unknown");
      trackTelemetryEvent({
        userId: user?.id,
        tenantId: user?.tenantId,
        sessionId: getSessionId(),
        event: "issue",
        activity: "unhandled_rejection",
        page: location.pathname,
        country: getCountry(),
        issueType: "unhandled_rejection",
        issueData: { reason },
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [location.pathname, user?.id, user?.tenantId]);

  return null;
}
