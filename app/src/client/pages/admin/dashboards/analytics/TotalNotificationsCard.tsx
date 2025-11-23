import { Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

interface TotalNotificationsCardProps {
  totalNotifications?: number;
  unreadCount?: number;
  isLoading?: boolean;
}

export default function TotalNotificationsCard({
  totalNotifications = 0,
  unreadCount = 0,
  isLoading,
}: TotalNotificationsCardProps) {
  const unreadPercentage = totalNotifications > 0 
    ? Math.round((unreadCount / totalNotifications) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>Total Notifications</CardTitle>
        <Bell className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex items-center space-x-2'>
            <div className='h-8 w-20 animate-pulse rounded bg-muted' />
          </div>
        ) : (
          <>
            <div className='text-2xl font-bold'>{totalNotifications}</div>
            <p className='text-xs text-muted-foreground mt-1'>
              {unreadCount} unread ({unreadPercentage}%)
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
