# Winners Ecosystem API Reference

This document is the canonical developer reference for the Winners API gateway and the TypeScript SDK.

## Base URL

- Production: `https://winners-empire-eco.up.railway.app/api/v1`
- Local dev: `http://localhost:3001/api/v1`

## Authentication

Most authenticated routes accept:

- `Authorization: Bearer <token>`
- `X-Tenant-ID: <tenant-id>` when the route is tenant-scoped
- `X-SDK-Version: 1.0.0` for SDK requests

Public routes do not require a bearer token unless noted in the route catalog.

## Standard Patterns

- List endpoints usually support `page` and `limit`.
- Many list endpoints also support filters such as `search`, `category`, `status`, `level`, or `tag`.
- Most write endpoints return JSON objects with the created or updated resource.
- Errors follow a shared JSON shape with a human-readable message and machine code where available.

## Gateway Root

`GET /`

Returns:

- gateway name
- current version
- route count
- route prefix catalog

Use this endpoint as a quick health-and-discovery check.

## Route Catalog

### Public and auth entry points

- `/auth` - registration, login, refresh, social auth, invite acceptance
- `/health` - service readiness and health checks
- `/academy` - public course listing and certificate verification flows
- `/chat` - messaging and chat services
- `/messages` - user and assistant messages
- `/ai-platform` - platform AI health, assistants, models, chat, speech, image generation
- `/live-sessions` - live session orchestration
- `/spaces` - live spaces
- `/opportunities` - opportunity discovery
- `/community` - community intelligence layer
- `/external-courses` - external course integrations
- `/social` - connected accounts, publishing, scheduling, social analytics
- `/quizzes` - quizzes and assessments
- `/lecture-uploads` - lecture upload utilities
- `/registry` - app registry and module access
- `/push-tokens` - push token registration and cleanup

### Tenant and workspace services

- `/tenants` - tenant profile, members, billing, lifecycle
- `/users` - tenant users, invites, roles, trust and reputation
- `/analytics` - revenue, forecast, and summary analytics
- `/export` - data export utilities
- `/billing` - subscription and revenue endpoints
- `/ai` - assistant chat, recommendations, memory, logging
- `/profile` - current user profile and preferences
- `/onboarding` - onboarding flow data
- `/email` - email utilities and telemetry
- `/notifications` - in-app notifications
- `/stripe` - subscription sync, checkout, portal, status
- `/search` - search across workspace data
- `/activity` - activity feed and recent history
- `/referral` - referral and invite tracking
- `/admin` - admin console, platform control, tenant/user management, revenue, security, health
- `/changelog` - changelog entries and release history
- `/2fa` - TOTP and email two-factor auth
- `/posts` - post feed and engagement
- `/groups` - groups and communities
- `/gdpr` - privacy export, consent, and deletion
- `/slack` - Slack integration status and tests
- `/sso` - SSO config, exchange, and callbacks
- `/whitelabel` - white-label branding, feature flags, domain, and sub-tenant provisioning

### Market and work layers

- `/vendors` - vendor onboarding and marketplace vendor profiles
- `/dropship` - dropshipping workflows
- `/finance` - fintech and savings flows
- `/products` - product catalog and product management
- `/cart` - shopping cart
- `/checkout` - checkout orchestration
- `/orders` - order lifecycle
- `/work` - jobs, freelancers, applications, contracts, proposals
- `/escrow` - escrow controls for work contracts
- `/circuit` - proposal and recommendation engine
- `/atlas` - research, strategy, pricing, ad copy, product analysis
- `/atlas` via `/ai/atlas` - market-aware Atlas tools
- `/connectors` - external integrations and connectors
- `/plugins` - plugin marketplace and installs
- `/trading` - signals, portfolios, and analyses

### Cloud and platform services

- `/cloud` - cloud developer portal, keys, webhooks, automations, AI agents, usage
- `/studio` - live rooms, streams, events, transcripts, studio workflows
- `/omega` - Omega operations and orchestration
- `/supervisors` - supervisor agents and oversight
- `/community-extras` - extended community utilities
- `/insights` - autonomous insight engine
- `/agentic` - agentic loop controls
- `/credits` - credit consumption and top-up flows

## SDK Surface

The TypeScript SDK ships with typed helpers for the most common flows:

- `health()`
- `registry()`
- `analytics.getOverview()`
- `analytics.trackEvent()`
- `community.getFeed()`
- `community.createPost()`
- `community.toggleLike()`
- `users.list()`
- `users.invite()`
- `billing.getSubscription()`
- `billing.getRevenue()`
- `gdpr.exportMyData()`
- `gdpr.acknowledgePrivacy()`
- `gdpr.deleteAccount()`
- `ai.chat()`
- `ai.streamChat()`
- `ai.getRecommendation()`
- `ai.getMemory()`
- `ai.logInteraction()`
- `academy.listCourses()`
- `academy.getCourse()`
- `academy.enroll()`
- `academy.getEnrollments()`
- `academy.getProgress()`
- `academy.completeLesson()`
- `academy.getCertificates()`
- `academy.verifyCertificate()`
- `market.listProducts()`
- `market.getProduct()`
- `market.getCart()`
- `market.addToCart()`
- `market.updateCartItem()`
- `market.removeFromCart()`
- `market.checkout()`
- `market.getOrder()`
- `market.listOrders()`
- `certificates.verify()`
- `certificates.get()`
- `webhooks.list()`
- `webhooks.create()`
- `webhooks.delete()`
- `webhooks.getDeliveries()`
- `webhooks.verifySignature()`
- `webhooks.parseEvent()`
- `plugins.list()`
- `plugins.get()`
- `plugins.install()`
- `plugins.listInstalled()`
- `plugins.uninstall()`
- `plugins.submit()`
- `plugins.getReviews()`
- `plugins.addReview()`
- `whitelabel.getConfig()`
- `whitelabel.updateBranding()`
- `whitelabel.updateFeatures()`
- `whitelabel.provisionSubtenant()`

For any route not yet wrapped, use the raw SDK escape hatch:

```ts
const { data } = await winners.request("GET", "/tenants/me");
```

## SDK Usage Example

```ts
import { createWinnersClient } from "../sdk/WinnersSDK";

const winners = createWinnersClient({
  baseUrl: "https://winners-empire-eco.up.railway.app",
  token: process.env.WINNERS_API_KEY,
  tenantId: "tenant_123",
});

const { data: overview } = await winners.analytics.getOverview("30d");
const { data: courses } = await winners.academy.listCourses({ level: "beginner" });
const { data: products } = await winners.market.listProducts({ search: "laptop" });
```

## Streaming

Use `ai.streamChat()` or the generic `stream()` helper for chunked responses.

```ts
await winners.stream("POST", "/ai/chat/stream", { message: "Hello" }, (chunk) => {
  process.stdout.write(chunk);
});
```

## Webhook Verification

The SDK includes `webhooks.verifySignature(payload, signature, secret)` to validate HMAC-SHA256 signatures for webhook payloads.

## Cloud OpenAPI

The detailed Cloud API spec lives in:

- [`docs/CLOUD_API_OPENAPI_SPEC.json`](./CLOUD_API_OPENAPI_SPEC.json)

That file documents the cloud-oriented API surface with schemas, tags, and examples.

## Full Gateway OpenAPI

The generated gateway-wide contract lives in:

- [`docs/GATEWAY_OPENAPI_SPEC.json`](./GATEWAY_OPENAPI_SPEC.json)
