type Props = {
  downloads: number;
  sessions: number;
  iosSessions: number;
  androidSessions: number;
  errorReports: number;
};

export default function MobileAnalyticsChart({ downloads, sessions, iosSessions, androidSessions, errorReports }: Props) {
  const max = Math.max(downloads, sessions, iosSessions, androidSessions, errorReports, 1);
  const bars = [
    { label: "Downloads", value: downloads },
    { label: "Sessions", value: sessions },
    { label: "iOS", value: iosSessions },
    { label: "Android", value: androidSessions },
    { label: "Errors", value: errorReports },
  ];

  return (
    <div className="ascharts">
      {bars.map((bar) => (
        <div key={bar.label} className="ascharts-row">
          <span>{bar.label}</span>
          <div className="ascharts-track">
            <div className="ascharts-fill" style={{ width: `${(bar.value / max) * 100}%` }} />
          </div>
          <strong>{bar.value}</strong>
        </div>
      ))}
    </div>
  );
}
