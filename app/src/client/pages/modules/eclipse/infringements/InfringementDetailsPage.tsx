import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'wasp/client/operations'
import { getInfringementDetails, getLinkedAegisIncident, escalateInfringementToAegis, syncInfringementAegisStatus } from 'wasp/client/operations'
import { WorkspaceLayout } from '../../../workspace/WorkspaceLayout'
import { useWorkspace } from '../../../../hooks/useWorkspace'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { TTPsList } from '../../../../modules/mitre/components'
import {
  Link2,
  Clock,
  ArrowLeft,
  Globe,
  AlertCircle,
  CheckCircle,
  MapPin,
  Shield,
  Zap,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs'

export default function EclipseInfringementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspace()
  const [isEscalating, setIsEscalating] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const { data: infringement, isLoading, error, refetch: refetchInfringement } = useQuery(getInfringementDetails, {
    infringementId: id || '',
    workspaceId: currentWorkspace?.id || '',
  })

  const { data: aegisData, refetch: refetchAegis } = useQuery(getLinkedAegisIncident, {
    infringementId: id || '',
  }, {
    enabled: !!id && !!infringement?.aegisIncidentId,
  })

  if (!id) {
    return (
      <WorkspaceLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Infringement not found</h1>
            <Button onClick={() => navigate('/modules/eclipse/infringements')} className="mt-4">
              Go back to infringements
            </Button>
          </div>
        </div>
      </WorkspaceLayout>
    )
  }

  if (isLoading) {
    return (
      <WorkspaceLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </WorkspaceLayout>
    )
  }

  if (error || !infringement) {
    return (
      <WorkspaceLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Error loading infringement</h1>
            <p className="text-gray-600 mt-2">{error?.message || 'Infringement not found'}</p>
            <Button onClick={() => navigate('/modules/eclipse/infringements')} className="mt-4">
              Go back to infringements
            </Button>
          </div>
        </div>
      </WorkspaceLayout>
    )
  }

  // Handlers para Aegis
  const handleEscalateToAegis = async () => {
    if (!id) return
    setIsEscalating(true)
    try {
      const result = await escalateInfringementToAegis({ infringementId: id })
      if (result.success) {
        await refetchInfringement()
        await refetchAegis()
        alert('Infração escalada com sucesso para investigação formal no Aegis!')
      }
    } catch (err) {
      alert('Erro ao escalar: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsEscalating(false)
    }
  }

  const handleSyncAegisStatus = async () => {
    if (!id) return
    setIsSyncing(true)
    try {
      const result = await syncInfringementAegisStatus({ infringementId: id })
      if (result.success) {
        await refetchInfringement()
        alert('Status sincronizado com Aegis!')
      }
    } catch (err) {
      alert('Erro ao sincronizar: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsSyncing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/10 text-red-700'
      case 'high':
        return 'bg-orange-500/10 text-orange-700'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700'
      case 'low':
        return 'bg-blue-500/10 text-blue-700'
      default:
        return 'bg-gray-500/10 text-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-red-500/10 text-red-700'
      case 'investigating':
        return 'bg-yellow-500/10 text-yellow-700'
      case 'escalated_to_aegis':
        return 'bg-purple-500/10 text-purple-700'
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-700'
      case 'resolved':
        return 'bg-green-500/10 text-green-700'
      case 'false_positive':
        return 'bg-gray-500/10 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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
                onClick={() => navigate('/modules/eclipse/infringements')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Infrações
              </Button>
            </div>

            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                  <div>
                    <h1 className="text-4xl font-bold">{infringement.title}</h1>
                    {infringement.domain && (
                      <p className="text-sm text-muted-foreground mt-1">Domínio: {infringement.domain}</p>
                    )}
                  </div>
                </div>
                {infringement.description && (
                  <p className="text-muted-foreground mb-4">{infringement.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <Badge className={getSeverityColor(infringement.severity)}>
                    {infringement.severity?.toUpperCase()}
                  </Badge>
                  <Badge className={getStatusColor(infringement.status)}>
                    {infringement.status?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Aegis Integration Section */}
              <div className="flex flex-col gap-2">
                {!infringement.aegisIncidentId ? (
                  <Button
                    onClick={handleEscalateToAegis}
                    disabled={isEscalating}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  >
                    <Shield className="w-4 h-4" />
                    {isEscalating ? 'Escalando...' : 'Escalar para Aegis'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSyncAegisStatus}
                    disabled={isSyncing}
                    variant="outline"
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar com Aegis'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Aegis Incident Section */}
        {infringement.aegisIncidentId && aegisData?.hasIncident && (
          <div className="w-full px-8 py-4 bg-purple-50 border-b border-purple-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Caso Aegis Vinculado</h3>
                </div>
                {aegisData.incident && (
                  <div className="space-y-1 text-sm text-purple-800">
                    <p><strong>Título:</strong> {aegisData.incident.title}</p>
                    <p><strong>Status:</strong> {aegisData.incident.status}</p>
                    <p><strong>Severidade:</strong> {aegisData.incident.severity}</p>
                    {aegisData.incident.cases && aegisData.incident.cases.length > 0 && (
                      <p><strong>Casos:</strong> {aegisData.incident.cases.length}</p>
                    )}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/modules/aegis/incidents/${infringement.aegisIncidentId}`)}
                className="gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                Ver em Aegis
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="w-full px-8 py-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="ttps">TTPs</TabsTrigger>
              <TabsTrigger value="location">Location Details</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Infringement Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Brand</label>
                      <p className="text-lg text-gray-900 font-semibold">
                        {infringement.brand?.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type</label>
                      <p className="text-lg text-gray-900">{infringement.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <Badge className={getStatusColor(infringement.status)}>
                        {infringement.status?.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Severity</label>
                      <Badge className={getSeverityColor(infringement.severity)}>
                        {infringement.severity?.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Detection Date
                      </label>
                      <p className="text-sm text-gray-900">
                        {new Date(infringement.detectionDate).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Created At</label>
                      <p className="text-sm text-gray-900">
                        {new Date(infringement.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {infringement.resolvedAt && (
                    <div className="pt-4 border-t">
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Resolved At
                      </label>
                      <p className="text-sm text-gray-900">
                        {new Date(infringement.resolvedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {infringement.detectedBy && (
                    <div className="pt-4 border-t">
                      <label className="text-sm font-medium text-gray-600">Detected By</label>
                      <p className="text-sm text-gray-900">{infringement.detectedBy}</p>
                    </div>
                  )}

                  {infringement.notes && infringement.notes.length > 0 && (
                    <div className="pt-4 border-t">
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <ul className="mt-2 space-y-1">
                        {infringement.notes.map((note: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-700 flex gap-2">
                            <span className="text-blue-500">•</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TTPs Tab */}
            <TabsContent value="ttps" className="space-y-4">
              <TTPsList
                resourceId={id || ''}
                resourceType="BRAND_INFRINGEMENT"
                title="MITRE ATT&CK Tactics & Techniques"
                showSeverity={true}
                showConfidence={true}
                showOccurrenceCount={true}
              />
            </TabsContent>

            {/* Location Details Tab */}
            <TabsContent value="location" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Location & Access Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {infringement.url && (
                    <div className="pt-4">
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Link2 className="h-4 w-4" />
                        URL
                      </label>
                      <a
                        href={infringement.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all text-sm mt-1"
                      >
                        {infringement.url}
                      </a>
                    </div>
                  )}

                  {infringement.domain && (
                    <div className="pt-4 border-t">
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        Domain
                      </label>
                      <p className="text-sm text-gray-900 mt-1">{infringement.domain}</p>
                    </div>
                  )}

                  {infringement.ipAddress && (
                    <div className="pt-4 border-t">
                      <label className="text-sm font-medium text-gray-600">IP Address</label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">{infringement.ipAddress}</p>
                    </div>
                  )}

                  {infringement.location && (
                    <div className="pt-4 border-t">
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Location
                      </label>
                      <p className="text-sm text-gray-900 mt-1">{infringement.location}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="space-y-4">
              {infringement.actions && infringement.actions.length > 0 ? (
                <div className="space-y-2">
                  {infringement.actions.map((action: any) => (
                    <Card key={action.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">{action.actionType}</p>
                              <p className="text-sm text-gray-600">{action.description}</p>
                            </div>
                            <Badge variant="secondary">{action.status}</Badge>
                          </div>
                          {action.result && (
                            <div className="pt-2 border-t">
                              <p className="text-xs font-medium text-gray-600 mb-1">Result:</p>
                              <div className="bg-gray-50 p-2 rounded text-xs text-gray-700">
                                {typeof action.result === 'string'
                                  ? action.result
                                  : JSON.stringify(action.result, null, 2)}
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {new Date(action.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-600 text-center py-8">No actions recorded for this infringement</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Related Tab */}
            <TabsContent value="related" className="space-y-4">
              <div className="space-y-4">
                {/* Related Alerts */}
                {infringement.alerts && infringement.alerts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Related Alerts ({infringement.alerts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {infringement.alerts.map((alert: any) => (
                          <li key={alert.id} className="text-sm p-2 bg-gray-50 rounded hover:bg-gray-100">
                            <a
                              href={`/modules/eclipse/detections/${alert.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {alert.title}
                            </a>
                            <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Aegis Integration */}
                {infringement.aegisIncidentId && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Aegis Integration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Incident ID</label>
                        <p className="text-sm text-gray-900 font-mono">{infringement.aegisIncidentId}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Sync Status</label>
                        <Badge variant="secondary">{infringement.aegisSyncStatus}</Badge>
                      </div>
                      {infringement.aegisSyncedAt && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Last Synced</label>
                          <p className="text-sm text-gray-900">
                            {new Date(infringement.aegisSyncedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {infringement.aegisSyncError && (
                        <div className="pt-2 border-t">
                          <label className="text-sm font-medium text-red-600">Sync Error</label>
                          <p className="text-sm text-red-800 mt-1">{infringement.aegisSyncError}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
