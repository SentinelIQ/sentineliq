import { Card, CardContent, CardHeader } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Zap, Calendar, User, CheckCircle, Clock, AlertCircle, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { cn } from '../../../../../lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu'

interface ActionCardProps {
  action: any
  onEdit?: () => void
  onDelete?: () => void
  onView?: () => void
  onComplete?: () => void
}

export const ActionCard = ({ action, onEdit, onDelete, onView, onComplete }: ActionCardProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-l-yellow-500',
          badgeClass: 'bg-yellow-500/10 text-yellow-500',
          label: 'Pendente',
        }
      case 'in_progress':
        return {
          icon: AlertCircle,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-l-blue-500',
          badgeClass: 'bg-blue-500/10 text-blue-500',
          label: 'Em Andamento',
        }
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-l-green-500',
          badgeClass: 'bg-green-500/10 text-green-500',
          label: 'Concluída',
        }
      case 'failed':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-l-red-500',
          badgeClass: 'bg-red-500/10 text-red-500',
          label: 'Falhou',
        }
      default:
        return {
          icon: Clock,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-l-muted-foreground',
          badgeClass: 'bg-muted text-muted-foreground',
          label: status,
        }
    }
  }

  const getActionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      dmca_notice: 'Notificação DMCA',
      cease_desist: 'Cessar e Desistir',
      platform_report: 'Denúncia na Plataforma',
      legal_action: 'Ação Legal',
      monitoring: 'Monitoramento',
    }
    return types[type] || type
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-500'
    if (priority >= 3) return 'text-orange-500'
    if (priority >= 2) return 'text-yellow-500'
    return 'text-green-500'
  }

  const statusConfig = getStatusConfig(action.status)
  const StatusIcon = statusConfig.icon

  return (
    <Card 
      className={cn(
        'hover:shadow-md transition-all border-l-4',
        statusConfig.borderColor
      )}
      onClick={onView}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', statusConfig.bgColor)}>
            <StatusIcon className={cn('w-5 h-5', statusConfig.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm line-clamp-2">{action.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {getActionTypeLabel(action.actionType)}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onComplete && action.status !== 'completed' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onComplete(); }}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar como Concluída
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
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={statusConfig.badgeClass}>
              {statusConfig.label}
            </Badge>
            <Badge variant="outline" className={getPriorityColor(action.priority)}>
              Prioridade {action.priority}
            </Badge>
          </div>

          {/* Description */}
          {action.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {action.description}
            </p>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {action.plannedDate && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span className="truncate">
                  Planejado: {new Date(action.plannedDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
            
            {action.executionDate && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="truncate">
                  Executado: {new Date(action.executionDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>

          {/* Assigned To */}
          {action.assignedTo && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
              <User className="w-3 h-3" />
              <span>Atribuído a: {action.assignedTo}</span>
            </div>
          )}

          {/* Result */}
          {action.result && action.status === 'completed' && (
            <div className="text-xs bg-green-50 dark:bg-green-950 p-2 rounded border border-green-200 dark:border-green-800">
              <span className="font-medium text-green-700 dark:text-green-400">Resultado: </span>
              <span className="text-green-600 dark:text-green-500">{action.result}</span>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Criado em {new Date(action.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
