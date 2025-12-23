// ==========================================
// EXECUTIVE REPORTING ENGINE
// ==========================================
// Professional reports with PDF export, trends, and executive summaries

export interface ExecutiveReport {
  id: string;
  title: string;
  type: ReportType;
  generatedAt: string;
  generatedBy: string;
  period: {
    start: string;
    end: string;
  };
  summary: ReportSummary;
  sections: ReportSection[];
  metadata: {
    format: 'pdf' | 'html' | 'json';
    pageCount?: number;
    confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
  };
}

export type ReportType = 
  | 'executive_summary'
  | 'security_posture'
  | 'vulnerability_assessment'
  | 'compliance_audit'
  | 'trend_analysis'
  | 'incident_report'
  | 'pentest_summary';

export interface ReportSummary {
  headline: string;
  overallScore: number;
  previousScore?: number;
  scoreTrend: 'improving' | 'stable' | 'degrading';
  keyFindings: string[];
  criticalActions: string[];
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'chart' | 'table' | 'findings' | 'recommendations';
  content: any;
  pageBreakBefore?: boolean;
}

export interface TrendData {
  date: string;
  score: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  assetsScanned: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  sections: string[];
  audience: 'executive' | 'technical' | 'compliance' | 'all';
}

// Report templates
export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'exec_summary',
    name: 'Executive Summary',
    description: 'High-level overview for C-suite and board members',
    type: 'executive_summary',
    sections: ['headline', 'risk_overview', 'key_findings', 'recommendations', 'trends'],
    audience: 'executive',
  },
  {
    id: 'security_posture',
    name: 'Security Posture Report',
    description: 'Detailed security status and metrics',
    type: 'security_posture',
    sections: ['score_breakdown', 'vulnerabilities', 'assets', 'compliance', 'timeline'],
    audience: 'technical',
  },
  {
    id: 'compliance_audit',
    name: 'Compliance Audit Report',
    description: 'Framework-specific compliance assessment',
    type: 'compliance_audit',
    sections: ['framework_status', 'control_details', 'gaps', 'remediation', 'attestation'],
    audience: 'compliance',
  },
  {
    id: 'vulnerability_assessment',
    name: 'Vulnerability Assessment',
    description: 'Technical vulnerability findings and remediation',
    type: 'vulnerability_assessment',
    sections: ['summary', 'findings', 'evidence', 'fixes', 'timeline'],
    audience: 'technical',
  },
  {
    id: 'trend_analysis',
    name: 'Security Trend Analysis',
    description: 'Historical trends and projections',
    type: 'trend_analysis',
    sections: ['overview', 'score_trends', 'vulnerability_trends', 'asset_growth', 'predictions'],
    audience: 'all',
  },
];

// Storage
const REPORTS_KEY = 'shieldscan_reports';

export function getSavedReports(): ExecutiveReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(REPORTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveReport(report: ExecutiveReport): void {
  if (typeof window === 'undefined') return;
  const reports = getSavedReports();
  reports.unshift(report);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports.slice(0, 50)));
}

// Generate report data
export function generateReportData(
  type: ReportType,
  options: {
    periodDays?: number;
    includeEvidence?: boolean;
    frameworkId?: string;
  } = {}
): ExecutiveReport {
  const now = new Date();
  const periodDays = options.periodDays || 30;
  const start = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

  // Generate mock data (in production, this would aggregate real scan data)
  const score = 72 + Math.floor(Math.random() * 20);
  const previousScore = score - 5 + Math.floor(Math.random() * 10);
  
  const report: ExecutiveReport = {
    id: `report_${Date.now()}`,
    title: getReportTitle(type),
    type,
    generatedAt: now.toISOString(),
    generatedBy: 'current_user',
    period: {
      start: start.toISOString(),
      end: now.toISOString(),
    },
    summary: {
      headline: generateHeadline(score, previousScore),
      overallScore: score,
      previousScore,
      scoreTrend: score > previousScore ? 'improving' : score < previousScore ? 'degrading' : 'stable',
      keyFindings: [
        'TLS configuration meets industry standards',
        '3 high-severity vulnerabilities require immediate attention',
        'Authentication security improved by 15%',
        'New asset discovered: staging.example.com',
      ],
      criticalActions: [
        'Address SQL injection vulnerability in /api/users endpoint',
        'Renew SSL certificate expiring in 14 days',
        'Enable HSTS on all production domains',
      ],
      riskLevel: score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high',
    },
    sections: generateSections(type),
    metadata: {
      format: 'pdf',
      pageCount: 12,
      confidentiality: 'confidential',
    },
  };

  saveReport(report);
  return report;
}

function getReportTitle(type: ReportType): string {
  const titles: Record<ReportType, string> = {
    executive_summary: 'Executive Security Summary',
    security_posture: 'Security Posture Report',
    vulnerability_assessment: 'Vulnerability Assessment Report',
    compliance_audit: 'Compliance Audit Report',
    trend_analysis: 'Security Trend Analysis',
    incident_report: 'Security Incident Report',
    pentest_summary: 'Penetration Test Summary',
  };
  return titles[type];
}

function generateHeadline(score: number, previousScore: number): string {
  const diff = score - previousScore;
  if (diff > 5) {
    return `Security posture improved by ${diff} points this period`;
  } else if (diff < -5) {
    return `Security score decreased by ${Math.abs(diff)} points - action required`;
  } else {
    return `Security posture remains stable at ${score}/100`;
  }
}

function generateSections(type: ReportType): ReportSection[] {
  const sections: ReportSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      type: 'text',
      content: {
        text: 'This report provides a comprehensive assessment of the organization\'s security posture, including vulnerability findings, compliance status, and recommended actions.',
      },
    },
    {
      id: 'score_breakdown',
      title: 'Security Score Breakdown',
      type: 'chart',
      content: {
        chartType: 'radar',
        categories: ['TLS/SSL', 'Headers', 'Authentication', 'Encryption', 'Compliance'],
        values: [85, 72, 90, 88, 75],
      },
    },
    {
      id: 'vulnerabilities',
      title: 'Vulnerability Summary',
      type: 'table',
      content: {
        headers: ['Severity', 'Count', 'Remediated', 'Open'],
        rows: [
          ['Critical', '2', '1', '1'],
          ['High', '5', '3', '2'],
          ['Medium', '12', '8', '4'],
          ['Low', '23', '15', '8'],
        ],
      },
    },
    {
      id: 'findings',
      title: 'Key Findings',
      type: 'findings',
      pageBreakBefore: true,
      content: {
        findings: [
          {
            title: 'SQL Injection Vulnerability',
            severity: 'critical',
            description: 'Detected in /api/users endpoint',
            impact: 'Potential data breach',
            recommendation: 'Implement parameterized queries',
          },
          {
            title: 'Missing HSTS Header',
            severity: 'high',
            description: 'HTTP Strict Transport Security not enabled',
            impact: 'Susceptible to downgrade attacks',
            recommendation: 'Add Strict-Transport-Security header',
          },
        ],
      },
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      type: 'recommendations',
      content: {
        immediate: [
          'Patch SQL injection vulnerability within 24 hours',
          'Enable HSTS on all production endpoints',
        ],
        shortTerm: [
          'Implement Content Security Policy',
          'Upgrade TLS to 1.3 where possible',
        ],
        longTerm: [
          'Deploy Web Application Firewall',
          'Implement continuous security monitoring',
        ],
      },
    },
  ];

  return sections;
}

// Generate HTML for PDF export
export function generateReportHTML(report: ExecutiveReport): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${report.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; line-height: 1.6; }
    .page { padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
    .title { font-size: 28px; margin-top: 20px; }
    .meta { color: #666; font-size: 14px; margin-top: 10px; }
    .confidential { display: inline-block; background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .summary-box { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 12px; margin: 30px 0; }
    .summary-box h2 { font-size: 20px; margin-bottom: 15px; }
    .score-display { font-size: 64px; font-weight: bold; }
    .score-trend { font-size: 16px; opacity: 0.9; }
    .section { margin: 30px 0; page-break-inside: avoid; }
    .section h3 { font-size: 18px; color: #6366f1; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px; }
    .finding { background: #f9fafb; border-left: 4px solid #6366f1; padding: 15px; margin: 10px 0; border-radius: 0 8px 8px 0; }
    .finding.critical { border-left-color: #dc2626; }
    .finding.high { border-left-color: #f97316; }
    .finding.medium { border-left-color: #eab308; }
    .finding-title { font-weight: 600; margin-bottom: 5px; }
    .finding-meta { font-size: 12px; color: #666; }
    .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .table th { background: #f3f4f6; font-weight: 600; }
    .key-findings { list-style: none; }
    .key-findings li { padding: 8px 0; padding-left: 25px; position: relative; }
    .key-findings li:before { content: '→'; position: absolute; left: 0; color: #6366f1; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; text-align: center; }
    @media print {
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo">🛡️ ShieldScan</div>
      <h1 class="title">${report.title}</h1>
      <div class="meta">
        Generated: ${new Date(report.generatedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        <span class="confidential">${report.metadata.confidentiality}</span>
      </div>
    </div>

    <div class="summary-box">
      <h2>Security Score</h2>
      <div class="score-display">${report.summary.overallScore}<span style="font-size: 24px">/100</span></div>
      <div class="score-trend">
        ${report.summary.scoreTrend === 'improving' ? '↑' : report.summary.scoreTrend === 'degrading' ? '↓' : '→'}
        ${report.summary.headline}
      </div>
    </div>

    <div class="section">
      <h3>Key Findings</h3>
      <ul class="key-findings">
        ${report.summary.keyFindings.map(f => `<li>${f}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <h3>Critical Actions Required</h3>
      <ul class="key-findings">
        ${report.summary.criticalActions.map(a => `<li>${a}</li>`).join('')}
      </ul>
    </div>

    ${report.sections.map(section => {
      if (section.type === 'table' && section.content.headers) {
        return `
          <div class="section ${section.pageBreakBefore ? 'page-break' : ''}">
            <h3>${section.title}</h3>
            <table class="table">
              <thead>
                <tr>${section.content.headers.map((h: string) => `<th>${h}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${section.content.rows.map((row: string[]) => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      if (section.type === 'findings' && section.content.findings) {
        return `
          <div class="section ${section.pageBreakBefore ? 'page-break' : ''}">
            <h3>${section.title}</h3>
            ${section.content.findings.map((f: any) => `
              <div class="finding ${f.severity}">
                <div class="finding-title">${f.title}</div>
                <div class="finding-meta">Severity: ${f.severity.toUpperCase()} | ${f.description}</div>
                <p style="margin-top: 10px;"><strong>Impact:</strong> ${f.impact}</p>
                <p><strong>Recommendation:</strong> ${f.recommendation}</p>
              </div>
            `).join('')}
          </div>
        `;
      }
      if (section.type === 'recommendations' && section.content) {
        return `
          <div class="section ${section.pageBreakBefore ? 'page-break' : ''}">
            <h3>${section.title}</h3>
            <p><strong>Immediate (0-24 hours):</strong></p>
            <ul class="key-findings">${section.content.immediate.map((r: string) => `<li>${r}</li>`).join('')}</ul>
            <p style="margin-top: 15px;"><strong>Short-term (1-2 weeks):</strong></p>
            <ul class="key-findings">${section.content.shortTerm.map((r: string) => `<li>${r}</li>`).join('')}</ul>
            <p style="margin-top: 15px;"><strong>Long-term (1-3 months):</strong></p>
            <ul class="key-findings">${section.content.longTerm.map((r: string) => `<li>${r}</li>`).join('')}</ul>
          </div>
        `;
      }
      return '';
    }).join('')}

    <div class="footer">
      <p>This report was generated by ShieldScan Security Platform</p>
      <p>Report ID: ${report.id} | Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Export report as PDF (using print dialog)
export function exportReportAsPDF(report: ExecutiveReport): void {
  const html = generateReportHTML(report);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

// Export report as JSON
export function exportReportAsJSON(report: ExecutiveReport): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.title.replace(/\s+/g, '_')}_${new Date(report.generatedAt).toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Schedule report
export interface ScheduledReport {
  id: string;
  templateId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:MM
  recipients: string[];
  enabled: boolean;
  lastGenerated?: string;
  nextGeneration?: string;
}

const SCHEDULED_REPORTS_KEY = 'shieldscan_scheduled_reports';

export function getScheduledReports(): ScheduledReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(SCHEDULED_REPORTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function scheduleReport(schedule: Omit<ScheduledReport, 'id'>): ScheduledReport {
  const newSchedule: ScheduledReport = {
    ...schedule,
    id: `sched_${Date.now()}`,
  };

  const schedules = getScheduledReports();
  schedules.push(newSchedule);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(SCHEDULED_REPORTS_KEY, JSON.stringify(schedules));
  }

  return newSchedule;
}

