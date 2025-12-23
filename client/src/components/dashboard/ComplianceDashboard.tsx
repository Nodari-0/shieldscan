'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Check, X, AlertTriangle, ChevronRight, ChevronDown,
  FileText, Download, RefreshCw, Info, ExternalLink, Clock
} from 'lucide-react';
import {
  COMPLIANCE_FRAMEWORKS, getAllComplianceSummaries, getOverallComplianceScore,
  mapScanToCompliance, generateComplianceReport,
  type ComplianceFramework, type ComplianceStatus, type ComplianceGap
} from '@/lib/compliance';

export default function ComplianceDashboard() {
  const [summaries, setSummaries] = useState<Array<{ framework: ComplianceFramework; status: ComplianceStatus | null }>>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSummaries(getAllComplianceSummaries());
    setOverallScore(getOverallComplianceScore());
  };

  const runAssessment = async (frameworkId: string) => {
    setIsAssessing(true);
    
    // Simulate getting scan results (in production, this would use real scan data)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockResults = [
      { id: 'tls_version', status: 'passed' as const, name: 'TLS 1.3 Supported' },
      { id: 'hsts', status: 'passed' as const, name: 'HSTS Enabled' },
      { id: 'csp', status: 'warning' as const, name: 'CSP Present' },
      { id: 'xss', status: 'passed' as const, name: 'XSS Protection' },
      { id: 'sql_injection', status: 'passed' as const, name: 'SQL Injection Safe' },
      { id: 'x_frame_options', status: 'failed' as const, name: 'X-Frame-Options Missing' },
      { id: 'cookie_security', status: 'warning' as const, name: 'Cookie Security' },
      { id: 'https_redirect', status: 'passed' as const, name: 'HTTPS Redirect' },
    ];

    mapScanToCompliance(frameworkId, mockResults);
    loadData();
    setIsAssessing(false);
  };

  const selectedData = selectedFramework 
    ? summaries.find(s => s.framework.id === selectedFramework) 
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Compliance Center</h2>
            <p className="text-sm text-gray-500">Map your security to industry frameworks</p>
          </div>
        </div>
        
        {/* Overall score */}
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="text-right">
            <div className="text-xs text-gray-500">Overall Compliance</div>
            <div className={`text-2xl font-bold ${
              overallScore >= 80 ? 'text-green-400' :
              overallScore >= 50 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {overallScore}%
            </div>
          </div>
        </div>
      </div>

      {/* Framework cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaries.map(({ framework, status }) => (
          <motion.div
            key={framework.id}
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl border bg-gray-900/50 overflow-hidden cursor-pointer transition-colors ${
              selectedFramework === framework.id 
                ? 'border-purple-500' 
                : 'border-gray-800 hover:border-gray-700'
            }`}
            onClick={() => setSelectedFramework(
              selectedFramework === framework.id ? null : framework.id
            )}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{framework.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white">{framework.shortName}</h3>
                    <p className="text-[10px] text-gray-500">{framework.version}</p>
                  </div>
                </div>
                {status && (
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    status.overallScore >= 80 ? 'bg-green-500/10 text-green-400' :
                    status.overallScore >= 50 ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {status.overallScore}%
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{framework.description}</p>
              
              {status ? (
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 text-green-400">
                    <Check className="w-3 h-3" />
                    {status.controlStatuses.filter(c => c.status === 'compliant').length}
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <AlertTriangle className="w-3 h-3" />
                    {status.controlStatuses.filter(c => c.status === 'partial').length}
                  </div>
                  <div className="flex items-center gap-1 text-red-400">
                    <X className="w-3 h-3" />
                    {status.controlStatuses.filter(c => c.status === 'non_compliant').length}
                  </div>
                  <div className="text-gray-600 ml-auto">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(status.lastAssessed).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); runAssessment(framework.id); }}
                  disabled={isAssessing}
                  className="w-full py-2 bg-purple-500/10 text-purple-400 rounded text-xs font-medium hover:bg-purple-500/20 disabled:opacity-50"
                >
                  {isAssessing ? 'Assessing...' : 'Run Assessment'}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected framework details */}
      <AnimatePresence>
        {selectedData && selectedData.status && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <FrameworkDetails 
              framework={selectedData.framework} 
              status={selectedData.status}
              onReassess={() => runAssessment(selectedData.framework.id)}
              isAssessing={isAssessing}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// FRAMEWORK DETAILS
// ==========================================

function FrameworkDetails({ 
  framework, 
  status,
  onReassess,
  isAssessing
}: { 
  framework: ComplianceFramework;
  status: ComplianceStatus;
  onReassess: () => void;
  isAssessing: boolean;
}) {
  const [expandedControl, setExpandedControl] = useState<string | null>(null);

  const handleExportReport = () => {
    const report = generateComplianceReport(framework.id);
    if (report) {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${framework.shortName}_compliance_report.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{framework.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-white">{framework.name}</h3>
            <p className="text-xs text-gray-500">
              {status.controlStatuses.length} controls • Last assessed {new Date(status.lastAssessed).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReassess}
            disabled={isAssessing}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAssessing ? 'animate-spin' : ''}`} />
            Reassess
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded text-sm hover:bg-purple-500/20"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Gaps summary */}
      {status.gaps.length > 0 && (
        <div className="p-4 bg-red-500/5 border-b border-gray-800">
          <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {status.gaps.length} Compliance Gaps Found
          </h4>
          <div className="space-y-2">
            {status.gaps.slice(0, 3).map((gap) => (
              <div key={gap.controlId} className="flex items-start gap-2 text-xs">
                <span className={`px-1.5 py-0.5 rounded uppercase font-medium ${
                  gap.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                  gap.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {gap.severity}
                </span>
                <span className="text-gray-400">{gap.controlName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls list */}
      <div className="divide-y divide-gray-800">
        {framework.controls.map((control) => {
          const controlStatus = status.controlStatuses.find(c => c.controlId === control.id);
          const isExpanded = expandedControl === control.id;

          const statusConfig = {
            compliant: { icon: Check, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Compliant' },
            partial: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Partial' },
            non_compliant: { icon: X, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Non-Compliant' },
            not_assessed: { icon: Info, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Not Assessed' },
          };

          const config = statusConfig[controlStatus?.status || 'not_assessed'];
          const StatusIcon = config.icon;

          return (
            <div key={control.id}>
              <button
                className="w-full p-4 flex items-center gap-4 hover:bg-gray-800/30 text-left"
                onClick={() => setExpandedControl(isExpanded ? null : control.id)}
              >
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <StatusIcon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-mono">{control.code}</span>
                    <span className="text-sm font-medium text-white">{control.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{control.description}</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-medium ${config.bg} ${config.color}`}>
                  {config.label}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pl-16 space-y-3">
                      {/* Requirements */}
                      <div>
                        <h5 className="text-xs text-gray-500 mb-1">Requirements</h5>
                        <ul className="space-y-1">
                          {control.requirements.map((req, i) => (
                            <li key={i} className="text-xs text-gray-400 flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-gray-600" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Evidence */}
                      {controlStatus?.evidence && controlStatus.evidence.length > 0 && (
                        <div>
                          <h5 className="text-xs text-green-400 mb-1">✓ Evidence</h5>
                          <div className="flex flex-wrap gap-1">
                            {controlStatus.evidence.map((e, i) => (
                              <span key={i} className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-xs">
                                {e}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Findings */}
                      {controlStatus?.findings && controlStatus.findings.length > 0 && (
                        <div>
                          <h5 className="text-xs text-red-400 mb-1">✗ Findings</h5>
                          <div className="flex flex-wrap gap-1">
                            {controlStatus.findings.map((f, i) => (
                              <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// COMPLIANCE BADGE (for other components)
// ==========================================

export function ComplianceBadge({ frameworkId }: { frameworkId: string }) {
  const [score, setScore] = useState<number | null>(null);
  
  useEffect(() => {
    const summaries = getAllComplianceSummaries();
    const summary = summaries.find(s => s.framework.id === frameworkId);
    if (summary?.status) {
      setScore(summary.status.overallScore);
    }
  }, [frameworkId]);

  if (score === null) return null;

  const framework = COMPLIANCE_FRAMEWORKS.find(f => f.id === frameworkId);
  if (!framework) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
      score >= 80 ? 'bg-green-500/10 text-green-400' :
      score >= 50 ? 'bg-yellow-500/10 text-yellow-400' :
      'bg-red-500/10 text-red-400'
    }`}>
      <span>{framework.icon}</span>
      <span>{framework.shortName}</span>
      <span>{score}%</span>
    </div>
  );
}

