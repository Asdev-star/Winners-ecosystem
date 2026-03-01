// ─── Phase 2: Winners Community — Creator Economy ─────────────────────────────────
// creatorRoutes.ts - Creator subscription and tier management endpoints
// Supports: Creator subscriptions, tier management, earnings tracking

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
const prisma = new PrismaClient();

// ─── GET /creator/tier — get user's creator tier ─────────────────────────────────
router.get('/tier', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;

    const tier = await prisma.creatorTier.findFirst({
      where: { userId, tenantId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ tier });
  } catch (error) {
    console.error('Error fetching creator tier:', error);
    res.status(500).json({ error: 'Failed to fetch creator tier' });
  }
});

// ─── POST /creator/tier — create or update creator tier ─────────────────────────
router.post('/tier', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { name, description, benefits, monthlyPrice, yearlyPrice, isActive } = req.body;

    // Check if user already has a tier
    const existingTier = await prisma.creatorTier.findFirst({
      where: { userId, tenantId }
    });

    let tier;
    if (existingTier) {
      tier = await prisma.creatorTier.update({
        where: { id: existingTier.id },
        data: {
          name,
          description,
          benefits: benefits || [],
          monthlyPrice: monthlyPrice || 0,
          yearlyPrice: yearlyPrice || 0,
          isActive: isActive !== false
        }
      });
    } else {
      tier = await prisma.creatorTier.create({
        data: {
          userId,
          tenantId,
          name,
          description,
          benefits: benefits || [],
          monthlyPrice: monthlyPrice || 0,
          yearlyPrice: yearlyPrice || 0,
          isActive: isActive !== false
        }
      });
    }

    res.json({ tier });
  } catch (error) {
    console.error('Error creating creator tier:', error);
    res.status(500).json({ error: 'Failed to create creator tier' });
  }
});

// ─── GET /creator/subscribers — get all subscribers to user's tiers ────────────
router.get('/subscribers', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;

    const subscriptions = await prisma.creatorSubscription.findMany({
      where: {
        creatorId: userId,
        status: 'ACTIVE'
      },
      include: {
        subscriber: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { startedAt: 'desc' }
    });

    res.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// ─── GET /creator/earnings — get creator earnings summary ───────────────────────
router.get('/earnings', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;

    // Get all active subscriptions to this creator
    const subscriptions = await prisma.creatorSubscription.findMany({
      where: {
        creatorId: userId,
        status: 'ACTIVE'
      },
      select: {
        amount: true,
        startedAt: true,
        tier: true
      }
    });

    // Calculate totals
    const totalEarnings = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
    const subscriberCount = subscriptions.length;
    
    // Calculate this month's earnings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyEarnings = subscriptions
      .filter(sub => new Date(sub.startedAt) >= startOfMonth)
      .reduce((sum, sub) => sum + sub.amount, 0);

    // Get tier info
    const tier = await prisma.creatorTier.findFirst({
      where: { userId, tenantId, isActive: true }
    });

    res.json({
      totalEarnings,
      subscriberCount,
      monthlyEarnings,
      tier: tier ? {
        name: tier.name,
        monthlyPrice: tier.monthlyPrice,
        yearlyPrice: tier.yearlyPrice
      } : null
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

// ─── POST /creator/subscribe — subscribe to a creator ─────────────────────────
router.post('/subscribe', authMiddleware, async (req: Request, res: Response) => {
  try {
    const subscriberId = req.user!.userId;
    const { creatorId, tierId, amount } = req.body;

    // Get the creator's tier
    const tier = await prisma.creatorTier.findUnique({
      where: { id: tierId }
    });

    if (!tier) {
      return res.status(404).json({ error: 'Creator tier not found' });
    }

    // Check if already subscribed
    const existingSub = await prisma.creatorSubscription.findUnique({
      where: {
        subscriberId_creatorId: {
          subscriberId,
          creatorId
        }
      }
    });

    if (existingSub && existingSub.status === 'ACTIVE') {
      return res.status(400).json({ error: 'Already subscribed to this creator' });
    }

    // Create or update subscription
    let subscription;
    if (existingSub) {
      subscription = await prisma.creatorSubscription.update({
        where: { id: existingSub.id },
        data: {
          tier: tier.name,
          amount: amount || tier.monthlyPrice,
          status: 'ACTIVE',
          startedAt: new Date()
        }
      });
    } else {
      subscription = await prisma.creatorSubscription.create({
        data: {
          subscriberId,
          creatorId,
          tier: tier.name,
          amount: amount || tier.monthlyPrice,
          status: 'ACTIVE'
        }
      });
    }

    res.json({ subscription });
  } catch (error) {
    console.error('Error subscribing to creator:', error);
    res.status(500).json({ error: 'Failed to subscribe to creator' });
  }
});

// ─── POST /creator/unsubscribe — unsubscribe from a creator ─────────────────────
router.post('/unsubscribe', authMiddleware, async (req: Request, res: Response) => {
  try {
    const subscriberId = req.user!.userId;
    const { creatorId } = req.body;

    const subscription = await prisma.creatorSubscription.findUnique({
      where: {
        subscriberId_creatorId: {
          subscriberId,
          creatorId
        }
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await prisma.creatorSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        expiresAt: new Date()
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing from creator:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from creator' });
  }
});

// ─── GET /creator/my-subscriptions — get creators I'm subscribed to ─────────────
router.get('/my-subscriptions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const subscriberId = req.user!.userId;

    const subscriptions = await prisma.creatorSubscription.findMany({
      where: {
        subscriberId,
        status: 'ACTIVE'
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true
          }
        }
      },
      orderBy: { startedAt: 'desc' }
    });

    res.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching my subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// ─── GET /creator/:userId — get public creator profile ───────────────────────────
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const tenantId = req.query.tenantId as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Get user info
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        country: true,
        city: true,
        skills: true,
        industry: true,
        profileViews: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Get creator tier
    const tier = await prisma.creatorTier.findFirst({
      where: { userId, tenantId, isActive: true }
    });

    // Get subscriber count
    const subscriberCount = await prisma.creatorSubscription.count({
      where: { creatorId: userId, status: 'ACTIVE' }
    });

    // Get total earnings
    const subscriptions = await prisma.creatorSubscription.findMany({
      where: { creatorId: userId, status: 'ACTIVE' },
      select: { amount: true }
    });
    const totalEarnings = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);

    res.json({
      creator: user,
      tier,
      subscriberCount,
      totalEarnings
    });
  } catch (error) {
    console.error('Error fetching creator profile:', error);
    res.status(500).json({ error: 'Failed to fetch creator profile' });
  }
});

export default router;
