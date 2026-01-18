// Auth middleware for API routes
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userEmail?: string;
}

/**
 * Middleware to require authentication for API routes
 * Returns user info if authenticated, or 401 error response
 */
export async function requireAuth(
  req: NextRequest,
): Promise<
  | { authenticated: true; userId: string; userEmail?: string }
  | { authenticated: false; response: NextResponse }
> {
  const session = await getSession();

  if (!session?.user?.id) {
    return {
      authenticated: false,
      response: NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required. Please sign in to use this endpoint.',
        },
        { status: 401 },
      ),
    };
  }

  return {
    authenticated: true,
    userId: session.user.id,
    userEmail: session.user.email || undefined,
  };
}

import { ratelimit } from '@/lib/redis';
import { Ratelimit } from '@upstash/ratelimit'; // Import type for stricter checking if needed, though ratelimit instance is sufficient

// ... (previous imports)

export interface RateLimitConfig {
  maxRequests: number; // Max requests per window
  windowMs: number; // Time window in milliseconds
}

export const RATE_LIMITS = {
  // Expensive generation endpoints
  generation: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
  transcription: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 per minute

  // Cheaper endpoints
  chat: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 per minute
  analysis: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 per minute
};

/**
 * Rate limiting middleware
 * Uses Upstash Redis if available, otherwise allows all (fallback)
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  config: RateLimitConfig,
): Promise<{ allowed: true } | { allowed: false; response: NextResponse }> {
  // Graceful fallback if Redis is not configured
  if (!ratelimit) {
    // In strict production, you might want to log a warning here
    return { allowed: true };
  }

  const identifier = `${userId}:${endpoint}`;

  // Create a specialized limiter for this route config dynamically?
  // The global 'ratelimit' export in @/lib/redis is a fixed sliding window.
  // To support variable windows/limits per route as per 'config', we technically need dynamic limiters.
  // However, for simplicity and performance, we can reuse the client but we must override the limit.
  // @upstash/ratelimit allows creating new instances cheaply.

  // Let's use the global one but properly implementing different limits might require different prefixes or new instances.
  // A clean way with single Redis connection:

  // NOTE: For per-route config, we need to bypass the default single-instance export approach slightly
  // or use the redis client directly to create a specific limiter.
  // Let's import the 'redis' client too if needed, but actually `ratelimit` export was a specific instance.

  // Refined Approach: We will ignore the global 'ratelimit' export parameters and just use the redis client from it
  // if we can, OR just instantiate a new limiter here since it's cheap (it's stateless logic + redis call).

  // Let's use a simpler approach: Override the limit logic or just assume standard limiting for now to match the existing 'ratelimit' export?
  // The User's 'auth.ts' passed `config.maxRequests` and `config.windowMs`.
  // To respect this, we should instantiate a limiter on the fly.

  const { redis } = await import('@/lib/redis'); // Dynamic import to avoid circular dep issues if any, or just standard import

  if (!redis) return { allowed: true };

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.maxRequests, `${Math.floor(config.windowMs / 1000)} s`),
    analytics: true,
    prefix: `@upstash/ratelimit:${endpoint}`, // Separate namespaces per endpoint
  });

  const { success, limit, reset, remaining } = await limiter.limit(identifier);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);

    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          retryAfter,
          limit,
          windowMs: config.windowMs,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        },
      ),
    };
  }

  return { allowed: true };
}

/**
 * Combined auth + rate limit middleware
 * Use this for expensive endpoints
 */
export async function requireAuthAndRateLimit(
  req: NextRequest,
  endpoint: string,
  config: RateLimitConfig,
): Promise<
  | { authenticated: true; userId: string; userEmail?: string }
  | { authenticated: false; response: NextResponse }
> {
  // First, check authentication
  const authResult = await requireAuth(req);
  if (!authResult.authenticated) {
    return authResult;
  }

  // Then, check rate limit
  const rateLimitResult = await checkRateLimit(authResult.userId, endpoint, config);
  if (!rateLimitResult.allowed) {
    return {
      authenticated: false,
      response: rateLimitResult.response,
    };
  }

  return authResult;
}
