import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getActionDetails } from 'wasp/client/operations';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Send,
  User,
  XCircle,
} from 'lucide-react';
import { useWorkspace } from '../../../../hooks/useWorkspace';

export default function EclipseActionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();

  const { data: action, isLoading, error } = useQuery(
    getActionDetails,
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
          <h1 className="text-2xl font-bold">Ação não encontrada</h1>
          <Button onClick={() => navigate('/modules/eclipse/actions')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Ações
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

  if (error || !action) {
    return (
      <div className="w-full px-8 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold">Erro ao carregar ação</h1>
          <p className="text-muted-foreground mt-2">{error?.message || 'Ação não encontrada'}</p>
          <Button onClick={() => navigate('/modules/eclipse/actions')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Ações
          </Button>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-500/10 text-yellow-700', icon: Clock, label: 'PENDENTE' };
      case 'in_progress':
        return { color: 'bg-blue-500/10 text-blue-700', icon: Send, label: 'EM ANDAMENTO' };
      case 'completed':
        return { color: 'bg-green-500/10 text-green-700', icon: CheckCircle, label: 'CONCLUÍDA' };
      case 'failed':
        return { color: 'bg-red-500/10 text-red-700', icon: XCircle, label: 'FALHOU' };
      default:
        return { color: 'bg-muted text-muted-foreground', icon: AlertCircle, label: 'INDEFINIDO' };
    }
  };

  const getActionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      dmca_takedown: 'DMCA Takedown',
      cease_desist: 'Carta de Cessação',
      platform_report: 'Denúncia à Plataforma',
      legal_action: 'Ação Legal',
      manual_contact: 'Contato Manual',
      other: 'Outro',
    };
    return types[type] || type.toUpperCase();
  };

  const statusConfig = getStatusConfig(action.status);
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
              onClick={() => navigate('/modules/eclipse/actions')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Ações
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Send className="w-10 h-10 text-blue-500" />
                <div>
                  <h1 className="text-4xl font-bold">{getActionTypeLabel(action.actionType)}</h1>
                  {action.infringement?.brand && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Marca: {action.infringement.brand.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusConfig.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <Badge variant="outline">{getActionTypeLabel(action.actionType)}</Badge>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-muted-foreground">Criada em</div>
              <div className="text-lg font-semibold">
                {new Date(action.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="w-full px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={statusConfig.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tipo de Ação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">{getActionTypeLabel(action.actionType)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Criada em
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{new Date(action.createdAt).toLocaleDateString('pt-BR')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Última Atualização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{new Date(action.updatedAt).toLocaleDateString('pt-BR')}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-8 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="infringement">Infração Relacionada</TabsTrigger>
            <TabsTrigger value="evidence">Evidência</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Ação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Tipo de Ação
                    </label>
                    <p className="text-sm font-semibold">{getActionTypeLabel(action.actionType)}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {action.assignedTo && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Atribuído a
                      </label>
                      <p className="text-sm font-semibold">{action.assignedTo}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Criada em
                    </label>
                    <p className="text-sm">
                      {new Date(action.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                {action.description && (
                  <div className="pt-4 border-t space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                    <p className="text-sm whitespace-pre-wrap">{action.description}</p>
                  </div>
                )}

                {action.notes && (
                  <div className="pt-4 border-t space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Notas</label>
                    <div className="bg-muted rounded-lg p-4 border">
                      <p className="text-sm whitespace-pre-wrap">{action.notes}</p>
                    </div>
                  </div>
                )}

                {action.result && (
                  <div className="pt-4 border-t space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Resultado</label>
                    <div className="bg-muted rounded-lg p-4 border">
                      <p className="text-sm whitespace-pre-wrap">{action.result}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Infringement Tab */}
          <TabsContent value="infringement" className="space-y-4">
            {action.infringement ? (
              <Card>
                <CardHeader>
                  <CardTitle>Infração Relacionada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() =>
                      navigate(`/modules/eclipse/infringements/${action.infringement.id}`)
                    }
                  >
                    <h4 className="font-semibold">{action.infringement.title}</h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      {action.infringement.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge
                        className={
                          action.infringement.severity === 'critical'
                            ? 'bg-red-500/10 text-red-700'
                            : action.infringement.severity === 'high'
                            ? 'bg-orange-500/10 text-orange-700'
                            : 'bg-yellow-500/10 text-yellow-700'
                        }
                      >
                        {action.infringement.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{action.infringement.type.toUpperCase()}</Badge>
                    </div>
                  </div>

                  {action.infringement.url && (
                    <div className="pt-4 border-t space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        URL da Infração
                      </label>
                      <a
                        href={action.infringement.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all text-sm flex items-center gap-2"
                      >
                        {action.infringement.url}
                      </a>
                    </div>
                  )}

                  {action.infringement.alerts && action.infringement.alerts.length > 0 && (
                    <div className="pt-4 border-t space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Alertas Relacionados
                      </label>
                      <div className="space-y-2">
                        {action.infringement.alerts.map((alert: any) => (
                          <div
                            key={alert.id}
                            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => navigate(`/modules/eclipse/detections/${alert.id}`)}
                          >
                            <h5 className="text-sm font-semibold">{alert.title}</h5>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(alert.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <p className="text-muted-foreground text-center">
                    Nenhuma infração relacionada encontrada
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Evidence Tab */}
          <TabsContent value="evidence" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Evidência da Ação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {action.evidenceUrls && action.evidenceUrls.length > 0 ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      URLs de Evidência
                    </label>
                    {action.evidenceUrls.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-600 hover:underline break-all text-sm p-3 border rounded-lg"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma evidência disponível</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
