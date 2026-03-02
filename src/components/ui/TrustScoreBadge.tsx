// Level II (V3.0) - AI-Present on Every Page
// Component: TrustScoreBadge
// SVG progress ring with semantic coloring and velocity indicator

interface TrustScoreBadgeProps {
  score: number; // 0-100
  size?: "small" | "medium" | "large";
  showVelocity?: boolean;
  velocity?: number; // points change in last 30 days
  onClick?: () => void;
  interactive?: boolean;
}

const SIZE_CONFIG = {
  small: { ring: 36, stroke: 3, fontSize: 10, labelSize: 8 },
  medium: { ring: 56, stroke: 4, fontSize: 14, labelSize: 9 },
  large: { ring: 80, stroke: 5, fontSize: 20, labelSize: 10 },
};

const TIER_CONFIG = [
  { min: 90, max: 100, label: "Elite", color: "var(--green)", gradient: "url(#greenGradient)" },
  { min: 80, max: 89, label: "Trusted", color: "var(--gold)", gradient: "url(#goldGradient)" },
  { min: 60, max: 79, label: "Established", color: "var(--ice)", gradient: "url(#iceGradient)" },
  { min: 40, max: 59, label: "Building", color: "var(--text-dim)", gradient: "url(#dimGradient)" },
  { min: 0, max: 39, label: "New", color: "var(--red)", gradient: "url(#redGradient)" },
];

export default function TrustScoreBadge({
  score,
  size = "medium",
  showVelocity = false,
  velocity = 0,
  onClick,
  interactive = false,
}: TrustScoreBadgeProps) {
  const config = SIZE_CONFIG[size];
  const tier = TIER_CONFIG.find(t => score >= t.min && score <= t.max) || TIER_CONFIG[0];
  
  const radius = (config.ring - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div 
      className={`trust-score-badge ${interactive ? "interactive" : ""}`}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <svg
        width={config.ring}
        height={config.ring}
        viewBox={`0 0 ${config.ring} ${config.ring}`}
      >
        <defs>
          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2DD4A0" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0B429" />
            <stop offset="100%" stopColor="#D4A12A" />
          </linearGradient>
          <linearGradient id="iceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#89C4E1" />
            <stop offset="100%" stopColor="#60A5C8" />
          </linearGradient>
          <linearGradient id="dimGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5A7A96" />
            <stop offset="100%" stopColor="#4A6A86" />
          </linearGradient>
          <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E05A4E" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>
        
        {/* Background ring */}
        <circle
          cx={config.ring / 2}
          cy={config.ring / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={config.stroke}
        />
        
        {/* Progress ring */}
        <circle
          cx={config.ring / 2}
          cy={config.ring / 2}
          r={radius}
          fill="none"
          stroke={tier.gradient}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${config.ring / 2} ${config.ring / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
        
        {/* Center text */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fill={tier.color}
          fontSize={config.fontSize}
          fontWeight={700}
          fontFamily="'Space Mono', monospace"
        >
          {score}
        </text>
      </svg>
      
      {/* Label */}
      <span 
        className="trust-label"
        style={{ fontSize: config.labelSize, color: tier.color }}
      >
        {tier.label}
      </span>
      
      {/* Velocity indicator */}
      {showVelocity && velocity !== 0 && (
        <span className={`trust-velocity ${velocity > 0 ? "positive" : "negative"}`}>
          {velocity > 0 ? "↑" : "↓"} {Math.abs(velocity)} pts
        </span>
      )}

      <style>{`
        .trust-score-badge {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          position: relative;
        }

        .trust-score-badge.interactive {
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .trust-score-badge.interactive:hover {
          transform: scale(1.05);
        }

        .trust-score-badge.interactive:active {
          transform: scale(0.98);
        }

        .trust-label {
          font-family: 'Space Mono', monospace;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .trust-velocity {
          position: absolute;
          top: -8px;
          right: -8px;
          font-family: 'Space Mono', monospace;
          font-size: 8px;
          padding: 2px 4px;
          border-radius: 4px;
          font-weight: 700;
        }

        .trust-velocity.positive {
          background: rgba(45, 212, 160, 0.15);
          color: var(--green);
        }

        .trust-velocity.negative {
          background: rgba(224, 90, 78, 0.15);
          color: var(--red);
        }
      `}</style>
    </div>
  );
}
