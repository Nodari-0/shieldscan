/**
 * ShieldScan Features Configuration
 * Centralized configuration for all security features
 */

import { PlanType } from './pricing';

export type FeatureCategory = 
  | 'external'
  | 'internal'
  | 'cloud'
  | 'compliance'
  | 'monitoring';

export type FeatureStatus = 'available' | 'coming_soon' | 'beta';

export interface Feature {
  id: string;
  name: string;
  shortName: string;
  description: string;
  longDescription?: string;
  category: FeatureCategory;
  status: FeatureStatus;
  icon: string; // Icon name from lucide-react
  availableIn: PlanType[];
  checksCount?: string;
  highlight?: boolean;
}

export const FEATURE_CATEGORIES: Record<FeatureCategory, { name: string; description: string }> = {
  external: {
    name: 'External Scanning',
    description: 'Scan and monitor your public-facing infrastructure',
  },
  internal: {
    name: 'Internal Scanning',
    description: 'Secure your internal network and employee devices',
  },
  cloud: {
    name: 'Cloud Security',
    description: 'Protect your cloud infrastructure across AWS, Azure, and GCP',
  },
  compliance: {
    name: 'Compliance & Reporting',
    description: 'Meet regulatory requirements and demonstrate security posture',
  },
  monitoring: {
    name: 'Monitoring & Detection',
    description: 'Continuous monitoring and threat detection',
  },
};

export const FEATURES: Feature[] = [
  // External Scanning Features
  {
    id: 'external-scanning',
    name: 'External Scanning',
    shortName: 'External',
    description: 'Infrastructure security scanning for public-facing assets',
    longDescription: 'Comprehensive external vulnerability scanning that identifies security weaknesses in your public-facing infrastructure, including web servers, APIs, and network services.',
    category: 'external',
    status: 'available',
    icon: 'Globe',
    availableIn: ['essential', 'cloud', 'pro', 'enterprise'],
    highlight: true,
  },
  {
    id: 'web-app-security',
    name: 'Website Security',
    shortName: 'Web Apps',
    description: 'Secure web applications with 140k+ security checks',
    longDescription: 'Dynamic application security testing (DAST) that crawls and tests your web applications for vulnerabilities including XSS, SQL injection, and more.',
    category: 'external',
    status: 'available',
    icon: 'Shield',
    availableIn: ['essential', 'cloud', 'pro', 'enterprise'],
    checksCount: '140k+',
  },
  {
    id: 'dast',
    name: 'DAST',
    shortName: 'DAST',
    description: 'Dynamic Application Security Testing for web apps',
    longDescription: 'Automated DAST scanning that simulates real-world attacks on your running applications to identify vulnerabilities before attackers do.',
    category: 'external',
    status: 'available',
    icon: 'Zap',
    availableIn: ['pro', 'enterprise'],
  },
  {
    id: 'api-security',
    name: 'API Security',
    shortName: 'APIs',
    description: 'Test and secure your APIs',
    longDescription: 'Comprehensive API security testing that checks for authentication flaws, injection vulnerabilities, and API-specific security issues.',
    category: 'external',
    status: 'available',
    icon: 'Code',
    availableIn: ['cloud', 'pro', 'enterprise'],
  },
  {
    id: 'attack-surface',
    name: 'Attack Surface Monitoring',
    shortName: 'Attack Surface',
    description: 'Monitor and respond to changes in your attack surface',
    longDescription: 'Continuous monitoring of your digital footprint to detect new assets, exposed services, and potential entry points for attackers.',
    category: 'external',
    status: 'available',
    icon: 'Radar',
    availableIn: ['enterprise'],
    highlight: true,
  },
  {
    id: 'asset-discovery',
    name: 'Asset Discovery',
    shortName: 'Discovery',
    description: 'Reveal unknown targets and shadow IT',
    longDescription: 'Automatically discover internet-facing assets associated with your organization, including forgotten subdomains, shadow IT, and third-party services.',
    category: 'external',
    status: 'available',
    icon: 'Search',
    availableIn: ['enterprise'],
  },

  // Internal Scanning Features
  {
    id: 'internal-scanning',
    name: 'Internal Scanning',
    shortName: 'Internal',
    description: 'Secure employee devices and internal networks',
    longDescription: 'Internal vulnerability scanning for workstations, servers, and network devices within your organization\'s perimeter.',
    category: 'internal',
    status: 'available',
    icon: 'Server',
    availableIn: ['pro', 'enterprise'],
  },

  // Cloud Security Features
  {
    id: 'cspm',
    name: 'CSPM',
    shortName: 'CSPM',
    description: 'Daily cloud configuration checks',
    longDescription: 'Cloud Security Posture Management that continuously monitors your cloud infrastructure for misconfigurations and compliance violations.',
    category: 'cloud',
    status: 'available',
    icon: 'Cloud',
    availableIn: ['cloud', 'pro', 'enterprise'],
  },
  {
    id: 'aws-security',
    name: 'AWS Security',
    shortName: 'AWS',
    description: 'Security scanning for Amazon Web Services',
    longDescription: 'Comprehensive security scanning for your AWS accounts, including EC2, S3, IAM, and other services.',
    category: 'cloud',
    status: 'available',
    icon: 'Cloud',
    availableIn: ['cloud', 'pro', 'enterprise'],
  },
  {
    id: 'azure-security',
    name: 'Azure Security',
    shortName: 'Azure',
    description: 'Security scanning for Microsoft Azure',
    longDescription: 'Security assessment for Azure resources including virtual machines, storage accounts, and identity configurations.',
    category: 'cloud',
    status: 'available',
    icon: 'Cloud',
    availableIn: ['cloud', 'pro', 'enterprise'],
  },
  {
    id: 'gcp-security',
    name: 'Google Cloud Security',
    shortName: 'GCP',
    description: 'Security scanning for Google Cloud Platform',
    longDescription: 'Security scanning for GCP projects including Compute Engine, Cloud Storage, and IAM policies.',
    category: 'cloud',
    status: 'available',
    icon: 'Cloud',
    availableIn: ['cloud', 'pro', 'enterprise'],
  },

  // Compliance & Reporting Features
  {
    id: 'compliance',
    name: 'Compliance Automation',
    shortName: 'Compliance',
    description: 'SOC 2, ISO 27001, HIPAA, PCI DSS, DORA',
    longDescription: 'Automated compliance checking and reporting for major security frameworks and regulations.',
    category: 'compliance',
    status: 'available',
    icon: 'FileCheck',
    availableIn: ['enterprise'],
  },
  {
    id: 'cyber-hygiene',
    name: 'Cyber Hygiene Reporting',
    shortName: 'Hygiene',
    description: 'Demonstrate security progress over time',
    longDescription: 'Track and report on your organization\'s security posture improvement with comprehensive hygiene scoring and trend analysis.',
    category: 'compliance',
    status: 'available',
    icon: 'BarChart',
    availableIn: ['cloud', 'pro', 'enterprise'],
  },
  {
    id: 'risk-prioritization',
    name: 'Risk-Based Prioritization',
    shortName: 'Prioritization',
    description: 'No more alert fatigue - focus on what matters',
    longDescription: 'AI-powered risk scoring that prioritizes vulnerabilities based on exploitability, impact, and your specific environment.',
    category: 'compliance',
    status: 'available',
    icon: 'AlertTriangle',
    availableIn: ['cloud', 'pro', 'enterprise'],
  },

  // Monitoring & Detection Features
  {
    id: 'emerging-threats',
    name: 'Emerging Threat Detection',
    shortName: 'Threats',
    description: 'Check and act fast on new vulnerabilities',
    longDescription: 'Rapid response scanning for newly disclosed vulnerabilities and emerging threats, keeping you protected against the latest attack vectors.',
    category: 'monitoring',
    status: 'available',
    icon: 'AlertCircle',
    availableIn: ['cloud', 'pro', 'enterprise'],
    highlight: true,
  },
  {
    id: 'continuous-monitoring',
    name: 'Continuous Monitoring',
    shortName: 'Monitoring',
    description: '24/7 security monitoring and alerting',
    longDescription: 'Round-the-clock monitoring of your infrastructure with instant alerts when new vulnerabilities or security issues are detected.',
    category: 'monitoring',
    status: 'available',
    icon: 'Eye',
    availableIn: ['cloud', 'pro', 'enterprise'],
  },
];

/**
 * Get features by category
 */
export function getFeaturesByCategory(category: FeatureCategory): Feature[] {
  return FEATURES.filter(f => f.category === category);
}

/**
 * Get features available in a specific plan
 */
export function getFeaturesForPlan(plan: PlanType): Feature[] {
  return FEATURES.filter(f => f.availableIn.includes(plan));
}

/**
 * Get highlighted features for marketing
 */
export function getHighlightedFeatures(): Feature[] {
  return FEATURES.filter(f => f.highlight);
}

/**
 * Check if a feature is available in a plan
 */
export function isFeatureAvailable(featureId: string, plan: PlanType): boolean {
  const feature = FEATURES.find(f => f.id === featureId);
  return feature ? feature.availableIn.includes(plan) : false;
}

/**
 * Get all feature categories with their features
 */
export function getAllCategoriesWithFeatures(): Array<{
  category: FeatureCategory;
  info: typeof FEATURE_CATEGORIES[FeatureCategory];
  features: Feature[];
}> {
  return Object.entries(FEATURE_CATEGORIES).map(([key, info]) => ({
    category: key as FeatureCategory,
    info,
    features: getFeaturesByCategory(key as FeatureCategory),
  }));
}

