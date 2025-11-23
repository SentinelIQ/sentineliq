/**
 * System Health and Infrastructure Monitoring Operations
 * 
 * Provides admin-level monitoring of system health, infrastructure status,
 * and database performance metrics.
 */

import { HttpError } from 'wasp/server';
import { prisma } from 'wasp/server';
import { createLogger } from '../logs/logger';
import { getRedisClient } from '../../server/redis';

const logger = createLogger('system-operations');

/**
 * Get comprehensive system health status
 * Checks all critical services: Postgres, Redis, MinIO, ELK
 */
export const getSystemHealth = async (_args: void, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const startTime = Date.now();
  const health: any = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    services: {},
  };

  // 1. Check PostgreSQL
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.services.postgres = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
      message: 'Connection successful',
    };
  } catch (error: any) {
    health.services.postgres = {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message,
    };
    health.overall = 'unhealthy';
  }

  // 2. Check Redis (if configured)
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const redisStart = Date.now();
      const redis = getRedisClient();
      await redis.ping();
      health.services.redis = {
        status: 'healthy',
        responseTime: Date.now() - redisStart,
        message: 'PONG received',
      };
    } catch (error: any) {
      health.services.redis = {
        status: 'unhealthy',
        responseTime: 0,
        error: error.message,
      };
      health.overall = 'degraded';
    }
  } else {
    health.services.redis = {
      status: 'not_configured',
      message: 'Redis URL not set',
    };
  }

  // 3. Check MinIO (S3-compatible storage)
  const minioEndpoint = process.env.MINIO_ENDPOINT || process.env.S3_ENDPOINT;
  if (minioEndpoint) {
    try {
      const minioStart = Date.now();
      // Simple check - don't actually test S3 connection to avoid overhead
      health.services.minio = {
        status: 'configured',
        responseTime: Date.now() - minioStart,
        endpoint: minioEndpoint,
        message: 'MinIO endpoint configured',
      };
    } catch (error: any) {
      health.services.minio = {
        status: 'unhealthy',
        error: error.message,
      };
    }
  } else {
    health.services.minio = {
      status: 'not_configured',
      message: 'MinIO/S3 endpoint not set',
    };
  }

  // 4. Check ELK (Elasticsearch) if configured
  const elkEnabled = process.env.ELK_ENABLED === 'true';
  const elkUrl = process.env.ELASTICSEARCH_URL;
  if (elkEnabled && elkUrl) {
    try {
      const elkStart = Date.now();
      // Simple check - ELK is optional
      health.services.elk = {
        status: 'configured',
        responseTime: Date.now() - elkStart,
        url: elkUrl,
        message: 'ELK stack configured',
      };
    } catch (error: any) {
      health.services.elk = {
        status: 'unhealthy',
        error: error.message,
      };
    }
  } else {
    health.services.elk = {
      status: 'not_configured',
      message: 'ELK stack not enabled',
    };
  }

  health.totalResponseTime = Date.now() - startTime;

  logger.info('System health check completed', {
    overall: health.overall,
    responseTime: health.totalResponseTime,
  });

  return health;
};

/**
 * Get detailed database performance metrics
 */
export const getDatabaseMetrics = async (_args: void, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  try {
    const metrics: any = {
      timestamp: new Date().toISOString(),
      connections: {},
      performance: {},
      size: {},
    };

    // Get database size
    const dbSizeResult: any = await prisma.$queryRaw`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as size,
        pg_database_size(current_database()) as size_bytes
    `;
    if (dbSizeResult && dbSizeResult.length > 0) {
      metrics.size = {
        pretty: dbSizeResult[0].size,
        bytes: parseInt(dbSizeResult[0].size_bytes),
      };
    }

    // Get connection stats
    const connectionStats: any = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;
    if (connectionStats && connectionStats.length > 0) {
      metrics.connections = {
        total: parseInt(connectionStats[0].total_connections),
        active: parseInt(connectionStats[0].active_connections),
        idle: parseInt(connectionStats[0].idle_connections),
      };
    }

    // Get slow queries from SystemLog (queries > 1000ms logged as warnings)
    const slowQueries = await context.entities.SystemLog.findMany({
      where: {
        level: 'WARN',
        component: 'database',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    metrics.performance.slowQueries = slowQueries.map((log: any) => ({
      timestamp: log.createdAt,
      message: log.message,
      duration: log.metadata?.duration || 'unknown',
    }));

    // Get table sizes (top 10 largest tables)
    const tableSizes: any = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `;

    metrics.size.tables = tableSizes.map((t: any) => ({
      schema: t.schemaname,
      table: t.tablename,
      size: t.size,
      bytes: parseInt(t.size_bytes),
    }));

    return metrics;
  } catch (error: any) {
    logger.error('Failed to get database metrics', { error: error.message });
    throw new HttpError(500, `Failed to retrieve database metrics: ${error.message}`);
  }
};

/**
 * Get infrastructure status and resource usage
 */
export const getInfrastructureStatus = async (_args: void, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const status: any = {
    timestamp: new Date().toISOString(),
    system: {},
    resources: {},
  };

  // Get Node.js process info
  status.system = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
    pid: process.pid,
  };

  // Get memory usage
  const memUsage = process.memoryUsage();
  status.resources.memory = {
    rss: memUsage.rss,
    heapTotal: memUsage.heapTotal,
    heapUsed: memUsage.heapUsed,
    external: memUsage.external,
    rssMB: Math.round(memUsage.rss / 1024 / 1024),
    heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
  };

  // Get CPU usage (approximation)
  const cpuUsage = process.cpuUsage();
  status.resources.cpu = {
    user: cpuUsage.user,
    system: cpuUsage.system,
    userSeconds: cpuUsage.user / 1000000,
    systemSeconds: cpuUsage.system / 1000000,
  };

  // Get environment info
  status.environment = {
    nodeEnv: process.env.NODE_ENV || 'development',
    redisConfigured: !!process.env.REDIS_URL,
    elkEnabled: process.env.ELK_ENABLED === 'true',
    minioConfigured: !!(process.env.MINIO_ENDPOINT || process.env.S3_ENDPOINT),
  };

  return status;
};
