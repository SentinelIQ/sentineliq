/**
 * Aegis Module - TTP Operations (MITRE ATT&CK)
 * 
 * This module provides operations for managing TTPs (Tactics, Techniques, and Procedures).
 */

import { HttpError } from 'wasp/server';
import type { TTP } from 'wasp/entities';
import type { MitreTactic, MitreTechnique } from '../models/types';
import { checkWorkspaceAccess } from '../utils/permissions';

export const getCaseTTPs = async (
  args: { caseId: string; workspaceId: string },
  context: any
): Promise<TTP[]> => {
  await checkWorkspaceAccess(context, args.workspaceId);
  
  const caseRecord = await context.entities.Case.findUnique({ where: { id: args.caseId } });
  if (!caseRecord || caseRecord.workspaceId !== args.workspaceId) {
    throw new HttpError(404, 'Case not found');
  }

  return context.entities.TTP.findMany({
    where: { caseId: args.caseId },
    orderBy: { createdAt: 'desc' },
  });
};

export const addTTP = async (
  args: {
    caseId: string;
    workspaceId: string;
    tacticId: string;
    tacticName: string;
    techniqueId: string;
    techniqueName: string;
    subtechniqueId?: string;
    subtechniqueName?: string;
    description?: string;
  },
  context: any
): Promise<TTP> => {
  await checkWorkspaceAccess(context, args.workspaceId);
  
  const caseRecord = await context.entities.Case.findUnique({ where: { id: args.caseId } });
  if (!caseRecord || caseRecord.workspaceId !== args.workspaceId) {
    throw new HttpError(404, 'Case not found');
  }

  // Check if TTP already exists
  const existing = await context.entities.TTP.findFirst({
    where: {
      caseId: args.caseId,
      tacticId: args.tacticId,
      techniqueId: args.techniqueId,
      subtechniqueId: args.subtechniqueId || null,
    },
  });

  if (existing) {
    // Increment occurrence count
    return context.entities.TTP.update({
      where: { id: existing.id },
      data: { occurrenceCount: existing.occurrenceCount + 1 },
    });
  }

  return context.entities.TTP.create({
    data: {
      caseId: args.caseId,
      tacticId: args.tacticId,
      tacticName: args.tacticName,
      techniqueId: args.techniqueId,
      techniqueName: args.techniqueName,
      subtechniqueId: args.subtechniqueId,
      subtechniqueName: args.subtechniqueName,
      description: args.description,
      occurrenceCount: 1,
      detectedAt: new Date(),
    },
  });
};

export const updateTTPOccurrence = async (
  args: { ttpId: string; workspaceId: string },
  context: any
): Promise<TTP> => {
  await checkWorkspaceAccess(context, args.workspaceId);
  
  const ttp = await context.entities.TTP.findUnique({ 
    where: { id: args.ttpId },
    include: { case: true },
  });
  
  if (!ttp) throw new HttpError(404, 'TTP not found');
  if (ttp.case.workspaceId !== args.workspaceId) throw new HttpError(403, 'Access denied');

  return context.entities.TTP.update({
    where: { id: args.ttpId },
    data: { occurrenceCount: ttp.occurrenceCount + 1 },
  });
};

// MITRE ATT&CK database queries
export const getMITRETactics = async (
  _args: unknown,
  context: any
): Promise<MitreTactic[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  return context.entities.MitreTactic.findMany({
    orderBy: { id: 'asc' },
    include: {
      _count: {
        select: { techniques: true },
      },
    },
  });
};

export const getMITRETechniques = async (
  args: { tacticId: string },
  context: any
): Promise<MitreTechnique[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  return context.entities.MitreTechnique.findMany({
    where: {
      tacticId: args.tacticId,
      parentId: null, // Only top-level techniques
    },
    include: {
      subtechniques: true,
      _count: {
        select: { subtechniques: true },
      },
    },
    orderBy: { id: 'asc' },
  });
};

export const searchTechniques = async (
  args: { query: string },
  context: any
): Promise<MitreTechnique[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  return context.entities.MitreTechnique.findMany({
    where: {
      OR: [
        { id: { contains: args.query, mode: 'insensitive' } },
        { name: { contains: args.query, mode: 'insensitive' } },
        { description: { contains: args.query, mode: 'insensitive' } },
      ],
    },
    include: {
      tactic: true,
      subtechniques: true,
    },
    take: 50,
  });
};
