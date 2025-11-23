/**
 * System Email Templates
 * System announcements and administrative templates
 */

import { generateBaseTemplate, EmailComponents } from '../baseTemplate';
import type { EmailBranding } from '../types';

export const systemTemplates = {
  systemMaintenance: (
    variables: {
      title: string;
      description: string;
      startTime: string;
      endTime: string;
      duration: string;
      affectedServices: string[];
      impact: string;
      statusPageUrl?: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('🔧 Manutenção Programada')}
      
      ${EmailComponents.paragraph(
        'Informamos que haverá uma manutenção programada em nossa plataforma.'
      )}
      
      ${EmailComponents.heading(variables.title, 2)}
      
      ${EmailComponents.dataTable([
        { label: 'Início', value: variables.startTime },
        { label: 'Término Previsto', value: variables.endTime },
        { label: 'Duração', value: variables.duration },
        { label: 'Impacto', value: variables.impact },
      ])}
      
      ${EmailComponents.heading('Descrição:', 3)}
      ${EmailComponents.paragraph(variables.description)}
      
      ${EmailComponents.heading('Serviços Afetados:', 3)}
      ${EmailComponents.list(variables.affectedServices)}
      
      ${EmailComponents.infoBox(
        'Durante este período, alguns serviços podem ficar temporariamente indisponíveis ou com desempenho reduzido.',
        'info'
      )}
      
      ${variables.statusPageUrl ? `
        ${EmailComponents.button('Acompanhar Status', variables.statusPageUrl, branding?.primaryColor)}
      ` : ''}
      
      ${EmailComponents.paragraph(
        'Pedimos desculpas por qualquer inconveniente causado e agradecemos sua compreensão.'
      )}
    `;

    return generateBaseTemplate({
      preheader: `Manutenção programada: ${variables.startTime}`,
      body,
      branding,
    });
  },

  systemOutage: (
    variables: {
      title: string;
      description: string;
      startedAt: string;
      affectedServices: string[];
      status: string;
      estimatedResolution?: string;
      statusPageUrl?: string;
      updates: Array<{ time: string; message: string }>;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('🚨 Incidente do Sistema')}
      
      ${EmailComponents.infoBox(
        'Estamos cientes de um problema que está afetando nossos serviços e trabalhando ativamente para resolver.',
        'error'
      )}
      
      ${EmailComponents.heading(variables.title, 2)}
      
      ${EmailComponents.dataTable([
        { label: 'Início', value: variables.startedAt },
        { label: 'Status', value: variables.status },
        ...(variables.estimatedResolution ? [{ label: 'Resolução Estimada', value: variables.estimatedResolution }] : []),
      ])}
      
      ${EmailComponents.heading('Descrição:', 3)}
      ${EmailComponents.paragraph(variables.description)}
      
      ${EmailComponents.heading('Serviços Afetados:', 3)}
      ${EmailComponents.list(variables.affectedServices)}
      
      ${variables.updates.length > 0 ? `
        ${EmailComponents.heading('Atualizações:', 3)}
        ${variables.updates.map(update => `
          ${EmailComponents.paragraph(`<strong>${update.time}</strong>: ${update.message}`)}
        `).join('')}
      ` : ''}
      
      ${variables.statusPageUrl ? `
        ${EmailComponents.button('Página de Status', variables.statusPageUrl, branding?.primaryColor)}
      ` : ''}
      
      ${EmailComponents.paragraph(
        'Continuaremos atualizando você sobre o progresso da resolução. Pedimos desculpas pelo inconveniente.'
      )}
    `;

    return generateBaseTemplate({
      preheader: `Incidente: ${variables.title}`,
      body,
      branding,
    });
  },

  featureAnnouncement: (
    variables: {
      title: string;
      description: string;
      features: Array<{ name: string; description: string }>;
      releaseDate: string;
      learnMoreUrl?: string;
      imageUrl?: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('🚀 Novidades na Plataforma!')}
      
      ${variables.imageUrl ? `
        <div style="margin: 24px 0; text-align: center;">
          <img src="${variables.imageUrl}" alt="${variables.title}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);" />
        </div>
      ` : ''}
      
      ${EmailComponents.heading(variables.title, 2)}
      
      ${EmailComponents.paragraph(variables.description)}
      
      ${EmailComponents.dataTable([
        { label: 'Data de Lançamento', value: variables.releaseDate },
      ])}
      
      ${EmailComponents.heading('Novos Recursos:', 3)}
      
      ${variables.features.map(feature => `
        <div style="margin: 16px 0;">
          ${EmailComponents.heading(feature.name, 3, branding?.primaryColor)}
          ${EmailComponents.paragraph(feature.description)}
        </div>
      `).join('')}
      
      ${variables.learnMoreUrl ? `
        ${EmailComponents.button('Saiba Mais', variables.learnMoreUrl, branding?.primaryColor)}
      ` : ''}
      
      ${EmailComponents.paragraph(
        'Estamos sempre trabalhando para melhorar sua experiência. Obrigado por usar nossa plataforma!'
      )}
    `;

    return generateBaseTemplate({
      preheader: `Novos recursos: ${variables.title}`,
      body,
      branding,
    });
  },

  securityAlert: (
    variables: {
      title: string;
      severity: string;
      description: string;
      detectedAt: string;
      affectedUsers?: number;
      requiredActions: string[];
      deadline?: string;
      moreInfoUrl?: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('🔒 Alerta de Segurança')}
      
      ${EmailComponents.infoBox(
        `Um alerta de segurança de severidade ${variables.severity} foi emitido e requer sua atenção.`,
        'error'
      )}
      
      ${EmailComponents.heading(variables.title, 2)}
      
      ${EmailComponents.dataTable([
        { label: 'Severidade', value: variables.severity },
        { label: 'Detectado em', value: variables.detectedAt },
        ...(variables.affectedUsers ? [{ label: 'Usuários Afetados', value: String(variables.affectedUsers) }] : []),
        ...(variables.deadline ? [{ label: 'Prazo para Ação', value: variables.deadline }] : []),
      ])}
      
      ${EmailComponents.heading('Descrição:', 3)}
      ${EmailComponents.paragraph(variables.description)}
      
      ${EmailComponents.heading('Ações Necessárias:', 3)}
      ${EmailComponents.list(variables.requiredActions, true)}
      
      ${variables.moreInfoUrl ? `
        ${EmailComponents.button('Mais Informações', variables.moreInfoUrl, '#ef4444')}
      ` : ''}
      
      ${EmailComponents.infoBox(
        '⚠️ Por favor, tome as ações necessárias o mais rápido possível para garantir a segurança da sua conta e dados.',
        'warning'
      )}
      
      ${EmailComponents.paragraph(
        'Se você tiver dúvidas ou precisar de assistência, entre em contato com nosso suporte imediatamente.'
      )}
    `;

    return generateBaseTemplate({
      preheader: `Alerta de segurança: ${variables.title}`,
      body,
      branding,
    });
  },
};
