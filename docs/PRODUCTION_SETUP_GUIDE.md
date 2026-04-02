# Production Setup Guide - Cloud V1.0, Mobile PWA & Plugin Marketplace

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database with Prisma
- Firebase project (for push notifications)
- SSL certificate for WebAuthn (production only)

---

## 1. Database Migrations

Run Prisma migrations to create new tables:

```bash
cd Winners-ecosystem
npx prisma migrate dev --name add_webauthn_and_notifications
npx prisma generate
```

### Required Models

Ensure these models exist in `prisma/schema.prisma`:

```prisma
model Challenge {
  id        String   @id @default(cuid())
  userId    String
  tenantId  String
  challenge String   @unique
  type      String   // "registration" | "authentication"
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([challenge])
}

model WebAuthnCredential {
  id                    String   @id @default(cuid())
  userId                String
  tenantId              String
  credentialId          String   @unique
  publicKey             String
  counter               Int      @default(0)
  authenticatorAttachment String @default("platform")
  lastUsedAt            DateTime?
  createdAt             DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

model NotificationPreference {
  userId              String @id
  enabled             Boolean @default(true)
  communityPosts      Boolean @default(true)
  communityLikes      Boolean @default(true)
  communityComments   Boolean @default(true)
  academyEnrollment   Boolean @default(true)
  academyCertificate  Boolean @default(true)
  marketOrderUpdate   Boolean @default(true)
  workApplication     Boolean @default(true)
  workContractUpdate  Boolean @default(true)
  trustScoreChange    Boolean @default(true)
  systemAnnouncements Boolean @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("notification_preferences")
}
```

---

## 2. Firebase Cloud Messaging Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project: "Winners Ecosystem"
3. Enable Cloud Messaging API

### Step 2: Generate VAPID Key

```bash
npx firebase-tools login
npx firebase init messaging
```

Or manually generate:

```javascript
const webPush = require('web-push');
const vapidKeys = webPush.generateVAPIDKeys();
console.log(vapidKeys.publicKey);
console.log(vapidKeys.privateKey);
```

### Step 3: Add to Environment Variables

```env
# .env
FIREBASE_VAPID_KEY=your_vapid_public_key_here
FIREBASE_PROJECT_ID=winners-ecosystem
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@winners-ecosystem.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Step 4: Install Firebase Admin SDK

```bash
npm install firebase-admin
```

### Step 5: Initialize Firebase Admin

Create `Server/services/firebaseService.ts`:

```typescript
import * as admin from 'firebase-admin';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

export const messaging = admin.messaging();
export default admin;
```

### Step 6: Update Push Notification Routes

In `Server/routes/notificationRoutes.ts`, replace the test endpoint:

```typescript
import { messaging } from '../services/firebaseService.js';

// POST /notifications/push/test
router.post("/push/test", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  
  try {
    // Get user's push tokens
    const tokens = await db.deviceToken.findMany({
      where: { userId, platform: 'web-push', isActive: true },
    });
    
    // Send via FCM
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: '🎉 Test Notification',
        body: 'Your push notifications are working correctly!',
      },
      tokens: tokens.map(t => t.token),
      data: {
        url: '/notifications',
      },
    };
    
    const response = await messaging.sendEachForMulticast(message);
    
    res.json({ 
      success: true, 
      message: `Sent to ${response.successCount} devices` 
    });
  } catch (err) {
    console.error('[Push] Test error:', err);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});
```

---

## 3. WebAuthn Configuration

### Step 1: Set Relying Party ID

For production, you need a valid domain (not localhost):

```env
# .env
WEBAUTHN_RP_ID=yourdomain.com
WEBAUTHN_RP_NAME=Winners Ecosystem
```

### Step 2: HTTPS Requirement

WebAuthn requires HTTPS in production. Set up SSL:

```bash
# Using Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

Or configure in Railway/your hosting provider.

### Step 3: Update Biometric Routes

Ensure proper origin checking in `Server/routes/biometricRoutes.ts`:

```typescript
const rpId = process.env.WEBAUTHN_RP_ID || 'localhost';
const rpName = process.env.WEBAUTHN_RP_NAME || 'Winners Ecosystem';
```

---

## 4. Plugin Marketplace Setup

### Step 1: Configure Revenue Share Defaults

Add to your seed script or run manually:

```typescript
// Default revenue share: 70% to developer, 30% to platform
await db.plugin.updateMany({
  where: {},
  data: { revenueShare: 70 },
});
```

### Step 2: Set Up Stripe Connect for Payouts

```bash
npm install stripe
```

```env
# .env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_CONNECT_CLIENT_ID=ca_...
```

### Step 3: Update Payout Handler

In `pluginRoutes.ts`, integrate Stripe Connect:

```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

// In payout request handler:
const transfer = await stripe.transfers.create({
  amount: Math.round(amount * 100), // cents
  currency: 'usd',
  destination: developerStripeAccountId,
  source_transaction: paymentIntent.id,
});
```

---

## 5. White-label Configuration

### Step 1: DNS Setup for Custom Domains

Configure wildcard DNS for tenant subdomains:

```
*.winnersempire.io  CNAME  winners-empire-eco.up.railway.app
```

### Step 2: Tenant Middleware

Create middleware to handle tenant resolution:

```typescript
// Server/middleware/tenantMiddleware.ts
export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];
  
  if (subdomain !== 'www' && subdomain !== 'api') {
    const tenant = await db.tenant.findFirst({
      where: { slug: subdomain },
    });
    
    if (tenant) {
      req.tenant = tenant;
    }
  }
  
  next();
}
```

---

## 6. Testing Checklist

### Cloud V1.0
- [ ] Generate API key
- [ ] Create webhook subscription
- [ ] Verify webhook signature
- [ ] Browse plugin marketplace
- [ ] Install a plugin
- [ ] Check usage dashboard

### Mobile PWA
- [ ] Subscribe to push notifications
- [ ] Receive test notification
- [ ] Register biometric credential
- [ ] Authenticate with fingerprint/face
- [ ] Test offline mode
- [ ] Verify offline queue sync

### Plugin Marketplace
- [ ] Submit plugin for review
- [ ] Admin approval workflow
- [ ] Plugin installation
- [ ] Revenue tracking
- [ ] Request payout (min $50)

### White-label
- [ ] Update tenant branding
- [ ] Provision sub-tenant
- [ ] Set custom domain
- [ ] Toggle features
- [ ] List sub-tenants

---

## 7. Deployment

### Railway Deployment

```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run build && npm run start"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
```

### Environment Variables (Production)

```env
# Database
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=your_jwt_secret
WEBAUTHN_RP_ID=app.winnersempire.io

# Firebase
FIREBASE_VAPID_KEY=your_vapid_key
FIREBASE_PROJECT_ID=winners-ecosystem

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_CONNECT_CLIENT_ID=ca_...

# Email (for notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

---

## 8. Monitoring & Analytics

### Add Usage Tracking

```typescript
// Server/services/usageTrackingService.ts
export async function trackUsage(
  tenantId: string,
  feature: string,
  credits: number,
  metadata?: Record<string, unknown>
) {
  await db.usageLog.create({
    data: {
      tenantId,
      feature,
      credits,
      billedAt: new Date(),
      metadata,
    },
  });
}
```

### Error Logging

```typescript
// Server/services/errorLoggingService.ts
export async function logError(
  error: Error,
  context: {
    userId?: string;
    tenantId?: string;
    route?: string;
  }
) {
  await db.errorLog.create({
    data: {
      message: error.message,
      stack: error.stack,
      ...context,
      timestamp: new Date(),
    },
  });
}
```

---

## 9. Security Hardening

### Rate Limiting

```typescript
// Already implemented in rateLimitMiddleware.ts
// Ensure it's applied to all new routes
```

### CORS Configuration

```typescript
// Server/index.ts
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
```

### Input Validation

Use Zod or Joi for all API inputs:

```bash
npm install zod
```

```typescript
import { z } from 'zod';

const pluginSubmitSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500),
  price: z.number().nonnegative(),
});
```

---

## 10. Documentation

### Update API Docs

Generate and publish OpenAPI spec:

```bash
# Serve Swagger UI
npm install swagger-ui-express
```

```typescript
// Server/index.ts
import swaggerUi from 'swagger-ui-express';
import openApiSpec from '../docs/CLOUD_API_OPENAPI_SPEC.json';

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
```

### Developer Portal

Create landing page at `/cloud` with:
- Getting started guide
- API key management
- Code examples
- SDK documentation
- Webhook testing tools

---

## Troubleshooting

### Push Notifications Not Working
1. Check Firebase project configuration
2. Verify VAPID key in environment
3. Ensure service worker is registered
4. Check browser permissions

### WebAuthn Fails
1. Verify HTTPS in production
2. Check RP ID matches domain
3. Ensure browser supports WebAuthn
4. Clear browser credentials and retry

### Plugin Revenue Not Calculating
1. Check `revenueShare` field on plugins
2. Verify install records exist
3. Check currency conversion rates
4. Review payout threshold ($50 min)

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/winners-ecosystem/issues
- Documentation: https://docs.winnersempire.io
- Email: support@winnersempire.io

---

**Last Updated**: April 2, 2026
**Version**: 1.0.0
