import { Link } from "react-router-dom";
import { API_BASE } from "../../lib/api";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&display=swap');

.act-root {
  max-width: 1160px;
  margin: 0 auto;
  padding: 24px 20px 80px;
  font-family: 'Syne', sans-serif;
  color: var(--text);
}
.act-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 18px;
  padding: 22px 24px;
  border-radius: 12px;
  border: 1px solid rgba(201, 168, 76, 0.18);
  background: linear-gradient(135deg, rgba(13, 24, 38, 0.94), rgba(17, 29, 46, 0.92));
}
.act-eyebrow {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 8px;
}
.act-title {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.04em;
}
.act-subtitle {
  margin: 8px 0 0;
  max-width: 760px;
  line-height: 1.6;
  color: var(--text-dim);
  font-size: 14px;
}
.act-header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
.act-button,
.act-link-button {
  border: 1px solid rgba(201, 168, 76, 0.28);
  background: rgba(201, 168, 76, 0.08);
  color: var(--gold);
  border-radius: 8px;
  padding: 10px 14px;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  text-decoration: none;
}
.act-button.ghost,
.act-link-button.ghost {
  border-color: var(--border);
  color: var(--text-dim);
  background: var(--surface);
}
.act-button.danger {
  border-color: rgba(224, 90, 78, 0.26);
  color: var(--red);
  background: rgba(224, 90, 78, 0.08);
}
.act-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.act-alert {
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(13, 24, 38, 0.72);
  font-size: 13px;
}
.act-alert.error {
  border-color: rgba(224, 90, 78, 0.24);
  color: #ffbbb4;
}
.act-alert.success {
  border-color: rgba(45, 212, 160, 0.24);
  color: #a7f3d0;
}
.act-section {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(13, 24, 38, 0.62);
}
.act-section-title {
  margin: 0 0 14px;
  font-size: 18px;
  font-weight: 700;
  color: var(--gold);
}
.act-grid {
  display: grid;
  gap: 18px;
}
.act-card {
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(13, 24, 38, 0.62);
}
.act-card.wide {
  grid-column: 1 / -1;
}
.act-command-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}
.act-command {
  display: block;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: rgba(17, 29, 46, 0.8);
  text-decoration: none;
  transition: all 0.2s ease;
  color: var(--text);
}
.act-command:hover {
  border-color: rgba(201, 168, 76, 0.4);
  background: rgba(201, 168, 76, 0.06);
  transform: translateY(-1px);
}
.act-command-icon {
  font-size: 24px;
  margin-bottom: 8px;
}
.act-command-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--gold);
}
.act-command-desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-dim);
}
.act-mini-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.act-mini-row:last-child {
  border-bottom: none;
}
.act-mini-label {
  font-size: 12px;
  color: var(--text-dim);
  font-family: 'Space Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.act-mini-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}
`;

function AdminConsoleShell({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="act-root">
      <style>{css}</style>
      <div className="act-header">
        <div>
          <div className="act-eyebrow">{eyebrow}</div>
          <h1 className="act-title">{title}</h1>
          <p className="act-subtitle">{subtitle}</p>
        </div>
        {actions ? <div className="act-header-actions">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function CoreSettingsPage() {
  return (
    <AdminConsoleShell
      eyebrow="Admin / Core Settings"
      title="Ecosystem Engine Control"
      subtitle="Master control for all ecosystem settings + experimental FORGE AI intelligent settings engine."
    >
      <div className="act-grid">
        <div className="act-card wide">
          <div className="act-section-title">Connected Surfaces</div>
          <div className="act-command-grid">
            <Link to="/settings" className="act-command">
              <div className="act-command-icon">⚙</div>
              <div className="act-command-title">Workspace Settings</div>
              <div className="act-command-desc">Brand, tenant, and primary workspace controls.</div>
            </Link>
            <Link to="/stripe" className="act-command">
              <div className="act-command-icon">💳</div>
              <div className="act-command-title">Stripe</div>
              <div className="act-command-desc">Billing status and revenue integrations.</div>
            </Link>
            <Link to="/slack" className="act-command">
              <div className="act-command-icon">💬</div>
              <div className="act-command-title">Slack</div>
              <div className="act-command-desc">Operator channel delivery and alerts.</div>
            </Link>
            <Link to="/changelog" className="act-command">
              <div className="act-command-icon">🗞</div>
              <div className="act-command-title">Changelog</div>
              <div className="act-command-desc">Platform release notes and governance messaging.</div>
            </Link>
            <Link to="/cloud/keys" className="act-command">
              <div className="act-command-icon">🔑</div>
              <div className="act-command-title">API Keys</div>
              <div className="act-command-desc">Developer platform credentials and key inventory.</div>
            </Link>
          </div>
        </div>
        <div className="act-card wide">
          <div className="act-section-title">Core Engine Status</div>
          <div className="act-mini-row"><span className="act-mini-label">Canonical base route</span><span className="act-mini-value">/settings/core</span></div>
          <div className="act-mini-row"><span className="act-mini-label">Access level</span><span className="act-mini-value">SUPERADMIN only</span></div>
          <div className="act-mini-row"><span className="act-mini-label">API base</span><span className="act-mini-value">{API_BASE}</span></div>
          <div className="act-mini-row"><span className="act-mini-label">FORGE AI status</span><span className="act-mini-value">Experimental</span></div>
        </div>
      </div>
    </AdminConsoleShell>
  );
}