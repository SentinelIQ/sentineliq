/**
 * Email Template Renderer
 * Central system for rendering and sending emails with templates
 */

import { EmailTemplate, EmailCategory, EMAIL_CATEGORY_MAP, type EmailData, type EmailBranding } from './types';
import { authTemplates } from './templates/auth';
import { paymentTemplates } from './templates/payment';
import { workspaceTemplates } from './templates/workspace';
import { notificationTemplates } from './templates/notification';
import { systemTemplates } from './templates/system';

/**
 * Template registry mapping template enum to render function
 */
const templateRegistry: Record<EmailTemplate, (variables: any, branding?: EmailBranding) => string> = {
  // Auth templates
  [EmailTemplate.WELCOME]: authTemplates.welcome,
  [EmailTemplate.EMAIL_VERIFICATION]: authTemplates.emailVerification,
  [EmailTemplate.PASSWORD_RESET]: authTemplates.passwordReset,
  [EmailTemplate.PASSWORD_CHANGED]: authTemplates.passwordChanged,
  [EmailTemplate.TWO_FACTOR_ENABLED]: authTemplates.twoFactorEnabled,
  [EmailTemplate.TWO_FACTOR_DISABLED]: authTemplates.twoFactorDisabled,
  [EmailTemplate.ACCOUNT_LOCKED]: authTemplates.accountLocked,

  // Payment templates
  [EmailTemplate.PAYMENT_SUCCESS]: paymentTemplates.paymentSuccess,
  [EmailTemplate.PAYMENT_FAILED]: paymentTemplates.paymentFailed,
  [EmailTemplate.SUBSCRIPTION_CREATED]: paymentTemplates.subscriptionCreated,
  [EmailTemplate.SUBSCRIPTION_CANCELLED]: paymentTemplates.subscriptionCancelled,
  [EmailTemplate.TRIAL_STARTED]: paymentTemplates.trialStarted,
  [EmailTemplate.TRIAL_ENDING]: paymentTemplates.trialEnding,
  [EmailTemplate.TRIAL_ENDED]: paymentTemplates.trialEnded,
  [EmailTemplate.INVOICE_PAID]: paymentTemplates.invoicePaid,
  [EmailTemplate.INVOICE_PAYMENT_FAILED]: paymentTemplates.invoicePaymentFailed,

  // Workspace templates
  [EmailTemplate.WORKSPACE_CREATED]: workspaceTemplates.workspaceCreated,
  [EmailTemplate.WORKSPACE_INVITATION]: workspaceTemplates.workspaceInvitation,
  [EmailTemplate.OWNERSHIP_TRANSFER]: workspaceTemplates.ownershipTransfer,
  [EmailTemplate.OWNERSHIP_TRANSFER_COMPLETED]: workspaceTemplates.ownershipTransferCompleted,
  [EmailTemplate.MEMBER_ADDED]: workspaceTemplates.memberAdded,
  [EmailTemplate.MEMBER_REMOVED]: workspaceTemplates.memberRemoved,
  [EmailTemplate.ROLE_CHANGED]: workspaceTemplates.roleChanged,

  // Notification templates
  [EmailTemplate.INCIDENT_CRITICAL]: notificationTemplates.incidentCritical,
  [EmailTemplate.ALERT_HIGH_SEVERITY]: notificationTemplates.alertHighSeverity,
  [EmailTemplate.CASE_ASSIGNED]: notificationTemplates.caseAssigned,
  [EmailTemplate.SLA_BREACH_WARNING]: notificationTemplates.slaBreachWarning,

  // System templates
  [EmailTemplate.SYSTEM_MAINTENANCE]: systemTemplates.systemMaintenance,
  [EmailTemplate.SYSTEM_OUTAGE]: systemTemplates.systemOutage,
  [EmailTemplate.FEATURE_ANNOUNCEMENT]: systemTemplates.featureAnnouncement,
  [EmailTemplate.SECURITY_ALERT]: systemTemplates.securityAlert,
};

/**
 * Render email template with variables and branding
 */
export function renderEmailTemplate(
  template: EmailTemplate,
  variables: Record<string, any>,
  branding?: EmailBranding
): string {
  const renderFunction = templateRegistry[template];

  if (!renderFunction) {
    throw new Error(`Template ${template} not found in registry`);
  }

  return renderFunction(variables, branding);
}

/**
 * Get email category for a template
 */
export function getTemplateCategory(template: EmailTemplate): EmailCategory {
  return EMAIL_CATEGORY_MAP[template];
}

/**
 * Validate required variables for a template
 */
export function validateTemplateVariables(
  template: EmailTemplate,
  variables: Record<string, any>
): { valid: boolean; missing?: string[] } {
  // Define required fields for each template
  const requiredFields: Partial<Record<EmailTemplate, string[]>> = {
    [EmailTemplate.WELCOME]: ['userName'],
    [EmailTemplate.EMAIL_VERIFICATION]: ['userName', 'verificationUrl'],
    [EmailTemplate.PASSWORD_RESET]: ['userName', 'resetUrl'],
    [EmailTemplate.PASSWORD_CHANGED]: ['userName', 'changedAt'],
    [EmailTemplate.TWO_FACTOR_ENABLED]: ['userName', 'enabledAt', 'backupCodesCount'],
    [EmailTemplate.TWO_FACTOR_DISABLED]: ['userName', 'disabledAt'],
    [EmailTemplate.ACCOUNT_LOCKED]: ['userName', 'lockedUntil', 'attempts'],

    [EmailTemplate.PAYMENT_SUCCESS]: ['userName', 'amount', 'plan'],
    [EmailTemplate.PAYMENT_FAILED]: ['userName', 'amount', 'plan', 'updatePaymentUrl'],
    [EmailTemplate.SUBSCRIPTION_CREATED]: ['userName', 'plan', 'amount', 'features', 'dashboardUrl'],
    [EmailTemplate.SUBSCRIPTION_CANCELLED]: ['userName', 'plan', 'cancelledAt', 'accessUntil'],
    [EmailTemplate.TRIAL_STARTED]: ['userName', 'plan', 'trialDays', 'trialEndsAt', 'features', 'dashboardUrl'],
    [EmailTemplate.TRIAL_ENDING]: ['userName', 'plan', 'daysLeft', 'trialEndsAt', 'upgradeUrl'],
    [EmailTemplate.TRIAL_ENDED]: ['userName', 'plan', 'endedAt', 'upgradeUrl'],
    [EmailTemplate.INVOICE_PAID]: ['userName', 'invoiceNumber', 'amount', 'paidAt', 'plan', 'billingPeriod', 'invoiceUrl'],
    [EmailTemplate.INVOICE_PAYMENT_FAILED]: ['userName', 'invoiceNumber', 'amount', 'dueDate', 'plan', 'updatePaymentUrl', 'invoiceUrl'],

    [EmailTemplate.WORKSPACE_CREATED]: ['userName', 'workspaceName', 'workspaceUrl'],
    [EmailTemplate.WORKSPACE_INVITATION]: ['inviterName', 'workspaceName', 'role', 'acceptUrl', 'expiresAt'],
    [EmailTemplate.OWNERSHIP_TRANSFER]: ['currentOwnerName', 'newOwnerName', 'workspaceName', 'confirmUrl', 'expiresAt'],
    [EmailTemplate.OWNERSHIP_TRANSFER_COMPLETED]: ['userName', 'workspaceName', 'newOwnerName', 'transferredAt', 'workspaceUrl'],
    [EmailTemplate.MEMBER_ADDED]: ['userName', 'workspaceName', 'role', 'addedBy', 'workspaceUrl'],
    [EmailTemplate.MEMBER_REMOVED]: ['userName', 'workspaceName', 'removedBy', 'removedAt'],
    [EmailTemplate.ROLE_CHANGED]: ['userName', 'workspaceName', 'oldRole', 'newRole', 'changedBy', 'workspaceUrl'],

    [EmailTemplate.INCIDENT_CRITICAL]: ['incidentId', 'title', 'severity', 'description', 'affectedSystems', 'detectedAt', 'incidentUrl'],
    [EmailTemplate.ALERT_HIGH_SEVERITY]: ['alertId', 'title', 'severity', 'source', 'detectedAt', 'description', 'recommendedActions', 'alertUrl'],
    [EmailTemplate.CASE_ASSIGNED]: ['assigneeName', 'caseId', 'title', 'priority', 'assignedBy', 'description', 'caseUrl'],
    [EmailTemplate.SLA_BREACH_WARNING]: ['itemType', 'itemId', 'title', 'slaTarget', 'timeRemaining', 'currentStatus', 'itemUrl'],

    [EmailTemplate.SYSTEM_MAINTENANCE]: ['title', 'description', 'startTime', 'endTime', 'duration', 'affectedServices', 'impact'],
    [EmailTemplate.SYSTEM_OUTAGE]: ['title', 'description', 'startedAt', 'affectedServices', 'status', 'updates'],
    [EmailTemplate.FEATURE_ANNOUNCEMENT]: ['title', 'description', 'features', 'releaseDate'],
    [EmailTemplate.SECURITY_ALERT]: ['title', 'severity', 'description', 'detectedAt', 'requiredActions'],
  };

  const required = requiredFields[template] || [];
  const missing = required.filter((field) => !(field in variables));

  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  };
}

/**
 * Render and prepare email data for sending
 */
export function prepareEmail(emailData: EmailData): {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
} {
  // Validate template variables
  const validation = validateTemplateVariables(emailData.template, emailData.variables);
  if (!validation.valid) {
    throw new Error(
      `Missing required variables for template ${emailData.template}: ${validation.missing?.join(', ')}`
    );
  }

  // Render HTML
  const html = renderEmailTemplate(emailData.template, emailData.variables, emailData.branding);

  return {
    to: emailData.to,
    subject: emailData.subject,
    html,
    replyTo: emailData.replyTo,
    cc: emailData.cc,
    bcc: emailData.bcc,
  };
}

/**
 * Get default subject for a template (useful for fallback)
 */
export function getDefaultSubject(template: EmailTemplate, variables?: Record<string, any>): string {
  const subjectMap: Record<EmailTemplate, string | ((vars: any) => string)> = {
    [EmailTemplate.WELCOME]: 'Bem-vindo ao SentinelIQ!',
    [EmailTemplate.EMAIL_VERIFICATION]: 'Verifique seu endereço de email',
    [EmailTemplate.PASSWORD_RESET]: 'Redefinir sua senha',
    [EmailTemplate.PASSWORD_CHANGED]: 'Sua senha foi alterada',
    [EmailTemplate.TWO_FACTOR_ENABLED]: '2FA ativado na sua conta',
    [EmailTemplate.TWO_FACTOR_DISABLED]: '2FA desativado na sua conta',
    [EmailTemplate.ACCOUNT_LOCKED]: 'Sua conta foi temporariamente bloqueada',

    [EmailTemplate.PAYMENT_SUCCESS]: 'Pagamento confirmado',
    [EmailTemplate.PAYMENT_FAILED]: 'Falha no pagamento - Ação necessária',
    [EmailTemplate.SUBSCRIPTION_CREATED]: (vars) => `Bem-vindo ao plano ${vars.plan}!`,
    [EmailTemplate.SUBSCRIPTION_CANCELLED]: 'Assinatura cancelada',
    [EmailTemplate.TRIAL_STARTED]: (vars) => `Seu teste de ${vars.trialDays} dias começou!`,
    [EmailTemplate.TRIAL_ENDING]: (vars) => `Seu teste termina em ${vars.daysLeft} dia(s)`,
    [EmailTemplate.TRIAL_ENDED]: 'Seu período de teste terminou',
    [EmailTemplate.INVOICE_PAID]: (vars) => `Fatura ${vars.invoiceNumber} paga`,
    [EmailTemplate.INVOICE_PAYMENT_FAILED]: (vars) => `Falha no pagamento da fatura ${vars.invoiceNumber}`,

    [EmailTemplate.WORKSPACE_CREATED]: (vars) => `Workspace ${vars.workspaceName} criado`,
    [EmailTemplate.WORKSPACE_INVITATION]: (vars) => `Convite para ${vars.workspaceName}`,
    [EmailTemplate.OWNERSHIP_TRANSFER]: (vars) => `Transferência de propriedade: ${vars.workspaceName}`,
    [EmailTemplate.OWNERSHIP_TRANSFER_COMPLETED]: 'Transferência de propriedade concluída',
    [EmailTemplate.MEMBER_ADDED]: (vars) => `Você foi adicionado ao ${vars.workspaceName}`,
    [EmailTemplate.MEMBER_REMOVED]: (vars) => `Você foi removido do ${vars.workspaceName}`,
    [EmailTemplate.ROLE_CHANGED]: (vars) => `Sua função no ${vars.workspaceName} foi alterada`,

    [EmailTemplate.INCIDENT_CRITICAL]: (vars) => `🚨 Incidente Crítico: ${vars.title}`,
    [EmailTemplate.ALERT_HIGH_SEVERITY]: (vars) => `⚠️ Alerta: ${vars.title}`,
    [EmailTemplate.CASE_ASSIGNED]: (vars) => `Caso atribuído: ${vars.title}`,
    [EmailTemplate.SLA_BREACH_WARNING]: (vars) => `⏰ Aviso de violação de SLA: ${vars.title}`,

    [EmailTemplate.SYSTEM_MAINTENANCE]: (vars) => `Manutenção programada: ${vars.title}`,
    [EmailTemplate.SYSTEM_OUTAGE]: (vars) => `🚨 Incidente do sistema: ${vars.title}`,
    [EmailTemplate.FEATURE_ANNOUNCEMENT]: (vars) => `🚀 Novidades: ${vars.title}`,
    [EmailTemplate.SECURITY_ALERT]: (vars) => `🔒 Alerta de segurança: ${vars.title}`,
  };

  const subject = subjectMap[template];
  return typeof subject === 'function' ? subject(variables || {}) : subject;
}

// Export all for convenience
export * from './types';
export { EmailComponents } from './baseTemplate';
