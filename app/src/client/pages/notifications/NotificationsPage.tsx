import { useState, useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  deleteAllNotifications 
} from 'wasp/client/operations';
import useWorkspace from '../../hooks/useWorkspace';
import useNotifications from '../../hooks/useNotifications';
import { NotificationItem } from '../../components/notifications/NotificationItem';
import { Button } from '../../components/ui/button';
import { 
  CheckCheck, 
  Trash2, 
  Filter, 
  Loader2, 
  RefreshCw,
  Bell,
  BellOff,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const ITEMS_PER_PAGE = 20;

type NotificationType = 'ALL' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
type ReadFilter = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const { currentWorkspace } = useWorkspace();
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<NotificationType>('ALL');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');

  // WebSocket for real-time updates
  const { 
    unreadCount, 
    isConnected, 
    error: wsError,
    reconnect,
  } = useNotifications();

  // Fetch notifications with filters
  const { data, isLoading, refetch } = useQuery(getNotifications, {
    workspaceId: currentWorkspace?.id,
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
    isRead: readFilter === 'all' ? undefined : readFilter === 'read',
    limit: ITEMS_PER_PAGE,
    offset: page * ITEMS_PER_PAGE,
  });

  const notifications = data?.notifications || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Show WebSocket connection error
  useEffect(() => {
    if (wsError) {
      toast.error(`Real-time updates unavailable: ${wsError}`);
    }
  }, [wsError]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [typeFilter, readFilter, currentWorkspace?.id]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead({ id });
      refetch();
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({ workspaceId: currentWorkspace?.id });
      refetch();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification({ id });
      refetch();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteAllNotifications({ workspaceId: currentWorkspace?.id });
      refetch();
      toast.success('All notifications deleted');
    } catch (error) {
      toast.error('Failed to delete notifications');
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Bell className="h-8 w-8" />
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with your workspace activities
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                Live updates
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={reconnect}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reconnect
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
            <div className="text-sm text-muted-foreground">Unread</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{total - unreadCount}</div>
            <div className="text-sm text-muted-foreground">Read</div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-card border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select value={readFilter} onValueChange={(value) => setReadFilter(value as ReadFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread only</SelectItem>
              <SelectItem value="read">Read only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as NotificationType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAll}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete all
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
            <BellOff className="h-12 w-12 opacity-50" />
            <div>
              <p className="font-medium">No notifications</p>
              <p className="text-sm mt-1">
                {readFilter === 'unread' ? "You're all caught up!" : 'No notifications to display'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification: any) => (
              <div key={notification.id} className="relative group">
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotification(notification.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {page * ITEMS_PER_PAGE + 1} to {Math.min((page + 1) * ITEMS_PER_PAGE, total)} of {total} notifications
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <div className="text-sm">
              Page {page + 1} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
