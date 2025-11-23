import { HttpError } from 'wasp/server';
import { getRedisClient } from './redis';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string;
}

/**
 * Check if a request is rate limited using Redis
 * @param key - Unique identifier for the rate limit (e.g., userId + action)
 * @param config - Rate limit configuration
 * @throws HttpError if rate limit exceeded
 */
export async function checkRateLimit(key: string, config: RateLimitConfig): Promise<void> {
  try {
    const redis = getRedisClient();
    const now = Date.now();
    const redisKey = `ratelimit:${key}`;
    
    // Get current count
    const current = await redis.get(redisKey);
    
    if (!current) {
      // First request in this window
      await redis.set(redisKey, '1', 'PX', config.windowMs);
      return;
    }
    
    const count = parseInt(current, 10);
    
    // Check if limit exceeded
    if (count >= config.max) {
      const ttl = await redis.pttl(redisKey);
      const resetInSeconds = Math.ceil(ttl / 1000);
      throw new HttpError(
        429,
        config.message || `Too many requests. Please try again in ${resetInSeconds} seconds.`
      );
    }
    
    // Increment count
    await redis.incr(redisKey);
    
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    // If Redis is down, log error but don't block request (fail open)
    console.error('Rate limit check failed (Redis error):', error);
    console.warn('⚠️ Rate limiting temporarily disabled due to Redis error');
  }
}

// Predefined rate limit configs
export const RATE_LIMITS = {
  CREATE_WORKSPACE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'You can only create 5 workspaces per hour. Please try again later.',
  },
  UPDATE_WORKSPACE: {
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'You can only update workspaces 30 times per minute. Please try again later.',
  },
  INVITE_MEMBER: {
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'You can only send 10 invitations per minute. Please try again later.',
  },
  SEND_INVITATION: {
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'You can only send 10 invitations per minute. Please try again later.',
  },
  ACCEPT_INVITATION: {
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'You can only accept 10 invitations per minute. Please try again later.',
  },
} as const;
