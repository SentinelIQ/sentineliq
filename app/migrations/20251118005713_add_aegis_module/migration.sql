-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('ACTIVE', 'INVESTIGATING', 'CONTAINMENT', 'ERADICATION', 'RECOVERY', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('ACTIVE', 'REVIEW', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ObservableType" AS ENUM ('IP', 'DOMAIN', 'URL', 'HASH_MD5', 'HASH_SHA1', 'HASH_SHA256', 'EMAIL', 'FILE', 'REGISTRY', 'USER_AGENT', 'OTHER');

-- CreateEnum
CREATE TYPE "TLP" AS ENUM ('WHITE', 'GREEN', 'AMBER', 'RED');

-- CreateEnum
CREATE TYPE "PAP" AS ENUM ('WHITE', 'GREEN', 'AMBER', 'RED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('EMAIL', 'NETWORK', 'FILE', 'LOG', 'SCREENSHOT', 'MEMORY_DUMP', 'DISK_IMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('COLLECTED', 'ANALYZED', 'QUARANTINED', 'PRESERVED', 'DELETED');

-- CreateEnum
CREATE TYPE "HashAlgorithm" AS ENUM ('MD5', 'SHA1', 'SHA256');

-- CreateEnum
CREATE TYPE "CustodyAction" AS ENUM ('COLLECTED', 'TRANSFERRED', 'ANALYZED', 'STORED', 'RETURNED', 'ACCESSED', 'MODIFIED', 'DELETED', 'PRESERVED', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'ALERT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'ALERT_ESCALATED';
ALTER TYPE "AuditAction" ADD VALUE 'INCIDENT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'INCIDENT_RESOLVED';
ALTER TYPE "AuditAction" ADD VALUE 'CASE_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CASE_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'CASE_CLOSED';
ALTER TYPE "AuditAction" ADD VALUE 'EVIDENCE_UPLOADED';
ALTER TYPE "AuditAction" ADD VALUE 'EVIDENCE_ACCESSED';

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'NEW',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,
    "threatScore" INTEGER,
    "affectedAssets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "threatAnalysis" JSONB,
    "technicalDetails" JSONB,
    "metadata" JSONB,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "slaDeadline" TIMESTAMP(3),
    "slaBreached" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" TEXT,
    "team" TEXT,
    "affectedSystems" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "progress" INTEGER NOT NULL DEFAULT 0,
    "playbookId" TEXT,
    "playbookData" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "resolutionSummary" TEXT,
    "metadata" JSONB,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "CaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "caseType" TEXT,
    "confidentiality" TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
    "investigatorId" TEXT,
    "team" TEXT,
    "findings" TEXT,
    "recommendations" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "finalReport" JSONB,
    "templateId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observable" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" "ObservableType" NOT NULL,
    "value" TEXT NOT NULL,
    "dataType" TEXT,
    "tlp" "TLP" NOT NULL DEFAULT 'WHITE',
    "pap" "PAP" NOT NULL DEFAULT 'WHITE',
    "ioc" BOOLEAN NOT NULL DEFAULT false,
    "sighted" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "source" TEXT,
    "createdById" TEXT NOT NULL,
    "enrichment" JSONB,

    CONSTRAINT "Observable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedById" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "hashAlgorithm" "HashAlgorithm" NOT NULL DEFAULT 'SHA256',
    "status" "EvidenceStatus" NOT NULL DEFAULT 'COLLECTED',
    "location" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fileUrl" TEXT,
    "metadata" JSONB,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustodyLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidenceId" TEXT NOT NULL,
    "action" "CustodyAction" NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "notes" TEXT,
    "previousHash" TEXT,
    "currentHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "device" TEXT,
    "signature" TEXT,

    CONSTRAINT "CustodyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'WAITING',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "assigneeId" TEXT,
    "incidentId" TEXT,
    "caseId" TEXT,
    "group" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "dependencies" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TTP" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caseId" TEXT NOT NULL,
    "tacticId" TEXT NOT NULL,
    "tacticName" TEXT NOT NULL,
    "techniqueId" TEXT NOT NULL,
    "techniqueName" TEXT NOT NULL,
    "subtechniqueId" TEXT,
    "subtechniqueName" TEXT,
    "description" TEXT,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "detectedAt" TIMESTAMP(3),

    CONSTRAINT "TTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "TimelineEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "alertId" TEXT,
    "incidentId" TEXT,
    "caseId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestigationNote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "incidentId" TEXT,
    "caseId" TEXT,

    CONSTRAINT "InvestigationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AlertToObservable" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AlertToIncident" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_IncidentToObservable" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_IncidentToCase" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CaseToObservable" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ObservableToEvidence" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Alert_workspaceId_status_createdAt_idx" ON "Alert"("workspaceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Alert_severity_status_idx" ON "Alert"("severity", "status");

-- CreateIndex
CREATE INDEX "Alert_assignedToId_idx" ON "Alert"("assignedToId");

-- CreateIndex
CREATE INDEX "Incident_workspaceId_status_createdAt_idx" ON "Incident"("workspaceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Incident_severity_status_idx" ON "Incident"("severity", "status");

-- CreateIndex
CREATE INDEX "Incident_assignedToId_idx" ON "Incident"("assignedToId");

-- CreateIndex
CREATE INDEX "Incident_slaDeadline_idx" ON "Incident"("slaDeadline");

-- CreateIndex
CREATE INDEX "Case_workspaceId_status_createdAt_idx" ON "Case"("workspaceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Case_priority_status_idx" ON "Case"("priority", "status");

-- CreateIndex
CREATE INDEX "Case_investigatorId_idx" ON "Case"("investigatorId");

-- CreateIndex
CREATE INDEX "Observable_workspaceId_type_idx" ON "Observable"("workspaceId", "type");

-- CreateIndex
CREATE INDEX "Observable_value_idx" ON "Observable"("value");

-- CreateIndex
CREATE INDEX "Observable_ioc_sighted_idx" ON "Observable"("ioc", "sighted");

-- CreateIndex
CREATE INDEX "Evidence_caseId_createdAt_idx" ON "Evidence"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "Evidence_status_idx" ON "Evidence"("status");

-- CreateIndex
CREATE INDEX "CustodyLog_evidenceId_createdAt_idx" ON "CustodyLog"("evidenceId", "createdAt");

-- CreateIndex
CREATE INDEX "Task_incidentId_idx" ON "Task"("incidentId");

-- CreateIndex
CREATE INDEX "Task_caseId_idx" ON "Task"("caseId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "TTP_caseId_idx" ON "TTP"("caseId");

-- CreateIndex
CREATE INDEX "TTP_tacticId_techniqueId_idx" ON "TTP"("tacticId", "techniqueId");

-- CreateIndex
CREATE INDEX "TimelineEvent_alertId_timestamp_idx" ON "TimelineEvent"("alertId", "timestamp");

-- CreateIndex
CREATE INDEX "TimelineEvent_incidentId_timestamp_idx" ON "TimelineEvent"("incidentId", "timestamp");

-- CreateIndex
CREATE INDEX "TimelineEvent_caseId_timestamp_idx" ON "TimelineEvent"("caseId", "timestamp");

-- CreateIndex
CREATE INDEX "InvestigationNote_incidentId_createdAt_idx" ON "InvestigationNote"("incidentId", "createdAt");

-- CreateIndex
CREATE INDEX "InvestigationNote_caseId_createdAt_idx" ON "InvestigationNote"("caseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_AlertToObservable_AB_unique" ON "_AlertToObservable"("A", "B");

-- CreateIndex
CREATE INDEX "_AlertToObservable_B_index" ON "_AlertToObservable"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlertToIncident_AB_unique" ON "_AlertToIncident"("A", "B");

-- CreateIndex
CREATE INDEX "_AlertToIncident_B_index" ON "_AlertToIncident"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_IncidentToObservable_AB_unique" ON "_IncidentToObservable"("A", "B");

-- CreateIndex
CREATE INDEX "_IncidentToObservable_B_index" ON "_IncidentToObservable"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_IncidentToCase_AB_unique" ON "_IncidentToCase"("A", "B");

-- CreateIndex
CREATE INDEX "_IncidentToCase_B_index" ON "_IncidentToCase"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CaseToObservable_AB_unique" ON "_CaseToObservable"("A", "B");

-- CreateIndex
CREATE INDEX "_CaseToObservable_B_index" ON "_CaseToObservable"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ObservableToEvidence_AB_unique" ON "_ObservableToEvidence"("A", "B");

-- CreateIndex
CREATE INDEX "_ObservableToEvidence_B_index" ON "_ObservableToEvidence"("B");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_investigatorId_fkey" FOREIGN KEY ("investigatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observable" ADD CONSTRAINT "Observable_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observable" ADD CONSTRAINT "Observable_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyLog" ADD CONSTRAINT "CustodyLog_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyLog" ADD CONSTRAINT "CustodyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TTP" ADD CONSTRAINT "TTP_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationNote" ADD CONSTRAINT "InvestigationNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationNote" ADD CONSTRAINT "InvestigationNote_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationNote" ADD CONSTRAINT "InvestigationNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlertToObservable" ADD CONSTRAINT "_AlertToObservable_A_fkey" FOREIGN KEY ("A") REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlertToObservable" ADD CONSTRAINT "_AlertToObservable_B_fkey" FOREIGN KEY ("B") REFERENCES "Observable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlertToIncident" ADD CONSTRAINT "_AlertToIncident_A_fkey" FOREIGN KEY ("A") REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlertToIncident" ADD CONSTRAINT "_AlertToIncident_B_fkey" FOREIGN KEY ("B") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IncidentToObservable" ADD CONSTRAINT "_IncidentToObservable_A_fkey" FOREIGN KEY ("A") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IncidentToObservable" ADD CONSTRAINT "_IncidentToObservable_B_fkey" FOREIGN KEY ("B") REFERENCES "Observable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IncidentToCase" ADD CONSTRAINT "_IncidentToCase_A_fkey" FOREIGN KEY ("A") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IncidentToCase" ADD CONSTRAINT "_IncidentToCase_B_fkey" FOREIGN KEY ("B") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CaseToObservable" ADD CONSTRAINT "_CaseToObservable_A_fkey" FOREIGN KEY ("A") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CaseToObservable" ADD CONSTRAINT "_CaseToObservable_B_fkey" FOREIGN KEY ("B") REFERENCES "Observable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObservableToEvidence" ADD CONSTRAINT "_ObservableToEvidence_A_fkey" FOREIGN KEY ("A") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObservableToEvidence" ADD CONSTRAINT "_ObservableToEvidence_B_fkey" FOREIGN KEY ("B") REFERENCES "Observable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
