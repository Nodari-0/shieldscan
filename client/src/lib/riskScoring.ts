// ==========================================
// RISK-BASED SCORING ENGINE
// ==========================================
// Combines multiple factors for "Fix this first" prioritization
// Goes beyond CVSS to include business context

export interface RiskFactors {
  // CVSS-like factors
  exploitability: ExploitabilityScore;
  impact: ImpactScore;
  
  // Business context
  exposure: ExposureScore;
  authRequired: boolean;
  dataSensitivity: DataSensitivityLevel;
  environment: EnvironmentType;
  
  // Additional context
  hasKnownExploit: boolean;
  inActiveUse: boolean;
  affectsAuthentication: boolean;
  affectsDataIntegrity: boolean;
}

export type ExploitabilityScore = 'trivial' | 'easy' | 'moderate' | 'difficult' | 'theoretical';
export type ImpactScore = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type ExposureScore = 'internet' | 'external-network' | 'internal-network' | 'local-only';
export type DataSensitivityLevel = 'pii' | 'financial' | 'health' | 'credentials' | 'internal' | 'public';
export type EnvironmentType = 'production' | 'staging' | 'development' | 'test';

export interface RiskScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  priority: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  fixUrgency: string;
  reasoning: string[];
  recommendation: string;
}

// Score mappings
const EXPLOITABILITY_SCORES: Record<ExploitabilityScore, number> = {
  'trivial': 100,      // Script kiddie can exploit
  'easy': 80,          // Requires basic skills
  'moderate': 50,      // Requires security knowledge
  'difficult': 25,     // Requires expert knowledge + conditions
  'theoretical': 5,    // No known practical exploit
};

const IMPACT_SCORES: Record<ImpactScore, number> = {
  'critical': 100,     // Full system compromise
  'high': 75,          // Significant data breach
  'medium': 50,        // Limited data exposure
  'low': 25,           // Minor information leak
  'informational': 5,  // No direct impact
};

const EXPOSURE_MULTIPLIERS: Record<ExposureScore, number> = {
  'internet': 1.0,          // Worst case - fully exposed
  'external-network': 0.8,  // VPN/partner network required
  'internal-network': 0.5,  // Internal only
  'local-only': 0.2,        // Local access required
};

const DATA_SENSITIVITY_SCORES: Record<DataSensitivityLevel, number> = {
  'credentials': 100,  // Auth credentials
  'financial': 90,     // Payment/financial data
  'pii': 80,           // Personal identifiable info
  'health': 85,        // Health records (HIPAA)
  'internal': 40,      // Internal business data
  'public': 10,        // Public information
};

const ENVIRONMENT_MULTIPLIERS: Record<EnvironmentType, number> = {
  'production': 1.0,   // Full weight
  'staging': 0.7,      // Reduced but still important
  'development': 0.3,  // Lower priority
  'test': 0.1,         // Lowest priority
};

// Calculate comprehensive risk score
export function calculateRiskScore(factors: RiskFactors): RiskScore {
  const reasoning: string[] = [];
  
  // Base score from exploitability and impact
  const exploitScore = EXPLOITABILITY_SCORES[factors.exploitability];
  const impactScore = IMPACT_SCORES[factors.impact];
  let baseScore = (exploitScore * 0.4) + (impactScore * 0.6);
  
  reasoning.push(`Base score: ${Math.round(baseScore)} (Exploitability: ${factors.exploitability}, Impact: ${factors.impact})`);
  
  // Apply exposure multiplier
  const exposureMultiplier = EXPOSURE_MULTIPLIERS[factors.exposure];
  baseScore *= exposureMultiplier;
  if (exposureMultiplier < 1) {
    reasoning.push(`Exposure adjusted: ${factors.exposure} (×${exposureMultiplier})`);
  }
  
  // Apply environment multiplier
  const envMultiplier = ENVIRONMENT_MULTIPLIERS[factors.environment];
  baseScore *= envMultiplier;
  if (envMultiplier < 1) {
    reasoning.push(`Environment: ${factors.environment} (×${envMultiplier})`);
  }
  
  // Boost for authentication-related issues
  if (factors.affectsAuthentication) {
    baseScore *= 1.3;
    reasoning.push('Affects authentication (+30%)');
  }
  
  // Boost for known exploits in the wild
  if (factors.hasKnownExploit) {
    baseScore *= 1.5;
    reasoning.push('Known exploit in the wild (+50%)');
  }
  
  // Boost for active exploitation
  if (factors.inActiveUse) {
    baseScore *= 1.8;
    reasoning.push('Actively exploited (+80%)');
  }
  
  // Consider data sensitivity
  const sensitivityScore = DATA_SENSITIVITY_SCORES[factors.dataSensitivity];
  const sensitivityBoost = (sensitivityScore / 100) * 0.2;
  baseScore *= (1 + sensitivityBoost);
  if (sensitivityBoost > 0.1) {
    reasoning.push(`Data sensitivity: ${factors.dataSensitivity} (+${Math.round(sensitivityBoost * 100)}%)`);
  }
  
  // Reduce score if auth is required
  if (factors.authRequired && factors.exposure !== 'internet') {
    baseScore *= 0.8;
    reasoning.push('Authentication required (-20%)');
  }
  
  // Cap at 100
  const finalScore = Math.min(100, Math.round(baseScore));
  
  // Determine grade and priority
  const grade = getGrade(finalScore);
  const priority = getPriority(finalScore);
  const fixUrgency = getFixUrgency(finalScore, factors);
  const recommendation = getRecommendation(priority, factors);
  
  return {
    score: finalScore,
    grade,
    priority,
    fixUrgency,
    reasoning,
    recommendation,
  };
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'F';  // High risk = bad grade
  if (score >= 70) return 'D';
  if (score >= 50) return 'C';
  if (score >= 30) return 'B';
  return 'A';
}

function getPriority(score: number): 'critical' | 'high' | 'medium' | 'low' | 'informational' {
  if (score >= 90) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 25) return 'low';
  return 'informational';
}

function getFixUrgency(score: number, factors: RiskFactors): string {
  if (score >= 90 || factors.inActiveUse) {
    return '🔴 Fix immediately - actively exploitable';
  }
  if (score >= 70 || factors.hasKnownExploit) {
    return '🟠 Fix within 24 hours';
  }
  if (score >= 50) {
    return '🟡 Fix within 7 days';
  }
  if (score >= 25) {
    return '🔵 Fix within 30 days';
  }
  return '⚪ Address when convenient';
}

function getRecommendation(priority: string, factors: RiskFactors): string {
  const recommendations: string[] = [];
  
  if (factors.affectsAuthentication) {
    recommendations.push('Review authentication flow immediately');
  }
  
  if (factors.exposure === 'internet' && priority !== 'informational') {
    recommendations.push('Consider adding WAF or rate limiting');
  }
  
  if (factors.dataSensitivity === 'credentials' || factors.dataSensitivity === 'financial') {
    recommendations.push('Audit data access logs');
  }
  
  if (factors.exploitability === 'trivial') {
    recommendations.push('Apply available patch/fix immediately');
  }
  
  if (factors.hasKnownExploit) {
    recommendations.push('Check IDS/SIEM for exploitation attempts');
  }
  
  return recommendations.length > 0 
    ? recommendations.join('. ') 
    : 'Review and address according to your security policy';
}

// Quick risk assessment from scan check
export function assessCheckRisk(
  checkId: string,
  status: 'passed' | 'warning' | 'failed',
  category: string,
  severity: string,
  environment: EnvironmentType = 'production'
): RiskScore {
  // Map check characteristics to risk factors
  const factors: RiskFactors = {
    exploitability: mapExploitability(checkId, status),
    impact: mapImpact(severity),
    exposure: 'internet', // Default assumption for web scans
    authRequired: false,
    dataSensitivity: mapDataSensitivity(category),
    environment,
    hasKnownExploit: isKnownExploitableVuln(checkId),
    inActiveUse: false,
    affectsAuthentication: isAuthRelated(checkId, category),
    affectsDataIntegrity: isDataIntegrityRelated(checkId),
  };
  
  return calculateRiskScore(factors);
}

// Helper mappings
function mapExploitability(checkId: string, status: string): ExploitabilityScore {
  const trivialExploits = ['basic-xss', 'sqli-test', 'open-redirect'];
  const easyExploits = ['header-xfo', 'cors-policy', 'cookie-security'];
  const moderateExploits = ['header-csp', 'header-hsts', 'tls-version'];
  const difficultExploits = ['dnssec', 'email-dmarc', 'email-spf'];
  
  if (status === 'passed') return 'theoretical';
  
  if (trivialExploits.includes(checkId)) return 'trivial';
  if (easyExploits.includes(checkId)) return 'easy';
  if (moderateExploits.includes(checkId)) return 'moderate';
  if (difficultExploits.includes(checkId)) return 'difficult';
  
  return 'moderate';
}

function mapImpact(severity: string): ImpactScore {
  switch (severity.toLowerCase()) {
    case 'critical': return 'critical';
    case 'high': return 'high';
    case 'medium': return 'medium';
    case 'low': return 'low';
    default: return 'informational';
  }
}

function mapDataSensitivity(category: string): DataSensitivityLevel {
  const sensitiveCategories = ['Authentication', 'Injection', 'Cookie Security'];
  const financialCategories = ['Payment', 'Financial'];
  
  if (sensitiveCategories.some(c => category.includes(c))) return 'credentials';
  if (financialCategories.some(c => category.includes(c))) return 'financial';
  
  return 'internal';
}

function isKnownExploitableVuln(checkId: string): boolean {
  const knownExploitable = [
    'basic-xss',
    'sqli-test',
    'rce-check',
    'file-inclusion',
    'ssrf-check',
  ];
  return knownExploitable.includes(checkId);
}

function isAuthRelated(checkId: string, category: string): boolean {
  const authChecks = ['cookie-security', 'jwt-check', 'session-security', 'auth-bypass'];
  const authCategories = ['Authentication', 'Session', 'Cookie'];
  
  return authChecks.includes(checkId) || authCategories.some(c => category.includes(c));
}

function isDataIntegrityRelated(checkId: string): boolean {
  const integrityChecks = ['sqli-test', 'header-csp', 'input-validation'];
  return integrityChecks.includes(checkId);
}

// Priority sort function for checks
export function sortByRiskPriority<T extends { riskScore?: RiskScore }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const scoreA = a.riskScore?.score || 0;
    const scoreB = b.riskScore?.score || 0;
    return scoreB - scoreA; // Highest risk first
  });
}

// Get "Fix This First" recommendation
export function getFixThisFirst<T extends { id: string; riskScore?: RiskScore }>(
  items: T[],
  limit: number = 3
): T[] {
  const sorted = sortByRiskPriority(items);
  return sorted
    .filter(item => item.riskScore && item.riskScore.score >= 50)
    .slice(0, limit);
}

