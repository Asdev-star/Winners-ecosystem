import { startTransition, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";

type RevenueSnapshot = {
  generatedAt: string;
  supervisor: string;
  summary: {
    monthLabel: string;
    text: string;
  };
  kpis: {
    mrr: number;
    arr: number;
    growthPct: number;
    stripeStatus: "connected" | "configured" | "offline";
    stripeConnectedTenants: number;
    churnPct: number;
    subscriptionSharePct: number;
    transactionRevenue: number;
    marketForecast90d: number;
  };
  chart: {
    currentMonthKey: string;
    currentMonthLabel: string;
    previousMonthLabel: string;
    series: Array<{
      key: string;
      label: string;
      fullLabel: string;
      actual: number | null;
      forecast: number | null;
      note?: string;
    }>;
    anomalies: Array<{
      key: string;
      label: string;
      value: number;
      note: string;
    }>;
  };
  layers: Array<{
    id: "core" | "community" | "academy" | "market" | "work" | "cloud";
    name: string;
    status: "live" | "locked";
    statusLabel: string;
    detail: string;
    amount: number;
    sharePct: number;
  }>;
  exports: {
    emailConfigured: boolean;
    adminRecipients: string[];
  };
};

type Palette = {
  gold: string;
  purple: string;
  text: string;
  dim: string;
  border: string;
  grid: string;
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Space+Mono:wght@400;700&family=Syne:wght@400;500;700;800&display=swap');
  .arc-root{max-width:1380px;margin:0 auto;padding:28px 22px 96px;color:var(--text);font-family:'Syne',sans-serif}
  .arc-shell{position:relative;overflow:hidden;border-radius:30px;border:1px solid rgba(201,168,76,.16);background:
    radial-gradient(circle at top right,rgba(201,168,76,.14),transparent 34%),
    radial-gradient(circle at left bottom,rgba(126,87,255,.08),transparent 28%),
    linear-gradient(180deg,rgba(10,18,29,.98),rgba(8,14,22,.98));box-shadow:0 30px 90px rgba(0,0,0,.34)}
  .arc-top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:22px 24px;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(7,12,18,.62)}
  .arc-kicker{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:10px}
  .arc-title{margin:0;font-family:'Cormorant Garamond',serif;font-size:clamp(42px,5vw,64px);line-height:.92;color:#f6efdc}
  .arc-subtitle{margin:10px 0 0;max-width:720px;color:var(--text-dim);font-size:15px;line-height:1.7}
  .arc-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
  .arc-link,.arc-button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border-radius:999px;border:1px solid rgba(201,168,76,.22);background:rgba(201,168,76,.08);color:var(--gold);text-decoration:none;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
  .arc-button.ghost,.arc-link.ghost{background:rgba(255,255,255,.03);border-color:rgba(255,255,255,.1);color:var(--text-dim)}
  .arc-button:disabled{opacity:.55;cursor:not-allowed}
  .arc-body{padding:24px}
  .arc-banner{margin-bottom:18px;padding:14px 16px;border-radius:18px;border:1px solid rgba(255,255,255,.08);font-size:14px;line-height:1.55}
  .arc-banner.error{border-color:rgba(224,90,78,.26);background:rgba(224,90,78,.09);color:#ffccc6}
  .arc-banner.success{border-color:rgba(45,212,160,.24);background:rgba(45,212,160,.09);color:#cbf7e8}
  .arc-brief{margin-bottom:18px;padding:22px 22px 20px;border-radius:24px;border:1px solid rgba(201,168,76,.18);border-left:6px solid var(--gold);background:
    radial-gradient(circle at left center,rgba(201,168,76,.13),transparent 30%),
    linear-gradient(135deg,rgba(17,26,38,.96),rgba(11,18,30,.98))}
  .arc-brief-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:10px}
  .arc-brief-kicker{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
  .arc-brief-meta{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim)}
  .arc-brief-copy{margin:0;font-family:'Cormorant Garamond',serif;font-size:clamp(28px,3vw,40px);line-height:1.12;color:#f4f1e3;min-height:120px}
  .arc-cursor{display:inline-block;width:8px;height:1em;margin-left:6px;background:var(--gold);vertical-align:-.08em;animation:arc-blink 1s steps(1) infinite}
  .arc-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}
  .arc-kpi{padding:18px;border-radius:22px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(18,28,40,.92),rgba(10,17,27,.92))}
  .arc-kpi-label{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:12px}
  .arc-kpi-value{font-family:'Cormorant Garamond',serif;font-size:40px;line-height:.98;color:var(--text)}
  .arc-kpi-sub{margin-top:10px;font-size:13px;line-height:1.55;color:var(--text-dim)}
  .arc-kpi-sub strong{color:var(--gold);font-weight:700}
  .arc-positive{color:var(--green)}
  .arc-chart{padding:20px 20px 14px;border-radius:26px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(17,25,37,.94),rgba(9,15,24,.96));margin-bottom:18px}
  .arc-section-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:18px}
  .arc-section-title{margin:0;font-size:18px;font-weight:800;color:var(--text)}
  .arc-section-copy{margin-top:8px;font-size:13px;color:var(--text-dim);line-height:1.6;max-width:720px}
  .arc-legend{display:flex;gap:10px;flex-wrap:wrap}
  .arc-legend-chip{display:inline-flex;align-items:center;gap:8px;padding:7px 11px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim)}
  .arc-legend-line{width:22px;height:0;border-top:2px solid var(--gold)}
  .arc-legend-line.dashed{border-top-style:dashed}
  .arc-legend-dot{width:10px;height:10px;border-radius:999px;background:var(--purple);box-shadow:0 0 18px rgba(126,87,255,.55)}
  .arc-chart-wrap{height:360px}
  .arc-anomalies{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}
  .arc-anomaly{padding:14px 16px;border-radius:18px;border:1px solid rgba(126,87,255,.22);background:rgba(126,87,255,.08)}
  .arc-anomaly-top{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px}
  .arc-anomaly-title{display:flex;align-items:center;gap:10px;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#d8c8ff}
  .arc-anomaly-dot{width:10px;height:10px;border-radius:999px;background:var(--purple)}
  .arc-anomaly-copy{font-size:13px;line-height:1.55;color:#ddd4fb}
  .arc-grid{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:18px}
  .arc-layers,.arc-actions-panel{padding:20px;border-radius:26px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(18,27,39,.94),rgba(9,15,24,.96))}
  .arc-layer-list{display:grid;gap:14px}
  .arc-layer{padding:15px 16px;border-radius:20px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03)}
  .arc-layer-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:10px}
  .arc-layer-name{font-size:16px;font-weight:800;color:var(--text)}
  .arc-layer-detail{margin-top:4px;font-size:13px;color:var(--text-dim)}
  .arc-layer-value{font-family:'Cormorant Garamond',serif;font-size:30px;line-height:1;color:var(--text)}
  .arc-pill{display:inline-flex;align-items:center;border-radius:999px;padding:6px 10px;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;border:1px solid rgba(255,255,255,.08)}
  .arc-pill.live{color:var(--green);border-color:rgba(45,212,160,.24);background:rgba(45,212,160,.09)}
  .arc-pill.locked{color:var(--gold);border-color:rgba(201,168,76,.24);background:rgba(201,168,76,.09)}
  .arc-progress{height:11px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,.07)}
  .arc-progress-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,rgba(201,168,76,.96),rgba(243,232,185,.92))}
  .arc-layer-meta{display:flex;justify-content:space-between;gap:12px;margin-top:10px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim)}
  .arc-actions-panel{display:grid;gap:16px;align-content:start}
  .arc-action-copy{font-size:14px;line-height:1.65;color:var(--text-dim)}
  .arc-action-stack{display:grid;gap:10px}
  .arc-note{padding:14px 16px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);font-size:13px;line-height:1.6;color:var(--text-dim)}
  .arc-note strong{color:var(--text)}
  .arc-empty{padding:40px;border-radius:24px;border:1px dashed rgba(255,255,255,.14);background:rgba(255,255,255,.02);font-size:14px;color:var(--text-dim)}
  .arc-tooltip{border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(8,13,22,.96);padding:12px 14px;box-shadow:0 18px 38px rgba(0,0,0,.34)}
  .arc-tooltip-title{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:8px}
  .arc-tooltip-row{display:flex;justify-content:space-between;gap:14px;font-size:13px;color:var(--text);margin-top:6px}
  .arc-tooltip-note{margin-top:10px;font-size:12px;line-height:1.55;color:#d8c8ff}
  .arc-load{display:grid;gap:14px}
  .arc-skel{min-height:120px;border-radius:24px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.08),rgba(255,255,255,.04));background-size:180% 100%;animation:arc-shimmer 1.35s linear infinite}
  @keyframes arc-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
  @keyframes arc-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
  @media (max-width:1120px){.arc-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.arc-grid{grid-template-columns:1fr}.arc-anomalies{grid-template-columns:1fr}}
  @media (max-width:760px){.arc-root{padding:18px 14px 84px}.arc-top{padding:18px;flex-direction:column}.arc-body{padding:18px}.arc-kpis{grid-template-columns:1fr}.arc-title{font-size:42px}.arc-brief-copy{min-height:0;font-size:32px}.arc-actions{justify-content:flex-start}}
`;

function fmtMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function fmtPct(value: number, digits = 0) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

async function apiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((body as { message?: string }).message ?? `Request failed (${response.status})`);
  }
  return body as T;
}

function getPalette(): Palette {
  const computed = getComputedStyle(document.documentElement);
  return {
    gold: computed.getPropertyValue("--gold").trim() || "#c9a84c",
    purple: computed.getPropertyValue("--purple").trim() || "#9b6fff",
    text: computed.getPropertyValue("--text").trim() || "#edf2f7",
    dim: computed.getPropertyValue("--text-dim").trim() || "#97a6ba",
    border: computed.getPropertyValue("--border").trim() || "rgba(255,255,255,0.1)",
    grid: "rgba(255,255,255,0.08)",
  };
}

function RevenueTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const datum = payload[0]?.payload as RevenueSnapshot["chart"]["series"][number] | undefined;
  if (!datum) return null;

  return (
    <div className="arc-tooltip">
      <div className="arc-tooltip-title">{datum.fullLabel ?? label}</div>
      {datum.actual != null ? (
        <div className="arc-tooltip-row">
          <span>Actual</span>
          <strong>{fmtMoney(datum.actual)}</strong>
        </div>
      ) : null}
      {datum.forecast != null ? (
        <div className="arc-tooltip-row">
          <span>Forecast</span>
          <strong>{fmtMoney(datum.forecast)}</strong>
        </div>
      ) : null}
      {datum.note ? <div className="arc-tooltip-note">{datum.note}</div> : null}
    </div>
  );
}

export default function AdminRevenuePage() {
  const [snapshot, setSnapshot] = useState<RevenueSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [streamedSummary, setStreamedSummary] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [busyAction, setBusyAction] = useState<"csv" | "pdf" | "xlsx" | "email" | null>(null);
  const [palette, setPalette] = useState<Palette>(() => ({
    gold: "#c9a84c",
    purple: "#9b6fff",
    text: "#edf2f7",
    dim: "#97a6ba",
    border: "rgba(255,255,255,0.1)",
    grid: "rgba(255,255,255,0.08)",
  }));

  const hasAnomalies = (snapshot?.chart.anomalies.length ?? 0) > 0;
  const maxLayerAmount = useMemo(
    () => Math.max(...(snapshot?.layers.map((layer) => layer.amount) ?? [1]), 1),
    [snapshot]
  );

  useEffect(() => {
    const id = "admin-revenue-command-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id;
      tag.textContent = css;
      document.head.appendChild(tag);
    }
    setPalette(getPalette());
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load(initial = false) {
      try {
        if (initial) setLoading(true);
        const data = await apiRequest<RevenueSnapshot>("/admin/revenue/command");
        if (cancelled) return;
        startTransition(() => {
          setSnapshot(data);
          setError("");
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load revenue command");
      } finally {
        if (!cancelled && initial) setLoading(false);
      }
    }

    void load(true);
    const interval = window.setInterval(() => {
      void load(false);
    }, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!snapshot?.summary.text) {
      setStreamedSummary("");
      setStreaming(false);
      return;
    }

    let frame = 0;
    let cancelled = false;
    setStreamedSummary("");
    setStreaming(true);

    const timer = window.setInterval(() => {
      if (cancelled) return;
      frame += 3;
      const next = snapshot.summary.text.slice(0, frame);
      setStreamedSummary(next);
      if (next.length >= snapshot.summary.text.length) {
        setStreaming(false);
        window.clearInterval(timer);
      }
    }, 14);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [snapshot?.summary.text]);

  async function downloadExport(format: "csv" | "pdf" | "xlsx") {
    setBusyAction(format);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/admin/revenue/export/${format}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `revenue-command-${new Date().toISOString().slice(0, 10)}.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage({ tone: "success", text: `${format.toUpperCase()} export downloaded.` });
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Export failed" });
    } finally {
      setBusyAction(null);
    }
  }

  async function sendReportEmail() {
    setBusyAction("email");
    setMessage(null);
    try {
      const response = await apiRequest<{ message: string; recipients: number }>("/admin/revenue/report-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({}),
      });
      setMessage({
        tone: "success",
        text: `${response.message}. Sent to ${response.recipients} admin recipient${response.recipients === 1 ? "" : "s"}.`,
      });
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Failed to send report email" });
    } finally {
      setBusyAction(null);
    }
  }

  const stripeLabel =
    snapshot?.kpis.stripeStatus === "connected"
      ? "Connected"
      : snapshot?.kpis.stripeStatus === "configured"
        ? "Configured"
        : "Offline";

  return (
    <div className="arc-root">
      <div className="arc-shell">
        <div className="arc-top">
          <div>
            <div className="arc-kicker">Admin / Revenue Command</div>
            <h1 className="arc-title">Revenue Command</h1>
            <p className="arc-subtitle">"Every dollar that flows through your ecosystem. All of it."</p>
          </div>

          <div className="arc-actions">
            <Link className="arc-link ghost" to="/admin/overview">
              Back to Overview
            </Link>
            <Link className="arc-link ghost" to="/admin/platform">
              Platform Matrix
            </Link>
          </div>
        </div>

        <div className="arc-body">
          {error ? <div className="arc-banner error">{error}</div> : null}
          {message ? <div className={`arc-banner ${message.tone}`}>{message.text}</div> : null}

          {loading && !snapshot ? (
            <div className="arc-load">
              <div className="arc-skel" />
              <div className="arc-skel" />
              <div className="arc-skel" />
            </div>
          ) : snapshot ? (
            <>
              <section className="arc-brief">
                <div className="arc-brief-top">
                  <div className="arc-brief-kicker">{snapshot.supervisor} executive summary</div>
                  <div className="arc-brief-meta">{new Date(snapshot.generatedAt).toLocaleString()}</div>
                </div>
                <p className="arc-brief-copy">
                  {streamedSummary}
                  {streaming ? <span className="arc-cursor" /> : null}
                </p>
              </section>

              <section className="arc-kpis">
                <article className="arc-kpi">
                  <div className="arc-kpi-label">MRR</div>
                  <div className="arc-kpi-value">{fmtMoney(snapshot.kpis.mrr)}</div>
                  <div className="arc-kpi-sub">
                    <strong className={snapshot.kpis.growthPct >= 0 ? "arc-positive" : undefined}>
                      {fmtPct(snapshot.kpis.growthPct)}
                    </strong>{" "}
                    vs {snapshot.chart.previousMonthLabel}
                  </div>
                </article>

                <article className="arc-kpi">
                  <div className="arc-kpi-label">ARR</div>
                  <div className="arc-kpi-value">{fmtMoney(snapshot.kpis.arr)}</div>
                  <div className="arc-kpi-sub">
                    Subscription mix <strong>{snapshot.kpis.subscriptionSharePct}%</strong> of run rate
                  </div>
                </article>

                <article className="arc-kpi">
                  <div className="arc-kpi-label">Stripe</div>
                  <div className="arc-kpi-value">{stripeLabel}</div>
                  <div className="arc-kpi-sub">
                    {snapshot.kpis.stripeConnectedTenants} connected tenant{snapshot.kpis.stripeConnectedTenants === 1 ? "" : "s"}
                  </div>
                </article>

                <article className="arc-kpi">
                  <div className="arc-kpi-label">Churn</div>
                  <div className="arc-kpi-value">{snapshot.kpis.churnPct.toFixed(1)}%</div>
                  <div className="arc-kpi-sub">
                    Transaction revenue: <strong>{fmtMoney(snapshot.kpis.transactionRevenue)}</strong>
                  </div>
                </article>
              </section>

              <section className="arc-chart">
                <div className="arc-section-head">
                  <div>
                    <h2 className="arc-section-title">Revenue Chart</h2>
                    <div className="arc-section-copy">
                      Actual revenue is shown in solid gold. Forecast extends the current trajectory with a dashed continuation, and ARIA flags unusual months in purple.
                    </div>
                  </div>

                  <div className="arc-legend">
                    <div className="arc-legend-chip">
                      <span className="arc-legend-line" />
                      Actual
                    </div>
                    <div className="arc-legend-chip">
                      <span className="arc-legend-line dashed" />
                      Forecast
                    </div>
                    <div className="arc-legend-chip">
                      <span className="arc-legend-dot" />
                      ARIA anomaly
                    </div>
                  </div>
                </div>

                <div className="arc-chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={snapshot.chart.series} margin={{ top: 16, right: 18, left: -12, bottom: 8 }}>
                      <CartesianGrid stroke={palette.grid} vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: palette.dim, fontSize: 11, fontFamily: "Space Mono" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: palette.dim, fontSize: 11, fontFamily: "Space Mono" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => fmtMoney(Number(value))}
                        width={86}
                      />
                      <Tooltip content={<RevenueTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke={palette.gold}
                        strokeWidth={2.4}
                        dot={({ cx, cy, payload }) => {
                          const point = payload as RevenueSnapshot["chart"]["series"][number];
                          if (point.note && typeof cx === "number" && typeof cy === "number") {
                            return <circle cx={cx} cy={cy} r={5} fill={palette.purple} stroke="#0d1117" strokeWidth={2} />;
                          }
                          return <circle cx={cx} cy={cy} r={3} fill={palette.gold} />;
                        }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke={palette.gold}
                        strokeWidth={2.2}
                        strokeDasharray="7 6"
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {hasAnomalies ? (
                  <div className="arc-anomalies">
                    {snapshot.chart.anomalies.map((anomaly) => (
                      <div key={anomaly.key} className="arc-anomaly">
                        <div className="arc-anomaly-top">
                          <div className="arc-anomaly-title">
                            <span className="arc-anomaly-dot" />
                            {anomaly.label}
                          </div>
                          <strong>{fmtMoney(anomaly.value)}</strong>
                        </div>
                        <div className="arc-anomaly-copy">{anomaly.note}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="arc-note">
                    <strong>ARIA signal:</strong> No statistically meaningful anomalies in the current monthly trend window.
                  </div>
                )}
              </section>

              <div className="arc-grid">
                <section className="arc-layers">
                  <div className="arc-section-head">
                    <div>
                      <h2 className="arc-section-title">By Layer</h2>
                      <div className="arc-section-copy">
                        Revenue is attributed to the layer that generated it, with locked layers held at zero until their monetization rails go live.
                      </div>
                    </div>
                  </div>

                  <div className="arc-layer-list">
                    {snapshot.layers.map((layer) => (
                      <article key={layer.id} className="arc-layer">
                        <div className="arc-layer-head">
                          <div>
                            <div className="arc-layer-name">{layer.name}</div>
                            <div className="arc-layer-detail">{layer.detail}</div>
                          </div>
                          <span className={`arc-pill ${layer.status}`}>{layer.statusLabel}</span>
                        </div>

                        <div className="arc-layer-value">{fmtMoney(layer.amount)}</div>
                        <div className="arc-progress">
                          <div
                            className="arc-progress-fill"
                            style={{ width: `${Math.max((layer.amount / maxLayerAmount) * 100, layer.amount > 0 ? 6 : 0)}%` }}
                          />
                        </div>
                        <div className="arc-layer-meta">
                          <span>{layer.sharePct}% of MRR</span>
                          <span>{layer.statusLabel}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <aside className="arc-actions-panel">
                  <div>
                    <h2 className="arc-section-title">Actions</h2>
                    <div className="arc-action-copy">
                      Export the current command view or push the ARIA summary to the sovereign admin inbox.
                    </div>
                  </div>

                  <div className="arc-action-stack">
                    <button
                      className="arc-button"
                      onClick={() => void downloadExport("csv")}
                      disabled={busyAction !== null}
                    >
                      {busyAction === "csv" ? "Preparing CSV" : "Export CSV"}
                    </button>
                    <button
                      className="arc-button"
                      onClick={() => void downloadExport("pdf")}
                      disabled={busyAction !== null}
                    >
                      {busyAction === "pdf" ? "Preparing PDF" : "Export PDF"}
                    </button>
                    <button
                      className="arc-button"
                      onClick={() => void downloadExport("xlsx")}
                      disabled={busyAction !== null}
                    >
                      {busyAction === "xlsx" ? "Preparing Excel" : "Export Excel"}
                    </button>
                  </div>

                  <button
                    className="arc-button ghost"
                    onClick={() => void sendReportEmail()}
                    disabled={busyAction !== null || !snapshot.exports.emailConfigured}
                  >
                    {busyAction === "email" ? "Sending ARIA Report" : "Send ARIA Report to admin email"}
                  </button>

                  <div className="arc-note">
                    <strong>Email status:</strong>{" "}
                    {snapshot.exports.emailConfigured
                      ? `Ready. ${snapshot.exports.adminRecipients.length} admin recipient${snapshot.exports.adminRecipients.length === 1 ? "" : "s"} configured.`
                      : "RESEND_API_KEY is not configured, so the report email action is disabled."}
                  </div>

                  <div className="arc-note">
                    <strong>FORGE forecast:</strong> Market launch clearance currently projects{" "}
                    {fmtMoney(snapshot.kpis.marketForecast90d)} in additional MRR over the next 90 days.
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className="arc-empty">Revenue telemetry is not available yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

