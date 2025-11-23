# 🔍 SentinelIQ - Module Conformity Validation Prompt

## Instruções de Uso

Quando você implementar um novo módulo (ex: TaskManager), use este prompt com o Copilot para validar conformidade 100%:

---

## 📋 PROMPT TEMPLATE

```
Você está validando a conformidade de um novo módulo no SentinelIQ.

O sistema SentinelIQ tem as seguintes características:
- Wasp 0.18 (TypeScript full-stack)
- PostgreSQL com Prisma ORM
- Multi-tenancy baseado em workspace
- Sistema de planos (Free/Hobby/Pro)
- Segurança enterprise (2FA, audit logging, rate limiting)

Valide se o módulo [MODULE_NAME] está 100% conforme com o sistema em TODAS estas 12 dimensões:

═══════════════════════════════════════════════════════════════════

1️⃣ DATABASE SCHEMA - schema.prisma

[ ] Entities principais criadas para o módulo?
[ ] Todos os fields têm tipos corretos (String, Int, DateTime, Enum)?
[ ] Relações para Workspace definidas (workspaceId field)?
[ ] Relações para User definidas (userId fields para ownership/assignments)?
[ ] Soft deletes implementados (deletedAt field)?
[ ] Timestamps corretos (createdAt, updatedAt)?
[ ] Indices críticos definidos para performance (@@index)?
[ ] Enums específicos do módulo criados?

✅ CONFORMIDADE: Todas entities têm workspaceId, timestamps, e indices?

═══════════════════════════════════════════════════════════════════

2️⃣ WASP DSL CONFIGURATION - main.wasp

[ ] Todas entities do módulo declaradas na seção entities?
[ ] Queries read-only definidas para cada entidade?
[ ] Actions (mutations) definidas para create/update/delete?
[ ] Todos os types importados corretamente (@src/...)?
[ ] Entity lists completados em cada operation (entities: [Entity1, Entity2])?
[ ] API routes definidas (se necessário)?
[ ] Webhooks registrados (se necessário)?

✅ CONFORMIDADE: Todas operations têm entity lists completos?

═══════════════════════════════════════════════════════════════════

3️⃣ BACKEND OPERATIONS - src/core/[module]/operations.ts

Para CADA operação crítica (create, update, delete), validar:

[ ] AUTENTICAÇÃO: if (!context.user) throw HttpError(401)?
[ ] VALIDAÇÃO: Input validado com Zod schema?
[ ] WORKSPACE: checkWorkspaceAccess() ou workspace.members verification?
[ ] PLAN LIMITS: enforcePlanLimit(context, workspaceId, 'limitType')?
[ ] BUSINESS LOGIC: Lógica correta implementada?
[ ] AUDIT LOG: logAction() chamado após sucesso?
[ ] NOTIFICATIONS: notifyUsers() para eventos importantes?
[ ] ERROR HANDLING: Throws HttpError com mensagens claras?

Checklist por operação:
- [ ] create[Entity]
- [ ] update[Entity]
- [ ] delete[Entity]
- [ ] [otherBusinessLogic]

✅ CONFORMIDADE: Todas operações seguem padrão completo?

═══════════════════════════════════════════════════════════════════

4️⃣ PLAN LIMITS INTEGRATION - src/core/payment/planLimits.ts

[ ] PLAN_LIMITS constant atualizado com novos limites?
[ ] Free tier tem limites restritos?
[ ] Hobby tier tem limites moderados?
[ ] Pro tier tem limites altos/unlimited?
[ ] Cada limite tem correspondência em alguma operação?
[ ] Feature flags (boolean) definidos para gated features?
[ ] getWorkspaceUsage() conta recursos do módulo?

Validar que cada operação create checa:
```typescript
await enforcePlanLimit(context, workspaceId, 'limit_key');
```

✅ CONFORMIDADE: Todos limites declarados e enforçados?

═══════════════════════════════════════════════════════════════════

5️⃣ MULTI-TENANCY & SECURITY

[ ] workspaceId filtro em TODAS queries GET?
[ ] workspaceId validado em todas operações (create/update/delete)?
[ ] Membros verificados antes de permitir ações (workspace.members)?
[ ] Role-based access control implementado (se needed)?
[ ] Soft deletes incluem workspace scope (deletedAt IS NULL)?
[ ] Cross-workspace data leak impossível?

Validar queries exemplo:
```typescript
// ✅ CORRETO
where: { workspaceId, deletedAt: null }

// ❌ ERRADO
where: { deletedAt: null } // Sem workspaceId!
```

✅ CONFORMIDADE: Workspace isolation perfeita em 100% das queries?

═══════════════════════════════════════════════════════════════════

6️⃣ AUDIT LOGGING - src/core/audit/AuditService.ts

[ ] AuditAction enum estendido com actions do módulo?
[ ] Cada mutação importante logged em AuditLog?
[ ] logAction() chamado com (context, resource, action, metadata)?
[ ] User ID, IP Address, User Agent capturados?
[ ] Timestamps imutáveis?
[ ] Metadata preserva estado antes/depois (se applicable)?

Exemplo de mutation que deveria ser logged:
- create[Entity]
- update[Entity] (com changes)
- delete[Entity]
- [customAction]

✅ CONFORMIDADE: Todas mutations auditadas com context completo?

═══════════════════════════════════════════════════════════════════

7️⃣ RATE LIMITING - src/core/mitre/RateLimitService.ts

[ ] Operações de read têm rate limit? (100 req/min)
[ ] Operações de mutation têm rate limit? (50 req/min)
[ ] Operações de search têm rate limit? (30 req/min)
[ ] RateLimitService.enforceLimit() chamado no início?
[ ] Erros retornam HttpError(429, 'Rate limit exceeded')?
[ ] Redis connection testada?

Padrão:
```typescript
await RateLimitService.enforceLimit(context.user.id, 'mutation', 50);
```

✅ CONFORMIDADE: Rate limiting implementado para operações críticas?

═══════════════════════════════════════════════════════════════════

8️⃣ CACHING - src/core/mitre/CacheService.ts

[ ] Dados read-only candidatos para cache (reference data)?
[ ] CacheService.getOrSet() implementado?
[ ] TTL apropriado configurado (1h-24h)?
[ ] Cache invalidação em operações de update/delete?
[ ] Redis connection testada?

Padrão:
```typescript
const data = await CacheService.getOrSet(
  `module:key`,
  () => expensiveQuery(),
  3600 // 1 hour TTL
);
```

✅ CONFORMIDADE: Caching implementado para read-heavy operations?

═══════════════════════════════════════════════════════════════════

9️⃣ REAL-TIME FEATURES - WebSocket & Notifications

[ ] Eventos importantes publicados no EventBus?
[ ] Notificações criadas em NotificationDeliveryLog?
[ ] WebSocket push enviado para usuários afetados?
[ ] Digest frequency respeitado (INSTANT/DAILY/WEEKLY)?
[ ] Email templates criados (se applicable)?
[ ] Webhook eventos registrados (se applicable)?

Exemplo:
```typescript
// Publish event para WebSocket
eventBus.emit('module:created', { resourceId, workspaceId });

// Log notification
await NotificationDeliveryLog.create({...});

// Send real-time update
notifyWorkspaceMembers(workspaceId, 'module:created', data);
```

✅ CONFORMIDADE: Real-time features integradas com system?

═══════════════════════════════════════════════════════════════════

🔟 BACKGROUND JOBS - main.wasp & src/core/jobs/

[ ] Job criado em main.wasp se há processamento async?
[ ] Job declarado com schedule correto (cron)?
[ ] Job entities listadas completamente?
[ ] Job function implementada em src/core/jobs/[module]Job.ts?
[ ] Erro handling com retry logic?
[ ] Batch processing implementado (se needed)?

Exemplo:
```wasp
job moduleProcessingJob {
  executor: PgBoss,
  perform: {
    fn: import { moduleProcessingJob } from "@src/core/jobs/moduleJob"
  },
  defaultArgs: {},
  schedule: "0 2 * * *", // 2 AM daily
  entities: [Entity1, Entity2]
}
```

✅ CONFORMIDADE: Background jobs scheduled e implementados?

═══════════════════════════════════════════════════════════════════

1️⃣1️⃣ FRONTEND INTEGRATION - src/client/pages/

[ ] Page(s) criadas para o módulo?
[ ] useQuery() usado para fetch data?
[ ] Direct action calls com await (sem useAction)?
[ ] useAuth() para user context?
[ ] Workspace context utilizado?
[ ] i18n translations adicionadas?
[ ] Error handling com try/catch?
[ ] Loading states implementados?

Padrão:
```typescript
import { getModuleData } from 'wasp/client/operations';
const { data, isLoading, error } = useQuery(getModuleData);

const handleCreate = async () => {
  try {
    await createModuleItem({ workspaceId, ...data });
  } catch (error) {
    // Handle error
  }
};
```

✅ CONFORMIDADE: Frontend pages seguem padrões do sistema?

═══════════════════════════════════════════════════════════════════

1️⃣2️⃣ INTEGRAÇÃO COM OUTROS MÓDULOS

[ ] Pode ligar com TTP (MITRE) se relevante?
[ ] Pode criar/vincular Observables (Aegis) se relevante?
[ ] Pode criar Alerts/Incidents (Aegis) se relevante?
[ ] Pode criar Brand tracking (Eclipse) se relevante?
[ ] Compartilha mesma AuditLog?
[ ] Compartilha mesma NotificationDeliveryLog?
[ ] Compartilha mesma RateLimit/Cache services?
[ ] Data models estão ligados corretamente?

Exemplo de integração:
```typescript
// Module A cria Alert no Aegis
const alert = await createAlert({
  workspaceId,
  title: `Alert from ${moduleName}`,
  sourceModule: 'MODULE_NAME'
});

// Log no audit
await logAction(context, alert, 'MODULE_CREATED_ALERT');
```

✅ CONFORMIDADE: Integração perfeita com Aegis/Eclipse/MITRE?

═══════════════════════════════════════════════════════════════════

FINAL CHECKLIST:

🎯 DIMENSÃO 1  - Database Schema: [ ] PASS / [ ] FAIL
🎯 DIMENSÃO 2  - Wasp Config: [ ] PASS / [ ] FAIL
🎯 DIMENSÃO 3  - Backend Operations: [ ] PASS / [ ] FAIL
🎯 DIMENSÃO 4  - Plan Limits: [ ] PASS / [ ] FAIL
🎯 DIMENSÃO 5  - Multi-tenancy: [ ] PASS / [ ] FAIL
🎯 DIMENSÃO 6  - Audit Logging: [ ] PASS / [ ] FAIL
🎯 DIMENSÃO 7  - Rate Limiting: [ ] PASS / [ ] FAIL
🎯 DIMENSÃO 8  - Caching: [ ] PASS / [ ] FAIL
🎯 DIMENSÃO 9  - Real-time: [ ] PASS / [ ] FAIL
🎯 DIMENSÃO 10 - Jobs: [ ] PASS / [ ] FAIL
🎯 DIMENSÃO 11 - Frontend: [ ] PASS / [ ] FAIL
🎯 DIMENSÃO 12 - Integrations: [ ] PASS / [ ] FAIL

═══════════════════════════════════════════════════════════════════

RESULTADO FINAL:

Se todas 12 dimensões = PASS → ✅ MÓDULO 100% CONFORME

Se alguma = FAIL → ❌ MÓDULO NÃO CONFORME (corrigir antes)

═══════════════════════════════════════════════════════════════════

PRÓXIMAS AÇÕES:
1. Forneça o nome do módulo a validar
2. Copie este prompt
3. Anexe o código relevante (schema, operations, pages)
4. Rode a validação
5. Corrija qualquer FAIL
6. Após todos PASS, módulo está pronto para produção

```

---

## 🎯 Exemplo de Uso - TaskManager Module

```
Módulo: TaskManager
Status: Implementando

Histórico:
- ✅ schema.prisma: Entities criadas (Task, TaskCategory, TaskAssignment, TaskComment)
- ✅ main.wasp: 25+ operations declaradas
- 🔄 operations.ts: Implementando validação
- ⏳ planLimits.ts: Verificar integração

[COPIAR PROMPT ACIMA E EXECUTAR VALIDAÇÃO]
```

---

## 💡 Dicas de Uso

### Para cada dimensão que FALHAR:

1. **Identifique o problema específico**
2. **Corrija o código**
3. **Re-teste apenas aquela dimensão**
4. **Marque como PASS quando estiver 100% conforme**

### Exemplo de correção (Plan Limits):

**Antes (❌ FAIL):**
```typescript
export const createTask = async (args, context) => {
  // Falta enforcePlanLimit!
  return context.entities.Task.create({ data: args });
};
```

**Depois (✅ PASS):**
```typescript
export const createTask = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authenticated');
  
  const { workspaceId, ...data } = ensureArgsSchemaOrThrowHttpError(createTaskSchema, args);
  await checkWorkspaceAccess(context, workspaceId);
  
  // ✅ NOVO: Validar plano
  await enforcePlanLimit(context, workspaceId, 'maxTasksPerMonth');
  
  const task = await context.entities.Task.create({
    data: { ...data, workspaceId, createdBy: context.user.id }
  });
  
  // ✅ Log
  await logAction(context, task, 'TASK_CREATED');
  
  // ✅ Notificação
  await notifyWorkspaceMembers(workspaceId, 'task:created', task);
  
  return task;
};
```

---

## 📌 Checklist Rápido (One-liner)

Se você quiser validação super rápida, apenas verifique:

```
✅ Tem workspaceId em todos entities?
✅ Tem workspaceId em todas queries GET?
✅ Tem workspaceId em todas validações create/update/delete?
✅ Tem enforcePlanLimit em operações create críticas?
✅ Tem logAction em operações create/update/delete?
✅ Tem notifyWorkspaceMembers em eventos importantes?
✅ Tem rate limiting em operações críticas?
✅ Integra com AuditLog?
✅ Integra com NotificationDeliveryLog?
✅ Frontend usa padrão correto (useQuery + await action)?

Resultado: Se todos ✅ = 100% conforme!
```

---

## 🔗 Arquivos de Referência

- **Schema Pattern:** `/schema.prisma` (linhas com Workspace, TTP, Alert, etc)
- **Operations Pattern:** `/src/core/modules/aegis/operations.ts`
- **Plan Limits Pattern:** `/src/core/payment/planLimits.ts`
- **Audit Pattern:** `/src/core/audit/AuditService.ts`
- **Rate Limit Pattern:** `/src/core/mitre/RateLimitService.ts`
- **Frontend Pattern:** `/src/client/pages/app/`

---

**Pronto para validar seu novo módulo!** 🚀
