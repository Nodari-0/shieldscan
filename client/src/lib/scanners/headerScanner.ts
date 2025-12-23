/**
 * Security Headers Scanner Module
 * 
 * Analyzes HTTP security headers and provides recommendations
 */

import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import type { 
  HeadersScanResult, 
  SecurityHeadersAnalysis, 
  HeaderAnalysis,
  SecurityGrade,
  CheckStatus
} from './types';

// Security headers and their configurations
const SECURITY_HEADERS = {
  'content-security-policy': {
    name: 'Content-Security-Policy',
    weight: 25,
    critical: true,
    recommendation: "Add Content-Security-Policy header to prevent XSS attacks. Start with: default-src 'self'; script-src 'self'",
  },
  'strict-transport-security': {
    name: 'Strict-Transport-Security',
    weight: 20,
    critical: true,
    recommendation: 'Add HSTS header: Strict-Transport-Security: max-age=31536000; includeSubDomains',
  },
  'x-frame-options': {
    name: 'X-Frame-Options',
    weight: 15,
    critical: false,
    recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN to prevent clickjacking',
  },
  'x-content-type-options': {
    name: 'X-Content-Type-Options',
    weight: 10,
    critical: false,
    recommendation: 'Add X-Content-Type-Options: nosniff to prevent MIME type sniffing',
  },
  'referrer-policy': {
    name: 'Referrer-Policy',
    weight: 10,
    critical: false,
    recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin',
  },
  'permissions-policy': {
    name: 'Permissions-Policy',
    weight: 10,
    critical: false,
    recommendation: 'Add Permissions-Policy to control browser features',
  },
  'x-xss-protection': {
    name: 'X-XSS-Protection',
    weight: 5,
    critical: false,
    recommendation: 'Add X-XSS-Protection: 1; mode=block (note: deprecated in modern browsers)',
  },
  'cross-origin-opener-policy': {
    name: 'Cross-Origin-Opener-Policy',
    weight: 5,
    critical: false,
    recommendation: 'Add Cross-Origin-Opener-Policy: same-origin for additional isolation',
  },
  'cross-origin-resource-policy': {
    name: 'Cross-Origin-Resource-Policy',
    weight: 5,
    critical: false,
    recommendation: 'Add Cross-Origin-Resource-Policy: same-origin',
  },
  'cross-origin-embedder-policy': {
    name: 'Cross-Origin-Embedder-Policy',
    weight: 5,
    critical: false,
    recommendation: 'Add Cross-Origin-Embedder-Policy: require-corp for additional isolation',
  },
};

/**
 * Scan security headers of a website
 */
export async function scanHeaders(
  url: string,
  timeout: number = 15000
): Promise<HeadersScanResult> {
  const result: HeadersScanResult = {
    raw: {},
    security: createEmptySecurityAnalysis(),
    score: 0,
    grade: 'F',
    recommendations: [],
  };

  try {
    const headers = await fetchHeaders(url, timeout);
    result.raw = headers;

    // Analyze each security header
    result.security = analyzeHeaders(headers);

    // Calculate score and grade
    const { score, recommendations } = calculateHeaderScore(result.security);
    result.score = score;
    result.grade = scoreToGrade(score);
    result.recommendations = recommendations;

  } catch (error: any) {
    result.recommendations.push(`Error fetching headers: ${error.message}`);
  }

  return result;
}

// Browser-like headers to avoid WAF blocks
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Upgrade-Insecure-Requests': '1',
};

/**
 * Fetch headers from a URL with retry logic
 */
async function fetchHeaders(
  urlString: string,
  timeout: number,
  retries: number = 3
): Promise<Record<string, string>> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const headers = await fetchHeadersOnce(urlString, timeout + (attempt * 5000));
      return headers;
    } catch (err) {
      lastError = err as Error;
      // Wait before retry with exponential backoff
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch headers');
}

/**
 * Single attempt to fetch headers
 */
async function fetchHeadersOnce(
  urlString: string,
  timeout: number
): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlString);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search || '/',
      method: 'GET', // Use GET instead of HEAD for better compatibility
      timeout: timeout,
      headers: BROWSER_HEADERS,
    };

    // Add rejectUnauthorized for https
    if (parsedUrl.protocol === 'https:') {
      (options as https.RequestOptions).rejectUnauthorized = false;
    }

    const req = protocol.request(options, (res) => {
      const headers: Record<string, string> = {};
      
      // Handle redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http') 
          ? res.headers.location 
          : `${parsedUrl.protocol}//${parsedUrl.host}${res.headers.location}`;
        res.destroy();
        fetchHeadersOnce(redirectUrl, timeout - 5000).then(resolve).catch(reject);
        return;
      }
      
      for (const [key, value] of Object.entries(res.headers)) {
        if (value) {
          headers[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value;
        }
      }

      // Consume and discard body
      res.on('data', () => {});
      res.on('end', () => resolve(headers));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Create empty security analysis object
 */
function createEmptySecurityAnalysis(): SecurityHeadersAnalysis {
  return {
    contentSecurityPolicy: createEmptyHeaderAnalysis(),
    strictTransportSecurity: createEmptyHeaderAnalysis(),
    xFrameOptions: createEmptyHeaderAnalysis(),
    xContentTypeOptions: createEmptyHeaderAnalysis(),
    referrerPolicy: createEmptyHeaderAnalysis(),
    permissionsPolicy: createEmptyHeaderAnalysis(),
    xXssProtection: createEmptyHeaderAnalysis(),
    crossOriginOpenerPolicy: createEmptyHeaderAnalysis(),
    crossOriginResourcePolicy: createEmptyHeaderAnalysis(),
    crossOriginEmbedderPolicy: createEmptyHeaderAnalysis(),
  };
}

/**
 * Create empty header analysis
 */
function createEmptyHeaderAnalysis(): HeaderAnalysis {
  return {
    present: false,
    value: null,
    status: 'failed',
    score: 0,
  };
}

/**
 * Analyze all security headers
 */
function analyzeHeaders(headers: Record<string, string>): SecurityHeadersAnalysis {
  return {
    contentSecurityPolicy: analyzeCSP(headers['content-security-policy']),
    strictTransportSecurity: analyzeHSTS(headers['strict-transport-security']),
    xFrameOptions: analyzeXFrameOptions(headers['x-frame-options']),
    xContentTypeOptions: analyzeXContentTypeOptions(headers['x-content-type-options']),
    referrerPolicy: analyzeReferrerPolicy(headers['referrer-policy']),
    permissionsPolicy: analyzePermissionsPolicy(headers['permissions-policy'] || headers['feature-policy']),
    xXssProtection: analyzeXXssProtection(headers['x-xss-protection']),
    crossOriginOpenerPolicy: analyzeCOOP(headers['cross-origin-opener-policy']),
    crossOriginResourcePolicy: analyzeCORP(headers['cross-origin-resource-policy']),
    crossOriginEmbedderPolicy: analyzeCOEP(headers['cross-origin-embedder-policy']),
  };
}

/**
 * Analyze Content-Security-Policy
 */
function analyzeCSP(value: string | undefined): HeaderAnalysis {
  if (!value) {
    return {
      present: false,
      value: null,
      status: 'failed',
      score: 0,
      recommendation: SECURITY_HEADERS['content-security-policy'].recommendation,
    };
  }

  let score = 25;
  let status: CheckStatus = 'passed';
  const details: string[] = [];

  // Check for unsafe directives
  if (value.includes("'unsafe-inline'")) {
    score -= 10;
    status = 'warning';
    details.push("Uses 'unsafe-inline' which weakens CSP");
  }

  if (value.includes("'unsafe-eval'")) {
    score -= 10;
    status = 'warning';
    details.push("Uses 'unsafe-eval' which allows code execution");
  }

  // Check for good directives
  if (value.includes('default-src')) {
    score += 5;
  }

  if (value.includes('upgrade-insecure-requests')) {
    score += 2;
  }

  if (value.includes('frame-ancestors')) {
    score += 3;
  }

  return {
    present: true,
    value,
    status,
    score: Math.min(25, Math.max(0, score)),
    details: details.length > 0 ? details.join('; ') : undefined,
  };
}

/**
 * Analyze Strict-Transport-Security
 */
function analyzeHSTS(value: string | undefined): HeaderAnalysis {
  if (!value) {
    return {
      present: false,
      value: null,
      status: 'failed',
      score: 0,
      recommendation: SECURITY_HEADERS['strict-transport-security'].recommendation,
    };
  }

  let score = 15;
  let status: CheckStatus = 'passed';
  const details: string[] = [];

  // Check max-age
  const maxAgeMatch = value.match(/max-age=(\d+)/i);
  if (maxAgeMatch) {
    const maxAge = parseInt(maxAgeMatch[1], 10);
    if (maxAge >= 31536000) {
      score += 5; // 1 year or more
    } else if (maxAge >= 15768000) {
      score += 3; // 6 months
    } else if (maxAge < 86400) {
      score -= 5; // Less than 1 day
      status = 'warning';
      details.push('max-age is too short (less than 1 day)');
    }
  }

  // Check for includeSubDomains
  if (value.toLowerCase().includes('includesubdomains')) {
    score += 3;
  } else {
    details.push('Consider adding includeSubDomains');
  }

  // Check for preload
  if (value.toLowerCase().includes('preload')) {
    score += 2;
  }

  return {
    present: true,
    value,
    status,
    score: Math.min(20, Math.max(0, score)),
    details: details.length > 0 ? details.join('; ') : undefined,
  };
}

/**
 * Analyze X-Frame-Options
 */
function analyzeXFrameOptions(value: string | undefined): HeaderAnalysis {
  if (!value) {
    return {
      present: false,
      value: null,
      status: 'failed',
      score: 0,
      recommendation: SECURITY_HEADERS['x-frame-options'].recommendation,
    };
  }

  const upperValue = value.toUpperCase();
  let score = 15;
  let status: CheckStatus = 'passed';

  if (upperValue === 'DENY') {
    // Best option
  } else if (upperValue === 'SAMEORIGIN') {
    // Good option
  } else if (upperValue.startsWith('ALLOW-FROM')) {
    score -= 5;
    status = 'warning';
  } else {
    score -= 10;
    status = 'warning';
  }

  return {
    present: true,
    value,
    status,
    score: Math.max(0, score),
  };
}

/**
 * Analyze X-Content-Type-Options
 */
function analyzeXContentTypeOptions(value: string | undefined): HeaderAnalysis {
  if (!value) {
    return {
      present: false,
      value: null,
      status: 'failed',
      score: 0,
      recommendation: SECURITY_HEADERS['x-content-type-options'].recommendation,
    };
  }

  return {
    present: true,
    value,
    status: value.toLowerCase() === 'nosniff' ? 'passed' : 'warning',
    score: value.toLowerCase() === 'nosniff' ? 10 : 5,
  };
}

/**
 * Analyze Referrer-Policy
 */
function analyzeReferrerPolicy(value: string | undefined): HeaderAnalysis {
  if (!value) {
    return {
      present: false,
      value: null,
      status: 'failed',
      score: 0,
      recommendation: SECURITY_HEADERS['referrer-policy'].recommendation,
    };
  }

  const goodPolicies = [
    'no-referrer',
    'no-referrer-when-downgrade',
    'strict-origin',
    'strict-origin-when-cross-origin',
  ];

  const status: CheckStatus = goodPolicies.includes(value.toLowerCase()) ? 'passed' : 'warning';

  return {
    present: true,
    value,
    status,
    score: status === 'passed' ? 10 : 5,
  };
}

/**
 * Analyze Permissions-Policy
 */
function analyzePermissionsPolicy(value: string | undefined): HeaderAnalysis {
  if (!value) {
    return {
      present: false,
      value: null,
      status: 'failed',
      score: 0,
      recommendation: SECURITY_HEADERS['permissions-policy'].recommendation,
    };
  }

  return {
    present: true,
    value,
    status: 'passed',
    score: 10,
  };
}

/**
 * Analyze X-XSS-Protection
 */
function analyzeXXssProtection(value: string | undefined): HeaderAnalysis {
  if (!value) {
    return {
      present: false,
      value: null,
      status: 'info', // Not critical as CSP is preferred
      score: 0,
      recommendation: SECURITY_HEADERS['x-xss-protection'].recommendation,
    };
  }

  return {
    present: true,
    value,
    status: value.includes('1') ? 'passed' : 'warning',
    score: value.includes('mode=block') ? 5 : 3,
  };
}

/**
 * Analyze Cross-Origin-Opener-Policy
 */
function analyzeCOOP(value: string | undefined): HeaderAnalysis {
  if (!value) {
    return {
      present: false,
      value: null,
      status: 'info',
      score: 0,
      recommendation: SECURITY_HEADERS['cross-origin-opener-policy'].recommendation,
    };
  }

  return {
    present: true,
    value,
    status: 'passed',
    score: 5,
  };
}

/**
 * Analyze Cross-Origin-Resource-Policy
 */
function analyzeCORP(value: string | undefined): HeaderAnalysis {
  if (!value) {
    return {
      present: false,
      value: null,
      status: 'info',
      score: 0,
      recommendation: SECURITY_HEADERS['cross-origin-resource-policy'].recommendation,
    };
  }

  return {
    present: true,
    value,
    status: 'passed',
    score: 5,
  };
}

/**
 * Analyze Cross-Origin-Embedder-Policy
 */
function analyzeCOEP(value: string | undefined): HeaderAnalysis {
  if (!value) {
    return {
      present: false,
      value: null,
      status: 'info',
      score: 0,
      recommendation: SECURITY_HEADERS['cross-origin-embedder-policy'].recommendation,
    };
  }

  return {
    present: true,
    value,
    status: 'passed',
    score: 5,
  };
}

/**
 * Calculate total score and generate recommendations
 */
function calculateHeaderScore(
  analysis: SecurityHeadersAnalysis
): { score: number; recommendations: string[] } {
  let score = 0;
  const recommendations: string[] = [];

  // Sum up individual scores
  for (const [key, value] of Object.entries(analysis)) {
    const headerAnalysis = value as HeaderAnalysis;
    score += headerAnalysis.score;

    if (!headerAnalysis.present && headerAnalysis.recommendation) {
      recommendations.push(headerAnalysis.recommendation);
    }
  }

  // Normalize to 0-100
  score = Math.min(100, Math.round((score / 110) * 100));

  return { score, recommendations };
}

/**
 * Convert score to grade
 */
function scoreToGrade(score: number): SecurityGrade {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export default scanHeaders;

