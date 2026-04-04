import { useEffect, useMemo, useState } from "react";
import MobileAnalyticsChart from "../components/MobileAnalyticsChart";
import UserInteractionHeatmap from "../components/UserInteractionHeatmap";
import SettingSelect from "../components/SettingSelect";
import SettingToggle from "../components/SettingToggle";
import { API_BASE } from "../../../../lib/api";
import { getAuthHeaders } from "../../../auth/authStore";
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
};

type SessionsResponse = {
  activeSessions: number;
  avgDuration: number;
  totalSessions: number;
  byPlatform: Record<string, number>;
  byCountry: Array<{ country: string; count: number }>;
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

type DashboardResponse = MobileAnalytics;

type AnalyticsBundle = {
  dashboard: DashboardResponse | null;
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
  if (seconds <= 0) return "0m";
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

export default function UserInteractionAnalyticsTab({ value, mobileAnalytics, disabled, onChange }: Props) {
  const [period, setPeriod] = useState("30d");
  const [bundle, setBundle] = useState<AnalyticsBundle>({
    dashboard: null,
    downloads: null,
    sessions: null,
    features: null,
    funnel: null,
    errors: null,
    countries: null,
    crashes: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function load() {
      try {
        setError("");
        const [dashboard, downloads, sessions, features, funnel, errors, countries, crashes] = await Promise.all([
          apiGet<DashboardResponse>("/admin/analytics/mobile/dashboard"),
          apiGet<DownloadsResponse>(`/admin/analytics/mobile/downloads?period=${period}`),
          apiGet<SessionsResponse>(`/admin/analytics/mobile/sessions?period=${period}&platform=all`),
          apiGet<FeatureResponse>(`/admin/analytics/mobile/features?period=${period}`),
          apiGet<FunnelResponse>("/admin/analytics/mobile/funnel?steps=install,signup,first_post,first_course,first_contract"),
          apiGet<ErrorsResponse>(`/admin/analytics/mobile/errors?period=${period}`),
          apiGet<CountriesResponse>("/admin/analytics/mobile/countries"),
          apiGet<CrashesResponse>(`/admin/analytics/mobile/crashes?period=${period}`),
        ]);

        if (!mounted || controller.signal.aborted) return;

        setBundle({
          dashboard,
          downloads,
          sessions,
          features,
          funnel,
          errors,
          countries,
          crashes,
        });
      } catch (loadError) {
        if (!mounted || controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load analytics");
      } finally {
        if (mounted && !controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [period]);

  const downloadSeries = useMemo(
    () => toSeriesMap(bundle.downloads?.byPlatform ?? {}),
    [bundle.downloads?.byPlatform],
  );
  const sessionSeries = useMemo(
    () => toSeriesMap(bundle.sessions?.byPlatform ?? {}),
    [bundle.sessions?.byPlatform],
  );
  const featurePoints = useMemo(
    () =>
      sliceTop(bundle.features?.events ?? [], 10).map((event) => ({
        layer: event.layer,
        feature: event.feature,
        count: event.count,
        uniqueUsers: event.uniqueUsers,
        avgTimeSpent: event.avgTimeSpent,
      })),
    [bundle.features?.events],
  );
  const topCountries = useMemo(
    () => sliceTop(bundle.countries?.countries ?? [], 8),
    [bundle.countries?.countries],
  );
  const topErrors = useMemo(
    () => sliceTop(bundle.errors?.errors ?? [], 6),
    [bundle.errors?.errors],
  );
  const topCrashes = useMemo(
    () => sliceTop(bundle.crashes?.crashes ?? [], 6),
    [bundle.crashes?.crashes],
  );

  const enabledTracking = Object.values(value).filter(Boolean).length;
  const trackingRate = Math.round((enabledTracking / Object.keys(value).length) * 100);
  const dashboard = bundle.dashboard ?? mobileAnalytics;
  const totalCountries = bundle.countries?.countries.length ?? 0;

  return (
    <div className="tabstack">
      <section className="tabcard">
        <div className="tabtitle">Tracking Controls</div>
        <div className="forge-callout muted" style={{ marginBottom: 14 }}>
          Tracking is currently enabled for {enabledTracking} of {Object.keys(value).length} signals. FORGE recommends keeping core mobile telemetry active so install, session, and crash patterns remain visible.
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

      <section className="tabcard">
        <div className="tabtitle">Dashboard Overview</div>
        <div className="as-toolbar compact">
          <div className="forge-callout" style={{ flex: 1 }}>
            HERALD: {dashboard.downloads} installs, {dashboard.sessions} sessions, and {dashboard.errorReports} error reports are in the current admin snapshot. The mobile endpoints below break that down by platform, country, feature, and crash signal.
          </div>
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
          </div>
        </div>

        <div className="metrics-row">
          <div className="metric-pill">Downloads <strong>{formatNumber(bundle.downloads?.total ?? dashboard.downloads)}</strong></div>
          <div className="metric-pill">Active Sessions <strong>{formatNumber(bundle.sessions?.activeSessions ?? dashboard.sessions)}</strong></div>
          <div className="metric-pill">Avg Duration <strong>{formatDuration(bundle.sessions?.avgDuration ?? 0)}</strong></div>
          <div className="metric-pill">Crash Free Rate <strong>{bundle.crashes ? `${bundle.crashes.crashFreeRate.toFixed(1)}%` : "99.1%"}</strong></div>
          <div className="metric-pill">Countries <strong>{formatNumber(totalCountries)}</strong></div>
          <div className="metric-pill">Refreshing <strong>{loading ? "Loading" : refreshing ? "Yes" : "Idle"}</strong></div>
        </div>
      </section>

      {error ? (
        <section className="tabcard">
          <div className="error">{error}</div>
        </section>
      ) : null}

      <section className="tabcard">
        <div className="tabtitle">App Downloads</div>
        <div className="tabrow">
          <MobileAnalyticsChart series={downloadSeries.length > 0 ? downloadSeries : [{ label: "PWA", value: bundle.downloads?.total ?? dashboard.downloads }]} />
          <div className="aslist">
            {sliceTop(bundle.downloads?.byCountry ?? [], 5).map((country) => (
              <div key={country.country} className="aslist-row">
                <strong>{country.country}</strong>
                <span>{formatNumber(country.count)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Sessions</div>
        <div className="tabrow">
          <MobileAnalyticsChart series={sessionSeries.length > 0 ? sessionSeries : [{ label: "Sessions", value: dashboard.sessions }]} />
          <div className="aslist">
            <div className="aslist-row">
              <strong>Total Sessions</strong>
              <span>{formatNumber(bundle.sessions?.totalSessions ?? dashboard.sessions)}</span>
            </div>
            <div className="aslist-row">
              <strong>Average Duration</strong>
              <span>{formatDuration(bundle.sessions?.avgDuration ?? 0)}</span>
            </div>
            {sliceTop(bundle.sessions?.byCountry ?? [], 4).map((country) => (
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
        <div className="aslist">
          {(bundle.funnel?.steps ?? []).map((step) => (
            <div key={step.name} className="aslist-row">
              <div>
                <strong>{step.name}</strong>
                <div style={{ color: "var(--text-dim)", fontSize: 12 }}>
                  {step.dropoffPct}% dropoff · {step.avgTimeToNext}s to next step
                </div>
              </div>
              <span>{formatNumber(step.users)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Error Reports</div>
        <div className="aslist">
          {topErrors.length > 0 ? topErrors.map((errorItem) => (
            <div key={`${errorItem.layer ?? "all"}:${errorItem.feature ?? "all"}:${errorItem.errorCode ?? "unknown"}`} className="aslist-row">
              <div>
                <strong>{errorItem.errorCode ?? "unknown"}</strong>
                <div style={{ color: "var(--text-dim)", fontSize: 12 }}>
                  {errorItem.layer ?? "all layers"} · {errorItem.feature ?? "all features"}
                </div>
                <div style={{ color: "var(--text-dim)", fontSize: 12 }}>{errorItem.sample}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>{formatNumber(errorItem.count)}</strong>
                <div style={{ color: "var(--text-dim)", fontSize: 12 }}>{new Date(errorItem.lastSeen).toLocaleString()}</div>
              </div>
            </div>
          )) : <div className="forge-callout muted">No recent error reports were found for the selected period.</div>}
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
          {(topCountries.length > 0 ? topCountries : []).map((country) => (
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
          <div className="metric-pill">Crash-Free Rate <strong>{bundle.crashes ? `${bundle.crashes.crashFreeRate.toFixed(1)}%` : "99.1%"}</strong></div>
          <div className="metric-pill">Total Crashes <strong>{formatNumber(bundle.crashes?.total ?? 0)}</strong></div>
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
    </div>
  );
}
