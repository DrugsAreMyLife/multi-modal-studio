import { Redis as UpstashRedis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import IORedis from 'ioredis';

/**
 * Initialize Redis client
 * Handles both local TCP Redis and Upstash REST Redis
 */
const getRedisClient = () => {
  // 1. Check for local Redis first (TCP)
  if (process.env.REDIS_URL) {
    return new IORedis(process.env.REDIS_URL);
  }

  // 2. Fallback to Upstash (REST)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
};

export const redis = getRedisClient();

/**
 * Rate Limiter Configuration
 * Note: @upstash/ratelimit requires the Upstash SDK (REST).
 * For local Redis, we'll need a different approach if strict limiting is needed.
 * For now, we preserve the Upstash limiter logic.
 */
export const ratelimit =
  redis instanceof UpstashRedis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '60 s'),
        analytics: true,
        prefix: '@upstash/ratelimit',
      })
    : null;
