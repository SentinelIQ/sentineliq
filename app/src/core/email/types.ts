/**
 * Email Template System Types
 * Professional email templates with categories and branding support
 */

export enum EmailCategory {
  AUTH = 'auth',
  PAYMENT = 'payment',
  WORKSPACE = 'workspace',
  NOTIFICATION = 'notification',
  SYSTEM = 'system',
}

export enum EmailTemplate {
  // Auth Category
  WELCOME = 'welcome',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_CHANGED = 'password_changed',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  ACCOUNT_LOCKED = 'account_locked',

  // Payment Category
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  TRIAL_STARTED = 'trial_started',
  TRIAL_ENDING = 'trial_ending',
  TRIAL_ENDED = 'trial_ended',
  INVOICE_PAID = 'invoice_paid',
  INVOICE_PAYMENT_FAILED = 'invoice_payment_failed',

  // Workspace Category
  WORKSPACE_CREATED = 'workspace_created',
  WORKSPACE_INVITATION = 'workspace_invitation',
  OWNERSHIP_TRANSFER = 'ownership_transfer',
  OWNERSHIP_TRANSFER_COMPLETED = 'ownership_transfer_completed',
  MEMBER_ADDED = 'member_added',
  MEMBER_REMOVED = 'member_removed',
  ROLE_CHANGED = 'role_changed',

  // Notification Category
  INCIDENT_CRITICAL = 'incident_critical',
  ALERT_HIGH_SEVERITY = 'alert_high_severity',
  CASE_ASSIGNED = 'case_assigned',
  SLA_BREACH_WARNING = 'sla_breach_warning',

  // System Category
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SYSTEM_OUTAGE = 'system_outage',
  FEATURE_ANNOUNCEMENT = 'feature_announcement',
  SECURITY_ALERT = 'security_alert',
}

export interface EmailBranding {
  logoUrl?: string;
  primaryColor?: string; // hex color
  secondaryColor?: string; // hex color
  companyName?: string;
  companyUrl?: string;
}

export interface EmailData {
  to: string | string[];
  subject: string;
  template: EmailTemplate;
  variables: Record<string, any>;
  branding?: EmailBranding;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export interface EmailTemplateConfig {
  template: EmailTemplate;
  category: EmailCategory;
  subject: string;
  previewText: string;
  renderHtml: (variables: Record<string, any>, branding?: EmailBranding) => string;
}

export const EMAIL_CATEGORY_MAP: Record<EmailTemplate, EmailCategory> = {
  // Auth
  [EmailTemplate.WELCOME]: EmailCategory.AUTH,
  [EmailTemplate.EMAIL_VERIFICATION]: EmailCategory.AUTH,
  [EmailTemplate.PASSWORD_RESET]: EmailCategory.AUTH,
  [EmailTemplate.PASSWORD_CHANGED]: EmailCategory.AUTH,
  [EmailTemplate.TWO_FACTOR_ENABLED]: EmailCategory.AUTH,
  [EmailTemplate.TWO_FACTOR_DISABLED]: EmailCategory.AUTH,
  [EmailTemplate.ACCOUNT_LOCKED]: EmailCategory.AUTH,

  // Payment
  [EmailTemplate.PAYMENT_SUCCESS]: EmailCategory.PAYMENT,
  [EmailTemplate.PAYMENT_FAILED]: EmailCategory.PAYMENT,
  [EmailTemplate.SUBSCRIPTION_CREATED]: EmailCategory.PAYMENT,
  [EmailTemplate.SUBSCRIPTION_CANCELLED]: EmailCategory.PAYMENT,
  [EmailTemplate.TRIAL_STARTED]: EmailCategory.PAYMENT,
  [EmailTemplate.TRIAL_ENDING]: EmailCategory.PAYMENT,
  [EmailTemplate.TRIAL_ENDED]: EmailCategory.PAYMENT,
  [EmailTemplate.INVOICE_PAID]: EmailCategory.PAYMENT,
  [EmailTemplate.INVOICE_PAYMENT_FAILED]: EmailCategory.PAYMENT,

  // Workspace
  [EmailTemplate.WORKSPACE_CREATED]: EmailCategory.WORKSPACE,
  [EmailTemplate.WORKSPACE_INVITATION]: EmailCategory.WORKSPACE,
  [EmailTemplate.OWNERSHIP_TRANSFER]: EmailCategory.WORKSPACE,
  [EmailTemplate.OWNERSHIP_TRANSFER_COMPLETED]: EmailCategory.WORKSPACE,
  [EmailTemplate.MEMBER_ADDED]: EmailCategory.WORKSPACE,
  [EmailTemplate.MEMBER_REMOVED]: EmailCategory.WORKSPACE,
  [EmailTemplate.ROLE_CHANGED]: EmailCategory.WORKSPACE,

  // Notification
  [EmailTemplate.INCIDENT_CRITICAL]: EmailCategory.NOTIFICATION,
  [EmailTemplate.ALERT_HIGH_SEVERITY]: EmailCategory.NOTIFICATION,
  [EmailTemplate.CASE_ASSIGNED]: EmailCategory.NOTIFICATION,
  [EmailTemplate.SLA_BREACH_WARNING]: EmailCategory.NOTIFICATION,

  // System
  [EmailTemplate.SYSTEM_MAINTENANCE]: EmailCategory.SYSTEM,
  [EmailTemplate.SYSTEM_OUTAGE]: EmailCategory.SYSTEM,
  [EmailTemplate.FEATURE_ANNOUNCEMENT]: EmailCategory.SYSTEM,
  [EmailTemplate.SECURITY_ALERT]: EmailCategory.SYSTEM,
};
