/**
 * Connection Pool Load Testing
 * 
 * Load testing utilities for PostgreSQL connection pool
 */

import { PrismaClient } from '@prisma/client';

export interface LoadTestConfig {
  duration: number; // Test duration in seconds
  concurrency: number; // Concurrent connections
  queryType: 'read' | 'write' | 'mixed';
  rampUp: boolean; // Gradually increase load
}

export interface LoadTestResult {
  success: boolean;
  duration: number;
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  queriesPerSecond: number;
  errors: Array<{
    message: string;
    count: number;
  }>;
  connectionPoolStats?: {
    maxConnections: number;
    activeConnections: number;
    idleConnections: number;
  };
}

export class ConnectionPoolLoadTester {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });
  }

  /**
   * Run load test on connection pool
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log('[LoadTest] Starting connection pool load test...', config);

    const startTime = Date.now();
    const queries: Promise<{
      success: boolean;
      duration: number;
      error?: string;
    }>[] = [];

    const results: Array<{
      success: boolean;
      duration: number;
      error?: string;
    }> = [];

    const errorCounts = new Map<string, number>();

    // Generate load
    const endTime = startTime + config.duration * 1000;
    let queryCount = 0;

    const runQuery = async (queryId: number) => {
      const queryStartTime = Date.now();
      
      try {
        // Execute query based on type
        if (config.queryType === 'read' || (config.queryType === 'mixed' && queryId % 2 === 0)) {
          await this.executeReadQuery();
        } else {
          await this.executeWriteQuery(queryId);
        }

        const duration = Date.now() - queryStartTime;
        return { success: true, duration };

      } catch (error) {
        const duration = Date.now() - queryStartTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Track error counts
        const count = errorCounts.get(errorMessage) || 0;
        errorCounts.set(errorMessage, count + 1);

        return { success: false, duration, error: errorMessage };
      }
    };

    // Generate concurrent load
    while (Date.now() < endTime) {
      const batch: Promise<any>[] = [];
      
      for (let i = 0; i < config.concurrency; i++) {
        batch.push(runQuery(queryCount++));
      }

      const batchResults = await Promise.all(batch);
      results.push(...batchResults);

      // Ramp up delay
      if (config.rampUp && queryCount < config.concurrency * 10) {
        await this.sleep(100);
      }
    }

    // Calculate results
    const totalDuration = Date.now() - startTime;
    const successfulQueries = results.filter(r => r.success).length;
    const failedQueries = results.filter(r => !r.success).length;
    
    const durations = results.map(r => r.duration);
    const avgResponseTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minResponseTime = Math.min(...durations);
    const maxResponseTime = Math.max(...durations);
    const queriesPerSecond = (results.length / totalDuration) * 1000;

    const errors = Array.from(errorCounts.entries()).map(([message, count]) => ({
      message,
      count,
    }));

    console.log('[LoadTest] Load test completed:', {
      totalQueries: results.length,
      successfulQueries,
      failedQueries,
      avgResponseTime: Math.round(avgResponseTime),
      queriesPerSecond: Math.round(queriesPerSecond * 100) / 100,
    });

    return {
      success: failedQueries === 0,
      duration: totalDuration,
      totalQueries: results.length,
      successfulQueries,
      failedQueries,
      avgResponseTime: Math.round(avgResponseTime),
      minResponseTime,
      maxResponseTime,
      queriesPerSecond: Math.round(queriesPerSecond * 100) / 100,
      errors,
    };
  }

  /**
   * Execute a read query for testing
   */
  private async executeReadQuery(): Promise<void> {
    await this.prisma.user.count();
  }

  /**
   * Execute a write query for testing
   */
  private async executeWriteQuery(id: number): Promise<void> {
    // Use a lightweight operation for testing
    await this.prisma.systemLog.create({
      data: {
        level: 'DEBUG',
        component: 'load-test',
        message: `Load test query ${id}`,
        metadata: {
          testId: id,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Test connection pool limits
   */
  async testConnectionLimits(): Promise<{
    maxConnections: number;
    failurePoint?: number;
    errors?: string[];
  }> {
    console.log('[LoadTest] Testing connection pool limits...');

    let connections = 0;
    const clients: PrismaClient[] = [];
    const errors: string[] = [];

    try {
      // Create connections until we hit the limit
      for (let i = 0; i < 100; i++) {
        try {
          const client = new PrismaClient();
          await client.$connect();
          clients.push(client);
          connections++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(errorMessage);
          break;
        }
      }

      console.log(`[LoadTest] Successfully created ${connections} connections`);

    } finally {
      // Cleanup
      await Promise.all(clients.map(c => c.$disconnect()));
    }

    return {
      maxConnections: connections,
      failurePoint: errors.length > 0 ? connections : undefined,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Monitor connection pool health during load
   */
  async monitorPoolHealth(durationSeconds: number): Promise<{
    samples: Array<{
      timestamp: Date;
      activeConnections: number;
      idleConnections: number;
    }>;
  }> {
    console.log('[LoadTest] Monitoring connection pool health...');

    const samples: Array<{
      timestamp: Date;
      activeConnections: number;
      idleConnections: number;
    }> = [];

    const startTime = Date.now();
    const endTime = startTime + durationSeconds * 1000;

    while (Date.now() < endTime) {
      try {
        // Query connection stats from PostgreSQL
        const stats = await this.prisma.$queryRaw<Array<{
          active: number;
          idle: number;
        }>>`
          SELECT 
            COUNT(*) FILTER (WHERE state = 'active') as active,
            COUNT(*) FILTER (WHERE state = 'idle') as idle
          FROM pg_stat_activity
          WHERE datname = current_database()
        `;

        samples.push({
          timestamp: new Date(),
          activeConnections: Number(stats[0]?.active || 0),
          idleConnections: Number(stats[0]?.idle || 0),
        });

      } catch (error) {
        console.error('[LoadTest] Failed to query connection stats:', error);
      }

      await this.sleep(1000); // Sample every second
    }

    return { samples };
  }

  /**
   * Generate load test report
   */
  generateReport(result: LoadTestResult): string {
    const lines = [
      '=== Connection Pool Load Test Report ===',
      '',
      `Duration: ${result.duration}ms`,
      `Total Queries: ${result.totalQueries}`,
      `Successful: ${result.successfulQueries} (${Math.round((result.successfulQueries / result.totalQueries) * 100)}%)`,
      `Failed: ${result.failedQueries}`,
      '',
      '--- Performance ---',
      `Queries/Second: ${result.queriesPerSecond}`,
      `Avg Response Time: ${result.avgResponseTime}ms`,
      `Min Response Time: ${result.minResponseTime}ms`,
      `Max Response Time: ${result.maxResponseTime}ms`,
      '',
    ];

    if (result.errors.length > 0) {
      lines.push('--- Errors ---');
      result.errors.forEach(error => {
        lines.push(`${error.message}: ${error.count} occurrences`);
      });
      lines.push('');
    }

    if (result.connectionPoolStats) {
      lines.push('--- Connection Pool ---');
      lines.push(`Max Connections: ${result.connectionPoolStats.maxConnections}`);
      lines.push(`Active: ${result.connectionPoolStats.activeConnections}`);
      lines.push(`Idle: ${result.connectionPoolStats.idleConnections}`);
    }

    return lines.join('\n');
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Singleton instance
let loadTesterInstance: ConnectionPoolLoadTester | null = null;

export function getLoadTester(): ConnectionPoolLoadTester {
  if (!loadTesterInstance) {
    loadTesterInstance = new ConnectionPoolLoadTester();
  }
  return loadTesterInstance;
}
