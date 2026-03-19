import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";

type ServiceTone = "healthy" | "warning" | "down" | "not_configured";
type ErrorFilter = "all" | "5xx" | "4xx" | "ai" | "stripe";

type ServiceStatus = {
  id: string;
  label: string;
  tone: ServiceTone;
  statusLabel: string;
  summary: string;
  metrics: string[];
};

type HealthSnapshot = {
  generatedAt: string;
  services: ServiceStatus[];
  rateLimiting: {
    authRoutes: number;
    apiRoutes: number;
    adminRoutes: number;
    aiRoutes: number;
  };
  database: {
    rlsVerifiedAt: string | null;
    pendingMigrations: number;
    tableSizes: Array<{ label: string; rowCount: number }>;
  };
  errorLogs: Array<{
    id: string;
    method: string;
    path: string;
    statusCode: number;
    filter: ErrorFilter;
    label: string;
    latencyMs: number;
    createdAt: string;
  }>;
};

const FILTERS: Array<{ id: ErrorFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "5xx", label: "5xx" },
  { id: "4xx", label: "4xx" },
  { id: "ai", label: "AI errors" },
  { id: "stripe", label: "Stripe errors" },
];

const css = `
  .ash-page{
    max-width:1420px;
    margin:0 auto;
    padding:28px 22px 92px;
    color:var(--text);
    font-family:'Syne',sans-serif;
  }
  .ash-shell{
    border:1px solid rgba(201,168,76,.18);
    border-radius:30px;
    overflow:hidden;
    background:
      radial-gradient(circle at top right, rgba(201,168,76,.1), transparent 28%),
      radial-gradient(circle at bottom left, rgba(137,196,225,.08), transparent 24%),
      linear-gradient(180deg, rgba(7,13,21,.99), rgba(11,19,30,.98));
    box-shadow:0 30px 90px rgba(0,0,0,.34);
  }
  .ash-head{
    display:flex;
    justify-content:space-between;
    gap:16px;
    align-items:flex-start;
    padding:20px 24px 22px;
    border-bottom:1px solid rgba(255,255,255,.06);
    background:rgba(6,11,18,.8);
  }
  .ash-kicker{
    font-family:'Space Mono',monospace;
    font-size:10px;
    letter-spacing:.18em;
    text-transform:uppercase;
    color:var(--gold);
  }
  .ash-title{
    margin:10px 0 0;
    font-size:clamp(28px,4vw,42px);
    letter-spacing:-.05em;
    line-height:1;
  }
  .ash-subtitle{
    margin:12px 0 0;
    max-width:760px;
    color:var(--text-dim);
    font-size:14px;
    line-height:1.65;
  }
  .ash-actions{
    display:flex;
    gap:10px;
    flex-wrap:wrap;
  }
  .ash-link,.ash-btn{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    min-height:42px;
    padding:0 16px;
    border-radius:999px;
    border:1px solid rgba(201,168,76,.22);
    background:rgba(201,168,76,.08);
    color:var(--gold);
    font-family:'Space Mono',monospace;
    font-size:11px;
    letter-spacing:.08em;
    text-transform:uppercase;
    text-decoration:none;
    cursor:pointer;
  }
  .ash-link.ghost,.ash-btn.ghost{
    border-color:var(--border);
    background:rgba(255,255,255,.03);
    color:var(--text-dim);
  }
  .ash-btn:disabled{
    opacity:.6;
    cursor:not-allowed;
  }
  .ash-body{
    padding:24px;
    display:grid;
    gap:18px;
  }
  .ash-panel{
    border:1px solid rgba(255,255,255,.08);
    border-radius:24px;
    background:linear-gradient(180deg, rgba(17,27,39,.94), rgba(10,17,27,.94));
    padding:18px;
  }
  .ash-panel-head{
    display:flex;
    justify-content:space-between;
    gap:12px;
    align-items:flex-start;
    margin-bottom:14px;
  }
  .ash-panel-title{
    margin:0;
    font-family:'Space Mono',monospace;
    font-size:11px;
    letter-spacing:.14em;
    text-transform:uppercase;
    color:var(--gold);
  }
  .ash-panel-sub{
    margin-top:8px;
    color:var(--text-dim);
    font-size:13px;
    line-height:1.55;
  }
  .ash-service-list{
    display:grid;
    gap:12px;
  }
  .ash-service{
    display:grid;
    grid-template-columns:minmax(0,1.2fr) auto minmax(280px,.9fr);
    gap:14px;
    align-items:center;
    padding:16px;
    border-radius:18px;
    border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.03);
  }
  .ash-service-main{
    min-width:0;
  }
  .ash-service-label{
    display:flex;
    align-items:center;
    gap:10px;
    font-size:16px;
    font-weight:800;
  }
  .ash-dot{
    width:11px;
    height:11px;
    border-radius:999px;
    background:var(--green);
    box-shadow:0 0 14px rgba(45,212,160,.35);
    flex-shrink:0;
  }
  .ash-dot.warning{
    background:var(--gold);
    box-shadow:0 0 14px rgba(201,168,76,.35);
  }
  .ash-dot.down{
    background:var(--red);
    box-shadow:0 0 14px rgba(224,90,78,.35);
  }
  .ash-dot.not_configured{
    background:rgba(141,162,187,.9);
    box-shadow:none;
  }
  .ash-service-summary{
    margin-top:6px;
    color:var(--text-dim);
    font-size:13px;
    line-height:1.55;
  }
  .ash-pill{
    display:inline-flex;
    align-items:center;
    padding:6px 10px;
    border-radius:999px;
    border:1px solid rgba(255,255,255,.08);
    font-family:'Space Mono',monospace;
    font-size:10px;
    letter-spacing:.08em;
    text-transform:uppercase;
    white-space:nowrap;
  }
  .ash-pill.healthy{
    color:var(--green);
    border-color:rgba(45,212,160,.22);
    background:rgba(45,212,160,.08);
  }
  .ash-pill.warning{
    color:var(--gold);
    border-color:rgba(201,168,76,.22);
    background:rgba(201,168,76,.08);
  }
  .ash-pill.down{
    color:var(--red);
    border-color:rgba(224,90,78,.22);
    background:rgba(224,90,78,.08);
  }
  .ash-pill.not_configured{
    color:var(--text-dim);
    border-color:rgba(141,162,187,.2);
    background:rgba(141,162,187,.08);
  }
  .ash-metrics{
    display:flex;
    gap:8px;
    flex-wrap:wrap;
    justify-content:flex-end;
  }
  .ash-metric{
    display:inline-flex;
    align-items:center;
    padding:6px 10px;
    border-radius:999px;
    background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.07);
    color:var(--text);
    font-family:'Space Mono',monospace;
    font-size:10px;
    letter-spacing:.05em;
  }
  .ash-split{
    display:grid;
    grid-template-columns:minmax(0,1fr) minmax(340px,.92fr);
    gap:18px;
  }
  .ash-stat-grid{
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:12px;
  }
  .ash-stat{
    padding:16px;
    border-radius:18px;
    border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.03);
  }
  .ash-stat-label{
    font-family:'Space Mono',monospace;
    font-size:10px;
    letter-spacing:.12em;
    text-transform:uppercase;
    color:var(--text-dim);
  }
  .ash-stat-value{
    margin-top:10px;
    font-size:30px;
    font-weight:800;
    letter-spacing:-.05em;
    color:var(--gold);
    line-height:1;
  }
  .ash-stat-sub{
    margin-top:8px;
    color:var(--text-dim);
    font-size:12px;
    line-height:1.5;
  }
  .ash-db-list{
    display:grid;
    gap:12px;
  }
  .ash-db-row{
    display:flex;
    justify-content:space-between;
    gap:14px;
    padding:12px 0;
    border-bottom:1px solid rgba(255,255,255,.06);
  }
  .ash-db-row:last-child{
    border-bottom:none;
    padding-bottom:0;
  }
  .ash-db-key{
    color:var(--text-dim);
    font-size:12px;
    text-transform:uppercase;
    letter-spacing:.08em;
  }
  .ash-db-value{
    color:var(--text);
    font-family:'Space Mono',monospace;
    font-size:12px;
    text-align:right;
  }
  .ash-row-actions{
    display:flex;
    gap:10px;
    align-items:center;
    flex-wrap:wrap;
  }
  .ash-filter-row{
    display:flex;
    gap:10px;
    flex-wrap:wrap;
    margin-bottom:14px;
  }
  .ash-filter{
    border:none;
    border-radius:999px;
    padding:10px 14px;
    background:rgba(255,255,255,.05);
    color:var(--text-dim);
    font-family:'Space Mono',monospace;
    font-size:11px;
    letter-spacing:.05em;
    cursor:pointer;
  }
  .ash-filter.active{
    background:rgba(201,168,76,.12);
    color:var(--gold);
  }
  .ash-log-list{
    display:grid;
    gap:10px;
  }
  .ash-log{
    display:grid;
    grid-template-columns:auto minmax(0,1fr) auto;
    gap:12px;
    align-items:start;
    padding:14px;
    border-radius:18px;
    border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.03);
  }
  .ash-log-code{
    min-width:58px;
    text-align:center;
    padding:8px 10px;
    border-radius:12px;
    font-family:'Space Mono',monospace;
    font-size:12px;
    letter-spacing:.05em;
    background:rgba(255,255,255,.05);
    color:var(--text);
  }
  .ash-log-code.err5{
    color:#ffcbc5;
    background:rgba(224,90,78,.12);
  }
  .ash-log-code.err4{
    color:#f5deb0;
    background:rgba(201,168,76,.12);
  }
  .ash-log-title{
    font-weight:700;
    font-size:14px;
    color:var(--text);
  }
  .ash-log-meta{
    margin-top:6px;
    font-family:'Space Mono',monospace;
    font-size:10px;
    letter-spacing:.04em;
    color:var(--text-dim);
    line-height:1.7;
    word-break:break-all;
  }
  .ash-empty{
    padding:24px;
    border-radius:18px;
    border:1px dashed rgba(255,255,255,.14);
    background:rgba(255,255,255,.02);
    color:var(--text-dim);
    text-align:center;
  }
  .ash-error{
    padding:12px 14px;
    border-radius:16px;
    border:1px solid rgba(224,90,78,.26);
    background:rgba(224,90,78,.08);
    color:#ffcbc5;
    font-size:13px;
  }
  .ash-load{
    display:grid;
    gap:16px;
  }
  .ash-skel{
    min-height:160px;
    border-radius:24px;
    border:1px solid rgba(255,255,255,.08);
    background:linear-gradient(90deg, rgba(255,255,255,.04), rgba(255,255,255,.08), rgba(255,255,255,.04));
    background-size:180% 100%;
    animation:ash-shimmer 1.4s linear infinite;
  }
  @keyframes ash-shimmer{
    0%{background-position:100% 0}
    100%{background-position:-100% 0}
  }
  @media (max-width:1160px){
    .ash-split{
      grid-template-columns:1fr;
    }
    .ash-service{
      grid-template-columns:1fr;
    }
    .ash-metrics{
      justify-content:flex-start;
    }
  }
  @media (max-width:760px){
    .ash-page{
      padding:18px 12px 84px;
    }
    .ash-head,.ash-body{
      padding:16px;
    }
    .ash-head{
      flex-direction:column;
    }
    .ash-stat-grid{
      grid-template-columns:1fr;
    }
    .ash-log{
      grid-template-columns:1fr;
    }
  }
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

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function formatRlsLabel(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminSystemHealthPage() {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [verificationNote, setVerificationNote] = useState("");
  const [filter, setFilter] = useState<ErrorFilter>("all");

  useEffect(() => {
    let active = true;

    async function load(initial = false) {
      try {
        if (initial) setLoading(true);
        else setRefreshing(true);

        const res = await fetch(`${API_BASE}/admin/health/panel`, {
          headers: getAuthHeaders(),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? "Failed to load system health");
        }

        if (!active) return;
        setSnapshot(body as HealthSnapshot);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load system health");
      } finally {
        if (!active) return;
        setLoading(false);
        setRefreshing(false);
      }
    }

    void load(true);
    const intervalId = window.setInterval(() => {
      void load(false);
    }, 30_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!verificationNote) return;
    const id = window.setTimeout(() => setVerificationNote(""), 2600);
    return () => window.clearTimeout(id);
  }, [verificationNote]);

  const filteredLogs = useMemo(() => {
    if (!snapshot) return [];
    if (filter === "all") return snapshot.errorLogs;
    return snapshot.errorLogs.filter((entry) => entry.filter === filter || (filter === "5xx" && entry.statusCode >= 500) || (filter === "4xx" && entry.statusCode >= 400 && entry.statusCode < 500));
  }, [filter, snapshot]);

  const filterCounts = useMemo(() => {
    const logs = snapshot?.errorLogs ?? [];
    return {
      all: logs.length,
      "5xx": logs.filter((entry) => entry.statusCode >= 500).length,
      "4xx": logs.filter((entry) => entry.statusCode >= 400 && entry.statusCode < 500).length,
      ai: logs.filter((entry) => entry.filter === "ai").length,
      stripe: logs.filter((entry) => entry.filter === "stripe").length,
    } satisfies Record<ErrorFilter, number>;
  }, [snapshot]);

  async function refreshPanel() {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/health/panel`, {
        headers: getAuthHeaders(),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? "Failed to refresh system health");
      }
      setSnapshot(body as HealthSnapshot);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh system health");
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
      setVerificationNote("RLS verification checkpoint recorded.");
      await refreshPanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify RLS");
    } finally {
      setVerifying(false);
    }
  }

  if (loading && !snapshot) {
    return (
      <div className="ash-page">
        <style>{css}</style>
        <div className="ash-load">
          <div className="ash-skel" />
          <div className="ash-skel" />
          <div className="ash-skel" />
        </div>
      </div>
    );
  }

  return (
    <div className="ash-page">
      <style>{css}</style>

      <div className="ash-shell">
        <div className="ash-head">
          <div>
            <div className="ash-kicker">Admin / System Health / Route: /admin/health</div>
            <h1 className="ash-title">SYSTEM HEALTH</h1>
            <p className="ash-subtitle">
              Sovereign visibility into service readiness, rate limiting pressure, database posture, and the most recent platform faults.
            </p>
          </div>

          <div className="ash-actions">
            <Link className="ash-link ghost" to="/admin/overview">
              Admin Overview
            </Link>
            <button className="ash-btn" onClick={() => void refreshPanel()} disabled={refreshing}>
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="ash-body">
          {error ? <div className="ash-error">{error}</div> : null}

          <section className="ash-panel">
            <div className="ash-panel-head">
              <div>
                <h2 className="ash-panel-title">Service Status</h2>
                <div className="ash-panel-sub">
                  Last updated {snapshot ? relativeTime(snapshot.generatedAt) : "just now"}.
                </div>
              </div>
            </div>

            <div className="ash-service-list">
              {(snapshot?.services ?? []).map((service) => (
                <div key={service.id} className="ash-service">
                  <div className="ash-service-main">
                    <div className="ash-service-label">
                      <span className={`ash-dot ${service.tone}`} />
                      {service.label}
                    </div>
                    <div className="ash-service-summary">{service.summary}</div>
                  </div>

                  <span className={`ash-pill ${service.tone}`}>{service.statusLabel}</span>

                  <div className="ash-metrics">
                    {service.metrics.map((metric) => (
                      <span key={metric} className="ash-metric">
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="ash-split">
            <section className="ash-panel">
              <div className="ash-panel-head">
                <div>
                  <h2 className="ash-panel-title">Rate Limiting Status</h2>
                  <div className="ash-panel-sub">Daily counters for requests that were actually throttled with `429` responses.</div>
                </div>
              </div>

              <div className="ash-stat-grid">
                <div className="ash-stat">
                  <div className="ash-stat-label">Auth Routes</div>
                  <div className="ash-stat-value">{snapshot?.rateLimiting.authRoutes ?? 0}</div>
                  <div className="ash-stat-sub">Blocked today</div>
                </div>
                <div className="ash-stat">
                  <div className="ash-stat-label">API Routes</div>
                  <div className="ash-stat-value">{snapshot?.rateLimiting.apiRoutes ?? 0}</div>
                  <div className="ash-stat-sub">Blocked today</div>
                </div>
                <div className="ash-stat">
                  <div className="ash-stat-label">Admin Routes</div>
                  <div className="ash-stat-value">{snapshot?.rateLimiting.adminRoutes ?? 0}</div>
                  <div className="ash-stat-sub">Blocked today</div>
                </div>
                <div className="ash-stat">
                  <div className="ash-stat-label">AI Routes</div>
                  <div className="ash-stat-value">{snapshot?.rateLimiting.aiRoutes ?? 0}</div>
                  <div className="ash-stat-sub">Throttled today</div>
                </div>
              </div>
            </section>

            <section className="ash-panel">
              <div className="ash-panel-head">
                <div>
                  <h2 className="ash-panel-title">Database Health</h2>
                  <div className="ash-panel-sub">Operational checks for RLS posture, migration drift, and core table volume.</div>
                </div>
                <div className="ash-row-actions">
                  <button className="ash-btn ghost" onClick={() => void verifyRls()} disabled={verifying}>
                    {verifying ? "Verifying" : "Verify Now"}
                  </button>
                </div>
              </div>

              <div className="ash-db-list">
                <div className="ash-db-row">
                  <span className="ash-db-key">RLS Policies</span>
                  <span className="ash-db-value">Last verified: {formatRlsLabel(snapshot?.database.rlsVerifiedAt ?? null)}</span>
                </div>
                <div className="ash-db-row">
                  <span className="ash-db-key">Pending Migrations</span>
                  <span className="ash-db-value">{snapshot?.database.pendingMigrations ?? 0}</span>
                </div>
                <div className="ash-db-row">
                  <span className="ash-db-key">Table Sizes</span>
                  <span className="ash-db-value">
                    {(snapshot?.database.tableSizes ?? [])
                      .map((entry) => `${entry.label}(${formatCount(entry.rowCount)} rows)`)
                      .join(" · ")}
                  </span>
                </div>
              </div>

              {verificationNote ? <div className="ash-panel-sub" style={{ marginTop: 14, color: "var(--gold)" }}>{verificationNote}</div> : null}
            </section>
          </div>

          <section className="ash-panel">
            <div className="ash-panel-head">
              <div>
                <h2 className="ash-panel-title">Error Log (Last 50)</h2>
                <div className="ash-panel-sub">Request-level fault telemetry collected since the current server process started.</div>
              </div>
            </div>

            <div className="ash-filter-row">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`ash-filter ${filter === item.id ? "active" : ""}`}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label} ({filterCounts[item.id]})
                </button>
              ))}
            </div>

            {filteredLogs.length === 0 ? (
              <div className="ash-empty">No matching error entries are available right now.</div>
            ) : (
              <div className="ash-log-list">
                {filteredLogs.map((entry) => (
                  <div key={entry.id} className="ash-log">
                    <div className={`ash-log-code ${entry.statusCode >= 500 ? "err5" : "err4"}`}>{entry.statusCode}</div>
                    <div>
                      <div className="ash-log-title">{entry.label}</div>
                      <div className="ash-log-meta">
                        {entry.method} {entry.path}
                        <br />
                        {relativeTime(entry.createdAt)} · latency {entry.latencyMs}ms
                      </div>
                    </div>
                    <div className="ash-pill ghost">{entry.filter.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
