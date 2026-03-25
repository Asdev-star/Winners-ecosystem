// Phase 5 — Winners Intelligence — CreditsPage.tsx
// AI credit balance, usage history, and top-up

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import ContextBar from "../../components/ui/ContextBar";
import CreditMeter from "./components/CreditMeter";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

const ACTIONS: Record<string, { label: string; cost: number | string; color: string }> = {
  omega_briefing:    { label: "OMEGA Daily Briefing",       cost: "FREE",  color: "var(--green)" },
  supervisor_chat:   { label: "Supervisor Chat Message",    cost: 2,       color: "var(--purple)" },
  omega_analysis:    { label: "OMEGA Deep Analysis",        cost: 10,      color: "var(--purple)" },
  skill_gap_analysis:{ label: "Skill Gap Analysis",         cost: 5,       color: "var(--blue)" },
  path_generation:   { label: "Learning Path Generation",   cost: 5,       color: "var(--green)" },
  quiz_generation:   { label: "Auto Quiz Generation",       cost: 5,       color: "var(--green)" },
  autonomous_action: { label: "Autonomous Action Execute",  cost: 3,       color: "var(--gold)" },
  image_generation:  { label: "Image Generation (SDXL)",   cost: 10,      color: "var(--ice)" },
  voice_transcription:{ label: "Voice Transcription (30s)", cost: 1,       color: "var(--ice)" },
};

const PLANS = [
  { name: "Free",       credits: 200,   price: 0,    tier: "free",       color: "var(--text-dim)",  features: ["OMEGA Daily Briefing", "Basic Aria Chat", "200 credits/month"] },
  { name: "Pro",        credits: 2000,  price: 29,   tier: "pro",        color: "var(--gold)",      features: ["All 9 Supervisors", "Auto-actions", "Skill gap analysis", "2,000 credits/month"] },
  { name: "Enterprise", credits: 10000, price: 99,   tier: "enterprise", color: "var(--purple)",    features: ["Custom agents", "API access", "Analytics export", "10,000 credits/month"] },
];

interface Transaction {
  id: string;
  action: string;
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}

export default function CreditsPage() {
  const token    = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const [balance, setBalance]       = useState(0);
  const [tier, setTier]             = useState("free");
  const [transactions, setTx]       = useState<Transaction[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${API}/credits/balance`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API}/credits/history`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]).then(([bal, hist]) => {
      if (bal.balance !== undefined) setBalance(bal.balance);
      if (bal.tier) setTier(bal.tier);
      setTx(hist.transactions ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes shimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(100%); } }
        .plan-card:hover { border-color: var(--gold); transform: translateY(-2px); }
        .tx-row:hover    { background: var(--surface2); }
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 24px" }}>
        <ContextBar />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, margin: 0 }}>
              AI <em style={{ fontStyle: "italic", color: "var(--purple)" }}>Credits</em>
            </h1>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.1em", margin: "4px 0 0" }}>
              PHASE 5 · WINNERS INTELLIGENCE · CREDIT SYSTEM
            </p>
          </div>
          <button onClick={() => navigate("/intelligence")} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-dim)", borderRadius: 4, padding: "8px 14px", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer", letterSpacing: "0.06em" }}>
            ← INTELLIGENCE HUB
          </button>
        </div>

        {/* Current balance */}
        <div style={{ marginBottom: 28, maxWidth: 320 }}>
          <CreditMeter />
        </div>

        {/* Plans */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 14 }}>CREDIT TIERS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {PLANS.map((plan) => {
              const isActive = tier === plan.tier;
              return (
                <div
                  key={plan.tier}
                  className="plan-card"
                  style={{ background: "var(--surface)", border: `1px solid ${isActive ? plan.color : "var(--border)"}`, borderRadius: 6, padding: "20px 18px", position: "relative", overflow: "hidden", transition: "all 200ms ease", cursor: "default" }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${plan.color}, transparent)` }} />
                  {isActive && (
                    <div style={{ position: "absolute", top: 10, right: 12, fontFamily: "'Space Mono', monospace", fontSize: 8, color: plan.color, background: `${plan.color}15`, border: `1px solid ${plan.color}40`, borderRadius: 3, padding: "2px 7px", letterSpacing: "0.06em" }}>
                      CURRENT
                    </div>
                  )}
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: plan.color, letterSpacing: "0.08em", marginBottom: 6 }}>{plan.name.toUpperCase()}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, color: "var(--text)", marginBottom: 2 }}>
                    {plan.price === 0 ? "Free" : `$${plan.price}`}
                    {plan.price > 0 && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)" }}>/mo</span>}
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--gold)", marginBottom: 14 }}>
                    {plan.credits.toLocaleString()} credits/month
                  </div>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--text-dim)", marginBottom: 5 }}>
                      <span style={{ color: plan.color }}>✓</span> {f}
                    </div>
                  ))}
                  {!isActive && plan.price > 0 && (
                    <button style={{ width: "100%", marginTop: 14, background: plan.color, color: "var(--bg)", border: "none", borderRadius: 4, padding: "9px", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer", letterSpacing: "0.06em" }}>
                      UPGRADE → ${plan.price}/mo
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Credit cost table */}
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 12 }}>CREDIT COSTS</div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
              {Object.entries(ACTIONS).map(([key, action], i, arr) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ fontSize: 12, color: "var(--text)" }}>{action.label}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: action.cost === "FREE" ? "var(--green)" : action.color, fontWeight: 700 }}>
                    {action.cost === "FREE" ? "FREE" : `${action.cost} cr`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction history */}
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 12 }}>TRANSACTION HISTORY</div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", maxHeight: 380, overflowY: "auto" }}>
              {loading ? (
                <div style={{ padding: 20 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ height: 48, background: "var(--surface2)", borderRadius: 4, marginBottom: 8, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)", animation: "shimmer 1.4s infinite" }} />
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", fontSize: 12, color: "var(--text-dim)" }}>No transactions yet</div>
              ) : (
                transactions.map((tx, i) => (
                  <div key={tx.id} className="tx-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 16px", borderBottom: i < transactions.length - 1 ? "1px solid var(--border)" : "none", transition: "background 150ms ease" }}>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 2 }}>{tx.description}</div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text-dim)" }}>
                        {new Date(tx.createdAt).toLocaleDateString()} · bal: {tx.balance}
                      </div>
                    </div>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: tx.amount > 0 ? "var(--green)" : "var(--red)", fontWeight: 700, flexShrink: 0 }}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
