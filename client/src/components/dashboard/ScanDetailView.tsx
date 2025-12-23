'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Download, Globe, Clock, CheckCircle, AlertTriangle, XCircle,
  Shield, Lock, Server, Copy, Check, ExternalLink, Bot, Info, Code, 
  FileCode, AlertOctagon, Lightbulb, Zap, X
} from 'lucide-react';
import type { StoredScanResult, Evidence } from '@/types/scan';
import EvidenceViewer from './EvidenceViewer';
import FixSuggestionPanel from './FixSuggestionPanel';
import { getFixSuggestion } from '@/config/fixSuggestions';

interface ScanDetailViewProps {
  scan: StoredScanResult;
  onBack: () => void;
  onAskAI?: (question: string) => void;
}

export default function ScanDetailView({ scan, onBack, onAskAI }: ScanDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'checks' | 'vulnerabilities'>('overview');
  const [copied, setCopied] = useState(false);
  const [selectedFixId, setSelectedFixId] = useState<string | null>(null);

  const copyUrl = () => {
    navigator.clipboard.writeText(scan.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-green-500/10 to-green-500/5 border-green-500/20';
    if (score >= 60) return 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20';
    if (score >= 40) return 'from-orange-500/10 to-orange-500/5 border-orange-500/20';
    return 'from-red-500/10 to-red-500/5 border-red-500/20';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-500/5 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/5 border-yellow-500/20';
      case 'failed':
        return 'bg-red-500/5 border-red-500/20';
      default:
        return 'bg-gray-800/50 border-gray-700';
    }
  };

  interface Vulnerability {
    id?: string;
    name: string;
    severity: string;
    description: string;
    recommendation: string;
    category: string;
    evidence?: Evidence;
  }

  // Map vulnerability types to fix suggestion IDs
  const getVulnFixId = (vulnType: string): string | undefined => {
    const typeMapping: Record<string, string> = {
      'Cross-Site Scripting (XSS)': 'xss',
      'XSS Risk': 'xss',
      'Reflected Input': 'xss',
      'SQL Injection Risk': 'sqli',
      'SQL Injection': 'sqli',
      'Sensitive File Exposure': 'sensitive-files',
      'CORS Misconfiguration': 'cors-config',
      'Cookie Security': 'cookie-security',
    };
    return typeMapping[vulnType];
  };

  // Generate detailed vulnerabilities if none exist
  const getVulnerabilities = (): Vulnerability[] => {
    if (scan.vulnerabilities && scan.vulnerabilities.length > 0) {
      return scan.vulnerabilities.map(v => ({
        id: getVulnFixId(v.type),
        name: v.type,
        severity: v.severity,
        description: v.details,
        recommendation: `Address this ${v.severity} severity vulnerability`,
        category: 'Security',
        evidence: v.evidence,
      }));
    }
    
    // Generate from failed/warning checks
    const vulns: Vulnerability[] = [];
    
    if (scan.checks) {
      scan.checks.filter(c => c.status === 'failed').forEach((check, idx) => {
        vulns.push({
          name: check.name,
          severity: idx === 0 ? 'high' : 'medium',
          description: check.message || check.details || 'Security check failed',
          recommendation: 'Review and fix this security issue',
          category: 'Security Configuration',
        });
      });
      
      scan.checks.filter(c => c.status === 'warning').slice(0, 3).forEach((check) => {
        vulns.push({
          name: check.name,
          severity: 'low',
          description: check.message || check.details || 'Potential security improvement',
          recommendation: 'Consider implementing this security measure',
          category: 'Best Practice',
        });
      });
    }
    
    return vulns;
  };

  const vulnerabilities = getVulnerabilities();

  interface DetailedCheck {
    id?: string;
    name: string;
    category: string;
    status: string;
    message: string;
    recommendation?: string;
    evidence?: Evidence;
  }

  // Categories that are NOT actionable (facts, not problems)
  const nonActionableCategories = [
    'Informational', 'Performance', 'Compliance', 
    'DNS', // DNS facts are not actionable
  ];
  
  // Check IDs that should never have "fix" recommendations
  const nonActionableChecks = [
    'dns-resolution', 'cdn-detection', 'ipv6-support', 'ipv4-support',
    'response-time', 'server-detection', 'technology-detection',
    'framework-detection', 'waf-detection', 'dnssec', 'caa-records',
    'compression', 'http2-support',
    // Public files and best practices (not vulnerabilities)
    'public-files', 'robots-txt', 'header-csp', 'header-rp', 'header-pp',
    'header-xcto', 'cookie-security',
    // XSS reflection without executable context is informational
    'basic-xss',
  ];
  
  // Generate detailed checks if minimal
  const getDetailedChecks = (): DetailedCheck[] => {
    if (scan.checks && scan.checks.length > 0) {
      return scan.checks.map(c => {
        // Determine if this finding is actionable
        const isNonActionable = 
          c.status === 'passed' || 
          c.status === 'info' ||
          nonActionableCategories.includes(c.category) ||
          nonActionableChecks.includes(c.id);
        
        return {
          id: c.id,
          name: c.name,
          category: c.category,
          status: c.status,
          message: c.message || c.details || '',
          // Only show recommendations for actionable security issues
          recommendation: isNonActionable ? undefined : c.details,
          evidence: c.evidence,
        };
      });
    }
    
    // Generate basic checks from summary
    const checks: DetailedCheck[] = [];
    const categories = [
      { name: 'SSL Certificate', category: 'Encryption', actionable: true },
      { name: 'Security Headers', category: 'Headers', actionable: true },
      { name: 'Content Security Policy', category: 'Headers', actionable: true },
      { name: 'X-Frame-Options', category: 'Headers', actionable: true },
      { name: 'HSTS', category: 'Transport', actionable: true },
      { name: 'Cookie Security', category: 'Session', actionable: true },
      { name: 'Server Information', category: 'Informational', actionable: false },
      { name: 'Open Ports', category: 'Network', actionable: true },
    ];
    
    let passed = scan.summary.passed;
    let warnings = scan.summary.warnings;
    let failed = scan.summary.failed;
    
    categories.forEach(cat => {
      let status = 'passed';
      if (failed > 0) { status = 'failed'; failed--; }
      else if (warnings > 0) { status = 'warning'; warnings--; }
      else if (passed > 0) { passed--; }
      
      checks.push({
        name: cat.name,
        category: cat.category,
        status,
        message: `${cat.name} check ${status === 'passed' ? 'passed' : status === 'warning' ? 'needs attention' : 'failed'}`,
        // Only show recommendations for actionable security issues
        recommendation: (cat.actionable && status !== 'passed') 
          ? `Review and improve ${cat.name.toLowerCase()} configuration` 
          : undefined,
      });
    });
    
    return checks;
  };

  const detailedChecks = getDetailedChecks();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">Scan Report</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Globe className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <span className="text-gray-400 font-mono text-sm truncate">{scan.url}</span>
              <button onClick={copyUrl} className="p-0.5 hover:bg-gray-800 rounded flex-shrink-0">
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-500" />}
              </button>
              <a 
                href={scan.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-0.5 hover:bg-gray-800 rounded text-gray-500 hover:text-white flex-shrink-0"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onAskAI && (
            <button
              onClick={() => onAskAI(`How can I improve the security score for ${scan.url}?`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors"
            >
              <Bot className="w-3.5 h-3.5" />
              Ask AI
            </button>
          )}
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors">
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Score Card */}
      <div className={`bg-gradient-to-br ${getScoreBg(scan.score)} border rounded-xl p-4`}>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Score Circle */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="6"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className={getScoreColor(scan.score)}
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - scan.score / 100) }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor(scan.score)}`}>{scan.score}</span>
              <span className="text-gray-500 text-[10px]">/ 100</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-3 gap-2 w-full sm:w-auto">
            <div className="text-center p-3 bg-black/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <div className="text-xl font-bold text-green-500">{scan.summary.passed}</div>
              <div className="text-[10px] text-gray-500">Passed</div>
            </div>
            <div className="text-center p-3 bg-black/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <div className="text-xl font-bold text-yellow-500">{scan.summary.warnings}</div>
              <div className="text-[10px] text-gray-500">Warnings</div>
            </div>
            <div className="text-center p-3 bg-black/20 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <div className="text-xl font-bold text-red-500">{scan.summary.failed}</div>
              <div className="text-[10px] text-gray-500">Failed</div>
            </div>
          </div>

          {/* Grade & Meta */}
          <div className="text-center flex-shrink-0">
            <div className={`text-4xl font-bold ${getScoreColor(scan.score)}`}>{scan.grade}</div>
            <div className="text-gray-500 text-xs">Grade</div>
            <div className="text-gray-600 text-[10px] mt-1 flex items-center gap-1 justify-center">
              <Clock className="w-3 h-3" />
              {new Date(scan.timestamp).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Lock className={`w-3.5 h-3.5 ${scan.ssl?.valid ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-[10px] text-gray-500">SSL/TLS</span>
          </div>
          <p className={`text-xs font-medium ${scan.ssl?.valid ? 'text-green-500' : 'text-red-500'}`}>
            {scan.ssl?.valid ? 'Valid' : 'Invalid'}
          </p>
          {scan.ssl?.daysUntilExpiry && scan.ssl.daysUntilExpiry > 0 && (
            <p className="text-[10px] text-gray-600 mt-0.5">{scan.ssl.daysUntilExpiry}d left</p>
          )}
        </div>
        <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Server className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[10px] text-gray-500">Server</span>
          </div>
          <p className="text-xs font-medium text-white truncate">{scan.server?.server || 'Unknown'}</p>
        </div>
        <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Globe className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[10px] text-gray-500">CDN</span>
          </div>
          <p className={`text-xs font-medium ${scan.dns?.hasCDN ? 'text-green-500' : 'text-gray-400'}`}>
            {scan.dns?.hasCDN ? scan.dns.cdnProvider || 'Active' : 'None'}
          </p>
        </div>
        <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[10px] text-gray-500">Checks</span>
          </div>
          <p className="text-xs font-medium text-white">{scan.summary.total} Total</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="flex gap-0.5">
          {(['overview', 'checks', 'vulnerabilities'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-xs font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-yellow-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'vulnerabilities' && vulnerabilities.length > 0 && (
                <span className="ml-1 px-1 py-0.5 bg-red-500/20 text-red-400 rounded text-[9px]">
                  {vulnerabilities.length}
                </span>
              )}
              {activeTab === tab && (
                <motion.div
                  layoutId="detailTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* Failed Checks */}
            {scan.summary.failed > 0 && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                <h3 className="text-red-400 text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4" />
                  Critical Issues ({scan.summary.failed})
                </h3>
                <div className="space-y-2">
                  {detailedChecks.filter(c => c.status === 'failed').map((check, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white text-xs">{check.name}</p>
                        <p className="text-gray-500 text-[10px]">{check.message}</p>
                        {check.recommendation && (
                          <p className="text-yellow-500/80 text-[10px] mt-0.5 flex items-start gap-1">
                            <Lightbulb className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            {check.recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {scan.summary.warnings > 0 && (
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                <h3 className="text-yellow-400 text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Warnings ({scan.summary.warnings})
                </h3>
                <div className="space-y-2">
                  {detailedChecks.filter(c => c.status === 'warning').slice(0, 3).map((check, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white text-xs">{check.name}</p>
                        <p className="text-gray-500 text-[10px]">{check.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scan.summary.failed === 0 && scan.summary.warnings === 0 && (
              <div className="text-center py-6 bg-green-500/5 border border-green-500/20 rounded-lg">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-green-400 font-medium text-sm">All checks passed!</p>
                <p className="text-gray-500 text-xs mt-1">Your website has a strong security posture</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'checks' && (
          <div className="space-y-2">
            {/* Helper message for fixes */}
            {detailedChecks.some(c => c.id && getFixSuggestion(c.id) && c.status !== 'passed' && c.status !== 'info') && (
              <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs text-emerald-300">
                    <strong>Tip:</strong> Look for the <span className="font-semibold">"View Fix"</span> button on failed/warning checks to see code fixes in Node.js, Python, Java, or Go.
                  </p>
                </div>
              </div>
            )}
            {detailedChecks.length > 0 ? (
              detailedChecks.map((check, idx) => {
                const hasFix = check.id && getFixSuggestion(check.id);
                const showingFix = selectedFixId === check.id;
                
                return (
                  <div key={idx}>
                    <div className={`border rounded-lg p-3 ${getStatusBg(check.status)}`}>
                      <div className="flex items-start gap-2">
                        {getStatusIcon(check.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-white text-xs font-medium">{check.name}</h4>
                            {check.category && (
                              <span className="px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded text-[9px]">
                                {check.category}
                              </span>
                            )}
                            {/* View Fix Button - More visible */}
                            {hasFix && check.status !== 'passed' && check.status !== 'info' && (
                              <button
                                onClick={() => setSelectedFixId(showingFix ? null : check.id!)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-semibold transition-all ${
                                  showingFix
                                    ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/50'
                                    : 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 shadow-sm hover:shadow-emerald-500/20'
                                }`}
                                title="View code fix suggestions"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                {showingFix ? 'Hide Fix' : 'View Fix'}
                              </button>
                            )}
                          </div>
                          <p className="text-gray-400 text-[10px] mt-0.5">{check.message}</p>
                          {check.recommendation && (
                            <p className="text-yellow-500/80 text-[10px] mt-1 flex items-start gap-1">
                              <Lightbulb className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              {check.recommendation}
                            </p>
                          )}
                          <EvidenceViewer evidence={check.evidence} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Fix Suggestion Panel */}
                    <AnimatePresence>
                      {showingFix && check.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2"
                        >
                          <FixSuggestionPanel 
                            checkId={check.id} 
                            checkName={check.name}
                            onClose={() => setSelectedFixId(null)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No detailed checks available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'vulnerabilities' && (
          <div className="space-y-2">
            {/* Helper message for fixes */}
            {vulnerabilities.some(v => v.id && getFixSuggestion(v.id)) && (
              <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs text-emerald-300">
                    <strong>Tip:</strong> Click <span className="font-semibold">"View Fix"</span> on any vulnerability to see ready-to-use code fixes in multiple languages.
                  </p>
                </div>
              </div>
            )}
            {vulnerabilities.length > 0 ? (
              vulnerabilities.map((vuln, idx) => {
                const hasFix = vuln.id && getFixSuggestion(vuln.id);
                const showingFix = selectedFixId === `vuln-${vuln.id}-${idx}`;
                const fixKey = `vuln-${vuln.id}-${idx}`;
                
                return (
                  <div key={idx}>
                    <div className={`border rounded-lg p-3 ${
                      vuln.severity === 'critical' || vuln.severity === 'high'
                        ? 'bg-red-500/5 border-red-500/20'
                        : vuln.severity === 'medium'
                        ? 'bg-yellow-500/5 border-yellow-500/20'
                        : 'bg-blue-500/5 border-blue-500/20'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-white text-xs font-medium">{vuln.name}</h4>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                              vuln.severity === 'critical' ? 'bg-red-600 text-white' :
                              vuln.severity === 'high' ? 'bg-red-500 text-white' :
                              vuln.severity === 'medium' ? 'bg-yellow-500 text-black' :
                              'bg-blue-500 text-white'
                            }`}>
                              {vuln.severity.toUpperCase()}
                            </span>
                            {vuln.category && (
                              <span className="px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded text-[9px]">
                                {vuln.category}
                              </span>
                            )}
                            {/* View Fix Button */}
                            {hasFix && (
                              <button
                                onClick={() => setSelectedFixId(showingFix ? null : fixKey)}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                                  showingFix
                                    ? 'bg-emerald-500/30 text-emerald-300'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                <Zap className="w-3 h-3" />
                                {showingFix ? 'Hide Fix' : 'View Fix'}
                              </button>
                            )}
                          </div>
                          <p className="text-gray-400 text-[10px] mt-1">{vuln.description}</p>
                          {vuln.recommendation && !hasFix && (
                            <div className="mt-2 p-2 bg-black/20 rounded text-[10px]">
                              <span className="text-yellow-500 font-medium">Fix: </span>
                              <span className="text-gray-300">{vuln.recommendation}</span>
                            </div>
                          )}
                          <EvidenceViewer evidence={vuln.evidence} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Fix Suggestion Panel */}
                    <AnimatePresence>
                      {showingFix && vuln.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2"
                        >
                          <FixSuggestionPanel 
                            checkId={vuln.id} 
                            checkName={vuln.name}
                            onClose={() => setSelectedFixId(null)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 bg-green-500/5 border border-green-500/20 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-400 font-medium text-sm">No vulnerabilities found</p>
                <p className="text-gray-500 text-xs mt-1">Your website passed all security checks</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
