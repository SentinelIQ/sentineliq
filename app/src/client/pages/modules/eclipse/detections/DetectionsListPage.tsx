import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'wasp/client/operations'
import { getWorkspaceAlerts } from 'wasp/client/operations'
import { WorkspaceLayout } from '../../../workspace/WorkspaceLayout'
import { BrandAlert } from 'wasp/entities'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import {
  AlertCircle,
  Eye,
  ExternalLink,
  Filter,
  Clock,
} from 'lucide-react'

export default function DetectionsListPage() {
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')

  const { data: alerts, isLoading, error } = useQuery(getWorkspaceAlerts)

  if (isLoading) {
    return (
      <WorkspaceLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </WorkspaceLayout>
    )
  }

  if (error) {
    return (
      <WorkspaceLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading alerts</span>
          </div>
        </div>
      </WorkspaceLayout>
    )
  }

  const filteredAlerts = (alerts || []).filter((alert) => {
    const statusMatch = filterStatus === 'all' || alert.status === filterStatus
    const severityMatch = filterSeverity === 'all' || alert.severity === filterSeverity
    return statusMatch && severityMatch
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-600 dark:text-red-400'
      case 'high':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
      case 'low':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
      case 'investigated':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      case 'resolved':
        return 'bg-green-500/10 text-green-600 dark:text-green-400'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <WorkspaceLayout>
      <div className="w-full">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border">
          <div className="w-full px-8 py-8">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <h1 className="text-4xl font-bold">Detecções</h1>
            </div>
            <p className="text-muted-foreground">
              Visualize todas as detecções e evidências encontradas
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="w-full px-8 py-8">
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="new">Novo</option>
                    <option value="investigated">Investigado</option>
                    <option value="resolved">Resolvido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Severidade
                  </label>
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Todas as Severidades</option>
                    <option value="critical">Crítico</option>
                    <option value="high">Alto</option>
                    <option value="medium">Médio</option>
                    <option value="low">Baixo</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma detecção encontrada</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {alert.title}
                      </h3>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(alert.status)}>
                        {alert.status.toUpperCase()}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {alert.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>Confidence: {alert.confidence}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                      </div>
                      {alert.url && (
                        <div className="flex items-center gap-1">
                          <ExternalLink className="h-4 w-4" />
                          <a
                            href={alert.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate max-w-xs"
                          >
                            {new URL(alert.url).hostname}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/modules/eclipse/detections/${alert.id}`)}
                    className="ml-4 px-3 py-2 border border-border rounded hover:bg-muted/50"
                  >
                    <Eye className="h-4 w-4 inline mr-2" />
                    View
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
