import type { Prisma } from "@prisma/client";
import db from "../db.js";
import { AppRegistry, type AppStatus } from "./appRegistry.js";

type PlatformLayerStatusRecordInput = {
  layerId: string;
  layerName: string;
  status: AppStatus;
  actorUserId?: string | null;
  actorEmail?: string | null;
  confirmationText?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function recordPlatformLayerStatus(input: PlatformLayerStatusRecordInput) {
  return db.platformLayerStatus.create({
    data: {
      layerId: input.layerId,
      layerName: input.layerName,
      status: input.status,
      actorUserId: input.actorUserId ?? null,
      actorEmail: input.actorEmail ?? null,
      confirmationText: input.confirmationText ?? null,
      summary: input.summary ?? null,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function syncAppRegistryWithPersistedLayerStatus() {
  try {
    const history = await db.platformLayerStatus.findMany({
      orderBy: [{ createdAt: "desc" }],
    });

    const latestByLayer = new Map<string, (typeof history)[number]>();
    for (const entry of history) {
      if (!latestByLayer.has(entry.layerId)) {
        latestByLayer.set(entry.layerId, entry);
      }
    }

    for (const [layerId, entry] of latestByLayer.entries()) {
      AppRegistry.update(layerId, { status: entry.status as AppStatus });
    }
  } catch (error) {
    console.warn("[platformLayerStatus] Persisted status sync skipped:", error);
  }
}
