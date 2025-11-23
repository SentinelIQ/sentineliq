import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { ShieldAlert, Eye, AlertCircle, MoreVertical, Edit, Trash2, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu'

interface BrandCardProps {
  brand: any
  onEdit?: () => void
  onDelete?: () => void
  onConfigure?: () => void
  onView?: () => void
}

export const BrandCard = ({ brand, onEdit, onDelete, onConfigure, onView }: BrandCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'archived':
        return 'bg-muted/50 text-muted-foreground border-border'
      default:
        return 'bg-muted/50 text-muted-foreground border-border'
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-500'
    if (priority >= 3) return 'text-orange-500'
    if (priority >= 2) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={onView}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-6 h-6 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">{brand.name}</CardTitle>
            <CardDescription className="text-sm mt-1 line-clamp-2">
              {brand.description || 'Sem descrição'}
            </CardDescription>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onConfigure && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onConfigure(); }}>
                <Settings className="w-4 h-4 mr-2" />
                Configurar Monitores
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Status e Prioridade */}
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(brand.status)}>
              {brand.status}
            </Badge>
            <Badge variant="outline" className={getPriorityColor(brand.priority)}>
              Prioridade {brand.priority}
            </Badge>
          </div>

          {/* Trademark */}
          {brand.trademark && (
            <div className="text-sm">
              <span className="text-muted-foreground">Marca Registrada:</span>
              <span className="ml-2 font-medium">{brand.trademark}</span>
            </div>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-blue-500">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-semibold">{brand._count?.monitors || 0}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Monitores</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-orange-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">{brand._count?.alerts || 0}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Alertas</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-red-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">{brand._count?.infringements || 0}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Infrações</div>
            </div>
          </div>

          {/* Domains */}
          {brand.domains && brand.domains.length > 0 && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <div className="flex flex-wrap gap-1">
                {brand.domains.slice(0, 3).map((domain: string) => (
                  <span key={domain} className="px-2 py-1 bg-muted rounded">
                    {domain}
                  </span>
                ))}
                {brand.domains.length > 3 && (
                  <span className="px-2 py-1 bg-muted rounded">
                    +{brand.domains.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
