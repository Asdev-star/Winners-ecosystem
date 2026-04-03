import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../lib/api";
import { getAuthHeaders } from "./auth/authStore";

type EcosystemSettings = {
  language: string;
  defaultCurrency: string;
  defaultTimezone: string;
  brandColor: string;
  accentColor: string;
  darkMode: boolean;
  adaptiveLanguage: boolean;
  mobileAppVersion: string;
  pushNotifications: boolean;
  analyticsTracking: boolean;
  publicRegistration: boolean;
  requireEmailVerification: boolean;
  defaultTheme: string;
  countryLanguageMapping: Array<{ country: string; language: string }>;
  mobileBehaviors: {
    offlineMode: boolean;
    biometricLogin: boolean;
    pushNotifications: boolean;
    autoUpdate: boolean;
    analyticsTracking: boolean;
    crashReporting: boolean;
  };
  personalization: {
    recommendedContent: boolean;
    learningPath: boolean;
    notifications: boolean;
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
    font-family: 'Syne', sans-serif;
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
    border-radius: 20px;
    border: 1px solid rgba(201, 168, 76, 0.18);
    background: linear-gradient(135deg, rgba(13, 24, 38, 0.94), rgba(17, 29, 46, 0.92));
  }
  .as-eyebrow {
    font-family: 'Space Mono', monospace;
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
    border-radius: 16px;
    background: rgba(13, 24, 38, 0.62);
    border: 1px solid var(--border);
  }
  .as-tab {
    padding: 10px 18px;
    border-radius: 12px;
    border: none;
    background: transparent;
    color: var(--text-dim);
    font-family: 'Space Mono', monospace;
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
    border-radius: 20px;
    background: rgba(13, 24, 38, 0.62);
  }
  .as-section-title {
    margin: 0 0 14px;
    font-family: 'Space Mono', monospace;
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
    border-radius: 18px;
    border: 1px solid var(--border);
    background: var(--surface);
  }
  .as-card.full {
    grid-column: 1 / -1;
  }
  .as-kpi-label {
    font-family: 'Space Mono', monospace;
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
    try {
      const data = await apiGet<EcosystemSettings>("/admin/settings");
      setSettings(data);
      setFormData(data as Partial<EcosystemSettings>);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
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

  return (
    <div className="as-root">
      <style>{css}</style>

      <div className="as-header">
        <div>
          <div className="as-eyebrow">Ecosystem Controller / Settings</div>
          <h1 className="as-title">Ecosystem Settings</h1>
          <p className="as-subtitle">
            Control all ecosystem behaviors including language, color display, personalization, mobile app behaviors, and analyze user interactions.
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
          </div>

          <div className="as-section">
            <h2 className="as-section-title">Current App Version</h2>
            <div className="as-form-row">
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
          </div>
        </>
      )}

      {tab === "analytics" && (
        <>
          <div className="as-section">
            <h2 className="as-section-title">App Analytics</h2>
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