/**
 * Validation Schemas - Comprehensive Zod validation schemas for all Aegis forms
 *
 * Centralized validation logic with consistent error messages,
 * custom validators, and reusable field schemas.
 */

import { z } from 'zod';

// Utility validators
const emailSchema = z.string().email('Please enter a valid email address');

const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number');

const urlSchema = z.string().url('Please enter a valid URL');

const ipAddressSchema = z
  .string()
  .regex(
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    'Please enter a valid IP address',
  );

const hashSchema = z
  .string()
  .regex(/^[a-fA-F0-9]+$/, 'Hash must contain only hexadecimal characters');

// Common field schemas
const titleSchema = z
  .string()
  .min(5, 'Title must be at least 5 characters')
  .max(200, 'Title must not exceed 200 characters')
  .refine((title) => title.trim().length > 0, 'Title cannot be empty');

const descriptionSchema = z
  .string()
  .min(10, 'Description must be at least 10 characters')
  .max(5000, 'Description must not exceed 5000 characters');

const tagsSchema = z
  .array(z.string().min(1).max(50))
  .max(20, 'Maximum 20 tags allowed')
  .refine(
    (tags) => new Set(tags).size === tags.length,
    'Duplicate tags are not allowed',
  );

const severitySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
  errorMap: () => ({ message: 'Please select a valid severity level' }),
});

const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
  errorMap: () => ({ message: 'Please select a valid priority level' }),
});

const confidenceSchema = z
  .number()
  .min(0, 'Confidence must be at least 0')
  .max(100, 'Confidence must not exceed 100');

// Date validation helpers
const futureDateSchema = (fieldName: string) =>
  z.string().refine(
    (date) => new Date(date) > new Date(),
    `${fieldName} must be in the future`,
  );

const pastOrPresentDateSchema = (fieldName: string) =>
  z.string().refine(
    (date) => new Date(date) <= new Date(),
    `${fieldName} cannot be in the future`,
  );

const dateRangeSchema = (startField: string, endField: string) =>
  z
    .object({
      [startField]: z.string(),
      [endField]: z.string(),
    })
    .refine(
      (data) => {
        if (!data[startField] || !data[endField]) return true;
        return new Date(data[startField]) <= new Date(data[endField]);
      },
      {
        message: `${endField} must be after ${startField}`,
        path: [endField],
      },
    );

// Alert validation schemas
const alertBaseSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  severity: severitySchema,
  status: z.enum(['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED']),
  source: z.string().min(1, 'Source is required'),
  sourceId: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  tags: tagsSchema,
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
});

export const alertSchema = alertBaseSchema
  .refine(
    (data) => {
      if (data.dueDate && new Date(data.dueDate) <= new Date()) {
        return false;
      }
      return true;
    },
    {
      message: 'Due date must be in the future',
      path: ['dueDate'],
    },
  );

// Quick alert form schema (without workspaceId - handled separately in form)
export const quickAlertFormSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  severity: severitySchema,
  source: z.string().min(1, 'Source is required'),
});

// Alert form schema (without workspaceId - handled separately in form)
export const alertFormSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  severity: severitySchema,
  status: z.enum(['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED']),
  source: z.string().min(1, 'Source is required'),
  sourceId: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  tags: tagsSchema,
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const alertBulkSchema = z.object({
  alertIds: z.array(z.string()).min(1, 'At least one alert must be selected'),
  operation: z.enum(['merge', 'assign', 'escalate', 'close', 'tag']),
  data: z.record(z.any()),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
});

// Incident validation schemas
export const incidentSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  severity: severitySchema,
  status: z.enum(['ACTIVE', 'INVESTIGATING', 'CONTAINMENT', 'ERADICATION', 'RECOVERY', 'RESOLVED', 'CLOSED']),
  priority: prioritySchema,
  assigneeId: z.string().min(1, 'Assignee is required'),
  playbookId: z.string().optional(),
  slaHours: z
    .number()
    .min(1, 'SLA must be at least 1 hour')
    .max(8760, 'SLA cannot exceed 1 year'),
  affectedSystems: z
    .array(z.string())
    .min(1, 'At least one affected system is required'),
  communicationPlan: z.string().optional(),
  escalationPlan: z.string().optional(),
  tags: tagsSchema,
  workspaceId: z.string().min(1, 'Workspace ID is required'),
});

// Case validation schemas
export const caseSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  priority: prioritySchema,
  status: z.enum(['ACTIVE', 'REVIEW', 'CLOSED', 'ARCHIVED']),
  investigatorId: z.string().min(1, 'Investigator is required'),
  confidentiality: z.enum(['public', 'internal', 'confidential', 'restricted']),
  objectives: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().min(5, 'Objective must be at least 5 characters'),
        priority: prioritySchema,
        completed: z.boolean(),
      }),
    )
    .min(1, 'At least one objective is required'),
  resources: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['personnel', 'tools', 'external']),
      name: z.string().min(1, 'Resource name is required'),
      contact: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
  tags: tagsSchema,
  workspaceId: z.string().min(1, 'Workspace ID is required'),
});

// Observable validation schemas
export const observableSchema = z
  .object({
    type: z.enum(['IP', 'DOMAIN', 'URL', 'HASH', 'EMAIL', 'FILE', 'REGISTRY', 'OTHER']),
    value: z.string().min(1, 'Observable value is required'),
    tlp: z.enum(['white', 'green', 'amber', 'red']),
    pap: z.enum(['white', 'green', 'amber', 'red']),
    confidence: confidenceSchema,
    description: z.string().optional(),
    tags: tagsSchema,
    source: z.string().min(1, 'Source is required'),
    firstSeen: z.string().optional(),
    lastSeen: z.string().optional(),
    workspaceId: z.string().min(1, 'Workspace ID is required'),
  })
  .refine(
    (data) => {
      // Validate observable value based on type
      switch (data.type) {
        case 'IP':
          return ipAddressSchema.safeParse(data.value).success;
        case 'DOMAIN':
          return z.string().min(3).max(255).safeParse(data.value).success;
        case 'URL':
          return urlSchema.safeParse(data.value).success;
        case 'HASH':
          return hashSchema.safeParse(data.value).success;
        case 'EMAIL':
          return emailSchema.safeParse(data.value).success;
        default:
          return true;
      }
    },
    {
      message: 'Observable value format is invalid for the selected type',
      path: ['value'],
    },
  )
  .refine(
    (data) => {
      if (data.firstSeen && data.lastSeen) {
        return new Date(data.firstSeen) <= new Date(data.lastSeen);
      }
      return true;
    },
    {
      message: 'Last seen must be after first seen',
      path: ['lastSeen'],
    },
  );

export const observableBulkImportSchema = z.object({
  observables: z
    .array(
      z.object({
        type: z.enum(['ip', 'domain', 'url', 'hash', 'email', 'file']),
        value: z.string().min(1),
        tlp: z.enum(['white', 'green', 'amber', 'red']).default('white'),
        pap: z.enum(['white', 'green', 'amber', 'red']).default('white'),
        confidence: z.number().min(0).max(100).default(50),
        description: z.string().optional(),
        tags: z.array(z.string()).default([]),
        source: z.string().min(1),
      }),
    )
    .min(1, 'At least one observable is required')
    .max(1000, 'Maximum 1000 observables per import'),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
});

// Evidence validation schemas
export const evidenceSchema = z.object({
  name: z.string().min(1, 'Evidence name is required'),
  type: z.enum(['EMAIL', 'NETWORK', 'FILE', 'LOG', 'SCREENSHOT', 'MEMORY_DUMP', 'DISK_IMAGE', 'OTHER']),
  description: descriptionSchema,
  hash: z
    .object({
      algorithm: z.enum(['md5', 'sha1', 'sha256', 'sha512']),
      value: hashSchema,
    })
    .optional(),
  fileSize: z.number().min(0).optional(),
  mimeType: z.string().optional(),
  source: z.string().min(1, 'Source is required'),
  collectedBy: z.string().min(1, 'Collector is required'),
  collectedAt: pastOrPresentDateSchema('Collection date'),
  location: z.string().min(1, 'Location is required'),
  chainOfCustody: z.array(
    z.object({
      handlerName: z.string().min(1, 'Handler name is required'),
      handledAt: z.string().min(1, 'Handled date is required'),
      action: z.enum(['collected', 'analyzed', 'transferred', 'stored']),
      notes: z.string().optional(),
    }),
  ),
  caseId: z.string().min(1, 'Case ID is required'),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
});

// Task validation schemas
export const taskSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    priority: prioritySchema,
    status: z.enum([
      'WAITING',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
    ]),
    assigneeId: z.string().min(1, 'Assignee is required'),
    estimatedHours: z
      .number()
      .min(0.5, 'Estimated hours must be at least 0.5')
      .max(1000, 'Estimated hours cannot exceed 1000'),
    actualHours: z.number().min(0).max(1000).optional(),
    dueDate: futureDateSchema('Due date'),
    dependencies: z.array(z.string()),
    progress: z.number().min(0).max(100),
    tags: tagsSchema,
    caseId: z.string().min(1, 'Case ID is required'),
    workspaceId: z.string().min(1, 'Workspace ID is required'),
  })
  .refine(
    (data) => {
      if (
        data.actualHours &&
        data.estimatedHours &&
        data.actualHours > data.estimatedHours * 2
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        'Actual hours significantly exceed estimated hours. Please review.',
      path: ['actualHours'],
    },
  );

// TTP validation schemas
export const ttpSchema = z
  .object({
    tacticId: z.string().min(1, 'Tactic is required'),
    techniqueId: z.string().min(1, 'Technique is required'),
    subTechniqueId: z.string().optional(),
    description: z.string().optional(),
    confidence: confidenceSchema,
    firstObserved: z.string().optional(),
    lastObserved: z.string().optional(),
    occurrenceCount: z.number().min(1, 'Occurrence count must be at least 1'),
    severity: severitySchema,
    evidenceDescription: z
      .string()
      .min(10, 'Evidence description must be at least 10 characters'),
    mitigation: z.string().optional(),
    notes: z.string().optional(),
    caseId: z.string().min(1, 'Case ID is required'),
  })
  .refine(
    (data) => {
      if (data.firstObserved && data.lastObserved) {
        return new Date(data.firstObserved) <= new Date(data.lastObserved);
      }
      return true;
    },
    {
      message: 'Last observed must be after first observed',
      path: ['lastObserved'],
    },
  );

export const ttpOccurrenceSchema = z.object({
  observedDate: z.string().min(1, 'Observation date is required'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  confidence: confidenceSchema,
  evidenceFiles: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// Custom validation helpers
export const validateFileSize = (maxSizeMB: number) =>
  z
    .number()
    .max(maxSizeMB * 1024 * 1024, `File size must not exceed ${maxSizeMB}MB`);

export const validateFileType = (allowedTypes: string[]) =>
  z.string().refine(
    (type) => allowedTypes.includes(type),
    `File type must be one of: ${allowedTypes.join(', ')}`,
  );

// Schema validation helper
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string[]> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(error.message);
  });

  return { success: false, errors };
}

// Form validation hook
export function useFormValidation<T>(schema: z.ZodSchema<T>) {
  const validate = (data: unknown) => {
    return validateSchema(schema, data);
  };

  const getFieldError = (
    errors: Record<string, string[]> | undefined,
    fieldName: string,
  ) => {
    return errors?.[fieldName]?.[0];
  };

  return { validate, getFieldError };
}
