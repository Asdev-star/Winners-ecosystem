# WINNERS ECOSYSTEM
## Complete File Registry · Layer Architecture · Expert Engineering Recommendations
### *The Definitive Build Bible — Every File, Every Path, Every Decision*

> **Classification:** Lead Engineering Reference · Internal  
> **Version:** 1.0 · March 2026  
> **Scope:** All 9 platform layers · All 9 AI supervisors · Every file that must exist  
> **Purpose:** Know exactly what to build, where to put it, why it exists, and how to make it world-class

---

## How to Read This Document

Each file entry follows this format:

```
📄 filename.ts
   Path:    exact/path/in/repo/filename.ts
   Layer:   Platform Layer Name
   Phase:   Phase number
   Status:  ✅ Built | ⚠️ Built — not wired | 🔨 Build next | 📋 Planned | 🔄 Needs fix
   AI:      Which AI supervisor owns this file's domain
   Utility: What this file does and why it exists
   Expert:  Precise recommendation to make it best-in-class
```

**Status Legend**

| Symbol | Meaning |
|--------|---------|
| ✅ | Confirmed built and working |
| ⚠️ | Built but not wired into app — needs connection |
| 🔨 | Must be built in current or next sprint |
| 📋 | Planned — future phase |
| 🔄 | Exists but has known issues — fix required |

---

## Master Layer Index

| # | Layer | Phase | AI Supervisor | Status | Files |
|---|---|---|---|---|---|
| 0 | Foundation & Config | — | — | ✅ | 12 files |
| 1 | Core Engine — Backend | Phase 1 | ARIA | ✅ 92% | 28 files |
| 2 | Core Engine — Frontend | Phase 1 | ARIA | ✅ 92% | 24 files |
| 3 | Shared Component Library | Cross-layer | OMEGA | 🔨 14% | 13 files |
| 4 | Ecosystem State Layer | Cross-layer | OMEGA | 🔨 8% | 6 files |
| 5 | Winners Community — Backend | Phase 2 | NOVA | ✅ 65% | 8 files |
| 6 | Winners Community — Frontend | Phase 2 | NOVA | ⚠️ 65% | 9 files |
| 7 | Winners Academy — Backend | Phase 3 | SAGE | ✅ 45% | 5 files |
| 8 | Winners Academy — Frontend | Phase 3 | SAGE | ⚠️ 45% | 7 files |
| 9 | Winners Market — Backend | Phase 4 | ATLAS | 📋 0% | 14 files |
| 10 | Winners Market — Frontend | Phase 4 | ATLAS | 📋 0% | 18 files |
| 11 | Winners Intelligence — Backend | Phase 5 | FORGE | ⚠️ 35% | 6 files |
| 12 | Winners Intelligence — Frontend | Phase 5 | FORGE | ⚠️ 35% | 6 files |
| 13 | AI Platform Service (Python) | Phase 5 | HERALD | 📋 0% | 12 files |
| 14 | Winners Work — Backend | Phase 6 | CIRCUIT | 📋 0% | 8 files |
| 15 | Winners Work — Frontend | Phase 6 | CIRCUIT | 📋 0% | 8 files |
| 16 | Mobile App | Phase 7 | — | 📋 0% | 10 files |
| 17 | Winners Cloud | Phase 8 | NEXUS | 📋 0% | 9 files |
| 18 | Database & Migrations | All phases | — | ✅ | 8 files |
| 19 | DevOps & Config | All phases | — | ✅ | 8 files |

---

---

# LAYER 0 — FOUNDATION & PROJECT CONFIG

> These files are the non-negotiable root of everything. They define the monorepo, the build system, the environment contract, and the entry points. No layer works without them being correct.

---

📄 **package.json** (root)
- Path: `package.json`
- Layer: Foundation
- Status: ✅
- Utility: Defines the monorepo workspace, all scripts (`dev`, `build`, `build:client`, `build:server`, `start`), and all dependencies shared across frontend and backend. The single source of truth for what version of every library is installed.
- Expert: Audit quarterly. Split `devDependencies` from `dependencies` with absolute precision — anything accidentally in `dependencies` instead of `devDependencies` increases production bundle size and Railway memory consumption. Pin all critical packages (`prisma`, `@prisma/client`, `stripe`) to exact versions, not ranges. Add a `engines` field specifying `"node": ">=20.0.0"` to prevent Railway from using a mismatched Node version.

---

📄 **tsconfig.json** (root)
- Path: `tsconfig.json`
- Layer: Foundation
- Status: ✅
- Utility: Root TypeScript configuration. Defines `strict: true`, path aliases, module resolution, and base compiler options shared by both client and server `tsconfig` files.
- Expert: Enforce `"strict": true` — this is non-negotiable on a platform with financial transactions and user data. Add `"noUncheckedIndexedAccess": true` to prevent the most common class of runtime null-pointer errors. Define `@/*` as a path alias pointing to `src/*` to eliminate fragile relative imports like `../../../../components/Card`. Every `@ts-nocheck` in the codebase is a technical debt entry — eliminate all 14 of them by sprint end.

---

📄 **tsconfig.server.json**
- Path: `tsconfig.server.json`
- Layer: Foundation
- Status: ✅
- Utility: Server-specific TypeScript configuration. Extends root tsconfig, points `outDir` to `dist/`, targets Node.js module format (`"module": "ES2022"`, `"moduleResolution": "Bundler"`).
- Expert: Ensure `"sourceMap": true` is set so that production error stack traces from Railway logs are readable. Without source maps, debugging a production crash requires guesswork.

---

📄 **vite.config.ts**
- Path: `vite.config.ts`
- Layer: Foundation
- Status: ✅
- Utility: Vite frontend build configuration. Defines the React plugin, proxy rules for development (forwarding `/api` to Express), build output directory, chunk splitting strategy, and environment variable prefix (`VITE_`).
- Expert: Add `build.rollupOptions.output.manualChunks` to code-split vendor libraries (React, Recharts, Zustand) from application code. This reduces the initial bundle from a single large file to lazily loaded chunks, cutting the LCP (Largest Contentful Paint) of the landing page by 40–60%. Set `build.sourcemap: true` for production — Railway's error logging is meaningless without it.

---

📄 **Dockerfile**
- Path: `Dockerfile`
- Layer: Foundation
- Status: ✅
- Utility: Multi-stage Docker build for Railway deployment. Stage 1 installs dependencies, generates Prisma client, builds the Vite frontend, compiles the TypeScript server. Stage 2 copies only production artifacts to a clean Node image.
- Expert: Ensure the Prisma generate step runs in the build stage, not the start command. Add `HEALTHCHECK CMD curl -f http://localhost:8080/health || exit 1` so Railway's load balancer can auto-restart the container on crash. Use `node:20-alpine` not `node:20` — the Alpine image is 180MB vs 1.1GB, which directly reduces cold start time on Railway.

---

📄 **.env** (local) / Railway environment
- Path: `.env` (gitignored)
- Layer: Foundation
- Status: ✅
- Utility: All environment variables for local development and production. Database URL, JWT secrets, Stripe keys, Anthropic API key, Resend key, Slack token, Google OAuth credentials, and all `VITE_` prefixed frontend variables.
- Expert: Create a `.env.example` file with every key documented and committed to the repository. A new developer joining the project should be able to clone and run `cp .env.example .env` and then fill in their own credentials — nothing else required. Rotate `JWT_SECRET` every six months. Never use `JWT_EXPIRES_IN` longer than `8h` for access tokens — use the refresh token pattern already built.

---

📄 **Server/index.ts** (Express entry point)
- Path: `Server/index.ts`
- Layer: Foundation
- Status: ✅ (but missing route registrations)
- Utility: The Express application entry point. Initialises middleware stack (CORS, Helmet, rate limiting, JSON parsing, cookie parsing), registers all route modules under `/api/v1/*`, mounts Socket.io on the HTTP server, and starts listening on the Railway-assigned `PORT`.
- Expert: **Critical gap** — `postRoutes`, `academyRoutes`, `chatRoutes`, and `aiPlatformRoutes` are built but not registered here. Add them now — every day they are unregistered is a day the Community and Academy layers cannot function in production. The mount order matters: register `authMiddleware` globally before all protected routes. Add a final `app.use('*', handler)` for 404s that returns a structured JSON error, not an HTML Express default page.

---

📄 **src/main.tsx** (React entry point)
- Path: `src/main.tsx`
- Layer: Foundation
- Status: 🔄 (had CSS import bug — verify fixed)
- Utility: React application root. Mounts `<App />` into `document.getElementById('root')`. Imports global CSS variables, Google Fonts, and any global reset styles.
- Expert: This file should be exactly 15 lines. Nothing except `ReactDOM.createRoot` and `<App />` belongs here. Previous bug (importing `./styles/index.css` that didn't exist) caused Railway build failures. Confirm `import "./index.css"` path is correct and the CSS file exists before every push.

---

📄 **src/App.tsx** (React router)
- Path: `src/App.tsx`
- Layer: Foundation
- Status: ⚠️ (missing Intelligence and Work routes)
- Utility: Defines all client-side routes using React Router v6. Wraps authenticated routes in `<ProtectedRoute>` and `<MainLayout>`. This is the map of every page the user can visit.
- Expert: Every new platform layer needs its route registered here before it is reachable. Community and Academy routes are wired (confirmed in commit d48968b). Intelligence, Market, and Work routes must be added as those layers are built. Use `React.lazy()` and `<Suspense>` for every route import — this enables code splitting so the user's browser only downloads the code for the page they are visiting, not all pages at once. For a platform with 9 layers and 50+ pages, lazy loading is not optional — it is the difference between a 2-second and a 6-second first load.

---

---

# LAYER 1 — CORE ENGINE: BACKEND

> Phase 1 · AI Supervisor: ARIA · winnersempire.io · 92% complete
> This is the sovereign foundation. Every other layer depends on these files being correct, secure, and fast.

---

## Middleware

📄 **authMiddleware.ts**
- Path: `Server/middleware/authMiddleware.ts`
- Status: ✅
- Utility: Verifies JWT access tokens on every protected route. Decodes the token, fetches the user from the database, and injects `req.user` (with `userId`, `tenantId`, `role`) into the request context. Handles token expiry gracefully with a 401 that tells the client to refresh.
- Expert: Add a `requireRole(roles: Role[])` middleware factory that sits on top of `authenticate` — it lets route handlers declare `[authenticate, requireRole(['OWNER','ADMIN'])]` in one line instead of writing role checks inside every handler. This eliminates the scattered `if (req.user.role !== 'ADMIN') return res.status(403)` patterns that will multiply across the codebase as more role-sensitive routes are added.

---

📄 **securityMiddleware.ts**
- Path: `Server/middleware/securityMiddleware.ts`
- Status: ✅ ⚠️ (confirm in GitHub)
- Utility: Applies Helmet security headers (prevents XSS, clickjacking, MIME sniffing), configures CORS policy with an allowed origins list, and applies global rate limiting to prevent brute-force and DDoS attacks.
- Expert: The Helmet configuration must explicitly disable `X-Powered-By` (which reveals Express to attackers), set a strict `Content-Security-Policy`, and enable `Strict-Transport-Security` with a 1-year max-age. CORS `allowedOrigins` must be an environment variable — not hardcoded — so that adding a new subdomain (`shop.winnersempire.io`) does not require a code change and redeployment.

---

📄 **rateLimitMiddleware.ts**
- Path: `Server/middleware/rateLimitMiddleware.ts`
- Status: ✅
- Utility: Per-route rate limiting using `express-rate-limit`. Applies stricter limits to auth routes (5 attempts / 15 min) and looser limits to general API routes (100 requests / minute per IP).
- Expert: Upgrade to Redis-backed rate limiting (via `rate-limit-redis` + Upstash Redis) before Phase 4 Market launch. In-memory rate limiting resets on every Railway deployment and provides no protection against distributed attacks from multiple IPs. Redis-backed limiting is stateful, persists across deployments, and is essential for a platform processing real financial transactions.

---

## Core Routes

📄 **authRoutes.ts**
- Path: `Server/routes/authRoutes.ts`
- Status: ✅
- Utility: Handles all authentication flows: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/google` (OAuth initiation), `GET /auth/google/callback`. Issues JWT access tokens (8h) and refresh tokens (7d) as httpOnly cookies.
- Expert: Add `POST /auth/verify-email` to the register flow — every new account should verify their email address before accessing paid features. Unverified accounts increase fraud risk. Add account lockout after 5 failed login attempts (15-minute lockout) — this is a PCI DSS requirement if you ever process card data directly.

---

📄 **usersRoutes.ts**
- Path: `Server/routes/usersRoutes.ts`
- Status: ✅
- Utility: User profile management: `GET /users/me`, `PATCH /users/me`, `POST /users/invite`, `GET /users` (team list), `PATCH /users/:id/role`, `DELETE /users/:id`. All scoped to the authenticated user's `tenantId`.
- Expert: Add `GET /users/:id/public` — a public profile endpoint that returns safe, non-sensitive data (name, avatar, bio, Trust Score, Academy badges, Community stats). This is required for the Work layer freelancer profiles and the Community follow system to function. Without a public profile endpoint, these layers cannot link to a user's public identity.

---

📄 **tenantRoutes.ts**
- Path: `Server/routes/tenantRoutes.ts`
- Status: ✅
- Utility: Workspace management: create workspace, update settings, manage members, handle workspace switching. Multi-tenancy is the architectural foundation that keeps one customer's data isolated from another's.
- Expert: Add `GET /tenants/:id/usage` — an endpoint that returns the workspace's current usage against its plan limits (team members, API calls, storage). This is required by the Billing page to show users how close they are to their plan limit and trigger upgrade prompts at the right moment.

---

📄 **analyticsRoutes.ts**
- Path: `Server/routes/analyticsRoutes.ts`
- Status: ✅
- Utility: Revenue analytics: `GET /analytics/summary`, `GET /analytics/revenue`, `GET /analytics/forecast`, `GET /analytics/activity`. Powers the Analytics page charts and KPI cards.
- Expert: Add `GET /analytics/cross-platform` — a unified analytics endpoint that aggregates metrics across all 9 layers (community posts, courses completed, products sold, contracts delivered) into a single Wealth Dashboard response. This is the data endpoint that makes OMEGA's daily briefing possible.

---

📄 **billingRoutes.ts** + **stripeRoutes.ts**
- Path: `Server/routes/billingRoutes.ts` + `Server/routes/stripeRoutes.ts`
- Status: ✅
- Utility: `billingRoutes` — plan management, usage queries, subscription status. `stripeRoutes` — Stripe Checkout session creation, Customer Portal redirect, and webhook event handling (`invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`).
- Expert: The Stripe webhook handler is the most security-critical route in the codebase. It must: (1) verify the `Stripe-Signature` header using `stripe.webhooks.constructEvent()` — if this check is skipped, anyone can POST fake payment events; (2) use idempotency keys to ensure duplicate webhook deliveries don't double-credit accounts; (3) log every event to the ActivityLog model for audit purposes. Add Flutterwave alongside Stripe before Market launch — African users expect to pay with M-Pesa, MTN Mobile Money, and bank transfer.

---

📄 **emailRoutes.ts**
- Path: `Server/routes/emailRoutes.ts`
- Status: ✅
- Utility: Triggers transactional emails via Resend: welcome email on registration, password reset, team invitation, billing receipt, and 2FA code. Each email uses a branded HTML template.
- Expert: Add three more critical email types before Phase 4 launch: (1) Agentic Loop notification — "OMEGA noticed you're ready for your next step" with a direct CTA to the recommended action; (2) course completion certificate — email with the PDF certificate attached; (3) payment received — for Work layer escrow releases. Emails are the primary retention mechanism for a platform with this many layers. A well-timed, personalised email from OMEGA is worth more than any in-app notification.

---

📄 **notificationRoutes.ts**
- Path: `Server/routes/notificationRoutes.ts`
- Status: ✅
- Utility: In-app notifications: `GET /notifications` (paginated list), `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `DELETE /notifications/:id`. Notifications are created by backend services (new post, new comment, billing event) and delivered real-time via Socket.io.
- Expert: Add a `source` field to every notification (`community` | `academy` | `market` | `work` | `intelligence`). This enables the Unified Inbox in the frontend to filter notifications by platform layer. Without `source`, the inbox becomes an undifferentiated firehose as the platform scales to 9 layers.

---

📄 **searchRoutes.ts**
- Path: `Server/routes/searchRoutes.ts`
- Status: ✅
- Utility: Global `⌘K` search: `GET /search?q=query` — returns results across users, posts, courses, products, and job listings in a unified ranked response.
- Expert: The current implementation uses Prisma `contains` queries which perform full-table scans. This is acceptable at 1,000 users. At 10,000 users it becomes a latency problem. Integrate Meilisearch (self-hosted on Railway) or Algolia before Phase 4 Market launch. The Commerce Hub requires sub-100ms search — Prisma `contains` cannot deliver that at scale. The migration from Prisma search to Meilisearch is straightforward: index documents on create/update via background job, replace query handler with Meilisearch SDK call.

---

📄 **referralRoutes.ts** · **activityRoutes.ts** · **exportRoutes.ts** · **changelogRoutes.ts**
- Path: `Server/routes/[name]Routes.ts`
- Status: ✅
- Utility: **referralRoutes** — referral code generation, credit tracking, leaderboard. **activityRoutes** — audit log (every create/update/delete across all routes). **exportRoutes** — CSV, PDF, Excel, JSON exports for analytics and team data. **changelogRoutes** — What's New system for platform updates.
- Expert: The activity log is your most underutilised asset. Every event written to `ActivityLog` is a training signal for OMEGA. As the Intelligence layer matures, pipe the activity stream into `AgenticLoopStore` so OMEGA can detect patterns (e.g., a user who views the billing page three times without upgrading is showing upgrade intent — OMEGA should surface a targeted incentive).

---

📄 **aiRoutes.ts**
- Path: `Server/routes/aiRoutes.ts`
- Status: ✅
- Utility: Claude API integration: `POST /ai/insights` (JSON response), `GET /ai/insights/stream` (SSE streaming response). Injects user context (workspace metrics, recent activity) into the Claude prompt. Powers the AI Recommendation Card and Analytics AI Insight Panel.
- Expert: This route is the embryo of ARIA — it will grow. Currently it generates generic business insights. Evolve it toward ARIA-specific prompts: "You are ARIA, the Core Engine AI supervisor for [user name]'s workspace. Based on their revenue data, team activity, and current platform status, provide 3 actionable recommendations." Context injection is the difference between AI responses that feel generic and AI responses that feel like a trusted advisor who knows your business.

---

📄 **twoFactorRoutes.ts**
- Path: `Server/routes/twoFactorRoutes.ts`
- Status: ✅
- Utility: Full 2FA system: `POST /2fa/enable/totp` (generates QR code), `POST /2fa/verify/totp`, `POST /2fa/enable/email`, `POST /2fa/verify/email`, `GET /2fa/backup-codes`, `POST /2fa/disable`.
- Expert: 2FA must be mandatory (not optional) for any user with financial access — workspace owners, admins handling payouts, vendors with active escrow. Add a `requireTwoFactor` middleware that checks `user.twoFactorEnabled` before granting access to billing, escrow, and admin routes. This is a compliance requirement for any fintech-adjacent platform.

---

📄 **adminRoutes.ts**
- Path: `Server/routes/adminRoutes.ts`
- Status: ✅
- Utility: Super-admin dashboard: tenant management, user management, platform-wide revenue overview, manual plan overrides, account suspension.
- Expert: Add `GET /admin/ecosystem-health` — a single endpoint that returns the real-time status of all 9 platform layers (API response times, error rates, active users per layer, WebSocket connection count). This becomes the OMEGA health monitoring endpoint used by the AdminPage to display the ecosystem status bar.

---

📄 **healthRoutes.ts** · **gdprRoutes.ts** · **slackRoutes.ts**
- Path: `Server/routes/[name]Routes.ts`
- Status: ✅ ⚠️ (confirm in GitHub)
- Utility: **healthRoutes** — `GET /health` returns 200 with service status (DB connectivity, Redis ping, Stripe API reachability). **gdprRoutes** — data export (`GET /gdpr/export`), data deletion (`DELETE /gdpr/delete`), privacy acknowledgement. **slackRoutes** — sends notifications to 4 Slack channels on critical events (new enterprise signup, failed payment, security alert, deploy notification).
- Expert: The health endpoint must check all downstream dependencies: PostgreSQL query latency, Stripe API ping, Redis connection, and (when built) FastAPI AI Platform reachability. Railway's load balancer uses the health endpoint to determine whether to route traffic to the instance. A health endpoint that always returns 200 regardless of DB connectivity is worse than useless — it hides failures that cause data corruption.

---

## Core Services

📄 **emailScheduler.ts**
- Path: `Server/services/emailScheduler.ts`
- Status: ✅
- Utility: `node-cron` jobs that send scheduled email reports: weekly revenue summary, monthly platform digest, inactivity re-engagement at 7 days, upgrade prompt at plan limit 90%.
- Expert: Add an OMEGA daily briefing job: every morning at 08:00 user-local-time, OMEGA generates a personalised ecosystem briefing (yesterday's activity across all layers, today's recommended actions, any revenue milestones approaching) and emails it. This is the retention mechanism that keeps the platform top-of-mind daily and drives cross-layer engagement.

---

📄 **wsService.ts**
- Path: `Server/services/wsService.ts`
- Status: ✅
- Utility: Socket.io WebSocket server. Manages authenticated connections (token verified on `connection` event), rooms per tenant (`join tenant:${tenantId}`), and emits typed events: `post:created`, `post:liked`, `comment:added`, `user:online`, `notification:new`.
- Expert: Add `layer:event` namespacing to all Socket.io event names (`community:post:created`, `academy:enrollment:new`, `work:contract:signed`). As the platform scales to 9 layers, unnamespaced event names will collide and cause impossible-to-debug cross-layer event handling bugs. Namespace everything from the start.

---

📄 **referralService.ts** · **appRegistry.ts**
- Path: `Server/services/[name].ts`
- Status: ✅
- Utility: **referralService** — business logic for referral code generation, credit calculation, and leaderboard ranking. Extracted from route handlers for testability. **appRegistry** — maintains the registry of all 9 platform applications, their status, their routes, and their AI supervisor assignments.
- Expert: **appRegistry.ts** is a sleeper file — it is the registry that the SSO system, the ContextBar, and the Unified Notification system all need to query. Evolve it into a full `LayerRegistry` service with real-time health status, per-layer feature flags, and maintenance mode flags. If Academy needs emergency maintenance, flipping `academy.maintenanceMode = true` in the registry should cascade to: graying out Academy in the ContextBar, redirecting Academy routes to a maintenance page, and pausing Academy email notifications.

---

---

# LAYER 2 — CORE ENGINE: FRONTEND

> Phase 1 · AI Supervisor: ARIA · src/features/ · 92% complete
> These pages are the design system exemplars. Every page in every other layer should be built to this standard.

---

📄 **DashboardPage.tsx**
- Path: `src/features/dashboard/DashboardPage.tsx`
- Status: ✅ (design system exemplar)
- Utility: The user's command centre. Displays real-time KPI cards (revenue, active users, AI interactions, ecosystem score), platform layer status grid, recent activity feed, OMEGA recommendation cards, and the journey map showing the user's progress across all 9 layers.
- Expert: Evolve the journey map from a static phase indicator into a live Agentic Loop progress tracker. Show the user exactly where they are in the loop (`Community → Academy → Work → Market`) with a next-step CTA at each stage. This single UI change makes the Agentic Loop visible and turns the dashboard from an analytics page into a growth guidance system.

---

📄 **dashboardStore.ts**
- Path: `src/features/dashboard/dashboardStore.ts`
- Status: ✅
- Utility: Zustand store for dashboard state. Fetches KPI data, handles loading and error states, caches results to prevent redundant API calls on navigation. Fixed for IPv6 compatibility and stale cache prevention.
- Expert: When `ecosystemStore.ts` is built (Layer 4), migrate the layer status data out of `dashboardStore` and into `ecosystemStore`. Dashboard should be a consumer of `ecosystemStore`, not the owner of layer status data. Data ownership clarity prevents the category of bug where the same piece of data is stale in one store but fresh in another.

---

📄 **LandingPage.tsx**
- Path: `src/features/landing/LandingPage.tsx`
- Status: ✅
- Utility: The public marketing page. Hero section with CTA, platform feature sections for all 9 layers, pricing table, FAQ accordion, testimonials, and footer. The first impression for every new visitor.
- Expert: The LandingPage is a conversion asset, not just a marketing page. Add three conversion optimisations: (1) a live counter showing current active users and courses completed — social proof that the platform is real and growing; (2) an OMEGA demo widget — let visitors ask a question to the AI before signing up, demonstrating the intelligence layer's value immediately; (3) A/B test the CTA copy. "Create Free Account" vs "Start Building Your Empire" — measure which drives more signups via the analytics system.

---

📄 **LoginPage.tsx** · **ForgotPasswordPage.tsx** · **ResetPasswordPage.tsx**
- Path: `src/features/auth/[page].tsx`
- Status: ✅
- Utility: Authentication flow pages. `LoginPage` handles email/password login, Google OAuth initiation, and the 2FA verification step. `ForgotPassword` and `ResetPassword` handle the token-based password recovery flow.
- Expert: The login page is the second most visited page on the platform. Its performance and visual quality directly affect conversion. The two-panel layout (form left, visual right) is correct. Elevate the right panel: instead of a static grid background, animate the ecosystem network graph — nodes representing the 9 layers, pulsing connections between them, with OMEGA at the centre. This communicates the ecosystem's intelligence and sophistication in the 5 seconds before the user looks at the form.

---

📄 **OnboardingPage.tsx**
- Path: `src/features/onboarding/OnboardingPage.tsx`
- Status: 🔄 (uses Tailwind — needs rewrite)
- Utility: 5-step post-registration wizard: workspace name → role/use-case → goals → invite team → discover the ecosystem. Guides new users to their first meaningful action.
- Expert: This page is currently the weakest link in the acquisition funnel. Rewrite it in the ecosystem design system (zero Tailwind, CSS variables only). More critically, add OMEGA as the onboarding guide — instead of a static wizard, OMEGA asks 3 questions and recommends the user's starting layer. A creator should be sent to Community first. A developer should be sent to Work. A business owner should be sent to Market. Personalised onboarding increases 7-day retention by 20–35% in comparable SaaS platforms.

---

📄 **AnalyticsPage.tsx** + components
- Path: `src/features/analytics/AnalyticsPage.tsx` + `src/features/analytics/components/`
- Status: ✅ (except RevenueChart — see below)
- Utility: Full analytics dashboard with revenue charts, activity visualisations, AI insight panel, and summary KPI cards with sparklines.
- Expert: `RevenueChart.tsx` has confirmed hardcoded hex color violations — this is a known regression that must be fixed before Phase 4. The fix is surgical: replace every `fill="#C9A84C"` and `stroke="#E8EEF5"` with `fill="var(--gold)"` and `stroke="var(--text)"`. Also update the `<Legend>` custom renderer and `<Tooltip>` content component, both of which currently inject inline hex styles.

---

📄 **RevenueChart.tsx** 🔄 FIX REQUIRED
- Path: `src/features/analytics/components/RevenueChart.tsx`
- Status: 🔄 Known violation
- Utility: Recharts area chart showing monthly revenue trend with a gold gradient fill, ice-blue dotted forecast line, and a custom tooltip.
- Expert: **This is the highest-priority single-file fix in the codebase.** Four hex violations confirmed: gradient stop colors, tooltip background, legend dot colors, and the `activeDot` stroke. All must become CSS variable references. This is also the right moment to add a `layerBreakdown` prop — when `cross-platform` analytics data is available (post-Phase 4), the chart should show revenue stacked by layer (Community, Academy, Market, Work) in the ecosystem's gold/ice/green/purple color system.

---

📄 **BillingPage.tsx** · **ProfilePage.tsx** · **SettingsPage.tsx** · **TeamPage.tsx**
- Path: `src/features/[name]/[Page].tsx`
- Status: ✅
- Utility: **Billing** — plan display, usage meter, Stripe portal redirect, invoice history. **Profile** — user identity, avatar, bio, skills, social links. **Settings** — workspace config, notification preferences, security (2FA, connected accounts). **Team** — member list, role management, invite flow.
- Expert: **ProfilePage.tsx** is a critically underbuilt page relative to the platform's ambition. It currently shows name and email. It needs to become the unified profile that other layers read: Academy certificates as verified badges, Work Trust Score with a ring visualisation, Community follower count, Market vendor rating, total ecosystem earnings. This profile is what clients see when they click a freelancer on Work, and what employers see when they find a candidate. Build it to that standard.

---

📄 **AdminPage.tsx** · **ActivityPage.tsx** · **ChangelogPage.tsx**
- Path: `src/features/[name]/[Page].tsx`
- Status: ✅
- Utility: **Admin** — super-admin controls for tenant and user management, platform-wide revenue. **Activity** — audit log with filters by category, pagination, and per-category stat cards. **Changelog** — What's New feed with admin create/edit for feature announcements.
- Expert: Evolve `AdminPage.tsx` into the OMEGA command centre. Add a live ecosystem health panel (9 layer status indicators with real API response times), an Agentic Loop analytics panel (how many loops fired today, completion rate, average revenue per completed loop), and a FORGE cost dashboard (daily AI API spend by provider, cost per user, cost trend). This makes the admin panel genuinely useful for business intelligence, not just user management.

---

📄 **MainLayout.tsx**
- Path: `src/components/layout/MainLayout.tsx`
- Status: ✅
- Utility: The shell that wraps all authenticated pages. Provides the sidebar navigation, bottom mobile nav, ecosystem context bar, notification bell, user avatar menu, and ⌘K command palette trigger. Every authenticated page is a child of this component.
- Expert: Add three missing nav items: `{ path: '/intelligence', icon: '🤖', label: 'Aria · AI' }`, `{ path: '/market', icon: '🛒', label: 'Market' }`, and `{ path: '/work', icon: '💼', label: 'Work' }`. Also add the live ecosystem health dot to each nav item — a small coloured dot (green/gold/red) next to each layer icon showing its current status from `ecosystemStore`. This makes the navigation itself a real-time dashboard.

---

---

# LAYER 3 — SHARED COMPONENT LIBRARY

> Cross-layer · AI Supervisor: OMEGA · src/components/ · 14% complete
> **This is the highest-leverage build in the entire project.** Every hour spent here multiplies across 9 platforms. Build this before writing a single new feature page.

---

📄 **Card.tsx** 🔨 BUILD NOW
- Path: `src/components/ui/Card.tsx`
- Layer: Shared UI
- Status: 🔨
- Utility: The canonical card component with the ecosystem pattern (6px radius, 2px gradient top border, `var(--surface)` background, `var(--border)` outline). Accepts `variant` prop (`default` | `elevated` | `ai` | `danger`). Accepts `topBorder` color prop to set the gradient start color. Every card in every layer imports this — no exceptions.
- Expert: The card pattern is currently copy-pasted in 19 files. That means 19 places to update when the design system evolves. Extract it once. Make the `::before` gradient position configurable (`top` | `left` | `right`) so that community post cards can use a left border accent while dashboard KPI cards keep the top border. This single component eliminates the most common design system inconsistency in the codebase.

---

📄 **ContextBar.tsx** 🔨 BUILD NOW
- Path: `src/components/ui/ContextBar.tsx`
- Layer: Shared UI
- Status: 🔨
- Utility: The 9-layer status strip displayed at the top of every authenticated page. Shows each platform layer with its status indicator (live/building/planned) and links to its route. Required on every single page — it is the navigation breadcrumb that reminds users they are inside a nine-platform ecosystem.
- Expert: Wire this component to `ecosystemStore` (Layer 4) so layer statuses update in real time without page refresh. A static ContextBar that always says "Core: Live" is better than nothing. A ContextBar that shows "Academy: 47 students online" is a retention and engagement signal. Build the static version now, evolve it to live data in Sprint 3.

---

📄 **SkeletonLoader.tsx** 🔨 BUILD NOW
- Path: `src/components/ui/SkeletonLoader.tsx`
- Layer: Shared UI
- Status: 🔨
- Utility: Animated shimmer placeholder displayed during data fetch. Accepts `variant` prop (`card` | `list` | `table` | `hero` | `text`). Uses `var(--surface2)` background with a shimmer animation in `var(--surface)`. Replaces every spinner in the application.
- Expert: Spinners communicate "waiting." Skeletons communicate "content is coming." User perception research consistently shows skeleton loaders reduce perceived load time by 20–30% even when actual load time is identical. Every `{isLoading && <Spinner />}` in the codebase should become `{isLoading && <SkeletonLoader variant="card" />}`. This is a single sprint sweep that materially improves the premium feel of the entire platform.

---

📄 **EmptyState.tsx** 🔨 BUILD NOW
- Path: `src/components/ui/EmptyState.tsx`
- Layer: Shared UI
- Status: 🔨
- Utility: Intelligent empty state component. Never shows "No data found." Accepts `layer` prop and `context` prop — uses them to render an AI-powered CTA. Empty community feed → "NOVA suggests 5 creators to follow based on your profile." Empty Academy dashboard → "SAGE has identified a learning path for you." Empty Work board → "CIRCUIT has found 3 jobs matching your skills."
- Expert: Each empty state is a micro-conversion opportunity. A user who sees "No jobs found" leaves. A user who sees "CIRCUIT analysed your profile and found 3 perfect contracts — here's the first one" stays and converts. Build empty states with AI-generated content from the relevant supervisor. This requires passing user context into the component, but the conversion lift justifies the complexity.

---

📄 **ProgressRing.tsx** 🔨 BUILD NOW
- Path: `src/components/ui/ProgressRing.tsx`
- Layer: Shared UI
- Status: 🔨
- Utility: SVG circular progress ring. Accepts `value` (0–100), `size`, `strokeWidth`, `color` (CSS variable string). Used for Trust Score on Work profiles, course completion on Academy, and ecosystem score on the Dashboard.
- Expert: The Trust Score ring is the most visible single element on the Work layer. It communicates decades of professional credibility in a single number. Make the ring animate on mount (counting up from 0 to the actual value over 800ms) and add a tooltip explaining what the score measures when hovered. A number without context is noise. A number with a tooltip saying "Trust Score: 87 — based on 12 Academy certificates, 24 completed contracts, and 4.9/5 client rating" is a credibility signal.

---

📄 **Badge.tsx** · **CommandPalette.tsx** · **PageHeader.tsx** · **SectionWrapper.tsx**
- Path: `src/components/ui/[component].tsx`
- Layer: Shared UI
- Status: 🔨
- Utility: **Badge** — ecosystem-consistent label chips (`live` | `building` | `planned` | `ai` | `verified` | `danger`). **CommandPalette** — ⌘K modal with fuzzy search across all routes, actions, and AI shortcuts. Loaded once in MainLayout. **PageHeader** — consistent page title + subtitle + action button slot. **SectionWrapper** — max-width container with consistent vertical spacing. Every page currently duplicates these patterns.

---

📄 **AssistantPanel.tsx** 🔨 HIGHEST PRIORITY
- Path: `src/components/ai/AssistantPanel.tsx`
- Layer: Shared AI
- Status: 🔨
- Utility: The universal AI assistant panel. Embeds in every platform layer. Accepts `assistant` prop (`aria` | `nova` | `sage` | `atlas` | `circuit` | `forge`). Connects to the named assistant endpoint, streams responses token-by-token, shows the correct avatar and personality for each supervisor, and persists conversation history via `assistantStore`. This single component wires NOVA, SAGE, ATLAS, and CIRCUIT into four platform layers simultaneously.
- Expert: **This is the single most important file to build in the entire project.** Every hour spent here is multiplied across 9 platforms. Build it with three modes: (1) floating panel (bottom-right, always visible, minimisable); (2) embedded panel (inline within a page section); (3) full-page mode (the Intelligence page). The `currentRoute` and `userContext` props must be injected so each assistant knows exactly where the user is and what they are doing. SAGE's response when a user is on a Course page and asks "help me understand this" should cite the specific course content — not give a generic learning tip.

---

📄 **FileDropZone.tsx** · **ModelSelector.tsx**
- Path: `src/components/ai/[component].tsx`
- Layer: Shared AI
- Status: 🔨
- Utility: **FileDropZone** — drag-and-drop upload component that accepts images, PDFs, audio, and video for multimodal AI analysis. Validates file type and size, shows upload progress, and passes the base64-encoded file to AssistantPanel. **ModelSelector** — dropdown to choose between AI providers (Claude / GPT-4o / Gemini / Ollama) for users on Intelligence Pro plan.

---

---

# LAYER 4 — ECOSYSTEM STATE ARCHITECTURE

> Cross-layer · AI Supervisor: OMEGA · src/stores/ · 8% complete
> **These stores are what make the platform feel like a unified ecosystem instead of 9 separate apps.** Without them, every layer is an island. With them, OMEGA's intelligence flows across the entire surface.

---

📄 **ecosystemStore.ts** 🔨 BUILD SPRINT 3
- Path: `src/stores/ecosystemStore.ts`
- Layer: Cross-platform state
- Status: 🔨
- Utility: The master ecosystem Zustand store. Tracks: layer health status for all 9 platforms (live/building/degraded), active user counts per layer, recent OMEGA events, and the current Agentic Loop state (which stage is the logged-in user in). ContextBar reads from this store to show live statuses.
- Expert: `ecosystemStore` is the nervous system of the frontend. Every layer's status update, every OMEGA event, and every cross-layer notification routes through it. Implement it as a Zustand store with a Socket.io subscription — the store opens a WebSocket connection on mount and listens for `ecosystem:status` events from the server. When OMEGA fires a cross-layer event (e.g., `academy:certificate:earned`), it emits on the WebSocket, `ecosystemStore` receives it, and any component subscribed to that event (the Work layer's job recommendation panel) re-renders automatically.

---

📄 **assistantStore.ts** 🔨 BUILD SPRINT 3
- Path: `src/stores/assistantStore.ts`
- Layer: Cross-platform state
- Status: 🔨
- Utility: Manages the active assistant session across route changes. Stores: current assistant identity, full conversation history (last 20 messages), streaming state, and suggested follow-up chips. When a user navigates from Community to Academy, their conversation with NOVA does not reset — `assistantStore` persists it so the user can pick up where they left off.
- Expert: This store is what transforms the AI assistant from a chatbot into a persistent advisor. Users who experience continuity in AI conversations have dramatically higher retention. Implement conversation persistence in `localStorage` (keyed by user ID + assistant name) so that conversation history survives page refresh and browser close. Clear history only when the user explicitly clicks "New conversation."

---

📄 **agenticLoopStore.ts** 🔨 BUILD SPRINT 3
- Path: `src/stores/agenticLoopStore.ts`
- Layer: Cross-platform state
- Status: 🔨
- Utility: Tracks the current user's position in the Agentic Loop. Stores: `currentStage` (community | learning | certification | matching | contracting | selling), `lastTrigger` (which event advanced the stage), `loopStarted` (timestamp), and `outcomeHistory` (array of completed loops with revenue impact). Powers the Dashboard loop progress tracker.
- Expert: This store is the user-facing expression of OMEGA's intelligence. Every time a user advances a stage in the loop, `agenticLoopStore` should fire a micro-celebration: a brief gold pulse animation on the loop tracker, an OMEGA notification ("You've completed Academy certification — CIRCUIT has found 3 matching contracts for you"), and an ActivityLog entry. These moments of recognition are the psychological reward system that drives continued engagement.

---

📄 **notificationStore.ts** 🔨 BUILD SPRINT 3
- Path: `src/stores/notificationStore.ts`
- Layer: Cross-platform state
- Status: 🔨
- Utility: Unified notification inbox aggregating alerts from all 9 platform layers. Stores: unread count (total and per-layer), notification list with source tags, read state. The single source of truth for the notification badge in MainLayout.
- Expert: Filter notifications by `layer` and by `priority` (OMEGA signals vs routine). An unread count of 47 is overwhelming and trains users to ignore the notification bell. Cap the badge at 9 and label anything over that as "9+". Group notifications by layer in the inbox UI — Community notifications in one section, Academy in another. This makes the inbox scannable rather than a firehose.

---

📄 **authStore.ts** · **aiStore.ts** (existing — evolve)
- Path: `src/features/auth/authStore.ts` + `src/features/ai/aiStore.ts`
- Status: ✅ (needs cross-layer evolution)
- Utility: **authStore** — JWT token management, user object, Google OAuth state, 2FA flow. **aiStore** — Claude API streaming state, insight caching.
- Expert: **authStore** must expose the user object to all other stores. Currently each store makes its own `getAuthHeaders()` call — this creates a dependency web. Add `useAuthStore.getState().user` as a shared accessor pattern and document it. **aiStore** should be refactored into `assistantStore` (Layer 4) as the platform matures — keeping them separate creates duplication.

---

---

# LAYER 5 — WINNERS COMMUNITY: BACKEND

> Phase 2 · AI Supervisor: NOVA · community.winnersempire.io · 65% complete

---

📄 **postRoutes.ts**
- Path: `Server/routes/postRoutes.ts`
- Status: ⚠️ Built — confirm wired in apiRouter
- Utility: Full social API: `POST /posts`, `GET /posts` (feed, paginated), `GET /posts/:id`, `PATCH /posts/:id`, `DELETE /posts/:id`, `POST /posts/:id/like`, `DELETE /posts/:id/like`, `POST /posts/:id/comments`, `GET /posts/:id/comments`. Emits Socket.io events on like and comment.
- Expert: Add the NOVA signal emission on `POST /posts`. When a post is created, analyse its content with a lightweight Claude API call (not streaming — synchronous, 200ms max): extract skill indicators, topic clusters, and engagement signals, then emit `nova:signal { userId, skills: [], topics: [], confidence }` to the OMEGA service. This is the entry point of the entire Agentic Loop. Without it, NOVA is blind.

---

📄 **groupRoutes.ts**
- Path: `Server/routes/groupRoutes.ts`
- Status: ✅ (confirmed in commit d48968b)
- Utility: Group CRUD, join/leave, scoped post feed, admin role management. Supports public, private, and invite-only visibility.
- Expert: Add group analytics to the group admin panel: member growth over time, engagement rate (posts per member per week), top contributors. Group analytics are the data that makes "Premium Groups" a sellable product — a creator needs to see that their group has 200 active members before they'll charge for access.

---

📄 **messageRoutes.ts** 🔨 BUILD NOW
- Path: `Server/routes/messageRoutes.ts`
- Status: 🔨 (not built)
- Utility: Direct messaging: `POST /messages`, `GET /messages/conversations`, `GET /messages/conversations/:id`, `PATCH /messages/:id/read`, real-time delivery via Socket.io `dm:message:new` event.
- Expert: Direct Messaging is the most-requested missing feature on any social platform. Its absence is felt most acutely on the Work layer — clients and freelancers need secure, on-platform messaging to negotiate contracts without leaving the ecosystem. Build it now. The Prisma schema needs three models: `Conversation` (participants array), `Message` (body, senderId, conversationId, readAt), `MessageRead` (userId, messageId). The real-time piece is a single Socket.io room per conversation ID.

---

📄 **omegaSignalService.ts** 🔨 BUILD SPRINT 3
- Path: `Server/services/omegaSignalService.ts`
- Status: 🔨 (not built)
- Utility: The backend service that processes NOVA skill signals and fires cross-layer OMEGA events. When NOVA detects a skill signal from a post, `omegaSignalService` checks the user's Academy enrollment history, determines if a course recommendation is appropriate, and emits `omega:recommend { userId, layer: 'academy', courseSlug, confidence }` via WebSocket.
- Expert: This service is the heartbeat of the Agentic Loop. It must run as a background job (via `setImmediate` or a queue like BullMQ), never in the request/response cycle — signal processing should never add latency to post creation. Start with simple heuristics (keyword matching for skill detection), evolve to Claude API classification as signal volume grows.

---

---

# LAYER 6 — WINNERS COMMUNITY: FRONTEND

> Phase 2 · AI Supervisor: NOVA · src/features/community/ · 65% complete

---

📄 **CommunityPage.tsx**
- Path: `src/features/community/CommunityPage.tsx`
- Status: 🔄 FIX REQUIRED
- Utility: Social feed with post composer, like/comment/share, tag filtering, trending posts sidebar, NOVA assistant panel (when wired), and online presence indicators.
- Expert: **Critical design system violation** — confirmed hardcoded hex colors. Fix in this sprint. Beyond the color fix, add three features that transform this from a basic feed into a creator platform: (1) rich media upload (image + video) in the post composer; (2) NOVA's "Trending in your network" sidebar — a list of 5 topics gaining traction among people the user follows; (3) the online presence dot next to avatars in real time via `ecosystemStore`.

---

📄 **GroupsPage.tsx**
- Path: `src/features/community/GroupsPage.tsx`
- Status: ✅ (confirmed in commit d48968b)
- Utility: Group discovery and management. Browse public groups, join/leave, create groups, access group feed.
- Expert: Add a "Groups recommended for you" section powered by NOVA — groups whose topic matches the user's post history and Academy interests. Cold-start recommendations (for new users with no history) fall back to the most active groups in the user's region (detected from IP on registration). Personalised group discovery is the primary driver of group growth in platforms like Facebook Groups and Discord.

---

📄 **MessagesPage.tsx** 🔨 BUILD NOW
- Path: `src/features/community/MessagesPage.tsx`
- Status: 🔨 (not built)
- Utility: DM inbox with conversation list, unread badges, and message thread view. Real-time message delivery via Socket.io. File and image sharing. Message search.
- Expert: The message thread must never show a page without content — if the thread is empty (new conversation), show NOVA's conversation starter: "Say hello to [name] — they're a [role] specialising in [skill from their profile]." This reduces the "blank page anxiety" of starting a new conversation and increases message send rate.

---

📄 **CreatorProfilePage.tsx** 🔨 BUILD NEXT SPRINT
- Path: `src/features/community/CreatorProfilePage.tsx`
- Status: 🔨 (not built — backend exists)
- Utility: Public creator profile: hero with cover image and avatar, bio, skill tags, Academy badges, post feed, follower/following counts, follow button.
- Expert: This is the public identity page of the entire ecosystem. When someone's profile is shared on Twitter/X or LinkedIn, this is what appears. Build it with Open Graph meta tags (dynamic `og:title`, `og:description`, `og:image` generated from the creator's profile data) so that shares generate rich preview cards. This single technical addition turns every profile share into a marketing impression for Winners.

---

---

# LAYER 7 — WINNERS ACADEMY: BACKEND

> Phase 3 · AI Supervisor: SAGE · learn.winnersempire.io · 45% complete

---

📄 **academyRoutes.ts**
- Path: `Server/routes/academyRoutes.ts`
- Status: ✅ (confirmed wired in commit d48968b)
- Utility: Full Academy API: course CRUD, module and lesson management, `POST /academy/courses/:slug/enroll`, `GET /academy/my-learning` (enrolled courses + progress), `POST /academy/lessons/:id/complete`, certificate generation, reviews.
- Expert: Add `POST /academy/sage/ask` — the SAGE AI tutor endpoint. Accepts `{ question, courseSlug, lessonId }`. SAGE's system prompt is pre-loaded with the course's full content (title, description, all lesson transcripts if available) so that answers are course-specific, not generic. This endpoint is what transforms Academy from a video platform into an intelligent learning system.

---

📄 **certificateService.ts** 🔨 BUILD NOW
- Path: `Server/services/certificateService.ts`
- Status: 🔨 (PDFKit installed, logic not built)
- Utility: Generates PDF certificates on course completion. Certificate contains: learner name, course name, completion date, a unique verification UUID (linked to a public verification URL), the instructor's signature line, and the Winners Ecosystem seal. Stores certificate in Cloudinary and writes the URL to the `Certificate` Prisma model.
- Expert: The certificate PDF is a marketing asset, not just a completion record. Design it to look prestigious — Cormorant Garamond font, gold seal, dark navy background, clean layout. When a user earns a certificate, they should feel like framing it. Add a QR code pointing to the public verification URL. Add a "Share on LinkedIn" direct link that pre-populates the credential fields (title, issuing organisation: Winners Academy, credential URL). LinkedIn certificate sharing drives significant inbound traffic from professional networks.

---

📄 **quizService.ts** 🔨 BUILD NOW
- Path: `Server/services/quizService.ts`
- Status: 🔨 (not built)
- Utility: Quiz engine: multiple-choice and true/false questions, minimum score threshold (configurable per course, default 70%), attempt tracking, score storage, and the gate between "lesson completed" and "certificate issued."
- Expert: Add a SAGE-powered quiz generation endpoint: `POST /academy/courses/:slug/generate-quiz`. SAGE reads the course content and auto-generates 10 questions with four answer options each. This removes the largest barrier to course creation — instructors currently need to write their own quizzes. SAGE-generated quizzes make every course instantly assessable.

---

---

# LAYER 8 — WINNERS ACADEMY: FRONTEND

> Phase 3 · AI Supervisor: SAGE · src/features/academy/ · 45% complete

---

📄 **AcademyPage.tsx** · **CoursePage.tsx** · **StudentDashboardPage.tsx**
- Path: `src/features/academy/[page].tsx`
- Status: ✅ (confirmed wired in commit d48968b)
- Utility: **AcademyPage** — course catalog with search, category filters, enrollment CTAs. **CoursePage** — video player + lesson list + progress tracking + reviews + SAGE assistant panel. **StudentDashboardPage** — enrolled courses, progress rings, certificates earned, SAGE learning recommendations.
- Expert: `CoursePage.tsx` is the most important page in the Academy layer — it is where learning happens and where retention is won or lost. Add three premium features: (1) a chapter marker system on the video player (users can jump to specific sections, which Netflix research shows increases completion rates by 18%); (2) a SAGE floating panel that opens pre-filled with the current lesson's context — so the user can ask "explain that concept differently" and SAGE knows what concept they mean; (3) a completion animation when a lesson is marked done — a brief gold pulse and progress ring update that makes completion feel rewarding.

---

📄 **InstructorDashboard.tsx** 🔨 BUILD NOW — CRITICAL
- Path: `src/features/academy/InstructorDashboard.tsx`
- Status: 🔨 CRITICAL — nothing can be published without this
- Utility: Instructor's command centre: course list, enrollment counts, revenue earned, student performance metrics, SAGE-generated insights ("3 students are struggling with Module 4"), payout history.
- Expert: Without `InstructorDashboard.tsx`, no instructor can create or manage content, which means the Academy catalog will never have courses, which means no enrollments, which means no certificates, which means the Work layer has nothing to match on. This is a hard blocker for the entire Academy → Work → Market chain. Build it in this sprint. The minimum viable version needs: course list with enrollment/revenue per course, a "Create Course" button linking to `CourseCreatePage`, and Stripe Connect payout history.

---

📄 **CourseCreatePage.tsx** 🔨 BUILD NOW — CRITICAL
- Path: `src/features/academy/CourseCreatePage.tsx`
- Status: 🔨 CRITICAL
- Utility: Course creation wizard: title, description, category, thumbnail upload, module creation, lesson upload (video via Cloudinary), quiz creation (manual or SAGE-generated), pricing (free/paid), and publish/draft toggle.
- Expert: Add a SAGE course outline generator: a text field where the instructor types their course topic, and SAGE generates a suggested module structure with lesson titles and learning objectives. This makes course creation feel effortless and produces better-structured content. The AI-assisted creation flow is the instructor acquisition hook — no other African learning platform offers it.

---

📄 **CertificatePage.tsx** · **PublicCertificatePage.tsx** 🔨 BUILD NEXT
- Path: `src/features/academy/[page].tsx`
- Status: 🔨 (not built)
- Utility: **CertificatePage** — learner's certificate gallery with download and share buttons. **PublicCertificatePage** — public verification page at `/verify/:uuid` — renders the certificate for anyone with the link, confirming its authenticity without requiring login.
- Expert: The public certificate verification page is what makes the certificate credible to employers and clients. When a freelancer on Work adds a certificate link to their profile, the client clicks it and sees a branded Winners verification page — not just a PDF download. This is the moment the Academy certificate becomes a professional credential, not just a course completion badge.

---

---

# LAYER 9 — WINNERS MARKET: BACKEND

> Phase 4 · AI Supervisor: ATLAS · shop.winnersempire.io · 0% complete

---

📄 **productRoutes.ts** 📋 PHASE 4
- Path: `Server/routes/productRoutes.ts`
- Utility: Product CRUD: `POST /products`, `GET /products` (catalog, paginated, filtered, sorted), `GET /products/:slug`, `PATCH /products/:id`, `DELETE /products/:id`. Supports digital and physical products, variants (size/colour/format), multiple images, and SEO slug generation. All queries scoped to `tenantId` for multi-tenant vendor isolation.
- Expert: Add full-text search indexing on product creation via Meilisearch. Also add `GET /products/atlas/recommendations` — when a user visits the catalog, ATLAS analyses their purchase history, community interests, and Academy skills to surface personalised product recommendations. A product catalog without personalisation is a grid. A catalog with ATLAS is a curated storefront.

---

📄 **cartRoutes.ts** 📋 PHASE 4
- Path: `Server/routes/cartRoutes.ts`
- Utility: Persistent cart: `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`, `DELETE /cart` (clear). Cart persists across sessions (stored in DB with `userId`), not just in localStorage.
- Expert: DB-persisted cart is essential for a platform with mobile plans — a user who adds items on desktop and buys on mobile needs continuity. Add `POST /cart/validate` — an endpoint that checks every cart item for current price, stock availability, and vendor active status before checkout. Stale cart items (price changed, product discontinued) are the #1 cause of checkout abandonment in commerce platforms.

---

📄 **orderRoutes.ts** 📋 PHASE 4
- Path: `Server/routes/orderRoutes.ts`
- Utility: Order lifecycle: `POST /orders/checkout` (creates Stripe Payment Intent, creates Order in PENDING state), `GET /orders` (order history), `GET /orders/:id`, `POST /orders/:id/cancel`, order status webhooks from Stripe. Handles both physical (shipping required) and digital (signed download URL on payment).
- Expert: Add automatic post-purchase community integration: when an order completes, emit a subtle social signal to the buyer's Community feed (opt-in): "Just supported [Vendor Name]'s [Product Name]." This creates social commerce loops where purchases become discovery events for other community members — a key growth mechanic for the Market layer's organic reach.

---

📄 **vendorRoutes.ts** 📋 PHASE 4
- Path: `Server/routes/vendorRoutes.ts`
- Utility: Vendor management: `POST /vendors/apply`, `GET /vendors/dashboard` (analytics, revenue, inventory), `PATCH /vendors/settings`, Stripe Connect onboarding webhook, payout history.
- Expert: The vendor application flow must check Academy certification status automatically. If the applying vendor has an E-Commerce Operator certificate from Academy, they receive the "Winners Certified Vendor" badge automatically and skip the manual review queue. This creates direct economic incentive for Academy enrollment among prospective vendors — it is the clearest expression of the cross-layer value proposition.

---

📄 **dropshippingRoutes.ts** 📋 PHASE 4 (prototype exists)
- Path: `Server/routes/dropshippingRoutes.ts`
- Utility: Dropshipping store management: Printful, Gelato, AliExpress/DSers, Spocket, Zendrop, and CJ Dropshipping API connectors. Handles product import, inventory sync, auto-fulfillment on order paid, and tracking number updates.
- Expert: The `WinnersDropshipping.jsx` prototype has the UI — it needs a real backend. Build the supplier connectors as a plugin architecture (each supplier is a module implementing a `SupplierAdapter` interface) so that adding a new supplier (e.g., Alibaba direct, Printify) requires writing one adapter file, not modifying core routes.

---

📄 **streamRoutes.ts** 📋 PHASE 4C
- Path: `Server/routes/streamRoutes.ts`
- Utility: Live streaming management: create stream (generates Mux Live Stream), manage VOD library, PPV event creation with Stripe payment gate, channel subscription management, Super Chat tipping via Stripe.
- Expert: Mux is the non-negotiable choice for streaming infrastructure — it handles adaptive bitrate, CDN, and Africa-optimised delivery via their edge network. Do not attempt to build custom streaming infrastructure. Mux's API is 30 minutes to integrate; building comparable infrastructure would take 3 months.

---

📄 **tradingRoutes.ts** · **businessRoutes.ts** · **cvRoutes.ts** 📋 PHASE 4D/4E/4F
- Path: `Server/routes/[name]Routes.ts`
- Utility: **tradingRoutes** — signal subscriptions, copy trading fund management, performance audit endpoints. **businessRoutes** — business plan generation (Claude API streaming), pitch deck outline, financial projection builder. **cvRoutes** — CV generation (Claude API streaming), ATS score checker, LinkedIn optimizer.
- Expert: The `WinnersMarketExpanded.jsx` prototype demonstrates the AI tools with frontend-only Claude API calls. **Security critical:** in production, the Claude API key must never be in the frontend. The route handlers must proxy the AI calls through the Express backend where the API key lives in environment variables. This is a required change before any market feature goes to production.

---

---

# LAYER 10 — WINNERS MARKET: FRONTEND

> Phase 4 · AI Supervisor: ATLAS · src/features/market/ · 0% complete

---

📄 **MarketPage.tsx** 📋 PHASE 4A
- Path: `src/features/market/MarketPage.tsx`
- Utility: Commerce Hub landing — product catalog with editorial-style layout, category navigation, ATLAS-personalised featured section, vendor spotlight, trending products sidebar, and search with real-time Meilisearch results.
- Expert: The first screen a user sees when entering Market sets the tone for every purchase decision. Design it as an editorial homepage, not a grid. Feature 3 products in a masonry hero section with full-bleed imagery. Below the fold, personalised "For you" section powered by ATLAS. The goal is to make Market feel like a curated boutique, not a database dump.

---

📄 **ProductPage.tsx** 📋 PHASE 4A
- Path: `src/features/market/ProductPage.tsx`
- Utility: Product detail: hero image carousel, purchase panel (price, variant selector, Add to Cart CTA, Stripe checkout), vendor trust card (badge, ratings, Academy cert), delivery estimate, reviews with aggregate rating, related products from ATLAS.
- Expert: The trust signal hierarchy on the purchase panel must be: Price → Delivery estimate → Vendor Trust Score → "Winners Certified Vendor" badge (if applicable). This order matches how buyers make decisions. A vendor with a Trust Score of 91 and a Certified Vendor badge will convert at 3× the rate of an anonymous vendor selling the same product at the same price. Make Trust Score the most visible element on the page after price.

---

📄 **VendorDashboard.tsx** 📋 PHASE 4A
- Path: `src/features/market/VendorDashboard.tsx`
- Utility: Vendor command centre: GMV, orders, conversion rate, AOV KPI cards, revenue chart (Recharts), inventory management table, ATLAS signal panel (pricing recommendations, restock alerts, trend forecasts), payout schedule, product CRUD links.
- Expert: Wire `<AssistantPanel assistant="atlas" />` into the right panel of this dashboard from day one. An ATLAS recommendation that says "Your African Fashion collection is trending in the UK diaspora market — consider a 20% price increase and a targeted Meta ad campaign this week" is worth more than all the other features combined. ATLAS's commercial intelligence is the primary value-add for vendors choosing Winners Market over Shopify.

---

📄 **CartPage.tsx** · **OrdersPage.tsx** · **WinnersDropshipping.tsx** 📋 PHASE 4A
- Path: `src/features/market/[page].tsx`
- Utility: **CartPage** — cart summary, item management, promo code, Stripe/Flutterwave checkout split (card vs mobile money). **OrdersPage** — order history with status tracking, return initiation. **WinnersDropshipping** — converted from `.jsx` prototype to production `.tsx`.
- Expert: The checkout page must be Stripe-quality — not Stripe clone quality. It must include: (1) Apple Pay / Google Pay via Stripe Payment Request Button (one-tap checkout for mobile users — eliminates the largest drop-off point in mobile commerce); (2) Flutterwave integration as a visible second option with M-Pesa, MTN MoMo payment method icons; (3) order summary on the right that updates in real time as promo codes are applied.

---

📄 **WinnersStream.tsx** 📋 PHASE 4C
- Path: `src/features/market/stream/WinnersStream.tsx`
- Utility: Live streaming player (Mux Player SDK), channel page, subscription button, Super Chat interface, scheduled events calendar.

📄 **BusinessLauncherPage.tsx** · **CVBuilderPage.tsx** 📋 PHASE 4E/4F
- Path: `src/features/market/[tool]/[page].tsx`
- Utility: **BusinessLauncherPage** — converted from `WinnersMarketExpanded.jsx`, with Business Plan Generator, Pitch Deck Outline, and Marketing Strategy tools (all Claude API streaming via backend proxy). **CVBuilderPage** — ATS-optimised CV generator, cover letter builder, LinkedIn optimizer, interview coach.

---

---

# LAYER 11 — WINNERS INTELLIGENCE: BACKEND

> Phase 5 · AI Supervisor: FORGE · ai.winnersempire.io · 35% complete

---

📄 **chatRoutes.ts**
- Path: `Server/routes/chatRoutes.ts`
- Status: ⚠️ Built — confirm wired
- Utility: Aria chatbot: `POST /chat/message` (token-by-token SSE streaming response), `POST /chat/suggest` (generates 3 follow-up chip suggestions based on conversation context). Multi-turn history (last 20 messages sent to Claude API). User context injection (name, role, workspace, recent activity per session).
- Expert: Evolve this from a single `chat` endpoint to a named assistant routing layer: `POST /chat/:assistantName/message`. The assistant name parameter selects the system prompt, personality, and available context. `POST /chat/aria/message` uses ARIA's system prompt with Core Engine context. `POST /chat/nova/message` uses NOVA's system prompt with Community context. This single routing change upgrades the platform from one AI chatbot to a nine-supervisor intelligence network.

---

📄 **aiPlatformRoutes.ts** 🔨 BUILD SPRINT 3
- Path: `Server/routes/aiPlatformRoutes.ts`
- Status: 🔨 (not built)
- Utility: Proxy layer between the Node/Express backend and the Python FastAPI AI Platform service. Handles multer file upload, validates file type and size, forwards to FastAPI with auth context, streams the response back to the client. Endpoints: `POST /ai-platform/multimodal` (any file type), `POST /ai-platform/assistants/:name/chat` (named assistants with file support).
- Expert: This route is the bridge between the TypeScript world and the Python AI world. The multer configuration must set strict file size limits (images: 10MB, PDFs: 50MB, audio: 25MB, video: 100MB) and validate MIME types before forwarding. Never trust the `Content-Type` header alone — validate file magic bytes. A malicious user uploading a script disguised as a PDF is a security risk without server-side MIME validation.

---

📄 **omegaReports.ts** 🔨 BUILD SPRINT 3
- Path: `Server/services/omegaReports.ts`
- Status: 🔨 (not built)
- Utility: Daily OMEGA briefing generation. A `node-cron` job that runs at 06:00 UTC, queries all nine layers for each user's activity data, constructs a personalised OMEGA prompt with cross-layer context, calls Claude API, and stores the result in `OmegaBriefing` table. The Dashboard fetches the latest briefing on mount.
- Expert: The OMEGA daily briefing is the platform's most powerful retention mechanic. A user who receives a personalised morning message from OMEGA that says "You completed 2 lessons yesterday. CIRCUIT found a contract matching your new skills. Your community post has 47 new reactions." will open the platform every morning. This is the habit loop that turns casual users into power users.

---

---

# LAYER 12 — WINNERS INTELLIGENCE: FRONTEND

> Phase 5 · AI Supervisor: FORGE · src/features/intelligence/ · 35% complete

---

📄 **WinnersChat.tsx**
- Path: `src/features/intelligence/WinnersChat.tsx`
- Status: ⚠️ Built — not in App.tsx routing
- Utility: Production-grade Aria chatbot. Token-by-token SSE streaming, multi-turn history (last 20 to API), smart follow-up chips, 4 ecosystem starter prompts, stop streaming, clear chat. Knows all 9 layer statuses.
- Expert: Wire immediately: `<Route path="intelligence" element={<WinnersChat />} />` in App.tsx and add nav item in MainLayout. This is the most complete undeployed feature in the codebase — it delivers no value until it is routed.

---

📄 **WinnersIntelligencePage.tsx**
- Path: `src/features/intelligence/WinnersIntelligencePage.tsx`
- Status: ⚠️ Built — not routed
- Utility: Six-agent AI dashboard with neural visualiser, per-agent interaction cards, and streaming responses from each supervisor.
- Expert: Rename to `IntelligenceDashboard.tsx` for naming consistency. Add the OMEGA daily briefing card as the primary hero element — the latest OMEGA analysis displayed as an interactive card with clickable action items. Below it, the six-agent grid. This makes Intelligence the most valuable page in the platform: the place where all cross-layer intelligence is synthesised and surfaced.

---

---

# LAYER 13 — AI PLATFORM SERVICE (PYTHON FASTAPI)

> Phase 5 · AI Supervisor: HERALD · aiplatform.winnersempire.io · 0% complete
> **This is the most technically complex layer — and the one that makes Winners Intelligence genuinely category-defining.**

---

📄 **main.py** 📋 PHASE 5
- Path: `ai-platform/main.py`
- Utility: FastAPI application entry point. Mounts the multimodal router and assistant router. Runs on port 8001. Health endpoint at `GET /health`.

📄 **routers/multimodal.py** 📋 PHASE 5
- Path: `ai-platform/routers/multimodal.py`
- Utility: `POST /api/multimodal/chat` — accepts text + optional file (image/PDF/audio/video), routes to the appropriate AI provider based on file type, streams the response back.

📄 **services/provider_router.py** 📋 PHASE 5
- Path: `ai-platform/services/provider_router.py`
- Utility: Provider selection logic: images + PDFs → Claude 3.5 Sonnet; audio → GPT-4o Whisper; video → Gemini 1.5 Pro; text-only → Ollama (free) with Claude fallback.
- Expert: This is the cost management brain of the entire AI platform. Claude API costs $3/M input tokens. Ollama costs $0. For every text-only query that can be answered locally, routing to Ollama saves real money that compounds at scale. At 10,000 users each sending 10 messages per day, smart provider routing can reduce monthly AI API costs by 60–80%.

📄 **services/assistant_context.py** 📋 PHASE 5
- Path: `ai-platform/services/assistant_context.py`
- Utility: System prompt library for all 9 AI supervisors. Each supervisor has a 500-word system prompt defining personality, capabilities, knowledge scope, and response format. OMEGA's prompt is the longest and most complex — it must know about all 9 layers and have access to the cross-layer user context.

📄 **services/ollama_client.py** · **services/claude_client.py** · **services/openai_client.py** · **services/gemini_client.py** 📋 PHASE 5
- Path: `ai-platform/services/[provider]_client.py`
- Utility: Provider-specific API wrappers. Each implements a common `async chat(messages, file_data, stream)` interface so the provider router can call any provider with identical arguments.
- Expert: Implement retry logic (3 attempts with exponential backoff) in every provider client. API failures are inevitable at scale. A user's SAGE tutoring session should never crash because Claude returned a 503 — it should silently retry, or fall back to Ollama, or show a graceful error with a retry button. Reliability is not optional for a platform handling payments.

---

---

# LAYER 14 — WINNERS WORK: BACKEND

> Phase 6 · AI Supervisor: CIRCUIT · work.winnersempire.io · 0% complete

---

📄 **jobRoutes.ts** 📋 PHASE 6
- Path: `Server/routes/jobRoutes.ts`
- Utility: Job board: `POST /jobs` (client posts listing), `GET /jobs` (browseable, filtered by skill/budget/category, sorted by CIRCUIT match score for logged-in user), `GET /jobs/:id`, `POST /jobs/:id/apply` (with proposal text), `PATCH /jobs/:id/status` (close, fill, reopen).
- Expert: The CIRCUIT match score sort is the single feature that makes Winners Work's job board feel categorically different from any competitor. Implement it as a PostgreSQL computed column or a real-time scoring service that runs asynchronously on every job list request. The score formula: Academy certificate match (40%) + skill tag overlap (30%) + work history relevance (20%) + community reputation (10%). Weights are configurable.

---

📄 **freelancerRoutes.ts** 📋 PHASE 6
- Path: `Server/routes/freelancerRoutes.ts`
- Utility: Freelancer profile management and discovery: `POST /freelancers/profile`, `GET /freelancers` (searchable, filterable by Trust Score / skill / Academy cert), `GET /freelancers/:id`, `POST /freelancers/portfolio`.
- Expert: Add `GET /freelancers/:id/trust-score-breakdown` — an endpoint that returns the detailed components of a freelancer's Trust Score (Academy certificates: X points, Work contracts: X points, Community reputation: X points). This transparency builds trust in the scoring system and gives freelancers clear actionable guidance on how to improve their score.

---

📄 **contractRoutes.ts** · **escrowRoutes.ts** 📋 PHASE 6
- Path: `Server/routes/[name]Routes.ts`
- Utility: **contractRoutes** — contract creation from accepted proposal, e-signature (DocuSign API or custom), milestone management, CIRCUIT contract review (`POST /contracts/:id/review` — CIRCUIT analyses terms, flags unusual clauses). **escrowRoutes** — fund escrow on contract sign, milestone release on client approval, dispute creation, auto-release after 72h.
- Expert: The escrow system is a regulated financial service in some jurisdictions. Before launch, consult a lawyer on whether the escrow model requires a money transmitter licence in the operating markets. Structure the escrow technically as: Stripe Payment Intent held via `capture_method: manual`, captured only on milestone approval. This is legally cleaner than pooling funds — each contract's money stays tied to its specific Payment Intent.

---

---

# LAYER 15 — WINNERS WORK: FRONTEND

> Phase 6 · AI Supervisor: CIRCUIT · src/features/work/ · 0% complete

---

📄 **WorkPage.tsx** 📋 PHASE 6
- Path: `src/features/work/WorkPage.tsx`
- Utility: Dual-mode landing: job board (client mode) and freelancer directory (hire mode). Toggle between modes. Job board sorted by CIRCUIT match score for the logged-in user. Search with skill tag filtering.

📄 **FreelancerProfilePage.tsx** 📋 PHASE 6
- Path: `src/features/work/FreelancerProfilePage.tsx`
- Utility: Premium freelancer profile — hero with cover image and avatar, Trust Score ring (ProgressRing component), CIRCUIT-generated introduction paragraph, verified skill badges from Academy, portfolio grid, work history timeline, rate and availability panel, "Hire Now" CTA.
- Expert: Build this page to the standard of a top-tier agency's talent roster. Every element exists to communicate professional credibility. The Trust Score ring is front and centre. Academy badges are gold, visually prominent, and link to the public certificate verification page. The portfolio items are large-format images with client testimonials. This page must make a client feel more confident hiring from Winners Work than from Upwork — that confidence gap is what justifies the platform commission.

---

📄 **ContractPage.tsx** · **EscrowPage.tsx** 📋 PHASE 6
- Path: `src/features/work/[page].tsx`
- Utility: **ContractPage** — contract workspace (Notion-like layout for milestone tracking, file sharing, message log). **EscrowPage** — real-time escrow status panel showing total held, released, and pending funds with milestone unlock conditions.
- Expert: The escrow indicator must be the most visually prominent element on `EscrowPage.tsx` — a large, always-visible status card with colour coding (gold = funds held safely, green = funds released, red = dispute active). For African freelancers with legitimate concerns about non-payment, seeing "USD $1,500 held in escrow, released on milestone 2 approval" is the trust signal that makes them willing to start work.

---

---

# LAYER 16 — MOBILE APP

> Phase 7 · src/mobile/ (PWA first) then mobile/WinnersAI/ (Expo) · 0% complete

---

📄 **manifest.json** · **sw.ts** (Service Worker) 📋 PHASE 7
- Path: `public/manifest.json` + `src/sw.ts`
- Utility: PWA configuration. `manifest.json` declares app name, icons, theme colour, and `start_url`. Service worker handles offline caching of the app shell and asset pre-caching for pages the user frequently visits.
- Expert: Build the PWA before touching React Native. A well-configured PWA on mobile Safari and Chrome gives 80% of the native app experience with 20% of the development cost. Focus PWA on the three highest-frequency mobile interactions: Community feed (most users check social feeds on mobile), Academy lesson watching (offline sync for commutes), and Work notifications (real-time alerts for contract activity).

---

📄 **pushNotifications.ts** 📋 PHASE 7
- Path: `Server/services/pushNotifications.ts`
- Utility: Firebase Cloud Messaging integration. Sends push notifications for: new DM, new community post from followed creator, OMEGA recommendation alert, escrow release, new job match from CIRCUIT.
- Expert: Push notification opt-in rate is directly correlated with the perceived value of the first notification. The first push notification a user receives should be an OMEGA personalised insight, not a generic "Welcome to Winners!" A first notification that says "OMEGA: Your community post is trending — 47 people engaged in the last hour" creates immediate pull-back.

---

---

# LAYER 17 — WINNERS CLOUD

> Phase 8 · NEXUS · cloud.winnersempire.io · 0% complete

---

📄 **apiKeyRoutes.ts** 📋 PHASE 8
- Path: `Server/routes/apiKeyRoutes.ts`
- Utility: Developer API key management: generate, rotate, revoke, and scope API keys to specific platform layers.

📄 **webhookRoutes.ts** 📋 PHASE 8
- Path: `Server/routes/webhookRoutes.ts`
- Utility: Outbound webhook system: developers register endpoints to receive events from any layer (`community:post:created`, `academy:certificate:issued`, `work:contract:completed`).

📄 **sdk/WinnersSDK.ts** 📋 PHASE 8 (foundation built)
- Path: `sdk/WinnersSDK.ts`
- Status: ✅ foundation ⚠️ (confirm in GitHub)
- Utility: JavaScript/TypeScript SDK for third-party developers. Wraps all public API endpoints with typed methods, handles auth, and provides stream helpers.
- Expert: The SDK is how Winners becomes infrastructure. A developer who builds a product on top of Winners Work (e.g., a specialised hiring platform for Afrobeats producers) should never have to write HTTP requests — they import `WinnersSDK` and call `sdk.work.getJobs({ category: 'music' })`. Make the SDK the best-documented part of the entire codebase. Developer experience is the product for Phase 8.

---

---

# LAYER 18 — DATABASE & MIGRATIONS

> prisma/ · All phases

---

📄 **prisma/schema.prisma**
- Path: `prisma/schema.prisma`
- Status: ✅ (Core + Community models confirmed)
- Utility: The single source of truth for the database schema. Contains all models: Tenant, User, Post, Comment, Like, Follow, Tag, Group, GroupMember, Course, Module, Lesson, Enrollment, LessonProgress, Certificate, Review, ActivityLog, ChangelogEntry, Referral, ReferralCredit, Invite, RevenueRecord, AnalyticsEvent.
- Expert: Every new phase requires adding models to this file before any route can be built. Maintain strict naming conventions: models in PascalCase, fields in camelCase, tables in snake_case (via `@@map`). Every model must have `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`. Every cross-tenant query must include `tenantId` in the WHERE clause — add a linting rule that catches any Prisma query without `tenantId` filtering.

**Models still needed (add before building each phase):**

```prisma
// Phase 4 — Market
Product, ProductVariant, ProductImage, Cart, CartItem
Order, OrderItem, OrderStatus, Vendor, VendorApplication

// Phase 4C — Stream
Stream, StreamEvent, StreamSubscription, StreamTip

// Phase 5 — Intelligence
AIInteraction, AgenticLoop, OmegaBriefing, AIConversation

// Phase 6 — Work
JobListing, JobApplication, FreelancerProfile
Portfolio, PortfolioItem, Contract, ContractMilestone
EscrowPayment, EscrowRelease, WorkReview

// Phase 8 — Cloud
APIKey, WebhookEndpoint, WebhookEvent, PluginApp
```

---

📄 **prisma/migrations/** (directory)
- Path: `prisma/migrations/`
- Status: ✅ (Core migrations confirmed, RLS migration confirmed in commit d48968b)
- Utility: Immutable migration history. Each migration is a timestamped SQL file recording every schema change. Never edit migrations after they are applied — only add new ones.
- Expert: Before Phase 4 Market launch, run a migration audit: every new model addition must include appropriate indexes. Missing indexes on `tenantId`, `userId`, `slug`, and `createdAt` columns will cause query performance degradation as data grows. Add: `@@index([tenantId])` on every multi-tenant model, `@@index([createdAt(sort: Desc)])` on any model queried with ORDER BY createdAt DESC (posts, orders, notifications), `@@unique([slug])` on Product and Course.

---

---

# LAYER 19 — DEVOPS & CONFIGURATION

---

📄 **railway.json** · **railway.toml**
- Path: Root
- Status: ✅
- Utility: Railway deployment configuration. Defines build command, start command, health check path, environment variable mapping.
- Expert: Add `healthcheckPath: "/health"` and `healthcheckTimeout: 30` to Railway config. Add restart policy `on_failure` with maximum 3 retries. Configure Railway's autoscaling to spin up a second instance when CPU exceeds 70% — this prevents Community WebSocket spikes (from a viral post) from degrading the Academy and Market layers that share the same server process.

---

📄 **.github/workflows/db-backup.yml**
- Path: `.github/workflows/db-backup.yml`
- Status: ✅ (confirmed in commit d48968b)
- Utility: Automated daily PostgreSQL backup via GitHub Actions. Dumps the Railway database to an S3 bucket or GitHub Artifacts.
- Expert: Verify the backup restoration procedure quarterly. A backup you have never tested restoring from is not a backup — it is a false sense of security. Add a monthly "restore drill" GitHub Action that: creates a new Railway PostgreSQL instance, restores the latest backup, runs a smoke test query, then tears down the test instance. This ensures the backup is genuinely recoverable.

---

📄 **vitest.config.ts** · **tests/** (directory) 🔨 BUILD SPRINT 2
- Path: `vitest.config.ts` + `tests/`
- Status: 🔨 (zero test files currently)
- Utility: Test configuration and test suite. Unit tests for service logic, integration tests for API routes, E2E tests for critical user flows (registration, course enrollment, checkout).
- Expert: Start with three test files that cover the highest-risk code paths: (1) `tests/auth.test.ts` — registration, login, token refresh, 2FA enable/verify; (2) `tests/billing.test.ts` — Stripe webhook handler with mock events for `invoice.paid` and `subscription.deleted`; (3) `tests/academy.test.ts` — course enrollment, progress tracking, certificate generation. Zero tests means every deploy is a gamble. These three files reduce the most financially dangerous regressions to zero.

---

---

# EXPERT SUMMARY — THE 10 HIGHEST-LEVERAGE ACTIONS

These are ranked by combined impact on platform quality, revenue, and engineering discipline. Do these before anything else.

| Rank | Action | File(s) | Impact | Sprint |
|---|---|---|---|---|
| 1 | Build `AssistantPanel.tsx` | `src/components/ai/AssistantPanel.tsx` | Wires NOVA, SAGE, ATLAS, CIRCUIT simultaneously | Sprint 2 |
| 2 | Fix design system violations | `RevenueChart.tsx` + `CommunityPage.tsx` | Eliminates brand-damaging inconsistencies | Sprint 1 |
| 3 | Wire all unrouted files | `App.tsx` + `Server/index.ts` | Intelligence and Community features go live immediately | Sprint 1 |
| 4 | Build `InstructorDashboard.tsx` + `CourseCreatePage.tsx` | `src/features/academy/` | Unblocks Academy content creation — Academy → Work chain cannot function without it | Sprint 2 |
| 5 | Build `ecosystemStore.ts` | `src/stores/ecosystemStore.ts` | Cross-layer reactivity — platform feels unified, not fragmented | Sprint 3 |
| 6 | Build `messageRoutes.ts` + `MessagesPage.tsx` | Server + Frontend | Most-requested missing feature — critical for Work layer client/freelancer communication | Sprint 2 |
| 7 | Migrate `searchRoutes.ts` to Meilisearch | `Server/routes/searchRoutes.ts` | Required before Market launch — Prisma `contains` will not scale to a product catalog | Sprint 3 |
| 8 | Build `certificateService.ts` + `quizService.ts` | `Server/services/` | Certificates are the connective tissue between Academy and Work — the loop cannot close without them | Sprint 2 |
| 9 | Add `ProfilePage.tsx` cross-platform data | `src/features/profile/ProfilePage.tsx` | Unified profile with Academy badges + Trust Score is the identity layer that makes Work, Market, and Community feel connected | Sprint 2 |
| 10 | Bootstrap `vitest.config.ts` + 3 test files | `tests/` | Zero tests means every financial feature is a liability. Three files eliminate the highest-risk regressions. | Sprint 2 |

---

## The Compound Principle

Every file in this registry serves one of three functions: it produces value for users, it enables another file to produce value, or it protects the system that produces value. The files that enable other files — `AssistantPanel`, `ecosystemStore`, `ContextBar`, `Card`, `agenticLoopStore` — deserve disproportionate investment because they compound. One hour building `AssistantPanel` delivers value across nine platforms. One hour building a single product feature delivers value in one place.

Build the infrastructure before the features. Build the shared before the specific. Build the foundation before the floors. The platform that lasts is built in the correct sequence, with discipline, every time.

---

> *"The codebase is the physical expression of the vision. Every file either closes the gap or widens it."*

---

**Document:** Winners Ecosystem · Complete File Registry  
**Version:** 1.0 · March 2026  
**Scope:** 9 Layers · 9 AI Supervisors · ~180 files mapped  
**Authority:** OMEGA Architecture Intelligence Division  
**Next Review:** After Sprint 3 completion
