import { offline } from "./offline";

const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://winners-empire.up.railway.app";
const API_BASE = RAW_API_URL.replace(/\/+$/, "");

type RequestOptions = {
  token?: string | null;
  method?: string;
  data?: unknown;
  headers?: Record<string, string>;
  queueOnOffline?: boolean;
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data, headers, method = "GET", queueOnOffline = method !== "GET", token } = options;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers ?? {}),
      },
      body: data == null ? undefined : JSON.stringify(data),
    });

    offline.setOnline(true);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `API request failed with status ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    offline.setOnline(false);

    if (queueOnOffline && method !== "GET") {
      offline.enqueue({
        endpoint,
        method,
        body: data,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(headers ?? {}),
        },
      });
    }

    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string, token?: string | null) => request<T>(endpoint, { token }),
  post: <T>(endpoint: string, data: unknown, token?: string | null) =>
    request<T>(endpoint, { method: "POST", data, token }),
  put: <T>(endpoint: string, data: unknown, token?: string | null) =>
    request<T>(endpoint, { method: "PUT", data, token }),
  flushQueuedRequests: async () => {
    await offline.flush(async (action) => {
      await request(action.endpoint, {
        method: action.method,
        data: action.body,
        headers: action.headers,
        queueOnOffline: false,
      });
    });
  },
};
