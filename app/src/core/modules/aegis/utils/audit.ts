/**
 * Aegis Module - Audit Log Helpers
 * 
 * This module provides helper functions to create audit logs for Aegis operations.
 * It integrates with the existing audit log system.
 */

import { AuditAction } from '@prisma/client';
import { prisma } from 'wasp/server';

/**
 * Create audit log using existing system
 */
async function createAuditLog(data: {
  workspaceId: string;
  userId: string;
  action: AuditAction | string;
  resource: string;
  resourceId: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {

    // Map Aegis-specific actions to AuditAction enum
    const actionMapping: Record<string, AuditAction> = {
      ALERT_CREATED: 'ALERT_CREATED',
      ALERT_UPDATED: 'ALERT_UPDATED',
      ALERT_ESCALATED: 'ALERT_ESCALATED',
      INCIDENT_CREATED: 'INCIDENT_CREATED',
      INCIDENT_UPDATED: 'INCIDENT_UPDATED',
      INCIDENT_RESOLVED: 'INCIDENT_RESOLVED',
      CASE_CREATED: 'CASE_CREATED',
      CASE_UPDATED: 'CASE_UPDATED',
      CASE_CLOSED: 'CASE_CLOSED',
      EVIDENCE_UPLOADED: 'EVIDENCE_UPLOADED',
      EVIDENCE_ACCESSED: 'EVIDENCE_ACCESSED',
    };

    const mappedAction = (actionMapping[data.action as string] || 'SETTINGS_UPDATED') as AuditAction;

    await prisma.auditLog.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        action: mappedAction,
        resource: data.resource,
        resourceId: data.resourceId,
        description: data.description,
        metadata: {
          ...data.metadata,
          module: 'aegis',
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error('[Aegis] Failed to create audit log:', error);
    // Log to system but don't block operation
  }
}

/**
 * Log alert creation
 */
export async function logAlertCreated(
  context: any,
  workspaceId: string,
  alertId: string,
  alertData: { title: string; severity: string; source: string }
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId: context.user.id,
    action: 'ALERT_CREATED' as AuditAction,
    resource: 'alert',
    resourceId: alertId,
    description: `Alert created: ${alertData.title} (${alertData.severity})`,
    metadata: {
      severity: alertData.severity,
      source: alertData.source,
    },
    ipAddress: context.req?.ip,
    userAgent: context.req?.headers['user-agent'],
  });
}

/**
 * Log alert update
 */
export async function logAlertUpdated(
  context: any,
  workspaceId: string,
  alertId: string,
  changes: any
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId: context.user.id,
    action: 'ALERT_UPDATED' as AuditAction,
    resource: 'alert',
    resourceId: alertId,
    description: `Alert updated`,
    metadata: { changes },
    ipAddress: context.req?.ip,
    userAgent: context.req?.headers['user-agent'],
  });
}

/**
 * Log alert escalation to incident
 */
export async function logAlertEscalated(
  context: any,
  workspaceId: string,
  alertId: string,
  incidentId: string
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId: context.user.id,
    action: 'ALERT_ESCALATED' as AuditAction,
    resource: 'alert',
    resourceId: alertId,
    description: `Alert escalated to incident ${incidentId}`,
    metadata: { incidentId },
    ipAddress: context.req?.ip,
    userAgent: context.req?.headers['user-agent'],
  });
}

/**
 * Log incident creation
 */
export async function logIncidentCreated(
  context: any,
  workspaceId: string,
  incidentId: string,
  incidentData: { title: string; severity: string; priority: string }
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId: context.user.id,
    action: 'INCIDENT_CREATED' as AuditAction,
    resource: 'incident',
    resourceId: incidentId,
    description: `Incident created: ${incidentData.title}`,
    metadata: {
      severity: incidentData.severity,
      priority: incidentData.priority,
    },
    ipAddress: context.req?.ip,
    userAgent: context.req?.headers['user-agent'],
  });
}

/**
 * Log incident update
 */
export async function logIncidentUpdated(
  context: any,
  workspaceId: string,
  incidentId: string,
  changes: any
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId: context.user.id,
    action: 'INCIDENT_UPDATED' as AuditAction,
    resource: 'incident',
    resourceId: incidentId,
    description: `Incident updated`,
    metadata: { changes },
    ipAddress: context.req?.ip,
    userAgent: context.req?.headers['user-agent'],
  });
}

/**
 * Log incident resolution
 */
export async function logIncidentResolved(
  context: any,
  workspaceId: string,
  incidentId: string,
  summary: string
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId: context.user.id,
    action: 'INCIDENT_RESOLVED' as AuditAction,
    resource: 'incident',
    resourceId: incidentId,
    description: `Incident resolved: ${summary}`,
    metadata: { summary },
    ipAddress: context.req?.ip,
    userAgent: context.req?.headers['user-agent'],
  });
}

/**
 * Log case creation
 */
export async function logCaseCreated(
  context: any,
  workspaceId: string,
  caseId: string,
  caseData: { title: string; caseType?: string; priority: string }
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId: context.user.id,
    action: 'CASE_CREATED' as AuditAction,
    resource: 'case',
    resourceId: caseId,
    description: `Case created: ${caseData.title}`,
    metadata: {
      caseType: caseData.caseType,
      priority: caseData.priority,
    },
    ipAddress: context.req?.ip,
    userAgent: context.req?.headers['user-agent'],
  });
}

/**
 * Log case update
 */
export async function logCaseUpdated(
  context: any,
  workspaceId: string,
  caseId: string,
  changes: any
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId: context.user.id,
    action: 'CASE_UPDATED' as AuditAction,
    resource: 'case',
    resourceId: caseId,
    description: `Case updated`,
    metadata: { changes },
    ipAddress: context.req?.ip,
    userAgent: context.req?.headers['user-agent'],
  });
}

/**
 * Log case closure
 */
export async function logCaseClosed(
  context: any,
  workspaceId: string,
  caseId: string
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId: context.user.id,
    action: 'CASE_CLOSED' as AuditAction,
    resource: 'case',
    resourceId: caseId,
    description: `Case closed`,
    metadata: {},
    ipAddress: context.req?.ip,
    userAgent: context.req?.headers['user-agent'],
  });
}

/**
 * Log evidence upload
 */
export async function logEvidenceUploaded(
  context: any,
  workspaceId: string,
  evidenceId: string,
  evidenceData: { name: string; type: string; size: string }
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId: context.user.id,
    action: 'EVIDENCE_UPLOADED' as AuditAction,
    resource: 'evidence',
    resourceId: evidenceId,
    description: `Evidence uploaded: ${evidenceData.name}`,
    metadata: {
      type: evidenceData.type,
      size: evidenceData.size,
    },
    ipAddress: context.req?.ip,
    userAgent: context.req?.headers['user-agent'],
  });
}

/**
 * Log evidence access
 */
export async function logEvidenceAccessed(
  context: any,
  workspaceId: string,
  evidenceId: string,
  action: string
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId: context.user.id,
    action: 'EVIDENCE_ACCESSED' as AuditAction,
    resource: 'evidence',
    resourceId: evidenceId,
    description: `Evidence ${action}`,
    metadata: { action },
    ipAddress: context.req?.ip,
    userAgent: context.req?.headers['user-agent'],
  });
}
