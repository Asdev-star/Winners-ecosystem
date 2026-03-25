/*
  Warnings:

  - You are about to drop the column `stripeCustomerId` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionId` on the `tenants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripeSubscriptionId";
