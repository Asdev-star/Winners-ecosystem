// Phase 5 — Winners Intelligence — LoopTrackerPage.tsx
// Agentic Loop visual history with stage tracking and revenue attribution

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import ContextBar from "../../components/ui/ContextBar";
import AgenticLoopVisualiser from "./components/AgenticLoopVisualiser";
import AutoActionCard from "./components/AutoActionCard";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface LoopState {
  active: boolean;
  loopId?: string;
  stage: string;
  stageIndex: number;
  steps: Array<{ step: number; supervisor: string; action: string; description: string; layer: string; timestamp: string }>;
  loopCount: number;
  daysSinceStart?: number;
  revenueImpact?: number;
  nextMilestone?: string;
}

interface PendingAction {
  id: string;
  assistant: string;
  actionType: string;
  description: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

const STAGE_LABELS: Record<string, string> = {
  community: "Building Presence",
  academy: "Gaining Skills",
  work: "Landing Work",
  market: "Selling Products",
  intelligence: "Compounding",
};

const SUP_EMOJI: Record<string, string> = {
  omega: "🧠", nova: "👥", sage: "🎓", atlas: "🛒", circuit: "💼", aria: "⬡", nexus: "☁️", forge: "🤖", herald: "🧬",
};

export default function LoopTrackerPage() {
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [loop, setLoop] = useState<LoopState | null>(null);
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) return;
    Promise.all([
      fetch(`${API}/agentic/loop/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API}/agentic/actions/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]).then(([loopData, actionsData]) => {
      setLoop(loopData);
      setActions(actionsData.actions ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token, user]);

  const removeAction = (id: string) => setActions((a) => a.filter((x) => x.id !== id));

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(155,111,255,0.04) 0%, transparent 60%), var(--bg)", color: "var(--text)", fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes shimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(100%); } }
        .step-row:hover { background: var(--surface2); }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        <ContextBar />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, margin: 0 }}>
              Agentic <em style={{ fontStyle: "italic", color: "var(--purple)" }}>Loop</em>
            </h1>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.1em", margin: "4px 0 0" }}>
              PHASE 5 · WINNERS INTELLIGENCE · LOOP TRACKER
            </p>
          </div>
          <button onClick={() => navigate("/intelligence")} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-dim)", borderRadius: 4, padding: "8px 14px", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer", letterSpacing: "0.06em" }}>
            ← INTELLIGENCE HUB
          </button>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, height: 200, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)", animation: "shimmer 1.4s infinite" }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, marginTop: 24 }}>
            {/* Left: Visualiser + stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--purple), transparent)" }} />
                <AgenticLoopVisualiser
                  currentStage={loop?.stage ?? "community"}
                  completedStages={loop?.steps.map((s) => s.layer) ?? []}
                  loopCount={loop?.loopCount ?? 0}
                  pendingAction={loop?.nextMilestone ? `Next: ${loop.nextMilestone}` : undefined}
                  onStageClick={(s) => navigate(`/intelligence/agents/${s === "intelligence" ? "omega" : s === "community" ? "nova" : s === "academy" ? "sage" : s === "work" ? "circuit" : "atlas"}`)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--green), transparent)" }} />
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 6 }}>LOOPS COMPLETE</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "var(--green)" }}>{loop?.loopCount ?? 0}</div>
                </div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--gold), transparent)" }} />
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 6 }}>CURRENT STAGE</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>{STAGE_LABELS[loop?.stage ?? "community"] ?? "Starting"}</div>
                </div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--purple), transparent)" }} />
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 6 }}>TOTAL STEPS</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "var(--purple)" }}>{loop?.steps?.length ?? 0}</div>
                </div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--ice), transparent)" }} />
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 6 }}>DAYS ACTIVE</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "var(--ice)" }}>{loop?.daysSinceStart ?? 0}</div>
                </div>
              </div>
            </div>

            {/* Right: Step history + pending actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Pending actions */}
              {actions.length > 0 && (
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--purple)", letterSpacing: "0.1em", marginBottom: 10 }}>
                    PENDING ACTIONS ({actions.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {actions.map((a) => (
                      <AutoActionCard key={a.id} action={a} onActioned={removeAction} />
                    ))}
                  </div>
                </div>
              )}

              {/* Step history */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em" }}>LOOP STEPS</div>
                  {!loop?.active && (
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text-dim)", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 3, padding: "3px 8px" }}>
                      NO ACTIVE LOOP
                    </span>
                  )}
                </div>

                {(!loop?.steps || loop.steps.length === 0) ? (
                  <div style={{ padding: 32, textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, color: "var(--text-dim)", marginBottom: 8 }}>No loop activity yet</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)" }}>Post in Community to start your Agentic Loop</div>
                    <button onClick={() => navigate("/community")} style={{ marginTop: 16, background: "var(--purple)", color: "var(--bg)", border: "none", borderRadius: 4, padding: "8px 18px", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer", letterSpacing: "0.06em" }}>
                      → GO TO COMMUNITY
                    </button>
                  </div>
                ) : (
                  <div>
                    {[...loop.steps].reverse().map((step, i) => (
                      <div key={i} className="step-row" style={{ display: "flex", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--border)", transition: "background 150ms ease", alignItems: "flex-start" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                          {SUP_EMOJI[step.supervisor] ?? "🧠"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--purple)", letterSpacing: "0.06em" }}>
                              {(step.supervisor ?? "OMEGA").toUpperCase()}
                            </span>
                            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text-dim)", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 2, padding: "2px 6px" }}>
                              {(step.layer ?? "").toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.4 }}>{step.description}</div>
                          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text-dim)", marginTop: 4 }}>
                            {step.timestamp ? new Date(step.timestamp).toLocaleDateString() : ""}
                          </div>
                        </div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", flexShrink: 0 }}>
                          #{step.step}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
