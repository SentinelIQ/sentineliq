/*
  Warnings:

  - You are about to drop the column `ailApiKey` on the `EclipseConfig` table. All the data in the column will be lost.
  - You are about to drop the column `ailApiUrl` on the `EclipseConfig` table. All the data in the column will be lost.
  - You are about to drop the column `ailEnabled` on the `EclipseConfig` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EclipseDetectionStatus" ADD VALUE 'PENDING';
ALTER TYPE "EclipseDetectionStatus" ADD VALUE 'PENDING_REVIEW';
ALTER TYPE "EclipseDetectionStatus" ADD VALUE 'HIGH_PRIORITY';
ALTER TYPE "EclipseDetectionStatus" ADD VALUE 'CRITICAL';
ALTER TYPE "EclipseDetectionStatus" ADD VALUE 'LOW_PRIORITY';
ALTER TYPE "EclipseDetectionStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "EclipseConfig" DROP COLUMN "ailApiKey",
DROP COLUMN "ailApiUrl",
DROP COLUMN "ailEnabled",
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastCorrelationRun" TIMESTAMP(3),
ADD COLUMN     "lastMonitoringRun" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "monitoringKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pastebinApiKey" TEXT,
ADD COLUMN     "torProxyUrl" TEXT;

-- AlterTable
ALTER TABLE "EclipseDataSource" ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastFetchedAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "sourceType" "EclipseSourceType",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "EclipseDetection" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "riskScore" INTEGER NOT NULL DEFAULT 50;

-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN     "s3Key" TEXT;

-- CreateTable
CREATE TABLE "AegisConfig" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "autoEscalationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoEscalationThresholdMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxOpenAlertsPerUser" INTEGER NOT NULL DEFAULT 50,
    "defaultAlertRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "slaEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultSlaMinutes" INTEGER NOT NULL DEFAULT 240,
    "criticalSlaMinutes" INTEGER NOT NULL DEFAULT 60,
    "autoAssignmentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "slackWebhookUrl" TEXT,
    "teamsWebhookUrl" TEXT,
    "customWebhookUrl" TEXT,
    "mitreAttackSyncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "mitreAttackApiKey" TEXT,
    "enableMitreMapping" BOOLEAN NOT NULL DEFAULT true,
    "evidenceEncryption" BOOLEAN NOT NULL DEFAULT true,
    "auditLoggingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "retentionPolicyDays" INTEGER NOT NULL DEFAULT 2555,
    "maxConcurrentTasks" INTEGER NOT NULL DEFAULT 10,
    "batchProcessingSize" INTEGER NOT NULL DEFAULT 100,
    "enableBackgroundProcessing" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AegisConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MitreTactic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MitreTactic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MitreTechnique" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT,
    "tacticId" TEXT NOT NULL,
    "parentId" TEXT,
    "platforms" TEXT[],
    "dataSources" TEXT[],
    "defenses" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MitreTechnique_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AegisConfig_workspaceId_key" ON "AegisConfig"("workspaceId");

-- CreateIndex
CREATE INDEX "MitreTechnique_tacticId_idx" ON "MitreTechnique"("tacticId");

-- CreateIndex
CREATE INDEX "MitreTechnique_parentId_idx" ON "MitreTechnique"("parentId");

-- AddForeignKey
ALTER TABLE "AegisConfig" ADD CONSTRAINT "AegisConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MitreTechnique" ADD CONSTRAINT "MitreTechnique_tacticId_fkey" FOREIGN KEY ("tacticId") REFERENCES "MitreTactic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MitreTechnique" ADD CONSTRAINT "MitreTechnique_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MitreTechnique"("id") ON DELETE CASCADE ON UPDATE CASCADE;
