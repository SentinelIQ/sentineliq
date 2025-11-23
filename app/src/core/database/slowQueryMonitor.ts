/**
 * Slow Query Monitoring
 * 
 * Monitors and logs slow database queries for performance optimization
 */

import { Prisma } from '@prisma/client';
import type { SystemLog } from 'wasp/entities';

interface SlowQueryConfig {
  threshold: number; // Milliseconds
  logToConsole: boolean;
  logToDatabase: boolean;
  alertOnCritical: boolean;
  criticalThreshold: number; // Milliseconds
}

const DEFAULT_CONFIG: SlowQueryConfig = {
  threshold: 1000, // 1 second
  logToConsole: true,
  logToDatabase: true,
  alertOnCritical: true,
  criticalThreshold: 5000, // 5 seconds
};

export class SlowQueryMonitor {
  private config: SlowQueryConfig;
  private queryStats: Map<string, {
    count: number;
    totalDuration: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
  }> = new Map();

  constructor(config?: Partial<SlowQueryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create Prisma middleware for query monitoring
   */
  createMiddleware() {
    return async (params: any, next: any) => {
      const startTime = Date.now();
      
      try {
        const result = await next(params);
        const duration = Date.now() - startTime;

        // Check if query is slow
        if (duration >= this.config.threshold) {
          await this.handleSlowQuery({
            model: params.model,
            action: params.action,
            duration,
            args: params.args,
          });
        }

        // Update stats
        this.updateQueryStats(params.model, params.action, duration);

        return result;

      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Log query errors
        console.error('[SlowQuery] Query error:', {
          model: params.model,
          action: params.action,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
      }
    };
  }

  /**
   * Handle slow query detection
   */
  private async handleSlowQuery(queryInfo: {
    model: string;
    action: string;
    duration: number;
    args: any;
  }): Promise<void> {
    const { model, action, duration, args } = queryInfo;

    const logEntry = {
      model,
      action,
      duration,
      timestamp: new Date().toISOString(),
      args: this.sanitizeArgs(args),
    };

    if (this.config.logToConsole) {
      console.warn('[SlowQuery] Slow query detected:', logEntry);
    }

    // Check if critically slow
    if (duration >= this.config.criticalThreshold) {
      console.error('[SlowQuery] CRITICAL: Extremely slow query detected:', logEntry);
      
      if (this.config.alertOnCritical) {
        await this.sendCriticalAlert(logEntry);
      }
    }

    // Log to database if enabled
    if (this.config.logToDatabase) {
      // Note: This should be done asynchronously to avoid slowing down the original query
      this.logToDatabase(logEntry).catch(error => {
        console.error('[SlowQuery] Failed to log to database:', error);
      });
    }
  }

  /**
   * Update query statistics
   */
  private updateQueryStats(model: string, action: string, duration: number): void {
    const key = `${model}.${action}`;
    const stats = this.queryStats.get(key);

    if (stats) {
      stats.count++;
      stats.totalDuration += duration;
      stats.avgDuration = stats.totalDuration / stats.count;
      stats.maxDuration = Math.max(stats.maxDuration, duration);
      stats.minDuration = Math.min(stats.minDuration, duration);
    } else {
      this.queryStats.set(key, {
        count: 1,
        totalDuration: duration,
        avgDuration: duration,
        maxDuration: duration,
        minDuration: duration,
      });
    }
  }

  /**
   * Sanitize query arguments (remove sensitive data)
   */
  private sanitizeArgs(args: any): any {
    if (!args) return null;

    try {
      const sanitized = JSON.parse(JSON.stringify(args));
      
      // Remove password fields
      if (sanitized.data?.password) {
        sanitized.data.password = '***';
      }
      if (sanitized.where?.password) {
        sanitized.where.password = '***';
      }

      // Truncate large data
      const str = JSON.stringify(sanitized);
      if (str.length > 1000) {
        return str.substring(0, 1000) + '... (truncated)';
      }

      return sanitized;
    } catch (error) {
      return 'Unable to sanitize args';
    }
  }

  /**
   * Log slow query to database
   */
  private async logToDatabase(logEntry: {
    model: string;
    action: string;
    duration: number;
    timestamp: string;
    args: any;
  }): Promise<void> {
    // This would use the SystemLog entity
    // Implementation depends on having access to Prisma client
    console.log('[SlowQuery] Would log to database:', logEntry);
  }

  /**
   * Send critical alert
   */
  private async sendCriticalAlert(logEntry: any): Promise<void> {
    console.error('[SlowQuery] CRITICAL ALERT:', {
      model: logEntry.model,
      action: logEntry.action,
      duration: `${logEntry.duration}ms`,
      threshold: `${this.config.criticalThreshold}ms`,
      query: logEntry.query,
      timestamp: logEntry.timestamp,
    });
    // TODO: Integrate with notification system
  }

  /**
   * Get query statistics
   */
  getQueryStats(): Map<string, {
    count: number;
    totalDuration: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
  }> {
    return new Map(this.queryStats);
  }

  /**
   * Get top slow queries
   */
  getTopSlowQueries(limit: number = 10): Array<{
    query: string;
    avgDuration: number;
    maxDuration: number;
    count: number;
  }> {
    return Array.from(this.queryStats.entries())
      .map(([query, stats]) => ({
        query,
        avgDuration: stats.avgDuration,
        maxDuration: stats.maxDuration,
        count: stats.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.queryStats.clear();
  }

  /**
   * Get monitoring report
   */
  getReport(): {
    totalQueries: number;
    slowQueries: number;
    avgQueryDuration: number;
    topSlowQueries: Array<{
      query: string;
      avgDuration: number;
      maxDuration: number;
      count: number;
    }>;
  } {
    const stats = Array.from(this.queryStats.values());
    const totalQueries = stats.reduce((sum, s) => sum + s.count, 0);
    const slowQueries = stats.filter(s => s.avgDuration >= this.config.threshold).length;
    const avgQueryDuration = stats.length > 0
      ? stats.reduce((sum, s) => sum + s.avgDuration, 0) / stats.length
      : 0;

    return {
      totalQueries,
      slowQueries,
      avgQueryDuration: Math.round(avgQueryDuration),
      topSlowQueries: this.getTopSlowQueries(10),
    };
  }
}

// Singleton instance
let monitorInstance: SlowQueryMonitor | null = null;

export function getSlowQueryMonitor(): SlowQueryMonitor {
  if (!monitorInstance) {
    monitorInstance = new SlowQueryMonitor();
  }
  return monitorInstance;
}

/**
 * Initialize slow query monitoring on Prisma client
 */
export function initializeSlowQueryMonitoring(prisma: any): void {
  const monitor = getSlowQueryMonitor();
  prisma.$use(monitor.createMiddleware());
  console.log('[SlowQuery] Monitoring initialized');
}
