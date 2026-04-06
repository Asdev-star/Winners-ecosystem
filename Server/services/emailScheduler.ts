// server/services/emailScheduler.ts
// Runs scheduled email jobs for weekly reports and Academy briefings.

import cron from "node-cron";
import db from "../db.js";
import {
  sendAnomalyAlert,
  sendMonthlyFullReport,
  sendWeeklyAcademyBriefings,
  sendWeeklyRevenueSummary,
} from "./emailService.js";

async function getAllTenantOwnerEmails(tenantId: string): Promise<string[]> {
  const users = await db.user.findMany({
    where: { tenantId, deletedAt: null, role: { in: ["OWNER", "ADMIN"] } },
    select: { email: true },
  });
  return users.map((u) => u.email);
}

async function getAllActiveTenants(): Promise<string[]> {
  const tenants = await db.tenant.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });
  return tenants.map((t) => t.id);
}

export function startEmailScheduler() {
  console.log("Email scheduler started");

  cron.schedule(
    "0 8 * * 1",
    async () => {
      console.log("Sending weekly revenue reports...");
      try {
        const tenants = await getAllActiveTenants();
        for (const tenantId of tenants) {
          const to = await getAllTenantOwnerEmails(tenantId);
          if (to.length) {
            await sendWeeklyRevenueSummary(tenantId, to);
            console.log(`Weekly report sent for tenant ${tenantId} -> ${to.join(", ")}`);
          }
        }
      } catch (err) {
        console.error("Weekly report cron failed:", err);
      }
    },
    { timezone: "UTC" },
  );

  cron.schedule(
    "30 8 * * 1",
    async () => {
      console.log("Sending weekly Academy briefings...");
      try {
        const tenants = await getAllActiveTenants();
        for (const tenantId of tenants) {
          await sendWeeklyAcademyBriefings(tenantId);
          console.log(`Weekly Academy briefing sent for tenant ${tenantId}`);
        }
      } catch (err) {
        console.error("Weekly Academy briefing cron failed:", err);
      }
    },
    { timezone: "UTC" },
  );

  cron.schedule(
    "0 8 1 * *",
    async () => {
      console.log("Sending monthly reports...");
      try {
        const tenants = await getAllActiveTenants();
        for (const tenantId of tenants) {
          const to = await getAllTenantOwnerEmails(tenantId);
          if (to.length) {
            await sendMonthlyFullReport(tenantId, to);
            console.log(`Monthly report sent for tenant ${tenantId}`);
          }
        }
      } catch (err) {
        console.error("Monthly report cron failed:", err);
      }
    },
    { timezone: "UTC" },
  );

  cron.schedule(
    "0 9 * * *",
    async () => {
      console.log("Running daily anomaly check...");
      try {
        const tenants = await getAllActiveTenants();
        for (const tenantId of tenants) {
          const to = await getAllTenantOwnerEmails(tenantId);
          if (to.length) {
            const result = await sendAnomalyAlert(tenantId, to);
            if (result) console.log(`Anomaly alert sent for tenant ${tenantId}`);
          }
        }
      } catch (err) {
        console.error("Anomaly check cron failed:", err);
      }
    },
    { timezone: "UTC" },
  );

  console.log("Scheduled: Weekly revenue, weekly Academy, monthly report, anomaly check");
}
