import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";

type QuickFilter = "all" | "active7d" | "new30d" | "lowtrust" | "flagged" | "admins";
type TrustTier = "all" | "bronze" | "silver" | "gold" | "platinum";

type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  trustScore: number;
  trustScoreTier: string;
  plan: string;
  layersActive: number;
  lastSeen: string;
  isSuspended: boolean;
  active7d: boolean;
  isFlagged: boolean;
  completedFirstLoop: boolean;
  twoFactorEnabled: boolean;
  tenant: {
    id: string;
    name: string;
    plan: string;
  };
};

type UserListResponse = {
  users: AdminUserListItem[];
  total: number;
  page: number;
  pages: number;
  summary: {
    active7dCount: number;
    flaggedPostsCount: number;
    firstLoopCompletionCount: number;
    lowTrustPercentage: number;
    quickCounts: Record<QuickFilter, number>;
  };
};

const css = `
  .umg-root{max-width:1440px;margin:0 auto;padding:26px 22px 88px;color:var(--text);font-family:'Syne',sans-serif}
  .umg-shell{border:1px solid rgba(201,168,76,.18);border-radius:26px;overflow:hidden;background:linear-gradient(180deg,rgba(9,16,28,.98),rgba(12,22,36,.96));box-shadow:0 24px 80px rgba(0,0,0,.28)}
  .umg-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;padding:24px;border-bottom:1px solid rgba(201,168,76,.16);background:radial-gradient(circle at top right,rgba(201,168,76,.14),transparent 32%),linear-gradient(135deg,rgba(17,29,46,.94),rgba(13,24,38,.92))}
  .umg-kicker{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
  .umg-title{margin:10px 0 0;font-size:34px;font-weight:800;letter-spacing:-.05em}
  .umg-sub{margin:10px 0 0;color:var(--text-dim);font-size:14px;line-height:1.6;max-width:780px}
  .umg-actions,.umg-row-actions,.umg-toolbar,.umg-filters,.umg-bulk{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  .umg-body{padding:22px}
  .umg-banner{margin-bottom:16px;padding:12px 14px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,.03);font-size:13px}
  .umg-banner.error{border-color:rgba(224,90,78,.26);color:#ffcbc5;background:rgba(224,90,78,.08)}
  .umg-btn,.umg-link,.umg-select{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid rgba(201,168,76,.22);background:rgba(201,168,76,.08);color:var(--gold);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;cursor:pointer}
  .umg-btn.ghost,.umg-link.ghost{background:rgba(255,255,255,.03);border-color:var(--border);color:var(--text-dim)}
  .umg-btn.danger{border-color:rgba(224,90,78,.24);background:rgba(224,90,78,.1);color:#ff978f}
  .umg-btn:disabled{opacity:.55;cursor:not-allowed}
  .umg-select{appearance:none;background:rgba(13,24,38,.92);text-transform:none;color:var(--text)}
  .umg-signal{margin-bottom:18px;padding:18px 20px;border-radius:18px;border:1px solid rgba(201,168,76,.22);background:radial-gradient(circle at top right,rgba(137,196,225,.12),transparent 34%),linear-gradient(135deg,rgba(17,29,46,.94),rgba(13,24,38,.92))}
  .umg-signal-copy{margin:8px 0 0;color:#f4f0df;font-size:15px;line-height:1.7}
  .umg-filter-pill{display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:999px;border:1px solid var(--border);background:rgba(255,255,255,.03);color:var(--text-dim);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
  .umg-filter-pill.active{border-color:rgba(201,168,76,.26);background:rgba(201,168,76,.1);color:var(--gold)}
  .umg-search{min-width:260px;border-radius:10px;border:1px solid var(--border);background:rgba(13,24,38,.86);color:var(--text);padding:10px 12px}
  .umg-table-wrap{overflow:auto;border-radius:18px;border:1px solid var(--border);background:linear-gradient(180deg,rgba(17,29,46,.74),rgba(13,24,38,.78))}
  .umg-table{width:100%;border-collapse:collapse;min-width:1240px}
  .umg-table th,.umg-table td{padding:14px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;font-size:13px}
  .umg-table th{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim)}
  .umg-table tbody tr:last-child td{border-bottom:none}
  .umg-row-risk{background:rgba(224,90,78,.06)}
  .umg-row-advocate{background:rgba(201,168,76,.05)}
  .umg-name{font-weight:700}
  .umg-subcopy{margin-top:4px;color:var(--text-dim);font-size:12px;line-height:1.5}
  .umg-plan{display:inline-flex;align-items:center;justify-content:center;padding:5px 10px;border-radius:999px;border:1px solid var(--border);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
  .umg-plan.free{color:var(--ice);border-color:rgba(137,196,225,.26);background:rgba(137,196,225,.08)}
  .umg-plan.pro{color:var(--gold);border-color:rgba(201,168,76,.24);background:rgba(201,168,76,.08)}
  .umg-plan.enterprise{color:#d7c6ff;border-color:rgba(155,111,255,.28);background:rgba(155,111,255,.12)}
  .umg-trust{display:inline-flex;align-items:center;gap:8px;font-weight:700}
  .umg-trust.bronze{color:#ff9b8d}
  .umg-trust.silver{color:#cfd7e5}
  .umg-trust.gold{color:#f5c86f}
  .umg-trust.platinum{color:#9ed7ff}
  .umg-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
  .umg-badge{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.05);font-family:'Space Mono',monospace;font-size:10px;color:var(--text-dim)}
  .umg-check{width:16px;height:16px}
  .umg-pagination{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px;border-top:1px solid var(--border)}
  .umg-empty{padding:20px;border:1px dashed var(--border);border-radius:14px;color:var(--text-dim);background:rgba(255,255,255,.03)}
  @media (max-width:760px){.umg-body,.umg-head{padding:16px}.umg-title{font-size:28px}.umg-toolbar,.umg-pagination{align-items:stretch;flex-direction:column}.umg-search{width:100%;min-width:0}}
`;

const FILTERS: Array<{ key: QuickFilter; label: string }> = [
  { key: "all", label: "All Users" },
  { key: "active7d", label: "Active (7d)" },
  { key: "new30d", label: "New (30d)" },
  { key: "lowtrust", label: "Low Trust" },
  { key: "flagged", label: "Flagged" },
  { key: "admins", label: "Admins" },
];

function trustTone(score: number) {
  if (score <= 30) return { className: "bronze", label: "Bronze" };
  if (score <= 60) return { className: "silver", label: "Silver" };
  if (score <= 85) return { className: "gold", label: "Gold" };
  return { className: "platinum", label: "Platinum" };
}

function fmtDateTime(value?: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
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

export default function AdminUserManagementPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<UserListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<QuickFilter>("all");
  const [trustFilter, setTrustFilter] = useState<TrustTier>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioning, setActioning] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          q: search,
          filter,
        });
        const response = await apiRequest<UserListResponse>(`/admin/users?${params.toString()}`);
        if (!cancelled) {
          setData(response);
          setSelectedIds([]);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, [filter, page, search]);

  const displayedUsers = useMemo(() => {
    const users = data?.users ?? [];
    if (trustFilter === "all") return users;
    return users.filter((user) => trustTone(user.trustScore).className === trustFilter);
  }, [data?.users, trustFilter]);

  const signalCopy = useMemo(() => {
    const summary = data?.summary;
    return `${summary?.active7dCount ?? 0} users were active in the last 7 days. ${summary?.flaggedPostsCount ?? 0} accounts currently carry moderation risk, ${summary?.firstLoopCompletionCount ?? 0} users have completed a first full loop, and ${summary?.lowTrustPercentage ?? 0}% of active users are still below the trust recovery threshold.`;
  }, [data]);

  const selectedUsers = displayedUsers.filter((user) => selectedIds.includes(user.id));
  const allVisibleSelected = displayedUsers.length > 0 && displayedUsers.every((user) => selectedIds.includes(user.id));

  function toggleSelection(userId: string) {
    setSelectedIds((current) => (current.includes(userId) ? current.filter((entry) => entry !== userId) : [...current, userId]));
  }

  function toggleAllVisible() {
    setSelectedIds(allVisibleSelected ? [] : displayedUsers.map((user) => user.id));
  }

  async function runUserAction(userId: string, action: () => Promise<void>) {
    try {
      setActioning(userId);
      await action();
      const params = new URLSearchParams({
        page: String(page),
        q: search,
        filter,
      });
      const response = await apiRequest<UserListResponse>(`/admin/users?${params.toString()}`);
      setData(response);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin action failed");
    } finally {
      setActioning("");
    }
  }

  async function changeRole(user: AdminUserListItem) {
    const nextRole = window.prompt(`Change role for ${user.email} to MEMBER, ADMIN, or OWNER`, user.role)?.toUpperCase();
    if (!nextRole || !["MEMBER", "ADMIN", "OWNER"].includes(nextRole)) return;
    await runUserAction(user.id, async () => {
      await apiRequest(`/admin/users/${user.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });
    });
  }

  async function changePlan(user: AdminUserListItem) {
    const nextPlan = window.prompt(`Change workspace plan for ${user.tenant.name} to FREE, PRO, or ENTERPRISE`, user.plan)?.toUpperCase();
    if (!nextPlan || !["FREE", "PRO", "ENTERPRISE"].includes(nextPlan)) return;
    await runUserAction(user.id, async () => {
      await apiRequest(`/admin/users/${user.id}/plan`, {
        method: "PATCH",
        body: JSON.stringify({ plan: nextPlan }),
      });
    });
  }

  async function reset2FA(user: AdminUserListItem) {
    if (!window.confirm(`Reset 2FA for ${user.email}?`)) return;
    await runUserAction(user.id, async () => {
      await apiRequest(`/admin/users/${user.id}/reset-2fa`, { method: "POST" });
    });
  }

  async function updateStatus(user: AdminUserListItem) {
    const nextStatus = user.isSuspended ? "ACTIVE" : "SUSPENDED";
    if (!window.confirm(`${nextStatus === "SUSPENDED" ? "Suspend" : "Restore"} ${user.email}?`)) return;
    await runUserAction(user.id, async () => {
      await apiRequest(`/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
    });
  }

  async function deleteUser(user: AdminUserListItem) {
    if (!window.confirm(`Soft delete ${user.email}?`)) return;
    await runUserAction(user.id, async () => {
      await apiRequest(`/admin/users/${user.id}`, { method: "DELETE" });
    });
  }

  async function bulkChangePlan() {
    if (!selectedUsers.length) return;
    const nextPlan = window.prompt("Bulk change selected workspaces to FREE, PRO, or ENTERPRISE", "PRO")?.toUpperCase();
    if (!nextPlan || !["FREE", "PRO", "ENTERPRISE"].includes(nextPlan)) return;
    try {
      setActioning("bulk");
      for (const user of selectedUsers) {
        await apiRequest(`/admin/users/${user.id}/plan`, {
          method: "PATCH",
          body: JSON.stringify({ plan: nextPlan }),
        });
      }
      const params = new URLSearchParams({ page: String(page), q: search, filter });
      const response = await apiRequest<UserListResponse>(`/admin/users?${params.toString()}`);
      setData(response);
      setSelectedIds([]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk plan change failed");
    } finally {
      setActioning("");
    }
  }

  function exportSelection() {
    const rows = [
      ["Name", "Email", "Plan", "Trust Score", "Trust Tier", "Layers Active", "Last Seen", "Role", "Tenant"],
      ...(selectedUsers.length ? selectedUsers : displayedUsers).map((user) => [
        user.name,
        user.email,
        user.plan,
        String(user.trustScore),
        trustTone(user.trustScore).label,
        String(user.layersActive),
        fmtDateTime(user.lastSeen),
        user.role,
        user.tenant.name,
      ]),
    ];
    downloadCsv(`admin-users-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div className="umg-root">
      <style>{css}</style>
      <div className="umg-shell">
        <div className="umg-head">
          <div>
            <div className="umg-kicker">Admin / Users</div>
            <h1 className="umg-title">User Management</h1>
            <p className="umg-sub">Canonical sovereign control for user trust, access, role changes, plan control, and intervention across the ecosystem.</p>
          </div>
          <div className="umg-actions">
            <Link className="umg-link ghost" to="/admin/overview">Back to overview</Link>
            <Link className="umg-link ghost" to="/admin/broadcast">Send Announcement</Link>
          </div>
        </div>

        <div className="umg-body">
          {error ? <div className="umg-banner error">{error}</div> : null}

          <section className="umg-signal">
            <div className="umg-kicker">FORGE + NOVA Signal</div>
            <p className="umg-signal-copy">{signalCopy}</p>
          </section>

          <div className="umg-toolbar" style={{ justifyContent: "space-between", marginBottom: 18 }}>
            <div className="umg-filters">
              {FILTERS.map((entry) => (
                <button
                  key={entry.key}
                  className={`umg-filter-pill${filter === entry.key ? " active" : ""}`}
                  onClick={() => {
                    setFilter(entry.key);
                    setPage(1);
                  }}
                >
                  {entry.label} ({data?.summary.quickCounts[entry.key] ?? 0})
                </button>
              ))}
            </div>

            <div className="umg-actions">
              <select className="umg-select" value={trustFilter} onChange={(event) => setTrustFilter(event.target.value as TrustTier)}>
                <option value="all">All Trust Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
              <input
                className="umg-search"
                placeholder="Search users..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="umg-bulk" style={{ marginBottom: 14 }}>
            <button className="umg-btn ghost" disabled={!selectedIds.length} onClick={() => navigate("/admin/broadcast")}>
              Send Announcement
            </button>
            <button className="umg-btn ghost" onClick={exportSelection}>
              Export CSV
            </button>
            <button className="umg-btn" disabled={!selectedIds.length || actioning === "bulk"} onClick={() => void bulkChangePlan()}>
              {actioning === "bulk" ? "Changing Plan..." : "Change Plan"}
            </button>
            <span className="umg-subcopy">{selectedIds.length} selected</span>
          </div>

          {loading && !data ? (
            <div className="umg-empty">Loading user control surface...</div>
          ) : (
            <div className="umg-table-wrap">
              <table className="umg-table">
                <thead>
                  <tr>
                    <th><input className="umg-check" type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} /></th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Trust Score</th>
                    <th>Layers Active</th>
                    <th>Last Seen</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="umg-empty">No users matched the current filters.</div>
                      </td>
                    </tr>
                  ) : (
                    displayedUsers.map((user) => {
                      const tone = trustTone(user.trustScore);
                      const rowClass = user.trustScore < 30 ? "umg-row-risk" : user.trustScore > 85 ? "umg-row-advocate" : "";
                      return (
                        <tr key={user.id} className={rowClass}>
                          <td>
                            <input className="umg-check" type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelection(user.id)} />
                          </td>
                          <td>
                            <div className="umg-name">{user.name}</div>
                            <div className="umg-subcopy">{user.tenant.name}</div>
                          </td>
                          <td>
                            <div>{user.email}</div>
                            <div className="umg-subcopy">{user.role}</div>
                          </td>
                          <td>
                            <span className={`umg-plan ${user.plan.toLowerCase()}`}>{user.plan}</span>
                          </td>
                          <td>
                            <div className={`umg-trust ${tone.className}`}>{user.trustScore}</div>
                            <div className="umg-subcopy">{tone.label}</div>
                            <div className="umg-badges">
                              {user.active7d ? <span className="umg-badge">Active 7d</span> : null}
                              {user.isFlagged ? <span className="umg-badge">Flagged</span> : null}
                              {user.completedFirstLoop ? <span className="umg-badge">Loop complete</span> : null}
                            </div>
                          </td>
                          <td>
                            <div>{user.layersActive}</div>
                            <div className="umg-subcopy">{user.twoFactorEnabled ? "2FA enabled" : "2FA off"}</div>
                          </td>
                          <td>
                            <div>{fmtDateTime(user.lastSeen)}</div>
                            <div className="umg-subcopy">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td>
                            <div className="umg-row-actions">
                              <button className="umg-btn ghost" onClick={() => navigate(`/admin/users/${user.id}`)}>View Profile</button>
                              <button className="umg-btn ghost" disabled={actioning === user.id} onClick={() => void changeRole(user)}>Change Role</button>
                              <button className="umg-btn ghost" disabled={actioning === user.id} onClick={() => void changePlan(user)}>Change Plan</button>
                              <button className="umg-btn ghost" disabled={actioning === user.id} onClick={() => void reset2FA(user)}>Reset 2FA</button>
                              <button className="umg-btn ghost" disabled={actioning === user.id} onClick={() => navigate(`/admin/users/${user.id}#timeline`)}>View Activity Log</button>
                              <button className="umg-btn ghost" disabled={actioning === user.id} onClick={() => navigate(`/admin/users/${user.id}#loops`)}>View Loop Progress</button>
                              <button className="umg-btn" onClick={() => navigate(`/admin/users/${user.id}#actions`)}>Send Message</button>
                              <button className="umg-btn ghost" disabled={actioning === user.id} onClick={() => void updateStatus(user)}>{user.isSuspended ? "Restore" : "Suspend"}</button>
                              <button className="umg-btn danger" disabled={actioning === user.id} onClick={() => void deleteUser(user)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="umg-pagination">
                <span>{data?.total ?? 0} users · Page {data?.page ?? 1} of {data?.pages ?? 1}</span>
                <div className="umg-actions">
                  <button className="umg-btn ghost" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Prev</button>
                  <button className="umg-btn ghost" disabled={page >= (data?.pages ?? 1)} onClick={() => setPage((current) => current + 1)}>Next</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
