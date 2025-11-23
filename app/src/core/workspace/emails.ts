import { createLogger } from '../logs/logger';
import { sendEmail, EmailTemplate } from '../email';

interface SendInvitationEmailArgs {
  to: string;
  workspaceName: string;
  invitedByEmail: string;
  inviteToken: string;
  role: string;
  workspaceBranding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    name: string;
  };
}

export async function sendInvitationEmail(args: SendInvitationEmailArgs) {
  const { to, workspaceName, invitedByEmail, inviteToken, role, workspaceBranding } = args;

  // Construct invite URL
  const baseUrl = process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000';
  const inviteLink = `${baseUrl}/invite/${inviteToken}`;

  // Calculate expiry date (7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  try {
    // Use professional template
    await sendEmail(
      to,
      EmailTemplate.WORKSPACE_INVITATION,
      {
        inviterName: invitedByEmail,
        workspaceName,
        role,
        acceptUrl: inviteLink,
        expiresAt: expiresAt.toLocaleDateString('pt-BR'),
      },
      {
        branding: workspaceBranding ? {
          logoUrl: workspaceBranding.logoUrl,
          primaryColor: workspaceBranding.primaryColor,
          secondaryColor: workspaceBranding.secondaryColor,
          companyName: workspaceBranding.name,
          companyUrl: baseUrl,
        } : undefined,
      }
    );

    return { success: true };
  } catch (error: any) {
    console.error('Failed to send invitation email:', error);
    
    // ✅ Log to SystemLog for admin visibility
    const logger = createLogger('workspace-emails');
    await logger.error('Failed to send workspace invitation email', {
      to,
      workspaceName,
      error: error.message,
      stack: error.stack,
    });
    
    throw new Error(`Failed to send invitation email: ${error.message}`);
  }
}

interface SendMemberNotificationEmailArgs {
  to: string;
  workspaceName: string;
  eventType: 'added' | 'removed' | 'role_changed';
  role?: string;
  newRole?: string;
}

// ✅ Ownership Transfer Confirmation Email
interface SendOwnershipTransferEmailArgs {
  to: string;
  workspaceName: string;
  currentOwnerEmail: string;
  confirmationToken: string;
}

export async function sendOwnershipTransferConfirmationEmail(args: SendOwnershipTransferEmailArgs) {
  const { to, workspaceName, currentOwnerEmail, confirmationToken } = args;

  const baseUrl = process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000';
  const confirmLink = `${baseUrl}/workspace/confirm-ownership/${confirmationToken}`;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  try {
    // Use professional template
    await sendEmail(
      to,
      EmailTemplate.OWNERSHIP_TRANSFER,
      {
        currentOwnerName: currentOwnerEmail,
        newOwnerName: to,
        workspaceName,
        confirmUrl: confirmLink,
        expiresAt: expiresAt.toLocaleString('pt-BR'),
      }
    );

    return { success: true };
  } catch (error: any) {
    console.error('Failed to send ownership transfer email:', error);
    
    const logger = createLogger('workspace-emails');
    await logger.error('Failed to send ownership transfer confirmation email', {
      to,
      workspaceName,
      error: error.message,
      stack: error.stack,
    });
    
    throw new Error(`Failed to send ownership transfer email: ${error.message}`);
  }
}

export async function sendMemberNotificationEmail(args: SendMemberNotificationEmailArgs) {
  const { to, workspaceName, eventType, role, newRole } = args;

  const baseUrl = process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000';

  try {
    // Use professional templates based on event type
    switch (eventType) {
      case 'added':
        await sendEmail(
          to,
          EmailTemplate.MEMBER_ADDED,
          {
            memberName: to,
            workspaceName,
            role: role || 'Member',
            dashboardUrl: `${baseUrl}/dashboard`,
          }
        );
        break;
      case 'removed':
        await sendEmail(
          to,
          EmailTemplate.MEMBER_REMOVED,
          {
            memberName: to,
            workspaceName,
            reason: 'An admin removed you from the workspace',
          }
        );
        break;
      case 'role_changed':
        await sendEmail(
          to,
          EmailTemplate.ROLE_CHANGED,
          {
            memberName: to,
            workspaceName,
            oldRole: role || 'Member',
            newRole: newRole || 'Member',
          }
        );
        break;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to send notification email:', error);
    
    // ✅ Log to SystemLog for admin visibility
    const logger = createLogger('workspace-emails');
    await logger.warn('Failed to send member notification email', {
      to,
      workspaceName,
      eventType,
      error: error.message,
    });
    
    // Don't throw - notification emails are not critical
    return { success: false, error: error.message };
  }
}
