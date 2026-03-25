import type { Request, Response, NextFunction } from "express";
import { getLayerAccessForUser } from "../services/layerAccessService.js";

export function requireLayerAccess(layerId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const access = await getLayerAccessForUser(layerId, req.user);
    if (!access) {
      return res.status(404).json({ error: "Layer not found" });
    }

    if (!access.allowed) {
      const statusCode = access.code === "cloud_upgrade_required" ? 402 : 423;
      return res.status(statusCode).json({
        error: access.message,
        access,
      });
    }

    next();
  };
}
