# 🤝 Contributing to SentinelIQ

Thank you for your interest in contributing to SentinelIQ! This guide will help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Module Development](#module-development)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Expected Behavior

- ✅ Use welcoming and inclusive language
- ✅ Be respectful of differing viewpoints
- ✅ Accept constructive criticism gracefully
- ✅ Focus on what is best for the community
- ✅ Show empathy towards other community members

### Unacceptable Behavior

- ❌ Harassment or discriminatory language
- ❌ Trolling or insulting comments
- ❌ Public or private harassment
- ❌ Publishing others' private information
- ❌ Other unprofessional conduct

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 20.x or higher
- **npm**: 10.x or higher
- **Wasp**: 0.15.2
- **PostgreSQL**: 16.x
- **Docker**: For infrastructure services (Redis, ELK, MinIO)

### Initial Setup

1. **Fork the repository**

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/sentineliq.git
cd sentineliq
```

2. **Install dependencies**

```bash
npm install
```

3. **Start infrastructure**

```bash
docker-compose up -d
```

4. **Setup database**

```bash
wasp start db
wasp db migrate-dev
```

5. **Start development server**

```bash
wasp start
```

6. **Access application**

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Kibana: http://localhost:5601
- MinIO: http://localhost:9001

---

## 💻 Development Workflow

### 1. Create a Branch

```bash
git checkout -b <type>/<description>
```

**Branch naming conventions**:
- `feature/*` - New features
- `fix/*` - Bug fixes
- `refactor/*` - Code refactoring
- `docs/*` - Documentation changes
- `test/*` - Test additions/modifications
- `chore/*` - Maintenance tasks

**Examples**:
```bash
git checkout -b feature/add-sso-support
git checkout -b fix/notification-delivery
git checkout -b docs/update-api-guide
```

### 2. Make Changes

Follow the [Coding Standards](#coding-standards) section below.

### 3. Test Your Changes

```bash
# Lint
npm run lint:fix

# Run tests
npm test

# Validate Wasp config
wasp validate

# Check module conformity (if applicable)
@copilot checkprod <module-name>
```

### 4. Commit Changes

Use **Conventional Commits** (see [Commit Guidelines](#commit-guidelines)):

```bash
npm run commit
```

### 5. Push and Create PR

```bash
git push origin <your-branch>
```

Then create a Pull Request on GitHub.

---

## 📐 Coding Standards

### TypeScript

- Use **TypeScript** for all new code
- Enable strict mode
- Avoid `any` type - use proper types or `unknown`
- Use interfaces for object shapes
- Use types for unions/intersections

**Example**:
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

// ❌ Bad
const user: any = { ... };
```

### Wasp Patterns

#### Import Rules

```typescript
// ✅ Correct - Use 'wasp/' prefix
import { User, Workspace } from 'wasp/entities'
import { useQuery } from 'wasp/client/operations'
import { prisma } from 'wasp/server'

// ❌ Wrong - Never use '@wasp/' or '@src/'
import { User } from '@wasp/entities'
import { utils } from '@src/shared/utils'
```

#### Operations

```typescript
// In main.wasp
query getWorkspaces {
  fn: import { getWorkspaces } from "@src/core/workspace/operations",
  entities: [Workspace, WorkspaceMember]
}

// In src/core/workspace/operations.ts
export const getWorkspaces: GetWorkspaces<void, Workspace[]> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  
  return context.entities.Workspace.findMany({
    where: {
      members: { some: { userId: context.user.id } }
    }
  });
}
```

#### Input Validation

Always use **Zod** schemas:

```typescript
import { z } from 'zod';
import { ensureArgsSchemaOrThrowHttpError } from '../../server/validation';

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
});

export const createWorkspace: CreateWorkspace<...> = async (rawArgs, context) => {
  const args = ensureArgsSchemaOrThrowHttpError(createWorkspaceSchema, rawArgs);
  // ... rest of logic
};
```

### React/Frontend

- Use **functional components** with hooks
- Use **useQuery** for data fetching (not useAction for queries)
- Call **actions directly** with await (not useAction by default)
- Follow **ShadCN UI** v2.3.0 patterns
- Use **Tailwind CSS** for styling

**Example**:
```typescript
import { getWorkspaces, createWorkspace } from 'wasp/client/operations';

function WorkspacePage() {
  const { data: workspaces, isLoading } = useQuery(getWorkspaces);
  
  const handleCreate = async (data) => {
    await createWorkspace(data);
    // Optimistic updates if needed
  };
  
  // ... render
}
```

### File Organization

```
src/
├── client/           # Frontend (React)
│   ├── pages/       # UI pages
│   ├── components/  # Shared components
│   └── hooks/       # Custom hooks
├── core/            # Business logic (12 domains)
│   ├── auth/
│   ├── workspace/
│   ├── notifications/
│   └── ...
├── server/          # Infrastructure
│   └── *.ts
└── shared/          # Shared utilities
    └── types/
```

### Naming Conventions

- **Files**: `camelCase.ts` or `PascalCase.tsx` (components)
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces/Types**: `PascalCase`

---

## 📝 Commit Guidelines

We use **Conventional Commits** for automated changelog generation and semantic versioning.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type       | Description                | Example                                    |
| ---------- | -------------------------- | ------------------------------------------ |
| `feat`     | New feature                | `feat(auth): add OAuth2 support`           |
| `fix`      | Bug fix                    | `fix(payment): correct webhook validation` |
| `docs`     | Documentation              | `docs(api): update authentication guide`   |
| `style`    | Formatting changes         | `style(ui): fix button spacing`            |
| `refactor` | Code refactoring           | `refactor(db): extract query logic`        |
| `perf`     | Performance improvement    | `perf(api): optimize database queries`     |
| `test`     | Test additions/changes     | `test(auth): add login flow tests`         |
| `build`    | Build system changes       | `build(deps): upgrade to Wasp 0.15.2`      |
| `ci`       | CI/CD changes              | `ci(github): add security scanning`        |
| `chore`    | Maintenance tasks          | `chore(deps): update dependencies`         |
| `revert`   | Revert previous commit     | `revert: feat(auth): add OAuth2 support`   |

### Scopes

Common scopes: `auth`, `workspace`, `notifications`, `payment`, `analytics`, `audit`, `logs`, `aegis`, `eclipse`, `mitre`, `taskmanager`, `admin`, `ui`, `api`, `db`, `config`, `deploy`

### Breaking Changes

For breaking changes, add `!` after type/scope or add footer:

```
feat(api)!: change authentication response format

BREAKING CHANGE: Authentication endpoint now returns different structure.
Old: { token: string }
New: { accessToken: string, refreshToken: string }
```

### Using Commitizen

**Recommended**: Use interactive tool:

```bash
npm run commit
```

This guides you through creating a proper commit message.

---

## 🔀 Pull Request Process

### Before Creating PR

1. ✅ Rebase/merge latest changes from `main`/`develop`
2. ✅ Run `npm run lint:fix`
3. ✅ Run tests: `npm test`
4. ✅ Validate Wasp: `wasp validate`
5. ✅ Test locally: `wasp start`
6. ✅ Update documentation if needed
7. ✅ Create/update migrations if schema changed

### Creating PR

1. **Push your branch**:
```bash
git push origin <your-branch>
```

2. **Open PR on GitHub** targeting `develop` (or `main`)

3. **Fill out PR template** completely

4. **Link related issues**: Use `Closes #123` or `Fixes #456`

5. **Request review** from maintainers

### PR Requirements

Your PR must:

- ✅ Pass all CI checks (lint, test, build)
- ✅ Have descriptive title and description
- ✅ Follow commit conventions
- ✅ Include tests for new functionality
- ✅ Update documentation if needed
- ✅ Maintain/improve code coverage
- ✅ Get approval from at least 1 maintainer

### Review Process

1. **Automated checks** run (CI pipeline)
2. **Code review** by maintainers
3. **Address feedback** if requested
4. **Approval** and merge by maintainer

### After Merge

- Branch will be automatically deleted
- Staging deployment will trigger (if merged to `main`)
- Your contribution will appear in next release's CHANGELOG

---

## 🧪 Testing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Specific test file
npm test -- src/core/auth/operations.test.ts
```

### Writing Tests

**Example unit test**:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createWorkspace } from './operations';

describe('createWorkspace', () => {
  it('should create workspace with valid data', async () => {
    const context = {
      user: { id: 'user-123' },
      entities: {
        Workspace: {
          create: vi.fn().mockResolvedValue({ id: 'ws-123', name: 'Test' })
        }
      }
    };
    
    const result = await createWorkspace(
      { name: 'Test Workspace', slug: 'test-workspace' },
      context
    );
    
    expect(result.id).toBe('ws-123');
    expect(context.entities.Workspace.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Test Workspace',
        slug: 'test-workspace'
      })
    });
  });
  
  it('should throw 401 if user not authenticated', async () => {
    const context = { user: null, entities: {} };
    
    await expect(
      createWorkspace({ name: 'Test' }, context)
    ).rejects.toThrow('Not authorized');
  });
});
```

### Test Coverage Goals

- **Minimum**: 70% overall coverage
- **Target**: 80%+ for critical paths
- **Critical modules**: 90%+ (auth, payment, workspace)

---

## 🔧 Module Development

When creating new modules, follow SentinelIQ patterns:

### Module Conformity Checklist

Use `checkprod` command to validate:

```bash
@copilot checkprod <module-name>
```

Must pass all 12 dimensions:

1. ✅ **Database Schema** - Entities, relationships, indices
2. ✅ **Wasp Config** - Operations, entities listed
3. ✅ **Backend Operations** - Auth, validation, error handling
4. ✅ **Plan Limits** - Integration with subscription tiers
5. ✅ **Multi-tenancy** - workspaceId isolation
6. ✅ **Audit Logging** - All mutations logged
7. ✅ **Rate Limiting** - Tiers enforced
8. ✅ **Caching** - Redis integration
9. ✅ **Real-time** - WebSocket + notifications
10. ✅ **Background Jobs** - PgBoss scheduled jobs
11. ✅ **Frontend** - React patterns, error handling
12. ✅ **Integration** - Links with other modules

### Module Structure

```
src/core/<module>/
├── operations.ts         # Backend operations
├── services.ts          # Business logic services
├── types.ts             # TypeScript types
└── utils.ts             # Helper functions

src/client/pages/<module>/
├── <Module>Page.tsx     # Main page component
├── components/          # Feature components
└── hooks/              # Custom hooks
```

### Required Patterns

#### 1. Workspace Isolation

```typescript
// Always validate workspace membership
const workspace = await context.entities.Workspace.findUnique({
  where: { id: workspaceId },
  include: { members: true }
});

if (!workspace.members.some(m => m.userId === context.user.id)) {
  throw new HttpError(403, 'Not authorized');
}
```

#### 2. Plan Limits

```typescript
import { enforcePlanLimit } from '../payment/planLimits';

await enforcePlanLimit(context, workspaceId, 'maxTasksPerMonth');
```

#### 3. Audit Logging

```typescript
import { logAction } from '../audit/AuditService';

await logAction(context, {
  workspaceId,
  action: 'task.created',
  entityType: 'Task',
  entityId: task.id,
  metadata: { taskName: task.name }
});
```

---

## 🔍 Getting Help

- **Documentation**: Check `/docs` directory
- **Issues**: Search existing issues first
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord (link in README)

---

## 🎉 Recognition

Contributors will be:

- ✅ Listed in CHANGELOG for their contributions
- ✅ Added to CONTRIBUTORS.md
- ✅ Mentioned in release notes (for significant contributions)
- ✅ Invited to contributor Discord channel

---

## 📚 Additional Resources

- [Wasp Documentation](https://wasp.sh/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)

---

Thank you for contributing to SentinelIQ! 🚀

**Questions?** Open an issue with the `question` label.

---

**Last Updated**: 2025-11-23  
**Version**: 1.0.0
