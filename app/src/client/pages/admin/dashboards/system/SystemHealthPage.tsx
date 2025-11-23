import React, { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getSystemHealth, getDatabaseMetrics, getInfrastructureStatus } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Database,
  HardDrive,
  Loader,
  RefreshCw,
  Server,
  Wifi,
  XCircle,
  Clock,
  Cpu,
  MemoryStick,
} from 'lucide-react';
import { toast } from 'sonner';
import DefaultLayout from '../../layout/DefaultLayout';

const SystemHealthPage: React.FC = () => {
  const { data: user } = useAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { 
    data: health, 
    isLoading: isLoadingHealth, 
    refetch: refetchHealth 
  } = useQuery(getSystemHealth, undefined, {
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30s
  });

  const { 
    data: dbMetrics, 
    isLoading: isLoadingMetrics, 
    refetch: refetchMetrics 
  } = useQuery(getDatabaseMetrics);

  const { 
    data: infrastructure, 
    isLoading: isLoadingInfra, 
    refetch: refetchInfra 
  } = useQuery(getInfrastructureStatus);

  const handleRefreshAll = async () => {
    try {
      await Promise.all([refetchHealth(), refetchMetrics(), refetchInfra()]);
      toast.success('System health data refreshed');
    } catch (error: any) {
      toast.error('Failed to refresh health data');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'configured':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'not_configured':
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'configured':
        return <Badge className="bg-green-500">Healthy</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive">Unhealthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500">Degraded</Badge>;
      case 'not_configured':
        return <Badge variant="secondary">Not Configured</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (!user?.isAdmin) {
    return (
      <DefaultLayout user={user!}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold">Access Denied</h1>
            <p className="text-gray-500 mt-2">Admin access required</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  const isLoading = isLoadingHealth || isLoadingMetrics || isLoadingInfra;

  return (
    <DefaultLayout user={user!}>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
            <p className="text-gray-600 mt-1">
              Monitor infrastructure status and performance metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-pulse" />
                  Auto-refresh ON
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Auto-refresh OFF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Status Banner */}
        {health && (
          <Card className={
            health.overall === 'healthy' ? 'border-green-500 bg-green-50' :
            health.overall === 'degraded' ? 'border-yellow-500 bg-yellow-50' :
            'border-red-500 bg-red-50'
          }>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(health.overall)}
                  <div>
                    <h2 className="text-xl font-bold">
                      System Status: {health.overall.charAt(0).toUpperCase() + health.overall.slice(1)}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Last checked: {new Date(health.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold">{health.totalResponseTime}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {health?.services.postgres && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">PostgreSQL</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  {getStatusIcon(health.services.postgres.status)}
                  {getStatusBadge(health.services.postgres.status)}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {health.services.postgres.message || health.services.postgres.error}
                </p>
                {health.services.postgres.responseTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    Response: {health.services.postgres.responseTime}ms
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {health?.services.redis && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Redis</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  {getStatusIcon(health.services.redis.status)}
                  {getStatusBadge(health.services.redis.status)}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {health.services.redis.message || health.services.redis.error || 'Cache service'}
                </p>
                {health.services.redis.responseTime !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    Response: {health.services.redis.responseTime}ms
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {health?.services.minio && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MinIO (S3)</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  {getStatusIcon(health.services.minio.status)}
                  {getStatusBadge(health.services.minio.status)}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {health.services.minio.message || health.services.minio.error || 'Object storage'}
                </p>
                {health.services.minio.endpoint && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {health.services.minio.endpoint}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {health?.services.elk && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ELK Stack</CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  {getStatusIcon(health.services.elk.status)}
                  {getStatusBadge(health.services.elk.status)}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {health.services.elk.message || health.services.elk.error || 'Log aggregation'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Database Metrics */}
        {dbMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Connections</CardTitle>
                <CardDescription>Active connection pool status</CardDescription>
              </CardHeader>
              <CardContent>
                {dbMetrics.connections ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Total</span>
                        <span className="text-2xl font-bold">{dbMetrics.connections.total}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Active</span>
                        <span className="text-lg font-semibold text-green-600">{dbMetrics.connections.active}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Idle</span>
                        <span className="text-lg font-semibold text-gray-600">{dbMetrics.connections.idle}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No connection data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database Size</CardTitle>
                <CardDescription>Current database storage usage</CardDescription>
              </CardHeader>
              <CardContent>
                {dbMetrics.size ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Total Size</p>
                      <p className="text-3xl font-bold">{dbMetrics.size.pretty}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatBytes(dbMetrics.size.bytes)}</p>
                    </div>
                    {dbMetrics.size.tables && dbMetrics.size.tables.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Largest Tables</p>
                        <div className="space-y-1">
                          {dbMetrics.size.tables.slice(0, 5).map((table: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="truncate">{table.table}</span>
                              <span className="font-mono text-gray-600">{table.size}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No size data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Infrastructure Resources */}
        {infrastructure && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  System Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatUptime(infrastructure.system.uptime)}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Node.js {infrastructure.system.nodeVersion} on {infrastructure.system.platform}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Heap Used</p>
                    <p className="text-2xl font-bold">{infrastructure.resources.memory.heapUsedMB} MB</p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Total Heap</span>
                    <span className="font-mono">{infrastructure.resources.memory.heapTotalMB} MB</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">RSS</span>
                    <span className="font-mono">{infrastructure.resources.memory.rssMB} MB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">User Time</p>
                    <p className="text-2xl font-bold">{infrastructure.resources.cpu.userSeconds.toFixed(2)}s</p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">System Time</span>
                    <span className="font-mono">{infrastructure.resources.cpu.systemSeconds.toFixed(2)}s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Slow Queries */}
        {dbMetrics?.performance?.slowQueries && dbMetrics.performance.slowQueries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Slow Queries (Last 24h)</CardTitle>
              <CardDescription>Database queries that took longer than expected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dbMetrics.performance.slowQueries.map((query: any, idx: number) => (
                  <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">
                        {new Date(query.timestamp).toLocaleString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {query.duration}
                      </Badge>
                    </div>
                    <p className="text-sm">{query.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default SystemHealthPage;
