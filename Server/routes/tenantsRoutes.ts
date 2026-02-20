// server/routes/tenantsRoutes.ts

import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole, requirePermission, enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();

router.use(authMiddleware);
router.use(enforceTenant);

// ─── GET /tenants/me ──────────────────────────────────────────────────────────

router.get("/me", async (req: Request, res: Response) => {
  try {
    const tenant = await db.tenant.findFirst({
      where:   { id: req.user!.tenantId, deletedAt: null },
      include: { _count: { select: { users: true } } },
    });

    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    return res.json({
      id:          tenant.id,
      name:        tenant.name,
      plan:        tenant.plan.toLowerCase(),
      memberCount: tenant._count.users,
      createdAt:   tenant.createdAt,
      settings: {
        timezone:    tenant.timezone,
        currency:    tenant.currency,
        fiscalMonth: tenant.fiscalMonth,
      },
    });
  } catch (err) {
    console.error("Get tenant error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── PATCH /tenants/me ────────────────────────────────────────────────────────

router.patch("/me", requireRole("owner", "admin"), async (req: Request, res: Response) => {
  const { name, settings } = req.body;

  try {
    const updated = await db.tenant.update({
      where: { id: req.user!.tenantId },
      data:  {
        ...(name && { name }),
        ...(settings?.timezone    && { timezone:    settings.timezone }),
        ...(settings?.currency    && { currency:    settings.currency }),
        ...(settings?.fiscalMonth && { fiscalMonth: settings.fiscalMonth }),
      },
    });

    return res.json({ message: "Tenant updated", tenant: updated });
  } catch (err) {
    console.error("Update tenant error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /tenants/me/members ──────────────────────────────────────────────────

router.get("/me/members", async (req: Request, res: Response) => {
  try {
    const members = await db.user.findMany({
      where:   { tenantId: req.user!.tenantId, deletedAt: null },
      select:  { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    return res.json({
      tenantId: req.user!.tenantId,
      members:  members.map((m) => ({ ...m, role: m.role.toLowerCase() })),
      total:    members.length,
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /tenants/me/billing ──────────────────────────────────────────────────

router.get("/me/billing", requirePermission("manageBilling"), async (req: Request, res: Response) => {
  try {
    const tenant = await db.tenant.findFirst({
      where:   { id: req.user!.tenantId },
      include: { _count: { select: { users: true } } },
    });

    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    // In production: fetch real billing from Stripe
    return res.json({
      tenantId:        tenant.id,
      plan:            tenant.plan.toLowerCase(),
      status:          "active",
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      seats:           { used: tenant._count.users, limit: tenant.plan === "FREE" ? 3 : tenant.plan === "PRO" ? 10 : 999 },
      monthlyCost:     tenant.plan === "FREE" ? 0 : tenant.plan === "PRO" ? 99 : 299,
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── DELETE /tenants/me ───────────────────────────────────────────────────────

router.delete("/me", requirePermission("deleteTenant"), async (req: Request, res: Response) => {
  try {
    await db.tenant.update({
      where: { id: req.user!.tenantId },
      data:  { deletedAt: new Date() },
    });

    return res.json({
      message:   "Tenant scheduled for deletion",
      tenantId:  req.user!.tenantId,
      deletedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;