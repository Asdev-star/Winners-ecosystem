// Level I - Foundation Intelligence  
// Empty State with AI Assistant CTA
// Part of the shared intelligence layer

interface EmptyStateProps {
  assistant?: 'aria' | 'nova' | 'sage' | 'atlas' | 'circuit' | 'forge' | 'omega';
  title: string;
  description?: string;
  message?: string;
  ctaLabel?: string;
  ctaPath?: string;
  secondaryCtaLabel?: string;
  secondaryCtaPath?: string;
  illustration?: 'community' | 'academy' | 'market' | 'work' | 'default';
}

const ASSISTANT_CONFIG = {
  aria: { name: 'ARIA', emoji: '⬡', color: 'var(--gold)' },
  nova: { name: 'NOVA', emoji: '👥', color: 'var(--ice)' },
  sage: { name: 'SAGE', emoji: '🎓', color: 'var(--green)' },
  atlas: { name: 'ATLAS', emoji: '🛒', color: 'var(--purple)' },
  circuit: { name: 'CIRCUIT', emoji: '💼', color: 'var(--blue)' },
  forge: { name: 'FORGE', emoji: '🤖', color: 'var(--purple)' },
  omega: { name: 'OMEGA', emoji: '🧠', color: 'var(--gold)' },
};

const ILLUSTRATIONS = {
  community: '🧑‍🤝‍🧑',
  academy: '🎓',
  market: '🛒',
  work: '💼',
  default: '📭',
};

export default function EmptyState({
  assistant = 'aria',
  title,
  description,
  message,
  ctaLabel = 'Get Started',
  ctaPath,
  secondaryCtaLabel,
  secondaryCtaPath,
  illustration = 'default'
}: EmptyStateProps) {
  const config = ASSISTANT_CONFIG[assistant];
  const icon = ILLUSTRATIONS[illustration];

  return (
    <div className="empty-state">
      <style>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          text-align: center;
          min-height: 400px;
        }
        
        .empty-state__illustration {
          font-size: 64px;
          margin-bottom: 24px;
          opacity: 0.8;
          animation: empty-bounce 2s ease-in-out infinite;
        }
        
        @keyframes empty-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        .empty-state__title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 300;
          color: var(--text);
          margin: 0 0 12px;
          line-height: 1.2;
        }
        
        .empty-state__description {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          color: var(--text-dim);
          margin: 0 0 24px;
          max-width: 400px;
          line-height: 1.6;
        }
        
        .empty-state__message {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 12px 16px;
          margin-bottom: 24px;
          max-width: 450px;
          line-height: 1.5;
        }
        
        .empty-state__message strong {
          color: ${config.color};
        }
        
        .empty-state__actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .empty-state__cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: ${config.color};
          color: var(--bg);
          border: none;
          border-radius: 6px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        
        .empty-state__cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px ${config.color}40;
        }
        
        .empty-state__cta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 6px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        
        .empty-state__cta-secondary:hover {
          border-color: var(--gold);
          color: var(--gold);
        }
        
        .empty-state__assistant {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 32px;
          padding: 12px 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
        }
        
        .empty-state__assistant-icon {
          font-size: 20px;
        }
        
        .empty-state__assistant-text {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-dim);
        }
        
        .empty-state__assistant-name {
          color: ${config.color};
        }
      `}</style>
      
      <div className="empty-state__illustration">
        {icon}
      </div>
      
      <h3 className="empty-state__title">
        {title}
      </h3>
      
      {description && (
        <p className="empty-state__description">
          {description}
        </p>
      )}
      
      {message && (
        <div className="empty-state__message">
          <strong>{config.name}:</strong> {message}
        </div>
      )}
      
      <div className="empty-state__actions">
        {ctaPath && (
          <a href={ctaPath} className="empty-state__cta">
            {ctaLabel}
          </a>
        )}
        {secondaryCtaPath && (
          <a href={secondaryCtaPath} className="empty-state__cta-secondary">
            {secondaryCtaLabel}
          </a>
        )}
      </div>
      
      <div className="empty-state__assistant">
        <span className="empty-state__assistant-icon">{config.emoji}</span>
        <span className="empty-state__assistant-text">
          Ask <span className="empty-state__assistant-name">{config.name}</span> for help
        </span>
      </div>
    </div>
  );
}
