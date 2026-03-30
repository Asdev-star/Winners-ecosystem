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
