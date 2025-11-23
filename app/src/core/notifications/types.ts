export interface NotificationData {
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  // Ticket-specific metadata (optional)
  ticketMetadata?: {
    priority?: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
    status?: string;
    assignedTo?: string;
    labels?: string[];
    tags?: string[];
    dueDate?: string;
    project?: string;
    category?: string;
    severity?: string;
    source?: string;
    customFields?: Record<string, any>;
  };
}

export interface NotificationFilter {
  workspaceId?: string;
  userId?: string;
  isRead?: boolean;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface NotificationQueryResult {
  notifications: any[];
  total: number;
  hasMore: boolean;
  [key: string]: any;
}

export interface WorkspaceEvent {
  workspaceId: string;
  userId?: string;
  eventType: string;
  data: Record<string, any>;
  notificationData?: NotificationData;
  context?: {
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface NotificationProviderConfig {
  workspaceId: string;
  provider: 'EMAIL' | 'SLACK' | 'DISCORD' | 'WEBHOOK' | 'TELEGRAM' | 'TEAMS' | 'JIRA' | 'SERVICENOW' | 'AZURE_DEVOPS' | 'LINEAR' | 'GITHUB';
  isEnabled: boolean;
  config: Record<string, any>;
  eventTypes: string[];
}
