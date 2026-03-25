import { Resend } from "resend";
import db from "../db.js";
import { getOverviewLayers } from "./adminOverviewService.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type RevenueLayerId = "core" | "community" | "academy" | "market" | "work" | "cloud";
type RevenueExportFormat = "csv" | "xlsx" | "pdf";

type RevenueRecordRow = {
  amount: number;
  source: string;
  recordedAt: Date;
  tenantId: string;
};

type RevenueMonth = {
  key: string;
  label: string;
  fullLabel: string;
  year: number;
  month: number;
  start: Date;
  end: Date;
};

export type AdminRevenueSnapshot = {
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
    id: RevenueLayerId;
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

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, diff: number) {
  return new Date(date.getFullYear(), date.getMonth() + diff, 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonth(date: Date): RevenueMonth {
  const start = monthStart(date);
  const end = addMonths(start, 1);
  const month = start.getMonth();
  const year = start.getFullYear();
  return {
    key: monthKey(start),
    label: `${MONTH_NAMES[month]} ${String(year).slice(-2)}`,
    fullLabel: `${FULL_MONTH_NAMES[month]} ${year}`,
    year,
    month,
    start,
    end,
  };
}

function buildMonthRange(current: Date, before: number, after = 0): RevenueMonth[] {
  const months: RevenueMonth[] = [];
  for (let index = before; index > 0; index -= 1) {
    months.push(buildMonth(addMonths(current, -index)));
  }
  months.push(buildMonth(current));
  for (let index = 1; index <= after; index += 1) {
    months.push(buildMonth(addMonths(current, index)));
  }
  return months;
}

function within(date: Date, start: Date, end: Date) {
  return date >= start && date < end;
}

function sum(rows: Array<{ amount: number }>) {
  return rows.reduce((total, row) => total + row.amount, 0);
}

function sourceToLayer(source: string): RevenueLayerId {
  const normalized = source.toLowerCase();
  if (normalized.includes("academy") || normalized.includes("course")) return "academy";
  if (normalized.includes("community") || normalized.includes("creator") || normalized.includes("channel")) return "community";
  if (normalized.includes("market") || normalized.includes("vendor") || normalized.includes("order") || normalized.includes("commission")) return "market";
  if (normalized.includes("work") || normalized.includes("escrow") || normalized.includes("contract") || normalized.includes("gig")) return "work";
  if (normalized.includes("cloud") || normalized.includes("api") || normalized.includes("credit") || normalized.includes("usage")) return "cloud";
  return "core";
}

function layerMeta() {
  return {
    core: { name: "Core", detail: "subscriptions" },
    community: { name: "Community", detail: "creator subs" },
    academy: { name: "Academy", detail: "course revenue" },
    market: { name: "Market", detail: "commissions" },
    work: { name: "Work", detail: "escrow fees" },
    cloud: { name: "Cloud", detail: "API credits" },
  } satisfies Record<RevenueLayerId, { name: string; detail: string }>;
}

function statusLabel(status: "live" | "locked") {
  return status === "live" ? "Live" : "Locked";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function linearRegression(values: number[]) {
  if (!values.length) return { slope: 0, intercept: 0 };
  if (values.length === 1) return { slope: 0, intercept: values[0] };

  const xs = values.map((_value, index) => index);
  const xMean = xs.reduce((total, value) => total + value, 0) / xs.length;
  const yMean = values.reduce((total, value) => total + value, 0) / values.length;
  const numerator = values.reduce((total, value, index) => total + (xs[index] - xMean) * (value - yMean), 0);
  const denominator = xs.reduce((total, value) => total + (value - xMean) ** 2, 0);

  if (!denominator) return { slope: 0, intercept: yMean };
  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

function detectAnomalies(actualSeries: Array<{ key: string; label: string; value: number }>) {
  const nonZero = actualSeries.filter((entry) => entry.value > 0);
  if (nonZero.length < 3) return [];

  const mean = nonZero.reduce((total, entry) => total + entry.value, 0) / nonZero.length;
  const variance =
    nonZero.reduce((total, entry) => total + (entry.value - mean) ** 2, 0) / nonZero.length;
  const stdDev = Math.sqrt(variance);

  const anomalies = nonZero
    .map((entry, index) => {
      const previous = nonZero[index - 1]?.value ?? mean;
      const deltaPct = previous > 0 ? ((entry.value - previous) / previous) * 100 : 0;
      const zScore = stdDev > 0 ? Math.abs(entry.value - mean) / stdDev : 0;
      if (zScore < 1.1 && Math.abs(deltaPct) < 24) return null;

      return {
        key: entry.key,
        label: entry.label,
        value: entry.value,
        score: Math.max(zScore, Math.abs(deltaPct) / 20),
        note:
          deltaPct >= 0
            ? `Revenue spike of ${fmtPct(deltaPct)} vs prior month. Review campaign or launch attribution.`
            : `Revenue dip of ${fmtPct(deltaPct)} vs prior month. Inspect churn and invoice timing.`,
      };
    })
    .filter((entry): entry is { key: string; label: string; value: number; score: number; note: string } => Boolean(entry))
    .sort((left, right) => right.score - left.score)
    .slice(0, 2);

  return anomalies.map(({ score: _score, ...entry }) => entry);
}

function getAdminRecipients() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function getAdminRevenueSnapshot(): Promise<AdminRevenueSnapshot> {
  const now = new Date();
  const currentMonth = buildMonth(now);
  const previousMonth = buildMonth(addMonths(now, -1));
  const monthSeries = buildMonthRange(now, 5, 3);
  const actualMonths = monthSeries.filter((entry) => entry.start <= currentMonth.start);
  const queryStart = actualMonths[0]?.start ?? addMonths(now, -5);

  const [records, tenants, vendors] = await Promise.all([
    db.revenueRecord.findMany({
      where: { recordedAt: { gte: queryStart } },
      select: { amount: true, source: true, recordedAt: true, tenantId: true },
      orderBy: { recordedAt: "asc" },
    }),
    db.tenant.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    }),
    db.vendor.findMany({
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const monthsByKey = new Map(monthSeries.map((entry) => [entry.key, entry]));
  const revenueByMonth = new Map<string, RevenueRecordRow[]>();
  const currentMonthRows: RevenueRecordRow[] = [];
  const previousMonthRows: RevenueRecordRow[] = [];

  for (const record of records) {
    const key = monthKey(record.recordedAt);
    if (monthsByKey.has(key)) {
      const bucket = revenueByMonth.get(key) ?? [];
      bucket.push(record);
      revenueByMonth.set(key, bucket);
    }

    if (within(record.recordedAt, currentMonth.start, currentMonth.end)) currentMonthRows.push(record);
    if (within(record.recordedAt, previousMonth.start, previousMonth.end)) previousMonthRows.push(record);
  }

  const daysElapsed = Math.max(1, Math.floor((now.getTime() - currentMonth.start.getTime()) / DAY_MS) + 1);
  const daysInMonth = Math.floor((currentMonth.end.getTime() - currentMonth.start.getTime()) / DAY_MS);
  const monthRunRate = daysElapsed > 0 ? daysInMonth / daysElapsed : 1;

  const currentMonthActual = sum(currentMonthRows);
  const currentMrr = roundMoney(currentMonthActual * monthRunRate);
  const previousMonthRevenue = roundMoney(sum(previousMonthRows));
  const arr = roundMoney(currentMrr * 12);
  const growthPct = previousMonthRevenue > 0 ? Math.round(((currentMrr - previousMonthRevenue) / previousMonthRevenue) * 100) : 0;

  const currentLayerTotals: Record<RevenueLayerId, number> = {
    core: 0,
    community: 0,
    academy: 0,
    market: 0,
    work: 0,
    cloud: 0,
  };

  currentMonthRows.forEach((record) => {
    currentLayerTotals[sourceToLayer(record.source)] += record.amount;
  });

  (Object.keys(currentLayerTotals) as RevenueLayerId[]).forEach((layerId) => {
    currentLayerTotals[layerId] = roundMoney(currentLayerTotals[layerId] * monthRunRate);
  });

  const transactionRevenue = roundMoney(
    currentLayerTotals.market + currentLayerTotals.work + currentLayerTotals.cloud
  );
  const subscriptionSharePct = currentMrr > 0 ? Math.round((currentLayerTotals.core / currentMrr) * 100) : 0;

  const currentPayingTenants = new Set(currentMonthRows.map((record) => record.tenantId));
  const previousPayingTenants = new Set(previousMonthRows.map((record) => record.tenantId));
  let churnPct = 0;
  if (previousPayingTenants.size > 0) {
    const churned = [...previousPayingTenants].filter((tenantId) => !currentPayingTenants.has(tenantId)).length;
    churnPct = Math.round((churned / previousPayingTenants.size) * 1000) / 10;
  }

  const connectedTenants = tenants.filter((tenant) => tenant.stripeCustomerId || tenant.stripeSubscriptionId).length;
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const stripeStatus: AdminRevenueSnapshot["kpis"]["stripeStatus"] =
    connectedTenants > 0 ? "connected" : stripeConfigured ? "configured" : "offline";

  const recentVendorWindow = new Date(now.getTime() - 90 * DAY_MS);
  const pendingVendorApplications = vendors.filter(
    (vendor) => vendor.createdAt >= recentVendorWindow && vendor.status === "PENDING"
  ).length;
  const approvedVendors = vendors.filter((vendor) => vendor.status === "APPROVED").length;
  const marketForecast90d = Math.max(
    0,
    Math.round((pendingVendorApplications * 120 + approvedVendors * 80) / 50) * 50
  );

  const actualSeries = actualMonths.map((month) => {
    const monthTotal = sum(revenueByMonth.get(month.key) ?? []);
    const value = month.key === currentMonth.key ? currentMrr : roundMoney(monthTotal);
    return {
      key: month.key,
      label: month.label,
      fullLabel: month.fullLabel,
      value,
    };
  });

  const regressionBase = actualSeries.map((entry) => entry.value);
  const { slope, intercept } = linearRegression(regressionBase);
  const baseline = regressionBase.length ? regressionBase[regressionBase.length - 1] : currentMrr;

  const anomalies = detectAnomalies(actualSeries);
  const anomalyMap = new Map(anomalies.map((entry) => [entry.key, entry.note]));

  const series = monthSeries.map((month, index) => {
    const actualPoint = actualSeries.find((entry) => entry.key === month.key);
    if (actualPoint) {
      return {
        key: month.key,
        label: month.label,
        fullLabel: month.fullLabel,
        actual: actualPoint.value,
        forecast: month.key === currentMonth.key ? actualPoint.value : null,
        note: anomalyMap.get(month.key),
      };
    }

    const forecastIndex = actualSeries.length + (index - actualSeries.length);
    const rawForecast = slope === 0 && intercept === 0 ? baseline : slope * forecastIndex + intercept;
    const forecast = roundMoney(clamp(rawForecast, baseline * 0.55, Math.max(baseline * 1.8, baseline + 500)));
    return {
      key: month.key,
      label: month.label,
      fullLabel: month.fullLabel,
      actual: null,
      forecast,
      note: anomalyMap.get(month.key),
    };
  });

  const overviewLayers = getOverviewLayers();
  const overviewStatus = new Map(
    overviewLayers
      .filter((layer) => ["core", "community", "academy", "market", "work", "cloud"].includes(layer.id))
      .map((layer) => [layer.id as RevenueLayerId, layer.status === "live" ? "live" : "locked"] as const)
  );
  const layerDetails = layerMeta();
  const layers = (Object.keys(layerDetails) as RevenueLayerId[]).map((layerId) => {
    const amount = roundMoney(currentLayerTotals[layerId]);
    const sharePct = currentMrr > 0 ? Math.round((amount / currentMrr) * 100) : 0;
    const status = overviewStatus.get(layerId) ?? (layerId === "core" || layerId === "community" || layerId === "academy" ? "live" : "locked");
    return {
      id: layerId,
      name: layerDetails[layerId].name,
      status,
      statusLabel: statusLabel(status),
      detail: layerDetails[layerId].detail,
      amount,
      sharePct,
    };
  });

  const monthLabel = currentMonth.fullLabel;
  const summaryParts = [
    `${monthLabel}: ${fmtMoney(currentMrr)} MRR. ARR projection: ${fmtMoney(arr)}.`,
    previousMonthRevenue > 0
      ? `Revenue ${growthPct >= 0 ? "grew" : "fell"} ${Math.abs(growthPct)}% vs ${previousMonth.fullLabel}.`
      : `No completed prior month baseline is available yet, so ${monthLabel} is setting the first comparable run rate.`,
    `${subscriptionSharePct}% of MRR is coming from subscription revenue${subscriptionSharePct >= 75 ? " for strong stability" : " so recurring mix still has room to grow"}.`,
    transactionRevenue > 0
      ? `Transaction-led revenue is ${fmtMoney(transactionRevenue)} across Market, Work, and Cloud flows.`
      : "Transaction revenue is still at $0 because Market, Work, and Cloud monetization have not turned on yet.",
    marketForecast90d > 0
      ? `When Market clears launch gates, FORGE projects +${fmtMoney(marketForecast90d)} MRR within 90 days based on current vendor application volume.`
      : "Market has not built enough vendor application volume yet to support a 90-day monetization forecast.",
  ];

  return {
    generatedAt: now.toISOString(),
    supervisor: "FORGE · ARIA",
    summary: {
      monthLabel,
      text: summaryParts.join(" "),
    },
    kpis: {
      mrr: currentMrr,
      arr,
      growthPct,
      stripeStatus,
      stripeConnectedTenants: connectedTenants,
      churnPct,
      subscriptionSharePct,
      transactionRevenue,
      marketForecast90d,
    },
    chart: {
      currentMonthKey: currentMonth.key,
      currentMonthLabel: currentMonth.fullLabel,
      previousMonthLabel: previousMonth.fullLabel,
      series,
      anomalies,
    },
    layers,
    exports: {
      emailConfigured: Boolean(process.env.RESEND_API_KEY),
      adminRecipients: getAdminRecipients(),
    },
  };
}

export function buildAdminRevenueCsv(snapshot: AdminRevenueSnapshot) {
  const rows = [
    ["Generated At", snapshot.generatedAt],
    ["Supervisor", snapshot.supervisor],
    ["Month", snapshot.summary.monthLabel],
    ["MRR", snapshot.kpis.mrr],
    ["ARR", snapshot.kpis.arr],
    ["Growth %", snapshot.kpis.growthPct],
    ["Stripe Status", snapshot.kpis.stripeStatus],
    ["Churn %", snapshot.kpis.churnPct],
    ["Subscription Share %", snapshot.kpis.subscriptionSharePct],
    ["Transaction Revenue", snapshot.kpis.transactionRevenue],
    ["Market Forecast 90d", snapshot.kpis.marketForecast90d],
    [],
    ["Chart Label", "Actual", "Forecast", "Note"],
    ...snapshot.chart.series.map((entry) => [
      entry.fullLabel,
      entry.actual ?? "",
      entry.forecast ?? "",
      entry.note ?? "",
    ]),
    [],
    ["Layer", "Status", "Detail", "Amount", "Share %"],
    ...snapshot.layers.map((layer) => [
      layer.name,
      layer.statusLabel,
      layer.detail,
      layer.amount,
      layer.sharePct,
    ]),
  ];

  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return text.includes(",") || text.includes('"') || text.includes("\n")
            ? `"${text.replace(/"/g, '""')}"`
            : text;
        })
        .join(",")
    )
    .join("\n");
}

export async function buildAdminRevenueWorkbook(snapshot: AdminRevenueSnapshot) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.default.Workbook();
  workbook.creator = "Winners Ecosystem";
  workbook.created = new Date(snapshot.generatedAt);

  const summary = workbook.addWorksheet("Revenue Command");
  summary.columns = [
    { header: "Metric", key: "metric", width: 28 },
    { header: "Value", key: "value", width: 36 },
  ];
  summary.addRows([
    { metric: "Generated At", value: snapshot.generatedAt },
    { metric: "Supervisor", value: snapshot.supervisor },
    { metric: "Month", value: snapshot.summary.monthLabel },
    { metric: "Executive Summary", value: snapshot.summary.text },
    { metric: "MRR", value: snapshot.kpis.mrr },
    { metric: "ARR", value: snapshot.kpis.arr },
    { metric: "Growth %", value: snapshot.kpis.growthPct },
    { metric: "Stripe Status", value: snapshot.kpis.stripeStatus },
    { metric: "Churn %", value: snapshot.kpis.churnPct },
    { metric: "Subscription Share %", value: snapshot.kpis.subscriptionSharePct },
    { metric: "Transaction Revenue", value: snapshot.kpis.transactionRevenue },
    { metric: "Market Forecast 90d", value: snapshot.kpis.marketForecast90d },
  ]);

  const chartSheet = workbook.addWorksheet("Chart");
  chartSheet.columns = [
    { header: "Month", key: "month", width: 20 },
    { header: "Actual", key: "actual", width: 16 },
    { header: "Forecast", key: "forecast", width: 16 },
    { header: "Note", key: "note", width: 72 },
  ];
  snapshot.chart.series.forEach((entry) => {
    chartSheet.addRow({
      month: entry.fullLabel,
      actual: entry.actual,
      forecast: entry.forecast,
      note: entry.note ?? "",
    });
  });

  const layers = workbook.addWorksheet("By Layer");
  layers.columns = [
    { header: "Layer", key: "layer", width: 18 },
    { header: "Status", key: "status", width: 14 },
    { header: "Detail", key: "detail", width: 22 },
    { header: "Amount", key: "amount", width: 16 },
    { header: "Share %", key: "share", width: 12 },
  ];
  snapshot.layers.forEach((layer) => {
    layers.addRow({
      layer: layer.name,
      status: layer.statusLabel,
      detail: layer.detail,
      amount: layer.amount,
      share: layer.sharePct,
    });
  });

  return workbook;
}

export async function buildAdminRevenuePdf(snapshot: AdminRevenueSnapshot) {
  const PDFDocument = (await import("pdfkit")).default;
  const doc = new PDFDocument({ margin: 42, size: "A4" });
  const chunks: Buffer[] = [];

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).text("Revenue Command");
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor("#666666").text(`Generated ${new Date(snapshot.generatedAt).toLocaleString()}`);
    doc.fillColor("#111111");
    doc.moveDown(0.8);
    doc.fontSize(12).text(snapshot.supervisor);
    doc.moveDown(0.4);
    doc.fontSize(13).text(snapshot.summary.text, { lineGap: 4 });
    doc.moveDown(1);

    const kpis = [
      ["MRR", fmtMoney(snapshot.kpis.mrr)],
      ["ARR", fmtMoney(snapshot.kpis.arr)],
      ["Growth", fmtPct(snapshot.kpis.growthPct)],
      ["Stripe", snapshot.kpis.stripeStatus],
      ["Churn", `${snapshot.kpis.churnPct.toFixed(1)}%`],
    ];

    kpis.forEach(([label, value]) => {
      doc.fontSize(10).fillColor("#666666").text(label);
      doc.fontSize(16).fillColor("#111111").text(value);
      doc.moveDown(0.3);
    });

    doc.moveDown(0.8);
    doc.fontSize(14).text("Monthly Trend");
    snapshot.chart.series.forEach((entry) => {
      doc.fontSize(10).fillColor("#111111").text(
        `${entry.fullLabel}: actual ${entry.actual == null ? "-" : fmtMoney(entry.actual)} | forecast ${entry.forecast == null ? "-" : fmtMoney(entry.forecast)}`
      );
      if (entry.note) {
        doc.fontSize(9).fillColor("#666666").text(`Note: ${entry.note}`);
      }
    });

    doc.moveDown(0.8);
    doc.fontSize(14).fillColor("#111111").text("By Layer");
    snapshot.layers.forEach((layer) => {
      doc.fontSize(10).text(
        `${layer.name} (${layer.statusLabel}) - ${fmtMoney(layer.amount)} - ${layer.sharePct}% - ${layer.detail}`
      );
    });

    doc.end();
  });

  return buffer;
}

export async function sendAdminRevenueReport(snapshot: AdminRevenueSnapshot, recipients: string[]) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  if (!recipients.length) {
    throw new Error("No admin email recipients configured");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? "Winners Ecosystem <noreply@winners.local>";

  const html = `
    <div style="font-family:Arial,sans-serif;background:#0b1220;color:#f4f7fb;padding:28px">
      <div style="max-width:720px;margin:0 auto;border:1px solid rgba(201,168,76,0.28);border-left:6px solid #c9a84c;border-radius:18px;background:#101826;padding:28px">
        <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#c9a84c;margin-bottom:10px">${snapshot.supervisor}</div>
        <h1 style="margin:0 0 10px;font-size:30px;font-family:Georgia,serif;color:#f7f1df">Revenue Command</h1>
        <p style="margin:0 0 18px;color:#c7d2e0;line-height:1.7">${snapshot.summary.text}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px">
          ${[
            ["MRR", fmtMoney(snapshot.kpis.mrr)],
            ["ARR", fmtMoney(snapshot.kpis.arr)],
            ["Growth", fmtPct(snapshot.kpis.growthPct)],
            ["Churn", `${snapshot.kpis.churnPct.toFixed(1)}%`],
            ["Stripe", snapshot.kpis.stripeStatus],
          ]
            .map(
              ([label, value]) => `
                <div style="flex:1 1 140px;min-width:140px;border:1px solid rgba(255,255,255,0.08);border-radius:14px;background:#0c1422;padding:14px 16px">
                  <div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#8da2bb;margin-bottom:8px">${label}</div>
                  <div style="font-size:22px;font-family:Georgia,serif;color:#f4f7fb">${value}</div>
                </div>`
            )
            .join("")}
        </div>
        <h2 style="font-size:15px;color:#c9a84c;margin:0 0 10px">By Layer</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px;color:#d8e0ea">
          <tr>
            <th align="left" style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.08)">Layer</th>
            <th align="left" style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.08)">Status</th>
            <th align="right" style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.08)">Amount</th>
          </tr>
          ${snapshot.layers
            .map(
              (layer) => `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">${layer.name} <span style="color:#8da2bb">(${layer.detail})</span></td>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">${layer.statusLabel}</td>
                  <td align="right" style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">${fmtMoney(layer.amount)}</td>
                </tr>`
            )
            .join("")}
        </table>
      </div>
    </div>
  `;

  await resend.emails.send({
    from,
    to: recipients,
    subject: `Revenue Command - ${snapshot.summary.monthLabel}`,
    html,
  });

  return { recipients: recipients.length };
}
