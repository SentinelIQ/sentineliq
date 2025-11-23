/**
 * Aegis Module - MITRE ATT&CK Query Operations
 * 
 * Operations para consultar a base de dados MITRE ATT&CK
 * sincronizada diariamente pelo job de background
 */

import { HttpError } from 'wasp/server';
import type { MitreTactic, MitreTechnique } from '../models/types';
import { FeatureChecker } from '../../../features/FeatureChecker';

/**
 * Get all MITRE tactics
 */
export const getMitreTactics = async (
  args: { workspaceId: string },
  context: any
): Promise<MitreTactic[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  // 🚀 Check MITRE ATT&CK feature availability
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'mitre.attack_mapping'
  );

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
};

/**
 * Get techniques for a specific tactic
 */
export const getMitreTechniques = async (
  args: { tacticId: string; workspaceId: string },
  context: any
): Promise<MitreTechnique[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  // 🚀 Check MITRE TTP tracking feature availability
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'mitre.ttp_tracking'
  );

  const techniques = await context.entities.MitreTechnique.findMany({
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

  return techniques;
};

/**
 * Get sub-techniques for a technique
 */
export const getMitreSubtechniques = async (
  args: { techniqueId: string },
  context: any
): Promise<MitreTechnique[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  return context.entities.MitreTechnique.findMany({
    where: {
      parentId: args.techniqueId,
    },
    orderBy: { id: 'asc' },
  });
};

/**
 * Search techniques by name, ID, or description
 */
export const searchMitreTechniques = async (
  args: { query: string; limit?: number },
  context: any
): Promise<MitreTechnique[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

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
 */
export const getMitreByPlatform = async (
  args: { platform: string },
  context: any
): Promise<MitreTechnique[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

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
};

/**
 * Get techniques by data source
 */
export const getMitreByDataSource = async (
  args: { dataSource: string },
  context: any
): Promise<MitreTechnique[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

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
};

/**
 * Get MITRE statistics
 */
export const getMitreStats = async (args: { workspaceId: string }, context: any) => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  // 🚀 Check MITRE analytics feature availability
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'mitre.attack_analytics'
  );

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
};

/**
 * Get technique details with full hierarchy
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
};
