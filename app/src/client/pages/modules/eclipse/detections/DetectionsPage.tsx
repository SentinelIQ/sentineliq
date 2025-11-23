import { useState } from 'react'
import { WorkspaceLayout } from '../../../workspace/WorkspaceLayout'
import { useNavigate } from 'react-router-dom'
import { useQuery, getEclipseBrands, getEclipseAlerts, acknowledgeEclipseAlert, escalateEclipseAlert } from 'wasp/client/operations'
import { AlertTriangle, Search, CheckCircle, XCircle, AlertCircle, Shield, LayoutGrid, LayoutList, Filter } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { AlertCard } from '../components/AlertCard'
import { AlertsTable } from '../components/AlertsTable'
import { EclipsePageHeader, EclipsePageContainer } from '../components/EclipsePageHeader'
import { useWorkspace } from '../../../../hooks/useWorkspace'
import { useToast } from '../../../../hooks/useToast'
import { Badge } from '../../../../components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { useEclipseAutoRefresh } from '../../../../hooks/useEclipseRealtime'

export default function EclipseDetectionsPage() {
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspace()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')

  const { data: brandsResponse } = useQuery(getEclipseBrands, {
    workspaceId: currentWorkspace?.id || '',
    limit: 100,
    offset: 0,
  })
  const brands = brandsResponse?.data || []

  const { data: alertsResponse, isLoading, refetch } = useQuery(getEclipseAlerts, {
    workspaceId: currentWorkspace?.id || '',
    brandId: selectedBrand !== 'all' ? selectedBrand : undefined,
    limit: 100,
    offset: 0,
  })
  const alerts = alertsResponse?.data || []

  // Real-time auto-refresh quando houver atualizações
  useEclipseAutoRefresh(currentWorkspace?.id || '', refetch, ['alert', 'infringement'])

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeEclipseAlert({ id: alertId })
      toast.success('Alerta reconhecido')
      refetch()
    } catch (error: any) {
      toast.error('Erro ao reconhecer alerta')
    }
  }

  const handleDismiss = async (alertId: string) => {
    try {
      await acknowledgeEclipseAlert({ id: alertId })
      toast.success('Alerta descartado')
      refetch()
    } catch (error: any) {
      toast.error('Erro ao descartar alerta')
    }
  }

  const handleEscalate = async (alertId: string) => {
    try {
      const alert = alerts?.find((a: any) => a.id === alertId)
      await escalateEclipseAlert({
        alertId,
        infringementData: {
          title: alert?.title || '',
          url: alert?.url || '',
          type: 'counterfeiting',
          severity: alert?.severity || 'medium',
        },
      })
      toast.success('Alerta escalado para infração')
      refetch()
    } catch (error: any) {
      toast.error('Erro ao escalar alerta')
    }
  }

  const handleBulkAcknowledge = async () => {
    try {
      await Promise.all(selectedAlerts.map(id => acknowledgeEclipseAlert({ id })))
      toast.success(`${selectedAlerts.length} alertas reconhecidos`)
      setSelectedAlerts([])
      refetch()
    } catch (error: any) {
      toast.error('Erro ao reconhecer alertas')
    }
  }

  const handleBulkDismiss = async () => {
    try {
      await Promise.all(selectedAlerts.map(id => acknowledgeEclipseAlert({ id })))
      toast.success(`${selectedAlerts.length} alertas descartados`)
      setSelectedAlerts([])
      refetch()
    } catch (error: any) {
      toast.error('Erro ao descartar alertas')
    }
  }

  const filteredAlerts = alerts?.filter((alert: any) => {
    const matchesSearch = alert.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const stats = {
    total: filteredAlerts?.length || 0,
    critical: filteredAlerts?.filter((a: any) => a.severity === 'critical').length || 0,
    new: filteredAlerts?.filter((a: any) => a.status === 'new').length || 0,
  }

  return (
    <WorkspaceLayout>
      <EclipsePageHeader
        icon={<AlertTriangle className="w-7 h-7 text-orange-600" />}
        title="Detecções de Marca"
        description="Visualize e gerencie detecções de possíveis violações de marca"
        breadcrumbs={[
          { label: 'Eclipse', href: '/modules/eclipse/dashboard' },
          { label: 'Detecções' }
        ]}
        stats={[
          {
            icon: <Shield className="w-5 h-5 text-blue-500" />,
            label: 'Total de Detecções',
            value: stats.total
          },
          {
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
            label: 'Críticos',
            value: stats.critical,
            color: 'text-red-600'
          },
          {
            icon: <CheckCircle className="w-5 h-5 text-blue-500" />,
            label: 'Novos',
            value: stats.new,
            color: 'text-blue-600'
          },
          {
            icon: <XCircle className="w-5 h-5 text-green-500" />,
            label: 'Resolvidos',
            value: filteredAlerts?.filter((a: any) => a.status === 'acknowledged').length || 0,
            color: 'text-green-600'
          }
        ]}
      />

      {/* Filters */}
      <EclipsePageContainer className="py-6 border-b border-border">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
              <Input
                placeholder='Buscar detecções...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>

            <div className="flex items-center gap-2">
              {selectedAlerts.length > 0 && (
                <Badge variant="secondary" className="px-3 py-1">
                  {selectedAlerts.length} selecionado(s)
                </Badge>
              )}
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'table')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="table" className="gap-2">
                    <LayoutList className="w-4 h-4" />
                    Tabela
                  </TabsTrigger>
                  <TabsTrigger value="grid" className="gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Grid
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1"></div>

            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as marcas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as marcas</SelectItem>
                {brands?.map((brand: any) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas severidades</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="new">Novos</SelectItem>
                <SelectItem value="acknowledged">Reconhecidos</SelectItem>
                <SelectItem value="investigating">Investigando</SelectItem>
                <SelectItem value="dismissed">Descartados</SelectItem>
                <SelectItem value="escalated">Escalados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedAlerts.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">{selectedAlerts.length} selecionados</span>
              <Button size="sm" variant="outline" onClick={handleBulkAcknowledge}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Reconhecer
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkDismiss}>
                <XCircle className="w-4 h-4 mr-2" />
                Descartar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedAlerts([])}>
                Limpar seleção
              </Button>
            </div>
          )}
      </EclipsePageContainer>

      {/* Content */}
      <EclipsePageContainer>
          {isLoading ? (
            <div className='text-center py-12'>
              <p className='text-muted-foreground'>Carregando alertas...</p>
            </div>
          ) : filteredAlerts?.length === 0 ? (
            <div className='text-center py-12'>
              <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className='text-muted-foreground'>
                {searchQuery || severityFilter !== 'all' || statusFilter !== 'all'
                  ? 'Nenhum alerta encontrado com os filtros aplicados.'
                  : 'Nenhum alerta registrado ainda.'}
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <AlertsTable
              alerts={filteredAlerts}
              onView={(alertId) => navigate(`/modules/eclipse/detections/${alertId}`)}
              onAcknowledge={handleAcknowledge}
              onDismiss={handleDismiss}
              onEscalate={handleEscalate}
              selectedAlerts={selectedAlerts}
              onSelectAlert={(alertId) => {
                if (selectedAlerts.includes(alertId)) {
                  setSelectedAlerts(selectedAlerts.filter(id => id !== alertId))
                } else {
                  setSelectedAlerts([...selectedAlerts, alertId])
                }
              }}
              onSelectAll={(checked) => {
                if (checked) {
                  setSelectedAlerts(filteredAlerts.map((a: any) => a.id))
                } else {
                  setSelectedAlerts([])
                }
              }}
            />
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredAlerts?.map((alert: any) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onView={() => navigate(`/modules/eclipse/detections/${alert.id}`)}
                  onAcknowledge={() => handleAcknowledge(alert.id)}
                  onDismiss={() => handleDismiss(alert.id)}
                  onEscalate={() => handleEscalate(alert.id)}
                />
              ))}
            </div>
          )}
      </EclipsePageContainer>
    </WorkspaceLayout>
  )
}
