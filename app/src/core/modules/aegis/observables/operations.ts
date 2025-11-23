/**
 * Aegis Module - Observable Operations
 * 
 * This module provides operations for managing Indicators of Compromise (IOCs) and observables.
 * Includes threat intelligence enrichment, TLP/PAP classification, and bulk import/export.
 */

import { HttpError } from 'wasp/server';
import type {
  Observable,
  User,
  Workspace,
  WorkspaceMember,
  Alert,
  Incident,
  Case,
  Evidence,
  TimelineEvent,
} from 'wasp/entities';
import { FeatureChecker } from '../../../features/FeatureChecker';
import {
  ObservableType,
  TLP,
  PAP,
  TimelineEventType,
} from '@prisma/client';
import type {
  ObservableWithRelations,
  ObservableFilters,
  PaginationParams,
  SortParams,
  PaginatedResult,
  CreateObservableInput,
  UpdateObservableInput,
  ObservableStats,
  ObservableEnrichment,
} from '../models/types';
import { threatIntel } from '../services/threatIntel';

import { checkWorkspaceAccess } from '../utils/permissions';
import { randomUUID } from 'crypto';

/**
 * Get observables with filtering, pagination, and sorting
 */
export const getObservables = async (
  args: {
    filters: ObservableFilters;
    pagination?: PaginationParams;
    sort?: SortParams;
  },
  context: any
): Promise<PaginatedResult<ObservableWithRelations>> => {
  const { filters, pagination = {}, sort = {} } = args;
  
  // Check workspace access
  await checkWorkspaceAccess(context, filters.workspaceId);

  const page = pagination.page || 1;
  const pageSize = Math.min(pagination.pageSize || 50, 200);
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: any = {
    workspaceId: filters.workspaceId,
  };

  if (filters.type) {
    where.type = Array.isArray(filters.type)
      ? { in: filters.type }
      : filters.type;
  }

  if (filters.tlp) {
    where.tlp = Array.isArray(filters.tlp)
      ? { in: filters.tlp }
      : filters.tlp;
  }

  if (filters.ioc !== undefined) {
    where.ioc = filters.ioc;
  }

  if (filters.sighted !== undefined) {
    where.sighted = filters.sighted;
  }

  if (filters.tags && filters.tags.length > 0) {
    where.tags = { hasSome: filters.tags };
  }

  if (filters.createdById) {
    where.createdById = filters.createdById;
  }

  // Build orderBy
  const orderBy: any = {};
  if (sort.sortBy) {
    orderBy[sort.sortBy] = sort.sortOrder || 'desc';
  } else {
    orderBy.createdAt = 'desc';
  }

  // Execute query
  const [observables, total] = await Promise.all([
    context.entities.Observable.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        workspace: true,
        createdBy: true,
        alerts: {
          take: 5,
        },
        incidents: {
          take: 5,
        },
        cases: {
          take: 5,
        },
        evidence: {
          take: 5,
        },
      },
    }),
    context.entities.Observable.count({ where }),
  ]);

  return {
    data: observables,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * Get observable by ID with full details
 */
export const getObservableById = async (
  args: { observableId: string; workspaceId: string },
  context: any
): Promise<ObservableWithRelations> => {
  const { observableId, workspaceId } = args;

  // Check workspace access
  await checkWorkspaceAccess(context, workspaceId);

  const observable = await context.entities.Observable.findUnique({
    where: { id: observableId },
    include: {
      workspace: true,
      createdBy: true,
      alerts: {
        include: {
          assignedTo: true,
        },
      },
      incidents: {
        include: {
          assignedTo: true,
        },
      },
      cases: {
        include: {
          investigator: true,
        },
      },
      evidence: {
        include: {
          collectedBy: true,
        },
      },
    },
  });

  if (!observable) {
    throw new HttpError(404, 'Observable not found');
  }

  if (observable.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  return observable;
};

/**
 * Create a new observable
 */
export const createObservable = async (
  args: { data: CreateObservableInput },
  context: any
): Promise<Observable> => {
  const { data } = args;

  // Check workspace access
  await checkWorkspaceAccess(context, data.workspaceId);

  // Check if observables & IoCs feature is available
  await FeatureChecker.requireFeature(
    context,
    data.workspaceId,
    'aegis.observables_ioc'
  );

  // Verify createdBy user exists
  const user = await context.entities.User.findUnique({
    where: { id: data.createdById },
  });

  if (!user) {
    throw new HttpError(400, 'Invalid user ID');
  }

  // Check for duplicates
  const existing = await context.entities.Observable.findFirst({
    where: {
      workspaceId: data.workspaceId,
      type: data.type,
      value: data.value,
    },
  });

  if (existing) {
    throw new HttpError(400, 'Observable with this type and value already exists');
  }

  // Create observable
  const observable = await context.entities.Observable.create({
    data: {
      workspaceId: data.workspaceId,
      type: data.type,
      value: data.value,
      dataType: data.dataType,
      tlp: data.tlp || 'WHITE',
      pap: data.pap || 'WHITE',
      ioc: data.ioc || false,
      sighted: data.sighted || false,
      tags: data.tags || [],
      description: data.description,
      source: data.source,
      createdById: data.createdById,
    },
  });

  return observable;
};

/**
 * Update an observable
 */
export const updateObservable = async (
  args: {
    observableId: string;
    workspaceId: string;
    data: UpdateObservableInput;
  },
  context: any
): Promise<Observable> => {
  const { observableId, workspaceId, data } = args;

  // Check workspace access
  await checkWorkspaceAccess(context, workspaceId);

  // Check if observables & IoCs feature is available
  await FeatureChecker.requireFeature(
    context,
    workspaceId,
    'aegis.observables_ioc'
  );

  // Get existing observable
  const existingObservable = await context.entities.Observable.findUnique({
    where: { id: observableId },
  });

  if (!existingObservable) {
    throw new HttpError(404, 'Observable not found');
  }

  if (existingObservable.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  // Update observable
  const observable = await context.entities.Observable.update({
    where: { id: observableId },
    data: {
      ...(data.type && { type: data.type }),
      ...(data.value && { value: data.value }),
      ...(data.dataType !== undefined && { dataType: data.dataType }),
      ...(data.tlp && { tlp: data.tlp }),
      ...(data.pap && { pap: data.pap }),
      ...(data.ioc !== undefined && { ioc: data.ioc }),
      ...(data.sighted !== undefined && { sighted: data.sighted }),
      ...(data.tags && { tags: data.tags }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.source !== undefined && { source: data.source }),
      ...(data.enrichment && { enrichment: data.enrichment }),
      updatedAt: new Date(),
    },
  });

  return observable;
};

/**
 * Mark observable as sighted (seen in environment)
 */
export const markAsSighted = async (
  args: { observableId: string; workspaceId: string },
  context: any
): Promise<Observable> => {
  return updateObservable(
    {
      observableId: args.observableId,
      workspaceId: args.workspaceId,
      data: { sighted: true },
    },
    context
  );
};

/**
 * Enrich observable with threat intelligence from multiple sources
 */
export const enrichObservable = async (
  args: {
    observableId: string;
    workspaceId: string;
    services?: string[]; // ['virustotal', 'abuseipdb', 'alienvault']
  },
  context: any
): Promise<Observable> => {
  const { observableId, workspaceId, services = ['virustotal', 'abuseipdb'] } = args;

  // Get observable
  const observable = await getObservableById({ observableId, workspaceId }, context);

  // Call threat intelligence services
  const enrichmentResult = await threatIntel.enrichObservable(
    observable.type,
    observable.value,
    services
  );

  // Build complete enrichment object with proper verdict structure
  const enrichment: ObservableEnrichment = {
    ...enrichmentResult,
    verdicts: (enrichmentResult.verdicts || []).map((v: any) => ({
      service: v.source || v.service,
      verdict: v.verdict,
      confidence: v.confidence,
      scanDate: v.scanDate || new Date().toISOString(),
      details: v.details
    })),
    metadata: {
      enrichedAt: new Date().toISOString(),
      services: services.length > 0 ? services : ['virustotal', 'abuseipdb'],
    },
  };

  // Update observable with enrichment data
  return updateObservable(
    {
      observableId,
      workspaceId,
      data: { enrichment },
    },
    context
  );
};

/**
 * Bulk import observables from CSV/JSON/STIX
 */
export const bulkImportObservables = async (
  args: {
    workspaceId: string;
    observables: CreateObservableInput[];
    skipDuplicates?: boolean;
  },
  context: any
): Promise<{ created: number; skipped: number; errors: string[] }> => {
  const { workspaceId, observables, skipDuplicates = true } = args;

  // Check workspace access
  const { userId } = await checkWorkspaceAccess(context, workspaceId);

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const obs of observables) {
    try {
      // Check for duplicates
      if (skipDuplicates) {
        const existing = await context.entities.Observable.findFirst({
          where: {
            workspaceId,
            type: obs.type,
            value: obs.value,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }
      }

      await createObservable(
        {
          data: {
            ...obs,
            workspaceId,
            createdById: obs.createdById || userId,
          },
        },
        context
      );
      created++;
    } catch (error: any) {
      errors.push(`${obs.value}: ${error.message}`);
    }
  }

  return { created, skipped, errors };
};

/**
 * Export observables in various formats
 */
export const exportObservables = async (
  args: {
    workspaceId: string;
    filters?: ObservableFilters;
    format: 'json' | 'csv' | 'stix';
  },
  context: any
): Promise<any> => {
  const { workspaceId, filters = { workspaceId }, format } = args;

  const result = await getObservables(
    {
      filters,
      pagination: { page: 1, pageSize: 10000 },
    },
    context
  );

  if (format === 'json') {
    return result.data;
  }

  if (format === 'stix') {
    const bundleId = `bundle--${generateUUIDv4()}`;
    
    const stixObjects = result.data.map(obs => {
      const indicatorId = `indicator--${generateUUIDv4()}`;
      
      const stixPattern = buildSTIXPattern(obs.type, obs.value);
      
      const indicator: any = {
        type: 'indicator',
        spec_version: '2.1',
        id: indicatorId,
        created: new Date(obs.createdAt).toISOString(),
        modified: new Date(obs.updatedAt).toISOString(),
        name: obs.description || `${obs.type}: ${obs.value}`,
        description: obs.description || undefined,
        indicator_types: obs.ioc ? ['malicious-activity'] : ['benign'],
        pattern: stixPattern,
        pattern_type: 'stix',
        pattern_version: '2.1',
        valid_from: new Date(obs.createdAt).toISOString(),
        labels: obs.tags.length > 0 ? obs.tags : undefined,
      };

      const tlpMarking = getTLPMarkingDefinition(obs.tlp);
      if (tlpMarking) {
        indicator.object_marking_refs = [tlpMarking];
      }

      if (obs.enrichment) {
        const enrichment = obs.enrichment as ObservableEnrichment;
        if (enrichment.threatLevel) {
          indicator.confidence = getThreatLevelConfidence(enrichment.threatLevel);
        }
        if (enrichment.tags && enrichment.tags.length > 0) {
          indicator.labels = [...(indicator.labels || []), ...enrichment.tags];
        }
      }

      if (obs.source) {
        indicator.external_references = [
          {
            source_name: obs.source,
            description: `Observable source: ${obs.source}`,
          },
        ];
      }

      return indicator;
    });

    return {
      type: 'bundle',
      id: bundleId,
      spec_version: '2.1',
      objects: stixObjects,
    };
  }

  // CSV format
  return {
    format: 'csv',
    data: result.data.map(obs => ({
      id: obs.id,
      type: obs.type,
      value: obs.value,
      ioc: obs.ioc,
      sighted: obs.sighted,
      tlp: obs.tlp,
      tags: obs.tags.join(';'),
      createdAt: obs.createdAt,
    })),
  };
};

/**
 * Search observables with advanced query
 */
export const searchObservables = async (
  args: {
    workspaceId: string;
    query: string;
    type?: ObservableType;
  },
  context: any
): Promise<Observable[]> => {
  const { workspaceId, query, type } = args;

  // Check workspace access
  await checkWorkspaceAccess(context, workspaceId);

  const where: any = {
    workspaceId,
    OR: [
      { value: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { source: { contains: query, mode: 'insensitive' } },
      { tags: { has: query } },
    ],
  };

  if (type) {
    where.type = type;
  }

  const observables = await context.entities.Observable.findMany({
    where,
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: true,
    },
  });

  return observables;
};

/**
 * Link observable to alert/incident/case
 */
export const linkObservable = async (
  args: {
    observableId: string;
    workspaceId: string;
    linkTo: {
      alertId?: string;
      incidentId?: string;
      caseId?: string;
      evidenceId?: string;
    };
  },
  context: any
): Promise<Observable> => {
  const { observableId, workspaceId, linkTo } = args;

  // Check workspace access
  await checkWorkspaceAccess(context, workspaceId);

  // Get observable
  const observable = await context.entities.Observable.findUnique({
    where: { id: observableId },
  });

  if (!observable) {
    throw new HttpError(404, 'Observable not found');
  }

  if (observable.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  // Link to entities
  const updates: any = {};

  if (linkTo.alertId) {
    updates.alerts = { connect: { id: linkTo.alertId } };
  }

  if (linkTo.incidentId) {
    updates.incidents = { connect: { id: linkTo.incidentId } };
  }

  if (linkTo.caseId) {
    updates.cases = { connect: { id: linkTo.caseId } };
  }

  if (linkTo.evidenceId) {
    updates.evidence = { connect: { id: linkTo.evidenceId } };
  }

  const updated = await context.entities.Observable.update({
    where: { id: observableId },
    data: updates,
  });

  return updated;
};

/**
 * Get observable statistics
 */
export const getObservableStats = async (
  args: { workspaceId: string },
  context: any
): Promise<ObservableStats> => {
  const { workspaceId } = args;

  // Check workspace access
  await checkWorkspaceAccess(context, workspaceId);

  const observables = await context.entities.Observable.findMany({
    where: { workspaceId },
  });

  const stats: ObservableStats = {
    total: observables.length,
    iocs: observables.filter((o: any) => o.ioc).length,
    sighted: observables.filter((o: any) => o.sighted).length,
    byType: {},
    byTLP: {},
    enriched: observables.filter((o: any) => o.enrichment !== null).length,
    malicious: 0, // Would come from enrichment data
  };

  // Group by type and TLP
  observables.forEach((obs: any) => {
    stats.byType[obs.type] = (stats.byType[obs.type] || 0) + 1;
    stats.byTLP[obs.tlp] = (stats.byTLP[obs.tlp] || 0) + 1;

    // Count malicious from enrichment
    if (obs.enrichment && (obs.enrichment as any).threatLevel === 'malicious') {
      stats.malicious++;
    }
  });

  return stats;
};

/**
 * Delete observable
 */
export const deleteObservable = async (
  args: { observableId: string; workspaceId: string },
  context: any
): Promise<void> => {
  const { observableId, workspaceId } = args;

  // Check workspace access
  const { role } = await checkWorkspaceAccess(context, workspaceId);

  // Check if observables & IoCs feature is available
  await FeatureChecker.requireFeature(
    context,
    workspaceId,
    'aegis.observables_ioc'
  );

  // Only admins and owners can delete
  if (!['OWNER', 'ADMIN'].includes(role)) {
    throw new HttpError(403, 'Only admins and owners can delete observables');
  }

  // Get observable
  const observable = await context.entities.Observable.findUnique({
    where: { id: observableId },
  });

  if (!observable) {
    throw new HttpError(404, 'Observable not found');
  }

  if (observable.workspaceId !== workspaceId) {
    throw new HttpError(403, 'Access denied');
  }

  // Delete observable
  await context.entities.Observable.delete({
    where: { id: observableId },
  });
};

/**
 * Generate UUIDv4 for STIX objects
 */
function generateUUIDv4(): string {
  return randomUUID();
}

/**
 * Build STIX 2.1 compliant pattern from observable
 */
function buildSTIXPattern(type: string, value: string): string {
  const typeMapping: Record<string, string> = {
    IP: 'ipv4-addr',
    IPV6: 'ipv6-addr',
    DOMAIN: 'domain-name',
    URL: 'url',
    EMAIL: 'email-addr',
    FILE_HASH: 'file',
    HASH_MD5: 'file',
    HASH_SHA1: 'file',
    HASH_SHA256: 'file',
    MAC_ADDRESS: 'mac-addr',
    USER_AGENT: 'user-agent',
    REGISTRY_KEY: 'windows-registry-key',
    PROCESS_NAME: 'process',
    MUTEX: 'mutex',
    CRYPTO_WALLET: 'cryptocurrency-wallet',
  };

  const stixType = typeMapping[type] || 'artifact';
  const escapedValue = value.replace(/'/g, "\\'");

  switch (type) {
    case 'IP':
    case 'IPV6':
      return `[${stixType}:value = '${escapedValue}']`;
    
    case 'DOMAIN':
      return `[${stixType}:value = '${escapedValue}']`;
    
    case 'URL':
      return `[${stixType}:value = '${escapedValue}']`;
    
    case 'EMAIL':
      return `[${stixType}:value = '${escapedValue}']`;
    
    case 'HASH_MD5':
      return `[file:hashes.MD5 = '${escapedValue}']`;
    
    case 'HASH_SHA1':
      return `[file:hashes.'SHA-1' = '${escapedValue}']`;
    
    case 'HASH_SHA256':
      return `[file:hashes.'SHA-256' = '${escapedValue}']`;
    
    case 'FILE_HASH':
      if (value.length === 32) {
        return `[file:hashes.MD5 = '${escapedValue}']`;
      } else if (value.length === 40) {
        return `[file:hashes.'SHA-1' = '${escapedValue}']`;
      } else if (value.length === 64) {
        return `[file:hashes.'SHA-256' = '${escapedValue}']`;
      }
      return `[file:hashes.'SHA-256' = '${escapedValue}']`;
    
    case 'MAC_ADDRESS':
      return `[${stixType}:value = '${escapedValue}']`;
    
    case 'REGISTRY_KEY':
      return `[${stixType}:key = '${escapedValue}']`;
    
    case 'PROCESS_NAME':
      return `[${stixType}:name = '${escapedValue}']`;
    
    case 'MUTEX':
      return `[${stixType}:name = '${escapedValue}']`;
    
    case 'CRYPTO_WALLET':
      return `[${stixType}:address = '${escapedValue}']`;
    
    default:
      return `[artifact:payload_bin = '${escapedValue}']`;
  }
}

/**
 * Get STIX TLP marking definition reference
 */
function getTLPMarkingDefinition(tlp: string): string | null {
  const tlpMarkings: Record<string, string> = {
    WHITE: 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9',
    GREEN: 'marking-definition--34098fce-860f-48ae-8e50-ebd3cc5e41da',
    AMBER: 'marking-definition--f88d31f6-486f-44da-b317-01333bde0b82',
    RED: 'marking-definition--5e57c739-391a-4eb3-b6be-7d15ca92d5ed',
  };

  return tlpMarkings[tlp.toUpperCase()] || null;
}

/**
 * Convert threat level to STIX confidence score
 */
function getThreatLevelConfidence(threatLevel: string): number {
  const confidenceMap: Record<string, number> = {
    malicious: 85,
    suspicious: 50,
    benign: 10,
    unknown: 0,
  };

  return confidenceMap[threatLevel.toLowerCase()] || 0;
}
