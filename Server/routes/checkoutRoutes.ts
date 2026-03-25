// Phase 4 — Checkout & Stripe Connect (Multi-Vendor)
// Server/routes/checkoutRoutes.ts

import { Router, Response } from 'express';
import Stripe from 'stripe';
import { authMiddleware, type AuthRequest } from '../middleware/authMiddleware.js';
import db from '../db.js';

const router = Router();
router.use(authMiddleware);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

interface CartItem {
  productId: string;
  vendorId: string;
  vendorName: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  type?: 'physical' | 'digital' | 'dropship';
}

// GET /api/v1/checkout/cart - Get cart items grouped by vendor
router.get('/cart', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, tenantId } = req.user;

    const cart = await db.cart.findFirst({
      where: { userId, tenantId },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: {
                  select: { id: true, name: true, stripeAccountId: true }
                }
              }
            }
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.json({ items: [], total: 0, vendors: [] });
    }

    // Group items by vendor
    const vendorGroups = cart.items.reduce<Record<string, {
      vendorId: string;
      vendorName: string;
      stripeAccountId: string | null;
      items: Array<{
        id: string;
        productId: string;
        title: string;
        price: number;
        quantity: number;
        imageUrl?: string;
      }>;
      subtotal: number;
    }>>((acc, item) => {
      const vendorId = item.product.vendorId;
      if (!vendorId) return acc;

      if (!acc[vendorId]) {
        acc[vendorId] = {
          vendorId,
          vendorName: item.product.vendor?.name || 'Unknown Vendor',
          stripeAccountId: item.product.vendor?.stripeAccountId || null,
          items: [],
          subtotal: 0
        };
      }

      acc[vendorId].items.push({
        id: item.id,
        productId: item.productId,
        title: item.product.title,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.product.images?.[0] || undefined
      });
      acc[vendorId].subtotal += item.price * item.quantity;
      return acc;
    }, {});

    const vendors = Object.values(vendorGroups);
    const total = vendors.reduce((sum, v) => sum + v.subtotal, 0);

    res.json({ items: cart.items, vendors, total });
  } catch (error) {
    console.error('[checkout] Get cart error:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

// POST /api/v1/checkout/create-payment-intents
router.post('/create-payment-intents', async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body as { items: CartItem[] };
    if (!items?.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const { userId, tenantId, plan } = req.user;

    // Platform fee by plan
    const platformFeePct = 
      plan === 'ENTERPRISE' ? 0.08 :
      plan === 'PRO' ? 0.10 : 0.15;

    // Group by vendor
    const vendorGroups = items.reduce<Record<string, CartItem[]>>((acc, item) => {
      const vendorId = item.vendorId || 'direct';
      if (!acc[vendorId]) acc[vendorId] = [];
      acc[vendorId].push(item);
      return acc;
    }, {});

    const paymentIntents: Array<{
      vendorId: string;
      vendorName: string;
      clientSecret: string;
      amount: number;
    }> = [];

    for (const [vendorId, vendorItems] of Object.entries(vendorGroups)) {
      let vendor: { stripeAccountId: string | null; name: string } | null = null;

      if (vendorId !== 'direct') {
        vendor = await db.vendor.findUnique({
          where: { id: vendorId },
          select: { stripeAccountId: true, name: true }
        }) as { stripeAccountId: string | null; name: string } | null;
      }

      const amount = vendorItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const platformFee = Math.round(amount * platformFeePct * 100); // cents

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount * 100),
        currency: 'usd',
        metadata: {
          buyerId: userId,
          tenantId,
          vendorId,
          itemCount: vendorItems.length.toString()
        }
      };

      // If vendor has Stripe Connect account, use transfer
      if (vendor?.stripeAccountId) {
        paymentIntentParams.application_fee_amount = platformFee;
        paymentIntentParams.transfer_data = { destination: vendor.stripeAccountId };
      }

      const intent = await stripe.paymentIntents.create(paymentIntentParams);

      paymentIntents.push({
        vendorId,
        vendorName: vendor?.name || 'Direct Sale',
        clientSecret: intent.client_secret!,
        amount
      });
    }

    const total = paymentIntents.reduce((sum, p) => sum + p.amount, 0);

    res.json({ paymentIntents, total, platformFeePct });
  } catch (error) {
    console.error('[checkout] Create payment intents error:', error);
    res.status(500).json({ error: 'Failed to create payment intents' });
  }
});

// POST /api/v1/checkout/confirm
router.post('/confirm', async (req: AuthRequest, res: Response) => {
  try {
    const { paymentIntentIds, vendorGroups } = req.body as {
      paymentIntentIds: string[];
      vendorGroups: Array<{
        vendorId: string;
        items: Array<{ productId: string; quantity: number; price: number }>;
      }>;
    };
    const { userId, tenantId } = req.user;

    // Verify all payment intents are succeeded
    for (const piId of paymentIntentIds) {
      const intent = await stripe.paymentIntents.retrieve(piId);
      if (intent.status !== 'succeeded') {
        return res.status(400).json({ error: `Payment ${piId} not completed` });
      }
    }

    // Create orders for each vendor
    const orders = [];
    for (const group of vendorGroups) {
      const order = await db.order.create({
        data: {
          userId,
          tenantId,
          vendorId: group.vendorId,
          status: 'CONFIRMED',
          total: group.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
          items: {
            create: group.items.map(item => ({
              productId: item.productId,
              quantity: item.price,
              price: item.price,
              status: 'PENDING'
            }))
          }
        },
        include: { items: true }
      });
      orders.push(order);
    }

    // Clear cart after successful checkout
    await db.cartItem.deleteMany({
      where: { cart: { userId, tenantId } }
    });

    res.json({ success: true, orders });
  } catch (error) {
    console.error('[checkout] Confirm error:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

export default router;