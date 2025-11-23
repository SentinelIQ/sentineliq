/**
 * Workspace Email Templates
 * Workspace management and collaboration email templates
 */

import { generateBaseTemplate, EmailComponents } from '../baseTemplate';
import type { EmailBranding } from '../types';

export const workspaceTemplates = {
  workspaceCreated: (
    variables: {
      userName: string;
      workspaceName: string;
      workspaceUrl: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Workspace Criado com Sucesso! 🎉')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        `Seu workspace "${variables.workspaceName}" foi criado com sucesso e está pronto para uso!`
      )}
      
      ${EmailComponents.paragraph(
        'Agora você pode convidar membros da equipe, configurar integrações e começar a gerenciar sua segurança de forma centralizada.'
      )}
      
      ${EmailComponents.button('Acessar Workspace', variables.workspaceUrl, branding?.primaryColor)}
      
      ${EmailComponents.heading('Próximos Passos:', 3)}
      
      ${EmailComponents.list([
        'Convide membros da sua equipe',
        'Configure as integrações necessárias',
        'Defina políticas de segurança',
        'Explore os módulos disponíveis',
      ])}
    `;

    return generateBaseTemplate({
      preheader: `Workspace ${variables.workspaceName} criado`,
      body,
      branding,
    });
  },

  workspaceInvitation: (
    variables: {
      inviterName: string;
      workspaceName: string;
      role: string;
      acceptUrl: string;
      expiresAt: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Você foi convidado para um Workspace! 🎯')}
      
      ${EmailComponents.paragraph(
        `${variables.inviterName} convidou você para participar do workspace "${variables.workspaceName}".`
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Workspace', value: variables.workspaceName },
        { label: 'Convidado por', value: variables.inviterName },
        { label: 'Função', value: variables.role },
        { label: 'Convite expira em', value: variables.expiresAt },
      ])}
      
      ${EmailComponents.paragraph(
        'Clique no botão abaixo para aceitar o convite e começar a colaborar:'
      )}
      
      ${EmailComponents.button('Aceitar Convite', variables.acceptUrl, branding?.primaryColor)}
      
      ${EmailComponents.infoBox(
        'Este convite é pessoal e intransferível. Se você não conhece o remetente ou não esperava este convite, pode ignorar este email.',
        'info'
      )}
    `;

    return generateBaseTemplate({
      preheader: `Convite para ${variables.workspaceName}`,
      body,
      branding,
    });
  },

  ownershipTransfer: (
    variables: {
      currentOwnerName: string;
      newOwnerName: string;
      workspaceName: string;
      confirmUrl: string;
      expiresAt: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Transferência de Propriedade do Workspace')}
      
      ${EmailComponents.paragraph(`Olá ${variables.newOwnerName},`)}
      
      ${EmailComponents.paragraph(
        `${variables.currentOwnerName} deseja transferir a propriedade do workspace "${variables.workspaceName}" para você.`
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Workspace', value: variables.workspaceName },
        { label: 'Proprietário Atual', value: variables.currentOwnerName },
        { label: 'Novo Proprietário', value: variables.newOwnerName },
        { label: 'Confirmação expira em', value: variables.expiresAt },
      ])}
      
      ${EmailComponents.infoBox(
        '⚠️ Como proprietário, você terá controle total sobre o workspace, incluindo gerenciamento de membros, pagamentos e configurações.',
        'warning'
      )}
      
      ${EmailComponents.paragraph(
        'Se você aceita esta responsabilidade, clique no botão abaixo para confirmar:'
      )}
      
      ${EmailComponents.button('Confirmar Transferência', variables.confirmUrl, branding?.primaryColor)}
      
      ${EmailComponents.paragraph(
        'Se você não esperava esta transferência ou tem dúvidas, entre em contato com o proprietário atual.'
      )}
    `;

    return generateBaseTemplate({
      preheader: `Transferência de propriedade: ${variables.workspaceName}`,
      body,
      branding,
    });
  },

  ownershipTransferCompleted: (
    variables: {
      userName: string;
      workspaceName: string;
      newOwnerName: string;
      transferredAt: string;
      workspaceUrl: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Transferência de Propriedade Concluída ✅')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        `A propriedade do workspace "${variables.workspaceName}" foi transferida com sucesso para ${variables.newOwnerName}.`
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Workspace', value: variables.workspaceName },
        { label: 'Novo Proprietário', value: variables.newOwnerName },
        { label: 'Data da Transferência', value: variables.transferredAt },
      ])}
      
      ${EmailComponents.paragraph(
        'Sua função no workspace foi alterada para Administrador. Você mantém acesso a quase todos os recursos, exceto transferência de propriedade e exclusão do workspace.'
      )}
      
      ${EmailComponents.button('Acessar Workspace', variables.workspaceUrl, branding?.primaryColor)}
    `;

    return generateBaseTemplate({
      preheader: 'Transferência de propriedade concluída',
      body,
      branding,
    });
  },

  memberAdded: (
    variables: {
      userName: string;
      workspaceName: string;
      role: string;
      addedBy: string;
      workspaceUrl: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Bem-vindo ao Workspace! 👋')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        `Você foi adicionado ao workspace "${variables.workspaceName}" por ${variables.addedBy}.`
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Workspace', value: variables.workspaceName },
        { label: 'Sua Função', value: variables.role },
        { label: 'Adicionado por', value: variables.addedBy },
      ])}
      
      ${EmailComponents.button('Acessar Workspace', variables.workspaceUrl, branding?.primaryColor)}
      
      ${EmailComponents.paragraph(
        'Você agora tem acesso aos recursos e dados deste workspace de acordo com suas permissões.'
      )}
    `;

    return generateBaseTemplate({
      preheader: `Você foi adicionado ao ${variables.workspaceName}`,
      body,
      branding,
    });
  },

  memberRemoved: (
    variables: {
      userName: string;
      workspaceName: string;
      removedBy: string;
      removedAt: string;
      reason?: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Removido do Workspace')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        `Você foi removido do workspace "${variables.workspaceName}".`
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Workspace', value: variables.workspaceName },
        { label: 'Removido por', value: variables.removedBy },
        { label: 'Data', value: variables.removedAt },
        ...(variables.reason ? [{ label: 'Motivo', value: variables.reason }] : []),
      ])}
      
      ${EmailComponents.paragraph(
        'Você não tem mais acesso aos dados e recursos deste workspace.'
      )}
      
      ${EmailComponents.paragraph(
        'Se você acredita que isso foi um erro, entre em contato com o administrador do workspace.'
      )}
    `;

    return generateBaseTemplate({
      preheader: `Você foi removido de ${variables.workspaceName}`,
      body,
      branding,
    });
  },

  roleChanged: (
    variables: {
      userName: string;
      workspaceName: string;
      oldRole: string;
      newRole: string;
      changedBy: string;
      workspaceUrl: string;
    },
    branding?: EmailBranding
  ) => {
    const body = `
      ${EmailComponents.heading('Sua Função Foi Alterada')}
      
      ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
      
      ${EmailComponents.paragraph(
        `Sua função no workspace "${variables.workspaceName}" foi alterada.`
      )}
      
      ${EmailComponents.dataTable([
        { label: 'Workspace', value: variables.workspaceName },
        { label: 'Função Anterior', value: variables.oldRole },
        { label: 'Nova Função', value: variables.newRole },
        { label: 'Alterado por', value: variables.changedBy },
      ])}
      
      ${EmailComponents.paragraph(
        'Suas permissões e acessos foram atualizados de acordo com a nova função.'
      )}
      
      ${EmailComponents.button('Acessar Workspace', variables.workspaceUrl, branding?.primaryColor)}
    `;

    return generateBaseTemplate({
      preheader: `Sua função no ${variables.workspaceName} foi alterada`,
      body,
      branding,
    });
  },
};
