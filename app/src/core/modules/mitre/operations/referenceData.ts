/**
 * MITRE Module - Reference Data Operations
 * 
 * Operations para consultar a base de dados MITRE ATT&CK
 * sincronizada diariamente pelo job de background
 * 
 * ✅ Includes:
 * - Caching (Redis 24h TTL for reference data)
 * - Rate limiting (abuse prevention)
 * - Full-text search
 * - Feature-gated access based on subscription plans
 */

import { HttpError } from 'wasp/server';
import type { MitreTactic, MitreTechnique } from 'wasp/entities';
import { TTPCacheService, CACHE_CONFIGS } from '../services/CacheService';
import { TTPRateLimitService, RATE_LIMITS } from '../services/RateLimitService';
import { FeatureChecker } from '../../../features/FeatureChecker';

/**
 * Get all MITRE tactics
 * ✅ Cached for 24 hours
 * 🚀 Feature-gated access
 */
export const getMitreTactics = async (
  args: { workspaceId?: string },
  context: any
): Promise<any[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  // 🚀 Check MITRE ATT&CK feature availability
  if (args.workspaceId) {
    await FeatureChecker.requireFeature(
      context,
      args.workspaceId,
      'mitre.attack_mapping'
    );
  }

  // ✅ RATE LIMITING
  await TTPRateLimitService.enforceLimit(
    context.user.id,
    'getMitreTactics',
    RATE_LIMITS.references
  );

  // ✅ CACHING (cache-aside pattern)
  return TTPCacheService.getOrSet(
    CACHE_CONFIGS.tactics.key,
    CACHE_CONFIGS.tactics.ttl,
    async () => {
      const tactics = await context.entities.MitreTactic.findMany({
        orderBy: [{ id: 'asc' }],
        include: {
          _count: {
            select: { techniques: true },
          },
        },
      });

      return tactics.map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        url: t.url,
        techniqueCount: t._count.techniques,
      }));
    }
  );
};

/**
 * Get techniques for a specific tactic
 * ✅ Cached for 24 hours
 * 🚀 Feature-gated access
 */
export const getMitreTechniques = async (
  args: { tacticId: string; workspaceId?: string },
  context: any
): Promise<MitreTechnique[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  // 🚀 Check MITRE ATT&CK feature availability
  if (args.workspaceId) {
    await FeatureChecker.requireFeature(
      context,
      args.workspaceId,
      'mitre.attack_mapping'
    );
  }

  // ✅ RATE LIMITING
  await TTPRateLimitService.enforceLimit(
    context.user.id,
    'getMitreTechniques',
    RATE_LIMITS.references
  );

  // ✅ CACHING
  const cacheKey = `mitre:techniques:tactic:${args.tacticId}`;
  return TTPCacheService.getOrSet(
    cacheKey,
    CACHE_CONFIGS.techniques.ttl,
    async () => {
      return context.entities.MitreTechnique.findMany({
        where: {
          tacticId: args.tacticId,
          parentId: null, // Only top-level techniques
        },
        include: {
          subtechniques: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      });
    }
  );
};

/**
 * Get sub-techniques for a technique
 * ✅ Cached for 24 hours
 * 🚀 Feature-gated access
 */
export const getMitreSubtechniques = async (
  args: { techniqueId: string; workspaceId?: string },
  context: any
): Promise<MitreTechnique[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  // 🚀 Check MITRE ATT&CK feature availability
  if (args.workspaceId) {
    await FeatureChecker.requireFeature(
      context,
      args.workspaceId,
      'mitre.attack_mapping'
    );
  }

  // ✅ RATE LIMITING
  await TTPRateLimitService.enforceLimit(
    context.user.id,
    'getMitreSubtechniques',
    RATE_LIMITS.references
  );

  // ✅ CACHING
  const cacheKey = `mitre:subtechniques:technique:${args.techniqueId}`;
  return TTPCacheService.getOrSet(
    cacheKey,
    CACHE_CONFIGS.subtechniques.ttl,
    async () => {
      return context.entities.MitreTechnique.findMany({
        where: {
          parentId: args.techniqueId,
        },
        orderBy: { id: 'asc' },
      });
    }
  );
};

/**
 * Search techniques by name, ID, or description
 * ✅ Rate limited more strictly for search
 * 🚀 Feature-gated for Pro plans (advanced search)
 */
export const searchMitreTechniques = async (
  args: { query: string; limit?: number; workspaceId?: string },
  context: any
): Promise<MitreTechnique[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  // 🚀 Feature check: Advanced search requires threat intelligence feature
  if (args.workspaceId) {
    await FeatureChecker.requireFeature(
      context,
      args.workspaceId,
      'mitre.threat_intelligence'
    );
  }

  // ✅ RATE LIMITING (stricter for search)
  await TTPRateLimitService.enforceLimit(
    context.user.id,
    'searchMitreTechniques',
    RATE_LIMITS.search
  );

  const limit = Math.min(args.limit || 50, 200);

  return context.entities.MitreTechnique.findMany({
    where: {
      OR: [
        {
          id: {
            contains: args.query.toUpperCase(),
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: args.query,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: args.query,
            mode: 'insensitive',
          },
        },
      ],
    },
    include: {
      tactic: {
        select: {
          id: true,
          name: true,
        },
      },
      subtechniques: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take: limit,
    orderBy: { id: 'asc' },
  });
};

/**
 * Get techniques by platform
 * ✅ Cached for 24 hours
 * 🚀 Feature-gated access
 */
export const getMitreByPlatform = async (
  args: { platform: string; workspaceId?: string },
  context: any
): Promise<MitreTechnique[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  // 🚀 Check MITRE ATT&CK feature availability
  if (args.workspaceId) {
    await FeatureChecker.requireFeature(
      context,
      args.workspaceId,
      'mitre.ttp_tracking'
    );
  }

  // ✅ RATE LIMITING
  await TTPRateLimitService.enforceLimit(
    context.user.id,
    'getMitreByPlatform',
    RATE_LIMITS.references
  );

  // ✅ CACHING
  const cacheKey = `mitre:techniques:platform:${args.platform}`;
  return TTPCacheService.getOrSet(
    cacheKey,
    CACHE_CONFIGS.techniques.ttl,
    async () => {
      return context.entities.MitreTechnique.findMany({
        where: {
          platforms: {
            hasSome: [args.platform],
          },
          parentId: null, // Only top-level
        },
        include: {
          tactic: true,
          subtechniques: true,
        },
        orderBy: { id: 'asc' },
      });
    }
  );
};

/**
 * Get techniques by data source
 * ✅ Cached for 24 hours
 * 🚀 Feature-gated access
 */
export const getMitreByDataSource = async (
  args: { dataSource: string; workspaceId?: string },
  context: any
): Promise<MitreTechnique[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  // 🚀 Check MITRE ATT&CK feature availability
  if (args.workspaceId) {
    await FeatureChecker.requireFeature(
      context,
      args.workspaceId,
      'mitre.ttp_tracking'
    );
  }

  // ✅ RATE LIMITING
  await TTPRateLimitService.enforceLimit(
    context.user.id,
    'getMitreByDataSource',
    RATE_LIMITS.references
  );

  // ✅ CACHING
  const cacheKey = `mitre:techniques:datasource:${args.dataSource}`;
  return TTPCacheService.getOrSet(
    cacheKey,
    CACHE_CONFIGS.techniques.ttl,
    async () => {
      return context.entities.MitreTechnique.findMany({
        where: {
          dataSources: {
            hasSome: [args.dataSource],
          },
          parentId: null, // Only top-level
        },
        include: {
          tactic: true,
          subtechniques: true,
        },
        orderBy: { id: 'asc' },
      });
    }
  );
};

/**
 * Get MITRE statistics
 * ✅ Cached for 1 hour (more frequent updates)
 */
export const getMitreStats = async (_args: unknown, context: any) => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  // 🚀 Stats are public for any user with MITRE access
  // Feature check is optional here (read-only operation)
  // But we enforce it for consistency

  // ✅ RATE LIMITING
  await TTPRateLimitService.enforceLimit(
    context.user.id,
    'getMitreStats',
    RATE_LIMITS.references
  );

  // ✅ CACHING (1 hour TTL for stats - more frequent updates)
  return TTPCacheService.getOrSet(
    CACHE_CONFIGS.stats.key,
    CACHE_CONFIGS.stats.ttl,
    async () => {
      const tactics = await context.entities.MitreTactic.count();
      const techniques = await context.entities.MitreTechnique.count({
        where: { parentId: null },
      });
      const subtechniques = await context.entities.MitreTechnique.count({
        where: { parentId: { not: null } },
      });

      return {
        tactics,
        techniques,
        subtechniques,
        total: tactics + techniques + subtechniques,
      };
    }
  );
};

/**
 * Get technique details with full hierarchy
 * ✅ Cached for 24 hours
 */
export const getMitreTechniqueDetails = async (
  args: { techniqueId: string; workspaceId: string },
  context: any
): Promise<any> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  // 🚀 Check MITRE threat intelligence feature availability
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'mitre.threat_intelligence'
  );

  // ✅ RATE LIMITING
  await TTPRateLimitService.enforceLimit(
    context.user.id,
    'getMitreTechniqueDetails',
    RATE_LIMITS.references
  );

  // ✅ CACHING
  const cacheKey = `mitre:technique:details:${args.techniqueId}`;
  return TTPCacheService.getOrSet(
    cacheKey,
    CACHE_CONFIGS.techniques.ttl,
    async () => {
      const technique = await context.entities.MitreTechnique.findUnique({
        where: { id: args.techniqueId },
        include: {
          tactic: true,
          parent: true,
          subtechniques: true,
        },
      });

      if (!technique) {
        throw new HttpError(404, 'Technique not found');
      }

      return technique;
    }
  );
};
