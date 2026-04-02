export type UserTableItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  trustScore: number;
  trustScoreTier?: string;
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

type TrustTone = {
  className: string;
  label: string;
};

type Props = {
  users: UserTableItem[];
  selectedIds: string[];
  allVisibleSelected: boolean;
  actioning: string;
  trustTone: (score: number) => TrustTone;
  fmtDateTime: (value?: string | null) => string;
  onToggleAllVisible: () => void;
  onToggleSelection: (userId: string) => void;
  onViewProfile: (userId: string) => void;
  onChangeRole: (user: UserTableItem) => void;
  onChangePlan: (user: UserTableItem) => void;
  onReset2FA: (user: UserTableItem) => void;
  onViewActivity: (userId: string) => void;
  onViewLoops: (userId: string) => void;
  onSendMessage: (userId: string) => void;
  onUpdateStatus: (user: UserTableItem) => void;
  onDelete: (user: UserTableItem) => void;
};

export default function UserTable({
  users,
  selectedIds,
  allVisibleSelected,
  actioning,
  trustTone,
  fmtDateTime,
  onToggleAllVisible,
  onToggleSelection,
  onViewProfile,
  onChangeRole,
  onChangePlan,
  onReset2FA,
  onViewActivity,
  onViewLoops,
  onSendMessage,
  onUpdateStatus,
  onDelete,
}: Props) {
  return (
    <table className="umg-table">
      <thead>
        <tr>
          <th><input className="umg-check" type="checkbox" checked={allVisibleSelected} onChange={onToggleAllVisible} /></th>
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
        {users.length === 0 ? (
          <tr>
            <td colSpan={8}>
              <div className="umg-empty">No users matched the current filters.</div>
            </td>
          </tr>
        ) : (
          users.map((user) => {
            const tone = trustTone(user.trustScore);
            const rowClass = user.trustScore < 30 ? "umg-row-risk" : user.trustScore > 85 ? "umg-row-advocate" : "";
            return (
              <tr key={user.id} className={rowClass}>
                <td>
                  <input className="umg-check" type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => onToggleSelection(user.id)} />
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
                    <button className="umg-btn ghost" onClick={() => onViewProfile(user.id)}>View Profile</button>
                    <button className="umg-btn ghost" disabled={actioning === user.id} onClick={() => onChangeRole(user)}>Change Role</button>
                    <button className="umg-btn ghost" disabled={actioning === user.id} onClick={() => onChangePlan(user)}>Change Plan</button>
                    <button className="umg-btn ghost" disabled={actioning === user.id} onClick={() => onReset2FA(user)}>Reset 2FA</button>
                    <button className="umg-btn ghost" disabled={actioning === user.id} onClick={() => onViewActivity(user.id)}>View Activity Log</button>
                    <button className="umg-btn ghost" disabled={actioning === user.id} onClick={() => onViewLoops(user.id)}>View Loop Progress</button>
                    <button className="umg-btn" onClick={() => onSendMessage(user.id)}>Send Message</button>
                    <button className="umg-btn ghost" disabled={actioning === user.id} onClick={() => onUpdateStatus(user)}>{user.isSuspended ? "Restore" : "Suspend"}</button>
                    <button className="umg-btn danger" disabled={actioning === user.id} onClick={() => onDelete(user)}>Delete</button>
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
