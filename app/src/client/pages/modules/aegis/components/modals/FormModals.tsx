/**
 * Form Modal Wrapper - Reusable modal/dialog components for forms
 *
 * Provides consistent modal interfaces for all form components
 * with proper state management and error handling.
 */

import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../../../components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../../../../../components/ui/drawer';
import { Button } from '../../../../../components/ui/button';
import { ScrollArea } from '../../../../../components/ui/scroll-area';
import { useMediaQuery } from '../../../../../hooks/useMediaQuery';

interface FormModalProps {
  children: ReactNode;
  trigger: ReactNode;
  title: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

interface FormDrawerProps {
  children: ReactNode;
  trigger: ReactNode;
  title: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'left' | 'right' | 'top' | 'bottom';
}

interface ResponsiveFormDialogProps {
  children: ReactNode;
  trigger: ReactNode;
  title: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * Desktop Modal Component
 */
export function FormModal({
  children,
  trigger,
  title,
  description,
  open,
  onOpenChange,
  size = 'lg',
}: FormModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[95vh]',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={`${sizeClasses[size]} ${size === 'full' ? 'p-0' : ''}`}
      >
        <DialogHeader className={size === 'full' ? 'p-6 border-b' : ''}>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {size === 'full' ? (
          <ScrollArea className="flex-1 p-6">{children}</ScrollArea>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto">{children}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Mobile/Tablet Drawer Component
 */
export function FormDrawer({
  children,
  trigger,
  title,
  description,
  open,
  onOpenChange,
  side = 'right',
}: FormDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent
        className={`${side === 'right' || side === 'left' ? 'h-full max-w-[400px]' : ''} ${
          side === 'right' ? 'ml-auto' : side === 'left' ? 'mr-auto' : ''
        }`}
      >
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {description && (
            <DrawerDescription>{description}</DrawerDescription>
          )}
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4">{children}</ScrollArea>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/**
 * Responsive Form Dialog - Auto-switches between Modal and Drawer
 */
export function ResponsiveFormDialog({
  children,
  trigger,
  title,
  description,
  open,
  onOpenChange,
  size = 'lg',
}: ResponsiveFormDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <FormModal
        trigger={trigger}
        title={title}
        description={description}
        open={open}
        onOpenChange={onOpenChange}
        size={size}
      >
        {children}
      </FormModal>
    );
  }

  return (
    <FormDrawer
      trigger={trigger}
      title={title}
      description={description}
      open={open}
      onOpenChange={onOpenChange}
      side="bottom"
    >
      {children}
    </FormDrawer>
  );
}

/**
 * Quick Form Modal - For simple/quick creation forms
 */
export function QuickFormModal({
  children,
  trigger,
  title,
  description,
  open,
  onOpenChange,
}: Omit<FormModalProps, 'size'>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Full Screen Form Modal - For complex forms with multiple steps
 */
export function FullScreenFormModal({
  children,
  trigger,
  title,
  description,
  open,
  onOpenChange,
}: Omit<FormModalProps, 'size'>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0 gap-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="flex flex-row items-center justify-between p-6 border-b shrink-0">
            <div>
              <DialogTitle className="text-xl">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange?.(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-6">{children}</div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Side Panel Form - For forms that need to stay open while viewing data
 */
export function SidePanelForm({
  children,
  trigger,
  title,
  description,
  open,
  onOpenChange,
  side = 'right',
}: FormDrawerProps) {
  return (
    <div
      className={`fixed inset-y-0 z-50 ${
        side === 'right' ? 'right-0' : 'left-0'
      } w-96 transform transition-transform duration-300 ease-in-out ${
        open
          ? 'translate-x-0'
          : side === 'right'
          ? 'translate-x-full'
          : '-translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col bg-background border-l shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange?.(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">{children}</ScrollArea>
      </div>
    </div>
  );
}

/**
 * Modal State Manager Hook
 */
export function useModalState(initialOpen = false) {
  const [open, setOpen] = React.useState(initialOpen);

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);
  const toggleModal = () => setOpen(!open);

  return {
    open,
    setOpen,
    openModal,
    closeModal,
    toggleModal,
  };
}
