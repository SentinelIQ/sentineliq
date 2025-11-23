import type { NotificationData } from '../types';
import { createLogger } from '../../logs/logger';

const logger = createLogger('notification-provider');

export interface INotificationProvider {
  send(recipients: string[], notification: NotificationData, context: Record<string, any>): Promise<void>;
}

export abstract class BaseNotificationProvider implements INotificationProvider {
  protected config: Record<string, any>;
  protected providerName: string;

  constructor(providerName: string, config: Record<string, any>) {
    this.providerName = providerName;
    this.config = config;
  }

  abstract send(recipients: string[], notification: NotificationData, context: Record<string, any>): Promise<void>;

  protected async logSuccess(recipients: string[], notification: NotificationData) {
    await logger.info(`${this.providerName} notification sent successfully`, {
      provider: this.providerName,
      recipients: recipients.length,
      title: notification.title,
    });
  }

  protected async logError(error: any, recipients: string[], notification: NotificationData) {
    await logger.error(`${this.providerName} notification failed`, {
      provider: this.providerName,
      recipients: recipients.length,
      title: notification.title,
      error: error.message,
    });
  }
}
