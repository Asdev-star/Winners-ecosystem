# WINNERS ECOSYSTEM — PROJECT STATE

**Date:** March 9, 2026  
**Analysis:** Repo-aligned snapshot  
**Version:** V7 (updated to match current codebase)

---

## EXECUTIVE SUMMARY

Winners Ecosystem is a **full-stack TypeScript product platform** with a React/Vite frontend, an Express/Prisma backend, PostgreSQL persistence, a PWA build, and Electron packaging. The repository contains **multiple product surfaces in one codebase**: Core Engine, Community, Academy, Market, Intelligence, Work, Mobile/PWA, Cloud planning, and a separate AI Platform service.

This document is updated to reflect the **current repository state** rather than older roadmap assumptions.

---

## PLATFORM SURFACE SUMMARY

The current codebase exposes the following product surfaces:

| Platform | Surface in Repo | Current State in Code |
|---|---|---|
| Core Engine | Auth, billing, analytics, admin, export, profile, settings | **Live** |
| Winners Community | Feed, groups, messages, opportunities, directory, studio, presence foundation | **Live / active development** |
| Winners Academy | Catalog, course pages, instructor flows, quiz engine, learning paths, study groups | **Live / active development** |
| Winners Market | Marketplace, vendor dashboard, cart, orders, checkout, dropshipping | **Building** |
| Winners Intelligence | Dashboard, ARIA chat, OMEGA dashboard, AI platform page | **Building** |
| Winners Work | Work page plus freelancer/contracts route surface | **Building** |
| Mobile | PWA support in Vite | **PWA-ready** |
| Winners Cloud | No routed product surface yet | **Planned** |
| AI Platform Service | Separate FastAPI service in `ai-platform/` | **Present in repo** |

## AI ASSISTANTS

| Assistant | Layer | Status in Repo |
|---|---|---|
| OMEGA | Orchestrator | Built into intelligence/server flows |
| ARIA | Core Engine | Routed |
| NOVA | Community | Partial implementation |
| SAGE | Academy | Partial implementation |
| ATLAS | Market | Building |
| FORGE | Intelligence | Building |
| CIRCUIT | Work | Building |
| NEXUS | Cloud | Planned |
| HERALD | AI Platform | Present via AI platform service |

---

## TECH STACK

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **Routing:** React Router 7
- **State:** Zustand
- **Charts:** Recharts
- **UI Icons:** Lucide React
- **Desktop Packaging:** Electron
- **PWA:** `vite-plugin-pwa`
- **Testing:** Vitest + Testing Library + happy-dom

### Backend
- **Runtime:** Node.js + Express 5 + TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma 7
- **Auth:** JWT + bcryptjs + Google OAuth via Passport
- **2FA:** OTPAuth + email OTP flows
- **Realtime:** `ws` WebSocket server at `/ws`
- **Email:** Resend + `node-cron`
- **Payments:** Stripe + LemonSqueezy backend integration
- **Security:** Helmet + express-rate-limit + request guards
- **Exports:** PDFKit + ExcelJS

### AI Platform Service
- **Service:** FastAPI
- **Purpose:** Multimodal routing for text, image, PDF, audio, and video
- **Providers referenced in service code:** Claude, GPT-4o, Gemini, Ollama, Whisper

---

## PROJECT STRUCTURE

```text
winners-ecosystem/
├── ai-platform/               # FastAPI AI service
├── dist/                      # Vite frontend build output
├── dist-electron/             # Electron build output
├── docs/                      # Project documentation
├── electron/                  # Electron main/preload sources
├── prisma/                    # Prisma schema + migrations
├── public/                    # Static assets
├── sdk/                       # SDK foundation
├── Server/                    # Express backend
│   ├── middleware/            # 6 TypeScript files
│   ├── routes/                # 45 route modules + 2 route tests
│   ├── services/              # 12 service modules + 1 service test
│   └── index.ts               # Server entry
└── src/                       # React app
    ├── app/
    ├── components/
    ├── features/              # 29 feature directories
    ├── hooks/                 # 7 top-level hooks
    ├── lib/
    ├── stores/                # 4 top-level stores
    ├── App.tsx
    ├── App.css
    ├── index.css
    └── main.tsx
```

---

## VERIFIED FRONTEND ROUTING

### Public Routes
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

### Protected Core Routes
- `/2fa`
- `/dashboard`
- `/search`
- `/analytics`
- `/team`
- `/export`
- `/billing`
- `/email`
- `/notifications`
- `/settings`
- `/profile`
- `/slack`
- `/stripe`
- `/activity`
- `/referral`
- `/admin`
- `/ops`
- `/changelog`

### Community Routes
- `/community`
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

### Academy Routes
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

### Intelligence Routes
- `/intelligence`
- `/intelligence/aria`
- `/intelligence/omega`
- `/intelligence/platform`

### Market Routes
- `/market`
- `/market/dropshipping`
- `/market/product/:productId`
- `/market/vendor`
- `/market/cart`
- `/market/orders`
- `/market/checkout`
- `/market/:vertical`

### Work Routes
- `/work`
- `/work/freelancers`
- `/work/contracts`

---

## VERIFIED BACKEND ROUTING

### Route Modules Present
- `academyRoutes.ts`
- `activityRoutes.ts`
- `adminRoutes.ts`
- `aiPlatformRoutes.ts`
- `aiRoutes.ts`
- `analyticsRoutes.ts`
- `apiRouter.ts`
- `authRoutes.ts`
- `autonomousRoutes.ts`
- `billingRoutes.ts`
- `cartRoutes.ts`
- `changelogRoutes.ts`
- `chatRoutes.ts`
- `communityExtrasRoutes.ts`
- `communityIntelligenceRoutes.ts`
- `emailRoutes.ts`
- `exportRoutes.ts`
- `externalCourseRoutes.ts`
- `gdprRoutes.ts`
- `groupRoutes.ts`
- `healthRoutes.ts`
- `liveSpaceRoutes.ts`
- `messageRoutes.ts`
- `notificationRoutes.ts`
- `omegaRoutes.ts`
- `opportunityRoutes.ts`
- `orderRoutes.ts`
- `passwordResetRoutes.ts`
- `postRoutes.ts`
- `productRoutes.ts`
- `profileRoutes.ts`
- `quizRoutes.ts`
- `referralRoutes.ts`
- `registryRoutes.ts`
- `searchRoutes.ts`
- `slackRoutes.ts`
- `socialRoutes.ts`
- `ssoRoutes.ts`
- `stripeRoutes.ts`
- `studioRoutes.ts`
- `supervisorRoutes.ts`
- `tenantsRoutes.ts`
- `twoFactorRoutes.ts`
- `usersRoutes.ts`
- `vendorRoutes.ts`

### API Gateway / Mounting Notes
- Main versioned gateway is mounted at **`/api/v1`**.
- `chatRoutes.ts` is mounted.
- Intelligence routes are mounted.
- Legacy route redirects exist for older unversioned paths.
- Additional direct mounts exist for posts, groups, messages, spaces, opportunities, studio, supervisors, quizzes, and autonomous insights.

---

## DATABASE STATE

- **ORM:** Prisma
- **Datasource:** PostgreSQL
- **Schema file:** `prisma/schema.prisma`
- **Schema size:** approximately **2,984 lines** in the current repo snapshot
- **Domain coverage:** multi-tenancy, auth, community, academy, market, work, notifications, messaging, studio, and analytics

This schema is large and multi-domain, and remains one of the main architectural pressure points in the repository.

---

## DESIGN SYSTEM STATE

The current global design system is defined primarily in `src/index.css`.

### Verified Current Theme Characteristics
- **Typography:** Syne, Space Mono, Cormorant Garamond
- **Primary palette in current CSS:**
  - Gold: `#F0B429`, `#F5C842`, `#B8841A`, `#7A560E`
  - Blue: `#4A9EFF`, `#6BB3FF`, `#1A6BC7`, `#0F3E7A`
  - Ice: `#89C4E1`
  - Green: `#2DD4A0`
  - Red: `#E05A4E`
  - Purple: `#9B6FFF`, `#B594FF`
- **Dark surfaces in current CSS:**
  - `--bg: #080E1A`
  - `--surface: #0D1826`
  - `--surface2: #121F30`
  - `--surface3: #172538`
  - `--border: #1A2E45`
- **Theme support:** explicit dark and light palette variables are present

This means older documentation that claimed only the newer dark palette values is **not fully aligned** with the actual CSS file currently checked into the repo.

---

## BUILD, TEST, AND PACKAGING

### Scripts in `package.json`
- `build` → `prisma generate && tsc -p tsconfig.server.json && vite build`
- `build:client` → `vite build`
- `build:server` → `tsc -p tsconfig.server.json`
- `test` → `vitest run`
- `dev` → `vite`
- `dev:server` → `tsx watch Server/index.ts`
- `dev:all` → `concurrently "npm run dev" "npm run dev:server"`
- `start:prod` → `node dist/server/index.js`
- `electron:dev` → wait for Vite and then start Electron
- `electron:build` → build app and package Electron
- `electron:start` → start Electron
- `compile:electron` → `tsc -p electron/tsconfig.json`

### Verified Build Outputs
- Frontend build output: `dist/`
- Backend TypeScript output: `dist/server/`
- Electron compile output: `dist-electron/`

### Tests Present
The repo currently contains a small test surface relative to project size, including:
- `src/features/auth/authStore.test.ts`
- `Server/routes/apiRouter.test.ts`
- `Server/routes/registryRoutes.test.ts`
- `Server/services/appRegistry.test.ts`

---

## EXTERNAL INTEGRATIONS VERIFIED IN CODE

| Integration | Status | Notes |
|---|---|---|
| Railway | Present | Deployment target referenced across repo |
| PostgreSQL | Present | Prisma/Postgres adapter in server DB layer |
| Stripe | Present | Frontend + backend integration |
| LemonSqueezy | Present | Backend billing route integration remains in code |
| Resend | Present | Email routes/services |
| Google OAuth | Present | Auth routes and dependencies |
| Slack | Present | Slack routes/services |
| LiveKit | Present | Studio routes and frontend usage |
| Anthropic | Present | SDK dependency and AI routes |
| FastAPI AI service | Present | Separate `ai-platform/main.py` service |

### Not Confirmed as First-Class Runtime Integration in Current Repo
- Cloudinary is referenced in older docs and UI copy, but a dedicated Cloudinary runtime dependency/integration is **not clearly present** in the current repository snapshot.

---

## CURRENT REPO MISMATCHES TO FIX

These are real mismatches visible in the current repository and should remain tracked until resolved:

1. **Docker backend entry mismatch**
   - `Dockerfile` runs `node dist/Server/index.js`
   - backend build output is `dist/server/index.js`

2. **Electron packaging file-path mismatch**
   - Electron build config still references `dist-server/**/*`
   - backend output is `dist/server/**/*`

3. **App registry metadata is stale relative to routed product surface**
   - `Server/services/appRegistry.ts` still marks some domains as planned/in-progress even though Academy, Market, and Work have routed frontend surfaces and backend modules

4. **Presence token mismatch**
   - `authStore.ts` persists token under `we_token`
   - `usePresence.ts` reads `token`
   - this likely breaks authenticated WebSocket presence unless storage is normalized elsewhere

5. **Test coverage is still light for project scope**
   - there are only a few direct tests compared with the size of the app and schema

---

## PRIORITY NEXT ACTIONS

| Priority | Action | Reason |
|---|---|---|
| 1 | Fix backend output path mismatches in Docker and Electron packaging | Prevent broken production builds |
| 2 | Reconcile `appRegistry.ts` with the actual routed product surface | Keep internal platform metadata trustworthy |
| 3 | Fix presence token key mismatch | Restore realtime presence reliability |
| 4 | Add tests for auth, billing, market checkout, and academy flows | Reduce regression risk |
| 5 | Audit tenant scoping and security-sensitive routes | Close cross-tenant risk areas |

---

## FILES SUMMARY

| Category | Current Repo Snapshot |
|---|---|
| Backend route modules | 45 |
| Route test files | 2 |
| Backend service modules | 12 |
| Service test files | 1 |
| Backend middleware files | 6 |
| Frontend feature directories | 29 |
| Top-level hook files | 7 |
| Top-level store files | 4 |
| Prisma schema | ~2,984 lines |
| Electron source files | 2 TypeScript entry files |
| AI platform service | 1 FastAPI app entry file |

---

*Updated: March 9, 2026*  
*This snapshot is aligned to the current repository contents, routes, dependencies, and build configuration visible in code.*