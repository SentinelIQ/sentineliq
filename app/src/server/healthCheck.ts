import type { HealthCheck } from 'wasp/server/api';
import { prisma } from 'wasp/server';

/**
 * Health check endpoint for monitoring and load balancers
 * Returns service health status and dependencies
 */
export const healthCheck: HealthCheck = async (_req, res) => {
  const startTime = Date.now();
  
  try {
    // Check database connection (simple query)
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;
    
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'sentineliq-api',
      version: '1.0.0',
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      dependencies: {
        database: 'healthy',
      },
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'sentineliq-api',
      version: '1.0.0',
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      error: error.message,
      dependencies: {
        database: 'unhealthy',
      },
    });
  }
};
