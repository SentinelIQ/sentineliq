import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import {
  getNotificationProviders,
  saveNotificationProvider,
  toggleNotificationProvider,
  deleteNotificationProvider,
} from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Switch } from '../../../../components/ui/switch';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Mail, MessageSquare, Webhook, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { useToast } from '../../../../hooks/useToast';

const PROVIDER_ICONS = {
  EMAIL: Mail,
  SLACK: MessageSquare,
  DISCORD: MessageSquare,
  WEBHOOK: Webhook,
  TELEGRAM: MessageSquare,
  TEAMS: MessageSquare,
};

const PROVIDER_DESCRIPTIONS = {
  EMAIL: 'Send notifications via email to workspace members',
  SLACK: 'Post notifications to a Slack channel via webhook',
  DISCORD: 'Post notifications to a Discord channel via webhook',
  WEBHOOK: 'Send notifications to a custom webhook URL',
  TELEGRAM: 'Send notifications to a Telegram channel',
  TEAMS: 'Post notifications to Microsoft Teams',
};

interface NotificationProvidersTabProps {
  workspace: any;
}

export default function NotificationProvidersTab({ workspace }: NotificationProvidersTabProps) {
  const { data: providers, isLoading, refetch } = useQuery(
    getNotificationProviders,
    workspace?.id ? { workspaceId: workspace.id } : undefined
  );

  const [configureProvider, setConfigureProvider] = useState<string | null>(null);
  const [providerConfig, setProviderConfig] = useState<any>({});
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const handleToggle = async (providerId: string, currentState: boolean) => {
    try {
      await toggleNotificationProvider({ id: providerId, isEnabled: !currentState });
      refetch();
      toast.success('Provider toggled successfully');
    } catch (error) {
      console.error('Failed to toggle provider:', error);
      toast.error('Failed to toggle provider');
    }
  };

  const handleDelete = async (providerId: string) => {
    try {
      await deleteNotificationProvider({ id: providerId });
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
      await saveNotificationProvider({
        workspaceId: workspace.id,
        provider: providerType as any,
        isEnabled: true,
        config: providerConfig,
        eventTypes: selectedEvents,
      });
      refetch();
      setConfigureProvider(null);
      setProviderConfig({});
      setSelectedEvents([]);
      toast.success('Provider configured successfully');
    } catch (error) {
      console.error('Failed to save provider:', error);
      toast.error('Failed to save provider configuration');
    }
  };

  const openConfigDialog = (providerType: string, existing?: any) => {
    setConfigureProvider(providerType);
    if (existing) {
      setProviderConfig(existing.config);
      setSelectedEvents(existing.eventTypes);
    } else {
      setProviderConfig({});
      setSelectedEvents(['member_added', 'payment_failed']);
    }
  };

  const configuredProviders = providers || [];
  const availableProviders = ['EMAIL', 'SLACK', 'DISCORD', 'WEBHOOK'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Providers</h2>
        <p className="text-muted-foreground">
          Configure how and where your workspace notifications are delivered
        </p>
      </div>

      {/* Configured Providers */}
      {configuredProviders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Configured Providers</h3>
          {configuredProviders.map((provider: any) => {
            const Icon = PROVIDER_ICONS[provider.provider as keyof typeof PROVIDER_ICONS];
            return (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <CardTitle>{provider.provider}</CardTitle>
                        <CardDescription>
                          {PROVIDER_DESCRIPTIONS[provider.provider as keyof typeof PROVIDER_DESCRIPTIONS]}
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
                      <span className="text-sm font-medium">Events:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {provider.eventTypes.map((event: string) => (
                          <Badge key={event} variant="secondary">
                            {event.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
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
        <h3 className="text-lg font-semibold">Add Provider</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableProviders.map((providerType) => {
            const Icon = PROVIDER_ICONS[providerType as keyof typeof PROVIDER_ICONS];
            const isConfigured = configuredProviders.some((p: any) => p.provider === providerType);

            return (
              <Card key={providerType} className={isConfigured ? 'opacity-50' : ''}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <div>
                      <CardTitle>{providerType}</CardTitle>
                      <CardDescription>
                        {PROVIDER_DESCRIPTIONS[providerType as keyof typeof PROVIDER_DESCRIPTIONS]}
                      </CardDescription>
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
            <DialogTitle>Configure {configureProvider}</DialogTitle>
            <DialogDescription>
              Set up how notifications are sent via {configureProvider}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Provider-specific config */}
            {(configureProvider === 'SLACK' || configureProvider === 'DISCORD') && (
              <div>
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://hooks.slack.com/services/..."
                  value={providerConfig.webhookUrl || ''}
                  onChange={(e) => setProviderConfig({ ...providerConfig, webhookUrl: e.target.value })}
                />
              </div>
            )}

            {configureProvider === 'WEBHOOK' && (
              <>
                <div>
                  <Label htmlFor="url">Webhook URL</Label>
                  <Input
                    id="url"
                    placeholder="https://your-api.com/webhook"
                    value={providerConfig.url || ''}
                    onChange={(e) => setProviderConfig({ ...providerConfig, url: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="method">HTTP Method</Label>
                  <Input
                    id="method"
                    placeholder="POST"
                    value={providerConfig.method || 'POST'}
                    onChange={(e) => setProviderConfig({ ...providerConfig, method: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Event selection */}
            <div>
              <Label>Events to notify</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['member_added', 'member_removed', 'payment_succeeded', 'payment_failed', 'subscription_changed'].map((event) => (
                  <label key={event} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEvents([...selectedEvents, event]);
                        } else {
                          setSelectedEvents(selectedEvents.filter((e) => e !== event));
                        }
                      }}
                    />
                    <span className="text-sm">{event.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

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
        title="Delete Notification Provider"
        description="Are you sure you want to delete this notification provider? This action cannot be undone."
        onConfirm={async () => { if (confirmDelete) await handleDelete(confirmDelete); }}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
