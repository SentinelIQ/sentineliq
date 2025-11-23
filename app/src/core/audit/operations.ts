import { HttpError } from 'wasp/server';
import type { AuditLogFilter, AuditLogQueryResult } from './types';
import { FeatureChecker } from '../features/FeatureChecker';

/**
 * Get audit logs for a workspace
 */
export const getAuditLogs = async (args: AuditLogFilter, context: any): Promise<AuditLogQueryResult> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const {
    workspaceId,
    userId,
    action,
    resource,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = args;

  // Verify user has access to this workspace
  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: context.user.id,
      workspaceId,
    },
  });

  if (!membership) {
    throw new HttpError(403, 'You do not have access to this workspace');
  }

  // Check if audit logging feature is available
  await FeatureChecker.requireFeature(context, workspaceId, 'core.audit_logging');

  const where: any = {
    workspaceId,
  };

  if (userId) {
    where.userId = userId;
  }

  if (action) {
    where.action = action;
  }

  if (resource) {
    where.resource = resource;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const [logs, total] = await Promise.all([
    context.entities.AuditLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    }),
    context.entities.AuditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    hasMore: offset + logs.length < total,
  };
};

/**
 * Get audit logs by resource
 */
export const getAuditLogsByResource = async (
  args: { workspaceId: string; resource: string; resourceId: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId, resource, resourceId } = args;

  // Verify user has access to this workspace
  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: context.user.id,
      workspaceId,
    },
  });

  if (!membership) {
    throw new HttpError(403, 'You do not have access to this workspace');
  }

  // Check if audit logging feature is available
  await FeatureChecker.requireFeature(context, workspaceId, 'core.audit_logging');

  const logs = await context.entities.AuditLog.findMany({
    where: {
      workspaceId,
      resource,
      resourceId,
    },
    include: {
      user: {
        select: {
          email: true,
          username: true,
        },
      },
    },
    orderBy: [
      { createdAt: 'desc' },
    ],
  });

  return logs;
};

/**
 * Export audit logs (CSV format)
 */
export const exportAuditLogs = async (
  args: { workspaceId: string; startDate?: Date; endDate?: Date },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { workspaceId, startDate, endDate } = args;

  // Verify user has access to this workspace (and is admin or owner)
  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: context.user.id,
      workspaceId,
      role: {
        in: ['OWNER', 'ADMIN'],
      },
    },
  });

  if (!membership) {
    throw new HttpError(403, 'You must be an admin or owner to export audit logs');
  }

  // Check if audit logging and data export features are available
  await FeatureChecker.requireFeature(context, workspaceId, 'core.audit_logging');
  await FeatureChecker.requireFeature(context, workspaceId, 'core.data_export');

  const where: any = {
    workspaceId,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const logs = await context.entities.AuditLog.findMany({
    where,
    include: {
      user: {
        select: {
          email: true,
          username: true,
        },
      },
    },
    orderBy: [
      { createdAt: 'desc' },
    ],
  });

  // Convert to CSV format
  const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Resource ID', 'Description', 'IP Address'];
  const rows = logs.map((log: any) => [
    log.createdAt.toISOString(),
    log.user?.email || log.user?.username || 'System',
    log.action,
    log.resource,
    log.resourceId || '',
    log.description,
    log.ipAddress || '',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(',')),
  ].join('\n');

  return {
    filename: `audit-logs-${workspaceId}-${new Date().toISOString().split('T')[0]}.csv`,
    content: csv,
    contentType: 'text/csv',
  };
};

/**
 * Get all audit logs across all workspaces (Admin only)
 */
export const getAllAuditLogsForAdmin = async (
  args: {
    workspaceId?: string;
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  },
  context: any
): Promise<AuditLogQueryResult> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const {
    workspaceId,
    userId,
    action,
    resourceType,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = args;

  const where: any = {};

  if (workspaceId) {
    where.workspaceId = workspaceId;
  }

  if (userId) {
    where.userId = userId;
  }

  if (action) {
    where.action = action;
  }

  if (resourceType) {
    where.resource = resourceType;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const [logs, total] = await Promise.all([
    context.entities.AuditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    }),
    context.entities.AuditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    hasMore: offset + logs.length < total,
  };
};
