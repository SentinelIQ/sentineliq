# SentinelIQ - Gap Report (Wasp app) – 2024-11-22

Escopo: revisão de `main.wasp`, operações core/server e páginas principais para identificar gaps de fluxo/implementação. Referências incluem caminho e linha aproximada.

## Resumo executivo
- Notificações por e-mail não são enviadas (stub), afetando múltiplos fluxos críticos (alertas, convites, recovery).
- Controles operacionais (cotas, jobs) não aplicam efeitos reais, podendo gerar violações silenciosas.
- Observabilidade limitada: falhas de backup/entrega e slow queries não alertam ninguém.
- Analytics pode exibir dados mock em produção sem aviso, distorcendo métricas.
- Algumas áreas usam tipos/links placeholder, comprometendo conformidade e DX.

## Cobertura por fluxo (Wasp)
- **Auth (login/signup/reset/2FA/email verification)**: back-end completo, mas dependente de e-mail provider stub → reset/verify não chegam ao usuário. 2FA flows existem, sem lacunas explícitas.
- **Workspaces (criar/convites/membros/switch/ownership)**: operações completas; cotas não aplicam limites (risco de overuse). Invitations/ownership dependem de notificações.
- **Pagamento/checkout/portal**: Stripe integrado; sem refund override crítica. Falta guard-rail de chamadas assíncronas (webhook não validado no report) e não há alerta operacional em falha de cobrança.
- **Notificações**: providers registrados, mas EMAIL é stub e falha de entrega termina silenciosa. Push/providers/tickets existem; retry sem alerta final.
- **Jobs/cron**: agendados no main.wasp; trigger manual não dispara PgBoss → UI “executar agora” não funciona.
- **Backup/DR**: backup diário ok; DR test não restaura em DB temporária; falha de backup não alerta.
- **Analytics**: Plausible opcional; se ausente ou erro, usa mock silencioso (inclusive em produção) e UI mostra mock notice, mas não bloqueia.
- **Admin dashboards**: leituras ok; Jobs trigger e analytics mock são as lacunas principais.
- **Aegis (alerts/incidents/cases/observables/evidence/tasks/ttp/timeline)**: operações completas; dependem de cotas reais e notificações. Sem gaps explícitos além dos serviços de suporte (email/quota).
- **Eclipse (brands/monitors/detections/infringements/actions)**: operações completas; dependem de notificações/quotas.
- **MITRE**: consultas e ttp management disponíveis; sem lacunas notadas.
- **Feature flags**: sistema pronto; recomendação antiga de enforcement client-side permanece válida (não é bug, é melhoria).
- **Uploads/screenshot**: Upload API funcional com quotas; screenshot API não suporta formatos legados e depende de URL HTTP válida.
- **Task manager**: tipos de templates/workflows são placeholders (`any`) — migração pendente.
- **Consentimento de cookies**: links legais placeholder.

## Achados detalhados

### Críticos
- **Envio de notificações por e-mail é stub** (`src/core/notifications/providers/emailProvider.ts:9-33`): apenas `console.log`, nenhuma chamada para SendGrid/SES/Wasp email. Flows de alertas, convites, reset de senha via provider e notificações transacionais não chegam ao usuário. *Ação*: integrar provedor real ou fallback via `wasp/server/email` e garantir retries.
- **Trigger manual de jobs não executa nada** (`src/core/jobs/operations.ts:180-220`): `triggerJob` só gera `jobId` fake e loga, sem chamar PgBoss. UIs/admin têm falsa sensação de execução de manutenção (backup, cleanup, retries). *Ação*: expor executor seguro que enfileira no PgBoss ou remover botão/manual trigger.
- **Cotas de workspace não aplicam uso real** (`src/core/workspace/quotas.ts:154-204`): métricas de alertas/incidentes/casos/storage estão fixas em 0, portanto `enforcePlanLimit` nunca bloqueia excedentes. *Ação*: calcular counts reais (Aegis/Eclipse) e consumo de storage antes de criar/atualizar recursos.
- **Teste de disaster recovery incompleto** (`src/core/database/recovery.ts:140-172`): marca sucesso sem restaurar backup em DB temporária; apenas valida gzip e faz leitura parcial. Risco de DR falso-positivo. *Ação*: provisionar DB temporária e executar restore dry-run automatizado.
- **Analytics podem exibir mock em produção** (`src/core/analytics/providers/plausibleAnalyticsUtils.ts:1-85`): se Plausible não estiver configurado ou falhar, retorna dados random sem sinalização severa (apenas log). Dashboards podem mostrar números fictícios. *Ação*: bloquear mock em produção, degradar com erro explícito ou flag visível.

### Altos
- **Retentativas de notificação sem alerta final** (`src/core/notifications/deliveryService.ts:70-99`): após `MAX_RETRIES_REACHED`, só atualiza log; não notifica admins/observabilidade. Falhas de entrega podem ficar invisíveis. *Ação*: criar evento/alerta (email/Slack/SystemLog crítico) e surface na UI.
- **Mensagens de contato não avisam administradores** (`src/core/messages/operations.ts:83-100`): TODO pendente para notificar admins; inbox depende de pull. *Ação*: disparar provider ou SystemLog + notification imediata.
- **Slow query monitor não persiste nem alerta** (`src/core/database/slowQueryMonitor.ts:180-204`): apenas console; sem SystemLog/notifications. *Ação*: gravar em `SystemLog`, acionar alerta crítico acima do threshold.
- **Falhas de backup não notificam** (`src/core/database/backup.ts:324-330`): `notifyBackupFailure` só loga; nenhum alerta operacional. *Ação*: integrar provider + SystemLog crítico.
- **Task Manager com tipos placeholder** (`src/core/modules/taskmanager/models/types.ts:9-17`): templates/workflows estão como `any`, enfraquecendo validação e geração de UI/ops. *Ação*: concluir migração de schema e restaurar tipos reais.
- **Screenshot API sem compatibilidade legada** (`src/server/api/screenshot.ts`): retorna 410 para URLs antigas não HTTP; sem migrador → links históricos quebram até reprocessar alertas. *Ação*: migrar dados ou oferecer fallback.
- **Webhook de pagamentos sem validação documentada** (`src/core/payment/webhook.ts`): delega a `paymentProcessor.webhook`; não há menção a verificação de assinatura/secret no report atual. *Ação*: revisar e garantir validação Stripe/Middleware (risco financeiro).

### Médios
- **Links legais ausentes no consentimento de cookies** (`src/client/components/cookie-consent/Config.ts:92-103`): placeholders `<your-url-here>` quebram requisitos de privacidade/terms. *Ação*: inserir URLs oficiais e revisar copy.
- **Analytics mock: risco de decisão errada** (`src/client/pages/admin/dashboards/analytics/AnalyticsConfigPage.tsx:200-240`): UI informa uso de mock mas não bloqueia operações/decisões; repetir check para evitar uso em prod sem flag. *Ação*: exibir banner crítico e desabilitar cards em prod quando mock.
- **Screenshot API depende de URLs HTTP e não lida com formatos antigos** (`src/server/api/screenshot.ts`): retorna 410 para formatos antigos; se storage não migrar, links quebram. *Ação*: criar migrador ou fallback de compatibilidade.

## Comparativo com mercado (SIEM / SOAR / EDR / ITSM SecOps)
- **Cobertura atual**: gestão de alertas/incidentes/casos (Aegis), proteção de marca (Eclipse), MITRE ATT&CK referencial, evidências/IOC, audit/system logs, notificações multi-canal (exceto email), quotas/planos, billing Stripe, backup, jobs PgBoss, feature flags.
- **Gap vs SIEM (Splunk/Chronicle/LogScale)**: ausência de ingestão/normalização de logs, mecanismos de correlação/detection rules (KQL/Sigma), UEBA, threat intel feeds/IOC enrichment automáticos, conectores cloud/endpoint.
- **Gap vs SOAR (Cortex XSOAR/Tines)**: falta de playbooks automatizados com ações executáveis em integrações (bloquear firewall, isolar endpoint, desabilitar IAM), approvals humanas integradas e biblioteca de ações prontas. `applyPlaybook` existe mas não há conectores.
- **Gap vs EDR/XDR (CrowdStrike/SentinelOne/Defender)**: sem telemetria de endpoint, anti-malware, contenção/isolation, live response ou agentes.
- **Gap vs ITSM SecOps (ServiceNow/Jira SM)**: integração CMDB/fila/SLA dinâmica e automação ticket bidirecional não visível (providers de ticket existem, mas sem evidência de execução/retorno).
- **Pontos fortes**: módulo de brand protection nativo (Eclipse), forms ricos de DFIR (evidence, chain of custody, TTP), infraestrutura SaaS pronta (billing, quotas, feature flags).

## Workflows pendentes de implementação (end-to-end)
- **Módulo Monitoring**: `src/client/pages/modules/monitoring/MonitoringPage.tsx` “em construção” → sem fluxo entregue.
- **Module Users / RBAC refinado**: `src/client/pages/modules/ModuleUsersPage.tsx` “Em breve” → controle granular por módulo ainda não implementado.
- **Canal de e-mail**: provider stub → convites, resets, verificação, alertas e notificações operacionais não funcionam por e-mail.
- **Alerting operacional**: falhas de entrega, backup, slow query, DR-test não disparam alerta → dependência de observabilidade externa.
- **Cotas/planos**: contagem real não aplicada → bloqueio/upgrade nunca dispara em criação de alert/incident/case/storage.
- **Jobs on-demand**: trigger manual não enfileira PgBoss → manutenção/suporte em tempo real indisponível.
- **DR test**: restore em DB temporária ausente → runbook de desastre incompleto.
- **Analytics real**: fallback para mock em produção → decisões podem ser tomadas em dados fictícios.
- **Webhook Stripe**: precisa confirmar assinatura/secret → risco financeiro se não validado.
- **SSO/Enterprise**: feature flag menciona SSO, mas não há implementação SAML/OIDC identificada.
- **Screenshot legado**: ausência de migrador/fallback para URLs antigas → evidências históricas quebradas.
- **Contato → Admin**: mensagens não notificam admins → fluxo de suporte/inbound leads parcial.
- **Task Manager**: tipos/templates/workflows com `any` → automações e auditoria de tarefas não confiáveis.

## Recomendações rápidas (ordem sugerida)
1) Conectar providers de notificação (email + alerta de falha de entrega/backup/slow query) e propagar para SystemLog/UI.  
2) Corrigir contagem de cotas e reforçar `enforcePlanLimit` antes de criações Aegis/Eclipse/storage.  
3) Implementar execução real para `triggerJob` ou remover da UI até estar pronto.  
4) Endurecer DR test com restore em DB temporária e check automatizado.  
5) Eliminar mock silencioso em analytics; falhar fechado ou sinalizar bloqueio em produção.  
6) Finalizar tipos do Task Manager e remover placeholders legais (cookies).

## Cobertura e próximos passos
- Foco foi em gaps explícitos (TODOs, mocks, stubs) e operações registradas em `main.wasp`.  
- Não foi executada bateria de testes; recomenda-se adicionar testes de integração para flows críticos (notificações, cotas, jobs, backup/DR).  
- Se quiser, podemos priorizar um plano de remediação sprint-by-sprint com owners e PRs necessários.

## Backlog para readiness SaaS Enterprise
- **Confiabilidade/observabilidade**
  - Integrar envio real de e-mail + métricas de entrega e alertas em falha/retry máx.
  - Telemetria de jobs/cron com gatilho manual funcional e dashboards consistentes.
  - Alertas operacionais para backup/restore/slow query/notification failure.
  - Hard-fail em analytics quando mock em produção; health check que cobre providers externos (Stripe, Plausible, storage, email).
- **Segurança/compliance**
  - Links de Política de Privacidade/Termos no consentimento de cookies; revisão LGPD/CCPA.
  - Garantir validação de assinatura no webhook Stripe e logging/audit associados.
  - Finalizar IP whitelist enterprise e assegurar enforcement na camada de middleware (não apenas UI).
- **Gestão de capacidade/planos**
  - Implementar contagem real de alerts/incidents/cases/storage e bloquear excedentes.
  - Superfícies de UX que escondem features não habilitadas pelo plano (client-side feature guard).
- **Dados/DR**
  - Restore de teste automatizado em DB temporária + relatório; alarme em falha.
  - Migrador para screenshots legados ou política de recompra de imagens.
- **Produto/Módulos**
  - Task Manager: concluir migração de schema e restaurar tipos fortes para templates/workflows.
  - Notificações: fluxo de contato → alerta admin; delivery retries com alerta final.
  - Admin: botão “executar job” deve enfileirar PgBoss; dashboards devem sinalizar mock/erro de providers.
  - Eclipse/Aegis: aplicar quotas reais e garantir que notificações funcionem (dependem do provider).
- **Testes**
  - Testes de integração para: envio de notificação, cotas (happy/limit exceeded), trigger de job, backup/restore dry-run, webhook Stripe (assinatura inválida/válida), analytics (mock vs real).
  - E2E: fluxos de convite, reset de senha, criação de alerta/incidente/caso com notificações.
