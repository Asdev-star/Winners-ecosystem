import { createWinnersClient, type AssistantName } from "../../../../sdk/WinnersSDK";

export const MOBILE_API_ORIGIN = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001").trim().replace(/\/+$/, "");
export const MOBILE_API_BASE = MOBILE_API_ORIGIN.endsWith("/api/v1")
  ? MOBILE_API_ORIGIN
  : `${MOBILE_API_ORIGIN}/api/v1`;

export interface MobileSession {
  token?: string | null;
  tenantId?: string | null;
}

export function getMobileClient(session: MobileSession = {}) {
  return createWinnersClient({
    baseUrl: MOBILE_API_ORIGIN,
    token: session.token ?? undefined,
    tenantId: session.tenantId ?? undefined,
    debug: __DEV__,
  });
}

export async function sendAssistantMessage(
  message: string,
  assistant: AssistantName = "aria",
  session: MobileSession = {},
) {
  return getMobileClient(session).ai.chat({
    message,
    assistant,
  });
}
