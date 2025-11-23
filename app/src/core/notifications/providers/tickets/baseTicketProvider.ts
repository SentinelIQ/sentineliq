import { BaseNotificationProvider } from '../base';
import type { NotificationData } from '../../types';
import { createLogger } from '../../../logs/logger';

const logger = createLogger('ticket-provider');

export interface TicketMetadata {
  priority?: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  status?: string;
  assignedTo?: string;
  labels?: string[];
  tags?: string[];
  dueDate?: string;
  project?: string;
  category?: string;
  severity?: string;
  source?: string;
  customFields?: Record<string, any>;
}

export interface TicketResponse {
  ticketId: string;
  ticketKey?: string;
  ticketUrl: string;
  createdAt: string;
  provider: string;
}

/**
 * Base class for all ticket system providers
 * Provides common functionality for creating tickets in external systems
 */
export abstract class BaseTicketProvider extends BaseNotificationProvider {
  protected abstract providerType: string;

  constructor(providerName: string, config: Record<string, any>) {
    super(providerName, config);
  }

  /**
   * Abstract method that each ticket provider must implement
   * to create a ticket in their specific system
   */
  protected abstract createTicket(
    notification: NotificationData,
    ticketMetadata: TicketMetadata,
    context: Record<string, any>
  ): Promise<TicketResponse>;

  /**
   * Main send method - extracts ticket metadata and creates the ticket
   */
  async send(
    recipients: string[],
    notification: NotificationData,
    context: Record<string, any>
  ): Promise<void> {
    try {
      // Extract ticket metadata from notification
      const ticketMetadata = this.extractTicketMetadata(notification);

      // Create ticket in the external system
      const ticketResponse = await this.createTicket(notification, ticketMetadata, context);

      // Log success with ticket information
      await this.logTicketCreated(ticketResponse, notification);
    } catch (error) {
      await this.logError(error, recipients, notification);
      throw error;
    }
  }

  /**
   * Extract ticket metadata from notification metadata
   */
  protected extractTicketMetadata(notification: NotificationData): TicketMetadata {
    const metadata = notification.metadata || {};
    
    return {
      priority: metadata.priority || this.mapNotificationTypeToPriority(notification.type),
      status: metadata.status || 'open',
      assignedTo: metadata.assignedTo || this.config.defaultAssignee,
      labels: metadata.labels || metadata.tags || [],
      tags: metadata.tags || [],
      dueDate: metadata.dueDate,
      project: metadata.project || this.config.defaultProject,
      category: metadata.category || 'security-incident',
      severity: metadata.severity || notification.type.toLowerCase(),
      source: metadata.source || 'sentineliq',
      customFields: metadata.customFields || {},
    };
  }

  /**
   * Map notification type to ticket priority
   */
  protected mapNotificationTypeToPriority(type: NotificationData['type']): TicketMetadata['priority'] {
    const priorityMap: Record<NotificationData['type'], TicketMetadata['priority']> = {
      INFO: 'low',
      SUCCESS: 'low',
      WARNING: 'medium',
      ERROR: 'high',
      CRITICAL: 'critical',
    };

    return priorityMap[type] || 'medium';
  }

  /**
   * Build ticket description from notification
   */
  protected buildTicketDescription(notification: NotificationData, context: Record<string, any>): string {
    const sections = [
      `## ${notification.title}`,
      '',
      notification.message,
      '',
    ];

    // Add workspace context if available
    if (context.workspaceName) {
      sections.push(`**Workspace:** ${context.workspaceName}`);
    }

    // Add link if available
    if (notification.link) {
      sections.push('', `**View Details:** ${notification.link}`);
    }

    // Add metadata if available
    if (notification.metadata && Object.keys(notification.metadata).length > 0) {
      sections.push('', '### Additional Information');
      Object.entries(notification.metadata).forEach(([key, value]) => {
        if (typeof value !== 'object') {
          sections.push(`- **${key}:** ${value}`);
        }
      });
    }

    // Add timestamp
    sections.push('', `---`, `*Created by SentinelIQ on ${new Date().toISOString()}*`);

    return sections.join('\n');
  }

  /**
   * Log successful ticket creation
   */
  protected async logTicketCreated(ticketResponse: TicketResponse, notification: NotificationData) {
    await logger.info(`${this.providerName} ticket created successfully`, {
      provider: this.providerType,
      ticketId: ticketResponse.ticketId,
      ticketKey: ticketResponse.ticketKey,
      ticketUrl: ticketResponse.ticketUrl,
      title: notification.title,
      type: notification.type,
    });
  }

  /**
   * Validate required configuration
   */
  protected validateConfig(requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => !this.config[field]);
    
    if (missingFields.length > 0) {
      throw new Error(
        `${this.providerName} configuration missing required fields: ${missingFields.join(', ')}`
      );
    }
  }

  /**
   * Make HTTP request with error handling
   */
  protected async makeRequest(
    url: string,
    options: RequestInit,
    errorContext: string
  ): Promise<any> {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `${errorContext}: HTTP ${response.status} - ${errorText}`
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error: any) {
      throw new Error(`${errorContext}: ${error.message}`);
    }
  }
}
