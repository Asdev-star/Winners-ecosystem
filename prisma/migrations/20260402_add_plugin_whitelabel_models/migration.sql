-- CreateEnum
CREATE TYPE "PluginPricing" AS ENUM ('free', 'paid', 'freemium');

-- CreateEnum
CREATE TYPE "PluginStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "escrow_payments" ADD COLUMN     "releasedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "parentTenantId" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "tenant_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "branding" JSONB NOT NULL DEFAULT '{}',
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sso_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "entityId" TEXT,
    "ssoUrl" TEXT,
    "certificate" TEXT,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "oidcIssuer" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sso_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugins" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "pricing" "PluginPricing" NOT NULL DEFAULT 'free',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "revenueShare" INTEGER NOT NULL DEFAULT 70,
    "manifestUrl" TEXT NOT NULL,
    "documentationUrl" TEXT,
    "repositoryUrl" TEXT,
    "screenshots" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PluginStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "installCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plugins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugin_installs" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "plugin_installs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugin_reviews" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plugin_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugin_revenues" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "developerAmount" DOUBLE PRECISION NOT NULL,
    "platformAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidOutAt" TIMESTAMP(3),

    CONSTRAINT "plugin_revenues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugin_transactions" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "developerAmount" DOUBLE PRECISION NOT NULL,
    "platformAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plugin_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developer_earnings" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "pendingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPaidOut" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "developer_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developer_payouts" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payoutMethod" TEXT NOT NULL,
    "payoutDetails" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "developer_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_configs_tenantId_key" ON "tenant_configs"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_configs_domain_key" ON "tenant_configs"("domain");

-- CreateIndex
CREATE INDEX "tenant_configs_active_idx" ON "tenant_configs"("active");

-- CreateIndex
CREATE UNIQUE INDEX "sso_configs_tenantId_key" ON "sso_configs"("tenantId");

-- CreateIndex
CREATE INDEX "sso_configs_active_idx" ON "sso_configs"("active");

-- CreateIndex
CREATE UNIQUE INDEX "plugins_slug_key" ON "plugins"("slug");

-- CreateIndex
CREATE INDEX "plugins_tenantId_status_idx" ON "plugins"("tenantId", "status");

-- CreateIndex
CREATE INDEX "plugins_developerId_idx" ON "plugins"("developerId");

-- CreateIndex
CREATE INDEX "plugins_category_idx" ON "plugins"("category");

-- CreateIndex
CREATE INDEX "plugin_installs_tenantId_active_idx" ON "plugin_installs"("tenantId", "active");

-- CreateIndex
CREATE INDEX "plugin_installs_userId_idx" ON "plugin_installs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "plugin_installs_pluginId_tenantId_key" ON "plugin_installs"("pluginId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "plugin_installs_pluginId_userId_key" ON "plugin_installs"("pluginId", "userId");

-- CreateIndex
CREATE INDEX "plugin_reviews_tenantId_idx" ON "plugin_reviews"("tenantId");

-- CreateIndex
CREATE INDEX "plugin_reviews_pluginId_idx" ON "plugin_reviews"("pluginId");

-- CreateIndex
CREATE UNIQUE INDEX "plugin_reviews_pluginId_userId_key" ON "plugin_reviews"("pluginId", "userId");

-- CreateIndex
CREATE INDEX "plugin_revenues_tenantId_idx" ON "plugin_revenues"("tenantId");

-- CreateIndex
CREATE INDEX "plugin_revenues_developerId_status_idx" ON "plugin_revenues"("developerId", "status");

-- CreateIndex
CREATE INDEX "plugin_revenues_pluginId_idx" ON "plugin_revenues"("pluginId");

-- CreateIndex
CREATE INDEX "plugin_transactions_tenantId_idx" ON "plugin_transactions"("tenantId");

-- CreateIndex
CREATE INDEX "plugin_transactions_developerId_status_idx" ON "plugin_transactions"("developerId", "status");

-- CreateIndex
CREATE INDEX "plugin_transactions_buyerId_idx" ON "plugin_transactions"("buyerId");

-- CreateIndex
CREATE INDEX "plugin_transactions_pluginId_idx" ON "plugin_transactions"("pluginId");

-- CreateIndex
CREATE UNIQUE INDEX "developer_earnings_developerId_key" ON "developer_earnings"("developerId");

-- CreateIndex
CREATE INDEX "developer_payouts_developerId_status_idx" ON "developer_payouts"("developerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_parentTenantId_fkey" FOREIGN KEY ("parentTenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_configs" ADD CONSTRAINT "tenant_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sso_configs" ADD CONSTRAINT "sso_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugins" ADD CONSTRAINT "plugins_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugins" ADD CONSTRAINT "plugins_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugins" ADD CONSTRAINT "plugins_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_installs" ADD CONSTRAINT "plugin_installs_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "plugins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_installs" ADD CONSTRAINT "plugin_installs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_installs" ADD CONSTRAINT "plugin_installs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_reviews" ADD CONSTRAINT "plugin_reviews_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "plugins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_reviews" ADD CONSTRAINT "plugin_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_reviews" ADD CONSTRAINT "plugin_reviews_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_revenues" ADD CONSTRAINT "plugin_revenues_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "plugins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_revenues" ADD CONSTRAINT "plugin_revenues_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_revenues" ADD CONSTRAINT "plugin_revenues_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_revenues" ADD CONSTRAINT "plugin_revenues_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_transactions" ADD CONSTRAINT "plugin_transactions_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "plugins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_transactions" ADD CONSTRAINT "plugin_transactions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_transactions" ADD CONSTRAINT "plugin_transactions_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_transactions" ADD CONSTRAINT "plugin_transactions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "developer_earnings" ADD CONSTRAINT "developer_earnings_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "developer_payouts" ADD CONSTRAINT "developer_payouts_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
