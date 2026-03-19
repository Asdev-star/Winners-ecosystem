import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";

type AdminActionModal = "plan" | "forge" | null;

type TimelineEvent = {
  id: string;
  timestamp: string;
  layer: string;
  type: string;
  title: string;
  description: string;
};

type LoopEntry = {
  id: string;
  loopType: string;
  trigger: string;
  currentStep: number;
  steps: unknown;
  outcome?: string | null;
  revenueImpact?: number | null;
  status: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  loopStage: string;
};

type UserDetailResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    deletedAt?: string | null;
    twoFactorEnabled: boolean;
    country?: string | null;
    city?: string | null;
    bio?: string | null;
    skills?: string[];
    industry?: string | null;
    isPublicProfile: boolean;
    profileViews: number;
    trustScore: number;
    trustScoreTier: string;
    trustScoreUpdatedAt?: string | null;
    plan: string;
    lastPostAt?: string | null;
    loopStage: string;
    forgeProfile: string;
    tenant: {
      id: string;
      name: string;
      plan: string;
      createdAt: string;
    };
    stats: {
      activeLoops: number;
      completedLoops: number;
      aiCreditsUsed: number;
      recentCommunityPosts: number;
      aiInteractions: number;
      certificates: number;
      enrollments: number;
      jobApplications: number;
      flaggedPosts: number;
      last7dActive: boolean;
    };
    moderation: {
      flaggedPosts: number;
      items: Array<{
        id: string;
        description: string;
        status: string;
        targetId?: string | null;
        createdAt: string;
      }>;
    };
    loops: LoopEntry[];
    aiUsage: Array<{
      agentType: string;
      interactions: number;
      tokens: number;
      cost: number;
    }>;
    timeline: TimelineEvent[];
  };
};

type ForgeMessageResponse = {
  message: string;
  preview: string;
};

type ResetPasswordResponse = {
  message: string;
  resetUrl: string;
  expiresAt: string;
};

type RevokeSessionsResponse = {
  message: string;
  revokedArtifacts: {
    passwordResetTokens: number;
    otpCodes: number;
  };
};

const css = `
  .uud-root{max-width:1320px;margin:0 auto;padding:28px 22px 88px;color:var(--text);font-family:'Syne',sans-serif}
  .uud-shell{border:1px solid rgba(201,168,76,.18);border-radius:28px;overflow:hidden;background:linear-gradient(180deg,rgba(9,16,28,.98),rgba(10,20,33,.97));box-shadow:0 28px 90px rgba(0,0,0,.34)}
  .uud-hero{padding:26px;border-bottom:1px solid rgba(201,168,76,.18);background:radial-gradient(circle at top right,rgba(201,168,76,.16),transparent 30%),linear-gradient(135deg,rgba(18,30,47,.95),rgba(10,18,30,.94))}
  .uud-top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}
  .uud-kicker{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
  .uud-title-row{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:8px}
  .uud-title{margin:0;font-size:36px;font-weight:800;letter-spacing:-.05em}
  .uud-sub{margin:10px 0 0;font-size:14px;line-height:1.6;color:var(--text-dim)}
  .uud-actions,.uud-modal-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .uud-link,.uud-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid rgba(201,168,76,.22);background:rgba(201,168,76,.1);color:var(--gold);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;cursor:pointer}
  .uud-link.ghost,.uud-btn.ghost{background:rgba(255,255,255,.03);border-color:var(--border);color:var(--text-dim)}
  .uud-btn.danger{border-color:rgba(224,90,78,.24);background:rgba(224,90,78,.1);color:var(--red)}
  .uud-btn:disabled{opacity:.54;cursor:not-allowed}
  .uud-body{padding:22px}
  .uud-banner{margin-bottom:16px;padding:12px 14px;border-radius:14px;border:1px solid var(--border);background:rgba(255,255,255,.03);font-size:13px;line-height:1.6}
  .uud-banner.error{border-color:rgba(224,90,78,.26);background:rgba(224,90,78,.08);color:#ffd0ca}
  .uud-banner.success{border-color:rgba(45,212,160,.24);background:rgba(45,212,160,.08);color:#c1ffe4}
  .uud-grid{display:grid;grid-template-columns:1.3fr .9fr;gap:18px;margin-bottom:18px}
  .uud-card{padding:20px;border-radius:20px;border:1px solid var(--border);background:linear-gradient(180deg,rgba(17,29,46,.88),rgba(12,21,35,.84))}
  .uud-header-card{display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center}
  .uud-avatar{width:78px;height:78px;border-radius:24px;background:linear-gradient(135deg,rgba(201,168,76,.3),rgba(137,196,225,.18));border:1px solid rgba(201,168,76,.24);display:grid;place-items:center;font-size:28px;font-weight:800;color:var(--gold)}
  .uud-user-meta{min-width:0}
  .uud-email{margin-top:6px;color:var(--text-dim);font-size:14px}
  .uud-pills{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
  .uud-pill{display:inline-flex;align-items:center;justify-content:center;padding:6px 10px;border-radius:999px;border:1px solid var(--border);background:rgba(255,255,255,.03);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
  .uud-pill.free{color:var(--ice);border-color:rgba(137,196,225,.26);background:rgba(137,196,225,.08)}
  .uud-pill.pro{color:var(--gold);border-color:rgba(201,168,76,.24);background:rgba(201,168,76,.08)}
  .uud-pill.enterprise{color:#d7c6ff;border-color:rgba(155,111,255,.28);background:rgba(155,111,255,.12)}
  .uud-trust-ring{width:112px;height:112px;border-radius:999px;display:grid;place-items:center;background:conic-gradient(var(--trust-color) calc(var(--trust-score) * 1%), rgba(255,255,255,.08) 0);padding:10px}
  .uud-trust-inner{width:100%;height:100%;border-radius:999px;background:rgba(9,16,28,.96);display:grid;place-items:center;text-align:center}
  .uud-trust-value{font-size:28px;font-weight:800;line-height:1}
  .uud-trust-label{margin-top:6px;font-family:'Space Mono',monospace;font-size:10px;color:var(--text-dim);letter-spacing:.1em;text-transform:uppercase}
  .uud-profile{padding:22px;border-radius:22px;border:1px solid rgba(201,168,76,.22);background:radial-gradient(circle at top right,rgba(137,196,225,.12),transparent 32%),linear-gradient(135deg,rgba(17,29,46,.95),rgba(11,20,33,.93))}
  .uud-profile-copy{margin:10px 0 0;font-size:15px;line-height:1.8;color:#f5f0df;white-space:pre-line}
  .uud-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}
  .uud-stat{padding:18px;border-radius:18px;border:1px solid var(--border);background:linear-gradient(180deg,rgba(17,29,46,.88),rgba(12,21,35,.84))}
  .uud-stat-label{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)}
  .uud-stat-value{margin-top:10px;font-size:30px;font-weight:800;letter-spacing:-.05em;color:var(--gold)}
  .uud-stat-sub{margin-top:8px;font-size:12px;color:var(--text-dim);line-height:1.5}
  .uud-section{margin-top:18px;padding:20px;border-radius:20px;border:1px solid var(--border);background:linear-gradient(180deg,rgba(17,29,46,.78),rgba(12,21,35,.8))}
  .uud-section-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px}
  .uud-section-title{margin:0;font-size:22px;font-weight:800;letter-spacing:-.03em}
  .uud-section-sub{margin:6px 0 0;font-size:13px;color:var(--text-dim);line-height:1.6}
  .uud-timeline{display:grid;gap:12px}
  .uud-timeline-item{display:grid;grid-template-columns:94px 1fr;gap:12px;padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.02)}
  .uud-time{font-family:'Space Mono',monospace;font-size:11px;color:var(--text-dim)}
  .uud-layer{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:rgba(137,196,225,.08);border:1px solid rgba(137,196,225,.2);font-family:'Space Mono',monospace;font-size:10px;color:var(--ice);text-transform:uppercase}
  .uud-entry-title{margin-top:6px;font-size:14px;font-weight:700}
  .uud-entry-copy{margin-top:6px;font-size:12px;color:var(--text-dim);line-height:1.6}
  .uud-loop-grid{display:grid;gap:12px}
  .uud-loop-card{padding:16px;border-radius:16px;border:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.02)}
  .uud-loop-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
  .uud-loop-name{font-size:15px;font-weight:700}
  .uud-loop-stage{margin-top:6px;font-size:12px;color:var(--text-dim)}
  .uud-loop-status{display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;border:1px solid var(--border);font-family:'Space Mono',monospace;font-size:10px;text-transform:uppercase}
  .uud-loop-status.active{color:var(--gold)}
  .uud-loop-status.completed{color:var(--green)}
  .uud-loop-status.failed{color:var(--red)}
  .uud-ai-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .uud-ai-card{padding:16px;border-radius:16px;border:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.02)}
  .uud-ai-top{display:flex;justify-content:space-between;gap:10px;align-items:center}
  .uud-ai-agent{font-size:14px;font-weight:700;text-transform:uppercase}
  .uud-ai-meta{font-size:12px;color:var(--text-dim)}
  .uud-ai-track{height:10px;margin-top:14px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden}
  .uud-ai-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--gold),#f6d778)}
  .uud-action-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
  .uud-action{padding:16px;border-radius:18px;border:1px solid var(--border);background:rgba(255,255,255,.03)}
  .uud-action h3{margin:0;font-size:15px}
  .uud-action p{margin:8px 0 14px;font-size:12px;color:var(--text-dim);line-height:1.6}
  .uud-empty{padding:18px;border-radius:16px;border:1px dashed var(--border);background:rgba(255,255,255,.03);color:var(--text-dim)}
  .uud-modal-backdrop{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:24px;background:rgba(3,8,15,.76);backdrop-filter:blur(10px)}
  .uud-modal{width:min(460px,100%);padding:22px;border-radius:20px;border:1px solid rgba(201,168,76,.22);background:linear-gradient(180deg,rgba(17,29,46,.98),rgba(11,19,31,.98));box-shadow:0 24px 80px rgba(0,0,0,.42)}
  .uud-modal-title{margin:10px 0 0;font-size:24px;font-weight:800}
  .uud-modal-copy{margin:10px 0 16px;font-size:13px;line-height:1.6;color:var(--text-dim)}
  .uud-select,.uud-textarea{width:100%;border-radius:12px;border:1px solid var(--border);background:rgba(8,14,24,.92);color:var(--text);padding:11px 12px;font:inherit}
  .uud-textarea{min-height:120px;resize:vertical}
  .uud-meta-list{display:grid;gap:10px}
  .uud-meta-row{display:flex;justify-content:space-between;gap:12px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.05);font-size:13px}
  .uud-meta-row:last-child{border-bottom:none;padding-bottom:0}
  .uud-meta-label{color:var(--text-dim)}
  .uud-skills{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
  .uud-skill{display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;background:rgba(137,196,225,.08);border:1px solid rgba(137,196,225,.2);font-family:'Space Mono',monospace;font-size:10px;color:var(--ice)}
  @media (max-width:1120px){.uud-grid{grid-template-columns:1fr}.uud-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.uud-action-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (max-width:760px){.uud-root{padding:18px 14px 88px}.uud-hero,.uud-body,.uud-section,.uud-card,.uud-profile{padding:16px}.uud-title{font-size:30px}.uud-header-card{grid-template-columns:1fr}.uud-trust-ring{width:96px;height:96px}.uud-stats,.uud-ai-grid,.uud-action-grid{grid-template-columns:1fr}.uud-timeline-item{grid-template-columns:1fr}}
`;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function trustTheme(score: number) {
  if (score <= 30) return { color: "#ff7d72", label: "Starter" };
  if (score <= 60) return { color: "#f4c96c", label: "Builder" };
  if (score <= 80) return { color: "#58d39b", label: "Creator" };
  return { color: "#ffe38b", label: "Elite" };
}

function fmtMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value ?? 0);
}

function fmtCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value ?? 0);
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers ?? {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export default function AdminUserDeepDivePage() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [data, setData] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [activeModal, setActiveModal] = useState<AdminActionModal>(null);
  const [planDraft, setPlanDraft] = useState("PRO");
  const [forgeMessage, setForgeMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        setLoading(true);
        const response = await apiRequest<UserDetailResponse>(`/admin/users/${id}`);
        if (!cancelled) {
          setData(response);
          setPlanDraft(response.user.plan);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load user");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadUser();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const user = data?.user ?? null;
  const trust = user ? trustTheme(user.trustScore) : trustTheme(50);
  const maxAiInteractions = Math.max(...(user?.aiUsage.map((entry) => entry.interactions) ?? [1]), 1);
  const orderedTimeline = useMemo(
    () => [...(user?.timeline ?? [])].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()),
    [user],
  );

  async function refreshUser() {
    const response = await apiRequest<UserDetailResponse>(`/admin/users/${id}`);
    setData(response);
    setPlanDraft(response.user.plan);
  }

  function closeModal() {
    setActiveModal(null);
  }

  async function savePlan() {
    if (!user) return;
    try {
      setBusyAction("plan");
      await apiRequest(`/admin/users/${user.id}/plan`, {
        method: "PATCH",
        body: JSON.stringify({ plan: planDraft }),
      });
      await refreshUser();
      setSuccess(`Workspace plan updated to ${planDraft}.`);
      setError("");
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change plan");
    } finally {
      setBusyAction("");
    }
  }

  async function sendForgeMessage() {
    if (!user) return;
    try {
      setBusyAction("forge");
      const response = await apiRequest<ForgeMessageResponse>(`/admin/users/${user.id}/forge-message`, {
        method: "POST",
        body: JSON.stringify({ message: forgeMessage }),
      });
      setSuccess(response.preview);
      setError("");
      setForgeMessage("");
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send FORGE message");
    } finally {
      setBusyAction("");
    }
  }

  async function toggleStatus() {
    if (!user) return;
    const nextStatus = user.deletedAt ? "ACTIVE" : "SUSPENDED";
    const confirmed = window.confirm(nextStatus === "SUSPENDED" ? `Suspend ${user.email}?` : `Restore ${user.email}?`);
    if (!confirmed) return;

    try {
      setBusyAction("status");
      await apiRequest(`/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await refreshUser();
      setSuccess(nextStatus === "SUSPENDED" ? `${user.email} suspended.` : `${user.email} restored.`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setBusyAction("");
    }
  }

  async function resetPassword() {
    if (!user) return;
    try {
      setBusyAction("reset");
      const response = await apiRequest<ResetPasswordResponse>(`/admin/users/${user.id}/reset-password`, { method: "POST" });
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(response.resetUrl);
        setSuccess(`Password reset link copied. Expires ${fmtDateTime(response.expiresAt)}.`);
      } else {
        setSuccess(`Password reset link created: ${response.resetUrl}`);
      }
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue password reset");
    } finally {
      setBusyAction("");
    }
  }

  async function revokeSessions() {
    if (!user) return;
    try {
      setBusyAction("revoke");
      const response = await apiRequest<RevokeSessionsResponse>(`/admin/users/${user.id}/revoke-sessions`, { method: "POST" });
      setSuccess(response.message);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke sessions");
    } finally {
      setBusyAction("");
    }
  }

  async function deleteUser() {
    if (!user) return;
    const confirmed = window.confirm(`Soft delete ${user.email}?`);
    if (!confirmed) return;

    try {
      setBusyAction("delete");
      await apiRequest(`/admin/users/${user.id}`, { method: "DELETE" });
      navigate("/admin/users", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setBusyAction("");
    }
  }

  function exportUserData() {
    if (!user) return;
    downloadFile(`user-${user.email.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-export.json`, JSON.stringify(data, null, 2), "application/json;charset=utf-8");
    setSuccess(`${user.email} data exported.`);
    setError("");
  }

  return (
    <div className="uud-root">
      <style>{css}</style>

      {activeModal ? (
        <div className="uud-modal-backdrop" onClick={closeModal}>
          <div className="uud-modal" onClick={(event) => event.stopPropagation()}>
            {activeModal === "plan" ? (
              <>
                <div className="uud-kicker">Change Plan</div>
                <h2 className="uud-modal-title">Change Workspace Plan</h2>
                <p className="uud-modal-copy">This changes the billing plan for {user?.tenant.name}, not just this user.</p>
                <select className="uud-select" value={planDraft} onChange={(event) => setPlanDraft(event.target.value)}>
                  <option value="FREE">FREE</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
                <div className="uud-modal-actions" style={{ justifyContent: "flex-end", marginTop: 16 }}>
                  <button className="uud-btn ghost" onClick={closeModal}>Cancel</button>
                  <button className="uud-btn" onClick={() => void savePlan()} disabled={busyAction === "plan"}>Save Plan</button>
                </div>
              </>
            ) : null}

            {activeModal === "forge" ? (
              <>
                <div className="uud-kicker">FORGE Message</div>
                <h2 className="uud-modal-title">Send Support Guidance</h2>
                <p className="uud-modal-copy">Log and queue a support or growth message for this user.</p>
                <textarea className="uud-textarea" value={forgeMessage} onChange={(event) => setForgeMessage(event.target.value)} placeholder="Write the message FORGE should send..." />
                <div className="uud-modal-actions" style={{ justifyContent: "flex-end", marginTop: 16 }}>
                  <button className="uud-btn ghost" onClick={closeModal}>Cancel</button>
                  <button className="uud-btn" onClick={() => void sendForgeMessage()} disabled={busyAction === "forge" || !forgeMessage.trim()}>Send</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="uud-shell">
        <section className="uud-hero">
          <div className="uud-top">
            <div>
              <div className="uud-kicker">Admin / Users / Deep Dive</div>
              <div className="uud-title-row"><h1 className="uud-title">{user?.name ?? "User Deep Dive"}</h1></div>
              <p className="uud-sub">Cross-layer identity, trust, activity, and administrative control for a single ecosystem user.</p>
            </div>
            <div className="uud-actions">
              <Link className="uud-link ghost" to="/admin/users">Back to users</Link>
              {user ? <button className="uud-btn ghost" onClick={() => navigate(`/admin/tenants/${user.tenant.id}`)}>Open tenant</button> : null}
            </div>
          </div>
        </section>

        <div className="uud-body">
          {error ? <div className="uud-banner error">{error}</div> : null}
          {success ? <div className="uud-banner success">{success}</div> : null}

          {loading && !user ? (
            <div className="uud-empty">Loading user intelligence surface...</div>
          ) : user ? (
            <>
              <div className="uud-grid">
                <section className="uud-card uud-header-card">
                  <div className="uud-avatar">{getInitials(user.name)}</div>
                  <div className="uud-user-meta">
                    <div className="uud-kicker">User Header</div>
                    <h2 style={{ margin: "8px 0 0", fontSize: 26 }}>{user.name}</h2>
                    <div className="uud-email">{user.email}</div>
                    <div className="uud-pills">
                      <span className={`uud-pill ${user.plan.toLowerCase()}`}>{user.plan} Plan</span>
                      <span className="uud-pill">{user.role}</span>
                      <span className="uud-pill">Joined {fmtDate(user.createdAt)}</span>
                    </div>
                  </div>
                  <div className="uud-trust-ring" style={{ ["--trust-color" as string]: trust.color, ["--trust-score" as string]: String(user.trustScore) }}>
                    <div className="uud-trust-inner">
                      <div className="uud-trust-value" style={{ color: trust.color }}>{user.trustScore}</div>
                      <div className="uud-trust-label">{trust.label}</div>
                    </div>
                  </div>
                </section>

                <section className="uud-card">
                  <div className="uud-kicker">Identity Snapshot</div>
                  <div className="uud-meta-list" style={{ marginTop: 14 }}>
                    <div className="uud-meta-row"><span className="uud-meta-label">Workspace</span><span>{user.tenant.name}</span></div>
                    <div className="uud-meta-row"><span className="uud-meta-label">Location</span><span>{[user.city, user.country].filter(Boolean).join(", ") || "—"}</span></div>
                    <div className="uud-meta-row"><span className="uud-meta-label">Industry</span><span>{user.industry ?? "—"}</span></div>
                    <div className="uud-meta-row"><span className="uud-meta-label">Public Profile</span><span>{user.isPublicProfile ? "Visible" : "Hidden"}</span></div>
                    <div className="uud-meta-row"><span className="uud-meta-label">2FA</span><span>{user.twoFactorEnabled ? "Enabled" : "Off"}</span></div>
                  </div>
                </section>
              </div>

              <section className="uud-profile">
                <div className="uud-kicker">FORGE Profile</div>
                <p className="uud-profile-copy">{user.forgeProfile}</p>
              </section>

              <section className="uud-stats">
                <div className="uud-stat"><div className="uud-stat-label">Trust Score</div><div className="uud-stat-value">{user.trustScore}</div><div className="uud-stat-sub">{trust.label} tier</div></div>
                <div className="uud-stat"><div className="uud-stat-label">Loop Stage</div><div className="uud-stat-value" style={{ fontSize: 18 }}>{user.loopStage}</div><div className="uud-stat-sub">{user.stats.completedLoops} completed loops</div></div>
                <div className="uud-stat"><div className="uud-stat-label">AI Credits Used</div><div className="uud-stat-value">{fmtCompact(user.stats.aiCreditsUsed)}</div><div className="uud-stat-sub">{user.stats.aiInteractions} recent AI interactions sampled</div></div>
                <div className="uud-stat"><div className="uud-stat-label">Moderation Flags</div><div className="uud-stat-value">{user.moderation.flaggedPosts}</div><div className="uud-stat-sub">{user.stats.last7dActive ? "Active in the last 7 days" : "Quiet in the last 7 days"}</div></div>
              </section>

              <div className="uud-grid">
                <section className="uud-card">
                  <div className="uud-section-head"><div><h2 className="uud-section-title">Cross-Layer Activity Timeline</h2><p className="uud-section-sub">Chronological actions across Community, Academy, Market, Work, and Intelligence.</p></div></div>
                  <div className="uud-timeline">
                    {orderedTimeline.length ? orderedTimeline.map((entry) => (
                      <div className="uud-timeline-item" key={entry.id}>
                        <div><div className="uud-time">{fmtDate(entry.timestamp)}</div><div style={{ marginTop: 8 }}><span className="uud-layer">{entry.layer}</span></div></div>
                        <div><div className="uud-entry-title">{entry.title}</div><div className="uud-entry-copy">{entry.description}</div></div>
                      </div>
                    )) : <div className="uud-empty">No cross-layer timeline events recorded yet.</div>}
                  </div>
                </section>

                <section className="uud-card">
                  <div className="uud-section-head"><div><h2 className="uud-section-title">Profile Context</h2><p className="uud-section-sub">Signals that shape trust, engagement, and intervention choices.</p></div></div>
                  <div className="uud-meta-list">
                    <div className="uud-meta-row"><span className="uud-meta-label">Last post</span><span>{fmtDate(user.lastPostAt)}</span></div>
                    <div className="uud-meta-row"><span className="uud-meta-label">Recent community posts</span><span>{user.stats.recentCommunityPosts}</span></div>
                    <div className="uud-meta-row"><span className="uud-meta-label">Enrollments</span><span>{user.stats.enrollments}</span></div>
                    <div className="uud-meta-row"><span className="uud-meta-label">Certificates</span><span>{user.stats.certificates}</span></div>
                    <div className="uud-meta-row"><span className="uud-meta-label">Job applications</span><span>{user.stats.jobApplications}</span></div>
                    <div className="uud-meta-row"><span className="uud-meta-label">Profile views</span><span>{user.profileViews}</span></div>
                  </div>
                  <div style={{ marginTop: 16, fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7 }}>{user.bio ?? "No bio recorded for this user yet."}</div>
                  <div className="uud-skills">
                    {(user.skills ?? []).length ? (user.skills ?? []).map((skill) => <span className="uud-skill" key={skill}>{skill}</span>) : <span className="uud-empty">No skills recorded.</span>}
                  </div>
                </section>
              </div>

              <section className="uud-section">
                <div className="uud-section-head"><div><h2 className="uud-section-title">Agentic Loop History</h2><p className="uud-section-sub">Completed and in-progress loops, including stage and revenue impact.</p></div></div>
                <div className="uud-loop-grid">
                  {user.loops.length ? user.loops.map((loop) => (
                    <div className="uud-loop-card" key={loop.id}>
                      <div className="uud-loop-top">
                        <div><div className="uud-loop-name">{loop.loopType.replace(/_/g, " ")}</div><div className="uud-loop-stage">{loop.loopStage} · Trigger: {loop.trigger}</div></div>
                        <span className={`uud-loop-status ${loop.status}`}>{loop.status}</span>
                      </div>
                      <div className="uud-entry-copy" style={{ marginTop: 10 }}>Revenue impact: {loop.revenueImpact ? fmtMoney(loop.revenueImpact) : "—"} · Updated {fmtDateTime(loop.updatedAt)}</div>
                      <div className="uud-entry-copy">{loop.outcome ?? "No final outcome recorded yet."}</div>
                    </div>
                  )) : <div className="uud-empty">No loop history recorded yet.</div>}
                </div>
              </section>

              <section className="uud-section">
                <div className="uud-section-head"><div><h2 className="uud-section-title">AI Credit Usage</h2><p className="uud-section-sub">Which supervisors this user interacts with most and where credit burn is concentrated.</p></div></div>
                <div className="uud-ai-grid">
                  {user.aiUsage.length ? user.aiUsage.map((entry) => (
                    <div className="uud-ai-card" key={entry.agentType}>
                      <div className="uud-ai-top"><div className="uud-ai-agent">{entry.agentType}</div><div className="uud-ai-meta">{entry.interactions} interactions</div></div>
                      <div className="uud-entry-copy">Tokens {fmtCompact(entry.tokens)} · Cost {fmtMoney(entry.cost)}</div>
                      <div className="uud-ai-track"><div className="uud-ai-fill" style={{ width: `${Math.max((entry.interactions / maxAiInteractions) * 100, 12)}%` }} /></div>
                    </div>
                  )) : <div className="uud-empty">No AI supervisor usage recorded yet.</div>}
                </div>
              </section>

              <section className="uud-section" id="actions">
                <div className="uud-section-head"><div><h2 className="uud-section-title">Admin Actions</h2><p className="uud-section-sub">High-trust interventions for plan, access, support, and compliance.</p></div></div>
                <div className="uud-action-grid">
                  <div className="uud-action"><h3>Change Plan</h3><p>Adjust the billing plan for this user's workspace.</p><button className="uud-btn" onClick={() => setActiveModal("plan")}>Change Plan</button></div>
                  <div className="uud-action"><h3>{user.deletedAt ? "Restore" : "Suspend"}</h3><p>Temporarily remove platform access without destroying the profile.</p><button className="uud-btn ghost" onClick={() => void toggleStatus()} disabled={busyAction === "status"}>{busyAction === "status" ? "Saving..." : user.deletedAt ? "Restore" : "Suspend"}</button></div>
                  <div className="uud-action"><h3>Delete</h3><p>Soft delete the user record from the active ecosystem surface.</p><button className="uud-btn danger" onClick={() => void deleteUser()} disabled={busyAction === "delete"}>Delete</button></div>
                  <div className="uud-action"><h3>Send FORGE Message</h3><p>Queue a personalized support or growth message for this user.</p><button className="uud-btn" onClick={() => setActiveModal("forge")}>Send FORGE Message</button></div>
                  <div className="uud-action"><h3>Reset Password</h3><p>Generate a fresh password reset link and copy it for secure handoff.</p><button className="uud-btn ghost" onClick={() => void resetPassword()} disabled={busyAction === "reset"}>{busyAction === "reset" ? "Working..." : "Reset Password"}</button></div>
                  <div className="uud-action"><h3>Revoke Sessions</h3><p>Invalidate pending reset links and OTP challenges tied to this identity.</p><button className="uud-btn ghost" onClick={() => void revokeSessions()} disabled={busyAction === "revoke"}>{busyAction === "revoke" ? "Working..." : "Revoke Sessions"}</button></div>
                  <div className="uud-action"><h3>GDPR Data Export</h3><p>Download the loaded deep-dive payload for compliance review and portability.</p><button className="uud-btn ghost" onClick={exportUserData}>GDPR Data Export</button></div>
                  <div className="uud-action"><h3>Moderation Review</h3><p>{user.moderation.flaggedPosts} flagged items currently tied to this user.</p><button className="uud-btn ghost" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Review Signals</button></div>
                </div>
              </section>
            </>
          ) : (
            <div className="uud-empty">This user could not be loaded.</div>
          )}
        </div>
      </div>
    </div>
  );
}
