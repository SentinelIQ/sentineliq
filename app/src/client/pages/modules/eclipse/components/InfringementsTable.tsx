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
} from 'lucide-react'

interface InfringementsTableProps {
  infringements: any[]
  onView: (infringementId: string) => void
  onEdit: (infringement: any) => void
  onDelete: (infringementId: string) => void
  selectedInfringements: string[]
  onSelectInfringement: (infringementId: string) => void
  onSelectAll: (checked: boolean) => void
}

export function InfringementsTable({
  infringements,
  onView,
  onEdit,
  onDelete,
  selectedInfringements,
  onSelectInfringement,
  onSelectAll,
}: InfringementsTableProps) {
  const navigate = useNavigate()
  const allSelected = infringements.length > 0 && selectedInfringements.length === infringements.length

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
      case 'open':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      case 'resolved':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      case 'closed':
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'counterfeiting':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
      case 'piracy':
        return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20'
      case 'unauthorized_seller':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
      case 'domain_squatting':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
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
      open: 'Aberta',
      in_progress: 'Em Progresso',
      resolved: 'Resolvida',
      closed: 'Fechada',
    }
    return labels[status] || status
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      counterfeiting: 'Falsificação',
      piracy: 'Pirataria',
      unauthorized_seller: 'Vendedor não Autorizado',
      domain_squatting: 'Roubo de Domínio',
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
            <TableHead className="font-semibold">Título</TableHead>
            <TableHead className="font-semibold">Tipo</TableHead>
            <TableHead className="font-semibold">Severidade</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Marca</TableHead>
            <TableHead className="font-semibold">Detectada</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {infringements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                Nenhuma infração encontrada
              </TableCell>
            </TableRow>
          ) : (
            infringements.map((infringement) => (
              <TableRow 
                key={infringement.id} 
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onView(infringement.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedInfringements.includes(infringement.id)}
                    onCheckedChange={() => onSelectInfringement(infringement.id)}
                    aria-label={`Selecionar infração`}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium max-w-xs truncate">{infringement.title || 'Sem título'}</p>
                    {infringement.url && (
                      <a
                        href={infringement.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline truncate block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {new URL(infringement.url).hostname}
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getTypeColor(infringement.type)} text-xs font-medium`}
                  >
                    {getTypeLabel(infringement.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getSeverityColor(infringement.severity)} text-xs font-medium`}
                  >
                    {getSeverityLabel(infringement.severity)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(infringement.status)} text-xs font-medium`}
                  >
                    {getStatusLabel(infringement.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{infringement.brand?.name || 'N/A'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {new Date(infringement.createdAt).toLocaleDateString('pt-BR')}
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
                      <DropdownMenuItem onClick={() => onView(infringement.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(infringement)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(infringement.id)}
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
