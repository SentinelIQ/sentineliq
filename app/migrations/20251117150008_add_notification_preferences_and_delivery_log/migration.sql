-- CreateEnum
CREATE TYPE "DigestFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'RETRYING', 'MAX_RETRIES_REACHED');

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "disabledEventTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "slackEnabled" BOOLEAN NOT NULL DEFAULT true,
    "discordEnabled" BOOLEAN NOT NULL DEFAULT true,
    "webhookEnabled" BOOLEAN NOT NULL DEFAULT true,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT true,
    "teamsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "digestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "digestFrequency" "DigestFrequency" NOT NULL DEFAULT 'DAILY',
    "digestTime" TEXT NOT NULL DEFAULT '09:00',
    "lastDigestSentAt" TIMESTAMP(3),
    "dndEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dndStartTime" TEXT,
    "dndEndTime" TEXT,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDeliveryLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notificationId" TEXT,
    "provider" "NotificationProviderType" NOT NULL,
    "eventType" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "lastAttemptAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "payload" JSONB,

    CONSTRAINT "NotificationDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationDeliveryLog_status_nextRetryAt_idx" ON "NotificationDeliveryLog"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "NotificationDeliveryLog_workspaceId_provider_idx" ON "NotificationDeliveryLog"("workspaceId", "provider");

-- CreateIndex
CREATE INDEX "NotificationDeliveryLog_createdAt_idx" ON "NotificationDeliveryLog"("createdAt");

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
