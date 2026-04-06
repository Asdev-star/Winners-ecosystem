# Winners Ecosystem Docs Map

This is the reading guide for the docs folder.

Canonical live track:

- `docs/PROJECT_STATE_CURRENT.md`

---

## Live Operational Docs

These are the docs the team should treat as active working documents.

### Track

- `docs/PROJECT_STATE_CURRENT.md`
- `TODO.md`
- `docs/ARCHIVE_INDEX.md`

### Runbooks

- `docs/PHASE1_OPS.md`
- `docs/PRODUCTION_SETUP_GUIDE.md`

### Logs

- `docs/SESSION_LEDGER.md`

---

## Reference Docs

These are useful references, setup guides, specs, and QA support material.

### API

- `docs/API_REFERENCE.md`
- `docs/CLOUD_API_OPENAPI_SPEC.json`
- `docs/GATEWAY_OPENAPI_SPEC.json`

### Mobile

- `docs/WINNERS_MOBILE_DEVICE_QA_RUNBOOK_MARCH_2026.md`
- `docs/WINNERS_MOBILE_LAYER_ROADMAP.md`
- `docs/WINNERS_MOBILE_POLISH_AUDIT_MARCH_2026.md`
- `docs/WINNERS_MOBILE_QA_REPORT_TEMPLATE_MARCH_2026.md`
- `docs/WINNERS_MOBILE_SCREEN_CHECKLIST_MARCH_2026.md`

### Intelligence

- `docs/WINNERS_MASTER_INTELLIGENCE_BIBLE_V1.md`
- `docs/WINNERS_AI_ASSISTANT_INTERACTION_SPEC_V2.md`

### Platform

- `docs/LIVEKIT_RAILWAY_SETUP.md`

### Protected surfaces

Do not refactor these unless there is a specific bug report or product decision.

- `Server/routes/authRoutes.ts`
- `Server/routes/analyticsRoutes.ts`
- `Server/routes/billingRoutes.ts`
- `Server/middleware/authMiddleware.ts`
- `Server/middleware/rateLimitMiddleware.ts`
- `Server/middleware/usageLimits.ts`
- `src/features/auth/`
- `src/features/billing/`
- `src/features/dashboard/`
- `src/features/community/CommunityPage.tsx`
- `prisma/schema.prisma`
- `ai-platform/main.py`
- `public/manifest.json`
- `public/sw.js`

---

## Archive-Only Docs

These docs are historical and should not be treated as active planning material.

- See `docs/ARCHIVE_INDEX.md` for the full archive list.
- `docs/WINNERS_ECOSYSTEM_REMAINING_IMPLEMENTATION_CHECKLIST.md`
