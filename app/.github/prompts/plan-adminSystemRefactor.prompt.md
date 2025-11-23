# Plan: Admin System - Remover Mocks e Implementar Gerenciamento Global Completo

Transformar o painel admin do SentinelIQ de um sistema parcialmente implementado com páginas demo em um **centro de controle global 100% funcional** para gerenciar toda a plataforma - usuários, workspaces, pagamentos, módulos de segurança, sistema, compliance e infraestrutura.

## ⚠️ PRINCÍPIO FUNDAMENTAL: ZERO TOLERÂNCIA PARA CÓDIGO NÃO-FUNCIONAL

**Regra Absoluta:** Todo código admin deve ser 100% implementado e funcional. 

**PROIBIDO:**
- ❌ Mock data
- ❌ Hardcoded values (exceto constants legítimas)
- ❌ Placeholder text do tipo "Coming soon", "TODO", "Demo"
- ❌ Páginas showcase/demo/example
- ❌ Commented out code "para implementar depois"
- ❌ Features parcialmente implementadas
- ❌ UI components sem backend integration
- ❌ Fake/dummy/test data em produção

**MANDATÓRIO:**
- ✅ Toda UI conectada a operações reais
- ✅ Toda operação testada e funcional
- ✅ Dados sempre da database/API real
- ✅ Error handling completo
- ✅ Loading states implementados
- ✅ Empty states com ações úteis
- ✅ Delete código legado imediatamente

**Política de Implementação:**
1. **Se não pode ser implementado agora → NÃO ADICIONE ao admin**
2. **Se encontrar código mock/demo → DELETE imediatamente**
3. **Se feature está pela metade → Complete ou remova completamente**
4. **Cada PR deve ser production-ready, não "work in progress"**

## Steps

### 1. DELETAR TODAS páginas demo/mock/showcase (IMEDIATO)

**AÇÃO OBRIGATÓRIA - DELETE COMPLETO:**

1. **`src/client/pages/admin/elements/settings/AdminSettingsPage.tsx`** 
   - ❌ DELETE arquivo completo (100% hardcoded mock data)
   - ❌ DELETE rota `AdminSettingsRoute` de `main.wasp`
   - ❌ REMOVE import/link do `Sidebar.tsx`
   - **Razão:** Página demo pura sem função real. Se settings for necessário, criar nova página funcional depois.

2. **`src/client/pages/admin/elements/calendar/AdminCalendarPage.tsx`**
   - ❌ DELETE arquivo completo (eventos estáticos fake)
   - ❌ DELETE rota `AdminCalendarRoute` de `main.wasp`
   - ❌ REMOVE import/link do `Sidebar.tsx`
   - **Razão:** Calendar demo sem integração real. Se precisar de timeline, criar com dados reais (jobs, incidents).

3. **`src/client/pages/admin/elements/ui-elements/AdminUIButtonsPage.tsx`**
   - ❌ DELETE arquivo completo (showcase de componentes)
   - ❌ DELETE rota `AdminUIButtonsRoute` de `main.wasp`
   - ❌ REMOVE toda seção "Extra Components" do `Sidebar.tsx`
   - **Razão:** Showcase não pertence ao admin funcional. Criar Storybook se precisar documentar componentes.

4. **`src/client/pages/admin/elements/` directory**
   - ❌ DELETE diretório inteiro após remover arquivos acima
   - **Razão:** Não deve existir seção "elements" em admin - tudo deve ser funcional

**SUBSTITUIR mocks por implementação real:**

5. **`src/client/pages/admin/features/FeatureManagementPage.tsx`** (linhas 60-63)
   - ❌ REMOVE hardcoded workspace array:
   ```typescript
   const workspaces = [
     { id: '1', name: 'Demo Workspace', plan: 'free' },
     { id: '2', name: 'Production Workspace', plan: 'pro' },
     { id: '3', name: 'Enterprise Workspace', plan: 'hobby' },
   ];
   ```
   - ✅ IMPLEMENTAR query `getAllWorkspaces` em `src/core/workspace/operations.ts`
   - ✅ CONECTAR ao `useQuery(getAllWorkspaces)`
   - ✅ ADICIONAR loading state, error handling, empty state

6. **`src/client/pages/admin/dashboards/analytics/AnalyticsDashboardPage.tsx`**
   - ❌ IDENTIFICAR e REMOVER qualquer contador hardcoded ou mock data
   - ✅ IMPLEMENTAR queries reais: `getWorkspaceCount`, `getSystemLogCount`, `getNotificationCount`, `getActiveUsersCount`
   - ✅ CONECTAR cada card a dados reais da database
   - ✅ Se métrica não existe ainda, NÃO MOSTRAR o card (remover do UI)

**VERIFICAÇÃO OBRIGATÓRIA após Step 1:**
- ✅ Zero arquivos com "demo", "mock", "example", "showcase" no path
- ✅ Zero hardcoded arrays de dados fake
- ✅ Todas queries retornam dados reais da database
- ✅ `git grep -i "mock\|demo\|fake\|dummy\|placeholder\|todo\|coming soon" src/client/pages/admin/` retorna ZERO resultados

### 2. Workspace Management Dashboard

Criar nova página `/admin/workspaces` com gerenciamento completo de workspaces.

**Operações a criar em `src/core/workspace/operations.ts`:**
- `getAllWorkspaces` - Lista todos workspaces do sistema (admin-only)
- `suspendWorkspace` - Suspende/ativa workspace
- `getWorkspaceDetails` - Detalhes completos com membros, billing, usage
- `updateWorkspaceQuotas` - Ajusta storage/member quotas

**UI Features:**
- Tabela com: nome, plano, status, membros count, storage usado/total, notificações, billing status
- Ações: suspender/ativar, ajustar quotas, view details
- Drill-down: membros, atividades, audit logs do workspace
- Filtros: por plano, status, range de membros, storage usage
- Search: por workspace name

**Entities usadas:** Workspace, WorkspaceMember, WorkspaceInvitation, WorkspaceFeatureOverride

### 3. Enhanced User Management

Expandir `src/client/pages/admin/dashboards/users/AdminUsersPage.tsx` com mais capacidades.

**Operações a criar em `src/core/user/operations.ts`:**
- `suspendUser` - Suspende/ativa usuário (bloqueia login)
- `resetUser2FA` - Remove 2FA do usuário (emergência)
- `resetUserPassword` - Force password reset no próximo login
- `getUserWorkspaces` - Lista workspaces do usuário
- `getUserActivity` - Últimas ações do usuário (audit logs)
- `deleteUserCascade` - Deleta usuário com confirmação e cascade

**UI Enhancements:**
- Nova coluna: Status (ativo/suspenso/pendente)
- Ações por usuário: suspend/activate, reset 2FA, reset password, delete
- Drill-down modal: workspaces do usuário, recent activity, audit logs
- Filtros adicionais: by status, by 2FA enabled, by last login date
- Bulk actions: suspend múltiplos usuários

**Entities usadas:** User, WorkspaceMember, AuditLog, RefreshToken, TwoFactorAuth

### 4. Payment & Billing Admin Interface

Criar `/admin/billing` com visão completa de pagamentos e assinaturas.

**Operações a criar em `src/core/payment/operations.ts`:**
- `getAllSubscriptions` - Lista todas assinaturas por workspace
- `getPaymentHistory` - Histórico de payments com filtros
- `processRefund` - Processa refund no Stripe
- `overrideSubscription` - Admin override de plano (trial extension, upgrade grátis)
- `getFailedPayments` - Lista pagamentos falhados com retry info

**UI Features:**
- Dashboard cards: Receita Total, MRR, Churn Rate, Conversão Free→Paid
- Tabela subscriptions: workspace, plano atual, status, próximo billing, MRR
- Histórico de pagamentos: data, workspace, valor, status, invoice link
- Failed payments: workspace, erro, tentativas, ação de retry manual
- Ações: processar refund, override plano, cancel subscription
- Charts: receita over time, distribuição por plano

**Entities usadas:** Workspace (subscription fields), DailyStats

### 5. System Health & Infrastructure Dashboard

Criar `/admin/system` com monitoramento de infraestrutura.

**Operações a criar em `src/core/system/operations.ts`:**
- `getSystemHealth` - Status de todos serviços (Postgres, Redis, MinIO, ELK)
- `getDatabaseMetrics` - Connection pool, query performance, slow queries
- `getInfrastructureStatus` - Disk space, memory, CPU (via Docker stats)
- `getAPIMetrics` - Response times, error rates, endpoint stats

**UI Features:**
- Status cards: Database (green/yellow/red), Redis, MinIO, ELK, API
- Metrics: CPU usage, Memory usage, Disk space, Connection pool
- Real-time: API response time graph, error rate graph
- Slow queries table: query, duration, calls count
- Alertas automáticos: connection pool exhaustion, disk space > 80%, error rate > 5%
- Actions: clear Redis cache, test connections, restart services

**Integração:**
- Redis: use `src/server/redis.ts` client
- Prisma: use `$queryRaw` para metrics
- MinIO: use S3 client para storage stats
- ELK: HTTP calls para Elasticsearch API
- Docker: `docker stats` command parsing

### 6. Audit Log Viewer UI & Compliance

Criar `/admin/audit` usando operações existentes.

**Operações existentes em `src/core/audit/operations.ts`:**
- ✅ `getAuditLogs` - já existe
- ✅ `getAuditLogsByResource` - já existe
- ✅ `exportAuditLogs` - já existe

**UI Features:**
- Tabela principal: timestamp, user, workspace, action, resourceType, resourceId
- Filtros: por action (CREATE/UPDATE/DELETE/ACCESS), resourceType, user, workspace, date range
- Search: por resourceId ou metadata fields
- Drill-down: click para ver full metadata JSON
- Timeline view: visualização cronológica de eventos
- Export: botão para CSV/JSON (usa `exportAuditLogs`)
- Compliance reports: templates pré-configurados (LGPD, SOC2)

**Entities usadas:** AuditLog

### 7. Module Administration Hub

Criar `/admin/modules` com sub-páginas para Aegis/Eclipse/MITRE.

**Operações a criar:**
- `src/core/modules/aegis/operations.ts`: `getAegisUsageStats`, `getAegisErrorRates`
- `src/core/modules/eclipse/operations.ts`: `getEclipseUsageStats`, `getEclipseWorkspaceUsage`
- `src/core/modules/mitre/operations.ts`: `getMitreUsageStats`, `getMitreTTPStats`
- Shared: `overrideModuleFeature` - admin pode desabilitar feature específica para workspace

**UI Features:**
- Dashboard overview: usage por módulo, error rates, feature adoption
- Tab por módulo:
  - **Aegis:** Assets count, vulnerabilities detected, scans performed, top workspaces
  - **Eclipse:** Alerts count, integrations ativas, correlation rules, response time
  - **MITRE:** TTPs tracked, detections count, top TTPs, coverage por tactic
- Workspace breakdown: qual workspace usa mais cada módulo
- Admin actions: disable feature for workspace (emergency killswitch)
- Error analysis: top errors por módulo com stack traces

**Entities usadas:** Asset, Vulnerability, Alert, Correlation, MitreTTP, AuditLog

### 8. Enhanced Job Management

Expandir `AdminJobsPage.tsx` com controle completo de jobs.

**Operações a adicionar em `src/core/jobs/operations.ts`:**
- ✅ `getJobStats` - já existe
- ✅ `getJobExecutionHistory` - já existe
- ✅ `triggerJob` - já existe
- **Novas:**
- `pauseJob` - Pausa job schedulado
- `resumeJob` - Resume job pausado
- `updateJobSchedule` - Modifica cron schedule
- `getJobErrors` - Lista erros com stack traces
- `getDeadLetterQueue` - Jobs failed persistentemente
- `retryDeadLetterJob` - Retry manual de job failed

**UI Enhancements:**
- Status badges: running/paused/failed
- Actions por job: pause/resume, modify schedule, view errors, retry
- Error analysis tab: job name, error message, stack trace, timestamp, retry count
- DLQ viewer: jobs que falharam múltiplas vezes, com retry manual
- Schedule editor: modal para modificar cron expression com validation
- Execution history: expandir para mostrar duration, success rate, trend

**Entities usadas:** SystemLog (job logs)

### 9. Notification System Admin

Criar `/admin/notifications` com gerenciamento global de notificações.

**Operações a criar em `src/core/notifications/operations.ts`:**
- `getAllNotifications` - Lista notificações de todos workspaces (admin-only)
- `getNotificationDeliveryStatus` - Status de entrega agregado
- `retryFailedNotifications` - Retry em massa de notificações failed
- `getNotificationStats` - Estatísticas agregadas (sent/failed/pending/read rates)

**UI Features:**
- Dashboard: Total sent, Delivery rate, Failed rate, Avg read time
- Tabela de notificações: workspace, user, type, status (sent/failed/pending), timestamp, read
- Filtros: por status, type, workspace, date range
- Failed notifications: lista com erro message, retry count, manual retry action
- Delivery log viewer: click para ver full NotificationDeliveryLog
- Bulk actions: retry all failed, mark all as read
- Real-time: WebSocket integration para live notification tracking

**Entities usadas:** Notification, NotificationDeliveryLog

### 10. Security & Compliance Monitoring

Criar `/admin/security` com monitoramento de segurança.

**Operações a criar em `src/core/security/operations.ts`:**
- `getFailedLogins` - Tentativas de login falhadas (via AuditLog)
- `getIPWhitelistViolations` - Acessos bloqueados por IP
- `get2FAAdoptionRate` - % usuários com 2FA por workspace
- `getActiveSessions` - Sessões ativas no sistema
- `revokeSession` - Revoke refresh token específico
- `getSecurityIncidents` - Eventos de segurança críticos

**UI Features:**
- Security score card: Failed logins (24h), IP violations, 2FA adoption rate, Active sessions
- Failed logins table: user email, IP, timestamp, reason, location (via IP geolocation)
- IP violations: IP address, attempted user, blocked reason, timestamp
- 2FA adoption: por workspace com % e trend, drill-down em users sem 2FA
- Active sessions: user, device, IP, location, last activity, revoke action
- Security timeline: eventos de segurança em chronological order
- Alerts: configurar thresholds para auto-alert (ex: 10+ failed logins de mesmo IP)

**Entities usadas:** AuditLog, RefreshToken, TwoFactorAuth, IPWhitelist

### 11. Unified Admin Navigation & Home - 100% Funcional

Refatorar `src/client/pages/admin/layout/Sidebar.tsx` com nova organização **APENAS com páginas implementadas**.

**Nova estrutura de menu (SOMENTE features funcionais):**

```
📊 Core Management
  - Dashboard (✅ implementado)
  - Users (✅ implementado + melhorias)
  - Workspaces (🔨 novo - implementar completo)

⚙️ System
  - Jobs (✅ implementado + melhorias)
  - System Logs (✅ implementado)
  - Database (✅ implementado)
  - System Health (🔨 novo - implementar completo)

💰 Business
  - Billing & Payments (🔨 novo - implementar completo)
  - Analytics (✅ implementado - remover mocks)
  - Notifications (🔨 novo - implementar completo)
  - Contact Messages (✅ implementado)

🔒 Security & Compliance
  - Audit Logs (🔨 novo UI - operations existem)
  - Security Monitoring (🔨 novo - implementar completo)

🛡️ Security Modules
  - Aegis (🔨 novo - implementar completo)
  - Eclipse (🔨 novo - implementar completo)
  - MITRE ATT&CK (🔨 novo - implementar completo)

⚡ Features
  - Feature Flags (✅ implementado - remover mock workspaces)
```

**Ações OBRIGATÓRIAS:**
1. ❌ **DELETE seção "Extra Components" COMPLETA** (Calendar, Settings, UI Elements)
2. ❌ **NÃO ADICIONAR menu item se página não existe**
3. ✅ **Implementar badges de alerta FUNCIONAIS** (queries reais: failed jobs count, failed payments count, security incidents count)
4. ✅ **Collapse/expand por seção** (state no localStorage)
5. ✅ **Highlight current route** (active state real)
6. ✅ **Quick actions no header FUNCIONAIS:** refresh data (refetch queries), notification center (real notifications), profile dropdown (real user data)

**REGRA DE OURO para menu:**
```typescript
// ❌ ERRADO - adicionar item sem implementação
{ path: '/admin/new-feature', label: 'New Feature', icon: Icon } // página não existe

// ✅ CORRETO - só adiciona se implementado
// 1. Implementa página + operations
// 2. Testa funcionamento completo
// 3. SÓ ENTÃO adiciona ao menu
```

**Badges DEVEM ser funcionais:**
```typescript
// ❌ ERRADO
const failedJobsCount = 5; // hardcoded

// ✅ CORRETO
const { data: failedJobs } = useQuery(getFailedJobsCount);
const count = failedJobs?.count || 0;
```

### 12. Admin Analytics Consolidation - APENAS Dados Reais

Transformar `AnalyticsDashboardPage.tsx` em dashboard 100% funcional **sem um único dado mock**.

**IMPLEMENTAR queries COMPLETAS:**
- ✅ `getDailyStats` - já conectado (verificar se retorna dados reais)
- 🔨 **CRIAR e IMPLEMENTAR:**
  - `getWorkspaceCount` - total workspaces, by plan (count real da DB)
  - `getSystemLogCount` - logs por level (count real da SystemLog)
  - `getNotificationCount` - notifications sent/failed (count real da Notification)
  - `getActiveUsersCount` - usuários ativos logged in last 7d (query real com date filter)

**UI - SOMENTE com dados reais:**
- ✅ Cards FUNCIONAIS (se query não existe, NÃO MOSTRAR o card):
  - Total Users (✅ from DailyStats - verificar se é real)
  - Total Workspaces (🔨 implementar getWorkspaceCount primeiro)
  - MRR (✅ from DailyStats - verificar cálculo)
  - System Health Score (🔨 implementar getSystemHealth primeiro)
- ✅ Trend charts com dados históricos REAIS:
  - Revenue trend (query DailyStats com range 7d/30d/90d)
  - User growth (query DailyStats histórico)
  - Workspace growth (query com createdAt groupBy)
  - Error rate trend (query SystemLog com level='error' groupBy date)
- ✅ Breakdown por plano: pie chart (query real: `SELECT subscriptionPlan, COUNT(*) FROM Workspace GROUP BY subscriptionPlan`)
- ✅ Quick links funcionais: click card → navigate to real page
- ✅ Real-time updates: useQuery com refetchInterval: 60000

**DELETE IMEDIATAMENTE:**
- ❌ Mock data de "visitor insights" - DELETE card completo se não tiver dados reais
- ❌ Mock data de "device breakdown" - DELETE card completo se não tiver dados reais
- ❌ Qualquer contador hardcoded - DELETE ou conecte a query real
- ❌ Qualquer `const mockData = [...]` - DELETE tudo
- ❌ Qualquer comentário "// Using mock data" - DELETE o código

**VERIFICAÇÃO ANTES DE COMMIT:**
```bash
# DEVE retornar ZERO resultados:
git grep -i "mock\|fake\|dummy\|placeholder\|hardcoded.*data" src/client/pages/admin/dashboards/analytics/

# Cada card DEVE ter:
# 1. useQuery() com operation real
# 2. isLoading state
# 3. error handling
# 4. Empty state SE não houver dados (não mock fallback)
```

**REGRA: Se métrica não pode ser calculada com dados reais agora:**
1. ❌ NÃO adicione o card com mock
2. ❌ NÃO adicione "Coming soon"
3. ✅ Simplesmente NÃO MOSTRE o card
4. ✅ Adicione card só depois de implementar query completa

## Further Considerations

### 1. Política ZERO TOLERÂNCIA para Código Não-Funcional

**DECISÃO FINAL - NÃO É RECOMENDAÇÃO, É OBRIGAÇÃO:**

**Demo Pages (Settings/Calendar):**
- ❌ **Opção A REJEITADA** - Não implementar "depois". Se não implementa agora, não existe.
- ❌ **Opção C REJEITADA** - Showcase não pertence ao admin de produção.
- ✅ **Opção B MANDATÓRIA** - DELETE IMEDIATO E COMPLETO.

**Ação Imediata:**
```bash
# DELETE arquivos
rm -rf src/client/pages/admin/elements/settings/
rm -rf src/client/pages/admin/elements/calendar/
rm -rf src/client/pages/admin/elements/ui-elements/
rm -rf src/client/pages/admin/elements/

# REMOVER rotas do main.wasp
# DELETE: AdminSettingsRoute, AdminCalendarRoute, AdminUIButtonsRoute

# LIMPAR Sidebar.tsx
# DELETE: toda seção "Extra Components"
```

**Regra para TODAS as features futuras:**
- Se alguém propor "vamos adicionar um placeholder/demo para ver o layout"
- **RESPOSTA:** NÃO. Crie com dados reais ou não crie.
- Se alguém propor "vamos deixar comentado para implementar depois"
- **RESPOSTA:** NÃO. Implemente agora ou crie issue/ticket separado. Não commite código morto.

**Code Review Checklist - BLOQUEAR PR se:**
- ❌ Encontrar `// TODO:` em código de produção
- ❌ Encontrar arrays hardcoded de dados fake
- ❌ Encontrar comentário "mock data" ou "to be implemented"
- ❌ Encontrar feature flag que sempre retorna true/false sem lógica
- ❌ Encontrar UI component sem backend integration
- ❌ Encontrar função vazia ou que retorna empty array hardcoded

### 2. Authorization Consistency

**Problema atual:** Jobs operations usam `ADMIN_EMAILS` env var, outros usam `context.user.isAdmin`.

**Solução:**
- Padronizar TODAS operações admin para `context.user.isAdmin`
- Atualizar `src/core/jobs/operations.ts`:
  ```typescript
  // Antes:
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const isAdmin = adminEmails.includes(context.user.identities.email.id);
  
  // Depois:
  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }
  ```
- Remover dependência de `ADMIN_EMAILS` do `.env`

### 3. Real-time Admin Updates

**Integração WebSocket:**
- Usar WebSocket existente (`src/server/notificationWebSocket.ts`)
- Adicionar admin event channel: `admin:events`
- Eventos a emitir:
  - `user:signup` - novo usuário registrado
  - `payment:failed` - pagamento falhou
  - `system:alert` - alerta de sistema (disk space, error rate)
  - `job:failed` - job failed
  - `security:incident` - evento de segurança

**UI Integration:**
- Toast notifications no admin header
- Badge count em menu items (ex: "Security (3)" se 3 incidents)
- Auto-refresh de tabelas quando evento relevante ocorre

### 4. Admin Audit Trail

**Compliance requirement:**
- TODAS ações admin devem logar em `AuditLog`
- `action: 'ADMIN_ACTION'`
- Metadata detalhado: qual ação, em qual recurso, valores antes/depois

**Exemplos:**
```typescript
// Ao suspender usuário:
await logAction(context, 'ADMIN_SUSPEND_USER', 'User', userId, {
  adminId: context.user.id,
  reason: 'Terms violation',
  previousStatus: 'active',
  newStatus: 'suspended',
});

// Ao fazer refund:
await logAction(context, 'ADMIN_REFUND', 'Payment', paymentId, {
  adminId: context.user.id,
  amount: refundAmount,
  reason: reason,
  workspaceId: workspaceId,
});
```

**Compliance reporting:**
- Audit log viewer deve ter filtro `action = 'ADMIN_ACTION'`
- Export para auditores externos
- Retention policy: admin actions nunca são deletadas (exclude from cleanup job)

### 5. Performance Optimization

**Database indices necessários (adicionar ao `schema.prisma`):**
```prisma
model Workspace {
  // ... existing fields
  @@index([subscriptionStatus])
  @@index([deletedAt])
  @@index([subscriptionPlan])
}

model User {
  // ... existing fields
  @@index([isAdmin])
  @@index([createdAt])
}

model AuditLog {
  // ... existing fields
  @@index([action])
  @@index([resourceType])
  @@index([userId])
  @@index([workspaceId])
  @@index([timestamp])
}

model SystemLog {
  // ... existing fields
  @@index([level])
  @@index([component])
  @@index([timestamp])
}

model Notification {
  // ... existing fields
  @@index([workspaceId])
  @@index([createdAt])
  @@index([isRead])
}
```

**Pagination pattern:**
- Todas listagens devem usar skip/take
- Default pageSize: 20 items
- Max pageSize: 100 items
- Retornar total count para pagination UI

**Caching strategy:**
- Dashboard stats: cache Redis por 5 minutos
- System health: cache por 30 segundos
- User/workspace lists: no cache (always fresh)

### 6. Search & Filters

**Pattern consistente em todas tabelas admin:**

```typescript
// Backend operation
interface ListFilters {
  search?: string;        // text search (name, email)
  status?: string;        // enum filter
  plan?: string;          // enum filter
  dateFrom?: Date;        // date range
  dateTo?: Date;
  skip?: number;          // pagination
  take?: number;
}

// Frontend component
const [filters, setFilters] = useState<ListFilters>({});
const debouncedSearch = useDebounce(filters.search, 500);

const { data, isLoading } = useQuery(operation, {
  ...filters,
  search: debouncedSearch,
});
```

**UI Components:**
- Search input com debounce (useDebounce hook)
- Filter dropdowns (ShadCN Select)
- Date range picker (ShadCN DateRangePicker)
- Clear filters button
- Active filters badges
- Results count: "Showing 20 of 156 results"

### 7. Error Handling & User Feedback

**Pattern para todas operações admin:**

```typescript
// Frontend
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  try {
    setIsLoading(true);
    setError(null);
    await operation(args);
    toast.success('Action completed successfully');
    refetch(); // Refresh data
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setError(message);
    toast.error(message);
  } finally {
    setIsLoading(false);
  }
};
```

**Confirmation dialogs:**
- Ações destrutivas (delete, suspend) requerem confirmação
- ShadCN AlertDialog com descrição do impacto
- "Type workspace name to confirm" para ações críticas

### 8. Mobile Responsiveness

**Admin pages devem ser responsivos:**
- Sidebar collapse em mobile (hamburger menu)
- Tables com horizontal scroll em mobile
- Cards stack verticalmente
- Filtros collapse em accordion
- Touch-friendly buttons (min 44px height)

### 9. Internationalization

**Admin namespace em i18n:**
- Criar `src/client/i18n/locales/pt/admin.json`
- Criar `src/client/i18n/locales/en/admin.json`
- Traduzir todos labels, mensagens, tooltips
- Usar `t('admin:key')` em componentes

### 10. Documentation

**Adicionar documentação:**
- `/docs/admin/README.md` - Overview do sistema admin
- `/docs/admin/OPERATIONS.md` - Lista de todas operações com exemplos
- `/docs/admin/PAGES.md` - Descrição de cada página admin
- `/docs/admin/DEVELOPMENT.md` - Como adicionar nova página/operação admin

**Inline comments:**
- Todas operações admin com JSDoc
- Explicar business logic complexa
- Linkar para compliance requirements quando relevante

## Implementation Priority - Cada Feature 100% Funcional ou Não Existe

### Phase 1 - DELETAR LEGADO & Foundation (Week 1) - BLOQUEADOR
**NADA pode avançar antes de completar Phase 1 100%**

1. 🔴 **CRÍTICO - DELETE COMPLETO de código legado:**
   - ❌ DELETE `src/client/pages/admin/elements/` directory inteiro
   - ❌ DELETE rotas `AdminSettingsRoute`, `AdminCalendarRoute`, `AdminUIButtonsRoute` de `main.wasp`
   - ❌ DELETE seção "Extra Components" de `Sidebar.tsx`
   - ✅ VERIFICAR: `find src/client/pages/admin/ -type f -exec grep -l "mock\|demo\|fake\|dummy" {} \;` = ZERO results

2. 🔴 **CRÍTICO - Substituir TODOS mocks por implementação real:**
   - ✅ Implementar `getAllWorkspaces` operation (backend)
   - ✅ Conectar `FeatureManagementPage.tsx` a query real (remover array hardcoded)
   - ✅ Implementar `getWorkspaceCount`, `getSystemLogCount`, `getNotificationCount` operations
   - ✅ Conectar `AnalyticsDashboardPage.tsx` a queries reais (remover qualquer mock)
   - ✅ DELETE qualquer card que não tenha dados reais ainda

3. 🔴 **CRÍTICO - Authorization consistency:**
   - ✅ Fix `src/core/jobs/operations.ts` para usar `context.user.isAdmin`
   - ✅ REMOVE dependência de `ADMIN_EMAILS` env var
   - ✅ Padronizar TODAS operações admin com mesmo check

4. 🔴 **CRÍTICO - Admin audit trail foundation:**
   - ✅ Garantir que `logAction()` está sendo chamado em TODAS operações admin existentes
   - ✅ Adicionar `action: 'ADMIN_ACTION'` prefix para todas ações admin
   - ✅ Metadata completo em cada log

**GATE: Não avança para Phase 2 até:**
- ✅ Zero arquivos demo/mock/showcase existindo
- ✅ Zero dados hardcoded em páginas admin
- ✅ Todas queries conectadas retornam dados reais
- ✅ `git grep -i "todo\|fixme\|mock\|demo" src/client/pages/admin/` = zero resultados relevantes
- ✅ Todas operações admin auditadas

### Phase 2 - Core Admin Features (Week 2-3) - IMPLEMENTAÇÃO COMPLETA
**Cada item só é considerado "done" quando 100% funcional em produção**

5. ✅ **Workspace Management Dashboard - COMPLETO:**
   - Backend: 4 operations implementadas (`getAllWorkspaces`, `suspendWorkspace`, `getWorkspaceDetails`, `updateWorkspaceQuotas`)
   - UI: Página completa com table, filters, search, actions
   - Testing: E2E test para suspend/activate flow
   - Audit: Todas ações logadas
   - **Definition of Done:** Admin consegue suspender workspace e vê refletido no sistema real

6. ✅ **Enhanced User Management - COMPLETO:**
   - Backend: 6 operations implementadas (`suspendUser`, `resetUser2FA`, `resetUserPassword`, `getUserWorkspaces`, `getUserActivity`, `deleteUserCascade`)
   - UI: Expandir página existente com novas ações e drill-downs
   - Testing: E2E test para cada ação crítica
   - Audit: Todas ações logadas com metadata
   - **Definition of Done:** Admin consegue suspender user e user não consegue mais fazer login

7. ✅ **Payment & Billing Admin Interface - COMPLETO:**
   - Backend: 5 operations implementadas com integração Stripe real
   - UI: Dashboard + tables funcionais
   - Testing: Test com Stripe test mode
   - Audit: Refunds e overrides logados
   - **Definition of Done:** Admin consegue processar refund e vê refletido no Stripe dashboard

8. ✅ **Admin Analytics Consolidation - COMPLETO:**
   - Backend: Todas queries de contadores implementadas com dados reais
   - UI: Dashboard sem um único mock, todos cards com dados reais
   - Testing: Verificar que números batem com database
   - **Definition of Done:** Refresh página mostra números reais que mudam conforme DB muda

**GATE: Não avança para Phase 3 até:**
- ✅ Todas 4 features acima 100% funcionais
- ✅ E2E tests passing para cada feature
- ✅ Zero TODOs ou "implementar depois" no código
- ✅ Code review aprovado para cada feature

### Phase 3 - System Monitoring (Week 4) - IMPLEMENTAÇÃO COMPLETA

9. ✅ **System Health & Infrastructure Dashboard - COMPLETO:**
   - Backend: 4 operations com integração real (Redis, Prisma, MinIO, ELK)
   - UI: Status dashboard com métricas reais, não simuladas
   - Testing: Mock infrastructure failures e verificar detecção
   - **Definition of Done:** Dashboard mostra status real e detecta quando Redis cai

10. ✅ **Enhanced Job Management - COMPLETO:**
    - Backend: 6 novas operations (pause, resume, update schedule, etc)
    - UI: Controles funcionais para cada job
    - Testing: Pause job e verificar que não executa
    - **Definition of Done:** Admin pausa job e job realmente não roda

11. ✅ **Audit Log Viewer UI - COMPLETO:**
    - Backend: Usar operations existentes (`getAuditLogs`, `getAuditLogsByResource`)
    - UI: Página completa com filtros avançados e export
    - Testing: Gerar audit logs e verificar aparecem no viewer
    - **Definition of Done:** Admin vê ações recentes de qualquer user no sistema

**GATE: Não avança para Phase 4 até:**
- ✅ System health mostra status real de infra
- ✅ Job controls funcionam (pause realmente pausa)
- ✅ Audit viewer mostra logs reais e export funciona

### Phase 4 - Advanced Features (Week 5-6) - IMPLEMENTAÇÃO COMPLETA

12. ✅ **Module Administration Hub - COMPLETO:**
    - Backend: Operations por módulo (Aegis, Eclipse, MITRE) com stats reais
    - UI: Dashboard por módulo com dados reais de usage
    - Testing: Criar assets/alerts/TTPs e verificar contadores
    - **Definition of Done:** Stats refletem uso real dos módulos por workspace

13. ✅ **Notification System Admin - COMPLETO:**
    - Backend: 4 operations com queries reais de Notification/NotificationDeliveryLog
    - UI: Dashboard + table com delivery status real
    - Testing: Send notification e verificar aparece no admin
    - **Definition of Done:** Admin vê notificações reais e pode retry failed

14. ✅ **Security & Compliance Monitoring - COMPLETO:**
    - Backend: 6 operations com dados reais de security events
    - UI: Dashboard de segurança com métricas reais
    - Testing: Simular failed login e verificar aparece
    - **Definition of Done:** Dashboard detecta eventos de segurança reais

15. ✅ **Unified Admin Navigation - COMPLETO:**
    - Refactor: Sidebar apenas com itens implementados
    - Badges: Contadores reais (não hardcoded)
    - Testing: Verificar cada link vai para página funcional
    - **Definition of Done:** Zero links para páginas não implementadas

**GATE: Não avança para Phase 5 até:**
- ✅ Todos módulos reportando stats reais
- ✅ Notifications admin funcional com retry working
- ✅ Security monitoring detectando eventos reais
- ✅ Sidebar 100% limpo (zero demo items)

### Phase 5 - Polish & Optimization (Week 7) - COMPLETAR

16. ✅ **Real-time updates integration:**
    - WebSocket: Admin events channel funcional
    - UI: Toast notifications com dados reais
    - Testing: Trigger evento e verificar admin recebe real-time
    - **Definition of Done:** Admin vê toast quando evento acontece em tempo real

17. ✅ **Performance optimization:**
    - Database: Indices criados e testados
    - Caching: Redis cache implementado com invalidation
    - Testing: Load test com 1000+ records
    - **Definition of Done:** Dashboards carregam < 500ms com dados reais

18. ✅ **Mobile responsiveness:**
    - UI: Todos breakpoints implementados
    - Testing: Testar em mobile real (iPhone, Android)
    - **Definition of Done:** Admin usável em mobile sem horizontal scroll

19. ✅ **Internationalization:**
    - i18n: Todas strings em PT-BR e EN-US
    - Testing: Toggle idioma e verificar tradução completa
    - **Definition of Done:** Zero strings hardcoded, tudo via i18n

20. ✅ **Documentation:**
    - Docs: Guides completos para cada feature admin
    - Testing: Seguir docs para completar tarefa comum
    - **Definition of Done:** New admin consegue fazer tarefa seguindo docs

**FINAL GATE - PRODUCTION READY:**
- ✅ Zero mock data em qualquer lugar
- ✅ Zero TODOs no código
- ✅ Zero páginas demo/showcase
- ✅ 100% features funcionais e testadas
- ✅ Performance validated (< 500ms dashboards)
- ✅ Mobile tested e funcional
- ✅ i18n completo
- ✅ Docs completos
- ✅ E2E tests passing 100%
- ✅ Code coverage > 80% em operations admin

## Success Metrics - 100% Funcional ou BLOQUEADO

**Admin system será considerado completo quando (CRITÉRIOS NÃO-NEGOCIÁVEIS):**

- ✅ **ZERO mock data em qualquer lugar do código** (verificado via `git grep`)
- ✅ **ZERO páginas demo/showcase/example** (directory `/elements/` deletado)
- ✅ **ZERO código comentado "para implementar depois"** (sem TODOs em produção)
- ✅ **100% operações admin auditadas** (todas chamam `logAction()`)
- ✅ **100% páginas conectadas a dados reais da database** (nenhum hardcoded array)
- ✅ **Response time < 500ms para dashboards** (validated com load test real)
- ✅ **Mobile-friendly** (testado em iPhone e Android reais, não só browser resize)
- ✅ **Full i18n coverage** (PT-BR + EN-US, zero strings hardcoded)
- ✅ **Documentation completa e TESTADA** (seguir doc leva a resultado correto)
- ✅ **All admin operations have pagination** (skip/take implementado e testado)
- ✅ **All tables have search + filters FUNCIONAIS** (conectados a queries reais)
- ✅ **Authorization consistente** (100% operations usam `context.user.isAdmin`)
- ✅ **Real-time notifications funcionando** (testado com evento real)
- ✅ **E2E tests passing 100%** (cada feature tem test que falha se quebrar)
- ✅ **Code coverage > 80%** em operations admin (não aceitar menos)

**Acceptance criteria por feature (BLOQUEADORES DE PR):**

**Backend:**
- ❌ **REJEITAR PR** se operation retorna mock/hardcoded data
- ❌ **REJEITAR PR** se operation não tem error handling completo (try/catch)
- ❌ **REJEITAR PR** se operation não loga ação no AuditLog (se for mutation)
- ❌ **REJEITAR PR** se operation não valida input (sem Zod schema)
- ❌ **REJEITAR PR** se operation não checa `context.user.isAdmin`
- ✅ **APROVAR** só se operation testada com dados reais e funciona

**Frontend:**
- ❌ **REJEITAR PR** se página tem hardcoded array de dados
- ❌ **REJEITAR PR** se página não tem loading state (isLoading não usado)
- ❌ **REJEITAR PR** se página não tem error handling (error não tratado)
- ❌ **REJEITAR PR** se página não tem empty state (e se array vazio não mostra nada)
- ❌ **REJEITAR PR** se ação destrutiva não tem confirmação (delete sem dialog)
- ❌ **REJEITAR PR** se strings estão hardcoded (não usa `t('admin:key')`)
- ❌ **REJEITAR PR** se tem `// TODO:` ou `// FIXME:` no código
- ❌ **REJEITAR PR** se tem código comentado grande (> 5 linhas)
- ✅ **APROVAR** só se página funciona com dados reais da database

**Testing:**
- ❌ **REJEITAR PR** se não tem E2E test para feature nova
- ❌ **REJEITAR PR** se test usa mock quando poderia usar dados reais
- ❌ **REJEITAR PR** se test não valida resultado final (só checa se não dá erro)
- ✅ **APROVAR** só se test quebra quando feature quebra (test efetivo)

**Performance:**
- ❌ **REJEITAR PR** se query não tem índice em field filtrado (verificar EXPLAIN)
- ❌ **REJEITAR PR** se listagem não tem paginação (findMany sem skip/take)
- ❌ **REJEITAR PR** se query N+1 detectado (usar include/select)
- ❌ **REJEITAR PR** se load time > 2s (testar com 1000+ records)
- ✅ **APROVAR** só se performance validada com dados reais

**Documentation:**
- ❌ **REJEITAR PR** se feature nova não tem docs
- ❌ **REJEITAR PR** se docs não foram testados (seguir e verificar funciona)
- ✅ **APROVAR** só se docs permitem admin fazer tarefa sem perguntar

**VERIFICAÇÃO FINAL ANTES DE CONSIDERAR "DONE":**

```bash
# 1. ZERO mock data
git grep -i "mock\|fake\|dummy\|placeholder" src/client/pages/admin/ src/core/ | grep -v "test" | wc -l
# DEVE retornar: 0

# 2. ZERO TODOs em produção
git grep -i "todo\|fixme\|hack\|xxx" src/ | grep -v "test\|docs\|node_modules" | wc -l
# DEVE retornar: 0

# 3. ZERO código comentado (> 3 linhas consecutivas)
git grep -A3 "^[[:space:]]*//.*$" src/ | grep -c "^--$"
# DEVE retornar: < 5 (pequenos comments são OK)

# 4. Todas operações admin auditadas
git grep "export const.*: .* = async" src/core/ | grep -v "test" | wc -l
git grep "logAction\|AuditLog.create" src/core/ | grep -v "test" | wc -l
# Segundo número deve ser >= primeiro * 0.8 (80% auditado mínimo)

# 5. Performance test
npm run test:e2e:performance
# DEVE passar: p95 < 500ms para dashboards

# 6. E2E tests
npm run test:e2e
# DEVE passar: 100% tests passing

# 7. i18n coverage
git grep -r "\"[A-Z]" src/client/pages/admin/ | grep -v "t('" | wc -l
# DEVE retornar: < 10 (só constants, não UI strings)
```

**SE QUALQUER VERIFICAÇÃO FALHAR:**
- 🔴 **BLOQUEADO** - Não pode deploy para produção
- 🔴 **BLOQUEADO** - Não pode considerar feature "done"
- 🔴 **BLOQUEADO** - Não pode avançar para próxima phase

**DEFINIÇÃO DE "PRODUCTION-READY":**
1. ✅ Funciona com dados reais da database
2. ✅ Performance validada com load test
3. ✅ E2E test passing
4. ✅ Error handling completo
5. ✅ Audit logging implementado
6. ✅ i18n completo
7. ✅ Mobile testado
8. ✅ Docs testados
9. ✅ Code review aprovado
10. ✅ QA sign-off

**NÃO É "PRODUCTION-READY" SE:**
- ❌ Tem qualquer mock data
- ❌ Tem qualquer TODO/FIXME
- ❌ Tem qualquer página demo/showcase
- ❌ Tem qualquer feature "parcialmente implementada"
- ❌ Tem qualquer código comentado "para usar depois"
- ❌ Tem qualquer teste que não testa de verdade
- ❌ Tem qualquer query sem índice necessário
- ❌ Tem qualquer string hardcoded (não i18n)

## Notes - Filosofia de Desenvolvimento

### Princípios Fundamentais (NÃO-NEGOCIÁVEIS)

1. **"100% Funcional ou Não Existe"**
   - Não existe meio-termo entre "implementado" e "não implementado"
   - Código que não funciona = código que não existe
   - Demo pages = lixo que confunde e deve ser deletado

2. **"Production-Ready ou Work-In-Progress"**
   - Se não está production-ready, não vai para `main` branch
   - Work-in-progress fica em feature branch ou não existe
   - Não existe "vou implementar depois" commitado no código

3. **"Delete é Melhor que Mock"**
   - Melhor não ter feature do que ter mock
   - Mock data dá falsa sensação de progresso
   - Delete código morto imediatamente, sem dó

4. **"Test com Dados Reais ou Não Test"**
   - Test que usa mock não testa nada de útil
   - Se não pode testar com dados reais, não está pronto
   - Integration test > unit test para admin features

5. **"Documentation que Não Foi Testada = Mentira"**
   - Se seguir doc não leva ao resultado, doc está errado
   - Sempre testar docs antes de commitar
   - Docs desatualizados são piores que sem docs

### Transformação do Admin System

**Estado Atual (Antes):**
- 50% implementado, 30% demo/mock, 20% TODO
- Páginas showcase que não servem para nada
- Dados hardcoded fingindo que sistema funciona
- TODOs prometendo implementar depois
- Inconsistência em authorization
- Mock data confundindo sobre capacidades reais

**Estado Final (Depois):**
- 100% implementado e funcional
- ZERO páginas demo/mock/showcase
- ZERO dados hardcoded (só dados reais da database)
- ZERO TODOs no código de produção
- Authorization consistente (100% usa isAdmin)
- Todas features testadas e production-ready

### Mudança de Mindset

**❌ MINDSET ERRADO (Rejeitar):**
- "Vou adicionar placeholder para ver o layout"
- "Vou deixar TODO para implementar depois"
- "Vou usar mock agora e conectar depois"
- "Vou commitar comentado para não perder código"
- "Vou deixar página demo caso precise do layout"
- "Teste pode ser mock, o importante é coverage"

**✅ MINDSET CORRETO (Adotar):**
- "Vou implementar completo agora ou criar issue para depois"
- "Se não tenho dados reais, não mostro a feature ainda"
- "Vou deletar código que não usa imediatamente"
- "Código comentado vai para Git history, não para `main`"
- "Demo page vai para lixo, layout pode ser recriado se precisar"
- "Teste deve quebrar se feature quebrar, ou não serve para nada"

### Adições ao SentinelIQ

**Capacidades Adicionadas (Todas 100% Funcionais):**
- ✅ Workspace Management: Gerenciar todos workspaces do sistema
- ✅ Enhanced User Management: Suspender, resetar 2FA/password, deletar
- ✅ Payment & Billing Admin: Refunds, overrides, subscription management
- ✅ System Health Monitoring: Status real da infraestrutura
- ✅ Audit Log Viewer: Compliance e tracking de todas ações
- ✅ Module Administration: Stats e controle de Aegis/Eclipse/MITRE
- ✅ Notification System Admin: Monitoring e retry de notificações
- ✅ Security Monitoring: Failed logins, IP violations, 2FA adoption
- ✅ Enhanced Job Management: Pause/resume/schedule modification

**Capacidades Removidas (Eram Inúteis):**
- ❌ Settings Demo Page: Formulário fake sem backend
- ❌ Calendar Demo Page: Eventos estáticos sem integração
- ❌ UI Buttons Showcase: Não pertence ao admin funcional
- ❌ Mock data em Analytics: Contadores fake
- ❌ Hardcoded workspaces em Features: Array fake

### Consistência e Padrões

**Arquitetura Mantida:**
- ✅ Wasp pattern: operations em `src/core/`, UI em `src/client/pages/admin/`
- ✅ Entity access: todas operations listam entities usadas em `main.wasp`
- ✅ Authorization: `context.user.isAdmin` check em todas operations
- ✅ Validation: Zod schemas para input validation
- ✅ Audit: `logAction()` em todas mutations admin
- ✅ i18n: `t('admin:key')` para todas strings

**Integração com Infraestrutura:**
- ✅ Redis: Cache e rate limiting
- ✅ ELK: System logs e metrics
- ✅ MinIO: Backup storage
- ✅ WebSocket: Real-time admin notifications
- ✅ Stripe: Payment management
- ✅ PostgreSQL: Todas queries reais

### Resultado Final

**O que admin system faz agora:**
- Gerencia TODOS aspectos da plataforma com dados reais
- Monitora saúde do sistema em tempo real
- Controla billing e payments completamente
- Rastreia segurança e compliance
- Administra usuários e workspaces com ações efetivas
- Monitora e controla jobs e notificações
- Fornece analytics reais sobre uso do sistema

**O que admin system NÃO tem mais:**
- Nenhuma página fake/demo/showcase
- Nenhum dado mock/hardcoded
- Nenhum TODO ou "implementar depois"
- Nenhum código morto ou comentado
- Nenhuma inconsistência de authorization
- Nenhuma feature "parcialmente implementada"

**Métricas de Qualidade:**
- 100% features funcionais (não parciais)
- 100% operations auditadas
- 100% dados reais (zero mock)
- > 80% code coverage em operations
- < 500ms response time dashboards
- 100% i18n coverage
- 100% E2E tests passing
- 0 TODOs em produção
- 0 páginas demo

Este é um admin system enterprise-grade, production-ready, que realmente permite administrar a plataforma completa. Não é uma coleção de demos e TODOs.
