// Server/routes/activityRoutes.ts

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";
import db from "../db.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

// GET /activity?page=1&limit=50&category=auth
router.get("/", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const page     = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit    = Math.min(100, parseInt(req.query.limit as string) || 50);
  const category = req.query.category as string | undefined;
  const skip     = (page - 1) * limit;

  const where: any = { tenantId };
  if (category && category !== "all") where.category = category;

  try {
    const [logs, total] = await Promise.all([
      (db as any).activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      (db as any).activityLog.count({ where }),
    ]);

    return res.json({ logs, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /activity/recent?limit=5  — for dashboard widget
router.get("/recent", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const limit    = Math.min(20, parseInt(req.query.limit as string) || 5);

  try {
    const logs = await (db as any).activityLog.findMany({
      where:   { tenantId },
      orderBy: { createdAt: "desc" },
      take:    limit,
    });
    return res.json({ logs });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// DELETE /activity  — owners only
router.delete("/", async (req: Request, res: Response) => {
  if (req.user!.role !== "owner") {
    return res.status(403).json({ message: "Only workspace owners can clear activity logs" });
  }
  const tenantId = req.user!.tenantId;
  try {
    const { count } = await (db as any).activityLog.deleteMany({ where: { tenantId } });
    return res.json({ message: `Cleared ${count} activity logs` });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;