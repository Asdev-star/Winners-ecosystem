import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";

type QuickFilter = "all" | "active7d" | "new30d" | "lowtrust" | "flagged" | "admins";

type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  trustScore: number;
  trustScoreTier: string;
  plan: string;
  loopStage: string;
  active7d: boolean;
  isFlagged: boolean;
  completedFirstLoop: boolean;
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
  .umg-root{max-width:1280px;margin:0 auto;padding:26px 22px 88px;color:var(--text);font-family:'Syne',sans-serif}
  .umg-shell{border:1px solid rgba(201,168,76,.18);border-radius:26px;overflow:hidden;background:linear-gradient(180deg,rgba(9,16,28,.98),rgba(12,22,36,.96));box-shadow:0 24px 80px rgba(0,0,0,.28)}
  .umg-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;padding:24px;border-bottom:1px solid rgba(201,168,76,.16);background:radial-gradient(circle at top right,rgba(201,168,76,.14),transparent 32%),linear-gradient(135deg,rgba(17,29,46,.94),rgba(13,24,38,.92))}
  .umg-kicker{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
  .umg-title{margin:10px 0 0;font-size:34px;font-weight:800;letter-spacing:-.05em}
  .umg-sub{margin:10px 0 0;color:var(--text-dim);font-size:14px;line-height:1.6;max-width:760px}
  .umg-actions,.umg-row-actions,.umg-toolbar,.umg-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  .umg-body{padding:22px}
  .umg-banner{margin-bottom:16px;padding:12px 14px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,.03);font-size:13px}
  .umg-banner.error{border-color:rgba(224,90,78,.26);color:#ffcbc5;background:rgba(224,90,78,.08)}
  .umg-btn,.umg-link{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid rgba(201,168,76,.22);background:rgba(201,168,76,.08);color:var(--gold);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;cursor:pointer}
  .umg-btn.ghost,.umg-link.ghost{background:rgba(255,255,255,.03);border-color:var(--border);color:var(--text-dim)}
  .umg-signal{margin-bottom:18px;padding:18px 20px;border-radius:18px;border:1px solid rgba(201,168,76,.22);background:radial-gradient(circle at top right,rgba(137,196,225,.12),transparent 34%),linear-gradient(135deg,rgba(17,29,46,.94),rgba(13,24,38,.92))}
  .umg-signal-copy{margin:8px 0 0;color:#f4f0df;font-size:15px;line-height:1.7}
  .umg-filter-pill{display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:999px;border:1px solid var(--border);background:rgba(255,255,255,.03);color:var(--text-dim);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
  .umg-filter-pill.active{border-color:rgba(201,168,76,.26);background:rgba(201,168,76,.1);color:var(--gold)}
  .umg-search{min-width:280px;border-radius:10px;border:1px solid var(--border);background:rgba(13,24,38,.86);color:var(--text);padding:10px 12px}
  .umg-table-wrap{overflow:hidden;border-radius:18px;border:1px solid var(--border);background:linear-gradient(180deg,rgba(17,29,46,.74),rgba(13,24,38,.78))}
  .umg-table{width:100%;border-collapse:collapse}
  .umg-table th,.umg-table td{padding:14px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;font-size:13px}
  .umg-table th{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim)}
  .umg-table tbody tr:last-child td{border-bottom:none}
  .umg-name{font-weight:700}
  .umg-subcopy{margin-top:4px;color:var(--text-dim);font-size:12px;line-height:1.5}
  .umg-plan{display:inline-flex;align-items:center;justify-content:center;padding:5px 10px;border-radius:999px;border:1px solid var(--border);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
  .umg-plan.free{color:var(--ice);border-color:rgba(137,196,225,.26);background:rgba(137,196,225,.08)}
  .umg-plan.pro{color:var(--gold);border-color:rgba(201,168,76,.24);background:rgba(201,168,76,.08)}
  .umg-plan.enterprise{color:#d7c6ff;border-color:rgba(155,111,255,.28);background:rgba(155,111,255,.12)}
  .umg-trust{display:inline-flex;align-items:center;gap:8px;font-weight:700}
  .umg-trust.starter{color:#ff8d84}
  .umg-trust.builder{color:#f5c86f}
  .umg-trust.creator{color:#6ee7b7}
  .umg-trust.elite{color:#ffe38b}
  .umg-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
  .umg-badge{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.05);font-family:'Space Mono',monospace;font-size:10px;color:var(--text-dim)}
  .umg-pagination{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px;border-top:1px solid var(--border)}
  .umg-empty{padding:20px;border:1px dashed var(--border);border-radius:14px;color:var(--text-dim);background:rgba(255,255,255,.03)}
  @media (max-width:900px){.umg-table-wrap{overflow:auto}}
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
  if (score <= 30) return { className: "starter", icon: "red", label: "Starter" };
  if (score <= 60) return { className: "builder", icon: "yellow", label: "Builder" };
  if (score <= 80) return { className: "creator", icon: "green", label: "Creator" };
  return { className: "elite", icon: "star", label: "Elite" };
}

function trustIcon(kind: ReturnType<typeof trustTone>["icon"]) {
  if (kind === "red") return "🔴";
  if (kind === "yellow") return "🟡";
  if (kind === "green") return "🟢";
  return "⭐";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const signalCopy = useMemo(() => {
    const summary = data?.summary;
    return `${summary?.active7dCount ?? 0} users active in the last 7 days. NOVA flagged ${summary?.flaggedPostsCount ?? 0} posts for moderation review. ${summary?.firstLoopCompletionCount ?? 0} users have completed their first full loop. Trust Score distribution: ${summary?.lowTrustPercentage ?? 0}% below 50 — consider a campaign to drive Academy completions.`;
  }, [data]);

  return (
    <div className="umg-root">
      <style>{css}</style>
      <div className="umg-shell">
        <div className="umg-head">
          <div>
            <div className="umg-kicker">Admin / Users</div>
            <h1 className="umg-title">User Management</h1>
            <p className="umg-sub">Every person whose economic future is partly built on your platform.</p>
          </div>
          <div className="umg-actions">
            <Link className="umg-link ghost" to="/admin/overview">Back to overview</Link>
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

          {loading && !data ? (
            <div className="umg-empty">Loading user control surface...</div>
          ) : (
            <div className="umg-table-wrap">
              <table className="umg-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Trust Score</th>
                    <th>Loop Stage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.users.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="umg-empty">No users matched the current filters.</div>
                      </td>
                    </tr>
                  ) : (
                    data?.users.map((user) => {
                      const tone = trustTone(user.trustScore);
                      return (
                        <tr key={user.id}>
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
                            <div className={`umg-trust ${tone.className}`}>
                              <span>{trustIcon(tone.icon)}</span>
                              <span>Trust: {user.trustScore}</span>
                            </div>
                            <div className="umg-subcopy">{tone.label}</div>
                          </td>
                          <td>
                            <div>{user.loopStage}</div>
                            <div className="umg-badges">
                              {user.active7d ? <span className="umg-badge">Active 7d</span> : null}
                              {user.isFlagged ? <span className="umg-badge">Flagged</span> : null}
                              {user.completedFirstLoop ? <span className="umg-badge">First loop done</span> : null}
                            </div>
                          </td>
                          <td>
                            <div className="umg-row-actions">
                              <button className="umg-btn ghost" onClick={() => navigate(`/admin/users/${user.id}`)}>View</button>
                              <button className="umg-btn" onClick={() => navigate(`/admin/users/${user.id}#actions`)}>Manage</button>
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
