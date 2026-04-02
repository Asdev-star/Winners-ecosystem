import { NotificationType } from "@prisma/client";
import { Router, type Request, type Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";
import {
  deactivateDeviceToken,
  registerDeviceToken,
  sendPushNotification,
} from "../services/fcmService.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

type ClientNotificationType = "anomaly" | "team" | "billing" | "system" | "revenue";

const notificationTypeMap: Record<NotificationType, ClientNotificationType> = {
  LIKE: "team",
  COMMENT: "team",
  FOLLOW: "team",
  MENTION: "team",
  SKILL_DETECTED: "system",
  OPPORTUNITY_MATCH: "revenue",
  TRUST_SCORE_UPDATE: "system",
  CHALLENGE_COMPLETE: "system",
  LOOP_ADVANCE: "system",
  SYSTEM: "system",
};

const requestTypeMap: Record<string, NotificationType> = {
  anomaly: NotificationType.SYSTEM,
  billing: NotificationType.SYSTEM,
  comment: NotificationType.COMMENT,
  follow: NotificationType.FOLLOW,
  like: NotificationType.LIKE,
  mention: NotificationType.MENTION,
  opportunity_match: NotificationType.OPPORTUNITY_MATCH,
  revenue: NotificationType.OPPORTUNITY_MATCH,
  skill_detected: NotificationType.SKILL_DETECTED,
  system: NotificationType.SYSTEM,
  team: NotificationType.MENTION,
  trust_score_update: NotificationType.TRUST_SCORE_UPDATE,
};

function toClientNotification(notification: {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  link: string | null;
}) {
  return {
    id: notification.id,
    type: notificationTypeMap[notification.type] ?? "system",
    title: notification.title,
    body: notification.body,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
    link: notification.link ?? undefined,
  };
}

function resolveNotificationType(value: unknown): NotificationType {
  if (typeof value !== "string") {
    return NotificationType.SYSTEM;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return NotificationType.SYSTEM;
  }

  if (normalized in requestTypeMap) {
    return requestTypeMap[normalized];
  }

  const enumKey = normalized.toUpperCase() as keyof typeof NotificationType;
  return NotificationType[enumKey] ?? NotificationType.SYSTEM;
}

function sanitizePreferencePatch(input: Record<string, unknown>) {
  const allowedKeys = [
    "enabled",
    "communityPosts",
    "communityLikes",
    "communityComments",
    "academyEnrollment",
    "academyCertificate",
    "marketOrderUpdate",
    "workApplication",
    "workContractUpdate",
    "trustScoreChange",
    "systemAnnouncements",
  ] as const;

  const nextPatch: Partial<Record<(typeof allowedKeys)[number], boolean>> = {};

  for (const key of allowedKeys) {
    if (typeof input[key] === "boolean") {
      nextPatch[key] = input[key] as boolean;
    }
  }

  return nextPatch;
}

router.get("/", async (req: Request, res: Response) => {
  const { userId, tenantId } = req.user!;

  try {
    const notifications = await db.notification.findMany({
      where: { userId, tenantId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const payload = notifications.map(toClientNotification);

    return res.json({
      notifications: payload,
      total: payload.length,
      unread: payload.filter((notification) => !notification.read).length,
    });
  } catch (error) {
    console.error("[notifications] Fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.post("/device-token", async (req: Request, res: Response) => {
  const { token, platform, userAgent } = req.body ?? {};
  const { userId, tenantId } = req.user!;

  if (typeof token !== "string" || !token.trim()) {
    return res.status(400).json({ error: "Token required" });
  }

  try {
    const userAgentHeader = req.headers["user-agent"];
    const requestUserAgent = Array.isArray(userAgentHeader)
      ? userAgentHeader.join("; ")
      : userAgentHeader || undefined;

    await registerDeviceToken(
      userId,
      tenantId,
      token.trim(),
      typeof platform === "string" && platform.trim() ? platform.trim() : "web",
      typeof userAgent === "string" && userAgent.trim() ? userAgent.trim() : requestUserAgent,
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("[notifications] Device token registration error:", error);
    return res.status(500).json({ error: "Failed to register notification token" });
  }
});

router.delete("/device-token", async (req: Request, res: Response) => {
  const { token } = req.body ?? {};

  if (typeof token !== "string" || !token.trim()) {
    return res.status(400).json({ error: "Token required" });
  }

  try {
    await deactivateDeviceToken(token.trim());
    return res.json({ success: true });
  } catch (error) {
    console.error("[notifications] Device token deactivation error:", error);
    return res.status(500).json({ error: "Failed to unregister notification token" });
  }
});

router.patch("/:id/read", async (req: Request, res: Response) => {
  const { userId, tenantId } = req.user!;
  const notificationId = String(req.params.id ?? "");

  try {
    await db.notification.updateMany({
      where: { id: notificationId, userId, tenantId },
      data: { read: true },
    });

    return res.json({ message: "Marked as read" });
  } catch (error) {
    console.error("[notifications] Mark read error:", error);
    return res.status(500).json({ error: "Failed to update notification" });
  }
});

router.patch("/read-all", async (req: Request, res: Response) => {
  const { userId, tenantId } = req.user!;

  try {
    await db.notification.updateMany({
      where: { userId, tenantId, read: false },
      data: { read: true },
    });

    return res.json({ message: "All marked as read" });
  } catch (error) {
    console.error("[notifications] Read-all error:", error);
    return res.status(500).json({ error: "Failed to update notifications" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { userId, tenantId } = req.user!;
  const notificationId = String(req.params.id ?? "");

  try {
    await db.notification.deleteMany({
      where: { id: notificationId, userId, tenantId },
    });

    return res.json({ message: "Deleted" });
  } catch (error) {
    console.error("[notifications] Delete error:", error);
    return res.status(500).json({ error: "Failed to delete notification" });
  }
});

router.delete("/", async (req: Request, res: Response) => {
  const { userId, tenantId } = req.user!;

  try {
    await db.notification.deleteMany({
      where: { userId, tenantId },
    });

    return res.json({ message: "All cleared" });
  } catch (error) {
    console.error("[notifications] Clear-all error:", error);
    return res.status(500).json({ error: "Failed to clear notifications" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const { userId: currentUserId, tenantId } = req.user!;
  const { title, body, link, type, userId, entityId, entityType, actorId, sendPush } = req.body ?? {};

  if (typeof title !== "string" || !title.trim() || typeof body !== "string" || !body.trim()) {
    return res.status(400).json({ error: "title and body are required" });
  }

  const targetUserId = typeof userId === "string" && userId.trim() ? userId.trim() : currentUserId;

  try {
    const notification = await db.notification.create({
      data: {
        tenantId,
        userId: targetUserId,
        actorId: typeof actorId === "string" && actorId.trim() ? actorId.trim() : null,
        type: resolveNotificationType(type),
        title: title.trim(),
        body: body.trim(),
        link: typeof link === "string" && link.trim() ? link.trim() : null,
        entityId: typeof entityId === "string" && entityId.trim() ? entityId.trim() : null,
        entityType: typeof entityType === "string" && entityType.trim() ? entityType.trim() : null,
      },
    });

    if (sendPush !== false) {
      await sendPushNotification(targetUserId, {
        title: notification.title,
        body: notification.body,
        url: notification.link ?? "/notifications",
        data: {
          notificationId: notification.id,
          type: notification.type,
        },
        priority: "high",
      });
    }

    return res.status(201).json(toClientNotification(notification));
  } catch (error) {
    console.error("[notifications] Create error:", error);
    return res.status(500).json({ error: "Failed to create notification" });
  }
});

router.get("/preferences", async (req: Request, res: Response) => {
  const { userId } = req.user!;

  try {
    const preferences = await db.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    return res.json({ preferences });
  } catch (error) {
    console.error("[notifications] Preference fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

router.patch("/preferences", async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const patch = sanitizePreferencePatch(req.body ?? {});

  try {
    const preferences = await db.notificationPreference.upsert({
      where: { userId },
      update: patch,
      create: {
        userId,
        ...patch,
      },
    });

    return res.json({ success: true, preferences });
  } catch (error) {
    console.error("[notifications] Preference update error:", error);
    return res.status(500).json({ error: "Failed to update preferences" });
  }
});

router.post("/push/test", async (req: Request, res: Response) => {
  const { userId, tenantId } = req.user!;

  try {
    const notification = await db.notification.create({
      data: {
        tenantId,
        userId,
        type: NotificationType.SYSTEM,
        title: "Test notification",
        body: "Firebase push notifications are active for this device.",
        link: "/notifications",
        entityType: "push_test",
      },
    });

    await sendPushNotification(userId, {
      title: notification.title,
      body: notification.body,
      url: notification.link ?? "/notifications",
      data: {
        notificationId: notification.id,
        type: notification.type,
      },
      priority: "high",
    });

    return res.json({
      success: true,
      notification: toClientNotification(notification),
    });
  } catch (error) {
    console.error("[notifications] Push test error:", error);
    return res.status(500).json({ error: "Failed to send test notification" });
  }
});

export default router;
