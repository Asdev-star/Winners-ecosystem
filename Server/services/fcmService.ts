import db from "../db.js";

type FirebaseAdminModule = typeof import("firebase-admin");

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, string>;
  priority?: "high" | "normal";
}

let adminModulePromise: Promise<FirebaseAdminModule | null> | null = null;

function hasFirebaseConfig() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY,
  );
}

async function getFirebaseAdmin(): Promise<FirebaseAdminModule | null> {
  if (adminModulePromise) return adminModulePromise;

  adminModulePromise = (async () => {
    if (!hasFirebaseConfig()) {
      console.warn("[fcm] Firebase config is missing; push delivery is disabled.");
      return null;
    }

    try {
      const admin = await import("firebase-admin");

      if (!admin.default.apps.length) {
        admin.default.initializeApp({
          credential: admin.default.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID!,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
            privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
          }),
        });
      }

      return admin;
    } catch (error) {
      console.warn("[fcm] Firebase Admin could not be loaded:", error);
      return null;
    }
  })();

  return adminModulePromise;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const admin = await getFirebaseAdmin();
  if (!admin) return;

  const tokens = await db.deviceToken.findMany({
    where: { userId, isActive: true },
  });

  if (!tokens.length) return;

  const results = await admin.default.messaging().sendEachForMulticast({
    tokens: tokens.map((tokenRecord) => tokenRecord.token),
    notification: { title: payload.title, body: payload.body },
    data: {
      ...(payload.data ?? {}),
      url: payload.url || "/",
      click_action: "FLUTTER_NOTIFICATION_CLICK",
    },
    webpush: {
      fcmOptions: { link: payload.url || "/" },
      notification: {
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.png",
        vibrate: [200, 100, 200],
      },
    },
    android: { priority: payload.priority === "high" ? "HIGH" : "NORMAL" },
  });

  await Promise.allSettled(
    results.responses.map((response, index) => {
      const tokenRecord = tokens[index];
      if (!tokenRecord) return Promise.resolve();

      if (response.success) {
        return db.deviceToken.update({
          where: { token: tokenRecord.token },
          data: { lastSeen: new Date(), isActive: true },
        });
      }

      if (response.error?.code === "messaging/registration-token-not-registered") {
        return db.deviceToken.update({
          where: { token: tokenRecord.token },
          data: { isActive: false },
        });
      }

      return Promise.resolve();
    }),
  );
}

export async function sendPushNotification(userId: string, payload: PushPayload): Promise<void> {
  await sendPushToUser(userId, payload);
}

export async function registerDeviceToken(
  userId: string,
  tenantId: string,
  token: string,
  platform = "web",
  userAgent?: string,
): Promise<void> {
  await db.deviceToken.upsert({
    where: { token },
    create: {
      userId,
      tenantId,
      token,
      platform,
      userAgent,
      isActive: true,
      lastSeen: new Date(),
    },
    update: {
      userId,
      tenantId,
      platform,
      userAgent,
      isActive: true,
      lastSeen: new Date(),
    },
  });
}

export async function deactivateDeviceToken(token: string): Promise<void> {
  await db.deviceToken.updateMany({
    where: { token },
    data: { isActive: false },
  });
}

export async function sendBulkNotification(userIds: string[], payload: PushPayload): Promise<void> {
  await Promise.allSettled(userIds.map((userId) => sendPushToUser(userId, payload)));
}

export const pushTriggers = {
  certificateEarned: (userId: string, certTitle: string) =>
    sendPushToUser(userId, {
      title: "\u{1F393} Certificate earned",
      body: `You earned "${certTitle}". CIRCUIT has already matched you to 3 jobs.`,
      url: "/academy/certificates",
      priority: "high",
    }),

  jobMatch: (userId: string, jobTitle: string, matchScore: number, jobId: string) =>
    sendPushToUser(userId, {
      title: `\u{26A1} CIRCUIT: ${matchScore}% match`,
      body: `${jobTitle} - CIRCUIT has a proposal draft ready for you.`,
      url: `/work/jobs/${jobId}`,
      priority: "high",
    }),

  escrowReleased: (userId: string, amount: number) =>
    sendPushToUser(userId, {
      title: "\u{1F4B0} Payment released",
      body: `$${amount} has been transferred to your account.`,
      url: "/work/contracts",
      priority: "high",
    }),

  omegaBriefing: (userId: string, headline: string) =>
    sendPushToUser(userId, {
      title: "\u{1F9E0} OMEGA briefing ready",
      body: headline,
      url: "/intelligence",
      priority: "normal",
    }),

  newComment: (userId: string, commenterName: string, postPreview: string) =>
    sendPushToUser(userId, {
      title: `\u{1F4AC} ${commenterName} commented`,
      body: postPreview.slice(0, 80),
      url: "/community",
      priority: "normal",
    }),

  firstSale: (userId: string, productName: string, amount: number) =>
    sendPushToUser(userId, {
      title: "\u{1F6D2} First sale!",
      body: `Someone bought "${productName}" for $${amount}. ATLAS has your next move ready.`,
      url: "/market/vendor",
      priority: "high",
    }),
};
