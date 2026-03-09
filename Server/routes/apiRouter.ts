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

import { authLimiter, postLimiter } from "../middleware/rateLimitMiddleware.js";

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
  "/email",
  "/notifications",
  "/stripe",
  "/search",
  "/activity",
  "/referral",
  "/admin",
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
  "/community",
  "/vendors",
  "/products",
  "/cart",
  "/orders",
  "/work",
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
router.use("/email", emailRoutes);
router.use("/notifications", notificationRoutes);
router.use("/stripe", stripeRoutes);
router.use("/search", searchRoutes);
router.use("/activity", activityRoutes);
router.use("/referral", referralRoutes);
router.use("/admin", adminRoutes);
router.use("/changelog", changelogRoutes);
router.use("/2fa", twoFactorRoutes);
router.use("/posts", postLimiter, postRoutes);
router.use("/groups", groupRoutes);
router.use("/gdpr", gdprRoutes);
router.use("/slack", slackRoutes);
router.use("/sso", ssoRoutes);
router.use("/registry", registryRoutes);
router.use("/academy", academyRoutes);
router.use("/chat", chatRoutes);
router.use("/messages", messageRoutes);
router.use("/ai-platform", aiPlatformRoutes);
router.use("/spaces", liveSpaceRoutes);
router.use("/opportunities", opportunityRoutes);
router.use("/community", communityIntelligenceRoutes);
router.use("/external-courses", externalCourseRoutes);
router.use("/social", socialRoutes);
router.use("/vendors", vendorRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/work", workRoutes);

export default router;
