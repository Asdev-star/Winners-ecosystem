// Phase 5 — Winners Intelligence — MemoryManagerPage.tsx
// View and delete supervisor memories across all 9 assistants

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import ContextBar from "../../components/ui/ContextBar";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

const SUPERVISORS = [
  { id: "omega",   name: "OMEGA",   emoji: "🧠", color: "var(--purple)" },
  { id: "nova",    name: "NOVA",    emoji: "👥", color: "var(--ice)" },
  { id: "sage",    name: "SAGE",    emoji: "🎓", color: "var(--green)" },
  { id: "atlas",   name: "ATLAS",   emoji: "🛒", color: "var(--gold)" },
  { id: "circuit", name: "CIRCUIT", emoji: "💼", color: "var(--blue)" },
  { id: "aria",    name: "ARIA",    emoji: "⬡",  color: "var(--gold)" },
  { id: "nexus",   name: "NEXUS",   emoji: "☁️", color: "var(--ice)" },
  { id: "forge",   name: "FORGE",   emoji: "🤖", color: "var(--purple)" },
  { id: "herald",  name: "HERALD",  emoji: "🧬", color: "var(--purple)" },
];

interface Memory {
  id: string;
  assistant: string;
  memoryType: string;
  content: string;
  confidence: number;
  createdAt: string;
  expiresAt?: string;
}

export default function MemoryManagerPage() {
  const token    = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const [memories, setMemories]   = useState<Memory[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [deleting, setDeleting]   = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/supervisors/omega/context`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const mems: Memory[] = d.context?.memories ?? [];
        setMemories(mems);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const deleteMemory = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`${API}/supervisors/memory/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMemories((m) => m.filter((x) => x.id !== id));
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const filtered = activeTab === "all"
    ? memories
    : memories.filter((m) => m.assistant?.toLowerCase() === activeTab);

  const memoryTypeBadgeColor = (type: string) => {
    switch (type) {
      case "skill":     return "var(--green)";
      case "preference": return "var(--blue)";
      case "milestone": return "var(--gold)";
      case "journey":   return "var(--purple)";
      case "flag":      return "var(--red)";
      default:          return "var(--text-dim)";
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes shimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(100%); } }
        .mem-row:hover { background: var(--surface2); }
        .mem-tab:hover { color: var(--text); }
        .del-btn:hover { color: var(--red); border-color: var(--red); }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>
        <ContextBar />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, margin: 0 }}>
              Memory <em style={{ fontStyle: "italic", color: "var(--purple)" }}>Manager</em>
            </h1>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.1em", margin: "4px 0 0" }}>
              {memories.length} memories across {new Set(memories.map((m) => m.assistant)).size} supervisors
            </p>
          </div>
          <button onClick={() => navigate("/intelligence")} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-dim)", borderRadius: 4, padding: "8px 14px", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer", letterSpacing: "0.06em" }}>
            ← INTELLIGENCE HUB
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          <button
            className="mem-tab"
            onClick={() => setActiveTab("all")}
            style={{ background: activeTab === "all" ? "rgba(155,111,255,0.1)" : "none", border: `1px solid ${activeTab === "all" ? "var(--purple)" : "var(--border)"}`, color: activeTab === "all" ? "var(--purple)" : "var(--text-dim)", borderRadius: 20, padding: "5px 12px", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer", letterSpacing: "0.06em", transition: "all 150ms ease" }}
          >
            ALL ({memories.length})
          </button>
          {SUPERVISORS.map((s) => {
            const count = memories.filter((m) => m.assistant?.toLowerCase() === s.id).length;
            if (count === 0) return null;
            return (
              <button
                key={s.id}
                className="mem-tab"
                onClick={() => setActiveTab(s.id)}
                style={{ background: activeTab === s.id ? `${s.color}15` : "none", border: `1px solid ${activeTab === s.id ? s.color : "var(--border)"}`, color: activeTab === s.id ? s.color : "var(--text-dim)", borderRadius: 20, padding: "5px 12px", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer", letterSpacing: "0.06em", transition: "all 150ms ease" }}
              >
                {s.emoji} {s.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Memory list */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 60, background: "var(--surface2)", borderRadius: 4, marginBottom: 8, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)", animation: "shimmer 1.4s infinite" }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, color: "var(--text-dim)", marginBottom: 8 }}>No memories yet</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)" }}>Supervisors build memories as you interact with them</div>
            </div>
          ) : (
            filtered.map((mem, i) => {
              const sup = SUPERVISORS.find((s) => s.id === mem.assistant?.toLowerCase()) ?? SUPERVISORS[0];
              return (
                <div key={mem.id} className="mem-row" style={{ display: "flex", gap: 14, padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", transition: "background 150ms ease", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{sup.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: sup.color, letterSpacing: "0.06em" }}>{sup.name}</span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, padding: "2px 7px", borderRadius: 3, border: `1px solid ${memoryTypeBadgeColor(mem.memoryType)}40`, color: memoryTypeBadgeColor(mem.memoryType), background: `${memoryTypeBadgeColor(mem.memoryType)}10` }}>
                        {(mem.memoryType ?? "").toUpperCase()}
                      </span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text-dim)" }}>
                        {Math.round((mem.confidence ?? 1) * 100)}% confidence
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{mem.content}</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text-dim)", marginTop: 4 }}>
                      {new Date(mem.createdAt).toLocaleDateString()}
                      {mem.expiresAt && ` · expires ${new Date(mem.expiresAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <button
                    className="del-btn"
                    onClick={() => deleteMemory(mem.id)}
                    disabled={deleting === mem.id}
                    style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-dim)", borderRadius: 4, padding: "4px 8px", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer", flexShrink: 0, transition: "all 150ms ease" }}
                  >
                    {deleting === mem.id ? "..." : "✕"}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div style={{ marginTop: 16, fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", textAlign: "center", lineHeight: 1.6 }}>
          Memories help supervisors personalise their guidance. Deleting a memory is permanent.
        </div>
      </div>
    </div>
  );
}
