import { useState, useEffect } from 'react'
import { WorkspaceLayout } from '../../../workspace/WorkspaceLayout'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, getEclipseBrands, getEclipseMonitors, createEclipseMonitor, updateEclipseMonitor, testEclipseMonitor } from 'wasp/client/operations'
import { Eye, Plus, Search, Filter, Activity, CheckCircle, Clock, AlertCircle, LayoutGrid, LayoutList } from 'lucide-react'
import { useEclipseAutoRefresh } from '../../../../hooks/useEclipseRealtime'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { MonitorCard } from '../components/MonitorCard'
import { MonitorsTable } from '../components/MonitorsTable'
import { CreateMonitorDialog } from '../components/CreateMonitorDialog'
import { EclipsePageHeader, EclipsePageContainer } from '../components/EclipsePageHeader'
import { useWorkspace } from '../../../../hooks/useWorkspace'
import { useToast } from '../../../../hooks/useToast'
import { Badge } from '../../../../components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../../components/ui/alert-dialog'

export default function EclipseMonitoringPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentWorkspace } = useWorkspace()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brandId') || 'all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingMonitor, setEditingMonitor] = useState<any>(null)
  const [deletingMonitorId, setDeletingMonitorId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [selectedMonitors, setSelectedMonitors] = useState<string[]>([])

  const { data: brandsResponse } = useQuery(getEclipseBrands, {
    workspaceId: currentWorkspace?.id || '',
    limit: 100,
    offset: 0,
  })
  const brands = brandsResponse?.data || []

  const { data: monitorsResponse, isLoading, refetch } = useQuery(getEclipseMonitors, {
    workspaceId: currentWorkspace?.id || '',
    filters: selectedBrand !== 'all' ? { brandId: selectedBrand } : {},
    limit: 50,
    offset: 0,
  })
  const monitors = monitorsResponse?.data || []

  // Real-time auto-refresh
  useEclipseAutoRefresh(currentWorkspace?.id || '', refetch, ['monitor'])

  useEffect(() => {
    const brandId = searchParams.get('brandId')
    if (brandId) {
      setSelectedBrand(brandId)
      setCreateDialogOpen(true)
    }
  }, [searchParams])

  const handleCreateMonitor = async (data: any) => {
    try {
      await createEclipseMonitor({
        workspaceId: currentWorkspace?.id || '',
        ...data,
      })
      toast.success('Monitor criado com sucesso')
      setCreateDialogOpen(false)
      refetch()
    } catch (error: any) {
      toast.error('Erro ao criar monitor', error.message)
    }
  }

  const handleUpdateMonitor = async (data: any) => {
    if (!editingMonitor) return
    
    try {
      await updateEclipseMonitor({
        id: editingMonitor.id,
        ...data,
      })
      toast.success('Monitor atualizado')
      setEditingMonitor(null)
      refetch()
    } catch (error: any) {
      toast.error('Erro ao atualizar monitor')
    }
  }

  const handleDeleteMonitor = async () => {
    if (!deletingMonitorId) return

    try {
      await updateEclipseMonitor({
        id: deletingMonitorId,
        status: 'paused',
      })
      toast.success('Monitor pausado')
      setDeletingMonitorId(null)
      refetch()
    } catch (error: any) {
      toast.error('Erro ao pausar monitor')
    }
  }

  const handleToggleMonitor = async (monitorId: string, isActive: boolean) => {
    try {
      const newStatus = isActive ? 'active' : 'paused'
      await updateEclipseMonitor({
        id: monitorId,
        status: newStatus,
      })
      toast.success(isActive ? 'Monitor ativado' : 'Monitor pausado')
      refetch()
    } catch (error: any) {
      toast.error('Erro ao alterar status do monitor')
    }
  }

  const handleTestMonitor = async (monitorId: string) => {
    try {
      const result = await testEclipseMonitor({ id: monitorId })
      toast.success(result.message || 'Monitor em teste - verificação iniciada')
      refetch()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao testar monitor')
    }
  }

  const filteredMonitors = monitors?.filter((monitor: any) => {
    const matchesSearch = monitor.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         monitor.searchTerms?.some((term: string) => term.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || monitor.status === statusFilter
    const matchesType = typeFilter === 'all' || monitor.monitoringType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const activeMonitors = monitors?.filter((m: any) => m.status === 'active').length || 0
  const pausedMonitors = monitors?.filter((m: any) => m.status === 'paused').length || 0
  const detectionsToday = monitors?.reduce((sum: number, m: any) => sum + (m.detectionsToday || 0), 0) || 0

  return (
    <WorkspaceLayout>
      <EclipsePageHeader
        icon={<Eye className="w-7 h-7 text-blue-600" />}
        title="Monitoramento de Marca"
        description="Rastreie violações de marca em tempo real na internet"
        breadcrumbs={[
          { label: 'Eclipse', href: '/modules/eclipse/dashboard' },
          { label: 'Monitoramento' }
        ]}
        actions={
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Plus className='w-4 h-4' />
            Novo Monitor
          </Button>
        }
        stats={[
          {
            icon: <Eye className="w-5 h-5 text-blue-500" />,
            label: 'Total de Monitores',
            value: monitors?.length || 0
          },
          {
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            label: 'Ativos',
            value: activeMonitors,
            color: 'text-green-600'
          },
          {
            icon: <Clock className="w-5 h-5 text-yellow-500" />,
            label: 'Pausados',
            value: pausedMonitors,
            color: 'text-yellow-600'
          },
          {
            icon: <Activity className="w-5 h-5 text-purple-500" />,
            label: 'Detecções Hoje',
            value: detectionsToday
          }
        ]}
      />

      {/* Filters */}
      <EclipsePageContainer className="py-6 border-b border-border">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className='relative flex-1 max-w-md'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
            <Input
              placeholder='Buscar monitores...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>

          <div className="flex items-center gap-2">
            {selectedMonitors.length > 0 && (
              <Badge variant="secondary" className="px-3 py-1">
                {selectedMonitors.length} selecionado(s)
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
          <div></div>

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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="paused">Pausados</SelectItem>
              <SelectItem value="testing">Em teste</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="domain">Domínio</SelectItem>
              <SelectItem value="social">Redes Sociais</SelectItem>
              <SelectItem value="marketplace">Marketplace</SelectItem>
              <SelectItem value="web">Web</SelectItem>
              <SelectItem value="dns">DNS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </EclipsePageContainer>

      {/* Content */}
      <EclipsePageContainer>
          {isLoading ? (
            <div className='text-center py-12'>
              <p className='text-muted-foreground'>Carregando monitores...</p>
            </div>
          ) : filteredMonitors?.length === 0 ? (
            <div className='text-center py-12'>
              <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className='text-muted-foreground mb-4'>
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Nenhum monitor encontrado com os filtros aplicados.'
                  : 'Nenhum monitor configurado ainda.'}
              </p>
              {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className='w-4 h-4 mr-2' />
                  Criar Primeiro Monitor
                </Button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <MonitorsTable
              monitors={filteredMonitors}
              onView={(monitorId) => navigate(`/modules/eclipse/monitoring/${monitorId}`)}
              onEdit={setEditingMonitor}
              onDelete={setDeletingMonitorId}
              onToggleActive={handleToggleMonitor}
              selectedMonitors={selectedMonitors}
              onSelectMonitor={(monitorId) => {
                if (selectedMonitors.includes(monitorId)) {
                  setSelectedMonitors(selectedMonitors.filter(id => id !== monitorId))
                } else {
                  setSelectedMonitors([...selectedMonitors, monitorId])
                }
              }}
              onSelectAll={(checked) => {
                if (checked) {
                  setSelectedMonitors(filteredMonitors.map((m: any) => m.id))
                } else {
                  setSelectedMonitors([])
                }
              }}
            />
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredMonitors?.map((monitor: any) => (
                <MonitorCard
                  key={monitor.id}
                  monitor={monitor}
                  onView={() => navigate(`/modules/eclipse/monitoring/${monitor.id}`)}
                  onEdit={() => setEditingMonitor(monitor)}
                  onDelete={() => setDeletingMonitorId(monitor.id)}
                  onToggle={() => handleToggleMonitor(monitor.id, monitor.status !== 'paused')}
                  onTest={() => handleTestMonitor(monitor.id)}
                />
              ))}
            </div>
          )}
      </EclipsePageContainer>

      {/* Create/Edit Dialog */}
      <CreateMonitorDialog
        open={createDialogOpen || !!editingMonitor}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setCreateDialogOpen(false)
            setEditingMonitor(null)
          }
        }}
        onSubmit={editingMonitor ? handleUpdateMonitor : handleCreateMonitor}
        initialData={editingMonitor}
        brands={brands || []}
        preselectedBrandId={selectedBrand !== 'all' ? selectedBrand : undefined}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingMonitorId} onOpenChange={() => setDeletingMonitorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este monitor? Esta ação não pode ser desfeita e todos os alertas relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMonitor} className='bg-red-600 hover:bg-red-700'>
              Excluir Monitor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspaceLayout>
  )
}
