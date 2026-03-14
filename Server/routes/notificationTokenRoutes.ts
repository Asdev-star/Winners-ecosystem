// Phase 7 - Mobile App - Device Token Registration
// Register FCM tokens for push notification delivery

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { registerDeviceToken, deactivateDeviceToken } from '../services/fcmService.js';
import db from '../db.js';

const router = Router();
router.use(authMiddleware);

router.post('/register', async (req: Request, res: Response) => {
  const { token, platform } = req.body;
  const userId = req.user!.userId;
  if (!token) return res.status(400).json({ error: 'token is required' });
  try {
    await registerDeviceToken(userId, token, platform || 'web');
    return res.json({ success: true });
  } catch (error) {
    console.error('[push] Register token error:', error);
    return res.status(500).json({ error: 'Failed to register token' });
  }
});

router.delete('/register', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token is required' });
  try {
    await deactivateDeviceToken(token);
    return res.json({ success: true });
  } catch (error) {
    console.error('[push] Deactivate token error:', error);
    return res.status(500).json({ error: 'Failed to deactivate token' });
  }
});

router.get('/status', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const tokens = await db.deviceToken.findMany({
      where: { userId, isActive: true },
      select: { id: true, platform: true, createdAt: true, updatedAt: true },
    });
    return res.json({ registered: tokens.length > 0, devices: tokens });
  } catch (error) {
    console.error('[push] Status error:', error);
    return res.status(500).json({ error: 'Failed to get push status' });
  }
});

export default router;