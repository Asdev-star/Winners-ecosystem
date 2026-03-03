import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "./authStore";

interface StartSsoLaunchOptions {
  targetOrigin: string;
  nextPath?: string;
}

interface SsoTokenResponse {
  token: string;
  state: string;
  nonce: string;
  audience: string;
}

const DEFAULT_ALLOWED_HOST_PATTERNS = [
  /\.winnersempire\.io$/i,
  /^localhost$/i,
  /^127\.0\.0\.1$/i,
];

function normalizeOrigin(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Missing SSO target origin.");
  }

  const candidate = trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error("Invalid SSO target origin.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("SSO target must use http or https.");
  }

  parsed.pathname = "";
  parsed.search = "";
  parsed.hash = "";
  return parsed;
}

function sanitizeNextPath(nextPath?: string): string {
  if (!nextPath) return "/dashboard";
  if (!nextPath.startsWith("/")) return "/dashboard";
  if (nextPath.startsWith("//")) return "/dashboard";
  return nextPath;
}

function getAllowedOriginsFromEnv(): Set<string> {
  const raw = (import.meta.env.VITE_SSO_ALLOWED_ORIGINS ?? "").trim();
  if (!raw) return new Set();

  const origins = new Set<string>();
  raw.split(",")
    .map((part: string) => part.trim())
    .filter(Boolean)
    .forEach((entry: string) => {
      try {
        origins.add(normalizeOrigin(entry).origin);
      } catch {
        // Ignore malformed entries.
      }
    });

  return origins;
}

function isAllowedTargetOrigin(target: URL): boolean {
  const allowlist = getAllowedOriginsFromEnv();
  if (allowlist.size > 0) {
    return allowlist.has(target.origin);
  }

  return DEFAULT_ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(target.hostname));
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function getPlatformSsoTarget(path: string): string | null {
  const targets: Record<string, string | undefined> = {
    "/community": import.meta.env.VITE_SSO_COMMUNITY_ORIGIN,
    "/academy": import.meta.env.VITE_SSO_ACADEMY_ORIGIN,
  };

  const raw = targets[path]?.trim();
  return raw ? raw : null;
}

export async function startSsoLaunch(options: StartSsoLaunchOptions): Promise<void> {
  const target = normalizeOrigin(options.targetOrigin);
  if (!isAllowedTargetOrigin(target)) {
    throw new Error("SSO target origin is not in the allowed list.");
  }

  const response = await fetch(`${API_BASE}/sso/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      audience: target.host,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as Partial<SsoTokenResponse> & { message?: string };
  if (!response.ok || !body.token || !body.state || !body.nonce) {
    const message = body.message ?? `Failed to create SSO handoff token (${response.status})`;
    throw new Error(message);
  }

  const redirect = new URL("/sso/exchange", target.origin);
  redirect.searchParams.set("token", body.token);
  redirect.searchParams.set("state", body.state);
  redirect.searchParams.set("nonce", body.nonce);
  redirect.searchParams.set("next", sanitizeNextPath(options.nextPath));

  window.location.assign(redirect.toString());
}

export function getSsoLaunchError(error: unknown): string {
  return getErrorMessage(error, "SSO launch failed.");
}
