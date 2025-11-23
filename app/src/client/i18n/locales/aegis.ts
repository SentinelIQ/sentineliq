// Aegis module additional translations - Complete domain coverage
export const aegisEN = {
  module: {
    name: 'Aegis',
    subtitle: 'Incident Management',
    description: 'Manage alerts, incidents, and security cases centrally'
  },
  dashboard: {
    title: 'Aegis - Incident Management',
    description: 'Manage security alerts, incidents, and cases centrally',
    metrics: {
      activeAlerts: 'Active Alerts',
      criticalAlerts: 'Critical',
      highAlerts: 'High',
      openIncidents: 'Open Incidents',
      activeCases: 'Active Cases',
      resolutionRate: 'Resolution Rate',
      lastHours: 'last {{hours}}h',
      awaitingReview: 'awaiting review',
      vsLastMonth: 'vs last month'
    },
    submodules: {
      title: 'Aegis Submodules',
      alerts: {
        name: 'Alerts',
        description: 'Manage security alerts'
      },
      incidents: {
        name: 'Incidents',
        description: 'Manage active incidents'
      },
      cases: {
        name: 'Cases',
        description: 'Investigations and resolved cases'
      }
    },
    recentActivity: {
      title: 'Recent Activity',
      description: 'Latest actions in Aegis modules',
      noActivity: 'No recent activity',
      activities: {
        newAlert: 'New security alert detected',
        incidentEscalated: 'Incident {{id}} escalated',
        caseResolved: 'Case {{id}} resolved'
      },
      timeAgo: {
        minutes: '{{count}} minutes ago',
        hours: '{{count}} hours ago',
        days: '{{count}} days ago'
      }
    }
  },
  alerts: {
    title: 'Alerts',
    description: 'Manage detected security alerts',
    new: 'New Alert',
    search: 'Search alerts...',
    filter: 'Filter',
    found: '{{count}} alerts found',
    noData: 'No alerts found',
    stats: {
      total: 'Total Alerts',
      critical: 'Critical',
      high: 'High',
      new24h: 'New (24h)'
    },
    severity: {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    },
    status: {
      new: 'New',
      acknowledged: 'Acknowledged',
      investigating: 'Investigating',
      resolved: 'Resolved'
    },
    fields: {
      id: 'Alert ID',
      title: 'Title',
      description: 'Description',
      source: 'Source',
      severity: 'Severity',
      status: 'Status',
      timestamp: 'Timestamp',
      assignee: 'Assignee',
      actions: 'Actions',
      category: 'Category',
      threatScore: 'Threat Score',
      affectedAssets: 'Affected Assets',
      tags: 'Tags',
      detected: 'Detected At',
      detectedBy: 'Detected By',
      assignedTo: 'Assigned To',
      unassigned: 'Unassigned'
    },
    actions: {
      view: 'View Details',
      acknowledge: 'Acknowledge',
      investigate: 'Investigate',
      resolve: 'Resolve',
      escalate: 'Escalate to Incident',
      assign: 'Assign to Me',
      exportReport: 'Export Report',
      blockIP: 'Block IP Address',
      dismiss: 'Dismiss Alert'
    },
    sources: {
      firewall: 'Firewall',
      ids: 'IDS/IPS',
      antivirus: 'Antivirus',
      scanner: 'Vulnerability Scanner',
      monitor: 'Certificate Monitor',
      siem: 'SIEM'
    },
    tabs: {
      overview: 'Overview',
      analysis: 'Analysis',
      technical: 'Technical',
      timeline: 'Timeline'
    },
    overview: {
      title: 'Alert Overview'
    },
    analysis: {
      title: 'Threat Analysis',
      confidence: 'Confidence',
      type: 'Threat Type',
      recommendations: 'Recommendations',
      relatedThreats: 'Related Threats'
    },
    technical: {
      title: 'Technical Details'
    },
    timeline: {
      title: 'Alert Timeline',
      description: 'Complete history of actions and events'
    },
    sidebar: {
      information: 'Information',
      quickActions: 'Quick Actions'
    },
    forms: {
      create: {
        title: 'Create New Alert',
        description: 'Create a new security alert with complete details and context'
      },
      edit: {
        title: 'Edit Alert',
        description: 'Update alert information and status'
      }
    },
    bulk: {
      title: 'Bulk Alert Actions',
      description: 'Manage {count} selected alerts',
      selectStatus: 'Select Status',
      selectSeverity: 'Select Severity',
      assignPlaceholder: 'Select user to assign',
      assignHint: 'Assign selected alerts to a team member',
      addTags: 'Add Tags',
      removeTags: 'Remove Tags',
      tagsPlaceholder: 'Enter tags separated by commas',
      deleteWarning: 'Delete {count} alert(s)?',
      confirmDelete: 'Confirm deletion?',
      selectedItems: '{count} alerts selected',
      selectAction: 'Select action',
      submit: 'Execute Action'
    }
  },
  incidents: {
    title: 'Incidents',
    description: 'Manage and respond to active security incidents',
    new: 'New Incident',
    search: 'Search incidents...',
    filter: 'Filter',
    found: '{{count}} incidents found',
    noData: 'No incidents found',
    stats: {
      totalOpen: 'Total Open',
      critical: 'Critical',
      inSLA: 'In SLA',
      outOfSLA: 'Out of SLA',
      resolved7d: 'Resolved (7d)'
    },
    severity: {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    },
    status: {
      active: 'Active',
      investigating: 'Investigating',
      containment: 'Containment',
      eradication: 'Eradication',
      recovery: 'Recovery',
      resolved: 'Resolved',
      closed: 'Closed'
    },
    fields: {
      id: 'ID',
      title: 'Title',
      description: 'Description',
      severity: 'Severity',
      status: 'Status',
      assignee: 'Assignee',
      createdAt: 'Created At',
      created: 'Created At',
      sla: 'SLA',
      affectedSystems: 'Affected Systems',
      relatedAlerts: 'Related Alerts',
      team: 'Team'
    },
    actions: {
      manage: 'Manage',
      escalate: 'Escalate',
      resolve: 'Resolve',
      close: 'Close',
      createCase: 'Create Case',
      startInvestigation: 'Start Investigation',
      exportReport: 'Export Report'
    },
    sla: {
      remaining: '{{time}} remaining',
      breached: 'SLA Breached',
      completed: 'Completed'
    },
    systemsAffected: '{{count}} systems affected',
    tabs: {
      overview: 'Overview',
      systems: 'Systems',
      response: 'Response',
      timeline: 'Timeline',
      notes: 'Notes'
    },
    progress: {
      title: 'Progress'
    },
    relatedAlerts: {
      title: 'Related Alerts',
      count: 'alerts'
    },
    systems: {
      title: 'Affected Systems',
      affected: 'systems affected'
    },
    response: {
      playbook: 'Response Playbook'
    },
    timeline: {
      title: 'Incident Timeline',
      description: 'Complete history of actions and events'
    },
    notes: {
      title: 'Investigation Notes',
      description: 'Document findings and actions',
      placeholder: 'Add investigation note...',
      add: 'Add Note'
    },
    sidebar: {
      information: 'Information',
      sla: 'SLA Status',
      quickActions: 'Quick Actions'
    },
    forms: {
      create: {
        title: 'Create New Incident',
        description: 'Create a new security incident response'
      },
      edit: {
        title: 'Edit Incident',
        description: 'Update incident information and progress'
      }
    },
    bulk: {
      title: 'Bulk Incident Actions',
      description: 'Manage {count} selected incidents',
      selectStatus: 'Select Status',
      selectSeverity: 'Select Severity',
      assignPlaceholder: 'Select user to assign',
      assignHint: 'Assign selected incidents to a team member',
      addTags: 'Add Tags',
      removeTags: 'Remove Tags',
      tagsPlaceholder: 'Enter tags separated by commas',
      deleteWarning: 'Delete {count} incident(s)?',
      confirmDelete: 'Confirm deletion?',
      selectedItems: '{count} incidents selected',
      selectAction: 'Select action',
      submit: 'Execute Action'
    }
  },
  cases: {
    title: 'Cases',
    description: 'Detailed investigations and security cases',
    new: 'New Case',
    search: 'Search cases...',
    filter: 'Filter',
    found: '{{count}} cases found',
    noData: 'No cases found',
    stats: {
      total: 'Total Cases',
      active: 'Active',
      review: 'In Review',
      closed30d: 'Closed (30d)',
      avgTime: 'Avg. Time'
    },
    incidentsCount: 'Incidents',
    evidenceItems: 'Evidence Items',
    closedOn: 'Closed on {{date}}',
    priority: {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    },
    status: {
      active: 'Active',
      review: 'In Review',
      closed: 'Closed',
      archived: 'Archived'
    },
    fields: {
      id: 'ID',
      title: 'Title',
      description: 'Description',
      priority: 'Priority',
      status: 'Status',
      investigator: 'Investigator',
      createdAt: 'Created At',
      created: 'Created At',
      closedAt: 'Closed At',
      closed: 'Closed At',
      relatedIncidents: 'Related Incidents',
      evidence: 'Evidence',
      team: 'Team'
    },
    actions: {
      view: 'View Details',
      update: 'Update Case',
      close: 'Close Case',
      archive: 'Archive Case',
      addEvidence: 'Add Evidence',
      addNote: 'Add Note',
      exportReport: 'Export Report',
      downloadEvidence: 'Download Evidence',
      uploadEvidence: 'Upload Evidence',
      generateReport: 'Generate Report',
      createCaseTemplate: 'Create Template'
    },
    tabs: {
      overview: 'Overview',
      evidence: 'Evidence',
      findings: 'Findings',
      timeline: 'Timeline',
      incidents: 'Incidents'
    },
    overview: {
      title: 'Case Overview'
    },
    relatedIncidents: {
      title: 'Related Incidents',
      related: 'incidents'
    },
    evidence: {
      title: 'Evidence',
      description: 'Case evidence and artifacts',
      noEvidence: 'No evidence collected',
      add: 'Add Evidence',
      type: 'Type',
      name: 'Name',
      collected: 'Collected At',
      addedBy: 'Added By'
    },
    findings: {
      title: 'Investigation Findings',
      description: 'Key findings from investigation',
      noFindings: 'No findings documented',
      add: 'Add Finding',
      finding: 'Finding',
      severity: 'Severity',
      impact: 'Impact',
      recommendation: 'Recommendation'
    },
    timeline: {
      title: 'Case Timeline',
      description: 'Complete history of actions and events'
    },
    notes: {
      title: 'Investigation Notes',
      description: 'Document findings and actions',
      placeholder: 'Add case note...',
      add: 'Add Note'
    },
    sidebar: {
      information: 'Information',
      relatedIncidents: 'Related Incidents',
      quickActions: 'Quick Actions',
      classification: 'Classification'
    },
    forms: {
      create: {
        title: 'Create New Case',
        description: 'Create a new investigation case'
      },
      edit: {
        title: 'Edit Case',
        description: 'Update case information and status'
      }
    },
    classification: {
      confidential: 'Confidential',
      forensic: 'Forensic Evidence'
    },
    bulk: {
      title: 'Bulk Case Actions',
      description: 'Manage {count} selected cases',
      selectStatus: 'Select Status',
      selectPriority: 'Select Priority',
      assignPlaceholder: 'Select user to assign',
      assignHint: 'Assign selected cases to a team member',
      addTags: 'Add Tags',
      removeTags: 'Remove Tags',
      tagsPlaceholder: 'Enter tags separated by commas',
      deleteWarning: 'Delete {count} case(s)?',
      confirmDelete: 'Confirm deletion?',
      selectedItems: '{count} cases selected',
      selectAction: 'Select action',
      submit: 'Execute Action'
    }
  },
  tasks: {
    title: 'Tasks',
    description: 'Security investigation tasks and assignments',
    new: 'New Task',
    search: 'Search tasks...',
    found: '{{count}} tasks found',
    noData: 'No tasks found',
    status: {
      pending: 'Pending',
      inProgress: 'In Progress',
      completed: 'Completed',
      blocked: 'Blocked'
    },
    priority: {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    },
    fields: {
      id: 'Task ID',
      title: 'Title',
      description: 'Description',
      status: 'Status',
      priority: 'Priority',
      assignee: 'Assignee',
      dueDate: 'Due Date',
      createdAt: 'Created At',
      relatedCase: 'Related Case',
      relatedIncident: 'Related Incident'
    },
    actions: {
      view: 'View Details',
      edit: 'Edit Task',
      markComplete: 'Mark Complete',
      reassign: 'Reassign',
      delete: 'Delete'
    },
    forms: {
      create: {
        title: 'Create New Task',
        description: 'Create a new investigation task',
        titlePlaceholder: 'Enter task title',
        descriptionPlaceholder: 'Enter task description',
        selectStatus: 'Select status',
        selectPriority: 'Select priority',
        selectAssignee: 'Assign to team member',
        selectDueDate: 'Set due date',
        submit: 'Create Task'
      },
      edit: {
        title: 'Edit Task',
        description: 'Update task information',
        submit: 'Update Task'
      }
    }
  },
  evidence: {
    title: 'Evidence Management',
    description: 'Manage case evidence and digital artifacts',
    new: 'Add Evidence',
    search: 'Search evidence...',
    found: '{{count}} items found',
    noData: 'No evidence collected',
    types: {
      file: 'File',
      log: 'Log',
      screenshot: 'Screenshot',
      memory: 'Memory Dump',
      network: 'Network Capture',
      email: 'Email',
      document: 'Document',
      other: 'Other'
    },
    fields: {
      id: 'Evidence ID',
      name: 'Name',
      type: 'Type',
      description: 'Description',
      source: 'Source',
      collected: 'Collected At',
      collectedBy: 'Collected By',
      hash: 'Hash',
      size: 'Size',
      case: 'Case',
      tags: 'Tags'
    },
    actions: {
      view: 'View',
      download: 'Download',
      verify: 'Verify Hash',
      tag: 'Add Tag',
      export: 'Export',
      delete: 'Delete'
    },
    chain: {
      title: 'Chain of Custody',
      timestamp: 'Timestamp',
      action: 'Action',
      user: 'User',
      description: 'Description'
    },
    forms: {
      create: {
        title: 'Add Evidence',
        description: 'Upload and document new evidence',
        namePlaceholder: 'Enter evidence name',
        descriptionPlaceholder: 'Enter description',
        selectType: 'Select evidence type',
        selectCase: 'Select related case',
        sourcePlaceholder: 'Enter evidence source',
        hashPlaceholder: 'Enter file hash if available',
        submit: 'Add Evidence'
      }
    }
  },
  observables: {
    title: 'Observables',
    description: 'Track and manage IOCs and threat indicators',
    new: 'Add Observable',
    search: 'Search observables...',
    found: '{{count}} observables found',
    noData: 'No observables found',
    types: {
      ipv4: 'IPv4 Address',
      ipv6: 'IPv6 Address',
      domain: 'Domain',
      url: 'URL',
      email: 'Email',
      hash: 'Hash',
      filename: 'Filename',
      certificate: 'Certificate',
      user: 'Username',
      other: 'Other'
    },
    fields: {
      id: 'Observable ID',
      value: 'Value',
      type: 'Type',
      source: 'Source',
      confidence: 'Confidence',
      severity: 'Severity',
      firstSeen: 'First Seen',
      lastSeen: 'Last Seen',
      status: 'Status',
      related: 'Related Items'
    },
    actions: {
      view: 'View Details',
      investigate: 'Investigate',
      block: 'Block',
      whitelist: 'Whitelist',
      share: 'Share',
      export: 'Export'
    },
    status: {
      unknown: 'Unknown',
      benign: 'Benign',
      suspicious: 'Suspicious',
      malicious: 'Malicious',
      blocked: 'Blocked',
      whitelisted: 'Whitelisted'
    },
    forms: {
      create: {
        title: 'Add Observable',
        description: 'Add a new IOC or threat indicator',
        valuePlaceholder: 'Enter observable value',
        selectType: 'Select type',
        sourcePlaceholder: 'Enter source',
        selectSeverity: 'Select severity',
        selectConfidence: 'Select confidence',
        submit: 'Add Observable'
      }
    }
  },
  ttp: {
    title: 'Tactics, Techniques & Procedures',
    description: 'Track adversary TTPs and attack patterns',
    new: 'Map TTP',
    search: 'Search TTPs...',
    found: '{{count}} TTPs found',
    noData: 'No TTPs mapped',
    framework: {
      mitre: 'MITRE ATT&CK',
      custom: 'Custom'
    },
    fields: {
      id: 'TTP ID',
      name: 'Name',
      mitreid: 'MITRE ID',
      tactic: 'Tactic',
      technique: 'Technique',
      description: 'Description',
      evidence: 'Supporting Evidence',
      detectability: 'Detectability'
    },
    actions: {
      view: 'View Details',
      map: 'Map to Case',
      link: 'Link to Incident',
      export: 'Export'
    },
    tactics: {
      reconnaissance: 'Reconnaissance',
      resourceDevelopment: 'Resource Development',
      initialAccess: 'Initial Access',
      execution: 'Execution',
      persistence: 'Persistence',
      privilegeEscalation: 'Privilege Escalation',
      defenseevasion: 'Defense Evasion',
      credentialaccess: 'Credential Access',
      discovery: 'Discovery',
      lateralmovement: 'Lateral Movement',
      collection: 'Collection',
      commandandcontrol: 'Command and Control',
      exfiltration: 'Exfiltration',
      impact: 'Impact'
    },
    forms: {
      create: {
        title: 'Map TTP',
        description: 'Map adversary TTP to case or incident',
        selectFramework: 'Select framework',
        selectTactic: 'Select tactic',
        selectTechnique: 'Select technique',
        descriptionPlaceholder: 'Add mapping notes',
        selectRelated: 'Select related case or incident',
        submit: 'Map TTP'
      }
    }
  },
  common: {
    back: 'Back',
    breadcrumb: {
      aegis: 'AEGIS'
    },
    filters: {
      title: 'Filters'
    }
  }
} as const;

export const aegisPT = {
  module: {
    name: 'Aegis',
    subtitle: 'Gerenciamento de Incidentes',
    description: 'Gerencie alertas, incidentes e casos de segurança centralmente'
  },
  dashboard: {
    title: 'Aegis - Gerenciamento de Incidentes',
    description: 'Gerencie alertas de segurança, incidentes e casos centralmente',
    metrics: {
      activeAlerts: 'Alertas Ativos',
      criticalAlerts: 'Crítico',
      highAlerts: 'Alto',
      openIncidents: 'Incidentes Abertos',
      activeCases: 'Casos Ativos',
      resolutionRate: 'Taxa de Resolução',
      lastHours: 'últimas {{hours}}h',
      awaitingReview: 'aguardando revisão',
      vsLastMonth: 'vs mês passado'
    },
    submodules: {
      title: 'Submódulos Aegis',
      alerts: {
        name: 'Alertas',
        description: 'Gerencie alertas de segurança'
      },
      incidents: {
        name: 'Incidentes',
        description: 'Gerencie incidentes ativos'
      },
      cases: {
        name: 'Casos',
        description: 'Investigações e casos resolvidos'
      }
    },
    recentActivity: {
      title: 'Atividade Recente',
      description: 'Últimas ações nos submódulos Aegis',
      noActivity: 'Sem atividade recente',
      activities: {
        newAlert: 'Novo alerta de segurança detectado',
        incidentEscalated: 'Incidente {{id}} escalado',
        caseResolved: 'Caso {{id}} resolvido'
      },
      timeAgo: {
        minutes: 'há {{count}} minutos',
        hours: 'há {{count}} horas',
        days: 'há {{count}} dias'
      }
    }
  },
  alerts: {
    title: 'Alertas',
    description: 'Gerencie alertas de segurança detectados',
    new: 'Novo Alerta',
    search: 'Pesquisar alertas...',
    filter: 'Filtrar',
    found: '{{count}} alertas encontrados',
    noData: 'Nenhum alerta encontrado',
    stats: {
      total: 'Total de Alertas',
      critical: 'Crítico',
      high: 'Alto',
      new24h: 'Novo (24h)'
    },
    severity: {
      critical: 'Crítico',
      high: 'Alto',
      medium: 'Médio',
      low: 'Baixo'
    },
    status: {
      new: 'Novo',
      acknowledged: 'Reconhecido',
      investigating: 'Investigando',
      resolved: 'Resolvido'
    },
    fields: {
      id: 'ID do Alerta',
      title: 'Título',
      description: 'Descrição',
      source: 'Fonte',
      severity: 'Severidade',
      status: 'Status',
      timestamp: 'Data/Hora',
      assignee: 'Atribuído a',
      actions: 'Ações',
      category: 'Categoria',
      threatScore: 'Pontuação de Ameaça',
      affectedAssets: 'Ativos Afetados',
      tags: 'Tags',
      detected: 'Detectado em',
      detectedBy: 'Detectado por',
      assignedTo: 'Atribuído a',
      unassigned: 'Não atribuído'
    },
    actions: {
      view: 'Ver Detalhes',
      acknowledge: 'Reconhecer',
      investigate: 'Investigar',
      resolve: 'Resolver',
      escalate: 'Escalar para Incidente',
      assign: 'Atribuir a Mim',
      exportReport: 'Exportar Relatório',
      blockIP: 'Bloquear Endereço IP',
      dismiss: 'Descartar Alerta'
    },
    sources: {
      firewall: 'Firewall',
      ids: 'IDS/IPS',
      antivirus: 'Antivírus',
      scanner: 'Scanner de Vulnerabilidades',
      monitor: 'Monitor de Certificado',
      siem: 'SIEM'
    },
    tabs: {
      overview: 'Visão Geral',
      analysis: 'Análise',
      technical: 'Técnico',
      timeline: 'Linha do Tempo'
    },
    overview: {
      title: 'Visão Geral do Alerta'
    },
    analysis: {
      title: 'Análise de Ameaça',
      confidence: 'Confiança',
      type: 'Tipo de Ameaça',
      recommendations: 'Recomendações',
      relatedThreats: 'Ameaças Relacionadas'
    },
    technical: {
      title: 'Detalhes Técnicos'
    },
    timeline: {
      title: 'Linha do Tempo do Alerta',
      description: 'Histórico completo de ações e eventos'
    },
    sidebar: {
      information: 'Informações',
      quickActions: 'Ações Rápidas'
    },
    forms: {
      create: {
        title: 'Criar Novo Alerta',
        description: 'Crie um novo alerta de segurança com detalhes e contexto completos'
      },
      edit: {
        title: 'Editar Alerta',
        description: 'Atualize informações e status do alerta'
      }
    },
    bulk: {
      title: 'Ações em Lote - Alertas',
      description: 'Gerenciar {count} alertas selecionados',
      selectStatus: 'Selecione Status',
      selectSeverity: 'Selecione Severidade',
      assignPlaceholder: 'Selecione usuário',
      assignHint: 'Atribuir alertas a um membro da equipe',
      addTags: 'Adicionar Tags',
      removeTags: 'Remover Tags',
      tagsPlaceholder: 'Digite tags separadas por vírgula',
      deleteWarning: 'Excluir {count} alerta(s)?',
      confirmDelete: 'Confirmar exclusão?',
      selectedItems: '{count} alertas selecionados',
      selectAction: 'Selecione ação',
      submit: 'Executar Ação'
    }
  },
  incidents: {
    title: 'Incidentes',
    description: 'Gerencie e responda a incidentes de segurança ativos',
    new: 'Novo Incidente',
    search: 'Pesquisar incidentes...',
    filter: 'Filtrar',
    found: '{{count}} incidentes encontrados',
    noData: 'Nenhum incidente encontrado',
    stats: {
      totalOpen: 'Total Aberto',
      critical: 'Crítico',
      inSLA: 'Dentro do SLA',
      outOfSLA: 'Fora do SLA',
      resolved7d: 'Resolvido (7d)'
    },
    severity: {
      critical: 'Crítico',
      high: 'Alto',
      medium: 'Médio',
      low: 'Baixo'
    },
    status: {
      active: 'Ativo',
      investigating: 'Investigando',
      containment: 'Contenção',
      eradication: 'Erradicação',
      recovery: 'Recuperação',
      resolved: 'Resolvido',
      closed: 'Fechado'
    },
    fields: {
      id: 'ID',
      title: 'Título',
      description: 'Descrição',
      severity: 'Severidade',
      status: 'Status',
      assignee: 'Atribuído a',
      createdAt: 'Criado em',
      created: 'Criado em',
      sla: 'SLA',
      affectedSystems: 'Sistemas Afetados',
      relatedAlerts: 'Alertas Relacionados',
      team: 'Equipe'
    },
    actions: {
      manage: 'Gerenciar',
      escalate: 'Escalar',
      resolve: 'Resolver',
      close: 'Fechar',
      createCase: 'Criar Caso',
      startInvestigation: 'Iniciar Investigação',
      exportReport: 'Exportar Relatório'
    },
    sla: {
      remaining: '{{time}} restante',
      breached: 'SLA Violado',
      completed: 'Concluído'
    },
    systemsAffected: '{{count}} sistemas afetados',
    tabs: {
      overview: 'Visão Geral',
      systems: 'Sistemas',
      response: 'Resposta',
      timeline: 'Linha do Tempo',
      notes: 'Notas'
    },
    progress: {
      title: 'Progresso'
    },
    relatedAlerts: {
      title: 'Alertas Relacionados',
      count: 'alertas'
    },
    systems: {
      title: 'Sistemas Afetados',
      affected: 'sistemas afetados'
    },
    response: {
      playbook: 'Playbook de Resposta'
    },
    timeline: {
      title: 'Linha do Tempo do Incidente',
      description: 'Histórico completo de ações e eventos'
    },
    notes: {
      title: 'Notas de Investigação',
      description: 'Documente descobertas e ações',
      placeholder: 'Adicione nota de investigação...',
      add: 'Adicionar Nota'
    },
    sidebar: {
      information: 'Informações',
      sla: 'Status SLA',
      quickActions: 'Ações Rápidas'
    },
    forms: {
      create: {
        title: 'Criar Novo Incidente',
        description: 'Crie uma nova resposta a incidente de segurança'
      },
      edit: {
        title: 'Editar Incidente',
        description: 'Atualize informações e progresso do incidente'
      }
    },
    bulk: {
      title: 'Ações em Lote - Incidentes',
      description: 'Gerenciar {count} incidentes selecionados',
      selectStatus: 'Selecione Status',
      selectSeverity: 'Selecione Severidade',
      assignPlaceholder: 'Selecione usuário',
      assignHint: 'Atribuir incidentes a um membro da equipe',
      addTags: 'Adicionar Tags',
      removeTags: 'Remover Tags',
      tagsPlaceholder: 'Digite tags separadas por vírgula',
      deleteWarning: 'Excluir {count} incidente(s)?',
      confirmDelete: 'Confirmar exclusão?',
      selectedItems: '{count} incidentes selecionados',
      selectAction: 'Selecione ação',
      submit: 'Executar Ação'
    }
  },
  cases: {
    title: 'Casos',
    description: 'Investigações detalhadas e casos de segurança',
    new: 'Novo Caso',
    search: 'Pesquisar casos...',
    filter: 'Filtrar',
    found: '{{count}} casos encontrados',
    noData: 'Nenhum caso encontrado',
    stats: {
      total: 'Total de Casos',
      active: 'Ativo',
      review: 'Em Revisão',
      closed30d: 'Fechado (30d)',
      avgTime: 'Tempo Médio'
    },
    incidentsCount: 'Incidentes',
    evidenceItems: 'Itens de Evidência',
    priority: {
      critical: 'Crítico',
      high: 'Alto',
      medium: 'Médio',
      low: 'Baixo'
    },
    status: {
      active: 'Ativo',
      review: 'Em Revisão',
      closed: 'Fechado',
      archived: 'Arquivado'
    },
    fields: {
      id: 'ID',
      title: 'Título',
      description: 'Descrição',
      priority: 'Prioridade',
      status: 'Status',
      investigator: 'Investigador',
      createdAt: 'Criado em',
      created: 'Criado em',
      closedAt: 'Fechado em',
      closed: 'Fechado em',
      relatedIncidents: 'Incidentes Relacionados',
      evidence: 'Evidências',
      team: 'Equipe'
    },
    actions: {
      view: 'Ver Detalhes',
      update: 'Atualizar Caso',
      close: 'Fechar Caso',
      archive: 'Arquivar Caso',
      addEvidence: 'Adicionar Evidência',
      addNote: 'Adicionar Nota',
      exportReport: 'Exportar Relatório',
      downloadEvidence: 'Baixar Evidências',
      uploadEvidence: 'Enviar Evidências',
      generateReport: 'Gerar Relatório',
      createCaseTemplate: 'Criar Modelo'
    },
    tabs: {
      overview: 'Visão Geral',
      evidence: 'Evidências',
      findings: 'Descobertas',
      timeline: 'Linha do Tempo',
      notes: 'Notas',
      incidents: 'Incidentes'
    },
    overview: {
      title: 'Visão Geral do Caso'
    },
    relatedIncidents: {
      title: 'Incidentes Relacionados',
      related: 'incidentes'
    },
    evidence: {
      title: 'Evidências',
      description: 'Evidências e artefatos do caso',
      noEvidence: 'Nenhuma evidência coletada',
      add: 'Adicionar Evidência',
      type: 'Tipo',
      name: 'Nome',
      collected: 'Coletado em',
      addedBy: 'Adicionado por'
    },
    findings: {
      title: 'Descobertas da Investigação',
      description: 'Principais descobertas da investigação',
      noFindings: 'Nenhuma descoberta documentada',
      add: 'Adicionar Descoberta',
      finding: 'Descoberta',
      severity: 'Severidade',
      impact: 'Impacto',
      recommendation: 'Recomendação'
    },
    timeline: {
      title: 'Linha do Tempo do Caso',
      description: 'Histórico completo de ações e eventos'
    },
    notes: {
      title: 'Notas de Investigação',
      description: 'Documente descobertas e ações',
      placeholder: 'Adicione nota do caso...',
      add: 'Adicionar Nota'
    },
    sidebar: {
      information: 'Informações',
      relatedIncidents: 'Incidentes Relacionados',
      quickActions: 'Ações Rápidas',
      classification: 'Classificação'
    },
    forms: {
      create: {
        title: 'Criar Novo Caso',
        description: 'Crie um novo caso de investigação'
      },
      edit: {
        title: 'Editar Caso',
        description: 'Atualize informações e status do caso'
      }
    },
    bulk: {
      title: 'Ações em Lote - Casos',
      description: 'Gerenciar {count} casos selecionados',
      selectStatus: 'Selecione Status',
      selectPriority: 'Selecione Prioridade',
      assignPlaceholder: 'Selecione usuário',
      assignHint: 'Atribuir casos a um membro da equipe',
      addTags: 'Adicionar Tags',
      removeTags: 'Remover Tags',
      tagsPlaceholder: 'Digite tags separadas por vírgula',
      deleteWarning: 'Excluir {count} caso(s)?',
      confirmDelete: 'Confirmar exclusão?',
      selectedItems: '{count} casos selecionados',
      selectAction: 'Selecione ação',
      submit: 'Executar Ação'
    },
    classification: {
      confidential: 'Confidencial',
      forensic: 'Evidência Forense'
    }
  },
  tasks: {
    title: 'Tarefas',
    description: 'Tarefas de investigação de segurança e atribuições',
    new: 'Nova Tarefa',
    search: 'Pesquisar tarefas...',
    found: '{{count}} tarefas encontradas',
    noData: 'Nenhuma tarefa encontrada',
    status: {
      pending: 'Pendente',
      inProgress: 'Em Andamento',
      completed: 'Concluída',
      blocked: 'Bloqueada'
    },
    priority: {
      critical: 'Crítico',
      high: 'Alto',
      medium: 'Médio',
      low: 'Baixo'
    },
    fields: {
      id: 'ID da Tarefa',
      title: 'Título',
      description: 'Descrição',
      status: 'Status',
      priority: 'Prioridade',
      assignee: 'Atribuído a',
      dueDate: 'Data de Vencimento',
      createdAt: 'Criado em',
      relatedCase: 'Caso Relacionado',
      relatedIncident: 'Incidente Relacionado'
    },
    actions: {
      view: 'Ver Detalhes',
      edit: 'Editar Tarefa',
      markComplete: 'Marcar Completa',
      reassign: 'Reatribuir',
      delete: 'Excluir'
    },
    forms: {
      create: {
        title: 'Criar Nova Tarefa',
        description: 'Crie uma nova tarefa de investigação',
        titlePlaceholder: 'Digite título da tarefa',
        descriptionPlaceholder: 'Digite descrição da tarefa',
        selectStatus: 'Selecione status',
        selectPriority: 'Selecione prioridade',
        selectAssignee: 'Atribuir a membro da equipe',
        selectDueDate: 'Defina data de vencimento',
        submit: 'Criar Tarefa'
      },
      edit: {
        title: 'Editar Tarefa',
        description: 'Atualize informações da tarefa',
        submit: 'Atualizar Tarefa'
      }
    }
  },
  evidence: {
    title: 'Gerenciamento de Evidências',
    description: 'Gerencie evidências de caso e artefatos digitais',
    new: 'Adicionar Evidência',
    search: 'Pesquisar evidências...',
    found: '{{count}} itens encontrados',
    noData: 'Nenhuma evidência coletada',
    types: {
      file: 'Arquivo',
      log: 'Log',
      screenshot: 'Screenshot',
      memory: 'Dump de Memória',
      network: 'Captura de Rede',
      email: 'Email',
      document: 'Documento',
      other: 'Outro'
    },
    fields: {
      id: 'ID de Evidência',
      name: 'Nome',
      type: 'Tipo',
      description: 'Descrição',
      source: 'Fonte',
      collected: 'Coletado em',
      collectedBy: 'Coletado por',
      hash: 'Hash',
      size: 'Tamanho',
      case: 'Caso',
      tags: 'Tags'
    },
    actions: {
      view: 'Visualizar',
      download: 'Baixar',
      verify: 'Verificar Hash',
      tag: 'Adicionar Tag',
      export: 'Exportar',
      delete: 'Excluir'
    },
    chain: {
      title: 'Corrente de Custódia',
      timestamp: 'Data/Hora',
      action: 'Ação',
      user: 'Usuário',
      description: 'Descrição'
    },
    forms: {
      create: {
        title: 'Adicionar Evidência',
        description: 'Faça upload e documente nova evidência',
        namePlaceholder: 'Digite nome da evidência',
        descriptionPlaceholder: 'Digite descrição',
        selectType: 'Selecione tipo de evidência',
        selectCase: 'Selecione caso relacionado',
        sourcePlaceholder: 'Digite fonte da evidência',
        hashPlaceholder: 'Digite hash do arquivo se disponível',
        submit: 'Adicionar Evidência'
      }
    }
  },
  observables: {
    title: 'Observáveis',
    description: 'Rastreie e gerencie IOCs e indicadores de ameaça',
    new: 'Adicionar Observável',
    search: 'Pesquisar observáveis...',
    found: '{{count}} observáveis encontrados',
    noData: 'Nenhum observável encontrado',
    types: {
      ipv4: 'Endereço IPv4',
      ipv6: 'Endereço IPv6',
      domain: 'Domínio',
      url: 'URL',
      email: 'Email',
      hash: 'Hash',
      filename: 'Nome de Arquivo',
      certificate: 'Certificado',
      user: 'Usuário',
      other: 'Outro'
    },
    fields: {
      id: 'ID do Observável',
      value: 'Valor',
      type: 'Tipo',
      source: 'Fonte',
      confidence: 'Confiança',
      severity: 'Severidade',
      firstSeen: 'Primeiro Visto',
      lastSeen: 'Último Visto',
      status: 'Status',
      related: 'Itens Relacionados'
    },
    actions: {
      view: 'Ver Detalhes',
      investigate: 'Investigar',
      block: 'Bloquear',
      whitelist: 'Colocar em Lista Branca',
      share: 'Compartilhar',
      export: 'Exportar'
    },
    status: {
      unknown: 'Desconhecido',
      benign: 'Benigno',
      suspicious: 'Suspeito',
      malicious: 'Malicioso',
      blocked: 'Bloqueado',
      whitelisted: 'Em Lista Branca'
    },
    forms: {
      create: {
        title: 'Adicionar Observável',
        description: 'Adicione um novo IOC ou indicador de ameaça',
        valuePlaceholder: 'Digite valor do observável',
        selectType: 'Selecione tipo',
        sourcePlaceholder: 'Digite fonte',
        selectSeverity: 'Selecione severidade',
        selectConfidence: 'Selecione confiança',
        submit: 'Adicionar Observável'
      }
    }
  },
  ttp: {
    title: 'Táticas, Técnicas e Procedimentos',
    description: 'Rastreie TTPs de adversário e padrões de ataque',
    new: 'Mapear TTP',
    search: 'Pesquisar TTPs...',
    found: '{{count}} TTPs encontrados',
    noData: 'Nenhum TTP mapeado',
    framework: {
      mitre: 'MITRE ATT&CK',
      custom: 'Customizado'
    },
    fields: {
      id: 'ID TTP',
      name: 'Nome',
      mitreid: 'ID MITRE',
      tactic: 'Tática',
      technique: 'Técnica',
      description: 'Descrição',
      evidence: 'Evidência de Suporte',
      detectability: 'Detectabilidade'
    },
    actions: {
      view: 'Ver Detalhes',
      map: 'Mapear para Caso',
      link: 'Vincular a Incidente',
      export: 'Exportar'
    },
    tactics: {
      reconnaissance: 'Reconhecimento',
      resourceDevelopment: 'Desenvolvimento de Recursos',
      initialAccess: 'Acesso Inicial',
      execution: 'Execução',
      persistence: 'Persistência',
      privilegeEscalation: 'Elevação de Privilégio',
      defenseevasion: 'Evasão de Defesa',
      credentialaccess: 'Acesso a Credenciais',
      discovery: 'Descoberta',
      lateralmovement: 'Movimento Lateral',
      collection: 'Coleta',
      commandandcontrol: 'Comando e Controle',
      exfiltration: 'Exfiltração',
      impact: 'Impacto'
    },
    forms: {
      create: {
        title: 'Mapear TTP',
        description: 'Mapeie TTP de adversário para caso ou incidente',
        selectFramework: 'Selecione framework',
        selectTactic: 'Selecione tática',
        selectTechnique: 'Selecione técnica',
        descriptionPlaceholder: 'Adicione notas de mapeamento',
        selectRelated: 'Selecione caso ou incidente relacionado',
        submit: 'Mapear TTP'
      }
    }
  },
  common: {
    back: 'Voltar',
    breadcrumb: {
      aegis: 'AEGIS'
    },
    filters: {
      title: 'Filtros'
    }
  }
} as const;


