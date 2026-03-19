import type { JwtPayload } from "../middleware/authMiddleware.js";
import { isSuperAdminEmail } from "../middleware/superAdminMiddleware.js";
import db from "../db.js";
import { AppRegistry } from "./appRegistry.js";

export type LayerAccessCode =
  | "layer_live"
  | "layer_not_live"
  | "cloud_upgrade_required"
  | "superadmin_preview";

export interface LayerAccessResult {
  layerId: string;
  layerName: string;
  status: string;
  allowed: boolean;
  visible: boolean;
  bypass: boolean;
  code: LayerAccessCode;
  message: string;
  upgradePlan?: "PRO" | "ENTERPRISE";
  tenantPlan?: "FREE" | "PRO" | "ENTERPRISE";
}

async function getTenantPlan(tenantId: string) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  return tenant?.plan ?? "FREE";
}

function canPreviewAsSuperAdmin(user: JwtPayload | undefined) {
  return Boolean(user && !user.isImpersonation && isSuperAdminEmail(user.email));
}

export async function getLayerAccessForUser(layerId: string, user: JwtPayload | undefined): Promise<LayerAccessResult | null> {
  const layer = AppRegistry.get(layerId);
  if (!layer) return null;

  if (canPreviewAsSuperAdmin(user)) {
    return {
      layerId,
      layerName: layer.name,
      status: layer.status,
      allowed: true,
      visible: true,
      bypass: true,
      code: "superadmin_preview",
      message: `${layer.name} is in admin preview mode for your superadmin session.`,
    };
  }

  const isLive = layer.status === "live";
  if (layerId === "cloud") {
    const tenantPlan = user?.tenantId ? await getTenantPlan(user.tenantId) : "FREE";
    if (!isLive) {
      return {
        layerId,
        layerName: layer.name,
        status: layer.status,
        allowed: false,
        visible: true,
        bypass: false,
        code: "layer_not_live",
        tenantPlan,
        message: "Winners Cloud is not live yet. Only the admin panel can authorize this launch.",
      };
    }

    if (!["PRO", "ENTERPRISE"].includes(tenantPlan)) {
      return {
        layerId,
        layerName: layer.name,
        status: layer.status,
        allowed: false,
        visible: true,
        bypass: false,
        code: "cloud_upgrade_required",
        tenantPlan,
        upgradePlan: "PRO",
        message: "Winners Cloud is visible on FREE, but access is locked until this workspace upgrades to PRO or ENTERPRISE.",
      };
    }

    return {
      layerId,
      layerName: layer.name,
      status: layer.status,
      allowed: true,
      visible: true,
      bypass: false,
      code: "layer_live",
      tenantPlan,
      message: "Winners Cloud is live for this workspace.",
    };
  }

  return {
    layerId,
    layerName: layer.name,
    status: layer.status,
    allowed: isLive,
    visible: isLive,
    bypass: false,
    code: isLive ? "layer_live" : "layer_not_live",
    message: isLive
      ? `${layer.name} is live for this workspace.`
      : `${layer.name} is still locked. Only admin launch from /admin/platform can make it live.`,
  };
}
