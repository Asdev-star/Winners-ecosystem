import UserInteractionHeatmap from "../components/UserInteractionHeatmap";
import type { AnalyticsConfig, MobileAnalytics } from "../settingsTypes";

type Props = {
  value: AnalyticsConfig;
  mobileAnalytics: MobileAnalytics;
  disabled?: boolean;
  onChange: (value: AnalyticsConfig) => void;
};

export default function UserInteractionAnalyticsTab({ value, mobileAnalytics, disabled, onChange }: Props) {
  return (
    <div className="tabstack">
      <section className="tabcard">
        <div className="tabtitle">Tracking Controls</div>
        {Object.entries(value).map(([key, current]) => (
          <label key={key} className="asfield inline">
            <input
              type="checkbox"
              checked={Boolean(current)}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
            />
            <span>{key}</span>
          </label>
        ))}
      </section>

      <section className="tabcard">
        <div className="tabtitle">Mobile Telemetry</div>
        <div className="tabrow">
          <strong>Downloads</strong>
          <span>{mobileAnalytics.downloads}</span>
        </div>
        <div className="tabrow">
          <strong>Sessions</strong>
          <span>{mobileAnalytics.sessions}</span>
        </div>
        <div className="tabrow">
          <strong>Errors</strong>
          <span>{mobileAnalytics.errorReports}</span>
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Feature Usage Heatmap</div>
        <UserInteractionHeatmap
          points={[
            { feature: "Landing", count: 91 },
            { feature: "Settings", count: 67 },
            { feature: "Mobile", count: 54 },
            { feature: "Community", count: 84 },
            { feature: "Analytics", count: 45 },
          ]}
        />
      </section>
    </div>
  );
}
