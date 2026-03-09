// Server/routes/searchRoutes.ts

import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

interface SearchMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

type RevenueSearchRecord = Awaited<ReturnType<typeof db.revenueRecord.findMany>>[number];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

// GET /search?q=query
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim() ?? "";
  const tenantId = req.user!.tenantId;

  if (!q || q.length < 2) {
    return res.json({ members: [], transactions: [], notifications: [] });
  }

  try {
    let members: SearchMember[] = [];
    let transactions: RevenueSearchRecord[] = [];

    try {
      members =
        (await db.user.findMany({
          where: {
            tenantId,
            deletedAt: null,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, email: true, role: true, createdAt: true },
          take: 5,
        })) ?? [];
    } catch (error) {
      console.error("Search: user query failed", error);
      members = [];
    }

    try {
      transactions =
        (await db.revenueRecord.findMany({
          where: {
            tenantId,
            OR: [{ source: { contains: q, mode: "insensitive" } }],
          },
          orderBy: { recordedAt: "desc" },
          take: 5,
        })) ?? [];
    } catch (error) {
      console.error("Search: revenueRecord query failed", error);
      transactions = [];
    }

    const notifications: never[] = [];
    return res.json({ members, transactions, notifications });
  } catch (error) {
    console.error("Search route error:", error);
    return res
      .status(500)
      .json({ message: errorMessage(error), members: [], transactions: [], notifications: [] });
  }
});

export default router;

