import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

interface TotalLogsCardProps {
  totalLogs?: number;
  criticalCount?: number;
  isLoading?: boolean;
}

export default function TotalLogsCard({
  totalLogs = 0,
  criticalCount = 0,
  isLoading,
}: TotalLogsCardProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>System Logs</CardTitle>
        <FileText className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex items-center space-x-2'>
            <div className='h-8 w-20 animate-pulse rounded bg-muted' />
          </div>
        ) : (
          <>
            <div className='text-2xl font-bold'>{totalLogs}</div>
            <p className='text-xs text-muted-foreground mt-1'>
              {criticalCount > 0 ? (
                <span className="text-red-500 font-semibold">{criticalCount} critical</span>
              ) : (
                <span className="text-green-500">No critical issues</span>
              )}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
