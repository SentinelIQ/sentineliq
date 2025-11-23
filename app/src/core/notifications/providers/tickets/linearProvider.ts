import { BaseTicketProvider, type TicketMetadata, type TicketResponse } from './baseTicketProvider';
import type { NotificationData } from '../../types';

/**
 * Linear Provider - Creates issues in Linear using GraphQL API
 * 
 * Required Config:
 * - apiKey: Linear API key (from https://linear.app/settings/api)
 * - teamId: Team ID to create issues in
 * - projectId: Project ID (optional)
 * - defaultStateId: Default workflow state ID (optional)
 * 
 * @see https://developers.linear.app/docs/graphql/working-with-the-graphql-api
 */
export class LinearProvider extends BaseTicketProvider {
  protected providerType = 'LINEAR';

  constructor(config: Record<string, any>) {
    super('Linear', config);
    this.validateConfig(['apiKey', 'teamId']);
  }

  protected async createTicket(
    notification: NotificationData,
    ticketMetadata: TicketMetadata,
    context: Record<string, any>
  ): Promise<TicketResponse> {
    const { apiKey, teamId, projectId, defaultStateId } = this.config;

    // Build GraphQL mutation for creating an issue
    const mutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            url
            createdAt
          }
        }
      }
    `;

    // Build issue input
    const issueInput: Record<string, any> = {
      teamId: teamId,
      title: notification.title,
      description: this.buildTicketDescription(notification, context),
      priority: this.mapPriorityToLinear(ticketMetadata.priority),
    };

    // Add project if provided
    if (projectId || ticketMetadata.project) {
      issueInput.projectId = ticketMetadata.project || projectId;
    }

    // Add state if provided
    if (defaultStateId || ticketMetadata.customFields?.stateId) {
      issueInput.stateId = ticketMetadata.customFields?.stateId || defaultStateId;
    }

    // Add assignee if provided
    if (ticketMetadata.assignedTo) {
      issueInput.assigneeId = ticketMetadata.assignedTo;
    }

    // Add labels if provided
    if (ticketMetadata.labels && ticketMetadata.labels.length > 0) {
      issueInput.labelIds = ticketMetadata.labels;
    }

    // Make GraphQL request
    const response = await this.makeRequest(
      'https://api.linear.app/graphql',
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: issueInput,
          },
        }),
      },
      'Linear issue creation failed'
    );

    // Check for GraphQL errors
    if (response.errors) {
      throw new Error(`Linear GraphQL error: ${JSON.stringify(response.errors)}`);
    }

    if (!response.data?.issueCreate?.success) {
      throw new Error('Linear issue creation was not successful');
    }

    const issue = response.data.issueCreate.issue;

    return {
      ticketId: issue.id,
      ticketKey: issue.identifier,
      ticketUrl: issue.url,
      createdAt: issue.createdAt,
      provider: 'linear',
    };
  }

  /**
   * Map generic priority to Linear priority (0-4)
   * 0 = No priority, 1 = Urgent, 2 = High, 3 = Medium, 4 = Low
   */
  private mapPriorityToLinear(priority?: TicketMetadata['priority']): number {
    const priorityMap: Record<string, number> = {
      critical: 1,  // Urgent
      urgent: 1,    // Urgent
      high: 2,      // High
      medium: 3,    // Medium
      low: 4,       // Low
    };

    return priorityMap[priority || 'medium'] || 3;
  }
}
