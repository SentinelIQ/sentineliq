import type { WorkspaceEvent, NotificationData } from './types';
import { ProviderRegistry } from './providers';
import { createLogger } from '../logs/logger';
import { prisma } from 'wasp/server';
import { notificationEventBus } from './eventBus';
import { logDeliveryAttempt, markDeliverySuccess, markDeliveryFailed } from './deliveryService';
import { sendPushNotification } from './pushService';

const logger = createLogger('notifier');

/**
 * Register the notification handler with the event bus
 */
export function registerNotificationHandler(eventBus: any) {
  eventBus.onAny(async (event: WorkspaceEvent) => {
    // Only create notifications if notification data is provided
    if (!event.notificationData) {
      return;
    }

    try {
      await sendNotifications(event);
    } catch (error: any) {
      logger.error('Failed to send notifications', {
        error: error.message,
        event: event.eventType,
      });
    }
  });
}

/**
 * Send notifications for a workspace event
 */
async function sendNotifications(event: WorkspaceEvent) {
  const { workspaceId, userId, eventType, notificationData } = event;

  if (!notificationData) return;

  // 1. Create in-app notification for relevant users
  await createInAppNotifications(workspaceId, userId, eventType, notificationData!);

  // 2. Get configured notification providers for this workspace
  const providers = await prisma.notificationProvider.findMany({
    where: {
      workspaceId,
      isEnabled: true,
      eventTypes: {
        has: eventType,
      },
    },
  });

  // 3. Send to each configured provider with retry logic
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  const context = {
    workspaceId,
    workspaceName: workspace?.name || 'Unknown',
    eventType,
    eventData: event.data,
  };

  for (const providerConfig of providers) {
    // Get recipients (workspace members emails)
    const recipients = await getRecipients(workspaceId);

    // Log delivery attempt
    const deliveryLog = await logDeliveryAttempt(
      providerConfig.provider,
      eventType,
      workspaceId,
      userId,
      {
        providerConfig: providerConfig.config,
        notificationData,
        context,
        recipients,
      }
    );

    try {
      const provider = ProviderRegistry.createProvider(
        providerConfig.provider as any,
        providerConfig.config as any
      );

      await provider.send(recipients, notificationData!, context);
      
      await markDeliverySuccess(deliveryLog.id);
      
      logger.info(`Notification sent via ${providerConfig.provider}`, {
        workspaceId,
        eventType,
        provider: providerConfig.provider,
      });
    } catch (error: any) {
      logger.error(`Failed to send notification via ${providerConfig.provider}`, {
        error: error.message,
        workspaceId,
        eventType,
        provider: providerConfig.provider,
      });

      await markDeliveryFailed(deliveryLog.id, error.message);
    }
  }
}

/**
 * Create in-app notifications and send web push
 */
async function createInAppNotifications(
  workspaceId: string,
  userId: string | undefined,
  eventType: string,
  notificationData: NotificationData
) {
  // Get all workspace members
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true },
  });

  // Get user preferences for all members
  const preferences = await prisma.notificationPreference.findMany({
    where: {
      userId: { in: members.map((m: any) => m.userId) },
    },
  });

  const preferencesMap = new Map(preferences.map((p: any) => [p.userId, p]));

  // Users that should receive in-app notifications
  const inAppRecipients: string[] = [];

  // Users that should receive push notifications
  const pushRecipients: string[] = [];

  // Filter members and determine which channels to use
  members.forEach((member: any) => {
    if (member.userId === userId) return; // Skip actor

    const userPrefs: any = preferencesMap.get(member.userId);

    // Check if this event type is disabled
    if (userPrefs && (userPrefs.disabledEventTypes as string[]).includes(eventType)) return;

    // Check Do Not Disturb
    if (
      userPrefs &&
      userPrefs.dndEnabled &&
      isInDndPeriod(userPrefs.dndStartTime, userPrefs.dndEndTime)
    ) {
      return;
    }

    // Check in-app notifications
    if (!userPrefs || userPrefs.inAppEnabled) {
      inAppRecipients.push(member.userId);
    }

    // Check push notifications
    if (userPrefs && userPrefs.pushEnabled) {
      pushRecipients.push(member.userId);
    }
  });

  // Create in-app notifications
  if (inAppRecipients.length > 0) {
    const notifications = inAppRecipients.map((recipientUserId) => ({
      type: notificationData.type as any,
      title: notificationData.title,
      message: notificationData.message,
      link: notificationData.link || undefined,
      userId: recipientUserId,
      workspaceId,
      eventType,
      metadata: notificationData.metadata || undefined,
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    logger.debug(`Created ${notifications.length} in-app notifications`, {
      workspaceId,
      eventType,
    });
  }

  // Send push notifications
  if (pushRecipients.length > 0 && inAppRecipients.length > 0) {
    try {
      // Get the first created notification to send as push
      // (all notifications for same event have same content)
      const firstNotification = await prisma.notification.findFirst({
        where: {
          workspaceId,
          eventType,
          userId: { in: pushRecipients },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (firstNotification) {
        // Send push to all push-enabled recipients
        await Promise.allSettled(
          pushRecipients.map((recipientUserId) =>
            sendPushNotification(recipientUserId, firstNotification)
          )
        );

        logger.debug(`Sent push notifications to ${pushRecipients.length} users`, {
          workspaceId,
          eventType,
        });
      }
    } catch (error: any) {
      logger.error('Failed to send push notifications', {
        error: error.message,
        workspaceId,
        eventType,
        recipientCount: pushRecipients.length,
      });
    }
  }
}

/**
 * Check if current time is within DND period
 */
function isInDndPeriod(startTime: string | null, endTime: string | null): boolean {
  if (!startTime || !endTime) return false;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  // Handle overnight DND (e.g., 22:00 - 08:00)
  if (startTotalMinutes > endTotalMinutes) {
    return currentMinutes >= startTotalMinutes || currentMinutes <= endTotalMinutes;
  }
  
  // Normal DND (e.g., 08:00 - 17:00)
  return currentMinutes >= startTotalMinutes && currentMinutes <= endTotalMinutes;
}

/**
 * Get recipient emails for a workspace
 */
async function getRecipients(workspaceId: string): Promise<string[]> {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { email: true },
      },
    },
  });

  return members
    .map((member: any) => member.user.email)
    .filter((email: any): email is string => email !== null);
}

/**
 * Send a one-off notification (without event bus)
 */
export async function sendDirectNotification(
  workspaceId: string,
  userIds: string[],
  notificationData: NotificationData
) {
  const notifications = userIds.map(userId => ({
    type: notificationData.type as any,
    title: notificationData.title,
    message: notificationData.message,
    link: notificationData.link || undefined,
    userId,
    workspaceId,
    eventType: 'direct',
    metadata: notificationData.metadata || undefined,
  }));

  await prisma.notification.createMany({
    data: notifications,
  });

  logger.info(`Sent direct notification to ${userIds.length} users`, {
    workspaceId,
    title: notificationData.title,
  });
}

// Initialize notification handler on module load
registerNotificationHandler(notificationEventBus);
