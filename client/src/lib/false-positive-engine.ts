// ==========================================
// FALSE POSITIVE DEFENSE ENGINE
// ==========================================
// ML-assisted scoring, dismissal taxonomy, suppression rules

export interface FalsePositiveRule {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: RuleType;
  scope: RuleScope;
  condition: RuleCondition;
  action: 'suppress' | 'downgrade' | 'flag_review';
  enabled: boolean;
  createdAt: string;
  createdBy: string;
  matchCount: number;
  lastMatched?: string;
}

export type RuleType = 
  | 'global'
  | 'asset_specific'
  | 'vulnerability_type'
  | 'severity_based'
  | 'pattern_match';

export interface RuleScope {
  assets?: string[]; // Asset IDs or URL patterns
  vulnerabilityTypes?: string[];
  severities?: string[];
  categories?: string[];
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'matches' | 'not_contains';
  value: string;
  caseSensitive?: boolean;
}

export interface DismissedFinding {
  id: string;
  findingId: string;
  scanId: string;
  dismissedAt: string;
  dismissedBy: string;
  reason: DismissalReason;
  notes?: string;
  ruleId?: string; // If auto-dismissed by rule
  reviewRequired: boolean;
  expiresAt?: string; // Temporary dismissal
}

export type DismissalReason = 
  | 'false_positive'
  | 'accepted_risk'
  | 'compensating_control'
  | 'not_applicable'
  | 'fixed_in_pipeline'
  | 'third_party_dependency'
  | 'test_environment'
  | 'duplicate'
  | 'wontfix';

export interface FalsePositiveScore {
  findingId: string;
  score: number; // 0-100, higher = more likely FP
  confidence: 'high' | 'medium' | 'low';
  factors: ScoreFactor[];
  recommendation: 'review' | 'likely_fp' | 'likely_real';
}

export interface ScoreFactor {
  name: string;
  weight: number;
  value: boolean;
  description: string;
}

export interface FPMetrics {
  totalDismissed: number;
  byReason: Record<DismissalReason, number>;
  autoSuppressed: number;
  manuallyDismissed: number;
  reinstated: number;
  avgTimeToReview: number; // hours
}

// Storage keys
const RULES_KEY = 'shieldscan_fp_rules';
const DISMISSED_KEY = 'shieldscan_dismissed_findings';
const METRICS_KEY = 'shieldscan_fp_metrics';

// Dismissal reasons with labels
export const DISMISSAL_REASONS: Record<DismissalReason, { label: string; description: string; icon: string }> = {
  'false_positive': { 
    label: 'False Positive', 
    description: 'The finding is incorrect - no actual vulnerability exists',
    icon: '🚫'
  },
  'accepted_risk': { 
    label: 'Accepted Risk', 
    description: 'Risk acknowledged and accepted by security team',
    icon: '✅'
  },
  'compensating_control': { 
    label: 'Compensating Control', 
    description: 'Mitigated by another security control',
    icon: '🛡️'
  },
  'not_applicable': { 
    label: 'Not Applicable', 
    description: 'Finding does not apply to this context',
    icon: '❌'
  },
  'fixed_in_pipeline': { 
    label: 'Fixed in Pipeline', 
    description: 'Fix deployed but not yet scanned',
    icon: '🔄'
  },
  'third_party_dependency': { 
    label: 'Third Party', 
    description: 'Issue in third-party code outside our control',
    icon: '📦'
  },
  'test_environment': { 
    label: 'Test Environment', 
    description: 'Only present in non-production environment',
    icon: '🧪'
  },
  'duplicate': { 
    label: 'Duplicate', 
    description: 'Same issue reported elsewhere',
    icon: '📋'
  },
  'wontfix': { 
    label: "Won't Fix", 
    description: 'Decided not to fix for business reasons',
    icon: '🚷'
  },
};

// ==========================================
// FALSE POSITIVE RULES
// ==========================================

export function getFPRules(): FalsePositiveRule[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RULES_KEY);
    return stored ? JSON.parse(stored) : getDefaultRules();
  } catch {
    return getDefaultRules();
  }
}

export function saveFPRules(rules: FalsePositiveRule[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

export function addFPRule(rule: Omit<FalsePositiveRule, 'id' | 'createdAt' | 'matchCount'>): FalsePositiveRule {
  const newRule: FalsePositiveRule = {
    ...rule,
    id: `fpr_${Date.now()}`,
    createdAt: new Date().toISOString(),
    matchCount: 0,
  };

  const rules = getFPRules();
  rules.push(newRule);
  saveFPRules(rules);

  return newRule;
}

export function updateFPRule(ruleId: string, updates: Partial<FalsePositiveRule>): FalsePositiveRule | null {
  const rules = getFPRules();
  const index = rules.findIndex(r => r.id === ruleId);
  if (index === -1) return null;

  rules[index] = { ...rules[index], ...updates };
  saveFPRules(rules);

  return rules[index];
}

export function deleteFPRule(ruleId: string): boolean {
  const rules = getFPRules();
  const filtered = rules.filter(r => r.id !== ruleId);
  if (filtered.length === rules.length) return false;

  saveFPRules(filtered);
  return true;
}

function getDefaultRules(): FalsePositiveRule[] {
  return [
    {
      id: 'fpr_default_1',
      organizationId: 'default',
      name: 'Suppress CDN headers',
      description: 'Ignore missing headers on CDN-served assets',
      type: 'pattern_match',
      scope: {},
      condition: { field: 'url', operator: 'contains', value: 'cdn.' },
      action: 'suppress',
      enabled: true,
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      matchCount: 0,
    },
    {
      id: 'fpr_default_2',
      organizationId: 'default',
      name: 'Downgrade informational DNSSEC',
      description: 'DNSSEC is informational, not a vulnerability',
      type: 'vulnerability_type',
      scope: { vulnerabilityTypes: ['dnssec'] },
      condition: { field: 'category', operator: 'equals', value: 'compliance' },
      action: 'downgrade',
      enabled: true,
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      matchCount: 0,
    },
  ];
}

// ==========================================
// DISMISSALS
// ==========================================

export function getDismissedFindings(): DismissedFinding[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function dismissFinding(
  findingId: string,
  scanId: string,
  reason: DismissalReason,
  dismissedBy: string,
  options?: {
    notes?: string;
    ruleId?: string;
    expiresInDays?: number;
  }
): DismissedFinding {
  const dismissed: DismissedFinding = {
    id: `dis_${Date.now()}`,
    findingId,
    scanId,
    dismissedAt: new Date().toISOString(),
    dismissedBy,
    reason,
    notes: options?.notes,
    ruleId: options?.ruleId,
    reviewRequired: reason === 'accepted_risk' || reason === 'wontfix',
    expiresAt: options?.expiresInDays 
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
  };

  const findings = getDismissedFindings();
  findings.push(dismissed);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(findings));
  }

  updateMetrics('dismiss', reason);
  return dismissed;
}

export function reinstateFinding(dismissalId: string): boolean {
  const findings = getDismissedFindings();
  const filtered = findings.filter(f => f.id !== dismissalId);
  
  if (filtered.length === findings.length) return false;
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(filtered));
  }

  updateMetrics('reinstate');
  return true;
}

export function isFindingDismissed(findingId: string): DismissedFinding | null {
  const findings = getDismissedFindings();
  const dismissed = findings.find(f => f.findingId === findingId);
  
  if (!dismissed) return null;
  
  // Check expiration
  if (dismissed.expiresAt && new Date(dismissed.expiresAt) < new Date()) {
    reinstateFinding(dismissed.id);
    return null;
  }
  
  return dismissed;
}

// ==========================================
// FALSE POSITIVE SCORING (ML-Assisted)
// ==========================================

export function calculateFPScore(finding: {
  id: string;
  name: string;
  category: string;
  severity: string;
  message?: string;
  url?: string;
  evidence?: any;
}): FalsePositiveScore {
  const factors: ScoreFactor[] = [];
  let totalScore = 0;

  // Factor 1: Has evidence
  const hasEvidence = !!finding.evidence?.request || !!finding.evidence?.response;
  factors.push({
    name: 'Evidence Present',
    weight: -30,
    value: hasEvidence,
    description: hasEvidence ? 'Finding has request/response evidence' : 'No evidence captured',
  });
  if (!hasEvidence) totalScore += 30;

  // Factor 2: Informational severity
  const isInfo = finding.severity === 'info' || finding.severity === 'low';
  factors.push({
    name: 'Low Severity',
    weight: 20,
    value: isInfo,
    description: isInfo ? 'Low/info severity findings have higher FP rate' : 'Medium+ severity',
  });
  if (isInfo) totalScore += 20;

  // Factor 3: Best practice vs vulnerability
  const isBestPractice = finding.category?.toLowerCase().includes('best practice') || 
                         finding.category?.toLowerCase().includes('informational');
  factors.push({
    name: 'Best Practice Category',
    weight: 15,
    value: isBestPractice,
    description: isBestPractice ? 'Best practices are not vulnerabilities' : 'Security category',
  });
  if (isBestPractice) totalScore += 15;

  // Factor 4: Previously dismissed similar
  const similarDismissed = getDismissedFindings().some(d => 
    d.findingId.includes(finding.name.toLowerCase().replace(/\s+/g, '_'))
  );
  factors.push({
    name: 'Similar Dismissed',
    weight: 25,
    value: similarDismissed,
    description: similarDismissed ? 'Similar finding was dismissed before' : 'No similar dismissals',
  });
  if (similarDismissed) totalScore += 25;

  // Factor 5: CDN/third-party URL
  const isThirdParty = finding.url?.includes('cdn.') || 
                       finding.url?.includes('cloudflare') ||
                       finding.url?.includes('akamai');
  factors.push({
    name: 'Third-Party Asset',
    weight: 20,
    value: isThirdParty,
    description: isThirdParty ? 'CDN/third-party may have different controls' : 'First-party asset',
  });
  if (isThirdParty) totalScore += 20;

  // Cap at 100
  totalScore = Math.min(100, Math.max(0, totalScore));

  // Determine confidence
  const confidence: 'high' | 'medium' | 'low' = 
    factors.filter(f => f.value).length >= 3 ? 'high' :
    factors.filter(f => f.value).length >= 2 ? 'medium' : 'low';

  // Recommendation
  const recommendation: FalsePositiveScore['recommendation'] =
    totalScore >= 70 ? 'likely_fp' :
    totalScore >= 40 ? 'review' : 'likely_real';

  return {
    findingId: finding.id,
    score: totalScore,
    confidence,
    factors,
    recommendation,
  };
}

// ==========================================
// RULE MATCHING
// ==========================================

export function matchRules(finding: {
  id: string;
  name: string;
  category: string;
  severity: string;
  url?: string;
}): FalsePositiveRule[] {
  const rules = getFPRules().filter(r => r.enabled);
  const matched: FalsePositiveRule[] = [];

  for (const rule of rules) {
    let isMatch = true;

    // Check scope
    if (rule.scope.vulnerabilityTypes?.length) {
      if (!rule.scope.vulnerabilityTypes.some(t => 
        finding.name.toLowerCase().includes(t.toLowerCase())
      )) {
        isMatch = false;
      }
    }

    if (rule.scope.severities?.length) {
      if (!rule.scope.severities.includes(finding.severity)) {
        isMatch = false;
      }
    }

    if (rule.scope.categories?.length) {
      if (!rule.scope.categories.includes(finding.category)) {
        isMatch = false;
      }
    }

    // Check condition
    if (isMatch && rule.condition) {
      const fieldValue = (finding as any)[rule.condition.field] || '';
      const condValue = rule.condition.value;
      const caseSensitive = rule.condition.caseSensitive ?? false;

      const compareField = caseSensitive ? fieldValue : fieldValue.toLowerCase();
      const compareValue = caseSensitive ? condValue : condValue.toLowerCase();

      switch (rule.condition.operator) {
        case 'equals':
          isMatch = compareField === compareValue;
          break;
        case 'contains':
          isMatch = compareField.includes(compareValue);
          break;
        case 'matches':
          try {
            isMatch = new RegExp(condValue, caseSensitive ? '' : 'i').test(fieldValue);
          } catch {
            isMatch = false;
          }
          break;
        case 'not_contains':
          isMatch = !compareField.includes(compareValue);
          break;
      }
    }

    if (isMatch) {
      matched.push(rule);
      // Update match count
      rule.matchCount++;
      rule.lastMatched = new Date().toISOString();
    }
  }

  // Save updated rules
  if (matched.length > 0) {
    saveFPRules(getFPRules().map(r => {
      const updated = matched.find(m => m.id === r.id);
      return updated || r;
    }));
  }

  return matched;
}

// ==========================================
// METRICS
// ==========================================

export function getFPMetrics(): FPMetrics {
  if (typeof window === 'undefined') {
    return getDefaultMetrics();
  }
  try {
    const stored = localStorage.getItem(METRICS_KEY);
    return stored ? JSON.parse(stored) : getDefaultMetrics();
  } catch {
    return getDefaultMetrics();
  }
}

function getDefaultMetrics(): FPMetrics {
  return {
    totalDismissed: 0,
    byReason: {
      'false_positive': 0,
      'accepted_risk': 0,
      'compensating_control': 0,
      'not_applicable': 0,
      'fixed_in_pipeline': 0,
      'third_party_dependency': 0,
      'test_environment': 0,
      'duplicate': 0,
      'wontfix': 0,
    },
    autoSuppressed: 0,
    manuallyDismissed: 0,
    reinstated: 0,
    avgTimeToReview: 0,
  };
}

function updateMetrics(action: 'dismiss' | 'reinstate', reason?: DismissalReason): void {
  const metrics = getFPMetrics();

  if (action === 'dismiss' && reason) {
    metrics.totalDismissed++;
    metrics.byReason[reason]++;
    metrics.manuallyDismissed++;
  } else if (action === 'reinstate') {
    metrics.reinstated++;
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
  }
}

// Alert fatigue reduction calculation
export function getAlertFatigueReduction(): number {
  const metrics = getFPMetrics();
  const dismissed = getDismissedFindings();
  const rules = getFPRules();
  
  // Calculate based on auto-suppressed and dismissed
  const totalSuppressed = metrics.autoSuppressed + dismissed.length;
  const ruleMatches = rules.reduce((sum, r) => sum + r.matchCount, 0);
  
  // Estimate: each suppression saves ~10 mins of review
  const minutesSaved = totalSuppressed * 10 + ruleMatches * 5;
  
  // Return percentage reduction (capped at 60%)
  return Math.min(60, Math.round((minutesSaved / Math.max(minutesSaved + 100, 1)) * 100));
}

