// @ts-nocheck
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
    // Safely query with fallback to empty arrays
    let members: any[] = [];
    let transactions: any[] = [];

    try {
      members = await db.user.findMany({
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
      }) ?? [];
    } catch (e) {
      console.error("Search: user query failed", e);
      members = [];
    }

    try {
      transactions = await db.revenueRecord.findMany({
        where: {
          tenantId,
          OR: [
            { source: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { date: "desc" },
        take: 5,
      }) ?? [];
    } catch (e) {
      console.error("Search: revenueRecord query failed", e);
      transactions = [];
    }

    // Notifications not stored in DB — return empty array
    const notifications: any[] = [];

    return res.json({ members, transactions, notifications });
  } catch (err: any) {
    console.error("Search route error:", err);
    return res.status(500).json({ message: err.message, members: [], transactions: [], notifications: [] });
  }
});

export default router;
