type Point = {
  feature: string;
  count: number;
  layer?: string;
  uniqueUsers?: number;
  avgTimeSpent?: number;
};

type Props = {
  points: Point[];
};

export default function UserInteractionHeatmap({ points }: Props) {
  const max = Math.max(...points.map((point) => point.count), 1);

  return (
    <div className="asheatmap">
      {points.map((point) => (
        <div
          key={point.feature}
          className="asheatmap-cell"
          style={{ opacity: 0.35 + (point.count / max) * 0.65 }}
          title={`${point.feature}: ${point.count}`}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <span>{point.layer ? `${point.layer} · ${point.feature}` : point.feature}</span>
            <small style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono), 'Space Mono', monospace", fontSize: 10 }}>
              {point.uniqueUsers ? `${point.uniqueUsers} users` : "activity"}
              {point.avgTimeSpent ? ` · ${point.avgTimeSpent}s avg` : ""}
            </small>
          </div>
          <strong>{point.count}</strong>
        </div>
      ))}
    </div>
  );
}
