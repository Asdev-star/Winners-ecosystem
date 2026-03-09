// server/routes/notificationRoutes.ts

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";
import db from "../db.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link: string;
}

// In-memory store per tenant (replace with DB table in production)
const notifStore: Record<string, NotificationItem[]> = {};

function getTenantNotifs(tenantId: string) {
  if (!notifStore[tenantId]) {
    // Seed with initial notifications based on real data
    notifStore[tenantId] = [
      { id: "n1", type: "system",  title: "Welcome to Winners Ecosystem", body: "Your workspace is set up and ready. Explore the dashboard to get started.", read: false, createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),         link: "/" },
      { id: "n2", type: "revenue", title: "30-day revenue report ready",   body: "Your analytics data for the last 30 days has been processed and is ready to view.", read: false, createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),         link: "/analytics" },
      { id: "n3", type: "team",    title: "Team set up successfully",       body: "4 members have been added to your workspace: Demo User, Alice, Bob, and Carol.", read: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),      link: "/team" },
      { id: "n4", type: "billing", title: "Pro plan activated",             body: "Your workspace is on the Pro plan. Enjoy unlimited analytics and all export formats.", read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),    link: "/billing" },
      { id: "n5", type: "anomaly", title: "Revenue anomaly detected",       body: "3 unusual revenue days were detected in the last 30 days. Check your analytics.", read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),    link: "/analytics" },
    ];
  }
  return notifStore[tenantId];
}

// GET /notifications
router.get("/", async (req: Request, res: Response) => {
  const notifs = getTenantNotifs(req.user!.tenantId);
  return res.json({ notifications: notifs, total: notifs.length, unread: notifs.filter((n) => !n.read).length });
});

// PATCH /notifications/:id/read
router.patch("/:id/read", async (req: Request, res: Response) => {
  const notifs = getTenantNotifs(req.user!.tenantId);
  const n = notifs.find((n) => n.id === req.params.id);
  if (n) n.read = true;
  return res.json({ message: "Marked as read" });
});

// PATCH /notifications/read-all
router.patch("/read-all", async (req: Request, res: Response) => {
  const notifs = getTenantNotifs(req.user!.tenantId);
  notifs.forEach((n) => { n.read = true; });
  return res.json({ message: "All marked as read" });
});

// DELETE /notifications/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  notifStore[tenantId] = getTenantNotifs(tenantId).filter((n) => n.id !== req.params.id);
  return res.json({ message: "Deleted" });
});

// DELETE /notifications
router.delete("/", async (req: Request, res: Response) => {
  notifStore[req.user!.tenantId] = [];
  return res.json({ message: "All cleared" });
});

// POST /notifications (create — used internally by other services)
router.post("/", async (req: Request, res: Response) => {
  const { type, title, body, link } = req.body;
  const notifs = getTenantNotifs(req.user!.tenantId);
  const newNotif = { id: `n_${Date.now()}`, type, title, body, read: false, createdAt: new Date().toISOString(), link };
  notifs.unshift(newNotif);
  return res.status(201).json(newNotif);
});

export default router;
