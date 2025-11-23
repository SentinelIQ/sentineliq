import { WorkspaceLayout } from '../../workspace/WorkspaceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Shield, AlertTriangle, FileText, FolderOpen, TrendingUp, Clock, Eye, Globe, Hash, Mail, Copy, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { useQuery } from 'wasp/client/operations';
import { getObservables } from 'wasp/client/operations';
import useWorkspace from '../../../hooks/useWorkspace';

export default function AegisDashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('aegis');
  const { currentWorkspace } = useWorkspace();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch recent observables
  const { data: observablesData, isLoading: observablesLoading } = useQuery(
    getObservables,
    { 
      filters: {},
      pagination: {
        limit: 5,
        offset: 0
      }
    } as any,
    { enabled: !!currentWorkspace?.id }
  );

  const recentObservables = observablesData?.data || [];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getObservableIcon = (type: string) => {
    switch (type) {
      case 'ip': return Globe;
      case 'domain': return Globe;
      case 'hash': return Hash;
      case 'email': return Mail;
      default: return Eye;
    }
  };

  const getTLPColor = (tlp: string) => {
    switch (tlp) {
      case 'RED': return 'bg-red-500';
      case 'AMBER': return 'bg-orange-500';
      case 'GREEN': return 'bg-green-500';
      case 'WHITE': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const submodules = [
    {
      id: 'alerts',
      name: t('dashboard.submodules.alerts.name'),
      description: t('dashboard.submodules.alerts.description'),
      icon: AlertTriangle,
      href: '/modules/aegis/alerts',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      id: 'incidents',
      name: t('dashboard.submodules.incidents.name'),
      description: t('dashboard.submodules.incidents.description'),
      icon: Shield,
      href: '/modules/aegis/incidents',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      id: 'cases',
      name: t('dashboard.submodules.cases.name'),
      description: t('dashboard.submodules.cases.description'),
      icon: FolderOpen,
      href: '/modules/aegis/cases',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <WorkspaceLayout>
      <div className="w-full">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border">
          <div className="w-full px-8 py-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-red-500" />
              <h1 className="text-4xl font-bold">{t('dashboard.title')}</h1>
            </div>
            <p className="text-muted-foreground">
              {t('dashboard.description')}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="w-full px-8 py-8">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  {t('dashboard.metrics.activeAlerts')}
                </CardDescription>
                <CardTitle className="text-4xl font-bold">23</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">8 {t('dashboard.metrics.criticalAlerts')}</Badge>
                  <Badge variant="default" className="text-xs">15 {t('dashboard.metrics.highAlerts')}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  {t('dashboard.metrics.openIncidents')}
                </CardDescription>
                <CardTitle className="text-4xl font-bold">7</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-red-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +2 {t('dashboard.metrics.lastHours', { hours: 24 })}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                  {t('dashboard.metrics.activeCases')}
                </CardDescription>
                <CardTitle className="text-4xl font-bold">12</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-blue-600">
                  <Clock className="w-4 h-4 mr-1" />
                  5 {t('dashboard.metrics.awaitingReview')}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-500" />
                  {t('dashboard.metrics.resolutionRate')}
                </CardDescription>
                <CardTitle className="text-4xl font-bold">87%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +5% {t('dashboard.metrics.vsLastMonth')}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submódulos */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('dashboard.submodules.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {submodules.map((module) => {
                const Icon = module.icon;
                
                return (
                  <Card
                    key={module.id}
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                    onClick={() => navigate(module.href)}
                  >
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                        <Icon className={`w-6 h-6 ${module.color}`} />
                      </div>
                      <CardTitle className="text-xl">{module.name}</CardTitle>
                      <CardDescription className="text-base">
                        {module.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Observables Recentes & Atividade */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Observables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Observables Recentes
                </CardTitle>
                <CardDescription>
                  Indicadores de comprometimento (IOCs) mais recentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentObservables.map((observable) => {
                    const Icon = getObservableIcon(observable.type);
                    const isCopied = copiedId === observable.id;
                    
                    return (
                      <div
                        key={observable.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className={`w-8 h-8 rounded-lg ${getTLPColor(observable.tlp)}/10 flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${getTLPColor(observable.tlp).replace('bg-', 'text-')}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {observable.type.toUpperCase()}
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${getTLPColor(observable.tlp)}`} title={`TLP:${observable.tlp}`} />
                          </div>
                          <p className="text-sm font-mono truncate" title={observable.value}>
                            {observable.value}
                          </p>
                          {observable.enrichment && (
                            <div className="flex items-center gap-2 mt-1">
                              {(observable.enrichment as any).threatLevel === 'malicious' && (
                                <Badge variant="destructive" className="text-xs">
                                  Malicioso
                                </Badge>
                              )}
                              {(observable.enrichment as any).reputation !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  Rep: {(observable.enrichment as any).reputation}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(observable.value, observable.id)}
                        >
                          {isCopied ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate('/modules/aegis/alerts')}
                >
                  Ver Todos os Observables
                </Button>
              </CardContent>
            </Card>

            {/* Atividade Recente */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.recentActivity.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.recentActivity.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{t('dashboard.recentActivity.activities.newAlert')}</h4>
                    <p className="text-sm text-muted-foreground">Tentativa de acesso não autorizado - IP: 192.168.1.100</p>
                    <span className="text-xs text-muted-foreground">{t('dashboard.recentActivity.timeAgo.minutes', { count: 5 })}</span>
                  </div>
                  <Badge variant="destructive">{t('alerts.severity.critical')}</Badge>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{t('dashboard.recentActivity.activities.incidentEscalated', { id: '#INC-2024-0156' })}</h4>
                    <p className="text-sm text-muted-foreground">Malware detectado em servidor de produção</p>
                    <span className="text-xs text-muted-foreground">{t('dashboard.recentActivity.timeAgo.minutes', { count: 23 })}</span>
                  </div>
                  <Badge variant="default">{t('alerts.severity.high')}</Badge>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{t('dashboard.recentActivity.activities.caseResolved', { id: '#CASE-2024-0089' })}</h4>
                    <p className="text-sm text-muted-foreground">Investigação de phishing concluída</p>
                    <span className="text-xs text-muted-foreground">{t('dashboard.recentActivity.timeAgo.hours', { count: 1 })}</span>
                  </div>
                  <Badge variant="secondary">{t('incidents.status.resolved')}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
