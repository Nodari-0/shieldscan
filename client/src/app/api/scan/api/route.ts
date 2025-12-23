import { NextRequest, NextResponse } from 'next/server';
import { runBasicFuzz } from '@/lib/scanners/apiFuzzer';
import { ParsedAPIEndpoint } from '@/lib/scanners/openapiParser';

type APISecurityCheck = {
  id: string;
  name: string;
  category: string;
  status: 'passed' | 'failed' | 'warning' | 'info';
  description: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
};

type APIScanResult = {
  id: string;
  endpoint: string;
  method: string;
  timestamp: string;
  score: number;
  responseTime: number;
  statusCode: number;
  checks: APISecurityCheck[];
  headers: Record<string, string>;
  vulnerabilities: {
    name: string;
    severity: string;
    description: string;
    recommendation: string;
  }[];
};

export async function POST(req: NextRequest) {
  try {
    const { endpoints } = await req.json();
    if (!Array.isArray(endpoints) || endpoints.length === 0) {
      return NextResponse.json({ success: false, error: 'No endpoints provided' }, { status: 400 });
    }

    const results: APIScanResult[] = [];

    for (const ep of endpoints as ParsedAPIEndpoint[]) {
      const start = Date.now();
      const headers: Record<string, string> = { ...(ep.headers || {}) };
      if (ep.authType && ep.authValue) {
        applyAuth(headers, ep.authType, ep.authValue);
      }

      let statusCode = 0;
      let checks: APISecurityCheck[] = [];
      let vulnerabilities: APIScanResult['vulnerabilities'] = [];
      let responseText = '';

      try {
        const res = await fetch(ep.url, {
          method: ep.method,
          headers,
          body: ep.method === 'GET' ? undefined : ep.body,
        });
        statusCode = res.status;
        responseText = await safeRead(res);

        // Basic checks
        checks.push({
          id: 'reachable',
          name: 'Endpoint Reachable',
          category: 'Availability',
          status: statusCode > 0 ? 'passed' : 'failed',
          description: statusCode > 0 ? 'Endpoint responded' : 'No response',
        });

        // Auth signal
        if (statusCode === 401 || statusCode === 403) {
          checks.push({
            id: 'auth-required',
            name: 'Auth Required',
            category: 'Authentication',
            status: 'info',
            description: 'Endpoint requires authentication',
          });
        }

        // BOLA/BFLA heuristic: sensitive paths without auth
        if (!ep.authValue && /\/(user|users|account|accounts|profile|profiles|admin)\//i.test(ep.url)) {
          checks.push({
            id: 'bola-heuristic',
            name: 'BOLA/BFLA Heuristic',
            category: 'Access Control',
            status: 'warning',
            description: 'Sensitive-looking path without auth; verify object/function level access controls.',
            severity: 'high',
          });
          vulnerabilities.push({
            name: 'Potential BOLA/BFLA',
            severity: 'high',
            description: 'Sensitive path accessed without authentication. Verify authorization checks.',
            recommendation: 'Enforce object/function level authorization and test with authenticated contexts.',
          });
        }

        // Mass assignment heuristic: write methods without validation evidence
        if (['POST', 'PUT', 'PATCH'].includes(ep.method)) {
          checks.push({
            id: 'mass-assignment',
            name: 'Mass Assignment Heuristic',
            category: 'Input Validation',
            status: 'warning',
            description: 'Write operation without detected schema validation; risk of mass assignment.',
            severity: 'medium',
          });
          vulnerabilities.push({
            name: 'Potential Mass Assignment',
            severity: 'medium',
            description: 'No explicit validation detected on write endpoint.',
            recommendation: 'Whitelist allowed fields and validate request bodies server-side.',
          });
        }

        // Rate limit header presence
        const rateLimit = res.headers.get('x-ratelimit-limit');
        if (!rateLimit) {
          checks.push({
            id: 'rate-limit',
            name: 'Rate Limiting',
            category: 'Abuse Protection',
            status: 'warning',
            description: 'No rate-limit headers detected',
            severity: 'medium',
          });
        } else {
          checks.push({
            id: 'rate-limit',
            name: 'Rate Limiting',
            category: 'Abuse Protection',
            status: 'passed',
            description: `Rate limit header present (${rateLimit})`,
          });
        }

        // Run minimal fuzzing
        const fuzz = await runBasicFuzz(ep);
        fuzz.findings.forEach((f, i) => {
          checks.push({
            id: `fuzz-${i}`,
            name: f.name,
            category: 'Fuzzing',
            status: f.severity === 'info' ? 'info' : 'warning',
            description: f.detail,
            severity: f.severity === 'info' ? 'info' : 'medium',
          });
          if (f.severity !== 'info') {
            vulnerabilities.push({
              name: f.name,
              severity: f.severity,
              description: f.detail,
              recommendation: 'Review input validation and error handling',
            });
          }
        });
      } catch (err) {
        checks.push({
          id: 'network-error',
          name: 'Network Error',
          category: 'Availability',
          status: 'failed',
          description: err instanceof Error ? err.message : 'Request failed',
          severity: 'medium',
        });
      }

      const responseTime = Date.now() - start;
      const penalty = checks.filter(c => c.status === 'warning' || c.status === 'failed').length * 10;
      const score = Math.max(0, Math.min(100, 100 - penalty));

      results.push({
        id: `api-scan-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        endpoint: ep.url,
        method: ep.method,
        timestamp: new Date().toISOString(),
        score,
        responseTime,
        statusCode,
        checks,
        headers,
        vulnerabilities,
      });
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('API scan error:', error);
    return NextResponse.json({ success: false, error: 'API scan failed' }, { status: 500 });
  }
}

async function safeRead(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
  } catch {
    return '';
  }
}

function applyAuth(headers: Record<string, string>, authType: string, authValue: string) {
  if (authType === 'bearer') headers['Authorization'] = `Bearer ${authValue}`;
  if (authType === 'api-key') headers['x-api-key'] = authValue;
  if (authType === 'basic') headers['Authorization'] = `Basic ${authValue}`;
}
import { NextRequest, NextResponse } from 'next/server';

interface APISecurityCheck {
  id: string;
  name: string;
  category: string;
  status: 'passed' | 'failed' | 'warning' | 'info';
  description: string;
  details?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

interface Vulnerability {
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

// Security headers to check
const SECURITY_HEADERS = [
  { name: 'X-Content-Type-Options', expected: 'nosniff', severity: 'medium' as const },
  { name: 'X-Frame-Options', expected: ['DENY', 'SAMEORIGIN'], severity: 'medium' as const },
  { name: 'X-XSS-Protection', expected: '1; mode=block', severity: 'low' as const },
  { name: 'Strict-Transport-Security', severity: 'high' as const },
  { name: 'Content-Security-Policy', severity: 'medium' as const },
  { name: 'X-Permitted-Cross-Domain-Policies', severity: 'low' as const },
  { name: 'Referrer-Policy', severity: 'low' as const },
  { name: 'Cache-Control', severity: 'low' as const },
];

// Sensitive data patterns
const SENSITIVE_PATTERNS = [
  { pattern: /password/i, name: 'Password field' },
  { pattern: /secret/i, name: 'Secret field' },
  { pattern: /api[_-]?key/i, name: 'API key' },
  { pattern: /token/i, name: 'Token field' },
  { pattern: /private[_-]?key/i, name: 'Private key' },
  { pattern: /credit[_-]?card/i, name: 'Credit card' },
  { pattern: /ssn|social[_-]?security/i, name: 'SSN' },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, method = 'GET', headers: customHeaders = {}, body: requestBody } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const checks: APISecurityCheck[] = [];
    const vulnerabilities: Vulnerability[] = [];
    let score = 100;
    let responseHeaders: Record<string, string> = {};
    let statusCode = 0;
    let responseBody = '';

    // Make the actual API request
    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'User-Agent': 'ShieldScan API Security Scanner/1.0',
          'Accept': 'application/json',
          ...customHeaders,
        },
      };

      if (requestBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
        fetchOptions.body = requestBody;
        if (!customHeaders['Content-Type']) {
          (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
        }
      }

      const response = await fetch(url, fetchOptions);
      statusCode = response.status;
      
      // Get response headers
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Try to get response body
      try {
        responseBody = await response.text();
      } catch {
        responseBody = '';
      }

      // ========================
      // AUTHENTICATION CHECKS
      // ========================
      
      // Check if endpoint requires auth
      if (statusCode === 401) {
        checks.push({
          id: 'auth-required',
          name: 'Authentication Required',
          category: 'authentication',
          status: 'passed',
          description: 'API properly requires authentication',
          severity: 'info',
        });
      } else if (statusCode === 403) {
        checks.push({
          id: 'auth-forbidden',
          name: 'Authorization Check',
          category: 'authentication',
          status: 'passed',
          description: 'API properly enforces authorization',
          severity: 'info',
        });
      } else if (statusCode === 200 && !customHeaders['Authorization'] && !customHeaders['X-API-Key']) {
        // Endpoint accessible without auth - potential issue
        checks.push({
          id: 'auth-bypass',
          name: 'No Authentication Required',
          category: 'authentication',
          status: 'warning',
          description: 'Endpoint accessible without authentication',
          details: 'Consider if this endpoint should require authentication',
          severity: 'medium',
        });
        score -= 10;
      }

      // Check for auth header in response
      const wwwAuth = responseHeaders['www-authenticate'];
      if (wwwAuth) {
        checks.push({
          id: 'www-auth',
          name: 'WWW-Authenticate Header',
          category: 'authentication',
          status: 'passed',
          description: 'Server indicates authentication method',
          details: wwwAuth,
          severity: 'info',
        });
      }

      // ========================
      // SECURITY HEADERS CHECKS
      // ========================

      for (const header of SECURITY_HEADERS) {
        const value = responseHeaders[header.name.toLowerCase()];
        
        if (value) {
          let passed = true;
          if (header.expected) {
            if (Array.isArray(header.expected)) {
              passed = header.expected.some(exp => value.includes(exp));
            } else {
              passed = value.includes(header.expected);
            }
          }

          checks.push({
            id: `header-${header.name.toLowerCase()}`,
            name: header.name,
            category: 'security-headers',
            status: passed ? 'passed' : 'warning',
            description: passed 
              ? `${header.name} header is properly configured`
              : `${header.name} header has unexpected value`,
            details: value,
            severity: passed ? 'info' : header.severity,
          });

          if (!passed) {
            score -= header.severity === 'high' ? 10 : header.severity === 'medium' ? 5 : 2;
          }
        } else {
          checks.push({
            id: `header-${header.name.toLowerCase()}`,
            name: header.name,
            category: 'security-headers',
            status: header.severity === 'high' ? 'failed' : 'warning',
            description: `Missing ${header.name} header`,
            severity: header.severity,
          });

          score -= header.severity === 'high' ? 15 : header.severity === 'medium' ? 8 : 3;

          if (header.severity === 'high') {
            vulnerabilities.push({
              name: `Missing ${header.name}`,
              severity: 'medium',
              description: `The ${header.name} security header is not present in the response`,
              recommendation: `Add the ${header.name} header to your API responses`,
            });
          }
        }
      }

      // ========================
      // CORS CHECKS
      // ========================

      const corsOrigin = responseHeaders['access-control-allow-origin'];
      const corsMethods = responseHeaders['access-control-allow-methods'];
      const corsCredentials = responseHeaders['access-control-allow-credentials'];

      if (corsOrigin === '*') {
        checks.push({
          id: 'cors-wildcard',
          name: 'CORS Wildcard Origin',
          category: 'cors',
          status: 'warning',
          description: 'API allows requests from any origin',
          details: 'Access-Control-Allow-Origin: *',
          severity: 'medium',
        });
        score -= 10;

        if (corsCredentials === 'true') {
          checks.push({
            id: 'cors-credentials-wildcard',
            name: 'CORS Credentials with Wildcard',
            category: 'cors',
            status: 'failed',
            description: 'Dangerous: Credentials allowed with wildcard origin',
            severity: 'high',
          });
          score -= 20;

          vulnerabilities.push({
            name: 'CORS Misconfiguration',
            severity: 'high',
            description: 'API allows credentials with wildcard origin, potentially exposing user data',
            recommendation: 'Specify explicit allowed origins instead of using wildcard',
          });
        }
      } else if (corsOrigin) {
        checks.push({
          id: 'cors-configured',
          name: 'CORS Configuration',
          category: 'cors',
          status: 'passed',
          description: 'CORS is configured with specific origin',
          details: corsOrigin,
          severity: 'info',
        });
      }

      // ========================
      // RATE LIMITING CHECKS
      // ========================

      const rateLimitHeaders = [
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'x-rate-limit-limit',
        'ratelimit-limit',
        'retry-after',
      ];

      const hasRateLimit = rateLimitHeaders.some(h => responseHeaders[h]);
      
      checks.push({
        id: 'rate-limiting',
        name: 'Rate Limiting',
        category: 'rate-limiting',
        status: hasRateLimit ? 'passed' : 'warning',
        description: hasRateLimit 
          ? 'API implements rate limiting'
          : 'No rate limiting headers detected',
        details: hasRateLimit 
          ? rateLimitHeaders.filter(h => responseHeaders[h]).map(h => `${h}: ${responseHeaders[h]}`).join(', ')
          : undefined,
        severity: hasRateLimit ? 'info' : 'medium',
      });

      if (!hasRateLimit) {
        score -= 8;
      }

      // ========================
      // DATA EXPOSURE CHECKS
      // ========================

      // Check for sensitive data in response
      if (responseBody) {
        for (const pattern of SENSITIVE_PATTERNS) {
          if (pattern.pattern.test(responseBody)) {
            checks.push({
              id: `sensitive-${pattern.name.toLowerCase().replace(/\s/g, '-')}`,
              name: `${pattern.name} Exposure`,
              category: 'data-exposure',
              status: 'warning',
              description: `Response may contain sensitive ${pattern.name.toLowerCase()} data`,
              severity: 'medium',
            });
            score -= 5;
          }
        }

        // Check for verbose error messages
        if (responseBody.includes('stack trace') || 
            responseBody.includes('Exception') || 
            responseBody.includes('at line') ||
            /Error:.*at\s+/.test(responseBody)) {
          checks.push({
            id: 'verbose-errors',
            name: 'Verbose Error Messages',
            category: 'data-exposure',
            status: 'failed',
            description: 'API exposes detailed error information',
            severity: 'high',
          });
          score -= 15;

          vulnerabilities.push({
            name: 'Information Disclosure',
            severity: 'medium',
            description: 'API response contains verbose error messages that may reveal implementation details',
            recommendation: 'Return generic error messages to clients and log detailed errors server-side',
          });
        }

        // Check for internal IPs or paths
        if (/(\d{1,3}\.){3}\d{1,3}/.test(responseBody) || 
            /\/(?:home|var|usr|etc|opt)\//.test(responseBody)) {
          checks.push({
            id: 'internal-info',
            name: 'Internal Information Exposure',
            category: 'data-exposure',
            status: 'warning',
            description: 'Response may contain internal paths or IPs',
            severity: 'medium',
          });
          score -= 8;
        }
      }

      // ========================
      // INPUT VALIDATION (Basic)
      // ========================

      // Check Content-Type handling
      const contentType = responseHeaders['content-type'];
      if (contentType && contentType.includes('application/json')) {
        checks.push({
          id: 'json-response',
          name: 'JSON Content-Type',
          category: 'input-validation',
          status: 'passed',
          description: 'API properly sets Content-Type for JSON responses',
          severity: 'info',
        });
      }

      // ========================
      // TLS/SSL CHECKS
      // ========================

      if (targetUrl.protocol === 'https:') {
        checks.push({
          id: 'https',
          name: 'HTTPS Enabled',
          category: 'transport',
          status: 'passed',
          description: 'API uses HTTPS encryption',
          severity: 'info',
        });
      } else {
        checks.push({
          id: 'https',
          name: 'No HTTPS',
          category: 'transport',
          status: 'failed',
          description: 'API does not use HTTPS encryption',
          severity: 'critical',
        });
        score -= 25;

        vulnerabilities.push({
          name: 'Insecure Transport',
          severity: 'critical',
          description: 'API is accessible over unencrypted HTTP connection',
          recommendation: 'Configure HTTPS with a valid SSL/TLS certificate',
        });
      }

      // ========================
      // SERVER INFO DISCLOSURE
      // ========================

      const serverHeader = responseHeaders['server'];
      const poweredBy = responseHeaders['x-powered-by'];

      if (serverHeader && /\d+\.\d+/.test(serverHeader)) {
        checks.push({
          id: 'server-version',
          name: 'Server Version Disclosure',
          category: 'information-disclosure',
          status: 'warning',
          description: 'Server header reveals version information',
          details: serverHeader,
          severity: 'low',
        });
        score -= 3;
      }

      if (poweredBy) {
        checks.push({
          id: 'x-powered-by',
          name: 'X-Powered-By Header',
          category: 'information-disclosure',
          status: 'warning',
          description: 'API reveals technology stack',
          details: poweredBy,
          severity: 'low',
        });
        score -= 3;
      }

      // Add default passed checks if categories are empty
      if (!checks.some(c => c.category === 'data-exposure')) {
        checks.push({
          id: 'data-exposure-check',
          name: 'No Sensitive Data Found',
          category: 'data-exposure',
          status: 'passed',
          description: 'No obvious sensitive data patterns detected in response',
          severity: 'info',
        });
      }

    } catch (fetchError: any) {
      // Connection/network errors
      checks.push({
        id: 'connectivity',
        name: 'API Connectivity',
        category: 'connectivity',
        status: 'failed',
        description: 'Failed to connect to API endpoint',
        details: fetchError.message,
        severity: 'critical',
      });
      score = 0;
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    return NextResponse.json({
      endpoint: url,
      method,
      statusCode,
      score,
      checks,
      vulnerabilities,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error('API scan error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

