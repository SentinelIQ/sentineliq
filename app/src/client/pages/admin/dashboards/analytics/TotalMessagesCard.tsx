import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

interface TotalMessagesCardProps {
  totalMessages?: number;
  unreadCount?: number;
  isLoading?: boolean;
}

export default function TotalMessagesCard({
  totalMessages = 0,
  unreadCount = 0,
  isLoading,
}: TotalMessagesCardProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>Contact Messages</CardTitle>
        <MessageSquare className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex items-center space-x-2'>
            <div className='h-8 w-20 animate-pulse rounded bg-muted' />
          </div>
        ) : (
          <>
            <div className='text-2xl font-bold'>{totalMessages}</div>
            <p className='text-xs text-muted-foreground mt-1'>
              {unreadCount > 0 ? (
                <span className="text-blue-500 font-semibold">{unreadCount} pending</span>
              ) : (
                <span className="text-green-500">All handled</span>
              )}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
