# 🏆 WINNERS ECOSYSTEM — MASTER PROJECT STATE V5
### Single Source of Truth · Build Bible · Last Updated: February 28, 2026
### Upgraded: Design Strategy + AI Assistants Roadmap + Intelligence v2.0 + Universal AI Platform Integrated

> **Live URL:** https://winners-empire-eco.up.railway.app
> **Stack:** React 18 + TypeScript (Vite) · Node/Express · PostgreSQL (Prisma) · Railway
> **AI Core:** Anthropic Claude API · `claude-opus-4-6` · Multi-provider: Claude + GPT-4o + Gemini + Ollama (local) · faster-whisper · ComfyUI
> **Vision:** Digital Sovereign Infrastructure — one account, one identity, one ecosystem
> **Overall Progress: ~50% Complete**
> **This document supersedes all previous versions. Replace all prior project knowledge files with this one.**

---

## ⚡ ASSISTANT RULES — READ FIRST, ALWAYS

You are the **lead engineer** for the Winners Ecosystem project.

**Before every response:**
1. Read this document fully
2. Check what's ✅ built vs 📋 planned
3. Never contradict what's already been built
4. Follow the execution sequence — do not skip layers

**Code rules — non-negotiable:**
- ❌ NEVER use Tailwind classes
- ❌ NEVER use hardcoded hex colors
- ✅ ALWAYS use CSS variables only
- ✅ CSS injected via `<style>` tag directly in JSX return (NOT `document.createElement`)
- ✅ Card pattern: `6px border-radius` + `2px gradient top border`
- ✅ Every file: Phase + Layer comment at the top
- ✅ Every page: ecosystem context bar showing all 8 layer statuses
- ✅ Fonts: Syne (body) · Space Mono (monospace labels) · Cormorant Garamond (display headings)
- ✅ Motion: 200ms ease transitions, entrance animations with stagger, micro-interactions on all interactive elements
- ✅ Accessibility: WCAG AA minimum, keyboard navigable, 4.5:1 contrast ratio
- ✅ Mobile-first: designed at 375px first, bottom navigation on mobile, touch targets 44px minimum

---

## 🧭 WHAT THIS PROJECT IS

Winners Ecosystem is a **Central Digital Operating System** — a platform-of-platforms. Eight distinct digital businesses running under one unified identity, one billing engine, one AI intelligence core, and one design system. Built first for African and diaspora markets, scaling globally.

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

| # | Platform | Domain | Status | Progress | AI Supervisor | Blocking |
|---|---|---|---|---|---|---|
| ⬡ | Core Engine | winnersempire.io | ✅ Live | **92%** | ARIA | RLS + SSO pending |
| 🧑‍🤝‍🧑 | Winners Community | community.winnersempire.io | ✅ Wired | **75%** ⬆️ | NOVA | Groups + DMs complete |
| 🎓 | Winners Academy | learn.winnersempire.io | ✅ Wired | **55%** ⬆️ | SAGE | Quiz + Certificates pending |
| 🛒 | Winners Market | shop.winnersempire.io | 📋 Planned | **0%** | ATLAS | Awaiting Academy stable |
| 🤖 | Winners Intelligence | ai.winnersempire.io | ✅ Wired | **55%** ⬆️ | FORGE | AI Platform spec complete |
| 💼 | Winners Work | work.winnersempire.io | 📋 Planned | **0%** | CIRCUIT | Awaiting Market |
| 📱 | Mobile App | — | 📋 Planned | **0%** | — | Awaiting web stability |
| ☁️ | Winners Cloud | cloud.winnersempire.io | 📋 Planned | **0%** | NEXUS | Awaiting all platforms |
| 🧠 | Universal AI Platform | aiplatform.winnersempire.io | 🆕 Spec 100% | **Spec Complete** | HERALD | Implementation in progress |

---

## 🤖 THE 9 AI ASSISTANTS — NAMED & POSITIONED

Every platform layer has a dedicated AI supervisor. OMEGA orchestrates all of them.

| Assistant | Layer | Personality | Core Capability |
|---|---|---|---|
| 🧠 **OMEGA** | Orchestrator | Strategic, visionary, sees all patterns | Cross-layer intelligence, Agentic Loop driver, ecosystem health |
| ⬡ **ARIA** | Core Engine | Calm, precise, organised | Dashboard insights, billing help, workspace management |
| 👥 **NOVA** | Community | Warm, trend-aware, creative | Content moderation, creator growth, talent detection, community AI |
| 🎓 **SAGE** | Academy | Patient, knowledgeable, encouraging | Course tutoring, PDF analysis, lecture notes, skill guidance |
| 🛒 **ATLAS** | Market | Analytical, commercial, data-driven | Product research, pricing strategy, vendor intelligence |
| 🤖 **FORGE** | Intelligence | Technical, precise, performance-focused | Model routing, AI cost management, multimodal orchestration |
| 💼 **CIRCUIT** | Work | Professional, tactical, results-oriented | Job matching, proposal writing, contract review, code review |
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

Every Winners platform must communicate the same foundational truth: **this is infrastructure built for people who are building something.** The design language should feel like a premium fintech meets a world-class creative studio — disciplined, confident, and unmistakably built for African and diaspora communities who refuse to settle for second-tier tools.

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

| Role | Font | Style |
|---|---|---|
| Display headings | Cormorant Garamond, serif | weight 300–600, italic gold accents |
| Section titles | Syne, sans-serif | weight 700–800 |
| Body text | Syne, sans-serif | weight 400 |
| Labels / badges | Space Mono, monospace | 9–11px, uppercase, letter-spacing 0.1–0.2em |
| Code / metadata | Space Mono, monospace | — |

### Layout Grid
- 8px grid system · Generous whitespace · Max content width 1280px
- Sidebar nav 260px · Consistent 24px section padding

### Premium UI Patterns — Used Consistently Across All 8 Platforms

| Pattern | Where Used | Implementation |
|---|---|---|
| Gold gradient top border | Every card, modal, panel | `2px border-top: linear-gradient(90deg, var(--gold), transparent)` |
| Ecosystem context bar | Every page header — all 8 layers | 8 platform status dots — live indicator, linking between layers |
| Empty states with AI prompt | Every list/feed/table when empty | Illustration + AI assistant CTA — never just 'No data found' |
| Skeleton loading | Every data-fetching component | Animated shimmer in `#172335` — no spinners |
| Command palette (⌘K) | Global — all logged-in views | Search across the platform + AI commands + navigation |
| Progress rings | Profile completion, course progress | SVG rings in gold/green/ice — never plain progress bars |
| Smart tooltips | Data labels, stats, badges | Context-aware — show relevant info, not just repeating the label |
| Floating AI panel | All pages — bottom right corner | Minimisable assistant panel — always-on AI layer |

### Context Bar Pattern (required on every page)

```tsx
<div style={{ display:'flex', gap:8, marginBottom:22, flexWrap:'wrap' }}>
  <span className="ctx-badge live">⬡ Core Engine</span>
  <span className="ctx-sep">›</span>
  <span className="ctx-badge active">🧑‍🤝‍🧑 Community</span>
  <span className="ctx-sep">›</span>
  <span className="ctx-badge planned">🎓 Academy</span>
  {/* ... all 8 layers */}
</div>
```

---

## ✅ PHASE 1 — CORE ENGINE (90% COMPLETE)

### Design Aesthetic — Gold Command Centre
- Dark navy base with gold accents — authoritative, premium, trusted
- Data-dense but never cluttered — every number earns its place
- Animated activity feed: real-time updates from all 8 layers
- Hero metric cards: total earnings, AI interactions, community rank, courses completed
- Journey Map: visual path showing the user's progress across all 8 layers

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
Server/routes/postRoutes.ts                 ✅ ⚠️ NOT wired in Server/index.ts
Server/routes/academyRoutes.ts              ✅ ⚠️ NOT wired in Server/index.ts
Server/routes/chatRoutes.ts                 ✅ ⚠️ NOT wired in Server/index.ts
Server/services/emailScheduler.ts           ✅ Email report scheduler (node-cron)
Server/services/referralService.ts          ✅ Referral business logic
Server/services/wsService.ts                ✅ WebSocket service (Socket.io)
Server/services/appRegistry.ts              ✅ Platform app registry  ⚠️ Confirm in GitHub
sdk/WinnersSDK.ts                           ✅ Developer SDK foundation  ⚠️ Confirm in GitHub
prisma/schema.prisma                        ✅ Full multi-tenant schema
```

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

### Phase 1 — Niche Features to Build

| Feature | Description | Priority |
|---|---|---|
| 🗺️ Journey Map | Visual map showing user's path through all 8 layers | 🟡 Medium |
| 🏆 Achievement System | Cross-platform badges: 'Community Builder', 'Master Trader', 'Elite Freelancer' | 🟡 Medium |
| 📊 Wealth Dashboard | Real-time earnings across all layers in one view | 🟡 Medium |
| 🔑 SSO | One login unlocks all 8 subdomains | 🔴 Critical |
| 🛡️ Trust Score | Public score from Academy certs, Work reviews, Community reputation | 🟢 Later |
| 🔔 Unified Inbox | All notifications from all 8 platforms aggregated | 🟢 Later |

### Phase 1 — Still Pending

- [ ] PostgreSQL RLS (Row Level Security) policies — migration needed
- [ ] SSO system (one login → all subdomains) — architecture design needed
- [ ] Backup automation — Railway config
- [ ] `tenantId` scoping on post edit/delete — known security gap, fix before Phase 3
- [ ] `npm install express-rate-limit helmet` — required for securityMiddleware if not installed
- [ ] `npx prisma migrate dev --name add_gdpr_privacy_ack` — required for GDPR table

### Phase 1 — Products & Services

| Product/Service | Description | Revenue Model |
|---|---|---|
| Winners Free | Basic access — community + limited AI credits | Free |
| Winners Pro Workspace | Full access to all 8 platforms + AI credits + priority support | $29/month |
| Winners Enterprise | Custom subdomain + white-label + dedicated account manager | $99/month |
| Identity Verification | KYC/ID verification for trust score — Stripe Identity | One-time $4.99 or bundled |
| Winners Passport | Verified professional identity badge | $9.99/year |
| Referral Programme | Earn 20% recurring commission on referred Pro subscribers | Performance-based |

---

## 🔄 PHASE 2 — WINNERS COMMUNITY (55% COMPLETE)

### Design Aesthetic — Creative Professional Social
- Cleaner than Twitter, warmer than LinkedIn — inviting but serious
- Creator cards: profile photo, Trust Score, layer badges, follower count, top content
- Feed design: text posts, image posts, video posts, voice posts — all card-based
- Gold ring avatar border for verified/premium members
- Real-time engagement counters update without refresh

### Built

```
Server/routes/postRoutes.ts                        ✅ Full social API (posts, likes, comments, follows)
Server/routes/groupRoutes.ts                       ✅ Groups API (groups, members, posts)
Server/services/wsService.ts                       ✅ WebSocket server (Socket.io)
src/features/community/CommunityPage.tsx           ✅ Feed, posts, likes, comments, tags
src/features/community/GroupsPage.tsx              ✅ Groups UI
src/features/realtime/useRealtimeNotifications.ts  ✅ WebSocket hook
src/features/ui/toast.ts                           ✅ Toast notifications
prisma schema: Post, Comment, Like, Follow, Tag, PostTag, Group, GroupMember, GroupPost  ✅
```

### ⚠️ Critical — Not Wired Yet

```typescript
// Server/index.ts — ADD:
import postRoutes from "./routes/postRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
app.use("/posts", postRoutes);
app.use("/groups", groupRoutes);

// src/App.tsx — ADD:
import CommunityPage from "./features/community/CommunityPage";
import GroupsPage from "./features/community/GroupsPage";
<Route path="community" element={<CommunityPage />} />
<Route path="community/groups" element={<GroupsPage />} />

// src/components/layout/MainLayout.tsx — ADD:
{ path: '/community', icon: '🧑‍🤝‍🧑', label: 'Community' }
```

```bash
npx prisma db push && npx prisma generate
```

### Community Content Categories — Niches to Serve

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
- ✅ `groupRoutes.ts` — full groups functionality
- [ ] Online presence indicator in CommunityPage UI
- [ ] Live feed update (new posts without page refresh)
- [ ] Real-time notification badge in sidebar

### V1.2 — Groups (Built)

- ✅ Prisma schema: `Group`, `GroupMember`, `GroupPost`
- ✅ `groupRoutes.ts` — CRUD, join/leave, scoped feed
- ✅ `GroupsPage.tsx` — list + create groups
- ✅ Group admin roles (owner, moderator, member)
- ✅ Public / private / invite-only visibility
- ✅ Predefined niche groups: `#AfricanTech`, `#DiasporaInBusiness`, `#WinnersCreators`, `#AfroBeatMarketing`

### V1.3 — Direct Messaging (Not Started)

- [ ] Prisma schema: `Conversation`, `Message`, `MessageRead`
- [ ] `messageRoutes.ts` — send, read, mark read
- [ ] Real-time delivery via WebSocket
- [ ] `MessagesPage.tsx` — inbox + conversation view
- [ ] Unread badge, file sharing, message reactions, search

### V1.4 — Creator Tools (Not Started)

- [ ] 🎙️ Voice Posts — Record up to 3-minute voice posts, NOVA auto-transcribes
- [ ] 📡 Live Spaces — Twitter-Spaces-style audio rooms, recorded + transcribed
- [ ] 🌍 Diaspora Directory — Browse members by country, skill, industry
- [ ] 🔗 Opportunity Board — Members post jobs, collabs, mentorship, investment interest
- [ ] 📊 Creator Analytics — reach, impressions, follower growth, top posts
- [ ] 💎 Creator Economy — subscription tiers, exclusive posts, DMs (15% platform cut)
- [ ] 🏅 Community Challenges — weekly AI-generated challenges, best post wins credits

### V2.0 — AI-Powered Community — NOVA Goes Live

- [ ] NOVA wired into `CommunityPage.tsx` via `<AssistantPanel assistant="nova" />`
- [ ] NOVA analyses images in posts for brand safety
- [ ] NOVA transcribes voice posts + posts text
- [ ] NOVA detects creator talent from engagement patterns
- [ ] NOVA reports creator readiness to OMEGA → triggers Academy recommendation
- [ ] AI feed ranking algorithm, smart hashtag recommendations, trending topics engine

### Community — Products & Services

| Product/Service | Description | Revenue Model |
|---|---|---|
| Creator Pro Badge | Verified creator with analytics, monetisation tools, priority placement | $9/month or included in Winners Pro |
| Paid Community Membership | Creators sell private group access | 15% platform commission |
| Sponsored Posts / Brand Deals | Connect brands with creators | 10% of deal value |
| Community Ads | Businesses advertise to specific segments | CPM-based |
| Live Space Recording | Record spaces, publish as Academy lesson | Creator 70%, platform 30% |
| Diaspora Directory Premium | Enhanced business listing | $19/month |

---

## 🔄 PHASE 3 — WINNERS ACADEMY (30% COMPLETE)

### Design Aesthetic — Modern Learning Institution
- Light mode primary — learning environments need brightness and focus
- Course cards: thumbnail, instructor avatar, rating stars, student count, price badge
- Video player: custom branded player with chapter marks, speed controls, transcript toggle
- Progress visualisation: completion rings per module, animated certificate unlock
- Instructor profile: authority-first — photo, credentials, student count, rating

### Built

```
Server/routes/academyRoutes.ts              ✅ Full API — courses, modules, lessons,
                                               enrollment, progress, reviews, certificates
src/features/academy/AcademyPage.tsx        ✅ Course catalog UI
src/features/academy/CoursePage.tsx         ✅ Course player + progress tracking
src/features/academy/InstructorDashboard.tsx ✅ Instructor dashboard
src/features/academy/CourseCreatePage.tsx   ✅ Course creation form
src/features/academy/StudentDashboardPage.tsx ✅ Student dashboard
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

### Academy Course Categories — Niches to Serve

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

### V1.0 — Still Needed

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
- [ ] Live Cohorts — cohort-based learning with live sessions and peer projects
- [ ] SAGE gates certificate generation — verifies quiz + project completion
- [ ] SAGE reports learner completion to OMEGA → triggers Work match pipeline

### Academy — Products & Services

| Product/Service | Description | Revenue Model |
|---|---|---|
| Course Sales | Learners pay per course | $19–$499 per course; 70% instructor / 30% platform |
| Academy Pro All-Access | Unlimited courses + SAGE AI tutor | $19/month |
| Live Cohort Premium | Structured learning with live sessions + instructor access | $199–$999 per cohort |
| Corporate Learning Packages | Businesses enrol employees in curated paths | $29/employee/month |
| Certificate Verification API | Third parties verify certificates | $0.50 per verification or $49/month unlimited |
| Instructor Promotion | Featured course placement + sponsored newsletter | $99–$499 per campaign |

---

## 📋 PHASE 4 — WINNERS MARKET (0% — 10 VERTICALS)

### Design Aesthetic — Commerce Empire
- Two modes: Shopper view (clean, conversion-optimised) and Vendor Dashboard (data-dense, analytical)
- Product cards: high-quality image, price, vendor trust score, delivery time, 'Add to Cart'
- Vendor dashboard: revenue charts, inventory management, order queue, ATLAS AI panel
- Gold 'Winners Verified Vendor' badge on qualifying stores
- Stripe-quality checkout: single-page, autofill, Apple Pay / Google Pay / Flutterwave

### The 10 Market Verticals

| # | Vertical | What It Is | Target Seller | Revenue Model |
|---|---|---|---|---|
| 4A | 🛒 Commerce Hub | Physical + digital product marketplace. Vendor onboarding, catalogue, cart, checkout | Retailers, artisans, brands | 10–20% commission per sale |
| 4B | 📣 Digital Marketing Hub | Ad builder, SEO tools, social scheduler, email marketing | Small businesses, agencies | $49–$199/month subscription |
| 4C | 📺 Winners Stream | Live streaming, VOD, pay-per-view, virtual concerts, tipping | Artists, speakers, coaches | 15% of subscriptions + 10% of tips |
| 4D | 📈 Trading & Signals | Copy trading, market signals, investment strategies, African stock data | Traders, fintech creators | $49–$149/month subscriptions |
| 4E | 📋 Business Launcher | Business plan AI, pitch decks, financial projections, company registration guides | First-time entrepreneurs | $29–$99 per plan or $49/month |
| 4F | 📄 CV & Career Tools | ATS-optimised CV builder, cover letter AI, LinkedIn optimiser, interview prep | Job seekers, diaspora professionals | $9.99–$29 per document |
| 4G | 🎟 Winners Events | Event ticketing, virtual concerts, NFT passes, sponsorship | Event organisers, artists | 5–10% ticket commission |
| 4H | 🏠 Winners Property | African property listings, diaspora investment guides, mortgage calculators | Property developers, agents | 3–5% commission on leads |
| 4I | 💪 Health & Beauty | African beauty products, wellness packages, healthcare booking | Beauty brands, health businesses | 10–15% commission |
| 4J | 🍽️ Food & Agriculture | African food brands, farm-to-diaspora subscriptions, agribusiness products | Farmers, food entrepreneurs | 8–12% commission |

**Build sequence:** `4A → 4B → 4C → 4E → 4F → 4D → 4G → 4H → 4I → 4J`

### 4A V1.1 — Dropshipping Partners

| Supplier | Speciality | Integration | Recommended For |
|---|---|---|---|
| Printful | Print-on-demand: apparel, accessories, homeware | Official API | African culture merchandise, fashion brands |
| Gelato | Print-on-demand with African fulfilment centres | Official API | Art prints, books, stationery |
| AliExpress / DSers | General merchandise, electronics, accessories | API + webhooks | General retailers, test-before-stock |
| CJ Dropshipping | General + Private Label | API | African sellers, custom sourcing |
| Spocket | US/EU suppliers, premium quality | Official API | Diaspora sellers serving Western markets |
| Zendrop | Fast shipping, US-based warehouses | Official API | US-focused African diaspora sellers |
| Printify | Print-on-demand with 900+ products | Official API | Designers, artists wanting wide product range |

### What's Built (Demo Only — Needs Conversion)

```
src/features/market/WinnersMarketExpanded.jsx         🆕 681 lines — demo — convert to .tsx
src/features/market/dropshipping/WinnersDropshipping.jsx  🆕 837 lines — demo — convert to .tsx
```

### Phase 4 — What's Needed

```
Prisma schema: Product, ProductVariant, ProductImage
               Cart, CartItem
               Order, OrderItem, OrderStatus
               Vendor, VendorApplication, Review

Server/routes/productRoutes.ts      — CRUD, search, filter, sort
Server/routes/cartRoutes.ts         — add/remove/update cart
Server/routes/orderRoutes.ts        — checkout, status, history
Server/routes/vendorRoutes.ts       — onboarding, dashboard, payouts
Server/routes/dropshippingRoutes.ts — store CRUD, product import, auto-fulfillment

src/features/market/MarketPage.tsx        — product catalog
src/features/market/ProductPage.tsx       — detail + reviews
src/features/market/CartPage.tsx          — cart + Stripe checkout
src/features/market/OrdersPage.tsx        — order history
src/features/market/VendorDashboard.tsx   — analytics + inventory
```

---

## 🔄 PHASE 5 — WINNERS INTELLIGENCE (35% COMPLETE) ⬆️ UPGRADED

### What Changed This Session

Winners Intelligence has been **upgraded from a single chatbot layer to a full Universal AI Platform** — the complete AI operating system of the Winners Ecosystem.

**Before:** Aria chatbot only (Claude API), web only, 15% complete
**After:** Universal AI Platform — Web + Desktop + Mobile + API, local + cloud AI, 35% complete (spec 100%)

### Design Aesthetic — Premium AI Studio
- Dark, focused, precise — where serious AI work happens
- Three-panel layout: left sidebar (conversations), centre (chat), right (context panel)
- Model selector: clear visual toggle between Claude, GPT-4o, Gemini, and local Ollama
- File drop zone: drag-and-drop anywhere — images, PDFs, audio, video
- Streaming responses: text appears token-by-token
- Provider badge on each response: small icon showing which AI model answered

### Built

```
Server/routes/aiRoutes.ts                            ✅ Claude API + SSE streaming insights
Server/routes/chatRoutes.ts                          ✅ Aria chatbot — /chat/message + /chat/suggest
src/features/intelligence/WinnersChat.tsx            ✅ Aria — full production chatbot
src/features/intelligence/WinnersIntelligencePage.tsx  ✅ 6-agent AI dashboard + neural visualizer
```

### 🆕 Universal AI Platform Architecture (Spec Complete — Implementation Pending)

**Full stack architecture:**
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
└─ Claude API ─ Aria brain + cloud fallback (paid, highest quality)
```

### 🆕 Universal AI Platform — New Files to Create

```
ai-platform/                                   🆕 Python FastAPI sidecar service
├── main.py                                    FastAPI entry point
├── requirements.txt                           Python dependencies
├── Dockerfile                                 Railway deployment
├── routers/
│   ├── chat.py                                Ollama LLM + SSE streaming
│   ├── images.py                              ComfyUI image generation
│   └── speech.py                              Whisper STT
└── services/
    ├── ollama.py                              Ollama client
    └── whisper.py                             faster-whisper wrapper

Server/routes/aiPlatformRoutes.ts              🆕 Express proxy to AI Platform

src/features/intelligence/ai-platform/         🆕 Universal AI Platform UI (4-tab hub)
├── AIPlatformPage.tsx                         Chat · Image · Code · Voice tabs
├── hooks/useAIPlatform.ts                     Core API hook
└── components/
    ├── ChatWindow.tsx                         Winners design system chat UI
    ├── ModelSelector.tsx                       Switch Llama/DeepSeek/Qwen/Claude
    ├── VoiceInput.tsx                         Microphone + Whisper STT
    └── ImageGenerator.tsx                     Prompt → SD image output

desktop/main.js                                🆕 Electron wrapper (auto-starts Ollama)
mobile/WinnersAI/                              🆕 Expo React Native app
```

### Universal AI Platform — Capability Matrix

| Platform | LLM Chat | Image Gen | Voice/STT | Coding AI |
|---|---|---|---|---|
| Core Engine | ✅ Aria multi-model | — | ✅ Voice commands | — |
| Community | ✅ AI post suggestions | ✅ AI image gen | ✅ Voice posts | — |
| Academy | ✅ AI tutor chat | ✅ Course banners | ✅ Lecture STT | ✅ Code exercises |
| Market | ✅ Product descriptions | ✅ Product images | — | — |
| Intelligence (Aria) | ✅ Local + cloud | ✅ Image tasks | ✅ Voice interface | ✅ Dev assistant |
| Work | ✅ Proposal generator | — | — | ✅ Code review AI |

### ⚠️ Critical — Not Wired Yet

```typescript
// Server/index.ts — ADD:
import chatRoutes       from "./routes/chatRoutes.js";
import aiPlatformRoutes from "./routes/aiPlatformRoutes.js";  // create first

app.use("/chat",               chatRoutes);
app.use("/api/v1/ai-platform", aiPlatformRoutes);

// src/App.tsx — ADD:
import WinnersChat              from "./features/intelligence/WinnersChat";
import WinnersIntelligencePage  from "./features/intelligence/WinnersIntelligencePage";
import AIPlatformPage           from "./features/intelligence/ai-platform/AIPlatformPage";

<Route path="intelligence"            element={<WinnersIntelligencePage />} />
<Route path="intelligence/aria"       element={<WinnersChat />} />
<Route path="intelligence/platform"  element={<AIPlatformPage />} />

// src/components/layout/MainLayout.tsx — ADD:
{ path: '/intelligence', icon: '🤖', label: 'Intelligence',
  children: [
    { path: '/intelligence/aria',     label: 'Aria · AI Agents' },
    { path: '/intelligence/platform',  label: 'AI Platform'      },
  ]
}
```

```bash
# Add to Railway environment variables:
AI_PLATFORM_URL=http://localhost:8001
OLLAMA_HOST=http://localhost:11434
WHISPER_MODEL=medium
COMFYUI_HOST=http://localhost:7860

# After adding new Prisma models:
npx prisma migrate dev --name add_ai_platform
npx prisma generate
```

### 6 Specialized Agents (Built — `WinnersIntelligencePage.tsx`)

| Agent | Layer | Focus |
|---|---|---|
| Social Intelligence | Community | Detects skills from posts → routes to Academy + Work |
| Learning Path | Academy | 3-step personalized curriculum → earning potential |
| Commerce Intelligence | Market | Product analysis → pricing + target audience |
| Talent Matching | Work | Skills → job matches → rate recommendations |
| Core AI Orchestrator | Intelligence | Master agent coordinating all 6 layers |
| Platform Intelligence | Core | Unified recommendation spanning all platforms |

### New Prisma Models — Add to schema.prisma

```prisma
model AIPlatformUsage {
  id          String   @id @default(cuid())
  userId      String
  tenantId    String
  action      String   // chat | image | speech | code
  model       String   // ollama | claude | comfyui | whisper
  tokens      Int      @default(0)
  cost        Float    @default(0)
  latencyMs   Int
  createdAt   DateTime @default(now())
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
  id          String   @id @default(cuid())
  userId      String
  tenantId    String
  assistant   String   // omega | aria | nova | sage | atlas | forge | circuit
  memoryType  String   // user_profile | preference | journey | milestone | flag
  content     String   @db.Text
  confidence  Float    @default(1.0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([userId, assistant])
}

model AssistantAction {
  id           String   @id @default(cuid())
  assistant    String
  actionType   String   // notify | escalate | recommend | trigger | generate | flag
  targetUserId String?
  targetLayer  String?
  description  String   @db.Text
  payload      Json?
  approved     Boolean  @default(false)
  autoApproved Boolean  @default(false)
  executedAt   DateTime?
  result       String?  @db.Text
  createdAt    DateTime @default(now())
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

### Universal AI Platform — Build Phase 1 Commands

```bash
# Step 1 — Install Ollama + pull models
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1 && ollama pull deepseek-coder && ollama pull qwen2.5

# Step 2 — Create Python AI Platform service
mkdir ai-platform && cd ai-platform
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn httpx faster-whisper python-multipart

# Step 3 — Create all files
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

---

## 📋 PHASE 6 — WINNERS WORK (0% COMPLETE)

### Design Aesthetic — Professional Talent Marketplace
- Clean, white-forward, professional — clients browse like a premium agency roster
- Freelancer cards: portrait photo, Trust Score, top skills, Academy badges, hourly rate, availability
- Job board: rich listings with company logos, required skills, budget range, deadline
- Contract workspace: clean Notion-like environment for milestone tracking, file sharing
- Escrow payment indicator: clearly shows funds held and conditions for release

### Prisma Schema Needed

```prisma
JobListing, JobApplication, JobStatus
FreelancerProfile, Portfolio, PortfolioItem
Contract, ContractMilestone
EscrowPayment, EscrowRelease
WorkReview
```

### Key Features

- [ ] 🏅 Academy-Linked Profiles — certificates appear as verified skill badges
- [ ] 🤖 CIRCUIT AI Matching — reads job description + freelancer profiles, generates match scores
- [ ] 📝 AI Proposal Generator — CIRCUIT writes custom proposals
- [ ] 🔒 Escrow Protection — all contracts funded into escrow via Stripe + Flutterwave
- [ ] 🌍 African Talent Spotlight — top African talent by country and skill
- [ ] 💳 Multi-Currency — USD, GBP, EUR, KES, NGN, GHS, ZAR, XOF
- [ ] 🚀 Launch Packages — 3-free-bid + featured listing for 7 days after first Academy certificate

### Work — Products & Services

| Product/Service | Description | Revenue Model |
|---|---|---|
| Escrow Commission | Platform fee on all contracts | 8–12% of contract value |
| Job Posting | Clients post jobs | $10–$50 per listing |
| Featured Freelancer Placement | Monthly promoted placement | Monthly fee |
| Enterprise Hiring Packages | Custom bulk hiring | Custom pricing |

---

## 📋 PHASE 7 — MOBILE APP (0% COMPLETE)

**Foundation exists via Universal AI Platform mobile spec (`mobile/WinnersAI/` Expo project).**

**Design Aesthetic — Mobile-First African Digital Life:**
- Bottom navigation: 5 tabs — Home, Community, Learn, Work, AI
- Home: personalised feed from all 8 layers — AI-curated by OMEGA
- Dark mode default with optional light mode — battery-conscious
- Gesture-forward: swipe to go back, pull to refresh, long-press for quick actions
- Offline-first: cached community feed, downloaded courses, local AI via Ollama

**Build Checklist:**
- [ ] Service worker + manifest (PWA, install-to-homescreen)
- [ ] Push notifications (Firebase FCM)
- [ ] Biometric login, offline video sync
- [ ] Expo SDK — iOS + Android (`mobile/WinnersAI/` directory)
- [ ] Shared Zustand stores + API layer with web
- [ ] Voice-First Interface — tap to talk to any assistant
- [ ] Camera Integration — photograph product for ATLAS, assignment for SAGE
- [ ] Mobile Payments — M-Pesa, Airtel Money, Orange Money, MTN MoMo, Flutterwave
- [ ] Data-Lite Mode — compresses images, text-first rendering for limited data

---

## 📋 PHASE 8 — WINNERS CLOUD (0% COMPLETE)

**Design Aesthetic — Developer-Grade Infrastructure:**
- Technical, clean, documentation-forward — like Stripe Docs or Vercel
- Code examples in every API section — JavaScript, Python, Go, cURL
- Interactive API explorer: test endpoints live
- Status page: real-time uptime monitoring
- Dark mode developer console: API keys, usage graphs, webhook logs

**Build Checklist:**
- [ ] Public REST API + OpenAPI/Swagger docs
- [ ] Developer portal + API key management + webhooks
- [ ] SDK packages (JS, Python, Go)
- [ ] Plugin marketplace (30% revenue share for developers)
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
Server/routes/groupRoutes.ts                ✅  ⚠️ NOT wired in Server/index.ts
Server/routes/academyRoutes.ts              ✅  ⚠️ NOT wired in Server/index.ts
Server/routes/chatRoutes.ts                 ✅  ⚠️ NOT wired in Server/index.ts
Server/routes/aiPlatformRoutes.ts           🆕  TO CREATE — proxy to FastAPI
Server/services/emailScheduler.ts           ✅
Server/services/referralService.ts          ✅
Server/services/wsService.ts                ✅
Server/services/appRegistry.ts              ✅  ⚠️ Confirm in GitHub
Server/services/omegaReports.ts             📋  NOT built — OMEGA daily briefing cron
sdk/WinnersSDK.ts                           ✅  ⚠️ Confirm in GitHub
prisma/schema.prisma                        ✅  + AI Platform models pending migration
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
src/features/ai/AIRecommendationCard.tsx            ✅
src/features/billing/BillingPage.tsx                  ✅
src/features/team/TeamPage.tsx                        ✅
src/features/team/inviteStore.ts                      ✅
src/features/profile/ProfilePage.tsx                  ✅
src/features/settings/SettingsPage.tsx                ✅
src/features/changelog/ChangelogPage.tsx              ✅
src/features/theme/themeStore.ts                      ✅
src/components/layout/MainLayout.tsx                  ✅
src/features/community/CommunityPage.tsx              ✅  ⚠️ NOT in App.tsx routing
src/features/community/GroupsPage.tsx                  ✅  ⚠️ NOT in App.tsx routing
src/features/realtime/useRealtimeNotifications.ts     ✅
src/features/ui/toast.ts                              ✅
src/features/academy/AcademyPage.tsx                  ✅  ⚠️ NOT in App.tsx routing
src/features/academy/CoursePage.tsx                   ✅  ⚠️ NOT in App.tsx routing
src/features/academy/InstructorDashboard.tsx          ✅
src/features/academy/CourseCreatePage.tsx             ✅
src/features/academy/StudentDashboardPage.tsx          ✅
src/features/intelligence/WinnersChat.tsx             ✅  ⚠️ NOT in App.tsx routing
src/features/intelligence/WinnersIntelligencePage.tsx ✅  ⚠️ NOT in App.tsx routing
src/features/market/WinnersMarketExpanded.jsx         🆕  Demo — convert to .tsx
src/features/market/dropshipping/WinnersDropshipping.jsx  🆕  Demo — convert to .tsx
```

### Universal AI Platform — New Files to Create

```
ai-platform/main.py                                   🆕 TO CREATE
ai-platform/requirements.txt                          🆕 TO CREATE
ai-platform/Dockerfile                              🆕 TO CREATE
ai-platform/routers/chat.py                         🆕 TO CREATE
ai-platform/routers/images.py                       🆕 TO CREATE
ai-platform/routers/speech.py                       🆕 TO CREATE
ai-platform/services/ollama.py                      🆕 TO CREATE
ai-platform/services/whisper.py                    🆕 TO CREATE

src/features/intelligence/ai-platform/AIPlatformPage.tsx       🆕 TO CREATE
src/features/intelligence/ai-platform/hooks/useAIPlatform.ts   🆕 TO CREATE
src/features/intelligence/ai-platform/components/ChatWindow.tsx      🆕 TO CREATE
src/features/intelligence/ai-platform/components/ModelSelector.tsx   🆕 TO CREATE
src/features/intelligence/ai-platform/components/VoiceInput.tsx      🆕 TO CREATE
src/features/intelligence/ai-platform/components/ImageGenerator.tsx  🆕 TO CREATE

src/features/intelligence/omega/OmegaDashboard.tsx    🆕 TO CREATE
src/components/ai/AssistantPanel.tsx                  🆕 TO CREATE — embeds in all 8 layers
src/components/ai/FileDropZone.tsx                    🆕 TO CREATE
src/components/ai/ModelSelector.tsx                   🆕 TO CREATE
src/hooks/useMultimodalChat.ts                        🆕 TO CREATE
src/hooks/useAssistant.ts                           🆕 TO CREATE

desktop/main.js                                       🆕 TO CREATE (Electron)
mobile/WinnersAI/                                     🆕 TO CREATE (Expo project)
```

---

## 🚨 CRITICAL PENDING ACTIONS

### 🔴 Do First — Wire All Routes and Pages

```typescript
// ── Server/index.ts ─────────────────────────────────────────────────────────
import postRoutes       from "./routes/postRoutes.js";
import groupRoutes      from "./routes/groupRoutes.js";
import academyRoutes    from "./routes/academyRoutes.js";
import chatRoutes       from "./routes/chatRoutes.js";
import aiPlatformRoutes from "./routes/aiPlatformRoutes.js";  // create first

app.use("/posts",              postRoutes);
app.use("/groups",             groupRoutes);
app.use("/academy",            academyRoutes);
app.use("/chat",               chatRoutes);
app.use("/api/v1/ai-platform", aiPlatformRoutes);

// ── src/App.tsx ──────────────────────────────────────────────────────────────
import CommunityPage           from "./features/community/CommunityPage";
import GroupsPage              from "./features/community/GroupsPage";
import AcademyPage             from "./features/academy/AcademyPage";
import CoursePage              from "./features/academy/CoursePage";
import WinnersChat             from "./features/intelligence/WinnersChat";
import WinnersIntelligencePage from "./features/intelligence/WinnersIntelligencePage";
import AIPlatformPage          from "./features/intelligence/ai-platform/AIPlatformPage";

<Route path="community"             element={<CommunityPage />} />
<Route path="community/groups"      element={<GroupsPage />} />
<Route path="academy"               element={<AcademyPage />} />
<Route path="academy/courses/:slug" element={<CoursePage />} />
<Route path="intelligence"          element={<WinnersIntelligencePage />} />
<Route path="intelligence/aria"     element={<WinnersChat />} />
<Route path="intelligence/platform" element={<AIPlatformPage />} />

// ── src/components/layout/MainLayout.tsx ─────────────────────────────────────
{ path: '/community',    icon: '🧑‍🤝‍🧑', label: 'Community'  }
{ path: '/academy',      icon: '🎓',    label: 'Academy'     }
{ path: '/intelligence', icon: '🤖',    label: 'Intelligence',
  children: [
    { path: '/intelligence/aria',     label: 'Aria · AI Agents' },
    { path: '/intelligence/platform', label: 'AI Platform'      },
  ]
}
```

```bash
npx prisma db push && npx prisma generate
git add . && git commit -m "sync: wire routes + push schema" && git push
```

### 🔴 Resolve Session Drift — Push Missing Files to GitHub

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) | grep -v node_modules | grep -v .git | sort
git add .
git commit -m "sync: push all generated files from prior sessions"
git push
```

### 🟡 Next Sprint

- [ ] Fix `RevenueChart.tsx` — remove all hardcoded hex colors, use CSS variables
- [ ] Community V1.3 — Direct Messaging (Prisma + routes + React)
- [ ] Fix `tenantId` scoping on post edit/delete (security gap)
- [ ] Academy Stripe payment UI for paid courses
- [ ] Build Universal AI Platform Phase 1 (Ollama + FastAPI service)

### 🟢 Medium Term

- [ ] Build `AssistantPanel.tsx` — reusable component for all layers
- [ ] Build `FileDropZone.tsx` + `useMultimodalChat.ts` + `useAssistant.ts`
- [ ] Academy quiz system + PDF certificate generation (PDFKit installed)
- [ ] SAGE AI tutor in CoursePage (after AssistantPanel built)
- [ ] PostgreSQL RLS policies (security hardening)
- [ ] `npx prisma migrate dev --name add_ai_platform`

### 🔵 Phase 4 Kickoff

- [ ] Market V1.0 Core Commerce — Prisma schema + 4 backend routes
- [ ] Printful + Gelato API integration (dropshipping V1.1)
- [ ] Convert `WinnersMarketExpanded.jsx` → production `.tsx`
- [ ] Convert `WinnersDropshipping.jsx` → production `.tsx`

---

## 🎯 EXECUTION PRIORITIES — ORDERED

| Priority | Action | Platform | Impact |
|---|---|---|---|
| 🔴 1 | Wire all 5 routes in Server/index.ts (posts + groups + academy + chat + aiPlatform) | Core Engine | Unblocks Community, Groups, Academy, Aria, AI Platform simultaneously |
| 🔴 2 | Add all pages to App.tsx routing + MainLayout nav | Core Engine | Makes all platforms accessible |
| 🔴 3 | Build Community Direct Messaging (Prisma + routes + React) | Community | 55% → 75% |
| 🟡 4 | Build AI Platform FastAPI service + wire aiPlatformRoutes.ts | Intelligence | Ollama local AI goes live |
| 🟡 5 | Run Prisma migrations for AI Platform models | Intelligence | Enables SAGE tutor, NOVA, all assistants |
| 🟡 6 | Build AssistantPanel + wire NOVA/SAGE into Community/Academy | Community + Academy | AI-supervised platforms go live |
| 🟢 7 | Design + build Market 4A: Product, Cart, Order, Vendor | Market | Commerce engine starts |
| 🟢 8 | Build OMEGA Dashboard at /intelligence/omega | Intelligence | Ecosystem supervision live |
| 🟢 9 | PWA setup: service worker + manifest + mobile-responsive | Mobile | Installable on mobile home screen |
| 🔵 10 | Electron desktop wrapper for Intelligence Platform | Intelligence | Desktop app + offline capability |
| 🔵 11 | Winners Cloud API — JS SDK + documentation portal | Cloud | Opens developer platform |

---

## 💰 UNIFIED MONETIZATION MODEL

| Platform | Revenue Stream | Model | MRR at Scale |
|---|---|---|---|
| Core Engine | Workspace subscriptions | FREE / PRO $29 / ENTERPRISE $99/mo | $20K–$200K |
| Community | Creator subscriptions | 10–15% platform cut | $10K–$100K |
| Community | Sponsored posts + community ads | CPM + deal % | $5K–$50K |
| Academy | Course revenue share | 30% platform, 70% instructor | $15K–$150K |
| Academy | Academy Pro | $19/month = all courses | $10K–$100K |
| Academy | Live cohorts | $199–$999 per cohort | $10K–$100K |
| Market — Commerce | Transaction commission | 10–20% per sale | $50K–$500K |
| Market — Streaming | Subscriptions + PPV | 15% sub cut, 10% tipping | $20K–$200K |
| Market — Marketing Hub | Service packages | 20% platform cut | $15K–$150K |
| Market — Trading | Signals + copy trading | $49–149/mo | $30K–$300K |
| Intelligence | AI credit packs | Pay per query | $10K–$80K |
| Intelligence | Intelligence Pro | $19/month | $15K–$120K |
| Intelligence | Desktop license | $49 one-time / $9/mo | $5K–$50K |
| Intelligence | OMEGA Enterprise | $500–$5K/month | $10K–$150K |
| Intelligence | White-label AI | Custom | $20K–$200K |
| Work | Escrow commission | 8–12% of contract value | $15K–$150K |
| Work | Job posting + featured placement | $10–$50 per listing | $5K–$50K |
| Cloud | Developer API access | Usage-based | $8K–$80K |
| Cloud | Enterprise licensing | $500–$5,000/month | $10K–$500K |
| Cloud | Plugin marketplace | 30% platform cut | $5K–$50K |

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
AI Local:       Ollama — Llama 3.1 · DeepSeek Coder · Qwen 2.5   🆕
AI STT:         faster-whisper (Medium model — offline)            🆕
AI Images:      ComfyUI / Automatic1111 (Stable Diffusion XL)     🆕
AI Backend:     Python + FastAPI (port 8001 — sidecar service)    🆕
Notifications:  Slack API
Export:         ExcelJS + PDFKit + json2csv
Security:       Helmet + express-rate-limit
Hosting:        Railway (monorepo + AI Platform as second service)
Desktop:        Electron (wraps React web app)                     🆕 Planned
Mobile:         Expo + React Native                                🆕 Planned
```

### Technology Partners

| Category | Tool | Why Winners Needs It |
|---|---|---|
| Payments | Stripe | Cards, subscriptions, escrow, payouts |
| Payments Africa | Flutterwave | M-Pesa, MTN MoMo in 34 African countries |
| Video | Mux | Adaptive streaming for Academy and Community |
| AI Cloud | Anthropic Claude | ARIA, SAGE, OMEGA — best reasoning |
| AI Cloud | OpenAI GPT-4o | Audio, vision, code — best multimodal |
| AI Cloud | Google Gemini | Video analysis — native video support |
| AI Local | Ollama | Free offline LLMs — no API cost |
| AI Images | ComfyUI + SDXL | Local image generation |
| AI STT | faster-whisper | Offline speech-to-text |
| Email | Resend | Transactional + campaigns |
| Search | Meilisearch / Algolia | Cross-platform search |
| Cache | Redis (Upstash) | Session, rate limiting, real-time counters |
| Monitoring | Sentry | Error tracking across all 8 platforms |

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
OPENAI_API_KEY=sk-...            # GPT-4o — audio + images
GOOGLE_API_KEY=AIza...           # Gemini — video + audio + PDFs

# AI — Platform Service (add to Railway AI Platform service)
AI_PLATFORM_URL=http://localhost:8001    # 🆕 ADD THIS
OLLAMA_HOST=http://localhost:11434       # 🆕 ADD THIS
WHISPER_MODEL=medium                     # 🆕 ADD THIS
COMFYUI_HOST=http://localhost:7860       # 🆕 ADD THIS

# File Storage
CLOUDINARY_CLOUD_NAME=winners-empire
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Storage (when ready)
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
| Binance | Dark theme, data density, trust signals, African market focus | Market Trading |
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

- A **social network** with 1M+ African/diaspora creators (Community) supervised by NOVA
- An **education system** with 10,000+ courses (Academy) tutored by SAGE
- A **commerce empire** with 10 verticals and $1M+ ARR (Market) powered by ATLAS
- A **work network** with 100,000+ freelancers (Work) matched by CIRCUIT
- An **AI infrastructure** every layer depends on (Intelligence + Universal AI Platform) orchestrated by OMEGA
- A **developer marketplace** where others build on the platform (Cloud) supported by NEXUS

**All unified by one AI intelligence core. One identity. One ecosystem. Nine AI supervisors.**

---

> *"Most founders try to build everything at once. That's how projects die.*
> *You build: Infrastructure → Engagement → Value → Monetization → Intelligence → Scale.*
> *In that order. With discipline."*

---

**Replace all previous project knowledge documents with this single file.**
**Update this file after every build session.**
*Last updated: February 28, 2026 · Version 5.0 · winners-empire-eco.up.railway.app*
*Incorporates: V4 (Design Strategy + AI Assistants Roadmap + Intelligence v2.0) + Universal AI Platform Spec (Ollama + Whisper + ComfyUI + FastAPI)*
