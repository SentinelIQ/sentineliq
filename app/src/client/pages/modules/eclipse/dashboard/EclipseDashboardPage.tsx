import { useQuery, getEclipseDashboardData } from 'wasp/client/operations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Progress } from '../../../../components/ui/progress'
import { WorkspaceLayout } from '../../../workspace/WorkspaceLayout'
import { 
  Shield, 
  TrendingUp, 
  Eye, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Target,
  Zap,
  HelpCircle,
  Plus,
  FileText,
  Settings,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  ShieldAlert
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useWorkspace from '../../../../hooks/useWorkspace'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'
import { useOnboarding } from '../../../../hooks/useOnboarding'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function EclipseDashboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation(['common', 'eclipse'])
  const { currentWorkspace } = useWorkspace()
  const { data: dashboardData, isLoading, error } = useQuery(
    getEclipseDashboardData,
    currentWorkspace?.id ? { workspaceId: currentWorkspace.id } : undefined,
    { enabled: !!currentWorkspace?.id }
  )

  const { runTour, stepIndex, setStepIndex, completeTour, resetTour } = useOnboarding('eclipse-dashboard')

  const tourSteps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">🎉 Bem-vindo ao Eclipse!</h3>
          <p>
            O Eclipse é seu módulo de proteção de marca e propriedade intelectual. 
            Vamos fazer um tour rápido pelas principais funcionalidades!
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="metrics"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">📊 Métricas Principais</h3>
          <p>
            Aqui você vê um resumo rápido de todas as suas marcas protegidas, detecções e ações tomadas.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="monitoring"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">👁️ Monitoramento</h3>
          <p>
            Configure monitores para rastrear violações de marca em tempo real na internet, 
            redes sociais e marketplaces.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="infringements"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">🚨 Infrações</h3>
          <p>
            Gerencie todas as violações detectadas e tome ações para proteger sua marca.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="actions"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">⚡ Ações</h3>
          <p>
            Execute ações contra violações: DMCA, denúncias, notificações legais e muito mais.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="recent-alerts"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">🔔 Alertas Recentes</h3>
          <p>
            Acompanhe as últimas detecções e eventos em tempo real.
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: 'body',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">✅ Tour Completo!</h3>
          <p>
            Agora você já conhece o básico do Eclipse. Comece adicionando sua primeira marca 
            e configurando monitores de proteção!
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Dica: Você pode revisar este tour a qualquer momento clicando no ícone de ajuda.
          </p>
        </div>
      ),
      placement: 'center',
    },
  ]

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      completeTour()
    }

    setStepIndex(index)
  }

  const submodules = [
    {
      id: 'infringements',
      name: 'Infrações Detectadas',
      description: 'Gerencie todas as violações detectadas',
      icon: AlertCircle,
      href: '/modules/eclipse/infringements',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      id: 'actions',
      name: 'Plano de Ação',
      description: 'Execute ações contra violações',
      icon: Zap,
      href: '/modules/eclipse/actions',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ]

  const stats = dashboardData?.stats || {
    totalBrands: 0,
    activeBrands: 0,
    totalInfringements: 0,
    unresolvedInfringements: 0,
    criticalInfringements: 0,
    actionsCompleted: 0,
    actionsPending: 0,
  }

  const metrics = dashboardData?.metrics || {
    totalMonitors: 0,
    activeMonitors: 0,
    detectionsToday: 0,
    detectionsThisMonth: 0,
  }

  return (
    <WorkspaceLayout>
      <Joyride
        steps={tourSteps}
        run={runTour}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#8b5cf6',
            zIndex: 10000,
          },
        }}
        locale={{
          back: 'Voltar',
          close: 'Fechar',
          last: 'Finalizar',
          next: 'Próximo',
          skip: 'Pular Tour',
        }}
      />
      <div className="w-full">
        {/* Header Enterprise */}
        <div className="bg-gradient-to-r from-purple-500/10 via-purple-600/5 to-transparent border-b border-border">
          <div className="w-full px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Eclipse Dashboard</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Proteção de Marca & Monitoramento de Propriedade Intelectual
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTour}
                  className="gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  Tour
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/modules/eclipse/brands')}
                  className="gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Nova Marca
                </Button>
              </div>
            </div>
            
            {/* Quick Stats Bar */}
            <div className="grid grid-cols-5 gap-4">
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
                <Target className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Marcas Ativas</p>
                  <p className="text-lg font-bold">{stats.activeBrands}/{stats.totalBrands}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
                <Eye className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Detecções Hoje</p>
                  <p className="text-lg font-bold">{metrics.detectionsToday}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Críticas</p>
                  <p className="text-lg font-bold text-red-600">{stats.criticalInfringements}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
                <Zap className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Ações Pendentes</p>
                  <p className="text-lg font-bold">{stats.actionsPending}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
                <Activity className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Taxa de Resolução</p>
                  <p className="text-lg font-bold">
                    {stats.totalInfringements > 0 
                      ? Math.round((stats.actionsCompleted / stats.totalInfringements) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-full px-8 py-8">
          {/* KPIs Enterprise */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6" data-tour="metrics">
            <Card className="hover:shadow-md transition-all border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between">
                  <span className="text-xs font-medium">MARCAS PROTEGIDAS</span>
                  <Target className="w-4 h-4 text-purple-500" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold">{isLoading ? '...' : stats.totalBrands}</span>
                  <span className="text-sm text-muted-foreground">total</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    {stats.activeBrands} ativas
                  </Badge>
                  <span className="text-muted-foreground">
                    ({stats.totalBrands > 0 ? Math.round((stats.activeBrands / stats.totalBrands) * 100) : 0}% cobertura)
                  </span>
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="mt-2 p-0 h-auto text-xs"
                  onClick={() => navigate('/modules/eclipse/brands')}
                >
                  Ver todas →
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between">
                  <span className="text-xs font-medium">DETECÇÕES HOJE</span>
                  <Eye className="w-4 h-4 text-blue-500" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold">{isLoading ? '...' : metrics.detectionsToday}</span>
                  <div className="flex items-center text-xs text-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12%
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  Este mês: <span className="font-semibold">{metrics.detectionsThisMonth}</span> detecções
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="mt-2 p-0 h-auto text-xs"
                  onClick={() => navigate('/modules/eclipse/detections')}
                >
                  Ver alertas →
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between">
                  <span className="text-xs font-medium">AMEAÇAS CRÍTICAS</span>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-red-600">{isLoading ? '...' : stats.criticalInfringements}</span>
                  <Badge variant="destructive" className="text-xs px-2 py-0">URGENTE</Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  Total não resolvidas: <span className="font-semibold">{stats.unresolvedInfringements}</span>
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="mt-2 p-0 h-auto text-xs text-red-600 hover:text-red-700"
                  onClick={() => navigate('/modules/eclipse/infringements?severity=critical')}
                >
                  Ação imediata →
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between">
                  <span className="text-xs font-medium">TAXA DE RESOLUÇÃO</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-green-600">
                    {stats.totalInfringements > 0 
                      ? Math.round((stats.actionsCompleted / stats.totalInfringements) * 100)
                      : 0}%
                  </span>
                  <div className="flex items-center text-xs text-green-600">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +8%
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  {stats.actionsCompleted} resolvidas / {stats.actionsPending} pendentes
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="mt-2 p-0 h-auto text-xs"
                  onClick={() => navigate('/modules/eclipse/actions')}
                >
                  Ver ações →
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Tendências Enterprise */}
          {dashboardData?.trendData && dashboardData.trendData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Main Trend Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    Tendências de Detecções
                  </CardTitle>
                  <CardDescription>
                    Evolução de alertas e infrações nos últimos 30 dias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboardData.trendData}>
                        <defs>
                          <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorInfringements" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => {
                            const d = new Date(date);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                          }}
                          className="text-xs"
                          stroke="#888888"
                        />
                        <YAxis className="text-xs" stroke="#888888" />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border border-border rounded-lg p-4 shadow-xl">
                                  <p className="text-sm font-semibold mb-3">
                                    {new Date(data.date).toLocaleDateString('pt-BR', { 
                                      day: 'numeric', 
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </p>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                                        <span className="text-sm text-muted-foreground">Alertas</span>
                                      </div>
                                      <span className="text-sm font-semibold">{data.alerts}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <span className="text-sm text-muted-foreground">Infrações</span>
                                      </div>
                                      <span className="text-sm font-semibold">{data.infringements}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="alerts" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorAlerts)"
                          name="Alertas"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="infringements" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorInfringements)"
                          name="Infrações"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Threat Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    Top Ameaças
                  </CardTitle>
                  <CardDescription>
                    Tipos mais frequentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: 'Phishing', count: stats.criticalInfringements || 15, color: 'red', percent: 35 },
                      { type: 'Counterfeit', count: Math.floor((stats.totalInfringements || 30) * 0.28), color: 'orange', percent: 28 },
                      { type: 'Domain Abuse', count: Math.floor((stats.totalInfringements || 30) * 0.22), color: 'yellow', percent: 22 },
                      { type: 'Social Media', count: Math.floor((stats.totalInfringements || 30) * 0.15), color: 'blue', percent: 15 },
                    ].map((threat, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-${threat.color}-500`} />
                            <span className="text-sm font-medium">{threat.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{threat.count}</span>
                            <Badge variant="secondary" className="text-xs">
                              {threat.percent}%
                            </Badge>
                          </div>
                        </div>
                        <Progress 
                          value={threat.percent} 
                          className={`h-1.5 bg-${threat.color}-500/10`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-muted-foreground">Nível de Risco</span>
                      <span className="font-semibold text-red-600">ALTO</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>
                        {stats.unresolvedInfringements} infrações não resolvidas requerem atenção imediata
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Submódulos */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Funcionalidades Principais</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {submodules.map((module) => {
                const Icon = module.icon
                
                return (
                  <Card
                    key={module.id}
                    data-tour={module.id}
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
                )
              })}
            </div>
          </div>

          {/* Alertas Recentes */}
          <Card data-tour="recent-alerts">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Alertas Recentes
              </CardTitle>
              <CardDescription>
                Últimas detecções e eventos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando alertas...
                </div>
              ) : dashboardData?.recentAlerts && dashboardData.recentAlerts.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentAlerts.slice(0, 5).map((alert: any) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/modules/eclipse/detections/${alert.id}`)}
                    >
                      <div className={`w-10 h-10 rounded-lg ${
                        alert.severity === 'critical' ? 'bg-red-500/10' : 
                        alert.severity === 'high' ? 'bg-orange-500/10' : 
                        alert.severity === 'medium' ? 'bg-yellow-500/10' : 
                        'bg-blue-500/10'
                      } flex items-center justify-center`}>
                        <AlertCircle className={`w-5 h-5 ${
                          alert.severity === 'critical' ? 'text-red-500' : 
                          alert.severity === 'high' ? 'text-orange-500' : 
                          alert.severity === 'medium' ? 'text-yellow-500' : 
                          'text-blue-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Marca: {alert.brand?.name || 'N/A'}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <Badge variant={
                        alert.severity === 'critical' ? 'destructive' : 
                        alert.severity === 'high' ? 'default' : 
                        'secondary'
                      }>
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum alerta recente
                </div>
              )}
              
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate('/modules/eclipse/infringements')}
              >
                Ver Todas as Atividades
              </Button>
            </CardContent>
          </Card>

          {/* Marcas Protegidas */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Marcas Protegidas
              </CardTitle>
              <CardDescription>
                Marcas cadastradas e monitoradas ativamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando marcas...
                </div>
              ) : dashboardData?.brands && dashboardData.brands.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.brands.slice(0, 6).map((brand: any) => (
                    <div
                      key={brand.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/modules/eclipse/brands/${brand.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{brand.name}</h4>
                        <Badge variant={brand.status === 'active' ? 'default' : 'secondary'}>
                          {brand.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>Monitores:</span>
                          <span className="font-medium">{brand.monitors?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Infrações:</span>
                          <span className={`font-medium ${
                            brand.infringements?.length > 0 ? 'text-red-500' : ''
                          }`}>
                            {brand.infringements?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Nenhuma marca cadastrada ainda
                  </p>
                  <Button onClick={() => navigate('/modules/eclipse/brands/new')}>
                    Adicionar Primeira Marca
                  </Button>
                </div>
              )}
              
              {dashboardData?.brands && dashboardData.brands.length > 6 && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate('/modules/eclipse/brands')}
                >
                  Ver Todas as Marcas ({dashboardData.brands.length})
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
