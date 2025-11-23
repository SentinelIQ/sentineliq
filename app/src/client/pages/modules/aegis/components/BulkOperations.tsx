import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { 
  CheckSquare, 
  Square, 
  X, 
  CheckCircle, 
  UserPlus, 
  Tag, 
  Download,
  Trash2,
  AlertTriangle,
  Merge
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';

interface BulkOperationsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onMerge?: () => void;
  onClose?: () => void;
  onAssign?: () => void;
  onTag?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  onEscalate?: () => void;
  customActions?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }[];
}

export function BulkOperationsBar({
  selectedCount,
  onClearSelection,
  onMerge,
  onClose,
  onAssign,
  onTag,
  onExport,
  onDelete,
  onEscalate,
  customActions = []
}: BulkOperationsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          <span className="font-semibold">
            {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="h-6 w-px bg-primary-foreground/20" />

        <div className="flex items-center gap-2">
          {onMerge && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onMerge}
              disabled={selectedCount < 2}
            >
              <Merge className="w-4 h-4 mr-2" />
              Merge
            </Button>
          )}

          {onClose && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Close
            </Button>
          )}

          {onAssign && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onAssign}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Assign
            </Button>
          )}

          {onTag && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onTag}
            >
              <Tag className="w-4 h-4 mr-2" />
              Tag
            </Button>
          )}

          {onEscalate && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onEscalate}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Escalate
            </Button>
          )}

          {customActions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
              size="sm"
              onClick={action.onClick}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onExport && (
                <DropdownMenuItem onClick={onExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="ml-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SelectableCardProps {
  selected: boolean;
  onToggleSelect: () => void;
  children: React.ReactNode;
  className?: string;
}

export function SelectableCard({ selected, onToggleSelect, children, className = '' }: SelectableCardProps) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute top-4 left-4 z-10 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
      >
        {selected ? (
          <CheckSquare className="w-5 h-5 text-primary" />
        ) : (
          <Square className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
        )}
      </div>
      <div className={`${selected ? 'ring-2 ring-primary' : ''} transition-all`}>
        {children}
      </div>
    </div>
  );
}
