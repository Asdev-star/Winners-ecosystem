// src/lib/analyticsEngine.ts

export type Period = "7d" | "30d" | "90d";

export interface DataPoint {
  date: string;
  revenue: number;
  activity: number;
}

export interface ForecastPoint extends DataPoint {
  forecastRevenue?: number;
  upperBound?: number;
  lowerBound?: number;
  isAnomaly?: boolean;
}

export interface InsightSummary {
  trend: "up" | "down" | "flat";
  revenueGrowth: number;
  activityGrowth: number;
  anomalyCount: number;
  forecastGrowth: number;
  topInsight: string;
  secondaryInsight: string;
}

// ─── Mock Data Generator ──────────────────────────────────────────────────────

function generateBase(days: number, seedRevenue = 4200, seedActivity = 140): DataPoint[] {
  const points: DataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const trend = (days - i) / days; // 0 → 1 growth trend
    const noise = () => (Math.random() - 0.48) * 0.18;
    const spike = Math.random() > 0.91 ? 1.45 : 1; // ~9% chance of spike

    points.push({
      date: label,
      revenue: Math.round(seedRevenue * (1 + trend * 0.35 + noise()) * spike),
      activity: Math.round(seedActivity * (1 + trend * 0.25 + noise()) * spike),
    });
  }
  return points;
}

export function getMockData(period: Period): DataPoint[] {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return generateBase(days);
}

export function getPreviousPeriodData(period: Period): DataPoint[] {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return generateBase(days, 3600, 118); // lower baseline = previous period
}

// ─── Calculators ──────────────────────────────────────────────────────────────

export function calcTotal(data: DataPoint[], key: keyof Pick<DataPoint, "revenue" | "activity">): number {
  return data.reduce((sum, d) => sum + d[key], 0);
}

export function calcGrowth(current: number, previous: number): number {
  if (previous === 0) return 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(1));
}

export function calcAverage(data: DataPoint[], key: keyof Pick<DataPoint, "revenue" | "activity">): number {
  return Math.round(calcTotal(data, key) / data.length);
}

// ─── Anomaly Detection (7-day rolling spike) ──────────────────────────────────

export function detectAnomalies(data: DataPoint[], windowSize = 7, threshold = 1.6): Set<number> {
  const anomalies = new Set<number>();
  if (data.length < windowSize) return anomalies;

  for (let i = windowSize; i < data.length; i++) {
    const window = data.slice(i - windowSize, i).map((d) => d.revenue);
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    const std = Math.sqrt(window.map((v) => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / window.length);
    const zScore = std > 0 ? Math.abs(data[i].revenue - mean) / std : 0;
    if (zScore > threshold) anomalies.add(i);
  }
  return anomalies;
}

// ─── Forecast Generator ───────────────────────────────────────────────────────

export function generateForecast(data: DataPoint[], forecastDays = 7): ForecastPoint[] {
  const result: ForecastPoint[] = data.map((d) => ({ ...d }));
  if (data.length < 3) return result;

  // Simple linear regression on revenue
  const n = data.length;
  const xs = data.map((_, i) => i);
  const ys = data.map((d) => d.revenue);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Std dev for confidence band
  const residuals = ys.map((y, i) => y - (slope * i + intercept));
  const stdDev = Math.sqrt(residuals.map((r) => r * r).reduce((a, b) => a + b, 0) / n);

  // Mark anomalies
  const anomalySet = detectAnomalies(data);
  result.forEach((p, i) => { p.isAnomaly = anomalySet.has(i); });

  // Append forecast points
  const lastDate = new Date();
  for (let f = 1; f <= forecastDays; f++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + f);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const xi = n + f - 1;
    const forecastRevenue = Math.round(slope * xi + intercept);
    const confidence = stdDev * 1.2 * (1 + f * 0.08); // widen band over time

    result.push({
      date: label,
      revenue: 0,
      activity: 0,
      forecastRevenue,
      upperBound: Math.round(forecastRevenue + confidence),
      lowerBound: Math.round(Math.max(0, forecastRevenue - confidence)),
    });
  }

  return result;
}

// ─── Insight Generator ────────────────────────────────────────────────────────

export function generateInsights(
  current: DataPoint[],
  previous: DataPoint[],
  period: Period
): InsightSummary {
  const curRevTotal = calcTotal(current, "revenue");
  const prevRevTotal = calcTotal(previous, "revenue");
  const curActTotal = calcTotal(current, "activity");
  const prevActTotal = calcTotal(previous, "activity");

  const revenueGrowth = calcGrowth(curRevTotal, prevRevTotal);
  const activityGrowth = calcGrowth(curActTotal, prevActTotal);
  const anomalyCount = detectAnomalies(current).size;

  const forecastData = generateForecast(current, 7);
  const forecastPoints = forecastData.filter((d) => d.forecastRevenue !== undefined);
  const lastForecast = forecastPoints[forecastPoints.length - 1]?.forecastRevenue ?? curRevTotal / current.length;
  const avgCurrent = calcAverage(current, "revenue");
  const forecastGrowth = calcGrowth(lastForecast, avgCurrent);

  const trend: "up" | "down" | "flat" =
    revenueGrowth > 2 ? "up" : revenueGrowth < -2 ? "down" : "flat";

  const label = period === "7d" ? "week" : period === "30d" ? "month" : "quarter";

  const topInsight =
    trend === "up"
      ? `Revenue is up ${revenueGrowth}% vs last ${label} — strong momentum.`
      : trend === "down"
      ? `Revenue dipped ${Math.abs(revenueGrowth)}% vs last ${label} — monitor closely.`
      : `Revenue is stable vs last ${label} — consistent performance.`;

  const secondaryInsight =
    anomalyCount > 0
      ? `${anomalyCount} spike${anomalyCount > 1 ? "s" : ""} detected — review flagged days for campaigns or anomalies.`
      : activityGrowth > 0
      ? `Activity up ${activityGrowth}% — engagement tracking positively with revenue.`
      : `Activity down ${Math.abs(activityGrowth)}% — consider investigating drop-off points.`;

  return {
    trend,
    revenueGrowth,
    activityGrowth,
    anomalyCount,
    forecastGrowth,
    topInsight,
    secondaryInsight,
  };
}