import { HttpError } from 'wasp/server';
import { FEATURE_DEFINITIONS } from './features';
import { trackFeatureUsage } from './FeatureUsageTracker';

/**
 * FeatureChecker - Utility class for checking feature availability
 * 
 * This utility provides methods to check if features are enabled for workspaces,
 * taking into account:
 * - Code-defined feature flags (primary source)
 * - Plan-based availability  
 * - Workspace-specific overrides (optional database overrides)
 * 
 * Features are primarily defined in code, with optional database overrides.
 */
export class FeatureChecker {
  
  /**
   * Get feature definition from code (not database)
   */
  private static getFeatureDefinition(featureKey: string) {
    return FEATURE_DEFINITIONS.find(f => f.key === featureKey);
  }

  /**
   * Check if a feature is enabled for a specific workspace
   * 
   * @param context Wasp context with entities
   * @param workspaceId ID of the workspace to check
   * @param featureKey Feature key (e.g., "aegis.sla_tracking")
   * @returns Promise<boolean> Whether the feature is enabled
   */
  static async isEnabled(
    context: any,
    workspaceId: string,
    featureKey: string
  ): Promise<boolean> {
    try {
      // 1. Get feature definition from CODE (not database)
      const featureDefinition = this.getFeatureDefinition(featureKey);
      
      if (!featureDefinition) {
        console.warn(`Feature ${featureKey} not found in code definitions`);
        return false;
      }

      // 2. Check workspace override first (if exists in database)
      try {
        const override = await context.entities.WorkspaceFeatureOverride.findFirst({
          where: {
            workspaceId,
            featureFlag: {
              key: featureKey
            }
          }
        });
        
        if (override) {
          return override.isEnabled;
        }
      } catch (error) {
        // Database override doesn't exist or table doesn't exist - that's OK
        // We continue with code-based checking
      }
      
      // 3. No override, check plan availability from CODE definition
      const workspace = await context.entities.Workspace.findUnique({
        where: { id: workspaceId },
        select: { subscriptionPlan: true }
      });
      
      if (!workspace) {
        return false;
      }
      
      const plan = workspace.subscriptionPlan || 'free';
      const planField = `availableIn${plan.charAt(0).toUpperCase() + plan.slice(1)}` as keyof typeof featureDefinition;
      
      return Boolean(featureDefinition[planField]);
    } catch (error) {
      // Log error but don't throw - defensive programming
      console.error(`FeatureChecker.isEnabled error for ${featureKey}:`, error);
      return false;
    }
  }
  
  /**
   * Require that a feature is enabled, throw error if not
   * 
   * @param context Wasp context with entities
   * @param workspaceId ID of the workspace to check
   * @param featureKey Feature key (e.g., "aegis.sla_tracking")
   * @param errorMessage Custom error message (optional)
   * @throws HttpError 403 if feature is not enabled
   */
  static async requireFeature(
    context: any,
    workspaceId: string,
    featureKey: string,
    errorMessage?: string
  ): Promise<void> {
    const enabled = await this.isEnabled(context, workspaceId, featureKey);
    
    // 📊 Track feature usage (success or denial)
    const reason = enabled ? undefined : await this.getDenialReason(context, workspaceId, featureKey);
    
    await trackFeatureUsage(context, {
      workspaceId,
      featureKey,
      userId: context.user?.id,
      used: enabled,
      reason,
      metadata: {
        ipAddress: context.req?.ip,
        userAgent: context.req?.headers?.['user-agent'],
      },
    });
    
    if (!enabled) {
      // Get feature name from code definition for better error messages
      const featureDefinition = this.getFeatureDefinition(featureKey);
      const featureName = featureDefinition?.name || featureKey;
      
      throw new HttpError(
        403, 
        errorMessage || `Feature '${featureName}' is not enabled for this workspace`
      );
    }
  }
  
  /**
   * Get the reason why a feature is denied
   */
  private static async getDenialReason(
    context: any,
    workspaceId: string,
    featureKey: string
  ): Promise<string> {
    const featureDefinition = this.getFeatureDefinition(featureKey);
    
    if (!featureDefinition) {
      return 'Feature not found in code definitions';
    }

    // Check workspace plan
    const workspace = await context.entities.Workspace.findUnique({
      where: { id: workspaceId },
      select: { subscriptionPlan: true }
    });
    
    if (!workspace) {
      return 'Workspace not found';
    }

    const plan = workspace.subscriptionPlan || 'free';
    const planField = `availableIn${plan.charAt(0).toUpperCase() + plan.slice(1)}` as keyof typeof featureDefinition;
    
    if (!featureDefinition[planField]) {
      return `Plan restriction - feature requires ${this.getRequiredPlan(featureDefinition)} plan`;
    }

    // Check for workspace override
    try {
      const override = await context.entities.WorkspaceFeatureOverride.findFirst({
        where: {
          workspaceId,
          featureFlag: {
            key: featureKey
          }
        }
      });
      
      if (override && !override.isEnabled) {
        return 'Disabled by workspace administrator';
      }
    } catch (error) {
      // Override table might not exist
    }

    return 'Unknown reason';
  }
  
  /**
   * Get the minimum required plan for a feature
   */
  private static getRequiredPlan(feature: any): string {
    if (feature.availableInFree) return 'Free';
    if (feature.availableInHobby) return 'Hobby';
    if (feature.availableInPro) return 'Pro';
    return 'Unknown';
  }
  
  /**
   * Check multiple features at once
   * 
   * @param context Wasp context with entities
   * @param workspaceId ID of the workspace to check
   * @param featureKeys Array of feature keys to check
   * @returns Promise<Record<string, boolean>> Map of feature key to enabled status
   */
  static async checkMultiple(
    context: any,
    workspaceId: string,
    featureKeys: string[]
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    // Check all features in parallel
    const promises = featureKeys.map(async (key) => ({
      key,
      enabled: await this.isEnabled(context, workspaceId, key)
    }));
    
    const results_array = await Promise.all(promises);
    
    // Convert to object
    for (const result of results_array) {
      results[result.key] = result.enabled;
    }
    
    return results;
  }
  
  /**
   * Get all enabled features for a workspace (from code definitions)
   * 
   * @param context Wasp context with entities
   * @param workspaceId ID of the workspace to check
   * @param module Optional module filter
   * @returns Promise<Record<string, string[]>> Map of module to enabled feature keys
   */
  static async getEnabledFeatures(
    context: any,
    workspaceId: string,
    module?: string
  ): Promise<Record<string, string[]>> {
    try {
      // Get workspace plan
      const workspace = await context.entities.Workspace.findUnique({
        where: { id: workspaceId },
        select: { subscriptionPlan: true }
      });
      
      if (!workspace) {
        return {};
      }

      const plan = workspace.subscriptionPlan || 'free';
      
      // Filter features by module if specified
      const features = module 
        ? FEATURE_DEFINITIONS.filter(f => f.module === module)
        : FEATURE_DEFINITIONS;
      
      const enabledByModule: Record<string, string[]> = {};
      
      for (const feature of features) {
        // Check if enabled for this workspace
        const isEnabled = await this.isEnabled(context, workspaceId, feature.key);
        
        if (isEnabled) {
          if (!enabledByModule[feature.module]) {
            enabledByModule[feature.module] = [];
          }
          enabledByModule[feature.module].push(feature.key);
        }
      }
      
      return enabledByModule;
    } catch (error) {
      console.error('FeatureChecker.getEnabledFeatures error:', error);
      return {};
    }
  }
  
  /**
   * Check if a feature exists (in code definitions)
   * 
   * @param featureKey Feature key to check
   * @returns boolean Whether the feature exists in code
   */
  static exists(featureKey: string): boolean {
    return !!this.getFeatureDefinition(featureKey);
  }

  /**
   * Get all feature definitions from code
   * 
   * @param module Optional module filter
   * @returns Array of feature definitions
   */
  static getAllFeatures(module?: string) {
    return module 
      ? FEATURE_DEFINITIONS.filter(f => f.module === module)
      : FEATURE_DEFINITIONS;
  }
}