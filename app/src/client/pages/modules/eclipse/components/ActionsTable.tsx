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
  CheckCircle,
  Clock,
} from 'lucide-react'

interface ActionsTableProps {
  actions: any[]
  onView: (actionId: string) => void
  onEdit: (action: any) => void
  onDelete: (actionId: string) => void
  selectedActions: string[]
  onSelectAction: (actionId: string) => void
  onSelectAll: (checked: boolean) => void
}

export function ActionsTable({
  actions,
  onView,
  onEdit,
  onDelete,
  selectedActions,
  onSelectAction,
  onSelectAll,
}: ActionsTableProps) {
  const navigate = useNavigate()
  const allSelected = actions.length > 0 && selectedActions.length === actions.length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      case 'completed':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      case 'failed':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dmca_takedown':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
      case 'cease_desist':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      case 'platform_report':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      case 'legal_action':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
      case 'manual_contact':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      in_progress: 'Em Progresso',
      completed: 'Concluída',
      failed: 'Falhou',
    }
    return labels[status] || status
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      critical: 'Crítica',
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa',
    }
    return labels[priority] || priority
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      dmca_takedown: 'DMCA Takedown',
      cease_desist: 'Carta de Cessação',
      platform_report: 'Denúncia à Plataforma',
      legal_action: 'Ação Legal',
      manual_contact: 'Contato Manual',
    }
    return labels[type] || type
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
            <TableHead className="font-semibold">Tipo</TableHead>
            <TableHead className="font-semibold">Prioridade</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Infração</TableHead>
            <TableHead className="font-semibold">Atribuído a</TableHead>
            <TableHead className="font-semibold">Criada</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                Nenhuma ação encontrada
              </TableCell>
            </TableRow>
          ) : (
            actions.map((action) => (
              <TableRow 
                key={action.id} 
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onView(action.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedActions.includes(action.id)}
                    onCheckedChange={() => onSelectAction(action.id)}
                    aria-label={`Selecionar ação`}
                  />
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getTypeColor(action.actionType)} text-xs font-medium`}
                  >
                    {getTypeLabel(action.actionType)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getPriorityColor(action.priority)} text-xs font-medium`}
                  >
                    {getPriorityLabel(action.priority)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(action.status)} text-xs font-medium`}
                  >
                    {getStatusLabel(action.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{action.infringement?.title || 'N/A'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{action.assignedTo || 'Não atribuída'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {new Date(action.createdAt).toLocaleDateString('pt-BR')}
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
                      <DropdownMenuItem onClick={() => onView(action.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(action)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(action.id)}
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
