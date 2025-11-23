export const adminEN = {
  "title": "Admin Dashboard",
  "users": {
    "title": "User Management",
    "totalUsers": "Total Users",
    "activeUsers": "Active Users",
    "newUsers": "New Users",
    "table": {
      "email": "Email",
      "name": "Name",
      "role": "Role",
      "status": "Status",
      "created": "Created",
      "actions": "Actions"
    },
    "actions": {
      "makeAdmin": "Make Admin",
      "removeAdmin": "Remove Admin",
      "suspend": "Suspend",
      "activate": "Activate",
      "delete": "Delete"
    }
  },
  "stats": {
    "title": "System Statistics",
    "overview": "Overview",
    "signups": "Sign-ups",
    "revenue": "Revenue",
    "activeSubscriptions": "Active Subscriptions",
    "mrr": "Monthly Recurring Revenue"
  },
  "logs": {
    "title": "System Logs",
    "level": "Level",
    "message": "Message",
    "timestamp": "Timestamp",
    "source": "Source",
    "filter": {
      "all": "All",
      "error": "Errors",
      "warning": "Warnings",
      "info": "Info"
    }
  },
  "workspaces": {
    "title": "Workspace Management",
    "totalWorkspaces": "Total Workspaces",
    "table": {
      "name": "Name",
      "owner": "Owner",
      "members": "Members",
      "plan": "Plan",
      "created": "Created",
      "actions": "Actions"
    }
  },
  "settings": {
    "title": "System Settings",
    "general": "General",
    "security": "Security",
    "email": "Email",
    "storage": "Storage",
    "integrations": "Integrations"
  },
  "database": {
    "title": "Database Management",
    "subtitle": "Backup, recovery, monitoring, and performance testing",
    "tabs": {
      "backups": "Backups",
      "recovery": "Recovery",
      "monitoring": "Monitoring",
      "performance": "Performance"
    },
    "stats": {
      "totalBackups": "Total Backups",
      "newestBackup": "Newest Backup",
      "actions": "Actions"
    },
    "backupHistory": "Backup History",
    "backupDaily": "All database backups (daily at 1 AM)",
    "createBackup": "Create Backup Now",
    "noBackups": "No backups found. Create your first backup!",
    "loadingBackups": "Loading backups..."
  },
  "systemLogs": {
    "title": "System Logs",
    "subtitle": "Technical logs for debugging and monitoring system health",
    "filters": "Filters",
    "filterDescription": "Filter logs by level and component",
    "logLevel": "Log Level",
    "allLevels": "All Levels",
    "component": "Component",
    "componentPlaceholder": "e.g., job, api, webhook...",
    "clear": "Clear",
    "total": "total",
    "loading": "Loading logs...",
    "error": "Error loading logs",
    "noLogs": "No logs found",
    "viewMetadata": "View metadata",
    "showing": "Showing",
    "of": "of",
    "previous": "Previous",
    "next": "Next",
    "levels": {
      "DEBUG": "Debug",
      "INFO": "Info",
      "WARN": "Warning",
      "ERROR": "Error",
      "CRITICAL": "Critical"
    }
  },
  "jobs": {
    "title": "Background Jobs",
    "subtitle": "Monitor and manage scheduled jobs",
    "refresh": "Refresh",
    "loadingJobs": "Loading jobs...",
    "states": {
      "completed": "Completed",
      "active": "Active",
      "failed": "Failed",
      "error": "Error",
      "running": "Running",
      "unknown": "Unknown"
    },
    "triggered": "Job triggered successfully",
    "triggerError": "Failed to trigger job"
  }
} as const;

export const adminPT = {
  "title": "Painel Administrativo",
  "users": {
    "title": "Gerenciamento de Usuários",
    "totalUsers": "Total de Usuários",
    "activeUsers": "Usuários Ativos",
    "newUsers": "Novos Usuários",
    "table": {
      "email": "E-mail",
      "name": "Nome",
      "role": "Função",
      "status": "Status",
      "created": "Criado em",
      "actions": "Ações"
    },
    "actions": {
      "makeAdmin": "Tornar Admin",
      "removeAdmin": "Remover Admin",
      "suspend": "Suspender",
      "activate": "Ativar",
      "delete": "Excluir"
    }
  },
  "stats": {
    "title": "Estatísticas do Sistema",
    "overview": "Visão Geral",
    "signups": "Cadastros",
    "revenue": "Receita",
    "activeSubscriptions": "Assinaturas Ativas",
    "mrr": "Receita Recorrente Mensal"
  },
  "logs": {
    "title": "Logs do Sistema",
    "level": "Nível",
    "message": "Mensagem",
    "timestamp": "Data/Hora",
    "source": "Origem",
    "filter": {
      "all": "Todos",
      "error": "Erros",
      "warning": "Avisos",
      "info": "Info"
    }
  },
  "workspaces": {
    "title": "Gerenciamento de Workspaces",
    "totalWorkspaces": "Total de Workspaces",
    "table": {
      "name": "Nome",
      "owner": "Proprietário",
      "members": "Membros",
      "plan": "Plano",
      "created": "Criado em",
      "actions": "Ações"
    }
  },
  "settings": {
    "title": "Configurações do Sistema",
    "general": "Geral",
    "security": "Segurança",
    "email": "E-mail",
    "storage": "Armazenamento",
    "integrations": "Integrações"
  },
  "database": {
    "title": "Gerenciamento de Banco de Dados",
    "subtitle": "Backup, recuperação, monitoramento e teste de desempenho",
    "tabs": {
      "backups": "Backups",
      "recovery": "Recuperação",
      "monitoring": "Monitoramento",
      "performance": "Desempenho"
    },
    "stats": {
      "totalBackups": "Total de Backups",
      "newestBackup": "Backup Máis Recente",
      "actions": "Ações"
    },
    "backupHistory": "Histórico de Backups",
    "backupDaily": "Todos os backups do banco de dados (diário às 1 AM)",
    "createBackup": "Criar Backup Agora",
    "noBackups": "Nenhum backup encontrado. Crie seu primeiro backup!",
    "loadingBackups": "Carregando backups..."
  },
  "systemLogs": {
    "title": "Logs do Sistema",
    "subtitle": "Logs técnicos para depuração e monitoramento da saúde do sistema",
    "filters": "Filtros",
    "filterDescription": "Filtre os logs por nível e componente",
    "logLevel": "Nível de Log",
    "allLevels": "Todos os Níveis",
    "component": "Componente",
    "componentPlaceholder": "ex: job, api, webhook...",
    "clear": "Limpar",
    "total": "total",
    "loading": "Carregando logs...",
    "error": "Erro ao carregar logs",
    "noLogs": "Nenhum log encontrado",
    "viewMetadata": "Ver metadados",
    "showing": "Exibindo",
    "of": "de",
    "previous": "Anterior",
    "next": "Próximo",
    "levels": {
      "DEBUG": "Debug",
      "INFO": "Informação",
      "WARN": "Aviso",
      "ERROR": "Erro",
      "CRITICAL": "Crítico"
    }
  },
  "jobs": {
    "title": "Tarefas em Segundo Plano",
    "subtitle": "Monitorar e gerenciar tarefas agendadas",
    "refresh": "Atualizar",
    "loadingJobs": "Carregando tarefas...",
    "states": {
      "completed": "Concluída",
      "active": "Ativa",
      "failed": "Falhou",
      "error": "Erro",
      "running": "Em Execução",
      "unknown": "Desconhecido"
    },
    "triggered": "Tarefa disparada com sucesso",
    "triggerError": "Falha ao disparar tarefa"
  }
} as const;
