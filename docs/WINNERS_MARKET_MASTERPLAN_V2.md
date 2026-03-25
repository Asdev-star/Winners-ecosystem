# 🛒 WINNERS MARKET MASTERPLAN V2
### March 9, 2026 · Expanded Product Spec + Full Integration Recommendations
### Scope: Winners Market · 10 Verticals · Transactional Finance Extension · Scale-by-Scale Build Guide

> **Purpose:** Define the full Winners Market build plan, align it with the current repository, extend the platform into a wallet/banking-style transaction system, and add concrete feature and tool recommendations at every scale of the finance rollout and every vertical.

---

## EXECUTIVE SUMMARY

Winners Market is no longer just a marketplace. It is the **commercial and transaction layer** of the Winners Ecosystem — a multi-vertical economic platform where users can sell products, offer services, launch businesses, create career assets, monetize content, and move money through a secure internal financial layer.

This document expands Winners Market into **10 distinct verticals** and adds a full financial operating model:

- **Commerce** — goods and vendors
- **Services and marketing** — agencies and creators
- **Streaming and events** — audience monetization
- **Business and career tools** — powered by AI
- **Property, health, and trading** — advanced monetizable verticals
- **Finance / wallet rails** — send money, receive money, withdraw funds, check balance

The goal is to make Winners Market the **revenue engine** of the platform — multiple independent monetization streams that never depend on a single commerce flow.

---

## CURRENT REPO ALIGNMENT

### What Already Exists in Code

**Frontend Market routes wired in `src/App.tsx`:**
`/market` · `/market/dropshipping` · `/market/product/:productId` · `/market/vendor` · `/market/cart` · `/market/orders` · `/market/checkout` · `/market/:vertical`

**Commerce backend route modules:**
`productRoutes.ts` · `vendorRoutes.ts` · `cartRoutes.ts` · `orderRoutes.ts`

**Commerce database models in `prisma/schema.prisma`:**
`Vendor` · `Product` · `ProductVariant` · `ProductImage` · `Cart` · `CartItem` · `Order` · `OrderItem` · `OrderTracking` · `ProductReview` · `VendorReview`

**Expanded 10-vertical Market UI:** `src/features/market/WinnersMarketExpanded.tsx`

### Current Implementation Truth

| Area | Current State |
|---|---|
| Commerce Hub | **Partially implemented** |
| Dropshipping | **Demo / spec surface** |
| Digital Marketing Hub | **Planned** |
| Winners Stream | **Planned** |
| Business Launcher | **UI/spec + AI concept** |
| CV & Career Tools | **UI/spec + AI concept** |
| Winners Trading | **Planned** |
| Winners Events | **Planned** |
| Winners Property | **Planned** |
| Winners Health | **Planned** |
| Winners Finance | **Not yet implemented in backend or schema** |

### Immediate Cleanup Required Before Finance Extension

1. **Fix checkout vendor resolution** — `CheckoutPage.tsx` sends a `productId` where an order expects a `vendorId`
2. **Normalize cart identity flow** — backend cart routes depend on tenant/session headers; frontend usage is misaligned
3. **Move Market AI calls behind backend routes** — replace direct browser-to-provider patterns
4. **Unify the Market UI architecture** — `/market` and `/market/:vertical` must feel like one product
5. **Design finance on top of a ledger, not just balance fields** — wallet systems need auditability and reversible accounting
6. **Enforce tenant scoping on every wallet and finance query** — no call bypasses tenant ownership rules

---

## THE 10 WINNERS MARKET VERTICALS

| # | Vertical | Phase | Core Offer | Revenue Model |
|---|---|---|---|---|
| 1 | 🛒 Commerce Hub | 4A | Products, dropshipping, print-on-demand, multi-vendor marketplace | 10–20% commission + vendor plans |
| 2 | 📣 Digital Marketing Hub | 4B | Campaigns, SEO, social scheduler, copywriting, reporting | Package sales 20% + subscriptions $29–99/mo |
| 3 | 📺 Winners Stream | 4C | Live streaming, VOD, PPV, subscriptions, tipping | Subscription cut 15% + PPV + tips 10% |
| 4 | 📈 Winners Trading | 4D | Paper trading, signals, copy trading, market education | Premium signals $49–149/mo |
| 5 | 📋 Business Launcher | 4E | Business plans, projections, pitch decks, launch kits | Credits + premium templates |
| 6 | 📄 CV & Career Tools | 4F | CVs, cover letters, ATS tools, portfolio builder | Credits + templates + agency use |
| 7 | 🏠 Winners Property | 4G | Real estate listings and investment discovery | Listing fees + agent subscriptions |
| 8 | 🎟 Winners Events | 4H | Tickets, registrations, livestream events, passes | Ticket commissions 5–10% + event tools |
| 9 | 💪 Winners Health | 4I | Coaches, plans, telehealth booking, wellness tools | Marketplace cut 20% + subscriptions |
| 10 | 🏦 Winners Finance | 4J | Wallets, savings, transfers, withdrawals, BNPL | Transaction fees + float services |

*Build sequence: 4A → 4B → 4C → 4E → 4F → 4D → 4H → 4G → 4I → 4J*

---

## VERTICAL-BY-VERTICAL PRODUCT DEFINITION

---

### 4A — COMMERCE HUB

**Goal:** Build the core multi-vendor transaction engine first. Everything else in Market depends on this.

#### Scope
Product catalog · Product detail pages · Cart · Checkout · Orders · Vendor onboarding · Vendor dashboard · Reviews · Inventory management · Dropshipping-ready foundation

#### Recommended Features

| Feature | Priority | Notes |
|---|---|---|
| Unified product catalog with filters, sort, search | 🔴 First | Meilisearch for full-text and faceted filters |
| Cart → Checkout → Order confirmation flow | 🔴 First | Fix vendor resolution bug before touching this |
| Vendor onboarding wizard (KYC lite + payout info) | 🔴 First | Trust Score assigned on completion |
| Vendor dashboard — sales chart, inventory, payout status | 🔴 First | Recharts for chart layer |
| Dropshipping store manager | 🟡 Next | Printful + Gelato API connectors |
| Product reviews and vendor ratings | 🟡 Next | Star rating, verified purchase badge |
| Featured product placement (paid boost) | 🟡 Next | Flat fee or auction model |
| AI product description generator (ATLAS) | 🟡 Next | Via `/api/v1/ai/atlas` backend route — never direct browser call |
| Bulk product import via CSV | 🟢 Later | Power tool for high-volume vendors |
| Abandoned cart recovery emails | 🟢 Later | Resend + node-cron scheduled job |
| Inventory alerts and low-stock notifications | 🟢 Later | Socket.io + Resend dual delivery |

#### Recommended Tools & Integrations

| Tool | Role | Why This Tool |
|---|---|---|
| **Stripe** | Checkout, Stripe Connect for vendor splits | Already in stack — extend with Connect for marketplace payouts |
| **Flutterwave** | African card + mobile money checkout | M-Pesa, MTN MoMo, bank transfer in one API |
| **Printful API** | Print-on-demand fulfillment | Creator merch, branded goods, zero inventory risk |
| **Gelato API** | Print-on-demand (Africa-optimized delivery) | 3–7 day delivery to African markets |
| **Shippo** | Multi-carrier shipping rates + label generation | Single integration across all carriers |
| **Meilisearch** | Product and vendor full-text search | Fast, typo-tolerant, instant faceted filtering |
| **Cloudinary** | Product image hosting + optimization | Already in stack — resize, CDN, WebP auto |
| **Resend + node-cron** | Order confirmation, shipping updates, abandoned cart | Already in stack |
| **PDFKit** | Order invoices and receipts | Already installed |
| **ExcelJS** | Vendor sales exports | Already installed |

#### Revenue
Transaction commissions (10–20%) · Vendor subscription plans ($15–$49/mo) · Featured product placements · Print-on-demand margins · Service add-ons for sellers

---

### 4B — DIGITAL MARKETING HUB

**Goal:** Turn Winners Market into a service-and-tools marketplace for growth operators and agencies.

#### Scope
Agency marketplace · Client workspace dashboards · Campaign builder (Meta, Google, TikTok) · SEO audit + keyword tooling · Social content scheduler · Email campaign workflows · AI copywriting tools · Lead generation tracker · Client report exports

#### Recommended Features

| Feature | Priority | Notes |
|---|---|---|
| Agency service marketplace (list + hire packages) | 🔴 First | Service listings with package tiers and verified reviews |
| Client dashboard — project overview, deliverables, billing | 🔴 First | Shared workspace per client contract |
| Social content calendar + cross-platform scheduler | 🟡 Next | Draft, schedule, post to connected social accounts |
| AI copywriting tool (ad copy, captions, email subject lines) | 🟡 Next | ATLAS via `/api/v1/ai/atlas` — streaming output |
| Campaign performance dashboard (Meta/Google reporting) | 🟡 Next | OAuth-linked ad account data |
| SEO audit tool — on-page analysis + recommendations | 🟢 Later | Page crawler + ATLAS AI commentary |
| White-label PDF report builder for client delivery | 🟢 Later | Agencies brand and send directly |
| Lead scoring + lightweight CRM module | 🟢 Later | Enough for SME agency workflows |
| Email campaign builder + send | 🟢 Later | Resend campaign extension |
| Competitor analysis tool | 🟢 Later | ATLAS + web search context |

#### Recommended Tools & Integrations

| Tool | Role | Why This Tool |
|---|---|---|
| **Meta Business API** | Facebook/Instagram ad management | Largest African social ad market |
| **Google Ads API** | Search + display campaign creation and reporting | Required for full-service agency offering |
| **TikTok for Business API** | TikTok ad management and analytics | Fastest-growing African digital ad channel |
| **Claude (ATLAS backend route)** | Copywriting, strategy, campaign briefs | Never called directly from browser |
| **Resend** | Email campaign delivery + automation | Already in stack — extend with campaign features |
| **DataForSEO / Ahrefs API** | Keyword research + SERP data | Affordable SEO data — DataForSEO has pay-as-you-go |
| **Buffer API / native scheduler** | Social post scheduling queue | Or build native scheduler to keep data in ecosystem |
| **PDFKit** | White-label client reports | Already installed |
| **ExcelJS** | Campaign performance spreadsheet exports | Already installed |
| **Segment** | Campaign analytics event tracking | Standard event schema for all client campaigns |

#### Revenue
Managed package fee split (20%) · Monthly tool subscriptions ($29–$99/mo) · Performance management fees · White-label agency tooling tier

---

### 4C — WINNERS STREAM

**Goal:** Let creators, educators, coaches, and entertainers monetize audiences through video and live content.

#### Scope
Live streaming + VOD library · Scheduled broadcasts · Creator channels · Channel subscriptions · Tipping · Pay-per-view events · Real-time audience chat · Creator analytics dashboard

#### Recommended Features

| Feature | Priority | Notes |
|---|---|---|
| Creator channel pages (bio, videos, subscriber count) | 🔴 First | Public profile + follow button |
| Live stream broadcast at 720p/1080p | 🔴 First | Mux or Cloudflare Stream as provider |
| Channel subscription tiers | 🔴 First | Stripe recurring — 15% platform cut |
| Pay-per-view event creation and purchase | 🔴 First | Single-purchase access, expires after event |
| Real-time chat + emoji reactions | 🔴 First | Socket.io — already in stack |
| Super Chat / tipping during live stream | 🟡 Next | Stripe inline payment during active stream |
| VOD library — upload, process, and host | 🟡 Next | Cloudinary → Mux at scale |
| Stream replay and clip creation | 🟡 Next | Short clips for Community and social sharing |
| Creator analytics — views, revenue, watch time | 🟡 Next | Recharts dashboard |
| Multi-quality adaptive streaming (480p/720p/1080p) | 🟢 Later | HLS.js adaptive bitrate |
| AI stream highlights generator | 🟢 Later | FORGE processes transcript → key moments |
| Auto-post to Community feed when going live | 🟢 Later | Socket.io event → Community feed push |
| Stream-in-stream (co-host invite) | 🟢 Later | LiveKit interactive layer |

#### Recommended Tools & Integrations

| Tool | Role | Why This Tool |
|---|---|---|
| **Mux** | Live streaming + VOD hosting + analytics | Best-in-class for platform-level video at scale |
| **Cloudflare Stream** | Alternative video CDN delivery | Lower cost at moderate volume |
| **HLS.js** | Adaptive bitrate playback in browser | Open source, zero license cost, battle-tested |
| **LiveKit** | WebRTC interactive streams (Q&A, co-hosts) | Already in stack — Community Studio |
| **Socket.io** | Live chat + reactions + real-time viewer count | Already in stack |
| **Stripe** | Channel subscriptions + PPV access + tipping | Already in stack |
| **faster-whisper (HERALD)** | Auto-transcription for VOD captions | Already planned — offline, no API cost |
| **Claude (FORGE route)** | AI highlights, stream summaries, chapter markers | Via backend route — cost-controlled |
| **Cloudinary** | Thumbnail images, channel art, pre-stream assets | Already in stack |
| **Resend** | "Going live" notifications to subscribers | Already in stack |

#### Revenue
Channel subscription cut (15%) · PPV event fee (10%) · Tip commission (10%) · VOD purchase/rental fee · Ad revenue share (future)

---

### 4D — WINNERS TRADING

**Goal:** Build a learning-first trading layer before approaching regulated live brokerage depth.

#### Scope
Paper trading simulator + virtual portfolio · Signals marketplace · Strategy backtesting · Copy trading simulation · Risk calculator · AI market analysis assistant · Community trading challenges

#### Recommended Features

| Feature | Priority | Notes |
|---|---|---|
| Paper trading simulator — buy/sell with virtual funds | 🔴 First | Zero regulatory risk, pure skill-building |
| Portfolio dashboard — holdings, P&L, performance chart | 🔴 First | Recharts candlestick + sparklines |
| Signal marketplace — buy analyst signals per asset or subscription | 🔴 First | Signals expire, can be rated after outcome |
| Watchlist + real-time price alerts | 🔴 First | WebSocket price feed + Resend/push delivery |
| Trading journal — log trades, emotions, outcome notes | 🟡 Next | Private, searchable, analytics-enabled |
| Copy trading simulator — mirror a trader's paper positions | 🟡 Next | Follow without real money risk |
| AI market analysis — sentiment, news digest, pattern flags | 🟡 Next | ATLAS + Claude via backend route |
| Trading challenges + community leaderboards | 🟡 Next | Gamification — prizes or recognition |
| Strategy backtesting with historical OHLCV data | 🟢 Later | Polygon.io historical data |
| Broker partner referral links | 🟢 Later | Revenue without holding a brokerage license |
| Crypto and forex coverage alongside equities | 🟢 Later | CoinGecko + Alpha Vantage |

#### Recommended Tools & Integrations

| Tool | Role | Why This Tool |
|---|---|---|
| **Alpaca Markets API** | Paper trading + live US equity market data | Free paper trading tier, REST + WebSocket |
| **Polygon.io** | Real-time + historical OHLCV price data | Affordable, comprehensive, used by hedge funds |
| **TradingView Lightweight Charts** | Professional charting library (open source) | Used by Robinhood, Coinbase — free, fast |
| **CoinGecko API** | Crypto price + market data | Free tier — wide asset coverage |
| **Alpha Vantage** | Fundamentals, forex, macro indicators | Affordable supplemental data source |
| **Socket.io** | Real-time price streaming into watchlists | Already in stack |
| **Claude (ATLAS backend route)** | News sentiment analysis, pattern explanation | Cost-controlled via backend |
| **Recharts** | Portfolio charts, P&L over time, challenge leaderboard | Already in stack |
| **Resend** | Price alert emails + signal delivery notifications | Already in stack |

#### Revenue
Premium signals subscriptions ($49–$149/mo) · Advanced simulator tiers · Educational course bundles (Academy connection) · Broker referral programs

---

### 4E — BUSINESS LAUNCHER

**Goal:** Convert ideas into operational, investor-ready businesses using AI-powered generation tools.

#### Scope
Business plan generator · Market size estimation · Competitor analysis · Financial projection builder · Pitch deck outline generator · Legal starter template pack · Pricing and revenue calculator · Startup cost estimator

#### Recommended Features

| Feature | Priority | Notes |
|---|---|---|
| Business plan generator — full structured document | 🔴 First | ATLAS via backend route — SSE streaming |
| 1-page executive summary (fast output) | 🔴 First | Shareable, printable, investor-ready |
| Financial projection builder (12/24/36-month) | 🔴 First | Revenue model + Recharts visualization |
| Pitch deck outline — 12-slide structure with content | 🔴 First | Export to structured PDF |
| Startup cost estimator by category | 🟡 Next | Tech, hiring, ops, marketing breakdown |
| Competitor analysis — AI-researched + structured | 🟡 Next | ATLAS + web search injected context |
| Legal template pack — NDA, shareholder, MoU, founder agreement | 🟡 Next | Kenya, Nigeria, UK, USA jurisdiction tabs |
| Brand name + domain availability checker | 🟡 Next | Check name + domain in one tool |
| Revenue model selector | 🟢 Later | SaaS, marketplace, subscription, ad-based, etc. |
| Investor-ready PDF export (branded) | 🟢 Later | PDFKit — company colours and logo |
| Business registry submission guide by country | 🟢 Later | KE, NG, GH, ZA, UK, USA step-by-step |
| Co-founder match feature (future) | 🟢 Later | Community integration — find skills match |

#### Recommended Tools & Integrations

| Tool | Role | Why This Tool |
|---|---|---|
| **Claude (ATLAS backend route)** | Business plan, competitor research, pitch content | Via backend — SSE streaming, never browser-direct |
| **PDFKit** | Investor-ready PDF export for all generated documents | Already installed |
| **ExcelJS** | Financial projection spreadsheet export | Already installed |
| **Recharts** | Revenue projection and cost breakdown charts | Already in stack |
| **Namecheap / GoDaddy API** | Domain availability check alongside brand name | Quick API call, no auth required |
| **OpenCorporates API** | Company name availability — global + African | Prevents naming conflicts before registration |
| **jsPDF + html2canvas** | In-browser PDF preview before backend export | Lightweight client-side preview before commit |
| **Resend** | Deliver generated plan to user's email inbox | Already in stack |

#### Revenue
Credit-based generation · Premium exports + branded templates · Template sales · Business advisory marketplace (human + AI tiers)

---

### 4F — CV & CAREER TOOLS

**Goal:** Help users turn verified skills and Academy certificates into income and opportunities.

#### Scope
ATS CV generator · Cover letter generation · LinkedIn optimizer · Professional bio writer · Portfolio builder · Skills gap analyzer · Interview coach · Export to PDF / DOCX / JSON

#### Recommended Features

| Feature | Priority | Notes |
|---|---|---|
| ATS-optimized CV builder — form inputs to document | 🔴 First | 15+ templates, keyword-scored output |
| ATS compatibility score + keyword gap check | 🔴 First | Paste job description → score against it |
| Cover letter generator | 🔴 First | Job description + background → tailored letter |
| PDF + DOCX export | 🔴 First | PDFKit + docx library — both required |
| Professional bio writer (short + long form) | 🟡 Next | LinkedIn, Twitter, speaker bio variants |
| LinkedIn profile optimizer | 🟡 Next | Section-by-section AI feedback |
| Skills gap analyzer — profile vs. job description | 🟡 Next | Shows what Academy courses to take next |
| Portfolio website builder (one-page) | 🟡 Next | Generated from CV data + project inputs |
| Interview prep coach | 🟢 Later | Common + role-specific Q&A with model answers |
| JSON / LinkedIn data import | 🟢 Later | Paste LinkedIn URL or upload JSON résumé |
| Agency bulk plan — 50+ CVs/month | 🟢 Later | Recruiter and staffing agency tier |
| Academy certificate auto-import to CV | 🟢 Later | Agentic Loop — certificate completion → CV update |

#### Recommended Tools & Integrations

| Tool | Role | Why This Tool |
|---|---|---|
| **Claude (ARIA/ATLAS backend route)** | CV generation, cover letters, bio writing, gap analysis | Via backend — SSE streaming |
| **PDFKit** | CV and cover letter PDF generation | Already installed |
| **docx library** | DOCX export — Word-compatible CV for job applications | Widely required by African employers |
| **Puppeteer** (optional) | HTML-to-PDF for visually designed CV templates | Better fidelity than PDFKit for rich layouts |
| **JSON Résumé spec** | Standard open format for CV import/export | Widely supported — LinkedIn, GitHub, etc. |
| **Cloudinary** | Profile photo hosting + optimized display | Already in stack |
| **Resend** | Deliver completed CV to user's inbox | Already in stack |

#### Revenue
Generation credits · Premium templates ($5–$15 one-time) · Agency bulk plans ($99–$299/mo) · Career coach marketplace (20% cut)

---

### 4G — WINNERS PROPERTY

**Goal:** Build an East Africa and diaspora property discovery and investment marketplace.

#### Scope
Property listings · Agent and developer profiles · Search with map view · ROI and affordability calculators · Neighborhood intelligence · Due diligence checklist · Lead routing and appointment booking

#### Recommended Features

| Feature | Priority | Notes |
|---|---|---|
| Property listing creation — photos, specs, asking price | 🔴 First | Cloudinary multi-image upload |
| Search with filters — location, price, type, size | 🔴 First | Meilisearch faceted filters |
| Map view — property pins with clustering | 🔴 First | Mapbox — already planned in stack |
| Agent and developer profiles with listings and ratings | 🔴 First | Trust Score integration |
| ROI calculator — rental yield + appreciation estimate | 🟡 Next | Simple formula tool, editable inputs |
| Mortgage affordability calculator | 🟡 Next | Local interest rates per market (KE, NG, GH, ZA) |
| Property viewing appointment booking | 🟡 Next | Cal.com or native calendar widget |
| Neighborhood intelligence summary | 🟡 Next | ATLAS + structured local data input |
| Due diligence checklist (AI-generated, jurisdiction-specific) | 🟢 Later | KE, NG, GH, ZA legal checklist per property type |
| 3D virtual tour embed support | 🟢 Later | Matterport or Kuula iframe embed |
| Cross-border property search (diaspora feature) | 🟢 Later | Diaspora buyers searching home market remotely |
| Verified agent badge (KYC-linked Trust Score) | 🟢 Later | Agents must complete identity verification |

#### Recommended Tools & Integrations

| Tool | Role | Why This Tool |
|---|---|---|
| **Mapbox** | Interactive property map — pins, clusters, satellite | Already planned in tech stack |
| **Cloudinary** | Property photo gallery hosting + optimization | Already in stack |
| **Meilisearch** | Property search with location + price facets | Already planned in stack |
| **Cal.com (self-hosted)** | Property viewing appointment booking | Open source, self-hostable, no per-booking fee |
| **Claude (ATLAS backend route)** | Neighborhood summaries, due diligence, investment analysis | Via backend route |
| **Matterport / Kuula** | 3D virtual tour embed | Agents upload to their own accounts, Winners embeds |
| **Stripe** | Listing fees and featured promotion payments | Already in stack |

#### Revenue
Listing fees (per listing or subscription) · Agent subscriptions ($49–$199/mo) · Referral commissions · Featured listing promotion slots

---

### 4H — WINNERS EVENTS

**Goal:** Monetize online and physical events with ticketing, streaming access, and sponsorship layers.

#### Scope
Event creation wizard · Paid and free ticket tiers · QR validation + check-in · Event landing pages · Streaming access for online events · Sponsorship slots · Analytics dashboard

#### Recommended Features

| Feature | Priority | Notes |
|---|---|---|
| Event creation wizard — physical, virtual, or hybrid | 🔴 First | Toggle sets which features activate |
| Free + paid ticket tiers with capacity limits | 🔴 First | Stripe for paid, Flutterwave for African mobile |
| Auto-generated event landing page (public, shareable) | 🔴 First | Unique URL per event, no extra setup |
| Ticket purchase + instant QR confirmation email | 🔴 First | Resend + qrcode library |
| QR code scanner / check-in validator | 🔴 First | Mobile-optimized check-in mode |
| Attendee management dashboard (list, CSV export) | 🟡 Next | Host view — check-in status, contact info |
| Livestream access for online events | 🟡 Next | Winners Stream integration — 4C dependency |
| Waitlist + automatic notification when spot opens | 🟡 Next | node-cron + Resend |
| Refund management (full and partial) | 🟡 Next | Stripe refunds API |
| Sponsorship slot management — brand placements | 🟡 Next | Sell logo on landing page + stream lower-third |
| Event analytics — ticket sales, revenue, check-in rate | 🟢 Later | Recharts dashboard |
| Group/team ticket booking with discount | 🟢 Later | Bulk purchase at defined threshold |
| Recurring event series management | 🟢 Later | Weekly, monthly event schedules |
| NFT ticket (proof of attendance collectible) | 🟢 Later | Optional premium events feature |

#### Recommended Tools & Integrations

| Tool | Role | Why This Tool |
|---|---|---|
| **Stripe** | Ticket payments, refunds, host settlement | Already in stack |
| **Flutterwave** | African mobile money + card ticket purchases | M-Pesa, MTN MoMo, bank transfer |
| **qrcode** (npm) | QR code generation for each ticket | Lightweight, already used in stack |
| **Resend** | Ticket confirmation + event reminder emails | Already in stack |
| **Winners Stream (4C)** | Livestream access for virtual attendees | Internal dependency — build 4C first |
| **Google Calendar / iCal** | Add-to-calendar link on event pages | Open standard, no API key required |
| **Mapbox** | Venue map embed for physical event pages | Already planned in stack |
| **Socket.io** | Real-time check-in count for host dashboard | Already in stack |

#### Revenue
Ticket commission (5–10%) · Host subscriptions ($29–$99/mo) · Sponsorship marketplace · Premium event tooling (custom branding, domain)

---

### 4I — WINNERS HEALTH

**Goal:** Create a wellness marketplace with structured program monetization and coaching infrastructure.

#### Scope
Coach marketplace · Workout and wellness programs · Nutrition plans · Progress tracking · Group challenges · Telehealth scheduling · Corporate wellness dashboards

#### Recommended Features

| Feature | Priority | Notes |
|---|---|---|
| Coach profiles — bio, speciality, rates, reviews | 🔴 First | Trust Score integration — verification required |
| 1-on-1 and group session booking | 🔴 First | Cal.com + Stripe payment on booking |
| Wellness program packages — structured, purchasable | 🔴 First | PDF + video plans behind paywall |
| Client progress tracker — weight, reps, measurements | 🟡 Next | Simple form-based logging, charted over time |
| AI meal plan generator | 🟡 Next | ATLAS via backend route — custom to goal + diet |
| AI workout program builder | 🟡 Next | Generate by goal, fitness level, available equipment |
| Group wellness challenges with community leaderboard | 🟡 Next | Community integration — challenges + accountability |
| Corporate wellness packages (employer buys for team) | 🟢 Later | B2B — fixed monthly per-seat pricing |
| Telehealth booking — licensed health practitioners | 🟢 Later | Compliance-careful — coaching tier first |
| Wearable data sync (Apple Health / Google Fit) | 🟢 Later | Progressive enhancement — optional connection |
| Affiliate health product recommendations | 🟢 Later | ATLAS recommends relevant products → earn per sale |

#### Recommended Tools & Integrations

| Tool | Role | Why This Tool |
|---|---|---|
| **Stripe** | Session payments, program purchases, corporate billing | Already in stack |
| **Cal.com (self-hosted)** | Coach session booking + calendar sync | Open source, self-hostable, no per-booking fee |
| **Zoom / Google Meet API** | Virtual session links auto-generated on booking | Coaches already use these — meet them where they are |
| **Claude (ATLAS backend route)** | Meal plans, workout programs, health content | Via backend — cost-controlled |
| **Cloudinary** | Program photos, coach profile images, video thumbnails | Already in stack |
| **PDFKit** | Downloadable meal and workout plan PDFs | Already installed |
| **Resend** | Session reminders, program delivery, progress check-ins | Already in stack |

#### Revenue
Coach marketplace cut (20% of sessions) · Program purchase fees · Monthly subscriptions ($19–$59/mo) · Corporate wellness packages (custom pricing)

---

## WINNERS FINANCE — 4J FULL SPEC

---

### CORE USER ACTIONS

| Action | Description |
|---|---|
| **Send money** | Transfer from Winners wallet to another user, vendor, freelancer, savings group, or escrow |
| **Receive money** | Accept funds from sales, tips, subscriptions, events, service payments, peer transfers, refunds, referral rewards |
| **Withdraw money** | Move funds from Winners wallet to bank account, mobile money, or card payout rail |
| **Check balance** | View available, pending, held, and settlement balances in real time |
| **Fund wallet** | Load wallet from card, bank transfer, or mobile money |
| **Pay with balance** | Use wallet balance to purchase any product, service, course, ticket, or subscription inside the ecosystem |

### How Finance Connects to Every Vertical

| Vertical | Financial Connection |
|---|---|
| 🛒 Commerce Hub | Buyer pays with wallet · vendor earns payout balance |
| 📣 Digital Marketing Hub | Agencies receive project payments and monthly retainers |
| 📺 Winners Stream | Tipping, subscriptions, PPV event settlement |
| 📈 Winners Trading | Education credits, subscription fees, competition prize pools |
| 📋 Business Launcher | AI credit consumption and premium service upsells |
| 📄 CV & Career Tools | Credit-based generation fees and coach session payments |
| 🏠 Winners Property | Listing fees, lead referral fees, booking deposits |
| 🎟 Winners Events | Ticket purchases, host settlement, refund processing |
| 💪 Winners Health | Coach session payouts, program purchases, telehealth fees |
| 🏦 Winners Finance | Wallet, transfers, savings, withdrawals, BNPL |

---

### WALLET ARCHITECTURE

#### Wallet Layers

| Layer | Purpose |
|---|---|
| **Wallet Account** | Per-user or per-business balance container |
| **Ledger** | Source-of-truth double-entry bookkeeping — immutable |
| **Transaction Engine** | Handles transfers, deposits, withdrawals, escrow, refunds |
| **Payout Engine** | Sends money out to bank and mobile rails |
| **Funding Engine** | Pulls money in from cards, bank transfer, mobile money |
| **Compliance Layer** | KYC, AML flags, limits, sanctions screening |
| **Reconciliation Layer** | Matches provider webhooks to internal ledger |
| **Notification Layer** | Alerts for inflow, outflow, failure, withdrawal completion |

#### Balance Types

| Type | Description |
|---|---|
| **Available balance** | Spendable immediately |
| **Pending balance** | Incoming funds still clearing |
| **Held balance** | Escrow or dispute hold |
| **Reserve balance** | Platform risk control for vendors and high-risk accounts |
| **Settlement balance** | Merchant/vendor payout bucket before withdrawal |

#### Transaction Types
`Deposit · Internal transfer · Marketplace purchase · Refund · Withdrawal · Vendor payout · Escrow hold · Escrow release · Tip payout · Subscription payout · Ticket payout · Savings contribution · BNPL repayment · Fee charge · Adjustment`

---

### PROPOSED DATABASE EXTENSION

These models do not exist in the current schema yet.

```prisma
model WalletAccount {
  id               String   @id @default(cuid())
  tenantId         String
  userId           String?
  vendorId         String?
  currency         String   @default("USD")
  availableBalance Float    @default(0)
  pendingBalance   Float    @default(0)
  heldBalance      Float    @default(0)
  status           String   @default("ACTIVE")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model WalletLedgerEntry {
  id              String   @id @default(cuid())
  tenantId        String
  walletAccountId String
  direction       String   // debit | credit
  entryType       String   // deposit | transfer | withdrawal | payout | escrow | refund
  amount          Float
  currency        String   @default("USD")
  referenceType   String?
  referenceId     String?
  provider        String?
  providerRef     String?
  status          String   @default("posted")
  createdAt       DateTime @default(now())
}

model WalletTransfer {
  id               String   @id @default(cuid())
  tenantId         String
  senderWalletId   String
  receiverWalletId String
  amount           Float
  currency         String   @default("USD")
  feeAmount        Float    @default(0)
  note             String?
  status           String   @default("PENDING")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model WalletWithdrawal {
  id              String    @id @default(cuid())
  tenantId        String
  walletAccountId String
  amount          Float
  currency        String    @default("USD")
  feeAmount       Float     @default(0)
  destinationType String    // bank | mobile_money | card | payout_partner
  destinationRef  String
  provider        String?
  providerRef     String?
  status          String    @default("PENDING")
  failureReason   String?
  processedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model WalletDeposit {
  id              String   @id @default(cuid())
  tenantId        String
  walletAccountId String
  amount          Float
  currency        String   @default("USD")
  sourceType      String   // card | bank_transfer | mobile_money
  provider        String?
  providerRef     String?
  status          String   @default("PENDING")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model WalletPayoutMethod {
  id            String   @id @default(cuid())
  tenantId      String
  userId        String
  methodType    String   // bank | mobile_money | card
  provider      String?
  accountName   String?
  accountNumber String?
  bankCode      String?
  phoneNumber   String?
  country       String?
  currency      String?
  isDefault     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

### PROPOSED API SURFACE

```
# Wallet
GET  /api/v1/wallet
GET  /api/v1/wallet/balance
GET  /api/v1/wallet/transactions
POST /api/v1/wallet/deposit
POST /api/v1/wallet/transfer
POST /api/v1/wallet/withdraw
POST /api/v1/wallet/payout-methods
GET  /api/v1/wallet/payout-methods

# Vendor / Marketplace Payouts
GET  /api/v1/vendor/payouts
POST /api/v1/vendor/payouts/request
GET  /api/v1/vendor/settlements

# Escrow / Work / Service Payments
POST /api/v1/escrow/create
POST /api/v1/escrow/fund
POST /api/v1/escrow/release
POST /api/v1/escrow/refund

# Savings / Finance Tools
POST /api/v1/finance/savings-groups
POST /api/v1/finance/savings-groups/:id/contribute
GET  /api/v1/finance/savings-groups/:id/ledger
```

---

## FINANCE INTEGRATION PLAN BY SCALE

Each scale builds on the previous. Do not skip stages.

---

### SCALE 1 — PLATFORM MVP
> Internal wallet, no external rails. Fastest time-to-value.

**Goal:** An internal wallet that powers all financial flows inside Winners before touching a single external payment provider.

#### Capabilities
- Internal balance ledger (double-entry from day one)
- User-to-user transfers inside Winners (instant, no provider)
- Vendor balance accrual from product and service sales
- Balance visible in real time across all pages
- Wallet balance as a checkout payment method
- Manual withdrawal request queue (admin-approved in MVP)
- Transaction history with filters (type, date, status)

#### Recommended Features

| Feature | Notes |
|---|---|
| Wallet dashboard UI — balance cards, history table, action buttons | First screen to build. Show available, pending, and held separately |
| Internal P2P transfer — send to Winners username or email | Instant, no fees, no provider required |
| Wallet balance as payment method in cart checkout | Hook into existing cart flow — replace or supplement Stripe at checkout |
| Vendor earnings auto-credited on order completion | Order confirmed → ledger credit → vendor balance updates |
| Withdrawal request form (amount, destination, note) | Creates a `WalletWithdrawal` record with PENDING status |
| Admin withdrawal approval queue | Admin table — approve/reject with reason |
| Transaction history — type icons, amounts, counterparty names | Color-coded: green for credit, red for debit |
| Minimum withdrawal threshold enforcement ($10 default) | Prevents micro-withdrawal abuse |
| Balance update push via Socket.io on receive | Real-time — no page refresh needed |
| Transaction receipt PDF download | PDFKit |
| Monthly statement export (CSV/Excel) | ExcelJS |

#### Recommended Tools & Integrations

| Tool | Role | Why This Tool |
|---|---|---|
| **Stripe** | Card-based wallet funding + Stripe Connect for vendor payouts | Already in stack — extend with Connect for marketplace splits |
| **Prisma + PostgreSQL** | Double-entry ledger — immutable, auditable | Already in stack — extend with Wallet schema above |
| **Socket.io** | Real-time balance update on receive | Already in stack — instant UX feedback |
| **Resend** | Transfer confirmation, receipt, withdrawal status emails | Already in stack |
| **node-cron** | Scheduled reconciliation + batch admin payout processing | Already in stack |
| **PDFKit** | Transaction receipt PDF | Already installed |
| **ExcelJS** | Transaction history CSV/Excel export | Already installed |
| **JWT auth middleware** | Wallet ownership — every request scoped to authenticated user + tenantId | Already in stack |
| **Recharts** | Balance over time chart, inflow/outflow bar chart | Already in stack |

> **Why first:** Zero external provider dependencies. Unlocks immediate value for vendors and users with no compliance overhead or API agreements required. Build it correctly with double-entry from the start so Scale 2 is just adding a payout provider on top of existing ledger logic.

---

### SCALE 2 — EAST AFRICA / LOCAL RAILS
> Add M-Pesa, Airtel, MTN, Flutterwave. Real money in and out.

**Goal:** Connect the internal wallet to priority African mobile money and bank transfer rails so users can fund their wallet and withdraw to real accounts.

#### Capabilities
- Mobile money cash-in (M-Pesa STK Push, Airtel, MTN MoMo)
- Mobile money cash-out (withdraw from wallet to phone number)
- Local bank transfer for wallet funding
- Vendor payouts directly to mobile money
- Withdrawal status tracker (pending → processing → paid → failed)
- Multi-currency display (KES, TZS, UGX, NGN)

#### Recommended Features

| Feature | Notes |
|---|---|
| Mobile money deposit flow — enter phone, amount, confirm STK Push | M-Pesa prompts user on phone — no card required |
| Mobile money withdrawal — enter phone number, confirm, track status | B2C payout to registered mobile number |
| Bank transfer deposit option — account details shown, reference code | Manual matching until webhook confirms |
| Payout method manager — add, edit, set default mobile/bank | Masked in UI, AES-256 encrypted at rest |
| Multi-currency balance display | User selects display currency — KES, NGN, USD, etc. |
| Market-specific fee schedule | Different flat or % fee per country |
| Withdrawal status tracker with timeline | pending → processing → sent → confirmed / failed |
| Retry failed withdrawal with updated destination | UX for common failure case |
| OTP confirmation before withdrawal above threshold | Extra layer — AfricasTalking SMS OTP |
| Per-country transaction limit enforcement | Regulatory requirement — different limits per market |

#### Recommended Tools & Integrations

| Tool | Role | Why This Tool |
|---|---|---|
| **Safaricom Daraja API** | M-Pesa STK Push (deposit) + B2C (withdrawal) — Kenya | Direct integration — highest volume in target market |
| **MTN MoMo API** | Mobile money in/out — Uganda, Ghana, Cameroon, Rwanda | Official MTN developer API — single integration for MTN markets |
| **Airtel Money API** | Mobile money in/out — Kenya, Tanzania, Rwanda, Zambia | Airtel Africa developer portal |
| **Flutterwave** | Aggregated African rails — card, bank, mobile money (33+ countries) | One integration for multi-country fallback coverage |
| **AfricasTalking** | SMS OTP for withdrawal confirmation + USSD fallback | Critical for users without smartphones or mobile internet |
| **Infisical** | Secure storage of mobile money API credentials + secrets | Already recommended in Cloud stack — self-hostable |
| **Resend** | Withdrawal confirmation, failure alerts, deposit receipts | Already in stack |
| **node-cron** | Payout batch jobs + webhook retry jobs | Already in stack |
| **Redis** | Idempotency keys for mobile money webhook deduplication | Prevents double-processing on duplicate delivery |

> **Why second:** Kenya and Nigeria represent the two largest African digital economy markets by mobile money and card volume. M-Pesa + Flutterwave covers the majority of the target user base. Real withdrawal unlocks creator and vendor trust in the platform.

---

### SCALE 3 — PAN-AFRICAN PAYMENTS
> Expand to 10+ African markets. Multi-currency. Cross-border.

**Goal:** Expand payment acceptance and withdrawals across the full African continent with multi-currency support and cross-border orchestration.

#### Capabilities
- Multi-country card and bank collections
- Vendor settlements by country in local currency
- Currency conversion with spread as platform revenue
- Wallet top-ups in regional currencies (KES, NGN, GHS, ZAR, XOF, EGP)
- Cross-border internal transfers with FX conversion
- Country-specific checkout method auto-detection

#### Recommended Features

| Feature | Notes |
|---|---|
| Multi-currency wallet — display and hold multiple currency balances | User sees each currency separately |
| Auto-detect best payment method per country | Reduce checkout abandonment — show M-Pesa in KE, Paystack in NG, etc. |
| Real-time FX rate display before conversion | Transparency builds trust — show rate + fee before confirm |
| Currency conversion on internal transfer | KES → NGN transfer automatically converts with platform spread |
| FX spread as platform revenue line | Even 0.5–1% spread on high volume is significant |
| Batch vendor settlement — weekly automated payouts by country | Reduces operational overhead vs. manual approvals |
| Business account wallets (separate personal + business balance) | Vendors need business wallet distinct from personal |
| Diaspora → home internal transfer (remittance feature) | Key differentiator — GBP/USD wallet → KES mobile money |
| Country-specific regulatory limits | Automatic enforcement based on user country and KYC tier |
| Cross-border payment history with FX detail | Show original amount, rate applied, converted amount |

#### Recommended Tools & Integrations

| Tool | Role | Why This Tool |
|---|---|---|
| **Flutterwave** | Pan-African collection + disbursement — 33+ countries | Single API covering most of the continent |
| **Paystack** | Nigeria, Ghana, Kenya, Côte d'Ivoire — best developer UX | Highest conversion rates in West Africa |
| **Cellulant** | Multi-rail coverage in East + Southern Africa | Strong where Flutterwave has gaps |
| **Chipper Cash API** | Cross-border P2P and business payments — built for Africa | Zero-fee positioning — strong user trust |
| **Wave API** | Francophone West Africa — Senegal, Côte d'Ivoire, Mali | Dominant XOF market rail |
| **Open Exchange Rates / Fixer.io** | Real-time FX rates for conversion | Affordable, reliable, always-on |
| **Wise Platform API** | Non-African currency conversion and payout (USD, GBP, EUR) | Best FX rates for international disbursements |
| **Redis** | FX rate caching (refresh every 15 min) + idempotency keys | Reduces provider API calls and deduplicates webhooks |

> **Why third:** Pan-African coverage unlocks the full diaspora market. Vendors across the continent can join and get paid. FX spread becomes a meaningful revenue line — 1% on $1M/month in cross-border flow is $10K/month in platform revenue with zero additional product effort.

---

### SCALE 4 — GLOBAL DIASPORA / CROSS-BORDER
> UK, USA, Canada, Europe. International payouts. Full cross-border.

**Goal:** Support diaspora users funding wallets from abroad and freelancers/vendors receiving international payouts.

#### Capabilities
- International card acceptance (Visa, Mastercard, Amex) in USD, GBP, EUR, CAD
- Cross-border wallet funding from diaspora markets
- International bank payouts (SWIFT/SEPA)
- Global creator and freelancer payout layer
- Remittance-style internal transfer (send GBP → family receives KES)
- FX rate lock before conversion

#### Recommended Features

| Feature | Notes |
|---|---|
| International card checkout (USD, GBP, EUR, CAD) | Stripe Payments — already in stack, extend globally |
| Diaspora → home wallet transfer | Convert and send to family member's Winners wallet |
| International bank payout via SWIFT/SEPA | For freelancers and vendors earning across borders |
| FX rate lock — hold rate for 30 minutes before transfer | Reduces FX anxiety — common fintech trust feature |
| Wallet statement for tax and compliance export | Annual PDF — categorized by transaction type |
| Referral bonus on first international top-up | Growth mechanic for diaspora acquisition channel |
| Winners Passport integration → higher transfer limits | Verified identity unlocks $5K+ thresholds |
| Multi-currency checkout — buyer pays in their currency, vendor settles in theirs | FX split at settlement |

#### Recommended Tools & Integrations

| Tool | Role | Why This Tool |
|---|---|---|
| **Stripe Connect** | Platform marketplace payouts + global seller onboarding | Best-in-class for multi-party marketplace disbursement |
| **Wise Platform API** | Cross-border bank disbursements in 80+ currencies | Best FX rates + transparent fee structure |
| **PayPal Payouts API** | Global payout alternative where business policy allows | Widely trusted by international freelancers |
| **Plaid (USA)** | US bank account linking for ACH deposit | For US-based diaspora direct bank funding |
| **TrueLayer (UK/EU)** | Open banking — UK and EU bank-to-bank deposits | Fast, low-cost A2A transfers for UK diaspora |
| **Sift / Sardine** | Cross-border fraud detection and risk scoring | Critical at international scale — IP velocity, device, behavioral |
| **Stripe** (global card) | USD, GBP, EUR, CAD card acceptance | Already in stack — enable additional currencies |

> **Why fourth:** Diaspora remittances to Africa exceeded $100B in 2024. Winners Finance can capture a slice of that by keeping value inside the ecosystem rather than routing through Western Union or Remitly. Every dollar a diaspora user sends to a family member through Winners is a dollar that can be spent on Academy, Market, or Work — compounding the Agentic Loop.

---

### SCALE 5 — TRUST, COMPLIANCE, AND RISK CONTROL
> KYC tiers. AML screening. Audit trails. Dispute management.

**Goal:** Make Winners Finance operationally safe for higher transaction volume and enterprise clients. This stage is **planned from day one** but built incrementally as volume demands it.

#### Capabilities
- KYC tiers tied to withdrawal and transfer limits
- AML transaction pattern monitoring and review queue
- Suspicious activity review workflow for admin
- Payout method verification (penny drop test)
- Dispute and chargeback evidence management
- Immutable audit logs for all finance actions
- PCI-DSS scope reduction — never store raw card data

#### Recommended Features

| Feature | Notes |
|---|---|
| KYC Tier 1 — phone + email verification | Limit: up to $500/month in transfers/withdrawals |
| KYC Tier 2 — government ID + selfie liveness check | Limit: up to $5,000/month |
| KYC Tier 3 — business verification for vendors | Limit: enterprise volume, manual review |
| Winners Passport as Tier 2 accelerator | Verified users skip the document queue |
| AML velocity rule engine — flag unusual patterns | High frequency, round amounts, sudden volume spikes |
| Admin compliance review queue — manual approve/reject | Reviewable case with evidence and transaction context |
| Payout method verification — penny drop before first withdrawal | Confirm account is real and owned by user |
| Dispute workflow — evidence collection, ledger reversal | Never mutate balance directly — always via ledger entry |
| Sanctions screening — check against OFAC, UN, EU lists | Required before onboarding vendors and large payouts |
| Immutable audit log — every finance action with actor + IP + timestamp | Admin-accessible, never deletable |
| Transaction risk score per event | Feed into OMEGA for ecosystem-wide risk awareness |

#### Recommended Tools & Integrations

| Tool | Role | Why This Tool |
|---|---|---|
| **Smile Identity** | KYC/ID verification — Africa-first, 30+ countries | Best African ID coverage — NIN, BVN, passport, national ID |
| **Dojah** | Nigerian identity verification (NIN, BVN, facial) | Required depth for Nigerian compliance specifically |
| **Persona** | Global KYC + AML — used by Robinhood, Brex, Chime | Best-in-class developer experience for compliance flows |
| **Sardine** | Real-time fraud + AML transaction scoring | Designed for fintech platforms — African market support |
| **Flagright** | AML monitoring + compliance reporting | Built for emerging market fintechs — Kenyan and Nigerian focus |
| **Mono / Okra** | Nigerian bank account verification + balance check | Mono for NG, Okra as alternative — open banking layer |
| **Plaid** | US bank account verification | For US diaspora account verification |
| **Sentry** | Finance-service error tracking and critical alerting | Already recommended in Cloud stack |
| **OpenTelemetry** | Distributed tracing across all transaction flows | Already recommended in Cloud stack |
| **Infisical / HashiCorp Vault** | Credential storage for all compliance provider keys | Already recommended in Cloud stack |

> **Why fifth:** You cannot operate a financial product at growing volume without compliance infrastructure. KYC, AML, and dispute handling are not optional — they are the price of being trusted with other people's money. Plan the architecture in Scale 1, implement it in Scale 5 when volumes justify the operational overhead.

---

### SCALE 6 — ADVANCED FINANCE PRODUCTS
> Savings groups. BNPL. Credit signals. Float management.

**Goal:** Layer higher-order financial products on top of the mature, compliant wallet engine.

#### Capabilities
- Group savings / chama pools with contribution tracking
- BNPL installment purchases for ecosystem products
- Recurring automated payouts for creators and freelancers
- Merchant float management dashboard
- Credit profile proxy from verified platform cash flow
- Micro-savings from transaction roundups

#### Recommended Features

| Feature | Notes |
|---|---|
| Group savings (chama) — pool contributions, goal, payout rotation | Community integration — savings groups visible in Community |
| BNPL for ecosystem purchases — buy course/product in 3 instalments | Trust Score-gated. ATLAS assesses affordability |
| Recurring payout schedules for creators | Weekly/monthly auto-payout when threshold reached |
| Micro-savings roundup — round up each transaction, save difference | Opt-in. Small habit with compounding value |
| Merchant float management dashboard | Real-time reserve monitoring, payout scheduling |
| Credit score proxy from verified platform earnings | Based on consistent income + Trust Score + dispute history |
| Savings goal tracker per group | Visual progress ring, time remaining, contributions table |
| Chama rotation schedule management | Agreed rotation, automated disbursement when turn arrives |
| BNPL repayment schedule + reminder notifications | Resend + Socket.io reminder system |
| Platform-facilitated loan (future, partner-dependent) | Portfolio-backed underwriting with regional lending partner |

#### Recommended Tools & Integrations

| Tool | Role | Why This Tool |
|---|---|---|
| **Temporal.io** | Durable recurring payout workflows and chama rotation | Already in Cloud stack — handles complex long-running schedules |
| **BullMQ + Redis** | Savings contribution jobs and BNPL repayment queues | Already recommended in Cloud stack |
| **Recharts** | Savings progress charts, BNPL repayment schedule view | Already in stack |
| **Lenco / Brass** | African business account + banking API for float management | Fintech-friendly African banking infrastructure |
| **Carbon / FairMoney API** | Micro-loan data + credit decisioning (Nigeria) | Regional fintech credit partners with compliance coverage |
| **Stitch (South Africa)** | Open banking + payment initiation — South African market | Required for South African market depth |
| **Regional licensed lending partners** | BNPL and credit underwriting | Licensing-dependent — varies by country |
| **Resend** | BNPL repayment reminders + savings milestone notifications | Already in stack |

> **Critical note:** This stage should only be built after compliance, ledger accuracy, and payout controls from Scales 1–5 are fully mature and audited. Never build credit products before compliance infrastructure is locked. The cost of a failed credit product is not just financial — it is reputational and regulatory.

---

## MINIMUM SECURITY AND COMPLIANCE RULES

These rules apply at **every scale** from day one. Non-negotiable.

- All finance actions require authenticated identity (JWT + tenantId)
- Every record must be scoped to `tenantId` — no cross-tenant data access ever
- Every money movement must create immutable double-entry ledger entries
- Withdrawal flows must support review states, failure reasons, and retry paths
- Provider webhook events must be idempotent — duplicate delivery must be safe
- Suspicious transfer thresholds must trigger admin review queues
- Payout methods must be masked in UI and encrypted at rest (AES-256)
- Audit logs must exist for all admin actions and payout approvals — never deletable
- Refunds and disputes must never directly mutate balance — always via ledger entries
- Never store raw card data — tokenize via payment provider at all times
- PCI-DSS scope must be minimized — offload card data to Stripe or Flutterwave
- All compliance provider API keys stored in Infisical or Vault — never in `.env` at scale

---

## RECOMMENDED BUILD SEQUENCE

### Product Build Order

| Step | Vertical | Why This Order |
|---|---|---|
| 1 | 4A Commerce Hub | Foundation — fix checkout, normalize cart, vendor settlements |
| 2 | 4B Digital Marketing Hub | Service marketplace — agency revenue fast |
| 3 | 4C Winners Stream | Creator monetization — drives Community engagement loop |
| 4 | 4E Business Launcher | AI credits — revenue from day one |
| 5 | 4F CV & Career Tools | Academy → Work connection — Agentic Loop linchpin |
| 6 | 4D Winners Trading | Signals marketplace — high ARPU users |
| 7 | 4H Winners Events | Live revenue from Community audience |
| 8 | 4G Winners Property | High-value, lower transaction frequency |
| 9 | 4I Winners Health | Coaching marketplace — recurring subscription model |
| 10 | 4J Winners Finance | Finance layer on top of proven commerce flows |

### Transaction Build Order

| Step | What to Build |
|---|---|
| 1 | Internal wallet ledger — double-entry schema + logic |
| 2 | Wallet balance + transaction history UI |
| 3 | Internal send/receive transfers (P2P, no provider) |
| 4 | Vendor settlement balances from sales |
| 5 | Manual withdrawal request queue (admin-approved) |
| 6 | Automated payout integrations — Scale 2 rails |
| 7 | Mobile money and bank funding (deposit) |
| 8 | Escrow for Work and service marketplace transactions |
| 9 | Savings groups / chama tools |
| 10 | BNPL and advanced finance layers |

---

## TARGET OUTCOME

At maturity, Winners Market + Winners Finance should function as the **commercial backbone of Winners Ecosystem** — not just a storefront, but a complete African economic operating system.

- Users can **buy, sell, launch, market, stream, learn, and earn**
- Vendors and creators can **collect revenue and withdraw funds** to any rail
- Users can **send money, receive money, and check balance** inside the ecosystem
- Multiple revenue engines reduce platform concentration risk
- Winners Finance becomes the internal settlement rail that powers the entire ecosystem
- Every KES, NGN, GHS earned inside Winners is a reason to stay inside Winners

---

## FILE REFERENCE

| File | Location |
|---|---|
| This document | `docs/WINNERS_MARKET_MASTERPLAN_V2.md` |
| Current Market UI | `src/features/market/WinnersMarketExpanded.tsx` |
| Commerce backend | `Server/routes/productRoutes.ts` · `cartRoutes.ts` · `orderRoutes.ts` · `vendorRoutes.ts` |
| Current schema | `prisma/schema.prisma` |
| Project state | `docs/WINNERS_SOVEREIGN_BUILD_BIBLE_V10.md` |

---

*WINNERS MARKET MASTERPLAN · Version 2.0 · March 9, 2026*
*Winners Market-focused product and implementation spec — 10 verticals, wallet/banking transaction layer, feature and tool recommendations at every scale of the finance rollout.*