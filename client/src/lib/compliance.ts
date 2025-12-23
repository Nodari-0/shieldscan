// ==========================================
// COMPLIANCE MAPPING ENGINE
// ==========================================
// Map findings to SOC 2, PCI-DSS, HIPAA, GDPR, ISO 27001

export interface ComplianceFramework {
  id: string;
  name: string;
  shortName: string;
  description: string;
  version: string;
  controls: ComplianceControl[];
  icon: string;
  color: string;
}

export interface ComplianceControl {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  requirements: string[];
  relatedChecks: string[]; // Maps to scan check IDs
}

export interface ComplianceStatus {
  frameworkId: string;
  overallScore: number;
  controlStatuses: ControlStatus[];
  lastAssessed: string;
  gaps: ComplianceGap[];
}

export interface ControlStatus {
  controlId: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_assessed';
  evidence: string[];
  findings: string[];
  notes?: string;
}

export interface ComplianceGap {
  controlId: string;
  controlName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  remediation: string;
  relatedFindings: string[];
}

export interface ComplianceReport {
  id: string;
  frameworkId: string;
  generatedAt: string;
  status: ComplianceStatus;
  summary: {
    compliant: number;
    partial: number;
    nonCompliant: number;
    notAssessed: number;
  };
  signedBy?: string;
  validUntil?: string;
}

// ==========================================
// COMPLIANCE FRAMEWORKS
// ==========================================

export const COMPLIANCE_FRAMEWORKS: ComplianceFramework[] = [
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    shortName: 'SOC 2',
    description: 'Service Organization Control 2 - Security, Availability, Processing Integrity, Confidentiality, and Privacy',
    version: '2017',
    icon: '🔐',
    color: '#2563EB',
    controls: [
      {
        id: 'soc2_cc6.1',
        code: 'CC6.1',
        name: 'Logical and Physical Access Controls',
        description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets.',
        category: 'Common Criteria',
        requirements: [
          'Encryption in transit (TLS)',
          'Strong authentication',
          'Access control mechanisms',
        ],
        relatedChecks: ['tls_version', 'hsts', 'cookie_security', 'authentication'],
      },
      {
        id: 'soc2_cc6.6',
        code: 'CC6.6',
        name: 'Security Measures Against Threats',
        description: 'The entity implements logical access security measures to protect against threats from sources outside the system boundaries.',
        category: 'Common Criteria',
        requirements: [
          'Web Application Firewall',
          'Security headers',
          'Input validation',
        ],
        relatedChecks: ['waf', 'csp', 'xss', 'sql_injection', 'x_frame_options'],
      },
      {
        id: 'soc2_cc6.7',
        code: 'CC6.7',
        name: 'Transmission Security',
        description: 'The entity restricts the transmission, movement, and removal of information.',
        category: 'Common Criteria',
        requirements: [
          'HTTPS enforcement',
          'TLS 1.2 or higher',
          'Certificate validity',
        ],
        relatedChecks: ['https_redirect', 'tls_version', 'ssl_expiry', 'mixed_content'],
      },
      {
        id: 'soc2_cc7.2',
        code: 'CC7.2',
        name: 'Security Monitoring',
        description: 'The entity monitors system components for anomalies.',
        category: 'Common Criteria',
        requirements: [
          'Continuous monitoring',
          'Vulnerability scanning',
          'Security logging',
        ],
        relatedChecks: ['server_signature', 'error_handling'],
      },
    ],
  },
  {
    id: 'pci_dss',
    name: 'PCI DSS v4.0',
    shortName: 'PCI-DSS',
    description: 'Payment Card Industry Data Security Standard',
    version: '4.0',
    icon: '💳',
    color: '#059669',
    controls: [
      {
        id: 'pci_1.3',
        code: '1.3',
        name: 'Network Security Controls',
        description: 'Network access to and from the cardholder data environment is restricted.',
        category: 'Build and Maintain a Secure Network',
        requirements: [
          'Firewall configuration',
          'Access restrictions',
        ],
        relatedChecks: ['waf', 'open_ports'],
      },
      {
        id: 'pci_4.1',
        code: '4.1',
        name: 'Strong Cryptography',
        description: 'Strong cryptography is used during transmission of cardholder data.',
        category: 'Protect Cardholder Data',
        requirements: [
          'TLS 1.2 or higher',
          'Strong cipher suites',
          'Valid certificates',
        ],
        relatedChecks: ['tls_version', 'ssl_expiry', 'cipher_strength'],
      },
      {
        id: 'pci_6.4',
        code: '6.4',
        name: 'Secure Development',
        description: 'Public-facing web applications are protected against attacks.',
        category: 'Maintain a Vulnerability Management Program',
        requirements: [
          'XSS prevention',
          'SQL injection prevention',
          'CSRF protection',
        ],
        relatedChecks: ['xss', 'sql_injection', 'csrf', 'csp'],
      },
      {
        id: 'pci_6.5',
        code: '6.5',
        name: 'Security Headers',
        description: 'Security-related HTTP headers are properly configured.',
        category: 'Maintain a Vulnerability Management Program',
        requirements: [
          'Content-Security-Policy',
          'X-Frame-Options',
          'X-Content-Type-Options',
        ],
        relatedChecks: ['csp', 'x_frame_options', 'x_content_type_options', 'hsts'],
      },
    ],
  },
  {
    id: 'hipaa',
    name: 'HIPAA Security Rule',
    shortName: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act',
    version: '2013',
    icon: '🏥',
    color: '#DC2626',
    controls: [
      {
        id: 'hipaa_164.312a',
        code: '164.312(a)(1)',
        name: 'Access Control',
        description: 'Implement technical policies and procedures for electronic information systems.',
        category: 'Technical Safeguards',
        requirements: [
          'Unique user identification',
          'Emergency access procedure',
          'Automatic logoff',
          'Encryption',
        ],
        relatedChecks: ['authentication', 'cookie_security', 'session_timeout'],
      },
      {
        id: 'hipaa_164.312d',
        code: '164.312(d)',
        name: 'Person or Entity Authentication',
        description: 'Implement procedures to verify that a person or entity seeking access is the one claimed.',
        category: 'Technical Safeguards',
        requirements: [
          'Strong authentication',
          'Multi-factor authentication',
        ],
        relatedChecks: ['authentication', 'mfa_check'],
      },
      {
        id: 'hipaa_164.312e',
        code: '164.312(e)(1)',
        name: 'Transmission Security',
        description: 'Implement technical security measures to guard against unauthorized access during transmission.',
        category: 'Technical Safeguards',
        requirements: [
          'Encryption in transit',
          'Integrity controls',
        ],
        relatedChecks: ['https_redirect', 'tls_version', 'hsts', 'mixed_content'],
      },
    ],
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    shortName: 'GDPR',
    description: 'General Data Protection Regulation',
    version: '2018',
    icon: '🇪🇺',
    color: '#7C3AED',
    controls: [
      {
        id: 'gdpr_32',
        code: 'Article 32',
        name: 'Security of Processing',
        description: 'Implement appropriate technical and organisational measures to ensure security.',
        category: 'Security',
        requirements: [
          'Encryption of personal data',
          'Ability to ensure confidentiality',
          'Regular testing of security',
        ],
        relatedChecks: ['tls_version', 'hsts', 'csp', 'xss', 'sql_injection'],
      },
      {
        id: 'gdpr_25',
        code: 'Article 25',
        name: 'Data Protection by Design',
        description: 'Implement appropriate technical measures to protect data by default.',
        category: 'Privacy',
        requirements: [
          'Privacy-respecting headers',
          'Minimal data collection',
          'Secure defaults',
        ],
        relatedChecks: ['referrer_policy', 'permissions_policy', 'cookie_security'],
      },
    ],
  },
  {
    id: 'iso27001',
    name: 'ISO 27001:2022',
    shortName: 'ISO 27001',
    description: 'Information Security Management System',
    version: '2022',
    icon: '📋',
    color: '#F59E0B',
    controls: [
      {
        id: 'iso_a8.24',
        code: 'A.8.24',
        name: 'Use of Cryptography',
        description: 'Rules for the effective use of cryptography shall be defined and implemented.',
        category: 'Technical Controls',
        requirements: [
          'TLS implementation',
          'Certificate management',
          'Key strength requirements',
        ],
        relatedChecks: ['tls_version', 'ssl_expiry', 'cipher_strength'],
      },
      {
        id: 'iso_a8.26',
        code: 'A.8.26',
        name: 'Application Security Requirements',
        description: 'Information security requirements shall be identified when acquiring or developing applications.',
        category: 'Technical Controls',
        requirements: [
          'Secure coding practices',
          'Input validation',
          'Output encoding',
        ],
        relatedChecks: ['xss', 'sql_injection', 'csp', 'security_headers'],
      },
    ],
  },
];

// Storage key
const COMPLIANCE_KEY = 'shieldscan_compliance';

// Get compliance status for a framework
export function getComplianceStatus(frameworkId: string): ComplianceStatus | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(`${COMPLIANCE_KEY}_${frameworkId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Save compliance status
export function saveComplianceStatus(status: ComplianceStatus): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${COMPLIANCE_KEY}_${status.frameworkId}`, JSON.stringify(status));
}

// Map scan results to compliance controls
export function mapScanToCompliance(
  frameworkId: string,
  scanResults: Array<{ id: string; status: 'passed' | 'failed' | 'warning' | 'info'; name: string }>
): ComplianceStatus {
  const framework = COMPLIANCE_FRAMEWORKS.find(f => f.id === frameworkId);
  if (!framework) {
    throw new Error(`Unknown framework: ${frameworkId}`);
  }

  const controlStatuses: ControlStatus[] = [];
  const gaps: ComplianceGap[] = [];
  let compliantCount = 0;
  let partialCount = 0;
  let nonCompliantCount = 0;

  for (const control of framework.controls) {
    const relatedResults = scanResults.filter(r => 
      control.relatedChecks.some(check => r.id.toLowerCase().includes(check.toLowerCase()))
    );

    if (relatedResults.length === 0) {
      controlStatuses.push({
        controlId: control.id,
        status: 'not_assessed',
        evidence: [],
        findings: [],
      });
      continue;
    }

    const failedChecks = relatedResults.filter(r => r.status === 'failed');
    const passedChecks = relatedResults.filter(r => r.status === 'passed');

    let status: ControlStatus['status'];
    if (failedChecks.length === 0) {
      status = 'compliant';
      compliantCount++;
    } else if (passedChecks.length > 0) {
      status = 'partial';
      partialCount++;
    } else {
      status = 'non_compliant';
      nonCompliantCount++;
    }

    controlStatuses.push({
      controlId: control.id,
      status,
      evidence: passedChecks.map(c => c.name),
      findings: failedChecks.map(c => c.name),
    });

    // Create gaps for non-compliant controls
    if (status === 'non_compliant' || status === 'partial') {
      gaps.push({
        controlId: control.id,
        controlName: control.name,
        severity: failedChecks.some(c => c.name.toLowerCase().includes('critical')) ? 'critical' : 
                  failedChecks.length > 2 ? 'high' : 'medium',
        description: `Control ${control.code} has ${failedChecks.length} failing checks.`,
        remediation: `Address the following findings: ${failedChecks.map(c => c.name).join(', ')}`,
        relatedFindings: failedChecks.map(c => c.id),
      });
    }
  }

  const total = compliantCount + partialCount + nonCompliantCount;
  const overallScore = total > 0 ? Math.round((compliantCount / total) * 100) : 0;

  const complianceStatus: ComplianceStatus = {
    frameworkId,
    overallScore,
    controlStatuses,
    lastAssessed: new Date().toISOString(),
    gaps,
  };

  saveComplianceStatus(complianceStatus);
  return complianceStatus;
}

// Generate compliance report
export function generateComplianceReport(frameworkId: string): ComplianceReport | null {
  const status = getComplianceStatus(frameworkId);
  if (!status) return null;

  const compliant = status.controlStatuses.filter(c => c.status === 'compliant').length;
  const partial = status.controlStatuses.filter(c => c.status === 'partial').length;
  const nonCompliant = status.controlStatuses.filter(c => c.status === 'non_compliant').length;
  const notAssessed = status.controlStatuses.filter(c => c.status === 'not_assessed').length;

  const report: ComplianceReport = {
    id: `report_${Date.now()}`,
    frameworkId,
    generatedAt: new Date().toISOString(),
    status,
    summary: { compliant, partial, nonCompliant, notAssessed },
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  };

  return report;
}

// Get all framework summaries
export function getAllComplianceSummaries(): Array<{
  framework: ComplianceFramework;
  status: ComplianceStatus | null;
}> {
  return COMPLIANCE_FRAMEWORKS.map(framework => ({
    framework,
    status: getComplianceStatus(framework.id),
  }));
}

// Calculate overall compliance score across all frameworks
export function getOverallComplianceScore(): number {
  const summaries = getAllComplianceSummaries();
  const assessed = summaries.filter(s => s.status !== null);
  
  if (assessed.length === 0) return 0;
  
  const totalScore = assessed.reduce((sum, s) => sum + (s.status?.overallScore || 0), 0);
  return Math.round(totalScore / assessed.length);
}

