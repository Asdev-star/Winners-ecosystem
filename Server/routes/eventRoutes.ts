// Phase 4H — Winners Market: Events Routes
// Event creation, ticketing, NFT passes, organizer dashboard
// ATLAS AI supervisor integration

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireLayerAccess } from "../middleware/rbacMiddleware";
import { db } from "../db";

const router = Router();

// GET /events - Get all events
router.get(
  "/",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const {
        category,
        status = "upcoming",
        limit = 20,
        offset = 0,
      } = req.query;
      const userId = req.user!.userId;

      const where: any = {
        tenantId: req.user!.tenantId,
      };

      if (category) where.category = category;
      if (status === "upcoming") where.startDate = { gte: new Date() };
      if (status === "past") where.endDate = { lt: new Date() };

      const events = await db.event.findMany({
        where,
        include: {
          organizer: { select: { name: true, avatar: true } },
          tickets: { where: { userId }, select: { id: true, status: true } },
          _count: { select: { tickets: true } },
        },
        orderBy: { startDate: "asc" },
        take: Number(limit),
        skip: Number(offset),
      });

      res.json({ events });
    } catch (error) {
      console.error("[eventRoutes] Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  },
);

// POST /events - Create new event
router.post(
  "/",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const {
        title,
        description,
        startDate,
        endDate,
        location,
        virtualLink,
        category,
        ticketTiers,
        maxAttendees,
        isVirtual,
        imageUrl,
        tags,
      } = req.body;

      const event = await db.event.create({
        data: {
          title,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          location,
          virtualLink,
          category,
          ticketTiers: ticketTiers || [],
          maxAttendees: maxAttendees || null,
          isVirtual: isVirtual || false,
          imageUrl,
          tags: tags || [],
          organizerId: req.user!.userId,
          tenantId: req.user!.tenantId,
          status: "draft",
        },
        include: {
          organizer: { select: { name: true, avatar: true } },
        },
      });

      res.status(201).json(event);
    } catch (error) {
      console.error("[eventRoutes] Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  },
);

// GET /events/:id - Get event details
router.get(
  "/:id",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const event = await db.event.findUnique({
        where: { id: req.params.id, tenantId: req.user!.tenantId },
        include: {
          organizer: { select: { name: true, avatar: true, bio: true } },
          tickets: {
            where: { userId: req.user!.userId },
            select: { id: true, status: true, tier: true, price: true },
          },
          _count: { select: { tickets: true } },
        },
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      console.error("[eventRoutes] Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  },
);

// POST /events/:id/tickets - Purchase ticket
router.post(
  "/:id/tickets",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const { tier, quantity = 1 } = req.body;
      const eventId = req.params.id;
      const userId = req.user!.userId;

      const event = await db.event.findUnique({
        where: { id: eventId, tenantId: req.user!.tenantId },
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (event.startDate < new Date()) {
        return res.status(400).json({ error: "Event has already started" });
      }

      // Check ticket availability
      const soldTickets = await db.eventTicket.count({
        where: { eventId, status: "confirmed" },
      });

      if (event.maxAttendees && soldTickets + quantity > event.maxAttendees) {
        return res.status(400).json({ error: "Not enough tickets available" });
      }

      // Get ticket tier pricing
      const ticketTier = event.ticketTiers?.find((t: any) => t.name === tier);
      if (!ticketTier) {
        return res.status(400).json({ error: "Invalid ticket tier" });
      }

      const totalAmount = ticketTier.price * quantity;

      // Create Stripe payment intent
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          eventId,
          userId,
          tier,
          quantity: quantity.toString(),
        },
      });

      // Create ticket records
      const tickets = [];
      for (let i = 0; i < quantity; i++) {
        const ticket = await db.eventTicket.create({
          data: {
            eventId,
            userId,
            tier,
            price: ticketTier.price,
            status: "pending",
            paymentIntentId: paymentIntent.id,
            tenantId: req.user!.tenantId,
          },
        });
        tickets.push(ticket);
      }

      res.json({
        tickets,
        paymentIntent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
        },
        totalAmount,
      });
    } catch (error) {
      console.error("[eventRoutes] Error purchasing tickets:", error);
      res.status(500).json({ error: "Failed to purchase tickets" });
    }
  },
);

// GET /events/:id/tickets - Get event tickets (organizer only)
router.get(
  "/:id/tickets",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const event = await db.event.findUnique({
        where: { id: req.params.id, tenantId: req.user!.tenantId },
        select: { organizerId: true },
      });

      if (!event || event.organizerId !== req.user!.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const tickets = await db.eventTicket.findMany({
        where: { eventId: req.params.id },
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ tickets });
    } catch (error) {
      console.error("[eventRoutes] Error fetching tickets:", error);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  },
);

// PUT /events/:id - Update event (organizer only)
router.put(
  "/:id",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const event = await db.event.findUnique({
        where: { id: req.params.id, tenantId: req.user!.tenantId },
        select: { organizerId: true },
      });

      if (!event || event.organizerId !== req.user!.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedEvent = await db.event.update({
        where: { id: req.params.id },
        data: req.body,
        include: {
          organizer: { select: { name: true, avatar: true } },
        },
      });

      res.json(updatedEvent);
    } catch (error) {
      console.error("[eventRoutes] Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  },
);

// DELETE /events/:id - Delete event (organizer only)
router.delete(
  "/:id",
  authMiddleware,
  requireLayerAccess("market"),
  async (req: Request, res: Response) => {
    try {
      const event = await db.event.findUnique({
        where: { id: req.params.id, tenantId: req.user!.tenantId },
        select: { organizerId: true },
      });

      if (!event || event.organizerId !== req.user!.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await db.event.delete({
        where: { id: req.params.id },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[eventRoutes] Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  },
);

export default router;
