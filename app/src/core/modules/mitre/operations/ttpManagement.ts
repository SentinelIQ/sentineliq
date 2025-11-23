/**
 * MITRE Module - TTP Management Operations (Polymorphic)
 * 
 * Generic operations for managing TTPs across any resource type
 * Supports: Case, Alert, Incident, BrandInfringement, TimelineEvent, Eclipse, and future modules
 * 
 * ✅ Includes:
 * - Workspace isolation (multi-tenancy)
 * - Rate limiting (abuse prevention)  
 * - Audit logging (compliance)
 * - Feature-gated access based on subscription plans
 */

import { HttpError } from 'wasp/server';
import type { TTP } from 'wasp/entities';
import { TTPAuditService, type AuditContext } from '../services/AuditService';
import { TTPRateLimitService, RATE_LIMITS } from '../services/RateLimitService';
import { enforcePlanLimit } from '../../../payment/planLimits';
import { FeatureChecker } from '../../../features/FeatureChecker';

// ============================================
// Type Definitions
// ============================================

export type SupportedResourceType = 'CASE' | 'ALERT' | 'INCIDENT' | 'BRAND_INFRINGEMENT' | 'TIMELINE_EVENT' | 'ECLIPSE' | string;

export interface GetTTPsArgs {
  resourceId: string;
  resourceType: SupportedResourceType;
  workspaceId: string; // ✅ WORKSPACE ISOLATION
}

export interface LinkTTPArgs {
  resourceId: string;
  resourceType: SupportedResourceType;
  workspaceId: string; // ✅ WORKSPACE ISOLATION
  tacticId: string;
  tacticName: string;
  techniqueId: string;
  techniqueName: string;
  subtechniqueId?: string;
  subtechniqueName?: string;
  description?: string;
  confidence?: number;
  severity?: string;
}

export interface UnlinkTTPArgs {
  ttpId: string;
  workspaceId: string; // ✅ WORKSPACE ISOLATION
}

export interface UpdateTTPOccurrenceArgs {
  ttpId: string;
  workspaceId: string; // ✅ WORKSPACE ISOLATION
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get audit context from HTTP context
 */
function getAuditContext(context: any, workspaceId: string): AuditContext {
  return {
    userId: context.user?.id || 'unknown',
    workspaceId,
    userAgent: context.headers?.['user-agent'],
    ipAddress: context.headers?.['x-forwarded-for'] || 'unknown',
  };
}

// ============================================
// Query Operations
// ============================================

/**
 * Get TTPs for a specific resource
 * ✅ Includes rate limiting and workspace isolation
 * 🚀 Feature-gated access
 */
export const getTTPs = async (
  args: GetTTPsArgs,
  context: any
): Promise<TTP[]> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  // 🚀 Check MITRE TTP tracking feature availability
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'mitre.ttp_tracking'
  );

  // ✅ RATE LIMITING
  await TTPRateLimitService.enforceLimit(
    context.user.id,
    'getTTPs',
    RATE_LIMITS.references
  );

  // ✅ WORKSPACE ISOLATION
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: args.workspaceId },
    include: { members: true },
  });

  if (!workspace || !workspace.members.some((m: any) => m.userId === context.user.id)) {
    throw new HttpError(403, 'Not authorized to access this workspace');
  }

  return context.entities.TTP.findMany({
    where: {
      workspaceId: args.workspaceId,
      resourceId: args.resourceId,
      resourceType: args.resourceType,
    },
    orderBy: [{ tacticId: 'asc' }, { techniqueId: 'asc' }, { createdAt: 'desc' }],
  });
};

// ============================================
// Action Operations
// ============================================

/**
 * Link a TTP to a resource (polymorphic)
 * Creates new or increments occurrence count if already exists
 * ✅ Includes audit logging, rate limiting, and workspace isolation
 * 🚀 Feature-gated access
 */
export const linkTTP = async (
  args: LinkTTPArgs,
  context: any
): Promise<TTP> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  // 🚀 Check MITRE ATT&CK mapping feature availability
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'mitre.attack_mapping'
  );

  // ✅ RATE LIMITING
  await TTPRateLimitService.enforceLimit(
    context.user.id,
    'linkTTP',
    RATE_LIMITS.mutations
  );

  // ✅ PLAN LIMITS
  await enforcePlanLimit(
    context, 
    args.workspaceId, 
    'maxTTPsPerWorkspace',
    undefined,
    undefined,
    'mitre.attack_mapping'
  );

  // ✅ WORKSPACE ISOLATION
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: args.workspaceId },
    include: { members: true },
  });

  if (!workspace || !workspace.members.some((m: any) => m.userId === context.user.id)) {
    throw new HttpError(403, 'Not authorized to access this workspace');
  }

  // Check if TTP already exists for this resource
  const existing = await context.entities.TTP.findFirst({
    where: {
      workspaceId: args.workspaceId,
      resourceId: args.resourceId,
      resourceType: args.resourceType,
      techniqueId: args.techniqueId,
      subtechniqueId: args.subtechniqueId || null,
    },
  });

  const auditContext = getAuditContext(context, args.workspaceId);

  if (existing) {
    // Increment occurrence count
    const updated = await context.entities.TTP.update({
      where: { id: existing.id },
      data: {
        occurrenceCount: { increment: 1 },
        detectedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // ✅ AUDIT LOG
    await TTPAuditService.logTTPOccurrenceUpdated(
      auditContext,
      args.resourceId,
      args.resourceType,
      args.techniqueId,
      updated.occurrenceCount,
      context.entities
    );

    return updated;
  }

  // Create new TTP
  const created = await context.entities.TTP.create({
    data: {
      workspaceId: args.workspaceId,
      resourceId: args.resourceId,
      resourceType: args.resourceType,
      tacticId: args.tacticId,
      tacticName: args.tacticName,
      techniqueId: args.techniqueId,
      techniqueName: args.techniqueName,
      subtechniqueId: args.subtechniqueId,
      subtechniqueName: args.subtechniqueName,
      description: args.description,
      confidence: args.confidence,
      severity: args.severity,
      occurrenceCount: 1,
      detectedAt: new Date(),
      createdBy: context.user.id,
    },
  });

  // ✅ AUDIT LOG
  await TTPAuditService.logTTPLinked(
    auditContext,
    args.resourceId,
    args.resourceType,
    args.techniqueId,
    args.techniqueName,
    context.entities
  );

  // ✅ REAL-TIME NOTIFICATIONS
  try {
    await context.entities.Notification.create({
      data: {
        workspaceId: args.workspaceId,
        userId: context.user.id,
        title: `TTP Linked: ${args.techniqueName}`,
        message: `Technique ${args.techniqueName} (${args.techniqueId}) linked to ${args.resourceType}`,
        type: 'TTP_LINKED',
        data: {
          ttpId: created.id,
          resourceId: args.resourceId,
          resourceType: args.resourceType,
          techniqueId: args.techniqueId,
          techniqueName: args.techniqueName,
        },
      },
    });
  } catch (error) {
    console.error('[TTP] Error creating notification:', error);
    // Don't block operation on notification failure
  }

  return created;
};

/**
 * Unlink/delete a TTP from a resource
 * ✅ Includes audit logging, rate limiting, and workspace isolation
 */
export const unlinkTTP = async (
  args: UnlinkTTPArgs,
  context: any
): Promise<void> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  // 🚀 Check MITRE ATT&CK mapping feature availability
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'mitre.attack_mapping'
  );

  // ✅ RATE LIMITING
  await TTPRateLimitService.enforceLimit(
    context.user.id,
    'unlinkTTP',
    RATE_LIMITS.mutations
  );

  // ✅ WORKSPACE ISOLATION
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: args.workspaceId },
    include: { members: true },
  });

  if (!workspace || !workspace.members.some((m: any) => m.userId === context.user.id)) {
    throw new HttpError(403, 'Not authorized to access this workspace');
  }

  const ttp = await context.entities.TTP.findUnique({
    where: { id: args.ttpId },
  });

  if (!ttp) throw new HttpError(404, 'TTP not found');

  // Verify TTP belongs to workspace
  if (ttp.workspaceId !== args.workspaceId) {
    throw new HttpError(403, 'Not authorized to delete this TTP');
  }

  const deleted = await context.entities.TTP.delete({
    where: { id: args.ttpId },
  });

  // ✅ AUDIT LOG
  const auditContext = getAuditContext(context, args.workspaceId);
  await TTPAuditService.logTTPUnlinked(
    auditContext,
    ttp.resourceId,
    ttp.resourceType,
    ttp.techniqueId,
    ttp.techniqueName,
    context.entities
  );

  // ✅ REAL-TIME NOTIFICATIONS
  try {
    await context.entities.Notification.create({
      data: {
        workspaceId: args.workspaceId,
        userId: context.user.id,
        title: `TTP Unlinked: ${ttp.techniqueName}`,
        message: `Technique ${ttp.techniqueName} (${ttp.techniqueId}) unlinked from ${ttp.resourceType}`,
        type: 'TTP_UNLINKED',
        data: {
          ttpId: ttp.id,
          resourceId: ttp.resourceId,
          resourceType: ttp.resourceType,
          techniqueId: ttp.techniqueId,
          techniqueName: ttp.techniqueName,
        },
      },
    });
  } catch (error) {
    console.error('[TTP] Error creating notification:', error);
  }

  return deleted;
};

/**
 * Update TTP occurrence count
 * ✅ Includes audit logging, rate limiting, and workspace isolation
 */
export const updateTTPOccurrence = async (
  args: UpdateTTPOccurrenceArgs,
  context: any
): Promise<TTP> => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');

  // 🚀 Check MITRE TTP tracking feature availability
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'mitre.ttp_tracking'
  );

  // ✅ RATE LIMITING
  await TTPRateLimitService.enforceLimit(
    context.user.id,
    'updateTTPOccurrence',
    RATE_LIMITS.mutations
  );

  // ✅ WORKSPACE ISOLATION
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: args.workspaceId },
    include: { members: true },
  });

  if (!workspace || !workspace.members.some((m: any) => m.userId === context.user.id)) {
    throw new HttpError(403, 'Not authorized to access this workspace');
  }

  const ttp = await context.entities.TTP.findUnique({
    where: { id: args.ttpId },
  });

  if (!ttp) throw new HttpError(404, 'TTP not found');

  // Verify TTP belongs to workspace
  if (ttp.workspaceId !== args.workspaceId) {
    throw new HttpError(403, 'Not authorized to update this TTP');
  }

  const updated = await context.entities.TTP.update({
    where: { id: args.ttpId },
    data: {
      occurrenceCount: { increment: 1 },
      detectedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // ✅ AUDIT LOG
  const auditContext = getAuditContext(context, args.workspaceId);
  await TTPAuditService.logTTPOccurrenceUpdated(
    auditContext,
    ttp.resourceId,
    ttp.resourceType,
    ttp.techniqueId,
    updated.occurrenceCount,
    context.entities
  );

  return updated;
};
