CREATE TABLE "platform_layer_statuses" (
  "id" TEXT NOT NULL,
  "layerId" TEXT NOT NULL,
  "layerName" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorEmail" TEXT,
  "confirmationText" TEXT,
  "summary" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "platform_layer_statuses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_layer_statuses_layerId_createdAt_idx"
  ON "platform_layer_statuses"("layerId", "createdAt");
