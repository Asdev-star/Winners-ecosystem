// Phase 6 - Winners Work - Escrow Payment System
// Secure payment holding, milestone releases, and dispute resolution

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authMiddleware } from '../middleware/authMiddleware.js';
import db from '../db.js';

const router = Router();
router.use(authMiddleware);

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

async function getFreelancerStripeAccountId(freelancerProfileId: string): Promise<string | null> {
  const profile = await db.freelancerProfile.findUnique({
    where: { id: freelancerProfileId },
    include: { user: { select: { id: true } } },
  });
  const user = profile?.user as any;
  return user?.stripeAccountId ?? null;
}

router.post('/fund', async (req: Request, res: Response) => {
  const { contractId } = req.body;
  const tenantId = req.user!.tenantId;
  const userId = req.user!.userId;
  try {
    const contract = await db.contract.findFirst({ where: { id: contractId, tenantId, clientId: userId } });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    const existing = await db.escrowPayment.findUnique({ where: { contractId } });
    if (existing && existing.status !== 'REFUNDED') {
      return res.status(400).json({ error: 'Escrow already exists for this contract' });
    }
    const totalWithFee = Math.round(contract.amount * 1.10 * 100);
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalWithFee,
      currency: contract.currency.toLowerCase(),
      metadata: { contractId, type: 'escrow', tenantId },
      description: `Escrow: ${contract.title}`,
    });
    const escrow = await db.escrowPayment.upsert({
      where: { contractId },
      create: {
        contractId, tenantId, clientId: userId,
        freelancerId: contract.freelancerId,
        amount: contract.amount, currency: contract.currency,
        stripePaymentId: paymentIntent.id, status: 'HELD',
      },
      update: { stripePaymentId: paymentIntent.id, status: 'HELD' },
    });
    return res.json({ clientSecret: paymentIntent.client_secret, escrow });
  } catch (error) {
    console.error('[escrow] Fund error:', error);
    return res.status(500).json({ error: 'Failed to fund escrow' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  try {
    const escrows = await db.escrowPayment.findMany({
      where: { tenantId, OR: [{ clientId: userId }, { freelancerId: userId }] },
      include: { contract: { select: { title: true, clientId: true, amount: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(escrows);
  } catch (error) {
    console.error('[escrow] List error:', error);
    return res.status(500).json({ error: 'Failed to list escrows' });
  }
});

router.get('/:contractId', async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.userId;
  try {
    const escrow = await db.escrowPayment.findFirst({
      where: { contractId: req.params.contractId as string, tenantId },
      include: {
        contract: {
          select: { title: true, amount: true, currency: true, clientId: true, freelancerId: true, milestones: true },
        },
      },
    });
    if (!escrow) return res.status(404).json({ error: 'Escrow not found' });
    const isParticipant = escrow.clientId === userId || escrow.freelancerId === userId;
    if (!isParticipant) return res.status(403).json({ error: 'Not authorised' });
    return res.json(escrow);
  } catch (error) {
    console.error('[escrow] Get error:', error);
    return res.status(500).json({ error: 'Failed to get escrow' });
  }
});

router.post('/release/:escrowId', async (req: Request, res: Response) => {
  const { milestoneId, amount } = req.body;
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  try {
    const escrow = await db.escrowPayment.findFirst({ where: { id: req.params.escrowId as string, tenantId } });
    if (!escrow) return res.status(404).json({ error: 'Escrow not found' });
    if (escrow.clientId !== userId) return res.status(403).json({ error: 'Only the client can release funds' });
    if (escrow.status === 'DISPUTED') return res.status(400).json({ error: 'Escrow is under dispute' });
    if (escrow.status === 'RELEASED') return res.status(400).json({ error: 'Escrow already released' });
    const releaseAmount = Number(amount) || escrow.amount;
    const platformFee = releaseAmount * 0.10;
    const freelancerPayout = releaseAmount - platformFee;
    const stripeAccountId = await getFreelancerStripeAccountId(escrow.freelancerId);
    let transferId: string | undefined;
    if (stripeAccountId) {
      const stripe = getStripe();
      const transfer = await stripe.transfers.create({
        amount: Math.round(freelancerPayout * 100),
        currency: escrow.currency.toLowerCase(),
        destination: stripeAccountId,
        metadata: { escrowId: escrow.id, milestoneId: milestoneId ?? 'final' },
      });
      transferId = transfer.id;
    }
    await db.escrowPayment.update({ where: { id: escrow.id }, data: { status: 'RELEASED', releasedAt: new Date() } });
    if (milestoneId) {
      await db.contractMilestone.update({ where: { id: milestoneId }, data: { status: 'PAID', paidAt: new Date() } });
    }
    await db.notification.create({
      data: {
        tenantId, userId: escrow.freelancerId,
        type: 'SYSTEM', title: 'Payment Released',
        body: `$${freelancerPayout.toFixed(2)} has been released to your account.`,
        entityId: escrow.id,
        entityType: 'escrow',
      },
    });
    return res.json({ success: true, payout: freelancerPayout, platformFee, transferId });
  } catch (error) {
    console.error('[escrow] Release error:', error);
    return res.status(500).json({ error: 'Failed to release escrow' });
  }
});

router.post('/dispute/:escrowId', async (req: Request, res: Response) => {
  const { reason, evidence } = req.body;
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  try {
    const escrow = await db.escrowPayment.findFirst({ where: { id: req.params.escrowId as string, tenantId } });
    if (!escrow) return res.status(404).json({ error: 'Escrow not found' });
    const isParticipant = escrow.clientId === userId || escrow.freelancerId === userId;
    if (!isParticipant) return res.status(403).json({ error: 'Not authorised' });
    if (escrow.status === 'RELEASED' || escrow.status === 'REFUNDED') {
      return res.status(400).json({ error: 'Cannot dispute a completed escrow' });
    }
    await db.escrowPayment.update({ where: { id: escrow.id }, data: { status: 'DISPUTED' } });
    const otherPartyId = escrow.clientId === userId ? escrow.freelancerId : escrow.clientId;
    await db.notification.create({
      data: {
        tenantId, userId: otherPartyId,
        type: 'SYSTEM', title: 'Escrow Dispute Opened',
        body: 'A dispute has been opened. Our team will review within 48 hours.',
        entityId: escrow.id,
        entityType: 'escrow',
      },
    });
    return res.json({ success: true, message: 'Dispute opened - our team will review within 48 hours' });
  } catch (error) {
    console.error('[escrow] Dispute error:', error);
    return res.status(500).json({ error: 'Failed to open dispute' });
  }
});

router.post('/refund/:escrowId', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  try {
    const escrow = await db.escrowPayment.findFirst({ where: { id: req.params.escrowId as string, tenantId } });
    if (!escrow) return res.status(404).json({ error: 'Escrow not found' });
    if (escrow.clientId !== userId) return res.status(403).json({ error: 'Not authorised' });
    if (escrow.status === 'RELEASED') return res.status(400).json({ error: 'Cannot refund a released escrow' });
    if (escrow.stripePaymentId) {
      const stripe = getStripe();
      await stripe.refunds.create({ payment_intent: escrow.stripePaymentId, reason: 'requested_by_customer' });
    }
    await db.escrowPayment.update({ where: { id: escrow.id }, data: { status: 'REFUNDED' } });
    return res.json({ success: true });
  } catch (error) {
    console.error('[escrow] Refund error:', error);
    return res.status(500).json({ error: 'Failed to refund escrow' });
  }
});

export default router;