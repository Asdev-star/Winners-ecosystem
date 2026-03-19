type AgenticLoopFeedEntry = {
  id: string;
  userName: string;
  tenantName: string;
  stageLabel: string;
  status: string;
  summary: string;
  revenueImpact?: number;
  updatedAt: string;
};

type Props = {
  entries: AgenticLoopFeedEntry[];
};

const css = `
  .alf-feed{
    display:grid;
    gap:12px;
  }
  .alf-item{
    padding:14px;
    border-radius:16px;
    border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.03);
  }
  .alf-item.active{
    border-color:rgba(45,212,160,.26);
    background:rgba(45,212,160,.08);
  }
  .alf-top{
    display:flex;
    justify-content:space-between;
    gap:12px;
    align-items:center;
    margin-bottom:8px;
  }
  .alf-title{
    font-size:14px;
    font-weight:700;
  }
  .alf-time{
    color:var(--text-dim);
    font-family:"Space Mono", monospace;
    font-size:10px;
    white-space:nowrap;
  }
  .alf-copy{
    color:var(--text-dim);
    font-size:13px;
    line-height:1.6;
  }
  .alf-meta{
    display:flex;
    gap:8px;
    flex-wrap:wrap;
    margin-top:10px;
  }
  .alf-chip{
    display:inline-flex;
    align-items:center;
    padding:4px 8px;
    border-radius:999px;
    border:1px solid rgba(201,168,76,.18);
    background:rgba(201,168,76,.08);
    color:var(--gold);
    font-family:"Space Mono", monospace;
    font-size:9px;
    letter-spacing:.06em;
    text-transform:uppercase;
  }
`;

function relativeTime(value: string) {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const fmt = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (abs < 60 * 1000) return fmt.format(Math.round(diffMs / 1000), "second");
  if (abs < 60 * 60 * 1000) return fmt.format(Math.round(diffMs / (60 * 1000)), "minute");
  if (abs < 24 * 60 * 60 * 1000) return fmt.format(Math.round(diffMs / (60 * 60 * 1000)), "hour");
  return fmt.format(Math.round(diffMs / (24 * 60 * 60 * 1000)), "day");
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

export type { AgenticLoopFeedEntry };

export default function AgenticLoopFeed({ entries }: Props) {
  return (
    <>
      <style>{css}</style>
      <div className="alf-feed">
        {entries.map((entry) => (
          <div key={entry.id} className={`alf-item${entry.status === "active" ? " active" : ""}`}>
            <div className="alf-top">
              <div className="alf-title">
                {entry.status === "active" ? "[LIVE]" : "[DONE]"} {entry.userName}
              </div>
              <div className="alf-time">{relativeTime(entry.updatedAt)}</div>
            </div>
            <div className="alf-copy">{entry.summary}</div>
            <div className="alf-meta">
              <span className="alf-chip">{entry.stageLabel}</span>
              <span className="alf-chip">{entry.tenantName}</span>
              {entry.revenueImpact ? <span className="alf-chip">{money(entry.revenueImpact)} unlocked</span> : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
