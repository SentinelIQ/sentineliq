import { Card, CardContent, CardHeader } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { AlertCircle, ExternalLink, Link2, MapPin, Calendar, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { cn } from '../../../../../lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu'

interface InfringementCardProps {
  infringement: any
  onEdit?: () => void
  onDelete?: () => void
  onView?: () => void
  onCreateAction?: () => void
}

export const InfringementCard = ({ infringement, onEdit, onDelete, onView, onCreateAction }: InfringementCardProps) => {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-l-red-500',
          badgeClass: 'bg-red-500/10 text-red-500 border-red-500/20',
        }
      case 'high':
        return {
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-l-orange-500',
          badgeClass: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        }
      case 'medium':
        return {
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-l-yellow-500',
          badgeClass: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        }
      case 'low':
        return {
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-l-blue-500',
          badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        }
      default:
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-l-gray-500',
          badgeClass: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-red-500/10 text-red-500">Aberto</Badge>
      case 'investigating':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Investigando</Badge>
      case 'action_pending':
        return <Badge className="bg-orange-500/10 text-orange-500">Ação Pendente</Badge>
      case 'action_taken':
        return <Badge className="bg-blue-500/10 text-blue-500">Ação Tomada</Badge>
      case 'resolved':
        return <Badge className="bg-green-500/10 text-green-500">Resolvido</Badge>
      case 'false_positive':
        return <Badge className="bg-muted text-muted-foreground">Falso Positivo</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      counterfeiting: 'Falsificação',
      domain_squatting: 'Domínio Indevido',
      trademark_misuse: 'Uso Indevido de Marca',
      impersonation: 'Personificação',
    }
    return types[type] || type
  }

  const severityConfig = getSeverityConfig(infringement.severity)

  return (
    <Card 
      className={cn(
        'hover:shadow-md transition-all border-l-4',
        severityConfig.borderColor
      )}
      onClick={onView}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', severityConfig.bgColor)}>
            <AlertCircle className={cn('w-5 h-5', severityConfig.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm line-clamp-2">{infringement.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {infringement.description || 'Sem descrição'}
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
            {onCreateAction && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateAction(); }}>
                <AlertCircle className="w-4 h-4 mr-2" />
                Criar Ação
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
            <Badge className={severityConfig.badgeClass}>
              {infringement.severity}
            </Badge>
            {getStatusBadge(infringement.status)}
            <Badge variant="outline" className="text-xs">
              {getTypeLabel(infringement.type)}
            </Badge>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {infringement.domain && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Link2 className="w-3 h-3" />
                <span className="truncate">{infringement.domain}</span>
              </div>
            )}
            
            {infringement.location && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{infringement.location}</span>
              </div>
            )}
          </div>

          {/* URL */}
          {infringement.url && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              <a 
                href={infringement.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {infringement.url}
              </a>
            </div>
          )}

          {/* Actions Count */}
          {infringement._count?.actions > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                {infringement._count.actions} {infringement._count.actions === 1 ? 'ação' : 'ações'}
              </span>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
            <Calendar className="w-3 h-3" />
            Detectado em {new Date(infringement.detectionDate || infringement.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
