/**
 * Aegis Module - Notification Helpers
 * 
 * This module provides helper functions to send notifications for Aegis events.
 * It integrates with the existing notification system (in-app, email, WebSocket, providers).
 */

import type { AegisEventType } from '../models/types';
import { prisma } from 'wasp/server';

/**
 * Create in-app notification using existing system
 */
async function sendNotification(data: {
  userId: string;
  workspaceId: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  link?: string;
  eventType: AegisEventType;
  metadata?: any;
}): Promise<void> {
  try {
    // Get Prisma context - this is used internally by Wasp operations

    await prisma.notification.create({
      data: {
        userId: data.userId,
        workspaceId: data.workspaceId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        eventType: data.eventType,
        metadata: data.metadata,
      },
    });
  } catch (error) {
    console.error('[Aegis] Failed to create notification:', error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Broadcast WebSocket message to workspace
 */
export function broadcastToWorkspace(
  workspaceId: string,
  eventType: string,
  data: any
): void {
  try {
    const wsServer = (global as any).__notificationWebSocketServer;

    if (wsServer && wsServer.notifyWorkspace) {
      wsServer.notifyWorkspace(workspaceId, {
        type: eventType,
        data,
      });
    }
  } catch (error) {
    console.error('[Aegis] Failed to broadcast WebSocket message:', error);
  }
}
export async function notifyAlertCreated(
  workspaceId: string,
  userId: string,
  alertData: {
    id: string;
    title: string;
    severity: string;
  }
): Promise<void> {
  await sendNotification({
    userId,
    workspaceId,
    type: alertData.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
    title: 'New Security Alert',
    message: `A new ${alertData.severity.toLowerCase()} alert has been created: ${alertData.title}`,
    link: `/modules/aegis/alerts/${alertData.id}`,
    eventType: 'alert_created' as any,
    metadata: {
      alertId: alertData.id,
      severity: alertData.severity,
    },
  });

  // Broadcast to workspace via WebSocket
  broadcastToWorkspace(workspaceId, 'aegis:alert:new', {
    alertId: alertData.id,
    severity: alertData.severity,
    title: alertData.title,
  });
}

/**
 * Send notification for alert assignment
 */
export async function notifyAlertAssigned(
  workspaceId: string,
  assigneeId: string,
  alertData: {
    id: string;
    title: string;
    severity: string;
  }
): Promise<void> {
  await sendNotification({
    userId: assigneeId,
    workspaceId,
    type: alertData.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
    title: 'Alert Assigned to You',
    message: `You have been assigned to alert: ${alertData.title}`,
    link: `/modules/aegis/alerts/${alertData.id}`,
    eventType: 'alert_assigned' as any,
    metadata: {
      alertId: alertData.id,
      severity: alertData.severity,
    },
  });
}

/**
 * Send notification for incident creation
 */
export async function notifyIncidentCreated(
  workspaceId: string,
  userId: string,
  incidentData: {
    id: string;
    title: string;
    severity: string;
    priority: string;
  }
): Promise<void> {
  await sendNotification({
    userId,
    workspaceId,
    type: incidentData.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
    title: 'New Security Incident',
    message: `A new ${incidentData.severity.toLowerCase()} incident has been created: ${incidentData.title}`,
    link: `/modules/aegis/incidents/${incidentData.id}`,
    eventType: 'incident_created' as any,
    metadata: {
      incidentId: incidentData.id,
      severity: incidentData.severity,
      priority: incidentData.priority,
    },
  });

  // Broadcast to workspace via WebSocket
  broadcastToWorkspace(workspaceId, 'aegis:incident:new', {
    incidentId: incidentData.id,
    severity: incidentData.severity,
    priority: incidentData.priority,
    title: incidentData.title,
  });
}

/**
 * Send notification for incident assignment
 */
export async function notifyIncidentAssigned(
  workspaceId: string,
  assigneeId: string,
  incidentData: {
    id: string;
    title: string;
    severity: string;
  }
): Promise<void> {
  await sendNotification({
    userId: assigneeId,
    workspaceId,
    type: incidentData.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
    title: 'Incident Assigned to You',
    message: `You have been assigned to incident: ${incidentData.title}`,
    link: `/modules/aegis/incidents/${incidentData.id}`,
    eventType: 'incident_assigned' as any,
    metadata: {
      incidentId: incidentData.id,
      severity: incidentData.severity,
    },
  });
}

/**
 * Send notification for SLA breach
 */
export async function notifySLABreach(
  workspaceId: string,
  assigneeId: string,
  incidentData: {
    id: string;
    title: string;
    slaDeadline: Date;
  }
): Promise<void> {
  await sendNotification({
    userId: assigneeId,
    workspaceId,
    type: 'CRITICAL',
    title: 'SLA Breach Alert',
    message: `Incident "${incidentData.title}" has breached its SLA deadline`,
    link: `/modules/aegis/incidents/${incidentData.id}`,
    eventType: 'incident_sla_breach' as any,
    metadata: {
      incidentId: incidentData.id,
      slaDeadline: incidentData.slaDeadline,
    },
  });

  // Broadcast critical SLA breach to workspace
  broadcastToWorkspace(workspaceId, 'aegis:incident:sla_breach', {
    incidentId: incidentData.id,
    title: incidentData.title,
  });
}

/**
 * Send notification for incident resolution
 */
export async function notifyIncidentResolved(
  workspaceId: string,
  userId: string,
  incidentData: {
    id: string;
    title: string;
  }
): Promise<void> {
  await sendNotification({
    userId,
    workspaceId,
    type: 'SUCCESS',
    title: 'Incident Resolved',
    message: `Incident has been resolved: ${incidentData.title}`,
    link: `/modules/aegis/incidents/${incidentData.id}`,
    eventType: 'incident_resolved' as any,
    metadata: {
      incidentId: incidentData.id,
    },
  });
}

/**
 * Send notification for case creation
 */
export async function notifyCaseCreated(
  workspaceId: string,
  userId: string,
  caseData: {
    id: string;
    title: string;
    priority: string;
  }
): Promise<void> {
  await sendNotification({
    userId,
    workspaceId,
    type: 'INFO',
    title: 'New Investigation Case',
    message: `A new case has been created: ${caseData.title}`,
    link: `/modules/aegis/cases/${caseData.id}`,
    eventType: 'case_created' as any,
    metadata: {
      caseId: caseData.id,
      priority: caseData.priority,
    },
  });
}

/**
 * Send notification for case assignment
 */
export async function notifyCaseAssigned(
  workspaceId: string,
  investigatorId: string,
  caseData: {
    id: string;
    title: string;
    priority: string;
  }
): Promise<void> {
  await sendNotification({
    userId: investigatorId,
    workspaceId,
    type: 'INFO',
    title: 'Case Assigned to You',
    message: `You have been assigned as investigator for case: ${caseData.title}`,
    link: `/modules/aegis/cases/${caseData.id}`,
    eventType: 'case_assigned' as any,
    metadata: {
      caseId: caseData.id,
      priority: caseData.priority,
    },
  });
}

/**
 * Send notification for case closure
 */
export async function notifyCaseClosed(
  workspaceId: string,
  userId: string,
  caseData: {
    id: string;
    title: string;
  }
): Promise<void> {
  await sendNotification({
    userId,
    workspaceId,
    type: 'SUCCESS',
    title: 'Case Closed',
    message: `Case has been closed: ${caseData.title}`,
    link: `/modules/aegis/cases/${caseData.id}`,
    eventType: 'case_closed' as any,
    metadata: {
      caseId: caseData.id,
    },
  });
}

/**
 * Send notification for evidence upload
 */
export async function notifyEvidenceUploaded(
  workspaceId: string,
  investigatorId: string,
  evidenceData: {
    id: string;
    name: string;
    caseId: string;
  }
): Promise<void> {
  await sendNotification({
    userId: investigatorId,
    workspaceId,
    type: 'INFO',
    title: 'New Evidence Uploaded',
    message: `Evidence "${evidenceData.name}" has been uploaded to the case`,
    link: `/modules/aegis/cases/${evidenceData.caseId}`,
    eventType: 'evidence_uploaded' as any,
    metadata: {
      evidenceId: evidenceData.id,
      caseId: evidenceData.caseId,
    },
  });
}

/**
 * Send notification for task assignment
 */
export async function notifyTaskAssigned(
  workspaceId: string,
  assigneeId: string,
  taskData: {
    id: string;
    title: string;
    dueDate?: Date;
    incidentId?: string;
    caseId?: string;
  }
): Promise<void> {
  const link = taskData.incidentId 
    ? `/modules/aegis/incidents/${taskData.incidentId}`
    : taskData.caseId 
    ? `/modules/aegis/cases/${taskData.caseId}`
    : '/modules/aegis';

  await sendNotification({
    userId: assigneeId,
    workspaceId,
    type: 'INFO',
    title: 'Task Assigned to You',
    message: `You have been assigned a task: ${taskData.title}`,
    link,
    eventType: 'task_assigned' as any,
    metadata: {
      taskId: taskData.id,
      dueDate: taskData.dueDate,
      incidentId: taskData.incidentId,
      caseId: taskData.caseId,
    },
  });
}

/**
 * Send notification for task completion
 */
export async function notifyTaskCompleted(
  workspaceId: string,
  userId: string,
  taskData: {
    id: string;
    title: string;
    incidentId?: string;
    caseId?: string;
  }
): Promise<void> {
  const link = taskData.incidentId 
    ? `/modules/aegis/incidents/${taskData.incidentId}`
    : taskData.caseId 
    ? `/modules/aegis/cases/${taskData.caseId}`
    : '/modules/aegis';

  await sendNotification({
    userId,
    workspaceId,
    type: 'SUCCESS',
    title: 'Task Completed',
    message: `Task has been completed: ${taskData.title}`,
    link,
    eventType: 'task_completed' as any,
    metadata: {
      taskId: taskData.id,
      incidentId: taskData.incidentId,
      caseId: taskData.caseId,
    },
  });
}

/**
 * Send notification to multiple users
 */
export async function notifyMultipleUsers(
  workspaceId: string,
  userIds: string[],
  notification: {
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
    title: string;
    message: string;
    link?: string;
    eventType: AegisEventType;
    metadata?: any;
  }
): Promise<void> {
  const promises = userIds.map(userId =>
    sendNotification({
      userId,
      workspaceId,
      ...notification,
      eventType: notification.eventType as any,
    })
  );

  await Promise.all(promises);
}
