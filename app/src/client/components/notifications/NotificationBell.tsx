import { useState, useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getUnreadCount } from 'wasp/client/operations';
import { Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { NotificationList } from './NotificationList';

export function NotificationBell() {
  const { data: unreadCount, refetch } = useQuery(getUnreadCount);
  const [isOpen, setIsOpen] = useState(false);

  // Refetch count periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <NotificationList
          onNotificationClick={() => setIsOpen(false)}
          onMarkAllRead={() => refetch()}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
