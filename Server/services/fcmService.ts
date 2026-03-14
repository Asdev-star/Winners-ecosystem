// Phase 7 - Mobile App - Firebase Cloud Messaging Service
// Push notifications for web PWA, iOS, Android, Desktop

import db from '../db.js';

let adminApp: any = null;

async function getAdmin() {
  if (adminApp) return adminApp;
  try {
    const admin = await import('firebase-admin');
    if (!admin.default.apps.length) {
      admin.default.initializeApp({
        credential: admin.default.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
    adminApp = admin.default;
    return adminApp;
  } catch (err) {
    console.warn('[fcm] Firebase Admin not available:', err);
    return null;
  }
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  url?: string;
  icon?: string;
}

export async function sendPushNotification(userId: string, payload: PushPayload): Promise<void> {
  const admin = await getAdmin();
  if (!admin) return;

  try {
    const tokens = await db.deviceToken.findMany({
      where: { userId, isActive: true },
    });
    if (!tokens.length) return;

    await admin.messaging().sendEachForMulticast({
      tokens: tokens.map((t: any) => t.token),
      notification: { title: payload.title, body: payload.body },
      data: { ...payload.data, url: payload.url || '/' },
      webpush: {
        fcmOptions: { link: payload.url || '/' },
        notification: {
          icon: payload.icon || '/pwa-192x192.svg',
          badge: '/pwa-192x192.svg',
          vibrate: [200, 100, 200],
        },
      },
    });
  } catch (error) {
    console.error('[fcm] Send notification error:', error);
  }
}

export async function registerDeviceToken(userId: string, token: string, platform: string = 'web'): Promise<void> {
  await db.deviceToken.upsert({
    where: { token },
    create: { userId, token, platform, isActive: true },
    update: { userId, isActive: true, updatedAt: new Date() },
  });
}

export async function deactivateDeviceToken(token: string): Promise<void> {
  await db.deviceToken.updateMany({
    where: { token },
    data: { isActive: false },
  });
}

export async function sendBulkNotification(userIds: string[], payload: PushPayload): Promise<void> {
  await Promise.allSettled(userIds.map(uid => sendPushNotification(uid, payload)));
}