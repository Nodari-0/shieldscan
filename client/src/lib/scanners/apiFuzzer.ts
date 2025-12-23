import { ParsedAPIEndpoint } from './openapiParser';

export type FuzzFinding = {
  name: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  detail: string;
};

/**
 * Minimal, conservative fuzzing for demonstration.
 * Sends one additional request with a basic payload and returns findings based on response text.
 */
export async function runBasicFuzz(endpoint: ParsedAPIEndpoint): Promise<{
  findings: FuzzFinding[];
  evidence?: { request: any; responsePreview?: string };
}> {
  const findings: FuzzFinding[] = [];

  try {
    const urlObj = new URL(endpoint.url);
    urlObj.searchParams.set('fuzz', '<script>alert(1)</script>');

    const headers = { ...(endpoint.headers || {}) };
    if (endpoint.authType && endpoint.authValue) {
      applyAuth(headers, endpoint.authType, endpoint.authValue);
    }

    const res = await fetch(urlObj.toString(), {
      method: endpoint.method,
      headers,
      body: endpoint.method === 'GET' ? undefined : endpoint.body,
    });

    const text = await safeRead(res);
    if (/syntax error|sql/i.test(text)) {
      findings.push({
        name: 'SQL error response',
        severity: 'high',
        detail: 'Response contained SQL error text after fuzz payload.',
      });
    }
    if (text.includes('<script>alert(1)</script>')) {
      findings.push({
        name: 'Reflected input',
        severity: 'medium',
        detail: 'Fuzz payload was reflected in the response.',
      });
    }

    return {
      findings,
      evidence: {
        request: { url: urlObj.toString(), method: endpoint.method, headers, body: endpoint.body },
        responsePreview: text.slice(0, 400),
      },
    };
  } catch (err) {
    findings.push({
      name: 'Fuzzing failed',
      severity: 'info',
      detail: `Fuzz request error: ${err instanceof Error ? err.message : String(err)}`,
    });
    return { findings };
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

