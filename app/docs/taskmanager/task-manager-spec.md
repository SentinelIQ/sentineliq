# Task Manager Module - Implementation Guide

_Last updated: 20 Nov 2025_

## 📚 Documentation Index

This is the master documentation hub for the Task Manager module implementation. All documentation has been organized into focused, comprehensive guides.

### Core Documentation Files

1. **[FEATURES.md](./FEATURES.md)** - Complete Feature List
   - All 17 core features with detailed descriptions
   - Use cases and user stories
   - Technical capabilities and requirements
   - Feature summary matrix

2. **[CORE-INTEGRATIONS.md](./CORE-INTEGRATIONS.md)** - Core System Integration Guide
   - Integration requirements with all 18 core domains
   - Implementation patterns and examples
   - Integration checklist for tracking progress
   - Testing requirements per integration

3. **[LEGACY-REMOVAL.md](./LEGACY-REMOVAL.md)** - Legacy Code Removal Guide
   - Step-by-step migration from Aegis tasks to Task Manager
   - 9-phase implementation plan
   - Data migration scripts
   - Rollback procedures
   - Timeline estimates (2-3 weeks)

4. **[FUNCTIONAL-SPEC.md](./FUNCTIONAL-SPEC.md)** - Technical Specification
   - System architecture and data flow
   - Complete data models (Prisma schemas)
   - API operation specifications (30+ operations)
   - Business logic service layer
   - Frontend component specifications
   - Performance requirements

---

## Quick Start Guide

### For Project Managers
1. Start with the **Executive Summary** below
2. Review **FEATURES.md** for complete scope
3. Use **LEGACY-REMOVAL.md** timeline for planning
4. Track progress with integration checklist in **CORE-INTEGRATIONS.md**

### For Backend Developers
1. Read **FUNCTIONAL-SPEC.md** Section 1-4 (Architecture, Models, API, Services)
2. Follow **LEGACY-REMOVAL.md** Phase 1-3, 5-6
3. Reference **CORE-INTEGRATIONS.md** for domain integration patterns
4. Implement operations following Wasp patterns in spec

### For Frontend Developers
1. Read **FUNCTIONAL-SPEC.md** Section 5 (Frontend Components)
2. Follow **LEGACY-REMOVAL.md** Phase 4
3. Review **FEATURES.md** Section 13 for visualization requirements
4. Use existing ShadCN components, follow established patterns

### For DevOps/QA
1. Review **LEGACY-REMOVAL.md** Phase 7-8 (Testing, Deployment)
2. Check **FUNCTIONAL-SPEC.md** Section 8 (Performance Requirements)
3. Set up monitoring for integration points in **CORE-INTEGRATIONS.md**

---

## Executive Summary

### Problem Statement
Currently, task management in SentinelIQ is:
- **Hardcoded** in Aegis module (incident/case-specific)
- **Limited** to basic CRUD with no automation
- **Siloed** - cannot be used by Eclipse or other modules
- **Inflexible** - no templates, workflows, or orchestration

### Solution: Unified Task Manager Module
A comprehensive, context-agnostic task management system that:
- ✅ Works across ALL modules (Aegis, Eclipse, workspace operations)
- ✅ Supports advanced workflows with multi-phase orchestration
- ✅ Provides templates and playbooks for rapid deployment
- ✅ Includes automation engine with rules and triggers
- ✅ Offers multiple visualization modes (Kanban, Gantt, table)
- ✅ Integrates with external systems (Jira, ServiceNow)
- ✅ Delivers real-time updates and comprehensive analytics

### Key Benefits
- **Consistency**: Same task experience across all modules
- **Efficiency**: Templates reduce setup time by 80%
- **Visibility**: Unified analytics and reporting
- **Automation**: Reduce manual work with smart rules
- **Scalability**: Support workspace growth without performance degradation
- **Compliance**: Full audit trails and access controls

### Scope
- **17 core features** (see FEATURES.md)
- **30+ API operations** (see FUNCTIONAL-SPEC.md)
- **18 core system integrations** (see CORE-INTEGRATIONS.md)
- **3 new PgBoss jobs** for automation
- **8 new data models** + extension of existing Task model

### Timeline
- **Total Duration**: 2-3 weeks
- **Phase 1-3**: Backend (data model, operations, services) - 1 week
- **Phase 4**: Frontend (components, pages, hooks) - 1 week
- **Phase 5-9**: Integration, testing, deployment - 3-5 days

### Success Metrics
- All existing tasks migrated with 100% data integrity
- Zero increase in error rates post-deployment
- Task creation time reduced by 50% (via templates)
- User satisfaction score > 4.5/5
- API response times meet SLA (<200ms for queries)

---

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    SentinelIQ Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Aegis   │  │ Eclipse  │  │  Brand   │  │Workspace │  │
│  │ Incidents│  │  Alerts  │  │Protection│  │  Tasks   │  │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘  │
│        │             │              │             │        │
│        └─────────────┴──────────────┴─────────────┘        │
│                          │                                  │
│                          ▼                                  │
│         ┌────────────────────────────────────┐             │
│         │   TASK MANAGER MODULE (New)       │             │
│         ├────────────────────────────────────┤             │
│         │  - Tasks (context-agnostic)       │             │
│         │  - Templates & Playbooks          │             │
│         │  - Workflows (multi-phase)        │             │
│         │  - Automation Engine               │             │
│         │  - Analytics & Reporting           │             │
│         │  - External Integrations          │             │
│         └───────────┬────────────────────────┘             │
│                     │                                       │
│        ┌────────────┴────────────┐                        │
│        ▼                         ▼                         │
│  ┌──────────┐              ┌──────────┐                   │
│  │  Prisma  │              │  Core    │                   │
│  │   ORM    │              │ Systems  │                   │
│  └────┬─────┘              └─────┬────┘                   │
│       │                          │                         │
│       ▼                          ▼                         │
│  PostgreSQL          auth, workspace, notifications,      │
│   Database           audit, analytics, jobs, etc.         │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

### Module Organization

```
src/core/modules/taskmanager/
├── operations/       # Wasp operation handlers (API layer)
├── services/         # Business logic (domain layer)
├── automation/       # Rule engine and action executors
├── workflows/        # Workflow orchestration engine
├── validation/       # Zod input schemas
└── jobs/            # PgBoss scheduled jobs

src/client/components/task-manager/
├── TaskBoard.tsx    # Kanban view
├── TaskTable.tsx    # Data table
├── TaskTimeline.tsx # Gantt chart
└── [15+ more components...]

src/client/hooks/task-manager/
├── useTasks.ts
├── useTaskOperations.ts
└── [5+ more hooks...]
```

---

## Feature Catalog (Complete List)
1. **Multi-context task lifecycle** – Unified CRUD supporting `INCIDENT`, `CASE`, `BRAND_ALERT`, `TICKET`, `WORKSPACE`, and custom contexts defined in `TaskContextType`. Each task carries `workspaceId`, `contextType`, `contextId`, and optional `parentTaskId` for sub-tasking.
2. **Advanced status model** – Map Prisma `TaskStatus` enum to UI labels, enforce transitions (e.g., `WAITING → IN_PROGRESS → COMPLETED / CANCELLED`) via central guards in `TaskManagerService`.
3. **Priority & SLA metadata** – Persist `Priority`, SLA minutes, and escalation policies per task; surface SLA breaches to PgBoss jobs and notifications.
4. **Assignments & followers** – Primary assignee plus follower list, with optimistic locking to avoid double assignment; integrates with `src/core/user` for profile data and `notifications` for delivery.
5. **Tags, grouping & ordering** – Arbitrary tags, `group` buckets (phase), drag-and-drop ordering with persisted `order` integers per group for Kanban boards.
6. **Dependencies & critical path** – Bidirectional `dependencies`/`blockedBy` arrays, automatic detection of circular references, and `TaskDependencyGraph` generation for timeline view.
7. **Time tracking & progress** – Track `estimatedHours`, `actualHours`, `progress`, `startDate`, `dueDate`, and auto-calc remaining effort for analytics.
8. **Templates & playbooks** – Workspace + system templates (`TaskTemplate` + `TaskTemplateDefinition`) with trigger conditions and variable substitution for rapid workflow bootstrapping.
9. **Workflows orchestration** – `TaskWorkflow` entity groups tasks into phases, tracks execution state, exposes `WorkflowExecutionState` for UI progress and automation.
10. **Automation hooks** – Auto-creation via severity/alert triggers, auto-complete conditions, SLA-based escalations, and optional offloading to `services/engine` for enrichment tasks.
11. **Bulk operations & imports** – Mass update status/assignee, CSV import/export, and templated duplication via `applyTemplate` action.
12. **Collaboration tooling** – Inline notes (reusing `InvestigationNote`), attachments via MinIO, watcher notifications, and activity log streaming into `src/core/audit`.
13. **Visualization surfaces** – Kanban, timeline/Gantt, table, and workload views using shared components under `src/client/components/task-manager`.
14. **Analytics & reporting** – Workspace + admin dashboards with `TaskStats`, `WorkflowStats`, SLA compliance, and top performers feeding `src/core/analytics` + PgBoss `dailyStatsJob`.
15. **External connectors** – Bidirectional sync with ticket providers introduced in `migrations/20251117231659_add_ticket_providers` (e.g., Jira, ServiceNow) plus webhook triggers for SIEM/SOAR pipelines.
16. **Access control & tenancy** – Enforce workspace membership, per-role capabilities (analyst vs admin), per-plan gates (Pro plan unlocks workflows/templates/automation).
17. **API surface & extensibility** – Consistent Wasp operations + REST gateway (if needed) with rate limiting, audit logging, and OpenAPI snippets for partners.

---

## Core System Integration Map (100% Compliance)
| Domain / Path | Required Integration Details |
| --- | --- |
| `src/core/auth` | Every operation checks `context.user`; respect 2FA and session timeout policies; expose task permissions via `useAuth` in client.
| `src/core/workspace` | Reuse `checkWorkspaceAccess` and `WorkspaceMember` lookups; store `workspaceId` on all new models; support workspace quotas (`storageQuota` migration) for attachments.
| `src/core/user` | Task assignee/follower resolution, display names, avatar URLs, out-of-office rules; ensure user soft-deletes cascade to task reassignments.
| `src/core/notifications` + `server/notificationWebSocket.ts` | Emit `task.assigned`, `task.status.changed`, `task.overdue`, `workflow.progress` events to Redis/WebSocket; deliver digests through existing `sendNotificationDigestsJob`.
| `src/core/audit` | Record CRUD + automation actions as `AuditLog` entries (entity = `task`, `workflow`); include metadata for compliance exports.
| `src/core/logs` | Use `elkLogger` for error paths and automation traces; respect log retention job.
| `src/core/analytics` | Feed aggregated stats into `dailyStatsJob` and workspace analytics queries; ensure templates/workflows emit usage counters.
| `src/core/jobs` | Define PgBoss jobs for reminders/escalations (`taskDueReminderJob`, `taskEscalationJob`, `workflowHealthJob`); register cron in `main.wasp`.
| `src/core/payment` & `billing` | Gate advanced features by `workspace.subscriptionPlan`; block automation/templates on Free tier with actionable errors surfaced to UI.
| `src/core/email` | Reuse transactional templates for assignment, overdue, and workflow summary emails; respect workspace branding fields added in `20251117120405_add_workspace_branding_and_ownership`.
| `src/core/messages` | Allow analyst-to-stakeholder notifications referencing tasks, reusing contact preferences.
| `src/core/notifications/eventBus` | Publish structured events for downstream consumers (SOAR, SIEM) via existing bus.
| `src/shared/validation` | All operations must call `ensureArgsSchemaOrThrowHttpError` with Zod schemas.
| `server/redis.ts` & `server/rateLimit.ts` | Cache task filters, enforce mutation rate limits to protect database; share connection pools.
| `server/notificationWebSocket.ts` | Extend payload schema to include `taskId`, `workflowId`, context metadata for real-time updates.
| `services/engine` | Optional: queue automation tasks or enrichment steps (Python service) via S3/Redis bridging.
| `main.wasp` | Register new queries/actions with full entity lists; remove Aegis task operations to avoid duplication.
| `schema.prisma` | Expand Task model + add new models; keep migrations idempotent and multi-tenant safe.

---

## Legacy Decommissioning Playbook
1. **Inventory and freeze**
   - Flag `src/core/modules/aegis/tasks/operations.ts`, `src/client/pages/modules/aegis/components/TasksList.tsx`, `TaskForm.tsx`, and all `main.wasp` task registrations (lines ~1524–1570) as legacy.
   - Stop adding features to those files; document freeze in `CHANGELOG`.
2. **Data model upgrade**
   - Create Prisma migration adding `workspaceId`, `contextType`, `contextId`, `templateId`, `workflowId`, `tags`, `notes`, `metadata`, `autoCreated`, `progress`, `blockedBy`, `followers`, and `slaMinutes` to `Task`.
   - Introduce new models: `TaskTemplate`, `TaskTemplateTask`, `TaskWorkflow`, `TaskWorkflowPhase`, `TaskFollower`, `TaskActivityLog`, `TaskAutomationRule`.
   - Backfill existing rows: infer `contextType` = `INCIDENT`/`CASE` based on non-null FK; set `contextId` to the corresponding entity; stamp `workspaceId` via join.
3. **Bootstrap module structure**
   - Under `src/core/modules/taskmanager/`, add `operations/`, `services/`, `workflows/`, and `README.md`. Move the shared type definitions already in `models/types.ts` into this module index.
4. **Implement new operations**
   - Add Wasp operations (`getTasks`, `getTask`, `createTask`, `updateTask`, `deleteTask`, `bulkUpdateTasks`, `getTaskStats`, `getTaskTemplates`, `createTaskTemplate`, `updateTaskTemplate`, `applyTaskTemplate`, `getWorkflows`, `createWorkflow`, `updateWorkflow`, `advanceWorkflowPhase`, `syncExternalTask`, etc.).
   - Register them in `main.wasp` and update imports to `@src/core/modules/taskmanager/operations`.
5. **Frontend refactor**
   - Create shared UI package under `src/client/components/task-manager/` containing Kanban, timeline, forms, filters.
   - Update `IncidentDetailPage` and `CaseDetailPage` to consume new hooks (e.g., `useTasks({ contextType: 'INCIDENT', contextId })`).
   - Introduce dedicated Task Manager workspace route (e.g., `/workspace/:workspaceId/tasks`).
6. **Automation & jobs**
   - Wire new PgBoss jobs in `src/core/jobs/operations.ts` (or dedicated module) and add `job` entries in `main.wasp`.
   - Ensure `notifications` and `email` modules listen to new events.
7. **Remove legacy code**
   - Delete old operations file, UI components, and hard-coded template arrays once the new module is stable.
   - Remove deprecated entries from `main.wasp` and clean unused imports.
   - Update documentation/release notes indicating completion.
8. **Testing & rollout**
   - Add Vitest suites covering services, operations, and UI hooks.
   - Create migration plan + rollback instructions; run `wasp db migrate-dev` + `wasp db seed` updates.

---

## Functional Specification
### 1. Data Model (Prisma)
- **Task**
  - New fields: `workspaceId String`, `contextType TaskContextType`, `contextId String`, `templateId String?`, `workflowId String?`, `tags String[] @default([])`, `followers String[] @default([])`, `progress Int @default(0)`, `blockedBy String[] @default([])`, `autoCreated Boolean @default(false)`, `notes String?`, `metadata Json?`, `slaMinutes Int?`, `priority Priority @default(MEDIUM)`.
  - Indexes: `(workspaceId, contextType, contextId)`, `(assigneeId, status)`, Gin index on `tags` if supported.
- **TaskTemplate**
  - Fields: `id`, `workspaceId?`, `name`, `description`, `category`, `contextTypes TaskContextType[]`, `triggerConditions Json?`, `isBuiltin Boolean @default(false)`, `version String?`, `isActive Boolean @default(true)`.
- **TaskTemplateTask** (embedded or JSON) to store ordered definitions with dependencies.
- **TaskWorkflow**
  - Links to workspace, template, context, status, progress, `startedAt`, `completedAt`, `currentPhase`, `metadata`.
- **TaskWorkflowPhase**
  - Name, order, auto-start conditions, metrics; optionally denormalized.
- **TaskFollower**
  - Junction table mapping tasks ↔ users for watchers.
- **TaskActivityLog**
  - Append-only log for UI timeline + compliance (mirrors `AuditLog` but scoped per task).
- **TaskAutomationRule**
  - Defines triggers (event, condition, action) for workspace-level automation (auto-assign, slack ping, template application).

### 2. Backend Operations & Services
- **Operations** (all in `src/core/modules/taskmanager/operations/*.ts`):
  - Queries: `getTasks`, `getTask`, `getTaskStats`, `getTaskTemplates`, `getWorkflows`, `getWorkflowState`, `searchTasks`, `getTaskActivity`.
  - Actions: `createTask`, `updateTask`, `deleteTask`, `bulkUpdateTasks`, `assignTask`, `completeTask`, `reopenTask`, `reorderTasks`, `createTaskTemplate`, `updateTaskTemplate`, `toggleTemplateActive`, `applyTaskTemplate`, `createWorkflow`, `updateWorkflow`, `advanceWorkflow`, `syncExternalTask`, `attachEvidenceToTask`.
  - All operations import from `@src/core/modules/taskmanager/services` and enforce workspace membership via `checkWorkspaceAccess`.
  - Input validation done with Zod schemas stored alongside operations.
- **Services**: `TaskManagerService`, `WorkflowService`, `TemplateService`, `AutomationService`, `TaskStatsService`.
  - Encapsulate Prisma logic, dependency graph calculations, SLA checks, template expansion, analytics aggregation.
  - Services emit domain events to `notifications/eventBus` and `audit` modules.

### 3. Automation, Notifications, and Jobs
- **Notifications**
  - Event payloads published through `notifications` domain with types: `task.assigned`, `task.updated`, `task.completed`, `task.overdue`, `workflow.phase.changed`.
  - Delivery targets: email (`src/core/email`), in-app (`server/notificationWebSocket`), Slack/Teams webhooks (workspace configuration), SMS (if enabled).
- **Scheduled Jobs (PgBoss)**
  - `taskDueReminderJob` (runs hourly): queries tasks due in the next X hours; sends notifications.
  - `taskOverdueEscalationJob`: escalates tasks past SLA, creating `Alert` or timeline entries.
  - `workflowHealthJob`: ensures workflows progress; auto-unblocks tasks whose dependencies completed but status not updated.
  - Register jobs in `main.wasp` with `jobs` block; implement handlers under `src/core/jobs/tasks/`.
- **Automation Rules**
  - Evaluate on `Task` events; rule engine stored in `TaskAutomationRule` table; actions include auto-assign, auto-create subtask, call webhook, push to `services/engine` queue.

### 4. Frontend Surfaces
- **Shared Components** in `src/client/components/task-manager/`:
  - `TaskBoard` (Kanban), `TaskTimeline`, `TaskTable`, `TaskDetailsDrawer`, `TaskForm`, `BulkEditDialog`, `TemplateGallery`, `WorkflowDashboard`.
- **Hooks** under `src/client/hooks/task-manager/`: `useTasks`, `useTaskStats`, `useTaskTemplates`, `useWorkflows`, `useTaskOperations` (wraps actions with toaster + optimistic update), `useTaskFilters`.
- **Pages**
  - `/workspace/:workspaceId/tasks` – global task board.
  - `/workspace/:workspaceId/workflows` – workflow management UI.
  - Embedded views inside Aegis (`IncidentDetailPage`, `CaseDetailPage`), Eclipse, Brand monitoring by passing context props.
- **i18n** – add `taskmanager` namespace in `src/client/i18n`; ensure strings support PT-BR + EN-US.
- **Access Control** – hide automation/templates UI for non-admin or plan-limited users; re-use `useWorkspace` hook for gating.

### 5. External Integrations
- **Ticket Providers** (`src/core/modules/integrations` or new domain)
  - Map tasks to external tickets via `externalReference` field; maintain sync status and last sync timestamp.
- **SOAR/SIEM Webhooks**
  - Provide action to emit JSON payload to workspace-configured webhook for each task transition.
- **Files & Evidence**
  - Reuse `Evidence` storage for attachments; tasks reference `evidenceId` array or join table; ensure MinIO cleanup job covers orphaned files.

### 6. Observability, Compliance, and QA
- **Audit Logging** – Mirror every mutation to `AuditLog` with `entityType = 'task'` or `'workflow'`, referencing workspace + user.
- **Logging** – Send structured logs via `server/elkLogger.ts`; include correlation IDs from incidents/cases.
- **Metrics** – Expose counters/timers for create/update latency via existing analytics infra.
- **Testing** – Add Vitest suites (`tests/taskmanager/*.test.ts`) covering services, operations, rules, UI hooks; include integration tests for migrations (Prisma + Vitest + seed data) using `wasp db migrate-dev` + `vitest --runInBand`.
- **Security** – Enforce rate limiting on mutating actions using `server/rateLimit.ts`; sanitize notes/descriptions to prevent XSS; confirm redaction in audit exports.

---

## Appendix & Next Actions
- **Documentation ownership** – Place updates in this file plus `src/core/modules/taskmanager/README.md` once created.
- **Dependencies** – Requires Prisma migration, new PgBoss jobs, and updates to `main.wasp`, `package.json` (if adding libs like `react-beautiful-dnd`), and `tsconfig` path aliases if new directories introduced.
- **Rollout strategy** – Feature flag new UI behind `taskManager.enabled` workspace flag; run dual-write (legacy + new) until validation complete, then cut over and remove legacy stack per playbook above.

> **Reminder:** Keep all Task Manager imports relative (no `@wasp/` prefix) and ensure every operation lists all touched entities inside `main.wasp`'s `entities` array.

