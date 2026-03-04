// Level I - Design System Enforcement
// Component: EmptyState
// AI-powered empty states with assistant CTA - never just "No data found"

import { useNavigate } from "react-router-dom";

type Assistant = "nova" | "sage" | "atlas" | "circuit" | "omega" | "aria" | "forge" | "nexus" | "herald";

interface EmptyStateProps {
  assistant?: Assistant;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaPath?: string;
  secondaryCtaLabel?: string;
  secondaryCtaPath?: string;
  illustration?: "feed" | "courses" | "products" | "jobs" | "messages" | "default";
}

const ASSISTANT_CONFIG: Record<Assistant, { emoji: string; name: string; tagline: string }> = {
  nova: { emoji: "👥", name: "NOVA", tagline: "Community Intelligence Supervisor" },
  sage: { emoji: "🎓", name: "SAGE", tagline: "Academy Learning Assistant" },
  atlas: { emoji: "🛒", name: "ATLAS", tagline: "Market Intelligence" },
  circuit: { emoji: "💼", name: "CIRCUIT", tagline: "Work Talent Matcher" },
  omega: { emoji: "🧠", name: "OMEGA", tagline: "Master Orchestrator" },
  aria: { emoji: "⬡", name: "ARIA", tagline: "Core Engine Assistant" },
  forge: { emoji: "🤖", name: "FORGE", tagline: "Intelligence Supervisor" },
  nexus: { emoji: "☁️", name: "NEXUS", tagline: "Cloud Developer Support" },
  herald: { emoji: "🧬", name: "HERALD", tagline: "AI Platform Manager" },
};

const DEFAULT_MESSAGES: Record<string, { headline: string; body: string }> = {
  community: {
    headline: "Your community feed is empty",
    body: "Start a conversation — your first post tells OMEGA what skills to look for.",
  },
  academy: {
    headline: "No courses yet",
    body: "Explore the catalog — or describe your goal and let SAGE build your learning path.",
  },
  market: {
    headline: "Your storefront is ready",
    body: "ATLAS can research your first winning product in under 30 seconds.",
  },
  work: {
    headline: "No matching jobs yet",
    body: "CIRCUIT is scanning — post your skills and it will surface opportunities automatically.",
  },
  dashboard: {
    headline: "ARIA needs activity to generate insights",
    body: "Start by connecting your Community account or enrolling in a course.",
  },
  messages: {
    headline: "No messages yet",
    body: "Start following creators or join groups to connect with the community.",
  },
};

const ILLUSTRATIONS: Record<string, string> = {
  feed: `<svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="100" height="60" rx="4" fill="var(--surface2)" stroke="var(--border)"/>
    <circle cx="25" cy="25" r="8" fill="var(--border)"/>
    <rect x="38" y="22" width="40" height="6" rx="2" fill="var(--border)"/>
    <rect x="38" y="32" width="65" height="4" rx="1" fill="var(--text-dim)" opacity="0.5"/>
    <rect x="38" y="40" width="50" height="4" rx="1" fill="var(--text-dim)" opacity="0.5"/>
    <circle cx="90" cy="65" r="12" fill="var(--purple)" opacity="0.2"/>
    <text x="90" y="69" text-anchor="middle" fill="var(--purple)" font-size="14">👥</text>
  </svg>`,
  courses: `<svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="100" height="60" rx="4" fill="var(--surface2)" stroke="var(--border)"/>
    <rect x="20" y="20" width="35" height="25" rx="2" fill="var(--gold)" opacity="0.2"/>
    <rect x="60" y="20" width="35" height="25" rx="2" fill="var(--ice)" opacity="0.2"/>
    <rect x="20" y="50" width="35" height="8" rx="1" fill="var(--border)"/>
    <rect x="60" y="50" width="35" height="8" rx="1" fill="var(--border)"/>
    <circle cx="90" cy="65" r="12" fill="var(--purple)" opacity="0.2"/>
    <text x="90" y="69" text-anchor="middle" fill="var(--purple)" font-size="14">🎓</text>
  </svg>`,
  products: `<svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="100" height="60" rx="4" fill="var(--surface2)" stroke="var(--border)"/>
    <rect x="20" y="25" width="25" height="20" rx="2" fill="var(--gold)" opacity="0.3"/>
    <rect x="50" y="25" width="25" height="20" rx="2" fill="var(--green)" opacity="0.3"/>
    <rect x="80" y="25" width="25" height="20" rx="2" fill="var(--purple)" opacity="0.3"/>
    <rect x="20" y="50" width="80" height="4" rx="1" fill="var(--border)"/>
    <circle cx="90" cy="65" r="12" fill="var(--purple)" opacity="0.2"/>
    <text x="90" y="69" text-anchor="middle" fill="var(--purple)" font-size="14">🛒</text>
  </svg>`,
  jobs: `<svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="100" height="60" rx="4" fill="var(--surface2)" stroke="var(--border)"/>
    <rect x="20" y="20" width="80" height="8" rx="2" fill="var(--border)"/>
    <rect x="20" y="35" width="60" height="4" rx="1" fill="var(--text-dim)" opacity="0.5"/>
    <rect x="20" y="45" width="40" height="4" rx="1" fill="var(--text-dim)" opacity="0.5"/>
    <circle cx="90" cy="65" r="12" fill="var(--purple)" opacity="0.2"/>
    <text x="90" y="69" text-anchor="middle" fill="var(--purple)" font-size="14">💼</text>
  </svg>`,
  messages: `<svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="100" height="60" rx="4" fill="var(--surface2)" stroke="var(--border)"/>
    <path d="M25 30 L50 45 L75 30 L95 45 L95 60 L20 60 L20 45 Z" fill="var(--ice)" opacity="0.3"/>
    <circle cx="90" cy="65" r="12" fill="var(--purple)" opacity="0.2"/>
    <text x="90" y="69" text-anchor="middle" fill="var(--purple)" font-size="14">💬</text>
  </svg>`,
  default: `<svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="100" height="60" rx="4" fill="var(--surface2)" stroke="var(--border)"/>
    <circle cx="60" cy="40" r="15" fill="var(--purple)" opacity="0.2"/>
    <text x="60" y="45" text-anchor="middle" fill="var(--purple)" font-size="20">?</text>
  </svg>`,
};

export default function EmptyState({
  assistant = "aria",
  headline,
  body,
  ctaLabel,
  ctaPath,
  secondaryCtaLabel,
  secondaryCtaPath,
  illustration = "default",
}: EmptyStateProps) {
  const navigate = useNavigate();
  const config = ASSISTANT_CONFIG[assistant];
  const defaultMsg = DEFAULT_MESSAGES[assistant] || DEFAULT_MESSAGES.default;
  
  const displayHeadline = headline || defaultMsg.headline;
  const displayBody = body || defaultMsg.body;

  return (
    <div style={styles.container}>
      {/* Illustration */}
      <div 
        style={styles.illustration}
        dangerouslySetInnerHTML={{ __html: ILLUSTRATIONS[illustration] || ILLUSTRATIONS.default }}
      />

      {/* AI Assistant Badge */}
      <div style={styles.assistantBadge}>
        <span style={styles.assistantEmoji}>{config.emoji}</span>
        <div style={styles.assistantInfo}>
          <span style={styles.assistantName}>{config.name}</span>
          <span style={styles.assistantTagline}>{config.tagline}</span>
        </div>
      </div>

      {/* Content */}
      <h3 style={styles.headline}>{displayHeadline}</h3>
      <p style={styles.body}>{displayBody}</p>

      {/* CTAs */}
      <div style={styles.actions}>
        {ctaLabel && ctaPath && (
          <button 
            style={styles.primaryBtn}
            onClick={() => navigate(ctaPath)}
          >
            {ctaLabel}
          </button>
        )}
        {secondaryCtaLabel && secondaryCtaPath && (
          <button 
            style={styles.secondaryBtn}
            onClick={() => navigate(secondaryCtaPath)}
          >
            {secondaryCtaLabel}
          </button>
        )}
        {!ctaLabel && (
          <button 
            style={styles.primaryBtn}
            onClick={() => {
              // Open assistant panel for this layer
              const event = new CustomEvent("openAssistant", { detail: { assistant } });
              window.dispatchEvent(event);
            }}
          >
            Ask {config.name}
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    textAlign: "center",
    maxWidth: "400px",
    margin: "0 auto",
  },
  illustration: {
    width: "120px",
    height: "80px",
    marginBottom: "24px",
    opacity: 0.8,
  },
  assistantBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 14px",
    background: "rgba(155, 111, 255, 0.08)",
    border: "1px solid rgba(155, 111, 255, 0.2)",
    borderRadius: "20px",
    marginBottom: "20px",
  },
  assistantEmoji: {
    fontSize: "18px",
  },
  assistantInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  assistantName: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "10px",
    fontWeight: 700,
    color: "var(--purple)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  assistantTagline: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "9px",
    color: "var(--text-dim)",
  },
  headline: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "16px",
    fontWeight: 700,
    color: "var(--text)",
    marginBottom: "8px",
  },
  body: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "13px",
    color: "var(--text-dim)",
    lineHeight: 1.6,
    marginBottom: "24px",
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  primaryBtn: {
    padding: "10px 20px",
    background: "var(--gold)",
    color: "var(--bg)",
    border: "none",
    borderRadius: "6px",
    fontFamily: "'Syne', sans-serif",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  secondaryBtn: {
    padding: "10px 20px",
    background: "transparent",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    fontFamily: "'Syne', sans-serif",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};
