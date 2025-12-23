// ==========================================
// REAL-TIME THREAT MONITORING ENGINE
// ==========================================
// Live security monitoring, alerts, and threat intelligence

export interface ThreatEvent {
  id: string;
  type: ThreatEventType;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  timestamp: string;
  source: string;
  target: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  acknowledged: boolean;
  resolvedAt?: string;
}

export type ThreatEventType = 
  | 'new_vulnerability'
  | 'ssl_expiring'
  | 'ssl_expired'
  | 'downtime_detected'
  | 'security_degradation'
  | 'new_asset_discovered'
  | 'config_change'
  | 'suspicious_activity'
  | 'compliance_violation'
  | 'certificate_transparency';

export interface MonitoringTarget {
  id: string;
  url: string;
  name: string;
  enabled: boolean;
  checkInterval: number; // minutes
  lastCheck?: string;
  nextCheck?: string;
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  uptime: number; // percentage
  responseTime: number; // ms average
  sslExpiry?: string;
  lastScore?: number;
  alerts: AlertConfig[];
}

export interface AlertConfig {
  id: string;
  name: string;
  condition: AlertCondition;
  channels: AlertChannel[];
  enabled: boolean;
  cooldown: number; // minutes between alerts
  lastTriggered?: string;
}

export type AlertCondition = 
  | { type: 'score_below'; threshold: number }
  | { type: 'new_vulnerability'; minSeverity: string }
  | { type: 'ssl_expiry'; daysBeforeExpiry: number }
  | { type: 'downtime' }
  | { type: 'response_time'; thresholdMs: number };

export type AlertChannel = 
  | { type: 'email'; address: string }
  | { type: 'slack'; webhookUrl: string; channel?: string }
  | { type: 'webhook'; url: string; headers?: Record<string, string> }
  | { type: 'pagerduty'; routingKey: string }
  | { type: 'discord'; webhookUrl: string }
  | { type: 'teams'; webhookUrl: string };

export interface SecurityTrend {
  date: string;
  score: number;
  vulnerabilities: number;
  passedChecks: number;
  failedChecks: number;
}

export interface ThreatIntelligence {
  lastUpdated: string;
  emergingThreats: EmergingThreat[];
  affectedAssets: string[];
}

export interface EmergingThreat {
  id: string;
  name: string;
  cve?: string;
  severity: string;
  description: string;
  affectedTechnologies: string[];
  mitigations: string[];
  references: string[];
  publishedAt: string;
}

// Storage keys
const EVENTS_KEY = 'shieldscan_threat_events';
const TARGETS_KEY = 'shieldscan_monitoring_targets';
const TRENDS_KEY = 'shieldscan_security_trends';

// ==========================================
// THREAT EVENTS
// ==========================================

export function getThreatEvents(limit?: number): ThreatEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    const events = stored ? JSON.parse(stored) : [];
    return limit ? events.slice(0, limit) : events;
  } catch {
    return [];
  }
}

export function addThreatEvent(event: Omit<ThreatEvent, 'id' | 'timestamp' | 'acknowledged'>): ThreatEvent {
  const newEvent: ThreatEvent = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
    acknowledged: false,
  };

  const events = getThreatEvents();
  events.unshift(newEvent);
  
  // Keep last 500 events
  const trimmed = events.slice(0, 500);
  if (typeof window !== 'undefined') {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  }

  return newEvent;
}

export function acknowledgeEvent(eventId: string): boolean {
  const events = getThreatEvents();
  const index = events.findIndex(e => e.id === eventId);
  if (index === -1) return false;

  events[index].acknowledged = true;
  if (typeof window !== 'undefined') {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }
  return true;
}

export function resolveEvent(eventId: string): boolean {
  const events = getThreatEvents();
  const index = events.findIndex(e => e.id === eventId);
  if (index === -1) return false;

  events[index].resolvedAt = new Date().toISOString();
  events[index].acknowledged = true;
  if (typeof window !== 'undefined') {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }
  return true;
}

export function getUnacknowledgedCount(): number {
  return getThreatEvents().filter(e => !e.acknowledged).length;
}

export function getCriticalEventsCount(): number {
  return getThreatEvents().filter(e => 
    !e.resolvedAt && (e.severity === 'critical' || e.severity === 'high')
  ).length;
}

// ==========================================
// MONITORING TARGETS
// ==========================================

export function getMonitoringTargets(): MonitoringTarget[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(TARGETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addMonitoringTarget(target: Omit<MonitoringTarget, 'id' | 'status' | 'uptime' | 'responseTime' | 'alerts'>): MonitoringTarget {
  const newTarget: MonitoringTarget = {
    ...target,
    id: `mon_${Date.now()}`,
    status: 'unknown',
    uptime: 100,
    responseTime: 0,
    alerts: [],
  };

  const targets = getMonitoringTargets();
  targets.push(newTarget);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
  }

  return newTarget;
}

export function updateMonitoringTarget(id: string, updates: Partial<MonitoringTarget>): MonitoringTarget | null {
  const targets = getMonitoringTargets();
  const index = targets.findIndex(t => t.id === id);
  if (index === -1) return null;

  targets[index] = { ...targets[index], ...updates };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
  }

  return targets[index];
}

export function removeMonitoringTarget(id: string): boolean {
  const targets = getMonitoringTargets();
  const filtered = targets.filter(t => t.id !== id);
  
  if (filtered.length === targets.length) return false;
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(TARGETS_KEY, JSON.stringify(filtered));
  }
  return true;
}

// ==========================================
// SECURITY TRENDS
// ==========================================

export function getSecurityTrends(days: number = 30): SecurityTrend[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(TRENDS_KEY);
    const trends: SecurityTrend[] = stored ? JSON.parse(stored) : [];
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return trends.filter(t => new Date(t.date) >= cutoff);
  } catch {
    return [];
  }
}

export function addSecurityTrend(trend: SecurityTrend): void {
  if (typeof window === 'undefined') return;
  
  const trends = getSecurityTrends(90); // Keep 90 days
  
  // Replace if same date exists
  const existingIndex = trends.findIndex(t => t.date === trend.date);
  if (existingIndex >= 0) {
    trends[existingIndex] = trend;
  } else {
    trends.push(trend);
  }
  
  // Sort by date
  trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  localStorage.setItem(TRENDS_KEY, JSON.stringify(trends));
}

// ==========================================
// REAL-TIME SIMULATION (for demo)
// ==========================================

let simulationInterval: NodeJS.Timeout | null = null;

export function startRealtimeSimulation(): void {
  if (simulationInterval) return;

  // Generate initial events if empty
  if (getThreatEvents().length === 0) {
    generateSampleEvents();
  }

  // Simulate real-time events
  simulationInterval = setInterval(() => {
    if (Math.random() < 0.3) { // 30% chance every 10 seconds
      const eventTypes: Array<{ type: ThreatEventType; severity: ThreatEvent['severity'] }> = [
        { type: 'new_vulnerability', severity: 'high' },
        { type: 'ssl_expiring', severity: 'medium' },
        { type: 'security_degradation', severity: 'medium' },
        { type: 'config_change', severity: 'low' },
        { type: 'new_asset_discovered', severity: 'info' },
      ];

      const { type, severity } = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      addThreatEvent({
        type,
        severity,
        source: 'Continuous Monitoring',
        target: ['example.com', 'api.example.com', 'app.example.com'][Math.floor(Math.random() * 3)],
        title: getEventTitle(type),
        description: getEventDescription(type),
      });
    }
  }, 10000);
}

export function stopRealtimeSimulation(): void {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

function generateSampleEvents(): void {
  const sampleEvents = [
    {
      type: 'new_vulnerability' as const,
      severity: 'high' as const,
      source: 'Scheduled Scan',
      target: 'api.example.com',
      title: 'New High Severity Vulnerability Detected',
      description: 'Missing HSTS header on API endpoint. Potential for downgrade attacks.',
    },
    {
      type: 'ssl_expiring' as const,
      severity: 'medium' as const,
      source: 'Certificate Monitor',
      target: 'example.com',
      title: 'SSL Certificate Expiring Soon',
      description: 'Certificate expires in 14 days. Renewal recommended.',
    },
    {
      type: 'new_asset_discovered' as const,
      severity: 'info' as const,
      source: 'Asset Discovery',
      target: 'staging.example.com',
      title: 'New Subdomain Discovered',
      description: 'New asset detected: staging.example.com. Added to monitoring.',
    },
  ];

  sampleEvents.forEach((event, i) => {
    setTimeout(() => addThreatEvent(event), i * 100);
  });
}

function getEventTitle(type: ThreatEventType): string {
  const titles: Record<ThreatEventType, string> = {
    new_vulnerability: 'New Vulnerability Detected',
    ssl_expiring: 'SSL Certificate Expiring',
    ssl_expired: 'SSL Certificate Expired',
    downtime_detected: 'Service Downtime Detected',
    security_degradation: 'Security Score Degraded',
    new_asset_discovered: 'New Asset Discovered',
    config_change: 'Configuration Change Detected',
    suspicious_activity: 'Suspicious Activity Detected',
    compliance_violation: 'Compliance Violation',
    certificate_transparency: 'New Certificate Issued',
  };
  return titles[type];
}

function getEventDescription(type: ThreatEventType): string {
  const descriptions: Record<ThreatEventType, string> = {
    new_vulnerability: 'A new security issue has been identified during continuous monitoring.',
    ssl_expiring: 'SSL certificate is approaching expiration. Plan for renewal.',
    ssl_expired: 'SSL certificate has expired. Immediate action required.',
    downtime_detected: 'Target is not responding to health checks.',
    security_degradation: 'Security score has decreased from previous scan.',
    new_asset_discovered: 'A new subdomain or asset has been discovered.',
    config_change: 'Security headers or configuration has changed.',
    suspicious_activity: 'Unusual patterns detected in security checks.',
    compliance_violation: 'Configuration no longer meets compliance requirements.',
    certificate_transparency: 'A new certificate was issued for this domain.',
  };
  return descriptions[type];
}

// ==========================================
// THREAT INTELLIGENCE (Mock Data)
// ==========================================

export function getEmergingThreats(): EmergingThreat[] {
  return [
    {
      id: 'threat_1',
      name: 'Log4Shell (Log4j RCE)',
      cve: 'CVE-2021-44228',
      severity: 'critical',
      description: 'Remote code execution vulnerability in Apache Log4j library.',
      affectedTechnologies: ['Java', 'Log4j', 'Spring Boot'],
      mitigations: [
        'Upgrade to Log4j 2.17.0 or later',
        'Set log4j2.formatMsgNoLookups=true',
        'Remove JndiLookup class from classpath',
      ],
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2021-44228'],
      publishedAt: '2021-12-10T00:00:00Z',
    },
    {
      id: 'threat_2',
      name: 'Spring4Shell',
      cve: 'CVE-2022-22965',
      severity: 'critical',
      description: 'RCE vulnerability in Spring Framework when running on JDK 9+.',
      affectedTechnologies: ['Java', 'Spring Framework', 'Spring Boot'],
      mitigations: [
        'Upgrade to Spring Framework 5.3.18+ or 5.2.20+',
        'Upgrade Spring Boot to 2.6.6+ or 2.5.12+',
      ],
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2022-22965'],
      publishedAt: '2022-03-31T00:00:00Z',
    },
    {
      id: 'threat_3',
      name: 'OpenSSL Buffer Overflow',
      cve: 'CVE-2022-3602',
      severity: 'high',
      description: 'Buffer overflow in X.509 certificate verification.',
      affectedTechnologies: ['OpenSSL 3.0.x'],
      mitigations: [
        'Upgrade to OpenSSL 3.0.7 or later',
        'Apply vendor patches',
      ],
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2022-3602'],
      publishedAt: '2022-11-01T00:00:00Z',
    },
  ];
}

// ==========================================
// UPTIME CALCULATION
// ==========================================

export function calculateUptimePercentage(target: MonitoringTarget): number {
  // Simplified uptime calculation based on events
  const events = getThreatEvents().filter(
    e => e.target === target.url && e.type === 'downtime_detected'
  );
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const downtimeEvents = events.filter(e => new Date(e.timestamp) >= thirtyDaysAgo);
  const downtimeMinutes = downtimeEvents.length * 5; // Assume 5 min per incident
  
  const totalMinutes = 30 * 24 * 60;
  const uptimeMinutes = totalMinutes - downtimeMinutes;
  
  return Math.max(0, Math.min(100, (uptimeMinutes / totalMinutes) * 100));
}

