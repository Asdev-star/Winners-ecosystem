-- Add tenantId columns as nullable first so legacy rows can be backfilled safely.
ALTER TABLE "group_members" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "super_chats" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "user_feed_preferences" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "vendor_reviews" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "video_room_participants" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Backfill tenant ownership from parent records that already carry tenant scope.
UPDATE "group_members" AS gm
SET "tenantId" = COALESCE(
  (SELECT g."tenantId" FROM "groups" AS g WHERE g."id" = gm."groupId"),
  (SELECT u."tenantId" FROM "users" AS u WHERE u."id" = gm."userId")
)
WHERE gm."tenantId" IS NULL;

UPDATE "super_chats" AS sc
SET "tenantId" = COALESCE(
  (SELECT bs."tenantId" FROM "broadcast_streams" AS bs WHERE bs."id" = sc."streamId"),
  (SELECT u."tenantId" FROM "users" AS u WHERE u."id" = sc."userId")
)
WHERE sc."tenantId" IS NULL;

UPDATE "user_feed_preferences" AS ufp
SET "tenantId" = (
  SELECT u."tenantId"
  FROM "users" AS u
  WHERE u."id" = ufp."userId"
)
WHERE ufp."tenantId" IS NULL;

UPDATE "vendor_reviews" AS vr
SET "tenantId" = COALESCE(
  (SELECT v."tenantId" FROM "vendors" AS v WHERE v."id" = vr."vendorId"),
  (SELECT o."tenantId" FROM "orders" AS o WHERE o."id" = vr."orderId"),
  (SELECT u."tenantId" FROM "users" AS u WHERE u."id" = vr."userId")
)
WHERE vr."tenantId" IS NULL;

UPDATE "video_room_participants" AS vrp
SET "tenantId" = COALESCE(
  (SELECT vr."tenantId" FROM "video_rooms" AS vr WHERE vr."id" = vrp."roomId"),
  (SELECT u."tenantId" FROM "users" AS u WHERE u."id" = vrp."userId")
)
WHERE vrp."tenantId" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "group_members" WHERE "tenantId" IS NULL) THEN
    RAISE EXCEPTION 'Unable to backfill tenantId for group_members';
  END IF;

  IF EXISTS (SELECT 1 FROM "super_chats" WHERE "tenantId" IS NULL) THEN
    RAISE EXCEPTION 'Unable to backfill tenantId for super_chats';
  END IF;

  IF EXISTS (SELECT 1 FROM "user_feed_preferences" WHERE "tenantId" IS NULL) THEN
    RAISE EXCEPTION 'Unable to backfill tenantId for user_feed_preferences';
  END IF;

  IF EXISTS (SELECT 1 FROM "vendor_reviews" WHERE "tenantId" IS NULL) THEN
    RAISE EXCEPTION 'Unable to backfill tenantId for vendor_reviews';
  END IF;

  IF EXISTS (SELECT 1 FROM "video_room_participants" WHERE "tenantId" IS NULL) THEN
    RAISE EXCEPTION 'Unable to backfill tenantId for video_room_participants';
  END IF;
END $$;

ALTER TABLE "group_members" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "super_chats" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "user_feed_preferences" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "vendor_reviews" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "video_room_participants" ALTER COLUMN "tenantId" SET NOT NULL;

-- Align indexes and compound unique keys with the current Prisma schema.
DROP INDEX IF EXISTS "group_members_groupId_userId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "group_members_id_tenantId_key"
  ON "group_members"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "group_members_groupId_userId_tenantId_key"
  ON "group_members"("groupId", "userId", "tenantId");
CREATE INDEX IF NOT EXISTS "group_members_tenantId_idx"
  ON "group_members"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "super_chats_id_tenantId_key"
  ON "super_chats"("id", "tenantId");
CREATE INDEX IF NOT EXISTS "super_chats_tenantId_idx"
  ON "super_chats"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "user_feed_preferences_id_tenantId_key"
  ON "user_feed_preferences"("id", "tenantId");
CREATE INDEX IF NOT EXISTS "user_feed_preferences_tenantId_idx"
  ON "user_feed_preferences"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "vendor_reviews_id_tenantId_key"
  ON "vendor_reviews"("id", "tenantId");
CREATE INDEX IF NOT EXISTS "vendor_reviews_tenantId_idx"
  ON "vendor_reviews"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "video_room_participants_id_tenantId_key"
  ON "video_room_participants"("id", "tenantId");
CREATE INDEX IF NOT EXISTS "video_room_participants_tenantId_idx"
  ON "video_room_participants"("tenantId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'group_members_tenantId_fkey'
  ) THEN
    ALTER TABLE "group_members"
      ADD CONSTRAINT "group_members_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'super_chats_tenantId_fkey'
  ) THEN
    ALTER TABLE "super_chats"
      ADD CONSTRAINT "super_chats_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_feed_preferences_tenantId_fkey'
  ) THEN
    ALTER TABLE "user_feed_preferences"
      ADD CONSTRAINT "user_feed_preferences_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vendor_reviews_tenantId_fkey'
  ) THEN
    ALTER TABLE "vendor_reviews"
      ADD CONSTRAINT "vendor_reviews_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'video_room_participants_tenantId_fkey'
  ) THEN
    ALTER TABLE "video_room_participants"
      ADD CONSTRAINT "video_room_participants_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
