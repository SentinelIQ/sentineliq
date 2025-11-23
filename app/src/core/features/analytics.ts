/**
 * Feature Usage Analytics
 * 
 * Tracks feature usage and denials for analytics and monitoring.
 * Provides insights into feature adoption and access patterns.
 */

import type { FeatureUsageLog } from 'wasp/entities';
import { FEATURE_DEFINITIONS } from './features';

export interface FeatureUsageEvent {
  workspaceId: string;
  featureKey: string;
  userId?: string;
  action: 'check' | 'use' | 'denied';
  reason?: string;
  metadata?: Record<string, any>;
}

export interface FeatureAnalytics {
  workspaceId: string;
  period: 'day' | 'week' | 'month';
  totalChecks: number;
  totalUses: number;
  totalDenials: number;
  byFeature: Record<string, {
    checks: number;
    uses: number;
    denials: number;
    denialRate: number;
  }>;
  byModule: Record<string, {
    checks: number;
    uses: number;
    denials: number;
  }>;
  topUsedFeatures: Array<{
    featureKey: string;
    uses: number;
  }>;
  topDeniedFeatures: Array<{
    featureKey: string;
    denials: number;
    reason: string;
  }>;
  [key: string]: any;
}

/**
 * Log feature usage event
 */
export async function logFeatureUsage(
  context: any,
  event: FeatureUsageEvent
): Promise<void> {
  try {
    await context.entities.FeatureUsageLog.create({
      data: {
        workspaceId: event.workspaceId,
        featureKey: event.featureKey,
        userId: event.userId,
        action: event.action,
        success: event.action !== 'denied',
        reason: event.reason,
        metadata: event.metadata,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log feature usage:', error);
    // Don't throw - analytics should not break operations
  }
}

/**
 * Get feature analytics for a workspace
 */
export async function getFeatureAnalytics(
  context: any,
  workspaceId: string,
  period: 'day' | 'week' | 'month' = 'week'
): Promise<FeatureAnalytics> {
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

  const logs = await context.entities.FeatureUsageLog.findMany({
    where: {
      workspaceId,
      timestamp: {
        gte: startDate,
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Calculate metrics
  const totalChecks = logs.filter((l: any) => l.action === 'check').length;
  const totalUses = logs.filter((l: any) => l.action === 'use').length;
  const totalDenials = logs.filter((l: any) => l.action === 'denied').length;

  // Group by feature
  const byFeature: Record<string, any> = {};
  logs.forEach((log: any) => {
    if (!byFeature[log.featureKey]) {
      byFeature[log.featureKey] = {
        checks: 0,
        uses: 0,
        denials: 0,
        denialRate: 0,
      };
    }
    
    if (log.action === 'check') byFeature[log.featureKey].checks++;
    if (log.action === 'use') byFeature[log.featureKey].uses++;
    if (log.action === 'denied') byFeature[log.featureKey].denials++;
  });

  // Calculate denial rates
  Object.keys(byFeature).forEach(key => {
    const total = byFeature[key].checks + byFeature[key].uses + byFeature[key].denials;
    byFeature[key].denialRate = total > 0 
      ? (byFeature[key].denials / total) * 100 
      : 0;
  });

  // Group by module (extract from feature key)
  const byModule: Record<string, any> = {};
  logs.forEach((log: any) => {
    const module = log.featureKey.split('.')[0];
    if (!byModule[module]) {
      byModule[module] = { checks: 0, uses: 0, denials: 0 };
    }
    
    if (log.action === 'check') byModule[module].checks++;
    if (log.action === 'use') byModule[module].uses++;
    if (log.action === 'denied') byModule[module].denials++;
  });

  // Top used features
  const topUsedFeatures = Object.entries(byFeature)
    .map(([featureKey, stats]: [string, any]) => ({
      featureKey,
      uses: stats.uses,
    }))
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 10);

  // Top denied features
  const deniedLogs = logs.filter((l: any) => l.action === 'denied');
  const denialsByFeature: Record<string, { count: number; reason: string }> = {};
  
  deniedLogs.forEach((log: any) => {
    if (!denialsByFeature[log.featureKey]) {
      denialsByFeature[log.featureKey] = {
        count: 0,
        reason: log.reason || 'Feature not available',
      };
    }
    denialsByFeature[log.featureKey].count++;
  });

  const topDeniedFeatures = Object.entries(denialsByFeature)
    .map(([featureKey, data]) => ({
      featureKey,
      denials: data.count,
      reason: data.reason,
    }))
    .sort((a, b) => b.denials - a.denials)
    .slice(0, 10);

  return {
    workspaceId,
    period,
    totalChecks,
    totalUses,
    totalDenials,
    byFeature,
    byModule,
    topUsedFeatures,
    topDeniedFeatures,
  };
}

/**
 * Get global feature adoption metrics
 */
export async function getGlobalFeatureAdoption(
  context: any
): Promise<Record<string, {
  totalWorkspaces: number;
  enabledWorkspaces: number;
  adoptionRate: number;
}>> {
  const workspaces = await context.entities.Workspace.findMany({
    include: {
      featureOverrides: {
        include: {
          featureFlag: true,
        },
      },
    },
  });

  const adoption: Record<string, any> = {};

  // Get all features from code
  FEATURE_DEFINITIONS.forEach(feature => {
    adoption[feature.key] = {
      totalWorkspaces: workspaces.length,
      enabledWorkspaces: 0,
      adoptionRate: 0,
    };
  });

  // Count enabled workspaces per feature
  for (const workspace of workspaces) {
    const plan = workspace.subscriptionPlan || 'free';
    
    FEATURE_DEFINITIONS.forEach(feature => {
      // Check if available in plan
      const planField = `availableIn${plan.charAt(0).toUpperCase() + plan.slice(1)}` as 'availableInFree' | 'availableInHobby' | 'availableInPro';
      let isEnabled = feature[planField];
      
      // Check for overrides
      const override = workspace.featureOverrides?.find(
        (o: any) => o.featureFlag?.key === feature.key
      );
      
      if (override) {
        isEnabled = override.isEnabled;
      }
      
      if (isEnabled) {
        adoption[feature.key].enabledWorkspaces++;
      }
    });
  }

  // Calculate adoption rates
  Object.keys(adoption).forEach(key => {
    const data = adoption[key];
    data.adoptionRate = data.totalWorkspaces > 0
      ? (data.enabledWorkspaces / data.totalWorkspaces) * 100
      : 0;
  });

  return adoption;
}
