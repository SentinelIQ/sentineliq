import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getIncidents, getIncidentStats } from 'wasp/client/operations';
import { useWorkspace } from '../../../../hooks/useWorkspace';
import { WorkspaceLayout } from '../../../workspace/WorkspaceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Shield, Filter, Plus, Search, ChevronRight, Clock, User, Edit } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Form imports
import { IncidentForm } from '../components/forms/IncidentForm';
import { ResponsiveFormDialog, useModalState } from '../components/modals/FormModals';

export default function IncidentsPage() {
  const navigate = useNavigate();
  const { t: tAegis } = useTranslation('aegis');
  const { t: tCommon } = useTranslation('common');
  const { currentWorkspace } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingIncident, setEditingIncident] = useState<any>(null);

  // Modal states
  const createModal = useModalState();
  const editModal = useModalState();

  // Fetch incidents
  const { data: incidentsData, isLoading: incidentsLoading, refetch: refetchIncidents } = useQuery(
    getIncidents,
    { 
      filters: {},
      pagination: { limit: 100, offset: 0 }
    } as any,
    { enabled: !!currentWorkspace?.id }
  );

  // Fetch incident statistics
  const { data: statsData } = useQuery(
    getIncidentStats,
    { workspaceId: currentWorkspace?.id || '' },
    { enabled: !!currentWorkspace?.id }
  );

  const incidents = incidentsData?.data || [];
  const stats = statsData || { 
    totalOpen: 0, 
    critical: 0, 
    inSLA: 0, 
    outOfSLA: 0, 
    resolved7d: 0 
  };

  // Handle form success
  const handleFormSuccess = () => {
    refetchIncidents();
    createModal.closeModal();
    editModal.closeModal();
    setEditingIncident(null);
  };

  // Handle edit incident
  const handleEditIncident = (incident: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingIncident(incident);
    editModal.openModal();
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
      active: 'destructive',
      investigating: 'default',
      containment: 'default',
      resolved: 'secondary',
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  const getSeverityLabel = (severity: string) => {
    return String(tAegis(`incidents.severity.${severity}` as any));
  };

  const getStatusLabel = (status: string) => {
    return String(tAegis(`incidents.status.${status}` as any));
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
                    onClick={() => navigate('/modules/aegis')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {tCommon('breadcrumb.aegis')}
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <Shield className="w-8 h-8 text-red-500" />
                    <h1 className="text-4xl font-bold">{tAegis('incidents.title')}</h1>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {tAegis('incidents.description')}
                </p>
              </div>
              <ResponsiveFormDialog
                trigger={
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    {tAegis('incidents.new')}
                  </Button>
                }
                title="Create New Incident"
                description="Create a security incident with full investigation details"
                open={createModal.open}
                onOpenChange={createModal.setOpen}
                size="xl"
              >
                <IncidentForm 
                  onSuccess={handleFormSuccess}
                  onCancel={createModal.closeModal}
                />
              </ResponsiveFormDialog>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-full px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{tAegis('incidents.stats.totalOpen')}</CardDescription>
                <CardTitle className="text-3xl">{stats.totalOpen}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{tAegis('incidents.stats.critical')}</CardDescription>
                <CardTitle className="text-3xl text-red-500">{stats.critical}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{tAegis('incidents.stats.inSLA')}</CardDescription>
                <CardTitle className="text-3xl text-green-500">{stats.inSLA}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{tAegis('incidents.stats.outOfSLA')}</CardDescription>
                <CardTitle className="text-3xl text-red-500">{stats.outOfSLA}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{tAegis('incidents.stats.resolved7d')}</CardDescription>
                <CardTitle className="text-3xl">{stats.resolved7d}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{tCommon('filters.title')}</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={tAegis('incidents.search')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    {tAegis('incidents.filter')}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Incidents List */}
          <Card>
            <CardHeader>
              <CardTitle>{tAegis('incidents.title')}</CardTitle>
              <CardDescription>
                {incidentsLoading ? 'Loading...' : tAegis('incidents.found', { count: incidents.length })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="p-5 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/modules/aegis/incidents/${incident.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{incident.title}</h3>
                          <Badge variant={getSeverityColor(incident.severity) as any}>
                            {getSeverityLabel(incident.severity)}
                          </Badge>
                          <Badge variant={getStatusColor(incident.status) as any}>
                            {getStatusLabel(incident.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {incident.description}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-muted-foreground">{incident.id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>{incident.assignee}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{tAegis('incidents.fields.sla')}: {incident.sla}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <span>{String(tAegis('incidents.systemsAffected', { count: Array.isArray(incident.affectedSystems) ? incident.affectedSystems.length : (incident.affectedSystems || 0) }))}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => handleEditIncident(incident, e)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          {tAegis('incidents.actions.manage')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Incident Modal */}
      <ResponsiveFormDialog
        trigger={<div />} // Hidden trigger since we open programmatically
        title="Edit Incident"
        description="Update incident details and investigation progress"
        open={editModal.open}
        onOpenChange={editModal.setOpen}
        size="xl"
      >
        {editingIncident && (
          <IncidentForm 
            incident={editingIncident}
            onSuccess={handleFormSuccess}
            onCancel={editModal.closeModal}
          />
        )}
      </ResponsiveFormDialog>
    </WorkspaceLayout>
  );
}
