import React, { useState, useMemo } from 'react';
import { useQuery } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { 
  getFeatureUsageHeatmap, 
  getPlanConversionFunnel, 
  getFeatureAdoptionTrends,
  getFeatureUsageDashboard 
} from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar,
  Activity,
  Target,
  Zap,
  AlertCircle,
  BarChart3,
  Loader
} from 'lucide-react';
import DefaultLayout from '../layout/DefaultLayout';

const FeatureAnalyticsDashboard: React.FC = () => {
  const { data: user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);

  // Query hooks
  const { data: usageDashboard, isLoading: isLoadingDashboard } = useQuery(
    getFeatureUsageDashboard, 
    { period: selectedPeriod }
  );

  const { data: conversionFunnel, isLoading: isLoadingFunnel } = useQuery(
    getPlanConversionFunnel, 
    { period: selectedPeriod === 'day' ? 'week' : selectedPeriod }
  );

  const { data: adoptionTrends, isLoading: isLoadingTrends } = useQuery(
    getFeatureAdoptionTrends,
    { 
      period: selectedPeriod === 'day' ? 'week' : selectedPeriod,
      interval: selectedPeriod === 'month' ? 'week' : 'day'
    }
  );

  const { data: heatmapData, isLoading: isLoadingHeatmap } = useQuery(
    getFeatureUsageHeatmap,
    selectedWorkspace ? { workspaceId: selectedWorkspace, period: selectedPeriod } : undefined
  );

  const isLoading = isLoadingDashboard || isLoadingFunnel || isLoadingTrends;

  if (!user) {
    return null;
  }

  return (
    <DefaultLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Feature Analytics</h1>
            <p className="text-muted-foreground">
              Advanced insights into feature usage, adoption, and conversion metrics
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={selectedPeriod === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('day')}
            >
              Day
            </Button>
            <Button
              variant={selectedPeriod === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('week')}
            >
              Week
            </Button>
            <Button
              variant={selectedPeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('month')}
            >
              Month
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && (
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
              <TabsTrigger value="adoption">Adoption Trends</TabsTrigger>
              <TabsTrigger value="heatmap">Usage Heatmap</TabsTrigger>
            </TabsList>

            {/* Tab 1: Feature Usage Dashboard */}
            <TabsContent value="dashboard" className="space-y-6">
              <FeatureUsageDashboardView data={usageDashboard} period={selectedPeriod} />
            </TabsContent>

            {/* Tab 2: Plan Conversion Funnel */}
            <TabsContent value="funnel" className="space-y-6">
              <PlanConversionFunnelView data={conversionFunnel} />
            </TabsContent>

            {/* Tab 3: Feature Adoption Trends */}
            <TabsContent value="adoption" className="space-y-6">
              <FeatureAdoptionTrendsView data={adoptionTrends} />
            </TabsContent>

            {/* Tab 4: Usage Heatmap */}
            <TabsContent value="heatmap" className="space-y-6">
              <FeatureUsageHeatmapView 
                data={heatmapData} 
                selectedWorkspace={selectedWorkspace}
                onWorkspaceChange={setSelectedWorkspace}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DefaultLayout>
  );
};

// ===== SUB-COMPONENTS =====

interface FeatureUsageDashboardViewProps {
  data: any;
  period: string;
}

const FeatureUsageDashboardView: React.FC<FeatureUsageDashboardViewProps> = ({ data, period }) => {
  if (!data) return null;

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    if (direction === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (direction === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Module Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Module Comparison</CardTitle>
          <CardDescription>Feature usage across modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(data.moduleComparison).map(([module, stats]: [string, any]) => (
              <div key={module} className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground capitalize">{module}</div>
                <div className="mt-2 space-y-1">
                  <div className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.activeFeatures}/{stats.totalFeatures} features active
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg: {stats.avgUsagePerFeature} uses/feature
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Most Used Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Most Used Features
          </CardTitle>
          <CardDescription>Top performing features in the last {period}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.mostUsedFeatures.slice(0, 10).map((feature: any, index: number) => (
              <div key={feature.featureKey} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-muted-foreground">#{index + 1}</div>
                  <div>
                    <div className="font-medium">{feature.featureName}</div>
                    <div className="text-xs text-muted-foreground">
                      {feature.featureKey} • {feature.module}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{feature.usageCount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {feature.workspacesUsing} workspaces
                    </div>
                  </div>
                  {getTrendIcon(feature.trendsDirection)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Least Used Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Least Used Features
          </CardTitle>
          <CardDescription>Features with low utilization rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.leastUsedFeatures.slice(0, 10).map((feature: any) => (
              <div key={feature.featureKey} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{feature.featureName}</div>
                  <div className="text-xs text-muted-foreground">
                    {feature.featureKey} • {feature.module}
                  </div>
                  {feature.reasons.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {feature.reasons.map((reason: string) => (
                        <Badge key={reason} variant="secondary" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-orange-500">
                    {feature.utilizationRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {feature.usageCount}/{feature.enabledWorkspaces} workspaces
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Plan</CardTitle>
          <CardDescription>Feature usage distribution across subscription tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(data.planComparison).map(([plan, stats]: [string, any]) => (
              <div key={plan} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={plan === 'pro' ? 'default' : plan === 'hobby' ? 'secondary' : 'outline'}>
                    {plan.toUpperCase()}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {stats.totalFeatures} features
                  </div>
                </div>
                
                <div>
                  <div className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    Avg: {stats.avgUsagePerWorkspace} uses/workspace
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Top Features:</div>
                  {stats.topFeatures.slice(0, 3).map((f: any) => (
                    <div key={f.featureKey} className="text-xs flex justify-between">
                      <span className="truncate">{f.featureKey.split('.')[1]}</span>
                      <span className="text-muted-foreground">{f.usageCount}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PlanConversionFunnelView: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Funnel Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Free Plan</CardTitle>
            <CardDescription>Entry point</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.stages.free.count}</div>
            <div className="text-sm text-muted-foreground">
              {data.stages.free.percentage.toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hobby Plan</CardTitle>
            <CardDescription>First upgrade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.stages.hobby.count}</div>
            <div className="text-sm text-muted-foreground">
              {data.stages.hobby.percentage.toFixed(1)}% of total
            </div>
            <div className="mt-2 text-xs text-green-600">
              {data.stages.hobby.conversionFromFree.toFixed(1)}% from Free
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pro Plan</CardTitle>
            <CardDescription>Premium tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.stages.pro.count}</div>
            <div className="text-sm text-muted-foreground">
              {data.stages.pro.percentage.toFixed(1)}% of total
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="text-green-600">
                {data.stages.pro.conversionFromHobby.toFixed(1)}% from Hobby
              </div>
              <div className="text-green-600">
                {data.stages.pro.conversionFromFree.toFixed(1)}% from Free
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Patterns</CardTitle>
          <CardDescription>Detailed conversion metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.conversions.map((conversion: any) => (
              <div key={`${conversion.fromPlan}-${conversion.toPlan}`} 
                   className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{conversion.fromPlan.toUpperCase()}</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="default">{conversion.toPlan.toUpperCase()}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{conversion.count} conversions</div>
                    <div className="text-xs text-muted-foreground">
                      Avg: {conversion.avgTimeToConvert} days
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dropoff Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Dropoff Analysis
          </CardTitle>
          <CardDescription>Where users aren't converting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.dropoffPoints.map((point: any) => (
              <div key={point.stage} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="capitalize">{point.stage}</Badge>
                  <span className="text-sm font-medium text-orange-500">
                    {point.dropoffRate.toFixed(1)}% dropoff
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Common reasons: {point.reasons.map((r: any) => r.reason).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const FeatureAdoptionTrendsView: React.FC<{ data: any }> = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Group by module
  const trendsByModule = data.reduce((acc: any, trend: any) => {
    if (!acc[trend.module]) acc[trend.module] = [];
    acc[trend.module].push(trend);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(trendsByModule).map(([module, trends]: [string, any]) => (
        <Card key={module}>
          <CardHeader>
            <CardTitle className="capitalize">{module} Features</CardTitle>
            <CardDescription>Adoption trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trends.map((trend: any) => (
                <div key={trend.featureKey} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">{trend.featureName}</div>
                      <div className="text-xs text-muted-foreground">{trend.featureKey}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {trend.currentAdoptionRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        {trend.growthRate > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        {Math.abs(trend.growthRate).toFixed(1)}% growth
                      </div>
                    </div>
                  </div>
                  
                  {/* Simple timeline visualization */}
                  <div className="flex items-end gap-1 h-16">
                    {trend.timeline.slice(-14).map((point: any, idx: number) => {
                      const height = (point.adoptionRate / 100) * 100;
                      return (
                        <div 
                          key={idx}
                          className="flex-1 bg-primary rounded-t transition-all hover:bg-primary/80"
                          style={{ height: `${height}%` }}
                          title={`${point.date}: ${point.adoptionRate.toFixed(1)}%`}
                        />
                      );
                    })}
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    Projected 30-day: {trend.projectedAdoptionIn30Days.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const FeatureUsageHeatmapView: React.FC<{ 
  data: any; 
  selectedWorkspace: string | null;
  onWorkspaceChange: (id: string) => void;
}> = ({ data, selectedWorkspace, onWorkspaceChange }) => {
  if (!selectedWorkspace) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Select a workspace to view feature usage heatmap
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Usage Heatmap</CardTitle>
          <CardDescription>
            Daily usage intensity for {data.workspaceName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Top Days */}
            <div>
              <h4 className="text-sm font-medium mb-2">Busiest Days</h4>
              <div className="flex gap-2">
                {data.topDays.slice(0, 7).map((day: any) => (
                  <div key={day.date} className="flex-1 p-2 border rounded text-center">
                    <div className="text-xs text-muted-foreground">{day.date.split('-')[2]}</div>
                    <div className="text-sm font-medium">{day.totalUses}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Features */}
            <div>
              <h4 className="text-sm font-medium mb-2">Most Used Features</h4>
              <div className="space-y-2">
                {data.topFeatures.slice(0, 10).map((feature: any) => (
                  <div key={feature.featureKey} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{feature.featureKey}</span>
                    <Badge variant="secondary">{feature.totalUses} uses</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureAnalyticsDashboard;
