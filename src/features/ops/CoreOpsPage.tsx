// src/features/ops/CoreOpsPage.tsx
// Phase 1 - Core Engine
// Service health and infrastructure visibility dashboard.

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";

type ServiceState = "ok" | "degraded" | "down";
type AppRegistryStatus = "live" | "in_progress" | "planned" | "deprecated";

interface ServiceCheck {
  status: ServiceState;
  latency?: number;
  message?: string;
}

interface HealthReadyResponse {
  status: ServiceState;
  version: string;
  env: string;
  timestamp: string;
  uptime: number;
  services: Record<string, ServiceCheck>;
  totalLatency?: number;
}

interface RegistryApp {
  id: string;
  name: string;
  status: AppRegistryStatus;
  phase: string;
  version?: string;
}

interface RegistryResponse {
  totalApps: number;
  liveApps: number;
  progress?: number;
  generatedAt?: string;
  apps: RegistryApp[];
}

interface GatewayResponse {
  name: string;
  gateway: string;
  version: string;
  timestamp: string;
  routeCount: number;
  routes: string[];
}

interface DbHealthResponse {
  status: ServiceState;
  latency: number;
  timestamp: string;
  stats?: {
    tenants: number;
    users: number;
    posts: number;
  };
}

const css = `
  .ops-page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 24px 20px 72px;
    font-family: 'Syne', sans-serif;
    color: var(--text, var(--text));
  }

  .ops-context {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 18px;
    flex-wrap: wrap;
  }
  .ops-context-chip {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border: 1px solid var(--border, var(--border));
    border-radius: 999px;
    padding: 4px 10px;
    color: var(--text-dim, var(--text-dim));
    background: rgba(17, 29, 46, 0.75);
  }
  .ops-context-chip.active {
    color: var(--gold, var(--gold));
    border-color: rgba(201, 168, 76, 0.35);
    background: rgba(201, 168, 76, 0.08);
  }
  .ops-context-sep {
    color: var(--text-dim, var(--text-dim));
    font-family: 'Space Mono', monospace;
    font-size: 10px;
  }

  .ops-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
    flex-wrap: wrap;
  }
  .ops-title {
    margin: 0;
    font-size: 30px;
    letter-spacing: -0.8px;
    font-weight: 800;
  }
  .ops-sub {
    margin-top: 6px;
    color: var(--text-dim, var(--text-dim));
    font-size: 13px;
    line-height: 1.5;
  }
  .ops-refresh {
    border: 1px solid var(--border, var(--border));
    background: var(--surface2, var(--surface2));
    color: var(--text, var(--text));
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-radius: 6px;
    padding: 8px 12px;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .ops-refresh:hover { border-color: var(--gold, var(--gold)); }
  .ops-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

  .ops-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 14px;
  }
  .ops-card {
    position: relative;
    background: var(--surface, var(--surface));
    border: 1px solid var(--border, var(--border));
    border-radius: 6px;
    padding: 14px 16px;
    overflow: hidden;
  }
  .ops-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--gold, var(--gold)), transparent);
  }
  .ops-kpi-label {
    font-family: 'Space Mono', monospace;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-dim, var(--text-dim));
    margin-bottom: 8px;
  }
  .ops-kpi-value {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.8px;
    color: var(--gold, var(--gold));
    line-height: 1;
  }
  .ops-kpi-sub {
    margin-top: 6px;
    font-family: 'Space Mono', monospace;
    color: var(--text-dim, var(--text-dim));
    font-size: 9px;
  }

  .ops-panels {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 14px;
  }
  .ops-panel {
    position: relative;
    background: var(--surface, var(--surface));
    border: 1px solid var(--border, var(--border));
    border-radius: 6px;
    padding: 16px;
    overflow: hidden;
  }
  .ops-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--ice, var(--ice)), transparent);
  }
  .ops-panel-title {
    margin: 0 0 12px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--ice, var(--ice));
  }

  .ops-service-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid var(--border, var(--border));
    padding: 10px 0;
  }
  .ops-service-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .ops-service-left {
    min-width: 0;
  }
  .ops-service-name {
    font-size: 12px;
    font-weight: 700;
    text-transform: capitalize;
  }
  .ops-service-meta {
    margin-top: 2px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: var(--text-dim, var(--text-dim));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ops-pill {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid;
    flex-shrink: 0;
  }
  .ops-pill.ok {
    color: var(--green, var(--green));
    border-color: rgba(45, 212, 160, 0.3);
    background: rgba(45, 212, 160, 0.08);
  }
  .ops-pill.degraded {
    color: var(--gold, var(--gold));
    border-color: rgba(201, 168, 76, 0.3);
    background: rgba(201, 168, 76, 0.08);
  }
  .ops-pill.down {
    color: var(--red, var(--red));
    border-color: rgba(224, 90, 78, 0.3);
    background: rgba(224, 90, 78, 0.08);
  }
  .ops-pill.planned {
    color: var(--text-dim, var(--text-dim));
    border-color: var(--border, var(--border));
    background: rgba(90, 122, 150, 0.08);
  }

  .ops-registry-row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid var(--border, var(--border));
    padding: 9px 0;
  }
  .ops-registry-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .ops-registry-name {
    font-size: 12px;
    font-weight: 700;
  }
  .ops-registry-meta {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: var(--text-dim, var(--text-dim));
    margin-top: 2px;
  }

  .ops-error {
    margin-bottom: 12px;
    border: 1px solid rgba(224, 90, 78, 0.3);
    background: rgba(224, 90, 78, 0.08);
    color: var(--red, var(--red));
    border-radius: 6px;
    padding: 10px 12px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
  }

  @media (max-width: 980px) {
    .ops-grid { grid-template-columns: 1fr 1fr; }
    .ops-panels { grid-template-columns: 1fr; }
  }
  @media (max-width: 580px) {
    .ops-grid { grid-template-columns: 1fr; }
  }
`;

function statusClass(value: string): string {
  if (value === "ok" || value === "live") return "ok";
  if (value === "degraded" || value === "in_progress") return "degraded";
  if (value === "down" || value === "deprecated") return "down";
  return "planned";
}

function statusLabel(value: string): string {
  return value.replace(/_/g, " ");
}

export default function CoreOpsPage() {
  const [health, setHealth] = useState<HealthReadyResponse | null>(null);
  const [registry, setRegistry] = useState<RegistryResponse | null>(null);
  const [dbHealth, setDbHealth] = useState<DbHealthResponse | null>(null);
  const [gateway, setGateway] = useState<GatewayResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [healthRes, regRes, dbRes, gatewayRes] = await Promise.all([
        fetch(`${API_BASE}/health/ready`, { headers }),
        fetch(`${API_BASE}/registry`, { headers }),
        fetch(`${API_BASE}/health/db`, { headers }),
        fetch(API_BASE, { headers }),
      ]);

      const [healthBody, regBody, dbBody, gatewayBody] = await Promise.all([
        healthRes.json().catch(() => ({})),
        regRes.json().catch(() => ({})),
        dbRes.json().catch(() => ({})),
        gatewayRes.json().catch(() => ({})),
      ]);

      const failures: string[] = [];
      let successfulResponses = 0;

      if (healthRes.ok) {
        setHealth(healthBody as HealthReadyResponse);
        successfulResponses += 1;
      } else {
        const healthError = healthBody && typeof healthBody === "object" && "error" in healthBody
          ? String((healthBody as { error?: string }).error ?? `status ${healthRes.status}`)
          : `status ${healthRes.status}`;
        failures.push(`health/ready: ${healthError}`);
      }

      if (regRes.ok) {
        setRegistry(regBody as RegistryResponse);
        successfulResponses += 1;
      } else {
        const registryError = regBody && typeof regBody === "object" && "error" in regBody
          ? String((regBody as { error?: string }).error ?? `status ${regRes.status}`)
          : `status ${regRes.status}`;
        failures.push(`registry: ${registryError}`);
      }

      if (dbRes.ok) {
        setDbHealth(dbBody as DbHealthResponse);
        successfulResponses += 1;
      } else {
        const dbError = dbBody && typeof dbBody === "object" && "error" in dbBody
          ? String((dbBody as { error?: string }).error ?? `status ${dbRes.status}`)
          : `status ${dbRes.status}`;
        failures.push(`health/db: ${dbError}`);
      }

      if (gatewayRes.ok) {
        setGateway(gatewayBody as GatewayResponse);
        successfulResponses += 1;
      } else {
        failures.push(`gateway: status ${gatewayRes.status}`);
      }

      if (successfulResponses > 0) {
        setLastUpdated(new Date().toISOString());
      }

      if (failures.length === 0) {
        setError("");
      } else if (successfulResponses === 0) {
        setError(`Core Ops endpoints are unavailable: ${failures.join(" | ")}`);
      } else {
        setError(`Partial outage detected: ${failures.join(" | ")}`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load Core Ops data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchAll();
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchAll]);

  const serviceRows = useMemo(() => {
    if (!health) return [];
    return Object.entries(health.services);
  }, [health]);

  const healthyServices = serviceRows.filter(([, value]) => value.status === "ok").length;
  const registryLive = registry?.liveApps ?? 0;
  const registryTotal = registry?.totalApps ?? 0;

  return (
    <div className="ops-page">
      <style>{css}</style>

      <div className="ops-context">
        <span className="ops-context-chip active">Core Engine</span>
        <span className="ops-context-sep">/</span>
        <span className="ops-context-chip">Community</span>
        <span className="ops-context-sep">/</span>
        <span className="ops-context-chip">Academy</span>
      </div>

      <div className="ops-head">
        <div>
          <h1 className="ops-title">Core Ops Dashboard</h1>
          <div className="ops-sub">
            Live visibility into API readiness, infrastructure services, and ecosystem registry state.
          </div>
          <div className="ops-sub" style={{ marginTop: 4, fontFamily: "'Space Mono', monospace", fontSize: 10 }}>
            Gateway {gateway?.gateway?.toUpperCase() ?? "V1"} | Version {gateway?.version ?? "--"} | Routes{" "}
            {gateway?.routeCount ?? "--"} | Last update{" "}
            {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "--"}
          </div>
        </div>
        <button className="ops-refresh" onClick={() => void fetchAll()} disabled={loading}>
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {error && <div className="ops-error">{error}</div>}

      <div className="ops-grid">
        <div className="ops-card">
          <div className="ops-kpi-label">API Status</div>
          <div className="ops-kpi-value">{health?.status?.toUpperCase() ?? "--"}</div>
          <div className="ops-kpi-sub">Readiness: /health/ready</div>
        </div>
        <div className="ops-card">
          <div className="ops-kpi-label">Service Checks</div>
          <div className="ops-kpi-value">{serviceRows.length > 0 ? `${healthyServices}/${serviceRows.length}` : "--"}</div>
          <div className="ops-kpi-sub">Healthy services</div>
        </div>
        <div className="ops-card">
          <div className="ops-kpi-label">Registry Live</div>
          <div className="ops-kpi-value">{registryTotal > 0 ? `${registryLive}/${registryTotal}` : "--"}</div>
          <div className="ops-kpi-sub">Live ecosystem modules</div>
        </div>
        <div className="ops-card">
          <div className="ops-kpi-label">DB Latency</div>
          <div className="ops-kpi-value">{dbHealth?.latency !== undefined ? `${dbHealth.latency}ms` : "--"}</div>
          <div className="ops-kpi-sub">/health/db check latency</div>
        </div>
      </div>

      <div className="ops-panels">
        <section className="ops-panel">
          <h2 className="ops-panel-title">Services</h2>
          {serviceRows.length === 0 ? (
            <div className="ops-service-meta">No service report loaded.</div>
          ) : (
            serviceRows.map(([name, service]) => (
              <div key={name} className="ops-service-row">
                <div className="ops-service-left">
                  <div className="ops-service-name">{name}</div>
                  <div className="ops-service-meta">
                    {service.message ?? "No message"}
                    {service.latency !== undefined ? ` | ${service.latency}ms` : ""}
                  </div>
                </div>
                <span className={`ops-pill ${statusClass(service.status)}`}>{service.status}</span>
              </div>
            ))
          )}
        </section>

        <section className="ops-panel">
          <h2 className="ops-panel-title">App Registry</h2>
          {!registry?.apps?.length ? (
            <div className="ops-service-meta">No registry data loaded.</div>
          ) : (
            registry.apps.map((app) => (
              <div key={app.id} className="ops-registry-row">
                <div>
                  <div className="ops-registry-name">{app.name}</div>
                  <div className="ops-registry-meta">
                    {app.phase} {app.version ? `| ${app.version}` : ""}
                  </div>
                </div>
                <span className={`ops-pill ${statusClass(app.status)}`}>{statusLabel(app.status)}</span>
              </div>
            ))
          )}

          {dbHealth?.stats && (
            <>
              <h2 className="ops-panel-title" style={{ marginTop: 14 }}>Database Snapshot</h2>
              <div className="ops-service-row">
                <div className="ops-service-name">Tenants</div>
                <div className="ops-service-meta">{dbHealth.stats.tenants}</div>
              </div>
              <div className="ops-service-row">
                <div className="ops-service-name">Users</div>
                <div className="ops-service-meta">{dbHealth.stats.users}</div>
              </div>
              <div className="ops-service-row">
                <div className="ops-service-name">Posts</div>
                <div className="ops-service-meta">{dbHealth.stats.posts}</div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
