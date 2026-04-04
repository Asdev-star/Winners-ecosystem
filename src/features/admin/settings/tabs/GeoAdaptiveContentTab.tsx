import { useMemo, useState } from "react";
import { API_BASE } from "../../../../lib/api";
import { getAuthHeaders } from "../../../auth/authStore";
import CountryRuleBuilder from "../components/CountryRuleBuilder";
import LanguageMapEditor from "../components/LanguageMapEditor";
import SettingSelect from "../components/SettingSelect";
import SettingToggle from "../components/SettingToggle";
import type { GeoConfig, LanguageRoute } from "../settingsTypes";

type Props = {
  value: GeoConfig;
  languageRoutes: LanguageRoute[];
  disabled?: boolean;
  onChange: (value: GeoConfig) => void;
};

type GeoDetectionResult = {
  ipAddress: string;
  countryCode: string;
  countryName: string;
  language: string;
  fallbackLanguage: string;
  currencyCode: string;
  currencySymbol: string;
  paymentMethods: string[];
  timezone: string;
  rtl: boolean;
};

const DETECTION_OPTIONS = [
  { value: "MaxMind GeoLite2", label: "MaxMind GeoLite2" },
  { value: "IP Address", label: "IP Address" },
  { value: "Browser Locale", label: "Browser Locale" },
] as const;

const MAP_ZOOM_OPTIONS = [
  { value: "Africa", label: "Africa" },
  { value: "Global", label: "Global" },
  { value: "EMEA", label: "EMEA" },
  { value: "US", label: "United States" },
] as const;

const COUNTRY_OVERRIDES = [
  { countryCode: "KE", language: "Swahili", currency: "KES", payments: "M-Pesa, Flutterwave", status: "Active" },
  { countryCode: "NG", language: "English", currency: "NGN", payments: "Flutterwave, Paystack", status: "Active" },
  { countryCode: "SN", language: "French", currency: "XOF", payments: "Wave, Flutterwave", status: "Active" },
  { countryCode: "DEFAULT", language: "English", currency: "USD", payments: "Stripe", status: "Active" },
] as const;

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { message?: string }).message ?? `Request failed (${res.status})`);
  }
  return body as T;
}

function updateConfig(value: GeoConfig, onChange: (value: GeoConfig) => void, patch: Partial<GeoConfig>) {
  onChange({ ...value, ...patch });
}

export default function GeoAdaptiveContentTab({ value, languageRoutes, disabled, onChange }: Props) {
  const [testIp, setTestIp] = useState("");
  const [result, setResult] = useState<GeoDetectionResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState("");

  const languages = useMemo(
    () => [
      { code: "en", name: "English" },
      { code: "sw", name: "Swahili" },
      { code: "fr", name: "French" },
      { code: "ha", name: "Hausa" },
      { code: "yo", name: "Yoruba" },
      { code: "zu", name: "Zulu" },
      { code: "ar", name: "Arabic" },
      { code: "pcm", name: "Pidgin" },
    ],
    [],
  );

  async function testDetection() {
    const ip = testIp.trim();
    if (!ip) return;
    setTesting(true);
    setTestError("");
    try {
      const detected = await apiGet<GeoDetectionResult>(`/admin/geo/detect?ip=${encodeURIComponent(ip)}`);
      setResult(detected);
    } catch (error) {
      setResult(null);
      setTestError(error instanceof Error ? error.message : "Failed to test geo detection");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="tabstack">
      <section className="tabcard">
        <div className="tabtitle">Geo-Adaptive Content</div>
        <div className="forge-callout">
          FORGE: geo routing is active for the ecosystem. Countries are resolving into language, currency, payment ordering, and RTL behavior so the live experience can adapt without manual reloads.
        </div>
        <div className="metrics-row" style={{ marginTop: 14 }}>
          <div className="metric-pill">Country rules <strong>{value.countryRules.length}</strong></div>
          <div className="metric-pill">Language routes <strong>{languageRoutes.length}</strong></div>
          <div className="metric-pill">Payment mappings <strong>{value.paymentMethodSurfacing.length}</strong></div>
          <div className="metric-pill">Supervisor lines <strong>{value.supervisorOpeningLines.length}</strong></div>
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Detection Settings</div>
        <div className="tabgrid">
          <SettingToggle
            label="Geo-detection enabled"
            checked={value.geoDetectionEnabled}
            disabled={disabled}
            onChange={(geoDetectionEnabled) => updateConfig(value, onChange, { geoDetectionEnabled })}
          />
          <SettingSelect
            label="Detection provider"
            value={value.detectionProvider}
            disabled={disabled}
            options={DETECTION_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(detectionProvider) => updateConfig(value, onChange, { detectionProvider })}
          />
          <SettingSelect
            label="Cache TTL"
            value={String(value.cacheTtlHours)}
            disabled={disabled}
            options={["1", "6", "12", "24", "48"].map((hours) => ({ value: hours, label: `${hours} hours` }))}
            onChange={(cacheTtlHours) => updateConfig(value, onChange, { cacheTtlHours: Number(cacheTtlHours) })}
          />
          <SettingToggle
            label="Anonymise IPs before storage"
            note="GDPR-friendly request handling keeps raw IPs out of persisted geo config."
            checked={value.anonymiseIps}
            disabled={disabled}
            onChange={(anonymiseIps) => updateConfig(value, onChange, { anonymiseIps })}
          />
          <SettingToggle
            label="Allow user override"
            checked={value.allowUserOverride}
            disabled={disabled}
            onChange={(allowUserOverride) => updateConfig(value, onChange, { allowUserOverride })}
          />
          <SettingSelect
            label="Map zoom"
            value={value.mapZoom}
            disabled={disabled}
            options={MAP_ZOOM_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(mapZoom) => updateConfig(value, onChange, { mapZoom })}
          />
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Adaptive Behaviours</div>
        <div className="tabgrid">
          <SettingToggle label="Auto-language detection" checked={value.autoLanguageDetection} disabled={disabled} onChange={(autoLanguageDetection) => updateConfig(value, onChange, { autoLanguageDetection })} />
          <SettingToggle label="Currency display by country" checked={value.currencyDisplayByCountry} disabled={disabled} onChange={(currencyDisplayByCountry) => updateConfig(value, onChange, { currencyDisplayByCountry })} />
          <SettingToggle label="Payment method reordering" checked={value.paymentMethodReordering} disabled={disabled} onChange={(paymentMethodReordering) => updateConfig(value, onChange, { paymentMethodReordering })} />
          <SettingToggle label="Supervisor language adaptation" checked={value.supervisorLanguageAdaptation} disabled={disabled} onChange={(supervisorLanguageAdaptation) => updateConfig(value, onChange, { supervisorLanguageAdaptation })} />
          <SettingToggle label="ATLAS regional market signals" checked={value.atlasRegionalMarketSignals} disabled={disabled} onChange={(atlasRegionalMarketSignals) => updateConfig(value, onChange, { atlasRegionalMarketSignals })} />
          <SettingToggle label="NOVA regional skills trending" checked={value.novaRegionalSkillsTrending} disabled={disabled} onChange={(novaRegionalSkillsTrending) => updateConfig(value, onChange, { novaRegionalSkillsTrending })} />
          <SettingToggle label="Date/time format by country" checked={value.dateTimeFormatByCountry} disabled={disabled} onChange={(dateTimeFormatByCountry) => updateConfig(value, onChange, { dateTimeFormatByCountry })} />
          <SettingToggle label="RTL layout for Arabic countries" checked={value.rtlLayoutForArabicCountries} disabled={disabled} onChange={(rtlLayoutForArabicCountries) => updateConfig(value, onChange, { rtlLayoutForArabicCountries })} />
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">User Distribution Map</div>
        <div className="forge-callout muted">
          World map heatmap placeholder. Zoom is set to {value.mapZoom}. The live geo middleware now attaches country, language, currency, and RTL headers on every request.
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Country-Specific Overrides</div>
        <div className="astoolbar compact">
          <div className="as-toolbar-actions">
            <button className="asbtn" type="button" disabled={disabled}>Add country rule</button>
            <button className="asbtn ghost" type="button" disabled={disabled}>Import from CSV</button>
          </div>
        </div>
        <div className="table-shell">
          <div className="table-shell-head">
            <span>Country</span>
            <span>Language</span>
            <span>Currency</span>
            <span>Payments</span>
          </div>
          {COUNTRY_OVERRIDES.map((rule) => (
            <div key={rule.countryCode} className="table-shell-row">
              <span>{rule.countryCode === "DEFAULT" ? "Default" : rule.countryCode}</span>
              <span>{rule.language}</span>
              <span>{rule.currency}</span>
              <span>{rule.payments}</span>
            </div>
          ))}
        </div>
        <CountryRuleBuilder
          value={value.countryRules}
          disabled={disabled}
          onChange={(countryRules) => onChange({ ...value, countryRules })}
        />
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
        <div className="tabtitle">Supervisor Opening Lines</div>
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
        <div className="tabtitle">Language Routes</div>
        <LanguageMapEditor
          value={languageRoutes.map((route) => ({ country: route.countryCode, language: route.primaryLanguage }))}
          languages={languages}
          disabled={disabled}
          onChange={() => {
            // Routes are persisted through the server route helper.
          }}
        />
      </section>

      <section className="tabcard">
        <div className="tabtitle">Test Geo Detection</div>
        <div className="as-toolbar compact">
          <div className="as-toolbar-actions">
            <label className="asfield">
              <span className="asselect-label">Enter IP address</span>
              <input className="asinput" value={testIp} onChange={(event) => setTestIp(event.target.value)} placeholder="102.x.x.x" />
            </label>
            <button className="asbtn" type="button" onClick={() => void testDetection()} disabled={disabled || testing}>
              {testing ? "Testing..." : "Test"}
            </button>
          </div>
        </div>
        {testError ? <div className="error" style={{ marginBottom: 14 }}>{testError}</div> : null}
        {result ? (
          <div className="forge-callout">
            Result: Country {result.countryName} ({result.countryCode}) · Language {result.language} → {result.fallbackLanguage} fallback · Currency {result.currencyCode} ({result.currencySymbol}) · Payments {result.paymentMethods.join(", ")} · RTL {result.rtl ? "Yes" : "No"}
          </div>
        ) : (
          <div className="forge-callout muted">
            Result: Country unavailable until you run a detection test.
          </div>
        )}
      </section>
    </div>
  );
}
