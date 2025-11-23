/**
 * Email Sending Utilities
 * Helper functions to send emails in different contexts
 */

import { sendEmail, EmailTemplate, type EmailBranding } from './index';
import type { User, Workspace } from 'wasp/entities';

/**
 * Get branding for email from workspace
 */
export async function getEmailBranding(workspace?: Workspace): Promise<EmailBranding | undefined> {
  if (!workspace) return undefined;

  return {
    logoUrl: workspace.logoUrl || undefined,
    primaryColor: workspace.primaryColor || undefined,
    secondaryColor: workspace.secondaryColor || undefined,
    companyName: workspace.name,
    companyUrl: process.env.WASP_WEB_CLIENT_URL || 'https://sentineliq.com.br',
  };
}

/**
 * Auth email helpers
 */
export const authEmails = {
  sendWelcome: async (user: User, verificationUrl?: string) => {
    await sendEmail(user.email!, EmailTemplate.WELCOME, {
      userName: user.email!.split('@')[0],
      verificationUrl,
    });
  },

  sendEmailVerification: async (email: string, userName: string, verificationUrl: string) => {
    await sendEmail(email, EmailTemplate.EMAIL_VERIFICATION, {
      userName,
      verificationUrl,
    });
  },

  sendPasswordReset: async (email: string, userName: string, resetUrl: string) => {
    await sendEmail(email, EmailTemplate.PASSWORD_RESET, {
      userName,
      resetUrl,
    });
  },

  sendPasswordChanged: async (email: string, userName: string, changedAt: string, ipAddress?: string) => {
    await sendEmail(email, EmailTemplate.PASSWORD_CHANGED, {
      userName,
      changedAt,
      ipAddress,
    });
  },

  send2FAEnabled: async (email: string, userName: string, enabledAt: string, backupCodesCount: number) => {
    await sendEmail(email, EmailTemplate.TWO_FACTOR_ENABLED, {
      userName,
      enabledAt,
      backupCodesCount,
    });
  },

  send2FADisabled: async (email: string, userName: string, disabledAt: string) => {
    await sendEmail(email, EmailTemplate.TWO_FACTOR_DISABLED, {
      userName,
      disabledAt,
    });
  },

  sendAccountLocked: async (email: string, userName: string, lockedUntil: string, attempts: number) => {
    await sendEmail(email, EmailTemplate.ACCOUNT_LOCKED, {
      userName,
      lockedUntil,
      attempts,
    });
  },
};

/**
 * Payment email helpers
 */
export const paymentEmails = {
  sendPaymentSuccess: async (
    email: string,
    userName: string,
    amount: string,
    plan: string,
    options?: { invoiceUrl?: string; nextBillingDate?: string }
  ) => {
    await sendEmail(email, EmailTemplate.PAYMENT_SUCCESS, {
      userName,
      amount,
      plan,
      ...options,
    });
  },

  sendPaymentFailed: async (
    email: string,
    userName: string,
    amount: string,
    plan: string,
    updatePaymentUrl: string,
    options?: { reason?: string; retryDate?: string }
  ) => {
    await sendEmail(email, EmailTemplate.PAYMENT_FAILED, {
      userName,
      amount,
      plan,
      updatePaymentUrl,
      ...options,
    });
  },

  sendTrialStarted: async (
    email: string,
    userName: string,
    plan: string,
    trialDays: number,
    trialEndsAt: string,
    features: string[],
    dashboardUrl: string
  ) => {
    await sendEmail(email, EmailTemplate.TRIAL_STARTED, {
      userName,
      plan,
      trialDays,
      trialEndsAt,
      features,
      dashboardUrl,
    });
  },

  sendTrialEnding: async (
    email: string,
    userName: string,
    plan: string,
    daysLeft: number,
    trialEndsAt: string,
    upgradeUrl: string
  ) => {
    await sendEmail(email, EmailTemplate.TRIAL_ENDING, {
      userName,
      plan,
      daysLeft,
      trialEndsAt,
      upgradeUrl,
    });
  },
};

/**
 * Workspace email helpers
 */
export const workspaceEmails = {
  sendWorkspaceCreated: async (
    email: string,
    userName: string,
    workspaceName: string,
    workspaceUrl: string,
    branding?: EmailBranding
  ) => {
    await sendEmail(
      email,
      EmailTemplate.WORKSPACE_CREATED,
      {
        userName,
        workspaceName,
        workspaceUrl,
      },
      { branding }
    );
  },

  sendInvitation: async (
    email: string,
    inviterName: string,
    workspaceName: string,
    role: string,
    acceptUrl: string,
    expiresAt: string,
    branding?: EmailBranding
  ) => {
    await sendEmail(
      email,
      EmailTemplate.WORKSPACE_INVITATION,
      {
        inviterName,
        workspaceName,
        role,
        acceptUrl,
        expiresAt,
      },
      { branding }
    );
  },

  sendOwnershipTransfer: async (
    email: string,
    currentOwnerName: string,
    newOwnerName: string,
    workspaceName: string,
    confirmUrl: string,
    expiresAt: string,
    branding?: EmailBranding
  ) => {
    await sendEmail(
      email,
      EmailTemplate.OWNERSHIP_TRANSFER,
      {
        currentOwnerName,
        newOwnerName,
        workspaceName,
        confirmUrl,
        expiresAt,
      },
      { branding }
    );
  },

  sendMemberAdded: async (
    email: string,
    userName: string,
    workspaceName: string,
    role: string,
    addedBy: string,
    workspaceUrl: string,
    branding?: EmailBranding
  ) => {
    await sendEmail(
      email,
      EmailTemplate.MEMBER_ADDED,
      {
        userName,
        workspaceName,
        role,
        addedBy,
        workspaceUrl,
      },
      { branding }
    );
  },
};

/**
 * Notification email helpers
 */
export const notificationEmails = {
  sendCriticalIncident: async (
    email: string,
    incidentId: string,
    title: string,
    severity: string,
    description: string,
    affectedSystems: string[],
    detectedAt: string,
    incidentUrl: string,
    branding?: EmailBranding
  ) => {
    await sendEmail(
      email,
      EmailTemplate.INCIDENT_CRITICAL,
      {
        incidentId,
        title,
        severity,
        description,
        affectedSystems,
        detectedAt,
        incidentUrl,
      },
      { branding }
    );
  },

  sendCaseAssigned: async (
    email: string,
    assigneeName: string,
    caseId: string,
    title: string,
    priority: string,
    assignedBy: string,
    description: string,
    caseUrl: string,
    branding?: EmailBranding
  ) => {
    await sendEmail(
      email,
      EmailTemplate.CASE_ASSIGNED,
      {
        assigneeName,
        caseId,
        title,
        priority,
        assignedBy,
        description,
        caseUrl,
      },
      { branding }
    );
  },
};

/**
 * System email helpers
 */
export const systemEmails = {
  sendMaintenance: async (
    emails: string[],
    title: string,
    description: string,
    startTime: string,
    endTime: string,
    duration: string,
    affectedServices: string[],
    impact: string
  ) => {
    await sendEmail(emails, EmailTemplate.SYSTEM_MAINTENANCE, {
      title,
      description,
      startTime,
      endTime,
      duration,
      affectedServices,
      impact,
    });
  },

  sendSecurityAlert: async (
    emails: string[],
    title: string,
    severity: string,
    description: string,
    detectedAt: string,
    requiredActions: string[]
  ) => {
    await sendEmail(emails, EmailTemplate.SECURITY_ALERT, {
      title,
      severity,
      description,
      detectedAt,
      requiredActions,
    });
  },
};
