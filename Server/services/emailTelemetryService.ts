import type { Prisma } from "@prisma/client";
import db from "../db.js";

type EmailTelemetryInput = {
  tenantId: string;
  action: string;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  recipients: string[];
  source: string;
  metadata?: Record<string, unknown>;
};

export async function logEmailDelivery(input: EmailTelemetryInput): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId ?? null,
        userEmail: input.userEmail ?? null,
        userName: input.userName ?? null,
        action: input.action,
        category: "email",
        metadata: {
          source: input.source,
          recipients: input.recipients,
          recipientCount: input.recipients.length,
          ...(input.metadata ?? {}),
        } as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    console.error("[emailTelemetry] Failed to log email delivery:", error);
  }
}
