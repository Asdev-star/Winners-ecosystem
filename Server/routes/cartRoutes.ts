// Server/routes/cartRoutes.ts — Shopping Cart Management
// Phase 4: Winners Market - Cart operations

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Helper to get or create cart
async function getCart(tenantId: string, userId?: string, sessionId?: string) {
  let cart;
  
  if (userId) {
    cart = await db.cart.findFirst({
      where: { tenantId, userId, status: "ACTIVE" },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                stockQuantity: true,
                isDigital: true,
                vendorId: true,
                vendor: { select: { id: true, storeName: true } }
              }
            },
            variant: true
          }
        }
      }
    });
  }
  
  if (!cart && sessionId) {
    cart = await db.cart.findFirst({
      where: { tenantId, sessionId, status: "ACTIVE" },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                stockQuantity: true,
                isDigital: true,
                vendorId: true,
                vendor: { select: { id: true, storeName: true } }
              }
            },
            variant: true
          }
        }
      }
    });
  }
  
  if (!cart) {
    cart = await db.cart.create({
      data: {
        tenantId,
        userId,
        sessionId: sessionId || uuidv4(),
        status: "ACTIVE"
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                stockQuantity: true,
                isDigital: true,
                vendorId: true,
                vendor: { select: { id: true, storeName: true } }
              }
            },
            variant: true
          }
        }
      }
    });
  }
  
  return cart;
}

// GET /cart - Get current cart
router.get("/", async (req: Request, res: Response) => {
  try {
    // Try to get from headers first, then from JWT token
    let tenantId = req.headers["x-tenant-id"] as string;
    let userId = req.headers["x-user-id"] as string;
    const sessionId = req.headers["x-session-id"] as string;
    
    // If no tenantId in headers, try to extract from JWT
    if (!tenantId || !userId) {
      const authHeader = req.headers["authorization"];
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const token = authHeader.substring(7);
          const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
          if (!tenantId && decoded.tenantId) tenantId = decoded.tenantId;
          if (!userId && decoded.userId) userId = decoded.userId;
        } catch (e) {
          // Invalid token, continue with header values
        }
      }
    }
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }

    const cart = await getCart(tenantId, userId, sessionId);
    res.json(cart);
  } catch (error) {
    console.error("[cartRoutes] Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// POST /cart/items - Add item to cart
router.post("/items", async (req: Request, res: Response) => {
  try {
    // Try to get from headers first, then from JWT token
    let tenantId = req.headers["x-tenant-id"] as string;
    let userId = req.headers["x-user-id"] as string;
    const sessionId = req.headers["x-session-id"] as string;
    const { productId, variantId, quantity = 1 } = req.body;
    
    // If no tenantId in headers, try to extract from JWT
    if (!tenantId || !userId) {
      const authHeader = req.headers["authorization"];
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const token = authHeader.substring(7);
          const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
          if (!tenantId && decoded.tenantId) tenantId = decoded.tenantId;
          if (!userId && decoded.userId) userId = decoded.userId;
        } catch (e) {
          // Invalid token, continue with header values
        }
      }
    }
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }
    if (!productId) {
      return res.status(400).json({ error: "Product ID required" });
    }

    // Get product price
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { price: true, isActive: true, stockQuantity: true, allowBackorder: true }
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: "Product not found or unavailable" });
    }

    // Check stock
    if (!product.allowBackorder && product.stockQuantity < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    const cart = await getCart(tenantId, userId, sessionId);

    // Check if item exists in cart
    const existingItem = await db.cartItem.findFirst({
      where: { cartId: cart.id, productId, variantId: variantId || null }
    });

    if (existingItem) {
      // Update quantity
      await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      // Add new item
      await db.cartItem.create({
        data: {
          tenantId,
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          quantity,
          price: product.price
        }
      });
    }

    // Return updated cart
    const updatedCart = await getCart(tenantId, userId, sessionId);
    res.json(updatedCart);
  } catch (error) {
    console.error("[cartRoutes] Error adding to cart:", error);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// PUT /cart/items/:id - Update cart item quantity
router.put("/items/:id", async (req: Request, res: Response) => {
  try {
    // Try to get from headers first, then from JWT token
    let tenantId = req.headers["x-tenant-id"] as string;
    let userId = req.headers["x-user-id"] as string;
    const sessionId = req.headers["x-session-id"] as string;
    const { id } = req.params;
    const itemId = Array.isArray(id) ? id[0] : id;
    const { quantity } = req.body;
    
    // If no tenantId in headers, try to extract from JWT
    if (!tenantId || !userId) {
      const authHeader = req.headers["authorization"];
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const token = authHeader.substring(7);
          const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
          if (!tenantId && decoded.tenantId) tenantId = decoded.tenantId;
          if (!userId && decoded.userId) userId = decoded.userId;
        } catch (e) {
          // Invalid token, continue with header values
        }
      }
    }
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }

    if (quantity <= 0) {
      // Remove item
      await db.cartItem.delete({ where: { id: itemId } }).catch(() => {});
    } else {
      // Update quantity
      await db.cartItem.update({
        where: { id: itemId },
        data: { quantity }
      });
    }

    const cart = await getCart(tenantId, userId, sessionId);
    res.json(cart);
  } catch (error) {
    console.error("[cartRoutes] Error updating cart:", error);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

// DELETE /cart/items/:id - Remove item from cart
router.delete("/items/:id", async (req: Request, res: Response) => {
  try {
    // Try to get from headers first, then from JWT token
    let tenantId = req.headers["x-tenant-id"] as string;
    let userId = req.headers["x-user-id"] as string;
    const sessionId = req.headers["x-session-id"] as string;
    const { id } = req.params;
    const itemId = Array.isArray(id) ? id[0] : id;
    
    // If no tenantId in headers, try to extract from JWT
    if (!tenantId || !userId) {
      const authHeader = req.headers["authorization"];
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const token = authHeader.substring(7);
          const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
          if (!tenantId && decoded.tenantId) tenantId = decoded.tenantId;
          if (!userId && decoded.userId) userId = decoded.userId;
        } catch (e) {
          // Invalid token, continue with header values
        }
      }
    }
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }

    await db.cartItem.delete({ where: { id: itemId } }).catch(() => {});

    const cart = await getCart(tenantId, userId, sessionId);
    res.json(cart);
  } catch (error) {
    console.error("[cartRoutes] Error removing from cart:", error);
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

// DELETE /cart - Clear cart
router.delete("/", async (req: Request, res: Response) => {
  try {
    // Try to get from headers first, then from JWT token
    let tenantId = req.headers["x-tenant-id"] as string;
    let userId = req.headers["x-user-id"] as string;
    const sessionId = req.headers["x-session-id"] as string;
    
    // If no tenantId in headers, try to extract from JWT
    if (!tenantId || !userId) {
      const authHeader = req.headers["authorization"];
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const token = authHeader.substring(7);
          const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
          if (!tenantId && decoded.tenantId) tenantId = decoded.tenantId;
          if (!userId && decoded.userId) userId = decoded.userId;
        } catch (e) {
          // Invalid token, continue with header values
        }
      }
    }
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }

    const cart = await getCart(tenantId, userId, sessionId);
    await db.cartItem.deleteMany({ where: { cartId: cart.id } });

    res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("[cartRoutes] Error clearing cart:", error);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

// POST /cart/merge - Merge guest cart with user cart after login
router.post("/merge", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID required" });
    }

    // Find guest cart
    const guestCart = await db.cart.findFirst({
      where: { tenantId, sessionId, status: "ACTIVE" },
      include: { items: true }
    });

    if (!guestCart || guestCart.items.length === 0) {
      return res.json({ message: "No guest cart to merge" });
    }

    // Find or create user cart
    const userCart = await db.cart.findFirst({
      where: { tenantId, userId, status: "ACTIVE" },
      include: { items: true }
    });

    if (userCart) {
      // Merge items
      for (const item of guestCart.items) {
        const existing = userCart.items.find(
          i => i.productId === item.productId && i.variantId === item.variantId
        );
        
        if (existing) {
          await db.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity }
          });
        } else {
          await db.cartItem.create({
            data: {
              tenantId,
              cartId: userCart.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price
            }
          });
        }
      }
      
      // Delete guest cart
      await db.cart.delete({ where: { id: guestCart.id, tenantId } });
    } else {
      // Convert guest cart to user cart
      await db.cart.update({
        where: { id: guestCart.id, tenantId },
        data: { userId, sessionId: null }
      });
    }

    const mergedCart = await getCart(tenantId, userId);
    res.json(mergedCart);
  } catch (error) {
    console.error("[cartRoutes] Error merging carts:", error);
    res.status(500).json({ error: "Failed to merge carts" });
  }
});

export default router;
