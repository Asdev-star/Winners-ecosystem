-- Phase 1 Core Engine: PostgreSQL RLS policy pack
-- Goal: introduce tenant-scoped policies with a controlled rollout toggle.
--
-- Rollout behavior:
-- - app.rls_bypass = true  -> policies allow access (safe migration mode)
-- - app.rls_bypass = false -> tenant policies enforced using app.tenant_id
--
-- To move into strict mode:
--   1) Ensure API layer sets app.tenant_id for request-scoped DB access.
--   2) Set app.rls_bypass to false at role/session level.

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '');
$$;

CREATE OR REPLACE FUNCTION app.rls_bypass()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT lower(coalesce(current_setting('app.rls_bypass', true), 'true')) IN ('1', 'true', 'on', 'yes');
$$;

DO $$
BEGIN
  IF to_regclass('"users"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "users" ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_tenant_isolation'
    ) THEN
      EXECUTE 'CREATE POLICY users_tenant_isolation ON "users"
               USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
               WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
    END IF;
  END IF;

  IF to_regclass('"invites"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "invites" ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'invites' AND policyname = 'invites_tenant_isolation'
    ) THEN
      EXECUTE 'CREATE POLICY invites_tenant_isolation ON "invites"
               USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
               WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
    END IF;
  END IF;

  IF to_regclass('"revenue_records"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "revenue_records" ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'revenue_records' AND policyname = 'revenue_records_tenant_isolation'
    ) THEN
      EXECUTE 'CREATE POLICY revenue_records_tenant_isolation ON "revenue_records"
               USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
               WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
    END IF;
  END IF;

  IF to_regclass('"analytics_events"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "analytics_events" ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'analytics_events_tenant_isolation'
    ) THEN
      EXECUTE 'CREATE POLICY analytics_events_tenant_isolation ON "analytics_events"
               USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
               WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
    END IF;
  END IF;

  IF to_regclass('"referral_credits"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "referral_credits" ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'referral_credits' AND policyname = 'referral_credits_tenant_isolation'
    ) THEN
      EXECUTE 'CREATE POLICY referral_credits_tenant_isolation ON "referral_credits"
               USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
               WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
    END IF;
  END IF;

  IF to_regclass('"posts"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'posts_tenant_isolation'
    ) THEN
      EXECUTE 'CREATE POLICY posts_tenant_isolation ON "posts"
               USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
               WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
    END IF;
  END IF;

  IF to_regclass('"groups"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "groups" ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'groups_tenant_isolation'
    ) THEN
      EXECUTE 'CREATE POLICY groups_tenant_isolation ON "groups"
               USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
               WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
    END IF;
  END IF;

  IF to_regclass('"privacy_acknowledgments"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "privacy_acknowledgments" ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'privacy_acknowledgments' AND policyname = 'privacy_ack_tenant_isolation'
    ) THEN
      EXECUTE 'CREATE POLICY privacy_ack_tenant_isolation ON "privacy_acknowledgments"
               USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
               WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
    END IF;
  END IF;

  IF to_regclass('"courses"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'courses_tenant_isolation'
    ) THEN
      EXECUTE 'CREATE POLICY courses_tenant_isolation ON "courses"
               USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
               WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
    END IF;
  END IF;
END $$;
