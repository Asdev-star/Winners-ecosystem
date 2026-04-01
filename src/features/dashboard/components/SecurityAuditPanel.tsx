type ActivityEntry = {
  id: string;
  summary: string;
  createdAt: string;
};

type Props = {
  activityFeed: ActivityEntry[];
  actionDate: (value: string) => string;
};

export default function SecurityAuditPanel({ activityFeed, actionDate }: Props) {
  return (
    <div className="aov-panel">
      <div className="aov-head">
        <div>
          <div className="aov-kicker">Recent Activity Feed</div>
          <h2 className="aov-title">Last 20 admin-relevant events</h2>
        </div>
      </div>
      {activityFeed.length === 0 ? (
        <div className="aov-empty">No admin activity has been recorded yet.</div>
      ) : (
        <div className="aov-actions-list">
          {activityFeed.map((item) => (
            <div key={item.id} className="aov-row">
              <div className="aov-date">{actionDate(item.createdAt)}</div>
              <div>{item.summary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
