// Server/routes/registryRoutes.ts
// ─── Core Infrastructure: App Registry API Endpoints ────────────────────────
// Exposes the App Registry for admin visibility and SDK consumers.

import { Router, Request, Response } from "express";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import AppRegistry from "../services/appRegistry.js";

const router = Router();

// ─── GET /registry — Public ecosystem summary ─────────────────────────────────

router.get("/", (_req: Request, res: Response) => {
  res.json(AppRegistry.summary());
});

// ─── GET /registry/:id — Single app details ────────────────────────────────────

router.get("/:id", (_req: Request, res: Response) => {
  const id = String(_req.params.id);
  const app = AppRegistry.get(id);
  if (!app) {
    return res.status(404).json({ error: "App not registered", id });
  }
  res.json(app);
});

// ─── GET /registry/:id/dependencies — Dependency check ────────────────────────

router.get("/:id/dependencies", (_req: Request, res: Response) => {
  const id = String(_req.params.id);
  const check = AppRegistry.checkDependencies(id);
  res.json({
    appId:  id,
    ...check,
    message: check.ready
      ? "All dependencies are live. This app can be activated."
      : `Missing live dependencies: ${check.missing.join(", ")}`,
  });
});

// ─── PATCH /registry/:id — Update app status (admin only) ─────────────────────

router.patch("/:id", authMiddleware, requireRole("owner", "admin"), (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { status, version, features } = req.body;
  const updated = AppRegistry.update(id, { status, version, features });

  if (!updated) {
    return res.status(404).json({ error: "App not registered", id });
  }
  res.json({ message: "App registration updated", app: updated });
});

export default router;
