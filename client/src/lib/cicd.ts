// ==========================================
// CI/CD INTEGRATION ENGINE
// ==========================================
// SARIF output, PR comments, smart build failures

import type { ScanCheck, ScanResult } from '@/types/scan';
import type { RiskScore } from '@/lib/riskScoring';

// ==========================================
// SARIF OUTPUT (GitHub, GitLab, Azure DevOps)
// ==========================================

export interface SARIFReport {
  version: string;
  $schema: string;
  runs: SARIFRun[];
}

interface SARIFRun {
  tool: {
    driver: {
      name: string;
      version: string;
      informationUri: string;
      rules: SARIFRule[];
    };
  };
  results: SARIFResult[];
  invocations: SARIFInvocation[];
}

interface SARIFRule {
  id: string;
  name: string;
  shortDescription: { text: string };
  fullDescription?: { text: string };
  helpUri?: string;
  defaultConfiguration: {
    level: 'none' | 'note' | 'warning' | 'error';
  };
  properties?: {
    tags?: string[];
    precision?: string;
    'security-severity'?: string;
  };
}

interface SARIFResult {
  ruleId: string;
  level: 'none' | 'note' | 'warning' | 'error';
  message: { text: string };
  locations?: Array<{
    physicalLocation?: {
      artifactLocation: {
        uri: string;
      };
    };
    logicalLocations?: Array<{
      name: string;
      kind: string;
    }>;
  }>;
  fingerprints?: Record<string, string>;
  properties?: Record<string, any>;
}

interface SARIFInvocation {
  executionSuccessful: boolean;
  startTimeUtc: string;
  endTimeUtc: string;
  properties?: Record<string, any>;
}

// Convert scan severity to SARIF level
function severityToSARIFLevel(severity: string, status: string): 'none' | 'note' | 'warning' | 'error' {
  if (status === 'passed' || status === 'info') return 'none';
  
  switch (severity.toLowerCase()) {
    case 'critical':
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
    case 'info':
    default:
      return 'note';
  }
}

// Convert severity to SARIF security-severity score (0-10)
function severityToSecurityScore(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical': return '9.0';
    case 'high': return '7.0';
    case 'medium': return '5.0';
    case 'low': return '3.0';
    default: return '1.0';
  }
}

// Generate SARIF report from scan results
export function generateSARIFReport(
  scanResult: ScanResult,
  targetUrl: string
): SARIFReport {
  const rules: SARIFRule[] = [];
  const results: SARIFResult[] = [];
  
  // Convert checks to SARIF rules and results
  for (const check of scanResult.checks) {
    // Create rule (if not already exists)
    if (!rules.find(r => r.id === check.id)) {
      rules.push({
        id: check.id,
        name: check.name,
        shortDescription: { text: check.message },
        fullDescription: check.details ? { text: check.details } : undefined,
        defaultConfiguration: {
          level: severityToSARIFLevel(check.severity, check.status),
        },
        properties: {
          tags: [check.category, `severity:${check.severity}`],
          precision: 'high',
          'security-severity': severityToSecurityScore(check.severity),
        },
      });
    }
    
    // Only report non-passing checks as results
    if (check.status !== 'passed' && check.status !== 'info') {
      results.push({
        ruleId: check.id,
        level: severityToSARIFLevel(check.severity, check.status),
        message: { text: check.message },
        locations: [{
          logicalLocations: [{
            name: targetUrl,
            kind: 'website',
          }],
        }],
        fingerprints: {
          'shieldscan/v1': `${check.id}:${new URL(targetUrl).hostname}`,
        },
        properties: {
          category: check.category,
          severity: check.severity,
          ...(check.evidence && {
            evidence: {
              reproductionSteps: check.evidence.reproductionSteps,
              proofOfImpact: check.evidence.proofOfImpact,
            },
          }),
        },
      });
    }
  }
  
  return {
    version: '2.1.0',
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    runs: [{
      tool: {
        driver: {
          name: 'ShieldScan',
          version: '2.1.0',
          informationUri: 'https://shieldscan.io',
          rules,
        },
      },
      results,
      invocations: [{
        executionSuccessful: true,
        startTimeUtc: new Date(Date.now() - scanResult.scanDuration).toISOString(),
        endTimeUtc: new Date().toISOString(),
        properties: {
          targetUrl,
          score: scanResult.score,
          grade: scanResult.grade,
        },
      }],
    }],
  };
}

// ==========================================
// PR COMMENT GENERATOR
// ==========================================

export interface PRComment {
  title: string;
  summary: string;
  body: string;
  annotations: PRAnnotation[];
  conclusion: 'success' | 'failure' | 'neutral';
}

interface PRAnnotation {
  level: 'notice' | 'warning' | 'failure';
  message: string;
  title: string;
}

// Generate GitHub PR comment markdown
export function generatePRComment(
  scanResult: ScanResult,
  targetUrl: string,
  options: {
    showFixSnippets?: boolean;
    maxIssues?: number;
    includeScore?: boolean;
  } = {}
): PRComment {
  const { showFixSnippets = true, maxIssues = 5, includeScore = true } = options;
  
  // Filter actionable issues
  const issues = scanResult.checks
    .filter(c => c.status === 'failed' || c.status === 'warning')
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
    });
  
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;
  const mediumCount = issues.filter(i => i.severity === 'medium').length;
  
  // Determine conclusion
  let conclusion: 'success' | 'failure' | 'neutral' = 'success';
  if (criticalCount > 0 || highCount > 0) {
    conclusion = 'failure';
  } else if (mediumCount > 0) {
    conclusion = 'neutral';
  }
  
  // Build title
  const statusEmoji = conclusion === 'success' ? '✅' : conclusion === 'failure' ? '❌' : '⚠️';
  const title = `${statusEmoji} ShieldScan Security Report`;
  
  // Build summary
  const summaryParts = [];
  if (criticalCount > 0) summaryParts.push(`${criticalCount} critical`);
  if (highCount > 0) summaryParts.push(`${highCount} high`);
  if (mediumCount > 0) summaryParts.push(`${mediumCount} medium`);
  
  const summary = issues.length === 0 
    ? 'No security issues found!' 
    : `Found ${summaryParts.join(', ')} priority issue(s)`;
  
  // Build body markdown
  let body = `## 🛡️ ShieldScan Security Report\n\n`;
  body += `**Target:** \`${targetUrl}\`\n`;
  
  if (includeScore) {
    const gradeEmoji = {
      'A': '🟢', 'B': '🟢', 'C': '🟡', 'D': '🟠', 'F': '🔴'
    }[scanResult.grade] || '⚪';
    body += `**Score:** ${gradeEmoji} ${scanResult.score}/100 (${scanResult.grade})\n\n`;
  }
  
  // Summary table
  body += `### Summary\n\n`;
  body += `| Metric | Count |\n`;
  body += `|--------|-------|\n`;
  body += `| ✅ Passed | ${scanResult.summary.passed} |\n`;
  body += `| ⚠️ Warnings | ${scanResult.summary.warnings} |\n`;
  body += `| ❌ Failed | ${scanResult.summary.failed} |\n\n`;
  
  // Issues list
  if (issues.length > 0) {
    body += `### Issues to Fix\n\n`;
    
    const displayIssues = issues.slice(0, maxIssues);
    for (const issue of displayIssues) {
      const severityEmoji = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🔵',
        info: '⚪'
      }[issue.severity] || '⚪';
      
      body += `#### ${severityEmoji} ${issue.name}\n\n`;
      body += `> ${issue.message}\n\n`;
      
      if (issue.details) {
        body += `**Details:** ${issue.details}\n\n`;
      }
      
      if (showFixSnippets && issue.evidence?.reproductionSteps) {
        body += `<details>\n<summary>Reproduction Steps</summary>\n\n`;
        body += `\`\`\`\n`;
        body += issue.evidence.reproductionSteps.join('\n');
        body += `\n\`\`\`\n</details>\n\n`;
      }
    }
    
    if (issues.length > maxIssues) {
      body += `\n> *+${issues.length - maxIssues} more issues not shown*\n`;
    }
  } else {
    body += `### ✅ All Security Checks Passed!\n\n`;
    body += `Great job! No security issues were detected.\n`;
  }
  
  body += `\n---\n*Powered by [ShieldScan](https://shieldscan.io)*`;
  
  // Build annotations
  const annotations: PRAnnotation[] = issues.slice(0, 10).map(issue => ({
    level: issue.severity === 'critical' || issue.severity === 'high' ? 'failure' :
           issue.severity === 'medium' ? 'warning' : 'notice',
    title: issue.name,
    message: issue.message,
  }));
  
  return { title, summary, body, annotations, conclusion };
}

// ==========================================
// SMART BUILD FAILURE LOGIC
// ==========================================

export interface BuildDecision {
  shouldFail: boolean;
  reason: string;
  blockers: string[];
  warnings: string[];
  exitCode: number;
}

export interface BuildPolicy {
  failOn: {
    critical: boolean;
    high: boolean;
    medium: boolean;
    exploitable: boolean;
  };
  scoreThreshold?: number;
  allowedCategories?: string[];
  blockedCategories?: string[];
  maxIssues?: number;
}

// Default build policy - fail only on critical/exploitable
export const DEFAULT_BUILD_POLICY: BuildPolicy = {
  failOn: {
    critical: true,
    high: true,
    medium: false,
    exploitable: true,
  },
  scoreThreshold: undefined, // Don't fail on score by default
  allowedCategories: undefined,
  blockedCategories: ['Injection', 'Authentication'],
};

// Determine if build should fail
export function evaluateBuildPolicy(
  scanResult: ScanResult,
  policy: BuildPolicy = DEFAULT_BUILD_POLICY,
  riskScores?: Map<string, RiskScore>
): BuildDecision {
  const blockers: string[] = [];
  const warnings: string[] = [];
  
  // Check each issue against policy
  for (const check of scanResult.checks) {
    if (check.status !== 'failed') continue;
    
    const severity = check.severity.toLowerCase();
    const riskScore = riskScores?.get(check.id);
    
    // Check severity-based blocking
    if (severity === 'critical' && policy.failOn.critical) {
      blockers.push(`Critical: ${check.name}`);
    } else if (severity === 'high' && policy.failOn.high) {
      blockers.push(`High: ${check.name}`);
    } else if (severity === 'medium' && policy.failOn.medium) {
      warnings.push(`Medium: ${check.name}`);
      if (policy.failOn.medium) {
        blockers.push(`Medium: ${check.name}`);
      }
    }
    
    // Check exploitability-based blocking
    if (policy.failOn.exploitable && riskScore?.score && riskScore.score >= 80) {
      if (!blockers.includes(`Exploitable: ${check.name}`)) {
        blockers.push(`Exploitable: ${check.name} (risk score: ${riskScore.score})`);
      }
    }
    
    // Check category-based blocking
    if (policy.blockedCategories?.includes(check.category)) {
      if (!blockers.some(b => b.includes(check.name))) {
        blockers.push(`Blocked category (${check.category}): ${check.name}`);
      }
    }
  }
  
  // Check score threshold
  if (policy.scoreThreshold && scanResult.score < policy.scoreThreshold) {
    blockers.push(`Score ${scanResult.score} below threshold ${policy.scoreThreshold}`);
  }
  
  // Check max issues
  const issueCount = scanResult.checks.filter(c => c.status === 'failed').length;
  if (policy.maxIssues && issueCount > policy.maxIssues) {
    blockers.push(`${issueCount} issues exceeds maximum ${policy.maxIssues}`);
  }
  
  const shouldFail = blockers.length > 0;
  
  return {
    shouldFail,
    reason: shouldFail 
      ? `Build blocked due to ${blockers.length} security issue(s)`
      : 'All security checks passed policy requirements',
    blockers,
    warnings,
    exitCode: shouldFail ? 1 : 0,
  };
}

// ==========================================
// CLI OUTPUT HELPERS
// ==========================================

// Generate CLI-friendly summary
export function generateCLIOutput(
  scanResult: ScanResult,
  buildDecision: BuildDecision
): string {
  const lines: string[] = [];
  
  lines.push('');
  lines.push('╔══════════════════════════════════════════════════════╗');
  lines.push('║           🛡️  SHIELDSCAN SECURITY REPORT            ║');
  lines.push('╚══════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push(`  Target: ${scanResult.url}`);
  lines.push(`  Score:  ${scanResult.score}/100 (${scanResult.grade})`);
  lines.push(`  Time:   ${scanResult.scanDuration}ms`);
  lines.push('');
  lines.push('  ┌─────────────────────────────────────────────────┐');
  lines.push(`  │  ✅ Passed: ${String(scanResult.summary.passed).padEnd(4)} │  ⚠️  Warnings: ${String(scanResult.summary.warnings).padEnd(4)} │`);
  lines.push(`  │  ❌ Failed: ${String(scanResult.summary.failed).padEnd(4)} │  📊 Total:    ${String(scanResult.summary.total).padEnd(4)} │`);
  lines.push('  └─────────────────────────────────────────────────┘');
  lines.push('');
  
  if (buildDecision.blockers.length > 0) {
    lines.push('  🚫 BLOCKERS:');
    for (const blocker of buildDecision.blockers) {
      lines.push(`     • ${blocker}`);
    }
    lines.push('');
  }
  
  if (buildDecision.warnings.length > 0) {
    lines.push('  ⚠️  WARNINGS:');
    for (const warning of buildDecision.warnings) {
      lines.push(`     • ${warning}`);
    }
    lines.push('');
  }
  
  if (buildDecision.shouldFail) {
    lines.push('  ════════════════════════════════════════════════════');
    lines.push('  ❌ BUILD FAILED - Security requirements not met');
    lines.push('  ════════════════════════════════════════════════════');
  } else {
    lines.push('  ════════════════════════════════════════════════════');
    lines.push('  ✅ BUILD PASSED - Security requirements met');
    lines.push('  ════════════════════════════════════════════════════');
  }
  
  lines.push('');
  
  return lines.join('\n');
}

// Export scan results as JSON for CI
export function exportForCI(
  scanResult: ScanResult,
  buildDecision: BuildDecision
): Record<string, any> {
  return {
    success: !buildDecision.shouldFail,
    exitCode: buildDecision.exitCode,
    summary: {
      url: scanResult.url,
      score: scanResult.score,
      grade: scanResult.grade,
      passed: scanResult.summary.passed,
      warnings: scanResult.summary.warnings,
      failed: scanResult.summary.failed,
    },
    decision: {
      shouldFail: buildDecision.shouldFail,
      reason: buildDecision.reason,
      blockers: buildDecision.blockers,
      warnings: buildDecision.warnings,
    },
    issues: scanResult.checks
      .filter(c => c.status === 'failed' || c.status === 'warning')
      .map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        severity: c.severity,
        status: c.status,
        message: c.message,
      })),
    timestamp: new Date().toISOString(),
  };
}

