// Server/services/activityService.ts

import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import db from "../db.js";

export type ActivityCategory =
  | "auth"
  | "team"
  | "billing"
  | "export"
  | "settings"
  | "stripe";

export interface LogActivityParams {
  tenantId:  string;
  userId?:   string;
  userEmail?: string;
  userName?: string;
  action:    string;
  category:  ActivityCategory;
  metadata?: Record<string, unknown>;
  ip?:       string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        id:        randomUUID(),
        tenantId:  params.tenantId,
        userId:    params.userId ?? null,
        userEmail: params.userEmail ?? null,
        userName:  params.userName ?? null,
        action:    params.action,
        category:  params.category,
        metadata:  (params.metadata ?? null) as Prisma.InputJsonValue | null,
        ip:        params.ip ?? null,
      },
    });
  } catch (err) {
    // Never crash the main request if logging fails
    console.error("Activity log error:", err);
  }
}

export const ACTIONS = {
  // Auth
  LOGIN:           "User logged in",
  LOGOUT:          "User logged out",
  PASSWORD_RESET:  "Password reset",
  GOOGLE_LOGIN:    "Signed in with Google",

  // Team
  MEMBER_INVITED:  "Team member invited",
  MEMBER_REMOVED:  "Team member removed",
  ROLE_CHANGED:    "Member role changed",

  // Billing
  PLAN_UPGRADED:   "Plan upgraded",
  PLAN_CANCELLED:  "Plan cancelled",
  PAYMENT_SUCCESS: "Payment succeeded",

  // Export
  DATA_EXPORTED:   "Data exported",

  // Settings
  SETTINGS_UPDATED: "Workspace settings updated",
  WORKSPACE_RENAMED: "Workspace renamed",

  // Stripe
  STRIPE_SYNCED:   "Stripe revenue synced",
  CHECKOUT_STARTED: "Checkout started",
} as const;
