ALTER TABLE "certificates"
  ADD COLUMN IF NOT EXISTS "certNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "verificationCode" TEXT,
  ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "pdfPublicId" TEXT;

UPDATE "certificates"
SET
  "certNumber" = COALESCE(
    "certNumber",
    'CERT-' || upper(substring(md5(random()::text || clock_timestamp()::text || id::text), 1, 8))
  ),
  "verificationCode" = COALESCE(
    "verificationCode",
    upper(substring(md5(random()::text || clock_timestamp()::text || id::text || 'verification'), 1, 16))
  );

ALTER TABLE "certificates"
  ALTER COLUMN "certNumber" SET NOT NULL,
  ALTER COLUMN "verificationCode" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "certificates_certNumber_key" ON "certificates" ("certNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "certificates_verificationCode_key" ON "certificates" ("verificationCode");
