// Phase 1 — Core Engine — platformLaunchRoutes.ts
import { NotificationType } from "@prisma/client";
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { superAdminMiddleware } from '../middleware/superAdminMiddleware.js';
import { AppRegistry } from '../services/appRegistry';
import prisma from '../db';

// Mocking services and data that would exist in the full application
const LAUNCH_MESSAGES: Record<string, string> = {
    market: "Winners Market is live — explore products, launch your store, or find your first vendor.",
    work: "Winners Work is live — CIRCUIT has already scored every open job against your Academy certificates. Your match scores are waiting.",
    mobile: "The Winners Ecosystem is now installable on your device. Look for the 'Install App' button.",
    cloud: "Winners Cloud is live — your API key is ready. NEXUS is waiting to help you build on the ecosystem."
};
const notifySlack = async (message: string) => { console.log(`SLACK: ${message}`); };
const sendBroadcastNotification = async (notification: {title: string, body: string, type: string}) => { console.log(`BROADCAST: ${notification.title}`); };


const router = Router();

// All routes in this file are protected by superAdminMiddleware
router.use(authMiddleware, superAdminMiddleware);

/**
 * GET /api/v1/admin/platform/status
 * Retrieves the status and health of all platform layers.
 */
router.get('/status', async (req, res) => {
    const layers = AppRegistry.list();
    // In a real implementation, you'd fetch health data from a monitoring service
    const healthData = { api: '✅', db: '✅', aiPlatform: '✅', redis: '✅', email: '✅' };
    res.json({ layers, health: healthData });
});

/**
 * POST /api/v1/admin/platform/:layerId/checklist
 * Runs a pre-launch checklist for a given layer.
 */
router.post('/:layerId/checklist', async (req, res) => {
    const { layerId } = req.params;
    const layer = AppRegistry.get(layerId);
    if (!layer) return res.status(404).json({ error: 'Layer not found' });

    // Pre-launch checklist for Market layer
    const checklist = [
        { item: 'Stripe Connect — configured', status: '✅', required: true },
        { item: 'CheckoutPage vendor resolution bug — not yet fixed', status: '⚠️', required: true },
        { item: 'Multi-vendor payout flow — incomplete', status: '❌', required: true },
    ];
    const issues = checklist.filter(c => c.status !== '✅' && c.required);

    res.json({
        layerName: layer.name,
        isReady: issues.length === 0,
        issues,
        checklist,
    });
});

/**
 * POST /api/v1/admin/platform/:layerId/launch
 * Launches a new platform layer to all users.
 */
router.post('/:layerId/launch', async (req, res) => {
  const { layerId } = req.params;
  const { override } = req.body;

  const layer = AppRegistry.get(layerId);
  if (!layer) return res.status(404).json({ error: 'Layer not found' });

  if (layer.status === 'live') {
      return res.status(400).json({ error: `${layer.name} is already live.` });
  }

  // Check dependencies from AppRegistry
  const { ready, missing } = AppRegistry.checkDependencies(layerId);
  if (!ready && !override) {
    return res.status(400).json({
      error: 'Dependencies not met',
      missing,
      message: `Cannot launch ${layer.name} until: ${missing.join(', ')} are live.`
    });
  }

  // Update AppRegistry in-memory. The current schema does not yet persist layer launch state.
  AppRegistry.update(layerId, { status: 'live' });

  // Send welcome notification to all active users.
  const activeUsers = await prisma.user.findMany({
    where: { deletedAt: null }
  });

  await Promise.all(activeUsers.map(user =>
    prisma.notification.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        type: NotificationType.SYSTEM,
        title: `${layer.name} is now live`,
        body: LAUNCH_MESSAGES[layerId] || `${layer.name} is now available in your ecosystem.`,
        link: layer.frontendPath,
      }
    })
  ));

  // Notify the operator channel. Persistent audit storage is not available in the current schema.
  await notifySlack(`🚀 ${layer.name} launched by ${req.user!.email} — ${activeUsers.length} users notified`);

  res.json({
    success: true,
    layer: AppRegistry.get(layerId),
    usersNotified: activeUsers.length
  });
});

/**
 * POST /api/v1/admin/platform/:layerId/suspend
 * Suspends a live platform layer.
 */
router.post('/:layerId/suspend', async (req, res) => {
  const { layerId } = req.params;
  const { reason } = req.body;
  
  const layer = AppRegistry.get(layerId);
  if (!layer) return res.status(404).json({ error: 'Layer not found' });

  if (layer.status !== 'live') {
      return res.status(400).json({ error: `${layer.name} is not live and cannot be suspended.` });
  }

  AppRegistry.update(layerId, { status: 'suspended' });

  await sendBroadcastNotification({
    title: `${layer.name} temporarily unavailable`,
    body:  reason?.trim()
      ? `${layer.name} is temporarily unavailable: ${reason.trim()}`
      : `We're making improvements. ${layer.name} will be back shortly.`,
    type:  'platform_maintenance'
  });

  res.json({ success: true, message: `${layer.name} has been suspended.` });
});

export default router;
