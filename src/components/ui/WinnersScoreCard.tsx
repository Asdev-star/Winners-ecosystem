// Level VII — Predictive & Autonomous OMEGA
// Component: WinnersScoreCard
// Weekly OMEGA report card — scores per layer, overall grade, trend, OMEGA message.
// Used in: Dashboard sidebar, OMEGA briefing, user profile.

import { useEffect, useState } from "react";
import { getAuthHeaders } from "../../features/auth/authStore";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

export interface LayerScore {
  layer: string;
  emoji: string;
  score: number;
  maxScore: number;
  delta: number;
  label: string;
}

export interface ScoreCard {
  weekEnding: string;
  overallScore: number;
  overallGrade: "S" | "A" | "B" | "C" | "D" | "F";
  delta: number;
  streak: number;
  layers: LayerScore[];
  omegaMessage: string;
  highlight: string;
  topOpportunity: string;
}

function getMockScoreCard(): ScoreCard {
  return {
    weekEnding: new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
    overallScore: 74,
    overallGrade: "B",
    delta: +6,
    streak: 3,
    layers: [
      { layer: "Community", emoji: "👥", score: 18, maxScore: 20, delta: +2, label: "Top 12% engagement" },
      { layer: "Academy",   emoji: "🎓", score: 14, maxScore: 25, delta: -1, label: "React course 68% done" },
      { layer: "Work",      emoji: "💼", score: 16, maxScore: 20, delta: +3, label: "71% proposal win rate" },
      { layer: "Market",    emoji: "🛒", score: 12, maxScore: 20, delta: +2, label: "2 products listed" },
      { layer: "Trust",     emoji: "⬡",  score: 14, maxScore: 15, delta: 0,  label: "Identity verified" },
    ],
    omegaMessage: "Strong week. Your Community layer is your current highest-leverage activity — keep it up. Academy is the bottleneck: completing your React course this week unlocks 3 new Work categories and could lift your score by 8 points.",
    highlight: "Work layer improved +3pts — highest mover this week.",
    topOpportunity: "Complete Academy course → +8 pts next week.",
  };
}

async function fetchScoreCard(): Promise<ScoreCard> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return getMockScoreCard();
  try {
    const res = await fetch(`${API}/omega/scorecard/weekly`, { headers });
    if (!res.ok) return getMockScoreCard();
    return await res.json();
  } catch {
    return getMockScoreCard();
  }
}

const GRADE_COLORS: Record<string, string> = {
  S: "var(--green)",
  A: "var(--green)",
  B: "var(--gold)",
  C: "var(--ice)",
  D: "var(--text-dim)",
  F: "var(--red)",
};

const css = `
.wsc-root {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  font-family: 'Syne', sans-serif;
}

.wsc-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 20px 14px;
  background: linear-gradient(135deg, rgba(240,180,41,0.06) 0%, rgba(155,111,255,0.04) 100%);
  border-bottom: 1px solid var(--border);
}

.wsc-header-left { flex: 1; min-width: 0; }

.wsc-eyebrow {
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gold);
  margin: 0 0 4px;
}

.wsc-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 2px;
}

.wsc-week {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 0.04em;
}

.wsc-grade-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.wsc-grade {
  font-family: 'Cormorant Garamond', serif;
  font-size: 42px;
  font-weight: 300;
  line-height: 1;
}

.wsc-grade-delta {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.06em;
}

.wsc-grade-delta.pos { color: var(--green); }
.wsc-grade-delta.neg { color: var(--red); }
.wsc-grade-delta.flat { color: var(--text-dim); }

.wsc-omega-msg {
  margin: 0;
  padding: 12px 20px;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--text);
  background: rgba(155,111,255,0.04);
  border-bottom: 1px solid var(--border);
  font-style: italic;
  border-left: 2px solid var(--purple);
}

.wsc-layers {
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wsc-layer-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wsc-layer-emoji { font-size: 14px; flex-shrink: 0; width: 20px; text-align: center; }

.wsc-layer-info { flex: 1; min-width: 0; }

.wsc-layer-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.wsc-layer-label {
  font-size: 10px;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wsc-layer-bar-track {
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
  flex: 1;
}

.wsc-layer-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--gold);
  transition: width 0.5s ease;
}

.wsc-layer-score {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
  width: 34px;
  text-align: right;
  flex-shrink: 0;
}

.wsc-layer-delta {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  width: 24px;
  text-align: right;
  flex-shrink: 0;
}
.wsc-layer-delta.pos { color: var(--green); }
.wsc-layer-delta.neg { color: var(--red); }

.wsc-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wsc-highlight {
  font-size: 11.5px;
  color: var(--green);
  font-weight: 600;
}

.wsc-opportunity {
  font-size: 11px;
  color: var(--text-dim);
  font-style: italic;
}

.wsc-streak {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
}

.wsc-streak-label {
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  color: var(--gold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
`;

export default function WinnersScoreCard() {
  const [card, setCard] = useState<ScoreCard | null>(null);

  useEffect(() => {
    fetchScoreCard().then(setCard);
  }, []);

  if (!card) {
    return (
      <>
        <style>{css}</style>
        <div className="wsc-root" style={{ padding: 24, textAlign: "center", color: "var(--text-dim)", fontSize: 12 }}>
          Loading OMEGA report…
        </div>
      </>
    );
  }

  const gradeColor = GRADE_COLORS[card.overallGrade] ?? "var(--text)";

  return (
    <>
      <style>{css}</style>
      <div className="wsc-root">
        <div className="wsc-header">
          <div className="wsc-header-left">
            <p className="wsc-eyebrow">OMEGA Weekly Report</p>
            <p className="wsc-title">Winners Score Card</p>
            <p className="wsc-week">Week ending {card.weekEnding}</p>
            {card.streak > 0 && (
              <div className="wsc-streak">
                <span style={{ fontSize: 12 }}>🔥</span>
                <span className="wsc-streak-label">{card.streak}-week improvement streak</span>
              </div>
            )}
          </div>
          <div className="wsc-grade-block">
            <span className="wsc-grade" style={{ color: gradeColor }}>
              {card.overallGrade}
            </span>
            <span className={`wsc-grade-delta ${card.delta > 0 ? "pos" : card.delta < 0 ? "neg" : "flat"}`}>
              {card.delta > 0 ? `+${card.delta}` : card.delta} pts
            </span>
          </div>
        </div>

        <p className="wsc-omega-msg">"{card.omegaMessage}"</p>

        <div className="wsc-layers">
          {card.layers.map((layer) => {
            const pct = (layer.score / layer.maxScore) * 100;
            return (
              <div key={layer.layer} className="wsc-layer-row">
                <span className="wsc-layer-emoji">{layer.emoji}</span>
                <div className="wsc-layer-info">
                  <div className="wsc-layer-name">
                    {layer.layer}
                  </div>
                  <div className="wsc-layer-label">{layer.label}</div>
                  <div className="wsc-layer-bar-track">
                    <div className="wsc-layer-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="wsc-layer-score">{layer.score}/{layer.maxScore}</span>
                <span className={`wsc-layer-delta ${layer.delta > 0 ? "pos" : layer.delta < 0 ? "neg" : "flat"}`}>
                  {layer.delta > 0 ? `+${layer.delta}` : layer.delta === 0 ? "—" : layer.delta}
                </span>
              </div>
            );
          })}
        </div>

        <div className="wsc-footer">
          <p className="wsc-highlight">✦ {card.highlight}</p>
          <p className="wsc-opportunity">→ {card.topOpportunity}</p>
        </div>
      </div>
    </>
  );
}
