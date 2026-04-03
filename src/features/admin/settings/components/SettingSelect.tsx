type Option = { value: string; label: string };

type Props = {
  label: string;
  description?: string;
  value: string;
  options: Option[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

export default function SettingSelect({ label, description, value, options, disabled, onChange }: Props) {
  return (
    <label className="asselect">
      <span className="asselect-label">{label}</span>
      {description ? <span className="asselect-desc">{description}</span> : null}
      <select className="asselect-input" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
