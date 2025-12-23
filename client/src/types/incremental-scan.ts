// ==========================================
// INCREMENTAL SCAN TYPES
// ==========================================
// Smart Scan Intelligence - Only scan what changed

export interface SiteFingerprint {
  url: string;
  hostname: string;
  lastScanned: string;
  hash: string; // Hash of important scan attributes
  
  // Fingerprint components
  endpoints: EndpointFingerprint[];
  headers: HeaderFingerprint;
  ssl: SSLFingerprint;
  technologies: string[];
  dnsRecords: string[];
}

export interface EndpointFingerprint {
  path: string;
  method: string;
  params: string[];
  authRequired: boolean;
  lastModified?: string;
  contentHash?: string;
}

export interface HeaderFingerprint {
  securityHeaders: string[]; // Present security headers
  serverVersion?: string;
  contentType?: string;
}

export interface SSLFingerprint {
  issuer: string;
  validTo: string;
  protocol: string;
  cipher: string;
}

// Scan diff result
export interface ScanDiff {
  hasChanges: boolean;
  summary: DiffSummary;
  changes: ScanChange[];
  scanMode: 'full' | 'incremental' | 'quick';
  reason: string;
}

export interface DiffSummary {
  newEndpoints: number;
  removedEndpoints: number;
  changedEndpoints: number;
  headerChanges: number;
  sslChanges: number;
  newTechnologies: number;
  totalChanges: number;
}

export interface ScanChange {
  type: 'endpoint' | 'header' | 'ssl' | 'technology' | 'dns' | 'auth';
  changeType: 'added' | 'removed' | 'modified';
  field: string;
  oldValue?: string;
  newValue?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
}

// Incremental scan result
export interface IncrementalScanResult {
  isIncremental: boolean;
  fingerprint: SiteFingerprint;
  diff?: ScanDiff;
  previousScanDate?: string;
  scanSkipped: string[]; // Checks skipped due to no changes
  scanPerformed: string[]; // Checks that were run
  timeSaved?: number; // Estimated ms saved
}

// Storage key for fingerprints
export const FINGERPRINT_STORAGE_KEY = 'shieldscan_site_fingerprints';

// Calculate hash for fingerprint comparison
export function calculateFingerprintHash(fingerprint: Partial<SiteFingerprint>): string {
  const data = JSON.stringify({
    endpoints: fingerprint.endpoints?.map(e => `${e.method}:${e.path}:${e.params.join(',')}`).sort(),
    headers: fingerprint.headers?.securityHeaders?.sort(),
    ssl: fingerprint.ssl ? `${fingerprint.ssl.issuer}:${fingerprint.ssl.validTo}` : null,
    technologies: fingerprint.technologies?.sort(),
  });
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Compare two fingerprints and generate diff
export function compareFingerprints(
  previous: SiteFingerprint,
  current: Partial<SiteFingerprint>
): ScanDiff {
  const changes: ScanChange[] = [];
  
  // Compare endpoints
  const prevEndpoints = new Set(previous.endpoints?.map(e => `${e.method}:${e.path}`) || []);
  const currEndpoints = new Set(current.endpoints?.map(e => `${e.method}:${e.path}`) || []);
  
  let newEndpoints = 0;
  let removedEndpoints = 0;
  
  // Find new endpoints
  currEndpoints.forEach(ep => {
    if (!prevEndpoints.has(ep)) {
      newEndpoints++;
      const [method, path] = ep.split(':');
      changes.push({
        type: 'endpoint',
        changeType: 'added',
        field: 'endpoint',
        newValue: `${method} ${path}`,
        severity: 'medium',
        description: `New endpoint detected: ${method} ${path}`,
      });
    }
  });
  
  // Find removed endpoints
  prevEndpoints.forEach(ep => {
    if (!currEndpoints.has(ep)) {
      removedEndpoints++;
      const [method, path] = ep.split(':');
      changes.push({
        type: 'endpoint',
        changeType: 'removed',
        field: 'endpoint',
        oldValue: `${method} ${path}`,
        severity: 'info',
        description: `Endpoint removed: ${method} ${path}`,
      });
    }
  });
  
  // Compare security headers
  const prevHeaders = new Set(previous.headers?.securityHeaders || []);
  const currHeaders = new Set(current.headers?.securityHeaders || []);
  let headerChanges = 0;
  
  currHeaders.forEach(header => {
    if (!prevHeaders.has(header)) {
      headerChanges++;
      changes.push({
        type: 'header',
        changeType: 'added',
        field: header,
        newValue: 'present',
        severity: 'low',
        description: `Security header added: ${header}`,
      });
    }
  });
  
  prevHeaders.forEach(header => {
    if (!currHeaders.has(header)) {
      headerChanges++;
      changes.push({
        type: 'header',
        changeType: 'removed',
        field: header,
        oldValue: 'present',
        severity: 'medium',
        description: `Security header removed: ${header}`,
      });
    }
  });
  
  // Compare SSL
  let sslChanges = 0;
  if (previous.ssl && current.ssl) {
    if (previous.ssl.issuer !== current.ssl.issuer) {
      sslChanges++;
      changes.push({
        type: 'ssl',
        changeType: 'modified',
        field: 'issuer',
        oldValue: previous.ssl.issuer,
        newValue: current.ssl.issuer,
        severity: 'high',
        description: 'SSL certificate issuer changed',
      });
    }
    if (previous.ssl.validTo !== current.ssl.validTo) {
      sslChanges++;
      changes.push({
        type: 'ssl',
        changeType: 'modified',
        field: 'validTo',
        oldValue: previous.ssl.validTo,
        newValue: current.ssl.validTo,
        severity: 'low',
        description: 'SSL certificate expiry date changed (likely renewed)',
      });
    }
    if (previous.ssl.protocol !== current.ssl.protocol) {
      sslChanges++;
      changes.push({
        type: 'ssl',
        changeType: 'modified',
        field: 'protocol',
        oldValue: previous.ssl.protocol,
        newValue: current.ssl.protocol,
        severity: previous.ssl.protocol > (current.ssl.protocol || '') ? 'high' : 'low',
        description: `TLS protocol changed from ${previous.ssl.protocol} to ${current.ssl.protocol}`,
      });
    }
  }
  
  // Compare technologies
  const prevTech = new Set(previous.technologies || []);
  const currTech = new Set(current.technologies || []);
  let newTechnologies = 0;
  
  currTech.forEach(tech => {
    if (!prevTech.has(tech)) {
      newTechnologies++;
      changes.push({
        type: 'technology',
        changeType: 'added',
        field: 'technology',
        newValue: tech,
        severity: 'info',
        description: `New technology detected: ${tech}`,
      });
    }
  });
  
  prevTech.forEach(tech => {
    if (!currTech.has(tech)) {
      changes.push({
        type: 'technology',
        changeType: 'removed',
        field: 'technology',
        oldValue: tech,
        severity: 'info',
        description: `Technology no longer detected: ${tech}`,
      });
    }
  });
  
  const totalChanges = changes.length;
  const hasChanges = totalChanges > 0;
  
  // Determine scan mode based on changes
  let scanMode: 'full' | 'incremental' | 'quick' = 'quick';
  let reason = 'No significant changes detected';
  
  if (sslChanges > 0 || newEndpoints > 5 || headerChanges > 3) {
    scanMode = 'full';
    reason = 'Significant changes detected - running full scan';
  } else if (hasChanges) {
    scanMode = 'incremental';
    reason = `${totalChanges} change(s) detected - running incremental scan`;
  }
  
  return {
    hasChanges,
    summary: {
      newEndpoints,
      removedEndpoints,
      changedEndpoints: 0, // Would need content comparison
      headerChanges,
      sslChanges,
      newTechnologies,
      totalChanges,
    },
    changes,
    scanMode,
    reason,
  };
}

// Get stored fingerprint for a URL
export function getStoredFingerprint(url: string): SiteFingerprint | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(FINGERPRINT_STORAGE_KEY);
    if (!stored) return null;
    
    const fingerprints: Record<string, SiteFingerprint> = JSON.parse(stored);
    const hostname = new URL(url).hostname;
    
    return fingerprints[hostname] || null;
  } catch {
    return null;
  }
}

// Save fingerprint for a URL
export function saveFingerprint(fingerprint: SiteFingerprint): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(FINGERPRINT_STORAGE_KEY);
    const fingerprints: Record<string, SiteFingerprint> = stored ? JSON.parse(stored) : {};
    
    fingerprints[fingerprint.hostname] = fingerprint;
    
    // Limit storage to last 50 sites
    const keys = Object.keys(fingerprints);
    if (keys.length > 50) {
      const sorted = keys.sort((a, b) => {
        const dateA = new Date(fingerprints[a].lastScanned).getTime();
        const dateB = new Date(fingerprints[b].lastScanned).getTime();
        return dateA - dateB;
      });
      
      // Remove oldest entries
      sorted.slice(0, keys.length - 50).forEach(key => {
        delete fingerprints[key];
      });
    }
    
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, JSON.stringify(fingerprints));
  } catch (e) {
    console.error('Failed to save fingerprint:', e);
  }
}

// Check if incremental scan should be performed
export function shouldPerformIncrementalScan(
  previousFingerprint: SiteFingerprint | null,
  forceFullScan: boolean = false
): { shouldIncremental: boolean; reason: string; daysSinceLastScan?: number } {
  if (forceFullScan) {
    return { shouldIncremental: false, reason: 'Full scan requested' };
  }
  
  if (!previousFingerprint) {
    return { shouldIncremental: false, reason: 'No previous scan data - performing full scan' };
  }
  
  const lastScanned = new Date(previousFingerprint.lastScanned);
  const now = new Date();
  const daysSince = (now.getTime() - lastScanned.getTime()) / (1000 * 60 * 60 * 24);
  
  // Force full scan if last scan was more than 7 days ago
  if (daysSince > 7) {
    return { 
      shouldIncremental: false, 
      reason: `Last scan was ${Math.floor(daysSince)} days ago - performing full scan`,
      daysSinceLastScan: daysSince,
    };
  }
  
  return { 
    shouldIncremental: true, 
    reason: `Previous scan from ${lastScanned.toLocaleDateString()} available`,
    daysSinceLastScan: daysSince,
  };
}

// Get estimated time savings for incremental scan
export function getEstimatedTimeSavings(scanMode: 'full' | 'incremental' | 'quick'): number {
  switch (scanMode) {
    case 'quick':
      return 8000; // ~8 seconds saved
    case 'incremental':
      return 4000; // ~4 seconds saved
    case 'full':
    default:
      return 0;
  }
}

