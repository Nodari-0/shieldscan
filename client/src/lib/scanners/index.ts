/**
 * Security Scanner Orchestrator
 * 
 * Coordinates all security scanning modules and aggregates results
 */

import { URL } from 'url';
import scanSSL from './sslScanner';
import scanHeaders from './headerScanner';
import scanDNS from './dnsScanner';
import scanVulnerabilities from './vulnerabilityScanner';
import type {
  CompleteScanResult,
  SecurityCheck,
  ScanSummary,
  Recommendation,
  SecurityGrade,
  ScannerConfig,
  ProgressCallback,
  Severity,
  CheckStatus,
} from './types';

// Default scanner configuration
const DEFAULT_CONFIG: ScannerConfig = {
  timeout: 15000,
  userAgent: 'ShieldScan Security Scanner/1.0',
  followRedirects: true,
  maxRedirects: 5,
  checkPorts: false,
  deepScan: false,
  plan: 'free',
};

/**
 * Run a complete security scan
 */
export async function runSecurityScan(
  targetUrl: string,
  config: Partial<ScannerConfig> = {},
  onProgress?: ProgressCallback
): Promise<CompleteScanResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();
  
  // Parse and validate URL
  let parsedUrl: URL;
  try {
    // Ensure URL has protocol
    let urlToCheck = targetUrl.trim();
    if (!urlToCheck.startsWith('http://') && !urlToCheck.startsWith('https://')) {
      urlToCheck = `https://${urlToCheck}`;
    }
    parsedUrl = new URL(urlToCheck);
  } catch (error) {
    throw new Error('Invalid URL provided');
  }

  const hostname = parsedUrl.hostname;
  const fullUrl = parsedUrl.toString();
  const isHttps = parsedUrl.protocol === 'https:';

  // Initialize result
  const result: CompleteScanResult = {
    url: fullUrl,
    timestamp: new Date().toISOString(),
    scanDuration: 0,
    score: 0,
    grade: 'F',
    ssl: null,
    headers: null,
    dns: null,
    vulnerabilities: [],
    technologies: [],
    performance: null,
    robots: null,
    checks: [],
    summary: {
      passed: 0,
      warnings: 0,
      failed: 0,
      total: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
    },
    recommendations: [],
  };

  try {
    // Stage 1: SSL/TLS Scan (if HTTPS)
    onProgress?.('ssl', 0, 'Analyzing SSL/TLS configuration...');
    if (isHttps) {
      try {
        result.ssl = await scanSSL(hostname, 443, finalConfig.timeout);
        addSSLChecks(result.checks, result.ssl);
      } catch (error: any) {
        result.checks.push({
          id: 'ssl-error',
          name: 'SSL/TLS Analysis',
          category: 'SSL/TLS',
          status: 'error',
          message: 'SSL scan failed',
          details: error.message,
          severity: 'high',
        });
      }
    } else {
      result.checks.push({
        id: 'no-https',
        name: 'HTTPS Not Used',
        category: 'SSL/TLS',
        status: 'failed',
        message: 'Website is not using HTTPS',
        severity: 'critical',
        recommendation: 'Enable HTTPS with a valid SSL certificate',
      });
    }
    onProgress?.('ssl', 100, 'SSL/TLS analysis complete');

    // Stage 2: Security Headers
    onProgress?.('headers', 0, 'Checking security headers...');
    try {
      result.headers = await scanHeaders(fullUrl, finalConfig.timeout);
      addHeaderChecks(result.checks, result.headers);
    } catch (error: any) {
      result.checks.push({
        id: 'headers-error',
        name: 'Security Headers',
        category: 'Headers',
        status: 'error',
        message: 'Header scan failed',
        details: error.message,
        severity: 'medium',
      });
    }
    onProgress?.('headers', 100, 'Security headers check complete');

    // Stage 3: DNS Security
    onProgress?.('dns', 0, 'Analyzing DNS configuration...');
    try {
      result.dns = await scanDNS(hostname, finalConfig.timeout);
      addDNSChecks(result.checks, result.dns);
    } catch (error: any) {
      result.checks.push({
        id: 'dns-error',
        name: 'DNS Analysis',
        category: 'DNS',
        status: 'error',
        message: 'DNS scan failed',
        details: error.message,
        severity: 'medium',
      });
    }
    onProgress?.('dns', 100, 'DNS analysis complete');

    // Stage 4: Vulnerability Scan
    onProgress?.('vulnerabilities', 0, 'Scanning for vulnerabilities...');
    try {
      result.vulnerabilities = await scanVulnerabilities(fullUrl, finalConfig.timeout);
      addVulnerabilityChecks(result.checks, result.vulnerabilities);
    } catch (error: any) {
      result.checks.push({
        id: 'vuln-error',
        name: 'Vulnerability Scan',
        category: 'Vulnerabilities',
        status: 'error',
        message: 'Vulnerability scan failed',
        details: error.message,
        severity: 'medium',
      });
    }
    onProgress?.('vulnerabilities', 100, 'Vulnerability scan complete');

    // Calculate summary
    result.summary = calculateSummary(result.checks);

    // Calculate final score and grade
    const { score, grade } = calculateFinalScore(result);
    result.score = score;
    result.grade = grade;

    // Generate recommendations
    result.recommendations = generateRecommendations(result);

    // Calculate scan duration
    result.scanDuration = Date.now() - startTime;

    onProgress?.('complete', 100, 'Scan complete');

  } catch (error: any) {
    // Handle critical errors
    result.checks.push({
      id: 'scan-error',
      name: 'Scan Error',
      category: 'System',
      status: 'error',
      message: 'Scan failed to complete',
      details: error.message,
      severity: 'critical',
    });
    result.scanDuration = Date.now() - startTime;
  }

  return result;
}

/**
 * Add SSL-related checks to the results
 */
function addSSLChecks(checks: SecurityCheck[], ssl: any): void {
  if (!ssl) return;

  // Certificate validity
  checks.push({
    id: 'ssl-valid',
    name: 'SSL Certificate Valid',
    category: 'SSL/TLS',
    status: ssl.valid ? 'passed' : 'failed',
    message: ssl.valid ? 'Certificate is valid and trusted' : 'Certificate validation failed',
    severity: ssl.valid ? 'info' : 'critical',
    recommendation: !ssl.valid ? 'Install a valid SSL certificate from a trusted CA' : undefined,
  });

  // Self-signed check
  if (ssl.selfSigned) {
    checks.push({
      id: 'ssl-self-signed',
      name: 'Self-Signed Certificate',
      category: 'SSL/TLS',
      status: 'failed',
      message: 'Certificate is self-signed',
      severity: 'high',
      recommendation: 'Use a certificate from a trusted Certificate Authority',
    });
  }

  // Expiration check
  const daysExpiry = ssl.daysUntilExpiry;
  let expiryStatus: CheckStatus = 'passed';
  let expirySeverity: Severity = 'info';
  
  if (daysExpiry < 0) {
    expiryStatus = 'failed';
    expirySeverity = 'critical';
  } else if (daysExpiry < 7) {
    expiryStatus = 'failed';
    expirySeverity = 'high';
  } else if (daysExpiry < 30) {
    expiryStatus = 'warning';
    expirySeverity = 'medium';
  }

  checks.push({
    id: 'ssl-expiry',
    name: 'Certificate Expiration',
    category: 'SSL/TLS',
    status: expiryStatus,
    message: daysExpiry < 0 
      ? 'Certificate has expired!' 
      : `Certificate expires in ${daysExpiry} days`,
    severity: expirySeverity,
    recommendation: daysExpiry < 30 ? 'Renew SSL certificate soon' : undefined,
  });

  // TLS version checks
  const tls13 = ssl.tlsVersions?.find((v: any) => v.version === 'TLSv1.3');
  const tls12 = ssl.tlsVersions?.find((v: any) => v.version === 'TLSv1.2');
  const tls10 = ssl.tlsVersions?.find((v: any) => v.version === 'TLSv1.0');

  if (tls13?.supported) {
    checks.push({
      id: 'tls-13',
      name: 'TLS 1.3 Support',
      category: 'SSL/TLS',
      status: 'passed',
      message: 'TLS 1.3 is supported',
      severity: 'info',
    });
  }

  if (!tls12?.supported && !tls13?.supported) {
    checks.push({
      id: 'tls-outdated',
      name: 'Modern TLS Support',
      category: 'SSL/TLS',
      status: 'failed',
      message: 'Neither TLS 1.2 nor TLS 1.3 is supported',
      severity: 'critical',
      recommendation: 'Enable TLS 1.2 or TLS 1.3',
    });
  }

  if (tls10?.supported) {
    checks.push({
      id: 'tls-10',
      name: 'TLS 1.0 Enabled',
      category: 'SSL/TLS',
      status: 'warning',
      message: 'TLS 1.0 is still enabled (deprecated)',
      severity: 'medium',
      recommendation: 'Disable TLS 1.0',
    });
  }

  // Overall SSL grade
  checks.push({
    id: 'ssl-grade',
    name: 'SSL Configuration Grade',
    category: 'SSL/TLS',
    status: ssl.grade === 'A+' || ssl.grade === 'A' ? 'passed' : 
            ssl.grade === 'B' ? 'warning' : 'failed',
    message: `SSL configuration grade: ${ssl.grade}`,
    severity: ssl.grade === 'F' ? 'critical' : ssl.grade === 'D' ? 'high' : 'info',
  });
}

/**
 * Add header-related checks to the results
 */
function addHeaderChecks(checks: SecurityCheck[], headers: any): void {
  if (!headers) return;

  const sec = headers.security;

  // Content-Security-Policy
  checks.push({
    id: 'header-csp',
    name: 'Content-Security-Policy',
    category: 'Headers',
    status: sec.contentSecurityPolicy.present ? 
            (sec.contentSecurityPolicy.status === 'passed' ? 'passed' : 'warning') : 'failed',
    message: sec.contentSecurityPolicy.present 
      ? 'Content-Security-Policy header is set'
      : 'Content-Security-Policy header is missing',
    severity: sec.contentSecurityPolicy.present ? 'info' : 'high',
    recommendation: sec.contentSecurityPolicy.recommendation,
  });

  // HSTS
  checks.push({
    id: 'header-hsts',
    name: 'Strict-Transport-Security (HSTS)',
    category: 'Headers',
    status: sec.strictTransportSecurity.present ? 'passed' : 'failed',
    message: sec.strictTransportSecurity.present 
      ? 'HSTS header is configured'
      : 'HSTS header is missing',
    severity: sec.strictTransportSecurity.present ? 'info' : 'high',
    recommendation: sec.strictTransportSecurity.recommendation,
  });

  // X-Frame-Options
  checks.push({
    id: 'header-xfo',
    name: 'X-Frame-Options',
    category: 'Headers',
    status: sec.xFrameOptions.present ? 'passed' : 'warning',
    message: sec.xFrameOptions.present 
      ? 'X-Frame-Options header is set'
      : 'X-Frame-Options header is missing',
    severity: sec.xFrameOptions.present ? 'info' : 'medium',
    recommendation: sec.xFrameOptions.recommendation,
  });

  // X-Content-Type-Options
  checks.push({
    id: 'header-xcto',
    name: 'X-Content-Type-Options',
    category: 'Headers',
    status: sec.xContentTypeOptions.present ? 'passed' : 'warning',
    message: sec.xContentTypeOptions.present 
      ? 'X-Content-Type-Options header is set'
      : 'X-Content-Type-Options header is missing',
    severity: sec.xContentTypeOptions.present ? 'info' : 'medium',
    recommendation: sec.xContentTypeOptions.recommendation,
  });

  // Headers grade
  checks.push({
    id: 'headers-grade',
    name: 'Security Headers Grade',
    category: 'Headers',
    status: headers.grade === 'A+' || headers.grade === 'A' ? 'passed' : 
            headers.grade === 'B' ? 'warning' : 'failed',
    message: `Security headers grade: ${headers.grade} (Score: ${headers.score}/100)`,
    severity: headers.grade === 'F' ? 'critical' : headers.grade === 'D' ? 'high' : 'info',
  });
}

/**
 * Add DNS-related checks to the results
 */
function addDNSChecks(checks: SecurityCheck[], dns: any): void {
  if (!dns) return;

  // DNS Resolution
  checks.push({
    id: 'dns-resolved',
    name: 'DNS Resolution',
    category: 'DNS',
    status: dns.resolved ? 'passed' : 'failed',
    message: dns.resolved 
      ? `Domain resolved to ${dns.ipAddresses.length} IP(s)`
      : 'Domain failed to resolve',
    severity: dns.resolved ? 'info' : 'critical',
  });

  // SPF Record
  const spf = dns.emailSecurity?.spf;
  if (spf) {
    checks.push({
      id: 'dns-spf',
      name: 'SPF Record',
      category: 'DNS',
      status: spf.present && spf.valid ? 'passed' : spf.present ? 'warning' : 'failed',
      message: spf.present 
        ? `SPF record found (Policy: ${spf.policy || 'unknown'})`
        : 'No SPF record found',
      severity: spf.present ? 'info' : 'medium',
      recommendation: !spf.present 
        ? 'Add an SPF record to prevent email spoofing'
        : spf.issues?.[0],
      proOnly: true,
    });
  }

  // DMARC Record
  const dmarc = dns.emailSecurity?.dmarc;
  if (dmarc) {
    checks.push({
      id: 'dns-dmarc',
      name: 'DMARC Record',
      category: 'DNS',
      status: dmarc.present && dmarc.policy !== 'none' ? 'passed' : 
              dmarc.present ? 'warning' : 'failed',
      message: dmarc.present 
        ? `DMARC record found (Policy: ${dmarc.policy})`
        : 'No DMARC record found',
      severity: dmarc.present ? 'info' : 'medium',
      recommendation: !dmarc.present 
        ? 'Add a DMARC record for email authentication'
        : dmarc.issues?.[0],
      proOnly: true,
    });
  }

  // CDN Detection
  if (dns.hasCDN) {
    checks.push({
      id: 'dns-cdn',
      name: 'CDN Detection',
      category: 'DNS',
      status: 'info',
      message: `CDN detected: ${dns.cdnProvider || 'Unknown provider'}`,
      severity: 'info',
    });
  }
}

/**
 * Add vulnerability-related checks to the results
 */
function addVulnerabilityChecks(checks: SecurityCheck[], vulnerabilities: any[]): void {
  if (!vulnerabilities || vulnerabilities.length === 0) {
    checks.push({
      id: 'vuln-none',
      name: 'Vulnerability Scan',
      category: 'Vulnerabilities',
      status: 'passed',
      message: 'No common vulnerabilities detected',
      severity: 'info',
    });
    return;
  }

  for (const vuln of vulnerabilities) {
    checks.push({
      id: `vuln-${vuln.type.toLowerCase().replace(/\s+/g, '-')}`,
      name: vuln.type,
      category: vuln.category,
      status: 'failed',
      message: vuln.details,
      details: vuln.evidence,
      severity: vuln.severity,
      recommendation: vuln.recommendation,
    });
  }
}

/**
 * Calculate summary from checks
 */
function calculateSummary(checks: SecurityCheck[]): ScanSummary {
  const summary: ScanSummary = {
    passed: 0,
    warnings: 0,
    failed: 0,
    total: checks.length,
    criticalIssues: 0,
    highIssues: 0,
    mediumIssues: 0,
    lowIssues: 0,
  };

  for (const check of checks) {
    switch (check.status) {
      case 'passed':
        summary.passed++;
        break;
      case 'warning':
        summary.warnings++;
        break;
      case 'failed':
      case 'error':
        summary.failed++;
        break;
    }

    if (check.status === 'failed' || check.status === 'error') {
      switch (check.severity) {
        case 'critical':
          summary.criticalIssues++;
          break;
        case 'high':
          summary.highIssues++;
          break;
        case 'medium':
          summary.mediumIssues++;
          break;
        case 'low':
          summary.lowIssues++;
          break;
      }
    }
  }

  return summary;
}

/**
 * Calculate final security score and grade
 */
function calculateFinalScore(result: CompleteScanResult): { score: number; grade: SecurityGrade } {
  let score = 100;
  const { summary } = result;

  // Deduct points based on severity
  score -= summary.criticalIssues * 20;
  score -= summary.highIssues * 10;
  score -= summary.mediumIssues * 5;
  score -= summary.lowIssues * 2;

  // Bonus for SSL grade
  if (result.ssl?.grade === 'A+') score += 5;
  else if (result.ssl?.grade === 'A') score += 3;

  // Bonus for headers grade
  if (result.headers?.grade === 'A+') score += 5;
  else if (result.headers?.grade === 'A') score += 3;

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Convert to grade
  let grade: SecurityGrade;
  if (score >= 95) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return { score: Math.round(score), grade };
}

/**
 * Generate recommendations based on scan results
 */
function generateRecommendations(result: CompleteScanResult): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // SSL recommendations
  if (result.ssl) {
    if (!result.ssl.valid) {
      recommendations.push({
        id: 'rec-ssl-cert',
        title: 'Install Valid SSL Certificate',
        description: 'Your SSL certificate is not valid or trusted. Install a certificate from a trusted Certificate Authority.',
        severity: 'critical',
        category: 'SSL/TLS',
        effort: 'low',
        impact: 'high',
        steps: [
          'Obtain an SSL certificate from a trusted CA (e.g., Let\'s Encrypt)',
          'Install the certificate on your web server',
          'Configure proper certificate chain',
        ],
      });
    }

    if (result.ssl.daysUntilExpiry < 30) {
      recommendations.push({
        id: 'rec-ssl-renew',
        title: 'Renew SSL Certificate',
        description: `Your SSL certificate expires in ${result.ssl.daysUntilExpiry} days. Renew it to avoid service disruption.`,
        severity: result.ssl.daysUntilExpiry < 7 ? 'critical' : 'high',
        category: 'SSL/TLS',
        effort: 'low',
        impact: 'high',
      });
    }
  }

  // Header recommendations
  if (result.headers) {
    const sec = result.headers.security;
    
    if (!sec.contentSecurityPolicy.present) {
      recommendations.push({
        id: 'rec-csp',
        title: 'Implement Content Security Policy',
        description: 'Add a Content-Security-Policy header to prevent XSS and injection attacks.',
        severity: 'high',
        category: 'Headers',
        effort: 'medium',
        impact: 'high',
        steps: [
          "Start with a basic policy: default-src 'self'",
          'Add necessary sources for scripts, styles, and images',
          'Test thoroughly before enabling report-only mode',
          'Monitor CSP violation reports',
        ],
      });
    }

    if (!sec.strictTransportSecurity.present) {
      recommendations.push({
        id: 'rec-hsts',
        title: 'Enable HSTS',
        description: 'Add Strict-Transport-Security header to enforce HTTPS connections.',
        severity: 'high',
        category: 'Headers',
        effort: 'low',
        impact: 'high',
        steps: [
          'Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains',
          'Ensure all resources are served over HTTPS',
          'Consider HSTS preload list registration',
        ],
      });
    }
  }

  // DNS recommendations
  if (result.dns) {
    if (!result.dns.emailSecurity?.spf.present) {
      recommendations.push({
        id: 'rec-spf',
        title: 'Add SPF Record',
        description: 'Add an SPF record to prevent email spoofing and improve deliverability.',
        severity: 'medium',
        category: 'DNS',
        effort: 'low',
        impact: 'medium',
      });
    }

    if (!result.dns.emailSecurity?.dmarc.present) {
      recommendations.push({
        id: 'rec-dmarc',
        title: 'Configure DMARC',
        description: 'Add a DMARC record for email authentication and reporting.',
        severity: 'medium',
        category: 'DNS',
        effort: 'medium',
        impact: 'medium',
      });
    }
  }

  // Sort by severity and impact
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  recommendations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return recommendations;
}

// Export types
export * from './types';

// Export individual scanners for direct use
export { scanSSL, scanHeaders, scanDNS, scanVulnerabilities };

