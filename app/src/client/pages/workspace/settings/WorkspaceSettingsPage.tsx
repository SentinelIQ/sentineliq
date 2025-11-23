import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, getCurrentWorkspace, updateWorkspace, deleteWorkspace, getUnreadCount } from 'wasp/client/operations';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WorkspaceLayout } from '../WorkspaceLayout';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import { Trash2, Save, Settings, Bell, Shield, Webhook, CreditCard, Network, Paintbrush, Ticket } from 'lucide-react';
import { DeleteWorkspaceDialog } from '../components/DeleteWorkspaceDialog';
import NotificationsTab from './tabs/NotificationsTab';
import { useToast } from '../../../hooks/useToast';
import AuditLogsTab from './tabs/AuditLogsTab';
import NotificationProvidersTab from './tabs/NotificationProvidersTab';
import TicketProvidersTab from './tabs/TicketProvidersTab';
import BillingTab from './tabs/BillingTab';
import { IpWhitelistSettings } from '../../../components/IpWhitelistSettings';
import DataExportTab from './tabs/DataExportTab';
import BrandingTab from './tabs/BrandingTab';

export default function WorkspaceSettingsPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: workspace, isLoading } = useQuery(getCurrentWorkspace);
  const { data: unreadCount } = useQuery(getUnreadCount);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');
  const { toast } = useToast();

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setDescription(workspace.description || '');
    }
  }, [workspace]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateWorkspace({ id: workspace.id, name, description });
      toast.success(t('workspace:branding.success'));
    } catch (error: any) {
      toast.error(error.message || t('common:messages.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteWorkspace({ workspaceId: workspace.id });
      setShowDeleteDialog(false);
      navigate('/workspaces');
      toast.success(t('workspace:delete.success'));
    } catch (error: any) {
      toast.error(error.message || t('workspace:delete.error'));
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <WorkspaceLayout>
        <div className="p-8">{t('workspace:settings.loading')}</div>
      </WorkspaceLayout>
    );
  }

  if (!workspace) {
    return (
      <WorkspaceLayout>
        <div className="p-8">
          <Alert>
            <AlertDescription>{t('workspace:settings.noWorkspaceSelected')}</AlertDescription>
          </Alert>
        </div>
      </WorkspaceLayout>
    );
  }

  const isOwner = workspace.userRole === 'OWNER';

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  return (
    <WorkspaceLayout>
      <div className="w-full px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">{t('workspace:settings.title')}</h1>
        <p className="text-muted-foreground mb-8">
          {t('workspace:settings.subtitle', 'Manage your workspace configuration, notifications, and audit logs')}
        </p>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 lg:w-[1200px]">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {t('workspace:settings.general')}
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Paintbrush className="w-4 h-4" />
              {t('workspace:settings.branding')}
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {t('workspace:settings.billing')}
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              {t('workspace:settings.security', 'Security')}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              {t('workspace:settings.notifications')}
              {unreadCount && unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {t('workspace:settings.audit')}
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              {t('workspace:settings.providers')}
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              {t('workspace:settings.tickets', 'Tickets')}
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {t('workspace:settings.dataExport')}
            </TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <BrandingTab workspace={workspace} isOwner={isOwner} />
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <IpWhitelistSettings workspaceId={workspace.id} />
          </TabsContent>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('workspace:settings.generalInfo')}</CardTitle>
                <CardDescription>{t('workspace:settings.updateDetails')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <Label htmlFor="name">{t('workspace:settings.workspaceName')}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isOwner}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">{t('workspace:settings.description')}</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!isOwner}
                      rows={4}
                    />
                  </div>

                  {isOwner && (
                    <Button type="submit" disabled={isSaving}>
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? t('workspace:settings.saving') : t('workspace:settings.saveChanges')}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>

            {isOwner && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">{t('workspace:settings.danger')}</CardTitle>
                  <CardDescription>
                    {t('workspace:settings.deleteWarning')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('workspace:settings.deleteWorkspace')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <AuditLogsTab workspace={workspace} />
          </TabsContent>

          {/* Notification Providers Tab */}
          <TabsContent value="providers">
            <NotificationProvidersTab workspace={workspace} />
          </TabsContent>

          {/* Ticket Providers Tab */}
          <TabsContent value="tickets">
            <TicketProvidersTab workspace={workspace} />
          </TabsContent>

          {/* Data Export Tab (GDPR Compliance) */}
          <TabsContent value="data">
            <DataExportTab workspace={workspace} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      {isOwner && (
        <DeleteWorkspaceDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          workspaceName={workspace.name}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </WorkspaceLayout>
  );
}
