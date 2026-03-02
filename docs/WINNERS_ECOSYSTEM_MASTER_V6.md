# 🏆 WINNERS ECOSYSTEM — MASTER PROJECT STATE V6

### Single Source of Truth · Build Bible · Last Updated: March 2, 2026

### Incorporates: V5 + Live Repository Corrections (PROJECT_EVOLUTION.md · commit d48968b) + Universal AI Platform Spec + Platform Design & Product Strategy Doc + Intelligence v2.0

> **Live URL:** https://winners-empire-eco.up.railway.app
> **Stack:** React 18 + TypeScript (Vite) · Node/Express · PostgreSQL (Prisma) · Railway
> **AI Core:** Anthropic Claude API · `claude-opus-4-6` · Multi-provider: Claude + GPT-4o + Gemini + Ollama (local) · faster-whisper · ComfyUI
> **Vision:** Digital Sovereign Infrastructure — one account, one identity, one ecosystem
> **Overall Progress: ~45% Complete** ⬆️ (corrected from V5 — live repo ahead of prior snapshots)
> **This document supersedes all previous versions. Replace all prior project knowledge files with this one.**

---

## ⚡ ASSISTANT RULES — READ FIRST, ALWAYS

You are the **lead engineer** for the Winners Ecosystem project.

**Before every response:**
1. Read this document fully — especially the `PROJECT_EVOLUTION` corrections in each section
2. Check what is ✅ actually live in the repo vs 📋 planned
3. Never contradict what is already built — the live repo is more advanced than older snapshots claimed
4. Follow the execution sequence — do not skip layers

**Code rules — non-negotiable:**
- ❌ NEVER use Tailwind classes
- ❌ NEVER use hardcoded hex colors
- ✅ ALWAYS use CSS variables only
- ✅ CSS injected via `<style>` tag directly in JSX return (NOT `document.createElement`)
- ✅ Card pattern: `6px border-radius` + `2px gradient top border`
- ✅ Every file: Phase + Layer comment at the top
- ✅ Every page: ecosystem context bar showing all 8+ layer statuses
- ✅ Fonts: Syne (body) · Space Mono (monospace labels) · Cormorant Garamond (display headings)
- ✅ Motion: 200ms ease transitions, entrance animations with stagger, micro-interactions on all interactive elements
- ✅ Accessibility: WCAG AA minimum, keyboard navigable, 4.5:1 contrast ratio
- ✅ Mobile-first: designed at 375px first, bottom navigation on mobile, touch targets 44px minimum

**Current repo health (commit d48968b):**
- TypeScript: `npx tsc --noEmit` → PASS (both tsconfig.app.json and tsconfig.server.json)
- Lint: 219 problems (205 errors, 14 warnings) — main clusters: `no-explicit-any`, `ban-ts-comment`, hook deps, unused vars
- Tests: 0 test files — Vitest config exists but suite not populated
- Design drift: hardcoded hex still present in some pages (e.g. CommunityPage) — needs sweep

---

## 🧭 WHAT THIS PROJECT IS

Winners Ecosystem is a **Central Digital Operating System** — a platform-of-platforms. Nine distinct layers running under one unified identity, one billing engine, one AI intelligence core, and one design system. Built first for African and diaspora markets, scaling globally.

**Mission:** To give African and diaspora communities world-class digital infrastructure — premium, purposeful tools that feel like Bloomberg Terminal meets a world-class creative studio.

**Strategic build order:**
```
Infrastructure → Engagement → Value → Monetization → Intelligence → Scale
```

**The Agentic Loop (core value proposition):**
```
User posts in Community
        ↓
NOVA (AI) detects skills + interests → flags to OMEGA
        ↓
OMEGA triggers Academy recommendation
        ↓
SAGE (AI) tutors the learner via PDF + audio → user earns certificate
        ↓
OMEGA receives certificate event → triggers Work match
        ↓
CIRCUIT (AI) matches user to job → helps write proposal
        ↓
ATLAS (AI) detects winning freelancer → offers vendor onboarding
        ↓
Market enables them to sell products/services
        ↓
OMEGA analyses full journey → optimises revenue strategy
        ↓
Ecosystem compounds. Loop repeats.
```

---

## 📊 PLATFORM LAYERS — MASTER SCORECARD

### ⚠️ Updated from live repo — more complete than V5 snapshot claimed

| # | Platform | Domain | Status | Progress | AI Supervisor | Next Blocker |
|---|---|---|---|---|---|---|
| ⬡ | Core Engine | winnersempire.io | ✅ Live | **92%** ⬆️ | ARIA | Lint cleanup + test bootstrap |
| 🧑‍🤝‍🧑 | Winners Community | community.winnersempire.io | ✅ Wired | **65%** ⬆️ | NOVA | DMs missing; creator tools missing; hardcoded hex in CommunityPage |
| 🎓 | Winners Academy | learn.winnersempire.io | ✅ Wired | **45%** ⬆️ | SAGE | Instructor UI + video upload + quiz system |
| 🛒 | Winners Market | shop.winnersempire.io | 📋 Planned | **0%** | ATLAS | Awaiting Academy stable |
| 🤖 | Winners Intelligence | ai.winnersempire.io | 🔄 Building | **35%** | FORGE | Aria wired; AI Platform implementation pending |
| 💼 | Winners Work | work.winnersempire.io | 📋 Planned | **0%** | CIRCUIT | Awaiting Market |
| 📱 | Mobile App | — | 📋 Planned | **0%** | — | Awaiting web stability |
| ☁️ | Winners Cloud | cloud.winnersempire.io | 📋 Planned | **0%** | NEXUS | Awaiting all platforms |
| 🧬 | Universal AI Platform | aiplatform.winnersempire.io | 🆕 Spec 100% | **Spec Done** | HERALD | FastAPI service implementation |

**Progress corrections from PROJECT_EVOLUTION.md (commit d48968b):**
- Community routing: `/community` and `/community/groups` are **wired in App.tsx** ✅
- Academy routing: `/academy`, `/academy/my-learning`, `/academy/courses/:slug` are **wired in App.tsx** ✅
- Backend mounts `/posts`, `/groups`, `/academy` are **wired in apiRouter.ts** ✅
- Groups: `groupRoutes.ts`, `GroupsPage.tsx`, `Group` + `GroupMember` Prisma models **exist** ✅
- Academy: `StudentDashboardPage` **exists** ✅
- RLS migration: `prisma/migrations/20260223210000_phase1_rls_policies/migration.sql` **exists** ✅
- SSO: `ssoRoutes.ts` **exists and is mounted** in apiRouter ✅
- Backup: `.github/workflows/db-backup.yml` **exists** ✅

---

## 🤖 THE 9 AI ASSISTANTS — NAMED & POSITIONED

Every platform layer has a dedicated AI supervisor. OMEGA orchestrates all of them.

| Assistant | Layer | Personality | Core Capability |
|---|---|---|---|
| 🧠 **OMEGA** | Orchestrator | Strategic, visionary, sees all patterns | Cross-layer intelligence, Agentic Loop driver, ecosystem health |
| ⬡ **ARIA** | Core Engine | Calm, precise, organised | Dashboard insights, billing help, workspace management |
| 👥 **NOVA** | Community | Warm, trend-aware, creative | Content moderation, creator growth, talent detection |
| 🎓 **SAGE** | Academy | Patient, knowledgeable, encouraging | Course tutoring, PDF analysis, lecture notes, skill guidance |
| 🛒 **ATLAS** | Market | Analytical, commercial, data-driven | Product research, pricing strategy, vendor intelligence |
| 🤖 **FORGE** | Intelligence | Technical, precise, performance-focused | Model routing, AI cost management, multimodal orchestration |
| 💼 **CIRCUIT** | Work | Professional, tactical, results-oriented | Job matching, proposal writing, contract review |
| ☁️ **NEXUS** | Cloud | Developer-focused, documentation-expert | API guidance, SDK support, integration troubleshooting |
| 🧬 **HERALD** | AI Platform | Technical, infrastructure-focused | Ollama management, GPU routing, model benchmarking |

**Supervisor Architecture:**
```
🧠 OMEGA — MASTER ORCHESTRATOR
Supervises all 8 layers · Drives the Agentic Loop · Cross-platform intelligence
        ↓  delegates to  ↓
ARIA · NOVA · SAGE · ATLAS · FORGE · CIRCUIT · NEXUS · HERALD
        ↓  each assistant receives  ↓
TEXT + IMAGES + PDFs + AUDIO + VIDEO
Claude · GPT-4o · Gemini · Ollama (local) — unified provider routing
```

---

## 🎨 DESIGN SYSTEM — NON-NEGOTIABLE RULES

### Universal Design Philosophy
Every Winners platform must communicate: **this is infrastructure built for people who are building something.** Design language: premium fintech meets a world-class creative studio — disciplined, confident, unmistakably African and diaspora.

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

### Card Pattern (every card)

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

| Role | Font | Style |
|---|---|---|
| Display headings | Cormorant Garamond, serif | weight 300–600, italic gold accents |
| Section titles | Syne, sans-serif | weight 700–800 |
| Body text | Syne, sans-serif | weight 400 |
| Labels / badges | Space Mono, monospace | 9–11px, uppercase, letter-spacing 0.1–0.2em |
| Code / metadata | Space Mono, monospace | — |

### Layout Grid
8px grid system · Max content width 1280px · Sidebar nav 260px · 24px section padding · Generous whitespace

### Premium UI Patterns — Required Across All Platforms

| Pattern | Where Used | Implementation |
|---|---|---|
| Gold gradient top border | Every card, modal, panel | `2px border-top: linear-gradient(90deg, var(--gold), transparent)` |
| Ecosystem context bar | Every page header | 8+ platform status dots — all layers linked |
| Empty states with AI prompt | Every list/feed/table when empty | Illustration + AI assistant CTA — never just 'No data found' |
| Skeleton loading | Every data-fetching component | Animated shimmer in `#172335` — no spinners |
| Command palette (⌘K) | Global — all logged-in views | Search across platform + AI commands + navigation |
| Progress rings | Profile completion, course progress | SVG rings in gold/green/ice — never plain progress bars |
| Smart tooltips | Data labels, stats, badges | Context-aware — show relevant info, not just repeating the label |
| Floating AI panel | All pages — bottom right | Minimisable assistant panel — always-on AI layer |

### Design & Creative Resources

| Resource | Type | Use Case |
|---|---|---|
| Cormorant Garamond | Font (Google Fonts) | Display headings — all 8 platforms |
| Syne | Font (Google Fonts) | Body text and section titles |
| Space Mono | Font (Google Fonts) | Data labels, code, metadata |
| Lucide Icons | Icon Library | Consistent icon set — open source |
| Framer Motion | Animation Library | Micro-interactions and page transitions |
| Radix UI | Component Primitives | Accessible, unstyled — styled with CSS vars |
| Recharts | Chart Library | All analytics visualisations |
| Figma | Design Tool | All UI design before development |
| Unsplash / Pexels | Stock Photography | African lifestyle imagery for empty states, landing pages |
| Noun Project | African Icons | Culturally relevant iconography |

### Context Bar Pattern (required on every page)

```tsx
<div style={{ display:'flex', gap:8, marginBottom:22, flexWrap:'wrap' }}>
  <span className="ctx-badge live">⬡ Core Engine</span>
  <span className="ctx-sep">›</span>
  <span className="ctx-badge active">🧑‍🤝‍🧑 Community</span>
  <span className="ctx-sep">›</span>
  <span className="ctx-badge planned">🎓 Academy</span>
  {/* ... all 8+ layers */}
</div>
```

---

## ✅ PHASE 1 — CORE ENGINE (92% COMPLETE)

### Design Aesthetic — Gold Command Centre
Dark navy base with gold accents — authoritative, premium, trusted. Data-dense but never cluttered. Animated activity feed from all 8 layers. Hero metric cards: total earnings, AI interactions, community rank, courses completed.

### Backend — Confirmed Built

```
Server/middleware/authMiddleware.ts          ✅ JWT auth + user injection
Server/middleware/securityMiddleware.ts      ✅ Helmet + rate limiting
Server/middleware/rateLimitMiddleware.ts     ✅ Per-route rate limiting
Server/routes/apiRouter.ts                  ✅ Versioned API gateway /api/v1/*
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
Server/routes/healthRoutes.ts               ✅ Health monitoring
Server/routes/gdprRoutes.ts                 ✅ GDPR compliance layer
Server/routes/slackRoutes.ts                ✅ Slack notifications (4 channels)
Server/routes/ssoRoutes.ts                  ✅ SSO prep route — mounted in apiRouter
Server/services/emailScheduler.ts           ✅ Email report scheduler (node-cron)
Server/services/referralService.ts          ✅ Referral business logic
Server/services/wsService.ts                ✅ WebSocket service (Socket.io)
Server/services/appRegistry.ts              ✅ Platform app registry
sdk/WinnersSDK.ts                           ✅ Developer SDK foundation
prisma/schema.prisma                        ✅ Full multi-tenant schema
prisma/migrations/20260223210000_phase1_rls_policies/migration.sql  ✅ RLS policies
.github/workflows/db-backup.yml             ✅ Automated backup workflow
```

### Frontend — Confirmed Built

```
src/features/dashboard/DashboardPage.tsx          ✅
src/features/dashboard/dashboardStore.ts          ✅ IPv6 + stale cache + fallbacks fixed
src/features/landing/LandingPage.tsx              ✅ Rebuilt Feb 2026
src/features/auth/LoginPage.tsx                   ✅ 2FA flow + Google OAuth
src/features/auth/ForgotPasswordPage.tsx          ✅
src/features/auth/ResetPasswordPage.tsx           ✅
src/features/auth/authStore.ts                    ✅ JWT + Google OAuth + 2FA state
src/features/onboarding/OnboardingPage.tsx        ✅ 5-step wizard
src/features/analytics/AnalyticsPage.tsx          ✅
src/features/analytics/analyticsStore.ts          ✅
src/features/analytics/components/ActivityChart.tsx    ✅
src/features/analytics/components/AIInsightPanel.tsx   ✅
src/features/analytics/components/AnalyticsSummary.tsx ✅ Rebuilt — zero Tailwind, sparklines
src/features/analytics/components/RevenueChart.tsx     ❌ Hardcoded colors — fix needed
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

### Phase 1 — Niche Features To Build

| Feature | Description | Priority |
|---|---|---|
| 📊 Wealth Dashboard | Real-time earnings across all layers — Academy royalties, Market sales, Work contracts — all in one view with charts | 🟡 Medium |
| 🏆 Achievement System | Cross-platform badges and ranks: 'Community Builder', 'Master Trader', 'Elite Freelancer'. Unlock perks at each tier | 🟡 Medium |
| 🗺️ Journey Map | Visual map showing user's path through all 8 layers — where they've been, what unlocks next | 🟡 Medium |
| 📈 Growth Insights | AI-generated weekly growth report: 'Your community following grew 18% this week. OMEGA recommends launching a course' | 🟡 Medium |
| ⚡ Quick Actions | ⌘K command palette: launch a course, post to community, create a product listing, start a contract — from anywhere | 🟡 Medium |
| 🔔 Unified Inbox | All notifications from all 8 platforms aggregated — community DMs, course messages, job offers, order updates | 🟢 Later |
| 🛡️ Trust Score | Public score from Academy certs, Work reviews, Community reputation — visible on every profile | 🟢 Later |

### Phase 1 — Remaining Pending

- [ ] Fix `RevenueChart.tsx` — remove all hardcoded hex, use CSS variables
- [ ] Lint stabilization — reduce from 219 problems; start with shared middleware + high-traffic routes
- [ ] Remove `@ts-nocheck` files — replace with typed alternatives
- [ ] First smoke tests (auth/session restore, API router mounts, academy enroll/progress)
- [ ] Design-system sweep — replace hardcoded hex with CSS variables across all Pages
- [ ] `tenantId` scoping on post edit/delete — known security gap

### Phase 1 — Products & Services

| Product | Description | Revenue Model |
|---|---|---|
| Winners Free | Basic access — community + limited AI credits | Free |
| Winners Pro Workspace | Full access + AI credits + priority support | $29/month |
| Winners Enterprise | Custom subdomain + white-label + account manager | $99/month |
| Identity Verification | KYC/ID via Stripe Identity — builds Trust Score | $4.99 one-time or bundled |
| Winners Passport | Verified professional identity badge | $9.99/year |
| Referral Programme | 20% recurring commission on referred Pro subs | Performance-based |

---

## ✅ PHASE 2 — WINNERS COMMUNITY (65% COMPLETE)

### ⚠️ More advanced than V5 claimed — routing and Groups are wired

### Design Aesthetic — Creative Professional Social
Cleaner than Twitter, warmer than LinkedIn. Creator cards with Trust Score, layer badges, follower count. Gold ring avatar border for verified/premium members. Real-time engagement counters.

### Confirmed Built — Live in Repo

```
Server/routes/postRoutes.ts                        ✅ Full social API (posts, likes, comments, follows)
Server/routes/groupRoutes.ts                       ✅ Groups API — CRUD, join/leave, scoped feed
Server/services/wsService.ts                       ✅ WebSocket server (Socket.io)
src/features/community/CommunityPage.tsx           ✅ Feed, posts, likes, comments, tags
                                                      ⚠️ Has hardcoded hex — needs design sweep
src/features/community/GroupsPage.tsx              ✅ Groups list + create (V1.2 baseline)
src/features/realtime/useRealtimeNotifications.ts  ✅ WebSocket hook
src/features/ui/toast.ts                           ✅ Toast notifications
prisma schema: Post, Comment, Like, Follow, Tag, PostTag, Group, GroupMember  ✅
App.tsx routing: /community, /community/groups     ✅ WIRED
apiRouter.ts mounts: /posts, /groups               ✅ WIRED
```

### Community Content Categories

| Category | Audience | Content Types | Monetisation Path |
|---|---|---|---|
| 🖥️ African Tech & Startups | Founders, developers, investors | Building in public, startup updates | Academy tech courses → Work freelancers |
| 🎵 Music & Afrobeats | Artists, producers, managers | Music drops, behind-the-scenes | Stream on Winners Market → sell beats |
| 💄 Beauty & Fashion | Stylists, brands, influencers | Lookbooks, tutorials, brand collabs | Market dropshipping → creator subscriptions |
| 📈 Finance & Investment | Traders, fintech founders | Market analysis, signals, education | Market trading signals → Academy finance |
| 🍽️ Food & Culture | Chefs, food bloggers | Recipes, restaurant features, heritage | Market food business → Academy culinary |
| ✈️ Diaspora Life | Africans abroad, returnees | Relocation stories, visa guides | Work remote jobs → Community mentorship |
| 🎨 Creative Arts | Illustrators, photographers | Portfolio showcases, process videos | Work portfolio → Market digital downloads |
| 💪 Health & Wellness | Fitness coaches, nutritionists | Workout content, meal plans | Academy health courses → Work coaching |

### V1.1 — Real-Time (Partially Built)

- ✅ `wsService.ts` — WebSocket server
- ✅ `useRealtimeNotifications.ts` — frontend hook
- ✅ `postRoutes.ts` emits events on like/comment
- [ ] Online presence indicator in CommunityPage UI
- [ ] Live feed update (new posts without page refresh)
- [ ] Real-time notification badge in sidebar

### V1.2 — Groups (V1 Baseline Built — Needs Expansion)

- ✅ `groupRoutes.ts` — CRUD, join/leave, scoped feed
- ✅ `GroupsPage.tsx` — list + create groups
- ✅ Prisma models: `Group`, `GroupMember`
- [ ] Group admin roles (owner, moderator, member)
- [ ] Public / private / invite-only visibility
- [ ] Predefined niche groups: `#AfricanTech`, `#DiasporaInBusiness`, `#WinnersCreators`
- [ ] GroupPost schema if not yet added

### V1.3 — Direct Messaging (Not Started)

- [ ] Prisma schema: `Conversation`, `Message`, `MessageRead`
- [ ] `messageRoutes.ts` — send, read, mark read
- [ ] Real-time delivery via WebSocket
- [ ] `MessagesPage.tsx` — inbox + conversation view
- [ ] Unread badge, file sharing, message reactions, search

### V1.4 — Creator Tools (Not Started)

| Feature | Description |
|---|---|
| 🎙️ Voice Posts | Record up to 3 minutes, NOVA auto-transcribes — perfect for thought leaders sharing insights on the go |
| 📡 Live Spaces | Twitter-Spaces-style audio rooms — host a space, invite panellists, get listeners, recorded + transcribed by NOVA |
| 🌍 Diaspora Directory | Browse members by country, skill, industry — find the Kenyan UI designer in London or the Nigerian fintech founder in Lagos |
| 🔗 Opportunity Board | Members post jobs, collabs, mentorship offers, investment interest — NOVA matches relevant profiles |
| 📊 Creator Analytics | Deep analytics: reach, impressions, follower growth, top posts, audience demographics — comparable to Instagram Insights |
| 🤝 Verified Collaborations | Formal collaboration requests — both parties agree on terms, documented in PDF, facilitated through Winners Work |
| 💎 Creator Economy | Subscription tiers — fans pay for exclusive posts, DMs, or live sessions — 10–15% platform cut |
| 🏅 Community Challenges | Weekly AI-generated challenges — best post wins credits, badges, or featured placement |

### V2.0 — AI Community — NOVA Goes Live

- [ ] NOVA wired into `CommunityPage.tsx` via `<AssistantPanel assistant="nova" />`
- [ ] NOVA analyses images in posts for brand safety
- [ ] NOVA transcribes voice posts
- [ ] NOVA detects creator talent from engagement patterns → triggers Academy recommendation
- [ ] AI feed ranking, smart hashtag recommendations, trending topics engine

### Community — Products & Services

| Product | Description | Revenue Model |
|---|---|---|
| Creator Pro Badge | Verified creator with analytics, monetisation tools | $9/month or bundled in Winners Pro |
| Paid Community Membership | Creators sell private group access | 15% platform commission |
| Sponsored Posts / Brand Deals | Connect brands with creators | 10% of deal value |
| Community Ads | Businesses advertise to specific segments | CPM-based |
| Live Space Recording | Publish as Academy lesson | Creator 70%, platform 30% |
| Diaspora Directory Premium | Enhanced business listing | $19/month |

---

## ✅ PHASE 3 — WINNERS ACADEMY (45% COMPLETE)

### ⚠️ More advanced than V5 claimed — routing, backend, and StudentDashboard are wired

### Design Aesthetic — Modern Learning Institution
Light mode primary. Course cards: thumbnail, instructor avatar, rating stars, student count, price badge. Custom branded video player with chapter marks, speed controls, transcript toggle. Completion rings + animated certificate unlock.

### Confirmed Built — Live in Repo

```
Server/routes/academyRoutes.ts              ✅ Full API — courses, modules, lessons,
                                               enrollment, progress, reviews, certificates
src/features/academy/AcademyPage.tsx        ✅ Course catalog UI
src/features/academy/CoursePage.tsx         ✅ Course player + progress tracking
src/features/academy/StudentDashboardPage.tsx  ✅ Enrolled courses + progress overview
prisma schema: Course, Module, Lesson, Enrollment, Certificate  ✅
App.tsx routing: /academy, /academy/my-learning, /academy/courses/:slug  ✅ WIRED
apiRouter.ts mount: /academy               ✅ WIRED
```

### Known TypeScript Fixes Applied

- `req.user!.id` → `req.user!.userId` everywhere
- `tags` field removed (not in Prisma schema)
- Compound unique `userId_courseId` — all lookups use `findFirst` pattern
- `timeSpent`, `progress` field refs corrected to match actual schema

### Academy Course Categories

| Category | Example Courses | Certificate Title | Work Pipeline |
|---|---|---|---|
| Digital Marketing | Social media ads, SEO, email, influencer strategy | Certified Digital Marketer | Market ad campaigns, freelance social media |
| Software Development | React, Node.js, Python, mobile dev, API design | Certified African Developer | Work software contracts, freelance dev |
| Financial Literacy | Personal finance, crypto basics, African fintech | Certified Financial Navigator | Market trading signals, fintech consulting |
| Creative Skills | Graphic design, video, photography, brand identity | Certified Creative Professional | Work creative contracts, Market digital products |
| E-Commerce & Sales | Product sourcing, Shopify, dropshipping | Certified E-Commerce Operator | Market vendor launch, dropshipping setup |
| Business & Entrepreneurship | Business plans, pitch decks, startup funding | Certified Entrepreneur | Market business tools, investor introductions |
| Health & Wellness | Personal training, nutrition, mental health | Certified Wellness Coach | Work coaching contracts, online programmes |
| Language & Culture | African languages, diaspora cultural bridge | Certified Language Professional | Community creator, Work translation contracts |

### Academy Niche Features — What Makes It Extraordinary

| Feature | Description |
|---|---|
| 🤖 SAGE AI Tutor | AI tutor inside every course — SAGE knows the course content, answers questions, explains concepts, reviews submissions |
| 📜 Verified Certificates | PDF certificates with public verification URL — linked to Trust Score, readable by CIRCUIT for Work matching |
| 🎯 Skill-Based Paths | Pre-built paths: African Fintech Developer, Digital Marketer, E-commerce Entrepreneur — SAGE recommends the right path |
| 🎤 Lecture-to-Notes | Upload a lecture audio → SAGE generates structured notes, key terms glossary, and quiz questions automatically |
| 👨‍🏫 Instructor Studio | Full course creation dashboard — record lessons, upload PDFs, set quizzes, define certificate criteria, set pricing |
| 🏆 Live Cohorts | Cohort-based learning with live sessions, peer projects, group accountability — premium pricing over self-paced |
| 💼 Work-Linked Courses | Completing certain courses automatically triggers Work job suggestions — the Agentic Loop made visible to the learner |
| 📊 Instructor Analytics | Detailed analytics: completion rates, drop-off points, revenue, top students, review sentiment |
| 🌍 Local Language Support | Courses in English, French, Swahili, Pidgin, Amharic — AI-assisted subtitle translation |

### V1.0 — Still Needed

- [ ] `InstructorDashboard.tsx` — course creation + management UI
- [ ] `CourseCreatePage.tsx` — create/edit course form
- [ ] Stripe payment UI for paid courses (endpoint exists)
- [ ] Video upload — Cloudinary integration
- [ ] Course thumbnail + free lesson preview

### V1.1 — Certification Engine (Not Started)

- [ ] Quiz system (multiple choice, true/false, min score gate)
- [ ] PDF certificate generation (PDFKit already installed)
- [ ] Certificate verification public page
- [ ] Skill badges on user profile
- [ ] Certificate sharing (LinkedIn, Twitter)

### V2.0 — AI Academy — SAGE Goes Live

- [ ] SAGE wired into `CoursePage.tsx` via `<AssistantPanel assistant="sage" />`
- [ ] SAGE AI Tutor — answers questions about uploaded course PDFs
- [ ] Lecture-to-Notes — upload lecture audio → SAGE generates structured notes
- [ ] Assignment screenshot review — SAGE gives structured feedback
- [ ] Skill-Based Paths — African Fintech Developer, Digital Marketer, E-commerce Entrepreneur
- [ ] Local Language Support — English, French, Swahili, Pidgin, Amharic
- [ ] SAGE gates certificate generation — verifies quiz + project completion
- [ ] SAGE reports learner completion to OMEGA → triggers Work match pipeline

### Academy — Products & Services

| Product | Description | Revenue Model |
|---|---|---|
| Course Sales | Learners pay per course | $19–$499; 70% instructor / 30% platform |
| Academy Pro All-Access | Unlimited courses + SAGE AI tutor | $19/month |
| Live Cohort Premium | Structured learning with live sessions | $199–$999 per cohort |
| Corporate Learning Packages | Businesses enrol employees | $29/employee/month |
| Certificate Verification API | Third parties verify certificates | $0.50 per call or $49/month unlimited |
| Instructor Promotion | Featured course placement + newsletter | $99–$499 per campaign |

---

## 📋 PHASE 4 — WINNERS MARKET (0% — 10 VERTICALS)

### Design Aesthetic — Commerce Empire
Two modes: Shopper view (clean, conversion-optimised) and Vendor Dashboard (data-dense, analytical). Product cards: high-quality image, price, vendor trust score, delivery time. Gold 'Winners Verified Vendor' badge. Stripe-quality checkout with Apple Pay / Google Pay / Flutterwave.

### The 10 Market Verticals

| # | Vertical | What It Is | Target Seller | Revenue Model |
|---|---|---|---|---|
| 4A | 🛒 Commerce Hub | Physical + digital product marketplace — vendor onboarding, catalogue, cart, checkout | Retailers, artisans, brands | 10–20% commission per sale |
| 4B | 📣 Digital Marketing Hub | Ad builder, SEO tools, social scheduler, email marketing campaigns | Agencies, small businesses | $49–$199/month subscription |
| 4C | 📺 Winners Stream | Live streaming, VOD, pay-per-view events, virtual concerts, tipping | Artists, speakers, coaches | 15% subscriptions + 10% tips |
| 4D | 📈 Trading & Signals | Copy trading, market signals, investment strategies, African stock data | Traders, fintech creators | $49–$149/month subscriptions |
| 4E | 📋 Business Launcher | Business plan AI, pitch decks, financial projections, company registration guides | First-time entrepreneurs | $29–$99 per plan or $49/month |
| 4F | 📄 CV & Career Tools | ATS-optimised CV builder, cover letter AI, LinkedIn optimiser, interview prep | Job seekers, diaspora professionals | $9.99–$29 per document |
| 4G | 🏠 Real Estate | African property listings, diaspora investment guides, mortgage calculators | Property developers, agents | 3–5% commission on leads |
| 4H | ✈️ Travel & Experiences | African travel packages, diaspora reunion trips, cultural experience bookings | Tour operators, travel agents | 8–12% booking commission |
| 4I | 💪 Health & Beauty | African beauty products, wellness packages, healthcare appointment booking | Beauty brands, health businesses | 10–15% commission |
| 4J | 🍽️ Food & Agriculture | African food brands, farm-to-diaspora subscriptions, agribusiness products | Farmers, food entrepreneurs | 8–12% commission |

**Build sequence:** `4A → 4B → 4C → 4E → 4F → 4D → 4G → 4H → 4I → 4J`

### 4A V1.1 — Dropshipping Partners

| Supplier | Speciality | Integration | Best For |
|---|---|---|---|
| Printful | Print-on-demand: apparel, accessories, homeware | Official API | African culture merch, fashion brands |
| Gelato | Print-on-demand with African fulfilment centres | Official API | Art prints, books, stationery |
| AliExpress / DSers | General merchandise, electronics | API + webhooks | General retailers, product testing |
| CJ Dropshipping | General + Private Label | API | African sellers, custom sourcing |
| Spocket | US/EU premium suppliers | Official API | Diaspora sellers in Western markets |
| Zendrop | Fast shipping, US warehouses | Official API | US-focused African diaspora sellers |
| Printify | 900+ print-on-demand products | Official API | Designers, artists |

### Demo Files Built — Need Production Conversion

```
src/features/market/WinnersMarketExpanded.jsx         🆕 681 lines — demo — convert to .tsx
src/features/market/dropshipping/WinnersDropshipping.jsx  🆕 837 lines — demo — convert to .tsx
```

### Phase 4 — What's Needed

```
Prisma schema: Product, ProductVariant, ProductImage, Cart, CartItem
               Order, OrderItem, OrderStatus, Vendor, VendorApplication, Review
               DropshippingStore, DropProduct, DropOrder

Server/routes/productRoutes.ts      — CRUD, search, filter, sort
Server/routes/cartRoutes.ts         — add/remove/update cart
Server/routes/orderRoutes.ts        — checkout, status, history
Server/routes/vendorRoutes.ts       — onboarding, dashboard, payouts
Server/routes/dropshippingRoutes.ts — store CRUD, product import, auto-fulfillment

src/features/market/MarketPage.tsx
src/features/market/ProductPage.tsx
src/features/market/CartPage.tsx
src/features/market/OrdersPage.tsx
src/features/market/VendorDashboard.tsx
```

---

## 🔄 PHASE 5 — WINNERS INTELLIGENCE (35% COMPLETE)

### Design Aesthetic — Premium AI Studio
Dark, focused, precise. Three-panel layout: left sidebar (conversations), centre (chat), right (context panel). Model selector: clear toggle between Claude, GPT-4o, Gemini, Ollama. File drop zone: drag-and-drop anywhere. Provider badge on each response. Streaming text token-by-token.

### Confirmed Built — Live in Repo

```
Server/routes/aiRoutes.ts                            ✅ Claude API + SSE streaming insights
Server/routes/chatRoutes.ts                          ✅ Aria chatbot — /chat/message + /chat/suggest
src/features/intelligence/WinnersChat.tsx            ✅ Aria — full production chatbot (740 lines)
src/features/intelligence/WinnersIntelligencePage.tsx  ✅ 6-agent AI dashboard + neural visualizer
```

**⚠️ Intelligence routing still needs wiring in App.tsx:**
```typescript
// src/App.tsx — ADD:
import WinnersChat             from "./features/intelligence/WinnersChat";
import WinnersIntelligencePage from "./features/intelligence/WinnersIntelligencePage";
import AIPlatformPage          from "./features/intelligence/ai-platform/AIPlatformPage";

<Route path="intelligence"            element={<WinnersIntelligencePage />} />
<Route path="intelligence/aria"       element={<WinnersChat />} />
<Route path="intelligence/platform"   element={<AIPlatformPage />} />

// Server/index.ts (or apiRouter.ts) — ADD if not already:
import chatRoutes       from "./routes/chatRoutes.js";
import aiPlatformRoutes from "./routes/aiPlatformRoutes.js";  // create first
app.use("/chat",               chatRoutes);
app.use("/api/v1/ai-platform", aiPlatformRoutes);

// MainLayout.tsx — ADD:
{ path: '/intelligence', icon: '🤖', label: 'Intelligence',
  children: [
    { path: '/intelligence/aria',     label: 'Aria · AI Agents' },
    { path: '/intelligence/platform', label: 'AI Platform'      },
  ]
}
```

### Universal AI Platform Architecture (Spec 100% — Implementation Pending)

**Full stack:**
```
Frontends (React Web · Electron Desktop · React Native Mobile)
    ↓ HTTP / WebSocket
Winners Backend (Express — existing)
    ↓ Internal HTTP localhost:8001
AI Platform Service (FastAPI — NEW, port 8001)
    ↓ Provider routing
┌─ Ollama ──── Llama 3.1 · DeepSeek Coder · Qwen 2.5 (local, free)
├─ Whisper ─── faster-whisper Medium — offline speech-to-text
├─ ComfyUI ─── Stable Diffusion XL — local image generation
└─ Claude API ─ Aria brain + cloud fallback
```

### Provider Routing Rules

| Input Type | Primary Provider | Fallback |
|---|---|---|
| Images (JPEG, PNG, GIF, WebP) | Claude 3.5 Sonnet | GPT-4o |
| PDFs | Claude 3.5 Sonnet (native PDF) | GPT-4o text extract |
| Audio (MP3, WAV, M4A, OGG) | GPT-4o Whisper | Gemini Audio |
| Video (MP4, WebM, MOV) | Gemini 1.5 Pro | GPT-4o frame extract |
| Text only | Ollama local (free) | Claude / GPT-4o |

### Universal AI Platform — New Files to Create

```
ai-platform/                                   🆕 Python FastAPI sidecar (port 8001)
├── main.py                                    FastAPI entry point
├── requirements.txt                           Python dependencies
├── Dockerfile                                 Railway deployment
├── routers/chat.py                            Ollama LLM + SSE streaming
├── routers/images.py                          ComfyUI image generation
├── routers/speech.py                          Whisper STT
├── services/ollama.py                         Ollama client
└── services/whisper.py                        faster-whisper wrapper

Server/routes/aiPlatformRoutes.ts              🆕 Express proxy to AI Platform (multer upload)

src/features/intelligence/ai-platform/
├── AIPlatformPage.tsx                         Chat · Image · Code · Voice tabs
├── hooks/useAIPlatform.ts                     Core API hook
└── components/
    ├── ChatWindow.tsx
    ├── ModelSelector.tsx
    ├── VoiceInput.tsx
    └── ImageGenerator.tsx

src/features/intelligence/omega/OmegaDashboard.tsx  🆕 OMEGA cross-layer dashboard
src/components/ai/AssistantPanel.tsx                🆕 Reusable panel — embeds in all 8 layers
src/components/ai/FileDropZone.tsx                  🆕
src/components/ai/ModelSelector.tsx                 🆕
src/hooks/useMultimodalChat.ts                      🆕
src/hooks/useAssistant.ts                           🆕

desktop/main.js                                     🆕 Electron wrapper (auto-starts Ollama)
mobile/WinnersAI/                                   🆕 Expo React Native app
```

**Full starter code for all above is in:** `Winners_Intelligence_v2_Complete.docx`

### Aria — Built (`WinnersChat.tsx`)

- Token-by-token streaming via SSE (`POST /chat/message`)
- User context injection — name, role, workspace, recent activity
- Smart follow-up chips via `POST /chat/suggest`
- 4 ecosystem starter prompts on welcome screen
- Stop streaming, clear chat, multi-turn history (last 20 messages)
- Knows all 8+ platform layers + live status
- Mobile responsive

### Intelligence Niche Features — What Makes It Extraordinary

| Feature | Description |
|---|---|
| 🔄 Multi-Provider Chat | Switch between Claude, GPT-4o, Gemini, and local Ollama mid-conversation — best answer wins, user chooses |
| 📁 Full Multimodal | Send any file type to any assistant — images, PDFs, audio, video — auto-routed to the optimal provider |
| 🖥️ Desktop App | Electron wrapper — works fully offline, auto-starts Ollama, no internet required for local models, single-click install |
| 📱 Mobile Assistant | iOS + Android — voice input, camera input, access all 9 assistants, same JWT auth as web |
| 🧠 Persistent Memory | Assistants remember the user across sessions — conversation history searchable, context carried forward |
| ⚡ Autonomous Actions | Assistants execute pre-approved actions: send notifications, generate reports, trigger ecosystem events |
| 📊 AI Usage Analytics | Track usage: tokens consumed, cost by provider, most-used assistants, file types analysed |
| 🎛️ Custom Personas | Users create custom AI personas for specific workflows: 'My Marketing Assistant', 'Code Reviewer', 'Writing Coach' |
| 🔌 Plugin System | Third-party plugins extend assistant capabilities: calendar integration, CRM connection, spreadsheet analysis |

| Agent | Layer | Focus |
|---|---|---|
| Social Intelligence | Community | Detects skills from posts → routes to Academy + Work |
| Learning Path | Academy | 3-step personalized curriculum → earning potential |
| Commerce Intelligence | Market | Product analysis → pricing + target audience |
| Talent Matching | Work | Skills → job matches → rate recommendations |
| Core AI Orchestrator | Intelligence | Master agent coordinating all layers |
| Platform Intelligence | Core | Unified recommendation spanning all platforms |

### New Prisma Models — Add to schema.prisma

```prisma
model AIPlatformUsage {
  id        String   @id @default(cuid())
  userId    String
  tenantId  String
  action    String   // chat | image | speech | code
  model     String   // ollama | claude | comfyui | whisper
  tokens    Int      @default(0)
  cost      Float    @default(0)
  latencyMs Int
  createdAt DateTime @default(now())
}

model AIConversation {
  id        String      @id @default(cuid())
  userId    String
  tenantId  String
  title     String      @default("New Conversation")
  model     String      @default("llama3.1")
  messages  AIMessage[]
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}

model AIMessage {
  id             String         @id @default(cuid())
  conversationId String
  conversation   AIConversation @relation(fields:[conversationId], references:[id], onDelete: Cascade)
  role           String         // user | assistant
  content        String         @db.Text
  provider       String?        // ollama | claude | comfyui | whisper
  tokensUsed     Int            @default(0)
  createdAt      DateTime       @default(now())
}

model AssistantMemory {
  id         String   @id @default(cuid())
  userId     String
  tenantId   String
  assistant  String   // omega | aria | nova | sage | atlas | forge | circuit
  memoryType String   // user_profile | preference | journey | milestone | flag
  content    String   @db.Text
  confidence Float    @default(1.0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([userId, assistant])
}

model AssistantAction {
  id           String    @id @default(cuid())
  assistant    String
  actionType   String    // notify | escalate | recommend | trigger | generate | flag
  targetUserId String?
  targetLayer  String?
  description  String    @db.Text
  payload      Json?
  approved     Boolean   @default(false)
  autoApproved Boolean   @default(false)
  executedAt   DateTime?
  result       String?   @db.Text
  createdAt    DateTime  @default(now())
}

model AgenticLoop {
  id            String   @id @default(cuid())
  userId        String
  tenantId      String
  trigger       String
  steps         Json
  outcome       String   @db.Text
  revenueImpact Float?
  createdAt     DateTime @default(now())
}
```

### Universal AI Platform — Phase 1 Build Commands

```bash
# Step 1 — Install Ollama + pull models
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1 && ollama pull deepseek-coder && ollama pull qwen2.5

# Step 2 — Create Python AI Platform service
mkdir ai-platform && cd ai-platform
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn httpx faster-whisper python-multipart

# Step 3 — Create all files (full code in Winners_Intelligence_v2_Complete.docx)
# main.py · routers/chat.py · routers/images.py · routers/speech.py
# services/ollama.py · services/whisper.py

# Step 4 — Start and test
uvicorn main:app --port 8001 --reload
curl http://localhost:8001/health

# Step 5 — Prisma migration
npx prisma migrate dev --name add_ai_platform
```

### Intelligence — Products & Services

| Plan | Price | What You Get |
|---|---|---|
| Free | Included | 100 AI credits/month, Ollama local only |
| Intelligence Starter | $9/month | 500 credits, images + PDFs, Claude + Ollama |
| Intelligence Pro | $19/month | 2,000 credits, all modalities, all providers |
| Intelligence Team | $49/month | 10,000 shared credits, priority |
| Desktop App License | $49 one-time | Unlimited local AI, offline capable |
| OMEGA Enterprise | $500–$5K/month | Unlimited, autonomous actions, dedicated infra |
| White-label Assistants | Custom | Full branding, custom deployment |

### AI Credits Pricing

| Action | Credits | Approx Cost |
|---|---|---|
| Text message | 2 | ~$0.002 (Ollama free / Claude paid) |
| Image analysis | 5 | ~$0.01 (Claude / GPT-4o) |
| PDF analysis | 6 | ~$0.012 (Claude native) |
| Audio transcription | 4/min | ~$0.006 (Whisper / GPT-4o) |
| Video analysis | 10/min | ~$0.025 (Gemini 1.5 Pro) |
| OMEGA autonomous action | 15 | ~$0.03 (Claude high reasoning) |
| OMEGA daily ecosystem briefing | 50 | ~$0.10 (Claude + PDF analysis) |

---

## 📋 PHASE 6 — WINNERS WORK (0% COMPLETE)

### Design Aesthetic — Professional Talent Marketplace
Clean, white-forward, professional. Freelancer cards: portrait photo, Trust Score, Academy badges, hourly rate, availability. Job board: company logos, required skills, budget range, deadline. Escrow payment indicator: clearly shows funds held and release conditions.

### Prisma Schema Needed

```prisma
JobListing, JobApplication, JobStatus
FreelancerProfile, Portfolio, PortfolioItem
Contract, ContractMilestone
EscrowPayment, EscrowRelease
WorkReview
```

### Work Niche Features — What Makes It Extraordinary

| Feature | Description |
|---|---|
| 🏅 Academy-Linked Profiles | Certificates from Winners Academy appear as verified skill badges — clients filter by certification |
| 🤖 CIRCUIT AI Matching | AI reads job description + freelancer profiles, generates match scores, auto-suggests top 5 candidates to clients |
| 📝 AI Proposal Generator | CIRCUIT writes a custom proposal for any job based on the freelancer's profile and job requirements — editable before sending |
| 🔒 Escrow Protection | All contracts funded into escrow via Stripe + Flutterwave — funds release on milestone approval, dispute resolution built-in |
| 🌍 African Talent Spotlight | Dedicated section showcasing top African talent by country and skill — featured profiles for diaspora-friendly remote roles |
| 📊 Contract Analytics | Freelancers see lifetime earnings, on-time delivery rate, repeat client rate, skill demand trends |
| ⚖️ Dispute Resolution | CIRCUIT reviews disputed work evidence (screenshots, code, files), provides assessment, recommends resolution |
| 🚀 Launch Packages | New freelancers get 3 free bids + featured listing for 7 days after earning their first Academy certificate |
| 💳 Multi-Currency Payments | USD, GBP, EUR, KES, NGN, GHS, ZAR, XOF — instant withdrawal via Stripe + Flutterwave |

### Key Features Build Checklist

- [ ] 🏅 Academy-Linked Profiles — certificates appear as verified skill badges
- [ ] 🤖 CIRCUIT AI Matching — reads job description + freelancer profiles, generates match scores
- [ ] 📝 AI Proposal Generator — CIRCUIT writes custom proposals
- [ ] 🔒 Escrow Protection — all contracts funded via Stripe + Flutterwave
- [ ] 🌍 African Talent Spotlight — top talent by country and skill
- [ ] 💳 Multi-Currency — USD, GBP, EUR, KES, NGN, GHS, ZAR, XOF
- [ ] 🚀 Launch Package — 3 free bids + featured listing after first Academy certificate

### Work Job Categories

| Category | Rate Range | African Market Opportunity |
|---|---|---|
| Software Development | $500–$10K/project | High diaspora demand, global remote clients |
| Digital Marketing | $200–$3K/month | African brands scaling globally |
| Creative & Design | $300–$5K/project | Brand identity for African startups |
| Writing & Content | $50–$500/article | African language localisation, content farms |
| Financial Services | $100–$500/hour | Diaspora tax, African startup CFO-as-a-service |
| Business Consulting | $500–$5K/engagement | Pan-African expansion advice, diaspora investment |
| Education & Coaching | $50–$200/hour | African students, diaspora skill development |
| Music & Entertainment | $200–$10K/project | Afrobeats global expansion, African music industry |

### Work — Products & Services

| Product | Description | Revenue Model |
|---|---|---|
| Escrow Commission | Platform fee on all contracts | 8–12% of contract value |
| Job Posting | Clients post jobs | $10–$50 per listing |
| Featured Freelancer | Promoted placement | Monthly fee |
| Enterprise Hiring | Custom bulk hiring | Custom pricing |

---

## 📋 PHASE 7 — MOBILE APP (0% COMPLETE)

Foundation exists via Universal AI Platform mobile spec (`mobile/WinnersAI/` Expo project).

**Design — Mobile-First African Digital Life:**
- Bottom navigation: 5 tabs — Home, Community, Learn, Work, AI
- Home: personalised feed from all 8 layers — AI-curated by OMEGA
- Dark mode default — battery-conscious
- Gesture-forward: swipe back, pull to refresh, long-press for quick actions
- Offline-first: cached community feed, downloaded courses, local AI via Ollama

**Key Mobile Features:**

| Feature | Description |
|---|---|
| 🎙️ Voice-First Interface | Tap to talk to any of the 9 assistants — voice posts to Community, voice-to-text in Work proposals and Academy notes |
| 📸 Camera Integration | Photograph a product for ATLAS to analyse, an assignment for SAGE to review, or ID for verification |
| 💳 Mobile Payments | M-Pesa, Airtel Money, Orange Money, MTN MoMo, Flutterwave — full African mobile money integration |
| 📥 Offline Courses | Download up to 10 Academy lessons for offline viewing — progress syncs when online, perfect for low-connectivity |
| 🔔 Smart Notifications | AI-curated push notifications — only what's relevant to the user's current goals, decided by OMEGA |
| 🌍 Data-Lite Mode | Compresses images, reduces video quality, text-first rendering — critical for limited data in African markets |

**Mobile Build Checklist:**
- [ ] Service worker + manifest (PWA, install-to-homescreen)
- [ ] Push notifications (Firebase FCM)
- [ ] Biometric login, offline video sync
- [ ] Expo SDK — iOS + Android (`mobile/WinnersAI/` directory)
- [ ] Shared Zustand stores + API layer with web
- [ ] Voice-First Interface — tap to talk to any assistant
- [ ] Camera Integration — photograph product for ATLAS, assignment for SAGE
- [ ] Mobile Payments — M-Pesa, Airtel Money, Orange Money, MTN MoMo, Flutterwave
- [ ] Data-Lite Mode — text-first rendering for limited data

---

## 📋 PHASE 8 — WINNERS CLOUD (0% COMPLETE)

**Design — Developer-Grade Infrastructure:**
Technical, clean, documentation-forward — like Stripe Docs or Vercel. Code examples in JS, Python, Go, cURL. Interactive API explorer. Dark mode developer console.

**Cloud Products:**

| Product | Description | Revenue Model |
|---|---|---|
| AI Assistant API | Call any of the 9 assistants via REST, multimodal support | Pay per token |
| Identity Verification API | Verify Trust Score, Academy certs, Work history | $0.50/call or $49/month |
| Payments API | Stripe + Flutterwave in one integration — M-Pesa, MTN MoMo, bank transfer, card | Transaction-based |
| Community Data API | Access public creator profiles, trending topics, community analytics | Tiered pricing |
| Certificate Verification API | Verify Academy certificates in real-time | $0.50/call |
| Plugin Marketplace | Build plugins extending any of the 9 assistants | 70% developer / 30% platform |

**SDK Packages:**

| SDK | Package Name | Key Methods | Status |
|---|---|---|---|
| JavaScript / TypeScript | `@winners/sdk` | `winners.chat()`, `winners.verify()`, `winners.pay()` | 📋 Build first |
| Python | `winners-py` | `WinnersClient.chat()`, `.verify()`, `.pay()` | 📋 Build with JS |
| Go | `winners-go` | `winners.NewClient()`, `.Chat()`, `.Verify()` | 📋 Phase 2 |
| Swift / Kotlin | `winners-mobile` | `WinnersSDK.shared.chat()`, `.verify()` | 📋 With mobile app |

**Cloud Build Checklist:**
- [ ] Public REST API + OpenAPI/Swagger docs
- [ ] Developer portal + API key management + webhooks
- [ ] SDK packages (JS, Python, Go)
- [ ] Plugin marketplace (30% revenue share)
- [ ] White-label licensing
- [ ] Enterprise SSO (SAML, Okta, Azure AD)

---

## 🚨 CRITICAL PENDING ACTIONS

### 🔴 Do First — Wire Intelligence Routes (Community + Academy already wired)

```typescript
// ── src/App.tsx — ADD intelligence routes:
import WinnersChat             from "./features/intelligence/WinnersChat";
import WinnersIntelligencePage from "./features/intelligence/WinnersIntelligencePage";
import AIPlatformPage          from "./features/intelligence/ai-platform/AIPlatformPage"; // create first

<Route path="intelligence"            element={<WinnersIntelligencePage />} />
<Route path="intelligence/aria"       element={<WinnersChat />} />
<Route path="intelligence/platform"   element={<AIPlatformPage />} />

// ── Server/index.ts or apiRouter.ts — confirm chatRoutes + add aiPlatformRoutes:
import chatRoutes       from "./routes/chatRoutes.js";
import aiPlatformRoutes from "./routes/aiPlatformRoutes.js";
app.use("/chat",               chatRoutes);
app.use("/api/v1/ai-platform", aiPlatformRoutes);

// ── src/components/layout/MainLayout.tsx — ADD:
{ path: '/intelligence', icon: '🤖', label: 'Intelligence',
  children: [
    { path: '/intelligence/aria',     label: 'Aria · AI Agents' },
    { path: '/intelligence/platform', label: 'AI Platform'      },
  ]
}
```

```bash
npx prisma migrate dev --name add_ai_platform
npx prisma generate
```

### 🔴 Immediate Code Quality

```bash
# Design sweep — replace hardcoded hex across all pages:
grep -r "#[0-9A-Fa-f]{6}" src/ --include="*.tsx" --include="*.ts" -l
# Priority: CommunityPage.tsx, RevenueChart.tsx

# Lint priority files:
npx eslint Server/middleware/ Server/routes/apiRouter.ts src/components/layout/ --fix

# Remove @ts-nocheck files gradually — start with most-used:
grep -r "@ts-nocheck" src/ Server/ -l
```

### 🟡 Next Sprint

- [ ] Fix `RevenueChart.tsx` — remove all hardcoded hex
- [ ] Fix `CommunityPage.tsx` — design-system sweep
- [ ] Community V1.2 expansion — group admin roles, public/private visibility, niche groups
- [ ] Community V1.3 — Direct Messaging (`messageRoutes.ts` + `MessagesPage.tsx`)
- [ ] Fix `tenantId` scoping on post edit/delete (security gap)
- [ ] Academy V1.0 — `InstructorDashboard.tsx` + `CourseCreatePage.tsx`
- [ ] Academy Stripe payment UI for paid courses
- [ ] Build Universal AI Platform Phase 1 (Ollama + FastAPI service)
- [ ] First smoke tests — auth, API router mounts, academy enroll/progress

### 🟢 Medium Term

- [ ] Build `AssistantPanel.tsx` — reusable for all layers
- [ ] Build `FileDropZone.tsx` + `useMultimodalChat.ts` + `useAssistant.ts`
- [ ] Academy quiz system + PDF certificate generation (PDFKit installed)
- [ ] SAGE AI tutor in CoursePage (after AssistantPanel built)
- [ ] NOVA wired into CommunityPage
- [ ] Lint stabilization — reduce from 219 problems, tackle by cluster

### 🔵 Phase 4 Kickoff

- [ ] Market V1.0 Core Commerce — Prisma schema + 4 backend routes
- [ ] Printful + Gelato API integration
- [ ] Convert `WinnersMarketExpanded.jsx` → production `.tsx`
- [ ] Convert `WinnersDropshipping.jsx` → production `.tsx`

---

## 🎯 EXECUTION PRIORITIES — ORDERED

| Priority | Action | Platform | Impact |
|---|---|---|---|
| 🔴 1 | Wire Intelligence routes in App.tsx + confirm chatRoutes mounted | Intelligence | Aria + AI Platform accessible |
| 🔴 2 | Design sweep: replace hardcoded hex in CommunityPage + RevenueChart | Core + Community | Design system consistency |
| 🔴 3 | Community V1.2 expansion — group roles, visibility, niche groups | Community | 65% → 72% |
| 🔴 4 | Community V1.3 — Direct Messaging | Community | Closes biggest UX gap |
| 🔴 5 | Academy Instructor Dashboard + CourseCreatePage | Academy | Enables content creation |
| 🟡 6 | Build AI Platform FastAPI service + aiPlatformRoutes.ts | Intelligence | Ollama local AI goes live |
| 🟡 7 | Run Prisma migrations for AI Platform models | Intelligence | Enables SAGE, NOVA, all assistants |
| 🟡 8 | Build AssistantPanel + wire NOVA/SAGE into Community/Academy | Community + Academy | AI-supervised platforms live |
| 🟡 9 | First smoke test suite (Vitest) | Core | Build confidence |
| 🟡 10 | Design + build Market 4A (Prisma + routes + frontend) | Market | Commerce engine starts |
| 🟢 11 | OMEGA Dashboard at /intelligence/omega | Intelligence | Ecosystem supervision live |
| 🟢 12 | PWA setup: service worker + manifest + mobile responsive | Mobile | Installable on mobile |
| 🔵 13 | Electron desktop wrapper for Intelligence Platform | Intelligence | Desktop + offline AI |
| 🔵 14 | Winners Cloud API — JS SDK + documentation portal | Cloud | Developer platform opens |

---

## 💰 UNIFIED MONETIZATION MODEL

| Platform | Revenue Stream | Model | MRR at Scale |
|---|---|---|---|
| Core Engine | Workspace subscriptions | FREE / PRO $29 / ENTERPRISE $99/mo | $20K–$200K |
| Community | Creator subscriptions + ads | 10–15% platform cut + CPM | $15K–$150K |
| Academy | Course revenue share | 70% instructor / 30% platform | $15K–$150K |
| Academy | Academy Pro + live cohorts | $19/mo + $199–$999/cohort | $20K–$200K |
| Market — Commerce | Transaction commission | 10–20% per sale | $50K–$500K |
| Market — Streaming | Subscriptions + PPV | 15% sub cut, 10% tipping | $20K–$200K |
| Market — Marketing Hub | Service packages | $49–$199/mo | $15K–$150K |
| Market — Trading | Signals + copy trading | $49–149/mo | $30K–$300K |
| Intelligence | AI credit packs + Pro + Desktop + OMEGA | $9–$5K/mo | $35K–$350K |
| Work | Escrow commission + job posting | 8–12% + $10–$50 | $20K–$200K |
| Cloud | API + enterprise licensing + plugins | $500–$5K/mo + usage | $18K–$580K |

**Combined potential: $1M–$3M+ ARR across all verticals at scale.**

---

## 🔧 TECH STACK — COMPLETE

```
Frontend:       React 18 + TypeScript + Vite
State:          Zustand
Routing:        React Router v6
Styling:        CSS variables — zero Tailwind
Charts:         Recharts
Fonts:          Syne · Space Mono · Cormorant Garamond (Google Fonts)

Backend:        Node.js + Express 5 + TypeScript
Database:       PostgreSQL (Railway managed)
ORM:            Prisma
Auth:           JWT + bcrypt + Google OAuth (Passport.js)
2FA:            OTPAuth (TOTP) + custom Email OTP
WebSockets:     Socket.io
Email:          Resend + node-cron scheduler
Payments:       Stripe + LemonSqueezy
AI Cloud:       Anthropic Claude API (Aria + recommendations)
AI Local:       Ollama — Llama 3.1 · DeepSeek Coder · Qwen 2.5
AI STT:         faster-whisper (Medium model — offline)
AI Images:      ComfyUI / Stable Diffusion XL
AI Backend:     Python + FastAPI (port 8001 — sidecar service)
Notifications:  Slack API
Export:         ExcelJS + PDFKit + json2csv
Security:       Helmet + express-rate-limit
Hosting:        Railway (monorepo + AI Platform as second service)
Desktop:        Electron (planned)
Mobile:         Expo + React Native (planned)
```

### Technology Partners

| Category | Tool | Why Winners Needs It | Cost |
|---|---|---|---|
| Auth | JWT + Google OAuth | SSO across all 8 subdomains — one login everywhere | $0–$240/month |
| Payments | Stripe | Cards, subscriptions, escrow, payouts | 2.9% + $0.30/transaction |
| Payments Africa | Flutterwave | M-Pesa, MTN MoMo in 34 African countries | 2.8%/transaction |
| Video | Mux / Cloudinary | Adaptive streaming + uploads | $0.015/min stored |
| Media Storage | Cloudinary | Images, audio, video + CDN + AI transforms | Free → $89/month |
| Email | Resend | Transactional + campaigns | Free → $20/month |
| Search | Meilisearch / Algolia | Cross-platform search | $0 (self-host) → $50/month |
| Realtime | Socket.io | WebSocket for feeds, notifications, live spaces | Included in Node |
| Cache | Redis (Upstash) | Session, rate limiting, real-time counters | $0–$20/month |
| Hosting | Railway | Monorepo + AI Platform as second service | $20–$100/month |
| Monitoring | Sentry | Error tracking across all 8 platforms | Free → $26/month |
| AI Cloud | Anthropic Claude | ARIA, SAGE, OMEGA — best reasoning | ~$0.003/1K tokens |
| AI Cloud | OpenAI GPT-4o | Audio, vision, code — best multimodal | ~$0.005/1K tokens |
| AI Cloud | Google Gemini | Video analysis — native video support | ~$0.002/1K tokens |
| AI Local | Ollama | Free offline LLMs | $0 — runs on device |
| AI Images | ComfyUI + SDXL | Local image generation | $0 — GPU at scale |
| AI STT | faster-whisper | Offline speech-to-text | $0 — runs on CPU |

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

# AI — Cloud
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...

# AI — Platform Service
AI_PLATFORM_URL=http://localhost:8001
OLLAMA_HOST=http://localhost:11434
WHISPER_MODEL=medium
COMFYUI_HOST=http://localhost:7860

# File Storage
CLOUDINARY_CLOUD_NAME=winners-empire
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
AWS_S3_BUCKET=...
```

---

## 🏗️ COMPETITIVE BENCHMARKS

| Platform | Learn From | Apply To |
|---|---|---|
| Linear.app | Dashboard speed, keyboard shortcuts, developer UX | Core Engine, Intelligence |
| Notion | Flexible content, workspace feel, clean empty states | Core Engine, Academy |
| Stripe | Payment flows, dashboard data density, documentation | Market, Work, Cloud |
| Coursera / Udemy | Course player, certificate design, instructor analytics | Academy |
| Upwork | Job board filtering, freelancer profiles, contract workspace | Work |
| Twitter / X | Feed mechanics, trending topics, spaces audio | Community |
| Shopify | Vendor onboarding, product management, checkout flow | Market |
| Anthropic Claude | Chat UI, streaming, file upload, model selection | Intelligence |
| Binance | Dark theme, data density, trust signals, African market | Market Trading |
| M-Pesa / Flutterwave | Mobile payment UX, African market trust | Market, Work |

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
11. **Do not design Platform 4 before Platform 3 is stable.** Follow the sequence.
12. **AI assistants are supervisors, not chatbots.** Each assistant owns a layer and reports to OMEGA.

---

## 🔮 LONG-TERM VISION (3–5 Years)

- A **social network** with 1M+ African/diaspora creators (Community) — supervised by NOVA
- An **education system** with 10,000+ courses (Academy) — tutored by SAGE
- A **commerce empire** with 10 verticals and $1M+ ARR (Market) — powered by ATLAS
- A **work network** with 100,000+ freelancers (Work) — matched by CIRCUIT
- An **AI infrastructure** every layer depends on (Intelligence + Universal AI Platform) — orchestrated by OMEGA
- A **developer marketplace** where others build on the platform (Cloud) — supported by NEXUS

**All unified by one AI intelligence core. One identity. One ecosystem. Nine AI supervisors.**

---

> *"Most founders try to build everything at once. That's how projects die.*
> *You build: Infrastructure → Engagement → Value → Monetization → Intelligence → Scale.*
> *In that order. With discipline."*

---

**Replace all previous project knowledge documents with this single file.**
**Update this file after every build session.**

*Last updated: March 2, 2026 · Version 6.0 Final · winners-empire-eco.up.railway.app*

*Sources merged into V6:*
- *V5 (February 28, 2026) — Design Strategy + AI Assistants + Intelligence v2.0 + Universal AI Platform Spec*
- *Platform Design & Product Strategy Doc (February 2026) — Niche features, updated Market verticals (4G Real Estate / 4H Travel & Experiences), SDK key methods, tech partner costs, Community Data API, Education & Coaching Work category, Design & Creative Resources*
- *PROJECT_EVOLUTION.md (commit d48968b) — Live repo corrections: community/academy wired, Groups built, StudentDashboard exists, RLS migrated, SSO prepped, backup automated*
- *All prior session transcripts (see /mnt/transcripts/)*
