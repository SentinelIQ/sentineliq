import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { 
  getObservables, 
  getTasksByCase, 
  getEvidenceList,
  getCaseById,
  assignCase,
  addCaseNote,
  closeCase,
  generateCaseReport,
  getTimeline
} from 'wasp/client/operations';
import { useWorkspace } from '../../../../hooks/useWorkspace';
import { toast } from 'sonner';
import { WorkspaceLayout } from '../../../workspace/WorkspaceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Textarea } from '../../../../components/ui/textarea';
import { 
  FolderOpen, 
  ArrowLeft, 
  Clock,
  User,
  FileText,
  Image,
  CheckCircle,
  Shield,
  AlertTriangle,
  Download,
  Upload,
  Search,
  Eye,
  Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import { TasksList } from '../components/TasksList';
import { ObservablesList } from '../components/ObservablesList';
import { TTPsList } from '../../../../modules/mitre/components';
import { ChainOfCustody } from '../components/ChainOfCustody';
import { Separator } from '../../../../components/ui/separator';

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('aegis');
  const { currentWorkspace } = useWorkspace();
  const [newNote, setNewNote] = useState('');

  // Fetch case details
  const { data: caseData, isLoading: caseLoading, refetch: refetchCase } = useQuery(
    getCaseById,
    { 
      workspaceId: currentWorkspace?.id || '',
      caseId: id || ''
    },
    { enabled: !!currentWorkspace?.id && !!id }
  );

  // Fetch tasks linked to this case
  const { data: tasksData, isLoading: tasksLoading } = useQuery(
    getTasksByCase,
    { 
      workspaceId: currentWorkspace?.id || '',
      caseId: id || ''
    },
    { enabled: !!currentWorkspace?.id && !!id }
  );

  // Fetch observables linked to this case
  const { data: observablesData, isLoading: observablesLoading } = useQuery(
    getObservables,
    { 
      filters: { caseId: id },
      pagination: { limit: 50, offset: 0 }
    } as any,
    { enabled: !!currentWorkspace?.id && !!id }
  );

  // Fetch evidence with custody logs
  const { data: evidenceData, isLoading: evidenceLoading } = useQuery(
    getEvidenceList,
    { 
      filters: { caseId: id }
    } as any,
    { enabled: !!currentWorkspace?.id && !!id }
  );

  // Fetch timeline for this case
  const { data: timelineData, isLoading: timelineLoading } = useQuery(
    getTimeline,
    { 
      workspaceId: currentWorkspace?.id || '',
      filters: { entityType: 'case', entityId: id }
    },
    { enabled: !!currentWorkspace?.id && !!id }
  );

  const tasks = tasksData || [];
  const observables = observablesData?.data || [];
  const evidence = evidenceData || [];
  const timeline = timelineData || [];

  const handleAddNote = async () => {
    if (newNote.trim()) {
      try {
        await addCaseNote({
          workspaceId: currentWorkspace?.id || '',
          caseId: id || '',
          content: newNote
        });
        toast.success('Note added successfully');
        setNewNote('');
        refetchCase();
      } catch (err) {
        console.error('Failed to add note:', err);
        toast.error('Failed to add note');
      }
    }
  };

  const handleCloseCase = async () => {
    try {
      await closeCase({
        workspaceId: currentWorkspace?.id || '',
        caseId: id || '',
        finalReport: { summary: 'Case closed after investigation' }
      });
      toast.success('Case closed successfully');
      refetchCase();
    } catch (err) {
      console.error('Failed to close case:', err);
      toast.error('Failed to close case');
    }
  };

  const handleGenerateReport = async () => {
    try {
      const report = await generateCaseReport({
        workspaceId: currentWorkspace?.id || '',
        caseId: id || ''
      });
      toast.success('Report generated successfully');
      // Could trigger download here
    } catch (err) {
      console.error('Failed to generate report:', err);
      toast.error('Failed to generate report');
    }
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'email': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'network': return <Shield className="w-5 h-5 text-purple-500" />;
      case 'file': return <Download className="w-5 h-5 text-orange-500" />;
      case 'log': return <FileText className="w-5 h-5 text-green-500" />;
      case 'screenshot': return <Image className="w-5 h-5 text-pink-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getEvidenceStatusColor = (status: string) => {
    switch (status) {
      case 'analyzed': return 'text-green-500';
      case 'quarantined': return 'text-red-500';
      case 'preserved': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <WorkspaceLayout>
      <div className="w-full">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border">
          <div className="w-full px-8 py-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/modules/aegis/cases')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FolderOpen className="w-8 h-8 text-blue-500" />
                  <h1 className="text-3xl font-bold">{caseData?.title || 'Carregando...'}</h1>
                  {caseData?.closedAt && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="default" className="bg-orange-500">
                    {caseData?.priority ? (t as any)(`cases.priority.${caseData.priority}`) : 'Baixa'}
                  </Badge>
                  <StatusBadge status={(caseData?.status || 'open') as any} type="case" />
                  <Badge variant="outline">
                    <User className="w-3 h-3 mr-1" />
                    {caseData?.assignedTo ? 
                      (typeof caseData.assignedTo === 'object' ? 
                        (caseData.assignedTo as any).username : 
                        caseData.assignedTo
                      ) : 'Não atribuído'}
                  </Badge>
                </div>
                <p className="text-muted-foreground max-w-3xl">{caseData?.description || 'Sem descrição disponível'}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleGenerateReport}>
                  <Download className="w-4 h-4 mr-2" />
                  {t('cases.actions.exportReport')}
                </Button>
                {caseData?.status !== 'CLOSED' && (
                  <Button variant="default" onClick={handleCloseCase}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('cases.actions.close')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-full px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-8">
                  <TabsTrigger value="overview">{t('cases.tabs.overview')}</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="observables">Observables</TabsTrigger>
                  <TabsTrigger value="ttps">TTPs</TabsTrigger>
                  <TabsTrigger value="incidents">{t('cases.tabs.incidents')}</TabsTrigger>
                  <TabsTrigger value="evidence">{t('cases.tabs.evidence')}</TabsTrigger>
                  <TabsTrigger value="findings">{t('cases.tabs.findings')}</TabsTrigger>
                  <TabsTrigger value="timeline">{t('cases.tabs.timeline')}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Summary Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Total Incidents</CardDescription>
                        <CardTitle className="text-3xl">{caseData?.incidentCount || 0}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Evidence Collected</CardDescription>
                        <CardTitle className="text-3xl text-blue-500">{evidence.length}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Hosts Analyzed</CardDescription>
                        <CardTitle className="text-3xl text-purple-500">{observables.length}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Threats Identified</CardDescription>
                        <CardTitle className="text-3xl text-red-500">—</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Users Affected</CardDescription>
                        <CardTitle className="text-3xl text-orange-500">{tasks.length}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Data Exfiltrated</CardDescription>
                        <CardTitle className="text-3xl text-green-500">{caseData?.status === 'CLOSED' ? 'Fechado' : 'Em andamento'}</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('cases.notes.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Add Note */}
                      {caseData?.status !== 'CLOSED' && (
                        <>
                          <div className="space-y-2">
                            <Textarea
                              placeholder={t('cases.notes.placeholder')}
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              rows={3}
                            />
                            <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                              <FileText className="w-4 h-4 mr-2" />
                              {t('cases.notes.add')}
                            </Button>
                          </div>
                          <Separator />
                        </>
                      )}

                      {/* Notes List */}
                      <div className="space-y-3">
                        {(caseData?.notes || []).map((note: any) => (
                          <div key={note.id} className="p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{note.author}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(note.timestamp).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-sm">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tasks" className="space-y-6">
                  <TasksList 
                    tasks={tasks as any} 
                    groupBy="group"
                    showProgress={true}
                    defaultView="list"
                  />
                </TabsContent>

                <TabsContent value="observables" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Observables & IOCs</CardTitle>
                      <CardDescription>
                        {observables.filter((o: any) => o.ioc).length} Indicators of Compromise identified
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ObservablesList 
                        observables={observables as any}
                        showEnrichment={true}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ttps" className="space-y-6">
                  <TTPsList
                    resourceId={id || ''}
                    resourceType="CASE"
                    title="Linked TTPs"
                    showSeverity={true}
                    showConfidence={true}
                    showOccurrenceCount={true}
                  />
                </TabsContent>

                <TabsContent value="incidents" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('cases.relatedIncidents.title')}</CardTitle>
                      <CardDescription>
                        {caseData?.incidents?.length || 0} {t('cases.relatedIncidents.related')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(caseData?.incidents || []).map((incident: any) => (
                        <div
                          key={incident.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/modules/aegis/incidents/${incident.id}`)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{incident.title}</span>
                            <SeverityBadge severity={incident.severity as any} />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{incident.id}</span>
                            <span>•</span>
                            <span>{new Date(incident.timestamp).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="evidence" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('cases.evidence.title')}</CardTitle>
                      <CardDescription>
                        {evidence.length} {t('cases.evidence.collected')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {evidence.map((evidenceItem: any) => (
                        <div
                          key={evidenceItem.id}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              {getEvidenceIcon(evidenceItem.type)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{evidenceItem.name}</h4>
                                  <Badge variant="outline" className={getEvidenceStatusColor(evidenceItem.status)}>
                                    {evidenceItem.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {evidenceItem.description}
                                </p>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">ID: </span>
                                    <span className="font-mono">{evidenceItem.id}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Size: </span>
                                    <span>{evidenceItem.size}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Collected: </span>
                                    <span>{new Date(evidenceItem.collectedAt).toLocaleDateString('pt-BR')}</span>
                                  </div>
                                </div>
                                <div className="mt-2 text-xs">
                                  <span className="text-muted-foreground">Hash: </span>
                                  <span className="font-mono">{evidenceItem.hash}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Chain of Custody for this evidence */}
                          {evidenceItem.custodyLogs && evidenceItem.custodyLogs.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <ChainOfCustody
                                custodyLogs={evidenceItem.custodyLogs}
                                evidenceId={evidenceItem.id}
                                evidenceName={evidenceItem.name}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="findings" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('cases.findings.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Attack Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Attack Vector</p>
                          <p className="font-semibold">{caseData?.findings || 'Aguardando análise'}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Threat Actor</p>
                          <p className="font-semibold">{caseData?.findings && (caseData.findings as any).threatActor}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Motive</p>
                          <p className="font-semibold">{caseData?.findings && (caseData.findings as any).motive}</p>
                        </div>
                      </div>

                      <Separator />

                      {/* Methodology */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Search className="w-4 h-4" />
                          Attack Methodology
                        </h4>
                        <ol className="space-y-2 list-decimal list-inside">
                          {(caseData?.findings as any)?.methodology?.map((step: string, idx: number) => (
                            <li key={idx} className="text-sm">{step}</li>
                          ))}
                        </ol>
                      </div>

                      <Separator />

                      {/* Indicators */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Indicators of Compromise (IOCs)
                        </h4>
                        <div className="space-y-2">
                          {(caseData?.findings as any)?.indicators?.map((ioc: string, idx: number) => (
                            <div key={idx} className="p-2 bg-destructive/10 rounded text-sm font-mono">
                              {ioc}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Impact */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Impact Assessment
                        </h4>
                        <p className="text-sm">{caseData?.findings && typeof caseData.findings === 'object' && 'impact' in caseData.findings ? (caseData.findings as any).impact : ''}</p>
                      </div>

                      <Separator />

                      {/* Recommendations */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {(caseData?.findings as any)?.recommendations?.map((rec: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Task Timeline (Gantt Chart)</CardTitle>
                      <CardDescription>Visual timeline of all tasks and their dependencies</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TasksList 
                        tasks={tasks as any} 
                        groupBy="group"
                        showProgress={false}
                        defaultView="timeline"
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('cases.timeline.title')}</CardTitle>
                      <CardDescription>{t('cases.timeline.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Timeline events={(caseData?.timeline || []).map((e: any) => ({
                        ...e,
                        type: e.type?.toLowerCase() as 'info' | 'success' | 'warning' | 'error'
                      }))} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('cases.sidebar.information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('cases.fields.created')}</p>
                      <p className="text-sm font-medium">
                        {new Date(caseData?.createdAt || new Date()).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {caseData?.closedAt && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t('cases.fields.closed')}</p>
                          <p className="text-sm font-medium">
                            {new Date(caseData.closedAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('cases.fields.investigator')}</p>
                      <p className="text-sm font-medium">{typeof caseData?.investigator === 'object' && caseData.investigator !== null ? (caseData.investigator as any).username || 'Unknown' : String(caseData?.investigator || 'Unknown')}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('cases.fields.team')}</p>
                      <p className="text-sm font-medium">{caseData?.team}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('cases.sidebar.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    {t('cases.actions.downloadEvidence')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="w-4 h-4 mr-2" />
                    {t('cases.actions.uploadEvidence')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    {t('cases.actions.generateReport')}
                  </Button>
                  {caseData?.status === 'CLOSED' && (
                    <Button variant="outline" className="w-full justify-start">
                      <Lock className="w-4 h-4 mr-2" />
                      {t('cases.actions.archive')}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Classification */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('cases.sidebar.classification')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Badge variant="destructive" className="w-full justify-center">
                    {t('cases.classification.confidential')}
                  </Badge>
                  <Badge variant="outline" className="w-full justify-center">
                    {t('cases.classification.forensic')}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
