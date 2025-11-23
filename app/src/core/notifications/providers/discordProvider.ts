import { BaseNotificationProvider } from './base';
import type { NotificationData } from '../types';

export class DiscordProvider extends BaseNotificationProvider {
  constructor(config: Record<string, any>) {
    super('Discord', config);
  }

  async send(recipients: string[], notification: NotificationData, context: Record<string, any>): Promise<void> {
    try {
      const webhookUrl = this.config.webhookUrl;
      
      if (!webhookUrl) {
        throw new Error('Discord webhook URL not configured');
      }

      const discordMessage = this.buildDiscordMessage(notification, context);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discordMessage),
      });

      if (!response.ok) {
        throw new Error(`Discord API returned ${response.status}`);
      }

      await this.logSuccess(recipients, notification);
    } catch (error) {
      await this.logError(error, recipients, notification);
      throw error;
    }
  }

  private buildDiscordMessage(notification: NotificationData, context: Record<string, any>) {
    const typeColors = {
      INFO: 0x3b82f6,
      SUCCESS: 0x10b981,
      WARNING: 0xf59e0b,
      ERROR: 0xef4444,
      CRITICAL: 0xdc2626,
    };

    const color = typeColors[notification.type] || 0x6b7280;

    const embed: any = {
      title: notification.title,
      description: notification.message,
      color: color,
      timestamp: new Date().toISOString(),
      footer: {
        text: `SentinelIQ - ${context.workspaceName || 'Workspace'}`,
      },
      fields: [
        {
          name: 'Type',
          value: notification.type,
          inline: true,
        },
      ],
    };

    if (notification.link) {
      embed.url = notification.link;
    }

    return {
      embeds: [embed],
    };
  }
}
