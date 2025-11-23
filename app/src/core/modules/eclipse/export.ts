/**
 * Eclipse Export/Import Utilities
 * 
 * Suporta export de:
 * - Alertas (CSV, JSON)
 * - Infrações (CSV, JSON)
 * - Ações (CSV, JSON)
 * - Relatórios PDF com gráficos
 * 
 * Suporta import de:
 * - Marcas em bulk (CSV)
 */

import type {
  BrandAlertWithRelations,
  BrandInfringementWithRelations,
  InfringementActionWithRelations,
} from './types';

// ============================================
// CSV Export Utilities
// ============================================

export function exportAlertsToCSV(alerts: BrandAlertWithRelations[]): string {
  const headers = [
    'ID',
    'Título',
    'URL',
    'Marca',
    'Severidade',
    'Status',
    'Detectado em',
    'Monitor',
  ];

  const rows = alerts.map((alert) => [
    alert.id,
    escapeCSV(alert.title || ''),
    escapeCSV(alert.url || ''),
    escapeCSV(alert.brand?.name || ''),
    alert.severity || '',
    alert.status || '',
    alert.createdAt ? new Date(alert.createdAt).toLocaleString('pt-BR') : '',
    escapeCSV(alert.monitor?.source || ''),
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

export function exportInfringementsToCSV(infringements: BrandInfringementWithRelations[]): string {
  const headers = [
    'ID',
    'Título',
    'Tipo',
    'URL',
    'Domínio',
    'Marca',
    'Severidade',
    'Status',
    'Detectado em',
    'Ações criadas',
  ];

  const rows = infringements.map((infringement) => [
    infringement.id,
    escapeCSV(infringement.title || ''),
    infringement.type || '',
    escapeCSV(infringement.url || ''),
    escapeCSV(infringement.domain || ''),
    escapeCSV(infringement.brand?.name || ''),
    infringement.severity || '',
    infringement.status || '',
    infringement.createdAt ? new Date(infringement.createdAt).toLocaleString('pt-BR') : '',
    infringement.actions?.length || 0,
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

export function exportActionsToCSV(actions: InfringementActionWithRelations[]): string {
  const headers = [
    'ID',
    'Tipo de Ação',
    'Status',
    'Infração',
    'Prioridade',
    'Atribuído a',
    'Criado em',
    'Concluído em',
    'Resultado',
  ];

  const rows = actions.map((action) => [
    action.id,
    action.actionType || '',
    action.status || '',
    escapeCSV(action.infringement?.title || ''),
    action.priority || '',
    action.assignedTo || '',
    action.createdAt ? new Date(action.createdAt).toLocaleString('pt-BR') : '',
    action.completionDate ? new Date(action.completionDate).toLocaleString('pt-BR') : '',
    escapeCSV(action.result || ''),
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

function escapeCSV(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ============================================
// JSON Export Utilities
// ============================================

export function exportToJSON<T>(data: T[], filename: string): string {
  return JSON.stringify(data, null, 2);
}

// ============================================
// File Download Helper
// ============================================

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCSV(content: string, filename: string) {
  downloadFile(content, filename, 'text/csv;charset=utf-8;');
}

export function downloadJSON(content: string, filename: string) {
  downloadFile(content, filename, 'application/json');
}

// ============================================
// CSV Import Utilities
// ============================================

export interface BrandImportRow {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  priority?: number;
  status?: string;
}

export function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.split('\n').filter((line) => line.trim());
  return lines.map((line) => {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          currentValue += '"';
          i++; // Skip next quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    values.push(currentValue.trim());
    return values;
  });
}

export function parseBrandImportCSV(csvContent: string): BrandImportRow[] {
  const rows = parseCSV(csvContent);
  
  if (rows.length < 2) {
    throw new Error('CSV deve conter cabeçalho e pelo menos 1 linha de dados');
  }

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const dataRows = rows.slice(1);

  const nameIndex = headers.indexOf('name') !== -1 ? headers.indexOf('name') : headers.indexOf('nome');
  const descIndex = headers.indexOf('description') !== -1 ? headers.indexOf('description') : headers.indexOf('descrição');
  const logoIndex = headers.indexOf('logourl') !== -1 ? headers.indexOf('logourl') : headers.indexOf('logo');
  const websiteIndex = headers.indexOf('website') !== -1 ? headers.indexOf('website') : headers.indexOf('site');
  const priorityIndex = headers.indexOf('priority') !== -1 ? headers.indexOf('priority') : headers.indexOf('prioridade');
  const statusIndex = headers.indexOf('status');

  if (nameIndex === -1) {
    throw new Error('CSV deve conter coluna "name" ou "nome"');
  }

  return dataRows.map((row, index) => {
    const name = row[nameIndex]?.trim();
    if (!name) {
      throw new Error(`Linha ${index + 2}: campo "name" é obrigatório`);
    }

    return {
      name,
      description: descIndex !== -1 ? row[descIndex]?.trim() : undefined,
      logoUrl: logoIndex !== -1 ? row[logoIndex]?.trim() : undefined,
      website: websiteIndex !== -1 ? row[websiteIndex]?.trim() : undefined,
      priority: priorityIndex !== -1 ? parseInt(row[priorityIndex]) || undefined : undefined,
      status: statusIndex !== -1 ? row[statusIndex]?.trim() : 'active',
    };
  });
}

// ============================================
// Report Generation
// ============================================

export interface ReportData {
  workspace: {
    name: string;
    id: string;
  };
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalBrands: number;
    totalMonitors: number;
    totalAlerts: number;
    totalInfringements: number;
    totalActions: number;
    criticalAlerts: number;
    resolvedInfringements: number;
    completedActions: number;
  };
  alerts: BrandAlertWithRelations[];
  infringements: BrandInfringementWithRelations[];
  actions: InfringementActionWithRelations[];
}

export function generateReportHTML(data: ReportData): string {
  const { workspace, period, summary, alerts, infringements, actions } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório Eclipse - ${workspace.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      margin: 40px;
      color: #1a1a1a;
    }
    h1 { color: #2563eb; margin-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    .header { margin-bottom: 40px; }
    .period { color: #6b7280; font-size: 14px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
    .summary-card { background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
    .summary-card h3 { margin: 0 0 8px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; }
    .summary-card .value { font-size: 32px; font-weight: bold; color: #1e40af; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    tr:hover { background: #f9fafb; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #fed7aa; color: #9a3412; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #d1fae5; color: #065f46; }
    .badge-open { background: #dbeafe; color: #1e40af; }
    .badge-resolved { background: #d1fae5; color: #065f46; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛡️ Relatório de Proteção de Marca - Eclipse</h1>
    <div class="period">
      <strong>Workspace:</strong> ${workspace.name}<br>
      <strong>Período:</strong> ${period.start.toLocaleDateString('pt-BR')} - ${period.end.toLocaleDateString('pt-BR')}<br>
      <strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}
    </div>
  </div>

  <h2>📊 Resumo Executivo</h2>
  <div class="summary">
    <div class="summary-card">
      <h3>Marcas Protegidas</h3>
      <div class="value">${summary.totalBrands}</div>
    </div>
    <div class="summary-card">
      <h3>Monitores Ativos</h3>
      <div class="value">${summary.totalMonitors}</div>
    </div>
    <div class="summary-card">
      <h3>Alertas Detectados</h3>
      <div class="value">${summary.totalAlerts}</div>
    </div>
    <div class="summary-card">
      <h3>Infrações Registradas</h3>
      <div class="value">${summary.totalInfringements}</div>
    </div>
    <div class="summary-card">
      <h3>Alertas Críticos</h3>
      <div class="value">${summary.criticalAlerts}</div>
    </div>
    <div class="summary-card">
      <h3>Infrações Resolvidas</h3>
      <div class="value">${summary.resolvedInfringements}</div>
    </div>
    <div class="summary-card">
      <h3>Ações Criadas</h3>
      <div class="value">${summary.totalActions}</div>
    </div>
    <div class="summary-card">
      <h3>Ações Concluídas</h3>
      <div class="value">${summary.completedActions}</div>
    </div>
  </div>

  <h2>🚨 Alertas Críticos</h2>
  <table>
    <thead>
      <tr>
        <th>Título</th>
        <th>Marca</th>
        <th>Severidade</th>
        <th>Status</th>
        <th>Detectado em</th>
      </tr>
    </thead>
    <tbody>
      ${alerts
        .filter((a) => a.severity === 'critical' || a.severity === 'high')
        .slice(0, 20)
        .map(
          (alert) => `
        <tr>
          <td>${alert.title || 'Sem título'}</td>
          <td>${alert.brand?.name || 'N/A'}</td>
          <td><span class="badge badge-${alert.severity}">${alert.severity?.toUpperCase()}</span></td>
          <td><span class="badge badge-${alert.status === 'escalated' || alert.status === 'dismissed' ? 'resolved' : 'open'}">${alert.status?.toUpperCase()}</span></td>
          <td>${new Date(alert.createdAt).toLocaleString('pt-BR')}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <h2>⚠️ Infrações em Aberto</h2>
  <table>
    <thead>
      <tr>
        <th>Título</th>
        <th>Tipo</th>
        <th>Marca</th>
        <th>Severidade</th>
        <th>Status</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      ${infringements
        .filter((i) => i.status === 'open' || i.status === 'investigating')
        .slice(0, 20)
        .map(
          (infringement) => `
        <tr>
          <td>${infringement.title || 'Sem título'}</td>
          <td>${infringement.type || 'N/A'}</td>
          <td>${infringement.brand?.name || 'N/A'}</td>
          <td><span class="badge badge-${infringement.severity}">${infringement.severity?.toUpperCase()}</span></td>
          <td><span class="badge badge-open">${infringement.status?.toUpperCase()}</span></td>
          <td>${infringement.actions?.length || 0}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Este relatório foi gerado automaticamente pelo SentinelIQ Eclipse Module.</p>
    <p>Para mais informações, acesse sua dashboard em tempo real.</p>
  </div>
</body>
</html>
  `.trim();
}
