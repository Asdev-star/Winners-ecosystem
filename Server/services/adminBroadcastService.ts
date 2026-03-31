import { NotificationType, type Plan } from "@prisma/client";
import { Resend } from "resend";
import db from "../db.js";
import { AppRegistry } from "./appRegistry.js";
import { logEmailDelivery } from "./emailTelemetryService.js";
import { sendBulkNotification } from "./fcmService.js";
import { WS_EVENTS, notifyUser } from "./wsService.js";

const RESEND_FROM = process.env.EMAIL_FROM ?? "OMEGA <omega@yourdomain.com>";
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";
const PLAN_IDS = ["FREE", "PRO", "ENTERPRISE"] as const;
const LAYER_IDS = ["community", "academy", "market", "work", "cloud", "intelligence"] as const;

type BroadcastPlan = (typeof PLAN_IDS)[number];
export type BroadcastLayerId = (typeof LAYER_IDS)[number];
export type BroadcastChannel = "in_app" | "push" | "email";
export type BroadcastType = "platform_news" | "layer_launch" | "maintenance" | "milestone" | "forge_insight";
export type BroadcastScheduleMode = "send_now" | "specific_time" | "next_omega";
export type BroadcastSegment = "at_risk" | "platinum" | "inactive_7d";
export type BroadcastAudience =
  | { kind: "all" }
  | { kind: "plan"; plan: BroadcastPlan }
  | { kind: "layer"; layerId: BroadcastLayerId }
  | { kind: "segment"; segment: BroadcastSegment };

type BroadcastRecipient = {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  tenantName: string;
  plan: Plan;
};

type BroadcastActivityRecord = {
  id: string;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  broadcastType: BroadcastType;
  createdAt: string;
  recipients: number;
  channels: BroadcastChannel[];
  audienceLabel: string;
  openRate: number | null;
  openRateLabel: string;
  clickRate: number | null;
  clickRateLabel: string;
  status: "sent" | "scheduled";
  scheduledFor: string | null;
  scheduleMode: BroadcastScheduleMode;
};

type BroadcastPanelLayer = {
  id: BroadcastLayerId;
  label: string;
  count: number;
  statusLabel: string;
  statusTone: "live" | "in_progress";
};

export type AdminBroadcastPanelSnapshot = {
  generatedAt: string;
  supervisor: string;
  description: string;
  audiences: {
    allUsers: number;
    free: number;
    pro: number;
    enterprise: number;
  };
  layers: BroadcastPanelLayer[];
  recentBroadcasts: BroadcastActivityRecord[];
};

export type AdminBroadcastSendResult = {
  title: string;
  recipients: number;
  audienceLabel: string;
  channels: BroadcastChannel[];
  inAppCreated: number;
  pushQueued: number;
  emailDelivered: number;
  emailSkipped: boolean;
};

export type AdminBroadcastComposeInput = {
  actorTenantId: string;
  audience: BroadcastAudience;
  channels: BroadcastChannel[];
  title?: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  broadcastType?: BroadcastType;
  scheduleMode?: BroadcastScheduleMode;
  scheduleAt?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstMeaningfulLine(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? "Ecosystem update";
}

function deriveTitle(message: string) {
  const line = firstMeaningfulLine(message);
  return line.length > 84 ? `${line.slice(0, 81).trimEnd()}...` : line;
}

function chunk<T>(items: T[], size: number) {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function layerLabel(layerId: BroadcastLayerId) {
  const app = AppRegistry.get(layerId);
  return app?.name.replace(/^Winners\s+/i, "") ?? layerId;
}

function layerRoute(layerId: BroadcastLayerId) {
  return AppRegistry.get(layerId)?.frontendPath ?? "/dashboard";
}

function audienceLabel(audience: BroadcastAudience) {
  if (audience.kind === "all") return "All Users";
  if (audience.kind === "plan") {
    if (audience.plan === "FREE") return "Free Users";
    if (audience.plan === "PRO") return "PRO Users";
    return "Enterprise Users";
  }
  if (audience.kind === "segment") {
    if (audience.segment === "at_risk") return "At-Risk Users";
    if (audience.segment === "platinum") return "Platinum Advocates";
    return "Inactive (7d) Users";
  }
  return `${layerLabel(audience.layerId)} Layer`;
}

function fallbackOpenRateLabel(openRate: number | null) {
  return typeof openRate === "number" ? `${openRate}% opened` : "Opens untracked";
}

function fallbackClickRateLabel(clickRate: number | null) {
  return typeof clickRate === "number" ? `${clickRate}% CTA clicks` : "CTA clicks untracked";
}

function metadataRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function metadataChannels(value: unknown): BroadcastChannel[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is BroadcastChannel =>
      entry === "in_app" || entry === "push" || entry === "email"
  );
}

function buildEmailHtml(input: { title: string; body: string; audience: string; channels: BroadcastChannel[]; ctaLabel?: string | null; ctaUrl?: string | null }) {
  const body = escapeHtml(input.body).replace(/\r?\n/g, "<br />");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:#081019;font-family:Arial,sans-serif;color:#E6EDF3">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px">
    <div style="border:1px solid rgba(201,168,76,.28);border-radius:24px;overflow:hidden;background:linear-gradient(180deg,#0B1320,#101A29)">
      <div style="padding:28px 26px;border-bottom:1px solid rgba(201,168,76,.16)">
        <div style="font-family:monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#C9A84C">OMEGA Broadcast</div>
        <h1 style="margin:12px 0 8px;font-size:28px;line-height:1.05;color:#F7FAFC">${escapeHtml(input.title)}</h1>
        <p style="margin:0;color:#95A4B8;font-size:13px;line-height:1.6">
          Audience: ${escapeHtml(input.audience)}<br />
          Channels: ${escapeHtml(input.channels.join(" + ").toUpperCase())}
        </p>
      </div>
      <div style="padding:26px">
        <div style="font-size:15px;line-height:1.8;color:#E6EDF3">${body}</div>
        <div style="margin-top:28px">
          <a href="${escapeHtml(input.ctaUrl || APP_URL)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#C9A84C;color:#081019;text-decoration:none;font-weight:700">
            ${escapeHtml(input.ctaLabel || "Open Winners Ecosystem")}
          </a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function addToSet(values: Set<string>, rows: Array<Record<string, string | null | undefined>>, key: string) {
  for (const row of rows) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) values.add(value);
  }
}

async function getLayerAudienceMembership() {
  const [communityPosts, communityComments, communityGroups, academyCourses, academyEnrollments, academyProgress, academyCertificates, marketVendors, marketCarts, marketOrders, workJobs, workFreelancers, cloudKeys, cloudInstalls, cloudWebhooks, cloudAutomations, intelligenceLoops, intelligenceInteractions] = await Promise.all([
    db.post.findMany({ where: { deletedAt: null }, distinct: ["authorId"], select: { authorId: true } }),
    db.comment.findMany({ where: { deletedAt: null }, distinct: ["authorId"], select: { authorId: true } }),
    db.groupMember.findMany({ distinct: ["userId"], select: { userId: true } }),
    db.course.findMany({ where: { deletedAt: null }, distinct: ["instructorId"], select: { instructorId: true } }),
    db.enrollment.findMany({ distinct: ["userId"], select: { userId: true } }),
    db.lessonProgress.findMany({ distinct: ["userId"], select: { userId: true } }),
    db.certificate.findMany({ distinct: ["userId"], select: { userId: true } }),
    db.vendor.findMany({ distinct: ["userId"], select: { userId: true } }),
    db.cart.findMany({ where: { userId: { not: null } }, distinct: ["userId"], select: { userId: true } }),
    db.order.findMany({ distinct: ["userId"], select: { userId: true } }),
    db.jobListing.findMany({ distinct: ["clientId"], select: { clientId: true } }),
    db.freelancerProfile.findMany({ distinct: ["userId"], select: { userId: true } }),
    db.apiKey.findMany({ distinct: ["userId"], select: { userId: true } }),
    db.connectorInstall.findMany({ distinct: ["userId"], select: { userId: true } }),
    db.webhookSubscription.findMany({ distinct: ["userId"], select: { userId: true } }),
    db.automation.findMany({ distinct: ["userId"], select: { userId: true } }),
    db.agenticLoop.findMany({ distinct: ["userId"], select: { userId: true } }),
    db.aIInteraction.findMany({ distinct: ["userId"], select: { userId: true } }),
  ]);

  const community = new Set<string>();
  addToSet(community, communityPosts, "authorId");
  addToSet(community, communityComments, "authorId");
  addToSet(community, communityGroups, "userId");

  const academy = new Set<string>();
  addToSet(academy, academyCourses, "instructorId");
  addToSet(academy, academyEnrollments, "userId");
  addToSet(academy, academyProgress, "userId");
  addToSet(academy, academyCertificates, "userId");

  const market = new Set<string>();
  addToSet(market, marketVendors, "userId");
  addToSet(market, marketCarts, "userId");
  addToSet(market, marketOrders, "userId");

  const work = new Set<string>();
  addToSet(work, workJobs, "clientId");
  addToSet(work, workFreelancers, "userId");

  const cloud = new Set<string>();
  addToSet(cloud, cloudKeys, "userId");
  addToSet(cloud, cloudInstalls, "userId");
  addToSet(cloud, cloudWebhooks, "userId");
  addToSet(cloud, cloudAutomations, "userId");

  const intelligence = new Set<string>();
  addToSet(intelligence, intelligenceLoops, "userId");
  addToSet(intelligence, intelligenceInteractions, "userId");

  return {
    community,
    academy,
    market,
    work,
    cloud,
    intelligence,
  } satisfies Record<BroadcastLayerId, Set<string>>;
}

function mapActivityRecord(log: {
  id: string;
  createdAt: Date;
  metadata: unknown;
  action: string;
}): BroadcastActivityRecord {
  const metadata = metadataRecord(log.metadata);
  const status = log.action === "admin_broadcast_scheduled" ? "scheduled" : "sent";
  const recipients = typeof metadata.recipients === "number" ? metadata.recipients : 0;
  const openRate = typeof metadata.openRate === "number" ? metadata.openRate : null;
  const clickRate = typeof metadata.clickRate === "number" ? metadata.clickRate : null;

  return {
    id: log.id,
    title: typeof metadata.title === "string" ? metadata.title : "OMEGA Broadcast",
    body: typeof metadata.message === "string" ? metadata.message : "",
    ctaLabel: typeof metadata.ctaLabel === "string" ? metadata.ctaLabel : null,
    ctaUrl: typeof metadata.ctaUrl === "string" ? metadata.ctaUrl : null,
    broadcastType: typeof metadata.broadcastType === "string" ? metadata.broadcastType as BroadcastType : "platform_news",
    createdAt: log.createdAt.toISOString(),
    recipients,
    channels: metadataChannels(metadata.channels),
    audienceLabel:
      typeof metadata.audienceLabel === "string" ? metadata.audienceLabel : "All Users",
    openRate,
    openRateLabel: fallbackOpenRateLabel(openRate),
    clickRate,
    clickRateLabel: fallbackClickRateLabel(clickRate),
    status,
    scheduledFor:
      typeof metadata.scheduleAt === "string" && metadata.scheduleAt.trim()
        ? metadata.scheduleAt
        : null,
    scheduleMode:
      typeof metadata.scheduleMode === "string" && ["send_now", "specific_time", "next_omega"].includes(metadata.scheduleMode)
        ? metadata.scheduleMode as BroadcastScheduleMode
        : status === "scheduled"
          ? "specific_time"
          : "send_now",
  };
}

export async function getAdminBroadcastSnapshot(): Promise<AdminBroadcastPanelSnapshot> {
  const [allUsers, freeUsers, proUsers, enterpriseUsers, layerMembership, recentLogs] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.user.count({ where: { deletedAt: null, tenant: { plan: "FREE" } } }),
    db.user.count({ where: { deletedAt: null, tenant: { plan: "PRO" } } }),
    db.user.count({ where: { deletedAt: null, tenant: { plan: "ENTERPRISE" } } }),
    getLayerAudienceMembership(),
    db.activityLog.findMany({
      where: {
        category: "admin",
        action: { in: ["admin_broadcast_sent", "admin_broadcast_scheduled"] },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, action: true, createdAt: true, metadata: true },
    }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    supervisor: "OMEGA",
    description: "Send ecosystem-wide messages in OMEGA's voice, with targeting across all users, plan tiers, or active platform layers.",
    audiences: {
      allUsers,
      free: freeUsers,
      pro: proUsers,
      enterprise: enterpriseUsers,
    },
    layers: LAYER_IDS.map((id) => {
      const app = AppRegistry.get(id);
      return {
        id,
        label: layerLabel(id),
        count: layerMembership[id].size,
        statusLabel: app?.status === "live" ? "Live" : "In Progress",
        statusTone: app?.status === "live" ? "live" : "in_progress",
      };
    }),
    recentBroadcasts: recentLogs.map(mapActivityRecord),
  };
}

async function resolveRecipients(audience: BroadcastAudience): Promise<BroadcastRecipient[]> {
  if (audience.kind === "all") {
    return db.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true,
        tenant: { select: { name: true, plan: true } },
      },
      orderBy: { createdAt: "desc" },
    }).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        tenantId: row.tenantId,
        tenantName: row.tenant.name,
        plan: row.tenant.plan,
      }))
    );
  }

  if (audience.kind === "plan") {
    return db.user.findMany({
      where: { deletedAt: null, tenant: { plan: audience.plan } },
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true,
        tenant: { select: { name: true, plan: true } },
      },
      orderBy: { createdAt: "desc" },
    }).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        tenantId: row.tenantId,
        tenantName: row.tenant.name,
        plan: row.tenant.plan,
      }))
    );
  }

  if (audience.kind === "segment") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const where =
      audience.segment === "at_risk"
        ? { deletedAt: null, trustScore: { lte: 30 } }
        : audience.segment === "platinum"
          ? { deletedAt: null, trustScore: { gt: 85 } }
          : { deletedAt: null, updatedAt: { lt: sevenDaysAgo } };

    return db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true,
        tenant: { select: { name: true, plan: true } },
      },
      orderBy: { createdAt: "desc" },
    }).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        tenantId: row.tenantId,
        tenantName: row.tenant.name,
        plan: row.tenant.plan,
      }))
    );
  }

  const memberships = await getLayerAudienceMembership();
  const ids = Array.from(memberships[audience.layerId]);
  if (ids.length === 0) return [];

  return db.user.findMany({
    where: { deletedAt: null, id: { in: ids } },
    select: {
      id: true,
      email: true,
      name: true,
      tenantId: true,
      tenant: { select: { name: true, plan: true } },
    },
    orderBy: { createdAt: "desc" },
  }).then((rows) =>
    rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      tenantId: row.tenantId,
      tenantName: row.tenant.name,
      plan: row.tenant.plan,
    }))
  );
}

export async function buildAdminBroadcastDraft(audience: BroadcastAudience) {
  const label = audienceLabel(audience);
  const audienceCount = (await resolveRecipients(audience)).length;

  if (audience.kind === "layer" && audience.layerId === "market") {
    return [
      "Winners Market is moving into launch formation.",
      "OMEGA has been coordinating the infrastructure, checkout flows, and vendor readiness behind the scenes.",
      "If you are preparing to sell, this is the moment to finalize your storefront and product intelligence.",
      "Stay close. Market execution is entering its decisive window.",
    ].join("\n");
  }

  if (audience.kind === "plan" && audience.plan === "PRO") {
    return [
      "PRO operators, OMEGA is issuing a priority ecosystem update.",
      "Your tier is where the highest-leverage execution is happening right now, and the next releases are being shaped around users already compounding results.",
      "Stay active across Intelligence, Academy, and Market readiness. The users who move first will capture the upside.",
      `Current targeted reach: ${audienceCount.toLocaleString("en-US")} ${label.toLowerCase()}.`,
    ].join("\n");
  }

  return [
    "OMEGA is issuing an ecosystem-wide directive.",
    "The platform is consolidating around the users who execute quickly, adapt early, and stay close to the live layers.",
    "Review the latest product surfaces, act on the highest-leverage opportunities available to you, and keep your workspace in motion.",
    `This broadcast is prepared for ${audienceCount.toLocaleString("en-US")} recipients across ${label}.`,
  ].join("\n");
}

function notificationLink(audience: BroadcastAudience) {
  return audience.kind === "layer" ? layerRoute(audience.layerId) : "/notifications";
}

export async function sendAdminBroadcast(input: AdminBroadcastComposeInput): Promise<AdminBroadcastSendResult> {
  const message = input.body.trim();
  const recipients = await resolveRecipients(input.audience);
  const title = input.title?.trim() || deriveTitle(message);
  const targetLabel = audienceLabel(input.audience);
  const link = input.ctaUrl?.trim() || notificationLink(input.audience);

  let inAppCreated = 0;
  if (input.channels.includes("in_app") && recipients.length > 0) {
    const notificationRows = recipients.map((recipient) => ({
      tenantId: recipient.tenantId,
      userId: recipient.id,
              type: NotificationType.SYSTEM,
              title,
              body: message,
              link,
    }));

    for (const batch of chunk(notificationRows, 250)) {
      const result = await db.notification.createMany({ data: batch });
      inAppCreated += result.count;
    }

    for (const recipient of recipients) {
      notifyUser(recipient.id, {
        type: WS_EVENTS.SYSTEM,
        title,
        body: message,
        link,
      });
    }
  }

  let pushQueued = 0;
  if (input.channels.includes("push") && recipients.length > 0) {
    await sendBulkNotification(
      recipients.map((recipient) => recipient.id),
      {
                title,
                body: message.length > 220 ? `${message.slice(0, 217).trimEnd()}...` : message,
                url: link,
      }
    );
    pushQueued = recipients.length;
  }

  let emailDelivered = 0;
  let emailSkipped = false;
  if (input.channels.includes("email")) {
    const emailRecipients = recipients.filter((recipient) => recipient.email.trim());
    if (!process.env.RESEND_API_KEY || emailRecipients.length === 0) {
      emailSkipped = true;
    } else {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const subject = `OMEGA: ${title}`;

      for (const batch of chunk(emailRecipients, 10)) {
        const settled = await Promise.allSettled(
          batch.map((recipient) =>
            resend.emails.send({
              from: RESEND_FROM,
              to: [recipient.email],
              subject,
              html: buildEmailHtml({
                title,
                body: message,
                audience: targetLabel,
                channels: input.channels,
                ctaLabel: input.ctaLabel,
                ctaUrl: link,
              }),
            })
          )
        );

        emailDelivered += settled.filter((entry) => entry.status === "fulfilled").length;
      }

      await logEmailDelivery({
        tenantId: input.actorTenantId,
        action: "OMEGA broadcast email sent",
        recipients: emailRecipients.map((recipient) => recipient.email),
        source: "admin_broadcast",
        metadata: {
          title,
          ctaLabel: input.ctaLabel,
          ctaUrl: link,
          broadcastType: input.broadcastType ?? "platform_news",
          scheduleMode: input.scheduleMode ?? "send_now",
          audienceLabel: targetLabel,
          recipientCount: emailRecipients.length,
          channels: input.channels,
        },
      });
    }
  }

  return {
    title,
    recipients: recipients.length,
    audienceLabel: targetLabel,
    channels: input.channels,
    inAppCreated,
    pushQueued,
    emailDelivered,
    emailSkipped,
  };
}
