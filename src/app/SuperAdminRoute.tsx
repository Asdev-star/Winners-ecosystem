// src/app/SuperAdminRoute.tsx
// Core Engine Gate — Only the ecosystem architect can pass

import { Navigate } from "react-router-dom";
import { useAuthStore } from "../features/auth/authStore";
import type { ReactNode } from "react";

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? "").toLowerCase().trim();

interface Props {
  children: ReactNode;
}

const css = `
  .sa-gate {
    min-height: 100vh; background: var(--bg);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-family: 'Space Mono', monospace;
    position: relative; overflow: hidden;
  }
  .sa-gate::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 50% 50%, rgba(224,90,78,0.04) 0%, transparent 70%),
      linear-gradient(rgba(30,46,69,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(30,46,69,0.04) 1px, transparent 1px);
    background-size: 100% 100%, 40px 40px, 40px 40px;
    pointer-events: none;
  }
  .sa-box {
    position: relative; z-index: 1;
    border: 1px solid rgba(224,90,78,0.25);
    border-radius: 8px;
    padding: 48px 56px;
    background: rgba(13,24,38,0.95);
    text-align: center;
    max-width: 420px;
    width: 90%;
    animation: sa-in 0.4s ease;
  }
  @keyframes sa-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sa-icon {
    width: 56px; height: 56px; margin: 0 auto 20px;
    border-radius: 14px;
    background: rgba(224,90,78,0.08);
    border: 1px solid rgba(224,90,78,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
  }
  .sa-title {
    font-size: 13px; font-weight: 700; letter-spacing: 3px;
    text-transform: uppercase; color: var(--red); margin-bottom: 10px;
  }
  .sa-sub {
    font-size: 10px; color: var(--text-dim); line-height: 1.7;
    margin-bottom: 28px;
  }
  .sa-code {
    display: inline-block; padding: 4px 12px;
    background: rgba(224,90,78,0.06); border: 1px solid rgba(224,90,78,0.15);
    border-radius: 4px; font-size: 10px; color: rgba(224,90,78,0.6);
    letter-spacing: 2px; margin-bottom: 28px;
  }
  .sa-back {
    display: inline-block; padding: 10px 24px;
    background: transparent; border: 1px solid var(--border);
    border-radius: 4px; font-size: 10px; color: var(--text-dim);
    cursor: pointer; letter-spacing: 1px;
    transition: all 0.15s; text-decoration: none;
  }
  .sa-back:hover { border-color: var(--gold); color: var(--gold); }
`;

if (typeof document !== "undefined" && !document.getElementById("sa-gate-styles")) {
  const tag = document.createElement("style");
  tag.id = "sa-gate-styles";
  tag.textContent = css;
  document.head.appendChild(tag);
}

export default function SuperAdminRoute({ children }: Props) {
  const user = useAuthStore((s) => s.user);
  const isRestoring = useAuthStore((s) => s.isRestoring);

  if (isRestoring) return null;
  if (!user) return <Navigate to="/login" replace />;

  const isSuperAdmin =
    ADMIN_EMAIL
      ? user.email.toLowerCase() === ADMIN_EMAIL
      : user.role === "owner";

  if (!isSuperAdmin) {
    return (
      <div className="sa-gate">
        <div className="sa-box">
          <div className="sa-icon">⛔</div>
          <div className="sa-title">Access Restricted</div>
          <div className="sa-code">CORE ENGINE · CLASSIFIED</div>
          <div className="sa-sub">
            This area is restricted to the Winners Ecosystem architect only.
            Unauthorized access attempts are logged and audited.
          </div>
          <a href="/dashboard" className="sa-back">← Return to Dashboard</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
