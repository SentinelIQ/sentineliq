import type {
  EclipseBrand,
  BrandMonitor,
  BrandAlert,
  BrandInfringement,
  InfringementAction,
  BrandAlertAggregation,
  User,
  Workspace,
} from 'wasp/entities';

// ============================================
// Extended Types with Relations
// ============================================

export interface EclipseBrandWithRelations extends EclipseBrand {
  workspace: Workspace;
  monitors: BrandMonitorWithRelations[];
  infringements: BrandInfringementWithRelations[];
}

export interface BrandMonitorWithRelations extends BrandMonitor {
  brand: EclipseBrand;
  workspace: Workspace;
  alerts: BrandAlertWithRelations[];
}

export interface BrandAlertWithRelations extends BrandAlert {
  monitor: BrandMonitor;
  brand: EclipseBrand;
  workspace: Workspace;
  infringement?: BrandInfringementWithRelations | null;
}

export interface BrandInfringementWithRelations extends BrandInfringement {
  brand: EclipseBrand;
  workspace: Workspace;
  actions: InfringementActionWithRelations[];
}

export interface InfringementActionWithRelations extends InfringementAction {
  infringement: BrandInfringement;
  workspace: Workspace;
}

// ============================================
// Query Filter Interfaces
// ============================================

export interface BrandFilters {
  workspaceId: string;
  status?: string | string[];
  priority?: number[];
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface MonitorFilters {
  workspaceId: string;
  brandId?: string;
  monitoringType?: string | string[];
  status?: string | string[];
  source?: string | string[];
  limit?: number;
  offset?: number;
}

export interface AlertFilters {
  workspaceId: string;
  monitorId?: string;
  brandId?: string;
  severity?: string | string[];
  status?: string | string[];
  createdAfter?: Date;
  createdBefore?: Date;
  tags?: string[];
  searchRegex?: string;
  limit?: number;
  offset?: number;
}

export interface InfringementFilters {
  workspaceId: string;
  brandId?: string;
  type?: string | string[];
  status?: string | string[];
  severity?: string | string[];
  createdAfter?: Date;
  createdBefore?: Date;
  tags?: string[];
  assignedTo?: string;
  searchRegex?: string;
  limit?: number;
  offset?: number;
}

export interface ActionFilters {
  workspaceId: string;
  infringementId?: string;
  actionType?: string | string[];
  status?: string | string[];
  assignedTo?: string;
  priority?: string | string[];
  createdAfter?: Date;
  createdBefore?: Date;
  tags?: string[];
  searchRegex?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// Advanced Filters
// ============================================

export interface SavedFilter {
  id: string;
  name: string;
  resourceType: 'alerts' | 'infringements' | 'actions';
  filters: Record<string, any>;
  createdAt: Date;
  userId: string;
}

export interface DateRangePreset {
  label: string;
  value: string;
  getDates: () => { start: Date; end: Date };
}

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  {
    label: 'Últimas 24 horas',
    value: 'last_24h',
    getDates: () => ({
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(),
    }),
  },
  {
    label: 'Últimos 7 dias',
    value: 'last_7d',
    getDates: () => ({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }),
  },
  {
    label: 'Últimos 30 dias',
    value: 'last_30d',
    getDates: () => ({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }),
  },
  {
    label: 'Últimos 90 dias',
    value: 'last_90d',
    getDates: () => ({
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }),
  },
  {
    label: 'Este mês',
    value: 'this_month',
    getDates: () => {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(),
      };
    },
  },
  {
    label: 'Mês passado',
    value: 'last_month',
    getDates: () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        start: lastMonth,
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      };
    },
  },
];

// ============================================
// Pagination & Results
// ============================================

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================
// Create/Update DTOs
// ============================================

export interface CreateBrandInput {
  workspaceId: string;
  name: string;
  description?: string;
  trademark?: string;
  domains?: string[];
  socialMediaHandles?: string[];
  priority?: number;
  confidentiality?: string;
}

export interface UpdateBrandInput {
  name?: string;
  description?: string;
  status?: string;
  priority?: number;
  domains?: string[];
  socialMediaHandles?: string[];
}

export interface CreateMonitorInput {
  workspaceId: string;
  brandId: string;
  monitoringType: string;
  source: string;
  searchTerms: string[];
  excludeTerms?: string[];
  keywords?: string[];
  targetRegions?: string[];
  targetLanguages?: string[];
  yaraRules?: string;
  regexPatterns?: string[];
  domainPatterns?: string[];
  confidenceThreshold?: number;
  checkFrequency?: string;
  isAutomated?: boolean;
  enableScreenshots?: boolean;
  enableOCR?: boolean;
  deepAnalysis?: boolean;
}

export interface UpdateMonitorInput {
  searchTerms?: string[];
  excludeTerms?: string[];
  keywords?: string[];
  targetRegions?: string[];
  yaraRules?: string;
  regexPatterns?: string[];
  confidenceThreshold?: number;
  status?: string;
  checkFrequency?: string;
}

export interface CreateAlertInput {
  workspaceId: string;
  monitorId: string;
  brandId: string;
  title: string;
  description?: string;
  url?: string;
  severity: string;
  sourceData?: any;
  confidence?: number;
}

export interface CreateInfringementInput {
  workspaceId: string;
  brandId: string;
  title: string;
  description?: string;
  url: string;
  domain: string;
  type: string;
  severity: string;
  ipAddress?: string;
  location?: string;
}

export interface UpdateInfringementInput {
  status?: string;
  description?: string;
  investigatedBy?: string;
}

export interface CreateActionInput {
  workspaceId: string;
  infringementId: string;
  actionType: string;
  title: string;
  description?: string;
  plannedDate?: Date;
  priority?: number;
  assignedTo?: string;
}

export interface UpdateActionInput {
  status?: string;
  executionDate?: Date;
  completionDate?: Date;
  result?: string;
  evidence?: string[];
  notes?: string;
}

// ============================================
// Stats & Analytics
// ============================================

export interface BrandStats {
  totalBrands: number;
  activeBrands: number;
  monitoringCoverage: number;
  totalInfringements: number;
  unresolvedInfringements: number;
  criticalInfringements: number;
  actionsCompleted: number;
  actionsPending: number;
  [key: string]: any;
}

export interface MonitoringMetrics {
  totalMonitors: number;
  activeMonitors: number;
  detectionsToday: number;
  detectionsThisMonth: number;
  averageConfidence: number;
  topThreatTypes: Array<{ type: string; count: number }>;
  [key: string]: any;
}

export interface DashboardData {
  brands: any[];
  stats: BrandStats;
  metrics: MonitoringMetrics;
  recentAlerts: any[];
  criticalInfringements: any[];
  [key: string]: any;
}

// ============================================
// Queue/Crawler Payloads
// ============================================

export interface CrawlTaskPayload {
  type: 'CRAWL_MONITOR';
  monitorId: string;
  brandId: string;
  workspaceId: string;
  searchTerms: string[];
  excludeTerms: string[];
  keywords: string[];
  targetRegions: string[];
  targetLanguages: string[];
  yaraRules?: string;
  regexPatterns: string[];
  domainPatterns: string[];
  confidenceThreshold: number;
  matchingRulesNeeded: number;
  enableScreenshots: boolean;
  enableOCR: boolean;
  deepAnalysis: boolean;
  createdAt: string;
  source: string;
}

export interface CrawlResult {
  success: boolean;
  monitorId: string;
  detections: Array<{
    url: string;
    title: string;
    description?: string;
    confidence: number;
    severity: string;
    matches: {
      regex?: string[];
      yara?: string[];
      ocr?: string;
    };
    screenshot?: string;
  }>;
  error?: string;
}
