type OmegaSignalFeedEntry = {
  id: string;
  supervisorEmoji: string;
  title: string;
  message: string;
  layerName: string;
  supervisor: string;
  createdAt: string;
  onSelect?: () => void;
};

type Props = {
  entries: OmegaSignalFeedEntry[];
};

const css = `
  .osf-feed{
    display:grid;
    gap:12px;
  }
  .osf-item{
    width:100%;
    padding:14px;
    border-radius:16px;
    border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.03);
    color:var(--text);
    text-align:left;
    cursor:pointer;
  }
  .osf-item.static{
    cursor:default;
  }
  .osf-top{
    display:flex;
    justify-content:space-between;
    gap:12px;
    align-items:center;
    margin-bottom:8px;
  }
  .osf-icon{
    font-size:18px;
  }
  .osf-time{
    color:var(--text-dim);
    font-family:"Space Mono", monospace;
    font-size:10px;
    white-space:nowrap;
  }
  .osf-copy{
    color:var(--text-dim);
    font-size:13px;
    line-height:1.6;
  }
  .osf-copy strong{
    color:var(--text);
  }
  .osf-meta{
    display:flex;
    gap:8px;
    flex-wrap:wrap;
    margin-top:10px;
  }
  .osf-chip{
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

export type { OmegaSignalFeedEntry };

export default function OmegaSignalFeed({ entries }: Props) {
  return (
    <>
      <style>{css}</style>
      <div className="osf-feed">
        {entries.map((entry) => {
          const isClickable = typeof entry.onSelect === "function";
          const Element = isClickable ? "button" : "div";

          return (
            <Element
              key={entry.id}
              className={`osf-item${isClickable ? "" : " static"}`}
              {...(isClickable ? { type: "button", onClick: entry.onSelect } : {})}
            >
              <div className="osf-top">
                <div className="osf-icon">{entry.supervisorEmoji}</div>
                <div className="osf-time">{relativeTime(entry.createdAt)}</div>
              </div>
              <div className="osf-copy">
                <strong>{entry.title}</strong>
                <div style={{ marginTop: 6 }}>{entry.message}</div>
              </div>
              <div className="osf-meta">
                <span className="osf-chip">{entry.layerName}</span>
                <span className="osf-chip">{entry.supervisor}</span>
              </div>
            </Element>
          );
        })}
      </div>
    </>
  );
}
