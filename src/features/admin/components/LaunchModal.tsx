type LaunchChecklistItem = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail?: string;
};

type Props = {
  open: boolean;
  title: string;
  subtitle: string;
  checklist: LaunchChecklistItem[];
  confirmationText?: string;
  confirmLabel?: string;
  isBusy?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
};

const css = `
  .alm-backdrop{
    position:fixed;
    inset:0;
    z-index:120;
    display:grid;
    place-items:center;
    padding:24px;
    background:rgba(3,8,15,.76);
    backdrop-filter:blur(10px);
  }
  .alm-shell{
    width:min(780px, 100%);
    max-height:min(86vh, 880px);
    overflow:auto;
    padding:22px;
    border-radius:24px;
    border:1px solid rgba(201,168,76,.2);
    background:linear-gradient(180deg, rgba(17,29,46,.98), rgba(11,19,31,.98));
    box-shadow:0 24px 80px rgba(0,0,0,.42);
  }
  .alm-kicker{
    font-family:"Space Mono", monospace;
    font-size:10px;
    letter-spacing:.16em;
    text-transform:uppercase;
    color:var(--gold);
  }
  .alm-title{
    margin:10px 0 0;
    font-size:30px;
    font-weight:800;
    letter-spacing:-.05em;
  }
  .alm-copy{
    margin:10px 0 0;
    color:var(--text-dim);
    font-size:14px;
    line-height:1.65;
  }
  .alm-list{
    display:grid;
    gap:12px;
    margin-top:18px;
  }
  .alm-item{
    padding:14px;
    border-radius:18px;
    border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.03);
  }
  .alm-top{
    display:flex;
    justify-content:space-between;
    gap:12px;
    align-items:flex-start;
  }
  .alm-label{
    font-size:14px;
    font-weight:700;
  }
  .alm-status{
    display:inline-flex;
    align-items:center;
    padding:5px 9px;
    border-radius:999px;
    font-family:"Space Mono", monospace;
    font-size:9px;
    letter-spacing:.08em;
    text-transform:uppercase;
  }
  .alm-status.pass{
    color:var(--green);
    background:rgba(45,212,160,.1);
    border:1px solid rgba(45,212,160,.22);
  }
  .alm-status.warn{
    color:var(--gold);
    background:rgba(201,168,76,.1);
    border:1px solid rgba(201,168,76,.22);
  }
  .alm-status.fail{
    color:#ffc8c1;
    background:rgba(224,90,78,.1);
    border:1px solid rgba(224,90,78,.22);
  }
  .alm-detail{
    margin-top:10px;
    color:var(--text-dim);
    font-size:13px;
    line-height:1.6;
  }
  .alm-confirm{
    margin-top:18px;
    padding:14px 16px;
    border-radius:16px;
    border:1px solid rgba(201,168,76,.18);
    background:rgba(201,168,76,.08);
    color:#f6efdc;
    font-family:"Space Mono", monospace;
    font-size:11px;
    letter-spacing:.08em;
    text-transform:uppercase;
  }
  .alm-actions{
    display:flex;
    justify-content:flex-end;
    gap:10px;
    flex-wrap:wrap;
    margin-top:18px;
  }
  .alm-button{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    min-height:40px;
    padding:0 14px;
    border-radius:999px;
    border:1px solid rgba(201,168,76,.22);
    background:rgba(201,168,76,.08);
    color:var(--gold);
    font-family:"Space Mono", monospace;
    font-size:11px;
    letter-spacing:.08em;
    text-transform:uppercase;
    cursor:pointer;
  }
  .alm-button.ghost{
    border-color:rgba(255,255,255,.1);
    background:rgba(255,255,255,.03);
    color:var(--text-dim);
  }
  .alm-button:disabled{
    opacity:.6;
    cursor:not-allowed;
  }
`;

export type { LaunchChecklistItem };

export default function LaunchModal({
  open,
  title,
  subtitle,
  checklist,
  confirmationText,
  confirmLabel = "Confirm Launch",
  isBusy = false,
  onClose,
  onConfirm,
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="alm-backdrop" onClick={onClose}>
      <style>{css}</style>
      <div className="alm-shell" onClick={(event) => event.stopPropagation()}>
        <div className="alm-kicker">Launch Confirmation</div>
        <h2 className="alm-title">{title}</h2>
        <p className="alm-copy">{subtitle}</p>

        <div className="alm-list">
          {checklist.map((item) => (
            <div key={item.id} className="alm-item">
              <div className="alm-top">
                <div className="alm-label">{item.label}</div>
                <span className={`alm-status ${item.status}`}>{item.status}</span>
              </div>
              {item.detail ? <div className="alm-detail">{item.detail}</div> : null}
            </div>
          ))}
        </div>

        {confirmationText ? <div className="alm-confirm">Confirmation phrase: {confirmationText}</div> : null}

        <div className="alm-actions">
          <button className="alm-button ghost" onClick={onClose}>
            Cancel
          </button>
          {onConfirm ? (
            <button className="alm-button" onClick={onConfirm} disabled={isBusy}>
              {isBusy ? "Working..." : confirmLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
