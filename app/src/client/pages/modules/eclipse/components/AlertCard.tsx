import { Card, CardContent, CardHeader } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { AlertTriangle, ExternalLink, Check, X, ArrowUpRight } from 'lucide-react'
import { cn } from '../../../../../lib/utils'

interface AlertCardProps {
  alert: any
  onAcknowledge?: () => void
  onDismiss?: () => void
  onEscalate?: () => void
  onView?: () => void
}

export const AlertCard = ({ alert, onAcknowledge, onDismiss, onEscalate, onView }: AlertCardProps) => {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          badgeClass: 'bg-red-500/10 text-red-500 border-red-500/20',
        }
      case 'high':
        return {
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/20',
          badgeClass: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        }
      case 'medium':
        return {
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          badgeClass: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        }
      case 'low':
        return {
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        }
      default:
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          badgeClass: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500">Novo</Badge>
      case 'acknowledged':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">Reconhecido</Badge>
      case 'investigating':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500">Investigando</Badge>
      case 'dismissed':
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Dispensado</Badge>
      case 'escalated':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500">Escalado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const severityConfig = getSeverityConfig(alert.severity)

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
            <AlertTriangle className={cn('w-5 h-5', severityConfig.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm line-clamp-2">{alert.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {alert.description || 'Sem descrição'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={severityConfig.badgeClass}>
              {alert.severity}
            </Badge>
            {getStatusBadge(alert.status)}
            {alert.confidence && (
              <Badge variant="outline" className="text-xs">
                {alert.confidence}% confiança
              </Badge>
            )}
          </div>

          {/* URL */}
          {alert.url && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ExternalLink className="w-3 h-3" />
              <a 
                href={alert.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {alert.url}
              </a>
            </div>
          )}

          {/* Actions */}
          {(onAcknowledge || onDismiss || onEscalate) && alert.status === 'new' && (
            <div className="flex items-center gap-2 pt-2 border-t">
              {onAcknowledge && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => { e.stopPropagation(); onAcknowledge(); }}
                  className="text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Reconhecer
                </Button>
              )}
              {onEscalate && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); onEscalate(); }}
                  className="text-xs"
                >
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  Escalar
                </Button>
              )}
              {onDismiss && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                  className="text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Dispensar
                </Button>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {new Date(alert.createdAt).toLocaleString('pt-BR')}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
