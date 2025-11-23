import { Info, CheckCircle, AlertTriangle, XCircle, AlertOctagon } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface NotificationItemProps {
  notification: {
    id: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
    title: string;
    message: string;
    link?: string | null;
    createdAt: Date | string;
    isRead: boolean;
  };
  onMarkAsRead: (id: string) => void;
  onClick?: () => void;
}

const TYPE_ICONS = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: XCircle,
  CRITICAL: AlertOctagon,
};

const TYPE_COLORS = {
  INFO: 'text-blue-500',
  SUCCESS: 'text-green-500',
  WARNING: 'text-yellow-500',
  ERROR: 'text-red-500',
  CRITICAL: 'text-purple-500',
};

export function NotificationItem({ notification, onMarkAsRead, onClick }: NotificationItemProps) {
  const Icon = TYPE_ICONS[notification.type];

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
    onClick?.();
  };

  return (
    <div
      className={cn(
        'p-4 hover:bg-accent cursor-pointer transition-colors',
        !notification.isRead && 'bg-accent/50'
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', TYPE_COLORS[notification.type])} />
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm leading-none">{notification.title}</p>
            {!notification.isRead && (
              <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
