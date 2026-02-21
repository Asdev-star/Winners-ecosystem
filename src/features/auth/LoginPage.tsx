// src/features/auth/LoginPage.tsx

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "./authStore";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .lp-root {
    --gold: #F5C842; --bg: #080B10; --surface: #0D1117; --surface2: #141B24;
    --border: #1E2A38; --text: #E8EDF2; --text-dim: #5A6878; --green: #2DD4A0; --red: #FF5975;
    min-height: 100vh; background: var(--bg); display: flex; align-items: center;
    justify-content: center; font-family: 'Syne', sans-serif; color: var(--text);
    padding: 24px; position: relative; overflow: hidden;
  }
  .lp-root::before {
    content: ''; position: fixed; inset: 0;
    background-image: linear-gradient(rgba(245,200,66,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,200,66,0.03) 1px, transparent 1px);
    background-size: 40px 40px; pointer-events: none;
  }
  .lp-glow {
    position: fixed; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(245,200,66,0.04) 0%, transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none;
  }
  .lp-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
    padding: 40px; width: 100%; max-width: 420px; position: relative; z-index: 1;
    animation: lp-fadeUp 0.5s ease forwards;
  }
  .lp-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--gold), rgba(245,200,66,0.2)); border-radius: 6px 6px 0 0;
  }
  .lp-logo { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: var(--gold); margin-bottom: 28px; display: flex; align-items: center; gap: 8px; }
  .lp-logo-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 8px var(--gold); }
  .lp-title { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
  .lp-title span { color: var(--gold); }
  .lp-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-bottom: 32px; }
  .lp-field { margin-bottom: 16px; }
  .lp-label { display: block; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; }
  .lp-input { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 3px; padding: 12px 14px; font-family: 'Space Mono', monospace; font-size: 13px; color: var(--text); outline: none; transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box; }
  .lp-input::placeholder { color: var(--text-dim); }
  .lp-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(245,200,66,0.08); }
  .lp-input.error { border-color: var(--red); }
  .lp-error { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--red); margin-top: 6px; }
  .lp-submit { width: 100%; background: var(--gold); color: #080B10; border: none; border-radius: 3px; padding: 13px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity 0.15s, transform 0.15s; margin-top: 8px; }
  .lp-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .lp-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .lp-loading { display: inline-flex; align-items: center; gap: 8px; }
  .lp-spinner { width: 14px; height: 14px; border: 2px solid rgba(8,11,16,0.3); border-top-color: #080B10; border-radius: 50%; animation: lp-spin 0.7s linear infinite; }
  .lp-alert { background: rgba(255,89,117,0.08); border: 1px solid rgba(255,89,117,0.25); border-radius: 3px; padding: 11px 14px; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--red); margin-bottom: 20px; }
  .lp-divider { display: flex; align-items: center; gap: 12px; margin: 24px 0; }
  .lp-divider-line { flex: 1; height: 1px; background: var(--border); }
  .lp-divider-text { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .lp-google {
    width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 3px;
    padding: 12px 14px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
    color: var(--text); cursor: pointer; transition: all 0.15s; display: flex; align-items: center;
    justify-content: center; gap: 10px; margin-bottom: 12px;
  }
  .lp-google:hover { border-color: var(--gold); background: rgba(245,200,66,0.04); }
  .lp-google-icon { width: 18px; height: 18px; flex-shrink: 0; }
  .lp-demo { background: var(--surface2); border: 1px solid var(--border); border-radius: 3px; padding: 12px 14px; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); cursor: pointer; transition: border-color 0.15s; text-align: center; letter-spacing: 0.5px; }
  .lp-demo:hover { border-color: var(--gold); color: var(--gold); }
  .lp-demo span { color: var(--gold); }
  .lp-footer { margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--border); font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); text-align: center; }
  @keyframes lp-fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes lp-spin { to { transform: rotate(360deg); } }
`;

export default function LoginPage() {
  const navigate       = useNavigate();
  const login          = useAuthStore((s) => s.login);
  const user           = useAuthStore((s) => s.user);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [fieldErr, setFieldErr]       = useState({ email: false, password: false });
  const [oauthDone, setOauthDone]     = useState(false);

  useEffect(() => {
    const id = "lp-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const code       = params.get("code");
  const token      = params.get("token");
  const userJson   = params.get("user");
  const oauthError = params.get("error");

  if (oauthError) {
    setError("Google sign-in failed.");
    window.history.replaceState({}, "", "/login");
    return;
  }

  // Case 1: Google returned a code — send to backend
  if (code) {
    window.history.replaceState({}, "", "/login");
    const API = import.meta.env.VITE_API_URL ?? "";
    fetch(`${API}/auth/google/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirectUri: `${window.location.origin}/login` }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.token && data.user) {
          localStorage.setItem("winners_token", data.token);
          localStorage.setItem("winners_user", JSON.stringify(data.user));
          window.location.replace("/");
        } else {
          setError(data.message ?? "Google sign-in failed.");
        }
      })
      .catch(() => setError("Google sign-in failed."));
    return;
  }

  // Case 2: Backend already exchanged and returned token+user
  if (token && userJson) {
    try {
      const userData = JSON.parse(decodeURIComponent(userJson));
      localStorage.setItem("winners_token", token);
      localStorage.setItem("winners_user", JSON.stringify(userData));
      window.location.replace("/");
    } catch {
      setError("Failed to complete Google sign-in.");
    }
  }
}, []);

  // Only redirect if already logged in AND not processing OAuth
  useEffect(() => {
    if (user && !oauthDone) navigate("/", { replace: true });
  }, [user, navigate, oauthDone]);

  const validate = () => {
    const errs = { email: !email.includes("@"), password: password.length < 6 };
    setFieldErr(errs);
    return !errs.email && !errs.password;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail("demo@winners.io");
    setPassword("demo1234");
    setError("");
    setFieldErr({ email: false, password: false });
  };

  const handleGoogle = () => {
    const clientId    = "148507996421-2di0upcp6d7fi4gojr8d74n5l3udk9tu.apps.googleusercontent.com";
    const redirectUri = encodeURIComponent("https://winners-empire-eco.up.railway.app/login");
    const scope       = encodeURIComponent("openid email profile");
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`;
    window.location.href = url;
  };

  return (
    <div className="lp-root">
      <div className="lp-glow" />
      <div className="lp-card">
        <div className="lp-logo">
          <div className="lp-logo-dot" />
          Winners Ecosystem
        </div>

        <h1 className="lp-title">Welcome <span>Back</span></h1>
        <p className="lp-subtitle">Sign in to your workspace</p>

        {error && <div className="lp-alert">{error}</div>}

        <button className="lp-google" onClick={handleGoogle}>
          <svg className="lp-google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="lp-divider">
          <div className="lp-divider-line" />
          <span className="lp-divider-text">or sign in with email</span>
          <div className="lp-divider-line" />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="lp-field">
            <label className="lp-label" htmlFor="email">Email</label>
            <input
              id="email" type="email"
              className={`lp-input${fieldErr.email ? " error" : ""}`}
              placeholder="you@company.com" value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErr((f) => ({ ...f, email: false })); }}
              autoComplete="email" autoFocus
            />
            {fieldErr.email && <div className="lp-error">› Valid email required</div>}
          </div>

          <div className="lp-field">
            <label className="lp-label" htmlFor="password">Password</label>
            <input
              id="password" type="password"
              className={`lp-input${fieldErr.password ? " error" : ""}`}
              placeholder="••••••••" value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErr((f) => ({ ...f, password: false })); }}
              autoComplete="current-password"
            />
            {fieldErr.password && <div className="lp-error">› Minimum 6 characters</div>}
          </div>

          <button type="submit" className="lp-submit" disabled={loading}>
            {loading
              ? <span className="lp-loading"><span className="lp-spinner" /> Signing in...</span>
              : "Sign In"}
          </button>
        </form>

        <div className="lp-divider">
          <div className="lp-divider-line" />
          <span className="lp-divider-text">or</span>
          <div className="lp-divider-line" />
        </div>

        <div className="lp-demo" onClick={fillDemo}>
          Use demo credentials → <span>demo@winners.io</span>
        </div>

        <div className="lp-footer">
          Winners Ecosystem · Multi-Tenant Intelligence Platform
        </div>
      </div>
    </div>
  );
}