/**
 * MITRE Module - Rate Limit Service
 * 
 * Prevents abuse of MITRE operations using Redis
 */

import { HttpError } from 'wasp/server';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Default rate limits per operation
export const RATE_LIMITS = {
  // Reference data queries - more permissive
  references: { windowMs: 60000, maxRequests: 100 } as RateLimitConfig, // 100 per minute
  // TTP mutations - stricter
  mutations: { windowMs: 60000, maxRequests: 50 } as RateLimitConfig, // 50 per minute
  // Search - medium
  search: { windowMs: 60000, maxRequests: 30 } as RateLimitConfig, // 30 per minute
};

export class TTPRateLimitService {
  private static redis: any;

  static setRedis(redisClient: any) {
    this.redis = redisClient;
  }

  /**
   * Check if user is within rate limit
   */
  static async checkLimit(
    userId: string,
    operationName: string,
    config: RateLimitConfig
  ): Promise<boolean> {
    if (!this.redis) {
      console.warn('[RateLimit] Redis not configured, skipping rate limit check');
      return true;
    }

    try {
      const key = `ratelimit:mitre:${userId}:${operationName}`;
      const current = await this.redis.incr(key);

      if (current === 1) {
        // First request in window
        await this.redis.expire(key, Math.ceil(config.windowMs / 1000));
      }

      return current <= config.maxRequests;
    } catch (error) {
      console.error('[RateLimit] Error checking rate limit:', error);
      // On error, allow the request (fail open)
      return true;
    }
  }

  /**
   * Enforce rate limit and throw error if exceeded
   */
  static async enforceLimit(
    userId: string,
    operationName: string,
    config: RateLimitConfig
  ): Promise<void> {
    const isAllowed = await this.checkLimit(userId, operationName, config);

    if (!isAllowed) {
      throw new HttpError(
        429,
        `Rate limit exceeded for ${operationName}. Max ${config.maxRequests} requests per ${Math.round(config.windowMs / 1000)}s`
      );
    }
  }

  /**
   * Get remaining requests for user
   */
  static async getRemaining(
    userId: string,
    operationName: string,
    config: RateLimitConfig
  ): Promise<number> {
    if (!this.redis) return config.maxRequests;

    try {
      const key = `ratelimit:mitre:${userId}:${operationName}`;
      const current = await this.redis.get(key);
      return Math.max(0, config.maxRequests - (current ? parseInt(current) : 0));
    } catch (error) {
      console.error('[RateLimit] Error getting remaining:', error);
      return config.maxRequests;
    }
  }

  /**
   * Reset rate limit for user (admin only)
   */
  static async reset(userId: string, operationName?: string): Promise<void> {
    if (!this.redis) return;

    try {
      const pattern = operationName
        ? `ratelimit:mitre:${userId}:${operationName}`
        : `ratelimit:mitre:${userId}:*`;

      if (pattern.includes('*')) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        await this.redis.del(pattern);
      }
    } catch (error) {
      console.error('[RateLimit] Error resetting rate limit:', error);
    }
  }
}
