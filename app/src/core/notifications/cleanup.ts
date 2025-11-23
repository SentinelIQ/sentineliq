import { prisma } from 'wasp/server';
import { createLogger } from '../logs/logger';
import { cleanupOldDeliveryLogs } from './deliveryService';

const logger = createLogger('notification-cleanup');

/**
 * Cleanup old notifications (90 days retention policy)
 */
export async function cleanupOldNotifications() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  logger.info('Starting cleanup of old notifications', {
    cutoffDate: ninetyDaysAgo,
  });

  try {
    // Delete old notifications
    const notificationsResult = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    logger.info(`Deleted ${notificationsResult.count} old notifications`);

    // Clean up old delivery logs
    const deliveryLogsDeleted = await cleanupOldDeliveryLogs();

    logger.info('Notification cleanup completed', {
      notificationsDeleted: notificationsResult.count,
      deliveryLogsDeleted,
    });

    return {
      success: true,
      notificationsDeleted: notificationsResult.count,
      deliveryLogsDeleted,
    };
  } catch (error: any) {
    logger.error('Failed to cleanup old notifications', {
      error: error.message,
    });
    throw error;
  }
}
