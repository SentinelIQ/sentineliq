import { type Prisma } from '@prisma/client';
import { type User } from 'wasp/entities';
import { HttpError, prisma } from 'wasp/server';
import { type GetPaginatedUsers, type UpdateIsUserAdminById } from 'wasp/server/operations';
import * as z from 'zod';
import { ensureArgsSchemaOrThrowHttpError } from '../../server/validation';
import { createLogger } from '../logs/logger';

const logger = createLogger('user-operations');

const updateUserAdminByIdInputSchema = z.object({
  id: z.string().nonempty(),
  isAdmin: z.boolean(),
});

type UpdateUserAdminByIdInput = z.infer<typeof updateUserAdminByIdInputSchema>;

export const updateIsUserAdminById: UpdateIsUserAdminById<UpdateUserAdminByIdInput, User> = async (
  rawArgs,
  context
) => {
  const { id, isAdmin } = ensureArgsSchemaOrThrowHttpError(updateUserAdminByIdInputSchema, rawArgs);

  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }

  const updatedUser = await context.entities.User.update({
    where: { id },
    data: { isAdmin },
  });

  // Log admin action
  logger.info('ADMIN_ACTION: User admin status updated', {
    component: 'user-operations',
    adminId: context.user.id,
    targetUserId: id,
    isAdmin,
    action: 'UPDATE_USER_ADMIN_STATUS',
  });

  // Create system log for audit trail
  await context.entities.SystemLog.create({
    data: {
      level: 'INFO',
      message: `Admin ${context.user.email || context.user.id} updated user admin status`,
      component: 'user-operations',
      metadata: {
        action: 'ADMIN_ACTION',
        adminId: context.user.id,
        adminEmail: context.user.email,
        targetUserId: id,
        targetUserEmail: updatedUser.email,
        isAdmin,
      },
    },
  });

  return updatedUser;
};

type GetPaginatedUsersOutput = {
  users: Pick<
    User,
    'id' | 'email' | 'username' | 'isAdmin'
  >[];
  totalPages: number;
};

const getPaginatorArgsSchema = z.object({
  skipPages: z.number(),
  filter: z.object({
    emailContains: z.string().nonempty().optional(),
    isAdmin: z.boolean().optional(),
  }),
});

type GetPaginatedUsersInput = z.infer<typeof getPaginatorArgsSchema>;

export const getPaginatedUsers: GetPaginatedUsers<GetPaginatedUsersInput, GetPaginatedUsersOutput> = async (
  rawArgs,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }

  const {
    skipPages,
    filter: { emailContains, isAdmin },
  } = ensureArgsSchemaOrThrowHttpError(getPaginatorArgsSchema, rawArgs);

  const pageSize = 10;

  const userPageQuery: Prisma.UserFindManyArgs = {
    skip: skipPages * pageSize,
    take: pageSize,
    where: {
      email: {
        contains: emailContains,
        mode: 'insensitive',
      },
      isAdmin,
    },
    select: {
      id: true,
      email: true,
      username: true,
      isAdmin: true,
    },
    orderBy: {
      username: 'asc',
    },
  };

  const [pageOfUsers, totalUsers] = await prisma.$transaction([
    context.entities.User.findMany(userPageQuery),
    context.entities.User.count({ where: userPageQuery.where }),
  ]);
  const totalPages = Math.ceil(totalUsers / pageSize);

  return {
    users: pageOfUsers,
    totalPages,
  };
};

/**
 * Suspend or activate a user (Admin only)
 * When suspended, user cannot login until reactivated
 */
const suspendUserSchema = z.object({
  userId: z.string().nonempty(),
  suspend: z.boolean(),
  reason: z.string().optional(),
});

export const suspendUser = async (rawArgs: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { userId, suspend, reason } = ensureArgsSchemaOrThrowHttpError(suspendUserSchema, rawArgs);

  // Prevent admin from suspending themselves
  if (userId === context.user.id) {
    throw new HttpError(400, 'Cannot suspend your own account');
  }

  const targetUser = await context.entities.User.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw new HttpError(404, 'User not found');
  }

  // Lock/unlock the user account
  const updatedUser = await context.entities.User.update({
    where: { id: userId },
    data: {
      lockedUntil: suspend ? new Date('2099-12-31') : null, // Far future date = locked
      loginAttempts: suspend ? 999 : 0, // High number = locked
    },
  });

  // Log admin action
  logger.info(`ADMIN_ACTION: User ${suspend ? 'suspended' : 'activated'}`, {
    component: 'user-operations',
    adminId: context.user.id,
    targetUserId: userId,
    suspend,
    reason,
  });

  await context.entities.SystemLog.create({
    data: {
      level: 'INFO',
      message: `Admin ${suspend ? 'suspended' : 'activated'} user account`,
      component: 'user-operations',
      metadata: {
        action: 'ADMIN_SUSPEND_USER',
        adminId: context.user.id,
        adminEmail: context.user.email,
        targetUserId: userId,
        targetUserEmail: updatedUser.email,
        suspend,
        reason: reason || 'No reason provided',
      },
    },
  });

  return updatedUser;
};

/**
 * Reset user's 2FA (Admin only)
 * Emergency function when user loses access to 2FA device
 */
const resetUser2FASchema = z.object({
  userId: z.string().nonempty(),
});

export const resetUser2FA = async (rawArgs: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { userId } = ensureArgsSchemaOrThrowHttpError(resetUser2FASchema, rawArgs);

  const targetUser = await context.entities.User.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw new HttpError(404, 'User not found');
  }

  const updatedUser = await context.entities.User.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    },
  });

  logger.info('ADMIN_ACTION: User 2FA reset', {
    component: 'user-operations',
    adminId: context.user.id,
    targetUserId: userId,
  });

  await context.entities.SystemLog.create({
    data: {
      level: 'INFO',
      message: 'Admin reset user 2FA',
      component: 'user-operations',
      metadata: {
        action: 'ADMIN_RESET_2FA',
        adminId: context.user.id,
        adminEmail: context.user.email,
        targetUserId: userId,
        targetUserEmail: updatedUser.email,
        was2FAEnabled: targetUser.twoFactorEnabled,
      },
    },
  });

  return { success: true };
};

/**
 * Force user to reset password on next login (Admin only)
 */
const resetUserPasswordSchema = z.object({
  userId: z.string().nonempty(),
});

export const resetUserPassword = async (rawArgs: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { userId } = ensureArgsSchemaOrThrowHttpError(resetUserPasswordSchema, rawArgs);

  const targetUser = await context.entities.User.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw new HttpError(404, 'User not found');
  }

  // Revoke all refresh tokens to force re-login
  await context.entities.RefreshToken.deleteMany({
    where: { userId },
  });

  logger.info('ADMIN_ACTION: User password reset forced', {
    component: 'user-operations',
    adminId: context.user.id,
    targetUserId: userId,
  });

  await context.entities.SystemLog.create({
    data: {
      level: 'INFO',
      message: 'Admin forced user password reset',
      component: 'user-operations',
      metadata: {
        action: 'ADMIN_RESET_PASSWORD',
        adminId: context.user.id,
        adminEmail: context.user.email,
        targetUserId: userId,
        targetUserEmail: targetUser.email,
        tokensRevoked: true,
      },
    },
  });

  return { success: true, message: 'User will be required to reset password on next login' };
};

/**
 * Get all workspaces a user belongs to (Admin only)
 */
const getUserWorkspacesSchema = z.object({
  userId: z.string().nonempty(),
});

export const getUserWorkspaces = async (rawArgs: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { userId } = ensureArgsSchemaOrThrowHttpError(getUserWorkspacesSchema, rawArgs);

  const memberships = await context.entities.WorkspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          isActive: true,
        },
      },
    },
  });

  return memberships.map((m: any) => ({
    workspaceId: m.workspaceId,
    role: m.role,
    joinedAt: m.joinedAt,
    workspace: m.workspace,
  }));
};

/**
 * Get user activity (recent audit logs) (Admin only)
 */
const getUserActivitySchema = z.object({
  userId: z.string().nonempty(),
  limit: z.number().positive().optional().default(50),
});

export const getUserActivity = async (rawArgs: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { userId, limit } = ensureArgsSchemaOrThrowHttpError(getUserActivitySchema, rawArgs);

  const auditLogs = await context.entities.AuditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      resource: true,
      resourceId: true,
      createdAt: true,
      metadata: true,
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return auditLogs;
};

/**
 * Delete user with cascade (Admin only)
 * WARNING: This is a destructive operation
 */
const deleteUserCascadeSchema = z.object({
  userId: z.string().nonempty(),
  confirmEmail: z.string().email(),
});

export const deleteUserCascade = async (rawArgs: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { userId, confirmEmail } = ensureArgsSchemaOrThrowHttpError(deleteUserCascadeSchema, rawArgs);

  // Prevent admin from deleting themselves
  if (userId === context.user.id) {
    throw new HttpError(400, 'Cannot delete your own account');
  }

  const targetUser = await context.entities.User.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw new HttpError(404, 'User not found');
  }

  // Email confirmation check
  if (targetUser.email !== confirmEmail) {
    throw new HttpError(400, 'Email confirmation does not match');
  }

  // Log before deletion
  await context.entities.SystemLog.create({
    data: {
      level: 'WARN',
      message: 'Admin deleted user account',
      component: 'user-operations',
      metadata: {
        action: 'ADMIN_DELETE_USER',
        adminId: context.user.id,
        adminEmail: context.user.email,
        targetUserId: userId,
        targetUserEmail: targetUser.email,
        deletedAt: new Date(),
      },
    },
  });

  logger.warn('ADMIN_ACTION: User deleted', {
    component: 'user-operations',
    adminId: context.user.id,
    targetUserId: userId,
    targetUserEmail: confirmEmail,
  });

  // Delete user (cascade will handle related records via Prisma schema)
  await context.entities.User.delete({
    where: { id: userId },
  });

  return { success: true, message: `User ${confirmEmail} has been permanently deleted` };
};
