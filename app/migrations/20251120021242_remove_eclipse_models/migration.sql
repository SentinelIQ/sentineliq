/*
  Warnings:

  - You are about to drop the `EclipseConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EclipseCrawlJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EclipseCrawlResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EclipseDataSource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EclipseDetection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EclipseInfringement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EclipseReport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EclipseSavedSearch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EclipseScheduledReport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EclipseScreenshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EclipseSensitiveData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EclipseSourceMetrics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EclipseTracker` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EclipseTrackerDetection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EclipseConfig" DROP CONSTRAINT "EclipseConfig_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseCrawlJob" DROP CONSTRAINT "EclipseCrawlJob_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseCrawlResult" DROP CONSTRAINT "EclipseCrawlResult_crawlJobId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseDataSource" DROP CONSTRAINT "EclipseDataSource_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseDetection" DROP CONSTRAINT "EclipseDetection_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseDetection" DROP CONSTRAINT "EclipseDetection_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseInfringement" DROP CONSTRAINT "EclipseInfringement_detectionId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseInfringement" DROP CONSTRAINT "EclipseInfringement_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseReport" DROP CONSTRAINT "EclipseReport_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseSavedSearch" DROP CONSTRAINT "EclipseSavedSearch_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseScheduledReport" DROP CONSTRAINT "EclipseScheduledReport_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseScreenshot" DROP CONSTRAINT "EclipseScreenshot_crawlJobId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseSensitiveData" DROP CONSTRAINT "EclipseSensitiveData_detectionId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseSourceMetrics" DROP CONSTRAINT "EclipseSourceMetrics_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseTracker" DROP CONSTRAINT "EclipseTracker_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseTrackerDetection" DROP CONSTRAINT "EclipseTrackerDetection_detectionId_fkey";

-- DropForeignKey
ALTER TABLE "EclipseTrackerDetection" DROP CONSTRAINT "EclipseTrackerDetection_trackerId_fkey";

-- DropTable
DROP TABLE "EclipseConfig";

-- DropTable
DROP TABLE "EclipseCrawlJob";

-- DropTable
DROP TABLE "EclipseCrawlResult";

-- DropTable
DROP TABLE "EclipseDataSource";

-- DropTable
DROP TABLE "EclipseDetection";

-- DropTable
DROP TABLE "EclipseInfringement";

-- DropTable
DROP TABLE "EclipseReport";

-- DropTable
DROP TABLE "EclipseSavedSearch";

-- DropTable
DROP TABLE "EclipseScheduledReport";

-- DropTable
DROP TABLE "EclipseScreenshot";

-- DropTable
DROP TABLE "EclipseSensitiveData";

-- DropTable
DROP TABLE "EclipseSourceMetrics";

-- DropTable
DROP TABLE "EclipseTracker";

-- DropTable
DROP TABLE "EclipseTrackerDetection";

-- DropEnum
DROP TYPE "EclipseCrawlStatus";

-- DropEnum
DROP TYPE "EclipseDetectionStatus";

-- DropEnum
DROP TYPE "EclipseInfringementStatus";

-- DropEnum
DROP TYPE "EclipseInfringementType";

-- DropEnum
DROP TYPE "EclipseReportFrequency";

-- DropEnum
DROP TYPE "EclipseReportType";

-- DropEnum
DROP TYPE "EclipseSensitiveDataType";

-- DropEnum
DROP TYPE "EclipseSourceType";

-- DropEnum
DROP TYPE "EclipseTrackerType";
