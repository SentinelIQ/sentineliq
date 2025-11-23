import Redis from 'ioredis';

/**
 * Redis client configuration
 * Used for rate limiting, caching, and session management
 */

let redisClient: Redis | null = null;

/**
 * Get or create Redis client
 */
export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redisPassword = process.env.REDIS_PASSWORD;
  const redisDb = parseInt(process.env.REDIS_DB || '0', 10);

  redisClient = new Redis(redisUrl, {
    password: redisPassword || undefined,
    db: redisDb,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redisClient.on('error', (error) => {
    console.error('❌ Redis connection error:', error);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis ready to accept commands');
  });

  redisClient.on('close', () => {
    console.warn('⚠️ Redis connection closed');
  });

  return redisClient;
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('✅ Redis connection closed gracefully');
  }
}

/**
 * Health check for Redis
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}
