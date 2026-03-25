// Phase 5 — Winners Intelligence — AutoActionCard.tsx
// OMEGA autonomous action proposal UI

import { useState } from "react";
import { useAuthStore } from "../../auth/authStore";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

const SUPERVISOR_EMOJI: Record<string, string> = {
  omega: "🧠", aria: "⬡", nova: "👥", sage: "🎓",
  atlas: "🛒", forge: "🤖", circuit: "💼", nexus: "☁️", herald: "🧬",
};

interface Action {
  id: string;
  assistant: string;
  actionType: string;
  description: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

interface Props {
  action: Action;
  onActioned: (id: string) => void;
}

export default function AutoActionCard({ action, onActioned }: Props) {
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handle = async (decision: "approve" | "reject") => {
    setLoading(decision);
    try {
      await fetch(`${API}/agentic/actions/${action.id}/${decision}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      onActioned(action.id);
    } catch {
      setLoading(null);
    }
  };

  const supervisor = action.assistant?.toLowerCase() ?? "omega";
  const emoji = SUPERVISOR_EMOJI[supervisor] ?? "🧠";
  const draft = action.payload?.draft as string | undefined;

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--purple)",
      borderRadius: 6,
      overflow: "hidden",
      position: "relative",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--purple), transparent)" }} />

      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{emoji}</span>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--purple)", letterSpacing: "0.1em" }}>
                OMEGA RECOMMENDS · via {(action.assistant ?? "OMEGA").toUpperCase()}
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text-dim)", letterSpacing: "0.06em" }}>
                {action.actionType?.toUpperCase()}
              </div>
            </div>
          </div>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text-dim)" }}>
            {new Date(action.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--text)", lineHeight: 1.5, fontFamily: "'Syne', sans-serif" }}>
          {action.description}
        </p>

        {draft && (
          <div style={{
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: 4, padding: "8px 12px", marginBottom: 12,
            fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5,
            fontFamily: "'Syne', sans-serif", fontStyle: "italic",
          }}>
            "{draft}"
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => handle("approve")}
            disabled={loading !== null}
            style={{
              background: "var(--green)", color: "var(--bg)",
              border: "none", borderRadius: 4, padding: "7px 14px",
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
              letterSpacing: "0.05em",
            }}
          >
            {loading === "approve" ? "..." : "✓ Do it"}
          </button>
          <button
            onClick={() => handle("reject")}
            disabled={loading !== null}
            style={{
              background: "transparent", color: "var(--text-dim)",
              border: "none", borderRadius: 4, padding: "7px 10px",
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            ✗ Skip
          </button>
          <span style={{ marginLeft: "auto", fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text-dim)" }}>
            3 cr
          </span>
        </div>
      </div>
    </div>
  );
}
