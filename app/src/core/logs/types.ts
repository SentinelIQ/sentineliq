import type { SystemLog } from 'wasp/entities';

export type { SystemLog };

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  level: LogLevel;
  message: string;
  component: string;
  metadata?: Record<string, any>;
}

export interface LogFilter {
  level?: LogLevel;
  component?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface LogQueryResult {
  logs: SystemLog[];
  total: number;
  hasMore: boolean;
  [key: string]: any;
}
