/**
 * Security Checks Configuration by Plan Tier
 * Defines which security checks are available for each subscription plan
 */

import { LucideIcon } from 'lucide-react';
import { 
  Lock, Shield, Globe, Server, Code, FileSearch, 
  Mail, Network, Eye, Cookie, AlertTriangle, CheckCircle,
  Wifi, Database, Key, FileText, Zap, Bug, Crown,
  Fingerprint, Radio, Search, Activity, Cloud, Gauge
} from 'lucide-react';

export type PlanTier = 'essential' | 'cloud' | 'pro' | 'enterprise';
// Legacy plan tier mapping for backwards compatibility
export type LegacyPlanTier = 'free' | 'pro' | 'business' | 'enterprise';

export interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  category: 'ssl' | 'headers' | 'dns' | 'vulnerabilities' | 'performance' | 'compliance';
  tier: PlanTier;
  icon: LucideIcon;
  estimatedTime: string; // e.g., "2s", "5s"
}

// Plan tier colors
export const TIER_COLORS = {
  essential: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  cloud: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  pro: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  enterprise: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
};

// Category info
export const CATEGORIES = [
  { id: 'ssl', name: 'SSL/TLS', color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' },
  { id: 'headers', name: 'Security Headers', color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  { id: 'dns', name: 'DNS Security', color: 'text-purple-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
  { id: 'vulnerabilities', name: 'Vulnerabilities', color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
  { id: 'performance', name: 'Performance', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20' },
  { id: 'compliance', name: 'Compliance', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
];

// All security checks with their tier requirements
export const ALL_SECURITY_CHECKS: SecurityCheck[] = [
  // ============ FREE TIER (10 checks) ============
  // SSL/TLS - Free
  { id: 'ssl-valid', name: 'SSL Certificate Validity', description: 'Verify SSL certificate is valid and trusted', category: 'ssl', tier: 'essential', icon: Lock, estimatedTime: '2s' },
  { id: 'ssl-expiry', name: 'Certificate Expiration', description: 'Check when SSL certificate expires', category: 'ssl', tier: 'essential', icon: Lock, estimatedTime: '1s' },
  { id: 'https-redirect', name: 'HTTPS Redirect', description: 'Verify HTTP redirects to HTTPS', category: 'ssl', tier: 'essential', icon: Shield, estimatedTime: '2s' },
  
  // Headers - Free
  { id: 'hsts', name: 'HSTS Header', description: 'Check for HTTP Strict Transport Security', category: 'headers', tier: 'essential', icon: Shield, estimatedTime: '1s' },
  { id: 'x-frame', name: 'X-Frame-Options', description: 'Prevent clickjacking attacks', category: 'headers', tier: 'essential', icon: Globe, estimatedTime: '1s' },
  { id: 'x-content-type', name: 'X-Content-Type-Options', description: 'Prevent MIME type sniffing', category: 'headers', tier: 'essential', icon: FileText, estimatedTime: '1s' },
  
  // DNS - Free
  { id: 'dns-resolve', name: 'DNS Resolution', description: 'Verify domain resolves correctly', category: 'dns', tier: 'essential', icon: Network, estimatedTime: '2s' },
  
  // Vulnerabilities - Free
  { id: 'basic-xss', name: 'Basic XSS Check', description: 'Basic cross-site scripting detection', category: 'vulnerabilities', tier: 'essential', icon: Bug, estimatedTime: '3s' },
  
  // Performance - Free
  { id: 'response-time', name: 'Response Time', description: 'Measure server response time', category: 'performance', tier: 'essential', icon: Zap, estimatedTime: '2s' },
  { id: 'mixed-content', name: 'Mixed Content', description: 'Detect insecure content on HTTPS pages', category: 'performance', tier: 'essential', icon: AlertTriangle, estimatedTime: '3s' },

  // ============ PRO TIER (20 additional checks = 30 total) ============
  // SSL/TLS - Pro
  { id: 'tls-version', name: 'TLS Version Analysis', description: 'Check supported TLS versions (1.2, 1.3)', category: 'ssl', tier: 'pro', icon: Lock, estimatedTime: '3s' },
  { id: 'cipher-strength', name: 'Cipher Suite Strength', description: 'Analyze encryption cipher security', category: 'ssl', tier: 'pro', icon: Key, estimatedTime: '4s' },
  { id: 'cert-chain', name: 'Certificate Chain', description: 'Validate full certificate chain', category: 'ssl', tier: 'pro', icon: Network, estimatedTime: '3s' },
  { id: 'ssl-grade', name: 'SSL Labs Grade', description: 'SSL/TLS configuration grade (A+ to F)', category: 'ssl', tier: 'pro', icon: CheckCircle, estimatedTime: '5s' },
  
  // Headers - Pro
  { id: 'csp', name: 'Content-Security-Policy', description: 'Analyze CSP header configuration', category: 'headers', tier: 'pro', icon: Shield, estimatedTime: '2s' },
  { id: 'referrer-policy', name: 'Referrer-Policy', description: 'Check referrer information leakage', category: 'headers', tier: 'pro', icon: Eye, estimatedTime: '1s' },
  { id: 'permissions-policy', name: 'Permissions-Policy', description: 'Browser feature permissions', category: 'headers', tier: 'pro', icon: Key, estimatedTime: '1s' },
  { id: 'cache-control', name: 'Cache-Control', description: 'Caching header analysis', category: 'headers', tier: 'pro', icon: Database, estimatedTime: '1s' },
  
  // DNS - Pro
  { id: 'spf', name: 'SPF Record', description: 'Email sender verification policy', category: 'dns', tier: 'pro', icon: Mail, estimatedTime: '2s' },
  { id: 'dmarc', name: 'DMARC Record', description: 'Email authentication policy', category: 'dns', tier: 'pro', icon: Shield, estimatedTime: '2s' },
  { id: 'dkim', name: 'DKIM Record', description: 'Email digital signature', category: 'dns', tier: 'pro', icon: Key, estimatedTime: '2s' },
  { id: 'cdn-detection', name: 'CDN Detection', description: 'Identify content delivery network', category: 'dns', tier: 'pro', icon: Wifi, estimatedTime: '2s' },
  
  // Vulnerabilities - Pro
  { id: 'sql-injection', name: 'SQL Injection', description: 'Database injection vulnerability scan', category: 'vulnerabilities', tier: 'pro', icon: Database, estimatedTime: '5s' },
  { id: 'directory-listing', name: 'Directory Listing', description: 'Check for exposed directories', category: 'vulnerabilities', tier: 'pro', icon: FileSearch, estimatedTime: '4s' },
  { id: 'sensitive-files', name: 'Sensitive Files', description: 'Detect exposed sensitive files', category: 'vulnerabilities', tier: 'pro', icon: FileText, estimatedTime: '5s' },
  { id: 'cookie-security', name: 'Cookie Security', description: 'Analyze cookie security flags', category: 'vulnerabilities', tier: 'pro', icon: Cookie, estimatedTime: '2s' },
  { id: 'cors-config', name: 'CORS Configuration', description: 'Cross-origin resource sharing analysis', category: 'vulnerabilities', tier: 'pro', icon: Globe, estimatedTime: '2s' },
  
  // Performance - Pro
  { id: 'gzip', name: 'GZIP Compression', description: 'Check if compression is enabled', category: 'performance', tier: 'pro', icon: Gauge, estimatedTime: '2s' },
  { id: 'resource-hints', name: 'Resource Hints', description: 'Preload/prefetch optimization', category: 'performance', tier: 'pro', icon: Zap, estimatedTime: '2s' },
  { id: 'http2', name: 'HTTP/2 Support', description: 'Modern HTTP protocol support', category: 'performance', tier: 'pro', icon: Activity, estimatedTime: '2s' },

  // ============ BUSINESS TIER (20 additional checks = 50 total) ============
  // SSL/TLS - Business
  { id: 'ocsp', name: 'OCSP Stapling', description: 'Certificate revocation check optimization', category: 'ssl', tier: 'cloud', icon: CheckCircle, estimatedTime: '3s' },
  { id: 'ct-logs', name: 'CT Log Presence', description: 'Certificate Transparency verification', category: 'ssl', tier: 'cloud', icon: Search, estimatedTime: '3s' },
  
  // Headers - Business
  { id: 'csp-report', name: 'CSP Report-Only', description: 'CSP violation reporting setup', category: 'headers', tier: 'cloud', icon: AlertTriangle, estimatedTime: '2s' },
  { id: 'corp', name: 'Cross-Origin Policies', description: 'COOP, COEP, CORP headers', category: 'headers', tier: 'cloud', icon: Shield, estimatedTime: '2s' },
  { id: 'feature-policy', name: 'Feature-Policy', description: 'Legacy feature restrictions', category: 'headers', tier: 'cloud', icon: Code, estimatedTime: '1s' },
  
  // DNS - Business
  { id: 'dnssec', name: 'DNSSEC', description: 'DNS Security Extensions validation', category: 'dns', tier: 'cloud', icon: Lock, estimatedTime: '3s' },
  { id: 'caa', name: 'CAA Records', description: 'Certificate Authority Authorization', category: 'dns', tier: 'cloud', icon: FileSearch, estimatedTime: '2s' },
  { id: 'bimi', name: 'BIMI Record', description: 'Brand Indicators for Message ID', category: 'dns', tier: 'cloud', icon: Mail, estimatedTime: '2s' },
  { id: 'mx-analysis', name: 'MX Analysis', description: 'Mail server configuration check', category: 'dns', tier: 'cloud', icon: Mail, estimatedTime: '3s' },
  
  // Vulnerabilities - Business
  { id: 'subdomain-enum', name: 'Subdomain Enumeration', description: 'Discover subdomains', category: 'vulnerabilities', tier: 'cloud', icon: Network, estimatedTime: '10s' },
  { id: 'open-ports', name: 'Open Ports Scan', description: 'Check for open network ports', category: 'vulnerabilities', tier: 'cloud', icon: Server, estimatedTime: '15s' },
  { id: 'waf-detection', name: 'WAF Detection', description: 'Web Application Firewall detection', category: 'vulnerabilities', tier: 'cloud', icon: Shield, estimatedTime: '5s' },
  { id: 'tech-fingerprint', name: 'Technology Fingerprint', description: 'Identify technologies and versions', category: 'vulnerabilities', tier: 'cloud', icon: Fingerprint, estimatedTime: '5s' },
  { id: 'js-security', name: 'JavaScript Security', description: 'Client-side script analysis', category: 'vulnerabilities', tier: 'cloud', icon: Code, estimatedTime: '8s' },
  { id: 'third-party-risk', name: 'Third-Party Risk', description: 'External dependency analysis', category: 'vulnerabilities', tier: 'cloud', icon: Cloud, estimatedTime: '6s' },
  
  // Performance - Business
  { id: 'lighthouse', name: 'Lighthouse Score', description: 'Google Lighthouse performance audit', category: 'performance', tier: 'cloud', icon: Gauge, estimatedTime: '20s' },
  { id: 'ttfb', name: 'Time to First Byte', description: 'Server response time analysis', category: 'performance', tier: 'cloud', icon: Zap, estimatedTime: '3s' },
  { id: 'robots-sitemap', name: 'Robots & Sitemap', description: 'SEO configuration check', category: 'performance', tier: 'cloud', icon: FileSearch, estimatedTime: '3s' },
  
  // Compliance - Business
  { id: 'privacy-policy', name: 'Privacy Policy', description: 'Privacy policy page detection', category: 'compliance', tier: 'cloud', icon: FileText, estimatedTime: '3s' },
  { id: 'cookie-consent', name: 'Cookie Consent', description: 'GDPR cookie consent check', category: 'compliance', tier: 'cloud', icon: Cookie, estimatedTime: '3s' },

  // ============ ENTERPRISE TIER (10+ additional checks = 60+ total) ============
  // SSL/TLS - Enterprise
  { id: 'quantum-safe', name: 'Quantum-Safe Analysis', description: 'Post-quantum cryptography readiness', category: 'ssl', tier: 'enterprise', icon: Radio, estimatedTime: '5s' },
  
  // Vulnerabilities - Enterprise
  { id: 'api-security', name: 'API Security Scan', description: 'REST/GraphQL endpoint analysis', category: 'vulnerabilities', tier: 'enterprise', icon: Code, estimatedTime: '15s' },
  { id: 'deep-vuln', name: 'Deep Vulnerability Scan', description: 'Comprehensive vulnerability assessment', category: 'vulnerabilities', tier: 'enterprise', icon: Bug, estimatedTime: '30s' },
  { id: 'supply-chain', name: 'Supply Chain Analysis', description: 'Dependency vulnerability check', category: 'vulnerabilities', tier: 'enterprise', icon: Network, estimatedTime: '20s' },
  { id: 'malware-scan', name: 'Malware Detection', description: 'Scan for malicious content', category: 'vulnerabilities', tier: 'enterprise', icon: AlertTriangle, estimatedTime: '25s' },
  
  // Compliance - Enterprise
  { id: 'pci-dss', name: 'PCI DSS Check', description: 'Payment card security compliance', category: 'compliance', tier: 'enterprise', icon: Shield, estimatedTime: '15s' },
  { id: 'hipaa', name: 'HIPAA Indicators', description: 'Healthcare data protection indicators', category: 'compliance', tier: 'enterprise', icon: Shield, estimatedTime: '10s' },
  { id: 'soc2', name: 'SOC 2 Indicators', description: 'Service organization control check', category: 'compliance', tier: 'enterprise', icon: CheckCircle, estimatedTime: '10s' },
  { id: 'gdpr', name: 'GDPR Compliance', description: 'European data protection check', category: 'compliance', tier: 'enterprise', icon: Shield, estimatedTime: '8s' },
  { id: 'accessibility', name: 'Accessibility (WCAG)', description: 'Web accessibility guidelines check', category: 'compliance', tier: 'enterprise', icon: Eye, estimatedTime: '15s' },
];

// Get checks available for a specific plan (includes lower tier checks)
export function getChecksForPlan(plan: PlanTier): SecurityCheck[] {
  const tierOrder: PlanTier[] = ['essential', 'cloud', 'pro', 'enterprise'];
  const planIndex = tierOrder.indexOf(plan);
  
  return ALL_SECURITY_CHECKS.filter(check => {
    const checkIndex = tierOrder.indexOf(check.tier);
    return checkIndex <= planIndex;
  });
}

// Get check count by plan
export function getCheckCountByPlan(): Record<PlanTier, number> {
  return {
    essential: getChecksForPlan('essential').length,
    cloud: getChecksForPlan('cloud').length,
    pro: getChecksForPlan('pro').length,
    enterprise: getChecksForPlan('enterprise').length,
  };
}

// Check if a specific check is available for a plan
export function isCheckAvailable(checkId: string, plan: PlanTier): boolean {
  const check = ALL_SECURITY_CHECKS.find(c => c.id === checkId);
  if (!check) return false;
  
  const tierOrder: PlanTier[] = ['essential', 'cloud', 'pro', 'enterprise'];
  const planIndex = tierOrder.indexOf(plan);
  const checkIndex = tierOrder.indexOf(check.tier);
  
  return checkIndex <= planIndex;
}

// Get locked checks for a plan (checks they can't access)
export function getLockedChecks(plan: PlanTier): SecurityCheck[] {
  const tierOrder: PlanTier[] = ['essential', 'cloud', 'pro', 'enterprise'];
  const planIndex = tierOrder.indexOf(plan);
  
  return ALL_SECURITY_CHECKS.filter(check => {
    const checkIndex = tierOrder.indexOf(check.tier);
    return checkIndex > planIndex;
  });
}

