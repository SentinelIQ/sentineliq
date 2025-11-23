import { HttpError } from 'wasp/server';
import type { LogFilter, LogQueryResult } from './types';
import { LOG_LEVEL_PRIORITY } from './levels';

/**
 * Get system logs with filtering (Admin only)
 */
export const getSystemLogs = async (args: LogFilter, context: any): Promise<LogQueryResult> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Only admins can view system logs');
  }

  const {
    level,
    component,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = args || {};

  const where: any = {};

  if (level) {
    where.level = level;
  }

  if (component) {
    where.component = component;
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
    context.entities.SystemLog.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    }),
    context.entities.SystemLog.count({ where }),
  ]);

  return {
    logs,
    total,
    hasMore: offset + logs.length < total,
  };
};
