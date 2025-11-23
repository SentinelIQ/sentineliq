/**
 * Ticket Provider Integrations
 * 
 * This module contains all ticket system integrations that create tickets
 * in external ticketing platforms via the notification provider pattern.
 * 
 * Available Providers:
 * - Jira: Atlassian Jira issue tracking
 * - ServiceNow: ServiceNow incident management
 * - Azure DevOps: Microsoft Azure DevOps work items
 * - Linear: Linear issue tracking
 * - GitHub: GitHub Issues
 * 
 * Each provider extends BaseTicketProvider and implements the createTicket method
 * to integrate with their respective platform's API.
 */

export { BaseTicketProvider } from './baseTicketProvider';
export type { TicketMetadata, TicketResponse } from './baseTicketProvider';

export { JiraProvider } from './jiraProvider';
export { ServiceNowProvider } from './serviceNowProvider';
export { AzureDevOpsProvider } from './azureDevOpsProvider';
export { LinearProvider } from './linearProvider';
export { GitHubProvider } from './githubProvider';
