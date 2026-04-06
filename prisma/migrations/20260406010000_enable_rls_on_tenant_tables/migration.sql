-- Enable row level security on the tenant-scoped tables verified by the live RLS check.
-- The existing policies use app.rls_bypass() and app.current_tenant_id().

ALTER TABLE IF EXISTS "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "invites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "revenue_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "analytics_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "referral_credits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "privacy_acknowledgments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "courses" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'users'
      AND policyname = 'users_tenant_isolation'
  ) THEN
    EXECUTE 'CREATE POLICY users_tenant_isolation ON "users"
      USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
      WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'invites'
      AND policyname = 'invites_tenant_isolation'
  ) THEN
    EXECUTE 'CREATE POLICY invites_tenant_isolation ON "invites"
      USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
      WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'revenue_records'
      AND policyname = 'revenue_records_tenant_isolation'
  ) THEN
    EXECUTE 'CREATE POLICY revenue_records_tenant_isolation ON "revenue_records"
      USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
      WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'analytics_events'
      AND policyname = 'analytics_events_tenant_isolation'
  ) THEN
    EXECUTE 'CREATE POLICY analytics_events_tenant_isolation ON "analytics_events"
      USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
      WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'referral_credits'
      AND policyname = 'referral_credits_tenant_isolation'
  ) THEN
    EXECUTE 'CREATE POLICY referral_credits_tenant_isolation ON "referral_credits"
      USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
      WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'posts'
      AND policyname = 'posts_tenant_isolation'
  ) THEN
    EXECUTE 'CREATE POLICY posts_tenant_isolation ON "posts"
      USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
      WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'groups'
      AND policyname = 'groups_tenant_isolation'
  ) THEN
    EXECUTE 'CREATE POLICY groups_tenant_isolation ON "groups"
      USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
      WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'privacy_acknowledgments'
      AND policyname = 'privacy_ack_tenant_isolation'
  ) THEN
    EXECUTE 'CREATE POLICY privacy_ack_tenant_isolation ON "privacy_acknowledgments"
      USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
      WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'courses'
      AND policyname = 'courses_tenant_isolation'
  ) THEN
    EXECUTE 'CREATE POLICY courses_tenant_isolation ON "courses"
      USING (app.rls_bypass() OR "tenantId" = app.current_tenant_id())
      WITH CHECK (app.rls_bypass() OR "tenantId" = app.current_tenant_id())';
  END IF;
END
$$;
