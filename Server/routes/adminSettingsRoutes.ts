import { Router } from "express";
import jwt from "jsonwebtoken";
import { concealedSuperAdminMiddleware } from "../middleware/superAdminMiddleware.js";
import {
  ecosystemConfigEvents,
  getEcosystemConfigSnapshot,
  getFeatureFlags,
  getCountryRules,
  getLanguageRoutes,
  updateEcosystemSection,
  updateEcosystemPatch,
  upsertFeatureFlags,
  upsertCountryRules,
  setLanguageRoutes,
} from "../services/ecosystemConfigService.js";
import { getMobileAnalytics } from "../services/mobileAnalyticsService.js";
import { detectGeoContext } from "../services/geoDetectionService.js";
import { getTranslationOverrides, upsertTranslationOverrides } from "../services/languageService.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? "winners_dev_secret_change_in_prod";

function authenticateStreamToken(token?: string) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { role?: string };
  } catch {
    return null;
  }
}

function actorId(req: { user?: { userId?: string | null } }) {
  return req.user?.userId ?? "system";
}

router.get("/stream", async (req, res) => {
  const token =
    typeof req.query.token === "string"
      ? req.query.token
      : req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined;
  const decoded = authenticateStreamToken(token);
  if (!decoded || !["owner", "admin"].includes(decoded.role ?? "")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write(`event: ready\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  const forwardUpdate = (payload: unknown) => {
    res.write(`event: update\ndata: ${JSON.stringify(payload)}\n\n`);
  };

  ecosystemConfigEvents.on("updated", forwardUpdate);
  const heartbeat = setInterval(() => {
    res.write(": ping\n\n");
  }, 25_000);

  req.on("close", () => {
    ecosystemConfigEvents.off("updated", forwardUpdate);
    clearInterval(heartbeat);
  });
});

router.use(concealedSuperAdminMiddleware);

router.get("/snapshot", async (_req, res) => {
  try {
    const [snapshot, languageRoutes, translationOverrides, featureFlags, countryRules, mobileAnalytics] = await Promise.all([
      getEcosystemConfigSnapshot(true),
      getLanguageRoutes(),
      getTranslationOverrides(),
      getFeatureFlags(),
      getCountryRules(),
      getMobileAnalytics(),
    ]);

    return res.json({
      ...snapshot,
      languageRoutes,
      translationOverrides,
      featureFlags,
      countryRules,
      mobileAnalytics,
    });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load settings snapshot" });
  }
});

router.get("/theme", async (_req, res) => {
  try {
    const snapshot = await getEcosystemConfigSnapshot();
    return res.json(snapshot.theme);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load theme settings" });
  }
});

router.post("/theme", async (req, res) => {
  try {
    const next = await updateEcosystemSection("theme", { ...(await getEcosystemConfigSnapshot()).theme, ...(req.body ?? {}) }, actorId(req));
    return res.json({ message: "Theme settings updated", theme: next });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update theme settings" });
  }
});

router.put("/theme", async (req, res) => {
  try {
    const next = await updateEcosystemSection("theme", { ...(await getEcosystemConfigSnapshot()).theme, ...(req.body ?? {}) }, actorId(req));
    return res.json({ message: "Theme settings updated", theme: next });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update theme settings" });
  }
});

router.get("/localization", async (_req, res) => {
  try {
    const snapshot = await getEcosystemConfigSnapshot();
    return res.json({
      ...snapshot.localization,
      languageRoutes: await getLanguageRoutes(),
      countryRules: await getCountryRules(),
    });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load localization settings" });
  }
});

router.put("/localization", async (req, res) => {
  try {
    const current = await getEcosystemConfigSnapshot();
    const next = await updateEcosystemSection("localization", { ...current.localization, ...(req.body ?? {}) }, actorId(req));
    return res.json({ message: "Localization settings updated", localization: next });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update localization settings" });
  }
});

router.get("/personalisation", async (_req, res) => {
  try {
    const snapshot = await getEcosystemConfigSnapshot();
    return res.json(snapshot.personalisation);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load personalisation settings" });
  }
});

router.put("/personalisation", async (req, res) => {
  try {
    const current = await getEcosystemConfigSnapshot();
    const next = await updateEcosystemSection("personalisation", { ...current.personalisation, ...(req.body ?? {}) }, actorId(req));
    return res.json({ message: "Personalisation settings updated", personalisation: next });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update personalisation settings" });
  }
});

router.get("/mobile", async (_req, res) => {
  try {
    const snapshot = await getEcosystemConfigSnapshot();
    return res.json({ ...snapshot.mobile, mobileAnalytics: await getMobileAnalytics() });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load mobile settings" });
  }
});

router.put("/mobile", async (req, res) => {
  try {
    const current = await getEcosystemConfigSnapshot();
    const next = await updateEcosystemSection("mobile", { ...current.mobile, ...(req.body ?? {}) }, actorId(req));
    return res.json({ message: "Mobile settings updated", mobile: next });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update mobile settings" });
  }
});

router.get("/analytics", async (_req, res) => {
  try {
    const snapshot = await getEcosystemConfigSnapshot();
    return res.json({ ...snapshot.analytics, mobileAnalytics: await getMobileAnalytics() });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load analytics settings" });
  }
});

router.put("/analytics", async (req, res) => {
  try {
    const current = await getEcosystemConfigSnapshot();
    const next = await updateEcosystemSection("analytics", { ...current.analytics, ...(req.body ?? {}) }, actorId(req));
    return res.json({ message: "Analytics settings updated", analytics: next });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update analytics settings" });
  }
});

router.get("/geo", async (_req, res) => {
  try {
    const snapshot = await getEcosystemConfigSnapshot();
    return res.json({
      ...snapshot.geo,
      languageRoutes: await getLanguageRoutes(),
      countryRules: await getCountryRules(),
    });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load geo settings" });
  }
});

router.put("/geo", async (req, res) => {
  try {
    const current = await getEcosystemConfigSnapshot();
    const next = await updateEcosystemSection("geo", { ...current.geo, ...(req.body ?? {}) }, actorId(req));
    return res.json({ message: "Geo settings updated", geo: next });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update geo settings" });
  }
});

router.get("/language", async (_req, res) => {
  try {
    return res.json(await getLanguageRoutes());
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load language routes" });
  }
});

router.get("/language/routes", async (_req, res) => {
  try {
    return res.json(await getLanguageRoutes());
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load language routes" });
  }
});

router.post("/language", async (req, res) => {
  try {
    const routes = Array.isArray(req.body) ? req.body : [];
    const saved = await setLanguageRoutes(routes, actorId(req));
    return res.json({ message: "Language routes updated", routes: saved });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update language routes" });
  }
});

router.put("/language", async (req, res) => {
  try {
    const routes = Array.isArray(req.body) ? req.body : [];
    const saved = await setLanguageRoutes(routes, actorId(req));
    return res.json({ message: "Language routes updated", routes: saved });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update language routes" });
  }
});

router.put("/language/routes", async (req, res) => {
  try {
    const routes = Array.isArray(req.body) ? req.body : [];
    const saved = await setLanguageRoutes(routes, actorId(req));
    return res.json({ message: "Language routes updated", routes: saved });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update language routes" });
  }
});

router.post("/language/test", async (req, res) => {
  try {
    const ip = typeof req.body?.ip === "string" ? req.body.ip : "";
    const context = await detectGeoContext(ip || req.socket.remoteAddress || "127.0.0.1");
    return res.json(context);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to test geo detection" });
  }
});

router.get("/translations", async (_req, res) => {
  try {
    return res.json(await getTranslationOverrides());
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load translation overrides" });
  }
});

router.post("/translations", async (req, res) => {
  try {
    const overrides = Array.isArray(req.body) ? req.body : [];
    const saved = await upsertTranslationOverrides(overrides, actorId(req));
    return res.json({ message: "Translation overrides updated", translationOverrides: saved });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update translation overrides" });
  }
});

router.put("/translations", async (req, res) => {
  try {
    const overrides = Array.isArray(req.body) ? req.body : [];
    const saved = await upsertTranslationOverrides(overrides, actorId(req));
    return res.json({ message: "Translation overrides updated", translationOverrides: saved });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update translation overrides" });
  }
});

router.get("/country-rules", async (_req, res) => {
  try {
    return res.json(await getCountryRules());
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load country rules" });
  }
});

router.put("/country-rules", async (req, res) => {
  try {
    const rules = Array.isArray(req.body) ? req.body : [];
    const saved = await upsertCountryRules(rules, actorId(req));
    return res.json({ message: "Country rules updated", rules: saved });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update country rules" });
  }
});

router.get("/feature-flags", async (_req, res) => {
  try {
    return res.json(await getFeatureFlags());
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load feature flags" });
  }
});

router.put("/feature-flags", async (req, res) => {
  try {
    const flags = Array.isArray(req.body) ? req.body : [];
    const saved = await upsertFeatureFlags(flags, actorId(req));
    return res.json({ message: "Feature flags updated", featureFlags: saved });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update feature flags" });
  }
});

export default router;
