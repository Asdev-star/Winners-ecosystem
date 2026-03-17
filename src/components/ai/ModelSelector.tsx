// Level VI — Multimodal Intelligence
// Component: ModelSelector
// Claude | GPT-4o | Gemini | Ollama — with cost/speed indicator.
// Used in AssistantPanel (advanced mode) and FORGE settings.

import { useState } from "react";

export type ModelId =
  | "claude-3-7-sonnet"
  | "claude-3-5-haiku"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gemini-2-0-flash"
  | "gemini-1-5-pro"
  | "llama-3-1-70b"
  | "ollama-local";

export interface ModelConfig {
  id: ModelId;
  label: string;
  provider: "anthropic" | "openai" | "google" | "meta" | "local";
  speedRating: 1 | 2 | 3 | 4 | 5;
  costRating: 1 | 2 | 3 | 4 | 5;
  contextWindow: string;
  bestFor: string;
  badge?: string;
  emoji: string;
}

export const MODELS: ModelConfig[] = [
  {
    id: "claude-3-7-sonnet",
    label: "Claude 3.7 Sonnet",
    provider: "anthropic",
    speedRating: 3,
    costRating: 3,
    contextWindow: "200K",
    bestFor: "Complex reasoning & writing",
    badge: "Recommended",
    emoji: "🟣",
  },
  {
    id: "claude-3-5-haiku",
    label: "Claude 3.5 Haiku",
    provider: "anthropic",
    speedRating: 5,
    costRating: 2,
    contextWindow: "200K",
    bestFor: "Fast responses · low cost",
    emoji: "🟣",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    speedRating: 4,
    costRating: 3,
    contextWindow: "128K",
    bestFor: "Multimodal · vision",
    emoji: "🟢",
  },
  {
    id: "gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "openai",
    speedRating: 5,
    costRating: 1,
    contextWindow: "128K",
    bestFor: "High volume · budget",
    emoji: "🟢",
  },
  {
    id: "gemini-2-0-flash",
    label: "Gemini 2.0 Flash",
    provider: "google",
    speedRating: 5,
    costRating: 1,
    contextWindow: "1M",
    bestFor: "Long documents · ultra fast",
    badge: "1M context",
    emoji: "🔵",
  },
  {
    id: "gemini-1-5-pro",
    label: "Gemini 1.5 Pro",
    provider: "google",
    speedRating: 3,
    costRating: 2,
    contextWindow: "2M",
    bestFor: "Full codebase · deep analysis",
    emoji: "🔵",
  },
  {
    id: "llama-3-1-70b",
    label: "Llama 3.1 70B",
    provider: "meta",
    speedRating: 3,
    costRating: 2,
    contextWindow: "128K",
    bestFor: "Open source · no data sharing",
    emoji: "🦙",
  },
  {
    id: "ollama-local",
    label: "Ollama (Local)",
    provider: "local",
    speedRating: 2,
    costRating: 1,
    contextWindow: "Varies",
    bestFor: "Private · offline · zero cost",
    emoji: "💻",
  },
];

interface ModelSelectorProps {
  value: ModelId;
  onChange: (model: ModelId) => void;
  compact?: boolean;
}

function Pip({ filled }: { filled: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: filled ? "var(--gold)" : "var(--border)",
        flexShrink: 0,
      }}
    />
  );
}

function Pips({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pip key={i} filled={i <= rating} />
      ))}
    </span>
  );
}

const css = `
.ms-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  color: var(--text);
  transition: border-color 0.2s;
  white-space: nowrap;
}
.ms-trigger:hover { border-color: var(--purple); }

.ms-dropdown {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  z-index: 300;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 10px;
  width: 320px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.5);
  overflow: hidden;
  animation: ms-in 0.18s ease;
}
@keyframes ms-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.ms-header {
  padding: 10px 14px 8px;
  border-bottom: 1px solid var(--border);
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.ms-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
.ms-item:last-child { border-bottom: none; }
.ms-item:hover { background: rgba(255,255,255,0.03); }
.ms-item.ms-selected { background: rgba(155,111,255,0.07); }

.ms-item-emoji { font-size: 14px; flex-shrink: 0; margin-top: 1px; }

.ms-item-name {
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ms-item-badge {
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.06em;
  color: var(--gold);
  border: 1px solid rgba(240,180,41,0.3);
  border-radius: 3px;
  padding: 1px 4px;
  text-transform: uppercase;
}

.ms-item-meta {
  font-size: 10.5px;
  color: var(--text-dim);
  margin-top: 2px;
}

.ms-ratings {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  align-items: center;
}
.ms-rating-label {
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  text-transform: uppercase;
  color: var(--text-dim);
  letter-spacing: 0.06em;
}
`;

export default function ModelSelector({ value, onChange, compact = false }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = MODELS.find((m) => m.id === value) ?? MODELS[0];

  return (
    <>
      <style>{css}</style>
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          className="ms-trigger"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
          title="Switch AI model"
        >
          <span>{selected.emoji}</span>
          {!compact && (
            <span style={{ fontWeight: 600 }}>{selected.label}</span>
          )}
          <span style={{ color: "var(--text-dim)", fontSize: 10 }}>▾</span>
        </button>

        {open && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 299 }}
              onClick={() => setOpen(false)}
            />
            <div className="ms-dropdown" role="listbox" aria-label="AI model">
              <div className="ms-header">Select model · FORGE routes automatically</div>
              {MODELS.map((m) => (
                <div
                  key={m.id}
                  className={`ms-item${m.id === value ? " ms-selected" : ""}`}
                  role="option"
                  aria-selected={m.id === value}
                  onClick={() => { onChange(m.id); setOpen(false); }}
                >
                  <span className="ms-item-emoji">{m.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ms-item-name">
                      {m.label}
                      {m.badge && (
                        <span className="ms-item-badge">{m.badge}</span>
                      )}
                    </div>
                    <p className="ms-item-meta">{m.bestFor} · {m.contextWindow} ctx</p>
                    <div className="ms-ratings">
                      <span className="ms-rating-label">Speed</span>
                      <Pips rating={m.speedRating} />
                      <span className="ms-rating-label" style={{ marginLeft: 4 }}>Cost</span>
                      <Pips rating={m.costRating} />
                    </div>
                  </div>
                  {m.id === value && (
                    <span style={{ color: "var(--purple)", fontSize: 14, flexShrink: 0 }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
