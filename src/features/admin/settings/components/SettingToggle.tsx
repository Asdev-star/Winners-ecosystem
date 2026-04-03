type Props = {
  label: string;
  description?: string;
  note?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
};

export default function SettingToggle({ label, description, note, checked, disabled, onChange }: Props) {
  return (
    <button className={`astoggle ${checked ? "is-on" : ""}`} disabled={disabled} onClick={() => onChange(!checked)}>
      <div className="astoggle-copy">
        <strong>{label}</strong>
        {description ? <span>{description}</span> : null}
        {note ? <small>{note}</small> : null}
      </div>
      <span className="astoggle-pill">{checked ? "On" : "Off"}</span>
    </button>
  );
}
