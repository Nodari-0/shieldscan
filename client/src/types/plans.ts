// ==========================================
// UNIFIED PLAN DEFINITIONS
// ==========================================
// Single source of truth for all plan/tier logic

/**
 * Plan tier identifiers - use these constants everywhere
 */
export const PLAN_TIERS = {
  ESSENTIAL: 'essential',
  CLOUD: 'cloud',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export type PlanTier = typeof PLAN_TIERS[keyof typeof PLAN_TIERS];

/**
 * Legacy plan mapping for backward compatibility
 * Maps old plan names to new standardized names
 */
export const LEGACY_PLAN_MAP: Record<string, PlanTier> = {
  'free': PLAN_TIERS.ESSENTIAL,
  'starter': PLAN_TIERS.ESSENTIAL,
  'basic': PLAN_TIERS.ESSENTIAL,
  'pro': PLAN_TIERS.PRO,
  'business': PLAN_TIERS.CLOUD,
  'team': PLAN_TIERS.CLOUD,
  'enterprise': PLAN_TIERS.ENTERPRISE,
};

/**
 * Normalize any plan string to a valid PlanTier
 */
export function normalizePlan(plan: string | undefined | null): PlanTier {
  if (!plan) return PLAN_TIERS.ESSENTIAL;
  
  const lower = plan.toLowerCase();
  
  // Check if it's already a valid tier
  if (Object.values(PLAN_TIERS).includes(lower as PlanTier)) {
    return lower as PlanTier;
  }
  
  // Check legacy mapping
  if (lower in LEGACY_PLAN_MAP) {
    return LEGACY_PLAN_MAP[lower];
  }
  
  // Default to essential
  return PLAN_TIERS.ESSENTIAL;
}

/**
 * Plan features configuration
 */
export interface PlanFeatures {
  scansPerMonth: number;
  scheduledScans: boolean;
  scheduledScansLimit: number;
  apiAccess: boolean;
  teamMembers: number;
  advancedScanning: boolean;
  complianceReporting: boolean;
  customIntegrations: boolean;
  prioritySupport: boolean;
  slaGuarantee: boolean;
  byokEncryption: boolean;
  dedicatedScanner: boolean;
  whiteLabel: boolean;
}

/**
 * Plan configuration - all plan details in one place
 */
export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  [PLAN_TIERS.ESSENTIAL]: {
    scansPerMonth: 10,
    scheduledScans: true,
    scheduledScansLimit: 1,
    apiAccess: false,
    teamMembers: 1,
    advancedScanning: false,
    complianceReporting: false,
    customIntegrations: false,
    prioritySupport: false,
    slaGuarantee: false,
    byokEncryption: false,
    dedicatedScanner: false,
    whiteLabel: false,
  },
  [PLAN_TIERS.CLOUD]: {
    scansPerMonth: 50,
    scheduledScans: true,
    scheduledScansLimit: -1, // unlimited
    apiAccess: true,
    teamMembers: 5,
    advancedScanning: true,
    complianceReporting: true,
    customIntegrations: true,
    prioritySupport: false,
    slaGuarantee: false,
    byokEncryption: false,
    dedicatedScanner: false,
    whiteLabel: false,
  },
  [PLAN_TIERS.PRO]: {
    scansPerMonth: 200,
    scheduledScans: true,
    scheduledScansLimit: -1,
    apiAccess: true,
    teamMembers: 20,
    advancedScanning: true,
    complianceReporting: true,
    customIntegrations: true,
    prioritySupport: true,
    slaGuarantee: true,
    byokEncryption: true,
    dedicatedScanner: false,
    whiteLabel: false,
  },
  [PLAN_TIERS.ENTERPRISE]: {
    scansPerMonth: -1, // unlimited
    scheduledScans: true,
    scheduledScansLimit: -1,
    apiAccess: true,
    teamMembers: -1, // unlimited
    advancedScanning: true,
    complianceReporting: true,
    customIntegrations: true,
    prioritySupport: true,
    slaGuarantee: true,
    byokEncryption: true,
    dedicatedScanner: true,
    whiteLabel: true,
  },
};

/**
 * Plan pricing (EUR)
 */
export const PLAN_PRICING: Record<PlanTier, { monthly: number; yearly: number }> = {
  [PLAN_TIERS.ESSENTIAL]: { monthly: 130, yearly: 1300 },
  [PLAN_TIERS.CLOUD]: { monthly: 260, yearly: 2600 },
  [PLAN_TIERS.PRO]: { monthly: 434, yearly: 4340 },
  [PLAN_TIERS.ENTERPRISE]: { monthly: 0, yearly: 0 }, // Custom pricing
};

/**
 * Plan display information
 */
export const PLAN_DISPLAY: Record<PlanTier, { name: string; description: string; badge?: string }> = {
  [PLAN_TIERS.ESSENTIAL]: {
    name: 'Essential',
    description: 'Best for startups looking to stay compliant',
    badge: '14-DAY FREE TRIAL',
  },
  [PLAN_TIERS.CLOUD]: {
    name: 'Cloud',
    description: 'Best for cloud-native companies',
    badge: 'BEST VALUE',
  },
  [PLAN_TIERS.PRO]: {
    name: 'Pro',
    description: 'Best for hybrid environments',
  },
  [PLAN_TIERS.ENTERPRISE]: {
    name: 'Enterprise',
    description: 'Best for managing sprawling attack surfaces',
  },
};

/**
 * Feature access check
 */
export function hasFeature(plan: PlanTier, feature: keyof PlanFeatures): boolean {
  const features = PLAN_FEATURES[plan];
  const value = features[feature];
  
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  
  return false;
}

/**
 * Get feature limit
 */
export function getFeatureLimit(plan: PlanTier, feature: keyof PlanFeatures): number {
  const features = PLAN_FEATURES[plan];
  const value = features[feature];
  
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  
  return 0;
}

/**
 * Check if plan has higher tier than another
 */
export function isHigherTier(plan: PlanTier, thanPlan: PlanTier): boolean {
  const tierOrder: PlanTier[] = [
    PLAN_TIERS.ESSENTIAL,
    PLAN_TIERS.CLOUD,
    PLAN_TIERS.PRO,
    PLAN_TIERS.ENTERPRISE,
  ];
  
  return tierOrder.indexOf(plan) > tierOrder.indexOf(thanPlan);
}

/**
 * Get minimum plan required for a feature
 */
export function getMinimumPlanForFeature(feature: keyof PlanFeatures): PlanTier {
  const tierOrder: PlanTier[] = [
    PLAN_TIERS.ESSENTIAL,
    PLAN_TIERS.CLOUD,
    PLAN_TIERS.PRO,
    PLAN_TIERS.ENTERPRISE,
  ];
  
  for (const tier of tierOrder) {
    if (hasFeature(tier, feature)) {
      return tier;
    }
  }
  
  return PLAN_TIERS.ENTERPRISE;
}

/**
 * Stripe price IDs
 */
export const STRIPE_PRICE_IDS: Record<PlanTier, { monthly: string; yearly: string }> = {
  [PLAN_TIERS.ESSENTIAL]: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_ESSENTIAL_MONTHLY_PRICE_ID || 'price_essential_monthly',
    yearly: process.env.NEXT_PUBLIC_STRIPE_ESSENTIAL_YEARLY_PRICE_ID || 'price_essential_yearly',
  },
  [PLAN_TIERS.CLOUD]: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_CLOUD_MONTHLY_PRICE_ID || 'price_cloud_monthly',
    yearly: process.env.NEXT_PUBLIC_STRIPE_CLOUD_YEARLY_PRICE_ID || 'price_cloud_yearly',
  },
  [PLAN_TIERS.PRO]: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  },
  [PLAN_TIERS.ENTERPRISE]: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly',
    yearly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly',
  },
};

