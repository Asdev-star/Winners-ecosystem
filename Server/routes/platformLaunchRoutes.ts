import { NotificationType } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { superAdminMiddleware } from "../middleware/superAdminMiddleware.js";
import prisma from "../db.js";
import { recordAdminAction } from "../services/adminAuditService.js";
import { emitAdminEvent } from "../services/adminEventService.js";
import { AppRegistry } from "../services/appRegistry.js";
import { onCertificateEarned } from "../services/agenticLoopService.js";
import {
  getLayerConfirmationText,
  getLayerLaunchEffects,
  getLayerLaunchSummary,
  getPlatformChecklist,
  getPlatformLaunchControlSnapshot,
} from "../services/platformLaunchControlService.js";
import { recordPlatformLayerStatus } from "../services/platformLayerStatusService.js";

const router = Router();

const LAUNCH_MESSAGES: Record<string, string> = {
  market: "Winners Market is now live. ATLAS has 3 product ideas ready based on your Community activity. Visit Market -> Vendor Dashboard.",
  work: "Winners Work is now live. CIRCUIT is matching every certificate holder against the open job board now.",
  mobile: "Winners Mobile is now live. Install the ecosystem on Android Chrome or iOS Safari for Academy and Community on the go.",
  cloud: "Winners Cloud is now live. FREE can see the platform, while PRO and ENTERPRISE have full access to keys, connectors, webhooks, and NEXUS.",
};

const notifySlack = async (message: string) => {
  console.log(`SLACK: ${message}`);
};

const sendBroadcastNotification = async (notification: { title: string; body: string; type: string }) => {
  console.log(`BROADCAST: ${notification.title} (${notification.type})`);
};

async function createLayerLaunchNotifications(layer: NonNullable<ReturnType<typeof AppRegistry.get>>, layerId: string) {
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

  return activeUsers.length;
}

async function flushWorkLaunchMatches() {
  const certificates = await prisma.certificate.findMany({
    orderBy: [{ issuedAt: "desc" }],
    select: {
      userId: true,
      tenantId: true,
      courseId: true,
    },
  });

  const latestCertificateByUser = new Map<string, { userId: string; tenantId: string; courseId: string }>();
  for (const certificate of certificates) {
    if (!latestCertificateByUser.has(certificate.userId)) {
      latestCertificateByUser.set(certificate.userId, certificate);
    }
  }

  await Promise.all(
    Array.from(latestCertificateByUser.values()).map((certificate) =>
      onCertificateEarned(certificate.userId, certificate.courseId, certificate.tenantId),
    ),
  );

  return latestCertificateByUser.size;
}

async function runLayerLaunchEffects(layerId: string, layer: NonNullable<ReturnType<typeof AppRegistry.get>>) {
  if (layerId === "work") {
    const certificateMatchesFlushed = await flushWorkLaunchMatches();
    return {
      certificateMatchesFlushed,
      supervisorActivation: "CIRCUIT active",
    };
  }

  if (layerId === "market") {
    return {
      supervisorActivation: "ATLAS active",
      omegaBriefingMode: "market_signals_live",
    };
  }

  if (layerId === "cloud") {
    return {
      supervisorActivation: "NEXUS active",
      planGate: "FREE visible but locked; PRO and ENTERPRISE enabled",
    };
  }

  if (layerId === "mobile") {
    return {
      installSurface: "pwa_live",
      offlineScope: "academy_and_community",
    };
  }

  return {
    layer: layer.name,
  };
}

router.use(authMiddleware, superAdminMiddleware);

router.get("/status", async (_req, res) => {
  const layers = AppRegistry.list();
  const health = { api: "OK", db: "OK", aiPlatform: "OK", redis: "OK", email: "OK" };
  const control = await getPlatformLaunchControlSnapshot();
  res.json({ layers, health, control });
});

router.post("/:layerId/checklist", async (req, res) => {
  const checklist = await getPlatformChecklist(req.params.layerId);
  if (!checklist) {
    return res.status(404).json({ error: "Layer not found" });
  }

  return res.json(checklist);
});

router.post("/:layerId/launch", async (req, res) => {
  const { layerId } = req.params;
  const { confirmationText } = req.body as { confirmationText?: string };

  const layer = AppRegistry.get(layerId);
  if (!layer) {
    return res.status(404).json({ error: "Layer not found" });
  }

  if (layer.status === "live") {
    return res.status(400).json({ error: `${layer.name} is already live.` });
  }

  const expectedConfirmationText = getLayerConfirmationText(layerId);
  if ((confirmationText ?? "").trim().toUpperCase() !== expectedConfirmationText) {
    return res.status(400).json({
      error: "Confirmation text mismatch",
      expected: expectedConfirmationText,
      message: `Type "${expectedConfirmationText}" to launch ${layer.name}.`,
    });
  }

  const { ready, missing } = AppRegistry.checkDependencies(layerId);
  if (!ready) {
    return res.status(400).json({
      error: "Dependencies not met",
      missing,
      message: `Cannot launch ${layer.name} until these layers are live: ${missing.join(", ")}`,
    });
  }

  const checklist = await getPlatformChecklist(layerId);
  if (!checklist) {
    return res.status(404).json({ error: "Layer not found" });
  }

  if (!checklist.isReady) {
    return res.status(400).json({
      error: "Launch checklist failed",
      checklist,
      message: `${layer.name} still has ${checklist.blockingCount} blocking checklist item(s).`,
    });
  }

  AppRegistry.update(layerId, { status: "live" });

  const usersNotified = await createLayerLaunchNotifications(layer, layerId);
  const layerEffects = await runLayerLaunchEffects(layerId, layer);

  await recordPlatformLayerStatus({
    layerId,
    layerName: layer.name,
    status: "live",
    actorUserId: req.user!.userId,
    actorEmail: req.user!.email,
    confirmationText: expectedConfirmationText,
    summary: getLayerLaunchSummary(layerId),
    metadata: {
      checklist,
      launchEffects: getLayerLaunchEffects(layerId),
      runtimeEffects: layerEffects,
      usersNotified,
      launchedFrom: "/admin/platform",
    },
  });

  await sendBroadcastNotification({
    title: `${layer.name} is now live`,
    body: LAUNCH_MESSAGES[layerId] ?? `${layer.name} is now available in your ecosystem.`,
    type: "platform_launch",
  });

  await notifySlack(`${layer.name} launched by ${req.user!.email}. ${usersNotified} users notified.`);

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
      usersNotified,
      confirmationText: expectedConfirmationText,
      checklist,
      layerEffects,
    },
  });
  emitAdminEvent({
    type: "layer_health_change",
    urgency: "info",
    message: `${layer.name} is now live and ${usersNotified.toLocaleString("en-US")} users were notified.`,
    link: `/admin/platform/${layerId}`,
  });

  return res.json({
    success: true,
    layer: AppRegistry.get(layerId),
    usersNotified,
    layerEffects,
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

  await recordPlatformLayerStatus({
    layerId,
    layerName: layer.name,
    status: "suspended",
    actorUserId: req.user!.userId,
    actorEmail: req.user!.email,
    summary: reason?.trim() ? `Suspended: ${reason.trim()}` : `Suspended ${layer.name}`,
    metadata: {
      reason: reason ?? null,
    },
  });

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
  emitAdminEvent({
    type: "layer_health_change",
    urgency: "critical",
    message: `${layer.name} was suspended${reason?.trim() ? `: ${reason.trim()}` : "."}`,
    link: `/admin/platform/${layerId}`,
  });

  return res.json({ success: true, message: `${layer.name} has been suspended.` });
});

export default router;
