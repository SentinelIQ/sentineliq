import { prisma } from 'wasp/server';
import { createLogger } from '../logs/logger';
import { ProviderRegistry } from './providers';
import type { NotificationData } from './types';

const logger = createLogger('notification-retry');

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS = [60, 300, 900]; // 1 min, 5 min, 15 min (in seconds)

/**
 * Log notification delivery attempt
 */
export async function logDeliveryAttempt(
  provider: string,
  eventType: string,
  workspaceId: string,
  userId: string | undefined,
  payload: any,
  notificationId?: string
) {
  return await prisma.notificationDeliveryLog.create({
    data: {
      notificationId,
      provider: provider as any,
      eventType,
      workspaceId,
      userId,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      payload,
    },
  });
}

/**
 * Mark delivery as successful
 */
export async function markDeliverySuccess(logId: string) {
  await prisma.notificationDeliveryLog.update({
    where: { id: logId },
    data: {
      status: 'SENT',
      deliveredAt: new Date(),
    },
  });
}

/**
 * Mark delivery as failed and schedule retry
 */
export async function markDeliveryFailed(logId: string, error: string) {
  const log = await prisma.notificationDeliveryLog.findUnique({
    where: { id: logId },
  });

  if (!log) return;

  const newAttempts = log.attempts + 1;
  const hasMoreRetries = newAttempts < log.maxAttempts;

  const updateData: any = {
    attempts: newAttempts,
    lastError: error,
    lastAttemptAt: new Date(),
  };

  if (hasMoreRetries) {
    // Schedule next retry
    const delaySeconds = RETRY_DELAYS[newAttempts - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
    updateData.status = 'RETRYING';
    updateData.nextRetryAt = new Date(Date.now() + delaySeconds * 1000);

    logger.info('Scheduling delivery retry', {
      logId,
      attempt: newAttempts,
      maxAttempts: log.maxAttempts,
      nextRetryIn: `${delaySeconds}s`,
    });
  } else {
    // Max retries reached
    updateData.status = 'MAX_RETRIES_REACHED';

    logger.error('Max delivery retries reached', {
      logId,
      provider: log.provider,
      workspaceId: log.workspaceId,
      error,
    });

    // TODO: Send alert to admin about failed delivery
  }

  await prisma.notificationDeliveryLog.update({
    where: { id: logId },
    data: updateData,
  });
}

/**
 * Process pending retries
 */
export async function processPendingRetries() {
  const now = new Date();

  // Find logs that need retry
  const logsToRetry = await prisma.notificationDeliveryLog.findMany({
    where: {
      status: 'RETRYING',
      nextRetryAt: {
        lte: now,
      },
    },
    take: 100, // Process 100 at a time
  });

  logger.info(`Found ${logsToRetry.length} notifications to retry`);

  for (const log of logsToRetry) {
    try {
      await retryDelivery(log);
    } catch (error: any) {
      logger.error('Failed to process retry', {
        logId: log.id,
        error: error.message,
      });
    }
  }

  return logsToRetry.length;
}

/**
 * Retry a specific delivery
 */
async function retryDelivery(log: any) {
  logger.info('Retrying notification delivery', {
    logId: log.id,
    provider: log.provider,
    attempt: log.attempts + 1,
  });

  try {
    const provider = ProviderRegistry.createProvider(
      log.provider,
      log.payload.providerConfig
    );

    const notificationData: NotificationData = log.payload.notificationData;
    const context = log.payload.context;
    const recipients = log.payload.recipients;

    await provider.send(recipients, notificationData, context);

    await markDeliverySuccess(log.id);

    logger.info('Retry successful', {
      logId: log.id,
      provider: log.provider,
    });
  } catch (error: any) {
    logger.error('Retry failed', {
      logId: log.id,
      provider: log.provider,
      error: error.message,
    });

    await markDeliveryFailed(log.id, error.message);
  }
}

/**
 * Get delivery stats for a workspace
 */
export async function getDeliveryStats(workspaceId: string, days: number = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const stats = await prisma.notificationDeliveryLog.groupBy({
    by: ['provider', 'status'],
    where: {
      workspaceId,
      createdAt: {
        gte: since,
      },
    },
    _count: true,
  });

  const formatted: any = {};

  for (const stat of stats) {
    if (!formatted[stat.provider]) {
      formatted[stat.provider] = {
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
        retrying: 0,
      };
    }

    formatted[stat.provider].total += stat._count;

    switch (stat.status) {
      case 'SENT':
        formatted[stat.provider].sent += stat._count;
        break;
      case 'FAILED':
      case 'MAX_RETRIES_REACHED':
        formatted[stat.provider].failed += stat._count;
        break;
      case 'PENDING':
        formatted[stat.provider].pending += stat._count;
        break;
      case 'RETRYING':
        formatted[stat.provider].retrying += stat._count;
        break;
    }
  }

  return formatted;
}

/**
 * Clean up old delivery logs (keep for 30 days)
 */
export async function cleanupOldDeliveryLogs() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.notificationDeliveryLog.deleteMany({
    where: {
      createdAt: {
        lt: thirtyDaysAgo,
      },
    },
  });

  logger.info(`Cleaned up ${result.count} old delivery logs`);

  return result.count;
}
