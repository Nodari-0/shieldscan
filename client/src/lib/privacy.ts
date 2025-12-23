// ==========================================
// PRIVACY-FIRST ENGINE
// ==========================================
// GDPR-compliant data handling, retention, and redaction

export interface PrivacySettings {
  dataRetention: DataRetentionPolicy;
  redaction: RedactionSettings;
  consent: ConsentSettings;
  gdprMode: boolean;
}

export interface DataRetentionPolicy {
  enabled: boolean;
  scanHistoryDays: number; // 0 = no retention
  evidenceDays: number;
  authProfileDays: number;
  autoDeleteOnExpiry: boolean;
}

export interface RedactionSettings {
  redactPasswords: boolean;
  redactApiKeys: boolean;
  redactTokens: boolean;
  redactEmails: boolean;
  redactIPs: boolean;
  redactCookies: boolean;
  customPatterns: string[];
}

export interface ConsentSettings {
  analyticsConsent: boolean;
  scanDataStorageConsent: boolean;
  thirdPartyIntegrationConsent: boolean;
  marketingConsent: boolean;
}

// Default privacy settings (privacy-first)
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  dataRetention: {
    enabled: true,
    scanHistoryDays: 30, // Default 30 days
    evidenceDays: 7,     // Evidence deleted faster
    authProfileDays: 90, // Auth profiles kept longer
    autoDeleteOnExpiry: true,
  },
  redaction: {
    redactPasswords: true,
    redactApiKeys: true,
    redactTokens: true,
    redactEmails: false, // Often needed for context
    redactIPs: false,    // Often needed for context
    redactCookies: true,
    customPatterns: [],
  },
  consent: {
    analyticsConsent: false, // Opt-in by default
    scanDataStorageConsent: true, // Required for functionality
    thirdPartyIntegrationConsent: false,
    marketingConsent: false,
  },
  gdprMode: true, // EU-first
};

// Redaction patterns
const REDACTION_PATTERNS: Record<string, RegExp> = {
  // API Keys
  apiKey: /(?:api[_-]?key|apikey|api_secret|apisecret)[=:\s]["']?([a-zA-Z0-9_\-]{20,})["']?/gi,
  awsKey: /(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}/g,
  googleApiKey: /AIza[0-9A-Za-z_-]{35}/g,
  stripeKey: /(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{24,}/g,
  
  // Tokens
  jwt: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
  bearer: /Bearer\s+[a-zA-Z0-9_\-.~+\/]+=*/gi,
  oauth: /(?:access_token|refresh_token)[=:\s]["']?([a-zA-Z0-9_\-.]+)["']?/gi,
  
  // Credentials
  password: /(?:password|passwd|pwd|secret)[=:\s]["']?([^\s"'&]+)["']?/gi,
  basicAuth: /Basic\s+[A-Za-z0-9+\/=]+/gi,
  
  // Personal data
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  ipv4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  ipv6: /(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/g,
  
  // Cookies
  sessionCookie: /(?:session|sess|sid|PHPSESSID|JSESSIONID)[=][a-zA-Z0-9_\-.]+/gi,
  authCookie: /(?:auth|token|jwt)[=][a-zA-Z0-9_\-.]+/gi,
  
  // Credit cards (basic - PCI compliance)
  creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
  
  // SSN (US)
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
};

// Redact sensitive data from a string
export function redactSensitiveData(
  input: string,
  settings: RedactionSettings = DEFAULT_PRIVACY_SETTINGS.redaction
): string {
  if (!input) return input;
  
  let output = input;
  
  // Always redact critical items
  if (settings.redactPasswords) {
    output = output.replace(REDACTION_PATTERNS.password, (match, value) => 
      match.replace(value, '[REDACTED]')
    );
    output = output.replace(REDACTION_PATTERNS.basicAuth, 'Basic [REDACTED]');
  }
  
  if (settings.redactApiKeys) {
    output = output.replace(REDACTION_PATTERNS.apiKey, (match, value) => 
      match.replace(value, '[REDACTED]')
    );
    output = output.replace(REDACTION_PATTERNS.awsKey, 'AKIA[REDACTED]');
    output = output.replace(REDACTION_PATTERNS.googleApiKey, 'AIza[REDACTED]');
    output = output.replace(REDACTION_PATTERNS.stripeKey, 'sk_[REDACTED]');
  }
  
  if (settings.redactTokens) {
    output = output.replace(REDACTION_PATTERNS.jwt, 'eyJ[REDACTED]');
    output = output.replace(REDACTION_PATTERNS.bearer, 'Bearer [REDACTED]');
    output = output.replace(REDACTION_PATTERNS.oauth, (match, value) => 
      match.replace(value, '[REDACTED]')
    );
  }
  
  if (settings.redactEmails) {
    output = output.replace(REDACTION_PATTERNS.email, '[EMAIL_REDACTED]');
  }
  
  if (settings.redactIPs) {
    output = output.replace(REDACTION_PATTERNS.ipv4, '[IP_REDACTED]');
    output = output.replace(REDACTION_PATTERNS.ipv6, '[IP_REDACTED]');
  }
  
  if (settings.redactCookies) {
    output = output.replace(REDACTION_PATTERNS.sessionCookie, 'session=[REDACTED]');
    output = output.replace(REDACTION_PATTERNS.authCookie, 'auth=[REDACTED]');
  }
  
  // Always redact these (PCI/PII compliance)
  output = output.replace(REDACTION_PATTERNS.creditCard, '[CARD_REDACTED]');
  output = output.replace(REDACTION_PATTERNS.ssn, '[SSN_REDACTED]');
  
  // Custom patterns
  for (const pattern of settings.customPatterns) {
    try {
      const regex = new RegExp(pattern, 'gi');
      output = output.replace(regex, '[CUSTOM_REDACTED]');
    } catch (e) {
      console.warn('Invalid custom redaction pattern:', pattern);
    }
  }
  
  return output;
}

// Storage key
const PRIVACY_STORAGE_KEY = 'shieldscan_privacy_settings';

// Get privacy settings
export function getPrivacySettings(): PrivacySettings {
  if (typeof window === 'undefined') return DEFAULT_PRIVACY_SETTINGS;
  
  try {
    const stored = localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (!stored) return DEFAULT_PRIVACY_SETTINGS;
    return { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_PRIVACY_SETTINGS;
  }
}

// Save privacy settings
export function savePrivacySettings(settings: Partial<PrivacySettings>): void {
  if (typeof window === 'undefined') return;
  
  const current = getPrivacySettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(updated));
}

// Check and delete expired data
export function cleanupExpiredData(): { deleted: number; types: string[] } {
  if (typeof window === 'undefined') return { deleted: 0, types: [] };
  
  const settings = getPrivacySettings();
  if (!settings.dataRetention.autoDeleteOnExpiry) {
    return { deleted: 0, types: [] };
  }
  
  const now = Date.now();
  let deleted = 0;
  const types: string[] = [];
  
  // Clean scan history
  try {
    const historyKey = 'shieldscan_history';
    const historyStr = localStorage.getItem(historyKey);
    if (historyStr) {
      const history = JSON.parse(historyStr);
      const maxAge = settings.dataRetention.scanHistoryDays * 24 * 60 * 60 * 1000;
      const filtered = history.filter((item: any) => {
        const age = now - new Date(item.timestamp || item.createdAt).getTime();
        return age < maxAge;
      });
      
      if (filtered.length < history.length) {
        deleted += history.length - filtered.length;
        types.push('scan_history');
        localStorage.setItem(historyKey, JSON.stringify(filtered));
      }
    }
  } catch (e) {
    console.error('Error cleaning scan history:', e);
  }
  
  // Clean auth profiles
  try {
    const authKey = 'shieldscan_auth_profiles';
    const authStr = localStorage.getItem(authKey);
    if (authStr) {
      const profiles = JSON.parse(authStr);
      const maxAge = settings.dataRetention.authProfileDays * 24 * 60 * 60 * 1000;
      const filtered = profiles.filter((profile: any) => {
        const age = now - new Date(profile.updatedAt || profile.createdAt).getTime();
        return age < maxAge;
      });
      
      if (filtered.length < profiles.length) {
        deleted += profiles.length - filtered.length;
        types.push('auth_profiles');
        localStorage.setItem(authKey, JSON.stringify(filtered));
      }
    }
  } catch (e) {
    console.error('Error cleaning auth profiles:', e);
  }
  
  return { deleted, types };
}

// Export user data (GDPR)
export function exportUserData(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  
  const data: Record<string, any> = {
    exportDate: new Date().toISOString(),
    version: '1.0',
  };
  
  // Collect all ShieldScan data
  const keysToExport = [
    'shieldscan_privacy_settings',
    'shieldscan_auth_profiles',
    'shieldscan_history',
    'shieldscan_site_fingerprints',
  ];
  
  // Also include user-specific storage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('shieldscan_') || keysToExport.includes(key))) {
      try {
        const value = localStorage.getItem(key);
        data[key] = value ? JSON.parse(value) : null;
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  }
  
  return data;
}

// Delete all user data (GDPR right to be forgotten)
export function deleteAllUserData(): { success: boolean; keysDeleted: string[] } {
  if (typeof window === 'undefined') return { success: false, keysDeleted: [] };
  
  const keysDeleted: string[] = [];
  
  // Find all ShieldScan keys
  const keysToDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('shieldscan_')) {
      keysToDelete.push(key);
    }
  }
  
  // Also check for user-specific keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('shieldscan')) {
      if (!keysToDelete.includes(key)) {
        keysToDelete.push(key);
      }
    }
  }
  
  // Delete all found keys
  for (const key of keysToDelete) {
    try {
      localStorage.removeItem(key);
      keysDeleted.push(key);
    } catch (e) {
      console.error('Error deleting key:', key, e);
    }
  }
  
  return { success: true, keysDeleted };
}

// Generate GDPR-compliant evidence report (redacted)
export function generateGDPRReport(scanData: any): any {
  const settings = getPrivacySettings();
  
  // Deep clone and redact
  const report = JSON.parse(JSON.stringify(scanData));
  
  // Recursively redact all string values
  function redactObject(obj: any): any {
    if (typeof obj === 'string') {
      return redactSensitiveData(obj, settings.redaction);
    }
    if (Array.isArray(obj)) {
      return obj.map(item => redactObject(item));
    }
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const key of Object.keys(obj)) {
        result[key] = redactObject(obj[key]);
      }
      return result;
    }
    return obj;
  }
  
  const redacted = redactObject(report);
  
  // Add GDPR metadata
  redacted._gdpr = {
    redacted: true,
    redactionDate: new Date().toISOString(),
    retentionPolicy: settings.dataRetention,
    consentGiven: settings.consent.scanDataStorageConsent,
  };
  
  return redacted;
}

// Check if data collection is allowed
export function isDataCollectionAllowed(type: 'analytics' | 'storage' | 'integration' | 'marketing'): boolean {
  const settings = getPrivacySettings();
  
  switch (type) {
    case 'analytics':
      return settings.consent.analyticsConsent;
    case 'storage':
      return settings.consent.scanDataStorageConsent;
    case 'integration':
      return settings.consent.thirdPartyIntegrationConsent;
    case 'marketing':
      return settings.consent.marketingConsent;
    default:
      return false;
  }
}

