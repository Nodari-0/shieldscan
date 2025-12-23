/**
 * ShieldScan Pricing Configuration
 * Updated pricing structure with Euro currency and new plan tiers
 * Plans: Essential (Free), Cloud, Pro, Enterprise
 */

export type PlanType = 'essential' | 'cloud' | 'pro' | 'enterprise';

// Legacy plan type mapping for backwards compatibility
export type LegacyPlanType = 'free' | 'pro' | 'business' | 'enterprise';

export interface PlanConfig {
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  currency: string;
  scansLimit: number; // -1 for unlimited/custom
  features: string[];
  allowsPDF: boolean;
  allowsScanHistory: boolean;
  allowsTeamAccess: boolean;
  allowsAPI: boolean;
  allowsCloudSecurity: boolean;
  allowsInternalScanning: boolean;
  allowsAttackSurface: boolean;
  maxTeamMembers?: number;
  maxCloudAccounts?: number;
  infrastructureLicenses: number;
}

// 11% yearly discount
const YEARLY_DISCOUNT = 0.89;

export const PLAN_CONFIG: Record<PlanType, PlanConfig> = {
  essential: {
    name: 'Essential',
    description: 'Best for startups looking to stay compliant',
    price: {
      monthly: 130,
      yearly: Math.round(130 * 12 * YEARLY_DISCOUNT), // €1,388/year (11% savings)
    },
    currency: '€',
    scansLimit: -1, // Unlimited ad hoc scans
    infrastructureLicenses: 5,
    features: [
      '1 scheduled scan',
      'Unlimited ad hoc scans',
      'Issues enriched with enhanced risk data',
      'Unlimited users',
      'Evidence-based findings (request/response, screenshots)',
      'API-first security scanning',
      'OpenAPI / Swagger ingestion',
      'Developer-friendly fix suggestions',
      'Risk-based scoring (not just CVSS)',
      'One-click auth scanning (JWT, OAuth2, Cookies)',
      'Privacy-first by default (GDPR-ready)',
      'Scan credits with predictable pricing',
      'CI/CD integration (GitHub, GitLab)',
      'Basic dashboard & reporting',
    ],
    allowsPDF: false,
    allowsScanHistory: true,
    allowsTeamAccess: true,
    allowsAPI: false,
    allowsCloudSecurity: false,
    allowsInternalScanning: false,
    allowsAttackSurface: false,
  },
  cloud: {
    name: 'Cloud',
    description: 'Best for cloud-native companies',
    price: {
      monthly: 260,
      yearly: Math.round(260 * 12 * YEARLY_DISCOUNT), // €2,777/year (11% savings)
    },
    currency: '€',
    scansLimit: -1, // Unlimited
    infrastructureLicenses: 5,
    features: [
      'All Essential features',
      'Cloud security for up to 3 AWS, Azure and Google Cloud accounts',
      'Unlimited scheduled scans',
      'Emerging Threat Scans',
      'AI security analyst',
      'Advanced analytics',
      'Role based access',
      '15+ integrations',
      'PDF report generation',
      'Full scan history',
      'Email support',
      'Incremental scanning (smart scan intelligence)',
      'API parameter fuzzing',
      'Business logic abuse detection',
      'BOLA / BFLA detection',
      'Mass assignment vulnerability detection',
      'JWT misconfiguration checks',
    ],
    allowsPDF: true,
    allowsScanHistory: true,
    allowsTeamAccess: true,
    allowsAPI: true,
    allowsCloudSecurity: true,
    allowsInternalScanning: false,
    allowsAttackSurface: false,
    maxCloudAccounts: 3,
  },
  pro: {
    name: 'Pro',
    description: 'Best for hybrid environments',
    price: {
      monthly: 434,
      yearly: Math.round(434 * 12 * YEARLY_DISCOUNT), // €4,635/year (11% savings)
    },
    currency: '€',
    scansLimit: -1, // Unlimited
    infrastructureLicenses: 5,
    features: [
      'All Cloud features',
      'Cloud security for up to 10 AWS, Azure and Google Cloud accounts',
      'Internal target scanning',
      'Mass deployment options for internal targets',
      'Team access (up to 10 users)',
      'API access',
      'Priority support',
      'DAST scanning',
      'Advanced API security testing',
      'Custom integrations',
      'Human-verified findings (24-72h SLA)',
      'PR comments with exploit summary',
      'SARIF output',
      'Build failure on exploitable issues only',
    ],
    allowsPDF: true,
    allowsScanHistory: true,
    allowsTeamAccess: true,
    allowsAPI: true,
    allowsCloudSecurity: true,
    allowsInternalScanning: true,
    allowsAttackSurface: false,
    maxTeamMembers: 10,
    maxCloudAccounts: 10,
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Best for managing sprawling attack surfaces',
    price: {
      monthly: -1, // Custom pricing
      yearly: -1,
    },
    currency: '€',
    scansLimit: -1, // Custom (unlimited)
    infrastructureLicenses: -1, // Custom
    features: [
      'All Pro features',
      'Attack surface visibility and unknown asset discovery',
      '1000+ attack surface checks',
      'Cloud security for unlimited AWS, Azure, Google Cloud accounts',
      'Proactive threat response and custom Intruder checks',
      'Advanced access control',
      'Unlimited team members',
      'Dedicated infrastructure',
      'SLA guarantee',
      '24/7 dedicated support',
      'Compliance automation (SOC 2, ISO, HIPAA, DORA)',
      'On-prem scan agent option',
      'Sensitive payload redaction',
      'Custom evidence reports',
      'White-glove onboarding',
    ],
    allowsPDF: true,
    allowsScanHistory: true,
    allowsTeamAccess: true,
    allowsAPI: true,
    allowsCloudSecurity: true,
    allowsInternalScanning: true,
    allowsAttackSurface: true,
  },
};

// Legacy mapping for backwards compatibility
export const LEGACY_PLAN_MAPPING: Record<LegacyPlanType, PlanType> = {
  free: 'essential',
  pro: 'cloud',
  business: 'pro',
  enterprise: 'enterprise',
};

/**
 * Get scan limit for a plan
 */
export function getScanLimit(plan: PlanType): number {
  return PLAN_CONFIG[plan].scansLimit;
}

/**
 * Check if plan allows feature
 */
export function planAllowsFeature(
  plan: PlanType,
  feature: 'pdf' | 'history' | 'team' | 'api' | 'cloud' | 'internal' | 'attackSurface'
): boolean {
  const config = PLAN_CONFIG[plan];
  switch (feature) {
    case 'pdf':
      return config.allowsPDF;
    case 'history':
      return config.allowsScanHistory;
    case 'team':
      return config.allowsTeamAccess;
    case 'api':
      return config.allowsAPI;
    case 'cloud':
      return config.allowsCloudSecurity;
    case 'internal':
      return config.allowsInternalScanning;
    case 'attackSurface':
      return config.allowsAttackSurface;
    default:
      return false;
  }
}

/**
 * Format price with currency symbol
 */
export function formatPrice(price: number, currency: string = '€'): string {
  if (price === -1) return 'Custom';
  if (price === 0) return 'Free';
  return `${currency}${price}`;
}

/**
 * Calculate yearly savings percentage
 */
export function getYearlySavingsPercent(): number {
  return Math.round((1 - YEARLY_DISCOUNT) * 100);
}

/**
 * Stripe Price IDs - Update these with your actual Stripe price IDs
 */
export const STRIPE_PRICE_IDS = {
  cloud: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_CLOUD_MONTHLY_PRICE_ID || 'price_cloud_monthly',
    yearly: process.env.NEXT_PUBLIC_STRIPE_CLOUD_YEARLY_PRICE_ID || 'price_cloud_yearly',
  },
  pro: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  },
  enterprise: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly',
    yearly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly',
  },
};

/**
 * Map Stripe price ID to plan
 */
export function getPlanFromPriceId(priceId: string): PlanType | null {
  if (priceId.includes('cloud')) return 'cloud';
  if (priceId.includes('pro')) return 'pro';
  if (priceId.includes('enterprise')) return 'enterprise';
  return null;
}

/**
 * Convert legacy plan type to new plan type
 */
export function convertLegacyPlan(legacyPlan: LegacyPlanType): PlanType {
  return LEGACY_PLAN_MAPPING[legacyPlan];
}
