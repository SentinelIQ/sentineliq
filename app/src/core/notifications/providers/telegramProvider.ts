import { BaseNotificationProvider } from './base';
import type { NotificationData } from '../types';

export class TelegramProvider extends BaseNotificationProvider {
  constructor(config: Record<string, any>) {
    super('Telegram', config);
  }

  async send(recipients: string[], notification: NotificationData, context: Record<string, any>): Promise<void> {
    try {
      const botToken = this.config.botToken;
      
      if (!botToken) {
        throw new Error('Telegram bot token not configured');
      }

      // Send to each recipient (chat ID)
      const sendPromises = recipients.map(chatId =>
        this.sendToChat(chatId, notification, context, botToken)
      );

      await Promise.all(sendPromises);
      await this.logSuccess(recipients, notification);
    } catch (error) {
      await this.logError(error, recipients, notification);
      throw error;
    }
  }

  private async sendToChat(
    chatId: string,
    notification: NotificationData,
    context: Record<string, any>,
    botToken: string
  ): Promise<void> {
    const telegramMessage = this.buildTelegramMessage(notification, context);
    const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: telegramMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        ...(notification.link && {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'View Details',
                  url: notification.link,
                },
              ],
            ],
          },
        }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${errorData.description || response.statusText}`);
    }
  }

  private buildTelegramMessage(notification: NotificationData, context: Record<string, any>): string {
    const typeEmojis = {
      INFO: 'ℹ️',
      SUCCESS: '✅',
      WARNING: '⚠️',
      ERROR: '❌',
      CRITICAL: '🚨',
    };

    const emoji = typeEmojis[notification.type] || '🔔';

    const message = `
<b>${emoji} ${notification.title}</b>

${notification.message}

<i>Workspace: ${context.workspaceName || 'Unknown'}
${new Date().toLocaleString()}</i>
    `.trim();

    return message;
  }
}
