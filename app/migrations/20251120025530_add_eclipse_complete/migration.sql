-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'ECLIPSE_BRAND_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'ECLIPSE_BRAND_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'ECLIPSE_BRAND_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'ECLIPSE_MONITOR_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'ECLIPSE_MONITOR_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'ECLIPSE_ALERT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'ECLIPSE_ALERT_ACKNOWLEDGED';
ALTER TYPE "AuditAction" ADD VALUE 'ECLIPSE_ALERT_ESCALATED';
ALTER TYPE "AuditAction" ADD VALUE 'ECLIPSE_INFRINGEMENT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'ECLIPSE_INFRINGEMENT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'ECLIPSE_ACTION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'ECLIPSE_ACTION_COMPLETED';

-- CreateTable
CREATE TABLE "EclipseBrand" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trademark" TEXT,
    "domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "socialMediaHandles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "confidentiality" TEXT NOT NULL DEFAULT 'public',
    "createdBy" TEXT,
    "lastModifiedBy" TEXT,

    CONSTRAINT "EclipseBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandMonitor" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brandId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "monitoringType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "searchTerms" TEXT[],
    "excludeTerms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetLanguages" TEXT[] DEFAULT ARRAY['pt', 'es', 'en']::TEXT[],
    "excludeRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "yaraRules" TEXT,
    "regexPatterns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "domainPatterns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidenceThreshold" INTEGER NOT NULL DEFAULT 70,
    "matchingRulesNeeded" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isAutomated" BOOLEAN NOT NULL DEFAULT true,
    "enableScreenshots" BOOLEAN NOT NULL DEFAULT true,
    "enableOCR" BOOLEAN NOT NULL DEFAULT false,
    "deepAnalysis" BOOLEAN NOT NULL DEFAULT false,
    "checkFrequency" TEXT NOT NULL DEFAULT 'daily',
    "lastCheckAt" TIMESTAMP(3),
    "nextCheckAt" TIMESTAMP(3),
    "detectionsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "detectionsTotalTime" INTEGER NOT NULL DEFAULT 0,
    "successfulRuns" INTEGER NOT NULL DEFAULT 0,
    "failedRuns" INTEGER NOT NULL DEFAULT 0,
    "lastErrorMessage" TEXT,

    CONSTRAINT "BrandMonitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandAlert" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monitorId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "infringementId" TEXT,
    "sourceData" JSONB,
    "confidence" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "BrandAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandInfringement" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brandId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "detectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "ipAddress" TEXT,
    "location" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "detectedBy" TEXT,
    "investigatedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "aegisIncidentId" TEXT,
    "aegisSyncStatus" TEXT NOT NULL DEFAULT 'pending',
    "aegisSyncedAt" TIMESTAMP(3),
    "aegisSyncError" TEXT,

    CONSTRAINT "BrandInfringement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfringementAction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "infringementId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "plannedDate" TIMESTAMP(3),
    "executionDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "result" TEXT,
    "evidence" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "assignedTo" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "InfringementAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandAlertAggregation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brandId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalAlerts" INTEGER NOT NULL DEFAULT 0,
    "criticalAlerts" INTEGER NOT NULL DEFAULT 0,
    "highAlerts" INTEGER NOT NULL DEFAULT 0,
    "newInfringements" INTEGER NOT NULL DEFAULT 0,
    "actionsCompleted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BrandAlertAggregation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModificationHistory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brandId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "modifiedBy" TEXT,

    CONSTRAINT "ModificationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EclipseBrand_workspaceId_idx" ON "EclipseBrand"("workspaceId");

-- CreateIndex
CREATE INDEX "EclipseBrand_status_idx" ON "EclipseBrand"("status");

-- CreateIndex
CREATE INDEX "EclipseBrand_createdAt_idx" ON "EclipseBrand"("createdAt");

-- CreateIndex
CREATE INDEX "BrandMonitor_brandId_idx" ON "BrandMonitor"("brandId");

-- CreateIndex
CREATE INDEX "BrandMonitor_workspaceId_idx" ON "BrandMonitor"("workspaceId");

-- CreateIndex
CREATE INDEX "BrandMonitor_status_idx" ON "BrandMonitor"("status");

-- CreateIndex
CREATE INDEX "BrandMonitor_nextCheckAt_idx" ON "BrandMonitor"("nextCheckAt");

-- CreateIndex
CREATE INDEX "BrandAlert_monitorId_idx" ON "BrandAlert"("monitorId");

-- CreateIndex
CREATE INDEX "BrandAlert_brandId_idx" ON "BrandAlert"("brandId");

-- CreateIndex
CREATE INDEX "BrandAlert_workspaceId_idx" ON "BrandAlert"("workspaceId");

-- CreateIndex
CREATE INDEX "BrandAlert_status_idx" ON "BrandAlert"("status");

-- CreateIndex
CREATE INDEX "BrandAlert_severity_idx" ON "BrandAlert"("severity");

-- CreateIndex
CREATE INDEX "BrandInfringement_brandId_idx" ON "BrandInfringement"("brandId");

-- CreateIndex
CREATE INDEX "BrandInfringement_workspaceId_idx" ON "BrandInfringement"("workspaceId");

-- CreateIndex
CREATE INDEX "BrandInfringement_status_idx" ON "BrandInfringement"("status");

-- CreateIndex
CREATE INDEX "BrandInfringement_severity_idx" ON "BrandInfringement"("severity");

-- CreateIndex
CREATE INDEX "BrandInfringement_createdAt_idx" ON "BrandInfringement"("createdAt");

-- CreateIndex
CREATE INDEX "BrandInfringement_aegisIncidentId_idx" ON "BrandInfringement"("aegisIncidentId");

-- CreateIndex
CREATE INDEX "BrandInfringement_aegisSyncStatus_idx" ON "BrandInfringement"("aegisSyncStatus");

-- CreateIndex
CREATE INDEX "InfringementAction_infringementId_idx" ON "InfringementAction"("infringementId");

-- CreateIndex
CREATE INDEX "InfringementAction_workspaceId_idx" ON "InfringementAction"("workspaceId");

-- CreateIndex
CREATE INDEX "InfringementAction_status_idx" ON "InfringementAction"("status");

-- CreateIndex
CREATE INDEX "BrandAlertAggregation_brandId_idx" ON "BrandAlertAggregation"("brandId");

-- CreateIndex
CREATE INDEX "BrandAlertAggregation_workspaceId_idx" ON "BrandAlertAggregation"("workspaceId");

-- CreateIndex
CREATE INDEX "BrandAlertAggregation_date_idx" ON "BrandAlertAggregation"("date");

-- CreateIndex
CREATE INDEX "ModificationHistory_brandId_idx" ON "ModificationHistory"("brandId");

-- AddForeignKey
ALTER TABLE "EclipseBrand" ADD CONSTRAINT "EclipseBrand_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandMonitor" ADD CONSTRAINT "BrandMonitor_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "EclipseBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandMonitor" ADD CONSTRAINT "BrandMonitor_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAlert" ADD CONSTRAINT "BrandAlert_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "BrandMonitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAlert" ADD CONSTRAINT "BrandAlert_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "EclipseBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAlert" ADD CONSTRAINT "BrandAlert_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAlert" ADD CONSTRAINT "BrandAlert_infringementId_fkey" FOREIGN KEY ("infringementId") REFERENCES "BrandInfringement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandInfringement" ADD CONSTRAINT "BrandInfringement_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "EclipseBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandInfringement" ADD CONSTRAINT "BrandInfringement_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandInfringement" ADD CONSTRAINT "BrandInfringement_aegisIncidentId_fkey" FOREIGN KEY ("aegisIncidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfringementAction" ADD CONSTRAINT "InfringementAction_infringementId_fkey" FOREIGN KEY ("infringementId") REFERENCES "BrandInfringement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfringementAction" ADD CONSTRAINT "InfringementAction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAlertAggregation" ADD CONSTRAINT "BrandAlertAggregation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "EclipseBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAlertAggregation" ADD CONSTRAINT "BrandAlertAggregation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModificationHistory" ADD CONSTRAINT "ModificationHistory_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "EclipseBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
