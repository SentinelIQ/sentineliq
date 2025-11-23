/**
 * Notification Email Templates
 * Security alerts and incident notification templates
 */

import { generateBaseTemplate, EmailComponents } from '../baseTemplate';
import type { EmailBranding } from '../types';

export const notificationTemplates = {
  incidentCritical: (
    variables: {
      incidentId: string;
      title: string;
      severity: string;
      description: string;
      affectedSystems: string[];
      detectedAt: string;
      incidentUrl: string;
      assignee?: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('🚨 Incidente Crítico Detectado')}
      
      ${EmailComponents.infoBox(
        `Um incidente de severidade ${variables.severity} foi detectado e requer atenção imediata.`,
        'error'
      )}
      
      ${EmailComponents.heading(variables.title, 2)}
      
      ${EmailComponents.dataTable([
        { label: 'ID do Incidente', value: variables.incidentId },
        { label: 'Severidade', value: variables.severity },
        { label: 'Detectado em', value: variables.detectedAt },
        ...(variables.assignee ? [{ label: 'Responsável', value: variables.assignee }] : []),
      ])}
      
      ${EmailComponents.heading('Descrição:', 3)}
      ${EmailComponents.paragraph(variables.description)}
      
      ${EmailComponents.heading('Sistemas Afetados:', 3)}
      ${EmailComponents.list(variables.affectedSystems)}
      
      ${EmailComponents.button('Ver Detalhes do Incidente', variables.incidentUrl, '#ef4444')}
      
      ${EmailComponents.infoBox(
        '⏰ Incidentes críticos requerem resposta imediata de acordo com suas políticas de SLA.',
        'warning'
      )}
    `;

    return generateBaseTemplate({
      preheader: `Incidente crítico: ${variables.title}`,
      body,
      branding,
    });
  },

  alertHighSeverity: (
    variables: {
      alertId: string;
      title: string;
      severity: string;
      source: string;
      detectedAt: string;
      description: string;
      recommendedActions: string[];
      alertUrl: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('⚠️ Alerta de Alta Severidade')}
      
      ${EmailComponents.paragraph(
        `Um alerta de ${variables.severity} foi detectado em seu ambiente.`
      )}
      
      ${EmailComponents.heading(variables.title, 2)}
      
      ${EmailComponents.dataTable([
        { label: 'ID do Alerta', value: variables.alertId },
        { label: 'Severidade', value: variables.severity },
        { label: 'Origem', value: variables.source },
        { label: 'Detectado em', value: variables.detectedAt },
      ])}
      
      ${EmailComponents.heading('Descrição:', 3)}
      ${EmailComponents.paragraph(variables.description)}
      
      ${EmailComponents.heading('Ações Recomendadas:', 3)}
      ${EmailComponents.list(variables.recommendedActions, true)}
      
      ${EmailComponents.button('Ver Alerta Completo', variables.alertUrl, '#f59e0b')}
    `;

    return generateBaseTemplate({
      preheader: `Alerta: ${variables.title}`,
      body,
      branding,
    });
  },

  caseAssigned: (
    variables: {
      assigneeName: string;
      caseId: string;
      title: string;
      priority: string;
      assignedBy: string;
      dueDate?: string;
      description: string;
      caseUrl: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Caso Atribuído a Você 📋')}
      
      ${EmailComponents.paragraph(`Olá ${variables.assigneeName},`)}
      
      ${EmailComponents.paragraph(
        `Um novo caso foi atribuído a você por ${variables.assignedBy}.`
      )}
      
      ${EmailComponents.heading(variables.title, 2)}
      
      ${EmailComponents.dataTable([
        { label: 'ID do Caso', value: variables.caseId },
        { label: 'Prioridade', value: variables.priority },
        { label: 'Atribuído por', value: variables.assignedBy },
        ...(variables.dueDate ? [{ label: 'Prazo', value: variables.dueDate }] : []),
      ])}
      
      ${EmailComponents.heading('Descrição:', 3)}
      ${EmailComponents.paragraph(variables.description)}
      
      ${EmailComponents.button('Abrir Caso', variables.caseUrl, branding?.primaryColor)}
      
      ${variables.dueDate ? EmailComponents.infoBox(
        `⏰ Este caso tem prazo definido. Certifique-se de revisar e atualizar o status conforme necessário.`,
        'info'
      ) : ''}
    `;

    return generateBaseTemplate({
      preheader: `Novo caso atribuído: ${variables.title}`,
      body,
      branding,
    });
  },

  slaBreachWarning: (
    variables: {
      itemType: 'incident' | 'case' | 'alert';
      itemId: string;
      title: string;
      slaTarget: string;
      timeRemaining: string;
      currentStatus: string;
      assignee?: string;
      itemUrl: string;
    },
    branding?: EmailBranding
  ) => {
    const itemTypeLabels = {
      incident: 'Incidente',
      case: 'Caso',
      alert: 'Alerta',
    };

    const body = `
      ${EmailComponents.heading('⏰ Aviso de Violação de SLA')}
      
      ${EmailComponents.infoBox(
        `O ${itemTypeLabels[variables.itemType]} abaixo está próximo de violar o SLA definido.`,
        'warning'
      )}
      
      ${EmailComponents.heading(variables.title, 2)}
      
      ${EmailComponents.dataTable([
        { label: 'Tipo', value: itemTypeLabels[variables.itemType] },
        { label: 'ID', value: variables.itemId },
        { label: 'Meta de SLA', value: variables.slaTarget },
        { label: 'Tempo Restante', value: variables.timeRemaining },
        { label: 'Status Atual', value: variables.currentStatus },
        ...(variables.assignee ? [{ label: 'Responsável', value: variables.assignee }] : []),
      ])}
      
      ${EmailComponents.button('Atualizar Agora', variables.itemUrl, '#ef4444')}
      
      ${EmailComponents.infoBox(
        '🚨 Ação imediata necessária para evitar violação de SLA e possíveis impactos no serviço.',
        'error'
      )}
    `;

    return generateBaseTemplate({
      preheader: `SLA próximo de expirar: ${variables.title}`,
      body,
      branding,
    });
  },
};
