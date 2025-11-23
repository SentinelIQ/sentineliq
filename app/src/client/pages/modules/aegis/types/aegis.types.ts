// Core Aegis Types

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'dismissed';
export type IncidentStatus = 'active' | 'investigating' | 'containment' | 'resolved' | 'closed';
export type CaseStatus = 'active' | 'review' | 'closed';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

// Observable Types
export type ObservableType = 
  | 'ip' 
  | 'domain' 
  | 'url' 
  | 'hash-md5'
  | 'hash-sha1'
  | 'hash-sha256'
  | 'email' 
  | 'file' 
  | 'registry'
  | 'user-agent'
  | 'other';

export type TLP = 'white' | 'green' | 'amber' | 'red';
export type PAP = 'white' | 'green' | 'amber' | 'red';

export interface Observable {
  id: string;
  type: ObservableType;
  value: string;
  dataType?: string;
  tlp: TLP;
  pap: PAP;
  ioc: boolean; // Indicator of Compromise
  sighted: boolean;
  tags: string[];
  description?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  // Enrichment data
  enrichment?: {
    reputation?: number;
    geoLocation?: string;
    country?: string;
    asn?: string;
    threatLevel?: 'malicious' | 'suspicious' | 'benign' | 'unknown';
    verdicts?: ObservableVerdict[];
    relatedThreats?: string[];
    firstSeen?: string;
    lastSeen?: string;
  };
}

export interface ObservableVerdict {
  service: string; // VirusTotal, AbuseIPDB, etc.
  verdict: 'malicious' | 'suspicious' | 'benign' | 'unknown';
  confidence: number;
  details?: string;
  scanDate: string;
}

// Task Types
export type TaskStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee?: string;
  group?: string; // Phase/category (e.g., "Identification", "Containment")
  startDate?: string; // For Gantt chart visualization
  dueDate?: string;
  priority: Priority;
  order: number;
  dependencies?: string[]; // Task IDs that must be completed first
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completedBy?: string;
  estimatedHours?: number;
  actualHours?: number;
}

// TTPs (MITRE ATT&CK)
export interface TTP {
  id: string;
  tacticId: string;
  tacticName: string;
  techniqueId: string;
  techniqueName: string;
  subtechnique?: {
    id: string;
    name: string;
  };
  description?: string;
  occurrenceCount?: number;
  detectedAt?: string;
}

export interface MitreTactic {
  id: string;
  name: string;
  description: string;
}

export interface MitreTechnique {
  id: string;
  name: string;
  tacticId: string;
  description: string;
  subtechniques?: MitreTechnique[];
}

// Chain of Custody
export type CustodyAction = 
  | 'collected' 
  | 'transferred' 
  | 'analyzed' 
  | 'stored' 
  | 'returned'
  | 'accessed'
  | 'modified'
  | 'deleted'
  | 'preserved'
  | 'quarantined';

export interface CustodyLog {
  id: string;
  evidenceId: string;
  action: CustodyAction;
  user: string;
  timestamp: string;
  location?: string;
  signature?: string;
  notes?: string;
  previousHash?: string;
  currentHash: string;
  ipAddress?: string;
  device?: string;
}

// Evidence
export type EvidenceType = 'email' | 'network' | 'file' | 'log' | 'screenshot' | 'memory-dump' | 'disk-image' | 'other';
export type EvidenceStatus = 'collected' | 'analyzed' | 'quarantined' | 'preserved' | 'deleted';

export interface Evidence {
  id: string;
  type: EvidenceType;
  name: string;
  description?: string;
  collectedAt: string;
  collectedBy: string;
  size: string;
  hash: string;
  hashAlgorithm: 'md5' | 'sha1' | 'sha256';
  status: EvidenceStatus;
  location?: string;
  tags: string[];
  relatedObservables?: string[]; // Observable IDs
  custodyLog: CustodyLog[];
  metadata?: Record<string, any>;
}

// Templates
export interface CaseTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: Severity;
  tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[];
  customFields?: CustomField[];
  tags: string[];
}

export interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  source: string;
  customFields?: CustomField[];
  tags: string[];
}

// Custom Fields
export type CustomFieldType = 'string' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'text';

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  options?: string[]; // For select/multiselect
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// Timeline
export type TimelineEventType = 'info' | 'success' | 'warning' | 'error';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: string;
  user: string;
  metadata?: Record<string, any>;
}

// Stats and Metrics
export interface AlertStats {
  total: number;
  critical: number;
  high: number;
  new24h: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface IncidentStats {
  totalOpen: number;
  critical: number;
  inSLA: number;
  outOfSLA: number;
  resolved7d: number;
  avgResponseTime: string;
  avgResolutionTime: string;
}

export interface CaseStats {
  total: number;
  active: number;
  review: number;
  closed30d: number;
  avgTime: string;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
}

// Bulk Operations
export interface BulkOperation {
  action: 'merge' | 'close' | 'assign' | 'tag' | 'export' | 'delete' | 'escalate';
  itemIds: string[];
  params?: Record<string, any>;
}

// Search and Filters
export interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'between' | 'in';
  value: any;
}

export interface SearchQuery {
  text?: string;
  filters: SearchFilter[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
