import { useQuery, getCurrentWorkspace, getUnreadCount } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Users, Settings, BarChart3, Building2, Bell, Shield, Webhook } from 'lucide-react';
import { WorkspaceLayout } from './workspace/WorkspaceLayout';

export default function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const { data: workspace, isLoading } = useQuery(getCurrentWorkspace);
  const { data: unreadCount } = useQuery(getUnreadCount);

  useEffect(() => {
    if (!isLoading && !workspace) {
      // No active workspace, redirect to selector
      navigate('/workspaces');
    }
    }, [workspace, isLoading, navigate]);  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('common:status.loading')}</div>
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  const quickActions = [
    {
      title: t('dashboard:quickActions.viewReports'),
      description: t('dashboard:quickActions.viewReports'),
      icon: BarChart3,
      href: '/modules',
      badge: null,
    },
    {
      title: t('dashboard:notifications.title'),
      description: t('dashboard:notifications.noNotifications'),
      icon: Bell,
      href: '/workspace/settings?tab=notifications',
      badge: unreadCount && unreadCount > 0 ? `${unreadCount} ${t('common:status.pending')}` : null,
    },
    {
      title: t('workspace:settings.audit', 'Audit Logs'),
      description: t('dashboard:recentActivity.title'),
      icon: Shield,
      href: '/workspace/settings?tab=audit',
      badge: null,
    },
    {
      title: 'Team Members',
      description: t('dashboard:quickActions.inviteUsers'),
      icon: Users,
      href: '/workspace/members',
      badge: workspace.userRole,
    },
    {
      title: 'Notification Providers',
      description: t('common:navigation.settings'),
      icon: Webhook,
      href: '/workspace/settings?tab=providers',
      badge: null,
    },
    {
      title: t('common:navigation.settings'),
      description: t('dashboard:quickActions.manageSettings'),
      icon: Settings,
      href: '/workspace/settings',
      badge: null,
    },
  ];

  return (
    <WorkspaceLayout>
      <div className="w-full">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border">
          <div className="w-full px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{workspace.name}</h1>
              <p className="text-muted-foreground">
                {workspace.description || 'No description provided'}
              </p>
            </div>
            <Badge variant="secondary" className="h-fit">
              {workspace.userRole}
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="w-full px-8 py-8">

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">{t('dashboard:quickActions.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Card
              key={action.href}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(action.href)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <action.icon className="w-8 h-8 text-primary mb-2" />
                  {action.badge && (
                    <Badge variant="outline">{action.badge}</Badge>
                  )}
                </div>
                <CardTitle>{String(action.title)}</CardTitle>
                <CardDescription>{String(action.description)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard:welcome', { name: workspace.name })} 👋</CardTitle>
          <CardDescription>
            {t('dashboard:overview.title')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">
                Workspace ID: <code className="text-xs bg-muted px-2 py-1 rounded">{workspace.id}</code>
              </span>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/modules')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                {t('dashboard:quickActions.viewReports')}
              </Button>
              <Button variant="outline" onClick={() => navigate('/workspace/members')}>
                <Users className="w-4 h-4 mr-2" />
                {t('dashboard:quickActions.inviteUsers')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
