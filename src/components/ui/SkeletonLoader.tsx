// Level I - Design System Enforcement
// Component: SkeletonLoader
// Animated shimmer - zero spinners anywhere - WCAG AA compliant

type SkeletonVariant = "card" | "row" | "avatar" | "chart" | "text" | "title" | "button" | "badge" | "table" | "list";

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  count?: number;
  width?: string | number;
  height?: string | number;
  animated?: boolean;
}

const VARIANT_STYLES: Record<SkeletonVariant, { container: React.CSSProperties; children?: React.CSSProperties }> = {
  card: {
    container: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "6px",
      padding: "20px 24px",
    },
  },
  row: {
    container: {
      height: "12px",
      borderRadius: "6px",
      width: "100%",
    },
  },
  avatar: {
    container: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
    },
  },
  chart: {
    container: {
      width: "100%",
      height: "200px",
      borderRadius: "6px",
    },
  },
  text: {
    container: {
      height: "12px",
      borderRadius: "4px",
      width: "100%",
    },
  },
  title: {
    container: {
      height: "24px",
      borderRadius: "4px",
      width: "60%",
    },
  },
  button: {
    container: {
      height: "36px",
      borderRadius: "6px",
      width: "100px",
    },
  },
  badge: {
    container: {
      height: "20px",
      borderRadius: "10px",
      width: "60px",
    },
  },
  table: {
    container: {
      width: "100%",
      borderCollapse: "collapse",
    },
  },
  list: {
    container: {
      width: "100%",
    },
  },
};

const shimmerKeyframes = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

function SkeletonLine({ width = "100%", height = "12px" }: { width?: string | number; height?: string | number }) {
  return (
    <div
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: typeof width === "number" ? `${width}px` : width,
        borderRadius: "4px",
        background: `linear-gradient(90deg, 
          rgba(30, 50, 72, 0.8) 0%, 
          rgba(45, 70, 100, 0.4) 50%, 
          rgba(30, 50, 72, 0.8) 100%
        )`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s infinite",
        marginBottom: "8px",
      }}
    />
  );
}

export default function SkeletonLoader({
  variant = "text",
  count = 1,
  width,
  height,
  animated = true,
}: SkeletonLoaderProps) {
  const variantStyle = VARIANT_STYLES[variant];

  const renderContent = () => {
    switch (variant) {
      case "card":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <SkeletonLine width={40} height={40} />
              <div style={{ flex: 1 }}>
                <SkeletonLine width="40%" height={16} />
                <SkeletonLine width="25%" height={12} />
              </div>
            </div>
            <SkeletonLine />
            <SkeletonLine width="80%" />
            <SkeletonLine width="60%" />
          </div>
        );

      case "row":
        return (
          <>
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonLine key={i} width="100%" height={12} />
            ))}
          </>
        );

      case "avatar":
        return (
          <div
            style={{
              width: typeof width === "number" ? `${width}px` : width ?? "40px",
              height: typeof height === "number" ? `${height}px` : height ?? "40px",
              borderRadius: "50%",
              background: `linear-gradient(90deg, 
                rgba(30, 50, 72, 0.8) 0%, 
                rgba(45, 70, 100, 0.4) 50%, 
                rgba(30, 50, 72, 0.8) 100%
              )`,
              backgroundSize: "200% 100%",
              animation: animated ? "shimmer 1.6s infinite" : "none",
            }}
          />
        );

      case "chart":
        return (
          <div
            style={{
              width: "100%",
              height: "200px",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-around",
              padding: "20px",
              background: `linear-gradient(90deg, 
                rgba(30, 50, 72, 0.8) 0%, 
                rgba(45, 70, 100, 0.4) 50%, 
                rgba(30, 50, 72, 0.8) 100%
              )`,
              backgroundSize: "200% 100%",
              animation: animated ? "shimmer 1.6s infinite" : "none",
              borderRadius: "6px",
            }}
          >
            {[40, 65, 45, 80, 55, 70, 45].map((h, i) => (
              <div
                key={i}
                style={{
                  width: "8%",
                  height: `${h}%`,
                  background: "var(--border)",
                  borderRadius: "2px 2px 0 0",
                }}
              />
            ))}
          </div>
        );

      case "text":
        return (
          <>
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonLine
                key={i}
                width={i === count - 1 && count > 1 ? "70%" : "100%"}
                height={typeof height === "number" ? height : 12}
              />
            ))}
          </>
        );

      case "title":
        return (
          <SkeletonLine
            width={typeof width === "number" ? `${width}px` : width ?? "60%"}
            height={typeof height === "number" ? height : 24}
          />
        );

      case "button":
        return (
          <div
            style={{
              height: typeof height === "number" ? `${height}px` : height ?? "36px",
              width: typeof width === "number" ? `${width}px` : width ?? "100px",
              borderRadius: "6px",
              background: `linear-gradient(90deg, 
                rgba(30, 50, 72, 0.8) 0%, 
                rgba(45, 70, 100, 0.4) 50%, 
                rgba(30, 50, 72, 0.8) 100%
              )`,
              backgroundSize: "200% 100%",
              animation: animated ? "shimmer 1.6s infinite" : "none",
            }}
          />
        );

      case "badge":
        return (
          <div
            style={{
              height: typeof height === "number" ? `${height}px` : height ?? "20px",
              width: typeof width === "number" ? `${width}px` : width ?? "60px",
              borderRadius: "10px",
              background: `linear-gradient(90deg, 
                rgba(30, 50, 72, 0.8) 0%, 
                rgba(45, 70, 100, 0.4) 50%, 
                rgba(30, 50, 72, 0.8) 100%
              )`,
              backgroundSize: "200% 100%",
              animation: animated ? "shimmer 1.6s infinite" : "none",
            }}
          />
        );

      case "table":
        return (
          <div style={{ width: "100%", overflow: "hidden" }}>
            {/* Header row */}
            <div style={{ display: "flex", gap: "16px", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              {[25, 20, 15, 20, 20].map((w, i) => (
                <SkeletonLine key={`h-${i}`} width={`${w}%`} height={12} />
              ))}
            </div>
            {/* Data rows */}
            {Array.from({ length: count ?? 5 }).map((_, rowIdx) => (
              <div key={rowIdx} style={{ display: "flex", gap: "16px", padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
                {[25, 20, 15, 20, 20].map((w, colIdx) => (
                  <SkeletonLine key={`${rowIdx}-${colIdx}`} width={`${w}%`} height={12} />
                ))}
              </div>
            ))}
          </div>
        );

      case "list":
        return (
          <div style={{ width: "100%" }}>
            {Array.from({ length: count ?? 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", padding: "12px 0", alignItems: "center" }}>
                <SkeletonLine width={32} height={32} />
                <div style={{ flex: 1 }}>
                  <SkeletonLine width="40%" height={14} />
                  <SkeletonLine width="25%" height={10} />
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <>
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonLine key={i} width="100%" height={12} />
            ))}
          </>
        );
    }
  };

  return (
    <>
      <style>{shimmerKeyframes}</style>
      <div
        style={{
          ...variantStyle.container,
          width: width ?? variantStyle.container.width,
          height: height ?? variantStyle.container.height,
          overflow: "hidden",
        }}
      >
        {renderContent()}
      </div>
    </>
  );
}

// Convenience component for common loading states
export function CardSkeleton() {
  return <SkeletonLoader variant="card" />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return <SkeletonLoader variant="table" count={rows} />;
}

export function ListSkeleton({ items = 4 }: { items?: number }) {
  return <SkeletonLoader variant="list" count={items} />;
}

export function ChartSkeleton() {
  return <SkeletonLoader variant="chart" />;
}

export function FeedSkeleton({ posts = 3 }: { posts?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {Array.from({ length: posts }).map((_, i) => (
        <SkeletonLoader key={i} variant="card" />
      ))}
    </div>
  );
}
