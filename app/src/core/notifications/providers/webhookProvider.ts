import { BaseNotificationProvider } from './base';
import type { NotificationData } from '../types';

export class WebhookProvider extends BaseNotificationProvider {
  constructor(config: Record<string, any>) {
    super('Webhook', config);
  }

  async send(recipients: string[], notification: NotificationData, context: Record<string, any>): Promise<void> {
    try {
      const webhookUrl = this.config.url;
      const method = this.config.method || 'POST';
      const headers = this.config.headers || { 'Content-Type': 'application/json' };
      
      if (!webhookUrl) {
        throw new Error('Webhook URL not configured');
      }

      const payload = {
        timestamp: new Date().toISOString(),
        workspace: {
          id: context.workspaceId,
          name: context.workspaceName,
        },
        notification: {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          link: notification.link,
          metadata: notification.metadata,
        },
        event: context.eventType,
        data: context.eventData,
      };

      const response = await fetch(webhookUrl, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}: ${await response.text()}`);
      }

      await this.logSuccess(recipients, notification);
    } catch (error) {
      await this.logError(error, recipients, notification);
      throw error;
    }
  }
}
