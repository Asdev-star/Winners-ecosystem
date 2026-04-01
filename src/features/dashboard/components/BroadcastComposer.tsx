type LoopFeedEntry = {
  id: string;
  userName: string;
  tenantName: string;
  stageLabel: string;
  status: "active" | "completed";
  summary: string;
  revenueImpact: number;
  updatedAt: string;
};

type Props = {
  loopFeed: LoopFeedEntry[];
  refreshing: boolean;
  onRefresh: () => void;
  relativeTime: (value: string) => string;
  money: (value: number) => string;
};

export default function BroadcastComposer({ loopFeed, refreshing, onRefresh, relativeTime, money }: Props) {
  return (
    <div className="aov-panel">
      <div className="aov-head">
        <div>
          <div className="aov-kicker">Agentic Loop Live Feed</div>
          <h2 className="aov-title">Active loops first, completed below</h2>
        </div>
        <button className="aov-mini-link" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {loopFeed.length === 0 ? (
        <div className="aov-empty">No live loop activity yet.</div>
      ) : (
        <div className="aov-feed">
          {loopFeed.map((entry) => (
            <div key={entry.id} className={`aov-item loop ${entry.status}`}>
              <div className="aov-item-top">
                <div className="aov-item-title">
                  {entry.status === "active" ? "[LIVE]" : "[DONE]"} {entry.userName}
                </div>
                <div className="aov-time">{relativeTime(entry.updatedAt)}</div>
              </div>
              <div className="aov-copy">{entry.summary}</div>
              <div className="aov-meta">
                <span className="aov-chip">{entry.stageLabel}</span>
                <span className="aov-chip">{entry.tenantName}</span>
                {entry.revenueImpact > 0 ? <span className="aov-chip">{money(entry.revenueImpact)} unlocked</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
