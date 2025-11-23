import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, getFeatureFlags, getWorkspaceFeatures, updateFeatureFlag, toggleWorkspaceFeature, getAllWorkspacesForAdmin } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Switch } from '../../../components/ui/switch';
import { AlertCircle, CheckCircle, Settings, Shield, Database, Eye, RefreshCw, Loader } from 'lucide-react';
import { toast } from 'sonner';
import DefaultLayout from '../layout/DefaultLayout';

// Types
interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  module: string;
  category: string;
  isEnabled: boolean;
  availableInFree: boolean;
  availableInHobby: boolean;
  availableInPro: boolean;
}

interface WorkspaceFeature extends FeatureFlag {
  isOverridden: boolean;
  availableInPlan: boolean;
  subscriptionPlan: string;
}

const FeatureManagementPage: React.FC = () => {
  const { data: user } = useAuth();
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Query for global feature flags (admin view)
  const { data: globalFeatures, isLoading: isLoadingGlobal, refetch: refetchGlobal } = useQuery(getFeatureFlags, {});
  
  // Query for workspace features (when workspace selected)
  const { data: workspaceData, isLoading: isLoadingWorkspace, refetch: refetchWorkspace } = useQuery(
    getWorkspaceFeatures, 
    selectedWorkspace ? { workspaceId: selectedWorkspace } : undefined
  );

  // Get list of workspaces (for admins)
  const { data: userWorkspaces, isLoading: isLoadingWorkspaces } = useQuery(getAllWorkspacesForAdmin);

  const features = useMemo(() => {
    if (selectedWorkspace && workspaceData?.features) {
      return workspaceData.features || [];
    }
    return globalFeatures || [];
  }, [globalFeatures, workspaceData, selectedWorkspace]);

  const filteredFeatures = useMemo(() => {
    if (!Array.isArray(features)) return [];
    
    return features.filter((feature: any) => {
      const matchesModule = selectedModule === 'all' || feature.module === selectedModule;
      const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
      const matchesSearch = searchTerm === '' || 
        feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feature.key.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesModule && matchesCategory && matchesSearch;
    });
  }, [features, selectedModule, selectedCategory, searchTerm]);

  const moduleStats = useMemo(() => {
    if (!Array.isArray(features)) return {};
    
    return features.reduce((acc: any, feature: any) => {
      acc[feature.module] = (acc[feature.module] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [features]);

  const totalStats = useMemo(() => {
    if (!Array.isArray(features)) {
      return { total: 0, enabled: 0, disabled: 0, overridden: 0 };
    }

    const total = features.length;
    const enabled = features.filter((f: any) => f.isEnabled).length;
    const disabled = total - enabled;
    const overridden = selectedWorkspace ? 
      features.filter((f: any) => f.isOverridden).length : 0;

    return { total, enabled, disabled, overridden };
  }, [features, selectedWorkspace]);

  const handleGlobalToggle = async (featureId: string, enabled: boolean) => {
    setIsUpdating(featureId);
    try {
      await updateFeatureFlag({
        id: featureId,
        updates: { isEnabled: enabled }
      });
      toast.success(`Feature ${enabled ? 'enabled' : 'disabled'} globally`);
      await refetchGlobal();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update feature');
      console.error(error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleWorkspaceToggle = async (featureKey: string, enabled: boolean) => {
    if (!selectedWorkspace) return;
    
    setIsUpdating(featureKey);
    try {
      await toggleWorkspaceFeature({
        workspaceId: selectedWorkspace,
        featureKey,
        isEnabled: enabled
      });
      toast.success(`Feature ${enabled ? 'enabled' : 'disabled'} for workspace`);
      await refetchWorkspace();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to toggle workspace feature');
      console.error(error);
    } finally {
      setIsUpdating(null);
    }
  };

  const renderFeatureRow = (feature: any) => {
    const isWorkspaceView = Boolean(selectedWorkspace);
    const isOverridden = isWorkspaceView && feature.isOverridden;
    const canToggle = !isWorkspaceView || feature.availableInPlan;
    
    return (
      <tr key={feature.key} className={isOverridden ? 'bg-blue-50' : ''}>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          <div className="flex items-center space-x-2">
            <span>{feature.name}</span>
            {isOverridden && (
              <Badge variant="outline" className="text-blue-600">
                Override
              </Badge>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {feature.key}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {feature.description}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <Badge variant="secondary">{feature.module}</Badge>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <Badge variant="outline">{feature.category}</Badge>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div className="flex space-x-1">
            {feature.availableInFree && <Badge variant="default" className="bg-green-500">Free</Badge>}
            {feature.availableInHobby && <Badge variant="default" className="bg-blue-500">Hobby</Badge>}
            {feature.availableInPro && <Badge variant="default" className="bg-purple-500">Pro</Badge>}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Switch
              checked={feature.isEnabled}
              onCheckedChange={(enabled) => {
                if (isWorkspaceView) {
                  handleWorkspaceToggle(feature.key, enabled);
                } else {
                  handleGlobalToggle(feature.id, enabled);
                }
              }}
              disabled={!canToggle || isUpdating === (isWorkspaceView ? feature.key : feature.id)}
            />
            {feature.isEnabled ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            {!canToggle && (
              <span className="text-xs text-gray-400">Plan restricted</span>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const modules = ['all', 'aegis', 'eclipse', 'mitre', 'core'];
  const categories = ['all', 'security', 'monitoring', 'analytics', 'integration', 'management', 'workspace', 'notification', 'support'];

  // Set default workspace if available
  useEffect(() => {
    if (!selectedWorkspace && userWorkspaces && Array.isArray(userWorkspaces) && userWorkspaces.length > 0) {
      setSelectedWorkspace(userWorkspaces[0].id);
    }
  }, [userWorkspaces, selectedWorkspace]);

  if (!user?.isAdmin) {
    return (
      <DefaultLayout user={user!}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold">Access Denied</h1>
            <p className="text-gray-500 mt-2">Admin access required to manage features</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (isLoadingGlobal || isLoadingWorkspaces) {
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
            <h1 className="text-2xl font-bold text-gray-900">Feature Management</h1>
            <p className="text-gray-600 mt-1">
              Manage feature availability across all modules and workspaces
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                refetchGlobal();
                if (selectedWorkspace) refetchWorkspace();
              }}
              disabled={isLoadingGlobal || isLoadingWorkspace}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingGlobal || isLoadingWorkspace ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Features</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all modules
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enabled</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStats.enabled}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disabled</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalStats.disabled}</div>
            <p className="text-xs text-muted-foreground">
              Currently inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overridden</CardTitle>
            <Settings className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalStats.overridden}</div>
            <p className="text-xs text-muted-foreground">
              Workspace overrides
            </p>
          </CardContent>
        </Card>
      </div>

        {/* Workspace Selector */}
        {userWorkspaces && Array.isArray(userWorkspaces) && userWorkspaces.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Workspace View</CardTitle>
              <CardDescription>
                Select a workspace to see feature configurations specific to that workspace ({userWorkspaces.length} found)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedWorkspace ? 'outline' : 'default'}
                  onClick={() => setSelectedWorkspace(undefined)}
                  size="sm"
                >
                  Global View
                </Button>
                {userWorkspaces.map((workspace: any) => (
                  <Button
                    key={workspace.id}
                    variant={selectedWorkspace === workspace.id ? 'default' : 'outline'}
                    onClick={() => setSelectedWorkspace(workspace.id)}
                    size="sm"
                    className="whitespace-nowrap"
                    title={`${workspace.name} (${workspace.memberCount || 0} members)`}
                  >
                    {workspace.name} {isLoadingWorkspace && selectedWorkspace === workspace.id && <Loader className="h-3 w-3 ml-2 animate-spin" />}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Workspace View</CardTitle>
              <CardDescription>
                No workspaces available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                {isLoadingWorkspaces ? 'Loading workspaces...' : `No workspaces found. Data: ${JSON.stringify(userWorkspaces)}`}
              </p>
            </CardContent>
          </Card>
        )}      {/* Module Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Module Distribution</CardTitle>
          <CardDescription>
            Number of features per module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(moduleStats).map(([module, count]) => {
              const icons = {
                aegis: Shield,
                eclipse: Eye,
                mitre: Database,
                core: Settings,
              };
              const Icon = icons[module as keyof typeof icons] || Settings;
              
              return (
                <div key={module} className="flex items-center space-x-2">
                  <Icon className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium capitalize">{module}</div>
                    <div className="text-sm text-gray-500">{Number(count)} features</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {modules.map((module) => (
                <option key={module} value={module}>
                  {module === 'all' ? 'All Modules' : module.charAt(0).toUpperCase() + module.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedModule('all');
                setSelectedCategory('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Features ({filteredFeatures.length})
          </CardTitle>
          <CardDescription>
            {selectedWorkspace 
              ? `Workspace-specific feature configuration`
              : `Global feature configuration`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingWorkspace ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plans
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFeatures.map(renderFeatureRow)}
              </tbody>
            </table>
            </div>
          )}
          
          {filteredFeatures.length === 0 && !isLoadingWorkspace && (
            <div className="text-center py-8">
              <div className="text-gray-500">No features match the current filters</div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedModule('all');
                  setSelectedCategory('all');
                }}
                className="mt-4"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </DefaultLayout>
  );
};

export default FeatureManagementPage;