import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import {
  endMobileSession,
  getMobileAnalytics,
  getMobileCountries,
  getMobileCrashes,
  getMobileDownloads,
  getMobileErrors,
  getMobileFeatures,
  getMobileFunnel,
  getMobileSessions,
  getUserJourney,
  recordAppDownload,
  recordAnalyticsEvent,
  recordErrorReport,
  resolveAnalyticsError,
  trackMobileSession,
} from "../services/mobileAnalyticsService.js";

const router = Router();
const adminOnly = [authMiddleware, requireRole("owner", "admin")] as const;

router.post("/session/start", async (req, res) => {
  try {
    const session = await trackMobileSession(req.body ?? {});
    return res.json(session);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to track mobile session" });
  }
});

router.post("/session/:id/end", async (req, res) => {
  try {
    const session = await endMobileSession(req.params.id, req.body?.duration);
    return res.json(session);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to end mobile session" });
  }
});

router.post("/downloads", async (req, res) => {
  try {
    const download = await recordAppDownload(req.body ?? {});
    return res.json(download);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to record download" });
  }
});

router.post("/errors", async (req, res) => {
  try {
    const report = await recordErrorReport(req.body ?? {});
    return res.json(report);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to record error report" });
  }
});

router.post("/errors/:id/resolve", ...adminOnly, async (req, res) => {
  try {
    const resolvedBy = typeof req.body?.resolvedBy === "string" ? req.body.resolvedBy : null;
    const report = await resolveAnalyticsError(String(req.params.id), resolvedBy);
    return res.json(report);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to resolve error report" });
  }
});

router.post("/event", async (req, res) => {
  try {
    const event = await recordAnalyticsEvent(req.body ?? {});
    return res.json(event);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to record analytics event" });
  }
});

router.get("/dashboard", ...adminOnly, async (_req, res) => {
  try {
    return res.json(await getMobileAnalytics());
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load mobile analytics" });
  }
});

router.get("/downloads", ...adminOnly, async (req, res) => {
  try {
    const periodQuery = Array.isArray(req.query.period) ? String(req.query.period[0]) : String(req.query.period ?? "30d");
    const period = periodQuery.endsWith("d")
      ? Number(periodQuery.slice(0, -1))
      : 30;
    const platform = typeof req.query.platform === "string" ? req.query.platform : null;
    return res.json(await getMobileDownloads(period, platform));
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load download analytics" });
  }
});

router.get("/sessions", ...adminOnly, async (req, res) => {
  try {
    const periodQuery = Array.isArray(req.query.period) ? String(req.query.period[0]) : String(req.query.period ?? "7d");
    const period = periodQuery.endsWith("d")
      ? Number(periodQuery.slice(0, -1))
      : 7;
    const platform = typeof req.query.platform === "string" ? req.query.platform : "all";
    return res.json(await getMobileSessions(period, platform));
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load session analytics" });
  }
});

router.get("/features", ...adminOnly, async (req, res) => {
  try {
    const periodQuery = Array.isArray(req.query.period) ? String(req.query.period[0]) : String(req.query.period ?? "30d");
    const period = periodQuery.endsWith("d")
      ? Number(periodQuery.slice(0, -1))
      : 30;
    const layer = typeof req.query.layer === "string" ? req.query.layer : null;
    return res.json(await getMobileFeatures(period, layer));
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load feature analytics" });
  }
});

router.get("/funnel", ...adminOnly, async (req, res) => {
  try {
    const steps = Array.isArray(req.query.steps)
      ? req.query.steps.flatMap((step) => String(step).split(","))
      : typeof req.query.steps === "string"
        ? req.query.steps.split(",")
        : [];
    const normalizedSteps = steps.map((step) => step.trim()).filter(Boolean);
    const layer = typeof req.query.layer === "string" ? req.query.layer : null;
    return res.json(await getMobileFunnel(normalizedSteps, layer));
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load funnel analytics" });
  }
});

router.get("/errors", ...adminOnly, async (req, res) => {
  try {
    const periodQuery = Array.isArray(req.query.period) ? String(req.query.period[0]) : String(req.query.period ?? "7d");
    const period = periodQuery.endsWith("d")
      ? Number(periodQuery.slice(0, -1))
      : 7;
    const layer = typeof req.query.layer === "string" ? req.query.layer : null;
    return res.json(await getMobileErrors(period, layer));
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load error analytics" });
  }
});

router.get("/countries", ...adminOnly, async (_req, res) => {
  try {
    const periodQuery = Array.isArray(_req.query.period) ? String(_req.query.period[0]) : String(_req.query.period ?? "30d");
    const period = periodQuery.endsWith("d")
      ? Number(periodQuery.slice(0, -1))
      : 30;
    const platform = typeof _req.query.platform === "string" ? _req.query.platform : null;
    return res.json(await getMobileCountries(period, platform));
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load country analytics" });
  }
});

router.get("/crashes", ...adminOnly, async (req, res) => {
  try {
    const periodQuery = Array.isArray(req.query.period) ? String(req.query.period[0]) : String(req.query.period ?? "30d");
    const period = periodQuery.endsWith("d")
      ? Number(periodQuery.slice(0, -1))
      : 30;
    const layer = typeof req.query.layer === "string" ? req.query.layer : null;
    return res.json(await getMobileCrashes(period, layer));
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load crash analytics" });
  }
});

router.get("/users/:userId/journey", ...adminOnly, async (req, res) => {
  try {
    return res.json(await getUserJourney(String(req.params.userId)));
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load user journey" });
  }
});

export default router;
