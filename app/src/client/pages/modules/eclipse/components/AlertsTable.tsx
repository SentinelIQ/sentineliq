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
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react'

interface AlertsTableProps {
  alerts: any[]
  onView: (alertId: string) => void
  onAcknowledge: (alertId: string) => void
  onDismiss: (alertId: string) => void
  onEscalate: (alertId: string) => void
  selectedAlerts: string[]
  onSelectAlert: (alertId: string) => void
  onSelectAll: (checked: boolean) => void
}

export function AlertsTable({
  alerts,
  onView,
  onAcknowledge,
  onDismiss,
  onEscalate,
  selectedAlerts,
  onSelectAlert,
  onSelectAll,
}: AlertsTableProps) {
  const navigate = useNavigate()
  const allSelected = alerts.length > 0 && selectedAlerts.length === alerts.length

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      case 'high':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
      case 'low':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      case 'acknowledged':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      case 'investigating':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
      case 'dismissed':
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
      case 'escalated':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      critical: 'Crítica',
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa',
    }
    return labels[severity] || severity
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'Novo',
      acknowledged: 'Reconhecido',
      investigating: 'Investigando',
      dismissed: 'Descartado',
      escalated: 'Escalado',
    }
    return labels[status] || status
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
            <TableHead className="font-semibold">URL</TableHead>
            <TableHead className="font-semibold">Severidade</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Confiança</TableHead>
            <TableHead className="font-semibold">Marca</TableHead>
            <TableHead className="font-semibold">Detectado</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                Nenhum alerta encontrado
              </TableCell>
            </TableRow>
          ) : (
            alerts.map((alert) => (
              <TableRow 
                key={alert.id} 
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onView(alert.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedAlerts.includes(alert.id)}
                    onCheckedChange={() => onSelectAlert(alert.id)}
                    aria-label={`Selecionar alerta`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 max-w-md">
                    {alert.url ? (
                      <a
                        href={alert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {new URL(alert.url).hostname}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getSeverityColor(alert.severity)} text-xs font-medium`}
                  >
                    {getSeverityLabel(alert.severity)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(alert.status)} text-xs font-medium`}
                  >
                    {getStatusLabel(alert.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{alert.confidence}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{alert.brand?.name || 'N/A'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.createdAt).toLocaleDateString('pt-BR')}
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
                      <DropdownMenuItem onClick={() => onView(alert.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      {alert.status !== 'acknowledged' && (
                        <DropdownMenuItem onClick={() => onAcknowledge(alert.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Reconhecer
                        </DropdownMenuItem>
                      )}
                      {alert.status !== 'dismissed' && (
                        <DropdownMenuItem onClick={() => onDismiss(alert.id)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Descartar
                        </DropdownMenuItem>
                      )}
                      {alert.status !== 'escalated' && (
                        <DropdownMenuItem onClick={() => onEscalate(alert.id)}>
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          Escalar
                        </DropdownMenuItem>
                      )}
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
