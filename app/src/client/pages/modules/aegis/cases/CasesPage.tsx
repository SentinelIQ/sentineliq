import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getCases, getCaseStats } from 'wasp/client/operations';
import { useWorkspace } from '../../../../hooks/useWorkspace';
import { WorkspaceLayout } from '../../../workspace/WorkspaceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { FolderOpen, Filter, Plus, Search, ChevronRight, Clock, CheckCircle, Edit } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Form imports
import { CaseForm } from '../components/forms/CaseForm';
import { ResponsiveFormDialog, useModalState } from '../components/modals/FormModals';

export default function CasesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('aegis');
  const { currentWorkspace } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCase, setEditingCase] = useState<any>(null);

  // Modal states
  const createModal = useModalState();
  const editModal = useModalState();

  // Fetch cases
  const { data: casesData, isLoading: casesLoading, refetch: refetchCases } = useQuery(
    getCases,
    { 
      filters: {},
      pagination: { limit: 100, offset: 0 }
    } as any,
    { enabled: !!currentWorkspace?.id }
  );

  // Fetch case statistics
  const { data: statsData } = useQuery(
    getCaseStats,
    { workspaceId: currentWorkspace?.id || '' },
    { enabled: !!currentWorkspace?.id }
  );

  const cases = casesData?.data || [];
  const stats = statsData || { 
    total: 0, 
    active: 0, 
    review: 0, 
    closed30d: 0, 
    avgTime: '0d' 
  };

  // Handle form success
  const handleFormSuccess = () => {
    refetchCases();
    createModal.closeModal();
    editModal.closeModal();
    setEditingCase(null);
  };

  // Handle edit case
  const handleEditCase = (caseItem: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingCase(caseItem);
    editModal.openModal();
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'destructive',
      high: 'default',
      medium: 'secondary',
      low: 'outline',
    };
    return colors[priority as keyof typeof colors] || 'secondary';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'default',
      review: 'secondary',
      closed: 'outline',
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  const getPriorityLabel = (priority: string) => {
    return String((t as any)(`cases.priority.${priority}`));
  };

  const getStatusLabel = (status: string) => {
    return String((t as any)(`cases.status.${status}`));
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
                    <FolderOpen className="w-8 h-8 text-blue-500" />
                    <h1 className="text-4xl font-bold">{t('cases.title')}</h1>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {t('cases.description')}
                </p>
              </div>
              <ResponsiveFormDialog
                trigger={
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('cases.new')}
                  </Button>
                }
                title="Create New Investigation Case"
                description="Create a comprehensive investigation case with objectives and resources"
                open={createModal.open}
                onOpenChange={createModal.setOpen}
                size="xl"
              >
                <CaseForm 
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
                <CardDescription>{t('cases.stats.total')}</CardDescription>
                <CardTitle className="text-3xl">{stats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t('cases.stats.active')}</CardDescription>
                <CardTitle className="text-3xl text-blue-500">{stats.active}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t('cases.stats.review')}</CardDescription>
                <CardTitle className="text-3xl text-yellow-500">{stats.review}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t('cases.stats.closed30d')}</CardDescription>
                <CardTitle className="text-3xl text-green-500">{stats.closed30d}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t('cases.stats.avgTime')}</CardDescription>
                <CardTitle className="text-3xl">{stats.avgTime}</CardTitle>
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
                      placeholder={t('cases.search')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    {t('cases.filter')}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Cases List */}
          <Card>
            <CardHeader>
              <CardTitle>{t('cases.title')}</CardTitle>
              <CardDescription>
                {casesLoading ? 'Loading...' : t('cases.found', { count: cases.length })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cases.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    className="p-5 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/modules/aegis/cases/${caseItem.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{caseItem.title}</h3>
                          <Badge variant={getPriorityColor(caseItem.priority) as any}>
                            {getPriorityLabel(caseItem.priority)}
                          </Badge>
                          <Badge variant={getStatusColor(caseItem.status) as any}>
                            {getStatusLabel(caseItem.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {caseItem.description}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="font-mono text-muted-foreground">{caseItem.id}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('cases.fields.investigator')}: </span>
                            <span className="font-medium">{typeof caseItem.investigator === 'object' && caseItem.investigator !== null ? (caseItem.investigator as any)?.username || 'Unknown' : String(caseItem.investigator || 'Unknown')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{new Date(caseItem.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        <div>
                          <span className="text-muted-foreground">{t('cases.incidentsCount')}: </span>
                          <span className="font-medium">{caseItem.relatedIncidents}</span>
                        </div>
                          <div>
                            <span className="text-muted-foreground">{t('cases.evidenceItems')}: </span>
                            <span className="font-medium">{Array.isArray(caseItem.evidence) ? caseItem.evidence.length : (caseItem.evidence || 0)}</span>
                          </div>
                        </div>
                        {caseItem.closedAt && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>{t('cases.closedOn', new Date(caseItem.closedAt).toLocaleDateString('pt-BR'))}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => handleEditCase(caseItem, e)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          {t('cases.actions.view')}
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

      {/* Edit Case Modal */}
      <ResponsiveFormDialog
        trigger={<div />} // Hidden trigger since we open programmatically
        title="Edit Investigation Case"
        description="Update case details, objectives, and investigation progress"
        open={editModal.open}
        onOpenChange={editModal.setOpen}
        size="xl"
      >
        {editingCase && (
          <CaseForm 
            case={editingCase}
            onSuccess={handleFormSuccess}
            onCancel={editModal.closeModal}
          />
        )}
      </ResponsiveFormDialog>
    </WorkspaceLayout>
  );
}
