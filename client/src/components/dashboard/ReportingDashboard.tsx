'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Calendar, Clock, ChevronRight, Plus,
  Eye, Share2, Trash2, BarChart3, TrendingUp, Shield, AlertTriangle
} from 'lucide-react';
import {
  getSavedReports, generateReportData, exportReportAsPDF, exportReportAsJSON,
  REPORT_TEMPLATES, getScheduledReports,
  type ExecutiveReport, type ReportType, type ReportTemplate
} from '@/lib/reporting';

export default function ReportingDashboard() {
  const [reports, setReports] = useState<ExecutiveReport[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ExecutiveReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setReports(getSavedReports());
  }, []);

  const refreshReports = () => {
    setReports(getSavedReports());
  };

  const handleGenerate = async (type: ReportType) => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate generation
    const report = generateReportData(type);
    refreshReports();
    setSelectedReport(report);
    setIsGenerating(false);
    setShowGenerateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <FileText className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Reports</h2>
            <p className="text-sm text-gray-500">Generate executive reports and track trends</p>
          </div>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500"
        >
          <Plus className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          icon={FileText} 
          label="Total Reports" 
          value={reports.length.toString()} 
          color="indigo"
        />
        <StatCard 
          icon={Calendar} 
          label="This Month" 
          value={reports.filter(r => new Date(r.generatedAt).getMonth() === new Date().getMonth()).length.toString()} 
          color="blue"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Avg Score" 
          value={reports.length > 0 
            ? Math.round(reports.reduce((sum, r) => sum + r.summary.overallScore, 0) / reports.length).toString() 
            : '—'
          } 
          color="green"
        />
        <StatCard 
          icon={AlertTriangle} 
          label="Open Actions" 
          value={reports.reduce((sum, r) => sum + r.summary.criticalActions.length, 0).toString()} 
          color="orange"
        />
      </div>

      {/* Report templates */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Generate</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {REPORT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleGenerate(template.type)}
              disabled={isGenerating}
              className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800/50 hover:border-gray-700 transition-colors text-left disabled:opacity-50"
            >
              <div className="text-2xl mb-2">
                {template.type === 'executive_summary' ? '📊' :
                 template.type === 'security_posture' ? '🛡️' :
                 template.type === 'compliance_audit' ? '✅' :
                 template.type === 'vulnerability_assessment' ? '🔍' :
                 '📈'}
              </div>
              <div className="text-sm font-medium text-white">{template.name}</div>
              <div className="text-[10px] text-gray-500 mt-1">{template.audience}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent reports */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-medium text-white">Recent Reports</h3>
          <span className="text-xs text-gray-500">{reports.length} total</span>
        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No reports generated yet</p>
            <p className="text-xs text-gray-600 mt-1">Generate your first report to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {reports.slice(0, 10).map((report) => (
              <ReportRow 
                key={report.id} 
                report={report} 
                onView={() => setSelectedReport(report)}
                onExportPDF={() => exportReportAsPDF(report)}
                onExportJSON={() => exportReportAsJSON(report)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Generate modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <GenerateReportModal
            onClose={() => setShowGenerateModal(false)}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        )}
      </AnimatePresence>

      {/* Report viewer */}
      <AnimatePresence>
        {selectedReport && (
          <ReportViewer
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onExportPDF={() => exportReportAsPDF(selectedReport)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// STAT CARD
// ==========================================

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  color: string;
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-400',
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    orange: 'bg-orange-500/10 text-orange-400',
  };

  return (
    <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs text-gray-500">{label}</div>
          <div className="text-xl font-bold text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// REPORT ROW
// ==========================================

function ReportRow({ 
  report, 
  onView,
  onExportPDF,
  onExportJSON
}: { 
  report: ExecutiveReport;
  onView: () => void;
  onExportPDF: () => void;
  onExportJSON: () => void;
}) {
  const scoreColor = report.summary.overallScore >= 80 
    ? 'text-green-400' 
    : report.summary.overallScore >= 60 
    ? 'text-yellow-400' 
    : 'text-red-400';

  return (
    <div className="p-4 flex items-center gap-4 hover:bg-gray-800/30">
      <div className="p-2 rounded-lg bg-indigo-500/10">
        <FileText className="w-5 h-5 text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{report.title}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-medium ${
            report.metadata.confidentiality === 'confidential' 
              ? 'bg-red-500/20 text-red-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {report.metadata.confidentiality}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
          <Clock className="w-3 h-3" />
          {new Date(report.generatedAt).toLocaleDateString()}
          <span>•</span>
          <span className={scoreColor}>Score: {report.summary.overallScore}</span>
          <span>•</span>
          <span>{report.summary.keyFindings.length} findings</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onView}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={onExportPDF}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
          title="Export PDF"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={onExportJSON}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
          title="Export JSON"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// GENERATE REPORT MODAL
// ==========================================

function GenerateReportModal({
  onClose,
  onGenerate,
  isGenerating,
}: {
  onClose: () => void;
  onGenerate: (type: ReportType) => void;
  isGenerating: boolean;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">Generate Report</h3>
          <p className="text-sm text-gray-500">Choose a template to create your report</p>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {REPORT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-4 rounded-xl border text-left transition-colors ${
                selectedTemplate === template.id
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-gray-800 hover:border-gray-700 bg-gray-900/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {template.type === 'executive_summary' ? '📊' :
                   template.type === 'security_posture' ? '🛡️' :
                   template.type === 'compliance_audit' ? '✅' :
                   template.type === 'vulnerability_assessment' ? '🔍' :
                   '📈'}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{template.description}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded text-[10px]">
                      {template.audience}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {template.sections.length} sections
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const template = REPORT_TEMPLATES.find(t => t.id === selectedTemplate);
              if (template) onGenerate(template.type);
            }}
            disabled={!selectedTemplate || isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// REPORT VIEWER
// ==========================================

function ReportViewer({
  report,
  onClose,
  onExportPDF,
}: {
  report: ExecutiveReport;
  onClose: () => void;
  onExportPDF: () => void;
}) {
  const scoreColor = report.summary.overallScore >= 80 
    ? 'text-green-400 bg-green-500/10' 
    : report.summary.overallScore >= 60 
    ? 'text-yellow-400 bg-yellow-500/10' 
    : 'text-red-400 bg-red-500/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 p-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-semibold text-white">{report.title}</h3>
            <div className="text-xs text-gray-500">
              Generated {new Date(report.generatedAt).toLocaleDateString()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onExportPDF}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded text-sm hover:bg-indigo-500/20"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Score card */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Security Score</div>
                <div className={`text-5xl font-bold ${scoreColor.split(' ')[0]}`}>
                  {report.summary.overallScore}
                  <span className="text-xl text-gray-500">/100</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {report.summary.scoreTrend === 'improving' ? '↑' : report.summary.scoreTrend === 'degrading' ? '↓' : '→'}
                  {' '}{report.summary.headline}
                </div>
              </div>
              <div className={`px-4 py-2 rounded-lg ${scoreColor}`}>
                <div className="text-sm font-medium uppercase">{report.summary.riskLevel} Risk</div>
              </div>
            </div>
          </div>

          {/* Key findings */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Key Findings</h4>
            <div className="space-y-2">
              {report.summary.keyFindings.map((finding, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400">{finding}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Critical actions */}
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Critical Actions Required
            </h4>
            <div className="space-y-2">
              {report.summary.criticalActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-400">•</span>
                  <span className="text-gray-400">{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Report sections */}
          {report.sections.map((section) => (
            <div key={section.id} className="border-t border-gray-800 pt-6">
              <h4 className="text-sm font-medium text-white mb-3">{section.title}</h4>
              
              {section.type === 'table' && section.content.headers && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {section.content.headers.map((header: string, i: number) => (
                          <th key={i} className="text-left py-2 px-3 text-gray-400 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.content.rows.map((row: string[], i: number) => (
                        <tr key={i} className="border-b border-gray-800/50">
                          {row.map((cell, j) => (
                            <td key={j} className="py-2 px-3 text-gray-300">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {section.type === 'findings' && section.content.findings && (
                <div className="space-y-3">
                  {section.content.findings.map((finding: any, i: number) => (
                    <div key={i} className={`p-3 rounded-lg border-l-4 ${
                      finding.severity === 'critical' ? 'border-red-500 bg-red-500/5' :
                      finding.severity === 'high' ? 'border-orange-500 bg-orange-500/5' :
                      'border-yellow-500 bg-yellow-500/5'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{finding.title}</span>
                        <span className={`text-[10px] uppercase font-medium px-1.5 py-0.5 rounded ${
                          finding.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          finding.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {finding.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{finding.description}</p>
                      <div className="mt-2 text-xs">
                        <span className="text-gray-500">Impact:</span> <span className="text-gray-400">{finding.impact}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-500">Fix:</span> <span className="text-gray-400">{finding.recommendation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

