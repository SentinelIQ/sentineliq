import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Eye, Play, Pause, Edit, Trash2, MoreVertical, Clock, AlertCircle, Zap } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu'

interface MonitorCardProps {
  monitor: any
  onEdit?: () => void
  onDelete?: () => void
  onToggle?: () => void
  onView?: () => void
  onTest?: () => void
}

export const MonitorCard = ({ monitor, onEdit, onDelete, onToggle, onView, onTest }: MonitorCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'testing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default:
        return 'bg-muted/50 text-muted-foreground border-border'
    }
  }

  const getMonitorTypeIcon = (type: string) => {
    return Eye // Pode ser expandido para diferentes tipos
  }

  const MonitorIcon = getMonitorTypeIcon(monitor.monitoringType)

  return (
    <Card className="hover:shadow-md transition-all" onClick={onView}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={(e) => {
          e.stopPropagation();
          onView?.();
        }}>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <MonitorIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">{monitor.source}</CardTitle>
            <div className="text-xs text-muted-foreground mt-1">
              {monitor.monitoringType}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => {
            e.stopPropagation();
          }}>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {onTest && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTest(); }}>
                <Zap className="w-4 h-4 mr-2" />
                Testar Monitor
              </DropdownMenuItem>
            )}
            {onToggle && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                {monitor.status === 'active' ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Ativar
                  </>
                )}
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
        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(monitor.status)}>
              {monitor.status}
            </Badge>
            {monitor.isAutomated && (
              <Badge variant="outline" className="text-xs">
                Automatizado
              </Badge>
            )}
          </div>

          {/* Search Terms */}
          {monitor.searchTerms && monitor.searchTerms.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Termos de Busca:</div>
              <div className="flex flex-wrap gap-1">
                {monitor.searchTerms.slice(0, 3).map((term: string) => (
                  <span key={term} className="text-xs px-2 py-1 bg-muted rounded">
                    {term}
                  </span>
                ))}
                {monitor.searchTerms.length > 3 && (
                  <span className="text-xs px-2 py-1 bg-muted rounded">
                    +{monitor.searchTerms.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div>
              <div className="flex items-center gap-1 text-orange-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">{monitor.detectionsThisMonth || 0}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Este mês</div>
            </div>
            
            <div>
              <div className="flex items-center gap-1 text-blue-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">{monitor.checkFrequency}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Frequência</div>
            </div>
          </div>

          {/* Last Check */}
          {monitor.lastCheckAt && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Última verificação: {new Date(monitor.lastCheckAt).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
