import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getMonitorDetails } from 'wasp/client/operations';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs';
import {
  ArrowLeft,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { useWorkspace } from '../../../../hooks/useWorkspace';

export default function EclipseMonitorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();

  const { data: monitor, isLoading, error } = useQuery(
    getMonitorDetails, 
    {
      id: id || '',
      workspaceId: currentWorkspace?.id || '',
    },
    {
      enabled: !!id && !!currentWorkspace?.id
    }
  );

  if (!id) {
    return (
      <div className="w-full px-8 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold">Monitor não encontrado</h1>
          <Button onClick={() => navigate('/modules/eclipse/monitoring')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Monitores
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full px-8 py-8 flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !monitor) {
    return (
      <div className="w-full px-8 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold">Erro ao carregar monitor</h1>
          <p className="text-muted-foreground mt-2">{error?.message || 'Monitor não encontrado'}</p>
          <Button onClick={() => navigate('/modules/eclipse/monitoring')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Monitores
          </Button>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-500/10 text-green-700', icon: CheckCircle, label: 'ATIVO' };
      case 'paused':
        return { color: 'bg-yellow-500/10 text-yellow-700', icon: Clock, label: 'PAUSADO' };
      case 'testing':
        return { color: 'bg-blue-500/10 text-blue-700', icon: Activity, label: 'TESTANDO' };
      case 'inactive':
        return { color: 'bg-muted text-muted-foreground', icon: AlertCircle, label: 'INATIVO' };
      default:
        return { color: 'bg-muted text-muted-foreground', icon: AlertCircle, label: 'INDEFINIDO' };
    }
  };

  const statusConfig = getStatusConfig(monitor.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-muted/30 border-b border-border">
        <div className="w-full px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/modules/eclipse/monitoring')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Monitores
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-10 h-10 text-blue-500" />
                <div>
                  <h1 className="text-4xl font-bold">Monitor: {monitor.brand?.name}</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {monitor.monitoringType} • {monitor.source}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusConfig.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <Badge variant="outline">
                  {monitor.isAutomated ? 'Automático' : 'Manual'}
                </Badge>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold">
                {monitor.detectionsThisMonth}
              </div>
              <div className="text-sm text-muted-foreground">Detecções este mês</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="w-full px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Detecções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{monitor.detectionsTotalTime}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Execuções Bem-Sucedidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{monitor.successfulRuns}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Execuções Falhadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-red-600">{monitor.failedRuns}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {monitor.successfulRuns + monitor.failedRuns > 0
                  ? Math.round(
                      (monitor.successfulRuns /
                        (monitor.successfulRuns + monitor.failedRuns)) *
                        100
                    )
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-8 py-8">
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="alerts">Alertas Recentes</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuração do Monitor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Tipo de Monitoramento
                    </label>
                    <p className="text-sm font-semibold">{monitor.monitoringType}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Fonte</label>
                    <p className="text-sm font-semibold">{monitor.source}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Frequência de Verificação
                    </label>
                    <p className="text-sm font-semibold">{monitor.checkFrequency}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Limiar de Confiança
                    </label>
                    <p className="text-sm font-semibold">{monitor.confidenceThreshold}%</p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Termos de Busca
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {monitor.searchTerms.map((term: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>

                {monitor.keywords.length > 0 && (
                  <div className="pt-4 border-t space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Palavras-Chave
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {monitor.keywords.map((keyword: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {monitor.excludeTerms.length > 0 && (
                  <div className="pt-4 border-t space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Termos Excluídos
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {monitor.excludeTerms.map((term: string, idx: number) => (
                        <Badge key={idx} variant="destructive">
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Opções</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle
                        className={`w-5 h-5 ${
                          monitor.enableScreenshots ? 'text-green-600' : 'text-muted-foreground'
                        }`}
                      />
                      <span className="text-sm">Screenshots habilitados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle
                        className={`w-4 h-4 ${
                          monitor.enableOCR ? 'text-green-600' : 'text-muted-foreground'
                        }`}
                      />
                      <span className="text-sm">OCR habilitado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle
                        className={`w-4 h-4 ${
                          monitor.deepAnalysis ? 'text-green-600' : 'text-muted-foreground'
                        }`}
                      />
                      <span className="text-sm">Análise profunda habilitada</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alertas Recentes ({monitor.alerts?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {monitor.alerts && monitor.alerts.length > 0 ? (
                  <div className="space-y-3">
                    {monitor.alerts.map((alert: any) => (
                      <div
                        key={alert.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/modules/eclipse/detections/${alert.id}`)}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{alert.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge
                          className={
                            alert.severity === 'critical'
                              ? 'bg-red-500/10 text-red-700'
                              : alert.severity === 'high'
                              ? 'bg-orange-500/10 text-orange-700'
                              : 'bg-yellow-500/10 text-yellow-700'
                          }
                        >
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum alerta registrado ainda
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Estatísticas de Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Taxa de Sucesso
                  </label>
                  <div className="space-y-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${
                            monitor.successfulRuns + monitor.failedRuns > 0
                              ? Math.round(
                                  (monitor.successfulRuns /
                                    (monitor.successfulRuns + monitor.failedRuns)) *
                                    100
                                )
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-lg font-semibold">
                      {monitor.successfulRuns + monitor.failedRuns > 0
                        ? Math.round(
                            (monitor.successfulRuns /
                              (monitor.successfulRuns + monitor.failedRuns)) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>

                {monitor.lastCheckAt && (
                  <div className="pt-4 border-t space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Última Verificação
                    </label>
                    <p className="text-sm">{new Date(monitor.lastCheckAt).toLocaleString('pt-BR')}</p>
                  </div>
                )}

                {monitor.nextCheckAt && (
                  <div className="pt-4 border-t space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Próxima Verificação
                    </label>
                    <p className="text-sm">{new Date(monitor.nextCheckAt).toLocaleString('pt-BR')}</p>
                  </div>
                )}

                {monitor.lastErrorMessage && (
                  <div className="pt-4 border-t space-y-2">
                    <label className="text-sm font-medium text-red-600">Último Erro</label>
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                      {monitor.lastErrorMessage}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
