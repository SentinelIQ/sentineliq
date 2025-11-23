/**
 * Shared Validation Schemas
 * 
 * Zod schemas que podem ser reutilizados tanto no backend (operations)
 * quanto no frontend (react-hook-form)
 */

import * as z from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .transform(val => val?.trim() || undefined),
});

export const updateWorkspaceSchema = z.object({
  id: z.string(),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
});

export const inviteMemberSchema = z.object({
  workspaceId: z.string(),
  email: z.string()
    .email('Invalid email address'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER'])
    .default('MEMBER'),
});

export const updateRoleSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
