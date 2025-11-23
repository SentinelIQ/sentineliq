import { BaseTicketProvider, type TicketMetadata, type TicketResponse } from './baseTicketProvider';
import type { NotificationData } from '../../types';

/**
 * Jira Provider - Creates issues in Jira using REST API v3
 * 
 * Required Config:
 * - baseUrl: Jira instance URL (e.g., "https://your-domain.atlassian.net")
 * - email: Jira user email
 * - apiToken: Jira API token (from https://id.atlassian.com/manage-profile/security/api-tokens)
 * - projectKey: Default project key (e.g., "PROJ", "SEC")
 * - issueType: Issue type name (default: "Task", can be "Bug", "Story", etc.)
 * 
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/
 */
export class JiraProvider extends BaseTicketProvider {
  protected providerType = 'JIRA';

  constructor(config: Record<string, any>) {
    super('Jira', config);
    this.validateConfig(['baseUrl', 'email', 'apiToken', 'projectKey']);
  }

  protected async createTicket(
    notification: NotificationData,
    ticketMetadata: TicketMetadata,
    context: Record<string, any>
  ): Promise<TicketResponse> {
    const { baseUrl, email, apiToken, projectKey, issueType = 'Task' } = this.config;

    // Build Jira issue payload
    const issuePayload = {
      fields: {
        project: {
          key: ticketMetadata.project || projectKey,
        },
        summary: notification.title,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: this.buildTicketDescription(notification, context),
                },
              ],
            },
          ],
        },
        issuetype: {
          name: issueType,
        },
        priority: {
          name: this.mapPriorityToJira(ticketMetadata.priority),
        },
        // Add labels if provided
        ...(ticketMetadata.labels && ticketMetadata.labels.length > 0
          ? { labels: ticketMetadata.labels }
          : {}),
        // Add assignee if provided
        ...(ticketMetadata.assignedTo
          ? {
              assignee: {
                emailAddress: ticketMetadata.assignedTo,
              },
            }
          : {}),
        // Add due date if provided
        ...(ticketMetadata.dueDate
          ? { duedate: ticketMetadata.dueDate }
          : {}),
      },
    };

    // Create authorization header (Basic Auth with email:token)
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    // Make API request to create issue
    const response = await this.makeRequest(
      `${baseUrl}/rest/api/3/issue`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(issuePayload),
      },
      'Jira issue creation failed'
    );

    return {
      ticketId: response.id,
      ticketKey: response.key,
      ticketUrl: `${baseUrl}/browse/${response.key}`,
      createdAt: new Date().toISOString(),
      provider: 'jira',
    };
  }

  /**
   * Map generic priority to Jira priority names
   */
  private mapPriorityToJira(priority?: TicketMetadata['priority']): string {
    const priorityMap: Record<string, string> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Highest',
      urgent: 'Highest',
    };

    return priorityMap[priority || 'medium'] || 'Medium';
  }
}
