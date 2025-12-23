'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Globe, Clock, CheckCircle, AlertTriangle, XCircle, 
  Search, Tag, Eye, Trash2
} from 'lucide-react';
import type { StoredScanResult } from '@/types/scan';

interface ReportsViewProps {
  scans: StoredScanResult[];
  onSelectScan: (scan: StoredScanResult) => void;
  onDeleteScan?: (scanId: string) => void;
}

type SortField = 'date' | 'score';
type SortOrder = 'asc' | 'desc';

export default function ReportsView({ scans, onSelectScan, onDeleteScan }: ReportsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Get all unique tags
  const allTags = Array.from(new Set(scans.flatMap(scan => scan.tags || []))).sort();

  // Filter and sort scans
  const filteredScans = scans
    .filter(scan => {
      const matchesSearch = scan.url.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag === 'all' || (scan.tags || []).includes(selectedTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          break;
        case 'score':
          comparison = b.score - a.score;
          break;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getGradeBg = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-500/20 text-green-400';
    if (grade === 'B') return 'bg-gray-500/20 text-gray-300';
    if (grade === 'C') return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            Scan Reports
          </h2>
          <p className="text-gray-500 text-xs">{scans.length} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search URL..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-900/30 border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 text-xs"
          />
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-2 py-1.5 bg-gray-900/30 border border-gray-800 rounded text-white text-xs focus:outline-none"
          >
            <option value="all">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        )}

        {/* Sort */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleSort('date')}
            className={`px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${
              sortField === 'date' 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-500 hover:text-white'
            }`}
          >
            Date {sortField === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            onClick={() => toggleSort('score')}
            className={`px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${
              sortField === 'score' 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-500 hover:text-white'
            }`}
          >
            Score {sortField === 'score' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
        </div>
      </div>

      {/* Reports List */}
      {filteredScans.length === 0 ? (
        <div className="text-center py-8 bg-gray-900/20 border border-gray-800/50 rounded-lg">
          <FileText className="w-10 h-10 text-gray-700 mx-auto mb-2" />
          <p className="text-gray-500 text-xs">
            {scans.length === 0 ? 'No scan reports yet' : 'No matching reports'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredScans.map((scan, index) => (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="bg-gray-900/20 border border-gray-800/50 rounded-lg p-3 hover:border-gray-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                {/* Score */}
                <div className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${
                  scan.score >= 80 ? 'bg-green-500/10' : scan.score >= 60 ? 'bg-yellow-500/10' : 'bg-red-500/10'
                }`}>
                  <span className={`text-sm font-bold ${getScoreColor(scan.score)}`}>{scan.score}</span>
                  <span className={`text-[9px] font-medium ${getGradeBg(scan.grade)} px-1 rounded`}>{scan.grade}</span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Globe className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <span className="text-white font-mono text-xs truncate">{scan.url}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-gray-500">
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(scan.timestamp).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <CheckCircle className="w-2.5 h-2.5 text-green-500" />
                      {scan.summary.passed}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5 text-yellow-500" />
                      {scan.summary.warnings}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <XCircle className="w-2.5 h-2.5 text-red-500" />
                      {scan.summary.failed}
                    </span>
                  </div>
                  {scan.tags && scan.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {scan.tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-1 py-0.5 bg-gray-800 text-gray-400 rounded text-[9px] flex items-center gap-0.5">
                          <Tag className="w-2 h-2" />{tag}
                        </span>
                      ))}
                      {scan.tags.length > 2 && (
                        <span className="text-[9px] text-gray-600">+{scan.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => onSelectScan(scan)}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-800 text-gray-300 rounded text-[10px] font-medium hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </button>
                  {onDeleteScan && (
                    <button
                      onClick={() => onDeleteScan(scan.id)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
