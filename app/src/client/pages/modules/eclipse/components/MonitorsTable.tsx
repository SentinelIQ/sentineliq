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
  Edit,
  Trash2,
  Play,
  Pause,
} from 'lucide-react'

interface MonitorsTableProps {
  monitors: any[]
  onView: (monitorId: string) => void
  onEdit: (monitor: any) => void
  onDelete: (monitorId: string) => void
  onToggleActive: (monitorId: string, isActive: boolean) => void
  selectedMonitors: string[]
  onSelectMonitor: (monitorId: string) => void
  onSelectAll: (checked: boolean) => void
}

export function MonitorsTable({
  monitors,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  selectedMonitors,
  onSelectMonitor,
  onSelectAll,
}: MonitorsTableProps) {
  const navigate = useNavigate()
  const allSelected = monitors.length > 0 && selectedMonitors.length === monitors.length

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      : 'bg-muted text-muted-foreground border-border'
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
            <TableHead className="font-semibold">Monitor</TableHead>
            <TableHead className="font-semibold">Marca</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Tipo</TableHead>
            <TableHead className="font-semibold">Alertas</TableHead>
            <TableHead className="font-semibold">Última Verificação</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {monitors.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                Nenhum monitor encontrado
              </TableCell>
            </TableRow>
          ) : (
            monitors.map((monitor) => (
              <TableRow 
                key={monitor.id} 
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onView(monitor.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedMonitors.includes(monitor.id)}
                    onCheckedChange={() => onSelectMonitor(monitor.id)}
                    aria-label={`Selecionar monitor`}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{monitor.name || monitor.domain}</p>
                    {monitor.description && (
                      <p className="text-xs text-muted-foreground">{monitor.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{monitor.brand?.name || 'N/A'}</span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(monitor.isActive)} text-xs font-medium`}
                  >
                    {monitor.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{monitor.type || 'Web'}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{monitor.alerts?.length || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {monitor.lastCheckedAt 
                      ? new Date(monitor.lastCheckedAt).toLocaleDateString('pt-BR')
                      : 'Nunca'
                    }
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
                      <DropdownMenuItem onClick={() => onView(monitor.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(monitor)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onToggleActive(monitor.id, !monitor.isActive)}
                      >
                        {monitor.isActive ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(monitor.id)}
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
