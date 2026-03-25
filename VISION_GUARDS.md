# Winners Ecosystem Vision Guards

This file defines non-negotiable acceptance criteria for all changes.

## 1) Stabilization First

No expansion work ships until baseline health is green:

- `npx tsc --noEmit -p tsconfig.server.json` passes
- `npx tsc --noEmit -p tsconfig.app.json` passes
- `npx eslint src Server --ext .ts,.tsx` runs without runtime crash

## 2) Canonical Contracts

Use one contract everywhere:

- Pin field: `isPinned` only
- API namespace: `/api/v1/*`
- Groups route: `/community/groups`
- DB client import pattern is consistent across routes

## 3) Route and Middleware Integrity

- No duplicate mounts for `/auth`, `/posts`, or password reset routes
- Post limiter applies exactly once to all post endpoints
- Security middleware order remains: headers -> size guard -> parsers -> sanitizer -> rate limit

## 4) Schema and Type Safety

- Route payloads must match Prisma schema/types
- No unsupported Prisma fields in create/select/update/orderBy paths
- No `any`-driven schema drift introduced to bypass correctness

## 5) Design-System Compliance

For ecosystem target pages:

- No hardcoded hex colors or inline color literals
- CSS variables/tokens only
- Shared radius/gradient/context-bar patterns preserved

## 6) Deployment Safety

- Linux-safe path casing in scripts (for Railway/container runtime)
- Build step is deterministic (no implicit `prisma db push` inside build)
- `build:server` output starts with `node dist/server/index.js`

## 7) Phase Discipline

- Phase 1/2 stability and correctness gates stay green before Phase 2 expansion
- Realtime/groups enhancements ship only after baseline remains green
- New platform modules must register in `Server/services/appRegistry.ts`

## 8) Definition of Done

A task is done only when:

1. Relevant code changes are complete.
2. Required checks pass.
3. No route duplication or contract drift is introduced.
4. Change is aligned with roadmap phase and ecosystem vision.
