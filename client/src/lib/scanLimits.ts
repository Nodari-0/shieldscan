/**
 * Scan Limit Protection & Abuse Prevention
 */

import { canUserScan } from '@/firebase/firestore';
import { checkRateLimit, getClientIP, RATE_LIMITS } from './rateLimit';
import { ADMIN_EMAILS } from '@/config/admin';

/**
 * Check if user is admin
 */
function isAdmin(email: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === email.toLowerCase());
}

interface ScanLimitCheck {
  allowed: boolean;
  error?: string;
  statusCode: number;
  scansRemaining: number;
  resetDate?: Date;
  headers?: Record<string, string>;
}

/**
 * Check if user can perform a scan (comprehensive check)
 */
export async function checkScanPermission(
  userId: string | null,
  userEmail: string | null,
  request: Request | any
): Promise<ScanLimitCheck> {
  // 1. User authentication check
  if (!userId || !userEmail) {
    return {
      allowed: false,
      error: 'Authentication required',
      statusCode: 401,
      scansRemaining: 0,
    };
  }

  // 2. IP-based rate limiting (abuse prevention)
  const clientIP = getClientIP(request);
  const ipRateLimit = checkRateLimit(`scan:ip:${clientIP}`, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3, // Max 3 scans per minute per IP
  });

  if (ipRateLimit.limited) {
    return {
      allowed: false,
      error: 'Too many scans from this IP. Please wait before scanning again.',
      statusCode: 429,
      scansRemaining: 0,
      headers: {
        'Retry-After': String(Math.ceil(ipRateLimit.resetIn / 1000)),
        'X-RateLimit-Remaining': '0',
      },
    };
  }

  // 3. User-based rate limiting (per user cooldown)
  const userRateLimit = checkRateLimit(`scan:user:${userId}`, {
    windowMs: 10 * 1000, // 10 seconds
    maxRequests: 1, // 1 scan per 10 seconds per user
  });

  if (userRateLimit.limited) {
    return {
      allowed: false,
      error: 'Please wait 10 seconds between scans.',
      statusCode: 429,
      scansRemaining: 0,
      headers: {
        'Retry-After': '10',
      },
    };
  }

  // 3.5. Admin users bypass all limits
  if (isAdmin(userEmail)) {
    return {
      allowed: true,
      statusCode: 200,
      scansRemaining: -1, // Unlimited
    };
  }

  // 4. Check monthly scan limit from Firestore
  const scanCheck = await canUserScan(userId);

  if (!scanCheck.allowed) {
    return {
      allowed: false,
      error: scanCheck.reason || 'Scan limit reached',
      statusCode: 403,
      scansRemaining: scanCheck.scansRemaining,
      resetDate: scanCheck.resetDate,
    };
  }

  return {
    allowed: true,
    statusCode: 200,
    scansRemaining: scanCheck.scansRemaining,
    resetDate: scanCheck.resetDate,
  };
}

