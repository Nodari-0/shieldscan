/**
 * Email Breach Check API Endpoint
 * Checks if email addresses have been compromised in known data breaches
 * Uses Have I Been Pwned API
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  validateEmail, 
  fullEmailBreachCheck, 
  checkDomainEmails,
  hashEmailForLogging 
} from '@/lib/emailBreachChecker';
import type { EmailCheckResponse } from '@/types/scan';

// Rate limiting: Track requests per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

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

export async function POST(request: NextRequest): Promise<NextResponse<EmailCheckResponse>> {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please wait a minute before trying again.' 
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, domain, checkDomainEmails: shouldCheckDomain } = body;

    // Get HIBP API key from environment
    const apiKey = process.env.HIBP_API_KEY;
    
    if (!apiKey) {
      // If no API key, return mock data for development
      console.warn('HIBP_API_KEY not configured - using mock data');
      return NextResponse.json({
        success: true,
        data: {
          email: email || `info@${domain}`,
          breached: false,
          breachCount: 0,
          riskLevel: 'none',
          breaches: [],
          recommendations: [
            'Email breach checking requires HIBP API key configuration.',
            'Contact your administrator to enable this feature.',
            'In the meantime, consider using https://haveibeenpwned.com directly.'
          ],
          passwordSuggestions: [
            {
              type: 'best_practice',
              title: 'Use Strong Passwords',
              description: 'Use at least 12 characters with a mix of uppercase, lowercase, numbers, and symbols.',
              priority: 1,
            },
            {
              type: 'best_practice',
              title: 'Enable Two-Factor Authentication',
              description: 'Add an extra layer of security to your accounts with 2FA/MFA.',
              priority: 2,
            },
            {
              type: 'recommended',
              title: 'Use a Password Manager',
              description: 'Store and generate strong, unique passwords securely.',
              priority: 3,
            },
          ],
          lastChecked: new Date().toISOString(),
        },
      });
    }

    // Validate inputs
    if (!email && !domain) {
      return NextResponse.json(
        { success: false, error: 'Email or domain is required' },
        { status: 400 }
      );
    }

    // Single email check
    if (email && !shouldCheckDomain) {
      const validation = validateEmail(email);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.reason },
          { status: 400 }
        );
      }

      console.log(`[Email Check] Checking: ${hashEmailForLogging(email)}`);

      try {
        const result = await fullEmailBreachCheck(email, apiKey);

        console.log(`[Email Check] Result for ${hashEmailForLogging(email)}: ${result.breached ? 'BREACHED' : 'CLEAN'} (${result.breachCount} breaches, risk: ${result.riskLevel})`);

        return NextResponse.json({
          success: true,
          data: {
            email: result.email,
            breached: result.breached,
            breachCount: result.breachCount,
            riskLevel: result.riskLevel,
            breaches: result.breaches,
            recommendations: result.recommendations,
            passwordSuggestions: result.passwordSuggestions,
            lastChecked: new Date().toISOString(),
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Email Check] Error for ${hashEmailForLogging(email)}:`, errorMessage);

        // Handle specific HIBP errors
        if (errorMessage.includes('Rate limit')) {
          return NextResponse.json(
            { success: false, error: 'Service rate limit reached. Please try again in a few seconds.' },
            { status: 429 }
          );
        }

        if (errorMessage.includes('Invalid HIBP API key')) {
          return NextResponse.json(
            { success: false, error: 'Email breach checking service is temporarily unavailable.' },
            { status: 503 }
          );
        }

        return NextResponse.json(
          { success: false, error: 'Failed to check email breach status. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Domain email check
    if (domain || shouldCheckDomain) {
      const domainToCheck = domain || email?.split('@')[1];
      
      if (!domainToCheck) {
        return NextResponse.json(
          { success: false, error: 'Valid domain is required' },
          { status: 400 }
        );
      }

      console.log(`[Domain Check] Checking domain: ${domainToCheck}`);

      try {
        const results = await checkDomainEmails(domainToCheck, apiKey);

        console.log(`[Domain Check] Completed for ${domainToCheck}: ${results.emailsBreached}/${results.emailsChecked} breached`);

        return NextResponse.json({
          success: true,
          domainCheck: results,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Domain Check] Error for ${domainToCheck}:`, errorMessage);

        return NextResponse.json(
          { success: false, error: 'Failed to check domain emails. Please try again.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[Email Check] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET endpoint for simple single-email check (limited use)
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { success: false, error: 'Email parameter is required' },
      { status: 400 }
    );
  }

  // Forward to POST handler
  const response = await POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: request.headers,
    })
  );

  return response;
}

