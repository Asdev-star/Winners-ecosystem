interface Recommendation {
  label: string;
  url: string;
}

interface Props {
  greeting: string;
  title: string;
  dateLabel: string;
  message: string;
  recommendations: Recommendation[];
  onNavigate: (path: string) => void;
}

export default function OMEGABriefingCard({
  greeting,
  title,
  dateLabel,
  message,
  recommendations,
  onNavigate,
}: Props) {
  return (
    <div className="omega-panel omega-briefing-card">
      <div className="omega-briefing-head">
        <div className="omega-briefing-title">
          <div className="omega-omega-mark">🧠</div>
          <div>
            <p className="omega-kicker">{greeting}</p>
            <h1 className="omega-headline">{title}</h1>
          </div>
        </div>
        <div className="omega-briefing-date">{dateLabel}</div>
      </div>

      <p className="omega-briefing-message">"{message}"</p>

      <div className="omega-recommend-box">
        <p className="omega-card-label">OMEGA recommends today</p>
        {recommendations.map((item, index) => (
          <div className="omega-rec-row" key={item.label}>
            <span className="omega-rec-number">{index + 1}.</span>
            <p className="omega-rec-copy">{item.label}</p>
            <button className="omega-rec-btn" onClick={() => onNavigate(item.url)}>
              {index === 0 ? "View Match" : index === 1 ? "Continue Course" : "Open"}
            </button>
          </div>
        ))}
      </div>

      <div className="omega-actions">
        <button className="omega-button primary" onClick={() => onNavigate("/intelligence")}>Ask OMEGA About This</button>
        <button className="omega-button" onClick={() => onNavigate("/intelligence")}>View Full Briefing</button>
        <button className="omega-button" onClick={() => onNavigate("/home")}>Dismiss</button>
      </div>
    </div>
  );
}
