type SeriesPoint = {
  label: string;
  value: number;
  detail?: string;
};

type Props = {
  downloads?: number;
  sessions?: number;
  iosSessions?: number;
  androidSessions?: number;
  errorReports?: number;
  series?: SeriesPoint[];
};

export default function MobileAnalyticsChart({
  downloads = 0,
  sessions = 0,
  iosSessions = 0,
  androidSessions = 0,
  errorReports = 0,
  series,
}: Props) {
  const bars =
    series ??
    [
      { label: "Downloads", value: downloads },
      { label: "Sessions", value: sessions },
      { label: "iOS", value: iosSessions },
      { label: "Android", value: androidSessions },
      { label: "Errors", value: errorReports },
    ];
  const max = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <div className="ascharts">
      {bars.map((bar) => (
        <div key={bar.label} className="ascharts-row">
          <span title={bar.detail}>{bar.label}</span>
          <div className="ascharts-track">
            <div className="ascharts-fill" style={{ width: `${(bar.value / max) * 100}%` }} />
          </div>
          <strong>{bar.value}</strong>
        </div>
      ))}
    </div>
  );
}
