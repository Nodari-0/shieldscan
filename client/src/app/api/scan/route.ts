import { NextRequest, NextResponse } from 'next/server';
import * as dns from 'dns';
import * as tls from 'tls';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { checkRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rateLimit';
import { checkScanPermission } from '@/lib/scanLimits';
import { getUserProfile } from '@/firebase/firestore';
import { logScanEvent, logSuspiciousActivity } from '@/lib/auditLogger';
// Note: Firestore saves are handled client-side after scan completes

// Types
interface RequestEvidence {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

interface ResponseEvidence {
  status: number;
  headers: Record<string, string>;
  body?: string;
  bodyPreview?: string;
}

interface Evidence {
  request?: RequestEvidence;
  response?: ResponseEvidence;
  screenshot?: string;
  reproductionSteps?: string[];
  proofOfImpact?: string;
  timestamp?: string;
}

// Helper to detect if content is binary/encrypted (high entropy or non-printable)
function isBinaryContent(body: string): boolean {
  if (!body || body.length === 0) return false;
  
  // Check ratio of non-printable characters
  const nonPrintable = body.replace(/[\x09\x0A\x0D\x20-\x7E]/g, '').length;
  const ratio = nonPrintable / body.length;
  
  // If more than 10% non-printable, it's likely binary
  if (ratio > 0.1) return true;
  
  // Calculate entropy (high entropy = encrypted/compressed)
  const freq: Record<string, number> = {};
  for (const char of body.slice(0, 1000)) {
    freq[char] = (freq[char] || 0) + 1;
  }
  const len = Math.min(body.length, 1000);
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  
  // Entropy > 6 bits/char suggests encrypted/compressed data
  if (entropy > 6) return true;
  
  // Check for common binary patterns (TLS, HTTP/2 frames, etc.)
  const binaryPatterns = [
    /^\x16\x03/, // TLS handshake
    /^PRI \* HTTP\/2/, // HTTP/2 preface
    /[\x00-\x08\x0B\x0C\x0E-\x1F]{3,}/, // Multiple control chars
  ];
  for (const pattern of binaryPatterns) {
    if (pattern.test(body.slice(0, 100))) return true;
  }
  
  return false;
}

// Helper to sanitize response bodies - properly detects and rejects binary/encrypted data
function makeBodyPreview(body: string, limit = 400): string {
  if (!body) return '';
  
  // First check if it's binary/encrypted content
  if (isBinaryContent(body)) {
    return '[Binary/encrypted response - not displayed]';
  }
  
  // Remove any remaining non-printable characters
  const cleaned = body.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ').replace(/\s+/g, ' ');
  const preview = cleaned.trim();
  
  // If cleaning removed too much, it was probably binary
  if (preview.length < body.length * 0.5 && body.length > 50) {
    return '[Binary/encrypted response - not displayed]';
  }
  
  if (!preview) {
    return '[Empty or binary response]';
  }
  
  return preview.slice(0, limit);
}

// Helper to determine if a finding should show evidence (excludes informational/config findings)
function shouldShowEvidence(checkId: string, status: string): boolean {
  // Informational / Best Practice findings that don't need evidence
  // These are not exploitable vulnerabilities
  const infoOnlyFindings = [
    // DNS/Network informational
    'ipv6-support', 'ipv4-support', 'dns-resolution', 'cdn-detection',
    'waf-detection', 'server-detection', 'technology-detection',
    'framework-detection', 'response-time', 'compression', 'gzip', 'http2-support',
    // Compliance/Best Practice (not vulnerabilities)
    'dnssec', 'caa-records',
    // Header best practices (absence is not exploitable)
    'header-rp', 'header-pp', 'cache-control', 'header-csp', 'header-xcto',
    // Cookie best practices (context-dependent)
    'cookie-security',
    // Public files (robots.txt, sitemap.xml are NOT sensitive)
    'public-files', 'robots-txt', 'robots-sensitive',
    // Input reflection (not XSS unless in executable context)
    'basic-xss', // Only show evidence if status is 'failed' (actual vulnerability)
  ];
  
  if (infoOnlyFindings.includes(checkId)) return false;
  // No evidence for passed or informational status
  if (status === 'passed' || status === 'info') return false;
  
  return true;
}

// Screenshot capture stub (placeholder for future implementation)
// To enable screenshots, install playwright and uncomment the implementation below.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function captureScreenshot(_url: string): Promise<string | undefined> {
  // Screenshot capture disabled to avoid heavy playwright dependency.
  // Evidence is provided via request/response data instead.
  return undefined;
}

// Finding types for proper categorization
// - 'vulnerability': Actual exploitable security issue (requires evidence + reproduction)
// - 'best_practice': Security enhancement recommendation (not exploitable)
// - 'compliance': Standards/compliance related (optional, not security critical)
// - 'informational': Context/detection info (never a finding)
// - 'performance': Performance metrics (never security, never actionable as security)
type FindingType = 'vulnerability' | 'best_practice' | 'compliance' | 'informational' | 'performance';

interface ScanCheck {
  id: string;
  name: string;
  category: string;
  status: 'passed' | 'warning' | 'failed' | 'info' | 'error';
  message: string;
  details?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  findingType?: FindingType; // New: categorizes the nature of the finding
  proOnly?: boolean;
  ultraOnly?: boolean;
  evidence?: Evidence;
}

interface ScanResult {
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
  subdomains?: string[];
  technologies?: TechnologyInfo[];
  robotsInfo?: RobotsInfo | null;
  emailSecurity?: EmailSecurityResult | null;
}

interface DNSResult {
  resolved: boolean;
  ipAddresses: string[];
  ipv6Addresses: string[];
  mxRecords: Array<{ exchange: string; priority: number }>;
  nsRecords: string[];
  txtRecords: string[];
  hasCDN: boolean;
  cdnProvider: string | null;
  caaRecords: string[];
  hasDNSSEC: boolean;
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
  evidence?: Evidence;
}

interface TechnologyInfo {
  name: string;
  category: string;
  version?: string;
  confidence: number;
}

interface RobotsInfo {
  exists: boolean;
  disallowedPaths: string[];
  sitemaps: string[];
  exposedSensitivePaths: string[];
}

interface EmailSecurityResult {
  spf: boolean;
  spfRecord?: string;
  dmarc: boolean;
  dmarcRecord?: string;
  dkim: boolean;
  bimi: boolean;
  mxRecords: Array<{ exchange: string; priority: number }>;
}

// Admin emails - Add your email here
const ADMIN_EMAILS = [
  'nodarirusishvililinkedin@gmail.com',
];

function isAdmin(email?: string): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some(e => e.toLowerCase() === email.toLowerCase());
}

// CDN detection patterns
const CDN_PATTERNS: Record<string, RegExp[]> = {
  'Cloudflare': [/cloudflare/i, /cf-ray/i],
  'AWS CloudFront': [/cloudfront/i, /x-amz-cf/i],
  'Fastly': [/fastly/i],
  'Akamai': [/akamai/i],
  'Vercel': [/vercel/i, /x-vercel/i],
  'Netlify': [/netlify/i],
  'Google Cloud': [/google/i, /gws/i],
};

// Technology detection patterns (expanded)
const TECH_PATTERNS: Record<string, { patterns: RegExp[], category: string }> = {
  'WordPress': { patterns: [/wp-content/i, /wp-includes/i, /wordpress/i, /wp-json/i], category: 'CMS' },
  'Drupal': { patterns: [/drupal/i, /sites\/default/i], category: 'CMS' },
  'Joomla': { patterns: [/joomla/i, /com_content/i], category: 'CMS' },
  'Shopify': { patterns: [/shopify/i, /cdn\.shopify/i], category: 'E-commerce' },
  'Magento': { patterns: [/magento/i, /mage/i], category: 'E-commerce' },
  'WooCommerce': { patterns: [/woocommerce/i, /wc-/i], category: 'E-commerce' },
  'React': { patterns: [/react/i, /__react/i], category: 'Framework' },
  'Next.js': { patterns: [/_next/i, /__next/i, /next\.js/i], category: 'Framework' },
  'Vue.js': { patterns: [/vue/i, /vuejs/i], category: 'Framework' },
  'Angular': { patterns: [/angular/i, /ng-/i], category: 'Framework' },
  'jQuery': { patterns: [/jquery/i], category: 'Library' },
  'Bootstrap': { patterns: [/bootstrap/i], category: 'CSS Framework' },
  'Tailwind CSS': { patterns: [/tailwind/i], category: 'CSS Framework' },
  'PHP': { patterns: [/php/i, /\.php/i], category: 'Language' },
  'ASP.NET': { patterns: [/asp\.net/i, /aspnet/i, /\.aspx/i], category: 'Framework' },
  'Node.js': { patterns: [/node/i, /express/i], category: 'Runtime' },
  'Python': { patterns: [/python/i, /django/i, /flask/i], category: 'Language' },
  'Ruby on Rails': { patterns: [/rails/i, /ruby/i], category: 'Framework' },
  'Laravel': { patterns: [/laravel/i], category: 'Framework' },
  'Nginx': { patterns: [/nginx/i], category: 'Server' },
  'Apache': { patterns: [/apache/i], category: 'Server' },
  'IIS': { patterns: [/iis/i, /microsoft/i], category: 'Server' },
  'Cloudflare': { patterns: [/cloudflare/i], category: 'CDN/Security' },
  'Google Analytics': { patterns: [/google-analytics/i, /gtag/i, /ga\.js/i, /analytics\.js/i], category: 'Analytics' },
  'Google Tag Manager': { patterns: [/googletagmanager/i, /gtm\.js/i], category: 'Analytics' },
  'Facebook Pixel': { patterns: [/facebook.*pixel/i, /fbevents/i], category: 'Analytics' },
  'Hotjar': { patterns: [/hotjar/i], category: 'Analytics' },
  'Stripe': { patterns: [/stripe/i, /js\.stripe/i], category: 'Payment' },
  'PayPal': { patterns: [/paypal/i], category: 'Payment' },
};

// Known vulnerable libraries (simplified Retire.js-like database)
const VULNERABLE_LIBRARIES: Record<string, { pattern: RegExp, vulnerableVersions: string[], severity: string }> = {
  'jQuery < 3.5.0': { pattern: /jquery[\/\-]([1-2]\.\d+\.\d+|3\.[0-4]\.\d+)/i, vulnerableVersions: ['1.x', '2.x', '3.0-3.4'], severity: 'medium' },
  'Angular < 1.6.0': { pattern: /angular[\/\-]1\.[0-5]\.\d+/i, vulnerableVersions: ['1.0-1.5'], severity: 'high' },
  'Bootstrap < 4.3.1': { pattern: /bootstrap[\/\-]([1-3]\.\d+\.\d+|4\.[0-2]\.\d+|4\.3\.0)/i, vulnerableVersions: ['3.x', '4.0-4.3.0'], severity: 'medium' },
  'Lodash < 4.17.21': { pattern: /lodash[\/\-]4\.17\.(0|1[0-9]|20)/i, vulnerableVersions: ['4.17.0-4.17.20'], severity: 'high' },
};

// Auth config type from request
interface ScanAuthConfig {
  headers?: Record<string, string>;
  cookies?: string;
  profileName?: string;
  profileType?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url: targetUrl, plan = 'free', userEmail, userId, auth } = body as {
      url: string;
      plan?: string;
      userEmail?: string;
      userId?: string;
      auth?: ScanAuthConfig;
    };

    if (!targetUrl) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    // Comprehensive scan permission check (rate limits + scan limits + cooldown)
    const permissionCheck = await checkScanPermission(userId || null, userEmail || null, request);
    
    if (!permissionCheck.allowed) {
      // Log scan attempt failure
      if (userId && userEmail) {
        if (permissionCheck.statusCode === 403) {
          await logScanEvent('scan.limit.reached', userId, userEmail, targetUrl);
        } else if (permissionCheck.statusCode === 429) {
          await logSuspiciousActivity(userId, userEmail, 'Rate limit exceeded', {
            url: targetUrl,
            ip: getClientIP(request),
          });
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: permissionCheck.error || 'Scan not allowed',
          scansRemaining: permissionCheck.scansRemaining,
          resetDate: permissionCheck.resetDate?.toISOString(),
          limitReached: permissionCheck.statusCode === 403,
        },
        {
          status: permissionCheck.statusCode,
          headers: permissionCheck.headers || {},
        }
      );
    }

    // Get user profile for plan info
    let userPlan = plan;
    if (userId) {
      try {
        const userProfile = await getUserProfile(userId);
        if (userProfile) {
          userPlan = userProfile.plan;
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Continue with provided plan
      }
    }

    // Log scan initiation
    if (userId && userEmail) {
      await logScanEvent('scan.initiated', userId, userEmail, targetUrl, {
        plan: userPlan,
      });
    }

    // Input validation - sanitize URL
    const sanitizedUrl = targetUrl.trim().toLowerCase();
    if (sanitizedUrl.length > 2048) {
      return NextResponse.json({ success: false, error: 'URL too long' }, { status: 400 });
    }

    // Block scanning of internal/private IPs
    const blockedPatterns = [
      /^https?:\/\/localhost/i,
      /^https?:\/\/127\./,
      /^https?:\/\/10\./,
      /^https?:\/\/172\.(1[6-9]|2[0-9]|3[01])\./,
      /^https?:\/\/192\.168\./,
      /^https?:\/\/0\./,
      /^https?:\/\/\[::1\]/,
    ];
    
    if (blockedPatterns.some(pattern => pattern.test(sanitizedUrl))) {
      return NextResponse.json(
        { success: false, error: 'Cannot scan internal or private addresses' },
        { status: 400 }
      );
    }

    // Check if user is admin (gets all features)
    const isAdminUser = isAdmin(userEmail);
    const effectivePlan = isAdminUser ? 'business' : userPlan;

    // Log auth profile usage (as part of scan initiation metadata)

    const result = await performSecurityScan(sanitizedUrl, effectivePlan, isAdminUser, auth);
    
    // Log successful scan completion
    if (userId && userEmail) {
      await logScanEvent('scan.completed', userId, userEmail, sanitizedUrl, {
        plan: userPlan,
        score: result.score,
        grade: result.grade,
        duration: result.scanDuration,
      });
    }
    
    // Note: Firestore save is handled client-side after scan completes
    // This ensures the API route doesn't hang on Firebase SDK initialization
    
    const response = NextResponse.json({
      success: true,
      data: result,
      isAdmin: isAdminUser,
      scansRemaining: permissionCheck.scansRemaining,
    });
    
    // Add scan limit headers
    if (permissionCheck.scansRemaining !== undefined) {
      response.headers.set('X-Scans-Remaining', String(permissionCheck.scansRemaining));
    }
    if (permissionCheck.resetDate) {
      response.headers.set('X-Reset-Date', permissionCheck.resetDate.toISOString());
    }
    
    return response;
  } catch (error) {
    console.error('Scan error:', error);
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Scan failed' },
      { status: 500 }
    );
  }
}

async function performSecurityScan(targetUrl: string, plan: string, isAdminUser: boolean, authConfig?: ScanAuthConfig): Promise<ScanResult> {
  const startTime = Date.now();
  const checks: ScanCheck[] = [];
  let passed = 0;
  let warnings = 0;
  let failed = 0;

  // Plan access levels - Admin gets all features
  const isPro = plan === 'pro' || plan === 'business' || plan === 'enterprise' || isAdminUser;
  const isBusiness = plan === 'business' || plan === 'enterprise' || isAdminUser;
  const isEnterprise = plan === 'enterprise' || isAdminUser;
  
  // For backward compatibility
  const isUltra = isBusiness;

  // Scoring weights by category - SSL/DNS are more reliable, give them higher weight
  const SCORE_WEIGHTS: Record<string, { passed: number; warning: number; failed: number }> = {
    'ssl-valid': { passed: 15, warning: 5, failed: -20 },
    'ssl-expiry': { passed: 10, warning: -5, failed: -15 },
    'tls-version': { passed: 10, warning: 0, failed: -10 },
    'dns-resolution': { passed: 10, warning: 0, failed: -25 },
    'https-enforced': { passed: 10, warning: 0, failed: -15 },
    'header-hsts': { passed: 8, warning: -3, failed: -8 },
    'header-xfo': { passed: 5, warning: -2, failed: -5 },
    'header-xcto': { passed: 5, warning: -2, failed: -5 },
    'header-csp': { passed: 8, warning: -3, failed: -8 },
    'email-spf': { passed: 5, warning: -2, failed: -3 },
    'email-dmarc': { passed: 5, warning: -2, failed: -3 },
    'mixed-content': { passed: 5, warning: -5, failed: -10 },
    'basic-xss': { passed: 5, warning: -5, failed: -15 },
    'sqli-test': { passed: 5, warning: -5, failed: -20 },
    'cdn-detection': { passed: 5, warning: 0, failed: 0 },
    'waf-detection': { passed: 5, warning: 0, failed: 0 },
  };
  
  // Default weight for checks not explicitly defined
  const DEFAULT_WEIGHT = { passed: 3, warning: -2, failed: -5 };

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

  // ==========================================
  // 1. DNS RESOLUTION (FREE)
  // ==========================================
  const dnsResult = await performDNSChecks(hostname, isPro);
  
  if (dnsResult.resolved) {
    // Show IP resolution as informational - handle multiple IPs correctly
    const ipCount = dnsResult.ipAddresses.length;
    const ipSample = dnsResult.ipAddresses.slice(0, 2).join(', ');
    const ipMessage = ipCount > 2 
      ? `Resolves to ${ipCount} IPv4 addresses (sample: ${ipSample}, ...)`
      : `Resolves to ${ipCount} IPv4 address(es): ${ipSample}`;
    
    checks.push({
      id: 'dns-resolution',
      name: 'DNS Resolution',
      category: 'Informational',
      status: 'passed',
      message: ipMessage,
      severity: 'info',
    });
    passed++;

    // Add authentication indicator if auth was provided
    if (authConfig?.profileName) {
      checks.push({
        id: 'authenticated-scan',
        name: 'Authenticated Scan',
        category: 'Configuration',
        status: 'info',
        message: `Using ${authConfig.profileType || 'custom'} authentication: ${authConfig.profileName}`,
        details: 'Scan is running with authentication credentials for access to protected endpoints.',
        severity: 'info',
      });
      passed++;
    }

    if (dnsResult.hasCDN) {
      // CDN detection is informational - improves context but not a security finding
      const cdnName = dnsResult.cdnProvider || 'CDN';
      checks.push({
        id: 'cdn-detection',
        name: 'CDN Detected',
        category: 'Informational',
        status: 'info', // Changed from passed - it's neutral information
        message: `Traffic routed through ${cdnName}`,
        details: 'CDN presence affects header and response behavior. Some security headers may vary by endpoint.',
        severity: 'info',
      });
      passed++;
    }

    if (dnsResult.ipv6Addresses.length > 0) {
      // IPv6 is purely informational - NOT a security finding
      const ipv6Count = dnsResult.ipv6Addresses.length;
      checks.push({
        id: 'ipv6-support',
        name: 'IPv6 Support',
        category: 'Informational',
        status: 'info', // Changed from passed - it's neutral
        message: `${ipv6Count} IPv6 address(es) configured`,
        severity: 'info',
      });
      passed++;
    }

    // DNSSEC Check (ULTRA) - INFORMATIONAL ONLY, NOT A VULNERABILITY
    // DNSSEC absence is NOT exploitable without network position + advanced attack
    if (isUltra) {
      if (dnsResult.hasDNSSEC) {
        checks.push({
          id: 'dnssec',
          name: 'DNSSEC Validation',
          category: 'Compliance',
          status: 'passed',
          message: 'DNSSEC is enabled',
          severity: 'info',
          ultraOnly: true,
        });
        passed++;
      } else {
        // DNSSEC absence is informational/compliance only - NOT a security vulnerability
        checks.push({
          id: 'dnssec',
          name: 'DNSSEC Validation',
          category: 'Compliance',
          status: 'info', // Changed from warning - this is not a vulnerability
          message: 'DNSSEC not configured (common for CDN-backed domains)',
          severity: 'info', // Changed from medium - no practical exploit
          details: 'DNSSEC provides DNS response authentication. Many large sites (including Google, CDN providers) may not publish DNSSEC records.',
          ultraOnly: true,
        });
        // Don't increment warnings - this is informational
        passed++; // Count as neutral/passed since it's not a finding
      }

      // CAA Records Check - Informational, not a vulnerability
      if (dnsResult.caaRecords.length > 0) {
        checks.push({
          id: 'caa-records',
          name: 'CAA Records',
          category: 'Compliance',
          status: 'passed',
          message: `Certificate authorities restricted: ${dnsResult.caaRecords.length} CAA record(s)`,
          severity: 'info',
          ultraOnly: true,
        });
        passed++;
      } else {
        // CAA absence is a best practice recommendation, not exploitable
        checks.push({
          id: 'caa-records',
          name: 'CAA Records',
          category: 'Compliance',
          status: 'info', // Changed from warning
          message: 'No CAA records configured (optional security control)',
          severity: 'info', // Changed from low
          details: 'CAA records restrict which CAs can issue certificates. Absence is common and not directly exploitable.',
          ultraOnly: true,
        });
        passed++; // Count as neutral
      }
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

  // ==========================================
  // 2. SSL/TLS CERTIFICATE VALIDATION (FREE)
  // ==========================================
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
      });
      passed++;

      // Certificate Expiry Check
      if (sslResult.daysUntilExpiry <= 0) {
        checks.push({
          id: 'ssl-expiry',
          name: 'Certificate Expiry',
          category: 'SSL/TLS',
          status: 'failed',
          message: 'Certificate has EXPIRED!',
          severity: 'critical',
        });
        failed++;
      } else if (sslResult.daysUntilExpiry < 30) {
        checks.push({
          id: 'ssl-expiry',
          name: 'Certificate Expiry',
          category: 'SSL/TLS',
          status: 'warning',
          message: `Certificate expires in ${sslResult.daysUntilExpiry} days`,
          severity: 'medium',
        });
        warnings++;
      } else {
        checks.push({
          id: 'ssl-expiry',
          name: 'Certificate Expiry',
          category: 'SSL/TLS',
          status: 'passed',
          message: `Valid for ${sslResult.daysUntilExpiry} more days`,
          severity: 'info',
        });
        passed++;
      }

      // TLS Version Check
      if (sslResult.protocol) {
        if (sslResult.protocol.includes('TLSv1.3')) {
          checks.push({
            id: 'tls-version',
            name: 'TLS Protocol Version',
            category: 'SSL/TLS',
            status: 'passed',
            message: `Using ${sslResult.protocol} (latest)`,
            severity: 'info',
          });
          passed++;
        } else if (sslResult.protocol.includes('TLSv1.2')) {
          checks.push({
            id: 'tls-version',
            name: 'TLS Protocol Version',
            category: 'SSL/TLS',
            status: 'passed',
            message: `Using ${sslResult.protocol}`,
            severity: 'info',
          });
          passed++;
        } else {
          checks.push({
            id: 'tls-version',
            name: 'TLS Protocol Version',
            category: 'SSL/TLS',
            status: 'failed',
            message: `Weak TLS version: ${sslResult.protocol}`,
            severity: 'high',
            details: 'Upgrade to TLS 1.2 or higher',
          });
          failed++;
        }
      }

      if (sslResult.selfSigned) {
        checks.push({
          id: 'ssl-self-signed',
          name: 'Self-Signed Certificate',
          category: 'SSL/TLS',
          status: 'warning',
          message: 'Certificate is self-signed (not trusted by browsers)',
          severity: 'medium',
        });
        warnings++;
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
      id: 'https-missing',
      name: 'HTTPS Not Enabled',
      category: 'SSL/TLS',
      status: 'failed',
      message: 'Website does not use HTTPS - all traffic is unencrypted!',
      severity: 'critical',
      details: 'Enable HTTPS to encrypt data in transit',
    });
    failed++;
  }

  // ==========================================
  // 3. HTTP CHECK & SECURITY HEADERS
  // ==========================================
  let headersResult: HeadersResult | null = null;
  let serverInfo: ServerInfo | null = null;
  const vulnerabilities: VulnerabilityResult[] = [];
  let pageContent = '';
  const technologies: TechnologyInfo[] = [];
  let httpResponseTime = 0;
  let hasGzip = false;
  let hasHttp2 = false;

  if (dnsResult.resolved) {
    const httpStartTime = Date.now();
    const httpResult = await performHTTPCheck(targetUrl, 3, authConfig);
    httpResponseTime = Date.now() - httpStartTime;
    headersResult = httpResult.headers;
    serverInfo = httpResult.server;
    pageContent = httpResult.content;

    // Check for compression (GZIP, Brotli, or HTTP/2 implicit compression)
    const contentEncoding = headersResult.raw['content-encoding']?.toLowerCase() || '';
    hasGzip = contentEncoding.includes('gzip');
    const hasBrotli = contentEncoding.includes('br');
    const hasDeflate = contentEncoding.includes('deflate');
    const hasAnyCompression = hasGzip || hasBrotli || hasDeflate;
    
    const sec = headersResult.security;

    // ==========================================
    // FREE TIER CHECKS - Basic Security Headers
    // ==========================================
    
    // HSTS Header (FREE)
    if (sec.strictTransportSecurity.present) {
      checks.push({
        id: 'header-hsts',
        name: 'HSTS Header',
        category: 'Headers',
        status: 'passed',
        message: 'HSTS enabled - forces HTTPS connections',
        severity: 'info',
      });
      passed++;
    } else if (isHttps) {
      checks.push({
        id: 'header-hsts',
        name: 'HSTS Header',
        category: 'Headers',
        status: 'warning',
        message: 'HSTS not enabled - browsers can connect via HTTP',
        severity: 'medium',
        details: 'Add Strict-Transport-Security header',
      });
      warnings++;
    }

    // X-Frame-Options (FREE)
    if (sec.xFrameOptions.present) {
      checks.push({
        id: 'header-xfo',
        name: 'X-Frame-Options',
        category: 'Headers',
        status: 'passed',
        message: `Clickjacking protection: ${sec.xFrameOptions.value}`,
        severity: 'info',
      });
      passed++;
    } else {
      checks.push({
        id: 'header-xfo',
        name: 'X-Frame-Options',
        category: 'Headers',
        status: 'warning',
        message: 'Missing - vulnerable to clickjacking',
        severity: 'medium',
        details: 'Add X-Frame-Options: DENY or SAMEORIGIN',
      });
      warnings++;
    }

    // X-Content-Type-Options (FREE) - Best Practice, not a vulnerability
    if (sec.xContentTypeOptions.present) {
      checks.push({
        id: 'header-xcto',
        name: 'X-Content-Type-Options',
        category: 'Headers',
        status: 'passed',
        message: 'MIME sniffing protection enabled',
        severity: 'info',
      });
      passed++;
    } else {
      // Best practice recommendation - absence is not directly exploitable
      checks.push({
        id: 'header-xcto',
        name: 'X-Content-Type-Options',
        category: 'Best Practice',
        status: 'info', // Changed from warning - this is a best practice
        message: 'X-Content-Type-Options header not set',
        severity: 'info', // Changed from low
        details: 'Adding "X-Content-Type-Options: nosniff" prevents MIME-type sniffing.',
        findingType: 'best_practice',
      });
      passed++; // Count as neutral
    }

    // Response Time (FREE) - Informational only, NOT a security finding
    // Note: Response time is affected by CDN routing, geographic distance, server load
    // It is NOT actionable as a security measure
    const hasCDN = dnsResult.hasCDN;
    const cdnContext = hasCDN ? ` (CDN-backed: ${dnsResult.cdnProvider || 'detected'})` : '';
    
    // Always informational - performance is NOT security
    let responseMessage: string;
    if (httpResponseTime < 500) {
      responseMessage = `Excellent TTFB: ${httpResponseTime}ms${cdnContext}`;
    } else if (httpResponseTime < 1500) {
      responseMessage = `Good TTFB: ${httpResponseTime}ms${cdnContext}`;
    } else if (httpResponseTime < 3000) {
      responseMessage = `Moderate TTFB: ${httpResponseTime}ms${cdnContext}`;
    } else {
      responseMessage = `High initial latency: ${httpResponseTime}ms${cdnContext} - may include redirects and TLS negotiation`;
    }
    
    checks.push({
      id: 'response-time',
      name: 'Response Time',
      category: 'Performance', // Never "Security" or "Best Practice"
      status: 'info', // Always info - not a security concern
      message: responseMessage,
      severity: 'info', // Never warn about performance as security
      findingType: 'informational', // Explicitly mark as informational
    });
    passed++;

    // Mixed Content Check (FREE)
    if (isHttps) {
      const mixedContent = checkMixedContent(pageContent);
      if (mixedContent.found) {
        checks.push({
          id: 'mixed-content',
          name: 'Mixed Content',
          category: 'SSL/TLS',
          status: 'warning',
          message: `Found ${mixedContent.count} HTTP resources on HTTPS page`,
          severity: 'medium',
          details: `Resources: ${mixedContent.examples.slice(0, 3).join(', ')}`,
        });
        warnings++;
      } else {
        checks.push({
          id: 'mixed-content',
          name: 'Mixed Content',
          category: 'SSL/TLS',
          status: 'passed',
          message: 'No mixed content detected',
          severity: 'info',
        });
        passed++;
      }
    }

    // Basic XSS Check (FREE) - with proper context analysis
    // IMPORTANT: Reflection alone is NOT XSS
    const xssTest = await performSafeXSSTest(targetUrl);
    
    if (xssTest.vulnerable) {
      // ACTUAL VULNERABILITY: Reflection in executable context
      checks.push({
        id: 'basic-xss',
        name: 'XSS Vulnerability',
        category: 'Vulnerabilities',
        status: 'failed',
        message: `Input reflected in executable context (${xssTest.context})`,
        severity: 'high',
        details: xssTest.details,
        findingType: 'vulnerability',
      });
      failed++;
      const screenshot = await captureScreenshot(targetUrl);
      vulnerabilities.push({
        type: 'Cross-Site Scripting (XSS)',
        found: true,
        details: xssTest.details,
        severity: 'high',
        evidence: {
          ...xssTest.evidence,
          screenshot: xssTest.evidence?.screenshot || screenshot,
        },
      });
    } else if (xssTest.reflected) {
      // INFORMATIONAL: Reflection detected but NOT in executable context
      // This is NOT a vulnerability - just informational
      checks.push({
        id: 'basic-xss',
        name: 'Input Reflection',
        category: 'Informational',
        status: 'info', // NOT warning - reflection alone is not exploitable
        message: xssTest.details,
        severity: 'info',
        details: xssTest.context === 'redirect' 
          ? 'Input reflected in redirect response. This is expected behavior and not exploitable.'
          : 'Input reflected but not in an executable context. No XSS vulnerability detected.',
        findingType: 'informational',
      });
      passed++; // Count as neutral/passed - not a security issue
    } else {
      // No reflection detected
      checks.push({
        id: 'basic-xss',
        name: 'XSS Check',
        category: 'Security',
        status: 'passed',
        message: 'No input reflection detected',
        severity: 'info',
      });
      passed++;
    }

    // ==========================================
    // PRO TIER CHECKS
    // ==========================================
    if (isPro) {
      // Content-Security-Policy (PRO) - Best Practice, NOT a vulnerability
      // IMPORTANT: Missing CSP does NOT mean XSS exists
      // CSP is a mitigation layer - its absence alone is not exploitable
      if (sec.contentSecurityPolicy.present) {
        checks.push({
          id: 'header-csp',
          name: 'Content-Security-Policy',
          category: 'Best Practice',
          status: 'passed',
          message: 'CSP header configured (helps mitigate XSS)',
          severity: 'info',
          findingType: 'best_practice',
          proOnly: true,
        });
        passed++;
      } else {
        // NOT a vulnerability - just a best practice recommendation
        checks.push({
          id: 'header-csp',
          name: 'Content-Security-Policy',
          category: 'Best Practice',
          status: 'info', // Changed from 'failed' - absence is not a failure
          message: 'No CSP header detected',
          severity: 'low', // Changed from 'high' - this is NOT a vulnerability
          details: 'CSP helps mitigate XSS but its absence does not indicate an exploitable vulnerability. Consider adding after testing application compatibility.',
          findingType: 'best_practice',
          proOnly: true,
        });
        passed++; // Count as neutral, not failed
        // DO NOT add to vulnerabilities - missing CSP is NOT a vulnerability
      }

      // Referrer-Policy (PRO) - Best practice, not a vulnerability
      // Note: Headers may vary by endpoint on CDN-backed sites
      if (sec.referrerPolicy.present) {
        checks.push({
          id: 'header-rp',
          name: 'Referrer-Policy',
          category: 'Best Practice',
          status: 'passed',
          message: `Referrer control: ${sec.referrerPolicy.value}`,
          severity: 'info',
          proOnly: true,
        });
        passed++;
      } else {
        // Not a vulnerability - just a best practice recommendation
        checks.push({
          id: 'header-rp',
          name: 'Referrer-Policy',
          category: 'Best Practice',
          status: 'info', // Changed from warning - absence is not exploitable
          message: 'Referrer-Policy header not detected on this endpoint',
          severity: 'info', // Changed from low
          details: 'This header may be present on other endpoints. CDNs often set headers dynamically.',
          proOnly: true,
        });
        passed++; // Count as neutral
      }

      // Permissions-Policy (PRO) - Best practice, not a vulnerability
      if (sec.permissionsPolicy.present) {
        checks.push({
          id: 'header-pp',
          name: 'Permissions-Policy',
          category: 'Best Practice',
          status: 'passed',
          message: 'Browser feature permissions configured',
          severity: 'info',
          proOnly: true,
        });
        passed++;
      } else {
        // Not a vulnerability - optional security enhancement
        checks.push({
          id: 'header-pp',
          name: 'Permissions-Policy',
          category: 'Best Practice',
          status: 'info', // Changed from warning
          message: 'Permissions-Policy header not detected',
          severity: 'info', // Changed from low
          details: 'This header restricts browser features. Absence is common and not exploitable.',
          proOnly: true,
        });
        passed++; // Count as neutral
      }

      // Cache-Control (PRO) - Informational only
      const cacheControl = headersResult.raw['cache-control'];
      if (cacheControl) {
        checks.push({
          id: 'cache-control',
          name: 'Cache-Control',
          category: 'Informational',
          status: 'passed',
          message: `Cache policy: ${cacheControl.substring(0, 50)}`,
          severity: 'info',
          proOnly: true,
        });
        passed++;
      } else {
        checks.push({
          id: 'cache-control',
          name: 'Cache-Control',
          category: 'Headers',
          status: 'warning',
          message: 'No cache control header',
          severity: 'low',
          proOnly: true,
        });
        warnings++;
      }

      // Response Compression (PRO) - Detects GZIP, Brotli, Deflate
      // Note: CDNs and HTTP/2 may use implicit compression not visible in headers
      if (hasAnyCompression) {
        const compressionTypes: string[] = [];
        if (hasBrotli) compressionTypes.push('Brotli');
        if (hasGzip) compressionTypes.push('GZIP');
        if (hasDeflate) compressionTypes.push('Deflate');
        
        checks.push({
          id: 'compression',
          name: 'Response Compression',
          category: 'Performance',
          status: 'passed',
          message: `Compression enabled: ${compressionTypes.join(', ')}`,
          severity: 'info',
          proOnly: true,
        });
        passed++;
      } else {
        // Not a warning - compression may be handled by CDN/HTTP2 transparently
        // Many modern sites use HTTP/2 multiplexing which doesn't require explicit compression headers
        checks.push({
          id: 'compression',
          name: 'Response Compression',
          category: 'Performance',
          status: 'info', // Changed from warning - not a security issue
          message: 'No explicit compression header detected (may use HTTP/2 or CDN compression)',
          severity: 'info',
          details: 'Modern CDNs and HTTP/2 connections may compress responses without explicit Content-Encoding headers.',
          proOnly: true,
        });
        passed++; // Count as neutral, not a warning
      }

      // SQL Injection Test (PRO)
      const sqliTest = await performSafeSQLiTest(targetUrl);
      if (sqliTest.vulnerable) {
        checks.push({
          id: 'sqli-test',
          name: 'SQL Injection',
          category: 'Vulnerabilities',
          status: 'failed',
          message: 'SQL error patterns detected!',
          severity: 'critical',
          details: sqliTest.details,
          proOnly: true,
        });
        failed++;
        const screenshot = await captureScreenshot(targetUrl);
        vulnerabilities.push({
          type: 'SQL Injection Risk',
          found: true,
          details: sqliTest.details,
          severity: 'critical',
          evidence: {
            ...sqliTest.evidence,
            screenshot: sqliTest.evidence?.screenshot || screenshot,
          },
        });
      } else {
        checks.push({
          id: 'sqli-test',
          name: 'SQL Injection',
          category: 'Vulnerabilities',
          status: 'passed',
          message: 'No SQL injection patterns detected',
          severity: 'info',
          proOnly: true,
        });
        passed++;
      }

      // Directory Listing (PRO)
      const dirTest = await checkDirectoryListing(targetUrl);
      if (dirTest.found) {
        checks.push({
          id: 'dir-listing',
          name: 'Directory Listing',
          category: 'Vulnerabilities',
          status: 'warning',
          message: 'Directory listing may be enabled',
          severity: 'medium',
          proOnly: true,
        });
        warnings++;
      } else {
        checks.push({
          id: 'dir-listing',
          name: 'Directory Listing',
          category: 'Vulnerabilities',
          status: 'passed',
          message: 'Directory listing appears disabled',
          severity: 'info',
          proOnly: true,
        });
        passed++;
      }

      // Sensitive Files (PRO)
      const sensitiveFiles = await checkSensitiveFiles(targetUrl);
      
      // Only flag ACTUALLY sensitive files (not robots.txt, sitemap.xml)
      if (sensitiveFiles.found && sensitiveFiles.files.length > 0) {
        checks.push({
          id: 'sensitive-files',
          name: 'Sensitive File Exposure',
          category: 'Vulnerabilities',
          status: 'warning',
          message: `Potentially sensitive files exposed: ${sensitiveFiles.files.join(', ')}`,
          severity: 'medium',
          findingType: 'vulnerability',
          proOnly: true,
        });
        warnings++;
      } else {
        checks.push({
          id: 'sensitive-files',
          name: 'Sensitive Files',
          category: 'Security',
          status: 'passed',
          message: 'No sensitive files exposed',
          severity: 'info',
          proOnly: true,
        });
        passed++;
      }
      
      // Public files are INFORMATIONAL only (robots.txt, sitemap.xml)
      if (sensitiveFiles.publicFiles.length > 0) {
        checks.push({
          id: 'public-files',
          name: 'Public Files',
          category: 'Informational',
          status: 'info',
          message: `Standard public files present: ${sensitiveFiles.publicFiles.join(', ')}`,
          details: 'These files are public by design and do not represent a security issue.',
          severity: 'info',
          findingType: 'informational',
          proOnly: true,
        });
        passed++;
      }

      // Cookie Security (PRO) - Best Practice analysis
      // Note: Only session/auth cookies truly need all flags
      const setCookie = headersResult.raw['set-cookie'] || '';
      if (setCookie) {
        const hasSecure = /secure/i.test(setCookie);
        const hasHttpOnly = /httponly/i.test(setCookie);
        const hasSameSite = /samesite/i.test(setCookie);

        if (hasSecure && hasHttpOnly && hasSameSite) {
          checks.push({
            id: 'cookie-security',
            name: 'Cookie Security',
            category: 'Best Practice',
            status: 'passed',
            message: 'Cookies have Secure, HttpOnly, SameSite flags',
            severity: 'info',
            proOnly: true,
          });
          passed++;
        } else {
          const missing = [];
          if (!hasSecure) missing.push('Secure');
          if (!hasHttpOnly) missing.push('HttpOnly');
          if (!hasSameSite) missing.push('SameSite');
          // Best practice, not a vulnerability - we can't determine if it's a session cookie
          checks.push({
            id: 'cookie-security',
            name: 'Cookie Security',
            category: 'Best Practice',
            status: 'info', // Changed from warning - context-dependent
            message: `Cookie flags could be improved: ${missing.join(', ')} not set`,
            severity: 'low', // Changed from medium
            details: 'These flags are recommended for session/auth cookies. Impact depends on cookie purpose.',
            findingType: 'best_practice',
            proOnly: true,
          });
          passed++; // Count as neutral
        }
      }

      // CORS Configuration (PRO)
      const corsHeader = headersResult.raw['access-control-allow-origin'];
      if (corsHeader) {
        if (corsHeader === '*') {
          checks.push({
            id: 'cors-config',
            name: 'CORS Configuration',
            category: 'Headers',
            status: 'warning',
            message: 'CORS allows all origins (*)',
            severity: 'medium',
            proOnly: true,
          });
          warnings++;
        } else {
          checks.push({
            id: 'cors-config',
            name: 'CORS Configuration',
            category: 'Headers',
            status: 'passed',
            message: `CORS restricted to: ${corsHeader.substring(0, 40)}`,
            severity: 'info',
            proOnly: true,
          });
          passed++;
        }
      }

      // CDN Detection (PRO) - already in DNS section but add here for clarity
      if (dnsResult.hasCDN) {
        checks.push({
          id: 'cdn-detection',
          name: 'CDN Detection',
          category: 'Infrastructure',
          status: 'passed',
          message: `Protected by ${dnsResult.cdnProvider}`,
          severity: 'info',
          proOnly: true,
        });
        passed++;
      }
    }

    // ==========================================
    // 4. TECHNOLOGY FINGERPRINTING (PRO)
    // ==========================================
    if (isPro) {
      const detectedTech = detectTechnologies(pageContent, headersResult.raw);
      technologies.push(...detectedTech);

      if (detectedTech.length > 0) {
        // CMS Detection
        const cms = detectedTech.filter(t => t.category === 'CMS');
        if (cms.length > 0) {
          checks.push({
            id: 'cms-detection',
            name: 'CMS Detection',
            category: 'Technology',
            status: 'info',
            message: `CMS detected: ${cms.map(c => c.name).join(', ')}`,
            severity: 'info',
            proOnly: true,
          });
        }

        // Framework Detection
        const frameworks = detectedTech.filter(t => t.category === 'Framework');
        if (frameworks.length > 0) {
          checks.push({
            id: 'framework-detection',
            name: 'Framework Detection',
            category: 'Technology',
            status: 'info',
            message: `Frameworks: ${frameworks.map(f => f.name).join(', ')}`,
            severity: 'info',
            proOnly: true,
          });
        }
      }
    }

    // ==========================================
    // 5. VULNERABILITY TESTS (PRO)
    // ==========================================
    if (isPro) {
      // XSS Check already performed above in FREE tier
      // Only add to checks if not already present (deduplication will handle this)
      
      // SQL Injection Test
      const sqliTest = await performSafeSQLiTest(targetUrl);
      if (sqliTest.vulnerable) {
        checks.push({
          id: 'sqli-test',
          name: 'SQL Injection Risk',
          category: 'Vulnerabilities',
          status: 'failed',
          message: 'SQL error patterns detected!',
          severity: 'critical',
          details: sqliTest.details,
          proOnly: true,
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
          proOnly: true,
        });
        passed++;
      }

      // Directory Listing Check
      const dirTest = await checkDirectoryListing(targetUrl);
      if (dirTest.found) {
        checks.push({
          id: 'dir-listing',
          name: 'Directory Listing',
          category: 'Vulnerabilities',
          status: 'warning',
          message: 'Directory listing may be enabled',
          severity: 'medium',
          proOnly: true,
        });
        warnings++;
      }

      // Sensitive File Exposure Check - already handled above, skip duplicate
      // Note: robots.txt and sitemap.xml are NOT sensitive files
    }

    // ==========================================
    // 6. COOKIE SECURITY (PRO) - Already checked above, skip duplicate
    // ==========================================
    if (isPro && headersResult) {
      // CORS Policy Check
      const corsHeader = headersResult.raw['access-control-allow-origin'];
      if (corsHeader) {
        if (corsHeader === '*') {
          checks.push({
            id: 'cors-policy',
            name: 'CORS Policy',
            category: 'Headers',
            status: 'warning',
            message: 'CORS allows all origins (*) - potential security risk',
            severity: 'medium',
            details: 'Consider restricting to specific origins',
            proOnly: true,
          });
          warnings++;
        } else {
          checks.push({
            id: 'cors-policy',
            name: 'CORS Policy',
            category: 'Headers',
            status: 'passed',
            message: `CORS restricted to: ${corsHeader.substring(0, 50)}`,
            severity: 'info',
            proOnly: true,
          });
          passed++;
        }
      }
    }

    // ==========================================
    // 7. ROBOTS.TXT ANALYSIS (PRO)
    // ==========================================
    let robotsInfo: RobotsInfo | null = null;
    if (isPro) {
      robotsInfo = await analyzeRobotsTxt(targetUrl);
      if (robotsInfo.exists) {
        if (robotsInfo.exposedSensitivePaths.length > 0) {
          // Note: robots.txt is PUBLIC by design - listing paths here is expected behavior
          // This is informational only, not a vulnerability
          checks.push({
            id: 'robots-txt',
            name: 'Robots.txt Analysis',
            category: 'Informational',
            status: 'info',
            message: `robots.txt present with ${robotsInfo.exposedSensitivePaths.length} restricted path(s)`,
            details: `robots.txt is public by design. Restricted paths: ${robotsInfo.exposedSensitivePaths.slice(0, 3).join(', ')}${robotsInfo.exposedSensitivePaths.length > 3 ? '...' : ''}`,
            severity: 'info',
            findingType: 'informational',
            proOnly: true,
          });
          passed++; // Informational, not a warning
        } else {
          checks.push({
            id: 'robots-txt',
            name: 'Robots.txt',
            category: 'Informational',
            status: 'info',
            message: 'robots.txt present (standard configuration)',
            details: 'robots.txt is public by design and does not represent a security issue.',
            severity: 'info',
            findingType: 'informational',
            proOnly: true,
          });
          passed++;
        }
      }
    }

    // ==========================================
    // 8. EMAIL SECURITY DEEP SCAN (PRO)
    // ==========================================
    let emailSecurity: EmailSecurityResult | null = null;
    emailSecurity = await checkEmailSecurityDeep(hostname, isPro);
    
    if (emailSecurity.spf) {
      checks.push({
        id: 'email-spf',
        name: 'SPF Record',
        category: 'Email Security',
        status: 'passed',
        message: 'SPF record configured for email authentication',
        severity: 'info',
      });
      passed++;
    } else {
      checks.push({
        id: 'email-spf',
        name: 'SPF Record',
        category: 'Email Security',
        status: 'warning',
        message: 'No SPF record found - email spoofing risk',
        severity: 'low',
        details: 'Add SPF record to prevent email spoofing',
      });
      warnings++;
    }

    if (emailSecurity.dmarc) {
      checks.push({
        id: 'email-dmarc',
        name: 'DMARC Record',
        category: 'Email Security',
        status: 'passed',
        message: 'DMARC policy configured',
        severity: 'info',
      });
      passed++;
    } else {
      checks.push({
        id: 'email-dmarc',
        name: 'DMARC Record',
        category: 'Email Security',
        status: 'warning',
        message: 'No DMARC record found',
        severity: 'low',
        details: 'Add DMARC to improve email security',
      });
      warnings++;
    }

    // PRO: DKIM & BIMI checks
    if (isPro) {
      if (emailSecurity.dkim) {
        checks.push({
          id: 'email-dkim',
          name: 'DKIM Configuration',
          category: 'Email Security',
          status: 'passed',
          message: 'DKIM selector found - email signatures enabled',
          severity: 'info',
          proOnly: true,
        });
        passed++;
      }

      if (emailSecurity.bimi) {
        checks.push({
          id: 'email-bimi',
          name: 'BIMI Record',
          category: 'Email Security',
          status: 'passed',
          message: 'BIMI configured - brand logo in emails',
          severity: 'info',
          proOnly: true,
        });
        passed++;
      }
    }

    // ==========================================
    // 9. WAF DETECTION (PRO)
    // ==========================================
    if (isPro) {
      const wafDetected = detectWAF(headersResult?.raw || {});
      if (wafDetected.detected) {
        checks.push({
          id: 'waf-detection',
          name: 'Web Application Firewall',
          category: 'Protection',
          status: 'passed',
          message: `Protected by ${wafDetected.provider}`,
          severity: 'info',
          proOnly: true,
        });
        passed++;
      } else {
        checks.push({
          id: 'waf-detection',
          name: 'Web Application Firewall',
          category: 'Protection',
          status: 'info',
          message: 'No WAF detected (or WAF is well-hidden)',
          severity: 'info',
          proOnly: true,
        });
      }
    }

    // ==========================================
    // 10. JAVASCRIPT SECURITY (ULTRA)
    // ==========================================
    if (isUltra) {
      const jsVulns = checkJavaScriptSecurity(pageContent);
      
      if (jsVulns.vulnerableLibraries.length > 0) {
        checks.push({
          id: 'js-vulnerable-libs',
          name: 'Vulnerable JavaScript Libraries',
          category: 'JavaScript Security',
          status: 'failed',
          message: `Found ${jsVulns.vulnerableLibraries.length} potentially vulnerable libraries`,
          severity: 'high',
          details: jsVulns.vulnerableLibraries.join(', '),
          ultraOnly: true,
        });
        failed++;
        vulnerabilities.push({
          type: 'Vulnerable Libraries',
          found: true,
          details: `Libraries: ${jsVulns.vulnerableLibraries.join(', ')}`,
          severity: 'high',
        });
      }

      if (jsVulns.hasInlineScripts) {
        checks.push({
          id: 'js-inline-scripts',
          name: 'Inline Scripts Detection',
          category: 'JavaScript Security',
          status: 'warning',
          message: 'Inline scripts detected - CSP bypass risk',
          severity: 'low',
          details: 'Consider moving scripts to external files',
          ultraOnly: true,
        });
        warnings++;
      }

      if (jsVulns.hasEval) {
        checks.push({
          id: 'js-eval-usage',
          name: 'eval() Usage Detection',
          category: 'JavaScript Security',
          status: 'warning',
          message: 'eval() or similar functions detected',
          severity: 'medium',
          details: 'eval() can be dangerous if used with untrusted input',
          ultraOnly: true,
        });
        warnings++;
      }
    }

    // ==========================================
    // 11. MIXED CONTENT DETECTION (ULTRA)
    // ==========================================
    if (isUltra && isHttps) {
      const mixedContent = checkMixedContent(pageContent);
      if (mixedContent.found) {
        checks.push({
          id: 'mixed-content',
          name: 'Mixed Content Detection',
          category: 'SSL/TLS',
          status: 'warning',
          message: `Found ${mixedContent.count} HTTP resources on HTTPS page`,
          severity: 'medium',
          details: `Resources: ${mixedContent.examples.slice(0, 3).join(', ')}`,
          ultraOnly: true,
        });
        warnings++;
      } else {
        checks.push({
          id: 'mixed-content',
          name: 'Mixed Content Detection',
          category: 'SSL/TLS',
          status: 'passed',
          message: 'No mixed content detected',
          severity: 'info',
          ultraOnly: true,
        });
        passed++;
      }
    }

    // ==========================================
    // 12. THIRD-PARTY RISK ANALYSIS (ULTRA)
    // ==========================================
    if (isUltra) {
      const thirdParty = analyzeThirdPartyScripts(pageContent, hostname);
      if (thirdParty.scripts.length > 0) {
        const riskLevel = thirdParty.highRiskCount > 0 ? 'warning' : 'info';
        checks.push({
          id: 'third-party-scripts',
          name: 'Third-Party Scripts Analysis',
          category: 'Third-Party Risk',
          status: riskLevel,
          message: `${thirdParty.scripts.length} external scripts loaded${thirdParty.highRiskCount > 0 ? ` (${thirdParty.highRiskCount} high-risk)` : ''}`,
          severity: thirdParty.highRiskCount > 0 ? 'medium' : 'info',
          details: `Domains: ${thirdParty.domains.slice(0, 5).join(', ')}`,
          ultraOnly: true,
        });
        if (riskLevel === 'warning') warnings++;
        else passed++;
      }
    }

    // ==========================================
    // 13. HTTPS ENFORCEMENT
    // ==========================================
    if (isHttps) {
      checks.push({
        id: 'https-enforced',
        name: 'HTTPS Enforcement',
        category: 'SSL/TLS',
        status: 'passed',
        message: 'Site is served over HTTPS',
        severity: 'info',
      });
      passed++;
    }

    // Response time is already measured above - no duplicate check needed
    // Total scan duration is tracked separately in scanDuration field
  }

  // ==========================================
  // CALCULATE SCORE & GRADE (weighted scoring system)
  // ==========================================
  // Start with base score of 50 (neutral)
  let rawScore = 50;
  
  // Apply weighted scoring based on check results
  checks.forEach(check => {
    // Skip checks with 'error' or 'info' status - these are informational only
    if (check.status === 'error' || check.status === 'info') {
      return;
    }
    
    const weight = SCORE_WEIGHTS[check.id] || DEFAULT_WEIGHT;
    
    if (check.status === 'passed') {
      rawScore += weight.passed;
    } else if (check.status === 'warning') {
      rawScore += weight.warning;
    } else if (check.status === 'failed') {
      rawScore += weight.failed;
    }
  });
  
  // Bonus points for good security practices
  if (sslResult?.valid && sslResult.daysUntilExpiry > 30) {
    rawScore += 5; // Valid, non-expiring SSL
  }
  if (sslResult?.protocol?.includes('TLSv1.3')) {
    rawScore += 5; // Modern TLS
  }
  if (dnsResult?.hasCDN) {
    rawScore += 3; // CDN protection
  }
  if (headersResult?.security?.contentSecurityPolicy?.present) {
    rawScore += 5; // CSP header present
  }
  if (headersResult?.security?.strictTransportSecurity?.present) {
    rawScore += 3; // HSTS present
  }
  
  // Clamp score to 0-100 range
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  
  // For display, still show total counts (includes additional checks)
  const total = passed + warnings + failed;

  // Determine grade based on score
  let grade: string;
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 45) grade = 'D';
  else grade = 'F';

  // Build evidence only for security-relevant findings (not informational)
  // Note: Only include reproduction steps for actual exploitable vulnerabilities
  const buildEvidence = (proof: string, isExploitable = false): Evidence => ({
    request: {
      method: 'GET',
      url: targetUrl,
      headers: headersResult?.raw || {},
    },
    response: {
      status: 0,
      headers: headersResult?.raw || {},
      bodyPreview: pageContent ? makeBodyPreview(pageContent) : undefined,
    },
    proofOfImpact: proof,
    // Only include reproduction steps for actual vulnerabilities, not config issues
    reproductionSteps: isExploitable ? undefined : undefined, // Removed generic "re-run scan" 
    timestamp: new Date().toISOString(),
  });

  // Only attach evidence to security-relevant findings, not informational ones
  const checksWithEvidence = checks.map((c) => ({
    ...c,
    // Don't attach evidence to informational/config findings
    evidence: shouldShowEvidence(c.id, c.status)
      ? (c.evidence || buildEvidence(c.message || c.details || c.name))
      : undefined,
  }));

  // DEDUPLICATION: Remove duplicate findings with same ID
  // Keep the first occurrence (usually the more specific one)
  const seenCheckIds = new Set<string>();
  const deduplicatedChecks = checksWithEvidence.filter(c => {
    if (seenCheckIds.has(c.id)) {
      return false; // Skip duplicate
    }
    seenCheckIds.add(c.id);
    return true;
  });

  // Only attach evidence to actual vulnerabilities (not informational findings)
  const vulnerabilitiesWithEvidence = vulnerabilities.map((v) => ({
    ...v,
    evidence: v.found ? (v.evidence || buildEvidence(v.details || v.type)) : undefined,
  }));

  // Recalculate summary based on deduplicated checks
  const finalSummary = {
    passed: deduplicatedChecks.filter(c => c.status === 'passed' || c.status === 'info').length,
    warnings: deduplicatedChecks.filter(c => c.status === 'warning').length,
    failed: deduplicatedChecks.filter(c => c.status === 'failed').length,
    total: deduplicatedChecks.length,
  };

  return {
    url: targetUrl,
    timestamp: new Date().toISOString(),
    score,
    grade,
    checks: deduplicatedChecks,
    summary: finalSummary,
    dns: dnsResult,
    ssl: sslResult,
    headers: headersResult,
    server: serverInfo,
    vulnerabilities: vulnerabilitiesWithEvidence,
    scanDuration: Date.now() - startTime,
    technologies,
  };
}

// ==========================================
// DNS CHECKS
// ==========================================
async function performDNSChecks(hostname: string, isPro: boolean): Promise<DNSResult> {
  const result: DNSResult = {
    resolved: false,
    ipAddresses: [],
    ipv6Addresses: [],
    mxRecords: [],
    nsRecords: [],
    txtRecords: [],
    hasCDN: false,
    cdnProvider: null,
    caaRecords: [],
    hasDNSSEC: false,
  };

  try {
    // IPv4
    result.ipAddresses = await new Promise<string[]>((resolve) => {
      dns.resolve4(hostname, (err, addresses) => {
        resolve(err ? [] : addresses);
      });
    });

    // IPv6
    result.ipv6Addresses = await new Promise<string[]>((resolve) => {
      dns.resolve6(hostname, (err, addresses) => {
        resolve(err ? [] : addresses);
      });
    });

    // NS Records
    result.nsRecords = await new Promise<string[]>((resolve) => {
      dns.resolveNs(hostname, (err, records) => {
        resolve(err ? [] : records);
      });
    });

    // MX Records (for email checks)
    result.mxRecords = await new Promise<Array<{ exchange: string; priority: number }>>((resolve) => {
      dns.resolveMx(hostname, (err, records) => {
        resolve(err ? [] : records);
      });
    });

    // TXT Records
    result.txtRecords = await new Promise<string[]>((resolve) => {
      dns.resolveTxt(hostname, (err, records) => {
        resolve(err ? [] : records.map(r => r.join('')));
      });
    });

    // CAA Records
    result.caaRecords = await new Promise<string[]>((resolve) => {
      dns.resolveCaa(hostname, (err, records) => {
        resolve(err ? [] : records.map(r => {
          const record = r as { critical?: number; issue?: string; iodef?: string };
          const tag = record.issue ? 'issue' : record.iodef ? 'iodef' : 'unknown';
          const value = record.issue || record.iodef || '';
          return `${record.critical ? '!' : ''}${tag}=${value}`;
        }));
      });
    });

    result.resolved = result.ipAddresses.length > 0 || result.ipv6Addresses.length > 0;

    // CDN Detection
    const allRecords = [...result.nsRecords].join(' ').toLowerCase();
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

    // Simple DNSSEC check (check if DNSKEY records exist)
    try {
      const dnskeyExists = await new Promise<boolean>((resolve) => {
        dns.resolve(hostname, 'DNSKEY' as any, (err) => {
          resolve(!err);
        });
      });
      result.hasDNSSEC = dnskeyExists;
    } catch {
      result.hasDNSSEC = false;
    }
  } catch (error) {
    console.error('DNS error:', error);
  }

  return result;
}

// ==========================================
// SSL/TLS CHECKS
// ==========================================
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
      selfSigned: false,
      errors: [],
    };

    const socket = tls.connect({
      host: hostname,
      port: 443,
      servername: hostname,
      rejectUnauthorized: false,
    }, () => {
      try {
        const cert = socket.getPeerCertificate();
        const cipher = socket.getCipher();
        const protocol = socket.getProtocol();

        if (cert && Object.keys(cert).length > 0) {
          result.valid = socket.authorized;
          
          // Extract issuer properly (handles both string and object formats)
          let issuer = 'Unknown';
          if (typeof cert.issuer === 'string') {
            // Parse issuer string (e.g., "CN=Let's Encrypt, O=Let's Encrypt")
            issuer = cert.issuer;
          } else if (cert.issuer && typeof cert.issuer === 'object') {
            // Extract from issuer object
            issuer = (cert.issuer as any).O || 
                     (cert.issuer as any).CN || 
                     (cert.issuer as any).organizationName ||
                     'Unknown';
            
            // If still unknown, try to format from all issuer fields
            if (issuer === 'Unknown' && Object.keys(cert.issuer).length > 0) {
              const issuerParts: string[] = [];
              if ((cert.issuer as any).O) issuerParts.push(`O=${(cert.issuer as any).O}`);
              if ((cert.issuer as any).CN) issuerParts.push(`CN=${(cert.issuer as any).CN}`);
              if ((cert.issuer as any).C) issuerParts.push(`C=${(cert.issuer as any).C}`);
              issuer = issuerParts.length > 0 ? issuerParts.join(', ') : 'Unknown';
            }
          }
          
          result.issuer = issuer;
          
          // Extract subject properly
          let subject = 'Unknown';
          if (typeof cert.subject === 'string') {
            subject = cert.subject;
          } else if (cert.subject && typeof cert.subject === 'object') {
            subject = (cert.subject as any).CN || 
                     (cert.subject as any).commonName ||
                     (cert.subject as any).O ||
                     'Unknown';
            
            if (subject === 'Unknown' && Object.keys(cert.subject).length > 0) {
              const subjectParts: string[] = [];
              if ((cert.subject as any).CN) subjectParts.push(`CN=${(cert.subject as any).CN}`);
              if ((cert.subject as any).O) subjectParts.push(`O=${(cert.subject as any).O}`);
              subject = subjectParts.length > 0 ? subjectParts.join(', ') : 'Unknown';
            }
          }
          
          result.subject = subject;
          result.validFrom = cert.valid_from || '';
          result.validTo = cert.valid_to || '';
          result.protocol = protocol || '';
          result.cipher = cipher?.name || '';

          if (cert.valid_to) {
            const expiry = new Date(cert.valid_to);
            result.daysUntilExpiry = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          }

          const issuerStr = JSON.stringify(cert.issuer);
          const subjectStr = JSON.stringify(cert.subject);
          result.selfSigned = issuerStr === subjectStr;

          if (!socket.authorized) {
            const authError = socket.authorizationError;
            result.errors.push(authError instanceof Error ? authError.message : (authError || 'Certificate validation failed'));
          }
        }
      } catch (e) {
        result.errors.push(String(e));
      }
      socket.end();
      resolve(result);
    });

    socket.on('error', (err) => {
      result.errors.push(err.message);
      resolve(result);
    });

    socket.setTimeout(10000, () => {
      result.errors.push('Connection timeout');
      socket.destroy();
      resolve(result);
    });
  });
}

// ==========================================
// HTTP HEADERS CHECK (now also fetches content)
// ==========================================

// Browser-like headers to avoid WAF blocks
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

interface HTTPCheckResult {
  headers: HeadersResult;
  server: ServerInfo;
  content: string;
  success: boolean;
  statusCode?: number;
  error?: string;
}

// Helper function to delay between retries
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Single HTTP request attempt
function makeHTTPRequest(
  targetUrl: string, 
  timeout: number = 20000,
  authConfig?: ScanAuthConfig
): Promise<HTTPCheckResult> {
  return new Promise((resolve) => {
    const url = new URL(targetUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    // Merge browser headers with auth headers
    const requestHeaders: Record<string, string> = {
      ...BROWSER_HEADERS,
      ...(authConfig?.headers || {}),
    };
    
    // Add cookies if provided
    if (authConfig?.cookies) {
      requestHeaders['Cookie'] = authConfig.cookies;
    }

    const req = client.request({
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search || '/',
      method: 'GET',
      timeout: timeout,
      headers: requestHeaders,
      // Allow self-signed certs for scanning purposes
      rejectUnauthorized: false,
    } as any, (res) => {
      let content = '';
      const raw: Record<string, string> = {};
      
      // Handle redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        const redirectUrl = res.headers.location.startsWith('http') 
          ? res.headers.location 
          : `${url.protocol}//${url.host}${res.headers.location}`;
        res.destroy();
        makeHTTPRequest(redirectUrl, timeout - 5000, authConfig).then(resolve);
        return;
      }
      
      if (res.rawHeaders) {
        for (let i = 0; i < res.rawHeaders.length; i += 2) {
          raw[res.rawHeaders[i].toLowerCase()] = res.rawHeaders[i + 1];
        }
      }

      res.on('data', (chunk) => {
        content += chunk.toString();
        if (content.length > 500000) res.destroy(); // Limit to 500KB
      });

      res.on('end', () => {
        const check = (name: string): HeaderCheck => ({
          present: !!raw[name],
          value: raw[name] || null,
          status: raw[name] ? 'passed' : 'failed',
        });

        const technology: string[] = [];
        const headerStr = JSON.stringify(raw).toLowerCase();
        for (const [name, info] of Object.entries(TECH_PATTERNS)) {
          for (const p of info.patterns) {
            if (p.test(headerStr)) {
              technology.push(name);
              break;
            }
          }
        }

        resolve({
          headers: {
            raw,
            security: {
              contentSecurityPolicy: check('content-security-policy'),
              xFrameOptions: check('x-frame-options'),
              xContentTypeOptions: check('x-content-type-options'),
              referrerPolicy: check('referrer-policy'),
              strictTransportSecurity: check('strict-transport-security'),
              xXssProtection: check('x-xss-protection'),
              permissionsPolicy: check('permissions-policy'),
            },
          },
          server: {
            server: raw['server'] || null,
            poweredBy: raw['x-powered-by'] || null,
            technology: [...new Set(technology)],
            serverExposed: !!(raw['server'] && /[\d.]/.test(raw['server'])),
          },
          content,
          success: true,
          statusCode: res.statusCode,
        });
      });
    });

    req.on('error', (err) => {
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
        server: { server: null, poweredBy: null, technology: [], serverExposed: false },
        content: '',
        success: false,
        error: err.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
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
        server: { server: null, poweredBy: null, technology: [], serverExposed: false },
        content: '',
        success: false,
        error: 'Request timeout',
      });
    });

    req.end();
  });
}

// HTTP check with retry logic and exponential backoff
async function performHTTPCheck(
  targetUrl: string, 
  maxRetries: number = 3,
  authConfig?: ScanAuthConfig
): Promise<{ headers: HeadersResult; server: ServerInfo; content: string }> {
  let lastResult: HTTPCheckResult | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Exponential backoff: 0ms, 1000ms, 2000ms
    if (attempt > 0) {
      await wait(1000 * attempt);
    }
    
    // Increase timeout for each retry
    const timeout = 20000 + (attempt * 5000);
    lastResult = await makeHTTPRequest(targetUrl, timeout, authConfig);
    
    if (lastResult.success) {
      return {
        headers: lastResult.headers,
        server: lastResult.server,
        content: lastResult.content,
      };
    }
    
    console.log(`HTTP check attempt ${attempt + 1} failed: ${lastResult.error}`);
  }
  
  // Return last result even if failed
  return {
    headers: lastResult?.headers || {
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
    server: lastResult?.server || { server: null, poweredBy: null, technology: [], serverExposed: false },
    content: lastResult?.content || '',
  };
}

// ==========================================
// TECHNOLOGY DETECTION
// ==========================================
function detectTechnologies(content: string, headers: Record<string, string>): TechnologyInfo[] {
  const detected: TechnologyInfo[] = [];
  const combinedText = content + JSON.stringify(headers).toLowerCase();

  for (const [name, info] of Object.entries(TECH_PATTERNS)) {
    for (const pattern of info.patterns) {
      if (pattern.test(combinedText)) {
        // Try to detect version
        let version: string | undefined;
        const versionMatch = combinedText.match(new RegExp(`${name}[\\/-]?([0-9]+\\.[0-9]+(?:\\.[0-9]+)?)`, 'i'));
        if (versionMatch) {
          version = versionMatch[1];
        }

        detected.push({
          name,
          category: info.category,
          version,
          confidence: version ? 90 : 70,
        });
        break;
      }
    }
  }

  return detected;
}

// ==========================================
// SAFE XSS TEST (with proper context analysis)
// ==========================================
// IMPORTANT: Reflection alone is NOT XSS. We must check:
// 1. Response is NOT a redirect (301, 302, 303, 307, 308)
// 2. Reflection is in an executable context (script tag, event handler)
// 3. Input is not properly encoded
interface XSSTestResult {
  vulnerable: boolean;
  reflected: boolean;  // Separate: reflection detected but may not be exploitable
  details: string;
  context?: 'redirect' | 'script' | 'attribute' | 'body' | 'safe';
  evidence?: Evidence;
}

async function performSafeXSSTest(targetUrl: string): Promise<XSSTestResult> {
  return new Promise((resolve) => {
    const testId = 'shieldscan' + Date.now();
    const url = new URL(targetUrl);
    url.searchParams.set('q', testId);

    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request({
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      timeout: 15000,
      headers: {
        ...BROWSER_HEADERS,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      rejectUnauthorized: false,
    } as any, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk.toString();
        if (body.length > 100000) res.destroy();
      });
      res.on('end', () => {
        const statusCode = res.statusCode || 0;
        const found = body.includes(testId);
        const headers: Record<string, string> = {};
        Object.entries(res.headers).forEach(([k, v]) => {
          headers[k] = Array.isArray(v) ? v.join(', ') : v ? String(v) : '';
        });

        // RULE 1: Redirects are NEVER XSS - input in redirect response is safe
        const isRedirect = statusCode >= 300 && statusCode < 400;
        if (isRedirect) {
          resolve({
            vulnerable: false,
            reflected: found,
            details: found 
              ? `Input reflected in ${statusCode} redirect response (non-executable, safe)`
              : 'No reflection detected',
            context: 'redirect',
            // No evidence needed for safe findings
          });
          return;
        }

        // RULE 2: Check reflection context
        let context: 'script' | 'attribute' | 'body' | 'safe' = 'safe';
        let isVulnerable = false;
        let contextDetails = '';

        if (found) {
          // Check if reflected in <script> tag (HIGH RISK)
          const scriptPattern = new RegExp(`<script[^>]*>[^<]*${testId}[^<]*</script>`, 'i');
          const inScript = scriptPattern.test(body);
          
          // Check if reflected in event handler (HIGH RISK)
          const eventPattern = new RegExp(`on\\w+\\s*=\\s*["'][^"']*${testId}`, 'i');
          const inEventHandler = eventPattern.test(body);
          
          // Check if reflected in href/src with javascript: (HIGH RISK)
          const jsUrlPattern = new RegExp(`(href|src)\\s*=\\s*["']javascript:[^"']*${testId}`, 'i');
          const inJsUrl = jsUrlPattern.test(body);

          // Check if reflected in HTML attribute (LOWER RISK - usually encoded)
          const attrPattern = new RegExp(`\\w+\\s*=\\s*["'][^"']*${testId}[^"']*["']`, 'i');
          const inAttribute = attrPattern.test(body);

          if (inScript || inEventHandler || inJsUrl) {
            context = 'script';
            isVulnerable = true;
            contextDetails = inScript ? 'inside <script> tag' : 
                            inEventHandler ? 'in event handler' : 
                            'in javascript: URL';
          } else if (inAttribute) {
            context = 'attribute';
            // Attribute reflection is low risk if properly encoded
            // Check if HTML entities are used
            const encoded = body.includes('&lt;') || body.includes('&gt;') || body.includes('&quot;');
            isVulnerable = false; // Attribute reflection alone is not exploitable
            contextDetails = encoded ? 'in attribute (properly encoded)' : 'in attribute (context-dependent)';
          } else {
            context = 'body';
            // Body text reflection is usually safe
            isVulnerable = false;
            contextDetails = 'in body text (non-executable context)';
          }
        }

        // Only create evidence for actual vulnerabilities
        const evidence: Evidence | undefined = (found && isVulnerable)
          ? {
              request: { method: 'GET', url: url.toString(), headers },
              response: { status: statusCode, headers, bodyPreview: makeBodyPreview(body) },
              proofOfImpact: `Test string reflected ${contextDetails} - potential XSS`,
              reproductionSteps: [
                `Navigate to: ${url.toString()}`,
                `Observe input reflected ${contextDetails}`,
                'Verify if payload execution is possible in this context',
              ],
              timestamp: new Date().toISOString(),
            }
          : undefined;

        resolve({
          vulnerable: isVulnerable,
          reflected: found,
          details: !found ? 'No reflection detected' :
                   isVulnerable ? `Input reflected ${contextDetails}` :
                   `Input reflected ${contextDetails} (not exploitable)`,
          context,
          evidence,
        });
      });
    });

    req.on('error', () => resolve({ vulnerable: false, reflected: false, details: 'Test could not complete', context: 'safe' }));
    req.on('timeout', () => { req.destroy(); resolve({ vulnerable: false, reflected: false, details: 'Test timed out', context: 'safe' }); });
    req.end();
  });
}

// ==========================================
// SAFE SQL INJECTION TEST
// ==========================================
async function performSafeSQLiTest(targetUrl: string): Promise<{ vulnerable: boolean; details: string; evidence?: Evidence }> {
  return new Promise((resolve) => {
    const url = new URL(targetUrl);
    url.searchParams.set('id', "1'");

    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request({
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      timeout: 15000,
      headers: {
        ...BROWSER_HEADERS,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      rejectUnauthorized: false,
    } as any, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk.toString();
        if (body.length > 100000) res.destroy();
      });
      res.on('end', () => {
        const patterns = [
          /sql syntax/i, /mysql/i, /sqlite/i, /postgresql/i, /oracle/i,
          /ORA-\d{5}/i, /syntax error/i, /unclosed quotation/i,
        ];
        let found = false;
        let match = '';
        for (const p of patterns) {
          if (p.test(body)) {
            found = true;
            match = p.source;
            break;
          }
        }
        const headers: Record<string, string> = {};
        Object.entries(res.headers).forEach(([k, v]) => {
          headers[k] = Array.isArray(v) ? v.join(', ') : v ? String(v) : '';
        });
        const evidence: Evidence | undefined = found
          ? {
              request: { method: 'GET', url: url.toString(), headers },
              response: { status: res.statusCode || 0, headers, bodyPreview: makeBodyPreview(body) },
              proofOfImpact: `Pattern matched: ${match}`,
              reproductionSteps: [
                `Open ${url.toString()}`,
                'Check response for database error messages indicating SQL injection risk',
              ],
              timestamp: new Date().toISOString(),
            }
          : undefined;

        resolve({
          vulnerable: found,
          details: found ? 'SQL error message detected in response' : 'No SQL errors detected',
          evidence,
        });
      });
    });

    req.on('error', () => resolve({ vulnerable: false, details: 'Test could not complete' }));
    req.on('timeout', () => { req.destroy(); resolve({ vulnerable: false, details: 'Test timed out' }); });
    req.end();
  });
}

// ==========================================
// DIRECTORY LISTING CHECK
// ==========================================
async function checkDirectoryListing(targetUrl: string): Promise<{ found: boolean }> {
  return new Promise((resolve) => {
    const url = new URL(targetUrl);
    const testPaths = ['/images/', '/assets/', '/uploads/', '/static/'];
    
    url.pathname = testPaths[0];
    
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request({
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      timeout: 10000,
      headers: BROWSER_HEADERS,
      rejectUnauthorized: false,
    } as any, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk.toString();
        if (body.length > 50000) res.destroy();
      });
      res.on('end', () => {
        const found = /index of|directory listing|parent directory/i.test(body);
        resolve({ found });
      });
    });

    req.on('error', () => resolve({ found: false }));
    req.on('timeout', () => { req.destroy(); resolve({ found: false }); });
    req.end();
  });
}

// ==========================================
// SENSITIVE FILES CHECK
// ==========================================
// IMPORTANT: robots.txt and sitemap.xml are NOT sensitive - they are public by design
// Only check for actually sensitive files that should NOT be exposed
async function checkSensitiveFiles(targetUrl: string): Promise<{ found: boolean; files: string[]; publicFiles: string[] }> {
  const sensitiveFound: string[] = [];
  const publicFound: string[] = []; // Public files (informational only)
  const url = new URL(targetUrl);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;

  // Public files - informational only, NOT sensitive
  const publicFiles = ['/robots.txt', '/sitemap.xml'];
  
  // Actually sensitive files that should NOT be exposed
  const sensitiveFiles = [
    '/.env', '/.git/config', '/config.php', '/wp-config.php',
    '/database.sql', '/.htaccess', '/backup.zip', '/dump.sql',
    '/phpinfo.php', '/server-status', '/.svn/entries',
  ];

  // Check public files (informational)
  for (const file of publicFiles) {
    try {
      const exists = await new Promise<boolean>((resolve) => {
        const req = client.request({
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: file,
          method: 'HEAD',
          timeout: 5000,
          headers: BROWSER_HEADERS,
          rejectUnauthorized: false,
        } as any, (res) => {
          resolve(res.statusCode === 200);
          res.destroy();
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.end();
      });
      if (exists) publicFound.push(file);
    } catch {
      // Ignore
    }
  }

  // Check actually sensitive files
  for (const file of sensitiveFiles) {
    try {
      const exists = await new Promise<boolean>((resolve) => {
        const req = client.request({
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: file,
          method: 'HEAD',
          timeout: 5000,
          headers: BROWSER_HEADERS,
          rejectUnauthorized: false,
        } as any, (res) => {
          resolve(res.statusCode === 200);
          res.destroy();
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.end();
      });
      if (exists) sensitiveFound.push(file);
    } catch {
      // Ignore
    }
  }

  return { 
    found: sensitiveFound.length > 0, 
    files: sensitiveFound,
    publicFiles: publicFound,
  };
}

// ==========================================
// ROBOTS.TXT ANALYSIS
// ==========================================
async function analyzeRobotsTxt(targetUrl: string): Promise<RobotsInfo> {
  const result: RobotsInfo = {
    exists: false,
    disallowedPaths: [],
    sitemaps: [],
    exposedSensitivePaths: [],
  };

  const sensitivePathPatterns = [
    /admin/i, /login/i, /wp-admin/i, /backup/i, /config/i,
    /database/i, /private/i, /secret/i, /\.git/i, /\.env/i,
    /api/i, /internal/i, /staging/i, /test/i, /dev/i,
  ];

  return new Promise((resolve) => {
    const url = new URL(targetUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request({
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: '/robots.txt',
      method: 'GET',
      timeout: 10000,
      headers: BROWSER_HEADERS,
      rejectUnauthorized: false,
    } as any, (res) => {
      if (res.statusCode !== 200) {
        resolve(result);
        return;
      }

      result.exists = true;
      let content = '';
      res.on('data', (chunk) => { content += chunk.toString(); });
      res.on('end', () => {
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim().toLowerCase();
          
          if (trimmed.startsWith('disallow:')) {
            const path = line.substring(9).trim();
            if (path) {
              result.disallowedPaths.push(path);
              for (const pattern of sensitivePathPatterns) {
                if (pattern.test(path)) {
                  result.exposedSensitivePaths.push(path);
                  break;
                }
              }
            }
          }
          
          if (trimmed.startsWith('sitemap:')) {
            result.sitemaps.push(line.substring(8).trim());
          }
        }
        resolve(result);
      });
    });

    req.on('error', () => resolve(result));
    req.on('timeout', () => { req.destroy(); resolve(result); });
    req.end();
  });
}

// ==========================================
// EMAIL SECURITY DEEP CHECK
// ==========================================
async function checkEmailSecurityDeep(hostname: string, isPro: boolean): Promise<EmailSecurityResult> {
  const result: EmailSecurityResult = {
    spf: false,
    dmarc: false,
    dkim: false,
    bimi: false,
    mxRecords: [],
  };

  // MX Records
  result.mxRecords = await new Promise<Array<{ exchange: string; priority: number }>>((resolve) => {
    dns.resolveMx(hostname, (err, records) => {
      resolve(err ? [] : records);
    });
  });

  // SPF Record
  try {
    const txtRecords = await new Promise<string[][]>((resolve) => {
      dns.resolveTxt(hostname, (err, records) => {
        resolve(err ? [] : records);
      });
    });
    
    for (const record of txtRecords) {
      const txt = record.join('');
      if (txt.includes('v=spf1')) {
        result.spf = true;
        result.spfRecord = txt;
        break;
      }
    }
  } catch {
    // Ignore
  }

  // DMARC Record
  try {
    const dmarcRecords = await new Promise<string[][]>((resolve) => {
      dns.resolveTxt(`_dmarc.${hostname}`, (err, records) => {
        resolve(err ? [] : records);
      });
    });
    
    for (const record of dmarcRecords) {
      const txt = record.join('');
      if (txt.includes('v=DMARC1')) {
        result.dmarc = true;
        result.dmarcRecord = txt;
        break;
      }
    }
  } catch {
    // Ignore
  }

  // PRO: DKIM Check (try common selectors)
  if (isPro) {
    const dkimSelectors = ['default', 'google', 'selector1', 'selector2', 'k1'];
    for (const selector of dkimSelectors) {
      try {
        const dkimRecords = await new Promise<string[][]>((resolve) => {
          dns.resolveTxt(`${selector}._domainkey.${hostname}`, (err, records) => {
            resolve(err ? [] : records);
          });
        });
        
        if (dkimRecords.length > 0) {
          result.dkim = true;
          break;
        }
      } catch {
        // Ignore
      }
    }

    // BIMI Record
    try {
      const bimiRecords = await new Promise<string[][]>((resolve) => {
        dns.resolveTxt(`default._bimi.${hostname}`, (err, records) => {
          resolve(err ? [] : records);
        });
      });
      
      result.bimi = bimiRecords.length > 0;
    } catch {
      // Ignore
    }
  }

  return result;
}

// ==========================================
// WAF DETECTION
// ==========================================
const WAF_SIGNATURES: Record<string, RegExp[]> = {
  'Cloudflare': [/cloudflare/i, /cf-ray/i, /__cfduid/i],
  'AWS WAF': [/awswaf/i, /x-amzn-requestid/i],
  'Akamai': [/akamai/i, /x-akamai/i],
  'Imperva': [/imperva/i, /incapsula/i, /visid_incap/i],
  'Sucuri': [/sucuri/i, /x-sucuri/i],
  'ModSecurity': [/mod_security/i, /modsecurity/i],
  'F5 BIG-IP': [/bigip/i, /f5/i],
  'Barracuda': [/barracuda/i],
  'Fortinet': [/fortigate/i, /fortiweb/i],
  'Wordfence': [/wordfence/i],
};

function detectWAF(headers: Record<string, string>): { detected: boolean; provider: string | null } {
  const headerStr = JSON.stringify(headers).toLowerCase();
  
  for (const [provider, patterns] of Object.entries(WAF_SIGNATURES)) {
    for (const pattern of patterns) {
      if (pattern.test(headerStr)) {
        return { detected: true, provider };
      }
    }
  }
  
  if (headers['x-protected-by'] || headers['x-waf-status'] || headers['x-firewall']) {
    return { detected: true, provider: 'Generic WAF' };
  }
  
  return { detected: false, provider: null };
}

// ==========================================
// JAVASCRIPT SECURITY CHECK
// ==========================================
function checkJavaScriptSecurity(content: string): { vulnerableLibraries: string[]; hasInlineScripts: boolean; hasEval: boolean } {
  const result = {
    vulnerableLibraries: [] as string[],
    hasInlineScripts: false,
    hasEval: false,
  };

  // Check for inline scripts
  result.hasInlineScripts = /<script(?![^>]*src=)[^>]*>/i.test(content);

  // Check for eval usage
  result.hasEval = /\beval\s*\(|\bnew\s+Function\s*\(|setTimeout\s*\(\s*["']/i.test(content);

  // Check for vulnerable libraries
  for (const [name, info] of Object.entries(VULNERABLE_LIBRARIES)) {
    if (info.pattern.test(content)) {
      result.vulnerableLibraries.push(name);
    }
  }

  return result;
}

// ==========================================
// MIXED CONTENT DETECTION
// ==========================================
function checkMixedContent(content: string): { found: boolean; count: number; examples: string[] } {
  const httpResources: string[] = [];
  
  // Match http:// URLs in src, href, url() etc.
  const patterns = [
    /src\s*=\s*["']?(http:\/\/[^"'\s>]+)/gi,
    /href\s*=\s*["']?(http:\/\/[^"'\s>]+)/gi,
    /url\s*\(\s*["']?(http:\/\/[^"'\s)]+)/gi,
  ];

  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && !httpResources.includes(match[1])) {
        httpResources.push(match[1]);
      }
    }
  }

  return {
    found: httpResources.length > 0,
    count: httpResources.length,
    examples: httpResources.slice(0, 5),
  };
}

// ==========================================
// THIRD-PARTY SCRIPT ANALYSIS
// ==========================================
function analyzeThirdPartyScripts(content: string, ownHostname: string): { scripts: string[]; domains: string[]; highRiskCount: number } {
  const scripts: string[] = [];
  const domains = new Set<string>();
  let highRiskCount = 0;

  const highRiskDomains = [
    /cdn\.jsdelivr/i, /unpkg\.com/i, /cdnjs\.cloudflare/i, // CDNs (potential supply chain risk)
  ];

  const scriptPattern = /src\s*=\s*["']?(https?:\/\/[^"'\s>]+\.js[^"'\s>]*)/gi;
  const matches = content.matchAll(scriptPattern);

  for (const match of matches) {
    const url = match[1];
    if (!url) continue;

    try {
      const scriptUrl = new URL(url);
      if (scriptUrl.hostname !== ownHostname) {
        scripts.push(url);
        domains.add(scriptUrl.hostname);

        for (const riskPattern of highRiskDomains) {
          if (riskPattern.test(url)) {
            highRiskCount++;
            break;
          }
        }
      }
    } catch {
      // Invalid URL
    }
  }

  return {
    scripts,
    domains: Array.from(domains),
    highRiskCount,
  };
}
