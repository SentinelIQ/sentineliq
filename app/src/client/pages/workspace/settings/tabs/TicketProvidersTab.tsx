import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import {
  getTicketProviders,
  saveTicketProvider,
  toggleTicketProvider,
  deleteTicketProvider,
} from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Switch } from '../../../../components/ui/switch';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Ticket, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { useToast } from '../../../../hooks/useToast';

const TICKET_PROVIDERS = {
  JIRA: {
    icon: Ticket,
    description: 'Create tickets in Jira for security incidents',
    configFields: ['baseUrl', 'apiToken', 'projectKey', 'issueType'],
  },
  SERVICENOW: {
    icon: Ticket,
    description: 'Create incidents in ServiceNow',
    configFields: ['instanceUrl', 'username', 'password', 'tableName'],
  },
  AZURE_DEVOPS: {
    icon: Ticket,
    description: 'Create work items in Azure DevOps',
    configFields: ['organization', 'project', 'personalAccessToken', 'workItemType'],
  },
};

interface TicketProvidersTabProps {
  workspace: any;
}

export default function TicketProvidersTab({ workspace }: TicketProvidersTabProps) {
  const { data: providers, isLoading, refetch } = useQuery(
    getTicketProviders,
    workspace?.id ? { workspaceId: workspace.id } : undefined
  );

  const [configureProvider, setConfigureProvider] = useState<string | null>(null);
  const [providerConfig, setProviderConfig] = useState<any>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const handleToggle = async (providerId: string, currentState: boolean) => {
    try {
      await toggleTicketProvider({ id: providerId, isEnabled: !currentState });
      refetch();
      toast.success('Provider toggled successfully');
    } catch (error) {
      console.error('Failed to toggle provider:', error);
      toast.error('Failed to toggle provider');
    }
  };

  const handleDelete = async (providerId: string) => {
    try {
      await deleteTicketProvider({ id: providerId });
      refetch();
      toast.success('Provider deleted successfully');
    } catch (error) {
      console.error('Failed to delete provider:', error);
      toast.error('Failed to delete provider');
    }
  };

  const handleSave = async (providerType: string) => {
    if (!workspace) return;

    try {
      await saveTicketProvider({
        workspaceId: workspace.id,
        provider: providerType as any,
        isEnabled: true,
        config: providerConfig,
      });
      refetch();
      setConfigureProvider(null);
      setProviderConfig({});
      toast.success('Ticket provider configured successfully');
    } catch (error: any) {
      console.error('Failed to save provider:', error);
      toast.error(error.message || 'Failed to save ticket provider configuration');
    }
  };

  const openConfigDialog = (providerType: string, existing?: any) => {
    setConfigureProvider(providerType);
    if (existing) {
      setProviderConfig(existing.config);
    } else {
      setProviderConfig({});
    }
  };

  const configuredProviders = providers || [];
  const availableProviders = Object.keys(TICKET_PROVIDERS) as Array<keyof typeof TICKET_PROVIDERS>;
  const currentProvider = configureProvider ? TICKET_PROVIDERS[configureProvider as keyof typeof TICKET_PROVIDERS] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ticket Providers</h2>
        <p className="text-muted-foreground">
          Configure ticket systems to automatically create tickets for security incidents
        </p>
      </div>

      {/* Configured Providers */}
      {configuredProviders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Configured Providers</h3>
          {configuredProviders.map((provider: any) => {
            const ProviderIcon = TICKET_PROVIDERS[provider.provider as keyof typeof TICKET_PROVIDERS]?.icon || Ticket;
            return (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ProviderIcon className="h-5 w-5" />
                      <div>
                        <CardTitle>{provider.provider.replace(/_/g, ' ')}</CardTitle>
                        <CardDescription>
                          {TICKET_PROVIDERS[provider.provider as keyof typeof TICKET_PROVIDERS]?.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={provider.isEnabled}
                        onCheckedChange={() => handleToggle(provider.id, provider.isEnabled)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmDelete(provider.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant={provider.isEnabled ? 'default' : 'secondary'} className="ml-2">
                        {provider.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConfigDialog(provider.provider, provider)}
                    >
                      Edit Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add New Provider */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Add Ticket Provider</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableProviders.map((providerType) => {
            const providerInfo = TICKET_PROVIDERS[providerType];
            const Icon = providerInfo.icon;
            const isConfigured = configuredProviders.some((p: any) => p.provider === providerType);

            return (
              <Card key={providerType} className={isConfigured ? 'opacity-50' : ''}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <div>
                      <CardTitle>{providerType.replace(/_/g, ' ')}</CardTitle>
                      <CardDescription>{providerInfo.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => openConfigDialog(providerType)}
                    disabled={isConfigured}
                    className="w-full"
                  >
                    {isConfigured ? 'Already Configured' : 'Configure'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={!!configureProvider} onOpenChange={(open) => !open && setConfigureProvider(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure {configureProvider?.replace(/_/g, ' ')}</DialogTitle>
            <DialogDescription>
              Set up your {configureProvider?.replace(/_/g, ' ')} ticket provider credentials
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {currentProvider && configureProvider && (
              <>
                {/* Jira Configuration */}
                {configureProvider === 'JIRA' && (
                  <>
                    <div>
                      <Label htmlFor="baseUrl">Base URL</Label>
                      <Input
                        id="baseUrl"
                        placeholder="https://your-domain.atlassian.net"
                        value={providerConfig.baseUrl || ''}
                        onChange={(e) =>
                          setProviderConfig({ ...providerConfig, baseUrl: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="apiToken">API Token</Label>
                      <Input
                        id="apiToken"
                        type="password"
                        placeholder="Your Jira API token"
                        value={providerConfig.apiToken || ''}
                        onChange={(e) =>
                          setProviderConfig({ ...providerConfig, apiToken: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectKey">Project Key</Label>
                      <Input
                        id="projectKey"
                        placeholder="PROJ"
                        value={providerConfig.projectKey || ''}
                        onChange={(e) =>
                          setProviderConfig({ ...providerConfig, projectKey: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="issueType">Issue Type</Label>
                      <Input
                        id="issueType"
                        placeholder="Bug"
                        value={providerConfig.issueType || ''}
                        onChange={(e) =>
                          setProviderConfig({ ...providerConfig, issueType: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}

                {/* ServiceNow Configuration */}
                {configureProvider === 'SERVICENOW' && (
                  <>
                    <div>
                      <Label htmlFor="instanceUrl">Instance URL</Label>
                      <Input
                        id="instanceUrl"
                        placeholder="https://dev123456.service-now.com"
                        value={providerConfig.instanceUrl || ''}
                        onChange={(e) =>
                          setProviderConfig({ ...providerConfig, instanceUrl: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="admin"
                        value={providerConfig.username || ''}
                        onChange={(e) =>
                          setProviderConfig({ ...providerConfig, username: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Your password"
                        value={providerConfig.password || ''}
                        onChange={(e) =>
                          setProviderConfig({ ...providerConfig, password: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="tableName">Table Name</Label>
                      <Input
                        id="tableName"
                        placeholder="incident"
                        value={providerConfig.tableName || ''}
                        onChange={(e) =>
                          setProviderConfig({ ...providerConfig, tableName: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}

                {/* Azure DevOps Configuration */}
                {configureProvider === 'AZURE_DEVOPS' && (
                  <>
                    <div>
                      <Label htmlFor="organization">Organization</Label>
                      <Input
                        id="organization"
                        placeholder="your-org"
                        value={providerConfig.organization || ''}
                        onChange={(e) =>
                          setProviderConfig({ ...providerConfig, organization: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="project">Project</Label>
                      <Input
                        id="project"
                        placeholder="your-project"
                        value={providerConfig.project || ''}
                        onChange={(e) =>
                          setProviderConfig({ ...providerConfig, project: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="personalAccessToken">Personal Access Token</Label>
                      <Input
                        id="personalAccessToken"
                        type="password"
                        placeholder="Your PAT"
                        value={providerConfig.personalAccessToken || ''}
                        onChange={(e) =>
                          setProviderConfig({
                            ...providerConfig,
                            personalAccessToken: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="workItemType">Work Item Type</Label>
                      <Input
                        id="workItemType"
                        placeholder="Bug"
                        value={providerConfig.workItemType || ''}
                        onChange={(e) =>
                          setProviderConfig({ ...providerConfig, workItemType: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfigureProvider(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleSave(configureProvider!)}>
                Save Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete Ticket Provider"
        description="Are you sure you want to delete this ticket provider? This action cannot be undone."
        onConfirm={async () => {
          if (confirmDelete) await handleDelete(confirmDelete);
        }}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
