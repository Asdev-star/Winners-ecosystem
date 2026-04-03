import { API_BASE } from "../lib/api";

type TrackEvent = (payload: Record<string, unknown>) => void;

function detectPlatform() {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("android")) return "android";
  if (ua.includes("iphone") || ua.includes("ipad")) return "ios";
  if (ua.includes("electron")) return "desktop_electron";
  return "web_pwa";
}

function getSessionId() {
  if (typeof window === "undefined") return "server";
  const key = "winners:sessionId";
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    window.localStorage.setItem(key, value);
  }
  return value;
}

function emit(eventType: string, meta: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    eventType,
    ...meta,
    platform: detectPlatform(),
    sessionId: getSessionId(),
    timestamp: Date.now(),
  });

  const url = `${API_BASE}/analytics/event`;
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

const fire: TrackEvent = (payload) => emit(String(payload.eventType ?? "unknown"), payload);

export const track = {
  appInstalled: (platform: string) => fire({ eventType: "install", platform }),
  appOpened: (platform: string) => fire({ eventType: "app_open", platform }),
  sessionStarted: (platform: string) => fire({ eventType: "session_start", platform }),
  sessionEnded: (durationSec: number) => fire({ eventType: "session_end", durationSec }),

  signUpCompleted: (method: "email" | "google") => fire({ eventType: "signup", method }),
  onboardingCompleted: (profileType: string) => fire({ eventType: "onboarding_complete", profileType }),
  loginSucceeded: (method: string) => fire({ eventType: "login", method }),

  postCreated: () => fire({ eventType: "feature_click", layer: "community", feature: "post_create" }),
  postLiked: () => fire({ eventType: "feature_click", layer: "community", feature: "post_like" }),
  skillDetected: (skill: string) => fire({ eventType: "skill_detected", skill }),

  courseEnrolled: (courseId: string) => fire({ eventType: "course_enroll", layer: "academy", courseId }),
  lessonCompleted: (lessonId: string) => fire({ eventType: "lesson_complete", layer: "academy", lessonId }),
  quizPassed: (score: number) => fire({ eventType: "quiz_pass", layer: "academy", score }),
  certificateEarned: (courseId: string) => fire({ eventType: "certificate_earn", layer: "academy", courseId }),
  lessonDownloaded: (lessonId: string) => fire({ eventType: "offline_download", lessonId }),

  productViewed: (productId: string) => fire({ eventType: "product_view", layer: "market", productId }),
  addedToCart: (productId: string) => fire({ eventType: "cart_add", layer: "market", productId }),
  checkoutStarted: () => fire({ eventType: "checkout_start", layer: "market" }),
  orderCompleted: (amount: number) => fire({ eventType: "order_complete", layer: "market", amount }),
  vendorApplied: () => fire({ eventType: "vendor_apply", layer: "market" }),

  jobViewed: (jobId: string) => fire({ eventType: "job_view", layer: "work", jobId }),
  applicationSubmitted: (jobId: string) => fire({ eventType: "job_apply", layer: "work", jobId }),
  contractSigned: (contractId: string) => fire({ eventType: "contract_sign", layer: "work", contractId }),
  escrowFunded: (amount: number) => fire({ eventType: "escrow_fund", layer: "work", amount }),

  supervisorQueried: (supervisor: string) => fire({ eventType: "ai_query", layer: "intelligence", supervisor }),
  omegaBriefingOpened: () => fire({ eventType: "briefing_open", layer: "intelligence" }),
  loopAdvanced: (stage: string) => fire({ eventType: "loop_advance", stage }),

  installPromptShown: () => fire({ eventType: "install_prompt_shown" }),
  installPromptAccepted: () => fire({ eventType: "install_prompt_accepted" }),
  pushPermissionGranted: () => fire({ eventType: "push_granted" }),
  pushPermissionDenied: () => fire({ eventType: "push_denied" }),
  offlineActionQueued: () => fire({ eventType: "offline_action_queued" }),
  biometricLoginUsed: () => fire({ eventType: "biometric_login" }),
  voiceInputUsed: () => fire({ eventType: "voice_input", layer: "intelligence" }),

  errorEncountered: (layer: string, feature: string, error: Error) =>
    fire({ eventType: "error", layer, feature, errorMessage: error.message, errorCode: error.name }),
};

export default track;
