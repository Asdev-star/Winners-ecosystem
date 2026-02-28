// src/features/intelligence/WinnersChat.tsx
// Phase 5 - Winners Intelligence Layer
// ARIA chatbot UI - streaming AI conversations

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../auth/authStore";
import { useNavigate } from "react-router-dom";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .aria-container {
    display: flex; flex-direction: column; height: 100%;
    background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif;
  }

  .aria-header {
    padding: 16px 20px; border-bottom: 1px solid var(--border);
    background: var(--surface); display: flex; align-items: center; gap: 12px;
  }
  .aria-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, var(--gold), #8B6914);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 700; color: #0D1520;
  }
  .aria-title h2 { margin: 0; font-size: 16px; font-weight: 700; }
  .aria-title span { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--green); }
  .aria-status { margin-left: auto; display: flex; align-items: center; gap: 6px; }
  .aria-status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); }

  .aria-messages {
    flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px;
  }

  .aria-message {
    max-width: 80%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.5;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .aria-message.user {
    align-self: flex-end;
    background: linear-gradient(135deg, var(--blue), #1E3D52);
    border-bottom-right-radius: 4px;
  }

  .aria-message.assistant {
    align-self: flex-start;
    background: var(--surface);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px;
    position: relative;
  }
  .aria-message.assistant::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0;
    height: 2px; background: linear-gradient(90deg, var(--gold), transparent);
  }

  .aria-message.typing { opacity: 0.7; }
  .aria-message.typing::after {
    content: '...'; animation: blink 0.5s infinite;
  }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

  .aria-typing-indicator {
    display: flex; gap: 4px; padding: 12px 16px;
  }
  .aria-typing-indicator span {
    width: 8px; height: 8px; border-radius: 50%; background: var(--gold);
    animation: bounce 1.4s infinite ease-in-out both;
  }
  .aria-typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
  .aria-typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
  @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

  .aria-input-area {
    padding: 16px 20px; border-top: 1px solid var(--border);
    background: var(--surface); display: flex; gap: 12px;
  }
  .aria-input {
    flex: 1; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; padding: 12px 16px; color: var(--text); font-size: 14px;
    font-family: 'Syne', sans-serif; resize: none;
  }
  .aria-input:focus { outline: none; border-color: var(--gold); }
  .aria-input::placeholder { color: var(--text-dim); }

  .aria-send {
    background: linear-gradient(135deg, var(--gold), #8B6914);
    border: none; border-radius: 8px; padding: 12px 20px;
    color: #0D1520; font-weight: 700; font-size: 14px; cursor: pointer;
    transition: all 0.2s;
  }
  .aria-send:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(201,168,76,0.3); }
  .aria-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .aria-suggestions {
    padding: 0 20px 12px; display: flex; flex-wrap: wrap; gap: 8px;
  }
  .aria-suggestion {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 20px; padding: 6px 12px; font-size: 12px;
    color: var(--text-dim); cursor: pointer; transition: all 0.2s;
  }
  .aria-suggestion:hover { border-color: var(--gold); color: var(--gold); }

  .aria-empty {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 40px;
  }
  .aria-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .aria-empty h3 { font-size: 18px; margin-bottom: 8px; }
  .aria-empty p { color: var(--text-dim); font-size: 14px; max-width: 300px; }
`;

type Message = { role: "user" | "assistant"; content: string };

export default function WinnersChat() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I am ARIA, your Winners Ecosystem assistant. I can help you navigate the platform, understand your analytics, manage your workspace, and answer questions about all 8 platforms and 9 AI assistants. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEnd = useRef<HTMLDivElement>(null);

  // Load suggestions on mount
  useEffect(() => {
    fetch("/api/v1/chat/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ context: "intelligence" }),
    })
      .then((r) => r.json())
      .then((d) => setSuggestions(d.suggestions || []))
      .catch(() => {});
  }, [token]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const message = text || input.trim();
    if (!message || isLoading) return;

    const userMsg: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Add empty assistant message for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/v1/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("Request failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader");

      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "text") {
                assistantContent += data.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "I apologize, but I encountered an error processing your request. Please check that your ANTHROPIC_API_KEY is configured, or try again in a moment.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="aria-container">
      <style>{css}</style>

      <header className="aria-header">
        <div className="aria-avatar">A</div>
        <div className="aria-title">
          <h2>ARIA</h2>
          <span>Winners Intelligence</span>
        </div>
        <div className="aria-status">
          <div className="aria-status-dot" />
          <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>Online</span>
        </div>
      </header>

      <div className="aria-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`aria-message ${msg.role}${isLoading && i === messages.length - 1 ? " typing" : ""}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="aria-typing-indicator">
            <span /><span /><span />
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {suggestions.length > 0 && !messages.some((m) => m.role === "user") && (
        <div className="aria-suggestions">
          {suggestions.map((s, i) => (
            <button key={i} className="aria-suggestion" onClick={() => sendMessage(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="aria-input-area">
        <textarea
          className="aria-input"
          placeholder="Ask ARIA anything about the Winners Ecosystem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button className="aria-send" onClick={() => sendMessage()} disabled={!input.trim() || isLoading}>
          Send
        </button>
      </div>
    </div>
  );
}
