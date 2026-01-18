import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * Initialize Redis client
 * Falls back to null if no KV/Redis credentials are provided
 */
const getRedisClient = () => {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
};

export const redis = getRedisClient();

/**
 * Rate Limiter Configuration
 * Uses Sliding Window Algorithm for smooth limiting
 */
export const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'), // Default: 10 reqs per 60s (overridden per route)
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  : null;
