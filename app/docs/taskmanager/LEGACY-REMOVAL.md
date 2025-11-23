# Task Manager - Legacy Code Removal Guide

_Last updated: 20 Nov 2025_

## Overview
This guide provides step-by-step instructions for safely removing legacy task handling code from the Aegis module and transitioning to the unified Task Manager system.

---

## Executive Summary

**Current State**: Task management logic is embedded in Aegis module:
- Hardcoded task operations in `src/core/modules/aegis/operations.ts`
- UI components in `src/client/pages/modules/aegis/components/`
- Wasp operations registered in `main.wasp` (lines ~1524-1570)
- Task entities tied specifically to incidents/cases

**Target State**: Unified Task Manager module:
- Centralized task operations in `src/core/modules/taskmanager/`
- Reusable UI components in `src/client/components/task-manager/`
- Context-agnostic task model supporting any module
- Legacy code completely removed

---

## Phase 0: Pre-Migration Preparation

### Step 0.1: Inventory Legacy Code

**Identify all legacy task-related files**:

```bash
# Find all files containing task logic
grep -r "TaskStatus\|createTask\|updateTask\|completeTask" src/core/modules/aegis/ --include="*.ts"
grep -r "Task\|TaskForm\|TaskList" src/client/pages/modules/aegis/ --include="*.tsx"
```

**Expected files to flag for removal**:
- `src/core/modules/aegis/operations.ts` - Lines containing task operations
- `src/client/pages/modules/aegis/components/TasksList.tsx`
- `src/client/pages/modules/aegis/components/TaskForm.tsx`
- `src/client/pages/modules/aegis/components/TaskCard.tsx`
- `main.wasp` - Task operation declarations (lines ~1524-1570)

### Step 0.2: Create Feature Branch

```bash
git checkout -b feature/task-manager-migration
git push -u origin feature/task-manager-migration
```

### Step 0.3: Document Current Task Usage

**Audit current task usage in production**:

```sql
-- Count tasks by context
SELECT 
  CASE 
    WHEN "incidentId" IS NOT NULL THEN 'incident'
    WHEN "caseId" IS NOT NULL THEN 'case'
    ELSE 'orphan'
  END as context,
  COUNT(*) as task_count,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress
FROM "Task"
GROUP BY context;

-- Find tasks with dependencies
SELECT COUNT(*) FROM "Task" WHERE array_length("dependencies", 1) > 0;
```

**Document findings**: Create `docs/taskmanager/migration-audit.md` with counts.

### Step 0.4: Backup Production Data

```bash
# Run manual backup before migration
wasp db seed # Ensure seed data is up to date
pg_dump $DATABASE_URL > backups/pre-task-migration-$(date +%Y%m%d).sql
```

---

## Phase 1: Data Model Upgrade

### Step 1.1: Create Prisma Migration

**Update `schema.prisma`**:

```prisma
// Extend existing Task model
model Task {
  id              String          @id @default(uuid())
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  // ✅ NEW: Multi-tenancy and context
  workspaceId     String
  workspace       Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  contextType     TaskContextType
  contextId       String          // Generic FK to any entity
  
  // ✅ NEW: Template and workflow support
  templateId      String?
  workflowId      String?
  workflow        TaskWorkflow?   @relation(fields: [workflowId], references: [id])
  
  // Core fields (existing)
  title           String
  description     String?
  status          TaskStatus      @default(WAITING)
  priority        Priority        @default(MEDIUM)
  
  // ✅ NEW: Enhanced metadata
  tags            String[]        @default([])
  group           String?
  order           Int             @default(0)
  
  // Assignment (existing + extended)
  assigneeId      String?
  assignee        User?           @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  
  // ✅ NEW: Follower support
  followers       String[]        @default([])
  
  // Time tracking (existing + extended)
  startDate       DateTime?
  dueDate         DateTime?
  completedAt     DateTime?
  completedById   String?
  estimatedHours  Float?
  actualHours     Float?
  
  // ✅ NEW: Progress and SLA
  progress        Int             @default(0) // 0-100
  slaMinutes      Int?
  slaBreached     Boolean         @default(false)
  
  // ✅ NEW: Dependencies
  dependencies    String[]        @default([]) // Array of task IDs
  blockedBy       String[]        @default([]) // Computed reverse lookup
  
  // ✅ NEW: Automation flags
  autoCreated     Boolean         @default(false)
  autoCompleteCondition Json?
  
  // ✅ NEW: Notes and metadata
  notes           String?
  metadata        Json?
  
  // ✅ DEPRECATED: Will be removed after migration
  incidentId      String?
  incident        Incident?       @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  caseId          String?
  case            Case?           @relation(fields: [caseId], references: [id], onDelete: Cascade)
  
  // Relations
  activityLog     TaskActivityLog[]
  
  @@index([workspaceId, status])
  @@index([contextType, contextId])
  @@index([assigneeId])
  @@index([dueDate])
  @@index([incidentId]) // Remove after migration
  @@index([caseId])     // Remove after migration
}

// ✅ NEW: Context type enum
enum TaskContextType {
  INCIDENT
  CASE
  BRAND_ALERT
  TICKET
  WORKSPACE
  CUSTOM
}

// ✅ NEW: Template models
model TaskTemplate {
  id              String          @id @default(uuid())
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  workspaceId     String?         // null = system template
  workspace       Workspace?      @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  name            String
  description     String?
  category        String
  contextTypes    TaskContextType[]
  
  triggerConditions Json?
  isBuiltin       Boolean         @default(false)
  version         String?
  isActive        Boolean         @default(true)
  
  tasks           TaskTemplateTask[]
  
  @@index([workspaceId])
  @@index([category])
}

model TaskTemplateTask {
  id              String          @id @default(uuid())
  
  templateId      String
  template        TaskTemplate    @relation(fields: [templateId], references: [id], onDelete: Cascade)
  
  title           String
  description     String?
  priority        Priority        @default(MEDIUM)
  estimatedHours  Float?
  order           Int
  groupName       String?
  dependencies    Int[]           @default([]) // Indices of other tasks in template
  assignmentRule  Json?
  
  @@index([templateId])
}

// ✅ NEW: Workflow models
model TaskWorkflow {
  id              String          @id @default(uuid())
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  workspaceId     String
  workspace       Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  name            String
  description     String?
  
  templateId      String?
  template        TaskTemplate?   @relation(fields: [templateId], references: [id])
  
  contextType     TaskContextType
  contextId       String
  
  status          WorkflowStatus  @default(NOT_STARTED)
  progress        Int             @default(0)
  
  startedAt       DateTime?
  completedAt     DateTime?
  currentPhase    String?
  
  phases          TaskWorkflowPhase[]
  tasks           Task[]
  
  metadata        Json?
  
  @@index([workspaceId])
  @@index([contextType, contextId])
}

model TaskWorkflowPhase {
  id              String          @id @default(uuid())
  
  workflowId      String
  workflow        TaskWorkflow    @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  
  name            String
  description     String?
  order           Int
  
  autoStartCondition Json?
  status          PhaseStatus     @default(PENDING)
  
  startedAt       DateTime?
  completedAt     DateTime?
  
  metrics         Json?
  
  @@index([workflowId])
}

enum WorkflowStatus {
  NOT_STARTED
  IN_PROGRESS
  PAUSED
  COMPLETED
  FAILED
}

enum PhaseStatus {
  PENDING
  ACTIVE
  COMPLETED
  SKIPPED
}

// ✅ NEW: Activity log
model TaskActivityLog {
  id              String          @id @default(uuid())
  createdAt       DateTime        @default(now())
  
  taskId          String
  task            Task            @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  userId          String?
  actorName       String          // Denormalized for deleted users
  
  action          String          // "created", "updated", "assigned", "completed"
  field           String?         // Which field changed
  oldValue        String?
  newValue        String?
  
  description     String
  
  @@index([taskId, createdAt])
}

// ✅ NEW: Automation rules
model TaskAutomationRule {
  id              String          @id @default(uuid())
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  workspaceId     String
  workspace       Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  name            String
  description     String?
  isActive        Boolean         @default(true)
  
  triggerEvent    String
  conditions      Json
  actions         Json[]
  
  priority        Int             @default(0)
  
  lastTriggeredAt DateTime?
  executionCount  Int             @default(0)
  
  @@index([workspaceId])
}

// ✅ NEW: Stats aggregation
model TaskStats {
  id              String          @id @default(uuid())
  
  workspaceId     String
  workspace       Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  date            DateTime        @db.Date
  
  totalTasks      Int
  completedTasks  Int
  overdueTasks    Int
  
  avgCompletionHours Float
  slaBreachCount  Int
  
  byPriority      Json
  byStatus        Json
  byContextType   Json
  
  topPerformers   Json
  
  @@unique([workspaceId, date])
  @@index([workspaceId, date])
}
```

### Step 1.2: Generate Migration

```bash
wasp db migrate-dev --name add_task_manager_models --create-only
```

**Review generated migration** in `migrations/XXX_add_task_manager_models/migration.sql`.

### Step 1.3: Create Data Backfill Migration

**Create custom migration script**: `migrations/20251120_backfill_task_context.sql`

```sql
-- Backfill existing tasks with context information

-- 1. Add workspaceId to tasks based on incident/case workspace
UPDATE "Task" t
SET "workspaceId" = COALESCE(
  (SELECT "workspaceId" FROM "Incident" WHERE id = t."incidentId"),
  (SELECT "workspaceId" FROM "Case" WHERE id = t."caseId")
)
WHERE "workspaceId" IS NULL;

-- 2. Set contextType and contextId
UPDATE "Task" t
SET 
  "contextType" = CASE 
    WHEN t."incidentId" IS NOT NULL THEN 'INCIDENT'::task_context_type
    WHEN t."caseId" IS NOT NULL THEN 'CASE'::task_context_type
    ELSE 'WORKSPACE'::task_context_type
  END,
  "contextId" = COALESCE(t."incidentId", t."caseId", t."workspaceId")
WHERE "contextType" IS NULL;

-- 3. Set default progress based on status
UPDATE "Task"
SET "progress" = CASE 
  WHEN status = 'COMPLETED' THEN 100
  WHEN status = 'IN_PROGRESS' THEN 50
  ELSE 0
END
WHERE "progress" = 0;

-- 4. Set default order based on created date
WITH ranked AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY "workspaceId", COALESCE("group", 'default') ORDER BY "createdAt") as rn
  FROM "Task"
)
UPDATE "Task" t
SET "order" = r.rn
FROM ranked r
WHERE t.id = r.id;

-- 5. Create activity log entries for existing tasks
INSERT INTO "TaskActivityLog" ("id", "taskId", "userId", "actorName", "action", "description", "createdAt")
SELECT 
  gen_random_uuid(),
  t.id,
  NULL,
  'System Migration',
  'migrated',
  'Task migrated from legacy Aegis module to Task Manager',
  t."createdAt"
FROM "Task" t
WHERE NOT EXISTS (
  SELECT 1 FROM "TaskActivityLog" WHERE "taskId" = t.id
);
```

### Step 1.4: Run Migrations

```bash
# Apply schema migration
wasp db migrate-dev

# Run backfill script
psql $DATABASE_URL < migrations/20251120_backfill_task_context.sql

# Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Task\" WHERE \"workspaceId\" IS NULL OR \"contextType\" IS NULL;"
# Should return 0
```

---

## Phase 2: Bootstrap Task Manager Module

### Step 2.1: Create Module Structure

```bash
mkdir -p src/core/modules/taskmanager/{operations,services,automation,workflows,validation,jobs}
mkdir -p src/client/components/task-manager/{filters,cards,boards,forms}
mkdir -p src/client/hooks/task-manager
```

### Step 2.2: Create Index Files

**`src/core/modules/taskmanager/index.ts`**:
```typescript
// Re-export all operations for clean imports
export * from './operations';
export * from './services/TaskService';
export * from './services/WorkflowService';
export * from './services/TemplateService';
export * from './validation/schemas';

// Types
export type {
  TaskContextType,
  TaskStatus,
  WorkflowStatus,
  PhaseStatus,
} from 'wasp/entities';
```

### Step 2.3: Create Base Service Layer

**`src/core/modules/taskmanager/services/TaskService.ts`**:
```typescript
import { PrismaClient, Task, TaskStatus, Priority } from 'wasp/entities';
import { HttpError } from 'wasp/server';

export class TaskService {
  /**
   * Get tasks for a context with pagination and filters
   */
  static async getTasks(params: {
    workspaceId: string;
    contextType?: string;
    contextId?: string;
    status?: TaskStatus[];
    assigneeId?: string;
    limit?: number;
    offset?: number;
  }, prisma: PrismaClient) {
    const {
      workspaceId,
      contextType,
      contextId,
      status,
      assigneeId,
      limit = 50,
      offset = 0,
    } = params;
    
    return prisma.task.findMany({
      where: {
        workspaceId,
        ...(contextType && { contextType }),
        ...(contextId && { contextId }),
        ...(status && { status: { in: status } }),
        ...(assigneeId && { assigneeId }),
        workspace: { deletedAt: null },
      },
      include: {
        assignee: {
          select: { id: true, email: true, username: true }
        },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });
  }
  
  /**
   * Calculate critical path for dependency graph
   */
  static async calculateCriticalPath(taskIds: string[], prisma: PrismaClient): Promise<string[]> {
    // Topological sort + longest path calculation
    // Implementation omitted for brevity
    return [];
  }
  
  /**
   * Auto-unblock tasks when dependencies complete
   */
  static async checkAndUnblockTasks(completedTaskId: string, prisma: PrismaClient) {
    const blockedTasks = await prisma.task.findMany({
      where: {
        dependencies: { has: completedTaskId },
        status: 'WAITING',
      }
    });
    
    for (const task of blockedTasks) {
      const allDepsComplete = await this.checkAllDependenciesComplete(task.id, prisma);
      
      if (allDepsComplete) {
        await prisma.task.update({
          where: { id: task.id },
          data: { status: 'WAITING' }, // Ready to start
        });
        
        // Notify assignee
        await notifyTaskUnblocked(task);
      }
    }
  }
  
  private static async checkAllDependenciesComplete(taskId: string, prisma: PrismaClient): Promise<boolean> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { dependencies: true }
    });
    
    if (!task || task.dependencies.length === 0) return true;
    
    const deps = await prisma.task.findMany({
      where: { id: { in: task.dependencies } },
      select: { status: true }
    });
    
    return deps.every(d => d.status === 'COMPLETED');
  }
}
```

**Create similar service files**:
- `TemplateService.ts` - Template CRUD and application logic
- `WorkflowService.ts` - Workflow orchestration
- `AutomationService.ts` - Rule evaluation engine
- `TaskStatsService.ts` - Analytics aggregation

---

## Phase 3: Implement New Operations

### Step 3.1: Create Core Operations

**`src/core/modules/taskmanager/operations/getTasks.ts`**:
```typescript
import type { GetTasks } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { TaskService } from '../services/TaskService';
import { checkWorkspaceAccess } from '@src/core/workspace/validation';

export const getTasks: GetTasks = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  
  // Validate workspace access
  await checkWorkspaceAccess(args.workspaceId, context.user.id, context.entities);
  
  // Get tasks via service layer
  return TaskService.getTasks(args, context.entities);
};
```

**Implement all operations** (see FUNCTIONAL-SPEC.md for complete list):
- `getTasks.ts`, `getTask.ts`, `createTask.ts`, `updateTask.ts`, `deleteTask.ts`
- `bulkUpdateTasks.ts`, `assignTask.ts`, `completeTask.ts`
- `getTaskTemplates.ts`, `createTaskTemplate.ts`, `applyTaskTemplate.ts`
- `getWorkflows.ts`, `createWorkflow.ts`, `advanceWorkflowPhase.ts`
- `getTaskStats.ts`, `syncExternalTask.ts`

### Step 3.2: Create Index Export

**`src/core/modules/taskmanager/operations/index.ts`**:
```typescript
export * from './getTasks';
export * from './getTask';
export * from './createTask';
export * from './updateTask';
export * from './deleteTask';
// ... export all operations
```

### Step 3.3: Register Operations in main.wasp

**Add to `main.wasp`** (after Aegis operations, before removing legacy):
```wasp
// ============================================
// TASK MANAGER MODULE OPERATIONS
// ============================================

query getTasks {
  fn: import { getTasks } from "@src/core/modules/taskmanager/operations",
  entities: [Task, User, Workspace, WorkspaceMember, Incident, Case]
}

query getTask {
  fn: import { getTask } from "@src/core/modules/taskmanager/operations",
  entities: [Task, User, Workspace, WorkspaceMember, InvestigationNote, Evidence, TaskActivityLog]
}

action createTask {
  fn: import { createTask } from "@src/core/modules/taskmanager/operations",
  entities: [Task, Workspace, WorkspaceMember, AuditLog, Notification, TimelineEvent]
}

action updateTask {
  fn: import { updateTask } from "@src/core/modules/taskmanager/operations",
  entities: [Task, AuditLog, Notification, TimelineEvent, TaskActivityLog]
}

action deleteTask {
  fn: import { deleteTask } from "@src/core/modules/taskmanager/operations",
  entities: [Task, Workspace, WorkspaceMember, AuditLog]
}

action bulkUpdateTasks {
  fn: import { bulkUpdateTasks } from "@src/core/modules/taskmanager/operations",
  entities: [Task, AuditLog, Notification]
}

action completeTask {
  fn: import { completeTask } from "@src/core/modules/taskmanager/operations",
  entities: [Task, Incident, Case, Notification, AuditLog, TaskActivityLog]
}

query getTaskTemplates {
  fn: import { getTaskTemplates } from "@src/core/modules/taskmanager/operations",
  entities: [TaskTemplate, TaskTemplateTask, Workspace, WorkspaceMember]
}

action createTaskTemplate {
  fn: import { createTaskTemplate } from "@src/core/modules/taskmanager/operations",
  entities: [TaskTemplate, TaskTemplateTask, Workspace, WorkspaceMember, AuditLog]
}

action applyTaskTemplate {
  fn: import { applyTaskTemplate } from "@src/core/modules/taskmanager/operations",
  entities: [Task, TaskTemplate, TaskTemplateTask, Workspace, WorkspaceMember, AuditLog, Notification, TimelineEvent]
}

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

query getTaskStats {
  fn: import { getTaskStats } from "@src/core/modules/taskmanager/operations",
  entities: [Task, TaskStats, Workspace, WorkspaceMember]
}

action syncExternalTask {
  fn: import { syncExternalTask } from "@src/core/modules/taskmanager/operations",
  entities: [Task, TicketProvider, Workspace, WorkspaceMember, AuditLog]
}

// Add workflow/template routes
route TaskManagerRoute { path: "/workspace/:workspaceId/tasks", to: TaskManagerPage }
page TaskManagerPage {
  authRequired: true,
  component: import TaskManagerPage from "@src/client/pages/taskmanager/TaskManagerPage"
}
```

---

## Phase 4: Frontend Refactor

### Step 4.1: Create Shared Components

**`src/client/components/task-manager/TaskBoard.tsx`**:
```typescript
import React from 'react';
import { useQuery } from 'wasp/client/operations';
import { getTasks } from 'wasp/client/operations';

interface TaskBoardProps {
  workspaceId: string;
  contextType?: string;
  contextId?: string;
}

export const TaskBoard: React.FC<TaskBoardProps> = (props) => {
  const { data: tasks, isLoading } = useQuery(getTasks, {
    workspaceId: props.workspaceId,
    contextType: props.contextType,
    contextId: props.contextId,
  });
  
  if (isLoading) return <div>Loading tasks...</div>;
  
  // Group tasks by status
  const grouped = groupTasksByStatus(tasks || []);
  
  return (
    <div className="task-board">
      {Object.entries(grouped).map(([status, statusTasks]) => (
        <TaskColumn key={status} status={status} tasks={statusTasks} />
      ))}
    </div>
  );
};

function groupTasksByStatus(tasks: Task[]) {
  // Implementation...
}
```

**Create all shared components** (see FEATURES.md):
- `TaskCard.tsx`, `TaskDetailsDrawer.tsx`, `TaskForm.tsx`
- `TaskTable.tsx`, `TaskTimeline.tsx`, `WorkloadCalendar.tsx`
- `TaskFilters.tsx`, `BulkEditDialog.tsx`, `TemplateGallery.tsx`

### Step 4.2: Update Aegis Pages to Use New Components

**Before (legacy)**:
```typescript
// src/client/pages/modules/aegis/incidents/IncidentDetailPage.tsx
import { TasksList } from '../components/TasksList'; // ❌ Legacy

<TasksList incidentId={incident.id} />
```

**After (new)**:
```typescript
// src/client/pages/modules/aegis/incidents/IncidentDetailPage.tsx
import { TaskBoard } from '@src/client/components/task-manager/TaskBoard'; // ✅ New

<TaskBoard 
  workspaceId={workspace.id}
  contextType="INCIDENT"
  contextId={incident.id}
/>
```

**Update all consuming pages**:
- `IncidentDetailPage.tsx`
- `CaseDetailPage.tsx`
- (Future) `BrandAlertDetailPage.tsx`

### Step 4.3: Create Dedicated Task Manager Page

**`src/client/pages/taskmanager/TaskManagerPage.tsx`**:
```typescript
import React from 'react';
import { useParams } from 'react-router-dom';
import { TaskBoard } from '@src/client/components/task-manager/TaskBoard';
import { TaskFilters } from '@src/client/components/task-manager/filters/TaskFilters';

export default function TaskManagerPage() {
  const { workspaceId } = useParams();
  const [filters, setFilters] = React.useState({});
  
  return (
    <div className="task-manager-page">
      <header>
        <h1>Task Manager</h1>
      </header>
      
      <div className="layout">
        <aside className="filters">
          <TaskFilters value={filters} onChange={setFilters} />
        </aside>
        
        <main>
          <TaskBoard workspaceId={workspaceId!} {...filters} />
        </main>
      </div>
    </div>
  );
}
```

---

## Phase 5: Automation & Jobs Integration

### Step 5.1: Create PgBoss Jobs

**`src/core/modules/taskmanager/jobs/reminderJob.ts`**:
```typescript
import type { TaskDueReminderJob } from 'wasp/server/jobs';

export const sendTaskReminders: TaskDueReminderJob = async (_args, context) => {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  
  // Find tasks due in next hour
  const dueSoon = await context.entities.Task.findMany({
    where: {
      dueDate: {
        gte: now,
        lte: inOneHour,
      },
      status: {
        notIn: ['COMPLETED', 'CANCELLED'],
      },
    },
    include: { assignee: true, workspace: true },
  });
  
  for (const task of dueSoon) {
    if (task.assignee) {
      await createNotification({
        type: 'WARNING',
        title: `Task due soon: ${task.title}`,
        message: `This task is due in less than 1 hour`,
        link: `/workspace/${task.workspaceId}/tasks/${task.id}`,
        userId: task.assignee.id,
        workspaceId: task.workspaceId,
        eventType: 'task.due_soon',
      }, context.entities);
    }
  }
};
```

**Create all jobs**:
- `reminderJob.ts` - Due date reminders
- `escalationJob.ts` - Overdue escalations
- `workflowHealthJob.ts` - Stalled workflow detection

**Register in main.wasp**:
```wasp
job taskDueReminderJob {
  executor: PgBoss,
  perform: {
    fn: import { sendTaskReminders } from "@src/core/modules/taskmanager/jobs/reminderJob"
  },
  schedule: {
    cron: "0 * * * *"
  },
  entities: [Task, User, Notification, NotificationPreference, Workspace]
}

job taskOverdueEscalationJob {
  executor: PgBoss,
  perform: {
    fn: import { escalateOverdueTasks } from "@src/core/modules/taskmanager/jobs/escalationJob"
  },
  schedule: {
    cron: "0 * * * *"
  },
  entities: [Task, Alert, Notification, WorkspaceMember, Workspace]
}

job workflowHealthJob {
  executor: PgBoss,
  perform: {
    fn: import { checkWorkflowHealth } from "@src/core/modules/taskmanager/jobs/workflowHealthJob"
  },
  schedule: {
    cron: "0 */6 * * *"
  },
  entities: [TaskWorkflow, TaskWorkflowPhase, Task, Notification, Workspace]
}
```

---

## Phase 6: Remove Legacy Code

### Step 6.1: Identify Legacy Operations in main.wasp

**Find and mark for deletion**:
```bash
# Search for old task operations
grep -n "getTasksByIncident\|getTasksByCase\|createTask\|updateTask\|completeTask" main.wasp
```

**Lines to remove** (approximate, verify in your file):
- Lines 1524-1570: Legacy task operations
- Any other references to Aegis-specific task operations

### Step 6.2: Remove Legacy Operations from main.wasp

```diff
- query getTasksByIncident {
-   fn: import { getTasksByIncident } from "@src/core/modules/aegis/operations",
-   entities: [Task, User, Incident, Workspace, WorkspaceMember]
- }
- 
- query getTasksByCase {
-   fn: import { getTasksByCase } from "@src/core/modules/aegis/operations",
-   entities: [Task, User, Case, Workspace, WorkspaceMember]
- }
- 
- action createTask {
-   fn: import { createTask } from "@src/core/modules/aegis/operations",
-   entities: [Task, User, Incident, Case, Workspace, WorkspaceMember]
- }
- 
- action updateTask {
-   fn: import { updateTask } from "@src/core/modules/aegis/operations",
-   entities: [Task, User, Incident, Case, Workspace, WorkspaceMember]
- }
- 
- action completeTask {
-   fn: import { completeTask } from "@src/core/modules/aegis/operations",
-   entities: [Task, User, Incident, Case, Notification]
- }
- 
- query getTaskDependencies {
-   fn: import { getTaskDependencies } from "@src/core/modules/aegis/operations",
-   entities: [Task, User, Workspace, WorkspaceMember]
- }
```

### Step 6.3: Remove Legacy Backend Files

```bash
# Backup before deletion
mkdir -p backups/legacy-task-code
cp -r src/core/modules/aegis/tasks backups/legacy-task-code/

# Delete legacy task operations from Aegis
# NOTE: Do NOT delete the entire operations.ts file, only task-related functions
# Edit manually to remove task functions while preserving alert/incident/case operations
```

**In `src/core/modules/aegis/operations.ts`**:
- Remove functions: `getTasksByIncident`, `getTasksByCase`, `createTask`, `updateTask`, `completeTask`, `getTaskDependencies`
- Keep all other operations (alerts, incidents, cases, etc.)

### Step 6.4: Remove Legacy Frontend Components

```bash
# Backup
cp -r src/client/pages/modules/aegis/components/Tasks* backups/legacy-task-code/

# Delete
rm -f src/client/pages/modules/aegis/components/TasksList.tsx
rm -f src/client/pages/modules/aegis/components/TaskForm.tsx
rm -f src/client/pages/modules/aegis/components/TaskCard.tsx
```

### Step 6.5: Update Import Statements

**Find all files importing legacy task operations**:
```bash
grep -r "from '@src/core/modules/aegis/operations'" src/client/ --include="*.tsx" | grep -i task
```

**Update imports**:
```diff
- import { getTasksByIncident, createTask } from 'wasp/client/operations';
+ import { getTasks, createTask } from 'wasp/client/operations';
```

### Step 6.6: Clean Up Database Schema (Optional - Phase 2)

**After confirming no issues**, remove deprecated FKs:

```sql
-- Create migration: migrations/20251125_remove_legacy_task_fks.sql

-- Remove old foreign keys
ALTER TABLE "Task" DROP COLUMN IF EXISTS "incidentId";
ALTER TABLE "Task" DROP COLUMN IF EXISTS "caseId";

-- Remove old indexes
DROP INDEX IF EXISTS "Task_incidentId_idx";
DROP INDEX IF EXISTS "Task_caseId_idx";
```

**Run migration**:
```bash
wasp db migrate-dev --name remove_legacy_task_fks
```

---

## Phase 7: Testing & Validation

### Step 7.1: Unit Tests

**Create test files**:
- `src/core/modules/taskmanager/services/__tests__/TaskService.test.ts`
- `src/core/modules/taskmanager/operations/__tests__/createTask.test.ts`

**Example test**:
```typescript
import { describe, it, expect } from 'vitest';
import { TaskService } from '../TaskService';
import { mockPrisma, mockUser, mockWorkspace } from '@src/test/mocks';

describe('TaskService', () => {
  it('should create task with correct context', async () => {
    const task = await TaskService.createTask({
      workspaceId: mockWorkspace.id,
      title: 'Test task',
      contextType: 'INCIDENT',
      contextId: 'inc-123',
      priority: 'HIGH',
    }, mockPrisma);
    
    expect(task.contextType).toBe('INCIDENT');
    expect(task.contextId).toBe('inc-123');
  });
  
  it('should validate workspace membership', async () => {
    await expect(
      TaskService.createTask({
        workspaceId: 'invalid-ws',
        title: 'Test',
        contextType: 'WORKSPACE',
        contextId: 'ws-123',
      }, mockPrisma)
    ).rejects.toThrow('Not authorized');
  });
});
```

**Run tests**:
```bash
npm run test -- taskmanager
```

### Step 7.2: Integration Tests

**Test end-to-end flows**:
1. Create task → assign → update status → complete
2. Apply template → verify tasks created correctly
3. Create workflow → advance phases → verify progress
4. Trigger automation rule → verify action executed

### Step 7.3: Manual QA Checklist

- [ ] Create task from incident detail page
- [ ] Create task from case detail page
- [ ] Create task from workspace task manager page
- [ ] Assign task to user
- [ ] Reassign task
- [ ] Update task status
- [ ] Complete task
- [ ] Add dependencies between tasks
- [ ] Apply template
- [ ] Create workflow
- [ ] Advance workflow phase
- [ ] Trigger automation rule
- [ ] Sync task to Jira (if configured)
- [ ] Receive notification on task assignment
- [ ] Receive email on overdue task
- [ ] View task stats dashboard
- [ ] Export tasks to CSV
- [ ] Import tasks from CSV

### Step 7.4: Performance Testing

**Load test task queries**:
```bash
# Using k6 or similar tool
k6 run tests/load/task-queries.js --vus 50 --duration 30s
```

**Monitor**:
- Query response times (<200ms for simple queries)
- Database connection pool usage
- Redis cache hit rate
- Memory usage under load

---

## Phase 8: Deployment & Rollout

### Step 8.1: Feature Flag (Optional)

**Add feature flag** to gradually roll out:
```typescript
// In workspace settings
model Workspace {
  // ...
  featureFlags Json? @default("{}")
}

// Check in operations
const workspace = await prisma.workspace.findUnique({...});
const taskManagerEnabled = workspace.featureFlags?.taskManager !== false;

if (!taskManagerEnabled) {
  // Use legacy operations
}
```

### Step 8.2: Deploy to Staging

```bash
git push origin feature/task-manager-migration
# Create PR, get review
# Merge to main
wasp deploy fly deploy --staging
```

### Step 8.3: Verify in Staging

- Run full QA checklist
- Check error logs (no task-related errors)
- Verify analytics data flowing correctly

### Step 8.4: Deploy to Production

```bash
wasp deploy fly deploy --production
```

### Step 8.5: Monitor Post-Deployment

**Watch for 24 hours**:
- Error rates (should not increase)
- Task operation latencies
- User complaints/support tickets
- Database slow query log

---

## Phase 9: Documentation & Cleanup

### Step 9.1: Update Documentation

- [ ] Update README.md with Task Manager info
- [ ] Add API documentation for new operations
- [ ] Create user guide for task management features
- [ ] Update developer onboarding docs

### Step 9.2: Update CHANGELOG

```markdown
## [2.0.0] - 2025-11-XX

### Added
- **Task Manager Module**: Unified task management system supporting all contexts
- Task templates and playbooks
- Workflow orchestration with multi-phase support
- Task automation rules
- Advanced analytics and reporting
- External ticket provider integration

### Changed
- Tasks now context-agnostic (support incidents, cases, brand alerts, etc.)
- Improved task assignment with follower support
- Enhanced SLA tracking and escalation

### Removed
- Legacy Aegis-specific task operations
- Hardcoded incident/case task handling

### Migration
- See docs/taskmanager/LEGACY-REMOVAL.md for migration guide
- All existing tasks automatically migrated to new system
```

### Step 9.3: Delete Backup Files

**After 30 days of stable operation**:
```bash
rm -rf backups/legacy-task-code/
```

---

## Rollback Plan

**If critical issues discovered post-deployment**:

### Step 1: Restore Legacy Code

```bash
# Revert commits
git revert <migration-commit-hash>..HEAD

# Redeploy previous version
git checkout <previous-stable-tag>
wasp deploy fly deploy
```

### Step 2: Restore Database

```bash
# Restore from pre-migration backup
pg_restore -d $DATABASE_URL backups/pre-task-migration-YYYYMMDD.sql

# Or run reverse migration
wasp db migrate rollback
```

### Step 3: Notify Users

- Send email explaining temporary rollback
- Provide ETA for fix
- Document issue for post-mortem

---

## Success Criteria

Migration considered complete when:

✅ All tasks migrated to new schema with correct context
✅ Zero legacy task operations in codebase
✅ All Aegis pages use new TaskBoard component
✅ New Task Manager page accessible and functional
✅ Analytics dashboard shows task metrics
✅ No increase in error rates post-deployment
✅ All automated tests passing
✅ Documentation updated
✅ Team trained on new system

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 0: Preparation | 1 day | - |
| Phase 1: Data Model | 2 days | Phase 0 |
| Phase 2: Module Bootstrap | 1 day | Phase 1 |
| Phase 3: Operations | 3-5 days | Phase 2 |
| Phase 4: Frontend | 3-5 days | Phase 3 |
| Phase 5: Jobs | 2 days | Phase 3 |
| Phase 6: Legacy Removal | 1 day | Phase 4, 5 |
| Phase 7: Testing | 3-5 days | Phase 6 |
| Phase 8: Deployment | 1 day | Phase 7 |
| Phase 9: Documentation | 1 day | Phase 8 |

**Total**: 2-3 weeks

---

## Support & Questions

For questions during migration:
- Slack: #task-manager-migration
- Documentation: `docs/taskmanager/`
- Technical lead: [Your Name]

---

**Next Steps**: See `FUNCTIONAL-SPEC.md` for detailed implementation specifications.
