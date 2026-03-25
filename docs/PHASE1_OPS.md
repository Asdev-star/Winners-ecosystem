# Phase 1 Ops Runbook

## 1) Backup Automation

Automated PostgreSQL backups are configured via GitHub Actions:

- Workflow file: `.github/workflows/db-backup.yml`
- Schedule: daily at `03:00 UTC`
- Manual trigger: `workflow_dispatch`
- Artifact retention: `14 days`

Required secret:

- `DATABASE_URL`

## 2) RLS Rollout

RLS migration:

- `prisma/migrations/20260223210000_phase1_rls_policies/migration.sql`

Behavior:

- Safe mode default: `app.rls_bypass = true`
- Strict mode target: `app.rls_bypass = false` and request-scoped `app.tenant_id` set

## 3) SSO Preparation

Routes:

- `GET /api/v1/sso/config`
- `POST /api/v1/sso/token` (auth required)

Purpose:

- Enable cross-subdomain handoff token exchange while the full shared-cookie SSO rollout is completed.
