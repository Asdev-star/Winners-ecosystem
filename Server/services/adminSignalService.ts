import { randomUUID } from "crypto";
import { emitAdminEvent } from "./adminEventService.js";
import { broadcastToAdmins } from "./wsService.js";

export type AdminSignalKind =
  | "nova:skill_detected"
  | "sage:cert_issued"
  | "circuit:match_fired"
  | "atlas:vendor_applied";

export interface AdminSignalEvent {
  id: string;
  kind: AdminSignalKind;
  supervisor: "NOVA" | "SAGE" | "CIRCUIT" | "ATLAS";
  supervisorEmoji: string;
  layerId: string;
  layerName: string;
  adminPath: string;
  title: string;
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

const MAX_SIGNAL_HISTORY = 24;
const signalHistory: AdminSignalEvent[] = [];

export function recordAdminSignal(
  input: Omit<AdminSignalEvent, "id" | "createdAt"> & { createdAt?: string },
): AdminSignalEvent {
  const event: AdminSignalEvent = {
    id: randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    ...input,
  };

  signalHistory.unshift(event);
  if (signalHistory.length > MAX_SIGNAL_HISTORY) {
    signalHistory.length = MAX_SIGNAL_HISTORY;
  }

  broadcastToAdmins({
    event: "admin:ecosystem-signal",
    room: "admin:ecosystem-signals",
    signal: event,
  });

  emitAdminEvent({
    type: "forge_alert",
    urgency: "warning",
    message: `${event.supervisor} ${event.title}`,
    link: event.adminPath,
    timestamp: event.createdAt,
  });

  return event;
}

export function getRecentAdminSignals(limit = 5): AdminSignalEvent[] {
  return signalHistory.slice(0, Math.max(0, limit));
}
