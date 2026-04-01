import * as SecureStore from "expo-secure-store";
import { env } from "../config/env";
import { offline } from "./offline";
import { cache, type CacheBucket } from "./cache";

export const API_BASE = env.apiBaseUrl;

export const AUTH_TOKEN_KEY = "winners_jwt";

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string) {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken() {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers = new Headers(options.headers ?? {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${path}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

type RequestOptions = {
  token?: string | null;
  method?: string;
  data?: unknown;
  headers?: Record<string, string>;
  queueOnOffline?: boolean;
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data, headers, method = "GET", queueOnOffline = method !== "GET", token } = options;
  const authToken = token ?? (await getAuthToken());

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(headers ?? {}),
      },
      body: data == null ? undefined : JSON.stringify(data),
    });

    offline.setOnline(true);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `API ${response.status}: ${endpoint}`);
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
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(headers ?? {}),
        },
      });
    }

    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string, token?: string | null) => request<T>(endpoint, { token }),
  getCached: <T>(bucket: CacheBucket, endpoint: string, token?: string | null) =>
    cache.fetch(bucket, endpoint, () => request<T>(endpoint, { token })),
  post: <T>(endpoint: string, data: unknown, token?: string | null) =>
    request<T>(endpoint, { method: "POST", data, token }),
  put: <T>(endpoint: string, data: unknown, token?: string | null) =>
    request<T>(endpoint, { method: "PUT", data, token }),
  delete: <T>(endpoint: string, token?: string | null) =>
    request<T>(endpoint, { method: "DELETE", token }),
  invalidateCache: (bucket: CacheBucket, endpoint: string) => cache.invalidate(`${bucket}:${endpoint}`),
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
