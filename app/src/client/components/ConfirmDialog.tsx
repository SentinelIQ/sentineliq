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
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | ReactNode;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

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
      actionClassName: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    },
  };

  const config = variantConfig[variant];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {config.icon}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={config.actionClassName}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
