interface EcosystemItem {
  icon: string;
  label: string;
  state: "live" | "preview" | "locked";
  note: string;
  cta: string;
  path: string;
}

interface Props {
  items: readonly EcosystemItem[];
  onNavigate: (path: string) => void;
}

export default function EcosystemStatusBar({ items, onNavigate }: Props) {
  return (
    <div className="omega-ecosystem-grid">
      {items.map((item) => (
        <article className="omega-ecosystem-card" key={item.label}>
          <div className="omega-ecosystem-top">
            <div>
              <p className="omega-card-label">
                {item.state === "live" ? "✅ Live" : item.state === "preview" ? "🔶 Preview" : "🔒 Locked"}
              </p>
              <h3 className="omega-layer-title">{item.icon} {item.label}</h3>
            </div>
            <span className={`omega-state-badge ${item.state}`}>
              {item.state === "live" ? "Live" : item.state === "preview" ? "Soon" : "Locked"}
            </span>
          </div>
          <p className="omega-layer-copy">{item.note}</p>
          <button className="omega-inline-link" onClick={() => onNavigate(item.path)}>{item.cta}</button>
        </article>
      ))}
    </div>
  );
}
