import { BaseNotificationProvider } from './base';
import type { NotificationData } from '../types';

export class TeamsProvider extends BaseNotificationProvider {
  constructor(config: Record<string, any>) {
    super('Microsoft Teams', config);
  }

  async send(recipients: string[], notification: NotificationData, context: Record<string, any>): Promise<void> {
    try {
      const webhookUrl = this.config.webhookUrl;
      
      if (!webhookUrl) {
        throw new Error('Microsoft Teams webhook URL not configured');
      }

      const teamsMessage = this.buildTeamsMessage(notification, context);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamsMessage),
      });

      if (!response.ok) {
        throw new Error(`Microsoft Teams API returned ${response.status}`);
      }

      await this.logSuccess(recipients, notification);
    } catch (error) {
      await this.logError(error, recipients, notification);
      throw error;
    }
  }

  private buildTeamsMessage(notification: NotificationData, context: Record<string, any>) {
    const typeThemeColors = {
      INFO: '0078D4',    // Blue
      SUCCESS: '107C10',  // Green
      WARNING: 'FFB900',  // Gold
      ERROR: 'DA3B01',    // Orange-Red
      CRITICAL: 'D83B01', // Red
    };

    const themeColor = typeThemeColors[notification.type] || '0078D4';

    const typeEmojis = {
      INFO: 'ℹ️',
      SUCCESS: '✅',
      WARNING: '⚠️',
      ERROR: '❌',
      CRITICAL: '🚨',
    };

    const emoji = typeEmojis[notification.type] || '🔔';

    const potentialActions: any[] = [];
    
    if (notification.link) {
      potentialActions.push({
        '@type': 'OpenUri',
        name: 'View Details',
        targets: [
          {
            os: 'default',
            uri: notification.link,
          },
        ],
      });
    }

    return {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      themeColor: themeColor,
      summary: notification.title,
      sections: [
        {
          activityTitle: `${emoji} ${notification.title}`,
          activitySubtitle: context.workspaceName || 'SentinelIQ',
          text: notification.message,
          markdown: true,
          facts: [
            {
              name: 'Type:',
              value: notification.type,
            },
            {
              name: 'Time:',
              value: new Date().toLocaleString(),
            },
            {
              name: 'Workspace:',
              value: context.workspaceName || 'Unknown',
            },
          ],
        },
      ],
      ...(potentialActions.length > 0 && {
        potentialAction: potentialActions,
      }),
    };
  }
}
