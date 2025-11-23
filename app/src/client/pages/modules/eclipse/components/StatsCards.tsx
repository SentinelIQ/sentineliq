import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { ShieldAlert, Eye, AlertCircle, Zap, TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardsProps {
  totalBrands: number
  activeBrands: number
  totalMonitors: number
  activeMonitors: number
  alertsThisMonth: number
  criticalAlerts: number
  totalInfringements: number
  unresolvedInfringements: number
  actionsCompleted: number
  actionsPending: number
}

export const StatsCards = ({
  totalBrands,
  activeBrands,
  totalMonitors,
  activeMonitors,
  alertsThisMonth,
  criticalAlerts,
  totalInfringements,
  unresolvedInfringements,
  actionsCompleted,
  actionsPending,
}: StatsCardsProps) => {
  const stats = [
    {
      title: 'Marcas Protegidas',
      value: totalBrands,
      subtitle: `${activeBrands} ativas`,
      icon: ShieldAlert,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      trend: activeBrands === totalBrands ? 'up' : 'down',
    },
    {
      title: 'Monitores Ativos',
      value: activeMonitors,
      subtitle: `${totalMonitors} total`,
      icon: Eye,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: activeMonitors > 0 ? 'up' : 'down',
    },
    {
      title: 'Alertas Este Mês',
      value: alertsThisMonth,
      subtitle: `${criticalAlerts} críticos`,
      icon: AlertCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      trend: criticalAlerts > 0 ? 'down' : 'up',
    },
    {
      title: 'Infrações',
      value: totalInfringements,
      subtitle: `${unresolvedInfringements} não resolvidas`,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      trend: unresolvedInfringements > 0 ? 'down' : 'up',
    },
    {
      title: 'Ações Pendentes',
      value: actionsPending,
      subtitle: `${actionsCompleted} concluídas`,
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      trend: actionsPending === 0 ? 'up' : 'down',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown
        
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <TrendIcon className={`w-3 h-3 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                {stat.subtitle}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
