/**
 * Enhanced Feature Analytics
 * 
 * Provides advanced analytics for feature management:
 * 1. Feature usage heatmaps per workspace
 * 2. Plan conversion funnels (Free → Hobby → Pro)
 * 3. Feature adoption rate over time
 * 4. Most/least used features dashboard
 */

import type { Workspace, FeatureUsageLog, WorkspaceSubscriptionHistory } from 'wasp/entities';
import { FEATURE_DEFINITIONS } from './features';

// ===== 1. FEATURE USAGE HEATMAPS =====

export interface FeatureHeatmapData {
  workspaceId: string;
  workspaceName: string;
  period: 'day' | 'week' | 'month';
  heatmap: {
    [date: string]: {
      [featureKey: string]: {
        uses: number;
        denials: number;
        intensity: number; // 0-100 scale for visualization
      };
    };
  };
  topDays: Array<{ date: string; totalUses: number }>;
  topFeatures: Array<{ featureKey: string; totalUses: number }>;
  [key: string]: any;
}

/**
 * Generate feature usage heatmap for a workspace
 * Shows daily usage patterns across all features
 */
export async function getFeatureUsageHeatmap(
  context: any,
  workspaceId: string,
  period: 'day' | 'week' | 'month' = 'month'
): Promise<FeatureHeatmapData> {
  // Get workspace info
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  // Calculate date range
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setDate(now.getDate() - 30);
      break;
  }

  // Fetch usage logs
  const logs = await context.entities.FeatureUsageLog.findMany({
    where: {
      workspaceId,
      timestamp: {
        gte: startDate,
        lte: now,
      },
    },
    orderBy: {
      timestamp: 'asc',
    },
  });

  // Build heatmap data structure
  const heatmap: FeatureHeatmapData['heatmap'] = {};
  const dailyTotals: Record<string, number> = {};
  const featureTotals: Record<string, number> = {};
  let maxUsesPerCell = 0;

  logs.forEach((log: any) => {
    const dateKey = log.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!heatmap[dateKey]) {
      heatmap[dateKey] = {};
      dailyTotals[dateKey] = 0;
    }

    if (!heatmap[dateKey][log.featureKey]) {
      heatmap[dateKey][log.featureKey] = {
        uses: 0,
        denials: 0,
        intensity: 0,
      };
    }

    if (log.action === 'use' || log.action === 'check') {
      heatmap[dateKey][log.featureKey].uses++;
      dailyTotals[dateKey]++;
      featureTotals[log.featureKey] = (featureTotals[log.featureKey] || 0) + 1;
      maxUsesPerCell = Math.max(maxUsesPerCell, heatmap[dateKey][log.featureKey].uses);
    } else if (log.action === 'denied') {
      heatmap[dateKey][log.featureKey].denials++;
    }
  });

  // Calculate intensity (0-100 scale for visualization)
  Object.keys(heatmap).forEach(date => {
    Object.keys(heatmap[date]).forEach(featureKey => {
      const uses = heatmap[date][featureKey].uses;
      heatmap[date][featureKey].intensity = maxUsesPerCell > 0 
        ? Math.round((uses / maxUsesPerCell) * 100)
        : 0;
    });
  });

  // Top days by usage
  const topDays = Object.entries(dailyTotals)
    .map(([date, totalUses]) => ({ date, totalUses }))
    .sort((a, b) => b.totalUses - a.totalUses)
    .slice(0, 7);

  // Top features by usage
  const topFeatures = Object.entries(featureTotals)
    .map(([featureKey, totalUses]) => ({ featureKey, totalUses }))
    .sort((a, b) => b.totalUses - a.totalUses)
    .slice(0, 10);

  return {
    workspaceId,
    workspaceName: workspace.name,
    period,
    heatmap,
    topDays,
    topFeatures,
  };
}

// ===== 2. PLAN CONVERSION FUNNELS =====

export interface ConversionFunnelData {
  period: 'week' | 'month' | 'quarter' | 'year';
  stages: {
    free: {
      count: number;
      percentage: number;
    };
    hobby: {
      count: number;
      percentage: number;
      conversionFromFree: number;
    };
    pro: {
      count: number;
      percentage: number;
      conversionFromFree: number;
      conversionFromHobby: number;
    };
  };
  conversions: Array<{
    fromPlan: string;
    toPlan: string;
    count: number;
    avgTimeToConvert: number; // days
  }>;
  dropoffPoints: Array<{
    stage: string;
    dropoffRate: number;
    reasons: Array<{ reason: string; count: number }>;
  }>;
  [key: string]: any;
}

/**
 * Analyze plan conversion funnel
 * Shows Free → Hobby → Pro upgrade patterns
 */
export async function getPlanConversionFunnel(
  context: any,
  period: 'week' | 'month' | 'quarter' | 'year' = 'month'
): Promise<ConversionFunnelData> {
  // Calculate date range
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setDate(now.getDate() - 30);
      break;
    case 'quarter':
      startDate.setDate(now.getDate() - 90);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  // Get all workspaces with current plan
  const workspaces = await context.entities.Workspace.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      subscriptionPlan: true,
      createdAt: true,
    },
  });

  // Count workspaces by plan
  const planCounts = {
    free: 0,
    hobby: 0,
    pro: 0,
  };

  workspaces.forEach((ws: any) => {
    const plan = (ws.subscriptionPlan || 'free') as keyof typeof planCounts;
    if (plan in planCounts) {
      planCounts[plan]++;
    }
  });

  const totalWorkspaces = workspaces.length;

  // Get conversion history
  const conversionHistory = await context.entities.WorkspaceSubscriptionHistory.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: now,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Analyze conversions
  const conversionMap: Record<string, {
    count: number;
    totalTimeToConvert: number;
  }> = {};

  for (const history of conversionHistory) {
    const key = `${history.fromPlan || 'none'}_to_${history.toPlan}`;
    
    if (!conversionMap[key]) {
      conversionMap[key] = {
        count: 0,
        totalTimeToConvert: 0,
      };
    }
    
    conversionMap[key].count++;
    
    // Calculate time to convert (if we have workspace creation date)
    if (history.fromPlan === 'free' || !history.fromPlan) {
      const workspace = workspaces.find((ws: any) => ws.id === history.workspaceId);
      if (workspace) {
        const timeToConvert = Math.floor(
          (history.createdAt.getTime() - workspace.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        conversionMap[key].totalTimeToConvert += timeToConvert;
      }
    }
  }

  // Format conversion data
  const conversions = Object.entries(conversionMap).map(([key, data]) => {
    const [from, to] = key.replace('_to_', '|').split('|');
    return {
      fromPlan: from === 'none' ? 'free' : from,
      toPlan: to,
      count: data.count,
      avgTimeToConvert: data.count > 0 
        ? Math.round(data.totalTimeToConvert / data.count)
        : 0,
    };
  });

  // Calculate conversion rates
  const freeToHobby = conversionMap['free_to_hobby']?.count || 0;
  const freeToHobbyRate = planCounts.free > 0 ? (freeToHobby / planCounts.free) * 100 : 0;
  
  const hobbyToPro = conversionMap['hobby_to_pro']?.count || 0;
  const hobbyToProRate = planCounts.hobby > 0 ? (hobbyToPro / planCounts.hobby) * 100 : 0;
  
  const freeToPro = conversionMap['free_to_pro']?.count || 0;
  const freeToProRate = planCounts.free > 0 ? (freeToPro / planCounts.free) * 100 : 0;

  // Analyze dropoff points (workspaces that didn't upgrade)
  const dropoffPoints = [
    {
      stage: 'free',
      dropoffRate: 100 - freeToHobbyRate - freeToProRate,
      reasons: [
        { reason: 'Not enough value perceived', count: 0 }, // Placeholder - would need user surveys
        { reason: 'Price concerns', count: 0 },
      ],
    },
    {
      stage: 'hobby',
      dropoffRate: 100 - hobbyToProRate,
      reasons: [
        { reason: 'Features sufficient', count: 0 },
        { reason: 'Price concerns', count: 0 },
      ],
    },
  ];

  return {
    period,
    stages: {
      free: {
        count: planCounts.free,
        percentage: totalWorkspaces > 0 ? (planCounts.free / totalWorkspaces) * 100 : 0,
      },
      hobby: {
        count: planCounts.hobby,
        percentage: totalWorkspaces > 0 ? (planCounts.hobby / totalWorkspaces) * 100 : 0,
        conversionFromFree: freeToHobbyRate,
      },
      pro: {
        count: planCounts.pro,
        percentage: totalWorkspaces > 0 ? (planCounts.pro / totalWorkspaces) * 100 : 0,
        conversionFromFree: freeToProRate,
        conversionFromHobby: hobbyToProRate,
      },
    },
    conversions,
    dropoffPoints,
  };
}

// ===== 3. FEATURE ADOPTION RATE OVER TIME =====

export interface FeatureAdoptionTrend {
  featureKey: string;
  featureName: string;
  module: string;
  timeline: Array<{
    date: string;
    enabledWorkspaces: number;
    totalWorkspaces: number;
    adoptionRate: number;
    newAdopters: number;
  }>;
  currentAdoptionRate: number;
  growthRate: number; // percentage change over period
  projectedAdoptionIn30Days: number;
  [key: string]: any;
}

/**
 * Track feature adoption rate over time
 * Shows how features are being adopted by workspaces
 */
export async function getFeatureAdoptionTrends(
  context: any,
  options: {
    featureKeys?: string[];
    period?: 'week' | 'month' | 'quarter';
    interval?: 'day' | 'week';
  } = {}
): Promise<FeatureAdoptionTrend[]> {
  const { featureKeys, period = 'month', interval = 'day' } = options;

  // Get feature definitions
  const featuresToTrack = featureKeys 
    ? FEATURE_DEFINITIONS.filter(f => featureKeys.includes(f.key))
    : FEATURE_DEFINITIONS;

  // Calculate date range
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setDate(now.getDate() - 30);
      break;
    case 'quarter':
      startDate.setDate(now.getDate() - 90);
      break;
  }

  // Generate date points based on interval
  const datePoints: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= now) {
    datePoints.push(new Date(current));
    
    if (interval === 'day') {
      current.setDate(current.getDate() + 1);
    } else {
      current.setDate(current.getDate() + 7);
    }
  }

  // Get all workspaces
  const workspaces = await context.entities.Workspace.findMany({
    where: {
      deletedAt: null,
      createdAt: {
        lte: now,
      },
    },
    include: {
      featureOverrides: {
        include: {
          featureFlag: true,
        },
      },
    },
  });

  // Get usage logs to track first usage
  const usageLogs = await context.entities.FeatureUsageLog.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: now,
      },
      action: 'use',
    },
    orderBy: {
      timestamp: 'asc',
    },
  });

  // Build adoption trends for each feature
  const trends: FeatureAdoptionTrend[] = [];

  for (const feature of featuresToTrack) {
    const timeline: FeatureAdoptionTrend['timeline'] = [];
    let previousEnabledCount = 0;

    for (const date of datePoints) {
      // Count workspaces that existed at this date
      const workspacesAtDate = workspaces.filter(
        (ws: any) => new Date(ws.createdAt) <= date
      );
      const totalWorkspaces = workspacesAtDate.length;

      // Count workspaces with feature enabled at this date
      let enabledWorkspaces = 0;
      
      for (const ws of workspacesAtDate) {
        const plan = ws.subscriptionPlan || 'free';
        const planField = `availableIn${plan.charAt(0).toUpperCase() + plan.slice(1)}` as keyof typeof feature;
        let isEnabled = Boolean(feature[planField]);

        // Check for overrides
        const override = ws.featureOverrides?.find(
          (o: any) => o.featureFlag?.key === feature.key
        );
        
        if (override) {
          isEnabled = override.isEnabled;
        }

        if (isEnabled) {
          enabledWorkspaces++;
        }
      }

      const adoptionRate = totalWorkspaces > 0 
        ? (enabledWorkspaces / totalWorkspaces) * 100 
        : 0;

      const newAdopters = enabledWorkspaces - previousEnabledCount;

      timeline.push({
        date: date.toISOString().split('T')[0],
        enabledWorkspaces,
        totalWorkspaces,
        adoptionRate,
        newAdopters: Math.max(0, newAdopters),
      });

      previousEnabledCount = enabledWorkspaces;
    }

    // Calculate growth rate
    const firstRate = timeline[0]?.adoptionRate || 0;
    const lastRate = timeline[timeline.length - 1]?.adoptionRate || 0;
    const growthRate = firstRate > 0 ? ((lastRate - firstRate) / firstRate) * 100 : 0;

    // Simple linear projection for next 30 days
    const recentRates = timeline.slice(-7).map(t => t.adoptionRate);
    const avgRecentRate = recentRates.reduce((sum, r) => sum + r, 0) / recentRates.length;
    const projectedAdoptionIn30Days = Math.min(100, avgRecentRate + (growthRate / 30) * 30);

    trends.push({
      featureKey: feature.key,
      featureName: feature.name,
      module: feature.module,
      timeline,
      currentAdoptionRate: lastRate,
      growthRate,
      projectedAdoptionIn30Days,
    });
  }

  return trends;
}

// ===== 4. MOST/LEAST USED FEATURES DASHBOARD =====

export interface FeatureUsageDashboard {
  period: 'day' | 'week' | 'month';
  mostUsedFeatures: Array<{
    featureKey: string;
    featureName: string;
    module: string;
    usageCount: number;
    workspacesUsing: number;
    avgUsagePerWorkspace: number;
    trendsDirection: 'up' | 'down' | 'stable';
  }>;
  leastUsedFeatures: Array<{
    featureKey: string;
    featureName: string;
    module: string;
    usageCount: number;
    enabledWorkspaces: number;
    utilizationRate: number; // percentage of enabled workspaces actually using it
    reasons: Array<string>;
  }>;
  moduleComparison: Record<string, {
    totalFeatures: number;
    activeFeatures: number;
    totalUsage: number;
    avgUsagePerFeature: number;
  }>;
  planComparison: Record<string, {
    totalFeatures: number;
    totalUsage: number;
    avgUsagePerWorkspace: number;
    topFeatures: Array<{ featureKey: string; usageCount: number }>;
  }>;
  [key: string]: any;
}

/**
 * Generate comprehensive feature usage dashboard
 * Shows most/least used features with detailed metrics
 */
export async function getFeatureUsageDashboard(
  context: any,
  period: 'day' | 'week' | 'month' = 'month'
): Promise<FeatureUsageDashboard> {
  // Get feature definitions - already imported at top
  
  // Calculate date range
  const now = new Date();
  const startDate = new Date();
  const previousStartDate = new Date();
  
  switch (period) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      previousStartDate.setDate(now.getDate() - 2);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      previousStartDate.setDate(now.getDate() - 14);
      break;
    case 'month':
      startDate.setDate(now.getDate() - 30);
      previousStartDate.setDate(now.getDate() - 60);
      break;
  }

  // Fetch usage logs for current and previous periods
  const [currentLogs, previousLogs, workspaces] = await Promise.all([
    context.entities.FeatureUsageLog.findMany({
      where: {
        timestamp: { gte: startDate, lte: now },
        action: 'use',
      },
    }),
    context.entities.FeatureUsageLog.findMany({
      where: {
        timestamp: { gte: previousStartDate, lt: startDate },
        action: 'use',
      },
    }),
    context.entities.Workspace.findMany({
      where: { deletedAt: null },
      include: {
        featureOverrides: {
          include: {
            featureFlag: true,
          },
        },
      },
    }),
  ]);

  // Aggregate usage by feature
  const currentUsage: Record<string, {
    count: number;
    workspaces: Set<string>;
  }> = {};

  const previousUsage: Record<string, number> = {};

  currentLogs.forEach((log: any) => {
    if (!currentUsage[log.featureKey]) {
      currentUsage[log.featureKey] = {
        count: 0,
        workspaces: new Set(),
      };
    }
    currentUsage[log.featureKey].count++;
    currentUsage[log.featureKey].workspaces.add(log.workspaceId);
  });

  previousLogs.forEach((log: any) => {
    previousUsage[log.featureKey] = (previousUsage[log.featureKey] || 0) + 1;
  });

  // Build most used features list
  const mostUsedFeatures = FEATURE_DEFINITIONS
    .map(feature => {
      const usage = currentUsage[feature.key];
      const usageCount = usage?.count || 0;
      const workspacesUsing = usage?.workspaces.size || 0;
      const avgUsagePerWorkspace = workspacesUsing > 0 ? usageCount / workspacesUsing : 0;

      // Determine trend direction
      const currentCount = usageCount;
      const previousCount = previousUsage[feature.key] || 0;
      const changePercent = previousCount > 0 
        ? ((currentCount - previousCount) / previousCount) * 100 
        : 0;
      
      let trendsDirection: 'up' | 'down' | 'stable';
      if (changePercent > 10) trendsDirection = 'up';
      else if (changePercent < -10) trendsDirection = 'down';
      else trendsDirection = 'stable';

      return {
        featureKey: feature.key,
        featureName: feature.name,
        module: feature.module,
        usageCount,
        workspacesUsing,
        avgUsagePerWorkspace: Math.round(avgUsagePerWorkspace * 100) / 100,
        trendsDirection,
      };
    })
    .filter(f => f.usageCount > 0)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 20);

  // Build least used features list (features that are enabled but not used much)
  const leastUsedFeatures = FEATURE_DEFINITIONS
    .map(feature => {
      const usage = currentUsage[feature.key];
      const usageCount = usage?.count || 0;

      // Count workspaces where feature is enabled
      let enabledWorkspaces = 0;
      
      for (const ws of workspaces) {
        const plan = ws.subscriptionPlan || 'free';
        const planField = `availableIn${plan.charAt(0).toUpperCase() + plan.slice(1)}` as keyof typeof feature;
        let isEnabled = Boolean(feature[planField]);

        const override = ws.featureOverrides?.find(
          (o: any) => o.featureFlag?.key === feature.key
        );
        
        if (override) {
          isEnabled = override.isEnabled;
        }

        if (isEnabled) {
          enabledWorkspaces++;
        }
      }

      const workspacesActuallyUsing = usage?.workspaces.size || 0;
      const utilizationRate = enabledWorkspaces > 0 
        ? (workspacesActuallyUsing / enabledWorkspaces) * 100 
        : 0;

      // Identify potential reasons for low usage
      const reasons: string[] = [];
      if (utilizationRate < 20 && enabledWorkspaces > 10) {
        reasons.push('Low discoverability');
      }
      if (usageCount < 5 && enabledWorkspaces > 20) {
        reasons.push('Complex onboarding');
      }
      if (utilizationRate < 10) {
        reasons.push('Value proposition unclear');
      }

      return {
        featureKey: feature.key,
        featureName: feature.name,
        module: feature.module,
        usageCount,
        enabledWorkspaces,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        reasons,
      };
    })
    .filter(f => f.enabledWorkspaces > 0)
    .sort((a, b) => a.utilizationRate - b.utilizationRate)
    .slice(0, 20);

  // Module comparison
  const moduleComparison: FeatureUsageDashboard['moduleComparison'] = {};
  
  ['aegis', 'eclipse', 'mitre', 'core'].forEach(module => {
    const moduleFeatures = FEATURE_DEFINITIONS.filter(f => f.module === module);
    const activeFeatures = moduleFeatures.filter(f => currentUsage[f.key]?.count > 0);
    const totalUsage = moduleFeatures.reduce(
      (sum, f) => sum + (currentUsage[f.key]?.count || 0),
      0
    );

    moduleComparison[module] = {
      totalFeatures: moduleFeatures.length,
      activeFeatures: activeFeatures.length,
      totalUsage,
      avgUsagePerFeature: moduleFeatures.length > 0 
        ? Math.round(totalUsage / moduleFeatures.length) 
        : 0,
    };
  });

  // Plan comparison
  const planComparison: FeatureUsageDashboard['planComparison'] = {};
  
  ['free', 'hobby', 'pro'].forEach(plan => {
    const workspacesInPlan = workspaces.filter(
      (ws: any) => (ws.subscriptionPlan || 'free') === plan
    );
    
    const featuresInPlan = FEATURE_DEFINITIONS.filter(feature => {
      const planField = `availableIn${plan.charAt(0).toUpperCase() + plan.slice(1)}` as keyof typeof feature;
      return Boolean(feature[planField]);
    });

    const usageInPlan = currentLogs.filter((log: any) =>
      workspacesInPlan.some((ws: any) => ws.id === log.workspaceId)
    );

    const featureUsageInPlan: Record<string, number> = {};
    usageInPlan.forEach((log: any) => {
      featureUsageInPlan[log.featureKey] = (featureUsageInPlan[log.featureKey] || 0) + 1;
    });

    const topFeatures = Object.entries(featureUsageInPlan)
      .map(([featureKey, usageCount]) => ({ featureKey, usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    planComparison[plan] = {
      totalFeatures: featuresInPlan.length,
      totalUsage: usageInPlan.length,
      avgUsagePerWorkspace: workspacesInPlan.length > 0 
        ? Math.round(usageInPlan.length / workspacesInPlan.length) 
        : 0,
      topFeatures,
    };
  });

  return {
    period,
    mostUsedFeatures,
    leastUsedFeatures,
    moduleComparison,
    planComparison,
  };
}
