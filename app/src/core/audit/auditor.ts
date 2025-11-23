import type { WorkspaceEvent } from './types';
import { createLogger } from '../logs/logger';
import { prisma } from 'wasp/server';

const logger = createLogger('auditor');

/**
 * Register the audit handler with the event bus
 */
export function registerAuditHandler(eventBus: any) {
  eventBus.onAny(async (event: WorkspaceEvent) => {
    // Only create audit log if audit data is provided
    if (!event.audit) {
      return;
    }

    try {
      await prisma.auditLog.create({
        data: {
          workspaceId: event.workspaceId,
          userId: event.userId || undefined,
          action: event.audit.action as any,
          resource: event.audit.resource,
          resourceId: event.audit.resourceId || undefined,
          description: event.audit.description,
          metadata: event.audit.metadata || undefined,
          ipAddress: event.context?.ipAddress || undefined,
          userAgent: event.context?.userAgent || undefined,
        },
      });

      logger.debug(`Audit log created for ${event.audit.action}`, {
        workspaceId: event.workspaceId,
        resource: event.audit.resource,
      });
    } catch (error: any) {
      logger.error('Failed to create audit log', {
        error: error.message,
        event: event.eventType,
      });
    }
  });
}

/**
 * Create a standalone audit log (without event bus)
 */
export async function createAuditLog(entry: {
  workspaceId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        workspaceId: entry.workspaceId,
        userId: entry.userId || undefined,
        action: entry.action as any,
        resource: entry.resource,
        resourceId: entry.resourceId || undefined,
        description: entry.description,
        metadata: entry.metadata || undefined,
        ipAddress: entry.ipAddress || undefined,
        userAgent: entry.userAgent || undefined,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create audit log', {
      error: error.message,
      workspaceId: entry.workspaceId,
    });
    throw error;
  }
}
