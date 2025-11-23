/**
 * Auth Email Templates
 * Authentication-related email templates
 */

import { generateBaseTemplate, EmailComponents } from '../baseTemplate';
import type { EmailBranding } from '../types';

export const authTemplates = {
  welcome: (variables: { userName: string; verificationUrl?: string }, branding?: EmailBranding) => {
    const body = `
      ${EmailComponents.heading('Bem-vindo ao ' + (branding?.companyName || 'SentinelIQ') + '! 🎉')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        'Estamos muito felizes em ter você conosco! Sua conta foi criada com sucesso e você já pode começar a usar nossa plataforma.'
      )}
      
      ${variables.verificationUrl ? `
        ${EmailComponents.paragraph(
          'Para garantir a segurança da sua conta, por favor verifique seu email clicando no botão abaixo:'
        )}
        
        ${EmailComponents.button('Verificar Email', variables.verificationUrl, branding?.primaryColor)}
        
        ${EmailComponents.infoBox(
          'Este link de verificação expira em 24 horas. Se você não solicitou esta verificação, pode ignorar este email.',
          'info'
        )}
      ` : ''}
      
      ${EmailComponents.paragraph('Se tiver alguma dúvida, nossa equipe está sempre pronta para ajudar.')}
      
      ${EmailComponents.paragraph('Atenciosamente,<br>Equipe ' + (branding?.companyName || 'SentinelIQ'))}
    `;

    return generateBaseTemplate({
      preheader: `Bem-vindo ao ${branding?.companyName || 'SentinelIQ'}!`,
      body,
      branding,
    });
  },

  emailVerification: (variables: { userName: string; verificationUrl: string }, branding?: EmailBranding) => {
    const body = `
      ${EmailComponents.heading('Verificação de Email')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        'Para concluir o cadastro na sua conta, precisamos verificar seu endereço de email.'
      )}
      
      ${EmailComponents.button('Verificar Email', variables.verificationUrl, branding?.primaryColor)}
      
      ${EmailComponents.paragraph('Ou copie e cole o link abaixo no seu navegador:')}
      
      ${EmailComponents.paragraph(
        `<a href="${variables.verificationUrl}" style="color: ${branding?.primaryColor || '#3b82f6'}; word-break: break-all;">${variables.verificationUrl}</a>`
      )}
      
      ${EmailComponents.infoBox(
        'Este link expira em 24 horas. Se você não criou uma conta, pode ignorar este email com segurança.',
        'info'
      )}
    `;

    return generateBaseTemplate({
      preheader: 'Verifique seu email para ativar sua conta',
      body,
      branding,
    });
  },

  passwordReset: (variables: { userName: string; resetUrl: string }, branding?: EmailBranding) => {
    const body = `
      ${EmailComponents.heading('Redefinir Senha')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        'Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:'
      )}
      
      ${EmailComponents.button('Redefinir Senha', variables.resetUrl, branding?.primaryColor)}
      
      ${EmailComponents.paragraph('Ou copie e cole o link abaixo no seu navegador:')}
      
      ${EmailComponents.paragraph(
        `<a href="${variables.resetUrl}" style="color: ${branding?.primaryColor || '#3b82f6'}; word-break: break-all;">${variables.resetUrl}</a>`
      )}
      
      ${EmailComponents.infoBox(
        '⚠️ Este link expira em 1 hora por segurança. Se você não solicitou a redefinição de senha, ignore este email e sua senha permanecerá inalterada.',
        'warning'
      )}
      
      ${EmailComponents.paragraph(
        'Se você está tendo problemas para redefinir sua senha, entre em contato com nosso suporte.'
      )}
    `;

    return generateBaseTemplate({
      preheader: 'Solicitação de redefinição de senha',
      body,
      branding,
    });
  },

  passwordChanged: (variables: { userName: string; changedAt: string; ipAddress?: string }, branding?: EmailBranding) => {
    const body = `
      ${EmailComponents.heading('Senha Alterada')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        'Sua senha foi alterada com sucesso. Esta é uma confirmação de que a senha da sua conta foi modificada.'
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Data e Hora', value: variables.changedAt },
        ...(variables.ipAddress ? [{ label: 'Endereço IP', value: variables.ipAddress }] : []),
      ])}
      
      ${EmailComponents.infoBox(
        '🔒 Se você não realizou esta alteração, sua conta pode estar comprometida. Entre em contato com nosso suporte imediatamente.',
        'error'
      )}
    `;

    return generateBaseTemplate({
      preheader: 'Sua senha foi alterada',
      body,
      branding,
    });
  },

  twoFactorEnabled: (variables: { userName: string; enabledAt: string; backupCodesCount: number }, branding?: EmailBranding) => {
    const body = `
      ${EmailComponents.heading('Autenticação de Dois Fatores Ativada ✅')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        'A autenticação de dois fatores (2FA) foi ativada com sucesso na sua conta. Isso adiciona uma camada extra de segurança.'
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Ativado em', value: variables.enabledAt },
        { label: 'Códigos de Backup', value: `${variables.backupCodesCount} gerados` },
      ])}
      
      ${EmailComponents.infoBox(
        '💡 Importante: Guarde seus códigos de backup em um local seguro. Você precisará deles caso perca acesso ao seu autenticador.',
        'info'
      )}
      
      ${EmailComponents.paragraph(
        'Agora, sempre que fizer login, você precisará fornecer um código do seu aplicativo autenticador.'
      )}
    `;

    return generateBaseTemplate({
      preheader: '2FA ativado com sucesso',
      body,
      branding,
    });
  },

  twoFactorDisabled: (variables: { userName: string; disabledAt: string }, branding?: EmailBranding) => {
    const body = `
      ${EmailComponents.heading('Autenticação de Dois Fatores Desativada')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        'A autenticação de dois fatores (2FA) foi desativada na sua conta.'
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Desativado em', value: variables.disabledAt },
      ])}
      
      ${EmailComponents.infoBox(
        '⚠️ Sua conta agora está menos protegida. Recomendamos fortemente reativar o 2FA para manter sua conta segura.',
        'warning'
      )}
      
      ${EmailComponents.paragraph(
        'Se você não realizou esta ação, entre em contato com nosso suporte imediatamente.'
      )}
    `;

    return generateBaseTemplate({
      preheader: '2FA desativado',
      body,
      branding,
    });
  },

  accountLocked: (variables: { userName: string; lockedUntil: string; attempts: number }, branding?: EmailBranding) => {
    const body = `
      ${EmailComponents.heading('Conta Temporariamente Bloqueada 🔒')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        `Sua conta foi temporariamente bloqueada após ${variables.attempts} tentativas de login falhadas.`
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Bloqueada até', value: variables.lockedUntil },
        { label: 'Tentativas', value: `${variables.attempts} tentativas falhadas` },
      ])}
      
      ${EmailComponents.infoBox(
        'Você poderá fazer login novamente após o período de bloqueio. Se você esqueceu sua senha, use a opção "Esqueci minha senha" na tela de login.',
        'warning'
      )}
      
      ${EmailComponents.infoBox(
        '🚨 Se você não tentou fazer login, sua conta pode estar sob ataque. Entre em contato com nosso suporte imediatamente.',
        'error'
      )}
    `;

    return generateBaseTemplate({
      preheader: 'Sua conta foi temporariamente bloqueada',
      body,
      branding,
    });
  },
};
