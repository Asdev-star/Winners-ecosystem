interface ResumptionCardItem {
  layer: string;
  title: string;
  sub: string;
  pct?: number;
  url: string;
  cta: string;
}

interface Props {
  summaryPoints: string[];
  resumePath: string;
  resumeTitle: string;
  resumeCopy: string;
  cards: ResumptionCardItem[];
  onNavigate: (path: string) => void;
}

export default function ResumptionCards({
  summaryPoints,
  resumePath,
  resumeTitle,
  resumeCopy,
  cards,
  onNavigate,
}: Props) {
  return (
    <>
      <div className="omega-quick-grid">
        <article className="omega-panel omega-resume-card">
          <p className="omega-card-label">What OMEGA is watching</p>
          <ul className="omega-list">
            {summaryPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>

        <article className="omega-panel omega-resume-card">
          <span className="omega-resume-path">Continue in {resumePath}</span>
          <h3 className="omega-resume-title">{resumeTitle}</h3>
          <p className="omega-card-copy">{resumeCopy}</p>
          <div className="omega-actions">
            <button className="omega-button primary" onClick={() => onNavigate(resumePath)}>Continue Now</button>
            <button className="omega-button" onClick={() => onNavigate("/community")}>Explore Community</button>
          </div>
        </article>
      </div>

      <div className="omega-status-grid">
        {cards.map((card) => (
          <article className="omega-stat-card" key={`${card.layer}-${card.title}`}>
            <p className="omega-card-label">{card.layer}</p>
            <p className="omega-focus-value">{card.title}</p>
            <p className="omega-card-copy">{card.sub}</p>
            {typeof card.pct === "number" ? <span className="omega-stat-chip">{card.pct}% complete</span> : null}
            <button className="omega-inline-link" onClick={() => onNavigate(card.url)}>{card.cta} →</button>
          </article>
        ))}
      </div>
    </>
  );
}
