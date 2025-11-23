# Task Manager Module - Complete Feature List

_Last updated: 20 Nov 2025_

## Overview
The Task Manager module is a comprehensive, automation-ready task management system designed to unify task handling across all SentinelIQ surfaces (Aegis incidents/cases, Eclipse brand monitoring, workspace operations, and custom workflows).

---

## Core Features

### 1. Multi-Context Task Lifecycle Management
**Description**: Unified CRUD operations supporting multiple context types with hierarchical relationships.

**Capabilities**:
- Create, read, update, delete tasks across different contexts
- Support for `INCIDENT`, `CASE`, `BRAND_ALERT`, `TICKET`, `WORKSPACE`, and custom context types
- Each task links to: `workspaceId`, `contextType`, `contextId`
- Optional parent-child relationships via `parentTaskId` for sub-tasks
- Deep nesting support for complex task hierarchies

**User Stories**:
- As an analyst, I want to create tasks within an incident so I can track investigation steps
- As a manager, I want to see all tasks across all incidents in my workspace
- As a team lead, I want to create sub-tasks under a parent task for delegation

---

### 2. Advanced Status Model
**Description**: Comprehensive status management with enforced transitions and audit trails.

**Capabilities**:
- Status enum: `WAITING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `BLOCKED`, `ON_HOLD`
- State machine validation preventing invalid transitions (e.g., `COMPLETED → WAITING` requires reopening)
- Automatic status updates based on dependencies (auto-start when blockers complete)
- Status change history stored in timeline events
- Visual status indicators in UI (colors, icons, badges)

**Business Rules**:
- Tasks cannot be marked complete if child tasks are incomplete
- Blocked tasks automatically become `WAITING` when dependencies complete
- Status changes trigger notifications to assignee and followers

---

### 3. Priority & SLA Metadata
**Description**: Priority-based task management with SLA tracking and escalation.

**Capabilities**:
- Priority levels: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`
- SLA tracking: `slaMinutes` field defines expected completion time
- Automatic SLA breach detection via scheduled job
- Escalation policies: auto-assign to manager, create high-priority alert
- Visual SLA indicators (green/yellow/red based on time remaining)
- SLA pause/resume capability for blocked tasks

**Metrics**:
- Average completion time per priority level
- SLA breach rate per team/user
- Time to first response tracking
- Overdue task count and age

---

### 4. Assignments & Followers
**Description**: Flexible assignment model with primary assignee and multiple followers.

**Capabilities**:
- Primary assignee (single user)
- Multiple followers (array of user IDs)
- Optimistic locking to prevent double-assignment race conditions
- Automatic notification on assignment/reassignment
- Follower notifications on major status changes
- Workload balancing algorithms (suggest least-busy analyst)
- Assignment history tracking in audit logs

**Integration Points**:
- `src/core/user` for profile data, avatars, online status
- `src/core/notifications` for assignment alerts (email + in-app + WebSocket)
- `src/core/workspace` for team-based auto-assignment rules

---

### 5. Tags, Grouping & Ordering
**Description**: Flexible organization system with drag-and-drop Kanban support.

**Capabilities**:
- Arbitrary tags (string array, max 20 per task)
- Tag auto-suggest based on workspace history
- Group field for phase/stage bucketing (e.g., "Analysis", "Containment", "Recovery")
- Integer `order` field for manual ordering within groups
- Drag-and-drop reordering persists to database
- Saved filters and views (custom query combinations)

**UI Components**:
- Kanban board with group columns (drag cards between columns)
- Tag cloud visualization showing most-used tags
- Bulk tag operations (add/remove tags from selected tasks)
- Smart grouping suggestions based on context type

---

### 6. Dependencies & Critical Path
**Description**: Bidirectional dependency tracking with circular reference prevention.

**Capabilities**:
- `dependencies` array: tasks that must complete before this task can start
- `blockedBy` array: auto-generated reverse lookup for dependency graph
- Circular dependency detection algorithm (graph traversal)
- Critical path calculation for timeline/Gantt views
- Dependency visualization (network graph, tree view)
- Auto-unblock when all dependencies complete

**Algorithms**:
- Topological sort for valid execution order
- Longest path calculation for critical path analysis
- Cycle detection using DFS with color marking

---

### 7. Time Tracking & Progress
**Description**: Comprehensive time management with effort estimation and actuals.

**Capabilities**:
- `estimatedHours`: initial effort estimate (float)
- `actualHours`: tracked time spent (float)
- `progress`: percentage completion (0-100 integer)
- `startDate`: when work began
- `dueDate`: target completion date
- Automatic remaining effort calculation: `estimatedHours - actualHours`
- Time entry log for detailed hour tracking (optional sub-model)
- Burndown charts showing progress vs. time

**Analytics**:
- Estimation accuracy (actual vs. estimated) per user
- Velocity metrics (story points or hours per sprint)
- Time spent by task category/priority
- Overtime alerts when actual exceeds estimate by threshold

---

### 8. Templates & Playbooks
**Description**: Reusable task templates for standardized workflows.

**Capabilities**:
- **System templates**: Built-in playbooks (e.g., "Phishing Investigation", "Malware Analysis")
- **Workspace templates**: Custom templates created by admins
- Template versioning (`version` field, draft/published states)
- Variable substitution: `{{incidentId}}`, `{{severity}}`, `{{assignee}}`
- Trigger conditions: auto-apply template when specific criteria met
- Template categories for easy browsing
- Clone template to create new workspace template

**Data Model**:
```prisma
model TaskTemplate {
  id              String   @id @default(uuid())
  workspaceId     String?  // null = system template
  name            String
  description     String?
  category        String   // "incident", "case", "workflow"
  contextTypes    TaskContextType[] // applicable contexts
  triggerConditions Json?  // {"severity": "CRITICAL", "status": "NEW"}
  isBuiltin       Boolean  @default(false)
  version         String?
  isActive        Boolean  @default(true)
  tasks           TaskTemplateTask[] // ordered list of task definitions
}

model TaskTemplateTask {
  id              String   @id @default(uuid())
  templateId      String
  template        TaskTemplate @relation(...)
  title           String   // with variable placeholders
  description     String?
  priority        Priority
  estimatedHours  Float?
  order           Int
  groupName       String?
  dependencies    String[] // task order indices
  assignmentRule  Json?    // {"role": "analyst", "skill": "malware"}
}
```

**Use Cases**:
- Apply "Incident Response Playbook" when critical incident created
- Clone workspace template and customize for specific case type
- Share template library across workspaces (Pro plan feature)

---

### 9. Workflow Orchestration
**Description**: Multi-phase workflow execution with state tracking.

**Capabilities**:
- `TaskWorkflow` entity groups related tasks into phases
- Phase progression: sequential or parallel execution
- Workflow execution state: `NOT_STARTED`, `IN_PROGRESS`, `PAUSED`, `COMPLETED`, `FAILED`
- Phase auto-start conditions (e.g., "start phase 2 when phase 1 has 80% tasks complete")
- Workflow progress calculation across all tasks
- Workflow templates (create workflow from template)
- Workflow pause/resume/restart capabilities

**Data Model**:
```prisma
model TaskWorkflow {
  id              String   @id @default(uuid())
  workspaceId     String
  name            String
  description     String?
  templateId      String?  // workflow created from template
  contextType     TaskContextType
  contextId       String
  status          WorkflowStatus @default(NOT_STARTED)
  progress        Int      @default(0) // 0-100
  startedAt       DateTime?
  completedAt     DateTime?
  currentPhase    String?
  phases          TaskWorkflowPhase[]
  metadata        Json?
}

model TaskWorkflowPhase {
  id              String   @id @default(uuid())
  workflowId      String
  workflow        TaskWorkflow @relation(...)
  name            String
  description     String?
  order           Int
  autoStartCondition Json?  // {"previousPhaseProgress": 100}
  status          PhaseStatus @default(PENDING)
  tasks           Task[]   // via workflowPhaseId FK
  startedAt       DateTime?
  completedAt     DateTime?
  metrics         Json?    // {tasksCompleted, avgCompletionTime, etc}
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
```

**UI Features**:
- Visual workflow progress (phase swimlanes)
- Workflow timeline showing phase start/end dates
- Workflow health dashboard (stalled phases, blocked tasks)

---

### 10. Automation Hooks
**Description**: Event-driven automation for task creation, updates, and escalations.

**Capabilities**:
- **Auto-creation triggers**: Create tasks when severity threshold met, alert escalated, SLA breach detected
- **Auto-complete conditions**: Mark task complete when external system confirms action (e.g., ticket closed in Jira)
- **SLA-based escalations**: Create high-priority task or alert when SLA breached
- **Enrichment offloading**: Queue tasks to `services/engine` for automated threat intel enrichment
- **Webhook triggers**: Fire webhook when task status changes (integrate with SOAR/SIEM)

**Automation Rule Engine**:
```prisma
model TaskAutomationRule {
  id              String   @id @default(uuid())
  workspaceId     String
  name            String
  description     String?
  isActive        Boolean  @default(true)
  triggerEvent    String   // "alert.escalated", "incident.critical", "task.overdue"
  conditions      Json     // {"severity": "CRITICAL", "assignee": null}
  actions         Json[]   // [{"type": "create_task", "template": "tplId"}, {"type": "notify", ...}]
  priority        Int      @default(0) // execution order when multiple rules match
  createdAt       DateTime @default(now())
  lastTriggeredAt DateTime?
  executionCount  Int      @default(0)
}
```

**Example Rules**:
1. When `incident.severity = CRITICAL` → apply "Critical Incident Response" template
2. When `task.status = COMPLETED` and `task.contextType = INCIDENT` → check if all incident tasks done, auto-close incident
3. When `task.dueDate < now()` and `task.status != COMPLETED` → send escalation notification to manager
4. When `task.progress = 50%` → send reminder notification to assignee

---

### 11. Bulk Operations & Imports
**Description**: Efficient mass operations for large-scale task management.

**Capabilities**:
- Bulk status update (select multiple tasks → change status)
- Bulk assignee change
- Bulk tag add/remove
- CSV import: upload spreadsheet with task definitions
- CSV export: download tasks with all metadata for external analysis
- Templated duplication: create 10 identical tasks with incremental names
- Bulk delete with confirmation (soft delete to trash, auto-purge after 30 days)

**CSV Format** (import):
```csv
title,description,priority,assignee,tags,estimatedHours,dueDate,contextType,contextId
"Analyze malware sample","Run sandbox analysis",HIGH,john@example.com,"malware,analysis",2,2025-11-25,INCIDENT,inc-123
"Review firewall logs","Check for lateral movement",MEDIUM,jane@example.com,"logs,network",1.5,2025-11-24,INCIDENT,inc-123
```

**UI Components**:
- Multi-select checkbox in task table
- Bulk action dropdown (status, assignee, tags, delete)
- Import wizard with column mapping and validation preview
- Export with filter/column selection

---

### 12. Collaboration Tooling
**Description**: Rich collaboration features for team coordination.

**Capabilities**:
- **Inline notes**: Reuse `InvestigationNote` model from Aegis (already exists)
  - Attach notes to tasks
  - Markdown support for rich formatting
  - @mention users to notify (parse content for `@username` syntax)
  - Note editing with revision history
- **Attachments**: MinIO file storage integration
  - Upload evidence files directly to task
  - Reference existing evidence by ID (link to `Evidence` table)
  - Automatic thumbnail generation for images
  - Virus scanning before attachment (ClamAV integration)
- **Watchers**: Follower notifications on key events
  - New comment posted
  - Status changed
  - Assignee changed
  - Task overdue/SLA breached
- **Activity log streaming**: Real-time updates in UI
  - WebSocket integration for live activity feed
  - Task detail sidebar shows recent activity
  - Filter activity by type (comments, status, assignments)

**Integration Points**:
- `InvestigationNote` entity (already exists, add `taskId` FK)
- `Evidence` entity (already exists, add `tasks` relation)
- `src/core/audit` for comprehensive activity tracking
- `server/notificationWebSocket.ts` for real-time updates

---

### 13. Visualization Surfaces
**Description**: Multiple view modes for different use cases.

**Capabilities**:
- **Kanban Board**: Drag-and-drop cards grouped by status or custom field
  - Swim lanes per assignee or priority
  - WIP limits per column (e.g., max 5 tasks in "In Progress")
  - Quick actions on card hover (assign, tag, edit)
  - Card coloring by priority/SLA status
- **Timeline/Gantt View**: Visual project timeline
  - Horizontal bars showing task duration
  - Dependency lines connecting tasks
  - Critical path highlighted in red
  - Milestone markers for key dates
  - Zoom controls (day/week/month view)
- **Table View**: Sortable, filterable data table
  - Inline editing for quick updates
  - Column chooser (show/hide columns)
  - Row grouping by any field
  - Export visible rows to CSV
- **Workload View**: Team capacity planning
  - Calendar heatmap per user showing task hours
  - Overallocation warnings (red highlight when > 8 hours/day)
  - Drag task to reassign to less-busy user
  - Burndown chart per user/team

**Shared Components**:
```
src/client/components/task-manager/
├── TaskBoard.tsx          # Kanban implementation
├── TaskTimeline.tsx       # Gantt chart
├── TaskTable.tsx          # Data table with inline edit
├── TaskDetailsDrawer.tsx  # Right-side detail panel
├── TaskForm.tsx           # Create/edit form
├── BulkEditDialog.tsx     # Multi-task editor
├── TaskCard.tsx           # Kanban card component
├── TaskRow.tsx            # Table row component
├── TimelineBar.tsx        # Gantt bar component
├── WorkloadCalendar.tsx   # Capacity heatmap
└── filters/
    ├── TaskFilters.tsx    # Filter sidebar
    └── SavedViews.tsx     # Saved filter presets
```

---

### 14. Analytics & Reporting
**Description**: Comprehensive metrics and dashboards for performance tracking.

**Capabilities**:
- **Workspace Dashboard**:
  - Total tasks by status (pie chart)
  - Open tasks trend (line chart, last 30 days)
  - Overdue tasks count and list
  - Average completion time by priority
  - Top performers (most tasks completed)
  - SLA compliance rate (% tasks completed within SLA)
- **Admin Dashboard** (requires `context.user.isAdmin = true`):
  - System-wide task metrics
  - Template usage statistics (most applied templates)
  - Automation rule effectiveness (trigger count, success rate)
  - Cross-workspace benchmarks (avg completion time by industry)
- **Custom Reports**:
  - Report builder with drag-and-drop fields
  - Save report definitions for recurring generation
  - Schedule email delivery (daily/weekly/monthly)
  - Export to PDF, CSV, Excel

**Data Aggregation**:
```prisma
model TaskStats {
  id              String   @id @default(uuid())
  workspaceId     String
  date            DateTime @db.Date
  totalTasks      Int
  completedTasks  Int
  overdueTasks    Int
  avgCompletionHours Float
  slaBreachCount  Int
  byPriority      Json     // {"CRITICAL": 5, "HIGH": 12, ...}
  byStatus        Json
  byContextType   Json
  topPerformers   Json     // [{"userId": "...", "completed": 15}, ...]
  
  @@unique([workspaceId, date])
  @@index([workspaceId, date])
}
```

**Integration with Analytics Domain**:
- Feed `TaskStats` into `dailyStatsJob` (extend existing job)
- Expose `getTaskStats` query for dashboards
- Store historical snapshots for trend analysis

---

### 15. External Connectors
**Description**: Bidirectional sync with external ticket/project management systems.

**Capabilities**:
- **Ticket Provider Integration** (reuses existing `TicketProvider` infrastructure):
  - Jira: create Jira issue from task, sync status bidirectionally
  - ServiceNow: create incident ticket, update task when ticket resolves
  - Azure DevOps: create work item, sync comments
- **Sync Status Tracking**:
  - `externalReference` field stores provider + external ID (e.g., "JIRA-1234")
  - `lastSyncAt` timestamp for staleness detection
  - `syncStatus`: `PENDING`, `SYNCED`, `ERROR`, `OUT_OF_SYNC`
  - Conflict resolution rules (SentinelIQ wins, external wins, manual resolve)
- **Webhook Triggers for SIEM/SOAR**:
  - Fire webhook on task status change
  - Payload includes full task data + context
  - Retry logic with exponential backoff
  - Webhook signature verification (HMAC)

**Data Model Extension**:
```typescript
// Add to Task entity
model Task {
  // ... existing fields
  externalReference  String?   // "JIRA-1234", "SNOW-INC789"
  externalProvider   String?   // "JIRA", "SERVICENOW", "AZURE_DEVOPS"
  lastSyncAt         DateTime?
  syncStatus         SyncStatus @default(PENDING)
  syncError          String?
}

enum SyncStatus {
  PENDING
  SYNCED
  ERROR
  OUT_OF_SYNC
  DISABLED
}
```

**Webhook Payload Example**:
```json
{
  "event": "task.status.changed",
  "timestamp": "2025-11-20T10:30:00Z",
  "workspaceId": "ws-123",
  "task": {
    "id": "task-456",
    "title": "Analyze suspicious email",
    "status": "COMPLETED",
    "contextType": "INCIDENT",
    "contextId": "inc-789",
    "assignee": {"id": "user-001", "email": "analyst@company.com"},
    "completedAt": "2025-11-20T10:28:55Z"
  },
  "changes": {
    "status": {"from": "IN_PROGRESS", "to": "COMPLETED"}
  }
}
```

---

### 16. Access Control & Tenancy
**Description**: Comprehensive security model enforcing workspace isolation and role-based permissions.

**Capabilities**:
- **Workspace Isolation**: ALWAYS validate workspace membership before any operation
- **Role-Based Capabilities**:
  - `MEMBER`: View tasks, edit assigned tasks, add comments
  - `ADMIN`: Create/delete tasks, assign to anyone, manage templates, configure automation
  - `OWNER`: All admin capabilities + delete workspace tasks permanently
- **Per-Plan Feature Gates**:
  - Free tier: basic tasks, up to 50 tasks per workspace
  - Hobby tier: unlimited tasks, templates, up to 3 automation rules
  - Pro tier: everything + workflows, unlimited automation, advanced analytics, API access
- **Field-Level Permissions**:
  - Only assignee can mark task as complete (unless admin overrides)
  - Only creator or admin can delete task
  - Followers have read-only access unless also assignee

**Implementation Pattern**:
```typescript
// Every operation must validate workspace access
import { checkWorkspaceAccess } from '@src/core/workspace/validation';

export const updateTask: UpdateTask = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  
  const task = await context.entities.Task.findUnique({
    where: { id: args.taskId },
    include: { workspace: { include: { members: true } } }
  });
  
  // Check workspace membership
  const member = task.workspace.members.find(m => m.userId === context.user.id);
  if (!member) throw new HttpError(403, 'Not a workspace member');
  
  // Check role permissions
  if (args.assigneeId && member.role === 'MEMBER') {
    throw new HttpError(403, 'Only admins can reassign tasks');
  }
  
  // Check plan limits
  if (args.applyTemplate && task.workspace.subscriptionPlan === 'free') {
    throw new HttpError(403, 'Templates require Hobby or Pro plan');
  }
  
  // Proceed with update...
};
```

---

### 17. API Surface & Extensibility
**Description**: Consistent API for internal and external consumers.

**Capabilities**:
- **Wasp Operations** (primary interface):
  - Type-safe queries and actions
  - Automatic authentication/authorization
  - Entity access control via `entities: [...]` declaration
- **REST Gateway** (optional, for partners/integrations):
  - Express middleware exposing operations as REST endpoints
  - API key authentication (workspace-scoped keys)
  - Rate limiting per API key (100 req/min default)
  - OpenAPI 3.0 spec generation for documentation
- **GraphQL Endpoint** (future consideration):
  - Single endpoint for flexible querying
  - Schema auto-generated from Prisma
  - Subscriptions for real-time updates
- **Webhook Management**:
  - CRUD for webhook subscriptions (URL, events, secret)
  - Test webhook feature (send sample payload)
  - Webhook logs (request/response history, errors)

**REST API Examples**:
```http
# Create task
POST /api/v1/workspaces/:workspaceId/tasks
Authorization: Bearer <api_key>
Content-Type: application/json
{
  "title": "Investigate suspicious login",
  "priority": "HIGH",
  "contextType": "INCIDENT",
  "contextId": "inc-123",
  "assigneeId": "user-456"
}

# List tasks with filters
GET /api/v1/workspaces/:workspaceId/tasks?status=IN_PROGRESS&priority=HIGH&assignee=user-456

# Update task status
PATCH /api/v1/workspaces/:workspaceId/tasks/:taskId
{
  "status": "COMPLETED",
  "actualHours": 2.5
}
```

**Rate Limiting Integration**:
```typescript
// Reuse server/rateLimit.ts
import { createRateLimiter } from '@src/server/rateLimit';
const taskApiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,            // 100 requests per window
  keyGenerator: (req) => req.headers['x-api-key'] // per API key
});
```

---

## Feature Summary Table

| Feature | Complexity | Integration Points | Plan Gate |
|---------|-----------|-------------------|-----------|
| Multi-context lifecycle | Medium | workspace, user | All |
| Advanced status model | Medium | audit, notifications | All |
| Priority & SLA | High | jobs, notifications, analytics | All |
| Assignments & followers | Medium | user, notifications, workspace | All |
| Tags & grouping | Low | - | All |
| Dependencies & critical path | High | - | Hobby+ |
| Time tracking | Medium | analytics | All |
| Templates & playbooks | High | - | Hobby+ |
| Workflow orchestration | Very High | jobs, notifications | Pro |
| Automation hooks | Very High | jobs, notifications, engine | Pro |
| Bulk operations | Medium | - | All |
| Collaboration tools | Medium | audit, notifications, files | All |
| Visualizations | High | - | All |
| Analytics & reporting | High | analytics, jobs | All |
| External connectors | Very High | tickets, webhooks | Pro |
| Access control | Medium | workspace, auth | All |
| API surface | High | server/rateLimit, audit | Pro (REST/GraphQL) |

---

## Next Steps
See companion documentation:
- `CORE-INTEGRATIONS.md` - Detailed integration requirements with src/core domains
- `LEGACY-REMOVAL.md` - Step-by-step guide for removing Aegis task code
- `FUNCTIONAL-SPEC.md` - Technical specification for implementation
- `API-REFERENCE.md` - Complete API documentation for all operations
