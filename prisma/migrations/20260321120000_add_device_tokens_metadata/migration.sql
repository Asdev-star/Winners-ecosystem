ALTER TABLE "device_tokens"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT,
  ADD COLUMN IF NOT EXISTS "userAgent" TEXT,
  ADD COLUMN IF NOT EXISTS "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "device_tokens" dt
SET "tenantId" = u."tenantId"
FROM "users" u
WHERE dt."userId" = u."id"
  AND dt."tenantId" IS NULL;

ALTER TABLE "device_tokens"
  ALTER COLUMN "tenantId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "device_tokens_userId_idx" ON "device_tokens"("userId");
CREATE INDEX IF NOT EXISTS "device_tokens_userId_isActive_idx" ON "device_tokens"("userId", "isActive");
