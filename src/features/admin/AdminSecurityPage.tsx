import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";

type SecurityTone = "healthy" | "warning" | "critical";

type SecuritySnapshot = {
  generatedAt: string;
  securityStatus: Array<{
    id: string;
    label: string;
    tone: SecurityTone;
    summary: string;
    actionLabel?: string;
  }>;
  auditLog: Array<{
    id: string;
    createdAt: string;
    actorEmail: string;
    summary: string;
    action: string;
  }>;
  jwt: {
    expiry: string;
    refresh: string;
    rotation: string;
  };
  sessionSummary: {
    activeSessions: number;
    activeUsers: number;
  };
  sessions: Array<{
    id: string;
    userId: string;
    userLabel: string;
    platform: string;
    lastSeen: string;
    createdAt: string;
  }>;
  twoFactor: {
    enabledUsers: number;
    adoptionRate: number;
  };
  rateLimits: Array<{
    route: string;
    scope: string;
    status: SecurityTone;
  }>;
  gdpr: {
    deletionRequestsPending: number;
    exportRequestsPending: number;
    privacyAcknowledgmentLabel: string;
    privacyAcknowledgmentTone: SecurityTone;
    note: string;
    consentLogs: Array<{
      id: string;
      userId: string;
      policyVersion: string;
      acknowledgedAt: string;
    }>;
  };
  sensitiveActions: Array<{
    id: string;
    createdAt: string;
    actorEmail: string;
    summary: string;
    action: string;
  }>;
  suspiciousActivity: Array<{
    id: string;
    title: string;
    detail: string;
    tone: SecurityTone;
    createdAt: string;
  }>;
  forgeAssistant: {
    summary: string;
    recommendedAction: string;
  };
  finding: {
    tone: SecurityTone;
    title: string;
    summary: string;
    sourcePath: string;
    supportingPath: string | null;
  };
};

const css = `
  .asc-page{max-width:1420px;margin:0 auto;padding:28px 22px 92px;color:var(--text);font-family:'Syne',sans-serif}
  .asc-shell{border:1px solid rgba(201,168,76,.18);border-radius:30px;overflow:hidden;background:radial-gradient(circle at top right, rgba(201,168,76,.1), transparent 28%),radial-gradient(circle at bottom left, rgba(137,196,225,.08), transparent 24%),linear-gradient(180deg, rgba(7,13,21,.99), rgba(11,19,30,.98));box-shadow:0 30px 90px rgba(0,0,0,.34)}
  .asc-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:20px 24px 22px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(6,11,18,.8)}
  .asc-kicker,.asc-mini{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold)}
  .asc-title{margin:10px 0 0;font-size:clamp(28px,4vw,42px);letter-spacing:-.05em;line-height:1}
  .asc-subtitle,.asc-sub{margin:12px 0 0;max-width:760px;color:var(--text-dim);font-size:14px;line-height:1.65}
  .asc-actions,.asc-row-actions,.asc-meta{display:flex;gap:10px;flex-wrap:wrap}
  .asc-link,.asc-btn,.asc-pill{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border-radius:999px;border:1px solid rgba(201,168,76,.22);background:rgba(201,168,76,.08);color:var(--gold);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;cursor:pointer}
  .asc-link.ghost,.asc-btn.ghost,.asc-pill{border-color:var(--border);background:rgba(255,255,255,.03);color:var(--text-dim)}
  .asc-btn:disabled{opacity:.6;cursor:not-allowed}
  .asc-body{padding:24px;display:grid;gap:18px}
  .asc-panel{border:1px solid rgba(255,255,255,.08);border-radius:24px;background:linear-gradient(180deg, rgba(17,27,39,.94), rgba(10,17,27,.94));padding:18px}
  .asc-panel-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}
  .asc-panel-title{margin:0;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
  .asc-status-list,.asc-audit-list,.asc-grid{display:grid;gap:12px}
  .asc-status{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:flex-start;padding:16px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}
  .asc-status-title{font-size:15px;font-weight:800;color:var(--text)}
  .asc-status-summary,.asc-audit-meta,.asc-empty{margin-top:8px;color:var(--text-dim);font-size:13px;line-height:1.6}
  .asc-tone{display:inline-flex;align-items:center;gap:8px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
  .asc-dot{width:10px;height:10px;border-radius:999px;background:var(--green);box-shadow:0 0 14px rgba(45,212,160,.34)}
  .asc-dot.warning{background:var(--gold);box-shadow:0 0 14px rgba(201,168,76,.34)}
  .asc-dot.critical{background:var(--red);box-shadow:0 0 14px rgba(224,90,78,.34)}
  .asc-audit{display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:flex-start;padding:16px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}
  .asc-time{min-width:112px;color:var(--gold);font-family:'Space Mono',monospace;font-size:11px;line-height:1.5}
  .asc-grid{grid-template-columns:1fr 1fr}
  .asc-gdpr-stat{padding:16px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}
  .asc-stat-label{color:var(--text-dim);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.09em;text-transform:uppercase}
  .asc-stat-value{margin-top:10px;font-size:28px;font-weight:800;letter-spacing:-.05em}
  .asc-note,.asc-error{padding:14px 16px;border-radius:18px;font-size:13px;line-height:1.6}
  .asc-note{border:1px solid rgba(201,168,76,.2);background:rgba(201,168,76,.08);color:var(--gold)}
  .asc-error{border:1px solid rgba(224,90,78,.2);background:rgba(224,90,78,.08);color:#FFB0A7}
  .asc-code{padding:16px;border-radius:18px;border:1px solid rgba(201,168,76,.16);background:linear-gradient(180deg, rgba(201,168,76,.08), rgba(255,255,255,.02))}
  .asc-code-path{display:block;color:var(--text);font-family:'Space Mono',monospace;font-size:12px;line-height:1.7}
  .asc-load{display:grid;gap:14px}
  .asc-skel{height:120px;border-radius:24px;background:linear-gradient(90deg, rgba(255,255,255,.03), rgba(255,255,255,.08), rgba(255,255,255,.03));background-size:200% 100%;animation:asc-shimmer 1.2s linear infinite}
  @keyframes asc-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
  @media (max-width:980px){.asc-grid{grid-template-columns:1fr}.asc-audit{grid-template-columns:1fr}.asc-status{grid-template-columns:1fr}}
  @media (max-width:760px){.asc-page{padding:18px 12px 84px}.asc-head,.asc-body{padding:16px}.asc-head{flex-direction:column}}
`;

function relativeTime(value: string) {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const fmt = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (absMs < 60_000) return fmt.format(Math.round(diffMs / 1000), "second");
  if (absMs < 3_600_000) return fmt.format(Math.round(diffMs / 60_000), "minute");
  if (absMs < 86_400_000) return fmt.format(Math.round(diffMs / 3_600_000), "hour");
  return fmt.format(Math.round(diffMs / 86_400_000), "day");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toneLabel(tone: SecurityTone) {
  return tone === "healthy" ? "OK" : tone === "warning" ? "Attention" : "Critical";
}

export default function AdminSecurityPage() {
  const [snapshot, setSnapshot] = useState<SecuritySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState("");
  const [showFix, setShowFix] = useState(false);
  const [showGdprNote, setShowGdprNote] = useState(false);
  const [showForge, setShowForge] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load(initial = false) {
      try {
        if (initial) setLoading(true);
        else setRefreshing(true);
        const res = await fetch(`${API_BASE}/admin/security/panel`, { headers: getAuthHeaders() });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? "Failed to load security console");
        }
        if (!active) return;
        setSnapshot(body as SecuritySnapshot);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load security console");
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void load(true);
    const id = window.setInterval(() => void load(false), 30_000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(""), 2800);
    return () => window.clearTimeout(id);
  }, [note]);

  async function refreshPanel() {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/security/panel`, { headers: getAuthHeaders() });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? "Failed to refresh security console");
      }
      setSnapshot(body as SecuritySnapshot);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh security console");
    } finally {
      setRefreshing(false);
    }
  }

  async function verifyRls() {
    setVerifying(true);
    try {
      const res = await fetch(`${API_BASE}/admin/health/verify-rls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? "Failed to verify RLS");
      }
      setNote("RLS verification checkpoint recorded.");
      setError("");
      await refreshPanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify RLS");
    } finally {
      setVerifying(false);
    }
  }

  async function exportAuditLog() {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/security/audit/export`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? "Failed to export audit log");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `admin-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setNote("Admin audit log exported.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export audit log");
    } finally {
      setExporting(false);
    }
  }

  async function scanSecurityIssues() {
    setScanning(true);
    try {
      await refreshPanel();
      setShowForge(true);
      setNote("FORGE security scan refreshed.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run FORGE security scan");
    } finally {
      setScanning(false);
    }
  }

  async function revokeSession(sessionId: string) {
    setRevokingSessionId(sessionId);
    try {
      const res = await fetch(`${API_BASE}/admin/security/sessions/${sessionId}/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? "Failed to revoke session");
      }
      setNote("Session revoked.");
      setError("");
      await refreshPanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke session");
    } finally {
      setRevokingSessionId("");
    }
  }

  if (loading && !snapshot) {
    return (
      <div className="asc-page">
        <style>{css}</style>
        <div className="asc-load">
          <div className="asc-skel" />
          <div className="asc-skel" />
          <div className="asc-skel" />
        </div>
      </div>
    );
  }

  return (
    <div className="asc-page">
      <style>{css}</style>

      <div className="asc-shell">
        <div className="asc-head">
          <div>
            <div className="asc-kicker">Admin / Security / Route: /admin/security</div>
            <h1 className="asc-title">SECURITY &amp; COMPLIANCE</h1>
            <p className="asc-subtitle">
              Sovereign visibility into hidden admin boundaries, immutable audit actions, and GDPR posture.
            </p>
          </div>

          <div className="asc-actions">
            <Link className="asc-link ghost" to="/admin/health">
              System Health
            </Link>
            <button className="asc-btn ghost" onClick={() => void scanSecurityIssues()} disabled={scanning}>
              {scanning ? "Scanning" : "Scan for Security Issues"}
            </button>
            <button className="asc-btn" onClick={() => void refreshPanel()} disabled={refreshing}>
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="asc-body">
          {error ? <div className="asc-error">{error}</div> : null}
          {note ? <div className="asc-note">{note}</div> : null}
          <div className="asc-note">
            <strong>Admin posture:</strong> <code>ADMIN_EMAILS</code> is the single source of truth, unauthorized admin access resolves as <code>404</code>, impersonation is always logged, and every admin directive is written to the immutable audit stream.
          </div>

          <section className="asc-panel">
            <div className="asc-panel-head">
              <div>
                <h2 className="asc-panel-title">Security Status</h2>
                <div className="asc-sub">Last updated {snapshot ? relativeTime(snapshot.generatedAt) : "just now"}.</div>
              </div>
            </div>

            <div className="asc-status-list">
              {(snapshot?.securityStatus ?? []).map((item) => (
                <div key={item.id} className="asc-status">
                  <div>
                    <div className="asc-status-title">{item.label}</div>
                    <div className="asc-status-summary">{item.summary}</div>
                  </div>

                  <div className="asc-row-actions">
                    <span className="asc-tone">
                      <span className={`asc-dot ${item.tone === "healthy" ? "" : item.tone}`} />
                      {toneLabel(item.tone)}
                    </span>

                    {item.id === "rls" ? (
                      <button className="asc-btn ghost" onClick={() => void verifyRls()} disabled={verifying}>
                        {verifying ? "Verifying" : item.actionLabel ?? "Verify"}
                      </button>
                    ) : null}

                    {item.id === "scoping" ? (
                      <button className="asc-btn ghost" onClick={() => setShowFix((current) => !current)}>
                        {showFix ? "Hide Fix" : item.actionLabel ?? "View Fix"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {showFix && snapshot ? (
              <div className="asc-code" style={{ marginTop: 14 }}>
                <div className="asc-mini">Tenant Boundary Review</div>
                <div className="asc-sub" style={{ marginTop: 10 }}>{snapshot.finding.summary}</div>
                <span className="asc-code-path">{snapshot.finding.sourcePath}</span>
                {snapshot.finding.supportingPath ? <span className="asc-code-path">{snapshot.finding.supportingPath}</span> : null}
              </div>
            ) : null}
          </section>

          <section className="asc-panel">
            <div className="asc-panel-head">
              <div>
                <h2 className="asc-panel-title">Security Controls</h2>
                <div className="asc-sub">JWT posture, active session visibility, 2FA adoption, and route throttling.</div>
              </div>
            </div>

            <div className="asc-grid">
              <div className="asc-gdpr-stat">
                <div className="asc-stat-label">JWT expiry</div>
                <div className="asc-status-title" style={{ marginTop: 10 }}>{snapshot?.jwt.expiry ?? "Unknown"}</div>
                <div className="asc-status-summary">Refresh {snapshot?.jwt.refresh ?? "Unknown"} · Rotation {snapshot?.jwt.rotation ?? "Unknown"}</div>
              </div>
              <div className="asc-gdpr-stat">
                <div className="asc-stat-label">Active sessions</div>
                <div className="asc-stat-value">{snapshot?.sessionSummary.activeSessions ?? 0}</div>
                <div className="asc-status-summary">{snapshot?.sessionSummary.activeUsers ?? 0} active users with current session artifacts</div>
              </div>
              <div className="asc-gdpr-stat">
                <div className="asc-stat-label">2FA adoption rate</div>
                <div className="asc-stat-value">{snapshot?.twoFactor.adoptionRate ?? 0}%</div>
                <div className="asc-status-summary">{snapshot?.twoFactor.enabledUsers ?? 0} users currently have 2FA enabled</div>
              </div>
              <div className="asc-gdpr-stat">
                <div className="asc-stat-label">Rate limit coverage</div>
                <div className="asc-status-title" style={{ marginTop: 10 }}>{snapshot?.rateLimits.length ?? 0} routes tracked</div>
                <div className="asc-status-summary">{(snapshot?.rateLimits ?? []).map((entry) => `${entry.route} (${entry.scope})`).join(" · ")}</div>
              </div>
            </div>
          </section>

          <section className="asc-panel">
            <div className="asc-panel-head">
              <div>
                <h2 className="asc-panel-title">Active Sessions</h2>
                <div className="asc-sub">Live session artifacts currently tracked for signed-in users. Revoke any one from the admin surface.</div>
              </div>
            </div>

            {snapshot?.sessions.length ? (
              <div className="asc-audit-list">
                {snapshot.sessions.map((session) => (
                  <div key={session.id} className="asc-audit">
                    <div className="asc-time">{formatDateTime(session.lastSeen)}</div>
                    <div>
                      <div className="asc-status-title">{session.userLabel}</div>
                      <div className="asc-audit-meta">Platform: {session.platform} · Created {formatDateTime(session.createdAt)}</div>
                    </div>
                    <div className="asc-row-actions">
                      <button className="asc-btn ghost" onClick={() => void revokeSession(session.id)} disabled={revokingSessionId === session.id}>
                        {revokingSessionId === session.id ? "Revoking" : "Revoke"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="asc-empty">No active session artifacts are available right now.</div>
            )}
          </section>

          <section className="asc-panel">
            <div className="asc-panel-head">
              <div>
                <h2 className="asc-panel-title">Admin Audit Log</h2>
                <div className="asc-sub">Recorded admin actions from the immutable audit stream.</div>
              </div>
              <button className="asc-btn ghost" onClick={() => void exportAuditLog()} disabled={exporting}>
                {exporting ? "Exporting" : "Export Full Audit Log"}
              </button>
            </div>

            {snapshot?.auditLog.length ? (
              <div className="asc-audit-list">
                {snapshot.auditLog.slice(0, 12).map((entry) => (
                  <div key={entry.id} className="asc-audit">
                    <div className="asc-time">{formatDateTime(entry.createdAt)}</div>
                    <div>
                      <div className="asc-status-title">{entry.actorEmail}</div>
                      <div className="asc-audit-meta">{entry.summary}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="asc-empty">No admin audit entries are available yet.</div>
            )}
          </section>

          <section className="asc-panel">
            <div className="asc-panel-head">
              <div>
                <h2 className="asc-panel-title">Sensitive User Actions</h2>
                <div className="asc-sub">Password, auth, security, suspension, and deletion-adjacent actions across the platform.</div>
              </div>
            </div>

            {snapshot?.sensitiveActions.length ? (
              <div className="asc-audit-list">
                {snapshot.sensitiveActions.slice(0, 12).map((entry) => (
                  <div key={entry.id} className="asc-audit">
                    <div className="asc-time">{formatDateTime(entry.createdAt)}</div>
                    <div>
                      <div className="asc-status-title">{entry.actorEmail}</div>
                      <div className="asc-audit-meta">{entry.summary}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="asc-empty">No sensitive user actions have been recorded yet.</div>
            )}
          </section>

          <section className="asc-panel">
            <div className="asc-panel-head">
              <div>
                <h2 className="asc-panel-title">Suspicious Activity Feed</h2>
                <div className="asc-sub">Login anomalies and unusual protected-surface activity pulled from recent auth logs.</div>
              </div>
            </div>

            {snapshot?.suspiciousActivity.length ? (
              <div className="asc-audit-list">
                {snapshot.suspiciousActivity.map((entry) => (
                  <div key={entry.id} className="asc-audit">
                    <div className="asc-time">{formatDateTime(entry.createdAt)}</div>
                    <div>
                      <div className="asc-status-title">{entry.title}</div>
                      <div className="asc-audit-meta">{entry.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="asc-empty">No suspicious activity has been surfaced yet.</div>
            )}
          </section>

          <section className="asc-panel">
            <div className="asc-panel-head">
              <div>
                <h2 className="asc-panel-title">GDPR Management</h2>
                <div className="asc-sub">Current repository-tracked privacy posture and queue visibility.</div>
              </div>
              <button className="asc-btn ghost" onClick={() => setShowGdprNote((current) => !current)}>
                {showGdprNote ? "Hide" : "View"}
              </button>
            </div>

            <div className="asc-grid">
              <div className="asc-gdpr-stat">
                <div className="asc-stat-label">Data deletion requests pending</div>
                <div className="asc-stat-value">{snapshot?.gdpr.deletionRequestsPending ?? 0}</div>
              </div>
              <div className="asc-gdpr-stat">
                <div className="asc-stat-label">Data export requests pending</div>
                <div className="asc-stat-value">{snapshot?.gdpr.exportRequestsPending ?? 0}</div>
              </div>
              <div className="asc-gdpr-stat">
                <div className="asc-stat-label">Privacy acknowledgment</div>
                <div className="asc-status-title" style={{ marginTop: 10 }}>{snapshot?.gdpr.privacyAcknowledgmentLabel ?? "Unknown"}</div>
              </div>
              <div className="asc-gdpr-stat">
                <div className="asc-stat-label">Operational note</div>
                <div className="asc-status-title" style={{ marginTop: 10 }}>
                  {snapshot?.gdpr.privacyAcknowledgmentTone === "healthy" ? "Configured" : "Attention"}
                </div>
              </div>
            </div>

            {showGdprNote && snapshot ? (
              <div className="asc-code" style={{ marginTop: 14 }}>
                <div className="asc-mini">GDPR Note</div>
                <div className="asc-sub" style={{ marginTop: 10 }}>{snapshot.gdpr.note}</div>
              </div>
            ) : null}

            {snapshot?.gdpr.consentLogs.length ? (
              <div className="asc-code" style={{ marginTop: 14 }}>
                <div className="asc-mini">Recent Consent Logs</div>
                <div className="asc-sub" style={{ marginTop: 10 }}>
                  {snapshot.gdpr.consentLogs.map((entry) => `${entry.userId} acknowledged v${entry.policyVersion} on ${formatDateTime(entry.acknowledgedAt)}`).join(" · ")}
                </div>
              </div>
            ) : null}
          </section>

          {(showForge || snapshot?.forgeAssistant) && snapshot ? (
            <section className="asc-panel">
              <div className="asc-panel-head">
                <div>
                  <h2 className="asc-panel-title">FORGE Security Assistant</h2>
                  <div className="asc-sub">Data-driven operator guidance synthesized from configs, logs, and security posture.</div>
                </div>
              </div>
              <div className="asc-code">
                <div className="asc-mini">Scan Summary</div>
                <div className="asc-sub" style={{ marginTop: 10 }}>{snapshot.forgeAssistant.summary}</div>
                <div className="asc-mini" style={{ marginTop: 16 }}>Recommended Action</div>
                <div className="asc-sub" style={{ marginTop: 10 }}>{snapshot.forgeAssistant.recommendedAction}</div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
