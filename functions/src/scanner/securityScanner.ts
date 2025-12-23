/* eslint-disable @typescript-eslint/no-explicit-any */
import * as dns from 'dns';
import * as tls from 'tls';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

// Types for scan results
export interface ScanCheck {
  id: string;
  name: string;
  category: string;
  status: 'passed' | 'warning' | 'failed' | 'info' | 'error';
  message: string;
  details?: string;
  data?: Record<string, unknown>;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export interface ScanResult {
  url: string;
  timestamp: string;
  score: number;
  grade: string;
  checks: ScanCheck[];
  summary: {
    passed: number;
    warnings: number;
    failed: number;
    total: number;
  };
  dns: DNSResult | null;
  ssl: SSLResult | null;
  headers: HeadersResult | null;
  server: ServerInfo | null;
  vulnerabilities: VulnerabilityResult[];
  scanDuration: number;
  scanId?: string;
}

interface DNSResult {
  resolved: boolean;
  ipAddresses: string[];
  ipv6Addresses: string[];
  mxRecords: Array<{ exchange: string; priority: number }>;
  nsRecords: string[];
  txtRecords: string[][];
  cname: string[];
  hasCDN: boolean;
  cdnProvider: string | null;
}

interface SSLResult {
  valid: boolean;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  daysUntilExpiry: number;
  protocol: string;
  cipher: string;
  keySize: number;
  selfSigned: boolean;
  errors: string[];
}

interface HeadersResult {
  raw: Record<string, string>;
  security: SecurityHeaders;
}

interface SecurityHeaders {
  contentSecurityPolicy: HeaderCheck;
  xFrameOptions: HeaderCheck;
  xContentTypeOptions: HeaderCheck;
  referrerPolicy: HeaderCheck;
  strictTransportSecurity: HeaderCheck;
  xXssProtection: HeaderCheck;
  permissionsPolicy: HeaderCheck;
}

interface HeaderCheck {
  present: boolean;
  value: string | null;
  status: 'passed' | 'warning' | 'failed';
  recommendation?: string;
}

interface ServerInfo {
  server: string | null;
  poweredBy: string | null;
  technology: string[];
  serverExposed: boolean;
}

interface VulnerabilityResult {
  type: string;
  found: boolean;
  details: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  evidence?: string;
}

// CDN detection patterns
const CDN_PATTERNS: Record<string, RegExp[]> = {
  'Cloudflare': [/cloudflare/i, /cf-ray/i],
  'AWS CloudFront': [/cloudfront/i, /x-amz-cf/i],
  'Fastly': [/fastly/i, /x-served-by.*cache/i],
  'Akamai': [/akamai/i, /x-akamai/i],
  'Google Cloud CDN': [/google/i, /gws/i],
  'Microsoft Azure CDN': [/azure/i, /x-ms-ref/i],
  'Vercel': [/vercel/i, /x-vercel/i],
  'Netlify': [/netlify/i],
};

// CMS detection patterns
const CMS_PATTERNS: Record<string, RegExp[]> = {
  'WordPress': [/wp-content/i, /wp-includes/i, /wordpress/i],
  'Drupal': [/drupal/i, /sites\/default/i],
  'Joomla': [/joomla/i, /com_content/i],
  'Shopify': [/shopify/i, /cdn\.shopify/i],
  'Wix': [/wix\.com/i, /wixsite/i],
  'Squarespace': [/squarespace/i, /sqsp/i],
  'Next.js': [/_next\//i, /__next/i],
  'React': [/react/i, /__react/i],
  'Vue.js': [/vue/i, /__vue/i],
};

/**
 * Main security scanner function
 */
export async function performSecurityScan(targetUrl: string): Promise<ScanResult> {
  const startTime = Date.now();
  const checks: ScanCheck[] = [];
  let passed = 0;
  let warnings = 0;
  let failed = 0;

  // Normalize URL
  let url: URL;
  try {
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    url = new URL(targetUrl);
  } catch {
    throw new Error('Invalid URL provided');
  }

  const hostname = url.hostname;
  const isHttps = url.protocol === 'https:';

  // 1. DNS Resolution
  const dnsResult = await performDNSChecks(hostname);
  if (dnsResult.resolved) {
    checks.push({
      id: 'dns-resolution',
      name: 'DNS Resolution',
      category: 'DNS',
      status: 'passed',
      message: `Domain resolves to ${dnsResult.ipAddresses.length} IPv4 address(es)`,
      severity: 'info',
      data: { ips: dnsResult.ipAddresses },
    });
    passed++;

    if (dnsResult.hasCDN) {
      checks.push({
        id: 'cdn-detection',
        name: 'CDN Protection',
        category: 'DNS',
        status: 'passed',
        message: `Protected by ${dnsResult.cdnProvider || 'CDN'}`,
        severity: 'info',
      });
      passed++;
    }
  } else {
    checks.push({
      id: 'dns-resolution',
      name: 'DNS Resolution',
      category: 'DNS',
      status: 'failed',
      message: 'Domain could not be resolved',
      severity: 'critical',
    });
    failed++;
  }

  // 2. SSL/TLS Certificate Check
  let sslResult: SSLResult | null = null;
  if (isHttps && dnsResult.resolved) {
    sslResult = await performSSLCheck(hostname);
    
    if (sslResult.valid) {
      checks.push({
        id: 'ssl-valid',
        name: 'SSL Certificate Valid',
        category: 'SSL/TLS',
        status: 'passed',
        message: `Certificate issued by ${sslResult.issuer}`,
        severity: 'info',
        data: { issuer: sslResult.issuer, validTo: sslResult.validTo },
      });
      passed++;

      // Check expiry
      if (sslResult.daysUntilExpiry < 30) {
        checks.push({
          id: 'ssl-expiry',
          name: 'SSL Certificate Expiry',
          category: 'SSL/TLS',
          status: 'warning',
          message: `Certificate expires in ${sslResult.daysUntilExpiry} days`,
          severity: 'medium',
        });
        warnings++;
      } else {
        checks.push({
          id: 'ssl-expiry',
          name: 'SSL Certificate Expiry',
          category: 'SSL/TLS',
          status: 'passed',
          message: `Certificate valid for ${sslResult.daysUntilExpiry} days`,
          severity: 'info',
        });
        passed++;
      }

      // Check self-signed
      if (sslResult.selfSigned) {
        checks.push({
          id: 'ssl-self-signed',
          name: 'Self-Signed Certificate',
          category: 'SSL/TLS',
          status: 'warning',
          message: 'Certificate is self-signed',
          severity: 'medium',
        });
        warnings++;
      }

      // Check TLS version
      if (sslResult.protocol && !sslResult.protocol.includes('TLSv1.2') && !sslResult.protocol.includes('TLSv1.3')) {
        checks.push({
          id: 'ssl-protocol',
          name: 'TLS Protocol Version',
          category: 'SSL/TLS',
          status: 'failed',
          message: `Weak TLS version: ${sslResult.protocol}`,
          severity: 'high',
        });
        failed++;
      } else if (sslResult.protocol) {
        checks.push({
          id: 'ssl-protocol',
          name: 'TLS Protocol Version',
          category: 'SSL/TLS',
          status: 'passed',
          message: `Using ${sslResult.protocol}`,
          severity: 'info',
        });
        passed++;
      }
    } else {
      checks.push({
        id: 'ssl-valid',
        name: 'SSL Certificate',
        category: 'SSL/TLS',
        status: 'failed',
        message: sslResult.errors.join(', ') || 'Invalid SSL certificate',
        severity: 'critical',
      });
      failed++;
    }
  } else if (!isHttps) {
    checks.push({
      id: 'ssl-missing',
      name: 'HTTPS Not Enabled',
      category: 'SSL/TLS',
      status: 'failed',
      message: 'Website does not use HTTPS',
      severity: 'critical',
    });
    failed++;
  }

  // 3. HTTP Headers Check
  let headersResult: HeadersResult | null = null;
  let serverInfo: ServerInfo | null = null;
  
  if (dnsResult.resolved) {
    const httpResult = await performHTTPCheck(targetUrl);
    headersResult = httpResult.headers;
    serverInfo = httpResult.server;

    // Security Headers checks
    const securityHeaders = headersResult.security;

    // Content-Security-Policy
    if (securityHeaders.contentSecurityPolicy.present) {
      checks.push({
        id: 'header-csp',
        name: 'Content-Security-Policy',
        category: 'Headers',
        status: 'passed',
        message: 'CSP header is present',
        severity: 'info',
        data: { value: securityHeaders.contentSecurityPolicy.value },
      });
      passed++;
    } else {
      checks.push({
        id: 'header-csp',
        name: 'Content-Security-Policy',
        category: 'Headers',
        status: 'failed',
        message: 'CSP header is missing - vulnerable to XSS attacks',
        severity: 'high',
        details: 'Add Content-Security-Policy header to prevent XSS and data injection attacks',
      });
      failed++;
    }

    // X-Frame-Options
    if (securityHeaders.xFrameOptions.present) {
      checks.push({
        id: 'header-xfo',
        name: 'X-Frame-Options',
        category: 'Headers',
        status: 'passed',
        message: `X-Frame-Options: ${securityHeaders.xFrameOptions.value}`,
        severity: 'info',
      });
      passed++;
    } else {
      checks.push({
        id: 'header-xfo',
        name: 'X-Frame-Options',
        category: 'Headers',
        status: 'warning',
        message: 'X-Frame-Options header is missing - vulnerable to clickjacking',
        severity: 'medium',
        details: 'Add X-Frame-Options: DENY or SAMEORIGIN',
      });
      warnings++;
    }

    // X-Content-Type-Options
    if (securityHeaders.xContentTypeOptions.present) {
      checks.push({
        id: 'header-xcto',
        name: 'X-Content-Type-Options',
        category: 'Headers',
        status: 'passed',
        message: 'X-Content-Type-Options: nosniff',
        severity: 'info',
      });
      passed++;
    } else {
      checks.push({
        id: 'header-xcto',
        name: 'X-Content-Type-Options',
        category: 'Headers',
        status: 'warning',
        message: 'X-Content-Type-Options header is missing',
        severity: 'low',
        details: 'Add X-Content-Type-Options: nosniff',
      });
      warnings++;
    }

    // Strict-Transport-Security
    if (securityHeaders.strictTransportSecurity.present) {
      checks.push({
        id: 'header-hsts',
        name: 'Strict-Transport-Security (HSTS)',
        category: 'Headers',
        status: 'passed',
        message: 'HSTS is enabled',
        severity: 'info',
        data: { value: securityHeaders.strictTransportSecurity.value },
      });
      passed++;
    } else {
      checks.push({
        id: 'header-hsts',
        name: 'Strict-Transport-Security (HSTS)',
        category: 'Headers',
        status: isHttps ? 'warning' : 'info',
        message: 'HSTS header is missing',
        severity: isHttps ? 'medium' : 'low',
        details: 'Add Strict-Transport-Security header for HTTPS sites',
      });
      if (isHttps) warnings++;
    }

    // Referrer-Policy
    if (securityHeaders.referrerPolicy.present) {
      checks.push({
        id: 'header-rp',
        name: 'Referrer-Policy',
        category: 'Headers',
        status: 'passed',
        message: `Referrer-Policy: ${securityHeaders.referrerPolicy.value}`,
        severity: 'info',
      });
      passed++;
    } else {
      checks.push({
        id: 'header-rp',
        name: 'Referrer-Policy',
        category: 'Headers',
        status: 'warning',
        message: 'Referrer-Policy header is missing',
        severity: 'low',
        details: 'Add Referrer-Policy header to control referrer information',
      });
      warnings++;
    }

    // Server Info Exposure
    if (serverInfo.serverExposed) {
      checks.push({
        id: 'server-exposure',
        name: 'Server Version Exposure',
        category: 'Server',
        status: 'warning',
        message: `Server version exposed: ${serverInfo.server}`,
        severity: 'low',
        details: 'Hide server version to reduce attack surface',
      });
      warnings++;
    } else {
      checks.push({
        id: 'server-exposure',
        name: 'Server Version Exposure',
        category: 'Server',
        status: 'passed',
        message: 'Server version is hidden',
        severity: 'info',
      });
      passed++;
    }
  }

  // 4. Vulnerability Checks (Safe, Passive)
  const vulnerabilities: VulnerabilityResult[] = [];
  
  if (dnsResult.resolved && headersResult) {
    // Check for potential XSS via missing headers
    if (!headersResult.security.contentSecurityPolicy.present) {
      vulnerabilities.push({
        type: 'XSS Risk',
        found: true,
        details: 'Missing Content-Security-Policy makes site vulnerable to XSS attacks',
        severity: 'high',
      });
    }

    // Check for clickjacking
    if (!headersResult.security.xFrameOptions.present) {
      vulnerabilities.push({
        type: 'Clickjacking Risk',
        found: true,
        details: 'Missing X-Frame-Options allows site to be embedded in iframes',
        severity: 'medium',
      });
    }

    // Perform safe reflection test
    const reflectionTest = await performSafeXSSTest(targetUrl);
    if (reflectionTest.vulnerable) {
      checks.push({
        id: 'xss-reflection',
        name: 'Input Reflection Test',
        category: 'Vulnerabilities',
        status: 'warning',
        message: 'Potential input reflection detected',
        severity: 'medium',
        details: reflectionTest.details,
      });
      warnings++;
      vulnerabilities.push({
        type: 'Reflected Input',
        found: true,
        details: reflectionTest.details,
        severity: 'medium',
        evidence: reflectionTest.evidence,
      });
    } else {
      checks.push({
        id: 'xss-reflection',
        name: 'Input Reflection Test',
        category: 'Vulnerabilities',
        status: 'passed',
        message: 'No obvious input reflection vulnerabilities detected',
        severity: 'info',
      });
      passed++;
    }

    // Perform safe SQL injection test
    const sqliTest = await performSafeSQLiTest(targetUrl);
    if (sqliTest.vulnerable) {
      checks.push({
        id: 'sqli-test',
        name: 'SQL Injection Risk',
        category: 'Vulnerabilities',
        status: 'failed',
        message: 'Potential SQL injection vulnerability detected',
        severity: 'critical',
        details: sqliTest.details,
      });
      failed++;
      vulnerabilities.push({
        type: 'SQL Injection Risk',
        found: true,
        details: sqliTest.details,
        severity: 'critical',
        evidence: sqliTest.evidence,
      });
    } else {
      checks.push({
        id: 'sqli-test',
        name: 'SQL Injection Risk',
        category: 'Vulnerabilities',
        status: 'passed',
        message: 'No SQL injection patterns detected',
        severity: 'info',
      });
      passed++;
    }
  }

  // Calculate score
  const total = passed + warnings + failed;
  const score = total > 0 ? Math.round(((passed * 100) + (warnings * 50)) / total) : 0;
  
  // Calculate grade
  let grade: string;
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 50) grade = 'D';
  else grade = 'F';

  const scanDuration = Date.now() - startTime;

  return {
    url: targetUrl,
    timestamp: new Date().toISOString(),
    score,
    grade,
    checks,
    summary: { passed, warnings, failed, total },
    dns: dnsResult,
    ssl: sslResult,
    headers: headersResult,
    server: serverInfo,
    vulnerabilities,
    scanDuration,
  };
}

/**
 * Perform real DNS lookups
 */
async function performDNSChecks(hostname: string): Promise<DNSResult> {
  const result: DNSResult = {
    resolved: false,
    ipAddresses: [],
    ipv6Addresses: [],
    mxRecords: [],
    nsRecords: [],
    txtRecords: [],
    cname: [],
    hasCDN: false,
    cdnProvider: null,
  };

  try {
    // A records (IPv4)
    result.ipAddresses = await new Promise<string[]>((resolve) => {
      dns.resolve4(hostname, (err: Error | null, addresses: string[]) => {
        resolve(err ? [] : addresses);
      });
    });

    // AAAA records (IPv6)
    result.ipv6Addresses = await new Promise<string[]>((resolve) => {
      dns.resolve6(hostname, (err: Error | null, addresses: string[]) => {
        resolve(err ? [] : addresses);
      });
    });

    // MX records
    result.mxRecords = await new Promise<Array<{ exchange: string; priority: number }>>((resolve) => {
      dns.resolveMx(hostname, (err: Error | null, records: dns.MxRecord[]) => {
        resolve(err ? [] : records);
      });
    });

    // NS records
    result.nsRecords = await new Promise<string[]>((resolve) => {
      dns.resolveNs(hostname, (err: Error | null, records: string[]) => {
        resolve(err ? [] : records);
      });
    });

    // TXT records
    result.txtRecords = await new Promise<string[][]>((resolve) => {
      dns.resolveTxt(hostname, (err: Error | null, records: string[][]) => {
        resolve(err ? [] : records);
      });
    });

    // CNAME records
    result.cname = await new Promise<string[]>((resolve) => {
      dns.resolveCname(hostname, (err: Error | null, records: string[]) => {
        resolve(err ? [] : records);
      });
    });

    result.resolved = result.ipAddresses.length > 0 || result.ipv6Addresses.length > 0;

    // Check for CDN
    const allRecords = [
      ...result.nsRecords,
      ...result.cname,
      ...result.txtRecords.flat(),
    ].join(' ');

    for (const [provider, patterns] of Object.entries(CDN_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(allRecords) || pattern.test(hostname)) {
          result.hasCDN = true;
          result.cdnProvider = provider;
          break;
        }
      }
      if (result.hasCDN) break;
    }
  } catch (error) {
    console.error('DNS check error:', error);
  }

  return result;
}

/**
 * Perform real SSL/TLS certificate check
 */
async function performSSLCheck(hostname: string): Promise<SSLResult> {
  return new Promise((resolve) => {
    const result: SSLResult = {
      valid: false,
      issuer: '',
      subject: '',
      validFrom: '',
      validTo: '',
      daysUntilExpiry: 0,
      protocol: '',
      cipher: '',
      keySize: 0,
      selfSigned: false,
      errors: [],
    };

    const options: tls.ConnectionOptions = {
      host: hostname,
      port: 443,
      servername: hostname,
      rejectUnauthorized: false, // We want to inspect even invalid certs
    };

    const socket = tls.connect(options, () => {
      try {
        const cert = socket.getPeerCertificate();
        const cipher = socket.getCipher();
        const protocol = socket.getProtocol();

        if (cert && Object.keys(cert).length > 0) {
          result.valid = socket.authorized;
          result.issuer = typeof cert.issuer === 'object' ? (cert.issuer as any).O || (cert.issuer as any).CN || 'Unknown' : String(cert.issuer);
          result.subject = typeof cert.subject === 'object' ? (cert.subject as any).CN || 'Unknown' : String(cert.subject);
          result.validFrom = cert.valid_from || '';
          result.validTo = cert.valid_to || '';
          result.protocol = protocol || '';
          result.cipher = cipher?.name || '';
          result.keySize = cert.bits || 0;

          // Calculate days until expiry
          if (cert.valid_to) {
            const expiryDate = new Date(cert.valid_to);
            const now = new Date();
            result.daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          }

          // Check if self-signed
          if (cert.issuer && cert.subject) {
            const issuerStr = typeof cert.issuer === 'object' ? JSON.stringify(cert.issuer) : String(cert.issuer);
            const subjectStr = typeof cert.subject === 'object' ? JSON.stringify(cert.subject) : String(cert.subject);
            result.selfSigned = issuerStr === subjectStr;
          }

          if (!socket.authorized) {
            result.errors.push(socket.authorizationError || 'Certificate validation failed');
          }
        }
      } catch (error) {
        result.errors.push(String(error));
      }

      socket.end();
      resolve(result);
    });

    socket.on('error', (error: Error) => {
      result.errors.push(error.message);
      resolve(result);
    });

    socket.setTimeout(10000, () => {
      result.errors.push('Connection timeout');
      socket.destroy();
      resolve(result);
    });
  });
}

/**
 * Perform HTTP request to check headers
 */
async function performHTTPCheck(targetUrl: string): Promise<{ headers: HeadersResult; server: ServerInfo }> {
  return new Promise((resolve) => {
    const url = new URL(targetUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      timeout: 15000,
      headers: {
        'User-Agent': 'ShieldScan Security Scanner/2.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    };

    const req = client.request(options, (res: http.IncomingMessage) => {
      const rawHeaders: Record<string, string> = {};
      
      // Get all headers
      if (res.rawHeaders) {
        for (let i = 0; i < res.rawHeaders.length; i += 2) {
          rawHeaders[res.rawHeaders[i].toLowerCase()] = res.rawHeaders[i + 1];
        }
      }

      const securityHeaders: SecurityHeaders = {
        contentSecurityPolicy: checkHeader(rawHeaders, 'content-security-policy'),
        xFrameOptions: checkHeader(rawHeaders, 'x-frame-options'),
        xContentTypeOptions: checkHeader(rawHeaders, 'x-content-type-options'),
        referrerPolicy: checkHeader(rawHeaders, 'referrer-policy'),
        strictTransportSecurity: checkHeader(rawHeaders, 'strict-transport-security'),
        xXssProtection: checkHeader(rawHeaders, 'x-xss-protection'),
        permissionsPolicy: checkHeader(rawHeaders, 'permissions-policy'),
      };

      const serverInfo: ServerInfo = {
        server: rawHeaders['server'] || null,
        poweredBy: rawHeaders['x-powered-by'] || null,
        technology: detectTechnology(rawHeaders),
        serverExposed: !!(rawHeaders['server'] && /\d/.test(rawHeaders['server'])),
      };

      res.destroy();
      resolve({
        headers: { raw: rawHeaders, security: securityHeaders },
        server: serverInfo,
      });
    });

    req.on('error', () => {
      resolve({
        headers: {
          raw: {},
          security: {
            contentSecurityPolicy: { present: false, value: null, status: 'failed' },
            xFrameOptions: { present: false, value: null, status: 'failed' },
            xContentTypeOptions: { present: false, value: null, status: 'failed' },
            referrerPolicy: { present: false, value: null, status: 'failed' },
            strictTransportSecurity: { present: false, value: null, status: 'failed' },
            xXssProtection: { present: false, value: null, status: 'failed' },
            permissionsPolicy: { present: false, value: null, status: 'failed' },
          },
        },
        server: {
          server: null,
          poweredBy: null,
          technology: [],
          serverExposed: false,
        },
      });
    });

    req.on('timeout', () => {
      req.destroy();
    });

    req.end();
  });
}

function checkHeader(headers: Record<string, string>, headerName: string): HeaderCheck {
  const value = headers[headerName] || null;
  return {
    present: !!value,
    value,
    status: value ? 'passed' : 'failed',
  };
}

function detectTechnology(headers: Record<string, string>): string[] {
  const tech: string[] = [];
  const headerStr = JSON.stringify(headers).toLowerCase();

  for (const [name, patterns] of Object.entries(CMS_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(headerStr)) {
        tech.push(name);
        break;
      }
    }
  }

  // Server technology
  if (headers['server']) {
    if (/nginx/i.test(headers['server'])) tech.push('Nginx');
    if (/apache/i.test(headers['server'])) tech.push('Apache');
    if (/iis/i.test(headers['server'])) tech.push('Microsoft IIS');
  }

  if (headers['x-powered-by']) {
    if (/php/i.test(headers['x-powered-by'])) tech.push('PHP');
    if (/asp/i.test(headers['x-powered-by'])) tech.push('ASP.NET');
    if (/express/i.test(headers['x-powered-by'])) tech.push('Express.js');
  }

  return [...new Set(tech)];
}

/**
 * Safe XSS reflection test - DOES NOT EXPLOIT
 */
async function performSafeXSSTest(targetUrl: string): Promise<{ vulnerable: boolean; details: string; evidence?: string }> {
  return new Promise((resolve) => {
    const testPayload = 'shieldscan_test_' + Date.now();
    const url = new URL(targetUrl);
    
    // Add test parameter
    url.searchParams.set('q', testPayload);
    url.searchParams.set('search', testPayload);
    
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'ShieldScan Security Scanner/2.0',
      },
    };

    const req = client.request(options, (res: http.IncomingMessage) => {
      let body = '';
      
      res.on('data', (chunk: Buffer) => {
        body += chunk.toString();
        // Limit body size to prevent memory issues
        if (body.length > 100000) {
          res.destroy();
        }
      });

      res.on('end', () => {
        // Check if our test payload is reflected
        const isReflected = body.includes(testPayload);
        
        resolve({
          vulnerable: isReflected,
          details: isReflected 
            ? 'Input parameters may be reflected in the page without proper encoding'
            : 'No input reflection detected',
          evidence: isReflected ? `Test parameter "${testPayload}" was reflected in response` : undefined,
        });
      });
    });

    req.on('error', () => {
      resolve({ vulnerable: false, details: 'Could not complete XSS test' });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ vulnerable: false, details: 'XSS test timed out' });
    });

    req.end();
  });
}

/**
 * Safe SQL injection test - DOES NOT EXPLOIT
 * Only checks for error-based detection patterns
 */
async function performSafeSQLiTest(targetUrl: string): Promise<{ vulnerable: boolean; details: string; evidence?: string }> {
  return new Promise((resolve) => {
    const url = new URL(targetUrl);
    
    // Add SQL-like test parameter (harmless)
    url.searchParams.set('id', "1'");
    
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'ShieldScan Security Scanner/2.0',
      },
    };

    const req = client.request(options, (res: http.IncomingMessage) => {
      let body = '';
      
      res.on('data', (chunk: Buffer) => {
        body += chunk.toString();
        if (body.length > 100000) {
          res.destroy();
        }
      });

      res.on('end', () => {
        // Check for SQL error patterns (passive detection)
        const sqlErrorPatterns = [
          /sql syntax/i,
          /mysql_/i,
          /mysqli_/i,
          /pg_query/i,
          /sqlite_/i,
          /ORA-\d{5}/i,
          /SQL Server/i,
          /ODBC Driver/i,
          /syntax error/i,
          /unclosed quotation/i,
          /quoted string not properly terminated/i,
        ];

        let vulnerable = false;
        let matchedPattern = '';

        for (const pattern of sqlErrorPatterns) {
          if (pattern.test(body)) {
            vulnerable = true;
            matchedPattern = pattern.source;
            break;
          }
        }

        resolve({
          vulnerable,
          details: vulnerable
            ? 'SQL error messages detected in response - possible SQL injection vulnerability'
            : 'No SQL error patterns detected',
          evidence: vulnerable ? `Matched pattern: ${matchedPattern}` : undefined,
        });
      });
    });

    req.on('error', () => {
      resolve({ vulnerable: false, details: 'Could not complete SQLi test' });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ vulnerable: false, details: 'SQLi test timed out' });
    });

    req.end();
  });
}
