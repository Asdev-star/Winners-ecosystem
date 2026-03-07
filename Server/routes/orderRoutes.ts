// Server/routes/orderRoutes.ts — Order Management
// Phase 4: Winners Market - Order processing and management

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

// Helper to generate order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// GET /orders - Get user's orders
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { status, page = "1", limit = "20" } = req.query;

    const where: any = { userId, tenantId };
    if (status) where.status = String(status);

    const skip = (Number(page) - 1) * Number(limit);

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
        take: Number(limit)
      }),
      db.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
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
    const { id } = req.params;

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
    const { id } = req.params;

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
    const { status, page = "1", limit = "20" } = req.query;

    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId }
    });

    if (!vendor) {
      return res.status(403).json({ error: "Vendor not found" });
    }

    const where: any = { vendorId: vendor.id };
    if (status) where.status = String(status);

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { product: { select: { name: true } } } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit)
      }),
      db.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
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
    const { id } = req.params;
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

export default router;
