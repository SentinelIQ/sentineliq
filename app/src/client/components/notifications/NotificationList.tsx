import { useEffect, useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getNotifications, markAsRead, markAllAsRead } from 'wasp/client/operations';
import { NotificationItem } from './NotificationItem';
import { Button } from '../ui/button';
import { CheckCheck, Loader2, RefreshCw } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications';
import { toast } from 'sonner';

interface NotificationListProps {
  onNotificationClick?: () => void;
  onMarkAllRead?: () => void;
}

export function NotificationList({ onNotificationClick, onMarkAllRead }: NotificationListProps) {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  const { data, isLoading, refetch } = useQuery(getNotifications, {
    isRead: showUnreadOnly ? false : undefined,
    limit: 10,
  });

  // Use WebSocket hook for real-time updates
  const { 
    notifications: realtimeNotifications, 
    unreadCount, 
    isConnected, 
    error: wsError,
    reconnect,
  } = useNotifications();

  const notifications = data?.notifications || [];

  // Show WebSocket connection error
  useEffect(() => {
    if (wsError) {
      toast.error(`Notification updates: ${wsError}`);
    }
  }, [wsError]);

  // Refetch when new notifications arrive via WebSocket
  useEffect(() => {
    if (realtimeNotifications.length > 0) {
      refetch();
    }
  }, [realtimeNotifications.length, refetch]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead({ id });
      refetch();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({});
      refetch();
      onMarkAllRead?.();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  return (
    <div className="flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
          {!isConnected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reconnect}
              className="h-6 w-6 p-0"
              title="Reconnect to real-time updates"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="h-8"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
        <Button
          variant={!showUnreadOnly ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setShowUnreadOnly(false)}
          className="h-7 text-xs"
        >
          All
        </Button>
        <Button
          variant={showUnreadOnly ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setShowUnreadOnly(true)}
          className="h-7 text-xs"
        >
          Unread
        </Button>
        <div className="flex-1" />
        {isConnected && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification: any) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onClick={onNotificationClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t text-center">
          <Button
            variant="link"
            size="sm"
            className="text-sm"
            onClick={() => {
              window.location.href = '/notifications';
              onNotificationClick?.();
            }}
          >
            View all notifications
          </Button>
        </div>
      )}
    </div>
  );
}
