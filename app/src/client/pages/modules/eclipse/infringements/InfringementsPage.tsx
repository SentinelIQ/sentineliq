import { useState } from 'react'
import { WorkspaceLayout } from '../../../workspace/WorkspaceLayout'
import { useNavigate } from 'react-router-dom'
import { useQuery, getEclipseBrands, getEclipseInfringements, updateEclipseInfringementStatus, createEclipseAction } from 'wasp/client/operations'
import { AlertCircle, Search, Plus, Zap, Shield, XCircle, Clock, LayoutGrid, LayoutList, Filter } from 'lucide-react'
import { useEclipseAutoRefresh } from '../../../../hooks/useEclipseRealtime'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { InfringementCard } from '../components/InfringementCard'
import { InfringementsTable } from '../components/InfringementsTable'
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

export default function EclipseInfringementsPage() {
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspace()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deletingInfringementId, setDeletingInfringementId] = useState<string | null>(null)
  const [creatingActionFor, setCreatingActionFor] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [selectedInfringements, setSelectedInfringements] = useState<string[]>([])

  const { data: brandsResponse } = useQuery(getEclipseBrands, {
    workspaceId: currentWorkspace?.id || '',
    limit: 100,
    offset: 0,
  })
  const brands = brandsResponse?.data || []

  const { data: infringementsResponse, isLoading, refetch } = useQuery(getEclipseInfringements, {
    workspaceId: currentWorkspace?.id || '',
    brandId: selectedBrand !== 'all' ? selectedBrand : undefined,
    limit: 50,
    offset: 0,
  })
  const infringements = infringementsResponse?.data || []

  // Real-time auto-refresh
  useEclipseAutoRefresh(currentWorkspace?.id || '', refetch, ['infringement', 'action'])

  const handleDelete = async () => {
    if (!deletingInfringementId) return

    try {
      await updateEclipseInfringementStatus({
        id: deletingInfringementId,
        status: 'false_positive',
      })
      toast.success('Infração marcada como falso positivo')
      setDeletingInfringementId(null)
      refetch()
    } catch (error: any) {
      toast.error('Erro ao atualizar infração')
    }
  }

  const handleCreateAction = async (infringementId: string) => {
    try {
      const infringement = infringements?.find((i: any) => i.id === infringementId)
      await createEclipseAction({
        workspaceId: currentWorkspace?.id || '',
        infringementId,
        actionType: 'platform_report',
        title: `Ação para ${infringement?.title || 'infração'}`,
        priority: infringement?.severity === 'critical' ? 5 : infringement?.severity === 'high' ? 4 : 3,
      })
      toast.success('Ação criada com sucesso')
      navigate('/modules/eclipse/actions')
    } catch (error: any) {
      toast.error('Erro ao criar ação')
    }
  }

  const filteredInfringements = infringements?.filter((infringement: any) => {
    const matchesSearch = infringement.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         infringement.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         infringement.domain?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || infringement.type === typeFilter
    const matchesSeverity = severityFilter === 'all' || infringement.severity === severityFilter
    const matchesStatus = statusFilter === 'all' || infringement.status === statusFilter
    return matchesSearch && matchesType && matchesSeverity && matchesStatus
  })

  const stats = {
    total: filteredInfringements?.length || 0,
    open: filteredInfringements?.filter((i: any) => i.status === 'open').length || 0,
    critical: filteredInfringements?.filter((i: any) => i.severity === 'critical').length || 0,
  }

  return (
    <WorkspaceLayout>
      <EclipsePageHeader
        icon={<AlertCircle className="w-7 h-7 text-red-600" />}
        title="Infrações Detectadas"
        description="Gerencie todas as violações de marca detectadas"
        breadcrumbs={[
          { label: 'Eclipse', href: '/modules/eclipse/dashboard' },
          { label: 'Infrações' }
        ]}
        actions={
          <Button onClick={() => navigate('/modules/eclipse/actions')} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Zap className='w-4 h-4' />
            Criar Ação
          </Button>
        }
        stats={[
          {
            icon: <Shield className="w-5 h-5 text-red-500" />,
            label: 'Total de Infrações',
            value: stats.total
          },
          {
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
            label: 'Críticas',
            value: stats.critical,
            color: 'text-red-600'
          },
          {
            icon: <XCircle className="w-5 h-5 text-orange-500" />,
            label: 'Abertas',
            value: stats.open,
            color: 'text-orange-600'
          },
          {
            icon: <Clock className="w-5 h-5 text-blue-500" />,
            label: 'Em Análise',
            value: filteredInfringements?.filter((i: any) => i.status === 'investigating').length || 0
          }
        ]}
      />

      {/* Filters */}
      <EclipsePageContainer className="py-6 border-b border-border">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
              <Input
                placeholder='Buscar infrações...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>

            <div className="flex items-center gap-2">
              {selectedInfringements.length > 0 && (
                <Badge variant="secondary" className="px-3 py-1">
                  {selectedInfringements.length} selecionada(s)
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

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <SelectItem value="counterfeiting">Falsificação</SelectItem>
                <SelectItem value="domain_squatting">Domínio Indevido</SelectItem>
                <SelectItem value="trademark_misuse">Uso Indevido de Marca</SelectItem>
                <SelectItem value="impersonation">Personificação</SelectItem>
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
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="investigating">Investigando</SelectItem>
                <SelectItem value="action_pending">Ação Pendente</SelectItem>
                <SelectItem value="action_taken">Ação Tomada</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="false_positive">Falso Positivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
      </EclipsePageContainer>

      {/* Content */}
      <EclipsePageContainer>
          {isLoading ? (
            <div className='text-center py-12'>
              <p className='text-muted-foreground'>Carregando infrações...</p>
            </div>
          ) : filteredInfringements?.length === 0 ? (
            <div className='text-center py-12'>
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className='text-muted-foreground'>
                {searchQuery || typeFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'all'
                  ? 'Nenhuma infração encontrada com os filtros aplicados.'
                  : 'Nenhuma infração registrada ainda.'}
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <InfringementsTable
              infringements={filteredInfringements}
              onView={(infringementId) => navigate(`/modules/eclipse/infringements/${infringementId}`)}
              onEdit={(infringement) => navigate(`/modules/eclipse/infringements/${infringement.id}`)}
              onDelete={setDeletingInfringementId}
              selectedInfringements={selectedInfringements}
              onSelectInfringement={(infringementId) => {
                if (selectedInfringements.includes(infringementId)) {
                  setSelectedInfringements(selectedInfringements.filter(id => id !== infringementId))
                } else {
                  setSelectedInfringements([...selectedInfringements, infringementId])
                }
              }}
              onSelectAll={(checked) => {
                if (checked) {
                  setSelectedInfringements(filteredInfringements.map((i: any) => i.id))
                } else {
                  setSelectedInfringements([])
                }
              }}
            />
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredInfringements?.map((infringement: any) => (
                <InfringementCard
                  key={infringement.id}
                  infringement={infringement}
                  onView={() => navigate(`/modules/eclipse/infringements/${infringement.id}`)}
                  onDelete={() => setDeletingInfringementId(infringement.id)}
                  onCreateAction={() => handleCreateAction(infringement.id)}
                />
              ))}
            </div>
          )}
      </EclipsePageContainer>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingInfringementId} onOpenChange={() => setDeletingInfringementId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta infração? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-red-600 hover:bg-red-700'>
              Excluir Infração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspaceLayout>
  )
}
