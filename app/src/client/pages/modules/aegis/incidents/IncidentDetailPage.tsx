import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { 
  getObservables, 
  getTasksByIncident, 
  getIncidentById,
  assignIncident,
  updateIncidentProgress,
  addIncidentNote,
  resolveIncident,
  closeIncident,
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
  Shield, 
  ArrowLeft, 
  Clock,
  User,
  Server,
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  Activity,
  PlayCircle,
  XCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import { TasksList } from '../components/TasksList';
import { ObservablesList } from '../components/ObservablesList';
import { TTPsList } from '../../../../modules/mitre/components';
import { Separator } from '../../../../components/ui/separator';
import { Progress } from '../../../../components/ui/progress';

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t: tAegis } = useTranslation('aegis');
  const { t: tCommon } = useTranslation('common');
  const { currentWorkspace } = useWorkspace();
  const [newNote, setNewNote] = useState('');

  // Fetch incident details
  const { data: incidentData, isLoading: incidentLoading, refetch: refetchIncident } = useQuery(
    getIncidentById,
    { 
      workspaceId: currentWorkspace?.id || '',
      incidentId: id || ''
    },
    { enabled: !!currentWorkspace?.id && !!id }
  );

  // Fetch tasks linked to this incident
  const { data: tasksData, isLoading: tasksLoading } = useQuery(
    getTasksByIncident,
    { 
      workspaceId: currentWorkspace?.id || '',
      incidentId: id || ''
    },
    { enabled: !!currentWorkspace?.id && !!id }
  );

  // Fetch observables linked to this incident
  const { data: observablesData, isLoading: observablesLoading } = useQuery(
    getObservables,
    { 
      filters: { incidentId: id },
      pagination: { limit: 50, offset: 0 }
    } as any,
    { enabled: !!currentWorkspace?.id && !!id }
  );

  // Fetch timeline for this incident
  const { data: timelineData, isLoading: timelineLoading } = useQuery(
    getTimeline,
    { 
      workspaceId: currentWorkspace?.id || '',
      filters: { entityType: 'incident', entityId: id }
    },
    { enabled: !!currentWorkspace?.id && !!id }
  );

  const tasks = tasksData || [];
  const observables = observablesData?.data || [];
  const timeline = timelineData || [];
  const ttps: any[] = []; // TTPs are case-level, not incident-level
  const incident = incidentData; // Alias for easier access

  const getSLAColor = () => {
    if (!incident?.slaDeadline) return 'text-green-500';
    const now = new Date();
    const deadline = new Date(incident.slaDeadline);
    if (now > deadline) return 'text-red-500';
    const timeLeft = deadline.getTime() - now.getTime();
    const total = deadline.getTime() - new Date(incident.createdAt).getTime();
    if (timeLeft / total < 0.2) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getSLAProgress = () => {
    if (!incident?.slaDeadline) return 0;
    const now = new Date();
    const start = new Date(incident.createdAt);
    const deadline = new Date(incident.slaDeadline);
    const elapsed = now.getTime() - start.getTime();
    const total = deadline.getTime() - start.getTime();
    return Math.min((elapsed / total) * 100, 100);
  };

  const handleAddNote = async () => {
    if (newNote.trim()) {
      try {
        await addIncidentNote({
          workspaceId: currentWorkspace?.id || '',
          incidentId: id || '',
          content: newNote
        });
        toast.success('Note added successfully');
        setNewNote('');
        refetchIncident();
      } catch (err) {
        console.error('Failed to add note:', err);
        toast.error('Failed to add note');
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      if (newStatus === 'resolved') {
        await resolveIncident({
          workspaceId: currentWorkspace?.id || '',
          incidentId: id || '',
          resolutionSummary: 'Incident resolved successfully'
        });
        toast.success('Incident resolved successfully');
      } else if (newStatus === 'closed') {
        await closeIncident({
          workspaceId: currentWorkspace?.id || '',
          incidentId: id || ''
        });
        toast.success('Incident closed successfully');
      }
      refetchIncident();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
    }
  };

  const getSLAStatusColor = () => {
    if (!incident?.slaDeadline) return 'text-green-500';
    const now = new Date();
    const deadline = new Date(incident.slaDeadline);
    if (now > deadline) return 'text-red-500';
    const timeLeft = deadline.getTime() - now.getTime();
    const total = deadline.getTime() - new Date(incident.createdAt).getTime();
    if (timeLeft / total < 0.2) return 'text-yellow-500';
    return 'text-green-500';
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
              onClick={() => navigate('/modules/aegis/incidents')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {tCommon('actions.back')}
            </Button>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-8 h-8 text-red-500" />
                  <h1 className="text-3xl font-bold">{incident?.title || 'Carregando...'}</h1>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <SeverityBadge severity={(incident?.severity?.toLowerCase() || 'medium') as 'critical' | 'high' | 'medium' | 'low'} showIcon />
                  <StatusBadge status={(incident?.status?.toLowerCase() || 'active') as any} type="incident" />
                  <Badge variant="outline" className={getSLAColor()}>
                    <Clock className="w-3 h-3 mr-1" />
                    SLA: {incident?.slaDeadline ? (new Date() > new Date(incident.slaDeadline) ? 'Em violação' : 'Em cumprimento') : 'Não definido'}
                  </Badge>
                </div>
                <p className="text-muted-foreground max-w-3xl">{incident?.description || 'Sem descrição disponível'}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleStatusChange('investigating')}>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  {tAegis('incidents.actions.startInvestigation')}
                </Button>
                <Button variant="destructive">
                  <Shield className="w-4 h-4 mr-2" />
                  {tAegis('incidents.actions.escalate')}
                </Button>
                <Button variant="default">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {tAegis('incidents.actions.resolve')}
                </Button>
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
                  <TabsTrigger value="overview">{tAegis('incidents.tabs.overview')}</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="observables">Observables</TabsTrigger>
                  <TabsTrigger value="ttps">TTPs</TabsTrigger>
                  <TabsTrigger value="systems">{tAegis('incidents.tabs.systems')}</TabsTrigger>
                  <TabsTrigger value="response">{tAegis('incidents.tabs.response')}</TabsTrigger>
                  <TabsTrigger value="timeline">{tAegis('incidents.tabs.timeline')}</TabsTrigger>
                  <TabsTrigger value="notes">{tAegis('incidents.tabs.notes')}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Detection Time</CardDescription>
                        <CardTitle className="text-2xl text-green-500">{incident?.detectionTime || '0 min'}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Response Time</CardDescription>
                        <CardTitle className="text-2xl text-blue-500">{incident?.responseTime || '0 min'}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Containment Time</CardDescription>
                        <CardTitle className="text-2xl text-yellow-500">{incident?.containmentTime || '0 min'}</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* Progress */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{tAegis('incidents.response.playbook')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Investigation Progress</span>
                          <span className="font-medium">{incident?.progress || 0}%</span>
                        </div>
                        <Progress value={incident?.progress || 0} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Remediation Progress</span>
                          <span className="font-medium">{incident?.progress || 0}%</span>
                        </div>
                        <Progress value={incident?.progress || 0} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Related Alerts */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{tAegis('incidents.relatedAlerts.title')}</CardTitle>
                      <CardDescription>
                        {incident?.alerts?.length || 0} {tAegis('incidents.relatedAlerts.count')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(incident?.alerts || []).map((alert: any) => (
                        <div
                          key={alert.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/modules/aegis/alerts/${alert.id}`)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{alert.title}</span>
                            <SeverityBadge severity={alert.severity as any} />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{alert.id}</span>
                            <span>•</span>
                            <span>{new Date(alert.timestamp).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tasks" className="space-y-6">
                  <TasksList 
                    tasks={tasks.map((t: any) => ({
                      ...t,
                      description: t.description || undefined
                    }))} 
                    groupBy="group"
                    showProgress={true}
                    defaultView="list"
                    onStatusChange={(taskId: string, newStatus: string) => {
                      console.log('Update task', taskId, 'to', newStatus);
                    }}
                  />
                </TabsContent>

                <TabsContent value="observables" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Observables</CardTitle>
                      <CardDescription>
                        {observables.filter((o: any) => o.ioc).length} IoCs identified from this incident
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ObservablesList 
                        observables={observables.map((o: any) => ({
                          ...o,
                          type: o.type?.toLowerCase() as any
                        }))}
                        showEnrichment={true}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ttps" className="space-y-6">
                  <TTPsList 
                    resourceId={id || ''} 
                    resourceType="INCIDENT"
                    title="MITRE ATT&CK Tactics & Techniques"
                    showSeverity={true}
                    showConfidence={true}
                    showOccurrenceCount={true}
                  />
                </TabsContent>

                <TabsContent value="systems" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{tAegis('incidents.systems.title')}</CardTitle>
                      <CardDescription>
                        {incident?.affectedSystems?.length || 0} {tAegis('incidents.systems.affected')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(incident?.affectedSystems || []).map((system: any, index: number) => (
                        <div
                          key={system.name || system.id || index}
                          className="p-4 border rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Server className="w-5 h-5 text-blue-500" />
                              <div>
                                <h4 className="font-semibold">{system.name}</h4>
                                <p className="text-sm text-muted-foreground">{system.type}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                system.criticality === 'critical' ? 'destructive' :
                                system.criticality === 'high' ? 'default' : 'secondary'
                              }>
                                {system.criticality}
                              </Badge>
                              <Badge variant={
                                system.status === 'isolated' ? 'destructive' :
                                system.status === 'monitoring' ? 'default' : 'secondary'
                              }>
                                {system.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="response" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{tAegis('incidents.response.playbook')}</CardTitle>
                      <CardDescription>{incident?.responsePlaybook?.name || 'No playbook assigned'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(incident?.responsePlaybook?.phases || []).map((phase: any, idx: number) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {phase.completed ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <Clock className="w-5 h-5 text-muted-foreground" />
                              )}
                              <span className={phase.completed ? 'font-medium' : 'text-muted-foreground'}>
                                {phase.name}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">{phase.progress}%</span>
                          </div>
                          <Progress value={phase.progress} className="h-2" />
                        </div>
                      ))}
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
                        tasks={tasks.map((t: any) => ({
                          ...t,
                          description: t.description || undefined
                        }))} 
                        groupBy="group"
                        showProgress={false}
                        defaultView="timeline"
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>{tAegis('incidents.timeline.title')}</CardTitle>
                      <CardDescription>{tAegis('incidents.timeline.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Timeline events={(incident?.timeline || []).map((e: any) => ({
                        ...e,
                        type: e.type?.toLowerCase() as 'info' | 'success' | 'warning' | 'error'
                      }))} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notes" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{tAegis('incidents.notes.title')}</CardTitle>
                      <CardDescription>{tAegis('incidents.notes.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Add Note */}
                      <div className="space-y-2">
                        <Textarea
                          placeholder={tAegis('incidents.notes.placeholder')}
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          rows={3}
                        />
                        <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                          <FileText className="w-4 h-4 mr-2" />
                          {tAegis('incidents.notes.add')}
                        </Button>
                      </div>

                      <Separator />

                      {/* Notes List */}
                      <div className="space-y-4">
                        {(incident?.notes || []).map((note: any) => (
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
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{tAegis('incidents.sidebar.information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{tAegis('incidents.fields.created')}</p>
                      <p className="text-sm font-medium">
                        {new Date(incident?.createdAt || new Date()).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{tAegis('incidents.fields.assignee')}</p>
                      <p className="text-sm font-medium">{incident?.assignee || 'Não atribuído'}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{tAegis('incidents.fields.team')}</p>
                      <p className="text-sm font-medium">{incident?.team || 'Não atribuído'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SLA Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{tAegis('incidents.sidebar.sla')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Time Elapsed</span>
                      <span className={`font-medium ${getSLAColor()}`}>
                        {incident?.createdAt ? 
                          Math.floor((new Date().getTime() - new Date(incident.createdAt).getTime()) / (1000 * 60 * 60)) + 'h ' +
                          Math.floor(((new Date().getTime() - new Date(incident.createdAt).getTime()) % (1000 * 60 * 60)) / (1000 * 60)) + 'm'
                          : '0h 0m'
                        }
                      </span>
                    </div>
                    <Progress value={getSLAProgress()} className="h-2" />
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Response Deadline</span>
                      <span className="font-medium">
                        {incident?.slaDeadline ? new Date(incident.slaDeadline).toLocaleTimeString('pt-BR') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resolution Deadline</span>
                      <span className="font-medium">
                        {incident?.slaDeadline ? new Date(incident.slaDeadline).toLocaleTimeString('pt-BR') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{tAegis('incidents.sidebar.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    {tAegis('incidents.actions.exportReport')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="w-4 h-4 mr-2" />
                    {tAegis('incidents.actions.createCase')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-700">
                    <XCircle className="w-4 h-4 mr-2" />
                    {tAegis('incidents.actions.close')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
