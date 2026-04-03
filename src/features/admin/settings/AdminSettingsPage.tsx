import { useCallback, useEffect, useState } from "react";
import ForgeInsightBar from "../../../components/admin/ForgeInsightBar";
import { API_BASE } from "../../../lib/api";
import { getAuthHeaders, useAuthStore } from "../../auth/authStore";
import DisplayThemingTab from "./tabs/DisplayThemingTab";
import LanguageLocalisationTab from "./tabs/LanguageLocalisationTab";
import PersonalisationEngineTab from "./tabs/PersonalisationEngineTab";
import MobileAppBehaviourTab from "./tabs/MobileAppBehaviourTab";
import UserInteractionAnalyticsTab from "./tabs/UserInteractionAnalyticsTab";
import GeoAdaptiveContentTab from "./tabs/GeoAdaptiveContentTab";
import type { AdminSettingsSnapshot } from "./settingsTypes";

const TAB_OPTIONS = [
  { id: "display", label: "Display" },
  { id: "localisation", label: "Language" },
  { id: "personalisation", label: "Personalisation" },
  { id: "mobile", label: "Mobile" },
  { id: "analytics", label: "Analytics" },
  { id: "geo", label: "Geo" },
] as const;

type TabId = (typeof TAB_OPTIONS)[number]["id"];

const css = `
  .as-root{max-width:1280px;margin:0 auto;padding:20px 18px 72px;color:var(--text);font-family:var(--font-body),'Syne',sans-serif}
  .as-header{padding:24px;border:1px solid rgba(201,168,76,.16);border-radius:var(--card-radius,24px);background:linear-gradient(135deg,rgba(12,20,31,.96),rgba(18,29,45,.94));margin:18px 0 14px}
  .as-eyebrow{font-family:var(--font-mono),'Space Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:8px}
  .as-title{margin:0;font-size:34px;letter-spacing:-.04em}
  .as-subtitle{margin:10px 0 0;max-width:860px;color:var(--text-dim);line-height:1.65}
  .as-tabs{display:flex;gap:8px;flex-wrap:wrap;padding:8px;border:1px solid var(--border);border-radius:var(--card-radius,18px);background:rgba(13,24,38,.62)}
  .as-tab{padding:10px 16px;border:0;border-radius:var(--card-radius,12px);background:transparent;color:var(--text-dim);font-family:var(--font-mono),'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
  .as-tab.active{background:rgba(201,168,76,.16);color:var(--gold)}
  .as-toolbar{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;margin:14px 0 18px}
  .as-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:var(--card-radius,999px);border:1px solid rgba(201,168,76,.18);background:rgba(201,168,76,.08);font-family:var(--font-mono),'Space Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--gold)}
  .tabgrid,.tabstack{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
  .tabstack{grid-template-columns:1fr}
  .tabcard{padding:18px;border-radius:var(--card-radius,20px);border:1px solid var(--border);background:rgba(13,24,38,.62)}
  .tabtitle{margin-bottom:14px;font-family:var(--font-mono),'Space Mono',monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
  .tabtitle.small{margin-top:18px;font-size:10px;color:var(--text-dim)}
  .forge-callout{padding:16px 18px;border:1px solid rgba(201,168,76,.18);border-radius:var(--card-radius,16px);background:rgba(201,168,76,.06);color:var(--text);line-height:1.6}
  .metrics-row{display:flex;flex-wrap:wrap;gap:10px}
  .metric-pill{padding:10px 12px;border:1px solid var(--border);border-radius:var(--card-radius,999px);background:rgba(13,24,38,.48);font-family:var(--font-mono),'Space Mono',monospace;font-size:10px;color:var(--text-dim)}
  .metric-pill strong{color:var(--gold)}
  .tabrow{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .asfield{display:flex;flex-direction:column;gap:8px;font-size:13px}
  .asfield.inline{flex-direction:row;align-items:center}
  .asfield input,.asfield select,.asinput,.asselect-input,.asselect select{width:100%;padding:12px 13px;border-radius:var(--card-radius,14px);border:1px solid var(--border);background:rgba(13,24,38,.88);color:var(--text)}
  .asbtn{padding:10px 15px;border-radius:var(--card-radius,999px);border:1px solid rgba(201,168,76,.24);background:rgba(201,168,76,.08);color:var(--gold);font-family:var(--font-mono),'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
  .asbtn.ghost{background:transparent}
  .asbtn:disabled{opacity:.5;cursor:not-allowed}
  .aslist{display:grid;gap:8px;margin-top:12px}
  .aslist-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 14px;border-radius:var(--card-radius,14px);background:rgba(13,24,38,.48);border:1px solid rgba(255,255,255,.04)}
  .asbuilder{display:grid;gap:12px}
  .asbuilder-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .asbuilder-grid .full{grid-column:1 / -1}
  .ascharts{display:grid;gap:12px}
  .ascharts-row{display:grid;grid-template-columns:120px 1fr 52px;gap:12px;align-items:center;font-size:12px}
  .ascharts-track{height:10px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden}
  .ascharts-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--gold),var(--ice))}
  .asheatmap{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}
  .asheatmap-cell{padding:12px;border-radius:14px;border:1px solid rgba(201,168,76,.16);background:rgba(201,168,76,.08);display:flex;justify-content:space-between;gap:10px}
  .astoggle{display:flex;justify-content:space-between;gap:12px;width:100%;padding:14px;border-radius:var(--card-radius,16px);border:1px solid var(--border);background:rgba(13,24,38,.48);text-align:left;color:var(--text);cursor:pointer}
  .astoggle.is-on{border-color:rgba(201,168,76,.24);background:rgba(201,168,76,.08)}
  .astoggle-copy{display:flex;flex-direction:column;gap:4px}
  .astoggle-copy span,.astoggle-copy small{color:var(--text-dim)}
  .astoggle-pill{display:inline-flex;align-items:center;padding:4px 9px;border-radius:var(--card-radius,999px);background:rgba(255,255,255,.08);font-family:var(--font-mono),'Space Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.06em}
  .forge-callout{padding:16px 18px;border:1px solid rgba(201,168,76,.18);border-radius:var(--card-radius,16px);background:rgba(201,168,76,.06);color:var(--text);line-height:1.6}
  .forge-callout.muted{background:rgba(13,24,38,.48);border-color:var(--border);color:var(--text-dim)}
  .as-toolbar.compact{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap}
  .as-toolbar-actions{display:flex;gap:8px;flex-wrap:wrap}
  .table-shell{border:1px solid var(--border);border-radius:var(--card-radius,18px);overflow:hidden;background:rgba(13,24,38,.48);margin-bottom:14px}
  .table-shell-head,.table-shell-row{display:grid;grid-template-columns:1.2fr 1fr 1fr 1.6fr;gap:12px;align-items:center;padding:12px 14px}
  .table-shell-head{font-family:var(--font-mono),'Space Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);background:rgba(8,14,26,.5);border-bottom:1px solid var(--border)}
  .table-shell-row{border-bottom:1px solid rgba(255,255,255,.04)}
  .table-shell-row:last-child{border-bottom:none}
  .loading, .error{padding:20px;border-radius:16px;border:1px solid var(--border);background:rgba(13,24,38,.6)}
  .error{border-color:rgba(224,90,78,.24);color:#ffbbb4}
  @media (max-width:900px){.tabgrid,.tabrow,.asbuilder-grid{grid-template-columns:1fr}.ascharts-row{grid-template-columns:1fr}}
`;

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message ?? `Request failed (${res.status})`);
  return body as T;
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
  const token = useAuthStore((state) => state.token);
  const [tab, setTab] = useState<TabId>("display");
  const [snapshot, setSnapshot] = useState<AdminSettingsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSynced, setLastSynced] = useState("");

  const loadSnapshot = useCallback(async () => {
    try {
      const data = await apiGet<AdminSettingsSnapshot>("/admin/settings/snapshot");
      setSnapshot(data);
      setLastSynced(data.lastSyncedAt);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings snapshot");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSection = useCallback(async (path: string, body: unknown) => {
    setSaving(true);
    try {
      await apiPut(path, body);
      await loadSnapshot();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [loadSnapshot]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadSnapshot();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [loadSnapshot]);

  useEffect(() => {
    if (!token) return;

    const stream = new EventSource(`${API_BASE}/admin/settings/stream?token=${encodeURIComponent(token)}`);
    stream.addEventListener("update", () => {
      void loadSnapshot();
    });
    stream.onerror = () => {
      // Browser-managed reconnects keep the settings live if the stream drops.
    };

    return () => {
      stream.close();
    };
  }, [token, loadSnapshot]);

  const theme = snapshot?.theme;
  const localisation = snapshot?.localization;
  const personalisation = snapshot?.personalisation;
  const mobile = snapshot?.mobile;
  const analytics = snapshot?.analytics;
  const geo = snapshot?.geo;

  if (loading && !snapshot) {
    return <div className="as-root"><style>{css}</style><div className="loading">Loading ecosystem settings...</div></div>;
  }

  if (!snapshot || !theme || !localisation || !personalisation || !mobile || !analytics || !geo) {
    return <div className="as-root"><style>{css}</style><div className="error">Settings snapshot is unavailable.</div></div>;
  }

  return (
    <div className="as-root">
      <style>{css}</style>
      <ForgeInsightBar />

      <div className="as-header">
        <div className="as-eyebrow">Ecosystem Controller / Settings</div>
        <h1 className="as-title">Auto-Update Settings System</h1>
        <p className="as-subtitle">
          Live config sync for display, language, personalisation, mobile behavior, analytics, and geo-adaptive content.
          The page polls the server snapshot every 30 seconds, so the ecosystem stays in sync without a manual reload.
        </p>
      </div>

      <div className="as-toolbar">
        <div className="as-tabs">
          {TAB_OPTIONS.map((item) => (
            <button key={item.id} className={`as-tab ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="as-badge">Last sync: {lastSynced ? new Date(lastSynced).toLocaleTimeString() : "pending"}</div>
      </div>

      {error ? <div className="error">{error}</div> : null}

      {tab === "display" ? (
        <DisplayThemingTab
          value={theme}
          disabled={saving}
          onChange={(next) => {
            setSnapshot({ ...snapshot, theme: next });
            void saveSection("/admin/settings/theme", next);
          }}
        />
      ) : null}

      {tab === "localisation" ? (
        <LanguageLocalisationTab
          value={localisation}
          languageRoutes={snapshot.languageRoutes}
          translationOverrides={snapshot.translationOverrides}
          countryRules={snapshot.countryRules}
          disabled={saving}
          onChange={(next) => {
            setSnapshot({ ...snapshot, localization: next });
            void saveSection("/admin/settings/localization", next);
          }}
          onLanguageRoutesChange={(routes) => {
            setSnapshot({ ...snapshot, languageRoutes: routes });
            void saveSection("/admin/settings/language/routes", routes);
          }}
          onTranslationOverridesChange={(translationOverrides) => {
            setSnapshot({ ...snapshot, translationOverrides });
            void saveSection("/admin/settings/translations", translationOverrides);
          }}
          onCountryRulesChange={(rules) => {
            setSnapshot({ ...snapshot, countryRules: rules });
            void saveSection("/admin/settings/country-rules", rules);
          }}
        />
      ) : null}

      {tab === "personalisation" ? (
        <PersonalisationEngineTab
          value={personalisation}
          disabled={saving}
          onChange={(next) => {
            setSnapshot({ ...snapshot, personalisation: next });
            void saveSection("/admin/settings/personalisation", next);
          }}
        />
      ) : null}

      {tab === "mobile" ? (
        <MobileAppBehaviourTab
          value={mobile}
          analytics={snapshot.mobileAnalytics}
          disabled={saving}
          onChange={(next) => {
            setSnapshot({ ...snapshot, mobile: next });
            void saveSection("/admin/settings/mobile", next);
          }}
        />
      ) : null}

      {tab === "analytics" ? (
        <UserInteractionAnalyticsTab
          value={analytics}
          mobileAnalytics={snapshot.mobileAnalytics}
          disabled={saving}
          onChange={(next) => {
            setSnapshot({ ...snapshot, analytics: next });
            void saveSection("/admin/settings/analytics", next);
          }}
        />
      ) : null}

      {tab === "geo" ? (
        <GeoAdaptiveContentTab
          value={geo}
          languageRoutes={snapshot.languageRoutes}
          disabled={saving}
          onChange={(next) => {
            setSnapshot({ ...snapshot, geo: next });
            void saveSection("/admin/settings/geo", next);
          }}
        />
      ) : null}
    </div>
  );
}
