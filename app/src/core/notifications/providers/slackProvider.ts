import { BaseNotificationProvider } from './base';
import type { NotificationData } from '../types';

export class SlackProvider extends BaseNotificationProvider {
  constructor(config: Record<string, any>) {
    super('Slack', config);
  }

  async send(recipients: string[], notification: NotificationData, context: Record<string, any>): Promise<void> {
    try {
      const webhookUrl = this.config.webhookUrl;
      
      if (!webhookUrl) {
        throw new Error('Slack webhook URL not configured');
      }

      const slackMessage = this.buildSlackMessage(notification, context);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slackMessage),
      });

      if (!response.ok) {
        throw new Error(`Slack API returned ${response.status}`);
      }

      await this.logSuccess(recipients, notification);
    } catch (error) {
      await this.logError(error, recipients, notification);
      throw error;
    }
  }

  private buildSlackMessage(notification: NotificationData, context: Record<string, any>) {
    const typeEmojis = {
      INFO: ':information_source:',
      SUCCESS: ':white_check_mark:',
      WARNING: ':warning:',
      ERROR: ':x:',
      CRITICAL: ':rotating_light:',
    };

    const typeColors = {
      INFO: '#3b82f6',
      SUCCESS: '#10b981',
      WARNING: '#f59e0b',
      ERROR: '#ef4444',
      CRITICAL: '#dc2626',
    };

    const emoji = typeEmojis[notification.type] || ':bell:';
    const color = typeColors[notification.type] || '#6b7280';

    return {
      text: `${emoji} ${notification.title}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ${notification.title}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: notification.message,
          },
        },
        ...(notification.link ? [{
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Details',
              },
              url: notification.link,
              style: 'primary',
            },
          ],
        }] : []),
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Workspace: *${context.workspaceName || 'Unknown'}* | ${new Date().toLocaleString()}`,
            },
          ],
        },
      ],
    };
  }
}
