import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";

type ControlRow = {
  id: string;
  name: string;
  icon: string;
  progress: number;
  badge: string;
  actionMode: "admin_only" | "metrics" | "launch" | "locked";
  actionLabel: string;
  helperLabel?: string;
  note: string;
  canSuspend: boolean;
  detailPath: string;
  blockingCount: number;
  warningCount: number;
  dependencies: Array<{
    id: string;
    label: string;
    isLive: boolean;
  }>;
  confirmationText: string;
  launchSummary: string;
};

type QueueCard = {
  layerId: string;
  name: string;
  icon: string;
  progress: number;
  actionLabel: string;
  dependencies: Array<{
    id: string;
    label: string;
    isLive: boolean;
  }>;
  blockingCount: number;
  warningCount: number;
  forgeDirective: string;
  isReady: boolean;
  confirmationText: string;
  launchSummary: string;
};

type ImpactItem = {
  icon: string;
  title: string;
  detail: string;
};

type PlatformStatusResponse = {
  health: Record<string, string>;
  control: {
    summary: string;
    queue: QueueCard | null;
    rows: ControlRow[];
    impactPreview: ImpactItem[];
    usersNotifiedCount: number;
  };
};

type PreLaunchCheck = {
  category: "dependency" | "backend" | "frontend" | "payments" | "ai" | "data";
  label: string;
  status: "pass" | "warn" | "fail";
  detail?: string;
  link?: string;
};

type ChecklistResponse = {
  layerName: string;
  isReady: boolean;
  checks: PreLaunchCheck[];
  blockingCount: number;
  warningCount: number;
  confirmationText: string;
  launchSummary: string;
  launchEffects: string[];
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Syne:wght@400;500;700;800&display=swap');
  .apl-root{max-width:1320px;margin:0 auto;padding:28px 22px 92px;color:var(--text);font-family:'Syne',sans-serif}
  .apl-shell{border:1px solid rgba(201,168,76,.18);border-radius:28px;overflow:hidden;background:radial-gradient(circle at top right,rgba(201,168,76,.12),transparent 36%),linear-gradient(180deg,rgba(9,17,29,.98),rgba(12,22,36,.96));box-shadow:0 24px 80px rgba(0,0,0,.28)}
  .apl-top{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:16px 22px;border-bottom:1px solid rgba(201,168,76,.16);background:rgba(7,14,24,.82)}
  .apl-brand{display:flex;align-items:center;gap:10px;min-width:0}
  .apl-mark{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;font-size:17px;color:var(--gold);border:1px solid rgba(201,168,76,.28);background:linear-gradient(180deg,rgba(201,168,76,.16),rgba(201,168,76,.04));flex-shrink:0}
  .apl-line{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(232,238,245,.86);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .apl-line strong{color:var(--gold)}
  .apl-sub{margin-top:4px;color:var(--text-dim);font-size:13px}
  .apl-actions{display:flex;gap:10px;flex-wrap:wrap}
  .apl-btn,.apl-link{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 16px;border-radius:999px;border:1px solid rgba(201,168,76,.22);background:rgba(201,168,76,.08);color:var(--gold);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;cursor:pointer}
  .apl-btn.ghost,.apl-link.ghost{border-color:var(--border);background:rgba(255,255,255,.03);color:var(--text-dim)}
  .apl-body{padding:24px}
  .apl-error,.apl-success{margin-bottom:16px;padding:14px 16px;border-radius:16px}
  .apl-error{border:1px solid rgba(224,90,78,.28);color:#ffcbc5;background:rgba(224,90,78,.08)}
  .apl-success{border:1px solid rgba(45,212,160,.28);color:#baf4d7;background:rgba(45,212,160,.08)}
  .apl-hero{padding:20px 22px;border-radius:22px;border:1px solid rgba(201,168,76,.18);background:linear-gradient(135deg,rgba(20,28,40,.96),rgba(13,22,35,.98));margin-bottom:18px}
  .apl-kicker{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:8px}
  .apl-title{margin:0;font-family:'Cormorant Garamond',serif;font-size:42px;line-height:1;color:#f4f0df}
  .apl-copy{margin-top:12px;max-width:880px;font-size:15px;line-height:1.65;color:var(--text-dim)}
  .apl-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:18px}
  .apl-panel{padding:18px;border-radius:22px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(18,28,40,.92),rgba(11,18,28,.92))}
  .apl-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:16px}
  .apl-panel-title{margin:0;font-size:18px;font-weight:800;color:var(--text)}
  .apl-queue{padding:18px;border-radius:20px;border:1px solid rgba(201,168,76,.18);background:radial-gradient(circle at right top,rgba(201,168,76,.14),transparent 36%),rgba(255,255,255,.03)}
  .apl-queue-top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
  .apl-queue-title{margin:0;font-size:28px;font-family:'Cormorant Garamond',serif;color:#f4f0df}
  .apl-queue-meta{margin-top:10px;display:flex;gap:10px;flex-wrap:wrap}
  .apl-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.08);font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase}
  .apl-pill.live{color:var(--green);border-color:rgba(45,212,160,.22);background:rgba(45,212,160,.08)}
  .apl-pill.ready{color:var(--gold);border-color:rgba(201,168,76,.22);background:rgba(201,168,76,.08)}
  .apl-pill.locked{color:var(--text-dim);background:rgba(255,255,255,.04)}
  .apl-progress-row{display:flex;align-items:center;gap:12px;margin:14px 0 10px}
  .apl-progress{flex:1;height:12px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,.08)}
  .apl-progress-fill{height:100%;background:linear-gradient(90deg,rgba(201,168,76,.96),rgba(137,196,225,.88));border-radius:inherit}
  .apl-progress-text{font-family:'Space Mono',monospace;font-size:11px;color:var(--text-dim);white-space:nowrap}
  .apl-note{margin-top:12px;font-size:14px;line-height:1.6;color:var(--text-dim)}
  .apl-table{display:grid;gap:12px}
  .apl-row{display:grid;grid-template-columns:minmax(220px,1.2fr) 120px 90px minmax(180px,1fr) auto;gap:14px;align-items:center;padding:14px 16px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}
  .apl-row-main{display:flex;align-items:center;gap:12px}
  .apl-row-icon{font-size:22px;flex-shrink:0}
  .apl-row-name{font-size:16px;font-weight:800}
  .apl-row-badge{margin-top:5px;font-family:'Space Mono',monospace;font-size:10px;color:var(--text-dim);letter-spacing:.08em;text-transform:uppercase}
  .apl-row-right{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
  .apl-inline{font-family:'Space Mono',monospace;font-size:11px;color:var(--text-dim)}
  .apl-small-progress{height:10px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,.08)}
  .apl-small-fill{height:100%;background:linear-gradient(90deg,rgba(201,168,76,.96),rgba(137,196,225,.88));border-radius:inherit}
  .apl-impact{display:grid;gap:10px}
  .apl-impact-item{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}
  .apl-impact-icon{font-size:20px;flex-shrink:0}
  .apl-impact-title{font-size:14px;font-weight:800}
  .apl-impact-copy{margin-top:4px;font-size:13px;line-height:1.55;color:var(--text-dim)}
  .apl-empty{padding:20px;border-radius:18px;border:1px dashed rgba(255,255,255,.14);color:var(--text-dim);background:rgba(255,255,255,.02)}
  .apl-modal-back{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:24px;background:rgba(3,6,11,.72);backdrop-filter:blur(8px)}
  .apl-modal{width:min(860px,100%);max-height:min(86vh,880px);overflow:auto;border-radius:24px;border:1px solid rgba(201,168,76,.18);background:linear-gradient(180deg,rgba(17,27,39,.98),rgba(10,17,27,.98));box-shadow:0 32px 80px rgba(0,0,0,.42)}
  .apl-modal-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:22px 22px 16px;border-bottom:1px solid rgba(255,255,255,.06)}
  .apl-modal-title{margin:0;font-family:'Cormorant Garamond',serif;font-size:34px;color:#f4f0df}
  .apl-modal-sub{margin-top:8px;color:var(--text-dim);line-height:1.55;font-size:14px}
  .apl-close{width:40px;height:40px;border-radius:999px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:var(--text);cursor:pointer}
  .apl-modal-body{padding:18px 22px 22px}
  .apl-checks{display:grid;gap:12px}
  .apl-check{padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03)}
  .apl-check-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
  .apl-check-label{font-size:14px;font-weight:700}
  .apl-check-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
  .apl-check-copy{margin-top:10px;font-size:13px;line-height:1.55;color:var(--text-dim)}
  .apl-code{display:inline-block;margin-top:10px;padding:6px 8px;border-radius:10px;background:rgba(255,255,255,.04);font-family:'Space Mono',monospace;font-size:11px;color:var(--ice);word-break:break-all}
  @media (max-width:1080px){.apl-row{grid-template-columns:1fr}.apl-row-right{justify-content:flex-start}}
  @media (max-width:820px){.apl-root{padding:20px 14px 82px}.apl-top{padding:14px 16px;align-items:flex-start;flex-direction:column}.apl-body{padding:16px}.apl-title{font-size:34px}.apl-queue-top{flex-direction:column;align-items:flex-start}}
`;

function statusTone(status: string) {
  if (status === "LIVE") return "live";
  if (status === "READY" || status === "ADMIN ONLY") return "ready";
  return "locked";
}

function formatIssueSummary(blocking: number, warning: number) {
  const parts: string[] = [];
  if (blocking > 0) parts.push(`✗ ${blocking} issue${blocking === 1 ? "" : "s"} blocking`);
  if (warning > 0) parts.push(`⚠ ${warning} warning${warning === 1 ? "" : "s"}`);
  return parts.length ? parts.join("  ") : "No blockers";
}

function getLayerIdentifier(row: ControlRow | QueueCard) {
  return "layerId" in row ? row.layerId : row.id;
}

function requestLaunchConfirmation(layerName: string, confirmationText: string, launchSummary: string) {
  return window.prompt(
    `${launchSummary}\n\nType "${confirmationText}" to activate ${layerName} for users.`,
    "",
  );
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? `Request failed (${res.status})`);
  return body as T;
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((payload as { message?: string; error?: string }).message ?? (payload as { error?: string }).error ?? `Request failed (${res.status})`);
  return payload as T;
}

export default function AdminPlatformPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PlatformStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checklist, setChecklist] = useState<{ layerId: string; layerName: string; loading: boolean; data: ChecklistResponse | null } | null>(null);

  const queue = data?.control.queue ?? null;
  const rows = data?.control.rows ?? [];

  async function load() {
    try {
      const response = await apiGet<PlatformStatusResponse>("/admin/platform/status");
      setData(response);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load platform launch control");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function openChecklist(row: ControlRow | QueueCard) {
    const layerId = getLayerIdentifier(row);
    setChecklist({ layerId, layerName: row.name, loading: true, data: null });
    try {
      const response = await apiPost<ChecklistResponse>(`/admin/platform/${layerId}/checklist`);
      setChecklist({ layerId, layerName: row.name, loading: false, data: response });
    } catch (err) {
      setChecklist({
        layerId,
        layerName: row.name,
        loading: false,
        data: {
          layerName: row.name,
          isReady: false,
          blockingCount: 1,
          warningCount: 0,
          confirmationText: `ACTIVATE ${row.name.replace("Winners ", "").toUpperCase()}`,
          launchSummary: `Activate ${row.name} for users from the admin panel once the checklist clears.`,
          launchEffects: [],
          checks: [
            {
              category: "backend",
              label: err instanceof Error ? err.message : "Failed to load checklist",
              status: "fail",
            },
          ],
        },
      });
    }
  }

  async function launchLayer(layerId: string, layerName: string) {
    const row = rows.find((entry) => entry.id === layerId);
    const queueMatch = queue?.layerId === layerId ? queue : null;
    const confirmationText = row?.confirmationText ?? queueMatch?.confirmationText ?? `LAUNCH ${layerName.toUpperCase()}`;
    const launchSummary = row?.launchSummary ?? queueMatch?.launchSummary ?? `Activate ${layerName} for users from admin.`;
    const typed = requestLaunchConfirmation(layerName, confirmationText, launchSummary);
    if (typed === null) return;

    try {
      setBusyId(layerId);
      await apiPost(`/admin/platform/${layerId}/launch`, { confirmationText: typed });
      await load();
      setSuccess(`${layerName} activation directive issued.`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to activate ${layerName}`);
    } finally {
      setBusyId(null);
    }
  }

  async function suspendLayer(layerId: string, layerName: string) {
    const reason = window.prompt(`Why are you suspending ${layerName}?`) ?? "";
    try {
      setBusyId(layerId);
      await apiPost(`/admin/platform/${layerId}/suspend`, { reason });
      await load();
      setSuccess(`${layerName} suspend command issued.`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to suspend ${layerName}`);
    } finally {
      setBusyId(null);
    }
  }

  const impactPreview = useMemo(() => data?.control.impactPreview ?? [], [data]);

  if (loading && !data) {
    return (
      <div className="apl-root">
        <style>{css}</style>
        <div className="apl-empty">Loading activation control...</div>
      </div>
    );
  }

  return (
    <div className="apl-root">
      <style>{css}</style>

      {checklist ? (
        <div className="apl-modal-back" onClick={() => setChecklist(null)}>
          <div className="apl-modal" onClick={(event) => event.stopPropagation()}>
            <div className="apl-modal-head">
              <div>
                <div className="apl-kicker">Pre-Activation Checklist</div>
                <h2 className="apl-modal-title">{checklist.layerName}</h2>
                <div className="apl-modal-sub">
                  {checklist.loading
                    ? "Pulling the latest backend, frontend, payments, AI, and data checks."
                    : checklist.data?.isReady
                    ? "This layer is clear to activate for users."
                      : `${checklist.data?.blockingCount ?? 0} blocking issue(s), ${checklist.data?.warningCount ?? 0} warning(s).`}
                </div>
              </div>
              <button className="apl-close" onClick={() => setChecklist(null)} aria-label="Close checklist">x</button>
            </div>
            <div className="apl-modal-body">
                  {checklist.loading ? (
                <div className="apl-empty">Loading checklist...</div>
              ) : (
                <div className="apl-checks">
                  {checklist.data?.launchSummary ? (
                    <div className="apl-check">
                      <div className="apl-check-label">Activation Summary</div>
                      <div className="apl-check-copy">{checklist.data.launchSummary}</div>
                      <div className="apl-check-copy">Confirmation phrase: <span className="apl-code">{checklist.data.confirmationText}</span></div>
                    </div>
                  ) : null}
                  {checklist.data?.checks.map((check) => (
                    <div key={`${check.category}-${check.label}`} className="apl-check">
                      <div className="apl-check-top">
                        <div>
                          <div className="apl-check-label">{check.label}</div>
                          <div className="apl-check-meta">
                            <span className={`apl-pill ${check.status === "pass" ? "live" : check.status === "warn" ? "ready" : "locked"}`}>{check.status.toUpperCase()}</span>
                            <span className="apl-pill locked">{check.category.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                      {check.detail ? <div className="apl-check-copy">{check.detail}</div> : null}
                      {check.link ? (
                        check.link.startsWith("/") ? (
                          <Link className="apl-code" to={check.link}>{check.link}</Link>
                        ) : (
                          <div className="apl-code">{check.link}</div>
                        )
                      ) : null}
                    </div>
                  ))}
                  {checklist.data?.launchEffects?.length ? (
                    <div className="apl-check">
                      <div className="apl-check-label">Activation Effects</div>
                      {checklist.data.launchEffects.map((effect) => (
                        <div key={effect} className="apl-check-copy">{effect}</div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="apl-shell">
        <div className="apl-top">
          <div className="apl-brand">
            <div className="apl-mark">⬡</div>
            <div>
              <div className="apl-line"><strong>Core Engine</strong> | Overview · Platform · Tenants · Users · Revenue · FORGE</div>
              <div className="apl-sub">Supervisor: FORGE directs · OMEGA monitors</div>
            </div>
          </div>
          <div className="apl-actions">
            <button className="apl-btn ghost" onClick={() => void load()}>Refresh</button>
            <Link className="apl-link" to="/admin/overview">Overview</Link>
          </div>
        </div>

        <div className="apl-body">
          {error ? <div className="apl-error">{error}</div> : null}
          {success ? <div className="apl-success">{success}</div> : null}

          <section className="apl-hero">
            <div className="apl-kicker">Platform Activation Control</div>
            <h1 className="apl-title">Platform Activation Control</h1>
            <div className="apl-copy">{data?.control.summary}</div>
          </section>

          <div className="apl-grid">
            <div className="apl-panel">
              <div className="apl-head">
                <div>
                  <div className="apl-kicker">Activation Queue</div>
                  <h2 className="apl-panel-title">Next to activate for users</h2>
                </div>
              </div>

              {queue ? (
                <div className="apl-queue">
                  <div className="apl-queue-top">
                    <div>
                      <h3 className="apl-queue-title">{queue.icon} {queue.name}</h3>
                      <div className="apl-queue-meta">
                        {queue.dependencies.map((dependency) => (
                          <span key={dependency.id} className={`apl-pill ${dependency.isLive ? "live" : "locked"}`}>
                            {dependency.isLive ? "✅" : "✗"} {dependency.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      className="apl-btn"
                      onClick={() => (queue.isReady ? void launchLayer(queue.layerId, queue.name) : void openChecklist(queue))}
                      disabled={busyId === queue.layerId}
                    >
                      {busyId === queue.layerId ? "Activating..." : queue.actionLabel}
                    </button>
                  </div>

                  <div className="apl-progress-row">
                    <div className="apl-progress"><div className="apl-progress-fill" style={{ width: `${queue.progress}%` }} /></div>
                    <div className="apl-progress-text">{queue.progress}%</div>
                  </div>

                  <div className="apl-inline">{formatIssueSummary(queue.blockingCount, queue.warningCount)}</div>
                  <div className="apl-note">FORGE: "{queue.forgeDirective}"</div>
                </div>
              ) : (
                <div className="apl-empty">No activation candidate is available right now.</div>
              )}
            </div>

            <div className="apl-panel">
              <div className="apl-head">
                <div>
                  <div className="apl-kicker">All Layers</div>
                  <h2 className="apl-panel-title">Sovereign activation matrix</h2>
                </div>
              </div>

              <div className="apl-table">
                {rows.map((row) => (
                  <div key={row.id} className="apl-row">
                    <div className="apl-row-main">
                      <div className="apl-row-icon">{row.icon}</div>
                      <div>
                        <div className="apl-row-name">{row.name}</div>
                        <div className="apl-row-badge">[{row.badge}]</div>
                      </div>
                    </div>

                    <div className={`apl-pill ${statusTone(row.badge)}`}>{row.progress}%</div>

                    <div>
                      <div className="apl-small-progress"><div className="apl-small-fill" style={{ width: `${row.progress}%` }} /></div>
                    </div>

                    <div className="apl-inline">{row.helperLabel ?? row.note}</div>

                    <div className="apl-row-right">
                      {row.actionMode === "admin_only" ? (
                        <span className="apl-inline">Fully managed</span>
                      ) : null}
                      {row.actionMode === "metrics" ? (
                        <>
                          <button className="apl-btn ghost" onClick={() => navigate(row.detailPath)}>Metrics</button>
                          {row.canSuspend ? (
                            <button className="apl-btn ghost" onClick={() => void suspendLayer(row.id, row.name)} disabled={busyId === row.id}>
                              {busyId === row.id ? "Suspending..." : "Suspend"}
                            </button>
                          ) : null}
                        </>
                      ) : null}
                      {row.actionMode === "launch" ? (
                        <button className="apl-btn" onClick={() => (row.blockingCount === 0 ? void launchLayer(row.id, row.name) : void openChecklist(row))} disabled={busyId === row.id}>
                          {busyId === row.id ? "Activating..." : row.actionLabel}
                        </button>
                      ) : null}
                      {row.actionMode === "locked" ? (
                        <button className="apl-btn ghost" onClick={() => void openChecklist(row)}>{row.actionLabel}</button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="apl-panel">
              <div className="apl-head">
                <div>
                  <div className="apl-kicker">Activation Impact Preview</div>
                  <h2 className="apl-panel-title">What happens when Market activates for users</h2>
                </div>
              </div>

              {impactPreview.length === 0 ? (
                <div className="apl-empty">No impact preview is available yet.</div>
              ) : (
                <div className="apl-impact">
                  {impactPreview.map((item) => (
                    <div key={`${item.icon}-${item.title}`} className="apl-impact-item">
                      <div className="apl-impact-icon">{item.icon}</div>
                      <div>
                        <div className="apl-impact-title">{item.title}</div>
                        <div className="apl-impact-copy">{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
