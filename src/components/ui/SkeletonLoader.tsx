// Level I - Foundation Intelligence
// Skeleton Loader - Animated shimmer to replace all spinners
// Uses --surface2 token for shimmer as per design system

interface SkeletonLoaderProps {
  variant?: 'card' | 'row' | 'avatar' | 'chart' | 'text' | 'title';
  count?: number;
  width?: string;
  height?: string;
}

export default function SkeletonLoader({ 
  variant = 'card',
  count = 1,
  width,
  height 
}: SkeletonLoaderProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'card':
        return { width: '100%', height: '120px' };
      case 'row':
        return { width: '100%', height: '48px' };
      case 'avatar':
        return { width: '40px', height: '40px', borderRadius: '50%' };
      case 'chart':
        return { width: '100%', height: '200px' };
      case 'text':
        return { width: '80%', height: '16px' };
      case 'title':
        return { width: '60%', height: '24px' };
      default:
        return {};
    }
  };

  const baseStyles = {
    ...getVariantStyles(),
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return (
    <div className="skeleton-loader">
      <style>{`
        .skeleton-loader {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .skeleton-loader__item {
          background: linear-gradient(
            90deg,
            var(--surface2) 25%,
            var(--surface3) 50%,
            var(--surface2) 75%
          );
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s ease-in-out infinite;
          border-radius: 4px;
        }
        
        @keyframes skeleton-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        
        .skeleton-loader__item--card {
          border-radius: 6px;
          border: 1px solid var(--border);
        }
        
        .skeleton-loader__item--avatar {
          border-radius: 50%;
        }
        
        .skeleton-loader__item--text {
          border-radius: 2px;
        }
        
        .skeleton-loader__item--title {
          border-radius: 4px;
        }
      `}</style>
      
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`skeleton-loader__item skeleton-loader__item--${variant}`}
          style={baseStyles}
        />
      ))}
    </div>
  );
}

// Specialized skeleton components for common use cases

export function CardSkeleton() {
  return (
    <div className="card-skeleton">
      <style>{`
        .card-skeleton {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        
        .card-skeleton::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
        }
        
        .card-skeleton__header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .card-skeleton__avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }
        
        .card-skeleton__title {
          flex: 1;
        }
        
        .card-skeleton__line {
          height: 12px;
          border-radius: 2px;
          background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s ease-in-out infinite;
          margin-bottom: 8px;
        }
        
        .card-skeleton__line:last-child {
          margin-bottom: 0;
        }
        
        .card-skeleton__line--title {
          width: 60%;
          height: 16px;
        }
        
        .card-skeleton__line--text {
          width: 90%;
        }
        
        .card-skeleton__line--text-short {
          width: 70%;
        }
        
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      
      <div className="card-skeleton__header">
        <div className="card-skeleton__avatar" />
        <div className="card-skeleton__title">
          <div className="card-skeleton__line card-skeleton__line--title" />
        </div>
      </div>
      <div className="card-skeleton__line card-skeleton__line--text" />
      <div className="card-skeleton__line card-skeleton__line--text" />
      <div className="card-skeleton__line card-skeleton__line--text-short" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="table-row-skeleton">
      <style>{`
        .table-row-skeleton {
          display: flex;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid var(--border);
          gap: 16px;
        }
        
        .table-row-skeleton__cell {
          height: 16px;
          border-radius: 2px;
          background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }
        
        .table-row-skeleton__cell--checkbox {
          width: 18px;
          height: 18px;
          border-radius: 3px;
        }
        
        .table-row-skeleton__cell--avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }
        
        .table-row-skeleton__cell--name {
          flex: 1;
          min-width: 120px;
        }
        
        .table-row-skeleton__cell--email {
          flex: 1;
          min-width: 150px;
        }
        
        .table-row-skeleton__cell--status {
          width: 80px;
        }
        
        .table-row-skeleton__cell--action {
          width: 60px;
        }
        
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      
      <div className="table-row-skeleton__cell table-row-skeleton__cell--checkbox" />
      <div className="table-row-skeleton__cell table-row-skeleton__cell--avatar" />
      <div className="table-row-skeleton__cell table-row-skeleton__cell--name" />
      <div className="table-row-skeleton__cell table-row-skeleton__cell--email" />
      <div className="table-row-skeleton__cell table-row-skeleton__cell--status" />
      <div className="table-row-skeleton__cell table-row-skeleton__cell--action" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="chart-skeleton">
      <style>{`
        .chart-skeleton {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }
        
        .chart-skeleton::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
        }
        
        .chart-skeleton__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .chart-skeleton__title {
          width: 120px;
          height: 20px;
          border-radius: 4px;
          background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }
        
        .chart-skeleton__legend {
          display: flex;
          gap: 16px;
        }
        
        .chart-skeleton__legend-item {
          width: 60px;
          height: 12px;
          border-radius: 2px;
          background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }
        
        .chart-skeleton__body {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 160px;
        }
        
        .chart-skeleton__bar {
          flex: 1;
          border-radius: 4px 4px 0 0;
          background: linear-gradient(180deg, var(--surface3) 0%, var(--surface2) 100%);
          animation: chart-pulse 1.5s ease-in-out infinite;
        }
        
        .chart-skeleton__bar:nth-child(1) { height: 40%; animation-delay: 0s; }
        .chart-skeleton__bar:nth-child(2) { height: 60%; animation-delay: 0.1s; }
        .chart-skeleton__bar:nth-child(3) { height: 35%; animation-delay: 0.2s; }
        .chart-skeleton__bar:nth-child(4) { height: 75%; animation-delay: 0.3s; }
        .chart-skeleton__bar:nth-child(5) { height: 50%; animation-delay: 0.4s; }
        .chart-skeleton__bar:nth-child(6) { height: 85%; animation-delay: 0.5s; }
        .chart-skeleton__bar:nth-child(7) { height: 45%; animation-delay: 0.6s; }
        
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        @keyframes chart-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
      
      <div className="chart-skeleton__header">
        <div className="chart-skeleton__title" />
        <div className="chart-skeleton__legend">
          <div className="chart-skeleton__legend-item" />
          <div className="chart-skeleton__legend-item" />
        </div>
      </div>
      <div className="chart-skeleton__body">
        <div className="chart-skeleton__bar" />
        <div className="chart-skeleton__bar" />
        <div className="chart-skeleton__bar" />
        <div className="chart-skeleton__bar" />
        <div className="chart-skeleton__bar" />
        <div className="chart-skeleton__bar" />
        <div className="chart-skeleton__bar" />
      </div>
    </div>
  );
}

