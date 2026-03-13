// Phase 5 — Winners Intelligence — CreditMeter.tsx
// Credit balance display + tier badge

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/authStore";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

const TIER_MAX: Record<string, number> = {
  free: 200,
  pro: 2000,
  enterprise: 10000,
};

const TIER_COLOR: Record<string, string> = {
  free: "var(--text-dim)",
  pro: "var(--gold)",
  enterprise: "var(--purple)",
};

interface Props {
  compact?: boolean;
}

export default function CreditMeter({ compact = false }: Props) {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);
  const [tier, setTier] = useState("free");

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/credits/balance`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.balance !== undefined) setBalance(d.balance);
        if (d.tier) setTier(d.tier);
      })
      .catch(() => {});
  }, [token]);

  if (balance === null) return null;

  const max = TIER_MAX[tier] ?? 200;
  const pct = Math.min((balance / max) * 100, 100);
  const isLow = pct < 20;

  if (compact) {
    return (
      <div
        style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
        onClick={() => navigate("/intelligence/credits")}
        title={`${balance} credits remaining`}
      >
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: isLow ? "var(--red)" : TIER_COLOR[tier], letterSpacing: "0.05em" }}>
          ⚡ {balance.toLocaleString()} cr
        </span>
      </div>
    );
  }

  return (
    <div
      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 14px", cursor: "pointer" }}
      onClick={() => navigate("/intelligence/credits")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em" }}>
          AI CREDITS
        </div>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: "0.1em",
          padding: "2px 7px", borderRadius: 3,
          background: `rgba(${tier === "pro" ? "201,168,76" : tier === "enterprise" ? "155,111,255" : "90,122,150"},0.1)`,
          border: `1px solid ${TIER_COLOR[tier]}40`,
          color: TIER_COLOR[tier],
          textTransform: "uppercase" as const,
        }}>
          {tier}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: isLow ? "var(--red)" : "var(--text)" }}>
          {balance.toLocaleString()}
        </span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)" }}>/ {max.toLocaleString()}</span>
      </div>

      <div style={{ height: 4, background: "var(--surface2)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: isLow ? "var(--red)" : pct > 60 ? "var(--green)" : "var(--gold)",
          borderRadius: 2,
          transition: "width 0.4s ease",
        }} />
      </div>

      {isLow && (
        <div style={{ marginTop: 8, fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--red)", letterSpacing: "0.05em" }}>
          ⚠ Low credits — Top up to continue
        </div>
      )}
    </div>
  );
}
