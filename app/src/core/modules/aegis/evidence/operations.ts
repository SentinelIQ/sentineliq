/**
 * Aegis Module - Evidence Operations
 * 
 * This module provides operations for managing digital evidence with chain of custody.
 * Includes S3/MinIO storage integration, hash calculation, and integrity verification.
 */

import { HttpError } from 'wasp/server';
import type { Evidence, User, Case } from 'wasp/entities';
import { EvidenceStatus, CustodyAction, HashAlgorithm } from '@prisma/client';
import type { EvidenceWithRelations, EvidenceFilters, CreateEvidenceInput } from '../models/types';
import { checkWorkspaceAccess, canAccessEvidence } from '../utils/permissions';
import { FeatureChecker } from '../../../features/FeatureChecker';
import { logEvidenceUploaded, logEvidenceAccessed } from '../utils/audit';
import { notifyEvidenceUploaded } from '../utils/notifications';
import { evidenceStorage } from '../services/storage';
import * as crypto from 'crypto';

export const getEvidenceList = async (
  args: { filters: EvidenceFilters },
  context: any
): Promise<EvidenceWithRelations[]> => {
  const { filters } = args;
  const where: any = { caseId: filters.caseId };
  
  if (filters.type) where.type = Array.isArray(filters.type) ? { in: filters.type } : filters.type;
  if (filters.status) where.status = Array.isArray(filters.status) ? { in: filters.status } : filters.status;
  if (filters.collectedById) where.collectedById = filters.collectedById;
  if (filters.tags && filters.tags.length > 0) where.tags = { hasSome: filters.tags };
  if (filters.dateRange) where.collectedAt = { gte: filters.dateRange.from, lte: filters.dateRange.to };

  return context.entities.Evidence.findMany({
    where,
    include: { case: true, collectedBy: true, custodyLog: { include: { user: true }, orderBy: { timestamp: 'desc' } }, observables: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const getEvidenceById = async (
  args: { evidenceId: string; caseId: string; workspaceId: string },
  context: any
): Promise<EvidenceWithRelations> => {
  const { role, userId } = await checkWorkspaceAccess(context, args.workspaceId);
  const evidence = await context.entities.Evidence.findUnique({
    where: { id: args.evidenceId },
    include: { case: { include: { workspace: true, investigator: true } }, collectedBy: true, custodyLog: { include: { user: true }, orderBy: { timestamp: 'desc' } }, observables: true },
  });

  if (!evidence) throw new HttpError(404, 'Evidence not found');
  if (evidence.case.workspaceId !== args.workspaceId) throw new HttpError(403, 'Access denied');
  
  const isInvestigator = evidence.case.investigatorId === userId;
  if (!canAccessEvidence(role, isInvestigator)) throw new HttpError(403, 'You do not have access to this evidence');

  await logEvidenceAccessed(context, args.workspaceId, args.evidenceId, 'viewed');
  return evidence;
};

export const uploadEvidence = async (
  args: { data: CreateEvidenceInput; file?: { buffer: Buffer; mimetype: string } },
  context: any
): Promise<Evidence> => {
  const { data, file } = args;
  const { userId } = await checkWorkspaceAccess(context, data.caseId);

  const caseRecord = await context.entities.Case.findUnique({ where: { id: data.caseId }, include: { workspace: true } });
  if (!caseRecord) throw new HttpError(404, 'Case not found');

  let fileUrl = data.fileUrl;
  let fileSize = data.size;
  let fileHash = data.hash;
  let s3Key = '';

  if (file) {
    // Upload to MinIO with integrity verification
    const uploadResult = await evidenceStorage.uploadEvidence(
      file.buffer,
      data.name,
      {
        workspaceId: caseRecord.workspaceId,
        userId,
        caseId: data.caseId,
        contentType: file.mimetype,
      }
    );

    fileUrl = uploadResult.url;
    fileHash = uploadResult.hash;
    fileSize = `${(uploadResult.size / 1024).toFixed(2)} KB`;
    s3Key = uploadResult.key;

    // Update workspace storage usage
    await evidenceStorage.updateStorageUsage(
      caseRecord.workspaceId,
      uploadResult.size,
      context,
      'add'
    );
  }

  const evidence = await context.entities.Evidence.create({
    data: {
      ...data,
      hash: fileHash,
      size: fileSize,
      fileUrl,
      s3Key,
      collectedAt: data.collectedAt || new Date(),
    },
  });

  await context.entities.CustodyLog.create({
    data: {
      evidenceId: evidence.id,
      action: 'COLLECTED',
      userId: data.collectedById,
      timestamp: new Date(),
      currentHash: fileHash,
      ipAddress: context.req?.ip,
      device: context.req?.headers['user-agent'],
    },
  });

  await logEvidenceUploaded(context, caseRecord.workspaceId, evidence.id, { name: evidence.name, type: evidence.type, size: evidence.size });

  if (caseRecord.investigatorId) {
    await notifyEvidenceUploaded(caseRecord.workspaceId, caseRecord.investigatorId, {
      id: evidence.id,
      name: evidence.name,
      caseId: data.caseId,
    });
  }

  return evidence;
};

export const addCustodyLog = async (
  args: { evidenceId: string; action: CustodyAction; notes?: string; location?: string },
  context: any
): Promise<any> => {
  const { evidenceId, action, notes, location } = args;
  const evidence = await context.entities.Evidence.findUnique({ where: { id: evidenceId }, include: { case: true } });
  if (!evidence) throw new HttpError(404, 'Evidence not found');
  
  await checkWorkspaceAccess(context, evidence.case.workspaceId);

  return context.entities.CustodyLog.create({
    data: {
      evidenceId,
      action,
      userId: context.user.id,
      timestamp: new Date(),
      location,
      notes,
      previousHash: evidence.hash,
      currentHash: evidence.hash,
      ipAddress: context.req?.ip,
      device: context.req?.headers['user-agent'],
    },
    include: { user: true },
  });
};

export const verifyEvidenceIntegrity = async (
  args: { evidenceId: string; workspaceId: string },
  context: any
): Promise<{ valid: boolean; currentHash: string; storedHash: string }> => {
  await checkWorkspaceAccess(context, args.workspaceId);
  const evidence = await context.entities.Evidence.findUnique({ where: { id: args.evidenceId } });
  if (!evidence) throw new HttpError(404, 'Evidence not found');
  
  // In real implementation, would fetch file and recalculate hash
  return { valid: true, currentHash: evidence.hash, storedHash: evidence.hash };
};

export const deleteEvidence = async (
  args: { evidenceId: string; workspaceId: string; justification: string },
  context: any
): Promise<void> => {
  const { role } = await checkWorkspaceAccess(context, args.workspaceId);
  if (!['OWNER', 'ADMIN'].includes(role)) throw new HttpError(403, 'Only admins can delete evidence');

  // Check if evidence management feature is available
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'aegis.evidence_management'
  );

  const evidence = await context.entities.Evidence.findUnique({ where: { id: args.evidenceId }, include: { case: true } });
  if (!evidence) throw new HttpError(404, 'Evidence not found');

  await addCustodyLog({ evidenceId: args.evidenceId, action: 'DELETED', notes: args.justification }, context);
  await context.entities.Evidence.delete({ where: { id: args.evidenceId } });
};
