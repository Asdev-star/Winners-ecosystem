// Server/services/slackService.ts

const SLACK_WEBHOOKS = {
  revenue: process.env.SLACK_WEBHOOK_REVENUE ?? "",
  team:    process.env.SLACK_WEBHOOK_TEAM    ?? "",
  billing: process.env.SLACK_WEBHOOK_BILLING ?? "",
  reports: process.env.SLACK_WEBHOOK_REPORTS ?? "",
};

async function send(webhookUrl: string, payload: object): Promise<void> {
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
}

function divider() {
  return { type: "divider" };
}

function section(text: string) {
  return { type: "section", text: { type: "mrkdwn", text } };
}

function header(text: string) {
  return { type: "header", text: { type: "plain_text", text, emoji: true } };
}

function context(text: string) {
  return { type: "context", elements: [{ type: "mrkdwn", text }] };
}

// ── Revenue: New payment received ─────────────────────────────────────────────
export async function notifyNewRevenue(data: {
  amount:     number;
  currency:   string;
  customer?:  string;
  source?:    string;
  tenantName: string;
}) {
  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: data.currency }).format(data.amount);
  await send(SLACK_WEBHOOKS.revenue, {
    blocks: [
      header("💰 New Payment Received"),
      section(`*${formatted}* received${data.customer ? ` from *${data.customer}*` : ""}${data.source ? ` via ${data.source}` : ""}`),
      divider(),
      context(`${data.tenantName} · ${new Date().toLocaleString()}`),
    ],
  });
}

// ── Team: New member joined ───────────────────────────────────────────────────
export async function notifyNewMember(data: {
  name:       string;
  email:      string;
  role:       string;
  invitedBy:  string;
  tenantName: string;
}) {
  await send(SLACK_WEBHOOKS.team, {
    blocks: [
      header("👋 New Team Member Joined"),
      section(`*${data.name}* (${data.email}) has joined as *${data.role}*`),
      section(`Invited by: ${data.invitedBy}`),
      divider(),
      context(`${data.tenantName} · ${new Date().toLocaleString()}`),
    ],
  });
}

// ── Billing: Plan upgraded ────────────────────────────────────────────────────
export async function notifyPlanUpgraded(data: {
  fromPlan:   string;
  toPlan:     string;
  upgradedBy: string;
  tenantName: string;
}) {
  const emoji = data.toPlan === "ENTERPRISE" ? "🏢" : "⚡";
  await send(SLACK_WEBHOOKS.billing, {
    blocks: [
      header(`${emoji} Plan Upgraded to ${data.toPlan}`),
      section(`*${data.tenantName}* upgraded from *${data.fromPlan}* to *${data.toPlan}*`),
      section(`Upgraded by: ${data.upgradedBy}`),
      divider(),
      context(`${new Date().toLocaleString()}`),
    ],
  });
}

// ── Reports: Daily revenue summary ────────────────────────────────────────────
export async function notifyDailySummary(data: {
  tenantName:    string;
  todayRevenue:  number;
  currency:      string;
  txCount:       number;
  growthPct:     number;
  topSource?:    string;
}) {
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: data.currency }).format(n);
  const growth = data.growthPct >= 0 ? `▲ +${data.growthPct.toFixed(1)}%` : `▼ ${data.growthPct.toFixed(1)}%`;
  const growthEmoji = data.growthPct >= 0 ? "📈" : "📉";

  await send(SLACK_WEBHOOKS.reports, {
    blocks: [
      header(`${growthEmoji} Daily Revenue Summary — ${new Date().toLocaleDateString()}`),
      section(`*${data.tenantName}*`),
      divider(),
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Today's Revenue*\n${fmt(data.todayRevenue)}` },
          { type: "mrkdwn", text: `*Transactions*\n${data.txCount}` },
          { type: "mrkdwn", text: `*vs Yesterday*\n${growth}` },
          { type: "mrkdwn", text: `*Top Source*\n${data.topSource ?? "—"}` },
        ],
      },
      divider(),
      context(`Automated daily summary · Winners Ecosystem`),
    ],
  });
}

// ── Reports: Weekly report ────────────────────────────────────────────────────
export async function notifyWeeklyReport(data: {
  tenantName:      string;
  weekRevenue:     number;
  currency:        string;
  txCount:         number;
  growthPct:       number;
  avgDailyRevenue: number;
  bestDay:         string;
  bestDayRevenue:  number;
}) {
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: data.currency }).format(n);
  const growth = data.growthPct >= 0 ? `▲ +${data.growthPct.toFixed(1)}%` : `▼ ${data.growthPct.toFixed(1)}%`;

  await send(SLACK_WEBHOOKS.reports, {
    blocks: [
      header(`📊 Weekly Report — Week of ${new Date().toLocaleDateString()}`),
      section(`*${data.tenantName}* · 7-day performance`),
      divider(),
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Week Revenue*\n${fmt(data.weekRevenue)}` },
          { type: "mrkdwn", text: `*Transactions*\n${data.txCount}` },
          { type: "mrkdwn", text: `*vs Last Week*\n${growth}` },
          { type: "mrkdwn", text: `*Avg Daily*\n${fmt(data.avgDailyRevenue)}` },
          { type: "mrkdwn", text: `*Best Day*\n${data.bestDay}` },
          { type: "mrkdwn", text: `*Best Day Revenue*\n${fmt(data.bestDayRevenue)}` },
        ],
      },
      divider(),
      context(`Automated weekly report · Winners Ecosystem`),
    ],
  });
}