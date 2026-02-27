# Winners Ecosystem Project Evolution

Date: 2026-02-27  
Branch: `main`  
Commit baseline: `d48968b`

## Purpose

This document converts the latest state-analysis snapshots into an execution baseline for the live repository.

Use this as the "what changed + what is next" reference for implementation sessions.

## Synced Reference Snapshots

The following external reference files were synced into the repo:

- `docs/state-snapshots/2026-02-27/WINNERS_ECOSYSTEM_PROJECT_STATE.md`
- `docs/state-snapshots/2026-02-27/WINNERS_ECOSYSTEM_MASTER_ANALYSIS.md`
- `docs/state-snapshots/2026-02-27/WINNERS_ECOSYSTEM_STATE.md`

## Evolution Summary (Snapshot Claims vs Live Code)

### 1) Community and Academy wiring

Previous snapshot claim:
- Community and Academy had "critical not wired yet" routing tasks.

Current repository status:
- Frontend routes are wired in `src/App.tsx`:
  - `/community`
  - `/community/groups`
  - `/academy`
  - `/academy/my-learning`
  - `/academy/courses/:slug`
- Backend mounts are wired in `Server/routes/apiRouter.ts`:
  - `/posts`
  - `/groups`
  - `/academy`

Net change:
- These tasks are complete and should be removed from "critical not wired" lists.

### 2) Groups implementation maturity

Previous snapshot claim:
- Groups listed as "not started" in some sections.

Current repository status:
- Backend groups API exists: `Server/routes/groupRoutes.ts`
- Frontend groups experience exists: `src/features/community/GroupsPage.tsx`
- Prisma models exist:
  - `Group`
  - `GroupMember`

Net change:
- Groups are implemented as V1.2 baseline, not "not started."

### 3) Academy implementation maturity

Previous snapshot claim:
- Academy often described as schema-ready or partially wired.

Current repository status:
- Backend academy API exists: `Server/routes/academyRoutes.ts`
- Frontend academy pages exist:
  - `AcademyPage`
  - `CoursePage`
  - `StudentDashboardPage`
- Academy models exist in Prisma:
  - `Course`, `Module`, `Lesson`, `Enrollment`, `Certificate`

Net change:
- Academy is beyond schema-only stage; student flow is active baseline.

### 4) Phase 1 closeout items

Current repository confirms completion of multiple previously pending items:

- RLS migration pack exists:
  - `prisma/migrations/20260223210000_phase1_rls_policies/migration.sql`
- SSO preparation route exists and is mounted:
  - `Server/routes/ssoRoutes.ts`
  - `Server/routes/apiRouter.ts` -> `router.use("/sso", ssoRoutes)`
- Backup automation workflow exists:
  - `.github/workflows/db-backup.yml`

Net change:
- These should be tracked as done (or "prep complete" for SSO).

### 5) Recent hardening work included in baseline

Latest commit baseline (`d48968b`) includes:

- safer initials fallbacks
- typed social field access in profile
- auth-header consistency updates
- tenant payload normalization
- `vite` config cleanup

## Current Health Baseline

### Build and typecheck

- `npx tsc --noEmit -p tsconfig.app.json` -> pass
- `npx tsc --noEmit -p tsconfig.server.json` -> pass

### Lint baseline

- `npx eslint src Server --ext .ts,.tsx` -> `219 problems (205 errors, 14 warnings)`

Main backlog clusters:
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/ban-ts-comment` (`@ts-nocheck`)
- hook dependency and `set-state-in-effect` rules
- empty blocks and unused vars

### Tests baseline

- discovered test files in `src/` and `Server/`: `0`
- Vitest config exists, but test suite has not been populated.

### Design-system drift

Design rules in snapshots/documents are stricter than current implementation in several pages:
- hardcoded hex usage still present in some UI modules (example: `src/features/community/CommunityPage.tsx`)
- mixed style patterns still exist across older pages.

## Execution Priorities (Recommended)

1. Documentation alignment pass
- Update master state docs to remove stale "not wired" claims.
- Normalize phase percentages across all state documents.

2. Lint stabilization wave
- Start with highest-traffic routes and shared middleware.
- Remove `@ts-nocheck` files gradually with typed replacements.

3. Design-system enforcement wave
- Replace hardcoded colors with CSS variables on core surfaces.
- Keep page-level visual consistency with ecosystem card/context rules.

4. Testing bootstrap
- Add first smoke tests for:
  - auth/session restore flow
  - API router mounts
  - academy enroll/progress happy path

## Working Agreement

For planning and execution:

- Use synced snapshot files for vision and roadmap context.
- Use this evolution document as the repository truth for what is already implemented.
- Update this file whenever wiring state or phase maturity changes.

