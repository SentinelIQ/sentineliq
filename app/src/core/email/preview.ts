/**
 * Email Preview API
 * Development endpoint to preview email templates
 */

import { renderEmailTemplate, EmailTemplate, getDefaultSubject } from './renderer';
import type { EmailBranding } from './types';

/**
 * Preview email template with sample data
 */
export function previewEmailTemplate(
  template: EmailTemplate,
  customVariables?: Record<string, any>,
  customBranding?: EmailBranding
): { subject: string; html: string } {
  // Sample data for each template
  const sampleData = getSampleDataForTemplate(template);
  const variables = { ...sampleData, ...customVariables };
  const branding = customBranding || getDefaultBranding();

  const html = renderEmailTemplate(template, variables, branding);
  const subject = getDefaultSubject(template, variables);

  return { subject, html };
}

/**
 * Get default branding for preview
 */
function getDefaultBranding(): EmailBranding {
  return {
    logoUrl: undefined,
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    companyName: 'SentinelIQ',
    companyUrl: 'https://sentineliq.com.br',
  };
}

/**
 * Sample data for each template type
 */
function getSampleDataForTemplate(template: EmailTemplate): Record<string, any> {
  const baseUrl = 'https://sentineliq.com.br';

  const samples: Record<EmailTemplate, Record<string, any>> = {
    // Auth
    [EmailTemplate.WELCOME]: {
      userName: 'João Silva',
      verificationUrl: `${baseUrl}/verify-email/abc123`,
    },
    [EmailTemplate.EMAIL_VERIFICATION]: {
      userName: 'João Silva',
      verificationUrl: `${baseUrl}/verify-email/abc123`,
    },
    [EmailTemplate.PASSWORD_RESET]: {
      userName: 'João Silva',
      resetUrl: `${baseUrl}/reset-password/xyz789`,
    },
    [EmailTemplate.PASSWORD_CHANGED]: {
      userName: 'João Silva',
      changedAt: new Date().toLocaleString('pt-BR'),
      ipAddress: '192.168.1.100',
    },
    [EmailTemplate.TWO_FACTOR_ENABLED]: {
      userName: 'João Silva',
      enabledAt: new Date().toLocaleString('pt-BR'),
      backupCodesCount: 8,
    },
    [EmailTemplate.TWO_FACTOR_DISABLED]: {
      userName: 'João Silva',
      disabledAt: new Date().toLocaleString('pt-BR'),
    },
    [EmailTemplate.ACCOUNT_LOCKED]: {
      userName: 'João Silva',
      lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toLocaleString('pt-BR'),
      attempts: 5,
    },

    // Payment
    [EmailTemplate.PAYMENT_SUCCESS]: {
      userName: 'João Silva',
      amount: 'R$ 99,00',
      plan: 'Pro',
      invoiceUrl: `${baseUrl}/invoices/inv_123`,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
    },
    [EmailTemplate.PAYMENT_FAILED]: {
      userName: 'João Silva',
      amount: 'R$ 99,00',
      plan: 'Pro',
      reason: 'Cartão de crédito recusado',
      retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      updatePaymentUrl: `${baseUrl}/payment/update`,
    },
    [EmailTemplate.SUBSCRIPTION_CREATED]: {
      userName: 'João Silva',
      plan: 'Pro',
      amount: 'R$ 99,00/mês',
      features: [
        'Usuários ilimitados',
        'Workspaces ilimitados',
        'Suporte prioritário 24/7',
        'Relatórios avançados',
        'API completa',
      ],
      dashboardUrl: `${baseUrl}/dashboard`,
    },
    [EmailTemplate.SUBSCRIPTION_CANCELLED]: {
      userName: 'João Silva',
      plan: 'Pro',
      cancelledAt: new Date().toLocaleDateString('pt-BR'),
      accessUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      reason: 'Solicitado pelo usuário',
    },
    [EmailTemplate.TRIAL_STARTED]: {
      userName: 'João Silva',
      plan: 'Pro',
      trialDays: 14,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      features: [
        'Usuários ilimitados',
        'Workspaces ilimitados',
        'Suporte prioritário',
        'Relatórios avançados',
      ],
      dashboardUrl: `${baseUrl}/dashboard`,
    },
    [EmailTemplate.TRIAL_ENDING]: {
      userName: 'João Silva',
      plan: 'Pro',
      daysLeft: 3,
      trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      upgradeUrl: `${baseUrl}/upgrade`,
    },
    [EmailTemplate.TRIAL_ENDED]: {
      userName: 'João Silva',
      plan: 'Pro',
      endedAt: new Date().toLocaleDateString('pt-BR'),
      upgradeUrl: `${baseUrl}/upgrade`,
    },
    [EmailTemplate.INVOICE_PAID]: {
      userName: 'João Silva',
      invoiceNumber: 'INV-2024-001',
      amount: 'R$ 99,00',
      paidAt: new Date().toLocaleDateString('pt-BR'),
      plan: 'Pro',
      billingPeriod: 'Janeiro 2024',
      invoiceUrl: `${baseUrl}/invoices/inv_123`,
    },
    [EmailTemplate.INVOICE_PAYMENT_FAILED]: {
      userName: 'João Silva',
      invoiceNumber: 'INV-2024-001',
      amount: 'R$ 99,00',
      dueDate: new Date().toLocaleDateString('pt-BR'),
      plan: 'Pro',
      reason: 'Cartão de crédito expirado',
      updatePaymentUrl: `${baseUrl}/payment/update`,
      invoiceUrl: `${baseUrl}/invoices/inv_123`,
    },

    // Workspace
    [EmailTemplate.WORKSPACE_CREATED]: {
      userName: 'João Silva',
      workspaceName: 'Acme Corp Security',
      workspaceUrl: `${baseUrl}/workspace/acme-corp`,
    },
    [EmailTemplate.WORKSPACE_INVITATION]: {
      inviterName: 'João Silva',
      workspaceName: 'Acme Corp Security',
      role: 'Administrador',
      acceptUrl: `${baseUrl}/invitations/accept/token123`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
    },
    [EmailTemplate.OWNERSHIP_TRANSFER]: {
      currentOwnerName: 'João Silva',
      newOwnerName: 'Maria Santos',
      workspaceName: 'Acme Corp Security',
      confirmUrl: `${baseUrl}/confirm-ownership/token456`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('pt-BR'),
    },
    [EmailTemplate.OWNERSHIP_TRANSFER_COMPLETED]: {
      userName: 'João Silva',
      workspaceName: 'Acme Corp Security',
      newOwnerName: 'Maria Santos',
      transferredAt: new Date().toLocaleString('pt-BR'),
      workspaceUrl: `${baseUrl}/workspace/acme-corp`,
    },
    [EmailTemplate.MEMBER_ADDED]: {
      userName: 'Maria Santos',
      workspaceName: 'Acme Corp Security',
      role: 'Membro',
      addedBy: 'João Silva',
      workspaceUrl: `${baseUrl}/workspace/acme-corp`,
    },
    [EmailTemplate.MEMBER_REMOVED]: {
      userName: 'Maria Santos',
      workspaceName: 'Acme Corp Security',
      removedBy: 'João Silva',
      removedAt: new Date().toLocaleString('pt-BR'),
      reason: 'Desligamento da empresa',
    },
    [EmailTemplate.ROLE_CHANGED]: {
      userName: 'Maria Santos',
      workspaceName: 'Acme Corp Security',
      oldRole: 'Membro',
      newRole: 'Administrador',
      changedBy: 'João Silva',
      workspaceUrl: `${baseUrl}/workspace/acme-corp`,
    },

    // Notification
    [EmailTemplate.INCIDENT_CRITICAL]: {
      incidentId: 'INC-2024-001',
      title: 'Falha no servidor de autenticação',
      severity: 'CRÍTICO',
      description:
        'O servidor de autenticação principal está apresentando falhas intermitentes, afetando o login de usuários.',
      affectedSystems: ['Servidor Auth-01', 'API Gateway', 'Portal Web'],
      detectedAt: new Date().toLocaleString('pt-BR'),
      incidentUrl: `${baseUrl}/incidents/inc-001`,
      assignee: 'João Silva',
    },
    [EmailTemplate.ALERT_HIGH_SEVERITY]: {
      alertId: 'ALT-2024-042',
      title: 'Múltiplas tentativas de login suspeitas',
      severity: 'ALTA',
      source: 'IDS/IPS - Firewall Principal',
      detectedAt: new Date().toLocaleString('pt-BR'),
      description:
        'Detectadas 150+ tentativas de login de IPs suspeitos nos últimos 10 minutos.',
      recommendedActions: [
        'Verificar logs de acesso detalhados',
        'Bloquear IPs maliciosos no firewall',
        'Notificar equipe de segurança',
        'Ativar autenticação de dois fatores obrigatória',
      ],
      alertUrl: `${baseUrl}/alerts/alt-042`,
    },
    [EmailTemplate.CASE_ASSIGNED]: {
      assigneeName: 'Maria Santos',
      caseId: 'CASE-2024-015',
      title: 'Investigação de vazamento de dados',
      priority: 'ALTA',
      assignedBy: 'João Silva',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      description:
        'Investigar possível vazamento de dados de clientes reportado por usuário externo.',
      caseUrl: `${baseUrl}/cases/case-015`,
    },
    [EmailTemplate.SLA_BREACH_WARNING]: {
      itemType: 'incident' as const,
      itemId: 'INC-2024-001',
      title: 'Falha no servidor de autenticação',
      slaTarget: '4 horas para resolução',
      timeRemaining: '45 minutos',
      currentStatus: 'Em Investigação',
      assignee: 'João Silva',
      itemUrl: `${baseUrl}/incidents/inc-001`,
    },

    // System
    [EmailTemplate.SYSTEM_MAINTENANCE]: {
      title: 'Atualização do banco de dados',
      description:
        'Realizaremos uma atualização de versão do banco de dados PostgreSQL para melhorar performance e segurança.',
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleString('pt-BR'),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toLocaleString('pt-BR'),
      duration: '2 horas',
      affectedServices: ['API REST', 'Dashboard Web', 'Relatórios'],
      impact: 'Indisponibilidade total durante o período',
      statusPageUrl: `${baseUrl}/status`,
    },
    [EmailTemplate.SYSTEM_OUTAGE]: {
      title: 'Falha no serviço de notificações',
      description:
        'Estamos enfrentando uma falha no serviço de notificações push. As notificações por email continuam funcionando normalmente.',
      startedAt: new Date().toLocaleString('pt-BR'),
      affectedServices: ['Notificações Push', 'Alertas em Tempo Real'],
      status: 'Investigando',
      estimatedResolution: new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString('pt-BR'),
      statusPageUrl: `${baseUrl}/status`,
      updates: [
        {
          time: new Date(Date.now() - 15 * 60 * 1000).toLocaleTimeString('pt-BR'),
          message: 'Problema identificado no servidor de mensageria. Equipe trabalhando na resolução.',
        },
        {
          time: new Date(Date.now() - 30 * 60 * 1000).toLocaleTimeString('pt-BR'),
          message: 'Incidente reportado. Investigação iniciada.',
        },
      ],
    },
    [EmailTemplate.FEATURE_ANNOUNCEMENT]: {
      title: 'Dashboard de Analytics Aprimorado',
      description:
        'Estamos felizes em anunciar um dashboard de analytics completamente redesenhado com novos recursos poderosos!',
      features: [
        {
          name: 'Gráficos Interativos',
          description: 'Explore seus dados com gráficos interativos e customizáveis.',
        },
        {
          name: 'Exportação Avançada',
          description: 'Exporte relatórios em múltiplos formatos (PDF, Excel, CSV).',
        },
        {
          name: 'Alertas Personalizados',
          description: 'Configure alertas customizados baseados em métricas específicas.',
        },
      ],
      releaseDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      learnMoreUrl: `${baseUrl}/blog/new-analytics-dashboard`,
      imageUrl: 'https://via.placeholder.com/600x300/3b82f6/ffffff?text=Analytics+Dashboard',
    },
    [EmailTemplate.SECURITY_ALERT]: {
      title: 'Vulnerabilidade crítica identificada',
      severity: 'CRÍTICA',
      description:
        'Uma vulnerabilidade crítica foi identificada em uma biblioteca de terceiros. Atualize imediatamente para a versão mais recente.',
      detectedAt: new Date().toLocaleString('pt-BR'),
      affectedUsers: 1250,
      requiredActions: [
        'Atualizar a biblioteca afetada para versão 2.5.1 ou superior',
        'Revisar logs de acesso dos últimos 7 dias',
        'Resetar senhas de usuários afetados',
        'Ativar 2FA obrigatório para todos os usuários',
      ],
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleString('pt-BR'),
      moreInfoUrl: `${baseUrl}/security/cve-2024-001`,
    },
  };

  return samples[template] || {};
}

/**
 * Get all available templates grouped by category
 */
export function getAllTemplates(): Array<{ category: string; templates: EmailTemplate[] }> {
  return [
    {
      category: 'Auth',
      templates: [
        EmailTemplate.WELCOME,
        EmailTemplate.EMAIL_VERIFICATION,
        EmailTemplate.PASSWORD_RESET,
        EmailTemplate.PASSWORD_CHANGED,
        EmailTemplate.TWO_FACTOR_ENABLED,
        EmailTemplate.TWO_FACTOR_DISABLED,
        EmailTemplate.ACCOUNT_LOCKED,
      ],
    },
    {
      category: 'Payment',
      templates: [
        EmailTemplate.PAYMENT_SUCCESS,
        EmailTemplate.PAYMENT_FAILED,
        EmailTemplate.SUBSCRIPTION_CREATED,
        EmailTemplate.SUBSCRIPTION_CANCELLED,
        EmailTemplate.TRIAL_STARTED,
        EmailTemplate.TRIAL_ENDING,
        EmailTemplate.TRIAL_ENDED,
        EmailTemplate.INVOICE_PAID,
        EmailTemplate.INVOICE_PAYMENT_FAILED,
      ],
    },
    {
      category: 'Workspace',
      templates: [
        EmailTemplate.WORKSPACE_CREATED,
        EmailTemplate.WORKSPACE_INVITATION,
        EmailTemplate.OWNERSHIP_TRANSFER,
        EmailTemplate.OWNERSHIP_TRANSFER_COMPLETED,
        EmailTemplate.MEMBER_ADDED,
        EmailTemplate.MEMBER_REMOVED,
        EmailTemplate.ROLE_CHANGED,
      ],
    },
    {
      category: 'Notification',
      templates: [
        EmailTemplate.INCIDENT_CRITICAL,
        EmailTemplate.ALERT_HIGH_SEVERITY,
        EmailTemplate.CASE_ASSIGNED,
        EmailTemplate.SLA_BREACH_WARNING,
      ],
    },
    {
      category: 'System',
      templates: [
        EmailTemplate.SYSTEM_MAINTENANCE,
        EmailTemplate.SYSTEM_OUTAGE,
        EmailTemplate.FEATURE_ANNOUNCEMENT,
        EmailTemplate.SECURITY_ALERT,
      ],
    },
  ];
}
