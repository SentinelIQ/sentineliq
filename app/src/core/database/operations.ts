/**
 * Database Management Operations
 * 
 * Admin operations for database backup, recovery, and monitoring
 */

import type { GetBackupList, TestDisasterRecovery, GetSlowQueryStats, RunConnectionPoolLoadTest } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { getBackupService } from './backup';
import { getRecoveryService } from './recovery';
import { getSlowQueryMonitor } from './slowQueryMonitor';
import { getLoadTester } from './loadTest';

// ==================== Backup Operations ====================

/**
 * List all available backups
 */
export const getBackupList: GetBackupList<void, Array<{
  name: string;
  path: string;
  size: number;
  sizeFormatted: string;
  timestamp: Date;
}>> = async (_args, context) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const backupService = getBackupService();
  const backups = await backupService.listBackups();

  return backups.map(backup => ({
    ...backup,
    sizeFormatted: formatBytes(backup.size),
  }));
};

/**
 * Get backup statistics
 */
export const getBackupStats: GetBackupList<void, {
  totalBackups: number;
  totalSize: number;
  totalSizeFormatted: string;
  oldestBackup?: Date;
  newestBackup?: Date;
}> = async (_args, context) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const backupService = getBackupService();
  const stats = await backupService.getBackupStats();

  return {
    ...stats,
    totalSizeFormatted: formatBytes(stats.totalSize),
  };
};

/**
 * Trigger manual backup
 */
export const triggerManualBackup: GetBackupList<void, {
  success: boolean;
  filePath?: string;
  error?: string;
}> = async (_args, context) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const backupService = getBackupService();
  const result = await backupService.createBackup();

    // Log operation
    console.log('[BackupOperation] Manual backup triggered:', {
      success: result.success,
      filePath: result.filePath,
      userId: context.user.id,
    });  return result;
};

// ==================== Recovery Operations ====================

/**
 * Test disaster recovery
 */
export const testDisasterRecovery: TestDisasterRecovery<
  { backupPath?: string },
  {
    success: boolean;
    backupFile: string;
    testDuration: number;
    recordsRestored?: number;
    errors?: string[];
  }
> = async (args, context) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const recoveryService = getRecoveryService();
  const result = await recoveryService.testRecovery(args.backupPath);

  // Log test results
  console.log('[RecoveryOperation] Recovery test completed:', {
    success: result.success,
    backupFile: result.backupFile,
    userId: context.user.id,
  });

  return result;
};

/**
 * List recovery points
 */
export const getRecoveryPoints: GetBackupList<void, Array<{
  name: string;
  path: string;
  size: number;
  sizeFormatted: string;
  timestamp: Date;
}>> = async (_args, context) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const recoveryService = getRecoveryService();
  const recoveryPoints = await recoveryService.listRecoveryPoints();

  return recoveryPoints.map(point => ({
    ...point,
    sizeFormatted: formatBytes(point.size),
  }));
};

// ==================== Slow Query Monitoring ====================

/**
 * Get slow query statistics
 */
export const getSlowQueryStats: GetSlowQueryStats<void, {
  totalQueries: number;
  slowQueries: number;
  avgQueryDuration: number;
  topSlowQueries: Array<{
    query: string;
    avgDuration: number;
    maxDuration: number;
    count: number;
  }>;
}> = async (_args, context) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const monitor = getSlowQueryMonitor();
  return monitor.getReport();
};

/**
 * Reset slow query statistics
 */
export const resetSlowQueryStats: GetBackupList<void, { success: boolean }> = async (_args, context) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const monitor = getSlowQueryMonitor();
  monitor.resetStats();

  return { success: true };
};

// ==================== Connection Pool Load Testing ====================

/**
 * Run connection pool load test
 */
export const runConnectionPoolLoadTest: RunConnectionPoolLoadTest<
  {
    duration?: number;
    concurrency?: number;
    queryType?: 'read' | 'write' | 'mixed';
  },
  {
    success: boolean;
    duration: number;
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    avgResponseTime: number;
    queriesPerSecond: number;
    errors: Array<{ message: string; count: number }>;
  }
> = async (args, context) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const loadTester = getLoadTester();
  
  const config = {
    duration: args.duration || 10, // 10 seconds default
    concurrency: args.concurrency || 10,
    queryType: args.queryType || 'mixed' as const,
    rampUp: true,
  };

  const result = await loadTester.runLoadTest(config);

  // Log test results
  console.log('[LoadTestOperation] Load test completed:', {
    totalQueries: result.totalQueries,
    successfulQueries: result.successfulQueries,
    userId: context.user.id,
  });

  return {
    success: result.success,
    duration: result.duration,
    totalQueries: result.totalQueries,
    successfulQueries: result.successfulQueries,
    failedQueries: result.failedQueries,
    avgResponseTime: result.avgResponseTime,
    queriesPerSecond: result.queriesPerSecond,
    errors: result.errors,
  };
};

/**
 * Test connection pool limits
 */
export const testConnectionLimits: GetBackupList<void, {
  maxConnections: number;
  failurePoint?: number;
  errors?: string[];
}> = async (_args, context) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const loadTester = getLoadTester();
  const result = await loadTester.testConnectionLimits();

  // Log results
  console.log('[ConnectionLimitTest] Connection limit test completed:', {
    maxConnections: result.maxConnections,
    userId: context.user.id,
  });

  return result;
};

// ==================== Helper Functions ====================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
