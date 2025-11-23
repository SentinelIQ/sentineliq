/**
 * Feature Analytics Operations
 * 
 * Provides analytics and insights about feature usage across the platform.
 * Admin-only operations for monitoring feature adoption and identifying upgrade opportunities.
 */

import { HttpError } from 'wasp/server';
import {
  getFeatureUsageStats,
  getMostUsedFeatures,
  getHighDenialFeatures,
} from './FeatureUsageTracker';
import * as z from 'zod';
import { ensureArgsSchemaOrThrowHttpError } from '../../server/validation';

// Validation schemas
const featureUsageStatsSchema = z.object({
  workspaceId: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  featureKey: z.string().optional(),
});

const mostUsedFeaturesSchema = z.object({
  limit: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const highDenialFeaturesSchema = z.object({
  threshold: z.number().optional(),
  minAttempts: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * Get feature usage statistics for a workspace
 * Requires: Workspace member or admin
 */
export const getFeatureUsageStatsOp = async (rawArgs: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId, startDate, endDate, featureKey } = ensureArgsSchemaOrThrowHttpError(
    featureUsageStatsSchema,
    rawArgs
  );

  // Check workspace access
  const member = await context.entities.WorkspaceMember.findFirst({
    where: {
      workspaceId,
      userId: context.user.id,
    },
  });

  if (!member && !context.user.isAdmin) {
    throw new HttpError(403, 'Not authorized to view this workspace');
  }

  const options = {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    featureKey,
  };

  const stats = await getFeatureUsageStats(context, workspaceId, options);

  return stats;
};

/**
 * Get most used features across all workspaces
 * Requires: Admin
 */
export const getMostUsedFeaturesOp = async (rawArgs: any, context: any) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { limit, startDate, endDate } = ensureArgsSchemaOrThrowHttpError(
    mostUsedFeaturesSchema,
    rawArgs
  );

  const options = {
    limit,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  };

  const features = await getMostUsedFeatures(context, options);

  return features;
};

/**
 * Get features with high denial rates (upgrade opportunities)
 * Requires: Admin
 */
export const getHighDenialFeaturesOp = async (rawArgs: any, context: any) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { threshold, minAttempts, startDate, endDate } = ensureArgsSchemaOrThrowHttpError(
    highDenialFeaturesSchema,
    rawArgs
  );

  const options = {
    threshold,
    minAttempts,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  };

  const features = await getHighDenialFeatures(context, options);

  return features;
};
