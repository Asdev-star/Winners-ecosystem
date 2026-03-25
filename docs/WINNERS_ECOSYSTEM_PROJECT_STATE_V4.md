# 🏆 WINNERS ECOSYSTEM — MASTER PROJECT STATE
### Single Source of Truth · Build Bible · Last Updated: February 28, 2026

> **Live URL:** https://winners-empire-eco.up.railway.app
> **Stack:** React 18 + TypeScript (Vite) · Node/Express · PostgreSQL (Prisma) · Railway
> **AI Core:** Anthropic Claude API · `claude-opus-4-6` + Ollama (local LLMs) · faster-whisper · ComfyUI
> **Vision:** Digital Sovereign Infrastructure — one account, one identity, one ecosystem
> **Overall Progress: ~40% Complete**

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
| 🤖 | Winners Intelligence | ai.winnersempire.io | 🔄 Building | **35%** | Upgraded — Universal AI Platform spec complete |
| 💼 | Winners Work | work.winnersempire.io | 📋 Planned | **0%** | Awaiting Market |
| 📱 | Mobile App | — | 📋 Planned | **0%** | Awaiting web stability |
| ☁️ | Winners Cloud | cloud.winnersempire.io | 📋 Planned | **0%** | Awaiting all platforms |
| 🧠 | Universal AI Platform | aiplatform.winnersempire.io | 🆕 Spec Complete | **Spec 100%** | Implementation in progress |

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

### V1.3 — Direct Messaging (Not Started)

- [ ] Prisma schema: `Conversation`, `Message`, `MessageRead`
- [ ] `messageRoutes.ts` — send, read, mark read
- [ ] Real-time delivery via WebSocket
- [ ] `MessagesPage.tsx` — inbox + conversation view

### V1.4 — Creator Tools (Not Started)

- [ ] User profile pages (bio, skills, links, portfolio)
- [ ] Post scheduling, tip/donation system (Stripe)
- [ ] Creator analytics (views, reach, follower growth)

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

---

## 📋 PHASE 4 — WINNERS MARKET (0% — EXPANDED TO 10 VERTICALS)

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

Prototype files exist (`.jsx` demos) — pending conversion to production `.tsx`:
```
src/features/market/WinnersMarketExpanded.jsx         🆕 Demo — convert to .tsx
src/features/market/dropshipping/WinnersDropshipping.jsx  🆕 Demo — convert to .tsx
```

---

## 🔄 PHASE 5 — WINNERS INTELLIGENCE (35% COMPLETE) ⬆️ UPGRADED

### What Changed This Session

Winners Intelligence has been **upgraded from a single chatbot layer to a full Universal AI Platform** — the complete AI operating system of the Winners Ecosystem. Specification document fully written and delivered (`Winners_Intelligence_v2_Complete.docx`).

**Before:** Aria chatbot only (Claude API), web only, 15% complete
**After:** Universal AI Platform — Web + Desktop + Mobile + API, local + cloud AI, 35% complete (spec 100%)

### Built

```
Server/routes/aiRoutes.ts                            ✅ Claude API + SSE streaming insights
Server/routes/chatRoutes.ts                          ✅ Aria chatbot — /chat/message + /chat/suggest
src/features/intelligence/WinnersChat.tsx            ✅ Aria — full production chatbot component
src/features/intelligence/WinnersIntelligencePage.tsx  ✅ 6-agent AI dashboard + neural visualizer
```

### 🆕 NEW — Universal AI Platform (Spec Complete, Implementation Pending)

**Architecture:**
```
Frontends (React Web · Electron Desktop · React Native Mobile)
    ↓ HTTP / WebSocket
Winners Backend (Express — existing)
    ↓ Internal HTTP localhost:8001
AI Platform Service (FastAPI — NEW, port 8001)
    ↓
Ollama (Llama 3.1, DeepSeek Coder, Qwen 2.5)
Whisper (faster-whisper Medium — offline STT)
ComfyUI (Stable Diffusion XL — image generation)
Claude API (Aria brain + cloud fallback)
```

**New files to create (full code in spec doc):**

```
ai-platform/                                   🆕 Python FastAPI sidecar service
├── main.py                                    FastAPI entry point
├── routers/
│   ├── chat.py                                Ollama LLM + SSE streaming
│   ├── images.py                              ComfyUI image generation
│   └── speech.py                             Whisper STT
└── services/
    ├── ollama.py                              Ollama client
    └── whisper.py                             faster-whisper wrapper

Server/routes/aiPlatformRoutes.ts              🆕 Express proxy to AI Platform
Server/index.ts                               ⚠️ Wire aiPlatformRoutes + ALL pending routes

src/features/intelligence/ai-platform/        🆕 Universal AI Platform UI
├── AIPlatformPage.tsx                        4-tab hub (Chat · Image · Code · Voice)
├── hooks/useAIPlatform.ts                    Core API hook
└── components/
    ├── ChatWindow.tsx                         Winners design system chat UI
    ├── ModelSelector.tsx                      Switch Llama/DeepSeek/Qwen/Claude
    ├── VoiceInput.tsx                         Microphone + Whisper STT
    └── ImageGenerator.tsx                    Prompt → SD image output

desktop/main.js                               🆕 Electron wrapper (auto-starts Ollama)
mobile/WinnersAI/                             🆕 Expo React Native app
```

**New Prisma models to add:**
```prisma
model AIPlatformUsage { ... }    // Track every AI action for billing
model AIConversation  { ... }    // Persistent chat history
model AIMessage       { ... }    // Individual messages per conversation
```

### ⚠️ Critical — Not Wired Yet

```typescript
// Server/index.ts — ADD:
import chatRoutes       from "./routes/chatRoutes.js";
import aiPlatformRoutes from "./routes/aiPlatformRoutes.js";

app.use("/chat",          chatRoutes);
app.use("/api/v1/ai-platform", aiPlatformRoutes);

// src/App.tsx — ADD:
import WinnersChat           from "./features/intelligence/WinnersChat";
import WinnersIntelligencePage from "./features/intelligence/WinnersIntelligencePage";
import AIPlatformPage        from "./features/intelligence/ai-platform/AIPlatformPage";

<Route path="intelligence"            element={<WinnersIntelligencePage />} />
<Route path="intelligence/aria"       element={<WinnersChat />} />
<Route path="intelligence/platform"   element={<AIPlatformPage />} />

// src/components/layout/MainLayout.tsx — ADD:
{ path: '/intelligence', icon: '🤖', label: 'Intelligence',
  children: [
    { path: '/intelligence/aria',     label: 'Aria · AI Agents' },
    { path: '/intelligence/platform', label: 'AI Platform'      },
  ]
}
```

```bash
# Environment variable to add in Railway:
AI_PLATFORM_URL=http://localhost:8001

# After adding Prisma models:
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

### Universal AI Platform — Capability Matrix

| Platform | LLM Chat | Image Gen | Voice/STT | Coding AI |
|----------|----------|-----------|-----------|-----------|
| Core Engine | ✅ Aria multi-model | — | ✅ Voice commands | — |
| Community | ✅ AI post suggestions | ✅ AI image gen | ✅ Voice posts | — |
| Academy | ✅ AI tutor chat | ✅ Course banners | ✅ Lecture STT | ✅ Code exercises |
| Market | ✅ Product descriptions | ✅ Product images | — | — |
| Intelligence (Aria) | ✅ Local + cloud | ✅ Image tasks | ✅ Voice interface | ✅ Dev assistant |
| Work | ✅ Proposal generator | — | — | ✅ Code review AI |

### Intelligence Monetization

| Stream | Model | MRR Potential |
|---|---|---|
| AI Credit Packs | Pay-per-use | $10K–$80K |
| Intelligence Pro | $19/month | $15K–$120K |
| Intelligence Team | $49/month per team | $10K–$90K |
| Desktop App License | $49 one-time / $9/mo | $5K–$50K |
| API Access (Cloud) | Usage-based | $8K–$80K |
| White-label AI | Custom pricing | $20K–$200K |

---

## 📋 PHASE 6 — WINNERS WORK (0% COMPLETE)

- [ ] Prisma schema: `JobListing`, `JobApplication`, `FreelancerProfile`, `Contract`, `EscrowPayment`
- [ ] Job board (post + apply)
- [ ] Freelancer profiles + portfolios
- [ ] AI skill matching via Intelligence layer
- [ ] Escrow payment system (Stripe + Flutterwave)
- [ ] Academy → Work connection (certificates → job matching)

---

## 📋 PHASE 7 — MOBILE APP (0% COMPLETE)

**Note:** Foundation now exists via Universal AI Platform mobile spec.

- [ ] Service worker + manifest (PWA, install-to-homescreen)
- [ ] Push notifications (Firebase FCM)
- [ ] Expo SDK — iOS + Android (`mobile/WinnersAI/` directory created in spec)
- [ ] Shared Zustand stores + API layer with web

---

## 📋 PHASE 8 — WINNERS CLOUD (0% COMPLETE)

- [ ] Public REST API + OpenAPI/Swagger docs
- [ ] Developer portal + API key management + webhooks
- [ ] SDK packages (JS, Python, Go)
- [ ] Plugin marketplace (30% revenue share)
- [ ] White-label licensing
- [ ] Enterprise SSO (SAML, Okta, Azure AD)

---

## 🗂️ COMPLETE FILE INVENTORY

### Backend Routes

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
Server/routes/chatRoutes.ts                 ✅  ⚠️ NOT wired in Server/index.ts
Server/routes/aiPlatformRoutes.ts           🆕  TO CREATE — code in spec doc
Server/services/emailScheduler.ts           ✅
Server/services/referralService.ts          ✅
Server/services/wsService.ts                ✅
Server/services/appRegistry.ts              ✅  ⚠️ Confirm in GitHub
sdk/WinnersSDK.ts                           ✅  ⚠️ Confirm in GitHub
prisma/schema.prisma                        ✅  + AIPlatformUsage, AIConversation, AIMessage pending
```

### Frontend Pages

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
src/features/intelligence/WinnersChat.tsx             ✅  ⚠️ NOT in App.tsx routing
src/features/intelligence/WinnersIntelligencePage.tsx ✅  ⚠️ NOT in App.tsx routing
src/features/market/WinnersMarketExpanded.jsx         🆕  Demo — convert to .tsx
src/features/market/dropshipping/WinnersDropshipping.jsx  🆕  Demo — convert to .tsx
```

### Universal AI Platform (New — To Create)

```
ai-platform/main.py                                   🆕 TO CREATE
ai-platform/routers/chat.py                           🆕 TO CREATE
ai-platform/routers/images.py                         🆕 TO CREATE
ai-platform/routers/speech.py                         🆕 TO CREATE
ai-platform/services/ollama.py                        🆕 TO CREATE
ai-platform/services/whisper.py                       🆕 TO CREATE
ai-platform/Dockerfile                                🆕 TO CREATE
ai-platform/requirements.txt                          🆕 TO CREATE
desktop/main.js                                       🆕 TO CREATE
mobile/WinnersAI/                                     🆕 TO CREATE (Expo project)

src/features/intelligence/ai-platform/AIPlatformPage.tsx       🆕 TO CREATE
src/features/intelligence/ai-platform/hooks/useAIPlatform.ts   🆕 TO CREATE
src/features/intelligence/ai-platform/components/ChatWindow.tsx      🆕 TO CREATE
src/features/intelligence/ai-platform/components/ModelSelector.tsx   🆕 TO CREATE
src/features/intelligence/ai-platform/components/VoiceInput.tsx      🆕 TO CREATE
src/features/intelligence/ai-platform/components/ImageGenerator.tsx  🆕 TO CREATE
```

**Full starter code for ALL of the above is in:** `Winners_Intelligence_v2_Complete.docx`

---

## 🚨 CRITICAL PENDING ACTIONS

### 🔴 Do First — Wire All Routes (5 minutes each)

```typescript
// ── Server/index.ts ─────────────────────────────────────────────────────────
import postRoutes       from "./routes/postRoutes.js";
import academyRoutes    from "./routes/academyRoutes.js";
import chatRoutes       from "./routes/chatRoutes.js";
import aiPlatformRoutes from "./routes/aiPlatformRoutes.js";  // create first

app.use("/posts",              postRoutes);
app.use("/academy",            academyRoutes);
app.use("/chat",               chatRoutes);
app.use("/api/v1/ai-platform", aiPlatformRoutes);

// ── src/App.tsx ──────────────────────────────────────────────────────────────
import CommunityPage        from "./features/community/CommunityPage";
import AcademyPage          from "./features/academy/AcademyPage";
import CoursePage           from "./features/academy/CoursePage";
import WinnersChat          from "./features/intelligence/WinnersChat";
import WinnersIntelligencePage from "./features/intelligence/WinnersIntelligencePage";
import AIPlatformPage       from "./features/intelligence/ai-platform/AIPlatformPage";

<Route path="community"             element={<CommunityPage />} />
<Route path="academy"               element={<AcademyPage />} />
<Route path="academy/courses/:slug" element={<CoursePage />} />
<Route path="intelligence"          element={<WinnersIntelligencePage />} />
<Route path="intelligence/aria"     element={<WinnersChat />} />
<Route path="intelligence/platform" element={<AIPlatformPage />} />
```

```bash
npx prisma db push && npx prisma generate
```

### 🔴 Build Universal AI Platform — Phase 1 (Days 1–2)

```bash
# Step 1 — Install Ollama + pull models
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1 && ollama pull deepseek-coder && ollama pull qwen2.5

# Step 2 — Create Python AI Platform service
mkdir ai-platform && cd ai-platform
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn httpx faster-whisper python-multipart

# Step 3 — Create all files (code in Winners_Intelligence_v2_Complete.docx)
# main.py · routers/chat.py · routers/images.py · routers/speech.py
# services/ollama.py · services/whisper.py

# Step 4 — Start and test
uvicorn main:app --port 8001 --reload
curl http://localhost:8001/health

# Step 5 — Add to Railway env
# AI_PLATFORM_URL=http://localhost:8001

# Step 6 — Prisma migration
npx prisma migrate dev --name add_ai_platform
```

### 🟡 Next Sprint

- [ ] Fix `RevenueChart.tsx` — remove all hardcoded hex colors, use CSS variables
- [ ] Community V1.1 — online presence indicator (UI component only)
- [ ] Community V1.2 — Groups (Prisma schema + `groupRoutes.ts` + `GroupsPage.tsx`)
- [ ] Fix `tenantId` scoping on post edit/delete (known security gap)
- [ ] Academy V1.0 — `InstructorDashboard.tsx` + `CourseCreatePage.tsx`
- [ ] Academy Stripe payment UI for paid courses

### 🟢 Medium Term

- [ ] Academy quiz system + PDF certificate generation (PDFKit installed)
- [ ] Academy AI tutor (Claude API with course context injection)
- [ ] Wire Academy → Community (course references in posts)
- [ ] PostgreSQL RLS policies (security hardening)

### 🔵 Phase 4 Kickoff (After Intelligence wired)

- [ ] Market V1.0 Core Commerce — Prisma schema + 4 backend routes
- [ ] Printful + Gelato API integration (dropshipping V1.1)
- [ ] Convert `WinnersMarketExpanded.jsx` → production `.tsx`

---

## 📄 SESSION DELIVERABLES — February 28, 2026

Two specification documents were produced this session:

| Document | Contents |
|---|---|
| `Winners_Intelligence_v2_AI_Platform.docx` | Architecture upgrade spec — what changed, 8-layer scorecard, per-platform capability matrix, deployment guide |
| `Winners_Intelligence_v2_Complete.docx` | **Complete build bible** — all Phase 1–5 starter code, every file, 20-step action list, tools table, timeline |

Both documents contain full production-ready code for every new file needed.

---

## 💰 UNIFIED MONETIZATION MODEL

| Platform | Revenue Stream | Model | MRR at Scale |
|---|---|---|---|
| Core Engine | Workspace subscriptions | FREE / PRO $29 / ENTERPRISE $99/mo | $20K–$200K |
| Community | Creator subscriptions | 10–15% platform cut | $10K–$100K |
| Academy | Course revenue share | 30% platform, 70% instructor | $15K–$150K |
| Academy | Academy Pro | $19/month = all courses | — |
| Market — Commerce | Transaction commission | 10–20% per sale | $50K–$500K |
| Intelligence | AI credits + agents | $19–$49/month | $20K–$200K |
| Intelligence | Desktop license | $49 one-time / $9/mo | $5K–$50K |
| Intelligence | White-label AI | Custom | $20K–$200K |
| Work | Escrow commission | 8–12% of contract value | $15K–$150K |
| Cloud | Enterprise licensing | $500–5000/month | $10K–$500K |

**Combined potential: $1M+ ARR across all verticals at scale.**

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
AI Cloud:     Anthropic Claude API (Aria + recommendations)
AI Local:     Ollama (Llama 3.1 · DeepSeek Coder · Qwen 2.5)   🆕
AI STT:       faster-whisper (Medium model)                       🆕
AI Images:    ComfyUI / Automatic1111 (Stable Diffusion XL)      🆕
AI Backend:   Python + FastAPI (port 8001)                        🆕
Notifications: Slack API
Export:       ExcelJS + PDFKit + json2csv
Security:     Helmet + express-rate-limit
Hosting:      Railway (monorepo + AI Platform as second service)
Desktop:      Electron (wraps React web app)                      🆕 Planned
Mobile:       Expo + React Native                                 🆕 Planned
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
AI_PLATFORM_URL=http://localhost:8001        # 🆕 ADD THIS

# AI Platform Service (add to Railway AI Platform service)
OLLAMA_HOST=http://localhost:11434
WHISPER_MODEL=medium
COMFYUI_HOST=http://localhost:7860

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
- An **AI infrastructure** every layer depends on (Intelligence + Universal AI Platform)
- A **developer marketplace** where others build on the platform (Cloud)

**All unified by one AI intelligence core. One identity. One ecosystem.**

---

> *"Most founders try to build everything at once. That's how projects die.*
> *You build: Infrastructure → Engagement → Value → Monetization → Intelligence → Scale.*
> *In that order. With discipline."*

---

**Replace all previous project knowledge documents with this single file.**
**Update this file after every build session.**
*Last updated: February 28, 2026 · winners-empire-eco.up.railway.app*
