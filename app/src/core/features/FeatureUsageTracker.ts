/**
 * Feature Usage Tracker
 * 
 * Tracks feature usage and denial events for analytics and insights.
 * Integrates with DailyStats job and provides usage metrics per workspace.
 */

export interface FeatureUsageEvent {
  workspaceId: string;
  featureKey: string;
  userId: string;
  used: boolean; // true = allowed, false = denied
  timestamp: Date;
  reason?: string; // if denied: "Plan restriction", "Override disabled", etc
  metadata?: Record<string, any>;
}

export interface FeatureUsageStats {
  featureKey: string;
  totalAttempts: number;
  successfulUses: number;
  denials: number;
  denialRate: number; // percentage
  topDenialReasons: Array<{ reason: string; count: number }>;
  byPlan: Record<string, { attempts: number; successes: number }>;
}

/**
 * Track a feature usage attempt (success or denial)
 */
export async function trackFeatureUsage(
  context: any,
  event: Omit<FeatureUsageEvent, 'timestamp'>
): Promise<void> {
  try {
    // Store in AuditLog for compliance + analytics
    await context.entities.AuditLog.create({
      data: {
        workspaceId: event.workspaceId,
        userId: event.userId,
        action: event.used ? 'FEATURE_USED' : 'FEATURE_DENIED',
        resource: 'FEATURE',
        resourceId: event.featureKey,
        description: `Feature ${event.featureKey} ${event.used ? 'used' : 'denied'}: ${event.reason || 'No reason provided'}`,
        metadata: {
          featureKey: event.featureKey,
          used: event.used,
          reason: event.reason,
          ...event.metadata,
        },
        ipAddress: event.metadata?.ipAddress,
        userAgent: event.metadata?.userAgent,
      },
    });

    // Also increment counter in daily stats (for quick aggregation)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const statKey = `feature_${event.used ? 'used' : 'denied'}_${event.featureKey}`;
    
    // This will be aggregated by the daily stats job
    // For now, we log the event for future processing
    console.log('[FeatureUsage]', {
      featureKey: event.featureKey,
      workspaceId: event.workspaceId,
      used: event.used,
      reason: event.reason,
    });
  } catch (error) {
    // Don't throw - tracking shouldn't break main operation
    console.error('[FeatureUsage] Failed to track:', error);
  }
}

/**
 * Get feature usage statistics for a workspace
 */
export async function getFeatureUsageStats(
  context: any,
  workspaceId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    featureKey?: string;
  } = {}
): Promise<FeatureUsageStats[]> {
  const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const endDate = options.endDate || new Date();

  // Query AuditLog for feature usage events
  const logs = await context.entities.AuditLog.findMany({
    where: {
      workspaceId,
      action: { in: ['FEATURE_USED', 'FEATURE_DENIED'] },
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      ...(options.featureKey && {
        resourceId: options.featureKey,
      }),
    },
    include: {
      workspace: {
        select: {
          subscriptionPlan: true,
        },
      },
    },
  });

  // Aggregate by feature
  const statsMap = new Map<string, {
    attempts: number;
    successes: number;
    denials: number;
    denialReasons: Map<string, number>;
    byPlan: Map<string, { attempts: number; successes: number }>;
  }>();

  for (const log of logs) {
    const details = JSON.parse(log.details);
    const featureKey = details.featureKey || log.resourceId;
    
    if (!statsMap.has(featureKey)) {
      statsMap.set(featureKey, {
        attempts: 0,
        successes: 0,
        denials: 0,
        denialReasons: new Map(),
        byPlan: new Map(),
      });
    }

    const stats = statsMap.get(featureKey)!;
    const plan = log.workspace?.subscriptionPlan || 'free';
    
    stats.attempts++;
    
    if (log.action === 'FEATURE_USED') {
      stats.successes++;
    } else {
      stats.denials++;
      const reason = details.reason || 'Unknown';
      stats.denialReasons.set(reason, (stats.denialReasons.get(reason) || 0) + 1);
    }

    if (!stats.byPlan.has(plan)) {
      stats.byPlan.set(plan, { attempts: 0, successes: 0 });
    }
    
    const planStats = stats.byPlan.get(plan)!;
    planStats.attempts++;
    if (log.action === 'FEATURE_USED') {
      planStats.successes++;
    }
  }

  // Convert to array and calculate rates
  return Array.from(statsMap.entries()).map(([featureKey, stats]) => ({
    featureKey,
    totalAttempts: stats.attempts,
    successfulUses: stats.successes,
    denials: stats.denials,
    denialRate: stats.attempts > 0 ? (stats.denials / stats.attempts) * 100 : 0,
    topDenialReasons: Array.from(stats.denialReasons.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5), // Top 5 reasons
    byPlan: Object.fromEntries(
      Array.from(stats.byPlan.entries()).map(([plan, planStats]) => [
        plan,
        planStats,
      ])
    ),
  }));
}

/**
 * Get most used features across all workspaces (admin only)
 */
export async function getMostUsedFeatures(
  context: any,
  options: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<Array<{ featureKey: string; usageCount: number }>> {
  const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = options.endDate || new Date();
  const limit = options.limit || 20;

  // Aggregate feature usage across all workspaces
  const logs = await context.entities.AuditLog.groupBy({
    by: ['resourceId'],
    where: {
      action: 'FEATURE_USED',
      resource: 'FEATURE',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      resourceId: true,
    },
    orderBy: {
      _count: {
        resourceId: 'desc',
      },
    },
    take: limit,
  });

  return logs.map((log: any) => ({
    featureKey: log.resourceId,
    usageCount: log._count.resourceId,
  }));
}

/**
 * Get features with high denial rates (potential upgrade opportunities)
 */
export async function getHighDenialFeatures(
  context: any,
  options: {
    threshold?: number; // denial rate threshold (e.g., 0.5 = 50%)
    minAttempts?: number; // minimum attempts to consider
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<Array<{
  featureKey: string;
  denialRate: number;
  totalAttempts: number;
  denials: number;
  topWorkspaces: Array<{ workspaceId: string; denials: number }>;
}>> {
  const threshold = options.threshold || 0.5;
  const minAttempts = options.minAttempts || 10;
  const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = options.endDate || new Date();

  // Get all feature usage/denial events
  const logs = await context.entities.AuditLog.findMany({
    where: {
      action: { in: ['FEATURE_USED', 'FEATURE_DENIED'] },
      resource: 'FEATURE',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      resourceId: true,
      action: true,
      workspaceId: true,
    },
  });

  // Aggregate by feature
  const featureStats = new Map<string, {
    attempts: number;
    denials: number;
    workspaceDenials: Map<string, number>;
  }>();

  for (const log of logs) {
    const featureKey = log.resourceId;
    
    if (!featureStats.has(featureKey)) {
      featureStats.set(featureKey, {
        attempts: 0,
        denials: 0,
        workspaceDenials: new Map(),
      });
    }

    const stats = featureStats.get(featureKey)!;
    stats.attempts++;
    
    if (log.action === 'FEATURE_DENIED') {
      stats.denials++;
      stats.workspaceDenials.set(
        log.workspaceId,
        (stats.workspaceDenials.get(log.workspaceId) || 0) + 1
      );
    }
  }

  // Filter and format results
  return Array.from(featureStats.entries())
    .filter(([_, stats]) => {
      const denialRate = stats.denials / stats.attempts;
      return stats.attempts >= minAttempts && denialRate >= threshold;
    })
    .map(([featureKey, stats]) => ({
      featureKey,
      denialRate: stats.denials / stats.attempts,
      totalAttempts: stats.attempts,
      denials: stats.denials,
      topWorkspaces: Array.from(stats.workspaceDenials.entries())
        .map(([workspaceId, denials]) => ({ workspaceId, denials }))
        .sort((a, b) => b.denials - a.denials)
        .slice(0, 5), // Top 5 workspaces
    }))
    .sort((a, b) => b.denialRate - a.denialRate);
}
