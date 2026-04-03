import { Router } from "express";
import authRoutes from "./authRoutes.js";
import passwordResetRoutes from "./passwordResetRoutes.js";
import tenantsRoutes from "./tenantsRoutes.js";
import usersRoutes from "./usersRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import exportRoutes from "./exportRoutes.js";
import billingRoutes from "./billingRoutes.js";
import aiRoutes from "./aiRoutes.js";
import profileRoutes from "./profileRoutes.js";
import onboardingRoutes from "./onboardingRoutes.js";
import emailRoutes from "./emailRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import stripeRoutes from "./stripeRoutes.js";
import searchRoutes from "./searchRoutes.js";
import activityRoutes from "./activityRoutes.js";
import referralRoutes from "./referralRoutes.js";
import adminRoutes from "./adminRoutes.js";
import changelogRoutes from "./changelogRoutes.js";
import twoFactorRoutes from "./twoFactorRoutes.js";
import postRoutes from "./postRoutes.js";
import groupRoutes from "./groupRoutes.js";
import slackRoutes from "./slackRoutes.js";
import ssoRoutes from "./ssoRoutes.js";
import whitelabelRoutes from "./whitelabelRoutes.js";
import registryRoutes from "./registryRoutes.js";
import healthRoutes from "./healthRoutes.js";
import gdprRoutes from "./gdprRoutes.js";
import academyRoutes from "./academyRoutes.js";
import chatRoutes from "./chatRoutes.js";
import messageRoutes from "./messageRoutes.js";
import aiPlatformRoutes from "./aiPlatformRoutes.js";
import liveSpaceRoutes from "./liveSpaceRoutes.js";
import opportunityRoutes from "./opportunityRoutes.js";
import communityIntelligenceRoutes from "./communityIntelligenceRoutes.js";
import externalCourseRoutes from "./externalCourseRoutes.js";
import socialRoutes from "./socialRoutes.js";
import vendorRoutes from "./vendorRoutes.js";
import productRoutes from "./productRoutes.js";
import cartRoutes from "./cartRoutes.js";
import orderRoutes from "./orderRoutes.js";
import workRoutes from "./workRoutes.js";
import liveSessionRoutes from "./liveSessionRoutes.js";
import quizRoutes from "./quizRoutes.js";
import lectureUploadRoutes from "./lectureUploadRoutes.js";
import dropshipRoutes from "./dropshipRoutes.js";
import financeRoutes from "./financeRoutes.js";
import checkoutRoutes from "./checkoutRoutes.js";
import cloudRoutes from "./cloudRoutes.js";
import studioRoutes from "./studioRoutes.js";
import omegaRoutes from "./omegaRoutes.js";
import supervisorRoutes from "./supervisorRoutes.js";
import communityExtrasRoutes from "./communityExtrasRoutes.js";
import autonomousRoutes from "./autonomousRoutes.js";
import agenticLoopRoutes from "./agenticLoopRoutes.js";
import creditRoutes from "./creditRoutes.js";
import escrowRoutes from "./escrowRoutes.js";
import circuitRoutes from "./circuitRoutes.js";
import atlasRoutes from "./atlasRoutes.js";
import atlasMarketRoutes from "./atlasMarketRoutes.js";
import connectorRoutes from "./connectorRoutes.js";
import tradingRoutes from "./tradingRoutes.js";
import pluginRoutes from "./pluginRoutes.js";
import notificationTokenRoutes from "./notificationTokenRoutes.js";
import adminSettingsRoutes from "./adminSettingsRoutes.js";
import geoDetectionRoutes from "./geoDetectionRoutes.js";
import mobileAnalyticsRoutes from "./mobileAnalyticsRoutes.js";
import { DEFAULT_ECOSYSTEM_SETTINGS } from "./adminRoutes.js";
import { getEcosystemConfigSnapshot } from "../services/ecosystemConfigService.js";
import { getTranslationOverrides } from "../services/languageService.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireLayerAccess } from "../middleware/layerAccessMiddleware.js";
import { authLimiter, postLimiter } from "../middleware/rateLimitMiddleware.js";
import db from "../db.js";

const router = Router();
const version = process.env.npm_package_version ?? "1.0.0";

const gatewayRoutes = [
  "/auth",
  "/health",
  "/tenants",
  "/users",
  "/analytics",
  "/export",
  "/billing",
  "/ai",
  "/profile",
  "/onboarding",
  "/email",
  "/notifications",
  "/stripe",
  "/search",
  "/activity",
  "/referral",
  "/admin",
  "/admin/settings",
  "/admin/geo",
  "/admin/mobile-analytics",
  "/changelog",
  "/2fa",
  "/posts",
  "/groups",
  "/gdpr",
  "/slack",
  "/sso",
  "/registry",
  "/academy",
  "/chat",
  "/messages",
  "/ai-platform",
  "/live-sessions",
  "/community",
  "/vendors",
  "/products",
  "/cart",
  "/orders",
  "/work",
  "/quizzes",
  "/lecture-uploads",
  "/cloud",
  "/studio",
  "/omega",
  "/supervisors",
  "/community-extras",
  "/insights",
  "/agentic",
  "/credits",
  "/escrow",
  "/circuit",
  "/atlas",
  "/connectors",
  "/push-tokens",
  "/plugins",
  "/public",
];

router.get("/", (_req, res) => {
  res.json({
    name: "Winners Ecosystem API Gateway",
    gateway: "v1",
    version,
    timestamp: new Date().toISOString(),
    routeCount: gatewayRoutes.length,
    routes: gatewayRoutes,
  });
});

router.get("/public/ecosystem-settings", async (req, res) => {
  try {
    const country = typeof req.query.country === "string" ? req.query.country.trim().toUpperCase() : "";
    const records = await db.ecosystemSettings.findMany();
    const ecosystemSnapshot = await getEcosystemConfigSnapshot();
    const translationOverrides = await getTranslationOverrides();
    const stored = records.reduce<Record<string, unknown>>((acc, record) => {
      acc[record.key] = record.value;
      return acc;
    }, {});
    const settings = {
      ...DEFAULT_ECOSYSTEM_SETTINGS,
      ...stored,
    } as Record<string, unknown> & typeof DEFAULT_ECOSYSTEM_SETTINGS & {
      theme?: unknown;
      translationOverrides?: unknown;
    };
    const publicTheme = ecosystemSnapshot.theme;
    if (!settings.theme) {
      settings.theme = publicTheme;
    }
    if (!settings.translationOverrides) {
      settings.translationOverrides = translationOverrides;
    }
    settings.brandColor = publicTheme.brandColor ?? settings.brandColor;
    settings.accentColor = publicTheme.accentColor ?? settings.accentColor;
    settings.defaultTheme = publicTheme.defaultTheme ?? settings.defaultTheme;
    const mapping = Array.isArray(settings.countryLanguageMapping)
      ? settings.countryLanguageMapping as Array<{ country: string; language: string }>
      : DEFAULT_ECOSYSTEM_SETTINGS.countryLanguageMapping;
    const resolvedLanguage =
      (mapping.find((entry) => entry.country.toUpperCase() === country)?.language?.toLowerCase() ?? settings.language ?? DEFAULT_ECOSYSTEM_SETTINGS.language);

    return res.json({
      settings,
      country,
      resolvedLanguage,
      countryLanguageMapping: mapping,
      translationOverrides,
    });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load ecosystem settings" });
  }
});

router.post("/public/analytics/track", async (req, res) => {
  try {
    const records = await db.ecosystemSettings.findMany();
    const settings = records.reduce<Record<string, unknown>>((acc, record) => {
      acc[record.key] = record.value;
      return acc;
    }, {});
    const merged = { ...DEFAULT_ECOSYSTEM_SETTINGS, ...settings };

    if (merged.analyticsTracking === false) {
      return res.status(204).end();
    }

    const { userId, tenantId, sessionId, event, activity, page, metadata, country, city, duration, issueType, issueData } = req.body ?? {};

    await db.userActivity.create({
      data: {
        userId: typeof userId === "string" ? userId : null,
        tenantId: typeof tenantId === "string" ? tenantId : null,
        sessionId: typeof sessionId === "string" ? sessionId : null,
        event: typeof event === "string" ? event : "unknown",
        activity: typeof activity === "string" ? activity : "unknown",
        page: typeof page === "string" ? page : null,
        metadata: metadata && typeof metadata === "object" ? metadata : {},
        country: typeof country === "string" ? country : null,
        city: typeof city === "string" ? city : null,
        duration: typeof duration === "number" ? duration : null,
        issueType: typeof issueType === "string" ? issueType : null,
        issueData: issueData && typeof issueData === "object" ? issueData : {},
      },
    });

    return res.json({ message: "Activity tracked" });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to track activity" });
  }
});

router.post("/public/analytics/app-download", async (req, res) => {
  try {
    const records = await db.ecosystemSettings.findMany();
    const settings = records.reduce<Record<string, unknown>>((acc, record) => {
      acc[record.key] = record.value;
      return acc;
    }, {});
    const merged = { ...DEFAULT_ECOSYSTEM_SETTINGS, ...settings };

    if (merged.analyticsTracking === false) {
      return res.status(204).end();
    }

    const { userId, tenantId, platform, platformVersion, appVersion, country, city, deviceModel, osVersion, language, isFirstDownload } = req.body ?? {};

    await db.appDownload.create({
      data: {
        userId: typeof userId === "string" ? userId : null,
        tenantId: typeof tenantId === "string" ? tenantId : null,
        platform: typeof platform === "string" ? platform : "unknown",
        platformVersion: typeof platformVersion === "string" ? platformVersion : null,
        appVersion: typeof appVersion === "string" ? appVersion : "1.0.0",
        country: typeof country === "string" ? country : null,
        city: typeof city === "string" ? city : null,
        deviceModel: typeof deviceModel === "string" ? deviceModel : null,
        osVersion: typeof osVersion === "string" ? osVersion : null,
        language: typeof language === "string" ? language : null,
        isFirstDownload: Boolean(isFirstDownload),
      },
    });

    return res.json({ message: "Download recorded" });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to record download" });
  }
});

router.post("/analytics/event", async (req, res) => {
  try {
    const records = await db.ecosystemSettings.findMany();
    const settings = records.reduce<Record<string, unknown>>((acc, record) => {
      acc[record.key] = record.value;
      return acc;
    }, {});
    const merged = { ...DEFAULT_ECOSYSTEM_SETTINGS, ...settings };

    if (merged.analyticsTracking === false) {
      return res.status(204).end();
    }

    const {
      userId,
      tenantId,
      sessionId,
      eventType,
      layer,
      feature,
      metadata,
      platform,
      countryCode,
    } = req.body ?? {};

    await db.userActivity.create({
      data: {
        userId: typeof userId === "string" ? userId : null,
        tenantId: typeof tenantId === "string" ? tenantId : null,
        sessionId: typeof sessionId === "string" ? sessionId : null,
        event: typeof eventType === "string" ? eventType : "unknown",
        activity: typeof feature === "string" ? feature : typeof eventType === "string" ? eventType : "unknown",
        page: typeof layer === "string" ? layer : typeof platform === "string" ? platform : null,
        metadata: metadata && typeof metadata === "object" ? metadata : {},
        country: typeof countryCode === "string" ? countryCode : null,
        city: null,
        duration: null,
        issueType: null,
        issueData: null,
      },
    });

    return res.json({ message: "Analytics event recorded" });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to record analytics event" });
  }
});

router.use("/auth/login", authLimiter);
router.use("/auth/register", authLimiter);
router.use("/auth", authRoutes);
router.use("/auth", passwordResetRoutes);
router.use("/health", healthRoutes);
router.use("/tenants", tenantsRoutes);
router.use("/users", usersRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/export", exportRoutes);
router.use("/billing", billingRoutes);
router.use("/ai", aiRoutes);
router.use("/profile", profileRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/email", emailRoutes);
router.use("/notifications", notificationRoutes);
router.use("/stripe", stripeRoutes);
router.use("/search", searchRoutes);
router.use("/activity", activityRoutes);
router.use("/referral", referralRoutes);
router.use("/admin", adminRoutes);
router.use("/admin/settings", adminSettingsRoutes);
router.use("/admin/geo", geoDetectionRoutes);
router.use("/admin/mobile-analytics", mobileAnalyticsRoutes);
router.use("/admin/analytics/mobile", mobileAnalyticsRoutes);
router.use("/changelog", changelogRoutes);
router.use("/2fa", twoFactorRoutes);
router.use("/posts", postLimiter, postRoutes);
router.use("/groups", groupRoutes);
router.use("/gdpr", gdprRoutes);
router.use("/slack", slackRoutes);
router.use("/sso", ssoRoutes);
router.use("/whitelabel", whitelabelRoutes);
router.use("/registry", registryRoutes);
router.use("/academy", academyRoutes);
router.use("/chat", chatRoutes);
router.use("/messages", messageRoutes);
router.use("/ai-platform", aiPlatformRoutes);
router.use("/live-sessions", liveSessionRoutes);
router.use("/spaces", liveSpaceRoutes);
router.use("/opportunities", opportunityRoutes);
router.use("/community", communityIntelligenceRoutes);
router.use("/external-courses", externalCourseRoutes);
router.use("/social", socialRoutes);
router.use(
  "/vendors",
  authMiddleware,
  requireLayerAccess("market"),
  vendorRoutes,
);
router.use(
  "/dropship",
  authMiddleware,
  requireLayerAccess("market"),
  dropshipRoutes,
);
router.use(
  "/finance",
  authMiddleware,
  requireLayerAccess("market"),
  financeRoutes,
);
router.use(
  "/products",
  authMiddleware,
  requireLayerAccess("market"),
  productRoutes,
);
router.use("/cart", authMiddleware, requireLayerAccess("market"), cartRoutes);
router.use(
  "/checkout",
  authMiddleware,
  requireLayerAccess("market"),
  checkoutRoutes,
);
router.use(
  "/orders",
  authMiddleware,
  requireLayerAccess("market"),
  orderRoutes,
);
router.use("/work", authMiddleware, requireLayerAccess("work"), workRoutes);
router.use("/quizzes", quizRoutes);
router.use("/lecture-uploads", lectureUploadRoutes);
router.use("/cloud", authMiddleware, requireLayerAccess("cloud"), cloudRoutes);
router.use("/studio", studioRoutes);
router.use("/omega", omegaRoutes);
router.use("/supervisors", supervisorRoutes);
router.use("/community-extras", communityExtrasRoutes);
router.use("/insights", autonomousRoutes);
router.use("/agentic", agenticLoopRoutes);
router.use("/credits", creditRoutes);
router.use("/escrow", authMiddleware, requireLayerAccess("work"), escrowRoutes);
router.use(
  "/circuit",
  authMiddleware,
  requireLayerAccess("work"),
  circuitRoutes,
);
router.use("/atlas", authMiddleware, requireLayerAccess("market"), atlasRoutes);
router.use(
  "/ai/atlas",
  authMiddleware,
  requireLayerAccess("market"),
  atlasMarketRoutes,
);
router.use(
  "/connectors",
  authMiddleware,
  requireLayerAccess("cloud"),
  connectorRoutes,
);
router.use(
  "/plugins",
  authMiddleware,
  requireLayerAccess("cloud"),
  pluginRoutes,
);
router.use("/push-tokens", notificationTokenRoutes);

export default router;
