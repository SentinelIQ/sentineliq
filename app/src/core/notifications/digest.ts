import { prisma } from 'wasp/server';
import type { Notification, NotificationPreference, User, WorkspaceMember, Workspace } from '@prisma/client';
import { createLogger } from '../logs/logger';
import { DigestFrequency, NotificationType } from '@prisma/client';
import { WaspEmailSender } from '../email/service';

const logger = createLogger('notification-digest');

/**
 * Map NotificationType to severity level for display
 */
function mapTypeToSeverity(type: NotificationType): 'critical' | 'warning' | 'info' {
  switch (type) {
    case 'CRITICAL':
    case 'ERROR':
      return 'critical';
    case 'WARNING':
      return 'warning';
    case 'INFO':
    case 'SUCCESS':
    default:
      return 'info';
  }
}

type DigestData = {
  userId: string;
  userEmail: string;
  userName: string;
  workspaceId: string;
  workspaceName: string;
  notifications: Array<{
    id: string;
    title: string;
    message: string | null;
    type: NotificationType;
    severity: 'critical' | 'warning' | 'info';
    createdAt: Date;
  }>;
};

/**
 * Check if digest should be sent based on frequency and last sent time
 */
function shouldSendDigest(frequency: DigestFrequency, lastSentAt: Date | null): boolean {
  if (!lastSentAt) return true;

  const now = new Date();
  const hoursSinceLastSend = (now.getTime() - lastSentAt.getTime()) / (1000 * 60 * 60);

  switch (frequency) {
    case 'DAILY':
      return hoursSinceLastSend >= 24;
    case 'WEEKLY':
      return hoursSinceLastSend >= 24 * 7;
    case 'MONTHLY':
      return hoursSinceLastSend >= 24 * 30;
    default:
      return false;
  }
}

/**
 * Check if current time matches user's preferred digest time (within 1 hour window)
 */
function isDigestTime(digestTime: string): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const [targetHour, targetMinute] = digestTime.split(':').map(Number);

  // Check if current time is within 1 hour window of target time
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const targetTotalMinutes = targetHour * 60 + targetMinute;

  // Allow 1 hour window (since job runs every hour)
  return Math.abs(currentTotalMinutes - targetTotalMinutes) < 60;
}

/**
 * Send notification digests to users who enabled digest mode
 */
export async function sendDigests() {
  logger.info('Starting notification digest job');

  try {
    // Find users with digest enabled
    const preferences = await prisma.notificationPreference.findMany({
      where: {
        digestEnabled: true,
      },
      include: {
        user: {
          include: {
            workspaceMembers: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    const typedPreferences = preferences as Array<NotificationPreference & {
      user: User & {
        workspaceMembers: Array<WorkspaceMember & { workspace: Workspace }>;
      };
    }>;

    logger.info(`Found ${typedPreferences.length} users with digest enabled`);

    let digestsSent = 0;
    let errors = 0;

    for (const pref of typedPreferences) {
      try {
        // Check if it's time to send digest
        if (!shouldSendDigest(pref.digestFrequency, pref.lastDigestSentAt)) {
          logger.debug(`Skipping digest for user ${pref.userId} - not time yet`, {
            frequency: pref.digestFrequency,
            lastSentAt: pref.lastDigestSentAt,
          });
          continue;
        }

        // Check if current time matches user's preferred time
        if (!isDigestTime(pref.digestTime)) {
          logger.debug(`Skipping digest for user ${pref.userId} - not preferred time`, {
            preferredTime: pref.digestTime,
            currentTime: new Date().toISOString(),
          });
          continue;
        }

        // Get unread notifications for all user's workspaces
        const workspaceIds = pref.user.workspaceMembers.map((wm: WorkspaceMember) => wm.workspaceId);

        if (workspaceIds.length === 0) {
          logger.debug(`User ${pref.userId} has no workspaces`);
          continue;
        }

        const notifications = await prisma.notification.findMany({
          where: {
            userId: pref.userId,
            workspaceId: { in: workspaceIds },
            isRead: false,
            createdAt: {
              gt: pref.lastDigestSentAt || new Date(0), // Since last digest or beginning of time
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 100, // Limit to 100 notifications per digest
        });

        if (notifications.length === 0) {
          logger.debug(`No unread notifications for user ${pref.userId}`);
          continue;
        }

        // Group notifications by workspace
        const notificationsByWorkspace = notifications.reduce((acc: Record<string, Notification[]>, notif: Notification) => {
          if (!acc[notif.workspaceId]) {
            acc[notif.workspaceId] = [];
          }
          acc[notif.workspaceId].push(notif);
          return acc;
        }, {} as Record<string, Notification[]>);

        // Send digest for each workspace
        for (const workspaceId of Object.keys(notificationsByWorkspace)) {
          const workspaceNotifs = notificationsByWorkspace[workspaceId];
          const workspace = pref.user.workspaceMembers.find((wm: WorkspaceMember) => wm.workspaceId === workspaceId)?.workspace;

          if (!workspace) continue;

          const digestData: DigestData = {
            userId: pref.userId,
            userEmail: pref.user.email || '',
            userName: pref.user.username || 'User',
            workspaceId,
            workspaceName: workspace.name,
            notifications: workspaceNotifs.map((n: Notification) => ({
              id: n.id,
              title: n.title,
              message: n.message,
              type: n.type,
              severity: mapTypeToSeverity(n.type),
              createdAt: n.createdAt,
            })),
          };

          await sendDigestEmail(digestData);
        }

        // Update last digest sent time
        await prisma.notificationPreference.update({
          where: { userId: pref.userId },
          data: {
            lastDigestSentAt: new Date(),
          },
        });

        digestsSent++;
        logger.info(`Sent digest to user ${pref.userId}`, {
          notificationCount: notifications.length,
          workspaceCount: Object.keys(notificationsByWorkspace).length,
        });
      } catch (error: any) {
        errors++;
        logger.error(`Failed to send digest for user ${pref.userId}`, {
          error: error.message,
        });
      }
    }

    logger.info('Notification digest job completed', {
      digestsSent,
      errors,
      totalPreferences: typedPreferences.length,
    });

    return {
      success: true,
      digestsSent,
      errors,
    };
  } catch (error: any) {
    logger.error('Failed to run notification digest job', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Send digest email to user
 */
async function sendDigestEmail(data: DigestData) {
  const { userEmail, userName, workspaceName, notifications } = data;

  // Group by severity
  const criticalCount = notifications.filter((n) => n.severity === 'critical').length;
  const warningCount = notifications.filter((n) => n.severity === 'warning').length;
  const infoCount = notifications.filter((n) => n.severity === 'info').length;

  // Group by type
  const typeGroups = notifications.reduce((acc, n) => {
    if (!acc[n.type]) {
      acc[n.type] = [];
    }
    acc[n.type].push(n);
    return acc;
  }, {} as Record<string, typeof notifications>);

  // Generate HTML email content
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .summary {
          background: #f7fafc;
          padding: 20px;
          border-left: 4px solid #667eea;
          margin: 20px 0;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .summary-item:last-child {
          border-bottom: none;
        }
        .notification-group {
          margin: 20px 0;
        }
        .notification-group h3 {
          color: #667eea;
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
        }
        .notification {
          background: white;
          padding: 15px;
          margin: 10px 0;
          border-left: 4px solid #cbd5e0;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .notification.critical {
          border-left-color: #f56565;
        }
        .notification.warning {
          border-left-color: #ed8936;
        }
        .notification.info {
          border-left-color: #4299e1;
        }
        .notification-title {
          font-weight: 600;
          margin-bottom: 5px;
          color: #2d3748;
        }
        .notification-message {
          color: #4a5568;
          font-size: 14px;
        }
        .notification-meta {
          font-size: 12px;
          color: #a0aec0;
          margin-top: 8px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #718096;
          font-size: 14px;
        }
        .btn {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📬 Your Notification Digest</h1>
        <p>Workspace: ${workspaceName}</p>
      </div>

      <div style="padding: 20px;">
        <p>Hi ${userName},</p>
        <p>Here's your summary of ${notifications.length} unread notification${notifications.length !== 1 ? 's' : ''}:</p>

        <div class="summary">
          <div class="summary-item">
            <span>🔴 Critical</span>
            <strong>${criticalCount}</strong>
          </div>
          <div class="summary-item">
            <span>🟡 Warning</span>
            <strong>${warningCount}</strong>
          </div>
          <div class="summary-item">
            <span>🔵 Info</span>
            <strong>${infoCount}</strong>
          </div>
        </div>

        ${Object.entries(typeGroups)
          .map(
            ([type, groupNotifications]) => `
          <div class="notification-group">
            <h3>${formatNotificationType(type)} (${groupNotifications.length})</h3>
            ${groupNotifications
              .slice(0, 10)
              .map(
                (n) => `
              <div class="notification ${n.severity}">
                <div class="notification-title">${n.title}</div>
                ${n.message ? `<div class="notification-message">${n.message}</div>` : ''}
                <div class="notification-meta">
                  ${formatDate(n.createdAt)}
                </div>
              </div>
            `
              )
              .join('')}
            ${groupNotifications.length > 10 ? `<p style="color: #718096; font-size: 14px;">... and ${groupNotifications.length - 10} more</p>` : ''}
          </div>
        `
          )
          .join('')}

        <div style="text-align: center;">
          <a href="${process.env.WASP_WEB_CLIENT_URL}/notifications" class="btn">
            View All Notifications
          </a>
        </div>
      </div>

      <div class="footer">
        <p>You're receiving this digest because you enabled notification digests in your preferences.</p>
        <p><a href="${process.env.WASP_WEB_CLIENT_URL}/notifications/preferences">Manage Preferences</a></p>
      </div>
    </body>
    </html>
  `;

  const emailSender = new WaspEmailSender();
  await emailSender.send({
    to: userEmail,
    subject: `📬 Your Notification Digest - ${workspaceName}`,
    html: emailHtml,
    text: generatePlainTextDigest(data),
  });
}

/**
 * Generate plain text version of digest
 */
function generatePlainTextDigest(data: DigestData): string {
  const { userName, workspaceName, notifications } = data;

  let text = `Hi ${userName},\n\n`;
  text += `Here's your notification digest for ${workspaceName}:\n\n`;
  text += `Total: ${notifications.length} unread notifications\n\n`;

  const typeGroups = notifications.reduce((acc, n) => {
    if (!acc[n.type]) acc[n.type] = [];
    acc[n.type].push(n);
    return acc;
  }, {} as Record<string, typeof notifications>);

  for (const [type, groupNotifications] of Object.entries(typeGroups)) {
    text += `\n${formatNotificationType(type)} (${groupNotifications.length}):\n`;
    text += '='.repeat(50) + '\n\n';

    for (const n of groupNotifications.slice(0, 10)) {
      text += `• ${n.title}\n`;
      if (n.message) text += `  ${n.message}\n`;
      text += `  ${formatDate(n.createdAt)} | ${n.severity.toUpperCase()}\n\n`;
    }

    if (groupNotifications.length > 10) {
      text += `... and ${groupNotifications.length - 10} more\n\n`;
    }
  }

  text += `\nView all: ${process.env.WASP_WEB_CLIENT_URL}/notifications\n`;
  text += `Manage preferences: ${process.env.WASP_WEB_CLIENT_URL}/notifications/preferences\n`;

  return text;
}

/**
 * Format notification type for display
 */
function formatNotificationType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
