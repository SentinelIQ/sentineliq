import { create } from 'zustand';
import { ReactNode } from 'react';

export type ConfirmVariant = 'default' | 'destructive' | 'warning';

interface ConfirmOptions {
  title: string;
  description?: string | ReactNode;
  variant?: ConfirmVariant;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: null,
  resolve: null,

  confirm: (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        options: {
          variant: 'default',
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          ...options,
        },
        resolve,
      });
    });
  },

  handleConfirm: () => {
    const { resolve } = get();
    if (resolve) resolve(true);
    set({ isOpen: false, options: null, resolve: null });
  },

  handleCancel: () => {
    const { resolve } = get();
    if (resolve) resolve(false);
    set({ isOpen: false, options: null, resolve: null });
  },
}));

export const useConfirm = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  return { confirm };
};
