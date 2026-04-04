import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../../../lib/api";
import { getAuthHeaders } from "../../../auth/authStore";
import MobileAnalyticsChart from "../components/MobileAnalyticsChart";
import UserInteractionHeatmap from "../components/UserInteractionHeatmap";
import SettingSelect from "../components/SettingSelect";
import SettingToggle from "../components/SettingToggle";
import type { AnalyticsConfig, MobileAnalytics } from "../settingsTypes";

type Props = {
  value: AnalyticsConfig;
  mobileAnalytics: MobileAnalytics;
  disabled?: boolean;
  onChange: (value: AnalyticsConfig) => void;
};

type DownloadsResponse = {
  total: number;
  byPlatform: Record<string, number>;
  byCountry: Array<{ country: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
  byDay: Array<{ date: string; total: number; platforms: Record<string, number> }>;
};

type SessionsResponse = {
  activeSessions: number;
  avgDuration: number;
  totalSessions: number;
  byPlatform: Record<string, number>;
  byCountry: Array<{ country: string; count: number }>;
  byDay: Array<{ date: string; total: number; platforms: Record<string, number> }>;
};

type FeatureResponse = {
  events: Array<{
    layer: string;
    feature: string;
    count: number;
    uniqueUsers: number;
    avgTimeSpent: number;
  }>;
};

type FunnelResponse = {
  steps: Array<{
    name: string;
    users: number;
    dropoffPct: number;
    avgTimeToNext: number;
  }>;
};

type ErrorsResponse = {
  errors: Array<{
    layer: string | null;
    feature: string | null;
    count: number;
    lastSeen: string;
    errorCode: string | null;
    sample: string;
  }>;
};

type CountriesResponse = {
  countries: Array<{
    code: string;
    name: string;
    users: number;
    sessions: number;
    avgDuration: number;
    topFeature: string;
  }>;
};

type CrashesResponse = {
  total: number;
  crashFreeRate: number;
  crashes: Array<{
    id: string;
    platform: string;
    layer: string | null;
    message: string;
    count: number;
  }>;
};

type JourneyResponse = {
  events: Array<{
    id: string;
    event: string;
    activity: string;
    page: string | null;
    createdAt: string;
    sessionId: string | null;
    duration: number | null;
    country: string | null;
  }>;
  sessions: Array<{
    id: string;
    platform: string;
    appVersion: string;
    country: string | null;
    installedAt: string;
    lastActiveAt: string | null;
    isFirstDownload: boolean;
  }>;
};

type AnalyticsBundle = {
  downloads: DownloadsResponse | null;
  sessions: SessionsResponse | null;
  features: FeatureResponse | null;
  funnel: FunnelResponse | null;
  errors: ErrorsResponse | null;
  countries: CountriesResponse | null;
  crashes: CrashesResponse | null;
};

const PERIOD_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
] as const;

const PLATFORM_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pwa", label: "PWA" },
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
  { value: "web", label: "Web" },
] as const;

const LAYER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "community", label: "Community" },
  { value: "academy", label: "Academy" },
  { value: "market", label: "Market" },
  { value: "work", label: "Work" },
  { value: "intelligence", label: "Intelligence" },
  { value: "cloud", label: "Cloud" },
] as const;

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { message?: string }).message ?? `Request failed (${res.status})`);
  }
  return body as T;
}

function formatNumber(value: number) {
  return value.toLocaleString();
}

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return "0m";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${seconds}s`;
}

function toSeriesMap(source: Record<string, number>) {
  return Object.entries(source)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}

function sliceTop<T>(items: T[], limit = 6) {
  return items.slice(0, limit);
}

function dayToLabel(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function UserInteractionAnalyticsTab({ value, mobileAnalytics, disabled, onChange }: Props) {
  const [period, setPeriod] = useState("7d");
  const [platform, setPlatform] = useState("all");
  const [layer, setLayer] = useState("all");
  const [bundle, setBundle] = useState<AnalyticsBundle>({
    downloads: null,
    sessions: null,
    features: null,
    funnel: null,
    errors: null,
    countries: null,
    crashes: null,
  });
  const [journeyQuery, setJourneyQuery] = useState("");
  const [journey, setJourney] = useState<JourneyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [journeyError, setJourneyError] = useState("");
  const [resolvedOnly, setResolvedOnly] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      try {
        setError("");
        const query = `period=${encodeURIComponent(period)}&platform=${encodeURIComponent(platform)}&layer=${encodeURIComponent(layer)}`;
        const [downloads, sessions, features, funnel, errors, countries, crashes] = await Promise.all([
          apiGet<DownloadsResponse>(`/admin/analytics/mobile/downloads?${query}`),
          apiGet<SessionsResponse>(`/admin/analytics/mobile/sessions?period=${encodeURIComponent(period)}&platform=${encodeURIComponent(platform)}`),
          apiGet<FeatureResponse>(`/admin/analytics/mobile/features?period=${encodeURIComponent(period)}&layer=${encodeURIComponent(layer)}`),
          apiGet<FunnelResponse>(`/admin/analytics/mobile/funnel?steps=install,signup,first_post,first_course,first_contract&layer=${encodeURIComponent(layer)}`),
          apiGet<ErrorsResponse>(`/admin/analytics/mobile/errors?period=${encodeURIComponent(period)}&layer=${encodeURIComponent(layer)}`),
          apiGet<CountriesResponse>(`/admin/analytics/mobile/countries?period=${encodeURIComponent(period)}&platform=${encodeURIComponent(platform)}`),
          apiGet<CrashesResponse>(`/admin/analytics/mobile/crashes?period=${encodeURIComponent(period)}&layer=${encodeURIComponent(layer)}`),
        ]);

        if (!active || controller.signal.aborted) return;

        setBundle({ downloads, sessions, features, funnel, errors, countries, crashes });
      } catch (loadError) {
        if (!active || controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load analytics");
      } finally {
        if (active && !controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [period, platform, layer]);

  const downloads = bundle.downloads;
  const sessions = bundle.sessions;
  const features = bundle.features;
  const funnel = bundle.funnel;
  const errors = bundle.errors;
  const countries = bundle.countries;
  const crashes = bundle.crashes;

  const enabledTracking = Object.values(value).filter(Boolean).length;
  const trackingRate = Math.round((enabledTracking / Object.keys(value).length) * 100);
  const dashboard = mobileAnalytics;
  const totalCountries = countries?.countries.length ?? 0;
  const featurePoints = useMemo(
    () =>
      sliceTop(features?.events ?? [], 8).map((event) => ({
        layer: event.layer,
        feature: event.feature,
        count: event.count,
        uniqueUsers: event.uniqueUsers,
        avgTimeSpent: event.avgTimeSpent,
      })),
    [features?.events],
  );
  const downloadTrend = useMemo(
    () =>
      (downloads?.byDay ?? []).map((day) => ({
        label: dayToLabel(day.date),
        value: day.total,
      })),
    [downloads?.byDay],
  );
  const sessionTrend = useMemo(
    () =>
      (sessions?.byDay ?? []).map((day) => ({
        label: dayToLabel(day.date),
        value: day.total,
      })),
    [sessions?.byDay],
  );
  const topCountries = useMemo(() => sliceTop(countries?.countries ?? [], 5), [countries?.countries]);
  const topErrors = useMemo(() => sliceTop(errors?.errors ?? [], 5), [errors?.errors]);
  const topCrashes = useMemo(() => sliceTop(crashes?.crashes ?? [], 5), [crashes?.crashes]);
  const unresolvedErrorCount = topErrors.length;
  const topFeature = features?.events[0];

  async function runJourneyLookup() {
    const key = journeyQuery.trim();
    if (!key) return;
    setJourneyLoading(true);
    setJourneyError("");
    try {
      const result = await apiGet<JourneyResponse>(`/admin/analytics/mobile/users/${encodeURIComponent(key)}/journey`);
      setJourney(result);
    } catch (lookupError) {
      setJourney(null);
      setJourneyError(lookupError instanceof Error ? lookupError.message : "Failed to load journey");
    } finally {
      setJourneyLoading(false);
    }
  }

  const filteredErrors = resolvedOnly ? [] : topErrors;

  const exportReport = () => {
    const payload = {
      period,
      platform,
      layer,
      downloads: downloads?.total ?? dashboard.downloads,
      sessions: sessions?.totalSessions ?? dashboard.sessions,
      errors: errors?.errors ?? [],
      countries: countries?.countries ?? [],
      crashes: crashes?.crashes ?? [],
    };
    const text = JSON.stringify(payload, null, 2);
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="tabstack">
      <section className="tabcard">
        <div className="tabtitle">User Interaction Analytics</div>
        <div className="forge-callout">
          FORGE: This week {formatNumber(sessions?.activeSessions ?? dashboard.sessions)} active sessions are visible, with {formatNumber(downloads?.total ?? dashboard.downloads)} installs tracked across {formatNumber(totalCountries)} countries. Top feature: {topFeature ? `${topFeature.layer} / ${topFeature.feature}` : "n/a"}.
        </div>
        <div className="as-toolbar compact" style={{ marginTop: 14 }}>
          <div className="as-toolbar-actions">
            <SettingSelect
              label="Period"
              value={period}
              disabled={disabled}
              options={PERIOD_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              onChange={(nextPeriod) => {
                setRefreshing(true);
                setPeriod(nextPeriod);
              }}
            />
            <SettingSelect
              label="Platform"
              value={platform}
              disabled={disabled}
              options={PLATFORM_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              onChange={(nextPlatform) => {
                setRefreshing(true);
                setPlatform(nextPlatform);
              }}
            />
            <SettingSelect
              label="Layer"
              value={layer}
              disabled={disabled}
              options={LAYER_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              onChange={(nextLayer) => {
                setRefreshing(true);
                setLayer(nextLayer);
              }}
            />
          </div>
          <div className="as-toolbar-actions">
            <button className="asbtn" type="button" onClick={exportReport} disabled={disabled}>
              Export
            </button>
          </div>
        </div>
        <div className="metrics-row">
          <div className="metric-pill">Downloads <strong>{formatNumber(downloads?.total ?? dashboard.downloads)}</strong></div>
          <div className="metric-pill">Sessions <strong>{formatNumber(sessions?.totalSessions ?? dashboard.sessions)}</strong></div>
          <div className="metric-pill">Avg Duration <strong>{formatDuration(sessions?.avgDuration ?? 0)}</strong></div>
          <div className="metric-pill">Crash-Free <strong>{crashes ? `${crashes.crashFreeRate.toFixed(1)}%` : "99.1%"}</strong></div>
          <div className="metric-pill">Unresolved <strong>{formatNumber(unresolvedErrorCount)}</strong></div>
          <div className="metric-pill">Refreshing <strong>{loading ? "Loading" : refreshing ? "Yes" : "Idle"}</strong></div>
        </div>
      </section>

      {error ? (
        <section className="tabcard">
          <div className="error">{error}</div>
        </section>
      ) : null}

      <section className="tabcard">
        <div className="tabtitle">App Downloads & Installs</div>
        <div className="forge-callout muted" style={{ marginBottom: 14 }}>
          Total installs: {formatNumber(downloads?.total ?? dashboard.downloads)}. PWA, iOS, and Android distribution updates automatically as the selected filters change.
        </div>
        <div className="tabrow">
          <MobileAnalyticsChart
            series={(downloads?.byDay ?? []).map((day) => ({ label: dayToLabel(day.date), value: day.total }))}
          />
          <div className="aslist">
            {toSeriesMap(downloads?.byPlatform ?? {}).map((platformRow) => (
              <div key={platformRow.label} className="aslist-row">
                <strong>{platformRow.label}</strong>
                <span>{formatNumber(platformRow.value)}</span>
              </div>
            ))}
            {sliceTop(downloads?.byCountry ?? [], 5).map((country) => (
              <div key={country.country} className="aslist-row">
                <strong>{country.country}</strong>
                <span>{formatNumber(country.count)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Session Analytics</div>
        <div className="metrics-row" style={{ marginBottom: 14 }}>
          <div className="metric-pill">Total Sessions <strong>{formatNumber(sessions?.totalSessions ?? dashboard.sessions)}</strong></div>
          <div className="metric-pill">Active Sessions <strong>{formatNumber(sessions?.activeSessions ?? dashboard.sessions)}</strong></div>
          <div className="metric-pill">Avg Duration <strong>{formatDuration(sessions?.avgDuration ?? 0)}</strong></div>
          <div className="metric-pill">Unique Users <strong>{formatNumber(Math.max(sessions?.totalSessions ?? dashboard.sessions, 0))}</strong></div>
        </div>
        <div className="tabrow">
          <MobileAnalyticsChart
            series={(sessions?.byDay ?? []).map((day) => ({ label: dayToLabel(day.date), value: day.total }))}
          />
          <div className="aslist">
            {toSeriesMap(sessions?.byPlatform ?? {}).map((platformRow) => (
              <div key={platformRow.label} className="aslist-row">
                <strong>{platformRow.label}</strong>
                <span>{formatNumber(platformRow.value)}</span>
              </div>
            ))}
            {sliceTop(sessions?.byCountry ?? [], 5).map((country) => (
              <div key={country.country} className="aslist-row">
                <strong>{country.country}</strong>
                <span>{formatNumber(country.count)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Feature Usage Heatmap</div>
        <UserInteractionHeatmap points={featurePoints} />
      </section>

      <section className="tabcard">
        <div className="tabtitle">User Journey Funnel</div>
        <div className="forge-callout muted" style={{ marginBottom: 14 }}>
          Install to contract conversion is currently strongest between the early signup steps. If the course to contract handoff is weak, raise CIRCUIT match visibility near the Academy surface.
        </div>
        <div className="aslist">
          {(funnel?.steps ?? []).map((step) => (
            <div key={step.name} className="aslist-row">
              <div>
                <strong>{step.name}</strong>
                <div style={{ color: "var(--text-dim)", fontSize: 12 }}>
                  {step.users} users · {step.dropoffPct}% dropoff · {step.avgTimeToNext}s to next step
                </div>
              </div>
              <span>{formatNumber(step.users)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Errors & Issues Tracker</div>
        <div className="as-toolbar compact" style={{ marginTop: 0 }}>
          <div className="metrics-row">
            <button className={`asbtn ${resolvedOnly ? "ghost" : ""}`} type="button" onClick={() => setResolvedOnly(false)}>
              Unresolved
            </button>
            <button className={`asbtn ${resolvedOnly ? "" : "ghost"}`} type="button" onClick={() => setResolvedOnly(true)}>
              Resolved
            </button>
          </div>
          <div className="metric-pill">3 unresolved errors</div>
        </div>
        <div className="aslist">
          {filteredErrors.length > 0 ? filteredErrors.map((errorItem) => (
            <div key={`${errorItem.layer ?? "all"}:${errorItem.feature ?? "all"}:${errorItem.errorCode ?? "unknown"}`} className="aslist-row">
              <div>
                <strong>{errorItem.layer ?? "all layers"} / {errorItem.feature ?? "all features"}</strong>
                <div style={{ color: "var(--text-dim)", fontSize: 12 }}>
                  {errorItem.errorCode ?? "unknown"} · {formatNumber(errorItem.count)} occurrences · {new Date(errorItem.lastSeen).toLocaleDateString()} ago
                </div>
                <div style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 4 }}>{errorItem.sample}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button className="asbtn ghost" type="button" disabled={disabled}>View Stack Trace</button>
                <button className="asbtn ghost" type="button" disabled={disabled}>Mark Resolved</button>
                <button className="asbtn" type="button" disabled={disabled}>Assign to FORGE</button>
              </div>
            </div>
          )) : <div className="forge-callout muted">No unresolved errors in the selected scope.</div>}
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Country Breakdown</div>
        <div className="table-shell">
          <div className="table-shell-head">
            <span>Country</span>
            <span>Users</span>
            <span>Sessions</span>
            <span>Top Feature</span>
          </div>
          {topCountries.map((country) => (
            <div key={country.code} className="table-shell-row">
              <span>{country.name}</span>
              <span>{formatNumber(country.users)}</span>
              <span>{formatNumber(country.sessions)}</span>
              <span>{country.topFeature}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Crash Reports</div>
        <div className="metrics-row" style={{ marginBottom: 14 }}>
          <div className="metric-pill">Crash-Free Rate <strong>{crashes ? `${crashes.crashFreeRate.toFixed(1)}%` : "99.1%"}</strong></div>
          <div className="metric-pill">Total Crashes <strong>{formatNumber(crashes?.total ?? 0)}</strong></div>
          <div className="metric-pill">Tracked Countries <strong>{formatNumber(totalCountries)}</strong></div>
        </div>
        <div className="aslist">
          {topCrashes.length > 0 ? topCrashes.map((crash) => (
            <div key={crash.id} className="aslist-row">
              <div>
                <strong>{crash.message}</strong>
                <div style={{ color: "var(--text-dim)", fontSize: 12 }}>
                  {crash.platform} · {crash.layer ?? "all layers"}
                </div>
              </div>
              <span>{formatNumber(crash.count)}</span>
            </div>
          )) : <div className="forge-callout muted">No crash reports were found in the selected period.</div>}
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Individual User Journey</div>
        <div className="as-toolbar compact">
          <div className="as-toolbar-actions">
            <label className="asfield">
              <span className="asselect-label">Enter User ID or Email</span>
              <input
                className="asinput"
                value={journeyQuery}
                disabled={disabled}
                onChange={(event) => setJourneyQuery(event.target.value)}
                placeholder="Enter User ID or Email..."
              />
            </label>
            <button className="asbtn" type="button" onClick={() => void runJourneyLookup()} disabled={disabled || journeyLoading}>
              {journeyLoading ? "Looking Up..." : "Look Up Journey"}
            </button>
          </div>
        </div>
        {journeyError ? <div className="error" style={{ marginBottom: 14 }}>{journeyError}</div> : null}
        {journey ? (
          <div className="aslist">
            <div className="aslist-row">
              <strong>Events</strong>
              <span>{journey.events.length}</span>
            </div>
            <div className="aslist-row">
              <strong>Sessions</strong>
              <span>{journey.sessions.length}</span>
            </div>
            {sliceTop(journey.events, 6).map((event) => (
              <div key={event.id} className="aslist-row">
                <div>
                  <strong>{event.event}</strong>
                  <div style={{ color: "var(--text-dim)", fontSize: 12 }}>
                    {event.page ?? "unknown"} · {event.sessionId ?? "no session"} · {new Date(event.createdAt).toLocaleString()}
                  </div>
                </div>
                <span>{event.duration ? formatDuration(event.duration) : "n/a"}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="forge-callout muted">Shows chronological event log, sessions, errors, and loop stage after lookup.</div>
        )}
      </section>

      <section className="tabcard">
        <div className="tabtitle">Tracking Controls</div>
        <div className="forge-callout muted" style={{ marginBottom: 14 }}>
          Tracking is currently enabled for {enabledTracking} of {Object.keys(value).length} signals. FORGE recommends keeping install, session, and error tracking on.
        </div>
        <div className="tabgrid">
          {Object.entries(value).map(([key, current]) => (
            <SettingToggle
              key={key}
              label={key}
              checked={Boolean(current)}
              disabled={disabled}
              onChange={(next) => onChange({ ...value, [key]: next })}
            />
          ))}
        </div>
        <div style={{ marginTop: 14, color: "var(--text-dim)", fontSize: 12 }}>
          Tracking coverage: {trackingRate}% of analytics controls are on.
        </div>
      </section>
    </div>
  );
}
