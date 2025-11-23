import { ReactNode } from 'react';
import { Button } from '../../../../components/ui/button';
import { cn } from '../../../../../lib/utils';

interface AegisEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function AegisEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: AegisEmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center py-12 px-4',
      className
    )}>
      <div className="mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
