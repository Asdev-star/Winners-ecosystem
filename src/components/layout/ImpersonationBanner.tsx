import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";

const css = `
  .imp-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid rgba(224, 90, 78, 0.34);
    background:
      radial-gradient(circle at top right, rgba(255, 220, 214, 0.16), transparent 34%),
      linear-gradient(135deg, rgba(129, 16, 16, 0.98), rgba(70, 8, 8, 0.96));
    color: #ffe4df;
    box-shadow: inset 0 1px 0 rgba(255, 220, 214, 0.08);
  }

  .imp-title {
    min-width: 0;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.5;
    letter-spacing: 0.01em;
  }

  .imp-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .imp-separator {
    color: rgba(255, 228, 223, 0.7);
    font-size: 15px;
  }

  .imp-button {
    min-height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid rgba(255, 214, 208, 0.3);
    background: rgba(255, 244, 242, 0.1);
    color: #fff4f2;
    font-family: "Space Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .imp-button.primary {
    background: rgba(255, 244, 242, 0.14);
  }

  .imp-button:hover {
    border-color: rgba(255, 214, 208, 0.52);
    background: rgba(255, 244, 242, 0.18);
  }

  @media (max-width: 760px) {
    .imp-banner {
      padding: 12px 16px;
      flex-direction: column;
      align-items: flex-start;
    }

    .imp-actions {
      width: 100%;
      justify-content: flex-start;
    }
  }
`;

export default function ImpersonationBanner() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const impersonation = useAuthStore((state) => state.impersonation);
  const endImpersonation = useAuthStore((state) => state.endImpersonation);

  if (!user?.isImpersonation || !impersonation) return null;
  const activeImpersonation = impersonation;

  function handleExit() {
    const returnToPath =
      activeImpersonation.returnToPath ?? `/admin/tenants/${activeImpersonation.targetTenantId}`;
    endImpersonation();
    navigate(returnToPath, { replace: true });
  }

  return (
    <div className="imp-banner" role="status" aria-live="polite">
      <style>{css}</style>
      <div className="imp-title">⚡ IMPERSONATING: {user.name} ({user.tenantName})</div>

      <div className="imp-actions">
        <span className="imp-separator" aria-hidden="true">—</span>
        <button className="imp-button primary" onClick={handleExit}>
          Exit Impersonation
        </button>
      </div>
    </div>
  );
}
