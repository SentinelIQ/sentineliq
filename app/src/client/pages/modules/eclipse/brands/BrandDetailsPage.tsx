import { useState } from 'react'
import { WorkspaceLayout } from '../../../workspace/WorkspaceLayout'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, getEclipseBrands, getEclipseMonitors, getEclipseAlerts, getEclipseInfringements } from 'wasp/client/operations'
import { ArrowLeft, Edit, Trash2, Settings, ShieldAlert, Plus, TrendingUp, AlertTriangle } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { MonitorCard } from '../components/MonitorCard'
import { AlertCard } from '../components/AlertCard'
import { InfringementCard } from '../components/InfringementCard'
import { useWorkspace } from '../../../../hooks/useWorkspace'

export default function EclipseBrandDetailsPage() {
  const navigate = useNavigate()
  const { brandId } = useParams()
  const { currentWorkspace } = useWorkspace()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: brandsResponse, isLoading: brandLoading } = useQuery(getEclipseBrands, {
    workspaceId: currentWorkspace?.id || '',
    limit: 100,
    offset: 0,
  })
  const brands = brandsResponse?.data || []
  const brand = brands?.find((b: any) => b.id === brandId)

  const { data: monitorsResponse } = useQuery(getEclipseMonitors, {
    workspaceId: currentWorkspace?.id || '',
    brandId: brandId,
    limit: 50,
    offset: 0,
  })
  const monitors = monitorsResponse?.data || []

  const { data: alertsResponse } = useQuery(getEclipseAlerts, {
    workspaceId: currentWorkspace?.id || '',
    brandId: brandId,
    limit: 100,
    offset: 0,
  })
  const alerts = alertsResponse?.data || []

  const { data: infringementsResponse } = useQuery(getEclipseInfringements, {
    workspaceId: currentWorkspace?.id || '',
    brandId: brandId,
    limit: 50,
    offset: 0,
  })
  const infringements = infringementsResponse?.data || []

  if (brandLoading) {
    return (
      <WorkspaceLayout>
        <div className="w-full px-8 py-8">
          <p className="text-muted-foreground">Carregando marca...</p>
        </div>
      </WorkspaceLayout>
    )
  }

  if (!brand) {
    return (
      <WorkspaceLayout>
        <div className="w-full px-8 py-8">
          <p className="text-muted-foreground">Marca não encontrada</p>
          <Button onClick={() => navigate('/modules/eclipse/brands')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Marcas
          </Button>
        </div>
      </WorkspaceLayout>
    )
  }

  const getPriorityBadge = (priority: number) => {
    if (priority >= 5) return <Badge className="bg-red-500/10 text-red-500">P5 - Crítica</Badge>
    if (priority >= 4) return <Badge className="bg-orange-500/10 text-orange-500">P4 - Alta</Badge>
    if (priority >= 3) return <Badge className="bg-yellow-500/10 text-yellow-500">P3 - Média</Badge>
    if (priority >= 2) return <Badge className="bg-blue-500/10 text-blue-500">P2 - Baixa</Badge>
    return <Badge className="bg-green-500/10 text-green-500">P1 - Muito Baixa</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500">Ativa</Badge>
      case 'paused':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Pausada</Badge>
      case 'archived':
        return <Badge className="bg-muted/50 text-muted-foreground">Arquivada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const activeMonitors = monitors?.filter((m: any) => m.status === 'active').length || 0
  const criticalAlerts = alerts?.filter((a: any) => a.severity === 'critical' && a.status === 'new').length || 0
  const unresolvedInfringements = infringements?.filter((i: any) => i.status !== 'resolved' && i.status !== 'false_positive').length || 0

  return (
    <WorkspaceLayout>
      <div className="w-full">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border">
          <div className="w-full px-8 py-8">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/modules/eclipse/brands')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Marcas
              </Button>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <ShieldAlert className="w-10 h-10 text-purple-500" />
                  <div>
                    <h1 className="text-4xl font-bold">{brand.name}</h1>
                    {brand.trademark && (
                      <p className="text-sm text-muted-foreground mt-1">{brand.trademark}</p>
                    )}
                  </div>
                </div>
                {brand.description && (
                  <p className="text-muted-foreground mb-4">{brand.description}</p>
                )}
                <div className="flex items-center gap-2">
                  {getStatusBadge(brand.status)}
                  {getPriorityBadge(brand.priority)}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate(`/modules/eclipse/brands/${brandId}/config`)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
                <Button onClick={() => navigate(`/modules/eclipse/monitoring?brandId=${brandId}`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Monitor
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="w-full px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Monitores Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold">{activeMonitors}</span>
                  <span className="text-sm text-muted-foreground">/ {monitors?.length || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-2xl font-bold text-red-500">{criticalAlerts}</span>
                  <span className="text-sm text-muted-foreground">não resolvidos</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Infrações Abertas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-orange-500" />
                  <span className="text-2xl font-bold text-orange-500">{unresolvedInfringements}</span>
                  <span className="text-sm text-muted-foreground">em investigação</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="monitors">
                Monitores ({monitors?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="alerts">
                Alertas ({alerts?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="infringements">
                Infrações ({infringements?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-6">
                {/* Brand Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informações da Marca</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {brand.domains && brand.domains.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Domínios Oficiais</h4>
                        <div className="flex flex-wrap gap-2">
                          {brand.domains.map((domain: string) => (
                            <Badge key={domain} variant="secondary">{domain}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Criada em:</span>
                        <p className="font-medium">{new Date(brand.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                      {brand.updatedAt && (
                        <div>
                          <span className="text-muted-foreground">Última atualização:</span>
                          <p className="font-medium">{new Date(brand.updatedAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                {criticalAlerts > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Alertas Críticos Recentes</CardTitle>
                      <CardDescription>Requerem atenção imediata</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {alerts?.filter((a: any) => a.severity === 'critical' && a.status === 'new')
                          .slice(0, 3)
                          .map((alert: any) => (
                            <AlertCard key={alert.id} alert={alert} />
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="monitors">
              {monitors?.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground mb-4">Nenhum monitor configurado para esta marca.</p>
                    <Button onClick={() => navigate(`/modules/eclipse/monitoring?brandId=${brandId}`)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Monitor
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {monitors?.map((monitor: any) => (
                    <MonitorCard key={monitor.id} monitor={monitor} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="alerts">
              {alerts?.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">Nenhum alerta registrado para esta marca.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {alerts?.map((alert: any) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="infringements">
              {infringements?.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">Nenhuma infração registrada para esta marca.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {infringements?.map((infringement: any) => (
                    <InfringementCard key={infringement.id} infringement={infringement} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
