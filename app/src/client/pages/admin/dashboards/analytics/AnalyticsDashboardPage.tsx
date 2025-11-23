import { type AuthUser } from 'wasp/auth';
import { getDailyStats, getNotificationCount, getSystemLogCount, getContactMessagesCount, useQuery } from 'wasp/client/operations';
import { cn } from '../../../../../lib/utils';
import DefaultLayout from '../../layout/DefaultLayout';
import RevenueAndProfitChart from './RevenueAndProfitChart';
import SourcesTable from './SourcesTable';
import TotalPageViewsCard from './TotalPageViewsCard';
import TotalPayingUsersCard from './TotalPayingUsersCard';
import TotalRevenueCard from './TotalRevenueCard';
import TotalSignupsCard from './TotalSignupsCard';
import TotalNotificationsCard from './TotalNotificationsCard';
import TotalLogsCard from './TotalLogsCard';
import TotalMessagesCard from './TotalMessagesCard';
import QuickLinksCard from './QuickLinksCard';

const Dashboard = ({ user }: { user: AuthUser }) => {
  const { data: stats, isLoading, error } = useQuery(getDailyStats);
  const { data: notificationStats } = useQuery(getNotificationCount);
  const { data: logStats } = useQuery(getSystemLogCount);
  const { data: messageStats } = useQuery(getContactMessagesCount);

  if (error) {
    return (
      <DefaultLayout user={user}>
        <div className='flex h-full items-center justify-center'>
          <div className='rounded-lg bg-card p-8 shadow-lg'>
            <p className='text-2xl font-bold text-red-500'>Error</p>
            <p className='mt-2 text-sm text-muted-foreground'>
              {error.message || 'Something went wrong while fetching stats.'}
            </p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout user={user}>
      <div className='relative'>
        <div
          className={cn({
            'opacity-25': !stats,
          })}
        >
          {/* First Row - Main Metrics */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5'>
            <TotalPageViewsCard
              totalPageViews={stats?.dailyStats.totalViews}
              prevDayViewsChangePercent={stats?.dailyStats.prevDayViewsChangePercent}
            />
            <TotalRevenueCard
              dailyStats={stats?.dailyStats}
              weeklyStats={stats?.weeklyStats}
              isLoading={isLoading}
            />
            <TotalPayingUsersCard dailyStats={stats?.dailyStats} isLoading={isLoading} />
            <TotalSignupsCard dailyStats={stats?.dailyStats} isLoading={isLoading} />
          </div>

          {/* Second Row - System Metrics */}
          <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 2xl:gap-7.5'>
            <TotalNotificationsCard
              totalNotifications={notificationStats?.total || 0}
              unreadCount={notificationStats?.unread || 0}
              isLoading={isLoading}
            />
            <TotalLogsCard
              totalLogs={logStats?.total || 0}
              criticalCount={logStats?.byLevel?.ERROR || 0}
              isLoading={isLoading}
            />
            <TotalMessagesCard
              totalMessages={messageStats?.total || 0}
              unreadCount={messageStats?.unread || 0}
              isLoading={isLoading}
            />
          </div>

          <div className='mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5'>
            <RevenueAndProfitChart weeklyStats={stats?.weeklyStats} isLoading={isLoading} />

            <QuickLinksCard />
          </div>

          <div className='mt-4 grid grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5'>
            <div className='col-span-12'>
              <SourcesTable sources={stats?.dailyStats?.sources} />
            </div>
          </div>
        </div>

        {!stats && (
          <div className='absolute inset-0 flex items-start justify-center bg-background/50'>
            <div className='rounded-lg bg-card p-8 shadow-lg'>
              <p className='text-2xl font-bold text-foreground'>No daily stats generated yet</p>
              <p className='mt-2 text-sm text-muted-foreground'>
                Stats will appear here once the daily stats job has run
              </p>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default Dashboard;
