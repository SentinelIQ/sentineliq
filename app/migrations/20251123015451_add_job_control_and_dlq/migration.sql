-- CreateTable
CREATE TABLE "WorkspaceSubscriptionHistory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceId" TEXT NOT NULL,
    "fromPlan" TEXT,
    "toPlan" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,

    CONSTRAINT "WorkspaceSubscriptionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureUsageLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobControl" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobName" TEXT NOT NULL,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "pausedAt" TIMESTAMP(3),
    "pausedBy" TEXT,
    "pauseReason" TEXT,
    "cronSchedule" TEXT,
    "originalSchedule" TEXT,
    "scheduleUpdatedAt" TIMESTAMP(3),
    "scheduleUpdatedBy" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JobControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeadLetterQueue" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobName" TEXT NOT NULL,
    "failedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "errorMessage" TEXT NOT NULL,
    "errorStack" TEXT,
    "jobData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "lastRetryAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),

    CONSTRAINT "DeadLetterQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceSubscriptionHistory_workspaceId_createdAt_idx" ON "WorkspaceSubscriptionHistory"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkspaceSubscriptionHistory_toPlan_createdAt_idx" ON "WorkspaceSubscriptionHistory"("toPlan", "createdAt");

-- CreateIndex
CREATE INDEX "WorkspaceSubscriptionHistory_fromPlan_toPlan_createdAt_idx" ON "WorkspaceSubscriptionHistory"("fromPlan", "toPlan", "createdAt");

-- CreateIndex
CREATE INDEX "FeatureUsageLog_workspaceId_timestamp_idx" ON "FeatureUsageLog"("workspaceId", "timestamp");

-- CreateIndex
CREATE INDEX "FeatureUsageLog_featureKey_timestamp_idx" ON "FeatureUsageLog"("featureKey", "timestamp");

-- CreateIndex
CREATE INDEX "FeatureUsageLog_workspaceId_featureKey_timestamp_idx" ON "FeatureUsageLog"("workspaceId", "featureKey", "timestamp");

-- CreateIndex
CREATE INDEX "FeatureUsageLog_action_timestamp_idx" ON "FeatureUsageLog"("action", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "JobControl_jobName_key" ON "JobControl"("jobName");

-- CreateIndex
CREATE INDEX "JobControl_jobName_isPaused_idx" ON "JobControl"("jobName", "isPaused");

-- CreateIndex
CREATE INDEX "DeadLetterQueue_jobName_status_idx" ON "DeadLetterQueue"("jobName", "status");

-- CreateIndex
CREATE INDEX "DeadLetterQueue_status_createdAt_idx" ON "DeadLetterQueue"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DeadLetterQueue_nextRetryAt_idx" ON "DeadLetterQueue"("nextRetryAt");

-- AddForeignKey
ALTER TABLE "WorkspaceSubscriptionHistory" ADD CONSTRAINT "WorkspaceSubscriptionHistory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureUsageLog" ADD CONSTRAINT "FeatureUsageLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
