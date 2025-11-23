import { BaseNotificationProvider } from './base';
import type { NotificationData } from '../types';

export class EmailProvider extends BaseNotificationProvider {
  constructor(config: Record<string, any>) {
    super('Email', config);
  }

  async send(recipients: string[], notification: NotificationData, context: Record<string, any>): Promise<void> {
    try {
      // TODO: Integrate with email service (SendGrid, AWS SES, etc)
      // For now, we'll use Wasp's email sender if configured
      
      const emailContent = this.buildEmailContent(notification, context);
      
      // Import email utilities from Wasp
      // const { sendEmail } = await import('wasp/server/email');
      
      // For each recipient, send email
      for (const email of recipients) {
        // await sendEmail({
        //   to: email,
        //   subject: notification.title,
        //   html: emailContent,
        // });
        
        console.log(`[EmailProvider] Would send email to ${email}:`, {
          subject: notification.title,
          preview: notification.message.substring(0, 100),
        });
      }

      await this.logSuccess(recipients, notification);
    } catch (error) {
      await this.logError(error, recipients, notification);
      throw error;
    }
  }

  private buildEmailContent(notification: NotificationData, context: Record<string, any>): string {
    const typeColors = {
      INFO: '#3b82f6',
      SUCCESS: '#10b981',
      WARNING: '#f59e0b',
      ERROR: '#ef4444',
      CRITICAL: '#dc2626',
    };

    const color = typeColors[notification.type] || '#6b7280';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; padding: 10px 20px; background-color: ${color}; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${notification.title}</h2>
            </div>
            <div class="content">
              <p>${notification.message}</p>
              ${notification.link ? `<a href="${notification.link}" class="button">View Details</a>` : ''}
            </div>
            <div class="footer">
              <p>SentinelIQ - ${context.workspaceName || 'Workspace'}</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
