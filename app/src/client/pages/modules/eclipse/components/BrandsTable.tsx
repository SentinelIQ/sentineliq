import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../components/ui/table'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Checkbox } from '../../../../components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Settings,
  Eye,
  Shield,
  AlertCircle,
  TrendingUp,
  ExternalLink,
} from 'lucide-react'

interface BrandsTableProps {
  brands: any[]
  onEdit: (brand: any) => void
  onDelete: (brandId: string) => void
  onConfigure: (brandId: string) => void
  selectedBrands: string[]
  onSelectBrand: (brandId: string) => void
  onSelectAll: (checked: boolean) => void
}

export function BrandsTable({
  brands,
  onEdit,
  onDelete,
  onConfigure,
  selectedBrands,
  onSelectBrand,
  onSelectAll,
}: BrandsTableProps) {
  const navigate = useNavigate()
  const allSelected = brands.length > 0 && selectedBrands.length === brands.length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      case 'inactive':
        return 'bg-muted text-muted-foreground border-border'
      case 'suspended':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-600'
    if (priority === 3) return 'text-yellow-600'
    return 'text-blue-600'
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label="Selecionar todas"
              />
            </TableHead>
            <TableHead className="font-semibold">Marca</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Prioridade</TableHead>
            <TableHead className="font-semibold">Monitores</TableHead>
            <TableHead className="font-semibold">Infrações</TableHead>
            <TableHead className="font-semibold">Domínios</TableHead>
            <TableHead className="font-semibold">Última Atualização</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                Nenhuma marca encontrada
              </TableCell>
            </TableRow>
          ) : (
            brands.map((brand) => (
              <TableRow 
                key={brand.id} 
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => navigate(`/modules/eclipse/brands/${brand.id}`)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedBrands.includes(brand.id)}
                    onCheckedChange={() => onSelectBrand(brand.id)}
                    aria-label={`Selecionar ${brand.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {brand.logoUrl ? (
                      <img 
                        src={brand.logoUrl} 
                        alt={brand.name} 
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-purple-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{brand.name}</p>
                      {brand.trademark && (
                        <p className="text-xs text-muted-foreground">{brand.trademark}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(brand.status)} text-xs font-medium`}
                  >
                    {brand.status === 'active' ? 'Ativa' : 
                     brand.status === 'inactive' ? 'Inativa' : 
                     'Suspensa'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className={`font-semibold ${getPriorityColor(brand.priority)}`}>
                      {brand.priority}
                    </span>
                    <span className="text-xs text-muted-foreground">/5</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{brand.monitors?.length || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {brand.infringements?.length > 0 ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="font-medium text-red-600">
                          {brand.infringements.length}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-green-600">0</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{brand.domains?.length || 0}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {new Date(brand.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate(`/modules/eclipse/brands/${brand.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(brand)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onConfigure(brand.id)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Configurar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate(`/modules/eclipse/monitoring?brandId=${brand.id}`)}
                      >
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Adicionar Monitor
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(brand.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
