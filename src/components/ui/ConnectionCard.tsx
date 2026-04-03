// Level VIII - Social Intelligence Graph
// Component: ConnectionCard
// Social graph connection suggestion card

import { useState } from "react";

interface ConnectionSuggestion {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    username: string;
    title?: string;
    company?: string;
  };
  mutualConnections: number;
  sharedInterests: string[];
  whySuggested: string;
  trustScore: number;
}

interface ConnectionCardProps {
  suggestion: ConnectionSuggestion;
  onConnect?: (userId: string) => void;
  onDismiss?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
}

export default function ConnectionCard({
  suggestion,
  onConnect,
  onDismiss,
  onViewProfile
}: ConnectionCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnect?.(suggestion.user.id);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.(suggestion.user.id);
  };

  if (isDismissed) return null;

  const avatarUrl = suggestion.user.avatar 
    ? suggestion.user.avatar 
    : `https://api.dicebear.com/7.x/initials/svg?seed=${suggestion.user.name}`;

  return (
    <div className="cc-card">
      <style>{css}</style>

      {/* Dismiss Button */}
      <button className="cc-dismiss" onClick={handleDismiss} title="Dismiss">
        ×
      </button>

      {/* User Avatar */}
      <div className="cc-avatar-section">
        <div className="cc-avatar">
          <img src={avatarUrl} alt={suggestion.user.name} />
          <div className="cc-trust-badge" title={`Trust Score: ${suggestion.trustScore}`}>
            {suggestion.trustScore}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="cc-info">
        <h4 className="cc-name">{suggestion.user.name}</h4>
        {suggestion.user.title && (
          <p className="cc-title">{suggestion.user.title}</p>
        )}
        {suggestion.user.company && (
          <p className="cc-company">{suggestion.user.company}</p>
        )}
      </div>

      {/* Why Suggested */}
      <div className="cc-why">
        <span className="cc-why-icon">💡</span>
        <span className="cc-why-text">{suggestion.whySuggested}</span>
      </div>

      {/* Shared Interests */}
      <div className="cc-interests">
        {suggestion.sharedInterests.slice(0, 3).map((interest, index) => (
          <span key={index} className="cc-interest-tag">{interest}</span>
        ))}
        {suggestion.sharedInterests.length > 3 && (
          <span className="cc-interest-more">
            +{suggestion.sharedInterests.length - 3}
          </span>
        )}
      </div>

      {/* Mutual Connections */}
      <div className="cc-mutual">
        <div className="cc-mutual-avatars">
          {[1, 2, 3].map(i => (
            <div key={i} className="cc-mutual-avatar" />
          ))}
        </div>
        <span className="cc-mutual-count">
          {suggestion.mutualConnections} mutual connections
        </span>
      </div>

      {/* Actions */}
      <div className="cc-actions">
        <button 
          className="cc-connect-btn"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <span className="cc-spinner"></span>
              Connecting...
            </>
          ) : (
            <>
              <span className="cc-connect-icon">+</span>
              Connect
            </>
          )}
        </button>
        <button 
          className="cc-profile-btn"
          onClick={() => onViewProfile?.(suggestion.user.id)}
        >
          View Profile
        </button>
      </div>
    </div>
  );
}

// Container for multiple connection cards
interface ConnectionSuggestionsProps {
  suggestions: ConnectionSuggestion[];
  onConnect?: (userId: string) => void;
  onDismiss?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  maxVisible?: number;
}

export function ConnectionSuggestions({
  suggestions,
  onConnect,
  onDismiss,
  onViewProfile,
  maxVisible = 3
}: ConnectionSuggestionsProps) {
  const visible = suggestions.slice(0, maxVisible);

  if (visible.length === 0) return null;

  return (
    <div className="cs-container">
      <div className="cs-header">
        <h3 className="cs-title">
          <span className="cs-icon">🤝</span>
          People You Should Know
        </h3>
        <span className="cs-count">{suggestions.length} suggestions</span>
      </div>
      <div className="cs-grid">
        {visible.map(suggestion => (
          <ConnectionCard
            key={suggestion.id}
            suggestion={suggestion}
            onConnect={onConnect}
            onDismiss={onDismiss}
            onViewProfile={onViewProfile}
          />
        ))}
      </div>
    </div>
  );
}

const css = `
  .cc-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--card-radius, 6px);
    padding: 16px;
    position: relative;
    overflow: hidden;
    min-width: 220px;
    max-width: 280px;
  }

  .cc-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--ice), transparent);
  }

  .cc-dismiss {
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
    border-radius: var(--card-radius, 4px);
    transition: all 0.2s ease;
    z-index: 1;
  }

  .cc-dismiss:hover {
    background: var(--surface2);
    color: var(--text);
  }

  .cc-avatar-section {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
  }

  .cc-avatar {
    position: relative;
    width: 64px;
    height: 64px;
  }

  .cc-avatar img {
    width: 100%;
    height: 100%;
    border-radius: var(--card-radius, 50%);
    object-fit: cover;
    border: 2px solid var(--border);
  }

  .cc-trust-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    background: var(--gold);
    color: var(--bg);
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 9px;
    font-weight: bold;
    width: 20px;
    height: 20px;
    border-radius: var(--card-radius, 50%);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--surface);
  }

  .cc-info {
    text-align: center;
    margin-bottom: 12px;
  }

  .cc-name {
    font-family: var(--font-body), 'Syne', sans-serif;
    font-weight: 600;
    font-size: 14px;
    color: var(--text);
    margin: 0 0 4px 0;
  }

  .cc-title {
    font-family: var(--font-body), 'Syne', sans-serif;
    font-size: 12px;
    color: var(--text-dim);
    margin: 0;
  }

  .cc-company {
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 10px;
    color: var(--gold);
    margin: 2px 0 0 0;
  }

  .cc-why {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px;
    background: var(--surface2);
    border-radius: var(--card-radius, 4px);
    margin-bottom: 12px;
  }

  .cc-why-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  .cc-why-text {
    font-family: var(--font-body), 'Syne', sans-serif;
    font-size: 11px;
    color: var(--text-dim);
    line-height: 1.4;
  }

  .cc-interests {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 12px;
  }

  .cc-interest-tag {
    padding: 2px 6px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--card-radius, 8px);
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 9px;
    color: var(--text);
  }

  .cc-interest-more {
    padding: 2px 6px;
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 9px;
    color: var(--text-dim);
  }

  .cc-mutual {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .cc-mutual-avatars {
    display: flex;
    margin-left: 4px;
  }

  .cc-mutual-avatar {
    width: 20px;
    height: 20px;
    border-radius: var(--card-radius, 50%);
    background: var(--surface2);
    border: 2px solid var(--surface);
    margin-left: -8px;
  }

  .cc-mutual-avatar:first-child {
    margin-left: 0;
  }

  .cc-mutual-count {
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 9px;
    color: var(--text-dim);
  }

  .cc-actions {
    display: flex;
    gap: 8px;
  }

  .cc-connect-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: var(--gold);
    border: none;
    border-radius: var(--card-radius, 4px);
    padding: 8px 12px;
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 11px;
    color: var(--bg);
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
  }

  .cc-connect-btn:hover:not(:disabled) {
    background: var(--gold);
  }

  .cc-connect-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .cc-connect-icon {
    font-size: 14px;
    font-weight: bold;
  }

  .cc-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid var(--bg);
    border-top-color: transparent;
    border-radius: var(--card-radius, 50%);
    animation: cc-spin 0.8s linear infinite;
  }

  @keyframes cc-spin {
    to { transform: rotate(360deg); }
  }

  .cc-profile-btn {
    flex: 1;
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
  }

  .cc-profile-btn:hover {
    background: var(--border);
    border-color: var(--gold);
  }

  /* Container Styles */
  .cs-container {
    padding: 16px 0;
  }

  .cs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .cs-title {
    font-family: var(--font-body), 'Syne', sans-serif;
    font-weight: 600;
    font-size: 14px;
    color: var(--text);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cs-icon {
    font-size: 16px;
  }

  .cs-count {
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
  }

  .cs-grid {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .cs-grid::-webkit-scrollbar {
    height: 4px;
  }

  .cs-grid::-webkit-scrollbar-track {
    background: var(--surface2);
    border-radius: 2px;
  }

  .cs-grid::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 2px;
  }
`;
