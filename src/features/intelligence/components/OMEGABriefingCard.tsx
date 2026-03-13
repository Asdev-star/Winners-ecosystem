// Phase 5 — Winners Intelligence — OMEGABriefingCard.tsx
// OMEGA daily cross-layer briefing card

import { useState, useEffect } from "react";
import { useAuthStore } from "../../auth/authStore";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface Briefing {
  greeting: string;
  highlights: string[];
  actionItems: string[];
  motivation: string;
}

export default function OMEGABriefingCard() {
  const token = useAuthStore((s) => s.token);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!token) return;
    let buffer = "";
    setLoading(true);

    fetch(`${API}/omega/briefing`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        const read = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (line.startsWith("data: ")) {
                const raw = line.slice(6).trim();
                if (raw === "[DONE]") {
                  try {
                    const jsonMatch = buffer.match(/\{[\s\S]*\}/);
                    if (jsonMatch) setBriefing(JSON.parse(jsonMatch[0]));
                  } catch { /* ignore parse error */ }
                  setLoading(false);
                  return;
                }
                try { buffer += JSON.parse(raw).token ?? ""; } catch { /* ignore */ }
              }
            }
          }
          setLoading(false);
        };
        read().catch(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid rgba(155,111,255,0.2)", borderRadius: 6, padding: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--purple), transparent)" }} />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(155,111,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🧠</div>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--purple)", letterSpacing: "0.1em", marginBottom: 4 }}>OMEGA · GENERATING BRIEFING</div>
            <div style={{ width: 180, height: 10, background: "var(--surface2)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(155,111,255,0.4), transparent)", animation: "shimmer 1.4s infinite" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!briefing) return null;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid rgba(155,111,255,0.25)", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--purple), transparent)" }} />
      <div style={{ position: "relative" }}>
        <div
          style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12 }}
          onClick={() => setExpanded(!expanded)}
        >
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(155,111,255,0.12)", border: "1px solid rgba(155,111,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
            🧠
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--purple)", letterSpacing: "0.1em", marginBottom: 4 }}>
              OMEGA · DAILY BRIEFING
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text)", lineHeight: 1.5, fontFamily: "'Syne', sans-serif" }}>
              {briefing.greeting}
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
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 8 }}>HIGHLIGHTS</div>
              {briefing.highlights?.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: "var(--text)", lineHeight: 1.4, fontFamily: "'Syne', sans-serif" }}>
                  <span style={{ color: "var(--purple)", flexShrink: 0 }}>◆</span>
                  {h}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 8 }}>TODAY'S ACTIONS</div>
              {briefing.actionItems?.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: "var(--text)", lineHeight: 1.4, fontFamily: "'Syne', sans-serif" }}>
                  <span style={{ color: "var(--gold)", flexShrink: 0 }}>{i + 1}.</span>
                  {a}
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 4, padding: "10px 12px", fontSize: 12, color: "var(--gold)", fontStyle: "italic", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.5 }}>
              "{briefing.motivation}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
