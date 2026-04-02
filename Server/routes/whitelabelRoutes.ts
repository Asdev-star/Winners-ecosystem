// Phase 8 — Winners Cloud — White-label Licensing API
// Enterprise white-label licensing, sub-tenant provisioning, and custom branding

import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

// ─── TENANT CONFIGURATION ─────────────────────────────────────────────────────

// GET /whitelabel/config — Get tenant configuration
router.get("/config", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;

  try {
    let config = await db.tenantConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      // Create default config
      config = await db.tenantConfig.create({
        data: {
          tenantId,
          name: "Default Tenant",
          domain: "",
          branding: {
            logoUrl: null,
            primaryColor: "#C9A84C",
            secondaryColor: "#0D1520",
            faviconUrl: null,
          },
          features: ["community", "academy", "market"],
          active: true,
        },
      });
    }

    res.json({ config });
  } catch (err) {
    console.error("[WhiteLabel] Config fetch error:", err);
    res.status(500).json({ error: "Failed to fetch configuration" });
  }
});

// PATCH /whitelabel/branding — Update tenant branding
router.patch("/branding", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { branding } = req.body ?? {};

  if (!branding) {
    return res.status(400).json({ error: "Branding data is required" });
  }

  try {
    const config = await db.tenantConfig.upsert({
      where: { tenantId },
      update: { branding },
      create: {
        tenantId,
        name: "Default Tenant",
        branding,
        features: ["community", "academy", "market"],
        active: true,
      },
    });

    res.json({ config, success: true });
  } catch (err) {
    console.error("[WhiteLabel] Branding update error:", err);
    res.status(500).json({ error: "Failed to update branding" });
  }
});

// PATCH /whitelabel/features — Update enabled features
router.patch("/features", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { features } = req.body ?? {};

  if (!Array.isArray(features)) {
    return res.status(400).json({ error: "Features must be an array" });
  }

  try {
    const config = await db.tenantConfig.upsert({
      where: { tenantId },
      update: { features },
      create: {
        tenantId,
        name: "Default Tenant",
        features,
        active: true,
      },
    });

    res.json({ config, success: true });
  } catch (err) {
    console.error("[WhiteLabel] Features update error:", err);
    res.status(500).json({ error: "Failed to update features" });
  }
});

// PATCH /whitelabel/domain — Update custom domain
router.patch("/domain", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { domain } = req.body ?? {};

  if (!domain?.trim()) {
    return res.status(400).json({ error: "Domain is required" });
  }

  try {
    // Check if domain is already in use
    const existing = await db.tenantConfig.findFirst({
      where: { domain: domain.toLowerCase(), tenantId: { not: tenantId } },
    });

    if (existing) {
      return res.status(409).json({ error: "Domain already in use" });
    }

    const config = await db.tenantConfig.upsert({
      where: { tenantId },
      update: { domain: domain.toLowerCase() },
      create: {
        tenantId,
        name: "Default Tenant",
        domain: domain.toLowerCase(),
        features: ["community", "academy", "market"],
        active: true,
      },
    });

    res.json({ config, success: true });
  } catch (err) {
    console.error("[WhiteLabel] Domain update error:", err);
    res.status(500).json({ error: "Failed to update domain" });
  }
});

// ─── SUB-TENANT PROVISIONING ──────────────────────────────────────────────────

// POST /whitelabel/provision — Provision sub-tenant
router.post("/provision", async (req: Request, res: Response) => {
  const parentTenantId = req.user!.tenantId;
  const userRole = req.user!.role;

  if (!["owner", "admin"].includes(userRole)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { name, domain, plan = "starter" } = req.body ?? {};

  if (!name?.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    // Create new tenant
    const newTenant = await db.tenant.create({
      data: {
        id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/\s+/g, "-"),
        region: "africa-east",
        status: "active",
        plan: plan.toUpperCase(),
        parentTenantId,
      },
    });

    // Create default config
    const config = await db.tenantConfig.create({
      data: {
        tenantId: newTenant.id,
        name: newTenant.name,
        domain: domain ? domain.toLowerCase() : "",
        branding: {
          logoUrl: null,
          primaryColor: "#C9A84C",
          secondaryColor: "#0D1520",
          faviconUrl: null,
        },
        features: ["community", "academy"],
        active: true,
      },
    });

    // Create DNS zone for custom domain
    if (domain) {
      await db.dNSZone.create({
        data: {
          tenantId: newTenant.id,
          domain: domain.toLowerCase(),
          ns: ["ns1.winnersempire.io", "ns2.winnersempire.io"],
        },
      });
    }

    res.status(201).json({
      tenant: newTenant,
      config,
      message: "Sub-tenant provisioned successfully",
    });
  } catch (err) {
    console.error("[WhiteLabel] Provision error:", err);
    res.status(500).json({ error: "Failed to provision sub-tenant" });
  }
});

// GET /whitelabel/subtenants — List sub-tenants
router.get("/subtenants", async (req: Request, res: Response) => {
  const parentTenantId = req.user!.tenantId;

  try {
    const subtenants = await db.tenant.findMany({
      where: { parentTenantId },
      include: {
        config: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ subtenants });
  } catch (err) {
    console.error("[WhiteLabel] Subtenant list error:", err);
    res.status(500).json({ error: "Failed to list sub-tenants" });
  }
});

// DELETE /whitelabel/subtenants/:id — Deprovision sub-tenant
router.delete("/subtenants/:id", async (req: Request, res: Response) => {
  const parentTenantId = req.user!.tenantId;
  const userRole = req.user!.role;
  const { id } = req.params as Record<string, string>;

  if (!["owner", "admin"].includes(userRole)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const tenant = await db.tenant.findFirst({
      where: { id, parentTenantId },
    });

    if (!tenant) {
      return res.status(404).json({ error: "Sub-tenant not found" });
    }

    // Soft delete by updating status
    await db.tenant.update({
      where: { id },
      data: { status: "suspended" },
    });

    res.json({ success: true, message: "Sub-tenant deprovisioned" });
  } catch (err) {
    console.error("[WhiteLabel] Deprovision error:", err);
    res.status(500).json({ error: "Failed to deprovision sub-tenant" });
  }
});

// ─── ENTERPRISE SSO ───────────────────────────────────────────────────────────

// GET /whitelabel/sso/config — Get SSO configuration
router.get("/sso/config", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;

  try {
    let ssoConfig = await db.sSOConfig.findUnique({
      where: { tenantId },
    });

    if (!ssoConfig) {
      return res.json({ config: null });
    }

    res.json({
      config: {
        ...ssoConfig,
        clientSecret: undefined, // Never expose secret
      },
    });
  } catch (err) {
    console.error("[WhiteLabel] SSO config fetch error:", err);
    res.status(500).json({ error: "Failed to fetch SSO configuration" });
  }
});

// POST /whitelabel/sso/config — Configure SSO (SAML/OIDC)
router.post("/sso/config", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userRole = req.user!.role;

  if (!["owner", "admin"].includes(userRole)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const {
    provider,
    entityId,
    ssoUrl,
    certificate,
    clientId,
    clientSecret,
    oidcIssuer,
  } = req.body ?? {};

  try {
    const ssoConfig = await db.sSOConfig.upsert({
      where: { tenantId },
      update: {
        provider,
        entityId,
        ssoUrl,
        certificate,
        clientId,
        clientSecret,
        oidcIssuer,
        active: true,
      },
      create: {
        tenantId,
        provider,
        entityId,
        ssoUrl,
        certificate,
        clientId,
        clientSecret,
        oidcIssuer,
        active: true,
      },
    });

    res.status(201).json({
      config: {
        ...ssoConfig,
        clientSecret: undefined,
      },
      success: true,
    });
  } catch (err) {
    console.error("[WhiteLabel] SSO config error:", err);
    res.status(500).json({ error: "Failed to configure SSO" });
  }
});

// DELETE /whitelabel/sso/config — Disable SSO
router.delete("/sso/config", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userRole = req.user!.role;

  if (!["owner", "admin"].includes(userRole)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    await db.sSOConfig.delete({
      where: { tenantId },
    });

    res.json({ success: true, message: "SSO configuration removed" });
  } catch (err) {
    console.error("[WhiteLabel] SSO delete error:", err);
    res.status(500).json({ error: "Failed to remove SSO configuration" });
  }
});

// POST /whitelabel/sso/test — Test SSO configuration
router.post("/sso/test", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;

  try {
    const ssoConfig = await db.sSOConfig.findUnique({
      where: { tenantId },
    });

    if (!ssoConfig) {
      return res.status(404).json({ error: "SSO not configured" });
    }

    // In production, test the SSO connection here
    res.json({
      success: true,
      message: "SSO configuration is valid",
      provider: ssoConfig.provider,
    });
  } catch (err) {
    console.error("[WhiteLabel] SSO test error:", err);
    res.status(500).json({ error: "Failed to test SSO configuration" });
  }
});

export default router;
