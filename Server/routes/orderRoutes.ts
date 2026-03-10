// Server/routes/orderRoutes.ts — Order Management
// Phase 4: Winners Market - Order processing and management

import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { OrderStatus, type Prisma } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

const router = Router();

// Helper to extract string from params/query
const getParam = (p: string | string[] | undefined): string => 
  Array.isArray(p) ? p[0] : (p || "");

// Helper to generate order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

function parseOrderStatus(value: string): OrderStatus | null {
  const candidate = value.trim().toUpperCase();
  return (Object.values(OrderStatus) as string[]).includes(candidate)
    ? (candidate as OrderStatus)
    : null;
}

// GET /orders - Get user's orders
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const status = getParam(req.query.status as string | string[] | undefined);
    const pageStr = getParam(req.query.page as string | string[] | undefined);
    const limitStr = getParam(req.query.limit as string | string[] | undefined);
    const page = parseInt(pageStr) || 1;
    const limit = parseInt(limitStr) || 20;

    const where: Prisma.OrderWhereInput = { userId, tenantId };
    if (status) {
      const parsedStatus = parseOrderStatus(status);
      if (!parsedStatus) return res.status(400).json({ error: "Invalid order status" });
      where.status = parsedStatus;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          vendor: { select: { storeName: true } },
          items: {
            include: {
              product: { select: { name: true, images: { take: 1 } } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("[orderRoutes] Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// GET /orders/:id - Get single order
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = getParam(req.params.id as string | string[] | undefined);

    const order = await db.order.findFirst({
      where: { id, userId },
      include: {
        vendor: { select: { storeName: true, storeSlug: true } },
        items: {
          include: {
            product: { select: { name: true, images: true } },
            variant: true
          }
        },
        tracking: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("[orderRoutes] Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// POST /orders - Create order from cart
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { 
      cartId, vendorId, 
      shippingName, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry, shippingPhone,
      billingName, billingAddress, billingCity, billingState, billingZip, billingCountry,
      paymentMethod, notes
    } = req.body;

    // Get cart items
    const cart = await db.cart.findFirst({
      where: { id: cartId, tenantId, userId, status: "ACTIVE" },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Verify vendor
    const vendor = await db.vendor.findUnique({
      where: { id: vendorId }
    });

    if (!vendor) {
      return res.status(400).json({ error: "Invalid vendor" });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        name: item.product.name,
        sku: item.variant?.sku || item.product.sku,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal
      });

      // Update stock
      if (!item.product.allowBackorder) {
        await db.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } }
        });
      }
    }

    const shippingCost = vendor.freeShipping ? 0 : (vendor.shippingPrice || 0);
    const taxRate = vendor.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + shippingCost + taxAmount;

    // Create order
    const order = await db.order.create({
      data: {
        tenantId,
        userId,
        vendorId,
        orderNumber: generateOrderNumber(),
        subtotal,
        shippingCost,
        taxAmount,
        total,
        currency: "USD",
        shippingName, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry, shippingPhone,
        billingName, billingAddress, billingCity, billingState, billingZip, billingCountry,
        paymentMethod,
        notes,
        status: "PENDING",
        paymentStatus: "PENDING"
      }
    });

    // Create order items
    await db.orderItem.createMany({
      data: orderItems.map(item => ({
        ...item,
        orderId: order.id
      }))
    });

    // Clear cart
    await db.cart.update({
      where: { id: cart.id },
      data: { status: "CONVERTED" }
    });

    // Update vendor stats
    await db.vendor.update({
      where: { id: vendorId },
      data: { totalSales: { increment: 1 } }
    });

    const createdOrder = await db.order.findUnique({
      where: { id: order.id },
      include: { items: true }
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("[orderRoutes] Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// PUT /orders/:id/cancel - Cancel order
router.put("/:id/cancel", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = getParam(req.params.id as string | string[] | undefined);

    const order = await db.order.findFirst({
      where: { id, userId, status: { in: ["PENDING", "CONFIRMED"] } }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found or cannot be cancelled" });
    }

    // Restore stock
    const orderItems = await db.orderItem.findMany({
      where: { orderId: id }
    });

    for (const item of orderItems) {
      await db.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } }
      });
    }

    // Update order status
    const updated = await db.order.update({
      where: { id },
      data: { status: "CANCELLED" }
    });

    res.json(updated);
  } catch (error) {
    console.error("[orderRoutes] Error cancelling order:", error);
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

// Vendor routes
// GET /orders/vendor - Get vendor's orders
router.get("/vendor/all", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const status = getParam(req.query.status as string | string[] | undefined);
    const pageStr = getParam(req.query.page as string | string[] | undefined);
    const limitStr = getParam(req.query.limit as string | string[] | undefined);
    const page = parseInt(pageStr) || 1;
    const limit = parseInt(limitStr) || 20;

    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId }
    });

    if (!vendor) {
      return res.status(403).json({ error: "Vendor not found" });
    }

    const where: Prisma.OrderWhereInput = { vendorId: vendor.id };
    if (status) {
      const parsedStatus = parseOrderStatus(status);
      if (!parsedStatus) return res.status(400).json({ error: "Invalid order status" });
      where.status = parsedStatus;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { product: { select: { name: true } } } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("[orderRoutes] Error fetching vendor orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// PUT /orders/:id/status - Update order status (vendor)
router.put("/:id/status", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const id = getParam(req.params.id as string | string[] | undefined);
    const { status, trackingNumber, carrier } = req.body;

    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId }
    });

    if (!vendor) {
      return res.status(403).json({ error: "Vendor not found" });
    }

    const order = await db.order.findFirst({
      where: { id, vendorId: vendor.id }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updated = await db.order.update({
      where: { id },
      data: { status }
    });

    // Add tracking if provided
    if (trackingNumber) {
      await db.orderTracking.upsert({
        where: { orderId: id },
        update: { trackingNumber, carrier, status: "IN_TRANSIT" },
        create: { orderId: id, trackingNumber, carrier, status: "IN_TRANSIT" }
      });
    }

    res.json(updated);
  } catch (error) {
    console.error("[orderRoutes] Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// POST /orders/checkout-session — Stripe Checkout for market orders
router.post("/checkout-session", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId  = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { cartId, shippingName, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry, shippingPhone } = req.body;

    if (!cartId) return res.status(400).json({ error: "cartId is required" });

    const cart = await db.cart.findFirst({
      where: { id: cartId, tenantId, userId, status: "ACTIVE" },
      include: {
        items: {
          include: {
            product: { include: { vendor: { select: { id: true, storeName: true } } } },
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty or not found" });
    }

    // Derive vendorId from first item's product (MVP: single-vendor checkout)
    const vendorId = cart.items[0]?.product?.vendor?.id;
    if (!vendorId) return res.status(400).json({ error: "Could not determine vendor for this cart" });

    const vendor = await db.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) return res.status(400).json({ error: "Vendor not found" });

    // Calculate totals
    let subtotal = 0;
    const orderItems: Array<{ productId: string; variantId: string | null; name: string; sku: string | null; quantity: number; price: number; total: number }> = [];

    for (const item of cart.items) {
      const itemPrice = item.price;
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;
      orderItems.push({
        productId: item.productId,
        variantId: item.variantId ?? null,
        name:      item.product.name,
        sku:       item.variant?.sku ?? (item.product as { sku?: string }).sku ?? null,
        quantity:  item.quantity,
        price:     itemPrice,
        total:     itemTotal,
      });
    }

    const shippingCost = vendor.freeShipping ? 0 : (vendor.shippingPrice ?? 0);
    const taxRate      = vendor.taxRate ?? 0;
    const taxAmount    = Math.round(subtotal * (taxRate / 100));
    const total        = subtotal + shippingCost + taxAmount;

    // Create PENDING order first (so we have an orderId for Stripe metadata)
    const order = await db.order.create({
      data: {
        tenantId, userId, vendorId,
        orderNumber:     generateOrderNumber(),
        subtotal, shippingCost, taxAmount, total,
        currency:        "USD",
        shippingName:    shippingName ?? "",
        shippingAddress: shippingAddress ?? "",
        shippingCity:    shippingCity ?? "",
        shippingState:   shippingState ?? "",
        shippingZip:     shippingZip ?? "",
        shippingCountry: shippingCountry ?? "US",
        shippingPhone:   shippingPhone ?? "",
        paymentMethod:   "STRIPE",
        status:          "PENDING",
        paymentStatus:   "PENDING",
      },
    });

    await db.orderItem.createMany({
      data: orderItems.map((item) => ({ ...item, orderId: order.id })),
    });

    // Create Stripe Checkout session
    const stripe   = getStripe();
    const appUrl   = process.env.APP_URL ?? "https://winners-empire-eco.up.railway.app";
    const lineItems = cart.items.map((item) => ({
      price_data: {
        currency:     "usd",
        unit_amount:  Math.round(item.price),        // already in cents (DB stores cents)
        product_data: { name: item.product.name },
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      mode:          "payment",
      line_items:    lineItems,
      success_url:   `${appUrl}/market/orders?payment=success&order=${order.id}`,
      cancel_url:    `${appUrl}/market/checkout?cancelled=true`,
      metadata: { orderId: order.id, tenantId, userId },
    });

    // Store Stripe session id on the order
    await db.order.update({
      where: { id: order.id },
      data:  { stripeSessionId: session.id },
    });

    // Mark cart as converted
    await db.cart.update({ where: { id: cart.id }, data: { status: "CONVERTED" } });
    await db.vendor.update({ where: { id: vendorId }, data: { totalSales: { increment: 1 } } });

    return res.json({ url: session.url, orderId: order.id });
  } catch (error) {
    console.error("[orderRoutes] checkout-session error:", error);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// POST /orders/webhook — Stripe webhook for payment confirmation
router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const secret = process.env.STRIPE_MARKET_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event: Stripe.Event;
  try {
    const stripe  = getStripe();
    const payload = (req as any).rawBody || (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {})));
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch {
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      try {
        await db.order.update({
          where: { id: orderId },
          data:  { status: "CONFIRMED", paymentStatus: "PAID", stripePaymentIntentId: session.payment_intent as string ?? undefined },
        });
      } catch (e) {
        console.error("[orderRoutes] webhook order update error:", e);
      }
    }
  }

  return res.json({ received: true });
});

export default router;
