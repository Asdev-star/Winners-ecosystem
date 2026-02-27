// src/features/auth/SsoExchangePage.tsx
// Phase 1 - Core Engine
// Completes SSO handoff by exchanging short-lived cross-domain token for app session token.

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { type AuthUser, useAuthStore } from "./authStore";

const TOKEN_KEY = "we_token";
const USER_KEY = "we_user";

const css = `
  .sso-wrap {
    min-height: 100vh;
    background: var(--bg, #0D1520);
    color: var(--text, #E8EEF5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: 'Syne', sans-serif;
  }
  .sso-card {
    width: 100%;
    max-width: 460px;
    background: var(--surface, #111D2E);
    border: 1px solid var(--border, #1E3248);
    border-radius: 6px;
    position: relative;
    overflow: hidden;
    padding: 22px 20px;
  }
  .sso-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--gold, #C9A84C), var(--ice, #89C4E1), transparent);
  }
  .sso-label {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--gold, #C9A84C);
    margin-bottom: 8px;
  }
  .sso-title {
    margin: 0;
    font-size: 24px;
    letter-spacing: -0.7px;
    font-weight: 800;
  }
  .sso-text {
    margin-top: 8px;
    color: var(--text-dim, #5A7A96);
    font-size: 13px;
    line-height: 1.5;
  }
  .sso-status {
    margin-top: 16px;
    border: 1px solid var(--border, #1E3248);
    border-radius: 6px;
    background: var(--surface2, #172335);
    padding: 10px 12px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--ice, #89C4E1);
  }
  .sso-status.error {
    border-color: rgba(224, 90, 78, 0.35);
    background: rgba(224, 90, 78, 0.12);
    color: var(--red, #E05A4E);
  }
`;

interface ExchangeResponse {
  token: string;
  user: AuthUser;
}

function sanitizeNext(nextRaw: string | null): string {
  if (!nextRaw) return "/dashboard";
  if (!nextRaw.startsWith("/")) return "/dashboard";
  if (nextRaw.startsWith("//")) return "/dashboard";
  return nextRaw;
}

export default function SsoExchangePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const handoffToken = params.get("token");
  const nextPath = useMemo(() => sanitizeNext(params.get("next")), [params]);

  useEffect(() => {
    const run = async () => {
      if (!handoffToken) {
        setError("Missing SSO token.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/sso/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handoffToken,
            audience: window.location.host,
          }),
        });

        const body = (await response.json()) as Partial<ExchangeResponse> & { message?: string };
        if (!response.ok || !body.token || !body.user) {
          throw new Error(body.message ?? `SSO exchange failed (${response.status})`);
        }

        localStorage.setItem(TOKEN_KEY, body.token);
        localStorage.setItem(USER_KEY, JSON.stringify(body.user));
        useAuthStore.setState({
          token: body.token,
          user: body.user,
          pendingTwoFactor: null,
          isLoading: false,
          isRestoring: false,
        });

        navigate(nextPath, { replace: true });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "SSO exchange failed";
        setError(message);
      }
    };

    void run();
  }, [handoffToken, navigate, nextPath]);

  return (
    <div className="sso-wrap">
      <style>{css}</style>
      <div className="sso-card">
        <div className="sso-label">Core Engine SSO</div>
        <h1 className="sso-title">{error ? "Sign-in Failed" : "Completing Sign-in"}</h1>
        <div className="sso-text">
          {error
            ? "We could not complete the cross-app handoff. Please retry from the source app."
            : "Verifying handoff token and creating your local session..."}
        </div>
        <div className={`sso-status${error ? " error" : ""}`}>
          {error || "Exchanging token..."}
        </div>
      </div>
    </div>
  );
}

