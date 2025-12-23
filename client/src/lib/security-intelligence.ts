// ==========================================
// SECURITY INTELLIGENCE ENGINE
// ==========================================
// Posture scoring, attack surface tracking, risk velocity, benchmarking

export interface SecurityPosture {
  score: number;
  previousScore?: number;
  trend: 'improving' | 'stable' | 'degrading';
  breakdown: PostureBreakdown;
  timestamp: string;
}

export interface PostureBreakdown {
  tls: number;
  headers: number;
  authentication: number;
  encryption: number;
  compliance: number;
  vulnerabilities: number;
}

export interface PostureHistory {
  date: string;
  score: number;
  breakdown: PostureBreakdown;
  events: string[];
}

export interface AttackSurface {
  totalAssets: number;
  exposedEndpoints: number;
  openPorts: number;
  subdomains: number;
  ipAddresses: number;
  technologies: string[];
  riskDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  growth: SurfaceGrowth;
}

export interface SurfaceGrowth {
  period: 'week' | 'month' | 'quarter';
  assetsAdded: number;
  assetsRemoved: number;
  netChange: number;
  percentChange: number;
}

export interface RiskVelocity {
  current: number; // Risk per day
  average: number;
  trend: 'accelerating' | 'steady' | 'decelerating';
  projection: {
    days30: number;
    days60: number;
    days90: number;
  };
  alerts: VelocityAlert[];
}

export interface VelocityAlert {
  type: 'spike' | 'sustained_increase' | 'threshold_breach';
  message: string;
  severity: 'warning' | 'critical';
  timestamp: string;
}

export interface IndustryBenchmark {
  industry: string;
  percentile: number;
  averageScore: number;
  topQuartileScore: number;
  yourScore: number;
  comparison: {
    category: string;
    industry: number;
    yours: number;
    delta: number;
  }[];
}

export interface PredictiveRisk {
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  probability: number;
  factors: PredictiveFactor[];
  recommendation: string;
}

export interface PredictiveFactor {
  name: string;
  impact: 'positive' | 'negative';
  weight: number;
  description: string;
}

// Storage keys
const POSTURE_HISTORY_KEY = 'shieldscan_posture_history';
const BENCHMARK_KEY = 'shieldscan_benchmark';

// ==========================================
// SECURITY POSTURE
// ==========================================

export function calculateSecurityPosture(scanResults?: any): SecurityPosture {
  // Get history for trend
  const history = getPostureHistory();
  const previousScore = history.length > 0 ? history[history.length - 1].score : undefined;

  // Calculate breakdown (mock data - in production, from actual scans)
  const breakdown: PostureBreakdown = {
    tls: 85 + Math.floor(Math.random() * 15),
    headers: 70 + Math.floor(Math.random() * 20),
    authentication: 80 + Math.floor(Math.random() * 15),
    encryption: 90 + Math.floor(Math.random() * 10),
    compliance: 65 + Math.floor(Math.random() * 25),
    vulnerabilities: 75 + Math.floor(Math.random() * 20),
  };

  // Calculate overall score (weighted average)
  const weights = { tls: 0.2, headers: 0.15, authentication: 0.2, encryption: 0.15, compliance: 0.15, vulnerabilities: 0.15 };
  const score = Math.round(
    Object.entries(breakdown).reduce((sum, [key, value]) => {
      return sum + value * (weights[key as keyof typeof weights] || 0.1);
    }, 0)
  );

  // Determine trend
  let trend: SecurityPosture['trend'] = 'stable';
  if (previousScore !== undefined) {
    if (score - previousScore > 3) trend = 'improving';
    else if (previousScore - score > 3) trend = 'degrading';
  }

  return {
    score,
    previousScore,
    trend,
    breakdown,
    timestamp: new Date().toISOString(),
  };
}

export function getPostureHistory(): PostureHistory[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(POSTURE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : generateHistoricalData();
  } catch {
    return generateHistoricalData();
  }
}

export function addPostureSnapshot(posture: SecurityPosture): void {
  if (typeof window === 'undefined') return;
  
  const history = getPostureHistory();
  const today = new Date().toISOString().split('T')[0];
  
  // Only one entry per day
  const existingIndex = history.findIndex(h => h.date === today);
  const entry: PostureHistory = {
    date: today,
    score: posture.score,
    breakdown: posture.breakdown,
    events: [],
  };

  if (existingIndex >= 0) {
    history[existingIndex] = entry;
  } else {
    history.push(entry);
  }

  // Keep last 90 days
  const trimmed = history.slice(-90);
  localStorage.setItem(POSTURE_HISTORY_KEY, JSON.stringify(trimmed));
}

function generateHistoricalData(): PostureHistory[] {
  const history: PostureHistory[] = [];
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate realistic trending data
    const baseScore = 70 + Math.floor(i * 0.3) + Math.floor(Math.random() * 10);
    
    history.push({
      date: date.toISOString().split('T')[0],
      score: Math.min(100, baseScore),
      breakdown: {
        tls: 80 + Math.floor(Math.random() * 15),
        headers: 65 + Math.floor(Math.random() * 20),
        authentication: 75 + Math.floor(Math.random() * 15),
        encryption: 85 + Math.floor(Math.random() * 10),
        compliance: 60 + Math.floor(Math.random() * 25),
        vulnerabilities: 70 + Math.floor(Math.random() * 20),
      },
      events: [],
    });
  }
  
  return history;
}

// ==========================================
// ATTACK SURFACE
// ==========================================

export function calculateAttackSurface(): AttackSurface {
  // Mock data - in production, aggregate from asset inventory and scans
  return {
    totalAssets: 12,
    exposedEndpoints: 47,
    openPorts: 23,
    subdomains: 8,
    ipAddresses: 4,
    technologies: ['Nginx', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
    riskDistribution: {
      critical: 1,
      high: 3,
      medium: 8,
      low: 15,
    },
    growth: {
      period: 'month',
      assetsAdded: 3,
      assetsRemoved: 1,
      netChange: 2,
      percentChange: 20,
    },
  };
}

// ==========================================
// RISK VELOCITY
// ==========================================

export function calculateRiskVelocity(): RiskVelocity {
  const history = getPostureHistory();
  
  // Calculate daily risk change
  let velocities: number[] = [];
  for (let i = 1; i < history.length; i++) {
    const change = history[i - 1].score - history[i].score;
    velocities.push(Math.max(0, change)); // Only count negative changes as risk
  }
  
  const current = velocities.length > 0 ? velocities[velocities.length - 1] : 0;
  const average = velocities.length > 0 
    ? velocities.reduce((a, b) => a + b, 0) / velocities.length 
    : 0;
  
  // Determine trend
  let trend: RiskVelocity['trend'] = 'steady';
  if (velocities.length >= 7) {
    const recent = velocities.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const older = velocities.slice(-14, -7).reduce((a, b) => a + b, 0) / 7;
    if (recent > older * 1.2) trend = 'accelerating';
    else if (recent < older * 0.8) trend = 'decelerating';
  }
  
  // Projections
  const projection = {
    days30: Math.round(current * 30),
    days60: Math.round(current * 60 * 0.9), // Assume some remediation
    days90: Math.round(current * 90 * 0.8),
  };
  
  // Alerts
  const alerts: VelocityAlert[] = [];
  if (current > average * 2) {
    alerts.push({
      type: 'spike',
      message: 'Risk velocity spike detected - 2x above average',
      severity: 'warning',
      timestamp: new Date().toISOString(),
    });
  }
  
  return {
    current: Math.round(current * 10) / 10,
    average: Math.round(average * 10) / 10,
    trend,
    projection,
    alerts,
  };
}

// ==========================================
// INDUSTRY BENCHMARKING
// ==========================================

export const INDUSTRY_BENCHMARKS: Record<string, { average: number; topQuartile: number }> = {
  'technology': { average: 72, topQuartile: 85 },
  'financial_services': { average: 78, topQuartile: 90 },
  'healthcare': { average: 68, topQuartile: 82 },
  'retail': { average: 65, topQuartile: 78 },
  'manufacturing': { average: 62, topQuartile: 75 },
  'government': { average: 70, topQuartile: 84 },
  'education': { average: 60, topQuartile: 73 },
  'media': { average: 67, topQuartile: 80 },
};

export function getBenchmark(industry: string = 'technology'): IndustryBenchmark {
  const posture = calculateSecurityPosture();
  const benchmark = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS['technology'];
  
  // Calculate percentile
  const percentile = Math.min(99, Math.max(1, Math.round(
    50 + ((posture.score - benchmark.average) / (benchmark.topQuartile - benchmark.average)) * 25
  )));
  
  // Category comparison
  const comparison = [
    { category: 'TLS/SSL', industry: 75, yours: posture.breakdown.tls, delta: posture.breakdown.tls - 75 },
    { category: 'Security Headers', industry: 68, yours: posture.breakdown.headers, delta: posture.breakdown.headers - 68 },
    { category: 'Authentication', industry: 72, yours: posture.breakdown.authentication, delta: posture.breakdown.authentication - 72 },
    { category: 'Encryption', industry: 80, yours: posture.breakdown.encryption, delta: posture.breakdown.encryption - 80 },
    { category: 'Compliance', industry: 70, yours: posture.breakdown.compliance, delta: posture.breakdown.compliance - 70 },
  ];
  
  return {
    industry: industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    percentile,
    averageScore: benchmark.average,
    topQuartileScore: benchmark.topQuartile,
    yourScore: posture.score,
    comparison,
  };
}

export function saveBenchmarkIndustry(industry: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BENCHMARK_KEY, industry);
}

export function getBenchmarkIndustry(): string {
  if (typeof window === 'undefined') return 'technology';
  return localStorage.getItem(BENCHMARK_KEY) || 'technology';
}

// ==========================================
// PREDICTIVE RISK
// ==========================================

export function predictRisk(): PredictiveRisk {
  const posture = calculateSecurityPosture();
  const velocity = calculateRiskVelocity();
  const surface = calculateAttackSurface();
  
  const factors: PredictiveFactor[] = [];
  let riskScore = 0;
  
  // Factor 1: Current posture
  if (posture.score < 70) {
    factors.push({
      name: 'Below-average security posture',
      impact: 'negative',
      weight: 30,
      description: `Current score of ${posture.score} is below the recommended 70`,
    });
    riskScore += 30;
  } else {
    factors.push({
      name: 'Good security posture',
      impact: 'positive',
      weight: -15,
      description: `Current score of ${posture.score} meets security standards`,
    });
    riskScore -= 15;
  }
  
  // Factor 2: Risk velocity
  if (velocity.trend === 'accelerating') {
    factors.push({
      name: 'Accelerating risk velocity',
      impact: 'negative',
      weight: 25,
      description: 'New vulnerabilities being introduced faster than remediation',
    });
    riskScore += 25;
  } else if (velocity.trend === 'decelerating') {
    factors.push({
      name: 'Improving risk management',
      impact: 'positive',
      weight: -10,
      description: 'Remediation outpacing new vulnerability introduction',
    });
    riskScore -= 10;
  }
  
  // Factor 3: Attack surface growth
  if (surface.growth.percentChange > 10) {
    factors.push({
      name: 'Rapid attack surface expansion',
      impact: 'negative',
      weight: 20,
      description: `${surface.growth.percentChange}% growth in attack surface this ${surface.growth.period}`,
    });
    riskScore += 20;
  }
  
  // Factor 4: Critical vulnerabilities
  if (surface.riskDistribution.critical > 0) {
    factors.push({
      name: 'Unresolved critical vulnerabilities',
      impact: 'negative',
      weight: 35,
      description: `${surface.riskDistribution.critical} critical vulnerabilities require immediate attention`,
    });
    riskScore += 35;
  }
  
  // Normalize score to probability
  const probability = Math.min(95, Math.max(5, riskScore));
  
  // Determine risk level
  let riskLevel: PredictiveRisk['riskLevel'];
  if (probability >= 70) riskLevel = 'critical';
  else if (probability >= 50) riskLevel = 'high';
  else if (probability >= 30) riskLevel = 'medium';
  else riskLevel = 'low';
  
  // Generate recommendation
  const recommendations: Record<PredictiveRisk['riskLevel'], string> = {
    critical: 'Immediate action required. Focus on critical vulnerabilities and reduce attack surface.',
    high: 'Prioritize remediation of high-severity findings. Consider additional security controls.',
    medium: 'Continue regular security maintenance. Address medium-severity findings within 30 days.',
    low: 'Maintain current security practices. Monitor for new threats.',
  };
  
  return {
    riskLevel,
    probability,
    factors,
    recommendation: recommendations[riskLevel],
  };
}

