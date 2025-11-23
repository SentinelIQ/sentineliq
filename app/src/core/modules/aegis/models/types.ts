/**
 * Aegis Security Incident Management Module - Type Definitions
 * 
 * This file contains all TypeScript types and interfaces used across the Aegis module.
 * It imports Prisma-generated types and extends them with additional business logic types.
 */

import type {
  Alert,
  Incident,
  Case,
  Observable,
  Evidence,
  CustodyLog,
  Task,
  TTP,
  TimelineEvent,
  InvestigationNote,
  User,
  Workspace,
} from 'wasp/entities';
import {
  Severity,
  Priority,
  AlertStatus,
  IncidentStatus,
  CaseStatus,
  ObservableType,
  TLP,
  PAP,
  EvidenceType,
  EvidenceStatus,
  HashAlgorithm,
  CustodyAction,
  TaskStatus,
  TimelineEventType,
} from '@prisma/client';

// ============================================
// Extended Types with Relations
// ============================================

export interface AlertWithRelations extends Alert {
  [key: string]: any;
  workspace: Workspace;
  assignedTo?: User | null;
  observables: Observable[];
  incidents: Incident[];
  timeline: TimelineEvent[];
}

export interface IncidentWithRelations extends Incident {
  [key: string]: any;
  workspace: Workspace;
  assignedTo?: User | null;
  alerts: Alert[];
  cases: Case[];
  observables: Observable[];
  tasks: Task[];
  timeline: TimelineEvent[];
  notes: InvestigationNote[];
}

export interface CaseWithRelations extends Case {
  [key: string]: any;
  workspace: Workspace;
  investigator?: User | null;
  incidents: Incident[];
  evidence: Evidence[];
  observables: Observable[];
  tasks: Task[];
  ttps: TTP[];
  timeline: TimelineEvent[];
  notes: InvestigationNote[];
}

export interface ObservableWithRelations extends Observable {
  [key: string]: any;
  workspace: Workspace;
  createdBy: User;
  alerts: Alert[];
  incidents: Incident[];
  cases: Case[];
  evidence: Evidence[];
}

export interface EvidenceWithRelations extends Evidence {
  [key: string]: any;
  case: Case;
  collectedBy: User;
  custodyLog: CustodyLog[];
  observables: Observable[];
}

export interface TaskWithRelations extends Task {
  [key: string]: any;
  assignee?: User | null;
  incident?: Incident | null;
  case?: Case | null;
}

// ============================================
// Query Filter Interfaces
// ============================================

export interface AlertFilters {
  workspaceId: string;
  severity?: Severity | Severity[];
  status?: AlertStatus | AlertStatus[];
  source?: string | string[];
  assignedToId?: string;
  category?: string;
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  threatScoreMin?: number;
  threatScoreMax?: number;
}

export interface IncidentFilters {
  workspaceId: string;
  severity?: Severity | Severity[];
  status?: IncidentStatus | IncidentStatus[];
  priority?: Priority | Priority[];
  assignedToId?: string;
  team?: string;
  slaBreached?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  progressMin?: number;
  progressMax?: number;
}

export interface CaseFilters {
  workspaceId: string;
  priority?: Priority | Priority[];
  status?: CaseStatus | CaseStatus[];
  caseType?: string | string[];
  investigatorId?: string;
  team?: string;
  confidentiality?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface ObservableFilters {
  workspaceId: string;
  type?: ObservableType | ObservableType[];
  tlp?: TLP | TLP[];
  ioc?: boolean;
  sighted?: boolean;
  tags?: string[];
  createdById?: string;
}

export interface EvidenceFilters {
  caseId: string;
  type?: EvidenceType | EvidenceType[];
  status?: EvidenceStatus | EvidenceStatus[];
  collectedById?: string;
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// ============================================
// Pagination and Sorting
// ============================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  [key: string]: any;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// Input Types for Create/Update Operations
// ============================================

export interface CreateAlertInput {
  workspaceId: string;
  title: string;
  description: string;
  source: string;
  severity: Severity;
  category?: string;
  threatScore?: number;
  affectedAssets?: string[];
  tags?: string[];
  detectedAt?: Date;
  threatAnalysis?: any;
  technicalDetails?: any;
  metadata?: any;
}

export interface UpdateAlertInput {
  title?: string;
  description?: string;
  severity?: Severity;
  status?: AlertStatus;
  category?: string;
  threatScore?: number;
  affectedAssets?: string[];
  tags?: string[];
  assignedToId?: string | null;
  threatAnalysis?: any;
  technicalDetails?: any;
  metadata?: any;
}

export interface CreateIncidentInput {
  workspaceId: string;
  title: string;
  description: string;
  severity: Severity;
  priority?: Priority;
  team?: string;
  affectedSystems?: string[];
  slaDeadline?: Date;
  metadata?: any;
}

export interface UpdateIncidentInput {
  title?: string;
  description?: string;
  severity?: Severity;
  status?: IncidentStatus;
  priority?: Priority;
  team?: string;
  affectedSystems?: string[];
  slaDeadline?: Date;
  slaBreached?: boolean;
  assignedToId?: string | null;
  progress?: number;
  playbookId?: string;
  playbookData?: any;
  resolutionSummary?: string;
  metadata?: any;
}

export interface CreateCaseInput {
  workspaceId: string;
  title: string;
  description: string;
  priority?: Priority;
  caseType?: string;
  confidentiality?: string;
  team?: string;
  templateId?: string;
  metadata?: any;
}

export interface UpdateCaseInput {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: CaseStatus;
  caseType?: string;
  confidentiality?: string;
  team?: string;
  investigatorId?: string | null;
  findings?: string;
  recommendations?: string;
  metadata?: any;
}

export interface CreateObservableInput {
  workspaceId: string;
  type: ObservableType;
  value: string;
  dataType?: string;
  tlp?: TLP;
  pap?: PAP;
  ioc?: boolean;
  sighted?: boolean;
  tags?: string[];
  description?: string;
  source?: string;
  createdById: string;
}

export interface UpdateObservableInput {
  type?: ObservableType;
  value?: string;
  dataType?: string;
  tlp?: TLP;
  pap?: PAP;
  ioc?: boolean;
  sighted?: boolean;
  tags?: string[];
  description?: string;
  source?: string;
  enrichment?: any;
}

export interface CreateEvidenceInput {
  caseId: string;
  type: EvidenceType;
  name: string;
  description?: string;
  size: string;
  hash: string;
  hashAlgorithm?: HashAlgorithm;
  location?: string;
  tags?: string[];
  collectedById: string;
  collectedAt?: Date;
  fileUrl?: string;
  metadata?: any;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  assigneeId?: string;
  incidentId?: string;
  caseId?: string;
  group?: string;
  order?: number;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  dependencies?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string | null;
  group?: string;
  order?: number;
  startDate?: Date;
  dueDate?: Date;
  completedById?: string;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
}

// ============================================
// Statistics and Metrics
// ============================================

export interface AlertStats {
  [key: string]: any;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  new24h: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  trends: {
    period: string;
    count: number;
  }[];
}

export interface IncidentStats {
  [key: string]: any;
  totalOpen: number;
  critical: number;
  high: number;
  inSLA: number;
  outOfSLA: number;
  resolved7d: number;
  resolved30d: number;
  avgResponseTime: number; // in minutes
  avgResolutionTime: number; // in minutes
  mttr: number; // Mean Time To Resolve
  mttd: number; // Mean Time To Detect
  mtta: number; // Mean Time To Acknowledge
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byTeam: Record<string, number>;
  trends: {
    period: string;
    opened: number;
    resolved: number;
  }[];
}

export interface CaseStats {
  [key: string]: any;
  total: number;
  active: number;
  review: number;
  closed: number;
  closed30d: number;
  avgInvestigationTime: number; // in hours
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byInvestigator: Record<string, number>;
  trends: {
    period: string;
    opened: number;
    closed: number;
  }[];
}

export interface ObservableStats {
  [key: string]: any;
  total: number;
  iocs: number;
  sighted: number;
  byType: Record<string, number>;
  byTLP: Record<string, number>;
  enriched: number;
  malicious: number;
}

// ============================================
// Enrichment and Threat Intelligence
// ============================================

export interface ObservableEnrichment {
  reputation?: number; // 0-100 score
  geoLocation?: {
    country: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  asn?: {
    number: number;
    name: string;
  };
  threatLevel?: 'malicious' | 'suspicious' | 'benign' | 'unknown';
  verdicts?: ObservableVerdict[];
  relatedThreats?: string[];
  firstSeen?: Date;
  lastSeen?: Date;
  tags?: string[];
  metadata?: any;
}

export interface ObservableVerdict {
  service: string; // 'VirusTotal', 'AbuseIPDB', 'AlienVault OTX', etc.
  verdict: 'malicious' | 'suspicious' | 'benign' | 'unknown';
  confidence: number; // 0-100
  details?: string;
  scanDate: Date;
  metadata?: any;
}

// ============================================
// Playbook and Templates
// ============================================

export interface Playbook {
  id: string;
  name: string;
  description: string;
  incidentType: string;
  severity: Severity;
  tasks: PlaybookTask[];
  metadata?: any;
}

export interface PlaybookTask {
  title: string;
  description?: string;
  group: string;
  order: number;
  priority: Priority;
  estimatedHours?: number;
  dependencies?: number[]; // indices of other tasks
}

export interface CaseTemplate {
  id: string;
  name: string;
  description: string;
  caseType: string;
  priority: Priority;
  confidentiality: string;
  tasks: PlaybookTask[];
  customFields?: CustomField[];
  metadata?: any;
}

export interface CustomField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'text';
  required: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// ============================================
// Bulk Operations
// ============================================

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: BulkOperationError[];
}

export interface BulkOperationError {
  itemId: string;
  error: string;
}

export interface BulkAssignInput {
  itemIds: string[];
  assigneeId: string;
}

export interface BulkUpdateStatusInput {
  itemIds: string[];
  status: AlertStatus | IncidentStatus | CaseStatus;
}

export interface BulkTagInput {
  itemIds: string[];
  tags: string[];
  action: 'add' | 'remove' | 'replace';
}

export interface MergeAlertsToIncidentInput {
  alertIds: string[];
  incidentTitle: string;
  incidentDescription: string;
  severity: Severity;
  priority: Priority;
}

// ============================================
// Export and Report Types
// ============================================

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'stix';
  includeTimeline?: boolean;
  includeObservables?: boolean;
  includeEvidence?: boolean;
  includeTTPs?: boolean;
  includeNotes?: boolean;
}

export interface CaseReport {
  [key: string]: any;
  case: CaseWithRelations;
  incidents: IncidentWithRelations[];
  evidence: EvidenceWithRelations[];
  observables: ObservableWithRelations[];
  ttps: TTP[];
  timeline: TimelineEvent[];
  notes: InvestigationNote[];
  summary: {
    totalIncidents: number;
    totalEvidence: number;
    totalObservables: number;
    investigationDuration: number; // in hours
  };
}

// ============================================
// MITRE ATT&CK Types
// ============================================

export interface MitreTactic {
  [key: string]: any;
  id: string;
  name: string;
  description: string;
}

export interface MitreTechnique {
  [key: string]: any;
  id: string;
  name: string;
  tacticId: string;
  description: string;
  subtechniques?: MitreTechnique[];
}

// ============================================
// SLA Management
// ============================================

export interface SLAPolicy {
  severity: Severity;
  responseTimeMinutes: number; // Time to acknowledge
  resolutionTimeHours: number; // Time to resolve
}

export interface SLAStatus {
  [key: string]: any;
  isBreached: boolean;
  deadline: Date;
  responseTime?: number; // actual time taken
  resolutionTime?: number; // actual time taken
  remainingTime?: number; // time left before breach
}

// ============================================
// Notification Event Types
// ============================================

export type AegisEventType =
  | 'alert_created'
  | 'alert_assigned'
  | 'alert_escalated'
  | 'incident_created'
  | 'incident_assigned'
  | 'incident_sla_breach'
  | 'incident_resolved'
  | 'case_created'
  | 'case_assigned'
  | 'case_closed'
  | 'evidence_uploaded'
  | 'task_assigned'
  | 'task_completed';

// ============================================
// Re-export Prisma Enums
// ============================================

export type {
  Severity,
  Priority,
  AlertStatus,
  IncidentStatus,
  CaseStatus,
  ObservableType,
  TLP,
  PAP,
  EvidenceType,
  EvidenceStatus,
  HashAlgorithm,
  CustodyAction,
  TaskStatus,
  TimelineEventType,
};
