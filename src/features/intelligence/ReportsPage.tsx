// Phase 5 — Winners Intelligence — ReportsPage.tsx
// Weekly supervisor reports across all 9 assistants

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import ContextBar from "../../components/ui/ContextBar";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

const TABS = [
  { id: "omega",   name: "OMEGA",   emoji: "🧠", color: "var(--purple)" },
  { id: "nova",    name: "NOVA",    emoji: "👥", color: "var(--ice)" },
  { id: "sage",    name: "SAGE",    emoji: "🎓", color: "var(--green)" },
  { id: "circuit", name: "CIRCUIT", emoji: "💼", color: "var(--blue)" },
  { id: "atlas",   name: "ATLAS",   emoji: "🛒", color: "var(--gold)" },
];

interface Report {
  summary: string;
  highlights: Array<{ layer: string; insight: string }>;
  actionItems: string[];
  generatedAt: string;
  cached?: boolean;
}

function ReportContent({ report, supervisor, color }: { report: Report; supervisor: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "16px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: color, letterSpacing: "0.1em", marginBottom: 10 }}>
          {supervisor} · WEEKLY SUMMARY · {new Date(report.generatedAt).toLocaleDateString()}
          {report.cached && <span style={{ marginLeft: 8, color: "var(--text-dim)" }}>(cached)</span>}
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text)", lineHeight: 1.6, fontFamily: "'Syne', sans-serif" }}>
          {report.summary}
        </p>
      </div>

      {/* Highlights */}
      {report.highlights?.length > 0 && (
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 10 }}>KEY HIGHLIGHTS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {report.highlights.map((h, i) => (
              <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 16px", display: "flex", gap: 12 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: color, background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 3, padding: "2px 8px", height: "fit-content", letterSpacing: "0.06em", flexShrink: 0 }}>
                  {(h.layer ?? "").toUpperCase()}
                </span>
                <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{h.insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action items */}
      {report.actionItems?.length > 0 && (
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 10 }}>THIS WEEK'S ACTIONS</div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
            {report.actionItems.map((action, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 16px", borderBottom: i < report.actionItems.length - 1 ? "1px solid var(--border)" : "none" }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: color, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const token    = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("omega");
  const [reports, setReports]     = useState<Record<string, Report>>({});
  const [loading, setLoading]     = useState<Record<string, boolean>>({});
  const [error, setError]         = useState<Record<string, string>>({});

  const loadReport = async (supervisor: string) => {
    if (reports[supervisor] || loading[supervisor]) return;
    setLoading((l) => ({ ...l, [supervisor]: true }));

    try {
      const res = await fetch(`${API}/insights/weekly-report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.report) {
        const r = data.report;
        setReports((prev) => ({
          ...prev,
          [supervisor]: {
            summary: r.summary ?? r.weeklyNarrative ?? "Report generated.",
            highlights: r.highlights ?? r.keyMetrics?.map((m: string) => ({ layer: supervisor, insight: m })) ?? [],
            actionItems: r.actionItems ?? r.recommendations ?? [],
            generatedAt: new Date().toISOString(),
            cached: data.cached,
          },
        }));
      } else {
        setError((e) => ({ ...e, [supervisor]: "Could not load report" }));
      }
    } catch {
      setError((e) => ({ ...e, [supervisor]: "Failed to load report" }));
    } finally {
      setLoading((l) => ({ ...l, [supervisor]: false }));
    }
  };

  useEffect(() => {
    if (token) loadReport(activeTab);
  }, [activeTab, token]);

  const activeSup = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes shimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(100%); } }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>
        <ContextBar />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, margin: 0 }}>
              Intelligence <em style={{ fontStyle: "italic", color: "var(--purple)" }}>Reports</em>
            </h1>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.1em", margin: "4px 0 0" }}>
              PHASE 5 · WINNERS INTELLIGENCE · WEEKLY DIGESTS
            </p>
          </div>
          <button onClick={() => navigate("/intelligence")} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-dim)", borderRadius: 4, padding: "8px 14px", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer", letterSpacing: "0.06em" }}>
            ← INTELLIGENCE HUB
          </button>
        </div>

        {/* Supervisor tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 0, flexWrap: "wrap" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? `${tab.color}12` : "none",
                border: "none",
                borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : "2px solid transparent",
                color: activeTab === tab.id ? tab.color : "var(--text-dim)",
                padding: "10px 16px",
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                cursor: "pointer",
                letterSpacing: "0.08em",
                transition: "all 150ms ease",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {tab.emoji} {tab.name}
            </button>
          ))}
        </div>

        {/* Report content */}
        {loading[activeTab] ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[200, 120, 160].map((h, i) => (
              <div key={i} style={{ height: h, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)", animation: "shimmer 1.4s infinite" }} />
              </div>
            ))}
          </div>
        ) : error[activeTab] ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 16 }}>{error[activeTab]}</div>
            <button onClick={() => { setError((e) => ({ ...e, [activeTab]: "" })); loadReport(activeTab); }} style={{ background: activeSup.color, color: "var(--bg)", border: "none", borderRadius: 4, padding: "8px 18px", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer", letterSpacing: "0.06em" }}>
              RETRY
            </button>
          </div>
        ) : reports[activeTab] ? (
          <ReportContent report={reports[activeTab]} supervisor={activeSup.name} color={activeSup.color} />
        ) : null}
      </div>
    </div>
  );
}
