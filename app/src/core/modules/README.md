# SentinelIQ Modules Architecture

## Overview

The `src/core/modules/` directory contains all business logic modules organized by domain. Each module is self-contained with its own types, operations (queries/actions), and services.

## Module Structure

```
src/core/modules/
├── aegils/                    # Alert, Engagement, Global Incident & Log Surveillance
│   ├── types.ts              # TypeScript interfaces and enums
│   ├── operations.ts         # Wasp operations (queries, actions) with validation
│   ├── services.ts           # Business logic services
│   └── README.md             # Module-specific documentation
│
└── eclipse/                   # Entity, Compliance, Licenses, Investigation, etc
    ├── types.ts              # TypeScript interfaces and enums
    ├── operations.ts         # Wasp operations (queries, actions) with validation
    ├── services.ts           # Business logic services
    └── README.md             # Module-specific documentation
```

## Design Principles

### 1. **Separation of Concerns**
- **Types** (`types.ts`): Define all TypeScript interfaces and enums
- **Operations** (`operations.ts`): Wasp query/action definitions with validation
- **Services** (`services.ts`): Pure business logic without database access (except through Prisma)

### 2. **Multi-Tenancy**
- All operations verify workspace membership before accessing data
- `workspaceId` is passed as parameter to all queries/actions
- Database queries use workspace filters to ensure isolation

### 3. **Validation**
- All operation inputs validated using Zod schemas
- Use `ensureArgsSchemaOrThrowHttpError` helper function
- Returns `HttpError` with appropriate status codes (401, 403, 400)

### 4. **Frontend Integration**
- Frontend components import from `wasp/client/operations`
- Call operations using `useQuery` (queries) or direct `await` (actions)
- No business logic in frontend components - only UI rendering

## Example: Adding a New Module

### 1. Create Module Directory
```bash
mkdir -p src/core/modules/mymodule
```

### 2. Create `types.ts`
```typescript
export interface MyEntity {
  id: string;
  workspaceId: string;
  name: string;
  // ... other fields
}

export type MyEntityStatus = 'active' | 'inactive';
```

### 3. Create `operations.ts`
```typescript
import { HttpError } from 'wasp/server';
import { prisma } from 'wasp/server';
import type { GetMyEntities } from 'wasp/server/operations';
import type { MyEntity } from './types';

export const getMyEntities: GetMyEntities<{ workspaceId: string }, MyEntity[]> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401, 'Not authorized');

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: args.workspaceId,
      members: { some: { userId: context.user.id } },
    },
  });

  if (!workspace) throw new HttpError(403, 'Not authorized');

  return prisma.myEntity.findMany({
    where: { workspaceId: args.workspaceId },
  });
};
```

### 4. Create `services.ts`
```typescript
export class MyModuleService {
  static async businessLogic(entity: MyEntity): Promise<string> {
    // Pure business logic here
    return `Processed: ${entity.name}`;
  }
}
```

### 5. Register in `main.wasp`
```wasp
query getMyEntities {
  fn: import { getMyEntities } from "@src/core/modules/mymodule/operations",
  entities: [MyEntity]
}
```

## Common Patterns

### Authentication Check
```typescript
if (!context.user) {
  throw new HttpError(401, 'Not authorized');
}
```

### Workspace Authorization
```typescript
const workspace = await prisma.workspace.findFirst({
  where: {
    id: workspaceId,
    members: { some: { userId: context.user.id } },
  },
});

if (!workspace) {
  throw new HttpError(403, 'Not authorized to access this workspace');
}
```

### Input Validation
```typescript
const schema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
});

const args = ensureArgsSchemaOrThrowHttpError(schema, rawArgs);
```

## Frontend Usage

### Query Example
```typescript
import { getMyEntities } from 'wasp/client/operations';

function MyComponent() {
  const { data: entities, isLoading } = useQuery(getMyEntities, {
    workspaceId: currentWorkspaceId,
  });

  if (isLoading) return <div>Loading...</div>;
  
  return <div>{/* Render entities */}</div>;
}
```

### Action Example
```typescript
import { createMyEntity } from 'wasp/client/operations';

async function handleCreate(data) {
  const result = await createMyEntity({
    workspaceId: currentWorkspaceId,
    name: data.name,
  });
  
  console.log('Created:', result);
}
```

## Testing

For each module, create corresponding tests:
```
tests/
├── modules/
│   ├── aegils.test.ts
│   ├── eclipse.test.ts
│   └── mymodule.test.ts
```

## Adding New Operations

1. **Define type** in `types.ts`
2. **Add to Zod schema** in `operations.ts` (if has inputs)
3. **Implement operation function** following naming convention
4. **Register in main.wasp** with all required entities
5. **Add tests** in `tests/modules/`

## Database Entities

When adding a new module, ensure corresponding Prisma schema entities exist in `schema.prisma`:

```prisma
model MyEntity {
  id            String   @id @default(cuid())
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name          String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

**Last Updated**: November 17, 2025  
**Version**: 1.0
