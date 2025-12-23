'use server';

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from './apiKeys';
import { checkRateLimit } from '@/lib/rateLimit';

/**
 * Validate API key from request headers.
 * Returns { ok, res, key } where:
 * - ok=false -> respond with res
 * - ok=true  -> key contains key metadata
 */
export async function validateApiKeyRequest(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return {
      ok: false,
      res: NextResponse.json({ error: 'Missing API key' }, { status: 401 }),
    };
  }

  const keyData = await validateApiKey(apiKey);
  if (!keyData) {
    return {
      ok: false,
      res: NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 }),
    };
  }

  // Rate limit per key
  const limit = keyData.rateLimit || (keyData.plan === 'enterprise' ? 100 : 10);
  const rate = checkRateLimit(`api-key:${keyData.id}`, { windowMs: 60_000, maxRequests: limit });
  if (rate.limited) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: Math.ceil(rate.resetIn / 1000) },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rate.resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + rate.resetIn),
          },
        }
      ),
    };
  }

  return { ok: true, key: keyData };
}

