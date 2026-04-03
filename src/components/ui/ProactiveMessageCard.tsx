// Level V - Named Supervisor Deployment
// Component: ProactiveMessageCard
// Unprompted AI insight card - shows AI-suggested actions without user prompting

import { useState, useEffect } from "react";

interface ProactiveMessage {
  id: string;
  type: "insight" | "recommendation" | "opportunity" | "alert";
  title: string;
  message: string;
  assistant: "omega" | "aria" | "nova" | "sage" | "atlas" | "circuit";
  action?: {
    label: string;
    href: string;
  };
  priority: "high" | "medium" | "low";
  createdAt: string;
  dismissed?: boolean;
}

interface ProactiveMessageCardProps {
  message: ProactiveMessage;
  onDismiss?: (id: string) => void;
  onAction?: (id: string, action: string) => void;
}

export default function ProactiveMessageCard({
  message,
  onDismiss,
  onAction
}: ProactiveMessageCardProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.(message.id);
    }, 300);
  };

  if (!isVisible) return null;

  const assistantInfo = getAssistantInfo(message.assistant);
  const priorityStyles = getPriorityStyles(message.priority);

  return (
    <div 
      className={`pmc-card ${message.type} ${isExiting ? "exiting" : ""}`}
      role="alert"
      aria-live="polite"
    >
      <style>{css}</style>
      
      {/* Priority Indicator */}
      <div className={`pmc-priority ${priorityStyles.className}`}>
        {priorityStyles.label}
      </div>

      {/* Assistant Badge */}
      <div className="pmc-assistant">
        <span className="pmc-assistant-icon">{assistantInfo.icon}</span>
        <span className="pmc-assistant-name">{assistantInfo.name}</span>
      </div>

      {/* Content */}
      <div className="pmc-content">
        <h4 className="pmc-title">{message.title}</h4>
        <p className="pmc-message">{message.message}</p>
      </div>

      {/* Action Button */}
      {message.action && (
        <button 
          className="pmc-action"
          onClick={() => onAction?.(message.id, message.action!.href)}
        >
          {message.action.label}
          <span className="pmc-action-arrow">→</span>
        </button>
      )}

      {/* Dismiss Button */}
      <button 
        className="pmc-dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss message"
        title="Dismiss"
      >
        ×
      </button>

      {/* Timestamp */}
      <div className="pmc-timestamp">
        {formatTimestamp(message.createdAt)}
      </div>
    </div>
  );
}

function getAssistantInfo(assistant: string): { icon: string; name: string; color: string } {
  const assistants: Record<string, { icon: string; name: string; color: string }> = {
    omega: { icon: "🧠", name: "OMEGA", color: "var(--gold)" },
    aria: { icon: "⬡", name: "ARIA", color: "var(--blue)" },
    nova: { icon: "👥", name: "NOVA", color: "var(--ice)" },
    sage: { icon: "🎓", name: "SAGE", color: "var(--green)" },
    atlas: { icon: "🛒", name: "ATLAS", color: "var(--purple)" },
    circuit: { icon: "💼", name: "CIRCUIT", color: "var(--red)" },
  };
  return assistants[assistant] || { icon: "🤖", name: "AI", color: "var(--text-dim)" };
}

function getPriorityStyles(priority: string): { className: string; label: string } {
  const styles: Record<string, { className: string; label: string }> = {
    high: { className: "high", label: "⚡" },
    medium: { className: "medium", label: "📌" },
    low: { className: "low", label: "💡" },
  };
  return styles[priority] || styles.low;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Container component for managing multiple proactive messages
interface ProactiveMessageContainerProps {
  messages: ProactiveMessage[];
  maxVisible?: number;
  onDismiss?: (id: string) => void;
  onAction?: (id: string, action: string) => void;
}

export function ProactiveMessageContainer({
  messages,
  maxVisible = 3,
  onDismiss,
  onAction
}: ProactiveMessageContainerProps) {
  const [visibleMessages, setVisibleMessages] = useState<ProactiveMessage[]>([]);

  useEffect(() => {
    // Filter out dismissed messages and limit to maxVisible
    const active = messages
      .filter(m => !m.dismissed)
      .slice(0, maxVisible);
    setVisibleMessages(active);
  }, [messages, maxVisible]);

  if (visibleMessages.length === 0) return null;

  return (
    <div className="pmc-container">
      {visibleMessages.map(message => (
        <ProactiveMessageCard
          key={message.id}
          message={message}
          onDismiss={onDismiss}
          onAction={onAction}
        />
      ))}
    </div>
  );
}

const css = `
  .pmc-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 400px;
  }

  .pmc-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--card-radius, 6px);
    padding: 16px;
    position: relative;
    overflow: hidden;
    animation: pmc-slide-in 0.3s ease;
  }

  .pmc-card.exiting {
    animation: pmc-slide-out 0.3s ease forwards;
  }

  @keyframes pmc-slide-in {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pmc-slide-out {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(20px);
    }
  }

  .pmc-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
  }

  .pmc-card.insight::before {
    background: linear-gradient(90deg, var(--purple), transparent);
  }

  .pmc-card.recommendation::before {
    background: linear-gradient(90deg, var(--gold), transparent);
  }

  .pmc-card.opportunity::before {
    background: linear-gradient(90deg, var(--green), transparent);
  }

  .pmc-card.alert::before {
    background: linear-gradient(90deg, var(--red), transparent);
  }

  .pmc-priority {
    position: absolute;
    top: 12px;
    right: 40px;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    font-family: var(--font-mono), 'Space Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .pmc-priority.high {
    background: rgba(224, 90, 78, 0.15);
    color: var(--red);
  }

  .pmc-priority.medium {
    background: rgba(201, 168, 76, 0.15);
    color: var(--gold);
  }

  .pmc-priority.low {
    background: rgba(137, 196, 225, 0.15);
    color: var(--ice);
  }

  .pmc-assistant {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
  }

  .pmc-assistant-icon {
    font-size: 16px;
  }

  .pmc-assistant-name {
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-dim);
  }

  .pmc-content {
    margin-bottom: 12px;
  }

  .pmc-title {
    font-family: var(--font-body), 'Syne', sans-serif;
    font-weight: 600;
    font-size: 14px;
    color: var(--text);
    margin: 0 0 6px 0;
    padding-right: 24px;
  }

  .pmc-message {
    font-family: var(--font-body), 'Syne', sans-serif;
    font-size: 13px;
    color: var(--text-dim);
    margin: 0;
    line-height: 1.5;
  }

  .pmc-action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--card-radius, 4px);
    padding: 8px 12px;
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 11px;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .pmc-action:hover {
    background: var(--border);
    border-color: var(--gold);
  }

  .pmc-action-arrow {
    transition: transform 0.2s ease;
  }

  .pmc-action:hover .pmc-action-arrow {
    transform: translateX(3px);
  }

  .pmc-dismiss {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    color: var(--text-dim);
    font-size: 18px;
    cursor: pointer;
    padding: 4px;
    line-height: 1;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .pmc-dismiss:hover {
    background: var(--surface2);
    color: var(--text);
  }

  .pmc-timestamp {
    position: absolute;
    bottom: 8px;
    right: 12px;
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 9px;
    color: var(--text-dim);
    opacity: 0.6;
  }
`;
