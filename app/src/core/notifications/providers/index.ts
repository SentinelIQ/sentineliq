import type { INotificationProvider } from './base';
import { EmailProvider } from './emailProvider';
import { SlackProvider } from './slackProvider';
import { DiscordProvider } from './discordProvider';
import { WebhookProvider } from './webhookProvider';
import { TelegramProvider } from './telegramProvider';
import { TeamsProvider } from './teamsProvider';
import { JiraProvider } from './tickets/jiraProvider';
import { ServiceNowProvider } from './tickets/serviceNowProvider';
import { AzureDevOpsProvider } from './tickets/azureDevOpsProvider';
import { LinearProvider } from './tickets/linearProvider';
import { GitHubProvider } from './tickets/githubProvider';

export { EmailProvider, SlackProvider, DiscordProvider, WebhookProvider, TelegramProvider, TeamsProvider, JiraProvider, ServiceNowProvider, AzureDevOpsProvider, LinearProvider, GitHubProvider };

export type ProviderType = 'EMAIL' | 'SLACK' | 'DISCORD' | 'WEBHOOK' | 'TELEGRAM' | 'TEAMS' | 'JIRA' | 'SERVICENOW' | 'AZURE_DEVOPS' | 'LINEAR' | 'GITHUB';

export class ProviderRegistry {
  private static providers: Map<ProviderType, new (config: any) => INotificationProvider> = new Map([
    ['EMAIL', EmailProvider],
    ['SLACK', SlackProvider],
    ['DISCORD', DiscordProvider],
    ['WEBHOOK', WebhookProvider],
    ['TELEGRAM', TelegramProvider],
    ['TEAMS', TeamsProvider],
    ['JIRA', JiraProvider],
    ['SERVICENOW', ServiceNowProvider],
    ['AZURE_DEVOPS', AzureDevOpsProvider],
    ['LINEAR', LinearProvider],
    ['GITHUB', GitHubProvider],
  ]);

  static createProvider(type: ProviderType, config: Record<string, any>): INotificationProvider {
    const ProviderClass = this.providers.get(type);
    
    if (!ProviderClass) {
      throw new Error(`Provider ${type} not implemented`);
    }

    return new ProviderClass(config);
  }

  static getSupportedProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }
}
