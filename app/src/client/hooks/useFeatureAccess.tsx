/**
 * useFeatureAccess - Client-side React Hook for Feature Checking
 * 
 * Provides easy feature access validation in React components.
 * Automatically fetches workspace features and provides utility functions.
 * 
 * @example
 * ```tsx
 * const { hasFeature, isLoading } = useFeatureAccess(workspaceId);
 * 
 * if (hasFeature('aegis.incident_management')) {
 *   return <IncidentButton />;
 * }
 * return <UpgradePrompt feature="aegis.incident_management" />;
 * ```
 */

import React, { useMemo } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getWorkspaceFeatures } from 'wasp/client/operations';
import { FEATURE_DEFINITIONS } from '../../core/features/features';

export interface UseFeatureAccessReturn {
  /**
   * Check if a feature is enabled for the workspace
   */
  hasFeature: (featureKey: string) => boolean;
  
  /**
   * Check if multiple features are all enabled
   */
  hasAllFeatures: (featureKeys: string[]) => boolean;
  
  /**
   * Check if any of the features are enabled
   */
  hasAnyFeature: (featureKeys: string[]) => boolean;
  
  /**
   * Get the feature object with metadata
   */
  getFeature: (featureKey: string) => WorkspaceFeature | undefined;
  
  /**
   * Get all enabled features
   */
  enabledFeatures: WorkspaceFeature[];
  
  /**
   * Get all features (including disabled)
   */
  allFeatures: WorkspaceFeature[];
  
  /**
   * Loading state
   */
  isLoading: boolean;
  
  /**
   * Error state
   */
  error: Error | null;
  
  /**
   * Workspace subscription plan
   */
  subscriptionPlan?: string;
  
  /**
   * Total feature count
   */
  totalFeatures: number;
  
  /**
   * Enabled feature count
   */
  enabledCount: number;
}

export interface WorkspaceFeature {
  id: string;
  key: string;
  name: string;
  description: string;
  module: string;
  category: string;
  isEnabled: boolean;
  isOverridden?: boolean;
  availableInPlan: boolean;
  availableInFree: boolean;
  availableInHobby: boolean;
  availableInPro: boolean;
}

/**
 * Hook to check feature access for a workspace
 */
export function useFeatureAccess(workspaceId: string | undefined): UseFeatureAccessReturn {
  const { data, isLoading, error } = useQuery(
    getWorkspaceFeatures,
    workspaceId ? { workspaceId } : undefined
  );

  const features = useMemo(() => {
    if (!data?.features) {
      return [];
    }
    // Map backend data to WorkspaceFeature interface
    return data.features.map((f: any) => ({
      ...f,
      availableInFree: f.availableInFree ?? false,
      availableInHobby: f.availableInHobby ?? false,
      availableInPro: f.availableInPro ?? false,
    })) as WorkspaceFeature[];
  }, [data]);

  const enabledFeatures = useMemo(() => {
    return features.filter(f => f.isEnabled);
  }, [features]);

  const featureMap = useMemo(() => {
    return new Map(features.map(f => [f.key, f]));
  }, [features]);

  const hasFeature = useMemo(() => {
    return (featureKey: string) => {
      const feature = featureMap.get(featureKey);
      return feature?.isEnabled ?? false;
    };
  }, [featureMap]);

  const hasAllFeatures = useMemo(() => {
    return (featureKeys: string[]) => {
      return featureKeys.every(key => hasFeature(key));
    };
  }, [hasFeature]);

  const hasAnyFeature = useMemo(() => {
    return (featureKeys: string[]) => {
      return featureKeys.some(key => hasFeature(key));
    };
  }, [hasFeature]);

  const getFeature = useMemo(() => {
    return (featureKey: string) => {
      return featureMap.get(featureKey);
    };
  }, [featureMap]);

  return {
    hasFeature,
    hasAllFeatures,
    hasAnyFeature,
    getFeature,
    enabledFeatures,
    allFeatures: features,
    isLoading,
    error: error as Error | null,
    subscriptionPlan: data?.features?.[0]?.subscriptionPlan,
    totalFeatures: data?.totalFeatures ?? 0,
    enabledCount: data?.enabledFeatures ?? 0,
  };
}

/**
 * Hook to get all feature definitions from code (no API call)
 */
export function useFeatureDefinitions() {
  return useMemo(() => ({
    all: FEATURE_DEFINITIONS,
    byModule: (module: string) => FEATURE_DEFINITIONS.filter(f => f.module === module),
    byCategory: (category: string) => FEATURE_DEFINITIONS.filter(f => f.category === category),
    byPlan: (plan: 'free' | 'hobby' | 'pro') => {
      const planField = `availableIn${plan.charAt(0).toUpperCase() + plan.slice(1)}` as 'availableInFree' | 'availableInHobby' | 'availableInPro';
      return FEATURE_DEFINITIONS.filter(f => f[planField]);
    },
    find: (featureKey: string) => FEATURE_DEFINITIONS.find(f => f.key === featureKey),
  }), []);
}

/**
 * Component props interface for feature-gated components
 */
export interface FeatureGatedProps {
  featureKey: string;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Component to conditionally render based on feature access
 * 
 * @example
 * ```tsx
 * <FeatureGate workspaceId={wsId} featureKey="aegis.incident_management">
 *   <IncidentManagement />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  workspaceId,
  featureKey,
  children,
  fallback = null,
  loading = null,
}: FeatureGatedProps & { workspaceId: string }) {
  const { hasFeature, isLoading } = useFeatureAccess(workspaceId);

  if (isLoading && loading) {
    return <>{loading}</>;
  }

  if (!hasFeature(featureKey)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
