// User types
export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  updatedAt: Date;
  subscription: Subscription;
  usage: Usage;
  settings: UserSettings;
  gdpr: GDPRConsent;
}

export interface Subscription {
  plan: 'free' | 'pro' | 'business';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface Usage {
  scansThisMonth: number;
  scansLimit: number;
  lastResetDate: Date;
}

export interface UserSettings {
  emailNotifications: boolean;
  reportLanguage: 'en' | 'fr';
  timezone: string;
}

export interface GDPRConsent {
  consentGiven: boolean;
  consentDate: Date | null;
  dataProcessingAllowed: boolean;
  marketingConsent: boolean;
}

// Scan types
export interface Scan {
  scanId: string;
  userId: string;
  targetUrl: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt: Date | null;
  riskScore: number;
  findings: ScanFindings;
  reportUrl: string | null;
  createdAt: Date;
}

export interface ScanFindings {
  vulnerabilities: Vulnerability[];
  sslInfo: SSLInfo | null;
  openPorts: PortInfo[];
  securityHeaders: SecurityHeaders;
  cmsDetection: CMSInfo | null;
  xssTests: XSSTestResult[];
  sqlInjectionTests: SQLTestResult[];
}

export interface Vulnerability {
  id: string;
  type: 'ssl' | 'headers' | 'xss' | 'sql' | 'cms' | 'ports' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  recommendation: string;
  affectedResource: string;
  cveId: string | null;
}

export interface SSLInfo {
  valid: boolean;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  daysUntilExpiry: number;
  protocol: string;
  cipher: string;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface PortInfo {
  port: number;
  state: 'open' | 'closed' | 'filtered';
  service: string | null;
  version: string | null;
  risk: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export interface SecurityHeaders {
  strictTransportSecurity: boolean;
  xFrameOptions: boolean;
  xContentTypeOptions: boolean;
  contentSecurityPolicy: boolean;
  xXSSProtection: boolean;
  referrerPolicy: boolean;
  permissionsPolicy: boolean;
  missingHeaders: string[];
  score: number;
}

export interface CMSInfo {
  detected: boolean;
  cmsType: 'wordpress' | 'drupal' | 'joomla' | 'magento' | 'other' | null;
  version: string | null;
  vulnerabilities: string[];
}

export interface XSSTestResult {
  testType: string;
  vulnerable: boolean;
  payload: string;
  location: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface SQLTestResult {
  testType: string;
  vulnerable: boolean;
  payload: string;
  location: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Subscription plan types
export interface SubscriptionPlan {
  id: 'free' | 'pro' | 'business';
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  scanLimit: number;
  stripePriceId: string;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}
