// Server/routes/referralRoutes.ts

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getOrCreateReferralCode, getReferralStats, processReferral } from "../services/referralService.js";

const router = Router();

// GET /referral/stats — get referral stats for current user
router.get("/stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await getReferralStats(req.user!.id, req.user!.tenantId);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /referral/code — get or create referral code
router.get("/code", authMiddleware, async (req: Request, res: Response) => {
  try {
    const code = await getOrCreateReferralCode(req.user!.id);
    const APP_URL = process.env.APP_URL ?? "https://winners-empire-eco.up.railway.app";
    res.json({ code, url: `${APP_URL}/signup?ref=${code}` });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /referral/process — called after new user signup with ref code
router.post("/process", async (req: Request, res: Response) => {
  const { code, userId, email, name } = req.body;
  if (!code || !userId) return res.status(400).json({ message: "code and userId required" });
  try {
    await processReferral(code, userId, email, name);
    res.json({ message: "Referral processed" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;