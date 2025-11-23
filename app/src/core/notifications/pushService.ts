/**
 * Web Push Notification Service
 * Handles sending push notifications using the Web Push API
 */

import webpush from 'web-push';
import { prisma } from 'wasp/server';
import type { Notification, PushSubscription } from '@prisma/client';
import { createLogger } from '../logs/logger';

const logger = createLogger('push-service');

/**
 * Initialize VAPID details for web-push
 * Must be called before sending notifications
 */
export function setupVapid() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@sentineliq.com.br';

  if (!vapidPublicKey || !vapidPrivateKey) {
    logger.warn('VAPID keys not configured. Push notifications will not work.');
    logger.info('Generate keys with: npx web-push generate-vapid-keys');
    return false;
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  logger.info('VAPID configured successfully');
  return true;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotification(
  userId: string,
  notification: Notification
): Promise<void> {
  try {
    // Get all active push subscriptions for this user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId,
        workspace: {
          isActive: true,
        },
      },
    });

    if (subscriptions.length === 0) {
      logger.debug(`No push subscriptions found for user ${userId}`);
      return;
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: notification.id,
      data: {
        notificationId: notification.id,
        url: notification.link || '/notifications',
        type: notification.type,
        createdAt: notification.createdAt.toISOString(),
      },
      requireInteraction: notification.type === 'CRITICAL',
    });

    // Send to all subscriptions (multiple devices)
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys as { p256dh: string; auth: string },
            },
            payload,
            {
              TTL: 60 * 60 * 24, // 24 hours
            }
          );

          // Update last used timestamp
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { lastUsedAt: new Date() },
          });

          logger.debug(`Push sent successfully to subscription ${sub.id}`);
        } catch (error: any) {
          // Handle expired or invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            logger.info(`Subscription ${sub.id} expired or invalid, removing...`);
            await prisma.pushSubscription.delete({
              where: { id: sub.id },
            });
          } else {
            logger.error(`Failed to send push to subscription ${sub.id}`, {
              error: error.message,
              statusCode: error.statusCode,
            });
            throw error;
          }
        }
      })
    );

    // Log results
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    logger.info(`Push notification sent to user ${userId}`, {
      totalSubscriptions: subscriptions.length,
      successful,
      failed,
      notificationId: notification.id,
    });
  } catch (error: any) {
    logger.error(`Failed to send push notification`, {
      userId,
      notificationId: notification.id,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationBatch(
  userIds: string[],
  notification: Notification
): Promise<void> {
  await Promise.allSettled(
    userIds.map((userId) => sendPushNotification(userId, notification))
  );
}

/**
 * Cleanup expired push subscriptions
 * Should be run periodically (e.g., daily job)
 */
export async function cleanupExpiredPushSubscriptions(): Promise<number> {
  try {
    // Delete subscriptions not used in the last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = await prisma.pushSubscription.deleteMany({
      where: {
        lastUsedAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} expired push subscriptions`);
    return result.count;
  } catch (error: any) {
    logger.error('Failed to cleanup expired push subscriptions', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get push subscription statistics
 */
export async function getPushSubscriptionStats(): Promise<{
  total: number;
  byWorkspace: Record<string, number>;
  active: number; // Used in last 30 days
}> {
  const [total, byWorkspace, active] = await Promise.all([
    prisma.pushSubscription.count(),
    prisma.pushSubscription.groupBy({
      by: ['workspaceId'],
      _count: true,
    }),
    prisma.pushSubscription.count({
      where: {
        lastUsedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    total,
    byWorkspace: byWorkspace.reduce((acc, item) => {
      acc[item.workspaceId] = item._count;
      return acc;
    }, {} as Record<string, number>),
    active,
  };
}

// Initialize VAPID on module load
setupVapid();
