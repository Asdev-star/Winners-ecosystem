// Phase 4 — Checkout & Stripe Connect (Multi-Vendor)
// Server/routes/checkoutRoutes.ts

import { Router, Response } from 'express';
import Stripe from 'stripe';
import { authMiddleware, type AuthRequest } from '../middleware/authMiddleware.js';
import db from '../db.js';
import { sendOrderConfirmationEmail } from '../services/emailService.js';
import { autoFulfillDropOrder } from '../services/supplierService.js';

const router = Router();
router.use(authMiddleware);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
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
  variantId?: string;
}

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

function getPlatformFeePct(plan?: string) {
  return plan === 'ENTERPRISE' ? 0.08 : plan === 'PRO' ? 0.10 : 0.15;
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
                  select: { id: true, storeName: true, stripeAccountId: true }
                },
                images: { select: { url: true }, take: 1 }
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
      const vendorId = item.product.vendorId ?? '_unassigned';
      if (!acc[vendorId]) {
        acc[vendorId] = {
          vendorId,
          vendorName: item.product.vendor?.storeName || (vendorId === '_unassigned' ? 'Unassigned' : 'Unknown Vendor'),
          stripeAccountId: item.product.vendor?.stripeAccountId || null,
          items: [],
          subtotal: 0
        };
      }

      acc[vendorId].items.push({
        id: item.id,
        productId: item.productId,
        title: item.product.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.product.images?.[0]?.url || undefined
      });
      acc[vendorId].subtotal += item.price * item.quantity;
      return acc;
    }, {});

    const vendors = Object.values(vendorGroups) as Array<{ subtotal: number } & Record<string, unknown>>;
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
    const platformFeePct = getPlatformFeePct(plan);

    // Resolve vendors server-side — never trust client-provided vendorId
    const productIds = items.map((item) => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, tenantId },
      select: {
        id: true,
        vendorId: true,
        price: true,
        stockQuantity: true,
        allowBackorder: true,
        vendor: {
          select: { id: true, storeName: true, stripeAccountId: true },
        },
      },
    });

    const productById = new Map(products.map((p) => [p.id, p]));

    // Validate all products exist and have vendors
    const unresolved: string[] = [];
    for (const item of items) {
      const product = productById.get(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }
      if (!product.vendorId) {
        unresolved.push(item.title || item.productId);
      }
    }

    if (unresolved.length > 0) {
      return res.status(400).json({
        error: `${unresolved.length} item(s) have no vendor assignment: ${unresolved.join(', ')}. Remove them and try again.`,
      });
    }

    // Check stock availability
    for (const item of items) {
      const product = productById.get(item.productId)!;
      if (!product.allowBackorder && product.stockQuantity < item.quantity) {
        return res.status(400).json({
          error: `"${item.title || product.id}" has only ${product.stockQuantity} in stock but ${item.quantity} requested`,
        });
      }
    }

    // Group by server-resolved vendorId
    const vendorGroups = items.reduce<Record<string, CartItem[]>>((acc, item) => {
      const product = productById.get(item.productId);
      const vendorId = product?.vendorId || 'direct';
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
      // Use server-resolved vendor data from the product lookup above
      const firstProduct = productById.get(vendorItems[0].productId);
      const vendor = firstProduct?.vendor ?? null;

      const amount = vendorItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const platformFee = Math.round(amount * platformFeePct * 100); // cents

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount * 100),
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: {
          buyerId: userId,
          tenantId,
          vendorId,
          vendorName: vendor?.storeName || 'Direct Sale',
          itemCount: vendorItems.length.toString(),
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
        vendorName: vendor?.storeName || 'Direct Sale',
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
    const { paymentIntentIds, shippingAddress, vendorGroups } = req.body as {
      paymentIntentIds: string[];
      shippingAddress?: {
        fullName?: string;
        addressLine?: string;
        city?: string;
        region?: string;
        postalCode?: string;
        country?: string;
        phone?: string;
      };
      vendorGroups: Array<{
        vendorId: string;
        items: Array<{ productId: string; quantity: number; price: number; title?: string }>;
      }>;
    };
    const { userId, tenantId, plan, email } = req.user;

    if (!paymentIntentIds?.length || !vendorGroups?.length) {
      return res.status(400).json({ error: 'Payment intents and vendor groups are required' });
    }

    const existingOrders = await db.order.findMany({
      where: {
        tenantId,
        userId,
        stripePaymentIntentId: { in: paymentIntentIds },
      },
      select: { id: true, orderNumber: true },
    });

    if (existingOrders.length === paymentIntentIds.length) {
      return res.json({ success: true, orders: existingOrders });
    }

    const cart = await db.cart.findFirst({
      where: { userId, tenantId, status: 'ACTIVE' },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: {
                  select: {
                    id: true,
                    storeName: true,
                    stripeAccountId: true,
                    freeShipping: true,
                    shippingPrice: true,
                    taxRate: true,
                  },
                },
                supplierProduct: {
                  include: {
                    supplier: true,
                  },
                },
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart?.items.length) {
      return res.status(400).json({ error: 'Your cart is empty or has already been converted' });
    }

    const clientVendorIds = new Set(vendorGroups.map((group) => group.vendorId));
    const cartVendorGroups = new Map<
      string,
      {
        vendorId: string;
        vendorName: string;
        freeShipping: boolean;
        shippingPrice: number;
        taxRate: number;
        items: typeof cart.items;
      }
    >();

    const unresolvedCartItems: string[] = [];
    for (const item of cart.items) {
      const vendorId = item.product.vendorId;
      if (!vendorId) {
        unresolvedCartItems.push(item.product.name);
        continue;
      }

      const vendor = item.product.vendor;
      const current = cartVendorGroups.get(vendorId) ?? {
        vendorId,
        vendorName: vendor?.storeName || 'Direct Sale',
        freeShipping: vendor?.freeShipping ?? false,
        shippingPrice: vendor?.shippingPrice ?? 0,
        taxRate: vendor?.taxRate ?? 0,
        items: [],
      };
      current.items.push(item);
      cartVendorGroups.set(vendorId, current);
    }

    if (unresolvedCartItems.length > 0) {
      return res.status(400).json({
        error: `${unresolvedCartItems.length} item(s) have no vendor assignment: ${unresolvedCartItems.join(', ')}`,
      });
    }

    if (
      cartVendorGroups.size === 0 ||
      cartVendorGroups.size !== clientVendorIds.size ||
      Array.from(cartVendorGroups.keys()).some((vendorId) => !clientVendorIds.has(vendorId))
    ) {
      return res.status(400).json({ error: 'Checkout vendor split no longer matches your active cart' });
    }

    const intentByVendorId = new Map<string, Stripe.PaymentIntent>();
    for (const piId of paymentIntentIds) {
      const intent = await stripe.paymentIntents.retrieve(piId);
      if (intent.status !== 'succeeded') {
        return res.status(400).json({ error: `Payment ${piId} not completed` });
      }
      if (intent.metadata?.buyerId !== userId || intent.metadata?.tenantId !== tenantId) {
        return res.status(403).json({ error: `Payment ${piId} does not belong to this buyer session` });
      }

      const vendorId = intent.metadata?.vendorId;
      if (!vendorId || !clientVendorIds.has(vendorId)) {
        return res.status(400).json({ error: `Payment ${piId} has no matching vendor routing` });
      }
      intentByVendorId.set(vendorId, intent);
    }

    if (intentByVendorId.size !== cartVendorGroups.size) {
      return res.status(400).json({ error: 'Missing one or more successful vendor payment intents' });
    }

    const platformFeePct = getPlatformFeePct(plan);
    const orderIdsToFulfill: string[] = [];

    const orders = await db.$transaction(async (tx) => {
      const createdOrders: Array<{ id: string; orderNumber: string; vendorId: string }> = [];

      for (const group of cartVendorGroups.values()) {
        const paymentIntent = intentByVendorId.get(group.vendorId);
        if (!paymentIntent) {
          throw new Error(`Missing payment intent for vendor ${group.vendorId}`);
        }

        const subtotal = group.items.reduce(
          (sum, item) => sum + (item.variant?.price ?? item.price) * item.quantity,
          0,
        );
        const shippingCost = group.freeShipping ? 0 : group.shippingPrice;
        const taxAmount = Number((subtotal * (group.taxRate / 100)).toFixed(2));
        const total = Number((subtotal + shippingCost + taxAmount).toFixed(2));

        const order = await tx.order.create({
          data: {
            userId,
            tenantId,
            vendorId: group.vendorId,
            orderNumber: generateOrderNumber(),
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            paymentMethod: 'STRIPE',
            subtotal,
            shippingCost,
            taxAmount,
            total,
            currency: 'USD',
            stripePaymentId: paymentIntent.latest_charge ? String(paymentIntent.latest_charge) : null,
            stripePaymentIntentId: paymentIntent.id,
            shippingName: shippingAddress?.fullName ?? '',
            shippingAddress: shippingAddress?.addressLine ?? '',
            shippingCity: shippingAddress?.city ?? '',
            shippingState: shippingAddress?.region ?? '',
            shippingZip: shippingAddress?.postalCode ?? '',
            shippingCountry: shippingAddress?.country ?? '',
            shippingPhone: shippingAddress?.phone ?? '',
            metadata: {
              checkoutFlow: 'payment_intents',
              vendorName: group.vendorName,
              paymentIntentId: paymentIntent.id,
            },
            items: {
              create: group.items.map((item) => ({
                tenantId,
                productId: item.productId,
                variantId: item.variantId ?? null,
                name: item.product.name,
                sku: item.variant?.sku ?? item.product.sku ?? null,
                quantity: item.quantity,
                price: item.variant?.price ?? item.price,
                total: (item.variant?.price ?? item.price) * item.quantity,
                fulfillmentStatus: item.product.fulfillmentType === 'dropship' ? 'pending' : null,
                supplierId:
                  item.product.supplierId ??
                  item.product.supplierProduct?.supplierId ??
                  null,
              })),
            },
          },
          include: {
            items: true,
          },
        });

        for (const item of group.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              soldCount: { increment: item.quantity },
              ...(item.product.allowBackorder
                ? {}
                : { stockQuantity: { decrement: item.quantity } }),
            },
          });
        }

        const commission = Number((subtotal * platformFeePct).toFixed(2));
        const payoutAmount = Number((subtotal - commission).toFixed(2));

        await tx.vendorPayout.create({
          data: {
            tenantId,
            vendorId: group.vendorId,
            orderId: order.id,
            amount: payoutAmount,
            commission,
            stripeTransferId: paymentIntent.transfer_data?.destination
              ? String(paymentIntent.transfer_data.destination)
              : null,
            status: paymentIntent.transfer_data?.destination ? 'in_transit' : 'pending',
          },
        });

        await tx.vendor.update({
          where: { id_tenantId: { id: group.vendorId, tenantId } },
          data: {
            totalSales: { increment: 1 },
            totalRevenue: { increment: subtotal },
            payoutBalance: { increment: payoutAmount },
          },
        });

        createdOrders.push({
          id: order.id,
          orderNumber: order.orderNumber,
          vendorId: group.vendorId,
        });
        orderIdsToFulfill.push(order.id);
      }

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: { status: 'CONVERTED' },
      });

      return createdOrders;
    });

    const ordersWithDetails = await db.order.findMany({
      where: {
        tenantId,
        id: { in: orders.map((order) => order.id) },
      },
      include: {
        items: true,
        user: { select: { email: true } },
      },
    });

    for (const order of ordersWithDetails) {
      const recipient = order.user?.email ?? email;
      if (recipient) {
        await sendOrderConfirmationEmail(tenantId, recipient, {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          currency: order.currency,
          items: order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        }).catch((emailError) => {
          console.error('[checkout] Order confirmation email error:', emailError);
        });
      }
    }

    for (const orderId of orderIdsToFulfill) {
      const dropshipItems = await db.orderItem.findMany({
        where: {
          tenantId,
          orderId,
          product: { fulfillmentType: 'dropship' },
        },
        select: { id: true },
      });

      for (const item of dropshipItems) {
        await autoFulfillDropOrder({ orderItemId: item.id, tenantId }).catch((fulfillError) => {
          console.error('[checkout] Dropship auto-fulfillment error:', fulfillError);
        });
      }
    }

    res.json({ success: true, orders: orders.map(({ id, orderNumber }) => ({ id, orderNumber })) });
  } catch (error) {
    console.error('[checkout] Confirm error:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

export default router;
