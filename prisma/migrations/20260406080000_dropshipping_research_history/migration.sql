-- Persist ATLAS dropshipping research history for tenant-scoped lookup.

CREATE TABLE IF NOT EXISTS "dropshipping_research" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tool" TEXT NOT NULL,
  "input" JSONB NOT NULL,
  "output" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dropshipping_research_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "dropshipping_research_tenantId_idx" ON "dropshipping_research" ("tenantId");
CREATE INDEX IF NOT EXISTS "dropshipping_research_userId_idx" ON "dropshipping_research" ("userId");
CREATE INDEX IF NOT EXISTS "dropshipping_research_tool_idx" ON "dropshipping_research" ("tool");

ALTER TABLE "dropshipping_research"
  ADD CONSTRAINT "dropshipping_research_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dropshipping_research"
  ADD CONSTRAINT "dropshipping_research_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
