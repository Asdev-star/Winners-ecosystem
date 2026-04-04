import type { NextFunction, Request, Response } from "express";
import { detectGeoContext, type GeoContext } from "../services/geoDetectionService.js";

type GeoRequest = Request & { geo?: GeoContext };

function readIp(req: Request) {
  const forwarded = typeof req.headers["x-forwarded-for"] === "string"
    ? req.headers["x-forwarded-for"].split(",")[0].trim()
    : "";
  const remote = req.socket.remoteAddress ?? "";
  return forwarded || remote || "127.0.0.1";
}

export async function geoMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const geo = await detectGeoContext(readIp(req));
    (req as GeoRequest).geo = geo;

    res.setHeader("X-Winners-Country", geo.countryCode);
    res.setHeader("X-Winners-Language", geo.language);
    res.setHeader("X-Winners-Currency", geo.currencyCode);
    res.setHeader("X-Winners-RTL", String(geo.rtl));

    next();
  } catch {
    next();
  }
}
