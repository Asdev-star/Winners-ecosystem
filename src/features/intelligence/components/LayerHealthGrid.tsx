// Phase 5 — Winners Intelligence — LayerHealthGrid.tsx
// 6-tile grid showing each layer's health status

import { useState, useEffect } from "react";
import { useAuthStore } from "../../auth/authStore";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

const LAYERS = [
  { id: "community",    label: "Community",    emoji: "👥", color: "var(--ice)" },
  { id: "academy",      label: "Academy",      emoji: "🎓", color: "var(--green)" },
  { id: "market",       label: "Market",       emoji: "🛒", color: "var(--gold)" },
  { id: "work",         label: "Work",         emoji: "💼", color: "var(--blue)" },
  { id: "intelligence", label: "Intelligence", emoji: "🧠", color: "var(--purple)" },
  { id: "cloud",        label: "Cloud",        emoji: "☁️", color: "var(--ice)" },
];

interface HealthData {
  community: { totalUsers: number; activeUsers: number; activeRatio: number; status: string };
  engagement: { totalPosts: number; postsPerUser: number; status: string };
  intelligence: { skillsDetected: number; avgTrustScore: number; status: string };
  overall: string;
}

function StatusDot({ status }: { status: string }) {
  const color = status === "healthy" || status === "excellent" ? "var(--green)"
    : status === "good" ? "var(--gold)"
    : "var(--red)";
  return (
    <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
  );
}

export default function LayerHealthGrid() {
  const token = useAuthStore((s) => s.token);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/omega/health`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setHealth(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const getLayerData = (id: string) => {
    if (!health) return { metric: "—", status: "developing" };
    switch (id) {
      case "community":
        return { metric: `${health.community?.activeUsers ?? 0} active`, status: health.community?.status ?? "developing" };
      case "academy":
        return { metric: `${health.engagement?.totalPosts ?? 0} posts`, status: health.engagement?.status ?? "developing" };
      case "intelligence":
        return { metric: `${health.intelligence?.skillsDetected ?? 0} skills`, status: health.intelligence?.status ?? "developing" };
      default:
        return { metric: "live", status: "healthy" };
    }
  };

  return (
    <div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 10 }}>
        LAYER HEALTH
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {LAYERS.map((layer) => {
          const { metric, status } = getLayerData(layer.id);
          return (
            <div
              key={layer.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "10px 12px",
                position: "relative",
                overflow: "hidden",
                transition: "border-color 200ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = layer.color)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${layer.color}, transparent)` }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{layer.emoji}</span>
                {loading ? <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--border)" }} /> : <StatusDot status={status} />}
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                {layer.label}
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)" }}>
                {loading ? "loading..." : metric}
              </div>
            </div>
          );
        })}
      </div>
      {health && (
        <div style={{ marginTop: 8, textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 9, color: health.overall === "excellent" ? "var(--green)" : "var(--gold)", letterSpacing: "0.08em" }}>
          ◆ OVERALL: {health.overall?.toUpperCase()}
        </div>
      )}
    </div>
  );
}
