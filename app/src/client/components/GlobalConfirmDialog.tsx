import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { useConfirmStore } from '../hooks/useConfirm';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

export function GlobalConfirmDialog() {
  const { isOpen, options, handleConfirm, handleCancel } = useConfirmStore();

  if (!options) return null;

  const variantConfig = {
    default: {
      icon: <Info className="h-6 w-6 text-blue-500" />,
      actionClassName: '',
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
      actionClassName: 'bg-yellow-600 hover:bg-yellow-700',
    },
    destructive: {
      icon: <AlertCircle className="h-6 w-6 text-red-500" />,
      actionClassName: 'bg-red-600 hover:bg-red-700',
    },
  };

  const config = variantConfig[options.variant || 'default'];

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {config.icon}
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
          </div>
          {options.description && (
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {options.cancelText || 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={config.actionClassName}
          >
            {options.confirmText || 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
