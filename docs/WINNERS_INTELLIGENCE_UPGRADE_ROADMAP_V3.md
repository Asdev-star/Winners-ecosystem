# 🏆 WINNERS ECOSYSTEM
## Complete AI Intelligence & Design Upgrade Roadmap
### *Making This Platform Visibly, Unmistakably, Irreversibly Intelligent*

---

> **Project:** Winners Ecosystem — Central Digital Operating System
> **Live URL:** https://winners-empire-eco.up.railway.app
> **Vision:** *Bloomberg Terminal meets a world-class creative studio — built for African and diaspora communities who refuse to settle for second-tier tools.*
> **Mission:** To give African and diaspora communities world-class digital infrastructure — premium, purposeful, AI-powered tools that compound their income, skills, and influence.
> **Document:** Strategic Recommendation — AI Intelligence & Design Upgrade Roadmap
> **Version:** 3.0 · March 2026 · *Supersedes V2.0*

---

## ⚡ WHY THIS DOCUMENT EXISTS

The architecture is right. The design language is defined. The 9 AI assistants are named and specced. The Agentic Loop — the core value proposition — is documented and partially built.

What V2.0 did not address is the **depth of intelligence** possible at each layer, the **new product categories** that emerge when AI is treated as infrastructure rather than a feature, and the **social dynamics** that make platforms with hundreds of millions of users irreplaceable. Winners Ecosystem has the architecture to be in that class. This document defines exactly how.

V3.0 adds five new strategic dimensions that V2.0 did not cover:

1. **Predictive Social Graph** — Winners Community becomes aware of who knows whom, who complements whom, and what connections are worth making. Not just posts — relationships.
2. **AI-Generated Revenue Streams** — New income mechanisms that could not exist without the AI layer: signal products, knowledge NFTs, live intelligence sessions.
3. **Reputation as Infrastructure** — Trust Score becomes a portable credential usable outside the ecosystem, by employers, lenders, and other platforms.
4. **Autonomous Growth Loops** — OMEGA doesn't just advise. It executes pre-approved growth actions silently, on behalf of the user, and reports results every morning.
5. **Ecosystem Network Effects** — Features that make the platform more valuable as it adds users — and less attractive to leave as those users accumulate history, reputation, and compound earnings.

---

## 🗺️ THE 11 UPGRADE LEVELS — MASTER OVERVIEW

| Level | Name | Core Theme | Platform Impact | Timeline |
|---|---|---|---|---|
| **I** | Design System Enforcement | Zero drift. Every surface speaks the same language. | Foundation | Sprint 1 |
| **II** | AI-Present on Every Page | Intelligence visible everywhere, even before it acts. | Engagement | Sprint 1–2 |
| **III** | Shared Component Architecture | Build once. Deploy across all 9 platforms simultaneously. | Architecture | Sprint 2–3 |
| **IV** | Reactive Ecosystem State | Actions in one layer trigger responses in another. | Connectivity | Sprint 3–4 |
| **V** | Named Supervisor Deployment | All 9 AI assistants go live with full personalities. | Intelligence | Sprint 4–5 |
| **VI** | Multimodal Intelligence | Voice, image, PDF, video — every format, every layer. | Capability | Sprint 5–6 |
| **VII** | Predictive & Autonomous OMEGA | The platform works while the user sleeps. | Transformation | Sprint 6–7 |
| **VIII** | Social Intelligence Graph | The platform knows relationships, not just individuals. | Network Effects | Sprint 7–8 |
| **IX** | Reputation as Sovereign Infrastructure | Trust Score becomes a portable passport. | Market Position | Phase 8–9 |
| **X** | AI-Native Revenue Products | New income streams that only AI makes possible. | Monetisation | Phase 9–10 |
| **XI** | Sovereign Infrastructure & API | Winners becomes the layer others build on. | Scale | Phase 11 |

---

## LEVELS I–IV SUMMARY (ALREADY BUILT)

### Level I - Design System Enforcement
- ✅ ContextBar.tsx - Live ecosystem status on every page

### Level II - AI-Present on Every Page  
- ✅ AIInsightBanner.tsx - Per-page AI insights with streaming
- ✅ Backend endpoint: /api/v1/ai/page-insight

### Level III - Shared Component Architecture
- ✅ AssistantPanel.tsx - The core AI panel component
- ✅ useAssistant.ts hook - Auto-detects correct assistant per route

### Level IV - Reactive Ecosystem State
- ✅ ecosystemStore.ts - Central nervous system connecting all layers

---

## NEW V3.0 COMPONENTS TO BUILD

### Level I–IV Extensions

```tsx
// src/components/ui/AgenticLoopWidget.tsx
// 7-node loop visualizer — persistent in sidebar

// src/components/ui/WinnersScoreCard.tsx  
// Weekly OMEGA report card

// src/components/ui/ReputationPassport.tsx
// Portable credential card — shareable externally

// src/components/ui/ConnectionCard.tsx
// Social graph connection suggestion

// src/components/ui/ProactiveMessageCard.tsx
// Unprompted insight card

// src/components/ui/LoopStageIndicator.tsx
// Compact loop stage badge

// src/stores/socialGraphStore.ts
// Social graph state

// src/hooks/useSocialGraph.ts
// src/hooks/useProactiveMessages.ts
// src/hooks/useWinnersScoreCard.ts
// src/hooks/useLoopTracking.ts
```

---

## KEY PRINCIPLES

1. **AI assistants are supervisors, not chatbots.** Each of the 9 assistants owns a layer and reports to OMEGA.
2. **Design consistency is trust.** Every page follows the design system — no exceptions.
3. **Data from day one.** AI needs data to be intelligent.
4. **Revenue in every phase.** Each layer must have a clear monetization path before moving on.

---

*Version 3.0 · March 2026*
*Supersedes V2.0 (February 2026)*

---

# ════════════════════════════════════════════
# LEVEL I — DESIGN SYSTEM ENFORCEMENT
## *Zero drift. Every surface speaks the same language.*
# ════════════════════════════════════════════

## What This Level Achieves

Before AI can be credibly layered on top of any page, the foundation must be flawless. Right now, 219 lint errors exist, hex colors are hardcoded in key files, and the design system is aspirational rather than enforced. Level I closes that gap completely. No page ships after this sprint without passing a strict design checklist.

This is not cosmetic work. Inconsistency signals a platform that does not know itself. Consistency signals infrastructure. The design system *is* the brand.

---

## 1.1 Mandatory Design System Checklist

Every page — existing and new — must pass every item before it is considered complete.

### Visual Language

| Rule | Requirement | Verification |
|---|---|---|
| Colors | CSS variables only — zero hardcoded hex | `grep -rn "#[0-9A-Fa-f]\{6\}" src/` returns 0 results |
| Background | `var(--bg)` — `#0D1520` — page level | All page root elements |
| Cards | `var(--surface)` + `1px solid var(--border)` + `6px border-radius` | All card components |
| Card accent | `2px` top gradient border: `linear-gradient(90deg, var(--gold), transparent)` | Every card::before |
| AI cards | Purple left accent: `2px solid var(--purple)` on `::after` | All AI-generated content |
| OMEGA cards | Dual gradient: `linear-gradient(90deg, var(--green), var(--gold), transparent)` | Cross-layer insights only |
| Borders | `var(--border)` — `#1E3248` — everywhere | All border declarations |
| Hover state | `var(--surface2)` — `#172335` — card hover backgrounds | All interactive cards |

### Typography System

| Role | Font | Weight | Size | Style |
|---|---|---|---|---|
| Display headings | Cormorant Garamond, serif | 300 | clamp(32px, 5vw, 64px) | Italic gold accent on key word |
| Section titles | Syne, sans-serif | 800 | 18–24px | Letter-spacing -0.025em |
| Body text | Syne, sans-serif | 400 | 13.5–15px | Line-height 1.7 |
| Metadata / labels | Space Mono, monospace | 400–700 | 8–11px | UPPERCASE, letter-spacing 0.15–0.35em |
| Data values | Space Mono or Cormorant | 600–700 | 24–42px | Colored per context |
| AI responses | Syne, 400 | — | 13.5px | Container: gold-tinted left border |
| Code / routes | Space Mono | — | 11px | `var(--gold)` or `var(--ice)` |

### Spacing & Layout

- **8px grid** — all spacing is a multiple of 8
- **Max content width:** 1280px, centered
- **Sidebar width:** 260px (desktop), collapsed on mobile
- **Section padding:** 24px horizontal, 48px vertical between major sections
- **Card padding:** 24–36px inner — never cramped, never padded to excess
- **Touch targets:** 44px minimum height on all interactive elements

### Motion System

```css
/* Standard transition — all interactive elements */
transition: all 200ms ease;

/* Entrance animation — staggered per card */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.card:nth-child(1) { animation: fadeInUp 0.5s ease both; animation-delay: 0ms; }
.card:nth-child(2) { animation: fadeInUp 0.5s ease both; animation-delay: 80ms; }
.card:nth-child(3) { animation: fadeInUp 0.5s ease both; animation-delay: 160ms; }

/* AI streaming text cursor */
@keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.streaming::after { content: '▋'; animation: cursorBlink 0.75s infinite; color: var(--gold); }

/* Assistant panel — slide up from bottom right */
@keyframes panelEnter {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

---

## 1.2 Confirmed Violations to Fix Immediately

```bash
# Run these to locate every violation:

# 1. Find hardcoded hex colors
grep -rn "#[0-9A-Fa-f]\{6\}" src/ --include="*.tsx" --include="*.ts" -l

# 2. Find @ts-nocheck suppressions
grep -rn "@ts-nocheck" src/ Server/ -l

# 3. Find explicit any types
grep -rn ": any" src/ Server/ --include="*.ts" --include="*.tsx" | grep -v ".d.ts"
```

**Confirmed broken files (priority):**

| File | Violation | Fix |
|---|---|---|
| `src/features/community/CommunityPage.tsx` | Hardcoded hex colors | Replace all with CSS variables |
| `src/features/analytics/components/RevenueChart.tsx` | Hardcoded hex in chart config | Use `getComputedStyle` + CSS vars |
| Multiple backend route files | `@ts-nocheck` suppressions | Fix types properly, remove suppression |
| Multiple backend route files | `any` type usage | Add proper TypeScript interfaces |

---

## 1.3 Ecosystem Context Bar — Required on Every Page

Every authenticated page must show the live ecosystem status bar. This is not a navigation element — it is an intelligence signal. It tells the user which layers are active and how the ecosystem is performing in real time.

```tsx
// Required on every authenticated page — import from ContextBar component (Level III)
// Until component exists, copy this pattern exactly:

<div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
  <span className="ctx-badge live">⬡ Core Engine</span>
  <span className="ctx-sep">›</span>
  <span className="ctx-badge active">👥 Community</span>
  <span className="ctx-sep">›</span>
  <span className="ctx-badge active">🎓 Academy</span>
  <span className="ctx-sep">›</span>
  <span className="ctx-badge planned">🛒 Market</span>
  <span className="ctx-sep">›</span>
  <span className="ctx-badge active">🤖 Intelligence</span>
  <span className="ctx-sep">›</span>
  <span className="ctx-badge planned">💼 Work</span>
</div>
```

**Status dot rules:**

| Status | Color | When to Use |
|---|---|---|
| `live` | `var(--green)` with pulse animation | Layer is fully operational with real traffic |
| `active` | `var(--gold)` | Layer is built and in use but not yet at full production maturity |
| `building` | `var(--ice)` | Layer is being actively developed |
| `planned` | `var(--text-dim)` | Layer is specced but not yet started |

---

## 1.4 Empty States — Intelligence Signals

Empty states are one of the highest-leverage design elements. A blank "No data found" message signals a dumb platform. An AI-authored empty state signals intelligence even before any AI action has occurred.

**Rule:** Every list, feed, table, or data view that can be empty must have a named assistant CTA.

```
Community feed (empty)  → "NOVA is ready. Start a conversation — your first post
                           tells OMEGA what skills to look for."

Academy courses (empty) → "SAGE is waiting. Explore the course catalog — 
                           or describe your goal and let SAGE build your path."

Market products (empty) → "Your storefront is ready. ATLAS can research your 
                           first winning product in under 30 seconds."

Work jobs (empty)       → "CIRCUIT is scanning. Post your skills — 
                           it will surface matching jobs automatically."

Dashboard (no data)     → "ARIA needs a few days of activity to generate insights.
                           Start by connecting your Community account."
```

---

# ════════════════════════════════════════════
# LEVEL II — AI-PRESENT ON EVERY PAGE
## *Intelligence visible everywhere, before it ever speaks.*
# ════════════════════════════════════════════

## What This Level Achieves

A sophisticated AI platform does not hide its intelligence until you click a button. Every premium platform that does AI well — Linear, Notion, Stripe — makes you *feel* the intelligence before you consciously engage with it. Winners Ecosystem must do the same. Every page should carry a signal that says: something is watching, something knows you, something is ready.

---

## 2.1 The AI Insight Banner

The single highest-impact addition at Level II. Every major page shows a 1–2 sentence insight, generated once per session by the layer's named AI supervisor. It sits above the first major content block — not intrusive, not dismissible unless the user acts.

**Visual spec:**
```css
.ai-insight-banner {
  background: rgba(155, 111, 255, 0.06);
  border: 1px solid rgba(155, 111, 255, 0.15);
  border-left: 3px solid var(--purple);
  border-radius: 0 6px 6px 0;
  padding: 14px 18px;
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.ai-insight-label {
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--purple);
  white-space: nowrap;
  padding-top: 2px;
}

.ai-insight-text {
  font-size: 13.5px;
  color: var(--text-mid);
  line-height: 1.6;
  font-family: 'Syne', sans-serif;
}
```

**Examples per layer:**

| Page | Assistant | Example Insight |
|---|---|---|
| Dashboard | ARIA | "Revenue is up 12% this week. Your Community posts are driving 67% of referral traffic — ARIA suggests increasing post frequency." |
| Community | NOVA | "Your posts about design systems reached 847 people this week. 12 of them have complementary skills — NOVA can suggest collaboration opportunities." |
| Academy | SAGE | "You are 68% through the React Fundamentals course. At your current pace, you will complete it in 4 days and qualify for 3 Work job categories." |
| Market | ATLAS | "Printful margins on African print-on-demand products are running 34% above the platform average this month. ATLAS has 5 winning product ideas ready." |
| Work | CIRCUIT | "3 new jobs matching your skills were posted in the last 6 hours. Your proposal win rate of 71% is above the platform average of 58%." |

**Implementation:**

```typescript
// src/components/ui/AIInsightBanner.tsx
// - Calls POST /api/v1/ai/page-insight with { page, userId, recentActivity }
// - Streams response token by token via SSE
// - Caches result in sessionStorage for 4 hours — no repeat API calls in the session
// - Falls back gracefully if API is slow (shows skeleton for max 2 seconds, then hides)
// - Dismissible via × button — stores preference in localStorage
```

---

## 2.2 The Floating Assistant Button

Every page has a floating AI access point — bottom right, always visible, never intrusive. It is not a chatbot launcher. It is the gateway to the page's named supervisor.

**Visual spec:**
```css
.assistant-fab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--surface2), var(--surface));
  border: 1px solid var(--border);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  transition: all 200ms ease;
  z-index: 100;
}

.assistant-fab::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid var(--gold);
  opacity: 0;
  animation: fab-pulse 3s ease infinite;
}

@keyframes fab-pulse {
  0%, 90%, 100% { opacity: 0; transform: scale(1); }
  45% { opacity: 0.4; transform: scale(1.1); }
}
```

**Behavior:**
- Shows the assistant emoji for the current page layer (NOVA on `/community`, SAGE on `/academy`, etc.)
- Click opens the `AssistantPanel` component (Level III)
- When the assistant has a proactive message, the gold ring pulses to signal it
- On mobile: expands to a bottom sheet full-screen modal

---

## 2.3 Smart Data Labels

Every data point on every dashboard has intelligence signals attached. Not tooltips — *intelligence labels* that tell the user what the number means, not just what it is.

```
Current (dumb):  "Revenue: $4,280"
Target (smart):  "Revenue: $4,280  ↑ 12% vs last week  · ARIA: on track for $18K this month"

Current (dumb):  "Courses enrolled: 3"
Target (smart):  "Courses enrolled: 3  · SAGE: Complete React course to unlock 3 Work categories"

Current (dumb):  "Community posts: 14"
Target (smart):  "Posts: 14  · NOVA: Your tech posts get 3× more engagement than lifestyle posts"
```

**Implementation:** Each metric card gets an optional `aiHint` prop. ARIA/NOVA/SAGE generate these hints once per session via a single batched API call on page load. The hints are displayed in Space Mono 9px below the primary metric value, colored `var(--text-dim)`, with a left separator.

---

## 2.4 The Trust Score Widget

Every user profile, every freelancer card, every community member — shows their Trust Score. This is one of the most visible intelligence signals in the platform. It tells the entire community: the platform knows you, measures you, and rewards you.

**Visual spec:**
```
Trust Score ring: SVG progress ring, 48px diameter
  0–39:   var(--red)     — New / Unverified
  40–59:  var(--text-dim) — Building reputation
  60–79:  var(--ice)     — Established
  80–89:  var(--gold)    — Trusted
  90–100: var(--green)   — Elite

Score components (shown in tooltip):
  Academy certificates completed    → up to 30 points
  Work contracts completed          → up to 25 points  
  Community engagement score        → up to 20 points
  Identity verification             → up to 15 points
  Payment history (no disputes)     → up to 10 points
```

---

# ════════════════════════════════════════════
# LEVEL III — SHARED COMPONENT ARCHITECTURE
## *Build once. Deploy across all 8 platforms simultaneously.*
# ════════════════════════════════════════════

## What This Level Achieves

The ecosystem vision — one identity, one design system, 8 platforms — only becomes architecturally real when a shared component library exists. Without it, every new platform layer repeats the same patterns from scratch, accumulates its own drift, and fragments the design language. Level III extracts every reusable pattern into a single source of truth.

The single most impactful output of this level: **`AssistantPanel.tsx`** — one component that puts NOVA into Community, SAGE into Academy, ATLAS into Market, and CIRCUIT into Work with a single line of JSX each.

---

## 3.1 Complete Component Library

```
src/components/
│
├── ui/                           ← Visual primitives
│   ├── Card.tsx                  The card pattern as a component, never repeated inline
│   ├── ContextBar.tsx            Live ecosystem status — 8 layer dots — import once in MainLayout
│   ├── EmptyState.tsx            Props: { assistant, headline, body, ctaLabel, ctaPath }
│   ├── SkeletonLoader.tsx        Variants: card | row | avatar | chart | text — no spinners ever
│   ├── AIInsightBanner.tsx       Per-page insight — streams from assistant on load
│   ├── PageHeader.tsx            Cormorant title + Syne subtitle + optional right-side action slot
│   ├── SectionWrapper.tsx        Max-width + padding + 8px grid — wrap every major section
│   ├── Badge.tsx                 Variants: layer | status | assistant | certificate | trust | plan
│   ├── ProgressRing.tsx          SVG ring for Trust Score, course progress, profile completion
│   ├── TrustScoreBadge.tsx       Composite: ring + score + label — used on all profile cards
│   ├── CommandPalette.tsx        ⌘K — global search + AI commands + navigation shortcuts
│   ├── StreamingText.tsx         Token-by-token display with blinking gold cursor
│   ├── FollowUpChips.tsx         3 AI-generated follow-up prompt chips after each response
│   ├── StatusDot.tsx             Animated pip: live | active | building | planned
│   └── Tooltip.tsx               Smart contextual tooltip — shows AI hint for data points
│
├── ai/                           ← AI interaction layer
│   ├── AssistantPanel.tsx        THE core component — embeds any assistant in any page
│   ├── FileDropZone.tsx          Drag-and-drop: image | PDF | audio | video — routes to FORGE
│   ├── ModelSelector.tsx         Claude | GPT-4o | Gemini | Ollama — with cost/speed indicator
│   ├── AssistantAvatar.tsx       Named assistant avatar — emoji + name + personality tagline
│   ├── MemoryPanel.tsx           Shows assistant's memory of the user — searchable, editable
│   └── AgenticLoopVisualizer.tsx Animated 8-step loop — current stage glows, completed stages green
│
└── layout/
    ├── MainLayout.tsx            ✅ Exists — add AssistantPanel here for global FAB
    ├── PageHeader.tsx            (same as ui/ — export from both for flexibility)
    └── EcosystemNavDot.tsx       Individual layer dot for ContextBar
```

---

## 3.2 AssistantPanel — Complete Specification

This is the most important component in the entire codebase. Every decision about its design and behavior matters.

```tsx
// Usage — one prop changes everything:
<AssistantPanel assistant="nova"    context={{ page: 'community', recentPosts, userId }} />
<AssistantPanel assistant="sage"    context={{ page: 'academy',   courseId, progress }} />
<AssistantPanel assistant="atlas"   context={{ page: 'market',    vendorId, products }} />
<AssistantPanel assistant="circuit" context={{ page: 'work',      skills, jobsViewed }} />
<AssistantPanel assistant="omega"   context={{ page: 'dashboard', allLayers: true }}    />
<AssistantPanel assistant="aria"    context={{ page: 'settings',  billingStatus }}       />
```

**Panel states:**

| State | Visual | Trigger |
|---|---|---|
| Minimised | FAB button (52px circle) + assistant emoji | Default on page load |
| Expanded | 380px side panel, slides in from right | Click FAB |
| Full-screen (mobile) | Bottom sheet modal, 90vh | On screens < 768px |
| Streaming | Text appears token by token with gold cursor | While response generates |
| Proactive | Gold ring pulse on FAB | Assistant has an unprompted message |
| File drop | Dashed border + "Drop file for [assistant name] to analyse" | File drag detected |

**Panel anatomy:**

```
┌─────────────────────────────────────┐
│ [Assistant emoji]  NOVA             │  ← AssistantAvatar + name
│ Community Intelligence Supervisor   │  ← Personality tagline in Space Mono 9px
├─────────────────────────────────────┤
│ [Memory indicator if any]           │  ← "I remember: you build in React"
├─────────────────────────────────────┤
│ [Conversation history — last 5]     │  ← Scrollable, dimmed for older messages
│                                     │
│ [Current streaming response]        │  ← Token by token, gold cursor
├─────────────────────────────────────┤
│ [Follow-up chip 1] [chip 2] [chip 3]│  ← AI-generated, tap to send
├─────────────────────────────────────┤
│ [File drop zone — subtle]           │
│ [Text input] [Send]                 │  ← Enter to send, Shift+Enter newline
└─────────────────────────────────────┘
```

**System prompt context injection (automatic):**
```typescript
// AssistantPanel auto-builds this system prompt from the `context` prop:
const systemPrompt = buildSystemPrompt(assistant, context);
// e.g. for NOVA on CommunityPage:
// "You are NOVA, the Community Intelligence Supervisor for Winners Ecosystem.
//  The user [userId] has posted 14 times this week. Their last 3 posts were about
//  React, TypeScript, and design systems. Their top post got 847 impressions.
//  You are warm, trend-aware, and creative. Your role is to help them grow as a creator,
//  detect their skills, and surface opportunities across the ecosystem.
//  Current page: Community Feed. Ecosystem layer: Community.
//  Active loop stage: [from ecosystemStore]."
```

---

## 3.3 The Command Palette

The ⌘K command palette is the single most intelligent navigation experience in the platform. It is not a search box — it is an AI-augmented command centre.

**Sections:**

```
⌘K opens to:

RECENT ACTIONS
  › Continued React Fundamentals course  (SAGE)
  › Posted "Building in public" in Community
  › Viewed 3 freelancer profiles in Work

SMART SUGGESTIONS (ARIA/OMEGA generated)
  › Complete Module 4 to unlock certificate  →  Go to course
  › 3 new Work jobs match your skills         →  View jobs
  › Your community post is trending           →  See analytics

NAVIGATION
  › Dashboard  / Community  / Academy  / Market  / Intelligence  / Work

AI COMMANDS
  › Ask NOVA about content strategy
  › Ask SAGE to generate study notes
  › Ask ATLAS for product research
  › Ask CIRCUIT to review my proposal
  › Ask OMEGA for my weekly briefing

ADMIN (for admins only)
  › Open Super Admin  / View all tenants  / Export data
```

---

# ════════════════════════════════════════════
# LEVEL IV — REACTIVE ECOSYSTEM STATE
## *Actions in one layer trigger responses in another in real time.*
# ════════════════════════════════════════════

## What This Level Achieves

The Agentic Loop is the core value proposition of Winners Ecosystem. It only becomes real — visibly, tangibly real — when the state architecture connects all 8 layers into one reactive system. This is the moment the platform stops being a collection of tools and becomes an ecosystem.

---

## 4.1 The Store Architecture

**Current state (fragmented):**
```
authStore.ts          ← per-feature
dashboardStore.ts     ← per-feature
analyticsStore.ts     ← per-feature
inviteStore.ts        ← per-feature
```

**Target state (ecosystem-aware):**
```typescript
// src/stores/ecosystemStore.ts — THE central nervous system
interface EcosystemStore {
  layerHealth: Record<LayerKey, LayerHealth>;
  currentLoopStage: LoopStage | null;
  loopHistory: AgenticLoop[];
  loopCount: number;
  omegaEvents: OMEGAEvent[];
  latestBriefing: OMEGABriefing | null;
  notifications: EcosystemNotification[];
  unreadCount: number;
  triggerLoop: (trigger: LoopTrigger) => void;
  dismissNotification: (id: string) => void;
  refreshLayerHealth: () => Promise<void>;
}
```

```typescript
// src/stores/assistantStore.ts — AI conversation state
interface AssistantStore {
  activeAssistant: AssistantKey;
  conversations: Record<AssistantKey, Message[]>;
  streamingText: string;
  isStreaming: boolean;
  panelOpen: boolean;
  sendMessage: (text: string, files?: File[]) => Promise<void>;
  stopStreaming: () => void;
  openPanel: (assistant: AssistantKey) => void;
  closePanel: () => void;
  clearConversation: (assistant: AssistantKey) => void;
}
```

```typescript
// src/stores/agenticLoopStore.ts — loop tracking
interface AgenticLoopStore {
  currentStage: LoopStage;
  lastTrigger: string | null;
  pendingRecommendations: Recommendation[];
  communityToAcademy: SkillSignal[];
  academyToWork: CertificateEvent[];
  workToMarket: FreelanceWin[];
}
```

```typescript
// src/stores/notificationStore.ts — unified inbox
interface NotificationStore {
  all: Notification[];
  unread: number;
  communityUnread: number;
  academyUnread: number;
  workUnread: number;
  intelligenceUnread: number;
}
```

---

## 4.2 Cross-Layer Event Examples

When `ecosystemStore` is live, these cross-layer responses happen automatically and are visible in the UI without a page refresh:

| Trigger | Layer | OMEGA Action | Visible Result |
|---|---|---|---|
| Post about "machine learning" | Community | NOVA detects ML skill → OMEGA fires | Academy tab shows gold dot badge: "3 ML courses for you" |
| Course module completed | Academy | SAGE updates progress → OMEGA fires | Dashboard Wealth widget updates projected earnings |
| Certificate issued | Academy | SAGE → OMEGA → CIRCUIT | Work sidebar shows: "2 new jobs match your certificate" |
| First freelance proposal sent | Work | CIRCUIT → OMEGA | Community shows: "Tell your network you're available for ML work" |
| Freelance contract won | Work | CIRCUIT → OMEGA → ATLAS | Market prompt: "Your income pattern suggests you're ready for vendor onboarding" |
| 10th community post | Community | NOVA → OMEGA | Dashboard: "Creator milestone — NOVA has analytics ready for you" |
| 30-day inactivity | Any | OMEGA monitors | Re-engagement prompt: personalised to last active layer |

---

## 4.3 New React Hooks

```typescript
// src/hooks/useAssistant.ts
const { assistant, send, isStreaming, response } = useAssistant();
// On /community  → assistant = NOVA
// On /academy/*  → assistant = SAGE
// On /market/*   → assistant = ATLAS
// On /work/*     → assistant = CIRCUIT
// On /dashboard  → assistant = ARIA

// src/hooks/useAgenticLoop.ts
const { currentStage, nextAction, loopCount } = useAgenticLoop();
// Returns: { stage: 'academy', action: 'Complete Module 4', urgency: 'high' }

// src/hooks/useEcosystemHealth.ts
const { health, isLoading } = useEcosystemHealth();

// src/hooks/useMultimodalChat.ts
const { messages, send, sendWithFile, isStreaming, stop } = useMultimodalChat({ assistant });

// src/hooks/useTrustScore.ts
const { score, breakdown, tier } = useTrustScore();
```

---

# ════════════════════════════════════════════
# LEVEL V — NAMED SUPERVISOR DEPLOYMENT
## *All 9 AI assistants go live. Every layer has a supervisor.*
# ════════════════════════════════════════════

## What This Level Achieves

This is the moment Winners Ecosystem becomes visibly different from every other platform. Users do not just use a Community, Academy, or Market — they have a named expert assigned to each one. The platform is not just intelligent. It is *personally* intelligent.

---

## 5.1 The 9 Assistants — Full Deployment Specification

---

### 🧠 OMEGA — Master Orchestrator

**Personality:** Strategic, visionary, sees all patterns. Never reactive. Always synthesising.

**Route:** `/intelligence/omega` — also accessible from Dashboard header

**Core capabilities to build:**

- **Daily cross-platform intelligence briefing** — Generated at 6am for each user. Covers all 8 layers. Delivered as interactive card in Dashboard.
- **Agentic Loop driver** — receives events from all 8 layers, decides the next recommended action
- **Revenue forecast** — 30/60/90 day projection based on current trajectory across all earning layers
- **Ecosystem health report** — weekly summary of every layer's performance
- **Autonomous action proposals** — actions OMEGA recommends taking, user approves/rejects inline
- **Pattern recognition** — identifies when a user is stuck in a loop stage and escalates

**System prompt persona:**
```
"You are OMEGA, the Master Orchestrator of the Winners Ecosystem — a Central Digital
Operating System built for African and diaspora builders. You have complete visibility
across all 8 platform layers for this user. You are not a chatbot. You are a strategic
supervisor who sees patterns others miss. You are measured, authoritative, and precise.
You always reference cross-layer insights. You always connect the current moment to
the larger journey the user is on."
```

---

### ⬡ ARIA — Core Engine Supervisor

**Personality:** Calm, precise, organised. The operational backbone.

**Route:** Dashboard, Settings, Billing, Admin — all Core Engine pages

**Core capabilities:**
- Dashboard metric interpretation with actionable recommendations
- Billing intelligence ("Your Pro plan pays for itself at 3 courses sold/month — you've sold 7")
- Workspace health scoring — identifies unused features and suggests activation
- Growth report generation ("Your ecosystem is growing at 8% month-over-month — here is why")
- Onboarding completion coaching ("3 steps remain — they unlock your Market storefront")

---

### 👥 NOVA — Community Supervisor

**Personality:** Warm, energetic, trend-aware, creative. Encourages without flattering.

**Route:** `/community/*` — embedded via `<AssistantPanel assistant="nova" />`

**Core capabilities:**
- **Skill detection** — analyses post content via Claude API for technical skills, creative skills, business skills
- **Creator coaching** — "Your last 3 posts were instructional — switch to a story format for higher engagement"
- **Content calendar** — suggests topics based on trending community discussions
- **Community health monitor** — detects low-engagement periods, flags potential issues
- **Trend surface** — what is the community talking about this week? What should this user post about?
- **Opportunity matching** — cross-references post skills with open Work jobs and Academy courses

**Key integration:**
```
NOVA detects skill in post
→ Fires event: { type: 'skill_detected', skill: 'React', userId, confidence: 0.87 }
→ ecosystemStore receives event
→ OMEGA processes event
→ Academy tab badge appears: "SAGE found 3 React courses for you"
→ AgenticLoop advances to stage: 'academy'
```

---

### 🎓 SAGE — Academy Supervisor

**Personality:** Patient, knowledgeable, encouraging. Celebrates progress without condescension.

**Route:** `/academy/*` — embedded via `<AssistantPanel assistant="sage" />`

**Core capabilities:**
- **Course Q&A** — answers questions with full syllabus context. Never gives answers that bypass learning.
- **Lecture-to-Notes** — upload lecture audio → SAGE generates structured notes + glossary + 5 quiz questions
- **Assignment feedback** — screenshot of work → SAGE gives structured, rubric-based feedback
- **Learning path design** — describes goal → SAGE creates personalised 4–12 week curriculum
- **Certificate gating** — verifies quiz completion + project submission before issuing certificate
- **Skill-based career paths** — "African Fintech Developer," "Digital Marketing Specialist," "E-commerce Entrepreneur"
- **Local language support** — English, French, Swahili, Pidgin, Amharic via DeepL

**Key integration:**
```
SAGE confirms certificate issued
→ Fires event: { type: 'certificate_issued', courseId, skill: 'React', userId }
→ OMEGA processes event
→ Work sidebar badge appears: "CIRCUIT found 2 React developer jobs"
→ AgenticLoop advances to stage: 'work'
```

---

### 🛒 ATLAS — Market Supervisor

**Personality:** Analytical, commercial, data-driven. Talks ROI. Thinks in margins.

**Route:** `/market/*` — embedded via `<AssistantPanel assistant="atlas" />`

**Core capabilities:**
- **Product research** — "Give me 5 winning products in the African beauty niche right now"
- **Margin analysis** — compares current vendor pricing to supplier costs and category benchmarks
- **Supplier matching** — given a product concept, recommends Printful, Gelato, AliExpress, Spocket, Zendrop, or CJ
- **Ad copy generation** — Facebook, TikTok, WhatsApp ad copy from a product description in under 10 seconds
- **Store health score** — rates vendor performance across 6 dimensions, provides specific improvement actions
- **90-day launch plan** — step-by-step action plan tailored to the vendor's niche and supplier
- **Trending product alerts** — ATLAS monitors supplier catalogues and surfaces opportunities

---

### 🤖 FORGE — Intelligence Supervisor

**Personality:** Technical, precise, efficiency-obsessed. Optimises costs and performance.

**Route:** `/intelligence/*` — embedded via `<AssistantPanel assistant="forge" />`

**Core capabilities:**
- **Model routing intelligence** — given a task, recommends optimal provider by accuracy/cost/speed
- **Credit burn monitoring** — alerts when approaching credit limit, suggests conservation strategies
- **Provider benchmarking** — compare Claude vs GPT-4o vs Gemini vs Ollama on the same prompt
- **Ollama model management** — which models to pull, when to switch local vs cloud
- **Cost optimization** — "Switching PDF analysis to Claude native saves 40% vs GPT-4o Vision"

---

### 💼 CIRCUIT — Work Supervisor

**Personality:** Professional, tactical, results-oriented. Zero fluff. Maximum clarity.

**Route:** `/work/*` — embedded via `<AssistantPanel assistant="circuit" />`

**Core capabilities:**
- **Job matching** — reads job description + freelancer profile → generates match score + gap analysis
- **Proposal writing** — reads job description → drafts personalised, tailored proposal in the user's voice
- **Rate optimisation** — "Your skills qualify for $55–80/hour. Your current rate of $35 leaves 35% on the table."
- **Contract review** — flags unusual terms, missing milestones, payment risk indicators
- **Win probability scoring** — before submitting a proposal, CIRCUIT scores it 0–100 with improvement notes
- **Dispute analysis** — neutral assessment of project disputes with evidence review
- **Portfolio feedback** — specific, rubric-based review of work samples with comparison to top earners

---

### ☁️ NEXUS — Cloud Supervisor

**Personality:** Developer-focused, documentation-expert, precise about versions and edge cases.

**Route:** `/cloud/*` — embedded in API docs, developer portal, SDK console

**Core capabilities:**
- **API documentation Q&A** — indexed against full OpenAPI spec, always version-aware
- **Live code example generation** — generate working SDK code in JS, Python, Go, cURL on demand
- **Integration debugging** — paste an error → NEXUS diagnoses the root cause and provides the fix
- **Webhook explorer** — explains every event type, provides handling code
- **Rate limit guidance** — explains limits, suggests batching strategies
- **Plugin development onboarding** — step-by-step guide to publishing a plugin to the marketplace

---

### 🧬 HERALD — AI Platform Supervisor

**Personality:** Infrastructure-focused, benchmarks-heavy, thinks in latency and throughput.

**Route:** `/intelligence/platform` — embedded in AIPlatformPage

**Core capabilities:**
- **Ollama model management** — install, remove, update, benchmark models
- **GPU utilisation monitoring** — memory usage, inference speed, thermal state
- **Model comparison benchmarks** — standardised tests across installed models
- **Local vs cloud cost analysis** — for a given workload, what is the true cost of each option?
- **ComfyUI workflow management** — image generation presets, quality settings
- **Whisper transcription monitoring** — language detection accuracy, word error rate by content type

---

## 5.2 Assistant Personality System — Why It Matters

The difference between a useful tool and a trusted advisor is personality. These are not prompt engineering tips — they are brand decisions that affect every interaction.

| Assistant | Opening Pattern | Signature Behaviour | Never Does |
|---|---|---|---|
| OMEGA | "Across your ecosystem this week..." | Always references ≥2 layers. Always projects forward. | Gives isolated answers. |
| ARIA | "Your workspace shows..." | Leads with numbers. Ends with one specific next action. | Ambiguity. |
| NOVA | "Your community is alive with..." | References specific posts. Validates creative direction. | Condescends about engagement. |
| SAGE | "Let me break this down step by step..." | Confirms understanding before proceeding. Celebrates milestones. | Gives answers that skip learning. |
| ATLAS | "Market data shows..." | Always includes margins, percentages, or revenue estimates. | Vague recommendations. |
| FORGE | "Performance analysis shows..." | Leads with metrics. Provides comparison tables. | Recommends a provider without benchmarks. |
| CIRCUIT | "For this opportunity..." | Action lists. Numbered steps. Deadlines. | Fluffy encouragement. |
| NEXUS | "The API spec for this endpoint shows..." | Code first, explanation second. Always version-specific. | Guessing about API behaviour. |
| HERALD | "Benchmark data for this model shows..." | Latency in ms. Cost in USD/1K tokens. Memory in GB. | Recommendations without numbers. |

---

# ════════════════════════════════════════════
# LEVEL VI — MULTIMODAL INTELLIGENCE
## *Every format. Every layer. Every assistant handles it natively.*
# ════════════════════════════════════════════

## What This Level Achieves

Text-only AI is table stakes in 2026. Winners Ecosystem must handle voice, images, PDFs, audio, and video natively — routing each format to the optimal provider automatically, with zero friction for the user. Drop a file. The right assistant analyses it.

---

## 6.1 Universal AI Platform Architecture

```
Users (Web · Desktop · Mobile)
          ↓
Winners Backend — Express (port 8080)
    aiPlatformRoutes.ts  →  proxy to AI Platform
          ↓
AI Platform Service — Python FastAPI (port 8001)
          ↓
Provider Router — FORGE decides:
  ┌─ Ollama ────── Llama 3.1 · DeepSeek Coder · Qwen 2.5    (local, free)
  ├─ Whisper ───── faster-whisper Medium                      (local, offline STT)
  ├─ ComfyUI ───── Stable Diffusion XL                        (local, image gen)
  ├─ Claude ────── claude-sonnet-4-6                          (reasoning, PDFs)
  ├─ GPT-4o ────── OpenAI                                     (audio, vision, code)
  └─ Gemini ────── 1.5 Pro                                    (video, long context)
```

**Routing rules:**

| Input | Provider | Fallback | Why |
|---|---|---|---|
| Text only | Ollama (local, free) | Claude | Zero cost for standard chat |
| Image analysis | Claude Sonnet 4.6 | GPT-4o Vision | Best-in-class visual reasoning |
| PDF (≤100 pages) | Claude (native PDF) | GPT-4o text extract | Claude handles PDFs natively |
| Audio (MP3, WAV) | faster-whisper (local) | GPT-4o Whisper | Offline, private, no cost |
| Video (MP4, WebM) | Gemini 1.5 Pro | GPT-4o frames | Only model that handles video natively |
| Code review | DeepSeek Coder (Ollama) | Claude | Specialised code model, free local |
| Image generation | ComfyUI/SDXL (local) | DALL-E 3 | Free on local GPU |

---

## 6.2 Multimodal Features Per Layer

### Community — NOVA

| Feature | Input | Output |
|---|---|---|
| Voice post recording | Microphone input (up to 3 min) | Transcribed text post + NOVA analysis |
| Image post analysis | Photo upload | Auto-suggested tags + skill detection |
| Voice message in DMs | Audio message | Transcribed + stored as audio+text |

### Academy — SAGE

| Feature | Input | Output |
|---|---|---|
| Lecture-to-Notes | MP3/MP4 lecture recording | Structured notes + glossary + 5 quiz questions |
| Assignment Review | Screenshot or PDF submission | Rubric-based feedback with improvement steps |
| Textbook Analysis | PDF upload (any textbook) | Study guide + flashcard deck + practice questions |
| Code Submission | Code file or screenshot | Line-by-line review + error explanations + refactor suggestions |

### Market — ATLAS

| Feature | Input | Output |
|---|---|---|
| Product photo audit | Product photo upload | Quality score + background/lighting feedback + improvement suggestions |
| Competitor analysis | Screenshot of competitor product | Price, positioning, gap analysis |
| Business plan review | PDF upload | Viability score + market gaps + revenue projections |

### Work — CIRCUIT

| Feature | Input | Output |
|---|---|---|
| Portfolio review | PDF or image uploads | Per-piece feedback + tier rating + comparison to top earners |
| Contract review | PDF contract | Flagged terms + risk score + amendment suggestions |
| Code portfolio review | GitHub link or ZIP | Quality score + employer attractiveness rating |

---

## 6.3 Voice Interface

**Web (desktop):** `Ctrl+Shift+M` — opens voice modal. Listening state with waveform visualisation. Click stop or speak for 3 seconds of silence to send.

**Web (mobile):** Hold microphone button in assistant panel. Real-time transcription preview. Release to send.

**Community:** Dedicated "Voice Post" button in post composer. Records up to 3 minutes. NOVA transcribes and posts as both text and audio.

---

## 6.4 Installation Commands

```bash
# AI Platform Python service:
mkdir ai-platform && cd ai-platform
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn httpx faster-whisper python-multipart pillow torch

# Ollama + models:
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1        # 4.7GB — primary text model
ollama pull deepseek-coder  # 3.8GB — code review
ollama pull qwen2.5         # 4.7GB — multilingual African language support

# Start AI Platform:
uvicorn main:app --port 8001 --reload

# Railway: add as second service with AI_PLATFORM_URL env var
```

---

# ════════════════════════════════════════════
# LEVEL VII — PREDICTIVE & AUTONOMOUS OMEGA
## *The platform works while the user sleeps.*
# ════════════════════════════════════════════

## What This Level Achieves

Most platforms are reactive — they respond when you act. Winners Ecosystem at Level VII becomes proactive. OMEGA watches, predicts, and acts. Every morning, the user wakes up to a briefing that tells them what happened overnight, what opportunity they should prioritise today, and what OMEGA has done on their behalf (with their prior approval).

---

## 7.1 OMEGA Daily Intelligence Briefing

Delivered every morning at 6am (user's local timezone). Rendered as an interactive card on the Dashboard. Users can respond to OMEGA directly from the briefing card.

**Structure of the briefing:**

```
── OMEGA DAILY BRIEFING ────────────────────────────────────
  Monday, March 3, 2026 · Generated at 06:00 WAT

  ● COMMUNITY   NOVA: Your "Building in public" post is trending.
                      847 impressions. 34 new followers.
                      Recommended: post a follow-up today.

  ● ACADEMY     SAGE: You are 2 modules from your React certificate.
                      At your pace: complete by Thursday.
                      New: 3 Work jobs posted requiring React certification.

  ● WORK        CIRCUIT: 2 new job matches (React Developer, $65/hr avg).
                         Your proposal win rate is 71% — above average.
                         Recommended: apply to "React + TypeScript" listing today.

  ● MARKET      ATLAS: Printful is running 15% margin uplift on hoodies until Friday.
                       Your store had 34 visitors but 0 sales — ATLAS has 3 suggestions.

  ● INTELLIGENCE FORGE: You used 312 of your 2,000 monthly AI credits.
                         Recommend: switch PDF analysis to Claude native — saves 40%.

  OMEGA's recommendation for today: Complete React Module 4 (45 min).
  This unlocks your certificate and connects to the 2 Work jobs above.
  Estimated revenue unlock: $65–$80/hour. Completion by Thursday.

  [Complete Module 4] [View Work Jobs] [Dismiss]
────────────────────────────────────────────────────────────
```

---

## 7.2 Autonomous Actions System

OMEGA can take pre-approved actions on behalf of the user. This is opt-in per action type, transparent, and reversible.

| Action | Trigger | Default | User Can Set |
|---|---|---|---|
| Academy recommendation push notification | NOVA detects new skill | Auto-send | Always / Ask / Never |
| Work job alert | New job matches skills ≥ 80% | Auto-send | Always / Ask / Never |
| Restock alert (Market) | Product stock < 10 units | Auto-send | Always / Ask / Never |
| Contract deadline reminder | 48h before milestone due | Auto-send | Always / Ask / Never |
| Weekly ecosystem briefing | Every Monday 8am | Auto-generate | On / Off |
| Community post suggestion | User has not posted in 7 days | Ask | Ask / Never |
| Course restart reminder | Course not accessed in 5 days | Ask | Ask / Never |

---

## 7.3 Predictive Features Per Layer

| Layer | Prediction | How It Works | Powered By |
|---|---|---|---|
| Core Engine | Revenue forecast — 30/60/90 days | Trend analysis on last 90 days of activity | ARIA + OMEGA |
| Community | Post performance forecast before posting | Trained on historical engagement patterns per user | NOVA |
| Academy | Completion probability for active course | Based on pace, skip rate, quiz scores | SAGE |
| Market | Product demand forecast — next 30 days | Supplier catalogue trends + community discussion signals | ATLAS |
| Work | Proposal win probability before submitting | Match score + proposal quality + client history | CIRCUIT |
| Work | Rate optimisation recommendation | Current rate vs 65th/75th/90th percentile for skills | CIRCUIT + OMEGA |

---

## 7.4 AI Credits System

Every AI feature is metered through a unified credits system. This is both the monetisation mechanism and the AI cost management layer.

| Plan | Credits/Month | Price | Key Feature |
|---|---|---|---|
| Free | 100 | $0 | Ollama local only |
| Intelligence Starter | 500 | $9/month | Claude + images + PDFs |
| Intelligence Pro | 2,000 | $19/month | All modalities + all providers |
| Intelligence Team | 10,000 | $49/month | Shared across workspace |
| Desktop License | Unlimited local | $49 one-time | Offline AI — no monthly bill |
| OMEGA Enterprise | Unlimited | $500–$5K/month | Autonomous actions + dedicated infra |

| Action | Credits | Cost Approx |
|---|---|---|
| Text message (Ollama) | 1 | $0 |
| Text message (Claude) | 2 | ~$0.002 |
| Image analysis | 5 | ~$0.010 |
| PDF analysis | 6 | ~$0.012 |
| Audio transcription/min | 4 | ~$0 (local Whisper) |
| Video analysis/min | 10 | ~$0.025 |
| OMEGA autonomous action | 15 | ~$0.030 |
| OMEGA daily briefing | 50 | ~$0.100 |
| Image generation (SDXL) | 8 | ~$0 (local GPU) |

---

# ════════════════════════════════════════════
# LEVEL VIII — SOCIAL INTELLIGENCE GRAPH
## *The platform knows relationships, not just individuals.*
# ════════════════════════════════════════════

## What This Level Achieves

Most platforms track users. Winners Ecosystem at Level VIII tracks *relationships between users* — who has collaborated, who has complementary skills, who has referred whom, who is likely to transact. The Social Intelligence Graph transforms the Community layer from a feed into a living, connected knowledge network. OMEGA can now surface not just what you should do — but *who* you should do it with.

---

## 8.1 The Social Graph Data Model

```typescript
// src/stores/socialGraphStore.ts

interface SocialGraphStore {
  connections: UserConnection[];         // established connections
  suggestions: ConnectionSuggestion[];   // AI-generated recommendations
  networkStrength: number;               // 0–100 graph health score
  mutualSkills: SkillOverlap[];          // skills shared with connections
  complementaryMatches: UserMatch[];     // users with skills you need
  collaborationHistory: Collaboration[]; // past joint projects, courses, contracts

  // Actions
  suggestConnections: () => Promise<void>;
  sendConnectionRequest: (userId: string, message?: string) => Promise<void>;
  acceptConnection: (connectionId: string) => Promise<void>;
  dismissSuggestion: (userId: string) => Promise<void>;
}

interface UserConnection {
  userId: string;
  name: string;
  avatar: string;
  trustScore: number;
  sharedSkills: string[];
  complementarySkills: string[];
  connectionStrength: number;    // 0–100 — based on interactions
  layers: LayerKey[];            // which layers they are active in
  lastActive: Date;
  collaborationPotential: number; // NOVA/OMEGA score
}

interface ConnectionSuggestion {
  userId: string;
  reason: string;                // NOVA's explanation: "You both build in React and are in the same timezone"
  sharedContext: string[];       // posts, courses, jobs in common
  matchScore: number;            // 0–100
  suggestedBy: AssistantKey;    // NOVA | OMEGA
}
```

---

## 8.2 NOVA — Social Graph Capabilities

NOVA is the primary Social Graph supervisor. It constantly analyses post content, skill signals, and activity patterns to surface relationship opportunities.

**Core capabilities:**

- **Connection suggestions** — "Amara posts about Figma and is looking for a React developer. You post about React. NOVA suggests connecting."
- **Collaboration matching** — identifies users whose skills + goals complement yours for potential joint projects
- **Network gap analysis** — "Your network has 0 fintech connections. 3 users you follow have strong fintech backgrounds."
- **Community health monitoring** — detects cliques, identifies isolated but high-value members, surfaces them to relevant users
- **Skill graph mapping** — renders a visual map of skills in your network vs skills you need
- **Warm introduction paths** — "You and David have 2 mutual connections — NOVA can draft an introduction message"

**Integration trigger:**
```
User posts about a specific skill/domain
→ NOVA scans existing connections for complementary matches
→ NOVA cross-checks with Work job board for potential collaboration opportunities
→ OMEGA fires: { type: 'connection_opportunity', userId, matchedUserId, reason }
→ ConnectionCard appears in Community sidebar
→ Network strength score updates in real time
```

---

## 8.3 The ConnectionCard Component

```tsx
// src/components/ui/ConnectionCard.tsx
// Props: { suggestion: ConnectionSuggestion, onConnect, onDismiss }

// Visual spec:
// ┌─────────────────────────────────────────────┐
// │ [Avatar] Amara Osei                  [✕]    │
// │ Trust Score ●●●●○  78/100                   │
// │ ─────────────────────────────────────────── │
// │ NOVA: "She builds in Figma. You build in    │
// │ React. 3 Work jobs need both skills."        │
// │ ─────────────────────────────────────────── │
// │ Shared: [Community] [Academy]               │
// │ Skills: Figma · Product Design · Figma Dev  │
// │ ─────────────────────────────────────────── │
// │ [Connect]  [View Profile]                   │
// └─────────────────────────────────────────────┘
```

---

## 8.4 The AgenticLoopWidget

A persistent 7-node loop visualiser that lives in the sidebar on all authenticated pages. It makes the Agentic Loop *visible* — not a concept in a doc, but a live signal the user can see and understand.

```tsx
// src/components/ui/AgenticLoopWidget.tsx

// Visual spec — 7 nodes in a circular ring:
// ⬡ Core (always lit)
// 👥 Community   → lit when user has posted in last 7 days
// 🎓 Academy     → lit when course is active
// 💼 Work        → lit when proposal submitted in last 30 days
// 🛒 Market      → lit when store has had a visitor in last 7 days
// 🤖 Intelligence → lit when AI credits used in last 7 days
// ☁️ Cloud        → lit when API key exists

// Current active stage pulses gold
// Completed stages show green checkmark
// Next recommended stage shows arrow indicator
// Hover: shows OMEGA's explanation for why this stage is next

// Compact variant (sidebar): 44px wide, 7 dots only
// Expanded variant (dashboard card): full ring with labels
```

---

## 8.5 Cross-Layer Social Signals

| Signal | Source | NOVA Action | Visible in |
|---|---|---|---|
| User posts about skill X | Community | Suggests connections with skill X projects | Community sidebar |
| Certificate issued in skill X | Academy | Suggests freelancers who hire skill X | Work sidebar |
| Freelance win in niche Y | Work | Suggests market vendors in niche Y | Market sidebar |
| New follower has high Trust Score | Community | Highlights them as priority connection | Notification feed |
| Two users comment on same post | Community | Suggests mutual connection | Both users' feeds |
| Collaboration request accepted | Any | OMEGA updates network strength score | Dashboard widget |

---

## 8.6 Network Strength Score

Every user has a Network Strength Score (0–100) — a live measure of how well-connected and high-quality their ecosystem network is.

```
Network Strength components:
  Verified connections (Trust Score ≥ 60)      → up to 30 points
  Cross-layer connections (active in 3+ layers) → up to 20 points
  Collaboration history (completed projects)    → up to 20 points
  Network diversity (skills breadth)            → up to 15 points
  Mutual referrals generated                    → up to 15 points

Display: Progress ring on profile page + LoopStageIndicator in sidebar
OMEGA commentary: "Your network is strong in tech but weak in finance — 
                   3 suggested connections would fill that gap."
```

---

## 8.7 New Hooks

```typescript
// src/hooks/useSocialGraph.ts
const { connections, suggestions, networkStrength, refreshGraph } = useSocialGraph();

// src/hooks/useLoopTracking.ts
const { currentStage, completedStages, nextAction, loopCount } = useLoopTracking();
// Feeds AgenticLoopWidget with live data

// src/hooks/useProactiveMessages.ts
const { messages, dismiss, markRead } = useProactiveMessages();
// Surfaces OMEGA/NOVA unprompted messages — feeds ProactiveMessageCard
```

---

# ════════════════════════════════════════════
# LEVEL IX — REPUTATION AS SOVEREIGN INFRASTRUCTURE
## *Trust Score becomes a portable passport.*
# ════════════════════════════════════════════

## What This Level Achieves

A Trust Score that only exists inside Winners Ecosystem is a feature. A Trust Score that employers, lenders, partners, and other platforms can verify externally is *infrastructure*. Level IX transforms the Trust Score from an internal engagement metric into a portable professional credential — the digital equivalent of a credit score, a degree, and a professional reference, all in one verifiable token.

---

## 9.1 The Reputation Passport

The Reputation Passport is a shareable, verifiable profile card that users can publish externally — on LinkedIn, to freelance clients, to employers, to banks offering microloans.

```tsx
// src/components/ui/ReputationPassport.tsx

// Visual spec — a premium card, dark glass morphism:
// ┌─────────────────────────────────────────────────────┐
// │  WINNERS ECOSYSTEM                    [QR Code]     │
// │  ─────────────────────────────────────────────────  │
// │  [Avatar]  Kwame Mensah                             │
// │            Full-Stack Developer                     │
// │            Accra, Ghana  ·  Active since 2024       │
// │  ─────────────────────────────────────────────────  │
// │  TRUST SCORE        NETWORK         LOOP COUNT      │
// │  [Ring] 87/100      [Ring] 72/100   ×14 completed  │
// │  Trusted Tier       Strong Network  Elite looper    │
// │  ─────────────────────────────────────────────────  │
// │  VERIFIED CERTIFICATES                              │
// │  🎓 React Developer  ·  🎓 Digital Marketing        │
// │  🎓 African Fintech  ·  +2 more                     │
// │  ─────────────────────────────────────────────────  │
// │  WORK RECORD                                        │
// │  12 contracts completed  ·  71% win rate            │
// │  $0 disputes  ·  4.9★ average rating                │
// │  ─────────────────────────────────────────────────  │
// │  [Share Link]  [Download PDF]  [Verify via API]     │
// └─────────────────────────────────────────────────────┘
```

**Verification URL format:**
```
https://winners.io/verify/kwame-mensah-a7f3c2
```
Anyone with the link can see the live Trust Score, certificates, and work record — but NOT private messages, financial data, or settings.

---

## 9.2 Trust Score — Full Calculation Engine

```typescript
interface TrustScoreBreakdown {
  total: number;             // 0–100
  tier: TrustTier;          // new | building | established | trusted | elite

  components: {
    academyCertificates: {
      score: number;         // 0–30
      count: number;
      verifiedCourses: string[];
    };
    workContracts: {
      score: number;         // 0–25
      completed: number;
      disputes: number;      // reduces score
      avgRating: number;
    };
    communityEngagement: {
      score: number;         // 0–20
      postsLast90Days: number;
      avgImpressions: number;
      followerGrowthRate: number;
    };
    identityVerification: {
      score: number;         // 0–15
      emailVerified: boolean;
      phoneVerified: boolean;
      idVerified: boolean;
      locationVerified: boolean;
    };
    paymentHistory: {
      score: number;         // 0–10
      successfulPayments: number;
      failedPayments: number;
      onTimeRate: number;
    };
  };

  history: TrustScoreSnapshot[];    // weekly history — shows trend
  nextMilestone: string;            // "2 more certificates to reach Elite tier"
  omerInsight: string;              // OMEGA's analysis of the score
}
```

---

## 9.3 External Verification API

```typescript
// GET /api/v1/verify/:handle
// Public endpoint — no auth required
// Returns only the public reputation data

interface PublicReputationResponse {
  handle: string;
  displayName: string;
  trustScore: number;
  trustTier: TrustTier;
  certificates: PublicCertificate[];
  workStats: {
    contractsCompleted: number;
    avgRating: number;
    disputeRate: number;          // percentage
    winRate: number;
  };
  networkStrength: number;
  loopCount: number;
  memberSince: string;
  lastActive: string;             // relative: "3 days ago"
  verifiedAt: string;             // ISO timestamp of this response
  verificationSignature: string;  // HMAC signature for tamper detection
}
```

---

## 9.4 Microloan & Partner Integrations

The Trust Score becomes an input to financial and professional partner systems:

| Partner Category | Integration | Trust Score Usage |
|---|---|---|
| Microfinance institutions | REST API + webhook | Minimum Trust Score 70 for loan eligibility |
| African neobanks (e.g. Chipper, M-Pesa) | OAuth + Trust Score API | Premium rates for score ≥ 80 |
| Freelance platforms (external) | Badge + verification link | Employers verify directly via URL |
| Employers (diaspora job boards) | PDF export + QR code | Digital reference letter replacement |
| Winners partner vendors | Auto-tier pricing | Trust Score 90+ gets premium vendor rates |
| NGO grant programmes | API + report export | Verifiable impact metrics for grant applications |

---

## 9.5 The WinnersScoreCard

A weekly OMEGA-generated report card — not a Trust Score, but a *performance summary* across all layers. Think of it as the platform's equivalent of a school report card, generated by OMEGA every Monday morning.

```tsx
// src/components/ui/WinnersScoreCard.tsx

// Weekly card, interactive, expandable:
// ─────────────────────────────────────
// OMEGA WINNERS SCORECARD  ·  Week of Mar 10
// ─────────────────────────────────────
// COMMUNITY    ████████░░  82/100  ↑ +8 vs last week
// ACADEMY      ██████░░░░  61/100  → same as last week
// WORK         ████████░░  79/100  ↑ +12 vs last week
// MARKET       ███░░░░░░░  34/100  ↓ -5 vs last week
// INTELLIGENCE ██████████  94/100  ↑ +3 vs last week
// ─────────────────────────────────────
// OVERALL      76/100  ↑ Improving
// ─────────────────────────────────────
// OMEGA: "Your Work performance is your strongest
// layer this week. Your Market score needs attention
// — ATLAS has 3 specific recommendations."
// [Open Market] [Full Report]
```

---

## 9.6 Hooks

```typescript
// src/hooks/useWinnersScoreCard.ts
const { scoreCard, isLoading, currentWeek, trend } = useWinnersScoreCard();

// src/hooks/useTrustScore.ts  (extended in this level)
const {
  score,
  breakdown,
  tier,
  history,
  nextMilestone,
  passportUrl,
  generatePDF,
} = useTrustScore();
```

---

# ════════════════════════════════════════════
# LEVEL X — AI-NATIVE REVENUE PRODUCTS
## *New income streams that only AI makes possible.*
# ════════════════════════════════════════════

## What This Level Achieves

Most platforms monetise through subscriptions and transaction fees. Winners Ecosystem at Level X introduces revenue products that could not exist without the AI layer — products where AI *is* the product. These unlock new income streams for the platform and, more importantly, for users themselves.

---

## 10.1 Signal Products

A user's AI-generated insights become a purchasable product for other users.

**How it works:**

```
User A has: 200 community posts about African fintech, 3 fintech certificates,
            12 fintech freelance contracts, Trust Score 91

ATLAS surfaces: "Your fintech knowledge has commercial value. 
                 Package it as a Signal Report — others will pay for your perspective."

User A creates: "African Fintech Market Report — Q1 2026"
                Generated by ATLAS in 20 minutes from their activity data
                Price: $15–$50 per download

Platform takes: 20% fee
User A earns:   80% of each download
```

**Signal product types:**

| Product | What It Contains | AI Tool | Target Buyer |
|---|---|---|---|
| Market Signal Report | Trending products, margin analysis, supplier picks | ATLAS | Vendors, entrepreneurs |
| Skill Path Blueprint | Learning path for a specific career goal | SAGE | Learners entering a new field |
| Community Pulse Report | What a niche community is discussing + trending topics | NOVA | Marketers, researchers |
| Freelance Rate Guide | Current rates by skill + location based on real contract data | CIRCUIT | Freelancers, hiring managers |
| Ecosystem Briefing Bundle | OMEGA's weekly analysis, packaged and sold | OMEGA | Professionals, investors |

---

## 10.2 Live Intelligence Sessions

Users with high Trust Scores and verified expertise can host live AI-assisted consulting sessions. SAGE/NOVA/ATLAS/CIRCUIT join the call as co-presenters with real-time data.

```
Session format:
  Host: Expert user (Trust Score ≥ 75, relevant certificate)
  Tool: Embedded video call (Jitsi/Daily.co SDK)
  AI:   Named assistant joins as co-presenter, pulls live data
  
  Example: "React with Kofi" — $25/seat
    → Kofi teaches live
    → SAGE surfaces relevant course modules on request
    → Attendees can ask SAGE questions in sidebar
    → CIRCUIT suggests job opportunities for attendees after the session

Platform takes: 15% of session revenue
Host earns:     85% of session revenue
```

---

## 10.3 AI Coaching Subscriptions

Users can subscribe to personalised AI coaching from a named assistant — a recurring revenue model priced below 1-on-1 human coaching but above standard platform subscriptions.

| Tier | Assistant | Focus | Price | What's Included |
|---|---|---|---|---|
| SAGE Study Buddy | SAGE | Academy acceleration | $12/month | Daily study plan, quiz generation, progress coaching |
| NOVA Creator Coach | NOVA | Community growth | $15/month | Content calendar, post feedback, growth analytics |
| ATLAS Commerce Coach | ATLAS | Market revenue | $19/month | Weekly product research, margin analysis, ad copy |
| CIRCUIT Career Coach | CIRCUIT | Work & freelancing | $19/month | Proposal reviews, rate coaching, interview prep |
| OMEGA Ecosystem Coach | OMEGA | Full ecosystem | $39/month | All layers, daily briefing, autonomous actions |

---

## 10.4 Knowledge NFTs (Reputation-Backed Credentials)

Academy certificates issued on-chain as verifiable NFTs — not speculative assets, but credential tokens backed by proof-of-learning.

```
Certificate NFT properties:
  - Issued by: Winners Ecosystem (verifiable smart contract)
  - Contains: course completion hash, quiz scores, project submission hash
  - Visible on: OpenSea, wallet apps, LinkedIn via NFT badge
  - Transferable: No (soul-bound token — non-transferable by design)
  - Revocable: Yes (if academic dishonesty detected by SAGE)
  
Use cases:
  - Employer verification: scan QR → see full certificate details on-chain
  - Grant applications: on-chain proof of skills without manual reference letters
  - Cross-platform identity: portable across any platform that reads ERC-5114
  
Chain: Polygon (low fees, EVM-compatible, established ecosystem)
Cost to mint: $0.01–$0.05 per certificate (platform-sponsored below Trust Score 60)
```

---

## 10.5 The OMEGA Autonomous Growth Engine

Pre-approved autonomous actions that compound user growth while they sleep.

```typescript
interface AutonomousGrowthAction {
  id: string;
  type: GrowthActionType;
  approvedBy: string;          // userId who approved
  scheduledAt: Date;
  executedAt: Date | null;
  status: 'pending' | 'executed' | 'skipped' | 'failed';
  result: string | null;       // OMEGA's report on outcome
  creditsUsed: number;
}

type GrowthActionType =
  | 'post_follow_up'           // NOVA posts follow-up to trending post
  | 'course_reminder'          // SAGE sends study reminder at optimal time
  | 'job_apply_alert'          // CIRCUIT alerts user to high-match job
  | 'product_restock'          // ATLAS triggers supplier restock for low stock
  | 'connection_outreach'      // NOVA sends personalised connection request
  | 'weekly_scorecard_push'    // OMEGA generates and sends weekly scorecard
  | 'credit_conservation'      // FORGE switches to cheaper provider automatically
  | 'certificate_celebration'; // OMEGA posts celebration to community on cert issue
```

**Settings UI:**

Every autonomous action type has a three-way toggle: `Always` / `Ask me first` / `Never`. Defaults are conservative — most start at `Ask me first`. Users who have used the platform for 30+ days see a recommendation to enable more autonomous actions based on their activity patterns.

---

## 10.6 Revenue Share Programme

Users who refer other users, create content that drives signups, or build plugins for the marketplace earn a share of platform revenue.

| Source | Share | Condition |
|---|---|---|
| Referral signup | $5 one-time | Referred user completes onboarding |
| Referral subscription | 20% recurring for 12 months | Referred user upgrades to paid plan |
| Signal product sale | 80% of sale price | User creates a verified signal product |
| Plugin marketplace | 70% of plugin revenue | Developer publishes approved plugin |
| Live session hosting | 85% of session revenue | Host has Trust Score ≥ 75 |
| AI Coaching referral | 10% for 6 months | Referred user subscribes to AI coaching |

---

## 10.7 ProactiveMessageCard Component

```tsx
// src/components/ui/ProactiveMessageCard.tsx
// Appears when OMEGA/NOVA/ATLAS/CIRCUIT has an unprompted message

// Visual spec — gold-tinted, dismissible, subtle animation:
// ┌─────────────────────────────────────────────┐
// │ 🧠 OMEGA  ·  Autonomous Insight       [✕]  │
// │ ─────────────────────────────────────────── │
// │ "Your React certificate qualifies you for   │
// │  3 new jobs posted in the last 2 hours.     │
// │  Average rate: $72/hr. Your current rate    │
// │  is $45/hr — CIRCUIT can help you close     │
// │  that gap with a rate audit."               │
// │ ─────────────────────────────────────────── │
// │ [Ask CIRCUIT]  [View Jobs]  [Dismiss]       │
// └─────────────────────────────────────────────┘

// Appears: bottom-left (does not conflict with FAB at bottom-right)
// Auto-dismisses after 30 seconds if no interaction
// Max 1 proactive card per page view — queue if multiple exist
// Stores dismissed IDs in localStorage — never shows same message twice
```

---

## 10.8 LoopStageIndicator Component

```tsx
// src/components/ui/LoopStageIndicator.tsx
// Compact badge showing current loop stage — appears in sidebar nav

// Visual spec — 32px tall pill badge:
// [⬡ Loop 14 · Academy →] 
//  Gold border, Space Mono 9px, current stage name, arrow to next

// On hover: shows AgenticLoopWidget tooltip with full loop status
// On click: opens OMEGA panel with loop explanation and next action

// Props:
interface LoopStageIndicatorProps {
  currentStage: LoopStage;
  loopCount: number;
  nextStage: LoopStage;
  compact?: boolean;    // true = dot only, false = full pill
}
```

---

# ════════════════════════════════════════════
# LEVEL XI — SOVEREIGN INFRASTRUCTURE & API
## *Winners stops being a platform. It becomes the infrastructure others build on.*
# ════════════════════════════════════════════

## What This Level Achieves

Phase 8. Winners Cloud goes live. Every AI capability, every Trust Score verification, every payment flow, and every Agentic Loop trigger becomes available as a clean REST API. Developers, businesses, NGOs, and governments in Africa and the diaspora can call the Winners infrastructure to power their own applications.

---

## 8.1 Winners Cloud API Products

| Product | Description | Revenue |
|---|---|---|
| AI Assistant API | Call any of the 9 named assistants via REST with SSE streaming | Pay-per-token credit model |
| Trust Score API | Verify a user's score, tier, and Academy certificates | $0.50/call or $49/month |
| Payments API | Stripe + Flutterwave — M-Pesa, MTN MoMo, Airtel, card in one integration | Transaction percentage |
| Certificate Verification API | Real-time Academy certificate authenticity check | $0.50/call |
| Agentic Loop API | Trigger a custom loop for an external platform's users | Enterprise pricing |
| Community Data API | Public creator profiles, trending topics, community pulse | Tiered pricing |
| Plugin Marketplace | Developers extend any of the 9 assistants | 70% developer / 30% platform |

---

## 8.2 SDK Design

```typescript
// @winners/sdk — JavaScript / TypeScript
import { WinnersClient } from '@winners/sdk';

const client = new WinnersClient({ apiKey: process.env.WINNERS_API_KEY });

// Chat with a named assistant
const response = await client.chat({
  assistant: 'atlas',
  message: 'Research the best products for the Nigerian beauty market',
  stream: true,
});

// Verify a user's credentials
const trust = await client.verify({
  userId: 'usr_abc123',
  checks: ['trust_score', 'academy_certificates', 'payment_history'],
});

// Process a payment (Africa-native)
const payment = await client.pay({
  amount: 5000,
  currency: 'KES',
  method: 'mpesa',
  recipient: '+254700000000',
  reference: 'course_payment_xyz',
});

// Trigger an agentic loop
await client.loop.trigger({
  userId: 'usr_abc123',
  event: 'skill_detected',
  payload: { skill: 'python', confidence: 0.92, source: 'community_post' },
});
```

---

# 📐 COMPLETE DESIGN LANGUAGE REFERENCE

## CSS Architecture

Every Winners platform runs on these variables. No hex. No exceptions.

```css
:root {
  /* Brand colours */
  --gold:        #C9A84C;   /* Primary brand — CTAs, display headings, active states */
  --blue:        #2B5F8E;   /* Steel blue — secondary actions, links */
  --ice:         #89C4E1;   /* Light blue — active states, ice accents */
  --green:       #2DD4A0;   /* Success, live status, progress, completion */
  --red:         #E05A4E;   /* Error, danger, delete, warning */
  --purple:      #9B6FFF;   /* AI features, intelligence, streaming, forecasts */

  /* Surfaces */
  --bg:          #0D1520;   /* Page background — deepest dark */
  --surface:     #111D2E;   /* Card background */
  --surface2:    #172335;   /* Elevated surface, input backgrounds, hover states */
  --surface3:    #1C2B3D;   /* Highest elevation — modals, dropdowns */

  /* Borders */
  --border:      #1E3248;   /* Default border */
  --border2:     #243B55;   /* Elevated border — hover, focus */

  /* Text */
  --text:        #E8EEF5;   /* Primary text — headings, important content */
  --text-mid:    #8AA4BE;   /* Secondary text — descriptions, body */
  --text-dim:    #5A7A96;   /* Muted text — labels, metadata, timestamps */
}
```

## Semantic Gradient Rules

| Gradient | Usage | CSS |
|---|---|---|
| Gold standard | Primary cards, CTAs, brand headings | `linear-gradient(90deg, var(--gold), transparent)` |
| Ice flow | Community, social, connection features | `linear-gradient(90deg, var(--ice), transparent)` |
| Purple stream | AI-generated content, Intelligence layer | `linear-gradient(90deg, var(--purple), transparent)` |
| Green signal | Success, live status, completion | `linear-gradient(90deg, var(--green), transparent)` |
| OMEGA dual | Cross-layer intelligence, OMEGA outputs | `linear-gradient(90deg, var(--green), var(--gold), transparent)` |
| Danger | Error states, destructive actions | `linear-gradient(90deg, var(--red), transparent)` |

## Layout Standards

```
Page max-width:          1280px (centred with auto margins)
Sidebar width:           260px (desktop), collapsible on mobile
Content padding:         32px horizontal (desktop), 16px (mobile)
Section gap:             48px between major sections
Card gap:                16px in grids
Card border-radius:      6px (standard), 4px (compact), 12px (hero cards only)
Input border-radius:     4px
Button border-radius:    4px (standard), 2px (mono/compact), 50% (FAB)
Z-index scale:           base 0 | cards 1 | overlays 10 | panels 50 | modals 100 | tooltips 200
```

## Accessibility Requirements

- **Contrast:** WCAG AA minimum (4.5:1) on all text — enforced on every new component
- **Keyboard navigation:** All panels, modals, palettes fully keyboard-navigable with visible focus rings
- **Screen readers:** `aria-label` on all assistant avatars, status indicators, and dynamic content
- **Touch targets:** 44px minimum height on all mobile interactive elements
- **Reduced motion:** All animations respect `prefers-reduced-motion` media query

---
