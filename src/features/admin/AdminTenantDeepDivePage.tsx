import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders, useAuthStore } from "../auth/authStore";

type UsageSlice = {
  label: string;
  value: number;
  status: string;
};

type TenantUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  twoFactorEnabled: boolean;
  lastActivityAt?: string | null;
  layersUsed: string[];
  loopStage: string;
};

type TenantDetailResponse = {
  tenant: {
    id: string;
    name: string;
    plan: string;
    createdAt: string;
    timezone?: string;
    currency?: string;
    fiscalMonth?: number;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    totalRevenue: number;
    last30Revenue: number;
    previous30Revenue: number;
    revenueDeltaPct: number;
    activeUserCount: number;
    activeLoopCount: number;
    aiCreditsUsed: number;
    deletedAt?: string | null;
    owner?: { id: string; name: string; email: string } | null;
    forgeProfile: string;
    usage: {
      community: UsageSlice;
      academy: UsageSlice;
      intelligence: UsageSlice;
      work: UsageSlice;
    };
    users: TenantUser[];
    revenueRecords: Array<{
      id: string;
      amount: number;
      currency: string;
      source: string;
      description?: string | null;
      recordedAt: string;
    }>;
    _count: {
      users: number;
      revenueRecords: number;
      posts: number;
      groups: number;
      orders: number;
    };
  };
};

type InviteResponse = {
  message: string;
  invite: {
    id: string;
    email: string;
    role: string;
  };
};

type ForgeMessageResponse = {
  message: string;
  preview: string;
};

type ImpersonationResponse = {
  impersonationToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: "owner" | "admin" | "member" | "viewer";
    tenantId: string;
    tenantName: string;
    isImpersonation?: boolean;
    impersonatedByAdminId?: string;
  };
};

type AdminActionModal = "plan" | "invite" | "forge" | null;

const css = `
  .tdd-root{max-width:1320px;margin:0 auto;padding:28px 22px 88px;color:var(--text);font-family:'Syne',sans-serif}
  .tdd-shell{border:1px solid rgba(201,168,76,.18);border-radius:28px;overflow:hidden;background:linear-gradient(180deg,rgba(9,16,28,.98),rgba(10,20,33,.97));box-shadow:0 28px 90px rgba(0,0,0,.34)}
  .tdd-hero{padding:26px 26px 24px;border-bottom:1px solid rgba(201,168,76,.18);background:radial-gradient(circle at top right,rgba(201,168,76,.16),transparent 30%),linear-gradient(135deg,rgba(18,30,47,.95),rgba(10,18,30,.94))}
  .tdd-topline{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}
  .tdd-kicker{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
  .tdd-title{margin:8px 0 0;font-size:36px;font-weight:800;letter-spacing:-.05em}
  .tdd-subtitle{margin:10px 0 0;font-size:14px;color:var(--text-dim);line-height:1.6}
  .tdd-title-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .tdd-pill{display:inline-flex;align-items:center;justify-content:center;padding:7px 12px;border-radius:999px;border:1px solid rgba(201,168,76,.22);background:rgba(255,255,255,.04);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
  .tdd-pill.enterprise{color:#dccdff;border-color:rgba(155,111,255,.26);background:rgba(155,111,255,.14)}
  .tdd-pill.pro{color:var(--gold);border-color:rgba(201,168,76,.24);background:rgba(201,168,76,.1)}
  .tdd-pill.free{color:var(--ice);border-color:rgba(137,196,225,.24);background:rgba(137,196,225,.08)}
  .tdd-actions,.tdd-modal-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .tdd-body{padding:22px}
  .tdd-banner{margin-bottom:16px;padding:12px 14px;border-radius:14px;border:1px solid var(--border);background:rgba(255,255,255,.03);font-size:13px;line-height:1.6}
  .tdd-banner.error{border-color:rgba(224,90,78,.26);background:rgba(224,90,78,.08);color:#ffd0ca}
  .tdd-banner.success{border-color:rgba(45,212,160,.24);background:rgba(45,212,160,.08);color:#c1ffe4}
  .tdd-button,.tdd-link{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid rgba(201,168,76,.22);background:rgba(201,168,76,.1);color:var(--gold);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;cursor:pointer}
  .tdd-button.ghost,.tdd-link.ghost{background:rgba(255,255,255,.03);border-color:var(--border);color:var(--text-dim)}
  .tdd-button.danger{border-color:rgba(224,90,78,.24);background:rgba(224,90,78,.1);color:var(--red)}
  .tdd-button:disabled{opacity:.54;cursor:not-allowed}
  .tdd-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:18px;margin-bottom:18px}
  .tdd-card{padding:20px;border-radius:20px;border:1px solid var(--border);background:linear-gradient(180deg,rgba(17,29,46,.9),rgba(12,21,35,.88))}
  .tdd-profile{padding:22px;border-radius:22px;border:1px solid rgba(201,168,76,.22);background:radial-gradient(circle at top right,rgba(137,196,225,.12),transparent 32%),linear-gradient(135deg,rgba(17,29,46,.95),rgba(11,20,33,.93))}
  .tdd-profile-copy{margin:10px 0 0;font-size:15px;line-height:1.8;color:#f5f0df;white-space:pre-line}
  .tdd-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}
  .tdd-metric{padding:18px;border-radius:18px;border:1px solid var(--border);background:linear-gradient(180deg,rgba(17,29,46,.88),rgba(12,21,35,.84))}
  .tdd-metric-label{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)}
  .tdd-metric-value{margin-top:10px;font-size:30px;font-weight:800;letter-spacing:-.05em;color:var(--gold)}
  .tdd-metric-sub{margin-top:8px;font-size:12px;color:var(--text-dim);line-height:1.5}
  .tdd-usage-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
  .tdd-usage-item{padding:16px;border-radius:16px;border:1px solid var(--border);background:rgba(255,255,255,.02)}
  .tdd-usage-head{display:flex;justify-content:space-between;gap:10px;align-items:center}
  .tdd-usage-name{font-size:14px;font-weight:700}
  .tdd-usage-meta{font-size:12px;color:var(--text-dim);text-align:right}
  .tdd-usage-track{height:10px;margin-top:14px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden}
  .tdd-usage-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--gold),#f6d778)}
  .tdd-mini-list{display:grid;gap:10px}
  .tdd-mini-row{display:flex;justify-content:space-between;gap:12px;font-size:13px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.05)}
  .tdd-mini-row:last-child{border-bottom:none;padding-bottom:0}
  .tdd-mini-label{color:var(--text-dim)}
  .tdd-mini-value{text-align:right}
  .tdd-section{margin-top:18px;padding:20px;border-radius:20px;border:1px solid var(--border);background:linear-gradient(180deg,rgba(17,29,46,.78),rgba(12,21,35,.8))}
  .tdd-section-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px}
  .tdd-section-title{margin:0;font-size:22px;font-weight:800;letter-spacing:-.03em}
  .tdd-section-sub{margin:6px 0 0;font-size:13px;color:var(--text-dim);line-height:1.6}
  .tdd-table-wrap{overflow:auto;border-radius:18px;border:1px solid var(--border)}
  .tdd-table{width:100%;border-collapse:collapse;background:rgba(7,13,23,.44)}
  .tdd-table th,.tdd-table td{padding:14px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;font-size:13px}
  .tdd-table th{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim)}
  .tdd-table tbody tr:last-child td{border-bottom:none}
  .tdd-strong{font-weight:700}
  .tdd-muted{margin-top:4px;font-size:12px;color:var(--text-dim);line-height:1.5}
  .tdd-chip-row{display:flex;gap:6px;flex-wrap:wrap}
  .tdd-chip{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:rgba(137,196,225,.08);border:1px solid rgba(137,196,225,.2);font-family:'Space Mono',monospace;font-size:10px;color:var(--ice)}
  .tdd-action-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .tdd-action{padding:16px;border-radius:18px;border:1px solid var(--border);background:rgba(255,255,255,.03)}
  .tdd-action h3{margin:0;font-size:15px}
  .tdd-action p{margin:8px 0 14px;font-size:12px;color:var(--text-dim);line-height:1.6}
  .tdd-empty{padding:18px;border-radius:16px;border:1px dashed var(--border);background:rgba(255,255,255,.03);color:var(--text-dim)}
  .tdd-modal-backdrop{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:24px;background:rgba(3,8,15,.76);backdrop-filter:blur(10px)}
  .tdd-modal{width:min(460px,100%);padding:22px;border-radius:20px;border:1px solid rgba(201,168,76,.22);background:linear-gradient(180deg,rgba(17,29,46,.98),rgba(11,19,31,.98));box-shadow:0 24px 80px rgba(0,0,0,.42)}
  .tdd-modal-title{margin:10px 0 0;font-size:24px;font-weight:800}
  .tdd-modal-copy{margin:10px 0 16px;font-size:13px;line-height:1.6;color:var(--text-dim)}
  .tdd-input,.tdd-select,.tdd-textarea{width:100%;border-radius:12px;border:1px solid var(--border);background:rgba(8,14,24,.92);color:var(--text);padding:11px 12px;font:inherit}
  .tdd-textarea{min-height:120px;resize:vertical}
  .tdd-input-group{display:grid;gap:10px}
  @media (max-width:1120px){.tdd-grid{grid-template-columns:1fr}.tdd-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.tdd-action-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (max-width:760px){.tdd-root{padding:18px 14px 88px}.tdd-hero,.tdd-body,.tdd-section,.tdd-card,.tdd-profile{padding:16px}.tdd-title{font-size:30px}.tdd-metrics,.tdd-usage-grid,.tdd-action-grid{grid-template-columns:1fr}.tdd-topline,.tdd-section-head{align-items:stretch}.tdd-actions{width:100%}.tdd-actions .tdd-link,.tdd-actions .tdd-button{width:100%}}
`;

function fmtMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value ?? 0);
}

function fmtCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value ?? 0);
}

function fmtSince(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function fmtDateTime(value?: string | null) {
  if (!value) return "No activity";
  return new Date(value).toLocaleString();
}

function fmtRelative(value?: string | null) {
  if (!value) return "No activity";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function planClass(plan: string) {
  return plan.toLowerCase();
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
    throw new Error(
      (body as { message?: string; error?: string }).message ??
      (body as { error?: string }).error ??
      `Request failed (${res.status})`,
    );
  }
  return body as T;
}

export default function AdminTenantDeepDivePage() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const beginImpersonation = useAuthStore((state) => state.beginImpersonation);
  const [data, setData] = useState<TenantDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionBusy, setActionBusy] = useState("");
  const [activeModal, setActiveModal] = useState<AdminActionModal>(null);
  const [planDraft, setPlanDraft] = useState("PRO");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [forgeMessage, setForgeMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTenant() {
      try {
        setLoading(true);
        const response = await apiRequest<TenantDetailResponse>(`/admin/tenants/${id}`);
        if (cancelled) return;
        setData(response);
        setPlanDraft(response.tenant.plan);
        setError("");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load tenant");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTenant();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const tenant = data?.tenant ?? null;
  const currency = tenant?.currency ?? "USD";
  const usageEntries = useMemo(() => {
    if (!tenant) return [];
    return [
      { key: "community", title: "Community", ...tenant.usage.community },
      { key: "academy", title: "Academy", ...tenant.usage.academy },
      { key: "intelligence", title: "Intelligence", ...tenant.usage.intelligence },
      { key: "work", title: "Work", ...tenant.usage.work },
    ];
  }, [tenant]);
  const usageMax = Math.max(...usageEntries.map((entry) => entry.value), 1);

  async function refreshTenant() {
    const response = await apiRequest<TenantDetailResponse>(`/admin/tenants/${id}`);
    setData(response);
    setPlanDraft(response.tenant.plan);
  }

  function closeModal() {
    setActiveModal(null);
  }

  async function savePlan() {
    if (!tenant) return;

    try {
      setActionBusy("plan");
      await apiRequest(`/admin/tenants/${tenant.id}/plan`, {
        method: "PATCH",
        body: JSON.stringify({ plan: planDraft }),
      });
      await refreshTenant();
      setSuccess(`${tenant.name} moved to ${planDraft}.`);
      setError("");
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update plan");
    } finally {
      setActionBusy("");
    }
  }

  async function inviteUser() {
    if (!tenant) return;

    try {
      setActionBusy("invite");
      const response = await apiRequest<InviteResponse>(`/admin/tenants/${tenant.id}/invite`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setSuccess(`${response.invite.email} invited as ${response.invite.role.toUpperCase()}.`);
      setError("");
      setInviteEmail("");
      setInviteRole("MEMBER");
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite user");
    } finally {
      setActionBusy("");
    }
  }

  async function sendForgeMessage() {
    if (!tenant) return;

    try {
      setActionBusy("forge");
      const response = await apiRequest<ForgeMessageResponse>(`/admin/tenants/${tenant.id}/forge-message`, {
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
      setActionBusy("");
    }
  }

  async function impersonateOwner() {
    if (!tenant) return;

    const reason = window.prompt(`Why are you impersonating ${tenant.name}?`) ?? "";

    try {
      setActionBusy("impersonate");
      const response = await apiRequest<ImpersonationResponse>(`/admin/tenants/${tenant.id}/impersonate`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });

      beginImpersonation(response.impersonationToken, response.user, {
        adminId: response.user.impersonatedByAdminId ?? "unknown_admin",
        targetTenantId: response.user.tenantId,
        targetUserId: response.user.id,
        returnToPath: `/admin/tenants/${tenant.id}`,
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to impersonate tenant owner");
    } finally {
      setActionBusy("");
    }
  }

  async function toggleStatus() {
    if (!tenant) return;

    const isSuspended = Boolean(tenant.deletedAt);
    const nextStatus = isSuspended ? "ACTIVE" : "SUSPENDED";
    const confirmed = window.confirm(
      nextStatus === "SUSPENDED"
        ? `Suspend ${tenant.name}? This keeps the workspace visible here and reversible later.`
        : `Restore ${tenant.name} to active status?`,
    );

    if (!confirmed) return;

    try {
      setActionBusy("status");
      await apiRequest(`/admin/tenants/${tenant.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await refreshTenant();
      setSuccess(nextStatus === "SUSPENDED" ? `${tenant.name} suspended.` : `${tenant.name} restored.`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update workspace status");
    } finally {
      setActionBusy("");
    }
  }

  function exportTenantData() {
    if (!tenant) return;

    downloadFile(
      `tenant-${tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-deep-dive.json`,
      JSON.stringify(data, null, 2),
      "application/json;charset=utf-8",
    );

    setSuccess(`${tenant.name} data exported.`);
    setError("");
  }

  function handleHardDelete() {
    setError("Hard delete (GDPR) is not implemented yet. The current admin flow supports suspend and soft archive only.");
  }

  return (
    <div className="tdd-root">
      <style>{css}</style>

      {activeModal ? (
        <div className="tdd-modal-backdrop" onClick={closeModal}>
          <div className="tdd-modal" onClick={(event) => event.stopPropagation()}>
            {activeModal === "plan" ? (
              <>
                <div className="tdd-kicker">Change Plan</div>
                <h2 className="tdd-modal-title">{tenant?.name}</h2>
                <p className="tdd-modal-copy">Shift this workspace to a new billing tier while keeping all usage context intact.</p>
                <div className="tdd-input-group">
                  <select className="tdd-select" value={planDraft} onChange={(event) => setPlanDraft(event.target.value)}>
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
                <div className="tdd-modal-actions" style={{ justifyContent: "flex-end", marginTop: 16 }}>
                  <button className="tdd-button ghost" onClick={closeModal}>Cancel</button>
                  <button className="tdd-button" onClick={() => void savePlan()} disabled={actionBusy === "plan"}>Save Plan</button>
                </div>
              </>
            ) : null}

            {activeModal === "invite" ? (
              <>
                <div className="tdd-kicker">Add User</div>
                <h2 className="tdd-modal-title">Invite Into Workspace</h2>
                <p className="tdd-modal-copy">Create a workspace invite without leaving the sovereign admin surface.</p>
                <div className="tdd-input-group">
                  <input className="tdd-input" placeholder="name@example.com" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} />
                  <select className="tdd-select" value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}>
                    <option value="ADMIN">ADMIN</option>
                    <option value="MEMBER">MEMBER</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>
                <div className="tdd-modal-actions" style={{ justifyContent: "flex-end", marginTop: 16 }}>
                  <button className="tdd-button ghost" onClick={closeModal}>Cancel</button>
                  <button className="tdd-button" onClick={() => void inviteUser()} disabled={actionBusy === "invite" || !inviteEmail.trim()}>Send Invite</button>
                </div>
              </>
            ) : null}

            {activeModal === "forge" ? (
              <>
                <div className="tdd-kicker">FORGE Message</div>
                <h2 className="tdd-modal-title">Send Operational Guidance</h2>
                <p className="tdd-modal-copy">Queue a support or success signal for this tenant and log it in admin actions.</p>
                <div className="tdd-input-group">
                  <textarea className="tdd-textarea" placeholder="Share a note, upgrade offer, or support instruction..." value={forgeMessage} onChange={(event) => setForgeMessage(event.target.value)} />
                </div>
                <div className="tdd-modal-actions" style={{ justifyContent: "flex-end", marginTop: 16 }}>
                  <button className="tdd-button ghost" onClick={closeModal}>Cancel</button>
                  <button className="tdd-button" onClick={() => void sendForgeMessage()} disabled={actionBusy === "forge" || !forgeMessage.trim()}>Send Message</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="tdd-shell">
        <section className="tdd-hero">
          <div className="tdd-topline">
            <div>
              <div className="tdd-kicker">Admin / Tenants / Deep Dive</div>
              <div className="tdd-title-row">
                <h1 className="tdd-title">{tenant?.name ?? "Tenant Deep Dive"}</h1>
                {tenant ? <span className={`tdd-pill ${planClass(tenant.plan)}`}>{tenant.plan} Plan</span> : null}
                {tenant ? <span className="tdd-pill">Since {fmtSince(tenant.createdAt)}</span> : null}
              </div>
              <p className="tdd-subtitle">
                {tenant
                  ? `${tenant.name} on ${tenant.plan} plan, operating inside your sovereign infrastructure.`
                  : "Loading tenant workspace intelligence and admin actions."}
              </p>
            </div>

            <div className="tdd-actions">
              <Link className="tdd-link ghost" to="/admin/tenants">Back to tenants</Link>
            </div>
          </div>
        </section>

        <div className="tdd-body">
          {error ? <div className="tdd-banner error">{error}</div> : null}
          {success ? <div className="tdd-banner success">{success}</div> : null}

          {loading && !tenant ? (
            <div className="tdd-empty">Loading the tenant command surface...</div>
          ) : tenant ? (
            <>
              <div className="tdd-grid">
                <section className="tdd-profile">
                  <div className="tdd-kicker">FORGE Tenant Profile</div>
                  <p className="tdd-profile-copy">{tenant.forgeProfile}</p>
                </section>

                <section className="tdd-card">
                  <div className="tdd-kicker">Workspace Context</div>
                  <div className="tdd-mini-list" style={{ marginTop: 14 }}>
                    <div className="tdd-mini-row"><span className="tdd-mini-label">Owner</span><span className="tdd-mini-value">{tenant.owner?.name ?? "No owner found"}</span></div>
                    <div className="tdd-mini-row"><span className="tdd-mini-label">Owner Email</span><span className="tdd-mini-value">{tenant.owner?.email ?? "Unavailable"}</span></div>
                    <div className="tdd-mini-row"><span className="tdd-mini-label">Timezone</span><span className="tdd-mini-value">{tenant.timezone ?? "UTC"}</span></div>
                    <div className="tdd-mini-row"><span className="tdd-mini-label">Stripe Customer</span><span className="tdd-mini-value">{tenant.stripeCustomerId ?? "Not connected"}</span></div>
                    <div className="tdd-mini-row"><span className="tdd-mini-label">Revenue Records</span><span className="tdd-mini-value">{tenant._count.revenueRecords}</span></div>
                  </div>
                </section>
              </div>

              <section className="tdd-metrics">
                <div className="tdd-metric">
                  <div className="tdd-metric-label">MRR</div>
                  <div className="tdd-metric-value">{fmtMoney(tenant.last30Revenue, currency)}</div>
                  <div className="tdd-metric-sub">{tenant.revenueDeltaPct >= 0 ? "Up" : "Down"} {Math.abs(tenant.revenueDeltaPct)}% month-over-month</div>
                </div>
                <div className="tdd-metric">
                  <div className="tdd-metric-label">Users</div>
                  <div className="tdd-metric-value">{tenant.users.length}</div>
                  <div className="tdd-metric-sub">{tenant.activeUserCount} active in the last 30 days</div>
                </div>
                <div className="tdd-metric">
                  <div className="tdd-metric-label">Active Loops</div>
                  <div className="tdd-metric-value">{tenant.activeLoopCount}</div>
                  <div className="tdd-metric-sub">Live agentic workflows inside the workspace</div>
                </div>
                <div className="tdd-metric">
                  <div className="tdd-metric-label">AI Credits Used</div>
                  <div className="tdd-metric-value">{fmtCompactNumber(tenant.aiCreditsUsed)}</div>
                  <div className="tdd-metric-sub">Tracked credit burn across intelligent features</div>
                </div>
              </section>

              <div className="tdd-grid">
                <section className="tdd-card">
                  <div className="tdd-section-head">
                    <div>
                      <h2 className="tdd-section-title">Layer Usage</h2>
                      <p className="tdd-section-sub">Which ecosystem layers this workspace leans on most right now.</p>
                    </div>
                  </div>
                  <div className="tdd-usage-grid">
                    {usageEntries.map((entry) => (
                      <div className="tdd-usage-item" key={entry.key}>
                        <div className="tdd-usage-head">
                          <div className="tdd-usage-name">{entry.title}</div>
                          <div className="tdd-usage-meta">{entry.value > 0 ? `${fmtCompactNumber(entry.value)} ${entry.label}` : entry.label}</div>
                        </div>
                        <div className="tdd-usage-track">
                          <div className="tdd-usage-fill" style={{ width: `${entry.value > 0 ? Math.max((entry.value / usageMax) * 100, 12) : 6}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="tdd-card">
                  <div className="tdd-section-head">
                    <div>
                      <h2 className="tdd-section-title">Revenue Snapshot</h2>
                      <p className="tdd-section-sub">Recent monetization context for this workspace.</p>
                    </div>
                  </div>
                  <div className="tdd-mini-list">
                    <div className="tdd-mini-row"><span className="tdd-mini-label">Last 30 days</span><span className="tdd-mini-value">{fmtMoney(tenant.last30Revenue, currency)}</span></div>
                    <div className="tdd-mini-row"><span className="tdd-mini-label">Previous 30 days</span><span className="tdd-mini-value">{fmtMoney(tenant.previous30Revenue, currency)}</span></div>
                    <div className="tdd-mini-row"><span className="tdd-mini-label">Lifetime revenue</span><span className="tdd-mini-value">{fmtMoney(tenant.totalRevenue, currency)}</span></div>
                    <div className="tdd-mini-row"><span className="tdd-mini-label">Fiscal month</span><span className="tdd-mini-value">{tenant.fiscalMonth ?? 1}</span></div>
                    <div className="tdd-mini-row"><span className="tdd-mini-label">Subscription</span><span className="tdd-mini-value">{tenant.stripeSubscriptionId ?? "Not connected"}</span></div>
                  </div>
                </section>
              </div>

              <section className="tdd-section">
                <div className="tdd-section-head">
                  <div>
                    <h2 className="tdd-section-title">Users In This Workspace ({tenant.users.length})</h2>
                    <p className="tdd-section-sub">Name, role, layer footprint, and loop stage for each member in the workspace.</p>
                  </div>
                </div>

                <div className="tdd-table-wrap">
                  <table className="tdd-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Last Active</th>
                        <th>Layers Used</th>
                        <th>Loop Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenant.users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="tdd-strong">{user.name}</div>
                            <div className="tdd-muted">{user.email}</div>
                          </td>
                          <td>
                            <div className="tdd-strong">{user.role.toLowerCase()}</div>
                            <div className="tdd-muted">Joined {fmtSince(user.createdAt)}</div>
                          </td>
                          <td>
                            <div className="tdd-strong">{fmtRelative(user.lastActivityAt)}</div>
                            <div className="tdd-muted">{fmtDateTime(user.lastActivityAt)}</div>
                          </td>
                          <td>
                            {user.layersUsed.length ? (
                              <div className="tdd-chip-row">
                                {user.layersUsed.map((layer) => (
                                  <span className="tdd-chip" key={`${user.id}-${layer}`}>{layer}</span>
                                ))}
                              </div>
                            ) : (
                              <div className="tdd-muted">No tracked layer activity yet</div>
                            )}
                          </td>
                          <td>
                            <div className="tdd-strong">{user.loopStage}</div>
                            <div className="tdd-muted">{user.twoFactorEnabled ? "2FA enabled" : "2FA not enabled"}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="tdd-section">
                <div className="tdd-section-head">
                  <div>
                    <h2 className="tdd-section-title">Admin Actions</h2>
                    <p className="tdd-section-sub">High-trust controls for billing, access, support, and tenant lifecycle.</p>
                  </div>
                </div>

                <div className="tdd-action-grid">
                  <div className="tdd-action">
                    <h3>Change Plan</h3>
                    <p>Move the workspace between Free, Pro, and Enterprise tiers.</p>
                    <button className="tdd-button" onClick={() => setActiveModal("plan")}>Change Plan</button>
                  </div>
                  <div className="tdd-action">
                    <h3>Add User</h3>
                    <p>Generate an invite into the tenant with a scoped workspace role.</p>
                    <button className="tdd-button" onClick={() => setActiveModal("invite")}>Add User</button>
                  </div>
                  <div className="tdd-action">
                    <h3>Impersonate Owner</h3>
                    <p>Switch into the owner session for support and production debugging with a visible warning banner.</p>
                    <button className="tdd-button" onClick={() => void impersonateOwner()} disabled={actionBusy === "impersonate"}>{actionBusy === "impersonate" ? "Starting..." : "Impersonate Owner"}</button>
                  </div>
                  <div className="tdd-action">
                    <h3>Send FORGE Message</h3>
                    <p>Queue a proactive support or upgrade message and log it in admin actions.</p>
                    <button className="tdd-button" onClick={() => setActiveModal("forge")}>Send FORGE Message</button>
                  </div>
                  <div className="tdd-action">
                    <h3>{tenant.deletedAt ? "Restore Workspace" : "Suspend Workspace"}</h3>
                    <p>Temporarily remove the workspace from active circulation without losing its audit trail.</p>
                    <button className="tdd-button ghost" onClick={() => void toggleStatus()} disabled={actionBusy === "status"}>{actionBusy === "status" ? "Saving..." : tenant.deletedAt ? "Restore Workspace" : "Suspend Workspace"}</button>
                  </div>
                  <div className="tdd-action">
                    <h3>Hard Delete (GDPR)</h3>
                    <p>This remains intentionally unavailable until a true irreversible deletion workflow is implemented.</p>
                    <button className="tdd-button danger" onClick={handleHardDelete}>Hard Delete</button>
                  </div>
                  <div className="tdd-action">
                    <h3>Export Tenant Data</h3>
                    <p>Download the full deep-dive payload as JSON for compliance or offline review.</p>
                    <button className="tdd-button ghost" onClick={exportTenantData}>Export Tenant Data</button>
                  </div>
                  <div className="tdd-action">
                    <h3>Owner Access</h3>
                    <p>Jump straight to the owner profile entry when you need account-level context.</p>
                    <button className="tdd-button ghost" onClick={() => tenant.owner && navigate(`/admin/users/${tenant.owner.id}`)} disabled={!tenant.owner}>View Owner</button>
                  </div>
                  <div className="tdd-action">
                    <h3>Revenue Feed</h3>
                    <p>Review the freshest monetization records being attached to this workspace.</p>
                    <button className="tdd-button ghost" onClick={() => navigate("/admin/revenue")}>Open Revenue Console</button>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="tdd-empty">This tenant could not be loaded.</div>
          )}
        </div>
      </div>
    </div>
  );
}
