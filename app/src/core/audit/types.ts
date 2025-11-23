import type { AuditLog } from 'wasp/entities';

export type { AuditLog };

export type AuditAction = string;

export interface AuditLogEntry {
  workspaceId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilter {
  workspaceId: string;
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogQueryResult {
  logs: (AuditLog & { user?: { email?: string | null; username?: string | null } })[];
  total: number;
  hasMore: boolean;
  [key: string]: any;
}

export interface WorkspaceEvent {
  workspaceId: string;
  userId?: string;
  eventType: string;
  data: Record<string, any>;
  audit?: {
    action: string;
    resource: string;
    resourceId?: string;
    description: string;
    metadata?: Record<string, any>;
  };
  notificationData?: {
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, any>;
  };
  context?: {
    ipAddress?: string;
    userAgent?: string;
  };
}
