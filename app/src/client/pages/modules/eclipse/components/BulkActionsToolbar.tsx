import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, User, Tag, Download, ArrowUpCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../components/ui/dialog';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { useToast } from '../../../../hooks/useToast';
import { useQuery, getWorkspaceMembers, bulkUpdateAlerts, bulkUpdateInfringements, bulkUpdateActions } from 'wasp/client/operations';
import {
  exportAlertsToCSV,
  exportInfringementsToCSV,
  exportActionsToCSV,
  downloadCSV,
} from '../../../../../core/modules/eclipse/export';

interface BulkActionsToolbarProps {
  resourceType: 'alerts' | 'infringements' | 'actions';
  workspaceId: string;
  selectedIds: string[];
  allData?: any[];
  onClearSelection?: () => void;
  onActionComplete?: () => void;
}

export function BulkActionsToolbar({
  resourceType,
  workspaceId,
  selectedIds,
  allData,
  onClearSelection,
  onActionComplete,
}: BulkActionsToolbarProps) {
  const { toast } = useToast();
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // State para bulk updates
  const [assignedTo, setAssignedTo] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [severity, setSeverity] = useState('');
  const [tags, setTags] = useState('');

  const { data: membersData } = useQuery(getWorkspaceMembers, { workspaceId });
  const members = membersData || [];

  if (selectedIds.length === 0) {
    return null;
  }

  const handleOpenActionDialog = (action: string) => {
    setCurrentAction(action);
    setActionDialogOpen(true);
  };

  const handleBulkExport = () => {
    try {
      const selectedData = allData?.filter((item: any) => selectedIds.includes(item.id)) || [];

      if (selectedData.length === 0) {
        toast.error('Nenhum item selecionado para exportar');
        return;
      }

      let csvContent: string;
      let filename: string;

      switch (resourceType) {
        case 'alerts':
          csvContent = exportAlertsToCSV(selectedData);
          filename = `alertas-selecionados-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'infringements':
          csvContent = exportInfringementsToCSV(selectedData);
          filename = `infracoes-selecionadas-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'actions':
          csvContent = exportActionsToCSV(selectedData);
          filename = `acoes-selecionadas-${new Date().toISOString().split('T')[0]}.csv`;
          break;
      }

      downloadCSV(csvContent, filename);
      toast.success(`${selectedIds.length} itens exportados`);
    } catch (error: any) {
      toast.error('Erro ao exportar: ' + error.message);
    }
  };

  const handleBulkAction = async () => {
    setIsProcessing(true);
    try {
      let result: any;

      switch (resourceType) {
        case 'alerts':
          if (currentAction === 'acknowledge' || currentAction === 'dismiss') {
            result = await bulkUpdateAlerts({
              workspaceId,
              alertIds: selectedIds,
              action: currentAction as 'acknowledge' | 'dismiss' | 'escalate',
            });
          }
          break;

        case 'infringements':
          const infringementUpdates: any = {};
          if (status) infringementUpdates.status = status;
          if (severity) infringementUpdates.severity = severity;
          if (tags) infringementUpdates.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);

          result = await bulkUpdateInfringements({
            workspaceId,
            infringementIds: selectedIds,
            updates: infringementUpdates,
          });
          break;

        case 'actions':
          const actionUpdates: any = {};
          if (assignedTo) actionUpdates.assignedTo = assignedTo;
          if (status) actionUpdates.status = status;
          if (priority) actionUpdates.priority = priority;
          if (tags) actionUpdates.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);

          result = await bulkUpdateActions({
            workspaceId,
            actionIds: selectedIds,
            updates: actionUpdates,
          });
          break;
      }

      if (result) {
        if (result.success > 0) {
          toast.success(`${result.success} itens atualizados com sucesso`);
        }
        if (result.failed > 0) {
          toast.error(`${result.failed} itens falharam`);
        }

        onActionComplete?.();
        onClearSelection?.();
      }

      setActionDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Erro ao executar ação: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setAssignedTo('');
    setStatus('');
    setPriority('');
    setSeverity('');
    setTags('');
  };

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-blue-700">
            {selectedIds.length} selecionado{selectedIds.length > 1 ? 's' : ''}
          </Badge>
          {onClearSelection && (
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              <XCircle className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Export */}
          <Button variant="outline" size="sm" onClick={handleBulkExport}>
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>

          {/* Ações específicas por tipo */}
          {resourceType === 'alerts' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenActionDialog('acknowledge')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Reconhecer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenActionDialog('dismiss')}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Descartar
              </Button>
            </>
          )}

          {resourceType === 'infringements' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenActionDialog('update_status')}
              >
                <ArrowUpCircle className="h-4 w-4 mr-1" />
                Alterar Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenActionDialog('add_tags')}
              >
                <Tag className="h-4 w-4 mr-1" />
                Tags
              </Button>
            </>
          )}

          {resourceType === 'actions' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenActionDialog('reassign')}
              >
                <User className="h-4 w-4 mr-1" />
                Reatribuir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenActionDialog('update_priority')}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Prioridade
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Dialog de Ação */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Ação em Massa
            </DialogTitle>
            <DialogDescription>
              Esta ação será aplicada a {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Reassign (Actions) */}
            {currentAction === 'reassign' && (
              <div className="space-y-2">
                <Label>Atribuir para</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um membro" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member: any) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.user?.email || member.userId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Update Priority (Actions) */}
            {currentAction === 'update_priority' && (
              <div className="space-y-2">
                <Label>Nova Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Update Status (Infringements) */}
            {currentAction === 'update_status' && (
              <div className="space-y-2">
                <Label>Novo Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="investigating">Investigando</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                    <SelectItem value="false_positive">Falso Positivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Add Tags */}
            {currentAction === 'add_tags' && (
              <div className="space-y-2">
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  placeholder="urgente, revisar, phishing"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            )}

            {/* Acknowledge/Dismiss (Alerts) */}
            {(currentAction === 'acknowledge' || currentAction === 'dismiss') && (
              <div className="text-sm text-muted-foreground">
                Tem certeza que deseja {currentAction === 'acknowledge' ? 'reconhecer' : 'descartar'}{' '}
                {selectedIds.length} alerta{selectedIds.length > 1 ? 's' : ''}?
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBulkAction} disabled={isProcessing}>
              {isProcessing ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
