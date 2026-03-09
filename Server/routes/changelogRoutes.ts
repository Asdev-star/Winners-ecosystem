// Server/routes/changelogRoutes.ts

import { Router, type NextFunction, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Internal server error";
}

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  if (!req.user || !adminEmails.includes(req.user.email.toLowerCase())) {
    return res.status(403).json({ message: "Superadmin access required" });
  }
  return next();
}

// GET /changelog — public, all published entries
router.get("/", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const entries = await db.changelogEntry.findMany({
      where:   { published: true },
      orderBy: { publishedAt: "desc" },
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
});

// GET /changelog/all — admin only, includes unpublished
router.get("/all", authMiddleware, requireSuperAdmin, async (_req: Request, res: Response) => {
  try {
    const entries = await db.changelogEntry.findMany({ orderBy: { publishedAt: "desc" } });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
});

// POST /changelog — admin only, create entry
router.post("/", authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  const { title, description, type, version, published } = req.body;
  if (!title || !description) return res.status(400).json({ message: "title and description required" });
  try {
    const entry = await db.changelogEntry.create({
      data: { title, description, type: type ?? "FEATURE", version, published: published ?? true },
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
});

// PATCH /changelog/:id — admin only, update entry
router.patch("/:id", authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  const { title, description, type, version, published } = req.body;
  try {
    const entry = await db.changelogEntry.update({
      where: { id: String(req.params.id) },
      data:  { title, description, type, version, published },
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
});

// DELETE /changelog/:id — admin only
router.delete("/:id", authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    await db.changelogEntry.delete({ where: { id: String(req.params.id) } });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
});

export default router;
