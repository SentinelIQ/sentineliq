import { useState, useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAlerts, getAlertStats, bulkUpdateAegisAlerts } from 'wasp/client/operations';
import { WorkspaceLayout } from '../../../workspace/WorkspaceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { AlertTriangle, Filter, Plus, Search, ChevronRight, Edit } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BulkOperationsBar, SelectableCard } from '../components/BulkOperations';
import { toast } from 'sonner';
import useWorkspace from '../../../../hooks/useWorkspace';

// Form imports
import { AlertForm, QuickAlertForm } from '../components/forms/AlertForm';
import { ResponsiveFormDialog, QuickFormModal, useModalState } from '../components/modals/FormModals';

export default function AlertsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('aegis');
  const { currentWorkspace } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [editingAlert, setEditingAlert] = useState<any>(null);

  // Modal states
  const createModal = useModalState();
  const quickCreateModal = useModalState();
  const editModal = useModalState();

  // Fetch alerts with real-time data
  const { 
    data: alertsData, 
    isLoading: alertsLoading, 
    error: alertsError,
    refetch: refetchAlerts 
  } = useQuery(
    getAlerts,
    { 
      filters: {},
      pagination: { limit: 100, offset: 0 }
    } as any,
    { enabled: !!currentWorkspace?.id }
  );

  // Fetch alert statistics
  const { 
    data: statsData, 
    isLoading: statsLoading 
  } = useQuery(
    getAlertStats,
    { workspaceId: currentWorkspace?.id || '' },
    { enabled: !!currentWorkspace?.id }
  );

  const alerts = alertsData?.data || [];
  const stats = statsData || {
    total: 0,
    critical: 0,
    high: 0,
    new24h: 0
  };

  // Handle errors
  useEffect(() => {
    if (alertsError) {
      toast.error('Failed to load alerts');
    }
  }, [alertsError]);

  // Handle form success
  const handleFormSuccess = () => {
    refetchAlerts();
    createModal.closeModal();
    quickCreateModal.closeModal();
    editModal.closeModal();
    setEditingAlert(null);
  };

  // Handle edit alert
  const handleEditAlert = (alert: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingAlert(alert);
    editModal.openModal();
  };

  // Bulk operations handler
  const handleBulkUpdate = async (updates: any) => {
    try {
      await bulkUpdateAegisAlerts({
        workspaceId: currentWorkspace?.id || '',
        alertIds: Array.from(selectedAlerts),
        data: updates
      });
      toast.success('Alerts updated successfully');
      setSelectedAlerts(new Set());
      refetchAlerts();
    } catch (err) {
      toast.error('Failed to update alerts');
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'destructive',
      high: 'default',
      medium: 'secondary',
      low: 'outline',
    };
    return colors[severity as keyof typeof colors] || 'secondary';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'destructive',
      acknowledged: 'default',
      investigating: 'default',
      resolved: 'secondary',
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  const getSeverityLabel = (severity: string) => {
    return String((t as any)(`alerts.severity.${severity}`));
  };

  const getStatusLabel = (status: string) => {
    return String((t as any)(`alerts.status.${status}`));
  };

  const toggleAlertSelection = (alertId: string) => {
    setSelectedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  return (
    <WorkspaceLayout>
      <div className="w-full">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border">
          <div className="w-full px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/modules/aegis/dashboard')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {t('common.breadcrumb.aegis')}
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    <h1 className="text-4xl font-bold">{t('alerts.title')}</h1>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {t('alerts.description')}
                </p>
              </div>
              <div className="flex gap-2">
                <QuickFormModal
                  trigger={
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Quick Alert
                    </Button>
                  }
                  title="Quick Alert Creation"
                  description="Create a simple alert quickly"
                  open={quickCreateModal.open}
                  onOpenChange={quickCreateModal.setOpen}
                >
                  <QuickAlertForm 
                    onSuccess={handleFormSuccess}
                    onCancel={quickCreateModal.closeModal}
                  />
                </QuickFormModal>
                
                <ResponsiveFormDialog
                  trigger={
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('alerts.new')}
                    </Button>
                  }
                  title="Create New Alert"
                  description="Create a comprehensive security alert with full details"
                  open={createModal.open}
                  onOpenChange={createModal.setOpen}
                  size="xl"
                >
                  <AlertForm 
                    onSuccess={handleFormSuccess}
                    onCancel={createModal.closeModal}
                  />
                </ResponsiveFormDialog>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-full px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t('alerts.stats.total')}</CardDescription>
                <CardTitle className="text-3xl">
                  {statsLoading ? '...' : stats.total}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t('alerts.stats.critical')}</CardDescription>
                <CardTitle className="text-3xl text-red-500">
                  {statsLoading ? '...' : stats.critical}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t('alerts.stats.high')}</CardDescription>
                <CardTitle className="text-3xl text-orange-500">
                  {statsLoading ? '...' : stats.high}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t('alerts.stats.new24h')}</CardDescription>
                <CardTitle className="text-3xl">
                  {statsLoading ? '...' : stats.new24h}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('common.filters.title')}</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('alerts.search')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    {t('alerts.filter')}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle>{t('alerts.title')}</CardTitle>
              <CardDescription>
                {alertsLoading ? (t as any)('common.loading') : t('alerts.found', { count: alerts.length })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {(t as any)('common.loading')}...
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {(t as any)('alerts.noData')}
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert: any) => (
                  <SelectableCard
                    key={alert.id}
                    selected={selectedAlerts.has(alert.id)}
                    onToggleSelect={() => toggleAlertSelection(alert.id)}
                  >
                    <div
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/modules/aegis/alerts/${alert.id}`)}
                    >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{alert.title}</h3>
                          <Badge variant={getSeverityColor(alert.severity) as any}>
                            {getSeverityLabel(alert.severity)}
                          </Badge>
                          <Badge variant={getStatusColor(alert.status) as any}>
                            {getStatusLabel(alert.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="font-mono">{alert.id}</span>
                          <span>{t('alerts.fields.source')}: {alert.source}</span>
                          <span>{new Date(alert.timestamp).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => handleEditAlert(alert, e)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          {t('alerts.actions.view')}
                        </Button>
                      </div>
                    </div>
                    </div>
                  </SelectableCard>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bulk Operations Bar */}
      <BulkOperationsBar
        selectedCount={selectedAlerts.size}
        onClearSelection={() => setSelectedAlerts(new Set())}
        onMerge={() => handleBulkUpdate({ action: 'merge' })}
        onClose={() => handleBulkUpdate({ status: 'DISMISSED' })}
        onAssign={() => console.log('Assign alerts', Array.from(selectedAlerts))}
        onTag={() => console.log('Tag alerts', Array.from(selectedAlerts))}
        onExport={() => console.log('Export alerts', Array.from(selectedAlerts))}
        onEscalate={() => handleBulkUpdate({ action: 'escalate' })}
      />

      {/* Edit Alert Modal */}
      <ResponsiveFormDialog
        trigger={<div />} // Hidden trigger since we open programmatically
        title="Edit Alert"
        description="Update alert details and properties"
        open={editModal.open}
        onOpenChange={editModal.setOpen}
        size="xl"
      >
        {editingAlert && (
          <AlertForm 
            alert={editingAlert}
            onSuccess={handleFormSuccess}
            onCancel={editModal.closeModal}
          />
        )}
      </ResponsiveFormDialog>
    </WorkspaceLayout>
  );
}
