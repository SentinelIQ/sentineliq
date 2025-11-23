import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface DeleteWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceName: string;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteWorkspaceDialog({
  open,
  onOpenChange,
  workspaceName,
  onDelete,
  isDeleting,
}: DeleteWorkspaceDialogProps) {
  const { t } = useTranslation('workspace');
  const { t: tCommon } = useTranslation('common');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('delete.title')}</DialogTitle>
          <DialogDescription>
            {t('delete.confirmMessage')} <strong>{workspaceName}</strong>?
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('delete.permanentWarning')}
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {tCommon('actions.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? t('delete.deleting') : t('delete.button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
