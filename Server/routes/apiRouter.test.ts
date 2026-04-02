// @vitest-environment node

import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function readApiRouterSource() {
  const filePath = path.resolve(process.cwd(), "Server/routes/apiRouter.ts");
  return fs.readFile(filePath, "utf8");
}

describe("apiRouter wiring contract", () => {
  it("declares the gateway root endpoint", async () => {
    const source = await readApiRouterSource();
    expect(source).toContain("router.get(\"/\", (_req, res) =>");
    expect(source).toContain("name: \"Winners Ecosystem API Gateway\"");
    expect(source).toContain("routeCount: gatewayRoutes.length");
  });

  it("mounts all core platform route groups", async () => {
    const source = await readApiRouterSource();

    const requiredMounts = [
      "router.use(\"/auth\", authRoutes);",
      "router.use(\"/auth\", passwordResetRoutes);",
      "router.use(\"/health\", healthRoutes);",
      "router.use(\"/tenants\", tenantsRoutes);",
      "router.use(\"/users\", usersRoutes);",
      "router.use(\"/analytics\", analyticsRoutes);",
      "router.use(\"/export\", exportRoutes);",
      "router.use(\"/billing\", billingRoutes);",
      "router.use(\"/ai\", aiRoutes);",
      "router.use(\"/profile\", profileRoutes);",
      "router.use(\"/email\", emailRoutes);",
      "router.use(\"/notifications\", notificationRoutes);",
      "router.use(\"/stripe\", stripeRoutes);",
      "router.use(\"/search\", searchRoutes);",
      "router.use(\"/activity\", activityRoutes);",
      "router.use(\"/referral\", referralRoutes);",
      "router.use(\"/admin\", adminRoutes);",
      "router.use(\"/changelog\", changelogRoutes);",
      "router.use(\"/2fa\", twoFactorRoutes);",
      "router.use(\"/groups\", groupRoutes);",
      "router.use(\"/gdpr\", gdprRoutes);",
      "router.use(\"/slack\", slackRoutes);",
      "router.use(\"/sso\", ssoRoutes);",
      "router.use(\"/registry\", registryRoutes);",
      "router.use(\"/academy\", academyRoutes);",
      "router.use(\"/chat\", chatRoutes);",
      "router.use(\"/ai-platform\", aiPlatformRoutes);",
      "router.use(\"/push-tokens\", notificationTokenRoutes);",
    ];

    requiredMounts.forEach((mountLine) => {
      expect(source).toContain(mountLine);
    });
  });

  it("keeps rate-limited critical routes protected", async () => {
    const source = await readApiRouterSource();
    expect(source).toContain("router.use(\"/auth/login\", authLimiter);");
    expect(source).toContain("router.use(\"/auth/register\", authLimiter);");
    expect(source).toContain("router.use(\"/posts\", postLimiter, postRoutes);");
  });
});
