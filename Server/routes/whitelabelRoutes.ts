// Server/routes/whitelabelRoutes.ts
// Phase 1 - Core Engine
// White-label licensing: custom branding, custom domains, white-label features

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";
import { Plan } from "@prisma/client";

const router = Router();

// GET /whitelabel - Get white-label configuration
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    
    const tenant = await db.tenant.findFirst({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        whiteLabelEnabled: true,
        customDomain: true,
        brandColor: true,
        logoUrl: true,
        faviconUrl: true,
      },
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    res.json(tenant);
  } catch (error) {
    console.error("White-label get error:", error);
    res.status(500).json({ message: "Failed to get white-label config" });
  }
});

// PUT /whitelabel - Update white-label configuration
router.put("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { 
      whiteLabelEnabled, 
      customDomain, 
      brandColor, 
      logoUrl, 
      faviconUrl,
      supportEmail,
      privacyPolicyUrl,
      termsOfServiceUrl,
    } = req.body;

    // Check if user has permission (owner or admin)
    if (!["owner", "admin"].includes(req.user!.role)) {
      return res.status(403).json({ message: "Only owners/admins can configure white-label" });
    }

    // Verify plan includes white-label (if enabling)
    if (whiteLabelEnabled) {
      const tenant = await db.tenant.findFirst({
        where: { id: tenantId },
        select: { plan: true },
      });

      if (tenant?.plan !== Plan.ENTERPRISE) {
        return res.status(403).json({ 
          message: "White-label requires Enterprise plan",
          currentPlan: tenant?.plan,
          requiredPlan: "ENTERPRISE",
        });
      }
    }

    const updated = await db.tenant.update({
      where: { id: tenantId },
      data: {
        whiteLabelEnabled: whiteLabelEnabled ?? undefined,
        customDomain: customDomain ?? undefined,
        brandColor: brandColor ?? undefined,
        logoUrl: logoUrl ?? undefined,
        faviconUrl: faviconUrl ?? undefined,
      },
    });

    res.json({
      message: "White-label configuration updated",
      whiteLabelEnabled: updated.whiteLabelEnabled,
      customDomain: updated.customDomain,
    });
  } catch (error) {
    console.error("White-label update error:", error);
    res.status(500).json({ message: "Failed to update white-label config" });
  }
});

// POST /whitelabel/verify-domain - Verify custom domain ownership
router.post("/verify-domain", authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ message: "Domain is required" });
    }

    // Generate verification token
    const verificationToken = `winners-verification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // In production, would create DNS TXT record for domain verification
    // For now, return instructions
    res.json({
      domain,
      verificationToken,
      instructions: [
        `Add a TXT record to your DNS configuration:`,
        `Name: @`,
        `Type: TXT`,
        `Value: ${verificationToken}`,
      ],
      nextStep: "Verify domain ownership after DNS propagation",
    });
  } catch (error) {
    console.error("Domain verification error:", error);
    res.status(500).json({ message: "Failed to verify domain" });
  }
});

// GET /whitelabel/plans - Get available white-label plans
router.get("/plans", (_req: Request, res: Response) => {
  res.json({
    plans: [
      {
        id: "starter",
        name: "White-label Starter",
        price: 49,
        features: [
          "Custom logo",
          "Brand colors",
          "Basic support",
        ],
      },
      {
        id: "professional",
        name: "White-label Professional",
        price: 99,
        features: [
          "Everything in Starter",
          "Custom domain",
          "Priority support",
          "API access",
        ],
      },
      {
        id: "enterprise",
        name: "White-label Enterprise",
        price: 299,
        features: [
          "Everything in Professional",
          "Multiple subdomains",
          "Dedicated support",
          "Custom contracts",
          "SLA guarantee",
        ],
      },
    ],
  });
});

// POST /whitelabel/deactivate - Deactivate white-label
router.post("/deactivate", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!["owner", "admin"].includes(req.user!.role)) {
      return res.status(403).json({ message: "Only owners can deactivate white-label" });
    }

    const tenantId = req.user!.tenantId;

    await db.tenant.update({
      where: { id: tenantId },
      data: {
        whiteLabelEnabled: false,
        customDomain: null,
      },
    });

    res.json({ message: "White-label deactivated" });
  } catch (error) {
    console.error("White-label deactivate error:", error);
    res.status(500).json({ message: "Failed to deactivate white-label" });
  }
});

export default router;