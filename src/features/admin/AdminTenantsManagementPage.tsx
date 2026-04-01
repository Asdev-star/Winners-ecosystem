import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders, useAuthStore } from "../auth/authStore";
import TenantTable from "../dashboard/components/TenantTable";

type AdminTenantStatus = "active" | "suspended";

type TenantListItem = {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  status: AdminTenantStatus;
  statusLabel: string;
  totalRevenue: number;
  monthlyRevenue: number;
  lastActivityAt?: string | null;
  owner?: { name: string; email: string } | null;
  userCount?: number;
  _count?: { users?: number };
};

type TenantListResponse = {
  tenants: TenantListItem[];
  total: number;
  page: number;
  pages: number;
  summary: {
    planCounts: {
      FREE: number;
      PRO: number;
      ENTERPRISE: number;
    };
    statusCounts: {
      active: number;
      suspended: number;
    };
    staleFreeCount: number;
    topTenant: {
      id: string;
      name: string;
      plan: string;
      monthlyRevenue: number;
    } | null;
    upgradeSignalsThisWeek: number;
  };
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

const css = `
  .tmg-root{max-width:1280px;margin:0 auto;padding:26px 22px 88px;color:var(--text);font-family:'Syne',sans-serif}
  .tmg-shell{border:1px solid rgba(201,168,76,.18);border-radius:26px;overflow:hidden;background:linear-gradient(180deg,rgba(9,16,28,.98),rgba(12,22,36,.96));box-shadow:0 24px 80px rgba(0,0,0,.28)}
  .tmg-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;padding:24px;border-bottom:1px solid rgba(201,168,76,.16);background:radial-gradient(circle at top right,rgba(201,168,76,.14),transparent 32%),linear-gradient(135deg,rgba(17,29,46,.94),rgba(13,24,38,.92))}
  .tmg-kicker{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
  .tmg-title{margin:10px 0 0;font-size:34px;font-weight:800;letter-spacing:-.05em}
  .tmg-sub{margin:10px 0 0;color:var(--text-dim);font-size:14px;line-height:1.6;max-width:760px}
  .tmg-actions,.tmg-row-actions,.tmg-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  .tmg-body{padding:22px}
  .tmg-banner{margin-bottom:16px;padding:12px 14px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,.03);font-size:13px}
  .tmg-banner.error{border-color:rgba(224,90,78,.26);color:#ffcbc5;background:rgba(224,90,78,.08)}
  .tmg-banner.success{border-color:rgba(45,212,160,.24);color:#b9f5dd;background:rgba(45,212,160,.08)}
  .tmg-btn,.tmg-link{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid rgba(201,168,76,.22);background:rgba(201,168,76,.08);color:var(--gold);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;cursor:pointer}
  .tmg-btn.ghost,.tmg-link.ghost{background:rgba(255,255,255,.03);border-color:var(--border);color:var(--text-dim)}
  .tmg-btn.danger{border-color:rgba(224,90,78,.22);background:rgba(224,90,78,.08);color:var(--red)}
  .tmg-btn:disabled{opacity:.6;cursor:not-allowed}
  .tmg-signal{margin-bottom:18px;padding:18px 20px;border-radius:18px;border:1px solid rgba(201,168,76,.22);background:radial-gradient(circle at top right,rgba(137,196,225,.12),transparent 34%),linear-gradient(135deg,rgba(17,29,46,.94),rgba(13,24,38,.92))}
  .tmg-signal-copy{margin:8px 0 0;color:#f4f0df;font-size:15px;line-height:1.7}
  .tmg-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}
  .tmg-stat{padding:16px;border-radius:16px;border:1px solid var(--border);background:linear-gradient(180deg,rgba(17,29,46,.88),rgba(13,24,38,.86))}
  .tmg-stat-label{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)}
  .tmg-stat-value{margin-top:10px;font-size:32px;font-weight:800;letter-spacing:-.05em;color:var(--gold)}
  .tmg-stat-sub{margin-top:8px;color:var(--text-dim);font-size:12px;line-height:1.5}
  .tmg-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:18px}
  .tmg-select,.tmg-search{border-radius:10px;border:1px solid var(--border);background:rgba(13,24,38,.86);color:var(--text);padding:10px 12px}
  .tmg-select{min-width:160px}
  .tmg-search{min-width:280px}
  .tmg-table-wrap{overflow:hidden;border-radius:18px;border:1px solid var(--border);background:linear-gradient(180deg,rgba(17,29,46,.74),rgba(13,24,38,.78))}
  .tmg-table{width:100%;border-collapse:collapse}
  .tmg-table th,.tmg-table td{padding:14px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;font-size:13px}
  .tmg-table th{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim)}
  .tmg-table tbody tr:last-child td{border-bottom:none}
  .tmg-name{font-weight:700}
  .tmg-subcopy{margin-top:4px;color:var(--text-dim);font-size:12px;line-height:1.5}
  .tmg-badge{display:inline-flex;align-items:center;justify-content:center;min-width:96px;padding:5px 10px;border-radius:999px;border:1px solid var(--border);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
  .tmg-badge.free{color:var(--ice);border-color:rgba(137,196,225,.26);background:rgba(137,196,225,.08)}
  .tmg-badge.pro{color:var(--gold);border-color:rgba(201,168,76,.24);background:rgba(201,168,76,.08)}
  .tmg-badge.enterprise{color:#d7c6ff;border-color:rgba(155,111,255,.28);background:rgba(155,111,255,.12)}
  .tmg-status{display:inline-flex;align-items:center;gap:6px;margin-top:6px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
  .tmg-status::before{content:'';width:8px;height:8px;border-radius:999px;background:currentColor;box-shadow:0 0 10px currentColor}
  .tmg-status.active{color:var(--green)}
  .tmg-status.suspended{color:var(--red)}
  .tmg-pagination{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px;border-top:1px solid var(--border)}
  .tmg-empty{padding:20px;border:1px dashed var(--border);border-radius:14px;color:var(--text-dim);background:rgba(255,255,255,.03)}
  .tmg-modal-back{position:fixed;inset:0;z-index:90;display:grid;place-items:center;padding:24px;background:rgba(3,8,15,.72);backdrop-filter:blur(8px)}
  .tmg-modal{width:min(420px,100%);padding:22px;border-radius:18px;border:1px solid rgba(201,168,76,.22);background:linear-gradient(180deg,rgba(17,29,46,.98),rgba(11,19,31,.98));box-shadow:0 24px 80px rgba(0,0,0,.42)}
  .tmg-modal-title{margin:10px 0 0;font-size:24px;font-weight:800}
  .tmg-modal-copy{margin:10px 0 16px;color:var(--text-dim);font-size:13px;line-height:1.6}
  @media (max-width:1080px){.tmg-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.tmg-table-wrap{overflow:auto}}
  @media (max-width:760px){.tmg-stats{grid-template-columns:1fr}.tmg-body,.tmg-head{padding:16px}.tmg-title{font-size:28px}.tmg-toolbar,.tmg-pagination{align-items:stretch;flex-direction:column}.tmg-search,.tmg-select{width:100%;min-width:0}}
`;

function fmtMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value ?? 0);
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function fmtRelativeDay(value?: string | null) {
  if (!value) return "No activity";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
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

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
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

export default function AdminTenantsManagementPage() {
  const navigate = useNavigate();
  const beginImpersonation = useAuthStore((state) => state.beginImpersonation);
  const [data, setData] = useState<TenantListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [actionTenantId, setActionTenantId] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [planModal, setPlanModal] = useState<TenantListItem | null>(null);
  const [nextPlan, setNextPlan] = useState("PRO");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          q: search,
          plan: planFilter,
          status: statusFilter,
        });
        const response = await apiRequest<TenantListResponse>(`/admin/tenants?${params.toString()}`);
        if (!cancelled) {
          setData(response);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load tenants");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [page, planFilter, refreshToken, search, statusFilter]);

  const summary = data?.summary;

  const signalCopy = useMemo(() => {
    const topTenantLine = summary?.topTenant
      ? `${summary.topTenant.name} (${summary.topTenant.plan}) is the highest-revenue tenant this month at ${fmtMoney(summary.topTenant.monthlyRevenue)}.`
      : "No paid tenant has recorded monthly revenue yet.";

    return `${summary?.staleFreeCount ?? 0} free-plan workspaces have been quiet for 14 days. ${topTenantLine} ${summary?.upgradeSignalsThisWeek ?? 0} workspaces hit an upgrade path this week.`;
  }, [summary]);

  function refreshList() {
    setRefreshToken((current) => current + 1);
  }

  function openPlanModal(tenant: TenantListItem) {
    setPlanModal(tenant);
    setNextPlan(tenant.plan);
  }

  async function savePlan() {
    if (!planModal) return;

    try {
      setActionTenantId(planModal.id);
      await apiRequest(`/admin/tenants/${planModal.id}/plan`, {
        method: "PATCH",
        body: JSON.stringify({ plan: nextPlan }),
      });
      setSuccess(`${planModal.name} moved to ${nextPlan}.`);
      setError("");
      setPlanModal(null);
      refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update plan");
    } finally {
      setActionTenantId("");
    }
  }

  async function toggleTenantStatus(tenant: TenantListItem) {
    const nextStatus = tenant.status === "suspended" ? "ACTIVE" : "SUSPENDED";
    const confirmCopy = nextStatus === "SUSPENDED"
      ? `Suspend ${tenant.name}? They will remain visible here and can be restored later.`
      : `Restore ${tenant.name} to active status?`;

    if (!window.confirm(confirmCopy)) return;

    try {
      setActionTenantId(tenant.id);
      await apiRequest(`/admin/tenants/${tenant.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setSuccess(nextStatus === "SUSPENDED" ? `${tenant.name} suspended.` : `${tenant.name} restored.`);
      setError("");
      refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tenant status");
    } finally {
      setActionTenantId("");
    }
  }

  async function archiveTenant(tenant: TenantListItem) {
    if (!window.confirm(`Archive ${tenant.name}? This uses the current soft-delete flow.`)) return;

    try {
      setActionTenantId(tenant.id);
      await apiRequest(`/admin/tenants/${tenant.id}`, { method: "DELETE" });
      setSuccess(`${tenant.name} archived.`);
      setError("");
      if ((data?.tenants.length ?? 0) === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        refreshList();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive tenant");
    } finally {
      setActionTenantId("");
    }
  }

  async function exportTenants() {
    try {
      setIsExporting(true);
      let exportPage = 1;
      let exportPages = 1;
      const rows: TenantListItem[] = [];

      while (exportPage <= exportPages) {
        const params = new URLSearchParams({
          page: String(exportPage),
          limit: "100",
          q: search,
          plan: planFilter,
          status: statusFilter,
        });
        const response = await apiRequest<TenantListResponse>(`/admin/tenants?${params.toString()}`);
        rows.push(...response.tenants);
        exportPages = response.pages;
        exportPage += 1;
      }

      const csv = [
        ["Workspace Name", "Owner", "Owner Email", "Plan", "Status", "MRR", "Lifetime Revenue", "Users", "Last Active", "Created"].join(","),
        ...rows.map((tenant) => ([
          JSON.stringify(tenant.name),
          JSON.stringify(tenant.owner?.name ?? ""),
          JSON.stringify(tenant.owner?.email ?? ""),
          tenant.plan,
          tenant.statusLabel,
          tenant.monthlyRevenue,
          tenant.totalRevenue,
          tenant.userCount ?? tenant._count?.users ?? 0,
          JSON.stringify(fmtRelativeDay(tenant.lastActivityAt)),
          JSON.stringify(fmtDate(tenant.createdAt)),
        ].join(","))),
      ].join("\n");

      downloadFile(`tenant-management-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
      setSuccess(`Exported ${rows.length} tenants.`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export tenants");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImpersonate(tenant: TenantListItem) {
    try {
      const reason = window.prompt(`Why are you impersonating ${tenant.name}? This directive is always written to the immutable audit log.`) ?? "";
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
      setError(err instanceof Error ? err.message : `Failed to impersonate ${tenant.name}`);
    }
  }

  return (
    <div className="tmg-root">
      <style>{css}</style>
      <div className="tmg-shell">
        <div className="tmg-head">
          <div>
            <div className="tmg-kicker">Admin / Tenants</div>
            <h1 className="tmg-title">Tenant Management</h1>
            <p className="tmg-sub">Every workspace that runs on your infrastructure. You see all of it.</p>
          </div>
          <div className="tmg-actions">
            <Link className="tmg-link ghost" to="/admin/overview">Back to overview</Link>
          </div>
        </div>

        <div className="tmg-body">
          {error ? <div className="tmg-banner error">{error}</div> : null}
          {success ? <div className="tmg-banner success">{success}</div> : null}

          {planModal ? (
            <div className="tmg-modal-back" onClick={() => setPlanModal(null)}>
              <div className="tmg-modal" onClick={(event) => event.stopPropagation()}>
                <div className="tmg-kicker">Change Plan</div>
                <h2 className="tmg-modal-title">{planModal.name}</h2>
                <p className="tmg-modal-copy">Switch the workspace plan while keeping the tenant inside the same sovereign control surface.</p>
                <select className="tmg-select" value={nextPlan} onChange={(event) => setNextPlan(event.target.value)}>
                  <option value="FREE">FREE</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
                <div className="tmg-actions" style={{ justifyContent: "flex-end", marginTop: 16 }}>
                  <button className="tmg-btn ghost" onClick={() => setPlanModal(null)}>Cancel</button>
                  <button className="tmg-btn" onClick={() => void savePlan()} disabled={actionTenantId === planModal.id}>Save Plan</button>
                </div>
              </div>
            </div>
          ) : null}

          <section className="tmg-signal">
            <div className="tmg-kicker">FORGE Signal Bar · ARIA billing signals</div>
            <p className="tmg-signal-copy">{signalCopy}</p>
          </section>

          <section className="tmg-stats">
            <div className="tmg-stat">
              <div className="tmg-stat-label">Free</div>
              <div className="tmg-stat-value">{summary?.planCounts.FREE ?? 0}</div>
              <div className="tmg-stat-sub">Entry workspaces on the ecosystem</div>
            </div>
            <div className="tmg-stat">
              <div className="tmg-stat-label">Pro</div>
              <div className="tmg-stat-value">{summary?.planCounts.PRO ?? 0}</div>
              <div className="tmg-stat-sub">Paid teams running the core stack</div>
            </div>
            <div className="tmg-stat">
              <div className="tmg-stat-label">Enterprise</div>
              <div className="tmg-stat-value">{summary?.planCounts.ENTERPRISE ?? 0}</div>
              <div className="tmg-stat-sub">Highest-touch revenue accounts</div>
            </div>
            <div className="tmg-stat">
              <div className="tmg-stat-label">Suspended</div>
              <div className="tmg-stat-value">{summary?.statusCounts.suspended ?? 0}</div>
              <div className="tmg-stat-sub">Workspaces removed from active circulation</div>
            </div>
          </section>

          <div className="tmg-toolbar">
            <div className="tmg-filters">
              <select className="tmg-select" value={planFilter} onChange={(event) => { setPlanFilter(event.target.value); setPage(1); }}>
                <option value="ALL">All Plans</option>
                <option value="FREE">Free</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
              <select className="tmg-select" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              <input className="tmg-search" placeholder="Search tenants..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
            </div>
            <button className="tmg-btn" onClick={() => void exportTenants()} disabled={isExporting}>
              {isExporting ? "Exporting..." : "Export"}
            </button>
          </div>

          {loading && !data ? (
            <div className="tmg-empty">Loading tenant command surface...</div>
          ) : (
            <div className="tmg-table-wrap">
              <TenantTable
                tenants={data?.tenants ?? []}
                actionTenantId={actionTenantId}
                fmtDate={fmtDate}
                fmtMoney={fmtMoney}
                fmtRelativeDay={fmtRelativeDay}
                onView={(tenantId) => navigate(`/admin/tenants/${tenantId}`)}
                onChangePlan={openPlanModal}
                onImpersonate={(tenant) => void handleImpersonate(tenant)}
                onToggleStatus={(tenant) => void toggleTenantStatus(tenant)}
                onDelete={(tenant) => void archiveTenant(tenant)}
              />
              <div className="tmg-pagination">
                <span>{data?.total ?? 0} tenants · Page {data?.page ?? 1} of {data?.pages ?? 1}</span>
                <div className="tmg-actions">
                  <button className="tmg-btn ghost" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Prev</button>
                  <button className="tmg-btn ghost" disabled={page >= (data?.pages ?? 1)} onClick={() => setPage((current) => current + 1)}>Next</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
