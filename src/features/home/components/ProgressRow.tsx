interface Props {
  loopStageNumber: number;
  nextLoopStep: string;
  score: number;
  trustTierLabel: string;
  trustGapLabel: string;
  certificates: number;
  activeCourses: number;
  courseCompletionAverage: number;
  onNavigate: (path: string) => void;
}

export default function ProgressRow({
  loopStageNumber,
  nextLoopStep,
  score,
  trustTierLabel,
  trustGapLabel,
  certificates,
  activeCourses,
  courseCompletionAverage,
  onNavigate,
}: Props) {
  return (
    <div className="omega-progress-row">
      <article className="omega-stat-card">
        <p className="omega-card-label">🔄 Agentic Loop</p>
        <p className="omega-stat-value">Stage {loopStageNumber} of 6</p>
        <div className="omega-mini-track"><div className="omega-mini-fill" style={{ width: `${(loopStageNumber / 6) * 100}%` }} /></div>
        <div className="omega-progress-copy">
          <p className="omega-card-copy">Next: {nextLoopStep}</p>
          <button className="omega-inline-link" onClick={() => onNavigate("/intelligence")}>View Loop →</button>
        </div>
      </article>

      <article className="omega-stat-card">
        <p className="omega-card-label">⭐ Trust Score</p>
        <p className="omega-stat-value">{score} · {trustTierLabel}</p>
        <div className="omega-mini-track"><div className="omega-mini-fill gold" style={{ width: `${score}%` }} /></div>
        <div className="omega-progress-copy">
          <p className="omega-card-copy">{trustGapLabel}</p>
          <button className="omega-inline-link" onClick={() => onNavigate("/profile")}>View Score →</button>
        </div>
      </article>

      <article className="omega-stat-card">
        <p className="omega-card-label">🎓 Learning</p>
        <p className="omega-stat-value">{certificates} certificates</p>
        <p className="omega-card-copy">{activeCourses} courses active</p>
        <div className="omega-mini-track"><div className="omega-mini-fill purple" style={{ width: `${courseCompletionAverage}%` }} /></div>
        <div className="omega-progress-copy">
          <p className="omega-card-copy">{courseCompletionAverage}% average completion</p>
          <button className="omega-inline-link" onClick={() => onNavigate("/academy")}>View Learning →</button>
        </div>
      </article>
    </div>
  );
}
