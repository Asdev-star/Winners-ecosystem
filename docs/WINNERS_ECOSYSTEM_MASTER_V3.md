# 🏆 WINNERS ECOSYSTEM — MASTER PROJECT KNOWLEDGE V3
### The Complete Build Bible · Single Source of Truth · Updated February 2026

> **Live URL:** https://winners-empire-eco.up.railway.app
> **Stack:** React + TypeScript (Vite) · Node/Express · PostgreSQL (Prisma) · Railway
> **Vision:** Digital Sovereign Infrastructure — one account, one identity, one ecosystem
> **Overall Progress:** ~35% Complete

---

## ⚡ ASSISTANT RULES — READ FIRST, ALWAYS

You are the **lead engineer** for the Winners Ecosystem project.

**Before every response:**
1. Read this document fully
2. Check what's ✅ built vs 📋 planned
3. Never contradict what's already been built

**Code rules — non-negotiable:**
- ❌ NEVER use Tailwind classes
- ❌ NEVER use hardcoded hex colors
- ✅ ALWAYS use CSS variables (`--gold`, `--blue`, `--ice`, `--green`, `--red`, `--purple`, `--bg`, `--surface`, `--surface2`, `--border`, `--text`, `--text-dim`)
- ✅ All cards: 6px border-radius + 2px gradient top border
- ✅ CSS injected via `<style>` tag directly in JSX return (NOT `document.createElement`)
- ✅ Fonts: Syne (body) · Space Mono (monospace labels) · Cormorant Garamond (display headings)
- ✅ Every file must state Phase and Layer in a comment at the top
- ✅ Every page must have an ecosystem context bar showing layer status

---

## 🎨 DESIGN SYSTEM — COMPLETE REFERENCE

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

### Card Pattern (use on every card)
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

### Typography Scale
```
Display headings   → Cormorant Garamond, serif, weight 300–600, italic gold accents
Section titles     → Syne, sans-serif, weight 700–800
Body text          → Syne, sans-serif, weight 400
Labels / badges    → Space Mono, monospace, 9–11px, letter-spacing 0.1–0.2em, uppercase
Code / metadata    → Space Mono, monospace
```

### Context Bar Pattern (required on every page)
```tsx
<div style={{ display:'flex', gap:8, marginBottom:22, flexWrap:'wrap' }}>
  <span className="ctx-badge live">⬡ Core Engine</span>
  <span className="ctx-sep">›</span>
  <span className="ctx-badge active">🧑‍🤝‍🧑 Community</span>
  <span className="ctx-sep">›</span>
  <span className="ctx-badge planned">🎓 Academy</span>
</div>
```

---

## 🏗 ARCHITECTURE — 6 PLATFORM LAYERS

| # | Platform | Domain | Status | Progress |
|---|---|---|---|---|
| ⬡ | Core Engine | winnersempire.io | ✅ Live | 90% |
| 🧑‍🤝‍🧑 | Winners Community | community.winnersempire.io | 🔄 Building | 55% |
| 🎓 | Winners Academy | learn.winnersempire.io | 🔄 Building | 30% |
| 🛒 | Winners Market | shop.winnersempire.io | 📋 Planned | 0% |
| 🤖 | Winners Intelligence | ai.winnersempire.io | 📋 Planned | 5% |
| 💼 | Winners Work | work.winnersempire.io | 📋 Planned | 0% |

**Expansion targets (post-V1):**
- 📱 Winners App — Mobile super app (React Native)
- ☁️ Winners Cloud — Developer platform + public API

---

## ✅ PHASE 1 — CORE ENGINE (90% COMPLETE)

### What's Built — Backend
```
Server/middleware/authMiddleware.ts         ✅ JWT auth + user injection
Server/middleware/securityMiddleware.ts     ✅ Helmet + rate limiting (IPv6 fixed)
Server/routes/authRoutes.ts               ✅ Login, register, refresh, logout
Server/routes/usersRoutes.ts              ✅ Profile, team, invite, roles
Server/routes/tenantRoutes.ts             ✅ Workspace CRUD, settings, members
Server/routes/analyticsRoutes.ts          ✅ Revenue, activity, forecast, summary
Server/routes/billingRoutes.ts            ✅ Stripe + LemonSqueezy
Server/routes/stripeRoutes.ts             ✅ Checkout, portal, webhooks
Server/routes/emailRoutes.ts              ✅ 5 email types via Resend
Server/routes/notificationRoutes.ts       ✅ In-app notifications
Server/routes/referralRoutes.ts           ✅ Codes, credits, leaderboard
Server/routes/activityRoutes.ts           ✅ Audit log
Server/routes/searchRoutes.ts             ✅ Global search
Server/routes/exportRoutes.ts             ✅ CSV, PDF, Excel, JSON
Server/routes/changelogRoutes.ts          ✅ What's new system
Server/routes/aiRoutes.ts                 ✅ Claude API recommendations
Server/routes/twoFactorRoutes.ts          ✅ TOTP + Email OTP + backup codes
Server/routes/adminRoutes.ts              ✅ Super admin — tenants/users/revenue
Server/routes/healthRoutes.ts             ✅ Health monitoring endpoints
Server/routes/gdprRoutes.ts               ✅ GDPR compliance layer
Server/routes/apiRouter.ts                ✅ Versioned API gateway /api/v1/*
Server/services/appRegistry.ts            ✅ Platform app registry
Server/services/referralService.ts        ✅ Referral business logic
Server/services/wsService.ts              ✅ WebSocket service (Socket.io)
Server/middleware/rateLimitMiddleware.ts   ✅ Per-route rate limiting
sdk/WinnersSDK.ts                         ✅ Developer SDK foundation
prisma/schema.prisma                      ✅ Full multi-tenant schema
```

### What's Built — Frontend UI Pages
```
src/features/dashboard/DashboardPage.tsx       ✅ Fixed (self-contained, no store crash)
src/features/dashboard/dashboardStore.ts       ✅ Fixed (IPv6 + stale cache + fallbacks)
src/features/landing/LandingPage.tsx           ✅ Ecosystem design
src/features/auth/LoginPage.tsx                ✅ 2FA flow + Google OAuth panel
src/features/auth/ForgotPasswordPage.tsx       ✅ Ecosystem design
src/features/auth/ResetPasswordPage.tsx        ✅ Ecosystem design
src/features/analytics/AnalyticsPage.tsx       ✅ Ecosystem design
src/features/analytics/analyticsStore.ts       ✅ Revenue + forecast + summary
src/features/analytics/components/ActivityChart.tsx   ✅ Ecosystem design
src/features/analytics/components/AIInsightPanel.tsx  ✅ Ecosystem design
src/features/activity/ActivityPage.tsx         ✅ Ecosystem design
src/features/activity/ActivityWidget.tsx       ✅ Ecosystem design
src/features/admin/AdminPage.tsx               ✅ Ecosystem design
src/features/ai/AIRecommendationCard.tsx       ✅ Ecosystem design
src/features/billing/BillingPage.tsx           ✅ Ecosystem design
src/features/team/TeamPage.tsx                 ✅ Ecosystem design
src/features/team/inviteStore.ts               ✅ Team management store
src/features/profile/ProfilePage.tsx           ✅ Ecosystem design
src/features/settings/SettingsPage.tsx         ✅ Ecosystem design
src/features/onboarding/OnboardingPage.tsx     ✅ 5-step wizard
src/components/layout/MainLayout.tsx           ✅ Sidebar + bottom nav
src/features/auth/authStore.ts                 ✅ JWT + Google OAuth + 2FA
src/features/theme/themeStore.ts               ✅ Dark/light toggle
```

### Phase 1 — What's Still Pending
```
[x] PostgreSQL RLS (Row Level Security) policies    → Migration added
[x] SSO system (one login → all subdomains)         → Prep routes + config added
[x] Backup automation                               → Scheduled workflow added
[x] RevenueChart.tsx ecosystem design update        → Updated
```

### Core Engine — Expansion Opportunities
```
Future V2 additions:
→ SOC2 compliance audit trail
→ Webhooks system (send events to external URLs)
→ API key management (let users create API keys)
→ Custom domain per workspace
→ White-label theming per tenant
→ SLA monitoring + uptime guarantees
→ Data residency options (EU/US/Africa)
→ Enterprise SSO (SAML, Okta, Azure AD)
```

---

## 🔄 PHASE 2 — WINNERS COMMUNITY (55% COMPLETE)

### What's Built
```
Server/routes/postRoutes.ts                     ✅ Full social API
Server/services/wsService.ts                    ✅ WebSocket events
src/features/community/CommunityPage.tsx        ✅ Feed, posts, likes, comments
src/features/realtime/useRealtimeNotifications.ts ✅ WS hook
src/features/ui/toast.ts                        ✅ Toast notifications
prisma schema: Post, Comment, Like, Follow, Tag, PostTag  ✅

Pending in Server/index.ts:
  app.use("/posts", postRoutes);               ⚠️ Must add manually

Pending in App.tsx:
  <Route path="community" element={<CommunityPage />} />  ⚠️ Must add manually
```

### V1.1 — Real-Time (Partially Built)
```
✅ wsService.ts — WebSocket server
✅ useRealtimeNotifications.ts — Frontend hook
✅ postRoutes.ts emits events on like/comment
[ ] Online presence indicator in CommunityPage
[ ] Live feed update (new posts appear without refresh)
[ ] Real-time notification badge in sidebar
```

### V1.2 — Groups (Not Started)
```
[ ] Prisma schema: Group, GroupMember, GroupPost models
[ ] groupRoutes.ts: CRUD, join/leave, scoped feed
[ ] GroupsPage.tsx: List + create groups
[ ] GroupFeedPage.tsx: Scoped post feed
[ ] Group admin roles (owner, moderator, member)
[ ] Public / private / invite-only visibility
[ ] Group discovery + search
[ ] Group pinned posts
[ ] Group events (simple)
```

### V1.3 — Direct Messaging (Not Started)
```
[ ] Prisma schema: Conversation, Message, MessageRead models
[ ] messageRoutes.ts: Send, read, mark read
[ ] Real-time delivery via WebSocket
[ ] MessagesPage.tsx: Inbox + conversation view
[ ] Unread count badge
[ ] File/image sharing in messages
[ ] Message reactions (emoji)
[ ] Message search
```

### V1.4 — Creator Tools (Not Started)
```
[ ] User profile pages (bio, skills, links, portfolio)
[ ] Follow system UI (frontend for existing backend)
[ ] Creator pages (public-facing profile URLs)
[ ] Post scheduling (schedule + queue)
[ ] Tip / donation system (Stripe)
[ ] Creator analytics (views, reach, follower growth)
[ ] Pinned posts on profile
[ ] Content series / collections
```

### V2.0 — AI-Powered Community (Future)
```
[ ] AI feed ranking algorithm (engagement signals)
[ ] AI content moderation (flag toxic posts)
[ ] AI post suggestions (based on your history)
[ ] Smart hashtag recommendations
[ ] Sentiment analysis on posts
[ ] Trending topics engine
[ ] AI-generated post captions from draft
[ ] Similar posts recommendation
```

### Community — Monetization Features
```
[ ] Creator subscriptions (fans pay monthly)
[ ] Platform cut: 10–15% of creator subscription revenue
[ ] Boosted posts (pay to increase reach)
[ ] Premium groups (paid access)
[ ] Community ads (targeted, non-intrusive)
[ ] Creator fund / revenue sharing program
[ ] Digital tipping during live content
```

---

## 🔄 PHASE 3 — WINNERS ACADEMY (30% COMPLETE)

### What's Built
```
Server/routes/academyRoutes.ts              ✅ Full API (courses, modules, lessons,
                                               enrollment, progress, reviews, certs)
src/features/academy/AcademyPage.tsx        ✅ Course catalog UI
src/features/academy/CoursePage.tsx         ✅ Course player + progress tracking
prisma schema: Course, Module, Lesson, Enrollment,
               LessonProgress, Certificate, Review  ✅

Pending in Server/index.ts:
  app.use("/academy", academyRoutes);       ⚠️ Must add manually

Pending in App.tsx:
  <Route path="academy" element={<AcademyPage />} />
  <Route path="academy/courses/:slug" element={<CoursePage />} />  ⚠️ Must add
```

### V1.0 — Core Learning (Partially Built)
```
✅ Course creation API (instructors)
✅ Module + lesson structure
✅ Video content support (YouTube embed + direct URL)
✅ Markdown lesson content
✅ Progress tracking per lesson
✅ Auto-complete detection (100% lessons done)
✅ Auto-certificate issuance on completion
✅ Student enrollment (free)
✅ Course reviews + ratings
✅ Instructor stats dashboard (API)
✅ AcademyPage.tsx — catalog with filters
✅ CoursePage.tsx — player + sidebar progress

[ ] InstructorDashboard.tsx — UI for course management
[ ] CourseCreatePage.tsx — create/edit course UI
[ ] Stripe payment for paid courses (endpoint exists, UI missing)
[ ] Student dashboard (enrolled courses, progress overview)
[ ] Video upload (Cloudinary integration)
[ ] Course thumbnail upload
[ ] Course preview / free lesson access
```

### V1.1 — Certification Engine (Not Started)
```
[ ] Quiz system (multiple choice, true/false)
[ ] Quiz attempt tracking (pass/fail, score)
[ ] Minimum score gate before certificate
[ ] PDF certificate generation (PDFKit — already installed)
[ ] Certificate verification public page
[ ] Skill badges on user profile
[ ] Certificate sharing (LinkedIn, Twitter)
[ ] Expiry dates on certificates (optional)
[ ] Bulk certificate issuance for cohorts
```

### V1.2 — External Integrations (Not Started)
```
[ ] YouTube API (embed free public content)
[ ] Cloudinary / S3 for video uploads
[ ] Mux (professional video hosting at scale)
[ ] Coursera / edX course linking
[ ] PDF content support (lecture notes)
[ ] SCORM compliance (enterprise LMS standard)
[ ] Zoom integration (live class sessions)
```

### V2.0 — AI Academy (Future)
```
[ ] AI tutor per course (context-aware Q&A, Claude API)
[ ] Personalized learning path generator
[ ] Skill gap analysis (compare profile to job requirements)
[ ] Auto-generated quizzes from lesson content
[ ] Learning pace predictions (when will student finish?)
[ ] Weak area detection + remediation suggestions
[ ] AI course outline generator for instructors
[ ] Automatic subtitle / transcript generation
[ ] Multilingual course translation (DeepL)
```

### Academy — Monetization Features
```
[ ] Course revenue share: 70% instructor / 30% platform
[ ] Subscription model: "Academy Pro" ($X/month = all courses)
[ ] Certificate fees (premium verified certs)
[ ] Corporate training packages (bulk enrollment)
[ ] Instructor payout system (Stripe Connect)
[ ] Cohort-based courses (live, time-gated)
[ ] Enterprise learning paths (custom for companies)
[ ] White-label Academy (sell entire LMS to businesses)
```

---

## 📋 PHASE 4 — WINNERS MARKET (0% COMPLETE)

### V1.0 — Core Commerce
```
Prisma schema needed:
  Product, ProductVariant, ProductImage
  Cart, CartItem
  Order, OrderItem, OrderStatus
  Vendor, VendorApplication
  Review (product reviews)

Backend routes needed:
  productRoutes.ts     — CRUD, search, filter
  cartRoutes.ts        — Add/remove/update cart
  orderRoutes.ts       — Checkout, status, history
  vendorRoutes.ts      — Onboarding, dashboard, payouts

Frontend pages needed:
  MarketPage.tsx       — Product catalog
  ProductPage.tsx      — Product detail + reviews
  CartPage.tsx         — Cart + checkout
  OrdersPage.tsx       — Order history
  VendorDashboard.tsx  — Vendor analytics + inventory

Features:
  [ ] Product listings (digital + physical)
  [ ] Product variants (size, color, type)
  [ ] Product images (multiple, with primary)
  [ ] Search + filter + sort
  [ ] Cart system (persistent, multi-item)
  [ ] Stripe checkout (one-time + subscription products)
  [ ] Order management + status tracking
  [ ] Vendor onboarding flow
  [ ] Vendor dashboard (sales, revenue, inventory)
  [ ] Commission system (platform % per sale)
  [ ] Digital downloads (delivery via signed URL)
  [ ] Product reviews + ratings
  [ ] Wishlist system
```

### V1.1 — Dropshipping Engine
```
[ ] Printful integration (print-on-demand)
[ ] Gelato integration (global POD)
[ ] AliExpress API connector
[ ] Auto-fulfillment trigger on order paid
[ ] Inventory sync (quantity updates)
[ ] Shippo API (shipping rates + tracking)
[ ] Shipping zone configuration
[ ] Return / refund flow
```

### V1.2 — Multi-Vendor Marketplace
```
[ ] Vendor storefronts (unique URLs)
[ ] Vendor subscription plans (free / pro / enterprise)
[ ] Vendor analytics (traffic, conversion, revenue)
[ ] Vendor payout system (Stripe Connect / Flutterwave)
[ ] Vendor verification + trust badges
[ ] Vendor messaging (vendor ↔ customer)
[ ] Vendor dispute resolution system
[ ] Featured vendor program
```

### V2.0 — AI Marketplace
```
[ ] AI product recommendations per user
[ ] Smart pricing suggestions for vendors
[ ] AI product description generator
[ ] Demand forecasting (predict top sellers)
[ ] Fraud detection on orders
[ ] AI inventory management alerts
[ ] Dynamic pricing (based on demand)
[ ] Customer behavior analytics
```

### Market — Monetization Features
```
[ ] Transaction commission: 10–20% per sale
[ ] Vendor subscription plans (monthly SaaS fee)
[ ] Featured listing fees (paid promotion)
[ ] Print-on-demand margins
[ ] Affiliate commissions system
[ ] Advertising platform for vendors
[ ] Premium placement auction
```

---

## 📋 PHASE 5 — WINNERS INTELLIGENCE (5% COMPLETE)

*Foundation exists via Claude API in analytics. Full build not started.*

### V1.0 — Smart Layer
```
[ ] Semantic search across ALL platforms (Meilisearch or Elasticsearch)
[ ] Cross-platform recommendation engine
    → Read course in Academy → recommend product in Market
    → Community post about skill → suggest course in Academy
    → Freelancer completes job → recommend tools in Market
[ ] Unified user behavior tracking (one event stream, all layers)
[ ] AI insights dashboard per tenant (beyond current analytics)
[ ] Predictive revenue modeling (ML-based)
[ ] Anomaly detection across all platforms
[ ] Content scoring engine
```

### V2.0 — Agentic AI (Full Agents)
```
[ ] Personal AI agent per user
    → Tracks your goals, progress, activity
    → Proactively suggests actions
    → Summarizes your week
    → Drafts posts, emails, course outlines for you
[ ] Business AI agent per tenant
    → Revenue health monitoring
    → Team performance insights
    → Auto-generated weekly reports
    → Competitor analysis inputs
[ ] Community monitoring agents
    → Surface trending topics
    → Flag harmful content
    → Identify top contributors
    → Suggest engagement opportunities
[ ] Academy AI tutor agents (per course)
    → Answer student questions in context
    → Generate practice exercises
    → Adapt difficulty to learner pace
[ ] Commerce AI assistant
    → Pricing optimization
    → Inventory recommendations
    → Customer service bot
    → Order follow-up automation
[ ] Voice search (Whisper API)
[ ] Multilingual interface (DeepL / Google Translate)
[ ] AI content creator
    → Post captions from bullet points
    → Course outlines from topics
    → Product descriptions from specs
    → Email drafts from intent
```

### The Agentic Loop (Core Value Proposition)
```
User posts in Community
        ↓
AI analyzes content + detects skills/interests
        ↓
Recommends relevant course in Academy
        ↓
User completes course → earns certificate
        ↓
AI matches to freelance job in Winners Work
        ↓
User earns money → buys tools in Market
        ↓
AI optimizes their entire revenue strategy
        ↓
Ecosystem grows stronger. Loop repeats.
```

### Intelligence — Monetization Features
```
[ ] AI usage credits (pay per query / per agent action)
[ ] Premium AI agents (subscription tier)
[ ] Enterprise AI analytics package
[ ] API access for AI endpoints (developers)
[ ] White-label AI assistant for enterprise clients
[ ] AI-powered A/B testing service
```

---

## 📋 PHASE 6 — WINNERS WORK (0% COMPLETE)

### V1.0 — Core Work Platform
```
Prisma schema needed:
  JobListing, JobApplication, JobStatus
  FreelancerProfile, Portfolio, PortfolioItem
  Contract, ContractMilestone
  EscrowPayment, EscrowRelease
  WorkReview

Backend routes needed:
  jobRoutes.ts          — Post, apply, manage listings
  freelancerRoutes.ts   — Profiles, portfolio, search
  contractRoutes.ts     — Agreements, milestones
  escrowRoutes.ts       — Payment hold, release
  workReviewRoutes.ts   — Ratings after completion

Frontend pages needed:
  WorkPage.tsx          — Job board + freelancer search
  JobDetailPage.tsx     — Job + application form
  FreelancerPage.tsx    — Profile + portfolio
  ContractPage.tsx      — Contract management
  EscrowPage.tsx        — Payment tracking

Features:
  [ ] Job board (post + apply for jobs)
  [ ] Freelancer profiles (bio, skills, hourly rate)
  [ ] Portfolio with rich media
  [ ] AI skill matching (job ↔ freelancer)
  [ ] Proposal / bid system
  [ ] Contract creation + e-signature
  [ ] Milestone-based payments
  [ ] Escrow payment system (Stripe)
  [ ] Time tracking (built-in timer)
  [ ] Project management (tasks, deadlines)
  [ ] Review + rating system (both sides)
  [ ] Dispute resolution system
  [ ] Direct messaging between parties
```

### Academy → Work Integration (Key Value Prop)
```
[ ] Certificate → Job Match: Complete Academy course 
    → AI automatically suggests matching jobs
[ ] Skill badges on freelancer profile from Academy
[ ] "Hire graduates" filter for employers
[ ] Instructor-to-consultant pipeline
    (Academy instructors can offer 1-on-1 consulting)
```

### Work — Monetization Features
```
[ ] Job posting fees (employers pay to list)
[ ] Escrow commission: 8–12% of contract value
[ ] Featured freelancer placement
[ ] Premium profile subscription
[ ] Skill verification fees
[ ] Enterprise hiring packages
[ ] Recruitment-as-a-service tier
```

---

## 📋 PHASE 7 — MOBILE SUPER APP (0% COMPLETE)

### PWA First (Faster to Ship)
```
[ ] Progressive Web App configuration
[ ] Service worker (offline support)
[ ] Push notifications (Web Push API)
[ ] App manifest (install to home screen)
[ ] Responsive optimization audit
[ ] Mobile-specific UI patterns
```

### React Native App (After PWA)
```
[ ] Expo setup (iOS + Android)
[ ] Shared business logic with web (stores, API calls)
[ ] Native push notifications (Firebase FCM)
[ ] Biometric login (Face ID, fingerprint)
[ ] Bottom tab navigation (Community, Academy, Market, Work, AI)
[ ] Community feed (native scroll performance)
[ ] In-app course player (offline video sync)
[ ] Marketplace browsing + checkout
[ ] Real-time chat (native WebSocket)
[ ] AI assistant accessible anywhere
[ ] Deep links (winnersapp://course/slug)
[ ] App Store + Google Play submission
```

### Mobile — Technical Stack
```
Expo SDK (managed workflow)
React Navigation v6
Zustand (shared with web)
React Native Reanimated (animations)
Expo AV (video player)
Expo Notifications (push)
Expo SecureStore (token storage)
React Native Stripe SDK
```

---

## 📋 PHASE 8 — WINNERS CLOUD (0% COMPLETE)

*This is where Winners Ecosystem stops being a product and becomes infrastructure.*

### V1.0 — Developer Platform
```
[ ] Public REST API (versioned, documented)
[ ] OpenAPI / Swagger spec generation
[ ] Developer portal (docs + playground)
[ ] API key management (create, rotate, revoke)
[ ] Webhook system (subscribe to ecosystem events)
[ ] Rate limiting per API key
[ ] Usage analytics per developer
[ ] SDK packages (JavaScript, Python, Go)
[ ] OAuth2 for third-party apps
```

### V2.0 — App Ecosystem
```
[ ] Plugin marketplace (third-party add-ons)
[ ] App registry (register + publish apps)
[ ] Revenue share for developers (30% to developer)
[ ] Sandbox environment for testing
[ ] App review + approval process
[ ] Featured apps program
[ ] Enterprise app store (private apps)
[ ] App analytics dashboard
```

### V3.0 — Enterprise Platform
```
[ ] White-label licensing (sell entire ecosystem)
[ ] Custom branding per enterprise client
[ ] Dedicated infrastructure per enterprise
[ ] SLA agreements + uptime guarantees
[ ] Enterprise SSO (SAML, Okta, Azure AD)
[ ] Custom data retention policies
[ ] Priority support + dedicated account manager
[ ] Usage-based pricing (pay per seat/API call)
```

---

## 🗂 FILE STRUCTURE — COMPLETE MAP

```
winners-ecosystem/
├── Server/
│   ├── index.ts                          ← Main entry point
│   ├── db.ts                             ← Prisma client
│   ├── middleware/
│   │   ├── authMiddleware.ts             ✅
│   │   ├── securityMiddleware.ts         ✅ (IPv6 fixed)
│   │   └── rateLimitMiddleware.ts        ✅
│   ├── routes/
│   │   ├── apiRouter.ts                  ✅ /api/v1/* gateway
│   │   ├── authRoutes.ts                 ✅
│   │   ├── usersRoutes.ts               ✅
│   │   ├── tenantRoutes.ts              ✅
│   │   ├── analyticsRoutes.ts           ✅
│   │   ├── billingRoutes.ts             ✅
│   │   ├── stripeRoutes.ts              ✅
│   │   ├── emailRoutes.ts               ✅
│   │   ├── notificationRoutes.ts        ✅
│   │   ├── referralRoutes.ts            ✅
│   │   ├── activityRoutes.ts            ✅
│   │   ├── searchRoutes.ts              ✅
│   │   ├── exportRoutes.ts              ✅
│   │   ├── changelogRoutes.ts           ✅
│   │   ├── aiRoutes.ts                  ✅
│   │   ├── twoFactorRoutes.ts           ✅
│   │   ├── adminRoutes.ts               ✅
│   │   ├── healthRoutes.ts              ✅
│   │   ├── gdprRoutes.ts                ✅
│   │   ├── postRoutes.ts                ✅ (community)
│   │   └── academyRoutes.ts             ✅ (academy — register in index.ts)
│   └── services/
│       ├── appRegistry.ts               ✅
│       ├── referralService.ts           ✅
│       └── wsService.ts                 ✅
│
├── prisma/
│   └── schema.prisma                    ✅ + Academy models added
│
├── sdk/
│   └── WinnersSDK.ts                    ✅
│
└── src/
    ├── App.tsx                          ✅ (add academy routes)
    ├── main.tsx                         ✅
    ├── index.css                        ✅
    ├── app/
    │   └── ProtectedRoute.tsx           ✅
    ├── components/
    │   ├── layout/MainLayout.tsx        ✅ (add academy to nav)
    │   └── ui/TenantSwitcher.tsx        ✅
    ├── features/
    │   ├── auth/
    │   │   ├── authStore.ts             ✅
    │   │   ├── LoginPage.tsx            ✅
    │   │   ├── ForgotPasswordPage.tsx   ✅
    │   │   └── ResetPasswordPage.tsx    ✅
    │   ├── dashboard/
    │   │   ├── DashboardPage.tsx        ✅ (self-contained, fixed)
    │   │   └── dashboardStore.ts        ✅ (fixed IPv6 + fallbacks)
    │   ├── analytics/
    │   │   ├── AnalyticsPage.tsx        ✅
    │   │   ├── analyticsStore.ts        ✅
    │   │   └── components/
    │   │       ├── ActivityChart.tsx    ✅
    │   │       ├── AIInsightPanel.tsx   ✅
    │   │       └── RevenueChart.tsx     ⚠️ needs ecosystem design update
    │   ├── community/
    │   │   └── CommunityPage.tsx        ✅
    │   ├── academy/                     ← NEW FOLDER
    │   │   ├── AcademyPage.tsx          ✅ (just built)
    │   │   └── CoursePage.tsx           ✅ (just built)
    │   ├── billing/BillingPage.tsx      ✅
    │   ├── team/
    │   │   ├── TeamPage.tsx             ✅
    │   │   └── inviteStore.ts           ✅
    │   ├── profile/ProfilePage.tsx      ✅
    │   ├── settings/SettingsPage.tsx    ✅
    │   ├── onboarding/OnboardingPage.tsx ✅
    │   ├── admin/AdminPage.tsx          ✅
    │   ├── activity/
    │   │   ├── ActivityPage.tsx         ✅
    │   │   └── ActivityWidget.tsx       ✅
    │   ├── ai/AIRecommendationCard.tsx  ✅
    │   ├── landing/LandingPage.tsx      ✅
    │   ├── theme/themeStore.ts          ✅
    │   ├── realtime/
    │   │   └── useRealtimeNotifications.ts ✅
    │   └── ui/
    │       └── toast.ts                ✅
```

---

## 🔌 PENDING MANUAL WIRING (Do These Now)

### Server/index.ts — add these imports + registrations
```ts
import postRoutes    from "./routes/postRoutes.js";
import academyRoutes from "./routes/academyRoutes.js";

app.use("/posts",   postRoutes);
app.use("/academy", academyRoutes);
```

### src/App.tsx — add these routes
```tsx
import AcademyPage from "./features/academy/AcademyPage";
import CoursePage  from "./features/academy/CoursePage";

<Route path="community"              element={<CommunityPage />} />
<Route path="academy"                element={<AcademyPage />} />
<Route path="academy/courses/:slug"  element={<CoursePage />} />
```

### src/components/layout/MainLayout.tsx — add to nav
```ts
{ path: "/community", icon: "🧑‍🤝‍🧑", label: "Community" },
{ path: "/academy",   icon: "🎓",   label: "Academy"    },
```

### Database — run after schema changes
```bash
npx prisma db push
npx prisma generate
```

---

## 🔑 ENVIRONMENT VARIABLES

```env
# Database
DATABASE_URL=postgresql://postgres:...@shuttle.proxy.rlwy.net:54666/railway

# Auth
JWT_SECRET=your-secret-here
ADMIN_EMAILS=youremail@gmail.com

# Frontend
VITE_API_URL=https://winners-empire-eco.up.railway.app

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_WEBHOOK_SECRET=...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Comms
RESEND_API_KEY=re_...
SLACK_BOT_TOKEN=xoxb-...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# App
APP_URL=https://winners-empire-eco.up.railway.app
NODE_ENV=production
PORT=8080
```

---

## 💰 UNIFIED MONETIZATION MODEL

| Platform | Revenue Stream | Model |
|---|---|---|
| Core Engine | Workspace subscriptions | FREE / PRO $29 / ENTERPRISE $99 per month |
| Community | Creator subscriptions | 10–15% platform cut |
| Community | Boosted posts | Pay-per-boost |
| Community | Premium groups | 20% platform cut |
| Academy | Course sales | 30% platform cut, 70% instructor |
| Academy | Academy Pro subscription | $19/month = all courses |
| Academy | Corporate training | Custom enterprise pricing |
| Market | Transaction commission | 10–20% per sale |
| Market | Vendor subscription | $15–49/month |
| Market | Featured listings | Pay-per-feature |
| Intelligence | AI credits | Pay-per-use |
| Intelligence | Premium agents | $29/month per agent |
| Work | Escrow commission | 8–12% of contract value |
| Work | Job posting | $10–50 per listing |
| Cloud | API access | Usage-based pricing |
| Cloud | Enterprise license | $500–5000/month |

**Multiple revenue engines. Never dependent on one stream.**

---

## 📊 CURRENT PROGRESS SCORECARD

| Phase | Layer | Status | % Done | Blocking |
|---|---|---|---|---|
| 1 | Core Engine | ✅ Live | 90% | RLS, SSO pending |
| 2 | Community | 🔄 Building | 55% | Groups, DMs, Creator tools |
| 3 | Academy | 🔄 Building | 30% | Instructor UI, payments, certs |
| 4 | Market | 📋 Planned | 0% | Awaiting Academy stable |
| 5 | Intelligence | 📋 Planned | 5% | Foundation via Claude API |
| 6 | Work | 📋 Planned | 0% | Awaiting Market |
| 7 | Mobile | 📋 Planned | 0% | Awaiting web stability |
| 8 | Cloud | 📋 Planned | 0% | Awaiting all platforms |

**Overall: ~35% complete**

---

## 🧭 EXECUTION PRINCIPLES — NON-NEGOTIABLE

1. **Core first — always.** If the foundation breaks, everything collapses.
2. **One layer at a time.** Community stable → Academy stable → Market → Work.
3. **Version mindset.** V1 simple → V1.1 better → V2 intelligent.
4. **Every layer connects.** Community feeds Academy. Academy feeds Market. Market feeds AI.
5. **Discipline over excitement.** No pivots. No distractions. Execute the map.
6. **Data from day one.** Every interaction tracked. AI needs data to be intelligent.
7. **Mobile last.** Web must be solid before native app.
8. **Security is not a feature.** It's built into the foundation, always.
9. **Design consistency is trust.** Every page must follow the design system — no exceptions.
10. **Revenue in every phase.** Each layer must have a clear monetization path before moving on.

---

## 🎯 IMMEDIATE NEXT ACTIONS (Current Sprint)

### Must Do Now
```
1. [ ] Add academy + community routes to Server/index.ts
2. [ ] Add routes to App.tsx (community, academy, academy/:slug)
3. [ ] Add Academy to MainLayout.tsx sidebar nav
4. [ ] Run: npx prisma db push && npx prisma generate
5. [ ] Test Academy: create course → enroll → complete lesson → certificate
6. [ ] Build InstructorDashboard.tsx (course management UI)
7. [ ] Build CourseCreatePage.tsx (create/edit course form)
8. [ ] Fix RevenueChart.tsx (ecosystem design update — minor)
```

### After Academy V1 Stable
```
9.  [ ] Community V1.1 — Complete online presence indicator
10. [ ] Community V1.2 — Groups (Prisma schema → routes → UI)
11. [ ] Academy V1.1 — Quiz system + PDF certificates
12. [ ] Academy Stripe payment flow (endpoint exists, UI needed)
```

### Then
```
13. [ ] Winners Market V1.0 — Schema + routes + catalog + cart + checkout
14. [ ] PostgreSQL RLS policies (security hardening)
15. [ ] PWA configuration (before native app)
```

---

## 🔮 LONG-TERM VISION (3–5 Years)

When fully executed, Winners Ecosystem becomes:

- **A social network** where communities of practice grow and share knowledge
- **An education system** where skills are verified and marketable
- **A work network** where verified skills connect to real income opportunities
- **A commerce platform** where products and services are bought and sold
- **An AI infrastructure** that makes every user smarter and more productive
- **A developer marketplace** where others build extensions to the ecosystem

**All unified by one intelligence core. One account. One identity. One ecosystem.**

At full scale:
- Businesses run their entire operations inside Winners Ecosystem
- Creators monetize entirely without leaving
- Students learn, get certified, and get hired — all in one place
- Developers build extensions and earn revenue share
- Winners Ecosystem competes not with apps, but with platforms

---

## 🔧 TECH STACK REFERENCE

```
Frontend:     React 18 + TypeScript + Vite
State:        Zustand
Routing:      React Router v6
Styling:      CSS variables (zero Tailwind)
Charts:       Recharts
Fonts:        Google Fonts (Syne, Space Mono, Cormorant Garamond)

Backend:      Node.js + Express 5 + TypeScript
Database:     PostgreSQL (Railway managed)
ORM:          Prisma
Auth:         JWT + bcrypt + Google OAuth (Passport.js)
2FA:          OTPAuth (TOTP) + custom Email OTP
WebSockets:   Socket.io
Email:        Resend
Payments:     Stripe + LemonSqueezy
AI:           Anthropic Claude API
Notifications: Slack API
Export:       ExcelJS + PDFKit + json2csv
Security:     Helmet + express-rate-limit
Hosting:      Railway (monorepo — frontend + backend)
DNS/CDN:      Cloudflare (future)

Future additions:
  Video:      Cloudinary (now) → Mux (scale)
  Search:     Meilisearch or Elasticsearch
  Cache:      Redis (session + rate limiting)
  Storage:    AWS S3 or Cloudflare R2
  Mobile:     Expo + React Native
  Analytics:  Custom (built) + PostHog (future)
  Monitoring: Railway metrics + Sentry (future)
```

---

*This document is the single source of truth for the Winners Ecosystem project.*
*Update it after every build session. Every new chat reads this first.*
*Last updated: February 2026*
