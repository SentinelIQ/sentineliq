import { HttpError } from 'wasp/server';
import { checkRateLimit, RATE_LIMITS } from '../../server/rateLimit';
import { sendMemberNotificationEmail, sendInvitationEmail } from './emails';
import type {
  GetUserWorkspaces,
  GetCurrentWorkspace,
  GetWorkspaceMembers,
  GetWorkspaceById,
  CheckSlugAvailability,
  CreateWorkspace,
  UpdateWorkspace,
  DeleteWorkspace,
  SwitchWorkspace,
  CompleteOnboarding,
  InviteMemberToWorkspace,
  RemoveMemberFromWorkspace,
  UpdateMemberRole,
  LeaveWorkspace,
  TransferWorkspaceOwnership,
  SendWorkspaceInvitation,
  AcceptWorkspaceInvitation,
  GetWorkspaceInvitations,
  GetWorkspaceUsage,
} from 'wasp/server/operations';
import crypto from 'crypto';
import { checkWorkspaceQuota, checkMemberQuota, getWorkspaceUsage as getUsage } from './quotas';
import { ensureArgsSchemaOrThrowHttpError } from '../../server/validation';
import * as z from 'zod';
import { workspaceEventBus } from '../audit/auditBus';
import { extractRequestContext } from '../../server/requestContext';
import { createLogger } from '../logs/logger';
import { StorageService } from '../../server/storage';
import { FeatureChecker } from '../features/FeatureChecker';

const logger = createLogger('workspace-operations');

// Validation Schemas
const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const updateWorkspaceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

const workspaceIdSchema = z.object({
  workspaceId: z.string(),
});

const inviteMemberSchema = z.object({
  workspaceId: z.string(),
  email: z.string().email(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).default('MEMBER'),
});

const removeMemberSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
});

const updateRoleSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

const transferOwnershipSchema = z.object({
  workspaceId: z.string(),
  newOwnerId: z.string(),
});

const sendInvitationSchema = z.object({
  workspaceId: z.string(),
  email: z.string().email(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).default('MEMBER'),
});

const acceptInvitationSchema = z.object({
  token: z.string(),
});

const checkSlugSchema = z.object({
  slug: z.string().min(1),
});

// Helper function to check workspace access
async function checkWorkspaceAccess(context: any, workspaceId: string, requiredRole?: string[]) {
  const member = await context.entities.WorkspaceMember.findFirst({
    where: {
      workspaceId,
      userId: context.user.id,
    },
    include: {
      workspace: true,
    },
  });

  if (!member) {
    throw new HttpError(403, 'You do not have access to this workspace');
  }

  if (requiredRole && !requiredRole.includes(member.role)) {
    throw new HttpError(403, 'Insufficient permissions');
  }

  return member;
}

// Queries
export const getUserWorkspaces: GetUserWorkspaces<void, any> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const memberships = await context.entities.WorkspaceMember.findMany({
    where: {
      userId: context.user.id,
      workspace: {
        isActive: true, // Only show active workspaces
      },
    },
    include: {
      workspace: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return memberships.map(m => m.workspace);
};

export const getAllWorkspacesForAdmin = async (_args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  // Admins can see all active workspaces
  const allWorkspaces = await context.entities.Workspace.findMany({
    where: {
      isActive: true,
    },
    include: {
      members: {
        select: {
          userId: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return allWorkspaces.map((w: any) => ({
    ...w,
    memberCount: w.members.length,
  }));
};

export const getCurrentWorkspace: GetCurrentWorkspace<void, any> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.currentWorkspaceId) {
    return null;
  }

  const member = await context.entities.WorkspaceMember.findFirst({
    where: {
      workspaceId: context.user.currentWorkspaceId,
      userId: context.user.id,
    },
    include: {
      workspace: true,
    },
  });

  if (!member) {
    return null;
  }

  return {
    ...member.workspace,
    userRole: member.role,
  };
};

export const getWorkspaceMembers: GetWorkspaceMembers<{ workspaceId: string }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId } = ensureArgsSchemaOrThrowHttpError(workspaceIdSchema, args);
  await checkWorkspaceAccess(context, workspaceId);

  return context.entities.WorkspaceMember.findMany({
    where: {
      workspaceId,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
};

export const getWorkspaceById: GetWorkspaceById<{ workspaceId: string }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId } = ensureArgsSchemaOrThrowHttpError(workspaceIdSchema, args);
  const member = await checkWorkspaceAccess(context, workspaceId);

  return {
    ...member.workspace,
    userRole: member.role,
  };
};

export const checkSlugAvailability: CheckSlugAvailability<{ slug: string }, { available: boolean }> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { slug } = ensureArgsSchemaOrThrowHttpError(checkSlugSchema, args);

  // Normalize slug
  const normalizedSlug = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!normalizedSlug) {
    return { available: false };
  }

  const existing = await context.entities.Workspace.findUnique({
    where: { slug: normalizedSlug },
  });

  return { available: !existing };
};

// Actions
export const createWorkspace: CreateWorkspace<any, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { name, description } = ensureArgsSchemaOrThrowHttpError(createWorkspaceSchema, args);

  // Validate name is not empty
  if (!name || name.trim().length === 0) {
    throw new HttpError(400, 'Workspace name is required');
  }

  if (name.length > 100) {
    throw new HttpError(400, 'Workspace name must be less than 100 characters');
  }

  // ✅ Rate limiting
  await checkRateLimit(`update_workspace:${context.user.id}`, RATE_LIMITS.UPDATE_WORKSPACE);
  // ✅ Check workspace quota
  await checkWorkspaceQuota(context, context.user.id);
  
  // 🚀 Feature check: Multi-workspace support (core feature)
  // Note: For Free plan users, this will be enforced by quota check above
  // This ensures Pro features like advanced workspace settings are gated

  // Generate base slug from name
  let baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  if (!baseSlug) {
    baseSlug = 'workspace';
  }

  // Check slug uniqueness and add suffix if needed
  let slug = baseSlug;
  let attempts = 0;
  let isUnique = false;

  while (!isUnique && attempts < 10) {
    const existing = await context.entities.Workspace.findUnique({
      where: { slug },
    });

    if (!existing) {
      isUnique = true;
    } else {
      attempts++;
      slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;
    }
  }

  // ✅ UUID fallback as last resort
  if (!isUnique) {
    const uuid = crypto.randomUUID().split('-')[0];
    slug = `${baseSlug}-${uuid}`;
    console.warn(`Using UUID fallback for workspace slug: ${slug}`);
  }

  const workspace = await context.entities.Workspace.create({
    data: {
      name: name.trim(),
      slug,
      description: description?.trim(),
      ownerId: context.user.id,
      members: {
        create: {
          userId: context.user.id,
          role: 'OWNER',
        },
      },
    },
  });

  // Always set as active workspace
  await context.entities.User.update({
    where: { id: context.user.id },
    data: { currentWorkspaceId: workspace.id },
  });

  return workspace;
};

export const updateWorkspace: UpdateWorkspace<any, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { id, name, description } = ensureArgsSchemaOrThrowHttpError(updateWorkspaceSchema, args);
  await checkWorkspaceAccess(context, id, ['OWNER', 'ADMIN']);

  // Validate name if provided
  if (name !== undefined) {
    if (!name || name.trim().length === 0) {
      throw new HttpError(400, 'Workspace name cannot be empty');
    }
    if (name.length > 100) {
      throw new HttpError(400, 'Workspace name must be less than 100 characters');
    }
  }

  return context.entities.Workspace.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() }),
    },
  });
};

export const deleteWorkspace: DeleteWorkspace<{ workspaceId: string }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId } = ensureArgsSchemaOrThrowHttpError(workspaceIdSchema, args);
  await checkWorkspaceAccess(context, workspaceId, ['OWNER']);

  // Update users who had this as active workspace
  await context.entities.User.updateMany({
    where: { currentWorkspaceId: workspaceId },
    data: { currentWorkspaceId: null },
  });

  // ✅ Soft delete: mark as inactive with deletion timestamp for garbage collection (30 days)
  const deletedWorkspace = await context.entities.Workspace.update({
    where: { id: workspaceId },
    data: { 
      isActive: false,
      deletedAt: new Date(), // Will be garbage collected after 30 days
    },
  });

  // ✅ Emit audit event
  await workspaceEventBus.emit({
    workspaceId,
    userId: context.user.id,
    eventType: 'workspace_deleted',
    data: {},
    context: extractRequestContext(context),
    audit: {
      action: 'WORKSPACE_DELETED',
      resource: 'workspace',
      resourceId: workspaceId,
      description: `${context.user.email} soft-deleted workspace "${deletedWorkspace.name}" (will be permanently deleted in 30 days)`,
      metadata: {
        workspaceName: deletedWorkspace.name,
        deletedAt: deletedWorkspace.deletedAt,
      },
    },
  });

  return deletedWorkspace;
};

export const restoreWorkspace = async (args: { workspaceId: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId } = ensureArgsSchemaOrThrowHttpError(workspaceIdSchema, args);

  // Check if user is owner of the workspace
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  if (workspace.ownerId !== context.user.id) {
    throw new HttpError(403, 'Only the owner can restore a workspace');
  }

  // Restore workspace
  return context.entities.Workspace.update({
    where: { id: workspaceId },
    data: { isActive: true },
  });
};

export const switchWorkspace: SwitchWorkspace<{ workspaceId: string }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId } = ensureArgsSchemaOrThrowHttpError(workspaceIdSchema, args);
  await checkWorkspaceAccess(context, workspaceId);

  return context.entities.User.update({
    where: { id: context.user.id },
    data: { currentWorkspaceId: workspaceId },
  });
};

export const completeOnboarding: CompleteOnboarding<void, any> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  return context.entities.User.update({
    where: { id: context.user.id },
    data: { hasCompletedOnboarding: true },
  });
};

export const inviteMemberToWorkspace: InviteMemberToWorkspace<any, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId, email, role } = ensureArgsSchemaOrThrowHttpError(inviteMemberSchema, args);
  await checkWorkspaceAccess(context, workspaceId, ['OWNER', 'ADMIN']);

  // 🚀 Feature check: Team collaboration
  await FeatureChecker.requireFeature(
    context,
    workspaceId,
    'core.team_collaboration'
  );

  // ✅ Rate limiting
  const { checkRateLimit, RATE_LIMITS } = require('../../server/rateLimit');
  await checkRateLimit(`invite_member:${context.user.id}`, RATE_LIMITS.INVITE_MEMBER);

  // ✅ Check member quota before inviting
  await checkMemberQuota(context, workspaceId);

  // Find user by email
  const invitedUser = await context.entities.User.findFirst({
    where: { email },
  });

  if (!invitedUser) {
    throw new HttpError(404, 'User with this email not found');
  }

  // Check if already a member
  const existingMember = await context.entities.WorkspaceMember.findFirst({
    where: {
      workspaceId,
      userId: invitedUser.id,
    },
  });

  if (existingMember) {
    throw new HttpError(400, 'User is already a member of this workspace');
  }

  const newMember = await context.entities.WorkspaceMember.create({
    data: {
      workspaceId,
      userId: invitedUser.id,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });

  // ✅ Emit event for audit log and notifications
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  await workspaceEventBus.emit({
    workspaceId,
    userId: context.user.id,
    eventType: 'member_added',
    data: {
      memberEmail: email,
      memberRole: role,
      invitedUserId: invitedUser.id,
    },
    context: extractRequestContext(context),
    audit: {
      action: 'MEMBER_ADDED',
      resource: 'member',
      resourceId: newMember.id,
      description: `${context.user.email || 'User'} invited ${email} as ${role}`,
      metadata: {
        memberRole: role,
        invitedUserEmail: email,
      },
    },
    notificationData: {
      type: 'INFO',
      title: 'New Member Added',
      message: `${email} has been added to ${workspace?.name || 'the workspace'} as ${role}`,
      link: `/workspace/members`,
    },
  });

  // ✅ Send email notification to the added member
  try {
    await sendMemberNotificationEmail({
      to: email,
      workspaceName: workspace?.name || 'the workspace',
      eventType: 'added',
      role,
    });
  } catch (error: any) {
    console.error('Failed to send member notification email:', error);
  }

  return newMember;
};

export const removeMemberFromWorkspace: RemoveMemberFromWorkspace<any, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId, userId } = ensureArgsSchemaOrThrowHttpError(removeMemberSchema, args);
  await checkWorkspaceAccess(context, workspaceId, ['OWNER', 'ADMIN']);

  // Cannot remove yourself
  if (userId === context.user.id) {
    throw new HttpError(400, 'Use leave workspace to remove yourself');
  }

  // Check member exists
  const member = await context.entities.WorkspaceMember.findFirst({
    where: { workspaceId, userId },
  });

  if (!member) {
    throw new HttpError(404, 'Member not found');
  }

  // Cannot remove owner
  if (member.role === 'OWNER') {
    throw new HttpError(400, 'Cannot remove workspace owner');
  }

  // Get user info before deletion
  const userToRemove = await context.entities.User.findUnique({
    where: { id: userId },
    select: { email: true, username: true },
  });

  await context.entities.WorkspaceMember.delete({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  // ✅ Emit event for audit log and notifications
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  await workspaceEventBus.emit({
    workspaceId,
    userId: context.user.id,
    eventType: 'member_removed',
    context: extractRequestContext(context),
    data: {
      removedUserId: userId,
      removedUserEmail: userToRemove?.email,
    },
    audit: {
      action: 'MEMBER_REMOVED',
      resource: 'member',
      resourceId: userId,
      description: `${context.user.email || 'User'} removed ${userToRemove?.email || 'a member'} from workspace`,
      metadata: {
        removedUserEmail: userToRemove?.email,
        removedUserName: userToRemove?.username,
      },
    },
    notificationData: {
      type: 'WARNING',
      title: 'Member Removed',
      message: `${userToRemove?.email || 'A member'} has been removed from ${workspace?.name || 'the workspace'}`,
      link: `/workspace/members`,
    },
  });

  // ✅ Send email notification to the removed member
  if (userToRemove?.email) {
    try {
      await sendMemberNotificationEmail({
        to: userToRemove.email,
        workspaceName: workspace?.name || 'the workspace',
        eventType: 'removed',
      });
    } catch (error: any) {
      console.error('Failed to send removal notification email:', error);
    }
  }

  return { success: true };
};

export const updateMemberRole: UpdateMemberRole<any, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId, userId, role } = ensureArgsSchemaOrThrowHttpError(updateRoleSchema, args);
  await checkWorkspaceAccess(context, workspaceId, ['OWNER', 'ADMIN']);

  return context.entities.WorkspaceMember.update({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    data: { role },
  });
};

export const leaveWorkspace: LeaveWorkspace<{ workspaceId: string }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId } = ensureArgsSchemaOrThrowHttpError(workspaceIdSchema, args);
  
  const member = await context.entities.WorkspaceMember.findFirst({
    where: {
      workspaceId,
      userId: context.user.id,
    },
  });

  if (!member) {
    throw new HttpError(404, 'You are not a member of this workspace');
  }

  if (member.role === 'OWNER') {
    throw new HttpError(400, 'Workspace owner cannot leave. Transfer ownership or delete workspace instead.');
  }

  await context.entities.WorkspaceMember.delete({
    where: {
      userId_workspaceId: {
        userId: context.user.id,
        workspaceId,
      },
    },
  });

  // Clear active workspace if leaving current one
  if (context.user.currentWorkspaceId === workspaceId) {
    await context.entities.User.update({
      where: { id: context.user.id },
      data: { currentWorkspaceId: null },
    });
  }

  return { success: true };
};

export const transferWorkspaceOwnership: TransferWorkspaceOwnership<any, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId, newOwnerId } = ensureArgsSchemaOrThrowHttpError(transferOwnershipSchema, args);

  // ✅ Rate limiting
  await checkRateLimit(`transfer_ownership:${context.user.id}`, RATE_LIMITS.UPDATE_WORKSPACE);

  // Validate caller is current OWNER
  const callerMember = await context.entities.WorkspaceMember.findFirst({
    where: {
      workspaceId,
      userId: context.user.id,
    },
  });

  if (!callerMember || callerMember.role !== 'OWNER') {
    throw new HttpError(403, 'Only workspace owner can transfer ownership');
  }

  // Validate new owner is a member
  const newOwnerMember = await context.entities.WorkspaceMember.findFirst({
    where: {
      workspaceId,
      userId: newOwnerId,
    },
    include: {
      user: {
        select: {
          email: true,
          username: true,
        },
      },
    },
  });

  if (!newOwnerMember) {
    throw new HttpError(404, 'New owner is not a member of this workspace');
  }

  if (!newOwnerMember.user.email) {
    throw new HttpError(400, 'New owner must have a verified email address');
  }

  // Cannot transfer to yourself
  if (newOwnerId === context.user.id) {
    throw new HttpError(400, 'You are already the owner');
  }

  // ✅ Create ownership transfer confirmation token (24 hours expiry)
  const confirmationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const requestContext = extractRequestContext(context);

  await context.entities.OwnershipTransferConfirmation.create({
    data: {
      token: confirmationToken,
      workspaceId,
      currentOwnerId: context.user.id,
      newOwnerId,
      expiresAt,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    },
  });

  // Get workspace info
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  // ✅ Send confirmation email to new owner
  const { sendOwnershipTransferConfirmationEmail } = require('./emails');
  try {
    await sendOwnershipTransferConfirmationEmail({
      to: newOwnerMember.user.email,
      workspaceName: workspace?.name || 'Unknown Workspace',
      currentOwnerEmail: context.user.email || 'Current Owner',
      confirmationToken,
    });

    logger.info('Ownership transfer confirmation email sent', {
      workspaceId,
      currentOwnerId: context.user.id,
      newOwnerId,
      token: confirmationToken.substring(0, 8) + '...',
    });
  } catch (error: any) {
    logger.error('Failed to send ownership transfer confirmation email:', error);
    throw new HttpError(500, 'Failed to send confirmation email. Please try again.');
  }

  // ✅ Emit audit event
  await workspaceEventBus.emit({
    workspaceId,
    userId: context.user.id,
    eventType: 'ownership_transfer_initiated',
    data: {},
    context: requestContext,
    audit: {
      action: 'OWNERSHIP_TRANSFERRED',
      resource: 'workspace',
      resourceId: workspaceId,
      description: `${context.user.email} initiated ownership transfer to ${newOwnerMember.user.email} (awaiting confirmation)`,
      metadata: {
        currentOwnerEmail: context.user.email,
        newOwnerEmail: newOwnerMember.user.email,
        confirmationToken: confirmationToken.substring(0, 8) + '...',
        expiresAt: expiresAt.toISOString(),
      },
    },
  });

  return {
    success: true,
    message: `Confirmation email sent to ${newOwnerMember.user.email}. Transfer will complete when confirmed.`,
    expiresAt,
  };
};

// ✅ Confirm Ownership Transfer (called when new owner clicks confirmation link)
export const confirmOwnershipTransfer = async (args: { token: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const tokenSchema = z.object({ token: z.string() });
  const { token } = ensureArgsSchemaOrThrowHttpError(tokenSchema, args);

  // Find confirmation request
  const confirmation = await context.entities.OwnershipTransferConfirmation.findUnique({
    where: { token },
    include: {
      workspace: {
        select: {
          name: true,
          ownerId: true,
        },
      },
    },
  });

  if (!confirmation) {
    throw new HttpError(404, 'Confirmation token not found or already used');
  }

  if (confirmation.confirmedAt) {
    throw new HttpError(400, 'This transfer has already been confirmed');
  }

  if (new Date() > confirmation.expiresAt) {
    throw new HttpError(400, 'Confirmation link has expired. Please request a new transfer.');
  }

  // Verify the current user is the new owner
  if (confirmation.newOwnerId !== context.user.id) {
    throw new HttpError(403, 'This confirmation is for a different user');
  }

  // Verify current ownership hasn't changed
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: confirmation.workspaceId },
  });

  if (!workspace || workspace.ownerId !== confirmation.currentOwnerId) {
    throw new HttpError(400, 'Workspace ownership has changed. Transfer is no longer valid.');
  }

  // 🔒 ATOMIC UPDATES: Sequential execution with error handling
  try {
    // 1. Upgrade new owner to OWNER first
    await context.entities.WorkspaceMember.update({
      where: {
        userId_workspaceId: {
          userId: confirmation.newOwnerId,
          workspaceId: confirmation.workspaceId,
        },
      },
      data: { role: 'OWNER' },
    });

    // 2. Downgrade current owner to ADMIN
    await context.entities.WorkspaceMember.update({
      where: {
        userId_workspaceId: {
          userId: confirmation.currentOwnerId,
          workspaceId: confirmation.workspaceId,
        },
      },
      data: { role: 'ADMIN' },
    });

    // 3. Update workspace ownerId field
    await context.entities.Workspace.update({
      where: { id: confirmation.workspaceId },
      data: { ownerId: confirmation.newOwnerId },
    });

    // 4. Mark confirmation as completed
    await context.entities.OwnershipTransferConfirmation.update({
      where: { id: confirmation.id },
      data: { confirmedAt: new Date() },
    });

    // Get user details for audit
    const [currentOwner, newOwner] = await Promise.all([
      context.entities.User.findUnique({
        where: { id: confirmation.currentOwnerId },
        select: { email: true },
      }),
      context.entities.User.findUnique({
        where: { id: confirmation.newOwnerId },
        select: { email: true },
      }),
    ]);

    // ✅ Emit event for audit log and notifications
    await workspaceEventBus.emit({
      workspaceId: confirmation.workspaceId,
      userId: context.user.id,
      eventType: 'ownership_transferred',
      data: {},
      context: extractRequestContext(context),
      audit: {
        action: 'OWNERSHIP_TRANSFERRED',
        resource: 'workspace',
        resourceId: confirmation.workspaceId,
        description: `Ownership transferred from ${currentOwner?.email} to ${newOwner?.email} (confirmed)`,
        metadata: {
          previousOwnerEmail: currentOwner?.email,
          newOwnerEmail: newOwner?.email,
          confirmedAt: new Date().toISOString(),
        },
      },
      notificationData: {
        type: 'INFO',
        title: 'Ownership Transferred',
        message: `${newOwner?.email} is now the owner of ${workspace?.name || 'the workspace'}`,
        link: `/workspace/members`,
      },
    });

    return { 
      success: true,
      message: 'Ownership transfer completed successfully',
      workspace: {
        id: confirmation.workspaceId,
        name: workspace?.name,
      },
    };
  } catch (error: any) {
    logger.error('Ownership transfer confirmation error:', error);
    throw new HttpError(500, 'Failed to complete ownership transfer. Please contact support.');
  }
};

// Workspace Invitations
export const sendWorkspaceInvitation: SendWorkspaceInvitation<any, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId, email, role } = ensureArgsSchemaOrThrowHttpError(sendInvitationSchema, args);
  await checkWorkspaceAccess(context, workspaceId, ['OWNER', 'ADMIN']);

  // ✅ Rate limiting
  await checkRateLimit(`accept_invitation:${context.user.id}`, RATE_LIMITS.ACCEPT_INVITATION);

  // Check if user already exists
  const existingUser = await context.entities.User.findFirst({
    where: { email },
  });

  if (existingUser) {
    // Check if already a member
    const existingMember = await context.entities.WorkspaceMember.findFirst({
      where: {
        workspaceId,
        userId: existingUser.id,
      },
    });

    if (existingMember) {
      throw new HttpError(400, 'User is already a member of this workspace');
    }

    // User exists but not a member - add directly instead of sending invitation
    return inviteMemberToWorkspace({ workspaceId, email, role }, context);
  }

  // ✅ Check if invitation already exists (prevent duplicates)
  const existingInvitation = await context.entities.WorkspaceInvitation.findFirst({
    where: {
      workspaceId,
      email,
      acceptedAt: null,
      expiresAt: {
        gt: new Date(), // Only check non-expired invitations
      },
    },
  });

  if (existingInvitation) {
    throw new HttpError(400, 'An active invitation has already been sent to this email. Please wait for it to expire or be accepted.');
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const invitation = await context.entities.WorkspaceInvitation.create({
    data: {
      email,
      role,
      token,
      expiresAt,
      workspaceId,
      invitedById: context.user.id,
    },
    include: {
      workspace: true,
    },
  });

  // ✅ Send invitation email via SMTP
  try {
    await sendInvitationEmail({
      to: email,
      workspaceName: invitation.workspace.name,
      invitedByEmail: context.user.email || 'A team member',
      inviteToken: token,
      role,
    });
  } catch (error: any) {
    console.error('Failed to send invitation email:', error);
    // Don't throw - invitation is created, email is optional
  }

  return invitation;
};

export const acceptWorkspaceInvitation: AcceptWorkspaceInvitation<any, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { token } = ensureArgsSchemaOrThrowHttpError(acceptInvitationSchema, args);

  // ✅ Rate limiting to prevent brute-force attacks on tokens
  await checkRateLimit(`accept_invitation:${context.user.id}`, RATE_LIMITS.ACCEPT_INVITATION);

  const invitation = await context.entities.WorkspaceInvitation.findUnique({
    where: { token },
    include: {
      workspace: true,
    },
  });

  if (!invitation) {
    throw new HttpError(404, 'Invitation not found or already used');
  }

  if (invitation.acceptedAt) {
    throw new HttpError(400, 'Invitation already accepted');
  }

  if (new Date() > invitation.expiresAt) {
    throw new HttpError(400, 'Invitation has expired');
  }

  // Verify email matches
  if (invitation.email !== context.user.email) {
    throw new HttpError(403, 'This invitation was sent to a different email address');
  }

  // Check if already a member
  const existingMember = await context.entities.WorkspaceMember.findFirst({
    where: {
      workspaceId: invitation.workspaceId,
      userId: context.user.id,
    },
  });

  if (existingMember) {
    throw new HttpError(400, 'You are already a member of this workspace');
  }

  // Create membership
  const member = await context.entities.WorkspaceMember.create({
    data: {
      workspaceId: invitation.workspaceId,
      userId: context.user.id,
      role: invitation.role,
    },
  });

  // Mark invitation as accepted
  await context.entities.WorkspaceInvitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date() },
  });

  // Set as active workspace if user has none
  if (!context.user.currentWorkspaceId) {
    await context.entities.User.update({
      where: { id: context.user.id },
      data: { currentWorkspaceId: invitation.workspaceId },
    });
  }

  // ✅ Emit event for audit log
  await workspaceEventBus.emit({
    workspaceId: invitation.workspaceId,
    userId: context.user.id,
    eventType: 'member_added',
    context: extractRequestContext(context),
    data: {
      memberEmail: context.user.email,
      memberRole: invitation.role,
      viaInvitation: true,
    },
    audit: {
      action: 'MEMBER_ADDED',
      resource: 'member',
      resourceId: member.id,
      description: `${context.user.email} accepted invitation and joined as ${invitation.role}`,
      metadata: {
        memberRole: invitation.role,
        invitationToken: token,
      },
    },
  });

  return {
    success: true,
    workspace: invitation.workspace,
  };
};

export const getWorkspaceInvitations: GetWorkspaceInvitations<{ workspaceId: string }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId } = ensureArgsSchemaOrThrowHttpError(workspaceIdSchema, args);
  await checkWorkspaceAccess(context, workspaceId, ['OWNER', 'ADMIN']);

  return context.entities.WorkspaceInvitation.findMany({
    where: {
      workspaceId,
      acceptedAt: null, // Only pending invitations
    },
    include: {
      invitedBy: {
        select: {
          email: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getWorkspaceUsage: GetWorkspaceUsage<{ workspaceId: string }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId } = ensureArgsSchemaOrThrowHttpError(workspaceIdSchema, args);
  await checkWorkspaceAccess(context, workspaceId);

  return getUsage(context, workspaceId);
};

// ✅ GDPR Data Export - Export all workspace data
export const exportWorkspaceData = async (args: { workspaceId: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId } = ensureArgsSchemaOrThrowHttpError(workspaceIdSchema, args);
  await checkWorkspaceAccess(context, workspaceId, ['OWNER', 'ADMIN']);

  // ✅ Rate limiting (prevent abuse)
  await checkRateLimit(`export_data:${context.user.id}`, RATE_LIMITS.UPDATE_WORKSPACE);

  // Fetch all workspace-related data
  const [workspace, members, auditLogs, notifications, invitations] = await Promise.all([
    context.entities.Workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        deletedAt: true,
      },
    }),
    context.entities.WorkspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
          },
        },
      },
    }),
    context.entities.AuditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limit to last 1000 entries
    }),
    context.entities.Notification.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 500, // Limit to last 500 notifications
    }),
    context.entities.WorkspaceInvitation.findMany({
      where: { workspaceId },
      include: {
        invitedBy: {
          select: {
            email: true,
            username: true,
          },
        },
      },
    }),
  ]);

  // ✅ Emit audit event
  await workspaceEventBus.emit({
    workspaceId,
    userId: context.user.id,
    eventType: 'data_exported',
    data: {},
    context: extractRequestContext(context),
    audit: {
      action: 'DATA_EXPORTED',
      resource: 'workspace',
      resourceId: workspaceId,
      description: `${context.user.email} exported workspace data for GDPR compliance`,
      metadata: {
        exportedAt: new Date().toISOString(),
        dataTypes: ['workspace', 'members', 'auditLogs', 'notifications', 'invitations'],
      },
    },
  });

  // Return structured JSON export
  return {
    exportedAt: new Date().toISOString(),
    exportedBy: {
      id: context.user.id,
      email: context.user.email,
    },
    workspace,
    members: members.map((m: any) => ({
      role: m.role,
      joinedAt: m.createdAt,
      user: m.user,
    })),
    auditLogs: auditLogs.map((log: any) => ({
      action: log.action,
      resource: log.resource,
      description: log.description,
      timestamp: log.createdAt,
      userId: log.userId,
      metadata: log.metadata,
    })),
    notifications: notifications.map((n: any) => ({
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt,
    })),
    invitations: invitations.map((inv: any) => ({
      email: inv.email,
      role: inv.role,
      invitedBy: inv.invitedBy,
      createdAt: inv.createdAt,
      acceptedAt: inv.acceptedAt,
      expiresAt: inv.expiresAt,
    })),
    totalRecords: {
      members: members.length,
      auditLogs: auditLogs.length,
      notifications: notifications.length,
      invitations: invitations.length,
    },
  };
};

// ✅ Workspace Branding Management
const updateBrandingSchema = z.object({
  workspaceId: z.string(),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
});

export const updateWorkspaceBranding = async (args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId, logoUrl, primaryColor, secondaryColor } = ensureArgsSchemaOrThrowHttpError(updateBrandingSchema, args);
  await checkWorkspaceAccess(context, workspaceId, ['OWNER', 'ADMIN']);

  // Check if custom branding feature is available
  await FeatureChecker.requireFeature(context, workspaceId, 'core.custom_branding');

  // ✅ Rate limiting
  await checkRateLimit(`update_branding:${context.user.id}`, RATE_LIMITS.UPDATE_WORKSPACE);

  // ✅ Get current workspace to check for old logo
  const currentWorkspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
  });

  // ✅ Delete old logo from storage if updating with a new one
  if (currentWorkspace?.logoUrl && logoUrl && currentWorkspace.logoUrl !== logoUrl) {
    try {
      const oldKey = StorageService.extractKeyFromUrl(currentWorkspace.logoUrl);
      
      if (oldKey) {
        await StorageService.deleteFile(oldKey, workspaceId);
        logger.info('Old logo deleted from storage', {
          workspaceId,
          oldKey,
          userId: context.user.id,
        });
      }
    } catch (error) {
      // Log but don't fail the update if deletion fails
      logger.warn('Failed to delete old logo', {
        workspaceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const updatedWorkspace = await context.entities.Workspace.update({
    where: { id: workspaceId },
    data: {
      logoUrl: logoUrl !== undefined ? logoUrl : undefined,
      primaryColor: primaryColor !== undefined ? primaryColor : undefined,
      secondaryColor: secondaryColor !== undefined ? secondaryColor : undefined,
    },
  });

  // ✅ Emit audit event
  await workspaceEventBus.emit({
    workspaceId,
    userId: context.user.id,
    eventType: 'workspace_updated',
    data: { logoUrl, primaryColor, secondaryColor },
    context: extractRequestContext(context),
    audit: {
      action: 'WORKSPACE_UPDATED',
      resource: 'workspace',
      resourceId: workspaceId,
      description: `${context.user.email} updated workspace branding`,
      metadata: {
        logoUrl,
        primaryColor,
        secondaryColor,
      },
    },
  });

  return updatedWorkspace;
};

// ============================================
// 📊 STORAGE QUOTA OPERATIONS
// ============================================

/**
 * Get storage statistics for a workspace
 */
export const getStorageStats = async (args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId } = ensureArgsSchemaOrThrowHttpError(workspaceIdSchema, args);

  // Check access
  await checkWorkspaceAccess(context, workspaceId);

  const stats = await StorageService.getStorageStats(workspaceId, context);

  logger.info('Storage stats retrieved', {
    component: 'workspace-operations',
    workspaceId,
    userId: context.user.id,
    stats,
  });

  return stats;
};

// ============================================
// 🔒 SESSION TIMEOUT OPERATIONS
// ============================================

const updateSessionTimeoutSchema = z.object({
  workspaceId: z.string(),
  sessionTimeout: z.number().min(300).max(86400), // 5 minutes to 24 hours
});

/**
 * Update workspace session timeout configuration
 * 
 * Only workspace owners and admins can update session timeout.
 * Session timeout is in seconds (default: 1800 = 30 minutes)
 */
export const updateWorkspaceSessionTimeout = async (args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId, sessionTimeout } = ensureArgsSchemaOrThrowHttpError(
    updateSessionTimeoutSchema,
    args
  );

  // Check if user is OWNER or ADMIN
  const member = await context.entities.WorkspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: context.user.id,
        workspaceId,
      },
    },
  });

  if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
    throw new HttpError(403, 'Only workspace owners and admins can update session timeout');
  }

  // Rate limit
  await checkRateLimit(context.user.id, RATE_LIMITS.UPDATE_WORKSPACE);

  // Update workspace
  const updatedWorkspace = await context.entities.Workspace.update({
    where: { id: workspaceId },
    data: { sessionTimeout },
  });

  logger.info('Workspace session timeout updated', {
    component: 'workspace-operations',
    workspaceId,
    userId: context.user.id,
    sessionTimeout,
  });

  // Emit event for audit
  await workspaceEventBus.emit({
    workspaceId,
    userId: context.user.id,
    eventType: 'workspace_updated',
    data: { sessionTimeout },
    context: extractRequestContext(context),
    audit: {
      action: 'WORKSPACE_SECURITY_UPDATED',
      resource: 'workspace',
      resourceId: workspaceId,
      description: `${context.user.email} updated session timeout to ${sessionTimeout} seconds`,
      metadata: {
        sessionTimeout,
        sessionTimeoutMinutes: Math.floor(sessionTimeout / 60),
      },
    },
  });

  return updatedWorkspace;
};

/**
 * Admin Operations - Get system-wide statistics
 */

/**
 * Get total workspace count (Admin only)
 */
export const getWorkspaceCount = async (_args: void, context: any): Promise<{ total: number; byPlan: Record<string, number> }> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const total = await context.entities.Workspace.count({
    where: {
      isActive: true,
    },
  });

  // Get count by plan
  const workspacesByPlan = await context.entities.Workspace.groupBy({
    by: ['subscriptionPlan'],
    where: {
      isActive: true,
    },
    _count: {
      id: true,
    },
  });

  const byPlan = workspacesByPlan.reduce((acc: Record<string, number>, item: any) => {
    acc[item.subscriptionPlan || 'free'] = item._count.id;
    return acc;
  }, {});

  return { total, byPlan };
};

/**
 * Get total system log count (Admin only)
 */
export const getSystemLogCount = async (_args: void, context: any): Promise<{ total: number; byLevel: Record<string, number> }> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  // Get total count
  const total = await context.entities.SystemLog.count();

  // Get count by level
  const logsByLevel = await context.entities.SystemLog.groupBy({
    by: ['level'],
    _count: {
      id: true,
    },
  });

  const byLevel = logsByLevel.reduce((acc: Record<string, number>, item: any) => {
    acc[item.level] = item._count.id;
    return acc;
  }, {});

  return { total, byLevel };
};

/**
 * Get total notification count (Admin only)
 */
export const getNotificationCount = async (_args: void, context: any): Promise<{ total: number; unread: number; failed: number }> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const total = await context.entities.Notification.count();

  const unread = await context.entities.Notification.count({
    where: {
      isRead: false,
    },
  });

  // Count failed notifications from delivery log
  const failed = await context.entities.NotificationDeliveryLog.count({
    where: {
      status: 'FAILED',
    },
  });

  return { total, unread, failed };
};

/**
 * Get contact messages count (Admin only)
 */
export const getContactMessagesCount = async (_args: void, context: any): Promise<{ total: number; unread: number }> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const total = await context.entities.ContactFormMessage.count();

  const unread = await context.entities.ContactFormMessage.count({
    where: {
      isRead: false,
    },
  });

  return { total, unread };
};

/**
 * Suspend or activate a workspace (Admin only)
 */
const suspendWorkspaceSchema = z.object({
  workspaceId: z.string(),
  suspend: z.boolean(),
  reason: z.string().optional(),
});

export const suspendWorkspace = async (args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { workspaceId, suspend, reason } = ensureArgsSchemaOrThrowHttpError(suspendWorkspaceSchema, args);

  const workspace = await context.entities.Workspace.update({
    where: { id: workspaceId },
    data: {
      isActive: !suspend,
    },
  });

  // Log to SystemLog for admin audit trail
  await context.entities.SystemLog.create({
    data: {
      level: 'INFO',
      message: `Admin ${suspend ? 'suspended' : 'activated'} workspace`,
      component: 'workspace-admin',
      metadata: {
        action: 'ADMIN_SUSPEND_WORKSPACE',
        adminId: context.user.id,
        workspaceId,
        workspaceName: workspace.name,
        suspend,
        reason: reason || 'No reason provided',
      },
    },
  });

  logger.info(`ADMIN_ACTION: Workspace ${suspend ? 'suspended' : 'activated'}`, {
    component: 'workspace-admin',
    adminId: context.user.id,
    workspaceId,
    suspend,
    reason,
  });

  return workspace;
};

/**
 * Get detailed workspace information (Admin only)
 */
const getWorkspaceDetailsSchema = z.object({
  workspaceId: z.string(),
});

export const getWorkspaceDetails = async (args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { workspaceId } = ensureArgsSchemaOrThrowHttpError(getWorkspaceDetailsSchema, args);

  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              isAdmin: true,
            },
          },
        },
      },
      invitations: {
        where: {
          expiresAt: {
            gte: new Date(),
          },
        },
      },
    },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  // Get usage stats
  const usage = await getUsage(workspaceId, context);

  // Get notification count for this workspace
  const notificationCount = await context.entities.Notification.count({
    where: { workspaceId },
  });

  // Get audit log count for this workspace
  const auditLogCount = await context.entities.AuditLog.count({
    where: { workspaceId },
  });

  return {
    ...workspace,
    usage,
    stats: {
      notificationCount,
      auditLogCount,
    },
  };
};

/**
 * Update workspace quotas (Admin only)
 */
const updateWorkspaceQuotasSchema = z.object({
  workspaceId: z.string(),
  storageQuotaBytes: z.number().positive().optional(),
  maxMembers: z.number().positive().optional(),
});

export const updateWorkspaceQuotas = async (args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { workspaceId, storageQuotaBytes, maxMembers } = ensureArgsSchemaOrThrowHttpError(updateWorkspaceQuotasSchema, args);

  const updateData: any = {};
  if (storageQuotaBytes !== undefined) {
    updateData.storageQuotaBytes = storageQuotaBytes;
  }
  if (maxMembers !== undefined) {
    updateData.maxMembers = maxMembers;
  }

  const workspace = await context.entities.Workspace.update({
    where: { id: workspaceId },
    data: updateData,
  });

  // Log to SystemLog for admin audit trail
  await context.entities.SystemLog.create({
    data: {
      level: 'INFO',
      message: 'Admin updated workspace quotas',
      component: 'workspace-admin',
      metadata: {
        action: 'ADMIN_UPDATE_QUOTAS',
        adminId: context.user.id,
        workspaceId,
        workspaceName: workspace.name,
        storageQuotaBytes,
        maxMembers,
      },
    },
  });

  logger.info('ADMIN_ACTION: Workspace quotas updated', {
    component: 'workspace-admin',
    adminId: context.user.id,
    workspaceId,
    storageQuotaBytes,
    maxMembers,
  });

  return workspace;
};
