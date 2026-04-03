type Props = {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export default function SettingSlider({ label, description, value, min, max, step = 1, disabled, onChange }: Props) {
  return (
    <label className="asslider">
      <span className="asslider-label">{label}</span>
      {description ? <span className="asslider-desc">{description}</span> : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="asslider-value">{value}</span>
    </label>
  );
}
