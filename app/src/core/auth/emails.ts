import { type GetVerificationEmailContentFn, type GetPasswordResetEmailContentFn } from 'wasp/server/auth';
import { renderEmailTemplate, EmailTemplate } from '../email/renderer';
import { generateBaseTemplate, EmailComponents } from '../email/baseTemplate';

/**
 * Email verification - Using professional template
 */
export const getVerificationEmailContent: GetVerificationEmailContentFn = ({ verificationLink }: any) => {
  const html = renderEmailTemplate(
    EmailTemplate.EMAIL_VERIFICATION,
    {
      userName: 'Usuário', // Username não disponível aqui, Wasp não passa
      verificationUrl: verificationLink,
    }
  );

  return {
    subject: 'Verifique seu email - SentinelIQ',
    text: `Verifique seu email clicando no link: ${verificationLink}`,
    html,
  };
};

/**
 * Password reset - Using professional template
 */
export const getPasswordResetEmailContent: GetPasswordResetEmailContentFn = ({ passwordResetLink }: any) => {
  const html = renderEmailTemplate(
    EmailTemplate.PASSWORD_RESET,
    {
      userName: 'Usuário', // Username não disponível aqui, Wasp não passa
      resetUrl: passwordResetLink,
    }
  );

  return {
    subject: 'Redefinir senha - SentinelIQ',
    text: `Redefina sua senha clicando no link: ${passwordResetLink}`,
    html,
  };
};
