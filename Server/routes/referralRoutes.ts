// Server/routes/referralRoutes.ts

import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getOrCreateReferralCode,
  getReferralStats,
  processReferral,
} from "../services/referralService.js";

const router = Router();

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Internal server error";
}

router.get("/stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await getReferralStats(req.user!.userId, req.user!.tenantId);
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/code", authMiddleware, async (req: Request, res: Response) => {
  try {
    const code = await getOrCreateReferralCode(req.user!.userId);
    const appUrl = process.env.APP_URL ?? "https://winners-empire-eco.up.railway.app";
    return res.json({ code, url: `${appUrl}/signup?ref=${code}` });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/process", async (req: Request, res: Response) => {
  const { code, userId, email, name } = req.body ?? {};
  if (!code || !userId) {
    return res.status(400).json({ message: "code and userId required" });
  }

  try {
    await processReferral(code, userId, email, name);
    return res.json({ message: "Referral processed" });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

export default router;
