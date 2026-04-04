import { getPlatformSsoTarget, getSsoLaunchError, startSsoLaunch } from "../../auth/ssoLaunch";

interface EcosystemItem {
  icon: string;
  label: string;
  state: "live" | "preview" | "locked";
  note: string;
  cta: string;
  path: string;
  /** When set and `VITE_SSO_*` targets a dedicated origin, show cross-app SSO launch. */
  ssoSourcePath?: string;
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
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" className="omega-inline-link" onClick={() => onNavigate(item.path)}>
              {item.cta}
            </button>
            {item.ssoSourcePath && getPlatformSsoTarget(item.ssoSourcePath) ? (
              <button
                type="button"
                className="omega-inline-link"
                style={{ opacity: 0.88 }}
                onClick={async () => {
                  const target = getPlatformSsoTarget(item.ssoSourcePath!);
                  if (!target) return;
                  try {
                    await startSsoLaunch({ targetOrigin: target, nextPath: item.path });
                  } catch (e) {
                    window.alert(getSsoLaunchError(e));
                  }
                }}
              >
                Continue with SSO →
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
