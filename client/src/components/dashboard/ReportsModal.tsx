'use client';

import { useState, useMemo } from 'react';
import { X, Shield, Clock, FileText, Globe, ChevronRight, Tag, Filter } from 'lucide-react';
import type { StoredScanResult } from '@/types/scan';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scans: StoredScanResult[];
  onSelectScan: (scan: StoredScanResult) => void;
  activeTagFilter?: string;
}

export default function ReportsModal({ isOpen, onClose, scans, onSelectScan, activeTagFilter: initialTagFilter }: ReportsModalProps) {
  const [selectedTag, setSelectedTag] = useState<string>(initialTagFilter || 'all');
  
  // Get all unique tags from scans
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    scans.forEach(scan => (scan.tags || []).forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [scans]);

  // Filter scans based on selected tag
  const filteredScans = useMemo(() => {
    if (selectedTag === 'all') return scans;
    return scans.filter(scan => scan.tags?.includes(selectedTag));
  }, [scans, selectedTag]);

  if (!isOpen) return null;

  const getScoreColor = (score: number) => score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
  const getScoreBg = (score: number) => score >= 80 ? 'bg-green-500/10' : score >= 60 ? 'bg-yellow-500/10' : 'bg-red-500/10';
  const getGradeBg = (grade: string) => grade.startsWith('A') ? 'bg-green-500/20 text-green-400' : grade === 'B' ? 'bg-blue-500/20 text-blue-400' : grade === 'C' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';

  const avgScore = filteredScans.length > 0 ? Math.round(filteredScans.reduce((sum, s) => sum + s.score, 0) / filteredScans.length) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />

      <div className="relative w-full max-w-5xl max-h-[90vh] bg-dark-secondary border border-dark-accent rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-accent flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-400" />
            <div>
              <h2 className="text-white font-semibold">Scan Reports</h2>
              <p className="text-xs text-gray-500">
                {filteredScans.length} report{filteredScans.length !== 1 ? 's' : ''}
                {selectedTag !== 'all' && <span className="ml-1 text-yellow-500">• {selectedTag}</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-accent rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="px-4 py-3 border-b border-dark-accent flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-500" />
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  selectedTag === 'all' 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-dark-accent text-gray-400 hover:text-white'
                }`}
              >
                All ({scans.length})
              </button>
              {allTags.map(tag => {
                const count = scans.filter(s => s.tags?.includes(tag)).length;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                      selectedTag === tag 
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                        : 'bg-dark-accent text-gray-400 hover:text-white'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    {tag} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filteredScans.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 mb-1">
                {selectedTag !== 'all' ? `No reports with tag "${selectedTag}"` : 'No reports yet'}
              </p>
              {selectedTag !== 'all' ? (
                <button onClick={() => setSelectedTag('all')} className="text-sm text-yellow-500 hover:text-yellow-400">
                  Show all reports
                </button>
              ) : (
                <>
                  <p className="text-gray-600 text-sm mb-4">Start scanning to generate reports</p>
                  <button onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600">
                    Start Scanning
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-dark-accent">
              {filteredScans.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => onSelectScan(scan)}
                  className="p-3 hover:bg-dark-primary/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Score */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getScoreBg(scan.score)}`}>
                        <span className={`text-sm font-bold font-mono ${getScoreColor(scan.score)}`}>{scan.score}</span>
                      </div>
                      
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3 text-gray-500 flex-shrink-0" />
                          <span className="text-white text-sm font-mono truncate">{scan.url}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0 ${getGradeBg(scan.grade)}`}>{scan.grade}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(scan.timestamp).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-green-500">{scan.summary.passed}✓</span>
                          <span className="text-xs text-yellow-500">{scan.summary.warnings}⚠</span>
                          <span className="text-xs text-red-500">{scan.summary.failed}✗</span>
                        </div>
                        {scan.tags && scan.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {scan.tags.slice(0, 3).map((tag, idx) => (
                              <span 
                                key={idx} 
                                onClick={(e) => { e.stopPropagation(); setSelectedTag(tag); }}
                                className={`px-1.5 py-0.5 rounded text-xs flex items-center gap-0.5 cursor-pointer ${
                                  selectedTag === tag 
                                    ? 'bg-yellow-500/20 text-yellow-400' 
                                    : 'bg-dark-accent text-gray-400 hover:text-gray-300'
                                }`}
                              >
                                <Tag className="w-2.5 h-2.5" />{tag}
                              </span>
                            ))}
                            {scan.tags.length > 3 && <span className="text-xs text-gray-600">+{scan.tags.length - 3}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredScans.length > 0 && (
          <div className="p-3 border-t border-dark-accent flex-shrink-0">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4 text-gray-500">
                <span>Avg: <span className={`font-semibold ${getScoreColor(avgScore)}`}>{avgScore}</span></span>
                <span>Total: <span className="text-gray-300">{filteredScans.length}</span></span>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
