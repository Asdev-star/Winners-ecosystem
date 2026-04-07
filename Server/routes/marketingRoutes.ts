import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
const prisma = new PrismaClient();

// Get all marketing services for a tenant
router.get("/services", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const services = await prisma.marketingService.findMany({
      where: { tenantId },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            rating: true,
          },
        },
      },
    });
    res.json(services);
  } catch (error) {
    console.error("Error fetching marketing services:", error);
    res.status(500).json({ error: "Failed to fetch marketing services" });
  }
});

// Get marketing service by ID
router.get("/services/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const service = await prisma.marketingService.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            rating: true,
            description: true,
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({ error: "Marketing service not found" });
    }

    res.json(service);
  } catch (error) {
    console.error("Error fetching marketing service:", error);
    res.status(500).json({ error: "Failed to fetch marketing service" });
  }
});

// Create marketing service (vendor only)
router.post("/services", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    // Check if user is a vendor
    const vendor = await prisma.vendor.findFirst({
      where: { userId, tenantId },
    });

    if (!vendor) {
      return res
        .status(403)
        .json({ error: "Only vendors can create marketing services" });
    }

    const { title, description, category, pricing, deliverables, turnaround } =
      req.body;

    const service = await prisma.marketingService.create({
      data: {
        tenantId,
        vendorId: vendor.id,
        title,
        description,
        category,
        pricing,
        deliverables,
        turnaround,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    res.status(201).json(service);
  } catch (error) {
    console.error("Error creating marketing service:", error);
    res.status(500).json({ error: "Failed to create marketing service" });
  }
});

// Update marketing service (vendor only)
router.put("/services/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user owns the service
    const service = await prisma.marketingService.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!service || service.vendor.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this service" });
    }

    const { title, description, category, pricing, deliverables, turnaround } =
      req.body;

    const updatedService = await prisma.marketingService.update({
      where: { id },
      data: {
        title,
        description,
        category,
        pricing,
        deliverables,
        turnaround,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    res.json(updatedService);
  } catch (error) {
    console.error("Error updating marketing service:", error);
    res.status(500).json({ error: "Failed to update marketing service" });
  }
});

// Delete marketing service (vendor only)
router.delete("/services/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user owns the service
    const service = await prisma.marketingService.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!service || service.vendor.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this service" });
    }

    await prisma.marketingService.delete({
      where: { id },
    });

    res.json({ message: "Marketing service deleted successfully" });
  } catch (error) {
    console.error("Error deleting marketing service:", error);
    res.status(500).json({ error: "Failed to delete marketing service" });
  }
});

// Get marketing orders for current user
router.get("/orders", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await prisma.marketingOrder.findMany({
      where: {
        OR: [{ buyerId: userId }, { vendor: { userId } }],
      },
      include: {
        service: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching marketing orders:", error);
    res.status(500).json({ error: "Failed to fetch marketing orders" });
  }
});

// Get marketing order by ID
router.get("/orders/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const order = await prisma.marketingOrder.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                description: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Marketing order not found" });
    }

    // Check if user is buyer or vendor
    if (order.buyerId !== userId && order.service.vendor.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching marketing order:", error);
    res.status(500).json({ error: "Failed to fetch marketing order" });
  }
});

// Create marketing order
router.post("/orders", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const buyerId = req.user.userId;

    const { serviceId, brief, amount } = req.body;

    // Verify service exists and is active
    const service = await prisma.marketingService.findUnique({
      where: { id: serviceId },
      include: { vendor: true },
    });

    if (!service || service.tenantId !== tenantId) {
      return res.status(404).json({ error: "Marketing service not found" });
    }

    // Create escrow payment first (simplified - in real implementation, integrate with payment processor)
    const escrow = await prisma.escrowPayment.create({
      data: {
        tenantId,
        buyerId,
        sellerId: service.vendor.userId,
        amount,
        status: "PENDING",
        description: `Marketing service: ${service.title}`,
      },
    });

    const order = await prisma.marketingOrder.create({
      data: {
        tenantId,
        serviceId,
        buyerId,
        vendorId: service.vendorId,
        status: "PENDING",
        brief,
        amount,
        escrowId: escrow.id,
      },
      include: {
        service: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating marketing order:", error);
    res.status(500).json({ error: "Failed to create marketing order" });
  }
});

// Update marketing order status (vendor only)
router.put("/orders/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { status } = req.body;

    const order = await prisma.marketingOrder.findUnique({
      where: { id },
      include: {
        service: {
          include: { vendor: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Marketing order not found" });
    }

    // Check if user is the vendor
    if (order.service.vendor.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this order" });
    }

    const updatedOrder = await prisma.marketingOrder.update({
      where: { id },
      data: { status },
      include: {
        service: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating marketing order:", error);
    res.status(500).json({ error: "Failed to update marketing order" });
  }
});

export default router;
