import { HttpError } from 'wasp/server';
import type { NotificationFilter, NotificationQueryResult, NotificationProviderConfig } from './types';
import * as z from 'zod';

/**
 * Get WebSocket server instance (lazy loaded to avoid circular dependencies)
 * Returns null if server is not available
 */
function getWebSocketServer(): any {
  try {
    // Use global variable set by server initialization
    return (global as any).__notificationWebSocketServer || null;
  } catch (e) {
    return null;
  }
}

// ✅ Validation schemas for different provider configurations
const slackConfigSchema = z.object({
  webhookUrl: z.string().url('Invalid Slack webhook URL'),
  channel: z.string().optional(),
});

const emailConfigSchema = z.object({
  recipients: z.array(z.string().email('Invalid email address')).min(1, 'At least one recipient required'),
  subject: z.string().optional(),
});

const webhookConfigSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  headers: z.record(z.string()).optional(),
  method: z.enum(['POST', 'PUT']).default('POST'),
});

const discordConfigSchema = z.object({
  webhookUrl: z.string().url('Invalid Discord webhook URL'),
  username: z.string().optional(),
});

/**
 * Validate provider config based on provider type
 */
function validateProviderConfig(provider: string, config: any): void {
  let schema: z.ZodSchema;
  
  switch (provider) {
    case 'slack':
      schema = slackConfigSchema;
      break;
    case 'email':
      schema = emailConfigSchema;
      break;
    case 'webhook':
      schema = webhookConfigSchema;
      break;
    case 'discord':
      schema = discordConfigSchema;
      break;
    default:
      throw new HttpError(400, `Unknown provider type: ${provider}`);
  }
  
  try {
    schema.parse(config);
  } catch (error: any) {
    const errorMessages = error.errors?.map((e: any) => e.message).join(', ') || 'Invalid configuration';
    throw new HttpError(400, `Invalid ${provider} configuration: ${errorMessages}`);
  }
}

/**
 * Get notifications for current user
 */
export const getNotifications = async (args: NotificationFilter, context: any): Promise<NotificationQueryResult> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const {
    workspaceId,
    isRead,
    type,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = args || {};

  const where: any = {
    userId: context.user.id,
  };

  if (workspaceId) {
    where.workspaceId = workspaceId;
  }

  if (typeof isRead === 'boolean') {
    where.isRead = isRead;
  }

  if (type) {
    where.type = type;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const [notifications, total] = await Promise.all([
    context.entities.Notification.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    }),
    context.entities.Notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    hasMore: offset + notifications.length < total,
  };
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (_args: void, context: any): Promise<number> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  return context.entities.Notification.count({
    where: {
      userId: context.user.id,
      isRead: false,
    },
  });
};

/**
 * Mark notification as read
 */
export const markAsRead = async (args: { id: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const notification = await context.entities.Notification.findUnique({
    where: { id: args.id },
  });

  if (!notification) {
    throw new HttpError(404, 'Notification not found');
  }

  if (notification.userId !== context.user.id) {
    throw new HttpError(403, 'Not authorized to mark this notification as read');
  }

  const updated = await context.entities.Notification.update({
    where: { id: args.id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  // Notify WebSocket clients about the read status
  const wsServer = getWebSocketServer();
  if (wsServer) {
    try {
      wsServer.notifyMarkAsRead(context.user.id, notification.workspaceId, args.id);
    } catch (error: any) {
      // WebSocket notification failed, but database update succeeded
      console.error('Failed to notify WebSocket clients:', error.message);
    }
  }

  return updated;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (args: { workspaceId?: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const where: any = {
    userId: context.user.id,
    isRead: false,
  };

  if (args.workspaceId) {
    where.workspaceId = args.workspaceId;
  }

  const result = await context.entities.Notification.updateMany({
    where,
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  // Notify WebSocket clients about updated unread count
  const wsServer = getWebSocketServer();
  if (args.workspaceId && wsServer) {
    try {
      await wsServer.notifyUnreadCount(context.user.id, args.workspaceId);
    } catch (error: any) {
      console.error('Failed to notify WebSocket clients:', error.message);
    }
  }

  return result;
};

/**
 * Get notification providers for a workspace
 */
export const getNotificationProviders = async (args: { workspaceId: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  // Verify user has access to workspace
  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: context.user.id,
      workspaceId: args.workspaceId,
    },
  });

  if (!membership) {
    throw new HttpError(403, 'You do not have access to this workspace');
  }

  return context.entities.NotificationProvider.findMany({
    where: {
      workspaceId: args.workspaceId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

/**
 * Save notification provider configuration
 */
export const saveNotificationProvider = async (args: NotificationProviderConfig, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  // Verify user is admin or owner of workspace
  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: context.user.id,
      workspaceId: args.workspaceId,
      role: {
        in: ['OWNER', 'ADMIN'],
      },
    },
  });

  if (!membership) {
    throw new HttpError(403, 'You must be an admin or owner to configure notification providers');
  }

  // ✅ Validate provider configuration with Zod
  validateProviderConfig(args.provider, args.config);

  // Upsert provider
  return context.entities.NotificationProvider.upsert({
    where: {
      workspaceId_provider: {
        workspaceId: args.workspaceId,
        provider: args.provider,
      },
    },
    create: {
      workspaceId: args.workspaceId,
      provider: args.provider,
      isEnabled: args.isEnabled,
      config: args.config,
      eventTypes: args.eventTypes,
    },
    update: {
      isEnabled: args.isEnabled,
      config: args.config,
      eventTypes: args.eventTypes,
    },
  });
};

/**
 * Toggle notification provider on/off
 */
export const toggleNotificationProvider = async (args: { id: string; isEnabled: boolean }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const provider = await context.entities.NotificationProvider.findUnique({
    where: { id: args.id },
  });

  if (!provider) {
    throw new HttpError(404, 'Notification provider not found');
  }

  // Verify user is admin or owner of workspace
  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: context.user.id,
      workspaceId: provider.workspaceId,
      role: {
        in: ['OWNER', 'ADMIN'],
      },
    },
  });

  if (!membership) {
    throw new HttpError(403, 'You must be an admin or owner to toggle notification providers');
  }

  return context.entities.NotificationProvider.update({
    where: { id: args.id },
    data: {
      isEnabled: args.isEnabled,
    },
  });
};

/**
 * Delete notification provider
 */
export const deleteNotificationProvider = async (args: { id: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const provider = await context.entities.NotificationProvider.findUnique({
    where: { id: args.id },
  });

  if (!provider) {
    throw new HttpError(404, 'Notification provider not found');
  }

  // Verify user is admin or owner of workspace
  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: context.user.id,
      workspaceId: provider.workspaceId,
      role: {
        in: ['OWNER', 'ADMIN'],
      },
    },
  });

  if (!membership) {
    throw new HttpError(403, 'You must be an admin or owner to delete notification providers');
  }

  return context.entities.NotificationProvider.delete({
    where: { id: args.id },
  });
};

/**
 * Delete notification
 */
export const deleteNotification = async (args: { id: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const notification = await context.entities.Notification.findUnique({
    where: { id: args.id },
  });

  if (!notification) {
    throw new HttpError(404, 'Notification not found');
  }

  if (notification.userId !== context.user.id) {
    throw new HttpError(403, 'Not authorized to delete this notification');
  }

  await context.entities.Notification.delete({
    where: { id: args.id },
  });

  // Update unread count via WebSocket
  const wsServer = getWebSocketServer();
  if (wsServer) {
    try {
      await wsServer.notifyUnreadCount(context.user.id, notification.workspaceId);
    } catch (error: any) {
      console.error('Failed to notify WebSocket clients:', error.message);
    }
  }

  return { success: true };
};

/**
 * Delete all notifications for current user
 */
export const deleteAllNotifications = async (args: { workspaceId?: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const where: any = {
    userId: context.user.id,
  };

  if (args.workspaceId) {
    where.workspaceId = args.workspaceId;
  }

  const result = await context.entities.Notification.deleteMany({
    where,
  });

  // Update unread count via WebSocket
  const wsServer = getWebSocketServer();
  if (args.workspaceId && wsServer) {
    try {
      await wsServer.notifyUnreadCount(context.user.id, args.workspaceId);
    } catch (error: any) {
      console.error('Failed to notify WebSocket clients:', error.message);
    }
  }

  return { deleted: result.count };
};

/**
 * Get notification preferences for current user
 */
export const getNotificationPreferences = async (_args: void, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  let preferences = await context.entities.NotificationPreference.findUnique({
    where: { userId: context.user.id },
  });

  // Create default preferences if they don't exist
  if (!preferences) {
    preferences = await context.entities.NotificationPreference.create({
      data: {
        userId: context.user.id,
      },
    });
  }

  return preferences;
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const {
    emailEnabled,
    inAppEnabled,
    disabledEventTypes,
    slackEnabled,
    discordEnabled,
    webhookEnabled,
    telegramEnabled,
    teamsEnabled,
    digestEnabled,
    digestFrequency,
    digestTime,
    dndEnabled,
    dndStartTime,
    dndEndTime,
  } = args;

  // Validate digest time format (HH:mm)
  if (digestTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(digestTime)) {
    throw new HttpError(400, 'Invalid digest time format. Use HH:mm (e.g., 09:00)');
  }

  // Validate DND times
  if (dndEnabled) {
    if (dndStartTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(dndStartTime)) {
      throw new HttpError(400, 'Invalid DND start time format. Use HH:mm');
    }
    if (dndEndTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(dndEndTime)) {
      throw new HttpError(400, 'Invalid DND end time format. Use HH:mm');
    }
  }

  const preferences = await context.entities.NotificationPreference.upsert({
    where: { userId: context.user.id },
    create: {
      userId: context.user.id,
      emailEnabled,
      inAppEnabled,
      disabledEventTypes,
      slackEnabled,
      discordEnabled,
      webhookEnabled,
      telegramEnabled,
      teamsEnabled,
      digestEnabled,
      digestFrequency,
      digestTime,
      dndEnabled,
      dndStartTime,
      dndEndTime,
    },
    update: {
      emailEnabled,
      inAppEnabled,
      disabledEventTypes,
      slackEnabled,
      discordEnabled,
      webhookEnabled,
      telegramEnabled,
      teamsEnabled,
      digestEnabled,
      digestFrequency,
      digestTime,
      dndEnabled,
      dndStartTime,
      dndEndTime,
    },
  });

  return preferences;
};

// ============================================
// PUSH NOTIFICATION SUBSCRIPTION OPERATIONS
// ============================================

const pushSubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url('Invalid endpoint URL'),
    keys: z.object({
      p256dh: z.string().min(1, 'p256dh key required'),
      auth: z.string().min(1, 'auth key required'),
    }),
  }),
  userAgent: z.string().optional(),
  deviceName: z.string().optional(),
});

/**
 * Save push notification subscription
 */
export const savePushSubscription = async (
  args: {
    subscription: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
    };
    userAgent?: string;
    deviceName?: string;
  },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const validatedArgs = pushSubscriptionSchema.parse(args);
  const { subscription, userAgent, deviceName } = validatedArgs;

  // Get user's current workspace
  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
    include: { currentWorkspace: true },
  });

  if (!user?.currentWorkspaceId) {
    throw new HttpError(400, 'No active workspace');
  }

  // Check if subscription already exists (upsert by endpoint)
  const existingSub = await context.entities.PushSubscription.findUnique({
    where: { endpoint: subscription.endpoint },
  });

  if (existingSub) {
    // Update existing subscription
    const updated = await context.entities.PushSubscription.update({
      where: { id: existingSub.id },
      data: {
        keys: subscription.keys,
        userAgent: userAgent || existingSub.userAgent,
        deviceName: deviceName || existingSub.deviceName,
        lastUsedAt: new Date(),
      },
    });
    return updated;
  }

  // Create new subscription
  const newSub = await context.entities.PushSubscription.create({
    data: {
      userId: context.user.id,
      workspaceId: user.currentWorkspaceId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent,
      deviceName,
    },
  });

  // Enable push in preferences if first subscription
  await context.entities.NotificationPreference.upsert({
    where: { userId: context.user.id },
    create: {
      userId: context.user.id,
      pushEnabled: true,
    },
    update: {
      pushEnabled: true,
    },
  });

  return newSub;
};

/**
 * Remove push notification subscription
 */
export const removePushSubscription = async (
  args: { endpoint: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { endpoint } = z.object({ endpoint: z.string() }).parse(args);

  const subscription = await context.entities.PushSubscription.findUnique({
    where: { endpoint },
  });

  if (!subscription) {
    throw new HttpError(404, 'Subscription not found');
  }

  if (subscription.userId !== context.user.id) {
    throw new HttpError(403, 'Not authorized to remove this subscription');
  }

  await context.entities.PushSubscription.delete({
    where: { id: subscription.id },
  });

  // Check if user has any remaining subscriptions
  const remainingCount = await context.entities.PushSubscription.count({
    where: { userId: context.user.id },
  });

  // Disable push in preferences if no more subscriptions
  if (remainingCount === 0) {
    await context.entities.NotificationPreference.upsert({
      where: { userId: context.user.id },
      create: {
        userId: context.user.id,
        pushEnabled: false,
      },
      update: {
        pushEnabled: false,
      },
    });
  }

  return { success: true };
};

/**
 * Get user's push subscriptions
 */
export const getPushSubscriptions = async (_args: void, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const subscriptions = await context.entities.PushSubscription.findMany({
    where: {
      userId: context.user.id,
    },
    orderBy: {
      lastUsedAt: 'desc',
    },
  });

  return subscriptions;
};

/**
 * Remove all push subscriptions for current user
 */
export const removeAllPushSubscriptions = async (_args: void, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const result = await context.entities.PushSubscription.deleteMany({
    where: {
      userId: context.user.id,
    },
  });

  // Disable push in preferences
  await context.entities.NotificationPreference.upsert({
    where: { userId: context.user.id },
    create: {
      userId: context.user.id,
      pushEnabled: false,
    },
    update: {
      pushEnabled: false,
    },
  });

  return { count: result.count };
};
