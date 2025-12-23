'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Globe, Lock, Server, FileText, CheckCircle, AlertTriangle, XCircle, Clock, ExternalLink, Sparkles, Download, Tag } from 'lucide-react';
import AskAIPopup from './AskAIPopup';
import TagInput from '@/components/ui/TagInput';
import { generateScanPDF, downloadPDF, exportToJSON, exportToCSV, downloadJSON, downloadCSV } from '@/lib/pdfGenerator';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import type { StoredScanResult, ScanCheck } from '@/types/scan';

interface ScanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  scan: StoredScanResult | null;
  onScanUpdate?: (scanId: string, updatedScan: StoredScanResult) => void;
}

export default function ScanDetailModal({ isOpen, onClose, scan, onScanUpdate }: ScanDetailModalProps) {
  const { user } = useAuth();
  const [showAIPopup, setShowAIPopup] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<ScanCheck | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [tags, setTags] = useState<string[]>((scan as StoredScanResult & { tags?: string[] })?.tags || []);
  const [isSavingTags, setIsSavingTags] = useState(false);

  useEffect(() => {
    if (scan) {
      setTags((scan as StoredScanResult & { tags?: string[] })?.tags || []);
    }
  }, [scan]);

  const handleTagsChange = async (newTags: string[]) => {
    setTags(newTags);
    if (!scan?.id || !user?.uid) return;
    setIsSavingTags(true);
    try {
      const scanRef = doc(db, 'scans', scan.id);
      await updateDoc(scanRef, { tags: newTags.length > 0 ? newTags : null });
      const storageKey = `shieldscan_results_${user.uid}`;
      const existingHistory = localStorage.getItem(storageKey);
      if (existingHistory) {
        const history = JSON.parse(existingHistory) as StoredScanResult[];
        const updatedHistory = history.map(s => s.id === scan.id ? { ...s, tags: newTags } : s);
        localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
      }
      if (onScanUpdate && scan) {
        onScanUpdate(scan.id, { ...scan, tags: newTags } as StoredScanResult & { tags: string[] });
      }
    } catch (error) {
      console.error('Failed to save tags:', error);
    } finally {
      setIsSavingTags(false);
    }
  };

  const handleAskAI = (check: ScanCheck) => {
    setSelectedCheck(check);
    setShowAIPopup(true);
  };

  if (!isOpen || !scan) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DNS': return <Globe className="w-4 h-4 text-gray-400" />;
      case 'SSL/TLS': return <Lock className="w-4 h-4 text-gray-400" />;
      case 'Headers': return <Server className="w-4 h-4 text-gray-400" />;
      default: return <Shield className="w-4 h-4 text-gray-400" />;
    }
  };

  const scoreColor = scan.score >= 80 ? 'text-green-500' : scan.score >= 60 ? 'text-yellow-500' : 'text-red-500';
  const scoreBg = scan.score >= 80 ? 'bg-green-500/10' : scan.score >= 60 ? 'bg-yellow-500/10' : 'bg-red-500/10';
  const gradeBg = scan.grade.startsWith('A') ? 'bg-green-500/20 text-green-400' : scan.grade === 'B' ? 'bg-blue-500/20 text-blue-400' : scan.grade === 'C' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';

  const checksByCategory = scan.checks.reduce((acc, check) => {
    if (!acc[check.category]) acc[check.category] = [];
    acc[check.category].push(check);
    return acc;
  }, {} as Record<string, ScanCheck[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl max-h-[90vh] bg-dark-secondary border border-dark-accent rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-accent flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${scoreBg}`}>
              <span className={`text-xl font-bold font-mono ${scoreColor}`}>{scan.score}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-semibold">Scan Report</h2>
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${gradeBg}`}>{scan.grade}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Globe className="w-3 h-3" />
                <span className="font-mono">{scan.url}</span>
                <a href={scan.url} target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400">
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* JSON Export */}
            <button
              onClick={() => {
                const data = exportToJSON(scan);
                const filename = `shieldscan-${scan.url.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-')}.json`;
                downloadJSON(data, filename);
              }}
              className="px-2 py-1.5 bg-dark-accent text-gray-400 rounded-lg text-xs hover:bg-dark-primary hover:text-white"
              title="Export JSON"
            >
              JSON
            </button>
            {/* CSV Export */}
            <button
              onClick={() => {
                const data = exportToCSV(scan);
                const filename = `shieldscan-${scan.url.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-')}.csv`;
                downloadCSV(data, filename);
              }}
              className="px-2 py-1.5 bg-dark-accent text-gray-400 rounded-lg text-xs hover:bg-dark-primary hover:text-white"
              title="Export CSV"
            >
              CSV
            </button>
            {/* PDF Export */}
            <button
              onClick={async () => {
                setIsGeneratingPDF(true);
                try {
                  const blob = await generateScanPDF(scan, user?.profile?.plan);
                  const filename = `shieldscan-${scan.url.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`;
                  downloadPDF(blob, filename);
                } catch (error) {
                  console.error('Failed to generate PDF:', error);
                } finally {
                  setIsGeneratingPDF(false);
                }
              }}
              disabled={isGeneratingPDF}
              className="flex items-center gap-1.5 px-2 py-1.5 bg-dark-accent text-gray-300 rounded-lg text-xs hover:bg-dark-primary disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {isGeneratingPDF ? 'Generating...' : 'PDF'}
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-accent rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {/* Stats Row */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            <div className="bg-dark-primary border border-dark-accent rounded-lg p-3 text-center">
              <div className={`text-2xl font-bold font-mono ${scoreColor}`}>{scan.score}</div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
            <div className="bg-dark-primary border border-dark-accent rounded-lg p-3 text-center">
              <div className="text-2xl font-bold font-mono text-green-500">{scan.summary.passed}</div>
              <div className="text-xs text-gray-500">Passed</div>
            </div>
            <div className="bg-dark-primary border border-dark-accent rounded-lg p-3 text-center">
              <div className="text-2xl font-bold font-mono text-yellow-500">{scan.summary.warnings}</div>
              <div className="text-xs text-gray-500">Warnings</div>
            </div>
            <div className="bg-dark-primary border border-dark-accent rounded-lg p-3 text-center">
              <div className="text-2xl font-bold font-mono text-red-500">{scan.summary.failed}</div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
            <div className="bg-dark-primary border border-dark-accent rounded-lg p-3 text-center">
              <div className="text-2xl font-bold font-mono text-gray-400">{scan.scanDuration}ms</div>
              <div className="text-xs text-gray-500">Duration</div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(scan.timestamp).toLocaleString()}
            </div>
            {scan.server?.technology && scan.server.technology.length > 0 && (
              <div className="flex items-center gap-1">
                <Server className="w-3 h-3" />
                {scan.server.technology.join(', ')}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1.5 block">Tags</label>
            <TagInput tags={tags} onChange={handleTagsChange} placeholder="Add tags..." maxTags={10} />
            {isSavingTags && <p className="text-xs text-gray-600 mt-1">Saving...</p>}
          </div>

          {/* Vulnerabilities */}
          {scan.vulnerabilities && scan.vulnerabilities.length > 0 && (
            <div className="mb-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
              <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Security Issues ({scan.vulnerabilities.length})
              </h3>
              <div className="space-y-2">
                {scan.vulnerabilities.map((vuln, idx) => (
                  <div key={idx} className="group flex items-start gap-2 p-2 bg-dark-primary/50 rounded-lg hover:bg-dark-primary transition-colors relative">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm">{vuln.type}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded uppercase ${
                          vuln.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          vuln.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>{vuln.severity}</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">{vuln.details}</p>
                    </div>
                    <button
                      onClick={() => handleAskAI({ id: `vuln-${idx}`, name: vuln.type, category: 'Vulnerability', status: 'failed', message: vuln.details, severity: vuln.severity })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-dark-accent text-gray-400 hover:text-white rounded text-xs flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />AI
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checks by Category - All Expanded */}
          {Object.entries(checksByCategory).map(([category, checks]) => (
            <div key={category} className="mb-4">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                {getCategoryIcon(category)}
                {category}
                <span className="text-gray-500 font-normal">({checks.length})</span>
                <div className="flex items-center gap-2 ml-auto text-xs">
                  <span className="text-green-500">{checks.filter(c => c.status === 'passed').length}✓</span>
                  <span className="text-yellow-500">{checks.filter(c => c.status === 'warning').length}⚠</span>
                  <span className="text-red-500">{checks.filter(c => c.status === 'failed').length}✗</span>
                </div>
              </h3>
              <div className="space-y-1">
                {checks.map((check, idx) => (
                  <div key={idx} className="group flex items-start gap-3 p-3 bg-dark-primary border border-dark-accent rounded-lg hover:border-gray-600 transition-colors relative">
                    <div className="flex-shrink-0 mt-0.5">{getStatusIcon(check.status)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm">{check.name}</h4>
                      <p className="text-gray-400 text-xs">{check.message}</p>
                      {check.details && <p className="text-gray-500 text-xs mt-1 italic">{check.details}</p>}
                    </div>
                    <button
                      onClick={() => handleAskAI(check)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-dark-accent text-gray-400 hover:text-white rounded text-xs flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />AI
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* SSL Details */}
          {scan.ssl && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400" />
                SSL Certificate
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-dark-primary border border-dark-accent rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-0.5">Issuer</div>
                  <div className="text-white text-sm truncate">{scan.ssl.issuer || 'Unknown'}</div>
                </div>
                <div className="bg-dark-primary border border-dark-accent rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-0.5">Protocol</div>
                  <div className="text-white text-sm">{scan.ssl.protocol || 'Unknown'}</div>
                </div>
                <div className="bg-dark-primary border border-dark-accent rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-0.5">Valid Until</div>
                  <div className="text-white text-sm">{scan.ssl.validTo || 'Unknown'}</div>
                </div>
                <div className="bg-dark-primary border border-dark-accent rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-0.5">Days Until Expiry</div>
                  <div className={`text-sm ${scan.ssl.daysUntilExpiry < 30 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {scan.ssl.daysUntilExpiry} days
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DNS Details */}
          {scan.dns && scan.dns.resolved && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                DNS Information
              </h3>
              <div className="bg-dark-primary border border-dark-accent rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-2">IP Addresses</div>
                <div className="flex flex-wrap gap-2">
                  {scan.dns.ipAddresses.map((ip, idx) => (
                    <span key={idx} className="px-2 py-1 bg-dark-accent rounded text-green-400 font-mono text-xs">
                      {ip}
                    </span>
                  ))}
                </div>
                {scan.dns.hasCDN && (
                  <div className="mt-3 pt-3 border-t border-dark-accent">
                    <div className="text-xs text-gray-500 mb-1">CDN Provider</div>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                      {scan.dns.cdnProvider}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Raw Headers */}
          {scan.headers && Object.keys(scan.headers.raw).length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Server className="w-4 h-4 text-gray-400" />
                Response Headers
              </h3>
              <div className="bg-dark-primary border border-dark-accent rounded-lg p-3 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="font-mono text-xs space-y-1">
                  {Object.entries(scan.headers.raw).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-cyan-400">{key}:</span>
                      <span className="text-gray-400 ml-2">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-dark-accent flex-shrink-0">
          <button onClick={onClose} className="w-full py-2 bg-dark-accent text-white rounded-lg text-sm hover:bg-dark-primary transition-colors">
            Close
          </button>
        </div>
      </div>

      {/* Ask AI Popup */}
      <AskAIPopup
        isOpen={showAIPopup}
        onClose={() => { setShowAIPopup(false); setSelectedCheck(null); }}
        checkData={selectedCheck}
        scanContext={{ url: scan.url, score: scan.score, grade: scan.grade, summary: scan.summary, technologies: scan.server?.technology }}
      />
    </div>
  );
}
