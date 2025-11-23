import { useState } from 'react'
import { WorkspaceLayout } from '../../../workspace/WorkspaceLayout'
import { useNavigate } from 'react-router-dom'
import { useQuery, getEclipseBrands, getEclipseActions, updateEclipseActionStatus } from 'wasp/client/operations'
import { Zap, Search, Plus, CheckCircle, Clock, AlertCircle, LayoutGrid, LayoutList, Filter } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { ActionCard } from '../components/ActionCard'
import { ActionsTable } from '../components/ActionsTable'
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

export default function EclipseActionsPage() {
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspace()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deletingActionId, setDeletingActionId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [selectedActions, setSelectedActions] = useState<string[]>([])

  const { data: brandsResponse } = useQuery(getEclipseBrands, {
    workspaceId: currentWorkspace?.id || '',
    limit: 100,
    offset: 0,
  })
  const brands = brandsResponse?.data || []

  const { data: actionsResponse, isLoading, refetch } = useQuery(getEclipseActions, {
    workspaceId: currentWorkspace?.id || '',
    limit: 50,
    offset: 0,
  })
  const actions = actionsResponse?.data || []

  const handleDelete = async () => {
    if (!deletingActionId) return

    try {
      await updateEclipseActionStatus({
        id: deletingActionId,
        status: 'cancelled',
      })
      toast.success('Ação cancelada')
      setDeletingActionId(null)
      refetch()
    } catch (error: any) {
      toast.error('Erro ao cancelar ação')
    }
  }

  const handleComplete = async (actionId: string) => {
    try {
      await updateEclipseActionStatus({
        id: actionId,
        status: 'completed',
        completionDate: new Date(),
      })
      toast.success('Ação marcada como concluída')
      refetch()
    } catch (error: any) {
      toast.error('Erro ao completar ação')
    }
  }

  const filteredActions = actions?.filter((action: any) => {
    const matchesSearch = action.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         action.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || action.actionType === typeFilter
    const matchesStatus = statusFilter === 'all' || action.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const stats = {
    total: filteredActions?.length || 0,
    pending: filteredActions?.filter((a: any) => a.status === 'pending').length || 0,
    inProgress: filteredActions?.filter((a: any) => a.status === 'in_progress').length || 0,
    completed: filteredActions?.filter((a: any) => a.status === 'completed').length || 0,
  }

  return (
    <WorkspaceLayout>
      <EclipsePageHeader
        icon={<Zap className="w-7 h-7 text-yellow-600" />}
        title="Plano de Ação"
        description="Execute e acompanhe ações contra violações de marca"
        breadcrumbs={[
          { label: 'Eclipse', href: '/modules/eclipse/dashboard' },
          { label: 'Ações' }
        ]}
        actions={
          <Button onClick={() => navigate('/modules/eclipse/infringements')} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Plus className='w-4 h-4' />
            Nova Ação
          </Button>
        }
        stats={[
          {
            icon: <Zap className="w-5 h-5 text-yellow-500" />,
            label: 'Total de Ações',
            value: stats.total
          },
          {
            icon: <Clock className="w-5 h-5 text-yellow-500" />,
            label: 'Pendentes',
            value: stats.pending,
            color: 'text-yellow-600'
          },
          {
            icon: <AlertCircle className="w-5 h-5 text-blue-500" />,
            label: 'Em Andamento',
            value: stats.inProgress,
            color: 'text-blue-600'
          },
          {
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            label: 'Concluídas',
            value: stats.completed,
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
                placeholder='Buscar ações...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>

            <div className="flex items-center gap-2">
              {selectedActions.length > 0 && (
                <Badge variant="secondary" className="px-3 py-1">
                  {selectedActions.length} selecionada(s)
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

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos tipos</SelectItem>
                <SelectItem value="dmca_notice">Notificação DMCA</SelectItem>
                <SelectItem value="cease_desist">Cessar e Desistir</SelectItem>
                <SelectItem value="platform_report">Denúncia na Plataforma</SelectItem>
                <SelectItem value="legal_action">Ação Legal</SelectItem>
                <SelectItem value="monitoring">Monitoramento</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>
          </div>
      </EclipsePageContainer>

      {/* Content */}
      <EclipsePageContainer>
        {isLoading ? (
            <div className='text-center py-12'>
              <p className='text-muted-foreground'>Carregando ações...</p>
            </div>
          ) : filteredActions?.length === 0 ? (
            <div className='text-center py-12'>
              <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className='text-muted-foreground'>
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Nenhuma ação encontrada com os filtros aplicados.'
                  : 'Nenhuma ação registrada ainda.'}
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <ActionsTable
              actions={filteredActions}
              onView={(actionId) => navigate(`/modules/eclipse/actions/${actionId}`)}
              onEdit={(action) => navigate(`/modules/eclipse/actions/${action.id}`)}
              onDelete={setDeletingActionId}
              selectedActions={selectedActions}
              onSelectAction={(actionId) => {
                if (selectedActions.includes(actionId)) {
                  setSelectedActions(selectedActions.filter(id => id !== actionId))
                } else {
                  setSelectedActions([...selectedActions, actionId])
                }
              }}
              onSelectAll={(checked) => {
                if (checked) {
                  setSelectedActions(filteredActions.map((a: any) => a.id))
                } else {
                  setSelectedActions([])
                }
              }}
            />
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredActions?.map((action: any) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onView={() => navigate(`/modules/eclipse/actions/${action.id}`)}
                  onDelete={() => setDeletingActionId(action.id)}
                  onComplete={() => handleComplete(action.id)}
                />
              ))}
            </div>
          )}
      </EclipsePageContainer>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingActionId} onOpenChange={() => setDeletingActionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-red-600 hover:bg-red-700'>
              Excluir Ação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspaceLayout>
  )
}
