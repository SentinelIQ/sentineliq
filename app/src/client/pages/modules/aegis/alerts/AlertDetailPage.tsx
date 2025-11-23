import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getObservables, getAlertById, acknowledgeAlert, assignAlert, dismissAlert, escalateToIncident } from 'wasp/client/operations';
import useWorkspace from '../../../../hooks/useWorkspace';
import { toast } from 'sonner';
import { WorkspaceLayout } from '../../../workspace/WorkspaceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { 
  AlertTriangle, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Globe,
  Server,
  Shield,
  FileText,
  Activity,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import { ObservablesList } from '../components/ObservablesList';
import { CreateCaseFromAlertDialog } from '../components/CreateCaseFromAlert';
import { TTPsList } from '../../../../modules/mitre/components';
import { Separator } from '../../../../components/ui/separator';
import type { Severity, AlertStatus } from '../types/aegis.types';

export default function AlertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('aegis');
  const { currentWorkspace } = useWorkspace();
  const [showCreateCaseDialog, setShowCreateCaseDialog] = useState(false);

  // Fetch alert details from API
  const { data: alertData, isLoading: alertLoading, error: alertError } = useQuery(
    getAlertById,
    { alertId: id || '', workspaceId: currentWorkspace?.id || '' },
    { enabled: !!currentWorkspace?.id && !!id }
  );

  // Fetch observables linked to this alert
  const { data: observablesData, isLoading: observablesLoading } = useQuery(
    getObservables,
    { 
      filters: { alertId: id },
      pagination: { limit: 50, offset: 0 }
    } as any,
    { enabled: !!currentWorkspace?.id && !!id }
  );

  // Fallback if alert not found
  const alert = (alertData as any)?.alert || {
    id: id || 'unknown',
    title: 'Alerta',
    description: 'Carregando dados...',
    severity: 'low' as Severity,
    status: 'new' as AlertStatus,
    source: 'unknown',
    sourceType: 'unknown',
    timestamp: new Date().toISOString(),
    detectedBy: 'Sistema',
    affectedAssets: [] as string[],
    threatScore: 0,
    category: 'Unknown',
    tags: [] as string[],
    assignedTo: null,
    threatAnalysis: {
      type: 'Unknown',
      confidence: 0,
      recommendations: [] as string[],
      relatedThreats: [] as any[]
    },
    technicalDetails: {
      protocol: '',
      port: 0,
      attempts: 0,
      duration: '',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      usernames: [] as string[]
    },
    timeline: [] as any[]
  };

  const observables = observablesData?.data || [];

  // Handle errors
  useEffect(() => {
    if (alertError) {
      toast.error(`Erro ao carregar alerta: ${alertError}`);
      setTimeout(() => navigate('/modules/aegis/alerts'), 2000);
    }
  }, [alertError, navigate]);

  const handleAcknowledge = async () => {
    try {
      await acknowledgeAlert({ 
        alertId: id || '',
        workspaceId: currentWorkspace?.id || '' 
      });
      toast.success('Alerta reconhecido com sucesso');
    } catch (err) {
      console.error('Erro ao reconhecer alerta:', err);
      toast.error('Falha ao reconhecer alerta');
    }
  };

  const handleEscalate = async () => {
    try {
      const incident = await escalateToIncident({ 
        alertId: id || '',
        workspaceId: currentWorkspace?.id || '',
        incidentData: {
          title: alert.title,
          description: alert.description,
          severity: alert.severity
        }
      });
      toast.success('Alerta escalado para incidente com sucesso');
      navigate(`/modules/aegis/incidents/${(incident as any)?.incident?.id}`);
    } catch (err) {
      console.error('Erro ao escalar alerta:', err);
      toast.error('Falha ao escalar alerta');
    }
  };

  const handleResolve = async () => {
    try {
      await dismissAlert({ 
        alertId: id || '',
        workspaceId: currentWorkspace?.id || '',
        justification: 'Resolvido - Nenhuma ação necessária'
      });
      toast.success('Alerta resolvido com sucesso');
      navigate('/modules/aegis/alerts');
    } catch (err) {
      console.error('Erro ao resolver alerta:', err);
      toast.error('Falha ao resolver alerta');
    }
  };

  return (
    <WorkspaceLayout>
      <div className="w-full">
        {/* Loading State */}
        {alertLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Carregando alerta...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {alertError && !alertLoading && (
          <div className="flex items-center justify-center py-12">
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <p className="text-destructive">Erro ao carregar alerta</p>
                <Button 
                  onClick={() => navigate('/modules/aegis/alerts')} 
                  className="mt-4"
                >
                  Voltar
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content */}
        {!alertLoading && !alertError && (
          <>
            {/* Header */}
            <div className="bg-muted/30 border-b border-border">
          <div className="w-full px-8 py-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/modules/aegis/alerts')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  <h1 className="text-3xl font-bold">{alert.title}</h1>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <SeverityBadge severity={alert.severity as Severity} showIcon />
                  <StatusBadge status={alert.status as any} type="alert" />
                  <Badge variant="outline">{alert.source}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-muted-foreground max-w-3xl">{alert.description}</p>
              </div>

              <div className="flex gap-2">
                {alert.status === 'new' && (
                  <Button variant="outline" onClick={handleAcknowledge}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('alerts.actions.acknowledge')}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateCaseDialog(true)}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Create Case
                </Button>
                <Button variant="destructive" onClick={handleEscalate}>
                  <Shield className="w-4 h-4 mr-2" />
                  {t('alerts.actions.escalate')}
                </Button>
                <Button variant="default" onClick={handleResolve}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('alerts.actions.resolve')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-full px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">{t('alerts.tabs.overview')}</TabsTrigger>
                  <TabsTrigger value="observables">Observables</TabsTrigger>
                  <TabsTrigger value="analysis">{t('alerts.tabs.analysis')}</TabsTrigger>
                  <TabsTrigger value="technical">{t('alerts.tabs.technical')}</TabsTrigger>
                  <TabsTrigger value="ttps">MITRE ATT&CK</TabsTrigger>
                  <TabsTrigger value="timeline">{t('alerts.tabs.timeline')}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('alerts.overview.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t('alerts.fields.id')}</p>
                          <p className="font-mono font-semibold">{alert.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t('alerts.fields.source')}</p>
                          <p className="font-medium">{alert.source}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t('alerts.fields.category')}</p>
                          <p className="font-medium">{alert.category}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t('alerts.fields.threatScore')}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-red-500">{alert.threatScore}</span>
                            <span className="text-sm text-muted-foreground">/ 10</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">{t('alerts.fields.affectedAssets')}</p>
                        <div className="flex flex-wrap gap-2">
                          {alert.affectedAssets.map((asset: string) => (
                            <Badge key={asset} variant="secondary">
                              <Server className="w-3 h-3 mr-1" />
                              {asset}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">{t('alerts.fields.tags')}</p>
                        <div className="flex flex-wrap gap-2">
                          {alert.tags.map((tag: string) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="observables" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Observables</CardTitle>
                      <CardDescription>
                        {observables.filter((o: any) => o.ioc).length} IoCs extracted from this alert
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

                <TabsContent value="analysis" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('alerts.analysis.title')}</CardTitle>
                      <CardDescription>
                        {t('alerts.analysis.confidence')}: {alert.threatAnalysis && (alert.threatAnalysis as any).confidence}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">{t('alerts.analysis.type')}</p>
                        <Badge variant="destructive" className="text-base px-3 py-1">
                          {alert.threatAnalysis && (alert.threatAnalysis as any).type}
                        </Badge>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm font-medium mb-3">{t('alerts.analysis.recommendations')}</p>
                        <ul className="space-y-2">
                          {alert.threatAnalysis && (alert.threatAnalysis as any).recommendations?.map((rec: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {alert.threatAnalysis && (alert.threatAnalysis as any).relatedThreats?.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm font-medium mb-3">{t('alerts.analysis.relatedThreats')}</p>
                            <div className="space-y-2">
                              {(alert.threatAnalysis as any).relatedThreats.map((threat: any) => (
                                <div
                                  key={threat.id}
                                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                  onClick={() => navigate(`/modules/aegis/alerts/${threat.id}`)}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{threat.title}</span>
                                    <Badge variant="default">{threat.severity}</Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{threat.id}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="technical" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('alerts.technical.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">IP Address</p>
                            <p className="font-mono font-semibold">{(alert as any).ipAddress || 'N/A'}</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Location</p>
                            <p className="font-medium">{(alert as any).location || 'N/A'}</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Protocol</p>
                            <p className="font-mono font-semibold">{alert.technicalDetails && (alert.technicalDetails as any).protocol}</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Port</p>
                            <p className="font-mono font-semibold">{alert.technicalDetails && (alert.technicalDetails as any).port}</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Attempts</p>
                            <p className="font-semibold text-red-500">{alert.technicalDetails && (alert.technicalDetails as any).attempts}</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Duration</p>
                            <p className="font-medium">{alert.technicalDetails && (alert.technicalDetails as any).duration}</p>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <p className="text-sm font-medium mb-2">Usernames Attempted</p>
                          <div className="flex flex-wrap gap-2">
                            {alert.technicalDetails && (alert.technicalDetails as any).usernames?.map((username: string) => (
                              <Badge key={username} variant="outline" className="font-mono">
                                {username}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">First Seen</p>
                            <p className="text-sm">{alert.technicalDetails && new Date((alert.technicalDetails as any).firstSeen).toLocaleString('pt-BR')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Last Seen</p>
                            <p className="text-sm">{alert.technicalDetails && new Date((alert.technicalDetails as any).lastSeen).toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ttps" className="space-y-6">
                  <TTPsList
                    resourceId={id || ''}
                    resourceType="ALERT"
                    title="MITRE ATT&CK Tactics & Techniques"
                    showSeverity={true}
                    showConfidence={true}
                    showOccurrenceCount={true}
                  />
                </TabsContent>

                <TabsContent value="timeline" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('alerts.timeline.title')}</CardTitle>
                      <CardDescription>{t('alerts.timeline.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Timeline events={alert.timeline as any} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('alerts.sidebar.information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('alerts.fields.detected')}</p>
                      <p className="text-sm font-medium">
                        {new Date(alert.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('alerts.fields.detectedBy')}</p>
                      <p className="text-sm font-medium">{alert.detectedBy}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('alerts.fields.assignedTo')}</p>
                      <p className="text-sm font-medium">
                        {(alert.assignedTo && typeof alert.assignedTo === 'object' ? (alert.assignedTo as any).username : alert.assignedTo) || t('alerts.fields.unassigned')}
                      </p>
                    </div>
                  </div>

                  {!alert.assignedTo && (
                    <Button variant="outline" className="w-full mt-4">
                      <User className="w-4 h-4 mr-2" />
                      {t('alerts.actions.assign')}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('alerts.sidebar.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    {t('alerts.actions.exportReport')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    {t('alerts.actions.blockIP')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-700">
                    <XCircle className="w-4 h-4 mr-2" />
                    {t('alerts.actions.dismiss')}
                  </Button>
                </CardContent>
              </Card>
            </div>
            </div>
            </div>
          </>
        )}
      </div>

      {/* Create Case Dialog */}
      <CreateCaseFromAlertDialog
        open={showCreateCaseDialog}
        onOpenChange={setShowCreateCaseDialog}
        alertId={alert.id}
        alertTitle={alert.title}
        alertSeverity={alert.severity}
        observablesCount={observables.length}
      />
    </WorkspaceLayout>
  );
}
