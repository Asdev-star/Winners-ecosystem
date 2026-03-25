import db from "../db.js";
import { getAdminOverviewSnapshot } from "./adminOverviewService.js";
import { getAdminSecuritySnapshot } from "./adminSecurityService.js";
import { getPlatformLaunchControlSnapshot } from "./platformLaunchControlService.js";

export interface AdminSubNavSnapshot {
  generatedAt: string;
  badges: {
    tenants: number;
    users: number;
    security: number;
  };
  action: {
    label: string;
    hint: string;
    to: string;
  };
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

export async function getAdminSubNavSnapshot(): Promise<AdminSubNavSnapshot> {
  const day7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [upgradeSignals, flaggedUsers, security, launchControl, overview] = await Promise.all([
    db.activityLog.findMany({
      where: {
        category: "billing",
        action: { in: ["Checkout started", "Plan upgraded"] },
        createdAt: { gte: day7 },
      },
      select: { tenantId: true },
    }),
    db.assistantAction.findMany({
      where: {
        assistant: "nova",
        actionType: "flag",
        targetLayer: "community",
        targetUserId: { not: null },
      },
      select: { targetUserId: true },
      distinct: ["targetUserId"],
    }),
    getAdminSecuritySnapshot(),
    getPlatformLaunchControlSnapshot(),
    getAdminOverviewSnapshot(),
  ]);

  const pendingUpgradeRequests = new Set(
    upgradeSignals.map((entry) => entry.tenantId).filter(Boolean),
  ).size;
  const flaggedUsersAwaitingReview = flaggedUsers.length;
  const unresolvedSecurityWarnings = security.securityStatus.filter(
    (item) => item.tone !== "healthy",
  ).length;

  const queue = launchControl.queue;

  const action =
    unresolvedSecurityWarnings > 0
      ? {
          label: `Issue ${unresolvedSecurityWarnings} security ${pluralize(unresolvedSecurityWarnings, "directive")} ->`,
          hint: "Security holds the highest operator priority right now.",
          to: "/admin/security",
        }
      : queue && queue.blockingCount > 0
        ? {
            label: `Clear ${queue.blockingCount} ${queue.name} ${pluralize(queue.blockingCount, "activation blocker")} ->`,
            hint: `${queue.name} is still the nearest user activation unlock.`,
            to: "/admin/platform",
          }
        : flaggedUsersAwaitingReview > 0
          ? {
              label: `Review ${flaggedUsersAwaitingReview} flagged ${pluralize(flaggedUsersAwaitingReview, "operator case")} ->`,
              hint: "NOVA moderation signals are waiting on operator review.",
              to: "/admin/users",
            }
          : pendingUpgradeRequests > 0
            ? {
                label: `Review ${pendingUpgradeRequests} plan upgrade ${pluralize(pendingUpgradeRequests, "directive")} ->`,
                hint: "Billing intent signals are active in the tenant layer.",
                to: "/admin/tenants",
              }
            : overview.kpis.loopsToday > 0
              ? {
                  label: `Inspect ${overview.kpis.loopsToday} live ${pluralize(overview.kpis.loopsToday, "operator loop")} ->`,
                  hint: "Overview is where today's ecosystem momentum is clearest.",
                  to: "/admin/overview",
                }
              : {
                  label: "Review the current sovereign directive ->",
                  hint: "FORGE has the latest operator brief ready.",
                  to: "/admin/forge",
                };

  return {
    generatedAt: new Date().toISOString(),
    badges: {
      tenants: pendingUpgradeRequests,
      users: flaggedUsersAwaitingReview,
      security: unresolvedSecurityWarnings,
    },
    action,
  };
}
