import React, { useState, useMemo } from 'react';
import { useQuery, getAllWorkspacesForAdmin, suspendWorkspace, getWorkspaceDetails } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { 
  AlertCircle, 
  CheckCircle, 
  Users, 
  HardDrive, 
  Bell, 
  RefreshCw, 
  Loader, 
  Shield,
  Ban,
  Eye,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import DefaultLayout from '../../layout/DefaultLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Textarea } from '../../../../components/ui/textarea';

interface Workspace {
  id: string;
  name: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  isActive: boolean;
  memberCount: number;
  storageQuotaBytes: number;
  storageUsedBytes: number;
  maxMembers: number;
  createdAt: string;
}

const WorkspaceManagementPage: React.FC = () => {
  const { data: user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; workspace: Workspace | null; suspend: boolean }>({
    open: false,
    workspace: null,
    suspend: true,
  });
  const [suspendReason, setSuspendReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; workspaceId: string | null }>({
    open: false,
    workspaceId: null,
  });

  const { data: workspaces, isLoading, refetch } = useQuery(getAllWorkspacesForAdmin);
  const { data: workspaceDetails, isLoading: isLoadingDetails } = useQuery(
    getWorkspaceDetails,
    detailsDialog.workspaceId ? { workspaceId: detailsDialog.workspaceId } : undefined
  );

  const filteredWorkspaces = useMemo(() => {
    if (!Array.isArray(workspaces)) return [];

    return workspaces.filter((workspace: Workspace) => {
      const matchesSearch = searchTerm === '' || 
        workspace.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlan = selectedPlan === 'all' || workspace.subscriptionPlan === selectedPlan;
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'active' && workspace.isActive) ||
        (selectedStatus === 'suspended' && !workspace.isActive);
      
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [workspaces, searchTerm, selectedPlan, selectedStatus]);

  const stats = useMemo(() => {
    if (!Array.isArray(workspaces)) {
      return { total: 0, active: 0, suspended: 0, free: 0, hobby: 0, pro: 0 };
    }

    return {
      total: workspaces.length,
      active: workspaces.filter(w => w.isActive).length,
      suspended: workspaces.filter(w => !w.isActive).length,
      free: workspaces.filter(w => w.subscriptionPlan === 'free').length,
      hobby: workspaces.filter(w => w.subscriptionPlan === 'hobby').length,
      pro: workspaces.filter(w => w.subscriptionPlan === 'pro').length,
    };
  }, [workspaces]);

  const handleSuspendWorkspace = async () => {
    if (!suspendDialog.workspace) return;

    setIsProcessing(true);
    try {
      await suspendWorkspace({
        workspaceId: suspendDialog.workspace.id,
        suspend: suspendDialog.suspend,
        reason: suspendReason,
      });
      toast.success(`Workspace ${suspendDialog.suspend ? 'suspended' : 'activated'} successfully`);
      setSuspendDialog({ open: false, workspace: null, suspend: true });
      setSuspendReason('');
      await refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update workspace status');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-green-500';
      case 'hobby': return 'bg-blue-500';
      case 'pro': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
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

  if (isLoading) {
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workspace Management</h1>
            <p className="text-gray-600 mt-1">
              Manage all workspaces across the platform
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Free</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.free}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hobby</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hobby}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pro}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search workspaces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="hobby">Hobby</option>
                <option value="pro">Pro</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedPlan('all');
                  setSelectedStatus('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workspaces Table */}
        <Card>
          <CardHeader>
            <CardTitle>Workspaces ({filteredWorkspaces.length})</CardTitle>
            <CardDescription>
              All workspaces in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workspace
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Members
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Storage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWorkspaces.map((workspace: Workspace) => (
                    <tr key={workspace.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{workspace.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(workspace.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getPlanBadgeColor(workspace.subscriptionPlan)}>
                          {workspace.subscriptionPlan.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {workspace.isActive ? (
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Suspended</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {workspace.memberCount} / {workspace.maxMembers || '∞'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <HardDrive className="h-4 w-4 mr-1" />
                          {formatBytes(workspace.storageUsedBytes || 0)} / {formatBytes(workspace.storageQuotaBytes)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailsDialog({ open: true, workspaceId: workspace.id })}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                        <Button
                          variant={workspace.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() => setSuspendDialog({ 
                            open: true, 
                            workspace, 
                            suspend: workspace.isActive 
                          })}
                        >
                          {workspace.isActive ? (
                            <>
                              <Ban className="h-3 w-3 mr-1" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredWorkspaces.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500">No workspaces match the current filters</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suspend/Activate Dialog */}
        <Dialog open={suspendDialog.open} onOpenChange={(open) => setSuspendDialog({ ...suspendDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {suspendDialog.suspend ? 'Suspend' : 'Activate'} Workspace
              </DialogTitle>
              <DialogDescription>
                {suspendDialog.suspend 
                  ? 'Suspending a workspace will prevent all members from accessing it.'
                  : 'Activating this workspace will restore full access to all members.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <strong>Workspace:</strong> {suspendDialog.workspace?.name}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason {suspendDialog.suspend && '(required)'}
                </label>
                <Textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSuspendDialog({ open: false, workspace: null, suspend: true });
                  setSuspendReason('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant={suspendDialog.suspend ? "destructive" : "default"}
                onClick={handleSuspendWorkspace}
                disabled={isProcessing || (suspendDialog.suspend && !suspendReason.trim())}
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  suspendDialog.suspend ? 'Suspend Workspace' : 'Activate Workspace'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={detailsDialog.open} onOpenChange={(open) => setDetailsDialog({ ...detailsDialog, open })}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Workspace Details</DialogTitle>
            </DialogHeader>
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : workspaceDetails ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong className="text-sm text-gray-500">Name:</strong>
                    <p>{workspaceDetails.name}</p>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-500">Plan:</strong>
                    <p>
                      <Badge className={getPlanBadgeColor(workspaceDetails.subscriptionPlan)}>
                        {workspaceDetails.subscriptionPlan.toUpperCase()}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-500">Status:</strong>
                    <p>
                      {workspaceDetails.isActive ? (
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Suspended</Badge>
                      )}
                    </p>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-500">Created:</strong>
                    <p>{new Date(workspaceDetails.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Members ({workspaceDetails.members.length})</h3>
                  <div className="space-y-2">
                    {workspaceDetails.members.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{member.user.email}</div>
                          <div className="text-sm text-gray-500">{member.user.username || 'No username'}</div>
                        </div>
                        <Badge>{member.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {workspaceDetails.stats && (
                  <div>
                    <h3 className="font-semibold mb-2">Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-sm text-gray-500">Notifications</div>
                        <div className="text-2xl font-bold">{workspaceDetails.stats.notificationCount}</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-sm text-gray-500">Audit Logs</div>
                        <div className="text-2xl font-bold">{workspaceDetails.stats.auditLogCount}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">Failed to load workspace details</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DefaultLayout>
  );
};

export default WorkspaceManagementPage;
