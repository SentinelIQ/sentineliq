import { useQuery } from 'wasp/client/operations';
import { getWorkspaceAnalytics } from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Users, 
  Activity, 
  Bell, 
  UserPlus, 
  TrendingUp, 
  TrendingDown,
  Shield,
  Smartphone,
  Palette,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export default function WorkspaceAnalyticsPage() {
  const { data: analytics, isLoading, error } = useQuery(getWorkspaceAnalytics);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <EmptyState
          icon={<Activity className="h-16 w-16" />}
          title="Unable to load analytics"
          description={error.message || 'Please try again later'}
        />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto py-8 px-4">
        <EmptyState
          icon={<Activity className="h-16 w-16" />}
          title="No analytics available"
          description="Analytics will appear once your workspace has activity"
        />
      </div>
    );
  }

  const renderTrendIndicator = (value: number) => {
    if (value > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">+{value}%</span>
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm font-medium">{value}%</span>
        </div>
      );
    }
    return (
      <span className="text-sm text-muted-foreground">No change</span>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Workspace Analytics</h1>
        <p className="text-muted-foreground">
          Overview of {analytics.workspace.name} activity and usage
        </p>
      </div>

      {/* Workspace Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{analytics.workspace.plan}</div>
            <p className="text-xs text-muted-foreground">
              Since {new Date(analytics.workspace.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.workspace.memberCount}</div>
            <div className="flex items-center gap-2 mt-1">
              {renderTrendIndicator(analytics.trends.memberGrowth)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.workspace.activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((analytics.workspace.activeMembers / analytics.workspace.memberCount) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.activity.lastActivity 
                ? formatDistanceToNow(new Date(analytics.activity.lastActivity), { addSuffix: true })
                : 'Never'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Metrics */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Activity Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activity.activeToday}</div>
              <p className="text-xs text-muted-foreground">Actions today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activity.activeThisWeek}</div>
              <p className="text-xs text-muted-foreground">Actions this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activity.activeThisMonth}</div>
              <div className="flex items-center gap-2 mt-1">
                {renderTrendIndicator(analytics.trends.activityGrowth)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Usage Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.usage.totalNotifications}</div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  {analytics.usage.readNotifications} read
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-yellow-500" />
                  {analytics.usage.unreadNotifications} unread
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {renderTrendIndicator(analytics.trends.notificationGrowth)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invitations</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.usage.totalInvitations}</div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  {analytics.usage.acceptedInvitations} accepted
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-yellow-500" />
                  {analytics.usage.pendingInvitations} pending
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feature Adoption */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Feature Adoption</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Branding</CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.features.brandingEnabled ? 'Enabled' : 'Disabled'}
              </div>
              <p className="text-xs text-muted-foreground">
                Custom workspace branding
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">2FA Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.features.twoFactorEnabled}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((analytics.features.twoFactorEnabled / analytics.workspace.memberCount) * 100)}% of members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Push Notifications</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.features.pushNotificationsEnabled}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((analytics.features.pushNotificationsEnabled / analytics.workspace.memberCount) * 100)}% of members
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
