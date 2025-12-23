// ==========================================
// SCAN CREDITS SYSTEM
// ==========================================
// Predictable pricing with clear credit model

export interface CreditPlan {
  id: string;
  name: string;
  monthlyCredits: number;
  pricePerMonth: number;
  pricePerCredit: number;
  features: string[];
  overageRate?: number; // Cost per credit over limit
  rollover: boolean;
  maxRollover?: number;
}

export interface CreditUsage {
  planId: string;
  monthlyAllowance: number;
  used: number;
  remaining: number;
  rolloverCredits: number;
  resetDate: string;
  lastUpdated: string;
  history: CreditTransaction[];
}

export interface CreditTransaction {
  id: string;
  type: 'scan' | 'api_scan' | 'deep_scan' | 'manual_verify' | 'rollover' | 'purchase' | 'bonus';
  credits: number; // Positive = added, negative = used
  description: string;
  timestamp: string;
  metadata?: {
    scanId?: string;
    url?: string;
    scanType?: string;
  };
}

// Credit costs for different scan types
export const CREDIT_COSTS: Record<string, { credits: number; label: string; description: string }> = {
  'basic_scan': {
    credits: 1,
    label: 'Basic Scan',
    description: 'Standard website security scan',
  },
  'deep_scan': {
    credits: 3,
    label: 'Deep Scan',
    description: 'Comprehensive scan with all checks',
  },
  'api_scan': {
    credits: 2,
    label: 'API Scan',
    description: 'OpenAPI/Swagger endpoint testing',
  },
  'api_endpoint': {
    credits: 0.5,
    label: 'API Endpoint',
    description: 'Per-endpoint in API scan',
  },
  'authenticated_scan': {
    credits: 2,
    label: 'Authenticated Scan',
    description: 'Scan with auth credentials',
  },
  'manual_verification': {
    credits: 10,
    label: 'Manual Verification',
    description: 'Human expert review',
  },
  'scheduled_scan': {
    credits: 0.5,
    label: 'Scheduled Scan',
    description: 'Automated recurring scan',
  },
  'incremental_scan': {
    credits: 0.25,
    label: 'Incremental Scan',
    description: 'Quick change-only scan',
  },
};

// Plan definitions
export const CREDIT_PLANS: CreditPlan[] = [
  {
    id: 'essential',
    name: 'Essential',
    monthlyCredits: 50,
    pricePerMonth: 130,
    pricePerCredit: 2.60,
    rollover: false,
    features: [
      '50 scan credits/month',
      'Basic & deep scans',
      'Email support',
    ],
  },
  {
    id: 'cloud',
    name: 'Cloud',
    monthlyCredits: 200,
    pricePerMonth: 260,
    pricePerCredit: 1.30,
    rollover: true,
    maxRollover: 100,
    overageRate: 1.50,
    features: [
      '200 scan credits/month',
      'API scanning',
      'Authenticated scans',
      'Rollover up to 100 credits',
      'Priority support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyCredits: 500,
    pricePerMonth: 434,
    pricePerCredit: 0.87,
    rollover: true,
    maxRollover: 250,
    overageRate: 1.00,
    features: [
      '500 scan credits/month',
      'All scan types',
      'Manual verification (10 credits)',
      'Rollover up to 250 credits',
      'Dedicated support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyCredits: -1, // Unlimited
    pricePerMonth: -1, // Custom
    pricePerCredit: 0,
    rollover: true,
    features: [
      'Unlimited scans',
      'Custom integrations',
      'SLA guarantees',
      'Dedicated account manager',
    ],
  },
];

// Storage key
const CREDITS_STORAGE_KEY = 'shieldscan_credits';

// Get current credit usage
export function getCreditUsage(): CreditUsage | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(CREDITS_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Initialize credit usage for a plan
export function initializeCreditUsage(planId: string): CreditUsage {
  const plan = CREDIT_PLANS.find(p => p.id === planId);
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }

  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const usage: CreditUsage = {
    planId,
    monthlyAllowance: plan.monthlyCredits,
    used: 0,
    remaining: plan.monthlyCredits,
    rolloverCredits: 0,
    resetDate: resetDate.toISOString(),
    lastUpdated: now.toISOString(),
    history: [],
  };

  saveCreditUsage(usage);
  return usage;
}

// Save credit usage
function saveCreditUsage(usage: CreditUsage): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(usage));
}

// Check if user can perform a scan
export function canUseScan(scanType: string): { allowed: boolean; reason?: string; creditsNeeded: number } {
  const usage = getCreditUsage();
  const cost = CREDIT_COSTS[scanType];
  
  if (!cost) {
    return { allowed: false, reason: 'Unknown scan type', creditsNeeded: 0 };
  }
  
  if (!usage) {
    return { allowed: true, creditsNeeded: cost.credits }; // No tracking = allow
  }
  
  // Enterprise/unlimited plans
  if (usage.monthlyAllowance === -1) {
    return { allowed: true, creditsNeeded: 0 };
  }
  
  const totalAvailable = usage.remaining + usage.rolloverCredits;
  
  if (totalAvailable < cost.credits) {
    return {
      allowed: false,
      reason: `Insufficient credits. Need ${cost.credits}, have ${totalAvailable}`,
      creditsNeeded: cost.credits,
    };
  }
  
  return { allowed: true, creditsNeeded: cost.credits };
}

// Use credits for a scan
export function useCredits(
  scanType: string,
  metadata?: { scanId?: string; url?: string }
): { success: boolean; newBalance: number; transaction?: CreditTransaction } {
  const usage = getCreditUsage();
  const cost = CREDIT_COSTS[scanType];
  
  if (!usage || !cost) {
    return { success: false, newBalance: 0 };
  }
  
  // Enterprise/unlimited
  if (usage.monthlyAllowance === -1) {
    return { success: true, newBalance: -1 };
  }
  
  const totalAvailable = usage.remaining + usage.rolloverCredits;
  if (totalAvailable < cost.credits) {
    return { success: false, newBalance: totalAvailable };
  }
  
  // Deduct credits (use rollover first, then monthly)
  let toDeduct = cost.credits;
  
  if (usage.rolloverCredits > 0) {
    const fromRollover = Math.min(usage.rolloverCredits, toDeduct);
    usage.rolloverCredits -= fromRollover;
    toDeduct -= fromRollover;
  }
  
  if (toDeduct > 0) {
    usage.remaining -= toDeduct;
  }
  
  usage.used += cost.credits;
  usage.lastUpdated = new Date().toISOString();
  
  // Create transaction
  const transaction: CreditTransaction = {
    id: `txn_${Date.now()}`,
    type: scanType.includes('api') ? 'api_scan' : scanType.includes('deep') ? 'deep_scan' : 'scan',
    credits: -cost.credits,
    description: `${cost.label}: ${metadata?.url || 'Unknown target'}`,
    timestamp: new Date().toISOString(),
    metadata,
  };
  
  usage.history.unshift(transaction);
  
  // Keep only last 100 transactions
  if (usage.history.length > 100) {
    usage.history = usage.history.slice(0, 100);
  }
  
  saveCreditUsage(usage);
  
  return {
    success: true,
    newBalance: usage.remaining + usage.rolloverCredits,
    transaction,
  };
}

// Add credits (purchase, bonus, etc.)
export function addCredits(
  amount: number,
  type: 'purchase' | 'bonus' | 'rollover',
  description: string
): CreditUsage | null {
  const usage = getCreditUsage();
  if (!usage) return null;
  
  if (type === 'rollover') {
    usage.rolloverCredits += amount;
  } else {
    usage.remaining += amount;
  }
  
  const transaction: CreditTransaction = {
    id: `txn_${Date.now()}`,
    type,
    credits: amount,
    description,
    timestamp: new Date().toISOString(),
  };
  
  usage.history.unshift(transaction);
  usage.lastUpdated = new Date().toISOString();
  
  saveCreditUsage(usage);
  return usage;
}

// Check and process monthly reset
export function checkMonthlyReset(): { reset: boolean; rolloverApplied: number } {
  const usage = getCreditUsage();
  if (!usage) return { reset: false, rolloverApplied: 0 };
  
  const now = new Date();
  const resetDate = new Date(usage.resetDate);
  
  if (now < resetDate) {
    return { reset: false, rolloverApplied: 0 };
  }
  
  const plan = CREDIT_PLANS.find(p => p.id === usage.planId);
  
  // Calculate rollover
  let rolloverApplied = 0;
  if (plan?.rollover && usage.remaining > 0) {
    rolloverApplied = Math.min(usage.remaining, plan.maxRollover || 0);
  }
  
  // Reset usage
  usage.used = 0;
  usage.remaining = usage.monthlyAllowance;
  usage.rolloverCredits = rolloverApplied;
  usage.resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  usage.lastUpdated = now.toISOString();
  
  if (rolloverApplied > 0) {
    usage.history.unshift({
      id: `txn_${Date.now()}`,
      type: 'rollover',
      credits: rolloverApplied,
      description: `Monthly rollover from previous period`,
      timestamp: now.toISOString(),
    });
  }
  
  saveCreditUsage(usage);
  
  return { reset: true, rolloverApplied };
}

// Get usage percentage
export function getUsagePercentage(): number {
  const usage = getCreditUsage();
  if (!usage || usage.monthlyAllowance === -1) return 0;
  
  return Math.round((usage.used / usage.monthlyAllowance) * 100);
}

// Get days until reset
export function getDaysUntilReset(): number {
  const usage = getCreditUsage();
  if (!usage) return 0;
  
  const now = new Date();
  const resetDate = new Date(usage.resetDate);
  const diffTime = resetDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

// Estimate credits for a scan
export function estimateScanCredits(options: {
  isDeep?: boolean;
  isAuthenticated?: boolean;
  isAPI?: boolean;
  apiEndpoints?: number;
  isIncremental?: boolean;
}): { total: number; breakdown: Array<{ type: string; credits: number }> } {
  const breakdown: Array<{ type: string; credits: number }> = [];
  
  // Base scan
  if (options.isIncremental) {
    breakdown.push({ type: 'Incremental Scan', credits: CREDIT_COSTS.incremental_scan.credits });
  } else if (options.isDeep) {
    breakdown.push({ type: 'Deep Scan', credits: CREDIT_COSTS.deep_scan.credits });
  } else {
    breakdown.push({ type: 'Basic Scan', credits: CREDIT_COSTS.basic_scan.credits });
  }
  
  // Add-ons
  if (options.isAuthenticated) {
    breakdown.push({ type: 'Authenticated', credits: CREDIT_COSTS.authenticated_scan.credits });
  }
  
  if (options.isAPI && options.apiEndpoints) {
    breakdown.push({ 
      type: `API Endpoints (${options.apiEndpoints})`, 
      credits: options.apiEndpoints * CREDIT_COSTS.api_endpoint.credits 
    });
  }
  
  const total = breakdown.reduce((sum, item) => sum + item.credits, 0);
  
  return { total, breakdown };
}

