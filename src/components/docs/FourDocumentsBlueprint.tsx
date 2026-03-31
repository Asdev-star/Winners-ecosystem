import { Link } from "react-router-dom";

type DocumentKey =
  | "admin-dashboard"
  | "core-settings"
  | "user-home"
  | "settings";

type FourDocumentsBlueprintProps = {
  current: DocumentKey;
  adminEnabled?: boolean;
  compact?: boolean;
};

const css = `
  .fdb-root {
    margin-bottom: 18px;
    border: 1px solid rgba(201,168,76,0.16);
    border-radius: 16px;
    padding: 18px;
    background:
      radial-gradient(circle at top right, rgba(201,168,76,0.14), transparent 34%),
      linear-gradient(135deg, rgba(18,28,40,0.96), rgba(11,18,28,0.96));
    color: var(--text);
  }
  .fdb-root.compact {
    padding: 16px;
  }
  .fdb-kicker {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 8px;
  }
  .fdb-title {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.03em;
  }
  .fdb-copy {
    margin: 8px 0 0;
    max-width: 880px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-dim);
  }
  .fdb-grid {
    margin-top: 16px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .fdb-card {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px;
    background: rgba(255,255,255,0.03);
    display: grid;
    gap: 10px;
  }
  .fdb-card.active {
    border-color: rgba(201,168,76,0.34);
    background: rgba(201,168,76,0.08);
  }
  .fdb-card.locked {
    opacity: 0.78;
  }
  .fdb-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .fdb-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
  }
  .fdb-meta {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .fdb-pill {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    font-family: 'Space Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .fdb-pill.realm-admin,
  .fdb-pill.active {
    border-color: rgba(201,168,76,0.24);
    background: rgba(201,168,76,0.10);
    color: var(--gold);
  }
  .fdb-path {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--ice);
  }
  .fdb-desc {
    font-size: 12px;
    line-height: 1.55;
    color: var(--text-dim);
  }
  .fdb-link,
  .fdb-static {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(201,168,76,0.24);
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-decoration: none;
  }
  .fdb-link {
    background: rgba(201,168,76,0.10);
    color: var(--gold);
  }
  .fdb-static {
    background: rgba(255,255,255,0.03);
    border-color: var(--border);
    color: var(--text-dim);
  }
  @media (max-width: 760px) {
    .fdb-grid {
      grid-template-columns: 1fr;
    }
  }
`;

type DocumentConfig = {
  id: DocumentKey;
  name: string;
  path: string;
  realm: "admin" | "user";
  summary: string;
};

const DOCUMENTS: DocumentConfig[] = [
  {
    id: "admin-dashboard",
    name: "Admin Dashboard",
    path: "/dashboard",
    realm: "admin",
    summary: "Superadmin control tower for analytics, launches, tenants, users, and FORGE intelligence.",
  },
  {
    id: "core-settings",
    name: "Core Engine Settings",
    path: "/settings/core",
    realm: "admin",
    summary: "Master settings surface for ecosystem-wide controls, governance, and the experimental FORGE settings engine.",
  },
  {
    id: "user-home",
    name: "User Home",
    path: "/home",
    realm: "user",
    summary: "OMEGA-led orientation dashboard for portfolio context, resumption, and cross-layer guidance.",
  },
  {
    id: "settings",
    name: "Settings",
    path: "/settings",
    realm: "user",
    summary: "Hierarchical settings entry point that should flow from core preferences into layer and platform controls.",
  },
];

export default function FourDocumentsBlueprint({
  current,
  adminEnabled = false,
  compact = false,
}: FourDocumentsBlueprintProps) {
  return (
    <section className={`fdb-root${compact ? " compact" : ""}`}>
      <style>{css}</style>
      <div className="fdb-kicker">System Overview</div>
      <h2 className="fdb-title">The Four Canonical Documents</h2>
      <p className="fdb-copy">
        These four routes define the two-realm structure of Winners Ecosystem: sovereign admin control on one side and guided authenticated user experience on the other.
      </p>

      <div className="fdb-grid">
        {DOCUMENTS.map((doc) => {
          const active = doc.id === current;
          const unlocked = doc.realm === "user" || adminEnabled;

          return (
            <article
              key={doc.id}
              className={`fdb-card${active ? " active" : ""}${!unlocked ? " locked" : ""}`}
            >
              <div className="fdb-row">
                <div>
                  <div className="fdb-name">{doc.name}</div>
                  <div className="fdb-meta">{doc.realm === "admin" ? "Admin Realm" : "User Realm"}</div>
                </div>
                <span className={`fdb-pill realm-${doc.realm}${active ? " active" : ""}`}>
                  {active ? "Current" : doc.realm === "admin" ? "Superadmin" : "Authenticated"}
                </span>
              </div>

              <div className="fdb-path">{doc.path}</div>
              <div className="fdb-desc">{doc.summary}</div>

              {unlocked ? (
                <Link className="fdb-link" to={doc.path}>
                  Open Document
                </Link>
              ) : (
                <div className="fdb-static">Admin Only Surface</div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
