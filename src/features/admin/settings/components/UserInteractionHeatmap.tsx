type Point = { feature: string; count: number };

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
          <span>{point.feature}</span>
          <strong>{point.count}</strong>
        </div>
      ))}
    </div>
  );
}
