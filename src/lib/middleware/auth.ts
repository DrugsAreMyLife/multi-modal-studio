// Auth middleware for API routes
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { verifyCsrfToken } from '@/lib/middleware/csrf';

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
  // CSRF check for state-changing methods
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
    const isCsrfValid = await verifyCsrfToken(req);
    if (!isCsrfValid) {
      return {
        authenticated: false,
        response: NextResponse.json(
          {
            error: 'Forbidden',
            message: 'CSRF token validation failed.',
          },
          { status: 403 },
        ),
      };
    }
  }

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
import { Ratelimit } from '@upstash/ratelimit';

// Singleton Map for rate limiters (instantiated once per endpoint+config)
const limiters = new Map<string, Ratelimit>();

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
  // Fail closed in production if Redis is not configured
  if (!ratelimit) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[RateLimit] Redis not configured in production - failing closed');
      return {
        allowed: false,
        response: NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 }),
      };
    }
    // Allow in development for easier testing
    console.warn('[RateLimit] Redis not configured - allowing in development');
    return { allowed: true };
  }

  const identifier = `${userId}:${endpoint}`;

  const getLimiter = (endpoint: string, config: RateLimitConfig) => {
    const key = `${endpoint}:${config.maxRequests}:${config.windowMs}`;
    if (!limiters.has(key)) {
      limiters.set(
        key,
        new Ratelimit({
          redis: ratelimit as any, // Use the imported ratelimit instance
          limiter: Ratelimit.slidingWindow(
            config.maxRequests,
            `${Math.floor(config.windowMs / 1000)} s`,
          ),
          analytics: true,
          prefix: `@upstash/ratelimit:${endpoint}`,
        }),
      );
    }
    return limiters.get(key)!;
  };

  const limiter = getLimiter(endpoint, config);

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
