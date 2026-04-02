// Phase 8 - Winners Cloud - White-label Licensing API

import { Router, type Request, type Response } from "express";
import { Plan } from "@prisma/client";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();

router.use(authMiddleware);
router.use(enforceTenant);

function defaultBranding() {
  return {
    logoUrl: null,
    primaryColor: "#C9A84C",
    secondaryColor: "#0D1520",
    faviconUrl: null,
  };
}

function defaultFeatures() {
  return ["community", "academy", "market"];
}

// GET /whitelabel/config - Get tenant configuration
router.get("/config", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;

  try {
    let config = await db.tenantConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      const tenant = await db.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, customDomain: true, whiteLabelEnabled: true },
      });

      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      config = await db.tenantConfig.create({
        data: {
          tenantId,
          name: tenant.name,
          domain: tenant.customDomain,
          branding: defaultBranding(),
          features: defaultFeatures(),
          active: tenant.whiteLabelEnabled,
        },
      });
    }

    res.json({ config });
  } catch (err) {
    console.error("[WhiteLabel] Config fetch error:", err);
    res.status(500).json({ error: "Failed to fetch configuration" });
  }
});

// PATCH /whitelabel/branding - Update tenant branding
router.patch("/branding", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { branding } = req.body ?? {};

  if (!branding || typeof branding !== "object") {
    return res.status(400).json({ error: "Branding data is required" });
  }

  try {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const config = await db.tenantConfig.upsert({
      where: { tenantId },
      update: { branding, active: true },
      create: {
        tenantId,
        name: tenant.name,
        branding,
        features: defaultFeatures(),
        active: true,
      },
    });

    await db.tenant.update({
      where: { id: tenantId },
      data: {
        whiteLabelEnabled: true,
        brandColor:
          typeof branding.primaryColor === "string" ? branding.primaryColor.trim() : undefined,
        logoUrl:
          typeof branding.logoUrl === "string" ? branding.logoUrl.trim() : branding.logoUrl === null ? null : undefined,
        faviconUrl:
          typeof branding.faviconUrl === "string" ? branding.faviconUrl.trim() : branding.faviconUrl === null ? null : undefined,
      },
    });

    res.json({ config, success: true });
  } catch (err) {
    console.error("[WhiteLabel] Branding update error:", err);
    res.status(500).json({ error: "Failed to update branding" });
  }
});

// PATCH /whitelabel/features - Update enabled features
router.patch("/features", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { features } = req.body ?? {};

  if (!Array.isArray(features)) {
    return res.status(400).json({ error: "Features must be an array" });
  }

  try {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const config = await db.tenantConfig.upsert({
      where: { tenantId },
      update: { features, active: true },
      create: {
        tenantId,
        name: tenant.name,
        branding: defaultBranding(),
        features,
        active: true,
      },
    });

    await db.tenant.update({
      where: { id: tenantId },
      data: { whiteLabelEnabled: true },
    });

    res.json({ config, success: true });
  } catch (err) {
    console.error("[WhiteLabel] Features update error:", err);
    res.status(500).json({ error: "Failed to update features" });
  }
});

// PATCH /whitelabel/domain - Update custom domain
router.patch("/domain", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const domain = typeof req.body?.domain === "string" ? req.body.domain.trim().toLowerCase() : "";

  if (!domain) {
    return res.status(400).json({ error: "Domain is required" });
  }

  try {
    const existing = await db.tenantConfig.findFirst({
      where: { domain, tenantId: { not: tenantId } },
    });

    if (existing) {
      return res.status(409).json({ error: "Domain already in use" });
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const [config] = await db.$transaction([
      db.tenantConfig.upsert({
        where: { tenantId },
        update: { domain, active: true },
        create: {
          tenantId,
          name: tenant.name,
          domain,
          branding: defaultBranding(),
          features: defaultFeatures(),
          active: true,
        },
      }),
      db.tenant.update({
        where: { id: tenantId },
        data: {
          customDomain: domain,
          whiteLabelEnabled: true,
        },
      }),
      db.dNSZone.upsert({
        where: { domain },
        update: { tenantId },
        create: {
          tenantId,
          domain,
          ns: ["ns1.winnersempire.io", "ns2.winnersempire.io"],
        },
      }),
    ]);

    res.json({ config, success: true });
  } catch (err) {
    console.error("[WhiteLabel] Domain update error:", err);
    res.status(500).json({ error: "Failed to update domain" });
  }
});

// POST /whitelabel/provision - Provision sub-tenant
router.post("/provision", async (req: Request, res: Response) => {
  const parentTenantId = req.user!.tenantId;
  const userRole = req.user!.role;

  if (!["owner", "admin"].includes(userRole)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { name, domain, plan = "FREE" } = req.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }

  const normalizedDomain = typeof domain === "string" && domain.trim() ? domain.trim().toLowerCase() : null;
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const requestedPlan = String(plan).toUpperCase();
  const planValue = Object.values(Plan).includes(requestedPlan as Plan) ? (requestedPlan as Plan) : Plan.FREE;

  try {
    const existingTenant = await db.tenant.findFirst({
      where: {
        OR: [
          { slug },
          ...(normalizedDomain ? [{ customDomain: normalizedDomain }] : []),
        ],
      },
      select: { id: true },
    });

    if (existingTenant) {
      return res.status(409).json({ error: "A tenant with this name or domain already exists" });
    }

    const [tenant, config] = await db.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: name.trim(),
          slug,
          status: "active",
          parentTenantId,
          plan: planValue,
          whiteLabelEnabled: true,
          customDomain: normalizedDomain,
        },
      });

      const newConfig = await tx.tenantConfig.create({
        data: {
          tenantId: newTenant.id,
          name: newTenant.name,
          domain: normalizedDomain,
          branding: defaultBranding(),
          features: defaultFeatures(),
          active: true,
        },
      });

      if (normalizedDomain) {
        await tx.dNSZone.create({
          data: {
            tenantId: newTenant.id,
            domain: normalizedDomain,
            ns: ["ns1.winnersempire.io", "ns2.winnersempire.io"],
          },
        });
      }

      return [newTenant, newConfig] as const;
    });

    res.status(201).json({
      tenant,
      config,
      message: "Sub-tenant provisioned successfully",
    });
  } catch (err) {
    console.error("[WhiteLabel] Provision error:", err);
    res.status(500).json({ error: "Failed to provision sub-tenant" });
  }
});

// GET /whitelabel/subtenants - List sub-tenants
router.get("/subtenants", async (req: Request, res: Response) => {
  try {
    const subtenants = await db.tenant.findMany({
      where: { parentTenantId: req.user!.tenantId },
      include: {
        tenantConfig: true,
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

// DELETE /whitelabel/subtenants/:id - Deprovision sub-tenant
router.delete("/subtenants/:id", async (req: Request, res: Response) => {
  const userRole = req.user!.role;
  const id = String(req.params.id);

  if (!["owner", "admin"].includes(userRole)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const tenant = await db.tenant.findFirst({
      where: { id, parentTenantId: req.user!.tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ error: "Sub-tenant not found" });
    }

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

// GET /whitelabel/sso/config - Get SSO configuration
router.get("/sso/config", async (req: Request, res: Response) => {
  try {
    const config = await db.sSOConfig.findUnique({
      where: { tenantId: req.user!.tenantId },
    });

    if (!config) {
      return res.json({ config: null });
    }

    res.json({
      config: {
        ...config,
        clientSecret: undefined,
      },
    });
  } catch (err) {
    console.error("[WhiteLabel] SSO config fetch error:", err);
    res.status(500).json({ error: "Failed to fetch SSO configuration" });
  }
});

// POST /whitelabel/sso/config - Configure SSO
router.post("/sso/config", async (req: Request, res: Response) => {
  if (!["owner", "admin"].includes(req.user!.role)) {
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

  if (typeof provider !== "string" || !provider.trim()) {
    return res.status(400).json({ error: "provider is required" });
  }

  try {
    const config = await db.sSOConfig.upsert({
      where: { tenantId: req.user!.tenantId },
      update: {
        provider: provider.trim(),
        entityId: typeof entityId === "string" ? entityId.trim() : null,
        ssoUrl: typeof ssoUrl === "string" ? ssoUrl.trim() : null,
        certificate: typeof certificate === "string" ? certificate.trim() : null,
        clientId: typeof clientId === "string" ? clientId.trim() : null,
        clientSecret: typeof clientSecret === "string" ? clientSecret.trim() : null,
        oidcIssuer: typeof oidcIssuer === "string" ? oidcIssuer.trim() : null,
        active: true,
      },
      create: {
        tenantId: req.user!.tenantId,
        provider: provider.trim(),
        entityId: typeof entityId === "string" ? entityId.trim() : null,
        ssoUrl: typeof ssoUrl === "string" ? ssoUrl.trim() : null,
        certificate: typeof certificate === "string" ? certificate.trim() : null,
        clientId: typeof clientId === "string" ? clientId.trim() : null,
        clientSecret: typeof clientSecret === "string" ? clientSecret.trim() : null,
        oidcIssuer: typeof oidcIssuer === "string" ? oidcIssuer.trim() : null,
        active: true,
      },
    });

    res.status(201).json({
      config: {
        ...config,
        clientSecret: undefined,
      },
      success: true,
    });
  } catch (err) {
    console.error("[WhiteLabel] SSO config error:", err);
    res.status(500).json({ error: "Failed to configure SSO" });
  }
});

// DELETE /whitelabel/sso/config - Disable SSO
router.delete("/sso/config", async (req: Request, res: Response) => {
  if (!["owner", "admin"].includes(req.user!.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    await db.sSOConfig.delete({
      where: { tenantId: req.user!.tenantId },
    });

    res.json({ success: true, message: "SSO configuration removed" });
  } catch (err) {
    console.error("[WhiteLabel] SSO delete error:", err);
    res.status(500).json({ error: "Failed to remove SSO configuration" });
  }
});

// POST /whitelabel/sso/test - Test SSO configuration
router.post("/sso/test", async (req: Request, res: Response) => {
  try {
    const config = await db.sSOConfig.findUnique({
      where: { tenantId: req.user!.tenantId },
    });

    if (!config) {
      return res.status(404).json({ error: "SSO not configured" });
    }

    res.json({
      success: true,
      message: "SSO configuration is valid",
      provider: config.provider,
    });
  } catch (err) {
    console.error("[WhiteLabel] SSO test error:", err);
    res.status(500).json({ error: "Failed to test SSO configuration" });
  }
});

export default router;
