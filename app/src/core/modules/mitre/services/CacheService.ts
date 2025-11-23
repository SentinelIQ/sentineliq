/**
 * MITRE Module - Cache Service
 * 
 * Caches reference data in Redis to improve performance
 * MITRE data is read-only so cache invalidation is simple (24h TTL)
 */

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
}

export const CACHE_CONFIGS = {
  tactics: { ttl: 86400, key: 'mitre:tactics' } as CacheConfig, // 24 hours
  techniques: { ttl: 86400, key: 'mitre:techniques' } as CacheConfig,
  subtechniques: { ttl: 86400, key: 'mitre:subtechniques' } as CacheConfig,
  stats: { ttl: 3600, key: 'mitre:stats' } as CacheConfig, // 1 hour
};

export class TTPCacheService {
  private static redis: any;

  static setRedis(redisClient: any) {
    this.redis = redisClient;
  }

  /**
   * Get from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const cached = await this.redis.get(key);
      if (!cached) return null;

      return JSON.parse(cached) as T;
    } catch (error) {
      console.error('[Cache] Error getting from cache:', error);
      return null;
    }
  }

  /**
   * Set in cache with TTL
   */
  static async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('[Cache] Error setting cache:', error);
      // Don't throw - cache errors should not block operations
    }
  }

  /**
   * Delete from cache
   */
  static async delete(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('[Cache] Error deleting from cache:', error);
    }
  }

  /**
   * Clear all MITRE cache
   */
  static async clearAll(): Promise<void> {
    if (!this.redis) return;

    try {
      const keys = await this.redis.keys('mitre:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
    }
  }

  /**
   * Get or set pattern (cache-aside pattern)
   */
  static async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached) {
      console.log(`[Cache] Cache HIT for ${key}`);
      return cached;
    }

    // Cache miss - fetch data
    console.log(`[Cache] Cache MISS for ${key}, fetching...`);
    const data = await fetcher();

    // Store in cache
    await this.set(key, data, ttlSeconds);

    return data;
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    keys: number;
    memory: string;
  }> {
    if (!this.redis) {
      return { keys: 0, memory: '0B' };
    }

    try {
      const keys = await this.redis.keys('mitre:*');
      const info = await this.redis.info('memory');

      // Parse memory info
      const memoryUsage = info.split('\r\n').find((line: string) => line.includes('used_memory_human'));
      const memory = memoryUsage?.split(':')[1]?.trim() || '0B';

      return {
        keys: keys.length,
        memory,
      };
    } catch (error) {
      console.error('[Cache] Error getting stats:', error);
      return { keys: 0, memory: '0B' };
    }
  }
}
