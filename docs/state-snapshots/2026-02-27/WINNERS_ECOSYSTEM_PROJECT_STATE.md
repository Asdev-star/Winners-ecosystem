# 🏆 WINNERS ECOSYSTEM — MASTER PROJECT STATE
### Single Source of Truth · Build Bible · Last Updated: February 27, 2026

> **Live URL:** https://winners-empire-eco.up.railway.app
> **Stack:** React 18 + TypeScript (Vite) · Node/Express · PostgreSQL (Prisma) · Railway
> **AI Core:** Anthropic Claude API · `claude-opus-4-6`
> **Vision:** Digital Sovereign Infrastructure — one account, one identity, one ecosystem
> **Overall Progress: ~35% Complete**

---

## 🧭 WHAT THIS PROJECT IS

Winners Ecosystem is a **Central Digital Operating System** — a platform-of-platforms. Six distinct digital businesses running under one unified identity, one billing engine, one AI intelligence core, and one design system. Built first for African and diaspora markets, scaling globally.

**Strategic build order:**
```
Infrastructure → Engagement → Value → Monetization → Intelligence → Scale
```

**The Agentic Loop (core value proposition):**
```
User posts in Community
        ↓
AI detects skills + interests
        ↓
Academy recommends the right course
        ↓
User earns certificate
        ↓
Work matches them to a freelance job
        ↓
Market enables them to sell products/services
        ↓
Intelligence optimizes their entire revenue strategy
        ↓
Ecosystem compounds. Loop repeats.
```

---

## 📊 PLATFORM LAYERS — MASTER SCORECARD

| # | Platform | Domain | Status | Progress | Blocking |
|---|---|---|---|---|---|
| ⬡ | Core Engine | winnersempire.io | ✅ Live | **90%** | RLS + SSO pending |
| 🧑‍🤝‍🧑 | Winners Community | community.winnersempire.io | 🔄 Building | **55%** | Not wired; Groups/DMs missing |
| 🎓 | Winners Academy | learn.winnersempire.io | 🔄 Building | **30%** | Not wired; Instructor UI missing |
| 🛒 | Winners Market | shop.winnersempire.io | 📋 Planned | **0%** | Awaiting Academy stable |
| 🤖 | Winners Intelligence | ai.winnersempire.io | 🔄 Building | **15%** | Aria built, not wired |
| 💼 | Winners Work | work.winnersempire.io | 📋 Planned | **0%** | Awaiting Market |
| 📱 | Mobile App | — | 📋 Planned | **0%** | Awaiting web stability |
| ☁️ | Winners Cloud | cloud.winnersempire.io | 📋 Planned | **0%** | Awaiting all platforms |

---

## 🎨 DESIGN SYSTEM — NON-NEGOTIABLE RULES

### Code Rules

- ❌ **NEVER** use Tailwind classes
- ❌ **NEVER** hardcode hex colors
- ✅ **ALWAYS** use CSS variables only
- ✅ CSS injected via `<style>` tag inside JSX return — NOT `document.createElement`
- ✅ Card pattern: `6px border-radius` + `2px gradient top border`
- ✅ Every file: Phase + Layer comment at the top
- ✅ Every page: ecosystem context bar showing all 6 layer statuses

### CSS Variables

```css
:root {
  --gold:     #C9A84C;   /* Primary brand — CTAs, headings accent */
  --blue:     #2B5F8E;   /* Steel blue — secondary actions */
  --ice:      #89C4E1;   /* Light blue — links, active states */
  --green:    #2DD4A0;   /* Success, live status, progress */
  --red:      #E05A4E;   /* Error, danger, delete */
  --purple:   #9B6FFF;   /* AI features, forecasts, intelligence */
  --bg:       #0D1520;   /* Page background */
  --surface:  #111D2E;   /* Card background */
  --surface2: #172335;   /* Elevated surface, inputs */
  --border:   #1E3248;   /* All borders */
  --text:     #E8EEF5;   /* Primary text */
  --text-dim: #5A7A96;   /* Secondary / muted text */
}
```

### Card Pattern

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}
.card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gold), transparent);
}
```

### Typography

| Role | Font | Style |
|---|---|---|
| Display headings | Cormorant Garamond, serif | weight 300–600, italic gold accents |
| Section titles | Syne, sans-serif | weight 700–800 |
| Body text | Syne, sans-serif | weight 400 |
| Labels / badges | Space Mono, monospace | 9–11px, uppercase, letter-spacing 0.1–0.2em |
| Code / metadata | Space Mono, monospace | — |

---

## ✅ PHASE 1 — CORE ENGINE (90% COMPLETE)

### Backend — Confirmed Built

```
Server/middleware/authMiddleware.ts          ✅ JWT auth + user injection
Server/middleware/securityMiddleware.ts      ✅ Helmet + rate limiting  ⚠️ Confirm in GitHub
Server/middleware/rateLimitMiddleware.ts     ✅ Per-route rate limiting
Server/routes/apiRouter.ts                  ✅ Versioned API gateway /api/v1/*  ⚠️ Confirm in GitHub
Server/routes/authRoutes.ts                 ✅ Login, register, refresh, logout
Server/routes/usersRoutes.ts                ✅ Profile, team, invite, roles
Server/routes/tenantRoutes.ts               ✅ Workspace CRUD, settings, members
Server/routes/analyticsRoutes.ts            ✅ Revenue, activity, forecast, summary
Server/routes/billingRoutes.ts              ✅ Stripe + LemonSqueezy
Server/routes/stripeRoutes.ts               ✅ Checkout, portal, webhooks
Server/routes/emailRoutes.ts                ✅ 5 email types via Resend
Server/routes/notificationRoutes.ts         ✅ In-app notifications
Server/routes/referralRoutes.ts             ✅ Codes, credits, leaderboard
Server/routes/activityRoutes.ts             ✅ Audit log
Server/routes/searchRoutes.ts               ✅ Global search (⌘K + /search)
Server/routes/exportRoutes.ts               ✅ CSV, PDF, Excel, JSON
Server/routes/changelogRoutes.ts            ✅ What's New system
Server/routes/aiRoutes.ts                   ✅ Claude API recommendations + SSE stream
Server/routes/twoFactorRoutes.ts            ✅ TOTP + Email OTP + backup codes
Server/routes/adminRoutes.ts                ✅ Super admin — tenants/users/revenue
Server/routes/healthRoutes.ts               ✅ Health monitoring  ⚠️ Confirm in GitHub
Server/routes/gdprRoutes.ts                 ✅ GDPR compliance layer  ⚠️ Confirm in GitHub
Server/routes/slackRoutes.ts                ✅ Slack notifications (4 channels)
Server/services/emailScheduler.ts           ✅ Email report scheduler (node-cron)
Server/services/referralService.ts          ✅ Referral business logic
Server/services/wsService.ts                ✅ WebSocket service (Socket.io)
Server/services/appRegistry.ts              ✅ Platform app registry  ⚠️ Confirm in GitHub
sdk/WinnersSDK.ts                           ✅ Developer SDK foundation  ⚠️ Confirm in GitHub
prisma/schema.prisma                        ✅ Full multi-tenant schema
```

> ⚠️ **Session Drift Risk:** Files marked above were generated in prior sessions and downloaded
> locally but may not have been committed and pushed to GitHub. Verify with:
> ```bash
> find . -type f \( -name "*.ts" -o -name "*.tsx" \) | grep -v node_modules | grep -v .git | sort
> ```

### Frontend — Confirmed Built

```
src/features/dashboard/DashboardPage.tsx          ✅ Ecosystem design (self-contained)
src/features/dashboard/dashboardStore.ts          ✅ IPv6 + stale cache + fallbacks fixed
src/features/landing/LandingPage.tsx              ✅ Ecosystem design (rebuilt Feb 2026)
src/features/auth/LoginPage.tsx                   ✅ 2FA flow + Google OAuth panel
src/features/auth/ForgotPasswordPage.tsx          ✅
src/features/auth/ResetPasswordPage.tsx           ✅
src/features/auth/authStore.ts                    ✅ JWT + Google OAuth + 2FA state
src/features/onboarding/OnboardingPage.tsx        ✅ 5-step wizard
src/features/analytics/AnalyticsPage.tsx          ✅ Ecosystem design
src/features/analytics/analyticsStore.ts          ✅ Revenue + forecast + summary
src/features/analytics/components/ActivityChart.tsx    ✅
src/features/analytics/components/AIInsightPanel.tsx   ✅
src/features/analytics/components/AnalyticsSummary.tsx ✅ Rebuilt — zero Tailwind, sparklines
src/features/analytics/components/RevenueChart.tsx     ❌ Hardcoded colors — fix pending
src/features/activity/ActivityPage.tsx            ✅
src/features/activity/ActivityWidget.tsx          ✅
src/features/admin/AdminPage.tsx                  ✅
src/features/ai/AIRecommendationCard.tsx          ✅
src/features/billing/BillingPage.tsx              ✅
src/features/team/TeamPage.tsx                    ✅
src/features/team/inviteStore.ts                  ✅
src/features/profile/ProfilePage.tsx              ✅
src/features/settings/SettingsPage.tsx            ✅
src/features/changelog/ChangelogPage.tsx          ✅
src/features/theme/themeStore.ts                  ✅ Dark/light toggle
src/components/layout/MainLayout.tsx              ✅ Sidebar + bottom nav
```

### Phase 1 — Still Pending

- [ ] PostgreSQL RLS (Row Level Security) policies — migration needed
- [ ] SSO system (one login → all subdomains) — architecture design needed
- [ ] Backup automation — Railway config
- [ ] `tenantId` scoping on post edit/delete — known security gap, fix before Phase 3
- [ ] `npm install express-rate-limit helmet` — required for securityMiddleware if not installed
- [ ] `npx prisma migrate dev --name add_gdpr_privacy_ack` — required for GDPR table

---

## 🔄 PHASE 2 — WINNERS COMMUNITY (55% COMPLETE)

### Built

```
Server/routes/postRoutes.ts                        ✅ Full social API (posts, likes, comments, follows)
Server/services/wsService.ts                       ✅ WebSocket server (Socket.io)
src/features/community/CommunityPage.tsx           ✅ Feed, posts, likes, comments, tags
src/features/realtime/useRealtimeNotifications.ts  ✅ WebSocket hook  ⚠️ Confirm in GitHub
src/features/ui/toast.ts                           ✅ Toast notifications
prisma schema: Post, Comment, Like, Follow, Tag, PostTag  ✅
```

### ⚠️ Critical — Not Wired Yet

```typescript
// Server/index.ts — ADD:
import postRoutes from "./routes/postRoutes.js";
app.use("/posts", postRoutes);

// src/App.tsx — ADD:
import CommunityPage from "./features/community/CommunityPage";
<Route path="community" element={<CommunityPage />} />

// src/components/layout/MainLayout.tsx — ADD:
{ path: '/community', icon: '🧑‍🤝‍🧑', label: 'Community' }
```

```bash
npx prisma db push && npx prisma generate
```

### V1.1 — Real-Time (Partially Built)

- ✅ `wsService.ts` — WebSocket server
- ✅ `useRealtimeNotifications.ts` — frontend hook
- ✅ `postRoutes.ts` emits events on like/comment
- [ ] Online presence indicator in CommunityPage UI
- [ ] Live feed update (new posts without page refresh)
- [ ] Real-time notification badge in sidebar

### V1.2 — Groups (Not Started)

- [ ] Prisma schema: `Group`, `GroupMember`, `GroupPost`
- [ ] `groupRoutes.ts` — CRUD, join/leave, scoped feed
- [ ] `GroupsPage.tsx` — list + create groups
- [ ] Group admin roles (owner, moderator, member)
- [ ] Public / private / invite-only visibility
- [ ] Group discovery + search, pinned posts

### V1.3 — Direct Messaging (Not Started)

- [ ] Prisma schema: `Conversation`, `Message`, `MessageRead`
- [ ] `messageRoutes.ts` — send, read, mark read
- [ ] Real-time delivery via WebSocket
- [ ] `MessagesPage.tsx` — inbox + conversation view
- [ ] Unread badge, file sharing, message reactions, search

### V1.4 — Creator Tools (Not Started)

- [ ] User profile pages (bio, skills, links, portfolio)
- [ ] Follow system UI (backend already exists)
- [ ] Post scheduling, tip/donation system (Stripe)
- [ ] Creator analytics (views, reach, follower growth)

### V2.0 — AI-Powered Community (Future)

- [ ] AI feed ranking algorithm (engagement signals)
- [ ] AI content moderation (flag toxic posts)
- [ ] Smart hashtag recommendations
- [ ] Trending topics engine
- [ ] AI-generated post captions from draft

### Community Monetization

| Stream | Model |
|---|---|
| Creator subscriptions | 10–15% platform cut |
| Boosted posts | Pay-per-boost |
| Premium groups | 20% platform cut |
| Community ads | Targeted, non-intrusive |
| Digital tipping | During live content |

---

## 🔄 PHASE 3 — WINNERS ACADEMY (30% COMPLETE)

### Built

```
Server/routes/academyRoutes.ts              ✅ Full API — courses, modules, lessons,
                                               enrollment, progress, reviews, certificates
src/features/academy/AcademyPage.tsx        ✅ Course catalog UI
src/features/academy/CoursePage.tsx         ✅ Course player + progress tracking
prisma schema: Course, Module, Lesson, Enrollment,
               LessonProgress, Certificate, Review  ✅
```

### Known TypeScript Fixes Applied to academyRoutes.ts

- `req.user!.id` → `req.user!.userId` everywhere
- `tags` field removed (not in Prisma schema)
- Compound unique `userId_courseId` — all lookups use `findFirst` pattern
- `timeSpent`, `progress` field refs corrected to match actual schema

### ⚠️ Critical — Not Wired Yet

```typescript
// Server/index.ts — ADD:
import academyRoutes from "./routes/academyRoutes.js";
app.use("/academy", academyRoutes);

// src/App.tsx — ADD:
import AcademyPage from "./features/academy/AcademyPage";
import CoursePage  from "./features/academy/CoursePage";
<Route path="academy"                element={<AcademyPage />} />
<Route path="academy/courses/:slug"  element={<CoursePage />} />

// src/components/layout/MainLayout.tsx — ADD:
{ path: '/academy', icon: '🎓', label: 'Academy' }
```

### V1.0 — Still Needed

- [ ] `InstructorDashboard.tsx` — course creation + management UI
- [ ] `CourseCreatePage.tsx` — create/edit course form
- [ ] Stripe payment UI for paid courses (endpoint exists)
- [ ] Student dashboard (enrolled courses, progress overview)
- [ ] Video upload — Cloudinary integration
- [ ] Course thumbnail + free lesson preview

### V1.1 — Certification Engine (Not Started)

- [ ] Quiz system (multiple choice, true/false, min score gate)
- [ ] PDF certificate generation (PDFKit already installed)
- [ ] Certificate verification public page
- [ ] Skill badges on user profile
- [ ] Certificate sharing (LinkedIn, Twitter)

### V1.2 — External Integrations

- [ ] YouTube API (embed free content)
- [ ] Coursera / edX course linking
- [ ] S3 / Cloudinary file storage

### V2.0 — AI Academy (Future)

- [ ] AI tutor per course (context-aware Q&A, Claude API)
- [ ] Personalized learning path generator
- [ ] Skill gap analysis
- [ ] Auto-generated quizzes from lesson content
- [ ] Multilingual course translation (DeepL)

### Academy Monetization

| Stream | Model |
|---|---|
| Course revenue share | 70% instructor / 30% platform |
| Academy Pro subscription | $19/month = all courses |
| Certificate fees | Premium verified certs |
| Corporate training | Custom enterprise pricing |
| AI tutor add-on | Premium subscription feature |
| Instructor payout | Stripe Connect |

---

## 📋 PHASE 4 — WINNERS MARKET (0% — EXPANDED TO 10 VERTICALS)

### The Expanded Vision

Winners Market is not a single marketplace — it is **10 revenue-generating verticals** under one platform.

| # | Vertical | Phase | Priority | Revenue Model |
|---|---|---|---|---|
| 1 | 🛒 Commerce Hub | 4A | 🔴 First | 10–20% commission + vendor plans $15–49/mo |
| 2 | 📣 Digital Marketing Hub | 4B | 🔴 High | Package sales 20% + tools $29–99/mo |
| 3 | 📺 Winners Stream | 4C | 🔴 High | Subscriptions 15% + PPV + tipping 10% |
| 4 | 📋 Business Launcher | 4E | 🔴 High | AI credits + premium templates + pitch review |
| 5 | 📄 CV & Career Tools | 4F | 🔴 High | AI credits + templates + agency tools |
| 6 | 📈 Winners Trading | 4D | 🟡 Medium | Signals $49–149/mo + copy trading fee |
| 7 | 🎟 Winners Events | 4G | 🟡 Medium | Ticket 5–10% + NFT minting + sponsorship |
| 8 | 🏠 Winners Property | 4H | 🟡 Medium | Listing fees + agent subscriptions |
| 9 | 💪 Winners Health | 4I | 🟢 Later | Coach cut 20% + wellness subscriptions |
| 10 | 🏦 Winners Finance | 4J | 🟢 Later | Payments 1–2% + savings fee + BNPL |

**Build sequence:** `4A → 4B → 4C → 4E → 4F → 4D → 4G → 4H → 4I → 4J`

---

### 4A — Commerce Hub (Build First)

**Prisma schema needed:**
```prisma
Product, ProductVariant, ProductImage
Cart, CartItem
Order, OrderItem, OrderStatus
Vendor, VendorApplication
Review
```

**Backend routes needed:**
- `productRoutes.ts` — CRUD, search, filter, sort
- `cartRoutes.ts` — add/remove/update cart
- `orderRoutes.ts` — checkout, status, history
- `vendorRoutes.ts` — onboarding, dashboard, payouts

**Frontend pages needed:**
- `MarketPage.tsx` — product catalog
- `ProductPage.tsx` — detail + reviews
- `CartPage.tsx` — cart + Stripe checkout
- `OrdersPage.tsx` — order history
- `VendorDashboard.tsx` — analytics + inventory

---

### 4A V1.1 — Dropshipping Hub *(prototype built)*

**File:** `WinnersDropshipping.jsx` → convert to `src/features/market/dropshipping/WinnersDropshipping.tsx`

**6 Integrated Suppliers:**

| Supplier | Type | Delivery | Best For |
|---|---|---|---|
| 🖨️ Printful | Print-on-Demand | 7–14 days | Creator merch, branded stores |
| 🌍 Gelato | Print-on-Demand | 3–7 days | African markets, faster local delivery |
| 🏭 AliExpress + DSers | General Dropship | 10–25 days | High volume, product testing |
| 🚀 Spocket | Premium Dropship | 3–7 days | US/EU premium buyers |
| ⚡ Zendrop | Premium Dropship | 5–12 days | Health/beauty, subscription boxes |
| 🔗 CJ Dropshipping | General + Private Label | 7–20 days | African sellers, custom sourcing |

**Prisma schema needed:**
```prisma
model DropshippingStore {
  id        String        @id @default(uuid())
  tenantId  String
  name      String
  supplier  String        // printful | gelato | aliexpress | spocket | zendrop | cj
  status    String        // active | paused
  products  DropProduct[]
  orders    DropOrder[]
  createdAt DateTime      @default(now())
}

model DropProduct {
  id          String  @id
  storeId     String
  supplierId  String
  title       String
  cost        Float
  price       Float
  margin      Float
  variants    Json
  images      Json
  autoFulfill Boolean @default(true)
}

model DropOrder {
  id          String    @id
  orderId     String
  supplierRef String
  status      String
  trackingNum String?
  fulfilledAt DateTime?
}
```

**Backend routes needed:**
- `Server/routes/dropshippingRoutes.ts` — store CRUD, product import, auto-fulfillment
- `Server/routes/supplierRoutes.ts` — Printful, Gelato, AliExpress, CJ API connectors

**4 AI tools inside the module (Claude API streaming):**
- 🔍 Product Research AI — 5 winning products for any niche
- 🏪 Store Strategy AI — full 90-day launch plan
- 🤝 Supplier Finder — matches product to best supplier
- 📣 Ad Copy Generator — Facebook, TikTok, WhatsApp copy

**8 highest-potential niches (African + diaspora markets):**
African Fashion · Beauty & Skincare · Creator Merch · Home & Living · Tech Accessories · Health & Fitness · Kids & Education · Digital Products

---

### 4B — Digital Marketing Hub

- [ ] Service marketplace for marketing agencies
- [ ] Ad campaign builder (Meta, Google, TikTok APIs)
- [ ] SEO audit tool + keyword tracker
- [ ] Social media scheduler + analytics
- [ ] Email marketing automation suite
- [ ] AI copywriting assistant (Claude)
- [ ] Client reporting dashboard

### 4C — Winners Stream

- [ ] Live streaming with chat (Mux / HLS.js + WebRTC)
- [ ] VOD upload + hosting
- [ ] Pay-per-view events
- [ ] Channel subscriptions + Super Chat tipping
- [ ] Creator analytics dashboard
- [ ] Multi-quality streaming (480p / 720p / 1080p)

### 4E — Business Launcher *(AI tools prototype built)*

**File:** `WinnersMarketExpanded.jsx` → convert to `src/features/market/WinnersMarketExpanded.tsx`

**AI tools live (Claude API streaming):**
- 📋 Business Plan Generator — full investor-ready document
- 📣 Marketing Strategy — 90-day digital marketing plan
- 🎯 Pitch Deck Outline — 12-slide investor pitch structure

**Still to build (production):**
- [ ] Financial projection builder (visual charts)
- [ ] Legal templates marketplace (NDA, contracts, MOUs)
- [ ] Brand name + domain checker
- [ ] Revenue model + startup cost calculators

### 4F — CV & Career Tools *(AI tool prototype built)*

**AI tool live:** 📄 CV Generator — ATS-optimized, 15+ templates

**Still to build:**
- [ ] Visual CV builder (drag and drop)
- [ ] ATS score checker + optimization
- [ ] Cover letter AI generator
- [ ] LinkedIn profile optimizer
- [ ] Portfolio website builder
- [ ] One-click export (PDF, DOCX, JSON)

---

## 🔄 PHASE 5 — WINNERS INTELLIGENCE (15% COMPLETE)

### Built

```
Server/routes/aiRoutes.ts                            ✅ Claude API + SSE streaming insights
Server/routes/chatRoutes.ts                          ✅ Aria chatbot — /chat/message + /chat/suggest
src/features/intelligence/WinnersChat.tsx            ✅ Aria — full production chatbot component
src/features/intelligence/WinnersIntelligencePage.tsx  ✅ 6-agent AI dashboard + neural visualizer
```

### ⚠️ Critical — Not Wired Yet

```typescript
// Server/index.ts — ADD:
import chatRoutes from "./routes/chatRoutes.js";
app.use("/chat", chatRoutes);

// src/App.tsx — ADD:
import WinnersChat from "./features/intelligence/WinnersChat";
<Route path="intelligence" element={<WinnersChat />} />

// src/components/layout/MainLayout.tsx — ADD:
{ path: '/intelligence', icon: '🤖', label: 'Aria · AI' }
```

### Aria — The Ecosystem AI Chatbot (`WinnersChat.tsx`)

- Token-by-token streaming via SSE (`POST /chat/message`)
- User context injection — name, role, workspace, recent activity per session
- Smart follow-up chips generated via `POST /chat/suggest`
- 4 ecosystem starter prompts on welcome screen
- Stop streaming, clear chat, multi-turn history (last 20 messages to API)
- Knows all 6 platform layers + their live status
- Mobile responsive

### 6 Specialized Agents (`WinnersIntelligencePage.tsx`)

| Agent | Layer | Focus |
|---|---|---|
| Social Intelligence | Community | Detects skills from posts → routes to Academy + Work |
| Learning Path | Academy | 3-step personalized curriculum → earning potential |
| Commerce Intelligence | Market | Product analysis → pricing + target audience |
| Talent Matching | Work | Skills → job matches → rate recommendations |
| Core AI Orchestrator | Intelligence | Master agent coordinating all 6 layers |
| Platform Intelligence | Core | Unified recommendation spanning all platforms |

### Prisma Schema Needed

```prisma
model AIInteraction {
  id        String   @id @default(cuid())
  userId    String
  tenantId  String
  layer     String   // community | academy | market | work | intelligence | core
  agentType String
  input     String   @db.Text
  output    String   @db.Text
  tokens    Int
  latencyMs Int
  createdAt DateTime @default(now())
}

model AgenticLoop {
  id            String   @id @default(cuid())
  userId        String
  tenantId      String
  trigger       String
  steps         Json     // [{layer, action, result}]
  outcome       String   @db.Text
  revenueImpact Float?
  createdAt     DateTime @default(now())
}
```

### V1.0 — Smart Layer (Not Started)

- [ ] Semantic search across ALL platforms (Meilisearch / Elasticsearch)
- [ ] Cross-platform recommendation engine
- [ ] Unified user behavior tracking (one event stream)
- [ ] AI insights dashboard per tenant
- [ ] Predictive revenue modeling

### V2.0 — Agentic AI (Future)

- [ ] Personal AI agent per user (goal tracking, weekly summaries, draft content)
- [ ] Business AI agent per tenant (revenue health, team performance, auto-reports)
- [ ] Community monitoring agents (trending topics, content moderation)
- [ ] Academy AI tutor agents (per-course Q&A, practice exercises)
- [ ] Commerce AI assistant (pricing, inventory, customer service)
- [ ] Voice search (Whisper API)
- [ ] Multilingual interface (DeepL)

### Intelligence Monetization

| Stream | Model |
|---|---|
| AI usage credits | Pay per query / per agent action |
| Premium agents | $29/month per agent |
| Enterprise AI analytics | Custom pricing |
| API access | Usage-based for external developers |

---

## 📋 PHASE 6 — WINNERS WORK (0% COMPLETE)

### Prisma Schema Needed

```prisma
JobListing, JobApplication, JobStatus
FreelancerProfile, Portfolio, PortfolioItem
Contract, ContractMilestone
EscrowPayment, EscrowRelease
WorkReview
```

### Key Features

- [ ] Job board (post + apply)
- [ ] Freelancer profiles + portfolios
- [ ] AI skill matching — job ↔ freelancer (Intelligence layer)
- [ ] Contract system
- [ ] Escrow payment system (Stripe + Flutterwave)
- [ ] Review + rating system
- [ ] Time tracking + project management tools

### Academy → Work Connection

- Complete course → certificate → AI auto-suggests matching jobs
- Skill badges from Academy visible on freelancer profile
- "Hire graduates" employer filter
- Instructor-to-consultant pipeline

### Work Monetization

| Stream | Model |
|---|---|
| Escrow commission | 8–12% of contract value |
| Job posting | $10–50 per listing |
| Featured freelancer placement | Monthly fee |
| Enterprise hiring packages | Custom pricing |

---

## 📋 PHASE 7 — MOBILE APP (0% COMPLETE)

**Strategy: PWA first → React Native (Expo)**

- [ ] Service worker + manifest (PWA, install-to-homescreen)
- [ ] Push notifications (Firebase FCM)
- [ ] Biometric login, offline video sync
- [ ] Expo SDK — iOS + Android
- [ ] Shared Zustand stores + API layer with web

---

## 📋 PHASE 8 — WINNERS CLOUD (0% COMPLETE)

**Goal: Stop being a product. Become infrastructure.**

- [ ] Public REST API + OpenAPI/Swagger docs
- [ ] Developer portal + API key management + webhooks
- [ ] SDK packages (JS, Python, Go)
- [ ] Plugin marketplace with 30% revenue share for developers
- [ ] White-label licensing
- [ ] Enterprise SSO (SAML, Okta, Azure AD)

---

## 🗂️ COMPLETE FILE INVENTORY

### All Backend Routes

```
Server/middleware/authMiddleware.ts          ✅
Server/middleware/securityMiddleware.ts      ✅  ⚠️ Confirm in GitHub
Server/middleware/rateLimitMiddleware.ts     ✅
Server/routes/apiRouter.ts                  ✅  ⚠️ Confirm in GitHub
Server/routes/authRoutes.ts                 ✅
Server/routes/usersRoutes.ts                ✅
Server/routes/tenantRoutes.ts               ✅
Server/routes/analyticsRoutes.ts            ✅
Server/routes/billingRoutes.ts              ✅
Server/routes/stripeRoutes.ts               ✅
Server/routes/emailRoutes.ts                ✅
Server/routes/notificationRoutes.ts         ✅
Server/routes/referralRoutes.ts             ✅
Server/routes/activityRoutes.ts             ✅
Server/routes/searchRoutes.ts               ✅
Server/routes/exportRoutes.ts               ✅
Server/routes/changelogRoutes.ts            ✅
Server/routes/aiRoutes.ts                   ✅
Server/routes/twoFactorRoutes.ts            ✅
Server/routes/adminRoutes.ts                ✅
Server/routes/healthRoutes.ts               ✅  ⚠️ Confirm in GitHub
Server/routes/gdprRoutes.ts                 ✅  ⚠️ Confirm in GitHub
Server/routes/slackRoutes.ts                ✅
Server/routes/postRoutes.ts                 ✅  ⚠️ NOT wired in Server/index.ts
Server/routes/academyRoutes.ts              ✅  ⚠️ NOT wired in Server/index.ts
Server/routes/chatRoutes.ts                 🆕  ⚠️ NOT wired in Server/index.ts
Server/services/emailScheduler.ts           ✅
Server/services/referralService.ts          ✅
Server/services/wsService.ts                ✅
Server/services/appRegistry.ts              ✅  ⚠️ Confirm in GitHub
sdk/WinnersSDK.ts                           ✅  ⚠️ Confirm in GitHub
prisma/schema.prisma                        ✅
```

### All Frontend Pages

```
src/features/dashboard/DashboardPage.tsx              ✅
src/features/dashboard/dashboardStore.ts              ✅
src/features/landing/LandingPage.tsx                  ✅
src/features/auth/LoginPage.tsx                       ✅
src/features/auth/ForgotPasswordPage.tsx              ✅
src/features/auth/ResetPasswordPage.tsx               ✅
src/features/auth/authStore.ts                        ✅
src/features/onboarding/OnboardingPage.tsx            ✅
src/features/analytics/AnalyticsPage.tsx              ✅
src/features/analytics/analyticsStore.ts              ✅
src/features/analytics/components/ActivityChart.tsx        ✅
src/features/analytics/components/AIInsightPanel.tsx       ✅
src/features/analytics/components/AnalyticsSummary.tsx     ✅
src/features/analytics/components/RevenueChart.tsx         ❌ Hardcoded colors — fix needed
src/features/activity/ActivityPage.tsx                ✅
src/features/activity/ActivityWidget.tsx              ✅
src/features/admin/AdminPage.tsx                      ✅
src/features/ai/AIRecommendationCard.tsx              ✅
src/features/billing/BillingPage.tsx                  ✅
src/features/team/TeamPage.tsx                        ✅
src/features/team/inviteStore.ts                      ✅
src/features/profile/ProfilePage.tsx                  ✅
src/features/settings/SettingsPage.tsx                ✅
src/features/changelog/ChangelogPage.tsx              ✅
src/features/theme/themeStore.ts                      ✅
src/components/layout/MainLayout.tsx                  ✅
src/features/community/CommunityPage.tsx              ✅  ⚠️ NOT in App.tsx routing
src/features/realtime/useRealtimeNotifications.ts     ✅  ⚠️ Confirm in GitHub
src/features/ui/toast.ts                              ✅
src/features/academy/AcademyPage.tsx                  ✅  ⚠️ NOT in App.tsx routing
src/features/academy/CoursePage.tsx                   ✅  ⚠️ NOT in App.tsx routing
src/features/intelligence/WinnersChat.tsx             🆕  ⚠️ NOT in App.tsx routing
src/features/intelligence/WinnersIntelligencePage.tsx 🆕  ⚠️ NOT in App.tsx routing
src/features/market/WinnersMarketExpanded.jsx         🆕  Demo — convert to .tsx for production
src/features/market/dropshipping/WinnersDropshipping.jsx  🆕  Demo — convert to .tsx for production
```

---

## 🚨 CRITICAL PENDING ACTIONS

### 🔴 Do First — Wire All Routes and Pages

```typescript
// ── Server/index.ts ─────────────────────────────────────────────────────
import postRoutes    from "./routes/postRoutes.js";
import academyRoutes from "./routes/academyRoutes.js";
import chatRoutes    from "./routes/chatRoutes.js";

app.use("/posts",   postRoutes);
app.use("/academy", academyRoutes);
app.use("/chat",    chatRoutes);

// ── src/App.tsx ──────────────────────────────────────────────────────────
import CommunityPage from "./features/community/CommunityPage";
import AcademyPage   from "./features/academy/AcademyPage";
import CoursePage    from "./features/academy/CoursePage";
import WinnersChat   from "./features/intelligence/WinnersChat";

<Route path="community"             element={<CommunityPage />} />
<Route path="academy"               element={<AcademyPage />} />
<Route path="academy/courses/:slug" element={<CoursePage />} />
<Route path="intelligence"          element={<WinnersChat />} />

// ── src/components/layout/MainLayout.tsx ────────────────────────────────
{ path: '/community',    icon: '🧑‍🤝‍🧑', label: 'Community'  }
{ path: '/academy',      icon: '🎓',    label: 'Academy'     }
{ path: '/intelligence', icon: '🤖',    label: 'Aria · AI'   }
```

```bash
npx prisma db push && npx prisma generate
```

### 🔴 Resolve Session Drift — Push Missing Files to GitHub

```bash
# Run in repo root to see what's actually committed:
find . -type f \( -name "*.ts" -o -name "*.tsx" \) | grep -v node_modules | grep -v .git | sort

# Push everything:
git add .
git commit -m "sync: push all generated files from prior sessions"
git push
```

### 🟡 Next Sprint

- [ ] Fix `RevenueChart.tsx` — remove all hardcoded hex colors, use CSS variables
- [ ] Community V1.1 — online presence indicator (UI component only)
- [ ] Community V1.2 — Groups (Prisma schema + `groupRoutes.ts` + `GroupsPage.tsx`)
- [ ] Fix `tenantId` scoping on post edit/delete (security gap)
- [ ] Academy V1.0 — `InstructorDashboard.tsx` + `CourseCreatePage.tsx`
- [ ] Academy Stripe payment UI for paid courses

### 🟢 Medium Term

- [ ] Academy quiz system + PDF certificate generation (PDFKit installed)
- [ ] Academy AI tutor (Claude API with course context injection)
- [ ] Wire Academy → Community (course references in posts)
- [ ] PostgreSQL RLS policies (security hardening)

### 🔵 Phase 4 Kickoff

- [ ] Market V1.0 Core Commerce — Prisma schema + 4 backend routes
- [ ] Printful + Gelato API integration (dropshipping V1.1)
- [ ] Convert `WinnersMarketExpanded.jsx` → production `.tsx`
- [ ] Convert `WinnersDropshipping.jsx` → production `.tsx`

---

## 💰 UNIFIED MONETIZATION MODEL

| Platform | Revenue Stream | Model | MRR at Scale |
|---|---|---|---|
| Core Engine | Workspace subscriptions | FREE / PRO $29 / ENTERPRISE $99/mo | $20K–$200K |
| Community | Creator subscriptions | 10–15% platform cut | $10K–$100K |
| Academy | Course revenue share | 30% platform, 70% instructor | $15K–$150K |
| Academy | Academy Pro | $19/month = all courses | — |
| Market — Commerce | Transaction commission | 10–20% per sale | $50K–$500K |
| Market — Streaming | Subscriptions + PPV | 15% sub cut, 10% tipping | $20K–$200K |
| Market — Marketing Hub | Service packages | 20% platform cut | $15K–$150K |
| Market — Trading | Signals + copy trading | $49–149/mo | $30K–$300K |
| Market — Biz Tools | AI credits + templates | Pay-per-use | $10K–$100K |
| Intelligence | AI credits + agents | $29/month per agent | $20K–$200K |
| Work | Escrow commission | 8–12% of contract value | $15K–$150K |
| Cloud | Enterprise licensing | $500–5000/month | $10K–$500K |

**Combined potential: $1M+ ARR across all verticals at scale.**
Multiple revenue engines. Never dependent on one stream.

---

## 🔧 TECH STACK

```
Frontend:     React 18 + TypeScript + Vite
State:        Zustand
Routing:      React Router v6
Styling:      CSS variables — zero Tailwind
Charts:       Recharts
Fonts:        Syne · Space Mono · Cormorant Garamond (Google Fonts)

Backend:      Node.js + Express 5 + TypeScript
Database:     PostgreSQL (Railway managed)
ORM:          Prisma
Auth:         JWT + bcrypt + Google OAuth (Passport.js)
2FA:          OTPAuth (TOTP) + custom Email OTP
WebSockets:   Socket.io
Email:        Resend + node-cron scheduler
Payments:     Stripe + LemonSqueezy
AI:           Anthropic Claude API (Aria chatbot + AI recommendations)
Notifications: Slack API
Export:       ExcelJS + PDFKit + json2csv
Security:     Helmet + express-rate-limit
Hosting:      Railway (monorepo — frontend + backend)
```

**Planned additions:**
```
Video:        Cloudinary (now) → Mux (scale)
Search:       Meilisearch or Elasticsearch
Cache:        Redis (session + rate limiting)
Storage:      AWS S3 or Cloudflare R2
Mobile:       Expo + React Native
Monitoring:   Sentry + Railway metrics
Maps:         Mapbox (Phase 4H — property listings)
Shipping:     Shippo API (Phase 4A — dropshipping)
POD:          Printful + Gelato APIs
```

---

## 🔑 ENVIRONMENT VARIABLES (Railway)

```env
# Database
DATABASE_URL=postgresql://postgres:...@shuttle.proxy.rlwy.net:54666/railway

# Auth
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES=7d
ADMIN_EMAILS=youremail@gmail.com

# App
APP_URL=https://winners-empire-eco.up.railway.app
SERVER_URL=https://winners-empire-eco.up.railway.app
VITE_API_URL=https://winners-empire-eco.up.railway.app
NODE_ENV=production
PORT=8080

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_WEBHOOK_SECRET=...

# Communications
RESEND_API_KEY=re_...
SLACK_BOT_TOKEN=xoxb-...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Storage (when ready)
CLOUDINARY_URL=...
AWS_S3_BUCKET=...
```

---

## 🧭 EXECUTION PRINCIPLES — NON-NEGOTIABLE

1. **Core first.** If the foundation breaks, everything collapses.
2. **One layer at a time.** Community stable → Academy stable → Market → Work.
3. **Version mindset.** V1 simple → V1.1 better → V2 intelligent.
4. **Every layer connects.** Community feeds Academy. Academy feeds Market. Market feeds AI.
5. **Discipline over excitement.** No pivots. No distractions. Execute the map.
6. **Data from day one.** Every interaction tracked. AI needs data to be intelligent.
7. **Mobile last.** Web must be solid before native app.
8. **Security is not a feature.** Built into the foundation, always.
9. **Design consistency is trust.** Every page follows the design system — no exceptions.
10. **Revenue in every phase.** Each layer must have a clear monetization path before moving on.

---

## 🔮 LONG-TERM VISION (3–5 Years)

When fully executed, Winners Ecosystem is:

- A **social network** with 1M+ African/diaspora creators (Community)
- An **education system** with 10,000+ courses (Academy)
- A **commerce empire** with 10 verticals and $1M+ ARR (Market)
- A **work network** with 100,000+ freelancers (Work)
- An **AI infrastructure** every layer depends on (Intelligence)
- A **developer marketplace** where others build on the platform (Cloud)

**All unified by one AI intelligence core. One identity. One ecosystem.**

---

> *"Most founders try to build everything at once. That's how projects die.*
> *You build: Infrastructure → Engagement → Value → Monetization → Intelligence → Scale.*
> *In that order. With discipline."*

---

**Replace all previous project knowledge documents with this single file.**
**Update this file after every build session.**
*Last updated: February 27, 2026 · winners-empire-eco.up.railway.app*
