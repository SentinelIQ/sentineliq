import { CheckCircle, Clock, AlertTriangle, Shield } from 'lucide-react';
import { cn } from '../../../../../lib/utils';

interface TimelineEvent {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description?: string;
  timestamp: string;
  user?: string;
  metadata?: Record<string, any>;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const getIcon = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'error':
      return <Shield className="w-5 h-5 text-red-500" />;
    case 'info':
    default:
      return <Clock className="w-5 h-5 text-blue-500" />;
  }
};

const getColor = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'success':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'error':
      return 'bg-red-500';
    case 'info':
    default:
      return 'bg-blue-500';
  }
};

export function Timeline({ events, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {events.map((event, index) => (
        <div key={event.id} className="relative pb-8 last:pb-0">
          {/* Vertical line */}
          {index < events.length - 1 && (
            <div className="absolute left-6 top-10 h-full w-0.5 bg-border" />
          )}

          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn(
              'relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-background',
              getColor(event.type)
            )}>
              {getIcon(event.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1.5">
              <div className="flex items-start justify-between gap-4 mb-1">
                <h4 className="font-semibold text-foreground">{event.title}</h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(event.timestamp).toLocaleString('pt-BR')}
                </span>
              </div>

              {event.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {event.description}
                </p>
              )}

              {event.user && (
                <p className="text-xs text-muted-foreground">
                  Por: <span className="font-medium">{event.user}</span>
                </p>
              )}

              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-1">
                  {Object.entries(event.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
