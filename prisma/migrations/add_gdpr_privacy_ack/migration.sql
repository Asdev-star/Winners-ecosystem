-- prisma/migrations/add_gdpr_privacy_ack/migration.sql
-- GDPR Compliance Layer: Privacy Acknowledgment Table
-- Stores when each user acknowledged the privacy policy (GDPR Article 7)

CREATE TABLE IF NOT EXISTS "privacy_acknowledgments" (
    "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId"         TEXT NOT NULL,
    "tenantId"       TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "policyVersion"  TEXT NOT NULL DEFAULT '1.0',
    "ipAddress"      TEXT,
    "userAgent"      TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "privacy_acknowledgments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "privacy_acknowledgments_userId_key"
    ON "privacy_acknowledgments"("userId");

CREATE INDEX IF NOT EXISTS "privacy_acknowledgments_tenantId_idx"
    ON "privacy_acknowledgments"("tenantId");

ALTER TABLE "privacy_acknowledgments"
    ADD CONSTRAINT "privacy_acknowledgments_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security policy: users can only read their own acknowledgment
-- Enable on the table for RLS enforcement
ALTER TABLE "privacy_acknowledgments" ENABLE ROW LEVEL SECURITY;
