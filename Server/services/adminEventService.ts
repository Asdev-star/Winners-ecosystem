import { broadcastToAdmins } from "./wsService.js";

export type AdminEventType =
  | "user_signup"
  | "layer_health_change"
  | "loop_completed"
  | "revenue_spike"
  | "user_flagged"
  | "plan_upgraded"
  | "escrow_dispute"
  | "ai_credit_exhausted"
  | "forge_alert";

export type AdminEventUrgency = "info" | "warning" | "critical";

export interface AdminEvent {
  type: AdminEventType;
  urgency: AdminEventUrgency;
  message: string;
  link?: string;
  timestamp: string;
}

export function emitAdminEvent(
  input: Omit<AdminEvent, "timestamp"> & { timestamp?: string | Date },
): AdminEvent {
  const adminEvent: AdminEvent = {
    ...input,
    timestamp:
      input.timestamp instanceof Date
        ? input.timestamp.toISOString()
        : input.timestamp ?? new Date().toISOString(),
  };

  broadcastToAdmins({
    event: "admin:event",
    room: "admin:events",
    adminEvent,
  });

  return adminEvent;
}
