// Level III - Shared Component Architecture
// Component: AssistantPanel
// THE core component - embeds any assistant in any page with one line of JSX

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useAuthStore } from "../../features/auth/authStore";
import FollowUpChips from "../ai/FollowUpChips";
import StreamingText from "../ai/StreamingText";

type AssistantKey = "aria" | "nova" | "sage" | "atlas" | "circuit" | "forge" | "nexus" | "herald" | "omega";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AssistantPanelProps {
  assistant: AssistantKey;
  context?: Record<string, unknown>;
  page: string;
  userId?: string;
  initialMessage?: string;
}

interface AssistantConfig {
  emoji: string;
  name: string;
  tagline: string;
  color: string;
  gradient: string;
}

const ASSISTANT_CONFIGS: Record<AssistantKey, AssistantConfig> = {
  aria: {
    emoji: "⬡",
    name: "ARIA",
    tagline: "Core Engine Supervisor",
    color: "var(--gold)",
    gradient: "linear-gradient(135deg, var(--gold), var(--gold-dim))",
  },
  nova: {
    emoji: "👥",
    name: "NOVA",
    tagline: "Community Intelligence",
    color: "var(--ice)",
    gradient: "linear-gradient(135deg, var(--ice), var(--blue))",
  },
  sage: {
    emoji: "🎓",
    name: "SAGE",
    tagline: "Academy Tutor",
    color: "var(--green)",
    gradient: "linear-gradient(135deg, var(--green), var(--blue))",
  },
  atlas: {
    emoji: "🛒",
    name: "ATLAS",
    tagline: "Market Analyst",
    color: "var(--purple)",
    gradient: "linear-gradient(135deg, var(--purple), var(--blue))",
  },
  circuit: {
    emoji: "💼",
    name: "CIRCUIT",
    tagline: "Work Matchmaker",
    color: "var(--blue)",
    gradient: "linear-gradient(135deg, var(--blue), var(--ice))",
  },
  forge: {
    emoji: "🤖",
    name: "FORGE",
    tagline: "Intelligence Optimizer",
    color: "var(--purple)",
    gradient: "linear-gradient(135deg, var(--purple), var(--gold))",
  },
  nexus: {
    emoji: "☁️",
    name: "NEXUS",
    tagline: "Cloud Developer",
    color: "var(--ice)",
    gradient: "linear-gradient(135deg, var(--ice), var(--blue))",
  },
  herald: {
    emoji: "🧬",
    name: "HERALD",
    tagline: "AI Platform Manager",
    color: "var(--purple)",
    gradient: "linear-gradient(135deg, var(--purple), var(--green))",
  },
  omega: {
    emoji: "🧠",
    name: "OMEGA",
    tagline: "Master Orchestrator",
    color: "var(--gold)",
    gradient: "linear-gradient(135deg, var(--green), var(--gold), var(--purple))",
  },
};

export default function AssistantPanel({
  assistant,
  context,
  page,
  userId,
  initialMessage,
}: AssistantPanelProps) {
  const { token } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasProactiveMessage, setHasProactiveMessage] = useState(false);
  const [greeting, setGreeting] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const config = ASSISTANT_CONFIGS[assistant];

  // Generate context-aware greeting on mount per AI Assistant Interaction Spec V2 Section 3.1
  useEffect(() => {
    const generateGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
      
      // Context-aware greeting templates per supervisor per spec
      const greetingTemplates: Record<AssistantKey, string[]> = {
        omega: [
          `Across your ecosystem today, ${timeGreeting}. OMEGA sees the full picture. What is your priority?`,
          `${timeGreeting}. I have reviewed your cross-layer activity. There are three opportunities worth your attention.`,
        ],
        aria: [
          `${timeGreeting}. Your workspace is healthy. Here is what needs your attention today.`,
          `Platform overview ready. Your account setup is 87% complete.`,
        ],
        nova: [
          `Your community is active. 847 impressions on your last post — 3x your average.`,
          `${timeGreeting}. Two collaboration opportunities match your skills. Want to see them?`,
        ],
        sage: [
          `Your React course is at 68%. 90 minutes remaining. The certificate unlocks three Work categories.`,
          `${timeGreeting}. SAGE has reviewed your progress. Ready to continue where you left off?`,
        ],
        atlas: [
          `Market data shows Afroprint hoodies at 34% margin above average. Three products matching your niche.`,
          `${timeGreeting}. ATLAS has identified five winning products for your store.`,
        ],
        circuit: [
          `A React contract at 94% match was posted 47 minutes ago. Budget: $4,000. Three applicants already.`,
          `${timeGreeting}. Your proposal win rate is 71% — above the 58% platform average. Lead with that.`,
        ],
        forge: [
          `You have used 312 of 2,000 monthly credits. Switching PDF analysis to Claude native saves 40%.`,
          `${timeGreeting}. FORGE: Your AI infrastructure is running optimally.`,
        ],
        nexus: [
          `NEXUS: Your API integration is live. Rate limit: 1000/hour. What would you like to build?`,
          `${timeGreeting}. Developer context loaded. Which API would you like to explore?`,
        ],
        herald: [
          `Benchmark data for your models is ready. Llama 3.1 outperforms GPT-4o on code tasks by 12%.`,
          `${timeGreeting}. HERALD: Platform health signals are green across all layers.`,
        ],
      };
      
      const templates = greetingTemplates[assistant];
      const randomGreeting = templates[Math.floor(Math.random() * templates.length)];
      setGreeting(randomGreeting);
    };

    generateGreeting();
  }, [assistant]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Check for proactive messages on mount
  useEffect(() => {
    // Simulate checking for proactive messages
    const timer = setTimeout(() => {
      setHasProactiveMessage(Math.random() > 0.7);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true },
    ]);

    try {
      const history = messages
        .filter((m) => m.content.trim())
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/v1/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(userId ? { "X-User-ID": userId } : {}),
        },
        body: JSON.stringify({
          assistant,
          message: userMessage.content,
          history,
          context: { ...context, page },
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "text") {
                  assistantContent += data.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: assistantContent } : m
                    )
                  );
                }
              } catch { /* ignore malformed lines */ }
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, isStreaming: false } : m)
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: getFallbackResponse(assistant, userMessage.content), isStreaming: false }
              : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "I encountered an error. Please try again.", isStreaming: false }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const getFallbackResponse = (assistant: string, userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    
    switch (assistant) {
      case "nova":
        if (lowerInput.includes("post") || lowerInput.includes("content")) {
          return "I'd be happy to help with your content strategy! What topic are you looking to create content about?";
        }
        return "I'm here to help you grow your presence in the Winners Community. What would you like to explore?";
      
      case "sage":
        if (lowerInput.includes("course") || lowerInput.includes("learn")) {
          return "Let's plan your learning journey! What skill would you like to develop?";
        }
        return "I'm here to guide your learning. What would you like to explore in the Academy?";
      
      case "atlas":
        if (lowerInput.includes("product") || lowerInput.includes("sell")) {
          return "I can help you find winning products. What's your target market?";
        }
        return "I'm here to help you succeed in the Market. What would you like to explore?";
      
      case "circuit":
        if (lowerInput.includes("job") || lowerInput.includes("work")) {
          return "Let me help you find the perfect opportunity. What skills do you want to use?";
        }
        return "I'm here to match you with opportunities. What are you looking for?";
      
      case "omega":
        return "I can see across your entire ecosystem. What would you like to optimize?";
      
      default:
        return `I'm ${config.name}, here to help you succeed. What would you like to explore?`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const togglePanel = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasProactiveMessage(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        className="assistant-fab"
        onClick={togglePanel}
        aria-label={`Open ${config.name} assistant`}
        style={{
          background: config.gradient,
        }}
      >
        <span style={{ fontSize: "22px" }}>{config.emoji}</span>
        {hasProactiveMessage && <span className="fab-pulse-ring" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="assistant-panel">
          {/* Header */}
          <div className="assistant-header">
            <div className="assistant-avatar" style={{ background: config.gradient }}>
              {config.emoji}
            </div>
            <div className="assistant-info">
              <h3 className="assistant-name" style={{ color: config.color }}>
                {config.name}
              </h3>
              <p className="assistant-tagline">{config.tagline}</p>
            </div>
            <button
              className="assistant-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close panel"
            >
              ×
            </button>
          </div>

          {/* Memory indicator */}
          <div className="assistant-memory">
            <span className="memory-icon">💭</span>
            <span className="memory-text">Remembering your preferences</span>
          </div>

          {/* Messages */}
          <div className="assistant-messages">
            {messages.length === 0 && (
              <div className="assistant-welcome">
                <p className="greeting-text">{greeting || `I'm ${config.name}.`}</p>
                <p className="welcome-prompt">{config.tagline}</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.role}`}
              >
                <div className="message-bubble">
                  {message.role === "assistant" ? (
                    <StreamingText content={message.content} isStreaming={Boolean(message.isStreaming)} />
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Follow-up chips */}
          {messages.length > 0 && !isStreaming && (
            <div style={{ padding: "0 16px 12px" }}>
              <FollowUpChips
                chips={getFollowUpChips(assistant)}
                onChipClick={(chip) => setInput(chip)}
                accentColor={config.color}
                disabled={isStreaming}
              />
            </div>
          )}

          {/* Input */}
          <form className="assistant-input" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${config.name}...`}
              rows={1}
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="send-button"
            >
              ➤
            </button>
          </form>

          <style>{`
            .assistant-fab {
              position: fixed;
              bottom: 28px;
              right: 28px;
              width: 52px;
              height: 52px;
              border-radius: 50%;
              border: 1px solid var(--border);
              box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.1);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 200ms ease;
              z-index: 100;
            }

            .assistant-fab:hover {
              transform: scale(1.05);
              box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 2px rgba(201,168,76,0.2);
            }

            .fab-pulse-ring {
              position: absolute;
              inset: -4px;
              border-radius: 50%;
              border: 2px solid var(--gold);
              opacity: 0;
              animation: fab-pulse 3s ease infinite;
            }

            @keyframes fab-pulse {
              0%, 90%, 100% { opacity: 0; transform: scale(1); }
              45% { opacity: 0.4; transform: scale(1.1); }
            }

            .assistant-panel {
              position: fixed;
              bottom: 90px;
              right: 28px;
              width: 380px;
              max-height: 70vh;
              background: var(--surface);
              border: 1px solid var(--border);
              border-radius: 12px;
              box-shadow: 0 16px 64px rgba(0,0,0,0.5);
              z-index: 101;
              display: flex;
              flex-direction: column;
              animation: panel-enter 0.3s ease;
              overflow: hidden;
            }

            @keyframes panel-enter {
              from {
                opacity: 0;
                transform: translateY(20px) scale(0.97);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            .assistant-header {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 16px;
              border-bottom: 1px solid var(--border);
              background: var(--surface2);
            }

            .assistant-avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              flex-shrink: 0;
            }

            .assistant-info {
              flex: 1;
              min-width: 0;
            }

            .assistant-name {
              font-family: 'Syne', sans-serif;
              font-size: 16px;
              font-weight: 700;
              margin: 0;
              line-height: 1.2;
            }

            .assistant-tagline {
              font-family: 'Space Mono', monospace;
              font-size: 9px;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              color: var(--text-dim);
              margin: 2px 0 0 0;
            }

            .assistant-close {
              background: none;
              border: none;
              color: var(--text-dim);
              font-size: 24px;
              cursor: pointer;
              padding: 0;
              line-height: 1;
              opacity: 0.6;
              transition: opacity 0.2s;
            }

            .assistant-close:hover {
              opacity: 1;
            }

            .assistant-memory {
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 8px 16px;
              background: rgba(155, 111, 255, 0.08);
              border-bottom: 1px solid var(--border);
              font-family: 'Space Mono', monospace;
              font-size: 9px;
              color: var(--purple);
            }

            .memory-icon {
              font-size: 12px;
            }

            .assistant-messages {
              flex: 1;
              overflow-y: auto;
              padding: 16px;
              display: flex;
              flex-direction: column;
              gap: 12px;
              min-height: 200px;
              max-height: 400px;
            }

            .assistant-welcome {
              text-align: center;
              padding: 24px 16px;
              color: var(--text-dim);
            }

            .assistant-welcome p {
              margin: 0 0 8px 0;
              font-size: 14px;
            }

            .assistant-welcome .welcome-prompt {
              color: var(--text);
              font-weight: 600;
            }

            .message {
              display: flex;
            }

            .message.user {
              justify-content: flex-end;
            }

            .message-bubble {
              max-width: 85%;
              padding: 10px 14px;
              border-radius: 12px;
              font-size: 13.5px;
              line-height: 1.5;
              white-space: pre-wrap;
              word-break: break-word;
            }

            .message.assistant .message-bubble {
              background: var(--surface2);
              border: 1px solid var(--border);
              border-left: 3px solid var(--purple);
              color: var(--text);
            }

            .message.user .message-bubble {
              background: linear-gradient(135deg, var(--gold), var(--gold-dim));
              color: var(--bg);
              border-radius: 12px 12px 4px 12px;
            }

            .assistant-input {
              display: flex;
              gap: 8px;
              padding: 12px 16px;
              border-top: 1px solid var(--border);
              background: var(--surface2);
            }

            .assistant-input textarea {
              flex: 1;
              background: var(--bg);
              border: 1px solid var(--border);
              border-radius: 8px;
              padding: 10px 12px;
              font-family: 'Syne', sans-serif;
              font-size: 13px;
              color: var(--text);
              resize: none;
              min-height: 40px;
              max-height: 100px;
            }

            .assistant-input textarea:focus {
              outline: none;
              border-color: var(--purple);
            }

            .assistant-input textarea::placeholder {
              color: var(--text-dim);
            }

            .send-button {
              width: 40px;
              height: 40px;
              border-radius: 8px;
              background: var(--gold);
              border: none;
              color: var(--bg);
              font-size: 16px;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .send-button:hover:not(:disabled) {
              background: var(--gold-bright);
            }

            .send-button:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            @media (max-width: 640px) {
              .assistant-panel {
                bottom: 0;
                right: 0;
                left: 0;
                width: 100%;
                max-height: 90vh;
                border-radius: 16px 16px 0 0;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}

function getFollowUpChips(assistant: string): string[] {
  switch (assistant) {
    case "nova":
      return [
        "Help me create a post",
        "What's trending?",
        "Show my analytics",
      ];
    case "sage":
      return [
        "Find a course",
        "My learning progress",
        "Generate study notes",
      ];
    case "atlas":
      return [
        "Research products",
        "My store stats",
        "Find suppliers",
      ];
    case "circuit":
      return [
        "Find jobs",
        "Review my proposal",
        "Optimize my rate",
      ];
    case "omega":
      return [
        "My ecosystem briefing",
        "Next recommended action",
        "Revenue forecast",
      ];
    default:
      return [
        "Help me get started",
        "Show my progress",
        "What can you do?",
      ];
  }
}
