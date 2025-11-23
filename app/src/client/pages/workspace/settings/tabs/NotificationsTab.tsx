import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getNotifications, markAsRead, markAllAsRead } from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { NotificationItem } from '../../../../components/notifications/NotificationItem';
import { CheckCheck } from 'lucide-react';

export default function NotificationsTab() {
  const [type, setType] = useState<string | undefined>(undefined);
  const [isRead, setIsRead] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, error, refetch } = useQuery(getNotifications, {
    type: type as any,
    isRead,
    limit: pageSize,
    offset: page * pageSize,
  });

  const notifications = data?.notifications || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead({ id });
      refetch();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({});
      refetch();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handlePrevPage = () => setPage((p) => Math.max(0, p - 1));
  const handleNextPage = () => setPage((p) => p + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated with all activities in your workspace
          </p>
        </div>
        {notifications.some((n: any) => !n.isRead) && (
          <Button onClick={handleMarkAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter notifications by type and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={type || 'all'} onValueChange={(v) => setType(v === 'all' ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={isRead === undefined ? 'all' : isRead ? 'read' : 'unread'}
                onValueChange={(v) => setIsRead(v === 'all' ? undefined : v === 'read')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setType(undefined);
                  setIsRead(undefined);
                  setPage(0);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Notifications ({total} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading notifications...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error loading notifications: {error.message}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notifications found
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: any) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && notifications.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {page * pageSize + 1} - {page * pageSize + notifications.length} of {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
