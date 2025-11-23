/**
 * Aegis Module - RBAC Permission Helpers
 * 
 * This module provides permission checking functions for the Aegis security module.
 * It integrates with the workspace member roles (OWNER, ADMIN, MEMBER).
 */

import { HttpError } from 'wasp/server';
import { WorkspaceRole } from '@prisma/client';

/**
 * Check if user has access to a workspace
 */
export async function checkWorkspaceAccess(
  context: any,
  workspaceId: string
): Promise<{ role: WorkspaceRole; userId: string }> {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: context.user.id,
      workspaceId,
    },
  });

  if (!membership) {
    throw new HttpError(403, 'You do not have access to this workspace');
  }

  return {
    role: membership.role,
    userId: context.user.id,
  };
}

/**
 * Check if user is OWNER or ADMIN
 */
export async function requireAdminAccess(
  context: any,
  workspaceId: string
): Promise<void> {
  const { role } = await checkWorkspaceAccess(context, workspaceId);

  if (!['OWNER', 'ADMIN'].includes(role)) {
    throw new HttpError(403, 'Admin or Owner access required');
  }
}

/**
 * Check if user is OWNER
 */
export async function requireOwnerAccess(
  context: any,
  workspaceId: string
): Promise<void> {
  const { role } = await checkWorkspaceAccess(context, workspaceId);

  if (role !== 'OWNER') {
    throw new HttpError(403, 'Workspace owner access required');
  }
}

/**
 * Check if user can manage alerts (create, edit, delete)
 * OWNER/ADMIN: Full access
 * MEMBER: Can create and edit their own
 */
export function canManageAlert(role: WorkspaceRole, isAssigned: boolean = false): boolean {
  if (['OWNER', 'ADMIN'].includes(role)) {
    return true;
  }
  return isAssigned; // Members can only manage assigned alerts
}

/**
 * Check if user can manage incidents
 * OWNER/ADMIN: Full access
 * MEMBER: Can view and update assigned incidents
 */
export function canManageIncident(role: WorkspaceRole, isAssigned: boolean = false): boolean {
  if (['OWNER', 'ADMIN'].includes(role)) {
    return true;
  }
  return isAssigned; // Members can only manage assigned incidents
}

/**
 * Check if user can manage cases
 * OWNER/ADMIN: Full access
 * MEMBER: Can view and update cases they're investigating
 */
export function canManageCase(role: WorkspaceRole, isInvestigator: boolean = false): boolean {
  if (['OWNER', 'ADMIN'].includes(role)) {
    return true;
  }
  return isInvestigator; // Members can only manage cases they're investigating
}

/**
 * Check if user can delete resources
 * Only OWNER and ADMIN can delete
 */
export function canDelete(role: WorkspaceRole): boolean {
  return ['OWNER', 'ADMIN'].includes(role);
}

/**
 * Check if user can assign resources to others
 * Only OWNER and ADMIN can assign
 */
export function canAssign(role: WorkspaceRole): boolean {
  return ['OWNER', 'ADMIN'].includes(role);
}

/**
 * Check if user can access evidence
 * OWNER/ADMIN: Full access
 * MEMBER: Can access evidence from cases they're investigating
 */
export function canAccessEvidence(role: WorkspaceRole, isInvestigator: boolean = false): boolean {
  if (['OWNER', 'ADMIN'].includes(role)) {
    return true;
  }
  return isInvestigator;
}

/**
 * Check if user can export data
 * All authenticated users can export data they have access to
 */
export function canExport(role: WorkspaceRole): boolean {
  return ['OWNER', 'ADMIN', 'MEMBER'].includes(role);
}

/**
 * Verify user ownership or assignment
 */
export async function verifyUserAccess(
  context: any,
  workspaceId: string,
  resourceUserId?: string | null
): Promise<{ hasAccess: boolean; isOwner: boolean; role: WorkspaceRole }> {
  const { role, userId } = await checkWorkspaceAccess(context, workspaceId);

  const isOwner = resourceUserId === userId;
  const isAdmin = ['OWNER', 'ADMIN'].includes(role);
  const hasAccess = isAdmin || isOwner;

  return {
    hasAccess,
    isOwner,
    role,
  };
}

/**
 * Get permission context for a user in a workspace
 */
export async function getPermissionContext(
  context: any,
  workspaceId: string
): Promise<{
  userId: string;
  role: WorkspaceRole;
  canManageAlerts: boolean;
  canManageIncidents: boolean;
  canManageCases: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canExport: boolean;
}> {
  const { role, userId } = await checkWorkspaceAccess(context, workspaceId);

  return {
    userId,
    role,
    canManageAlerts: ['OWNER', 'ADMIN'].includes(role),
    canManageIncidents: ['OWNER', 'ADMIN'].includes(role),
    canManageCases: ['OWNER', 'ADMIN'].includes(role),
    canDelete: canDelete(role),
    canAssign: canAssign(role),
    canExport: canExport(role),
  };
}
