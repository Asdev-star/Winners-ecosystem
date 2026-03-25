import db from "../db.js";

type AdminActor = {
  userId: string;
  tenantId: string;
  email: string;
};

interface RecordAdminActionInput {
  actor: AdminActor;
  action: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

export async function recordAdminAction(input: RecordAdminActionInput): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        tenantId: input.actor.tenantId,
        userId: input.actor.userId,
        userEmail: input.actor.email,
        userName: input.actor.email,
        action: input.action,
        category: "admin",
        metadata: {
          summary: input.summary,
          ...(input.metadata ?? {}),
        },
      },
    });
  } catch (error) {
    console.error("[adminAudit] Failed to record admin action:", error);
  }
}

