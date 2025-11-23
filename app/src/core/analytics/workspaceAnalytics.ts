/**
 * Business Analytics Operations
 * 
 * Provides business intelligence and usage metrics for workspaces
 */

import { HttpError } from 'wasp/server';

export interface WorkspaceAnalytics {
  workspace: {
    id: string;
    name: string;
    plan: string;
    createdAt: Date;
    memberCount: number;
    activeMembers: number;
    [key: string]: any;
  };
  usage: {
    totalNotifications: number;
    readNotifications: number;
    unreadNotifications: number;
    totalInvitations: number;
    acceptedInvitations: number;
    pendingInvitations: number;
    [key: string]: any;
  };
  activity: {
    lastActivity: Date | null;
    activeToday: number;
    activeThisWeek: number;
    activeThisMonth: number;
    [key: string]: any;
  };
  features: {
    brandingEnabled: boolean;
    twoFactorEnabled: number; // count of users with 2FA
    pushNotificationsEnabled: number; // count of users with push
    [key: string]: any;
  };
  trends: {
    memberGrowth: number; // percentage change last 30 days
    activityGrowth: number; // percentage change last 30 days
    notificationGrowth: number; // percentage change last 30 days
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Get analytics for current workspace
 */
export const getWorkspaceAnalytics = async (
  _args: void,
  context: any
): Promise<WorkspaceAnalytics> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
    include: {
      currentWorkspace: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!user?.currentWorkspace) {
    throw new HttpError(400, 'No workspace selected');
  }

  const workspace = user.currentWorkspace;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get workspace members
  const allMembers = workspace.members;
  const memberIds = allMembers.map((m: any) => m.userId);

  // Calculate active members (based on recent audit logs or notifications)
  const recentActivity = await context.entities.AuditLog.groupBy({
    by: ['userId'],
    where: {
      workspaceId: workspace.id,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    _count: true,
  });

  const activeMembers = recentActivity.length;

  // Activity metrics
  const activityToday = await context.entities.AuditLog.count({
    where: {
      workspaceId: workspace.id,
      createdAt: {
        gte: oneDayAgo,
      },
    },
  });

  const activityThisWeek = await context.entities.AuditLog.count({
    where: {
      workspaceId: workspace.id,
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
  });

  const activityThisMonth = await context.entities.AuditLog.count({
    where: {
      workspaceId: workspace.id,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  // Notifications metrics
  const totalNotifications = await context.entities.Notification.count({
    where: { workspaceId: workspace.id },
  });

  const readNotifications = await context.entities.Notification.count({
    where: { workspaceId: workspace.id, isRead: true },
  });

  const unreadNotifications = totalNotifications - readNotifications;

  // Invitations metrics
  const totalInvitations = await context.entities.WorkspaceInvitation.count({
    where: { workspaceId: workspace.id },
  });

  const acceptedInvitations = await context.entities.WorkspaceInvitation.count({
    where: { workspaceId: workspace.id, isAccepted: true },
  });

  const pendingInvitations = await context.entities.WorkspaceInvitation.count({
    where: {
      workspaceId: workspace.id,
      isAccepted: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  // Feature adoption metrics
  const twoFactorUsers = await context.entities.User.count({
    where: {
      id: { in: memberIds },
      twoFactorEnabled: true,
    },
  });

  const pushEnabledUsers = await context.entities.PushSubscription.groupBy({
    by: ['userId'],
    where: {
      userId: { in: memberIds },
      workspaceId: workspace.id,
    },
  });

  // Trends (compare with previous 30 days)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const membersLastMonth = await context.entities.WorkspaceMember.count({
    where: {
      workspaceId: workspace.id,
      createdAt: {
        gte: sixtyDaysAgo,
        lt: thirtyDaysAgo,
      },
    },
  });

  const membersThisMonth = await context.entities.WorkspaceMember.count({
    where: {
      workspaceId: workspace.id,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const memberGrowth = membersLastMonth > 0
    ? ((membersThisMonth - membersLastMonth) / membersLastMonth) * 100
    : 0;

  const activityLastMonth = await context.entities.AuditLog.count({
    where: {
      workspaceId: workspace.id,
      createdAt: {
        gte: sixtyDaysAgo,
        lt: thirtyDaysAgo,
      },
    },
  });

  const activityGrowth = activityLastMonth > 0
    ? ((activityThisMonth - activityLastMonth) / activityLastMonth) * 100
    : 0;

  const notificationsLastMonth = await context.entities.Notification.count({
    where: {
      workspaceId: workspace.id,
      createdAt: {
        gte: sixtyDaysAgo,
        lt: thirtyDaysAgo,
      },
    },
  });

  const notificationsThisMonth = await context.entities.Notification.count({
    where: {
      workspaceId: workspace.id,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const notificationGrowth = notificationsLastMonth > 0
    ? ((notificationsThisMonth - notificationsLastMonth) / notificationsLastMonth) * 100
    : 0;

  // Get last activity
  const lastAuditLog = await context.entities.AuditLog.findFirst({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: 'desc' },
  });

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      plan: workspace.subscriptionPlan || 'free',
      createdAt: workspace.createdAt,
      memberCount: allMembers.length,
      activeMembers,
    },
    usage: {
      totalNotifications,
      readNotifications,
      unreadNotifications,
      totalInvitations,
      acceptedInvitations,
      pendingInvitations,
    },
    activity: {
      lastActivity: lastAuditLog?.createdAt || null,
      activeToday: activityToday,
      activeThisWeek: activityThisWeek,
      activeThisMonth: activityThisMonth,
    },
    features: {
      brandingEnabled: !!(workspace.logoUrl || workspace.primaryColor),
      twoFactorEnabled: twoFactorUsers,
      pushNotificationsEnabled: pushEnabledUsers.length,
    },
    trends: {
      memberGrowth: Math.round(memberGrowth * 10) / 10,
      activityGrowth: Math.round(activityGrowth * 10) / 10,
      notificationGrowth: Math.round(notificationGrowth * 10) / 10,
    },
  };
};
