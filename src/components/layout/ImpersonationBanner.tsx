import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";

const css = `
  .imp-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid rgba(224, 90, 78, 0.28);
    background:
      linear-gradient(135deg, rgba(224, 90, 78, 0.18), rgba(92, 17, 12, 0.92)),
      radial-gradient(circle at top right, rgba(255, 220, 214, 0.12), transparent 40%);
    color: #ffe4df;
  }

  .imp-copy {
    min-width: 0;
  }

  .imp-kicker {
    font-family: "Space Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #ffc6bb;
  }

  .imp-title {
    margin-top: 6px;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.5;
  }

  .imp-meta {
    margin-top: 4px;
    font-size: 12px;
    color: rgba(255, 228, 223, 0.82);
  }

  .imp-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .imp-button {
    min-height: 38px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid rgba(255, 214, 208, 0.3);
    background: rgba(255, 244, 242, 0.08);
    color: #fff4f2;
    font-family: "Space Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .imp-button.primary {
    background: rgba(255, 244, 242, 0.16);
  }

  @media (max-width: 760px) {
    .imp-banner {
      align-items: flex-start;
      flex-direction: column;
      padding: 14px 16px;
    }
  }
`;

export default function ImpersonationBanner() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const impersonation = useAuthStore((state) => state.impersonation);
  const endImpersonation = useAuthStore((state) => state.endImpersonation);

  if (!user?.isImpersonation || !impersonation) return null;

  function handleExit() {
    const returnToPath = impersonation.returnToPath ?? `/admin/tenants/${impersonation.targetTenantId}`;
    endImpersonation();
    navigate(returnToPath, { replace: true });
  }

  return (
    <div className="imp-banner">
      <style>{css}</style>
      <div className="imp-copy">
        <div className="imp-kicker">Admin Impersonation</div>
        <div className="imp-title">Impersonating: {user.tenantName}</div>
        <div className="imp-meta">
          Acting as {user.name} ({user.email}). Every action remains attributable to the supervising admin.
        </div>
      </div>

      <div className="imp-actions">
        <button className="imp-button primary" onClick={handleExit}>
          Exit impersonation
        </button>
      </div>
    </div>
  );
}
