import type { LogLevelType } from './levels';
import { prisma } from 'wasp/server';
import { createLogger } from './logger';

// Configuração de retenção de logs (em dias)
export const LOG_RETENTION_DAYS: Record<LogLevelType, number> = {
  DEBUG: 7,      // 7 dias
  INFO: 30,      // 30 dias
  WARN: 90,      // 90 dias
  ERROR: 180,    // 180 dias
  CRITICAL: 365, // 1 ano
};

/**
 * Limpa logs antigos baseado nas políticas de retenção
 */
async function performLogCleanup() {
  const logger = createLogger('log-retention');

  try {
    let totalDeleted = 0;

    for (const [level, days] of Object.entries(LOG_RETENTION_DAYS)) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await prisma.systemLog.deleteMany({
        where: {
          level: level as LogLevelType,
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      totalDeleted += result.count;
      
      if (result.count > 0) {
        await logger.info(
          `Deleted ${result.count} ${level} logs older than ${days} days`,
          { level, days, deletedCount: result.count }
        );
      }
    }

    await logger.info(`Log retention cleanup completed`, { totalDeleted });
    return { success: true, totalDeleted };
  } catch (error: any) {
    await logger.error('Failed to clean old logs', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Legacy export for backwards compatibility
 */
export const cleanOldLogs = performLogCleanup;

/**
 * Job wrapper for cleaning up old logs
 * Called by PgBoss scheduler
 */
export const cleanupOldLogs = async (_args: any, context: any) => {
  try {
    console.log('🧹 Starting scheduled cleanup of old logs...');
    const result = await performLogCleanup();
    
    if (result.success) {
      console.log(`✅ Successfully cleaned up ${result.totalDeleted} old log entries`);
    } else {
      console.error(`❌ Log cleanup failed: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Failed to run log cleanup job:', error);
    throw error;
  }
};
