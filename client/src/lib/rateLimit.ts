/**
 * Simple in-memory rate limiter
 * For production, use Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 10,  // 10 requests per minute
};

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with limited status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): { limited: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up old entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!entry || now > entry.resetTime) {
    // Create new entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      limited: false,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  // Increment existing entry
  entry.count++;
  
  if (entry.count > config.maxRequests) {
    return {
      limited: true,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  return {
    limited: false,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Scan API - limited to prevent abuse
  scan: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 5,  // 5 scans per minute
  },
  // Auth endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 10,  // 10 attempts per 15 minutes
  },
  // General API
  api: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 60,  // 60 requests per minute
  },
  // Stripe webhooks - higher limit
  webhook: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 100,  // 100 per minute
  },
};

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

