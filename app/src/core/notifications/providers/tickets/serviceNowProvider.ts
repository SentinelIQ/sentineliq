import { BaseTicketProvider, type TicketMetadata, type TicketResponse } from './baseTicketProvider';
import type { NotificationData } from '../../types';

/**
 * ServiceNow Provider - Creates incidents in ServiceNow using Table API
 * 
 * Required Config:
 * - instanceUrl: ServiceNow instance URL (e.g., "https://your-instance.service-now.com")
 * - username: ServiceNow username
 * - password: ServiceNow password (or use OAuth token)
 * - assignmentGroup: Default assignment group (optional)
 * - callerId: Caller user ID (optional)
 * 
 * @see https://developer.servicenow.com/dev.do#!/reference/api/latest/rest/c_TableAPI
 */
export class ServiceNowProvider extends BaseTicketProvider {
  protected providerType = 'SERVICENOW';

  constructor(config: Record<string, any>) {
    super('ServiceNow', config);
    this.validateConfig(['instanceUrl', 'username', 'password']);
  }

  protected async createTicket(
    notification: NotificationData,
    ticketMetadata: TicketMetadata,
    context: Record<string, any>
  ): Promise<TicketResponse> {
    const { instanceUrl, username, password, assignmentGroup, callerId } = this.config;

    // Build ServiceNow incident payload
    const incidentPayload = {
      short_description: notification.title,
      description: this.buildTicketDescription(notification, context),
      urgency: this.mapPriorityToUrgency(ticketMetadata.priority),
      impact: this.mapPriorityToImpact(ticketMetadata.priority),
      priority: this.calculateServiceNowPriority(ticketMetadata.priority),
      state: 1, // New
      category: ticketMetadata.category || 'Security',
      subcategory: 'Security Incident',
      // Add assignment group if provided
      ...(assignmentGroup || this.config.defaultAssignmentGroup
        ? { assignment_group: assignmentGroup || this.config.defaultAssignmentGroup }
        : {}),
      // Add caller if provided
      ...(callerId
        ? { caller_id: callerId }
        : {}),
      // Add work notes with metadata
      work_notes: this.buildWorkNotes(notification, ticketMetadata, context),
    };

    // Create authorization header (Basic Auth)
    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    // Make API request to create incident
    const response = await this.makeRequest(
      `${instanceUrl}/api/now/table/incident`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(incidentPayload),
      },
      'ServiceNow incident creation failed'
    );

    const incident = response.result;

    return {
      ticketId: incident.sys_id,
      ticketKey: incident.number,
      ticketUrl: `${instanceUrl}/nav_to.do?uri=incident.do?sys_id=${incident.sys_id}`,
      createdAt: incident.sys_created_on,
      provider: 'servicenow',
    };
  }

  /**
   * Map priority to ServiceNow urgency (1-3)
   */
  private mapPriorityToUrgency(priority?: TicketMetadata['priority']): number {
    const urgencyMap: Record<string, number> = {
      low: 3,       // 3 - Low
      medium: 2,    // 2 - Medium
      high: 2,      // 2 - Medium
      critical: 1,  // 1 - High
      urgent: 1,    // 1 - High
    };

    return urgencyMap[priority || 'medium'] || 2;
  }

  /**
   * Map priority to ServiceNow impact (1-3)
   */
  private mapPriorityToImpact(priority?: TicketMetadata['priority']): number {
    const impactMap: Record<string, number> = {
      low: 3,       // 3 - Low
      medium: 2,    // 2 - Medium
      high: 2,      // 2 - Medium
      critical: 1,  // 1 - High
      urgent: 1,    // 1 - High
    };

    return impactMap[priority || 'medium'] || 2;
  }

  /**
   * Calculate ServiceNow priority based on urgency and impact
   * Priority matrix: 1 (Critical) to 5 (Planning)
   */
  private calculateServiceNowPriority(priority?: TicketMetadata['priority']): number {
    const priorityMap: Record<string, number> = {
      critical: 1,  // 1 - Critical
      urgent: 1,    // 1 - Critical
      high: 2,      // 2 - High
      medium: 3,    // 3 - Moderate
      low: 4,       // 4 - Low
    };

    return priorityMap[priority || 'medium'] || 3;
  }

  /**
   * Build work notes with additional context
   */
  private buildWorkNotes(
    notification: NotificationData,
    ticketMetadata: TicketMetadata,
    context: Record<string, any>
  ): string {
    const notes = ['--- Incident Details ---'];

    if (context.workspaceName) {
      notes.push(`Workspace: ${context.workspaceName}`);
    }

    notes.push(`Type: ${notification.type}`);
    notes.push(`Source: ${ticketMetadata.source || 'SentinelIQ'}`);

    if (notification.link) {
      notes.push(`Details: ${notification.link}`);
    }

    notes.push(`Created: ${new Date().toISOString()}`);

    return notes.join('\n');
  }
}
