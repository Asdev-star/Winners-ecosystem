import { Router } from "express";
import { detectGeoContext } from "../services/geoDetectionService.js";

const router = Router();

router.get("/detect", async (req, res) => {
  try {
    const queryIp = typeof req.query.ip === "string" ? req.query.ip.trim() : "";
    const forwarded = typeof req.headers["x-forwarded-for"] === "string"
      ? req.headers["x-forwarded-for"].split(",")[0].trim()
      : null;
    const ipAddress = queryIp || forwarded || req.socket.remoteAddress || "127.0.0.1";
    const context = await detectGeoContext(ipAddress);
    return res.json(context);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to detect geo context" });
  }
});

export default router;
