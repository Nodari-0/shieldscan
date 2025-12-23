/**
 * Password Breach Check API Endpoint
 * Proxies requests to Have I Been Pwned's Pwned Passwords API
 * Uses k-anonymity model - only receives first 5 chars of SHA-1 hash
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix');

    // Validate prefix (should be exactly 5 hex characters)
    if (!prefix || !/^[A-Fa-f0-9]{5}$/.test(prefix)) {
      return NextResponse.json(
        { error: 'Invalid prefix. Must be 5 hexadecimal characters.' },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Call HIBP Pwned Passwords API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix.toUpperCase()}`, {
      headers: {
        'User-Agent': 'ShieldScan-Security-Scanner',
        'Add-Padding': 'true',
      },
    });

    if (!response.ok) {
      console.error(`HIBP API error: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to check password breach database' },
        { status: 502 }
      );
    }

    const text = await response.text();

    // Return the raw response - client will parse it
    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });

  } catch (error) {
    console.error('Password check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

