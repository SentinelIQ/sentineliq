# Task Manager - Functional Specification

_Last updated: 20 Nov 2025_

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Data Models](#data-models)
3. [API Operations](#api-operations)
4. [Business Logic Services](#business-logic-services)
5. [Frontend Components](#frontend-components)
6. [Integration Requirements](#integration-requirements)
7. [Security & Access Control](#security--access-control)
8. [Performance Requirements](#performance-requirements)

---

## 1. System Architecture

### 1.1 Module Structure

```
src/
├── core/
│   └── modules/
│       └── taskmanager/
│           ├── operations/         # Wasp operation handlers
│           │   ├── index.ts
│           │   ├── tasks.ts        # Task CRUD operations
│           │   ├── templates.ts    # Template operations
│           │   ├── workflows.ts    # Workflow operations
│           │   └── stats.ts        # Analytics operations
│           ├── services/           # Business logic layer
│           │   ├── TaskService.ts
│           │   ├── TemplateService.ts
│           │   ├── WorkflowService.ts
│           │   ├── AutomationService.ts
│           │   └── TaskStatsService.ts
│           ├── automation/         # Automation engine
│           │   ├── RuleEngine.ts
│           │   ├── ActionExecutor.ts
│           │   └── triggers.ts
│           ├── workflows/          # Workflow orchestration
│           │   ├── WorkflowEngine.ts
│           │   └── PhaseManager.ts
│           ├── validation/         # Input validation
│           │   └── schemas.ts
│           ├── jobs/               # PgBoss job handlers
│           │   ├── reminderJob.ts
│           │   ├── escalationJob.ts
│           │   └── workflowHealthJob.ts
│           └── index.ts
├── client/
│   ├── components/
│   │   └── task-manager/          # Shared UI components
│   │       ├── TaskBoard.tsx       # Kanban board
│   │       ├── TaskCard.tsx        # Task card component
│   │       ├── TaskTable.tsx       # Data table view
│   │       ├── TaskTimeline.tsx    # Gantt chart view
│   │       ├── TaskDetailsDrawer.tsx
│   │       ├── TaskForm.tsx
│   │       ├── BulkEditDialog.tsx
│   │       ├── TemplateGallery.tsx
│   │       ├── WorkloadCalendar.tsx
│   │       ├── filters/
│   │       │   ├── TaskFilters.tsx
│   │       │   └── SavedViews.tsx
│   │       └── cards/
│   │           ├── TaskColumn.tsx
│   │           └── PhaseColumn.tsx
│   ├── hooks/
│   │   └── task-manager/
│   │       ├── useTasks.ts
│   │       ├── useTaskOperations.ts
│   │       ├── useTaskTemplates.ts
│   │       ├── useWorkflows.ts
│   │       ├── useTaskFilters.ts
│   │       └── useTaskPermissions.ts
│   └── pages/
│       └── taskmanager/
│           ├── TaskManagerPage.tsx
│           ├── TemplatesPage.tsx
│           └── WorkflowsPage.tsx
└── server/
    └── taskmanager/               # Server utilities
        ├── externalSync.ts        # Jira/ServiceNow sync
        └── webhooks.ts            # Webhook delivery
```

### 1.2 Data Flow

```
┌─────────────┐
│   Client    │
│  (React)    │
└──────┬──────┘
       │ useQuery/call action
       ▼
┌─────────────┐
│   Wasp      │
│ Operations  │ ← Auth/validation via context.user
└──────┬──────┘
       │ calls
       ▼
┌─────────────┐
│  Services   │ ← Business logic (TaskService, etc.)
│   Layer     │
└──────┬──────┘
       │ uses
       ▼
┌─────────────┐
│   Prisma    │ ← Database ORM (context.entities)
│    Client   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  PostgreSQL │
│   Database  │
└─────────────┘

Side Effects:
├─→ EventBus (notifications)
├─→ AuditLog (compliance)
├─→ WebSocket (real-time)
└─→ PgBoss (scheduled jobs)
```

---

## 2. Data Models

### 2.1 Task Entity (Extended)

```prisma
model Task {
  id              String          @id @default(uuid())
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  // Multi-tenancy
  workspaceId     String
  workspace       Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  // Context (generic foreign key pattern)
  contextType     TaskContextType
  contextId       String          // Points to Incident, Case, BrandAlert, etc.
  
  // Template/Workflow association
  templateId      String?
  template        TaskTemplate?   @relation(fields: [templateId], references: [id])
  
  workflowId      String?
  workflow        TaskWorkflow?   @relation(fields: [workflowId], references: [id])
  
  phaseId         String?         // Which workflow phase this task belongs to
  phase           TaskWorkflowPhase? @relation(fields: [phaseId], references: [id])
  
  // Core task data
  title           String
  description     String?         @db.Text
  status          TaskStatus      @default(WAITING)
  priority        Priority        @default(MEDIUM)
  
  // Organization
  tags            String[]        @default([])
  group           String?         // For Kanban grouping (e.g., "Analysis", "Containment")
  order           Int             @default(0) // For manual ordering within group
  
  // Assignment
  assigneeId      String?
  assignee        User?           @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  assignedAt      DateTime?
  
  followers       String[]        @default([]) // Array of user IDs watching this task
  
  // Time tracking
  startDate       DateTime?
  dueDate         DateTime?
  completedAt     DateTime?
  completedById   String?
  completedBy     User?           @relation("TaskCompleter", fields: [completedById], references: [id], onDelete: SetNull)
  
  estimatedHours  Float?
  actualHours     Float?
  progress        Int             @default(0) // 0-100 percentage
  
  // SLA tracking
  slaMinutes      Int?            // Expected completion time in minutes
  slaBreached     Boolean         @default(false)
  slaBreachedAt   DateTime?
  
  // Dependencies (directed graph)
  dependencies    String[]        @default([]) // IDs of tasks that must complete first
  blockedBy       String[]        @default([]) // Computed: tasks blocked by this one
  
  // Automation
  autoCreated     Boolean         @default(false)
  autoCreationRule String?        // ID of automation rule that created this
  autoCompleteCondition Json?     // Condition for auto-completion
  
  // Notes and metadata
  notes           String?         @db.Text
  metadata        Json?           // Extensible metadata field
  
  // Relations
  activityLog     TaskActivityLog[]
  
  // Legacy FKs (to be removed after migration)
  incidentId      String?
  incident        Incident?       @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  caseId          String?
  case            Case?           @relation(fields: [caseId], references: [id], onDelete: Cascade)
  
  @@index([workspaceId, status])
  @@index([contextType, contextId])
  @@index([assigneeId])
  @@index([dueDate])
  @@index([workflowId, phaseId])
  @@index([tags(ops: GinIndex)]) // GIN index for array searches (PostgreSQL)
}

enum TaskStatus {
  WAITING         // Ready to start, no blockers
  IN_PROGRESS     // Actively being worked on
  BLOCKED         // Cannot proceed due to dependency
  ON_HOLD         // Paused by assignee
  COMPLETED       // Done
  CANCELLED       // Cancelled/abandoned
}

enum TaskContextType {
  INCIDENT        // Linked to security incident
  CASE            // Linked to forensic case
  BRAND_ALERT     // Linked to Eclipse brand alert
  TICKET          // Linked to external ticket (Jira, ServiceNow)
  WORKSPACE       // General workspace task
  CUSTOM          // Custom context (extensible)
}
```

### 2.2 TaskTemplate Entity

```prisma
model TaskTemplate {
  id              String          @id @default(uuid())
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  workspaceId     String?         // null = system/builtin template
  workspace       Workspace?      @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  name            String
  description     String?         @db.Text
  category        String          // "incident_response", "forensics", "brand_protection"
  
  // Which contexts can this template be applied to?
  contextTypes    TaskContextType[]
  
  // Auto-application rules
  triggerConditions Json?         // {"severity": "CRITICAL", "status": "NEW"}
  
  // Template metadata
  isBuiltin       Boolean         @default(false) // System template (cannot edit)
  version         String?         // e.g., "1.2.0"
  isActive        Boolean         @default(true)
  isDraft         Boolean         @default(false)
  
  // Analytics
  timesUsed       Int             @default(0)
  lastUsedAt      DateTime?
  
  // Relations
  tasks           TaskTemplateTask[]
  workflows       TaskWorkflow[]  // Workflows created from this template
  appliedTasks    Task[]          // Tasks created from this template
  
  createdBy       String?
  creator         User?           @relation(fields: [createdBy], references: [id])
  
  @@index([workspaceId])
  @@index([category])
  @@index([isActive])
  @@unique([workspaceId, name]) // Unique name per workspace
}

model TaskTemplateTask {
  id              String          @id @default(uuid())
  
  templateId      String
  template        TaskTemplate    @relation(fields: [templateId], references: [id], onDelete: Cascade)
  
  // Task definition (with variable placeholders)
  title           String          // e.g., "Analyze {{asset_type}} for IOCs"
  description     String?         @db.Text
  priority        Priority        @default(MEDIUM)
  
  estimatedHours  Float?
  order           Int             // Order within template
  
  // Grouping
  groupName       String?         // e.g., "Triage", "Analysis", "Remediation"
  
  // Dependencies (reference by order index, not UUID)
  // Example: [0, 1] means depends on tasks at index 0 and 1
  dependencies    Int[]           @default([])
  
  // Assignment rules
  assignmentRule  Json?           // {"role": "analyst", "skill": "malware_analysis"}
  
  // Metadata
  metadata        Json?
  
  @@index([templateId, order])
}
```

### 2.3 TaskWorkflow Entity

```prisma
model TaskWorkflow {
  id              String          @id @default(uuid())
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  workspaceId     String
  workspace       Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  name            String
  description     String?         @db.Text
  
  // Template association
  templateId      String?
  template        TaskTemplate?   @relation(fields: [templateId], references: [id])
  
  // Context
  contextType     TaskContextType
  contextId       String
  
  // Status
  status          WorkflowStatus  @default(NOT_STARTED)
  progress        Int             @default(0) // 0-100, calculated from tasks
  
  // Timeline
  startedAt       DateTime?
  completedAt     DateTime?
  pausedAt        DateTime?
  
  // Current state
  currentPhaseId  String?
  currentPhase    TaskWorkflowPhase? @relation("CurrentPhase", fields: [currentPhaseId], references: [id])
  
  // Relations
  phases          TaskWorkflowPhase[] @relation("WorkflowPhases")
  tasks           Task[]
  
  // Metadata
  metadata        Json?           // Custom workflow data
  
  @@index([workspaceId])
  @@index([contextType, contextId])
  @@index([status])
}

model TaskWorkflowPhase {
  id              String          @id @default(uuid())
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  workflowId      String
  workflow        TaskWorkflow    @relation("WorkflowPhases", fields: [workflowId], references: [id], onDelete: Cascade)
  
  name            String
  description     String?         @db.Text
  order           Int             // Execution order
  
  // Auto-start conditions
  autoStartCondition Json?        // {"previousPhaseProgress": 100}
  isParallel      Boolean         @default(false) // Can run parallel to other phases?
  
  // Status
  status          PhaseStatus     @default(PENDING)
  
  // Timeline
  startedAt       DateTime?
  completedAt     DateTime?
  
  // Relations
  tasks           Task[]
  currentInWorkflows TaskWorkflow[] @relation("CurrentPhase")
  
  // Metrics
  metrics         Json?           // {completedTasks, avgCompletionTime, etc.}
  
  @@index([workflowId, order])
}

enum WorkflowStatus {
  NOT_STARTED
  IN_PROGRESS
  PAUSED
  COMPLETED
  FAILED
  CANCELLED
}

enum PhaseStatus {
  PENDING         // Not started yet
  ACTIVE          // Currently active phase
  COMPLETED       // All tasks done
  SKIPPED         // Phase skipped
  FAILED          // Phase failed
}
```

### 2.4 Supporting Models

```prisma
model TaskActivityLog {
  id              String          @id @default(uuid())
  createdAt       DateTime        @default(now())
  
  taskId          String
  task            Task            @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  userId          String?
  user            User?           @relation(fields: [userId], references: [id], onDelete: SetNull)
  actorName       String          // Denormalized for deleted users or system actions
  
  action          TaskAction      // "created", "updated", "assigned", "completed"
  field           String?         // Which field changed (if applicable)
  oldValue        String?
  newValue        String?
  
  description     String          // Human-readable description
  
  ipAddress       String?
  userAgent       String?
  
  @@index([taskId, createdAt])
}

enum TaskAction {
  CREATED
  UPDATED
  DELETED
  ASSIGNED
  REASSIGNED
  STATUS_CHANGED
  PRIORITY_CHANGED
  COMPLETED
  REOPENED
  DEPENDENCY_ADDED
  DEPENDENCY_REMOVED
  COMMENT_ADDED
  ATTACHMENT_ADDED
  TEMPLATE_APPLIED
  WORKFLOW_STARTED
}

model TaskAutomationRule {
  id              String          @id @default(uuid())
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  workspaceId     String
  workspace       Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  name            String
  description     String?         @db.Text
  isActive        Boolean         @default(true)
  
  // Trigger definition
  triggerEvent    String          // "alert.escalated", "incident.critical", "task.overdue"
  conditions      Json            // {"severity": "CRITICAL", "contextType": "INCIDENT"}
  
  // Actions to execute
  actions         Json[]          // [{"type": "create_task", "templateId": "..."}, ...]
  
  // Execution control
  priority        Int             @default(0) // Lower = higher priority
  maxExecutions   Int?            // Limit executions (null = unlimited)
  cooldownMinutes Int?            // Cooldown between executions
  
  // Metrics
  lastTriggeredAt DateTime?
  executionCount  Int             @default(0)
  successCount    Int             @default(0)
  failureCount    Int             @default(0)
  lastError       String?         @db.Text
  
  createdBy       String?
  creator         User?           @relation(fields: [createdBy], references: [id])
  
  @@index([workspaceId, isActive])
  @@index([triggerEvent])
}

model TaskStats {
  id              String          @id @default(uuid())
  
  workspaceId     String
  workspace       Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  date            DateTime        @db.Date
  
  // Counts
  totalTasks      Int
  completedTasks  Int
  overdueTasks    Int
  createdTasks    Int             // New tasks today
  
  // Timing metrics
  avgCompletionHours Float
  avgTimeToStart  Float           // Hours from creation to first work
  
  // SLA metrics
  slaBreachCount  Int
  slaComplianceRate Float         // 0-100 percentage
  
  // Breakdown by dimension
  byPriority      Json            // {"CRITICAL": 5, "HIGH": 12, ...}
  byStatus        Json
  byContextType   Json
  
  // User performance
  topPerformers   Json            // [{"userId": "...", "completed": 15}, ...]
  workloadByUser  Json            // {"userId": totalHours}
  
  @@unique([workspaceId, date])
  @@index([workspaceId, date])
}
```

---

## 3. API Operations

### 3.1 Task Operations

#### `getTasks` (Query)

**Purpose**: List tasks with filtering, pagination, sorting

**Input Schema**:
```typescript
const getTasksSchema = z.object({
  workspaceId: z.string().uuid(),
  contextType: z.enum(['INCIDENT', 'CASE', 'BRAND_ALERT', 'TICKET', 'WORKSPACE', 'CUSTOM']).optional(),
  contextId: z.string().optional(),
  status: z.array(z.enum(['WAITING', 'IN_PROGRESS', 'BLOCKED', 'ON_HOLD', 'COMPLETED', 'CANCELLED'])).optional(),
  priority: z.array(z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])).optional(),
  assigneeId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(), // Full-text search on title/description
  dueAfter: z.string().datetime().optional(),
  dueBefore: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'status', 'order']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});
```

**Implementation**:
```typescript
import type { GetTasks } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { ensureArgsSchemaOrThrowHttpError } from '@src/shared/validation';
import { TaskService } from '../services/TaskService';
import { checkWorkspaceAccess } from '@src/core/workspace/validation';

export const getTasks: GetTasks = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);
  
  const args = ensureArgsSchemaOrThrowHttpError(getTasksSchema, rawArgs);
  
  // Validate workspace access
  await checkWorkspaceAccess(args.workspaceId, context.user.id, context.entities);
  
  // Delegate to service layer
  return TaskService.getTasks(args, context.entities);
};
```

**Response**:
```typescript
type GetTasksResponse = {
  tasks: Task[];
  total: number;
  hasMore: boolean;
};
```

#### `getTask` (Query)

**Purpose**: Get single task with full details

**Input Schema**:
```typescript
const getTaskSchema = z.object({
  taskId: z.string().uuid(),
});
```

**Response**: Full `Task` object with relations:
- `assignee` (User)
- `workflow` (TaskWorkflow)
- `phase` (TaskWorkflowPhase)
- `activityLog` (TaskActivityLog[])
- Computed: `dependencyGraph`, `isBlocked`, `estimatedTimeRemaining`

#### `createTask` (Action)

**Purpose**: Create new task

**Input Schema**:
```typescript
const createTaskSchema = z.object({
  workspaceId: z.string().uuid(),
  contextType: z.enum(['INCIDENT', 'CASE', 'BRAND_ALERT', 'TICKET', 'WORKSPACE', 'CUSTOM']),
  contextId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  status: z.enum(['WAITING', 'IN_PROGRESS']).default('WAITING'),
  assigneeId: z.string().uuid().optional(),
  followers: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).max(20).optional(),
  group: z.string().max(50).optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  slaMinutes: z.number().int().positive().optional(),
  dependencies: z.array(z.string().uuid()).optional(),
  workflowId: z.string().uuid().optional(),
  phaseId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});
```

**Implementation**:
```typescript
export const createTask: CreateTask = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);
  
  const args = ensureArgsSchemaOrThrowHttpError(createTaskSchema, rawArgs);
  
  // Validate workspace membership
  const member = await checkWorkspaceAccess(args.workspaceId, context.user.id, context.entities);
  
  // Check plan limits
  await checkTaskLimit(args.workspaceId, context.entities);
  
  // Validate dependencies don't create cycle
  if (args.dependencies) {
    await validateNoCycles(args.dependencies, context.entities);
  }
  
  // Create task
  const task = await TaskService.createTask({
    ...args,
    createdBy: context.user.id,
  }, context.entities);
  
  // Side effects
  await logAuditEvent({
    workspaceId: args.workspaceId,
    userId: context.user.id,
    action: 'TASK_CREATED',
    resource: 'task',
    resourceId: task.id,
    description: `Created task: ${task.title}`,
  }, context.entities);
  
  if (args.assigneeId) {
    await notifyTaskAssigned(task, context.entities);
  }
  
  // Emit event to EventBus
  await publishEvent({
    type: 'task.created',
    workspaceId: args.workspaceId,
    data: { taskId: task.id },
  });
  
  return task;
};
```

#### `updateTask` (Action)

**Purpose**: Update existing task

**Input Schema**:
```typescript
const updateTaskSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['WAITING', 'IN_PROGRESS', 'BLOCKED', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  followers: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).optional(),
  group: z.string().optional(),
  order: z.number().int().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  actualHours: z.number().positive().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
```

**Business Rules**:
- Cannot complete task if has incomplete child tasks
- Status change to COMPLETED triggers auto-unblock of dependent tasks
- Progress must be 100 when status = COMPLETED
- Only assignee or admin can update task (unless reassigning)

#### `deleteTask` (Action)

**Purpose**: Delete task (soft delete, move to trash)

**Input Schema**:
```typescript
const deleteTaskSchema = z.object({
  taskId: z.string().uuid(),
  permanent: z.boolean().default(false), // Admin-only, hard delete
});
```

**Business Rules**:
- Cannot delete if task has dependencies (other tasks blocking on it)
- Soft delete by default (set `deletedAt` field)
- Admin can permanently delete
- Audit log preserved even if deleted

#### `bulkUpdateTasks` (Action)

**Purpose**: Update multiple tasks at once

**Input Schema**:
```typescript
const bulkUpdateTasksSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1).max(100),
  updates: z.object({
    status: z.enum(['WAITING', 'IN_PROGRESS', 'BLOCKED', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    tags: z.object({
      add: z.array(z.string()).optional(),
      remove: z.array(z.string()).optional(),
    }).optional(),
  }),
});
```

**Response**:
```typescript
type BulkUpdateResponse = {
  updated: string[]; // Successfully updated task IDs
  failed: Array<{ taskId: string; error: string }>;
  total: number;
};
```

#### `completeTask` (Action)

**Purpose**: Mark task as complete (with validation)

**Input Schema**:
```typescript
const completeTaskSchema = z.object({
  taskId: z.string().uuid(),
  actualHours: z.number().positive().optional(),
  completionNotes: z.string().optional(),
});
```

**Business Rules**:
- Must be assignee or admin
- Progress automatically set to 100
- `completedAt` timestamp recorded
- Triggers unblocking of dependent tasks
- Checks if all workflow phase tasks complete (auto-advance phase)

### 3.2 Template Operations

#### `getTaskTemplates` (Query)

**Purpose**: List available templates

**Input Schema**:
```typescript
const getTaskTemplatesSchema = z.object({
  workspaceId: z.string().uuid().optional(), // null = system templates only
  category: z.string().optional(),
  contextType: z.enum(['INCIDENT', 'CASE', 'BRAND_ALERT', 'TICKET', 'WORKSPACE', 'CUSTOM']).optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});
```

#### `createTaskTemplate` (Action)

**Purpose**: Create new template

**Input Schema**:
```typescript
const createTaskTemplateSchema = z.object({
  workspaceId: z.string().uuid().optional(), // null = system template (admin only)
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string(),
  contextTypes: z.array(z.enum(['INCIDENT', 'CASE', 'BRAND_ALERT', 'TICKET', 'WORKSPACE', 'CUSTOM'])),
  triggerConditions: z.record(z.any()).optional(),
  tasks: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    estimatedHours: z.number().optional(),
    order: z.number().int(),
    groupName: z.string().optional(),
    dependencies: z.array(z.number().int()), // Indices
    assignmentRule: z.record(z.any()).optional(),
  })).min(1),
});
```

#### `applyTaskTemplate` (Action)

**Purpose**: Apply template to create tasks

**Input Schema**:
```typescript
const applyTaskTemplateSchema = z.object({
  templateId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  contextType: z.enum(['INCIDENT', 'CASE', 'BRAND_ALERT', 'TICKET', 'WORKSPACE', 'CUSTOM']),
  contextId: z.string(),
  workflowId: z.string().uuid().optional(),
  variables: z.record(z.string()).optional(), // {"incident_id": "inc-123", "severity": "HIGH"}
});
```

**Process**:
1. Fetch template and tasks
2. Substitute variables in titles/descriptions
3. Create tasks in transaction
4. Resolve dependencies (map template indices to real task IDs)
5. Apply assignment rules
6. Return created tasks

### 3.3 Workflow Operations

#### `getWorkflows` (Query)

**Input Schema**:
```typescript
const getWorkflowsSchema = z.object({
  workspaceId: z.string().uuid(),
  contextType: z.enum(['INCIDENT', 'CASE', 'BRAND_ALERT', 'TICKET', 'WORKSPACE', 'CUSTOM']).optional(),
  contextId: z.string().optional(),
  status: z.array(z.enum(['NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED'])).optional(),
});
```

#### `createWorkflow` (Action)

**Input Schema**:
```typescript
const createWorkflowSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  templateId: z.string().uuid().optional(),
  contextType: z.enum(['INCIDENT', 'CASE', 'BRAND_ALERT', 'TICKET', 'WORKSPACE', 'CUSTOM']),
  contextId: z.string(),
  phases: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    order: z.number().int(),
    autoStartCondition: z.record(z.any()).optional(),
    taskTemplate: z.string().uuid().optional(), // Apply template for this phase
  })),
});
```

#### `advanceWorkflowPhase` (Action)

**Purpose**: Move workflow to next phase

**Input Schema**:
```typescript
const advanceWorkflowPhaseSchema = z.object({
  workflowId: z.string().uuid(),
  force: z.boolean().default(false), // Skip completion checks
});
```

**Business Rules**:
- All tasks in current phase must be complete (unless `force: true`)
- Auto-start next phase if conditions met
- Calculate overall workflow progress

### 3.4 Stats Operations

#### `getTaskStats` (Query)

**Purpose**: Get aggregated task statistics

**Input Schema**:
```typescript
const getTaskStatsSchema = z.object({
  workspaceId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
});
```

**Response**:
```typescript
type TaskStatsResponse = {
  period: { start: string; end: string };
  total: number;
  completed: number;
  overdue: number;
  avgCompletionHours: number;
  slaComplianceRate: number;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  byContextType: Record<string, number>;
  topPerformers: Array<{ userId: string; completed: number; avgHours: number }>;
  timeline: Array<{ date: string; created: number; completed: number }>;
};
```

---

## 4. Business Logic Services

### 4.1 TaskService

**Responsibilities**:
- Task CRUD with validation
- Dependency graph calculations
- SLA tracking
- Auto-unblocking logic

**Key Methods**:
```typescript
class TaskService {
  static async getTasks(filters: TaskFilters, prisma: PrismaClient): Promise<Task[]>
  static async getTask(taskId: string, prisma: PrismaClient): Promise<Task | null>
  static async createTask(data: CreateTaskData, prisma: PrismaClient): Promise<Task>
  static async updateTask(taskId: string, updates: UpdateTaskData, prisma: PrismaClient): Promise<Task>
  static async deleteTask(taskId: string, prisma: PrismaClient): Promise<void>
  
  // Advanced methods
  static async calculateCriticalPath(taskIds: string[], prisma: PrismaClient): Promise<string[]>
  static async checkAndUnblockTasks(completedTaskId: string, prisma: PrismaClient): Promise<void>
  static async validateNoCycles(taskId: string, newDeps: string[], prisma: PrismaClient): Promise<boolean>
  static async calculateProgress(taskId: string, prisma: PrismaClient): Promise<number>
  static async checkSLAStatus(taskId: string, prisma: PrismaClient): Promise<boolean>
}
```

### 4.2 TemplateService

**Responsibilities**:
- Template CRUD
- Variable substitution
- Template application
- Template versioning

**Key Methods**:
```typescript
class TemplateService {
  static async getTemplates(filters: TemplateFilters, prisma: PrismaClient): Promise<TaskTemplate[]>
  static async createTemplate(data: CreateTemplateData, prisma: PrismaClient): Promise<TaskTemplate>
  static async applyTemplate(
    templateId: string,
    context: TaskContext,
    variables: Record<string, string>,
    prisma: PrismaClient
  ): Promise<Task[]>
  
  // Advanced methods
  static substituteVariables(text: string, variables: Record<string, string>): string
  static resolveAssignmentRule(rule: AssignmentRule, context: TaskContext): string | null
  static cloneTemplate(templateId: string, newName: string, prisma: PrismaClient): Promise<TaskTemplate>
}
```

### 4.3 WorkflowService

**Responsibilities**:
- Workflow orchestration
- Phase management
- Progress calculation
- Auto-advancement

**Key Methods**:
```typescript
class WorkflowService {
  static async createWorkflow(data: CreateWorkflowData, prisma: PrismaClient): Promise<TaskWorkflow>
  static async advancePhase(workflowId: string, force: boolean, prisma: PrismaClient): Promise<void>
  static async calculateWorkflowProgress(workflowId: string, prisma: PrismaClient): Promise<number>
  static async checkPhaseCompletion(phaseId: string, prisma: PrismaClient): Promise<boolean>
  static async autoStartNextPhase(workflowId: string, prisma: PrismaClient): Promise<void>
  static async pauseWorkflow(workflowId: string, prisma: PrismaClient): Promise<void>
  static async resumeWorkflow(workflowId: string, prisma: PrismaClient): Promise<void>
}
```

### 4.4 AutomationService

**Responsibilities**:
- Rule evaluation
- Action execution
- Cooldown management
- Error handling

**Key Methods**:
```typescript
class AutomationService {
  static async evaluateRules(event: TaskEvent, prisma: PrismaClient): Promise<void>
  static async executeAction(action: AutomationAction, context: any, prisma: PrismaClient): Promise<void>
  static async checkCooldown(ruleId: string, prisma: PrismaClient): Promise<boolean>
  static async logExecution(ruleId: string, success: boolean, error?: string, prisma: PrismaClient): Promise<void>
}
```

### 4.5 TaskStatsService

**Responsibilities**:
- Metric aggregation
- Report generation
- Trend analysis

**Key Methods**:
```typescript
class TaskStatsService {
  static async calculateDailyStats(workspaceId: string, date: Date, prisma: PrismaClient): Promise<TaskStats>
  static async getStatsInRange(workspaceId: string, start: Date, end: Date, prisma: PrismaClient): Promise<TaskStats[]>
  static async getUserPerformance(userId: string, period: string, prisma: PrismaClient): Promise<UserStats>
  static async getWorkloadByUser(workspaceId: string, prisma: PrismaClient): Promise<Record<string, number>>
}
```

---

## 5. Frontend Components

### 5.1 TaskBoard (Kanban View)

**Purpose**: Drag-and-drop Kanban board for task management

**Props**:
```typescript
interface TaskBoardProps {
  workspaceId: string;
  contextType?: TaskContextType;
  contextId?: string;
  groupBy?: 'status' | 'priority' | 'assignee' | 'group'; // Column grouping
  filters?: TaskFilters;
  onTaskClick?: (task: Task) => void;
}
```

**Features**:
- Drag-and-drop cards between columns
- Quick actions (assign, tag, priority)
- WIP limits per column
- Swim lanes (horizontal grouping)
- Real-time updates via WebSocket

**Libraries**:
- `react-beautiful-dnd` or `@dnd-kit/core` for drag-and-drop
- `react-query` (built into Wasp) for data fetching

### 5.2 TaskTable (Data Table View)

**Purpose**: Sortable, filterable data table

**Props**:
```typescript
interface TaskTableProps {
  workspaceId: string;
  contextType?: TaskContextType;
  contextId?: string;
  filters?: TaskFilters;
  columns?: string[]; // Visible columns
  onRowClick?: (task: Task) => void;
  onBulkSelect?: (taskIds: string[]) => void;
}
```

**Features**:
- Multi-column sorting
- Inline editing (status, assignee, priority)
- Bulk selection with checkbox
- Column chooser
- CSV export
- Row grouping

**Libraries**:
- `@tanstack/react-table` for table management
- `react-select` for dropdowns

### 5.3 TaskTimeline (Gantt View)

**Purpose**: Visual timeline showing task duration and dependencies

**Props**:
```typescript
interface TaskTimelineProps {
  tasks: Task[];
  startDate: Date;
  endDate: Date;
  zoom?: 'day' | 'week' | 'month';
  showDependencies?: boolean;
  onTaskResize?: (taskId: string, newDuration: number) => void;
}
```

**Features**:
- Horizontal bars for task duration
- Dependency arrows
- Critical path highlighting
- Drag to adjust start/end dates
- Milestone markers

**Libraries**:
- `react-gantt-chart` or custom SVG implementation
- `date-fns` for date calculations

### 5.4 TaskDetailsDrawer

**Purpose**: Right-side detail panel for selected task

**Props**:
```typescript
interface TaskDetailsDrawerProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (task: Task) => void;
}
```

**Sections**:
- Header: Title, status, priority
- Description (markdown editor)
- Assignment: Assignee + followers
- Time tracking: Start, due, estimated/actual hours
- Progress slider (0-100%)
- Dependencies list
- Activity feed (live updates)
- Comments section
- Attachments

### 5.5 TaskForm

**Purpose**: Create/edit task form

**Props**:
```typescript
interface TaskFormProps {
  task?: Task; // Edit mode if provided
  workspaceId: string;
  contextType?: TaskContextType;
  contextId?: string;
  onSubmit: (data: CreateTaskData) => Promise<void>;
  onCancel: () => void;
}
```

**Fields**:
- Title (required)
- Description (markdown)
- Priority (select)
- Assignee (user picker)
- Followers (multi-select)
- Tags (tag input with autocomplete)
- Due date (date picker)
- Estimated hours (number input)
- SLA minutes (number input)
- Dependencies (task picker)

---

## 6. Integration Requirements

### 6.1 Notification Integration

**Events to publish**:
- `task.created`
- `task.assigned`
- `task.reassigned`
- `task.status.changed`
- `task.completed`
- `task.overdue`
- `task.comment.added`
- `workflow.phase.changed`
- `workflow.completed`

**Integration points**:
```typescript
// src/core/modules/taskmanager/notifications/TaskNotificationService.ts
import { publishEvent } from '@src/core/notifications/eventBus';
import { createNotification } from '@src/core/notifications/operations';

export async function notifyTaskAssigned(task: Task, assignee: User, workspace: Workspace) {
  // Create in-app notification
  await createNotification({
    type: 'INFO',
    title: `Task assigned: ${task.title}`,
    message: `You've been assigned a ${task.priority} priority task`,
    link: `/workspace/${workspace.id}/tasks/${task.id}`,
    userId: assignee.id,
    workspaceId: workspace.id,
    eventType: 'task.assigned',
    metadata: { taskId: task.id },
  });
  
  // Publish to event bus for external delivery
  await publishEvent({
    type: 'task.assigned',
    workspaceId: workspace.id,
    userId: assignee.id,
    data: { task, assignee },
  });
}
```

### 6.2 Audit Integration

**Audit all mutations**:
```typescript
// After every task mutation
await logAuditEvent({
  workspaceId: task.workspaceId,
  userId: context.user.id,
  action: 'TASK_UPDATED',
  resource: 'task',
  resourceId: task.id,
  description: `Updated task: ${task.title}`,
  metadata: {
    changes: computeChanges(oldTask, newTask),
    before: oldTask,
    after: newTask,
  },
  ipAddress: context.req?.ip,
  userAgent: context.req?.headers['user-agent'],
}, prisma);
```

### 6.3 WebSocket Integration

**Extend message types**:
```typescript
// server/notificationWebSocket.ts
interface TaskUpdateMessage {
  type: 'TASK_UPDATE';
  taskId: string;
  workspaceId: string;
  changes: Record<string, any>;
}

export function broadcastTaskUpdate(taskId: string, workspaceId: string, changes: any) {
  const message: TaskUpdateMessage = {
    type: 'TASK_UPDATE',
    taskId,
    workspaceId,
    changes,
  };
  
  // Send to all clients subscribed to this task or workspace
  getSubscribedClients({ taskId }).forEach(ws => {
    ws.send(JSON.stringify(message));
  });
}
```

---

## 7. Security & Access Control

### 7.1 Permission Matrix

| Role | Create Task | Edit Own Task | Edit Any Task | Delete Task | Manage Templates | Manage Workflows | View Analytics |
|------|-------------|---------------|---------------|-------------|------------------|------------------|----------------|
| MEMBER | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Own tasks only |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Workspace-wide |
| OWNER | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Workspace-wide |

### 7.2 Plan Gates

| Feature | Free | Hobby | Pro |
|---------|------|-------|-----|
| Max Tasks | 50 | ∞ | ∞ |
| Templates | ❌ | ✅ (10) | ✅ (∞) |
| Workflows | ❌ | ❌ | ✅ |
| Automation | ❌ | ✅ (3 rules) | ✅ (∞) |
| External Sync | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |
| Advanced Analytics | ❌ | ❌ | ✅ |

---

## 8. Performance Requirements

### 8.1 Query Performance

- `getTasks` (50 tasks): <200ms
- `getTask` (single): <100ms
- `createTask`: <300ms (including side effects)
- `applyTemplate` (20 tasks): <2s
- `calculateCriticalPath` (100 tasks): <500ms

### 8.2 Caching Strategy

**Redis cache keys**:
- `tasks:workspace:{workspaceId}:list` (5 min TTL)
- `tasks:user:{userId}:assigned` (5 min TTL)
- `tasks:stats:{workspaceId}:{date}` (24 hour TTL)

**Invalidation triggers**:
- Task created/updated/deleted → invalidate workspace cache
- Task assigned → invalidate user cache
- Day rollover → invalidate stats cache

### 8.3 Database Indexes

All indexes defined in Prisma schema:
- `Task`: workspaceId, contextType+contextId, assigneeId, dueDate, status, tags (GIN)
- `TaskTemplate`: workspaceId, category, isActive
- `TaskWorkflow`: workspaceId, contextType+contextId, status
- `TaskStats`: workspaceId+date (unique)

---

## Next Steps

1. **Review & Approve**: Get stakeholder sign-off on functional spec
2. **Implementation**: Follow phases in LEGACY-REMOVAL.md
3. **Testing**: Comprehensive test coverage (unit, integration, E2E)
4. **Documentation**: Update user-facing docs and API reference
5. **Deployment**: Staged rollout with monitoring
6. **Iteration**: Gather feedback and iterate

**See Also**:
- `FEATURES.md` - Complete feature list
- `CORE-INTEGRATIONS.md` - Integration requirements
- `LEGACY-REMOVAL.md` - Migration guide
