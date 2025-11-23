/**
 * Email Service
 * Main service for sending emails using the template system
 * Integrates with Wasp's emailSender (SMTP/SendGrid)
 */

import { prepareEmail, getDefaultSubject, type EmailData, type EmailTemplate } from './renderer';
import type { EmailBranding } from './types';
import { emailSender } from 'wasp/server/email';

/**
 * Email sender interface - unified interface for all providers
 */
export interface EmailSender {
  send(params: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: { name?: string; email: string };
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
  }): Promise<void>;
}

/**
 * Wasp Email Sender - Uses Wasp's built-in emailSender (SMTP or SendGrid)
 * Configured in main.wasp: emailSender { provider: SMTP | SendGrid }
 */
export class WaspEmailSender implements EmailSender {
  async send(params: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: { name?: string; email: string };
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
  }): Promise<void> {
    try {
      // Convert to array if single recipient
      const recipients = Array.isArray(params.to) ? params.to : [params.to];

      // Send to each recipient (Wasp doesn't support multiple recipients in one call)
      await Promise.all(
        recipients.map((recipient) => {
          const emailData: any = {
            to: recipient,
            subject: params.subject,
            html: params.html,
          };

          // Add optional fields only if provided
          if (params.text) emailData.text = params.text;
          if (params.from) emailData.from = params.from;
          if (params.replyTo) emailData.replyTo = params.replyTo;

          return emailSender.send(emailData);
        })
      );
    } catch (error) {
      console.error('[EMAIL] Failed to send email:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Console Email Sender - For development/testing
 * Logs email details instead of sending
 */
class ConsoleEmailSender implements EmailSender {
  async send(params: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: { name?: string; email: string };
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
  }): Promise<void> {
    console.log('[EMAIL] Would send email:', {
      to: params.to,
      from: params.from,
      subject: params.subject,
      htmlLength: params.html.length,
      textLength: params.text?.length,
      replyTo: params.replyTo,
      cc: params.cc,
      bcc: params.bcc,
    });
  }
}

/**
 * Email Service
 */
export class EmailService {
  private sender: EmailSender;

  constructor(sender?: EmailSender) {
    // Default to WaspEmailSender (uses SMTP/SendGrid from main.wasp)
    this.sender = sender || new WaspEmailSender();
  }

  /**
   * Send email using template system
   */
  async sendTemplatedEmail(
    to: string | string[],
    template: EmailTemplate,
    variables: Record<string, any>,
    options?: {
      subject?: string;
      branding?: EmailBranding;
      from?: { name?: string; email: string };
      replyTo?: string;
      cc?: string[];
      bcc?: string[];
    }
  ): Promise<void> {
    const emailData: EmailData = {
      to,
      subject: options?.subject || getDefaultSubject(template, variables),
      template,
      variables,
      branding: options?.branding,
      replyTo: options?.replyTo,
      cc: options?.cc,
      bcc: options?.bcc,
    };

    const prepared = prepareEmail(emailData);
    
    // Generate plain text version from HTML
    const text = this.htmlToText(prepared.html);

    await this.sender.send({
      ...prepared,
      text,
      from: options?.from,
    });
  }

  /**
   * Send multiple emails in batch
   */
  async sendBatch(
    emails: Array<{
      to: string | string[];
      template: EmailTemplate;
      variables: Record<string, any>;
      subject?: string;
      branding?: EmailBranding;
      from?: { name?: string; email: string };
    }>
  ): Promise<void> {
    await Promise.all(
      emails.map((email) =>
        this.sendTemplatedEmail(email.to, email.template, email.variables, {
          subject: email.subject,
          branding: email.branding,
          from: email.from,
        })
      )
    );
  }

  /**
   * Simple HTML to text conversion for email clients that prefer text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&zwnj;/g, '')
      .replace(/&[a-z]+;/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

/**
 * Email Provider Types
 */
export enum EmailProvider {
  WASP_SMTP = 'wasp_smtp',       // Uses Wasp's SMTP config
  WASP_SENDGRID = 'wasp_sendgrid', // Uses Wasp's SendGrid config
  CONSOLE = 'console',            // Console logger for testing
}

/**
 * Global email service instance
 */
let emailServiceInstance: EmailService | null = null;

/**
 * Initialize email service with provider
 */
export function initializeEmailService(provider: EmailProvider = EmailProvider.WASP_SMTP): EmailService {
  let sender: EmailSender;

  switch (provider) {
    case EmailProvider.WASP_SMTP:
    case EmailProvider.WASP_SENDGRID:
      sender = new WaspEmailSender();
      break;
    case EmailProvider.CONSOLE:
      sender = new ConsoleEmailSender();
      break;
    default:
      sender = new WaspEmailSender();
  }

  emailServiceInstance = new EmailService(sender);
  console.log(`[EMAIL] Email service initialized with provider: ${provider}`);
  return emailServiceInstance;
}

/**
 * Initialize email service with custom sender implementation
 */
export function initializeCustomEmailService(sender: EmailSender): EmailService {
  emailServiceInstance = new EmailService(sender);
  console.log('[EMAIL] Email service initialized with custom sender');
  return emailServiceInstance;
}

/**
 * Get email service instance
 */
export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    // Auto-initialize with Wasp provider on first use
    emailServiceInstance = new EmailService(new WaspEmailSender());
    console.log('[EMAIL] Email service auto-initialized with Wasp provider');
  }
  return emailServiceInstance;
}

/**
 * Convenience function to send templated email
 */
export async function sendEmail(
  to: string | string[],
  template: EmailTemplate,
  variables: Record<string, any>,
  options?: {
    subject?: string;
    branding?: EmailBranding;
    from?: { name?: string; email: string };
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
  }
): Promise<void> {
  const service = getEmailService();
  await service.sendTemplatedEmail(to, template, variables, options);
}
