/**
 * API Access Protection Middleware
 * Only business and enterprise plans can access API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/firebase/firestore';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { PLAN_CONFIG, planAllowsFeature } from '@/config/pricing';

const API_RATE_LIMITS = {
  business: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  enterprise: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
};

export async function middleware(request: NextRequest) {
  // Extract user ID from headers (set by auth middleware)
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');

  if (!userId || !userEmail) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    // Get user profile to check plan
    const userProfile = await getUserProfile(userId);

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if plan allows API access
    if (!planAllowsFeature(userProfile.plan, 'api')) {
      return NextResponse.json(
        {
          error: 'API access requires Business or Enterprise plan',
          upgradeRequired: true,
          currentPlan: userProfile.plan,
        },
        { status: 403 }
      );
    }

    // Apply rate limiting based on plan
    const rateLimitConfig = userProfile.plan === 'enterprise'
      ? API_RATE_LIMITS.enterprise
      : API_RATE_LIMITS.business;

    const clientIP = getClientIP(request);
    const rateLimitKey = `api:${userProfile.plan}:${userId}:${clientIP}`;
    const rateLimit = checkRateLimit(rateLimitKey, rateLimitConfig);

    if (rateLimit.limited) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before making more requests.',
          retryAfter: Math.ceil(rateLimit.resetIn / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + rateLimit.resetIn),
          },
        }
      );
    }

    // Add user info to headers for downstream handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-plan', userProfile.plan);
    requestHeaders.set('x-rate-limit-remaining', String(rateLimit.remaining));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('API access middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: '/api/:path*', // Apply to all API routes (adjust as needed)
};

