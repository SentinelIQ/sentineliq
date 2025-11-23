/**
 * Database Management Page
 * 
 * Admin interface for database operations:
 * - Backups management
 * - Disaster recovery testing
 * - Read replica health
 * - Slow query monitoring
 * - Connection pool load testing
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'wasp/client/operations';
import {
  getBackupList,
  getBackupStats,
  triggerManualBackup,
  getRecoveryPoints,
  testDisasterRecovery,
  getSlowQueryStats,
  resetSlowQueryStats,
  runConnectionPoolLoadTest,
  testConnectionLimits,
} from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import {
  Database,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  HardDrive,
  Zap,
  Clock,
  TrendingUp,
  Server,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DatabaseManagementPage() {
  const { t } = useTranslation('admin');
  const [isTestingRecovery, setIsTestingRecovery] = useState(false);
  const [isRunningLoadTest, setIsRunningLoadTest] = useState(false);

  const { data: backups, isLoading: backupsLoading, refetch: refetchBackups } = useQuery(getBackupList);
  const { data: backupStats } = useQuery(getBackupStats);
  const { data: slowQueryStats } = useQuery(getSlowQueryStats);

  const handleManualBackup = async () => {
    try {
      toast.loading('Creating backup...');
      const result = await triggerManualBackup();
      
      if (result.success) {
        toast.success('Backup created successfully!');
        refetchBackups();
      } else {
        toast.error(`Backup failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Failed to create backup');
      console.error(error);
    }
  };

  const handleTestRecovery = async () => {
    try {
      setIsTestingRecovery(true);
      toast.loading('Testing disaster recovery...');
      
      const result = await testDisasterRecovery({});
      
      if (result.success) {
        toast.success(`Recovery test passed! Duration: ${result.testDuration}ms`);
      } else {
        toast.error(`Recovery test failed: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      toast.error('Failed to test recovery');
      console.error(error);
    } finally {
      setIsTestingRecovery(false);
    }
  };

  const handleRunLoadTest = async () => {
    try {
      setIsRunningLoadTest(true);
      toast.loading('Running load test...');
      
      const result = await runConnectionPoolLoadTest({
        duration: 30,
        concurrency: 20,
        queryType: 'read',
      });
      
      toast.success(
        `Load test completed! QPS: ${result.queriesPerSecond.toFixed(2)}, Avg: ${result.avgResponseTime}ms`
      );
    } catch (error) {
      toast.error('Failed to run load test');
      console.error(error);
    } finally {
      setIsRunningLoadTest(false);
    }
  };

  const handleResetSlowQueryStats = async () => {
    try {
      await resetSlowQueryStats();
      toast.success('Slow query statistics reset');
    } catch (error) {
      toast.error('Failed to reset statistics');
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            {t('database.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('database.subtitle')}
          </p>
        </div>
      </div>

      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="backups">
            <HardDrive className="h-4 w-4 mr-2" />
            {t('database.tabs.backups')}
          </TabsTrigger>
          <TabsTrigger value="recovery">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('database.tabs.recovery')}
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="h-4 w-4 mr-2" />
            {t('database.tabs.monitoring')}
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Zap className="h-4 w-4 mr-2" />
            {t('database.tabs.performance')}
          </TabsTrigger>
        </TabsList>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('database.stats.totalBackups')}</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backupStats?.totalBackups || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {backupStats?.totalSizeFormatted || '0 Bytes'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('database.stats.newestBackup')}</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backupStats?.newestBackup 
                    ? new Date(backupStats.newestBackup).toLocaleDateString()
                    : 'None'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {backupStats?.newestBackup 
                    ? new Date(backupStats.newestBackup).toLocaleTimeString()
                    : 'No backups yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('database.stats.actions')}</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Button onClick={handleManualBackup} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  {t('database.createBackup')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('database.backupHistory')}</CardTitle>
              <CardDescription>
                {t('database.backupDaily')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backupsLoading ? (
                <div className="text-center py-8 text-muted-foreground">{t('database.loadingBackups')}</div>
              ) : backups && backups.length > 0 ? (
                <div className="space-y-2">
                  {backups.map((backup, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <HardDrive className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{backup.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(backup.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{backup.sizeFormatted}</Badge>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('database.noBackups')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recovery Tab */}
        <TabsContent value="recovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Disaster Recovery Testing</CardTitle>
              <CardDescription>
                Test backup integrity and recovery procedures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Recovery tests validate backup integrity without modifying production data.
                  They check compression, file size, and content structure.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button 
                  onClick={handleTestRecovery}
                  disabled={isTestingRecovery}
                  className="flex-1"
                >
                  {isTestingRecovery ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Test Latest Backup
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Recovery Documentation</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Tests run automatically without affecting production</li>
                  <li>• Validates backup file integrity and compression</li>
                  <li>• Estimates recovery time and data volume</li>
                  <li>• See DATABASE_INFRASTRUCTURE.md for full recovery procedures</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{slowQueryStats?.totalQueries || 0}</div>
                <p className="text-xs text-muted-foreground">Since last reset</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Slow Queries</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{slowQueryStats?.slowQueries || 0}</div>
                <p className="text-xs text-muted-foreground">&gt;1 second</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{slowQueryStats?.avgQueryDuration || 0}ms</div>
                <p className="text-xs text-muted-foreground">Average response time</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Slow Query Report</CardTitle>
                  <CardDescription>Top 10 slowest database queries</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleResetSlowQueryStats}>
                  Reset Stats
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {slowQueryStats?.topSlowQueries && slowQueryStats.topSlowQueries.length > 0 ? (
                <div className="space-y-2">
                  {slowQueryStats.topSlowQueries.map((query, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-mono text-sm">{query.query}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {query.count} executions
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={query.avgDuration > 5000 ? 'destructive' : 'secondary'}>
                          Avg: {query.avgDuration.toFixed(0)}ms
                        </Badge>
                        <Badge variant="outline">
                          Max: {query.maxDuration.toFixed(0)}ms
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No slow queries detected
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Pool Load Testing</CardTitle>
              <CardDescription>
                Test database performance under load
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Load tests generate synthetic database queries. Run during low-traffic periods.
                  Default: 30 seconds, 20 concurrent connections, read queries.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button 
                  onClick={handleRunLoadTest}
                  disabled={isRunningLoadTest}
                  className="flex-1"
                >
                  {isRunningLoadTest ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running Test...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Run Load Test (30s)
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Performance Metrics</h3>
                <div className="grid gap-2 md:grid-cols-3 text-sm">
                  <div className="p-3 border rounded">
                    <p className="text-muted-foreground">Target QPS</p>
                    <p className="text-2xl font-bold">&gt;100</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="text-muted-foreground">Max Response</p>
                    <p className="text-2xl font-bold">&lt;500ms</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="text-muted-foreground">Error Rate</p>
                    <p className="text-2xl font-bold">&lt;1%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Read Replicas</CardTitle>
              <CardDescription>
                Configure read replicas for load distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Server className="h-4 w-4" />
                <AlertDescription>
                  Read replicas are configured via environment variables.
                  See DATABASE_INFRASTRUCTURE.md for setup instructions.
                </AlertDescription>
              </Alert>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between p-2 border rounded">
                  <span className="text-muted-foreground">READ_REPLICA_URL_1</span>
                  <Badge variant="secondary">
                    Server-side only
                  </Badge>
                </div>
                <div className="flex justify-between p-2 border rounded">
                  <span className="text-muted-foreground">READ_REPLICA_URL_2</span>
                  <Badge variant="secondary">
                    Server-side only
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
