import * as z from 'zod';

// ============================================
// Brand Validation Schemas
// ============================================

export const createBrandSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  name: z.string().min(1, 'Brand name required').max(255),
  description: z.string().max(1000).optional(),
  trademark: z.string().optional(),
  domains: z.array(z.string().url()).default([]),
  socialMediaHandles: z.array(z.string()).default([]),
  priority: z.number().int().min(1).max(5).default(1),
  confidentiality: z.enum(['public', 'internal', 'confidential']).default('public'),
});

export const updateBrandSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
  priority: z.number().int().min(1).max(5).optional(),
  domains: z.array(z.string().url()).optional(),
  socialMediaHandles: z.array(z.string()).optional(),
});

// ============================================
// Monitor Validation Schemas
// ============================================

export const createMonitorSchema = z.object({
  workspaceId: z.string().uuid(),
  brandId: z.string().uuid('Invalid brand ID'),
  monitoringType: z.enum(['domain', 'social', 'marketplace', 'web', 'dns']),
  source: z.string().min(1),
  searchTerms: z.array(z.string()).min(1, 'At least one search term required'),
  excludeTerms: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  targetRegions: z.array(z.string()).default([]),
  targetLanguages: z.array(z.string()).default(['pt', 'es', 'en']),
  yaraRules: z.string().optional(),
  regexPatterns: z.array(z.string()).default([]),
  domainPatterns: z.array(z.string()).default([]),
  confidenceThreshold: z.number().int().min(0).max(100).default(70),
  checkFrequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']).default('daily'),
  isAutomated: z.boolean().default(true),
  enableScreenshots: z.boolean().default(true),
  enableOCR: z.boolean().default(false),
  deepAnalysis: z.boolean().default(false),
});

export const updateMonitorSchema = z.object({
  searchTerms: z.array(z.string()).optional(),
  excludeTerms: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  targetRegions: z.array(z.string()).optional(),
  yaraRules: z.string().optional(),
  regexPatterns: z.array(z.string()).optional(),
  confidenceThreshold: z.number().int().min(0).max(100).optional(),
  status: z.enum(['active', 'paused', 'testing']).optional(),
  checkFrequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
});

// ============================================
// Alert Validation Schemas
// ============================================

export const createAlertSchema = z.object({
  workspaceId: z.string().uuid(),
  monitorId: z.string().uuid(),
  brandId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  url: z.string().url().optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  sourceData: z.any().optional(),
  confidence: z.number().int().min(0).max(100).default(100),
});

export const acknowledgeAlertSchema = z.object({
  id: z.string().uuid(),
});

// ============================================
// Infringement Validation Schemas
// ============================================

export const createInfringementSchema = z.object({
  workspaceId: z.string().uuid(),
  brandId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  url: z.string().url('Invalid URL'),
  domain: z.string().min(1),
  type: z.enum(['counterfeiting', 'domain_squatting', 'trademark_misuse', 'impersonation']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  ipAddress: z.string().optional(),
  location: z.string().optional(),
});

export const updateInfringementSchema = z.object({
  status: z.enum(['open', 'investigating', 'action_pending', 'action_taken', 'resolved', 'false_positive']).optional(),
  description: z.string().max(2000).optional(),
  investigatedBy: z.string().optional(),
});

export const escalateAlertSchema = z.object({
  alertId: z.string().uuid(),
  infringementData: createInfringementSchema.omit({ workspaceId: true, brandId: true }),
});

// ============================================
// Action Validation Schemas
// ============================================

export const createActionSchema = z.object({
  workspaceId: z.string().uuid(),
  infringementId: z.string().uuid(),
  actionType: z.enum(['dmca_notice', 'cease_desist', 'platform_report', 'legal_action', 'monitoring']),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  plannedDate: z.date().optional(),
  priority: z.number().int().min(1).max(5).default(2),
  assignedTo: z.string().optional(),
});

export const updateActionSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional(),
  executionDate: z.date().optional(),
  completionDate: z.date().optional(),
  result: z.string().optional(),
  evidence: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// ============================================
// Query Filter Schemas
// ============================================

export const brandFiltersSchema = z.object({
  workspaceId: z.string().uuid(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  priority: z.array(z.number()).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  search: z.string().optional(),
});

export const monitorFiltersSchema = z.object({
  workspaceId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  monitoringType: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  source: z.union([z.string(), z.array(z.string())]).optional(),
});

export const alertFiltersSchema = z.object({
  workspaceId: z.string().uuid(),
  monitorId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  severity: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
});

export const infringementFiltersSchema = z.object({
  workspaceId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  type: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  severity: z.union([z.string(), z.array(z.string())]).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
});

export const actionFiltersSchema = z.object({
  workspaceId: z.string().uuid(),
  infringementId: z.string().uuid().optional(),
  actionType: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  assignedTo: z.string().optional(),
});

// ============================================
// Pagination Schema
// ============================================

export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});
