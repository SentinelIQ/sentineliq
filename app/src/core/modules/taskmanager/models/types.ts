/**
 * Task Manager Module - Unified Types
 * Generic task management system for all modules
 */

import type { Task, User, Workspace } from 'wasp/entities';
import type { TaskStatus, Priority } from '@prisma/client';

// TODO: Re-enable after TaskManager schema migration
// import type { TaskTemplate, TaskWorkflow } from 'wasp/entities';
// import type { TaskContextType, WorkflowStatus } from '@prisma/client';

// Temporary type placeholders until schema migration
type TaskTemplate = any;
type TaskWorkflow = any;
type TaskContextType = 'ALERT' | 'INCIDENT' | 'CASE' | 'BRAND_INFRINGEMENT';
type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

// ============================================
// Task Types
// ============================================

export interface TaskWithRelations extends Task {
  assignee?: User | null;
  template?: TaskTemplate | null;
  workflow?: TaskWorkflow | null;
  workspace: Workspace;
  incident?: any | null;
  case?: any | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  assigneeId?: string;
  contextType: TaskContextType;
  contextId?: string;
  workspaceId: string;
  group?: string;
  order?: number;
  tags?: string[];
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  dependencies?: string[];
  templateId?: string;
  workflowId?: string;
  autoCreated?: boolean;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  assigneeId?: string;
  group?: string;
  order?: number;
  tags?: string[];
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  dependencies?: string[];
  blockedBy?: string[];
  notes?: string;
  metadata?: Record<string, any>;
}

export interface TaskFilters {
  workspaceId: string;
  contextType?: TaskContextType | TaskContextType[];
  contextId?: string;
  status?: TaskStatus | TaskStatus[];
  priority?: Priority | Priority[];
  assigneeId?: string;
  group?: string;
  tags?: string[];
  templateId?: string;
  workflowId?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  search?: string;
}

// ============================================
// Template Types
// ============================================

export interface TaskTemplateDefinition {
  title: string;
  description?: string;
  group: string;
  order: number;
  priority: Priority;
  estimatedHours?: number;
  dueInDays?: number; // relative to workflow start
  dependencies?: number[]; // indices of other tasks in template
  autoCompleteConditions?: AutoCompleteCondition[];
  metadata?: Record<string, any>;
}

export interface AutoCompleteCondition {
  type: 'field_value' | 'time_elapsed' | 'dependency_complete' | 'external_event';
  config: Record<string, any>;
}

export interface TaskTemplateData {
  name: string;
  description?: string;
  category: string;
  contextTypes: TaskContextType[];
  tasks: TaskTemplateDefinition[];
  triggerConditions?: TemplateTriggerCondition[];
  metadata?: Record<string, any>;
}

export interface TemplateTriggerCondition {
  type: 'severity' | 'type' | 'field_value' | 'custom';
  field?: string;
  operator?: 'equals' | 'contains' | 'greater_than' | 'in';
  value?: any;
}

export interface CreateTemplateInput {
  workspaceId?: string; // null = system template
  name: string;
  description?: string;
  category: string;
  contextTypes: TaskContextType[];
  taskDefinitions: TaskTemplateDefinition[];
  triggerConditions?: TemplateTriggerCondition[];
  isBuiltin?: boolean;
  version?: string;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  category?: string;
  contextTypes?: TaskContextType[];
  taskDefinitions?: TaskTemplateDefinition[];
  triggerConditions?: TemplateTriggerCondition[];
  isActive?: boolean;
  version?: string;
}

export interface TemplateFilters {
  workspaceId?: string;
  category?: string;
  contextTypes?: TaskContextType[];
  isBuiltin?: boolean;
  isActive?: boolean;
  search?: string;
}

// ============================================
// Workflow Types
// ============================================

export interface WorkflowWithRelations extends TaskWorkflow {
  workspace: Workspace;
  template?: TaskTemplate | null;
  tasks: TaskWithRelations[];
}

export interface CreateWorkflowInput {
  workspaceId: string;
  name: string;
  description?: string;
  contextType: TaskContextType;
  contextId: string;
  templateId?: string;
}

export interface WorkflowFilters {
  workspaceId: string;
  contextType?: TaskContextType;
  contextId?: string;
  status?: WorkflowStatus;
  templateId?: string;
}

// ============================================
// Template Application
// ============================================

export interface ApplyTemplateInput {
  workspaceId: string;
  templateId: string;
  contextType: TaskContextType;
  contextId: string;
  overrides?: Partial<CreateTaskInput>[]; // Override specific tasks
  variables?: Record<string, any>; // Template variables (e.g., ${brandName})
}

export interface ApplyTemplateResult {
  workflow: TaskWorkflow;
  tasks: Task[];
  summary: {
    totalTasks: number;
    byGroup: Record<string, number>;
    byPriority: Record<string, number>;
    estimatedTotalHours: number;
    earliestDueDate?: Date;
    latestDueDate?: Date;
  };
}

// ============================================
// Workflow Orchestration
// ============================================

export interface WorkflowExecutionState {
  workflowId: string;
  status: WorkflowStatus;
  progress: number;
  currentPhase?: string;
  completedTasks: number;
  totalTasks: number;
  blockedTasks: string[];
  nextTasks: string[]; // Tasks ready to start
  estimatedCompletion?: Date;
}

export interface TaskDependencyGraph {
  nodes: {
    taskId: string;
    title: string;
    status: TaskStatus;
    dependencies: string[];
  }[];
  critical_path: string[]; // Task IDs on critical path
  blocked_by: Record<string, string[]>; // taskId -> blocking taskIds
}

// ============================================
// Statistics & Analytics
// ============================================

export interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<Priority, number>;
  byContextType: Record<TaskContextType, number>;
  overdue: number;
  completedThisWeek: number;
  averageCompletionTime: number; // hours
  topAssignees: Array<{ userId: string; userName: string; taskCount: number }>;
}

export interface WorkflowStats {
  total: number;
  active: number;
  completed: number;
  averageProgress: number;
  averageCompletionTime: number; // days
  templateUsage: Array<{ templateId: string; templateName: string; usageCount: number }>;
}

// ============================================
// Pagination & Sorting
// ============================================

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
