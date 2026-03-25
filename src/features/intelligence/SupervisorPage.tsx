// Phase 5 — Winners Intelligence — SupervisorPage.tsx
// Individual supervisor conversation UI — memory-aware, SSE streaming

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import { useHeraldStore } from "../ai/heraldStore";
import ContextBar from "../../components/ui/ContextBar";
import CreditMeter from "./components/CreditMeter";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

const SUPERVISORS: Record<string, { name: string; emoji: string; role: string; color: string; layer: string; personality: string; opening: string }> = {
  omega:   { name: "OMEGA",   emoji: "🧠", role: "Master Orchestrator", color: "var(--purple)", layer: "All Layers",    personality: "Strategic. Sees patterns no single layer can see. Never reactive.",    opening: "Across your ecosystem this week..." },
  aria:    { name: "ARIA",    emoji: "⬡",  role: "Core Engine",         color: "var(--gold)",   layer: "Core Engine",   personality: "Calm, precise, organized. Leads with your workspace metrics.",         opening: "Your workspace shows..." },
  nova:    { name: "NOVA",    emoji: "👥", role: "Community",           color: "var(--ice)",    layer: "Community",     personality: "Warm, energetic, trend-aware. References community activity.",         opening: "Your community is talking about..." },
  sage:    { name: "SAGE",    emoji: "🎓", role: "Academy Tutor",       color: "var(--green)",  layer: "Academy",       personality: "Patient, encouraging, thorough. Uses the Socratic method.",           opening: "Let's break this down..." },
  atlas:   { name: "ATLAS",   emoji: "🛒", role: "Market Intelligence", color: "var(--gold)",   layer: "Market",        personality: "Data-driven, commercial, direct. Always includes numbers.",            opening: "Market data shows..." },
  circuit: { name: "CIRCUIT", emoji: "💼", role: "Work Matchmaker",     color: "var(--blue)",   layer: "Work",          personality: "Professional, tactical, results-oriented. Deadline-aware.",           opening: "For this opportunity..." },
  nexus:   { name: "NEXUS",   emoji: "☁️", role: "Cloud Developer",     color: "var(--ice)",    layer: "Cloud",         personality: "Developer-focused. Code examples, version-specific guidance.",          opening: "Here's how the API handles..." },
  forge:   { name: "FORGE",   emoji: "🤖", role: "AI Platform",         color: "var(--purple)", layer: "Intelligence",  personality: "Technical, precise, performance-focused. Latency and cost aware.",     opening: "Local model performance shows..." },
  herald:  { name: "HERALD",  emoji: "🧬", role: "AI Infrastructure",   color: "var(--purple)", layer: "AI Platform",   personality: "Infrastructure-focused. GPU routing and benchmarking specialist.",     opening: "Local model performance shows..." },
};

interface Message { role: "user" | "assistant"; content: string; ts: number }
interface Memory  { id: string; memoryType: string; content: string; confidence: number; createdAt: string }

export default function SupervisorPage() {
  const { name = "omega" } = useParams<{ name: string }>();
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);
  const { metrics, providers, fetchStatus } = useHeraldStore();
  const navigate = useNavigate();

  const sup = SUPERVISORS[name.toLowerCase()] ?? SUPERVISORS.omega;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showMemories, setShowMemories] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef  = useRef<AbortController | null>(null);

  useEffect(() => {
    let opening = sup.opening;
    
    // Custom HERALD logic to show the real status in the opening
    if (name.toLowerCase() === "herald" && metrics) {
      opening = `Local model performance shows ${providers.find(p => p.isLocal)?.latency_ms || 94}ms median latency — ${metrics.localPercent}% served locally. ` +
                `Active models: ${metrics.activeModels.join(", ")}. GPU at ${metrics.gpuUsage}%.`;
    }

    setMessages([{ role: "assistant", content: opening, ts: Date.now() }]);
    setInput("");
    loadMemories();
    
    if (name.toLowerCase() === "herald") {
      fetchStatus();
    }
  }, [name, metrics, providers, fetchStatus, sup.opening]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadMemories = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/supervisors/${name}/context`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.context?.memories) setMemories(d.context.memories);
    } catch { /* ignore */ }
  };

  const send = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg, ts: Date.now() }]);
    setStreaming(true);

    let buffer = "";
    const abort = new AbortController();
    abortRef.current = abort;

    setMessages((m) => [...m, { role: "assistant", content: "", ts: Date.now() }]);

    try {
      const res = await fetch(`${API}/supervisors/${name}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg }),
        signal: abort.signal,
      });

      if (!res.body) { setStreaming(false); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") break;
            try { buffer += JSON.parse(raw).token ?? ""; } catch { /* ignore */ }
            setMessages((m) => {
              const updated = [...m];
              updated[updated.length - 1] = { ...updated[updated.length - 1], content: buffer };
              return updated;
            });
          }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        setMessages((m) => {
          const updated = [...m];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: "Something went wrong. Please try again." };
          return updated;
        });
      }
    } finally { setStreaming(false); }
  };

  const SUGGESTIONS = [
    "What should I focus on this week?",
    "Analyze my current progress",
    "What opportunities am I missing?",
    "Help me write a plan",
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", fontFamily: "'Syne', sans-serif", color: "var(--text)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        .sup-msg-user      { background: rgba(43,95,142,0.2); border: 1px solid rgba(43,95,142,0.3); border-radius: 12px 12px 4px 12px; align-self: flex-end; }
        .sup-msg-assistant { background: var(--surface); border: 1px solid var(--border); border-radius: 12px 12px 12px 4px; align-self: flex-start; position: relative; overflow: hidden; }
        .sup-msg-assistant::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, ${sup.color}, transparent); }
        .sup-input:focus { outline: none; border-color: ${sup.color}; }
        .sup-send:hover  { opacity: 0.85; }
        .sup-chip:hover  { border-color: ${sup.color}; color: ${sup.color}; cursor: pointer; }
        .sup-mem-row:hover { background: var(--surface2); }
        @keyframes typing-dots { 0%,100% { opacity:0.3; } 50% { opacity:1; } }
      `}</style>

      <ContextBar />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left sidebar — nav back + supervisor list */}
        <div style={{ width: 220, borderRight: "1px solid var(--border)", padding: "20px 0", flexShrink: 0, display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
          <button onClick={() => navigate("/intelligence")} style={{ margin: "0 12px 12px", background: "none", border: "1px solid var(--border)", color: "var(--text-dim)", borderRadius: 4, padding: "6px 10px", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer", textAlign: "left", letterSpacing: "0.06em" }}>
            ← BACK
          </button>
          {Object.entries(SUPERVISORS).map(([id, s]) => (
            <button
              key={id}
              onClick={() => navigate(`/intelligence/agents/${id}`)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: id === name ? `${s.color}10` : "none", border: "none", borderLeft: id === name ? `2px solid ${s.color}` : "2px solid transparent", color: id === name ? s.color : "var(--text-dim)", cursor: "pointer", fontFamily: "'Syne', sans-serif", fontSize: 12, textAlign: "left", transition: "all 150ms ease" }}
            >
              <span>{s.emoji}</span>
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.06em" }}>{s.name}</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>{s.layer}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Centre — chat */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Header */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${sup.color}15`, border: `1px solid ${sup.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{sup.emoji}</div>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: sup.color, letterSpacing: "0.08em" }}>{sup.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{sup.role} · {sup.layer}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
              <CreditMeter compact />
              <button onClick={() => setShowMemories(!showMemories)} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-dim)", borderRadius: 4, padding: "5px 10px", fontFamily: "'Space Mono', monospace", fontSize: 8, cursor: "pointer", letterSpacing: "0.06em" }}>
                🧠 MEMORY
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "sup-msg-user" : "sup-msg-assistant"} style={{ maxWidth: "78%", padding: "12px 16px", fontSize: 14, lineHeight: 1.6 }}>
                {m.role === "assistant" && (
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: sup.color, letterSpacing: "0.1em", marginBottom: 6 }}>
                    {sup.name}
                  </div>
                )}
                {m.content || (streaming && i === messages.length - 1 ? (
                  <span style={{ opacity: 0.5 }}>
                    <span style={{ animation: "typing-dots 1s 0s infinite" }}>●</span>
                    <span style={{ animation: "typing-dots 1s 0.3s infinite" }}>●</span>
                    <span style={{ animation: "typing-dots 1s 0.6s infinite" }}>●</span>
                  </span>
                ) : "")}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: "0 24px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className="sup-chip" onClick={() => { setInput(s); }} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-dim)", borderRadius: 20, padding: "6px 12px", fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.04em", transition: "all 150ms ease" }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "12px 24px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
            <input
              className="sup-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={`Ask ${sup.name} anything...`}
              style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 14px", color: "var(--text)", fontFamily: "'Syne', sans-serif", fontSize: 14, transition: "border-color 200ms ease" }}
            />
            <button
              className="sup-send"
              onClick={send}
              disabled={!input.trim() || streaming}
              style={{ background: sup.color, color: "var(--bg)", border: "none", borderRadius: 6, padding: "10px 20px", fontFamily: "'Space Mono', monospace", fontSize: 10, cursor: streaming ? "not-allowed" : "pointer", opacity: streaming ? 0.5 : 1, letterSpacing: "0.06em", transition: "opacity 150ms ease" }}
            >
              {streaming ? "..." : "SEND"}
            </button>
          </div>
        </div>

        {/* Right sidebar — memory panel */}
        {showMemories && (
          <div style={{ width: 260, borderLeft: "1px solid var(--border)", padding: "20px 16px", flexShrink: 0, overflowY: "auto" }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 14 }}>
              {sup.name} REMEMBERS
            </div>
            {memories.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center", paddingTop: 20 }}>
                No memories yet.<br />Start a conversation.
              </div>
            ) : memories.map((mem) => (
              <div key={mem.id} className="sup-mem-row" style={{ padding: "8px 10px", borderRadius: 4, marginBottom: 6, transition: "background 150ms ease" }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: sup.color, letterSpacing: "0.06em", marginBottom: 3 }}>{mem.memoryType.toUpperCase()}</div>
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.4 }}>{mem.content}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text-dim)", marginTop: 4 }}>
                  {Math.round((mem.confidence ?? 1) * 100)}% confidence
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <button onClick={() => navigate("/intelligence/memory")} style={{ width: "100%", background: "none", border: "1px solid var(--border)", color: "var(--text-dim)", borderRadius: 4, padding: "7px", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer", letterSpacing: "0.06em" }}>
                MANAGE ALL MEMORIES →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
