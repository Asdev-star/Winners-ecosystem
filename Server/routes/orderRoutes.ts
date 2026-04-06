// Server/routes/orderRoutes.ts — Order Management
// Phase 4: Winners Market - Order processing and management

import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import { OrderStatus, type Prisma } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";
import { handleWebhookEvent } from "../services/stripeService.js";
import type { AuthRequest } from "../types/index.js";

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

const router = Router();

// Helper to extract string from params/query
const getParam = (p: string | string[] | undefined): string =>
  Array.isArray(p) ? p[0] : p || "";

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

async function createCheckoutSession(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const {
      cartId,
      shippingName,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
      shippingPhone,
    } = req.body;

    if (!cartId) return res.status(400).json({ error: "cartId is required" });

    const cart = await db.cart.findFirst({
      where: { id: cartId, tenantId, userId, status: "ACTIVE" },
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
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty or not found" });
    }

    const vendorGroups = new Map<
      string,
      {
        vendor: {
          id: string;
          storeName: string;
          stripeAccountId: string | null;
          freeShipping: boolean;
          shippingPrice: number;
          taxRate: number;
        };
        items: typeof cart.items;
      }
    >();

    for (const item of cart.items) {
      const vendor = item.product.vendor;
      if (!vendor?.id) continue;

      if (!vendorGroups.has(vendor.id)) {
        vendorGroups.set(vendor.id, { vendor, items: [] });
      }
      vendorGroups.get(vendor.id)!.items.push(item);
    }

    if (vendorGroups.size === 0) {
      return res
        .status(400)
        .json({ error: "No valid vendors found for cart items" });
    }

    const orders: Array<{ id: string; vendorId: string; total: number }> = [];
    const lineItems: Array<{
      price_data: {
        currency: string;
        unit_amount: number;
        product_data: { name: string };
      };
      quantity: number;
    }> = [];

    for (const [vendorId, { vendor, items }] of vendorGroups) {
      let subtotal = 0;
      const orderItems: Array<{
        productId: string;
        variantId: string | null;
        name: string;
        sku: string | null;
        quantity: number;
        price: number;
        total: number;
      }> = [];

      for (const item of items) {
        const itemPrice = item.price;
        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;
        orderItems.push({
          productId: item.productId,
          variantId: item.variantId ?? null,
          name: item.product.name,
          sku: item.variant?.sku ?? (item.product as { sku?: string }).sku ?? null,
          quantity: item.quantity,
          price: itemPrice,
          total: itemTotal,
        });
      }

      const shippingCost = vendor.freeShipping ? 0 : (vendor.shippingPrice ?? 0);
      const taxRate = vendor.taxRate ?? 0;
      const taxAmount = Math.round(subtotal * (taxRate / 100));
      const total = subtotal + shippingCost + taxAmount;

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
          shippingName: shippingName ?? "",
          shippingAddress: shippingAddress ?? "",
          shippingCity: shippingCity ?? "",
          shippingState: shippingState ?? "",
          shippingZip: shippingZip ?? "",
          shippingCountry: shippingCountry ?? "US",
          shippingPhone: shippingPhone ?? "",
          paymentMethod: "STRIPE",
          status: "PENDING",
          paymentStatus: "PENDING",
        },
      });

      await db.orderItem.createMany({
        data: orderItems.map((item) => ({
          ...item,
          tenantId,
          orderId: order.id,
        })),
      });

      orders.push({ id: order.id, vendorId, total });

      for (const item of items) {
        lineItems.push({
          price_data: {
            currency: "usd",
            unit_amount: Math.round(item.price),
            product_data: { name: item.product.name },
          },
          quantity: item.quantity,
        });
      }
    }

    const stripe = getStripe();
    const appUrl = process.env.APP_URL ?? "https://winners-empire-eco.up.railway.app";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${appUrl}/market/orders?payment=success&orders=${orders.map((o) => o.id).join(",")}`,
      cancel_url: `${appUrl}/market/checkout?cancelled=true`,
      metadata: {
        orderIds: orders.map((o) => o.id).join(","),
        tenantId,
        userId,
        vendorIds: orders.map((o) => o.vendorId).join(","),
      },
    });

    for (const order of orders) {
      await db.order.update({
        where: { id: order.id, tenantId },
        data: { stripeSessionId: session.id },
      });

      const commission = Math.round(order.total * 0.15);
      const vendorPayout = order.total - commission;

      await db.vendorPayout.create({
        data: {
          tenantId,
          vendorId: order.vendorId,
          orderId: order.id,
          amount: vendorPayout,
          commission,
          status: "pending",
        },
      });
    }

    await db.cart.update({
      where: { id: cart.id, tenantId },
      data: { status: "CONVERTED" },
    });

    for (const [vendorId] of vendorGroups) {
      await db.vendor.update({
        where: { id: vendorId, tenantId },
        data: { totalSales: { increment: 1 } },
      });
    }

    return res.json({ url: session.url, orderIds: orders.map((o) => o.id) });
  } catch (error) {
    console.error("[orderRoutes] checkout error:", error);
    return res
      .status(500)
      .json({ error: "Failed to create checkout session" });
  }
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
      if (!parsedStatus)
        return res.status(400).json({ error: "Invalid order status" });
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
              product: { select: { name: true, slug: true, images: { take: 1 } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
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
    const tenantId = req.user!.tenantId;
    const id = getParam(req.params.id as string | string[] | undefined);

    const order = await db.order.findFirst({
      where: { id, userId, tenantId },
      include: {
        vendor: { select: { storeName: true, storeSlug: true } },
        items: {
          include: {
            product: { select: { name: true, images: true } },
            variant: true,
          },
        },
        tracking: true,
      },
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
      cartId,
      vendorId,
      shippingName,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
      shippingPhone,
      billingName,
      billingAddress,
      billingCity,
      billingState,
      billingZip,
      billingCountry,
      paymentMethod,
      notes,
    } = req.body;

    // Get cart items
    const cart = await db.cart.findFirst({
      where: { id: cartId, tenantId, userId, status: "ACTIVE" },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Verify vendor
    const vendor = await db.vendor.findFirst({
      where: { id: vendorId, tenantId },
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
        total: itemTotal,
      });

      // Update stock
      if (!item.product.allowBackorder) {
        await db.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }
    }

    const shippingCost = vendor.freeShipping ? 0 : vendor.shippingPrice || 0;
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
        shippingName,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingZip,
        shippingCountry,
        shippingPhone,
        billingName,
        billingAddress,
        billingCity,
        billingState,
        billingZip,
        billingCountry,
        paymentMethod,
        notes,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
    });

    // Create order items
    await db.orderItem.createMany({
      data: orderItems.map((item) => ({
        ...item,
        orderId: order.id,
      })),
    });

    // Clear cart
    await db.cart.update({
      where: { id: cart.id },
      data: { status: "CONVERTED" },
    });

    // Update vendor stats
    await db.vendor.update({
      where: { id: vendorId },
      data: { totalSales: { increment: 1 } },
    });

    const createdOrder = await db.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("[orderRoutes] Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// PUT /orders/:id/cancel - Cancel order
router.put(
  "/:id/cancel",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const id = getParam(req.params.id as string | string[] | undefined);

      const order = await db.order.findFirst({
        where: { id, userId, status: { in: ["PENDING", "CONFIRMED"] } },
      });

      if (!order) {
        return res
          .status(404)
          .json({ error: "Order not found or cannot be cancelled" });
      }

      // Restore stock
      const orderItems = await db.orderItem.findMany({
        where: { orderId: id },
      });

      for (const item of orderItems) {
        await db.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }

      // Update order status
      const updated = await db.order.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      res.json(updated);
    } catch (error) {
      console.error("[orderRoutes] Error cancelling order:", error);
      res.status(500).json({ error: "Failed to cancel order" });
    }
  },
);

// Vendor routes
// GET /orders/vendor - Get vendor's orders
router.get(
  "/vendor/all",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const tenantId = req.user!.tenantId;
      const status = getParam(
        req.query.status as string | string[] | undefined,
      );
      const pageStr = getParam(req.query.page as string | string[] | undefined);
      const limitStr = getParam(
        req.query.limit as string | string[] | undefined,
      );
      const page = parseInt(pageStr) || 1;
      const limit = parseInt(limitStr) || 20;

      const vendor = await db.vendor.findFirst({
        where: { userId, tenantId },
      });

      if (!vendor) {
        return res.status(403).json({ error: "Vendor not found" });
      }

      const where: Prisma.OrderWhereInput = { vendorId: vendor.id };
      if (status) {
        const parsedStatus = parseOrderStatus(status);
        if (!parsedStatus)
          return res.status(400).json({ error: "Invalid order status" });
        where.status = parsedStatus;
      }

      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        db.order.findMany({
          where,
          include: {
            user: { select: { name: true, email: true } },
            items: { include: { product: { select: { name: true } } } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        db.order.count({ where }),
      ]);

      res.json({
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("[orderRoutes] Error fetching vendor orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  },
);

// PUT /orders/:id/status - Update order status (vendor)
router.put(
  "/:id/status",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const tenantId = req.user!.tenantId;
      const id = getParam(req.params.id as string | string[] | undefined);
      const { status, trackingNumber, carrier } = req.body;

      const vendor = await db.vendor.findFirst({
        where: { userId, tenantId },
      });

      if (!vendor) {
        return res.status(403).json({ error: "Vendor not found" });
      }

      const order = await db.order.findFirst({
        where: { id, vendorId: vendor.id, tenantId },
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const updated = await db.order.update({
        where: { id, tenantId },
        data: { status },
      });

      // VENDOR SETTLEMENT: Credit vendor wallet when order is delivered
      if (status === "DELIVERED" || status === "COMPLETED") {
        try {
          const orderItems = await db.orderItem.findMany({
            where: { orderId: id },
          });
          for (const item of orderItems) {
            const vendor = await db.vendor.findUnique({
              where: { id: order.vendorId },
            });
            if (vendor) {
              const wallet = await db.userWallet.findUnique({
                where: { userId_tenantId: { userId: vendor.userId, tenantId } },
              });
              if (wallet) {
                const payout = item.price - item.price * 0.1; // 10% platform fee
                await db.$transaction([
                  db.userWallet.update({
                    where: { id: wallet.id },
                    data: {
                      balance: { increment: payout },
                      available: { increment: payout },
                      totalEarned: { increment: payout },
                    },
                  }),
                  db.walletTransaction.create({
                    data: {
                      walletId: wallet.id,
                      type: "earned",
                      amount: payout,
                      fee: 0,
                      netAmount: payout,
                      status: "completed",
                      description: `Order ${id} payout`,
                      reference: id,
                      completedAt: new Date(),
                    },
                  }),
                ]);
              }
            }
          }
        } catch (err) {
          console.error("[vendor settlement]", err);
        }
      }

      // Add tracking if provided
      if (trackingNumber) {
        await db.orderTracking.upsert({
          where: { orderId: id },
          update: { trackingNumber, carrier, status: "IN_TRANSIT" },
          create: {
            tenantId,
            orderId: id,
            trackingNumber,
            carrier,
            status: "IN_TRANSIT",
          },
        });
      }

      res.json(updated);
    } catch (error) {
      console.error("[orderRoutes] Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order" });
    }
  },
);

router.post("/checkout", authMiddleware, createCheckoutSession);
router.post("/checkout-session", authMiddleware, createCheckoutSession);

// POST /orders/webhook — Stripe webhook for payment confirmation
router.post("/webhook", async (req: Request & { rawBody?: Buffer }, res: Response) => {
  const signature =
    typeof req.headers["stripe-signature"] === "string"
      ? req.headers["stripe-signature"]
      : "";

  try {
    const payloadBuffer =
      req.rawBody ||
      (Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(JSON.stringify(req.body ?? {})));
    const result = await handleWebhookEvent(payloadBuffer, signature);
    return res.json(result);
  } catch (error) {
    console.error(
      "Stripe order webhook error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return res
      .status(400)
      .json({
        message: error instanceof Error ? error.message : "Webhook error",
      });
  }
});

export default router;
