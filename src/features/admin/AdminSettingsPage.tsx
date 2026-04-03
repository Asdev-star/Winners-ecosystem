import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";

type EcosystemSettings = {
  language: string;
  defaultCurrency: string;
  defaultTimezone: string;
  brandColor: string;
  accentColor: string;
  darkMode: boolean;
  fontFamily: string;
  cardStyle: string;
  adaptiveLanguage: boolean;
  manualLanguageOverride: string;
  mobileAppVersion: string;
  pushNotifications: boolean;
  analyticsTracking: boolean;
  publicRegistration: boolean;
  requireEmailVerification: boolean;
  defaultTheme: string;
  supportedLanguages: string[];
  countryLanguageMapping: Array<{ country: string; language: string }>;
  layerAccentOverrides: Array<{ layerId: string; accentColor: string }>;
  perLayerLanguages: Array<{ layerId: string; language: string }>;
  mobileBehaviors: {
    offlineMode: boolean;
    biometricLogin: boolean;
    pushNotifications: boolean;
    autoUpdate: boolean;
    analyticsTracking: boolean;
    crashReporting: boolean;
  };
  pwaInstallPrompts: boolean;
  pushNotificationRules: {
    enabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    highPriorityOnly: boolean;
  };
  offlineCachePolicy: string;
  reactNativeBuildFlags: {
    enableHermes: boolean;
    enableNewArchitecture: boolean;
    enableOTAUpdates: boolean;
  };
  featureFlagsByPlatform: {
    web: boolean;
    ios: boolean;
    android: boolean;
  };
  personalization: {
    recommendedContent: boolean;
    learningPath: boolean;
    notifications: boolean;
    onboardingFlowEnabled: boolean;
    profileTypeWeights: Array<{ profileType: string; weight: number }>;
    supervisorTone: string;
    recommendationAggressiveness: number;
  };
  analyticsControls: {
    downloads: boolean;
    sessions: boolean;
    activityHeatmaps: boolean;
    featureUsage: boolean;
    errorReporting: boolean;
    issueTracking: boolean;
    countryBreakdown: boolean;
  };
  geoAdaptive: {
    countryLanguageRouting: boolean;
    currencyDisplayMode: string;
    paymentMethodSurfacing: Array<{ country: string; methods: string[] }>;
    supervisorOpeningLines: Array<{ country: string; line: string }>;
  };
};

type AnalyticsDashboard = {
  downloads: { total: number; thisMonth: number };
  users: { unique: number; active: number };
  platforms: Array<{ platform: string; _count: number }>;
  activities: Array<{ activity: string; _count: number }>;
  events: Array<{ event: string; _count: number }>;
  countries: Array<{ country: string; _count: number }>;
  issues: Array<{
    id: string;
    event: string;
    activity: string;
    page: string | null;
    issueType: string | null;
    issueData: Record<string, unknown> | null;
    createdAt: string;
  }>;
};

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ar", name: "Arabic" },
  { code: "fr", name: "French" },
  { code: "sw", name: "Swahili" },
  { code: "pcm", name: "Pidgin" },
  { code: "ha", name: "Hausa" },
  { code: "yo", name: "Yoruba" },
  { code: "zu", name: "Zulu" },
  { code: "es", name: "Spanish" },
  { code: "de", name: "German" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "pt", name: "Portuguese" },
];

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "GH", name: "Ghana" },
  { code: "ZA", name: "South Africa" },
  { code: "EG", name: "Egypt" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "DE", name: "Germany" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
];

const css = `
  .as-root {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px 20px 80px;
    font-family: var(--font-body), 'Syne', sans-serif;
    color: var(--text);
  }
  .as-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 18px;
    padding: 24px 26px;
    border-radius: var(--card-radius, 20px);
    border: 1px solid rgba(201, 168, 76, 0.18);
    background: linear-gradient(135deg, rgba(13, 24, 38, 0.94), rgba(17, 29, 46, 0.92));
  }
  .as-eyebrow {
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 8px;
  }
  .as-title {
    margin: 0;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.04em;
  }
  .as-subtitle {
    margin: 8px 0 0;
    max-width: 760px;
    line-height: 1.6;
    color: var(--text-dim);
    font-size: 14px;
  }
  .as-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    padding: 6px;
    border-radius: var(--card-radius, 16px);
    background: rgba(13, 24, 38, 0.62);
    border: 1px solid var(--border);
  }
  .as-tab {
    padding: 10px 18px;
    border-radius: var(--card-radius, 12px);
    border: none;
    background: transparent;
    color: var(--text-dim);
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
  }
  .as-tab.active {
    background: rgba(201, 168, 76, 0.14);
    color: var(--gold);
  }
  .as-tab:hover:not(.active) {
    background: rgba(255, 255, 255, 0.04);
    color: var(--text);
  }
  .as-section {
    margin-top: 18px;
    padding: 20px;
    border: 1px solid var(--border);
    border-radius: var(--card-radius, 20px);
    background: rgba(13, 24, 38, 0.62);
  }
  .as-section-title {
    margin: 0 0 14px;
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .as-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
  .as-card {
    padding: 18px;
    border-radius: var(--card-radius, 18px);
    border: 1px solid var(--border);
    background: var(--surface);
  }
  .as-card.full {
    grid-column: 1 / -1;
  }
  .as-kpi-label {
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-dim);
    margin-bottom: 8px;
  }
  .as-kpi-value {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.05em;
    color: var(--gold);
  }
  .as-kpi-sub {
    margin-top: 6px;
    color: var(--text-dim);
    font-size: 12px;
  }
  .as-form-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 16px;
  }
  .as-label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }
  .as-input, .as-select {
    width: 100%;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: rgba(13, 24, 38, 0.86);
    color: var(--text);
    font-family: inherit;
    font-size: 14px;
  }
  .as-input:focus, .as-select:focus {
    outline: none;
    border-color: var(--gold);
  }
  .as-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    cursor: pointer;
  }
  .as-checkbox input {
    width: 18px;
    height: 18px;
    accent-color: var(--gold);
  }
  .as-toggle {
    position: relative;
    width: 48px;
    height: 26px;
    border-radius: 13px;
    background: rgba(255, 255, 255, 0.08);
    cursor: pointer;
    transition: background 0.2s;
  }
  .as-toggle.active {
    background: var(--gold);
  }
  .as-toggle::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: transform 0.2s;
  }
  .as-toggle.active::after {
    transform: translateX(22px);
  }
  .as-btn {
    border: 1px solid rgba(201, 168, 76, 0.28);
    background: rgba(201, 168, 76, 0.08);
    color: var(--gold);
    border-radius: 999px;
    padding: 10px 18px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .as-btn:hover {
    background: rgba(201, 168, 76, 0.18);
  }
  .as-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .as-alert {
    margin-bottom: 14px;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: rgba(13, 24, 38, 0.72);
    font-size: 13px;
  }
  .as-alert.success {
    border-color: rgba(45, 212, 160, 0.24);
    color: #a7f3d0;
  }
  .as-alert.error {
    border-color: rgba(224, 90, 78, 0.24);
    color: #ffbbb4;
  }
  .as-table {
    width: 100%;
    border-collapse: collapse;
  }
  .as-table th, .as-table td {
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
    text-align: left;
    font-size: 13px;
  }
  .as-table th {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
  }
  .as-badge {
    display: inline-flex;
    padding: 4px 10px;
    border-radius: 999px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .as-badge.success {
    color: var(--green);
    background: rgba(45, 212, 160, 0.12);
    border: 1px solid rgba(45, 212, 160, 0.24);
  }
  .as-badge.error {
    color: var(--red);
    background: rgba(224, 90, 78, 0.12);
    border: 1px solid rgba(224, 90, 78, 0.24);
  }
  .as-badge.info {
    color: var(--ice);
    background: rgba(137, 196, 225, 0.12);
    border: 1px solid rgba(137, 196, 225, 0.24);
  }
  .as-mapping-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    align-items: center;
    padding: 12px;
    border-radius: 12px;
    background: rgba(13, 24, 38, 0.48);
    margin-bottom: 8px;
  }
  .as-chip-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px 12px;
  }
  .as-empty {
    padding: 24px;
    border-radius: 16px;
    border: 1px dashed var(--border);
    color: var(--text-dim);
    text-align: center;
  }
  @media (max-width: 900px) {
    .as-grid { grid-template-columns: 1fr; }
    .as-form-row { grid-template-columns: 1fr; }
    .as-chip-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .as-tabs { overflow-x: auto; }
  }
`;

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message ?? `Request failed (${res.status})`);
  return body as T;
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((payload as { message?: string }).message ?? `Request failed (${res.status})`);
  return payload as T;
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((payload as { message?: string }).message ?? `Request failed (${res.status})`);
  return payload as T;
}

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<"general" | "mobile" | "analytics" | "countries">("general");
  const [settings, setSettings] = useState<EcosystemSettings | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState<Partial<EcosystemSettings>>({});

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await apiGet<EcosystemSettings>("/admin/settings");
      setSettings(data);
      setFormData(data as Partial<EcosystemSettings>);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics() {
    try {
      const data = await apiGet<AnalyticsDashboard>("/admin/analytics/dashboard");
      setAnalytics(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    }
  }

  async function saveSettings(updates: Partial<EcosystemSettings>) {
    try {
      setSaving(true);
      await apiPut<{ message: string }>("/admin/settings", updates);
      await loadSettings();
      setSuccess("Settings saved successfully");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function saveCountryMapping(mapping: Array<{ country: string; language: string }>) {
    try {
      setSaving(true);
      await apiPut<{ message: string }>("/admin/settings/country-mapping", mapping);
      await loadSettings();
      setSuccess("Country mapping updated");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save mapping");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    void loadSettings();
    if (tab === "analytics") {
      void loadAnalytics();
    }
  }, [tab]);

  const countryMapping = useMemo(() => formData?.countryLanguageMapping ?? [], [formData]);
  const layerAccentOverrides = useMemo(() => formData?.layerAccentOverrides ?? [], [formData]);
  const perLayerLanguages = useMemo(() => formData?.perLayerLanguages ?? [], [formData]);
  const supportedLanguages = useMemo(() => formData?.supportedLanguages ?? [], [formData]);
  const profileTypeWeights = useMemo(() => formData?.personalization?.profileTypeWeights ?? [], [formData]);
  const paymentMethodSurfacing = useMemo(() => formData?.geoAdaptive?.paymentMethodSurfacing ?? [], [formData]);
  const supervisorOpeningLines = useMemo(() => formData?.geoAdaptive?.supervisorOpeningLines ?? [], [formData]);

  function updateField<K extends keyof EcosystemSettings>(key: K, value: EcosystemSettings[K]) {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    saveSettings(updated as Partial<EcosystemSettings>);
  }

  function toggleMobileBehavior(key: string, value: boolean) {
    const behaviors = { ...formData.mobileBehaviors, [key]: value };
    updateField("mobileBehaviors", behaviors as EcosystemSettings["mobileBehaviors"]);
  }

  function togglePersonalization(key: string, value: boolean) {
    const personal = { ...formData.personalization, [key]: value };
    updateField("personalization", personal as EcosystemSettings["personalization"]);
  }

  function updateNestedObject<K extends keyof EcosystemSettings>(
    key: K,
    updater: (value: NonNullable<EcosystemSettings[K]>) => NonNullable<EcosystemSettings[K]>,
  ) {
    const current = (formData[key] ?? settings?.[key]) as NonNullable<EcosystemSettings[K]>;
    const next = updater(current);
    updateField(key, next as EcosystemSettings[K]);
  }

  if (loading && !settings) {
    return (
      <div className="as-root">
        <style>{css}</style>
        <div className="as-header">
          <div>
            <div className="as-eyebrow">Ecosystem Controller / Settings</div>
            <h1 className="as-title">Loading settings</h1>
            <p className="as-subtitle">Fetching ecosystem control defaults and saved overrides.</p>
          </div>
        </div>
        <div className="as-empty">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="as-root">
      <style>{css}</style>

      <div className="as-header">
        <div>
          <div className="as-eyebrow">Ecosystem Controller / Settings</div>
          <h1 className="as-title">Ecosystem Settings</h1>
          <p className="as-subtitle">
            Control ecosystem display and theming, language and localisation, personalisation, mobile app behaviour, user interaction analytics, and geo-adaptive content.
          </p>
        </div>
      </div>

      {error ? <div className="as-alert error">{error}</div> : null}
      {success ? <div className="as-alert success">{success}</div> : null}

      <div className="as-tabs">
        <button className={`as-tab ${tab === "general" ? "active" : ""}`} onClick={() => setTab("general")}>General</button>
        <button className={`as-tab ${tab === "mobile" ? "active" : ""}`} onClick={() => setTab("mobile")}>Mobile App</button>
        <button className={`as-tab ${tab === "analytics" ? "active" : ""}`} onClick={() => setTab("analytics")}>Analytics</button>
        <button className={`as-tab ${tab === "countries" ? "active" : ""}`} onClick={() => setTab("countries")}>Country / Language</button>
      </div>

      {tab === "general" && settings && (
        <>
          <div className="as-section">
            <h2 className="as-section-title">Language & Display</h2>
            <div className="as-form-row">
              <div>
                <label className="as-label">Default Language</label>
                <select
                  className="as-select"
                  value={formData.language ?? "en"}
                  onChange={(e) => updateField("language", e.target.value)}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="as-label">Default Theme</label>
                <select
                  className="as-select"
                  value={formData.defaultTheme ?? "light"}
                  onChange={(e) => updateField("defaultTheme", e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
            <div className="as-form-row">
              <div>
                <label className="as-label">Brand Color</label>
                <input
                  type="color"
                  className="as-input"
                  value={formData.brandColor ?? "#C9A84C"}
                  onChange={(e) => updateField("brandColor", e.target.value)}
                />
              </div>
              <div>
                <label className="as-label">Accent Color</label>
                <input
                  type="color"
                  className="as-input"
                  value={formData.accentColor ?? "#89C4E1"}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                />
              </div>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.adaptiveLanguage ?? false}
                onChange={(e) => updateField("adaptiveLanguage", e.target.checked)}
              />
              <span>Enable adaptive language based on user country</span>
            </div>
            <div className="as-form-row">
              <div>
                <label className="as-label">Font Family</label>
                <input
                  type="text"
                  className="as-input"
                  value={formData.fontFamily ?? settings.fontFamily}
                  onChange={(e) => updateField("fontFamily", e.target.value)}
                />
              </div>
              <div>
                <label className="as-label">Card Style</label>
                <select
                  className="as-select"
                  value={formData.cardStyle ?? settings.cardStyle}
                  onChange={(e) => updateField("cardStyle", e.target.value)}
                >
                  <option value="glass">Glass</option>
                  <option value="solid">Solid</option>
                  <option value="outline">Outline</option>
                  <option value="elevated">Elevated</option>
                </select>
              </div>
            </div>
          </div>

          <div className="as-section">
            <h2 className="as-section-title">Layer Accent Overrides</h2>
            <LayerAccentOverrideEditor
              value={layerAccentOverrides}
              onChange={(next) => updateField("layerAccentOverrides", next)}
              saving={saving}
            />
          </div>

          <div className="as-section">
            <h2 className="as-section-title">Regional Settings</h2>
            <div className="as-form-row">
              <div>
                <label className="as-label">Default Currency</label>
                <select
                  className="as-select"
                  value={formData.defaultCurrency ?? "USD"}
                  onChange={(e) => updateField("defaultCurrency", e.target.value)}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="NGN">NGN - Nigerian Naira</option>
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="ZAR">ZAR - South African Rand</option>
                </select>
              </div>
              <div>
                <label className="as-label">Default Timezone</label>
                <select
                  className="as-select"
                  value={formData.defaultTimezone ?? "UTC"}
                  onChange={(e) => updateField("defaultTimezone", e.target.value)}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Africa/Lagos">Lagos</option>
                  <option value="Africa/Nairobi">Nairobi</option>
                </select>
              </div>
            </div>
            <div className="as-form-row">
              <div>
                <label className="as-label">Per-Layer Language Overrides</label>
                <PerLayerLanguageEditor
                  value={perLayerLanguages}
                  onChange={(next) => updateField("perLayerLanguages", next)}
                  saving={saving}
                />
              </div>
            </div>
            <div className="as-form-row">
              <div>
                <label className="as-label">Manual Language Override</label>
                <select
                  className="as-select"
                  value={formData.manualLanguageOverride ?? ""}
                  onChange={(e) => updateField("manualLanguageOverride", e.target.value)}
                >
                  <option value="">Auto</option>
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="as-label">Supported Languages</label>
                <div className="as-chip-grid">
                  {LANGUAGES.map((lang) => (
                    <label key={lang.code} className="as-checkbox">
                      <input
                        type="checkbox"
                        checked={supportedLanguages.includes(lang.code)}
                        onChange={() => {
                          const next = supportedLanguages.includes(lang.code)
                            ? supportedLanguages.filter((code) => code !== lang.code)
                            : [...supportedLanguages, lang.code];
                          updateField("supportedLanguages", next);
                        }}
                      />
                      <span>{lang.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="as-section">
            <h2 className="as-section-title">Registration & Security</h2>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.publicRegistration ?? false}
                onChange={(e) => updateField("publicRegistration", e.target.checked)}
              />
              <span>Allow public user registration</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.requireEmailVerification ?? false}
                onChange={(e) => updateField("requireEmailVerification", e.target.checked)}
              />
              <span>Require email verification</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.analyticsTracking ?? false}
                onChange={(e) => updateField("analyticsTracking", e.target.checked)}
              />
              <span>Enable analytics tracking</span>
            </div>
          </div>

          <div className="as-section">
            <h2 className="as-section-title">Personalization</h2>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.personalization?.recommendedContent ?? false}
                onChange={(e) => togglePersonalization("recommendedContent", e.target.checked)}
              />
              <span>Show recommended content</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.personalization?.learningPath ?? false}
                onChange={(e) => togglePersonalization("learningPath", e.target.checked)}
              />
              <span>Personalized learning paths</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.personalization?.notifications ?? false}
                onChange={(e) => togglePersonalization("notifications", e.target.checked)}
              />
              <span>Personalized notifications</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.personalization?.onboardingFlowEnabled ?? true}
                onChange={(e) => updateNestedObject("personalization", (current) => ({ ...current, onboardingFlowEnabled: e.target.checked }))}
              />
              <span>OMEGA onboarding flow control</span>
            </div>
            <div className="as-form-row">
              <div>
                <label className="as-label">Supervisor Tone</label>
                <select
                  className="as-select"
                  value={formData.personalization?.supervisorTone ?? "measured"}
                  onChange={(e) => updateNestedObject("personalization", (current) => ({ ...current, supervisorTone: e.target.value }))}
                >
                  <option value="measured">Measured</option>
                  <option value="direct">Direct</option>
                  <option value="friendly">Friendly</option>
                  <option value="premium">Premium</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="as-label">Recommendation Aggressiveness</label>
                <input
                  className="as-input"
                  type="range"
                  min={0}
                  max={100}
                  value={formData.personalization?.recommendationAggressiveness ?? 55}
                  onChange={(e) => updateNestedObject("personalization", (current) => ({ ...current, recommendationAggressiveness: Number(e.target.value) }))}
                />
                <div className="as-kpi-sub">{formData.personalization?.recommendationAggressiveness ?? 55}/100</div>
              </div>
            </div>
            <div className="as-form-row">
              <div>
                <label className="as-label">Profile Type Weighting</label>
                <ProfileWeightsEditor
                  value={profileTypeWeights}
                  onChange={(next) => updateNestedObject("personalization", (current) => ({ ...current, profileTypeWeights: next }))}
                  saving={saving}
                />
              </div>
              <div>
                <label className="as-label">Access Policy</label>
                <div className="as-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.publicRegistration ?? false}
                    onChange={(e) => updateField("publicRegistration", e.target.checked)}
                  />
                  <span>Allow public user registration</span>
                </div>
                <div className="as-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.requireEmailVerification ?? false}
                    onChange={(e) => updateField("requireEmailVerification", e.target.checked)}
                  />
                  <span>Require email verification</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "mobile" && settings && (
        <>
          <div className="as-section">
            <h2 className="as-section-title">Mobile App Behaviors</h2>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.mobileBehaviors?.offlineMode ?? false}
                onChange={(e) => toggleMobileBehavior("offlineMode", e.target.checked)}
              />
              <span>Enable offline mode</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.mobileBehaviors?.biometricLogin ?? false}
                onChange={(e) => toggleMobileBehavior("biometricLogin", e.target.checked)}
              />
              <span>Enable biometric login</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.mobileBehaviors?.pushNotifications ?? false}
                onChange={(e) => toggleMobileBehavior("pushNotifications", e.target.checked)}
              />
              <span>Push notifications</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.mobileBehaviors?.autoUpdate ?? false}
                onChange={(e) => toggleMobileBehavior("autoUpdate", e.target.checked)}
              />
              <span>Auto-update app</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.mobileBehaviors?.analyticsTracking ?? false}
                onChange={(e) => toggleMobileBehavior("analyticsTracking", e.target.checked)}
              />
              <span>Analytics tracking</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.mobileBehaviors?.crashReporting ?? false}
                onChange={(e) => toggleMobileBehavior("crashReporting", e.target.checked)}
              />
              <span>Crash reporting</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.pwaInstallPrompts ?? true}
                onChange={(e) => updateField("pwaInstallPrompts", e.target.checked)}
              />
              <span>PWA install prompts</span>
            </div>
          </div>

          <div className="as-section">
            <h2 className="as-section-title">Push Notification Rules</h2>
            <div className="as-form-row">
              <div>
                <label className="as-label">Quiet Hours Start</label>
                <input
                  className="as-input"
                  type="time"
                  value={formData.pushNotificationRules?.quietHoursStart ?? "22:00"}
                  onChange={(e) => updateNestedObject("pushNotificationRules", (current) => ({ ...current, quietHoursStart: e.target.value }))}
                />
              </div>
              <div>
                <label className="as-label">Quiet Hours End</label>
                <input
                  type="time"
                  className="as-input"
                  value={formData.pushNotificationRules?.quietHoursEnd ?? "07:00"}
                  onChange={(e) => updateNestedObject("pushNotificationRules", (current) => ({ ...current, quietHoursEnd: e.target.value }))}
                />
              </div>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.pushNotificationRules?.enabled ?? true}
                onChange={(e) => updateNestedObject("pushNotificationRules", (current) => ({ ...current, enabled: e.target.checked }))}
              />
              <span>Enable notification rules</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.pushNotificationRules?.highPriorityOnly ?? false}
                onChange={(e) => updateNestedObject("pushNotificationRules", (current) => ({ ...current, highPriorityOnly: e.target.checked }))}
              />
              <span>High-priority only during quiet hours</span>
            </div>
          </div>

          <div className="as-section">
            <h2 className="as-section-title">Build Flags & Caching</h2>
            <div className="as-form-row">
              <div>
                <label className="as-label">Offline Cache Policy</label>
                <select
                  className="as-select"
                  value={formData.offlineCachePolicy ?? "balanced"}
                  onChange={(e) => updateField("offlineCachePolicy", e.target.value)}
                >
                  <option value="aggressive">Aggressive</option>
                  <option value="balanced">Balanced</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
              <div>
                <label className="as-label">Mobile App Version</label>
                <input
                  type="text"
                  className="as-input"
                  value={formData.mobileAppVersion ?? "1.0.0"}
                  onChange={(e) => updateField("mobileAppVersion", e.target.value)}
                />
              </div>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.reactNativeBuildFlags?.enableHermes ?? true}
                onChange={(e) => updateNestedObject("reactNativeBuildFlags", (current) => ({ ...current, enableHermes: e.target.checked }))}
              />
              <span>Enable Hermes</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.reactNativeBuildFlags?.enableNewArchitecture ?? false}
                onChange={(e) => updateNestedObject("reactNativeBuildFlags", (current) => ({ ...current, enableNewArchitecture: e.target.checked }))}
              />
              <span>Enable React Native new architecture</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.reactNativeBuildFlags?.enableOTAUpdates ?? true}
                onChange={(e) => updateNestedObject("reactNativeBuildFlags", (current) => ({ ...current, enableOTAUpdates: e.target.checked }))}
              />
              <span>Enable OTA updates</span>
            </div>
            <div className="as-form-row">
              <div>
                <label className="as-label">Web Feature Flag</label>
                <div className="as-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.featureFlagsByPlatform?.web ?? true}
                    onChange={(e) => updateNestedObject("featureFlagsByPlatform", (current) => ({ ...current, web: e.target.checked }))}
                  />
                  <span>Web</span>
                </div>
              </div>
              <div>
                <label className="as-label">Native Flags</label>
                <div className="as-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.featureFlagsByPlatform?.ios ?? true}
                    onChange={(e) => updateNestedObject("featureFlagsByPlatform", (current) => ({ ...current, ios: e.target.checked }))}
                  />
                  <span>iOS</span>
                </div>
                <div className="as-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.featureFlagsByPlatform?.android ?? true}
                    onChange={(e) => updateNestedObject("featureFlagsByPlatform", (current) => ({ ...current, android: e.target.checked }))}
                  />
                  <span>Android</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "analytics" && (
        <>
          <div className="as-section">
            <h2 className="as-section-title">App Analytics</h2>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.analyticsTracking ?? false}
                onChange={(e) => updateField("analyticsTracking", e.target.checked)}
              />
              <span>Global analytics tracking</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.analyticsControls?.downloads ?? true}
                onChange={(e) => updateNestedObject("analyticsControls", (current) => ({ ...current, downloads: e.target.checked }))}
              />
              <span>Track downloads</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.analyticsControls?.sessions ?? true}
                onChange={(e) => updateNestedObject("analyticsControls", (current) => ({ ...current, sessions: e.target.checked }))}
              />
              <span>Track sessions</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.analyticsControls?.activityHeatmaps ?? true}
                onChange={(e) => updateNestedObject("analyticsControls", (current) => ({ ...current, activityHeatmaps: e.target.checked }))}
              />
              <span>Activity heatmaps</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.analyticsControls?.featureUsage ?? true}
                onChange={(e) => updateNestedObject("analyticsControls", (current) => ({ ...current, featureUsage: e.target.checked }))}
              />
              <span>Feature usage</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.analyticsControls?.errorReporting ?? true}
                onChange={(e) => updateNestedObject("analyticsControls", (current) => ({ ...current, errorReporting: e.target.checked }))}
              />
              <span>Error reporting</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.analyticsControls?.issueTracking ?? true}
                onChange={(e) => updateNestedObject("analyticsControls", (current) => ({ ...current, issueTracking: e.target.checked }))}
              />
              <span>Issue tracking</span>
            </div>
            <div className="as-checkbox">
              <input
                type="checkbox"
                checked={formData.analyticsControls?.countryBreakdown ?? true}
                onChange={(e) => updateNestedObject("analyticsControls", (current) => ({ ...current, countryBreakdown: e.target.checked }))}
              />
              <span>Country-level breakdowns</span>
            </div>
            {!analytics ? (
              <div className="as-empty">Loading analytics...</div>
            ) : (
              <>
                <div className="as-grid">
                  <div className="as-card">
                    <div className="as-kpi-label">Total Downloads</div>
                    <div className="as-kpi-value">{analytics.downloads.total}</div>
                    <div className="as-kpi-sub">All time</div>
                  </div>
                  <div className="as-card">
                    <div className="as-kpi-label">This Month</div>
                    <div className="as-kpi-value">{analytics.downloads.thisMonth}</div>
                    <div className="as-kpi-sub">New downloads</div>
                  </div>
                  <div className="as-card">
                    <div className="as-kpi-label">Active Users</div>
                    <div className="as-kpi-value">{analytics.users.active}</div>
                    <div className="as-kpi-sub">Last 7 days</div>
                  </div>
                </div>

                <div className="as-grid" style={{ marginTop: 14 }}>
                  <div className="as-card full">
                    <h3 className="as-section-title">By Platform</h3>
                    {analytics.platforms.length === 0 ? (
                      <div className="as-empty">No platform data</div>
                    ) : (
                      <table className="as-table">
                        <thead>
                          <tr>
                            <th>Platform</th>
                            <th>Downloads</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.platforms.map((p) => (
                            <tr key={p.platform}>
                              <td>{p.platform}</td>
                              <td>{p._count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="as-grid" style={{ marginTop: 14 }}>
                  <div className="as-card full">
                    <h3 className="as-section-title">User Activities</h3>
                    {analytics.activities.length === 0 ? (
                      <div className="as-empty">No activity data</div>
                    ) : (
                      <table className="as-table">
                        <thead>
                          <tr>
                            <th>Activity</th>
                            <th>Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.activities.map((a) => (
                            <tr key={a.activity}>
                              <td>{a.activity}</td>
                              <td>{a._count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="as-grid" style={{ marginTop: 14 }}>
                  <div className="as-card full">
                    <h3 className="as-section-title">By Country</h3>
                    {analytics.countries.length === 0 ? (
                      <div className="as-empty">No country data</div>
                    ) : (
                      <table className="as-table">
                        <thead>
                          <tr>
                            <th>Country</th>
                            <th>Users</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.countries.slice(0, 10).map((c) => (
                            <tr key={c.country}>
                              <td>{c.country}</td>
                              <td>{c._count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="as-grid" style={{ marginTop: 14 }}>
                  <div className="as-card full">
                    <h3 className="as-section-title">Issues Reported</h3>
                    {analytics.issues.length === 0 ? (
                      <div className="as-empty">No issues reported</div>
                    ) : (
                      <table className="as-table">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Activity</th>
                            <th>Page</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.issues.map((issue) => (
                            <tr key={issue.id}>
                              <td>
                                <span className="as-badge error">{issue.issueType ?? "unknown"}</span>
                              </td>
                              <td>{issue.activity}</td>
                              <td>{issue.page ?? "-"}</td>
                              <td>{new Date(issue.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {tab === "countries" && settings && (
        <>
          <div className="as-section">
            <h2 className="as-section-title">Geo-Adaptive Content</h2>
            <div className="as-form-row">
              <div>
                <label className="as-label">Currency Display Mode</label>
                <select
                  className="as-select"
                  value={formData.geoAdaptive?.currencyDisplayMode ?? "localized"}
                  onChange={(e) => updateNestedObject("geoAdaptive", (current) => ({ ...current, currencyDisplayMode: e.target.value }))}
                >
                  <option value="localized">Localized</option>
                  <option value="symbol-first">Symbol first</option>
                  <option value="code-first">Code first</option>
                </select>
              </div>
              <div>
                <label className="as-label">Country Routing</label>
                <div className="as-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.geoAdaptive?.countryLanguageRouting ?? true}
                    onChange={(e) => updateNestedObject("geoAdaptive", (current) => ({ ...current, countryLanguageRouting: e.target.checked }))}
                  />
                  <span>Enable country-to-language routing</span>
                </div>
              </div>
            </div>
          </div>

          <div className="as-section">
            <h2 className="as-section-title">Country to Language Mapping</h2>
            <p style={{ color: "var(--text-dim)", marginBottom: 16 }}>
              Configure which language is automatically selected based on the user's country. This enables adaptive language based on geographic location.
            </p>
            {countryMapping.length === 0 ? (
              <div className="as-empty">No mappings configured</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {countryMapping.map((mapping, index) => {
                  const country = COUNTRIES.find((c) => c.code === mapping.country);
                  const language = LANGUAGES.find((l) => l.code === mapping.language);
                  return (
                    <div key={mapping.country} className="as-mapping-row">
                      <div>
                        <strong>{country?.name ?? mapping.country}</strong>
                        <span style={{ color: "var(--text-dim)", marginLeft: 8 }}>({mapping.country})</span>
                      </div>
                      <div>
                        <span style={{ color: "var(--gold)" }}>{language?.name ?? mapping.language}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="as-section">
            <h2 className="as-section-title">Add New Mapping</h2>
            <CountryMappingForm
              languages={LANGUAGES}
              countries={COUNTRIES}
              existingMappings={countryMapping}
              onSave={saveCountryMapping}
              saving={saving}
            />
          </div>

          <div className="as-section">
            <h2 className="as-section-title">Payment Method Surfacing</h2>
            <PaymentSurfacingEditor
              value={paymentMethodSurfacing}
              onChange={(next) => updateNestedObject("geoAdaptive", (current) => ({ ...current, paymentMethodSurfacing: next }))}
              saving={saving}
            />
          </div>

          <div className="as-section">
            <h2 className="as-section-title">Supervisor Opening Lines</h2>
            <SupervisorOpeningLinesEditor
              value={supervisorOpeningLines}
              onChange={(next) => updateNestedObject("geoAdaptive", (current) => ({ ...current, supervisorOpeningLines: next }))}
              saving={saving}
            />
          </div>
        </>
      )}
    </div>
  );
}

function CountryMappingForm({
  languages,
  countries,
  existingMappings,
  onSave,
  saving,
}: {
  languages: Array<{ code: string; name: string }>;
  countries: Array<{ code: string; name: string }>;
  existingMappings: Array<{ country: string; language: string }>;
  onSave: (mapping: Array<{ country: string; language: string }>) => void;
  saving: boolean;
}) {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const existingCodes = existingMappings.map((m) => m.country);
  const availableCountries = countries.filter((c) => !existingCodes.includes(c.code));

  function handleAdd() {
    if (!selectedCountry || !selectedLanguage) return;
    const newMapping = [...existingMappings, { country: selectedCountry, language: selectedLanguage }];
    onSave(newMapping);
    setSelectedCountry("");
  }

  return (
    <div className="as-form-row">
      <div>
        <label className="as-label">Country</label>
        <select
          className="as-select"
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
        >
          <option value="">Select country...</option>
          {availableCountries.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="as-label">Language</label>
        <select
          className="as-select"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <button className="as-btn" onClick={handleAdd} disabled={saving || !selectedCountry}>
          {saving ? "Adding..." : "Add Mapping"}
        </button>
      </div>
    </div>
  );
}

function LayerAccentOverrideEditor({
  value,
  onChange,
  saving,
}: {
  value: Array<{ layerId: string; accentColor: string }>;
  onChange: (value: Array<{ layerId: string; accentColor: string }>) => void;
  saving: boolean;
}) {
  const [layerId, setLayerId] = useState("");
  const [accentColor, setAccentColor] = useState("#C9A84C");

  function addRow() {
    if (!layerId.trim()) return;
    const next = value.filter((item) => item.layerId !== layerId.trim());
    onChange([...next, { layerId: layerId.trim(), accentColor }]);
    setLayerId("");
  }

  return (
    <div>
      <div className="as-form-row">
        <div>
          <label className="as-label">Layer ID</label>
          <input className="as-input" type="text" value={layerId} onChange={(e) => setLayerId(e.target.value)} placeholder="community" />
        </div>
        <div>
          <label className="as-label">Accent Color</label>
          <input className="as-input" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
        </div>
      </div>
      <button className="as-btn" onClick={addRow} disabled={saving || !layerId.trim()}>
        Save Layer Override
      </button>
      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        {value.length === 0 ? (
          <div className="as-empty">No layer overrides configured</div>
        ) : (
          value.map((item) => (
            <div key={item.layerId} className="as-mapping-row">
              <div><strong>{item.layerId}</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: item.accentColor }}>{item.accentColor}</span>
                <button className="as-btn" onClick={() => onChange(value.filter((row) => row.layerId !== item.layerId))} disabled={saving}>
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PerLayerLanguageEditor({
  value,
  onChange,
  saving,
}: {
  value: Array<{ layerId: string; language: string }>;
  onChange: (value: Array<{ layerId: string; language: string }>) => void;
  saving: boolean;
}) {
  const [layerId, setLayerId] = useState("");
  const [language, setLanguage] = useState("en");

  function addRow() {
    if (!layerId.trim()) return;
    const next = value.filter((item) => item.layerId !== layerId.trim());
    onChange([...next, { layerId: layerId.trim(), language }]);
    setLayerId("");
  }

  return (
    <div>
      <div className="as-form-row">
        <div>
          <label className="as-label">Layer ID</label>
          <input className="as-input" type="text" value={layerId} onChange={(e) => setLayerId(e.target.value)} placeholder="landing" />
        </div>
        <div>
          <label className="as-label">Language</label>
          <select className="as-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>
      </div>
      <button className="as-btn" onClick={addRow} disabled={saving || !layerId.trim()}>
        Save Layer Language
      </button>
      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        {value.length === 0 ? (
          <div className="as-empty">No per-layer language overrides configured</div>
        ) : (
          value.map((item) => (
            <div key={item.layerId} className="as-mapping-row">
              <div><strong>{item.layerId}</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "var(--gold)" }}>{item.language}</span>
                <button className="as-btn" onClick={() => onChange(value.filter((row) => row.layerId !== item.layerId))} disabled={saving}>
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProfileWeightsEditor({
  value,
  onChange,
  saving,
}: {
  value: Array<{ profileType: string; weight: number }>;
  onChange: (value: Array<{ profileType: string; weight: number }>) => void;
  saving: boolean;
}) {
  const [profileType, setProfileType] = useState("");
  const [weight, setWeight] = useState("1");

  function addRow() {
    if (!profileType.trim()) return;
    const nextWeight = Number(weight);
    if (Number.isNaN(nextWeight)) return;
    const next = value.filter((item) => item.profileType !== profileType.trim());
    onChange([...next, { profileType: profileType.trim(), weight: nextWeight }]);
    setProfileType("");
    setWeight("1");
  }

  return (
    <div>
      <div className="as-form-row">
        <div>
          <label className="as-label">Profile Type</label>
          <input className="as-input" type="text" value={profileType} onChange={(e) => setProfileType(e.target.value)} placeholder="creator" />
        </div>
        <div>
          <label className="as-label">Weight</label>
          <input className="as-input" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
      </div>
      <button className="as-btn" onClick={addRow} disabled={saving || !profileType.trim()}>
        Save Profile Weight
      </button>
      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        {value.length === 0 ? (
          <div className="as-empty">No profile weights configured</div>
        ) : (
          value.map((item) => (
            <div key={item.profileType} className="as-mapping-row">
              <div><strong>{item.profileType}</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "var(--gold)" }}>{item.weight}</span>
                <button className="as-btn" onClick={() => onChange(value.filter((row) => row.profileType !== item.profileType))} disabled={saving}>
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PaymentSurfacingEditor({
  value,
  onChange,
  saving,
}: {
  value: Array<{ country: string; methods: string[] }>;
  onChange: (value: Array<{ country: string; methods: string[] }>) => void;
  saving: boolean;
}) {
  const [country, setCountry] = useState("NG");
  const [methods, setMethods] = useState("card, bank_transfer");

  function addRow() {
    if (!country.trim()) return;
    const nextMethods = methods
      .split(",")
      .map((method) => method.trim())
      .filter(Boolean);
    const next = value.filter((item) => item.country !== country.trim());
    onChange([...next, { country: country.trim(), methods: nextMethods }]);
    setMethods("card, bank_transfer");
  }

  return (
    <div>
      <div className="as-form-row">
        <div>
          <label className="as-label">Country</label>
          <select className="as-select" value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((item) => (
              <option key={item.code} value={item.code}>{item.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="as-label">Methods</label>
          <input className="as-input" type="text" value={methods} onChange={(e) => setMethods(e.target.value)} placeholder="card, paystack, bank_transfer" />
        </div>
      </div>
      <button className="as-btn" onClick={addRow} disabled={saving || !country.trim()}>
        Save Payment Rule
      </button>
      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        {value.length === 0 ? (
          <div className="as-empty">No payment surfacing rules configured</div>
        ) : (
          value.map((item) => (
            <div key={item.country} className="as-mapping-row">
              <div><strong>{item.country}</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span style={{ color: "var(--gold)" }}>{item.methods.join(", ")}</span>
                <button className="as-btn" onClick={() => onChange(value.filter((row) => row.country !== item.country))} disabled={saving}>
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SupervisorOpeningLinesEditor({
  value,
  onChange,
  saving,
}: {
  value: Array<{ country: string; line: string }>;
  onChange: (value: Array<{ country: string; line: string }>) => void;
  saving: boolean;
}) {
  const [country, setCountry] = useState("NG");
  const [line, setLine] = useState("");

  function addRow() {
    if (!country.trim() || !line.trim()) return;
    const next = value.filter((item) => item.country !== country.trim());
    onChange([...next, { country: country.trim(), line: line.trim() }]);
    setLine("");
  }

  return (
    <div>
      <div className="as-form-row">
        <div>
          <label className="as-label">Country</label>
          <select className="as-select" value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((item) => (
              <option key={item.code} value={item.code}>{item.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="as-label">Opening Line</label>
          <input className="as-input" type="text" value={line} onChange={(e) => setLine(e.target.value)} placeholder="Welcome, let's tailor the experience." />
        </div>
      </div>
      <button className="as-btn" onClick={addRow} disabled={saving || !line.trim()}>
        Save Opening Line
      </button>
      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        {value.length === 0 ? (
          <div className="as-empty">No supervisor opening lines configured</div>
        ) : (
          value.map((item) => (
            <div key={item.country} className="as-mapping-row">
              <div><strong>{item.country}</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "var(--ice)" }}>{item.line}</span>
                <button className="as-btn" onClick={() => onChange(value.filter((row) => row.country !== item.country))} disabled={saving}>
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
