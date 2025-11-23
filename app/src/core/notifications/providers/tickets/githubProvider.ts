import { BaseTicketProvider, type TicketMetadata, type TicketResponse } from './baseTicketProvider';
import type { NotificationData } from '../../types';

/**
 * GitHub Issues Provider - Creates issues in GitHub repositories using REST API
 * 
 * Required Config:
 * - token: GitHub Personal Access Token with 'repo' scope
 * - owner: Repository owner (username or organization)
 * - repo: Repository name
 * - labels: Default labels to apply (optional)
 * 
 * @see https://docs.github.com/en/rest/issues/issues#create-an-issue
 */
export class GitHubProvider extends BaseTicketProvider {
  protected providerType = 'GITHUB';

  constructor(config: Record<string, any>) {
    super('GitHub Issues', config);
    this.validateConfig(['token', 'owner', 'repo']);
  }

  protected async createTicket(
    notification: NotificationData,
    ticketMetadata: TicketMetadata,
    context: Record<string, any>
  ): Promise<TicketResponse> {
    const { token, owner, repo, labels: defaultLabels = [] } = this.config;

    // Build issue payload
    const issuePayload: Record<string, any> = {
      title: notification.title,
      body: this.buildTicketDescription(notification, context),
      labels: this.buildLabels(ticketMetadata, defaultLabels),
    };

    // Add assignee if provided (must be a GitHub username)
    if (ticketMetadata.assignedTo) {
      issuePayload.assignees = [ticketMetadata.assignedTo];
    }

    // Add milestone if provided
    if (ticketMetadata.customFields?.milestone) {
      issuePayload.milestone = ticketMetadata.customFields.milestone;
    }

    // Make API request to create issue
    const response = await this.makeRequest(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify(issuePayload),
      },
      'GitHub issue creation failed'
    );

    return {
      ticketId: response.id.toString(),
      ticketKey: `#${response.number}`,
      ticketUrl: response.html_url,
      createdAt: response.created_at,
      provider: 'github',
    };
  }

  /**
   * Build labels array from ticket metadata and defaults
   */
  private buildLabels(ticketMetadata: TicketMetadata, defaultLabels: string[]): string[] {
    const labels = new Set<string>(defaultLabels);

    // Add priority label
    if (ticketMetadata.priority) {
      labels.add(`priority: ${ticketMetadata.priority}`);
    }

    // Add severity label
    if (ticketMetadata.severity) {
      labels.add(`severity: ${ticketMetadata.severity}`);
    }

    // Add custom labels from metadata
    if (ticketMetadata.labels && ticketMetadata.labels.length > 0) {
      ticketMetadata.labels.forEach(label => labels.add(label));
    }

    // Add tags as labels
    if (ticketMetadata.tags && ticketMetadata.tags.length > 0) {
      ticketMetadata.tags.forEach(tag => labels.add(tag));
    }

    // Add source label
    labels.add('source: sentineliq');

    return Array.from(labels);
  }
}
