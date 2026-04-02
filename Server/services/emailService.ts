// Server/services/emailService.ts

import { Resend } from "resend";
import db from "../db.js";
import { logEmailDelivery } from "./emailTelemetryService.js";

const FROM = process.env.EMAIL_FROM ?? "Winners Ecosystem <reports@yourdomain.com>";
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  return new Resend(process.env.RESEND_API_KEY);
}

async function sendTrackedEmail(params: {
  tenantId: string;
  action: string;
  source: string;
  to: string[];
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
}) {
  const resend = getResend();
  const result = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  await logEmailDelivery({
    tenantId: params.tenantId,
    action: params.action,
    recipients: params.to,
    source: params.source,
    metadata: {
      subject: params.subject,
      resendId:
        typeof result === "object" && result && "data" in result
          ? (result as { data?: { id?: string } }).data?.id ?? null
          : null,
      ...(params.metadata ?? {}),
    },
  });

  return result;
}

function dateFrom(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calcGrowth(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Number.parseFloat((((current - previous) / previous) * 100).toFixed(1));
}

function fmt(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toLocaleString()}`;
}

function growthBadge(value: number): string {
  const color = value > 0 ? "#2DD4A0" : value < 0 ? "#E05A4E" : "#5A6878";
  const label = value > 0 ? "UP" : value < 0 ? "DOWN" : "FLAT";
  return `<span style="color:${color};font-weight:700">${label} ${Math.abs(value).toFixed(1)}%</span>`;
}

function baseTemplate(title: string, preheader: string, body: string): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#080B10;font-family:Arial,sans-serif;color:#E8EDF2">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">
    <div style="border-bottom:1px solid #1E2A38;padding-bottom:20px;margin-bottom:28px">
      <span style="font-family:monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#C9A84C">
        WINNERS ECOSYSTEM
      </span>
    </div>
    <div style="display:none;max-height:0;overflow:hidden">${preheader}</div>
    <h1 style="font-size:24px;font-weight:700;letter-spacing:-0.4px;margin:0 0 6px">${title}</h1>
    <p style="font-family:monospace;font-size:11px;color:#5A6878;margin:0 0 28px">
      Generated ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
    </p>
    ${body}
    <div style="border-top:1px solid #1E2A38;padding-top:20px;margin-top:32px">
      <p style="font-family:monospace;font-size:10px;color:#5A6878;margin:0">
        Winners Ecosystem |
        <a href="${APP_URL}" style="color:#C9A84C;text-decoration:none">Open Dashboard</a> |
        <a href="${APP_URL}/settings" style="color:#5A6878;text-decoration:none">Manage notifications</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function sectionTitle(text: string): string {
  return `<h2 style="font-size:13px;font-weight:700;color:#C9A84C;letter-spacing:1px;text-transform:uppercase;margin:28px 0 12px;border-bottom:1px solid #1E2A38;padding-bottom:8px">${text}</h2>`;
}

function kpiCard(label: string, value: string, growth?: number): string {
  return `<div style="background:#0D1117;border:1px solid #1E2A38;border-radius:6px;padding:16px 18px;flex:1;min-width:120px">
    <div style="font-family:monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#5A6878;margin-bottom:8px">${label}</div>
    <div style="font-size:22px;font-weight:700;margin-bottom:4px">${value}</div>
    ${growth !== undefined ? `<div style="font-family:monospace;font-size:11px">${growthBadge(growth)} vs prev period</div>` : ""}
  </div>`;
}

async function getRevenueData(tenantId: string, days: number) {
  const [current, previous] = await Promise.all([
    db.revenueRecord.findMany({
      where: { tenantId, recordedAt: { gte: dateFrom(days) } },
      orderBy: { recordedAt: "asc" },
    }),
    db.revenueRecord.findMany({
      where: { tenantId, recordedAt: { gte: dateFrom(days * 2), lt: dateFrom(days) } },
      orderBy: { recordedAt: "asc" },
    }),
  ]);

  const currentTotal = current.reduce((sum, row) => sum + row.amount, 0);
  const previousTotal = previous.reduce((sum, row) => sum + row.amount, 0);

  return {
    current,
    currentTotal,
    previousTotal,
    growth: calcGrowth(currentTotal, previousTotal),
  };
}

async function getActivityData(tenantId: string, days: number) {
  const [current, previous] = await Promise.all([
    db.analyticsEvent.findMany({
      where: { tenantId, createdAt: { gte: dateFrom(days) } },
    }),
    db.analyticsEvent.findMany({
      where: { tenantId, createdAt: { gte: dateFrom(days * 2), lt: dateFrom(days) } },
    }),
  ]);

  const currentTotal = current.length;
  const previousTotal = previous.length;

  return {
    currentTotal,
    previousTotal,
    growth: calcGrowth(currentTotal, previousTotal),
  };
}

async function getTeamData(tenantId: string) {
  return db.user.findMany({
    where: { tenantId, deletedAt: null },
    select: { name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

async function getTenantInfo(tenantId: string) {
  return db.tenant.findFirst({ where: { id: tenantId } });
}

async function detectRevenueAnomalies(tenantId: string) {
  const rows = await db.revenueRecord.findMany({
    where: { tenantId, recordedAt: { gte: dateFrom(30) } },
    orderBy: { recordedAt: "asc" },
  });

  const amounts = rows.map((row) => row.amount);
  const mean = amounts.reduce((sum, amount) => sum + amount, 0) / (amounts.length || 1);
  const stdDev = Math.sqrt(
    amounts
      .map((amount) => Math.pow(amount - mean, 2))
      .reduce((sum, amount) => sum + amount, 0) / (amounts.length || 1)
  );

  return rows.filter((row) => stdDev > 0 && Math.abs(row.amount - mean) / stdDev > 1.8);
}

export async function sendWeeklyRevenueSummary(tenantId: string, to: string[]) {
  const [revenue, activity, tenant] = await Promise.all([
    getRevenueData(tenantId, 7),
    getActivityData(tenantId, 7),
    getTenantInfo(tenantId),
  ]);

  const body = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px">
      ${kpiCard("Weekly Revenue", fmt(revenue.currentTotal), revenue.growth)}
      ${kpiCard("Weekly Activity", activity.currentTotal.toLocaleString(), activity.growth)}
      ${kpiCard("Avg Daily Revenue", fmt(Math.round(revenue.currentTotal / 7)))}
    </div>
    ${sectionTitle("Revenue Breakdown")}
    <table style="width:100%;border-collapse:collapse;font-family:monospace;font-size:11px">
      <tr style="color:#5A6878;border-bottom:1px solid #1E2A38">
        <td style="padding:6px 4px">Date</td>
        <td style="padding:6px 4px;text-align:right">Revenue</td>
      </tr>
      ${revenue.current
        .slice(-7)
        .map(
          (row) => `
        <tr style="border-bottom:1px solid #0D1117">
          <td style="padding:8px 4px;color:#E8EDF2">${row.recordedAt.toLocaleDateString()}</td>
          <td style="padding:8px 4px;text-align:right;color:#C9A84C;font-weight:700">${fmt(row.amount)}</td>
        </tr>`
        )
        .join("")}
    </table>
    <div style="margin-top:24px;background:#0D1117;border:1px solid #1E2A38;border-radius:6px;padding:16px">
      <p style="margin:0;font-size:13px;line-height:1.6;color:#5A6878">
        <strong style="color:#E8EDF2">Week in review:</strong>
        ${
          revenue.growth > 0
            ? `Revenue is up ${revenue.growth}% compared to the prior week.`
            : revenue.growth < 0
              ? `Revenue is down ${Math.abs(revenue.growth)}% compared to the prior week.`
              : "Revenue is flat compared to the prior week."
        }
      </p>
    </div>`;

  return sendTrackedEmail({
    tenantId,
    action: "Weekly revenue summary sent",
    source: "weekly_report",
    to,
    subject: `Weekly Report - ${tenant?.name ?? "Workspace"} - ${fmt(revenue.currentTotal)}`,
    html: baseTemplate(
      "Weekly Revenue Summary",
      `Your workspace made ${fmt(revenue.currentTotal)} this week`,
      body
    ),
    metadata: {
      revenueTotal: revenue.currentTotal,
      tenantName: tenant?.name ?? "Workspace",
    },
  });
}

export async function sendOrderConfirmationEmail(
  tenantId: string,
  to: string,
  order: {
    id: string;
    orderNumber: string;
    total: number;
    currency: string;
    items: Array<{ name: string; quantity: number; price: number }>;
  }
) {
  const tenant = await getTenantInfo(tenantId);
  const totalStr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: order.currency.toUpperCase(),
  }).format(order.total);

  const body = `
    <div style="background:#0D1117;border:1px solid #1E2A38;border-radius:6px;padding:24px;margin-bottom:24px">
      <div style="font-family:monospace;font-size:10px;color:#5A6878;margin-bottom:8px">ORDER CONFIRMED</div>
      <div style="font-size:24px;font-weight:700;color:#E8EDF2;margin-bottom:4px">Order #${order.orderNumber}</div>
      <div style="font-family:monospace;font-size:11px;color:#5A6878">Thank you for your purchase! Your order is being processed.</div>
    </div>

    ${sectionTitle("Order Summary")}
    <table style="width:100%;border-collapse:collapse;font-family:monospace;font-size:11px">
      <tr style="color:#5A6878;border-bottom:1px solid #1E2A38">
        <td style="padding:6px 4px">Item</td>
        <td style="padding:6px 4px;text-align:center">Qty</td>
        <td style="padding:6px 4px;text-align:right">Price</td>
      </tr>
      ${order.items
        .map(
          (item) => `
        <tr style="border-bottom:1px solid #0D1117">
          <td style="padding:10px 4px;color:#E8EDF2;font-weight:700">${item.name}</td>
          <td style="padding:10px 4px;text-align:center;color:#E8EDF2">${item.quantity}</td>
          <td style="padding:10px 4px;text-align:right;color:#E8EDF2">${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: order.currency.toUpperCase(),
          }).format(item.price)}</td>
        </tr>`
        )
        .join("")}
      <tr>
        <td colspan="2" style="padding:16px 4px;color:#5A6878;font-weight:700">TOTAL</td>
        <td style="padding:16px 4px;text-align:right;color:#C9A84C;font-weight:700;font-size:16px">${totalStr}</td>
      </tr>
    </table>

    <div style="margin-top:24px;text-align:center">
      <a href="${APP_URL}/market/orders" style="display:inline-block;background:#C9A84C;color:#080B10;text-decoration:none;padding:12px 28px;border-radius:4px;font-weight:700;font-size:13px">
        View Your Orders
      </a>
    </div>`;

  return sendTrackedEmail({
    tenantId,
    action: "Order confirmation sent",
    source: "order_confirmation",
    to: [to],
    subject: `Order Confirmation - #${order.orderNumber} - ${tenant?.name ?? "Workspace"}`,
    html: baseTemplate(
      "Order Confirmed",
      "We've received your order and it's being processed.",
      body
    ),
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      tenantName: tenant?.name ?? "Workspace",
    },
  });
}

export async function sendMonthlyFullReport(tenantId: string, to: string[]) {
  const [revenue, activity, team, tenant] = await Promise.all([
    getRevenueData(tenantId, 30),
    getActivityData(tenantId, 30),
    getTeamData(tenantId),
    getTenantInfo(tenantId),
  ]);

  const body = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px">
      ${kpiCard("Monthly Revenue", fmt(revenue.currentTotal), revenue.growth)}
      ${kpiCard("Monthly Activity", activity.currentTotal.toLocaleString(), activity.growth)}
      ${kpiCard("Team Members", String(team.length))}
      ${kpiCard("Avg Daily Revenue", fmt(Math.round(revenue.currentTotal / 30)))}
    </div>
    ${sectionTitle("Team")}
    <table style="width:100%;border-collapse:collapse;font-family:monospace;font-size:11px">
      <tr style="color:#5A6878;border-bottom:1px solid #1E2A38">
        <td style="padding:6px 4px">Member</td>
        <td style="padding:6px 4px">Role</td>
        <td style="padding:6px 4px;text-align:right">Joined</td>
      </tr>
      ${team
        .map(
          (user) => `
        <tr style="border-bottom:1px solid #0D1117">
          <td style="padding:8px 4px">
            <div style="color:#E8EDF2;font-weight:700">${user.name}</div>
            <div style="color:#5A6878;font-size:10px">${user.email}</div>
          </td>
          <td style="padding:8px 4px;color:#C9A84C;text-transform:uppercase;font-size:10px">${user.role.toLowerCase()}</td>
          <td style="padding:8px 4px;text-align:right;color:#5A6878">${user.createdAt.toLocaleDateString()}</td>
        </tr>`
        )
        .join("")}
    </table>
    <div style="margin-top:24px;text-align:center">
      <a href="${APP_URL}/export" style="display:inline-block;background:#C9A84C;color:#080B10;text-decoration:none;padding:12px 28px;border-radius:4px;font-weight:700;font-size:13px">
        Download Full Report
      </a>
    </div>`;

  return sendTrackedEmail({
    tenantId,
    action: "Monthly full report sent",
    source: "monthly_report",
    to,
    subject: `Monthly Report - ${tenant?.name ?? "Workspace"} - ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    html: baseTemplate(
      "Monthly Full Report",
      `Your ${new Date().toLocaleDateString("en-US", { month: "long" })} analytics report is ready`,
      body
    ),
    metadata: {
      revenueTotal: revenue.currentTotal,
      tenantName: tenant?.name ?? "Workspace",
    },
  });
}

export async function sendAnomalyAlert(tenantId: string, to: string[]) {
  const [anomalies, tenant] = await Promise.all([
    detectRevenueAnomalies(tenantId),
    getTenantInfo(tenantId),
  ]);

  if (anomalies.length === 0) return null;

  const body = `
    <div style="background:rgba(224,90,78,0.08);border:1px solid rgba(224,90,78,0.25);border-radius:6px;padding:16px 18px;margin-bottom:24px">
      <div style="font-weight:700;color:#E05A4E;margin-bottom:4px">${anomalies.length} anomal${anomalies.length === 1 ? "y" : "ies"} detected in the last 30 days</div>
      <div style="font-family:monospace;font-size:11px;color:#5A6878">These revenue spikes or drops are statistically significant and may need investigation.</div>
    </div>
    ${sectionTitle("Anomalous Days")}
    <table style="width:100%;border-collapse:collapse;font-family:monospace;font-size:11px">
      <tr style="color:#5A6878;border-bottom:1px solid #1E2A38">
        <td style="padding:6px 4px">Date</td>
        <td style="padding:6px 4px;text-align:right">Revenue</td>
        <td style="padding:6px 4px;text-align:right">Type</td>
      </tr>
      ${anomalies
        .map(
          (row) => `
        <tr style="border-bottom:1px solid #0D1117">
          <td style="padding:8px 4px;color:#E8EDF2">${row.recordedAt.toLocaleDateString()}</td>
          <td style="padding:8px 4px;text-align:right;color:#C9A84C;font-weight:700">${fmt(row.amount)}</td>
          <td style="padding:8px 4px;text-align:right"><span style="color:#E05A4E;font-size:10px;text-transform:uppercase;letter-spacing:1px">Anomaly</span></td>
        </tr>`
        )
        .join("")}
    </table>
    <div style="margin-top:20px;text-align:center">
      <a href="${APP_URL}/analytics" style="display:inline-block;background:#E05A4E;color:#fff;text-decoration:none;padding:10px 24px;border-radius:4px;font-weight:700;font-size:13px">
        Investigate
      </a>
    </div>`;

  return sendTrackedEmail({
    tenantId,
    action: "Revenue anomaly alert sent",
    source: "anomaly_alert",
    to,
    subject: `Revenue Anomaly Alert - ${anomalies.length} spike${anomalies.length > 1 ? "s" : ""} detected - ${tenant?.name ?? "Workspace"}`,
    html: baseTemplate(
      "Revenue Anomaly Alert",
      `${anomalies.length} unusual revenue days detected in your workspace`,
      body
    ),
    metadata: {
      anomalyCount: anomalies.length,
      tenantName: tenant?.name ?? "Workspace",
    },
  });
}

export async function sendTeamActivityDigest(tenantId: string, to: string[]) {
  const [team, activity, tenant] = await Promise.all([
    getTeamData(tenantId),
    getActivityData(tenantId, 7),
    getTenantInfo(tenantId),
  ]);

  const recentJoins = team.filter((user) => user.createdAt > dateFrom(7));

  const body = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px">
      ${kpiCard("Team Size", String(team.length))}
      ${kpiCard("New Joins", String(recentJoins.length))}
      ${kpiCard("Weekly Activity", activity.currentTotal.toLocaleString(), activity.growth)}
    </div>
    ${
      recentJoins.length > 0
        ? `
      ${sectionTitle("New Members This Week")}
      ${recentJoins
        .map((user) => {
          const initials = user.name
            .split(" ")
            .map((part) => part[0] ?? "")
            .join("")
            .slice(0, 2)
            .toUpperCase();
          return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #1E2A38">
            <div style="width:32px;height:32px;border-radius:50%;background:rgba(201,168,76,0.12);color:#C9A84C;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0">${initials}</div>
            <div>
              <div style="font-weight:700;font-size:13px">${user.name}</div>
              <div style="font-family:monospace;font-size:10px;color:#5A6878">${user.email} | ${user.role.toLowerCase()}</div>
            </div>
          </div>`;
        })
        .join("")}
    `
        : ""
    }
    ${sectionTitle("Full Team")}
    <table style="width:100%;border-collapse:collapse;font-family:monospace;font-size:11px">
      ${team
        .map(
          (user) => `
        <tr style="border-bottom:1px solid #0D1117">
          <td style="padding:8px 4px;color:#E8EDF2;font-weight:700">${user.name}</td>
          <td style="padding:8px 4px;color:#5A6878">${user.email}</td>
          <td style="padding:8px 4px;color:#C9A84C;text-transform:uppercase;font-size:10px">${user.role.toLowerCase()}</td>
        </tr>`
        )
        .join("")}
    </table>`;

  return sendTrackedEmail({
    tenantId,
    action: "Team activity digest sent",
    source: "team_digest",
    to,
    subject: `Team Digest - ${tenant?.name ?? "Workspace"} - ${team.length} members`,
    html: baseTemplate(
      "Team Activity Digest",
      `${team.length} members, ${recentJoins.length} new joins this week`,
      body
    ),
    metadata: {
      teamCount: team.length,
      tenantName: tenant?.name ?? "Workspace",
    },
  });
}

export async function sendBillingInvoiceEmail(
  tenantId: string,
  to: string[],
  invoiceData?: { amount: number; period: string; invoiceId: string }
) {
  const tenant = await getTenantInfo(tenantId);
  const defaultAmount = tenant?.plan === "PRO" ? 99 : tenant?.plan === "ENTERPRISE" ? 299 : 0;
  const amount = invoiceData?.amount ?? defaultAmount;
  const period =
    invoiceData?.period ??
    new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const invoiceId = invoiceData?.invoiceId ?? `INV-${Date.now()}`;

  const body = `
    <div style="background:#0D1117;border:1px solid #1E2A38;border-radius:6px;padding:24px;margin-bottom:24px;text-align:center">
      <div style="font-family:monospace;font-size:10px;color:#5A6878;margin-bottom:8px">AMOUNT DUE</div>
      <div style="font-size:48px;font-weight:700;color:#C9A84C;letter-spacing:-2px">$${amount}</div>
      <div style="font-family:monospace;font-size:11px;color:#5A6878;margin-top:4px">${period}</div>
    </div>
    ${sectionTitle("Invoice Details")}
    <table style="width:100%;border-collapse:collapse;font-family:monospace;font-size:11px">
      ${[
        ["Workspace", tenant?.name ?? ""],
        ["Plan", tenant?.plan ?? ""],
        ["Period", period],
        ["Invoice ID", invoiceId],
        ["Status", "Paid"],
      ]
        .map(
          ([label, value]) => `
        <tr style="border-bottom:1px solid #1E2A38">
          <td style="padding:10px 4px;color:#5A6878">${label}</td>
          <td style="padding:10px 4px;text-align:right;color:#E8EDF2;font-weight:700">${value}</td>
        </tr>`
        )
        .join("")}
    </table>
    <div style="margin-top:24px;text-align:center">
      <a href="${APP_URL}/billing" style="display:inline-block;background:#C9A84C;color:#080B10;text-decoration:none;padding:12px 28px;border-radius:4px;font-weight:700;font-size:13px">
        View Billing
      </a>
    </div>`;

  return sendTrackedEmail({
    tenantId,
    action: "Billing invoice sent",
    source: "billing_invoice",
    to,
    subject: `Invoice - ${tenant?.name ?? "Workspace"} - $${amount} - ${period}`,
    html: baseTemplate("Invoice Receipt", `Your invoice for ${period} is ready`, body),
    metadata: {
      tenantName: tenant?.name ?? "Workspace",
      amount,
      period,
      invoiceId,
    },
  });
}
