# Winners Ecosystem Missing Items Report

Date: 2026-02-23  
Session: #1

## What Is Green

- `npx.cmd tsc --noEmit -p tsconfig.server.json` passes.
- `npx.cmd tsc --noEmit -p tsconfig.app.json` passes.
- API gateway mounts now include:
  - `/api/v1/health`
  - `/api/v1/gdpr`
  - `/api/v1/groups`
  - `/api/v1/posts` (with limiter)
  - `/api/v1/registry`
- Frontend route coverage includes:
  - `/community`
  - `/community/groups`
  - `/academy`
  - `/academy/courses/:slug`

## Critical Missing Items

1. Lint baseline is not green:
   - Full lint currently fails with a large backlog (`212 errors`, `17 warnings`).
   - Main clusters: `no-explicit-any`, `ban-ts-comment`, hook dependency warnings, and several React hook rule violations.
2. Academy implementation depth is still minimal in UI:
   - Routes exist, but `CoursesPage.tsx` is currently a placeholder.
3. Design-system compliance still needs broad enforcement across full codebase:
   - Target pages show no hardcoded hex matches in quick scan, but broader full-page style audits are still needed.

## Recommended Next Execution Order

1. Lint stabilization wave 1 (server routes + middleware).
2. Lint stabilization wave 2 (high-traffic frontend pages: dashboard, community, billing, stripe, search).
3. Academy UI build-out (`AcademyPage`, `CoursePage`, instructor/student flows).
4. Community realtime/groups completion after lint baseline is green.
