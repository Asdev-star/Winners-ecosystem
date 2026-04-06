import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useAuthStore } from "../../features/auth/authStore";
import { API_BASE } from "../../lib/api";
import FollowUpChips from "./FollowUpChips";
import VoiceInput from "./VoiceInput";

type AssistantKey = "aria" | "nova" | "sage" | "atlas" | "circuit" | "forge" | "nexus" | "herald" | "omega";

interface AssistantPanelProps {
  assistant: AssistantKey;
  context?: Record<string, unknown>;
  page?: string;
  userId?: string;
  initialMessage?: string;
}

interface PanelMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface AssistantConfig {
  emoji: string;
  name: string;
  tagline: string;
  color: string;
  accent: string;
}

const CONFIG: Record<AssistantKey, AssistantConfig> = {
  aria: { emoji: "⬡", name: "ARIA", tagline: "Core Engine Supervisor", color: "var(--gold)", accent: "var(--gold)" },
  nova: { emoji: "👥", name: "NOVA", tagline: "Community Intelligence", color: "var(--ice)", accent: "var(--ice)" },
  sage: { emoji: "🎓", name: "SAGE", tagline: "Academy Tutor", color: "var(--green)", accent: "var(--green)" },
  atlas: { emoji: "🛒", name: "ATLAS", tagline: "Market Analyst", color: "var(--purple)", accent: "var(--purple)" },
  circuit: { emoji: "💼", name: "CIRCUIT", tagline: "Work Matchmaker", color: "var(--blue)", accent: "var(--blue)" },
  forge: { emoji: "🤖", name: "FORGE", tagline: "Intelligence Optimizer", color: "var(--purple)", accent: "var(--purple)" },
  nexus: { emoji: "☁️", name: "NEXUS", tagline: "Cloud Developer", color: "var(--ice)", accent: "var(--ice)" },
  herald: { emoji: "🧬", name: "HERALD", tagline: "AI Platform Manager", color: "var(--purple)", accent: "var(--purple)" },
  omega: { emoji: "🧠", name: "OMEGA", tagline: "Master Orchestrator", color: "var(--gold)", accent: "var(--gold)" },
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function sanitizeContext(context?: Record<string, unknown>, page?: string, userId?: string) {
  return {
    ...(context ?? {}),
    page: page ?? "community",
    userId: userId ?? null,
  };
}

function parseSseEvent(block: string) {
  const data = block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("\n");

  if (!data) return null;
  if (data === "[DONE]") return { done: true as const };
  try {
    return { payload: JSON.parse(data) as { token?: string; text?: string; done?: boolean } };
  } catch {
    return { payload: { text: data } };
  }
}

export default function AssistantPanel({ assistant, context, page, userId, initialMessage }: AssistantPanelProps) {
  const { token } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<PanelMessage[]>([]);
  const [input, setInput] = useState(initialMessage ?? "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasProactiveMessage, setHasProactiveMessage] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const config = CONFIG[assistant];
  const requestContext = useMemo(() => sanitizeContext(context, page, userId), [context, page, userId]);

  const fetchSuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(`${API_BASE}/supervisors/${assistant}/suggest`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestContext),
      });
      const data = (await response.json().catch(() => ({}))) as { suggestions?: string[]; message?: string };
      if (response.ok && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
        setHasProactiveMessage(data.suggestions.length > 0);
        return;
      }
      setSuggestions([]);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [assistant, requestContext, token]);

  useEffect(() => {
    void fetchSuggestions();
  }, [fetchSuggestions]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setHasProactiveMessage(false);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed || isStreaming) return;

    setError("");
    setIsStreaming(true);

    const userMessage: PanelMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
    };
    const assistantId = `${Date.now()}-assistant`;
    let assistantText = "";

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setInput("");

    try {
      const history = messages.slice(-8).map((item) => ({
        role: item.role,
        content: item.content,
      }));

      const response = await fetch(`${API_BASE}/supervisors/${assistant}/chat`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: trimmed,
          context: requestContext,
          history,
          provider: "claude",
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Assistant request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const parsed = parseSseEvent(chunk);
          if (!parsed) continue;
          if ("done" in parsed) {
            continue;
          }
          const tokenChunk = parsed.payload.token ?? parsed.payload.text ?? "";
          if (!tokenChunk) continue;
          assistantText += tokenChunk;
          setMessages((prev) =>
            prev.map((item) =>
              item.id === assistantId
                ? { ...item, content: assistantText, streaming: true }
                : item,
            ),
          );
        }
      }

      if (!assistantText.trim()) {
        assistantText = `I’m ${config.name}. What would you like to explore next?`;
      }

      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantId
            ? { ...item, content: assistantText, streaming: false }
            : item,
        ),
      );
      await fetchSuggestions();
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Assistant request failed."));
      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content: `I hit a snag. Please try again.`,
                streaming: false,
              }
            : item,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }, [assistant, config.name, fetchSuggestions, isStreaming, messages, requestContext, token]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const onChipClick = async (chip: string) => {
    setInput(chip);
    await sendMessage(chip);
  };

  return (
    <>
      <button
        type="button"
        className="assistant-panel-fab"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={`Open ${config.name} assistant`}
        aria-expanded={isOpen}
      >
        <span className="assistant-panel-fab-label">{config.emoji}</span>
        {hasProactiveMessage && <span className="assistant-panel-fab-pulse" />}
      </button>

      {isOpen && (
        <div className="assistant-panel-shell" role="dialog" aria-label={`${config.name} assistant panel`}>
          <div className="assistant-panel-header">
            <div className="assistant-panel-avatar" style={{ background: config.accent }}>
              {config.emoji}
            </div>
            <div className="assistant-panel-meta">
              <div className="assistant-panel-name">{config.name}</div>
              <div className="assistant-panel-tagline">{config.tagline}</div>
            </div>
            <button type="button" className="assistant-panel-close" onClick={() => setIsOpen(false)} aria-label="Close assistant panel">
              ×
            </button>
          </div>

          <div className="assistant-panel-body">
            <div className="assistant-panel-intro">
              <span className="assistant-panel-intro-label">Live Context</span>
              <span className="assistant-panel-intro-text">
                {isLoadingSuggestions ? "Loading suggestions..." : suggestions.length > 0 ? "Follow-up chips ready" : "Ask me anything"}
              </span>
            </div>

            <div className="assistant-panel-messages">
              {messages.length === 0 ? (
                <div className="assistant-panel-empty">
                  <div className="assistant-panel-empty-title">Ready when you are</div>
                  <div className="assistant-panel-empty-text">
                    {config.name} can summarize this page, suggest next steps, or generate a focused follow-up.
                  </div>
                </div>
              ) : null}

              {messages.map((message) => (
                <div key={message.id} className={`assistant-panel-message ${message.role}`}>
                  <div className="assistant-panel-bubble">
                    {message.content}
                    {message.streaming ? <span className="assistant-panel-cursor">▋</span> : null}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {suggestions.length > 0 && !isStreaming && (
              <div className="assistant-panel-chips">
                <FollowUpChips chips={suggestions} onChipClick={onChipClick} accentColor="var(--gold)" disabled={isStreaming} />
              </div>
            )}

            {error && <div className="assistant-panel-error">{error}</div>}
          </div>

          <form className="assistant-panel-input" onSubmit={onSubmit}>
            <VoiceInput onTranscription={(text) => setInput((current) => (current ? `${current} ${text}` : text))} disabled={isStreaming} />
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${config.name}...`}
              rows={1}
              disabled={isStreaming}
            />
            <button type="submit" disabled={!input.trim() || isStreaming}>
              {isStreaming ? "…" : "➤"}
            </button>
          </form>

          <style>{`
            .assistant-panel-fab {
              position: fixed;
              right: 28px;
              bottom: 28px;
              width: 52px;
              height: 52px;
              border-radius: 50%;
              border: 1px solid rgba(155,111,255,0.4);
              background: var(--purple);
              color: var(--bg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 14px 42px rgba(0,0,0,0.38);
              cursor: pointer;
              z-index: 120;
              transition: transform 180ms ease, box-shadow 180ms ease;
            }
            .assistant-panel-fab:hover {
              transform: translateY(-1px) scale(1.03);
              box-shadow: 0 18px 54px rgba(0,0,0,0.45);
            }
            .assistant-panel-fab-label {
              font-size: 20px;
              line-height: 1;
            }
            .assistant-panel-fab-pulse {
              position: absolute;
              inset: -5px;
              border-radius: 50%;
              border: 2px solid var(--gold);
              animation: assistant-panel-pulse 2.8s ease-in-out infinite;
            }

            .assistant-panel-shell {
              position: fixed;
              right: 28px;
              bottom: 90px;
              width: 380px;
              max-height: 70vh;
              display: flex;
              flex-direction: column;
              border: 1px solid var(--border);
              border-radius: 18px;
              overflow: hidden;
              background: var(--surface);
              box-shadow: 0 24px 72px rgba(0,0,0,0.48);
              z-index: 121;
              animation: assistant-panel-enter 220ms ease-out;
            }

            .assistant-panel-header {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 14px 16px;
              border-bottom: 1px solid var(--border);
              background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent);
            }
            .assistant-panel-avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--bg);
              font-size: 18px;
              flex-shrink: 0;
            }
            .assistant-panel-meta { flex: 1; min-width: 0; }
            .assistant-panel-name {
              font-size: 16px;
              font-weight: 800;
              color: var(--text);
            }
            .assistant-panel-tagline {
              margin-top: 2px;
              font-family: "Space Mono", monospace;
              font-size: 9px;
              color: var(--text-dim);
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }
            .assistant-panel-close {
              border: none;
              background: transparent;
              color: var(--text-dim);
              font-size: 24px;
              cursor: pointer;
            }

            .assistant-panel-body {
              padding: 12px 14px 0;
              overflow: auto;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .assistant-panel-intro {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              align-items: center;
              border: 1px solid var(--border);
              background: var(--surface2);
              border-radius: 12px;
              padding: 10px 12px;
            }
            .assistant-panel-intro-label {
              font-family: "Space Mono", monospace;
              font-size: 9px;
              color: var(--gold);
              text-transform: uppercase;
              letter-spacing: 0.14em;
            }
            .assistant-panel-intro-text {
              font-size: 12px;
              color: var(--text-dim);
            }

            .assistant-panel-messages {
              display: flex;
              flex-direction: column;
              gap: 10px;
              min-height: 180px;
            }
            .assistant-panel-empty {
              padding: 22px 16px;
              text-align: center;
              color: var(--text-dim);
            }
            .assistant-panel-empty-title {
              font-size: 14px;
              font-weight: 700;
              color: var(--text);
              margin-bottom: 6px;
            }
            .assistant-panel-empty-text {
              font-size: 12px;
              line-height: 1.6;
            }
            .assistant-panel-message {
              display: flex;
            }
            .assistant-panel-message.user { justify-content: flex-end; }
            .assistant-panel-bubble {
              max-width: 86%;
              padding: 10px 12px;
              border-radius: 14px;
              font-size: 13px;
              line-height: 1.55;
              white-space: pre-wrap;
              word-break: break-word;
            }
            .assistant-panel-message.user .assistant-panel-bubble {
              background: linear-gradient(135deg, var(--gold), var(--gold-dim));
              color: var(--bg);
              border-bottom-right-radius: 4px;
            }
            .assistant-panel-message.assistant .assistant-panel-bubble {
              background: rgba(255,255,255,0.02);
              border: 1px solid var(--border);
              color: var(--text);
              border-bottom-left-radius: 4px;
            }
            .assistant-panel-cursor {
              color: var(--gold);
              font-weight: 700;
              margin-left: 2px;
            }
            .assistant-panel-chips {
              padding-bottom: 6px;
            }
            .assistant-panel-error {
              border: 1px solid rgba(224,90,78,0.25);
              background: rgba(224,90,78,0.08);
              color: var(--red);
              border-radius: 10px;
              padding: 8px 10px;
              font-size: 12px;
            }

            .assistant-panel-input {
              display: flex;
              align-items: flex-end;
              gap: 8px;
              padding: 12px 14px 14px;
              border-top: 1px solid var(--border);
              background: var(--surface2);
            }
            .assistant-panel-input textarea {
              flex: 1;
              min-height: 42px;
              max-height: 110px;
              resize: none;
              border: 1px solid var(--border);
              border-radius: 12px;
              background: var(--surface);
              color: var(--text);
              padding: 10px 12px;
              font-family: "Syne", sans-serif;
              font-size: 13px;
              outline: none;
            }
            .assistant-panel-input textarea:focus {
              border-color: var(--gold);
              box-shadow: 0 0 0 3px rgba(201,168,76,0.08);
            }
            .assistant-panel-input button {
              width: 40px;
              height: 40px;
              border-radius: 12px;
              border: none;
              background: var(--gold);
              color: var(--bg);
              font-size: 16px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .assistant-panel-input button:disabled {
              opacity: 0.45;
              cursor: not-allowed;
            }

            @keyframes assistant-panel-enter {
              from { opacity: 0; transform: translateY(16px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes assistant-panel-pulse {
              0%, 100% { opacity: 0; transform: scale(1); }
              50% { opacity: 0.45; transform: scale(1.08); }
            }

            @media (max-width: 500px) {
              .assistant-panel-shell {
                left: 0;
                right: 0;
                bottom: 0;
                width: 100%;
                max-height: 90vh;
                border-radius: 18px 18px 0 0;
              }
              .assistant-panel-fab {
                right: 16px;
                bottom: 16px;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
