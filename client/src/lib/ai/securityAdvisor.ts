'use server';

/**
 * AI-powered security recommendations (deterministic fallback).
 * If ANTHROPIC_API_KEY or OPENAI_API_KEY is set, you can plug in real LLM calls.
 * For now, we generate concise, rule-based recommendations to avoid external calls.
 */

import type { CompleteScanResult, Recommendation } from '@/lib/scanners/types';

export interface AIRecommendation {
  summary: string;
  recommendations: Recommendation[];
}

export async function generateSecurityAdvice(scan: CompleteScanResult): Promise<AIRecommendation> {
  const recs: Recommendation[] = [];

  // SSL
  if (!scan.ssl || !scan.ssl.valid) {
    recs.push({
      id: 'ssl',
      category: 'SSL/TLS',
      title: 'Fix SSL/TLS configuration',
      severity: 'high',
      description: 'Certificate invalid or missing. Use Let’s Encrypt or a trusted CA, enable HSTS, disable TLS 1.0/1.1.',
      effort: 'medium',
      impact: 'high',
    });
  }

  // Headers
  const missingHeaders: string[] = [];
  if (!scan.headers?.security.contentSecurityPolicy.present) missingHeaders.push('Content-Security-Policy');
  if (!scan.headers?.security.strictTransportSecurity.present) missingHeaders.push('Strict-Transport-Security');
  if (!scan.headers?.security.xFrameOptions.present) missingHeaders.push('X-Frame-Options');
  if (missingHeaders.length) {
    recs.push({
      id: 'headers',
      category: 'Headers',
      title: 'Add security headers',
      severity: 'medium',
      description: `Add: ${missingHeaders.join(', ')}. Use strict defaults to block clickjacking, MIME sniffing, and downgrade attacks.`,
      effort: 'low',
      impact: 'medium',
    });
  }

  // DNS / Email security
  if (!scan.dns?.hasDNSSEC) {
    recs.push({
      id: 'dnssec',
      category: 'DNS',
      title: 'Enable DNSSEC',
      severity: 'medium',
      description: 'Turn on DNSSEC to protect against DNS spoofing and cache poisoning.',
      effort: 'medium',
      impact: 'medium',
    });
  }
  if (!scan.dns?.emailSecurity?.spf?.present || !scan.dns?.emailSecurity?.dmarc?.present) {
    recs.push({
      id: 'email',
      category: 'Email Security',
      title: 'Harden email security (SPF/DMARC/DKIM)',
      severity: 'medium',
      description: 'Publish valid SPF and DMARC records; enable DKIM signing to reduce spoofing risk.',
      effort: 'medium',
      impact: 'high',
    });
  }

  // Vulnerabilities
  const critical = scan.vulnerabilities?.filter(v => v.severity === 'critical' || v.severity === 'high') || [];
  if (critical.length) {
    recs.push({
      id: 'vuln',
      category: 'Vulnerabilities',
      title: 'Resolve critical findings',
      severity: 'critical',
      description: `Critical items: ${critical.map(v => v.type).join(', ')}. Patch immediately, add WAF rules, retest.`,
      effort: 'high',
      impact: 'high',
    });
  }

  // Performance
  if (scan.performance?.responseTime && scan.performance.responseTime > 1200) {
    recs.push({
      id: 'perf',
      category: 'Performance',
      title: 'Improve response time',
      severity: 'low',
      description: 'Cache static assets, enable CDN, and keep TLS session reuse on. Target <800ms TTFB.',
      effort: 'medium',
      impact: 'medium',
    });
  }

  return {
    summary: 'Actionable fixes prioritized for SSL, headers, DNS, email security, and critical vulnerabilities.',
    recommendations: recs,
  };
}

