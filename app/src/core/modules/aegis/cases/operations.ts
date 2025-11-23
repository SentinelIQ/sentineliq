/**
 * Aegis Module - Case Operations
 * 
 * This module provides all CRUD operations and business logic for investigation cases.
 * Includes chain of custody, MITRE ATT&CK TTPs, findings, recommendations, and reports.
 */

import { HttpError } from 'wasp/server';
import type {
  Case,
  User,
  Workspace,
  WorkspaceMember,
  Alert,
  Incident,
  Evidence,
  Observable,
  Task,
  TTP,
  TimelineEvent,
  InvestigationNote,
} from 'wasp/entities';
import {
  CaseStatus,
  Priority,
  TimelineEventType,
} from '@prisma/client';
import type {
  CaseWithRelations,
  CaseFilters,
  PaginationParams,
  SortParams,
  PaginatedResult,
  CreateCaseInput,
  UpdateCaseInput,
  CaseStats,
  CaseReport,
  CaseTemplate,
} from '../models/types';
import { checkWorkspaceAccess, canManageCase, canAssign } from '../utils/permissions';
import {
  logCaseCreated,
  logCaseUpdated,
  logCaseClosed,
} from '../utils/audit';
import {
  notifyCaseCreated,
  notifyCaseAssigned,
  notifyCaseClosed,
} from '../utils/notifications';
import { FeatureChecker } from '../../../features/FeatureChecker';

const getPlanQuotas = (plan: string | null): any => ({
  free: { maxCases: 3 },
  hobby: { maxCases: 30 },
  pro: { maxCases: -1 },
}[plan || 'free'] || { maxCases: 3 });

/**
 * Get cases with filtering, pagination, and sorting
 */
export const getCases = async (
  args: {
    filters: CaseFilters;
    pagination?: PaginationParams;
    sort?: SortParams;
  },
  context: any
): Promise<PaginatedResult<CaseWithRelations>> => {
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

  if (filters.priority) {
    where.priority = Array.isArray(filters.priority)
      ? { in: filters.priority }
      : filters.priority;
  }

  if (filters.status) {
    where.status = Array.isArray(filters.status)
      ? { in: filters.status }
      : filters.status;
  }

  if (filters.caseType) {
    where.caseType = Array.isArray(filters.caseType)
      ? { in: filters.caseType }
      : filters.caseType;
  }

  if (filters.investigatorId !== undefined) {
    where.investigatorId = filters.investigatorId;
  }

  if (filters.team) {
    where.team = filters.team;
  }

  if (filters.confidentiality) {
    where.confidentiality = filters.confidentiality;
  }

  if (filters.dateRange) {
    where.createdAt = {
      gte: filters.dateRange.from,
      lte: filters.dateRange.to,
    };
  }

  // Build orderBy
  const orderBy: any = {};
  if (sort.sortBy) {
    orderBy[sort.sortBy] = sort.sortOrder || 'desc';
  } else {
    orderBy.createdAt = 'desc';
  }

  // Execute query
  const [cases, total] = await Promise.all([
    context.entities.Case.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        workspace: true,
        investigator: true,
        incidents: {
          take: 10,
          include: {
            assignedTo: true,
          },
        },
        evidence: {
          take: 20,
          include: {
            collectedBy: true,
          },
        },
        observables: {
          take: 30,
        },
        tasks: {
          orderBy: { order: 'asc' },
        },
        ttps: true,
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
    context.entities.Case.count({ where }),
  ]);

  return {
    data: cases,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * Get case by ID with full details
 */
export const getCaseById = async (
  args: { caseId: string; workspaceId: string },
  context: any
): Promise<CaseWithRelations> => {
  const { caseId, workspaceId } = args;

  // Check workspace access
  await checkWorkspaceAccess(context, workspaceId);

  const caseRecord = await context.entities.Case.findUnique({
    where: { id: caseId },
    include: {
      workspace: true,
      investigator: true,
      incidents: {
        include: {
          assignedTo: true,
          alerts: true,
        },
      },
      evidence: {
        include: {
          collectedBy: true,
          custodyLog: {
            include: {
              user: true,
            },
            orderBy: { timestamp: 'desc' },
          },
          observables: true,
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
      ttps: {
        orderBy: { createdAt: 'desc' },
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

  if (!caseRecord) {
    throw new HttpError(404, 'Case not found');
  }

  if (caseRecord.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  return caseRecord;
};

/**
 * Create a new case
 */
export const createCase = async (
  args: { data: CreateCaseInput },
  context: any
): Promise<Case> => {
  const { data } = args;

  // Check workspace access
  const { userId } = await checkWorkspaceAccess(context, data.workspaceId);

  // 🚀 Check case management feature
  await FeatureChecker.requireFeature(
    context,
    data.workspaceId,
    'aegis.case_management'
  );

  // Check quota
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: data.workspaceId },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  const quotas = getPlanQuotas(workspace.subscriptionPlan);

  if (quotas.maxCases !== -1) {
    const caseCount = await context.entities.Case.count({
      where: { workspaceId: data.workspaceId },
    });

    if (caseCount >= quotas.maxCases) {
      throw new HttpError(
        403,
        `Case limit reached. Your ${workspace.subscriptionPlan || 'free'} plan allows ${quotas.maxCases} cases.`
      );
    }
  }

  // Create case
  const caseRecord = await context.entities.Case.create({
    data: {
      workspaceId: data.workspaceId,
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      status: 'ACTIVE',
      caseType: data.caseType,
      confidentiality: data.confidentiality || 'CONFIDENTIAL',
      team: data.team,
      templateId: data.templateId,
      metadata: data.metadata,
    },
  });

  // Create timeline event
  await context.entities.TimelineEvent.create({
    data: {
      type: 'INFO' as TimelineEventType,
      title: 'Case Created',
      description: `Case created by ${context.user.email || context.user.username}`,
      timestamp: new Date(),
      userId: userId,
      caseId: caseRecord.id,
      metadata: {
        priority: caseRecord.priority,
        caseType: caseRecord.caseType,
      },
    },
  });

  // Audit log
  await logCaseCreated(context, data.workspaceId, caseRecord.id, {
    title: caseRecord.title,
    caseType: caseRecord.caseType,
    priority: caseRecord.priority,
  });

  // Send notification to workspace admins
  const admins = await context.entities.WorkspaceMember.findMany({
    where: {
      workspaceId: data.workspaceId,
      role: { in: ['OWNER', 'ADMIN'] },
    },
  });

  for (const admin of admins) {
    await notifyCaseCreated(data.workspaceId, admin.userId, {
      id: caseRecord.id,
      title: caseRecord.title,
      priority: caseRecord.priority,
    });
  }

  return caseRecord;
};

/**
 * Update a case
 */
export const updateCase = async (
  args: {
    caseId: string;
    workspaceId: string;
    data: UpdateCaseInput;
  },
  context: any
): Promise<Case> => {
  const { caseId, workspaceId, data } = args;

  // Check workspace access
  const { role, userId } = await checkWorkspaceAccess(context, workspaceId);

  // Get existing case
  const existingCase = await context.entities.Case.findUnique({
    where: { id: caseId },
  });

  if (!existingCase) {
    throw new HttpError(404, 'Case not found');
  }

  if (existingCase.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  // Check permissions
  const isInvestigator = existingCase.investigatorId === userId;
  if (!canManageCase(role, isInvestigator)) {
    throw new HttpError(403, 'You do not have permission to update this case');
  }

  // Update case
  const caseRecord = await context.entities.Case.update({
    where: { id: caseId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.priority && { priority: data.priority }),
      ...(data.status && { status: data.status }),
      ...(data.caseType && { caseType: data.caseType }),
      ...(data.confidentiality && { confidentiality: data.confidentiality }),
      ...(data.team && { team: data.team }),
      ...(data.investigatorId !== undefined && { investigatorId: data.investigatorId }),
      ...(data.findings && { findings: data.findings }),
      ...(data.recommendations && { recommendations: data.recommendations }),
      ...(data.metadata && { metadata: data.metadata }),
      updatedAt: new Date(),
    },
  });

  // Create timeline event
  const changesList = Object.keys(data).filter(key => data[key as keyof UpdateCaseInput] !== undefined);
  await context.entities.TimelineEvent.create({
    data: {
      type: 'INFO' as TimelineEventType,
      title: 'Case Updated',
      description: `Case updated by ${context.user.email || context.user.username}. Changed: ${changesList.join(', ')}`,
      timestamp: new Date(),
      userId: userId,
      caseId: caseRecord.id,
      metadata: { changes: data },
    },
  });

  // Audit log
  await logCaseUpdated(context, workspaceId, caseId, data);

  return caseRecord;
};

/**
 * Assign case to investigator
 */
export const assignCase = async (
  args: {
    caseId: string;
    workspaceId: string;
    investigatorId: string;
  },
  context: any
): Promise<Case> => {
  const { caseId, workspaceId, investigatorId } = args;

  // Check workspace access and permissions
  const { role } = await checkWorkspaceAccess(context, workspaceId);

  if (!canAssign(role)) {
    throw new HttpError(403, 'Only admins and owners can assign cases');
  }

  // Verify investigator is a member
  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: investigatorId,
      workspaceId,
    },
  });

  if (!membership) {
    throw new HttpError(400, 'Investigator is not a member of this workspace');
  }

  // Get case details for notification
  const caseRecord = await context.entities.Case.findUnique({
    where: { id: caseId },
  });

  if (!caseRecord) {
    throw new HttpError(404, 'Case not found');
  }

  // Update case
  const updatedCase = await updateCase(
    {
      caseId,
      workspaceId,
      data: { investigatorId },
    },
    context
  );

  // Send notification to investigator
  await notifyCaseAssigned(workspaceId, investigatorId, {
    id: caseRecord.id,
    title: caseRecord.title,
    priority: caseRecord.priority,
  });

  return updatedCase;
};

/**
 * Add investigation note to case
 */
export const addCaseNote = async (
  args: {
    caseId: string;
    workspaceId: string;
    content: string;
  },
  context: any
): Promise<any> => {
  const { caseId, workspaceId, content } = args;

  // Check workspace access
  const { userId } = await checkWorkspaceAccess(context, workspaceId);

  // Verify case exists and user has access
  const caseRecord = await context.entities.Case.findUnique({
    where: { id: caseId },
  });

  if (!caseRecord) {
    throw new HttpError(404, 'Case not found');
  }

  if (caseRecord.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  const note = await context.entities.InvestigationNote.create({
    data: {
      content,
      authorId: userId,
      caseId,
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
      caseId: caseRecord.id,
    },
  });

  return note;
};

/**
 * Add findings to case
 */
export const addFindings = async (
  args: {
    caseId: string;
    workspaceId: string;
    findings: string;
  },
  context: any
): Promise<Case> => {
  return updateCase(
    {
      caseId: args.caseId,
      workspaceId: args.workspaceId,
      data: { findings: args.findings },
    },
    context
  );
};

/**
 * Add recommendations to case
 */
export const addRecommendations = async (
  args: {
    caseId: string;
    workspaceId: string;
    recommendations: string;
  },
  context: any
): Promise<Case> => {
  return updateCase(
    {
      caseId: args.caseId,
      workspaceId: args.workspaceId,
      data: { recommendations: args.recommendations },
    },
    context
  );
};

/**
 * Close case with final report
 */
export const closeCase = async (
  args: {
    caseId: string;
    workspaceId: string;
    finalReport?: any;
  },
  context: any
): Promise<Case> => {
  const { caseId, workspaceId, finalReport } = args;

  const { userId } = await checkWorkspaceAccess(context, workspaceId);

  const caseRecord = await updateCase(
    {
      caseId,
      workspaceId,
      data: {
        status: 'CLOSED',
        ...(finalReport && { finalReport }),
      },
    },
    context
  );

  // Update with closure metadata
  await context.entities.Case.update({
    where: { id: caseId },
    data: {
      closedAt: new Date(),
      closedBy: userId,
    },
  });

  // Audit log
  await logCaseClosed(context, workspaceId, caseId);

  // Notify investigator if assigned
  if (caseRecord.investigatorId) {
    await notifyCaseClosed(workspaceId, caseRecord.investigatorId, {
      id: caseRecord.id,
      title: caseRecord.title,
    });
  }

  return caseRecord;
};

/**
 * Reopen a closed case
 */
export const reopenCase = async (
  args: { caseId: string; workspaceId: string; reason: string },
  context: any
): Promise<Case> => {
  const { caseId, workspaceId, reason } = args;

  const { userId } = await checkWorkspaceAccess(context, workspaceId);

  const caseRecord = await updateCase(
    {
      caseId,
      workspaceId,
      data: { status: 'ACTIVE' },
    },
    context
  );

  // Clear closure metadata
  await context.entities.Case.update({
    where: { id: caseId },
    data: {
      closedAt: null,
      closedBy: null,
    },
  });

  // Timeline event
  await context.entities.TimelineEvent.create({
    data: {
      type: 'WARNING' as TimelineEventType,
      title: 'Case Reopened',
      description: reason,
      timestamp: new Date(),
      userId: userId,
      caseId: caseRecord.id,
    },
  });

  return caseRecord;
};

/**
 * Generate comprehensive case report
 */
export const generateCaseReport = async (
  args: { caseId: string; workspaceId: string },
  context: any
): Promise<CaseReport> => {
  const { caseId, workspaceId } = args;

  // Check workspace access
  await checkWorkspaceAccess(context, workspaceId);

  // Get full case data
  const caseRecord = await getCaseById({ caseId, workspaceId }, context);

  // Calculate investigation duration
  const investigationDuration = caseRecord.closedAt
    ? (caseRecord.closedAt.getTime() - caseRecord.createdAt.getTime()) / (1000 * 60 * 60)
    : (new Date().getTime() - caseRecord.createdAt.getTime()) / (1000 * 60 * 60);

  const report: CaseReport = {
    case: caseRecord as any,
    incidents: caseRecord.incidents as any,
    evidence: caseRecord.evidence as any,
    observables: caseRecord.observables as any,
    ttps: caseRecord.ttps,
    timeline: caseRecord.timeline,
    notes: caseRecord.notes,
    summary: {
      totalIncidents: caseRecord.incidents.length,
      totalEvidence: caseRecord.evidence.length,
      totalObservables: caseRecord.observables.length,
      investigationDuration: Math.round(investigationDuration),
    },
  };

  return report;
};

/**
 * Export case data in various formats
 */
export const exportCaseData = async (
  args: {
    caseId: string;
    workspaceId: string;
    format: 'json' | 'csv';
  },
  context: any
): Promise<any> => {
  const { caseId, workspaceId, format } = args;

  const report = await generateCaseReport({ caseId, workspaceId }, context);

  if (format === 'json') {
    return report;
  }

  // CSV export would need additional formatting
  // For now, return JSON structure that can be converted
  return {
    format: 'csv',
    data: report,
    // CSV conversion would happen in a separate utility
  };
};

/**
 * Apply case template
 */
export const applyCaseTemplate = async (
  args: {
    caseId: string;
    workspaceId: string;
    template: CaseTemplate;
  },
  context: any
): Promise<{ case: Case; tasks: any[] }> => {
  const { caseId, workspaceId, template } = args;

  // Check workspace access
  const { userId } = await checkWorkspaceAccess(context, workspaceId);

  // Get case
  const caseRecord = await context.entities.Case.findUnique({
    where: { id: caseId },
  });

  if (!caseRecord) {
    throw new HttpError(404, 'Case not found');
  }

  if (caseRecord.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  // Update case with template data
  const updatedCase = await context.entities.Case.update({
    where: { id: caseId },
    data: {
      templateId: template.id,
      caseType: template.caseType,
      priority: template.priority,
      confidentiality: template.confidentiality,
    },
  });

  // Create tasks from template
  const tasks = await Promise.all(
    template.tasks.map(task =>
      context.entities.Task.create({
        data: {
          title: task.title,
          description: task.description,
          status: 'WAITING',
          priority: task.priority,
          caseId,
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
      title: 'Template Applied',
      description: `Template "${template.name}" applied with ${tasks.length} tasks`,
      timestamp: new Date(),
      userId: userId,
      caseId: caseRecord.id,
      metadata: { templateId: template.id, taskCount: tasks.length },
    },
  });

  return { case: updatedCase, tasks };
};

/**
 * Get case statistics for dashboard
 */
export const getCaseStats = async (
  args: { workspaceId: string; days?: number },
  context: any
): Promise<CaseStats> => {
  const { workspaceId, days = 30 } = args;

  // Check workspace access
  await checkWorkspaceAccess(context, workspaceId);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const allCases = await context.entities.Case.findMany({
    where: { workspaceId },
  });

  const recentCases = allCases.filter((c: any) => c.createdAt >= startDate);

  const last30d = new Date();
  last30d.setDate(last30d.getDate() - 30);

  const closed30d = allCases.filter(
    (c: any) => c.closedAt && c.closedAt >= last30d
  );

  // Calculate average investigation time
  const closedWithTime = allCases.filter((c: any) => c.closedAt);
  const avgInvestigationTime =
    closedWithTime.length > 0
      ? closedWithTime.reduce((sum: number, c: any) => {
          const duration = c.closedAt!.getTime() - c.createdAt.getTime();
          return sum + duration;
        }, 0) / closedWithTime.length / (1000 * 60 * 60) // convert to hours
      : 0;

  const stats: CaseStats = {
    total: allCases.length,
    active: allCases.filter((c: any) => c.status === 'ACTIVE').length,
    review: allCases.filter((c: any) => c.status === 'REVIEW').length,
    closed: allCases.filter((c: any) => c.status === 'CLOSED').length,
    closed30d: closed30d.length,
    avgInvestigationTime,
    byPriority: {},
    byStatus: {},
    byType: {},
    byInvestigator: {},
    trends: [],
  };

  // Group by priority, status, type, investigator
  allCases.forEach((caseRecord: any) => {
    stats.byPriority[caseRecord.priority] = (stats.byPriority[caseRecord.priority] || 0) + 1;
    stats.byStatus[caseRecord.status] = (stats.byStatus[caseRecord.status] || 0) + 1;
    
    if (caseRecord.caseType) {
      stats.byType[caseRecord.caseType] = (stats.byType[caseRecord.caseType] || 0) + 1;
    }
    
    if (caseRecord.investigatorId) {
      stats.byInvestigator[caseRecord.investigatorId] = (stats.byInvestigator[caseRecord.investigatorId] || 0) + 1;
    }
  });

  // Calculate trends (daily counts for last 7 days)
  for (let i: number = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const opened = allCases.filter(
      (c: any) => c.createdAt >= date && c.createdAt < nextDate
    ).length;

    const closed = allCases.filter(
      (c: any) => c.closedAt && c.closedAt >= date && c.closedAt < nextDate
    ).length;

    stats.trends.push({
      period: date.toISOString().split('T')[0],
      opened,
      closed,
    });
  }

  return stats;
};
