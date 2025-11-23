# Task Manager - Core System Integrations (100% Compliance)

_Last updated: 20 Nov 2025_

## Overview
This document details ALL required integrations between the Task Manager module and existing SentinelIQ core systems to achieve full compliance with platform standards.

---

## Integration Map

### 1. `src/core/auth` - Authentication & Authorization

**Required Integrations**:

✅ **User Authentication Check**
- Every operation MUST check `context.user` before proceeding
- Throw `HttpError(401, 'Not authorized')` if user not authenticated
- Pattern already established in all existing operations

✅ **2FA Policy Respect**
- Check workspace `sessionTimeout` setting
- If user session expired, require re-authentication
- Validate 2FA token if workspace enforces 2FA

✅ **Task Permissions via `useAuth`**
- Expose task-specific permissions in client via `useAuth` hook
- Example: `canCreateTask`, `canDeleteTask`, `canAssignTask` based on role

**Implementation Example**:
```typescript
// src/core/modules/taskmanager/operations/createTask.ts
import type { CreateTask } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';

export const createTask: CreateTask = async (args, context) => {
  // ✅ Auth check
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }
  
  // ✅ Check if user session valid (2FA/session timeout)
  await validateUserSession(context.user.id);
  
  // ✅ Check workspace membership and role
  const member = await checkWorkspaceMemberRole(
    args.workspaceId,
    context.user.id,
    ['ADMIN', 'MEMBER'] // roles allowed to create tasks
  );
  
  // Proceed with task creation...
};
```

**Files to Modify**:
- `src/core/modules/taskmanager/operations/*.ts` - Add auth checks to all operations
- `src/client/hooks/useTaskPermissions.ts` - NEW: Custom hook exposing permissions

---

### 2. `src/core/workspace` - Multi-Tenancy & Membership

**Required Integrations**:

✅ **Workspace Access Validation**
- Reuse existing `checkWorkspaceAccess` utility function
- Validate via `WorkspaceMember` lookup before ANY task operation
- Store `workspaceId` on ALL task-related models

✅ **Workspace Quota Enforcement**
- Check `storageQuota` when uploading task attachments
- Increment `storageUsed` when files attached to tasks
- Throw error if quota exceeded (upgrade prompt in UI)

✅ **Soft Delete Respect**
- Filter out tasks from workspaces with `deletedAt IS NOT NULL`
- Include in `garbageCollectWorkspacesJob` cleanup (delete tasks when workspace deleted)

**Implementation Example**:
```typescript
// src/core/modules/taskmanager/services/TaskService.ts
import { checkWorkspaceAccess } from '@src/core/workspace/validation';

export class TaskService {
  static async getTasks(workspaceId: string, userId: string, prisma: PrismaClient) {
    // ✅ Validate workspace access
    await checkWorkspaceAccess(workspaceId, userId, prisma);
    
    // ✅ Filter soft-deleted workspaces
    return prisma.task.findMany({
      where: {
        workspaceId,
        workspace: {
          deletedAt: null // exclude garbage-collected workspaces
        }
      }
    });
  }
  
  static async attachFileToTask(
    taskId: string,
    file: File,
    workspace: Workspace
  ) {
    const fileSize = file.size;
    
    // ✅ Check storage quota
    if (workspace.storageUsed + fileSize > workspace.storageQuota) {
      throw new HttpError(413, 'Storage quota exceeded. Upgrade plan to continue.');
    }
    
    // Upload file to MinIO...
    // Update workspace.storageUsed += fileSize
  }
}
```

**Files to Modify**:
- All task operations - Add workspace validation
- `src/core/workspace/cleanup.ts` - Extend `garbageCollectWorkspacesJob` to delete tasks
- `src/core/modules/taskmanager/services/TaskService.ts` - Storage quota checks

---

### 3. `src/core/user` - User Management

**Required Integrations**:

✅ **Assignee Resolution**
- Fetch user profile data (name, email, avatar) when populating task assignee
- Display user online/offline status in UI (if available)
- Handle out-of-office rules (auto-reassign if user OOO)

✅ **User Soft Delete Handling**
- When user deleted, reassign their tasks to manager or unassign
- Store user ID in `assigneeId` but denormalize display name for historical records

**Implementation Example**:
```typescript
// src/core/modules/taskmanager/operations/getTask.ts
export const getTask: GetTask = async (args, context) => {
  const task = await context.entities.Task.findUnique({
    where: { id: args.taskId },
    include: {
      assignee: {
        select: {
          id: true,
          email: true,
          username: true,
          // Don't include password, tokens, etc
        }
      },
      followers: true, // Resolve follower user objects
    }
  });
  
  // ✅ Enrich with user data
  const assigneeData = task.assignee ? {
    ...task.assignee,
    displayName: getEmail(task.assignee) || task.assignee.username,
    avatarUrl: getUserAvatarUrl(task.assignee.id),
    isOnline: await checkUserOnlineStatus(task.assignee.id), // from Redis
  } : null;
  
  return {
    ...task,
    assignee: assigneeData,
  };
};
```

**Files to Modify**:
- Task query operations - Include user data in responses
- `src/core/user/operations.ts` - Add helper: `reassignUserTasks(userId, newAssigneeId)`

---

### 4. `src/core/notifications` - Notification System

**Required Integrations**:

✅ **Event Publishing to EventBus**
- Emit events: `task.assigned`, `task.status.changed`, `task.completed`, `task.overdue`, `workflow.phase.changed`
- Use existing `src/core/notifications/eventBus` infrastructure

✅ **Notification Delivery**
- Route events through `deliveryService` to configured providers (email, Slack, webhooks)
- Respect user `NotificationPreference` settings (don't spam if disabled)

✅ **Digest Integration**
- Include task notifications in existing `sendNotificationDigestsJob`
- Group notifications by workspace and send according to user's digest schedule

✅ **WebSocket Real-Time Updates**
- Extend `server/notificationWebSocket.ts` to push task updates
- New message types: `TASK_UPDATE`, `TASK_COMMENT`, `TASK_ASSIGNED`

**Implementation Example**:
```typescript
// src/core/modules/taskmanager/services/TaskNotificationService.ts
import { publishEvent } from '@src/core/notifications/eventBus';
import { createNotification } from '@src/core/notifications/operations';

export class TaskNotificationService {
  static async notifyTaskAssigned(
    task: Task,
    assignee: User,
    workspace: Workspace
  ) {
    // ✅ Create in-app notification
    await createNotification({
      type: 'INFO',
      title: `Task assigned: ${task.title}`,
      message: `You've been assigned a ${task.priority} priority task`,
      link: `/workspace/${workspace.id}/tasks/${task.id}`,
      userId: assignee.id,
      workspaceId: workspace.id,
      eventType: 'task.assigned',
      metadata: { taskId: task.id, priority: task.priority }
    });
    
    // ✅ Publish to event bus for external delivery
    await publishEvent({
      type: 'task.assigned',
      workspaceId: workspace.id,
      userId: assignee.id,
      data: {
        taskId: task.id,
        taskTitle: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
        assigneeEmail: assignee.email,
      }
    });
    
    // ✅ WebSocket real-time push
    notifyWebSocket(assignee.id, workspace.id, {
      type: 'TASK_ASSIGNED',
      task: { id: task.id, title: task.title },
    });
  }
}
```

**Files to Modify**:
- `src/core/notifications/eventBus.ts` - Add task event types to enum
- `server/notificationWebSocket.ts` - Add `TASK_UPDATE` message type handling
- `src/core/notifications/digest.ts` - Include task notifications in digest query

---

### 5. `src/core/audit` - Audit Logging

**Required Integrations**:

✅ **Comprehensive Audit Trails**
- Record ALL task CRUD operations as `AuditLog` entries
- Entity type: `'task'`, `'workflow'`, `'task_template'`
- Include before/after state in metadata for compliance

✅ **Metadata Requirements**:
- IP address of requester
- User agent
- Changes: `{ field: 'status', oldValue: 'IN_PROGRESS', newValue: 'COMPLETED' }`

**Implementation Example**:
```typescript
// src/core/modules/taskmanager/operations/updateTask.ts
import { logAuditEvent } from '@src/core/audit/logger';

export const updateTask: UpdateTask = async (args, context) => {
  const existingTask = await context.entities.Task.findUnique({
    where: { id: args.taskId }
  });
  
  const updatedTask = await context.entities.Task.update({
    where: { id: args.taskId },
    data: args.updates
  });
  
  // ✅ Log audit event
  await logAuditEvent({
    workspaceId: updatedTask.workspaceId,
    userId: context.user.id,
    action: 'TASK_UPDATED',
    resource: 'task',
    resourceId: updatedTask.id,
    description: `Task "${updatedTask.title}" updated`,
    metadata: {
      changes: computeChanges(existingTask, updatedTask),
      before: existingTask,
      after: updatedTask,
    },
    ipAddress: context.req?.ip,
    userAgent: context.req?.headers['user-agent'],
  });
  
  return updatedTask;
};
```

**Files to Modify**:
- All task mutation operations - Add audit logging
- `src/core/audit/operations.ts` - Add task-specific audit query helpers

---

### 6. `src/core/logs` - Technical Logging

**Required Integrations**:

✅ **Error Logging**
- Use existing `elkLogger` for error paths (e.g., automation rule failure, external sync error)
- Log level: `ERROR` for exceptions, `WARN` for recoverable issues, `INFO` for operation traces

✅ **Automation Traces**
- Log automation rule executions with timing metrics
- Component: `'task_automation'`, `'task_scheduler'`

**Implementation Example**:
```typescript
// src/core/modules/taskmanager/automation/AutomationEngine.ts
import { logger } from '@src/server/elkLogger';

export class AutomationEngine {
  static async executeRule(rule: TaskAutomationRule, event: TaskEvent) {
    const startTime = Date.now();
    
    try {
      logger.info('Executing automation rule', {
        component: 'task_automation',
        ruleId: rule.id,
        ruleName: rule.name,
        event: event.type,
      });
      
      // Execute rule actions...
      
      logger.info('Automation rule completed', {
        component: 'task_automation',
        ruleId: rule.id,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      logger.error('Automation rule failed', {
        component: 'task_automation',
        ruleId: rule.id,
        error: error.message,
        stack: error.stack,
      });
      
      // Store error in rule for debugging
      await updateRuleLastError(rule.id, error.message);
    }
  }
}
```

**Files to Modify**:
- `src/core/modules/taskmanager/automation/*.ts` - Add logging to automation engine
- `src/core/modules/taskmanager/services/*.ts` - Log service-level errors

---

### 7. `src/core/analytics` - Analytics & Metrics

**Required Integrations**:

✅ **Feed Stats into DailyStatsJob**
- Extend existing `dailyStatsJob` to collect task metrics
- Store in new `TaskStats` entity (see FEATURES.md)
- Calculate: total tasks, completed, overdue, avg completion time, SLA breach rate

✅ **Workspace Analytics Integration**
- Extend `getWorkspaceAnalytics` query to include task metrics
- Show task stats on workspace dashboard

**Implementation Example**:
```typescript
// src/core/analytics/stats.ts (extend existing file)
import type { DailyStatsJob } from 'wasp/server/jobs';

export const calculateDailyStats: DailyStatsJob = async (_args, context) => {
  // ... existing stats calculation
  
  // ✅ Add task stats calculation
  const taskStats = await calculateTaskStats(context.entities);
  
  // Store in new TaskStats entity
  await context.entities.TaskStats.create({
    data: {
      ...taskStats,
      date: new Date(),
    }
  });
  
  // Emit to Plausible/Google Analytics
  await trackEvent('daily_stats_calculated', {
    tasks_completed: taskStats.completedTasks,
    sla_breach_rate: taskStats.slaBreachCount / taskStats.totalTasks,
  });
};

async function calculateTaskStats(entities: any) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const [totalTasks, completedTasks, overdueTasks, slaBreaches] = await Promise.all([
    entities.Task.count(),
    entities.Task.count({ where: { status: 'COMPLETED' } }),
    entities.Task.count({ where: { dueDate: { lt: new Date() }, status: { not: 'COMPLETED' } } }),
    entities.Task.count({ where: { slaBreached: true } }),
  ]);
  
  // Calculate avg completion time...
  
  return { totalTasks, completedTasks, overdueTasks, slaBreaches, /* ... */ };
}
```

**Files to Modify**:
- `src/core/analytics/stats.ts` - Extend `dailyStatsJob` with task metrics
- `src/core/analytics/workspaceAnalytics.ts` - Add task stats to workspace analytics query
- `schema.prisma` - Add `TaskStats` entity (see FUNCTIONAL-SPEC.md)

---

### 8. `src/core/jobs` - PgBoss Job Monitoring

**Required Integrations**:

✅ **New Scheduled Jobs**
- `taskDueReminderJob` (hourly): Send reminders for tasks due soon
- `taskOverdueEscalationJob` (hourly): Escalate overdue tasks
- `workflowHealthJob` (every 6 hours): Check for stalled workflows

✅ **Job Registration in main.wasp**
```wasp
job taskDueReminderJob {
  executor: PgBoss,
  perform: {
    fn: import { sendTaskReminders } from "@src/core/modules/taskmanager/jobs/reminderJob"
  },
  schedule: {
    cron: "0 * * * *" // Every hour
  },
  entities: [Task, User, Notification, NotificationPreference]
}

job taskOverdueEscalationJob {
  executor: PgBoss,
  perform: {
    fn: import { escalateOverdueTasks } from "@src/core/modules/taskmanager/jobs/escalationJob"
  },
  schedule: {
    cron: "0 * * * *" // Every hour
  },
  entities: [Task, Alert, Notification, WorkspaceMember]
}

job workflowHealthJob {
  executor: PgBoss,
  perform: {
    fn: import { checkWorkflowHealth } from "@src/core/modules/taskmanager/jobs/workflowHealthJob"
  },
  schedule: {
    cron: "0 */6 * * *" // Every 6 hours
  },
  entities: [TaskWorkflow, Task, Notification]
}
```

✅ **Job Monitoring Integration**
- Expose job stats via `getJobStats` query (already exists)
- Show task job health in admin dashboard

**Files to Create**:
- `src/core/modules/taskmanager/jobs/reminderJob.ts`
- `src/core/modules/taskmanager/jobs/escalationJob.ts`
- `src/core/modules/taskmanager/jobs/workflowHealthJob.ts`

**Files to Modify**:
- `main.wasp` - Add 3 new job declarations
- `src/core/jobs/operations.ts` - Extend job monitoring to include task jobs

---

### 9. `src/core/payment` & Billing - Plan Gating

**Required Integrations**:

✅ **Feature Gate Enforcement**
- Check `workspace.subscriptionPlan` before allowing premium features
- Free tier: max 50 tasks per workspace
- Hobby tier: unlimited tasks, templates (max 10), automation rules (max 3)
- Pro tier: unlimited everything

✅ **Upgrade Prompts**
- When hitting limit, throw error with upgrade message
- UI shows upgrade CTA with pricing link

**Implementation Example**:
```typescript
// src/core/modules/taskmanager/validation/planLimits.ts
export async function checkTaskLimit(workspaceId: string, prisma: PrismaClient) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { _count: { select: { tasks: true } } }
  });
  
  const limits = {
    free: 50,
    hobby: Infinity,
    pro: Infinity,
  };
  
  const limit = limits[workspace.subscriptionPlan || 'free'];
  
  if (workspace._count.tasks >= limit) {
    throw new HttpError(
      403,
      `Task limit reached (${limit} tasks on ${workspace.subscriptionPlan} plan). Upgrade to continue.`,
      { upgradeUrl: '/pricing' }
    );
  }
}

export function checkFeatureAccess(feature: string, plan: string) {
  const featureMatrix = {
    templates: ['hobby', 'pro'],
    workflows: ['pro'],
    automation: ['pro'],
    external_sync: ['pro'],
    api_access: ['pro'],
  };
  
  const allowedPlans = featureMatrix[feature] || [];
  
  if (!allowedPlans.includes(plan)) {
    throw new HttpError(
      403,
      `${feature} requires ${allowedPlans.join(' or ')} plan`,
      { upgradeUrl: '/pricing' }
    );
  }
}
```

**Files to Modify**:
- All task creation operations - Check limits before creating
- Template/workflow operations - Check plan access
- Client UI - Show "Pro" badges on gated features

---

### 10. `src/core/email` - Email Templates

**Required Integrations**:

✅ **Task Email Templates**
- Reuse existing email template infrastructure
- New templates: `taskAssigned.tsx`, `taskOverdue.tsx`, `workflowSummary.tsx`
- Respect workspace branding (logo, colors)

**Implementation Example**:
```typescript
// src/core/email/templates/taskAssigned.tsx
import React from 'react';
import { EmailTemplate } from './base';

interface TaskAssignedEmailProps {
  taskTitle: string;
  taskPriority: string;
  taskDueDate: string;
  assigneeName: string;
  workspaceName: string;
  workspaceLogo?: string;
  taskUrl: string;
}

export const TaskAssignedEmail: React.FC<TaskAssignedEmailProps> = (props) => {
  return (
    <EmailTemplate
      workspaceName={props.workspaceName}
      workspaceLogo={props.workspaceLogo}
    >
      <h1>New Task Assignment</h1>
      <p>Hi {props.assigneeName},</p>
      <p>
        You've been assigned a <strong>{props.taskPriority}</strong> priority task:
      </p>
      <div className="task-card">
        <h2>{props.taskTitle}</h2>
        <p>Due: {props.taskDueDate}</p>
      </div>
      <a href={props.taskUrl} className="cta-button">
        View Task
      </a>
    </EmailTemplate>
  );
};
```

**Files to Create**:
- `src/core/email/templates/taskAssigned.tsx`
- `src/core/email/templates/taskOverdue.tsx`
- `src/core/email/templates/workflowSummary.tsx`

**Files to Modify**:
- `src/core/email/sender.ts` - Add helper functions for sending task emails

---

### 11. `src/core/messages` - Contact Form Integration

**Required Integrations**:

✅ **Task-Related Inquiries**
- Allow users to reference tasks in contact form messages
- Admin can create task from contact message (e.g., "Bug Report" → task)

**Implementation**:
- Minimal integration, mostly UI-level
- Add optional `relatedTaskId` field to contact form
- Add "Create Task" button in admin messages view

---

### 12. `src/core/database` - Backup & Recovery

**Required Integrations**:

✅ **Task Data in Backups**
- Ensure task entities included in `dailyBackupJob`
- Verify task data restored during disaster recovery tests

**Files to Modify**:
- `src/core/database/backupJob.ts` - Verify task tables included in backup scope
- `src/core/database/operations.ts` - Add task data to recovery verification

---

### 13. `src/shared/validation` - Input Validation

**Required Integrations**:

✅ **Zod Schema Validation**
- ALL operations MUST use `ensureArgsSchemaOrThrowHttpError`
- Define schemas for: `CreateTaskInput`, `UpdateTaskInput`, `CreateTemplateInput`, etc.

**Implementation Example**:
```typescript
// src/core/modules/taskmanager/validation/schemas.ts
import * as z from 'zod';

export const createTaskSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  status: z.enum(['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  assigneeId: z.string().uuid().optional(),
  contextType: z.enum(['INCIDENT', 'CASE', 'BRAND_ALERT', 'TICKET', 'WORKSPACE', 'CUSTOM']),
  contextId: z.string(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  tags: z.array(z.string()).max(20).optional(),
  dependencies: z.array(z.string().uuid()).optional(),
});

// Usage in operation
import { ensureArgsSchemaOrThrowHttpError } from '@src/shared/validation';

export const createTask: CreateTask = async (rawArgs, context) => {
  const args = ensureArgsSchemaOrThrowHttpError(createTaskSchema, rawArgs);
  // args is now type-safe and validated
};
```

**Files to Create**:
- `src/core/modules/taskmanager/validation/schemas.ts` - All Zod schemas

---

### 14. `server/redis.ts` - Caching & Rate Limiting

**Required Integrations**:

✅ **Task Filter Caching**
- Cache expensive filter queries (e.g., "all overdue tasks in workspace") for 5 minutes
- Use Redis keys like `tasks:workspace:{id}:overdue`

✅ **Rate Limiting Protection**
- Apply rate limits to task mutation endpoints (100 req/min per user)
- Protect bulk operations (50 req/min)

**Implementation Example**:
```typescript
// src/core/modules/taskmanager/services/TaskCacheService.ts
import { getRedisClient } from '@src/server/redis';

export class TaskCacheService {
  static async getCachedTasks(cacheKey: string, fetcher: () => Promise<any>) {
    const redis = getRedisClient();
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Cache miss - fetch and store
    const data = await fetcher();
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 300); // 5 min TTL
    
    return data;
  }
  
  static invalidateWorkspaceCache(workspaceId: string) {
    const redis = getRedisClient();
    // Delete all task cache keys for workspace
    redis.del(`tasks:workspace:${workspaceId}:*`);
  }
}
```

**Files to Modify**:
- `server/rateLimit.ts` - Add task-specific rate limiters
- Task query operations - Wrap in cache layer

---

### 15. `server/notificationWebSocket.ts` - Real-Time Updates

**Required Integrations**:

✅ **Extend Payload Schema**
- Add `taskId`, `workflowId` fields to WebSocket messages
- New message types: `TASK_UPDATE`, `TASK_COMMENT`, `WORKFLOW_PHASE_CHANGED`

✅ **Subscription Management**
- Clients subscribe to task updates: `{ type: 'subscribe', resource: 'task', id: 'task-123' }`
- Server pushes updates only to subscribed clients

**Implementation Example**:
```typescript
// server/notificationWebSocket.ts (extend existing)
interface TaskUpdateMessage {
  type: 'TASK_UPDATE';
  taskId: string;
  workspaceId: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  updatedBy: {
    id: string;
    email: string;
  };
}

// In WebSocket message handler
function handleMessage(ws: WebSocket, message: any) {
  if (message.type === 'subscribe' && message.resource === 'task') {
    // Add client to task subscription set
    subscribeToTask(ws, message.id);
  }
}

// When task updated
export function broadcastTaskUpdate(taskId: string, workspaceId: string, changes: any) {
  const message: TaskUpdateMessage = {
    type: 'TASK_UPDATE',
    taskId,
    workspaceId,
    changes,
    updatedBy: { /* ... */ },
  };
  
  // Send to all clients subscribed to this task
  getSubscribedClients(taskId).forEach(ws => {
    ws.send(JSON.stringify(message));
  });
}
```

**Files to Modify**:
- `server/notificationWebSocket.ts` - Add task message types and subscription logic

---

### 16. `services/engine` - Python Automation Service

**Required Integrations** (Optional, future consideration):

✅ **Task Enrichment Queue**
- Push enrichment tasks to Redis queue: `{ taskId, action: 'enrich_ioc', data: {...} }`
- Python service consumes queue, performs threat intel lookup, updates task with results

✅ **Automation Offloading**
- Heavy automation rules run in Python (e.g., ML-based priority prediction)
- Results pushed back via webhook to update task

**Implementation**:
- Use Redis pub/sub or Redis queue (Bull/BullMQ)
- Define JSON schema for task messages
- Python service uses `psycopg2` or `asyncpg` to write results back to DB

**Files to Create** (future):
- `services/engine/tasks/task_enrichment.py`
- `src/core/modules/taskmanager/queue/taskQueue.ts`

---

### 17. `main.wasp` - Operation Registration

**Required Changes**:

✅ **Register All Operations**
- Add query/action declarations for ~30+ operations
- List ALL entities used in each operation

**Example**:
```wasp
// ===================================
// TASK MANAGER MODULE OPERATIONS
// ===================================

// Task CRUD
query getTasks {
  fn: import { getTasks } from "@src/core/modules/taskmanager/operations",
  entities: [Task, User, Workspace, WorkspaceMember, Incident, Case]
}

query getTask {
  fn: import { getTask } from "@src/core/modules/taskmanager/operations",
  entities: [Task, User, Workspace, WorkspaceMember, InvestigationNote, Evidence]
}

action createTask {
  fn: import { createTask } from "@src/core/modules/taskmanager/operations",
  entities: [Task, Workspace, WorkspaceMember, AuditLog, Notification, TimelineEvent]
}

action updateTask {
  fn: import { updateTask } from "@src/core/modules/taskmanager/operations",
  entities: [Task, AuditLog, Notification, TimelineEvent]
}

action deleteTask {
  fn: import { deleteTask } from "@src/core/modules/taskmanager/operations",
  entities: [Task, Workspace, WorkspaceMember, AuditLog]
}

action bulkUpdateTasks {
  fn: import { bulkUpdateTasks } from "@src/core/modules/taskmanager/operations",
  entities: [Task, AuditLog, Notification]
}

// Task Templates
query getTaskTemplates {
  fn: import { getTaskTemplates } from "@src/core/modules/taskmanager/operations",
  entities: [TaskTemplate, Workspace, WorkspaceMember]
}

action createTaskTemplate {
  fn: import { createTaskTemplate } from "@src/core/modules/taskmanager/operations",
  entities: [TaskTemplate, TaskTemplateTask, Workspace, WorkspaceMember, AuditLog]
}

action applyTaskTemplate {
  fn: import { applyTaskTemplate } from "@src/core/modules/taskmanager/operations",
  entities: [Task, TaskTemplate, TaskTemplateTask, Workspace, WorkspaceMember, AuditLog, Notification]
}

// Workflows
query getWorkflows {
  fn: import { getWorkflows } from "@src/core/modules/taskmanager/operations",
  entities: [TaskWorkflow, TaskWorkflowPhase, Task, Workspace, WorkspaceMember]
}

action createWorkflow {
  fn: import { createWorkflow } from "@src/core/modules/taskmanager/operations",
  entities: [TaskWorkflow, TaskWorkflowPhase, Task, Workspace, WorkspaceMember, AuditLog]
}

action advanceWorkflowPhase {
  fn: import { advanceWorkflowPhase } from "@src/core/modules/taskmanager/operations",
  entities: [TaskWorkflow, TaskWorkflowPhase, Task, Notification, AuditLog]
}

// Analytics
query getTaskStats {
  fn: import { getTaskStats } from "@src/core/modules/taskmanager/operations",
  entities: [Task, TaskStats, Workspace, WorkspaceMember]
}

// External Sync
action syncExternalTask {
  fn: import { syncExternalTask } from "@src/core/modules/taskmanager/operations",
  entities: [Task, TicketProvider, Workspace, WorkspaceMember, AuditLog]
}
```

**Files to Modify**:
- `main.wasp` - Add ~30+ operation declarations (see FUNCTIONAL-SPEC.md for complete list)

---

### 18. `schema.prisma` - Data Model Extensions

**Required Changes**:

✅ **Extend Task Entity**
- Add new fields (see FUNCTIONAL-SPEC.md for complete schema)

✅ **New Entities**
- `TaskTemplate`, `TaskTemplateTask`, `TaskWorkflow`, `TaskWorkflowPhase`
- `TaskFollower`, `TaskActivityLog`, `TaskAutomationRule`, `TaskStats`

**Migration Steps**:
1. Update `schema.prisma` with new models
2. Run `wasp db migrate-dev --name add_task_manager_models`
3. Create data migration script to backfill existing tasks (if any)

**Files to Modify**:
- `schema.prisma` - Add ~8 new models and extend `Task` entity

---

## Integration Checklist

Use this checklist to track integration progress:

### Phase 1: Core Infrastructure
- [ ] Auth integration - user checks, session validation
- [ ] Workspace integration - membership validation, soft delete respect
- [ ] User integration - assignee resolution, profile data
- [ ] Audit integration - log all CRUD operations
- [ ] Logs integration - error logging, automation traces

### Phase 2: Notifications & Real-Time
- [ ] Notification system - event publishing, delivery service
- [ ] WebSocket integration - real-time task updates
- [ ] Email templates - task assignment, overdue, workflow summary
- [ ] Digest integration - include tasks in notification digests

### Phase 3: Jobs & Automation
- [ ] PgBoss jobs - reminders, escalations, workflow health
- [ ] Analytics integration - feed task stats into daily stats job
- [ ] Automation engine - rule evaluation, action execution

### Phase 4: Advanced Features
- [ ] Payment/billing - plan gating, upgrade prompts
- [ ] External connectors - ticket provider sync, webhooks
- [ ] Redis caching - filter caching, rate limiting
- [ ] Database backups - ensure task data included

### Phase 5: Data Model & Operations
- [ ] Schema migration - new entities, extended Task model
- [ ] Wasp operations - register all queries/actions in main.wasp
- [ ] Input validation - Zod schemas for all operations
- [ ] Service layer - business logic separation

---

## Testing Integration Points

For each integration, verify:

1. **Happy Path**: Feature works as expected when all dependencies available
2. **Error Handling**: Graceful degradation when dependency unavailable (e.g., Redis down)
3. **Security**: Unauthorized access properly rejected
4. **Performance**: Integration doesn't create bottlenecks (use caching where appropriate)
5. **Observability**: Integration failures logged and monitored

---

## Next Steps

After completing all integrations:
1. Run integration test suite (`npm run test:integration`)
2. Perform load testing on task operations
3. Verify all audit logs created correctly
4. Check notification delivery across all providers
5. Validate plan gates working (downgrade test workspace and verify limits)

See `FUNCTIONAL-SPEC.md` for detailed implementation specifications.
