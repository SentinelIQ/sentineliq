import { useState } from 'react'
import { WorkspaceLayout } from '../../../workspace/WorkspaceLayout'
import { useNavigate } from 'react-router-dom'
import { useQuery, getEclipseBrands, createEclipseBrand, updateEclipseBrand, deleteEclipseBrand } from 'wasp/client/operations'
import { Plus, Search, ShieldAlert, LayoutGrid, LayoutList, Download, Upload, Filter } from 'lucide-react'
import { useEclipseAutoRefresh } from '../../../../hooks/useEclipseRealtime'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { BrandCard } from '../components/BrandCard'
import { BrandsTable } from '../components/BrandsTable'
import { CreateBrandDialog } from '../components/CreateBrandDialog'
import { ImportBrandsDialog } from '../components/ImportBrandsDialog'
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

export default function EclipseBrandsPage() {
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspace()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<any>(null)
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])

  const { data: brandsResponse, isLoading, refetch } = useQuery(getEclipseBrands, {
    workspaceId: currentWorkspace?.id || '',
    limit: 50,
    offset: 0,
  })
  const brands = brandsResponse?.data || []

  // Real-time auto-refresh
  useEclipseAutoRefresh(currentWorkspace?.id || '', refetch, ['brand'])

  const handleCreateBrand = async (data: any) => {
    try {
      await createEclipseBrand({
        workspaceId: currentWorkspace?.id || '',
        ...data,
      })
      toast.success('Marca criada com sucesso')
      setCreateDialogOpen(false)
      refetch()
    } catch (error: any) {
      toast.error('Erro ao criar marca', error.message || 'Ocorreu um erro ao criar a marca.')
    }
  }

  const handleUpdateBrand = async (data: any) => {
    if (!editingBrand) return
    
    try {
      await updateEclipseBrand({
        id: editingBrand.id,
        workspaceId: currentWorkspace?.id || '',
        ...data,
      })
      toast.success('Marca atualizada')
      setEditingBrand(null)
      refetch()
    } catch (error: any) {
      toast.error('Erro ao atualizar marca', error.message || 'Ocorreu um erro ao atualizar a marca.')
    }
  }

  const handleDeleteBrand = async () => {
    if (!deletingBrandId) return

    try {
      await deleteEclipseBrand({
        id: deletingBrandId,
      })
      toast.success('Marca excluída')
      setDeletingBrandId(null)
      refetch()
    } catch (error: any) {
      toast.error('Erro ao excluir marca', error.message || 'Ocorreu um erro ao excluir a marca.')
    }
  }

  const filteredBrands = brands?.filter((brand: any) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.trademark?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <WorkspaceLayout>
      <EclipsePageHeader
        icon={<ShieldAlert className="w-7 h-7 text-purple-600" />}
        title="Gestão de Marcas"
        description="Gerencie suas marcas registradas e ativos de propriedade intelectual"
        breadcrumbs={[
          { label: 'Eclipse', href: '/modules/eclipse/dashboard' },
          { label: 'Marcas' }
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)} className="gap-2">
              <Upload className='w-4 h-4' />
              Importar
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className='w-4 h-4' />
              Exportar
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Plus className='w-4 h-4' />
              Nova Marca
            </Button>
          </>
        }
        stats={[
          {
            icon: <ShieldAlert className="w-5 h-5 text-purple-500" />,
            label: 'Total de Marcas',
            value: brands?.length || 0
          },
          {
            icon: <ShieldAlert className="w-5 h-5 text-green-500" />,
            label: 'Ativas',
            value: brands?.filter((b: any) => b.status === 'active').length || 0,
            color: 'text-green-600'
          },
          {
            icon: <ShieldAlert className="w-5 h-5 text-blue-500" />,
            label: 'Com Monitores',
            value: brands?.filter((b: any) => b.monitors && b.monitors.length > 0).length || 0
          },
          {
            icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
            label: 'Com Infrações',
            value: brands?.filter((b: any) => b.infringements && b.infringements.length > 0).length || 0,
            color: 'text-red-600'
          }
        ]}
      />

      {/* Toolbar */}
      <EclipsePageContainer className="py-4 border-b border-border bg-background/50">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
              <Input
                placeholder='Buscar marcas...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>

            {/* View Toggle & Actions */}
            <div className="flex items-center gap-2">
              {selectedBrands.length > 0 && (
                <Badge variant="secondary" className="px-3 py-1">
                  {selectedBrands.length} selecionada(s)
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
      </EclipsePageContainer>

      {/* Content */}
      <EclipsePageContainer>
        {isLoading ? (
            <div className='text-center py-12'>
              <p className='text-muted-foreground'>Carregando marcas...</p>
            </div>
          ) : filteredBrands?.length === 0 ? (
            <div className='text-center py-12'>
              <ShieldAlert className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className='text-muted-foreground mb-4'>
                {searchQuery ? 'Nenhuma marca encontrada com os filtros aplicados.' : 'Nenhuma marca cadastrada ainda.'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className='w-4 h-4 mr-2' />
                  Criar Primeira Marca
                </Button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <BrandsTable
              brands={filteredBrands}
              onEdit={setEditingBrand}
              onDelete={setDeletingBrandId}
              onConfigure={(brandId) => navigate(`/modules/eclipse/brands/${brandId}/config`)}
              selectedBrands={selectedBrands}
              onSelectBrand={(brandId) => {
                if (selectedBrands.includes(brandId)) {
                  setSelectedBrands(selectedBrands.filter(id => id !== brandId))
                } else {
                  setSelectedBrands([...selectedBrands, brandId])
                }
              }}
              onSelectAll={(checked) => {
                if (checked) {
                  setSelectedBrands(filteredBrands.map((b: any) => b.id))
                } else {
                  setSelectedBrands([])
                }
              }}
            />
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredBrands?.map((brand: any) => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  onView={() => navigate(`/modules/eclipse/brands/${brand.id}`)}
                  onEdit={() => setEditingBrand(brand)}
                  onDelete={() => setDeletingBrandId(brand.id)}
                  onConfigure={() => navigate(`/modules/eclipse/brands/${brand.id}/config`)}
                />
              ))}
            </div>
          )}
      </EclipsePageContainer>

      {/* Create/Edit Dialog */}
      <CreateBrandDialog
        open={createDialogOpen || !!editingBrand}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setCreateDialogOpen(false)
            setEditingBrand(null)
          }
        }}
        onSubmit={editingBrand ? handleUpdateBrand : handleCreateBrand}
        initialData={editingBrand}
      />

      {/* Import Dialog */}
      {importDialogOpen && currentWorkspace?.id && (
        <ImportBrandsDialog
          workspaceId={currentWorkspace.id}
          onImportComplete={() => {
            setImportDialogOpen(false)
            refetch()
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBrandId} onOpenChange={() => setDeletingBrandId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta marca? Esta ação não pode ser desfeita e todos os monitores, alertas e infrações relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBrand} className='bg-red-600 hover:bg-red-700'>
              Excluir Marca
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspaceLayout>
  )
}
