import React, { useState, useMemo } from 'react';
import { useQuery, getAllAuditLogsForAdmin, getAllWorkspacesForAdmin } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import type { AuditLog } from 'wasp/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import {
  FileText,
  RefreshCw,
  Loader,
  AlertCircle,
  Download,
  Eye,
  Filter,
  Calendar,
  User,
  Activity,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import DefaultLayout from '../../layout/DefaultLayout';

// Type for audit logs returned from query (with partial relations)
type AuditLogWithRelations = AuditLog & {
  user?: {
    email?: string | null;
    username?: string | null;
  };
  workspace?: {
    name?: string | null;
  };
};

type ViewMode = 'table' | 'timeline';

// Compliance filter templates
const complianceTemplates = {
  lgpd: {
    name: 'LGPD Compliance',
    description: 'Brazilian General Data Protection Law',
    filters: {
      actions: ['DELETE', 'ACCESS', 'UPDATE', 'EXPORT'],
      resourceTypes: ['User', 'UserData', 'PersonalInfo'],
    },
  },
  soc2: {
    name: 'SOC 2 Compliance',
    description: 'System and Organization Controls 2',
    filters: {
      actions: ['ADMIN_ACTION', 'ACCESS', 'UPDATE', 'DELETE', 'CONFIG_CHANGE'],
      resourceTypes: ['User', 'Workspace', 'System', 'Security'],
    },
  },
  gdpr: {
    name: 'GDPR Compliance',
    description: 'General Data Protection Regulation',
    filters: {
      actions: ['DELETE', 'ACCESS', 'UPDATE', 'EXPORT', 'CONSENT'],
      resourceTypes: ['User', 'UserData', 'PersonalInfo', 'Consent'],
    },
  },
};

const AuditLogViewerPage: React.FC = () => {
  const { data: user } = useAuth();
  const [page, setPage] = useState(1);
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [complianceTemplate, setComplianceTemplate] = useState<string>('none');
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; log: AuditLogWithRelations | null }>({
    open: false,
    log: null,
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const pageSize = 50;
  const offset = (page - 1) * pageSize;

  const { data: workspaces } = useQuery(getAllWorkspacesForAdmin);

  const { data: auditData, isLoading, refetch } = useQuery(getAllAuditLogsForAdmin, {
    workspaceId: selectedWorkspace !== 'all' ? selectedWorkspace : undefined,
    action: selectedAction !== 'all' ? selectedAction : undefined,
    resourceType: selectedResourceType !== 'all' ? selectedResourceType : undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: pageSize,
    offset: offset,
  });

  const logs = auditData?.logs || [];
  const total = auditData?.total || 0;
  const hasMore = auditData?.hasMore || false;
  const totalPages = Math.ceil(total / pageSize);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;

    const query = searchQuery.toLowerCase();
    return logs.filter((log: AuditLogWithRelations) => {
      const searchableText = [
        log.action,
        log.resource,
        log.resourceId,
        log.user?.email,
        log.user?.username,
        log.workspace?.name,
        JSON.stringify(log.metadata),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [logs, searchQuery]);

  const stats = useMemo(() => {
    if (!logs.length) return { total: 0, actions: {}, resources: {} };

    const actionCounts: Record<string, number> = {};
    const resourceCounts: Record<string, number> = {};

    logs.forEach((log: AuditLogWithRelations) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
    });

    return {
      total: logs.length,
      actions: actionCounts,
      resources: resourceCounts,
    };
  }, [logs]);

  const uniqueActions = useMemo(() => {
    if (!logs.length) return [];
    return Array.from(new Set(logs.map((log: AuditLogWithRelations) => log.action))).sort();
  }, [logs]);

  const uniqueResources = useMemo(() => {
    if (!logs.length) return [];
    return Array.from(new Set(logs.map((log: AuditLogWithRelations) => log.resource))).sort();
  }, [logs]);

  const handleExportCSV = () => {
    if (!filteredLogs.length) {
      toast.error('No logs to export');
      return;
    }

    const headers = ['Timestamp', 'User', 'Workspace', 'Action', 'Resource Type', 'Resource ID', 'Metadata'];
    const rows = filteredLogs.map((log: AuditLogWithRelations) => [
      new Date(log.createdAt).toISOString(),
      log.user?.email || log.user?.username || 'System',
      log.workspace?.name || 'N/A',
      log.action,
      log.resource,
      log.resourceId || '',
      JSON.stringify(log.metadata || {}),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Audit logs exported successfully');
  };

  const clearFilters = () => {
    setSelectedAction('all');
    setSelectedResourceType('all');
    setSelectedWorkspace('all');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setComplianceTemplate('none');
    setPage(1);
  };

  const applyComplianceTemplate = (templateKey: string) => {
    setComplianceTemplate(templateKey);
    
    if (templateKey === 'none') {
      return;
    }

    const template = complianceTemplates[templateKey as keyof typeof complianceTemplates];
    if (template) {
      // Apply template filters
      if (template.filters.actions.length > 0) {
        setSelectedAction(template.filters.actions[0]);
      }
      if (template.filters.resourceTypes.length > 0) {
        setSelectedResourceType(template.filters.resourceTypes[0]);
      }
      toast.info(`Applied ${template.name} filter template`);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-500';
    if (action.includes('UPDATE')) return 'bg-blue-500';
    if (action.includes('DELETE')) return 'bg-red-500';
    if (action.includes('ACCESS') || action.includes('VIEW')) return 'bg-gray-500';
    if (action.includes('ADMIN')) return 'bg-purple-500';
    return 'bg-gray-600';
  };

  if (!user?.isAdmin) {
    return (
      <DefaultLayout user={user!}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold">Access Denied</h1>
            <p className="text-gray-500 mt-2">Admin access required to view audit logs</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (isLoading && !logs.length) {
    return (
      <DefaultLayout user={user!}>
        <div className="p-8 space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout user={user!}>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log Viewer</h1>
            <p className="text-gray-600 mt-1">
              Track all actions and changes across the platform
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {filteredLogs.length} displayed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.actions).length}</div>
              <p className="text-xs text-muted-foreground">
                Unique action types
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resources</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.resources).length}</div>
              <p className="text-xs text-muted-foreground">
                Resource types
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workspaces?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total workspaces
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <CardTitle>Filters</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Action Filter */}
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resource Type Filter */}
              <div className="space-y-2">
                <Label>Resource Type</Label>
                <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Resources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    {uniqueResources.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Workspace Filter */}
              <div className="space-y-2">
                <Label>Workspace</Label>
                <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Workspaces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workspaces</SelectItem>
                    {workspaces?.map((workspace: any) => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Compliance Templates & View Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Compliance Template</Label>
                <Select value={complianceTemplate} onValueChange={applyComplianceTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="No template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    <SelectItem value="lgpd">🇧🇷 LGPD (Brazilian GDPR)</SelectItem>
                    <SelectItem value="gdpr">🇪🇺 GDPR (EU Regulation)</SelectItem>
                    <SelectItem value="soc2">🔒 SOC 2 (Security Controls)</SelectItem>
                  </SelectContent>
                </Select>
                {complianceTemplate !== 'none' && (
                  <p className="text-xs text-muted-foreground">
                    {complianceTemplates[complianceTemplate as keyof typeof complianceTemplates]?.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>View Mode</Label>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setViewMode('table')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Table
                  </Button>
                  <Button
                    variant={viewMode === 'timeline' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setViewMode('timeline')}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Timeline
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Audit Logs ({filteredLogs.length} of {total})
            </CardTitle>
            <CardDescription>
              {page > 1 && `Page ${page} of ${totalPages} • `}
              Showing {offset + 1} to {Math.min(offset + pageSize, total)} of {total} logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && logs.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : viewMode === 'timeline' ? (
              /* Timeline View */
              <div className="space-y-4">
                {filteredLogs.map((log: AuditLogWithRelations, index: number) => {
                  const showDateDivider = index === 0 || 
                    new Date(log.createdAt).toDateString() !== 
                    new Date(filteredLogs[index - 1].createdAt).toDateString();
                  
                  return (
                    <React.Fragment key={log.id}>
                      {showDateDivider && (
                        <div className="flex items-center gap-4 my-6">
                          <div className="flex-shrink-0 w-32 text-sm font-semibold text-gray-700">
                            {new Date(log.createdAt).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="flex-1 h-px bg-gray-300"></div>
                        </div>
                      )}
                      
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-32 text-right">
                          <span className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="relative flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full ${getActionBadgeColor(log.action)} ring-4 ring-white`}></div>
                          {index < filteredLogs.length - 1 && (
                            <div className="absolute left-1/2 top-3 w-px h-full bg-gray-200 -translate-x-1/2"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 pb-8">
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge className={getActionBadgeColor(log.action)}>
                                    {log.action}
                                  </Badge>
                                  <span className="text-sm font-medium text-gray-900">
                                    {log.resource}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDetailsDialog({ open: true, log })}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="w-3 h-3" />
                                  <span>{log.user?.email || log.user?.username || 'System'}</span>
                                </div>
                                {log.workspace && (
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-3 h-3" />
                                    <span>{log.workspace.name}</span>
                                  </div>
                                )}
                                {log.resourceId && (
                                  <div className="text-xs text-gray-400">
                                    Resource ID: {log.resourceId}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              /* Table View */
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Workspace
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resource
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.map((log: AuditLogWithRelations) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.user?.email || log.user?.username || 'System'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.workspace?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{log.resource}</div>
                          {log.resourceId && (
                            <div className="text-xs text-gray-400 truncate max-w-xs">
                              ID: {log.resourceId}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailsDialog({ open: true, log })}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredLogs.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <div className="text-gray-500">No audit logs match the current filters</div>
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={!hasMore || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog
          open={detailsDialog.open}
          onOpenChange={(open) => setDetailsDialog({ ...detailsDialog, open })}
        >
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
              <DialogDescription>
                Full information about this audit log entry
              </DialogDescription>
            </DialogHeader>
            {detailsDialog.log && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong className="text-sm text-gray-500">Timestamp:</strong>
                    <p className="text-sm">{new Date(detailsDialog.log.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-500">User:</strong>
                    <p className="text-sm">
                      {detailsDialog.log.user?.email || detailsDialog.log.user?.username || 'System'}
                    </p>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-500">Workspace ID:</strong>
                    <p className="text-sm">{detailsDialog.log.workspaceId || 'N/A'}</p>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-500">Action:</strong>
                    <p className="text-sm">
                      <Badge className={getActionBadgeColor(detailsDialog.log.action)}>
                        {detailsDialog.log.action}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-500">Resource:</strong>
                    <p className="text-sm">{detailsDialog.log.resource}</p>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-500">Resource ID:</strong>
                    <p className="text-xs font-mono">{detailsDialog.log.resourceId || 'N/A'}</p>
                  </div>
                </div>

                {detailsDialog.log.metadata && (
                  <div>
                    <strong className="text-sm text-gray-500">Metadata:</strong>
                    <pre className="mt-2 p-4 bg-gray-50 rounded text-xs overflow-auto max-h-96">
                      {JSON.stringify(detailsDialog.log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DefaultLayout>
  );
};

export default AuditLogViewerPage;
