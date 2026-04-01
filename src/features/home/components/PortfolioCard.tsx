interface Props {
  initials: string;
  name: string;
  planLabel: string;
  score: number;
  trustTierLabel: string;
  headline: string;
  skills: string[];
  certificates: number;
  earned: number;
  contractsCompleted: number;
  followers: number;
  posts: number;
  endorsements: number;
  onNavigate: (path: string) => void;
}

export default function PortfolioCard({
  initials,
  name,
  planLabel,
  score,
  trustTierLabel,
  headline,
  skills,
  certificates,
  earned,
  contractsCompleted,
  followers,
  posts,
  endorsements,
  onNavigate,
}: Props) {
  return (
    <article className="omega-panel omega-achievement-card">
      <div className="omega-portfolio-hero">
        <div className="omega-portfolio-head">
          <div className="omega-avatar">{initials}</div>
          <div className="omega-portfolio-meta">
            <div>
              <p className="omega-card-label">🧑 {name.toUpperCase()} · Your Ecosystem Portfolio</p>
              <h3 className="omega-portfolio-title">{name}</h3>
            </div>
            <p className="omega-card-copy">{headline}</p>
            <p className="omega-card-copy">Trust Score: {score} · {trustTierLabel} · {planLabel} plan</p>
          </div>
        </div>
        <button className="omega-button" onClick={() => onNavigate("/profile")}>Share Profile</button>
      </div>

      <div className="omega-portfolio-grid">
        <div className="omega-portfolio-columns">
          <div className="omega-quick-card">
            <p className="omega-card-label">Certificates</p>
            <p className="omega-card-copy">{certificates} Academy certificates are already strengthening your public proof of skill.</p>
          </div>
          <div className="omega-quick-card">
            <p className="omega-card-label">Skills Verified By NOVA</p>
            <div className="omega-pill-row">
              {skills.map((skill) => (
                <span className="omega-skill-pill" key={skill}>{skill}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="omega-portfolio-columns">
          <div className="omega-quick-card">
            <p className="omega-card-label">Work History</p>
            <p className="omega-card-copy">✅ {contractsCompleted} contracts completed · ${earned.toLocaleString()} earned · 4.9★ average rating</p>
          </div>
          <div className="omega-quick-card">
            <p className="omega-card-label">Community</p>
            <p className="omega-card-copy">{followers} followers · {posts} posts · Skill endorsements: {endorsements}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
