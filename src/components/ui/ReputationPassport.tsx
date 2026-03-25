// Level IX - Reputation as Sovereign Infrastructure
// Component: ReputationPassport
// Portable credential card - shareable externally as verifiable identity

import { useState, useMemo } from "react";
import { useAuthStore } from "../../features/auth/authStore";

interface Badge {
  id: string;
  name: string;
  icon: string;
  earnedAt: string;
  verified: boolean;
  category: "academy" | "community" | "work" | "achievement";
}

interface Certificate {
  id: string;
  title: string;
  issuedAt: string;
  verificationUrl: string;
  issuer: string;
}

interface ReputationData {
  trustScore: number;
  level: "bronze" | "silver" | "gold" | "platinum";
  badges: Badge[];
  certificates: Certificate[];
  totalEarnings: number;
  memberSince: string;
  verifiedIdentity: boolean;
  skills: string[];
}

interface ReputationPassportProps {
  userId?: string;
  data?: ReputationData;
  compact?: boolean;
  shareable?: boolean;
}

export default function ReputationPassport({
  userId,
  data: propData,
  compact = false,
  shareable = true
}: ReputationPassportProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const user = useAuthStore(state => state.user);
  const targetUserId = userId || user?.id;

  // Use provided data or mock for demo
  const data = propData || getMockReputationData();

  const levelColor = useMemo(() => {
    const colors: Record<string, string> = {
      bronze: "var(--orange)",
      silver: "var(--text-dim)",
      gold: "var(--gold)",
      platinum: "var(--ice)"
    };
    return colors[data.level] || colors.gold;
  }, [data.level]);

  const handleShare = () => {
    if (shareable) {
      setShowShareModal(true);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/profile/${targetUserId}/verify`;
    navigator.clipboard.writeText(shareUrl);
    setShowShareModal(false);
  };

  return (
    <div className={`rp-passport ${compact ? "compact" : ""}`}>
      <style>{css}</style>

      {/* Header */}
      <div className="rp-header">
        <div className="rp-title-section">
          <h3 className="rp-title">
            <span className="rp-icon">🛂</span>
            Winners Passport
          </h3>
          <span className="rp-subtitle">Portable Reputation Score</span>
        </div>
        
        {shareable && (
          <button className="rp-share-btn" onClick={handleShare}>
            <span>Share</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        )}
      </div>

      {/* Trust Score Circle */}
      <div className="rp-score-section">
        <div className="rp-score-circle" style={{ borderColor: levelColor }}>
          <svg className="rp-score-ring" viewBox="0 0 100 100">
            <circle
              className="rp-score-bg"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--surface2)"
              strokeWidth="6"
            />
            <circle
              className="rp-score-fill"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={levelColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(data.trustScore / 100) * 283} 283`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="rp-score-value">
            <span className="rp-score-number" style={{ color: levelColor }}>
              {data.trustScore}
            </span>
            <span className="rp-score-label">Trust Score</span>
          </div>
        </div>

        <div className="rp-level-badge" style={{ background: `${levelColor}20`, borderColor: levelColor }}>
          <span className="rp-level-icon">⭐</span>
          <span className="rp-level-text">{data.level.toUpperCase()}</span>
        </div>
      </div>

      {/* Verification Status */}
      <div className="rp-verification">
        {data.verifiedIdentity ? (
          <span className="rp-verified">
            <span className="rp-verified-icon">✓</span>
            Identity Verified
          </span>
        ) : (
          <span className="rp-unverified">
            <span className="rp-unverified-icon">!</span>
            Identity Unverified
          </span>
        )}
      </div>

      {/* Expand/Collapse for non-compact */}
      {!compact && (
        <button 
          className="rp-expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show Less" : "Show More"}
          <span className={`rp-expand-arrow ${isExpanded ? "up" : "down"}`}>▼</span>
        </button>
      )}

      {/* Expanded Content */}
      {isExpanded && !compact && (
        <div className="rp-expanded">
          {/* Skills */}
          <div className="rp-section">
            <h4 className="rp-section-title">Skills</h4>
            <div className="rp-skills">
              {data.skills.map((skill, index) => (
                <span key={index} className="rp-skill-tag">{skill}</span>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="rp-section">
            <h4 className="rp-section-title">Badges ({data.badges.length})</h4>
            <div className="rp-badges">
              {data.badges.slice(0, 6).map((badge) => (
                <div 
                  key={badge.id} 
                  className={`rp-badge ${badge.verified ? "verified" : ""}`}
                  title={badge.name}
                >
                  <span className="rp-badge-icon">{badge.icon}</span>
                  {badge.verified && <span className="rp-badge-check">✓</span>}
                </div>
              ))}
              {data.badges.length > 6 && (
                <span className="rp-badge-more">+{data.badges.length - 6}</span>
              )}
            </div>
          </div>

          {/* Certificates */}
          {data.certificates.length > 0 && (
            <div className="rp-section">
              <h4 className="rp-section-title">Certificates ({data.certificates.length})</h4>
              <div className="rp-certificates">
                {data.certificates.slice(0, 3).map((cert) => (
                  <a 
                    key={cert.id}
                    href={cert.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rp-certificate"
                  >
                    <span className="rp-cert-icon">📜</span>
                    <div className="rp-cert-info">
                      <span className="rp-cert-title">{cert.title}</span>
                      <span className="rp-cert-date">{formatDate(cert.issuedAt)}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="rp-stats">
            <div className="rp-stat">
              <span className="rp-stat-value">${data.totalEarnings.toLocaleString()}</span>
              <span className="rp-stat-label">Total Earned</span>
            </div>
            <div className="rp-stat">
              <span className="rp-stat-value">{formatMemberSince(data.memberSince)}</span>
              <span className="rp-stat-label">Member Since</span>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="rp-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="rp-modal" onClick={e => e.stopPropagation()}>
            <h3 className="rp-modal-title">Share Your Passport</h3>
            <p className="rp-modal-desc">
              Share your verified reputation with employers, partners, and platforms.
            </p>
            
            <div className="rp-modal-preview">
              <div className="rp-preview-score">{data.trustScore}</div>
              <div className="rp-preview-level">{data.level}</div>
              <div className="rp-preview-badges">{data.badges.length} badges</div>
            </div>

            <button className="rp-modal-copy" onClick={handleCopyLink}>
              Copy Verification Link
            </button>

            <div className="rp-modal-social">
              <span className="rp-social-label">Share on:</span>
              <div className="rp-social-buttons">
                <button className="rp-social-btn twitter" title="Share on Twitter">
                  𝕏
                </button>
                <button className="rp-social-btn linkedin" title="Share on LinkedIn">
                  in
                </button>
              </div>
            </div>

            <button 
              className="rp-modal-close"
              onClick={() => setShowShareModal(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const years = Math.floor(now.getFullYear() - date.getFullYear());
  if (years < 1) return "This year";
  return `${years}y`;
}

function getMockReputationData(): ReputationData {
  return {
    trustScore: 78,
    level: "gold",
    badges: [
      { id: "1", name: "Early Adopter", icon: "🌟", earnedAt: "2025-01-01", verified: true, category: "achievement" },
      { id: "2", name: "Community Builder", icon: "🧑‍🤝‍🧑", earnedAt: "2025-02-15", verified: true, category: "community" },
      { id: "3", name: "Certified Developer", icon: "💻", earnedAt: "2025-03-10", verified: true, category: "academy" },
      { id: "4", name: "Top Contributor", icon: "🏆", earnedAt: "2025-04-01", verified: true, category: "achievement" },
    ],
    certificates: [
      { id: "1", title: "Certified African Developer", issuedAt: "2025-03-10", verificationUrl: "#", issuer: "Winners Academy" },
      { id: "2", title: "Digital Marketing Fundamentals", issuedAt: "2025-02-20", verificationUrl: "#", issuer: "Winners Academy" },
    ],
    totalEarnings: 2450,
    memberSince: "2025-01-01",
    verifiedIdentity: true,
    skills: ["React", "TypeScript", "Node.js", "Python", "UI/UX"]
  };
}

const css = `
  .rp-passport {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 20px;
    position: relative;
    overflow: hidden;
    max-width: 400px;
  }

  .rp-passport::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--gold), var(--purple), var(--gold));
  }

  .rp-passport.compact {
    padding: 12px;
    max-width: 200px;
  }

  .rp-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .rp-title-section {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .rp-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 16px;
    color: var(--text);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rp-icon {
    font-size: 18px;
  }

  .rp-subtitle {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .rp-share-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 6px 10px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
  }

  .rp-share-btn:hover {
    background: var(--border);
    border-color: var(--gold);
  }

  .rp-score-section {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 16px;
  }

  .rp-score-circle {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 3px solid;
    padding: 4px;
  }

  .compact .rp-score-circle {
    width: 60px;
    height: 60px;
  }

  .rp-score-ring {
    width: 100%;
    height: 100%;
  }

  .rp-score-fill {
    transition: stroke-dasharray 0.8s ease;
  }

  .rp-score-value {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }

  .rp-score-number {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 600;
    display: block;
    line-height: 1;
  }

  .compact .rp-score-number {
    font-size: 18px;
  }

  .rp-score-label {
    font-family: 'Space Mono', monospace;
    font-size: 8px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .rp-level-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 12px;
    border: 1px solid;
  }

  .rp-level-icon {
    font-size: 14px;
  }

  .rp-level-text {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .rp-verification {
    text-align: center;
    margin-bottom: 12px;
  }

  .rp-verified {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--green);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .rp-verified-icon {
    width: 14px;
    height: 14px;
    background: var(--green);
    color: var(--bg);
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
  }

  .rp-unverified {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .rp-unverified-icon {
    width: 14px;
    height: 14px;
    background: var(--text-dim);
    color: var(--bg);
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
  }

  .rp-expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 8px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
  }

  .rp-expand-btn:hover {
    background: var(--border);
    color: var(--text);
  }

  .rp-expand-arrow {
    font-size: 8px;
    transition: transform 0.2s ease;
  }

  .rp-expand-arrow.up {
    transform: rotate(180deg);
  }

  .rp-expanded {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
  }

  .rp-section {
    margin-bottom: 16px;
  }

  .rp-section-title {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 8px 0;
  }

  .rp-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .rp-skill-tag {
    padding: 4px 8px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text);
  }

  .rp-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .rp-badge {
    position: relative;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 50%;
    font-size: 16px;
  }

  .rp-badge.verified {
    border-color: var(--gold);
  }

  .rp-badge-check {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    background: var(--gold);
    color: var(--bg);
    border-radius: 50%;
    font-size: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .rp-badge-more {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 50%;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
  }

  .rp-certificates {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .rp-certificate {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .rp-certificate:hover {
    border-color: var(--gold);
    background: var(--border);
  }

  .rp-cert-icon {
    font-size: 18px;
  }

  .rp-cert-info {
    display: flex;
    flex-direction: column;
  }

  .rp-cert-title {
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    color: var(--text);
  }

  .rp-cert-date {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: var(--text-dim);
  }

  .rp-stats {
    display: flex;
    gap: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }

  .rp-stat {
    flex: 1;
    text-align: center;
  }

  .rp-stat-value {
    display: block;
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    font-weight: 600;
    color: var(--text);
  }

  .rp-stat-label {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Modal Styles */
  .rp-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: rp-fade-in 0.2s ease;
  }

  @keyframes rp-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .rp-modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 24px;
    max-width: 320px;
    width: 90%;
    position: relative;
    animation: rp-scale-in 0.2s ease;
  }

  @keyframes rp-scale-in {
    from { transform: scale(0.95); }
    to { transform: scale(1); }
  }

  .rp-modal-title {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    color: var(--text);
    margin: 0 0 8px 0;
  }

  .rp-modal-desc {
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    color: var(--text-dim);
    margin: 0 0 20px 0;
  }

  .rp-modal-preview {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 16px;
    text-align: center;
    margin-bottom: 20px;
  }

  .rp-preview-score {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px;
    font-weight: 600;
    color: var(--gold);
  }

  .rp-preview-level {
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    color: var(--text);
    text-transform: uppercase;
  }

  .rp-preview-badges {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
  }

  .rp-modal-copy {
    width: 100%;
    background: var(--gold);
    border: none;
    border-radius: 4px;
    padding: 12px;
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    color: var(--bg);
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 16px;
  }

  .rp-modal-copy:hover {
    background: var(--gold);
  }

  .rp-modal-social {
    text-align: center;
  }

  .rp-social-label {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    display: block;
    margin-bottom: 8px;
  }

  .rp-social-buttons {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .rp-social-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--surface2);
    font-family: 'Space Mono', monospace;
    font-size: 14px;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .rp-social-btn:hover {
    border-color: var(--gold);
    background: var(--border);
  }

  .rp-modal-close {
    position: absolute;
    top: 12px;
    right: 12px;
    background: none;
    border: none;
    font-size: 20px;
    color: var(--text-dim);
    cursor: pointer;
    padding: 4px;
  }

  .rp-modal-close:hover {
    color: var(--text);
  }
`;
