// Shared scan types across the application

export interface RequestEvidence {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface ResponseEvidence {
  status: number;
  headers: Record<string, string>;
  body?: string;
  bodyPreview?: string;
}

export interface Evidence {
  request?: RequestEvidence;
  response?: ResponseEvidence;
  screenshot?: string; // Base64 or URL
  reproductionSteps?: string[];
  proofOfImpact?: string;
  timestamp?: string;
}

export interface ScanCheck {
  id: string;
  name: string;
  category: string;
  status: 'passed' | 'warning' | 'failed' | 'info' | 'error';
  message: string;
  details?: string;
  severity: string;
  evidence?: Evidence;
}

export interface ScanVulnerability {
  type: string;
  found: boolean;
  details: string;
  severity: string;
  evidence?: Evidence;
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
  dns: {
    resolved: boolean;
    ipAddresses: string[];
    hasCDN: boolean;
    cdnProvider: string | null;
  } | null;
  ssl: {
    valid: boolean;
    issuer: string;
    validTo: string;
    daysUntilExpiry: number;
    protocol: string;
  } | null;
  headers: {
    raw: Record<string, string>;
    security: Record<string, { present: boolean; value: string | null }>;
  } | null;
  server: {
    server: string | null;
    technology: string[];
  } | null;
  vulnerabilities: ScanVulnerability[];
  scanDuration: number;
  scanId?: string;
}

export interface StoredScanResult extends ScanResult {
  id: string;
  tags?: string[];
}

// Simplified version for list views
export interface ScanSummary {
  id: string;
  url: string;
  timestamp: string;
  score: number;
  grade: string;
  summary: {
    passed: number;
    warnings: number;
    failed: number;
    total: number;
  };
  scanDuration: number;
}

// =============================================================================
// Email Breach Check Types
// =============================================================================

export interface BreachInfo {
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  addedDate: string;
  modifiedDate: string;
  pwnCount: number;
  description: string;
  dataClasses: string[];
  isVerified: boolean;
  isFabricated: boolean;
  isSensitive: boolean;
  isRetired: boolean;
  isSpamList: boolean;
  logoPath?: string;
}

export interface EmailBreachResult {
  email: string;
  breached: boolean;
  breachCount: number;
  breaches: BreachInfo[];
  lastBreachDate?: string;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  passwordSuggestions: PasswordSuggestion[];
}

export interface PasswordSuggestion {
  type: 'immediate' | 'recommended' | 'best_practice';
  title: string;
  description: string;
  priority: number;
}

export interface EmailCheckResponse {
  success: boolean;
  data?: {
    email: string;
    breached: boolean;
    breachCount: number;
    riskLevel: string;
    breaches: BreachInfo[];
    recommendations: string[];
    passwordSuggestions: PasswordSuggestion[];
    lastChecked: string;
  };
  domainCheck?: {
    domain: string;
    emailsChecked: number;
    emailsBreached: number;
    results: EmailBreachResult[];
  };
  error?: string;
}
