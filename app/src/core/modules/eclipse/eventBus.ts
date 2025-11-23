import { notificationEventBus } from '../../notifications/eventBus';
import { notificationWebSocketServer } from '../../../server/notificationWebSocket';
import { createAuditLog } from '../../audit/auditor';
import type { WorkspaceEvent } from '../../notifications/types';
import { createLogger } from '../../logs/logger';

const logger = createLogger('eclipse-events');

/**
 * Eclipse-specific event types for real-time updates
 */
export type EclipseEventType =
  | 'eclipse.brand.created'
  | 'eclipse.brand.updated'
  | 'eclipse.brand.deleted'
  | 'eclipse.monitor.created'
  | 'eclipse.monitor.updated'
  | 'eclipse.monitor.status_changed'
  | 'eclipse.monitor.test_completed'
  | 'eclipse.alert.created'
  | 'eclipse.alert.escalated'
  | 'eclipse.alert.dismissed'
  | 'eclipse.alert.bulk_action'
  | 'eclipse.infringement.created'
  | 'eclipse.infringement.updated'
  | 'eclipse.infringement.status_changed'
  | 'eclipse.action.created'
  | 'eclipse.action.updated'
  | 'eclipse.action.status_changed'
  | 'eclipse.action.assigned';

/**
 * Eclipse event payload interface
 */
export interface EclipseEventPayload {
  eventType: EclipseEventType;
  workspaceId: string;
  userId?: string;
  resourceType: 'brand' | 'monitor' | 'alert' | 'infringement' | 'action';
  resourceId: string;
  data: any;
  metadata?: Record<string, any>;
}

/**
 * Emit an Eclipse event that triggers:
 * 1. Real-time WebSocket notification
 * 2. In-app notification (optional)
 * 3. Audit log (optional)
 */
export async function emitEclipseEvent(payload: EclipseEventPayload & {
  notification?: {
    title: string;
    message: string;
    link?: string;
    type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
  };
  audit?: {
    action: string;
    description: string;
    metadata?: Record<string, any>;
  };
  context?: {
    ipAddress?: string;
    userAgent?: string;
  };
}) {
  const { eventType, workspaceId, userId, resourceType, resourceId, data, notification, audit, context, metadata } = payload;

  try {
    // 1. Emit through notification event bus (handles in-app notifications)
    if (notification) {
      const workspaceEvent: WorkspaceEvent = {
        eventType,
        workspaceId,
        userId,
        data,
        notificationData: {
          title: notification.title,
          message: notification.message,
          type: (notification.type?.toUpperCase() || 'INFO') as 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL',
          link: notification.link,
        },
        context,
      };

      await notificationEventBus.emit(workspaceEvent);
    }

    // 1b. Create audit log if provided
    if (audit) {
      await createAuditLog({
        workspaceId,
        userId,
        action: audit.action,
        resource: resourceType,
        resourceId,
        description: audit.description,
        metadata: audit.metadata || metadata,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      });
    }

    // 2. Broadcast real-time update via WebSocket (for immediate UI updates)
    notificationWebSocketServer.broadcastToWorkspace(workspaceId, {
      type: 'eclipse_update',
      eventType,
      resourceType,
      resourceId,
      data,
      metadata,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`Eclipse event emitted: ${eventType}`, {
      workspaceId,
      resourceType,
      resourceId,
    });
  } catch (error: any) {
    logger.error(`Failed to emit Eclipse event: ${eventType}`, {
      error: error.message,
      workspaceId,
      resourceType,
      resourceId,
    });
  }
}

/**
 * Convenience functions for common Eclipse events
 */

export async function notifyBrandCreated(workspaceId: string, userId: string, brand: any, context?: any) {
  await emitEclipseEvent({
    eventType: 'eclipse.brand.created',
    workspaceId,
    userId,
    resourceType: 'brand',
    resourceId: brand.id,
    data: brand,
    notification: {
      title: 'Nova marca protegida',
      message: `Marca "${brand.name}" adicionada ao Eclipse`,
      link: `/modules/eclipse/brands/${brand.id}`,
      type: 'SUCCESS',
    },
    audit: {
      action: 'ECLIPSE_BRAND_CREATED',
      description: `Marca "${brand.name}" criada`,
      metadata: { brandName: brand.name, priority: brand.priority },
    },
    context,
  });
}

export async function notifyBrandUpdated(workspaceId: string, userId: string, brand: any, changes: any, context?: any) {
  await emitEclipseEvent({
    eventType: 'eclipse.brand.updated',
    workspaceId,
    userId,
    resourceType: 'brand',
    resourceId: brand.id,
    data: { brand, changes },
    audit: {
      action: 'ECLIPSE_BRAND_UPDATED',
      description: `Marca "${brand.name}" atualizada`,
      metadata: { brandName: brand.name, changes },
    },
    context,
  });
}

export async function notifyBrandDeleted(workspaceId: string, userId: string, brandId: string, brandName: string, context?: any) {
  await emitEclipseEvent({
    eventType: 'eclipse.brand.deleted',
    workspaceId,
    userId,
    resourceType: 'brand',
    resourceId: brandId,
    data: { brandId, brandName },
    notification: {
      title: 'Marca removida',
      message: `Marca "${brandName}" foi removida da proteção`,
      type: 'INFO',
    },
    audit: {
      action: 'ECLIPSE_BRAND_DELETED',
      description: `Marca "${brandName}" deletada`,
      metadata: { brandName },
    },
    context,
  });
}

export async function notifyMonitorStatusChanged(workspaceId: string, userId: string, monitor: any, newStatus: string, context?: any) {
  await emitEclipseEvent({
    eventType: 'eclipse.monitor.status_changed',
    workspaceId,
    userId,
    resourceType: 'monitor',
    resourceId: monitor.id,
    data: { monitor, newStatus },
    audit: {
      action: 'ECLIPSE_MONITOR_UPDATED',
      description: `Monitor "${monitor.source}" status alterado para ${newStatus}`,
      metadata: { monitorId: monitor.id, source: monitor.source, newStatus },
    },
    context,
  });
}

export async function notifyAlertCreated(workspaceId: string, alert: any, context?: any) {
  const severity = alert.severity || 'medium';
  const isCritical = severity === 'critical' || severity === 'high';

  await emitEclipseEvent({
    eventType: 'eclipse.alert.created',
    workspaceId,
    resourceType: 'alert',
    resourceId: alert.id,
    data: alert,
    notification: isCritical ? {
      title: `🚨 Alerta ${severity.toUpperCase()} detectado`,
      message: `Nova violação detectada: ${alert.title || 'Sem título'}`,
      link: `/modules/eclipse/detections/${alert.id}`,
      type: 'WARNING',
    } : undefined,
    audit: {
      action: 'ECLIPSE_ALERT_CREATED',
      description: `Alerta detectado: ${alert.title || 'Sem título'}`,
      metadata: { severity, url: alert.url, brandId: alert.brandId },
    },
    context,
  });
}

export async function notifyAlertEscalated(workspaceId: string, userId: string, alert: any, infringement: any, context?: any) {
  await emitEclipseEvent({
    eventType: 'eclipse.alert.escalated',
    workspaceId,
    userId,
    resourceType: 'alert',
    resourceId: alert.id,
    data: { alert, infringement },
    notification: {
      title: 'Alerta escalado para infração',
      message: `Alerta escalado: ${alert.title || 'Sem título'}`,
      link: `/modules/eclipse/infringements/${infringement.id}`,
      type: 'WARNING',
    },
    audit: {
      action: 'ECLIPSE_ALERT_ESCALATED',
      description: `Alerta escalado para infração: ${infringement.title}`,
      metadata: { alertId: alert.id, infringementId: infringement.id },
    },
    context,
  });
}

export async function notifyInfringementCreated(workspaceId: string, userId: string, infringement: any, context?: any) {
  await emitEclipseEvent({
    eventType: 'eclipse.infringement.created',
    workspaceId,
    userId,
    resourceType: 'infringement',
    resourceId: infringement.id,
    data: infringement,
    notification: {
      title: '⚠️ Nova infração registrada',
      message: `Infração: ${infringement.title}`,
      link: `/modules/eclipse/infringements/${infringement.id}`,
      type: 'WARNING',
    },
    audit: {
      action: 'ECLIPSE_INFRINGEMENT_CREATED',
      description: `Infração criada: ${infringement.title}`,
      metadata: { type: infringement.type, severity: infringement.severity },
    },
    context,
  });
}

export async function notifyActionCreated(workspaceId: string, userId: string, action: any, infringement: any, context?: any) {
  await emitEclipseEvent({
    eventType: 'eclipse.action.created',
    workspaceId,
    userId,
    resourceType: 'action',
    resourceId: action.id,
    data: { action, infringement },
    notification: {
      title: 'Ação criada',
      message: `Nova ação: ${action.actionType} - ${infringement.title}`,
      link: `/modules/eclipse/actions/${action.id}`,
      type: 'INFO',
    },
    audit: {
      action: 'ECLIPSE_ACTION_CREATED',
      description: `Ação criada: ${action.actionType}`,
      metadata: { actionType: action.actionType, infringementId: infringement.id },
    },
    context,
  });
}

export async function notifyActionAssigned(workspaceId: string, userId: string, action: any, assignedTo: string, assignedToUser: any, context?: any) {
  await emitEclipseEvent({
    eventType: 'eclipse.action.assigned',
    workspaceId,
    userId,
    resourceType: 'action',
    resourceId: action.id,
    data: { action, assignedTo, assignedToUser },
    notification: {
      title: 'Ação atribuída a você',
      message: `Ação "${action.actionType}" foi atribuída a você`,
      link: `/modules/eclipse/actions/${action.id}`,
      type: 'INFO',
    },
    audit: {
      action: 'ECLIPSE_ACTION_CREATED',
      description: `Ação atribuída a ${assignedToUser?.email || assignedTo}`,
      metadata: { actionId: action.id, assignedTo },
    },
    context,
  });
}

export async function notifyBulkActionCompleted(
  workspaceId: string,
  userId: string,
  resourceType: 'alert' | 'infringement' | 'action',
  action: string,
  count: number,
  context?: any
) {
  await emitEclipseEvent({
    eventType: 'eclipse.alert.bulk_action',
    workspaceId,
    userId,
    resourceType: resourceType,
    resourceId: 'bulk',
    data: { action, count },
    notification: {
      title: `Ação em massa concluída`,
      message: `${count} ${resourceType === 'alert' ? 'alertas' : resourceType === 'infringement' ? 'infrações' : 'ações'} ${action}`,
      type: 'SUCCESS',
    },
    audit: {
      action: 'ECLIPSE_ACTION_COMPLETED',
      description: `Ação em massa: ${action} em ${count} ${resourceType}s`,
      metadata: { resourceType, action, count },
    },
    context,
  });
}
