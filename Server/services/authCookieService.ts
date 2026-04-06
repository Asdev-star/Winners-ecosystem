import type { Response } from "express";

const ACCESS_COOKIE_NAME = "we_access_token";
const REFRESH_COOKIE_NAME = "we_refresh_token";

const SHARED_COOKIE_DOMAIN = process.env.SSO_SHARED_DOMAIN ?? ".winnersempire.io";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES ?? "7d";
const IS_PROD = process.env.NODE_ENV === "production";

type CookieLikeResponse = Pick<Response, "cookie" | "clearCookie">;

function resolveCookieDomain(): string | undefined {
  if (!IS_PROD) return undefined;
  return SHARED_COOKIE_DOMAIN.startsWith(".") ? SHARED_COOKIE_DOMAIN : `.${SHARED_COOKIE_DOMAIN}`;
}

function parseDurationToMs(value: string): number {
  const trimmed = value.trim().toLowerCase();
  const match = /^(\d+)(ms|s|m|h|d)?$/.exec(trimmed);
  if (!match) return 0;

  const amount = Number(match[1]);
  const unit = match[2] ?? "ms";
  const multiplier: Record<string, number> = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return amount * multiplier[unit];
}

function getAuthCookieOptions(maxAge: string) {
  return {
    domain: resolveCookieDomain(),
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax" as const,
    path: "/",
    maxAge: parseDurationToMs(maxAge) || undefined,
  };
}

export function applyAuthCookies(
  res: CookieLikeResponse,
  token: string,
  refreshToken?: string,
): void {
  res.cookie(ACCESS_COOKIE_NAME, token, getAuthCookieOptions(JWT_EXPIRES_IN));

  if (refreshToken) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getAuthCookieOptions(JWT_REFRESH_EXPIRES));
  }
}

export function clearAuthCookies(res: CookieLikeResponse): void {
  const options = getAuthCookieOptions(JWT_REFRESH_EXPIRES);
  res.clearCookie(ACCESS_COOKIE_NAME, options);
  res.clearCookie(REFRESH_COOKIE_NAME, options);
}

export function extractAuthTokenFromRequest(req: { headers?: { authorization?: string; cookie?: string } }): string | null {
  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token) return token;
  }

  const cookies = parseCookieHeader(req.headers?.cookie);
  return cookies[ACCESS_COOKIE_NAME] || null;
}

export function extractRefreshTokenFromRequest(req: { headers?: { cookie?: string } }): string | null {
  const cookies = parseCookieHeader(req.headers?.cookie);
  return cookies[REFRESH_COOKIE_NAME] || null;
}

function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce<Record<string, string>>((acc, entry) => {
    const [rawName, ...rest] = entry.split("=");
    const name = rawName.trim();
    if (!name) return acc;
    acc[name] = rest.join("=").trim();
    return acc;
  }, {});
}

export function getSharedCookieDomain() {
  return resolveCookieDomain();
}
