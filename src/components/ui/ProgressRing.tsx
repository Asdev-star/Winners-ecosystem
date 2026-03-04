// Level I - Design System Enforcement
// Component: ProgressRing
// SVG ring for Trust Score, course progress, profile completion
// Uses CSS variables with fallbacks

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: "gold" | "green" | "ice" | "purple" | "blue";
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const COLOR_MAP = {
  gold: { stroke: "var(--gold, #C9A84C)", gradient: ["var(--gold, #C9A84C)", "var(--gold, #E8C97A)"] },
  green: { stroke: "var(--green, #2DD4A0)", gradient: ["var(--green, #2DD4A0)", "#10B981"] },
  ice: { stroke: "var(--ice, #89C4E1)", gradient: ["var(--ice, #89C4E1)", "#60A5C8"] },
  purple: { stroke: "var(--purple, #9B6FFF)", gradient: ["var(--purple, #9B6FFF)", "#7C3AED"] },
  blue: { stroke: "var(--blue, #2B5F8E)", gradient: ["var(--blue, #2B5F8E)", "#1E40AF"] },
};

export default function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
  color = "gold",
  showLabel = true,
  label,
  animated = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;
  
  const colorConfig = COLOR_MAP[color];
  const center = size / 2;

  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-flex" }}>
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
      >
        <defs>
          <linearGradient id={`progress-gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorConfig.gradient[0]} />
            <stop offset="100%" stopColor={colorConfig.gradient[1]} />
          </linearGradient>
        </defs>
        
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border, #1E3248)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#progress-gradient-${color})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: animated ? "stroke-dashoffset 0.6s ease-out" : "none",
          }}
        />
      </svg>
      
      {/* Center label */}
      {showLabel && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: size > 40 ? "11px" : "8px",
              fontWeight: 700,
              color: colorConfig.stroke,
              lineHeight: 1,
            }}
          >
            {Math.round(clampedProgress)}%
          </span>
          {label && size > 50 && (
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "7px",
                color: "var(--text-dim, #5A7A96)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginTop: 2,
              }}
            >
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Trust Score ring - specialized for the 5-tier trust system
interface TrustScoreRingProps {
  score: number; // 0-100
  size?: number;
  showLabel?: boolean;
}

export function TrustScoreRing({ score, size = 48, showLabel = true }: TrustScoreRingProps) {
  // Determine color based on tier
  const getTierColor = (s: number): "gold" | "green" | "ice" | "blue" | "purple" => {
    if (s >= 90) return "green";  // Elite
    if (s >= 80) return "gold";   // Trusted
    if (s >= 60) return "ice";    // Established
    if (s >= 40) return "blue";   // Building
    return "purple";               // New
  };

  const getTierLabel = (s: number): string => {
    if (s >= 90) return "Elite";
    if (s >= 80) return "Trusted";
    if (s >= 60) return "Established";
    if (s >= 40) return "Building";
    return "New";
  };

  const color = getTierColor(score);
  const tierLabel = getTierLabel(score);

  return (
    <ProgressRing
      progress={score}
      size={size}
      color={color}
      showLabel={showLabel}
      label={showLabel ? tierLabel : undefined}
    />
  );
}

// Course progress ring - specialized for course/module completion
interface CourseProgressRingProps {
  completedLessons: number;
  totalLessons: number;
  size?: number;
}

export function CourseProgressRing({ completedLessons, totalLessons, size = 48 }: CourseProgressRingProps) {
  const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  
  return (
    <ProgressRing
      progress={progress}
      size={size}
      color="green"
      showLabel={true}
      label="complete"
    />
  );
}
