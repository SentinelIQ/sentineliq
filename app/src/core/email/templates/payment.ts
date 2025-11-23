/**
 * Payment Email Templates
 * Payment and subscription-related email templates
 */

import { generateBaseTemplate, EmailComponents } from '../baseTemplate';
import type { EmailBranding } from '../types';

export const paymentTemplates = {
  paymentSuccess: (
    variables: {
      userName: string;
      amount: string;
      plan: string;
      invoiceUrl?: string;
      nextBillingDate?: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Pagamento Confirmado ✅')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        'Seu pagamento foi processado com sucesso! Obrigado por escolher o ' + (branding?.companyName || 'SentinelIQ') + '.'
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Plano', value: variables.plan },
        { label: 'Valor', value: variables.amount },
        ...(variables.nextBillingDate ? [{ label: 'Próxima Cobrança', value: variables.nextBillingDate }] : []),
      ])}
      
      ${variables.invoiceUrl ? `
        ${EmailComponents.button('Baixar Nota Fiscal', variables.invoiceUrl, branding?.primaryColor)}
      ` : ''}
      
      ${EmailComponents.paragraph(
        'Sua assinatura está ativa e você tem acesso a todos os recursos do seu plano.'
      )}
    `;

    return generateBaseTemplate({
      preheader: 'Pagamento processado com sucesso',
      body,
      branding,
    });
  },

  paymentFailed: (
    variables: {
      userName: string;
      amount: string;
      plan: string;
      reason?: string;
      retryDate?: string;
      updatePaymentUrl: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Falha no Pagamento ⚠️')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        'Não conseguimos processar seu pagamento. Sua assinatura pode ser suspensa se o pagamento não for realizado.'
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Plano', value: variables.plan },
        { label: 'Valor', value: variables.amount },
        ...(variables.reason ? [{ label: 'Motivo', value: variables.reason }] : []),
        ...(variables.retryDate ? [{ label: 'Nova Tentativa em', value: variables.retryDate }] : []),
      ])}
      
      ${EmailComponents.button('Atualizar Forma de Pagamento', variables.updatePaymentUrl, '#ef4444')}
      
      ${EmailComponents.infoBox(
        'Por favor, atualize sua forma de pagamento o quanto antes para evitar a interrupção do serviço.',
        'error'
      )}
    `;

    return generateBaseTemplate({
      preheader: 'Ação necessária: Falha no pagamento',
      body,
      branding,
    });
  },

  subscriptionCreated: (
    variables: {
      userName: string;
      plan: string;
      amount: string;
      features: string[];
      dashboardUrl: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Assinatura Ativada 🎉')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        'Sua assinatura foi ativada com sucesso! Você agora tem acesso completo ao plano ' + variables.plan + '.'
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Plano', value: variables.plan },
        { label: 'Valor Mensal', value: variables.amount },
      ])}
      
      ${EmailComponents.heading('Recursos Incluídos:', 3)}
      
      ${EmailComponents.list(variables.features)}
      
      ${EmailComponents.button('Acessar Dashboard', variables.dashboardUrl, branding?.primaryColor)}
      
      ${EmailComponents.paragraph(
        'Se tiver alguma dúvida sobre seu plano, nossa equipe está à disposição para ajudar.'
      )}
    `;

    return generateBaseTemplate({
      preheader: `Bem-vindo ao plano ${variables.plan}!`,
      body,
      branding,
    });
  },

  subscriptionCancelled: (
    variables: {
      userName: string;
      plan: string;
      cancelledAt: string;
      accessUntil: string;
      reason?: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Assinatura Cancelada')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        'Confirmamos o cancelamento da sua assinatura. Sentimos muito em ver você partir.'
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Plano Cancelado', value: variables.plan },
        { label: 'Data do Cancelamento', value: variables.cancelledAt },
        { label: 'Acesso até', value: variables.accessUntil },
        ...(variables.reason ? [{ label: 'Motivo', value: variables.reason }] : []),
      ])}
      
      ${EmailComponents.infoBox(
        'Você manterá acesso aos recursos do seu plano até a data indicada acima. Depois disso, sua conta será migrada para o plano gratuito.',
        'info'
      )}
      
      ${EmailComponents.paragraph(
        'Gostaríamos muito de ter você de volta! Se tiver algum feedback sobre o serviço, por favor nos avise.'
      )}
    `;

    return generateBaseTemplate({
      preheader: 'Confirmação de cancelamento de assinatura',
      body,
      branding,
    });
  },

  trialStarted: (
    variables: {
      userName: string;
      plan: string;
      trialDays: number;
      trialEndsAt: string;
      features: string[];
      dashboardUrl: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Período de Teste Iniciado 🚀')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        `Seu período de teste de ${variables.trialDays} dias do plano ${variables.plan} começou! Aproveite para explorar todos os recursos.`
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Plano em Teste', value: variables.plan },
        { label: 'Duração', value: `${variables.trialDays} dias` },
        { label: 'Termina em', value: variables.trialEndsAt },
      ])}
      
      ${EmailComponents.heading('O que você pode fazer:', 3)}
      
      ${EmailComponents.list(variables.features)}
      
      ${EmailComponents.button('Começar Agora', variables.dashboardUrl, branding?.primaryColor)}
      
      ${EmailComponents.infoBox(
        'Após o período de teste, você pode escolher um plano pago ou continuar com o plano gratuito.',
        'info'
      )}
    `;

    return generateBaseTemplate({
      preheader: `Seu teste de ${variables.trialDays} dias começou!`,
      body,
      branding,
    });
  },

  trialEnding: (
    variables: {
      userName: string;
      plan: string;
      daysLeft: number;
      trialEndsAt: string;
      upgradeUrl: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Seu Teste Está Terminando ⏰')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        `Seu período de teste do plano ${variables.plan} termina em ${variables.daysLeft} dia(s).`
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Plano em Teste', value: variables.plan },
        { label: 'Dias Restantes', value: `${variables.daysLeft} dia(s)` },
        { label: 'Termina em', value: variables.trialEndsAt },
      ])}
      
      ${EmailComponents.paragraph(
        'Para continuar aproveitando todos os recursos premium, faça upgrade agora:'
      )}
      
      ${EmailComponents.button('Fazer Upgrade', variables.upgradeUrl, branding?.primaryColor)}
      
      ${EmailComponents.infoBox(
        'Após o término do teste, você será migrado para o plano gratuito e perderá acesso aos recursos premium.',
        'warning'
      )}
    `;

    return generateBaseTemplate({
      preheader: `${variables.daysLeft} dia(s) restantes no seu teste`,
      body,
      branding,
    });
  },

  trialEnded: (
    variables: {
      userName: string;
      plan: string;
      endedAt: string;
      upgradeUrl: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Período de Teste Encerrado')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        `Seu período de teste do plano ${variables.plan} terminou. Esperamos que tenha gostado da experiência!`
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Plano Testado', value: variables.plan },
        { label: 'Encerrado em', value: variables.endedAt },
      ])}
      
      ${EmailComponents.paragraph(
        'Sua conta foi migrada para o plano gratuito. Você ainda pode acessar os recursos básicos da plataforma.'
      )}
      
      ${EmailComponents.button('Fazer Upgrade Agora', variables.upgradeUrl, branding?.primaryColor)}
      
      ${EmailComponents.paragraph(
        'Tem alguma dúvida? Nossa equipe está pronta para ajudar você a escolher o melhor plano.'
      )}
    `;

    return generateBaseTemplate({
      preheader: 'Seu período de teste terminou',
      body,
      branding,
    });
  },

  invoicePaid: (
    variables: {
      userName: string;
      invoiceNumber: string;
      amount: string;
      paidAt: string;
      plan: string;
      billingPeriod: string;
      invoiceUrl: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Fatura Paga ✅')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        'Confirmamos o pagamento da sua fatura. Obrigado pela sua confiança!'
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Número da Fatura', value: variables.invoiceNumber },
        { label: 'Valor', value: variables.amount },
        { label: 'Plano', value: variables.plan },
        { label: 'Período', value: variables.billingPeriod },
        { label: 'Pago em', value: variables.paidAt },
      ])}
      
      ${EmailComponents.button('Baixar Fatura', variables.invoiceUrl, branding?.primaryColor)}
      
      ${EmailComponents.paragraph(
        'Sua próxima cobrança será processada automaticamente no próximo período de faturamento.'
      )}
    `;

    return generateBaseTemplate({
      preheader: `Fatura ${variables.invoiceNumber} paga`,
      body,
      branding,
    });
  },

  invoicePaymentFailed: (
    variables: {
      userName: string;
      invoiceNumber: string;
      amount: string;
      dueDate: string;
      plan: string;
      reason?: string;
      updatePaymentUrl: string;
      invoiceUrl: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Falha no Pagamento da Fatura ⚠️')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        'Não conseguimos processar o pagamento da sua fatura. Por favor, atualize sua forma de pagamento para evitar a suspensão do serviço.'
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Número da Fatura', value: variables.invoiceNumber },
        { label: 'Valor', value: variables.amount },
        { label: 'Plano', value: variables.plan },
        { label: 'Vencimento', value: variables.dueDate },
        ...(variables.reason ? [{ label: 'Motivo', value: variables.reason }] : []),
      ])}
      
      ${EmailComponents.button('Atualizar Pagamento', variables.updatePaymentUrl, '#ef4444')}
      
      ${EmailComponents.button('Ver Fatura', variables.invoiceUrl, branding?.secondaryColor)}
      
      ${EmailComponents.infoBox(
        '🚨 Seu serviço pode ser suspenso se o pagamento não for realizado em breve. Por favor, atualize sua forma de pagamento o quanto antes.',
        'error'
      )}
    `;

    return generateBaseTemplate({
      preheader: 'Ação necessária: Falha no pagamento da fatura',
      body,
      branding,
    });
  },
};
