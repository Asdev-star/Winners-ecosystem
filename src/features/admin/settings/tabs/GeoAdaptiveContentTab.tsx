import CountryRuleBuilder from "../components/CountryRuleBuilder";
import LanguageMapEditor from "../components/LanguageMapEditor";
import type { GeoConfig, LanguageRoute } from "../settingsTypes";

type Props = {
  value: GeoConfig;
  languageRoutes: LanguageRoute[];
  disabled?: boolean;
  onChange: (value: GeoConfig) => void;
};

export default function GeoAdaptiveContentTab({ value, languageRoutes, disabled, onChange }: Props) {
  const languages = [
    { code: "en", name: "English" },
    { code: "sw", name: "Swahili" },
    { code: "fr", name: "French" },
    { code: "ha", name: "Hausa" },
    { code: "yo", name: "Yoruba" },
    { code: "zu", name: "Zulu" },
    { code: "ar", name: "Arabic" },
    { code: "pcm", name: "Pidgin" },
  ];

  return (
    <div className="tabstack">
      <section className="tabcard">
        <div className="tabtitle">Geo Routing</div>
        <label className="asfield inline">
          <input type="checkbox" checked={value.countryLanguageRouting} disabled={disabled} onChange={(e) => onChange({ ...value, countryLanguageRouting: e.target.checked })} />
          <span>Auto-detect language by country</span>
        </label>
        <div className="tabtitle small">Supervisor Opening Lines</div>
        <div className="aslist">
          {value.supervisorOpeningLines.map((item) => (
            <div key={item.country} className="aslist-row">
              <strong>{item.country}</strong>
              <span>{item.line}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Payment Method Surfacing</div>
        <div className="aslist">
          {value.paymentMethodSurfacing.map((item) => (
            <div key={item.country} className="aslist-row">
              <strong>{item.country}</strong>
              <span>{item.methods.join(", ")}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Country Rules</div>
        <CountryRuleBuilder
          value={value.countryRules}
          disabled={disabled}
          onChange={(countryRules) => onChange({ ...value, countryRules })}
        />
      </section>

      <section className="tabcard">
        <div className="tabtitle">Language Routes</div>
        <LanguageMapEditor
          value={languageRoutes.map((route) => ({ country: route.countryCode, language: route.primaryLanguage }))}
          languages={languages}
          disabled={disabled}
          onChange={() => {
            // Language routes are persisted through the server route helper.
          }}
        />
      </section>
    </div>
  );
}
