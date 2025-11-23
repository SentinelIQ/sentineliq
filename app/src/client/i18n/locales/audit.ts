export const auditEN = {
  "title": "Audit Logs",
  "subtitle": "Track all actions and changes in your workspace for compliance and security",
  "export": "Export",
  "filters": {
    "title": "Filters",
    "description": "Filter audit logs by action and resource",
    "actionType": "Action Type",
    "allActions": "All Actions",
    "resource": "Resource",
    "resourcePlaceholder": "e.g., workspace, member, payment...",
    "clear": "Clear"
  },
  "actions": {
    "WORKSPACE_CREATED": "Workspace Created",
    "WORKSPACE_UPDATED": "Workspace Updated",
    "WORKSPACE_DELETED": "Workspace Deleted",
    "MEMBER_ADDED": "Member Added",
    "MEMBER_REMOVED": "Member Removed",
    "MEMBER_ROLE_CHANGED": "Role Changed",
    "OWNERSHIP_TRANSFERRED": "Ownership Transferred",
    "PAYMENT_SUCCEEDED": "Payment Succeeded",
    "PAYMENT_FAILED": "Payment Failed",
    "SUBSCRIPTION_CHANGED": "Subscription Changed",
    "PROVIDER_CONFIGURED": "Provider Configured",
    "SETTINGS_UPDATED": "Settings Updated"
  },
  "timeline": {
    "title": "Activity Timeline",
    "total": "{{count}} total",
    "by": "by",
    "unknown": "Unknown",
    "viewDetails": "View details",
    "ipAddress": "IP",
    "noLogs": "No audit logs found",
    "loading": "Loading audit logs...",
    "error": "Error loading audit logs: {{message}}"
  },
  "pagination": {
    "showing": "Showing {{start}} - {{end}} of {{total}}",
    "previous": "Previous",
    "next": "Next"
  },
  "messages": {
    "exportSoon": "Export functionality coming soon!"
  }
} as const;

export const auditPT = {
  "title": "Logs de Auditoria",
  "subtitle": "Rastreie todas as ações e alterações em seu workspace para conformidade e segurança",
  "export": "Exportar",
  "filters": {
    "title": "Filtros",
    "description": "Filtrar logs de auditoria por ação e recurso",
    "actionType": "Tipo de Ação",
    "allActions": "Todas as Ações",
    "resource": "Recurso",
    "resourcePlaceholder": "ex: workspace, membro, pagamento...",
    "clear": "Limpar"
  },
  "actions": {
    "WORKSPACE_CREATED": "Workspace Criado",
    "WORKSPACE_UPDATED": "Workspace Atualizado",
    "WORKSPACE_DELETED": "Workspace Excluído",
    "MEMBER_ADDED": "Membro Adicionado",
    "MEMBER_REMOVED": "Membro Removido",
    "MEMBER_ROLE_CHANGED": "Papel Alterado",
    "OWNERSHIP_TRANSFERRED": "Propriedade Transferida",
    "PAYMENT_SUCCEEDED": "Pagamento Bem-sucedido",
    "PAYMENT_FAILED": "Pagamento Falhou",
    "SUBSCRIPTION_CHANGED": "Assinatura Alterada",
    "PROVIDER_CONFIGURED": "Provedor Configurado",
    "SETTINGS_UPDATED": "Configurações Atualizadas"
  },
  "timeline": {
    "title": "Linha do Tempo de Atividades",
    "total": "{{count}} total",
    "by": "por",
    "unknown": "Desconhecido",
    "viewDetails": "Ver detalhes",
    "ipAddress": "IP",
    "noLogs": "Nenhum log de auditoria encontrado",
    "loading": "Carregando logs de auditoria...",
    "error": "Erro ao carregar logs de auditoria: {{message}}"
  },
  "pagination": {
    "showing": "Mostrando {{start}} - {{end}} de {{total}}",
    "previous": "Anterior",
    "next": "Próximo"
  },
  "messages": {
    "exportSoon": "Funcionalidade de exportação em breve!"
  }
} as const;
