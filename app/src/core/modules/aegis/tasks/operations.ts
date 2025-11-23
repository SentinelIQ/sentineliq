/**
 * Aegis Module - Task Operations
 * 
 * This module provides operations for managing investigation tasks with dependencies and playbooks.
 */

import { HttpError } from 'wasp/server';
import type { Task, User, Incident, Case } from 'wasp/entities';
import { TaskStatus, Priority } from '@prisma/client';
import type { TaskWithRelations, CreateTaskInput, UpdateTaskInput } from '../models/types';
import { checkWorkspaceAccess } from '../utils/permissions';
import { FeatureChecker } from '../../../features/FeatureChecker';
import { notifyTaskAssigned, notifyTaskCompleted } from '../utils/notifications';

export const getTasksByIncident = async (
  args: { incidentId: string; workspaceId: string },
  context: any
): Promise<TaskWithRelations[]> => {
  await checkWorkspaceAccess(context, args.workspaceId);
  const incident = await context.entities.Incident.findUnique({ where: { id: args.incidentId } });
  if (!incident || incident.workspaceId !== args.workspaceId) throw new HttpError(404, 'Incident not found');

  return context.entities.Task.findMany({
    where: { incidentId: args.incidentId },
    include: { assignee: true, incident: true },
    orderBy: [{ group: 'asc' }, { order: 'asc' }],
  });
};

export const getTasksByCase = async (
  args: { caseId: string; workspaceId: string },
  context: any
): Promise<TaskWithRelations[]> => {
  await checkWorkspaceAccess(context, args.workspaceId);
  const caseRecord = await context.entities.Case.findUnique({ where: { id: args.caseId } });
  if (!caseRecord || caseRecord.workspaceId !== args.workspaceId) throw new HttpError(404, 'Case not found');

  return context.entities.Task.findMany({
    where: { caseId: args.caseId },
    include: { assignee: true, case: true },
    orderBy: [{ group: 'asc' }, { order: 'asc' }],
  });
};

export const createTask = async (
  args: { data: CreateTaskInput; workspaceId: string },
  context: any
): Promise<Task> => {
  await checkWorkspaceAccess(context, args.workspaceId);
  
  // Check if task automation feature is available
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'aegis.task_automation'
  );
  
  return context.entities.Task.create({
    data: {
      title: args.data.title,
      description: args.data.description,
      status: 'WAITING',
      priority: args.data.priority || 'MEDIUM',
      assigneeId: args.data.assigneeId,
      incidentId: args.data.incidentId,
      caseId: args.data.caseId,
      group: args.data.group,
      order: args.data.order || 0,
      startDate: args.data.startDate,
      dueDate: args.data.dueDate,
      estimatedHours: args.data.estimatedHours,
      dependencies: args.data.dependencies || [],
    },
  });
};

export const updateTask = async (
  args: { taskId: string; workspaceId: string; data: UpdateTaskInput },
  context: any
): Promise<Task> => {
  await checkWorkspaceAccess(context, args.workspaceId);
  
  // Check if task automation feature is available
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'aegis.task_automation'
  );
  
  const task = await context.entities.Task.findUnique({ where: { id: args.taskId }, include: { incident: true, case: true } });
  if (!task) throw new HttpError(404, 'Task not found');
  
  const workspaceId = task.incident?.workspaceId || task.case?.workspaceId;
  if (workspaceId !== args.workspaceId) throw new HttpError(403, 'Access denied');

  return context.entities.Task.update({
    where: { id: args.taskId },
    data: {
      ...(args.data.title && { title: args.data.title }),
      ...(args.data.description !== undefined && { description: args.data.description }),
      ...(args.data.status && { status: args.data.status }),
      ...(args.data.priority && { priority: args.data.priority }),
      ...(args.data.assigneeId !== undefined && { assigneeId: args.data.assigneeId }),
      ...(args.data.group && { group: args.data.group }),
      ...(args.data.order !== undefined && { order: args.data.order }),
      ...(args.data.startDate && { startDate: args.data.startDate }),
      ...(args.data.dueDate && { dueDate: args.data.dueDate }),
      ...(args.data.completedById && { completedById: args.data.completedById }),
      ...(args.data.estimatedHours && { estimatedHours: args.data.estimatedHours }),
      ...(args.data.actualHours && { actualHours: args.data.actualHours }),
      ...(args.data.dependencies && { dependencies: args.data.dependencies }),
      updatedAt: new Date(),
    },
  });
};

export const completeTask = async (
  args: { taskId: string; workspaceId: string; actualHours?: number },
  context: any
): Promise<Task> => {
  const task = await updateTask({
    taskId: args.taskId,
    workspaceId: args.workspaceId,
    data: {
      status: 'COMPLETED',
      completedById: context.user.id,
      actualHours: args.actualHours,
    },
  }, context);

  const workspaceId = args.workspaceId;
  if (task.assigneeId) {
    await notifyTaskCompleted(workspaceId, task.assigneeId, {
      id: task.id,
      title: task.title,
      incidentId: task.incidentId || undefined,
      caseId: task.caseId || undefined,
    });
  }

  await context.entities.Task.update({
    where: { id: args.taskId },
    data: { completedAt: new Date() },
  });

  return task;
};

export const getTaskDependencies = async (
  args: { taskId: string; workspaceId: string },
  context: any
): Promise<Task[]> => {
  await checkWorkspaceAccess(context, args.workspaceId);
  
  const task = await context.entities.Task.findUnique({ where: { id: args.taskId } });
  if (!task) throw new HttpError(404, 'Task not found');
  
  if (task.dependencies.length === 0) return [];
  
  return context.entities.Task.findMany({
    where: { id: { in: task.dependencies } },
    include: { assignee: true },
  });
};
