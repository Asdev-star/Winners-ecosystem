# WINNERS ECOSYSTEM - IMPLEMENTATION TODO

From PROJECT_STATE_CURRENT.md V10.0 Critical Pending Actions (Prioritized)

## Priority 1 - Security Fix (Immediate)

- [ ] Verify/fix tenantId scoping on postRoutes.ts update/delete

## Priority 2 - Wire Intelligence Routes (1 day)

- [ ] Add /intelligence & /intelligence/aria routes to src/App.tsx
- [ ] Add Intelligence nav item to src/components/layout/MainLayout.tsx
- [ ] Confirm chatRoutes.ts mounted in Server/index.ts

## Priority 3 - Phase 4A Market Commerce Hub (1-2 weeks)

- [ ] Complete Stripe checkout flow across CheckoutPage.tsx, checkoutRoutes.ts, stripeRoutes.ts, and stripeService.ts
- [ ] Create order confirmation experience plus transactional email notifications via orderRoutes.ts and emailService.ts
- [ ] Finalize inventory updates on purchase and order status transitions
- [x] Build vendor payout tracking system using Vendor, VendorPayout, and VendorDashboard surfaces
- [ ] Implement product reviews UI and submission flow for ProductPage.tsx / OrdersPage.tsx
- [ ] Complete dropshipping hub and live supplier sync coverage for 6 suppliers

## Priority 4 - Phase 5b Work Escrow Platform (2 weeks)

- [ ] Complete job listing CRUD API routes in workRoutes.ts
- [ ] Create job board UI with filters in WorkPage.tsx
- [ ] Finish freelancer profile system across profile routes, Prisma models, and FreelancerProfilePage.tsx
- [ ] Implement contract management system for offers, milestones, signatures, and status tracking
- [ ] Build escrow payment integration across escrowRoutes.ts with Stripe + Flutterwave
- [ ] Create work review and rating system for clients and freelancers
- [ ] Finalize job application workflow and CIRCUIT AI matching

## Phase 6 - Expand Work Layer

- [x] Add smart intelligence recommendations for applying, hiring, service offers, and trust checks
- [x] Add service workspace for users who want to offer services or get services
- [x] Add global platform integration recommendations for job finding, hiring talent, offering services, and getting services

## Priority 5 - Complete NOVA AI Integration (1 week)

- [ ] Wire NOVA to CommunityPage.tsx via AssistantPanel
- [ ] Skill detection from posts -> OMEGA trigger

## Priority 6 - Complete SAGE AI Integration (1 week)

- [ ] Wire SAGE to CoursePage.tsx
- [ ] PDF analysis upload

## Priority 7 - Build OMEGA Dashboard (2 weeks)

- [ ] /intelligence/omega route + OmegaDashboard.tsx
- [ ] Ecosystem health metrics + loop visualizer

## Priority 8 - Phase 6 Cloud V1.0 (2 weeks)

- [x] Build public REST API surface and publish OpenAPI docs from apiRouter.ts / cloudRoutes.ts
- [x] Complete developer portal with API key lifecycle management in CloudPage.tsx and CloudAPIKeysPage.tsx
- [x] Finish webhook system delivery, signing, retries, and delivery log UX
- [x] Harden and publish the JavaScript/TypeScript SDK in sdk/WinnersSDK.ts

## Priority 9 - Phase 7 Mobile PWA (1-2 weeks)

- [x] Finalize service worker, manifest, and installability across public/sw.js and manifest assets
- [x] Build push notifications with Firebase FCM for web + mobile handoff
- [x] Implement offline data caching and sync strategy for key user flows
- [x] Add biometric login support wiring in the mobile auth flow

## Priority 10 - Phase 8 Cloud V2.0 (2-3 weeks)

- [x] Build plugin marketplace with install flow, publishing UX, and revenue sharing controls
- [x] Create white-label licensing system across whitelabelRoutes.ts, tenant settings, and provisioning flows
- [ ] Implement enterprise SSO for SAML, Okta, and Azure AD

## Follow-up

### COMPLETED ITEMS (April 2, 2026)

✅ **Cloud V1.0** - REST API documentation, OpenAPI spec, enhanced SDK with webhooks and plugins
✅ **Mobile PWA** - Push notifications (Firebase FCM), biometric authentication (WebAuthn)
✅ **Plugin Marketplace** - Review workflow, revenue sharing, payout system
✅ **White-label Licensing** - Sub-tenant provisioning, custom branding, enterprise SSO foundation

### FILES CREATED/MODIFIED

- `docs/CLOUD_API_OPENAPI_SPEC.json` - Complete OpenAPI 3.0 specification
- `sdk/WinnersSDK.ts` - Enhanced with webhooks, plugins, and whitelabel resources
- `src/features/notifications/PushNotificationService.ts` - Firebase FCM integration
- `src/features/auth/BiometricAuthService.ts` - WebAuthn biometric authentication
- `Server/routes/notificationRoutes.ts` - Added push notification endpoints
- `Server/routes/biometricRoutes.ts` - Biometric authentication API
- `Server/routes/pluginRoutes.ts` - Added revenue sharing and payout endpoints
- `Server/routes/whitelabelRoutes.ts` - White-label licensing and sub-tenant provisioning

### REMAINING TODO

- Enterprise SSO implementation (SAML, Okta, Azure AD) - requires additional Prisma models
- Firebase Admin SDK integration for production push notifications
- Production database migrations for new models (notificationPreference, challenge, webAuthnCredential)

Update statuses here after each step. Use `x` for done.

## Admin Route Matrix

| Route | Frontend consumer | Contract status | Notes |
|---|---|---|---|
| `GET /api/v1/admin/platform/status` | `/admin/platform` | `x` Audited | Platform control snapshot is mounted |
| `POST /api/v1/admin/platform/:id/launch` | `/admin/platform/:layerId` | `x` Audited | Launch action is mounted |
| `POST /api/v1/admin/platform/:id/suspend` | `/admin/platform/:layerId` | `x` Audited | Suspend action is mounted |
| `GET /api/v1/admin/revenue/breakdown` | `/admin/revenue` | `x` Audited | Revenue dashboard consumes breakdown payload |
| `GET /api/v1/admin/health` | `/admin/health` | `x` Audited | System Health page consumes panel snapshot |
| `GET /api/v1/admin/errors` | `/admin/health` | `x` Audited | Error feed alias exists for health triage |
| `POST /api/v1/admin/broadcast` | `/admin/broadcast` | `x` Audited | Broadcast create alias is mounted |
| `GET /api/v1/admin/broadcasts` | `/admin/broadcast` | `x` Audited | Broadcast history endpoint is mounted |
| `GET /api/v1/admin/actions` | `/admin/security` | `x` Audited | Admin audit feed endpoint is mounted |
| `POST /api/v1/admin/impersonate/:tenantId` | `/admin/tenants/:id` | `x` Audited | Tenant impersonation flow is mounted |
| `POST /api/v1/admin/forge/ask` | `/admin/forge` | `x` Audited | FORGE ask endpoint is mounted |
| `GET /api/v1/admin/security/audit` | `/admin/security` | `x` Audited | Security audit snapshot is mounted |
| `GET /api/v1/admin/security/sessions` | `/admin/security` | `x` Added | Active session rows for Page 9 |
| `POST /api/v1/admin/security/sessions/:id/revoke` | `/admin/security` | `x` Added | Per-session revoke action for Page 9 |

## Admin Response Audit

- `x` `/admin/security/panel` now supplies JWT config, session summary, live session rows, 2FA adoption, rate limit coverage, GDPR consent logs, admin audit entries, sensitive user actions, suspicious activity, and FORGE guidance for `/admin/security`.
- `x` `/admin/revenue/breakdown` shape aligns with `/admin/revenue` layer, plan, and geography consumers.
- `x` `/admin/broadcast/panel`, `/admin/broadcast/send`, `/admin/broadcast/schedule`, and `/admin/broadcast/draft` align with `/admin/broadcast` compose and history flows.
- `x` `/admin/users` and `/admin/users/:id` remain aligned with `/admin/users` and `/admin/users/:id`.
