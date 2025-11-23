/**
 * Shared Payment Plan Utilities
 * 
 * This module provides utilities for checking subscription plan limits
 * across all modules (Aegis, Eclipse, Core features).
 * Integrated with feature management system for comprehensive control.
 */

import { Prisma, type PrismaClient } from '@prisma/client';
import { FeatureChecker } from '../features/FeatureChecker';
import { FEATURE_DEFINITIONS } from '../features/features';

type DbClient = PrismaClient;

export class HttpError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'HttpError';
  }
}

export interface PlanLimits {
  // Core limits
  maxWorkspaceMembers: number;
  maxWorkspaces: number;
  maxStorageGB: number;
  
  // Aegis limits
  maxAlertsPerMonth: number;
  maxIncidentsPerMonth: number;
  maxCasesPerMonth: number;
  maxEvidenceFileSizeMB: number;
  maxConcurrentTasks: number;
  slaTrackingEnabled: boolean;
  customWebhooksEnabled: boolean;
  mitreIntegrationEnabled: boolean;
  
  // Eclipse limits
  maxTrackersPerWorkspace: number;
  maxDetectionsPerMonth: number;
  maxDataSourcesPerWorkspace: number;
  maxCrawlsPerDay: number;
  maxStoragePerDetectionMB: number;
  theHiveIntegrationEnabled: boolean;
  mispIntegrationEnabled: boolean;
  customReportsEnabled: boolean;
  
  // General features
  auditLogsRetentionDays: number;
  apiRateLimit: number;
  customBrandingEnabled: boolean;
  advancedAnalyticsEnabled: boolean;
  
  // MITRE limits
  maxTTPsPerWorkspace: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    // Core limits
    maxWorkspaceMembers: 3,
    maxWorkspaces: 1,
    maxStorageGB: 1,
    
    // Aegis limits
    maxAlertsPerMonth: 10,
    maxIncidentsPerMonth: 5,
    maxCasesPerMonth: 2,
    maxEvidenceFileSizeMB: 10,
    maxConcurrentTasks: 2,
    slaTrackingEnabled: false,
    customWebhooksEnabled: false,
    mitreIntegrationEnabled: false,
    
    // Eclipse limits
    maxTrackersPerWorkspace: 2,
    maxDetectionsPerMonth: 50,
    maxDataSourcesPerWorkspace: 1,
    maxCrawlsPerDay: 5,
    maxStoragePerDetectionMB: 5,
    theHiveIntegrationEnabled: false,
    mispIntegrationEnabled: false,
    customReportsEnabled: false,
    
    // General features
    auditLogsRetentionDays: 30,
    apiRateLimit: 100,
    customBrandingEnabled: false,
    advancedAnalyticsEnabled: false,
    
    // MITRE limits
    maxTTPsPerWorkspace: 50,
  },
  
  hobby: {
    // Core limits
    maxWorkspaceMembers: 10,
    maxWorkspaces: 3,
    maxStorageGB: 10,
    
    // Aegis limits
    maxAlertsPerMonth: 100,
    maxIncidentsPerMonth: 50,
    maxCasesPerMonth: 20,
    maxEvidenceFileSizeMB: 50,
    maxConcurrentTasks: 5,
    slaTrackingEnabled: true,
    customWebhooksEnabled: true,
    mitreIntegrationEnabled: false,
    
    // Eclipse limits
    maxTrackersPerWorkspace: 10,
    maxDetectionsPerMonth: 500,
    maxDataSourcesPerWorkspace: 5,
    maxCrawlsPerDay: 25,
    maxStoragePerDetectionMB: 20,
    theHiveIntegrationEnabled: false,
    mispIntegrationEnabled: false,
    customReportsEnabled: true,
    
    // General features
    auditLogsRetentionDays: 90,
    apiRateLimit: 500,
    customBrandingEnabled: true,
    advancedAnalyticsEnabled: false,
    
    // MITRE limits
    maxTTPsPerWorkspace: 500,
  },
  
  pro: {
    // Core limits
    maxWorkspaceMembers: -1, // unlimited
    maxWorkspaces: -1, // unlimited
    maxStorageGB: 100,
    
    // Aegis limits
    maxAlertsPerMonth: -1, // unlimited
    maxIncidentsPerMonth: -1, // unlimited
    maxCasesPerMonth: -1, // unlimited
    maxEvidenceFileSizeMB: 500,
    maxConcurrentTasks: 20,
    slaTrackingEnabled: true,
    customWebhooksEnabled: true,
    mitreIntegrationEnabled: true,
    
    // Eclipse limits
    maxTrackersPerWorkspace: -1, // unlimited
    maxDetectionsPerMonth: -1, // unlimited
    maxDataSourcesPerWorkspace: -1, // unlimited
    maxCrawlsPerDay: 100,
    maxStoragePerDetectionMB: 100,
    theHiveIntegrationEnabled: true,
    mispIntegrationEnabled: true,
    customReportsEnabled: true,
    
    // General features
    auditLogsRetentionDays: 2555, // 7 years
    apiRateLimit: 2000,
    customBrandingEnabled: true,
    advancedAnalyticsEnabled: true,
    
    // MITRE limits
    maxTTPsPerWorkspace: -1, // unlimited
  },
};

/**
 * Get plan limits for a workspace
 */
export function getPlanLimits(subscriptionPlan: string | null): PlanLimits {
  const plan = subscriptionPlan || 'free';
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Check if a workspace can perform an action based on their plan
 */
export async function checkPlanLimit(
  context: any,
  workspaceId: string,
  limitType: keyof PlanLimits,
  currentCount?: number
): Promise<{ allowed: boolean; limit: number; current?: number }> {
  
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
    select: { subscriptionPlan: true },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  const limits = getPlanLimits(workspace.subscriptionPlan);
  const limit = limits[limitType] as number | boolean;

  // For boolean features (enabled/disabled)
  if (typeof limit === 'boolean') {
    return { 
      allowed: limit, 
      limit: limit ? 1 : 0,
      current: currentCount 
    };
  }

  // For numeric limits
  const numericLimit = limit as number;
  
  // -1 means unlimited
  if (numericLimit === -1) {
    return { 
      allowed: true, 
      limit: -1,
      current: currentCount 
    };
  }

  // Check against current count if provided
  if (currentCount !== undefined) {
    return { 
      allowed: currentCount < numericLimit, 
      limit: numericLimit,
      current: currentCount 
    };
  }

  return { 
    allowed: true, 
    limit: numericLimit,
    current: currentCount 
  };
}

/**
 * Enforce plan limit or throw error
 * Now integrated with feature management system for comprehensive control
 */
export async function enforcePlanLimit(
  context: any,
  workspaceId: string,
  limitType: keyof PlanLimits,
  currentCount?: number,
  customErrorMessage?: string,
  featureKey?: string
): Promise<void> {
  
  // If feature key provided, check feature availability first
  if (featureKey) {
    const isFeatureEnabled = await FeatureChecker.isEnabled(
      context, 
      workspaceId,
      featureKey
    );
    
    if (!isFeatureEnabled) {
      throw new HttpError(403, `Feature ${featureKey} is not available for your plan.`);
    }
  }
  
  const result = await checkPlanLimit(context, workspaceId, limitType, currentCount);
  
  if (!result.allowed) {
    const defaultMessage = `Plan limit exceeded. Your current plan allows ${result.limit} ${limitType}. Please upgrade your plan to continue.`;
    throw new HttpError(403, customErrorMessage || defaultMessage);
  }
}

/**
 * Get current usage counts for a workspace
 */
export async function getWorkspaceUsage(
  context: any,
  workspaceId: string
): Promise<{
  alerts: { thisMonth: number };
  incidents: { thisMonth: number };
  cases: { thisMonth: number };
  brands: { total: number };
  brandAlerts: { thisMonth: number };
  monitors: { total: number };
  members: { total: number };
  storageUsed: { totalGB: number };
}> {
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Helper to safely count entities (fallback to 0 if entity doesn't exist)
  const safeCount = (entity: any, query: any) => {
    if (!entity || typeof entity.count !== 'function') {
      return Promise.resolve(0);
    }
    return entity.count(query).catch(() => 0);
  };

  const [
    alertsThisMonth,
    incidentsThisMonth,
    casesThisMonth,
    totalBrands,
    brandAlertsThisMonth,
    totalMonitors,
    totalMembers,
    workspace
  ] = await Promise.all([
    // Aegis counts
    context.entities.Alert.count({
      where: { workspaceId, createdAt: { gte: startOfMonth } }
    }),
    context.entities.Incident.count({
      where: { workspaceId, createdAt: { gte: startOfMonth } }
    }),
    context.entities.Case.count({
      where: { workspaceId, createdAt: { gte: startOfMonth } }
    }),
    
    // Eclipse (Brand) counts - with safety checks
    safeCount(context.entities.EclipseBrand, { where: { workspaceId } }),
    safeCount(context.entities.BrandAlert, { where: { workspaceId, createdAt: { gte: startOfMonth } } }),
    safeCount(context.entities.BrandMonitor, { where: { workspaceId } }),
    
    // Workspace counts
    context.entities.WorkspaceMember.count({
      where: { workspaceId }
    }),
    context.entities.Workspace.findUnique({
      where: { id: workspaceId },
      select: { storageUsed: true }
    })
  ]);

  return {
    alerts: { thisMonth: alertsThisMonth },
    incidents: { thisMonth: incidentsThisMonth },
    cases: { thisMonth: casesThisMonth },
    brands: { total: totalBrands },
    brandAlerts: { thisMonth: brandAlertsThisMonth },
    monitors: { total: totalMonitors },
    members: { total: totalMembers },
    storageUsed: { 
      totalGB: workspace ? Number(workspace.storageUsed) / (1024 * 1024 * 1024) : 0 
    }
  };
}

/**
 * Check if a feature is available for the workspace plan
 */
export async function isFeatureAvailable(
  context: any,
  workspaceId: string,
  featureKey: keyof PlanLimits
): Promise<boolean> {
  const result = await checkPlanLimit(context, workspaceId, featureKey);
  return result.allowed;
}

/**
 * Re-evaluate all features for a workspace after plan change
 * Integrates with FeatureChecker to ensure bulletproof consistency
 */
export async function reevaluateWorkspaceFeatures(
  context: any,
  workspaceId: string
): Promise<{
  newlyEnabled: string[];
  newlyDisabled: string[];
  totalFeatures: number;
}> {
  try {
    const workspace = await context.entities.Workspace.findUnique({
      where: { id: workspaceId },
      select: { subscriptionPlan: true }
    });

    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    const newlyEnabled: string[] = [];
    const newlyDisabled: string[] = [];
    let totalFeatures = 0;

    // Re-evaluate all defined features
    for (const feature of FEATURE_DEFINITIONS) {
      totalFeatures++;
      
      const wasEnabledBefore = await FeatureChecker.isEnabled(context, workspaceId, feature.key);
      
      // Force re-evaluation by checking plan availability directly
      const plan = workspace.subscriptionPlan || 'free';
      const planField = `availableIn${plan.charAt(0).toUpperCase() + plan.slice(1)}` as keyof typeof feature;
      const shouldBeEnabled = Boolean(feature[planField]);
      
      // Track changes
      if (shouldBeEnabled && !wasEnabledBefore) {
        newlyEnabled.push(feature.key);
      } else if (!shouldBeEnabled && wasEnabledBefore) {
        newlyDisabled.push(feature.key);
      }
    }

    // Log the re-evaluation for audit
    console.log(`Feature re-evaluation for workspace ${workspaceId}:`, {
      plan: workspace.subscriptionPlan,
      newlyEnabled: newlyEnabled.length,
      newlyDisabled: newlyDisabled.length,
      totalFeatures
    });

    return {
      newlyEnabled,
      newlyDisabled,
      totalFeatures
    };

  } catch (error) {
    console.error('Error re-evaluating workspace features:', error);
    throw error;
  }
}