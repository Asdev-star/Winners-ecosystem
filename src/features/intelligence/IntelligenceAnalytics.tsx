// Phase 5 — Winners Intelligence — IntelligenceAnalytics.tsx
// AI Usage Analytics Dashboard — credits, supervisors, loop funnel

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { useAuthStore } from "../auth/authStore";
import ContextBar from "../../components/ui/ContextBar";
import CreditMeter from "./components/CreditMeter";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface CreditTransaction {
  id: string;
  action: string;
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}

interface CreditBalance {
  balance: number;
  tier: string;
  costs: Record<string, number>;
}

interface LoopStats {
  loopCount: number;
  stage: string;
  stageIndex: number;
  steps: unknown[];
  daysSinceStart?: number;
}

const SUPERVISOR_COLORS: Record<string, string> = {
  omega: "var(--purple)",
  aria: "var(--gold)",
  nova: "var(--ice)",
  sage: "var(--green)",
  atlas: "var(--gold)",
  circuit: "var(--blue)",
  nexus: "var(--ice)",
  forge: "var(--purple)",
  herald: "var(--purple)",
};

const STAGE_LABELS: Record<string, string> = {
  community: "Community",
  academy: "Academy",
  work: "Work",
  market: "Market",
  intelligence: "Intelligence",
};

const LOOP_STAGES = ["community", "academy", "work", "market", "intelligence"];

export default function IntelligenceAnalytics() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();

  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loopStats, setLoopStats] = useState<LoopStats | null>(null);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    if (!token || !user) return;
    setLoading(true);
    try {
      const [balRes, txRes, loopRes] = await Promise.allSettled([
        fetch(`${API}/credits/balance`, { headers }),
        fetch(`${API}/credits/history?limit=30`, { headers }),
        fetch(`${API}/agentic/loop/${user.id}`, { headers }),
      ]);

      if (balRes.status === "fulfilled" && balRes.value.ok) {
        setBalance(await balRes.value.json());
      }
      if (txRes.status === "fulfilled" && txRes.value.ok) {
        const d = await txRes.value.json();
        setTransactions(d.transactions ?? []);
      }
      if (loopRes.status === "fulfilled" && loopRes.value.ok) {
        setLoopStats(await loopRes.value.json());
      }
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => { load(); }, [load]);

  // Build daily credit usage from transactions (last 14 days)
  const dailyUsageData = (() => {
    const map: Record<string, { date: string; spent: number; earned: number }> = {};
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      map[key] = { date: key, spent: 0, earned: 0 };
    }
    transactions.forEach((tx) => {
      const key = new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (map[key]) {
        if (tx.amount < 0) map[key].spent += Math.abs(tx.amount);
        else map[key].earned += tx.amount;
      }
    });
    return Object.values(map);
  })();

  // Build supervisor usage breakdown from transaction descriptions
  const supervisorData = (() => {
    const counts: Record<string, number> = {};
    transactions.filter((tx) => tx.amount < 0).forEach((tx) => {
      const match = tx.description.match(/(omega|aria|nova|sage|atlas|circuit|nexus|forge|herald)/i);
      if (match) {
        const key = match[1].toLowerCase();
        counts[key] = (counts[key] ?? 0) + Math.abs(tx.amount);
      } else {
        counts["other"] = (counts["other"] ?? 0) + Math.abs(tx.amount);
      }
    });
    return Object.entries(counts).map(([name, credits]) => ({ name: name.toUpperCase(), credits })).sort((a, b) => b.credits - a.credits);
  })();

  // Loop funnel data
  const loopFunnelData = LOOP_STAGES.map((stage, idx) => ({
    stage: STAGE_LABELS[stage],
    reached: loopStats && loopStats.stageIndex >= idx ? 1 : 0,
    active: loopStats?.stage === stage ? 1 : 0,
  }));

  const totalSpent = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalEarned = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        .ia-root { min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; padding: 24px; }
        .ia-header { margin-bottom: 28px; }
        .ia-title { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 300; margin: 0 0 4px; }
        .ia-title em { font-style: italic; color: var(--purple); }
        .ia-subtitle { font-family: 'Space Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-dim); }
        .ia-stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
        .ia-stat { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 18px 20px; position: relative; overflow: hidden; }
        .ia-stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
        .ia-stat.balance::before { background: linear-gradient(90deg, var(--green), transparent); }
        .ia-stat.spent::before   { background: linear-gradient(90deg, var(--red), transparent); }
        .ia-stat.earned::before  { background: linear-gradient(90deg, var(--gold), transparent); }
        .ia-stat.loop::before    { background: linear-gradient(90deg, var(--purple), transparent); }
        .ia-stat-label { font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-dim); margin-bottom: 8px; }
        .ia-stat-value { font-size: 28px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
        .ia-stat-sub   { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); }
        .ia-chart-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 24px; }
        .ia-chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 22px; position: relative; overflow: hidden; }
        .ia-chart-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--purple), transparent); }
        .ia-chart-title { font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: var(--text-dim); margin-bottom: 20px; }
        .ia-funnel-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); }
        .ia-funnel-row:last-child { border-bottom: none; }
        .ia-funnel-label { font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; width: 100px; flex-shrink: 0; }
        .ia-funnel-bar-bg { flex: 1; height: 6px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
        .ia-funnel-bar-fill { height: 100%; border-radius: 3px; transition: width 600ms ease; }
        .ia-funnel-status { font-family: 'Space Mono', monospace; font-size: 8px; text-transform: uppercase; letter-spacing: 0.06em; width: 60px; text-align: right; flex-shrink: 0; }
        .ia-skeleton { background: var(--surface2); border-radius: 4px; animation: shimmer 1.5s ease infinite; }
        @keyframes shimmer { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @media (max-width: 1024px) {
          .ia-stat-row { grid-template-columns: repeat(2, 1fr); }
          .ia-chart-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .ia-root { padding: 16px; }
          .ia-stat-row { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="ia-root">
        <ContextBar activeLayer="intelligence" />

        <div className="ia-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="ia-title">Intelligence <em>Analytics</em></h1>
            <div className="ia-subtitle">AI Usage · Credit Consumption · Agentic Loop Funnel</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <CreditMeter compact />
            <button
              onClick={() => navigate("/intelligence")}
              style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, padding: "7px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text-dim)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              ← Intelligence Hub
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="ia-stat-row">
          <div className="ia-stat balance">
            <div className="ia-stat-label">Current Balance</div>
            <div className="ia-stat-value" style={{ color: "var(--green)" }}>
              {loading ? <div className="ia-skeleton" style={{ width: 60, height: 28 }} /> : (balance?.balance ?? 0)}
            </div>
            <div className="ia-stat-sub">{balance?.tier ?? "free"} tier · AI credits</div>
          </div>
          <div className="ia-stat spent">
            <div className="ia-stat-label">Credits Spent</div>
            <div className="ia-stat-value" style={{ color: "var(--red)" }}>
              {loading ? <div className="ia-skeleton" style={{ width: 50, height: 28 }} /> : totalSpent}
            </div>
            <div className="ia-stat-sub">last 30 transactions</div>
          </div>
          <div className="ia-stat earned">
            <div className="ia-stat-label">Credits Earned</div>
            <div className="ia-stat-value" style={{ color: "var(--gold)" }}>
              {loading ? <div className="ia-skeleton" style={{ width: 50, height: 28 }} /> : totalEarned}
            </div>
            <div className="ia-stat-sub">bonuses + welcome</div>
          </div>
          <div className="ia-stat loop">
            <div className="ia-stat-label">Loop Stage</div>
            <div className="ia-stat-value" style={{ color: "var(--purple)", fontSize: 20, paddingTop: 4 }}>
              {loading ? <div className="ia-skeleton" style={{ width: 80, height: 28 }} /> : (STAGE_LABELS[loopStats?.stage ?? ""] ?? "—")}
            </div>
            <div className="ia-stat-sub">
              {loopStats?.loopCount ? `${loopStats.loopCount} loop${loopStats.loopCount !== 1 ? "s" : ""} complete` : "loop not started"}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="ia-chart-grid">
          {/* Credit Usage over time */}
          <div className="ia-chart-card">
            <div className="ia-chart-title">Credit Usage — Last 14 Days</div>
            {loading ? (
              <div className="ia-skeleton" style={{ height: 200, borderRadius: 6 }} />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyUsageData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--red)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="earnedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: "var(--text-dim)", fontSize: 9, fontFamily: "Space Mono" }} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-dim)", fontSize: 9, fontFamily: "Space Mono" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, fontFamily: "Space Mono", fontSize: 10 }}
                    labelStyle={{ color: "var(--text-dim)" }}
                    itemStyle={{ color: "var(--text)" }}
                  />
                  <Area type="monotone" dataKey="earned" stroke="var(--gold)" fill="url(#earnedGrad)" strokeWidth={2} name="Earned" />
                  <Area type="monotone" dataKey="spent" stroke="var(--red)" fill="url(#spentGrad)" strokeWidth={2} name="Spent" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Supervisor Breakdown */}
          <div className="ia-chart-card">
            <div className="ia-chart-title">Credits by Supervisor</div>
            {loading ? (
              <div className="ia-skeleton" style={{ height: 200, borderRadius: 6 }} />
            ) : supervisorData.length === 0 ? (
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                No AI interactions yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={supervisorData} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "var(--text-dim)", fontSize: 9, fontFamily: "Space Mono" }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "var(--text-dim)", fontSize: 9, fontFamily: "Space Mono" }} tickLine={false} axisLine={false} width={50} />
                  <Tooltip
                    contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, fontFamily: "Space Mono", fontSize: 10 }}
                    labelStyle={{ color: "var(--text-dim)" }}
                    itemStyle={{ color: "var(--text)" }}
                    formatter={(v: unknown) => [`${v} credits`, "Used"]}
                  />
                  <Bar dataKey="credits" radius={[0, 3, 3, 0]}>
                    {supervisorData.map((entry) => (
                      <Cell key={entry.name} fill={SUPERVISOR_COLORS[entry.name.toLowerCase()] ?? "var(--purple)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Agentic Loop Funnel */}
        <div className="ia-chart-card" style={{ marginBottom: 24 }}>
          <div className="ia-chart-title">Agentic Loop Funnel — Your Stage Progression</div>
          {LOOP_STAGES.map((stage, idx) => {
            const reached = loopStats ? loopStats.stageIndex >= idx : false;
            const isActive = loopStats?.stage === stage;
            const pct = reached ? 100 : 0;
            return (
              <div key={stage} className="ia-funnel-row">
                <div className="ia-funnel-label" style={{ color: isActive ? "var(--gold)" : reached ? "var(--green)" : "var(--text-dim)" }}>
                  {idx + 1}. {STAGE_LABELS[stage]}
                </div>
                <div className="ia-funnel-bar-bg">
                  <div
                    className="ia-funnel-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: isActive ? "var(--gold)" : reached ? "var(--green)" : "var(--border)",
                    }}
                  />
                </div>
                <div className="ia-funnel-status" style={{ color: isActive ? "var(--gold)" : reached ? "var(--green)" : "var(--text-dim)" }}>
                  {isActive ? "Active" : reached ? "✓ Done" : "Pending"}
                </div>
              </div>
            );
          })}
          {!loopStats?.loopCount && (
            <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(155,111,255,0.06)", border: "1px solid rgba(155,111,255,0.2)", borderRadius: 6, fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", lineHeight: 1.6 }}>
              🔁 Your loop hasn't started yet. Post in{" "}
              <span
                style={{ color: "var(--ice)", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => navigate("/community")}
              >
                Community
              </span>{" "}
              to activate NOVA skill detection and start the loop.
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="ia-chart-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div className="ia-chart-title" style={{ marginBottom: 0 }}>Recent Transactions</div>
            <button
              onClick={() => navigate("/intelligence/credits")}
              style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--purple)", background: "none", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              View All →
            </button>
          </div>
          {loading ? [0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="ia-skeleton" style={{ width: 200, height: 13, borderRadius: 3 }} />
              <div className="ia-skeleton" style={{ width: 40, height: 13, borderRadius: 3, marginLeft: "auto" }} />
            </div>
          )) : transactions.slice(0, 8).map((tx) => (
            <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 13, color: "var(--text)", flex: 1, lineHeight: 1.4 }}>{tx.description}</div>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
                color: tx.amount >= 0 ? "var(--green)" : "var(--red)",
              }}>
                {tx.amount >= 0 ? "+" : ""}{tx.amount}
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", minWidth: 70, textAlign: "right" }}>
                {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
          ))}
          {!loading && transactions.length === 0 && (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-dim)", fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              No transactions yet — start using AI to see usage here
            </div>
          )}
        </div>
      </div>
    </>
  );
}
