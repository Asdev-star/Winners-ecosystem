type AdminTenantStatus = "active" | "suspended";

export type TenantTableItem = {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
  status: AdminTenantStatus;
  statusLabel: string;
  totalRevenue: number;
  monthlyRevenue: number;
  lastActivityAt?: string | null;
  owner?: { name: string; email: string } | null;
  userCount?: number;
  _count?: { users?: number };
};

type Props = {
  tenants: TenantTableItem[];
  actionTenantId: string;
  fmtDate: (value?: string | null) => string;
  fmtMoney: (value: number, currency?: string) => string;
  fmtRelativeDay: (value?: string | null) => string;
  onView: (tenantId: string) => void;
  onChangePlan: (tenant: TenantTableItem) => void;
  onImpersonate: (tenant: TenantTableItem) => void;
  onToggleStatus: (tenant: TenantTableItem) => void;
  onDelete: (tenant: TenantTableItem) => void;
};

export default function TenantTable({
  tenants,
  actionTenantId,
  fmtDate,
  fmtMoney,
  fmtRelativeDay,
  onView,
  onChangePlan,
  onImpersonate,
  onToggleStatus,
  onDelete,
}: Props) {
  return (
    <table className="tmg-table">
      <thead>
        <tr>
          <th>Workspace Name</th>
          <th>Owner</th>
          <th>Plan</th>
          <th>MRR</th>
          <th>Users</th>
          <th>Last Active</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {tenants.length === 0 ? (
          <tr>
            <td colSpan={7}>
              <div className="tmg-empty">No tenants matched the current filters.</div>
            </td>
          </tr>
        ) : (
          tenants.map((tenant) => {
            const users = tenant.userCount ?? tenant._count?.users ?? 0;
            const busy = actionTenantId === tenant.id;

            return (
              <tr key={tenant.id}>
                <td>
                  <div className="tmg-name">{tenant.name}</div>
                  <div className="tmg-subcopy">Created {fmtDate(tenant.createdAt)}</div>
                </td>
                <td>
                  <div>{tenant.owner?.name ?? "No owner found"}</div>
                  <div className="tmg-subcopy">{tenant.owner?.email ?? tenant.id}</div>
                </td>
                <td>
                  <span className={`tmg-badge ${tenant.plan.toLowerCase()}`}>{tenant.plan}</span>
                </td>
                <td>
                  <div>{fmtMoney(tenant.monthlyRevenue)}</div>
                  <div className="tmg-subcopy">Lifetime {fmtMoney(tenant.totalRevenue)}</div>
                </td>
                <td>{users}</td>
                <td>
                  <div>{fmtRelativeDay(tenant.lastActivityAt)}</div>
                  <div className={`tmg-status ${tenant.status}`}>{tenant.statusLabel}</div>
                </td>
                <td>
                  <div className="tmg-row-actions">
                    <button className="tmg-btn ghost" onClick={() => onView(tenant.id)}>View</button>
                    <button className="tmg-btn ghost" onClick={() => onChangePlan(tenant)}>Change Plan</button>
                    <button className="tmg-btn ghost" onClick={() => onImpersonate(tenant)}>Impersonate Logged</button>
                    <button className="tmg-btn ghost" onClick={() => onToggleStatus(tenant)} disabled={busy}>
                      {tenant.status === "suspended" ? "Restore" : "Suspend"}
                    </button>
                    <button className="tmg-btn danger" onClick={() => onDelete(tenant)} disabled={busy}>Delete</button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
