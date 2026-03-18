# WINNERS ECOSYSTEM — PLATFORM LAUNCH CONTROL SPEC
### Admin Controls · Layer Activation · Launch Sequence
### Version 1.0 · March 2026

> **The model:** Admin owns the Core Engine and controls when each platform layer
> becomes available to users. Layers launch in sequence. Each launch is a deliberate
> act — not an automatic event. The admin decides when a layer is ready for users.

---

## THE TWO REALMS

```
ADMIN REALM (Core Engine)              USER REALM (All Platform Layers)
──────────────────────────────         ──────────────────────────────────────
winnersempire.io/admin                 winnersempire.io (dashboard)
                                       community.winnersempire.io
Available from day one.                learn.winnersempire.io
No activation needed.                  shop.winnersempire.io
Full control panel.                    ai.winnersempire.io
                                       work.winnersempire.io
                                       cloud.winnersempire.io
                                       (each unlocks on admin launch)
```

---

## ADMIN REALM — CORE ENGINE (ALWAYS AVAILABLE)

The admin always has full access to the Core Engine regardless of what is launched to users.
The admin dashboard is the control tower. Every other layer is a decision.

### What Admin Controls in the Core Engine

```
┌─────────────────────────────────────────────────────────────────┐
│  CORE ENGINE — ADMIN CONTROL PANEL                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PLATFORM LAUNCH CONTROL                                        │
│  ┌──────────────┬──────────────┬────────────────────────────┐   │
│  │ Layer        │ Status       │ Action                     │   │
│  ├──────────────┼──────────────┼────────────────────────────┤   │
│  │ Core Engine  │ ✅ LIVE       │ [Admin Only — Always On]   │   │
│  │ Community    │ ✅ LIVE       │ [Manage] [Suspend]         │   │
│  │ Academy      │ ✅ LIVE       │ [Manage] [Suspend]         │   │
│  │ Intelligence │ ✅ LIVE       │ [Manage] [Suspend]         │   │
│  │ Market       │ 🔒 LOCKED     │ [Launch to Users] ←        │   │
│  │ Work         │ 🔒 LOCKED     │ [Launch to Users] ←        │   │
│  │ Mobile       │ 🔒 LOCKED     │ [Launch to Users] ←        │   │
│  │ Cloud        │ 🔒 LOCKED     │ [Launch to Users] ←        │   │
│  └──────────────┴──────────────┴────────────────────────────┘   │
│                                                                 │
│  USER MANAGEMENT                                                │
│  Total Users: 1,247  Active (7d): 834  New (30d): 312          │
│  [View Users] [Manage Roles] [Suspend User] [Invite Admin]     │
│                                                                 │
│  TENANT MANAGEMENT                                             │
│  Total Tenants: 156  Pro: 34  Enterprise: 8  Free: 114        │
│  [View Tenants] [Change Plan] [Suspend] [Delete]               │
│                                                                 │
│  REVENUE                                                        │
│  MRR: $4,280  ARR: $51,360  Stripe: Connected ✅               │
│  [Analytics] [Payouts] [Refunds] [Export]                      │
│                                                                 │
│  SYSTEM HEALTH                                                  │
│  API: ✅  DB: ✅  AI Platform: ✅  Redis: ✅  Email: ✅         │
│  [Health Dashboard] [Logs] [Error Tracker]                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## PLATFORM LAUNCH SEQUENCE

Layers launch in order. Each layer depends on the previous being stable.
The admin makes the launch decision. The system enforces the dependencies.

```
Phase 1: Core Engine        ████████████████████  LIVE (admin always)
Phase 2: Community          ████████████████████  LIVE (launched to users)
Phase 3: Academy            ████████████████████  LIVE (launched to users)
Phase 5: Intelligence       █████████████████░░░  LIVE (launched to users)
         ↑ these four are currently live

Phase 4: Market             ██████████░░░░░░░░░░  READY TO LAUNCH → Admin decision
Phase 6: Work               █████░░░░░░░░░░░░░░░  LOCKED (depends on Market)
Phase 7: Mobile             ██░░░░░░░░░░░░░░░░░░  LOCKED (depends on web stability)
Phase 8: Cloud              ████░░░░░░░░░░░░░░░░  LOCKED (depends on all layers)
```

### Dependency Rules (enforced by AppRegistry)

```typescript
// These are the hard dependency gates. A layer cannot be launched
// until all its dependencies are status: "live"

core        → dependencies: []                    // always available
community   → dependencies: ["core"]
academy     → dependencies: ["core", "community"]
intelligence → dependencies: ["core"]
market      → dependencies: ["core", "academy"]   // ← NEXT TO LAUNCH
work        → dependencies: ["core", "market"]
mobile      → dependencies: ["core", "community", "academy", "market"]
cloud       → dependencies: ["core", "intelligence", "market"]
```

---

## ADMIN LAUNCH FLOW — STEP BY STEP

When the admin decides to launch a layer, this is the exact process:

### Step 1 — Pre-Launch Checklist (Admin Reviews)

Before the launch button is enabled, the system runs an automated checklist:

```
Market Pre-Launch Checklist
────────────────────────────────────────────────────────────
✅ Academy dependency is live (required)
✅ Core Engine dependency is live (required)
✅ productRoutes.ts — health check passes
✅ cartRoutes.ts — health check passes
✅ orderRoutes.ts — health check passes
✅ vendorRoutes.ts — health check passes
✅ Stripe Connect — configured (/api/v1/market/connect/status)
✅ Prisma: Product, Cart, Order, Vendor models migrated
⚠️  CheckoutPage vendor resolution bug — not yet fixed
❌ Multi-vendor payout flow — incomplete
────────────────────────────────────────────────────────────
Status: NOT READY — 2 issues blocking launch
Action: [View Issues] [Override and Launch Anyway — RISK]
```

The checklist is driven by the `AppRegistry.checkDependencies()` function plus
a set of health checks specific to each layer.

### Step 2 — Launch Confirmation Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAUNCH: Winners Market                                             │
│  ─────────────────────────────────────────────────────────────────  │
│  You are about to make Winners Market available to all users.       │
│                                                                     │
│  What this does:                                                    │
│  • /market and all sub-routes become accessible to logged-in users  │
│  • AppRegistry status for "market" changes to "live"                │
│  • Sidebar nav item for Market becomes visible ecosystem-wide       │
│  • ATLAS AI supervisor activates for all users                      │
│  • OMEGA starts routing market signals in daily briefings           │
│  • Welcome notification sent to all active users                    │
│                                                                     │
│  Users affected: 1,247                                             │
│  Reversible: Yes — you can suspend the layer at any time            │
│                                                                     │
│  Type "LAUNCH MARKET" to confirm:  [________________]              │
│                                                                     │
│  [Cancel]                         [Confirm Launch]                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 3 — Launch Execution (Backend)

```typescript
// Server/routes/adminRoutes.ts — add platform launch endpoint:

router.post('/platform/:layerId/launch', superAdminMiddleware, async (req, res) => {
  const { layerId } = req.params;
  const { confirmation } = req.body;

  // Validate confirmation text
  const layer = AppRegistry.get(layerId);
  if (!layer) return res.status(404).json({ error: 'Layer not found' });

  // Check dependencies
  const { ready, missing } = AppRegistry.checkDependencies(layerId);
  if (!ready && !req.body.override) {
    return res.status(400).json({
      error: 'Dependencies not met',
      missing,
      message: `Cannot launch ${layer.name} until: ${missing.join(', ')} are live`
    });
  }

  // Update AppRegistry
  AppRegistry.update(layerId, { status: 'live', version: layer.version });

  // Persist to DB (so it survives server restart)
  await prisma.platformLayerStatus.upsert({
    where:  { layerId },
    update: { status: 'live', launchedAt: new Date(), launchedBy: req.user!.userId },
    create: {
      layerId,
      status:     'live',
      launchedAt: new Date(),
      launchedBy: req.user!.userId,
      tenantId:   req.user!.tenantId
    }
  });

  // Send welcome notification to all active users
  const activeUsers = await prisma.user.findMany({
    where: { lastActiveAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
  });

  await Promise.all(activeUsers.map(user =>
    prisma.notification.create({
      data: {
        userId:   user.id,
        tenantId: user.tenantId,
        type:     'platform_launch',
        title:    `${layer.name} is now live`,
        body:     LAUNCH_MESSAGES[layerId] || `${layer.name} is now available in your ecosystem.`,
        url:      layer.frontendPath,
        read:     false
      }
    })
  ));

  // Notify admin Slack channel
  await notifySlack(`🚀 ${layer.name} launched by ${req.user!.email} — ${activeUsers.length} users notified`);

  // Log admin action
  await prisma.adminAction.create({
    data: {
      adminId:  req.user!.userId,
      action:   'platform_launch',
      target:   layerId,
      metadata: { userCount: activeUsers.length, timestamp: new Date() }
    }
  });

  res.json({
    success:       true,
    layer:         AppRegistry.get(layerId),
    usersNotified: activeUsers.length
  });
});
```

### Step 4 — What Changes for Users on Launch

```typescript
// The moment a layer's status changes to "live" in AppRegistry + DB:

// 1. MainLayout.tsx — sidebar nav item becomes visible
//    (reads from /api/v1/platform/status endpoint which reads AppRegistry)

// 2. AssistantPanel — OMEGA starts including that layer in briefings

// 3. Context bar — layer dot changes from dim (planned) to live (gold/green)

// 4. Notification badge — user sees the layer launch notification

// 5. Dashboard — OMEGA briefing mentions the new layer on next generation

// How MainLayout reads platform status:
const { data: platformStatus } = useSWR('/api/v1/platform/status', fetcher);
// Returns: { community: 'live', academy: 'live', market: 'in_progress', ... }

// Nav items filtered by status:
const navItems = ALL_NAV_ITEMS.filter(item =>
  item.alwaysShow || platformStatus?.[item.layerId] === 'live'
);
```

---

## LAYER-BY-LAYER LAUNCH SPEC

---

### LAUNCH 1: Winners Market

**When to launch:** Market 4A checkout fix complete + Stripe Connect configured.

**Minimum ready criteria:**
```
✅ CheckoutPage vendor resolution bug fixed
✅ Stripe Connect: at least one test vendor payout completes
✅ productRoutes health check passes
✅ cartRoutes health check passes
✅ At least 3 products seeded in DB for demo
✅ ATLAS AI route responding (/api/v1/atlas/research)
```

**What users see on launch:**
```
Sidebar: 🛒 Market (new — gold dot)
Notification: "Winners Market is live — explore products, launch your store, or find your first vendor"
Dashboard OMEGA briefing: "Market has launched. ATLAS has analysed your Community activity
                           and has 3 product ideas ready for you. Visit Market → Vendor Dashboard."
```

**Admin post-launch monitoring (first 48 hours):**
```
Watch: /admin/market/health
- Cart abandonment rate (target: <70%)
- Checkout completion rate (target: >25%)
- Vendor application rate (target: >5 per day)
- ATLAS query rate (measures supervisor engagement)
- Error rate on orderRoutes (target: <1%)
```

---

### LAUNCH 2: Winners Work

**Dependencies:** Market must be live + escrow backend complete.

**Minimum ready criteria:**
```
✅ Market status: live
✅ EscrowPayment/Release Prisma models migrated
✅ Escrow fund flow: test payment successfully held
✅ Escrow release flow: test payout successfully delivered
✅ CIRCUIT match scoring: returns valid score on test job
✅ At least 5 job listings seeded
✅ FreelancerProfilePage renders without errors
```

**What users see on launch:**
```
Sidebar: 💼 Work (new — blue dot)
Notification: "Winners Work is live — CIRCUIT has already scored every open job against
               your Academy certificates. Your match scores are waiting."
OMEGA briefing: references Work in daily intelligence — "3 contracts match your React
                certificate. CIRCUIT has draft proposals ready."
```

**The Academy → Work loop activates automatically on launch:**
```typescript
// onCertificateEarned() was already wired — it fires CIRCUIT matching
// but until Work is live, CIRCUIT suppresses the notification
// On Work launch: CIRCUIT flushes all pending match notifications to users
```

---

### LAUNCH 3: Mobile PWA

**Dependencies:** Community + Academy + Market all live.

**Minimum ready criteria:**
```
✅ public/manifest.json created
✅ Service worker registered
✅ Firebase FCM configured
✅ Install prompt shows on Android Chrome + iOS Safari
✅ Offline: Academy lessons cached (at least partial)
✅ Push notification: test notification delivers to device
```

**What changes on launch:**
```
- Install banner appears in bottom bar for non-PWA users
- "Install App" button appears in Settings
- Push notifications enabled for all future platform events
- Users on mobile get improved responsive UI indicators
```

**Admin action:**
```
Admin → Settings → Platform → Mobile
Toggle: "Enable PWA install prompt" → ON
Toggle: "Enable push notifications" → ON
```

---

### LAUNCH 4: Winners Cloud

**Dependencies:** Intelligence ≥ 75% + Market live + at least 50 active users.

**Minimum ready criteria:**
```
✅ Intelligence status: live
✅ Market status: live
✅ API key creation/revocation working
✅ OAuth connector flow: at least M-Pesa + Stripe + Google working
✅ At least one webhook event (loop.completed) firing correctly
✅ CloudDashboardPage renders without errors
✅ NEXUS supervisor chat responding
✅ @winners/sdk: at least JS version installable (can be private npm)
```

**What users see on launch:**
```
Sidebar: ☁️ Cloud (new — ice dot)
Only shown to: PRO and ENTERPRISE plan users by default
(FREE users see it as "locked" with upgrade prompt)

Notification (PRO/ENT only): "Winners Cloud is live — your API key is ready.
                              NEXUS is waiting to help you build on the ecosystem."
```

**The developer tier gating:**
```typescript
// Cloud is the only layer with a plan gate on top of launch status
// Even when "live", FREE users see a locked state with upgrade prompt

const canAccessCloud = platformStatus.cloud === 'live' &&
  (userPlan === 'PRO' || userPlan === 'ENTERPRISE');
```

---

## ADMIN PLATFORM CONTROL — PRISMA SCHEMA

```prisma
model PlatformLayerStatus {
  id         String    @id @default(cuid())
  layerId    String    @unique  // core | community | academy | market | work | mobile | cloud
  status     String    @default("planned")  // planned | in_progress | live | suspended
  launchedAt DateTime?
  launchedBy String?  // admin userId
  suspendedAt DateTime?
  suspendedBy String?
  suspendReason String?
  tenantId   String
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}

model AdminAction {
  id        String   @id @default(cuid())
  adminId   String
  action    String   // platform_launch | platform_suspend | plan_change | user_suspend | etc
  target    String   // layerId, userId, tenantId
  metadata  Json
  createdAt DateTime @default(now())
}

model PlatformAnnouncement {
  id          String   @id @default(cuid())
  layerId     String
  title       String
  body        String   @db.Text
  ctaLabel    String?
  ctaUrl      String?
  targetPlans String[] // [] = all plans | ['PRO', 'ENTERPRISE'] = plan-gated
  sentAt      DateTime?
  createdAt   DateTime @default(now())
}
```

---

## ADMIN ROUTES ADDITIONS

```typescript
// Server/routes/adminRoutes.ts — additions needed:

// Platform layer management
GET    /admin/platform/status           // all layers + their status + health
POST   /admin/platform/:id/launch       // launch a layer to users
POST   /admin/platform/:id/suspend      // suspend a live layer
POST   /admin/platform/:id/checklist    // run pre-launch checklist
GET    /admin/platform/:id/metrics      // post-launch monitoring metrics

// Announcements
POST   /admin/announcements             // create layer launch announcement
GET    /admin/announcements             // list all announcements
DELETE /admin/announcements/:id         // delete announcement

// Admin audit
GET    /admin/actions                   // full admin action log
GET    /admin/actions/:adminId          // actions by specific admin
```

---

## FRONTEND — ADMIN LAUNCH CONTROL PAGE

```typescript
// src/features/admin/PlatformLaunchPage.tsx
// Route: /admin/platform
// Only accessible to SUPERADMIN role

// Page sections:
// 1. Platform Status Grid — 8 cards, one per layer
//    Each card: icon + name + status badge + progress bar + last action
//    Buttons: [Launch] | [Suspend] | [View Metrics] | [Run Checklist]

// 2. Launch Queue — layers ready to launch (dependencies met)
//    Sorted by priority. Click to open launch modal.

// 3. Admin Action Log — last 50 admin actions across all platform operations

// 4. System Health — all services (API, DB, AI Platform, Redis, Email, Stripe)
```

---

## USER-SIDE EXPERIENCE ON LAYER LAUNCH

### What users see when a new layer goes live:

**1. Notification (in-app + push):**
```
🚀 Winners Work is now live
CIRCUIT has already matched your React certificate to 3 open contracts.
Your first proposal is drafted and waiting.
[View Work] [Dismiss]
```

**2. Sidebar nav item appears** (was dim/hidden before, now gold-pulsing for 48h):
```
💼 Work ← NEW badge for 48 hours
```

**3. Context bar dot activates:**
```
⬡ Core · 👥 Community · 🎓 Academy · 💼 Work ← NEW · 🛒 Market · 🤖 Intelligence
```

**4. OMEGA daily briefing on next morning (06:00 UTC) includes the new layer:**
```
"Work launched yesterday. CIRCUIT reviewed 47 open contracts and found 3 that match
your current skill profile with >80% confidence. I recommend completing one proposal
today — estimated 25 minutes with CIRCUIT's draft as starting point."
```

**5. Dashboard KPI card appears** — "Work income" joins the revenue metric cards.

---

## THE LAUNCH CALENDAR — RECOMMENDED SEQUENCING

Based on current build progress (March 2026):

```
Week 1–2:  Fix Market checkout bug + Stripe Connect → LAUNCH MARKET
Week 2–3:  Wire Work escrow + CIRCUIT matching → LAUNCH WORK
Week 3:    Firebase FCM + manifest → LAUNCH MOBILE PWA
Week 4+:   Cloud connector auth + NEXUS + SDK → LAUNCH CLOUD
```

Each launch compounds the loop:
```
Market launch → vendors onboard → income signal to OMEGA
Work launch  → certificates → contracts → escrow → ATLAS prompt
PWA launch   → push notifications → re-engagement → loop frequency increases
Cloud launch → developers build on ecosystem → external traffic → more users
```

---

## SUSPENSION PROTOCOL

If a launched layer needs to be taken down:

```typescript
router.post('/admin/platform/:id/suspend', superAdminMiddleware, async (req, res) => {
  const { reason } = req.body;

  AppRegistry.update(req.params.id, { status: 'in_progress' });

  await prisma.platformLayerStatus.update({
    where:  { layerId: req.params.id },
    data:   { status: 'suspended', suspendedAt: new Date(), suspendReason: reason }
  });

  // Notify all users
  await sendBroadcastNotification({
    title: `${layer.name} temporarily unavailable`,
    body:  `We're making improvements. ${layer.name} will be back shortly.`,
    type:  'platform_maintenance'
  });

  // Sidebar nav item returns to dim/locked state for all users
  // All in-progress operations (carts, active contracts) preserved — not deleted
  // Users trying to access get maintenance page, not 404
});
```

**What suspension does NOT do:**
- Does not delete any user data
- Does not cancel active contracts or transactions
- Does not affect other layers
- Does not revoke API keys for Cloud (only makes new calls fail gracefully)

---

## SUMMARY: THE ADMIN'S LAUNCH CHECKLIST

```
BEFORE EVERY LAUNCH:
  □ Run automated pre-launch checklist (all green or override accepted)
  □ Test the critical user flow end-to-end in staging
  □ Confirm Stripe webhook is receiving events for this layer
  □ Confirm OMEGA briefing mentions the layer correctly
  □ Have a suspension plan ready (know how to roll back in < 5 min)
  □ Write the launch announcement copy

ON LAUNCH DAY:
  □ Type the confirmation text in the launch modal
  □ Monitor /admin/platform/:id/metrics for first 30 minutes
  □ Watch Slack #infra for error spikes
  □ Check that notification delivered to users

AFTER LAUNCH:
  □ Review 48-hour metrics (engagement rate, error rate, conversion)
  □ Update PROJECT_STATE_CURRENT.md with new status
  □ OMEGA briefing content: confirm it's citing the new layer
  □ Post in Community feed: "Winners [Layer] is live" — admin post
```

---

**WINNERS ECOSYSTEM — PLATFORM LAUNCH CONTROL SPEC · V1.0 · March 2026**
`Core Engine → Admin. All other layers → Launched to users by admin decision. In order. With discipline.`
