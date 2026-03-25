import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? Constants.easConfig ?? {}) as Record<string, unknown>;
const isDev = Boolean((globalThis as { __DEV__?: boolean }).__DEV__);

function readString(name: string, fallback = "") {
  const value = extra[name];
  return typeof value === "string" ? value : fallback;
}

function readBoolean(name: string, fallback = false) {
  const value = extra[name];
  return typeof value === "boolean" ? value : fallback;
}

export const env = {
  apiBaseUrl: readString("apiBaseUrl", isDev ? "http://localhost:8080/api/v1" : "https://winners-empire.up.railway.app/api/v1"),
  stripePublishableKey: readString("stripePublishableKey"),
  privacyPolicyUrl: readString("privacyPolicyUrl", "https://winners-empire.up.railway.app/privacy"),
  supportUrl: readString("supportUrl", "https://winners-empire.up.railway.app/support"),
  enableQaOverlay: readBoolean("enableQaOverlay", isDev),
};

export const ENV = {
  API_URL: env.apiBaseUrl.replace(/\/api\/v1\/?$/, ""),
  API_V1_URL: env.apiBaseUrl,
  STRIPE_PUBLISHABLE_KEY: env.stripePublishableKey,
  PRIVACY_POLICY_URL: env.privacyPolicyUrl,
  SUPPORT_URL: env.supportUrl,
  ENABLE_QA_OVERLAY: env.enableQaOverlay,
};
