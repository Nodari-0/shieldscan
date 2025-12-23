// Request/Response types
export interface AuthenticatedRequest {
  user?: {
    uid: string;
    email?: string;
    subscriptionPlan?: string;
    role?: string;
  };
}

// Scan types
export interface ScanJob {
  scanId: string;
  userId: string;
  targetUrl: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  riskScore?: number;
}

export interface ScanResult {
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

// Subscription types
export interface SubscriptionData {
  userId: string;
  plan: 'free' | 'pro' | 'business';
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}
