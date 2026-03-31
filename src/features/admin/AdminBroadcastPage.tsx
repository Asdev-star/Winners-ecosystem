import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";

type BroadcastChannel = "in_app" | "push" | "email";
type AudienceKind = "all" | "plan" | "layer" | "segment";
type LayerId = "community" | "academy" | "market" | "work" | "cloud" | "intelligence";
type PlanTier = "FREE" | "PRO" | "ENTERPRISE";
type SegmentId = "at_risk" | "platinum" | "inactive_7d";
type BroadcastType = "platform_news" | "layer_launch" | "maintenance" | "milestone" | "forge_insight";
type ScheduleMode = "send_now" | "specific_time" | "next_omega";

type BroadcastSnapshot = {
  generatedAt: string;
  supervisor: string;
  description: string;
  audiences: {
    allUsers: number;
    free: number;
    pro: number;
    enterprise: number;
  };
  layers: Array<{
    id: LayerId;
    label: string;
    count: number;
    statusLabel: string;
    statusTone: "live" | "in_progress";
  }>;
  recentBroadcasts: Array<{
    id: string;
    title: string;
    body: string;
    ctaLabel: string | null;
    ctaUrl: string | null;
    broadcastType: BroadcastType;
    createdAt: string;
    recipients: number;
    channels: BroadcastChannel[];
    audienceLabel: string;
    openRateLabel: string;
    clickRateLabel: string;
    status: "sent" | "scheduled";
    scheduledFor: string | null;
    scheduleMode: ScheduleMode;
  }>;
};

const CHANNEL_LABELS: Record<BroadcastChannel, string> = {
  in_app: "In-App",
  push: "Push Notification",
  email: "Email",
};

const css = `
  .aob-page{max-width:1440px;margin:0 auto;padding:28px 22px 92px;color:var(--text);font-family:'Syne',sans-serif}
  .aob-shell{border:1px solid rgba(201,168,76,.18);border-radius:30px;overflow:hidden;background:radial-gradient(circle at top right, rgba(201,168,76,.11), transparent 32%),radial-gradient(circle at bottom left, rgba(137,196,225,.08), transparent 26%),linear-gradient(180deg, rgba(7,13,21,.99), rgba(11,18,29,.98));box-shadow:0 30px 90px rgba(0,0,0,.34)}
  .aob-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:20px 24px 22px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(6,11,18,.8)}
  .aob-kicker,.aob-label{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold)}
  .aob-title{margin:10px 0 0;font-size:clamp(28px,4vw,42px);letter-spacing:-.05em;line-height:1}
  .aob-subtitle,.aob-sub{margin:12px 0 0;max-width:760px;color:var(--text-dim);font-size:14px;line-height:1.65}
  .aob-actions,.aob-chip-row,.aob-row-actions,.aob-meta,.aob-history-meta{display:flex;gap:10px;flex-wrap:wrap}
  .aob-link,.aob-btn,.aob-chip,.aob-pill{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.03);color:var(--text-dim);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;cursor:pointer}
  .aob-link,.aob-btn{min-height:42px;border-color:rgba(201,168,76,.22);background:rgba(201,168,76,.08);color:var(--gold)}
  .aob-link.ghost,.aob-btn.ghost{border-color:var(--border);background:rgba(255,255,255,.03);color:var(--text-dim)}
  .aob-chip.active{border-color:rgba(201,168,76,.26);background:rgba(201,168,76,.1);color:var(--gold)}
  .aob-pill.sent{color:var(--green);border-color:rgba(45,212,160,.22);background:rgba(45,212,160,.08)}
  .aob-pill.scheduled{color:var(--gold);border-color:rgba(201,168,76,.22);background:rgba(201,168,76,.08)}
  .aob-btn:disabled{opacity:.6;cursor:not-allowed}
  .aob-body{padding:24px;display:grid;gap:18px}
  .aob-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(340px,.95fr);gap:18px}
  .aob-panel,.aob-preview{border:1px solid rgba(255,255,255,.08);border-radius:24px;background:linear-gradient(180deg, rgba(17,27,39,.94), rgba(10,17,27,.94));padding:18px}
  .aob-preview{border-color:rgba(201,168,76,.16);background:linear-gradient(180deg, rgba(201,168,76,.08), rgba(255,255,255,.02))}
  .aob-panel-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}
  .aob-panel-title{margin:0;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
  .aob-row{display:grid;grid-template-columns:110px minmax(0,1fr);gap:14px;align-items:start;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.06)}
  .aob-row:last-child{border-bottom:none;padding-bottom:0}
  .aob-key{color:var(--text-dim);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding-top:8px}
  .aob-omega{display:inline-flex;align-items:center;gap:10px;padding:10px 14px;border-radius:18px;border:1px solid rgba(201,168,76,.22);background:linear-gradient(180deg, rgba(201,168,76,.14), rgba(201,168,76,.05));color:var(--text);font-weight:700}
  .aob-mark{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:rgba(201,168,76,.18);color:var(--gold);font-size:18px}
  .aob-select,.aob-textarea,.aob-schedule input{width:100%;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:var(--text);font:inherit}
  .aob-input{width:100%;min-height:44px;border-radius:16px;padding:0 14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:var(--text);font:inherit}
  .aob-select{min-height:44px;border-radius:16px;padding:0 14px}
  .aob-textarea{min-height:220px;resize:vertical;border-radius:22px;padding:18px;line-height:1.75}
  .aob-toolbar{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;margin-top:14px}
  .aob-recipient,.aob-history-copy,.aob-empty{color:var(--text-dim);font-size:13px;line-height:1.6}
  .aob-recipient strong,.aob-history-title,.aob-layer-name,.aob-preview-title{color:var(--text);font-weight:800}
  .aob-schedule{display:flex;align-items:center;gap:10px;padding:6px 6px 6px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}
  .aob-schedule input{min-height:38px;border:none;outline:none;background:transparent}
  .aob-note,.aob-error{padding:14px 16px;border-radius:18px;font-size:13px;line-height:1.6}
  .aob-note{border:1px solid rgba(201,168,76,.2);background:rgba(201,168,76,.08);color:var(--gold)}
  .aob-error{border:1px solid rgba(224,90,78,.2);background:rgba(224,90,78,.08);color:#FFB0A7}
  .aob-preview-body{white-space:pre-wrap;color:var(--text);font-size:15px;line-height:1.8}
  .aob-side{display:grid;gap:18px}
  .aob-stat-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .aob-stat,.aob-layer,.aob-history-item{padding:16px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}
  .aob-stat-label{color:var(--text-dim);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.09em;text-transform:uppercase}
  .aob-stat-value{margin-top:10px;font-size:26px;font-weight:800;letter-spacing:-.05em}
  .aob-layer-list,.aob-history{display:grid;gap:12px}
  .aob-layer,.aob-history-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:flex-start}
  .aob-layer-sub,.aob-history-meta{margin-top:8px;color:var(--text-dim);font-size:13px;line-height:1.6}
  .aob-empty{padding:18px;border-radius:18px;border:1px dashed rgba(255,255,255,.12)}
  .aob-load{display:grid;gap:14px}
  .aob-skel{height:120px;border-radius:24px;background:linear-gradient(90deg, rgba(255,255,255,.03), rgba(255,255,255,.08), rgba(255,255,255,.03));background-size:200% 100%;animation:aob-shimmer 1.2s linear infinite}
  @keyframes aob-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
  @media (max-width:1120px){.aob-grid{grid-template-columns:1fr}}
  @media (max-width:760px){.aob-page{padding:18px 12px 84px}.aob-head,.aob-body{padding:16px}.aob-head{flex-direction:column}.aob-row,.aob-layer,.aob-history-item{grid-template-columns:1fr}.aob-stat-grid{grid-template-columns:1fr}}
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

function defaultScheduleValue() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}`;
}

function previewTitle(message: string) {
  const firstLine = message.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return firstLine?.slice(0, 88) || "OMEGA Broadcast";
}

const BROADCAST_TYPE_LABELS: Record<BroadcastType, string> = {
  platform_news: "Platform News",
  layer_launch: "Layer Launch Notification",
  maintenance: "Maintenance Notice",
  milestone: "Milestone Celebration",
  forge_insight: "FORGE Insight",
};

export default function AdminBroadcastPage() {
  const [snapshot, setSnapshot] = useState<BroadcastSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [audienceKind, setAudienceKind] = useState<AudienceKind>("all");
  const [plan, setPlan] = useState<PlanTier>("PRO");
  const [layerId, setLayerId] = useState<LayerId>("market");
  const [segment, setSegment] = useState<SegmentId>("at_risk");
  const [channels, setChannels] = useState<BroadcastChannel[]>(["in_app", "push", "email"]);
  const [broadcastType, setBroadcastType] = useState<BroadcastType>("platform_news");
  const [title, setTitle] = useState("Market launch update");
  const [message, setMessage] = useState("Winners Market activates for users this Thursday.\nATLAS has already prepared the product intelligence.\nYour store directive is cleared for activation.\nVisit Market -> winnersempire.io/market");
  const [ctaLabel, setCtaLabel] = useState("Open Market");
  const [ctaUrl, setCtaUrl] = useState("https://winnersempire.io/market");
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("send_now");
  const [scheduleAt, setScheduleAt] = useState(defaultScheduleValue);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load(initial = false) {
      try {
        if (initial) setLoading(true);
        else setRefreshing(true);
        const res = await fetch(`${API_BASE}/admin/broadcast/panel`, { headers: getAuthHeaders() });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? "Failed to load OMEGA Broadcast");
        }
        if (!active) return;
        setSnapshot(body as BroadcastSnapshot);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load OMEGA Broadcast");
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
    const id = window.setTimeout(() => setNote(""), 3200);
    return () => window.clearTimeout(id);
  }, [note]);

  const recipientCount = useMemo(() => {
    if (!snapshot) return 0;
    if (audienceKind === "all") return snapshot.audiences.allUsers;
    if (audienceKind === "plan") {
      return plan === "FREE" ? snapshot.audiences.free : plan === "PRO" ? snapshot.audiences.pro : snapshot.audiences.enterprise;
    }
    if (audienceKind === "segment") {
      if (segment === "at_risk") return Math.round(snapshot.audiences.allUsers * 0.18);
      if (segment === "platinum") return Math.round(snapshot.audiences.allUsers * 0.08);
      return Math.round(snapshot.audiences.allUsers * 0.22);
    }
    return snapshot.layers.find((layer) => layer.id === layerId)?.count ?? 0;
  }, [audienceKind, layerId, plan, segment, snapshot]);

  const audienceLabel = useMemo(() => {
    if (audienceKind === "all") return "All Users";
    if (audienceKind === "plan") return plan === "FREE" ? "Free Users" : plan === "PRO" ? "PRO Users" : "Enterprise Users";
    if (audienceKind === "segment") return segment === "at_risk" ? "At-Risk Users" : segment === "platinum" ? "Platinum Advocates" : "Inactive (7d) Users";
    return `${snapshot?.layers.find((layer) => layer.id === layerId)?.label ?? layerId} Layer`;
  }, [audienceKind, layerId, plan, segment, snapshot]);

  const allChannelsSelected = channels.length === 3;

  async function refreshPanel() {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/broadcast/panel`, { headers: getAuthHeaders() });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? "Failed to refresh OMEGA Broadcast");
      }
      setSnapshot(body as BroadcastSnapshot);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh OMEGA Broadcast");
    } finally {
      setRefreshing(false);
    }
  }

  function toggleChannel(channel: BroadcastChannel) {
    setChannels((current) => {
      if (current.includes(channel)) {
        const next = current.filter((entry) => entry !== channel);
        return next.length ? next : current;
      }
      return [...current, channel];
    });
  }

  async function draftWithForge() {
    setDrafting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/broadcast/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ audienceKind, plan, layerId, segment }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? "Failed to draft broadcast");
      }
      const draft = String((body as { message?: string }).message ?? "");
      setTitle(previewTitle(draft));
      setMessage(draft);
      setPreviewOpen(true);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to draft broadcast");
    } finally {
      setDrafting(false);
    }
  }

  async function sendNow() {
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/admin/broadcast/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ audienceKind, plan, layerId, segment, channels, title, body: message, ctaLabel, ctaUrl, broadcastType, scheduleMode }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? "Failed to send broadcast");
      }
      const result = body as { message?: string; emailSkipped?: boolean };
      setNote(result.emailSkipped ? `${result.message ?? "OMEGA broadcast sent"} Email delivery was skipped because Resend is not configured.` : result.message ?? "OMEGA broadcast sent");
      setPreviewOpen(false);
      setError("");
      await refreshPanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  }

  async function scheduleBroadcast() {
    setScheduling(true);
    try {
      const res = await fetch(`${API_BASE}/admin/broadcast/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ audienceKind, plan, layerId, segment, channels, title, body: message, ctaLabel, ctaUrl, broadcastType, scheduleMode, scheduleAt }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? "Failed to schedule broadcast");
      }
      setNote(`${(body as { message?: string }).message ?? "OMEGA broadcast scheduled"}. Automatic dispatch is not wired yet, so this acts as an operator schedule checkpoint.`);
      setError("");
      await refreshPanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule broadcast");
    } finally {
      setScheduling(false);
    }
  }

  if (loading && !snapshot) {
    return (
      <div className="aob-page">
        <style>{css}</style>
        <div className="aob-load">
          <div className="aob-skel" />
          <div className="aob-skel" />
          <div className="aob-skel" />
        </div>
      </div>
    );
  }

  return (
    <div className="aob-page">
      <style>{css}</style>
      <div className="aob-shell">
        <div className="aob-head">
          <div>
            <div className="aob-kicker">Admin / OMEGA Broadcast / Route: /admin/broadcast</div>
            <h1 className="aob-title">OMEGA BROADCAST</h1>
            <p className="aob-subtitle">"Issue ecosystem-wide directives as OMEGA. One sovereign voice across every joined user."</p>
          </div>
          <div className="aob-actions">
            <Link className="aob-link ghost" to="/admin/forge">FORGE</Link>
            <button className="aob-btn" onClick={() => void refreshPanel()} disabled={refreshing}>{refreshing ? "Refreshing" : "Refresh"}</button>
          </div>
        </div>

        <div className="aob-body">
          {error ? <div className="aob-error">{error}</div> : null}
          {note ? <div className="aob-note">{note}</div> : null}

          <div className="aob-grid">
            <div style={{ display: "grid", gap: 18 }}>
              <section className="aob-panel">
                <div className="aob-panel-head">
                  <div>
                    <h2 className="aob-panel-title">Compose Directive</h2>
                    <div className="aob-sub">Supervisor: {snapshot?.supervisor ?? "OMEGA"}.</div>
                  </div>
                </div>

                <div className="aob-row">
                  <div className="aob-key">From</div>
                  <div><div className="aob-omega"><span className="aob-mark">🧠</span>OMEGA (always)</div></div>
                </div>

                <div className="aob-row">
                  <div className="aob-key">To</div>
                  <div>
                    <div className="aob-chip-row" style={{ marginBottom: 10 }}>
                      <button type="button" className={`aob-chip ${audienceKind === "all" ? "active" : ""}`} onClick={() => setAudienceKind("all")}>All Users</button>
                      <button type="button" className={`aob-chip ${audienceKind === "plan" ? "active" : ""}`} onClick={() => setAudienceKind("plan")}>Plan Tier</button>
                      <button type="button" className={`aob-chip ${audienceKind === "layer" ? "active" : ""}`} onClick={() => setAudienceKind("layer")}>Layer</button>
                      <button type="button" className={`aob-chip ${audienceKind === "segment" ? "active" : ""}`} onClick={() => setAudienceKind("segment")}>User Segment</button>
                    </div>
                    {audienceKind === "plan" ? (
                      <select className="aob-select" value={plan} onChange={(event) => setPlan(event.target.value as PlanTier)}>
                        <option value="FREE">Free</option>
                        <option value="PRO">Pro</option>
                        <option value="ENTERPRISE">Enterprise</option>
                      </select>
                    ) : null}
                    {audienceKind === "layer" ? (
                      <select className="aob-select" value={layerId} onChange={(event) => setLayerId(event.target.value as LayerId)}>
                        {(snapshot?.layers ?? []).map((layer) => (
                          <option key={layer.id} value={layer.id}>{layer.label} ({layer.count.toLocaleString("en-US")})</option>
                        ))}
                      </select>
                    ) : null}
                    {audienceKind === "segment" ? (
                      <select className="aob-select" value={segment} onChange={(event) => setSegment(event.target.value as SegmentId)}>
                        <option value="at_risk">At-Risk Users</option>
                        <option value="platinum">Platinum Advocates</option>
                        <option value="inactive_7d">Inactive (7d) Users</option>
                      </select>
                    ) : null}
                  </div>
                </div>

                <div className="aob-row">
                  <div className="aob-key">Type</div>
                  <div>
                    <select className="aob-select" value={broadcastType} onChange={(event) => setBroadcastType(event.target.value as BroadcastType)}>
                      {Object.entries(BROADCAST_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="aob-row">
                  <div className="aob-key">Title</div>
                  <div>
                    <input className="aob-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Broadcast title" />
                  </div>
                </div>

                <div className="aob-row">
                  <div className="aob-key">Channel</div>
                  <div className="aob-chip-row">
                    {(["in_app", "push", "email"] as BroadcastChannel[]).map((channel) => (
                      <button key={channel} type="button" className={`aob-chip ${channels.includes(channel) ? "active" : ""}`} onClick={() => toggleChannel(channel)}>
                        {CHANNEL_LABELS[channel]}
                      </button>
                    ))}
                    <button type="button" className={`aob-chip ${allChannelsSelected ? "active" : ""}`} onClick={() => setChannels(allChannelsSelected ? ["in_app"] : ["in_app", "push", "email"])}>All</button>
                  </div>
                </div>

                <div className="aob-row">
                  <div className="aob-key">Message</div>
                  <div>
                    <textarea className="aob-textarea" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="FORGE will brief and draft this for you." />
                    <div className="aob-row-actions" style={{ marginTop: 12 }}>
                      <input className="aob-input" value={ctaLabel} onChange={(event) => setCtaLabel(event.target.value)} placeholder="CTA label" />
                      <input className="aob-input" value={ctaUrl} onChange={(event) => setCtaUrl(event.target.value)} placeholder="CTA URL" />
                    </div>
                    <div className="aob-toolbar">
                      <div className="aob-row-actions">
                        <button className="aob-btn ghost" type="button" onClick={() => void draftWithForge()} disabled={drafting}>{drafting ? "Briefing" : "Request FORGE Brief"}</button>
                        <button className="aob-btn ghost" type="button" onClick={() => setPreviewOpen((current) => !current)} disabled={!message.trim()}>{previewOpen ? "Hide Preview" : "Preview"}</button>
                      </div>
                      <div className="aob-recipient">Recipients: <strong>{recipientCount.toLocaleString("en-US")}</strong></div>
                    </div>
                    <div className="aob-row-actions" style={{ marginTop: 18 }}>
                      <div className="aob-schedule">
                        <span className="aob-key" style={{ paddingTop: 0 }}>Schedule</span>
                        <select className="aob-select" value={scheduleMode} onChange={(event) => setScheduleMode(event.target.value as ScheduleMode)}>
                          <option value="send_now">Send Now</option>
                          <option value="specific_time">Specific Time</option>
                          <option value="next_omega">Next OMEGA Briefing</option>
                        </select>
                        {scheduleMode === "specific_time" ? <input type="datetime-local" value={scheduleAt} onChange={(event) => setScheduleAt(event.target.value)} /> : null}
                        <button className="aob-btn ghost" type="button" onClick={() => void scheduleBroadcast()} disabled={scheduling || !message.trim()}>{scheduling ? "Queueing" : scheduleMode === "next_omega" ? "Queue for OMEGA" : "Queue Directive"}</button>
                      </div>
                      <button className="aob-btn" type="button" onClick={() => void sendNow()} disabled={sending || !message.trim()}>{sending ? "Issuing" : "Issue Now"}</button>
                    </div>
                  </div>
                </div>
              </section>

              {previewOpen && message.trim() ? (
                <section className="aob-preview">
                  <div className="aob-kicker">Preview</div>
                  <h2 className="aob-preview-title">{title || previewTitle(message)}</h2>
                  <div className="aob-meta">
                    <span className="aob-pill">{audienceLabel}</span>
                    <span className="aob-pill">{recipientCount.toLocaleString("en-US")} recipients</span>
                    <span className="aob-pill">{BROADCAST_TYPE_LABELS[broadcastType]}</span>
                    {channels.map((channel) => <span key={channel} className="aob-pill">{CHANNEL_LABELS[channel]}</span>)}
                  </div>
                  <div className="aob-preview-body">{message}</div>
                  {ctaLabel ? <div className="aob-preview-body" style={{ marginTop: 14 }}><strong>{ctaLabel}</strong>{ctaUrl ? ` -> ${ctaUrl}` : ""}</div> : null}
                </section>
              ) : null}
            </div>

            <div className="aob-side">
              <section className="aob-panel">
                <div className="aob-panel-head">
                  <div>
                    <h2 className="aob-panel-title">Audience Snapshot</h2>
                    <div className="aob-sub">Last updated {snapshot ? relativeTime(snapshot.generatedAt) : "just now"}.</div>
                  </div>
                </div>
                <div className="aob-stat-grid">
                  <div className="aob-stat"><div className="aob-stat-label">All Users</div><div className="aob-stat-value">{snapshot?.audiences.allUsers.toLocaleString("en-US") ?? "0"}</div></div>
                  <div className="aob-stat"><div className="aob-stat-label">Free</div><div className="aob-stat-value">{snapshot?.audiences.free.toLocaleString("en-US") ?? "0"}</div></div>
                  <div className="aob-stat"><div className="aob-stat-label">PRO</div><div className="aob-stat-value">{snapshot?.audiences.pro.toLocaleString("en-US") ?? "0"}</div></div>
                  <div className="aob-stat"><div className="aob-stat-label">Enterprise</div><div className="aob-stat-value">{snapshot?.audiences.enterprise.toLocaleString("en-US") ?? "0"}</div></div>
                </div>
              </section>

              <section className="aob-panel">
                <div className="aob-panel-head">
                  <div>
                    <h2 className="aob-panel-title">Layer Reach</h2>
                    <div className="aob-sub">Distinct users currently detected inside each platform layer.</div>
                  </div>
                </div>
                <div className="aob-layer-list">
                  {(snapshot?.layers ?? []).map((layer) => (
                    <div key={layer.id} className="aob-layer">
                      <div>
                        <div className="aob-layer-name">{layer.label}</div>
                        <div className="aob-layer-sub">{layer.count.toLocaleString("en-US")} reachable users</div>
                      </div>
                      <button type="button" className={`aob-chip ${audienceKind === "layer" && layerId === layer.id ? "active" : ""}`} onClick={() => { setAudienceKind("layer"); setLayerId(layer.id); }}>
                        {layer.statusLabel}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <section className="aob-panel">
            <div className="aob-panel-head">
              <div>
                <h2 className="aob-panel-title">Issued Directives</h2>
                <div className="aob-sub">Recent OMEGA directive history, including scheduled operator checkpoints.</div>
              </div>
            </div>
            {snapshot?.recentBroadcasts.length ? (
              <div className="aob-history">
                {snapshot.recentBroadcasts.map((entry) => (
                  <div key={entry.id} className="aob-history-item">
                    <div>
                      <div className="aob-history-title">{entry.title}</div>
                      <div className="aob-history-meta">
                        {entry.scheduledFor ? `Scheduled for ${formatDateTime(entry.scheduledFor)}` : formatDateTime(entry.createdAt)} · {entry.audienceLabel} · {entry.recipients.toLocaleString("en-US")} recipients · {entry.openRateLabel}
                        <br />
                        Channels: {entry.channels.map((channel) => CHANNEL_LABELS[channel]).join(" / ") || "None"}
                      </div>
                    </div>
                    <span className={`aob-pill ${entry.status}`}>{entry.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="aob-empty">No OMEGA directives have been recorded yet. Your next issue or schedule action will appear here.</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
