/**
 * MITRE Module - Type Definitions
 * 
 * Centralized types and interfaces for polymorphic MITRE TTP system
 */

import type { TTP } from 'wasp/entities';

export type SupportedResourceType = 'CASE' | 'ALERT' | 'INCIDENT' | 'BRAND_INFRINGEMENT' | 'TIMELINE_EVENT' | 'ECLIPSE' | string;

// ============================================
// TTP Management Types
// ============================================

export interface GetTTPsArgs {
  resourceId: string;
  resourceType: SupportedResourceType;
  workspaceId?: string;
}

export interface LinkTTPArgs {
  resourceId: string;
  resourceType: SupportedResourceType;
  workspaceId?: string;
  tacticId: string;
  tacticName: string;
  techniqueId: string;
  techniqueName: string;
  subtechniqueId?: string;
  subtechniqueName?: string;
  description?: string;
  confidence?: number;
  severity?: string;
}

export interface UnlinkTTPArgs {
  ttpId: string;
  workspaceId?: string;
}

export interface UpdateTTPOccurrenceArgs {
  ttpId: string;
  workspaceId?: string;
}

export interface GetTTPStatisticsArgs {
  workspaceId?: string;
  resourceType?: SupportedResourceType;
  resourceId?: string;
}

export interface TTPStatistics {
  total: number;
  byTactic: Record<string, number>;
  byTechnique: Record<string, number>;
  byResourceType: Record<string, number>;
  topTechniques: Array<{
    techniqueId: string;
    techniqueName: string;
    count: number;
  }>;
}

// ============================================
// Reference Data Types
// ============================================

export interface MitreTacticData {
  id: string;
  name: string;
  description: string;
  platforms: string[];
}

export interface MitreTechniqueData {
  id: string;
  name: string;
  description: string;
  tacticIds: string[];
  platforms: string[];
  remoteExecutionRequired: boolean;
  userInteractionRequired: boolean;
  subtechniques?: MitreSubtechniqueData[];
}

export interface MitreSubtechniqueData {
  id: string;
  name: string;
  description: string;
  techniqueId: string;
  tacticIds: string[];
  platforms: string[];
}

export interface MitreReferenceUpdate {
  tactics: MitreTacticData[];
  techniques: MitreTechniqueData[];
  timestamp: Date;
  source: string;
}

// ============================================
// Query Response Types
// ============================================

export interface TTpWithCreator extends TTP {
  // createdBy is already defined in TTP schema as String?
}

export interface TTPWithMetadata extends TTP {
  resourceTypeName: string;
  resourceReference?: {
    id: string;
    name?: string;
    title?: string;
  };
}

// ============================================
// Service Types
// ============================================

export interface TTPValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TTPLinkingResult {
  success: boolean;
  ttp?: TTP;
  message: string;
  existingId?: string;
}

// ============================================
// Sync Job Types
// ============================================

export interface MitreSyncJob {
  lastSyncAt: Date;
  tacticsSynced: number;
  techniquesSynced: number;
  subtechniquesSynced: number;
  status: 'success' | 'partial' | 'failed';
  errorMessage?: string;
}

export interface MitreStixBundle {
  type: string;
  id: string;
  objects: MitreStixObject[];
}

export interface MitreStixObject {
  type: 'x-mitre-tactic' | 'attack-pattern' | 'bundle' | string;
  id: string;
  name: string;
  description?: string;
  [key: string]: any;
}

// ============================================
// Context Types
// ============================================

export interface MitreOperationContext {
  user: {
    id: string;
    email: string;
    isAdmin?: boolean;
  };
  workspace: {
    id: string;
    name: string;
  };
  entities: {
    TTP: any;
    WorkspaceMember: any;
    Workspace: any;
    User: any;
    MitreTactic: any;
    MitreTechnique: any;
    Case?: any;
    Alert?: any;
    Incident?: any;
    BrandInfringement?: any;
  };
}

// ============================================
// Utility Types
// ============================================

export type ResourceTypeUnion = 'CASE' | 'ALERT' | 'INCIDENT' | 'BRAND_INFRINGEMENT';

export const ResourceTypeLabels: Record<ResourceTypeUnion, string> = {
  CASE: 'Case',
  ALERT: 'Alert',
  INCIDENT: 'Incident',
  BRAND_INFRINGEMENT: 'Brand Infringement',
};

export const EntityNameMap: Record<ResourceTypeUnion, string> = {
  CASE: 'Case',
  ALERT: 'Alert',
  INCIDENT: 'Incident',
  BRAND_INFRINGEMENT: 'BrandInfringement',
};
