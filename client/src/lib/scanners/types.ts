/**
 * Scanner Types
 * 
 * Type definitions for the modular security scanner architecture
 */

// Severity levels for vulnerabilities
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

// Scan check status
export type CheckStatus = 'passed' | 'warning' | 'failed' | 'info' | 'error';

// SSL/TLS Grade
export type SSLGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

// Overall security grade
export type SecurityGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Individual security check result
 */
export interface SecurityCheck {
  id: string;
  name: string;
  category: string;
  status: CheckStatus;
  message: string;
  details?: string;
  severity: Severity;
  recommendation?: string;
  proOnly?: boolean;
  businessOnly?: boolean;
}

/**
 * SSL/TLS scan result
 */
export interface SSLScanResult {
  valid: boolean;
  grade: SSLGrade;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  daysUntilExpiry: number;
  protocol: string;
  cipher: string;
  selfSigned: boolean;
  certificateChain: CertificateInfo[];
  tlsVersions: TLSVersionInfo[];
  vulnerabilities: SSLVulnerability[];
  errors: string[];
}

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  fingerprint: string;
}

export interface TLSVersionInfo {
  version: string;
  supported: boolean;
  secure: boolean;
}

export interface SSLVulnerability {
  name: string;
  vulnerable: boolean;
  severity: Severity;
  description: string;
}

/**
 * Security headers scan result
 */
export interface HeadersScanResult {
  raw: Record<string, string>;
  security: SecurityHeadersAnalysis;
  score: number;
  grade: SecurityGrade;
  recommendations: string[];
}

export interface SecurityHeadersAnalysis {
  contentSecurityPolicy: HeaderAnalysis;
  strictTransportSecurity: HeaderAnalysis;
  xFrameOptions: HeaderAnalysis;
  xContentTypeOptions: HeaderAnalysis;
  referrerPolicy: HeaderAnalysis;
  permissionsPolicy: HeaderAnalysis;
  xXssProtection: HeaderAnalysis;
  crossOriginOpenerPolicy: HeaderAnalysis;
  crossOriginResourcePolicy: HeaderAnalysis;
  crossOriginEmbedderPolicy: HeaderAnalysis;
}

export interface HeaderAnalysis {
  present: boolean;
  value: string | null;
  status: CheckStatus;
  score: number;
  recommendation?: string;
  details?: string;
}

/**
 * DNS scan result
 */
export interface DNSScanResult {
  resolved: boolean;
  ipAddresses: string[];
  ipv6Addresses: string[];
  mxRecords: MXRecord[];
  nsRecords: string[];
  txtRecords: string[];
  caaRecords: string[];
  hasCDN: boolean;
  cdnProvider: string | null;
  hasDNSSEC: boolean;
  dnssecValid: boolean;
  emailSecurity: EmailSecurityResult;
  subdomainRisks: SubdomainRisk[];
}

export interface MXRecord {
  exchange: string;
  priority: number;
}

export interface EmailSecurityResult {
  spf: SPFResult;
  dmarc: DMARCResult;
  dkim: DKIMResult;
  bimi: BIMIResult;
}

export interface SPFResult {
  present: boolean;
  record?: string;
  valid: boolean;
  policy?: string;
  issues: string[];
}

export interface DMARCResult {
  present: boolean;
  record?: string;
  valid: boolean;
  policy?: 'none' | 'quarantine' | 'reject';
  issues: string[];
}

export interface DKIMResult {
  present: boolean;
  selectors: string[];
  valid: boolean;
}

export interface BIMIResult {
  present: boolean;
  record?: string;
  logoUrl?: string;
}

export interface SubdomainRisk {
  subdomain: string;
  risk: 'takeover' | 'exposed' | 'misconfigured';
  severity: Severity;
  details: string;
}

/**
 * Vulnerability scan result
 */
export interface VulnerabilityScanResult {
  type: string;
  category: string;
  found: boolean;
  severity: Severity;
  details: string;
  evidence?: string;
  recommendation?: string;
  cwe?: string;
  owasp?: string;
}

/**
 * Technology detection result
 */
export interface TechnologyInfo {
  name: string;
  category: string;
  version?: string;
  confidence: number;
  website?: string;
  cpe?: string;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  responseTime: number;
  ttfb: number; // Time to First Byte
  pageSize?: number;
  requestCount?: number;
  cdnDetected: boolean;
  compressionEnabled: boolean;
  http2Enabled: boolean;
}

/**
 * Robots.txt and sitemap analysis
 */
export interface RobotsAnalysis {
  robotsTxtExists: boolean;
  robotsTxtContent?: string;
  disallowedPaths: string[];
  allowedPaths: string[];
  sitemaps: string[];
  exposedSensitivePaths: string[];
  crawlDelay?: number;
}

/**
 * Complete scan result
 */
export interface CompleteScanResult {
  url: string;
  timestamp: string;
  scanDuration: number;
  score: number;
  grade: SecurityGrade;
  
  // Detailed results
  ssl: SSLScanResult | null;
  headers: HeadersScanResult | null;
  dns: DNSScanResult | null;
  vulnerabilities: VulnerabilityScanResult[];
  technologies: TechnologyInfo[];
  performance: PerformanceMetrics | null;
  robots: RobotsAnalysis | null;
  
  // Summary
  checks: SecurityCheck[];
  summary: ScanSummary;
  recommendations: Recommendation[];
}

export interface ScanSummary {
  passed: number;
  warnings: number;
  failed: number;
  total: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  steps?: string[];
  resources?: string[];
}

/**
 * Scanner configuration
 */
export interface ScannerConfig {
  timeout: number;
  userAgent: string;
  followRedirects: boolean;
  maxRedirects: number;
  checkPorts: boolean;
  deepScan: boolean;
  plan: 'free' | 'pro' | 'business' | 'enterprise';
}

/**
 * Scanner progress callback
 */
export type ProgressCallback = (
  stage: string,
  progress: number,
  message: string
) => void;

