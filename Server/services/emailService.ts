// Server/services/emailService.ts

import { Resend } from "resend";
import db from "../db.js";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM    = process.env.EMAIL_FROM ?? "Winners Ecosystem <reports@yourdomain.com>";
const APP_URL = process.env.APP_URL    ?? "http://localhost:5173";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateFrom(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calcGrowth(cur: number, prev: number) {
  if (prev === 0) return 0;
  return parseFloat((((cur - prev) / prev) * 100).toFixed(1));
}

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function growthBadge(n: number) {
  const color = n > 0 ? "#2DD4A0" : n < 0 ? "#FF5975" : "#5A6878";
  const arrow = n > 0 ? "▲" : n < 0 ? "▼" : "–";
  return `<span style="color:${color};font-weight:700">${arrow} ${Math.abs(n).toFixed(1)}%</span>`;
}

// ─── Base email wrapper ───────────────────────────────────────────────────────

function baseTemplate(title: string, preheader: string, body: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#080B10;font-family:'Helvetica Neue',Arial,sans-serif;color:#E8EDF2">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">
    <div style="border-bottom:1px solid #1E2A38;padding-bottom:20px;margin-bottom:28px;display:flex;align-items:center;gap:10px">
      <div style="width:8px;height:8px;border-radius:50%;background:#F5C842;box-shadow:0 0 8px #F5C842;display:inline-block"></div>
      <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#F5C842;margin-left:8px">WINNERS ECOSYSTEM</span>
    </div>
    <div style="display:none;max-height:0;overflow:hidden">${preheader}</div>
    <h1 style="font-size:24px;font-weight:800;letter-spacing:-0.5px;margin:0 0 6px">${title}</h1>
    <p style="font-family:'Courier New',monospace;font-size:11px;color:#5A6878;margin:0 0 28px">
      Generated ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
    </p>
    ${body}
    <div style="border-top:1px solid #1E2A38;padding-top:20px;margin-top:32px">
      <p style="font-family:'Courier New',monospace;font-size:10px;color:#5A6878;margin:0">
        Winners Ecosystem · <a href="${APP_URL}" style="color:#F5C842;text-decoration:none">Open Dashboard</a> ·
        <a href="${APP_URL}/settings" style="color:#5A6878;text-decoration:none">Manage notifications</a>
      </p>
    </div>
  </div>
</body></html>`;
}

function kpiCard(label: string, value: string, growth?: number) {
  return `<div style="background:#0D1117;border:1px solid #1E2A38;border-radius:6px;padding:16px 18px;flex:1;min-width:120px">
    <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#5A6878;margin-bottom:8px">${label}</div>
    <div style="font-size:22px;font-weight:800;margin-bottom:4px">${value}</div>
    ${growth !== undefined ? `<div style="font-family:'Courier New',monospace;font-size:11px">${growthBadge(growth)} vs prev period</div>` : ""}
  </div>`;
}

function sectionTitle(text: string) {
  return `<h2 style="font-size:14px;font-weight:700;color:#F5C842;letter-spacing:1px;text-transform:uppercase;margin:28px 0 12px;border-bottom:1px solid #1E2A38;padding-bottom:8px">${text}</h2>`;
}

// ─── Data fetchers ─────────────────────────────────────────────────────────────

async function getRevenueData(tenantId: string, days: number) {
  const [cur, prev] = await Promise.all([
    db.revenueRecord.findMany({ where: { tenantId, date: { gte: dateFrom(days) } }, orderBy: { date: "asc" } }),
    db.revenueRecord.findMany({ where: { tenantId, date: { gte: dateFrom(days * 2), lt: dateFrom(days) } } }),
  ]);
  const curTotal  = cur.reduce((s, r) => s + r.amount, 0);
  const prevTotal = prev.reduce((s, r) => s + r.amount, 0);
  return { cur, curTotal, prevTotal, growth: calcGrowth(curTotal, prevTotal) };
}

async function getActivityData(tenantId: string, days: number) {
  const [cur, prev] = await Promise.all([
    db.analyticsEvent.findMany({ where: { tenantId, date: { gte: dateFrom(days) } } }),
    db.analyticsEvent.findMany({ where: { tenantId, date: { gte: dateFrom(days * 2), lt: dateFrom(days) } } }),
  ]);
  const curTotal  = cur.reduce((s, a) => s + a.count, 0);
  const prevTotal = prev.reduce((s, a) => s + a.count, 0);
  return { curTotal, prevTotal, growth: calcGrowth(curTotal, prevTotal) };
}

async function getTeamData(tenantId: string) {
  return db.user.findMany({
    where:   { tenantId, deletedAt: null },
    select:  { name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

async function getTenantInfo(tenantId: string) {
  return db.tenant.findFirst({ where: { id: tenantId } });
}

async function detectAnomalies(tenantId: string) {
  const records = await db.revenueRecord.findMany({
    where:   { tenantId, date: { gte: dateFrom(30) } },
    orderBy: { date: "asc" },
  });
  const amounts = records.map((r) => r.amount);
  const mean    = amounts.reduce((a, b) => a + b, 0) / (amounts.length || 1);
  const std     = Math.sqrt(amounts.map((v) => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / (amounts.length || 1));
  return records.filter((r) => std > 0 && Math.abs(r.amount - mean) / std > 1.8);
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export async function sendWeeklyRevenueSummary(tenantId: string, to: string[]) {
  const [revenue, activity, tenant] = await Promise.all([
    getRevenueData(tenantId, 7),
    getActivityData(tenantId, 7),
    getTenantInfo(tenantId),
  ]);

  const body = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px">
      ${kpiCard("Weekly Revenue",  fmt(revenue.curTotal),    revenue.growth)}
      ${kpiCard("Weekly Activity", revenue.curTotal > 0 ? activity.curTotal.toLocaleString() : "–", activity.growth)}
      ${kpiCard("Avg Daily Rev",   fmt(Math.round(revenue.curTotal / 7)))}
    </div>
    ${sectionTitle("Revenue Breakdown")}
    <table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:11px">
      <tr style="color:#5A6878;border-bottom:1px solid #1E2A38">
        <td style="padding:6px 4px">Date</td>
        <td style="padding:6px 4px;text-align:right">Revenue</td>
      </tr>
      ${revenue.cur.slice(-7).map((r) => `
        <tr style="border-bottom:1px solid #0D1117">
          <td style="padding:8px 4px;color:#E8EDF2">${r.date.toLocaleDateString()}</td>
          <td style="padding:8px 4px;text-align:right;color:#F5C842;font-weight:700">${fmt(r.amount)}</td>
        </tr>`).join("")}
    </table>
    <div style="margin-top:24px;background:#0D1117;border:1px solid #1E2A38;border-radius:6px;padding:16px">
      <p style="margin:0;font-size:13px;line-height:1.6;color:#5A6878">
        <strong style="color:#E8EDF2">Week in review:</strong>
        ${revenue.growth > 0 ? `Revenue is up ${revenue.growth}% compared to last week — strong performance.` :
          revenue.growth < 0 ? `Revenue dipped ${Math.abs(revenue.growth)}% compared to last week — worth investigating.` :
          "Revenue is holding steady compared to last week."}
      </p>
    </div>`;

  return getResend().emails.send({
    from:    FROM,
    to,
    subject: `📊 Weekly Report — ${tenant?.name ?? "Workspace"} · ${fmt(revenue.curTotal)}`,
    html:    baseTemplate("Weekly Revenue Summary", `Your workspace made ${fmt(revenue.curTotal)} this week`, body),
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
      ${kpiCard("Monthly Revenue",  fmt(revenue.curTotal),              revenue.growth)}
      ${kpiCard("Monthly Activity", activity.curTotal.toLocaleString(), activity.growth)}
      ${kpiCard("Team Members",     String(team.length))}
      ${kpiCard("Avg Daily Rev",    fmt(Math.round(revenue.curTotal / 30)))}
    </div>
    ${sectionTitle("Team")}
    <table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:11px">
      <tr style="color:#5A6878;border-bottom:1px solid #1E2A38">
        <td style="padding:6px 4px">Member</td>
        <td style="padding:6px 4px">Role</td>
        <td style="padding:6px 4px;text-align:right">Joined</td>
      </tr>
      ${team.map((u) => `
        <tr style="border-bottom:1px solid #0D1117">
          <td style="padding:8px 4px">
            <div style="color:#E8EDF2;font-weight:700">${u.name}</div>
            <div style="color:#5A6878;font-size:10px">${u.email}</div>
          </td>
          <td style="padding:8px 4px;color:#F5C842;text-transform:uppercase;font-size:10px">${u.role.toLowerCase()}</td>
          <td style="padding:8px 4px;text-align:right;color:#5A6878">${u.createdAt.toLocaleDateString()}</td>
        </tr>`).join("")}
    </table>
    <div style="margin-top:24px;text-align:center">
      <a href="${APP_URL}/export" style="display:inline-block;background:#F5C842;color:#080B10;text-decoration:none;padding:12px 28px;border-radius:4px;font-weight:700;font-size:13px">
        Download Full Report →
      </a>
    </div>`;

  return getResend().emails.send({
    from:    FROM,
    to,
    subject: `📈 Monthly Report — ${tenant?.name ?? "Workspace"} · ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    html:    baseTemplate("Monthly Full Report", `Your ${new Date().toLocaleDateString("en-US", { month: "long" })} analytics report is ready`, body),
  });
}

export async function sendAnomalyAlert(tenantId: string, to: string[]) {
  const [anomalies, tenant] = await Promise.all([
    detectAnomalies(tenantId),
    getTenantInfo(tenantId),
  ]);

  if (anomalies.length === 0) return null;

  const body = `
    <div style="background:rgba(255,89,117,0.08);border:1px solid rgba(255,89,117,0.25);border-radius:6px;padding:16px 18px;margin-bottom:24px">
      <div style="font-weight:700;color:#FF5975;margin-bottom:4px">⚠️ ${anomalies.length} anomal${anomalies.length === 1 ? "y" : "ies"} detected in the last 30 days</div>
      <div style="font-family:'Courier New',monospace;font-size:11px;color:#5A6878">These revenue spikes or drops are statistically significant and may warrant investigation.</div>
    </div>
    ${sectionTitle("Anomalous Days")}
    <table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:11px">
      <tr style="color:#5A6878;border-bottom:1px solid #1E2A38">
        <td style="padding:6px 4px">Date</td>
        <td style="padding:6px 4px;text-align:right">Revenue</td>
        <td style="padding:6px 4px;text-align:right">Type</td>
      </tr>
      ${anomalies.map((a) => `
        <tr style="border-bottom:1px solid #0D1117">
          <td style="padding:8px 4px;color:#E8EDF2">${a.date.toLocaleDateString()}</td>
          <td style="padding:8px 4px;text-align:right;color:#F5C842;font-weight:700">${fmt(a.amount)}</td>
          <td style="padding:8px 4px;text-align:right">
            <span style="color:#FF5975;font-size:10px;text-transform:uppercase;letter-spacing:1px">Anomaly</span>
          </td>
        </tr>`).join("")}
    </table>
    <div style="margin-top:20px;text-align:center">
      <a href="${APP_URL}/analytics" style="display:inline-block;background:#FF5975;color:#fff;text-decoration:none;padding:10px 24px;border-radius:4px;font-weight:700;font-size:13px">
        Investigate Now →
      </a>
    </div>`;

  return getResend().emails.send({
    from:    FROM,
    to,
    subject: `⚠️ Revenue Anomaly Alert — ${anomalies.length} spike${anomalies.length > 1 ? "s" : ""} detected · ${tenant?.name}`,
    html:    baseTemplate("Revenue Anomaly Alert", `${anomalies.length} unusual revenue days detected in your workspace`, body),
  });
}

export async function sendTeamActivityDigest(tenantId: string, to: string[]) {
  const [team, activity, tenant] = await Promise.all([
    getTeamData(tenantId),
    getActivityData(tenantId, 7),
    getTenantInfo(tenantId),
  ]);

  const recentJoins = team.filter((u) => u.createdAt > dateFrom(7));

  const body = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px">
      ${kpiCard("Team Size",       String(team.length))}
      ${kpiCard("New Joins",       String(recentJoins.length))}
      ${kpiCard("Weekly Activity", activity.curTotal.toLocaleString(), activity.growth)}
    </div>
    ${recentJoins.length > 0 ? `
      ${sectionTitle("New Members This Week")}
      ${recentJoins.map((u) => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #1E2A38">
          <div style="width:32px;height:32px;border-radius:50%;background:rgba(245,200,66,0.12);color:#F5C842;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0">
            ${u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style="font-weight:700;font-size:13px">${u.name}</div>
            <div style="font-family:'Courier New',monospace;font-size:10px;color:#5A6878">${u.email} · ${u.role.toLowerCase()}</div>
          </div>
        </div>`).join("")}
    ` : ""}
    ${sectionTitle("Full Team")}
    <table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:11px">
      ${team.map((u) => `
        <tr style="border-bottom:1px solid #0D1117">
          <td style="padding:8px 4px;color:#E8EDF2;font-weight:700">${u.name}</td>
          <td style="padding:8px 4px;color:#5A6878">${u.email}</td>
          <td style="padding:8px 4px;color:#F5C842;text-transform:uppercase;font-size:10px">${u.role.toLowerCase()}</td>
        </tr>`).join("")}
    </table>`;

  return getResend().emails.send({
    from:    FROM,
    to,
    subject: `👥 Team Digest — ${tenant?.name} · ${team.length} members`,
    html:    baseTemplate("Team Activity Digest", `${team.length} members, ${recentJoins.length} new joins this week`, body),
  });
}

export async function sendBillingInvoiceEmail(tenantId: string, to: string[], invoiceData?: { amount: number; period: string; invoiceId: string }) {
  const tenant = await getTenantInfo(tenantId);
  const amount = invoiceData?.amount ?? (tenant?.plan === "PRO" ? 99 : tenant?.plan === "ENTERPRISE" ? 299 : 0);
  const period = invoiceData?.period ?? new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const body = `
    <div style="background:#0D1117;border:1px solid #1E2A38;border-radius:6px;padding:24px;margin-bottom:24px;text-align:center">
      <div style="font-family:'Courier New',monospace;font-size:10px;color:#5A6878;margin-bottom:8px">AMOUNT DUE</div>
      <div style="font-size:48px;font-weight:800;color:#F5C842;letter-spacing:-2px">$${amount}</div>
      <div style="font-family:'Courier New',monospace;font-size:11px;color:#5A6878;margin-top:4px">${period}</div>
    </div>
    ${sectionTitle("Invoice Details")}
    <table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:11px">
      ${[
        ["Workspace",  tenant?.name ?? ""],
        ["Plan",       tenant?.plan ?? ""],
        ["Period",     period],
        ["Invoice ID", invoiceData?.invoiceId ?? `INV-${Date.now()}`],
        ["Status",     "Paid"],
      ].map(([label, value]) => `
        <tr style="border-bottom:1px solid #1E2A38">
          <td style="padding:10px 4px;color:#5A6878">${label}</td>
          <td style="padding:10px 4px;text-align:right;color:#E8EDF2;font-weight:700">${value}</td>
        </tr>`).join("")}
    </table>
    <div style="margin-top:24px;text-align:center">
      <a href="${APP_URL}/billing" style="display:inline-block;background:#F5C842;color:#080B10;text-decoration:none;padding:12px 28px;border-radius:4px;font-weight:700;font-size:13px">
        View Billing →
      </a>
    </div>`;

  return getResend().emails.send({
    from:    FROM,
    to,
    subject: `🧾 Invoice — ${tenant?.name} · $${amount} · ${period}`,
    html:    baseTemplate("Invoice Receipt", `Your invoice for ${period} is ready`, body),
  });
}