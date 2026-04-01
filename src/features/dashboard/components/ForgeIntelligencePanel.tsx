import { Link } from "react-router-dom";

type Props = {
  briefing: string;
  briefingStreaming: boolean;
  cadenceLabel: string;
  dismissed: boolean;
  onDismiss: () => void;
  onSchedule: () => void;
};

export default function ForgeIntelligencePanel({
  briefing,
  briefingStreaming,
  cadenceLabel,
  dismissed,
  onDismiss,
  onSchedule,
}: Props) {
  if (dismissed) return null;

  return (
    <section className="aov-brief">
      <div className="aov-brief-head">
        <div className="aov-kicker">FORGE · Morning Briefing</div>
        <div className="aov-brief-time">{cadenceLabel}</div>
      </div>
      <div className="aov-brief-copy">
        "{briefing || "Preparing the sovereign daily briefing..."}"
        {briefingStreaming ? <span className="aov-cursor" /> : null}
      </div>
      <div className="aov-brief-actions">
        <Link className="aov-link" to="/admin/forge">Ask FORGE →</Link>
        <Link className="aov-link ghost" to="/admin/forge">View Full Analysis</Link>
        <button className="aov-btn ghost" onClick={onSchedule}>Schedule Briefing</button>
        <button className="aov-btn ghost" onClick={onDismiss}>Dismiss</button>
      </div>
    </section>
  );
}
