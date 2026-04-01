import { useEffect, useState } from "react";
import { useAuthStore } from "../../auth/authStore";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface BriefingRecommendation {
  label: string;
  url: string;
  priority: string;
}

interface Briefing {
  briefing: string;
  recommendations: BriefingRecommendation[];
  generatedAt: string;
  expiresAt: string;
  cached: boolean;
}

export default function OMEGABriefingCard() {
  const token = useAuthStore((s) => s.token);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    fetch(`${API}/omega/briefing`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => setBriefing(json))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid rgba(155,111,255,0.2)", borderRadius: 6, padding: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--purple), transparent)" }} />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(155,111,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🧠</div>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--purple)", letterSpacing: "0.1em", marginBottom: 4 }}>OMEGA · LOADING BRIEFING</div>
            <div style={{ width: 180, height: 10, background: "var(--surface2)", borderRadius: 4 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!briefing) return null;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid rgba(155,111,255,0.25)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--purple), transparent)" }} />
      <div style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12 }} onClick={() => setExpanded((value) => !value)}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(155,111,255,0.12)", border: "1px solid rgba(155,111,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
          🧠
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--purple)", letterSpacing: "0.1em", marginBottom: 4 }}>
            OMEGA · DAILY BRIEFING
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text)", lineHeight: 1.5, fontFamily: "'Syne', sans-serif" }}>
            {briefing.briefing}
          </p>
        </div>
        <span style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 2 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ height: 1, background: "var(--border)", marginBottom: 14 }} />

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 8 }}>RECOMMENDATIONS</div>
            {briefing.recommendations?.map((item, index) => (
              <div key={`${item.label}-${index}`} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: "var(--text)", lineHeight: 1.4, fontFamily: "'Syne', sans-serif" }}>
                <span style={{ color: "var(--gold)", flexShrink: 0 }}>{index + 1}.</span>
                {item.label}
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 4, padding: "10px 12px", fontSize: 12, color: "var(--gold)", fontStyle: "italic", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.5 }}>
            Cached until {new Date(briefing.expiresAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
