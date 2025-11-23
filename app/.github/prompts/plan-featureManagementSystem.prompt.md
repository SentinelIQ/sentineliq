# Plan: Sistema de Gerenciamento de Features para Admin

Sistema centralizado de gerenciamento de features que permite controlar, monitorar e configurar todos os módulos (Aegis, Eclipse, MITRE) através de uma interface administrativa unificada, integrado com o sistema de planos e multi-tenancy do SentinelIQ.

## 🏗️ Arquitetura do Sistema Atual

### Módulos Ativos
- **Aegis** - Gerenciamento de incidentes de segurança (Alerts, Incidents, Cases, Evidence, Tasks)
- **Eclipse** - Proteção de marca e monitoramento de PI (Brands, Monitors, Alerts, Infringements)
- **MITRE** - Integração com framework ATT&CK (Tactics, Techniques, TTPs)
- **Core Features** - Workspaces, Users, Notifications, Audit logs

### Arquitetura Multi-Tenant
- Isolamento baseado em workspace através de `workspaceId`
- Tabela de junção `WorkspaceMember` com roles: `OWNER`, `ADMIN`, `MEMBER`
- Soft deletion com campo `deletedAt` para garbage collection
- Controle de features baseado em planos via sistema `enforcePlanLimit`

### Estrutura de Planos
- **Free**: 3 membros, 10 alertas/mês, 2 casos, features básicas
- **Hobby**: 10 membros, 100 alertas/mês, 20 casos, SLA tracking
- **Pro**: Uso ilimitado, integrações avançadas, auditoria 7 anos

## 📋 Fases de Implementação

### Phase 1: Core Infrastructure (Semana 1)

#### 1.1 Database Schema Extension
**Arquivo**: `schema.prisma`

```prisma
model FeatureFlag {
  id            String   @id @default(uuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Feature identification
  key           String   @unique  // e.g., "aegis.sla_tracking"
  name          String             // Human-readable name
  description   String?            // Feature description
  module        String             // "aegis", "eclipse", "mitre", "core"
  category      String             // "security", "analytics", "integration"
  
  // Global feature state
  isGloballyEnabled Boolean @default(true)
  
  // Plan availability
  availableInFree   Boolean @default(false)
  availableInHobby  Boolean @default(true)
  availableInPro    Boolean @default(true)
  
  // Feature metadata
  deprecated        Boolean @default(false)
  deprecationDate   DateTime?
  removalDate       DateTime?
  
  // Workspace overrides
  workspaceOverrides WorkspaceFeatureOverride[]
  
  @@index([module, isGloballyEnabled])
  @@index([key])
}

model WorkspaceFeatureOverride {
  id            String   @id @default(uuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  featureFlagId String
  featureFlag   FeatureFlag @relation(fields: [featureFlagId], references: [id], onDelete: Cascade)
  
  isEnabled     Boolean
  enabledById   String?
  enabledAt     DateTime?
  
  // Override reason/notes
  reason        String?
  
  @@unique([workspaceId, featureFlagId])
  @@index([workspaceId, isEnabled])
}
```

#### 1.2 Feature Management Operations
**Arquivo**: `src/core/features/operations.ts`

```typescript
import { ensureArgsSchemaOrThrowHttpError } from '../../server/validation';
import { createAuditLog } from '../audit/AuditService';
import { checkWorkspaceAccess } from '../workspace/workspaceUtils';
import { HttpError } from 'wasp/server';
import * as z from 'zod';

// Schemas para validação
const updateFeatureFlagSchema = z.object({
  id: z.string().uuid(),
  updates: z.object({
    isGloballyEnabled: z.boolean().optional(),
    availableInFree: z.boolean().optional(),
    availableInHobby: z.boolean().optional(),
    availableInPro: z.boolean().optional(),
    deprecated: z.boolean().optional(),
  })
});

const toggleWorkspaceFeatureSchema = z.object({
  workspaceId: z.string().uuid(),
  featureKey: z.string().min(1),
  enabled: z.boolean(),
  reason: z.string().optional()
});

export const getFeatureFlags: GetFeatureFlags = async (args, context) => {
  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }
  
  return context.entities.FeatureFlag.findMany({
    where: args?.module ? { module: args.module } : undefined,
    include: { 
      workspaceOverrides: { 
        include: { workspace: { select: { id: true, name: true } } }
      } 
    },
    orderBy: [{ module: 'asc' }, { category: 'asc' }, { name: 'asc' }]
  });
};

export const updateFeatureFlag: UpdateFeatureFlag = async (rawArgs, context) => {
  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }
  
  const { id, updates } = ensureArgsSchemaOrThrowHttpError(updateFeatureFlagSchema, rawArgs);
  
  const feature = await context.entities.FeatureFlag.findUnique({
    where: { id }
  });
  
  if (!feature) {
    throw new HttpError(404, 'Feature flag not found');
  }
  
  const updated = await context.entities.FeatureFlag.update({
    where: { id },
    data: updates
  });
  
  // Audit log
  await createAuditLog({
    workspaceId: 'system',
    userId: context.user.id,
    action: 'FEATURE_FLAG_UPDATED',
    resource: 'feature_flag',
    resourceId: id,
    description: `Feature flag ${updated.key} updated`,
    metadata: { previousValues: feature, newValues: updates }
  });
  
  return updated;
};

export const toggleWorkspaceFeature: ToggleWorkspaceFeature = async (rawArgs, context) => {
  const { workspaceId, featureKey, enabled, reason } = ensureArgsSchemaOrThrowHttpError(
    toggleWorkspaceFeatureSchema, 
    rawArgs
  );
  
  await checkWorkspaceAccess(context, workspaceId, ['OWNER', 'ADMIN']);
  
  const feature = await context.entities.FeatureFlag.findUnique({
    where: { key: featureKey }
  });
  
  if (!feature) {
    throw new HttpError(404, 'Feature not found');
  }
  
  if (!feature.isGloballyEnabled) {
    throw new HttpError(403, 'Feature is globally disabled');
  }
  
  // Check plan availability
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId }
  });
  
  const plan = workspace?.subscriptionPlan || 'free';
  const planField = `availableIn${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
  
  if (enabled && !feature[planField]) {
    throw new HttpError(403, `Feature not available in ${plan} plan`);
  }
  
  // Upsert override
  const override = await context.entities.WorkspaceFeatureOverride.upsert({
    where: {
      workspaceId_featureFlagId: {
        workspaceId,
        featureFlagId: feature.id
      }
    },
    create: {
      workspaceId,
      featureFlagId: feature.id,
      isEnabled: enabled,
      enabledById: context.user.id,
      enabledAt: enabled ? new Date() : undefined,
      reason
    },
    update: {
      isEnabled: enabled,
      enabledById: context.user.id,
      enabledAt: enabled ? new Date() : undefined,
      reason
    }
  });
  
  // Audit log
  await createAuditLog({
    workspaceId,
    userId: context.user.id,
    action: enabled ? 'FEATURE_ENABLED' : 'FEATURE_DISABLED',
    resource: 'workspace_feature',
    resourceId: `${workspaceId}:${featureKey}`,
    description: `Feature ${featureKey} ${enabled ? 'enabled' : 'disabled'} for workspace`,
    metadata: { featureKey, reason }
  });
  
  return override;
};
```

#### 1.3 FeatureChecker Utility
**Arquivo**: `src/core/features/FeatureChecker.ts`

```typescript
import { HttpError } from 'wasp/server';

export class FeatureChecker {
  /**
   * Verifica se uma feature está habilitada para um workspace
   */
  static async isEnabled(
    context: any,
    workspaceId: string,
    featureKey: string
  ): Promise<boolean> {
    // Cache key para Redis (implementar depois)
    const cacheKey = `feature:${workspaceId}:${featureKey}`;
    
    // Get feature flag
    const feature = await context.entities.FeatureFlag.findUnique({
      where: { key: featureKey }
    });
    
    if (!feature || !feature.isGloballyEnabled) {
      return false;
    }
    
    // Check workspace override first
    const override = await context.entities.WorkspaceFeatureOverride.findUnique({
      where: {
        workspaceId_featureFlagId: {
          workspaceId,
          featureFlagId: feature.id
        }
      }
    });
    
    if (override) {
      return override.isEnabled;
    }
    
    // Check plan availability
    const workspace = await context.entities.Workspace.findUnique({
      where: { id: workspaceId },
      select: { subscriptionPlan: true }
    });
    
    const plan = workspace?.subscriptionPlan || 'free';
    const planField = `availableIn${plan.charAt(0).toUpperCase() + plan.slice(1)}` as keyof typeof feature;
    
    return Boolean(feature[planField]);
  }
  
  /**
   * Requer que uma feature esteja habilitada, lança erro se não estiver
   */
  static async requireFeature(
    context: any,
    workspaceId: string,
    featureKey: string,
    errorMessage?: string
  ): Promise<void> {
    const enabled = await this.isEnabled(context, workspaceId, featureKey);
    if (!enabled) {
      throw new HttpError(
        403, 
        errorMessage || `Feature '${featureKey}' is not enabled for this workspace`
      );
    }
  }
  
  /**
   * Verifica múltiplas features de uma vez
   */
  static async checkMultiple(
    context: any,
    workspaceId: string,
    featureKeys: string[]
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const key of featureKeys) {
      results[key] = await this.isEnabled(context, workspaceId, key);
    }
    
    return results;
  }
}
```

### Phase 2: Admin Interface (Semana 2)

#### 2.1 Feature Management Page
**Arquivo**: `src/client/pages/admin/features/FeatureManagementPage.tsx`

```tsx
import React, { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getFeatureFlags } from 'wasp/client/operations';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { DefaultLayout } from '../../../layouts/DefaultLayout';
import { useAuth } from 'wasp/auth';

const moduleColors = {
  aegis: 'bg-red-100 text-red-800',
  eclipse: 'bg-blue-100 text-blue-800',
  mitre: 'bg-green-100 text-green-800',
  core: 'bg-gray-100 text-gray-800'
};

const categoryIcons = {
  security: '🛡️',
  analytics: '📊',
  integration: '🔗',
  billing: '💳',
  notification: '🔔'
};

export default function FeatureManagementPage() {
  const { data: user } = useAuth();
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { 
    data: features, 
    isLoading, 
    error 
  } = useQuery(getFeatureFlags, { 
    module: selectedModule === 'all' ? undefined : selectedModule 
  });

  if (!user?.isAdmin) {
    return (
      <DefaultLayout user={user}>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </DefaultLayout>
    );
  }

  const filteredFeatures = features?.filter(feature => 
    selectedCategory === 'all' || feature.category === selectedCategory
  ) || [];

  const moduleStats = features?.reduce((acc, feature) => {
    acc[feature.module] = (acc[feature.module] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <DefaultLayout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Feature Management</h1>
            <p className="text-muted-foreground">
              Control feature availability across modules and workspaces
            </p>
          </div>
          <Button variant="outline">
            Export Configuration
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(moduleStats).map(([module, count]) => (
            <Card key={module}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {module.toUpperCase()}
                    </p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <Badge className={moduleColors[module as keyof typeof moduleColors]}>
                    {count} features
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="aegis">Aegis - Security</SelectItem>
                  <SelectItem value="eclipse">Eclipse - Brand Protection</SelectItem>
                  <SelectItem value="mitre">MITRE ATT&CK</SelectItem>
                  <SelectItem value="core">Core Features</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="security">🛡️ Security</SelectItem>
                  <SelectItem value="analytics">📊 Analytics</SelectItem>
                  <SelectItem value="integration">🔗 Integration</SelectItem>
                  <SelectItem value="billing">💳 Billing</SelectItem>
                  <SelectItem value="notification">🔔 Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Features Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Features ({filteredFeatures.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Plan Availability</TableHead>
                  <TableHead>Global Status</TableHead>
                  <TableHead>Workspace Overrides</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      Loading features...
                    </TableCell>
                  </TableRow>
                )}
                {error && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-red-600">
                      Error loading features: {error.message}
                    </TableCell>
                  </TableRow>
                )}
                {filteredFeatures.map((feature) => (
                  <FeatureRow key={feature.id} feature={feature} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DefaultLayout>
  );
}

function FeatureRow({ feature }: { feature: any }) {
  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium">{feature.name}</p>
          <p className="text-sm text-muted-foreground">{feature.key}</p>
          {feature.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {feature.description}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge className={moduleColors[feature.module as keyof typeof moduleColors]}>
          {feature.module}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-1">
          {categoryIcons[feature.category as keyof typeof categoryIcons]}
          {feature.category}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Badge variant={feature.availableInFree ? 'default' : 'outline'}>
            Free
          </Badge>
          <Badge variant={feature.availableInHobby ? 'default' : 'outline'}>
            Hobby
          </Badge>
          <Badge variant={feature.availableInPro ? 'default' : 'outline'}>
            Pro
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <Switch 
          checked={feature.isGloballyEnabled}
          // onCheckedChange handler será implementado
        />
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {feature.workspaceOverrides?.length || 0} overrides
        </Badge>
      </TableCell>
      <TableCell>
        <Button variant="outline" size="sm">
          Configure
        </Button>
      </TableCell>
    </TableRow>
  );
}
```

### Phase 3: Module Integration (Semana 3)

#### 3.1 Feature Seeds
**Arquivo**: `src/core/features/featureSeeds.ts`

```typescript
export const FEATURE_DEFINITIONS = [
  // AEGIS Security Features
  {
    key: 'aegis.alert_creation',
    name: 'Alert Creation',
    description: 'Create and manage security alerts',
    module: 'aegis',
    category: 'security',
    availableInFree: true,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'aegis.incident_management',
    name: 'Incident Management',
    description: 'Full incident lifecycle management',
    module: 'aegis',
    category: 'security',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'aegis.sla_tracking',
    name: 'SLA Tracking',
    description: 'Track response and resolution SLAs',
    module: 'aegis',
    category: 'analytics',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'aegis.auto_escalation',
    name: 'Auto Escalation',
    description: 'Automatic incident escalation based on rules',
    module: 'aegis',
    category: 'security',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  },
  
  // ECLIPSE Brand Protection Features
  {
    key: 'eclipse.brand_monitoring',
    name: 'Brand Monitoring',
    description: 'Monitor brand mentions and infringements',
    module: 'eclipse',
    category: 'security',
    availableInFree: true,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'eclipse.domain_monitoring',
    name: 'Domain Monitoring',
    description: 'Monitor suspicious domain registrations',
    module: 'eclipse',
    category: 'security',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'eclipse.takedown_automation',
    name: 'Takedown Automation',
    description: 'Automated takedown request processing',
    module: 'eclipse',
    category: 'integration',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  },
  
  // MITRE ATT&CK Features
  {
    key: 'mitre.attack_mapping',
    name: 'ATT&CK Mapping',
    description: 'Map incidents to MITRE ATT&CK framework',
    module: 'mitre',
    category: 'analytics',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'mitre.threat_intelligence',
    name: 'Threat Intelligence',
    description: 'Advanced threat intelligence integration',
    module: 'mitre',
    category: 'integration',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  },
  
  // CORE Features
  {
    key: 'core.advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Comprehensive analytics and reporting',
    module: 'core',
    category: 'analytics',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'core.api_access',
    name: 'API Access',
    description: 'Full REST API access',
    module: 'core',
    category: 'integration',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  }
];

export async function seedFeatureFlags(prisma: any) {
  console.log('🌱 Seeding feature flags...');
  
  for (const feature of FEATURE_DEFINITIONS) {
    await prisma.featureFlag.upsert({
      where: { key: feature.key },
      create: feature,
      update: feature
    });
  }
  
  console.log(`✅ Seeded ${FEATURE_DEFINITIONS.length} feature flags`);
}
```

#### 3.2 Integration with Existing Operations
**Exemplos de integração nos módulos existentes:**

```typescript
// src/core/modules/aegis/operations.ts - Exemplo de integração
import { FeatureChecker } from '../../features/FeatureChecker';

export const createAlert: CreateAlert = async (args, context) => {
  await checkWorkspaceAccess(context, args.workspaceId);
  
  // NEW: Feature gate check
  await FeatureChecker.requireFeature(
    context, 
    args.workspaceId, 
    'aegis.alert_creation'
  );
  
  // Check SLA tracking feature for advanced alert properties
  if (args.slaEnabled) {
    await FeatureChecker.requireFeature(
      context,
      args.workspaceId,
      'aegis.sla_tracking',
      'SLA tracking requires Hobby plan or higher'
    );
  }
  
  // Existing logic...
  await enforcePlanLimit(context, args.workspaceId, 'maxAlertsPerMonth');
  // ... rest of operation
};

export const escalateIncident: EscalateIncident = async (args, context) => {
  await checkWorkspaceAccess(context, args.workspaceId);
  
  if (args.autoEscalation) {
    await FeatureChecker.requireFeature(
      context,
      args.workspaceId,
      'aegis.auto_escalation',
      'Auto-escalation requires Pro plan'
    );
  }
  
  // Existing logic...
};
```

### Phase 4: Advanced Features (Semana 4)

#### 4.1 Feature Usage Analytics
**Arquivo**: `src/core/features/analytics.ts`

```typescript
export interface FeatureUsageMetric {
  featureKey: string;
  workspaceId: string;
  usageCount: number;
  lastUsed: Date;
  period: 'daily' | 'weekly' | 'monthly';
}

export class FeatureAnalytics {
  static async trackUsage(
    context: any,
    workspaceId: string,
    featureKey: string
  ): Promise<void> {
    // Implementar tracking de uso via Redis counter
    // Será usado para analytics e billing futuro
  }
  
  static async getUsageStats(
    context: any,
    workspaceId?: string,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<FeatureUsageMetric[]> {
    // Retornar estatísticas de uso das features
  }
  
  static async getFeatureAdoptionReport(
    context: any
  ): Promise<Record<string, number>> {
    // Relatório de adoção de features por workspace
  }
}
```

#### 4.2 Wasp Configuration
**Adicionar em**: `main.wasp`

```wasp
// Feature management routes
route AdminFeaturesRoute { path: "/admin/features", to: AdminFeaturesPage }
route AdminFeatureDetailsRoute { path: "/admin/features/:id", to: AdminFeatureDetailsPage }

page AdminFeaturesPage {
  authRequired: true,
  component: import AdminFeatures from "@src/client/pages/admin/features/FeatureManagementPage"
}

page AdminFeatureDetailsPage {
  authRequired: true,
  component: import AdminFeatureDetails from "@src/client/pages/admin/features/FeatureDetailsPage"
}

// Queries
query getFeatureFlags {
  fn: import { getFeatureFlags } from "@src/core/features/operations",
  entities: [FeatureFlag, WorkspaceFeatureOverride, Workspace]
}

query getWorkspaceFeatures {
  fn: import { getWorkspaceFeatures } from "@src/core/features/operations",
  entities: [FeatureFlag, WorkspaceFeatureOverride, Workspace]
}

query getFeatureUsageStats {
  fn: import { getFeatureUsageStats } from "@src/core/features/operations",
  entities: [FeatureFlag, Workspace]
}

// Actions
action updateFeatureFlag {
  fn: import { updateFeatureFlag } from "@src/core/features/operations",
  entities: [FeatureFlag, AuditLog]
}

action toggleWorkspaceFeature {
  fn: import { toggleWorkspaceFeature } from "@src/core/features/operations",
  entities: [FeatureFlag, WorkspaceFeatureOverride, Workspace, AuditLog]
}

action bulkUpdateFeatures {
  fn: import { bulkUpdateFeatures } from "@src/core/features/operations",
  entities: [FeatureFlag, WorkspaceFeatureOverride, AuditLog]
}

// Jobs para feature management
job cleanupDeprecatedFeaturesJob {
  executor: PgBoss,
  perform: {
    fn: import { cleanupDeprecatedFeatures } from "@src/core/features/jobs",
  },
  schedule: {
    cron: "0 2 * * *" // 2 AM daily
  },
  entities: [FeatureFlag, WorkspaceFeatureOverride, AuditLog]
}
```

## 🎯 Objetivos e Benefícios

### Objetivos Principais
1. **Centralização**: Gerenciar todas as features dos módulos em uma única interface
2. **Granularidade**: Controle per-workspace e per-plano de assinatura
3. **Auditoria**: Track completo de mudanças de features
4. **Performance**: Cache de feature states para reduzir latência
5. **Escalabilidade**: Suporte a rollout gradual e A/B testing futuro

### Benefícios de Negócio
- **Controle de Receita**: Features premium direcionam upgrades de plano
- **Suporte Técnico**: Debugging facilitado com visibilidade de features ativas
- **Compliance**: Auditoria completa de features críticas de segurança
- **Go-to-Market**: Lançamento controlado de novas features
- **Customer Success**: Ativação seletiva de features para onboarding

## 🔧 Considerações Técnicas

### Performance
- **Cache Redis**: Feature states em cache com TTL de 5 minutos
- **Bulk Operations**: Operações em lote para workspaces múltiplos
- **Índices Database**: Otimização para queries de feature checking

### Segurança
- **Admin Only**: Interface restrita a usuários com `isAdmin: true`
- **Workspace Isolation**: Overrides respeitam isolation de workspace
- **Audit Trail**: Todas as mudanças logadas em `AuditLog`

### Escalabilidade
- **Event-Driven**: Notificações via WebSocket para mudanças críticas
- **Async Processing**: Jobs em background para cleanup e analytics
- **API Ready**: Estrutura preparada para API externa futura

## ✅ Checklist de Implementação

### Database & Backend
- [ ] Adicionar modelos `FeatureFlag` e `WorkspaceFeatureOverride` ao schema
- [ ] Implementar operações CRUD para feature management
- [ ] Criar classe `FeatureChecker` para verificação de features
- [ ] Integrar feature checks em operações existentes dos módulos
- [ ] Implementar job de cleanup de features deprecadas

### Frontend
- [ ] Página principal de feature management com filtros e tabela
- [ ] Modal de configuração detalhada de features
- [ ] Página de override por workspace específico
- [ ] Componentes reutilizáveis para feature toggles
- [ ] Integração com sistema de notificações

### Integration
- [ ] Atualizar todas as operações dos módulos com feature gates
- [ ] Seed script para features iniciais dos módulos existentes
- [ ] Documentação de features por módulo
- [ ] Testes unitários para FeatureChecker
- [ ] Testes de integração para admin interface

### Monitoring & Analytics
- [ ] Dashboard de uso de features
- [ ] Alertas para features críticas desabilitadas
- [ ] Relatórios de adoção de features por plano
- [ ] Métricas de performance de feature checking

## 🚀 Próximos Passos

1. **Validação do Schema**: Review dos modelos de database com equipe
2. **Proof of Concept**: Implementar feature checking em 1-2 operações do Aegis
3. **MVP Admin Interface**: Interface básica para toggle global de features
4. **Integration Testing**: Validar isolamento de workspace e plan limits
5. **Production Deployment**: Rollout gradual com features não-críticas primeiro

## 📚 Referências Técnicas

- **Database Patterns**: Seguir padrão existente de `workspace + member` isolation
- **Operation Patterns**: Usar `checkWorkspaceAccess` e `enforcePlanLimit` existentes  
- **UI Patterns**: ShadCN components como outras páginas admin
- **Audit Integration**: Usar `AuditService` existente para logging
- **Cache Strategy**: Redis patterns similar ao usado em rate limiting

Este plano fornece uma base sólida para implementar um sistema completo de gerenciamento de features que se integra perfeitamente com a arquitetura existente do SentinelIQ, mantendo os padrões de segurança, multi-tenancy e auditoria já estabelecidos.
