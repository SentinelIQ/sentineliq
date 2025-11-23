# AI Coding Agent Instructions

This is **SentinelIQ**, a B2B SaaS security platform built with **Wasp 0.18** - a full-stack TypeScript framework combining React frontend, Node.js backend, and PostgreSQL with workspace multi-tenancy.

## 🏗️ Architecture Overview

**Wasp DSL Configuration**: All app structure is defined in `main.wasp` using Wasp's declarative language. This includes routes, pages, operations (queries/actions), authentication, jobs, and APIs.

**Key Architectural Components**:
- **Frontend**: React + TypeScript in `src/client/` with ShadCN UI v2.3.0 components
- **Business Logic**: Core domain logic in `src/core/` organized by business domains (auth, workspace, notifications, billing, analytics, audit, logs, jobs, messages, user, payment, email, database)
- **Backend**: Node.js operations in `src/core/{domain}/operations.ts` files
- **Database**: PostgreSQL with Prisma ORM, schema in `schema.prisma` - 20+ entities including workspaces, multi-tenancy, notifications, audit logs
- **Multi-Tenancy**: Workspace-based isolation with WorkspaceMember join table, soft deletes, storage quotas
- **Real-Time**: WebSocket server at `/ws/notifications` for live notifications using `ws` library
- **Infrastructure**: Docker Compose stack with Redis, ELK (Elasticsearch/Logstash/Kibana), MinIO S3-compatible storage
- **Payments**: Stripe integration with workspace-level subscriptions (free/hobby/pro plans)
- **Analytics**: PgBoss scheduled jobs (9 jobs total) including `dailyStatsJob`, cleanup jobs, backup jobs
- **Auth**: Email/password + Google OAuth, 2FA with TOTP, refresh token rotation, IP whitelisting
- **i18n**: react-i18next with PT-BR and EN-US support, 6 namespaces (common, auth, dashboard, billing, analytics, admin)

## 🔧 Essential Development Patterns

### Wasp Import Rules (Critical)
```typescript
// ✅ Correct Wasp imports in .ts/.tsx files
import { User, Workspace, Notification } from 'wasp/entities'
import { useQuery, getUserWorkspaces } from 'wasp/client/operations'
import type { GetUserWorkspaces } from 'wasp/server/operations'
import { useAuth, getEmail } from 'wasp/auth'
import { prisma } from 'wasp/server'

// ❌ Never use @wasp/ prefix or @src/ in TypeScript files
import { User } from '@wasp/entities' // WRONG
import { utils } from '@src/shared/utils' // WRONG - use relative paths

// ✅ Wasp config imports (main.wasp only)
fn: import { getUserWorkspaces } from "@src/core/workspace/operations"
```

### Project Organization Pattern

**Core Business Logic Structure**:
```
src/
├── client/                    # Frontend React components and pages
│   ├── pages/                # All UI pages (admin, auth, workspace, modules, notifications)
│   ├── components/           # Shared UI components (notifications, LanguageSwitcher)
│   ├── hooks/               # Custom React hooks (useNotifications, useTranslation)
│   ├── i18n/                # Internationalization (config, locales/pt, locales/en)
│   └── layouts/             # Layout components
├── core/                     # Business logic domain organization (12 domains)
│   ├── auth/                # Authentication (operations, emails, 2FA, IP whitelist, refresh tokens)
│   ├── workspace/           # Multi-tenancy (operations, cleanup, invitations)
│   ├── notifications/       # Notification system (operations, eventBus, deliveryService, digest)
│   ├── payment/             # Stripe integration (operations, webhook, paymentProcessor)
│   ├── analytics/           # Analytics (stats, workspace analytics, providers)
│   ├── audit/               # Audit logging (operations, compliance tracking)
│   ├── logs/                # Technical logging (operations, logger, levels, retention)
│   ├── jobs/                # PgBoss job monitoring (operations)
│   ├── messages/            # Contact form (operations)
│   ├── user/                # User management (operations)
│   ├── email/               # Email templates and sending
│   └── database/            # Backup, recovery, monitoring (operations, backupJob)
├── server/                   # Server infrastructure
│   ├── notificationWebSocket.ts  # WebSocket server for real-time notifications
│   ├── elkLogger.ts         # ELK stack integration
│   ├── redis.ts             # Redis client (session, rate limiting)
│   ├── rateLimit.ts         # Express rate limiting
│   ├── healthCheck.ts       # Health check API
│   └── sentry.ts            # Error tracking
└── shared/                  # Shared utilities and types
```

**Domain-Driven Organization Benefits**:
- **Clear separation**: UI in `client/`, business logic in `core/`, infrastructure in `server/`
- **12 business domains**: Each with clear boundaries and responsibilities
- **Multi-tenancy**: Workspace-based isolation enforced at operation level
- **Real-time**: WebSocket integration with event bus for notifications

### Operations Implementation
```typescript
// In main.wasp - declare operations with entities
query getAllTasks {
  fn: import { getAllTasks } from "@src/core/tasks/operations",
  entities: [Task, User]
}

// In src/core/tasks/operations.ts - implement with proper types
export const getAllTasks: GetAllTasks<void, Task[]> = async (_args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authorized');
  
  return context.entities.Task.findMany({
    where: { userId: context.user.id }
  });
}

// Business logic in src/core/tasks/services.ts
export class TaskService {
  static async createTaskWithValidation(data: CreateTaskData, userId: string) {
    // Complex business logic here
    return this.validateAndCreate(data, userId);
  }
}
```

### Client-Side Usage Patterns
```typescript
// ✅ Use useQuery for data fetching
import { getDailyStats } from 'wasp/client/operations';
const { data: stats, isLoading } = useQuery(getDailyStats);

// ✅ Call actions directly (NOT useAction unless optimistic updates needed)
import { updateIsUserAdminById } from 'wasp/client/operations';
await updateIsUserAdminById({ id: userId, isAdmin: true });

// ✅ Auth access
import { useAuth, getEmail } from 'wasp/auth';
const { data: user } = useAuth(); // Returns AuthUser | null
const email = getEmail(user); // Helper for identity data

// ✅ Client components structure
// src/client/pages/admin/UsersDashboardPage.tsx - UI components only
// src/core/user/ - All business logic
```

### Input Validation Pattern
```typescript
// Use Zod schemas for operation input validation
import { ensureArgsSchemaOrThrowHttpError } from '../../server/validation';
import * as z from 'zod';

const updateUserSchema = z.object({
  id: z.string().nonempty(),
  isAdmin: z.boolean(),
});

export const updateUser: UpdateUser<UpdateUserInput, User> = async (rawArgs, context) => {
  const { id, isAdmin } = ensureArgsSchemaOrThrowHttpError(updateUserSchema, rawArgs);
  // ... operation logic
};
```

## 💰 Payment System Architecture

**Workspace-Level Payments**: Stripe integration in `src/core/payment/`, subscriptions managed per workspace (not per user).

**Webhook Handling**: `/payments-webhook` API endpoint with:
- Raw body parsing with Stripe signature verification
- Event routing to typed handlers in `src/core/payment/webhook.ts`
- Workspace lookup via `paymentProcessorUserId` field on Workspace entity
- Subscription status updates using enum values: 'active', 'cancel_at_period_end', 'past_due', 'deleted', 'trialing'
- Payment plans: 'free', 'hobby', 'pro' stored in workspace `subscriptionPlan` field
- Brazilian billing support: CNPJ, legal name, state registration, NF-e fields

**Key Pattern**: All payment operations validate workspace membership before proceeding:
```typescript
const workspace = await context.entities.Workspace.findUnique({
  where: { id: workspaceId },
  include: { members: true }
});
if (!workspace.members.some(m => m.userId === context.user.id)) {
  throw new HttpError(403, 'Not authorized');
}
```

## 📊 Analytics & Jobs

**9 Scheduled PgBoss Jobs** defined in `main.wasp`:
1. `dailyStatsJob` (hourly): User/revenue/pageview metrics → `DailyStats` entity
2. `cleanupExpiredInvitationsJob` (2 AM daily): Remove old `WorkspaceInvitation` records
3. `cleanupOldLogsJob` (3 AM daily): Purge `SystemLog` and `AuditLog` beyond retention period
4. `cleanupExpiredRefreshTokensJob` (4 AM daily): Remove expired `RefreshToken` records
5. `garbageCollectWorkspacesJob` (5 AM daily): Hard delete soft-deleted workspaces (`deletedAt` field)
6. `cleanupExpiredOwnershipTransfersJob` (6 AM daily): Remove expired ownership transfer tokens
7. `processNotificationRetriesJob` (every 5 min): Retry failed notification deliveries (`NotificationDeliveryLog`)
8. `cleanupOldNotificationsJob` (7 AM daily): Remove old notifications based on retention policy
9. `sendNotificationDigestsJob` (hourly): Send batched notification digests based on user preferences
10. `dailyBackupJob` (1 AM daily): Perform database backup to MinIO S3 storage

**Analytics Providers**: Plausible (preferred) and Google Analytics in `src/core/analytics/providers/`.
**Admin Access**: `getDailyStats` query requires `context.user.isAdmin === true`.
**Workspace Analytics**: Per-workspace metrics via `getWorkspaceAnalytics` query (member counts, notifications, activity).

## 🎨 UI Component Guidelines

**ShadCN Integration**: v2.3.0 only (Wasp incompatible with Tailwind v4). Components in `src/components/ui/` with relative imports:
```typescript
// After adding new ShadCN component
import { cn } from "../../lib/utils" // Fix import path
```

**Layout System**: 
- `src/client/App.tsx` handles conditional rendering: admin dashboard vs main app
- Admin routes (`/admin/*`) render `<Outlet />` directly (no NavBar)
- Non-admin pages render NavBar + content with different navigation items (marketing vs demo)
- Auth pages (`/login`, `/signup`) exclude NavBar completely
- All UI pages in `src/client/pages/` with business logic calls to `src/core/`

## 🔧 Development Commands

```bash
# Core development workflow
wasp start db                    # Start PostgreSQL database
wasp start                      # Start dev servers (client + server)
wasp db migrate-dev             # Apply schema changes

# Infrastructure (Docker Compose)
docker-compose up -d             # Start all services (Postgres, Redis, ELK, MinIO)
docker-compose down              # Stop all services
docker-compose logs -f <service> # View logs (elasticsearch, logstash, kibana, etc)
docker-compose ps                # Check service status

# Access infrastructure UIs
# - Kibana (ELK): http://localhost:5601
# - RedisInsight: http://localhost:8001
# - MinIO Console: http://localhost:9001
# - PgAdmin: http://localhost:5050

# Database operations  
wasp db seed                    # Run seed functions (includes seedMockUsers)
wasp db studio                  # Open Prisma Studio

# Dependencies
npm install <package>           # Add dependencies (avoid direct wasp.json edits)

# Deployment (Fly.io)
wasp deploy fly launch <app-name> <region>
wasp deploy fly deploy          # Update existing deployment

# Job debugging
# dailyStatsJob runs hourly; change to "* * * * *" for minute testing
```

## ⚠️ Common Pitfalls

1. **Import Paths**: Never use `@wasp/` prefix in TypeScript files, always `wasp/`
2. **Operations**: List ALL entities used in operation logic in `entities: []` array in main.wasp
3. **Actions**: Call directly with `await`, don't use `useAction` hook by default  
4. **Auth Fields**: Use `getEmail(user)` helpers; direct entity queries don't include identity data
5. **ShadCN**: Only v2.3.0 compatible; fix import paths after adding components (`cn` from "../../lib/utils")
6. **Admin Routes**: Check `context.user.isAdmin` for admin operations (`getDailyStats`, `getPaginatedUsers`)
7. **Payment Status**: Use enum string values ('active', 'trialing', etc), not hardcoded variants
8. **Workspace Isolation**: ALWAYS validate workspace membership via `WorkspaceMember` before operations
9. **WebSocket Auth**: Clients must send `auth` message with `userId` and `workspaceId` before receiving notifications
10. **Soft Deletes**: Check `deletedAt IS NULL` when querying workspaces to exclude garbage-collected ones
11. **i18n**: Use `t('namespace:key')` for translations, namespace defaults to 'common' if omitted
12. **Dynamic Imports**: ❌ NEVER use dynamic imports (`await import()`) in server code - causes Rollup build errors
13. **Redis/ELK**: Check `REDIS_URL` and `ELK_ENABLED` env vars before using infrastructure services
14. **MinIO Storage**: Use presigned URLs from `@aws-sdk/s3-request-presigner` for file uploads, not direct writes

## 🔍 Module Conformity Validation

### Custom Command: `checkprod [module-name]`

**Purpose**: Validate if a new module (Aegis, Eclipse, MITRE, TaskManager, etc) is 100% conforme com o sistema SentinelIQ.

**Usage**:
```
@copilot checkprod taskmanager
@copilot checkprod mymodule
@copilot checkprod newfeature
```

**What This Does**:
1. Loads conformity checklist from `/docs/MODULE-CONFORMITY-VALIDATION-PROMPT.md`
2. Extracts 12-dimensional validation framework
3. Analyzes the specified module against all criteria
4. Reports PASS/FAIL for each dimension
5. Provides remediation steps for any FAIL items

### 12 Conformity Dimensions

When executing `checkprod [module]`, validates:

1. **Database Schema** - Entities, fields, relationships, indices
2. **Wasp Config** - Operations declared, entity lists complete
3. **Backend Operations** - Auth, validation, audit, error handling
4. **Plan Limits** - Integration with Free/Hobby/Pro tiers
5. **Multi-tenancy** - workspaceId isolation, security scoping
6. **Audit Logging** - All mutations logged to AuditLog
7. **Rate Limiting** - Read/mutation/search tiers enforced
8. **Caching** - Redis cache for performance
9. **Real-time Features** - WebSocket + notifications
10. **Background Jobs** - PgBoss scheduled jobs
11. **Frontend Integration** - React patterns, useQuery, error handling
12. **Module Integration** - Links with Aegis/Eclipse/MITRE/Payment

### Expected Output

```
🔍 Module Conformity Validation: [MODULE_NAME]
═══════════════════════════════════════════════════════════════════

Dimension 1  - Database Schema:        ✅ PASS / ❌ FAIL
Dimension 2  - Wasp Configuration:     ✅ PASS / ❌ FAIL
Dimension 3  - Backend Operations:     ✅ PASS / ❌ FAIL
Dimension 4  - Plan Limits:            ✅ PASS / ❌ FAIL
Dimension 5  - Multi-tenancy:          ✅ PASS / ❌ FAIL
Dimension 6  - Audit Logging:          ✅ PASS / ❌ FAIL
Dimension 7  - Rate Limiting:          ✅ PASS / ❌ FAIL
Dimension 8  - Caching:                ✅ PASS / ❌ FAIL
Dimension 9  - Real-time Features:     ✅ PASS / ❌ FAIL
Dimension 10 - Background Jobs:        ✅ PASS / ❌ FAIL
Dimension 11 - Frontend Integration:   ✅ PASS / ❌ FAIL
Dimension 12 - Module Integration:     ✅ PASS / ❌ FAIL

═══════════════════════════════════════════════════════════════════

Final Result: ✅ 100% CONFORME / ❌ NEEDS FIXES

[Detailed findings for each FAIL dimension with remediation steps]
```

### Quick Validation (30 seconds)

For rapid validation without full 12-dimensional check:

```
@copilot checkprod [module] --quick
```

Validates only 4 critical dimensions:
1. workspaceId isolation
2. enforcePlanLimit integration
3. AuditLog integration
4. Frontend pattern compliance

### Remediation Workflow

When `checkprod` reports FAIL items:

1. **Identify specific dimension** that failed
2. **Reference pattern file**: `/src/core/modules/[reference-module]/operations.ts`
3. **Apply correction** following SentinelIQ patterns
4. **Re-run checkprod** to verify fix
5. **Mark as PASS** when dimension corrected

### Example: TaskManager Validation

```
@copilot checkprod taskmanager

[Outputs detailed validation report]

Dimension 4 - Plan Limits: ❌ FAIL
  Issue: enforcePlanLimit not found in createTask operation
  Fix: Add line after workspace validation:
    await enforcePlanLimit(context, workspaceId, 'maxTasksPerMonth');
  Reference: /src/core/modules/aegis/operations.ts (line 45)

Re-run after fix: @copilot checkprod taskmanager
```

### Conformity Checklist Reference

Full checklist available in: `/docs/MODULE-CONFORMITY-VALIDATION-PROMPT.md`

**Quick checklist (one-liner validation)**:
- ✅ workspaceId in all entities
- ✅ workspaceId in all GET queries
- ✅ checkWorkspaceAccess() in all mutations
- ✅ enforcePlanLimit() in all create operations
- ✅ logAction() in all mutations
- ✅ notifyWorkspaceMembers() in important events
- ✅ Rate limiting on critical operations
- ✅ useQuery + await pattern in frontend
- ✅ All operations have entity lists in main.wasp
- ✅ AuditLog + NotificationDeliveryLog integration

**All ✅ = Module is 100% conforme**

### Pattern Reference Files

When implementing new modules, reference these existing patterns:

| Pattern | File | Purpose |
|---------|------|---------|
| Database Schema | `/schema.prisma` | Entity definitions, relationships, indices |
| Operations | `/src/core/modules/aegis/operations.ts` | Backend implementation patterns |
| Plan Limits | `/src/core/payment/planLimits.ts` | Subscription tier enforcement |
| Audit Service | `/src/core/audit/AuditService.ts` | Compliance logging |
| Rate Limiting | `/src/core/mitre/RateLimitService.ts` | Request throttling |
| Caching | `/src/core/mitre/CacheService.ts` | Performance optimization |
| Frontend | `/src/client/pages/app/workspace/` | React component patterns |

### Status Tracking During Implementation

Use this checklist template while building new modules:

```
Module: [NAME]

Schema:        [ ] Complete  [ ] In Progress  [ ] Not Started
main.wasp:     [ ] Complete  [ ] In Progress  [ ] Not Started
Operations:    [ ] Complete  [ ] In Progress  [ ] Not Started
Plan Limits:   [ ] Complete  [ ] In Progress  [ ] Not Started
Multi-tenancy: [ ] Complete  [ ] In Progress  [ ] Not Started
Audit:         [ ] Complete  [ ] In Progress  [ ] Not Started
Rate Limit:    [ ] Complete  [ ] In Progress  [ ] Not Started
Cache:         [ ] Complete  [ ] In Progress  [ ] Not Started
Real-time:     [ ] Complete  [ ] In Progress  [ ] Not Started
Jobs:          [ ] Complete  [ ] In Progress  [ ] Not Started
Frontend:      [ ] Complete  [ ] In Progress  [ ] Not Started
Integration:   [ ] Complete  [ ] In Progress  [ ] Not Started

Final checkprod: [Run when all COMPLETE]
```

### Production Readiness

Module is production-ready when:

✅ `checkprod [module]` returns all 12 dimensions = PASS  
✅ `wasp build` succeeds with 0 errors  
✅ Database migrations applied  
✅ All tests passing  
✅ Code review approved  
✅ Integration tested with other modules  

---

## 📚 References

- **Wasp Docs**: https://wasp.sh/docs (or https://wasp.sh/llms-full.txt for LLM context)
- **OpenSaaS Docs**: https://docs.opensaas.sh (or https://docs.opensaas.sh/llms-full.txt)
- **Existing Rules**: See `.cursor/rules/*.mdc` for detailed patterns and troubleshooting
- **Conformity Prompt**: `/docs/MODULE-CONFORMITY-VALIDATION-PROMPT.md`
- **System Checklist**: `/docs/SYSTEM-CONFORMITY-CHECKLIST.md`
- **Dashboard**: `/docs/SYSTEM-CONFORMITY-DASHBOARD.md`

This codebase follows Wasp's "configuration over code" philosophy - always check `main.wasp` first to understand app structure, then implement features following the established patterns.

---

## 🚀 Quick Start for New Modules

**Step 1: Create database schema**
```bash
# Edit schema.prisma - follow entity pattern from Aegis/Eclipse/MITRE
```

**Step 2: Declare in Wasp**
```bash
# Edit main.wasp - add entities + operations with entity lists
```

**Step 3: Implement operations**
```bash
# Edit src/core/[module]/operations.ts - follow operation pattern
```

**Step 4: Validate conformity**
```bash
# Run: @copilot checkprod [module]
# Fix any FAIL items
# Re-run until all PASS
```

**Step 5: Deploy**
```bash
wasp build
wasp db migrate-dev
wasp start
```

**Checklist complete when**: `checkprod [module]` = ✅ ALL PASS