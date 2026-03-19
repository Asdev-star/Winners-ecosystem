type Props = {
  score: number;
  label?: string;
  size?: number;
};

const TRACK = 2 * Math.PI * 44;

function ringColor(score: number) {
  if (score <= 30) return "#ff7d72";
  if (score <= 60) return "#f4c96c";
  if (score <= 80) return "#58d39b";
  return "#ffe38b";
}

export default function TrustScoreRing({ score, label = "Trust Score", size = 112 }: Props) {
  const safeScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = TRACK - (TRACK * safeScore) / 100;
  const color = ringColor(safeScore);

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "grid",
        placeItems: "center",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={TRACK}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ color, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{safeScore}</div>
          <div
            style={{
              marginTop: 6,
              color: "var(--text-dim)",
              fontFamily: '"Space Mono", monospace',
              fontSize: 10,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
