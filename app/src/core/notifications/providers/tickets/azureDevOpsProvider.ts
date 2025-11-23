import { BaseTicketProvider, type TicketMetadata, type TicketResponse } from './baseTicketProvider';
import type { NotificationData } from '../../types';

/**
 * Azure DevOps Provider - Creates work items in Azure DevOps using REST API
 * 
 * Required Config:
 * - organization: Azure DevOps organization name
 * - project: Project name
 * - personalAccessToken: PAT with work item write permissions
 * - workItemType: Type of work item (default: "Bug", can be "Task", "Issue", "User Story")
 * - areaPath: Area path (optional)
 * - iterationPath: Iteration path (optional)
 * 
 * @see https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items/create
 */
export class AzureDevOpsProvider extends BaseTicketProvider {
  protected providerType = 'AZURE_DEVOPS';

  constructor(config: Record<string, any>) {
    super('Azure DevOps', config);
    this.validateConfig(['organization', 'project', 'personalAccessToken']);
  }

  protected async createTicket(
    notification: NotificationData,
    ticketMetadata: TicketMetadata,
    context: Record<string, any>
  ): Promise<TicketResponse> {
    const { 
      organization, 
      project, 
      personalAccessToken,
      workItemType = 'Bug',
      areaPath,
      iterationPath,
    } = this.config;

    // Azure DevOps uses JSON Patch format for work item creation
    const patchDocument = [
      {
        op: 'add',
        path: '/fields/System.Title',
        value: notification.title,
      },
      {
        op: 'add',
        path: '/fields/System.Description',
        value: this.buildTicketDescription(notification, context),
      },
      {
        op: 'add',
        path: '/fields/Microsoft.VSTS.Common.Priority',
        value: this.mapPriorityToAzureDevOps(ticketMetadata.priority),
      },
      {
        op: 'add',
        path: '/fields/Microsoft.VSTS.Common.Severity',
        value: this.mapSeverityToAzureDevOps(notification.type),
      },
    ];

    // Add area path if provided
    if (areaPath || ticketMetadata.customFields?.areaPath) {
      patchDocument.push({
        op: 'add',
        path: '/fields/System.AreaPath',
        value: ticketMetadata.customFields?.areaPath || areaPath,
      });
    }

    // Add iteration path if provided
    if (iterationPath || ticketMetadata.customFields?.iterationPath) {
      patchDocument.push({
        op: 'add',
        path: '/fields/System.IterationPath',
        value: ticketMetadata.customFields?.iterationPath || iterationPath,
      });
    }

    // Add assigned to if provided
    if (ticketMetadata.assignedTo) {
      patchDocument.push({
        op: 'add',
        path: '/fields/System.AssignedTo',
        value: ticketMetadata.assignedTo,
      });
    }

    // Add tags if provided
    if (ticketMetadata.tags && ticketMetadata.tags.length > 0) {
      patchDocument.push({
        op: 'add',
        path: '/fields/System.Tags',
        value: ticketMetadata.tags.join('; '),
      });
    }

    // Create authorization header (Basic Auth with empty username and PAT as password)
    const auth = Buffer.from(`:${personalAccessToken}`).toString('base64');

    // Azure DevOps API URL
    const apiUrl = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/$${workItemType}?api-version=7.1`;

    // Make API request to create work item
    const response = await this.makeRequest(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json-patch+json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(patchDocument),
      },
      'Azure DevOps work item creation failed'
    );

    return {
      ticketId: response.id.toString(),
      ticketKey: response.id.toString(),
      ticketUrl: response._links.html.href,
      createdAt: response.fields['System.CreatedDate'],
      provider: 'azure-devops',
    };
  }

  /**
   * Map generic priority to Azure DevOps priority (1-4)
   */
  private mapPriorityToAzureDevOps(priority?: TicketMetadata['priority']): number {
    const priorityMap: Record<string, number> = {
      critical: 1,  // 1 - Critical
      urgent: 1,    // 1 - Critical
      high: 2,      // 2 - High
      medium: 3,    // 3 - Medium
      low: 4,       // 4 - Low
    };

    return priorityMap[priority || 'medium'] || 3;
  }

  /**
   * Map notification type to Azure DevOps severity
   */
  private mapSeverityToAzureDevOps(type: NotificationData['type']): string {
    const severityMap: Record<NotificationData['type'], string> = {
      CRITICAL: '1 - Critical',
      ERROR: '2 - High',
      WARNING: '3 - Medium',
      INFO: '4 - Low',
      SUCCESS: '4 - Low',
    };

    return severityMap[type] || '3 - Medium';
  }
}
