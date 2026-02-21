// Server/routes/searchRoutes.ts

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

// GET /search?q=query
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const q        = (req.query.q as string ?? "").trim();
  const tenantId = req.user!.tenantId;

  if (!q || q.length < 2) return res.json({ members: [], transactions: [], notifications: [] });

  try {
    const [members, transactions, notifications] = await Promise.all([
      // Team members
      db.user.findMany({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            { name:  { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        take: 5,
      }),

      // Revenue/transactions
      db.revenueRecord.findMany({
        where: {
          tenantId,
          OR: [
            { source: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { date: "desc" },
        take: 5,
      }),

      // Notifications
      db.notification?.findMany({
        where: {
          tenantId,
          OR: [
            { title:   { contains: q, mode: "insensitive" } },
            { message: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }).catch(() => []),
    ]);

    return res.json({ members, transactions, notifications });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;