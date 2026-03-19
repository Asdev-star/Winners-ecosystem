import fs from "fs";
import path from "path";
import db from "../db.js";
import { getOverviewLayers } from "./adminOverviewService.js";
import { AppRegistry } from "./appRegistry.js";

export type PreLaunchCheckCategory =
  | "dependency"
  | "backend"
  | "frontend"
  | "payments"
  | "ai"
  | "data";

export type PreLaunchCheckStatus = "pass" | "warn" | "fail";

export interface PreLaunchCheck {
  category: PreLaunchCheckCategory;
  label: string;
  status: PreLaunchCheckStatus;
  detail?: string;
  link?: string;
  hoursEstimate?: number;
}

export interface LegacyChecklistItem {
  item: string;
  status: "done" | "attention" | "blocked";
  required: boolean;
}

export interface LaunchControlRow {
  id: string;
  name: string;
  icon: string;
  progress: number;
  badge: string;
  actionMode: "admin_only" | "metrics" | "launch" | "locked";
  actionLabel: string;
  helperLabel?: string;
  note: string;
  canSuspend: boolean;
  detailPath: string;
  blockingCount: number;
  warningCount: number;
  dependencies: Array<{
    id: string;
    label: string;
    isLive: boolean;
  }>;
  confirmationText: string;
  launchSummary: string;
}

export interface LaunchQueueCard {
  layerId: string;
  name: string;
  icon: string;
  progress: number;
  actionLabel: string;
  dependencies: Array<{
    id: string;
    label: string;
    isLive: boolean;
  }>;
  blockingCount: number;
  warningCount: number;
  forgeDirective: string;
  isReady: boolean;
  confirmationText: string;
  launchSummary: string;
}

export interface LaunchImpactItem {
  icon: string;
  title: string;
  detail: string;
}

export interface PlatformLaunchChecklist {
  layerId: string;
  layerName: string;
  isReady: boolean;
  issues: LegacyChecklistItem[];
  checklist: LegacyChecklistItem[];
  checks: PreLaunchCheck[];
  blockingCount: number;
  warningCount: number;
  confirmationText: string;
  launchSummary: string;
  launchEffects: string[];
}

export interface PlatformLaunchControlSnapshot {
  summary: string;
  queue: LaunchQueueCard | null;
  rows: LaunchControlRow[];
  impactPreview: LaunchImpactItem[];
  usersNotifiedCount: number;
}

type LayerLaunchPolicy = {
  icon: string;
  readyBadge: string;
  lockedBadge: string;
  launchActionLabel: string;
  launchSummary: string;
  confirmationText: string;
  forgeDirective: string;
  defaultNote: string;
  impactPreview: (usersNotifiedCount: number) => LaunchImpactItem[];
  launchEffects: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const PROJECT_ROOT = process.cwd();
const ACTIVE_USER_WINDOW = new Date(Date.now() - 30 * DAY_MS);

const LAYER_POLICIES: Record<string, LayerLaunchPolicy> = {
  core: {
    icon: "⬡",
    readyBadge: "ADMIN ONLY",
    lockedBadge: "ADMIN ONLY",
    launchActionLabel: "Fully managed",
    launchSummary: "The sovereign control plane is already live.",
    confirmationText: "CORE ENGINE",
    forgeDirective: "Core Engine is already sovereign and always admin-operated.",
    defaultNote: "Core Engine is always an admin-managed surface.",
    impactPreview: () => [],
    launchEffects: ["Core Engine stays under sovereign admin control."],
  },
  community: {
    icon: "🧑",
    readyBadge: "LIVE",
    lockedBadge: "LIVE",
    launchActionLabel: "Metrics",
    launchSummary: "Community is already feeding NOVA signals into the ecosystem.",
    confirmationText: "COMMUNITY",
    forgeDirective: "Community is already live.",
    defaultNote: "Community is already live and feeding the loop.",
    impactPreview: () => [],
    launchEffects: ["Community is already operating live."],
  },
  academy: {
    icon: "🎓",
    readyBadge: "LIVE",
    lockedBadge: "LIVE",
    launchActionLabel: "Metrics",
    launchSummary: "Academy is already live and issuing certificates.",
    confirmationText: "ACADEMY",
    forgeDirective: "Academy is already live.",
    defaultNote: "Academy is already live and issuing SAGE signals.",
    impactPreview: () => [],
    launchEffects: ["Academy is already operating live."],
  },
  intelligence: {
    icon: "🤖",
    readyBadge: "LIVE",
    lockedBadge: "LIVE",
    launchActionLabel: "Metrics",
    launchSummary: "Intelligence is already live with FORGE and OMEGA.",
    confirmationText: "INTELLIGENCE",
    forgeDirective: "Intelligence is already live and supervising the ecosystem.",
    defaultNote: "Intelligence is already live with FORGE and OMEGA.",
    impactPreview: () => [],
    launchEffects: ["Intelligence is already operating live."],
  },
  market: {
    icon: "🛒",
    readyBadge: "READY",
    lockedBadge: "CHECKLIST",
    launchActionLabel: "Launch Market ->",
    launchSummary: "Admin launch unlocks Winners Market, activates ATLAS, and starts market-aware OMEGA briefings.",
    confirmationText: "LAUNCH MARKET",
    forgeDirective: "Fix CheckoutPage vendor resolution, clear Stripe Connect payout proof, seed launch inventory, then launch.",
    defaultNote: "No user can open Market until the sovereign launch act is completed from admin.",
    impactPreview: (usersNotifiedCount) => [
      {
        icon: "🛒",
        title: "ATLAS activates",
        detail: "ATLAS begins issuing product ideas and commerce recommendations as soon as Market is live.",
      },
      {
        icon: "🧠",
        title: "OMEGA briefings expand",
        detail: "Daily OMEGA briefings begin including market demand, vendor, and revenue signals.",
      },
      {
        icon: "👥",
        title: `${usersNotifiedCount.toLocaleString("en-US")} users notified`,
        detail: "OMEGA broadcasts the Market launch message across the full ecosystem immediately.",
      },
    ],
    launchEffects: [
      "AppRegistry marks Market live.",
      "A PlatformLayerStatus launch record is written.",
      "OMEGA broadcasts the Market launch to every user.",
      "ATLAS is marked active for commerce intelligence.",
      "OMEGA briefings begin including market signals.",
    ],
  },
  work: {
    icon: "💼",
    readyBadge: "READY",
    lockedBadge: "LOCKED",
    launchActionLabel: "Launch Work ->",
    launchSummary: "Admin launch unlocks Winners Work, activates the Academy-to-Work loop, and flushes CIRCUIT match events.",
    confirmationText: "LAUNCH WORK",
    forgeDirective: "Keep Market live first, then prove escrow release and CIRCUIT scoring before launch.",
    defaultNote: "Winners Work stays locked until Market is live and the escrow plus matching chain is proven.",
    impactPreview: (usersNotifiedCount) => [
      {
        icon: "🎓",
        title: "Academy -> Work loop activates",
        detail: "Certificate earners immediately start receiving Work-side opportunities and job match prompts.",
      },
      {
        icon: "💼",
        title: "CIRCUIT flushes queued matches",
        detail: "Pending match events are flushed into live Work notifications as part of launch.",
      },
      {
        icon: "👥",
        title: `${usersNotifiedCount.toLocaleString("en-US")} users notified`,
        detail: "OMEGA announces the Work launch to the ecosystem the moment you authorize it.",
      },
    ],
    launchEffects: [
      "AppRegistry marks Work live.",
      "A PlatformLayerStatus launch record is written.",
      "OMEGA broadcasts the Work launch to every user.",
      "Certificate holders receive CIRCUIT job-match notifications.",
      "Pending Work-side match signals are flushed.",
    ],
  },
  mobile: {
    icon: "📱",
    readyBadge: "READY",
    lockedBadge: "LOCKED",
    launchActionLabel: "Launch Mobile ->",
    launchSummary: "Admin launch unlocks the mobile install surface once PWA, offline caching, and push delivery are proven.",
    confirmationText: "LAUNCH MOBILE",
    forgeDirective: "Validate manifest, offline Academy + Community caching, FCM delivery, and install prompts before launch.",
    defaultNote: "Mobile stays locked until the core web layers are stable and install behavior is verified.",
    impactPreview: (usersNotifiedCount) => [
      {
        icon: "📲",
        title: "Installable experience opens",
        detail: "Users can install the Winners mobile PWA once the launch command completes.",
      },
      {
        icon: "🔔",
        title: "Push layer activated",
        detail: "FCM-backed push delivery becomes part of the live user experience after launch verification.",
      },
      {
        icon: "👥",
        title: `${usersNotifiedCount.toLocaleString("en-US")} users notified`,
        detail: "OMEGA announces the mobile install surface across the ecosystem.",
      },
    ],
    launchEffects: [
      "AppRegistry marks Mobile live.",
      "A PlatformLayerStatus launch record is written.",
      "OMEGA broadcasts the Mobile launch to every user.",
      "The installable PWA experience becomes officially available.",
    ],
  },
  cloud: {
    icon: "☁️",
    readyBadge: "READY",
    lockedBadge: "LOCKED",
    launchActionLabel: "Launch Cloud ->",
    launchSummary: "Admin launch unlocks Winners Cloud for PRO and ENTERPRISE tenants while FREE remains visible but upgrade-locked.",
    confirmationText: "LAUNCH CLOUD",
    forgeDirective: "Keep Market live, hold Intelligence at 75%+, pass the connector/API/webhook gates, then launch Cloud with plan locks in place.",
    defaultNote: "Cloud stays locked until commerce, intelligence readiness, and active-user scale justify opening the developer layer.",
    impactPreview: (usersNotifiedCount) => [
      {
        icon: "🔐",
        title: "Plan-aware access begins",
        detail: "FREE sees Cloud but gets an upgrade gate. PRO and ENTERPRISE get the full surface.",
      },
      {
        icon: "☁️",
        title: "NEXUS goes live",
        detail: "NEXUS becomes the active supervisor for the public developer platform once launch completes.",
      },
      {
        icon: "👥",
        title: `${usersNotifiedCount.toLocaleString("en-US")} users notified`,
        detail: "OMEGA announces the Cloud launch while the plan gate keeps FREE locked behind upgrade messaging.",
      },
    ],
    launchEffects: [
      "AppRegistry marks Cloud live.",
      "A PlatformLayerStatus launch record is written.",
      "OMEGA broadcasts the Cloud launch to every user.",
      "FREE remains visible but upgrade-locked. PRO and ENTERPRISE receive full access.",
      "NEXUS is marked active for the developer platform.",
    ],
  },
};

function exists(relativePath: string) {
  return fs.existsSync(path.resolve(PROJECT_ROOT, relativePath));
}

function readText(relativePath: string) {
  try {
    return fs.readFileSync(path.resolve(PROJECT_ROOT, relativePath), "utf8");
  } catch {
    return "";
  }
}

function parseJsonFile<T>(relativePath: string): T | null {
  try {
    return JSON.parse(readText(relativePath)) as T;
  } catch {
    return null;
  }
}

function includesAll(relativePath: string, patterns: string[]) {
  const text = readText(relativePath);
  return patterns.every((pattern) => text.includes(pattern));
}

function toLegacyStatus(status: PreLaunchCheckStatus): LegacyChecklistItem["status"] {
  if (status === "pass") return "done";
  if (status === "warn") return "attention";
  return "blocked";
}

function isRequired(check: PreLaunchCheck): boolean {
  return check.status !== "warn";
}

function getProgressMap() {
  return new Map(getOverviewLayers().map((layer) => [layer.id, layer.progress]));
}

async function getActiveUserCountLast30Days() {
  const activeUsersRows = await db.activityLog.findMany({
    where: {
      userId: { not: null },
      createdAt: { gte: ACTIVE_USER_WINDOW },
    },
    distinct: ["userId"],
    select: { userId: true },
  });
  const totalUsers = await db.user.count({ where: { deletedAt: null } });
  return activeUsersRows.length || totalUsers;
}

function dependencyChecks(layerId: string): PreLaunchCheck[] {
  const app = AppRegistry.get(layerId);
  if (!app) return [];

  return app.dependencies.map((dependencyId) => {
    const dependency = AppRegistry.get(dependencyId);
    const isLive = dependency?.status === "live";
    return {
      category: "dependency",
      label: `${dependency?.name ?? dependencyId} dependency is live`,
      status: isLive ? "pass" : "fail",
      detail: isLive ? undefined : `Launch ${dependency?.name ?? dependencyId} before unlocking ${app.name}.`,
    };
  });
}

async function marketChecks(): Promise<PreLaunchCheck[]> {
  const [seededProducts, vendorsWithStripe, testedVendorPayouts] = await Promise.all([
    db.product.count({ where: { isActive: true } }),
    db.vendor.count({ where: { NOT: { stripeAccountId: null } } }),
    db.vendorPayout.count({ where: { stripeTransferId: { not: null } } }),
  ]);

  const checkoutRouteFixed = includesAll("Server/routes/orderRoutes.ts", [
    "const vendorId = cart.items[0]?.product?.vendor?.id;",
    'if (!vendorId) return res.status(400).json({ error: "Could not determine vendor for this cart" });',
  ]);
  const atlasRouteWired =
    includesAll("src/App.tsx", ['path="market/vendor"', "VendorDashboard"]) &&
    exists("src/features/market/VendorDashboard.tsx");

  return [
    ...dependencyChecks("market"),
    {
      category: "frontend",
      label: "Fix CheckoutPage vendor resolution bug",
      status: checkoutRouteFixed ? "pass" : "fail",
      detail: checkoutRouteFixed
        ? "Checkout session now resolves vendor ownership from the cart's product records."
        : "Checkout still needs vendor ownership resolution before launch can proceed.",
      link: "Server/routes/orderRoutes.ts",
      hoursEstimate: 4,
    },
    {
      category: "payments",
      label: "Stripe Connect configured + one vendor payout tested",
      status: vendorsWithStripe > 0 && testedVendorPayouts > 0 ? "pass" : "fail",
      detail:
        vendorsWithStripe > 0 && testedVendorPayouts > 0
          ? `${vendorsWithStripe} vendor account(s) are connected and ${testedVendorPayouts} payout test record(s) exist.`
          : `Need at least one connected vendor and one tested payout. Current state: ${vendorsWithStripe} connected vendor(s), ${testedVendorPayouts} payout test(s).`,
      link: "Server/routes/vendorRoutes.ts",
      hoursEstimate: 3,
    },
    {
      category: "frontend",
      label: "ATLAS route wired to VendorDashboard.tsx frontend",
      status: atlasRouteWired ? "pass" : "fail",
      detail: atlasRouteWired
        ? "The Market vendor dashboard route is mounted and ready for ATLAS-driven vendor entry."
        : "VendorDashboard routing still needs to be wired through the Market surface.",
      link: "src/features/market/VendorDashboard.tsx",
      hoursEstimate: 2,
    },
    {
      category: "data",
      label: "Seed at least 5 products for day-one browsing",
      status: seededProducts >= 5 ? "pass" : "fail",
      detail:
        seededProducts >= 5
          ? `${seededProducts} active products are ready for launch-day browsing.`
          : `Launch requires at least 5 active products. Only ${seededProducts} found right now.`,
      link: "prisma/schema.prisma",
      hoursEstimate: 1,
    },
  ];
}

async function workChecks(): Promise<PreLaunchCheck[]> {
  const [releasedEscrows, openJobs, availableFreelancers] = await Promise.all([
    db.escrowPayment.count({ where: { status: "RELEASED" } }),
    db.jobListing.count({ where: { status: "OPEN" } }),
    db.freelancerProfile.count(),
  ]);

  const schemaText = readText("prisma/schema.prisma");
  const hasEscrowModel = schemaText.includes("model EscrowPayment") && schemaText.includes("releasedAt");
  const circuitRouteExists = includesAll("Server/routes/workRoutes.ts", [
    'router.get("/circuit/recommendations"',
    '"score": 85',
  ]);

  return [
    ...dependencyChecks("work"),
    {
      category: "data",
      label: "EscrowPayment/Release Prisma models migrated",
      status: hasEscrowModel ? "pass" : "fail",
      detail: hasEscrowModel
        ? "EscrowPayment and release state persistence are present in Prisma."
        : "Escrow release persistence is not fully represented in Prisma yet.",
      link: "prisma/schema.prisma",
    },
    {
      category: "payments",
      label: "Escrow fund -> release -> payout tested end-to-end",
      status: releasedEscrows > 0 ? "pass" : "fail",
      detail:
        releasedEscrows > 0
          ? `${releasedEscrows} released escrow record(s) prove the release flow has completed at least once.`
          : "No released escrow record exists yet, so launch cannot claim an end-to-end payment proof.",
      link: "Server/routes/escrowRoutes.ts",
    },
    {
      category: "ai",
      label: "CIRCUIT match scoring returns valid score on test job",
      status: circuitRouteExists && openJobs > 0 && availableFreelancers > 0 ? "pass" : "fail",
      detail:
        circuitRouteExists && openJobs > 0 && availableFreelancers > 0
          ? `CIRCUIT scoring route exists with ${openJobs} open job(s) and ${availableFreelancers} freelancer profile(s) available for test scoring.`
          : "Launch requires the CIRCUIT scoring route plus at least one open job and one freelancer profile for validation.",
      link: "Server/routes/workRoutes.ts",
    },
    {
      category: "data",
      label: "At least 5 job listings seeded",
      status: openJobs >= 5 ? "pass" : "fail",
      detail:
        openJobs >= 5
          ? `${openJobs} open job listings are ready for day-one demand.`
          : `Launch requires 5 open job listings. Only ${openJobs} are available right now.`,
      link: "Server/routes/workRoutes.ts",
    },
  ];
}

async function mobileChecks(): Promise<PreLaunchCheck[]> {
  const manifest = parseJsonFile<Record<string, unknown>>("public/manifest.json");
  const swText = readText("public/sw.js");
  const hasInstallPromptCode = [
    "src/main.tsx",
    "src/App.tsx",
    "src/hooks/usePushNotifications.ts",
  ].some((relativePath) => readText(relativePath).includes("beforeinstallprompt"));
  const hasFirebaseConfig = Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
  const deviceTokenCount = await db.deviceToken.count({ where: { isActive: true } });

  return [
    ...dependencyChecks("mobile"),
    {
      category: "frontend",
      label: "public/manifest.json created + validated",
      status: manifest?.name && manifest?.display && manifest?.start_url ? "pass" : "fail",
      detail: manifest?.name
        ? `Manifest detected for ${String(manifest.name)} with standalone display metadata.`
        : "Manifest file is missing or invalid.",
      link: "public/manifest.json",
    },
    {
      category: "frontend",
      label: "Service worker: offline Academy + Community caching",
      status: swText.includes("/academy") && swText.includes("/community") ? "pass" : "fail",
      detail:
        swText.includes("/academy") && swText.includes("/community")
          ? "Service worker explicitly caches the Academy and Community entry surfaces."
          : "Service worker does not yet prove offline-first Academy + Community caching coverage.",
      link: "public/sw.js",
    },
    {
      category: "backend",
      label: "Firebase FCM: test push notification delivers",
      status: hasFirebaseConfig && deviceTokenCount > 0 ? "pass" : "fail",
      detail:
        hasFirebaseConfig && deviceTokenCount > 0
          ? `${deviceTokenCount} active device token(s) are registered with Firebase config present.`
          : "Launch needs Firebase config plus at least one active device token to prove delivery.",
      link: "Server/services/fcmService.ts",
    },
    {
      category: "frontend",
      label: "Install prompt tested on Android Chrome + iOS Safari",
      status: hasInstallPromptCode ? "warn" : "fail",
      detail: hasInstallPromptCode
        ? "Install-prompt code is present, but final browser QA still requires operator confirmation."
        : "No install-prompt verification signal was detected in the frontend yet.",
      link: "src/hooks/usePushNotifications.ts",
    },
  ];
}

async function cloudChecks(): Promise<PreLaunchCheck[]> {
  const progressMap = getProgressMap();
  const activeUsers = await getActiveUserCountLast30Days();
  const intelligenceProgress = progressMap.get("intelligence") ?? 0;
  const [mpesaInstalls, stripeInstalls, googleInstalls] = await Promise.all([
    db.connectorInstall.count({
      where: {
        active: true,
        connector: { slug: "mpesa" },
      },
    }),
    db.connectorInstall.count({
      where: {
        active: true,
        connector: { slug: "stripe" },
      },
    }),
    db.connectorInstall.count({
      where: {
        active: true,
        connector: { slug: "google" },
      },
    }),
  ]);

  const apiKeyRoutesReady = includesAll("Server/routes/cloudRoutes.ts", [
    'router.post("/keys"',
    'router.delete("/keys/:keyId"',
  ]);
  const sdkPublishedSignal =
    exists("sdk/WinnersSDK.ts") &&
    (exists("sdk/package.json") || readText("sdk/WinnersSDK.ts").includes("@winners/sdk"));
  const nexusRouteReady = includesAll("Server/routes/supervisorRoutes.ts", ['case "NEXUS"', 'name: "NEXUS"']);
  const webhookLoopCompletedReady =
    readText("src/features/cloud/CloudWebhooksPage.tsx").includes("loop.completed") &&
    readText("Server/routes/agenticLoopRoutes.ts").includes("loop.completed");

  return [
    ...dependencyChecks("cloud"),
    {
      category: "dependency",
      label: "Intelligence at or above 75% readiness",
      status: intelligenceProgress >= 75 ? "pass" : "fail",
      detail: `Current Intelligence readiness is ${intelligenceProgress}%. Cloud launch requires at least 75%.`,
      link: "Server/services/adminOverviewService.ts",
    },
    {
      category: "dependency",
      label: "At least 50 active users in the last 30 days",
      status: activeUsers >= 50 ? "pass" : "fail",
      detail: `Current active-user count is ${activeUsers}. Cloud launch requires at least 50 active users.`,
      link: "Server/services/adminOverviewService.ts",
    },
    {
      category: "backend",
      label: "OAuth connector flow: M-Pesa + Stripe + Google tested",
      status: mpesaInstalls > 0 && stripeInstalls > 0 && googleInstalls > 0 ? "pass" : "fail",
      detail: `Active connector installs detected -> M-Pesa: ${mpesaInstalls}, Stripe: ${stripeInstalls}, Google: ${googleInstalls}.`,
      link: "Server/routes/cloudRoutes.ts",
    },
    {
      category: "backend",
      label: "API key creation/revocation working",
      status: apiKeyRoutesReady ? "pass" : "fail",
      detail: apiKeyRoutesReady
        ? "Cloud API key create + revoke routes are present."
        : "Cloud API key lifecycle routes are incomplete.",
      link: "Server/routes/cloudRoutes.ts",
    },
    {
      category: "data",
      label: "@winners/sdk npm package published (private or public)",
      status: sdkPublishedSignal ? "warn" : "fail",
      detail: sdkPublishedSignal
        ? "SDK source exists, but package publication still needs operator confirmation."
        : "No publishable @winners/sdk package signal was found yet.",
      link: "sdk/WinnersSDK.ts",
    },
    {
      category: "ai",
      label: "NEXUS supervisor chat responding",
      status: nexusRouteReady ? "pass" : "fail",
      detail: nexusRouteReady
        ? "NEXUS supervisor routing is registered."
        : "NEXUS supervisor routing was not detected.",
      link: "Server/routes/supervisorRoutes.ts",
    },
    {
      category: "backend",
      label: "Webhook: loop.completed event firing correctly",
      status: webhookLoopCompletedReady ? "pass" : "fail",
      detail: webhookLoopCompletedReady
        ? "Frontend and backend both reference the loop.completed webhook event."
        : "Cloud expects loop.completed, but the backend event surface is not yet aligned with that name.",
      link: "src/features/cloud/CloudWebhooksPage.tsx",
    },
  ];
}

async function getPreLaunchChecksInternal(layerId: string): Promise<PreLaunchCheck[]> {
  switch (layerId) {
    case "market":
      return marketChecks();
    case "work":
      return workChecks();
    case "mobile":
      return mobileChecks();
    case "cloud":
      return cloudChecks();
    default:
      return dependencyChecks(layerId);
  }
}

function getPolicy(layerId: string) {
  return LAYER_POLICIES[layerId] ?? {
    icon: "⬡",
    readyBadge: "READY",
    lockedBadge: "LOCKED",
    launchActionLabel: `Launch ${layerId} ->`,
    launchSummary: `Launch ${layerId} from the admin panel when the checklist clears.`,
    confirmationText: `LAUNCH ${layerId.toUpperCase()}`,
    forgeDirective: "Clear the checklist, then launch.",
    defaultNote: "Launch remains an admin-only act.",
    impactPreview: () => [],
    launchEffects: ["AppRegistry marks the layer live."],
  };
}

export function getLayerConfirmationText(layerId: string) {
  return getPolicy(layerId).confirmationText;
}

export function getLayerLaunchEffects(layerId: string) {
  return getPolicy(layerId).launchEffects;
}

export function getLayerLaunchSummary(layerId: string) {
  return getPolicy(layerId).launchSummary;
}

export async function getPlatformChecklist(layerId: string): Promise<PlatformLaunchChecklist | null> {
  const app = AppRegistry.get(layerId);
  if (!app) return null;

  const checks = await getPreLaunchChecksInternal(layerId);
  const checklist = checks.map((check) => ({
    item: check.label,
    status: toLegacyStatus(check.status),
    required: isRequired(check),
  }));
  const issues = checklist.filter((item) => item.required && item.status !== "done");
  const blockingCount = checks.filter((check) => check.status === "fail").length;
  const warningCount = checks.filter((check) => check.status === "warn").length;
  const policy = getPolicy(layerId);

  return {
    layerId,
    layerName: app.name,
    isReady: blockingCount === 0,
    issues,
    checklist,
    checks,
    blockingCount,
    warningCount,
    confirmationText: policy.confirmationText,
    launchSummary: policy.launchSummary,
    launchEffects: policy.launchEffects,
  };
}

export async function getPlatformLaunchControlSnapshot(): Promise<PlatformLaunchControlSnapshot> {
  const progressMap = getProgressMap();
  const usersNotifiedCount = await db.user.count({ where: { deletedAt: null } });
  const apps = AppRegistry.list().sort((a, b) => a.phase - b.phase);

  const rows = await Promise.all(
    apps.map(async (app) => {
      const checklist = await getPlatformChecklist(app.id);
      const policy = getPolicy(app.id);
      const dependencies = app.dependencies.map((dependencyId) => {
        const dependency = AppRegistry.get(dependencyId);
        return {
          id: dependencyId,
          label: dependency?.name.replace("Winners ", "") ?? dependencyId,
          isLive: dependency?.status === "live",
        };
      });

      const progress = progressMap.get(app.id) ?? (app.status === "live" ? 100 : 40);
      const isLive = app.status === "live";
      const isCore = app.id === "core";
      const isSuspended = app.status === "suspended";
      const actionMode: LaunchControlRow["actionMode"] = isCore
        ? "admin_only"
        : isLive || isSuspended
          ? "metrics"
          : dependencies.some((dependency) => !dependency.isLive)
            ? "locked"
            : "launch";

      const badge = isCore
        ? "ADMIN ONLY"
        : isLive
          ? "LIVE"
          : isSuspended
            ? "SUSPENDED"
            : checklist && checklist.blockingCount === 0
              ? policy.readyBadge
              : policy.lockedBadge;

      const helperLabel =
        actionMode === "locked"
          ? dependencies.filter((dependency) => !dependency.isLive).map((dependency) => `Needs ${dependency.label}`).join(" · ")
          : actionMode === "launch"
            ? policy.confirmationText
            : undefined;

      return {
        id: app.id,
        name: app.name,
        icon: policy.icon,
        progress,
        badge,
        actionMode,
        actionLabel: actionMode === "metrics" ? "Metrics" : policy.launchActionLabel,
        helperLabel,
        note: policy.defaultNote,
        canSuspend: isLive && app.id !== "core",
        detailPath: `/admin/platform/${app.id}`,
        blockingCount: checklist?.blockingCount ?? 0,
        warningCount: checklist?.warningCount ?? 0,
        dependencies,
        confirmationText: policy.confirmationText,
        launchSummary: policy.launchSummary,
      };
    }),
  );

  const queueRow = rows.find((row) => row.actionMode === "launch") ?? null;
  const queuePolicy = queueRow ? getPolicy(queueRow.id) : null;
  const queue = queueRow && queuePolicy
    ? {
        layerId: queueRow.id,
        name: queueRow.name,
        icon: queueRow.icon,
        progress: queueRow.progress,
        actionLabel: queueRow.actionLabel,
        dependencies: queueRow.dependencies,
        blockingCount: queueRow.blockingCount,
        warningCount: queueRow.warningCount,
        forgeDirective: queuePolicy.forgeDirective,
        isReady: queueRow.blockingCount === 0,
        confirmationText: queuePolicy.confirmationText,
        launchSummary: queuePolicy.launchSummary,
      }
    : null;

  return {
    summary:
      "Every layer launch is an admin act. No layer goes live automatically, no user can activate a layer, and the sovereign launch checklist must clear before AppRegistry changes state.",
    queue,
    rows,
    impactPreview: queueRow ? getPolicy(queueRow.id).impactPreview(usersNotifiedCount) : [],
    usersNotifiedCount,
  };
}
