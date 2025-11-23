/**
 * Aegis Module - Alert Operations
 * 
 * This module provides all CRUD operations and business logic for security alerts.
 * Includes filtering, pagination, assignment, escalation, and statistics.
 */

import { HttpError } from 'wasp/server';
import type {
  Alert,
  User,
  Workspace,
  WorkspaceMember,
  Observable,
  Incident,
  TimelineEvent,
} from 'wasp/entities';
import {
  Severity,
  AlertStatus,
  TimelineEventType,
} from '@prisma/client';
import type {
  AlertWithRelations,
  AlertFilters,
  PaginationParams,
  SortParams,
  PaginatedResult,
  CreateAlertInput,
  UpdateAlertInput,
  AlertStats,
  CreateIncidentInput,
} from '../models/types';
import { checkWorkspaceAccess, canManageAlert, canAssign } from '../utils/permissions';
import {
  logAlertCreated,
  logAlertUpdated,
  logAlertEscalated,
} from '../utils/audit';
import {
  notifyAlertCreated,
  notifyAlertAssigned,
} from '../utils/notifications';
import { enforcePlanLimit, getWorkspaceUsage } from '../../../payment/planLimits';
import { FeatureChecker } from '../../../features/FeatureChecker';

const getPlanQuotas = (plan: string | null): any => ({
  free: { maxAlertsPerMonth: 10 },
  hobby: { maxAlertsPerMonth: 100 },
  pro: { maxAlertsPerMonth: -1 },
}[plan || 'free'] || { maxAlertsPerMonth: 10 });

/**
 * Get alerts with filtering, pagination, and sorting
 */
export const getAlerts = async (
  args: {
    filters: AlertFilters;
    pagination?: PaginationParams;
    sort?: SortParams;
  },
  context: any
): Promise<PaginatedResult<AlertWithRelations>> => {
  const { filters, pagination = {}, sort = {} } = args;
  
  // Check workspace access
  await checkWorkspaceAccess(context, filters.workspaceId);

  const page = pagination.page || 1;
  const pageSize = Math.min(pagination.pageSize || 20, 100);
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: any = {
    workspaceId: filters.workspaceId,
  };

  if (filters.severity) {
    where.severity = Array.isArray(filters.severity)
      ? { in: filters.severity }
      : filters.severity;
  }

  if (filters.status) {
    where.status = Array.isArray(filters.status)
      ? { in: filters.status }
      : filters.status;
  }

  if (filters.source) {
    where.source = Array.isArray(filters.source)
      ? { in: filters.source }
      : filters.source;
  }

  if (filters.assignedToId !== undefined) {
    where.assignedToId = filters.assignedToId;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.tags && filters.tags.length > 0) {
    where.tags = { hasSome: filters.tags };
  }

  if (filters.dateRange) {
    where.detectedAt = {
      gte: filters.dateRange.from,
      lte: filters.dateRange.to,
    };
  }

  if (filters.threatScoreMin !== undefined || filters.threatScoreMax !== undefined) {
    where.threatScore = {};
    if (filters.threatScoreMin !== undefined) {
      where.threatScore.gte = filters.threatScoreMin;
    }
    if (filters.threatScoreMax !== undefined) {
      where.threatScore.lte = filters.threatScoreMax;
    }
  }

  // Build orderBy
  const orderBy: any = {};
  if (sort.sortBy) {
    orderBy[sort.sortBy] = sort.sortOrder || 'desc';
  } else {
    orderBy.createdAt = 'desc';
  }

  // Execute query
  const [alerts, total] = await Promise.all([
    context.entities.Alert.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        workspace: true,
        assignedTo: true,
        observables: true,
        incidents: true,
        timeline: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
      },
    }),
    context.entities.Alert.count({ where }),
  ]);

  return {
    data: alerts,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * Get alert by ID with full details
 */
export const getAlertById = async (
  args: { alertId: string; workspaceId: string },
  context: any
): Promise<AlertWithRelations> => {
  const { alertId, workspaceId } = args;

  // Check workspace access
  await checkWorkspaceAccess(context, workspaceId);

  const alert = await context.entities.Alert.findUnique({
    where: { id: alertId },
    include: {
      workspace: true,
      assignedTo: true,
      observables: {
        include: {
          createdBy: true,
        },
      },
      incidents: {
        include: {
          assignedTo: true,
        },
      },
      timeline: {
        include: {
          user: true,
        },
        orderBy: { timestamp: 'desc' },
      },
    },
  });

  if (!alert) {
    throw new HttpError(404, 'Alert not found');
  }

  if (alert.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  return alert;
};

/**
 * Create a new alert
 */
export const createAlert = async (
  args: { data: CreateAlertInput },
  context: any
): Promise<Alert> => {
  const { data } = args;

  // Check workspace access
  const { role, userId } = await checkWorkspaceAccess(context, data.workspaceId);

  // ✅ Feature Gate: Check if alert creation is enabled
  await FeatureChecker.requireFeature(
    context,
    data.workspaceId,
    'aegis.alert_creation',
    'Alert creation is not enabled for this workspace'
  );

  // Check plan limits for alerts
  const usage = await getWorkspaceUsage(context, data.workspaceId);
  await enforcePlanLimit(
    context, 
    data.workspaceId, 
    'maxAlertsPerMonth', 
    usage.alerts.thisMonth,
    `Alert quota exceeded. Please upgrade your plan to create more alerts.`
  );

  // Create alert
  const alert = await context.entities.Alert.create({
    data: {
      workspaceId: data.workspaceId,
      title: data.title,
      description: data.description,
      source: data.source,
      severity: data.severity,
      status: 'NEW',
      category: data.category,
      threatScore: data.threatScore,
      affectedAssets: data.affectedAssets || [],
      tags: data.tags || [],
      detectedAt: data.detectedAt || new Date(),
      threatAnalysis: data.threatAnalysis,
      technicalDetails: data.technicalDetails,
      metadata: data.metadata,
    },
  });

  // Create timeline event
  await context.entities.TimelineEvent.create({
    data: {
      type: 'INFO' as TimelineEventType,
      title: 'Alert Created',
      description: `Alert created by ${context.user.email || context.user.username}`,
      timestamp: new Date(),
      userId: userId,
      alertId: alert.id,
      metadata: {
        severity: alert.severity,
        source: alert.source,
      },
    },
  });

  // Audit log
  await logAlertCreated(context, data.workspaceId, alert.id, {
    title: alert.title,
    severity: alert.severity,
    source: alert.source,
  });

  // Send notification to workspace admins/owners if critical
  if (alert.severity === 'CRITICAL') {
    const admins = await context.entities.WorkspaceMember.findMany({
      where: {
        workspaceId: data.workspaceId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    for (const admin of admins) {
      await notifyAlertCreated(data.workspaceId, admin.userId, {
        id: alert.id,
        title: alert.title,
        severity: alert.severity,
      });
    }
  }

  return alert;
};

/**
 * Update an alert
 */
export const updateAlert = async (
  args: {
    alertId: string;
    workspaceId: string;
    data: UpdateAlertInput;
  },
  context: any
): Promise<Alert> => {
  const { alertId, workspaceId, data } = args;

  // Check workspace access
  const { role, userId } = await checkWorkspaceAccess(context, workspaceId);

  // Get existing alert
  const existingAlert = await context.entities.Alert.findUnique({
    where: { id: alertId },
  });

  if (!existingAlert) {
    throw new HttpError(404, 'Alert not found');
  }

  if (existingAlert.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  // Check permissions
  const isAssigned = existingAlert.assignedToId === userId;
  if (!canManageAlert(role, isAssigned)) {
    throw new HttpError(403, 'You do not have permission to update this alert');
  }

  // Update alert
  const alert = await context.entities.Alert.update({
    where: { id: alertId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.severity && { severity: data.severity }),
      ...(data.status && { status: data.status }),
      ...(data.category && { category: data.category }),
      ...(data.threatScore !== undefined && { threatScore: data.threatScore }),
      ...(data.affectedAssets && { affectedAssets: data.affectedAssets }),
      ...(data.tags && { tags: data.tags }),
      ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
      ...(data.threatAnalysis && { threatAnalysis: data.threatAnalysis }),
      ...(data.technicalDetails && { technicalDetails: data.technicalDetails }),
      ...(data.metadata && { metadata: data.metadata }),
      updatedAt: new Date(),
    },
  });

  // Create timeline event
  const changesList = Object.keys(data).filter(key => data[key as keyof UpdateAlertInput] !== undefined);
  await context.entities.TimelineEvent.create({
    data: {
      type: 'INFO' as TimelineEventType,
      title: 'Alert Updated',
      description: `Alert updated by ${context.user.email || context.user.username}. Changed: ${changesList.join(', ')}`,
      timestamp: new Date(),
      userId: userId,
      alertId: alert.id,
      metadata: { changes: data },
    },
  });

  // Audit log
  await logAlertUpdated(context, workspaceId, alertId, data);

  return alert;
};

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = async (
  args: { alertId: string; workspaceId: string },
  context: any
): Promise<Alert> => {
  return updateAlert(
    {
      alertId: args.alertId,
      workspaceId: args.workspaceId,
      data: { status: 'ACKNOWLEDGED' },
    },
    context
  );
};

/**
 * Assign alert to a user
 */
export const assignAlert = async (
  args: {
    alertId: string;
    workspaceId: string;
    assigneeId: string;
  },
  context: any
): Promise<Alert> => {
  const { alertId, workspaceId, assigneeId } = args;

  // Check workspace access and permissions
  const { role } = await checkWorkspaceAccess(context, workspaceId);

  if (!canAssign(role)) {
    throw new HttpError(403, 'Only admins and owners can assign alerts');
  }

  // Verify assignee is a member
  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: assigneeId,
      workspaceId,
    },
  });

  if (!membership) {
    throw new HttpError(400, 'Assignee is not a member of this workspace');
  }

  // Get alert details for notification
  const alert = await context.entities.Alert.findUnique({
    where: { id: alertId },
  });

  if (!alert) {
    throw new HttpError(404, 'Alert not found');
  }

  // Update alert
  const updatedAlert = await updateAlert(
    {
      alertId,
      workspaceId,
      data: {
        assignedToId: assigneeId,
        status: alert.status === 'NEW' ? 'ACKNOWLEDGED' : alert.status,
      },
    },
    context
  );

  // Send notification to assignee
  await notifyAlertAssigned(workspaceId, assigneeId, {
    id: alert.id,
    title: alert.title,
    severity: alert.severity,
  });

  return updatedAlert;
};

/**
 * Dismiss an alert
 */
export const dismissAlert = async (
  args: {
    alertId: string;
    workspaceId: string;
    justification: string;
  },
  context: any
): Promise<Alert> => {
  const { alertId, workspaceId, justification } = args;

  const { userId } = await checkWorkspaceAccess(context, workspaceId);

  const alert = await updateAlert(
    {
      alertId,
      workspaceId,
      data: {
        status: 'DISMISSED',
        metadata: { justification, dismissedBy: userId, dismissedAt: new Date() },
      },
    },
    context
  );

  // Timeline event
  await context.entities.TimelineEvent.create({
    data: {
      type: 'WARNING' as TimelineEventType,
      title: 'Alert Dismissed',
      description: justification,
      timestamp: new Date(),
      userId: userId,
      alertId: alert.id,
    },
  });

  return alert;
};

/**
 * Escalate alert to incident
 */
export const escalateToIncident = async (
  args: {
    alertId: string;
    workspaceId: string;
    incidentData: Omit<CreateIncidentInput, 'workspaceId'>;
  },
  context: any
): Promise<{ alert: Alert; incident: any }> => {
  const { alertId, workspaceId, incidentData } = args;

  // Check workspace access
  const { userId } = await checkWorkspaceAccess(context, workspaceId);

  // ✅ Feature Gate: Check if incident management is enabled
  await FeatureChecker.requireFeature(
    context,
    workspaceId,
    'aegis.incident_management',
    'Incident management is not enabled for this workspace. Please upgrade to access this feature.'
  );

  // Get alert
  const alert = await context.entities.Alert.findUnique({
    where: { id: alertId },
    include: { observables: true },
  });

  if (!alert) {
    throw new HttpError(404, 'Alert not found');
  }

  if (alert.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  // Create incident
  const incident = await context.entities.Incident.create({
    data: {
      workspaceId,
      title: incidentData.title || alert.title,
      description: incidentData.description || alert.description,
      severity: incidentData.severity || alert.severity,
      priority: incidentData.priority || 'MEDIUM',
      status: 'ACTIVE',
      team: incidentData.team,
      affectedSystems: incidentData.affectedSystems || alert.affectedAssets,
      slaDeadline: incidentData.slaDeadline,
      metadata: incidentData.metadata,
    },
  });

  // Link alert to incident
  await context.entities.Alert.update({
    where: { id: alertId },
    data: {
      incidents: {
        connect: { id: incident.id },
      },
      status: 'INVESTIGATING',
    },
  });

  // Copy observables to incident
  if (alert.observables.length > 0) {
    await context.entities.Incident.update({
      where: { id: incident.id },
      data: {
        observables: {
          connect: alert.observables.map((obs: any) => ({ id: obs.id })),
        },
      },
    });
  }

  // Timeline events
  await Promise.all([
    context.entities.TimelineEvent.create({
      data: {
        type: 'WARNING' as TimelineEventType,
        title: 'Alert Escalated',
        description: `Alert escalated to incident ${incident.id}`,
        timestamp: new Date(),
        userId: userId,
        alertId: alert.id,
        metadata: { incidentId: incident.id },
      },
    }),
    context.entities.TimelineEvent.create({
      data: {
        type: 'INFO' as TimelineEventType,
        title: 'Incident Created from Alert',
        description: `Created from alert ${alert.id}`,
        timestamp: new Date(),
        userId: userId,
        incidentId: incident.id,
        metadata: { alertId: alert.id },
      },
    }),
  ]);

  // Audit log
  await logAlertEscalated(context, workspaceId, alertId, incident.id);

  return { alert, incident };
};

/**
 * Bulk update alerts
 */
export const bulkUpdateAegisAlerts = async (
  args: {
    alertIds: string[];
    workspaceId: string;
    data: UpdateAlertInput;
  },
  context: any
): Promise<{ success: number; failed: number }> => {
  const { alertIds, workspaceId, data } = args;

  // Check workspace access
  const { role } = await checkWorkspaceAccess(context, workspaceId);

  if (!canAssign(role)) {
    throw new HttpError(403, 'Only admins and owners can perform bulk updates');
  }

  let success = 0;
  let failed = 0;

  for (const alertId of alertIds) {
    try {
      await updateAlert({ alertId, workspaceId, data }, context);
      success++;
    } catch (error) {
      failed++;
      console.error(`Failed to update alert ${alertId}:`, error);
    }
  }

  return { success, failed };
};

/**
 * Get alert statistics for dashboard
 */
export const getAlertStats = async (
  args: { workspaceId: string; days?: number },
  context: any
): Promise<AlertStats> => {
  const { workspaceId, days = 30 } = args;

  // Check workspace access
  await checkWorkspaceAccess(context, workspaceId);

  // ✅ Feature Gate: Check if advanced analytics is enabled for detailed stats
  const advancedAnalyticsEnabled = await FeatureChecker.isEnabled(
    context,
    workspaceId,
    'aegis.advanced_analytics'
  );

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const alerts = await context.entities.Alert.findMany({
    where: {
      workspaceId,
      createdAt: { gte: startDate },
    },
  });

  const last24h = new Date();
  last24h.setHours(last24h.getHours() - 24);

  const stats: AlertStats = {
    total: alerts.length,
    critical: alerts.filter((a: any) => a.severity === 'CRITICAL').length,
    high: alerts.filter((a: any) => a.severity === 'HIGH').length,
    medium: alerts.filter((a: any) => a.severity === 'MEDIUM').length,
    low: alerts.filter((a: any) => a.severity === 'LOW').length,
    new24h: alerts.filter((a: any) => a.createdAt >= last24h).length,
    bySource: {},
    byStatus: {},
    bySeverity: {},
    byCategory: {},
    trends: [],
  };

  // Group by source
  alerts.forEach((alert: any) => {
    stats.bySource[alert.source] = (stats.bySource[alert.source] || 0) + 1;
    stats.byStatus[alert.status] = (stats.byStatus[alert.status] || 0) + 1;
    stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
    if (alert.category) {
      stats.byCategory[alert.category] = (stats.byCategory[alert.category] || 0) + 1;
    }
  });

  // Calculate trends (daily counts for last 7 days)
  for (let i: number = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = alerts.filter(
      (a: any) => a.createdAt >= date && a.createdAt < nextDate
    ).length;

    stats.trends.push({
      period: date.toISOString().split('T')[0],
      count,
    });
  }

  return stats;
};
