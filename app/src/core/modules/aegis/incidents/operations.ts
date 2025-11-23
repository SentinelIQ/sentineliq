/**
 * Aegis Module - Incident Operations
 * 
 * This module provides all CRUD operations and business logic for security incidents.
 * Includes SLA management, playbook application, assignment, and statistics.
 */

import { HttpError } from 'wasp/server';
import type {
  Incident,
  User,
  Workspace,
  WorkspaceMember,
  Alert,
  Case,
  Observable,
  Task,
  TimelineEvent,
  InvestigationNote,
} from 'wasp/entities';
import {
  IncidentStatus,
  Priority,
  TimelineEventType,
} from '@prisma/client';
import type {
  IncidentWithRelations,
  IncidentFilters,
  PaginationParams,
  SortParams,
  PaginatedResult,
  CreateIncidentInput,
  UpdateIncidentInput,
  IncidentStats,
  SLAStatus,
  Playbook,
} from '../models/types';
import { checkWorkspaceAccess, canManageIncident, canAssign } from '../utils/permissions';
import {
  logIncidentCreated,
  logIncidentUpdated,
  logIncidentResolved,
} from '../utils/audit';
import {
  notifyIncidentCreated,
  notifyIncidentAssigned,
  notifySLABreach,
  notifyIncidentResolved,
} from '../utils/notifications';
import { FeatureChecker } from '../../../features/FeatureChecker';

const getPlanQuotas = (plan: string | null): any => ({
  free: { maxIncidents: 5 },
  hobby: { maxIncidents: 50 },
  pro: { maxIncidents: -1 },
}[plan || 'free'] || { maxIncidents: 5 });

/**
 * Get incidents with filtering, pagination, and sorting
 */
export const getIncidents = async (
  args: {
    filters: IncidentFilters;
    pagination?: PaginationParams;
    sort?: SortParams;
  },
  context: any
): Promise<PaginatedResult<IncidentWithRelations>> => {
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

  if (filters.priority) {
    where.priority = Array.isArray(filters.priority)
      ? { in: filters.priority }
      : filters.priority;
  }

  if (filters.assignedToId !== undefined) {
    where.assignedToId = filters.assignedToId;
  }

  if (filters.team) {
    where.team = filters.team;
  }

  if (filters.slaBreached !== undefined) {
    where.slaBreached = filters.slaBreached;
  }

  if (filters.dateRange) {
    where.createdAt = {
      gte: filters.dateRange.from,
      lte: filters.dateRange.to,
    };
  }

  if (filters.progressMin !== undefined || filters.progressMax !== undefined) {
    where.progress = {};
    if (filters.progressMin !== undefined) {
      where.progress.gte = filters.progressMin;
    }
    if (filters.progressMax !== undefined) {
      where.progress.lte = filters.progressMax;
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
  const [incidents, total] = await Promise.all([
    context.entities.Incident.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        workspace: true,
        assignedTo: true,
        alerts: {
          take: 10,
        },
        cases: true,
        observables: {
          take: 20,
        },
        tasks: {
          orderBy: { order: 'asc' },
        },
        timeline: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            author: true,
          },
        },
      },
    }),
    context.entities.Incident.count({ where }),
  ]);

  return {
    data: incidents,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * Get incident by ID with full details
 */
export const getIncidentById = async (
  args: { incidentId: string; workspaceId: string },
  context: any
): Promise<IncidentWithRelations> => {
  const { incidentId, workspaceId } = args;

  // Check workspace access
  await checkWorkspaceAccess(context, workspaceId);

  const incident = await context.entities.Incident.findUnique({
    where: { id: incidentId },
    include: {
      workspace: true,
      assignedTo: true,
      alerts: {
        include: {
          assignedTo: true,
        },
      },
      cases: {
        include: {
          investigator: true,
        },
      },
      observables: {
        include: {
          createdBy: true,
        },
      },
      tasks: {
        include: {
          assignee: true,
        },
        orderBy: { order: 'asc' },
      },
      timeline: {
        include: {
          user: true,
        },
        orderBy: { timestamp: 'desc' },
      },
      notes: {
        include: {
          author: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!incident) {
    throw new HttpError(404, 'Incident not found');
  }

  if (incident.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  return incident;
};

/**
 * Create a new incident
 */
export const createIncident = async (
  args: { data: CreateIncidentInput },
  context: any
): Promise<Incident> => {
  const { data } = args;

  // Check workspace access
  const { userId } = await checkWorkspaceAccess(context, data.workspaceId);

  // 🚀 Check incident management feature
  await FeatureChecker.requireFeature(
    context,
    data.workspaceId,
    'aegis.incident_management'
  );

  // Check quota
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: data.workspaceId },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  const quotas = getPlanQuotas(workspace.subscriptionPlan);

  if (quotas.maxIncidents !== -1) {
    const incidentCount = await context.entities.Incident.count({
      where: { workspaceId: data.workspaceId },
    });

    if (incidentCount >= quotas.maxIncidents) {
      throw new HttpError(
        403,
        `Incident limit reached. Your ${workspace.subscriptionPlan || 'free'} plan allows ${quotas.maxIncidents} incidents.`
      );
    }
  }

  // Create incident
  const incident = await context.entities.Incident.create({
    data: {
      workspaceId: data.workspaceId,
      title: data.title,
      description: data.description,
      severity: data.severity,
      status: 'ACTIVE',
      priority: data.priority || 'MEDIUM',
      team: data.team,
      affectedSystems: data.affectedSystems || [],
      slaDeadline: data.slaDeadline,
      slaBreached: false,
      progress: 0,
      metadata: data.metadata,
    },
  });

  // Create timeline event
  await context.entities.TimelineEvent.create({
    data: {
      type: 'WARNING' as TimelineEventType,
      title: 'Incident Created',
      description: `Incident created by ${context.user.email || context.user.username}`,
      timestamp: new Date(),
      userId: userId,
      incidentId: incident.id,
      metadata: {
        severity: incident.severity,
        priority: incident.priority,
      },
    },
  });

  // Audit log
  await logIncidentCreated(context, data.workspaceId, incident.id, {
    title: incident.title,
    severity: incident.severity,
    priority: incident.priority,
  });

  // Send notification to workspace admins/owners
  const admins = await context.entities.WorkspaceMember.findMany({
    where: {
      workspaceId: data.workspaceId,
      role: { in: ['OWNER', 'ADMIN'] },
    },
  });

  for (const admin of admins) {
    await notifyIncidentCreated(data.workspaceId, admin.userId, {
      id: incident.id,
      title: incident.title,
      severity: incident.severity,
      priority: incident.priority,
    });
  }

  return incident;
};

/**
 * Update an incident
 */
export const updateIncident = async (
  args: {
    incidentId: string;
    workspaceId: string;
    data: UpdateIncidentInput;
  },
  context: any
): Promise<Incident> => {
  const { incidentId, workspaceId, data } = args;

  // Check workspace access
  const { role, userId } = await checkWorkspaceAccess(context, workspaceId);

  // Get existing incident
  const existingIncident = await context.entities.Incident.findUnique({
    where: { id: incidentId },
  });

  if (!existingIncident) {
    throw new HttpError(404, 'Incident not found');
  }

  if (existingIncident.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  // Check permissions
  const isAssigned = existingIncident.assignedToId === userId;
  if (!canManageIncident(role, isAssigned)) {
    throw new HttpError(403, 'You do not have permission to update this incident');
  }

  // Check if resolving
  const isResolving = data.status === 'RESOLVED' && existingIncident.status !== 'RESOLVED';

  // Update incident
  const incident = await context.entities.Incident.update({
    where: { id: incidentId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.severity && { severity: data.severity }),
      ...(data.status && { status: data.status }),
      ...(data.priority && { priority: data.priority }),
      ...(data.team && { team: data.team }),
      ...(data.affectedSystems && { affectedSystems: data.affectedSystems }),
      ...(data.slaDeadline && { slaDeadline: data.slaDeadline }),
      ...(data.slaBreached !== undefined && { slaBreached: data.slaBreached }),
      ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
      ...(data.progress !== undefined && { progress: data.progress }),
      ...(data.playbookId && { playbookId: data.playbookId }),
      ...(data.playbookData && { playbookData: data.playbookData }),
      ...(data.resolutionSummary && { resolutionSummary: data.resolutionSummary }),
      ...(data.metadata && { metadata: data.metadata }),
      ...(isResolving && { resolvedAt: new Date() }),
      updatedAt: new Date(),
    },
  });

  // Create timeline event
  const changesList = Object.keys(data).filter(key => data[key as keyof UpdateIncidentInput] !== undefined);
  await context.entities.TimelineEvent.create({
    data: {
      type: 'INFO' as TimelineEventType,
      title: 'Incident Updated',
      description: `Incident updated by ${context.user.email || context.user.username}. Changed: ${changesList.join(', ')}`,
      timestamp: new Date(),
      userId: userId,
      incidentId: incident.id,
      metadata: { changes: data },
    },
  });

  // Audit log
  await logIncidentUpdated(context, workspaceId, incidentId, data);

  // If resolved, send notification
  if (isResolving && existingIncident.assignedToId) {
    await notifyIncidentResolved(workspaceId, existingIncident.assignedToId, {
      id: incident.id,
      title: incident.title,
    });
  }

  return incident;
};

/**
 * Assign incident to a user
 */
export const assignIncident = async (
  args: {
    incidentId: string;
    workspaceId: string;
    assigneeId: string;
  },
  context: any
): Promise<Incident> => {
  const { incidentId, workspaceId, assigneeId } = args;

  // Check workspace access and permissions
  const { role } = await checkWorkspaceAccess(context, workspaceId);

  if (!canAssign(role)) {
    throw new HttpError(403, 'Only admins and owners can assign incidents');
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

  // Get incident details for notification
  const incident = await context.entities.Incident.findUnique({
    where: { id: incidentId },
  });

  if (!incident) {
    throw new HttpError(404, 'Incident not found');
  }

  // Update incident
  const updatedIncident = await updateIncident(
    {
      incidentId,
      workspaceId,
      data: {
        assignedToId: assigneeId,
        status: incident.status === 'ACTIVE' ? 'INVESTIGATING' : incident.status,
      },
    },
    context
  );

  // Send notification to assignee
  await notifyIncidentAssigned(workspaceId, assigneeId, {
    id: incident.id,
    title: incident.title,
    severity: incident.severity,
  });

  return updatedIncident;
};

/**
 * Update incident progress
 */
export const updateIncidentProgress = async (
  args: {
    incidentId: string;
    workspaceId: string;
    progress: number;
  },
  context: any
): Promise<Incident> => {
  const { incidentId, workspaceId, progress } = args;

  if (progress < 0 || progress > 100) {
    throw new HttpError(400, 'Progress must be between 0 and 100');
  }

  return updateIncident(
    {
      incidentId,
      workspaceId,
      data: { progress },
    },
    context
  );
};

/**
 * Add investigation note to incident
 */
export const addIncidentNote = async (
  args: {
    incidentId: string;
    workspaceId: string;
    content: string;
  },
  context: any
): Promise<any> => {
  const { incidentId, workspaceId, content } = args;

  // Check workspace access
  const { userId } = await checkWorkspaceAccess(context, workspaceId);

  // Verify incident exists and user has access
  const incident = await context.entities.Incident.findUnique({
    where: { id: incidentId },
  });

  if (!incident) {
    throw new HttpError(404, 'Incident not found');
  }

  if (incident.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  const note = await context.entities.InvestigationNote.create({
    data: {
      content,
      authorId: userId,
      incidentId,
    },
    include: {
      author: true,
    },
  });

  // Timeline event
  await context.entities.TimelineEvent.create({
    data: {
      type: 'INFO' as TimelineEventType,
      title: 'Note Added',
      description: `Investigation note added by ${context.user.email || context.user.username}`,
      timestamp: new Date(),
      userId: userId,
      incidentId: incident.id,
    },
  });

  return note;
};

/**
 * Apply playbook to incident
 */
export const applyPlaybook = async (
  args: {
    incidentId: string;
    workspaceId: string;
    playbookId: string;
    playbook: Playbook;
  },
  context: any
): Promise<{ incident: Incident; tasks: any[] }> => {
  const { incidentId, workspaceId, playbookId, playbook } = args;

  // Check workspace access
  const { userId } = await checkWorkspaceAccess(context, workspaceId);

  // Get incident
  const incident = await context.entities.Incident.findUnique({
    where: { id: incidentId },
  });

  if (!incident) {
    throw new HttpError(404, 'Incident not found');
  }

  if (incident.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  // Update incident with playbook
  const updatedIncident = await context.entities.Incident.update({
    where: { id: incidentId },
    data: {
      playbookId,
      playbookData: playbook,
    },
  });

  // Create tasks from playbook
  const tasks = await Promise.all(
    playbook.tasks.map(task =>
      context.entities.Task.create({
        data: {
          title: task.title,
          description: task.description,
          status: 'WAITING',
          priority: task.priority,
          incidentId,
          group: task.group,
          order: task.order,
          estimatedHours: task.estimatedHours,
          dependencies: task.dependencies?.map(String) || [],
        },
      })
    )
  );

  // Timeline event
  await context.entities.TimelineEvent.create({
    data: {
      type: 'INFO' as TimelineEventType,
      title: 'Playbook Applied',
      description: `Playbook "${playbook.name}" applied with ${tasks.length} tasks`,
      timestamp: new Date(),
      userId: userId,
      incidentId: incident.id,
      metadata: { playbookId, taskCount: tasks.length },
    },
  });

  return { incident: updatedIncident, tasks };
};

/**
 * Check and update SLA status
 */
export const checkSLA = async (
  args: { incidentId: string; workspaceId: string },
  context: any
): Promise<SLAStatus> => {
  const { incidentId, workspaceId } = args;

  // Check workspace access
  await checkWorkspaceAccess(context, workspaceId);

  const incident = await context.entities.Incident.findUnique({
    where: { id: incidentId },
    include: { assignedTo: true },
  });

  if (!incident) {
    throw new HttpError(404, 'Incident not found');
  }

  if (!incident.slaDeadline) {
    throw new HttpError(400, 'Incident does not have an SLA deadline');
  }

  const now = new Date();
  const deadline = new Date(incident.slaDeadline);
  const isBreached = now > deadline;
  const remainingTime = deadline.getTime() - now.getTime();

  // Update breach status if changed
  if (isBreached && !incident.slaBreached) {
    await context.entities.Incident.update({
      where: { id: incidentId },
      data: { slaBreached: true },
    });

    // Send notification
    if (incident.assignedToId) {
      await notifySLABreach(workspaceId, incident.assignedToId, {
        id: incident.id,
        title: incident.title,
        slaDeadline: incident.slaDeadline,
      });
    }
  }

  return {
    isBreached,
    deadline,
    remainingTime: isBreached ? 0 : remainingTime,
  };
};

/**
 * Resolve incident
 */
export const resolveIncident = async (
  args: {
    incidentId: string;
    workspaceId: string;
    resolutionSummary: string;
  },
  context: any
): Promise<Incident> => {
  const { incidentId, workspaceId, resolutionSummary } = args;

  const incident = await updateIncident(
    {
      incidentId,
      workspaceId,
      data: {
        status: 'RESOLVED',
        resolutionSummary,
        progress: 100,
      },
    },
    context
  );

  // Audit log
  await logIncidentResolved(context, workspaceId, incidentId, resolutionSummary);

  return incident;
};

/**
 * Close incident
 */
export const closeIncident = async (
  args: { incidentId: string; workspaceId: string },
  context: any
): Promise<Incident> => {
  return updateIncident(
    {
      incidentId: args.incidentId,
      workspaceId: args.workspaceId,
      data: { status: 'CLOSED' },
    },
    context
  );
};

/**
 * Escalate incident to case
 */
export const escalateToCase = async (
  args: {
    incidentId: string;
    workspaceId: string;
    caseData: {
      title: string;
      description: string;
      priority?: Priority;
      caseType?: string;
    };
  },
  context: any
): Promise<{ incident: Incident; case: any }> => {
  const { incidentId, workspaceId, caseData } = args;

  // Check workspace access
  const { userId } = await checkWorkspaceAccess(context, workspaceId);

  // Get incident
  const incident = await context.entities.Incident.findUnique({
    where: { id: incidentId },
    include: { observables: true, alerts: true },
  });

  if (!incident) {
    throw new HttpError(404, 'Incident not found');
  }

  if (incident.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  // Create case
  const caseRecord = await context.entities.Case.create({
    data: {
      workspaceId,
      title: caseData.title || incident.title,
      description: caseData.description || incident.description,
      priority: caseData.priority || incident.priority,
      status: 'ACTIVE',
      caseType: caseData.caseType,
    },
  });

  // Link incident to case
  await context.entities.Incident.update({
    where: { id: incidentId },
    data: {
      cases: {
        connect: { id: caseRecord.id },
      },
    },
  });

  // Copy observables to case
  if (incident.observables.length > 0) {
    await context.entities.Case.update({
      where: { id: caseRecord.id },
      data: {
        observables: {
          connect: incident.observables.map((obs: any) => ({ id: obs.id })),
        },
      },
    });
  }

  // Timeline events
  await Promise.all([
    context.entities.TimelineEvent.create({
      data: {
        type: 'WARNING' as TimelineEventType,
        title: 'Incident Escalated',
        description: `Incident escalated to case ${caseRecord.id}`,
        timestamp: new Date(),
        userId: userId,
        incidentId: incident.id,
        metadata: { caseId: caseRecord.id },
      },
    }),
    context.entities.TimelineEvent.create({
      data: {
        type: 'INFO' as TimelineEventType,
        title: 'Case Created from Incident',
        description: `Created from incident ${incident.id}`,
        timestamp: new Date(),
        userId: userId,
        caseId: caseRecord.id,
        metadata: { incidentId: incident.id },
      },
    }),
  ]);

  return { incident, case: caseRecord };
};

/**
 * Get incident statistics for dashboard
 */
export const getIncidentStats = async (
  args: { workspaceId: string; days?: number },
  context: any
): Promise<IncidentStats> => {
  const { workspaceId, days = 30 } = args;

  // Check workspace access
  await checkWorkspaceAccess(context, workspaceId);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const allIncidents = await context.entities.Incident.findMany({
    where: { workspaceId },
  });

  const recentIncidents = allIncidents.filter((i: any) => i.createdAt >= startDate);

  const openIncidents = allIncidents.filter((i: any) =>
    !['RESOLVED', 'CLOSED'].includes(i.status)
  );

  const last7d = new Date();
  last7d.setDate(last7d.getDate() - 7);

  const last30d = new Date();
  last30d.setDate(last30d.getDate() - 30);

  const resolved7d = allIncidents.filter(
    (i: any) => i.resolvedAt && i.resolvedAt >= last7d
  );

  const resolved30d = allIncidents.filter(
    (i: any) => i.resolvedAt && i.resolvedAt >= last30d
  );

  // Calculate metrics
  const resolvedWithTime = resolved30d.filter((i: any) => i.resolvedAt);
  const avgResolutionTime =
    resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((sum: number, i: any) => {
          const duration = i.resolvedAt!.getTime() - i.createdAt.getTime();
          return sum + duration;
        }, 0) / resolvedWithTime.length / 60000 // convert to minutes
      : 0;

  const stats: IncidentStats = {
    totalOpen: openIncidents.length,
    critical: openIncidents.filter((i: any) => i.severity === 'CRITICAL').length,
    high: openIncidents.filter((i: any) => i.severity === 'HIGH').length,
    inSLA: openIncidents.filter((i: any) => !i.slaBreached).length,
    outOfSLA: openIncidents.filter((i: any) => i.slaBreached).length,
    resolved7d: resolved7d.length,
    resolved30d: resolved30d.length,
    avgResponseTime: 0, // Would need alert timestamps
    avgResolutionTime,
    mttr: avgResolutionTime,
    mttd: 0, // Mean Time To Detect - would need detection timestamps
    mtta: 0, // Mean Time To Acknowledge - would need acknowledgment timestamps
    byStatus: {},
    bySeverity: {},
    byTeam: {},
    trends: [],
  };

  // Group by status, severity, team
  allIncidents.forEach((incident: any) => {
    stats.byStatus[incident.status] = (stats.byStatus[incident.status] || 0) + 1;
    stats.bySeverity[incident.severity] = (stats.bySeverity[incident.severity] || 0) + 1;
    if (incident.team) {
      stats.byTeam[incident.team] = (stats.byTeam[incident.team] || 0) + 1;
    }
  });

  // Calculate trends (daily counts for last 7 days)
  for (let i: number = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const opened = allIncidents.filter(
      (inc: any) => inc.createdAt >= date && inc.createdAt < nextDate
    ).length;

    const resolved = allIncidents.filter(
      (inc: any) => inc.resolvedAt && inc.resolvedAt >= date && inc.resolvedAt < nextDate
    ).length;

    stats.trends.push({
      period: date.toISOString().split('T')[0],
      opened,
      resolved,
    });
  }

  return stats;
};
