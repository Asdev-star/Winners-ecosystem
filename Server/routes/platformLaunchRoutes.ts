import { NotificationType } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { superAdminMiddleware } from "../middleware/superAdminMiddleware.js";
import prisma from "../db.js";
import { recordAdminAction } from "../services/adminAuditService.js";
import { AppRegistry } from "../services/appRegistry.js";
import { getPlatformChecklist, getPlatformLaunchControlSnapshot } from "../services/platformLaunchControlService.js";

const router = Router();

const LAUNCH_MESSAGES: Record<string, string> = {
  market: "Winners Market is live. Explore products, launch your store, or find your first vendor.",
  work: "Winners Work is live. CIRCUIT has scored the open jobs against Academy progress.",
  mobile: "The Winners Ecosystem is now installable on your device.",
  cloud: "Winners Cloud is live. Your API key and connector surface are ready.",
};

const notifySlack = async (message: string) => {
  console.log(`SLACK: ${message}`);
};

const sendBroadcastNotification = async (notification: { title: string; body: string; type: string }) => {
  console.log(`BROADCAST: ${notification.title} (${notification.type})`);
};

router.use(authMiddleware, superAdminMiddleware);

router.get("/status", async (_req, res) => {
  const layers = AppRegistry.list();
  const health = { api: "OK", db: "OK", aiPlatform: "OK", redis: "OK", email: "OK" };
  const control = await getPlatformLaunchControlSnapshot();
  res.json({ layers, health, control });
});

router.post("/:layerId/checklist", async (req, res) => {
  const checklist = getPlatformChecklist(req.params.layerId);
  if (!checklist) {
    return res.status(404).json({ error: "Layer not found" });
  }

  return res.json(checklist);
});

router.post("/:layerId/launch", async (req, res) => {
  const { layerId } = req.params;
  const { override } = req.body as { override?: boolean };

  const layer = AppRegistry.get(layerId);
  if (!layer) {
    return res.status(404).json({ error: "Layer not found" });
  }

  if (layer.status === "live") {
    return res.status(400).json({ error: `${layer.name} is already live.` });
  }

  const { ready, missing } = AppRegistry.checkDependencies(layerId);
  if (!ready && !override) {
    return res.status(400).json({
      error: "Dependencies not met",
      missing,
      message: `Cannot launch ${layer.name} until these layers are live: ${missing.join(", ")}`,
    });
  }

  AppRegistry.update(layerId, { status: "live" });

  const activeUsers = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, tenantId: true },
  });

  await Promise.all(
    activeUsers.map((user) =>
      prisma.notification.create({
        data: {
          userId: user.id,
          tenantId: user.tenantId,
          type: NotificationType.SYSTEM,
          title: `${layer.name} is now live`,
          body: LAUNCH_MESSAGES[layerId] ?? `${layer.name} is now available in your ecosystem.`,
          link: layer.frontendPath,
        },
      }),
    ),
  );

  await notifySlack(`${layer.name} launched by ${req.user!.email}. ${activeUsers.length} users notified.`);

  await recordAdminAction({
    actor: {
      userId: req.user!.userId,
      tenantId: req.user!.tenantId,
      email: req.user!.email,
    },
    action: "ADMIN_LAYER_LAUNCHED",
    summary: `Launched ${layer.name}`,
    metadata: {
      layerId,
      usersNotified: activeUsers.length,
    },
  });

  return res.json({
    success: true,
    layer: AppRegistry.get(layerId),
    usersNotified: activeUsers.length,
  });
});

router.post("/:layerId/suspend", async (req, res) => {
  const { layerId } = req.params;
  const { reason } = req.body as { reason?: string };

  const layer = AppRegistry.get(layerId);
  if (!layer) {
    return res.status(404).json({ error: "Layer not found" });
  }

  if (layer.status !== "live") {
    return res.status(400).json({ error: `${layer.name} is not live and cannot be suspended.` });
  }

  AppRegistry.update(layerId, { status: "suspended" });

  await sendBroadcastNotification({
    title: `${layer.name} temporarily unavailable`,
    body: reason?.trim()
      ? `${layer.name} is temporarily unavailable: ${reason.trim()}`
      : `We are making improvements. ${layer.name} will be back shortly.`,
    type: "platform_maintenance",
  });

  await recordAdminAction({
    actor: {
      userId: req.user!.userId,
      tenantId: req.user!.tenantId,
      email: req.user!.email,
    },
    action: "ADMIN_LAYER_SUSPENDED",
    summary: `Suspended ${layer.name}`,
    metadata: {
      layerId,
      reason: reason ?? null,
    },
  });

  return res.json({ success: true, message: `${layer.name} has been suspended.` });
});

export default router;
