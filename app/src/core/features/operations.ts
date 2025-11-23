/**
 * Feature Management Operations
 * Simplified operations for feature management system
 */
import { HttpError } from 'wasp/server';
import { FeatureChecker } from './FeatureChecker';
import { FEATURE_DEFINITIONS } from './features';
import { enforcePlanLimit } from '../payment/planLimits';
import { getFeatureAnalytics as getFeatureAnalyticsImpl, getGlobalFeatureAdoption as getGlobalFeatureAdoptionImpl } from './analytics';
import { 
  getFeatureUsageHeatmap as getFeatureUsageHeatmapImpl, 
  getPlanConversionFunnel as getPlanConversionFunnelImpl, 
  getFeatureAdoptionTrends as getFeatureAdoptionTrendsImpl, 
  getFeatureUsageDashboard as getFeatureUsageDashboardImpl 
} from './analyticsEnhanced';
import * as z from 'zod';

// Validation schemas
const workspaceIdSchema = z.object({
  workspaceId: z.string().nonempty(),
});

const updateFeatureFlagSchema = z.object({
  id: z.string(),
  updates: z.object({
    isEnabled: z.boolean().optional(),
    description: z.string().optional(),
  }),
});

const toggleWorkspaceFeatureSchema = z.object({
  workspaceId: z.string(),
  featureKey: z.string(),
  isEnabled: z.boolean(),
});

// Operations
export const getFeatureFlags = async (_args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  // Return code-defined features
  return FEATURE_DEFINITIONS.map(feature => ({
    id: feature.key,
    key: feature.key,
    name: feature.name,
    description: feature.description,
    module: feature.module,
    category: feature.category,
    isEnabled: true, // Code-defined features are always "enabled"
    availableInFree: feature.availableInFree,
    availableInHobby: feature.availableInHobby,
    availableInPro: feature.availableInPro,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
};

export const getWorkspaceFeatures = async (rawArgs: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  // Handle case where no workspace is provided - return empty result for global view
  if (!rawArgs?.workspaceId) {
    return {
      features: [],
      totalFeatures: 0,
      enabledFeatures: 0,
      overriddenFeatures: 0,
    };
  }

  const args = workspaceIdSchema.parse(rawArgs);
  
  // Check workspace access
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: args.workspaceId },
    include: { members: true },
  });

  if (!workspace || !workspace.members.some((m: any) => m.userId === context.user.id)) {
    throw new HttpError(403, 'Not authorized to access this workspace');
  }

  // Get workspace overrides from database
  const overrides = await context.entities.WorkspaceFeatureOverride.findMany({
    where: { workspaceId: args.workspaceId },
    include: { featureFlag: true },
  });

  // Combine code features with database overrides
  const features = FEATURE_DEFINITIONS.map(feature => {
    const override = overrides.find((o: any) => o.featureFlag?.key === feature.key);
    
    const plan = workspace.subscriptionPlan || 'free';
    const planField = `availableIn${plan.charAt(0).toUpperCase() + plan.slice(1)}` as keyof typeof feature;
    const isAvailableInPlan = Boolean(feature[planField]);

    return {
      id: feature.key,
      key: feature.key,
      name: feature.name,
      description: feature.description,
      module: feature.module,
      category: feature.category,
      isEnabled: override ? override.isEnabled : isAvailableInPlan,
      isOverridden: Boolean(override),
      availableInPlan: isAvailableInPlan,
      subscriptionPlan: plan,
    };
  });

  return {
    features,
    totalFeatures: features.length,
    enabledFeatures: features.filter(f => f.isEnabled).length,
    overriddenFeatures: features.filter(f => f.isOverridden).length,
  };
};

export const updateFeatureFlag = async (rawArgs: any, context: any) => {
  if (!context.user || !context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const args = updateFeatureFlagSchema.parse(rawArgs);
  
  // For code-driven features, we just return success
  // In a real scenario, this would update global feature flags
  return {
    id: args.id,
    isEnabled: args.updates.isEnabled ?? true,
    description: args.updates.description,
    updatedAt: new Date(),
  };
};

export const toggleWorkspaceFeature = async (rawArgs: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const args = toggleWorkspaceFeatureSchema.parse(rawArgs);
  
  // Check workspace access
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: args.workspaceId },
    include: { members: true },
  });

  if (!workspace || !workspace.members.some((m: any) => m.userId === context.user.id)) {
    throw new HttpError(403, 'Not authorized to access this workspace');
  }

  // Find or create feature flag
  let featureFlag = await context.entities.FeatureFlag.findUnique({
    where: { key: args.featureKey },
  });

  if (!featureFlag) {
    const featureDef = FEATURE_DEFINITIONS.find(f => f.key === args.featureKey);
    if (!featureDef) {
      throw new HttpError(404, 'Feature not found');
    }

    featureFlag = await context.entities.FeatureFlag.create({
      data: {
        key: args.featureKey,
        name: featureDef.name,
        description: featureDef.description,
        isGloballyEnabled: true,
        module: featureDef.module,
        category: featureDef.category,
        availableInFree: featureDef.availableInFree,
        availableInHobby: featureDef.availableInHobby,  
        availableInPro: featureDef.availableInPro,
      },
    });
  }

  // Upsert workspace override
  const override = await context.entities.WorkspaceFeatureOverride.upsert({
    where: {
      workspaceId_featureFlagId: {
        workspaceId: args.workspaceId,
        featureFlagId: featureFlag.id,
      },
    },
    update: {
      isEnabled: args.isEnabled,
    },
    create: {
      workspaceId: args.workspaceId,
      featureFlagId: featureFlag.id,
      isEnabled: args.isEnabled,
    },
  });

  return override;
};

/**
 * Get feature usage analytics for a workspace
 */
export const getWorkspaceFeatureAnalytics = async (
  args: { workspaceId: string; period?: 'day' | 'week' | 'month' },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId, period = 'week' } = args;

  // Check workspace access
  const member = await context.entities.WorkspaceMember.findFirst({
    where: {
      workspaceId,
      userId: context.user.id,
    },
  });

  if (!member && !context.user.isAdmin) {
    throw new HttpError(403, 'You do not have access to this workspace');
  }

  return getFeatureAnalyticsImpl(context, workspaceId, period);
};

/**
 * Get global feature adoption metrics (admin only)
 */
export const getGlobalFeatureAdoptionMetrics = async (
  _args: any,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  return getGlobalFeatureAdoptionImpl(context);
};

// ===== ENHANCED ANALYTICS OPERATIONS =====

/**
 * Get feature usage heatmap for a workspace
 */
export const getFeatureUsageHeatmap = async (
  args: { workspaceId: string; period?: 'day' | 'week' | 'month' },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId, period = 'month' } = args;

  // Check workspace access
  const member = await context.entities.WorkspaceMember.findFirst({
    where: {
      workspaceId,
      userId: context.user.id,
    },
  });

  if (!member && !context.user.isAdmin) {
    throw new HttpError(403, 'You do not have access to this workspace');
  }

  return getFeatureUsageHeatmapImpl(context, workspaceId, period);
};

/**
 * Get plan conversion funnel analytics (admin only)
 */
export const getPlanConversionFunnel = async (
  args: { period?: 'week' | 'month' | 'quarter' | 'year' },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { period = 'month' } = args;

  return getPlanConversionFunnelImpl(context, period);
};

/**
 * Get feature adoption trends over time (admin only)
 */
export const getFeatureAdoptionTrends = async (
  args: {
    featureKeys?: string[];
    period?: 'week' | 'month' | 'quarter';
    interval?: 'day' | 'week';
  },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  return getFeatureAdoptionTrendsImpl(context, args);
};

/**
 * Get feature usage dashboard (admin only)
 */
export const getFeatureUsageDashboard = async (
  args: { period?: 'day' | 'week' | 'month' },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { period = 'month' } = args;

  return getFeatureUsageDashboardImpl(context, period);
};