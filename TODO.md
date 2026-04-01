# WINNERS ECOSYSTEM - IMPLEMENTATION TODO

From PROJECT_STATE_CURRENT.md V10.0 Critical Pending Actions (Prioritized)

## Priority 1 - Security Fix (Immediate)

- [ ] Verify/fix tenantId scoping on postRoutes.ts update/delete

## Priority 2 - Wire Intelligence Routes (1 day)

- [ ] Add /intelligence & /intelligence/aria routes to src/App.tsx
- [ ] Add Intelligence nav item to src/components/layout/MainLayout.tsx
- [ ] Confirm chatRoutes.ts mounted in Server/index.ts

## Priority 3 - Complete Market Checkout Flow (1 week)

- [ ] Stripe payment integration in CheckoutPage.tsx
- [ ] Order confirmation + email notification
- [ ] Inventory management on purchase
- [ ] Vendor payout tracking

## Priority 4 - Build Work Job Board (2 weeks)

- [ ] Job listing CRUD API (workRoutes.ts)
- [ ] Job board UI (WorkPage.tsx w/ filters)
- [ ] Job application system
- [ ] CIRCUIT AI matching

## Priority 5 - Complete NOVA AI Integration (1 week)

- [ ] Wire NOVA to CommunityPage.tsx via AssistantPanel
- [ ] Skill detection from posts -> OMEGA trigger

## Priority 6 - Complete SAGE AI Integration (1 week)

- [ ] Wire SAGE to CoursePage.tsx
- [ ] PDF analysis upload

## Priority 7 - Build OMEGA Dashboard (2 weeks)

- [ ] /intelligence/omega route + OmegaDashboard.tsx
- [ ] Ecosystem health metrics + loop visualizer

## Follow-up

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
