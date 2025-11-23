/**
 * Aegis Module - Timeline Operations
 * 
 * This module provides operations for managing timeline events across alerts, incidents, and cases.
 */

import { HttpError } from 'wasp/server';
import type { TimelineEvent, User, Alert, Incident, Case } from 'wasp/entities';
import { TimelineEventType } from '@prisma/client';
import { checkWorkspaceAccess } from '../utils/permissions';

interface TimelineEventWithRelations extends TimelineEvent {
  [key: string]: any;
  user?: User | null;
  alert?: Alert | null;
  incident?: Incident | null;
  case?: Case | null;
}

export const getTimeline = async (
  args: {
    workspaceId: string;
    alertId?: string;
    incidentId?: string;
    caseId?: string;
  },
  context: any
): Promise<TimelineEventWithRelations[]> => {
  await checkWorkspaceAccess(context, args.workspaceId);

  const where: any = {};

  if (args.alertId) {
    const alert = await context.entities.Alert.findUnique({ where: { id: args.alertId } });
    if (!alert || alert.workspaceId !== args.workspaceId) {
      throw new HttpError(404, 'Alert not found');
    }
    where.alertId = args.alertId;
  }

  if (args.incidentId) {
    const incident = await context.entities.Incident.findUnique({ where: { id: args.incidentId } });
    if (!incident || incident.workspaceId !== args.workspaceId) {
      throw new HttpError(404, 'Incident not found');
    }
    where.incidentId = args.incidentId;
  }

  if (args.caseId) {
    const caseRecord = await context.entities.Case.findUnique({ where: { id: args.caseId } });
    if (!caseRecord || caseRecord.workspaceId !== args.workspaceId) {
      throw new HttpError(404, 'Case not found');
    }
    where.caseId = args.caseId;
  }

  return context.entities.TimelineEvent.findMany({
    where,
    include: {
      user: true,
      alert: true,
      incident: true,
      case: true,
    },
    orderBy: { timestamp: 'desc' },
  });
};

export const addTimelineEvent = async (
  args: {
    workspaceId: string;
    type: TimelineEventType;
    title: string;
    description: string;
    alertId?: string;
    incidentId?: string;
    caseId?: string;
    metadata?: any;
  },
  context: any
): Promise<TimelineEvent> => {
  const { userId } = await checkWorkspaceAccess(context, args.workspaceId);

  return context.entities.TimelineEvent.create({
    data: {
      type: args.type,
      title: args.title,
      description: args.description,
      timestamp: new Date(),
      userId,
      alertId: args.alertId,
      incidentId: args.incidentId,
      caseId: args.caseId,
      metadata: args.metadata,
    },
  });
};

export const exportTimeline = async (
  args: {
    workspaceId: string;
    alertId?: string;
    incidentId?: string;
    caseId?: string;
    format: 'json' | 'csv';
  },
  context: any
): Promise<any> => {
  const timeline = await getTimeline(
    {
      workspaceId: args.workspaceId,
      alertId: args.alertId,
      incidentId: args.incidentId,
      caseId: args.caseId,
    },
    context
  );

  if (args.format === 'json') {
    return timeline;
  }

  // CSV format
  const csvData = timeline.map(event => ({
    timestamp: event.timestamp,
    type: event.type,
    title: event.title,
    description: event.description,
    user: event.user ? (event.user.email || event.user.username || 'Unknown') : 'Unknown',
  }));

  return {
    format: 'csv',
    data: csvData,
  };
};
