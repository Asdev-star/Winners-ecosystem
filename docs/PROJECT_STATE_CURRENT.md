# WINNERS ECOSYSTEM - PROJECT STATE
## Last Updated: March 29, 2026 (repo-verified from filesystem, App.tsx, apiRouter.ts, AppRegistry, and package manifests)

**Stack:** React 19 + TypeScript + Vite · Node/Express 5 · PostgreSQL + Prisma 7 · Expo React Native · Electron · FastAPI
**Overall Progress:** ~70% complete
**Verification Scope:** Static repo analysis only in this pass. No runtime boot, network checks, or full test run were performed.

---

## EXECUTIVE SNAPSHOT

- This repo is a multi-surface product, not a single app.
- The primary production surfaces are:
  - Web app in `src/`
  - Express API in `Server/`
  - Prisma schema in `prisma/`
  - Mobile app in `mobile/WinnersApp/`
  - Electron wrapper in `electron/`
  - Separate FastAPI AI service in `ai-platform/`
- The root `README.md` is still the default Vite template and is not a reliable description of the current system.

---

## PLATFORM STATUS (repo-verified March 29, 2026)

| Platform | Source of truth | Current status | Notes |
|---|---|---|---|
| Core Engine | `Server/services/appRegistry.ts` | Live | Auth, billing, analytics, exports, admin, API gateway |
| Community | `Server/services/appRegistry.ts` | Live | Feed, posts, groups, messaging, live spaces, studio surfaces |
| Academy | `Server/services/appRegistry.ts` | Live | Courses, quizzes, certificates, live sessions, uploads |
| Market | `Server/services/appRegistry.ts` | Live | Vendors, products, cart, checkout, orders, dropshipping |
| Intelligence | `Server/services/appRegistry.ts` | Live | Omega, supervisors, agentic loops, credits, reports |
| Work | `Server/services/appRegistry.ts` | In progress | Jobs, freelancer profiles, contracts, escrow are present but still treated as not fully launched |
| Mobile | `Server/services/appRegistry.ts` | Planned | Native Expo app exists in repo, but registry still marks the layer as planned |
| Cloud | `Server/services/appRegistry.ts` | In progress | API keys, connectors, agents, automations, webhooks surfaces exist |

---

## REPO SHAPE

### Top-level product surfaces

- `src/` - React web client
- `Server/` - Express API and services
- `prisma/` - database schema, migrations, seeds
- `mobile/WinnersApp/` - Expo mobile application
- `electron/` - desktop shell around the web app
- `ai-platform/` - separate FastAPI AI service
- `sdk/` - shared SDK client
- `docs/` - living product and planning documents

### Current codebase counts

| Category | Count | Notes |
|---|---|---|
| Backend route modules | 62 | `Server/routes/*Routes.ts` |
| Backend route test files | 5 | `apiRouter`, `auth`, `cartCheckout`, `postSecurity`, `registryRoutes` |
| Backend service modules | 36 | excludes `appRegistry.test.ts` |
| Backend service test files | 1 | `Server/services/appRegistry.test.ts` |
| Backend middleware files | 10 | includes auth, RBAC, layer gates, rate limiting, usage limits |
| Frontend feature directories | 33 | `src/features/*` |
| Top-level frontend hooks | 10 | `src/hooks/*` |
| Top-level frontend stores | 4 | `src/stores/*` |
| Total test files | 7 | across frontend and backend |

---

## VERIFIED FRONTEND SURFACES

### Public routes

- `/`
- `/landing`
- `/login`
- `/invite/accept`
- `/onboarding`
- `/architecture`
- `/ui-quality`
- `/forgot-password`
- `/reset-password`
- `/sso/exchange`
- `/verify/:token`

### Admin and operations

- `/admin/overview`
- `/admin/platform`
- `/admin/platform/:layerId`
- `/admin/tenants`
- `/admin/tenants/:id`
- `/admin/users`
- `/admin/users/:id`
- `/admin/revenue`
- `/admin/forge`
- `/admin/health`
- `/admin/broadcast`
- `/admin/security`
- `/ops` redirects to admin health

### Canonical Document 1 - Admin Dashboard

- Route: `/dashboard`
- Primary file: `src/features/dashboard/DashboardPage.tsx`
- Frontend behavior:
  - Authenticated non-admin identities are redirected to `/home` by `DashboardRealmRoute` in `src/App.tsx`
  - Sovereign admin routes under `/admin/*` remain hidden behind `SuperAdminRoute`
- Backend guard path:
  - `ADMIN_EMAILS` env var is parsed by `Server/middleware/superAdminMiddleware.ts`
  - `concealedSuperAdminMiddleware` returns `404` instead of `401/403`
  - `Server/routes/adminRoutes.ts` mounts admin endpoints behind the concealed middleware

#### Document 1 layout architecture

- Sticky header with Winners brand, `Admin Dashboard` label, `FORGE AI` action, notifications, admin identity, and `SUPERADMIN` badge
- Sticky 240px left sidebar with:
  - Overview
  - Platform Control
  - Tenants
  - Users
  - Revenue
  - FORGE Intelligence
  - System Health
  - Broadcast
  - Security
- Sidebar ecosystem status summary with:
  - live layers
  - MRR
  - total users
  - system health
- Main content area dedicated to the active admin page content

#### Document 1 page 1 - Overview

- The default admin surface is the morning-briefing overview
- Data is driven from admin endpoints in `Server/routes/adminRoutes.ts`, including:
  - `GET /api/v1/admin/overview`
  - `GET /api/v1/admin/stats`
  - `GET /api/v1/admin/loops/live`
  - `POST /api/v1/admin/forge/briefing`
- The overview currently renders:
  - six KPI cards
  - FORGE morning briefing
  - platform layer status grid
  - live agentic loop feed
  - revenue trend and attribution
  - cross-layer supervisor signals
  - recent admin activity

##### Platform layer status grid

- The overview is intended to present a 3x3 layer matrix:
  - Core Engine
  - Community
  - Academy
  - Intelligence
  - Market
  - Work
  - Mobile
  - Cloud
  - AI Platform
- Target state language for the cards:
  - `LIVE`
  - `READY`
  - `LOCKED`
  - `BUILD`
- Target action language for the cards:
  - `Manage`
  - `Launch ->`
  - `View Deps`

##### Revenue and activity modules

- Revenue chart uses a 30-day Recharts area visualization with layer attribution.
- Recent activity feed is intended to surface the last 20 admin-relevant events such as:
  - PRO upgrades
  - certificate completions
  - vendor applications
  - loop completions
  - error spikes

#### Document 1 page 2 - Platform Control

- Route family:
  - `/admin/platform`
  - `/admin/platform/:layerId`
- Purpose:
  - sovereign launch control for each ecosystem layer
- Expected admin actions per layer:
  - run pre-launch checklist
  - launch to users with typed confirmation phrase
  - suspend with operator reason and user notification
  - view post-launch metrics
  - manage layer settings
- Dependency chain represented by the control surface:
  - `Core -> Community -> Academy -> Market -> Work -> Mobile`
  - `Core -> Intelligence -> Cloud`

#### Document 1 page 3 - Tenant Management

- Primary route family:
  - `/admin/tenants`
  - `/admin/tenants/:id`
- Core table responsibilities:
  - workspace overview
  - plan control
  - lifecycle control
  - impersonation
  - tenant drill-down
- Current tenant actions present in the admin tenants surface include:
  - `Change Plan`
  - `Impersonate Logged`
  - `Suspend` or `Restore`
  - `Delete`
- Backend support exists for:
  - search
  - plan filter
  - status filter
  - tenant impersonation
  - audit logging around impersonation and lifecycle changes
- Impersonation behavior is intended to remain sovereign:
  - non-admins receive `404`
  - impersonation creates an admin audit entry
  - impersonated sessions remain visibly marked in the UI

#### Document 1 page 4 - User Management

- Primary route family:
  - `/admin/users`
  - `/admin/users/:id`
- The user list now renders the canonical admin table columns:
  - name
  - email
  - plan
  - trust score
  - layers active
  - last seen
  - actions
- Per-user actions now have backend support in `Server/routes/adminRoutes.ts` for:
  - `Change Role`
  - `Change Plan`
  - `Reset 2FA`
  - `Suspend` and `Restore`
  - `Delete`
  - `Send FORGE Message`
  - `Reset Password`
  - `Revoke Sessions`
- Trust score monitoring now includes:
  - at-risk highlighting below 30
  - advocate highlighting above 85
  - tier filtering for Bronze, Silver, Gold, and Platinum
- Bulk admin actions currently present:
  - select multiple users
  - `Send Announcement`
  - `Export CSV`
  - `Change Plan`
- User deep-dive payloads are now shaped server-side for:
  - cross-layer timeline
  - loop history
  - AI usage summary
  - moderation signals
  - admin intervention controls

#### Document 1 page 5 - Revenue Dashboard

- Route:
  - `/admin/revenue`
- Revenue command now surfaces:
  - MRR
  - ARR
  - ARPU
  - churn
  - LTV
  - Stripe payout status
  - escrow held
  - vendor payouts pending
- The dashboard currently visualizes:
  - 12-month revenue line with forecast continuation
  - monthly revenue by layer
  - plan distribution
  - recent new-vs-churned revenue momentum
- Backend support exists for:
  - `GET /api/v1/admin/revenue/command`
  - `GET /api/v1/admin/revenue/breakdown`
  - `GET /api/v1/admin/revenue/export/:format`
  - `POST /api/v1/admin/revenue/report-email`
- Geography and plan-conversion panels are currently driven from tenant/user distribution rather than fully attributed billing geography.

#### Document 1 page 6 - FORGE Intelligence Panel

- Route:
  - `/admin/forge`
- FORGE is the admin-facing sovereign supervisor with:
  - full admin ecosystem context
  - SSE chat streaming
  - markdown/code-block responses
  - suggested prompts aligned to operator priorities
- The admin FORGE prompt in `Server/services/adminForgeService.ts` now explicitly injects:
  - platform layer state
  - tenant count
  - user count
  - MRR
  - active loops
  - system health
  - launch queue
  - highest-risk tenants
  - highest-value users
- Suggested prompts now include:
  - `What should I prioritise this week?`
  - `Why did MRR drop on Tuesday?`
  - `Which users are most likely to churn?`
  - `What's blocking Market launch?`

#### Document 1 page 7 - System Health

- Route:
  - `/admin/health`
- Service health coverage now includes:
  - API Server
  - PostgreSQL
  - AI Platform
  - Stripe
  - Cloudinary
  - Firebase FCM
  - Resend Email
  - Socket.io
  - Redis (cache)
- The error log panel now supports filtering by:
  - severity
  - route substring
  - time range
  - AI-specific faults
  - Stripe-specific faults
- The health response now carries an observability link slot for Sentry when `SENTRY_URL` is configured.

#### Document 1 page 8 - Broadcast

- Route:
  - `/admin/broadcast`
- The broadcast surface now supports typed composition fields for:
  - title
  - body
  - CTA label
  - CTA URL
  - broadcast type
- Targeting now covers:
  - all users
  - plan tier
  - layer
  - user segment
- User segment targeting currently includes:
  - at-risk users
  - platinum advocates
  - inactive 7-day users
- Scheduling modes now include:
  - send now
  - specific time
  - next OMEGA briefing
- Broadcast history now carries:
  - audience label
  - open-rate label
  - CTA click-rate label
  - CTA metadata
  - sent or scheduled state
- Backend support now exists for:
  - `GET /api/v1/admin/broadcast/panel`
  - `POST /api/v1/admin/broadcast/send`
  - `POST /api/v1/admin/broadcast/schedule`
  - `POST /api/v1/admin/broadcast/draft`

#### Document 1 page 9 - Security

- Route:
  - `/admin/security`
- The security surface now exposes dedicated sections for:
  - RLS policy status
  - tenantId scoping audit
  - JWT configuration
  - active session summary
  - 2FA adoption rate
  - route-level rate-limit coverage
  - GDPR queue visibility
  - admin audit log
  - suspicious activity feed
  - FORGE security assistant guidance
- The current implementation uses:
  - `device_tokens` as the live session artifact source
  - recent auth activity logs as the suspicious activity feed source
  - repository/config inspection for JWT, limiter, middleware, and scoping checks
- FORGE security scan is currently a refreshed advisory synthesis rather than a separate scanning engine or external scanner integration.

### Core protected surfaces

- `/dashboard`
- `/home`
- `/search`
- `/analytics`
- `/team`
- `/export`
- `/billing`
- `/email`
- `/notifications`
- `/settings`
- `/settings/core`
- `/profile`
- `/slack`
- `/stripe`
- `/activity`
- `/referral`
- `/changelog`
- `/2fa`

### Community surfaces

- `/community`
- `/community/feed`
- `/community/groups`
- `/community/spaces`
- `/community/directory`
- `/community/opportunities`
- `/community/analytics`
- `/community/creator`
- `/community/social-accounts`
- `/community/social-intelligence`
- `/community/discover`
- `/community/saved`
- `/community/studio`
- `/community/studio/room/:roomId`
- `/community/studio/stream/:streamId`
- `/community/profile/:id`
- `/messages`
- `/messages/:conversationId`

### Academy surfaces

- `/academy`
- `/academy/external`
- `/academy/explore`
- `/academy/my-learning`
- `/academy/courses/:slug`
- `/academy/instructor`
- `/academy/instructor/create`
- `/academy/instructor/edit/:id`
- `/academy/paths`
- `/academy/paths/:pathId`
- `/academy/study-groups`
- `/academy/study-groups/:groupId`
- `/academy/quiz/:quizId`
- `/academy/live-sessions`

### Intelligence surfaces

- `/intelligence`
- `/intelligence/aria`
- `/intelligence/omega`
- `/intelligence/platform`
- `/intelligence/agents/:name`
- `/intelligence/loop`
- `/intelligence/memory`
- `/intelligence/credits`
- `/intelligence/reports`
- `/intelligence/analytics`
- `/intelligence/revenue`

### Market surfaces

- `/market`
- `/market/dropshipping`
- `/market/product/:productId`
- `/market/vendor`
- `/market/cart`
- `/market/orders`
- `/market/checkout`
- `/market/finance`
- `/market/business-launcher`
- `/market/cv-tools`
- `/market/digital-marketing`
- `/market/marketing`
- `/market/:vertical`

### Work surfaces

- `/work`
- `/work/jobs`
- `/work/freelancers`
- `/work/contracts`
- `/work/escrow`
- `/work/profile`

### Cloud surfaces

- `/cloud`
- `/cloud/connectors`
- `/cloud/automations`
- `/cloud/agents`
- `/cloud/keys`
- `/cloud/webhooks`
- `/cloud/usage`
- `/cloud/marketplace`

---

## VERIFIED BACKEND SURFACES

### API gateway

- Main gateway: `/api/v1`
- Health endpoint outside the rate limiter: `/health`
- Legacy route redirects still exist for older unversioned endpoints

### Major mounted backend domains

- Auth and password reset
- Tenants and users
- Analytics and export
- Billing and Stripe
- AI and chat
- Profile and onboarding
- Email and notifications
- Search and activity
- Referral and changelog
- 2FA and GDPR
- Community posts, groups, spaces, messages, studio, social
- Academy, quizzes, lecture uploads, live sessions, external courses
- Market, vendors, products, cart, checkout, orders, finance, dropship
- Work, escrow, circuit
- Cloud, connectors, push tokens
- Omega, supervisors, autonomous insights, agentic loops, credits
- Atlas and market-specific Atlas routes

### AI service

The separate FastAPI service in `ai-platform/` exposes:

- chat
- images
- speech
- multimodal
- health
- config

This appears to be an adjunct inference service rather than the main application backend.

---

## DATA MODEL STATUS

The Prisma schema remains one of the clearest indicators of product scope. It includes:

- Multi-tenant core entities
- Auth, 2FA, impersonation, privacy acknowledgments
- Community posts, comments, reactions, groups, live spaces, studio entities
- Academy courses, lessons, quizzes, certificates, live sessions, learning paths
- Market vendors, products, carts, orders, reviews, payouts
- Work jobs, applications, freelancer profiles, contracts, milestones, escrow, reviews
- Cloud connectors, installs, API keys, webhooks, automations, AI agents, usage logs
- Finance wallets, wallet transactions, withdrawal requests, savings groups
- Platform launch status tracking

The schema is broad and powerful, but also a clear maintainability hotspot because so many domains live in one model file.

---

## TESTING STATUS

Current test surface is still small relative to repo size.

### Present tests

- `src/features/auth/authStore.test.ts`
- `Server/services/appRegistry.test.ts`
- `Server/routes/apiRouter.test.ts`
- `Server/routes/auth.test.ts`
- `Server/routes/cartCheckout.test.ts`
- `Server/routes/postSecurity.test.ts`
- `Server/routes/registryRoutes.test.ts`

### Assessment

- Security and router regression coverage exists in a few important places.
- The overall test footprint is still thin for the breadth of platform features.
- Mobile, Electron, and the Python AI service currently have no obvious automated coverage in this repo.

---

## KNOWN GAPS AND MISMATCHES (repo-verified)

| # | Issue | Current reality |
|---|---|---|
| 1 | Root README is stale | `README.md` still describes the default Vite template rather than the actual platform |
| 2 | `platformLaunchRoutes.ts` is not wired into the API gateway | The file exists, but `Server/routes/apiRouter.ts` does not import or mount it |
| 3 | SSO routes are still partially stubbed | `Server/routes/ssoRoutes.ts` still contains TODOs for SAML validation, Okta profile handling, and persistence |
| 4 | Timezone handling is still hardcoded in one prompt path | `src/config/supervisorPrompts.ts` still hardcodes `Africa/Nairobi` with a TODO to use profile data |
| 5 | Status semantics are mixed across layers | `AppRegistry` marks Mobile as planned even though a substantial Expo app exists in the repo |

### Recently resolved from earlier project-state notes

- Docker server output path is now aligned to `dist/server/index.js`
- Electron packaging references `dist/server/**/*`, which matches the current build output
- Presence token storage currently uses `we_token` consistently between auth persistence and `usePresence.ts`

---

## CURRENT READINESS SUMMARY

### Strongest areas

- Web app route surface
- Express API gateway structure
- Multi-tenant Prisma data model
- Admin and platform-control surfaces
- Market and Intelligence feature breadth

### Mid-maturity areas

- Cloud layer
- Work layer
- Mobile productization and launch-state alignment

### Weakest areas

- Onboarding quality of repo docs
- Test coverage versus system size
- Clear separation of source-of-truth docs versus historical planning docs

---

## RECOMMENDED NEXT ACTIONS

1. Replace the root `README.md` with a real architecture and startup guide.
2. Decide whether `platformLaunchRoutes.ts` should be mounted or removed.
3. Finish the TODO-backed SSO implementation before calling that path production-ready.
4. Expand test coverage around Market, Work, Cloud, and critical auth flows.
5. Reconcile launch-state semantics for Mobile and other layers so docs, registry state, and surfaced functionality all match.
