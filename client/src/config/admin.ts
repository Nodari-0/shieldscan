// Admin configuration
// Admins have unlimited access to all features regardless of plan
// Admin emails are loaded from environment variable for security

// Default admin emails (fallback when env variable is not set)
const DEFAULT_ADMIN_EMAILS = [
  'nodarirusishvililinkedin@gmail.com',
];

/**
 * Get admin emails from environment variable
 * Format: NEXT_PUBLIC_ADMIN_EMAILS="email1@example.com,email2@example.com"
 */
function getAdminEmails(): string[] {
  const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  
  if (!adminEmailsEnv) {
    // Use default admin emails as fallback
    return DEFAULT_ADMIN_EMAILS.map(email => email.toLowerCase());
  }
  
  return adminEmailsEnv
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);
}

export const ADMIN_EMAILS: string[] = getAdminEmails();

// Check if a user is an admin
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some(adminEmail => 
    adminEmail.toLowerCase() === email.toLowerCase()
  );
}

// Plan feature access control
export interface PlanFeatures {
  // Free features
  basicVulnerabilityScan: boolean;
  sslCertificateChecks: boolean;
  dnsResolution: boolean;
  
  // Pro features
  securityHeadersAnalysis: boolean;
  xssInjectionTesting: boolean;
  sqlInjectionTesting: boolean;
  cmsDetection: boolean;
  subdomainEnumeration: boolean;
  robotsAnalysis: boolean;
  technologyFingerprinting: boolean;
  cookieSecurityAudit: boolean;
  corsAnalysis: boolean;
  emailSecurityDeep: boolean;  // DKIM, BIMI
  
  // Ultra features
  openPortsCheck: boolean;
  dnssecValidation: boolean;
  javascriptSecurity: boolean;
  thirdPartyRiskAnalysis: boolean;
  mixedContentDetection: boolean;
  performanceAnalysis: boolean;
  wafDetection: boolean;
}

// Get features available for each plan
export function getPlanFeatures(plan: 'free' | 'pro' | 'ultra', isAdminUser: boolean = false): PlanFeatures {
  // Admins get all features
  if (isAdminUser) {
    return {
      basicVulnerabilityScan: true,
      sslCertificateChecks: true,
      dnsResolution: true,
      securityHeadersAnalysis: true,
      xssInjectionTesting: true,
      sqlInjectionTesting: true,
      cmsDetection: true,
      subdomainEnumeration: true,
      robotsAnalysis: true,
      technologyFingerprinting: true,
      cookieSecurityAudit: true,
      corsAnalysis: true,
      emailSecurityDeep: true,
      openPortsCheck: true,
      dnssecValidation: true,
      javascriptSecurity: true,
      thirdPartyRiskAnalysis: true,
      mixedContentDetection: true,
      performanceAnalysis: true,
      wafDetection: true,
    };
  }

  const baseFeatures: PlanFeatures = {
    basicVulnerabilityScan: true,
    sslCertificateChecks: true,
    dnsResolution: true,
    securityHeadersAnalysis: false,
    xssInjectionTesting: false,
    sqlInjectionTesting: false,
    cmsDetection: false,
    subdomainEnumeration: false,
    robotsAnalysis: false,
    technologyFingerprinting: false,
    cookieSecurityAudit: false,
    corsAnalysis: false,
    emailSecurityDeep: false,
    openPortsCheck: false,
    dnssecValidation: false,
    javascriptSecurity: false,
    thirdPartyRiskAnalysis: false,
    mixedContentDetection: false,
    performanceAnalysis: false,
    wafDetection: false,
  };

  if (plan === 'free') {
    return baseFeatures;
  }

  if (plan === 'pro') {
    return {
      ...baseFeatures,
      securityHeadersAnalysis: true,
      xssInjectionTesting: true,
      sqlInjectionTesting: true,
      cmsDetection: true,
      subdomainEnumeration: true,
      robotsAnalysis: true,
      technologyFingerprinting: true,
      cookieSecurityAudit: true,
      corsAnalysis: true,
      emailSecurityDeep: true,
      wafDetection: true,
    };
  }

  // Ultra - all features
  return {
    basicVulnerabilityScan: true,
    sslCertificateChecks: true,
    dnsResolution: true,
    securityHeadersAnalysis: true,
    xssInjectionTesting: true,
    sqlInjectionTesting: true,
    cmsDetection: true,
    subdomainEnumeration: true,
    robotsAnalysis: true,
    technologyFingerprinting: true,
    cookieSecurityAudit: true,
    corsAnalysis: true,
    emailSecurityDeep: true,
    openPortsCheck: true,
    dnssecValidation: true,
    javascriptSecurity: true,
    thirdPartyRiskAnalysis: true,
    mixedContentDetection: true,
    performanceAnalysis: true,
    wafDetection: true,
  };
}

// Feature labels for UI
export const FEATURE_LABELS: Record<keyof PlanFeatures, { name: string; description: string; tier: 'free' | 'pro' | 'ultra' }> = {
  basicVulnerabilityScan: { name: 'Basic Vulnerability Scan', description: 'Core security analysis', tier: 'free' },
  sslCertificateChecks: { name: 'SSL Certificate Checks', description: 'Validate HTTPS security', tier: 'free' },
  dnsResolution: { name: 'DNS Resolution', description: 'Domain and IP analysis', tier: 'free' },
  securityHeadersAnalysis: { name: 'Security Headers', description: 'CSP, HSTS, X-Frame-Options', tier: 'pro' },
  xssInjectionTesting: { name: 'XSS Testing', description: 'Cross-site scripting detection', tier: 'pro' },
  sqlInjectionTesting: { name: 'SQL Injection Testing', description: 'Database attack detection', tier: 'pro' },
  cmsDetection: { name: 'CMS Detection', description: 'WordPress, Drupal, Joomla', tier: 'pro' },
  subdomainEnumeration: { name: 'Subdomain Enumeration', description: 'Find exposed subdomains', tier: 'pro' },
  robotsAnalysis: { name: 'Robots.txt Analysis', description: 'Exposed paths detection', tier: 'pro' },
  technologyFingerprinting: { name: 'Technology Detection', description: 'Framework & library detection', tier: 'pro' },
  cookieSecurityAudit: { name: 'Cookie Security', description: 'Cookie flags analysis', tier: 'pro' },
  corsAnalysis: { name: 'CORS Analysis', description: 'Cross-origin policy check', tier: 'pro' },
  emailSecurityDeep: { name: 'Email Security Deep Scan', description: 'DKIM, BIMI verification', tier: 'pro' },
  openPortsCheck: { name: 'Open Ports Check', description: 'Exposed services detection', tier: 'ultra' },
  dnssecValidation: { name: 'DNSSEC Validation', description: 'DNS security extensions', tier: 'ultra' },
  javascriptSecurity: { name: 'JavaScript Security', description: 'Vulnerable libraries detection', tier: 'ultra' },
  thirdPartyRiskAnalysis: { name: 'Third-Party Risk', description: 'External script analysis', tier: 'ultra' },
  mixedContentDetection: { name: 'Mixed Content Detection', description: 'HTTP on HTTPS pages', tier: 'ultra' },
  performanceAnalysis: { name: 'Performance Analysis', description: 'Response time metrics', tier: 'ultra' },
  wafDetection: { name: 'WAF Detection', description: 'Firewall identification', tier: 'pro' },
};

