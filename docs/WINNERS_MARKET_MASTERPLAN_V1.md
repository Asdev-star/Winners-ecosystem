# 🛒 WINNERS MARKET — COMPLETE PLATFORM SPECIFICATION
### Phase 4 · Winners Ecosystem · March 2026 · Single Source of Truth

> **Supervisor:** ATLAS — Analytical, commercial, data-driven. Knows African market prices.  
> **Layer:** Phase 4 of 8 · Build trigger: Academy ≥ 60%  
> **Status:** 5% — Architecture specified. 4A schema partially built. Pending production implementation.

---

## THE VISION

Winners Market is not a marketplace. It is a **commerce empire** — 10 distinct revenue-generating verticals running under one platform, one identity, one AI supervisor (**ATLAS**), and one payment rail (**Winners Finance**).

Every vertical feeds every other vertical. A user who sells on Commerce Hub gets paid into Winners Finance. A creator who streams on Winners Stream sells merch through Commerce Hub. A freelancer who earns on Work deposits into Winners Finance and invests through Winners Trading.

**Commerce compounds. That is the moat.**

---

## THE 10 VERTICALS — MASTER TABLE

| # | Vertical | Icon | Phase | Priority | Revenue Model | Status |
|---|---|---|---|---|---|---|
| 1 | Commerce Hub | 🛒 | 4A | 🔴 Build First | 10–20% commission + vendor plans | 5% |
| 2 | Digital Marketing Hub | 📣 | 4B | 🔴 High | Package sales 20% + tools $29–99/mo | 0% |
| 3 | Winners Stream | 📺 | 4C | 🔴 High | Subscriptions 15% + PPV + tipping 10% | 0% |
| 4 | Business Launcher | 📋 | 4E | 🔴 High | AI credits + premium templates | 0% |
| 5 | CV & Career Tools | 📄 | 4F | 🔴 High | AI credits + templates + agency tools | 0% |
| 6 | Winners Trading | 📈 | 4D | 🟡 Medium | Signals $49–149/mo + copy trading fee | 0% |
| 7 | Winners Events | 🎟 | 4H | 🟡 Medium | Ticket 5–10% + NFT minting + sponsorship | 0% |
| 8 | Winners Property | 🏠 | 4G | 🟡 Medium | Listing fees + agent subscriptions | 0% |
| 9 | Winners Health | 💪 | 4I | 🟢 Later | Coach cut 20% + wellness subscriptions | 0% |
| 10 | **Winners Finance** | 🏦 | **4J** | 🔴 **Critical** | Payments 1–2% + savings + BNPL + interest | 0% |

> **Winners Finance is elevated from “Later” to Critical.** It is the payment rail every other vertical depends on. Without it, payouts flow through Stripe or other third-party providers alone. With it, the ecosystem becomes its own financial operating layer.

**Build sequence:** `4A → Winners Finance (4J concurrent) → 4B → 4C → 4E → 4F → 4D → 4H → 4G → 4I`

---

## CURRENT REPO ALIGNMENT

This specification is the target state. The current repository only partially implements it.

### Verified currently in code

- **Frontend Market routes exist** in [./src/App.tsx](./src/App.tsx)
  - `/market`
  - `/market/dropshipping`
  - `/market/product/:productId`
  - `/market/vendor`
  - `/market/cart`
  - `/market/orders`
  - `/market/checkout`
  - `/market/:vertical`
- **Expanded 10-vertical Market UI exists** in [./src/features/market/WinnersMarketExpanded.tsx](./src/features/market/WinnersMarketExpanded.tsx)
- **Commerce backend routes exist**
  - [./Server/routes/productRoutes.ts](./Server/routes/productRoutes.ts)
  - [./Server/routes/cartRoutes.ts](./Server/routes/cartRoutes.ts)
  - [./Server/routes/orderRoutes.ts](./Server/routes/orderRoutes.ts)
  - [./Server/routes/vendorRoutes.ts](./Server/routes/vendorRoutes.ts)
- **Commerce Prisma models already exist** in [./prisma/schema.prisma](./prisma/schema.prisma)
  - `Vendor`
  - `Product`
  - `ProductVariant`
  - `ProductImage`
  - `Cart`
  - `CartItem`
  - `Order`
  - `OrderItem`
  - `OrderTracking`
  - `ProductReview`
  - `VendorReview`

### Verified gaps still present

- Only **Commerce Hub** has meaningful backend/schema support today
- The **10 verticals** mostly exist as UI/spec surface, not as fully built products
- `/market` and `/market/:vertical` still use different page strategies
- The current checkout flow still has integration issues
- The current Market AI tool pattern needs backend-owned routing
- **Winners Finance** does not yet exist as a real backend/schema module

---

## PART 1 — COMMERCE HUB (4A)

### What It Is

The core marketplace. Physical products, digital products, and dropshipping — all under one vendor dashboard. ATLAS monitors every sale and surfaces revenue intelligence.

### V1.0 — Core Commerce

#### Prisma Schema

```prisma
model Vendor {
  id              String    @id @default(cuid())
  tenantId        String
  userId          String    @unique
  displayName     String
  description     String?   @db.Text
  logoUrl         String?
  bannerUrl       String?
  status          String    @default("pending") // pending | active | suspended
  plan            String    @default("free")    // free | starter | pro
  planPrice       Float     @default(0)
  commissionRate  Float     @default(0.15)      // platform cut
  stripeAccountId String?                       // Stripe Connect
  winnersWalletId String?                       // Winners Finance wallet
  totalSales      Float     @default(0)
  totalRevenue    Float     @default(0)
  rating          Float     @default(0)
  reviewCount     Int       @default(0)
  products        Product[]
  orders          Order[]
  payouts         VendorPayout[]
  createdAt       DateTime  @default(now())
  @@map("vendors")
}

model Product {
  id           String           @id @default(cuid())
  tenantId     String
  vendorId     String
  vendor       Vendor           @relation(fields:[vendorId], references:[id])
  title        String
  slug         String           @unique
  description  String           @db.Text
  category     String
  tags         String[]
  type         String           @default("physical") // physical | digital | service
  status       String           @default("draft")    // draft | active | archived
  price        Float
  comparePrice Float?
  currency     String           @default("USD")
  thumbnailUrl String?
  images       ProductImage[]
  variants     ProductVariant[]
  inventory    Int              @default(0)
  lowStockAt   Int              @default(5)
  weight       Float?
  dimensions   Json?
  digitalFile  String?          // URL for digital products
  rating       Float            @default(0)
  reviewCount  Int              @default(0)
  totalSold    Int              @default(0)
  cartItems    CartItem[]
  orderItems   OrderItem[]
  reviews      ProductReview[]
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  @@map("products")
}

model ProductVariant {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields:[productId], references:[id])
  name      String   // "Size / Color"
  options   Json     // [{label: "Large", value: "L", priceDelta: 0, stock: 10}]
  sku       String?
  createdAt DateTime @default(now())
  @@map("product_variants")
}

model ProductImage {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields:[productId], references:[id])
  url       String
  alt       String?
  position  Int      @default(0)
  @@map("product_images")
}

model Cart {
  id        String     @id @default(cuid())
  tenantId  String
  userId    String
  items     CartItem[]
  coupon    String?
  discount  Float      @default(0)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  @@unique([tenantId, userId])
  @@map("carts")
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  cart      Cart     @relation(fields:[cartId], references:[id])
  productId String
  product   Product  @relation(fields:[productId], references:[id])
  quantity  Int      @default(1)
  variant   Json?    // selected variant options
  price     Float    // price at time of adding
  createdAt DateTime @default(now())
  @@map("cart_items")
}

model Order {
  id              String        @id @default(cuid())
  tenantId        String
  orderNumber     String        @unique
  buyerId         String
  vendorId        String
  vendor          Vendor        @relation(fields:[vendorId], references:[id])
  items           OrderItem[]
  status          String        @default("pending")
  // pending | confirmed | processing | shipped | delivered | cancelled | refunded
  subtotal        Float
  platformFee     Float
  vendorRevenue   Float
  shippingCost    Float         @default(0)
  discount        Float         @default(0)
  total           Float
  currency        String        @default("USD")
  paymentMethod   String        // stripe | winners_wallet | mpesa | flutterwave
  paymentStatus   String        @default("pending")
  paymentRef      String?
  shippingAddress Json?
  tracking        OrderTracking[]
  refund          OrderRefund?
  notes           String?       @db.Text
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  @@map("orders")
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields:[orderId], references:[id])
  productId String
  product   Product @relation(fields:[productId], references:[id])
  quantity  Int
  price     Float
  variant   Json?
  @@map("order_items")
}

model OrderTracking {
  id        String   @id @default(cuid())
  orderId   String
  order     Order    @relation(fields:[orderId], references:[id])
  status    String
  note      String?
  location  String?
  timestamp DateTime @default(now())
  @@map("order_tracking")
}

model OrderRefund {
  id        String   @id @default(cuid())
  orderId   String   @unique
  order     Order    @relation(fields:[orderId], references:[id])
  amount    Float
  reason    String
  status    String   @default("pending") // pending | approved | processed
  createdAt DateTime @default(now())
  @@map("order_refunds")
}

model ProductReview {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields:[productId], references:[id])
  userId    String
  rating    Int      // 1–5
  title     String?
  body      String?  @db.Text
  verified  Boolean  @default(false) // verified purchase
  createdAt DateTime @default(now())
  @@map("product_reviews")
}

model VendorPayout {
  id             String   @id @default(cuid())
  vendorId       String
  vendor         Vendor   @relation(fields:[vendorId], references:[id])
  amount         Float
  currency       String   @default("USD")
  method         String   // stripe | winners_wallet | mpesa | bank_transfer
  status         String   @default("pending") // pending | processing | paid | failed
  reference      String?
  periodStart    DateTime
  periodEnd      DateTime
  ordersIncluded Int
  createdAt      DateTime @default(now())
  @@map("vendor_payouts")
}
```

#### Backend Routes

```typescript
// Server/routes/productRoutes.ts
GET    /products                  // catalog — filter, sort, search, paginate
GET    /products/:slug            // product detail
POST   /products                  // create (vendor only)
PUT    /products/:id              // update (vendor only)
DELETE /products/:id              // archive (vendor only)
POST   /products/:id/images       // upload images (Cloudinary)
GET    /products/categories       // category list

// Server/routes/cartRoutes.ts
GET    /cart                      // get current user cart
POST   /cart/items                // add item
PUT    /cart/items/:id            // update quantity
DELETE /cart/items/:id            // remove item
DELETE /cart                      // clear cart
POST   /cart/apply-coupon         // apply discount code

// Server/routes/orderRoutes.ts
POST   /orders/checkout           // create order + payment intent
GET    /orders                    // buyer order history
GET    /orders/:id                // order detail + tracking
POST   /orders/:id/cancel         // cancel (if not shipped)
POST   /orders/:id/refund         // request refund
GET    /orders/vendor             // vendor's incoming orders
PUT    /orders/:id/status         // update status (vendor)
POST   /orders/:id/tracking       // add tracking event

// Server/routes/vendorRoutes.ts
POST   /vendors/apply             // vendor application
GET    /vendors/me                // vendor profile
PUT    /vendors/me                // update vendor profile
GET    /vendors/analytics         // revenue, orders, products summary
GET    /vendors/products          // vendor's products
POST   /vendors/payout-request    // request payout
GET    /vendors/payouts           // payout history
```

#### Frontend Pages

```text
src/features/market/
├── MarketPage.tsx              — Product catalog with filters, search, grid
├── ProductPage.tsx             — Product detail, variants, reviews, buy button
├── CartPage.tsx                — Cart review + Stripe / Winners Wallet checkout
├── OrdersPage.tsx              — Buyer order history + tracking
├── OrderDetailPage.tsx         — Full order detail + timeline
├── VendorDashboard.tsx         — Revenue, orders, product management
├── VendorOnboardingPage.tsx    — 3-step vendor signup wizard
└── components/
    ├── ProductCard.tsx         — Grid card with ATLAS score badge
    ├── ProductFilters.tsx      — Category, price, rating, delivery filters
    ├── CartSidebar.tsx         — Slide-in cart drawer
    ├── CheckoutForm.tsx        — Address + payment method selector
    ├── OrderStatusBadge.tsx    — Status pill with color
    ├── VendorCard.tsx          — Vendor profile mini card
    └── ATLASInsightBar.tsx     — ATLAS market intelligence on every page
```

#### Vendor Plans

| Plan | Monthly | Commission | Products | Features |
|---|---|---|---|---|
| Free | $0 | 20% | 5 products | Basic analytics |
| Starter | $15/mo | 15% | 50 products | AI insights, priority support |
| Pro | $49/mo | 10% | Unlimited | ATLAS full access, featured placement, bulk import |

---

### V1.1 — Dropshipping Hub

#### 6 Integrated Suppliers

| Supplier | Type | Delivery | Best For |
|---|---|---|---|
| 🖨️ Printful | Print-on-Demand | 7–14 days | Creator merch, branded stores |
| 🌍 Gelato | Print-on-Demand | 3–7 days | African markets, faster local delivery |
| 🏭 AliExpress + DSers | General Dropship | 10–25 days | High volume, product testing |
| 🚀 Spocket | Premium Dropship | 3–7 days | US/EU premium buyers |
| ⚡ Zendrop | Premium Dropship | 5–12 days | Health/beauty, subscription boxes |
| 🔗 CJ Dropshipping | General + Private Label | 7–20 days | African sellers, custom products |

#### 8 High-Potential Niches (African + Diaspora Markets)

| Niche | Primary Supplier | Avg Margin | ATLAS Score |
|---|---|---|---|
| African Fashion & Print | Gelato + Printful | 45–65% | ⭐⭐⭐⭐⭐ |
| Beauty & Skincare | Zendrop + CJ | 50–70% | ⭐⭐⭐⭐⭐ |
| Creator Merch | Printful | 35–55% | ⭐⭐⭐⭐ |
| Home & Living | AliExpress + Spocket | 40–60% | ⭐⭐⭐⭐ |
| Tech Accessories | CJ + AliExpress | 40–55% | ⭐⭐⭐⭐ |
| Health & Fitness | Zendrop + Spocket | 45–65% | ⭐⭐⭐⭐ |
| Kids & Education | AliExpress + CJ | 35–50% | ⭐⭐⭐ |
| Digital Products | Platform-native | 80–95% | ⭐⭐⭐⭐⭐ |

#### Dropshipping Prisma Schema

```prisma
model DropshippingStore {
  id        String       @id @default(uuid())
  tenantId  String
  vendorId  String
  name      String
  supplier  String       // printful | gelato | aliexpress | spocket | zendrop | cj
  status    String       @default("active") // active | paused
  products  DropProduct[]
  orders    DropOrder[]
  createdAt DateTime     @default(now())
  @@map("dropshipping_stores")
}

model DropProduct {
  id          String   @id @default(cuid())
  storeId     String
  store       DropshippingStore @relation(fields:[storeId], references:[id])
  supplierId  String
  title       String
  cost        Float
  price       Float
  margin      Float
  variants    Json
  images      Json
  autoFulfill Boolean  @default(true)
  createdAt   DateTime @default(now())
  @@map("drop_products")
}

model DropOrder {
  id          String    @id @default(cuid())
  storeId     String
  store       DropshippingStore @relation(fields:[storeId], references:[id])
  orderId     String
  supplierRef String
  status      String    // pending | processing | shipped | delivered
  trackingNum String?
  trackingUrl String?
  fulfilledAt DateTime?
  createdAt   DateTime  @default(now())
  @@map("drop_orders")
}
```

#### 4 ATLAS AI Tools (Claude API Streaming)

```typescript
// All tools use: POST /atlas/analyze with { tool, context }

// 1. Product Research AI
// Input: niche (string)
// Output: top products, supplier fit, margin, trend score

// 2. Store Strategy AI
// Input: niche, budget, target market
// Output: 90-day launch plan — week by week tasks, supplier, pricing, ads

// 3. Supplier Finder
// Input: product description
// Output: ranked supplier list with pros/cons, margin calc, fulfillment time

// 4. Ad Copy Generator
// Input: product name, audience, platform
// Output: Facebook ad, TikTok script, WhatsApp broadcast copy
```

---

## PART 2 — DIGITAL MARKETING HUB (4B)

### What It Is

A marketplace for African marketing agencies and freelancers — plus a DIY ad toolkit for businesses that want to grow themselves.

### Features

```text
V1.0 — Marketplace
- Service listings (social media mgmt, SEO, ads, content, influencer)
- Verified agency badges (Trust Score integrated)
- Package pricing tiers (Basic / Standard / Premium)
- Escrow payment via Winners Finance
- Delivery tracking + revision system
- Reviews + portfolio showcase

V1.1 — DIY Tools (ATLAS-powered)
- AI copywriting assistant (Claude)
- Social media post scheduler + calendar
- Hashtag research + analytics
- Email campaign builder
- Lead capture landing page builder
- Client reporting dashboard (auto-generated PDFs)

V1.2 — Ad Platform Integrations
- Meta Ads campaign builder (Facebook + Instagram)
- TikTok for Business API
- Google Ads integration
- WhatsApp Business broadcast manager
- AfricasTalking SMS campaigns
```

### Revenue Model

| Stream | Rate |
|---|---|
| Service commission | 20% of every transaction |
| Agency Pro subscription | $29–99/month |
| Ad credits markup | 5–10% on ad spend |
| AI copywriting credits | Pay-per-use |

---

## PART 3 — WINNERS STREAM (4C)

### What It Is

A live streaming and video-on-demand platform — YouTube meets Twitch, built for African creators.

### Features

```text
V1.0 — Core Streaming
- Live streaming with real-time chat (LiveKit / Mux)
- Multi-quality streaming: 480p / 720p / 1080p
- Channel pages with subscriber count
- VOD upload + hosting (Cloudinary → Mux at scale)
- Scheduled stream calendar

V1.1 — Monetization
- Channel subscriptions ($3 / $7 / $15 per month)
- Pay-per-view events (custom price per stream)
- Super Chat tipping (10% platform cut)
- Merchandise shelf (Commerce Hub integration)
- Affiliate product links in stream

V1.2 — Creator Tools
- Creator analytics dashboard (views, watch time, revenue, demographics)
- Stream replay + clip generator
- Co-streaming (2 hosts)
- Stream templates + overlays
- NOVA skill detection from stream transcripts → Academy recommendation

V1.3 — AI Layer (ATLAS + SAGE)
- Live stream transcription (faster-whisper, African accent support)
- Auto-generated show notes + timestamps
- AI-powered clip highlights
- Audience Q&A management (AI sorts + surfaces best questions)
```

### Prisma Schema (Key Models)

```prisma
model Channel {
  id              String   @id @default(cuid())
  tenantId        String
  userId          String   @unique
  name            String
  slug            String   @unique
  description     String?  @db.Text
  bannerUrl       String?
  avatarUrl       String?
  category        String
  isLive          Boolean  @default(false)
  subscriberCount Int      @default(0)
  totalViews      Int      @default(0)
  streams         Stream[]
  subscriptions   ChannelSubscription[]
  createdAt       DateTime @default(now())
  @@map("channels")
}

model Stream {
  id            String   @id @default(cuid())
  channelId     String
  channel       Channel  @relation(fields:[channelId], references:[id])
  title         String
  description   String?  @db.Text
  thumbnailUrl  String?
  status        String   @default("scheduled") // scheduled | live | ended
  type          String   @default("free")      // free | ppv | subscribers_only
  ppvPrice      Float?
  viewerCount   Int      @default(0)
  peakViewers   Int      @default(0)
  totalRevenue  Float    @default(0)
  muxStreamId   String?
  muxPlaybackId String?
  recordingUrl  String?
  startedAt     DateTime?
  endedAt       DateTime?
  scheduledAt   DateTime?
  superChats    SuperChat[]
  ppvAccess     PPVAccess[]
  createdAt     DateTime @default(now())
  @@map("streams")
}

model ChannelSubscription {
  id        String   @id @default(cuid())
  channelId String
  channel   Channel  @relation(fields:[channelId], references:[id])
  userId    String
  tier      Int      @default(1) // 1=Basic 2=Standard 3=Premium
  price     Float
  status    String   @default("active")
  expiresAt DateTime
  createdAt DateTime @default(now())
  @@unique([channelId, userId])
  @@map("channel_subscriptions")
}

model SuperChat {
  id        String   @id @default(cuid())
  streamId  String
  stream    Stream   @relation(fields:[streamId], references:[id])
  userId    String
  message   String
  amount    Float
  currency  String   @default("USD")
  createdAt DateTime @default(now())
  @@map("super_chats")
}
```

---

## PART 4 — BUSINESS LAUNCHER (4E)

### What It Is

An AI-powered business toolkit — every tool a founder needs to go from idea to launched in 90 days.

### AI Tools (ATLAS + Claude API Streaming)

| Tool | Input | Output |
|---|---|---|
| 📋 Business Plan Generator | Business idea, market, budget | Investor-ready 8-section document |
| 📣 Marketing Strategy | Business type, target audience | 90-day digital marketing plan |
| 🎯 Pitch Deck Outline | Business summary | 12-slide investor pitch structure |
| 💰 Revenue Model Builder | Business model, pricing | Revenue projection + break-even analysis |
| ⚖️ Legal Template Generator | Business type, country | NDA, co-founder agreement, terms of service |
| 🔍 Market Size Estimator | Niche, geography | TAM / SAM / SOM with Africa-specific data |
| 🏷️ Brand Name Checker | Industry, keywords | 10 brand names + domain availability |
| 💸 Startup Cost Estimator | Business type, scale | Cost breakdown with African market pricing |

### Revenue Model

| Stream | Price |
|---|---|
| AI tool credits | 10–50 credits per tool |
| Business Launcher Pro | $29/month — unlimited tools |
| Premium templates | $5–25 each |
| Expert pitch review | $99 per deck (human + AI review) |

---

## PART 5 — CV & CAREER TOOLS (4F)

### What It Is

An AI-powered career toolkit — every tool a job seeker or professional needs to get hired or get clients.

### AI Tools (ATLAS + Claude API Streaming)

| Tool | Input | Output |
|---|---|---|
| 📄 CV Generator | Work history, skills, job target | ATS-optimized CV (15+ templates) |
| 📝 Cover Letter AI | Job description, CV summary | Tailored cover letter |
| 🔍 ATS Score Checker | CV text + job description | ATS compatibility score + fixes |
| 💼 LinkedIn Optimizer | Current profile, target role | Optimized headline, about, skills |
| 🎤 Interview Coach | Role, CV, common questions | Practice Q&A with feedback |
| 📊 Skill Gap Analyzer | Current skills, target role | Gap analysis + Academy course recommendations |
| 🌐 Portfolio Builder | Work samples, bio, links | One-page portfolio website |
| 📤 Export | CV data | PDF, DOCX, JSON |

### Agency Tools

- White-label CV builder for recruitment agencies
- Bulk CV processing (upload 100 CVs → AI scores + ranks)
- Candidate matching to job board listings
- ATS integration (Workday, Greenhouse, Lever API)

---

## PART 6 — WINNERS TRADING (4D)

### What It Is

A financial intelligence platform for African investors — crypto, forex, stocks, and commodities with AI-powered signals.

### Features

```text
V1.0 — Signals Platform
- Daily trading signals (crypto, forex, commodities, African stocks: NSE, JSE, GSE)
- Signal history + win rate dashboard
- Risk rating per signal (low / medium / high)
- ATLAS signal explanation (why this trade, what to watch)
- Telegram + WhatsApp + email signal delivery

V1.1 — Copy Trading
- Link to broker via API (Deriv, eToro, Binance, Interactive Brokers)
- Auto-copy trades with position sizing rules
- Copy trading leaderboard
- Risk controls (max drawdown, max daily loss, max open trades)

V1.2 — Education Integration
- Trading courses in Academy (SAGE delivers content, ATLAS adds live context)
- Paper trading simulator
- Quiz-gated signal tiers (must pass trading basics before high-risk signals)
```

### Revenue Model

| Tier | Price | What's Included |
|---|---|---|
| Free | $0 | 1 signal/day, 7-day history |
| Analyst | $49/mo | 5 signals/day, all markets, signal explanations |
| Pro Trader | $99/mo | Unlimited signals, copy trading, priority delivery |
| Institutional | $149/mo | API access, custom alerts, portfolio tracking |

---

## PART 7 — WINNERS EVENTS (4H)

### What It Is

A ticketing and event management platform — physical events, virtual events, hybrid. Africa-first ticketing with local payment rails.

### Features

```text
V1.0 — Core Ticketing
- Event creation (title, description, date, venue, capacity, ticket tiers)
- QR code ticket generation
- Ticket sales (Winners Finance + Stripe + Flutterwave + M-Pesa)
- Event discovery (map + category + ATLAS recommendations)
- Organizer dashboard (sales, attendance, revenue)

V1.1 — Advanced
- Seating map builder
- Multiple ticket tiers (Early Bird / General / VIP / Table)
- Discount codes + referral links
- Attendee check-in app (QR scanner)
- Waitlist management
- NFT tickets (optional, via blockchain integration)

V1.2 — Virtual Events
- Winners Stream integration (PPV stream = event ticket)
- Hybrid event management
- Virtual networking rooms
- Speaker profiles + agenda builder
- Sponsor package management
```

---

## PART 8 — WINNERS PROPERTY (4G)

### What It Is

A real estate listing platform for Africa — buy, rent, invest. ATLAS knows African property market prices.

### Features

```text
V1.0 — Listings
- Property listings (sale, rent, short-stay, commercial)
- Photo + virtual tour upload (Cloudinary)
- Map search (Mapbox — area, radius, polygon)
- ATLAS price intelligence (estimated fair price by area)
- Agent profiles + verified badge (Trust Score integrated)
- Lead capture + viewing request form

V1.1 — Transactions
- Deposit via Winners Finance (escrow for rental deposits)
- Document signing (NDA, tenancy agreement via DocuSign API)
- Mortgage calculator (Africa-localized rates)
- Investment property ROI estimator

V1.2 — Short-Stay (Airbnb alternative)
- Calendar availability
- Booking management
- Guest messaging
- Review system
```

---

## PART 9 — WINNERS HEALTH (4I)

### What It Is

A wellness marketplace and health coaching platform for the African diaspora — mental health, fitness, nutrition, and holistic wellness.

### Features

```text
V1.0 — Coach Marketplace
- Health coach profiles (specialty, certifications, reviews)
- Booking system (1-on-1 sessions via video)
- Package pricing (single session, monthly plans)
- Secure payment via Winners Finance (escrow)

V1.1 — Content
- Wellness courses in Academy (SAGE delivers, ATLAS surfaces)
- Meal plans + recipe library
- Workout programs
- Guided meditation + breathwork library

V1.2 — AI Wellness
- ATLAS health tracker (mood, sleep, nutrition, movement — user logs)
- Personalised wellness recommendations
- Mental health check-in (weekly AI review + human coach escalation)
- Community wellness challenges (Community integration)
```

---

## PART 10 — WINNERS FINANCE (4J) — THE APPLICATION BANK

> **This is not a "later" feature. Winners Finance is the payment rail the entire ecosystem depends on.**  
> **Build it concurrent with 4A. Every vertical pays out through it.**

### The Vision

Winners Finance is a **full-featured digital financial services layer** — a non-bank financial institution (NBFI) built into the Winners Ecosystem. Every user has a Winners Wallet from day one. Vendors receive payouts to it. Freelancers earn into it. Creators tip into it. Traders fund from it. And users can send money to anyone inside — or outside — the ecosystem.

Think **Revolut meets M-Pesa meets PayPal** — but built natively into a platform that African creators use daily.

---

### WINNERS WALLET — CORE FEATURES

Every Winners user gets a Winners Wallet on signup (opt-in with KYC for transfers).

#### Wallet Capabilities

| Feature | Description | Status |
|---|---|---|
| Deposit | Load wallet via card, bank transfer, mobile money | V1.0 |
| Withdraw | Cash out to bank, M-Pesa, MTN MoMo, Airtel Money | V1.0 |
| Send Money | Send to any Winners user by username or phone | V1.0 |
| Receive Money | Accept payments from anyone inside the ecosystem | V1.0 |
| Pay for Services | Use balance for any purchase on the platform | V1.0 |
| Escrow | Hold funds securely for contracts and orders | V1.0 |
| Currency | Multi-currency (USD, KES, NGN, GHS, ZAR, GBP, EUR) | V1.0 |
| Exchange | In-app currency conversion at live rates | V1.1 |
| Savings Vault | Lock funds for a target goal + earn interest | V1.1 |
| Investment | Auto-invest spare change into ETFs or money market | V1.2 |
| BNPL | Buy Now Pay Later for platform purchases | V1.2 |
| Business Account | Separate business wallet with team access | V1.2 |
| Virtual Card | Spend wallet balance anywhere Visa is accepted | V2.0 |
| Physical Card | Premium debit card (Platinum tier) | V2.0 |

---

### SEND & RECEIVE MONEY — THE APPLICATION BANK LAYER

This is the feature that makes Winners Finance a true application bank.

#### Send Money Flow

```text
User selects SEND
  → Enter recipient (Winners username / phone number / email)
  → System resolves recipient → shows name + avatar for confirmation
  → Enter amount + currency
  → Add note (optional)
  → Select source: Winners Wallet | Linked Card | M-Pesa
  → Enter PIN / biometric confirmation
  → Transaction processes
  → Sender receives debit notification
  → Recipient receives credit notification (push + in-app)
  → Both see transaction in history
```

#### Receive Money Flow

```text
User goes to RECEIVE
  → Generates QR code (encoded: userId + wallet address)
  → Share QR or copy payment link
  → Or: share Winners username (like a @handle for money)
  → Sender scans or clicks link → prefilled send form
  → Same confirmation flow as above
```

#### Payment Link System

```typescript
// Every user has a permanent payment link
https://winnersempire.io/pay/@username

// Optional: pre-filled amount + note
https://winnersempire.io/pay/@username?amount=50&currency=USD&note=Freelance+work

// QR code encodes the same URL
// Can be printed, embedded in email, shared on social
```

---

### COMPLETE PRISMA SCHEMA — WINNERS FINANCE

```prisma
model WinnersWallet {
  id            String          @id @default(cuid())
  userId        String          @unique
  tenantId      String
  walletNumber  String          @unique // WW-xxxxxxxx
  type          String          @default("personal") // personal | business | escrow
  status        String          @default("active")   // active | frozen | closed
  kycLevel      Int             @default(0)
  pin           String          // bcrypt-hashed 6-digit PIN
  balances      WalletBalance[]
  transactions  Transaction[]   @relation("WalletTransactions")
  fromTransfers Transaction[]   @relation("SenderTransactions")
  toTransfers   Transaction[]   @relation("RecipientTransactions")
  escrows       EscrowAccount[]
  savingsVaults SavingsVault[]
  linkedMethods PaymentMethod[]
  paymentLinks  PaymentLink[]
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  @@map("winners_wallets")
}

model WalletBalance {
  id        String        @id @default(cuid())
  walletId  String
  wallet    WinnersWallet @relation(fields:[walletId], references:[id])
  currency  String
  available Float         @default(0)
  pending   Float         @default(0)
  reserved  Float         @default(0)
  updatedAt DateTime      @updatedAt
  @@unique([walletId, currency])
  @@map("wallet_balances")
}

model Transaction {
  id              String         @id @default(cuid())
  tenantId        String
  reference       String         @unique // TXN-xxxxxxxx-yyyy
  type            String
  status          String         @default("pending")
  walletId        String
  wallet          WinnersWallet  @relation("WalletTransactions", fields:[walletId], references:[id])
  senderId        String?
  senderWallet    WinnersWallet? @relation("SenderTransactions", fields:[senderId], references:[id])
  recipientId     String?
  recipientWallet WinnersWallet? @relation("RecipientTransactions", fields:[recipientId], references:[id])
  amount          Float
  fee             Float          @default(0)
  netAmount       Float
  currency        String
  baseCurrency    String         @default("USD")
  exchangeRate    Float          @default(1)
  description     String?
  note            String?
  metadata        Json?
  paymentMethod   String?
  externalRef     String?
  ipAddress       String?
  deviceId        String?
  flagged         Boolean        @default(false)
  flagReason      String?
  reversedAt      DateTime?
  settledAt       DateTime?
  createdAt       DateTime       @default(now())
  @@map("transactions")
}

model PaymentMethod {
  id         String        @id @default(cuid())
  walletId   String
  wallet     WinnersWallet @relation(fields:[walletId], references:[id])
  type       String        // card | bank_account | mobile_money | crypto
  provider   String        // stripe | flutterwave | mpesa | mtn | airtel | paystack
  label      String
  isDefault  Boolean       @default(false)
  isVerified Boolean       @default(false)
  externalId String
  metadata   Json
  expiresAt  DateTime?
  createdAt  DateTime      @default(now())
  @@map("payment_methods")
}

model PaymentLink {
  id          String        @id @default(cuid())
  walletId    String
  wallet      WinnersWallet @relation(fields:[walletId], references:[id])
  slug        String        @unique // @username
  amount      Float?
  currency    String?
  description String?
  note        String?
  isActive    Boolean       @default(true)
  expiresAt   DateTime?
  maxUses     Int?
  useCount    Int           @default(0)
  payments    PaymentLinkUsage[]
  createdAt   DateTime      @default(now())
  @@map("payment_links")
}

model PaymentLinkUsage {
  id            String      @id @default(cuid())
  paymentLinkId String
  paymentLink   PaymentLink @relation(fields:[paymentLinkId], references:[id])
  transactionId String
  payerId       String
  amount        Float
  currency      String
  createdAt     DateTime    @default(now())
  @@map("payment_link_usage")
}

model EscrowAccount {
  id            String        @id @default(cuid())
  walletId      String
  wallet        WinnersWallet @relation(fields:[walletId], references:[id])
  referenceType String        // order | contract | event_ticket | property_deposit
  referenceId   String
  amount        Float
  currency      String
  status        String        @default("holding")
  conditions    Json
  releaseAt     DateTime?
  releasedAt    DateTime?
  disputedAt    DateTime?
  dispute       EscrowDispute?
  createdAt     DateTime      @default(now())
  @@map("escrow_accounts")
}

model EscrowDispute {
  id         String        @id @default(cuid())
  escrowId   String        @unique
  escrow     EscrowAccount @relation(fields:[escrowId], references:[id])
  raisedBy   String
  reason     String        @db.Text
  evidence   Json?
  status     String        @default("open")
  resolution String?       @db.Text
  resolvedAt DateTime?
  createdAt  DateTime      @default(now())
  @@map("escrow_disputes")
}

model SavingsVault {
  id                String              @id @default(cuid())
  walletId          String
  wallet            WinnersWallet       @relation(fields:[walletId], references:[id])
  name              String
  emoji             String?             @default("💰")
  targetAmount      Float?
  targetDate        DateTime?
  balance           Float               @default(0)
  currency          String              @default("USD")
  interestRate      Float               @default(0.05)
  autoSave          Boolean             @default(false)
  autoSaveAmount    Float?
  autoSaveFrequency String?
  status            String              @default("active")
  transactions      SavingsTransaction[]
  createdAt         DateTime            @default(now())
  @@map("savings_vaults")
}

model SavingsTransaction {
  id        String       @id @default(cuid())
  vaultId   String
  vault     SavingsVault @relation(fields:[vaultId], references:[id])
  type      String       // deposit | withdrawal | interest
  amount    Float
  balance   Float
  note      String?
  createdAt DateTime     @default(now())
  @@map("savings_transactions")
}

model ExchangeRate {
  id           String   @id @default(cuid())
  fromCurrency String
  toCurrency   String
  rate         Float
  spread       Float    @default(0.02)
  source       String
  updatedAt    DateTime @updatedAt
  @@unique([fromCurrency, toCurrency])
  @@map("exchange_rates")
}

model CurrencyConversion {
  id            String   @id @default(cuid())
  walletId      String
  fromCurrency  String
  toCurrency    String
  fromAmount    Float
  toAmount      Float
  rate          Float
  fee           Float
  transactionId String
  createdAt     DateTime @default(now())
  @@map("currency_conversions")
}

model KYCVerification {
  id              String   @id @default(cuid())
  walletId        String   @unique
  userId          String
  level           Int      @default(0)
  status          String   @default("pending")
  phoneNumber     String?
  phoneVerifiedAt DateTime?
  idType          String?
  idNumber        String?
  idFrontUrl      String?
  idBackUrl       String?
  selfieUrl       String?
  address         Json?
  dateOfBirth     DateTime?
  nationality     String?
  provider        String?
  externalRef     String?
  rejectionReason String?
  approvedAt      DateTime?
  expiresAt       DateTime?
  createdAt       DateTime @default(now())
  @@map("kyc_verifications")
}

model SpendLimit {
  id              String   @id @default(cuid())
  walletId        String   @unique
  dailySend       Float    @default(500)
  monthlySend     Float    @default(5000)
  dailyWithdraw   Float    @default(500)
  monthlyWithdraw Float    @default(5000)
  singleTxMax     Float    @default(1000)
  updatedAt       DateTime @updatedAt
  @@map("spend_limits")
}

model Statement {
  id           String   @id @default(cuid())
  walletId     String
  period       String
  openBalance  Float
  closeBalance Float
  totalIn      Float
  totalOut     Float
  totalFees    Float
  txCount      Int
  pdfUrl       String?
  generatedAt  DateTime @default(now())
  @@unique([walletId, period])
  @@map("statements")
}

model BNPLLoan {
  id                String        @id @default(cuid())
  walletId          String
  orderId           String
  amount            Float
  currency          String
  installments      Int
  installmentAmount Float
  interestRate      Float
  totalRepayable    Float
  status            String        @default("active")
  payments          BNPLPayment[]
  nextPaymentAt     DateTime
  createdAt         DateTime      @default(now())
  @@map("bnpl_loans")
}

model BNPLPayment {
  id            String    @id @default(cuid())
  loanId        String
  loan          BNPLLoan  @relation(fields:[loanId], references:[id])
  installment   Int
  amount        Float
  dueAt         DateTime
  paidAt        DateTime?
  status        String    @default("pending")
  transactionId String?
  createdAt     DateTime  @default(now())
  @@map("bnpl_payments")
}
```

---

### BACKEND ROUTES — WINNERS FINANCE

```typescript
// Server/routes/financeRoutes.ts

GET    /finance/wallet
POST   /finance/wallet/activate
GET    /finance/wallet/stats
GET    /finance/wallet/statement

POST   /finance/send
GET    /finance/resolve/:identifier
POST   /finance/request
GET    /finance/receive/qr
GET    /finance/receive/link

POST   /finance/deposit/card
POST   /finance/deposit/mobile
POST   /finance/deposit/bank
POST   /finance/withdraw/mobile
POST   /finance/withdraw/bank
POST   /finance/withdraw/card

GET    /finance/transactions
GET    /finance/transactions/:id
POST   /finance/transactions/:id/dispute

POST   /finance/escrow/create
POST   /finance/escrow/:id/release
POST   /finance/escrow/:id/dispute
GET    /finance/escrow/:id

POST   /finance/savings
GET    /finance/savings
PUT    /finance/savings/:id
POST   /finance/savings/:id/deposit
POST   /finance/savings/:id/withdraw

GET    /finance/rates
POST   /finance/convert

GET    /finance/payment-link
POST   /finance/payment-link/custom
POST   /pay/:slug

GET    /finance/methods
POST   /finance/methods/card
POST   /finance/methods/mobile
DELETE /finance/methods/:id

GET    /finance/kyc
POST   /finance/kyc/phone
POST   /finance/kyc/id
POST   /finance/kyc/selfie

GET    /finance/bnpl/eligibility
POST   /finance/bnpl/apply
GET    /finance/bnpl
POST   /finance/bnpl/:id/pay

GET    /finance/admin/wallets
POST   /finance/admin/freeze/:walletId
POST   /finance/admin/release/:walletId
GET    /finance/admin/transactions
GET    /finance/admin/kyc-queue
POST   /finance/admin/kyc/:id/approve
POST   /finance/admin/kyc/:id/reject
```

---

### FRONTEND PAGES — WINNERS FINANCE

```text
src/features/finance/
├── FinanceDashboard.tsx        — Wallet balance, recent txns, quick actions
├── SendMoneyPage.tsx           — Send flow: recipient → amount → confirm → done
├── ReceivePage.tsx             — QR code + payment link + share buttons
├── DepositPage.tsx             — Load wallet: card / mobile money / bank
├── WithdrawPage.tsx            — Cash out: mobile / bank / card
├── TransactionHistory.tsx      — Full tx list with filters + search + export
├── TransactionDetail.tsx       — Single tx detail + status timeline
├── EscrowPage.tsx              — View + manage escrow accounts
├── SavingsPage.tsx             — Savings vaults list + create
├── SavingsVaultDetail.tsx      — Vault detail + deposit/withdraw
├── ExchangePage.tsx            — Currency conversion tool
├── PaymentLinkPage.tsx         — My payment link + QR + share
├── PayPage.tsx                 — Public pay via link (unauthenticated-friendly)
├── KYCPage.tsx                 — 3-step KYC verification wizard
├── BNPLPage.tsx                — BNPL loans + payment schedule
├── PaymentMethodsPage.tsx      — Linked cards + mobile money management
└── components/
    ├── WalletCard.tsx          — Balance display with currency switcher
    ├── QuickActions.tsx        — Send / Receive / Deposit / Withdraw buttons
    ├── TransactionItem.tsx     — Single tx row with icon + status
    ├── RecipientSearch.tsx     — Username/phone resolver with avatar preview
    ├── PINPad.tsx              — 6-digit PIN entry component
    ├── QRCodeDisplay.tsx       — QR with copy link + share sheet
    ├── SavingsVaultCard.tsx    — Progress bar + target display
    ├── KYCBanner.tsx           — Tier + prompt to upgrade on every page
    └── ATLASSpendInsight.tsx   — "You spent 40% more this week" AI card
```

---

### KYC TIERS & TRANSACTION LIMITS

| KYC Level | Verification Required | Daily Send | Monthly Send | Daily Withdraw |
|---|---|---|---|---|
| 0 — None | Just email | $0 (receive only) | — | $0 |
| 1 — Basic | Phone number verified | $200 | $1,000 | $200 |
| 2 — Standard | Government ID | $1,000 | $10,000 | $1,000 |
| 3 — Enhanced | ID + selfie + address | $5,000 | $50,000 | $5,000 |
| 4 — Business | Business registration | $50,000 | $500,000 | $50,000 |

---

### SUPPORTED PAYMENT RAILS

| Rail | Region | Use Case |
|---|---|---|
| Stripe | Global | Card payments, payouts, BNPL |
| Flutterwave | Africa | M-Pesa, MTN MoMo, Airtel, bank transfers, cards |
| Paystack | Nigeria, Ghana, South Africa | Card + bank + USSD |
| M-Pesa (Daraja API) | Kenya, Tanzania, Uganda | Mobile money direct |
| MTN MoMo API | Ghana, Cameroon, Rwanda, Ivory Coast | Mobile money direct |
| Chipper Cash | Pan-Africa | P2P transfers |
| Wise API | Global | International bank transfers |
| Binance Pay | Global | Crypto-to-fiat (optional V2.0) |

---

### ATLAS FINANCIAL INTELLIGENCE

ATLAS provides real-time financial intelligence across the Finance layer:

```typescript
// Cards shown on FinanceDashboard and transaction views:

// 1. Spend Pattern Analysis
"You spent $340 on services this month — 22% more than last month.
 Your largest category: Freelance (Work marketplace)."

// 2. Savings Recommendations
"Based on your income pattern, saving $50/week would hit your
 'Business Capital' goal 3 months earlier."

// 3. Currency Alerts
"NGN has weakened 4% vs USD this week. Your KES balance
 is worth $12 more than last Friday — good time to convert."

// 4. Escrow Watch
"Your escrow for Order #4421 releases in 2 days.
 Confirm delivery to release $85 to the vendor."

// 5. Income Trend
"Your Winners earnings increased 34% this month.
 Community tips: $12 · Academy sales: $240 · Work contracts: $580."
```

---

### REVENUE MODEL — WINNERS FINANCE

| Stream | Rate | Notes |
|---|---|---|
| Deposit fee (card) | 2.9% + $0.30 | Stripe pass-through |
| Deposit fee (mobile money) | 1.5% | Flutterwave pass-through |
| Withdrawal fee (mobile) | 1.0% | Platform margin |
| Withdrawal fee (bank) | $1 flat | Below $500 / free above |
| P2P send fee | 0% internal | Zero-fee within ecosystem |
| P2P send fee | 1.5% external | Outside ecosystem |
| Currency conversion spread | 1.5–2.5% | On top of mid-market rate |
| Savings interest (float) | ~3–4% APY | Held in money market / USDC |
| Savings yield to user | 5% APY | Spread = platform income |
| BNPL interest | 0% (3-month) / 8–15% (6–12 month) | Consumer-friendly |
| BNPL late fee | $2–5 flat | Per missed installment |
| Business account | $9/month | Team access + higher limits |
| Virtual card | $0 (Pro users) / $5/mo (Free) | Issuance via Stripe Issuing |
| Physical card | $15 one-time | Platinum tier only |
| Escrow fee | 1.5% of escrow amount | Held until release |

**Projected Revenue at Scale:**

| Users | Avg Wallet Balance | Monthly Tx Volume | Finance Revenue |
|---|---|---|---|
| 10,000 | $150 | $500K | ~$12K/month |
| 100,000 | $200 | $8M | ~$180K/month |
| 1,000,000 | $300 | $120M | ~$2.5M/month |

---

### SECURITY ARCHITECTURE

```text
Layer 1 — Authentication
  - All finance endpoints require valid JWT
  - All write operations require PIN verification (6-digit, bcrypt)
  - Biometric option available (WebAuthn on supported devices)

Layer 2 — Rate Limiting
  - Send money: max 10 transactions per hour
  - Failed PIN: lock after 5 attempts, 15-minute cooldown
  - Unusual activity: flag + require re-auth

Layer 3 — Fraud Detection (ATLAS)
  - Flag transactions > 3x user's average send amount
  - Flag transactions to new recipients > $200
  - Flag multiple transactions in short window
  - All flagged tx pause for 24h unless user confirms via email

Layer 4 — Compliance
  - Transaction records retained 7 years
  - AML checks via Stripe / Flutterwave compliance layer
  - KYC required for all sends above $200/day
  - OFAC / sanctions screening on every external payout

Layer 5 — Encryption
  - All PINs bcrypt-hashed (never stored plain)
  - External credentials AES-256 encrypted at rest
  - All API calls HTTPS-only
  - Database field encryption for KYC documents
  - Payment method tokens stored at providers, not on our servers
```

---

### NOTIFICATIONS — WINNERS FINANCE

Every transaction triggers real-time notifications across all channels:

```typescript
// Push + In-App + Email

"💸 Sent $50.00 to @john_builds · Balance: $342.10"
"💰 Received $50.00 from @jane_creates · 'For the logo work'"
"✅ $200.00 added to your Winners Wallet · via M-Pesa"
"🏧 $150.00 sent to your M-Pesa · Arrives within 24h"
"🔓 $85.00 escrow released · Order #4421 complete"
"📈 +$2.34 interest credited to 'Business Capital' vault"
"⚠️ Winners Wallet balance: $8.50 · Top up to continue spending"
"🚨 Unusual transaction paused · Confirm in app within 24h"
```

---

## PART 11 — ATLAS — THE MARKET SUPERVISOR

ATLAS sits across all 10 verticals and provides real-time market intelligence.

### What ATLAS Does

| Function | Description |
|---|---|
| Price Intelligence | Compares product prices against African market averages |
| Trend Detection | Surfaces rising niches and falling products before vendors notice |
| Vendor Coaching | Tells vendors what to stock, what to drop, when to run a sale |
| Buyer Recommendations | Personalised recommendations from purchase + browsing history |
| Fraud Signals | Flags unusual order patterns, suspicious reviews, bulk buys |
| Finance Insights | Spend analysis, savings recommendations, currency alerts |
| Competitor Analysis | How a vendor compares to others in the same category |
| OMEGA Handoff | Sends loop-advance events to OMEGA when commerce milestones hit |

### ATLAS Endpoints

```typescript
// Server/routes/atlasRoutes.ts
POST   /atlas/chat
POST   /atlas/analyze/product
POST   /atlas/analyze/store
POST   /atlas/research
POST   /atlas/ad-copy
POST   /atlas/supplier-match
GET    /atlas/trends
GET    /atlas/insights/:vendorId
```

---

## PART 12 — BUILD ORDER & MILESTONES

### Sprint 1 (Weeks 1–2) — Foundation
- [ ] Commerce Hub Prisma migration — all 4A models
- [ ] Winners Finance Prisma migration — Wallet, Balance, Transaction, KYC, SpendLimit
- [ ] `productRoutes.ts` — CRUD + search + filter
- [ ] `financeRoutes.ts` — wallet + send + receive + deposit
- [ ] `MarketPage.tsx` — product grid with filters
- [ ] `FinanceDashboard.tsx` — balance + recent transactions + quick actions
- [ ] `SendMoneyPage.tsx` — full send flow with PIN confirmation
- [ ] `ReceivePage.tsx` — QR code + payment link
- [ ] KYC Level 1 — phone verification flow

### Sprint 2 (Weeks 3–4) — Commerce Core
- [ ] `VendorOnboardingPage.tsx` — 3-step vendor signup
- [ ] `VendorDashboard.tsx` — analytics + product management
- [ ] `ProductPage.tsx` — detail + variants + reviews
- [ ] `CartPage.tsx` + `CartSidebar.tsx`
- [ ] `orderRoutes.ts` — checkout + status + history
- [ ] Stripe integration for card checkout
- [ ] Flutterwave integration for M-Pesa checkout
- [ ] Winners Wallet as checkout payment method
- [ ] Vendor payout — auto-transfer to Winners Wallet on order completion

### Sprint 3 (Month 2) — Finance Layer 2
- [ ] KYC Level 2 — ID document upload + Smile Identity check
- [ ] Withdrawal to M-Pesa + bank
- [ ] Savings Vaults — create + deposit + auto-save
- [ ] Currency conversion (live rates via OpenExchangeRates)
- [ ] Escrow system — wired to Commerce orders + Work contracts
- [ ] Statement generation (monthly PDF export)

### Sprint 4 (Month 2–3) — Dropshipping
- [ ] DropshippingStore + DropProduct + DropOrder schema
- [ ] Printful API integration — product import + auto-fulfillment
- [ ] Gelato API integration
- [ ] `dropshippingRoutes.ts`
- [ ] `WinnersDropshipping.tsx` production conversion from `.jsx`
- [ ] ATLAS dropshipping AI tools (4 tools wired to Claude API)

### Sprint 5 (Month 3) — BNPL + Advanced Finance
- [ ] BNPL eligibility engine (based on transaction history + KYC level)
- [ ] BNPL loan creation on order checkout
- [ ] BNPL payment schedule + auto-debit
- [ ] Virtual card issuance (Stripe Issuing)
- [ ] Business wallet (separate from personal)

### Sprint 6 (Month 3–4) — Digital Marketing Hub (4B)
- [ ] Service listing schema + routes
- [ ] `MarketingHubPage.tsx`
- [ ] Escrow for service delivery
- [ ] AI copywriting tools (Claude API)

---

## PART 13 — ENVIRONMENT VARIABLES REQUIRED

```env
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_CLIENT_ID=
STRIPE_ISSUING_ENABLED=true

FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_WEBHOOK_SECRET=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
MTN_MOMO_API_KEY=
MTN_MOMO_SUBSCRIPTION_KEY=
MTN_MOMO_ENVIRONMENT=sandbox

SMILE_IDENTITY_PARTNER_ID=
SMILE_IDENTITY_API_KEY=
SMILE_IDENTITY_CALLBACK_URL=

OPENEXCHANGERATES_APP_ID=
WISE_API_KEY=

PRINTFUL_API_KEY=
GELATO_API_KEY=
ALIEXPRESS_APP_KEY=
ALIEXPRESS_APP_SECRET=
SPOCKET_API_KEY=
CJ_DROPSHIPPING_EMAIL=
CJ_DROPSHIPPING_PASSWORD=

MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=

MAPBOX_API_KEY=

TRADINGVIEW_API_KEY=
BINANCE_API_KEY=
ALPHA_VANTAGE_KEY=

ANTHROPIC_API_KEY=
```

---

## PART 14 — CROSS-LAYER CONNECTIONS

Winners Market does not operate in isolation. Every vertical feeds the loop.

| Market Event | Triggers |
|---|---|
| User makes first sale | NOVA posts to Community feed · OMEGA advances loop |
| Order delivered | Escrow releases to Winners Wallet · ATLAS updates vendor revenue |
| Vendor hits $1K revenue | ATLAS sends growth recommendation |
| User completes Business Launcher | ATLAS suggests opening Commerce Hub store |
| User earns from CV tools | CIRCUIT suggests freelancer profile upgrade |
| Stream hits 100 viewers | NOVA surfaces stream in Community · ATLAS suggests merchandise |
| Property listed | ATLAS estimates fair value + suggests Marketing Hub promotion |
| Savings vault reaches target | ATLAS suggests investment or reinvestment |
| BNPL loan repaid | KYC spend limit increases · ATLAS reports improved credit profile |
| Winners Finance wallet crosses $500 | ATLAS suggests Winners Trading signals subscription |

---

## IMMEDIATE REPO IMPLEMENTATION PRIORITIES

1. **Fix Market checkout integration**
   - current checkout flow still needs corrected vendor handling
2. **Normalize cart identity flow**
   - frontend and backend headers/session/user model should align
3. **Move Market AI calls behind backend routes**
   - avoid direct browser-owned provider patterns
4. **Unify Market page architecture**
   - `/market` and `/market/:vertical` should not feel like two separate systems
5. **Implement Winners Finance on top of a ledger**
   - all money movement must be auditable and reversible through entries
6. **Apply strict tenant scoping and immutable transaction records**
   - every finance action must be tenant-bound and traceable

---

> *"A marketplace is where people come to buy.*  
> *A commerce empire is where people come to build wealth.*  
> *Winners Market is a commerce empire."*

---

**WINNERS MARKET — COMPLETE SPECIFICATION**  
`Phase 4 · Winners Ecosystem · March 2026`  
`Supervisor: ATLAS · Payment Rail: Winners Finance · AI: claude-sonnet-4-6`