-- CreateEnum
CREATE TYPE "EclipseTrackerType" AS ENUM ('KEYWORD', 'YARA', 'REGEX', 'TYPO_SQUATTING');

-- CreateEnum
CREATE TYPE "EclipseSourceType" AS ENUM ('PASTE_SITE', 'FORUM', 'SOCIAL_MEDIA', 'DARK_WEB', 'RSS_FEED', 'ZMQ_FEED', 'MANUAL');

-- CreateEnum
CREATE TYPE "EclipseDetectionStatus" AS ENUM ('NEW', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EclipseSensitiveDataType" AS ENUM ('CREDIT_CARD', 'API_KEY', 'PASSWORD', 'EMAIL', 'IBAN', 'PHONE', 'BITCOIN', 'ETHEREUM', 'SSH_KEY', 'PRIVATE_KEY', 'JWT_TOKEN', 'AWS_KEY', 'URL', 'TOR_ADDRESS', 'BASE64', 'HEX');

-- CreateEnum
CREATE TYPE "EclipseCrawlStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EclipseCorrelationType" AS ENUM ('HASH', 'CVE', 'DOMAIN', 'USERNAME', 'CRYPTO', 'TITLE', 'IP_ADDRESS', 'EMAIL');

-- CreateEnum
CREATE TYPE "EclipseInfringementType" AS ENUM ('COUNTERFEIT', 'DOMAIN_SQUATTING', 'TYPO_SQUATTING', 'SOCIAL_MEDIA_IMPERSONATION', 'PHISHING', 'MALWARE_DISTRIBUTION', 'DATA_LEAK', 'TRADEMARK_VIOLATION');

-- CreateEnum
CREATE TYPE "EclipseInfringementStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'TAKEDOWN_REQUESTED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "EclipseReportType" AS ENUM ('SUMMARY', 'DETAILED', 'EXECUTIVE', 'TRENDS', 'COMPLIANCE');

-- CreateEnum
CREATE TYPE "EclipseReportFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "EclipseTracker" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "EclipseTrackerType" NOT NULL,
    "pattern" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
    "fuzzy" BOOLEAN NOT NULL DEFAULT false,
    "autoTag" BOOLEAN NOT NULL DEFAULT true,
    "notifyOn" TEXT NOT NULL DEFAULT 'match',

    CONSTRAINT "EclipseTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EclipseTrackerDetection" (
    "id" TEXT NOT NULL,
    "trackerId" TEXT NOT NULL,
    "detectionId" TEXT NOT NULL,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchContext" TEXT,

    CONSTRAINT "EclipseTrackerDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EclipseDetection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "url" TEXT,
    "sourceType" "EclipseSourceType" NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "status" "EclipseDetectionStatus" NOT NULL DEFAULT 'NEW',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EclipseDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EclipseSensitiveData" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detectionId" TEXT NOT NULL,
    "dataType" "EclipseSensitiveDataType" NOT NULL,
    "value" TEXT NOT NULL,
    "valueHash" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'HIGH',
    "extractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EclipseSensitiveData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EclipseDataSource" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "EclipseSourceType" NOT NULL,
    "sourceUrl" TEXT,
    "credentials" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "syncInterval" INTEGER NOT NULL DEFAULT 3600,

    CONSTRAINT "EclipseDataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EclipseSourceMetrics" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceId" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "criticalItems" INTEGER NOT NULL DEFAULT 0,
    "highItems" INTEGER NOT NULL DEFAULT 0,
    "mediumItems" INTEGER NOT NULL DEFAULT 0,
    "lowItems" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EclipseSourceMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EclipseCrawlJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 1,
    "status" "EclipseCrawlStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "EclipseCrawlJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EclipseCrawlResult" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "crawlJobId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "statusCode" INTEGER,
    "content" TEXT,
    "title" TEXT,

    CONSTRAINT "EclipseCrawlResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EclipseScreenshot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "crawlJobId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "format" TEXT NOT NULL,

    CONSTRAINT "EclipseScreenshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EclipseCorrelation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemId1" TEXT NOT NULL,
    "itemType1" TEXT NOT NULL,
    "itemId2" TEXT NOT NULL,
    "itemType2" TEXT NOT NULL,
    "correlationType" "EclipseCorrelationType" NOT NULL,
    "strength" INTEGER NOT NULL DEFAULT 0,
    "detectionId" TEXT,

    CONSTRAINT "EclipseCorrelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EclipseInfringement" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "brandId" TEXT,
    "detectionId" TEXT NOT NULL,
    "type" "EclipseInfringementType" NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'HIGH',
    "status" "EclipseInfringementStatus" NOT NULL DEFAULT 'OPEN',
    "evidenceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "mispEventId" TEXT,
    "theHiveCaseId" TEXT,

    CONSTRAINT "EclipseInfringement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EclipseSavedSearch" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "query" TEXT NOT NULL,
    "filters" JSONB NOT NULL,

    CONSTRAINT "EclipseSavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EclipseReport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "EclipseReportType" NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filePath" TEXT,

    CONSTRAINT "EclipseReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EclipseScheduledReport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EclipseReportType" NOT NULL,
    "frequency" "EclipseReportFrequency" NOT NULL,
    "sendTo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),

    CONSTRAINT "EclipseScheduledReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EclipseConfig" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "ailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ailApiUrl" TEXT,
    "ailApiKey" TEXT,
    "mispEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mispUrl" TEXT,
    "mispApiKey" TEXT,
    "theHiveEnabled" BOOLEAN NOT NULL DEFAULT false,
    "theHiveUrl" TEXT,
    "theHiveApiKey" TEXT,
    "crawlerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lacusUrl" TEXT,
    "torEnabled" BOOLEAN NOT NULL DEFAULT false,
    "i2pEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dataRetention" INTEGER NOT NULL DEFAULT 90,
    "maxStorageGB" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "EclipseConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EclipseTracker_workspaceId_idx" ON "EclipseTracker"("workspaceId");

-- CreateIndex
CREATE INDEX "EclipseTracker_type_idx" ON "EclipseTracker"("type");

-- CreateIndex
CREATE INDEX "EclipseTracker_active_idx" ON "EclipseTracker"("active");

-- CreateIndex
CREATE INDEX "EclipseTrackerDetection_trackerId_idx" ON "EclipseTrackerDetection"("trackerId");

-- CreateIndex
CREATE INDEX "EclipseTrackerDetection_detectionId_idx" ON "EclipseTrackerDetection"("detectionId");

-- CreateIndex
CREATE UNIQUE INDEX "EclipseTrackerDetection_trackerId_detectionId_key" ON "EclipseTrackerDetection"("trackerId", "detectionId");

-- CreateIndex
CREATE INDEX "EclipseDetection_workspaceId_idx" ON "EclipseDetection"("workspaceId");

-- CreateIndex
CREATE INDEX "EclipseDetection_sourceType_idx" ON "EclipseDetection"("sourceType");

-- CreateIndex
CREATE INDEX "EclipseDetection_severity_idx" ON "EclipseDetection"("severity");

-- CreateIndex
CREATE INDEX "EclipseDetection_status_idx" ON "EclipseDetection"("status");

-- CreateIndex
CREATE INDEX "EclipseDetection_detectedAt_idx" ON "EclipseDetection"("detectedAt");

-- CreateIndex
CREATE INDEX "EclipseSensitiveData_detectionId_idx" ON "EclipseSensitiveData"("detectionId");

-- CreateIndex
CREATE INDEX "EclipseSensitiveData_dataType_idx" ON "EclipseSensitiveData"("dataType");

-- CreateIndex
CREATE UNIQUE INDEX "EclipseSensitiveData_valueHash_dataType_key" ON "EclipseSensitiveData"("valueHash", "dataType");

-- CreateIndex
CREATE INDEX "EclipseDataSource_workspaceId_idx" ON "EclipseDataSource"("workspaceId");

-- CreateIndex
CREATE INDEX "EclipseDataSource_type_idx" ON "EclipseDataSource"("type");

-- CreateIndex
CREATE INDEX "EclipseDataSource_active_idx" ON "EclipseDataSource"("active");

-- CreateIndex
CREATE UNIQUE INDEX "EclipseSourceMetrics_sourceId_key" ON "EclipseSourceMetrics"("sourceId");

-- CreateIndex
CREATE INDEX "EclipseCrawlJob_workspaceId_idx" ON "EclipseCrawlJob"("workspaceId");

-- CreateIndex
CREATE INDEX "EclipseCrawlJob_status_idx" ON "EclipseCrawlJob"("status");

-- CreateIndex
CREATE INDEX "EclipseCrawlResult_crawlJobId_idx" ON "EclipseCrawlResult"("crawlJobId");

-- CreateIndex
CREATE INDEX "EclipseScreenshot_crawlJobId_idx" ON "EclipseScreenshot"("crawlJobId");

-- CreateIndex
CREATE INDEX "EclipseCorrelation_itemId1_idx" ON "EclipseCorrelation"("itemId1");

-- CreateIndex
CREATE INDEX "EclipseCorrelation_itemId2_idx" ON "EclipseCorrelation"("itemId2");

-- CreateIndex
CREATE INDEX "EclipseCorrelation_detectionId_idx" ON "EclipseCorrelation"("detectionId");

-- CreateIndex
CREATE UNIQUE INDEX "EclipseCorrelation_itemId1_itemId2_correlationType_key" ON "EclipseCorrelation"("itemId1", "itemId2", "correlationType");

-- CreateIndex
CREATE INDEX "EclipseInfringement_workspaceId_idx" ON "EclipseInfringement"("workspaceId");

-- CreateIndex
CREATE INDEX "EclipseInfringement_status_idx" ON "EclipseInfringement"("status");

-- CreateIndex
CREATE INDEX "EclipseInfringement_type_idx" ON "EclipseInfringement"("type");

-- CreateIndex
CREATE INDEX "EclipseSavedSearch_workspaceId_idx" ON "EclipseSavedSearch"("workspaceId");

-- CreateIndex
CREATE INDEX "EclipseReport_workspaceId_idx" ON "EclipseReport"("workspaceId");

-- CreateIndex
CREATE INDEX "EclipseReport_type_idx" ON "EclipseReport"("type");

-- CreateIndex
CREATE INDEX "EclipseScheduledReport_workspaceId_idx" ON "EclipseScheduledReport"("workspaceId");

-- CreateIndex
CREATE INDEX "EclipseScheduledReport_active_idx" ON "EclipseScheduledReport"("active");

-- CreateIndex
CREATE UNIQUE INDEX "EclipseConfig_workspaceId_key" ON "EclipseConfig"("workspaceId");

-- AddForeignKey
ALTER TABLE "EclipseTracker" ADD CONSTRAINT "EclipseTracker_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseTrackerDetection" ADD CONSTRAINT "EclipseTrackerDetection_trackerId_fkey" FOREIGN KEY ("trackerId") REFERENCES "EclipseTracker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseTrackerDetection" ADD CONSTRAINT "EclipseTrackerDetection_detectionId_fkey" FOREIGN KEY ("detectionId") REFERENCES "EclipseDetection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseDetection" ADD CONSTRAINT "EclipseDetection_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseDetection" ADD CONSTRAINT "EclipseDetection_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "EclipseDataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseSensitiveData" ADD CONSTRAINT "EclipseSensitiveData_detectionId_fkey" FOREIGN KEY ("detectionId") REFERENCES "EclipseDetection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseDataSource" ADD CONSTRAINT "EclipseDataSource_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseSourceMetrics" ADD CONSTRAINT "EclipseSourceMetrics_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "EclipseDataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseCrawlJob" ADD CONSTRAINT "EclipseCrawlJob_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseCrawlResult" ADD CONSTRAINT "EclipseCrawlResult_crawlJobId_fkey" FOREIGN KEY ("crawlJobId") REFERENCES "EclipseCrawlJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseScreenshot" ADD CONSTRAINT "EclipseScreenshot_crawlJobId_fkey" FOREIGN KEY ("crawlJobId") REFERENCES "EclipseCrawlJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseCorrelation" ADD CONSTRAINT "EclipseCorrelation_detectionId_fkey" FOREIGN KEY ("detectionId") REFERENCES "EclipseDetection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseInfringement" ADD CONSTRAINT "EclipseInfringement_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseInfringement" ADD CONSTRAINT "EclipseInfringement_detectionId_fkey" FOREIGN KEY ("detectionId") REFERENCES "EclipseDetection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseSavedSearch" ADD CONSTRAINT "EclipseSavedSearch_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseReport" ADD CONSTRAINT "EclipseReport_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseScheduledReport" ADD CONSTRAINT "EclipseScheduledReport_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EclipseConfig" ADD CONSTRAINT "EclipseConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
