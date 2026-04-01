type AdminSignal = {
  id: string;
  supervisor: string;
  supervisorEmoji: string;
  layerName: string;
  adminPath: string;
  title: string;
  message: string;
  createdAt: string;
};

type Props = {
  signals: AdminSignal[];
  relativeTime: (value: string) => string;
  onOpenSignal: (path: string) => void;
};

export default function SystemHealthPanel({ signals, relativeTime, onOpenSignal }: Props) {
  return (
    <div className="aov-panel">
      <div className="aov-head">
        <div>
          <div className="aov-kicker">OMEGA Cross-Layer Signals</div>
          <h2 className="aov-title">Last five supervisor handoffs</h2>
        </div>
      </div>
      {signals.length === 0 ? (
        <div className="aov-empty">No ecosystem signals have fired yet.</div>
      ) : (
        <div className="aov-feed">
          {signals.map((signal) => (
            <button key={signal.id} type="button" className="aov-item" onClick={() => onOpenSignal(signal.adminPath)}>
              <div className="aov-item-top">
                <div className="aov-item-title">{signal.supervisorEmoji}</div>
                <div className="aov-time">{relativeTime(signal.createdAt)}</div>
              </div>
              <div className="aov-copy">
                <strong style={{ color: "var(--text)" }}>{signal.title}</strong>
                <div style={{ marginTop: 6 }}>{signal.message}</div>
              </div>
              <div className="aov-meta">
                <span className="aov-chip">{signal.layerName}</span>
                <span className="aov-chip">{signal.supervisor}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
