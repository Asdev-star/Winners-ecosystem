import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";

type ForgeTask = {
  id: string;
  label: string;
  eta: string;
  detail: string;
};

type ForgeAlert = {
  id: string;
  tone: "critical" | "attention" | "positive";
  layer: string;
  title: string;
  detail: string;
};

type ForgeSnapshot = {
  generatedAt: string;
  supervisor: string;
  description: string;
  opener: string;
  vitals: {
    layersLive: number;
    totalLayers: number;
    activeLoops: number;
    trustAvg: number;
    mrr: number;
    systemLabel: string;
    systemTone: "ok" | "attention";
  };
  tasks: ForgeTask[];
  alerts: ForgeAlert[];
  quickCommands: string[];
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
  streaming?: boolean;
};

const DEFAULT_COMMANDS = [
  "Which layer needs most attention",
  "Show me everything blocking Market activation",
  "Generate tenant health report",
  "Which tenant is most at risk of churning?",
  "Generate a status report for this week",
  "Who are my top 10 most valuable users?",
  "What would double MRR in 90 days?",
  "Run a health check on all platform services",
  "Which users have completed the most agentic loops?",
  "Write a broadcast message for all PRO users",
];

const css = `
  .forge-page{
    max-width:1400px;
    margin:0 auto;
    padding:28px 22px 92px;
    color:var(--text);
    font-family:'Syne',sans-serif;
  }
  .forge-shell{
    border:1px solid rgba(201,168,76,.18);
    border-radius:30px;
    overflow:hidden;
    background:
      radial-gradient(circle at top right, rgba(201,168,76,.12), transparent 32%),
      radial-gradient(circle at bottom left, rgba(137,196,225,.08), transparent 28%),
      linear-gradient(180deg, rgba(8,14,23,.98), rgba(12,20,31,.97));
    box-shadow:0 30px 90px rgba(0,0,0,.34);
  }
  .forge-top{
    display:flex;
    justify-content:space-between;
    gap:16px;
    align-items:flex-start;
    padding:20px 24px 22px;
    border-bottom:1px solid rgba(201,168,76,.12);
    background:rgba(6,12,20,.78);
  }
  .forge-kicker{
    font-family:'Space Mono',monospace;
    font-size:10px;
    letter-spacing:.18em;
    text-transform:uppercase;
    color:var(--gold);
  }
  .forge-title{
    margin:10px 0 0;
    font-size:clamp(28px,4vw,42px);
    letter-spacing:-.05em;
    line-height:.98;
  }
  .forge-subtitle{
    margin:12px 0 0;
    max-width:760px;
    font-size:14px;
    line-height:1.65;
    color:var(--text-dim);
  }
  .forge-top-actions{
    display:flex;
    gap:10px;
    flex-wrap:wrap;
  }
  .forge-link{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    min-height:42px;
    padding:0 16px;
    border-radius:999px;
    border:1px solid rgba(201,168,76,.22);
    background:rgba(201,168,76,.08);
    color:var(--gold);
    font-family:'Space Mono',monospace;
    font-size:11px;
    letter-spacing:.08em;
    text-transform:uppercase;
    text-decoration:none;
  }
  .forge-link.ghost{
    border-color:var(--border);
    background:rgba(255,255,255,.03);
    color:var(--text-dim);
  }
  .forge-grid{
    display:grid;
    grid-template-columns:minmax(340px,390px) minmax(0,1fr);
    gap:22px;
    padding:24px;
  }
  .forge-sidebar{
    position:sticky;
    top:92px;
    align-self:start;
    display:grid;
    gap:14px;
  }
  .forge-card,
  .forge-chat{
    border:1px solid rgba(255,255,255,.08);
    border-radius:24px;
    background:linear-gradient(180deg, rgba(18,28,40,.9), rgba(10,17,27,.92));
  }
  .forge-card{
    padding:18px;
  }
  .forge-supervisor-top{
    display:flex;
    justify-content:space-between;
    gap:12px;
    align-items:flex-start;
  }
  .forge-mark{
    width:52px;
    height:52px;
    border-radius:18px;
    display:grid;
    place-items:center;
    border:1px solid rgba(201,168,76,.26);
    background:linear-gradient(180deg, rgba(201,168,76,.22), rgba(201,168,76,.06));
    color:var(--gold);
    font-weight:800;
    letter-spacing:.16em;
  }
  .forge-label{
    margin-top:6px;
    color:var(--text-dim);
    font-size:13px;
    line-height:1.6;
  }
  .forge-mini-title{
    margin:0 0 14px;
    font-family:'Space Mono',monospace;
    font-size:11px;
    letter-spacing:.14em;
    text-transform:uppercase;
    color:var(--gold);
  }
  .forge-vitals{
    display:grid;
    gap:10px;
  }
  .forge-vital{
    display:flex;
    justify-content:space-between;
    gap:14px;
    padding:12px 0;
    border-bottom:1px solid rgba(255,255,255,.06);
  }
  .forge-vital:last-child{
    border-bottom:none;
    padding-bottom:0;
  }
  .forge-vital-key{
    color:var(--text-dim);
    font-size:12px;
    text-transform:uppercase;
    letter-spacing:.08em;
  }
  .forge-vital-value{
    font-family:'Space Mono',monospace;
    font-size:13px;
    color:var(--text);
    text-align:right;
  }
  .forge-system{
    display:inline-flex;
    align-items:center;
    gap:8px;
  }
  .forge-dot{
    width:10px;
    height:10px;
    border-radius:999px;
    background:var(--green);
    box-shadow:0 0 14px rgba(45,212,160,.34);
  }
  .forge-dot.attention{
    background:var(--gold);
    box-shadow:0 0 14px rgba(201,168,76,.34);
  }
  .forge-list{
    display:grid;
    gap:10px;
  }
  .forge-item{
    padding:14px 14px 12px;
    border-radius:18px;
    border:1px solid rgba(255,255,255,.07);
    background:rgba(255,255,255,.03);
  }
  .forge-item-top{
    display:flex;
    justify-content:space-between;
    gap:12px;
    align-items:flex-start;
  }
  .forge-item-title{
    font-weight:700;
    font-size:15px;
    color:var(--text);
  }
  .forge-item-sub{
    margin-top:6px;
    color:var(--text-dim);
    font-size:13px;
    line-height:1.55;
  }
  .forge-badge{
    flex-shrink:0;
    display:inline-flex;
    align-items:center;
    padding:6px 10px;
    border-radius:999px;
    border:1px solid rgba(201,168,76,.18);
    background:rgba(201,168,76,.08);
    color:var(--gold);
    font-family:'Space Mono',monospace;
    font-size:10px;
    letter-spacing:.08em;
    text-transform:uppercase;
  }
  .forge-alert{
    position:relative;
    padding-left:16px;
  }
  .forge-alert::before{
    content:"";
    position:absolute;
    left:0;
    top:17px;
    width:8px;
    height:8px;
    border-radius:999px;
    background:var(--green);
  }
  .forge-alert.critical::before{
    background:var(--red);
    box-shadow:0 0 12px rgba(224,90,78,.35);
  }
  .forge-alert.attention::before{
    background:var(--gold);
    box-shadow:0 0 12px rgba(201,168,76,.35);
  }
  .forge-alert.positive::before{
    background:var(--green);
    box-shadow:0 0 12px rgba(45,212,160,.35);
  }
  .forge-command-list{
    display:grid;
    gap:10px;
  }
  .forge-command{
    width:100%;
    text-align:left;
    padding:12px 14px;
    border-radius:16px;
    border:1px solid rgba(201,168,76,.14);
    background:rgba(201,168,76,.06);
    color:var(--text);
    cursor:pointer;
    transition:border-color .18s ease, transform .18s ease, background .18s ease;
  }
  .forge-command:hover{
    border-color:rgba(201,168,76,.26);
    background:rgba(201,168,76,.1);
    transform:translateY(-1px);
  }
  .forge-chat{
    min-height:780px;
    display:grid;
    grid-template-rows:auto minmax(0,1fr) auto auto;
    overflow:hidden;
  }
  .forge-chat-head{
    display:flex;
    justify-content:space-between;
    gap:14px;
    align-items:flex-start;
    padding:18px 20px;
    border-bottom:1px solid rgba(255,255,255,.06);
    background:rgba(255,255,255,.02);
  }
  .forge-chat-title{
    margin:0;
    font-size:18px;
    font-weight:800;
  }
  .forge-chat-sub{
    margin-top:6px;
    color:var(--text-dim);
    font-size:13px;
  }
  .forge-chat-meta{
    color:var(--text-dim);
    font-family:'Space Mono',monospace;
    font-size:10px;
    letter-spacing:.08em;
    text-transform:uppercase;
    text-align:right;
  }
  .forge-error{
    margin:14px 18px 0;
    padding:12px 14px;
    border-radius:16px;
    border:1px solid rgba(224,90,78,.24);
    background:rgba(224,90,78,.08);
    color:#ffcbc5;
    font-size:13px;
  }
  .forge-messages{
    overflow:auto;
    padding:18px;
    display:grid;
    gap:14px;
  }
  .forge-message{
    max-width:min(86%,780px);
    padding:16px 18px;
    border-radius:22px;
    border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.03);
    color:var(--text);
  }
  .forge-message.user{
    margin-left:auto;
    border-color:rgba(201,168,76,.2);
    background:linear-gradient(135deg, rgba(201,168,76,.16), rgba(201,168,76,.06));
  }
  .forge-message.assistant{
    margin-right:auto;
    background:linear-gradient(180deg, rgba(17,27,39,.96), rgba(11,18,28,.92));
  }
  .forge-message-top{
    display:flex;
    justify-content:space-between;
    gap:10px;
    align-items:center;
    margin-bottom:10px;
    font-family:'Space Mono',monospace;
    font-size:10px;
    letter-spacing:.08em;
    text-transform:uppercase;
    color:var(--text-dim);
  }
  .forge-message-copy{
    white-space:pre-wrap;
    line-height:1.72;
    font-size:15px;
    color:var(--text);
  }
  .forge-cursor{
    display:inline-block;
    width:8px;
    height:1.05em;
    margin-left:4px;
    border-radius:2px;
    background:var(--gold);
    vertical-align:-.12em;
    animation:forge-blink 1s steps(1) infinite;
  }
  .forge-chip-row{
    display:flex;
    gap:10px;
    flex-wrap:wrap;
    padding:0 18px 18px;
  }
  .forge-chip{
    border:none;
    border-radius:999px;
    padding:10px 14px;
    background:rgba(201,168,76,.1);
    color:var(--gold);
    font-family:'Space Mono',monospace;
    font-size:11px;
    letter-spacing:.05em;
    cursor:pointer;
  }
  .forge-chip:hover{
    background:rgba(201,168,76,.16);
  }
  .forge-form{
    padding:0 18px 18px;
  }
  .forge-input-shell{
    display:grid;
    grid-template-columns:auto minmax(0,1fr) auto;
    gap:10px;
    align-items:end;
    padding:12px;
    border-radius:24px;
    border:1px solid rgba(201,168,76,.16);
    background:rgba(7,13,21,.9);
  }
  .forge-icon-btn,
  .forge-send{
    min-width:46px;
    height:46px;
    border:none;
    border-radius:16px;
    cursor:pointer;
    font-family:'Space Mono',monospace;
    font-size:11px;
    letter-spacing:.08em;
    text-transform:uppercase;
  }
  .forge-icon-btn{
    background:rgba(255,255,255,.05);
    color:var(--text-dim);
  }
  .forge-send{
    background:linear-gradient(135deg, rgba(201,168,76,.9), rgba(168,121,36,.92));
    color:#1b1405;
    font-weight:800;
  }
  .forge-send:disabled,
  .forge-icon-btn:disabled{
    opacity:.55;
    cursor:not-allowed;
  }
  .forge-input{
    min-height:46px;
    max-height:180px;
    border:none;
    outline:none;
    resize:none;
    background:transparent;
    color:var(--text);
    font:inherit;
    line-height:1.6;
  }
  .forge-input::placeholder{
    color:var(--text-dim);
  }
  .forge-note{
    margin-top:8px;
    color:var(--text-dim);
    font-size:12px;
  }
  .forge-load{
    display:grid;
    gap:16px;
  }
  .forge-skel{
    min-height:160px;
    border-radius:24px;
    border:1px solid rgba(255,255,255,.08);
    background:linear-gradient(90deg, rgba(255,255,255,.04), rgba(255,255,255,.08), rgba(255,255,255,.04));
    background-size:180% 100%;
    animation:forge-shimmer 1.4s linear infinite;
  }
  @keyframes forge-shimmer{
    0%{background-position:100% 0}
    100%{background-position:-100% 0}
  }
  @keyframes forge-blink{
    0%,49%{opacity:1}
    50%,100%{opacity:0}
  }
  @media (max-width:1120px){
    .forge-grid{
      grid-template-columns:1fr;
    }
    .forge-sidebar{
      position:static;
    }
    .forge-chat{
      min-height:680px;
    }
  }
  @media (max-width:720px){
    .forge-page{
      padding:18px 12px 84px;
    }
    .forge-top,
    .forge-grid{
      padding:16px;
    }
    .forge-top{
      flex-direction:column;
    }
    .forge-chat{
      min-height:620px;
      grid-template-rows:auto minmax(0,1fr) auto auto;
    }
    .forge-message{
      max-width:100%;
    }
    .forge-input-shell{
      grid-template-columns:1fr;
    }
    .forge-icon-btn,
    .forge-send{
      width:100%;
    }
  }
`;

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absMs < 60_000) return formatter.format(Math.round(diffMs / 1000), "second");
  if (absMs < 3_600_000) return formatter.format(Math.round(diffMs / 60_000), "minute");
  if (absMs < 86_400_000) return formatter.format(Math.round(diffMs / 3_600_000), "hour");
  return formatter.format(Math.round(diffMs / 86_400_000), "day");
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `forge-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function streamForgeTokens(response: Response, onToken: (token: string) => void) {
  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6);
        if (raw.trim() === "[DONE]") return;

        try {
          const parsed = JSON.parse(raw) as { token?: string; content?: string };
          const token = parsed.token ?? parsed.content ?? "";
          if (token) onToken(token);
        } catch {
          if (raw.trim()) onToken(raw);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export default function AdminForgePage() {
  const [snapshot, setSnapshot] = useState<ForgeSnapshot | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const seededRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const chipCommands = useMemo(
    () => (snapshot?.quickCommands.length ? snapshot.quickCommands : DEFAULT_COMMANDS).slice(0, 3),
    [snapshot]
  );

  const commandDeck = useMemo(
    () => (snapshot?.quickCommands.length ? snapshot.quickCommands : DEFAULT_COMMANDS),
    [snapshot]
  );

  useEffect(() => {
    let alive = true;

    async function loadPanel(initial = false) {
      try {
        if (initial) setLoading(true);
        const res = await fetch(`${API_BASE}/admin/forge/panel`, {
          headers: getAuthHeaders(),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? "Failed to load FORGE panel");
        }

        if (!alive) return;

        const nextSnapshot = body as ForgeSnapshot;
        setSnapshot(nextSnapshot);
        setError("");

        if (!seededRef.current) {
          seededRef.current = true;
          setMessages((current) =>
            current.length
              ? current
              : [
                  {
                    id: makeId(),
                    role: "assistant",
                    content: nextSnapshot.opener,
                    createdAt: nextSnapshot.generatedAt,
                  },
                ]
          );
        }
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Failed to load FORGE panel");
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadPanel(true);
    const intervalId = window.setInterval(() => {
      void loadPanel(false);
    }, 30_000);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const node = messagesRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, sending]);

  useEffect(() => {
    if (!note) return;
    const timeoutId = window.setTimeout(() => setNote(""), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [note]);

  async function sendPrompt(rawPrompt: string) {
    const prompt = rawPrompt.trim();
    if (!prompt || sending) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: prompt,
      createdAt: new Date().toISOString(),
    };

    const assistantMessageId = makeId();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      streaming: true,
    };

    const history = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
    setError("");
    setSending(true);

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/admin/forge/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          message: prompt,
          history,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? `FORGE chat failed (${res.status})`);
      }

      let content = "";
      await streamForgeTokens(res, (token) => {
        content += token;
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessageId ? { ...message, content, streaming: true } : message
          )
        );
      });

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: content || "FORGE did not return any response content.",
                streaming: false,
              }
            : message
        )
      );
    } catch (err) {
      if (controller.signal.aborted) return;

      const message = err instanceof Error ? err.message : "FORGE could not complete the response.";
      setError(message);
      setMessages((current) =>
        current.map((entry) =>
          entry.id === assistantMessageId
            ? {
                ...entry,
                content: `FORGE could not complete the response. ${message}`,
                streaming: false,
              }
            : entry
        )
      );
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendPrompt(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendPrompt(input);
    }
  }

  if (loading && !snapshot) {
    return (
      <div className="forge-page">
        <style>{css}</style>
        <div className="forge-load">
          <div className="forge-skel" />
          <div className="forge-skel" />
          <div className="forge-skel" />
        </div>
      </div>
    );
  }

  return (
    <div className="forge-page">
      <style>{css}</style>

      <div className="forge-shell">
        <div className="forge-top">
          <div>
            <div className="forge-kicker">Admin / Forge Intelligence / Route: /admin/forge</div>
            <h1 className="forge-title">FORGE INTELLIGENCE</h1>
            <p className="forge-subtitle">
              {snapshot?.description ??
                "FORGE briefs you as sovereign operator. It sees what OMEGA sees, then compresses it into the next directive that matters."}
            </p>
          </div>

          <div className="forge-top-actions">
            <Link className="forge-link ghost" to="/admin/overview">
              Admin Overview
            </Link>
            <Link className="forge-link" to="/admin/health">
              System Health
            </Link>
          </div>
        </div>

        <div className="forge-grid">
          <aside className="forge-sidebar">
            <section className="forge-card">
              <div className="forge-supervisor-top">
                <div style={{ display: "flex", gap: 14 }}>
                  <div className="forge-mark">FRG</div>
                  <div>
                    <div className="forge-kicker">FORGE</div>
                    <h2 style={{ margin: "4px 0 0", fontSize: 22 }}>AI Platform Supervisor</h2>
                    <div className="forge-label">Core Engine Intelligence</div>
                  </div>
                </div>
                <span className="forge-badge">Admin Only</span>
              </div>
            </section>

            <section className="forge-card">
              <h2 className="forge-mini-title">Ecosystem Vitals</h2>
              <div className="forge-vitals">
                <div className="forge-vital">
                  <span className="forge-vital-key">Layers Live</span>
                  <span className="forge-vital-value">
                    {snapshot?.vitals.layersLive ?? 0} / {snapshot?.vitals.totalLayers ?? 0}
                  </span>
                </div>
                <div className="forge-vital">
                  <span className="forge-vital-key">Active Loops</span>
                  <span className="forge-vital-value">{snapshot?.vitals.activeLoops ?? 0}</span>
                </div>
                <div className="forge-vital">
                  <span className="forge-vital-key">Trust Avg</span>
                  <span className="forge-vital-value">{snapshot?.vitals.trustAvg ?? 0}</span>
                </div>
                <div className="forge-vital">
                  <span className="forge-vital-key">MRR</span>
                  <span className="forge-vital-value">{formatMoney(snapshot?.vitals.mrr ?? 0)}</span>
                </div>
                <div className="forge-vital">
                  <span className="forge-vital-key">System</span>
                  <span className="forge-vital-value forge-system">
                    <span className={`forge-dot ${snapshot?.vitals.systemTone === "attention" ? "attention" : ""}`} />
                    {snapshot?.vitals.systemLabel ?? "Loading"}
                  </span>
                </div>
              </div>
            </section>

            <section className="forge-card">
              <h2 className="forge-mini-title">Forge Daily Admin Tasks</h2>
              <div className="forge-list">
                {(snapshot?.tasks ?? []).map((task) => (
                  <div key={task.id} className="forge-item">
                    <div className="forge-item-top">
                      <div className="forge-item-title">{task.label}</div>
                      <span className="forge-badge">{task.eta}</span>
                    </div>
                    <div className="forge-item-sub">{task.detail}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="forge-card">
              <h2 className="forge-mini-title">Forge Proactive Alerts</h2>
              <div className="forge-list">
                {(snapshot?.alerts ?? []).map((alert) => (
                  <div key={alert.id} className={`forge-item forge-alert ${alert.tone}`}>
                    <div className="forge-item-top">
                      <div className="forge-item-title">
                        {alert.layer}: {alert.title}
                      </div>
                    </div>
                    <div className="forge-item-sub">{alert.detail}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="forge-card">
              <h2 className="forge-mini-title">Quick Command Library</h2>
              <div className="forge-command-list">
                {commandDeck.map((command) => (
                  <button
                    key={command}
                    type="button"
                    className="forge-command"
                    onClick={() => {
                      void sendPrompt(command);
                    }}
                    disabled={sending}
                  >
                    {command}
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="forge-chat">
            <div className="forge-chat-head">
              <div>
                <h2 className="forge-chat-title">FORGE streaming response{sending ? " " : ""}{sending ? <span className="forge-cursor" /> : null}</h2>
                <div className="forge-chat-sub">Strategic operator chat with live ecosystem context injection.</div>
              </div>
              <div className="forge-chat-meta">
                <div>Supervisor: {snapshot?.supervisor ?? "FORGE"}</div>
                <div>Updated {snapshot ? formatRelativeTime(snapshot.generatedAt) : "now"}</div>
              </div>
            </div>

            {error ? <div className="forge-error">{error}</div> : null}

            <div ref={messagesRef} className="forge-messages">
              {messages.map((message) => (
                <article key={message.id} className={`forge-message ${message.role}`}>
                  <div className="forge-message-top">
                    <span>{message.role === "assistant" ? "FORGE" : "Operator"}</span>
                    <span>{formatRelativeTime(message.createdAt)}</span>
                  </div>
                  <div className="forge-message-copy">
                    {message.content}
                    {message.streaming ? <span className="forge-cursor" /> : null}
                  </div>
                </article>
              ))}
            </div>

            <div className="forge-chip-row">
              {chipCommands.map((command) => (
                <button
                  key={command}
                  type="button"
                  className="forge-chip"
                  onClick={() => {
                    void sendPrompt(command);
                  }}
                  disabled={sending}
                >
                  {command}
                </button>
              ))}
            </div>

            <form className="forge-form" onSubmit={handleSubmit}>
              <div className="forge-input-shell">
                <button
                  type="button"
                  className="forge-icon-btn"
                  onClick={() => setNote("Attachment routing is reserved for the next FORGE iteration.")}
                  disabled={sending}
                >
                  Attach
                </button>

                <textarea
                  className="forge-input"
                  placeholder="Request a FORGE brief..."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={sending}
                />

                <button type="submit" className="forge-send" disabled={sending || !input.trim()}>
                  Send
                </button>
              </div>
              <div className="forge-note">
                {note || "FORGE always briefs you on the single most important operator move right now."}
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
