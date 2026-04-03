import { useMemo, useState } from "react";
import CountryRuleBuilder from "../components/CountryRuleBuilder";
import LanguageMapEditor from "../components/LanguageMapEditor";
import SettingSelect from "../components/SettingSelect";
import SettingToggle from "../components/SettingToggle";
import TranslationOverrideEditor from "../components/TranslationOverrideEditor";
import type { CountryRule, LanguageRoute, LocalizationConfig, TranslationOverride } from "../settingsTypes";

type Props = {
  value: LocalizationConfig;
  languageRoutes: LanguageRoute[];
  translationOverrides: TranslationOverride[];
  countryRules: CountryRule[];
  disabled?: boolean;
  onChange: (value: LocalizationConfig) => void;
  onLanguageRoutesChange: (value: LanguageRoute[]) => void;
  onTranslationOverridesChange: (value: TranslationOverride[]) => void;
  onCountryRulesChange: (value: CountryRule[]) => void;
};

const SUPERVISOR_KEY_HINTS = [
  "omega.greeting.morning.sw",
  "omega.greeting.morning.fr",
  "omega.greeting.morning.ha",
  "omega.greeting.morning.yo",
  "sage.encouragement.sw",
  "sage.encouragement.fr",
  "atlas.product.idea.sw",
  "atlas.product.idea.fr",
  "circuit.job.match.sw",
  "circuit.job.match.fr",
  "nova.skill.detected.sw",
  "nova.skill.detected.fr",
];

export default function LanguageLocalisationTab({
  value,
  languageRoutes,
  translationOverrides,
  countryRules,
  disabled,
  onChange,
  onLanguageRoutesChange,
  onTranslationOverridesChange,
  onCountryRulesChange,
}: Props) {
  const [countrySearch, setCountrySearch] = useState("");
  const languages = useMemo(
    () => [
      { code: "en", name: "English" },
      { code: "sw", name: "Swahili" },
      { code: "fr", name: "French" },
      { code: "ha", name: "Hausa" },
      { code: "yo", name: "Yoruba" },
      { code: "zu", name: "Zulu" },
      { code: "am", name: "Amharic" },
      { code: "ar", name: "Arabic" },
      { code: "pt", name: "Portuguese" },
      { code: "pcm", name: "Pidgin" },
    ],
    [],
  );

  const countryRows = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    return languageRoutes.filter((route) => {
      if (!query) return true;
      return [route.countryCode, route.countryName, route.primaryLanguage, route.currencyCode]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [countrySearch, languageRoutes]);

  const rtlLanguages = useMemo(() => languages.filter((lang) => lang.code === "ar"), [languages]);

  return (
    <div className="tabstack as-localisation">
      <section className="tabcard">
        <div className="tabtitle">Language & Localisation</div>
        <div className="forge-callout">
          FORGE: 91% of active users are in East Africa. Swahili auto-detection is routing correctly for KE, TZ, UG.
          French routing for SN, CI, CM has a small miss rate. Check the CI override below.
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Auto-Detection Settings</div>
        <div className="tabgrid">
          <SettingToggle
            label="Enable geo language detection"
            description="Resolve language from IP-based geo context on first request."
            checked={value.enableGeoLanguageDetection}
            disabled={disabled}
            onChange={(enableGeoLanguageDetection) => onChange({ ...value, enableGeoLanguageDetection })}
          />
          <SettingSelect
            label="Detection method"
            description="Choose how the runtime resolves the country context."
            value={value.detectionMethod}
            disabled={disabled}
            options={[
              { value: "ip", label: "IP Address" },
              { value: "browser", label: "Browser locale" },
              { value: "manual", label: "Manual override" },
            ]}
            onChange={(detectionMethod) => onChange({ ...value, detectionMethod: detectionMethod as LocalizationConfig["detectionMethod"] })}
          />
          <SettingSelect
            label="Fallback when detection fails"
            description="Used when geo detection cannot determine a country."
            value={value.fallbackWhenDetectionFails}
            disabled={disabled}
            options={languages.map((lang) => ({ value: lang.code, label: `${lang.name} (${lang.code})` }))}
            onChange={(fallbackWhenDetectionFails) => onChange({ ...value, fallbackWhenDetectionFails })}
          />
          <SettingToggle
            label="Allow user override"
            description="Let users change the detected language manually."
            checked={value.allowUserOverride}
            disabled={disabled}
            onChange={(allowUserOverride) => onChange({ ...value, allowUserOverride })}
          />
          <SettingToggle
            label="Persist user preference"
            description="Store the user override in localStorage."
            note="Keeps their choice on the next session."
            checked={value.persistUserPreference}
            disabled={disabled}
            onChange={(persistUserPreference) => onChange({ ...value, persistUserPreference })}
          />
          <SettingToggle
            label="Auto-flip RTL layout"
            description="Mirror the UI for Arabic and other RTL languages."
            checked={value.rtlAutoFlip}
            disabled={disabled}
            onChange={(rtlAutoFlip) => onChange({ ...value, rtlAutoFlip })}
          />
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Country to Language Routing Table</div>
        <div className="as-toolbar compact">
          <input
            className="asinput"
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
            placeholder="Search countries..."
          />
          <div className="as-toolbar-actions">
            <button className="asbtn" disabled={disabled}>Add Rule</button>
            <button className="asbtn ghost" disabled={disabled}>Export CSV</button>
            <button className="asbtn ghost" disabled={disabled}>Import CSV</button>
          </div>
        </div>
        <div className="table-shell">
          <div className="table-shell-head">
            <span>Country</span>
            <span>Primary Language</span>
            <span>Fallback</span>
            <span>Payment Methods</span>
          </div>
          <div className="table-shell-body">
            {countryRows.map((route) => (
              <div key={route.id} className="table-shell-row">
                <strong>{route.countryCode} {route.countryName}</strong>
                <span>{route.primaryLanguage}</span>
                <span>{route.fallbackLanguage}</span>
                <span>{route.paymentMethods.join(" · ")}</span>
              </div>
            ))}
          </div>
        </div>
        <LanguageMapEditor
          value={value.countryLanguageMapping}
          languages={languages}
          disabled={disabled}
          onChange={(next) => {
            onChange({ ...value, countryLanguageMapping: next });
            onLanguageRoutesChange(
              languageRoutes.map((route) => {
                const mapped = next.find((entry) => entry.country === route.countryCode);
                return {
                  ...route,
                  countryCode: mapped?.country ?? route.countryCode,
                  primaryLanguage: mapped?.language ?? route.primaryLanguage,
                };
              }),
            );
          }}
        />
      </section>

      <section className="tabcard">
        <div className="tabtitle">Supervisor Translation Editor</div>
        <TranslationOverrideEditor
          value={translationOverrides}
          languages={languages}
          keyHints={SUPERVISOR_KEY_HINTS}
          disabled={disabled}
          onChange={onTranslationOverridesChange}
        />
      </section>

      <section className="tabcard">
        <div className="tabtitle">RTL Layout Support</div>
        <div className="forge-callout muted">
          RTL languages detected: {rtlLanguages.map((lang) => `${lang.name} (${lang.code})`).join(", ")}
        </div>
        <div className="tabgrid">
          <SettingToggle
            label="Auto-flip layout for RTL"
            description="Flip sidebar, drawers, and reading order when Arabic is active."
            checked={value.rtlAutoFlip}
            disabled={disabled}
            onChange={(rtlAutoFlip) => onChange({ ...value, rtlAutoFlip })}
          />
          <div className="forge-callout muted">
            RTL-affected countries: EG, MA, DZ, TN, SD, LY...
          </div>
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Country Rules</div>
        <CountryRuleBuilder
          value={countryRules.map((rule) => ({
            countryCode: rule.countryCode,
            countryName: String(rule.config?.countryName ?? rule.countryCode),
            primaryLanguage: String(rule.config?.primaryLanguage ?? "en"),
            fallbackLanguage: String(rule.config?.fallbackLanguage ?? "en"),
            currencyCode: String(rule.config?.currencyCode ?? "USD"),
            currencySymbol: String(rule.config?.currencySymbol ?? "$"),
            paymentMethods: Array.isArray(rule.config?.paymentMethods) ? rule.config.paymentMethods.filter((item): item is string => typeof item === "string") : [],
          }))}
          disabled={disabled}
          onChange={(next) => {
            onCountryRulesChange(next.map((rule) => ({
              id: rule.countryCode,
              countryCode: rule.countryCode,
              config: {
                countryName: rule.countryName,
                primaryLanguage: rule.primaryLanguage,
                fallbackLanguage: rule.fallbackLanguage,
                currencyCode: rule.currencyCode,
                currencySymbol: rule.currencySymbol,
                paymentMethods: rule.paymentMethods,
              },
            })));
          }}
        />
      </section>
    </div>
  );
}
