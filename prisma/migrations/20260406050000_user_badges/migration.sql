-- Add Academy badge support to users
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "badges" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
