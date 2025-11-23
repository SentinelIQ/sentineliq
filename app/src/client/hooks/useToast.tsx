import { toast as sonnerToast } from 'sonner';

interface ToastActions {
  toast: typeof sonnerToast;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
}

export const useToast = (): ToastActions => {
  return {
    toast: sonnerToast,
    success: (message: string, description?: string) => {
      sonnerToast.success(message, { description });
    },
    error: (message: string, description?: string) => {
      sonnerToast.error(message, { description });
    },
    info: (message: string, description?: string) => {
      sonnerToast.info(message, { description });
    },
    warning: (message: string, description?: string) => {
      sonnerToast.warning(message, { description });
    },
  };
};

// Re-export toast for direct use
export { sonnerToast as toast };
