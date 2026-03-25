import db from "../db.js";

type MobileMetricStatus = "on_track" | "off_track" | "pending_data";
type MobileRevenueStatus = "live" | "building" | "planned" | "gated";

export interface MobileMetricTarget {
  current: number | null;
  month1Target: number;
  month3Target: number;
  unit: "percent" | "minutes" | "stars";
  status: MobileMetricStatus;
  source: string;
}

export interface MobileMonetizationLane {
  id: string;
  label: string;
  platform: "pwa" | "react-native";
  benefit: string;
  trigger: string;
  status: MobileRevenueStatus;
  notes: string;
}

export interface MobileHealthReport {
  pwaInstalls: number;
  pushPermissions: number;
  fcmDeliveryRate: number;
  offlineQueueDepth: number;
  avgSessionDuration: number;
  topNotificationType: string;
  expiredTokenCount: number;
  platformBreakdown: {
    web: number;
    ios: number;
    android: number;
  };
  monetization: MobileMonetizationLane[];
  successMetrics: {
    pwaInstallRate: MobileMetricTarget;
    pushOptInRate: MobileMetricTarget;
    pushOpenRate: MobileMetricTarget;
    offlineSessionRate: MobileMetricTarget;
    mobileDauVsWebDau: MobileMetricTarget;
    appStoreRating: MobileMetricTarget;
    fcmDeliveryRate: MobileMetricTarget;
  };
}

function toPercent(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function buildMetricTarget(
  current: number | null,
  month1Target: number,
  month3Target: number,
  unit: MobileMetricTarget["unit"],
  source: string
): MobileMetricTarget {
  return {
    current,
    month1Target,
    month3Target,
    unit,
    source,
    status: current == null ? "pending_data" : current >= month1Target ? "on_track" : "off_track",
  };
}

export async function getMobileHealthReport(): Promise<MobileHealthReport> {
  const [
    totalTokens,
    activeTokens,
    uniqueMobileUsers,
    activePushUsers,
    webUsers,
    iosUsers,
    androidUsers,
    topNotification,
    totalNotifications,
    openedNotifications,
    recentActiveUsers,
  ] = await Promise.all([
    db.deviceToken.count(),
    db.deviceToken.count({ where: { isActive: true } }),
    db.deviceToken.groupBy({ by: ["userId"] }),
    db.deviceToken.groupBy({ by: ["userId"], where: { isActive: true } }),
    db.deviceToken.groupBy({ by: ["userId"], where: { platform: "web" } }),
    db.deviceToken.groupBy({ by: ["userId"], where: { platform: "ios" } }),
    db.deviceToken.groupBy({ by: ["userId"], where: { platform: "android" } }),
    db.notification.groupBy({
      by: ["type"],
      _count: { type: true },
      orderBy: { _count: { type: "desc" } },
      take: 1,
    }),
    db.notification.count(),
    db.notification.count({ where: { read: true } }),
    db.activityLog.groupBy({
      by: ["userId"],
      where: {
        userId: { not: null },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const mobileUserIds = new Set(uniqueMobileUsers.map((row) => row.userId));
  const recentUserIds = recentActiveUsers.map((row) => row.userId).filter((value): value is string => Boolean(value));
  const mobileDau = recentUserIds.filter((userId) => mobileUserIds.has(userId)).length;
  const webDau = recentUserIds.filter((userId) => !mobileUserIds.has(userId)).length;

  const pwaInstallRate = toPercent(webUsers.length, uniqueMobileUsers.length);
  const pushOptInRate = toPercent(activePushUsers.length, uniqueMobileUsers.length);
  const pushOpenRate = toPercent(openedNotifications, totalNotifications);
  const fcmDeliveryRate = toPercent(activeTokens, totalTokens);
  const mobileDauVsWebDau = webDau > 0 ? Number(((mobileDau / webDau) * 100).toFixed(2)) : null;

  const monetization: MobileMonetizationLane[] = [
    {
      id: "premium-pwa",
      label: "Premium subscription benefit",
      platform: "pwa",
      benefit: "Mobile-exclusive value lands in the installed PWA immediately.",
      trigger: "PWA live",
      status: "live",
      notes: "Installed web users can already receive the premium mobile surface without a store review cycle.",
    },
    {
      id: "stripe-iap",
      label: "In-app purchases (Stripe)",
      platform: "react-native",
      benefit: "Courses and AI credit bundles monetize directly in the app.",
      trigger: "React Native",
      status: process.env.STRIPE_SECRET_KEY ? "building" : "planned",
      notes: process.env.STRIPE_SECRET_KEY
        ? "Stripe is configured on the backend; native purchase UX still needs production mobile checkout wiring."
        : "Native purchase monetization is blocked until Stripe is configured end-to-end.",
    },
    {
      id: "flutterwave-mpesa",
      label: "M-Pesa via Flutterwave",
      platform: "react-native",
      benefit: "Primary payment rail for the African market.",
      trigger: "React Native",
      status: "planned",
      notes: "This remains the regional monetization priority once the native payments lane is live.",
    },
    {
      id: "vendor-promoted-push",
      label: "Vendor-paid promotional pushes",
      platform: "react-native",
      benefit: "Sponsored push campaigns become a revenue stream after the network has scale.",
      trigger: "After 10K users",
      status: "gated",
      notes: "Keep this gated until user volume and notification relevance are both high enough to avoid trust erosion.",
    },
    {
      id: "app-store-discovery",
      label: "App Store presence",
      platform: "react-native",
      benefit: "Organic discovery and install growth.",
      trigger: "React Native",
      status: "planned",
      notes: "Discovery upside exists, but store launch should follow core retention and notification health.",
    },
  ];

  return {
    pwaInstalls: webUsers.length,
    pushPermissions: activePushUsers.length,
    fcmDeliveryRate,
    offlineQueueDepth: 0,
    avgSessionDuration: 0,
    topNotificationType: topNotification[0]?.type ?? "job_match",
    expiredTokenCount: totalTokens - activeTokens,
    platformBreakdown: {
      web: webUsers.length,
      ios: iosUsers.length,
      android: androidUsers.length,
    },
    monetization,
    successMetrics: {
      pwaInstallRate: buildMetricTarget(
        pwaInstallRate,
        15,
        30,
        "percent",
        "Distinct users with a web device token as a proxy for installed PWA footprint."
      ),
      pushOptInRate: buildMetricTarget(
        pushOptInRate,
        40,
        60,
        "percent",
        "Distinct active push-enabled users over all users with a registered mobile-capable token."
      ),
      pushOpenRate: buildMetricTarget(
        pushOpenRate,
        25,
        35,
        "percent",
        "Notification read rate proxy until explicit push-open telemetry is emitted by clients."
      ),
      offlineSessionRate: buildMetricTarget(
        null,
        5,
        10,
        "percent",
        "Pending client telemetry from offline queue and session reporting."
      ),
      mobileDauVsWebDau: buildMetricTarget(
        mobileDauVsWebDau,
        40,
        65,
        "percent",
        "24h activity-log user overlap, using registered mobile users as the mobile cohort proxy."
      ),
      appStoreRating: buildMetricTarget(null, 0, 4.5, "stars", "Pending App Store / Play Store telemetry."),
      fcmDeliveryRate: buildMetricTarget(
        fcmDeliveryRate,
        95,
        98,
        "percent",
        "Active token ratio over total registered tokens."
      ),
    },
  };
}
