// ==========================================
// HUMAN-VERIFIED FINDINGS (HYBRID MODEL)
// ==========================================
// Manual expert verification of critical findings

export type VerificationStatus = 
  | 'pending'
  | 'in_review'
  | 'verified_true_positive'
  | 'verified_false_positive'
  | 'needs_more_info'
  | 'cancelled';

export type SLATier = 'standard' | 'priority' | 'urgent';

export interface VerificationRequest {
  id: string;
  findingId: string;
  findingName: string;
  findingCategory: string;
  findingSeverity: string;
  scanId: string;
  scanUrl: string;
  
  // Request details
  status: VerificationStatus;
  slaTier: SLATier;
  createdAt: string;
  updatedAt: string;
  
  // SLA tracking
  slaDeadline: string;
  slaHoursRemaining?: number;
  
  // User info
  userId: string;
  userEmail: string;
  userNotes?: string;
  
  // Verification result
  result?: VerificationResult;
}

export interface VerificationResult {
  verifiedAt: string;
  verifiedBy: string; // Expert name or ID
  isConfirmed: boolean;
  confidence: 'high' | 'medium' | 'low';
  expertNotes: string;
  reproductionSteps?: string[];
  recommendation: string;
  references?: string[];
  // Additional evidence provided by expert
  additionalEvidence?: {
    screenshots?: string[];
    exploitCode?: string;
    videoUrl?: string;
  };
}

// SLA configuration
export const SLA_CONFIG: Record<SLATier, {
  name: string;
  hours: number;
  credits: number;
  description: string;
}> = {
  standard: {
    name: 'Standard',
    hours: 72,
    credits: 10,
    description: 'Verification within 72 hours',
  },
  priority: {
    name: 'Priority',
    hours: 24,
    credits: 25,
    description: 'Verification within 24 hours',
  },
  urgent: {
    name: 'Urgent',
    hours: 4,
    credits: 50,
    description: 'Verification within 4 hours',
  },
};

// Storage key
const VERIFICATION_STORAGE_KEY = 'shieldscan_verification_requests';

// Get all verification requests
export function getVerificationRequests(): VerificationRequest[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(VERIFICATION_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save verification requests
function saveVerificationRequests(requests: VerificationRequest[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(requests));
}

// Create verification request
export function createVerificationRequest(
  finding: {
    id: string;
    name: string;
    category: string;
    severity: string;
  },
  scan: {
    id: string;
    url: string;
  },
  user: {
    id: string;
    email: string;
  },
  slaTier: SLATier = 'standard',
  userNotes?: string
): VerificationRequest {
  const sla = SLA_CONFIG[slaTier];
  const now = new Date();
  const deadline = new Date(now.getTime() + sla.hours * 60 * 60 * 1000);

  const request: VerificationRequest = {
    id: `ver_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    findingId: finding.id,
    findingName: finding.name,
    findingCategory: finding.category,
    findingSeverity: finding.severity,
    scanId: scan.id,
    scanUrl: scan.url,
    status: 'pending',
    slaTier,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    slaDeadline: deadline.toISOString(),
    userId: user.id,
    userEmail: user.email,
    userNotes,
  };

  const requests = getVerificationRequests();
  requests.unshift(request);
  saveVerificationRequests(requests);

  return request;
}

// Update verification request status
export function updateVerificationStatus(
  requestId: string,
  status: VerificationStatus,
  result?: VerificationResult
): VerificationRequest | null {
  const requests = getVerificationRequests();
  const index = requests.findIndex(r => r.id === requestId);
  
  if (index === -1) return null;

  requests[index].status = status;
  requests[index].updatedAt = new Date().toISOString();
  
  if (result) {
    requests[index].result = result;
  }

  saveVerificationRequests(requests);
  return requests[index];
}

// Cancel verification request
export function cancelVerificationRequest(requestId: string): boolean {
  const requests = getVerificationRequests();
  const index = requests.findIndex(r => r.id === requestId);
  
  if (index === -1) return false;
  
  // Only allow cancellation of pending requests
  if (requests[index].status !== 'pending') {
    return false;
  }

  requests[index].status = 'cancelled';
  requests[index].updatedAt = new Date().toISOString();
  saveVerificationRequests(requests);
  
  return true;
}

// Get pending requests for a scan
export function getPendingRequestsForScan(scanId: string): VerificationRequest[] {
  return getVerificationRequests().filter(
    r => r.scanId === scanId && 
    (r.status === 'pending' || r.status === 'in_review')
  );
}

// Get pending requests for a finding
export function getPendingRequestForFinding(findingId: string): VerificationRequest | null {
  return getVerificationRequests().find(
    r => r.findingId === findingId && 
    (r.status === 'pending' || r.status === 'in_review')
  ) || null;
}

// Check if finding can be verified
export function canRequestVerification(findingId: string, severity: string): {
  allowed: boolean;
  reason?: string;
} {
  // Only allow verification for high/critical findings
  if (!['critical', 'high', 'medium'].includes(severity.toLowerCase())) {
    return { allowed: false, reason: 'Only critical, high, and medium severity findings can be verified' };
  }

  // Check for existing pending request
  const existing = getPendingRequestForFinding(findingId);
  if (existing) {
    return { allowed: false, reason: 'Verification already requested for this finding' };
  }

  return { allowed: true };
}

// Calculate SLA remaining time
export function getSLAStatus(request: VerificationRequest): {
  hoursRemaining: number;
  isOverdue: boolean;
  percentComplete: number;
  statusText: string;
} {
  const now = new Date();
  const deadline = new Date(request.slaDeadline);
  const created = new Date(request.createdAt);
  
  const totalMs = deadline.getTime() - created.getTime();
  const elapsedMs = now.getTime() - created.getTime();
  const remainingMs = deadline.getTime() - now.getTime();
  
  const hoursRemaining = Math.max(0, remainingMs / (1000 * 60 * 60));
  const isOverdue = remainingMs <= 0;
  const percentComplete = Math.min(100, (elapsedMs / totalMs) * 100);
  
  let statusText: string;
  if (request.status === 'verified_true_positive' || request.status === 'verified_false_positive') {
    statusText = 'Completed';
  } else if (isOverdue) {
    statusText = 'Overdue';
  } else if (hoursRemaining < 1) {
    statusText = `${Math.ceil(hoursRemaining * 60)} minutes remaining`;
  } else if (hoursRemaining < 24) {
    statusText = `${Math.ceil(hoursRemaining)} hours remaining`;
  } else {
    statusText = `${Math.ceil(hoursRemaining / 24)} days remaining`;
  }
  
  return { hoursRemaining, isOverdue, percentComplete, statusText };
}

// Get verification history for user
export function getUserVerificationHistory(userId: string): VerificationRequest[] {
  return getVerificationRequests().filter(r => r.userId === userId);
}

// Get verification stats
export function getVerificationStats(userId: string): {
  total: number;
  pending: number;
  verified: number;
  truePositives: number;
  falsePositives: number;
} {
  const requests = getUserVerificationHistory(userId);
  
  return {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending' || r.status === 'in_review').length,
    verified: requests.filter(r => r.status === 'verified_true_positive' || r.status === 'verified_false_positive').length,
    truePositives: requests.filter(r => r.status === 'verified_true_positive').length,
    falsePositives: requests.filter(r => r.status === 'verified_false_positive').length,
  };
}

// Simulate expert verification (for demo purposes)
export function simulateVerification(requestId: string): VerificationResult {
  const request = getVerificationRequests().find(r => r.id === requestId);
  
  // Random simulation
  const isConfirmed = Math.random() > 0.3;
  
  const result: VerificationResult = {
    verifiedAt: new Date().toISOString(),
    verifiedBy: 'Security Expert',
    isConfirmed,
    confidence: 'high',
    expertNotes: isConfirmed 
      ? 'The vulnerability has been confirmed. The finding is accurate and exploitable in the current configuration.'
      : 'After thorough analysis, this appears to be a false positive. The security control is properly implemented.',
    recommendation: isConfirmed
      ? 'Immediate remediation recommended. Apply the suggested fix or implement compensating controls.'
      : 'No action required. Consider adjusting scan configuration to reduce similar false positives.',
    references: [
      'https://owasp.org/www-project-web-security-testing-guide/',
      'https://cwe.mitre.org/',
    ],
  };
  
  updateVerificationStatus(
    requestId,
    isConfirmed ? 'verified_true_positive' : 'verified_false_positive',
    result
  );
  
  return result;
}

