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

      try {
        const res = await fetch(ep.url, {
          method: ep.method,
          headers,
          body: ep.method === 'GET' ? undefined : ep.body,
        });
        statusCode = res.status;
        await safeRead(res);

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
